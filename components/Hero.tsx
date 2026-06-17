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
  CheckCircle2,
} from 'lucide-react';
import ZoomImage from './ZoomImage';

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { v: '15+', l: 'років\nдосвіду' },
  { v: '1000+', l: 'клієнтів' },
  { v: '11', l: 'методик' },
];

const cards = [
  {
    id: 'directions',
    icon: Heart,
    color: 'emerald' as const,
    title: 'Напрямки роботи',
    items: [
      'Лікувальний та оздоровчий масаж',
      'Тайський масаж',
      'Юмейхо-терапія та фасціальні техніки',
      'Лікувальна фізкультура (ЛФК)',
      "Динамічна нейром'язова стабілізація (DNS)",
      'Redcord-терапія - Blomberg Therapy',
      'Йога та тілесні практики',
    ],
  },
  {
    id: 'education',
    icon: BookOpen,
    color: 'teal' as const,
    title: 'Навчання та курси',
    items: [
      'Курси йоги для всіх рівнів',
      'Навчальні курси масажу',
      'Тайський масаж - повний курс',
      'Онлайн-програми самостійної практики',
    ],
  },
  {
    id: 'approach',
    icon: Award,
    color: 'sky' as const,
    title: 'Мій підхід',
    items: [
      'Індивідуальна програма відновлення',
      'Поєднання сучасних методик',
      'Робота з тілом через рух та баланс',
      'Підтримка на кожному етапі',
    ],
  },
];

const reasons = [
  {
    icon: '🏅',
    title: '15+ років досвіду',
    desc: 'Глибока практика реабілітаційної медицини та мануальних технік',
  },
  {
    icon: '🎯',
    title: 'Індивідуальний підхід',
    desc: 'Кожна програма відновлення створюється спеціально для вас',
  },
  {
    icon: '🔬',
    title: 'Сучасні методики',
    desc: 'DNS, Redcord, Blomberg Therapy та фасціальні техніки',
  },
  {
    icon: '🌱',
    title: 'Комплексне відновлення',
    desc: 'Масаж, ЛФК, йога та тілесні практики в єдиній системі',
  },
];

