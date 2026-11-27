import React from 'react';
import { Crown, Shield, Gem, Flame, Briefcase, Landmark, Sparkles } from 'lucide-react';
import { BankAccount } from '../types/bank';
import {
  getAvatarFrameById,
  getAvatarPresetById,
} from '../data/profileCustomizationCatalog';

interface ProfileAvatarBadgeProps {
  account: Pick<
    BankAccount,
    'fullName' | 'cardStatus' | 'avatarPresetId' | 'avatarFrameId'
  >;
  googlePicture?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  stageHighlight?: boolean;
  className?: string;
}

type AuraTheme = 'petir' | 'api' | 'emas' | 'es' | 'galaksi';

const renderCompactSmOverlay = (auraTheme: AuraTheme) => {
  switch (auraTheme) {
    case 'petir':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[5px] w-[calc(100%+10px)] h-[calc(100%+10px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Cyber chamfered corner brackets */}
          <path d="M2 22 L2 6 L10 2 L24 2" fill="none" stroke="#67e8f9" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M76 2 L90 2 L98 10 L98 22" fill="none" stroke="#67e8f9" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2 78 L2 90 L10 98 L24 98" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M76 98 L90 98 L98 90 L98 78" fill="none" stroke="#22d3ee" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Top mini Volt badge + alternating spark */}
          <polygon points="50,-8 58,-1 54,6 46,6 42,-1" fill="#083344" stroke="#67e8f9" strokeWidth="2.5" />
          <path d="M51,-5 L47,0 L51,0 L48,4" fill="none" stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" className="bn-obj-bolt-a" />
          <path d="M97,46 L104,50 L98,55" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round" className="bn-obj-bolt-b" />
        </svg>
      );
    case 'api':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[5px] w-[calc(100%+10px)] h-[calc(100%+10px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Mini curved Dragon Horns top left/right */}
          <path d="M16 14 C8 -2, 2 -10, 14 -12 C18 -4, 22 4, 28 8 Z" fill="#fb923c" stroke="#fef08a" strokeWidth="1.5" />
          <path d="M84 14 C92 -2, 98 -10, 86 -12 C82 -4, 78 4, 72 8 Z" fill="#fb923c" stroke="#fef08a" strokeWidth="1.5" />
          {/* Rising mini embers */}
          <circle cx="50" cy="-4" r="3.5" fill="#fde047" className="bn-obj-ember-a" />
          <circle cx="94" cy="36" r="2.8" fill="#fb923c" className="bn-obj-ember-b" />
        </svg>
      );
    case 'emas':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[5px] w-[calc(100%+10px)] h-[calc(100%+10px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Mini Royal Gold Crown at top */}
          <path
            d="M32 6 L37 -8 L45 -1 L50 -12 L55 -1 L63 -8 L68 6 Z"
            fill="#facc15"
            stroke="#fef9c3"
            strokeWidth="2"
            strokeLinejoin="round"
            className="bn-obj-crown-float"
          />
          <circle cx="50" cy="0" r="2.4" fill="#e11d48" className="bn-obj-crown-float" />
          {/* Gold corner studs */}
          <circle cx="8" cy="8" r="3.2" fill="#fde047" />
          <circle cx="92" cy="8" r="3.2" fill="#fde047" />
          <circle cx="8" cy="92" r="3.2" fill="#fde047" />
          <circle cx="92" cy="92" r="3.2" fill="#fde047" />
        </svg>
      );
    case 'es':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[5px] w-[calc(100%+10px)] h-[calc(100%+10px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* 4 corner faceted ice crystal prisms */}
          <polygon points="-4,-4 15,2 4,15" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.6" className="bn-obj-ice-glint" />
          <polygon points="104,-4 85,2 96,15" fill="#bae6fd" stroke="#38bdf8" strokeWidth="1.6" className="bn-obj-ice-glint" />
          <polygon points="-4,104 15,98 4,85" fill="#bae6fd" stroke="#38bdf8" strokeWidth="1.6" className="bn-obj-ice-glint" />
          <polygon points="104,104 85,98 96,85" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.6" className="bn-obj-ice-glint" />
          {/* Drifting snowflakes */}
          <circle cx="50" cy="-6" r="3" fill="#ffffff" className="bn-obj-snow-a" />
          <circle cx="99" cy="54" r="2.6" fill="#bae6fd" className="bn-obj-snow-b" />
        </svg>
      );
    case 'galaksi':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Tilted cosmic orbital ellipse */}
          <ellipse
            cx="50"
            cy="50"
            rx="56"
            ry="22"
            transform="rotate(-24 50 50)"
            fill="none"
            stroke="rgba(240,171,252,0.8)"
            strokeWidth="2.4"
            className="bn-obj-nebula-breathe"
          />
          {/* Mini Saturn top-right */}
          <g className="bn-obj-planet-bob">
            <circle cx="90" cy="10" r="6" fill="#e879f9" stroke="#ffffff" strokeWidth="1.4" />
            <ellipse cx="90" cy="10" rx="10" ry="3.2" transform="rotate(-22 90 10)" fill="none" stroke="#fde047" strokeWidth="1.8" />
          </g>
          {/* Mini crescent moon bottom-left */}
          <path
            d="M14 84 A7 7 0 1 0 22 93 A5.5 5.5 0 1 1 14 84 Z"
            fill="#fef08a"
            className="bn-obj-moon-bob"
          />
        </svg>
      );
  }
};

