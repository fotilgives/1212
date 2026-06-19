import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, Loader2, ShieldCheck } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

interface Props {
  open: boolean;
  onClose: () => void;
  account: Account;
}

// Пакети мають збігатися з PACKAGES на сервері (api/wayforpay-topup.js).
const PACKS = [
  { id: 'p50', uah: 50, coins: 50 },
  { id: 'p100', uah: 100, coins: 110, bonus: '+10%' },
  { id: 'p250', uah: 250, coins: 290, bonus: '+16%' },
  { id: 'p500', uah: 500, coins: 600, bonus: '+20%' },
];

const ExchangeModal: React.FC<Props> = ({ open, onClose, account }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBusy(null);
      setErr(null);
    }
  }, [open]);

  const buy = async (packageId: string) => {
    setErr(null);
    setBusy(packageId);
    try {
      const r = await fetch('/api/wayforpay-topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId, playerId: account.playerId }),
      });
      const data = await r.json();
      if (!r.ok || !data.fields) throw new Error(data.error || 'Не вдалося створити платіж.');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action;
      form.acceptCharset = 'utf-8';
      const add = (k: string, v: string | number) => {
        const i = document.createElement('input');
        i.type = 'hidden';
        i.name = k;
        i.value = String(v);
        form.appendChild(i);
      };
      Object.entries(data.fields).forEach(([k, v]) => {
        if (v === undefined || v === null) return;
        if (Array.isArray(v)) v.forEach((item) => add(`${k}[]`, item as string | number));
        else add(k, v as string | number);
      });
      document.body.appendChild(form);
      form.submit();
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
                <p className="mt-1 text-sm text-slate-500">Обмін гривень на ігрові монети</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {PACKS.map((p) => {
                const loading = busy === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => buy(p.id)}
                    disabled={!!busy}
                    className="relative rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-60"
                  >
                    {p.bonus && (
                      <span className="absolute right-2 top-2 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {p.bonus}
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 text-lg font-extrabold text-slate-900">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin text-emerald-600" /> : <Coins className="h-4 w-4 text-amber-500" />}
                      {p.coins}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">{p.uah} грн</div>
                  </button>
                );
              })}
            </div>

            {err && <p className="mt-4 text-center text-xs font-semibold text-rose-600">{err}</p>}

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Безпечна оплата через WayForPay · монети зараховуються після оплати
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExchangeModal;
