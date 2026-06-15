import React from 'react';
import { motion } from 'framer-motion';

/** Анімований фон сайту: плавно «дихаючі» кольорові плями. */
const Background: React.FC = () => {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-50">
      <motion.div
        className="absolute -left-32 -top-32 h-[520px] w-[520px] rounded-full bg-emerald-300/30 blur-[120px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-[-15%] top-[10%] h-[460px] w-[460px] rounded-full bg-teal-300/25 blur-[120px]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] left-[20%] h-[420px] w-[420px] rounded-full bg-amber-200/30 blur-[120px]"
        animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(255,255,255,0)_0%,rgba(248,250,252,0.6)_70%)]" />
    </div>
  );
};

export default Background;
