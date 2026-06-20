import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Loader2, ShieldCheck, Check } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

const PACKS = [
  { id: 'p1',   uah: 1,   coins: 1,    label: '🧪 Тест' },
  { id: 'p50',  uah: 50,  coins: 250 },
  { id: 'p100', uah: 100, coins: 500,  bonus: '×5' },
  { id: 'p200', uah: 200, coins: 1100, bonus: '+10%' },
];

const SUPABASE_URL = 'https://ewtybyrtdvhibdtdvrmq.supabase.co';

declare global {
  interface Window {
    Wayforpay: new () => { run: (p: Record<string, unknown>) => void };
  }
}

function loadWfpScript(): Promise<void> {
  return new Promise((resolve) => {
    if (document.getElementById('wfp-sdk')) { resolve(); return; }
    const s = document.createElement('script');
    s.id = 'wfp-sdk';
    s.src = 'https://secure.wayforpay.com/server/pay-widget.js';
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

const ExchangeModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [busy, setBusy]   = useState<string | null>(null);
  const [done, setDone]   = useState<number | null>(null);
  const [err, setErr]     = useState<string | null>(null);

  useEffect(() => { if (!open) { setBusy(null); setDone(null); setErr(null); } }, [open]);

  const buy = async (id: string, uah: number, coins: number) => {
    setErr(null);
    setBusy(id);
    try {
      await loadWfpScript();

      const res = await fetch(`${SUPABASE_URL}/functions/v1/wfp-create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: account.playerId, amountUah: uah }),
      });
      if (!res.ok) throw new Error('Не вдалося створити платіж');
      const data = await res.json() as Record<string, unknown>;

      const wfp = new window.Wayforpay();
      wfp.run({
        ...data,
        defaultPaymentSystem: 'card',
        straightWidget: true,
        paymentSystems: ['apple', 'google', 'card', 'privat24', 'masterpass'],
        serviceUrl: `${SUPABASE_URL}/functions/v1/wfp-webhook`,
        returnUrl: window.location.href,
      });

      const handler = (e: MessageEvent) => {
        try {
          const msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
          if (msg?.type === 'WfpWidgetEventApproved') {
            window.removeEventListener('message', handler);
            setBusy(null);
            setDone(coins);
            setTimeout(onClose, 2500);
          } else if (msg?.type === 'WfpWidgetEventClose') {
            window.removeEventListener('message', handler);
            setBusy(null);
          }
        } catch { /* ignore */ }
      };
      window.addEventListener('message', handler);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Сталася помилка. Спробуйте пізніше.');
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Поповнення балансу</h3>
                <p className="mt-1 text-sm text-slate-500">100 грн = 500 монет</p>
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
                <p className="text-sm text-slate-500">Баланс оновиться автоматично</p>
              </div>
            ) : (
              <>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {PACKS.map((p) => {
                    const loading = busy === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => buy(p.id, p.uah, p.coins)}
                        disabled={!!busy}
                        className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        {p.bonus && (
                          <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            {p.bonus}
                          </span>
                        )}
                        {'label' in p && p.label && (
                          <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white">
                            {p.label}
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
                          {loading
                            ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                            : <Coins className="h-4 w-4 text-amber-500" />
                          }
                          {p.coins}
                        </div>
                        <div className="mt-1 text-sm text-slate-500">{p.uah} грн</div>
                      </button>
                    );
                  })}
                </div>

                {err && <p className="mt-4 text-center text-xs font-semibold text-rose-600">{err}</p>}

                <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Безпечна оплата через WayForPay · монети зараховуються після оплати
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExchangeModal;
