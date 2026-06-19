import React from 'react';
import { motion } from 'framer-motion';
import { HandHeart, MessageCircle, Heart } from 'lucide-react';

interface Member {
  name: string;
  role: string;
  desc: string;
  image: string;
  icon: React.ComponentType<{ className?: string }>;
  tags: string[];
  /** Точка фокуса фото при обрізанні (object-position). */
  objectPos?: string;
}

const MEMBERS: Member[] = [
  {
    name: 'Володимир Мальцев',
    role: 'Масажист-реабілітолог',
    image: '/images/team_vlad.jpg',
    icon: HandHeart,
    objectPos: 'object-top',
    desc: 'Оздоровчий, баночний, тайський масаж. Відновлення після травм, інсультів, операцій. Робота зі сколіозом. Індивідуальний підхід до кожного пацієнта.',
    tags: ['Оздоровчий масаж', 'Баночний масаж', 'Реабілітація'],
  },
  {
    name: 'Станіслава Шимонюк',
    role: 'Логопед-дефектолог',
    image: '/images/team_logoped.jpg',
    icon: MessageCircle,
    objectPos: 'object-top',
    desc: 'Працює з дітками та дорослими. Запуск мовлення, постановка звуків та вимови. Працює із порушеннями мовлення: алалія, дизартрія, заїкування.',
    tags: ['Звуковимова', 'Розвиток мовлення', 'Алалія та заїкування'],
  },
  {
    name: 'Кородзієвська Сніжана',
    role: 'Дитячий психолог',
    image: '/images/team_psych.jpg',
    icon: Heart,
    objectPos: 'object-top',
    desc: 'Психологічна діагностика, корекційно-розвивальні заняття. Сенсорна інтеграція, арт-терапія, нейрокорекція. М´яка підтримка дитини в безпечному просторі.',
    tags: ['Діагностика', 'Арт-терапія', 'Нейрокорекція'],
  },
  {
    name: 'Наталія Атоян',
    role: 'Інструктор йоги та масажист',
    image: '/images/team_natalia.jpg',
    icon: HandHeart,
    objectPos: 'object-top',
    desc: 'Інструктор дитячої та дорослої йоги. Масажист: класичний, релакс, лімфодренажний, тайський та масаж обличчя. Індивідуальний підхід.',
    tags: ['Йога', 'Лімфодренаж', 'Масаж обличчя'],
  },
];

const Team: React.FC = () => {
  return (
    <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
      {MEMBERS.map((m, i) => {
        const Icon = m.icon;
        return (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            className="group overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-shadow hover:shadow-lg hover:shadow-emerald-900/5"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
              <img
                src={m.image}
                alt={m.name}
                loading="lazy"
                className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${m.objectPos || 'object-center'}`}
              />
              <span className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-xl bg-white/85 text-emerald-600 shadow-sm backdrop-blur">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/70 to-transparent p-3 pt-10 sm:p-4">
                <h3 className="text-sm font-extrabold leading-tight text-white sm:text-base">{m.name}</h3>
                <p className="text-[10px] font-semibold text-emerald-200 sm:text-xs">{m.role}</p>
              </div>
            </div>
            <div className="p-3 sm:p-5">
              <p className="text-[11px] leading-relaxed text-slate-600 sm:text-sm line-clamp-4 sm:line-clamp-none">{m.desc}</p>
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-emerald-50 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-100"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default Team;
