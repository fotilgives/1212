import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

/**
 * Тонка градієнтна смужка прогресу скролу вгорі сторінки.
 * Працює на GPU (scaleX) — плавно й без «ривків».
 */
const ScrollProgress: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 top-0 z-[60] h-[3px] w-full origin-left bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400"
    />
  );
};

export default ScrollProgress;
