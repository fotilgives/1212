-- =============================================================================
-- Телефон при обміні монет на приз
-- =============================================================================
-- Проблема: гість (без пошти) міг оформити приз — і з ним не було як звʼязатися.
-- Рішення: при обміні просимо номер телефону. Він зберігається у заявці
-- (rps_redemptions.phone) та у профілі (rps_profiles.phone) — щоб наступного
-- разу підставити автоматично, а адмін бачив контакт у панелі «Заявки».
-- =============================================================================

alter table public.rps_redemptions add column if not exists phone text;
alter table public.rps_profiles    add column if not exists phone text;

-- Обмін призу з телефоном. Стара 4-аргументна версія лишається (сумісність зі
-- старим кешем клієнта), але просто делегує сюди з порожнім телефоном.
create or replace function public.rps_redeem(
  p_id uuid, p_nick text, p_reward text, p_cost integer, p_phone text
)
returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare bal int; v_code text; v_phone text;
begin
  if p_cost <= 0 then raise exception 'bad cost'; end if;
  v_phone := nullif(btrim(coalesce(p_phone, '')), '');
  if v_phone is not null and length(regexp_replace(v_phone, '\D', '', 'g')) < 9 then
    raise exception 'bad phone';
  end if;

  perform rps_register(p_id, p_nick);
  select balance into bal from rps_profiles where id = p_id for update;
  if bal < p_cost then raise exception 'insufficient balance'; end if;
  update rps_profiles set balance = balance - p_cost where id = p_id;

  -- Запамʼятовуємо телефон у профілі — підставимо його наступного разу.
  if v_phone is not null then
    update rps_profiles set phone = v_phone where id = p_id;
  end if;

  v_code := 'RP-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
  insert into rps_redemptions(player_id, nickname, reward, cost, code, phone)
    values (p_id, p_nick, p_reward, p_cost, v_code, coalesce(v_phone, (select phone from rps_profiles where id = p_id)));
  perform rps_touch_activity(p_id);
  return jsonb_build_object('balance', bal - p_cost, 'code', v_code, 'phone', v_phone);
end; $function$;

create or replace function public.rps_redeem(p_id uuid, p_nick text, p_reward text, p_cost integer)
returns jsonb language sql security definer set search_path to 'public'
as $function$ select public.rps_redeem(p_id, p_nick, p_reward, p_cost, null::text) $function$;

-- Телефон гравця — для серверних сповіщень (аналог rps_player_email).
create or replace function public.rps_player_phone(p_id uuid)
returns text language sql security definer set search_path to 'public'
as $function$ select phone from public.rps_profiles where id = p_id $function$;

-- Адмін: показуємо телефон у списку заявок (з профілю, якщо у заявці порожньо).
create or replace function public.rps_admin_redemptions(p_token uuid)
 returns setof jsonb language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  return query
    select jsonb_build_object(
      'id', r.id, 'nick', r.nickname, 'reward', r.reward, 'cost', r.cost,
      'status', coalesce(r.status, 'pending'), 'created', r.created_at,
      'email', a.email, 'phone', coalesce(r.phone, p.phone)
    )
    from rps_redemptions r
    left join rps_accounts a on a.id = r.player_id
    left join rps_profiles p on p.id = r.player_id
    order by r.created_at desc;
end; $function$;

grant execute on function public.rps_redeem(uuid, text, text, integer, text) to anon, authenticated;
grant execute on function public.rps_redeem(uuid, text, text, integer)       to anon, authenticated;
grant execute on function public.rps_player_phone(uuid)                      to anon, authenticated;
grant execute on function public.rps_admin_redemptions(uuid)                 to anon, authenticated;

notify pgrst, 'reload schema';
