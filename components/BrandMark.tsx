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
 * Показує /images/logo.png, а поки файлу нема - фірмову іконку-серце.
 */
const BrandMark: React.FC<Props> = ({ size = 36, className = '' }) => {
  const px = `${size}px`;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full shadow-sm shadow-emerald-950/20 ${className}`}
      style={{ height: px, width: px, minWidth: px, minHeight: px }}
    >
      <SmartImage
        src="/images/logo.png"
        alt="Логотип - Центр розвитку та здоров'я"
        className="h-full w-full object-cover"
        fallback={
          <span className="grid h-full w-full place-items-center bg-emerald-600 text-white">
            <HeartPulse style={{ height: size * 0.55, width: size * 0.55 }} />
          </span>
        }
      />
    </span>
  );
};

export default BrandMark;
