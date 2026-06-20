import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PlayCircle, Wifi, CalendarCheck } from 'lucide-react';
import PriceList from '../PriceList';
import { goToBooking } from '../../hooks/useRoute';

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
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-[220px] md:min-h-[300px]">
            <img
              src="/images/yoga_service.jpg"
              alt="Онлайн-курс з йоги"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent md:bg-gradient-to-r" />
            <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-emerald-700 shadow-sm backdrop-blur">
              <Wifi className="h-3.5 w-3.5" /> Онлайн
            </span>
          </div>

          <div className="p-6 sm:p-8">
            <span className="eyebrow">🧘 Онлайн-курс</span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">Курс з йоги онлайн</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Повноцінний курс йоги у власному темпі: відеоуроки, дихальні практики та супровід.
              Займайтеся з будь-якого пристрою, у зручний час.
            </p>

            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4 shrink-0 text-emerald-600" /> Доступ до всіх відеоуроків курсу
              </li>
              <li className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 shrink-0 text-emerald-600" /> Практики для початківців і досвідчених
              </li>
            </ul>

            <div className="mt-5 flex flex-wrap items-end justify-between gap-3">
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
