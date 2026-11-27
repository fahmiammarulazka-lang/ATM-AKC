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
  className?: string;
}

const renderLivingAuraOverlay = (
  auraTheme: 'petir' | 'api' | 'emas' | 'es' | 'galaksi' | undefined,
  size: 'sm' | 'md' | 'lg' | 'xl'
) => {
  if (!auraTheme || size === 'sm') return null;

  switch (auraTheme) {
    case 'petir':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none z-20 overflow-visible bn-aura-svg-spin"
          aria-hidden="true"
        >
          <path
            d="M48 1 L55 11 L49 12 L56 22"
            fill="none"
            stroke="#67e8f9"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M97 48 L88 55 L89 49 L79 56"
            fill="none"
            stroke="#e0f2fe"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M52 99 L45 89 L51 88 L44 78"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M3 52 L12 45 L11 51 L21 44"
            fill="none"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="19" cy="18" r="2.2" fill="#ffffff" />
          <circle cx="82" cy="81" r="2.2" fill="#67e8f9" />
        </svg>
      );
    case 'api':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none z-20 overflow-visible bn-aura-svg-pulse"
          aria-hidden="true"
        >
          <path
            d="M50 0 C54 7, 57 10, 50 16 C43 10, 46 7, 50 0 Z"
            fill="#fb923c"
          />
          <path
            d="M99 48 C92 52, 89 55, 84 48 C89 41, 92 44, 99 48 Z"
            fill="#f97316"
          />
          <path
            d="M50 100 C46 93, 43 90, 50 84 C57 90, 54 93, 50 100 Z"
            fill="#ef4444"
          />
          <path
            d="M1 52 C8 48, 11 45, 16 52 C11 59, 8 56, 1 52 Z"
            fill="#fde047"
          />
          <circle cx="16" cy="16" r="2.4" fill="#fde047" />
          <circle cx="85" cy="18" r="2.1" fill="#fb7185" />
          <circle cx="83" cy="84" r="2.5" fill="#fdba74" />
          <circle cx="16" cy="83" r="2" fill="#ef4444" />
        </svg>
      );
    case 'emas':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none z-20 overflow-visible bn-aura-svg-spin"
          aria-hidden="true"
        >
          <polygon points="50,0 52,9 60,10 52,12 50,20 48,12 40,10 48,9" fill="#fef08a" />
          <polygon points="90,50 84,52 83,57 81,52 76,50 81,48 83,43 84,48" fill="#fde047" />
          <polygon points="50,80 52,88 58,90 52,92 50,100 48,92 42,90 48,88" fill="#fef08a" />
          <polygon points="10,50 16,48 17,43 19,48 24,50 19,52 17,57 16,52" fill="#facc15" />
          <circle cx="20" cy="20" r="2" fill="#ffffff" />
          <circle cx="80" cy="20" r="2" fill="#fde047" />
        </svg>
      );
    case 'es':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none z-20 overflow-visible bn-aura-svg-spin-rev"
          aria-hidden="true"
        >
          <g stroke="#e0f2fe" strokeWidth="1.8" strokeLinecap="round">
            <line x1="50" y1="2" x2="50" y2="14" />
            <line x1="45" y1="8" x2="55" y2="8" />
            <line x1="92" y1="44" x2="92" y2="56" />
            <line x1="86" y1="50" x2="98" y2="50" />
            <line x1="50" y1="86" x2="50" y2="98" />
            <line x1="45" y1="92" x2="55" y2="92" />
            <line x1="8" y1="44" x2="8" y2="56" />
            <line x1="2" y1="50" x2="14" y2="50" />
          </g>
          <polygon points="17,12 20,17 17,22 14,17" fill="#bae6fd" />
          <polygon points="83,78 86,83 83,88 80,83" fill="#ffffff" />
        </svg>
      );
    case 'galaksi':
      return (
        <svg
          viewBox="0 0 100 100"
          className="absolute -inset-2.5 w-[calc(100%+20px)] h-[calc(100%+20px)] pointer-events-none z-20 overflow-visible bn-aura-svg-spin"
          aria-hidden="true"
        >
          <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(232,121,249,0.45)" strokeWidth="1.2" strokeDasharray="8 6" />
          <circle cx="50" cy="3" r="3" fill="#f0abfc" />
          <circle cx="95" cy="58" r="2.4" fill="#c084fc" />
          <circle cx="24" cy="90" r="2.8" fill="#818cf8" />
          <polygon points="15,18 17,21 20,22 17,23 15,26 13,23 10,22 13,21" fill="#ffffff" />
          <polygon points="82,16 83.5,19 86.5,20 83.5,21 82,24 80.5,21 77.5,20 80.5,19" fill="#f472b6" />
        </svg>
      );
    default:
      return null;
  }
};

export const ProfileAvatarBadge: React.FC<ProfileAvatarBadgeProps> = ({
  account,
  googlePicture,
  size = 'lg',
  className = '',
}) => {
  const preset = getAvatarPresetById(account.avatarPresetId);
  const frame = getAvatarFrameById(account.avatarFrameId);

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
        ? frame.ringClass.replace('ring-offset-2', 'ring-offset-1').replace('ring-offset-white', 'ring-offset-slate-900')
        : ''
      : frame.ringClass;

  const showGooglePhoto = Boolean(googlePicture) && !account.avatarPresetId;

  return (
    <div
      className={`relative flex items-center justify-center font-bold shrink-0 ${sizeClass} ${bgClass} ${frameRing} ${className}`}
    >
      {renderLivingAuraOverlay(frame.auraTheme, size)}
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
};
