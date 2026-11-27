import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Crown, Shield, Gem, Flame, Briefcase, Landmark, Sparkles } from 'lucide-react';
import { BankAccount } from '../types/bank';
import {
  getAvatarFrameById,
  getAvatarPresetById,
} from '../data/profileCustomizationCatalog';
import { LiveCanvasTheme, LiveFrameCanvas } from './LiveFrameCanvas';

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

const THEME_BASE_STAGGER_MS: Record<AuraTheme, number> = {
  petir: 200,
  api: 1200,
  emas: 2200,
  es: 3200,
  galaksi: 4200,
};

function computeDeterministicBurstOffsetMs(theme: AuraTheme, fullName: string): number {
  let hash = 0;
  for (let i = 0; i < fullName.length; i += 1) {
    hash = (hash * 31 + fullName.charCodeAt(i)) % 900;
  }
  return (THEME_BASE_STAGGER_MS[theme] + hash) % 5000;
}

const renderCompactSmOverlay = (auraTheme: AuraTheme) => {
  switch (auraTheme) {
    case 'petir':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Thick Cyber chamfered corner brackets */}
          <path d="M1 24 L1 6 L10 1 L26 1" fill="none" stroke="#67e8f9" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 1 L90 1 L99 10 L99 24" fill="none" stroke="#67e8f9" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M1 76 L1 90 L10 99 L26 99" fill="none" stroke="#22d3ee" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 99 L90 99 L99 90 L99 76" fill="none" stroke="#22d3ee" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Top mini Volt badge + alternating spark */}
          <polygon points="50,-11 60,-2 55,7 45,7 40,-2" fill="#083344" stroke="#67e8f9" strokeWidth="3" />
          <path d="M52,-7 L47,-1 L52,-1 L48,4" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" className="bn-obj-bolt-a" />
          <path d="M97,45 L106,50 L98,56" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" className="bn-obj-bolt-b" />
        </svg>
      );
    case 'api':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Bold curved Dragon Horns top left/right */}
          <path d="M14 15 C5 -4, -1 -14, 14 -16 C19 -6, 23 3, 30 8 Z" fill="#fb923c" stroke="#fef08a" strokeWidth="2.2" />
          <path d="M86 15 C95 -4, 101 -14, 86 -16 C81 -6, 77 3, 70 8 Z" fill="#fb923c" stroke="#fef08a" strokeWidth="2.2" />
          {/* Rising embers */}
          <circle cx="50" cy="-6" r="4.2" fill="#fde047" className="bn-obj-ember-a" />
          <circle cx="96" cy="36" r="3.4" fill="#fb923c" className="bn-obj-ember-b" />
        </svg>
      );
    case 'emas':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Bold Royal Gold Crown at top */}
          <path
            d="M30 7 L35 -11 L44 -2 L50 -16 L56 -2 L65 -11 L70 7 Z"
            fill="#facc15"
            stroke="#78350f"
            strokeWidth="2.2"
            strokeLinejoin="round"
            className="bn-obj-crown-float"
          />
          <circle cx="50" cy="-1" r="3" fill="#e11d48" className="bn-obj-crown-float" />
          {/* Gold corner studs */}
          <circle cx="6" cy="6" r="4" fill="#fde047" stroke="#78350f" strokeWidth="1.2" />
          <circle cx="94" cy="6" r="4" fill="#fde047" stroke="#78350f" strokeWidth="1.2" />
          <circle cx="6" cy="94" r="4" fill="#fde047" stroke="#78350f" strokeWidth="1.2" />
          <circle cx="94" cy="94" r="4" fill="#fde047" stroke="#78350f" strokeWidth="1.2" />
        </svg>
      );
    case 'es':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[6px] w-[calc(100%+12px)] h-[calc(100%+12px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* 4 corner faceted ice crystal prisms */}
          <polygon points="-7,-7 16,1 3,16" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.2" className="bn-obj-ice-glint" />
          <polygon points="107,-7 84,1 97,16" fill="#bae6fd" stroke="#0284c7" strokeWidth="2.2" className="bn-obj-ice-glint" />
          <polygon points="-7,107 16,99 3,84" fill="#bae6fd" stroke="#0284c7" strokeWidth="2.2" className="bn-obj-ice-glint" />
          <polygon points="107,107 84,99 97,84" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2.2" className="bn-obj-ice-glint" />
          {/* Drifting snowflakes */}
          <circle cx="50" cy="-7" r="3.6" fill="#ffffff" className="bn-obj-snow-a" />
          <circle cx="101" cy="54" r="3.2" fill="#bae6fd" className="bn-obj-snow-b" />
        </svg>
      );
    case 'galaksi':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-[7px] w-[calc(100%+14px)] h-[calc(100%+14px)] pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {/* Tilted cosmic orbital ellipse */}
          <ellipse
            cx="50"
            cy="50"
            rx="57"
            ry="23"
            transform="rotate(-24 50 50)"
            fill="none"
            stroke="rgba(240,171,252,0.9)"
            strokeWidth="3"
            className="bn-obj-nebula-breathe"
          />
          {/* Mini Saturn top-right */}
          <g className="bn-obj-planet-bob">
            <circle cx="92" cy="8" r="7.5" fill="#d946ef" stroke="#ffffff" strokeWidth="1.8" />
            <ellipse cx="92" cy="8" rx="12.5" ry="3.8" transform="rotate(-22 92 8)" fill="none" stroke="#fde047" strokeWidth="2.2" />
          </g>
          {/* Mini crescent moon bottom-left */}
          <path
            d="M12 82 A8.5 8.5 0 1 0 22 93 A6.5 6.5 0 1 1 12 82 Z"
            fill="#fef08a"
            stroke="#f59e0b"
            strokeWidth="1.2"
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
    ? '-inset-4 w-[calc(100%+32px)] h-[calc(100%+32px)]'
    : '-inset-3 w-[calc(100%+24px)] h-[calc(100%+24px)]';

  switch (auraTheme) {
    case 'petir':
      return (
        <svg
          viewBox="-18 -20 136 140"
          className={`absolute ${insetClass} pointer-events-none z-20 overflow-visible`}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bnCyberMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="50%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#1e3a8a" />
            </linearGradient>
          </defs>

          {/* Bold Cyber-Tech Chamfered Brackets */}
          <path d="M 0 26 L 0 7 L 12 -1 L 34 -1" fill="none" stroke="#67e8f9" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 66 -1 L 88 -1 L 100 7 L 100 26" fill="none" stroke="#67e8f9" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 0 74 L 0 93 L 12 101 L 34 101" fill="none" stroke="#22d3ee" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 66 101 L 88 101 L 100 93 L 100 74" fill="none" stroke="#22d3ee" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Top Cyber Volt Crest Shield */}
          <g className="bn-obj-tesla-hum">
            <polygon points="50,-18 66,-6 60,6 40,6 34,-6" fill="#082f49" stroke="url(#bnCyberMetal)" strokeWidth="3" />
            <path d="M 53 -13 L 45 -3 L 51 -3 L 47 4 L 56 -5 L 50 -5 Z" fill="#fef08a" />
          </g>

          {/* Dual Side Tesla High-Voltage Coils */}
          <g className="bn-obj-tesla-hum">
            <rect x="-12" y="36" width="10" height="28" rx="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.6" />
            <line x1="-12" y1="43" x2="-2" y2="43" stroke="#67e8f9" strokeWidth="2" />
            <line x1="-12" y1="50" x2="-2" y2="50" stroke="#ffffff" strokeWidth="2.2" />
            <line x1="-12" y1="57" x2="-2" y2="57" stroke="#67e8f9" strokeWidth="2" />
            <circle cx="-7" cy="32" r="3.4" fill="#ffffff" stroke="#22d3ee" strokeWidth="1.5" />

            <rect x="102" y="36" width="10" height="28" rx="3.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="2.6" />
            <line x1="102" y1="43" x2="112" y2="43" stroke="#67e8f9" strokeWidth="2" />
            <line x1="102" y1="50" x2="112" y2="50" stroke="#ffffff" strokeWidth="2.2" />
            <line x1="102" y1="57" x2="112" y2="57" stroke="#67e8f9" strokeWidth="2" />
            <circle cx="107" cy="32" r="3.4" fill="#ffffff" stroke="#22d3ee" strokeWidth="1.5" />
          </g>

          {/* 3 Bold Alternating Flickering Lightning Arcs */}
          <path d="M 10 -12 L 19 -2 L 13 -1 L 21 9" fill="none" stroke="#ffffff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="bn-obj-bolt-a" />
          <path d="M 91 -11 L 83 -1 L 90 1 L 80 10" fill="none" stroke="#67e8f9" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="bn-obj-bolt-b" />
          <path d="M 47 101 L 55 109 L 49 111 L 57 120" fill="none" stroke="#22d3ee" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" className="bn-obj-bolt-c" />
        </svg>
      );

    case 'api':
      return (
        <svg
          viewBox="-18 -22 136 142"
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

          {/* Bold Dragon-Scale Scalloped Obsidian-Molten Rim */}
          <path d="M 4 88 Q 28 110 50 104 Q 72 110 96 88" fill="none" stroke="url(#bnDragonScale)" strokeWidth="6.5" strokeLinecap="round" />
          <path d="M 35 103 L 50 117 L 65 103 Z" fill="#ef4444" stroke="#fde047" strokeWidth="2.2" />

          {/* Bold Curved Dragon Horns */}
          <path d="M 16 15 C 2 3, -8 -13, 12 -20 C 16 -8, 22 2, 32 7 Z" fill="url(#bnDragonHorn)" stroke="#fef08a" strokeWidth="2" />
          <path d="M 84 15 C 98 3, 108 -13, 88 -20 C 84 -8, 78 2, 68 7 Z" fill="url(#bnDragonHorn)" stroke="#fef08a" strokeWidth="2" />

          {/* Side Dragon Wing / Claw Guard Silhouettes */}
          <path d="M -2 27 C -16 37, -16 54, -3 72 C -7 58, -7 44, -2 27 Z" fill="#dc2626" stroke="#fde047" strokeWidth="2" />
          <path d="M 102 27 C 116 37, 116 54, 103 72 C 107 58, 107 44, 102 27 Z" fill="#dc2626" stroke="#fde047" strokeWidth="2" />

          {/* Undulating Wavy Dragon Flame Tongues */}
          <path d="M 50 -20 C 59 -9, 63 -1, 50 6 C 37 -1, 41 -9, 50 -20 Z" fill="#fb923c" stroke="#fef08a" strokeWidth="2" className="bn-obj-flame-a" />
          <path d="M 0 22 C -12 13, -12 1, 2 -3 C 4 8, 6 16, 0 22 Z" fill="#f97316" className="bn-obj-flame-b" />
          <path d="M 100 22 C 112 13, 112 1, 98 -3 C 96 8, 94 16, 100 22 Z" fill="#ef4444" className="bn-obj-flame-a" />
        </svg>
      );

    case 'emas':
      return (
        <svg
          viewBox="-18 -24 136 144"
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

          {/* Bold Baroque Double Filigree Bevel + Corner Ruby Jewels */}
          <rect x="-2" y="-2" width="104" height="104" rx="16" fill="none" stroke="url(#bnRoyalGold)" strokeWidth="4.2" />
          <circle cx="3" cy="3" r="5" fill="#e11d48" stroke="#fef08a" strokeWidth="2" />
          <circle cx="97" cy="3" r="5" fill="#e11d48" stroke="#fef08a" strokeWidth="2" />
          <circle cx="3" cy="97" r="5" fill="#e11d48" stroke="#fef08a" strokeWidth="2" />
          <circle cx="97" cy="97" r="5" fill="#e11d48" stroke="#fef08a" strokeWidth="2" />

          {/* Sweeping Metallic Gold Sheen Band */}
          <g clipPath="url(#bnImperialSheenMask)">
            <rect x="0" y="-14" width="28" height="132" fill="rgba(255,255,255,0.52)" className="bn-obj-gold-sheen" />
          </g>

          {/* Sculpted Royal Gold Crown */}
          <g className="bn-obj-crown-float">
            <path d="M 27 5 L 31 -14 L 42 -5 L 50 -20 L 58 -5 L 69 -14 L 73 5 Z" fill="url(#bnRoyalGold)" stroke="#78350f" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="50" cy="-3" r="3.4" fill="#e11d48" stroke="#fef9c3" strokeWidth="1.2" />
            <circle cx="36" cy="-1" r="2.4" fill="#0ea5e9" />
            <circle cx="64" cy="-1" r="2.4" fill="#0ea5e9" />
          </g>

          {/* Gold Laurel Wreath Leaves */}
          <path d="M -8 74 C -15 58, -15 41, -7 25 M -10 63 L -2 58 M -11 50 L -2 47 M -10 37 L -2 35" fill="none" stroke="#fde047" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 108 74 C 115 58, 115 41, 107 25 M 110 63 L 102 58 M 111 50 L 102 47 M 110 37 L 102 35" fill="none" stroke="#fde047" strokeWidth="3.2" strokeLinecap="round" />

          {/* Bottom Royal Seal Crest */}
          <polygon points="50,98 58,107 50,116 42,107" fill="url(#bnRoyalGold)" stroke="#78350f" strokeWidth="1.8" />
        </svg>
      );

    case 'es':
      return (
        <svg
          viewBox="-18 -20 136 140"
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

          {/* Bold Geometric Faceted Glacial Rim */}
          <polygon points="14,-3 86,-3 103,14 103,86 86,103 14,103 -3,86 -3,14" fill="none" stroke="url(#bnIceFacet)" strokeWidth="4" />

          {/* 4 Bold Sharp Diagonal Ice Prism Spears + Glacial Tiara */}
          <g className="bn-obj-ice-glint">
            <polygon points="-15,-15 15,0 6,7 0,15" fill="url(#bnIceFacet)" stroke="#0369a1" strokeWidth="1.6" />
            <polygon points="115,-15 85,0 94,7 100,15" fill="url(#bnIceFacet)" stroke="#0369a1" strokeWidth="1.6" />
            <polygon points="-15,115 15,100 6,93 0,85" fill="url(#bnIceFacet)" stroke="#0369a1" strokeWidth="1.6" />
            <polygon points="115,115 85,100 94,93 100,85" fill="url(#bnIceFacet)" stroke="#0369a1" strokeWidth="1.6" />
            <polygon points="50,-19 59,-3 50,4 41,-3" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.8" />
          </g>
        </svg>
      );

    case 'galaksi':
      return (
        <svg
          viewBox="-20 -20 140 140"
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

          {/* Bold Breathing Nebula Ring + Tilted Astrolabe Orbits */}
          <circle cx="50" cy="50" r="57" fill="none" stroke="rgba(192,132,252,0.58)" strokeWidth="3.2" className="bn-obj-nebula-breathe" />
          <ellipse cx="50" cy="50" rx="63" ry="24" transform="rotate(-26 50 50)" fill="none" stroke="rgba(240,171,252,0.9)" strokeWidth="2.8" strokeDasharray="10 4" className="bn-obj-nebula-breathe" />
          <ellipse cx="50" cy="50" rx="60" ry="22" transform="rotate(24 50 50)" fill="none" stroke="rgba(129,140,248,0.78)" strokeWidth="2.2" />

          {/* Bold Ringed Mini Saturn Planet Top-Right */}
          <g className="bn-obj-planet-bob">
            <circle cx="95" cy="5" r="9" fill="url(#bnSaturnBody)" stroke="#fae8ff" strokeWidth="1.8" />
            <ellipse cx="95" cy="5" rx="16" ry="4.6" transform="rotate(-20 95 5)" fill="none" stroke="#fde047" strokeWidth="2.5" />
          </g>

          {/* Bold Glowing Crescent Moon Bottom-Left */}
          <g className="bn-obj-moon-bob">
            <path d="M 6 82 A 10.5 10.5 0 1 0 18 96 A 8 8 0 1 1 6 82 Z" fill="#fef08a" stroke="#d97706" strokeWidth="1.4" />
          </g>
        </svg>
      );
  }
};

