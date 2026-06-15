import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins, HeartPulse, Plus } from 'lucide-react';
import AnimatedNumber from './AnimatedNumber';

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
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`sticky top-0 z-40 transition-all ${scrolled ? 'glass border-b border-white/50 shadow-sm' : 'bg-transparent'}`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
        <a href="#top" className="flex items-center gap-2.5">
          <motion.span
            whileHover={{ rotate: -10, scale: 1.08 }}
            className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200"
          >
            <HeartPulse className="h-5 w-5" />
          </motion.span>
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight">RehabPlay</span>
            <span className="hidden text-[11px] font-medium text-slate-400 sm:block">грай · підтримуй · одужуй</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
          <a href="#how" className="transition hover:text-emerald-700">Як це працює</a>
          <a href="#game" className="transition hover:text-emerald-700">Гра</a>
          <a href="#donate" className="transition hover:text-emerald-700">Підтримати</a>
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
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
