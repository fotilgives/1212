import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PoolGame from './components/PoolGame';
import Donate from './components/Donate';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import ExchangeModal from './components/ExchangeModal';
import ChatWidget from './components/ChatWidget';
import { useWallet } from './hooks/useWallet';

const App: React.FC = () => {
  const wallet = useWallet();
  const [exchangeOpen, setExchangeOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Navbar balance={wallet.balance} onExchange={() => setExchangeOpen(true)} />

      <main>
        <Hero onPlay={() => document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' })} onExchange={() => setExchangeOpen(true)} />
        <HowItWorks />
        <PoolGame wallet={wallet} onTopUp={() => setExchangeOpen(true)} />
        <Donate wallet={wallet} onTopUp={() => setExchangeOpen(true)} />
      </main>

      <Footer />

      <ExchangeModal open={exchangeOpen} onClose={() => setExchangeOpen(false)} wallet={wallet} />
      <ChatWidget />
    </div>
  );
};

export default App;
