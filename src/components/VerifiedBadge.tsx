/**
 * Official Blue Checkmark Verification Badge Icon (Centang Biru Bank Nusantara),
 * Permanent 16-Digit User ID Above Name Banner (Format 4x4 + Tombol Salin ID),
 * and Official Admin Account (Akun OA) Badge.
 */
import React, { useState } from 'react';
import { Copy, CheckCircle2, Fingerprint, ShieldCheck } from 'lucide-react';
import { ensureAccountUserId16, formatUserId16, maskUserId16Full } from '../utils/bankUtils';

interface VerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
  showText?: boolean;
  text?: string;
  className?: string;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  size = 'sm',
  label = 'Akun Terverifikasi Resmi (Centang Biru Admin)',
  showLabel = false,
  showText = false,
  text,
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

  const shouldShowLabel = showLabel || showText;
  const badgeText = text || label;

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
      {shouldShowLabel && (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#1D9BF0]/20 text-sky-300 border border-[#1D9BF0]/40 tracking-wide">
          {badgeText}
        </span>
      )}
    </span>
  );
};

interface OaAccountBadgeProps {
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const OaAccountBadge: React.FC<OaAccountBadgeProps> = ({
  size = 'xs',
  className = '',
}) => {
  const sizeClass =
    size === 'xs'
      ? 'text-[9px] px-1.5 py-0.5'
      : size === 'sm'
      ? 'text-[10px] px-2 py-0.5'
      : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-emerald-500/25 border border-amber-400/50 text-amber-200 font-black uppercase tracking-wider shrink-0 shadow-sm ${sizeClass} ${className}`}
      title="Akun OA Resmi Buatan Panel Admin (Dapat Login via Login Dengan Akun OA)"
    >
      <ShieldCheck className="w-3 h-3 text-amber-300 shrink-0" />
      <span>AKUN OA</span>
    </span>
  );
};

interface UserId16AboveNameBannerProps {
  account?: {
    id?: string;
    accountNumber?: string;
    nik?: string;
    userId16?: string;
    isOfficialAdminAccount?: boolean;
  } | null;
  userId16?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'default' | 'card' | 'navbar' | 'light';
  showCopyButton?: boolean;
  showPermanentTag?: boolean;
  masked?: boolean;
  className?: string;
}

export const UserId16AboveNameBanner: React.FC<UserId16AboveNameBannerProps> = ({
  account,
  userId16,
  size = 'sm',
  variant = 'default',
  showCopyButton = true,
  showPermanentTag = false,
  masked = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const resolvedId16 = userId16
    ? userId16.replace(/\D/g, '').padEnd(16, '0').slice(0, 16)
    : account
    ? ensureAccountUserId16(account)
    : '0000000000000000';

  const formatted4x4 = masked ? maskUserId16Full() : formatUserId16(resolvedId16);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      navigator.clipboard.writeText(resolvedId16);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore clipboard errors
    }
  };

  if (variant === 'card') {
    return (
      <div
        className={`inline-flex flex-wrap items-center gap-1.5 px-2 py-0.5 rounded-md bg-black/35 border border-white/20 backdrop-blur-sm max-w-full ${className}`}
        title="ID 16 Digit Permanen Pengguna (Tidak Dapat Diubah oleh User)"
      >
        <Fingerprint className="w-3 h-3 text-cyan-300 shrink-0" />
        <span className="text-[9px] uppercase tracking-wider text-white/75 font-bold shrink-0">
          ID:
        </span>
        <span className="font-mono text-[10px] sm:text-[11px] font-black text-amber-200 tracking-wider select-all">
          {formatted4x4}
        </span>
        {showCopyButton && (
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/15 hover:bg-white/25 text-[9px] font-bold text-white transition cursor-pointer shrink-0"
            title="Salin 16 Digit ID User"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-300" />
                <span className="text-emerald-200">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-2.5 h-2.5 text-cyan-200" />
                <span>Salin ID</span>
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  if (variant === 'navbar') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 text-[10px] font-mono leading-none ${className}`}
        title="ID 16 Digit Permanen Pengguna"
      >
        <span className="text-cyan-400 font-bold uppercase tracking-wider">ID:</span>
        <span className="text-amber-300 font-black tracking-wide">{formatted4x4}</span>
        {showCopyButton && (
          <span
            role="button"
            tabIndex={0}
            onClick={handleCopy}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') handleCopy(e as any);
            }}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[9px] text-cyan-200 font-sans font-bold cursor-pointer transition"
            title="Salin ID 16 Digit"
          >
            {copied ? (
              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-cyan-300" />
            )}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/80 border border-cyan-500/35 shadow-sm max-w-full ${className}`}
      title="ID 16 Digit Permanen Pengguna (Tidak Dapat Diubah oleh Nasabah)"
    >
      <Fingerprint
        className={`${
          size === 'xs' ? 'w-3 h-3' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
        } text-cyan-400 shrink-0`}
      />
      <span
        className={`${
          size === 'xs' ? 'text-[9px]' : 'text-[10px]'
        } font-extrabold uppercase tracking-wider text-cyan-300 shrink-0`}
      >
        ID USER 16 DIGIT:
      </span>
      <span
        className={`font-mono ${
          size === 'xs'
            ? 'text-[10px]'
            : size === 'sm'
            ? 'text-[11px] sm:text-xs'
            : 'text-xs sm:text-sm'
        } font-black text-amber-300 tracking-wider select-all`}
      >
        {formatted4x4}
      </span>
      {showPermanentTag && (
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-bold uppercase tracking-wider">
          Permanen
        </span>
      )}
      {showCopyButton && (
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-[10px] font-bold text-cyan-200 transition cursor-pointer shrink-0"
          title="Salin ID 16 Digit"
        >
          {copied ? (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-300">Tersalin!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3 text-cyan-300" />
              <span>Salin ID</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
