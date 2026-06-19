import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Lock, RotateCcw, CreditCard, Phone, Mail, MapPin } from 'lucide-react';

const SCHEDULE_NOTE = 'Пн – Пт 9:00–18:00 · Сб 9:00–13:00 · Нд — вихідний';

const SECTIONS = [
  { id: 'contacts', label: 'Контакти та реквізити', icon: Phone },
  { id: 'offer', label: 'Публічна оферта', icon: FileText },
  { id: 'privacy', label: 'Політика конфіденційності', icon: Lock },
  { id: 'refund', label: 'Повернення коштів', icon: RotateCcw },
  { id: 'payments', label: 'Безпека платежів', icon: CreditCard },
];

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="mt-3 text-sm leading-relaxed text-slate-600">{children}</p>
);
const H: React.FC<{ id: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }> = ({
  id,
  icon: Icon,
  children,
}) => (
  <h2 id={id} className="mt-12 flex scroll-mt-24 items-center gap-2.5 text-xl font-extrabold text-slate-900 first:mt-0 sm:text-2xl">
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
      <Icon className="h-5 w-5" />
    </span>
    {children}
  </h2>
);
const LI: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <li className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
    <span>{children}</span>
  </li>
);

const Legal: React.FC = () => {
  const [active, setActive] = useState('contacts');
  const go = (id: string) => {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <main className="mx-auto max-w-5xl px-5 pb-20 pt-12 sm:pt-16">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
        <span className="eyebrow">📄 Документи</span>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Правова інформація</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-500">
          Публічна оферта, політика конфіденційності, умови повернення коштів та безпека платежів.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[230px_1fr]">
        {/* Навігація */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => go(s.id)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition lg:text-sm ${
                    active === s.id ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" /> {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Зміст */}
        <article className="card-glow rounded-3xl p-6 ring-1 ring-white/60 sm:p-8">
          {/* Контакти */}
          <H id="contacts" icon={Phone}>
            Контакти та реквізити
          </H>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-start gap-2.5 text-sm text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  <b>Центр розвитку та здоров'я</b>
                  <br />
                  м. Вінниця, Україна
                </span>
              </div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
              <a href="tel:+380638069916" className="flex items-center gap-2.5 hover:text-emerald-700">
                <Phone className="h-4 w-4 text-emerald-600" /> +38 (063) 806-99-16
              </a>
              <a href="mailto:mazurartem2007@gmail.com" className="mt-2 flex items-center gap-2.5 hover:text-emerald-700">
                <Mail className="h-4 w-4 text-emerald-600" /> mazurartem2007@gmail.com
              </a>
              <p className="mt-2 text-xs text-slate-500">{SCHEDULE_NOTE}</p>
            </div>
          </div>
          <P>
            Продавець: <b>ФОП [Прізвище Ім'я По батькові]</b>, РНОКПП [__________], зареєстрований за адресою
            [______________]. Дані реквізити необхідно замінити на фактичні дані суб'єкта господарювання.
          </P>

          {/* Оферта */}
          <H id="offer" icon={FileText}>
            Публічна оферта (договір)
          </H>
          <P>
            Цей документ є офіційною публічною пропозицією (офертою) Центру розвитку та здоров'я (далі — «Центр»)
            щодо надання оздоровчих, реабілітаційних, освітніх та консультаційних послуг, а також прийняття
            добровільних благодійних внесків (донатів) через сайт.
          </P>
          <ul className="mt-3 space-y-2">
            <LI>Оплата послуги або здійснення внеску означає повну й беззастережну згоду з умовами цієї оферти.</LI>
            <LI>Вартість послуг визначається у розділі «Прайс»; ціни вказані у гривнях (UAH).</LI>
            <LI>Благодійний внесок (донат) є добровільним платежем і не передбачає зустрічного надання товару чи послуги.</LI>
            <LI>Запис на послугу здійснюється через форму на сайті або за телефоном; точний час узгоджується додатково.</LI>
            <LI>Центр має право відмовити у наданні послуги за наявності медичних протипоказань у клієнта.</LI>
          </ul>

          {/* Конфіденційність */}
          <H id="privacy" icon={Lock}>
            Політика конфіденційності
          </H>
          <P>
            Ми поважаємо вашу приватність і обробляємо персональні дані відповідно до Закону України «Про захист
            персональних даних». Надаючи свої дані, ви погоджуєтеся з умовами цієї політики.
          </P>
          <ul className="mt-3 space-y-2">
            <LI>
              <b>Які дані збираємо:</b> ім'я, номер телефону, e-mail та опис стану — лише ті, що ви добровільно
              вказуєте у формах запису чи оплати.
            </LI>
            <LI>
              <b>Мета обробки:</b> зв'язок із вами, узгодження запису, надання послуг, обробка платежів та надсилання
              квитанцій.
            </LI>
            <LI>
              <b>Платіжні дані:</b> номери карток ми <b>не отримуємо й не зберігаємо</b> — оплата відбувається на
              захищеній стороні платіжного сервісу WayForPay.
            </LI>
            <LI>
              <b>Передача третім особам:</b> дані не передаються стороннім, окрім платіжного провайдера в обсязі,
              потрібному для проведення платежу, та у випадках, передбачених законом.
            </LI>
            <LI>
              <b>Ваші права:</b> ви можете запросити доступ, виправлення або видалення своїх даних, написавши нам на
              e-mail.
            </LI>
            <LI>
              <b>Cookie:</b> сайт може використовувати технічні файли cookie для коректної роботи та аналітики.
            </LI>
          </ul>

          {/* Повернення */}
          <H id="refund" icon={RotateCcw}>
            Політика повернення коштів
          </H>
          <ul className="mt-3 space-y-2">
            <LI>Оплата за послугу, яка ще не була надана, може бути повернена за зверненням клієнта до дати візиту.</LI>
            <LI>
              Для повернення зверніться за телефоном або e-mail, вказавши дату й суму платежу. Розгляд — до 3 робочих
              днів, повернення коштів — у строки, встановлені банком/платіжним сервісом (зазвичай до 7 робочих днів).
            </LI>
            <LI>Кошти повертаються тим самим способом, яким було здійснено оплату.</LI>
            <LI>
              <b>Добровільні внески (донати)</b> поверненню не підлягають, окрім випадків помилкового або повторного
              списання — тоді кошти повертаються повністю.
            </LI>
          </ul>

          {/* Платежі */}
          <H id="payments" icon={CreditCard}>
            Безпека платежів
          </H>
          <P>
            Оплата на сайті здійснюється через сертифікований платіжний сервіс <b>WayForPay</b> з підтримкою карток
            Visa та Mastercard, а також Apple Pay і Google Pay.
          </P>
          <ul className="mt-3 space-y-2">
            <LI>З'єднання захищене протоколом HTTPS/TLS; дані картки вводяться на стороні платіжної системи.</LI>
            <LI>Сайт не має доступу до повних реквізитів вашої картки та не зберігає їх.</LI>
            <LI>Платежі обробляються згідно зі стандартом безпеки PCI DSS.</LI>
          </ul>
          <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            Усі платежі захищені. Ми ніколи не запитуємо PIN-код чи повні дані картки поза платіжною формою WayForPay.
          </div>
        </article>
      </div>
    </main>
  );
};

export default Legal;
