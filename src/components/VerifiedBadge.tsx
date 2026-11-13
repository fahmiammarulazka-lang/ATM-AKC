/**
 * Official Blue Checkmark Verification Badge Icon (Centang Biru Bank Nusantara)
 * Diberikan dan diverifikasi oleh Admin di Panel Admin.
 */
import React from 'react';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  label = 'Akun Terverifikasi Resmi (Centang Biru Admin)',
  showLabel = false,
  className = '',
}) => {
  const dimensions =
    size === 'xs'
      ? 'w-3.5 h-3.5'
      : size === 'sm'
      ? 'w-4 h-4'
      : size === 'md'
      ? 'w-5 h-5'
      : 'w-6 h-6';

  return (
    <span
      className={`inline-flex items-center gap-1 select-none shrink-0 ${className}`}
      title={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${dimensions} drop-shadow-[0_0_6px_rgba(29,155,240,0.65)]`}
        aria-label="Verified Badge"
      >
        {/* Starburst / Rosette Verified Seal in vibrant Twitter/Meta Blue */}
        <path
          d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34z"
          fill="#1D9BF0"
        />
        {/* Crisp White Checkmark inside */}
        <path
          d="M9.64 16.65L5.29 12.3l1.42-1.42 2.93 2.93 6.65-6.65 1.42 1.42-8.07 8.07z"
          fill="#FFFFFF"
        />
      </svg>
      {showLabel && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1D9BF0]/20 text-sky-300 border border-[#1D9BF0]/40 tracking-wide">
          {label}
        </span>
      )}
    </span>
  );
};
