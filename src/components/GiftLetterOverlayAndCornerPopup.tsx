/**
 * GiftLetterOverlayAndCornerPopup
 * - Tampilan Penerima 2 Kartu Interaktif Berdampingan:
 *   1) Amplop Surat Kerajaan (bisa di-hover membesar, animasi buka amplop, & dibaca kapan saja tanpa membuka hadiah)
 *   2) Kotak Hadiah (bisa di-hover membesar, animasi buka kotak hadiah, langsung klaim otomatis ke rekening)
 * - Indikator Status Klaim Jelas (Belum Diklaim vs Sudah Diklaim & Masuk Otomatis)
 * - Fitur Kirim / Transfer Kotak Hadiah ke Teman (selama Kotak Hadiah belum dibuka/diklaim)
 * - Lembar Surat & Stempel Resmi Ultra-Mewah 3D Royal Gold Filigree
 */
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Gift,
  MailOpen,
  Mail,
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
  Clock,
  Crown,
  ShieldCheck,
  Award,
  Send,
  Users,
  ArrowRight,
  Star,
  PackageOpen,
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
    accounts,
    currentAccount,
    googleUser,
    giftEvents,
    activeGiftModal,
    openGiftEventModal,
    closeGiftEventModal,
    markGiftLetterOpened,
    beginOpeningGiftBox,
    isGiftBoxTransferLocked,
    transferGiftEventToFriend,
    claimAndOpenGiftEvent,
    isGiftEventOpenableNow,
    devRoles,
    defaultLetterSealConfig,
  } = useBank();

  // Independent stages for Envelope (Surat) vs Gift Box (Hadiah)
  const [letterStage, setLetterStage] = useState<'sealed' | 'opening' | 'opened'>('sealed');
  const [giftStage, setGiftStage] = useState<'sealed' | 'opening' | 'opened'>('sealed');
  const [claimResult, setClaimResult] = useState<{
    alreadyClaimed: boolean;
    message: string;
  } | null>(null);
  const [cornerExpanded, setCornerExpanded] = useState<boolean>(false);

  // Friend Transfer States (when Gift Box is still sealed/unclaimed)
  const [selectedFriendAccountNo, setSelectedFriendAccountNo] = useState<string>('');
  const [manualFriendQuery, setManualFriendQuery] = useState<string>('');
  const [transferNote, setTransferNote] = useState<string>('');
  const [transferFeedback, setTransferFeedback] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const activeEvent = activeGiftModal
    ? giftEvents.find((ev) => ev.id === activeGiftModal.eventId) || null
    : null;

  const isAlreadyClaimedByMe = Boolean(
    activeEvent &&
      currentAccount &&
      (activeEvent.claimedByAccountIds || []).includes(currentAccount.id)
  );
  const isTransferLockedByState = Boolean(
    activeEvent && currentAccount && isGiftBoxTransferLocked(activeEvent.id, currentAccount.id)
  );
  const isTransferDisabledNow =
    giftStage !== 'sealed' || isAlreadyClaimedByMe || isTransferLockedByState;
  const isLetterOpenedByMe = Boolean(
    activeEvent &&
      currentAccount &&
      ((activeEvent.letterOpenedByAccountIds || []).includes(currentAccount.id) ||
        (activeEvent.viewedByAccountIds || []).includes(currentAccount.id))
  );
  const activeDeliveryMode: 'both' | 'letter_only' | 'gift_only' =
    activeEvent?.deliveryContentMode || 'both';
  const showLetterCard = activeDeliveryMode === 'both' || activeDeliveryMode === 'letter_only';
  const showGiftCard = activeDeliveryMode === 'both' || activeDeliveryMode === 'gift_only';

  useEffect(() => {
    if (activeGiftModal && activeEvent && currentAccount) {
      const alreadyClaimed = (activeEvent.claimedByAccountIds || []).includes(currentAccount.id);
      const lockedTransfer = isGiftBoxTransferLocked(activeEvent.id, currentAccount.id);
      setLetterStage('sealed');
      setGiftStage(alreadyClaimed ? 'opened' : lockedTransfer ? 'opening' : 'sealed');
      setClaimResult(
        alreadyClaimed
          ? {
              alreadyClaimed: true,
              message:
                'Kotak Hadiah ini sudah Anda klaim dan seluruh isinya telah masuk otomatis ke rekening Anda.',
            }
          : null
      );
      setSelectedFriendAccountNo('');
      setManualFriendQuery('');
      setTransferNote('');
      setTransferFeedback(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeGiftModal?.eventId, activeGiftModal?.isReplay]);

  if (!currentAccount || !googleUser?.hasCompletedOnboarding) {
    return null;
  }

  const eligibleEvents = giftEvents.filter((ev) => {
    if (!ev.isActive) return false;
    if ((ev.revokedAccountIds || []).includes(currentAccount.id)) return false;
    if ((ev.transferredOutByAccountIds || []).includes(currentAccount.id)) {
      return false;
    }
    const isTransferredToMe = (ev.transferredToAccountIds || []).includes(currentAccount.id);
    const hasMultiTargets = Array.isArray(ev.targetAccountIds) && ev.targetAccountIds.length > 0;
    const isTargetedRecipient =
      isTransferredToMe ||
      !ev.targetAccountId ||
      ev.targetAccountId === '__ALL__' ||
      ev.targetAccountId === currentAccount.id ||
      (hasMultiTargets && ev.targetAccountIds!.includes(currentAccount.id));
    if (!isTargetedRecipient) {
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

  const fireGoldenConfetti = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.52 },
        colors: ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff', '#34d399'],
      });
    } catch {
      /* ignore confetti error */
    }
  };

  // Klik Amplop Surat (Hanya membuka & membaca surat, TIDAK mengklaim Kotak Hadiah)
  const handleOpenLetterOnly = () => {
    if (!activeEvent || !isActiveEventOpenable || letterStage === 'opening') return;
    if (letterStage === 'opened') return;
    setLetterStage('opening');
    setTimeout(() => {
      markGiftLetterOpened(activeEvent.id);
      setLetterStage('opened');
    }, 550);
  };

  // Klik Buka Kotak Hadiah (Langsung mematikan fitur Transfer ke Teman seketika, animasi misteri, lalu klaim otomatis)
  const handleOpenAndClaimGiftBox = () => {
    if (!activeEvent || !isActiveEventOpenable || giftStage === 'opening') return;
    if (isAlreadyClaimedByMe) {
      setGiftStage('opened');
      return;
    }
    // Matikan transfer seketika di level state data & UI
    beginOpeningGiftBox(activeEvent.id);
    setGiftStage('opening');
    setTimeout(() => {
      const res = claimAndOpenGiftEvent(activeEvent.id);
      if (!res.success && res.lockedByDate) {
        setGiftStage('sealed');
        return;
      }
      fireGoldenConfetti();
      setClaimResult({
        alreadyClaimed: res.alreadyClaimed,
        message: res.message,
      });
      setGiftStage('opened');
    }, 850);
  };

  // Kirim Kotak Hadiah (yang belum dibuka) ke Teman
  const handleTransferGiftToFriend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent) return;
    if (isTransferDisabledNow) {
      setTransferFeedback({
        success: false,
        message:
          'Kotak Hadiah ini sudah dibuka sehingga fitur Transfer ke Teman otomatis dimatikan dan tidak dapat ditransfer lagi.',
      });
      return;
    }
    const targetQuery = manualFriendQuery.trim() || selectedFriendAccountNo.trim();
    const res = transferGiftEventToFriend(activeEvent.id, targetQuery, transferNote);
    setTransferFeedback({
      success: res.success,
      message: res.message,
    });
    if (res.success) {
      fireGoldenConfetti();
    }
  };

  const theme = THEME_STYLES[activeEvent?.themeColor || 'amber'];
  const savedGachaResults = activeEvent?.gachaResultsByAccount?.[currentAccount.id] || [];
  const activeAccountRole = currentAccount.devRoleId
    ? devRoles.find((r) => r.id === currentAccount.devRoleId) || null
    : null;
  const friendAccounts = accounts.filter((a) => a.id !== currentAccount.id);
  const transferInfoForMe =
    activeEvent?.transferHistoryByRecipient?.[currentAccount.id] || null;
  const isTransferredOutByMe = Boolean(
    activeEvent && (activeEvent.transferredOutByAccountIds || []).includes(currentAccount.id)
  );

  return (
    <>
      {/* FULL-SCREEN BLURRED OVERLAY WITH INTERACTIVE ENVELOPE & GIFT BOX */}
      {activeGiftModal && activeEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative w-full max-w-5xl rounded-3xl border-2 ${theme.border} bg-gradient-to-br ${theme.boxBg} shadow-2xl ${theme.glow} p-5 sm:p-7 my-auto transition-all duration-500 ring-2 ring-amber-300/30`}
          >
            {/* Corner Royal Filigree Accents */}
            <div className="pointer-events-none absolute top-2.5 left-2.5 w-7 h-7 border-t-2 border-l-2 border-amber-400/70 rounded-tl-xl" />
            <div className="pointer-events-none absolute top-2.5 right-2.5 w-7 h-7 border-t-2 border-r-2 border-amber-400/70 rounded-tr-xl" />
            <div className="pointer-events-none absolute bottom-2.5 left-2.5 w-7 h-7 border-b-2 border-l-2 border-amber-400/70 rounded-bl-xl" />
            <div className="pointer-events-none absolute bottom-2.5 right-2.5 w-7 h-7 border-b-2 border-r-2 border-amber-400/70 rounded-br-xl" />

            {/* Top Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-400/25 pb-4 mb-5">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 ${theme.badge}`}
                >
                  {activeDeliveryMode === 'letter_only' ? (
                    <Mail className="w-3.5 h-3.5" />
                  ) : activeDeliveryMode === 'gift_only' ? (
                    <Gift className="w-3.5 h-3.5" />
                  ) : (
                    <Crown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {activeDeliveryMode === 'letter_only'
                      ? '✉️ SURAT KEHORMATAN RESMI BANK NUSANTARA'
                      : activeDeliveryMode === 'gift_only'
                      ? '🎁 KOTAK HADIAH'
                      : '👑 SURAT KEHORMATAN & KOTAK HADIAH'}
                  </span>
                </span>
                <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold flex items-center gap-1 tabular-nums">
                  <Calendar className="w-3 h-3" />
                  <span>{activeEvent.scheduleLabel}</span>
                </span>

                {/* Real-time Claim / Letter Status Pill */}
                {showGiftCard ? (
                  <span
                    className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 border ${
                      isAlreadyClaimedByMe
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-amber-500/20 border-amber-300 text-amber-200 animate-pulse'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      {isAlreadyClaimedByMe
                        ? 'STATUS KOTAK HADIAH: SUDAH DIKLAIM & MASUK OTOMATIS'
                        : 'STATUS KOTAK HADIAH: BELUM DIKLAIM'}
                    </span>
                  </span>
                ) : (
                  <span
                    className={`px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 border ${
                      isLetterOpenedByMe || letterStage === 'opened'
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                        : 'bg-amber-500/20 border-amber-300 text-amber-200 animate-pulse'
                    }`}
                  >
                    <MailOpen className="w-3.5 h-3.5" />
                    <span>
                      {isLetterOpenedByMe || letterStage === 'opened'
                        ? 'STATUS SURAT: SUDAH DIBACA'
                        : 'STATUS SURAT: SURAT RESMI BARU (KLIK AMPLOP UNTUK MEMBACA)'}
                    </span>
                  </span>
                )}
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

            {/* Banner if this gift was transferred from a friend (tanpa daftar/jumlah hadiah) */}
            {transferInfoForMe && (
              <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-950/90 via-indigo-950/80 to-slate-950 border-2 border-cyan-400/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-black text-cyan-200 block">
                      🎁 Kotak Hadiah Ini Ditransfer oleh Teman Anda:{' '}
                      <strong className="text-white">{transferInfoForMe.fromAccountName}</strong> (No. Rek:{' '}
                      {transferInfoForMe.fromAccountNumber})
                    </span>
                    {transferInfoForMe.note && (
                      <span className="text-[11px] text-amber-200 italic block mt-0.5">
                        &ldquo;{transferInfoForMe.note}&rdquo;
                      </span>
                    )}
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono text-[10px] font-bold">
                  Utuh &amp; Siap Anda Buka!
                </span>
              </div>
            )}

            {/* DATE LOCKED VIEW (Tanpa membocorkan daftar/jumlah hadiah) */}
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
                    Segel Amplop Surat Kehormatan &amp; Kotak Hadiah ini{' '}
                    <strong>hanya dapat dibuka sesuai jadwal {activeEvent.scheduleLabel}</strong> (atau
                    setelah Admin menekan Kirim Manual).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 max-w-md mx-auto text-xs text-amber-300 font-mono tabular-nums">
                  📅 Jadwal Buka Resmi: <strong>{activeEvent.scheduleLabel}</strong>
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

            {/* =======================================================================
                OPENABLE VIEW: ADAPTIVE INTERACTIVE CARDS (BOTH / LETTER ONLY / GIFT ONLY)
               ======================================================================= */}
            {isActiveEventOpenable && (
              <div className="space-y-6">
                {/* Title & Guide Banner */}
                <div className="text-center space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-amber-400/50 text-xs font-bold text-amber-200">
                    <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>Kiriman Istimewa Dari: {activeEvent.senderName}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {activeEvent.title}
                  </h2>
                  <p className="text-xs text-slate-300 max-w-2xl mx-auto">
                    {activeDeliveryMode === 'letter_only' ? (
                      <>
                        Arahkan kursor (<em>mouse</em>) ke <strong>Amplop Surat Resmi</strong> di bawah ini dan klik untuk membuka segel lilin kerajaan serta membaca pesan kehormatan dari{' '}
                        <strong className="text-amber-300">{activeEvent.senderName}</strong>.
                      </>
                    ) : activeDeliveryMode === 'gift_only' ? (
                      <>
                        Arahkan kursor (<em>mouse</em>) ke <strong>Kotak Hadiah</strong> di bawah ini untuk membukanya langsung ke rekening, atau transfer kotak yang masih tersegel ke teman Anda.{' '}
                        <span className="text-amber-300 font-semibold">
                          Membuka Kotak Hadiah akan langsung mematikan fitur Transfer ke Teman!
                        </span>
                      </>
                    ) : (
                      <>
                        Arahkan kursor (<em>mouse</em>) ke <strong>Amplop Surat Kehormatan</strong> atau{' '}
                        <strong>Kotak Hadiah</strong> di bawah ini dan klik untuk membukanya.{' '}
                        <span className="text-amber-300 font-semibold">
                          Surat boleh dibuka kapan saja, namun jika ingin transfer ke teman, jangan buka Kotak Hadiahnya terlebih dahulu!
                        </span>
                      </>
                    )}
                  </p>
                </div>

                {/* INTERACTIVE CARDS GRID (1 CENTERED CARD OR 2 SIDE-BY-SIDE CARDS) */}
                <div
                  className={
                    showLetterCard && showGiftCard
                      ? 'grid grid-cols-1 lg:grid-cols-2 gap-5 items-start'
                      : 'max-w-2xl mx-auto w-full'
                  }
                >
                  {/* ===============================================================
                      CARD 1: AMPLOP SURAT KERAJAAN (TAMPIL SAAT 'both' ATAU 'letter_only')
                     =============================================================== */}
                  {showLetterCard && (
                    <div className="space-y-4">
                      {letterStage === 'sealed' && (
                        <div
                          onClick={handleOpenLetterOnly}
                          className="group relative rounded-3xl p-6 bg-gradient-to-br from-[#241907] via-[#121829] to-[#1a1205] border-2 border-amber-400/70 hover:border-amber-300 shadow-xl hover:shadow-[0_0_40px_rgba(251,191,36,0.35)] transition-all duration-300 hover:scale-[1.035] hover:-translate-y-1.5 cursor-pointer select-none text-center space-y-4 overflow-hidden"
                        >
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-400/10 to-amber-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="flex items-center justify-between gap-2 relative z-10">
                            <span className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-200 font-black text-[10px] uppercase tracking-wider">
                              {activeDeliveryMode === 'letter_only'
                                ? '✉️ AMPLOP SURAT RESMI KERAJAAN'
                                : '✉️ KARTU 1 • AMPLOP SURAT RESMI'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-slate-900/90 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-bold group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
                              ✨ Arahkan &amp; Klik Buka Surat
                            </span>
                          </div>

                        {/* Interactive 3D Envelope Visual that scales on hover */}
                        <div className="relative mx-auto w-48 h-36 flex items-center justify-center my-2 transition-transform duration-300 group-hover:scale-110">
                          <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-2xl group-hover:bg-amber-400/45 transition-all" />
                          <div className="relative w-44 h-30 rounded-2xl bg-gradient-to-br from-amber-900 via-[#241908] to-slate-950 border-2 border-amber-300 shadow-2xl flex items-center justify-center overflow-hidden">
                            {/* Envelope Flap Triangle */}
                            <div className="absolute inset-x-0 top-0 h-16 border-b-2 border-amber-300/60 bg-gradient-to-b from-amber-400/25 to-transparent transform origin-top transition-transform duration-300 group-hover:scale-y-90" />
                            {/* Wax Seal Center */}
                            <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-100 shadow-xl flex flex-col items-center justify-center group-hover:rotate-6 transition-transform">
                              <Mail className="w-6 h-6 text-slate-950" />
                              <span className="text-[6.5px] font-black text-slate-950 tracking-widest uppercase mt-0.5">
                                ROYAL SEAL
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 relative z-10">
                          <h3 className="text-lg font-black text-white group-hover:text-amber-200 transition-colors">
                            Amplop Surat Kehormatan
                          </h3>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            Berisi surat resmi berstempel kerajaan dari{' '}
                            <strong className="text-amber-300">{activeEvent.senderName}</strong>. Bebas dibuka kapan saja tanpa membuka Kotak Hadiah!
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLetterOnly();
                          }}
                          className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <MailOpen className="w-4 h-4" />
                          <span>Buka Amplop Surat Sekarang</span>
                        </button>
                      </div>
                    )}

                    {letterStage === 'opening' && (
                      <div className="rounded-3xl p-8 bg-gradient-to-br from-[#241907] via-slate-950 to-[#1a1205] border-2 border-amber-400 text-center space-y-4 shadow-2xl">
                        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-amber-400/50 blur-xl animate-ping" />
                          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-300 to-yellow-500 border-2 border-white flex items-center justify-center animate-bounce shadow-2xl">
                            <MailOpen className="w-10 h-10 text-slate-950" />
                          </div>
                        </div>
                        <h4 className="text-base font-black text-amber-200">
                          Membuka Segel Lilin Amplop Surat Kerajaan...
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Menampilkan lembar akta kehormatan &amp; stempel resmi Bank Nusantara
                        </p>
                      </div>
                    )}

                    {letterStage === 'opened' && (
                      <div className="relative rounded-3xl bg-gradient-to-br from-[#231907] via-[#0d1324] to-[#191105] border-[3px] border-double border-amber-400/90 ring-2 ring-amber-300/30 p-5 sm:p-6 shadow-[0_0_45px_rgba(251,191,36,0.22)] overflow-hidden space-y-4 animate-fadeIn">
                        {/* Ornate Inner Gold Filigree Frame */}
                        <div className="pointer-events-none absolute inset-2 rounded-2xl border border-amber-300/30" />
                        <div className="pointer-events-none absolute top-3.5 left-3.5 text-amber-400/70 text-xs select-none">
                          ✦
                        </div>
                        <div className="pointer-events-none absolute top-3.5 right-3.5 text-amber-400/70 text-xs select-none">
                          ✦
                        </div>
                        <div className="pointer-events-none absolute bottom-3.5 left-3.5 text-amber-400/70 text-xs select-none">
                          ✦
                        </div>
                        <div className="pointer-events-none absolute bottom-3.5 right-3.5 text-amber-400/70 text-xs select-none">
                          ✦
                        </div>

                        {/* Royal Watermark Background */}
                        <div className="pointer-events-none select-none absolute inset-0 flex items-center justify-center opacity-[0.06]">
                          <div className="text-center rotate-[-15deg] space-y-1">
                            <Crown className="w-40 h-40 text-amber-300 mx-auto" />
                            <span className="font-serif font-black text-2xl tracking-[0.25em] text-amber-200 uppercase block">
                              {activeEvent.watermarkText || 'BANK NUSANTARA ROYAL'}
                            </span>
                          </div>
                        </div>

                        {/* Top Royal Crest Ribbon */}
                        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-amber-500/20 via-yellow-400/15 to-amber-500/20 border border-amber-400/40 rounded-2xl px-3.5 py-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest">
                            <Crown className="w-3.5 h-3.5 text-amber-400" />
                            <span>ROYAL DECREE &amp; SULTAN CERTIFICATE</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLetterStage('sealed')}
                            className="text-[10px] font-bold text-amber-200 hover:text-white underline cursor-pointer"
                          >
                            Lipat Kembali Amplop
                          </button>
                        </div>

                        {/* Letter Header */}
                        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3 border-b-2 border-double border-amber-400/35 pb-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-100 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/30 shrink-0">
                              <MailOpen className="w-6 h-6" />
                            </div>
                            <div>
                              <span className="text-[9.5px] font-mono uppercase tracking-[0.2em] text-amber-400 font-bold block">
                                {activeEvent.customStampText || 'SURAT KEHORMATAN RESMI • BANK NUSANTARA'}
                              </span>
                              <h3 className="font-serif font-black text-white text-base sm:text-lg tracking-wide">
                                PT BANK NUSANTARA (PERSERO) TBK
                              </h3>
                              <span className="text-[11px] text-amber-200/95 font-semibold block">
                                Kepada Yth: <strong className="text-white">{currentAccount.fullName}</strong> (No. Rek:{' '}
                                <span className="font-mono">{currentAccount.accountNumber}</span>)
                              </span>
                            </div>
                          </div>

                          <div className="text-left sm:text-right space-y-1 shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-amber-400/50 text-amber-300 font-mono text-[9.5px] font-black block tabular-nums">
                              NO. SERI: {buildLetterSerialNumber(activeEvent, currentAccount.accountNumber)}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-200 font-mono text-[9.5px] font-bold inline-flex items-center gap-1 tabular-nums">
                              <Calendar className="w-3 h-3" />
                              <span>{activeEvent.scheduleLabel}</span>
                            </span>
                          </div>
                        </div>

                        {/* Letter Body with Royal Parchment Quote Box */}
                        <div className="relative z-10 p-4 rounded-2xl bg-slate-950/60 border border-amber-400/25 shadow-inner space-y-2">
                          <div className="flex items-center gap-1 text-amber-300/80 text-[10px] font-serif italic">
                            <Star className="w-3 h-3 fill-current" />
                            <span>Pesan Kehormatan dari {activeEvent.senderName}:</span>
                          </div>
                          <p className="text-xs sm:text-sm text-amber-50/95 leading-relaxed whitespace-pre-line font-serif tracking-wide">
                            {activeEvent.letterMessage}
                          </p>
                        </div>

                        {/* Letter Footer: 3D Official Stamp + Signature Block */}
                        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4 border-t-2 border-double border-amber-400/30 pt-4">
                          <div className="flex items-center gap-3">
                            <OfficialStampBadge
                              config={activeEvent.customSealConfig || defaultLetterSealConfig}
                            />
                            <div className="text-[10px] text-slate-300 space-y-0.5">
                              <span className="font-black text-amber-300 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5" />
                                <span>AKTA &amp; STEMPEL SAH TERVERIFIKASI</span>
                              </span>
                              <span className="block text-slate-400 font-mono text-[9px] tabular-nums">
                                Hash: {activeEvent.securityHashToken || 'BN-ROYAL-SEAL-VERIFIED'}
                              </span>
                              <span className="block text-emerald-300 font-mono text-[9px]">
                                ✓ Surat dapat dibaca tanpa membuka hadiah
                              </span>
                            </div>
                          </div>

                          <OfficialSignatureBlock
                            config={activeEvent.customSealConfig || defaultLetterSealConfig}
                            fallbackSenderName={activeEvent.senderName}
                          />
                        </div>
                      </div>
                    )}
                    </div>
                  )}

                  {/* ===============================================================
                      CARD 2: KOTAK HADIAH + PANEL TRANSFER KE TEMAN (TAMPIL SAAT 'both' ATAU 'gift_only')
                     =============================================================== */}
                  {showGiftCard && (
                    <div className="space-y-4">
                      {giftStage === 'sealed' && !isTransferredOutByMe && (
                        <div
                          onClick={handleOpenAndClaimGiftBox}
                          className="group relative rounded-3xl p-6 bg-gradient-to-br from-emerald-950/85 via-[#0f172a] to-amber-950/75 border-2 border-emerald-400/75 hover:border-amber-300 shadow-xl hover:shadow-[0_0_46px_rgba(251,191,36,0.45)] transition-all duration-300 hover:scale-[1.035] hover:-translate-y-1.5 cursor-pointer select-none text-center space-y-4 overflow-hidden"
                        >
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-amber-500/0 via-amber-400/15 to-emerald-300/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <div className="flex items-center justify-between gap-2 relative z-10">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-400/20 border border-emerald-400/50 text-emerald-200 font-black text-[10px] uppercase tracking-wider">
                              {activeDeliveryMode === 'gift_only'
                                ? '🎁 KOTAK HADIAH'
                                : '🎁 KARTU 2 • KOTAK HADIAH'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                              BELUM DIBUKA
                            </span>
                          </div>

                          {/* Interactive 3D Gift Box Visual with Golden Glow & Wiggling Ribbon on hover */}
                          <div className="relative mx-auto w-48 h-36 flex items-center justify-center my-2 transition-transform duration-300 group-hover:scale-110">
                            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl group-hover:bg-amber-400/55 transition-all duration-300" />
                            <div className="gift-box-hover-wiggle relative w-36 h-30 rounded-3xl bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 border-2 border-amber-100 shadow-2xl flex flex-col items-center justify-center overflow-hidden transition-transform">
                              {/* Ribbon Cross */}
                              <div className="pointer-events-none absolute inset-y-0 w-5 bg-rose-600/90 border-x border-amber-100/60" />
                              <div className="pointer-events-none absolute inset-x-0 h-5 bg-rose-600/90 border-y border-amber-100/60" />
                              <div className="relative z-10 w-14 h-14 rounded-2xl bg-slate-950/90 border-2 border-amber-200 flex items-center justify-center shadow-lg">
                                <Gift className="w-7 h-7 text-amber-300" />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5 relative z-10">
                            <h3 className="text-lg font-black text-white group-hover:text-amber-200 transition-colors">
                              Kotak Hadiah
                            </h3>
                            <p className="text-xs text-slate-300 leading-relaxed">
                              Klik untuk membuka Kotak Hadiah dan langsung masuk ke rekening
                            </p>
                          </div>

                          {/* Peringatan singkat bahwa membuka Kotak Hadiah otomatis mematikan Transfer ke Teman */}
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="relative z-10 p-3 rounded-2xl bg-amber-950/55 border border-amber-400/45 text-amber-200 text-[11px] leading-snug flex items-start gap-2 text-left"
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Perhatian:</strong> Menekan tombol <strong>Buka Kotak Hadiah</strong> akan langsung mematikan fitur Transfer Hadiah ke Teman secara permanen.
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenAndClaimGiftBox();
                            }}
                            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Buka Kotak Hadiah</span>
                          </button>
                        </div>
                      )}

                      {/* OPENING ANIMATION FOR GIFT BOX (MISTERI BERSINAR BERPUTAR TANPA BOCORAN) */}
                      {giftStage === 'opening' && (
                        <div className="rounded-3xl p-8 bg-gradient-to-br from-amber-950/75 via-slate-950 to-emerald-950/75 border-2 border-amber-400 text-center space-y-4 shadow-2xl">
                          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full bg-amber-400/55 blur-xl animate-ping" />
                            <div className="gift-mystery-open-spin relative w-20 h-20 rounded-3xl bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-500 border-2 border-white flex items-center justify-center shadow-2xl">
                              <Gift className="w-10 h-10 text-slate-950" />
                            </div>
                          </div>
                          <h4 className="text-base sm:text-lg font-black text-amber-200">
                            Membuka Kotak Hadiah...
                          </h4>
                          <p className="text-xs text-slate-300">
                            Sedang membuka pita Kotak Hadiah dan memasukkan isinya otomatis ke rekening Anda.
                          </p>
                        </div>
                      )}

                      {/* OPENED / CLAIMED GIFT BOX VIEW (MENAMPILKAN DAFTAR HADIAH LENGKAP SETELAH DIBUKA) */}
                      {giftStage === 'opened' && (
                        <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-950/75 via-slate-950 to-slate-900 border-2 border-emerald-400/80 shadow-2xl space-y-4 animate-fadeIn">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-400/25 pb-3">
                            <div className="flex items-center gap-2">
                              <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-400/60 flex items-center justify-center text-emerald-300">
                                <PackageOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider inline-block">
                                  ✓ SUDAH DIKLAIM &amp; OTOMATIS MASUK KE REKENING
                                </span>
                                <h4 className="font-black text-white text-sm mt-0.5">
                                  Isi Kotak Hadiah ({activeEvent.rewards.length} Item)
                                </h4>
                              </div>
                            </div>
                          </div>

                          {claimResult && (
                            <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 text-xs flex items-start gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{claimResult.message}</span>
                            </div>
                          )}

                          {/* Live Updated Account Balances */}
                          <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs font-mono">
                            <div className="flex items-center gap-2 text-emerald-300">
                              <Banknote className="w-4 h-4 shrink-0" />
                              <div className="truncate">
                                <span className="text-[9px] text-slate-400 block">Saldo Rekening</span>
                                <strong className="tabular-nums">{formatRupiah(currentAccount.balance)}</strong>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-amber-300">
                              <Coins className="w-4 h-4 shrink-0" />
                              <div className="truncate">
                                <span className="text-[9px] text-slate-400 block">Koin &amp; Emas 24K</span>
                                <strong className="tabular-nums">
                                  {(currentAccount.spinCoins || 0).toLocaleString('id-ID')} Coin •{' '}
                                  {(currentAccount.goldGrams || 0).toLocaleString('id-ID')}g
                                </strong>
                              </div>
                            </div>
                          </div>

                          {activeAccountRole && (
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-400/50 flex items-center justify-between gap-2 text-xs">
                              <span className="text-slate-200 flex items-center gap-1.5">
                                <Crown className="w-3.5 h-3.5 text-amber-400" />
                                <span>Role Aktif:</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full border font-black text-[10px] ${
                                    getDevBadgeColorStyle(activeAccountRole.badgeColor).pillClass
                                  }`}
                                >
                                  {activeAccountRole.name}
                                </span>
                              </span>
                            </div>
                          )}

                          {/* Daftar Hadiah Lengkap (Baru tampil SETELAH Kotak Hadiah dibuka) */}
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
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
                                        <span className="text-[10px] text-emerald-400 font-semibold block">
                                          {targetRole
                                            ? `✓ Role ${targetRole.name} Aktif`
                                            : '✓ Sudah Masuk Otomatis ke Rekening'}
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
                      )}

                      {/* ===============================================================
                          TRANSFER UNOPENED GIFT BOX TO A FRIEND
                          AKTIF SAAT BELUM DIBUKA; LANGSUNG TERKUNCI MATI SAAT KLIK BUKA KOTAK
                         =============================================================== */}
                      {!isTransferDisabledNow ? (
                        <div className="rounded-3xl p-5 bg-slate-950/95 border-2 border-cyan-400/50 space-y-3 shadow-xl">
                          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                                <Users className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-black text-cyan-200 text-xs sm:text-sm">
                                  Kirim / Transfer Kotak Hadiah Ini ke Teman
                                </h4>
                                <span className="text-[10px] text-slate-400 block">
                                  Surat boleh Anda buka, namun jangan tekan Buka Kotak Hadiah jika ingin dikirim ke teman!
                                </span>
                              </div>
                            </div>
                          </div>

                          {transferFeedback && (
                            <div
                              className={`p-3 rounded-xl border text-xs font-bold ${
                                transferFeedback.success
                                  ? 'bg-emerald-950/80 border-emerald-400/60 text-emerald-200'
                                  : 'bg-rose-950/80 border-rose-400/60 text-rose-200'
                              }`}
                            >
                              {transferFeedback.message}
                            </div>
                          )}

                          {!isTransferredOutByMe && (
                            <form onSubmit={handleTransferGiftToFriend} className="space-y-2.5 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                                  1. Pilih dari Daftar Akun Teman ({friendAccounts.length} Akun):
                                </label>
                                <select
                                  value={selectedFriendAccountNo}
                                  onChange={(e) => {
                                    setSelectedFriendAccountNo(e.target.value);
                                    if (e.target.value) setManualFriendQuery(e.target.value);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs"
                                >
                                  <option value="">-- Pilih Akun Teman --</option>
                                  {friendAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.accountNumber}>
                                      {acc.fullName} — No. Rek: {acc.accountNumber} ({acc.cardTier.toUpperCase()})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                                  2. Atau Ketik Nomor Rekening / Nama Teman:
                                </label>
                                <input
                                  type="text"
                                  value={manualFriendQuery}
                                  onChange={(e) => setManualFriendQuery(e.target.value)}
                                  placeholder="Ketik 10 digit No. Rekening atau nama teman..."
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-200 font-mono text-xs"
                                />
                              </div>

                              <div>
                                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                                  3. Pesan Pengantar untuk Teman (Opsional):
                                </label>
                                <input
                                  type="text"
                                  value={transferNote}
                                  onChange={(e) => setTransferNote(e.target.value)}
                                  placeholder="Contoh: Selamat ya bro, Kotak Hadiah ini buat kamu!"
                                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                                />
                              </div>

                              <button
                                type="submit"
                                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Transfer Kotak Hadiah ke Teman Sekarang</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </form>
                          )}
                        </div>
                      ) : (
                        <div className="rounded-3xl p-5 bg-slate-950/85 border-2 border-slate-700/80 space-y-2.5 opacity-85 select-none">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-rose-400 shrink-0">
                                <Lock className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-black text-slate-200 text-xs sm:text-sm">
                                  Transfer Hadiah ke Teman Terkunci
                                </h4>
                                <span className="text-[10.5px] text-rose-300 font-semibold block">
                                  Fitur transfer otomatis dimatikan karena Kotak Hadiah sudah dibuka dan tidak bisa ditransfer lagi.
                                </span>
                              </div>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-black text-[9.5px] uppercase shrink-0">
                              🔒 MATI OTOMATIS
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Footer Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-amber-400/20">
                  <span className="text-[11px] text-slate-400">
                    Anda dapat melihat kembali kiriman ini kapan saja melalui{' '}
                    <strong className="text-amber-300">Popup Pojok Kanan Bawah</strong>.
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
                      Amplop surat &amp; kotak hadiah tersimpan rapi
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
                  const evMode = ev.deliveryContentMode || 'both';
                  const isLetterOnly = evMode === 'letter_only';
                  const isGiftOnly = evMode === 'gift_only';
                  const isCompletedForMe = isLetterOnly ? isViewed : isClaimed;
                  return (
                    <div
                      key={ev.id}
                      className={`p-3 rounded-xl border transition-all space-y-2 ${
                        !openable
                          ? 'bg-slate-950/75 border-rose-500/40'
                          : !isCompletedForMe
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
                            {isLetterOnly ? `✉️ ${ev.title}` : `🎁 ${ev.title}`}
                          </h5>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black shrink-0 ${
                            !openable
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : isCompletedForMe
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {!openable
                            ? `🔒 Buka ${ev.scheduleLabel}`
                            : isLetterOnly
                            ? isViewed
                              ? '✓ Surat Dibaca'
                              : '✉️ Surat Baru!'
                            : isClaimed
                            ? '✓ Sudah Diklaim'
                            : 'Belum Dibuka!'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {isLetterOnly
                            ? `✉️ Amplop Surat • ${isViewed ? 'Sudah Dibaca' : 'Belum Dibaca'}`
                            : isGiftOnly
                            ? `🎁 Kotak Hadiah`
                            : `🎁 Kotak Hadiah • ${isViewed ? 'Surat Dibaca' : 'Surat Baru'}`}
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
                          ) : isLetterOnly ? (
                            <>
                              <MailOpen className="w-3 h-3" />
                              <span>{isViewed ? 'Baca Ulang Surat' : 'Buka Amplop Surat'}</span>
                            </>
                          ) : isGiftOnly ? (
                            <>
                              <Gift className="w-3 h-3" />
                              <span>{isClaimed ? 'Lihat Kotak Hadiah' : 'Buka Kotak Hadiah'}</span>
                            </>
                          ) : isClaimed ? (
                            <>
                              <RotateCcw className="w-3 h-3" />
                              <span>Lihat Surat &amp; Kotak Hadiah</span>
                            </>
                          ) : (
                            <>
                              <Gift className="w-3 h-3" />
                              <span>Buka Amplop / Kotak Hadiah</span>
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
