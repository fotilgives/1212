import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, Check, UserPlus, Copy, Star, Send, MessageSquare, X, ExternalLink, Lock, Receipt } from 'lucide-react';
import type { Account } from '../../hooks/useAccount';
import AnimatedNumber from '../AnimatedNumber';

interface Props {
  account: Account;
  onTopUp: () => void;
  onLogin?: () => void;
  onHistory?: () => void;
  /** true - компонент рендериться всередині акордеону на головній. */
  embedded?: boolean;
}

const COURSE_BOT_URL = 'https://t.me/+o9i9tJpoj4A3MTcy';

type Delivery =
  | { type: 'link'; url: string; label: string }
  | { type: 'contact' };

interface Reward {
  emoji: string;
  title: string;
  cost: number;
  delivery: Delivery;
}

// Орієнтовні ціни (≈5 монет = 1 грн). Бос коригує за потреби.
const REWARDS: Reward[] = [
  { emoji: '🧘', title: 'Доступ до курсу з йоги', cost: 12500, delivery: { type: 'link', url: COURSE_BOT_URL, label: 'Відкрити курс у Telegram' } },
  { emoji: '💆', title: 'Сеанс масажу', cost: 6000, delivery: { type: 'contact' } },
  { emoji: '📜', title: 'Сертифікат на послуги 1000 грн', cost: 6000, delivery: { type: 'contact' } },
  { emoji: '🎁', title: 'Подарунковий сертифікат 500 грн', cost: 3000, delivery: { type: 'contact' } },
  { emoji: '🎟️', title: 'Знижка 20% на масаж', cost: 1500, delivery: { type: 'contact' } },
  { emoji: '✨', title: 'Знижка 10% на будь-яку послугу', cost: 800, delivery: { type: 'contact' } },
];

