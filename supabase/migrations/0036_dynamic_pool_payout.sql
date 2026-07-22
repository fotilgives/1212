-- =============================================================================
-- Динамічні виплати з урахуванням живих гравців
-- =============================================================================
-- Таблиця rps_bot_script і надалі задає стартову розстановку ботів.
-- Після ставок живих гравців виплата рахується вже з фактичних банків ходів:
--   камінь   отримує банк ножиць;
--   ножиці   отримують банк паперу;
--   папір    отримує банк каменю.
--
-- Банк переможеного ходу ділиться між усіма ставками переможного ходу
-- пропорційно їх розміру. За однакової ставки 100 це дає формулу з таблиці:
-- payout(камінь) = floor(кількість ножиць * 100 / кількість каменів).
-- =============================================================================

create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  r record;
  v_rock_pool bigint;
  v_scissors_pool bigint;
  v_paper_pool bigint;
  v_source_pool bigint;
  v_own_pool bigint;
  v_payout int;
  v_rock_rate numeric;
  v_scissors_rate numeric;
  v_paper_rate numeric;
  v_best_move text;
begin
  perform rps_bonus_accrue();

  -- Для блефу беремо прихований реальний хід, а не показаний у загальній таблиці.
  select
    coalesce(sum(b.stake) filter (where s.real_move = 'rock'), 0),
    coalesce(sum(b.stake) filter (where s.real_move = 'scissors'), 0),
    coalesce(sum(b.stake) filter (where s.real_move = 'paper'), 0)
  into v_rock_pool, v_scissors_pool, v_paper_pool
  from rps_bets b
  join rps_secret s
    on s.round_id = b.round_id and s.player_id = b.player_id
  where b.round_id = p_round_id;

  for r in
    select b.id, b.player_id, b.stake, b.tournament_id, s.real_move,
           exists(select 1 from rps_profiles p where p.id = b.player_id) as is_real
    from rps_bets b
    join rps_secret s
      on s.round_id = b.round_id and s.player_id = b.player_id
    where b.round_id = p_round_id
    order by b.id
  loop
    v_own_pool := case r.real_move
      when 'rock' then v_rock_pool
      when 'scissors' then v_scissors_pool
      else v_paper_pool
    end;

    v_source_pool := case r.real_move
      when 'rock' then v_scissors_pool
      when 'scissors' then v_paper_pool
      else v_rock_pool
    end;

    -- floor відповідає числам клієнтської таблиці: 600 / 7 = 85, 400 / 3 = 133.
    v_payout := case
      when v_own_pool > 0
        then floor(v_source_pool::numeric * r.stake::numeric / v_own_pool::numeric)::int
      else 0
    end;

    update rps_bets
       set payout = v_payout, move = r.real_move
     where id = r.id;

    if r.tournament_id is not null and r.is_real then
      update rps_tournament_invites
         set tournament_balance = tournament_balance + v_payout,
             wins = wins + (case when v_payout > r.stake then 1 else 0 end)
       where tournament_id = r.tournament_id and player_id = r.player_id;
    end if;
  end loop;

  -- Косметичний результат раунду: хід із найбільшим коефіцієнтом виплати.
  v_rock_rate := case when v_rock_pool > 0 then v_scissors_pool::numeric / v_rock_pool else 0 end;
  v_scissors_rate := case when v_scissors_pool > 0 then v_paper_pool::numeric / v_scissors_pool else 0 end;
  v_paper_rate := case when v_paper_pool > 0 then v_rock_pool::numeric / v_paper_pool else 0 end;
  v_best_move := case
    when v_rock_rate >= v_scissors_rate and v_rock_rate >= v_paper_rate then 'rock'
    when v_scissors_rate >= v_paper_rate then 'scissors'
    else 'paper'
  end;

  update rps_rounds set win_move = v_best_move where id = p_round_id;

  -- Звичайна гра поповнює основний баланс. Турнір уже зарахований вище.
  update rps_profiles p
     set balance = balance + b.payout,
         wins = wins + (case when b.payout > b.stake then 1 else 0 end),
         bluff_ready = (b.payout > b.stake)
    from rps_bets b
    where b.round_id = p_round_id
      and b.player_id = p.id
      and b.tournament_id is null;
end;
$function$;

-- У турнірі боти повинні мати ту саму ставку, що й учасники. Інакше їхні
-- стартові банки спотворюють динамічний коефіцієнт при нестандартній ставці.
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
  perform pg_advisory_xact_lock(778899002);

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

grant execute on function public.rps_settle_round(bigint) to anon, authenticated;
grant execute on function public.rps_autofill(public.rps_rounds, integer) to anon, authenticated;
