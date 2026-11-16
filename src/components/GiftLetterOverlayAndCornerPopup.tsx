/**
 * GiftLetterOverlayAndCornerPopup
 * - Tema Royal Wax-Seal Emas Mewah + Animasi Konfeti Emas saat segel terbuka
 * - Stempel Resmi, Tanda Tangan Digital Kaligrafi, Cap Tanggal & Nomor Seri Unik
 * - Date Lock Ketat (`strictDateLock`), Info Peluang Gacha (Min–Max + %), & Hadiah Role / Trial
 * - Popup Notifikasi Persisten di Pojok Kanan Bawah
 */
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Gift,
  MailOpen,
  Sparkles,
  Calendar,
  UserCheck,
  X,
  CheckCircle2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Coins,
  Banknote,
  Lock,
  Dices,
  Clock,
  Crown,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';
import { AdminGiftEventPackage, AdminGiftRewardItem } from '../types/bank';
import { GIFT_REWARD_CATALOG, formatTrialDurationLabel } from '../data/giftRewardsCatalog';
import { getDevBadgeColorStyle } from '../data/devRolesCatalog';
import { OfficialSignatureBlock, OfficialStampBadge } from './LetterSealRenderer';

const isCurrencyRewardType = (type: AdminGiftRewardItem['type']): boolean =>
  type === 'cash_balance' ||
  type === 'pulsa_balance' ||
  type === 'special_deposito' ||
  type === 'dream_pocket_fund' ||
  type === 'salary_jackpot_drop' ||
  type === 'fee_waiver_pass' ||
  type === 'high_yield_deposito_vip' ||
  type === 'emergency_vault_fund' ||
  type === 'sultan_empire_dividend';

const formatNumericByReward = (item: AdminGiftRewardItem, num: number): string => {
  if (isCurrencyRewardType(item.type)) {
    return formatRupiah(num);
  }
  return `${num.toLocaleString('id-ID')} ${item.unitLabel}`;
};

const buildLetterSerialNumber = (ev: AdminGiftEventPackage, accountNo: string): string => {
  const m = String(ev.scheduleMonth).padStart(2, '0');
  const d = String(ev.scheduleDay).padStart(2, '0');
  const tail = ev.id.slice(-4).toUpperCase().replace(/[^A-Z0-9]/g, 'X');
  const accTail = accountNo.slice(-4);
  return `BN-ROY-${m}${d}-${accTail}-${tail}`;
};

const THEME_STYLES: Record<
  NonNullable<AdminGiftEventPackage['themeColor']>,
  {
    border: string;
    glow: string;
    badge: string;
    button: string;
    boxBg: string;
  }
> = {
  amber: {
    border: 'border-amber-400/80',
    glow: 'shadow-amber-500/30',
    badge: 'bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-950',
    button:
      'from-amber-300 via-yellow-400 to-amber-500 text-slate-950 hover:from-amber-200 hover:to-yellow-400',
    boxBg: 'from-[#1a1305] via-slate-950 to-[#0f172a]',
  },
  emerald: {
    border: 'border-emerald-400/80',
    glow: 'shadow-emerald-500/25',
    badge: 'bg-emerald-400 text-slate-950',
    button:
      'from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 hover:from-emerald-300 hover:to-cyan-300',
    boxBg: 'from-emerald-950/90 via-slate-950 to-slate-950',
  },
  rose: {
    border: 'border-rose-400/80',
    glow: 'shadow-rose-500/25',
    badge: 'bg-rose-400 text-slate-950',
    button:
      'from-rose-400 via-pink-400 to-amber-400 text-slate-950 hover:from-rose-300 hover:to-amber-300',
    boxBg: 'from-rose-950/90 via-slate-950 to-slate-950',
  },
  indigo: {
    border: 'border-indigo-400/80',
    glow: 'shadow-indigo-500/25',
    badge: 'bg-indigo-400 text-slate-950',
    button:
      'from-indigo-400 via-cyan-400 to-blue-500 text-slate-950 hover:from-indigo-300 hover:to-blue-400',
    boxBg: 'from-indigo-950/90 via-slate-950 to-slate-950',
  },
};

