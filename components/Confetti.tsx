import React from 'react';
import { motion } from 'framer-motion';

const COLORS = ['#10b981', '#34d399', '#fbbf24', '#f59e0b', '#f472b6', '#60a5fa', '#a78bfa', '#fde047'];
const EMOJIS = ['🪙', '🎉', '✨', '💰', '🤑'];

/** Святковий вибух поверх контейнера (родич має бути position: relative + overflow-hidden). */
const Confetti: React.FC<{ count?: number }> = ({ count = 40 }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      {/* паперові стрічки */}
      {Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.35;
        const dur = 1.2 + Math.random() * 1.0;
        const size = 6 + Math.random() * 8;
        const drift = (Math.random() - 0.5) * 60;
        return (
          <motion.span
            key={`c${i}`}
            className="absolute top-0 rounded-[2px]"
            style={{ left: `${left}%`, width: size, height: size * 1.6, background: COLORS[i % COLORS.length] }}
            initial={{ y: -24, x: 0, opacity: 0, rotate: 0 }}
            animate={{ y: '135%', x: drift, opacity: [0, 1, 1, 0], rotate: Math.random() * 900 - 450 }}
            transition={{ duration: dur, delay, ease: 'easeIn' }}
          />
        );
      })}

      {/* монети та емодзі, що злітають */}
      {Array.from({ length: 12 }).map((_, i) => {
        const left = 6 + Math.random() * 88;
        const delay = Math.random() * 0.3;
        return (
          <motion.span
            key={`e${i}`}
            className="absolute text-lg"
            style={{ left: `${left}%`, bottom: '20%' }}
            initial={{ y: 20, opacity: 1, scale: 0.6 }}
            animate={{ y: -70 - Math.random() * 50, opacity: [1, 1, 0], scale: 1, rotate: Math.random() * 360 - 180 }}
            transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: 'easeOut' }}
          >
            {EMOJIS[i % EMOJIS.length]}
          </motion.span>
        );
      })}

      {/* спалах-сяйво в центрі */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ width: 120, height: 120, background: 'radial-gradient(circle, rgba(250,204,21,0.45), transparent 70%)' }}
        initial={{ scale: 0.3, opacity: 0.8 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
    </div>
  );
};

export default Confetti;
