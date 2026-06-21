-- =============================================================================
-- Боти + циклічна виплата + денний фонд центру (за інструкцією з відео + таблицею)
-- =============================================================================
-- Модель:
--   * 35 жорстко заданих раундів (rps_bot_script). round_no = ((round.id-1) % 35)+1.
--     Боти грають 35 раундів -> по колу знову.
--   * Кожен раунд: точна к-сть ботів ✊/✌️/✋ (12-20, макс 20) + блеф
--     (частина ботів ПОКАЗУЄ інший хід, ніж грає).
--   * Циклічна виплата: кожна група забирає пул того, кого б'є, порівну:
--        ✊ камінь  <- пул ✌️ ножиць
--        ✌️ ножиці  <- пул ✋ паперу
--        ✋ папір   <- пул ✊ каменю
--   * Денний фонд центру = 5000 балів/день. Тільки ЖИВИМ гравцям.
--     Гарантія: жива людина ніколи не в мінусі — програш докривається з фонду
--     до ставки + невеликий плюс (rps_bonus_floor). Фонд скінчився -> чистий цикл.
--   * Бот = ставка без профілю (player_id не в rps_profiles). Боти топапів не мають.
-- =============================================================================

-- ── Константи ───────────────────────────────────────────────────────────────
create or replace function public.rps_daily_fund() returns integer
  language sql immutable as $$ select 5000 $$;

create or replace function public.rps_bonus_floor() returns integer
  language sql immutable as $$ select 25 $$;

-- ── Сценарій 35 раундів ──────────────────────────────────────────────────────
create table if not exists public.rps_bot_script (
  round_no  int primary key,
  rock      int not null,
  scissors  int not null,
  paper     int not null,
  r2s int not null default 0,  -- камінь  показує ножиці
  r2p int not null default 0,  -- камінь  показує папір
  s2r int not null default 0,  -- ножиці  показують камінь
  s2p int not null default 0,  -- ножиці  показують папір
  p2r int not null default 0,  -- папір   показує камінь
  p2s int not null default 0   -- папір   показує ножиці
);

truncate public.rps_bot_script;
insert into public.rps_bot_script
  (round_no, rock, scissors, paper, r2s, r2p, s2r, s2p, p2r, p2s) values
  ( 1, 7,6,5, 1,0, 2,0, 0,0),
  ( 2, 4,5,3, 0,5, 3,0, 0,4),
  ( 3, 8,6,6, 0,0, 0,2, 3,0),
  ( 4, 5,5,5, 0,2, 0,0, 3,2),
  ( 5, 7,4,6, 0,0, 2,0, 0,2),
  ( 6, 3,5,4, 0,0, 0,0, 0,0),
  ( 7, 8,5,4, 0,0, 1,0, 0,2),
  ( 8, 6,6,6, 0,4, 1,0, 0,2),
  ( 9, 8,5,7, 0,0, 0,0, 0,0),
  (10, 4,6,5, 0,0, 0,2, 0,5),
  (11, 6,7,6, 0,0, 0,0, 2,0),
  (12, 5,5,5, 0,0, 0,0, 2,0),
  (13, 8,7,5, 0,3, 0,0, 0,0),
  (14, 7,4,5, 0,0, 0,0, 3,0),
  (15, 3,5,5, 0,0, 3,0, 0,3),
  (16, 4,4,4, 0,0, 3,0, 0,3),
  (17, 4,5,4, 2,2, 0,0, 0,0),
  (18, 5,8,6, 0,2, 0,2, 0,0),
  (19, 8,7,5, 0,0, 0,0, 0,0),
  (20, 6,6,6, 1,1, 0,2, 0,0),
  (21, 6,5,4, 1,1, 0,2, 0,0),
  (22, 4,6,5, 1,1, 0,2, 0,0),
  (23, 7,8,5, 0,0, 0,4, 0,0),
  (24, 5,5,5, 0,1, 0,3, 0,0),
  (25, 6,4,3, 0,1, 0,3, 0,0),
  (26, 7,5,8, 0,0, 0,0, 0,0),
  (27, 7,8,4, 0,0, 3,0, 0,0),
  (28, 5,5,5, 0,0, 3,0, 0,0),
  (29, 5,6,8, 0,0, 2,0, 0,0),
  (30, 3,4,5, 0,1, 2,0, 0,0),
  (31, 5,5,6, 0,1, 0,0, 0,0),
  (32, 6,6,6, 0,1, 0,0, 0,0),
  (33, 5,6,7, 0,1, 0,0, 0,0),
  (34, 4,5,6, 0,0, 0,0, 0,0),
  (35, 2,4,5, 0,0, 0,2, 1,0);

