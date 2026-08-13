-- Швидке видалення користувачів і справжня скринька турнірних запрошень.

create index if not exists rps_bets_player_id_idx
  on public.rps_bets(player_id);

create index if not exists rps_secret_player_id_idx
  on public.rps_secret(player_id);

create index if not exists rps_reviews_player_id_idx
  on public.rps_reviews(player_id);

create index if not exists rps_admin_sessions_account_id_idx
  on public.rps_admin_sessions(account_id);

create or replace function public.rps_admin_delete_user(p_token uuid, p_player uuid)
returns void language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  if exists (select 1 from public.rps_accounts where id = p_player and is_admin) then
    raise exception 'admin_account_protected';
  end if;

  -- Видалення великої історії тепер використовує індекси, а не повний scan.
  perform set_config('statement_timeout', '55s', true);
  delete from public.rps_secret where player_id = p_player;
  delete from public.rps_bets where player_id = p_player;
  delete from public.rps_redemptions where player_id = p_player;
  delete from public.rps_wfp_orders where player_id = p_player;
  delete from public.rps_course_orders where player_id = p_player;
  delete from public.rps_reviews where player_id = p_player;
  delete from public.rps_admin_sessions where account_id = p_player;
  delete from public.rps_accounts where id = p_player;
  delete from public.rps_profiles where id = p_player;
end;
$function$;

create or replace function public.rps_my_pending_tournament_invites(p_player_id uuid)
returns jsonb language sql security definer set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(x order by x.created_at desc), '[]'::jsonb)
  from (
    select
      t.id,
      t.name,
      t.description,
      t.date,
      t.end_date,
      t.prepay_coins,
      t.stake,
      t.round_seconds,
      i.status,
      i.created_at
    from public.rps_tournament_invites i
    join public.rps_tournaments t on t.id = i.tournament_id
    where i.player_id = p_player_id
      and i.status in ('pending', 'later')
      and t.status <> 'finished'
      and (t.end_date is null or t.end_date > now())
  ) x;
$function$;

create or replace function public.rps_admin_tournament_email_payload(
  p_token uuid,
  p_tournament_id bigint
)
returns table(email text, nickname text, tournament_name text, tournament_date timestamptz)
language plpgsql security definer set search_path to 'public'
as $function$
begin
  if not public.rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  return query
    select a.email, p.nickname, t.name, t.date
    from public.rps_tournament_invites i
    join public.rps_tournaments t on t.id = i.tournament_id
    join public.rps_profiles p on p.id = i.player_id
    join public.rps_accounts a on a.id = i.player_id
    where i.tournament_id = p_tournament_id
      and nullif(trim(a.email), '') is not null;
end;
$function$;

grant execute on function public.rps_admin_delete_user(uuid, uuid) to anon, authenticated;
grant execute on function public.rps_my_pending_tournament_invites(uuid) to anon, authenticated;
grant execute on function public.rps_admin_tournament_email_payload(uuid, bigint) to anon, authenticated;

notify pgrst, 'reload schema';
