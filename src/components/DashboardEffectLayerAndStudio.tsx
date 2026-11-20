/**
 * DashboardEffectLayerAndStudio.tsx
 * Tampilan Efek Dashboard hingga 1.000.000x di Layar Nasabah (100% Dikendalikan dari Panel Admin):
 * - Seluruh tab pengaturan maupun tombol kontrol di sisi nasabah tetap dihapus agar 100% dikendalikan oleh Admin di Panel Admin.
 * - Menggunakan dismissedDashPackageNonces (tersimpan persisten di Context + sessionStorage) & stageForceClearNonce
 *   sehingga panggung yang sudah ditutup/habis durasi TIDAK PERNAH muncul ulang saat berpindah tab/refresh,
 *   kecuali Admin menembak ulang paketnya (triggerNonce naik).
 * - Mendukung semua 24 fitur Studio Efek Dashboard: Multi-Combo 3 Efek, Marquee Ticker, VIP Siren Alert,
 *   Bingkai Layar Neon 3D, Jejak Kursor Interaktif, Lencana Trofi Mengambang, Gravitasi/Kecepatan/Ukuran Partikel,
 *   Auto-Rotate Playlist, Jadwal Jam Otomatis, Filter Tier/Level/Role Dev, & 16 Gaya Audio Synth + TTS.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, AlertTriangle, Radio } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AdminDashboardEffectPackage, BankAccount } from '../types/bank';
import {
  CelebrationAudioSynthStyle,
  CelebrationEffectProfile,
  getCelebrationEffectProfile,
  stopAllCelebrationEffectsAndAudio,
  triggerCanvasConfettiForCelebration,
} from '../data/celebrationEffectsCatalog';
import {
  CelebrationClaimBurstOverlay,
  PreClaimMagicRingSealAura,
} from './CelebrationSpectacleOverlay';

export const isDashboardEffectActiveForAccount = (
  pkg: AdminDashboardEffectPackage,
  accountOrId: string | BankAccount,
  nowMs: number = Date.now()
): boolean => {
  const accountId = typeof accountOrId === 'string' ? accountOrId : accountOrId.id;
  const accountObj = typeof accountOrId === 'string' ? null : accountOrId;

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
  if (!isTargeted) return false;

  // Optional Tier / Career Level / Dev Role Filters (when account object is available)
  if (accountObj) {
    if (Array.isArray(pkg.targetCardTiers) && pkg.targetCardTiers.length > 0) {
      if (!pkg.targetCardTiers.includes(accountObj.cardTier)) {
        return false;
      }
    }
    if (typeof pkg.minJobLevelTarget === 'number' && pkg.minJobLevelTarget > 1) {
      if ((accountObj.jobLevel || 1) < pkg.minJobLevelTarget) {
        return false;
      }
    }
    if (pkg.targetDevRoleId && pkg.targetDevRoleId.trim()) {
      if (accountObj.devRoleId !== pkg.targetDevRoleId) {
        return false;
      }
    }
  }

  return true;
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
  accountOrId: string | BankAccount,
  nowMs: number = Date.now()
): {
  eligiblePackages: AdminDashboardEffectPackage[];
  primaryPackage: AdminDashboardEffectPackage | null;
} => {
  const accountId = typeof accountOrId === 'string' ? accountOrId : accountOrId.id;
  if (!accountId) {
    return { eligiblePackages: [], primaryPackage: null };
  }
  const eligiblePackages = allPackages.filter((pkg) =>
    isDashboardEffectActiveForAccount(pkg, accountOrId, nowMs)
  );
  // 1) Forced primary for this account
  const forcedPrimary =
    eligiblePackages.find((pkg) =>
      (pkg.forcedPrimaryForAccountIds || []).includes(accountId)
    ) || null;
  // 2) VIP Priority Lock package
  const vipLockedPrimary =
    eligiblePackages.find((pkg) => pkg.vipPriorityLock) || null;

  return {
    eligiblePackages,
    primaryPackage: forcedPrimary || vipLockedPrimary || eligiblePackages[0] || null,
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

  return resolveActiveDashboardEffectsForAccount(
    dashboardEffectEvents,
    currentAccount || '',
    nowMs
  );
};

interface CursorTrailDot {
  id: number;
  x: number;
  y: number;
  emoji: string;
}

export const DashboardActiveEffectBannerAndAura: React.FC = () => {
  const {
    currentAccount,
    activeDashboardEffectModal,
    closeDashboardEffectStageModal,
    stageForceClearNonce,
    dismissedDashPackageNonces,
    markDashboardPackageDismissed,
  } = useBank();
  const { eligiblePackages, primaryPackage } = useActiveCustomerDashboardEffects();

  const [stageBurst, setStageBurst] = useState<{
    pkg: AdminDashboardEffectPackage;
    resolvedEffectId: string;
    nonce: number;
  } | null>(null);

  const [playlistIndex, setPlaylistIndex] = useState<number>(0);
  const [trailDots, setTrailDots] = useState<CursorTrailDot[]>([]);

  const seenNoncesRef = useRef<Record<string, number>>({});
  const lastForceClearSeenRef = useRef<number>(stageForceClearNonce);
  const trailCounterRef = useRef<number>(1);

  const activePkg = primaryPackage;

  // Handle Force Clear Stage from Admin or Global Overlay
  useEffect(() => {
    if (stageForceClearNonce !== lastForceClearSeenRef.current) {
      lastForceClearSeenRef.current = stageForceClearNonce;
      setStageBurst(null);
      stopAllCelebrationEffectsAndAudio();
      eligiblePackages.forEach((p) => {
        const curN = p.triggerNonce || 1;
        seenNoncesRef.current[p.id] = curN;
        markDashboardPackageDismissed(p.id, curN);
      });
    }
  }, [stageForceClearNonce, eligiblePackages, markDashboardPackageDismissed]);

  // Helper to resolve effective effect ID (supports Gacha Random mode & Auto-Rotate Playlist)
  const pickBlastEffectId = (pkg: AdminDashboardEffectPackage): string => {
    if (pkg.gachaRandomEffectOnBlast) {
      const playlist = Array.isArray(pkg.playlistEffectIds) && pkg.playlistEffectIds.length > 0
        ? pkg.playlistEffectIds
        : [pkg.celebrationEffect, ...(pkg.secondaryComboEffectIds || [])];
      const cleanPool = playlist.filter((x) => x && x !== 'none');
      if (cleanPool.length > 0) {
        return cleanPool[Math.floor(Math.random() * cleanPool.length)];
      }
    }
    return pkg.celebrationEffect;
  };

  // Trigger stage burst strictly once per new triggerNonce (survives tab switching via dismissedDashPackageNonces!)
  useEffect(() => {
    if (!currentAccount || eligiblePackages.length === 0) return;

    for (const pkg of eligiblePackages) {
      const currentNonce = pkg.triggerNonce || 1;
      const dismissedNonce = dismissedDashPackageNonces[pkg.id] || 0;
      const prevSeen = seenNoncesRef.current[pkg.id];

      // Already cleared by Admin Force Clear Stage
      if (stageForceClearNonce > 0 && currentNonce <= stageForceClearNonce) {
        seenNoncesRef.current[pkg.id] = currentNonce;
        markDashboardPackageDismissed(pkg.id, currentNonce);
        continue;
      }

      // Already dismissed at this exact nonce (e.g. user closed stage and switched tabs back)
      if (dismissedNonce >= currentNonce) {
        seenNoncesRef.current[pkg.id] = currentNonce;
        continue;
      }

      if (prevSeen !== undefined && currentNonce <= prevSeen) {
        continue;
      }

      seenNoncesRef.current[pkg.id] = currentNonce;

      // On first mount, only auto-open if autoBlastOnOpen is ON AND Admin triggered within last 35 seconds
      if (prevSeen === undefined) {
        if (!pkg.autoBlastOnOpen || !pkg.lastTriggeredAt) continue;
        const elapsedMs = Date.now() - new Date(pkg.lastTriggeredAt).getTime();
        if (elapsedMs < 0 || elapsedMs > 35_000) {
          markDashboardPackageDismissed(pkg.id, currentNonce);
          continue;
        }
      } else if (!pkg.autoBlastOnOpen) {
        continue;
      }

      const resolvedEff = pickBlastEffectId(pkg);
      const prof = getCelebrationEffectProfile(resolvedEff);
      if (prof.id === 'none') {
        markDashboardPackageDismissed(pkg.id, currentNonce);
        continue;
      }
      triggerCanvasConfettiForCelebration(
        prof.id,
        pkg.celebrationIntensity || '100000x'
      );
      markDashboardPackageDismissed(pkg.id, currentNonce);
      setStageBurst({
        pkg,
        resolvedEffectId: prof.id,
        nonce: Date.now(),
      });
      break;
    }
  }, [
    eligiblePackages,
    currentAccount,
    dismissedDashPackageNonces,
    markDashboardPackageDismissed,
    stageForceClearNonce,
  ]);

  // Scheduled HH:MM trigger watcher
  useEffect(() => {
    if (!activePkg?.scheduledTriggerTime || !currentAccount) return;
    const checkSchedule = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const hhmm = `${hh}:${mm}`;
      if (hhmm === activePkg.scheduledTriggerTime) {
        const key = `bn_sched_fired_${activePkg.id}_${now.toDateString()}_${hhmm}`;
        try {
          if (window.sessionStorage.getItem(key)) return;
          window.sessionStorage.setItem(key, '1');
        } catch {
          return;
        }
        const resolvedEff = pickBlastEffectId(activePkg);
        const prof = getCelebrationEffectProfile(resolvedEff);
        triggerCanvasConfettiForCelebration(
          prof.id,
          activePkg.celebrationIntensity || '100000x'
        );
        setStageBurst({
          pkg: activePkg,
          resolvedEffectId: prof.id,
          nonce: Date.now(),
        });
      }
    };
    const timer = window.setInterval(checkSchedule, 10_000);
    return () => window.clearInterval(timer);
  }, [activePkg, currentAccount]);

  // Listen to direct modal trigger from Admin/context
  useEffect(() => {
    if (!activeDashboardEffectModal) return;
    const found = eligiblePackages.find(
      (p) => p.id === activeDashboardEffectModal.packageId
    );
    if (found) {
      const resolvedEff = pickBlastEffectId(found);
      const prof = getCelebrationEffectProfile(resolvedEff);
      triggerCanvasConfettiForCelebration(
        prof.id,
        found.celebrationIntensity || '100000x'
      );
      markDashboardPackageDismissed(found.id, found.triggerNonce || 1);
      setStageBurst({
        pkg: found,
        resolvedEffectId: prof.id,
        nonce: activeDashboardEffectModal.nonce,
      });
    }
    closeDashboardEffectStageModal();
  }, [
    activeDashboardEffectModal,
    eligiblePackages,
    closeDashboardEffectStageModal,
    markDashboardPackageDismissed,
  ]);

  // Auto-rotate playlist effect timer (for Banner + Ambient display)
  const playlistPool = useMemo(() => {
    if (!activePkg) return [];
    const base = activePkg.celebrationEffect;
    const raw =
      activePkg.autoRotatePlaylistEnabled &&
      Array.isArray(activePkg.playlistEffectIds) &&
      activePkg.playlistEffectIds.length > 0
        ? [base, ...activePkg.playlistEffectIds]
        : [base];
    return Array.from(new Set(raw.filter((x) => x && x !== 'none')));
  }, [activePkg]);

  useEffect(() => {
    if (!activePkg?.autoRotatePlaylistEnabled || playlistPool.length <= 1) {
      setPlaylistIndex(0);
      return;
    }
    const intervalMs = Math.max(4, activePkg.playlistIntervalSeconds || 10) * 1000;
    const id = window.setInterval(() => {
      setPlaylistIndex((prev) => (prev + 1) % playlistPool.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [activePkg?.autoRotatePlaylistEnabled, activePkg?.playlistIntervalSeconds, playlistPool.length]);

  // Cursor Trail Mode listener (Admin-controlled, lightweight)
  useEffect(() => {
    const mode = activePkg?.cursorTrailMode || 'none';
    if (!activePkg || mode === 'none') {
      setTrailDots([]);
      return;
    }
    const modeEmoji: Record<string, string[]> = {
      sparkle_dust: ['✨', '⭐', '💫'],
      theme_sparkles: ['✨', '⭐', '💫'],
      rainbow_stars: ['🌟', '🌈', '💖', '⚡'],
      gold_coins: ['🪙', '💰', '👑'],
      neon_laser: ['💠', '🔷', '⚡'],
      fire_aura: ['🔥', '💥', '☄️'],
    };
    const pool = modeEmoji[mode] || ['✨'];
    let lastEmit = 0;
    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastEmit < 55) return;
      lastEmit = now;
      const dotId = trailCounterRef.current++;
      const emoji = pool[dotId % pool.length];
      setTrailDots((prev) => [...prev.slice(-11), { id: dotId, x: e.clientX, y: e.clientY, emoji }]);
      window.setTimeout(() => {
        setTrailDots((prev) => prev.filter((d) => d.id !== dotId));
      }, 550);
    };
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    return () => window.removeEventListener('pointermove', onPointerMove);
  }, [activePkg]);

  if (!currentAccount || !activePkg) {
    return null;
  }

  const displayedEffectId =
    playlistPool.length > 0 ? playlistPool[playlistIndex % playlistPool.length] : activePkg.celebrationEffect;

  const profile: CelebrationEffectProfile = getCelebrationEffectProfile(displayedEffectId);
  if (profile.id === 'none') {
    return null;
  }
  const intensity = activePkg.celebrationIntensity || '100000x';
  const showAmbientParticles = activePkg.showAmbientParticles !== false;
  const bannerStyle = activePkg.bannerStyle || 'full_top_banner';
  const showBannerBox =
    activePkg.showPersistentDashboardAura && bannerStyle !== 'aura_only_no_banner';

  const particleCount = Math.min(28, Math.max(6, Math.round((activePkg.customParticleCount || 60) / 5)));
  const speedMult = Math.max(0.5, activePkg.animationSpeedMultiplier || 1);
  const sizeScale = Math.max(0.65, Math.min(1.85, activePkg.particleSizeScale || 1));

  const borderFrameClassMap: Record<string, string> = {
    none: '',
    gold_royal: 'ring-4 ring-inset ring-amber-400/75 shadow-[inset_0_0_45px_rgba(251,191,36,0.35)]',
    cyber_neon: 'ring-4 ring-inset ring-cyan-400/75 shadow-[inset_0_0_45px_rgba(34,211,238,0.35)]',
    rainbow_prism: 'ring-4 ring-inset ring-fuchsia-400/75 shadow-[inset_0_0_50px_rgba(217,70,239,0.35)]',
    rainbow_overdrive: 'ring-4 ring-inset ring-fuchsia-400/75 shadow-[inset_0_0_50px_rgba(217,70,239,0.35)]',
    fire_inferno: 'ring-4 ring-inset ring-orange-500/80 shadow-[inset_0_0_50px_rgba(249,115,22,0.4)]',
    crimson_alert: 'ring-4 ring-inset ring-rose-500/80 shadow-[inset_0_0_50px_rgba(244,63,94,0.4)]',
    emerald_laser: 'ring-4 ring-inset ring-emerald-400/75 shadow-[inset_0_0_45px_rgba(52,211,153,0.35)]',
    emerald_matrix: 'ring-4 ring-inset ring-emerald-400/75 shadow-[inset_0_0_45px_rgba(52,211,153,0.35)]',
  };
  const screenBorderClass = borderFrameClassMap[activePkg.screenBorderFrame || 'none'] || '';

  const badgePosRaw = activePkg.floatingBadgePosition || 'bottom_right';
  const badgePosClass =
    badgePosRaw === 'top_right' || badgePosRaw === 'top-right'
      ? 'top-24 right-4'
      : badgePosRaw === 'bottom_left' || badgePosRaw === 'bottom-left'
      ? 'bottom-20 left-4'
      : 'bottom-24 right-4';

  return (
    <>
      {/* FULL-SCREEN STAGE BURST OVERLAY WHEN TRIGGERED BY ADMIN */}
      {stageBurst && (
        <CelebrationClaimBurstOverlay
          effectId={stageBurst.resolvedEffectId}
          secondaryComboEffectIds={stageBurst.pkg.secondaryComboEffectIds || []}
          burstNonce={stageBurst.nonce}
          intensityLevel={stageBurst.pkg.celebrationIntensity || '100000x'}
          customHeadlineOverride={stageBurst.pkg.title}
          customSubtextOverride={stageBurst.pkg.welcomeMessage}
          customSenderOverride={stageBurst.pkg.senderName}
          forceSilentAudio={stageBurst.pkg.soundMode === 'silent'}
          autoDismissSeconds={stageBurst.pkg.stageDurationSeconds || 8}
          customParticleCount={stageBurst.pkg.customParticleCount}
          animationSpeedMultiplier={stageBurst.pkg.animationSpeedMultiplier}
          particleSizeScale={stageBurst.pkg.particleSizeScale}
          gravityDirection={stageBurst.pkg.gravityDirection}
          showStadiumSpotlights={stageBurst.pkg.showStadiumSpotlights}
          showLightningBolts={stageBurst.pkg.showLightningBolts}
          ttsVoiceAnnouncementEnabled={stageBurst.pkg.ttsVoiceAnnouncementEnabled}
          ttsCustomText={stageBurst.pkg.ttsCustomText}
          audioSynthOverride={
            (stageBurst.pkg.audioSynthOverride as CelebrationAudioSynthStyle | 'auto_theme') ||
            'auto_theme'
          }
          soundVolumePercent={stageBurst.pkg.soundVolumePercent ?? 100}
          forceClearNonce={stageForceClearNonce}
          onDismiss={() => {
            markDashboardPackageDismissed(
              stageBurst.pkg.id,
              stageBurst.pkg.triggerNonce || 1
            );
            setStageBurst(null);
          }}
        />
      )}

      {/* FULL-SCREEN NEON 3D BORDER FRAME (ADMIN CONTROLLED) */}
      {screenBorderClass && (
        <div
          className={`pointer-events-none fixed inset-0 z-[25] ${screenBorderClass}`}
          aria-hidden="true"
        />
      )}

      {/* CUSTOM CURSOR / POINTER TRAIL (ADMIN CONTROLLED) */}
      {trailDots.length > 0 && (
        <div className="pointer-events-none fixed inset-0 z-[75] overflow-hidden select-none" aria-hidden="true">
          {trailDots.map((dot) => (
            <span
              key={dot.id}
              style={{ left: dot.x, top: dot.y }}
              className="fixed -translate-x-1/2 -translate-y-1/2 text-lg animate-ping opacity-80"
            >
              {dot.emoji}
            </span>
          ))}
        </div>
      )}

      {/* FLOATING 3D TROPHY HOLOGRAM BADGE (ADMIN CONTROLLED) */}
      {activePkg.showFloatingTrophyBadge && (
        <div
          className={`pointer-events-none fixed ${badgePosClass} z-[35] px-3 py-2 rounded-2xl bg-slate-950/90 border-2 ${profile.cardBorderAccentClass} shadow-2xl flex items-center gap-2 select-none animate-bounce`}
          aria-hidden="true"
        >
          <span className="text-2xl">{profile.primaryEmoji}</span>
          <div className="leading-tight">
            <span className="text-[9px] font-mono uppercase text-amber-300 font-black block">
              {profile.trophyTitle}
            </span>
            <span className="text-[10px] text-white font-bold block">
              {intensity.toUpperCase()} AKTIF
            </span>
          </div>
        </div>
      )}

      {/* AMBIENT FLOATING PARTICLES ACROSS DASHBOARD VIEWPORT (CONTROLLED BY ADMIN) */}
      {showAmbientParticles && (
        <div
          className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none"
          aria-hidden="true"
        >
          {Array.from({ length: particleCount }).map((_, idx) => {
            const emoji =
              profile.particleEmojis[idx % profile.particleEmojis.length] ||
              profile.primaryEmoji;
            const leftPct = (idx * 7.3 + 4) % 94;
            const topPct = (idx * 13.7 + 9) % 86;
            const delaySec = (idx % 6) * 0.45;
            return (
              <span
                key={`dash-amb-${idx}`}
                className="absolute opacity-25 animate-bounce"
                style={{
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  fontSize: `${Math.round(18 * sizeScale)}px`,
                  animationDelay: `${delaySec}s`,
                  animationDuration: `${(3.6 + (idx % 4) * 0.7) / speedMult}s`,
                }}
              >
                {emoji}
              </span>
            );
          })}
        </div>
      )}

      {/* VIP SIREN ALERT MODE (ADMIN CONTROLLED) */}
      {activePkg.vipSirenAlertMode && (
        <div className="relative rounded-2xl border-2 border-rose-400 bg-gradient-to-r from-rose-950 via-red-900 to-amber-950 px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2 animate-pulse">
          <div className="flex items-center gap-2.5 text-white">
            <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0" />
            <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] uppercase">
              🚨 PENGUMUMAN SIRINE VIP ADMIN
            </span>
            <span className="font-black text-xs sm:text-sm">{activePkg.title}</span>
          </div>
          <span className="text-[11px] font-mono text-amber-200 font-bold">
            Otoritas: {activePkg.senderName}
          </span>
        </div>
      )}

      {/* RUNNING MARQUEE TICKER (ADMIN CONTROLLED) */}
      {activePkg.showMarqueeTicker && (activePkg.marqueeTickerText || activePkg.welcomeMessage) && (
        <div className="relative rounded-2xl border border-amber-400/50 bg-slate-950/90 px-4 py-2 overflow-hidden flex items-center gap-2.5 shadow-lg">
          <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9.5px] uppercase shrink-0 flex items-center gap-1">
            <Radio className="w-3 h-3" />
            <span>LIVE TICKER</span>
          </span>
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <p className="text-xs font-bold text-amber-200 animate-pulse truncate">
              {profile.primaryEmoji} {activePkg.marqueeTickerText || activePkg.welcomeMessage} •{' '}
              {activePkg.senderName}
            </p>
          </div>
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
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-cyan-300/40 text-cyan-200 font-mono font-bold text-[9.5px]">
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
