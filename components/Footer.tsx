import React from 'react';
import { Instagram, Send, Phone, MapPin, Heart, Clock } from 'lucide-react';
import BrandMark from './BrandMark';
import { goToBooking } from '../hooks/useRoute';

const navLinks: { label: string; href: string }[] = [
  { label: 'Про мене', href: '#/about' },
  { label: 'Послуги', href: '#/services' },
  { label: 'Гра', href: '#/game' },
  { label: 'Призи', href: '#/prizes' },
  { label: 'Філософія', href: '#/philosophy' },
];

const services = ['Лікувальний масаж', 'Реабілітація', 'Йога та практики', 'Курси й навчання'];

const Footer: React.FC = () => {
  return (
    <footer className="mt-10 border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Бренд */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark size={40} />
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                Центр розвитку та здоров'я
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Масаж, фізична реабілітація, йога та навчання. Допомагаємо тілу відновити баланс, стабільність і свободу руху.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <a href="https://instagram.com/center_rozvutky_vi" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-emerald-600 hover:text-white">
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a href="#" aria-label="Telegram" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-emerald-600 hover:text-white">
                <Send className="h-4.5 w-4.5" />
              </a>
              <a href="tel:+380638069916" aria-label="Телефон" className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-500 transition hover:bg-emerald-600 hover:text-white">
                <Phone className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* Розділи */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Розділи</h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-slate-600 transition hover:text-emerald-700">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Послуги */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Послуги</h3>
            <ul className="mt-4 space-y-2.5">
              {services.map((s) => (
                <li key={s} className="text-sm text-slate-600">{s}</li>
              ))}
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-400">Контакти</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <a href="tel:+380638069916" className="transition hover:text-emerald-700">+38 (063) 806-99-16</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>Україна · запис онлайн</span>
              </li>
            </ul>

            {/* Графік роботи */}
            <div className="mt-5 rounded-2xl bg-emerald-50/70 p-4 ring-1 ring-emerald-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <Clock className="h-4 w-4 text-emerald-600" /> Графік роботи
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Пн – Пт</dt>
                  <dd className="font-semibold text-slate-800">9:00 – 18:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Сб</dt>
                  <dd className="font-semibold text-slate-800">9:00 – 13:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-500">Нд</dt>
                  <dd className="font-medium text-slate-400">вихідний</dd>
                </div>
              </dl>
            </div>

            <button
              onClick={goToBooking}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
            >
              Записатися
            </button>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} Центр розвитку та здоров'я. Усі права захищені.</p>
          <p className="flex items-center gap-1.5">
            Зроблено з <Heart className="h-3.5 w-3.5 text-emerald-500" /> для здоров'я та руху
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
