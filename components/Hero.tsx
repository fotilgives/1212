import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Gamepad2, Wallet, Shield, Coins, Heart } from 'lucide-react';

interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

const chips = [
  { icon: Coins, label: 'Монети замість грошей' },
  { icon: Shield, label: 'Чесний розрахунок' },
  { icon: Heart, label: 'Підтримка реабілітолога' },
];

const floats = [
  { e: '✊', x: '6%', y: '18%', d: 0 },
  { e: '✌️', x: '88%', y: '22%', d: 0.6 },
  { e: '✋', x: '12%', y: '70%', d: 1.2 },
  { e: '🪙', x: '84%', y: '68%', d: 0.3 },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const Hero: React.FC<Props> = ({ onPlay, onExchange }) => {
  return (
    <section id="top" className="relative overflow-hidden">
      {/* Floating emojis */}
      {floats.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute hidden text-4xl sm:block md:text-5xl"
          style={{ left: f.x, top: f.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1, y: [0, -16, 0], rotate: [0, 8, -8, 0] }}
          transition={{
            opacity: { delay: 0.4 + f.d, duration: 0.5 },
            scale: { delay: 0.4 + f.d, duration: 0.5 },
            y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 7 + i, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          <span className="drop-shadow-sm">{f.e}</span>
        </motion.div>
      ))}

      <div className="mx-auto max-w-6xl px-5 pb-12 pt-16 sm:pb-16 sm:pt-24 md:pt-28">
        <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-2xl text-center">
          <motion.span
            variants={item}
            className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100"
          >
            <motion.span animate={{ rotate: [0, 20, -20, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <Sparkles className="h-3.5 w-3.5" />
            </motion.span>
            Реабілітація · підтримка · трохи азарту
          </motion.span>

          <motion.h1
            variants={item}
            className="mt-6 text-[2.1rem] font-extrabold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl md:text-6xl"
          >
            Грай у <span className="text-gradient">камінь-ножиці-папір</span> та підтримуй реабілітацію
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-5 max-w-xl text-base text-slate-600 sm:text-lg">
            Заходь в онлайн-раунд, став монети разом з іншими гравцями та забирай спільний банк.
            Просто, живо й красиво.
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <motion.button
              onClick={onPlay}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="shine flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-emerald-300/50 transition hover:bg-emerald-700 sm:w-auto"
            >
              <Gamepad2 className="h-5 w-5" />
              Грати зараз
            </motion.button>
            <motion.button
              onClick={onExchange}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="glass flex w-full items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-emerald-300 sm:w-auto"
            >
              <Wallet className="h-5 w-5" />
              Поповнити баланс
            </motion.button>
          </motion.div>

          <motion.div variants={item} className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {chips.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-100"
              >
                <Icon className="h-3.5 w-3.5 text-emerald-600" />
                {label}
              </span>
            ))}
          </motion.div>

          <motion.p variants={item} className="mt-5 text-xs text-slate-400">
            Демо-режим на віртуальних монетах. Реальні гроші не стягуються.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
