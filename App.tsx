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
import { useAccount } from './hooks/useAccount';
import { useRoute, navigate } from './hooks/useRoute';

import LocationPage from './components/pages/Location';
import PricesPage from './components/pages/Prices';
import Support from './components/pages/Support';
import Legal from './components/pages/Legal';
import AuthModal from './components/AuthModal';



const App: React.FC = () => {
  const account = useAccount();
  const route = useRoute();
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [thanks, setThanks] = useState<null | 'donate' | 'topup'>(null);

  const openExchange = () => {
    if (!account.isAccount) {
      setAuthOpen(true);
    } else {
      setExchangeOpen(true);
    }
  };

  // Подяка після успішної оплати (WayForPay повертає на /api/wayforpay-return).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isDonate = params.get('donate') === 'thanks';
    const isTopup = params.get('topup') === 'thanks';
    if (isDonate || isTopup) {
      setThanks(isTopup ? 'topup' : 'donate');
      window.history.replaceState({}, '', window.location.pathname + (window.location.hash || '#/'));
      if (isTopup) {
        // монети нараховує серверний callback; оновлюємо баланс (realtime теж підхопить).
        setTimeout(() => account.refresh(), 1500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
              <HomeSections account={account} onExchange={openExchange} />
              <MediaShowcase />
              <section className="mx-auto max-w-5xl px-4 pb-4 sm:px-5">
                <YogaCourseCard />
                <PriceList />
              </section>
              <RehabDetails />
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
          {route === 'prizes' && <Prizes account={account} onTopUp={openExchange} />}
          {route === 'philosophy' && <Philosophy />}
          {route === 'prices' && <PricesPage />}
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
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
            >
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl">
                {thanks === 'topup' ? '🪙' : '❤️'}
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-slate-900">
                {thanks === 'topup' ? 'Оплату отримано!' : 'Дякуємо за підтримку!'}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                {thanks === 'topup'
                  ? 'Монети зараховуються на ваш баланс протягом кількох секунд.'
                  : 'Ваш внесок отримано. Він допомагає розвивати центр і робити заняття доступнішими.'}
              </p>
              <button
                onClick={() => setThanks(null)}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700"
              >
                Чудово
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <FloatingContact />
      <BackToTop />
      <ExchangeModal open={exchangeOpen} onClose={() => setExchangeOpen(false)} account={account} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} account={account} />
    </div>
  );
};

export default App;
