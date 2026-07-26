-- =============================================================================
-- Tournament rating adjustment: rank by won coins, avg score, and played rounds
-- =============================================================================

-- 1. Add new tracking columns to rps_tournament_invites if they don't exist
alter table public.rps_tournament_invites
  add column if not exists rounds_played int not null default 0,
  add column if not exists won_coins int not null default 0;

-- 2. Populate stats retroactively for existing tournament invites from past bets
update public.rps_tournament_invites i
   set rounds_played = coalesce(b.rounds_count, 0),
       won_coins = coalesce(b.total_payout, 0)
  from (
    select tournament_id, player_id,
           count(*)::int as rounds_count,
           sum(payout)::int as total_payout
      from public.rps_bets
     where tournament_id is not null
     group by tournament_id, player_id
  ) b
 where i.tournament_id = b.tournament_id and i.player_id = b.player_id;

-- 3. Update rps_settle_round to increment rounds_played and won_coins
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
  v_total_profit int := 0;
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

  -- Турнірний баланс, кількість раундів, виграні монети та перемоги
  update rps_tournament_invites i
     set tournament_balance = i.tournament_balance + x.payout,
         won_coins = i.won_coins + x.payout,
         rounds_played = i.rounds_played + x.rounds_count,
         wins = i.wins + x.wins
    from (
      select b.tournament_id, b.player_id,
             sum(b.payout)::int as payout,
             count(*)::int as rounds_count,
             count(*) filter (where b.payout > b.stake)::int as wins
        from rps_bets b
        join rps_profiles p on p.id = b.player_id
       where b.round_id = p_round_id and b.tournament_id is not null
       group by b.tournament_id, b.player_id
    ) x
   where i.tournament_id = x.tournament_id and i.player_id = x.player_id;

  -- Основний баланс
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

  -- Зменшення "Банку центру" на виграні монети (payout > 0) реальних гравців у звичайній грі
  select coalesce(sum(b.payout), 0)::int
    into v_total_profit
    from rps_bets b
    join rps_profiles p on p.id = b.player_id
   where b.round_id = p_round_id
     and b.tournament_id is null
     and b.payout > 0;

  if v_total_profit > 0 then
    update rps_center_bonus
       set amount = greatest(0, amount - v_total_profit),
           last_claim_at = now(),
           updated_at = now()
     where id = 1;
  end if;

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

-- 4. Update rps_tournament_leaderboard to rank by won_coins, avg_score, rounds_played
create or replace function public.rps_tournament_leaderboard(p_tournament_id bigint)
returns jsonb language sql security definer set search_path to 'public' stable as $function$
  select coalesce(jsonb_agg(x), '[]'::jsonb) from (
    select jsonb_build_object(
      'rank', row_number() over (
        order by i.won_coins desc,
                 (case when i.rounds_played > 0 then (i.won_coins::numeric / i.rounds_played) else 0 end) desc,
                 i.rounds_played desc,
                 i.wins desc,
                 i.tournament_balance desc
      ),
      'nickname', coalesce(p.nickname, 'Гравець'),
      'tournament_balance', i.tournament_balance,
      'wins', i.wins,
      'rounds_played', i.rounds_played,
      'won_coins', i.won_coins,
      'avg_score', round((case when i.rounds_played > 0 then (i.won_coins::numeric / i.rounds_played) else 0 end), 1)
    ) as x
    from public.rps_tournament_invites i
    join public.rps_profiles p on p.id = i.player_id
    where i.tournament_id = p_tournament_id and i.status = 'yes'
    order by i.won_coins desc,
             (case when i.rounds_played > 0 then (i.won_coins::numeric / i.rounds_played) else 0 end) desc,
             i.rounds_played desc,
             i.wins desc,
             i.tournament_balance desc
  ) q;
$function$;

grant execute on function public.rps_tournament_leaderboard(bigint) to anon, authenticated;
