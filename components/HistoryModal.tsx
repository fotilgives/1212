import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Gift, Loader2, Receipt } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Account } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

interface HistoryItem {
  kind: 'topup' | 'redeem';
  title: string;
  coins: number;
  uah: number | null;
  status: string;
  at: string;
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('uk-UA', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const statusBadge = (kind: string, status: string) => {
  if (kind === 'topup') return { text: 'Зараховано', cls: 'bg-emerald-100 text-emerald-700' };
  switch (status) {
    case 'done':
    case 'delivered':
      return { text: 'Видано', cls: 'bg-emerald-100 text-emerald-700' };
    case 'rejected':
      return { text: 'Відхилено', cls: 'bg-rose-100 text-rose-600' };
    default:
      return { text: 'В обробці', cls: 'bg-amber-100 text-amber-700' };
  }
};

const HistoryModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setItems(null);
    supabase
      .rpc('rps_my_history', { p_id: account.playerId })
      .then(({ data }) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? (data as HistoryItem[]) : []);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, account.playerId]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                  <Receipt className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Історія покупок</h3>
                  <p className="text-xs text-slate-500">Поповнення та обмін монет</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 min-h-[120px] flex-1 overflow-y-auto">
              {loading && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                  <span className="text-sm">Завантажуємо…</span>
                </div>
              )}

              {!loading && items && items.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-slate-400">
                  <Receipt className="h-8 w-8" />
                  <p className="text-sm font-medium text-slate-500">Покупок поки немає</p>
                  <p className="text-xs">Поповни баланс або обміняй монети на приз — і вони зʼявляться тут.</p>
                </div>
              )}

              {!loading && items && items.length > 0 && (
                <ul className="space-y-2.5">
                  {items.map((it, i) => {
                    const isTopup = it.kind === 'topup';
                    const badge = statusBadge(it.kind, it.status);
                    return (
                      <li
                        key={i}
                        className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                            isTopup ? 'bg-amber-100 text-amber-600' : 'bg-violet-100 text-violet-600'
                          }`}
                        >
                          {isTopup ? <Coins className="h-5 w-5" /> : <Gift className="h-5 w-5" />}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-slate-900">{it.title}</div>
                          <div className="mt-0.5 flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">{fmtDate(it.at)}</span>
                            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${badge.cls}`}>
                              {badge.text}
                            </span>
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div
                            className={`flex items-center justify-end gap-1 text-sm font-extrabold ${
                              isTopup ? 'text-emerald-600' : 'text-slate-700'
                            }`}
                          >
                            {isTopup ? '+' : '−'}
                            {it.coins.toLocaleString('uk-UA')}
                            <Coins className="h-3.5 w-3.5 text-amber-400" />
                          </div>
                          {isTopup && it.uah ? (
                            <div className="text-[11px] text-slate-400">{it.uah} грн</div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default HistoryModal;
