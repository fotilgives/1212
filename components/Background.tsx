import React from 'react';
import { motion } from 'framer-motion';

/**
 * Мінімалістичний преміум-фон: м'який верхній світловий ореол,
 * делікатна сітка-крапки й кілька «дихаючих» кольорових плям.
 * Анімуємо лише transform -> дешево для GPU. На мобільних рух вимкнено.
 */
const orbs = [
  { c: 'from-emerald-300/30 to-teal-200/10', s: 'left-[-10%] top-[6%] h-[420px] w-[420px]', x: [0, 40, 0], y: [0, 26, 0], d: 24 },
  { c: 'from-sky-200/25 to-emerald-200/5', s: 'right-[-12%] top-[28%] h-[380px] w-[380px]', x: [0, -34, 0], y: [0, 40, 0], d: 28 },
  { c: 'from-amber-200/20 to-rose-100/5', s: 'bottom-[-6%] left-[22%] h-[340px] w-[340px]', x: [0, 30, 0], y: [0, -26, 0], d: 26 },
];

const Background: React.FC = () => {
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile((prev) => (prev !== mobile ? mobile : prev));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-emerald-50/30">
      {/* Згенерований анімований фон */}
      <div
        className={`absolute inset-0 opacity-50 mix-blend-multiply ${isMobile ? 'bg-scroll-mobile' : 'bg-scroll-desktop'}`}
        style={{ backgroundImage: 'url(/images/bg-animated.jpg)' }}
      />
      {/* М'яке біле перекриття, щоб контент завжди читався */}
      <div className="absolute inset-0 bg-white/40" />

      {/* Верхній м'який ореол */}
      <div className="absolute left-1/2 top-[-12%] h-[460px] w-[820px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.16),transparent_70%)] blur-2xl" />

      {/* Сітка-крапки */}
      <div className="bg-grid absolute inset-0 opacity-60" />

      {/* Кольорові плями */}
      {orbs.map((o, i) => (
        <motion.div
          key={i}
          className={`absolute rounded-full bg-gradient-to-br blur-[70px] md:blur-[100px] ${o.c} ${o.s}`}
          style={{ willChange: 'transform' }}
          animate={isMobile ? undefined : { x: o.x, y: o.y }}
          transition={isMobile ? undefined : { duration: o.d, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
};

export default Background;
