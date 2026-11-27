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
  Ticket,
  Zap,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { SPIN_AURA_FRAMES } from '../data/profileCustomizationCatalog';
import {
  buildFrameSpinRingSlots25,
  normalizeFrameSpinConfig,
} from '../data/spinWheelCatalog';
import { ProfileAvatarBadge } from './ProfileAvatarBadge';

interface SpinBingkaiArenaProps {
  onOpenCoinShop: () => void;
}

const FRAME_THEME_ICONS: Record<string, React.ReactNode> = {
  'frame-spin-petir-cyber': <Zap className="w-3.5 h-3.5 text-cyan-300" />,
  'frame-spin-api-naga': <Flame className="w-3.5 h-3.5 text-orange-300" />,
  'frame-spin-emas-imperial': <Crown className="w-3.5 h-3.5 text-amber-300" />,
  'frame-spin-kristal-es': <Snowflake className="w-3.5 h-3.5 text-sky-200" />,
  'frame-spin-galaksi-kosmik': <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />,
};

export const SpinBingkaiArena: React.FC<SpinBingkaiArenaProps> = ({ onOpenCoinShop }) => {
  const {
    currentAccount,
    spinWheelConfig,
    frameSpinHistory,
    spinBingkaiWheel,
    exchangeTokenForSpinFrame,
    equipSpinAvatarFrame,
  } = useBank();

  const frameCfg = useMemo(
    () => normalizeFrameSpinConfig(spinWheelConfig.frameSpin),
    [spinWheelConfig.frameSpin]
  );

  const ringSlots = useMemo(() => buildFrameSpinRingSlots25(frameCfg), [frameCfg]);

  const [spotlightSlot, setSpotlightSlot] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [activeRollCount, setActiveRollCount] = useState<1 | 5 | null>(null);
  const [selectedPreviewFrameId, setSelectedPreviewFrameId] = useState<string>(
    SPIN_AURA_FRAMES[0].id
  );
  const [lastResult, setLastResult] = useState<{
    spinCount: 1 | 5;
    coinsSpent: number;
    totalTokensEarned: number;
    newlyUnlockedFrameIds: string[];
    results: {
      rollIndex: number;
      slotNumber: number;
      kind: 'frame' | 'token' | 'duplicate_frame';
      frameId?: string;
      frameLabel?: string;
      tokensAwarded: number;
    }[];
    message: string;
  } | null>(null);
  const [inlineNotice, setInlineNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const animTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (animTimerRef.current !== null) {
        window.clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  if (!currentAccount) return null;

  const isAdminCard =
    currentAccount.cardTier === 'admin' || (currentAccount.spinCoins ?? 0) >= 900_000_000_000_000;
  const userCoins = currentAccount.spinCoins ?? 0;
  const userTokens = currentAccount.spinTokens ?? 0;
  const ownedSet = new Set<string>(currentAccount.ownedSpinFrameIds || []);
  const exchangeTarget = frameCfg.exchangeTokenCost;
  const tokenProgressPct = Math.min(100, Math.round((userTokens / Math.max(1, exchangeTarget)) * 100));

  const runSpotlightAnimation = (
    targetSlot: number,
    onDone: () => void
  ) => {
    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
    }

    const startSlot = spotlightSlot ?? 1;
    // 2 putaran penuh (50 langkah) + jarak menuju targetSlot
    const forwardDelta = (targetSlot - startSlot + 25) % 25;
    const totalSteps = 50 + (forwardDelta === 0 ? 25 : forwardDelta);

    let step = 0;
    const tick = () => {
      step += 1;
      const currentSlot = ((startSlot - 1 + step) % 25) + 1;
      setSpotlightSlot(currentSlot);

      if (step >= totalSteps) {
        animTimerRef.current = window.setTimeout(() => {
          setIsAnimating(false);
          setActiveRollCount(null);
          onDone();
        }, 280);
        return;
      }

      // Cepat di awal (32ms), lalu melambat halus di 14 langkah terakhir
      const remaining = totalSteps - step;
      let delayMs = 34;
      if (remaining <= 4) delayMs = 230;
      else if (remaining <= 8) delayMs = 145;
      else if (remaining <= 14) delayMs = 82;
      else if (remaining <= 22) delayMs = 50;

      animTimerRef.current = window.setTimeout(tick, delayMs);
    };

    animTimerRef.current = window.setTimeout(tick, 34);
  };

  const handleSpin = (spinCount: 1 | 5) => {
    if (isAnimating) return;
    setInlineNotice(null);

    const res = spinBingkaiWheel(spinCount);
    if (!res.success || !res.results || res.results.length === 0) {
      setInlineNotice({ type: 'error', text: res.message });
      return;
    }

    const priorityRoll =
      res.results.find((r) => r.kind === 'frame') ||
      res.results.find((r) => r.kind === 'duplicate_frame') ||
      res.results[res.results.length - 1];

    setIsAnimating(true);
    setActiveRollCount(spinCount);
    setLastResult(null);

    runSpotlightAnimation(priorityRoll.slotNumber, () => {
      if (priorityRoll.frameId) {
        setSelectedPreviewFrameId(priorityRoll.frameId);
      }
      setLastResult({
        spinCount,
        coinsSpent: res.coinsSpent ?? 0,
        totalTokensEarned: res.totalTokensEarned ?? 0,
        newlyUnlockedFrameIds: res.newlyUnlockedFrameIds ?? [],
        results: res.results!,
        message: res.message,
      });
      setInlineNotice({
        type: 'success',
        text: res.message,
      });
    });
  };

  const handleExchangeToken = (frameId: string) => {
    const res = exchangeTokenForSpinFrame(frameId);
    setInlineNotice({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setSelectedPreviewFrameId(frameId);
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

  const userHistory = frameSpinHistory.filter((h) => h.accountId === currentAccount.id);

  return (
    <div className="space-y-6">
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
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Beli Koin Spin</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KIRI: LINGKARAN 25 KOTAK + 5 BINGKAI AURA TENGAH + KONTROL 1x / 5x KOIN */}
        <div className="lg:col-span-7 bg-slate-900/95 border border-fuchsia-500/35 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-fuchsia-300 font-bold block">
                ARENA LINGKARAN 25 KOTAK • HANYA PAKAI KOIN SPIN
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Spin 5 Bingkai Aura Eksklusif ({frameCfg.frameWinProbabilityPercent}% Peluang)
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-300 font-bold tabular-nums">
                {frameCfg.cost1xCoins} Koin / 1x
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-fuchsia-300 font-bold tabular-nums">
                {frameCfg.cost5xCoins} Koin / 5x
              </span>
            </div>
          </div>

          {/* 25-SLOT CIRCULAR RING WITH 5 CENTER FRAMES */}
          <div className="relative w-full max-w-[340px] sm:max-w-[490px] aspect-square mx-auto select-none my-2">
            {/* Ambient Radial Backdrop */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-fuchsia-500/15 via-cyan-500/10 to-amber-500/15 blur-2xl pointer-events-none" />

            {/* Circular Guide Track */}
            <div className="absolute inset-[6%] rounded-full border border-dashed border-slate-700/70 pointer-events-none" />

            {/* 25 Kotak Luar Lingkaran (Nomor 1 s/d 25) */}
            {ringSlots.map((slot, idx) => {
              const angleRad = (idx / 25) * 2 * Math.PI - Math.PI / 2;
              const radiusPct = 44;
              const leftPct = 50 + radiusPct * Math.cos(angleRad);
              const topPct = 50 + radiusPct * Math.sin(angleRad);
              const isHighlighted = spotlightSlot === slot.slotNumber;
              const isFrameSlot = slot.kind === 'frame';

              return (
                <div
                  key={slot.slotNumber}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    transform: `translate(-50%, -50%) scale(${isHighlighted ? 1.22 : 1})`,
                  }}
                  title={
                    isFrameSlot
                      ? `Kotak #${slot.slotNumber}: Bingkai ${slot.frameLabel} (${frameCfg.frameWinProbabilityPercent}%)`
                      : `Kotak #${slot.slotNumber}: +${slot.tokenAmount} Token Bingkai`
                  }
                  className={`absolute w-8 h-8 sm:w-11 sm:h-11 rounded-xl flex flex-col items-center justify-center transition-transform duration-75 border text-center ${
                    isHighlighted
                      ? 'z-30 bg-amber-300 text-slate-950 border-white shadow-[0_0_22px_rgba(251,191,36,0.95)] ring-2 ring-white'
                      : isFrameSlot
                      ? 'z-20 bg-gradient-to-br from-fuchsia-900 via-slate-900 to-indigo-950 border-fuchsia-400/80 text-white shadow-md'
                      : 'z-10 bg-slate-950/95 border-slate-700/90 text-slate-200'
                  }`}
                >
                  <span
                    className={`text-[8px] sm:text-[9px] font-mono leading-none tabular-nums ${
                      isHighlighted
                        ? 'text-slate-900 font-black'
                        : isFrameSlot
                        ? 'text-fuchsia-300 font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {slot.slotNumber}
                  </span>

                  {isFrameSlot ? (
                    <div className="mt-0.5 flex items-center justify-center">
                      {slot.frameId && FRAME_THEME_ICONS[slot.frameId] ? (
                        <span className={isHighlighted ? 'brightness-50' : ''}>
                          {FRAME_THEME_ICONS[slot.frameId]}
                        </span>
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                    </div>
                  ) : (
                    <span
                      className={`text-[9px] sm:text-[10px] font-mono font-black leading-none mt-0.5 tabular-nums ${
                        isHighlighted ? 'text-slate-950' : 'text-amber-300'
                      }`}
                    >
                      +{slot.tokenAmount}
                    </span>
                  )}
                </div>
              );
            })}

            {/* TENGAH LINGKARAN: 5 HADIAH BINGKAI AURA SPESIAL */}
            <div className="absolute inset-[18%] rounded-full bg-slate-950/95 border-2 border-slate-800 shadow-[inset_0_0_32px_rgba(15,23,42,0.95)] flex flex-col items-center justify-center p-3 sm:p-5 text-center">
              <div className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 border border-fuchsia-400/40 text-fuchsia-200 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider mb-1.5">
                5 Bingkai Aura Utama • {frameCfg.frameWinProbabilityPercent}%
              </div>

              {/* 5 Bingkai Spesial di Tengah */}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 my-1 max-w-[230px] sm:max-w-[260px]">
                {SPIN_AURA_FRAMES.map((frame) => {
                  const isOwned = ownedSet.has(frame.id);
                  const isEquipped = currentAccount.avatarFrameId === frame.id;
                  const isPreview = activePreviewFrame.id === frame.id;

                  return (
                    <button
                      key={frame.id}
                      type="button"
                      onClick={() => setSelectedPreviewFrameId(frame.id)}
                      className={`relative p-1 rounded-2xl transition cursor-pointer ${
                        isPreview
                          ? 'bg-slate-800/90 ring-2 ring-amber-400'
                          : 'hover:bg-slate-900/90'
                      }`}
                      title={`${frame.label} (${isOwned ? 'Dimiliki' : 'Terkunci'})`}
                    >
                      <ProfileAvatarBadge
                        account={{
                          fullName: currentAccount.fullName,
                          cardStatus: currentAccount.cardStatus,
                          avatarPresetId: currentAccount.avatarPresetId,
                          avatarFrameId: frame.id,
                        }}
                        size="md"
                      />
                      {isEquipped && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center shadow">
                          <CheckCircle2 className="w-3 h-3" />
                        </span>
                      )}
                      {!isOwned && !isEquipped && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-slate-600 text-slate-300 flex items-center justify-center">
                          <Lock className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Label Pratinjau Bingkai Terpilih */}
              <div className="mt-1.5 space-y-0.5">
                <div className="text-[11px] sm:text-xs font-black text-white flex items-center justify-center gap-1">
                  {FRAME_THEME_ICONS[activePreviewFrame.id]}
                  <span>{activePreviewFrame.label}</span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-400 hidden sm:block max-w-[210px] mx-auto leading-tight">
                  {activePreviewFrame.description}
                </p>
              </div>
            </div>
          </div>

          {/* HASIL PUTARAN TERAKHIR */}
          {lastResult && (
            <div className="p-4 rounded-2xl bg-slate-950/95 border border-fuchsia-400/50 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-black text-fuchsia-200 uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Hasil {lastResult.spinCount}x Spin Bingkai</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {lastResult.totalTokensEarned > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[11px] tabular-nums">
                      +{lastResult.totalTokensEarned} Token
                    </span>
                  )}
                  {lastResult.newlyUnlockedFrameIds.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-mono font-black text-[11px]">
                      +{lastResult.newlyUnlockedFrameIds.length} Bingkai Baru!
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
                    #{item.rollIndex} [Kotak {item.slotNumber}]:{' '}
                    {item.kind === 'frame'
                      ? `BINGKAI ${item.frameLabel}`
                      : item.kind === 'duplicate_frame'
                      ? `Duplikat ${item.frameLabel} → +${item.tokensAwarded} Token`
                      : `+${item.tokensAwarded} Token`}
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
              <span className="font-mono text-amber-300 font-bold tabular-nums">
                Koin Anda: {isAdminCard ? '∞' : userCoins.toLocaleString('id-ID')} 🪙
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isAnimating || !frameCfg.enabled}
                onClick={() => handleSpin(1)}
                className={`min-h-[56px] px-4 py-3 rounded-2xl border font-black flex items-center justify-between gap-3 transition active:scale-[0.98] cursor-pointer ${
                  isAnimating || !frameCfg.enabled
                    ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                    : isAdminCard || userCoins >= frameCfg.cost1xCoins
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border-yellow-200 shadow-lg shadow-amber-500/20'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCw
                    className={`w-4 h-4 ${
                      isAnimating && activeRollCount === 1 ? 'animate-spin' : ''
                    }`}
                  />
                  <span className="text-sm">1x Spin Bingkai</span>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-slate-950/20 font-mono text-xs tabular-nums">
                  🪙 {frameCfg.cost1xCoins} Koin
                </span>
              </button>

              <button
                type="button"
                disabled={isAnimating || !frameCfg.enabled}
                onClick={() => handleSpin(5)}
                className={`min-h-[56px] px-4 py-3 rounded-2xl border font-black flex items-center justify-between gap-3 transition active:scale-[0.98] cursor-pointer ${
                  isAnimating || !frameCfg.enabled
                    ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                    : isAdminCard || userCoins >= frameCfg.cost5xCoins
                    ? 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 hover:from-fuchsia-400 hover:to-indigo-400 text-white border-fuchsia-300/60 shadow-lg shadow-fuchsia-500/25'
                    : 'bg-slate-950 hover:bg-slate-900 text-slate-200 border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <RotateCw
                    className={`w-4 h-4 ${
                      isAnimating && activeRollCount === 5 ? 'animate-spin' : ''
                    }`}
                  />
                  <div className="text-left">
                    <span className="text-sm block leading-tight">5x Spin Bingkai</span>
                    <span className="text-[10px] font-medium opacity-85 block">
                      Lebih hemat koin
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-xl bg-black/25 font-mono text-xs tabular-nums">
                  🪙 {frameCfg.cost5xCoins} Koin
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* KANAN (DESKTOP) / BAWAH (HP): SALDO TOKEN & TOKO TUKAR BINGKAI (300 TOKEN) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Saldo Token Bingkai + Progress Menuju 300 Token */}
          <div className="bg-slate-900/95 border border-amber-500/35 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <Ticket className="w-6 h-6" />
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
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-300">
                  Progress Tukar 1 Bingkai Eksklusif
                </span>
                <span className="text-amber-300 font-bold tabular-nums">
                  {Math.min(userTokens, exchangeTarget).toLocaleString('id-ID')} /{' '}
                  {exchangeTarget.toLocaleString('id-ID')} ({tokenProgressPct}%)
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${tokenProgressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Kumpulkan Token dari kotak <strong className="text-slate-200">1–25</strong> (hadiah{' '}
                <span className="font-mono text-amber-300">
                  {frameCfg.tokenRewardMin}–{frameCfg.tokenRewardMax} Token
                </span>
                ). Jika mendapat bingkai kembar saat spin, otomatis menjadi{' '}
                <span className="font-mono text-emerald-300">
                  +{frameCfg.duplicateTokenCompensation} Token
                </span>
                .
              </p>
            </div>
          </div>

          {/* Toko Tukar 5 Bingkai Aura Spesial */}
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold block">
                  TOKO TUKAR BINGKAI ({exchangeTarget} TOKEN)
                </span>
                <h3 className="text-base font-black text-white">
                  Koleksi 5 Bingkai Aura Eksklusif
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
                          className="min-h-[38px] px-3.5 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-[11px] cursor-pointer transition"
                        >
                          Pasang
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleExchangeToken(frame.id)}
                          className={`min-h-[38px] px-3 py-2 rounded-xl border font-black text-[11px] font-mono tabular-nums cursor-pointer transition ${
                            canAffordToken
                              ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 border-yellow-200'
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
                  <History className="w-3.5 h-3.5 text-fuchsia-400" />
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
