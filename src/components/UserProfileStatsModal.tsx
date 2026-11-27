import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
  Coins,
  TrendingUp,
  Briefcase,
  Users,
  Lock,
  LogOut,
  Cloud,
  CheckCircle2,
  Calendar,
  CreditCard,
  Award,
  PiggyBank,
  Landmark,
  AlertCircle,
  Shield,
  RefreshCw,
  CloudOff,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  formatRupiah,
  formatCompactRupiah,
  formatAssetCount,
  isAdminCardAccount,
  formatUserId16Display,
  formatAccountNumberDisplay,
  formatPhoneDisplay,
  isUnlimitedNumber,
  CARD_TIER_CONFIGS,
} from '../utils/bankUtils';
import { DiamondIcon } from './DiamondIcon';
import { TopLeaderboardBadges } from './TopLeaderboardBadges';
import { DevRoleConfig } from '../types/bank';

interface UserProfileStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAdminAccess?: (role: DevRoleConfig) => void;
  onOpenSecurityCenter?: (section?: 'identity' | 'telemetry' | 'timemachine' | 'audit') => void;
}

interface AdaptiveRupiahProps {
  amount: number;
  isUnlimited?: boolean;
  className?: string;
}

/**
 * Menampilkan nominal penuh jika cukup di lebar kartu/layar, dan otomatis meringkas
 * ke satuan Indonesia (K, JT, M, T) jika nominal penuh berisiko terpotong.
 */
const AdaptiveRupiah: React.FC<AdaptiveRupiahProps> = ({
  amount,
  isUnlimited = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fullMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [useCompact, setUseCompact] = useState(false);

  const fullText = isUnlimited ? '∞' : formatRupiah(amount);
  const compactText = isUnlimited ? '∞' : formatCompactRupiah(amount);

  useLayoutEffect(() => {
    const containerEl = containerRef.current;
    const measureEl = fullMeasureRef.current;
    if (!containerEl || !measureEl) return;

    const evaluateFit = () => {
      const availableWidth = containerEl.clientWidth;
      const neededWidth = measureEl.scrollWidth;
      if (availableWidth > 0) {
        setUseCompact(neededWidth > availableWidth - 2);
      }
    };

    evaluateFit();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => evaluateFit());
      observer.observe(containerEl);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', evaluateFit);
    return () => window.removeEventListener('resize', evaluateFit);
  }, [fullText]);

  const displayedText = useCompact ? compactText : fullText;

  return (
    <div ref={containerRef} className="relative w-full min-w-0" title={fullText}>
      <span
        ref={fullMeasureRef}
        aria-hidden="true"
        className={`invisible absolute left-0 top-0 pointer-events-none whitespace-nowrap ${className}`}
      >
        {fullText}
      </span>
      <span className={`block break-words leading-snug ${className}`}>{displayedText}</span>
    </div>
  );
};

