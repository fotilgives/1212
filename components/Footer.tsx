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
    <footer className="relative mt-10 overflow-hidden bg-slate-900 border-t border-slate-800">
      {/* Dark background image */}
      <div
        className="pointer-events-none absolute inset-0 opacity-80 mix-blend-overlay"
        style={{ backgroundImage: 'url(/images/footer-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40" />

      <div className="relative z-10 mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Бренд */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <BrandMark size={40} />
              <span className="text-base font-extrabold tracking-tight text-white">
                Центр розвитку та здоров'я
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              Масаж, фізична реабілітація, йога та навчання. Допомагаємо тілу відновити баланс, стабільність і свободу руху.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              <a href="https://instagram.com/center_rozvutky_vi" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-emerald-500 hover:text-white">
                <Instagram className="h-4.5 w-4.5" />
              </a>
              <a href="#" aria-label="Telegram" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-emerald-500 hover:text-white">
                <Send className="h-4.5 w-4.5" />
              </a>
              <a href="tel:+380638069916" aria-label="Телефон" className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-emerald-500 hover:text-white">
                <Phone className="h-4.5 w-4.5" />
              </a>
            </div>
          </div>

          {/* Розділи */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-400">Розділи</h3>
            <ul className="mt-4 space-y-2.5">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-slate-300 transition hover:text-emerald-400">
                    {l.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="#/prices" className="text-sm text-slate-300 transition hover:text-emerald-400">Ціни</a>
              </li>
              <li>
                <a href="#/location" className="text-sm text-slate-300 transition hover:text-emerald-400">Як нас знайти</a>
              </li>
            </ul>
          </div>

          {/* Послуги */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-400">Послуги</h3>
            <ul className="mt-4 space-y-2.5">
              {services.map((s) => (
                <li key={s} className="text-sm text-slate-300">{s}</li>
              ))}
            </ul>
          </div>

          {/* Контакти */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-emerald-400">Контакти</h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <a href="tel:+380638069916" className="transition hover:text-emerald-300">+38 (063) 806-99-16</a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>м. Вінниця · запис онлайн</span>
              </li>
            </ul>

            {/* Графік роботи */}
            <div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-md">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Clock className="h-4 w-4 text-emerald-400" /> Графік роботи
              </div>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Пн – Пт</dt>
                  <dd className="font-semibold text-white">9:00 – 18:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Сб</dt>
                  <dd className="font-semibold text-white">9:00 – 13:00</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-slate-400">Нд</dt>
                  <dd className="font-medium text-slate-500">вихідний</dd>
                </div>
              </dl>
            </div>

            <button
              onClick={goToBooking}
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900 transition hover:bg-emerald-500"
            >
              Записатися
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-slate-400 sm:flex-row">
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
