/**
 * DashboardEffectLayerAndStudio.tsx
 * Fitur Tersendiri di Sisi Nasabah untuk Efek Dashboard 100.000x:
 * 1) DashboardActiveEffectBannerAndAura:
 *    - Mendeteksi Efek Dashboard yang dikirim Admin ke akun nasabah (1 akun, banyak akun, atau semua nasabah).
 *    - Otomatis meledakkan Panggung 7-Lapis 100.000x secara Real-Time via Cloud RTDB setiap kali Admin mengirim atau menembak ulang efek (`triggerNonce` berubah).
 *    - Menampilkan Spanduk Sambutan & Aura Efek Dashboard 100.000x di bagian atas Dashboard, lengkap dengan cincin sihir mandala 3D, partikel tema melayang, tombol "💥 Ledakkan Panggung 100.000x", dan tombol menuju tab "✨ Efek Dashboard".
 * 2) CustomerDashboardEffectStudioView:
 *    - Halaman tab tersendiri di dalam Dashboard Nasabah (`✨ Efek Dashboard`) untuk melihat daftar Efek Dashboard yang diterima akun, memilih efek mana yang dijadikan Aura Utama, memutar ulang Panggung 100.000x kapan saja, atau menjelajahi katalog 108 efek.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Sparkles,
  Zap,
  Clock,
  Crown,
  Eye,
  EyeOff,
  CheckCircle2,
  Sliders,
  Play,
  Layers,
  Search,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AdminDashboardEffectPackage } from '../types/bank';
import {
  CELEBRATION_CATEGORIES,
  CELEBRATION_EFFECTS_CATALOG,
  CELEBRATION_INTENSITY_OPTIONS,
  CelebrationCategoryKey,
  CelebrationIntensityLevel,
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

const formatDurationBadge = (pkg: AdminDashboardEffectPackage): string => {
  if (!pkg.expiresAt || pkg.durationType === 'permanent') {
    return '♾️ Aktif Permanen';
  }
  const diffMs = new Date(pkg.expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return 'Berakhir';
  const totalMins = Math.ceil(diffMs / 60000);
  if (totalMins < 60) return `⏱️ Sisa ${totalMins} Menit`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hrs < 24) return `⏱️ Sisa ${hrs}j ${mins}m`;
  const days = Math.floor(hrs / 24);
  return `📅 Sisa ${days} Hari ${hrs % 24} Jam`;
};

export const useActiveCustomerDashboardEffects = () => {
  const { currentAccount, dashboardEffectEvents } = useBank();
  const accountId = currentAccount?.id || '';

  const eligiblePackages = accountId
    ? dashboardEffectEvents.filter((pkg) =>
        isDashboardEffectActiveForAccount(pkg, accountId)
      )
    : [];

  return {
    eligiblePackages,
    primaryPackage: eligiblePackages[0] || null,
  };
};

export const DashboardActiveEffectBannerAndAura: React.FC<{
  selectedPackageIdOverride?: string | null;
  onSelectPackageId?: (id: string) => void;
  onOpenStudioTab?: () => void;
}> = ({ selectedPackageIdOverride, onSelectPackageId, onOpenStudioTab }) => {
  const {
    currentAccount,
    activeDashboardEffectModal,
    closeDashboardEffectStageModal,
  } = useBank();
  const { eligiblePackages, primaryPackage } = useActiveCustomerDashboardEffects();

  const [ambientVisible, setAmbientVisible] = useState<boolean>(true);
  const [stageBurst, setStageBurst] = useState<{
    pkg: AdminDashboardEffectPackage;
    nonce: number;
  } | null>(null);

  // Track seen triggerNonces per package ID so real-time blasts from Admin immediately fire the 100,000x stage
  const seenNoncesRef = useRef<Record<string, number>>({});
  const hasHydratedInitialNoncesRef = useRef<boolean>(false);

  const activePkg =
    (selectedPackageIdOverride
      ? eligiblePackages.find((p) => p.id === selectedPackageIdOverride)
      : null) || primaryPackage;

  useEffect(() => {
    if (!currentAccount || eligiblePackages.length === 0) return;

    if (!hasHydratedInitialNoncesRef.current) {
      hasHydratedInitialNoncesRef.current = true;
      eligiblePackages.forEach((p) => {
        seenNoncesRef.current[p.id] = p.triggerNonce || 1;
      });
      // If the newest package has autoBlastOnOpen and was triggered within the last 45 seconds, blast immediately
      const newest = eligiblePackages[0];
      if (newest && newest.autoBlastOnOpen && newest.lastTriggeredAt) {
        const elapsedMs = Date.now() - new Date(newest.lastTriggeredAt).getTime();
        if (elapsedMs >= 0 && elapsedMs < 45000) {
          const prof = getCelebrationEffectProfile(newest.celebrationEffect);
          triggerCanvasConfettiForCelebration(
            prof.id,
            newest.celebrationIntensity || '100000x'
          );
          setStageBurst({
            pkg: newest,
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
          if (onSelectPackageId) {
            onSelectPackageId(pkg.id);
          }
          break;
        }
      }
    }
  }, [eligiblePackages, currentAccount, onSelectPackageId]);

  // Listen to manual trigger from context (e.g. from Studio tab)
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

  const handleManualLaunchStage = (pkgToLaunch: AdminDashboardEffectPackage) => {
    const prof = getCelebrationEffectProfile(pkgToLaunch.celebrationEffect);
    triggerCanvasConfettiForCelebration(
      prof.id,
      pkgToLaunch.celebrationIntensity || '100000x'
    );
    setStageBurst({
      pkg: pkgToLaunch,
      nonce: Date.now(),
    });
  };

  if (!currentAccount || !activePkg) {
    return null;
  }

  const profile: CelebrationEffectProfile = getCelebrationEffectProfile(
    activePkg.celebrationEffect
  );
  const intensity = activePkg.celebrationIntensity || '100000x';

  return (
    <>
      {/* FULL-SCREEN 100,000X STAGE BURST OVERLAY WHEN TRIGGERED */}
      {stageBurst && (
        <CelebrationClaimBurstOverlay
          effectId={stageBurst.pkg.celebrationEffect}
          burstNonce={stageBurst.nonce}
          intensityLevel={stageBurst.pkg.celebrationIntensity || '100000x'}
          customHeadlineOverride={stageBurst.pkg.title}
          onDismiss={() => setStageBurst(null)}
        />
      )}

      {/* AMBIENT FLOATING PARTICLES ACROSS DASHBOARD VIEWPORT WHEN ENABLED */}
      {activePkg.showPersistentDashboardAura && ambientVisible && (
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

      {/* PERSISTENT DASHBOARD EFFECT BANNER & QUICK CONTROLS */}
      {activePkg.showPersistentDashboardAura && (
        <div
          className={`relative rounded-3xl border-2 ${profile.cardBorderAccentClass} bg-gradient-to-r ${profile.bannerGradientClass} p-4 sm:p-5 shadow-2xl ${profile.cardGlowClass} overflow-hidden transition-all`}
        >
          {/* Subtle Shimmer & Corner Filigree */}
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
                    {formatDurationBadge(activePkg)}
                  </span>
                  {eligiblePackages.length > 1 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9.5px]">
                      +{eligiblePackages.length} Efek Tersedia di Akun Anda
                    </span>
                  )}
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

            {/* Right Actions: Blast 100,000x Stage, Switch Active Effect, Open Studio Tab */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleManualLaunchStage(activePkg)}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-400 hover:from-white hover:to-amber-200 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-xl transition transform hover:scale-105"
              >
                <Zap className="w-4 h-4" />
                <span>💥 Putar Panggung {intensity.toUpperCase()}</span>
              </button>

              {onOpenStudioTab && (
                <button
                  type="button"
                  onClick={onOpenStudioTab}
                  className="px-3.5 py-2.5 rounded-2xl bg-slate-950/85 hover:bg-slate-900 border border-white/30 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-lg transition"
                >
                  <Sliders className="w-3.5 h-3.5 text-amber-300" />
                  <span>✨ Studio Efek ({eligiblePackages.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setAmbientVisible((prev) => !prev)}
                className="p-2.5 rounded-2xl bg-slate-950/75 hover:bg-slate-900 border border-white/20 text-white/90 cursor-pointer"
                title={
                  ambientVisible
                    ? 'Sembunyikan Partikel Melayang di Layar'
                    : 'Tampilkan Partikel Melayang di Layar'
                }
              >
                {ambientVisible ? (
                  <Eye className="w-4 h-4 text-emerald-300" />
                ) : (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

/**
 * CustomerDashboardEffectStudioView
 * Halaman Sub-Tab Tersendiri di Dashboard Nasabah (`✨ Efek Dashboard`)
 */
export const CustomerDashboardEffectStudioView: React.FC<{
  selectedPackageId: string | null;
  onSelectPackageId: (id: string) => void;
}> = ({ selectedPackageId, onSelectPackageId }) => {
  const { currentAccount, triggerDashboardEffectStageModal } = useBank();
  const { eligiblePackages, primaryPackage } = useActiveCustomerDashboardEffects();

  const [customPreviewBurst, setCustomPreviewBurst] = useState<{
    effectId: string;
    intensity: CelebrationIntensityLevel;
    headline?: string;
    nonce: number;
  } | null>(null);
  const [catFilter, setCatFilter] = useState<CelebrationCategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sandboxIntensity, setSandboxIntensity] =
    useState<CelebrationIntensityLevel>('100000x');

  if (!currentAccount) return null;

  const activePkg =
    (selectedPackageId
      ? eligiblePackages.find((p) => p.id === selectedPackageId)
      : null) || primaryPackage;

  const usableCelebrations = CELEBRATION_EFFECTS_CATALOG.filter((c) => c.id !== 'none');
  const filteredCatalog = usableCelebrations.filter((item) => {
    if (catFilter !== 'all' && item.category !== catFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleLaunchCatalogStage = (effectId: string, headline?: string) => {
    triggerCanvasConfettiForCelebration(effectId, sandboxIntensity);
    setCustomPreviewBurst({
      effectId,
      intensity: sandboxIntensity,
      headline,
      nonce: Date.now(),
    });
  };

  return (
    <div className="space-y-6 text-xs">
      {customPreviewBurst && (
        <CelebrationClaimBurstOverlay
          effectId={customPreviewBurst.effectId}
          burstNonce={customPreviewBurst.nonce}
          intensityLevel={customPreviewBurst.intensity}
          customHeadlineOverride={customPreviewBurst.headline}
          onDismiss={() => setCustomPreviewBurst(null)}
        />
      )}

      {/* HEADER STUDIO EFEK DASHBOARD NASABAH */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950 border-2 border-amber-400/70 p-6 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-block">
              ✨ STUDIO EFEK &amp; PANGGUNG DASHBOARD 100.000X
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Koleksi Efek Dashboard Akun Anda &amp; Teater Selebrasi 100.000x
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Kelola semua Efek Perayaan Dashboard yang dikirimkan Admin ke rekening{' '}
              <strong className="text-amber-300">{currentAccount.fullName}</strong>, pilih tema aura aktif untuk Kartu Saldo Utama Anda, atau putar Panggung Sinematik 7-Lapis kapan saja!
            </p>
          </div>

          {activePkg && (
            <button
              type="button"
              onClick={() => triggerDashboardEffectStageModal(activePkg.id)}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-white hover:to-amber-200 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-2 shadow-xl shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>💥 Putar Panggung Aktif Sekarang</span>
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: DAFTAR EFEK DASHBOARD YANG DITERIMA DARI ADMIN */}
      <div className="rounded-3xl bg-slate-900/95 border border-slate-800 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>
                Efek Dashboard Resmi di Akun Anda ({eligiblePackages.length} Paket Aktif)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pilih salah satu paket di bawah ini untuk dijadikan Hiasan Aura &amp; Spanduk Utama di Dashboard Anda.
            </p>
          </div>
        </div>

        {eligiblePackages.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center text-slate-400">
            Saat ini belum ada kiriman Efek Dashboard khusus dari Admin. Anda tetap dapat mencoba seluruh 108 Panggung 100.000x di Teater Pratinjau di bawah!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eligiblePackages.map((pkg) => {
              const prof = getCelebrationEffectProfile(pkg.celebrationEffect);
              const isSelected = activePkg?.id === pkg.id;
              const intensity = pkg.celebrationIntensity || '100000x';

              return (
                <div
                  key={pkg.id}
                  className={`rounded-3xl border-2 p-4 flex flex-col justify-between gap-3 transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${prof.bannerGradientClass} ${prof.cardBorderAccentClass} shadow-2xl ${prof.cardGlowClass}`
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-11 h-11 rounded-2xl bg-slate-950/80 border border-white/25 flex items-center justify-center text-2xl shrink-0">
                          {prof.primaryEmoji}
                        </div>
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-amber-300 text-slate-950 font-black text-[9px] uppercase">
                            {prof.name} • {intensity.toUpperCase()}
                          </span>
                          <h4 className="font-black text-white text-xs sm:text-sm mt-0.5">
                            {pkg.title}
                          </h4>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-white/90 bg-slate-950/55 p-2.5 rounded-xl border border-white/10 leading-relaxed">
                      {pkg.welcomeMessage}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-amber-200 font-semibold">
                      <span>Dari: {pkg.senderName}</span>
                      <span className="font-mono text-cyan-200 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{formatDurationBadge(pkg)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-white/15">
                    <button
                      type="button"
                      onClick={() => onSelectPackageId(pkg.id)}
                      className={`flex-1 py-2 px-3 rounded-xl font-black text-[11px] cursor-pointer flex items-center justify-center gap-1 transition ${
                        isSelected
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isSelected ? 'Aura Aktif' : 'Pasang di Dashboard'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => triggerDashboardEffectStageModal(pkg.id)}
                      className="py-2 px-3 rounded-xl bg-amber-300 hover:bg-white text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1 shadow-lg"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>💥 Putar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: TEATER EKSPLORASI 108 EFEK PANGGUNG 100.000X */}
      <div className="rounded-3xl bg-slate-900/95 border-2 border-amber-400/50 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>
                Teater Eksplorasi {usableCelebrations.length} Efek Panggung Sinematik 100.000x (9 Kategori)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Coba langsung seluruh {usableCelebrations.length} koreografi efek perayaan lengkap dengan synthesizer musik &amp; kombo klik interaktif!
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {CELEBRATION_INTENSITY_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSandboxIntensity(opt.id)}
                className={`px-2.5 py-1.5 rounded-xl font-black text-[10px] cursor-pointer border transition ${
                  sandboxIntensity === opt.id
                    ? 'bg-amber-400 text-slate-950 border-white shadow'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {CELEBRATION_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCatFilter(cat.key)}
                className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black cursor-pointer border transition ${
                  catFilter === cat.key
                    ? 'bg-amber-400 text-slate-950 border-amber-200'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                }`}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Cari dari ${usableCelebrations.length} efek perayaan...`}
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredCatalog.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-amber-400/60 flex items-center justify-between gap-2.5 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                  {item.primaryEmoji}
                </div>
                <div className="min-w-0">
                  <span className="font-black text-white text-xs block truncate">
                    {item.name}
                  </span>
                  <span className="text-[9.5px] text-amber-300/90 font-semibold block truncate">
                    {item.categoryLabel}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleLaunchCatalogStage(item.id, item.celebrationHeadline)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-white hover:to-amber-200 text-slate-950 font-black text-[10px] cursor-pointer shrink-0 shadow"
              >
                💥 Putar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
