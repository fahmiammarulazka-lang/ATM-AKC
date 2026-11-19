/**
 * CelebrationSpectacleOverlay
 * - Hiasan Pra-Klaim (PreClaimCelebrationDecor): Partikel atmosfer halus + Ornamen Sudut + Lencana Perayaan
 *   yang tampil pada Modal, Amplop Tersegel, dan Kotak Hadiah Tersegel sebelum diklaim.
 * - Efek Ledakan Spektakuler Saat Klaim (CelebrationClaimBurstOverlay): Hujan 36+ ikon perayaan,
 *   cincin gelombang kejut sinematik, dan banner perayaan saat nasabah membuka hadiah/surat
 *   atau saat Admin menekan tombol "Tes Efek Perayaan Sekarang".
 */
import React, { useMemo } from 'react';
import { Sparkles, X } from 'lucide-react';
import {
  CelebrationEffectProfile,
  getCelebrationEffectProfile,
} from '../data/celebrationEffectsCatalog';

// ============================================================================
// 1. HIASAN PRA-KLAIM DI LATAR MODAL & KARTU TERSEGEL (SEBELUM DIKLAIM)
// ============================================================================
export const PreClaimCelebrationAmbientBackdrop: React.FC<{
  effectId?: string | null;
}> = ({ effectId }) => {
  const profile = getCelebrationEffectProfile(effectId);

  const ambientNodes = useMemo(() => {
    if (profile.id === 'none') return [];
    const emojis = profile.particleEmojis;
    return Array.from({ length: 14 }).map((_, idx) => {
      const emoji = emojis[idx % emojis.length];
      const leftPct = 5 + ((idx * 17) % 90);
      const topPct = 6 + ((idx * 23) % 86);
      const delaySec = (idx % 5) * 0.45;
      const sizeClass = idx % 3 === 0 ? 'text-xl' : idx % 2 === 0 ? 'text-base' : 'text-sm';
      return {
        id: idx,
        emoji,
        leftPct,
        topPct,
        delaySec,
        sizeClass,
      };
    });
  }, [profile]);

  if (profile.id === 'none') return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-0"
      aria-hidden="true"
    >
      {/* Sudut Ornamen Khas Perayaan */}
      <div className="absolute top-3 left-3 text-lg sm:text-xl opacity-80 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>
      <div className="absolute top-3 right-14 text-lg sm:text-xl opacity-80 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>
      <div className="absolute bottom-3 left-3 text-lg sm:text-xl opacity-80 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>
      <div className="absolute bottom-3 right-3 text-lg sm:text-xl opacity-80 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>

      {/* Partikel Atmosfer Melayang Halus Sebelum Diklaim */}
      {ambientNodes.map((node) => (
        <span
          key={node.id}
          style={{
            left: `${node.leftPct}%`,
            top: `${node.topPct}%`,
            animationDelay: `${node.delaySec}s`,
          }}
          className={`absolute ${node.sizeClass} opacity-25 select-none animate-bounce`}
        >
          {node.emoji}
        </span>
      ))}
    </div>
  );
};

// ============================================================================
// 2. HIASAN GARLAND & LENCANA TEMA PADA AMPLOP & KOTAK HADIAH TERSEGEL
// ============================================================================
export const PreClaimCardOrnamentStrip: React.FC<{
  effectId?: string | null;
  targetType: 'envelope' | 'gift_box';
}> = ({ effectId, targetType }) => {
  const profile = getCelebrationEffectProfile(effectId);
  if (profile.id === 'none') return null;

  const stripEmojis = profile.particleEmojis.slice(0, 5);

  return (
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/80 border border-white/15">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{profile.primaryEmoji}</span>
        <span className="text-[10px] font-black tracking-wide text-white">
          {profile.shortBadge}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs select-none" aria-hidden="true">
        {stripEmojis.map((em, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-300 group-hover:scale-125"
          >
            {em}
          </span>
        ))}
      </div>
      <span className="text-[9.5px] font-mono font-bold text-amber-200/90">
        {targetType === 'envelope' ? 'Segel Perayaan' : 'Hadiah Perayaan'}
      </span>
    </div>
  );
};

