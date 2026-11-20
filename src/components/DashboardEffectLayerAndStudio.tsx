/**
 * DashboardEffectLayerAndStudio.tsx
 * Tampilan Efek Dashboard 100.000x di Layar Nasabah (100% Dikendalikan dari Panel Admin):
 * - Seluruh tab pengaturan maupun tombol kontrol di sisi nasabah telah dihapus agar 100% dikendalikan oleh Admin di Panel Admin.
 * - Ketika Admin mengirim atau menembak ulang Efek Dashboard ke 1 orang, banyak akun, atau semua nasabah,
 *   Panggung 7-Lapis 100.000x otomatis meledak secara Real-Time via Cloud RTDB di layar Dashboard nasabah.
 * - Tampil tidaknya Spanduk Sambutan, Gaya Spanduk (Full / Pita Ringkas / Aura Saja), Aura Kartu Saldo,
 *   Hujan Partikel Latar, Suara Fanfare Synthesizer, dan Durasi Aktif sepenuhnya mengikuti pengaturan Panel Admin.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AdminDashboardEffectPackage } from '../types/bank';
import {
  CelebrationEffectProfile,
  getCelebrationEffectProfile,
  triggerCanvasConfettiForCelebration,
} from '../data/celebrationEffectsCatalog';
import {
  CelebrationClaimBurstOverlay,
  PreClaimMagicRingSealAura,
} from './CelebrationSpectacleOverlay';

export const isDashboardEffectActiveForAccount = (
  pkg: AdminDashboardEffectPackage,
  accountId: string,
  nowMs: number = Date.now()
): boolean => {
  if (!pkg.isActive) return false;
  if ((pkg.revokedAccountIds || []).includes(accountId)) return false;
  if (pkg.expiresAt) {
    const expMs = new Date(pkg.expiresAt).getTime();
    if (!Number.isNaN(expMs) && nowMs > expMs) {
      return false;
    }
  }
  const hasMulti = Array.isArray(pkg.targetAccountIds) && pkg.targetAccountIds.length > 0;
  const isTargeted =
    !pkg.targetAccountId ||
    pkg.targetAccountId === '__ALL__' ||
    pkg.targetAccountId === accountId ||
    (hasMulti && pkg.targetAccountIds!.includes(accountId));
  return isTargeted;
};

export const formatDashboardEffectRemainingLabel = (
  pkg: AdminDashboardEffectPackage,
  nowMs: number = Date.now()
): string => {
  if (!pkg.expiresAt || pkg.durationType === 'permanent') {
    return '♾️ Aktif Permanen';
  }
  const diffMs = new Date(pkg.expiresAt).getTime() - nowMs;
  if (diffMs <= 0) return 'Berakhir';
  const totalSecs = Math.ceil(diffMs / 1000);
  if (totalSecs < 60) return `⏱️ Sisa ${totalSecs} Detik`;
  const totalMins = Math.ceil(diffMs / 60000);
  if (totalMins < 60) return `⏱️ Sisa ${totalMins} Menit`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs < 24) return `⏱️ Sisa ${hrs}j ${mins}m`;
  const days = Math.floor(hrs / 24);
  return `📅 Sisa ${days} Hari ${hrs % 24} Jam`;
};

export const resolveActiveDashboardEffectsForAccount = (
  allPackages: AdminDashboardEffectPackage[],
  accountId: string,
  nowMs: number = Date.now()
): {
  eligiblePackages: AdminDashboardEffectPackage[];
  primaryPackage: AdminDashboardEffectPackage | null;
} => {
  if (!accountId) {
    return { eligiblePackages: [], primaryPackage: null };
  }
  const eligiblePackages = allPackages.filter((pkg) =>
    isDashboardEffectActiveForAccount(pkg, accountId, nowMs)
  );
  // Check if Admin explicitly pinned a primary package for this account
  const forcedPrimary =
    eligiblePackages.find((pkg) =>
      (pkg.forcedPrimaryForAccountIds || []).includes(accountId)
    ) || null;

  return {
    eligiblePackages,
    primaryPackage: forcedPrimary || eligiblePackages[0] || null,
  };
};

export const useActiveCustomerDashboardEffects = () => {
  const { currentAccount, dashboardEffectEvents } = useBank();
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const hasTimed = dashboardEffectEvents.some(
      (p) => p.isActive && Boolean(p.expiresAt) && p.durationType !== 'permanent'
    );
    if (!hasTimed) return;
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [dashboardEffectEvents]);

  const accountId = currentAccount?.id || '';
  return resolveActiveDashboardEffectsForAccount(
    dashboardEffectEvents,
    accountId,
    nowMs
  );
};

export const DashboardActiveEffectBannerAndAura: React.FC = () => {
  const {
    currentAccount,
    activeDashboardEffectModal,
    closeDashboardEffectStageModal,
  } = useBank();
  const { eligiblePackages, primaryPackage } = useActiveCustomerDashboardEffects();

  const [stageBurst, setStageBurst] = useState<{
    pkg: AdminDashboardEffectPackage;
    nonce: number;
  } | null>(null);

  // Track seen triggerNonces per package ID so real-time blasts from Admin immediately fire the 100,000x stage
  const seenNoncesRef = useRef<Record<string, number>>({});
  const hasHydratedInitialNoncesRef = useRef<boolean>(false);

  const activePkg = primaryPackage;

  useEffect(() => {
    if (!currentAccount || eligiblePackages.length === 0) return;

    if (!hasHydratedInitialNoncesRef.current) {
      hasHydratedInitialNoncesRef.current = true;
      eligiblePackages.forEach((p) => {
        seenNoncesRef.current[p.id] = p.triggerNonce || 1;
      });
      // If the primary/newest package has autoBlastOnOpen and was triggered by Admin within the last 45 seconds, blast immediately
      const candidate = primaryPackage || eligiblePackages[0];
      if (candidate && candidate.autoBlastOnOpen && candidate.lastTriggeredAt) {
        const elapsedMs = Date.now() - new Date(candidate.lastTriggeredAt).getTime();
        if (elapsedMs >= 0 && elapsedMs < 45000) {
          const prof = getCelebrationEffectProfile(candidate.celebrationEffect);
          triggerCanvasConfettiForCelebration(
            prof.id,
            candidate.celebrationIntensity || '100000x'
          );
          setStageBurst({
            pkg: candidate,
            nonce: Date.now(),
          });
        }
      }
      return;
    }

    for (const pkg of eligiblePackages) {
      const prevNonce = seenNoncesRef.current[pkg.id];
      const currentNonce = pkg.triggerNonce || 1;
      if (prevNonce === undefined || currentNonce > prevNonce) {
        seenNoncesRef.current[pkg.id] = currentNonce;
        if (pkg.autoBlastOnOpen || prevNonce !== undefined) {
          const prof = getCelebrationEffectProfile(pkg.celebrationEffect);
          triggerCanvasConfettiForCelebration(
            prof.id,
            pkg.celebrationIntensity || '100000x'
          );
          setStageBurst({
            pkg,
            nonce: Date.now(),
          });
          break;
        }
      }
    }
  }, [eligiblePackages, primaryPackage, currentAccount]);

  // Listen to direct modal trigger from context if triggered by Admin action
  useEffect(() => {
    if (!activeDashboardEffectModal) return;
    const found = eligiblePackages.find(
      (p) => p.id === activeDashboardEffectModal.packageId
    );
    if (found) {
      const prof = getCelebrationEffectProfile(found.celebrationEffect);
      triggerCanvasConfettiForCelebration(
        prof.id,
        found.celebrationIntensity || '100000x'
      );
      setStageBurst({
        pkg: found,
        nonce: activeDashboardEffectModal.nonce,
      });
    }
    closeDashboardEffectStageModal();
  }, [activeDashboardEffectModal, eligiblePackages, closeDashboardEffectStageModal]);

  if (!currentAccount || !activePkg) {
    return null;
  }

  const profile: CelebrationEffectProfile = getCelebrationEffectProfile(
    activePkg.celebrationEffect
  );
  const intensity = activePkg.celebrationIntensity || '100000x';
  const showAmbientParticles = activePkg.showAmbientParticles !== false;
  const bannerStyle = activePkg.bannerStyle || 'full_top_banner';
  const showBannerBox =
    activePkg.showPersistentDashboardAura && bannerStyle !== 'aura_only_no_banner';

  return (
    <>
      {/* FULL-SCREEN 100,000X STAGE BURST OVERLAY WHEN TRIGGERED BY ADMIN */}
      {stageBurst && (
        <CelebrationClaimBurstOverlay
          effectId={stageBurst.pkg.celebrationEffect}
          burstNonce={stageBurst.nonce}
          intensityLevel={stageBurst.pkg.celebrationIntensity || '100000x'}
          customHeadlineOverride={stageBurst.pkg.title}
          customSubtextOverride={stageBurst.pkg.welcomeMessage}
          customSenderOverride={stageBurst.pkg.senderName}
          forceSilentAudio={stageBurst.pkg.soundMode === 'silent'}
          autoDismissSeconds={stageBurst.pkg.stageDurationSeconds || 12}
          onDismiss={() => setStageBurst(null)}
        />
      )}

      {/* AMBIENT FLOATING PARTICLES ACROSS DASHBOARD VIEWPORT (CONTROLLED BY ADMIN) */}
      {showAmbientParticles && (
        <div
          className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none"
          aria-hidden="true"
        >
          {Array.from({ length: 14 }).map((_, idx) => {
            const emoji =
              profile.particleEmojis[idx % profile.particleEmojis.length] ||
              profile.primaryEmoji;
            const leftPct = (idx * 7.3 + 4) % 94;
            const topPct = (idx * 13.7 + 9) % 86;
            const delaySec = (idx % 6) * 0.45;
            return (
              <span
                key={`dash-amb-${idx}`}
                className="absolute text-base sm:text-xl opacity-25 animate-bounce"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  animationDelay: `${delaySec}s`,
                  animationDuration: `${3.6 + (idx % 4) * 0.7}s`,
                }}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      )}

      {/* PERSISTENT DASHBOARD EFFECT BANNER (100% READ-ONLY FOR CUSTOMER, CONTROLLED BY ADMIN) */}
      {showBannerBox && bannerStyle === 'compact_ribbon' && (
        <div
          className={`relative rounded-2xl border-2 ${profile.cardBorderAccentClass} bg-gradient-to-r ${profile.bannerGradientClass} px-4 py-2.5 shadow-xl ${profile.cardGlowClass} overflow-hidden transition-all`}
        >
          <div className="pointer-events-none absolute inset-0 bg-slate-950/35" />
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="text-xl select-none shrink-0">{profile.primaryEmoji}</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-300 text-slate-950 font-black text-[9.5px] uppercase tracking-wider shrink-0">
                {profile.shortBadge} • {intensity.toUpperCase()}
              </span>
              <span className="font-black text-white text-xs sm:text-sm truncate">
                {activePkg.title}
              </span>
              <span className="text-[11px] text-white/90 hidden md:inline truncate">
                — {activePkg.welcomeMessage}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] text-amber-200 font-bold">
                {activePkg.senderName}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-950/80 border border-cyan-300/40 text-cyan-200 font-mono font-bold text-[9.5px]">
                {formatDashboardEffectRemainingLabel(activePkg)}
              </span>
            </div>
          </div>
        </div>
      )}

      {showBannerBox && bannerStyle === 'full_top_banner' && (
        <div
          className={`relative rounded-3xl border-2 ${profile.cardBorderAccentClass} bg-gradient-to-r ${profile.bannerGradientClass} p-4 sm:p-5 shadow-2xl ${profile.cardGlowClass} overflow-hidden transition-all`}
        >
          <div className="pointer-events-none absolute inset-0 bg-slate-950/35" />
          <div className="pointer-events-none absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5 min-w-0">
              {/* 3D Rotating Magic Mandala Seal Emblem */}
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center shrink-0">
                <PreClaimMagicRingSealAura effectId={profile.id} />
                <div
                  className={`relative z-10 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${profile.waxSealGradientClass} border-2 border-white shadow-xl flex items-center justify-center text-2xl sm:text-3xl select-none`}
                >
                  {profile.primaryEmoji}
                </div>
              </div>

              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 font-black text-[9.5px] uppercase tracking-wider flex items-center gap-1 shadow">
                    <Sparkles className="w-3 h-3" />
                    <span>EFEK DASHBOARD AKTIF • PANGGUNG {intensity.toUpperCase()}</span>
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-white/25 text-white font-bold text-[9.5px]">
                    {profile.shortBadge}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-950/80 border border-cyan-300/40 text-cyan-200 font-mono font-bold text-[9.5px]">
                    {formatDashboardEffectRemainingLabel(activePkg)}
                  </span>
                </div>

                <h3 className="font-black text-white text-sm sm:text-lg tracking-tight drop-shadow">
                  {activePkg.title}
                </h3>

                <p className="text-xs text-white/95 leading-relaxed max-w-3xl">
                  {activePkg.welcomeMessage}{' '}
                  <span className="text-amber-200 font-bold">
                    — {activePkg.senderName}
                  </span>
                </p>
              </div>
            </div>

            {/* Decorative Theme Emblem Strip (Zero Customer Control Buttons) */}
            <div className="flex items-center gap-1.5 bg-slate-950/75 border border-white/20 px-3 py-2 rounded-2xl shrink-0 self-start lg:self-center">
              {profile.particleEmojis.slice(0, 5).map((em, idx) => (
                <span key={idx} className="text-base sm:text-lg select-none">
                  {em}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
