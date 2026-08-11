import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Loader2, ShieldCheck } from 'lucide-react';

interface Props {
  open: boolean;
  /** Назва призу/курсу — показуємо у заголовку. */
  title: string;
  /** Скільки монет буде списано (необовʼязково). */
  cost?: number;
  /** Початкове значення — останній номер гравця. */
  initialPhone?: string;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (phone: string) => void;
}

/** Мінімум цифр у номері (моб. номер без коду країни). */
export const isValidPhone = (v: string) => v.replace(/\D/g, '').length >= 9;

/**
 * Просимо номер телефону перед обміном монет на приз.
 * Без нього гість лишався без контактів — і спеціаліст не міг звʼязатися.
 */
const PhoneAskModal: React.FC<Props> = ({
  open, title, cost, initialPhone = '', busy = false, error = null, onClose, onSubmit,
}) => {
  const [phone, setPhone] = useState(initialPhone);
  const [localErr, setLocalErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhone(initialPhone);
      setLocalErr(null);
    }
  }, [open, initialPhone]);

  const submit = () => {
    const v = phone.trim();
    if (!isValidPhone(v)) {
      setLocalErr('Вкажи коректний номер — наприклад 0501234567.');
      return;
    }
    setLocalErr(null);
    onSubmit(v);
  };

  const msg = localErr || error;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={busy ? undefined : onClose}
        >
          <motion.div
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-xl font-extrabold text-slate-900">Номер для звʼязку</h3>
                <p className="mt-1 text-sm text-slate-500">
                  «{title}»{typeof cost === 'number' ? ` · ${cost.toLocaleString('uk-UA')} монет` : ''}
                </p>
              </div>
              <button
                onClick={onClose}
                disabled={busy}
                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="mt-3 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-100">
              📞 Залиш номер — спеціаліст зателефонує або напише у Viber/Telegram, щоб видати нагороду.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                type="tel"
                inputMode="tel"
                autoFocus
                placeholder="Твій телефон, напр. 0501234567"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            {msg && <p className="mt-2 text-center text-xs font-semibold text-rose-600">{msg}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="shine mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? <><Loader2 className="h-5 w-5 animate-spin" /> Оформлюю…</> : <>Підтвердити обмін</>}
            </button>

            <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Номер потрібен лише для видачі нагороди
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PhoneAskModal;
