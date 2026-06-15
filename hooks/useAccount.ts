import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const ID_KEY = 'rps_player_id';
const NICK_KEY = 'rps_nickname';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Запасний варіант для старих/незахищених середовищ.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateId(): string {
  let id = localStorage.getItem(ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(ID_KEY, id);
  }
  return id;
}

function initialNick(): string {
  const saved = localStorage.getItem(NICK_KEY);
  if (saved) return saved;
  return 'Гравець-' + Math.floor(1000 + Math.random() * 9000);
}

export interface Account {
  playerId: string;
  nickname: string;
  balance: number;
  wins: number;
  bluffReady: boolean;
  lastBetRound: number | null;
  ready: boolean;
  setNickname: (n: string) => void;
  refresh: () => Promise<void>;
  topUp: (amount: number) => Promise<void>;
  donate: (amount: number) => Promise<boolean>;
}

export function useAccount(): Account {
  const [playerId] = useState(getOrCreateId);
  const [nickname, setNicknameState] = useState(initialNick);
  const [balance, setBalance] = useState(0);
  const [wins, setWins] = useState(0);
  const [bluffReady, setBluffReady] = useState(false);
  const [lastBetRound, setLastBetRound] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const nickRef = useRef(nickname);
  nickRef.current = nickname;

  const setNickname = useCallback((n: string) => {
    setNicknameState(n);
    localStorage.setItem(NICK_KEY, n);
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from('rps_profiles')
      .select('balance,nickname,wins,bluff_ready,last_bet_round_id')
      .eq('id', playerId)
      .maybeSingle();
    if (data) {
      setBalance(data.balance);
      setWins(data.wins ?? 0);
      setBluffReady(!!data.bluff_ready);
      setLastBetRound(data.last_bet_round_id ?? null);
    }
  }, [playerId]);

  useEffect(() => {
    let active = true;
    (async () => {
      await supabase.rpc('rps_register', { p_id: playerId, p_nick: nickRef.current });
      if (active) {
        await refresh();
        setReady(true);
      }
    })();

    const channel = supabase
      .channel(`profile-${playerId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rps_profiles', filter: `id=eq.${playerId}` },
        (payload) => {
          const row = payload.new as {
            balance?: number;
            wins?: number;
            bluff_ready?: boolean;
            last_bet_round_id?: number | null;
          };
          if (typeof row?.balance === 'number') setBalance(row.balance);
          if (typeof row?.wins === 'number') setWins(row.wins);
          if (typeof row?.bluff_ready === 'boolean') setBluffReady(row.bluff_ready);
          if (row && 'last_bet_round_id' in row) setLastBetRound(row.last_bet_round_id ?? null);
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [playerId, refresh]);

  const topUp = useCallback(
    async (amount: number) => {
      await supabase.rpc('rps_topup', { p_id: playerId, p_nick: nickRef.current, p_amount: amount });
      await refresh();
    },
    [playerId, refresh]
  );

  const donate = useCallback(
    async (amount: number) => {
      const { error } = await supabase.rpc('rps_donate', {
        p_id: playerId,
        p_nick: nickRef.current,
        p_amount: amount,
      });
      await refresh();
      return !error;
    },
    [playerId, refresh]
  );

  return { playerId, nickname, balance, wins, bluffReady, lastBetRound, ready, setNickname, refresh, topUp, donate };
}
