import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Wifi, CalendarCheck } from 'lucide-react';
import PriceList from '../PriceList';
import { goToBooking } from '../../hooks/useRoute';

const COURSE_TOPICS = [
  'Вступ до йоги',
  'Дихання',
  'Біомеханіка тіла',
  'Види тренінгу',
  'Анатомічні поїзди',
  'Складання комплексу',
];

const Prices: React.FC = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-5 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center"
      >
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          Вартість послуг
        </h1>
        <p className="mt-4 text-slate-500 max-w-2xl mx-auto">
          Прозорі ціни на всі види масажу та реабілітації. Інвестуйте у своє здоров'я та комфорт.
        </p>
      </motion.div>

      {/* Онлайн-курс з йоги — фічерна картка */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-900/5"
      >
        <div className="grid items-stretch md:grid-cols-2">
          {/* Постер курсу — показуємо повністю, без обрізки */}
          <div className="relative flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-6">
            <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
              <Wifi className="h-3.5 w-3.5" /> Онлайн-курс
            </span>
            <img
              src="/images/yoga_course.jpg"
              alt="Курс з йоги — Мальцев Володимир"
              className="max-h-[460px] w-auto max-w-full rounded-2xl object-contain shadow-lg"
            />
          </div>

          <div className="flex flex-col p-6 sm:p-8">
            <span className="eyebrow">🧘 Авторський курс · Мальцев Володимир</span>
            <h2 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-slate-900">
              Курс з йоги
            </h2>
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              Інтеграція технік йоги в структуру анатомічних поїздів
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Онлайн-курс у власному темпі: від основ і дихання до біомеханіки тіла й складання
              власного комплексу. Підійде і початківцям, і досвідченим.
            </p>

            <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {COURSE_TOPICS.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-slate-600">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> {t}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-extrabold text-emerald-700">
                  2500 <span className="text-base font-semibold text-slate-400">грн</span>
                </div>
                <div className="text-[11px] text-slate-400">повний доступ до курсу</div>
              </div>
              <button
                onClick={goToBooking}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
              >
                <CalendarCheck className="h-4 w-4" /> Записатися на курс
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <PriceList />
      </motion.div>
    </div>
  );
};

export default Prices;
