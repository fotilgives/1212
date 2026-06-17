import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Gamepad2,
  Award,
  BookOpen,
  Heart,
  Sparkles,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import ZoomImage from './ZoomImage';

// ─── Stats ───────────────────────────────────────────────────────────────────
const stats = [
  { v: '15+', l: 'років\nдосвіду' },
  { v: '1000+', l: 'задоволених\nклієнтів' },
  { v: '11', l: 'унікальних\nметодик' },
];

// ─── Expandable bio cards ─────────────────────────────────────────────────────
const cards = [
  {
    id: 'directions',
    icon: Heart,
    color: 'emerald',
    title: 'Напрямки роботи',
    items: [
      'Лікувальний та оздоровчий масаж',
      'Тайський масаж',
      'Юмейхо-терапія та фасціальні техніки',
      'Лікувальна фізкультура (ЛФК)',
      'Динамічна нейром\'язова стабілізація (DNS)',
      'Redcord-терапія · Blomberg Therapy',
      'Йога та тілесні практики',
    ],
  },
  {
    id: 'education',
    icon: BookOpen,
    color: 'teal',
    title: 'Навчання та курси',
    items: [
      'Курси йоги для всіх рівнів',
      'Навчальні курси масажу',
      'Тайський масаж — повний курс',
      'Онлайн-програми самостійної практики',
    ],
  },
  {
    id: 'approach',
    icon: Award,
    color: 'sky',
    title: 'Мій підхід',
    items: [
      'Індивідуальна програма відновлення',
      'Поєднання сучасних методик',
      'Робота з тілом через рух та баланс',
      'Підтримка на кожному етапі відновлення',
    ],
  },
];

// ─── Floating decorative emoji ────────────────────────────────────────────────
const floats = [
  { e: '🤲', x: '4%', y: '18%', d: 0 },
  { e: '🌿', x: '92%', y: '22%', d: 0.6 },
  { e: '⚖️', x: '6%', y: '72%', d: 1.1 },
  { e: '✨', x: '91%', y: '68%', d: 0.3 },
];

// ─── Animation variants ───────────────────────────────────────────────────────
const slideLeft = {
  hidden: { opacity: 0, x: -32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] } },
};
const slideRight = {
  hidden: { opacity: 0, x: 32 },
  show: { opacity: 1, x: 0, transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1], delay: 0.08 } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Color map ────────────────────────────────────────────────────────────────
