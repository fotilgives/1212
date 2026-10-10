/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Публічні anon-ключі передаються через змінні Vercel; доступ до даних обмежує RLS.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } },
});

export interface RoundRow {
  id: number;
  status: 'betting' | 'settled';
  started_at: string;
  ends_at: string;
  tournament_id?: number | null;
  stake?: number | null;
  round_seconds?: number | null;
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
