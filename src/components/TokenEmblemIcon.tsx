import React, { useId } from 'react';

interface TokenEmblemIconProps {
  className?: string;
}

/**
 * Emblem Perisai Heksagon Emas-Hitam untuk Token Bingkai
 * Terinspirasi langsung dari ikon token heksagon pada referensi arena spin.
 */
export const TokenEmblemIcon: React.FC<TokenEmblemIconProps> = ({
  className = 'w-6 h-6',
}) => {
  const uid = useId().replace(/:/g, '');
  const goldGradId = `bnTokenGold-${uid}`;
  const darkGradId = `bnTokenDark-${uid}`;

  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={goldGradId} x1="10" y1="6" x2="54" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={darkGradId} x1="18" y1="14" x2="46" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1b18" />
          <stop offset="100%" stopColor="#09090b" />
        </linearGradient>
      </defs>

      {/* Outer Gold Hexagon Shield */}
      <polygon
        points="32,3 57,17.5 57,46.5 32,61 7,46.5 7,17.5"
        fill={`url(#${goldGradId})`}
        stroke="#fef9c3"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Inner Dark Obsidian Facet */}
      <polygon
        points="32,10 50,20.5 50,43.5 32,54 14,43.5 14,20.5"
        fill={`url(#${darkGradId})`}
        stroke="#fbbf24"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Central Crest / Crown-Shield Emblem */}
      <path
        d="M21 25 L26 20 L32 25 L38 20 L43 25 L40 39 L32 45 L24 39 Z"
        fill={`url(#${goldGradId})`}
        stroke="#fef08a"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Inner Core Diamond */}
      <polygon
        points="32,27 36,33 32,39 28,33"
        fill="#18181b"
        stroke="#fde047"
        strokeWidth="1"
      />
    </svg>
  );
};
