import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Coins } from 'lucide-react';
import type { Account } from '../hooks/useAccount';

interface Props {
  account: Account;
  onTopUp: () => void;
}

const AMOUNTS = [20, 50, 100, 200];

const Donate: React.FC<Props> = ({ account, onTopUp }) => {
  const [amount, setAmount] = useState(50);
  const [thanks, setThanks] = useState(false);

  const donate = async () => {
    if (account.balance < amount) {
      onTopUp();
      return;
    }
    if (await account.donate(amount)) {
      setThanks(true);
      window.setTimeout(() => setThanks(false), 2500);
    }
  };

  return (
    <section id="donate" className="mx-auto max-w-3xl px-5 py-14">
      <div className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-7 shadow-md">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-white">
          <Heart className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">Підтримати реабілітолога</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-600">
          Монетами зі свого балансу можна підтримати роботу спеціаліста. Це демо: згодом донати
          можна буде спрямовувати реабілітологу напряму.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {AMOUNTS.map((a) => (
            <button
              key={a}
              onClick={() => setAmount(a)}
              className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-semibold transition ${
                amount === a
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-emerald-300'
              }`}
            >
              <Coins className="h-3.5 w-3.5" />
              {a}
            </button>
          ))}
        </div>

        <button
          onClick={donate}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto sm:px-8"
        >
          <Heart className="h-5 w-5" />
          Задонатити {amount} монет
        </button>

        <AnimatePresence>
          {thanks && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 text-sm font-semibold text-emerald-700"
            >
              Дякуємо за підтримку! ❤️
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Donate;
