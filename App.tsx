import React, { Suspense, lazy, useState } from 'react';
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
import MediaShowcase from './components/MediaShowcase';
import ScrollProgress from './components/ScrollProgress';
import BackToTop from './components/BackToTop';
import FinalCTA from './components/FinalCTA';
import { useAccount } from './hooks/useAccount';
import { useRoute, navigate } from './hooks/useRoute';

import LocationPage from './components/pages/Location';
import PricesPage from './components/pages/Prices';



const App: React.FC = () => {
  const account = useAccount();
  const route = useRoute();
  const [exchangeOpen, setExchangeOpen] = useState(false);
  const openExchange = () => setExchangeOpen(true);



  return (
    <div className="min-h-screen text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <ScrollProgress />
      <Background />
      <Navbar balance={account.balance} route={route} onExchange={openExchange} />

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
              <section className="mx-auto max-w-5xl px-5 pb-4">
                <PriceList />
              </section>
              <RehabDetails />
              <FinalCTA />
            </main>
          )}

          {route === 'game' && (
            <main>
              <PoolGame account={account} onTopUp={openExchange} />
              <Leaderboard account={account} />
            </main>
          )}

          {route === 'about' && <About />}
          {route === 'services' && <Services />}
          {route === 'prizes' && <Prizes account={account} onTopUp={openExchange} />}
          {route === 'philosophy' && <Philosophy />}
          {route === 'prices' && <PricesPage />}
          {route === 'location' && <LocationPage />}
        </motion.div>
      </AnimatePresence>

      <Footer />

      <FloatingContact />
      <BackToTop />
      <ExchangeModal open={exchangeOpen} onClose={() => setExchangeOpen(false)} account={account} />
    </div>
  );
};

export default App;
