import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Wallet } from 'lucide-react';

interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

const Hero: React.FC<Props> = ({ onPlay, onExchange }) => {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-100 blur-3xl opacity-60" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
            <Sparkles className="h-3.5 w-3.5" />
            Реабілітація · підтримка · трохи азарту
          </span>

          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 md:text-6xl">
            Грай у <span className="text-emerald-600">камінь-ножиці-папір</span> та підтримуй реабілітацію
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            Поповнюй баланс монетами, грай із суперником і за бажанням донать частину виграшу
            на роботу реабілітолога. Просто, зрозуміло та без зайвого.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={onPlay}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 sm:w-auto"
            >
              <Gamepad2 className="h-5 w-5" />
              Грати зараз
            </button>
            <button
              onClick={onExchange}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-emerald-300 sm:w-auto"
            >
              <Wallet className="h-5 w-5" />
              Поповнити баланс
            </button>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            Демо-режим. Реальні гроші не стягуються — це макет для демонстрації ідеї.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
