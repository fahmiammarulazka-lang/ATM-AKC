/**
 * Interactive 3D ATM Card Visualizer
 * Includes:
 * 1. BANNED Card Visual Overlay ("BANNED" stamp + "Tinjauan Alasan" + Custom/Permanent Duration rules)
 *    - If Permanent: Cannot be appealed/reviewed anymore ("Tidak dapat ditinjau lagi"), but can still be unbanned in Admin Panel.
 *    - If Custom: Shows duration/expiry and allows submitting "Tinjauan Alasan" appeal to Admin Panel.
 * 2. Switch Card to Another Card Without Creating a New Card ("Ganti Kartu ke Kartu Lain Cukup Memasukkan Kode Admin, Bukan Kode Kartu")
 */
import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Info,
  Sparkles,
  CheckCircle2,
  Copy,
  KeyRound,
  Ban,
  ShieldAlert,
  Clock,
  Send,
  Layers,
  X,
} from 'lucide-react';
import { BankAccount, CardTier } from '../types/bank';
import { CARD_TIER_CONFIGS, formatRupiah, formatBanRemainingTime } from '../utils/bankUtils';
import { useBank } from '../context/BankContext';
import { PinPromptModal } from './PinPromptModal';
import { AdminPinModal } from './AdminPinModal';
import { VerifiedBadge } from './VerifiedBadge';

interface CardVisualizerProps {
  account: BankAccount;
  showInspector?: boolean;
}

