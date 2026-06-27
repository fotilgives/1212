import React, { Suspense, lazy, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import HowItWorks from './components/HowItWorks';
import HomeSections from './components/HomeSections';
import PoolGame from './components/PoolGame';
import Leaderboard from './components/Leaderboard';
import Footer from './components/Footer';
import ExchangeModal from './components/ExchangeModal';
import Profile from './components/pages/Profile';
import Background from './components/Background';
import About from './components/pages/About';
import Services from './components/pages/Services';
import Prizes from './components/pages/Prizes';
import Philosophy from './components/pages/Philosophy';
import FloatingContact from './components/FloatingContact';
import RehabDetails from './components/RehabDetails';
import PriceList from './components/PriceList';
import YogaCourseCard from './components/YogaCourseCard';
import MediaShowcase from './components/MediaShowcase';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import FinalCTA from './components/FinalCTA';
import ReviewsWall from './components/ReviewsWall';
import { useAccount } from './hooks/useAccount';
import { useRoute, navigate } from './hooks/useRoute';

import LocationPage from './components/pages/Location';
import PricesPage from './components/pages/Prices';
import Support from './components/pages/Support';
import Legal from './components/pages/Legal';
import AuthModal from './components/AuthModal';

const Admin = lazy(() => import('./components/pages/Admin'));

const App: React.FC = () => {
  const account = useAccount();
  const route = useRoute();
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [thanks, setThanks] = useState<null | 'donate' | 'topup' | 'course'>(null);

  const openExchange = () => {
    if (!account.isAccount) {
      setAuthOpen(true);
    } else {
      setExchangeOpen(true);
    }
  };

  // Історія покупок тепер живе в кабінеті (окрема сторінка).
  const openHistory = () => {
    setExchangeOpen(false);
    navigate('profile');
  };

  // Нові гості (без збереженого акаунта) → одразу показуємо реєстрацію.
  // Реф-гостей (?ref=) завжди ведемо на реєстрацію (модалка сама перемикається
  // на «Реєстрація» і підставляє код запрошення), щоб не лишались гостями.
  useEffect(() => {
    if (!account.ready) return;
    if (account.isAccount) return;
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) { setAuthOpen(true); return; }
    const seen = localStorage.getItem('rps_auth_seen');
    if (seen) return;
    localStorage.setItem('rps_auth_seen', '1');
    setAuthOpen(true);
  }, [account.ready, account.isAccount]);

  // Подяка після успішної оплати (WayForPay повертає на /api/wayforpay-return).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDonate = params.get('donate') === 'thanks';
    const isTopup = params.get('topup') === 'thanks';
    const isCourse = params.get('course') === 'thanks';
    if (isDonate || isTopup || isCourse) {
      setThanks(isCourse ? 'course' : isTopup ? 'topup' : 'donate');
      window.history.replaceState({}, '', window.location.pathname + (window.location.hash || '#/'));
      if (isTopup) {
        // монети нараховує серверний callback; оновлюємо баланс (realtime теж підхопить).
        setTimeout(() => account.refresh(), 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Адмін-панель — окрема повноекранна сторінка (/admin).
  if (route === 'admin') {
    return (
      <Suspense fallback={<div className="grid min-h-screen place-items-center bg-slate-900 text-slate-400">Завантаження…</div>}>
        <Admin />
      </Suspense>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <ScrollProgress />
      <Background />
      <Navbar balance={account.balance} route={route} onExchange={openExchange} account={account} onLogin={() => setAuthOpen(true)} />

      <div className="flex-1">
      <AnimatePresence mode="wait">
        <motion.div
          key={route}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          {route === 'home' && (
            <main>
              <Hero onPlay={() => navigate('game')} onExchange={openExchange} />
              <HowItWorks />
              <HomeSections account={account} onExchange={openExchange} onLogin={() => setAuthOpen(true)} />
              <MediaShowcase />
              <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-5">
                <YogaCourseCard account={account} />
                <PriceList />
              </section>
              <RehabDetails />
              <ReviewsWall />
              <FinalCTA />
            </main>
          )}

          {route === 'game' && (
            <main>
              <PoolGame account={account} onTopUp={openExchange} onLogin={() => setAuthOpen(true)} />
              <Leaderboard account={account} />
            </main>
          )}

          {route === 'about' && <About />}
          {route === 'services' && <Services />}
          {route === 'prizes' && <Prizes account={account} onTopUp={openExchange} onLogin={() => setAuthOpen(true)} onHistory={openHistory} />}
          {route === 'profile' && <Profile account={account} onTopUp={openExchange} onLogin={() => setAuthOpen(true)} />}
          {route === 'philosophy' && <Philosophy />}
          {route === 'prices' && <PricesPage account={account} />}
          {route === 'location' && <LocationPage />}
          {route === 'donate' && <Support />}
          {route === 'legal' && <Legal />}
        </motion.div>
      </AnimatePresence>
      </div>

      <Footer />

      {/* Подяка після оплати (донат або поповнення монет) */}
      <AnimatePresence>
        {thanks && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setThanks(null)}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm overflow-hidden rounded-[1.75rem] bg-white shadow-2xl"
            >
              {/* Градієнтна шапка з анімованим бейджем */}
              <div className="relative flex flex-col items-center gap-3 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 px-6 pb-7 pt-8 text-center">
                <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-teal-300/20 blur-3xl" />
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
                  className="relative grid h-20 w-20 place-items-center rounded-full bg-white text-4xl shadow-lg ring-4 ring-white/40"
                >
                  {thanks === 'topup' ? '🪙' : thanks === 'course' ? '🧘' : '❤️'}
                </motion.div>
                <h3 className="relative text-xl font-black text-white">
                  {thanks === 'topup' ? 'Оплату отримано!' : thanks === 'course' ? 'Дякуємо за покупку!' : 'Дякуємо за підтримку!'}
                </h3>
              </div>

              {/* Текст + кнопка */}
              <div className="px-6 pb-6 pt-5 text-center">
                <p className="text-sm leading-relaxed text-slate-500">
                  {thanks === 'topup'
                    ? 'Монети зараховуються на ваш баланс протягом кількох секунд.'
                    : thanks === 'course'
                    ? 'Доступ до курсу з йоги надішлемо на вашу пошту найближчим часом. Дякуємо!'
                    : 'Ваш внесок отримано. Він допомагає розвивати центр і робити заняття доступнішими.'}
                </p>
                <button
                  onClick={() => setThanks(null)}
                  className="mt-5 w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:from-emerald-700 hover:to-teal-600"
                >
                  Чудово 🎉
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingContact />
      <BackToTop />
      <ExchangeModal open={exchangeOpen} onClose={() => setExchangeOpen(false)} account={account} onHistory={openHistory} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} account={account} />
    </div>
  );
};

export default App;
