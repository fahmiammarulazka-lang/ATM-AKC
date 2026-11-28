/**
 * Modal Interaktif Layar Penuh — Sistem 5 Tahap Kerja (Seluruh 25 Lowongan Pekerjaan)
 * 1) Benerin Kabel (4 pasang kabel warna)
 * 2) Tap-Tap Sesuai Ketentuan (target klik lowongan)
 * 3) Verifikasi Kode Keamanan OTP & Angka Kliring Bank
 * 4) Kalibrasi Slider Frekuensi Server & Sinkronisasi Brankas
 * 5) Menahan Tombol Sidik Jari Biometrik hingga 100%
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  CheckCircle2,
  Zap,
  Cable,
  MousePointerClick,
  ShieldCheck,
  SlidersHorizontal,
  Fingerprint,
  AlertTriangle,
  Banknote,
  Coins,
  Sparkles,
  Ticket,
  Crown,
  Delete,
  RotateCcw,
} from 'lucide-react';
import { JobVacancyItem } from '../types/bank';
import { formatRupiah } from '../utils/bankUtils';
import {
  JOB_FIVE_STAGE_CATALOG,
  JobFiveStageAdminConfig,
  JobStageId,
  getEnabledStageList,
  saveJobStageProgress,
} from '../utils/jobFiveStageUtils';

interface CableColorSpec {
  id: 'red' | 'blue' | 'yellow' | 'green';
  label: string;
  hex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  ringClass: string;
}

const CABLE_COLORS: CableColorSpec[] = [
  {
    id: 'red',
    label: 'Merah',
    hex: '#f43f5e',
    bgClass: 'bg-rose-500',
    borderClass: 'border-rose-400',
    textClass: 'text-rose-200',
    ringClass: 'ring-rose-400/60',
  },
  {
    id: 'blue',
    label: 'Biru',
    hex: '#38bdf8',
    bgClass: 'bg-sky-400',
    borderClass: 'border-sky-300',
    textClass: 'text-sky-200',
    ringClass: 'ring-sky-400/60',
  },
  {
    id: 'yellow',
    label: 'Kuning',
    hex: '#facc15',
    bgClass: 'bg-amber-400',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-200',
    ringClass: 'ring-amber-400/60',
  },
  {
    id: 'green',
    label: 'Hijau',
    hex: '#34d399',
    bgClass: 'bg-emerald-400',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-200',
    ringClass: 'ring-emerald-400/60',
  },
];

const BANK_CLEARING_CODES = [
  { code: '014', label: '014 · Nusantara Utama' },
  { code: '008', label: '008 · Kliring Sentral' },
  { code: '002', label: '002 · Brankas Nasional' },
  { code: '009', label: '009 · Giro Prioritas' },
];

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface JobFiveStageModalProps {
  job: JobVacancyItem;
  accountId: string;
  config: JobFiveStageAdminConfig;
  initialCompletedStages: JobStageId[];
  initialStage2Clicks: number;
  effectiveTargetClicks: number;
  clickPower: number;
  baseSalary: number;
  baseCoins: number;
  isAdminCard: boolean;
  userVouchers: number;
  isVoucherInfinity: boolean;
  onClose: () => void;
  onStageProgressSaved: (completedStages: JobStageId[], stage2Clicks?: number) => void;
  onCompleteJob: (options: {
    instantMode: boolean;
    useVoucher: boolean;
    completedStagesCount: number;
  }) => {
    success: boolean;
    paidAmount?: number;
    extraSalaryBonus?: number;
    coinsEarned?: number;
    extraCoinBonus?: number;
    extraXpEarned?: number;
    message: string;
  };
}

export const JobFiveStageModal: React.FC<JobFiveStageModalProps> = ({
  job,
  accountId,
  config,
  initialCompletedStages,
  initialStage2Clicks,
  effectiveTargetClicks,
  clickPower,
  baseSalary,
  baseCoins,
  isAdminCard,
  userVouchers,
  isVoucherInfinity,
  onClose,
  onStageProgressSaved,
  onCompleteJob,
}) => {
  const enabledStages = useMemo(() => getEnabledStageList(config), [config]);

  const [completedStages, setCompletedStages] = useState<JobStageId[]>(() =>
    initialCompletedStages.filter((id) => enabledStages.includes(id))
  );

  const [activeStage, setActiveStage] = useState<JobStageId>(() => {
    const nextPending = enabledStages.find((s) => !initialCompletedStages.includes(s));
    return nextPending || enabledStages[enabledStages.length - 1];
  });

  const [warningNotice, setWarningNotice] = useState<{ text: string; nonce: number } | null>(null);
  const [completionSummary, setCompletionSummary] = useState<{
    paidAmount: number;
    extraSalaryBonus: number;
    coinsEarned: number;
    extraCoinBonus: number;
    extraXpEarned: number;
    message: string;
    wasInstant: boolean;
  } | null>(null);

  // Tahap 1: Benerin Kabel
  const [rightPortsOrder] = useState<CableColorSpec[]>(() => {
    const shuffled = shuffleArray(CABLE_COLORS);
    // Pastikan urutan kanan tidak identik 100% dengan kiri agar tetap menantang
    if (shuffled.every((c, idx) => c.id === CABLE_COLORS[idx].id)) {
      return [shuffled[1], shuffled[2], shuffled[3], shuffled[0]];
    }
    return shuffled;
  });
  const [selectedLeftCable, setSelectedLeftCable] = useState<CableColorSpec['id'] | null>(null);
  const [connectedCables, setConnectedCables] = useState<CableColorSpec['id'][]>([]);

  // Tahap 2: Tap-Tap Sesuai Ketentuan
  const [stage2Clicks, setStage2Clicks] = useState<number>(() =>
    Math.min(effectiveTargetClicks, Math.max(0, initialStage2Clicks))
  );
  const [tapPulseNonce, setTapPulseNonce] = useState<number>(0);

  // Tahap 3: Verifikasi OTP & Angka Kliring Bank
  const [targetClearing] = useState(() => {
    return BANK_CLEARING_CODES[Math.floor(Math.random() * BANK_CLEARING_CODES.length)];
  });
  const [targetOtp] = useState(() =>
    Array.from({ length: 4 }, () => Math.floor(Math.random() * 10)).join('')
  );
  const [selectedClearingCode, setSelectedClearingCode] = useState<string>('');
  const [enteredOtp, setEnteredOtp] = useState<string>('');

  // Tahap 4: Kalibrasi Slider Frekuensi Server & Sinkronisasi Brankas
  const [freqTarget] = useState(() => {
    const min = 22 + Math.floor(Math.random() * 52); // 22..73
    return { min, max: min + 14 };
  });
  const [vaultTarget] = useState(() => {
    const min = 20 + Math.floor(Math.random() * 56); // 20..75
    return { min, max: min + 14 };
  });
  const [freqValue, setFreqValue] = useState<number>(12);
  const [vaultValue, setVaultValue] = useState<number>(88);

  // Tahap 5: Sidik Jari Biometrik 100%
  const [bioPercent, setBioPercent] = useState<number>(0);
  const [isHoldingBio, setIsHoldingBio] = useState<boolean>(false);
  const bioHoldRafRef = useRef<number | null>(null);
  const bioLastTimeRef = useRef<number>(0);
  const bioCompletedRef = useRef<boolean>(false);

  const extraSalaryPreview = Math.round(
    (baseSalary * Math.max(0, config.extraSalaryBonusPercent)) / 100
  );
  const totalSalaryPreview = baseSalary + extraSalaryPreview;
  const totalCoinsPreview = baseCoins + Math.max(0, config.extraCoinBonus);
  const totalXpPreview = Math.max(0, config.extraAccountXpBonus);

  const triggerMildWarning = useCallback((text: string) => {
    setWarningNotice({ text, nonce: Date.now() });
  }, []);

  useEffect(() => {
    if (!warningNotice) return;
    const t = window.setTimeout(() => setWarningNotice(null), 2600);
    return () => window.clearTimeout(t);
  }, [warningNotice]);

  // Finalize entire job payout
  const finalizeJobPayout = useCallback(
    (instantMode: boolean, useVoucher: boolean, completedCount: number) => {
      const res = onCompleteJob({
        instantMode,
        useVoucher,
        completedStagesCount: completedCount,
      });
      if (!res.success) {
        triggerMildWarning(res.message);
        return;
      }
      setCompletionSummary({
        paidAmount: res.paidAmount ?? totalSalaryPreview,
        extraSalaryBonus: res.extraSalaryBonus ?? extraSalaryPreview,
        coinsEarned: res.coinsEarned ?? totalCoinsPreview,
        extraCoinBonus: res.extraCoinBonus ?? config.extraCoinBonus,
        extraXpEarned: res.extraXpEarned ?? totalXpPreview,
        message: res.message,
        wasInstant: instantMode,
      });
    },
    [
      config.extraCoinBonus,
      extraSalaryPreview,
      onCompleteJob,
      totalCoinsPreview,
      totalSalaryPreview,
      totalXpPreview,
      triggerMildWarning,
    ]
  );

  // Mark one stage completed, persist auto-save, and move to next enabled stage (or finalize)
  const completeCurrentStage = useCallback(
    (stageId: JobStageId, nextStage2Clicks?: number) => {
      const nextCompleted = Array.from(new Set([...completedStages, stageId])).sort(
        (a, b) => a - b
      ) as JobStageId[];
      setCompletedStages(nextCompleted);
      const savedClicks = typeof nextStage2Clicks === 'number' ? nextStage2Clicks : stage2Clicks;
      saveJobStageProgress(accountId, job.id, nextCompleted, savedClicks);
      onStageProgressSaved(nextCompleted, savedClicks);
      setWarningNotice(null);

      const nextPending = enabledStages.find((s) => !nextCompleted.includes(s));
      if (nextPending) {
        setActiveStage(nextPending);
      } else {
        finalizeJobPayout(false, false, enabledStages.length);
      }
    },
    [
      accountId,
      completedStages,
      enabledStages,
      finalizeJobPayout,
      job.id,
      onStageProgressSaved,
      stage2Clicks,
    ]
  );

  // Tahap 1 Handlers
  const handleSelectLeftCable = (colorId: CableColorSpec['id']) => {
    if (connectedCables.includes(colorId)) return;
    setSelectedLeftCable(colorId);
  };

  const handleSelectRightPort = (rightColorId: CableColorSpec['id']) => {
    if (connectedCables.includes(rightColorId)) return;
    if (!selectedLeftCable) {
      triggerMildWarning('Pilih dulu 1 ujung kabel warna di sisi kiri!');
      return;
    }
    if (selectedLeftCable === rightColorId) {
      const nextConnected = [...connectedCables, rightColorId];
      setConnectedCables(nextConnected);
      setSelectedLeftCable(null);
      setWarningNotice(null);
      if (nextConnected.length === CABLE_COLORS.length) {
        window.setTimeout(() => {
          completeCurrentStage(1);
        }, 320);
      }
    } else {
      triggerMildWarning(
        'Warna kabel tidak cocok dengan port tujuan! Coba hubungkan ke warna yang sama.'
      );
      setSelectedLeftCable(null);
    }
  };

  // Tahap 2 Handler
  const handleStage2Tap = () => {
    if (completionSummary) return;
    const nextClicks = Math.min(effectiveTargetClicks, stage2Clicks + clickPower);
    setStage2Clicks(nextClicks);
    setTapPulseNonce((n) => n + 1);
    if (nextClicks >= effectiveTargetClicks) {
      completeCurrentStage(2, nextClicks);
    } else if (nextClicks % Math.max(1, Math.min(5, clickPower * 2)) === 0) {
      saveJobStageProgress(accountId, job.id, completedStages, nextClicks);
      onStageProgressSaved(completedStages, nextClicks);
    }
  };

  // Save Stage 2 progress when closing modal early
  const handleCloseWithAutoSave = () => {
    if (!completionSummary) {
      saveJobStageProgress(accountId, job.id, completedStages, stage2Clicks);
      onStageProgressSaved(completedStages, stage2Clicks);
    }
    onClose();
  };

  // Tahap 3 Handlers
  const handleOtpDigitPress = (digit: string) => {
    if (enteredOtp.length >= 4) return;
    setEnteredOtp((prev) => prev + digit);
  };

  const handleVerifyStage3 = () => {
    if (!selectedClearingCode) {
      triggerMildWarning('Pilih Kode Kliring Bank yang sesuai terlebih dahulu.');
      return;
    }
    if (selectedClearingCode !== targetClearing.code) {
      triggerMildWarning(
        `Kode kliring belum cocok (pilih ${targetClearing.code}). Coba lagi tanpa mengulang!`
      );
      return;
    }
    if (enteredOtp.length < 4) {
      triggerMildWarning('Masukkan 4 digit Kode OTP Keamanan secara lengkap.');
      return;
    }
    if (enteredOtp !== targetOtp) {
      triggerMildWarning('Kode OTP 4 digit belum sesuai. Silakan periksa dan coba lagi!');
      setEnteredOtp('');
      return;
    }
    completeCurrentStage(3);
  };

  // Keyboard shortcut for Stage 3 OTP entry
  useEffect(() => {
    if (activeStage !== 3 || completionSummary) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        setEnteredOtp((prev) => (prev.length < 4 ? prev + e.key : prev));
      } else if (e.key === 'Backspace') {
        setEnteredOtp((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        handleVerifyStage3();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStage, completionSummary, selectedClearingCode, enteredOtp]);

  // Tahap 4 Handler
  const isFreqLocked = freqValue >= freqTarget.min && freqValue <= freqTarget.max;
  const isVaultLocked = vaultValue >= vaultTarget.min && vaultValue <= vaultTarget.max;

  const handleVerifyStage4 = () => {
    if (!isFreqLocked && !isVaultLocked) {
      triggerMildWarning(
        'Kedua slider belum berada di zona hijau target. Geser perlahan hingga menyala hijau!'
      );
      return;
    }
    if (!isFreqLocked) {
      triggerMildWarning(
        `Frekuensi Server harus berada di rentang ${freqTarget.min}–${freqTarget.max} MHz.`
      );
      return;
    }
    if (!isVaultLocked) {
      triggerMildWarning(
        `Sinkronisasi Brankas harus berada di rentang ${vaultTarget.min}–${vaultTarget.max}%.`
      );
      return;
    }
    completeCurrentStage(4);
  };

  // Tahap 5: Press & Hold Biometric Fingerprint
  useEffect(() => {
    if (!isHoldingBio || activeStage !== 5 || completionSummary || bioCompletedRef.current) {
      if (bioHoldRafRef.current !== null) {
        window.cancelAnimationFrame(bioHoldRafRef.current);
        bioHoldRafRef.current = null;
      }
      return;
    }
    bioLastTimeRef.current = performance.now();

    const step = (now: number) => {
      const dt = Math.min(80, Math.max(0, now - bioLastTimeRef.current));
      bioLastTimeRef.current = now;
      setBioPercent((prev) => {
        const next = Math.min(100, prev + (dt / 1550) * 100);
        if (next >= 100 && !bioCompletedRef.current) {
          bioCompletedRef.current = true;
          setIsHoldingBio(false);
          window.setTimeout(() => {
            completeCurrentStage(5);
          }, 120);
        }
        return next;
      });
      if (!bioCompletedRef.current) {
        bioHoldRafRef.current = window.requestAnimationFrame(step);
      }
    };

    bioHoldRafRef.current = window.requestAnimationFrame(step);
    return () => {
      if (bioHoldRafRef.current !== null) {
        window.cancelAnimationFrame(bioHoldRafRef.current);
        bioHoldRafRef.current = null;
      }
    };
  }, [activeStage, completeCurrentStage, completionSummary, isHoldingBio]);

  const handleBioRelease = () => {
    setIsHoldingBio(false);
    if (!bioCompletedRef.current && bioPercent > 3 && bioPercent < 100) {
      triggerMildWarning(
        'Tahan tombol sidik jari biometrik terus hingga mencapai 100% penuh!'
      );
    }
  };

  const canInstantFinish = isAdminCard || isVoucherInfinity || userVouchers >= 1;

  const handleInstantFinishClick = () => {
    if (completionSummary) return;
    if (!canInstantFinish) {
      triggerMildWarning(
        'Butuh Kartu Tier Admin atau minimal 1 Voucher Level untuk Selesai Instan 1-Klik.'
      );
      return;
    }
    finalizeJobPayout(true, !isAdminCard && !isVoucherInfinity, enabledStages.length);
  };

  const activeStageMeta =
    JOB_FIVE_STAGE_CATALOG.find((s) => s.id === activeStage) || JOB_FIVE_STAGE_CATALOG[0];

  const stage2Pct = Math.min(100, Math.round((stage2Clicks / Math.max(1, effectiveTargetClicks)) * 100));
  const bioCircumference = 2 * Math.PI * 62;
  const bioStrokeOffset = bioCircumference - (bioPercent / 100) * bioCircumference;

  return (
    <div className="fixed inset-0 z-[95] bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden">
      {/* Top Bar */}
      <div className="shrink-0 border-b border-slate-800 bg-slate-900/95 px-4 sm:px-6 py-3.5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                SISTEM {enabledStages.length} TAHAP KERJA
              </span>
              <span className="text-[11px] font-mono text-amber-300 font-bold">
                {job.department}
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-white truncate mt-0.5">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!completionSummary && (
              <button
                type="button"
                onClick={handleInstantFinishClick}
                disabled={!canInstantFinish}
                className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap ${
                  isAdminCard
                    ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                    : canInstantFinish
                    ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                }`}
              >
                {isAdminCard ? (
                  <>
                    <Crown className="w-3.5 h-3.5 shrink-0" />
                    <span>Selesai Instan 1-Klik (Admin Gratis)</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Selesai Instan (1 Voucher · Sisa{' '}
                      {isVoucherInfinity ? '∞' : userVouchers})
                    </span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCloseWithAutoSave}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">
                {completionSummary ? 'Tutup' : 'Simpan & Keluar'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
        <div className="max-w-4xl mx-auto space-y-5">
          {/* Payout Preview Bar (Base + 5-Stage Extra Bonus) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-300 block">
                  Total Gaji Cair (+{config.extraSalaryBonusPercent}%)
                </span>
                <span className="text-sm sm:text-base font-black font-mono tabular-nums text-emerald-400">
                  {formatRupiah(totalSalaryPreview)}
                </span>
              </div>
              <Banknote className="w-5 h-5 text-emerald-400 shrink-0" />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-amber-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-300 block">
                  Total Coin (+{config.extraCoinBonus} Ekstra)
                </span>
                <span className="text-sm sm:text-base font-black font-mono tabular-nums text-amber-300">
                  +{totalCoinsPreview.toLocaleString('id-ID')} Coin
                </span>
              </div>
              <Coins className="w-5 h-5 text-amber-400 shrink-0" />
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-cyan-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-cyan-300 block">
                  Bonus XP Level Akun
                </span>
                <span className="text-sm sm:text-base font-black font-mono tabular-nums text-cyan-300">
                  +{totalXpPreview.toLocaleString('id-ID')} XP
                </span>
              </div>
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
            </div>
          </div>

          {/* 5-Stage Progress Stepper */}
          <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
              {JOB_FIVE_STAGE_CATALOG.map((stage) => {
                const isEnabled = enabledStages.includes(stage.id);
                const isDone =
                  Boolean(completionSummary) ||
                  completedStages.includes(stage.id) ||
                  !isEnabled;
                const isCurrent = !completionSummary && activeStage === stage.id && isEnabled;

                return (
                  <div
                    key={stage.id}
                    className={`p-2 sm:p-2.5 rounded-xl border text-center transition ${
                      !isEnabled
                        ? 'bg-slate-950/40 border-slate-800/60 opacity-45'
                        : isDone
                        ? 'bg-emerald-950/60 border-emerald-400/70 text-emerald-200'
                        : isCurrent
                        ? 'bg-amber-400/15 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/90 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1">
                      {isDone && isEnabled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <span
                          className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center ${
                            isCurrent
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {stage.id}
                        </span>
                      )}
                      <span className="text-[10px] sm:text-xs font-black truncate">
                        {stage.shortLabel}
                      </span>
                    </div>
                    <span className="text-[9px] block mt-0.5 text-slate-400">
                      {!isEnabled ? 'Lewati' : isDone ? 'Selesai' : isCurrent ? 'Aktif' : 'Menunggu'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mild Warning Banner (No Reset) */}
          {warningNotice && (
            <div
              key={warningNotice.nonce}
              className="p-3.5 rounded-2xl bg-amber-950/85 border border-amber-400/70 text-amber-100 text-xs font-bold flex items-center gap-2.5 animate-pulse"
            >
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{warningNotice.text}</span>
            </div>
          )}

          {/* Completion Screen OR Active Stage Interactive Panel */}
          {completionSummary ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-950/80 via-slate-900 to-teal-950/70 border-2 border-emerald-400 text-center space-y-5 shadow-2xl">
              <div className="w-16 h-16 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1.5">
                <span className="px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/50 text-emerald-300 font-black text-[11px] uppercase">
                  {completionSummary.wasInstant
                    ? '⚡ SELESAI INSTAN 1-KLIK BERHASIL'
                    : '🎉 SELURUH TAHAP KERJA TUNTAS 100%'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Gaji, Coin &amp; Bonus XP Langsung Cair!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
                  {completionSummary.message}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-400/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Total Uang Cair
                  </span>
                  <span className="text-lg font-black font-mono tabular-nums text-emerald-400 mt-1 block">
                    {formatRupiah(completionSummary.paidAmount)}
                  </span>
                  {completionSummary.extraSalaryBonus > 0 && (
                    <span className="text-[10px] text-emerald-300 font-bold">
                      (Termasuk Bonus +{formatRupiah(completionSummary.extraSalaryBonus)})
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-amber-400/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Total Coin Masuk
                  </span>
                  <span className="text-lg font-black font-mono tabular-nums text-amber-300 mt-1 block">
                    +{completionSummary.coinsEarned.toLocaleString('id-ID')} Coin
                  </span>
                  {completionSummary.extraCoinBonus > 0 && (
                    <span className="text-[10px] text-amber-200 font-bold">
                      (Termasuk +{completionSummary.extraCoinBonus} Bonus Tahap)
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/90 border border-cyan-400/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    Bonus XP Level Akun
                  </span>
                  <span className="text-lg font-black font-mono tabular-nums text-cyan-300 mt-1 block">
                    +{completionSummary.extraXpEarned.toLocaleString('id-ID')} XP
                  </span>
                  <span className="text-[10px] text-cyan-200 font-bold">
                    Otomatis Masuk Progres Level
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-sm cursor-pointer shadow-xl shadow-emerald-500/20"
              >
                Kembali ke Daftar Lowongan Kerja
              </button>
            </div>
          ) : (
            <div className="p-5 sm:p-7 rounded-3xl bg-slate-900/95 border-2 border-slate-700/80 shadow-2xl space-y-5">
              {/* Stage Header */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/50 text-amber-300 flex items-center justify-center shrink-0">
                    {activeStage === 1 && <Cable className="w-6 h-6" />}
                    {activeStage === 2 && <MousePointerClick className="w-6 h-6" />}
                    {activeStage === 3 && <ShieldCheck className="w-6 h-6" />}
                    {activeStage === 4 && <SlidersHorizontal className="w-6 h-6" />}
                    {activeStage === 5 && <Fingerprint className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      {activeStageMeta.title}
                    </h3>
                    <p className="text-xs text-slate-400">{activeStageMeta.subtitle}</p>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono font-black text-amber-300 whitespace-nowrap">
                  Tahap {enabledStages.indexOf(activeStage) + 1} / {enabledStages.length}
                </span>
              </div>

              {/* ================= TAHAP 1: BENERIN KABEL (4 PASANG WARNA) ================= */}
              {activeStage === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-bold">
                      Ketuk kabel di <strong>Panel Kiri</strong> lalu ketuk port warna yang sama di{' '}
                      <strong>Panel Kanan</strong>:
                    </span>
                    <span className="font-mono font-black text-emerald-300 tabular-nums">
                      {connectedCables.length} / 4 Tersambung
                    </span>
                  </div>

                  <div className="relative p-4 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800">
                    {/* Visual SVG Wires for Connected Cables */}
                    <svg
                      className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block"
                      viewBox="0 0 600 280"
                      preserveAspectRatio="none"
                    >
                      {connectedCables.map((cId) => {
                        const leftIdx = CABLE_COLORS.findIndex((c) => c.id === cId);
                        const rightIdx = rightPortsOrder.findIndex((c) => c.id === cId);
                        const spec = CABLE_COLORS[leftIdx];
                        if (leftIdx < 0 || rightIdx < 0 || !spec) return null;
                        const y1 = 42 + leftIdx * 66;
                        const y2 = 42 + rightIdx * 66;
                        return (
                          <path
                            key={cId}
                            d={`M 185 ${y1} C 300 ${y1}, 300 ${y2}, 415 ${y2}`}
                            stroke={spec.hex}
                            strokeWidth="7"
                            strokeLinecap="round"
                            fill="none"
                            opacity="0.9"
                          />
                        );
                      })}
                    </svg>

                    <div className="relative z-10 grid grid-cols-2 gap-6 sm:gap-28">
                      {/* Panel Kiri */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block text-center">
                          Sumber Kabel
                        </span>
                        {CABLE_COLORS.map((cable) => {
                          const isConnected = connectedCables.includes(cable.id);
                          const isSelected = selectedLeftCable === cable.id;
                          return (
                            <button
                              key={cable.id}
                              type="button"
                              onClick={() => handleSelectLeftCable(cable.id)}
                              disabled={isConnected}
                              className={`w-full py-3 px-3.5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-between gap-2 transition cursor-pointer ${
                                isConnected
                                  ? 'bg-emerald-950/60 border-emerald-400/70 text-emerald-200 opacity-90'
                                  : isSelected
                                  ? `bg-slate-900 ${cable.borderClass} ring-4 ${cable.ringClass} text-white scale-[1.02]`
                                  : 'bg-slate-900 border-slate-700 hover:border-slate-500 text-slate-200'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-4 h-4 rounded-full ${cable.bgClass} shadow-sm`} />
                                <span>Kabel {cable.label}</span>
                              </span>
                              {isConnected ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <span className={`w-3 h-3 rounded-full ${cable.bgClass}`} />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Panel Kanan */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold block text-center">
                          Port Tujuan
                        </span>
                        {rightPortsOrder.map((port) => {
                          const isConnected = connectedCables.includes(port.id);
                          return (
                            <button
                              key={port.id}
                              type="button"
                              onClick={() => handleSelectRightPort(port.id)}
                              disabled={isConnected}
                              className={`w-full py-3 px-3.5 rounded-xl border-2 font-black text-xs sm:text-sm flex items-center justify-between gap-2 transition cursor-pointer ${
                                isConnected
                                  ? 'bg-emerald-950/60 border-emerald-400/70 text-emerald-200 opacity-90'
                                  : selectedLeftCable
                                  ? 'bg-slate-900 border-slate-600 hover:border-amber-400 text-white'
                                  : 'bg-slate-900 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full ${port.bgClass}`} />
                              <span>Port {port.label}</span>
                              {isConnected ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <span className="text-[10px] font-mono text-slate-500">Soket</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= TAHAP 2: TAP-TAP SESUAI KETENTUAN ================= */}
              {activeStage === 2 && (
                <div className="space-y-5 text-center">
                  <div className="space-y-2 max-w-xl mx-auto">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-300">Progres Target Ketukan Lowongan:</span>
                      <span className="font-mono font-black text-amber-300 tabular-nums">
                        {stage2Clicks.toLocaleString('id-ID')} /{' '}
                        {effectiveTargetClicks.toLocaleString('id-ID')} ({stage2Pct}%)
                      </span>
                    </div>
                    <div className="w-full h-4 rounded-full bg-slate-950 border border-slate-700 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 transition-all duration-75"
                        style={{ width: `${stage2Pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="py-3 flex flex-col items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleStage2Tap}
                      className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 active:scale-95 text-slate-950 font-black shadow-2xl shadow-emerald-500/30 border-4 border-white/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation transition-transform duration-75"
                    >
                      <MousePointerClick className="w-10 h-10" />
                      <span className="text-lg sm:text-xl tracking-wide">TAP KERJA!</span>
                      <span className="px-3 py-0.5 rounded-full bg-slate-950/20 text-xs font-mono font-black tabular-nums">
                        +{clickPower} / Ketuk
                      </span>
                      <span className="text-[11px] font-bold tabular-nums">
                        Sisa {Math.max(0, effectiveTargetClicks - stage2Clicks).toLocaleString('id-ID')}
                      </span>
                    </button>

                    {tapPulseNonce > 0 && (
                      <span
                        key={tapPulseNonce}
                        className="text-xs font-mono font-black text-emerald-300"
                      >
                        ⚡ +{clickPower} Klik Tercatat!
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAHAP 3: VERIFIKASI OTP & ANGKA KLIRING BANK ================= */}
              {activeStage === 3 && (
                <div className="space-y-4">
                  {/* Slip Kode Keamanan Bank */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-950 to-cyan-950/70 border border-cyan-400/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-cyan-300 font-bold block">
                        Angka Kliring Bank Resmi
                      </span>
                      <span className="text-lg font-black font-mono text-white tracking-widest mt-0.5 block">
                        {targetClearing.code}
                      </span>
                      <span className="text-[11px] text-slate-400">{targetClearing.label}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block">
                        Kode Keamanan OTP (4 Digit)
                      </span>
                      <span className="text-2xl font-black font-mono text-amber-300 tracking-[0.35em] mt-0.5 block">
                        {targetOtp}
                      </span>
                    </div>
                  </div>

                  {/* Step 3A: Pilih Kode Kliring */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-200 block">
                      1. Pilih Angka Kliring Bank yang Sesuai Slip:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {BANK_CLEARING_CODES.map((item) => {
                        const isPicked = selectedClearingCode === item.code;
                        return (
                          <button
                            key={item.code}
                            type="button"
                            onClick={() => setSelectedClearingCode(item.code)}
                            className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black font-mono cursor-pointer transition ${
                              isPicked
                                ? 'bg-cyan-400 text-slate-950 border-cyan-200 shadow-lg'
                                : 'bg-slate-950 text-slate-300 border-slate-700 hover:border-cyan-400/60'
                            }`}
                          >
                            {item.code}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Step 3B: Masukkan 4 Digit OTP */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-200 block">
                      2. Masukkan 4 Digit Kode Keamanan OTP:
                    </span>
                    <div className="flex items-center justify-center gap-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-13 h-14 rounded-2xl border-2 flex items-center justify-center font-mono text-2xl font-black ${
                            enteredOtp[idx]
                              ? 'bg-amber-400/15 border-amber-400 text-amber-300'
                              : 'bg-slate-950 border-slate-700 text-slate-600'
                          }`}
                        >
                          {enteredOtp[idx] || '•'}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <button
                          key={digit}
                          type="button"
                          onClick={() => handleOtpDigitPress(digit)}
                          className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-white font-mono font-black text-base cursor-pointer"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEnteredOtp('')}
                        className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Ulang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOtpDigitPress('0')}
                        className="py-3 rounded-xl bg-slate-950 hover:bg-slate-800 active:scale-95 border border-slate-700 text-white font-mono font-black text-base cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        type="button"
                        onClick={() => setEnteredOtp((prev) => prev.slice(0, -1))}
                        className="py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-rose-300 font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        <Delete className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyStage3}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 hover:from-cyan-300 hover:to-indigo-300 text-slate-950 font-black text-sm cursor-pointer shadow-xl shadow-cyan-500/20"
                    >
                      Verifikasi OTP &amp; Angka Kliring Bank
                    </button>
                  </div>
                </div>
              )}

              {/* ================= TAHAP 4: KALIBRASI SLIDER SERVER & BRANKAS ================= */}
              {activeStage === 4 && (
                <div className="space-y-5">
                  {/* Slider 1: Frekuensi Server */}
                  <div
                    className={`p-4 rounded-2xl border-2 space-y-3 transition ${
                      isFreqLocked
                        ? 'bg-emerald-950/40 border-emerald-400'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-xs font-black text-white block">
                          1. Frekuensi Server Bank Nusantara
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Target Zona Hijau:{' '}
                          <strong className="text-emerald-300 font-mono">
                            {freqTarget.min} – {freqTarget.max} MHz
                          </strong>
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-xl font-mono font-black text-xs tabular-nums ${
                          isFreqLocked
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-900 text-amber-300 border border-slate-700'
                        }`}
                      >
                        {freqValue} MHz {isFreqLocked ? '✓ TERKUNCI' : ''}
                      </span>
                    </div>

                    <div className="relative pt-2 pb-1">
                      <div className="w-full h-3 rounded-full bg-slate-800 relative overflow-hidden mb-2">
                        <div
                          className="absolute top-0 bottom-0 bg-emerald-400/50 border-x-2 border-emerald-300"
                          style={{
                            left: `${freqTarget.min}%`,
                            width: `${freqTarget.max - freqTarget.min}%`,
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-1.5 bg-white shadow"
                          style={{ left: `calc(${freqValue}% - 3px)` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={freqValue}
                        onChange={(e) => setFreqValue(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer h-2"
                      />
                    </div>
                  </div>

                  {/* Slider 2: Sinkronisasi Brankas */}
                  <div
                    className={`p-4 rounded-2xl border-2 space-y-3 transition ${
                      isVaultLocked
                        ? 'bg-emerald-950/40 border-emerald-400'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <span className="text-xs font-black text-white block">
                          2. Sinkronisasi Tekanan Brankas Digital
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Target Zona Hijau:{' '}
                          <strong className="text-emerald-300 font-mono">
                            {vaultTarget.min}% – {vaultTarget.max}%
                          </strong>
                        </span>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-xl font-mono font-black text-xs tabular-nums ${
                          isVaultLocked
                            ? 'bg-emerald-400 text-slate-950'
                            : 'bg-slate-900 text-amber-300 border border-slate-700'
                        }`}
                      >
                        {vaultValue}% {isVaultLocked ? '✓ SINKRON' : ''}
                      </span>
                    </div>

                    <div className="relative pt-2 pb-1">
                      <div className="w-full h-3 rounded-full bg-slate-800 relative overflow-hidden mb-2">
                        <div
                          className="absolute top-0 bottom-0 bg-emerald-400/50 border-x-2 border-emerald-300"
                          style={{
                            left: `${vaultTarget.min}%`,
                            width: `${vaultTarget.max - vaultTarget.min}%`,
                          }}
                        />
                        <div
                          className="absolute top-0 bottom-0 w-1.5 bg-white shadow"
                          style={{ left: `calc(${vaultValue}% - 3px)` }}
                        />
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={vaultValue}
                        onChange={(e) => setVaultValue(Number(e.target.value))}
                        className="w-full accent-emerald-400 cursor-pointer h-2"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyStage4}
                    className={`w-full py-3.5 rounded-2xl font-black text-sm cursor-pointer transition ${
                      isFreqLocked && isVaultLocked
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/25'
                        : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {isFreqLocked && isVaultLocked
                      ? '✅ Kunci Kalibrasi & Lanjut ke Tahap Biometrik'
                      : 'Kunci Kalibrasi & Sinkronkan Brankas'}
                  </button>
                </div>
              )}

              {/* ================= TAHAP 5: SIDIK JARI BIOMETRIK 100% ================= */}
              {activeStage === 5 && (
                <div className="py-4 flex flex-col items-center text-center space-y-5">
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                    Tekan dan <strong>tahan tombol sidik jari biometrik</strong> di bawah ini sampai
                    cincin pemindai penuh <strong>100%</strong> untuk mencairkan gaji &amp; seluruh bonus!
                  </p>

                  <div className="relative w-44 h-44 flex items-center justify-center select-none">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 144 144">
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        stroke="#1e293b"
                        strokeWidth="10"
                        fill="none"
                      />
                      <circle
                        cx="72"
                        cy="72"
                        r="62"
                        stroke={bioPercent >= 100 ? '#34d399' : '#fbbf24'}
                        strokeWidth="10"
                        strokeLinecap="round"
                        fill="none"
                        strokeDasharray={bioCircumference}
                        strokeDashoffset={bioStrokeOffset}
                      />
                    </svg>

                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setIsHoldingBio(true);
                      }}
                      onPointerUp={handleBioRelease}
                      onPointerLeave={handleBioRelease}
                      onPointerCancel={handleBioRelease}
                      onContextMenu={(e) => e.preventDefault()}
                      className={`relative z-10 w-32 h-32 rounded-full border-2 flex flex-col items-center justify-center gap-1 transition cursor-pointer select-none touch-none ${
                        isHoldingBio
                          ? 'bg-emerald-500/25 border-emerald-300 scale-95 shadow-2xl shadow-emerald-500/40'
                          : 'bg-slate-950 border-amber-400/70 hover:border-emerald-400 shadow-xl'
                      }`}
                    >
                      <Fingerprint
                        className={`w-12 h-12 transition ${
                          isHoldingBio ? 'text-emerald-300 animate-pulse' : 'text-amber-300'
                        }`}
                      />
                      <span className="font-mono font-black text-base tabular-nums text-white">
                        {Math.round(bioPercent)}%
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Zap className="w-4 h-4" />
                    <span>
                      {isHoldingBio
                        ? 'Memindai Biometrik Nasabah... Jangan dilepas!'
                        : 'Tahan Tombol Sidik Jari hingga 100%'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