export const CardVisualizer: React.FC<CardVisualizerProps> = ({ account, showInspector = true }) => {
  const {
    accounts,
    toggleCardFreezeWithPin,
    regenerateAccountNumberWithPin,
    switchCardWithAdminCode,
    loginToCardWithPin,
    submitCardBanAppeal,
  } = useBank();

  const [isFlipped, setIsFlipped] = useState(false);
  const [showFullCardNumber, setShowFullCardNumber] = useState(false);
  const [, setActiveHotspot] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setBanTick] = useState(0);

  // Card PIN prompt state (for freeze/unfreeze)
  const [pinPromptAction, setPinPromptAction] = useState<'freeze' | 'unfreeze' | null>(null);

  // Admin Code prompt state (for switching card or regenerating account number without card PIN)
  const [showAdminCodeForRegen, setShowAdminCodeForRegen] = useState(false);
  const [showSwitchCardModal, setShowSwitchCardModal] = useState(false);
  const [switchMode, setSwitchMode] = useState<'tier' | 'account'>('tier');
  const [selectedSwitchTier, setSelectedSwitchTier] = useState<CardTier>(account.cardTier);
  const [selectedSwitchAccountId, setSelectedSwitchAccountId] = useState<string>(account.id);
  const [regenerateDigitsOnSwitch, setRegenerateDigitsOnSwitch] = useState<boolean>(false);
  const [showAdminPinForSwitch, setShowAdminPinForSwitch] = useState<boolean>(false);
  const [showOldCardPinForSwitch, setShowOldCardPinForSwitch] = useState<boolean>(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Ban appeal state (only for custom duration ban)
  const [appealInput, setAppealInput] = useState<string>(
    'Mohon tinjau kembali status Banned pada kartu saya. Saya siap mematuhi ketentuan transaksi Bank Nusantara.'
  );

  const tierConfig = CARD_TIER_CONFIGS[account.cardTier] || CARD_TIER_CONFIGS.regular;
  const isBanned = account.cardStatus === 'banned';
  const isFrozen = account.cardStatus === 'frozen';
  const isPending = account.cardStatus === 'pending';
  const isRejected = account.cardStatus === 'rejected';
  const banInfo = account.banInfo;

  // Live 1-second tick for temporary ban countdown
  useEffect(() => {
    if (!isBanned || banInfo?.durationType !== 'custom') return;
    const timer = setInterval(() => {
      setBanTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isBanned, banInfo?.durationType, banInfo?.expiresAt]);

  const liveBanCountdown =
    isBanned && banInfo?.durationType === 'custom' && banInfo?.expiresAt
      ? formatBanRemainingTime(banInfo.expiresAt)
      : null;

  const selectedTargetSwitchAccount =
    accounts.find((a) => a.id === selectedSwitchAccountId) || account;

  const displayCardNumber = showFullCardNumber
    ? account.cardNumber
    : `${account.cardNumber.slice(0, 4)} •••• •••• ${account.cardNumber.slice(-4)}`;

  const handleCopyAcc = () => {
    navigator.clipboard.writeText(account.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePinSuccess = () => {
    if (pinPromptAction === 'freeze' || pinPromptAction === 'unfreeze') {
      toggleCardFreezeWithPin(account.id, account.pin);
    }
    setPinPromptAction(null);
  };

  const handleExecuteSwitchWithAdminCode = () => {
    setShowAdminPinForSwitch(false);
    const res = switchCardWithAdminCode({
      adminCode: '159357',
      targetCardTier: selectedSwitchTier,
      regenerateCardDigits: regenerateDigitsOnSwitch,
    });
    setFeedbackNotice(res.message);
    setShowSwitchCardModal(false);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleExecuteSwitchWithOldCardPin = () => {
    setShowOldCardPinForSwitch(false);
    const res = loginToCardWithPin({
      targetAccountId: selectedTargetSwitchAccount.id,
      cardPin: selectedTargetSwitchAccount.pin,
    });
    setFeedbackNotice(res.message);
    setShowSwitchCardModal(false);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  const handleBanAppealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = submitCardBanAppeal(account.id, appealInput);
    setFeedbackNotice(res.message);
    setTimeout(() => setFeedbackNotice(null), 5000);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto">
      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className="w-full mb-3 px-4 py-2.5 bg-emerald-950/90 border border-emerald-500/50 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackNotice}</span>
          </div>
          <button onClick={() => setFeedbackNotice(null)} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Status Warning Banner if Frozen */}
      {isFrozen && (
        <div className="w-full mb-3 px-4 py-2.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-center justify-between text-rose-300 text-xs shadow-lg">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Kartu sedang diblokir sementara. Butuh PIN untuk buka blokir.</span>
          </div>
          <button
            onClick={() => setPinPromptAction('unfreeze')}
            className="text-white bg-rose-600 hover:bg-rose-500 px-3 py-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1"
          >
            <KeyRound className="w-3 h-3" />
            <span>Buka Blokir</span>
          </button>
        </div>
      )}

      {isPending && (
        <div className="w-full mb-3 px-4 py-2.5 bg-amber-500/15 border border-amber-500/40 rounded-2xl flex items-center gap-2 text-amber-300 text-xs">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
          <span>Kartu sedang diproses oleh sistem Bank Nusantara. Mohon tunggu sebentar.</span>
        </div>
      )}

      {isRejected && (
        <div className="w-full mb-3 px-4 py-2.5 bg-red-950/60 border border-red-500/40 rounded-2xl text-red-200 text-xs">
          <p className="font-semibold flex items-center gap-1.5 text-red-400">
            <span>❌ Permohonan Kartu Ditolak</span>
          </p>
          <p className="mt-1 text-[11px] text-red-300">{account.rejectionReason}</p>
        </div>
      )}

      {/* 3D Card Container */}
      <div className="relative w-full aspect-[1.586/1] perspective-1000 select-none">
        <div
          className={`relative w-full h-full duration-700 transform-style-preserve-3d transition-transform ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* FRONT OF CARD */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl p-5 md:p-6 text-white shadow-2xl backface-hidden overflow-hidden flex flex-col justify-between ${
              isBanned
                ? 'bg-gradient-to-br from-rose-950 via-zinc-950 to-red-950 border-2 border-rose-500 shadow-rose-950/80'
                : account.cardTier === 'regular'
                ? 'bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 border border-blue-400/30 shadow-blue-900/40'
                : account.cardTier === 'gold'
                ? 'bg-gradient-to-br from-amber-600 via-yellow-600 to-amber-950 border border-yellow-300/40 shadow-amber-900/40'
                : account.cardTier === 'platinum'
                ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 border border-emerald-400/40 shadow-emerald-950/50'
                : account.cardTier === 'admin'
                ? 'bg-gradient-to-br from-purple-800 via-fuchsia-900 to-indigo-950 border-2 border-fuchsia-400/80 shadow-fuchsia-950/80'
                : 'bg-gradient-to-br from-zinc-900 via-stone-900 to-zinc-950 border-2 border-amber-500/50 shadow-black/80'
            }`}
          >
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-xl" />
            <div className="absolute right-3 bottom-3 opacity-10 text-6xl font-black italic tracking-tighter pointer-events-none">
              {account.cardTier === 'admin' ? '∞ INFINITY' : 'NUSANTARA'}
            </div>

            {/* =========================================================================
                BANNED OVERLAY STAMP DIRECTLY ON THE CARD SCREEN
                ("Di layar kartu yang aku banned itu, kartunya ada tulisan BANNED dan ada tulisan Tinjauan Alasan")
               ========================================================================= */}
            {isBanned && (
              <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                <div className="border-4 border-rose-500 bg-rose-950/95 px-5 py-1.5 rounded-2xl shadow-2xl transform -rotate-3 mb-2">
                  <span className="font-mono font-black text-2xl sm:text-3xl tracking-[0.25em] text-rose-400 drop-shadow">
                    🚫 BANNED
                  </span>
                </div>

                <div className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/50 text-[10px] font-mono font-bold text-rose-200 uppercase tracking-wider mb-1.5">
                  Durasi: {banInfo?.durationType === 'permanent' ? 'PERMANEN (TIDAK DAPAT DITINJAU LAGI)' : `CUSTOM • ${banInfo?.durationLabel}`}
                </div>

                {liveBanCountdown && (
                  <div className="mb-2 px-3 py-1 rounded-lg bg-amber-500/25 border border-amber-400/60 text-amber-200 font-mono font-extrabold text-[11px] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                    <span>Buka Otomatis Dalam: {liveBanCountdown.text}</span>
                  </div>
                )}

                {/* Tinjauan Alasan Box right on the card */}
                <div className="w-full max-w-[92%] bg-slate-950/95 border border-rose-500/50 rounded-xl p-2.5 text-left space-y-0.5 shadow-lg">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                    📋 Tinjauan Alasan Admin:
                  </span>
                  <p className="text-[11px] text-white font-medium line-clamp-2">
                    {banInfo?.reason
                      ? `"${banInfo.reason}"`
                      : 'Tidak ada alasan spesifik (Alasan opsional dikosongkan oleh Admin).'}
                  </p>
                </div>
              </div>
            )}

            {/* Top Bar: Bank Logo & Card Tier */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <CreditCard className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm tracking-wider uppercase font-mono leading-none">
                      BANK NUSANTARA
                    </h3>
                    {account.isVerified && (
                      <VerifiedBadge size="xs" showText text="VERIFIED" label={account.verifiedLabel} />
                    )}
                  </div>
                  <span className="text-[10px] text-white/70 tracking-widest uppercase">
                    Mandiri Debit Digital
                  </span>
                </div>
              </div>

              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full backdrop-blur-md border border-white/20 ${tierConfig.badgeColor}`}
              >
                {tierConfig.name}
              </span>
            </div>

            {/* Middle Section: EMV Chip & Contactless wave */}
            <div className="relative z-10 flex items-center justify-between my-auto">
              <div
                onClick={() => setActiveHotspot('chip')}
                className="relative group cursor-pointer"
                title="Bagian Chip ATM"
              >
                <div className="w-12 h-9 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-300/80 shadow-md flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105">
                  <div className="absolute inset-0 border border-black/20 rounded-md"></div>
                  <div className="w-full h-[1px] bg-black/30 absolute top-1/3"></div>
                  <div className="w-full h-[1px] bg-black/30 absolute bottom-1/3"></div>
                  <div className="h-full w-[1px] bg-black/30 absolute left-1/3"></div>
                  <div className="h-full w-[1px] bg-black/30 absolute right-1/3"></div>
                  <div className="w-4 h-3 rounded-sm border border-black/40 bg-amber-300/50"></div>
                </div>
              </div>

              <div className="flex items-center gap-1 opacity-75">
                <svg className="w-6 h-6 rotate-90 text-white/80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
                  <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
                  <circle cx="12" cy="20" r="1"></circle>
                </svg>
              </div>
            </div>

            {/* Bottom Section: Card Number, Name, Expiry */}
            <div className="relative z-10 space-y-2">
              <div
                onClick={() => setActiveHotspot('number')}
                className="font-mono text-base sm:text-lg md:text-xl font-semibold tracking-[0.18em] cursor-pointer hover:text-amber-200 transition-colors drop-shadow"
                title="Nomor Kartu 16 Digit"
              >
                {displayCardNumber}
              </div>

              <div className="flex items-end justify-between pt-1 text-[11px] sm:text-xs">
                <div>
                  <div className="text-[9px] uppercase tracking-wider text-white/60">
                    Nama Pemilik
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="font-semibold tracking-wide uppercase truncate max-w-[175px]">
                      {account.fullName}
                    </div>
                    {account.isVerified && (
                      <VerifiedBadge size="sm" label={account.verifiedLabel} />
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[9px] uppercase tracking-wider text-white/60">
                    Masa Berlaku
                  </div>
                  <div className="font-mono font-semibold tracking-wider">
                    {account.expiryDate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BACK OF CARD */}
          <div
            className={`absolute inset-0 w-full h-full rounded-2xl pt-4 pb-5 px-5 text-white shadow-2xl backface-hidden rotate-y-180 flex flex-col justify-between overflow-hidden ${
              account.cardTier === 'regular'
                ? 'bg-gradient-to-bl from-indigo-950 via-blue-900 to-blue-950 border border-blue-400/30'
                : account.cardTier === 'gold'
                ? 'bg-gradient-to-bl from-amber-950 via-yellow-900 to-amber-900 border border-yellow-300/40'
                : account.cardTier === 'platinum'
                ? 'bg-gradient-to-bl from-teal-950 via-emerald-900 to-slate-950 border border-emerald-400/40'
                : account.cardTier === 'admin'
                ? 'bg-gradient-to-bl from-indigo-950 via-fuchsia-950 to-purple-950 border-2 border-fuchsia-400/70'
                : 'bg-gradient-to-bl from-black via-zinc-900 to-neutral-950 border-2 border-amber-500/50'
            }`}
          >
            <div className="-mx-5 mt-1 h-10 bg-black/90 shadow-inner flex items-center px-4">
              <span className="text-[9px] font-mono tracking-widest text-white/40">
                BANK NUSANTARA MAGNETIC STRIP • SECURE TRANSACTION
              </span>
            </div>

            <div className="my-auto space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-8 bg-white/90 rounded px-3 flex items-center justify-start text-slate-800 italic font-serif text-xs border border-slate-300">
                  <span className="opacity-80">{account.fullName}</span>
                </div>
                <div
                  className="bg-white text-slate-900 font-mono font-bold text-xs px-2.5 py-1.5 rounded border border-slate-300"
                  title="Kode Keamanan CVV (3 Digit)"
                >
                  <span className="text-[9px] text-slate-500 block text-right font-sans font-normal">CVV</span>
                  {account.cvv}
                </div>
              </div>
              <p className="text-[9px] text-white/60 leading-tight">
                Kode Keamanan (CVV 3 digit) diacak otomatis oleh sistem. Jaga kerahasiaan nomor ini dan kode PIN 6 digit Anda.
              </p>
            </div>

            <div className="flex items-center justify-between text-[10px] text-white/70 border-t border-white/10 pt-2">
              <span>Layanan Pelanggan: 1500-888</span>
              <span className="font-mono">banknusantara.co.id</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DETAILED BANNED CARD PANEL (TINJAUAN ALASAN & DURASI CUSTOM / PERMANEN)
         ========================================================================= */}
      {isBanned && (
        <div className="w-full mt-4 p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 text-xs space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-rose-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
              <div>
                <h4 className="font-black text-rose-300 text-sm uppercase tracking-wider">
                  KARTU INI DI-BANNED OLEH ADMIN
                </h4>
                <span className="text-[10px] text-rose-200 font-mono">
                  Waktu Banned: {banInfo?.bannedAt ? new Date(banInfo.bannedAt).toLocaleString('id-ID') : 'Baru saja'}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-mono font-black text-[10px] uppercase">
              BANNED
            </span>
          </div>

          {/* Tinjauan Alasan Box */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-rose-500/40 space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
              📋 Tinjauan Alasan Banned:
            </span>
            <p className="text-white text-xs leading-relaxed">
              {banInfo?.reason ? (
                <strong>"{banInfo.reason}"</strong>
              ) : (
                <span className="italic text-slate-300">
                  Tidak ada catatan alasan spesifik (Alasan bersifat opsional di Panel Admin).
                </span>
              )}
            </p>
          </div>

          {/* Durasi & Hak Tinjauan */}
          <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Durasi Banned:</span>
              </span>
              <span className="font-mono font-bold text-amber-300">
                {banInfo?.durationType === 'permanent' ? 'PERMANEN' : `CUSTOM (${banInfo?.durationLabel})`}
              </span>
            </div>

            {banInfo?.durationType === 'custom' && banInfo.expiresAt && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Berakhir Pada:</span>
                  <span className="font-mono text-cyan-300">
                    {new Date(banInfo.expiresAt).toLocaleString('id-ID')} WIB
                  </span>
                </div>
                {liveBanCountdown && (
                  <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-400/50 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                      <span>Hitung Mundur Buka Otomatis:</span>
                    </span>
                    <span className="font-mono font-black text-sm text-amber-300">
                      {liveBanCountdown.text}
                    </span>
                  </div>
                )}
              </div>
            )}

            {banInfo?.durationType === 'permanent' ? (
              <div className="p-2.5 rounded-xl bg-red-950 border border-rose-500/60 text-rose-200 text-[11px] leading-relaxed">
                <strong className="text-rose-300 block mb-0.5">
                  ⛔ BANNED PERMANEN — TIDAK DAPAT DITINJAU LAGI
                </strong>
                Kartu yang di-banned dengan durasi <strong>Permanen</strong> tidak dapat diajukan tinjauan ulang oleh nasabah. Namun status Banned ini <strong>masih bisa dibuka kapan saja oleh Admin di Panel Admin</strong>.
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-800">
                {banInfo?.appealStatus === 'pending' ? (
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-400/50 text-amber-200 text-[11px]">
                    ⏳ <strong>Tinjauan Alasan Terkirim:</strong> Permohonan buka Banned Anda sedang menunggu pemeriksaan di Panel Admin.
                  </div>
                ) : (
                  <form onSubmit={handleBanAppealSubmit} className="space-y-2">
                    <label className="text-[11px] font-bold text-amber-300 block">
                      Ajukan Tinjauan Alasan ke Admin (Khusus Durasi Custom):
                    </label>
                    <input
                      type="text"
                      required
                      value={appealInput}
                      onChange={(e) => setAppealInput(e.target.value)}
                      placeholder="Tulis keterangan tinjauan untuk dikirim ke Admin..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-white text-[11px]"
                    />
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Kirim Tinjauan ke Panel Admin</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Controls Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 w-full">
        {/* Flip Card Button */}
        <button
          onClick={() => setIsFlipped(!isFlipped)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer shadow-sm"
        >
          <RotateCw className="w-3.5 h-3.5 text-amber-400" />
          <span>{isFlipped ? 'Lihat Depan' : 'Putar Kartu'}</span>
        </button>

        {/* Peek Card Number */}
        <button
          onClick={() => setShowFullCardNumber(!showFullCardNumber)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all cursor-pointer shadow-sm"
        >
          {showFullCardNumber ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-blue-400" />
              <span>Tutup Digit</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Buka Digit</span>
            </>
          )}
        </button>

        {/* Ganti Kartu ke Kartu Lain Tanpa Membuat Kartu Baru (Pakai Kode Admin!) */}
        <button
          onClick={() => {
            setSelectedSwitchTier(account.cardTier);
            setSelectedSwitchAccountId(account.id);
            setShowSwitchCardModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-yellow-600/20 hover:from-amber-500/30 border border-amber-400/60 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          <span>Ganti Kartu Lain (Kode Admin)</span>
        </button>

        {/* Lock/Unlock Card */}
        {!isBanned && (
          <button
            onClick={() => setPinPromptAction(isFrozen ? 'unfreeze' : 'freeze')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
              isFrozen
                ? 'bg-rose-600/30 border-rose-500/60 text-rose-300 hover:bg-rose-600/40'
                : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            {isFrozen ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-rose-400" />
                <span>Buka Blokir</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Kunci Kartu</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Account Number Box */}
      <div className="w-full mt-4 p-3.5 bg-slate-900/90 rounded-2xl border border-slate-800 text-xs flex items-center justify-between shadow-lg">
        <div>
          <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
            <span>Nomor Rekening (Sistem Otomatis)</span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded font-mono">10 Digit Unik</span>
          </div>
          <div className="font-mono text-base font-bold text-amber-300 tracking-wider mt-0.5 flex items-center gap-2">
            <span>{account.accountNumber}</span>
            <button
              onClick={handleCopyAcc}
              title="Salin nomor rekening"
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowAdminCodeForRegen(true)}
          title="Ganti nomor rekening menggunakan Kode Admin"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/40 hover:bg-blue-800/60 text-blue-300 hover:text-blue-100 border border-blue-700/50 rounded-xl text-[11px] font-medium transition-all cursor-pointer"
        >
          <RotateCw className="w-3 h-3 text-blue-400" />
          <span>Ganti No. Rek (Kode Admin)</span>
        </button>
      </div>

      {/* =========================================================================
          MODAL: GANTI KARTU KE KARTU LAIN TANPA HARUS MEMBUAT KARTU BARU
          ("Cukup memasukkan kode admin, bukan kode kartu, tapi kode admin")
         ========================================================================= */}
      {showSwitchCardModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    Ganti Kartu Tanpa Membuat Kartu Baru
                  </h3>
                  <p className="text-[10px] text-amber-300 font-mono">
                    OTORISASI MENGGUNAKAN KODE ADMIN (BUKAN KODE KARTU)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSwitchCardModal(false)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSwitchMode('tier')}
                className={`py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                  switchMode === 'tier'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                💳 Ganti Jenis Kartu Ini
              </button>
              <button
                type="button"
                onClick={() => setSwitchMode('account')}
                className={`py-2 px-3 rounded-xl font-bold border cursor-pointer ${
                  switchMode === 'account'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                🔄 Pindah ke Kartu Lain
              </button>
            </div>

            {switchMode === 'tier' ? (
              <div className="space-y-3">
                <label className="text-slate-300 font-semibold block">
                  Pilih Jenis Kartu Tujuan (Langsung Berganti Tanpa Buat Kartu Baru):
                </label>
                <div className="space-y-2">
                  {Object.values(CARD_TIER_CONFIGS).map((cfg) => (
                    <div
                      key={cfg.tier}
                      onClick={() => setSelectedSwitchTier(cfg.tier)}
                      className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                        selectedSwitchTier === cfg.tier
                          ? 'border-amber-400 bg-amber-500/15'
                          : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-white block">{cfg.nameIndo}</span>
                        <span className="text-[11px] text-slate-400">
                          Limit Tarik: {formatRupiah(cfg.dailyWithdrawalLimit)}/hr • Biaya: {formatRupiah(cfg.monthlyFee)}/bln
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeColor}`}>
                        {cfg.colorName}
                      </span>
                    </div>
                  ))}
                </div>

                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={regenerateDigitsOnSwitch}
                    onChange={(e) => setRegenerateDigitsOnSwitch(e.target.checked)}
                    className="w-4 h-4 accent-amber-400"
                  />
                  <span className="text-[11px] text-slate-300">
                    Sekaligus terbitkan 16 digit nomor kartu & CVV baru
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                <label className="text-slate-300 font-semibold block">
                  Pilih Kartu Lama / Kartu Lain yang Ingin Di-Login:
                </label>
                {accounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedSwitchAccountId(acc.id)}
                    className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between ${
                      selectedSwitchAccountId === acc.id
                        ? 'border-blue-400 bg-blue-500/15'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white">{acc.fullName}</span>
                        {acc.isVerified && (
                          <VerifiedBadge size="xs" label={acc.verifiedLabel} />
                        )}
                      </div>
                      <span className="font-mono text-[11px] text-amber-300">
                        Rek: {acc.accountNumber} • Kartu: {acc.cardTier.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {acc.cardStatus.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {switchMode === 'tier' ? (
              <>
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px] flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    Untuk mengubah jenis tier kartu saat ini tanpa membuat kartu baru, cukup masukkan <strong>Kode Admin</strong>.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdminPinForSwitch(true)}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-black rounded-xl cursor-pointer shadow-lg"
                >
                  Masukkan Kode Admin & Ubah Jenis Kartu ➔
                </button>
              </>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-blue-950/50 border border-blue-500/40 text-blue-200 text-[11px] flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Untuk login/beralih dari kartu baru ke <strong>Kartu Lama</strong> Anda, wajib menggunakan <strong>PIN Kartu Lama</strong> tersebut (bukan PIN Admin). Jika lupa PIN, klik tombol <strong>Lupa PIN?</strong> pada layar berikutnya.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowOldCardPinForSwitch(true)}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black rounded-xl cursor-pointer shadow-lg"
                >
                  Masukkan PIN Kartu Lama ({selectedTargetSwitchAccount.fullName.split(' ')[0]}) ➔
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Old Card PIN Modal for Switching to Old Card */}
      <PinPromptModal
        isOpen={showOldCardPinForSwitch}
        title="Login ke Kartu Lama (PIN Kartu Lama)"
        description={`Masukkan 6 digit PIN Kartu ${selectedTargetSwitchAccount.fullName} (Bukan PIN Admin) untuk login ke kartu lama Anda. Jika lupa PIN, klik tombol "Lupa PIN?".`}
        targetAccountId={selectedTargetSwitchAccount.id}
        targetAccountName={selectedTargetSwitchAccount.fullName}
        cardNumberSnippet={selectedTargetSwitchAccount.cardNumber}
        expectedPin={selectedTargetSwitchAccount.pin}
        onSuccess={handleExecuteSwitchWithOldCardPin}
        onCancel={() => setShowOldCardPinForSwitch(false)}
      />

      {/* Admin Code Modal for Switching Card */}
      <AdminPinModal
        isOpen={showAdminPinForSwitch}
        title="Masukkan Kode Admin untuk Ganti Kartu"
        subtitle="GANTI KARTU TANPA BUAT KARTU BARU"
        description="Untuk mengganti kartu ke kartu yang lain tanpa harus membuat kartu baru, cukup masukkan 6 digit Kode Admin (Bukan Kode Kartu)."
        onSuccess={handleExecuteSwitchWithAdminCode}
        onCancel={() => setShowAdminPinForSwitch(false)}
      />

      {/* Admin Code Modal for Regenerating Account Number */}
      <AdminPinModal
        isOpen={showAdminCodeForRegen}
        title="Otorisasi Kode Admin — Ganti No. Rekening"
        subtitle="KODE ADMIN (BUKAN KODE KARTU)"
        description="Masukkan 6 digit Kode Admin untuk mengacak nomor rekening 10 digit yang baru secara instan."
        onSuccess={() => {
          setShowAdminCodeForRegen(false);
          const res = regenerateAccountNumberWithPin(account.id, '159357');
          setFeedbackNotice(res.message);
          setTimeout(() => setFeedbackNotice(null), 4000);
        }}
        onCancel={() => setShowAdminCodeForRegen(false)}
      />

      {/* Pin Prompt Modal for Freeze/Unfreeze */}
      {pinPromptAction && (
        <PinPromptModal
          isOpen={true}
          title={
            pinPromptAction === 'freeze'
              ? 'Konfirmasi Kunci Kartu Sementara'
              : 'Konfirmasi Buka Blokir Kartu'
          }
          description={
            pinPromptAction === 'freeze'
              ? 'Masukkan 6 digit PIN kartu ATM Debit Anda untuk mengunci kartu sementara demi keamanan.'
              : 'Masukkan 6 digit PIN kartu ATM Debit Anda untuk membuka blokir kartu.'
          }
          targetAccountName={account.fullName}
          cardNumberSnippet={account.cardNumber}
          expectedPin={account.pin}
          onSuccess={handlePinSuccess}
          onCancel={() => setPinPromptAction(null)}
        />
      )}

      {/* Inspector */}
      {showInspector && (
        <div className="w-full mt-4 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 mb-2">
            <Info className="w-4 h-4 text-amber-400" />
            <span>Bagian-bagian pada Kartu ATM (Bab 3):</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="font-bold text-amber-300 block">1. Chip Pintar</span>
              <span className="text-slate-300">Menyimpan data kartu terenkripsi.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="font-bold text-blue-300 block">2. Nomor Kartu (16 Digit)</span>
              <span className="text-slate-300">Angka unik diawali 5392.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="font-bold text-emerald-300 block">3. Nama Pemilik</span>
              <span className="text-slate-300">Nama resmi pemilik rekening.</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50">
              <span className="font-bold text-purple-300 block">4. Masa Berlaku & CVV</span>
              <span className="text-slate-300">5 tahun ({account.expiryDate}) & CVV 3 digit.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