// ============================================================================
// 3. OVERLAY LEDAKAN SELEBRASI LAYAR PENUH SAAT KLAIM / BUKA / TES EFEK
// ============================================================================
export const CelebrationClaimBurstOverlay: React.FC<{
  effectId?: string | null;
  burstNonce: number;
  onDismiss?: () => void;
  isPreviewMode?: boolean;
}> = ({ effectId, burstNonce, onDismiss, isPreviewMode = false }) => {
  const profile: CelebrationEffectProfile = getCelebrationEffectProfile(effectId);

  const particles = useMemo(() => {
    if (!burstNonce || profile.id === 'none') return [];
    const emojis = profile.particleEmojis;
    return Array.from({ length: 36 }).map((_, i) => {
      const emoji = emojis[i % emojis.length];
      const left = 2 + ((i * 11 + (burstNonce % 7) * 3) % 95);
      const delayMs = (i % 9) * 110;
      const durationMs = 2400 + (i % 5) * 420;
      const sizeRem = i % 4 === 0 ? '2.25rem' : i % 3 === 0 ? '1.85rem' : '1.45rem';
      const horizontalDrift = ((i % 2 === 0 ? 1 : -1) * (15 + (i % 4) * 12));
      return {
        id: `${burstNonce}-${i}`,
        emoji,
        left,
        delayMs,
        durationMs,
        sizeRem,
        horizontalDrift,
      };
    });
  }, [burstNonce, profile]);

  if (!burstNonce || profile.id === 'none') return null;

  const isRising = profile.motionStyle === 'lantern_rise';

  return (
    <div
      className="fixed inset-0 z-[70] pointer-events-none flex flex-col items-center justify-start pt-6 sm:pt-10 px-4 overflow-hidden"
      aria-live="polite"
    >
      <style>{`
        @keyframes bnCelebrationFall {
          0% {
            transform: translate3d(0, -12vh, 0) scale(0.4) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(12px, 15vh, 0) scale(1.15) rotate(12deg);
          }
          80% {
            opacity: 0.95;
            transform: translate3d(-12px, 78vh, 0) scale(1) rotate(-14deg);
          }
          100% {
            transform: translate3d(18px, 108vh, 0) scale(0.75) rotate(24deg);
            opacity: 0;
          }
        }
        @keyframes bnCelebrationRise {
          0% {
            transform: translate3d(0, 105vh, 0) scale(0.5) rotate(0deg);
            opacity: 0;
          }
          18% {
            opacity: 1;
            transform: translate3d(-10px, 75vh, 0) scale(1.1) rotate(-8deg);
          }
          82% {
            opacity: 0.95;
            transform: translate3d(12px, 18vh, 0) scale(1.05) rotate(8deg);
          }
          100% {
            transform: translate3d(-8px, -14vh, 0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Gelombang Hujan / Lampion Ikon Khas Perayaan di Seluruh Layar */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.left}%`,
              top: 0,
              fontSize: p.sizeRem,
              animationName: isRising ? 'bnCelebrationRise' : 'bnCelebrationFall',
              animationDuration: `${p.durationMs}ms`,
              animationDelay: `${p.delayMs}ms`,
              animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              animationFillMode: 'forwards',
            }}
            className="absolute select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.45)]"
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Banner Puncak Selebrasi di Bagian Atas Layar */}
      <div
        className={`pointer-events-auto relative z-10 max-w-2xl w-full rounded-3xl bg-gradient-to-r ${profile.bannerGradientClass} border-2 p-4 sm:p-5 shadow-[0_0_60px_rgba(0,0,0,0.75)] backdrop-blur-xl animate-fadeIn`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-slate-950/80 border-2 border-white/30 flex items-center justify-center text-3xl shrink-0 shadow-xl animate-bounce">
              {profile.primaryEmoji}
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${profile.badgeClass}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {isPreviewMode
                      ? `PRATINJAU EFEK: ${profile.name.toUpperCase()}`
                      : profile.shortBadge.toUpperCase()}
                  </span>
                </span>
                <span className="text-xs select-none">
                  {profile.particleEmojis.slice(0, 5).join(' ')}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black text-white leading-snug">
                {profile.celebrationHeadline}
              </h3>
              <p className="text-xs text-slate-200 leading-relaxed">
                {profile.celebrationSubtext}
              </p>
            </div>
          </div>

          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="p-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-slate-300 hover:text-white cursor-pointer shrink-0"
              title="Tutup Banner Selebrasi"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
