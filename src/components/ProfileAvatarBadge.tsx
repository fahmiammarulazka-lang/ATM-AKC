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
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

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
      : 'w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-base sm:text-lg';

  const iconSizeClass =
    size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-5 h-5' : 'w-6 h-6';

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
      className={`relative flex items-center justify-center font-bold shrink-0 overflow-hidden ${sizeClass} ${bgClass} ${frameRing} ${className}`}
    >
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
  );
};
