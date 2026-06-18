import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Plus, Menu, X, User, HandHeart, Gamepad2, Gift, Brain, Phone, CalendarCheck } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';
import BrandMark from './BrandMark';
import { goToBooking } from '../hooks/useRoute';
import type { Route } from '../hooks/useRoute';

interface Props {
  balance: number;
  route: Route;
  onExchange: () => void;
}

const LINKS: { to: Route; label: string; href: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { to: 'about', label: 'Про мене', href: '#/about', icon: User },
  { to: 'services', label: 'Послуги', href: '#/services', icon: HandHeart },
  { to: 'game', label: 'Гра', href: '#/game', icon: Gamepad2 },
  { to: 'prizes', label: 'Призи', href: '#/prizes', icon: Gift },
  { to: 'philosophy', label: 'Філософія', href: '#/philosophy', icon: Brain },
];

const PHONE = '+380638069916';

const Navbar: React.FC<Props> = ({ balance, route, onExchange }) => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Блокуємо скрол сторінки, поки відкрите мобільне меню.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled || open ? 'glass border-b border-white/50 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#/" onClick={() => setOpen(false)} className="flex items-center gap-2.5">
          <motion.span whileHover={{ rotate: -6, scale: 1.06 }}>
            <BrandMark size={38} />
          </motion.span>
          <span className="leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight sm:text-lg">Центр розвитку та здоров'я</span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block">рух · баланс · відновлення</span>
          </span>
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          {LINKS.map((l) => (
            <a
              key={l.to}
              href={l.href}
              className={`relative transition hover:text-emerald-700 ${route === l.to ? 'font-bold text-emerald-700' : 'text-slate-600'}`}
            >
              {l.label}
              {route === l.to && (
                <motion.span layoutId="nav-underline" className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-emerald-500" />
              )}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 text-sm font-bold text-amber-600 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            <AnimatedNumber value={balance} />
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            onClick={onExchange}
            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Поповнити</span>
          </motion.button>
          <button
            onClick={() => setOpen((o) => !o)}
            className="grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-slate-600 ring-1 ring-slate-200 md:hidden"
            aria-label="Меню"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <X className="h-5 w-5" />
                </motion.span>
              ) : (
                <motion.span key="m" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Menu className="h-5 w-5" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile menu — повноекранна охайна панель */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-[60px] z-40 bg-slate-900/20 backdrop-blur-sm md:hidden"
            />
            <motion.nav
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-x-0 top-full z-50 origin-top border-t border-white/50 bg-white/95 backdrop-blur-xl shadow-xl md:hidden"
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-4">
                {LINKS.map((l, i) => {
                  const Icon = l.icon;
                  const active = route === l.to;
                  return (
                    <motion.a
                      key={l.to}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.04 * i, duration: 0.3 }}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-semibold transition ${
                        active ? 'bg-emerald-50 text-emerald-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <Icon className="h-4.5 w-4.5" />
                      </span>
                      {l.label}
                    </motion.a>
                  );
                })}

                <div className="mt-2 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <button
                    onClick={() => {
                      setOpen(false);
                      goToBooking();
                    }}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
                  >
                    <CalendarCheck className="h-4 w-4" /> Записатися
                  </button>
                  <a
                    href={`tel:${PHONE}`}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100 transition hover:bg-emerald-100"
                  >
                    <Phone className="h-4 w-4" /> Подзвонити
                  </a>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