-- ── Розгортання раунду у впорядкований список ботів ──────────────────────────
-- Повертає slot (1..N) з реальним та показаним ходом. Блеф клемпиться до к-сті
-- ботів цього ходу. Порядок — round-robin (✊✌️✋✊…), щоб поступове заповнення
-- виглядало природно й було детермінованим.
create or replace function public.rps_bot_lineup(p_round_no int)
returns table(slot int, real_move text, shown_move text)
language plpgsql stable as $$
declare s public.rps_bot_script; g int; sm text;
  arr_real text[] := array[]::text[]; arr_shown text[] := array[]::text[];
begin
  select * into s from public.rps_bot_script where round_no = p_round_no;
  if not found then return; end if;

  for g in 1..s.rock loop
    arr_real := array_append(arr_real, 'rock'::text);
    if    g <= s.r2s            then sm := 'scissors';
    elsif g <= s.r2s + s.r2p    then sm := 'paper';
    else                             sm := 'rock'; end if;
    arr_shown := array_append(arr_shown, sm);
  end loop;
  for g in 1..s.scissors loop
    arr_real := array_append(arr_real, 'scissors'::text);
    if    g <= s.s2r            then sm := 'rock';
    elsif g <= s.s2r + s.s2p    then sm := 'paper';
    else                             sm := 'scissors'; end if;
    arr_shown := array_append(arr_shown, sm);
  end loop;
  for g in 1..s.paper loop
    arr_real := array_append(arr_real, 'paper'::text);
    if    g <= s.p2r            then sm := 'rock';
    elsif g <= s.p2r + s.p2s    then sm := 'scissors';
    else                             sm := 'paper'; end if;
    arr_shown := array_append(arr_shown, sm);
  end loop;

  return query
    with raw as (
      select gi,
             arr_real[gi]  as vreal,
             arr_shown[gi] as vshown,
             case when gi <= s.rock                       then 0
                  when gi <= s.rock + s.scissors          then 1
                  else 2 end as grp,
             case when gi <= s.rock                       then gi
                  when gi <= s.rock + s.scissors          then gi - s.rock
                  else gi - s.rock - s.scissors end as within_idx
      from generate_series(1, s.rock + s.scissors + s.paper) as gi
    )
    select (row_number() over (order by within_idx, grp))::int, vreal, vshown
    from raw;
end; $$;

-- ── Заповнення ботами за сценарієм ───────────────────────────────────────────
-- p_target = бажана к-сть БОТІВ у раунді (живі гравці рахуються окремо).
-- Додає ботів зі сценарію поступово (slot за slot), не дублюючи.
create or replace function public.rps_fill(p_target integer)
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  cur public.rps_rounds; round_no int; existing_bots int; target int;
  rec record; pid uuid; vnick text; inserted int := 0;
  nicks text[] := array['Олег','Марія','Дмитро','Іра','Назар','Софія','Артем','Юля','Влад','Оля',
                        'Тарас','Катя','Макс','Аня','Ігор','Лєра','Рома','Віка','Сергій','Даша'];
begin
  perform pg_advisory_xact_lock(778899002);
  select * into cur from rps_tick();
  if cur.status <> 'betting' or now() >= cur.ends_at then return 0; end if;

  round_no := ((cur.id - 1) % 35) + 1;

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
    insert into rps_bets(round_id, player_id, nickname, move, stake, is_bluff)
      values (cur.id, pid, vnick, rec.shown_move, rps_stake(), rec.real_move <> rec.shown_move);
    insert into rps_secret(round_id, player_id, real_move)
      values (cur.id, pid, rec.real_move);
    inserted := inserted + 1;
  end loop;

  return inserted;
end; $function$;

-- ── Фонд центру: +5000/день, накопичується, цикл 10 днів (до 50000) ──────────
-- На 11-й день -> скидання на 5000. Тільки живим гравцям (гарантія в settle).
create or replace function public.rps_bonus_accrue()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare r public.rps_center_bonus; today date := (now() at time zone 'Europe/Kyiv')::date;
  missed int; i int;
begin
  select * into r from rps_center_bonus where id = 1 for update;
  if not found then
    insert into rps_center_bonus(id, amount, cycle_day, last_accrual)
      values (1, rps_daily_fund(), 1, today)
      on conflict (id) do nothing;
    return;
  end if;
  if today <= r.last_accrual then return; end if;

  missed := today - r.last_accrual;
  for i in 1..least(missed, 60) loop
    if r.cycle_day >= 10 then
      r.amount := rps_daily_fund(); r.cycle_day := 1;        -- 11-й день -> скидання
    else
      r.amount := r.amount + rps_daily_fund(); r.cycle_day := r.cycle_day + 1;
    end if;
  end loop;

  update rps_center_bonus
     set amount = r.amount, cycle_day = r.cycle_day, last_accrual = today, updated_at = now()
   where id = 1;
end; $function$;

