import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, Loader2, Mail, Phone, User } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CourseBuyModal: React.FC<Props> = ({ open, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) { setBusy(false); setErr(null); }
  }, [open]);

  const pay = async () => {
    setErr(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setErr('Вкажіть коректний e-mail — на нього надійде доступ до курсу.');
      return;
    }
    if (phone.replace(/\D/g, '').length < 9) {
      setErr('Вкажіть коректний номер телефону.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/wayforpay-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      });
      const data = await r.json();
      if (!r.ok || !data.fields) throw new Error(data.error || 'Не вдалося створити платіж.');

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.action;
      form.acceptCharset = 'utf-8';
      const add = (k: string, v: string | number) => {
        const i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = String(v);
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
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
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
                <h3 className="text-xl font-extrabold text-slate-900">Придбати курс з йоги</h3>
                <p className="mt-1 text-sm text-slate-500">Доступ надішлемо на вашу пошту після оплати.</p>
              </div>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                <User className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ім'я (необов'язково)"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  inputMode="email"
                  placeholder="E-mail для доступу"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 focus-within:border-emerald-400 focus-within:bg-white">
                <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  inputMode="tel"
                  placeholder="Телефон"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {err && <p className="mt-3 text-center text-xs font-semibold text-rose-600">{err}</p>}

            <button
              onClick={pay}
              disabled={busy}
              className="shine mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-base font-bold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Переходимо до оплати…</>
              ) : (
                <>Оплатити 2500 грн</>
              )}
            </button>

            <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              Безпечна оплата через WayForPay · Visa · Mastercard · Apple/Google Pay
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CourseBuyModal;
