-- =============================================================================
-- Надійність раундів і турнірів + оптимізація гарячих запитів
-- =============================================================================

-- На робочій базі вже понад мільйон ставок. Без цих індексів кожен tick,
-- settlement і клієнтський fetch робили повний scan історії.
create index if not exists rps_bets_round_id_idx on public.rps_bets(round_id);
create unique index if not exists rps_bets_round_player_uidx on public.rps_bets(round_id, player_id);
create index if not exists rps_bets_tournament_idx on public.rps_bets(tournament_id)
  where tournament_id is not null;

alter table public.rps_tournaments add column if not exists end_date timestamptz;

create index if not exists rps_tournaments_lifecycle_idx
  on public.rps_tournaments(status, date, end_date);

-- Snapshot режиму не дозволяє змішати звичайні й турнірні ставки, якщо турнір
-- стартував/закінчився посеред поточного раунду.
alter table public.rps_rounds
  add column if not exists tournament_id bigint references public.rps_tournaments(id) on delete set null,
  add column if not exists stake integer,
  add column if not exists round_seconds integer;

create index if not exists rps_rounds_tournament_idx on public.rps_rounds(tournament_id)
  where tournament_id is not null;

-- Основні адмінські RPC з обов'язковим коректним часом завершення. Саме
-- end_date є гарантією, що турнір не залишиться active назавжди.
create or replace function public.rps_admin_create_tournament(
  p_token uuid, p_name text, p_desc text, p_date text, p_end_date text,
  p_prepay int, p_player_ids uuid[], p_stake int, p_round_seconds int
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_tid bigint;
  v_pid uuid;
  v_date timestamptz;
  v_end_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then return jsonb_build_object('error', 'forbidden'); end if;
  begin v_date := nullif(trim(p_date), '')::timestamptz; exception when others then v_date := null; end;
  begin v_end_date := nullif(trim(p_end_date), '')::timestamptz; exception when others then v_end_date := null; end;
  if v_date is null or v_end_date is null or v_end_date <= v_date then
    return jsonb_build_object('error', 'bad_dates');
  end if;

  insert into rps_tournaments(name, description, date, end_date, prepay_coins, stake, round_seconds)
  values (
    coalesce(nullif(trim(p_name), ''), 'Турнір'), p_desc, v_date, v_end_date,
    greatest(coalesce(p_prepay, 0), 0), greatest(coalesce(p_stake, 100), 1),
    greatest(coalesce(p_round_seconds, 30), 5)
  ) returning id into v_tid;

  if p_player_ids is not null then
    foreach v_pid in array p_player_ids loop
      insert into rps_tournament_invites(tournament_id, player_id)
      values (v_tid, v_pid) on conflict (tournament_id, player_id) do nothing;
    end loop;
  end if;
  return jsonb_build_object('tournament_id', v_tid, 'invited', coalesce(array_length(p_player_ids, 1), 0));
end;
$function$;

create or replace function public.rps_admin_tournament_update(
  p_token uuid, p_id bigint, p_name text, p_desc text, p_date text, p_end_date text,
  p_prepay int, p_stake int, p_round_seconds int
) returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_status text;
  v_date timestamptz;
  v_end_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  select status into v_status from rps_tournaments where id = p_id;
  if not found then return 'not_found'; end if;
  if v_status = 'active' then return 'is_active'; end if;
  begin v_date := nullif(trim(p_date), '')::timestamptz; exception when others then v_date := null; end;
  begin v_end_date := nullif(trim(p_end_date), '')::timestamptz; exception when others then v_end_date := null; end;
  if v_date is null or v_end_date is null or v_end_date <= v_date then return 'bad_dates'; end if;

  update rps_tournaments
     set name = coalesce(nullif(trim(p_name), ''), name),
         description = p_desc,
         date = v_date,
         end_date = v_end_date,
         prepay_coins = greatest(coalesce(p_prepay, prepay_coins), 0),
         stake = greatest(coalesce(p_stake, stake), 1),
         round_seconds = greatest(coalesce(p_round_seconds, round_seconds), 5)
   where id = p_id;
  return 'ok';
end;
$function$;

create or replace function public.rps_admin_tournament_start(p_token uuid, p_tournament_id bigint)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_end_date timestamptz;
begin
  if not rps_is_admin_token(p_token) then raise exception 'forbidden'; end if;
  select end_date into v_end_date from rps_tournaments where id = p_tournament_id;
  if not found then return 'not_found'; end if;
  if v_end_date is null or v_end_date <= now() then return 'missing_end_date'; end if;
  if exists (select 1 from rps_tournaments where status = 'active' and id <> p_tournament_id) then
    return 'other_active';
  end if;
  update rps_tournaments set status = 'active', started_at = coalesce(started_at, now())
   where id = p_tournament_id;
  return 'ok';
end;
$function$;

-- Один конкурентно-безпечний lifecycle worker. Попередня версія могла одним
-- UPDATE активувати кілька scheduled-турнірів і впасти на unique constraint.
create or replace function public.rps_auto_update_tournaments()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_next_id bigint;
begin
  perform pg_advisory_xact_lock(778899003);

  update rps_tournaments
     set status = 'finished', ended_at = coalesce(ended_at, now())
   where status in ('active', 'scheduled')
     and end_date is not null
     and end_date <= now();

  if not exists (select 1 from rps_tournaments where status = 'active') then
    select id into v_next_id
      from rps_tournaments
     where status = 'scheduled'
       and date is not null
       and date <= now()
       and end_date is not null
       and end_date > now()
     order by date, id
     limit 1
     for update skip locked;

    if v_next_id is not null then
      update rps_tournaments
         set status = 'active', started_at = coalesce(started_at, now())
       where id = v_next_id;
    end if;
  end if;
end;
$function$;

-- Статус тепер лише читає. Раніше кожен телефон кожні 4 секунди запускав
-- lifecycle UPDATE і створював конкуренцію в БД.
create or replace function public.rps_my_tournament_status(p_player_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
stable
as $function$
declare
  t public.rps_tournaments%rowtype;
  i public.rps_tournament_invites%rowtype;
begin
  select * into t from rps_tournaments where status = 'active' order by id limit 1;
  if t.id is null then return jsonb_build_object('active', false); end if;

  select * into i
    from rps_tournament_invites
   where tournament_id = t.id and player_id = p_player_id;

  return jsonb_build_object(
    'active', true,
    'tournament_id', t.id,
    'name', t.name,
    'stake', t.stake,
    'round_seconds', t.round_seconds,
    'prepay_coins', t.prepay_coins,
    'participant', (i.id is not null and i.status = 'yes'),
    'tournament_balance', coalesce(i.tournament_balance, 0),
    'end_date', t.end_date
  );
end;
$function$;

create or replace function public.rps_my_registered_tournament(p_player_id uuid)
returns jsonb
language sql
security definer
set search_path to 'public'
stable
as $function$
  select jsonb_build_object(
    'id', t.id, 'name', t.name, 'status', t.status, 'date', t.date,
    'end_date', t.end_date, 'prepay_coins', t.prepay_coins
  )
  from rps_tournament_invites i
  join rps_tournaments t on t.id = i.tournament_id
  where i.player_id = p_player_id
    and i.status = 'yes'
    and (
      t.status in ('scheduled', 'active')
      or (t.status = 'finished' and coalesce(t.end_date, t.date) > now() - interval '7 days')
    )
  order by case t.status when 'active' then 1 when 'scheduled' then 2 else 3 end, t.date
  limit 1;
$function$;

-- Set-based settlement: один UPDATE замість окремого UPDATE для кожного бота.
-- Зберігає динамічну формулу з міграції 0036.
create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_rock_pool bigint := 0;
  v_scissors_pool bigint := 0;
  v_paper_pool bigint := 0;
  v_rock_rate numeric := 0;
  v_scissors_rate numeric := 0;
  v_paper_rate numeric := 0;
  v_best_move text;
begin
  perform rps_bonus_accrue();

  select
    coalesce(sum(b.stake) filter (where s.real_move = 'rock'), 0),
    coalesce(sum(b.stake) filter (where s.real_move = 'scissors'), 0),
    coalesce(sum(b.stake) filter (where s.real_move = 'paper'), 0)
  into v_rock_pool, v_scissors_pool, v_paper_pool
  from rps_bets b
  join rps_secret s on s.round_id = b.round_id and s.player_id = b.player_id
  where b.round_id = p_round_id;

  update rps_bets b
     set payout = case s.real_move
       when 'rock' then case when v_rock_pool > 0
         then floor(v_scissors_pool::numeric * b.stake / v_rock_pool)::int else 0 end
       when 'scissors' then case when v_scissors_pool > 0
         then floor(v_paper_pool::numeric * b.stake / v_scissors_pool)::int else 0 end
       else case when v_paper_pool > 0
         then floor(v_rock_pool::numeric * b.stake / v_paper_pool)::int else 0 end
     end,
     move = s.real_move
    from rps_secret s
   where b.round_id = p_round_id
     and s.round_id = b.round_id
     and s.player_id = b.player_id;

  -- За раунд у гравця одна ставка, але GROUP BY робить функцію стійкою до
  -- старих даних і дозволяє одним UPDATE зарахувати весь турнір.
  update rps_tournament_invites i
     set tournament_balance = i.tournament_balance + x.payout,
         wins = i.wins + x.wins
    from (
      select b.tournament_id, b.player_id, sum(b.payout)::int as payout,
             count(*) filter (where b.payout > b.stake)::int as wins
        from rps_bets b
        join rps_profiles p on p.id = b.player_id
       where b.round_id = p_round_id and b.tournament_id is not null
       group by b.tournament_id, b.player_id
    ) x
   where i.tournament_id = x.tournament_id and i.player_id = x.player_id;

  update rps_profiles p
     set balance = p.balance + x.payout,
         wins = p.wins + x.wins,
         bluff_ready = x.has_win
    from (
      select b.player_id, sum(b.payout)::int as payout,
             count(*) filter (where b.payout > b.stake)::int as wins,
             bool_or(b.payout > b.stake) as has_win
        from rps_bets b
       where b.round_id = p_round_id and b.tournament_id is null
       group by b.player_id
    ) x
   where p.id = x.player_id;

  v_rock_rate := case when v_rock_pool > 0 then v_scissors_pool::numeric / v_rock_pool else 0 end;
  v_scissors_rate := case when v_scissors_pool > 0 then v_paper_pool::numeric / v_scissors_pool else 0 end;
  v_paper_rate := case when v_paper_pool > 0 then v_rock_pool::numeric / v_paper_pool else 0 end;
  v_best_move := case
    when v_rock_rate >= v_scissors_rate and v_rock_rate >= v_paper_rate then 'rock'
    when v_scissors_rate >= v_paper_rate then 'scissors'
    else 'paper'
  end;
  update rps_rounds set win_move = v_best_move where id = p_round_id;
end;
$function$;

-- Боти додаються одним SQL statement і використовують snapshot ставки раунду.
create or replace function public.rps_autofill(cur public.rps_rounds, p_target integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  round_no int;
  existing_bots int;
  target int;
  inserted int := 0;
  v_stake int;
  nicks text[] := array['Олег','Марія','Дмитро','Іра','Назар','Софія','Артем','Юля','Влад','Оля',
                        'Тарас','Катя','Макс','Аня','Ігор','Лєра','Рома','Віка','Сергій','Даша'];
begin
  if cur.id is null or cur.status <> 'betting' or now() >= cur.ends_at then return 0; end if;
  perform pg_advisory_xact_lock(778899002);

  round_no := ((cur.id - 1) % 35) + 1;
  v_stake := coalesce(cur.stake, rps_stake());

  select count(*) into existing_bots
    from rps_bets b
   where b.round_id = cur.id
     and not exists (select 1 from rps_profiles p where p.id = b.player_id);

  target := least(greatest(coalesce(p_target, 20), 0), 20);
  if target <= existing_bots then return 0; end if;

  with prepared as materialized (
    select gen_random_uuid() as player_id, l.slot, l.real_move, l.shown_move
      from rps_bot_lineup(round_no) l
     where l.slot > existing_bots and l.slot <= target
     order by l.slot
  ), inserted_bets as (
    insert into rps_bets(round_id, player_id, nickname, move, stake, is_bluff, tournament_id)
    select cur.id, p.player_id,
           nicks[1 + ((p.slot * 7 + round_no) % 20)] || ' 🤖',
           p.shown_move, v_stake, p.real_move <> p.shown_move, cur.tournament_id
      from prepared p
    returning round_id, player_id
  )
  insert into rps_secret(round_id, player_id, real_move)
  select ib.round_id, ib.player_id, p.real_move
    from inserted_bets ib
    join prepared p on p.player_id = ib.player_id;

  get diagnostics inserted = row_count;
  return inserted;
end;
$function$;

-- Єдиний атомарний перехід. При зміні режиму поточний раунд закривається,
-- тому звичайні та турнірні ставки ніколи не змішуються.
create or replace function public.rps_tick()
returns rps_rounds
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur public.rps_rounds;
  v_tid bigint;
  v_stake int;
  v_secs int;
  v_win_move text;
  v_mode_changed boolean;
  v_existing_tid bigint;
  v_existing_stake int;
begin
  perform pg_advisory_xact_lock(778899001);
  perform rps_auto_update_tournaments();

  select id, stake, round_seconds into v_tid, v_stake, v_secs
    from rps_tournaments where status = 'active' order by id limit 1;
  v_stake := coalesce(v_stake, rps_stake());
  v_secs := coalesce(v_secs, rps_round_seconds());

  select * into cur from rps_rounds order by id desc limit 1;

  if cur.id is null then
    insert into rps_rounds(status, started_at, ends_at, win_move, tournament_id, stake, round_seconds)
    values ('betting', now(), now() + make_interval(secs => v_secs), 'rock', v_tid, v_stake, v_secs)
    returning * into cur;
    perform rps_autofill(cur, 20);
    return cur;
  end if;

  -- Для раунду, створеного до цієї міграції, відновлюємо режим із його ставок.
  if cur.stake is null then
    select max(b.tournament_id), max(b.stake)
      into v_existing_tid, v_existing_stake
      from rps_bets b where b.round_id = cur.id;
    update rps_rounds
       set stake = coalesce(v_existing_stake, rps_stake()),
           round_seconds = coalesce(cur.round_seconds, rps_round_seconds()),
           tournament_id = v_existing_tid
     where id = cur.id
     returning * into cur;
  end if;

  v_mode_changed := cur.tournament_id is distinct from v_tid;

  if cur.status = 'betting' and (now() >= cur.ends_at or v_mode_changed) then
    perform rps_settle_round(cur.id);
    select win_move into v_win_move from rps_rounds where id = cur.id;

    update rps_rounds
       set status = 'settled',
           result = (
             select jsonb_build_object(
               'win_move', v_win_move,
               'players', count(*),
               'bank', coalesce(sum(stake), 0)
             ) from rps_bets where round_id = cur.id
           )
     where id = cur.id;

    insert into rps_rounds(status, started_at, ends_at, win_move, tournament_id, stake, round_seconds)
    values (
      'betting', now(), now() + make_interval(secs => v_secs),
      case v_win_move when 'rock' then 'scissors' when 'scissors' then 'paper' else 'rock' end,
      v_tid, v_stake, v_secs
    ) returning * into cur;
  end if;

  if cur.status = 'betting' then perform rps_autofill(cur, 20); end if;
  return cur;
end;
$function$;

-- Ставка завжди використовує snapshot поточного раунду, а не режим, який міг
-- змінитися між двома SELECT.
drop function if exists public.rps_place_bet(uuid, text, text, integer, text, boolean);
create function public.rps_place_bet(
  p_id uuid, p_nick text, p_move text, p_stake integer,
  p_shown_move text default null, p_is_bluff boolean default false
) returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur public.rps_rounds;
  bal int;
  v_stake int;
  v_shown text;
  v_tbal int;
begin
  if p_move not in ('rock','scissors','paper') then raise exception 'bad move'; end if;
  perform rps_register(p_id, p_nick);
  select * into cur from rps_tick();
  if cur.status <> 'betting' or now() >= cur.ends_at then raise exception 'round closed'; end if;

  if p_is_bluff then
    v_shown := coalesce(p_shown_move, p_move);
    if v_shown not in ('rock','scissors','paper') then raise exception 'bad shown'; end if;
  else
    v_shown := p_move;
  end if;

  if exists (select 1 from rps_bets where round_id = cur.id and player_id = p_id) then
    raise exception 'already bet this round';
  end if;

  v_stake := coalesce(cur.stake, rps_stake());
  if cur.tournament_id is not null then
    select tournament_balance into v_tbal
      from rps_tournament_invites
     where tournament_id = cur.tournament_id and player_id = p_id and status = 'yes'
     for update;
    if not found then raise exception 'tournament_locked'; end if;
    if v_tbal < v_stake then raise exception 'insufficient_tournament'; end if;
    update rps_tournament_invites
       set tournament_balance = tournament_balance - v_stake
     where tournament_id = cur.tournament_id and player_id = p_id;
    bal := v_tbal - v_stake;
  else
    select balance into bal from rps_profiles where id = p_id for update;
    if bal < v_stake then raise exception 'insufficient balance'; end if;
    update rps_profiles set balance = balance - v_stake where id = p_id;
    bal := bal - v_stake;
  end if;

  insert into rps_bets(round_id, player_id, nickname, move, stake, is_bluff, tournament_id)
  values (
    cur.id, p_id, coalesce(nullif(trim(p_nick), ''), 'Гравець'),
    v_shown, v_stake, p_is_bluff, cur.tournament_id
  );
  insert into rps_secret(round_id, player_id, real_move) values (cur.id, p_id, p_move);

  update rps_profiles
     set last_bet_round_id = cur.id,
         rounds_since_activity = rounds_since_activity + 1
   where id = p_id;
  update rps_profiles
     set last_activity_at = now(), decays_applied = 0, rounds_since_activity = 0
   where id = p_id and rounds_since_activity >= 5;

  return jsonb_build_object(
    'round_id', cur.id,
    'balance', bal,
    'tournament_id', cur.tournament_id,
    'stake', v_stake
  );
exception
  when unique_violation then raise exception 'already bet this round';
end;
$function$;

grant execute on function public.rps_auto_update_tournaments() to anon, authenticated;
grant execute on function public.rps_admin_create_tournament(uuid, text, text, text, text, int, uuid[], int, int) to anon, authenticated;
grant execute on function public.rps_admin_tournament_update(uuid, bigint, text, text, text, text, int, int, int) to anon, authenticated;
grant execute on function public.rps_admin_tournament_start(uuid, bigint) to anon, authenticated;
grant execute on function public.rps_my_tournament_status(uuid) to anon, authenticated;
grant execute on function public.rps_my_registered_tournament(uuid) to anon, authenticated;
grant execute on function public.rps_settle_round(bigint) to anon, authenticated;
grant execute on function public.rps_autofill(public.rps_rounds, integer) to anon, authenticated;
grant execute on function public.rps_tick() to anon, authenticated;
grant execute on function public.rps_place_bet(uuid, text, text, integer, text, boolean) to anon, authenticated;

-- Сервер є єдиним двигуном часу; частий короткий tick не дає екрану чекати
-- наступної 30-секундної cron-ітерації після випадкового пропуску.
do $do$
declare v_job_id bigint;
begin
  if exists (select 1 from pg_namespace where nspname = 'cron') then
    for v_job_id in execute 'select jobid from cron.job where jobname in (''rps_autorun'', ''rps_round_worker'')'
    loop
      execute format('select cron.unschedule(%s)', v_job_id);
    end loop;
    execute $cron$select cron.schedule('rps_round_worker', '5 seconds', 'select public.rps_tick()')$cron$;
  end if;
end;
$do$;

notify pgrst, 'reload schema';