-- ── Розрахунок раунду: циклічна виплата + гарантія живим гравцям ──────────────
create or replace function public.rps_settle_round(p_round_id bigint)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  rock_pot int; sc_pot int; pp_pot int;
  rock_n int; sc_n int; pp_n int;
  arr record; tgt text; n int; i int; per int; distributed int; r record; share int;
  v_fund int; floor_b int := rps_bonus_floor();
  rpp int; spp int; ppp int; cosmetic text;
begin
  -- пули та к-сть за РЕАЛЬНИМ ходом
  select coalesce(sum(b.stake) filter (where s.real_move='rock'),0),
         coalesce(sum(b.stake) filter (where s.real_move='scissors'),0),
         coalesce(sum(b.stake) filter (where s.real_move='paper'),0),
         count(*) filter (where s.real_move='rock'),
         count(*) filter (where s.real_move='scissors'),
         count(*) filter (where s.real_move='paper')
    into rock_pot, sc_pot, pp_pot, rock_n, sc_n, pp_n
    from rps_secret s
    join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
    where s.round_id = p_round_id;

  if rock_pot + sc_pot + pp_pot = 0 then return; end if;

  -- три пули роздаються переможній групі порівну.
  -- (pot, winner, refund): хто забирає пул; якщо переможна група порожня —
  -- пул повертається тим, хто його поставив (зберігає суму банку).
  for arr in
    select * from (values
      (rock_pot, 'paper',    'rock'),       -- пул каменю забирає папір
      (sc_pot,   'rock',     'scissors'),   -- пул ножиць забирає камінь
      (pp_pot,   'scissors', 'paper')       -- пул паперу забирають ножиці
    ) v(pot, winner, refundm)
  loop
    if arr.pot <= 0 then continue; end if;
    tgt := arr.winner;
    if (tgt='rock' and rock_n=0) or (tgt='scissors' and sc_n=0) or (tgt='paper' and pp_n=0) then
      tgt := arr.refundm;
    end if;

    select count(*) into n
      from rps_secret s where s.round_id = p_round_id and s.real_move = tgt;
    if n = 0 then continue; end if;

    per := arr.pot / n;
    distributed := 0; i := 0;
    for r in
      select b.id from rps_secret s
        join rps_bets b on b.round_id = s.round_id and b.player_id = s.player_id
        where s.round_id = p_round_id and s.real_move = tgt
        order by b.id
    loop
      i := i + 1;
      if i = n then share := arr.pot - distributed; else share := per; end if;
      update rps_bets set payout = payout + share where id = r.id;
      distributed := distributed + share;
    end loop;
  end loop;

  -- Гарантія живим гравцям: ніколи не в мінусі. Програш докривається з денного
  -- фонду до (ставка + floor). Боти (без профілю) пропускаються.
  perform rps_bonus_accrue();
  select amount into v_fund from rps_center_bonus where id = 1 for update;
  v_fund := coalesce(v_fund, 0);
  if v_fund > 0 then
    for r in
      select b.id, b.stake, b.payout
        from rps_bets b
        join rps_profiles p on p.id = b.player_id
        where b.round_id = p_round_id
        order by b.id
    loop
      exit when v_fund <= 0;
      if r.payout < r.stake + floor_b then
        share := least((r.stake + floor_b) - r.payout, v_fund);
        update rps_bets set payout = payout + share where id = r.id;
        v_fund := v_fund - share;
      end if;
    end loop;
    update rps_center_bonus set amount = v_fund, last_claim_at = now(), updated_at = now() where id = 1;
  end if;

  -- розкрити справжні ходи (зняти блеф) у списку ставок
  update rps_bets b set move = s.real_move
    from rps_secret s
    where b.round_id = s.round_id and b.player_id = s.player_id and b.round_id = p_round_id;

  -- косметичний "виграшний хід раунду" = найбільша виплата на гравця
  rpp := case when rock_n > 0 then sc_pot   / rock_n else -1 end;
  spp := case when sc_n   > 0 then pp_pot   / sc_n   else -1 end;
  ppp := case when pp_n   > 0 then rock_pot / pp_n   else -1 end;
  cosmetic := case when rpp >= spp and rpp >= ppp then 'rock'
                   when spp >= ppp then 'scissors' else 'paper' end;
  update rps_rounds set win_move = cosmetic where id = p_round_id;

  -- баланс/перемоги/доступ до блефу (виграв -> можна)
  update rps_profiles p
    set balance = balance + b.payout,
        wins = wins + (case when b.payout > b.stake then 1 else 0 end),
        bluff_ready = (b.payout > b.stake)
    from rps_bets b
    where b.round_id = p_round_id and b.player_id = p.id;
end; $function$;

-- ── Скинути поточний фонд на денний (одноразово при міграції) ─────────────────
update public.rps_center_bonus set amount = rps_daily_fund(), updated_at = now() where id = 1;
