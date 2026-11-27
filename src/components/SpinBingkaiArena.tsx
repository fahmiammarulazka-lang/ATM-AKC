import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  History,
  Lock,
  Plus,
  RotateCw,
  Snowflake,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { SPIN_AURA_FRAMES, getAvatarFrameById } from '../data/profileCustomizationCatalog';
import {
  buildFrameSpinRingSlots25,
  normalizeFrameSpinConfig,
} from '../data/spinWheelCatalog';
import { PendingFrameSpinCommitPayload } from '../types/bank';
import { ProfileAvatarBadge } from './ProfileAvatarBadge';
import { TokenEmblemIcon } from './TokenEmblemIcon';

interface SpinBingkaiArenaProps {
  onOpenCoinShop: () => void;
}

type CelebrationStage =
  | 'IDLE'
  | 'SPINNING_SPOTLIGHT'
  | 'BANNER_SELAMAT'
  | 'STAGE_SPOTLIGHT_REVEAL';

interface RevealDataState {
  source: 'spin' | 'exchange';
  spinCount: 1 | 5;
  coinsSpent: number;
  tokensSpent?: number;
  totalTokensEarned: number;
  newlyUnlockedFrameIds: string[];
  featuredFrameId?: string;
  isDuplicateWin?: boolean;
  results: {
    rollIndex: number;
    slotNumber: number;
    kind: 'frame' | 'token' | 'duplicate_frame';
    frameId?: string;
    frameLabel?: string;
    tokensAwarded: number;
  }[];
  message: string;
}

const FRAME_THEME_ICONS: Record<string, React.ReactNode> = {
  'frame-spin-petir-cyber': <Zap className="w-3.5 h-3.5 text-cyan-300" />,
  'frame-spin-api-naga': <Flame className="w-3.5 h-3.5 text-orange-200" />,
  'frame-spin-emas-imperial': <Crown className="w-3.5 h-3.5 text-yellow-200" />,
  'frame-spin-kristal-es': <Snowflake className="w-3.5 h-3.5 text-sky-100" />,
  'frame-spin-galaksi-kosmik': <Sparkles className="w-3.5 h-3.5 text-fuchsia-200" />,
};

