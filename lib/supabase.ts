import { createClient } from '@supabase/supabase-js';

// Публічні (anon) ключі Supabase — безпечно тримати в клієнті, доступ обмежено RLS.
const SUPABASE_URL = 'https://udptbbtlersuxumbpplb.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkcHRiYnRsZXJzdXh1bWJwcGxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzI0NTcsImV4cCI6MjA5NzkwODQ1N30.VTOntDjD16KaWdDmZVqqCoFGQNI_hiwjCwWxQoynmsE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export interface RoundRow {
  id: number;
  status: 'betting' | 'settled';
  started_at: string;
  ends_at: string;
  win_move: 'rock' | 'scissors' | 'paper' | null;
  result: Record<string, unknown> | null;
}

export interface BetRow {
  id: number;
  round_id: number;
  player_id: string;
  nickname: string;
  move: 'rock' | 'scissors' | 'paper';
  stake: number;
  payout: number;
  is_bluff: boolean;
}
