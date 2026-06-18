import React from 'react';
import { motion } from 'framer-motion';
import { Phone, CalendarCheck, Sparkles } from 'lucide-react';
import { navigate } from '../hooks/useRoute';
import Reveal from './Reveal';

/**
 * Фінальна преміум-секція із закликом до дії перед футером.
 */
const FinalCTA: React.FC = () => {
  return (
    <section className="mx-auto max-w-5xl px-5 py-16">
      <Reveal
        amount={0.3}
        className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-600 via-emerald-600 to-teal-600 px-6 py-12 text-center text-white shadow-2xl shadow-emerald-300/40 sm:px-12 sm:py-16"
      >
        {/* Декоративні світні плями */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />

        <motion.span
          initial={{ scale: 0.9, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="relative inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider ring-1 ring-white/20"
        >
          <Sparkles className="h-3.5 w-3.5" /> Перший крок до відновлення
        </motion.span>

        <h2 className="relative mx-auto mt-5 max-w-2xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Готові повернути собі рух, силу та баланс?
        </h2>
        <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-emerald-50 sm:text-base">
          Залиште заявку або зателефонуйте — підберемо індивідуальну програму відновлення саме під ваш стан.
        </p>

        <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('services')}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-emerald-700 shadow-lg transition hover:bg-emerald-50 sm:w-auto"
          >
            <CalendarCheck className="h-5 w-5" /> Записатися на прийом
          </motion.button>
          <motion.a
            href="tel:+380638069916"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700/40 px-7 py-3.5 text-sm font-bold text-white ring-1 ring-white/30 transition hover:bg-emerald-700/60 sm:w-auto"
          >
            <Phone className="h-5 w-5" /> +38 (063) 806-99-16
          </motion.a>
        </div>
      </Reveal>
    </section>
  );
};

export default FinalCTA;
