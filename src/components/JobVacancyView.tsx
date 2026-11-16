/**
 * Bank Nusantara — Portal Lowongan Pekerjaan 25 Pilihan (Rp 100.000 - Rp 10.000.000),
 * Fitur Ikon Uang & Coin, Sistem Level Individual, Voucher Level & Arena Suit Komputer (Medium)
 */
import React, { useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Lock,
  Unlock,
  TrendingUp,
  Ticket,
  Gamepad2,
  MousePointerClick,
  AlertCircle,
  Coins,
  Banknote,
  X,
  ArrowUpCircle,
  Search,
  Sparkles,
  Dices,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { JOB_VACANCIES_CATALOG } from '../data/featuresCatalog';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import { JobVacancyItem } from '../types/bank';

type JobFilterMode = 'all' | 'unlocked' | 'locked' | 'pemula' | 'menengah' | 'eksekutif';

export const JobVacancyView: React.FC = () => {
  const {
    currentAccount,
    workJobClick,
    upgradeJobLevelWithCash,
    useJobLevelVoucher,
    playSuitForLevelVoucher,
    jobGachaBonusConfig,
  } = useBank();

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | 'info' | 'salary';
    title?: string;
    message: string;
  } | null>(null);

  const [suitResult, setSuitResult] = useState<{
    outcome: 'win' | 'draw' | 'lose';
    playerChoice: 'batu' | 'gunting' | 'kertas';
    computerChoice: 'batu' | 'gunting' | 'kertas';
    rewardCash: number;
    rewardVoucher: number;
    message: string;
  } | null>(null);

  const [isPlayingSuit, setIsPlayingSuit] = useState<boolean>(false);
  const [activeClickedJobId, setActiveClickedJobId] = useState<string | null>(null);
  const [floatingRewardJob, setFloatingRewardJob] = useState<{
    jobId: string;
    text: string;
    nonce: number;
  } | null>(null);
  const [sortOrder, setSortOrder] = useState<'salary' | 'level'>('salary');
  const [targetScale, setTargetScale] = useState<1 | 5>(1);
  const [jobFilter, setJobFilter] = useState<JobFilterMode>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!currentAccount) {
    return (
      <div className="p-8 text-center text-slate-300 bg-slate-900/80 rounded-3xl border border-slate-800">
        Silakan login ke kartu rekening Bank Nusantara terlebih dahulu untuk mengakses Portal Lowongan Pekerjaan.
      </div>
    );
  }

  const userLevel = currentAccount.jobLevel || 1;
  const userVouchers = currentAccount.levelVouchers || 0;
  const clickPower = currentAccount.clickPower || 1;
  const salaryMultiplier = currentAccount.salaryMultiplier || 1;
  const progressMap = currentAccount.jobClickProgress || {};

  const choiceEmoji: Record<'batu' | 'gunting' | 'kertas', string> = {
    batu: '✊ BATU',
    gunting: '✌️ GUNTING',
    kertas: '✋ KERTAS',
  };

  const handleWorkClick = (job: JobVacancyItem) => {
    setActiveClickedJobId(job.id);
    setTimeout(() => setActiveClickedJobId(null), 120);

    const effectiveTargetClicks = job.targetClicks * targetScale;
    const jobCoins = job.coinReward ?? Math.max(2, Math.round(job.salary / 50_000));

    const res = workJobClick(
      job.id,
      job.salary,
      effectiveTargetClicks,
      job.requiredLevel,
      job.title,
      jobCoins
    );

    if (!res.success) {
      setFeedback({
        type: 'error',
        title: 'Level Belum Mencukupi',
        message: res.message,
      });
      return;
    }

    if (res.completed) {
      const paid = res.paidAmount || job.salary;
      const coins = res.coinsEarned || jobCoins;
      const gachaInfo = res.gachaBonusResult
        ? ` + 🎲 ${res.gachaBonusResult.tierLabel} (${res.gachaBonusResult.probabilityPercent}%)`
        : '';
      setFloatingRewardJob({
        jobId: job.id,
        text: `+${formatRupiah(paid)} & +${coins} Coin${res.gachaBonusResult ? ' + Gacha!' : '!'}`,
        nonce: Date.now(),
      });
      setTimeout(() => setFloatingRewardJob(null), 1500);

      setFeedback({
        type: 'salary',
        title: `🎉 GAJIAN & COIN CAIR OTOMATIS: ${formatRupiah(paid)} + ${coins.toLocaleString('id-ID')} Coin${gachaInfo}!`,
        message: res.message,
      });
    } else {
      setFloatingRewardJob({
        jobId: job.id,
        text: `+${clickPower} Klik • Menuju 💵 & 🪙`,
        nonce: Date.now(),
      });
      setTimeout(() => {
        setFloatingRewardJob((prev) => (prev?.jobId === job.id ? null : prev));
      }, 650);
    }
  };

  const handlePayCashUpgrade = () => {
    const res = upgradeJobLevelWithCash();
    setFeedback({
      type: res.success ? 'success' : 'error',
      title: res.success ? `Naik ke Level ${res.newLevel}!` : 'Gagal Naik Level',
      message: res.message,
    });
  };

  const handleUseVoucherUpgrade = (count = 1) => {
    const res = useJobLevelVoucher(count);
    setFeedback({
      type: res.success ? 'success' : 'error',
      title: res.success ? `Voucher Level Digunakan (Level ${res.newLevel})` : 'Voucher Kosong',
      message: res.message,
    });
  };

  const handlePlaySuit = (choice: 'batu' | 'gunting' | 'kertas') => {
    setIsPlayingSuit(true);
    setTimeout(() => {
      const res = playSuitForLevelVoucher(choice);
      setIsPlayingSuit(false);
      if (!res.success || !res.outcome || !res.computerChoice) {
        setFeedback({
          type: 'error',
          title: 'Tidak Dapat Memulai Suit',
          message: res.message,
        });
        return;
      }
      setSuitResult({
        outcome: res.outcome,
        playerChoice: res.playerChoice,
        computerChoice: res.computerChoice,
        rewardCash: res.rewardCash || 0,
        rewardVoucher: res.rewardVoucher || 0,
        message: res.message,
      });
    }, 280);
  };

  const filteredAndSortedJobs = [...JOB_VACANCIES_CATALOG]
    .filter((job) => {
      if (jobFilter === 'unlocked' && userLevel < job.requiredLevel) return false;
      if (jobFilter === 'locked' && userLevel >= job.requiredLevel) return false;
      if (jobFilter === 'pemula' && job.salary > 1_200_000) return false;
      if (jobFilter === 'menengah' && (job.salary <= 1_200_000 || job.salary > 5_000_000)) return false;
      if (jobFilter === 'eksekutif' && job.salary <= 5_000_000) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          job.title.toLowerCase().includes(q) ||
          job.department.toLowerCase().includes(q) ||
          String(job.salary).includes(q) ||
          String(job.requiredLevel).includes(q)
        );
      }
      return true;
    })
    .sort((a, b) =>
      sortOrder === 'salary' ? a.salary - b.salary : a.requiredLevel - b.requiredLevel
    );

  const unlockedCount = JOB_VACANCIES_CATALOG.filter((j) => userLevel >= j.requiredLevel).length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* TOP HERO BANNER: MONEY & COIN HUD, LEVEL, VOUCHER, & 25 JENJANG Gaji */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 rounded-3xl p-6 sm:p-7 border-2 border-amber-400/50 shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5" />
                <span>PORTAL LOWONGAN PEKERJAAN &amp; KARIR RESMI BANK NUSANTARA</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold text-[10px]">
                25 Pilihan Gaji (Rp 100.000 s/d Rp 10.000.000)
              </span>
              {(clickPower > 1 || salaryMultiplier > 1) && (
                <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/40 font-mono font-bold text-[10px]">
                  ⚡ Boost Admin Aktif: {clickPower}x Klik • {salaryMultiplier}x Gaji &amp; Coin
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              💼 25 Lowongan Pekerjaan (Rp 100rb – Rp 10Jt), Ikon Uang &amp; Coin
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Pilih dari <strong>25 jenjang pekerjaan</strong> dengan syarat level masing-masing (Level 1 s/d Level 60). Setiap kali target klik selesai, <strong>gaji Uang Tunai + bonus Coin</strong> langsung cair otomatis ke rekening Anda!
            </p>
          </div>

          {/* Live Money, Coin & Career Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-slate-950/90 border-2 border-emerald-400/60 text-center">
              <span className="text-[10px] font-mono uppercase text-emerald-300 flex items-center justify-center gap-1">
                <Banknote className="w-3.5 h-3.5" />
                <span>Saldo Uang</span>
              </span>
              <span className="text-xs sm:text-sm font-black text-emerald-400 font-mono block mt-1.5 tabular-nums">
                {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance)
                  ? '∞ UNLIMITED'
                  : formatRupiah(currentAccount.balance)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/90 border-2 border-amber-400/60 text-center">
              <span className="text-[10px] font-mono uppercase text-amber-300 flex items-center justify-center gap-1">
                <Coins className="w-3.5 h-3.5" />
                <span>Saldo Coin</span>
              </span>
              <span className="text-xl font-black text-amber-300 font-mono block mt-0.5 tabular-nums">
                🪙 {(currentAccount.spinCoins ?? 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/90 border-2 border-indigo-400/60 text-center">
              <span className="text-[10px] font-mono uppercase text-indigo-300 block">
                Level Karir
              </span>
              <span className="text-xl font-black text-white font-mono block mt-0.5 tabular-nums">
                LV.{userLevel}
              </span>
              <span className="text-[9px] text-slate-400 block tabular-nums">
                {unlockedCount}/25 Terbuka
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/90 border-2 border-cyan-400/60 text-center">
              <span className="text-[10px] font-mono uppercase text-cyan-300 block">
                Voucher Level
              </span>
              <span className="text-xl font-black text-cyan-300 font-mono block mt-0.5 tabular-nums">
                🎫 {userVouchers}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-slate-950/90 border border-purple-500/40 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Total Gaji Cair
              </span>
              <span className="text-xs sm:text-sm font-black text-purple-300 font-mono block mt-1.5 tabular-nums">
                {formatRupiah(currentAccount.totalJobEarnings || 0)}
              </span>
              <span className="text-[9px] text-slate-400 block tabular-nums">
                ({currentAccount.totalJobsCompleted || 0}x Gajian)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FEEDBACK / SALARY CELEBRATION BANNER */}
      {feedback && (
        <div
          className={`p-4 sm:p-5 rounded-3xl border-2 flex items-start justify-between gap-4 shadow-2xl transition-all ${
            feedback.type === 'salary'
              ? 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-900 border-emerald-400 text-emerald-100'
              : feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-400/70 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/70 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'salary' ? (
              <div className="w-11 h-11 rounded-2xl bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 font-black">
                <Coins className="w-6 h-6" />
              </div>
            ) : feedback.type === 'error' ? (
              <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
            )}
            <div>
              {feedback.title && (
                <h4 className="font-black text-white text-sm sm:text-base">{feedback.title}</h4>
              )}
              <p className="text-xs sm:text-sm leading-relaxed mt-0.5">{feedback.message}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =====================================================================
          SECTION 1: PANEL UPGRADE LEVEL & ARENA SUIT LAWAN KOMPUTER (MEDIUM)
         ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Tingkatkan Level (Bayar Rp 1.000.000 atau Pakai Voucher Level) (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
                <ArrowUpCircle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  PUSAT KENAIKAN LEVEL PEKERJAAN
                </span>
                <h3 className="font-black text-white text-base">
                  Tingkatkan Level Karir (Level {userLevel} ➔ Level {userLevel + 1})
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Semakin tinggi <strong>Level Pekerjaan</strong> Anda, semakin besar gaji &amp; Coin yang terbuka — hingga <strong>Rp 10.000.000 + 250 Coin per target klik</strong> pada Level 60!
            </p>

            {/* Option A: Use Level Voucher (From Suit) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-slate-950 border border-cyan-400/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-cyan-300 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" />
                  <span>Cara 1: Pakai Voucher Level (Gratis!)</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 font-mono font-bold text-[11px] tabular-nums">
                  Milik Anda: {userVouchers} Voucher
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                1 Voucher Level meningkatkan level Anda <strong>+1 Level</strong> tanpa memotong saldo!
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleUseVoucherUpgrade(1)}
                  disabled={userVouchers < 1}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    userVouchers >= 1
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-300 hover:to-teal-300 text-slate-950 shadow-lg shadow-cyan-500/20'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <Ticket className="w-4 h-4 shrink-0" />
                  <span>Pakai 1 Voucher (Lv.{userLevel + 1})</span>
                </button>
                {userVouchers > 1 && (
                  <button
                    type="button"
                    onClick={() => handleUseVoucherUpgrade(userVouchers)}
                    className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs cursor-pointer whitespace-nowrap"
                  >
                    Pakai Semua ({userVouchers})
                  </button>
                )}
              </div>
            </div>

            {/* Option B: Pay Rp 1.000.000 */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Cara 2: Bayar Langsung Rp 1.000.000</span>
                </span>
                <span className="font-mono font-bold text-amber-400 text-xs tabular-nums">
                  Rp 1.000.000 / +1 Lv
                </span>
              </div>
              <button
                type="button"
                onClick={handlePayCashUpgrade}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span>Bayar Rp 1.000.000 ➔ Naik ke Level {userLevel + 1}</span>
              </button>
            </div>
          </div>

          {/* Summary Progress Bar for 25 Levels */}
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-200">Progres 25 Lowongan Terbuka:</span>
              <span className="font-mono font-black text-emerald-400 tabular-nums">
                {unlockedCount} / 25 Pilihan
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-amber-400 transition-all"
                style={{ width: `${Math.round((unlockedCount / 25) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400">
              Jenjang #1 (Rp 100rb • Lv.1) hingga #25 (Rp 10jt • Lv.60). Setiap pekerjaan memberi Uang Tunai &amp; Coin!
            </p>
          </div>
        </div>

        {/* Right: Arena Suit Lawan Komputer (Level Medium / Sedang) (7 Cols) */}
        <div className="lg:col-span-7 bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-950 border-2 border-indigo-400/60 rounded-3xl p-6 shadow-2xl flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-400/50 flex items-center justify-center text-indigo-300 shrink-0">
                  <Gamepad2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                      🤖 KOMPUTER LEVEL: MEDIUM
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold text-[10px]">
                      Menang: +1 Voucher Level &amp; +Rp 300.000
                    </span>
                  </div>
                  <h3 className="font-black text-white text-base sm:text-lg mt-1">
                    Arena Suit Lawan Komputer (Batu • Gunting • Kertas)
                  </h3>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-indigo-500/40 text-right">
                <span className="text-[10px] text-slate-400 block">Biaya Main Suit:</span>
                <span className="font-mono font-black text-amber-300 text-sm tabular-nums">Rp 500.000</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-indigo-500/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase block">
                  1. BIAYA PENDAFTARAN
                </span>
                <p className="text-white font-bold mt-0.5">Bayar Rp 500.000</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Jika hasil Seri, saldo tidak dipotong!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase block">
                  2. HADIAH MENANG
                </span>
                <p className="text-emerald-300 font-black mt-0.5">
                  1 Voucher + Rp 300.000
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Langsung dapat 1 Voucher Level + uang tunai!
                </p>
              </div>
              <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40">
                <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase block">
                  3. BUKA 25 LOWONGAN
                </span>
                <p className="text-cyan-200 font-bold mt-0.5">Naik +1 Level Gratis</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Buka hingga Lowongan #25 (Gaji Rp 10.000.000).
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <span className="text-xs font-extrabold text-indigo-200 block text-center uppercase tracking-wider">
                Pilih Senjata Suit Anda (Rp 500.000):
              </span>
              <div className="grid grid-cols-3 gap-3">
                {(
                  [
                    { id: 'batu', emoji: '✊', label: 'BATU', desc: 'Kalahkan Gunting' },
                    { id: 'gunting', emoji: '✌️', label: 'GUNTING', desc: 'Kalahkan Kertas' },
                    { id: 'kertas', emoji: '✋', label: 'KERTAS', desc: 'Kalahkan Batu' },
                  ] as const
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isPlayingSuit}
                    onClick={() => handlePlaySuit(item.id)}
                    className="p-4 rounded-2xl bg-slate-950 hover:bg-indigo-950/80 border-2 border-indigo-500/50 hover:border-amber-400 transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 group active:scale-95 shadow-lg"
                  >
                    <span className="text-3xl sm:text-4xl group-hover:scale-110 transition-transform">
                      {item.emoji}
                    </span>
                    <span className="font-black text-white text-sm tracking-wide">
                      {item.label}
                    </span>
                    <span className="text-[10px] text-slate-400">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {suitResult ? (
            <div
              className={`p-4 rounded-2xl border-2 space-y-2 transition-all ${
                suitResult.outcome === 'win'
                  ? 'bg-emerald-950/80 border-emerald-400 text-emerald-100'
                  : suitResult.outcome === 'draw'
                  ? 'bg-amber-950/70 border-amber-400 text-amber-100'
                  : 'bg-rose-950/70 border-rose-500/70 text-rose-100'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                <div className="flex items-center gap-3 text-xs sm:text-sm font-black">
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-white">
                    Anda: {choiceEmoji[suitResult.playerChoice]}
                  </span>
                  <span className="text-amber-300 font-mono">VS</span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/40 text-cyan-300">
                    Komputer: {choiceEmoji[suitResult.computerChoice]}
                  </span>
                </div>
                <span className="px-3 py-1 rounded-full font-black text-xs uppercase bg-white/15">
                  {suitResult.outcome === 'win'
                    ? '🏆 MENANG (+1 VOUCHER & +Rp 300.000)'
                    : suitResult.outcome === 'draw'
                    ? '🤝 SERI (TIDAK DIPOTONG)'
                    : '💥 KALAH'}
                </span>
              </div>
              <p className="text-xs leading-relaxed font-semibold">{suitResult.message}</p>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
              Belum ada pertandingan. Pilih <strong>Batu (✊)</strong>, <strong>Gunting (✌️)</strong>, atau <strong>Kertas (✋)</strong> untuk bertanding!
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          SECTION 2: DAFTAR 25 LOWONGAN PEKERJAAN (Rp 100.000 - Rp 10.000.000)
         ===================================================================== */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
        <div className="flex flex-col gap-4 border-b border-slate-800 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                25 PILIHAN PEKERJAAN RESMI • SYARAT LEVEL MASING-MASING • BONUS UANG &amp; COIN
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
                Daftar 25 Lowongan Pekerjaan (Rp 100.000 s/d Rp 10.000.000)
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Setiap lowongan punya syarat Level sendiri (Lv.1 sampai Lv.60) serta hadiah <strong>💵 Uang Tunai + 🪙 Coin Spin Nusantara</strong> otomatis setiap kali target klik selesai!
              </p>
              {jobGachaBonusConfig.enabled && jobGachaBonusConfig.tiers.length > 0 && (
                <div className="mt-2.5 p-2.5 rounded-2xl bg-fuchsia-950/40 border border-fuchsia-500/40 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-black text-fuchsia-300 mr-1">
                    <Dices className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Bonus Gacha Pekerjaan Aktif:</span>
                  </span>
                  {jobGachaBonusConfig.tiers.map((tier) => (
                    <span
                      key={tier.id}
                      className="px-2 py-0.5 rounded-lg bg-slate-950/80 border border-fuchsia-400/30 text-slate-200 font-mono tabular-nums whitespace-nowrap"
                    >
                      <strong className="text-amber-300">{tier.label}</strong>:{' '}
                      {jobGachaBonusConfig.rewardType === 'cash_balance'
                        ? `${formatRupiah(tier.minAmount)}–${formatRupiah(tier.maxAmount)}`
                        : `${tier.minAmount.toLocaleString('id-ID')}–${tier.maxAmount.toLocaleString('id-ID')}`}{' '}
                      <span className="text-emerald-300">({tier.probabilityPercent}%)</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setTargetScale((prev) => (prev === 1 ? 5 : 1))}
                className={`px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer transition-all border whitespace-nowrap ${
                  targetScale === 5
                    ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-300 shadow-lg shadow-fuchsia-500/20'
                    : 'bg-slate-950 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-950/50'
                }`}
              >
                {targetScale === 1 ? '🔥 Target Normal (1x)' : '⚡ Mode Target 5x Aktif'}
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('salary')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  sortOrder === 'salary'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                Urutkan Gaji (1–25)
              </button>
              <button
                type="button"
                onClick={() => setSortOrder('level')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                  sortOrder === 'level'
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                Urutkan Level
              </button>
            </div>
          </div>

          {/* Search & Category Filter Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'all', label: `Semua (${JOB_VACANCIES_CATALOG.length})` },
                  { id: 'unlocked', label: `Terbuka (${unlockedCount})` },
                  { id: 'locked', label: `Terkunci (${JOB_VACANCIES_CATALOG.length - unlockedCount})` },
                  { id: 'pemula', label: 'Rp 100rb – 1,2Jt' },
                  { id: 'menengah', label: 'Rp 1,5Jt – 5Jt' },
                  { id: 'eksekutif', label: 'Rp 5,5Jt – 10Jt' },
                ] as { id: JobFilterMode; label: string }[]
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setJobFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                    jobFilter === tab.id
                      ? 'bg-emerald-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari posisi, gaji, atau level..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAndSortedJobs.map((job) => {
            const isUnlocked = userLevel >= job.requiredLevel;
            const effectiveTargetClicks = job.targetClicks * targetScale;
            const currentClicks = progressMap[job.id] || 0;
            const pct = Math.min(100, Math.round((currentClicks / effectiveTargetClicks) * 100));
            const effectiveSalary = job.salary * salaryMultiplier;
            const baseCoins = job.coinReward ?? Math.max(2, Math.round(job.salary / 50_000));
            const effectiveCoins = baseCoins * salaryMultiplier;
            const isClicking = activeClickedJobId === job.id;
            const hasFloating = floatingRewardJob?.jobId === job.id;

            return (
              <div
                key={job.id}
                className={`relative p-5 rounded-3xl border-2 flex flex-col justify-between gap-4 transition-all ${
                  job.isFreeStarter
                    ? 'bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 border-emerald-400/80 shadow-xl shadow-emerald-500/10'
                    : isUnlocked
                    ? 'bg-gradient-to-br from-slate-950 via-blue-950/30 to-slate-950 border-amber-400/60 shadow-lg'
                    : 'bg-slate-950/80 border-slate-800/90 opacity-90'
                }`}
              >
                {hasFloating && (
                  <div
                    key={floatingRewardJob.nonce}
                    className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-xl animate-bounce pointer-events-none"
                  >
                    {floatingRewardJob.text}
                  </div>
                )}

                <div className="space-y-3">
                  {/* Top Badges */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 whitespace-nowrap ${
                        job.isFreeStarter
                          ? 'bg-emerald-400 text-slate-950'
                          : isUnlocked
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      }`}
                    >
                      {isUnlocked ? (
                        <Unlock className="w-3 h-3 shrink-0" />
                      ) : (
                        <Lock className="w-3 h-3 shrink-0" />
                      )}
                      <span>{job.badgeText}</span>
                    </span>

                    <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 font-bold tabular-nums whitespace-nowrap">
                      {effectiveTargetClicks.toLocaleString('id-ID')} Klik
                    </span>
                  </div>

                  {/* Dual Money & Coin Reward Box */}
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-2">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      HADIAH CAIR OTOMATIS (UANG + COIN):
                    </span>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-lg sm:text-xl font-black text-emerald-400 font-mono flex items-center gap-1.5 tabular-nums">
                        <Banknote className="w-4 h-4 text-emerald-300 shrink-0" />
                        <span>{formatRupiah(effectiveSalary)}</span>
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-300 font-mono font-black text-xs flex items-center gap-1 tabular-nums">
                        <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>+{effectiveCoins.toLocaleString('id-ID')} Coin</span>
                      </span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <span className="text-[10px] font-mono text-amber-300/90 block">
                      {job.department}
                    </span>
                    <h3 className="font-black text-white text-sm sm:text-base mt-0.5">
                      {job.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                </div>

                {/* Bottom Click Progress & Work Button */}
                <div className="space-y-3 pt-2 border-t border-slate-800/80">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-300 font-bold">Progres Klik Kerja:</span>
                      <span className="font-mono font-black text-amber-300 tabular-nums">
                        {currentClicks.toLocaleString('id-ID')} / {effectiveTargetClicks.toLocaleString('id-ID')} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 transition-all duration-150"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => handleWorkClick(job)}
                      className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-2 shadow-lg select-none whitespace-nowrap ${
                        isClicking
                          ? 'scale-95 bg-emerald-300 text-slate-950'
                          : 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-emerald-500/20'
                      }`}
                    >
                      <MousePointerClick className="w-4 h-4 shrink-0" />
                      <span className="tabular-nums">
                        KLIK KERJA (+{clickPower}) • SISA{' '}
                        {Math.max(0, effectiveTargetClicks - currentClicks).toLocaleString('id-ID')}
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-full py-2.5 px-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px] font-bold text-center flex items-center justify-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="tabular-nums">
                          Terkunci — Butuh Level {job.requiredLevel} (Kurang{' '}
                          {job.requiredLevel - userLevel} Level)
                        </span>
                      </div>
                      {userVouchers > 0 ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleUseVoucherUpgrade(
                              Math.min(userVouchers, job.requiredLevel - userLevel)
                            )
                          }
                          className="w-full py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs cursor-pointer"
                        >
                          🎫 Pakai Voucher Level untuk Naik
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handlePayCashUpgrade}
                          className="w-full py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-xs cursor-pointer"
                        >
                          ⬆️ Upgrade +1 Level (Rp 1.000.000)
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