const colorMap: Record<string, { active: string; idle: string; dot: string }> = {
  emerald: {
    active: 'bg-emerald-600 text-white shadow-emerald-200',
    idle: 'bg-emerald-50 text-emerald-600',
    dot: 'bg-emerald-500',
  },
  teal: {
    active: 'bg-teal-600 text-white shadow-teal-200',
    idle: 'bg-teal-50 text-teal-600',
    dot: 'bg-teal-500',
  },
  sky: {
    active: 'bg-sky-600 text-white shadow-sky-200',
    idle: 'bg-sky-50 text-sky-600',
    dot: 'bg-sky-500',
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onPlay: () => void;
  onExchange: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
const Hero: React.FC<Props> = ({ onPlay }) => {
  const [openCard, setOpenCard] = useState<string | null>('directions');

  const toggle = (id: string) => setOpenCard((cur) => (cur === id ? null : id));

  return (
    <section id="top" className="hero-section relative overflow-hidden">
      {/* ── Background layers ─────────────────────────────── */}
      <div className="hero-bg-layer" />
      <div className="hero-bg-grid" />
      <div className="hero-glow-left" />
      <div className="hero-glow-right" />

      {/* ── Decorative floating emoji (desktop only) ─────── */}
      {floats.map((f, i) => (
        <motion.div
          key={i}
          className="pointer-events-none absolute hidden text-3xl lg:block"
          style={{ left: f.x, top: f.y }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.55, scale: 1, y: [0, -14, 0], rotate: [0, 6, -6, 0] }}
          transition={{
            opacity: { delay: 0.6 + f.d, duration: 0.5 },
            scale: { delay: 0.6 + f.d, duration: 0.5 },
            y: { duration: 5 + i, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 7 + i, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          {f.e}
        </motion.div>
      ))}

      {/* ── Content grid ─────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-24">
        <div className="hero-grid">

          {/* ════════════ LEFT — Photo ════════════ */}
          <motion.div
            variants={slideLeft}
            initial="hidden"
            animate="show"
            className="hero-photo-col"
          >
            {/* Ambient glow ring */}
            <motion.div
              className="hero-photo-glow"
              animate={{ opacity: [0.55, 0.85, 0.55], scale: [1, 1.04, 1] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Photo card */}
            <div className="hero-photo-card">
              <ZoomImage
                src="/images/about.jpg"
                alt="Володимир Мальцев — масажист-реабілітолог"
                caption="Фото скоро з'явиться"
                ratio="aspect-[3/4]"
                className="!rounded-[1.75rem]"
              />

              {/* Badge overlay at bottom */}
              <div className="hero-photo-badge">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="glass rounded-2xl px-4 py-3 ring-1 ring-white/70 shadow-xl"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 leading-tight">Володимир Мальцев</div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">Масажист-реабілітолог</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating stat pill */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="hero-stat-pill"
              >
                <div className="text-xl font-extrabold text-emerald-700 leading-none">15+</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight">років<br/>досвіду</div>
              </motion.div>
            </div>

            {/* Location tag */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-4 flex items-center justify-center gap-1.5 text-sm text-slate-500"
            >
              <MapPin className="h-3.5 w-3.5 text-emerald-600" />
              Вінниця, Україна
            </motion.div>
          </motion.div>

          {/* ════════════ RIGHT — Profile info ════════════ */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="flex flex-col gap-5"
          >
            {/* Eyebrow badge */}
            <motion.span variants={fadeUp} className="eyebrow self-start gap-1.5">
              <motion.span animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 3, repeat: Infinity }}>
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              Реабілітація · відновлення · баланс
            </motion.span>

            {/* Headline */}
            <motion.div variants={fadeUp}>
              <h1 className="hero-headline">
                Про мене —{' '}
                <span className="text-gradient">Володимир</span>
                <br />
                <span className="text-gradient">Мальцев</span>
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-[17px]">
                Масажист-реабілітолог із понад{' '}
                <b className="text-slate-800">15-річним досвідом</b> у відновленні здоров'я, руху та фізичній
                реабілітації. Не просто знімаю біль — допомагаю тілу знайти{' '}
                <b className="text-slate-800">баланс, стабільність і свободу руху</b>.
              </p>
            </motion.div>

            {/* Stats row */}
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
              {stats.map((s) => (
                <div key={s.l} className="hero-stat-card">
                  <div className="text-xl font-extrabold tracking-tight text-emerald-700 sm:text-2xl">
                    {s.v}
                  </div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-wide text-slate-400 whitespace-pre-line leading-tight">
                    {s.l}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Expandable bio cards */}
            <motion.div variants={fadeUp} className="space-y-2">
              {cards.map(({ id, icon: Icon, color, title, items }) => {
                const isOpen = openCard === id;
                const c = colorMap[color];
                return (
                  <div
                    key={id}
                    className={`overflow-hidden rounded-2xl ring-1 transition-all duration-300 ${
                      isOpen
                        ? 'bg-white/90 ring-emerald-200 shadow-lg shadow-emerald-900/5'
                        : 'glass ring-white/60 hover:ring-emerald-200 hover:shadow-md'
                    }`}
                  >
                    <button
                      onClick={() => toggle(id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                    >
                      <span
                        className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl transition shadow-sm ${
                          isOpen ? `${c.active} shadow-md` : c.idle
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 text-sm font-bold text-slate-900">{title}</span>
                      <motion.span
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="shrink-0 text-slate-400"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="body"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-slate-100 px-4 pb-4 pt-3">
                            <ul className="space-y-2">
                              {items.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>

            {/* CTA buttons */}
            <motion.div variants={fadeUp} className="flex flex-col gap-3 sm:flex-row">
              <motion.a
                href="tel:+380XXXXXXXXX"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="shine flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-300/50 transition hover:bg-emerald-700 sm:py-3.5"
              >
                <Phone className="h-5 w-5" />
                Записатися на прийом
              </motion.a>
              <motion.button
                onClick={onPlay}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="glass flex items-center justify-center gap-2 rounded-full px-7 py-4 text-base font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:ring-emerald-300 hover:shadow-md sm:py-3.5"
              >
                <Gamepad2 className="h-5 w-5 text-emerald-600" />
                Грати й заробляти бонуси
              </motion.button>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
