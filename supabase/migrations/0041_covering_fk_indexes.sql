-- =============================================================================
-- Покривні індекси на зовнішні ключі (застосовано до робочої БД)
-- =============================================================================
-- Закриває рекомендації аналізатора продуктивності Supabase
-- (unindexed_foreign_keys). Прибирає повільні перевірки FK/каскадів.
-- Для великої rps_bets — ЧАСТКОВИЙ індекс (лише турнірні ставки), тож він
-- крихітний і не впливає на звичайні раунди.

create index if not exists rps_bets_tournament_id_idx
  on public.rps_bets(tournament_id) where tournament_id is not null;

create index if not exists rps_redemptions_player_id_idx
  on public.rps_redemptions(player_id);

create index if not exists rps_tournament_invites_player_id_idx
  on public.rps_tournament_invites(player_id);

create index if not exists rps_wfp_orders_player_id_idx
  on public.rps_wfp_orders(player_id);
