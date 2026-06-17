import React from 'react';
import { HeartPulse } from 'lucide-react';
import SmartImage from './SmartImage';

interface Props {
  /** Розмір квадрата логотипа в px. */
  size?: number;
  className?: string;
}

/**
 * Логотип «Центр розвитку та здоров'я».
 * Показує /images/logo.png, а поки файлу нема — фірмову іконку-серце.
 */
const BrandMark: React.FC<Props> = ({ size = 36, className = '' }) => {
  const px = `${size}px`;
  return (
    <span
      className={`grid place-items-center overflow-hidden rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200 ${className}`}
      style={{ height: px, width: px }}
    >
      <SmartImage
        src="/images/logo.png"
        alt="Логотип — Центр розвитку та здоров'я"
        className="h-full w-full object-cover"
        fallback={<HeartPulse style={{ height: size * 0.55, width: size * 0.55 }} />}
      />
    </span>
  );
};

export default BrandMark;
