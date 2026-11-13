/**
 * Panel Admin — Pusat Masuk Cepat ke Akun Orang (1-Klik Tanpa PIN) &
 * Edit Semua Akun Tanpa Harus Masuk & Tanpa Ribet (Tombol Aksi Lengkap per Akun)
 */
import React, { useState } from 'react';
import {
  LogIn,
  Snowflake,
  Flame,
  BadgeCheck,
  Shield,
  Sparkles,
  KeyRound,
  CreditCard,
  Coins,
  TrendingUp,
  Edit3,
  Check,
  X,
  Search,
  Zap,
  RotateCcw,
  Trash2,
  Copy,
  UserCheck,
  Crown,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { BankAccount, CardStatus, CardTier } from '../types/bank';
import {
  formatRupiah,
  CARD_TIER_CONFIGS,
  UNLIMITED_BALANCE,
  isUnlimitedNumber,
} from '../utils/bankUtils';
import { VerifiedBadge } from './VerifiedBadge';

interface AdminQuickAccountControlPanelProps {
  onNavigateToCustomerDashboard?: () => void;
}

export const AdminQuickAccountControlPanel: React.FC<AdminQuickAccountControlPanelProps> = ({
  onNavigateToCustomerDashboard,
}) => {
  const {
    accounts,
    currentAccount,
    adminQuickLoginToAccount,
    adminQuickToggleFreezeAccount,
    adminQuickFullEditAccount,
    adminApproveCard,
    adminToggleVerifyAccount,
    adminToggleVipShield,
    adminAdjustAccountBalance,
    adminDirectChangeAccountTier,
    adminDirectChangeAccountPin,
    adminSetAccountJobLevel,
    adminAdjustAccountSpinCoins,
    adminAdjustLevelVouchers,
    adminInjectPulsaAndPln,
    adminResetDailyWithdrawalQuota,
    adminForgiveOrPayoffLoans,
    adminGiftAllSultanBusinessesToAccount,
    adminCloneAccount,
    adminDeleteAccount,
    adminMassFreezeOrUnfreezeAll,
    adminVerifyAllAccounts,
  } = useBank();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<BankAccount>>({});

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
  };

  const handleOpenInlineEdit = (acc: BankAccount) => {
    if (editingAccountId === acc.id) {
      setEditingAccountId(null);
      return;
    }
    setEditingAccountId(acc.id);
    setEditDraft({
      fullName: acc.fullName,
      accountNumber: acc.accountNumber,
      cardNumber: acc.cardNumber,
      pin: acc.pin,
      cardTier: acc.cardTier,
      cardStatus: acc.cardStatus,
      balance: acc.balance,
      phone: acc.phone,
      email: acc.email,
      address: acc.address,
      nik: acc.nik,
      jobLevel: acc.jobLevel || 1,
      spinCoins: acc.spinCoins || 0,
      levelUpVouchers: acc.levelUpVouchers || 0,
      rewardPoints: acc.rewardPoints || 0,
      customSpendingLimit: acc.customSpendingLimit || 15_000_000,
    });
  };

  const handleSaveInlineEdit = (accId: string) => {
    const res = adminQuickFullEditAccount(accId, editDraft);
    showToast(res.message);
    setEditingAccountId(null);
  };

  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (acc.fullName || '').toLowerCase().includes(q) ||
      (acc.accountNumber || '').toLowerCase().includes(q) ||
      (acc.cardNumber || '').toLowerCase().includes(q) ||
      (acc.phone || '').toLowerCase().includes(q) ||
      (acc.address || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border-2 border-amber-400/50 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5 text-xs">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-[10px] uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>FITUR BARU PANEL ADMIN • MASUK CEPAT &amp; EDIT SEMUA AKUN TANPA MASUK</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            ⚡ Masuk Cepat ke Akun Orang (1-Klik) &amp; 🛠️ Edit Semua Akun Tanpa Harus Masuk
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            Langsung masuk ke akun siapa saja tanpa perlu PIN kartu, atau langsung klik tombol{' '}
            <strong className="text-cyan-300">Bekukan / Cairkan</strong>,{' '}
            <strong className="text-emerald-300">Ubah Saldo</strong>,{' '}
            <strong className="text-amber-300">Ganti Tier Kartu</strong>,{' '}
            <strong className="text-purple-300">Level 50 Max</strong>, dan{' '}
            <strong className="text-pink-300">Edit Semua Data Inline</strong> di setiap kartu tanpa ribet!
          </p>
        </div>

        {/* Mass Quick Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              const res = adminMassFreezeOrUnfreezeAll(true);
              showToast(res.message);
            }}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Bekukan Semua Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const res = adminMassFreezeOrUnfreezeAll(false);
              showToast(res.message);
            }}
            className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Cairkan Semua Beku</span>
          </button>
          <button
            type="button"
            onClick={() => {
              adminVerifyAllAccounts(true, 'Verified Sultan Nusantara');
              showToast('✅ Seluruh akun berhasil diberikan Centang Biru!');
            }}
            className="px-3 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/50 text-sky-200 font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <BadgeCheck className="w-3.5 h-3.5" />
            <span>Centang Biru Semua</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 font-bold flex items-center justify-between gap-3">
          <span>{feedbackMsg}</span>
          <button
            type="button"
            onClick={() => setFeedbackMsg('')}
            className="p-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar & Active Account Indicator */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama pemilik akun, nomor rekening, nomor kartu, nomor HP, atau alamat..."
            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-2xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none"
          />
        </div>

        {currentAccount && (
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center gap-2 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-400">Akun Aktif Sekarang:</span>
            <strong className="text-white">{currentAccount.fullName}</strong>
            <span className="font-mono text-amber-300">({currentAccount.accountNumber})</span>
          </div>
        )}
      </div>

      {/* Account Cards List with Instant Quick Login & No-Hassle Quick Action Buttons */}
      <div className="space-y-4">
        {filteredAccounts.map((acc, idx) => {
          const isCurrent = currentAccount?.id === acc.id;
          const isFrozen = acc.cardStatus === 'frozen';
          const isEditing = editingAccountId === acc.id;

          return (
            <div
              key={acc.id}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition-all space-y-3.5 ${
                isCurrent
                  ? 'bg-slate-950/95 border-emerald-400/70 shadow-lg shadow-emerald-500/10'
                  : isFrozen
                  ? 'bg-cyan-950/25 border-cyan-400/50'
                  : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Row 1: Identity Summary + 1-Click Quick Login Button */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-amber-300 font-mono font-bold text-[10px]">
                      Akun #{idx + 1}
                    </span>
                    <span className="text-sm sm:text-base font-black text-white">
                      {acc.fullName}
                    </span>
                    {acc.isVerified && <VerifiedBadge size="xs" label={acc.verifiedLabel} />}
                    {isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                        ✓ SEDANG DIPAKAI SEKARANG
                      </span>
                    )}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        acc.cardStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : acc.cardStatus === 'frozen'
                          ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400'
                          : acc.cardStatus === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {acc.cardStatus === 'frozen'
                        ? '❄️ DIBEKUKAN (FROZEN)'
                        : acc.cardStatus.toUpperCase()}
                    </span>
                    {acc.vipShieldActive && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/40 text-purple-200 font-bold text-[10px]">
                        🛡️ VIP Shield Aktif
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-300 font-mono">
                    <span>
                      No. Rek: <strong className="text-amber-300">{acc.accountNumber}</strong>
                    </span>
                    <span>
                      PIN Kartu: <strong className="text-emerald-400">{acc.pin}</strong>
                    </span>
                    <span>
                      Tier: <strong className="text-cyan-300 uppercase">{acc.cardTier}</strong>
                    </span>
                    <span>
                      Saldo:{' '}
                      <strong className="text-white">
                        {isUnlimitedNumber(acc.balance) ? '∞ UNLIMITED' : formatRupiah(acc.balance)}
                      </strong>
                    </span>
                    <span>
                      Level Kerja: <strong className="text-purple-300">Lv.{acc.jobLevel || 1}</strong>
                    </span>
                    <span>
                      Koin Spin:{' '}
                      <strong className="text-amber-300">
                        {(acc.spinCoins || 0).toLocaleString('id-ID')} 🪙
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Primary 1-Click Login & Inline Edit Toggle Buttons */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminQuickLoginToAccount(acc.id);
                      showToast(res.message);
                    }}
                    className={`px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all ${
                      isCurrent
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950'
                    }`}
                  >
                    <LogIn className="w-4 h-4" />
                    <span>
                      {isCurrent
                        ? '✓ Sedang Masuk di Akun Ini'
                        : '⚡ Masuk Cepat ke Akun Ini (Tanpa PIN)'}
                    </span>
                  </button>

                  {onNavigateToCustomerDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        adminQuickLoginToAccount(acc.id);
                        onNavigateToCustomerDashboard();
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>🚀 Masuk &amp; Buka Dashboard</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleOpenInlineEdit(acc)}
                    className={`px-3.5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 cursor-pointer border transition-all ${
                      isEditing
                        ? 'bg-pink-600 text-white border-pink-400'
                        : 'bg-slate-900 hover:bg-slate-800 text-pink-300 border-pink-500/40'
                    }`}
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>{isEditing ? 'Tutup Form Edit' : '📝 Edit Semua Data Akun'}</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Instant 1-Click Action Buttons (Tanpa Masuk Akun & Tanpa Ribet) */}
              <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                  Tombol Aksi Instan (Tanpa Masuk):
                </span>

                {/* 1. Bekukan / Cairkan (Freeze / Unfreeze) */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminQuickToggleFreezeAccount(acc.id);
                    showToast(res.message);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer border transition-all ${
                    isFrozen
                      ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-200'
                      : 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/50 text-cyan-200'
                  }`}
                >
                  {isFrozen ? (
                    <>
                      <Flame className="w-3.5 h-3.5 text-emerald-400" />
                      <span>🔥 Cairkan Beku</span>
                    </>
                  ) : (
                    <>
                      <Snowflake className="w-3.5 h-3.5 text-cyan-400" />
                      <span>❄️ Bekukan Kartu</span>
                    </>
                  )}
                </button>

                {/* 2. Setujui / Aktifkan jika pending/rejected */}
                {acc.cardStatus !== 'active' && (
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminApproveCard(acc.id);
                      showToast(res.message);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aktifkan Kartu</span>
                  </button>
                )}

                {/* 3. Centang Biru */}
                <button
                  type="button"
                  onClick={() => {
                    adminToggleVerifyAccount(acc.id, 'Verified Sultan Nusantara');
                    showToast(`☑️ Status Centang Biru ${acc.fullName} diperbarui!`);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer border ${
                    acc.isVerified
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                      : 'bg-slate-900 hover:bg-sky-950 border-slate-700 text-slate-300'
                  }`}
                >
                  <BadgeCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>{acc.isVerified ? 'Cabut Centang Biru' : '+ Centang Biru'}</span>
                </button>

                {/* 4. VIP Shield Anti-Pajak */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminToggleVipShield(acc.id, !acc.vipShieldActive);
                    showToast(res.message);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer border ${
                    acc.vipShieldActive
                      ? 'bg-purple-500/20 border-purple-400 text-purple-200'
                      : 'bg-slate-900 hover:bg-purple-950 border-slate-700 text-slate-300'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>{acc.vipShieldActive ? 'Matikan Perisai VIP' : '🛡️ Aktifkan Perisai VIP'}</span>
                </button>

                {/* 5. Quick Balance Buttons */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminAdjustAccountBalance(
                      acc.id,
                      10_000_000,
                      'add',
                      'Suntikan Cepat +Rp 10 Juta dari Panel Admin'
                    );
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                >
                  💰 +Rp 10 Juta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const res = adminAdjustAccountBalance(
                      acc.id,
                      100_000_000,
                      'add',
                      'Suntikan Cepat +Rp 100 Juta dari Panel Admin'
                    );
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                >
                  💰 +Rp 100 Juta
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const res = adminAdjustAccountBalance(
                      acc.id,
                      UNLIMITED_BALANCE,
                      'unlimited',
                      'Saldo Unlimited (∞) diaktifkan dari Panel Admin'
                    );
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold text-[11px] cursor-pointer"
                >
                  ♾️ Saldo Unlimited
                </button>

                {/* 6. Quick Tier Switch */}
                <select
                  value={acc.cardTier}
                  onChange={(e) => {
                    const nextTier = e.target.value as CardTier;
                    const res = adminDirectChangeAccountTier(acc.id, nextTier);
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-300 font-bold text-[11px] cursor-pointer"
                  title="Ganti Jenis Kartu Tanpa Masuk Akun"
                >
                  {Object.values(CARD_TIER_CONFIGS).map((cfg) => (
                    <option key={cfg.tier} value={cfg.tier}>
                      Kartu: {cfg.nameIndo}
                    </option>
                  ))}
                </select>

                {/* 7. Quick Level 50 Max */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminSetAccountJobLevel(acc.id, 50, 'max');
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 text-purple-200 font-bold text-[11px] cursor-pointer"
                >
                  🚀 Set Level 50 Max
                </button>

                {/* 8. Quick +1.000 Koin Spin */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminAdjustAccountSpinCoins(acc.id, 1000, 'add');
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-200 font-bold text-[11px] cursor-pointer"
                >
                  🪙 +1.000 Koin Spin
                </button>

                {/* 9. Quick +20 Voucher Level */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminAdjustLevelVouchers(acc.id, 20, 'add');
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold text-[11px] cursor-pointer"
                >
                  🎟️ +20 Voucher Level
                </button>

                {/* 10. Quick Suntik Pulsa & PLN */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminInjectPulsaAndPln(acc.id, 500_000, 200);
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40 text-blue-200 font-bold text-[11px] cursor-pointer"
                >
                  ⚡ +Pulsa 500rb &amp; 200 kWh
                </button>

                {/* 11. Quick Reset PIN ke 123456 */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminDirectChangeAccountPin(acc.id, '123456');
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
                >
                  🔑 Reset PIN 123456
                </button>

                {/* 12. Quick Reset Kuota Harian */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminResetDailyWithdrawalQuota(acc.id);
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
                >
                  🔄 Reset Limit Harian
                </button>

                {/* 13. Quick Lunasi Pinjaman */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminForgiveOrPayoffLoans(acc.id);
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 border border-teal-400/40 text-teal-200 font-bold text-[11px] cursor-pointer"
                >
                  🏦 Lunasi Pinjaman
                </button>

                {/* 14. Quick Beri 12 Rig Mining & Supercar */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminGiftAllSultanBusinessesToAccount(acc.id, 5);
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 font-bold text-[11px] cursor-pointer"
                >
                  🏎️ +12 Rig Mining &amp; Supercar
                </button>

                {/* 15. Clone & Delete */}
                <button
                  type="button"
                  onClick={() => {
                    const res = adminCloneAccount(acc.id);
                    showToast(res.message);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Duplikat Akun</span>
                </button>

                {accounts.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminDeleteAccount(acc.id);
                      showToast(res.message);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                )}
              </div>

              {/* Row 3: Expandable Full Inline Editor (Edit Semua Kolom Tanpa Masuk Akun) */}
              {isEditing && (
                <div className="p-4 rounded-2xl bg-slate-900 border-2 border-pink-500/50 space-y-3 mt-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="font-black text-pink-300 text-xs uppercase">
                      📝 Form Edit Lengkap Semua Data Akun ({acc.fullName}) — Tanpa Masuk Akun
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingAccountId(null)}
                      className="text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Nama Pemilik Akun:
                      </label>
                      <input
                        type="text"
                        value={editDraft.fullName || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, fullName: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Nomor Rekening (10 Digit):
                      </label>
                      <input
                        type="text"
                        value={editDraft.accountNumber || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, accountNumber: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        PIN Kartu (6 Digit):
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editDraft.pin || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-emerald-400 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Saldo Rekening (Rp):
                      </label>
                      <input
                        type="number"
                        value={editDraft.balance ?? 0}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            balance: Number(e.target.value) || 0,
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Jenis Kartu (Tier):
                      </label>
                      <select
                        value={editDraft.cardTier || 'regular'}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            cardTier: e.target.value as CardTier,
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-bold"
                      >
                        {Object.values(CARD_TIER_CONFIGS).map((cfg) => (
                          <option key={cfg.tier} value={cfg.tier}>
                            {cfg.nameIndo}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Status Kartu:
                      </label>
                      <select
                        value={editDraft.cardStatus || 'active'}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            cardStatus: e.target.value as CardStatus,
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-cyan-300 font-bold"
                      >
                        <option value="active">Active (Aktif)</option>
                        <option value="frozen">Frozen (Dibekukan)</option>
                        <option value="pending">Pending (Menunggu)</option>
                        <option value="rejected">Rejected (Ditolak)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Level Kerja (1-50):
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={editDraft.jobLevel ?? 1}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            jobLevel: Math.min(50, Math.max(1, Number(e.target.value) || 1)),
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-purple-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Koin Spin (🪙):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={editDraft.spinCoins ?? 0}
                        onChange={(e) =>
                          setEditDraft((prev) => ({
                            ...prev,
                            spinCoins: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Nomor HP:
                      </label>
                      <input
                        type="text"
                        value={editDraft.phone || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, phone: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Email:
                      </label>
                      <input
                        type="email"
                        value={editDraft.email || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, email: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        NIK KTP (16 Digit):
                      </label>
                      <input
                        type="text"
                        value={editDraft.nik || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, nik: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-slate-400 block mb-1 text-[10px] font-bold">
                        Alamat Lengkap:
                      </label>
                      <input
                        type="text"
                        value={editDraft.address || ''}
                        onChange={(e) =>
                          setEditDraft((prev) => ({ ...prev, address: e.target.value }))
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingAccountId(null)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveInlineEdit(acc.id)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black cursor-pointer flex items-center gap-1.5 shadow-lg"
                    >
                      <Check className="w-4 h-4" />
                      <span>Simpan Semua Perubahan Akun Ini</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
