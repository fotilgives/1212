import React, { useEffect, useState } from 'react';
import { Coins, HeartPulse, Plus } from 'lucide-react';

interface Props {
  balance: number;
  onExchange: () => void;
}

const Navbar: React.FC<Props> = ({ balance, onExchange }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 transition-all ${
        scrolled ? 'bg-white/90 backdrop-blur border-b border-slate-100 shadow-sm' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#top" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
            <HeartPulse className="h-5 w-5" />
          </span>
          RehabPlay
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="#how" className="hover:text-emerald-700">Як це працює</a>
          <a href="#game" className="hover:text-emerald-700">Гра</a>
          <a href="#donate" className="hover:text-emerald-700">Підтримати</a>
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700 ring-1 ring-amber-200">
            <Coins className="h-4 w-4" />
            {balance}
          </div>
          <button
            onClick={onExchange}
            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Поповнити
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