const Prizes: React.FC<Props> = ({ account, onTopUp, onLogin, onHistory, embedded = false }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [delivered, setDelivered] = useState<Reward | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Реферал
  const [copied, setCopied] = useState(false);
  const inviteLink =
    typeof window !== 'undefined' ? `${window.location.origin}/?ref=${account.playerId}` : '';
  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
    } catch {
      /* ignore */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  // Відгук
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewErr, setReviewErr] = useState<string | null>(null);
  const submitReview = async () => {
    setReviewErr(null);
    if (reviewText.trim().length < 3) {
      setReviewErr('Напишіть хоча б кілька слів.');
      return;
    }
    setReviewBusy(true);
    const e = await account.addReview(rating, reviewText.trim());
    setReviewBusy(false);
    if (e) setReviewErr(e);
    else {
      setReviewDone(true);
      setReviewText('');
    }
  };

  const redeem = async (r: Reward) => {
    setErr(null);
    // Покупка за монети — лише для зареєстрованих (видача йде на акаунт/пошту).
    if (!account.isAccount) {
      onLogin?.();
      return;
    }
    if (account.balance < r.cost) {
      onTopUp();
      return;
    }
    setBusy(r.title);
    const e = await account.redeem(r.title, r.cost);
    setBusy(null);
    if (e) setErr(e);
    else setDelivered(r);
  };

  const Wrapper: any = embedded ? 'div' : 'main';
  return (
    <Wrapper className={embedded ? '' : 'mx-auto max-w-4xl px-5 pb-20 pt-12 sm:pt-16'}>
      <div className="text-center">
        {!embedded && (
          <>
            <span className="eyebrow">🎁 Призи</span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Обмін монет на призи</h1>
          </>
        )}
        <p className={`mx-auto max-w-xl text-slate-600 ${embedded ? '' : 'mt-3'}`}>
          Зароблені у грі монети можна обміняти на послуги, знижки, сертифікати та курси. Без виводу коштів - лише корисні нагороди.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-base font-bold text-amber-600 ring-1 ring-amber-200">
            <Coins className="h-5 w-5" /> Твій баланс: <AnimatedNumber value={account.balance} />
          </div>
          {onHistory && (
            <button
              onClick={onHistory}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
            >
              <Receipt className="h-4 w-4" /> Історія покупок
            </button>
          )}
        </div>
        {!account.isAccount && (
          <p className="mx-auto mt-3 flex max-w-xl items-center justify-center gap-1.5 text-sm text-slate-500">
            <Lock className="h-4 w-4 text-slate-400" />
            Щоб обміняти монети — <button onClick={() => onLogin?.()} className="font-semibold text-emerald-700 hover:underline">зареєструйся</button> (пошта + пароль).
          </p>
        )}
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {REWARDS.map((r, i) => {
          const enough = account.balance >= r.cost;
          return (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              whileHover={{ y: -5 }}
              className="card-glow flex flex-col rounded-3xl p-6 ring-1 ring-white/60"
            >
              <div className="text-4xl">{r.emoji}</div>
              <h2 className="mt-3 flex-1 text-lg font-bold text-slate-900">{r.title}</h2>
              <div className="mt-3 flex items-center gap-1.5 text-emerald-600">
                <Coins className="h-4 w-4" />
                <span className="text-xl font-extrabold">{r.cost.toLocaleString('uk-UA')}</span>
                <span className="text-sm text-slate-400">монет</span>
              </div>
              <button
                onClick={() => redeem(r)}
                disabled={busy === r.title}
                className={`mt-4 w-full rounded-xl py-3 text-sm font-semibold transition disabled:opacity-50 ${
                  !account.isAccount
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    : enough
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {busy === r.title ? 'Оформлюю…' : !account.isAccount ? 'Зареєструватись' : enough ? 'Обміняти' : 'Поповнити баланс'}
              </button>
            </motion.div>
          );
        })}
      </div>

      <p className="mt-8 text-center text-xs text-slate-400">
        Список призів регулярно оновлюється. Після обміну спеціаліст звʼяжеться з вами, щоб видати нагороду.
      </p>

      {err && <p className="mt-3 text-center text-sm font-medium text-rose-600">{err}</p>}

      {/* Утримай бали від «таяння»: запроси друга або залиш відгук */}
      {!embedded && (
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {/* Запросити друга */}
        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <UserPlus className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold">Запросити друга</h3>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            Поділись посиланням. Коли друг приєднається — твій таймер «таяння» балів скинеться ще на 3 дні.
          </p>
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <input
              readOnly
              value={inviteLink}
              className="w-full truncate bg-transparent text-xs text-slate-500 outline-none"
            />
          </div>
          <button
            onClick={copyInvite}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            {copied ? <><Check className="h-4 w-4" /> Скопійовано</> : <><Copy className="h-4 w-4" /> Скопіювати посилання</>}
          </button>
        </div>

        {/* Залишити відгук */}
        <div className="rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <MessageSquare className="h-5 w-5" />
            </span>
            <h3 className="text-lg font-bold">Залишити відгук</h3>
          </div>
          {reviewDone ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-emerald-600">
              <Check className="h-4 w-4" /> Дякуємо за відгук! Таймер «таяння» скинуто.
            </p>
          ) : (
            <>
              <div className="mt-3 flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(n)} aria-label={`${n} зірок`}>
                    <Star
                      className={`h-6 w-6 transition ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={3}
                placeholder="Поділись враженнями про гру чи послуги…"
                className="mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-amber-400 focus:bg-white"
              />
              {reviewErr && <p className="mt-1 text-xs font-semibold text-rose-600">{reviewErr}</p>}
              <button
                onClick={submitReview}
                disabled={reviewBusy}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
              >
                {reviewBusy ? 'Надсилаю…' : <><Send className="h-4 w-4" /> Надіслати відгук</>}
              </button>
            </>
          )}
        </div>
      </div>
      )}

      {/* Видача після покупки */}
      <AnimatePresence>
        {delivered && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDelivered(null)}
          >
            <motion.div
              className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                <Check className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-slate-900">Готово!</h3>
              <p className="mt-1 text-sm text-slate-500">«{delivered.title}» — оплачено монетами.</p>

              {delivered.delivery.type === 'link' ? (
                <a
                  href={delivered.delivery.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                >
                  <ExternalLink className="h-4 w-4" /> {delivered.delivery.label}
                </a>
              ) : (
                <p className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-100">
                  📞 Спеціаліст звʼяжеться з тобою найближчим часом, щоб видати нагороду. Заявку вже прийнято.
                </p>
              )}

              <button
                onClick={() => setDelivered(null)}
                className="mt-3 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                Закрити
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Wrapper>
  );
};

export default Prizes;
