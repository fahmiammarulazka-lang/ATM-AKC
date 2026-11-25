import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  formatRupiah,
  formatUserId16,
  isUnlimitedNumber,
  CARD_TIER_CONFIGS,
} from '../utils/bankUtils';
import { DiamondIcon } from './DiamondIcon';
import { DevRoleConfig } from '../types/bank';

interface UserProfileStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAdminAccess?: (role: DevRoleConfig) => void;
}

export const UserProfileStatsModal: React.FC<UserProfileStatsModalProps> = ({
  isOpen,
  onClose,
  onQuickAdminAccess,
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
    linkCurrentAccountWithGooglePopup,
    logoutGoogle,
  } = useBank();

  const [copiedField, setCopiedField] = useState<'id16' | 'rekening' | null>(null);
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

    const currentLevel = Math.max(1, currentAccount.jobLevel || 1);
    const levelProgressPct = Math.min(100, Math.round((currentLevel / 50) * 100));

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
  const isUnlimitedBal =
    currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

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

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[92dvh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Identitas Utama */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0 overflow-hidden border border-blue-700/20">
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
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                  {currentAccount.fullName}
                </h2>
                {currentAccount.isVerified && (
                  <span
                    title={currentAccount.verifiedLabel || 'Akun Terverifikasi'}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                )}
                {currentAccount.isOfficialAdminAccount && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                    <Shield className="w-3.5 h-3.5" />
                    OA
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{stats.tierLabel}</span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Bergabung {joinDateText}
                </span>
                <span className="text-slate-300">•</span>
                <span className="inline-flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-400" />
                  {isGoogleLinked ? 'Cloud Google Terhubung' : 'Mode Lokal / Belum Taut Google'}
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors shrink-0"
            aria-label="Tutup Profil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Blok Identitas Permanen & Salin Cepat */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  ID Permanen (16 Digit)
                </p>
                <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
                  {currentAccount.userId16 ? formatUserId16(currentAccount.userId16) : '-'}
                </p>
              </div>
              {currentAccount.userId16 && (
                <button
                  type="button"
                  onClick={() => handleCopy('id16', currentAccount.userId16 || '')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors"
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

            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Nomor Rekening Aktif
                </p>
                <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5 truncate">
                  {currentAccount.accountNumber}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy('rekening', currentAccount.accountNumber)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors"
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
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-slate-500">Email Akun</p>
              <p className="font-semibold text-slate-900 mt-0.5 truncate" title={displayEmail}>
                {displayEmail}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-slate-500">Nomor HP Terdaftar</p>
              <p className="font-semibold text-slate-900 mt-0.5 tabular-nums">
                {currentAccount.phone || '-'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-slate-500">Status Kartu & Keamanan</p>
              <div className="mt-0.5 flex items-center gap-1.5 font-semibold text-slate-900">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="capitalize">{currentAccount.cardStatus || 'active'}</span>
                <span className="text-slate-300">•</span>
                <span>{currentAccount.allowInternational ? 'Intl Aktif' : 'Domestik'}</span>
              </div>
            </div>
          </div>

          {/* 1. Ringkasan Saldo & Aset */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-blue-600" />
              Saldo & Portofolio Aset
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="col-span-2 sm:col-span-2 rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-xs text-slate-500">Saldo Rekening</p>
                <p className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums mt-0.5 truncate">
                  {isUnlimitedBal ? 'Tidak Terbatas' : formatRupiah(currentAccount.balance)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-amber-500" /> Coin Spin
                </p>
                <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                  {(currentAccount.spinCoins || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <DiamondIcon className="h-3.5 w-3.5" /> Permata
                </p>
                <p className="text-base font-bold text-cyan-700 tabular-nums mt-0.5">
                  {(currentAccount.diamonds || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                <p className="text-xs text-slate-500">Emas 24K</p>
                <p className="text-base font-bold text-amber-700 tabular-nums mt-0.5">
                  {(currentAccount.goldGrams || 0).toLocaleString('id-ID', {
                    maximumFractionDigits: 2,
                  })}{' '}
                  gr
                </p>
              </div>
            </div>
            {(currentAccount.debtAmount || 0) > 0 && (
              <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  Kewajiban Hutang Aktif
                </span>
                <span className="font-bold text-rose-900 tabular-nums">
                  {formatRupiah(currentAccount.debtAmount || 0)}
                </span>
              </div>
            )}
          </div>

          {/* 2. Statistik Transaksi & Limit Harian */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Statistik Transaksi & Limit Harian
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3">
                <p className="text-xs text-slate-500">Total Transaksi</p>
                <p className="text-lg font-bold text-slate-900 tabular-nums mt-0.5">
                  {stats.txCount.toLocaleString('id-ID')}x
                </p>
              </div>
              <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/70 p-3">
                <p className="text-xs text-emerald-700">Total Pemasukan</p>
                <p className="text-sm font-bold text-emerald-900 tabular-nums mt-0.5 truncate">
                  {formatRupiah(stats.totalIncome)}
                </p>
              </div>
              <div className="rounded-lg bg-rose-50/70 border border-rose-200/70 p-3">
                <p className="text-xs text-rose-700">Total Pengeluaran</p>
                <p className="text-sm font-bold text-rose-900 tabular-nums mt-0.5 truncate">
                  {formatRupiah(stats.totalExpense)}
                </p>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  Pemakaian Limit Tarik Harian
                </span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {isUnlimitedNumber(stats.dailyLimit)
                    ? 'Limit Tidak Terbatas'
                    : `${formatRupiah(stats.dailyUsed)} / ${formatRupiah(stats.dailyLimit)} (${stats.dailyLimitPct}%)`}
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
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                Karir, Poin & Tabungan
              </h3>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Progres Level Karir</span>
                  <span className="font-bold text-indigo-700 tabular-nums">
                    Level {stats.currentLevel} / 50
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-600"
                    style={{ width: `${stats.levelProgressPct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5">
                  <p className="text-slate-500 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-violet-500" /> Voucher Level
                  </p>
                  <p className="font-bold text-slate-900 tabular-nums mt-0.5">
                    {(currentAccount.levelVouchers || 0).toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5">
                  <p className="text-slate-500">Poin Rewards</p>
                  <p className="font-bold text-slate-900 tabular-nums mt-0.5">
                    {isUnlimitedNumber(currentAccount.rewardPoints)
                      ? '∞'
                      : (currentAccount.rewardPoints || 0).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-slate-600 flex items-center gap-1">
                    <PiggyBank className="w-3.5 h-3.5 text-pink-500" />
                    Celengan ({stats.pocketCount})
                  </span>
                  <span className="font-semibold text-slate-800 tabular-nums">
                    {formatRupiah(stats.totalPocketSaved)} ({stats.pocketProgressPct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${stats.pocketProgressPct}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                <span className="text-slate-600 flex items-center gap-1">
                  <Landmark className="w-3.5 h-3.5 text-slate-400" />
                  Total Deposito ({stats.depositoCount})
                </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {formatRupiah(stats.totalDeposito)}
                </span>
              </div>
            </div>

            {/* Keluarga & Slot */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-600" />
                Keluarga & Kapasitas Slot
              </h3>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5">
                  <p className="text-slate-500">Keluarga Diikuti</p>
                  <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {stats.myFamilies.length} Grup
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5">
                  <p className="text-slate-500">Slot Buat Keluarga</p>
                  <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                    {stats.ownedFamiliesCount} / {stats.maxFamilySlots}
                  </p>
                </div>
              </div>
              {stats.myFamilies.length > 0 ? (
                <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
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
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70"
                      >
                        <span className="font-semibold text-slate-800 truncate">{fam.name}</span>
                        <span className="text-[11px] font-medium text-sky-700 shrink-0 ml-2">
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
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-950">
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
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shrink-0"
                >
                  Buka Panel Admin
                </button>
              )}
            </div>
          )}

          {googleLinkStatus.message && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border ${
                googleLinkStatus.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {googleLinkStatus.message}
            </div>
          )}
        </div>

        {/* Footer Aksi Resmi (Hanya Hubungkan Google jika belum + Keluar Akun) */}
        <div className="px-5 py-3.5 sm:px-6 border-t border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
          <div>
            {!isGoogleLinked && (
              <button
                type="button"
                disabled={googleLinkStatus.loading}
                onClick={handleLinkGoogle}
                className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors"
              >
                <Cloud className="w-4 h-4" />
                {googleLinkStatus.loading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar Akun
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