const renderBurstEffectOverlay = (
  auraTheme: AuraTheme,
  size: 'sm' | 'md' | 'lg' | 'xl',
  burstNonce: number,
  stageHighlight?: boolean
) => {
  const isSm = size === 'sm';
  const burstBoxClass = isSm
    ? '-inset-[9px] w-[calc(100%+18px)] h-[calc(100%+18px)]'
    : stageHighlight
    ? '-inset-7 w-[calc(100%+56px)] h-[calc(100%+56px)]'
    : '-inset-5 w-[calc(100%+40px)] h-[calc(100%+40px)]';

  switch (auraTheme) {
    case 'petir':
      return (
        <svg
          key={`burst-petir-${burstNonce}`}
          viewBox="-24 -24 148 148"
          className={`absolute ${burstBoxClass} pointer-events-none z-30 overflow-visible`}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="52" fill="rgba(186,230,253,0.38)" stroke="#ffffff" strokeWidth={isSm ? 4 : 3} className="bn-burst-flash" />
          <circle cx="50" cy="50" r="56" fill="none" stroke="#38bdf8" strokeWidth={isSm ? 4.5 : 3.5} className="bn-burst-shock" />
          <g className="bn-burst-bolt-strike">
            <path d="M 14 -20 L 32 4 L 18 10 L 44 36 L 34 42 L 54 66" fill="none" stroke="#ffffff" strokeWidth={isSm ? 6 : 5} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 14 -20 L 32 4 L 18 10 L 44 36 L 34 42 L 54 66" fill="none" stroke="#22d3ee" strokeWidth={isSm ? 2.8 : 2.4} strokeLinecap="round" strokeLinejoin="round" />
            <path d="M 88 -16 L 68 8 L 80 14 L 58 38" fill="none" stroke="#e0f2fe" strokeWidth={isSm ? 4.8 : 4} strokeLinecap="round" strokeLinejoin="round" />
            {!isSm && (
              <>
                <path d="M 32 4 L 46 2 L 56 -10" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" />
                <path d="M 62 72 L 76 92 L 66 96 L 84 118" fill="none" stroke="#67e8f9" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round" />
              </>
            )}
          </g>
        </svg>
      );

    case 'api':
      return (
        <svg
          key={`burst-api-${burstNonce}`}
          viewBox="-24 -32 148 156"
          className={`absolute ${burstBoxClass} pointer-events-none z-30 overflow-visible`}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="54" fill="rgba(249,115,22,0.28)" stroke="#fb923c" strokeWidth={isSm ? 4.5 : 3.5} className="bn-burst-shock" />
          <g className="bn-burst-flame-jet">
            <path d="M 50 -32 C 68 -12, 76 6, 58 26 L 50 18 L 42 26 C 24 6, 32 -12, 50 -32 Z" fill="#f97316" stroke="#fef08a" strokeWidth="2.4" />
            <path d="M 50 -22 C 60 -6, 62 5, 50 18 C 38 5, 40 -6, 50 -22 Z" fill="#fde047" />
            {!isSm && (
              <>
                <path d="M 22 4 C 10 -12, 16 -24, 29 -14 C 31 -5, 29 2, 22 4 Z" fill="#ef4444" />
                <path d="M 78 4 C 90 -12, 84 -24, 71 -14 C 69 -5, 71 2, 78 4 Z" fill="#ef4444" />
              </>
            )}
          </g>
          <circle cx="34" cy="18" r={isSm ? 4 : 3.6} fill="#fef08a" className="bn-burst-ember-jet-a" />
          <circle cx="66" cy="20" r={isSm ? 3.8 : 3.4} fill="#fb923c" className="bn-burst-ember-jet-b" />
          <circle cx="50" cy="6" r={isSm ? 4 : 3.8} fill="#ffffff" className="bn-burst-ember-jet-c" />
        </svg>
      );

    case 'emas':
      return (
        <svg
          key={`burst-emas-${burstNonce}`}
          viewBox="-24 -28 148 152"
          className={`absolute ${burstBoxClass} pointer-events-none z-30 overflow-visible`}
          aria-hidden="true"
        >
          <g className="bn-burst-sunburst">
            <circle cx="50" cy="50" r="54" fill="rgba(250,204,21,0.28)" stroke="#fef08a" strokeWidth={isSm ? 4 : 3} />
            <line x1="50" y1="-28" x2="50" y2="-4" stroke="#fef9c3" strokeWidth={isSm ? 4.5 : 3.8} strokeLinecap="round" />
            <line x1="50" y1="104" x2="50" y2="128" stroke="#fde047" strokeWidth={isSm ? 4.5 : 3.8} strokeLinecap="round" />
            <line x1="-28" y1="50" x2="-4" y2="50" stroke="#fef9c3" strokeWidth={isSm ? 4.5 : 3.8} strokeLinecap="round" />
            <line x1="104" y1="50" x2="128" y2="50" stroke="#fde047" strokeWidth={isSm ? 4.5 : 3.8} strokeLinecap="round" />
            {!isSm && (
              <>
                <line x1="-6" y1="-6" x2="10" y2="10" stroke="#facc15" strokeWidth="3.2" strokeLinecap="round" />
                <line x1="106" y1="-6" x2="90" y2="10" stroke="#facc15" strokeWidth="3.2" strokeLinecap="round" />
                <line x1="-6" y1="106" x2="10" y2="90" stroke="#facc15" strokeWidth="3.2" strokeLinecap="round" />
                <line x1="106" y1="106" x2="90" y2="90" stroke="#facc15" strokeWidth="3.2" strokeLinecap="round" />
              </>
            )}
          </g>
          <polygon points="34,12 37,18 43,20 37,22 34,28 31,22 25,20 31,18" fill="#ffffff" className="bn-burst-star-jet-a" />
          <polygon points="66,12 69,18 75,20 69,22 66,28 63,22 57,20 63,18" fill="#fef08a" className="bn-burst-star-jet-b" />
        </svg>
      );

    case 'es':
      return (
        <svg
          key={`burst-es-${burstNonce}`}
          viewBox="-24 -24 148 148"
          className={`absolute ${burstBoxClass} pointer-events-none z-30 overflow-visible`}
          aria-hidden="true"
        >
          <polygon points="8,8 23,13 13,23" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" className="bn-burst-ice-shard-1" />
          <polygon points="92,8 77,13 87,23" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.8" className="bn-burst-ice-shard-2" />
          <polygon points="8,92 23,87 13,77" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.8" className="bn-burst-ice-shard-3" />
          <polygon points="92,92 77,87 87,77" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" className="bn-burst-ice-shard-4" />
          <g className="bn-burst-snowstorm">
            <circle cx="50" cy="50" r="54" fill="rgba(186,230,253,0.26)" stroke="#e0f2fe" strokeWidth={isSm ? 3.5 : 2.8} strokeDasharray="8 10" />
            <circle cx="50" cy="-10" r={isSm ? 4.4 : 3.8} fill="#ffffff" />
            <circle cx="110" cy="50" r={isSm ? 4 : 3.4} fill="#bae6fd" />
            <circle cx="50" cy="110" r={isSm ? 4.4 : 3.8} fill="#ffffff" />
            <circle cx="-10" cy="50" r={isSm ? 4 : 3.4} fill="#7dd3fc" />
          </g>
        </svg>
      );

    case 'galaksi':
      return (
        <svg
          key={`burst-galaksi-${burstNonce}`}
          viewBox="-26 -26 152 152"
          className={`absolute ${burstBoxClass} pointer-events-none z-30 overflow-visible`}
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="56" fill="rgba(192,132,252,0.28)" stroke="#f0abfc" strokeWidth={isSm ? 4.5 : 3.4} className="bn-burst-supernova" />
          {!isSm && (
            <circle cx="50" cy="50" r="48" fill="none" stroke="#818cf8" strokeWidth="2.8" className="bn-burst-shock" />
          )}
          <g className="bn-burst-meteor">
            <line x1="62" y1="38" x2="98" y2="4" stroke="rgba(244,114,182,0.92)" strokeWidth={isSm ? 4.6 : 3.6} strokeLinecap="round" />
            <circle cx="60" cy="40" r={isSm ? 5.6 : 5} fill="#ffffff" />
            <polygon points="60,31 62,38 69,40 62,42 60,49 58,42 51,40 58,38" fill="#fef08a" />
          </g>
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
  const auraTheme = frame.auraTheme;
  const canvasTheme: LiveCanvasTheme =
    auraTheme || frame.ambientTheme || 'clean';

  const [burstNonce, setBurstNonce] = useState(0);
  const [isBursting, setIsBursting] = useState(false);
  const burstHideTimerRef = useRef<number | null>(null);

  const burstOffsetMs = useMemo(() => {
    if (!auraTheme) return 0;
    return computeDeterministicBurstOffsetMs(auraTheme, account.fullName || 'BN');
  }, [auraTheme, account.fullName]);

  const triggerBurst = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }
    if (burstHideTimerRef.current !== null) {
      window.clearTimeout(burstHideTimerRef.current);
    }
    setBurstNonce((prev) => prev + 1);
    setIsBursting(true);
    burstHideTimerRef.current = window.setTimeout(() => {
      setIsBursting(false);
      burstHideTimerRef.current = null;
    }, 1140);
  }, []);

  useEffect(() => {
    if (!isExclusiveAura || !auraTheme) {
      setIsBursting(false);
      return;
    }
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let intervalId: number | null = null;
    const initialTimerId = window.setTimeout(() => {
      triggerBurst();
      intervalId = window.setInterval(() => {
        triggerBurst();
      }, 5000);
    }, burstOffsetMs);

    return () => {
      window.clearTimeout(initialTimerId);
      if (intervalId !== null) window.clearInterval(intervalId);
      if (burstHideTimerRef.current !== null) {
        window.clearTimeout(burstHideTimerRef.current);
        burstHideTimerRef.current = null;
      }
    };
  }, [isExclusiveAura, auraTheme, burstOffsetMs, triggerBurst]);

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
      ? frame.ringClass
          .replace('ring-offset-2', 'ring-offset-1')
          .replace('ring-offset-white', 'ring-offset-slate-900')
      : frame.ringClass;

  const livingMotionClass = isExclusiveAura
    ? size === 'sm'
      ? 'bn-frame-living-sm'
      : frame.auraTheme === 'petir'
      ? 'bn-frame-living-cyber'
      : 'bn-frame-living'
    : 'bn-frame-living-sm';

  const showGooglePhoto = Boolean(googlePicture) && !account.avatarPresetId;

  return (
    <div
      onClick={() => triggerBurst()}
      title={`${frame.label} — Ketuk untuk memicu efek aura`}
      className={`relative inline-flex items-center justify-center shrink-0 bn-frame-hover-wrap cursor-pointer ${className}`}
    >
      <div
        className={`relative flex items-center justify-center font-bold shrink-0 ${sizeClass} ${bgClass} ${frameRing} ${livingMotionClass} ${
          stageHighlight ? 'bn-frame-stage-boost' : ''
        }`}
      >
        {/* Real-time 60-120fps Canvas Particle & Plasma Engine for ALL 13 Frames */}
        <LiveFrameCanvas
          theme={canvasTheme}
          isExclusive={isExclusiveAura}
          size={size}
          burstTriggerNonce={burstNonce}
          stageHighlight={stageHighlight}
        />

        {/* Bespoke Structural Architecture & Thick Theme Objects for 5 Exclusive Frames */}
        {isExclusiveAura &&
          auraTheme &&
          (size === 'sm'
            ? renderCompactSmOverlay(auraTheme)
            : renderFullArchitecturalAura(auraTheme, stageHighlight))}

        {/* Dramatic 5-Second / Tap SVG Burst Overlay */}
        {isExclusiveAura &&
          auraTheme &&
          isBursting &&
          renderBurstEffectOverlay(auraTheme, size, burstNonce, stageHighlight)}

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
    </div>
  );
};