export const SpinBingkaiArena: React.FC<SpinBingkaiArenaProps> = ({ onOpenCoinShop }) => {
  const {
    currentAccount,
    spinWheelConfig,
    frameSpinHistory,
    spinBingkaiWheel,
    commitPendingFrameSpinReward,
    exchangeTokenForSpinFrame,
    equipSpinAvatarFrame,
  } = useBank();

  const frameCfg = useMemo(
    () => normalizeFrameSpinConfig(spinWheelConfig.frameSpin),
    [spinWheelConfig.frameSpin]
  );

  const ringSlots = useMemo(() => buildFrameSpinRingSlots25(frameCfg), [frameCfg]);

  const [stage, setStage] = useState<CelebrationStage>('IDLE');
  const [spotlightSlot, setSpotlightSlot] = useState<number | null>(null);
  const [trailSlots, setTrailSlots] = useState<number[]>([]);
  const [landingBurstSlot, setLandingBurstSlot] = useState<number | null>(null);
  const [activeRollCount, setActiveRollCount] = useState<1 | 5 | null>(null);
  const [selectedPreviewFrameId, setSelectedPreviewFrameId] = useState<string>(
    SPIN_AURA_FRAMES[0].id
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [revealData, setRevealData] = useState<RevealDataState | null>(null);
  const [lastResult, setLastResult] = useState<RevealDataState | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const animTimerRef = useRef<number | null>(null);
  const bannerTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pendingCommitRef = useRef<PendingFrameSpinCommitPayload | null>(null);
  const commitFnRef = useRef(commitPendingFrameSpinReward);
  commitFnRef.current = commitPendingFrameSpinReward;

  // Cleanup timers + auto-commit any pending spin if user navigates away mid-animation
  useEffect(() => {
    return () => {
      if (animTimerRef.current !== null) {
        window.clearTimeout(animTimerRef.current);
      }
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current);
      }
      if (pendingCommitRef.current) {
        commitFnRef.current(pendingCommitRef.current);
        pendingCommitRef.current = null;
      }
    };
  }, []);

  // Auto-advance BANNER_SELAMAT (~1.4s) -> STAGE_SPOTLIGHT_REVEAL
  useEffect(() => {
    if (stage !== 'BANNER_SELAMAT') return;
    bannerTimerRef.current = window.setTimeout(() => {
      setStage('STAGE_SPOTLIGHT_REVEAL');
    }, 1400);
    return () => {
      if (bannerTimerRef.current !== null) {
        window.clearTimeout(bannerTimerRef.current);
      }
    };
  }, [stage]);

  if (!currentAccount) return null;

  const isAdminCard = currentAccount.cardTier === 'admin';
  const userCoins = currentAccount.spinCoins || 0;
  const userTokens = currentAccount.spinTokens || 0;
  const ownedSet = new Set<string>(currentAccount.ownedSpinFrameIds || []);
  const exchangeTarget = Math.max(1, frameCfg.exchangeTokenCost);
  const tokenShortfall = Math.max(0, exchangeTarget - userTokens);
  const tokenProgressPct = Math.min(
    100,
    Math.round((userTokens / exchangeTarget) * 100)
  );

  const ensureAudioContext = (): AudioContext | null => {
    if (!soundEnabled || typeof window === 'undefined') return null;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new Ctx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        void audioCtxRef.current.resume();
      }
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  const playSpinTickSound = (progressRatio: number) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const freq = 760 - progressRatio * 290;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.055, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.055);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {
      // ignore audio errors
    }
  };

  const playStopVictoryFanfare = (hasFrameHighlight: boolean) => {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    try {
      const notes = hasFrameHighlight
        ? [523.25, 659.25, 783.99, 1046.5]
        : [587.33, 783.99, 987.77];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = hasFrameHighlight ? 'sawtooth' : 'triangle';
        const start = ctx.currentTime + idx * 0.085;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.055, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch {
      // ignore audio errors
    }
  };

  const runSpotlightAnimation = (targetSlotNumber: number, onStopped: () => void) => {
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
    }

    const startSlot = spotlightSlot ?? 1;
    const baseLoops = 2; // 2 putaran penuh mengelilingi 25 heksagon
    const offset = (targetSlotNumber - startSlot + 25) % 25;
    const totalSteps = baseLoops * 25 + offset;
    let step = 0;
    const recentHistory: number[] = [];

    const tick = () => {
      step += 1;
      const currentSlot = ((startSlot - 1 + step) % 25) + 1;
      recentHistory.unshift(currentSlot);
      if (recentHistory.length > 4) recentHistory.pop();

      setSpotlightSlot(currentSlot);
      setTrailSlots(recentHistory.slice(1));
      playSpinTickSound(step / Math.max(1, totalSteps));

      if (step >= totalSteps) {
        setTrailSlots([]);
        setLandingBurstSlot(currentSlot);
        animTimerRef.current = window.setTimeout(() => {
          setLandingBurstSlot(null);
          onStopped();
        }, 420);
        return;
      }

      // Cepat di awal lalu melambat halus di akhir
      const remaining = totalSteps - step;
      let delayMs = 34;
      if (remaining <= 3) delayMs = 250;
      else if (remaining <= 7) delayMs = 155;
      else if (remaining <= 13) delayMs = 92;
      else if (remaining <= 22) delayMs = 52;

      animTimerRef.current = window.setTimeout(tick, delayMs);
    };

    animTimerRef.current = window.setTimeout(tick, 34);
  };

  const handleSpin = (spinCount: 1 | 5) => {
    if (stage === 'SPINNING_SPOTLIGHT') return;
    setInlineNotice(null);
    ensureAudioContext();

    const res = spinBingkaiWheel(spinCount, { deferRewardReveal: true });
    if (!res.success || !res.results || res.results.length === 0) {
      setInlineNotice({ type: 'error', text: res.message });
      return;
    }

    if (res.pendingCommitPayload) {
      pendingCommitRef.current = res.pendingCommitPayload;
    }

    // Prioritas target berhenti untuk 1x / 5x: bingkai baru > bingkai duplikat > token tertinggi
    const bestTokenRoll = [...res.results].sort(
      (a, b) => (b.tokensAwarded || 0) - (a.tokensAwarded || 0)
    )[0];
    const priorityRoll =
      res.results.find((r) => r.kind === 'frame') ||
      res.results.find((r) => r.kind === 'duplicate_frame') ||
      bestTokenRoll ||
      res.results[res.results.length - 1];

    setStage('SPINNING_SPOTLIGHT');
    setActiveRollCount(spinCount);
    setRevealData(null);

    runSpotlightAnimation(priorityRoll.slotNumber, () => {
      // 1. Lampu sorot BERHENTI PENUH -> Komit hadiah resmi & toast sekarang
      if (pendingCommitRef.current) {
        commitPendingFrameSpinReward(pendingCommitRef.current);
        pendingCommitRef.current = null;
      }

      const hasFrameHighlight =
        priorityRoll.kind === 'frame' || priorityRoll.kind === 'duplicate_frame';
      playStopVictoryFanfare(hasFrameHighlight);

      if (priorityRoll.frameId) {
        setSelectedPreviewFrameId(priorityRoll.frameId);
      }

      const outcome: RevealDataState = {
        source: 'spin',
        spinCount,
        coinsSpent: res.coinsSpent ?? 0,
        totalTokensEarned: res.totalTokensEarned ?? 0,
        newlyUnlockedFrameIds: res.newlyUnlockedFrameIds ?? [],
        featuredFrameId: priorityRoll.frameId || res.newlyUnlockedFrameIds?.[0],
        isDuplicateWin: priorityRoll.kind === 'duplicate_frame' && (res.newlyUnlockedFrameIds?.length ?? 0) === 0,
        results: res.results!,
        message: res.message,
      };

      setActiveRollCount(null);
      setLastResult(outcome);
      setRevealData(outcome);
      setInlineNotice({
        type: 'success',
        text: res.message,
      });

      // 2. Masuk ke animasi "Selamat!" (~1.4 detik) -> lalu Stage Spotlight
      setStage('BANNER_SELAMAT');
    });
  };

  const handleExchangeToken = (frameId: string) => {
    if (stage === 'SPINNING_SPOTLIGHT') return;
    ensureAudioContext();

    const res = exchangeTokenForSpinFrame(frameId);
    setInlineNotice({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });

    if (res.success) {
      playStopVictoryFanfare(true);
      setSelectedPreviewFrameId(frameId);
      const frameMeta = getAvatarFrameById(frameId);
      const outcome: RevealDataState = {
        source: 'exchange',
        spinCount: 1,
        coinsSpent: 0,
        tokensSpent: exchangeTarget,
        totalTokensEarned: 0,
        newlyUnlockedFrameIds: [frameId],
        featuredFrameId: frameId,
        results: [
          {
            rollIndex: 1,
            slotNumber: 5,
            kind: 'frame',
            frameId,
            frameLabel: frameMeta.label,
            tokensAwarded: 0,
          },
        ],
        message: res.message,
      };
      setRevealData(outcome);
      setStage('BANNER_SELAMAT');
    }
  };

  const handleEquipFrame = (frameId: string) => {
    const res = equipSpinAvatarFrame(frameId);
    setInlineNotice({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setSelectedPreviewFrameId(frameId);
    }
  };

  const activePreviewFrame =
    SPIN_AURA_FRAMES.find((f) => f.id === selectedPreviewFrameId) || SPIN_AURA_FRAMES[0];
  const activePreviewOwned = ownedSet.has(activePreviewFrame.id);
  const activePreviewEquipped = currentAccount.avatarFrameId === activePreviewFrame.id;

  const userHistory = frameSpinHistory.filter((h) => h.accountId === currentAccount.id);

  // Koordinat 5 heksagon merah bara di klaster tengah pusaran (2 baris honeycomb)
  const centerClusterOffsets = [
    { leftPct: 39, topPct: 37 },
    { leftPct: 61, topPct: 37 },
    { leftPct: 28, topPct: 58 },
    { leftPct: 50, topPct: 58 },
    { leftPct: 72, topPct: 58 },
  ];

  const isBannerMega = Boolean(
    revealData &&
      (revealData.newlyUnlockedFrameIds.length > 0 || revealData.featuredFrameId)
  );
  const stageFeaturedFrame = revealData?.featuredFrameId
    ? getAvatarFrameById(revealData.featuredFrameId)
    : null;

  return (
    <div className="space-y-6 relative">
      {/* =====================================================================
          OVERLAY PERAYAAN 2 TAHAP:
          1) BANNER_SELAMAT (~1.4s) -> 2) STAGE_SPOTLIGHT_REVEAL (Sorot Atas)
         ===================================================================== */}
      {(stage === 'BANNER_SELAMAT' || stage === 'STAGE_SPOTLIGHT_REVEAL') && revealData && (
        <div
          className="fixed inset-0 z-[220] bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label="Perayaan Hadiah Spin Bingkai"
        >
          {/* Ambient radial explosion behind overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-45"
            style={{
              background: stageFeaturedFrame?.glowColorHex
                ? `radial-gradient(circle at 50% 42%, ${stageFeaturedFrame.glowColorHex}55, transparent 62%)`
                : 'radial-gradient(circle at 50% 42%, rgba(251,191,36,0.35), transparent 62%)',
            }}
          />

          {stage === 'BANNER_SELAMAT' && (
            <button
              type="button"
              onClick={() => setStage('STAGE_SPOTLIGHT_REVEAL')}
              className="relative max-w-lg w-full cursor-pointer bn-banner-bloom focus:outline-none"
              title="Ketuk untuk langsung melihat sorotan hadiah"
            >
              {isBannerMega ? (
                <div className="relative p-7 sm:p-10 rounded-3xl border-2 border-amber-300/90 bg-gradient-to-br from-red-700 via-rose-800 to-amber-900 shadow-[0_0_80px_rgba(249,115,22,0.7)] text-center space-y-3 overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(254,240,138,0.28),transparent_68%)] pointer-events-none" />
                  <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-widest shadow">
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {revealData.source === 'exchange'
                        ? 'Penukaran 500 Token Berhasil'
                        : 'Kemenangan Bingkai Aura'}
                    </span>
                  </div>
                  <h2 className="relative z-10 text-4xl sm:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400 drop-shadow-[0_6px_18px_rgba(0,0,0,0.65)]">
                    SELAMAT!
                  </h2>
                  <p className="relative z-10 text-sm sm:text-base font-bold text-amber-100">
                    {stageFeaturedFrame
                      ? `Menyorot Bingkai ${stageFeaturedFrame.label} ke tengah panggung...`
                      : 'Menyiapkan sorotan panggung kemenangan Anda...'}
                  </p>
                </div>
              ) : (
                <div className="relative p-6 sm:p-8 rounded-3xl border-2 border-amber-400/80 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 shadow-[0_0_55px_rgba(251,191,36,0.45)] text-center space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/60 text-amber-200 font-black text-xs uppercase tracking-wider">
                    <TokenEmblemIcon className="w-4 h-4" />
                    <span>Hadiah Token Diterima</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-amber-200 to-amber-400">
                    SELAMAT!
                  </h2>
                  <p className="text-sm font-bold text-amber-200 font-mono tabular-nums">
                    +{revealData.totalTokensEarned.toLocaleString('id-ID')} Token Bingkai
                  </p>
                </div>
              )}
            </button>
          )}

          {stage === 'STAGE_SPOTLIGHT_REVEAL' && (
            <div className="relative max-w-xl w-full rounded-3xl border border-amber-400/45 bg-slate-950/95 shadow-[0_0_90px_rgba(0,0,0,0.95)] p-6 sm:p-8 text-center overflow-hidden bn-spark-burst">
              {/* Dual Stage Conical Spotlight Beams Shining From Above */}
              <div
                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-[72%] w-48 sm:w-64 h-[340px] bn-spotlight-sweep-left"
                style={{
                  clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
                  background: stageFeaturedFrame?.glowColorHex
                    ? `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, ${stageFeaturedFrame.glowColorHex}44 55%, transparent 100%)`
                    : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(251,191,36,0.28) 55%, transparent 100%)',
                }}
              />
              <div
                className="pointer-events-none absolute -top-12 left-1/2 -translate-x-[28%] w-48 sm:w-64 h-[340px] bn-spotlight-sweep-right"
                style={{
                  clipPath: 'polygon(42% 0%, 58% 0%, 100% 100%, 0% 100%)',
                  background: stageFeaturedFrame?.glowColorHex
                    ? `linear-gradient(180deg, rgba(255,255,255,0.55) 0%, ${stageFeaturedFrame.glowColorHex}44 55%, transparent 100%)`
                    : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(251,191,36,0.28) 55%, transparent 100%)',
                }}
              />

              {/* Celebratory Particle Confetti Dots & Lens Flare */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
                <span className="absolute top-6 left-[18%] w-2.5 h-2.5 rounded-full bg-amber-300 animate-ping" />
                <span className="absolute top-12 right-[20%] w-2 h-2 rounded-full bg-white animate-pulse" />
                <span className="absolute bottom-24 left-[14%] w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
                <span className="absolute bottom-28 right-[16%] w-2.5 h-2.5 rounded-full bg-cyan-300 animate-ping" />
                <span className="absolute top-20 left-[32%] w-1.5 h-3 rotate-45 bg-yellow-300 opacity-85" />
                <span className="absolute top-24 right-[30%] w-1.5 h-3 -rotate-45 bg-amber-400 opacity-85" />
              </div>

              <div className="relative z-10 flex flex-col items-center space-y-5">
                <div className="space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-300 font-bold block">
                    {revealData.source === 'exchange'
                      ? 'PENUKARAN 500 TOKEN SELESAI'
                      : revealData.newlyUnlockedFrameIds.length > 0
                      ? 'BINGKAI AURA EKSKLUSIF DIDAPAT!'
                      : revealData.isDuplicateWin
                      ? 'BINGKAI KEMBAR → KONVERSI TOKEN'
                      : `HASIL ${revealData.spinCount}x SPIN BINGKAI`}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {stageFeaturedFrame
                      ? stageFeaturedFrame.label
                      : `+${revealData.totalTokensEarned.toLocaleString('id-ID')} Token Bingkai`}
                  </h3>
                </div>

                {/* CENTER STAGE SPOTLIGHT SHOWCASE */}
                {stageFeaturedFrame ? (
                  <div className="relative py-6 px-8 flex flex-col items-center justify-center">
                    <div
                      className="w-36 h-40 sm:w-44 sm:h-48 bn-hex-clip p-[3px] bg-gradient-to-b from-amber-200 via-orange-500 to-red-700 shadow-[0_0_55px_rgba(239,68,68,0.8)] flex items-center justify-center"
                    >
                      <div className="w-full h-full bn-hex-clip bg-gradient-to-b from-red-600 via-rose-700 to-red-950 flex flex-col items-center justify-center p-3">
                        <ProfileAvatarBadge
                          account={{
                            fullName: currentAccount.fullName,
                            cardStatus: currentAccount.cardStatus,
                            avatarPresetId: currentAccount.avatarPresetId,
                            avatarFrameId: stageFeaturedFrame.id,
                          }}
                          size="xl"
                        />
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-4 max-w-sm leading-relaxed">
                      {stageFeaturedFrame.description}
                    </p>
                  </div>
                ) : (
                  <div className="relative py-6 px-8 flex flex-col items-center justify-center">
                    <div className="w-32 h-36 sm:w-36 sm:h-40 bn-hex-clip p-[3px] bg-gradient-to-b from-amber-200 via-slate-300 to-slate-600 shadow-[0_0_45px_rgba(251,191,36,0.5)] flex items-center justify-center">
                      <div className="w-full h-full bn-hex-clip bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 flex flex-col items-center justify-center">
                        <TokenEmblemIcon className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" />
                        <span className="font-mono font-black text-amber-300 text-lg sm:text-xl tabular-nums mt-1">
                          x{revealData.totalTokensEarned}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 mt-3 max-w-sm">
                      Token telah masuk ke saldo Anda! Kumpulkan hingga{' '}
                      <strong className="text-amber-300">{exchangeTarget} Token</strong> untuk menukar 1 Bingkai Aura pilihan Anda.
                    </p>
                  </div>
                )}

                {/* Per-roll pill summary */}
                <div className="w-full flex flex-wrap items-center justify-center gap-1.5 pt-1">
                  {revealData.results.map((item) => (
                    <span
                      key={item.rollIndex}
                      className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold ${
                        item.kind === 'frame'
                          ? 'bg-emerald-950/90 border-emerald-400/70 text-emerald-200'
                          : item.kind === 'duplicate_frame'
                          ? 'bg-amber-950/90 border-amber-400/70 text-amber-200'
                          : 'bg-slate-900 border-slate-700 text-slate-200'
                      }`}
                    >
                      {revealData.source === 'exchange'
                        ? `Ditukar ${revealData.tokensSpent} Token`
                        : `#${item.rollIndex} [Hex ${item.slotNumber}]: ${
                            item.kind === 'frame'
                              ? `BINGKAI ${item.frameLabel}`
                              : item.kind === 'duplicate_frame'
                              ? `Duplikat +${item.tokensAwarded} Token`
                              : `x${item.tokensAwarded} Token`
                          }`}
                    </span>
                  ))}
                </div>

                {/* Action buttons: Pasang Sekarang & Tutup */}
                <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {stageFeaturedFrame && ownedSet.has(stageFeaturedFrame.id) && (
                    <button
                      type="button"
                      onClick={() => handleEquipFrame(stageFeaturedFrame.id)}
                      disabled={currentAccount.avatarFrameId === stageFeaturedFrame.id}
                      className={`w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl font-black text-sm inline-flex items-center justify-center gap-2 transition cursor-pointer ${
                        currentAccount.avatarFrameId === stageFeaturedFrame.id
                          ? 'bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 cursor-default'
                          : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-lg shadow-emerald-500/30'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {currentAccount.avatarFrameId === stageFeaturedFrame.id
                          ? 'Sudah Dipasang di Profil'
                          : 'Pasang Sekarang'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setStage('IDLE');
                      setRevealData(null);
                    }}
                    className="w-full sm:w-auto min-h-[46px] px-6 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <X className="w-4 h-4" />
                    <span>Tutup</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {!frameCfg.enabled && (
        <div className="p-4 rounded-2xl border border-amber-500/40 bg-amber-950/60 text-amber-200 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Mode <strong>Spin Bingkai</strong> sedang ditutup sementara oleh Administrator. Anda tetap dapat menukar Token atau memasang Bingkai yang sudah dimiliki.
          </span>
        </div>
      )}

      {inlineNotice && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-2 ${
            inlineNotice.type === 'success'
              ? 'bg-emerald-950/75 border-emerald-500/45 text-emerald-100'
              : 'bg-rose-950/75 border-rose-500/45 text-rose-100'
          }`}
        >
          <span>{inlineNotice.text}</span>
          {inlineNotice.type === 'error' && inlineNotice.text.toLowerCase().includes('koin') && (
            <button
              type="button"
              onClick={onOpenCoinShop}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Beli Koin Spin</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KIRI: ARENA PUSARAN HITAM-UNGU · 25 HEKSAGON LUAR · 5 HEKSAGON MERAH TENGAH */}
        <div className="lg:col-span-7 bg-[#090b16] border border-red-500/35 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-3.5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-orange-300 font-bold block">
                ARENA PUSARAN 25 HEKSAGON · TOKEN 1–20 &amp; 5 BINGKAI MERAH
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Spin 5 Bingkai Aura Hidup ({frameCfg.frameWinProbabilityPercent}% Peluang)
              </h2>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                title={soundEnabled ? 'Matikan suara spin' : 'Nyalakan suara spin'}
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{soundEnabled ? 'Suara Aktif' : 'Bisu'}</span>
              </button>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 font-bold tabular-nums">
                {frameCfg.cost1xCoins} Koin / 1x
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-orange-300 font-bold tabular-nums">
                {frameCfg.cost5xCoins} Koin / 5x
              </span>
            </div>
          </div>

          {/* 25-HEXAGON DARK PURPLE-BLACK SWIRLING VORTEX ARENA */}
          <div className="relative w-full max-w-[360px] sm:max-w-[540px] aspect-square mx-auto select-none rounded-3xl overflow-hidden bg-[#05060f] border border-purple-900/50 shadow-[inset_0_0_65px_rgba(0,0,0,0.95)]">
            {/* Animated Dark Purple-Black Vortex Layers */}
            <div
              className="absolute -inset-12 opacity-90 bn-vortex-spin pointer-events-none"
              style={{
                background:
                  'conic-gradient(from 0deg, #04040a 0deg, #2e1065 42deg, #090714 88deg, #4c1d95 135deg, #05050b 182deg, #3b0764 235deg, #090814 285deg, #581c87 330deg, #04040a 360deg)',
                filter: 'blur(12px)',
              }}
            />
            <div
              className="absolute inset-4 rounded-full opacity-75 bn-vortex-spin-reverse pointer-events-none"
              style={{
                background:
                  'repeating-conic-gradient(from 15deg, rgba(255,255,255,0.06) 0deg 6deg, transparent 6deg 24deg)',
                maskImage: 'radial-gradient(circle, transparent 18%, black 52%, transparent 82%)',
                WebkitMaskImage:
                  'radial-gradient(circle, transparent 18%, black 52%, transparent 82%)',
              }}
            />
            {/* Abyssal Black Hole Core + Ember Center Glow */}
            <div
              className="absolute inset-[22%] rounded-full pointer-events-none"
              style={{
                background:
                  'radial-gradient(circle, rgba(220,38,38,0.28) 0%, rgba(88,28,135,0.25) 48%, rgba(4,4,10,0.92) 78%)',
              }}
            />

            {/* 25 Outer Ring Metallic Hexagons (1..25) */}
            {ringSlots.map((slot, idx) => {
              const angleRad = (idx / 25) * 2 * Math.PI - Math.PI / 2;
              const radiusPct = 42.8;
              const leftPct = 50 + radiusPct * Math.cos(angleRad);
              const topPct = 50 + radiusPct * Math.sin(angleRad);
              const isHighlighted = spotlightSlot === slot.slotNumber;
              const trailIdx = trailSlots.indexOf(slot.slotNumber);
              const isTrail = !isHighlighted && trailIdx !== -1;
              const isBurst = landingBurstSlot === slot.slotNumber;
              const isFrameSlot = slot.kind === 'frame';

              return (
                <div
                  key={slot.slotNumber}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: `translate(-50%, -50%) scale(${
                      isHighlighted ? 1.24 : isTrail ? 1.09 - trailIdx * 0.025 : 1
                    })`,
                  }}
                  title={
                    isFrameSlot
                      ? `Heksagon #${slot.slotNumber}: Bingkai ${slot.frameLabel} (${frameCfg.frameWinProbabilityPercent}%)`
                      : `Heksagon #${slot.slotNumber}: x${slot.tokenAmount} Token Bingkai`
                  }
                  className={`absolute w-[34px] h-[38px] sm:w-[46px] sm:h-[52px] transition-transform duration-75 ${
                    isHighlighted ? 'z-30' : isTrail ? 'z-20' : isFrameSlot ? 'z-20' : 'z-10'
                  }`}
                >
                  {/* Landing Flash Shockwave */}
                  {isBurst && (
                    <span className="absolute -inset-2 rounded-full bg-amber-300/60 blur-md animate-ping pointer-events-none" />
                  )}

                  {/* Hexagon Outer Bevel Border */}
                  <div
                    className={`w-full h-full bn-hex-clip p-[1.5px] sm:p-[2px] ${
                      isHighlighted
                        ? 'bg-gradient-to-b from-white via-amber-200 to-amber-400 shadow-[0_0_24px_rgba(255,255,255,0.95)]'
                        : isTrail
                        ? 'bg-gradient-to-b from-amber-200/90 to-amber-500/70'
                        : isFrameSlot
                        ? 'bg-gradient-to-b from-amber-300 via-orange-500 to-red-700'
                        : 'bg-gradient-to-b from-slate-200/80 via-slate-400/60 to-slate-700'
                    }`}
                  >
                    {/* Hexagon Inner Fill */}
                    <div
                      className={`w-full h-full bn-hex-clip relative flex flex-col items-center justify-center ${
                        isHighlighted
                          ? 'bg-gradient-to-b from-white via-amber-100 to-amber-300 text-slate-950'
                          : isTrail
                          ? 'bg-gradient-to-b from-amber-300/45 via-slate-700 to-slate-900 text-amber-100'
                          : isFrameSlot
                          ? 'bg-gradient-to-b from-red-600 via-rose-700 to-red-950 text-white'
                          : 'bg-gradient-to-b from-slate-500/90 via-slate-600/95 to-slate-800 text-white'
                      }`}
                    >
                      {/* Slot small index */}
                      <span
                        className={`text-[7px] sm:text-[8px] font-mono leading-none tabular-nums ${
                          isHighlighted
                            ? 'text-slate-800 font-black'
                            : isFrameSlot
                            ? 'text-amber-200 font-bold'
                            : 'text-slate-200/80'
                        }`}
                      >
                        {slot.slotNumber}
                      </span>

                      {isFrameSlot ? (
                        <div className="my-0.5 flex items-center justify-center">
                          {slot.frameId && FRAME_THEME_ICONS[slot.frameId] ? (
                            <span className={isHighlighted ? 'brightness-50' : ''}>
                              {FRAME_THEME_ICONS[slot.frameId]}
                            </span>
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                        </div>
                      ) : (
                        <>
                          <TokenEmblemIcon className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]" />
                          <span
                            className={`text-[8px] sm:text-[10px] font-mono font-black leading-none tabular-nums -mt-0.5 ${
                              isHighlighted
                                ? 'text-slate-950'
                                : 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]'
                            }`}
                          >
                            x{slot.tokenAmount}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* KLASTER TENGAH PUSARAN: 5 HEKSAGON MERAH BARA KHUSUS BINGKAI */}
            <div className="absolute inset-[19%] pointer-events-none">
              {SPIN_AURA_FRAMES.map((frame, idx) => {
                const pos = centerClusterOffsets[idx] || centerClusterOffsets[0];
                const isOwned = ownedSet.has(frame.id);
                const isEquipped = currentAccount.avatarFrameId === frame.id;
                const isSelected = activePreviewFrame.id === frame.id;

                return (
                  <button
                    key={frame.id}
                    type="button"
                    onClick={() => setSelectedPreviewFrameId(frame.id)}
                    style={{
                      left: `${pos.leftPct}%`,
                      top: `${pos.topPct}%`,
                      transform: `translate(-50%, -50%) scale(${isSelected ? 1.07 : 1})`,
                    }}
                    title={`${frame.label} — ${
                      isEquipped ? 'Dipakai' : isOwned ? 'Dimiliki' : 'Terkunci'
                    }`}
                    className={`pointer-events-auto absolute w-[68px] h-[76px] sm:w-[96px] sm:h-[108px] transition-transform duration-150 cursor-pointer focus:outline-none ${
                      isSelected ? 'z-30' : 'z-20 hover:scale-105'
                    }`}
                  >
                    {/* Glowing Fiery Red-Orange Hexagon Bevel */}
                    <div
                      className={`w-full h-full bn-hex-clip p-[2px] sm:p-[3px] ${
                        isSelected
                          ? 'bg-gradient-to-b from-yellow-200 via-orange-400 to-red-600 shadow-[0_0_26px_rgba(249,115,22,0.95)]'
                          : 'bg-gradient-to-b from-amber-300 via-orange-500 to-red-700 shadow-[0_0_16px_rgba(220,38,38,0.65)]'
                      }`}
                    >
                      <div className="w-full h-full bn-hex-clip bg-gradient-to-b from-red-500 via-red-600 to-rose-900 flex flex-col items-center justify-center px-1 py-1.5 text-center relative">
                        {/* Avatar Wearing This Living Aura Frame */}
                        <div className="scale-[0.72] sm:scale-[0.88] origin-center -my-1">
                          <ProfileAvatarBadge
                            account={{
                              fullName: currentAccount.fullName,
                              cardStatus: currentAccount.cardStatus,
                              avatarPresetId: currentAccount.avatarPresetId,
                              avatarFrameId: frame.id,
                            }}
                            size="md"
                          />
                        </div>

                        <span className="text-[7px] sm:text-[9px] font-black text-white leading-tight truncate max-w-[92%] mt-0.5 drop-shadow">
                          {frame.label}
                        </span>
                        <span
                          className={`text-[6.5px] sm:text-[8px] font-mono font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                            isEquipped
                              ? 'bg-emerald-400 text-slate-950'
                              : isOwned
                              ? 'bg-amber-300 text-slate-950'
                              : 'bg-black/55 text-red-100'
                          }`}
                        >
                          {isEquipped ? 'Dipakai' : isOwned ? 'Dimiliki' : 'Terkunci'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Red-Hexagon Preview Strip */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-red-500/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <ProfileAvatarBadge
                account={{
                  fullName: currentAccount.fullName,
                  cardStatus: currentAccount.cardStatus,
                  avatarPresetId: currentAccount.avatarPresetId,
                  avatarFrameId: activePreviewFrame.id,
                }}
                size="md"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  {FRAME_THEME_ICONS[activePreviewFrame.id]}
                  <span className="text-xs sm:text-sm font-black text-white truncate">
                    {activePreviewFrame.label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {activePreviewFrame.description}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {activePreviewEquipped ? (
                <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-black">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sedang Dipakai</span>
                </span>
              ) : activePreviewOwned ? (
                <button
                  type="button"
                  onClick={() => handleEquipFrame(activePreviewFrame.id)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer transition"
                >
                  Pasang Bingkai Ini
                </button>
              ) : (
                <span className="text-[11px] font-mono text-amber-300 font-bold">
                  Peluang {frameCfg.frameWinProbabilityPercent}% / Tukar {exchangeTarget} Token
                </span>
              )}
            </div>
          </div>

          {/* HASIL PUTARAN TERAKHIR (HANYA MUNCUL SETELAH SOROT BERHENTI) */}
          {lastResult && stage === 'IDLE' && (
            <div className="p-4 rounded-2xl bg-slate-950/95 border border-amber-400/45 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-amber-200 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Hasil Terakhir ({lastResult.spinCount}x Putaran)</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {lastResult.totalTokensEarned > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-amber-400 text-slate-950 font-mono font-black text-[11px] tabular-nums">
                      +{lastResult.totalTokensEarned} Token
                    </span>
                  )}
                  {lastResult.newlyUnlockedFrameIds.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-mono font-black text-[11px]">
                      +{lastResult.newlyUnlockedFrameIds.length} Bingkai Baru
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {lastResult.results.map((item) => (
                  <span
                    key={item.rollIndex}
                    className={`px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold ${
                      item.kind === 'frame'
                        ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200'
                        : item.kind === 'duplicate_frame'
                        ? 'bg-amber-950/80 border-amber-400/60 text-amber-200'
                        : 'bg-slate-900 border-slate-700 text-slate-200'
                    }`}
                  >
                    #{item.rollIndex} [Hex {item.slotNumber}]:{' '}
                    {item.kind === 'frame'
                      ? `BINGKAI ${item.frameLabel}`
                      : item.kind === 'duplicate_frame'
                      ? `Duplikat ${item.frameLabel} → +${item.tokensAwarded} Token`
                      : `x${item.tokensAwarded} Token`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TOMBOL PUTAR SPIN BINGKAI (HANYA KOIN: 1x = 18 Koin, 5x = 87 Koin) */}
          <div className="space-y-3 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-300">
                Putar Khusus Menggunakan Koin Spin (Tidak Bisa Pakai Uang Tunai):
              </span>
              <span className="font-mono text-amber-300 font-bold tabular-nums inline-flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>
                  Koin Anda: {isAdminCard ? '∞' : userCoins.toLocaleString('id-ID')}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={stage === 'SPINNING_SPOTLIGHT' || !frameCfg.enabled}
                onClick={() => handleSpin(1)}
                className={`min-h-[56px] px-4 py-3 rounded-2xl border font-black flex items-center justify-between gap-3 transition active:scale-[0.98] cursor-pointer ${
                  stage === 'SPINNING_SPOTLIGHT' || !frameCfg.enabled
                    ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                    : isAdminCard || userCoins >= frameCfg.cost1xCoins
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border-yellow-200 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCw
                    className={`w-4 h-4 ${
                      stage === 'SPINNING_SPOTLIGHT' && activeRollCount === 1 ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="text-sm">1x Spin Bingkai</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-slate-950/20 font-mono text-xs tabular-nums">
                  {frameCfg.cost1xCoins} Koin
                </span>
              </button>

              <button
                type="button"
                disabled={stage === 'SPINNING_SPOTLIGHT' || !frameCfg.enabled}
                onClick={() => handleSpin(5)}
                className={`min-h-[56px] px-4 py-3 rounded-2xl border font-black flex items-center justify-between gap-3 transition active:scale-[0.98] cursor-pointer ${
                  stage === 'SPINNING_SPOTLIGHT' || !frameCfg.enabled
                    ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                    : isAdminCard || userCoins >= frameCfg.cost5xCoins
                    ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white border-orange-300/60 shadow-lg shadow-red-600/30'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCw
                    className={`w-4 h-4 ${
                      stage === 'SPINNING_SPOTLIGHT' && activeRollCount === 5 ? 'animate-spin' : ''
                    }`}
                  />
                  <div className="text-left">
                    <span className="text-sm block leading-tight">5x Spin Bingkai</span>
                    <span className="text-[10px] font-medium opacity-90 block">
                      Lebih hemat koin
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-black/25 font-mono text-xs tabular-nums">
                  {frameCfg.cost5xCoins} Koin
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KANAN (DESKTOP) / BAWAH (HP): SALDO TOKEN & TOKO TUKAR 500 TOKEN */}
        <div className="lg:col-span-5 space-y-5">
          {/* Saldo Token Bingkai + Progress Bar Menuju 500 Token + Sisa Kekurangan */}
          <div className="bg-slate-900/95 border border-amber-500/35 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-amber-400/45 flex items-center justify-center shrink-0">
                  <TokenEmblemIcon className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                    SALDO TOKEN BINGKAI
                  </span>
                  <span className="text-2xl font-black text-white font-mono tabular-nums leading-none">
                    {userTokens.toLocaleString('id-ID')}{' '}
                    <span className="text-xs font-bold text-amber-300">Token</span>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">
                  Biaya Tukar
                </span>
                <span className="text-sm font-black font-mono text-emerald-300 tabular-nums">
                  {exchangeTarget.toLocaleString('id-ID')} Token
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] font-mono">
                <span className="text-slate-300">
                  {tokenShortfall > 0
                    ? `Kurang ${tokenShortfall.toLocaleString('id-ID')} Token lagi`
                    : 'Token siap ditukar ke Bingkai!'}
                </span>
                <span className="text-amber-300 font-bold tabular-nums">
                  {Math.min(userTokens, exchangeTarget).toLocaleString('id-ID')} /{' '}
                  {exchangeTarget.toLocaleString('id-ID')} ({tokenProgressPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${tokenProgressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Kumpulkan Token dari 20 heksagon luar (hadiah berbobot{' '}
                <span className="font-mono text-amber-300">
                  x{frameCfg.tokenRewardMin}–x{frameCfg.tokenRewardMax} Token
                </span>
                ). Bingkai kembar otomatis menjadi{' '}
                <span className="font-mono text-emerald-300">
                  +{frameCfg.duplicateTokenCompensation} Token
                </span>
                .
              </p>
            </div>
          </div>

          {/* Toko Tukar 500 Token (Bebas Tukar Berulang) */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-orange-400 font-bold block">
                  TOKO TUKAR BINGKAI ({exchangeTarget} TOKEN)
                </span>
                <h3 className="text-base font-black text-white">
                  Koleksi 5 Bingkai Aura Hidup
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 tabular-nums">
                {SPIN_AURA_FRAMES.filter((f) => ownedSet.has(f.id)).length} /{' '}
                {SPIN_AURA_FRAMES.length} Dimiliki
              </span>
            </div>

            <div className="space-y-2.5">
              {SPIN_AURA_FRAMES.map((frame) => {
                const isOwned = ownedSet.has(frame.id);
                const isEquipped = currentAccount.avatarFrameId === frame.id;
                const canAffordToken = userTokens >= exchangeTarget;

                return (
                  <div
                    key={frame.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition ${
                      isEquipped
                        ? 'bg-emerald-950/35 border-emerald-400/60'
                        : isOwned
                        ? 'bg-slate-950/90 border-cyan-500/35'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ProfileAvatarBadge
                        account={{
                          fullName: currentAccount.fullName,
                          cardStatus: currentAccount.cardStatus,
                          avatarPresetId: currentAccount.avatarPresetId,
                          avatarFrameId: frame.id,
                        }}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {FRAME_THEME_ICONS[frame.id]}
                          <span className="text-xs font-black text-white truncate">
                            {frame.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {frame.description}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEquipped ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/45 text-emerald-300 text-[11px] font-black">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Dipakai</span>
                        </span>
                      ) : isOwned ? (
                        <button
                          type="button"
                          onClick={() => handleEquipFrame(frame.id)}
                          className="min-h-[40px] px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[11px] cursor-pointer transition"
                        >
                          Pasang
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExchangeToken(frame.id)}
                          className={`min-h-[40px] px-3 py-2 rounded-xl border font-black text-[11px] font-mono tabular-nums cursor-pointer transition ${
                            canAffordToken
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border-yellow-200 shadow-md shadow-amber-500/20'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          Tukar {exchangeTarget}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {userHistory.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-orange-400" />
                  <span>Riwayat Spin Bingkai Terakhir</span>
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {userHistory.slice(0, 6).map((h) => (
                    <div
                      key={h.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white block">
                          {h.spinCount}x Spin ({h.coinsSpent} Koin)
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {(h.unlockedFrameIds || []).length > 0
                            ? `${(h.unlockedFrameIds || []).length} Bingkai Baru + `
                            : ''}
                          {h.totalTokensEarned} Token
                        </span>
                      </div>
                      <span className="font-mono font-black text-amber-300 shrink-0 tabular-nums">
                        +{h.totalTokensEarned} TKN
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
