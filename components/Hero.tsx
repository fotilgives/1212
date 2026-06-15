import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Wallet, Shield, Coins, Heart } from 'lucide-react';

interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

const chips = [
  { icon: Coins, label: 'Монети замість грошей' },
  { icon: Shield, label: 'Чесний випадковий хід' },
  { icon: Heart, label: 'Підтримка реабілітолога' },
];

const Hero: React.FC<Props> = ({ onPlay, onExchange }) => {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-15%] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl sm:h-[460px] sm:w-[460px]" />
        <div className="absolute right-[-10%] top-[20%] h-[220px] w-[220px] rounded-full bg-teal-100/60 blur-3xl" />
        <div className="absolute left-[-10%] top-[40%] h-[200px] w-[200px] rounded-full bg-amber-100/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-10 pt-14 sm:pb-14 sm:pt-20 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Реабілітація · підтримка · трохи азарту
          </span>

          <h1 className="mt-5 text-[2rem] font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            Грай у <span className="text-emerald-600">камінь-ножиці-папір</span> та підтримуй реабілітацію
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:mt-5 sm:text-lg">
            Поповнюй баланс монетами, грай із суперником і за бажанням донать частину виграшу
            на роботу реабілітолога. Просто, зрозуміло та без зайвого.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-3">
            <button
              onClick={onPlay}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 active:scale-[0.98] sm:w-auto"
            >
              <Gamepad2 className="h-5 w-5" />
              Грати зараз
            </button>
            <button
              onClick={onExchange}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-base font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-emerald-300 active:scale-[0.98] sm:w-auto"
            >
              <Wallet className="h-5 w-5" />
              Поповнити баланс
            </button>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {chips.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100 backdrop-blur"
              >
                <Icon className="h-3.5 w-3.5 text-emerald-600" />
                {label}
              </span>
            ))}
          </div>

          <p className="mt-5 text-xs text-slate-400">
            Демо-режим. Реальні гроші не стягуються — це макет для демонстрації ідеї.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