const colorMap = {
  emerald: { active: 'bg-emerald-600 text-white', idle: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' },
  teal:    { active: 'bg-teal-600 text-white',    idle: 'bg-teal-50 text-teal-600',       dot: 'bg-teal-500'    },
  sky:     { active: 'bg-sky-600 text-white',     idle: 'bg-sky-50 text-sky-600',         dot: 'bg-sky-500'     },
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
    <section id="top" className="relative overflow-x-hidden">

      {/* ── Background ──────────────────────────────────────────── */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-white to-teal-50/40" />
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage: 'radial-gradient(rgba(16,185,129,0.09) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          WebkitMaskImage: 'radial-gradient(ellipse at 40% 50%, #000 25%, transparent 72%)',
          maskImage: 'radial-gradient(ellipse at 40% 50%, #000 25%, transparent 72%)',
        }}
      />
      {/* Glow blobs */}
      <div className="pointer-events-none absolute left-[8%] top-[20%] -z-10 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[10%] right-[5%] -z-10 h-56 w-56 rounded-full bg-teal-200/20 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:py-24">

        {/* ══════════ MAIN HERO GRID ══════════ */}
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] lg:gap-14">

          {/* ── Photo column ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            /* relative here is critical - so the stat pill is positioned relative to this div */
            className="relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-none"
          >
            {/* Glow ring behind photo */}
            <motion.div
              className="pointer-events-none absolute -inset-3 -z-0 rounded-[2.25rem] bg-gradient-to-br from-emerald-300/35 via-teal-200/25 to-sky-200/15 blur-2xl"
              animate={{ opacity: [0.55, 0.85, 0.55] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* Photo card */}
            <div className="relative z-10 overflow-hidden rounded-[1.75rem] shadow-2xl shadow-emerald-900/15 ring-1 ring-white/80">
              <ZoomImage
                src="/images/about.jpg"
                alt="Володимир Мальцев - масажист-реабілітолог"
                caption="Фото скоро з'явиться"
                ratio="aspect-[3/4]"
              />

              {/* Name badge at photo bottom */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-3">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="glass rounded-2xl px-4 py-2.5 ring-1 ring-white/60 shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                      <div className="text-sm font-extrabold text-slate-900 leading-tight">
                        Володимир Мальцев
                      </div>
                      <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                        Масажист-реабілітолог
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Floating stat pill - desktop only, positioned relative to .relative parent */}
            <motion.div
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="absolute -right-3 -top-3 z-20 hidden lg:block glass rounded-2xl px-3 py-2.5 text-center shadow-xl ring-1 ring-white/70"
            >
              <div className="text-2xl font-black leading-none text-emerald-700">15+</div>
              <div className="mt-0.5 text-[9px] font-bold uppercase tracking-widest text-slate-500">
                років
                <br />
                досвіду
              </div>
            </motion.div>
          </motion.div>

          {/* ── Info column ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            {/* Eyebrow */}
            <motion.span
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="eyebrow self-start gap-1.5"
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              Реабілітація - відновлення - баланс
            </motion.span>

            {/* Headline */}
            <div>
              <h1
                className="font-black leading-[1.06] tracking-tight text-slate-900"
                style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}
              >
                Про мене -{' '}
                <span className="text-gradient">Володимир</span>
                <br />
                <span className="text-gradient">Мальцев</span>
              </h1>
              <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-[17px]">
                Масажист-реабілітолог із понад{' '}
                <b className="text-slate-800">15 роками досвіду</b>. Не просто знімаю
                біль - допомагаю тілу знайти{' '}
                <b className="text-slate-800">баланс, стабільність і свободу руху</b>.
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2.5">
              {stats.map((s) => (
                <div
                  key={s.l}
                  className="card-glow rounded-2xl px-2 py-3 text-center ring-1 ring-white/60"
                >
                  <div className="text-xl font-extrabold tracking-tight text-emerald-700 sm:text-2xl">
                    {s.v}
                  </div>
                  <div className="mt-1 whitespace-pre-line text-[10px] font-bold uppercase leading-tight tracking-wide text-slate-400">
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

            {/* Expandable bio cards */}
            <div className="space-y-2">
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
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl transition shadow-sm ${
                          isOpen ? c.active : c.idle
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
                            <ul className="space-y-1.5">
                              {items.map((item) => (
                                <li
                                  key={item}
                                  className="flex items-start gap-2 text-sm text-slate-600"
                                >
                                  <span
                                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`}
                                  />
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
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <motion.a
                href="tel:+380XXXXXXXXX"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="shine flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-300/50 transition hover:bg-emerald-700"
              >
                <Phone className="h-4 w-4" />
                Записатися на прийом
              </motion.a>
              <motion.button
                onClick={onPlay}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="glass flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold text-slate-700 ring-1 ring-slate-200 transition hover:ring-emerald-300 hover:shadow-md"
              >
                <Gamepad2 className="h-4 w-4 text-emerald-600" />
                Грати - заробляти бонуси
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* ══════════ WHY CHOOSE ME ══════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6 }}
          className="mt-14 lg:mt-20"
        >
          <div className="mb-5 text-center">
            <span className="eyebrow">⭐ Чому обирають мене</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {reasons.map(({ icon, title, desc }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.45, delay: i * 0.07 }}
                whileHover={{ y: -4 }}
                className="glass rounded-3xl p-4 ring-1 ring-white/60 transition hover:shadow-lg hover:shadow-emerald-900/5 sm:p-5"
              >
                <div className="mb-2.5 text-2xl sm:text-3xl">{icon}</div>
                <div className="text-sm font-bold text-slate-900 sm:text-[15px]">{title}</div>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500 sm:text-sm">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default Hero;