export const GiftLetterOverlayAndCornerPopup: React.FC = () => {
  const {
    currentAccount,
    googleUser,
    giftEvents,
    activeGiftModal,
    openGiftEventModal,
    closeGiftEventModal,
    claimAndOpenGiftEvent,
    isGiftEventOpenableNow,
    devRoles,
    defaultLetterSealConfig,
  } = useBank();

  const [openStage, setOpenStage] = useState<'sealed' | 'opening' | 'opened'>('sealed');
  const [claimResult, setClaimResult] = useState<{
    alreadyClaimed: boolean;
    message: string;
  } | null>(null);
  const [cornerExpanded, setCornerExpanded] = useState<boolean>(false);
  const [rollingSpinDisplay, setRollingSpinDisplay] = useState<number>(0);

  const activeEvent = activeGiftModal
    ? giftEvents.find((ev) => ev.id === activeGiftModal.eventId) || null
    : null;

  useEffect(() => {
    if (activeGiftModal) {
      setOpenStage('sealed');
      setClaimResult(null);
    }
  }, [activeGiftModal?.eventId, activeGiftModal?.isReplay]);

  useEffect(() => {
    if (openStage !== 'opening') return;
    const iv = setInterval(() => {
      setRollingSpinDisplay(Math.floor(100000 + Math.random() * 899999));
    }, 65);
    return () => clearInterval(iv);
  }, [openStage]);

  if (!currentAccount || !googleUser?.hasCompletedOnboarding) {
    return null;
  }

  const eligibleEvents = giftEvents.filter((ev) => {
    if (!ev.isActive) return false;
    if (ev.targetAccountId && ev.targetAccountId !== '__ALL__' && ev.targetAccountId !== currentAccount.id) {
      return false;
    }
    return true;
  });

  const displayCornerEvents = eligibleEvents;
  const openableUnviewedCount = eligibleEvents.filter(
    (ev) =>
      isGiftEventOpenableNow(ev, currentAccount.id) &&
      !(ev.viewedByAccountIds || []).includes(currentAccount.id)
  ).length;
  const lockedCount = eligibleEvents.filter(
    (ev) => !isGiftEventOpenableNow(ev, currentAccount.id)
  ).length;

  const isActiveEventOpenable = activeEvent
    ? isGiftEventOpenableNow(activeEvent, currentAccount.id)
    : false;
  const hasGachaRewards = Boolean(
    activeEvent?.rewards.some(
      (r) => r.rewardMode === 'gacha' && r.gachaTiers && r.gachaTiers.length > 0
    )
  );

  const fireGoldenConfetti = () => {
    try {
      confetti({
        particleCount: 95,
        spread: 85,
        origin: { y: 0.52 },
        colors: ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff', '#fb923c'],
      });
    } catch {
      /* ignore confetti error */
    }
  };

  const handleOpenEnvelope = () => {
    if (!activeEvent || openStage !== 'sealed' || !isActiveEventOpenable) return;
    setOpenStage('opening');
    const delayMs = hasGachaRewards ? 950 : 750;
    setTimeout(() => {
      const res = claimAndOpenGiftEvent(activeEvent.id);
      if (!res.success && res.lockedByDate) {
        setOpenStage('sealed');
        return;
      }
      fireGoldenConfetti();
      setClaimResult({
        alreadyClaimed: res.alreadyClaimed,
        message: res.message,
      });
      setOpenStage('opened');
    }, delayMs);
  };

  const theme = THEME_STYLES[activeEvent?.themeColor || 'amber'];
  const savedGachaResults = activeEvent?.gachaResultsByAccount?.[currentAccount.id] || [];
  const activeAccountRole = currentAccount.devRoleId
    ? devRoles.find((r) => r.id === currentAccount.devRoleId) || null
    : null;

  return (
    <>
      {/* FULL-SCREEN BLURRED OVERLAY WITH ROYAL WAX-SEAL ENVELOPE & GIFT BOX */}
      {activeGiftModal && activeEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-fadeIn overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-full max-w-2xl rounded-3xl border-2 ${theme.border} bg-gradient-to-br ${theme.boxBg} shadow-2xl ${theme.glow} p-6 sm:p-8 my-auto transition-all duration-500 ring-1 ring-amber-300/25`}
          >
            {/* Corner Royal Filigree Accents */}
            <div className="pointer-events-none absolute top-2.5 left-2.5 w-6 h-6 border-t-2 border-l-2 border-amber-400/60 rounded-tl-xl" />
            <div className="pointer-events-none absolute top-2.5 right-2.5 w-6 h-6 border-t-2 border-r-2 border-amber-400/60 rounded-tr-xl" />
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-6 h-6 border-b-2 border-l-2 border-amber-400/60 rounded-bl-xl" />
            <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-6 h-6 border-b-2 border-r-2 border-amber-400/60 rounded-br-xl" />

            {/* Top Header */}
            <div className="flex items-center justify-between gap-3 border-b border-amber-400/20 pb-4 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${theme.badge}`}
                >
                  {hasGachaRewards ? <Dices className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
                  <span>
                    {hasGachaRewards
                      ? '🎲 ROYAL GACHA & SURAT ADMIN'
                      : '👑 ROYAL SEAL HADIAH & SURAT ADMIN'}
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1 tabular-nums">
                  <Calendar className="w-3 h-3" />
                  <span>{activeEvent.scheduleLabel}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={closeGiftEventModal}
                className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer shrink-0"
                title="Tutup & Simpan ke Popup Pojok"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* DATE LOCKED VIEW */}
            {!isActiveEventOpenable && (
              <div className="text-center space-y-6 py-6">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-2xl animate-pulse" />
                  <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-900 to-rose-950 border-2 border-rose-400/70 flex flex-col items-center justify-center shadow-2xl">
                    <Lock className="w-10 h-10 text-rose-400" />
                  </div>
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-black text-[10px] uppercase tracking-wider inline-block">
                    🔒 TERKUNCI OLEH JADWAL TANGGAL ADMIN
                  </span>
                  <h2 className="text-2xl font-black text-white">{activeEvent.title}</h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Segel Royal Wax-Seal &amp; Surat ini <strong>hanya dapat dibuka tepat pada tanggal {activeEvent.scheduleLabel}</strong> (atau setelah Admin menekan Kirim Manual).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 max-w-md mx-auto text-xs text-amber-300 font-mono tabular-nums">
                  📅 Jadwal Buka Resmi: <strong>{activeEvent.scheduleLabel}</strong> • Isi:{' '}
                  {activeEvent.rewards.length} Item Hadiah
                </div>

                <button
                  type="button"
                  onClick={closeGiftEventModal}
                  className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs cursor-pointer"
                >
                  Simpan &amp; Kembali
                </button>
              </div>
            )}

            {/* SEALED ROYAL WAX-SEAL VIEW + PRE-ROLL GACHA TRANSPARENCY */}
            {isActiveEventOpenable && openStage === 'sealed' && (
              <div className="text-center space-y-5 py-2">
                {/* Animated Golden Wax Seal Envelope */}
                <div className="relative mx-auto w-44 h-36 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-2xl animate-pulse" />
                  {/* Envelope Body */}
                  <div className="relative w-40 h-28 rounded-2xl bg-gradient-to-br from-amber-950 via-[#1f1606] to-slate-950 border-2 border-amber-400/80 shadow-2xl shadow-amber-500/30 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-14 border-b border-amber-400/35 bg-gradient-to-b from-amber-500/15 to-transparent" />
                    {/* 3D Golden Wax Seal Center */}
                    <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-100 shadow-xl shadow-amber-500/50 flex flex-col items-center justify-center animate-bounce">
                      {hasGachaRewards ? (
                        <Dices className="w-7 h-7 text-slate-950" />
                      ) : (
                        <Crown className="w-7 h-7 text-slate-950" />
                      )}
                      <span className="text-[7px] font-black text-slate-950 tracking-widest uppercase">
                        ROYAL SEAL
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-w-lg mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/50 text-xs font-bold text-amber-200">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Surat &amp; Hadiah Dari: {activeEvent.senderName}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {activeEvent.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Amplop segel emas berisi{' '}
                    <strong className="text-amber-300">{activeEvent.rewards.length} hadiah eksklusif</strong> dan surat kehormatan resmi untuk{' '}
                    <strong className="text-white">{currentAccount.fullName}</strong>.
                  </p>
                </div>

                {/* Transparent Pre-Roll Gacha Odds + Trial Preview Box */}
                <div className="max-w-xl mx-auto text-left space-y-2 max-h-60 overflow-y-auto pr-1">
                  {activeEvent.rewards.map((rew) => {
                    const meta = GIFT_REWARD_CATALOG.find((c) => c.type === rew.type);
                    const isGacha =
                      rew.rewardMode === 'gacha' && rew.gachaTiers && rew.gachaTiers.length > 0;
                    const targetRole = rew.targetDevRoleId
                      ? devRoles.find((r) => r.id === rew.targetDevRoleId)
                      : null;

                    return (
                      <div
                        key={rew.id}
                        className={`p-3 rounded-2xl border ${
                          isGacha
                            ? 'bg-fuchsia-950/35 border-fuchsia-400/50'
                            : 'bg-slate-950/85 border-amber-400/25'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{rew.emoji}</span>
                            <span>{rew.label}</span>
                            {targetRole && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-200 text-[10px] font-black">
                                Role: {targetRole.name}
                              </span>
                            )}
                            {meta?.isTrial && (
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                                ⏳ {formatTrialDurationLabel(rew.trialDurationMinutes || meta.defaultTrialMinutes)}
                              </span>
                            )}
                          </span>
                          {!isGacha ? (
                            <span className="font-mono font-black text-emerald-300 text-xs tabular-nums">
                              {rew.type.startsWith('role_')
                                ? targetRole
                                  ? targetRole.name
                                  : 'Role Acak'
                                : formatNumericByReward(rew, rew.amount)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-fuchsia-400 text-slate-950 font-black text-[10px]">
                              🎲 GACHA
                            </span>
                          )}
                        </div>

                        {isGacha && rew.gachaTiers && (
                          <div className="mt-2 pt-2 border-t border-fuchsia-400/20 space-y-1">
                            <span className="text-[10px] text-fuchsia-200 font-bold block">
                              Info Rentang Minimal–Maksimal &amp; Peluang Sebelum Di-Roll:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                              {rew.gachaTiers.map((tier) => (
                                <div
                                  key={tier.id}
                                  className="px-2.5 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums"
                                >
                                  <span className="text-slate-300 truncate">{tier.label}</span>
                                  <span className="text-amber-300 font-bold shrink-0">
                                    {isCurrencyRewardType(rew.type)
                                      ? `${formatRupiah(tier.minAmount)}–${formatRupiah(tier.maxAmount)}`
                                      : `${tier.minAmount}–${tier.maxAmount}`}{' '}
                                    <strong className="text-fuchsia-300">
                                      ({tier.probabilityPercent}%)
                                    </strong>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleOpenEnvelope}
                    className={`px-8 py-4 rounded-2xl bg-gradient-to-r ${theme.button} font-black text-sm sm:text-base shadow-2xl transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2.5 whitespace-nowrap`}
                  >
                    {hasGachaRewards ? (
                      <>
                        <Dices className="w-5 h-5" />
                        <span>Pecahkan Segel &amp; Putar Gacha Sekarang</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Pecahkan Segel &amp; Buka Surat Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* ANIMATED OPENING + GACHA SPIN REVEAL */}
            {isActiveEventOpenable && openStage === 'opening' && (
              <div className="py-14 text-center space-y-6">
                <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-2xl animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border-4 border-amber-100 flex items-center justify-center animate-spin shadow-2xl">
                    {hasGachaRewards ? (
                      <Dices className="w-11 h-11 text-slate-950" />
                    ) : (
                      <Crown className="w-11 h-11 text-slate-950" />
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-amber-200">
                    {hasGachaRewards
                      ? 'Memecahkan Segel Emas & Memutar Gacha...'
                      : 'Membuka Segel Lilin Royal Bank Nusantara...'}
                  </h3>
                  {hasGachaRewards && (
                    <div className="text-3xl font-mono font-black text-amber-300 tracking-wider tabular-nums">
                      🎲 {rollingSpinDisplay.toLocaleString('id-ID')}
                    </div>
                  )}
                  <p className="text-xs text-slate-300 font-mono">
                    Menyiapkan surat resmi &amp; menyalurkan hadiah dari {activeEvent.senderName}
                  </p>
                </div>
              </div>
            )}

            {/* OPENED ROYAL WAX-SEAL LETTER CERTIFICATE VIEW */}
            {isActiveEventOpenable && openStage === 'opened' && (
              <div className="space-y-5">
                {/* Status Banner */}
                {claimResult && (
                  <div
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 text-xs ${
                      claimResult.alreadyClaimed
                        ? 'bg-cyan-950/70 border-cyan-400/50 text-cyan-200'
                        : 'bg-emerald-950/70 border-emerald-400/60 text-emerald-200'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    <div>
                      <span className="font-black block">
                        {claimResult.alreadyClaimed
                          ? 'Mode Lihat Kembali • Hadiah Sudah Masuk ke Rekening Anda'
                          : '🎉 Segel Terbuka! Seluruh Hadiah & Surat Berhasil Diterima'}
                      </span>
                      <span className="text-[11px] opacity-90">{claimResult.message}</span>
                    </div>
                  </div>
                )}

                {/* ROYAL WAX-SEAL EMAS LUXURY LETTER SHEET */}
                <div className="relative rounded-3xl bg-gradient-to-br from-[#1f1708] via-[#0c1222] to-[#171107] border-2 border-amber-400/80 ring-2 ring-amber-300/20 p-5 sm:p-7 shadow-2xl overflow-hidden space-y-5">
                  {/* Watermark Background */}
                  <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.045]">
                    <div className="text-center rotate-[-18deg]">
                      <Crown className="w-40 h-40 text-amber-300 mx-auto" />
                      <span className="font-serif font-black text-3xl tracking-widest text-amber-200 uppercase block">
                        BANK NUSANTARA
                      </span>
                    </div>
                  </div>

                  {/* Letter Top Header: Kop Surat, Nomor Seri & Cap Tanggal */}
                  <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b border-amber-400/30 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-100 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
                        <MailOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold block">
                          SURAT PENGHARGAAN RESMI • ROYAL SEAL
                        </span>
                        <h3 className="font-black text-white text-base sm:text-lg">
                          PT BANK NUSANTARA (PERSERO)
                        </h3>
                        <span className="text-[11px] text-amber-200/90 font-semibold block">
                          Kepada Yth: <strong className="text-white">{currentAccount.fullName}</strong> ({currentAccount.accountNumber})
                        </span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right space-y-1 shrink-0">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/50 text-amber-300 font-mono text-[10px] font-black block tabular-nums">
                        NO. SERI: {buildLetterSerialNumber(activeEvent, currentAccount.accountNumber)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-200 font-mono text-[10px] font-bold inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3 h-3" />
                        <span>Cap Tanggal: {activeEvent.scheduleLabel}</span>
                      </span>
                    </div>
                  </div>

                  {/* Letter Body */}
                  <div className="relative z-10 px-1 py-1">
                    <p className="text-xs sm:text-sm text-amber-50/95 leading-relaxed whitespace-pre-line font-medium">
                      {activeEvent.letterMessage}
                    </p>
                  </div>

                  {/* Letter Bottom Footer: Official Custom Stamp + Custom Drawn/Template Signature */}
                  <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-t border-amber-400/25 pt-4">
                    <div className="flex items-center gap-3">
                      <OfficialStampBadge
                        config={activeEvent.customSealConfig || defaultLetterSealConfig}
                      />
                      <div className="text-[10px] text-slate-300 space-y-0.5">
                        <span className="font-black text-amber-300 flex items-center gap-1">
                          <Award className="w-3.5 h-3.5" />
                          <span>DOKUMEN SAH BANK NUSANTARA</span>
                        </span>
                        <span className="block text-slate-400 font-mono tabular-nums">
                          Tersimpan permanen di arsip akun Anda
                        </span>
                      </div>
                    </div>

                    <OfficialSignatureBlock
                      config={activeEvent.customSealConfig || defaultLetterSealConfig}
                      fallbackSenderName={activeEvent.senderName}
                    />
                  </div>
                </div>

                {/* Role Unlocked Notice if account received or holds an active Role */}
                {activeAccountRole && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-amber-400/50 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-200 flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Status Role Aktif Akun Anda:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full border font-black text-[11px] ${
                          getDevBadgeColorStyle(activeAccountRole.badgeColor).pillClass
                        }`}
                      >
                        {activeAccountRole.name}
                      </span>
                    </span>
                    {activeAccountRole.canQuickOpenAdmin && (
                      <span className="text-[10px] font-mono text-emerald-300 font-bold">
                        ⚡ Tombol Cepat Panel Admin Aktif di Navbar &amp; Dashboard!
                      </span>
                    )}
                  </div>
                )}

                {/* Rewards Grid */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Gift className="w-4 h-4" />
                      <span>Isi Hadiah Diterima ({activeEvent.rewards.length} Item)</span>
                    </span>
                    <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 tabular-nums">
                      <span className="flex items-center gap-1 text-emerald-300">
                        <Banknote className="w-3.5 h-3.5" />
                        {formatRupiah(currentAccount.balance)}
                      </span>
                      <span className="flex items-center gap-1 text-amber-300">
                        <Coins className="w-3.5 h-3.5" />
                        {(currentAccount.spinCoins || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                    {activeEvent.rewards.map((rew) => {
                      const gachaRoll = savedGachaResults.find((g) => g.rewardId === rew.id);
                      const meta = GIFT_REWARD_CATALOG.find((c) => c.type === rew.type);
                      const targetRole = rew.targetDevRoleId
                        ? devRoles.find((r) => r.id === rew.targetDevRoleId)
                        : null;
                      const displayAmount = gachaRoll ? gachaRoll.rolledAmount : rew.amount;

                      return (
                        <div
                          key={rew.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                            gachaRoll
                              ? 'bg-fuchsia-950/35 border-fuchsia-400/50'
                              : 'bg-slate-950/90 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl shrink-0">{rew.emoji}</span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">
                                {rew.label}
                              </span>
                              {gachaRoll ? (
                                <span className="text-[10px] text-fuchsia-300 font-bold block truncate">
                                  🎲 {gachaRoll.tierLabel} ({gachaRoll.probabilityPercent}%)
                                </span>
                              ) : meta?.isTrial ? (
                                <span className="text-[10px] text-cyan-300 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Trial{' '}
                                    {formatTrialDurationLabel(
                                      rew.trialDurationMinutes || meta.defaultTrialMinutes
                                    )}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 block">
                                  {targetRole ? `Role: ${targetRole.name}` : 'Otomatis Diterima'}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 text-emerald-300 font-mono font-black text-xs shrink-0 tabular-nums">
                            {rew.type.startsWith('role_')
                              ? targetRole
                                ? targetRole.name
                                : 'Role Aktif!'
                              : `+${formatNumericByReward(rew, displayAmount)}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-amber-400/20">
                  <span className="text-[11px] text-slate-400">
                    Buka kembali surat Royal ini kapan saja melalui <strong>Popup Pojok Kanan Bawah</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={closeGiftEventModal}
                    className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.button} font-black text-xs cursor-pointer whitespace-nowrap shrink-0`}
                  >
                    Tutup &amp; Simpan di Popup Pojok
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PERSISTENT CORNER POPUP WIDGET (BOTTOM-RIGHT) */}
      {displayCornerEvents.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 max-w-[calc(100vw-2rem)]">
          {cornerExpanded && (
            <div className="w-80 sm:w-96 rounded-2xl bg-slate-900/95 backdrop-blur-xl border-2 border-amber-400/60 shadow-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-white text-xs">
                      Arsip Hadiah &amp; Surat Royal Admin
                    </h4>
                    <span className="text-[10px] text-slate-400 block">
                      Jadwal terkunci &amp; surat terbuka tersimpan rapi
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCornerExpanded(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-0.5">
                {displayCornerEvents.map((ev) => {
                  const isViewed = (ev.viewedByAccountIds || []).includes(currentAccount.id);
                  const isClaimed = (ev.claimedByAccountIds || []).includes(currentAccount.id);
                  const openable = isGiftEventOpenableNow(ev, currentAccount.id);
                  const evHasGacha = ev.rewards.some((r) => r.rewardMode === 'gacha');
                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        !openable
                          ? 'bg-slate-950/75 border-rose-500/40'
                          : !isViewed
                          ? 'bg-amber-950/50 border-amber-400/70'
                          : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[10px] font-mono text-amber-300 block tabular-nums">
                            {ev.scheduleLabel} • Dari: {ev.senderName}
                          </span>
                          <h5 className="font-bold text-white text-xs truncate">
                            {evHasGacha ? `🎲 ${ev.title}` : ev.title}
                          </h5>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            !openable
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isClaimed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {!openable
                            ? `🔒 Buka ${ev.scheduleLabel}`
                            : isClaimed
                            ? 'Sudah Dibuka'
                            : 'Baru!'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ev.rewards.length} Hadiah di dalamnya
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCornerExpanded(false);
                            openGiftEventModal(ev.id, isViewed);
                          }}
                          className={`px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${
                            !openable
                              ? 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                              : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950'
                          }`}
                        >
                          {!openable ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>Terkunci</span>
                            </>
                          ) : isViewed ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Lihat Lagi</span>
                            </>
                          ) : evHasGacha ? (
                            <>
                              <Dices className="w-3 h-3" />
                              <span>Roll Gacha!</span>
                            </>
                          ) : (
                            <>
                              <Gift className="w-3 h-3" />
                              <span>Buka Sekarang</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Floating Corner Pill Button */}
          <button
            type="button"
            onClick={() => setCornerExpanded((prev) => !prev)}
            className={`px-3.5 py-2.5 rounded-2xl border-2 shadow-2xl flex items-center gap-2.5 transition-all cursor-pointer whitespace-nowrap ${
              openableUnviewedCount > 0
                ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 border-amber-200 text-slate-950 font-black animate-pulse'
                : 'bg-slate-900/95 hover:bg-slate-800 border-amber-400/60 text-white font-bold backdrop-blur-md'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Gift className={`w-4 h-4 ${openableUnviewedCount > 0 ? 'text-slate-950' : 'text-amber-400'}`} />
              {openableUnviewedCount > 0 && (
                <span className="absolute -top-2 -right-2 px-1.5 rounded-full bg-rose-600 text-white text-[9px] font-black tabular-nums">
                  {openableUnviewedCount}
                </span>
              )}
            </div>
            <div className="text-left leading-tight">
              <span className="text-xs block">
                {openableUnviewedCount > 0
                  ? 'Hadiah & Surat Baru!'
                  : lockedCount > 0
                  ? `Surat & Hadiah (${lockedCount} Terkunci)`
                  : 'Surat & Hadiah Admin'}
              </span>
              <span
                className={`text-[10px] font-mono block tabular-nums ${
                  openableUnviewedCount > 0 ? 'text-slate-900' : 'text-amber-300'
                }`}
              >
                {displayCornerEvents.length} Paket Tersedia
              </span>
            </div>
            {cornerExpanded ? (
              <ChevronDown className="w-4 h-4 shrink-0" />
            ) : (
              <ChevronUp className="w-4 h-4 shrink-0" />
            )}
          </button>
        </div>
      )}
    </>
  );
};
