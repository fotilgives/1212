-- =============================================================================
-- Неблокуючі блокування двигуна раундів (застосовано до робочої БД)
-- =============================================================================
-- rps_tick() і rps_autofill() використовували БЛОКУЮЧЕ pg_advisory_xact_lock.
-- rps_place_bet() усередині викликає rps_tick(), тож КОЖНА ставка ставала в
-- чергу на глобальне блокування. Під навантаженням (20+ гравців з кількох
-- пристроїв + cron-воркер) транзакції чекали на блокуванні, ТРИМАЮЧИ з'єднання
-- БД. Пул з'єднань вичерпувався → запити відпадали → «ставку не приймає».
--
-- Робимо блокування НЕблокуючим (pg_try_advisory_xact_lock): якщо інша сесія
-- вже просуває раунд/добирає ботів — просто повертаємо поточний стан і одразу
-- звільняємо з'єднання. Час утримання блокування падає до мілісекунд.
--
-- Логіка функцій збережена 1-в-1 з живою схемою; змінено лише вид блокування.

create or replace function public.rps_tick()
returns rps_rounds
language plpgsql
security definer
set search_path to 'public'
as $function$
declare cur public.rps_rounds; nextw text; v_secs int;
begin
  if not pg_try_advisory_xact_lock(778899001) then
    -- Інша сесія вже просуває раунд — читаємо поточний стан без очікування.
    select * into cur from rps_rounds order by id desc limit 1;
    return cur;
  end if;
  select coalesce(t.round_seconds, rps_round_seconds()) into v_secs
    from (select round_seconds from rps_tournaments where status = 'active' limit 1) t;
  if v_secs is null then v_secs := rps_round_seconds(); end if;
  select * into cur from rps_rounds order by id desc limit 1;
  if cur.id is null then
    insert into rps_rounds(status, started_at, ends_at, win_move)
      values ('betting', now(), now() + make_interval(secs => v_secs), 'rock') returning * into cur;
    perform rps_autofill(cur, 20);
    return cur;
  end if;
  if cur.status = 'betting' and now() >= cur.ends_at then
    perform rps_settle_round(cur.id);
    update rps_rounds set status = 'settled', result = (
      select jsonb_build_object('win_move', cur.win_move, 'players', count(*), 'bank', coalesce(sum(stake),0))
      from rps_bets where round_id = cur.id
    ) where id = cur.id;
    nextw := case cur.win_move when 'rock' then 'scissors' when 'scissors' then 'paper' else 'rock' end;
    insert into rps_rounds(status, started_at, ends_at, win_move)
      values ('betting', now(), now() + make_interval(secs => v_secs), nextw) returning * into cur;
  end if;
  if cur.status = 'betting' then perform rps_autofill(cur, 20); end if;
  return cur;
end; $function$;

create or replace function public.rps_autofill(cur rps_rounds, p_target integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  round_no int;
  existing_bots int;
  target int;
  rec record;
  pid uuid;
  vnick text;
  inserted int := 0;
  v_stake int;
  v_tournament_id bigint;
  nicks text[] := array['Олег','Марія','Дмитро','Іра','Назар','Софія','Артем','Юля','Влад','Оля',
                        'Тарас','Катя','Макс','Аня','Ігор','Лєра','Рома','Віка','Сергій','Даша'];
begin
  if cur.id is null or cur.status <> 'betting' or now() >= cur.ends_at then return 0; end if;
  -- Неблокуюче: якщо інша сесія вже добирає ботів у цей раунд — виходимо.
  if not pg_try_advisory_xact_lock(778899002) then return 0; end if;

  round_no := ((cur.id - 1) % 35) + 1;

  select id, stake into v_tournament_id, v_stake
    from rps_tournaments
   where status = 'active'
   limit 1;
  v_stake := coalesce(v_stake, rps_stake());

  select count(*) into existing_bots
    from rps_bets b
    where b.round_id = cur.id
      and not exists (select 1 from rps_profiles p where p.id = b.player_id);

  target := least(coalesce(p_target, 20), 20);
  if target <= existing_bots then return 0; end if;

  for rec in
    select * from rps_bot_lineup(round_no)
    where slot > existing_bots and slot <= target
    order by slot
  loop
    pid := gen_random_uuid();
    vnick := nicks[1 + ((rec.slot * 7 + round_no) % 20)] || ' 🤖';
    insert into rps_bets(round_id, player_id, nickname, move, stake, is_bluff, tournament_id)
      values (cur.id, pid, vnick, rec.shown_move, v_stake,
              rec.real_move <> rec.shown_move, v_tournament_id);
    insert into rps_secret(round_id, player_id, real_move)
      values (cur.id, pid, rec.real_move);
    inserted := inserted + 1;
  end loop;

  return inserted;
end;
$function$;
