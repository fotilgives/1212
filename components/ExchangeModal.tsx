import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Check, Loader2 } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

const PACKS = [
  { uah: 1,   coins: 1,    label: '🧪 Тест' },
  { uah: 50,  coins: 250 },
  { uah: 100, coins: 500,  bonus: '×5' },
  { uah: 200, coins: 1100, bonus: '+10%' },
];

const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';

declare global {
  interface Window {
    Wayforpay: new () => {
      run: (params: Record<string, unknown>) => void;
    };
  }
}

function loadWfpScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById('wfp-sdk')) { resolve(); return; }
    const s = document.createElement('script');
    s.id  = 'wfp-sdk';
    s.src = 'https://secure.wayforpay.com/server/pay-widget.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

const ExchangeModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [done, setDone]     = useState<number | null>(null);
  const [loading, setLoading] = useState<number | null>(null);

  useEffect(() => { if (!open) { setDone(null); setLoading(null); } }, [open]);

  const pay = async (uah: number, coins: number) => {
    setLoading(uah);
    try {
      await loadWfpScript();

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/wfp-create`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: account.playerId, amountUah: uah }),
        }
      );
      const data = await res.json() as Record<string, unknown>;

      const wfp = new window.Wayforpay();
      wfp.run({
        ...data,
        defaultPaymentSystem: 'card',
        straightWidget: true,
        serviceUrl: `${SUPABASE_URL}/functions/v1/wfp-webhook`,
        returnUrl: window.location.href,
        // After payment WayForPay calls our webhook → coins credited via realtime
      });

      // Listen for WayForPay widget close/success event
      const handler = (e: MessageEvent) => {
        try {
          const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (msg?.type === 'WfpWidgetEventClose' || msg?.type === 'WfpWidgetEventApproved') {
            window.removeEventListener('message', handler);
            setLoading(null);
            if (msg.type === 'WfpWidgetEventApproved') {
              setDone(coins);
              setTimeout(onClose, 2000);
            }
          }
        } catch { /* ignore */ }
      };
      window.addEventListener('message', handler);
    } catch {
      setLoading(null);
      alert('Не вдалося відкрити форму оплати');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Поповнення балансу</h3>
                <p className="mt-1 text-sm text-slate-500">Оплата через WayForPay · 100 грн = 500 монет</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            {done !== null ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <Check className="h-7 w-7" />
                </span>
                <p className="text-lg font-bold text-slate-900">Зараховано {done} монет!</p>
                <p className="text-sm text-slate-500">Новий баланс оновиться автоматично</p>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-3">
                {PACKS.map((p) => (
                  <button
                    key={p.uah}
                    onClick={() => pay(p.uah, p.coins)}
                    disabled={loading !== null}
                    className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {p.bonus && (
                      <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.bonus}
                      </span>
                    )}
                    {p.label && (
                      <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.label}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
                      {loading === p.uah ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      ) : (
                        <Coins className="h-4 w-4 text-amber-500" />
                      )}
                      {p.coins}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{p.uah} грн</div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExchangeModal;
