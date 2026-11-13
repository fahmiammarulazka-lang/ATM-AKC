/**
 * Tab Emas Mewah 24K Real-Time — Bank Nusantara
 * Menampilkan Emas Batangan (tebal) & Emas Perhiasan (tipis) interaktif,
 * Sertifikat 24K 999.9, jam & hitung mundur Tanggal 1 (+5%/bulan real-time),
 * kustom nominal Rp1.000–tak terbatas, kustom patokan harga user,
 * pelacakan batch FIFO (penurunan hari sama -1%/opsi -5%), grafik tren, dan target tabungan.
 */
import React, { useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Coins,
  Crown,
  History,
  Info,
  RotateCw,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { GoldFormType, GoldMotifType } from '../types/bank';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';

const getTodayDateKey = (): string => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDateShortIndo = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
};

interface TabEmasViewProps {
  standalone?: boolean;
  onNavigateToDashboard?: () => void;
  onNavigateToTransferGold?: () => void;
  onNavigateToMutasi?: () => void;
}

export const TabEmasView: React.FC<TabEmasViewProps> = ({
  standalone = false,
  onNavigateToDashboard,
  onNavigateToTransferGold,
  onNavigateToMutasi,
}) => {
  const {
    currentAccount,
    goldMarketConfig,
    buyGold,
    sellGold,
    setCustomerCustomGoldPrice,
    updateCustomerGoldPreferences,
    dismissGoldMonthlyBanner,
  } = useBank();

  // Real-time 1-second clock for Tanggal 1 countdown
  const [nowTick, setNowTick] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Visual interactive states
  const [goldForm, setGoldForm] = useState<GoldFormType>(
    currentAccount?.goldPreferredForm || 'batangan'
  );
  const [goldMotif, setGoldMotif] = useState<GoldMotifType>(
    currentAccount?.goldPreferredMotif || 'klasik'
  );
  const [isFlippedBack, setIsFlippedBack] = useState<boolean>(false);
  const [certiImgError, setCertiImgError] = useState<boolean>(false);
  const [tiltPos, setTiltPos] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  // Calculator Buy/Sell states
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [nominalInput, setNominalInput] = useState<string>('20000000');
  const [tradeFeedback, setTradeFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // User custom reference price states
  const [showCustomPriceEditor, setShowCustomPriceEditor] = useState<boolean>(false);
  const [customPriceDraft, setCustomPriceDraft] = useState<string>(
    String(
      currentAccount?.customUserGoldPricePerGram ||
        goldMarketConfig.currentPricePerGram ||
        1_400_000
    )
  );

  // Savings Target states
  const [editingTarget, setEditingTarget] = useState<boolean>(false);
  const [targetDraft, setTargetDraft] = useState<string>(
    String(currentAccount?.goldSavingsTarget || 20_000_000)
  );

  if (!currentAccount) {
    return null;
  }

  const activePricePerGram =
    currentAccount.customUserGoldPricePerGram && currentAccount.customUserGoldPricePerGram >= 1000
      ? currentAccount.customUserGoldPricePerGram
      : goldMarketConfig.currentPricePerGram || 1_400_000;
  const isUsingCustomUserPrice = Boolean(
    currentAccount.customUserGoldPricePerGram && currentAccount.customUserGoldPricePerGram >= 1000
  );

  const batches = currentAccount.goldBatches || [];
  const totalGrams =
    batches.length > 0
      ? batches.reduce((sum, b) => sum + b.grams, 0)
      : currentAccount.goldGrams || 0;
  const currentMarketValueRp = Math.round(totalGrams * activePricePerGram);
  const totalCostModalRp =
    batches.length > 0
      ? batches.reduce((sum, b) => sum + b.costRupiah, 0)
      : currentMarketValueRp;

  const todayKey = getTodayDateKey();
  const sameDayPenaltyPct = goldMarketConfig.sameDayPenaltyPercent ?? 1;
  const monthlyGrowthPct = goldMarketConfig.monthlyGrowthPercent ?? 5;
  const minNominal = Math.max(1000, goldMarketConfig.minNominalRupiah || 1000);

  // Compute real-time sell-back value across all owned batches (respecting same-day rule)
  const netSellNowValueRp = useMemo(() => {
    if (totalGrams <= 0.000001) return 0;
    if (batches.length === 0) return currentMarketValueRp;
    return Math.round(
      batches.reduce((sum, b) => {
        const gross = b.grams * activePricePerGram;
        const isSameDay = b.purchaseDateKey === todayKey;
        return sum + (isSameDay ? gross * (1 - sameDayPenaltyPct / 100) : gross);
      }, 0)
    );
  }, [batches, totalGrams, currentMarketValueRp, activePricePerGram, todayKey, sameDayPenaltyPct]);

  const portfolioUnrealizedDelta = netSellNowValueRp - totalCostModalRp;
  const portfolioDeltaPercent =
    totalCostModalRp > 0 ? (portfolioUnrealizedDelta / totalCostModalRp) * 100 : 0;

  // Countdown to Tanggal 1 next month (00:00:00 local)
  const countdown = useMemo(() => {
    const nextFirst = new Date(nowTick.getFullYear(), nowTick.getMonth() + 1, 1, 0, 0, 0);
    const diffMs = Math.max(0, nextFirst.getTime() - nowTick.getTime());
    const totalSec = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return {
      days,
      hours: String(hours).padStart(2, '0'),
      mins: String(mins).padStart(2, '0'),
      secs: String(secs).padStart(2, '0'),
      nextFirstLabel: nextFirst.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };
  }, [nowTick]);

  // Dynamic visual splendor scale adapting to user's gold & cash wealth
  const combinedWealthForScale =
    currentMarketValueRp > 0
      ? currentMarketValueRp
      : isUnlimitedNumber(currentAccount.balance)
      ? 500_000_000
      : currentAccount.balance;

  const goldScaleTier = useMemo(() => {
    if (combinedWealthForScale >= 100_000_000) {
      return {
        label: 'Koleksi Royal Bullion',
        scaleClass: 'scale-[1.02]',
        glowStyle: '0 24px 70px -15px rgba(212, 175, 55, 0.42)',
      };
    }
    if (combinedWealthForScale >= 20_000_000) {
      return {
        label: 'Koleksi Premier 24K',
        scaleClass: 'scale-100',
        glowStyle: '0 18px 50px -15px rgba(212, 175, 55, 0.28)',
      };
    }
    return {
      label: 'Koleksi Standar 24K',
      scaleClass: 'scale-[0.98]',
      glowStyle: '0 12px 35px -15px rgba(212, 175, 55, 0.18)',
    };
  }, [combinedWealthForScale]);

  // Trigger luxury gold particle burst
  const fireGoldParticles = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.6 },
        colors: ['#F3E5AB', '#D4AF37', '#F59E0B', '#FDE047', '#FFFFFF'],
      });
    } catch {
      // ignore if canvas unavailable
    }
  };

  // Preview calculation for Buy/Sell nominal input
  const parsedNominal = Math.max(0, Math.round(Number(nominalInput) || 0));
  const estimatedBuyGrams = parsedNominal > 0 ? parsedNominal / activePricePerGram : 0;

  const sellSimulation = useMemo(() => {
    if (parsedNominal < minNominal || totalGrams <= 0.000001) {
      return { gross: 0, proceeds: 0, penalty: 0, sameDayHit: false, grams: 0 };
    }
    const targetGrams = Math.min(totalGrams, parsedNominal / activePricePerGram);
    if (batches.length === 0) {
      const gVal = Math.round(targetGrams * activePricePerGram);
      return { gross: gVal, proceeds: gVal, penalty: 0, sameDayHit: false, grams: targetGrams };
    }
    let rem = targetGrams;
    let gross = 0;
    let proceeds = 0;
    let sameDayHit = false;
    for (const b of batches) {
      if (rem <= 0.0000001) break;
      const take = Math.min(b.grams, rem);
      const mv = take * activePricePerGram;
      const isSame = b.purchaseDateKey === todayKey;
      if (isSame) sameDayHit = true;
      gross += mv;
      proceeds += isSame ? mv * (1 - sameDayPenaltyPct / 100) : mv;
      rem -= take;
    }
    const gRound = Math.round(gross);
    const pRound = Math.round(proceeds);
    return {
      gross: gRound,
      proceeds: pRound,
      penalty: Math.max(0, gRound - pRound),
      sameDayHit,
      grams: targetGrams,
    };
  }, [parsedNominal, minNominal, totalGrams, activePricePerGram, batches, todayKey, sameDayPenaltyPct]);

  // Handlers
  const handleSelectForm = (form: GoldFormType) => {
    setGoldForm(form);
    updateCustomerGoldPreferences({ preferredForm: form });
  };

  const handleSelectMotif = (motif: GoldMotifType) => {
    setGoldMotif(motif);
    updateCustomerGoldPreferences({ preferredMotif: motif });
  };

  const handleApplyBalancePercent = (pct: number) => {
    if (tradeMode === 'buy') {
      const isInf = isUnlimitedNumber(currentAccount.balance);
      const baseBal = isInf ? 100_000_000 : currentAccount.balance;
      const amt = Math.max(minNominal, Math.floor((baseBal * pct) / 100));
      setNominalInput(String(amt));
    } else {
      const maxVal = Math.floor(totalGrams * activePricePerGram);
      const amt = Math.max(0, Math.floor((maxVal * pct) / 100));
      setNominalInput(String(amt));
    }
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    setTradeFeedback(null);
    if (tradeMode === 'buy') {
      const res = buyGold({
        rupiahAmount: parsedNominal,
        goldForm,
        motif: goldMotif,
      });
      if (res.success) {
        fireGoldParticles();
        setTradeFeedback({ type: 'success', text: res.message });
      } else {
        setTradeFeedback({ type: 'error', text: res.message });
      }
    } else {
      const res = sellGold({
        mode: 'rupiah',
        rupiahAmount: parsedNominal,
      });
      if (res.success) {
        fireGoldParticles();
        setTradeFeedback({ type: 'success', text: res.message });
      } else {
        setTradeFeedback({ type: 'error', text: res.message });
      }
    }
  };

  const handleSellAll = () => {
    setTradeFeedback(null);
    const res = sellGold({ mode: 'all' });
    if (res.success) {
      fireGoldParticles();
      setTradeFeedback({ type: 'success', text: res.message });
    } else {
      setTradeFeedback({ type: 'error', text: res.message });
    }
  };

  const handleSellSpecificBatch = (batchId: string) => {
    setTradeFeedback(null);
    const res = sellGold({ mode: 'batch', batchId });
    if (res.success) {
      fireGoldParticles();
      setTradeFeedback({ type: 'success', text: res.message });
    } else {
      setTradeFeedback({ type: 'error', text: res.message });
    }
  };

  const handleSaveCustomPrice = () => {
    const val = Math.round(Number(customPriceDraft) || 0);
    const res = setCustomerCustomGoldPrice(val);
    setTradeFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) setShowCustomPriceEditor(false);
  };

  const handleResetCustomPrice = () => {
    const res = setCustomerCustomGoldPrice(null);
    setCustomPriceDraft(String(goldMarketConfig.currentPricePerGram));
    setTradeFeedback({ type: 'success', text: res.message });
    setShowCustomPriceEditor(false);
  };

  const handleSaveTarget = () => {
    const val = Math.max(1000, Math.round(Number(targetDraft) || 20_000_000));
    updateCustomerGoldPreferences({ targetRupiah: val });
    setEditingTarget(false);
  };

  // Savings target math
  const savingsTargetRp = currentAccount.goldSavingsTarget || 20_000_000;
  const targetProgressPct = Math.min(
    100,
    savingsTargetRp > 0 ? Math.round((currentMarketValueRp / savingsTargetRp) * 100) : 0
  );

  // Build SVG chart coordinates including next Tanggal 1 projection
  const chartSeries = useMemo(() => {
    const hist = goldMarketConfig.priceHistory || [];
    const projectedNextPrice = Math.round(activePricePerGram * (1 + monthlyGrowthPct / 100));
    const points = [
      ...hist.map((h) => ({ label: h.label, price: h.pricePerGram, projected: false })),
      { label: 'Tgl 1 Depan (+5%)', price: projectedNextPrice, projected: true },
    ];
    if (points.length < 2) return null;
    const minP = Math.min(...points.map((p) => p.price)) * 0.96;
    const maxP = Math.max(...points.map((p) => p.price)) * 1.03;
    const span = Math.max(1, maxP - minP);
    const width = 560;
    const height = 165;
    const padX = 22;
    const padY = 18;
    const coords = points.map((p, idx) => {
      const x = padX + (idx / (points.length - 1)) * (width - padX * 2);
      const y = height - padY - ((p.price - minP) / span) * (height - padY * 2);
      return { ...p, x, y };
    });
    const linePath = coords.map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
    const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padY} L ${coords[0].x} ${height - padY} Z`;
    return { coords, linePath, areaPath, width, height, projectedNextPrice };
  }, [goldMarketConfig.priceHistory, activePricePerGram, monthlyGrowthPct]);

  // Motif visual styles for the luxury gold slab/jewelry frame
  const motifSurface = useMemo(() => {
    if (goldMotif === 'royal_platinum') {
      return {
        gradient:
          'linear-gradient(145deg, #FFF5C8 0%, #E7C65E 24%, #C29932 52%, #F6DC80 76%, #6B5212 100%)',
        border: 'border-amber-200/80',
        castEdgeColor: '#5B4510',
        bevelBottom: 'from-[#8A6D1C] via-[#4A3B10] to-[#1F1807]',
        engraving: 'text-[#2B1F06]',
        frameAccent: 'border-amber-200/50 bg-[#14120D]',
        motifName: 'Royal Platinum',
      };
    }
    if (goldMotif === 'nusantara') {
      return {
        gradient:
          'linear-gradient(145deg, #FFF0A6 0%, #F4C430 28%, #C98A0C 58%, #F9D96C 82%, #754C00 100%)',
        border: 'border-amber-300/80',
        castEdgeColor: '#694302',
        bevelBottom: 'from-[#9A6808] via-[#5E3E02] to-[#2B1B00]',
        engraving: 'text-[#362100]',
        frameAccent: 'border-amber-400/45 bg-[#151108]',
        motifName: 'Nusantara Heritage',
      };
    }
    return {
      gradient:
        'linear-gradient(145deg, #FFF7B8 0%, #F1C94A 26%, #CF9914 54%, #FFE175 78%, #7F5A06 100%)',
      border: 'border-amber-300/85',
      castEdgeColor: '#755205',
      bevelBottom: 'from-[#A67C00] via-[#664B00] to-[#2E2100]',
      engraving: 'text-[#2E1E00]',
      frameAccent: 'border-amber-400/45 bg-[#11131A]',
      motifName: 'Klasik 24K',
    };
  }, [goldMotif]);

  const serialNumber = `BN-AU-${currentAccount.accountNumber.slice(-6)}-${goldForm === 'batangan' ? 'BAR' : 'JWL'}`;
  const isBatangan = goldForm === 'batangan';

  return (
    <div className="space-y-6 text-slate-100">
      {/* Standalone Top Quick Navigation & Account Context Bar when accessed right beside M-Banking */}
      {(standalone || onNavigateToTransferGold) && (
        <div className="rounded-2xl bg-[#0B0E14] border border-amber-500/30 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span>Brankas &amp; Investasi Emas 24K Real-Time</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentAccount.fullName} · Saldo Rekening:{' '}
              <span className="font-mono text-emerald-300 font-semibold">
                {isUnlimitedNumber(currentAccount.balance)
                  ? 'Rp ∞ (Tak Terbatas)'
                  : formatRupiah(currentAccount.balance)}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>M-Banking</span>
              </button>
            )}
            {onNavigateToTransferGold && (
              <button
                type="button"
                onClick={onNavigateToTransferGold}
                className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Transfer Emas (Bebas 5%)</span>
              </button>
            )}
            {onNavigateToMutasi && (
              <button
                type="button"
                onClick={onNavigateToMutasi}
                className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <History className="w-3.5 h-3.5" />
                <span>Mutasi Emas</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Real-time Tanggal 1 Celebration / Notification Banner */}
      {goldMarketConfig.lastMonthlyEventBanner && (
        <div className="rounded-2xl bg-[#14120A] border border-amber-400/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-400/40 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                {goldMarketConfig.lastMonthlyEventBanner.title}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                {goldMarketConfig.lastMonthlyEventBanner.message}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissGoldMonthlyBanner}
            className="px-3 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-200 text-xs font-semibold cursor-pointer shrink-0"
          >
            Tutup Info
          </button>
        </div>
      )}

      {/* TOP OBSIDIAN LUXURY HEADER & REAL-TIME TANGGAL 1 CLOCK */}
      <div className="rounded-3xl bg-[#090B10] border border-amber-500/25 p-5 sm:p-7">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-amber-300/90 font-medium">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Brankas Emas Mewah 24K · 999.9 Fine Gold</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400 font-semibold">
                +{monthlyGrowthPct}% Otomatis Setiap Tanggal 1
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Investasi &amp; Koleksi Emas 24K Real-Time
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Pilih tampilan <strong className="text-amber-200">Emas Batangan</strong> tebal atau{' '}
              <strong className="text-amber-200">Emas Perhiasan</strong> tipis elegan, atur nominal mulai{' '}
              <span className="font-mono text-amber-300">Rp 1.000</span> hingga tak terbatas, dan pantau kenaikan harga otomatis setiap tanggal 1 bulan baru.
            </p>
          </div>

          {/* Live Clock + Countdown to Tanggal 1 */}
          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4 min-w-[280px] space-y-2 shrink-0">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-amber-400" />
                <span>Waktu Sistem Real-Time</span>
              </span>
              <span className="font-mono tabular-nums text-amber-300">
                {nowTick.toLocaleTimeString('id-ID', { hour12: false })}
              </span>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <div className="text-[11px] text-slate-400">
                Hitung Mundur Kenaikan +{monthlyGrowthPct}% ({countdown.nextFirstLabel}):
              </div>
              <div className="font-mono tabular-nums text-lg font-bold text-amber-300 mt-0.5 tracking-tight">
                {countdown.days} Hari · {countdown.hours}:{countdown.mins}:{countdown.secs}
              </div>
            </div>
            {goldMarketConfig.simulatedMonthsOffset > 0 && (
              <div className="text-[11px] text-cyan-300 font-mono">
                Mode Simulasi Bulan Admin: +{goldMarketConfig.simulatedMonthsOffset} Bulan aktif
              </div>
            )}
          </div>
        </div>

        {/* 4-COLUMN KPI SUMMARY STRIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4">
            <div className="text-xs text-slate-400">Nilai Kekayaan Emas Anda</div>
            <div className="font-mono tabular-nums text-xl font-bold text-amber-300 mt-1">
              {formatRupiah(currentMarketValueRp)}
            </div>
            <div className="font-mono tabular-nums text-xs text-slate-400 mt-0.5">
              Berat: {totalGrams.toFixed(4)} gram (24K)
            </div>
          </div>

          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Patokan Harga / Gram</span>
              {isUsingCustomUserPrice && (
                <span className="text-cyan-300 font-semibold">Kustom User</span>
              )}
            </div>
            <div className="font-mono tabular-nums text-xl font-bold text-white mt-1">
              {formatRupiah(activePricePerGram)}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowCustomPriceEditor(!showCustomPriceEditor)}
                className="text-amber-300 hover:text-amber-200 underline cursor-pointer"
              >
                {showCustomPriceEditor ? 'Tutup Kustom Harga' : 'Atur / Kustom Harga'}
              </button>
              {isUsingCustomUserPrice && (
                <>
                  <span className="text-slate-600">·</span>
                  <button
                    type="button"
                    onClick={handleResetCustomPrice}
                    className="text-cyan-300 hover:underline cursor-pointer"
                  >
                    Reset Pasar
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4">
            <div className="text-xs text-slate-400">Estimasi Cair Jual Saat Ini</div>
            <div className="font-mono tabular-nums text-xl font-bold text-emerald-300 mt-1">
              {formatRupiah(netSellNowValueRp)}
            </div>
            <div
              className={`font-mono tabular-nums text-xs mt-0.5 flex items-center gap-1 ${
                portfolioUnrealizedDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {portfolioUnrealizedDelta >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>
                {portfolioUnrealizedDelta >= 0 ? '+' : ''}
                {formatRupiah(portfolioUnrealizedDelta)} ({portfolioDeltaPercent >= 0 ? '+' : ''}
                {portfolioDeltaPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4">
            <div className="text-xs text-slate-400">Saldo Uang Tunai Rekening</div>
            <div className="font-mono tabular-nums text-xl font-bold text-white mt-1">
              {isUnlimitedNumber(currentAccount.balance)
                ? '∞ UNLIMITED'
                : formatRupiah(currentAccount.balance)}
            </div>
            <div className="text-xs text-amber-300/90 mt-0.5">
              Jual hari sama: -{sameDayPenaltyPct}% · Bulan depan: +{monthlyGrowthPct}%
            </div>
          </div>
        </div>

        {/* Inline Custom Gold Price Panel when toggled */}
        {showCustomPriceEditor && (
          <div className="mt-4 rounded-2xl bg-[#11151E] border border-amber-500/40 p-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1 flex-1">
              <label className="text-xs font-semibold text-amber-300 block">
                Kustom Harga Patokan Emas per Gram (Rp 1.000 s/d Tak Terbatas):
              </label>
              <div className="flex flex-wrap gap-2">
                <input
                  type="number"
                  min={1000}
                  value={customPriceDraft}
                  onChange={(e) => setCustomPriceDraft(e.target.value)}
                  className="flex-1 min-w-[200px] bg-[#090B10] border border-slate-700 text-amber-200 rounded-xl px-3.5 py-2 font-mono tabular-nums text-sm focus:outline-none focus:border-amber-400"
                />
                {[500_000, 1_400_000, 2_000_000, 5_000_000].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setCustomPriceDraft(String(p))}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs cursor-pointer"
                  >
                    {formatRupiah(p)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleSaveCustomPrice}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Terapkan Harga Kustom
              </button>
              <button
                type="button"
                onClick={handleResetCustomPrice}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs cursor-pointer"
              >
                Gunakan Harga Pasar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: LUXURY INTERACTIVE GOLD SHOWCASE (LEFT) + CERTIFICATE & CONTROLS (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive 3D Luxury Gold Bar / Jewelry Visual */}
        <div className="lg:col-span-7 rounded-3xl bg-[#090B10] border border-amber-500/25 p-5 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Tampilan Emas 24K · {isBatangan ? 'Emas Batangan' : 'Emas Perhiasan'}
              </h3>
              <p className="text-xs text-slate-400">
                {goldScaleTier.label} · Sentuh emas untuk efek kilau &amp; putar depan-belakang
              </p>
            </div>

            {/* Form Switcher: Batangan Tebal vs Perhiasan Tipis */}
            <div className="flex items-center gap-1 p-1 bg-[#11151E] border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleSelectForm('batangan')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  isBatangan
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Emas Batangan (Tebal)
              </button>
              <button
                type="button"
                onClick={() => handleSelectForm('perhiasan')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  !isBatangan
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Emas Perhiasan (Tipis)
              </button>
            </div>
          </div>

          {/* Interactive Single-Piece Gold Object Stage */}
          <div className="flex-1 flex flex-col items-center justify-center py-3 space-y-5">
            <div
              className={`relative flex flex-col items-center justify-center transition-transform duration-300 ${goldScaleTier.scaleClass}`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setTiltPos({ x, y, active: true });
              }}
              onMouseLeave={() => setTiltPos({ x: 50, y: 50, active: false })}
              style={{ perspective: '1200px' }}
            >
              {/* Subtle ambient spotlight behind the single gold piece */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -inset-6 rounded-full opacity-35 blur-2xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(245,196,67,0.38) 0%, rgba(245,196,67,0) 70%)',
                }}
              />

              {isBatangan ? (
                /* EMAS BATANGAN (HANYA 1 BIJI — SINGLE 3D CAST BULLION INGOT) */
                <div
                  className="relative w-56 sm:w-64 h-80 sm:h-[340px] transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${isFlippedBack ? 180 : 0}deg) ${
                      tiltPos.active && !isFlippedBack
                        ? `rotateX(${(50 - tiltPos.y) * 0.16}deg) rotateY(${(tiltPos.x - 50) * 0.18}deg)`
                        : ''
                    }`,
                  }}
                >
                  {/* FRONT FACE: Single Thick 3D Cast Gold Ingot */}
                  <div
                    className="absolute inset-0"
                    style={{ backfaceVisibility: 'hidden' }}
                  >
                    {/* 3D Extruded Side & Bottom Cast Thickness Shell (Right + Bottom Bevel) */}
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 translate-x-3 translate-y-3.5 rounded-[24px] border border-amber-700/70"
                      style={{
                        background: `linear-gradient(155deg, ${motifSurface.castEdgeColor} 0%, #3E2A02 55%, #1E1400 100%)`,
                        boxShadow: '0 22px 42px rgba(0,0,0,0.75)',
                      }}
                    />

                    {/* Main Top Polished Cast Gold Bar Face */}
                    <div
                      className={`relative w-full h-full rounded-[22px] border-2 ${motifSurface.border} overflow-hidden flex flex-col items-center justify-between px-6 py-7`}
                      style={{
                        background: motifSurface.gradient,
                        boxShadow: `${goldScaleTier.glowStyle}, inset 0 2px 10px rgba(255,255,255,0.65), inset 0 -10px 18px rgba(102,68,0,0.45)`,
                      }}
                    >
                      {/* Specular cursor glare */}
                      <div
                        className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                        style={{
                          opacity: tiltPos.active ? 0.65 : 0.28,
                          background: `radial-gradient(circle at ${tiltPos.x}% ${tiltPos.y}%, rgba(255,255,255,0.82) 0%, rgba(255,255,255,0.14) 34%, transparent 66%)`,
                        }}
                      />

                      {/* Inner Chamfered Die Groove */}
                      <div className="pointer-events-none absolute inset-3 rounded-[16px] border border-[#6E4D04]/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.18)]" />

                      {/* Nusantara Micro Motif */}
                      {goldMotif === 'nusantara' && (
                        <div
                          className="pointer-events-none absolute inset-0 opacity-15"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle at 14px 14px, #4A2F00 2px, transparent 2px)',
                            backgroundSize: '28px 28px',
                          }}
                        />
                      )}

                      {/* Top Embossed Fine Gold Assay Stamp */}
                      <div
                        className={`relative z-10 text-center space-y-2 pt-2 ${motifSurface.engraving}`}
                      >
                        <div className="text-[11px] font-bold tracking-[0.28em] uppercase opacity-75">
                          BANK NUSANTARA
                        </div>
                        <div className="leading-none">
                          <div className="text-xl sm:text-2xl font-black tracking-[0.18em]">
                            FINE
                          </div>
                          <div className="text-3xl sm:text-4xl font-black tracking-[0.12em] mt-0.5">
                            GOLD
                          </div>
                        </div>
                        <div className="w-24 h-[2px] mx-auto bg-current opacity-45" />
                        <div className="font-mono tabular-nums text-xl sm:text-2xl font-black tracking-widest">
                          999.9
                        </div>
                      </div>

                      {/* Bottom Embossed Net Weight Stamp */}
                      <div
                        className={`relative z-10 text-center pb-2 ${motifSurface.engraving}`}
                      >
                        <div className="text-[11px] font-bold tracking-[0.25em] uppercase opacity-75">
                          NET WT
                        </div>
                        <div className="font-mono tabular-nums text-2xl sm:text-3xl font-black mt-0.5">
                          {totalGrams > 0 ? `${totalGrams.toFixed(2)} g` : '1000 g'}
                        </div>
                        <div className="text-[10px] font-mono font-bold tracking-widest opacity-70 mt-1">
                          24K · {motifSurface.motifName.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BACK FACE (FLIPPED 180°) */}
                  <div
                    className={`absolute inset-0 rounded-[22px] border-2 ${motifSurface.border} overflow-hidden flex flex-col justify-between p-6`}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: motifSurface.gradient,
                      boxShadow: goldScaleTier.glowStyle,
                    }}
                  >
                    <div className={`flex items-center justify-between ${motifSurface.engraving}`}>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider">
                        ASSAY SEAL · 999.9
                      </span>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className={`space-y-3 text-xs ${motifSurface.engraving}`}>
                      <div className="border-y border-current/25 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-widest opacity-75">
                          Nomor Seri Bullion
                        </div>
                        <div className="font-mono font-black text-base mt-0.5">{serialNumber}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="text-[10px] opacity-75">Batch Aktif</div>
                          <div className="font-mono font-bold">{batches.length} Batch</div>
                        </div>
                        <div>
                          <div className="text-[10px] opacity-75">Tgl 1 (+/Bln)</div>
                          <div className="font-mono font-bold">+{monthlyGrowthPct}%</div>
                        </div>
                      </div>
                    </div>
                    <div className={`text-[11px] text-center font-semibold opacity-85 ${motifSurface.engraving}`}>
                      Logam Mulia Tunggal 24K Terverifikasi PT Bank Nusantara Tbk.
                    </div>
                  </div>
                </div>
              ) : (
                /* EMAS PERHIASAN (HANYA 1 BIJI — FOTO CERTICARD FINE GOLD 999.9 ASLI) */
                <div
                  className="relative w-60 sm:w-64 h-80 sm:h-[360px] transition-transform duration-500"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `rotateY(${isFlippedBack ? 180 : 0}deg) ${
                      tiltPos.active && !isFlippedBack
                        ? `rotateX(${(50 - tiltPos.y) * 0.14}deg) rotateY(${(tiltPos.x - 50) * 0.16}deg)`
                        : ''
                    }`,
                  }}
                >
                  {/* FRONT FACE: Attached CertiCard Fine Gold 999.9 Photo (Sleek, Single Unit, Unobstructed Stamps) */}
                  <div
                    className={`absolute inset-0 rounded-2xl border-2 ${motifSurface.border} ${motifSurface.frameAccent} overflow-hidden p-2 flex flex-col items-center justify-center`}
                    style={{
                      backfaceVisibility: 'hidden',
                      boxShadow: goldScaleTier.glowStyle,
                    }}
                  >
                    {!certiImgError ? (
                      <img
                        src="/assets/aistudio/Screenshot-2026-09-14-090239-2622848781_29080416.webp"
                        alt="Emas Perhiasan CertiCard Fine Gold 999.9"
                        referrerPolicy="no-referrer"
                        onError={() => setCertiImgError(true)}
                        className="w-full h-full object-cover rounded-xl select-none"
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded-xl flex flex-col items-center justify-center p-5 text-center"
                        style={{ background: motifSurface.gradient }}
                      >
                        <div className={`space-y-1.5 ${motifSurface.engraving}`}>
                          <div className="text-xs font-bold tracking-widest uppercase">
                            LOGAM MULIA
                          </div>
                          <div className="text-2xl font-black">FINE GOLD</div>
                          <div className="font-mono text-xl font-black">999.9</div>
                          <div className="font-mono text-xs font-bold">{serialNumber}</div>
                        </div>
                      </div>
                    )}

                    {/* Specular cursor sheen overlay over CertiCard blister */}
                    <div
                      className="pointer-events-none absolute inset-0 transition-opacity duration-200"
                      style={{
                        opacity: tiltPos.active ? 0.42 : 0.14,
                        background: `radial-gradient(circle at ${tiltPos.x}% ${tiltPos.y}%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.08) 34%, transparent 64%)`,
                      }}
                    />
                  </div>

                  {/* BACK FACE (FLIPPED 180° — Seri & Assay Perhiasan CertiCard) */}
                  <div
                    className={`absolute inset-0 rounded-2xl border-2 ${motifSurface.border} overflow-hidden flex flex-col justify-between p-6`}
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                      background: motifSurface.gradient,
                      boxShadow: goldScaleTier.glowStyle,
                    }}
                  >
                    <div className={`flex items-center justify-between ${motifSurface.engraving}`}>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider">
                        CERTICARD ASSAY · 999.9
                      </span>
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className={`space-y-3 text-xs ${motifSurface.engraving}`}>
                      <div className="border-y border-current/25 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-widest opacity-75">
                          Serial Sertifikat Perhiasan
                        </div>
                        <div className="font-mono font-black text-base mt-0.5">{serialNumber}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="text-[10px] opacity-75">Batch Aktif</div>
                          <div className="font-mono font-bold">{batches.length} Batch</div>
                        </div>
                        <div>
                          <div className="text-[10px] opacity-75">Tgl 1 (+/Bln)</div>
                          <div className="font-mono font-bold">+{monthlyGrowthPct}%</div>
                        </div>
                      </div>
                    </div>
                    <div className={`text-[11px] text-center font-semibold opacity-85 ${motifSurface.engraving}`}>
                      Sertifikasi Keaslian Fine Gold 24K · PT Bank Nusantara Tbk.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* NON-OVERLAPPING BOTTOM DYNAMIC OWNERSHIP & WEALTH BAR (Stays clear of Fine Gold 999.9 stamp) */}
            <div className="w-full rounded-2xl bg-[#11151E] border border-amber-500/30 px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400">
                  Pemilik Sah · {motifSurface.motifName} ·{' '}
                  <span className="font-mono text-amber-300/90">{serialNumber}</span>
                </div>
                <div className="text-sm sm:text-base font-extrabold text-white uppercase tracking-wide truncate">
                  {currentAccount.fullName}
                </div>
              </div>
              <div className="text-right font-mono tabular-nums">
                <div className="text-base sm:text-lg font-black text-amber-300">
                  {formatRupiah(currentMarketValueRp)}
                </div>
                <div className="text-xs font-semibold text-emerald-300">
                  {totalGrams.toFixed(4)} Gram · 24K Fine Gold
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Controls Below Gold Display: Motif & Flip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 mr-1">Motif:</span>
              {(
                [
                  { id: 'klasik', label: 'Klasik' },
                  { id: 'nusantara', label: 'Nusantara' },
                  { id: 'royal_platinum', label: 'Royal Platinum' },
                ] as { id: GoldMotifType; label: string }[]
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectMotif(m.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                    goldMotif === m.id
                      ? 'bg-amber-400/20 border border-amber-400 text-amber-200'
                      : 'bg-[#11151E] border border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsFlippedBack(!isFlippedBack)}
              className="px-3.5 py-2 rounded-xl bg-[#11151E] hover:bg-slate-800 border border-amber-500/40 text-amber-200 font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlippedBack ? 'Lihat Tampak Depan' : 'Putar Tampak Belakang'}</span>
            </button>
          </div>
        </div>

        {/* Right: Digital 24K 999.9 Certificate Adjacent to Gold Visual */}
        <div className="lg:col-span-5 rounded-3xl bg-[#090B10] border border-amber-500/25 p-5 sm:p-7 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Sertifikat Digital 24K · 999.9</h3>
                  <p className="text-[11px] text-slate-400">Otentikasi Logam Mulia Bank Nusantara</p>
                </div>
              </div>
              <span className="font-mono text-xs text-emerald-400 font-semibold">TERVERIFIKASI</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Nomor Sertifikat</span>
                <span className="font-mono tabular-nums text-amber-200 font-semibold">
                  {serialNumber}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Bentuk Fisik Pilihan</span>
                <span className="text-white font-semibold">
                  {isBatangan ? 'Emas Batangan (Persegi Panjang Tebal)' : 'Emas Perhiasan (Persegi Panjang Tipis)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Kemurnian Kadar</span>
                <span className="font-mono text-amber-300 font-semibold">24 Karat (999.9‰ Fine Gold)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Aturan Jual Hari Sama</span>
                <span className="font-mono text-amber-300">
                  Turun -{sameDayPenaltyPct}% dari Nilai Beli
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/70">
                <span className="text-slate-400">Apresiasi Setiap Tanggal 1</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  +{monthlyGrowthPct}% per Bulan (Real-Time)
                </span>
              </div>
            </div>
          </div>

          {/* Gold Savings Target Progress Bar */}
          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Target className="w-4 h-4 text-amber-400" />
                <span>Target Tabungan Emas</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingTarget(!editingTarget)}
                className="text-xs text-amber-300 hover:underline cursor-pointer"
              >
                {editingTarget ? 'Tutup' : 'Ubah Target'}
              </button>
            </div>

            {editingTarget && (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1000}
                    value={targetDraft}
                    onChange={(e) => setTargetDraft(e.target.value)}
                    className="flex-1 bg-[#090B10] border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={handleSaveTarget}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                  >
                    Simpan
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[20_000_000, 50_000_000, 100_000_000].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setTargetDraft(String(t));
                        updateCustomerGoldPreferences({ targetRupiah: t });
                        setEditingTarget(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-200 cursor-pointer"
                    >
                      {formatRupiah(t)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono tabular-nums">
                <span className="text-amber-300 font-bold">{formatRupiah(currentMarketValueRp)}</span>
                <span className="text-slate-400">Target: {formatRupiah(savingsTargetRp)}</span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-500"
                  style={{ width: `${targetProgressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 font-mono tabular-nums">
                <span>Tercapai {targetProgressPct}%</span>
                <span>
                  {currentMarketValueRp >= savingsTargetRp
                    ? 'Target Tercapai'
                    : `Kurang ${formatRupiah(savingsTargetRp - currentMarketValueRp)}`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: BUY & SELL CALCULATOR (LEFT) + REAL-TIME CHART (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Buy & Sell Gold Panel */}
        <div className="lg:col-span-6 rounded-3xl bg-[#090B10] border border-amber-500/25 p-5 sm:p-7 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-400" />
              <span>Beli &amp; Jual Emas 24K</span>
            </h3>
            <div className="flex items-center gap-1 p-1 bg-[#11151E] border border-slate-800 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => {
                  setTradeMode('buy');
                  setTradeFeedback(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                  tradeMode === 'buy'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Beli Emas
              </button>
              <button
                type="button"
                onClick={() => {
                  setTradeMode('sell');
                  setTradeFeedback(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg font-bold cursor-pointer ${
                  tradeMode === 'sell'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Jual Emas
              </button>
            </div>
          </div>

          {tradeFeedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                tradeFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{tradeFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleExecuteTrade} className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-300 font-semibold">
                  {tradeMode === 'buy'
                    ? 'Nominal Pembelian (Rp 1.000 s/d Tak Terbatas):'
                    : 'Nominal Penjualan (Rp 1.000 s/d Nilai Emas Anda):'}
                </label>
                <span className="font-mono tabular-nums text-amber-300">
                  {tradeMode === 'buy'
                    ? `≈ ${estimatedBuyGrams.toFixed(4)} gram`
                    : `≈ ${sellSimulation.grams.toFixed(4)} gram`}
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-mono">Rp</span>
                <input
                  type="number"
                  min={minNominal}
                  value={nominalInput}
                  onChange={(e) => setNominalInput(e.target.value)}
                  placeholder="20000000"
                  className="w-full bg-[#11151E] border border-slate-700 text-white rounded-xl py-3 pl-10 pr-4 font-mono tabular-nums text-base font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Preset Amounts */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[100_000, 1_000_000, 20_000_000, 50_000_000, 100_000_000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNominalInput(String(amt))}
                    className="px-2.5 py-1.5 rounded-lg bg-[#11151E] hover:bg-slate-800 border border-slate-800 text-slate-200 font-mono text-[11px] cursor-pointer"
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {/* Balance Percentage Sync Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-slate-800/70">
                <span className="text-[11px] text-slate-400 flex items-center gap-1 mr-1">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sesuaikan {tradeMode === 'buy' ? 'Uang Rekening' : 'Saldo Emas'}:</span>
                </span>
                {[25, 50, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyBalancePercent(pct)}
                    className="px-2.5 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 text-amber-200 font-mono font-semibold text-[11px] cursor-pointer"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Transparent Calculation Breakdown Box */}
            <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4 space-y-2">
              {tradeMode === 'buy' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bentuk &amp; Motif Dipilih</span>
                    <span className="text-white font-semibold">
                      {isBatangan ? 'Emas Batangan' : 'Emas Perhiasan'} · {motifSurface.motifName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimasi Emas Didapat</span>
                    <span className="font-mono tabular-nums text-amber-300 font-bold">
                      {estimatedBuyGrams.toFixed(4)} gram
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jika Dijual Hari Ini Juga</span>
                    <span className="font-mono tabular-nums text-rose-300">
                      {formatRupiah(Math.round(parsedNominal * (1 - sameDayPenaltyPct / 100)))} (-
                      {sameDayPenaltyPct}%)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Proyeksi Tgl 1 Bulan Depan (+{monthlyGrowthPct}%)</span>
                    <span className="font-mono tabular-nums text-emerald-300 font-semibold">
                      {formatRupiah(Math.round(parsedNominal * (1 + monthlyGrowthPct / 100)))}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nilai Pasar Kotor</span>
                    <span className="font-mono tabular-nums text-white">
                      {formatRupiah(sellSimulation.gross)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      Penyesuaian Jual Hari Sama (-{sameDayPenaltyPct}%)
                    </span>
                    <span className="font-mono tabular-nums text-rose-300">
                      -{formatRupiah(sellSimulation.penalty)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-200 font-semibold">Dana Bersih Masuk Rekening</span>
                    <span className="font-mono tabular-nums text-emerald-300 font-bold text-sm">
                      {formatRupiah(sellSimulation.proceeds)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm cursor-pointer transition-colors ${
                  tradeMode === 'buy'
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                }`}
              >
                {tradeMode === 'buy'
                  ? `Beli Emas (${formatRupiah(parsedNominal)})`
                  : `Jual Emas (${formatRupiah(sellSimulation.proceeds)})`}
              </button>
              {tradeMode === 'sell' && totalGrams > 0.000001 && (
                <button
                  type="button"
                  onClick={handleSellAll}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-semibold text-xs cursor-pointer"
                >
                  Jual Semua
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Interactive Gold Price Trend SVG Chart */}
        <div className="lg:col-span-6 rounded-3xl bg-[#090B10] border border-amber-500/25 p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-amber-400" />
                <span>Grafik Harga Emas (+{monthlyGrowthPct}% Setiap Tanggal 1)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Riwayat kenaikan bulanan real-time &amp; proyeksi tanggal 1 berikutnya
              </p>
            </div>
            <span className="font-mono tabular-nums text-xs text-emerald-400 font-bold">
              +{monthlyGrowthPct}% / Bln
            </span>
          </div>

          {chartSeries && (
            <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-3">
              <svg
                viewBox={`0 0 ${chartSeries.width} ${chartSeries.height}`}
                className="w-full h-44 overflow-visible"
              >
                <defs>
                  <linearGradient id="goldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.38" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path d={chartSeries.areaPath} fill="url(#goldAreaGrad)" />
                <path
                  d={chartSeries.linePath}
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {chartSeries.coords.map((pt, idx) => (
                  <g key={idx}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.projected ? 5 : 3.5}
                      fill={pt.projected ? '#34D399' : '#FBBF24'}
                      stroke="#090B10"
                      strokeWidth="1.5"
                    />
                    <text
                      x={pt.x}
                      y={pt.y - 10}
                      textAnchor="middle"
                      fill={pt.projected ? '#6EE7B7' : '#FDE68A'}
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {(pt.price / 1_000_000).toFixed(2)}jt
                    </text>
                    <text
                      x={pt.x}
                      y={chartSeries.height - 3}
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="8.5"
                    >
                      {pt.label.split(' ')[0]}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          )}

          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-3.5 flex items-start gap-2.5 text-xs text-slate-300">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Setiap pembelian dicatat sebagai batch terpisah. Emas yang dijual pada hari pembelian yang sama dikenakan penyesuaian{' '}
              <strong className="text-rose-300">-{sameDayPenaltyPct}%</strong>, sedangkan emas yang disimpan melewati tanggal 1 bulan baru otomatis menikmati kenaikan{' '}
              <strong className="text-emerald-300">+{monthlyGrowthPct}% per bulan</strong> ({formatRupiah(chartSeries?.projectedNextPrice || activePricePerGram)}/gram bulan depan).
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 4: FIFO PURCHASE BATCH PORTFOLIO TABLE */}
      <div className="rounded-3xl bg-[#090B10] border border-amber-500/25 p-5 sm:p-7 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">
              Portofolio Batch Pembelian Emas (Pelacakan Tanggal Beli &amp; Profit)
            </h3>
            <p className="text-xs text-slate-400">
              Setiap transaksi pembelian dilacak umurnya secara individual untuk membedakan jual hari yang sama vs lintas bulan.
            </p>
          </div>
          <span className="font-mono tabular-nums text-xs text-amber-300">
            {batches.length} Batch Aktif · Total {totalGrams.toFixed(4)} g
          </span>
        </div>

        {batches.length === 0 ? (
          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-8 text-center space-y-2">
            <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Belum Ada Koleksi Batch Emas</p>
            <p className="text-xs text-slate-400">
              Mulai beli Emas Batangan atau Perhiasan mulai Rp 1.000 melalui formulir di atas untuk melihat rincian portofolio Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Tanggal Beli</th>
                  <th className="py-2.5 px-3 font-semibold">Bentuk</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Berat</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Modal Beli</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Cair Jual Kini</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Profit / Rugi</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {batches.map((b) => {
                  const isSameDay = b.purchaseDateKey === todayKey;
                  const marketVal = b.grams * activePricePerGram;
                  const netSell = Math.round(
                    isSameDay ? marketVal * (1 - sameDayPenaltyPct / 100) : marketVal
                  );
                  const diffRp = netSell - b.costRupiah;
                  const diffPct = b.costRupiah > 0 ? (diffRp / b.costRupiah) * 100 : 0;
                  const ageDays = Math.max(
                    0,
                    Math.floor((nowTick.getTime() - new Date(b.purchasedAt).getTime()) / 86400_000)
                  );
                  return (
                    <tr key={b.id} className="hover:bg-[#11151E] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">
                          {formatDateShortIndo(b.purchasedAt)}
                        </div>
                        <div
                          className={`text-[11px] ${
                            isSameDay ? 'text-amber-300' : 'text-emerald-400'
                          }`}
                        >
                          {isSameDay
                            ? `Hari Ini (Penyesuaian -${sameDayPenaltyPct}%)`
                            : `Umur ${ageDays} Hari (Bebas Penalti)`}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-200">
                        {b.goldForm === 'batangan' ? 'Batangan' : 'Perhiasan'} · {b.motif}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-amber-200">
                        {b.grams.toFixed(4)} g
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                        {formatRupiah(b.costRupiah)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-white font-semibold">
                        {formatRupiah(netSell)}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono tabular-nums font-bold ${
                          diffRp >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {diffRp >= 0 ? '+' : ''}
                        {formatRupiah(diffRp)} ({diffPct >= 0 ? '+' : ''}
                        {diffPct.toFixed(2)}%)
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleSellSpecificBatch(b.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 font-semibold cursor-pointer transition-colors"
                        >
                          Jual Batch
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
