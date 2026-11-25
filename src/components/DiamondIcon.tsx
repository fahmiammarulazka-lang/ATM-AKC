import React from 'react';
import { Gem } from 'lucide-react';

interface DiamondIconProps {
  className?: string;
  tone?: 'cyan' | 'bright';
  label?: string;
}

/**
 * Ikon vektor permata biru cyan yang tajam & seragam
 * menggantikan seluruh teks kata "Diamond" maupun emoji permata di seluruh aplikasi.
 */
export const DiamondIcon: React.FC<DiamondIconProps> = ({
  className = 'h-4 w-4',
  tone = 'cyan',
  label = 'Permata',
}) => {
  const toneClass =
    tone === 'bright'
      ? 'text-cyan-300 fill-cyan-300/25 drop-shadow-[0_0_4px_rgba(34,211,238,0.45)]'
      : 'text-cyan-500 fill-cyan-400/20';

  return (
    <Gem
      aria-label={label}
      className={`inline-block shrink-0 align-[-0.18em] ${toneClass} ${className}`}
      strokeWidth={2.25}
    />
  );
};

interface DiamondTextProps {
  text: string;
  iconClassName?: string;
  tone?: 'cyan' | 'bright';
  className?: string;
}

const DIAMOND_TOKEN_REGEX =
  /((?:💎\s*\bDiamonds?\b)|(?:\bDiamonds?\s*💎)|(?:\bDiamonds?\b)|💎)/gi;

/**
 * Merender string dinamis (notifikasi, toast, riwayat transaksi, deskripsi fitur)
 * dengan mengganti seluruh kata "Diamond" dan emoji 💎 menjadi ikon vektor permata biru cyan.
 */
export const DiamondText: React.FC<DiamondTextProps> = ({
  text,
  iconClassName = 'h-3.5 w-3.5 mx-0.5',
  tone = 'cyan',
  className,
}) => {
  if (!text) return null;
  const parts = text.split(DIAMOND_TOKEN_REGEX);

  return (
    <span className={className}>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (DIAMOND_TOKEN_REGEX.test(part)) {
          DIAMOND_TOKEN_REGEX.lastIndex = 0;
          return <DiamondIcon key={idx} className={iconClassName} tone={tone} />;
        }
        DIAMOND_TOKEN_REGEX.lastIndex = 0;
        return <React.Fragment key={idx}>{part}</React.Fragment>;
      })}
    </span>
  );
};
