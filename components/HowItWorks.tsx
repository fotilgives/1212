import React from 'react';
import { Wallet, Gamepad2, Heart } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: '1. Поповни баланс',
    text: 'Обмінюй гроші на ігрові монети. У демо-режимі монети нараховуються миттєво й безкоштовно.',
  },
  {
    icon: Gamepad2,
    title: '2. Зіграй',
    text: 'Обери ставку та свій хід — камінь, ножиці чи папір. Виграєш — монети подвоюються.',
  },
  {
    icon: Heart,
    title: '3. Підтримай',
    text: 'Частину монет можна задонатити на роботу реабілітолога прямо із сайту.',
  },
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-14">
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 md:text-3xl">
        Як це працює
      </h2>
      <div className="mt-9 grid gap-5 md:grid-cols-3">
        {steps.map(({ icon: Icon, title, text }) => (
          <div
            key={title}
            className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition hover:shadow-md"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
