import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Lock, ShieldCheck, UserRound, LogIn } from 'lucide-react';
import type { Account } from '../hooks/useAccount';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: (reason?: 'success') => void;
  account: Account;
  required?: boolean;
}

const AuthModal: React.FC<Props> = ({ open, onClose, account, required = false }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [nick, setNick] = useState('');
  const [refCode, setRefCode] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Бонуси реферала з адмінки (rps_config). Дефолти — поки не підвантажено.
  const [newBonus, setNewBonus] = useState(100);
  const [inviterBonus, setInviterBonus] = useState(100);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase.from('rps_config').select('data').eq('id', 1).single();
      const cfg = (data as { data?: Record<string, number> } | null)?.data || {};
      const nb = Number(cfg.referral_new_bonus);
      const ib = Number(cfg.referral_inviter_bonus);
      if (Number.isFinite(nb) && nb >= 0) setNewBonus(Math.floor(nb));
      if (Number.isFinite(ib) && ib >= 0) setInviterBonus(Math.floor(ib));
    })();
  }, [open]);

  // Автозаповнення коду запрошення з ?ref=<uuid> у лінку; перемикаємо на реєстрацію.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      setRefCode(ref);
      setMode('signup');
    }
  }, [open]);

  // Поки обов'язковий вхід відкритий, сторінка позаду не прокручується.
  // Escape також не закриває форму: вийти з неї можна лише після успішної
  // авторизації або реєстрації.
  useEffect(() => {
    if (!open || !required) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const blockEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') event.preventDefault();
    };
    window.addEventListener('keydown', blockEscape, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', blockEscape, true);
    };
  }, [open, required]);

  const submit = async () => {
    setErr(null);
    if (!accepted) {
      setErr('Підтвердьте згоду з політикою та умовами');
      return;
    }
    if (mode === 'signup' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(login.trim())) {
      setErr('Вкажіть коректну пошту (email)');
      return;
    }
    if (password.length < 4) {
      setErr('Пароль — мінімум 4 символи');
      return;
    }
    setBusy(true);
    const e =
      mode === 'login'
        ? await account.login(login, password, rememberMe)
        : await account.signup(login, password, nick, rememberMe, refCode);
    setBusy(false);
    if (e) setErr(e);
    else {
      setLogin('');
      setPassword('');
      setNick('');
      setRefCode('');
      onClose('success');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={required ? undefined : () => onClose()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <motion.div
            className="my-auto w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-white/70"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {legalDoc ? (
              <div>
                <button
                  type="button"
                  onClick={() => setLegalDoc(null)}
                  className="mb-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700 hover:text-emerald-800"
                >
                  <ArrowLeft className="h-4 w-4" /> Назад до форми
                </button>
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                    {legalDoc === 'privacy' ? <Lock className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {legalDoc === 'privacy' ? 'Політика конфіденційності' : 'Умови користування'}
                  </h3>
                </div>
                <div className="mt-4 max-h-[55vh] space-y-3 overflow-y-auto rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600 ring-1 ring-slate-100">
                  {legalDoc === 'privacy' ? (
                    <>
                      <p>Ми обробляємо персональні дані відповідно до Закону України «Про захист персональних даних».</p>
                      <p><b>Які дані збираємо:</b> ім’я, e-mail, номер телефону та інформацію, яку ви добровільно вказуєте у формах.</p>
                      <p><b>Для чого:</b> створення акаунта, збереження балансу, зв’язок із вами, оформлення послуг, платежів і звернень.</p>
                      <p>Ми не отримуємо і не зберігаємо повні реквізити банківських карток. Платежі обробляє захищений сервіс WayForPay.</p>
                      <p>Ви можете попросити виправити або видалити свої дані, написавши на <b>vladimirnikolaevih3@gmail.com</b>.</p>
                    </>
                  ) : (
                    <>
                      <p>Реєструючись, ви підтверджуєте достовірність зазначених даних і погоджуєтеся користуватися сайтом добросовісно.</p>
                      <p>Баланс, бонуси та результати гри прив’язуються до вашого акаунта. Заборонено створювати акаунти для шахрайства або обходу правил.</p>
                      <p>Оплата послуг означає згоду з публічною офертою. Актуальна вартість зазначена на сайті, а час візиту узгоджується додатково.</p>
                      <p>Оплата за ще не надану послугу може бути повернена після звернення. Добровільні внески не повертаються, крім помилкового чи повторного списання.</p>
                      <p>Адміністрація може обмежити доступ у разі порушення правил або спроби втручання в роботу сервісу.</p>
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setLegalDoc(null)}
                  className="mt-5 w-full rounded-xl bg-emerald-600 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  Зрозуміло
                </button>
              </div>
            ) : (
            <>
            <div className="flex items-start justify-between">
              <div>
                {required && (
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    <ShieldCheck className="h-3.5 w-3.5" /> Захищений доступ
                  </span>
                )}
                <h3 id="auth-title" className="text-xl font-extrabold text-slate-900">
                  {mode === 'login' ? 'Вхід' : 'Реєстрація'}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {required
                    ? 'Увійдіть або створіть акаунт, щоб користуватися сайтом'
                    : 'Акаунт зберігає баланс на будь-якому пристрої'}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {mode === 'signup' && (
                <input
                  value={nick}
                  onChange={(e) => setNick(e.target.value.slice(0, 20))}
                  placeholder="Імʼя у грі (необовʼязково)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                />
              )}
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder={mode === 'signup' ? 'Пошта (email)' : 'Пошта (email)'}
                type="email"
                inputMode="email"
                autoCapitalize="none"
                autoComplete={mode === 'signup' ? 'email' : 'username'}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="Пароль"
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
              />
              {mode === 'signup' && (
                <div>
                  <input
                    value={refCode}
                    onChange={(e) => setRefCode(e.target.value)}
                    placeholder="Код запрошення (необовʼязково)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-emerald-400 focus:bg-white"
                  />
                  <p className="mt-1 px-1 text-xs text-emerald-700">
                    {newBonus === inviterBonus
                      ? `🎁 Код друга = +${newBonus} монет тобі й другу`
                      : `🎁 Код друга = +${newBonus} монет тобі, +${inviterBonus} другу`}
                  </p>
                </div>
              )}
            </div>

            <label className="mt-3 flex cursor-pointer items-center gap-2 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded accent-emerald-600"
              />
              <span className="text-sm text-slate-600">Запамʼятати мене</span>
            </label>

            <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-2xl bg-emerald-50/70 p-3 ring-1 ring-emerald-100 select-none">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => {
                  setAccepted(e.target.checked);
                  if (e.target.checked) setErr(null);
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded accent-emerald-600"
              />
              <span className="text-xs leading-relaxed text-slate-600">
                Натискаючи «{mode === 'login' ? 'Увійти' : 'Створити акаунт'}», я погоджуюся з{' '}
                <button type="button" onClick={(e) => { e.preventDefault(); setLegalDoc('terms'); }} className="font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-2">
                  умовами користування
                </button>{' '}
                та{' '}
                <button type="button" onClick={(e) => { e.preventDefault(); setLegalDoc('privacy'); }} className="font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-2">
                  політикою конфіденційності
                </button>.
              </span>
            </label>

            {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}

            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={submit}
              disabled={busy || !login || !password || !accepted}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-lg shadow-emerald-300/50 transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {mode === 'login' ? <LogIn className="h-5 w-5" /> : <UserRound className="h-5 w-5" />}
              {busy ? 'Зачекай…' : mode === 'login' ? 'Увійти' : 'Створити акаунт'}
            </motion.button>

            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErr(null);
              }}
              className="mt-4 w-full text-center text-sm font-medium text-emerald-700 hover:underline"
            >
              {mode === 'login' ? 'Немає акаунта? Зареєструватися' : 'Вже маєш акаунт? Увійти'}
            </button>
            </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
