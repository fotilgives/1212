import { useCallback, useEffect, useState } from 'react';

const BALANCE_KEY = 'rehab_coins_balance';
const DONATED_KEY = 'rehab_coins_donated';
const WELCOME_BONUS = 100;

function readNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const raw = window.localStorage.getItem(key);
  if (raw === null) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export interface Wallet {
  balance: number;
  donated: number;
  /** Add coins (e.g. after exchange / a game win). */
  deposit: (amount: number) => void;
  /** Remove coins. Returns false if there aren't enough. */
  withdraw: (amount: number) => boolean;
  /** Record a donation (coins leave the balance and are counted as donated). */
  donate: (amount: number) => boolean;
  reset: () => void;
}

export function useWallet(): Wallet {
  const [balance, setBalance] = useState<number>(() => {
    const stored = readNumber(BALANCE_KEY, NaN);
    return Number.isNaN(stored) ? WELCOME_BONUS : stored;
  });
  const [donated, setDonated] = useState<number>(() => readNumber(DONATED_KEY, 0));

  useEffect(() => {
    window.localStorage.setItem(BALANCE_KEY, String(balance));
  }, [balance]);

  useEffect(() => {
    window.localStorage.setItem(DONATED_KEY, String(donated));
  }, [donated]);

  const deposit = useCallback((amount: number) => {
    if (amount <= 0) return;
    setBalance((b) => b + amount);
  }, []);

  const withdraw = useCallback((amount: number): boolean => {
    if (amount <= 0) return false;
    let ok = false;
    setBalance((b) => {
      if (b >= amount) {
        ok = true;
        return b - amount;
      }
      return b;
    });
    return ok;
  }, []);

  const donate = useCallback((amount: number): boolean => {
    if (amount <= 0) return false;
    let ok = false;
    setBalance((b) => {
      if (b >= amount) {
        ok = true;
        return b - amount;
      }
      return b;
    });
    if (ok) setDonated((d) => d + amount);
    return ok;
  }, []);

  const reset = useCallback(() => {
    setBalance(WELCOME_BONUS);
    setDonated(0);
  }, []);

  return { balance, donated, deposit, withdraw, donate, reset };
}
