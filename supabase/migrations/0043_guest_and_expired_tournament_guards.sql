-- Не дозволяємо реєстрацію за простроченим турнірним посиланням.
-- Статус повертається разом з датами, щоб клієнт показував правильний екран.

create or replace function public.rps_tournament_info(p_tournament_id bigint)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_result jsonb;
begin
  perform public.rps_auto_update_tournaments();

  select jsonb_build_object(
    'id', id,
    'name', name,
    'description', description,
    'prepay_coins', prepay_coins,
    'date', date,
    'end_date', end_date,
    'status', case
      when status = 'finished' or (end_date is not null and end_date <= now()) then 'finished'
      else status
    end
  ) into v_result
  from public.rps_tournaments
  where id = p_tournament_id;

  return v_result;
end; $function$;

create or replace function public.rps_tournament_join(
  p_player_id uuid, p_tournament_id bigint
) returns text language plpgsql security definer set search_path to 'public' as $function$
declare
  v_prepay int;
  v_balance int;
  v_invite_id bigint;
  v_status text;
  v_tournament_status text;
  v_end_date timestamptz;
begin
  perform public.rps_auto_update_tournaments();

  select prepay_coins, status, end_date
    into v_prepay, v_tournament_status, v_end_date
  from public.rps_tournaments
  where id = p_tournament_id
  for update;

  if not found then return 'tournament_not_found'; end if;
  if v_tournament_status = 'finished' or (v_end_date is not null and v_end_date <= now()) then
    return 'tournament_finished';
  end if;

  select balance into v_balance
  from public.rps_profiles
  where id = p_player_id;
  if not found then return 'player_not_found'; end if;

  select id, status into v_invite_id, v_status
  from public.rps_tournament_invites
  where tournament_id = p_tournament_id and player_id = p_player_id;

  if found then
    if v_status = 'yes' then return 'already_joined'; end if;
  else
    insert into public.rps_tournament_invites(tournament_id, player_id, status)
      values (p_tournament_id, p_player_id, 'pending')
      returning id into v_invite_id;
  end if;

  if v_prepay > 0 then
    if v_balance < v_prepay then return 'insufficient'; end if;
    update public.rps_profiles
      set balance = balance - v_prepay
      where id = p_player_id;
  end if;

  update public.rps_tournament_invites
    set status = 'yes', responded_at = now(), tournament_balance = v_prepay
    where id = v_invite_id;

  return 'ok';
end; $function$;

grant execute on function public.rps_tournament_info(bigint) to anon, authenticated;
grant execute on function public.rps_tournament_join(uuid,bigint) to anon, authenticated;

notify pgrst, 'reload schema';