export const UserProfileStatsModal: React.FC<UserProfileStatsModalProps> = ({
  isOpen,
  onClose,
  onQuickAdminAccess,
  onOpenSecurityCenter,
}) => {
  const {
    currentAccount,
    googleUser,
    transactions,
    pockets,
    depositos,
    families,
    familyConfig,
    devRoles,
    loyaltyMap,
    syncTelemetry,
    forceSyncCloudNow,
    linkCurrentAccountWithGooglePopup,
    logoutGoogle,
    toggleHideSensitiveNumbers,
  } = useBank();

  const [copiedField, setCopiedField] = useState<'id16' | 'rekening' | null>(null);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [googleLinkStatus, setGoogleLinkStatus] = useState<{
    loading: boolean;
    message: string;
    isError?: boolean;
  }>({ loading: false, message: '' });

  const stats = useMemo(() => {
    if (!currentAccount) return null;
    const myTxs = transactions.filter((t) => t.accountId === currentAccount.id);
    const incomeTypes = new Set([
      'setor',
      'transfer_in',
      'transfer_bebas_in',
      'pinjaman_disburse',
      'redeem_code',
      'jual_emas',
    ]);
    const totalIncome = myTxs
      .filter((t) => incomeTypes.has(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpense = myTxs
      .filter((t) => !incomeTypes.has(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const myPockets = pockets.filter((p) => p.accountId === currentAccount.id);
    const totalPocketSaved = myPockets.reduce((sum, p) => sum + (Number(p.currentAmount) || 0), 0);
    const totalPocketTarget = myPockets.reduce((sum, p) => sum + (Number(p.targetAmount) || 0), 0);
    const pocketProgressPct =
      totalPocketTarget > 0 ? Math.min(100, Math.round((totalPocketSaved / totalPocketTarget) * 100)) : 0;

    const myDepositos = depositos.filter((d) => d.accountId === currentAccount.id);
    const totalDeposito = myDepositos.reduce((sum, d) => sum + (Number(d.principalAmount) || 0), 0);

    const myFamilies = families.filter((f) =>
      f.members.some((m) => m.accountId === currentAccount.id)
    );
    const ownedFamilies = myFamilies.filter((f) => f.ownerAccountId === currentAccount.id);
    const maxFamilySlots =
      (familyConfig?.defaultMaxFamilies || 1) + (currentAccount.extraFamilySlots || 0);

    const tierMeta = CARD_TIER_CONFIGS[currentAccount.cardTier] || CARD_TIER_CONFIGS.regular;
    const dailyLimit =
      currentAccount.customSpendingLimit || tierMeta.dailyWithdrawalLimit || 5_000_000;
    const dailyUsed = currentAccount.dailyWithdrawnToday || 0;
    const dailyLimitPct = isUnlimitedNumber(dailyLimit)
      ? 0
      : Math.min(100, Math.round((dailyUsed / Math.max(1, dailyLimit)) * 100));

    const isAdminForLevel = isAdminCardAccount(currentAccount);
    const currentLevel = isAdminForLevel ? 999_999_999_999_999 : Math.max(1, currentAccount.jobLevel || 1);
    const levelProgressPct =
      isAdminForLevel || isUnlimitedNumber(currentLevel)
        ? 100
        : Math.min(100, Math.round((currentLevel / 50) * 100));

    return {
      txCount: myTxs.length,
      totalIncome,
      totalExpense,
      pocketCount: myPockets.length,
      totalPocketSaved,
      totalPocketTarget,
      pocketProgressPct,
      depositoCount: myDepositos.length,
      totalDeposito,
      myFamilies,
      ownedFamiliesCount: ownedFamilies.length,
      maxFamilySlots,
      dailyLimit,
      dailyUsed,
      dailyLimitPct,
      currentLevel,
      levelProgressPct,
      tierLabel: tierMeta.name,
    };
  }, [currentAccount, transactions, pockets, depositos, families, familyConfig]);

  if (!isOpen || !currentAccount || !stats) return null;

  const activeDevRole = currentAccount.devRoleId
    ? devRoles.find((r) => r.id === currentAccount.devRoleId) || null
    : null;

  const isGoogleLinked = Boolean(
    currentAccount.googleEmail || (googleUser?.email && !googleUser.email.endsWith('@guest.local'))
  );
  const displayEmail =
    currentAccount.googleEmail || currentAccount.email || googleUser?.email || 'Belum terhubung';
  const isAdminCard = isAdminCardAccount(currentAccount);
  const isUnlimitedBal =
    isAdminCard || isUnlimitedNumber(currentAccount.balance);
  const isPrivacyMasked = Boolean(currentAccount.hideSensitiveNumbers);

  const handleQuickSyncCloud = async () => {
    if (isQuickSyncing) return;
    setIsQuickSyncing(true);
    try {
      await forceSyncCloudNow();
    } finally {
      window.setTimeout(() => setIsQuickSyncing(false), 300);
    }
  };

  const syncBusy = isQuickSyncing || syncTelemetry.status === 'syncing';
  const lastSyncTimeText = (() => {
    if (!syncTelemetry.lastSyncedAt) return 'Belum tercatat';
    const d = new Date(syncTelemetry.lastSyncedAt);
    if (Number.isNaN(d.getTime())) return 'Belum tercatat';
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  })();

  const handleCopy = (field: 'id16' | 'rekening', value: string) => {
    try {
      void navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard restriction
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLinkStatus({ loading: true, message: '' });
    const res = await linkCurrentAccountWithGooglePopup(currentAccount.id);
    setGoogleLinkStatus({
      loading: false,
      message: res.message,
      isError: !res.success,
    });
  };

  const handleLogout = () => {
    onClose();
    logoutGoogle();
  };

  const joinDateText = currentAccount.createdAt
    ? new Date(currentAccount.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Terdaftar Aktif';

  const initials = currentAccount.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');

  const modalContent = (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-3 pb-16 sm:p-5"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profil dan Statistik Akun"
    >
      <div
        className="w-full max-w-3xl max-h-[calc(100dvh-5rem)] sm:max-h-[90dvh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Identitas Utama (Tetap di Atas) */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-blue-600 text-white font-bold text-base sm:text-lg flex items-center justify-center shrink-0 overflow-hidden border border-blue-700/20">
              {googleUser?.picture ? (
                <img
                  src={googleUser.picture}
                  alt={currentAccount.fullName}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{initials || 'BN'}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 break-words leading-snug">
                  {currentAccount.fullName}
                </h2>
                {currentAccount.isVerified && (
                  <span
                    title={currentAccount.verifiedLabel || 'Akun Terverifikasi'}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                )}
                {currentAccount.isOfficialAdminAccount && (
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                    OA
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-x-2.5 gap-y-1 flex-wrap text-[11px] sm:text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{stats.tierLabel}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Bergabung {joinDateText}</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {isGoogleLinked ? 'Cloud Google Terhubung' : 'Mode Lokal / Belum Taut Google'}
                  </span>
                </span>
              </div>
              <TopLeaderboardBadges
                account={currentAccount}
                variant="full"
                context="profile"
                className="mt-2"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer"
            aria-label="Tutup Profil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable Penuh (min-h-0 agar footer tetap terlihat di semua ukuran layar) */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Status Sinkronisasi Cloud Real-Time & Tombol Sync 1-Klik */}
          <div
            className={`rounded-xl border p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
              syncTelemetry.status === 'error'
                ? 'border-rose-200 bg-rose-50/80'
                : syncTelemetry.status === 'offline'
                ? 'border-amber-200 bg-amber-50/80'
                : syncBusy
                ? 'border-blue-200 bg-blue-50/80'
                : 'border-emerald-200 bg-emerald-50/80'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  syncTelemetry.status === 'error'
                    ? 'bg-rose-100 text-rose-600'
                    : syncTelemetry.status === 'offline'
                    ? 'bg-amber-100 text-amber-600'
                    : syncBusy
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-emerald-100 text-emerald-600'
                }`}
              >
                {syncTelemetry.status === 'error' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : syncTelemetry.status === 'offline' ? (
                  <CloudOff className="w-4 h-4" />
                ) : syncBusy ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  {syncTelemetry.status === 'error'
                    ? 'Gangguan Sinkronisasi Cloud'
                    : syncTelemetry.status === 'offline'
                    ? 'Mode Offline (Data Tersimpan Lokal)'
                    : syncBusy
                    ? `Menyinkronkan ke Cloud (${Math.max(1, syncTelemetry.pendingWritesCount)})...`
                    : 'Cloud Tersinkronisasi'}
                </p>
                <p className="text-[11px] text-slate-600 break-words">
                  {syncTelemetry.status === 'error' && syncTelemetry.lastError
                    ? syncTelemetry.lastError
                    : `Terakhir tersinkronisasi pukul ${lastSyncTimeText} WIB`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleQuickSyncCloud}
                disabled={syncBusy}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncBusy ? 'animate-spin' : ''}`} />
                <span>{syncBusy ? 'Menyinkronkan...' : 'Sync 1-Klik'}</span>
              </button>
              {onOpenSecurityCenter && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSecurityCenter('telemetry');
                  }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Detail
                </button>
              )}
            </div>
          </div>

          {/* Pengaturan Sensor Privasi Nomor & ID (Tersimpan Permanen Per Akun + Cloud Sync) */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isPrivacyMasked
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-slate-200/80 text-slate-700'
                }`}
              >
                {isPrivacyMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900">
                  Sensor Privasi Nomor &amp; ID (Tutup Penuh ****)
                </p>
                <p className="text-[11px] text-slate-600">
                  {isPrivacyMasked
                    ? 'Aktif: ID 16 Digit, No. Rekening, No. Kartu ATM & No. HP disembunyikan penuh. Tombol Salin tetap menyalin nomor asli.'
                    : 'Nonaktif: Semua nomor dan ID tampil terbuka normal. Klik tombol mata untuk menyensor.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleHideSensitiveNumbers(currentAccount.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                isPrivacyMasked
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {isPrivacyMasked ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tampilkan Nomor</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Sembunyikan (****)</span>
                </>
              )}
            </button>
          </div>

          {/* Blok Identitas Permanen & Salin Cepat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  ID Permanen (16 Digit)
                </p>
                <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5 break-words leading-snug select-all">
                  {currentAccount.userId16
                    ? formatUserId16Display(currentAccount.userId16, isPrivacyMasked)
                    : '-'}
                </p>
              </div>
              {currentAccount.userId16 && (
                <button
                  type="button"
                  onClick={() => handleCopy('id16', currentAccount.userId16 || '')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                >
                  {copiedField === 'id16' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Nomor Rekening Aktif
                </p>
                <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5 break-all leading-snug select-all">
                  {formatAccountNumberDisplay(currentAccount.accountNumber, isPrivacyMasked)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('rekening', currentAccount.accountNumber)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
              >
                {copiedField === 'rekening' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Salin
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Email, Telepon & Status Kartu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
              <p className="text-slate-500">Email Akun</p>
              <p
                className="font-semibold text-slate-900 mt-0.5 break-all leading-snug"
                title={displayEmail}
              >
                {displayEmail}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
              <p className="text-slate-500">Nomor HP Terdaftar</p>
              <p className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums break-words">
                {currentAccount.phone
                  ? formatPhoneDisplay(currentAccount.phone, isPrivacyMasked)
                  : '-'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
              <p className="text-slate-500">Status Kartu & Keamanan</p>
              <div className="mt-0.5 flex items-center flex-wrap gap-1.5 font-semibold text-slate-900">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="capitalize">{currentAccount.cardStatus || 'active'}</span>
                <span className="text-slate-300">•</span>
                <span>{currentAccount.allowInternational ? 'Intl Aktif' : 'Domestik'}</span>
              </div>
            </div>
          </div>

          {/* 1. Ringkasan Saldo & Aset (2 Kolom Seimbang di Mobile) */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-600" />
              Saldo & Portofolio Aset
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 min-w-0">
                <p className="text-xs text-slate-500">Saldo Rekening</p>
                <AdaptiveRupiah
                  amount={currentAccount.balance}
                  isUnlimited={isUnlimitedBal}
                  className="text-sm sm:text-base font-extrabold text-slate-900 font-mono tabular-nums mt-0.5"
                />
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 min-w-0">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Coin Spin</span>
                </p>
                <p className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5 break-words">
                  {formatAssetCount(currentAccount.spinCoins, { isAdmin: isAdminCard })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 min-w-0">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <DiamondIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>Permata</span>
                </p>
                <p className="text-sm sm:text-base font-bold text-cyan-700 font-mono tabular-nums mt-0.5 break-words">
                  {formatAssetCount(currentAccount.diamonds, { isAdmin: isAdminCard })}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3 sm:p-3.5 min-w-0">
                <p className="text-xs text-slate-500">Emas 24K</p>
                <p className="text-sm sm:text-base font-bold text-amber-700 font-mono tabular-nums mt-0.5 break-words">
                  {(currentAccount.goldGrams || 0).toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  gr
                </p>
              </div>
            </div>
            {(currentAccount.debtAmount || 0) > 0 && (
              <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  Kewajiban Hutang Aktif
                </span>
                <span className="font-bold text-rose-900 font-mono tabular-nums">
                  {formatRupiah(currentAccount.debtAmount || 0)}
                </span>
              </div>
            )}
          </div>

          {/* 2. Statistik Transaksi & Limit Harian */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
              Statistik Transaksi & Limit Harian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 min-w-0">
                <p className="text-xs text-slate-500">Total Transaksi</p>
                <p className="text-base sm:text-lg font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                  {stats.txCount.toLocaleString('id-ID')}x
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/70 p-3 min-w-0">
                <p className="text-xs text-emerald-700">Total Pemasukan</p>
                <AdaptiveRupiah
                  amount={stats.totalIncome}
                  className="text-sm font-bold text-emerald-900 font-mono tabular-nums mt-0.5"
                />
              </div>
              <div className="rounded-lg bg-rose-50/70 border border-rose-200/70 p-3 min-w-0">
                <p className="text-xs text-rose-700">Total Pengeluaran</p>
                <AdaptiveRupiah
                  amount={stats.totalExpense}
                  className="text-sm font-bold text-rose-900 font-mono tabular-nums mt-0.5"
                />
              </div>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs mb-1.5">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Pemakaian Limit Tarik Harian</span>
                </span>
                <span className="font-semibold text-slate-800 font-mono tabular-nums">
                  {isAdminCard || isUnlimitedNumber(stats.dailyLimit)
                    ? '∞'
                    : `${formatCompactRupiah(stats.dailyUsed)} / ${formatCompactRupiah(stats.dailyLimit)} (${stats.dailyLimitPct}%)`}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${stats.dailyLimitPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Karir, Tabungan & Keluarga */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Karir & Tabungan */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                Karir, Poin & Tabungan
              </h3>
              <div>
                <div className="flex items-center justify-between gap-2 text-xs mb-1">
                  <span className="text-slate-600 font-medium">Progres Level Karir</span>
                  <span
                    className={`font-bold font-mono tabular-nums shrink-0 ${
                      isAdminCard || isUnlimitedNumber(stats.currentLevel)
                        ? 'text-amber-600'
                        : 'text-indigo-700'
                    }`}
                  >
                    {isAdminCard || isUnlimitedNumber(stats.currentLevel)
                      ? 'Level ∞'
                      : `Level ${stats.currentLevel} / 50`}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      isAdminCard || isUnlimitedNumber(stats.currentLevel)
                        ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{
                      width:
                        isAdminCard || isUnlimitedNumber(stats.currentLevel)
                          ? '100%'
                          : `${stats.levelProgressPct}%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 min-w-0">
                  <p className="text-slate-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                    <span className="truncate">Voucher Lv</span>
                  </p>
                  <p
                    className={`font-bold font-mono tabular-nums mt-0.5 ${
                      isAdminCard || isUnlimitedNumber(currentAccount.levelVouchers)
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatAssetCount(currentAccount.levelVouchers, { isAdmin: isAdminCard })}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 min-w-0">
                  <p className="text-slate-500 truncate">Poin Rewards</p>
                  <p
                    className={`font-bold font-mono tabular-nums mt-0.5 ${
                      isAdminCard || isUnlimitedNumber(currentAccount.rewardPoints)
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatAssetCount(currentAccount.rewardPoints, { isAdmin: isAdminCard })}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 min-w-0">
                  <p className="text-slate-500 truncate">Poin Loyalty</p>
                  <p
                    className={`font-bold font-mono tabular-nums mt-0.5 ${
                      isAdminCard || isUnlimitedNumber(loyaltyMap[currentAccount.id]?.points)
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {formatAssetCount(loyaltyMap[currentAccount.id]?.points || 0, {
                      isAdmin: isAdminCard,
                    })}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span>Celengan ({stats.pocketCount})</span>
                  </span>
                  <span
                    className="font-semibold text-slate-800 font-mono tabular-nums"
                    title={formatRupiah(stats.totalPocketSaved)}
                  >
                    {formatCompactRupiah(stats.totalPocketSaved)} ({stats.pocketProgressPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${stats.pocketProgressPct}%` }}
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-600 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Total Deposito ({stats.depositoCount})</span>
                </span>
                <span
                  className="font-bold text-slate-900 font-mono tabular-nums"
                  title={formatRupiah(stats.totalDeposito)}
                >
                  {formatCompactRupiah(stats.totalDeposito)}
                </span>
              </div>
            </div>

            {/* Keluarga & Slot */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-w-0">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600 shrink-0" />
                Keluarga & Kapasitas Slot
              </h3>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 min-w-0">
                  <p className="text-slate-500">Keluarga Diikuti</p>
                  <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {stats.myFamilies.length} Grup
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 min-w-0">
                  <p className="text-slate-500">Slot Buat Keluarga</p>
                  <p className="text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5">
                    {stats.ownedFamiliesCount} / {stats.maxFamilySlots}
                  </p>
                </div>
              </div>
              {stats.myFamilies.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {stats.myFamilies.map((fam) => {
                    const me = fam.members.find((m) => m.accountId === currentAccount.id);
                    const roleLabel =
                      me?.role === 'owner'
                        ? 'Pemilik'
                        : me?.role === 'co_leader'
                        ? 'Wakil Ketua'
                        : 'Anggota';
                    return (
                      <div
                        key={fam.id}
                        className="flex items-start justify-between gap-2 text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70"
                      >
                        <span className="font-semibold text-slate-800 break-words min-w-0 leading-snug">
                          {fam.name}
                        </span>
                        <span className="text-[11px] font-medium text-sky-700 shrink-0">
                          {roleLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                  Anda belum bergabung atau membuat grup keluarga.
                </p>
              )}
            </div>
          </div>

          {/* Role Dev Badge (Hanya jika akun punya activeDevRole) */}
          {activeDevRole && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-indigo-950 break-words">
                    Role Pengembang Aktif: {activeDevRole.name}
                  </p>
                  <p className="text-[11px] text-indigo-700">
                    Akses pintas ke Panel Admin tersedia untuk akun berstatus pengembang.
                  </p>
                </div>
              </div>
              {onQuickAdminAccess && activeDevRole.canQuickOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onQuickAdminAccess(activeDevRole);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                >
                  Buka Panel Admin
                </button>
              )}
            </div>
          )}

          {googleLinkStatus.message && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border break-words ${
                googleLinkStatus.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {googleLinkStatus.message}
            </div>
          )}
        </div>

        {/* Footer Aksi Resmi (Selalu terlihat di bawah modal, rapi di HP & Desktop) */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
          <div className="w-full sm:w-auto">
            {!isGoogleLinked && (
              <button
                type="button"
                disabled={googleLinkStatus.loading}
                onClick={handleLinkGoogle}
                className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Cloud className="w-4 h-4 shrink-0" />
                <span>{googleLinkStatus.loading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto justify-center px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
