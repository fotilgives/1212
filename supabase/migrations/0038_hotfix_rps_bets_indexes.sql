-- =============================================================================
-- HOTFIX: індекси на rps_bets (застосовано до робочої БД fjrkvxzuwihogmwfpnnt)
-- =============================================================================
-- На робочій базі rps_bets мала ~1.2M рядків БЕЗ жодного індексу на round_id.
-- Через це кожен клієнтський fetch ставок, кожен rps_settle_round, rps_autofill
-- та перевірка «вже поставив» усередині rps_place_bet робили ПОВНИЙ seq scan по
-- 1.2M рядків (~3.4 c на запит). Під навантаженням (20+ гравців) ці сканування
-- накопичувались і гра «зависала»: «ставку не приймає» / «відновлюємо синхронізацію».
--
-- EXPLAIN до:  Parallel Seq Scan ... Execution Time: 3370 ms
-- EXPLAIN після: Index Scan ...       Execution Time: 8 ms   (≈400× швидше)
--
-- ⚠️ Ці міграції (0031–0037 з репозиторію) не були застосовані до робочої БД —
-- жива схема rps_rounds не має колонок tournament_id/stake/round_seconds. Тому
-- цей та наступні хотфікси написані під реально живу (стару) схему.

create index if not exists rps_bets_round_id_idx on public.rps_bets(round_id);

-- Дублікатів (round_id, player_id) у робочій базі немає (перевірено), тож
-- унікальний індекс безпечний і миттєво прискорює перевірку подвійної ставки.
create unique index if not exists rps_bets_round_player_uidx on public.rps_bets(round_id, player_id);