const renderFullArchitecturalAura = (
  auraTheme: AuraTheme,
  stageHighlight?: boolean
) => {
  const insetClass = stageHighlight
    ? '-inset-3.5 w-[calc(100%+28px)] h-[calc(100%+28px)]'
    : '-inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)]';

  switch (auraTheme) {
    case 'petir':
      return (
        <svg
          viewBox="-16 -18 132 136"
          className={`absolute ${insetClass} pointer-events-none z-20 overflow-visible`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bnCyberMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>

          {/* Distinct Architectural Cyber-Tech Chamfered Brackets & Circuit Frame */}
          <path
            d="M 2 24 L 2 8 L 12 0 L 32 0"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 68 0 L 88 0 L 98 8 L 98 24"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 2 76 L 2 92 L 12 100 L 32 100"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 68 100 L 88 100 L 98 92 L 98 76"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Unique Object 1: Top Cyber Volt Crest Shield */}
          <g className="bn-obj-tesla-hum">
            <polygon
              points="50,-14 63,-5 58,5 42,5 37,-5"
              fill="#082f49"
              stroke="url(#bnCyberMetal)"
              strokeWidth="2.4"
            />
            <path
              d="M 52 -10 L 46 -3 L 51 -3 L 48 3 L 55 -4 L 50 -4 Z"
              fill="#fef08a"
            />
          </g>

          {/* Unique Object 2: Dual Side Tesla High-Voltage Coils */}
          <g className="bn-obj-tesla-hum">
            <rect x="-9" y="39" width="8" height="22" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <line x1="-9" y1="45" x2="-1" y2="45" stroke="#67e8f9" strokeWidth="1.6" />
            <line x1="-9" y1="50" x2="-1" y2="50" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="-9" y1="55" x2="-1" y2="55" stroke="#67e8f9" strokeWidth="1.6" />
            <circle cx="-5" cy="36" r="2.6" fill="#e0f2fe" />

            <rect x="101" y="39" width="8" height="22" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
            <line x1="101" y1="45" x2="109" y2="45" stroke="#67e8f9" strokeWidth="1.6" />
            <line x1="101" y1="50" x2="109" y2="50" stroke="#ffffff" strokeWidth="1.6" />
            <line x1="101" y1="55" x2="109" y2="55" stroke="#67e8f9" strokeWidth="1.6" />
            <circle cx="105" cy="36" r="2.6" fill="#e0f2fe" />
          </g>

          {/* 3 Independent Alternating Flickering Lightning Arcs */}
          <path
            d="M 11 -10 L 18 -2 L 13 -1 L 20 8"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="bn-obj-bolt-a"
          />
          <path
            d="M 90 -9 L 83 0 L 89 1 L 81 9"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="bn-obj-bolt-b"
          />
          <path
            d="M 48 101 L 54 108 L 49 110 L 55 117"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="bn-obj-bolt-c"
          />
        </svg>
      );

    case 'api':
      return (
        <svg
          viewBox="-16 -20 132 138"
          className={`absolute ${insetClass} pointer-events-none z-20 overflow-visible`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bnDragonHorn" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#991b1b" />
              <stop offset="55%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="bnDragonScale" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#b91c1c" />
            </linearGradient>
          </defs>

          {/* Distinct Dragon-Scale Scalloped Obsidian-Molten Rim */}
          <path
            d="M 6 88 Q 28 107 50 103 Q 72 107 94 88"
            fill="none"
            stroke="url(#bnDragonScale)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 38 103 L 50 113 L 62 103 Z"
            fill="#ef4444"
            stroke="#fde047"
            strokeWidth="1.6"
          />

          {/* Unique Object 1: Curved Dragon Horns Crowning Upper Corners */}
          <path
            d="M 18 14 C 5 4, -4 -10, 11 -16 C 14 -6, 20 2, 30 7 Z"
            fill="url(#bnDragonHorn)"
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          <path
            d="M 82 14 C 95 4, 104 -10, 89 -16 C 86 -6, 80 2, 70 7 Z"
            fill="url(#bnDragonHorn)"
            stroke="#fef08a"
            strokeWidth="1.5"
          />

          {/* Unique Object 2: Side Dragon Wing / Claw Guard Silhouettes */}
          <path
            d="M -2 30 C -14 38, -14 52, -3 68 C -6 56, -6 44, -2 30 Z"
            fill="#dc2626"
            stroke="#fb923c"
            strokeWidth="1.6"
          />
          <path
            d="M 102 30 C 114 38, 114 52, 103 68 C 106 56, 106 44, 102 30 Z"
            fill="#dc2626"
            stroke="#fb923c"
            strokeWidth="1.6"
          />

          {/* Undulating Wavy Dragon Flame Tongues (Independent Swaying Phases) */}
          <path
            d="M 50 -16 C 57 -8, 60 -1, 50 5 C 40 -1, 43 -8, 50 -16 Z"
            fill="#fb923c"
            stroke="#fef08a"
            strokeWidth="1.4"
            className="bn-obj-flame-a"
          />
          <path
            d="M 0 22 C -10 14, -10 4, 2 0 C 3 9, 5 16, 0 22 Z"
            fill="#f97316"
            className="bn-obj-flame-b"
          />
          <path
            d="M 100 22 C 110 14, 110 4, 98 0 C 97 9, 95 16, 100 22 Z"
            fill="#ef4444"
            className="bn-obj-flame-a"
          />

          {/* Rising Ember Particles Drifting Upward */}
          <circle cx="28" cy="-8" r="2.7" fill="#fde047" className="bn-obj-ember-a" />
          <circle cx="72" cy="-6" r="2.4" fill="#fb923c" className="bn-obj-ember-b" />
          <circle cx="107" cy="48" r="2.6" fill="#fef08a" className="bn-obj-ember-c" />
          <circle cx="-7" cy="52" r="2.4" fill="#f97316" className="bn-obj-ember-b" />
        </svg>
      );

    case 'emas':
      return (
        <svg
          viewBox="-16 -22 132 140"
          className={`absolute ${insetClass} pointer-events-none z-20 overflow-visible`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bnRoyalGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="40%" stopColor="#facc15" />
              <stop offset="75%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <clipPath id="bnImperialSheenMask">
              <rect x="-8" y="-12" width="116" height="122" rx="22" />
            </clipPath>
          </defs>

          {/* Distinct Baroque Double Filigree Bevel + Corner Ruby Jewels */}
          <rect
            x="-1"
            y="-1"
            width="102"
            height="102"
            rx="16"
            fill="none"
            stroke="url(#bnRoyalGold)"
            strokeWidth="3.2"
          />
          <circle cx="4" cy="4" r="4" fill="#e11d48" stroke="#fef08a" strokeWidth="1.6" />
          <circle cx="96" cy="4" r="4" fill="#e11d48" stroke="#fef08a" strokeWidth="1.6" />
          <circle cx="4" cy="96" r="4" fill="#e11d48" stroke="#fef08a" strokeWidth="1.6" />
          <circle cx="96" cy="96" r="4" fill="#e11d48" stroke="#fef08a" strokeWidth="1.6" />

          {/* Sweeping Metallic Gold Sheen Band Across Frame */}
          <g clipPath="url(#bnImperialSheenMask)">
            <rect
              x="0"
              y="-14"
              width="24"
              height="130"
              fill="rgba(255,255,255,0.42)"
              className="bn-obj-gold-sheen"
            />
          </g>

          {/* Unique Object 1: Royal Gold Crown Studded With Gems Above Avatar */}
          <g className="bn-obj-crown-float">
            <path
              d="M 30 4 L 33 -11 L 43 -4 L 50 -16 L 57 -4 L 67 -11 L 70 4 Z"
              fill="url(#bnRoyalGold)"
              stroke="#78350f"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
            <circle cx="50" cy="-3" r="2.8" fill="#e11d48" stroke="#fef9c3" strokeWidth="1" />
            <circle cx="38" cy="-1" r="2" fill="#0ea5e9" />
            <circle cx="62" cy="-1" r="2" fill="#0ea5e9" />
          </g>

          {/* Unique Object 2: Gold Laurel Wreath Leaves Flanked Left & Right */}
          <path
            d="M -6 72 C -12 58, -12 42, -5 28 M -8 62 L -2 58 M -9 50 L -2 47 M -8 38 L -2 36"
            fill="none"
            stroke="#fde047"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M 106 72 C 112 58, 112 42, 105 28 M 108 62 L 102 58 M 109 50 L 102 47 M 108 38 L 102 36"
            fill="none"
            stroke="#fde047"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Bottom Royal Seal Crest */}
          <polygon points="50,98 56,105 50,112 44,105" fill="url(#bnRoyalGold)" stroke="#78350f" strokeWidth="1.3" />

          {/* Staggered 4-Point Royal Sparkles */}
          <polygon
            points="16,-6 18,-2 22,0 18,2 16,6 14,2 10,0 14,-2"
            fill="#ffffff"
            className="bn-obj-twinkle-a"
          />
          <polygon
            points="85,96 87,100 91,102 87,104 85,108 83,104 79,102 83,100"
            fill="#fef08a"
            className="bn-obj-twinkle-b"
          />
        </svg>
      );

    case 'es':
      return (
        <svg
          viewBox="-16 -18 132 136"
          className={`absolute ${insetClass} pointer-events-none z-20 overflow-visible`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bnIceFacet" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="45%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#0284c7" />
            </linearGradient>
          </defs>

          {/* Distinct Geometric Faceted Glacial Rim */}
          <polygon
            points="14,-2 86,-2 102,14 102,86 86,102 14,102 -2,86 -2,14"
            fill="none"
            stroke="url(#bnIceFacet)"
            strokeWidth="2.8"
          />

          {/* Unique Object 1: 4 Sharp Diagonal Faceted Ice Prism Spears */}
          <g className="bn-obj-ice-glint">
            <polygon points="-11,-11 14,0 5,6 0,14" fill="url(#bnIceFacet)" stroke="#ffffff" strokeWidth="1.2" />
            <polygon points="111,-11 86,0 95,6 100,14" fill="url(#bnIceFacet)" stroke="#ffffff" strokeWidth="1.2" />
            <polygon points="-11,111 14,100 5,94 0,86" fill="url(#bnIceFacet)" stroke="#ffffff" strokeWidth="1.2" />
            <polygon points="111,111 86,100 95,94 100,86" fill="url(#bnIceFacet)" stroke="#ffffff" strokeWidth="1.2" />
            {/* Top Glacial Crystal Tiara */}
            <polygon points="50,-15 57,-2 50,3 43,-2" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.4" />
          </g>

          {/* Unique Object 2: Independent Drifting Snowflakes */}
          <g stroke="#ffffff" strokeWidth="1.9" strokeLinecap="round" className="bn-obj-snow-a">
            <line x1="25" y1="-10" x2="25" y2="-2" />
            <line x1="21" y1="-6" x2="29" y2="-6" />
          </g>
          <g stroke="#bae6fd" strokeWidth="1.9" strokeLinecap="round" className="bn-obj-snow-b">
            <line x1="106" y1="45" x2="106" y2="55" />
            <line x1="101" y1="50" x2="111" y2="50" />
          </g>
          <g stroke="#e0f2fe" strokeWidth="1.9" strokeLinecap="round" className="bn-obj-snow-c">
            <line x1="-7" y1="48" x2="-7" y2="58" />
            <line x1="-12" y1="53" x2="-2" y2="53" />
          </g>
          <circle cx="76" cy="107" r="2.6" fill="#ffffff" className="bn-obj-snow-a" />
        </svg>
      );

    case 'galaksi':
      return (
        <svg
          viewBox="-18 -18 136 136"
          className={`absolute ${insetClass} pointer-events-none z-20 overflow-visible`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bnSaturnBody" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0abfc" />
              <stop offset="60%" stopColor="#9333ea" />
              <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
          </defs>

          {/* Breathing Soft Nebula Ring + Double Tilted Astrolabe Orbits */}
          <circle
            cx="50"
            cy="50"
            r="56"
            fill="none"
            stroke="rgba(192,132,252,0.45)"
            strokeWidth="2.5"
            className="bn-obj-nebula-breathe"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="61"
            ry="23"
            transform="rotate(-26 50 50)"
            fill="none"
            stroke="rgba(240,171,252,0.82)"
            strokeWidth="2"
            strokeDasharray="10 4"
            className="bn-obj-nebula-breathe"
          />
          <ellipse
            cx="50"
            cy="50"
            rx="59"
            ry="21"
            transform="rotate(24 50 50)"
            fill="none"
            stroke="rgba(129,140,248,0.65)"
            strokeWidth="1.6"
          />

          {/* Unique Object 1: Ringed Mini Saturn Planet Top-Right */}
          <g className="bn-obj-planet-bob">
            <circle cx="93" cy="6" r="7.5" fill="url(#bnSaturnBody)" stroke="#fae8ff" strokeWidth="1.4" />
            <ellipse
              cx="93"
              cy="6"
              rx="13.5"
              ry="4"
              transform="rotate(-20 93 6)"
              fill="none"
              stroke="#fde047"
              strokeWidth="2"
            />
          </g>

          {/* Unique Object 2: Glowing Crescent Moon Bottom-Left */}
          <g className="bn-obj-moon-bob">
            <path
              d="M 8 83 A 9 9 0 1 0 18 95 A 7 7 0 1 1 8 83 Z"
              fill="#fef08a"
              stroke="#f59e0b"
              strokeWidth="1"
            />
          </g>

          {/* Independent Twinkling Cosmic Stars */}
          <polygon
            points="16,4 18,8 22,10 18,12 16,16 14,12 10,10 14,8"
            fill="#ffffff"
            className="bn-obj-twinkle-a"
          />
          <polygon
            points="89,90 91,94 95,96 91,98 89,102 87,98 83,96 87,94"
            fill="#f472b6"
            className="bn-obj-twinkle-b"
          />
          <circle cx="50" cy="-8" r="2.6" fill="#c084fc" className="bn-obj-twinkle-b" />
        </svg>
      );
  }
};

export const ProfileAvatarBadge: React.FC<ProfileAvatarBadgeProps> = ({
  account,
  googlePicture,
  size = 'lg',
  stageHighlight = false,
  className = '',
}) => {
  const preset = getAvatarPresetById(account.avatarPresetId);
  const frame = getAvatarFrameById(account.avatarFrameId);
  const isExclusiveAura = Boolean(frame.isSpinExclusive && frame.auraTheme);

  const initials =
    account.fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || 'BN';

  const sizeClass =
    size === 'sm'
      ? 'w-7 h-7 rounded-lg text-xs'
      : size === 'md'
      ? 'w-10 h-10 rounded-xl text-sm'
      : size === 'xl'
      ? 'w-20 h-20 sm:w-24 sm:h-24 rounded-2xl text-2xl'
      : 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-base sm:text-lg';

  const iconSizeClass =
    size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'md'
      ? 'w-5 h-5'
      : size === 'xl'
      ? 'w-10 h-10'
      : 'w-6 h-6';

  const renderSymbol = () => {
    if (!preset || preset.symbol === 'initials') {
      return <span>{size === 'sm' ? initials.charAt(0) : initials}</span>;
    }
    switch (preset.symbol) {
      case 'crown':
        return <Crown className={iconSizeClass} />;
      case 'shield':
        return <Shield className={iconSizeClass} />;
      case 'gem':
        return <Gem className={iconSizeClass} />;
      case 'flame':
        return <Flame className={iconSizeClass} />;
      case 'briefcase':
        return <Briefcase className={iconSizeClass} />;
      case 'landmark':
        return <Landmark className={iconSizeClass} />;
      case 'sparkles':
        return <Sparkles className={iconSizeClass} />;
      default:
        return <span>{initials}</span>;
    }
  };

  const bgClass =
    account.cardStatus === 'banned'
      ? 'bg-rose-600 text-white'
      : preset
      ? `${preset.bgClass} ${preset.accentClass}`
      : 'bg-blue-600 text-white';

  const frameRing =
    size === 'sm'
      ? account.avatarFrameId && account.avatarFrameId !== 'frame-clean'
        ? frame.ringClass
            .replace('ring-offset-2', 'ring-offset-1')
            .replace('ring-offset-white', 'ring-offset-slate-900')
        : ''
      : frame.ringClass;

  const livingMotionClass = isExclusiveAura
    ? size === 'sm'
      ? 'bn-frame-living-sm'
      : frame.auraTheme === 'petir'
      ? 'bn-frame-living-cyber'
      : 'bn-frame-living'
    : '';

  const showGooglePhoto = Boolean(googlePicture) && !account.avatarPresetId;

  const badgeCore = (
    <div
      className={`relative flex items-center justify-center font-bold shrink-0 ${sizeClass} ${bgClass} ${frameRing} ${livingMotionClass} ${
        stageHighlight ? 'bn-frame-stage-boost' : ''
      } ${!isExclusiveAura ? className : ''}`}
    >
      {isExclusiveAura &&
        frame.auraTheme &&
        (size === 'sm'
          ? renderCompactSmOverlay(frame.auraTheme)
          : renderFullArchitecturalAura(frame.auraTheme, stageHighlight))}
      <div className="relative z-10 w-full h-full rounded-[inherit] overflow-hidden flex items-center justify-center">
        {showGooglePhoto ? (
          <img
            src={googlePicture}
            alt={account.fullName}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          renderSymbol()
        )}
      </div>
    </div>
  );

  if (isExclusiveAura) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 bn-frame-hover-wrap ${className}`}>
        {badgeCore}
      </div>
    );
  }

  return badgeCore;
};
