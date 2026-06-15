import React, { Suspense, lazy, useState } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PoolGame from './components/PoolGame';
import Donate from './components/Donate';
import HowItWorks from './components/HowItWorks';
import Footer from './components/Footer';
import ExchangeModal from './components/ExchangeModal';
import Background from './components/Background';
import { useAccount } from './hooks/useAccount';

// Чат не критичний для першого екрана — вантажимо окремо, після основного контенту.
const ChatWidget = lazy(() => import('./components/ChatWidget'));

const App: React.FC = () => {
  const account = useAccount();
  const [exchangeOpen, setExchangeOpen] = useState(false);

  return (
    <div className="min-h-screen text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      <Background />
      <Navbar balance={account.balance} onExchange={() => setExchangeOpen(true)} />

      <main>
        <Hero
          onPlay={() => document.getElementById('game')?.scrollIntoView({ behavior: 'smooth' })}
          onExchange={() => setExchangeOpen(true)}
        />
        <HowItWorks />
        <PoolGame account={account} onTopUp={() => setExchangeOpen(true)} />
        <Donate account={account} onTopUp={() => setExchangeOpen(true)} />
      </main>

      <Footer />

      <ExchangeModal open={exchangeOpen} onClose={() => setExchangeOpen(false)} account={account} />
      <Suspense fallback={null}>
        <ChatWidget />
      </Suspense>
    </div>
  );
};

export default App;
