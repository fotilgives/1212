-- =============================================================================
-- Fix Center Bank (Банк центру) Decrement on Player Wins
-- =============================================================================
-- In dynamic pool payout mode, payout can be any amount > 0 (e.g. 62, 85, 140).
-- Decrement rps_center_bonus.amount by real players' payouts (b.payout > 0).
-- =============================================================================

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

  -- Турнірний баланс
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
