/**
 * Admin Quick Account Control Panel & Studio Buat Akun Bebas (Akun OA)
 * Fitur Lengkap:
 * 1. Studio Buat Akun Bebas (Akun OA — SEMUA BISA DIATUR):
 *    - Identitas, ID 16 Digit, No. Rekening, No. Kartu 16 Digit, CVV, Masa Berlaku, PIN Kartu 6 Digit, PIN Admin OA (semua bisa diketik bebas atau klik Acak Otomatis)
 *    - Saldo/Unlimited (∞), Emas 24K, Koin Spin, Poin Reward, Pulsa, PLN kWh
 *    - Level Kerja (1-50), Voucher Level, Click Power, Salary Multiplier, Cashback %, VIP Shield
 *    - Centang Biru, Role Dev/Own/Admin (10 Role), dan 12 Aset Kerajaan Bisnis Sultan
 *    - Otomatis berstatus Akun OA & langsung Aktif Permanen + tombol 1-Klik Salin Paket Kredensial OA
 * 2. Kelola Akun & Lihat/Salin/Ubah PIN Kartu Orang Lain:
 *    - Tampil ID 16 Digit (format 4x4 + Salin ID) tepat di atas nama user (Admin bisa mengedit ID 16 digit)
 *    - Panel Lihat PIN 6 Digit, Sembunyikan, Salin PIN, dan Ubah PIN Kartu langsung di tempat yang sama
 *    - Aktifkan/Nonaktifkan status Akun OA untuk akun lama maupun baru + Salin Paket Login OA
 */
import React, { useState } from 'react';
import {
  Zap,
  Snowflake,
  Flame,
  Edit3,
  Trash2,
  LogIn,
  CheckCircle2,
  X,
  Save,
  Search,
  AlertTriangle,
  ShieldAlert,
  Clock,
  CreditCard,
  Coins,
  Briefcase,
  Award,
  KeyRound,
  UserCheck,
  Copy,
  Eye,
  EyeOff,
  PlusCircle,
  Sparkles,
  Fingerprint,
  ShieldCheck,
  Shuffle,
  Crown,
  Building2,
  Infinity as InfinityIcon,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { BankAccount, CardStatus, CardTier } from '../types/bank';
import {
  formatRupiah,
  isUnlimitedNumber,
  UNLIMITED_BALANCE,
  CARD_TIER_CONFIGS,
  generateRandomUserId16,
  ensureAccountUserId16,
  formatUserId16,
  generateRandomAccountNumber,
  generateRandomCardNumber,
  generateRandomCVV,
  generateExpiryDate,
  generateRandomPin6,
} from '../utils/bankUtils';
import { VerifiedBadge, UserId16AboveNameBanner, OaAccountBadge } from './VerifiedBadge';

interface AdminQuickAccountControlPanelProps {
  onQuickSwitchToDashboard?: () => void;
  onNavigateToCustomerDashboard?: () => void;
}

export const AdminQuickAccountControlPanel: React.FC<AdminQuickAccountControlPanelProps> = ({
  onQuickSwitchToDashboard,
  onNavigateToCustomerDashboard,
}) => {
  const triggerSwitchDashboard = onQuickSwitchToDashboard || onNavigateToCustomerDashboard;
  const {
    accounts,
    currentAccount,
    devRoles,
    accountDeletionRequests,
    adminQuickLoginToAccount,
    adminQuickToggleFreezeAccount,
    adminQuickFullEditAccount,
    adminDirectChangeAccountPin,
    adminCreateFullCustomAccount,
    adminToggleOaAccountStatus,
    adminDeleteAccount,
    approveAccountDeletionRequest,
    rejectAccountDeletionRequest,
  } = useBank();

  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // State Studio Buat Akun Bebas (Akun OA - Semua Bisa Diatur)
  const [showCreateStudio, setShowCreateStudio] = useState<boolean>(true);
  const [lastCreatedOaAccount, setLastCreatedOaAccount] = useState<BankAccount | null>(null);
  const [copiedOaPackageId, setCopiedOaPackageId] = useState<string | null>(null);

  const [cFullName, setCFullName] = useState('');
  const [cUserId16, setCUserId16] = useState(() => generateRandomUserId16());
  const [cAccountNumber, setCAccountNumber] = useState(() => generateRandomAccountNumber());
  const [cCardNumber, setCCardNumber] = useState(() => generateRandomCardNumber());
  const [cCvv, setCCvv] = useState(() => generateRandomCVV());
  const [cExpiryDate, setCExpiryDate] = useState(() => generateExpiryDate(5));
  const [cPin, setCPin] = useState(() => generateRandomPin6());
  const [cOaAdminPin, setCOaAdminPin] = useState('159357');
  const [cNik, setCNik] = useState(() => `3171${Math.floor(100000000000 + Math.random() * 899999999999)}`);
  const [cPhone, setCPhone] = useState(() => `0812${Math.floor(10000000 + Math.random() * 89999999)}`);
  const [cEmail, setCEmail] = useState('');
  const [cAddress, setCAddress] = useState('Menara Otoritas Bank Nusantara Digital');
  const [cCardTier, setCCardTier] = useState<CardTier>('platinum');
  const [cBalance, setCBalance] = useState('100000000');
  const [cIsUnlimited, setCIsUnlimited] = useState(false);
  const [cGoldGrams, setCGoldGrams] = useState('50');
  const [cSpinCoins, setCSpinCoins] = useState('1000');
  const [cRewardPoints, setCRewardPoints] = useState('25000');
  const [cPulsaBalance, setCPulsaBalance] = useState('500000');
  const [cPlnKwhBalance, setCPlnKwhBalance] = useState('250');
  const [cJobLevel, setCJobLevel] = useState('25');
  const [cLevelVouchers, setCLevelVouchers] = useState('10');
  const [cClickPower, setCClickPower] = useState('10');
  const [cSalaryMultiplier, setCSalaryMultiplier] = useState('5');
  const [cCashbackPercent, setCCashbackPercent] = useState('10');
  const [cVipShield, setCVipShield] = useState(true);
  const [cAllowIntl, setCAllowIntl] = useState(true);
  const [cSpendingLimit, setCSpendingLimit] = useState('100000000');
  const [cIsVerified, setCIsVerified] = useState(true);
  const [cVerifiedLabel, setCVerifiedLabel] = useState('Akun OA Resmi Terverifikasi Admin');
  const [cDevRoleId, setCDevRoleId] = useState<string>('');
  const [cGrantAllBusinesses, setCGrantAllBusinesses] = useState(true);
  const [cBusinessUnits, setCBusinessUnits] = useState('5');

  // State Lihat / Sembunyi / Salin / Ubah PIN Kartu per akun di Kelola Akun
  const [hiddenPinMap, setHiddenPinMap] = useState<Record<string, boolean>>({});
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null);
  const [inlinePinEditMap, setInlinePinEditMap] = useState<Record<string, string>>({});
  const [inlineOaPinEditMap, setInlineOaPinEditMap] = useState<Record<string, string>>({});

  // State Inline Edit per akun
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<{
    fullName: string;
    userId16: string;
    accountNumber: string;
    pin: string;
    oaAdminPin: string;
    isOfficialAdminAccount: boolean;
    phone: string;
    email: string;
    nik: string;
    address: string;
    balance: string;
    isUnlimited: boolean;
    cardTier: CardTier;
    cardStatus: CardStatus;
    cardNumber: string;
    cvv: string;
    expiryDate: string;
    jobLevel: string;
    levelVouchers: string;
    spinCoins: string;
    goldGrams: string;
    rewardPoints: string;
    pulsaBalance: string;
    plnKwhBalance: string;
    clickPower: string;
    salaryMultiplier: string;
    cashbackPercent: string;
    isVerified: boolean;
    verifiedLabel: string;
    vipShieldActive: boolean;
    devRoleId: string;
  } | null>(null);

  // State Konfirmasi Hapus Permanen Akun
  const [confirmDeleteAccountId, setConfirmDeleteAccountId] = useState<string | null>(null);
  const [reviewNoteMap, setReviewNoteMap] = useState<Record<string, string>>({});

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => {
      setFeedbackBanner((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const handleRandomizeAllCreatorFields = () => {
    const existingNums = accounts.map((a) => a.accountNumber);
    const existingIds = accounts.map((a) => ensureAccountUserId16(a));
    setCUserId16(generateRandomUserId16(existingIds));
    setCAccountNumber(generateRandomAccountNumber(existingNums));
    setCCardNumber(generateRandomCardNumber());
    setCCvv(generateRandomCVV());
    setCExpiryDate(cCardTier === 'admin' ? '∞ / SELAMANYA' : generateExpiryDate(5));
    setCPin(generateRandomPin6());
    setCNik(`3171${Math.floor(100000000000 + Math.random() * 899999999999)}`);
    setCPhone(`0812${Math.floor(10000000 + Math.random() * 89999999)}`);
  };

  const handleApplySultanMaxPreset = () => {
    setCCardTier('admin');
    setCIsUnlimited(true);
    setCExpiryDate('∞ / SELAMANYA');
    setCGoldGrams('1000');
    setCSpinCoins('100000');
    setCRewardPoints('1000000');
    setCPulsaBalance('50000000');
    setCPlnKwhBalance('99999');
    setCJobLevel('50');
    setCLevelVouchers('100');
    setCClickPower('100');
    setCSalaryMultiplier('25');
    setCCashbackPercent('25');
    setCVipShield(true);
    setCIsVerified(true);
    setCVerifiedLabel('Sultan OA Infinity Terverifikasi Admin');
    setCGrantAllBusinesses(true);
    setCBusinessUnits('20');
  };

  const handleCreateCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminCreateFullCustomAccount({
      fullName: cFullName,
      userId16: cUserId16,
      accountNumber: cAccountNumber,
      cardNumber: cCardNumber,
      cvv: cCvv,
      expiryDate: cExpiryDate,
      pin: cPin,
      oaAdminPin: cOaAdminPin,
      nik: cNik,
      phone: cPhone,
      email: cEmail,
      address: cAddress,
      cardTier: cCardTier,
      balance: Number(cBalance) || 0,
      isUnlimitedBalance: cIsUnlimited,
      goldGrams: Number(cGoldGrams) || 0,
      spinCoins: Number(cSpinCoins) || 0,
      rewardPoints: Number(cRewardPoints) || 0,
      pulsaBalance: Number(cPulsaBalance) || 0,
      plnKwhBalance: Number(cPlnKwhBalance) || 0,
      jobLevel: Number(cJobLevel) || 1,
      levelVouchers: Number(cLevelVouchers) || 0,
      clickPower: Number(cClickPower) || 1,
      salaryMultiplier: Number(cSalaryMultiplier) || 1,
      cashbackPercent: Number(cCashbackPercent) || 0,
      vipShieldActive: cVipShield,
      allowInternational: cAllowIntl,
      customSpendingLimit: Number(cSpendingLimit) || 10_000_000,
      isVerified: cIsVerified,
      verifiedLabel: cVerifiedLabel,
      devRoleId: cDevRoleId || null,
      grantAllSultanBusinesses: cGrantAllBusinesses,
      sultanBusinessUnitsEach: Number(cBusinessUnits) || 5,
      isOfficialAdminAccount: true,
    });

    showNotice(res.success ? 'success' : 'error', res.message);
    if (res.success && res.account) {
      setLastCreatedOaAccount(res.account);
      setCFullName('');
      handleRandomizeAllCreatorFields();
    }
  };

  const copyOaCredentialsPackage = (acc: BankAccount) => {
    const id16 = ensureAccountUserId16(acc);
    const oaPin = acc.oaAdminPin || '159357';
    const text = [
      `=== KREDENSIAL LOGIN AKUN OA BANK NUSANTARA ===`,
      `Nama Pemilik : ${acc.fullName}`,
      `No. Rekening : ${acc.accountNumber}`,
      `ID 16 Digit  : ${formatUserId16(id16)} (${id16})`,
      `PIN Kartu    : ${acc.pin}`,
      `PIN Admin OA : ${oaPin}`,
      `Jenis Kartu  : ${CARD_TIER_CONFIGS[acc.cardTier]?.nameIndo || acc.cardTier}`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopiedOaPackageId(acc.id);
    setTimeout(() => setCopiedOaPackageId(null), 2200);
    showNotice('success', `📋 Paket Kredensial Login OA untuk "${acc.fullName}" berhasil disalin!`);
  };

  const startInlineEdit = (acc: BankAccount) => {
    const unlim = isUnlimitedNumber(acc.balance);
    setEditingAccountId(acc.id);
    setEditDraft({
      fullName: acc.fullName || '',
      userId16: ensureAccountUserId16(acc),
      accountNumber: acc.accountNumber || '',
      pin: acc.pin || '123456',
      oaAdminPin: acc.oaAdminPin || '159357',
      isOfficialAdminAccount: Boolean(acc.isOfficialAdminAccount || acc.id === 'acc-admin'),
      phone: acc.phone || '',
      email: acc.email || '',
      nik: acc.nik || '',
      address: acc.address || '',
      balance: unlim ? '999999999999999' : String(Math.round(acc.balance || 0)),
      isUnlimited: unlim,
      cardTier: acc.cardTier,
      cardStatus: acc.cardStatus,
      cardNumber: acc.cardNumber || '',
      cvv: acc.cvv || '999',
      expiryDate: acc.expiryDate || '12/30',
      jobLevel: String(acc.jobLevel || 1),
      levelVouchers: String(acc.levelVouchers || 0),
      spinCoins: String(acc.spinCoins || 0),
      goldGrams: String(acc.goldGrams || 0),
      rewardPoints: String(acc.rewardPoints || 0),
      pulsaBalance: String(acc.pulsaBalance || 0),
      plnKwhBalance: String(acc.plnKwhBalance || 0),
      clickPower: String(acc.clickPower || 1),
      salaryMultiplier: String(acc.salaryMultiplier || 1),
      cashbackPercent: String(acc.cashbackPercent || 0),
      isVerified: Boolean(acc.isVerified),
      verifiedLabel: acc.verifiedLabel || 'Nasabah Terverifikasi Resmi (Centang Biru)',
      vipShieldActive: Boolean(acc.vipShieldActive),
      devRoleId: acc.devRoleId || '',
    });
  };

  const saveInlineEdit = (accountId: string) => {
    if (!editDraft) return;
    const cleanAcctNum = editDraft.accountNumber.replace(/\D/g, '');
    if (cleanAcctNum.length < 6 || cleanAcctNum.length > 16) {
      showNotice('error', 'Nomor Rekening harus 6–16 digit angka.');
      return;
    }
    const cleanId16 = editDraft.userId16.replace(/\D/g, '');
    if (cleanId16.length !== 16) {
      showNotice('error', 'ID 16 Digit di atas nama user harus tepat 16 digit angka.');
      return;
    }
    const cleanPin = editDraft.pin.replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      showNotice('error', 'PIN Kartu harus tepat 6 digit angka.');
      return;
    }
    const cleanOaPin = editDraft.oaAdminPin.replace(/\D/g, '') || '159357';
    if (cleanOaPin.length !== 6) {
      showNotice('error', 'PIN Admin OA harus tepat 6 digit angka.');
      return;
    }

    const finalBalance = editDraft.isUnlimited
      ? UNLIMITED_BALANCE
      : Math.max(0, Number(editDraft.balance) || 0);

    const res = adminQuickFullEditAccount(accountId, {
      fullName: editDraft.fullName.trim() || 'Nasabah Bank Nusantara',
      userId16: cleanId16,
      accountNumber: cleanAcctNum,
      pin: cleanPin,
      oaAdminPin: cleanOaPin,
      isOfficialAdminAccount: editDraft.isOfficialAdminAccount,
      phone: editDraft.phone.trim(),
      email: editDraft.email.trim(),
      nik: editDraft.nik.trim(),
      address: editDraft.address.trim(),
      balance: finalBalance,
      cardTier: editDraft.cardTier,
      cardStatus: editDraft.cardStatus,
      cardNumber: editDraft.cardNumber.trim(),
      cvv: editDraft.cvv.trim(),
      expiryDate: editDraft.expiryDate.trim(),
      jobLevel: Math.max(1, Number(editDraft.jobLevel) || 1),
      levelVouchers: Math.max(0, Number(editDraft.levelVouchers) || 0),
      spinCoins: Math.max(0, Number(editDraft.spinCoins) || 0),
      goldGrams: Math.max(0, Number(editDraft.goldGrams) || 0),
      rewardPoints: Math.max(0, Number(editDraft.rewardPoints) || 0),
      pulsaBalance: Math.max(0, Number(editDraft.pulsaBalance) || 0),
      plnKwhBalance: Math.max(0, Number(editDraft.plnKwhBalance) || 0),
      clickPower: Math.max(1, Number(editDraft.clickPower) || 1),
      salaryMultiplier: Math.max(1, Number(editDraft.salaryMultiplier) || 1),
      cashbackPercent: Math.max(0, Number(editDraft.cashbackPercent) || 0),
      isVerified: editDraft.isVerified,
      verifiedLabel: editDraft.verifiedLabel.trim(),
      verifiedAt: editDraft.isVerified ? new Date().toISOString() : undefined,
      vipShieldActive: editDraft.vipShieldActive,
      devRoleId: editDraft.devRoleId ? editDraft.devRoleId : null,
    });

    showNotice(res.success ? 'success' : 'error', res.message);
    if (res.success) {
      setEditingAccountId(null);
      setEditDraft(null);
    }
  };

  const filteredAccounts = accounts.filter((acc) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const id16 = ensureAccountUserId16(acc);
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.accountNumber.toLowerCase().includes(q) ||
      id16.includes(q.replace(/\s+/g, '')) ||
      (acc.email || '').toLowerCase().includes(q) ||
      (acc.phone || '').toLowerCase().includes(q) ||
      acc.cardTier.toLowerCase().includes(q)
    );
  });

  const pendingDeletionRequests = accountDeletionRequests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 shadow-lg ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =========================================================================
          BAGIAN 0: STUDIO BUAT AKUN BEBAS / AKUN OA (SEMUA BISA DIATUR DI PANEL ADMIN)
         ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-950/50 via-slate-900 to-emerald-950/40 border-2 border-amber-500/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-amber-500/30 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-emerald-500 flex items-center justify-center text-slate-950 shadow-lg shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-white">
                  Studio Buat Akun Bebas / Akun OA (Semua Bisa Diatur 100%)
                </h3>
                <OaAccountBadge size="sm" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Buat akun baru dengan mengatur seluruh identitas, ID 16 Digit, No. Rekening, No. Kartu, PIN Kartu, PIN Admin OA, Saldo/Unlimited, Emas, Koin, Bisnis, Level, Role & Centang Biru. Akun yang dibuat di sini otomatis berstatus <strong className="text-amber-300">Akun OA</strong> dan langsung bisa login lewat tombol <strong className="text-emerald-300">"Login Dengan Akun OA"</strong> di lobi awal!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRandomizeAllCreatorFields}
              className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Acak Semua Nomor</span>
            </button>
            <button
              type="button"
              onClick={handleApplySultanMaxPreset}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Preset Sultan Max ∞</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateStudio((p) => !p)}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer"
            >
              {showCreateStudio ? 'Sembunyikan Form' : 'Buka Studio Buat Akun'}
            </button>
          </div>
        </div>

        {/* Kartu Ringkasan Kredensial Akun OA yang Baru Saja Dibuat */}
        {lastCreatedOaAccount && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-sm text-white">
                  Akun OA Berhasil Dibuat & Langsung Aktif! Siap Dipakai di "Login Dengan Akun OA"
                </span>
                <OaAccountBadge size="xs" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyOaCredentialsPackage(lastCreatedOaAccount)}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>
                    {copiedOaPackageId === lastCreatedOaAccount.id
                      ? 'Paket Tersalin!'
                      : 'Salin Paket Kredensial OA'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adminQuickLoginToAccount(lastCreatedOaAccount.id);
                    if (triggerSwitchDashboard) triggerSwitchDashboard();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk ke Akun Ini Sekarang</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">1. Nomor Rekening</span>
                <span className="font-mono font-black text-amber-300 text-sm">
                  {lastCreatedOaAccount.accountNumber}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">2. ID User 16 Digit</span>
                <span className="font-mono font-black text-cyan-300 text-sm">
                  {formatUserId16(ensureAccountUserId16(lastCreatedOaAccount))}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">3. PIN Kartu (6 Digit)</span>
                <span className="font-mono font-black text-emerald-300 text-sm">
                  {lastCreatedOaAccount.pin}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">4. PIN Admin OA</span>
                <span className="font-mono font-black text-rose-300 text-sm">
                  {lastCreatedOaAccount.oaAdminPin || '159357'}
                </span>
              </div>
            </div>
          </div>
        )}

        {showCreateStudio && (
          <form onSubmit={handleCreateCustomAccountSubmit} className="space-y-4 text-xs">
            {/* Baris 1: Identitas & 4 Kredensial Utama Login OA */}
            <div className="p-4 rounded-2xl bg-slate-950/85 border border-amber-500/30 space-y-3">
              <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                <span>A. Identitas, ID 16 Digit Permanen & Kredensial Login Akun OA</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Nama Lengkap Pemilik Akun *
                  </label>
                  <input
                    type="text"
                    value={cFullName}
                    onChange={(e) => setCFullName(e.target.value)}
                    placeholder="Contoh: Sultan Nusantara OA VIP"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-cyan-300 font-bold">
                      ID 16 Digit Di Atas Nama User ({cUserId16.replace(/\D/g, '').length}/16) *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCUserId16(
                          generateRandomUserId16(accounts.map((a) => ensureAccountUserId16(a)))
                        )
                      }
                      className="text-[10px] font-bold text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3 h-3" /> Acak 16 Digit
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cUserId16}
                    onChange={(e) => setCUserId16(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 Digit ID User"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-500/50 text-amber-300 font-mono font-bold tracking-wider"
                  />
                  <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                    Preview 4x4: <strong className="text-cyan-300">{formatUserId16(cUserId16)}</strong>
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-300 font-bold">
                      No. Rekening (10 Digit) *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setCAccountNumber(
                          generateRandomAccountNumber(accounts.map((a) => a.accountNumber))
                        )
                      }
                      className="text-[10px] font-bold text-cyan-300 hover:underline cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cAccountNumber}
                    onChange={(e) =>
                      setCAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 16))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-emerald-300 font-bold">
                      PIN Kartu (6 Digit) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCPin(generateRandomPin6())}
                      className="text-[10px] font-bold text-emerald-300 hover:underline cursor-pointer"
                    >
                      Acak PIN
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={cPin}
                    onChange={(e) => setCPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-300 font-mono font-black tracking-widest"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-rose-300 font-bold">
                      PIN Admin OA (6 Digit) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setCOaAdminPin('159357')}
                      className="text-[10px] font-bold text-rose-300 hover:underline cursor-pointer"
                    >
                      Default 159357
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={cOaAdminPin}
                    onChange={(e) => setCOaAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/50 text-rose-300 font-mono font-black tracking-widest"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-300 font-bold">
                      No. Kartu ATM 16 Digit
                    </label>
                    <button
                      type="button"
                      onClick={() => setCCardNumber(generateRandomCardNumber())}
                      className="text-[10px] font-bold text-cyan-300 hover:underline cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cCardNumber}
                    onChange={(e) => setCCardNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-300 font-bold">CVV (3 Digit)</label>
                    <button
                      type="button"
                      onClick={() => setCCvv(generateRandomCVV())}
                      className="text-[10px] font-bold text-cyan-300 hover:underline cursor-pointer"
                    >
                      Acak
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={4}
                    value={cCvv}
                    onChange={(e) => setCCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-300 font-bold">Masa Berlaku</label>
                    <button
                      type="button"
                      onClick={() => setCExpiryDate('∞ / SELAMANYA')}
                      className="text-[10px] font-bold text-amber-300 hover:underline cursor-pointer"
                    >
                      Set ∞
                    </button>
                  </div>
                  <input
                    type="text"
                    value={cExpiryDate}
                    onChange={(e) => setCExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    NIK Identitas (16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={cNik}
                    onChange={(e) => setCNik(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    No. HP / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={cPhone}
                    onChange={(e) => setCPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Email & Alamat Domisili
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      placeholder="Email (opsional)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                    <input
                      type="text"
                      value={cAddress}
                      onChange={(e) => setCAddress(e.target.value)}
                      placeholder="Alamat lengkap"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Baris 2: Keuangan, Tier Kartu, Emas, Koin, Level, Role & Bisnis */}
            <div className="p-4 rounded-2xl bg-slate-950/85 border border-cyan-500/30 space-y-3">
              <div className="text-xs font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Coins className="w-4 h-4" />
                <span>B. Saldo, Jenis Kartu, Emas, Koin, Karir, Role & Kerajaan Bisnis</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Jenis / Tier Kartu ATM
                  </label>
                  <select
                    value={cCardTier}
                    onChange={(e) => {
                      const nextTier = e.target.value as CardTier;
                      setCCardTier(nextTier);
                      if (nextTier === 'admin') {
                        setCIsUnlimited(true);
                        setCExpiryDate('∞ / SELAMANYA');
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  >
                    <option value="regular">1. Kartu Reguler (Biasa)</option>
                    <option value="gold">2. Kartu Emas</option>
                    <option value="premium">3. Kartu Premium</option>
                    <option value="platinum">4. Kartu Platinum VIP</option>
                    <option value="admin">5. Kartu ADMIN (∞ Unlimited)</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-300 font-bold">Saldo Rekening (Rp)</label>
                    <label className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cIsUnlimited}
                        onChange={(e) => setCIsUnlimited(e.target.checked)}
                      />
                      <span>Unlimited ∞</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    disabled={cIsUnlimited}
                    value={cBalance}
                    onChange={(e) => setCBalance(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-amber-300 font-bold block mb-1">
                    Emas 24K (Gram)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={cGoldGrams}
                    onChange={(e) => setCGoldGrams(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-fuchsia-300 font-bold block mb-1">
                    Koin Spin the Wheel
                  </label>
                  <input
                    type="number"
                    value={cSpinCoins}
                    onChange={(e) => setCSpinCoins(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-fuchsia-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                    Level Pekerjaan (1 - 50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={cJobLevel}
                    onChange={(e) => setCJobLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Voucher Level Kerja
                  </label>
                  <input
                    type="number"
                    value={cLevelVouchers}
                    onChange={(e) => setCLevelVouchers(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Kekuatan Klik & Pengali Gaji
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={cClickPower}
                      onChange={(e) => setCClickPower(e.target.value)}
                      placeholder="Klik"
                      title="Click Power"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono"
                    />
                    <input
                      type="number"
                      value={cSalaryMultiplier}
                      onChange={(e) => setCSalaryMultiplier(e.target.value)}
                      placeholder="Gaji x"
                      title="Salary Multiplier"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Poin Reward & Cashback %
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={cRewardPoints}
                      onChange={(e) => setCRewardPoints(e.target.value)}
                      placeholder="Poin"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-200 font-mono"
                    />
                    <input
                      type="number"
                      value={cCashbackPercent}
                      onChange={(e) => setCCashbackPercent(e.target.value)}
                      placeholder="CB %"
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-200 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Saldo Pulsa (Rp) & PLN (kWh)
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="number"
                      value={cPulsaBalance}
                      onChange={(e) => setCPulsaBalance(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                    <input
                      type="number"
                      value={cPlnKwhBalance}
                      onChange={(e) => setCPlnKwhBalance(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-amber-300 font-bold block mb-1">
                    Role Dev / Own / Admin (10 Role)
                  </label>
                  <select
                    value={cDevRoleId}
                    onChange={(e) => setCDevRoleId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-500/40 text-amber-200 font-bold"
                  >
                    <option value="">— Nasabah / Tanpa Role Dev —</option>
                    {devRoles.map((r) => (
                      <option key={r.id} value={r.id}>
                        Slot #{r.slotNumber}: {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Label Centang Biru Verified
                  </label>
                  <input
                    type="text"
                    value={cVerifiedLabel}
                    onChange={(e) => setCVerifiedLabel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sky-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 font-bold block mb-1">
                    Modal Kerajaan Bisnis Sultan
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 text-xs text-emerald-300 font-bold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cGrantAllBusinesses}
                        onChange={(e) => setCGrantAllBusinesses(e.target.checked)}
                      />
                      <span>Beri Semua 12 Bisnis</span>
                    </label>
                    {cGrantAllBusinesses && (
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={cBusinessUnits}
                        onChange={(e) => setCBusinessUnits(e.target.value)}
                        className="w-16 px-2 py-1.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 font-mono text-center"
                        title="Jumlah unit per bisnis"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800">
                <label className="inline-flex items-center gap-2 text-xs text-sky-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cIsVerified}
                    onChange={(e) => setCIsVerified(e.target.checked)}
                  />
                  <span>Aktifkan Centang Biru (Verified)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-amber-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cVipShield}
                    onChange={(e) => setCVipShield(e.target.checked)}
                  />
                  <span>Aktifkan VIP Shield (Anti-Pajak & Proteksi)</span>
                </label>
                <label className="inline-flex items-center gap-2 text-xs text-emerald-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cAllowIntl}
                    onChange={(e) => setCAllowIntl(e.target.checked)}
                  />
                  <span>Akses Transaksi Internasional</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 cursor-pointer transition"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Buat Akun OA Bebas Sekarang (Langsung Aktif & Siap Login OA)</span>
            </button>
          </form>
        )}
      </div>

      {/* =========================================================================
          BAGIAN 1: ANTREAN PERMOHONAN HAPUS AKUN DARI NASABAH
         ========================================================================= */}
      <div className="bg-slate-900/95 border-2 border-rose-500/50 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
                <span>Antrean Tinjauan Permohonan Hapus Akun Nasabah</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black bg-rose-500 text-white">
                  {pendingDeletionRequests.length} Menunggu
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Nasabah yang mengajukan penghapusan akun wajib menjawab pertanyaan konfirmasi dan menunggu keputusan Admin di bawah ini.
              </p>
            </div>
          </div>
        </div>

        {accountDeletionRequests.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-400">
            Belum ada permohonan penghapusan akun dari nasabah saat ini.
          </div>
        ) : (
          <div className="space-y-3">
            {accountDeletionRequests.map((req) => {
              const isPending = req.status === 'pending';
              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border text-xs space-y-2.5 ${
                    isPending
                      ? 'bg-rose-950/25 border-rose-500/50'
                      : req.status === 'approved'
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80'
                      : 'bg-slate-950/60 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-white text-sm">{req.accountName}</span>
                      <span className="font-mono text-amber-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                        No. Rek: {req.accountNumber}
                      </span>
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        Kartu {req.cardTier}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        req.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {req.status === 'pending'
                        ? '⏳ Menunggu Persetujuan Admin'
                        : req.status === 'approved'
                        ? '✅ Disetujui & Akun Dihapus'
                        : req.status === 'rejected'
                        ? '❌ Ditolak Admin'
                        : 'Dibatalkan'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Kategori Alasan:</span>
                      <span className="font-bold text-rose-300">{req.reasonCategory}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Saldo Saat Mengajukan:</span>
                      <span className="font-mono font-bold text-amber-300">
                        {formatRupiah(req.balanceSnapshot)}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-[10px] text-slate-400 block">Penjelasan Lengkap Nasabah:</span>
                      <p className="text-slate-200 italic mt-0.5">"{req.reasonDetail}"</p>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={reviewNoteMap[req.id] || ''}
                        onChange={(e) =>
                          setReviewNoteMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Catatan keputusan Admin (opsional)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = approveAccountDeletionRequest(req.id, reviewNoteMap[req.id]);
                          showNotice(res.success ? 'success' : 'error', res.message);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Setujui & Hapus Permanen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = rejectAccountDeletionRequest(req.id, reviewNoteMap[req.id]);
                          showNotice(res.success ? 'success' : 'error', res.message);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Tolak Permohonan</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =========================================================================
          BAGIAN 2: KELOLA SEMUA AKUN, LIHAT/UBAH PIN KARTU ORANG LAIN & STATUS OA
         ========================================================================= */}
      <div className="bg-slate-900/95 border-2 border-cyan-500/50 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base">
                Kelola Semua Akun, Lihat/Ubah PIN Kartu Orang Lain & Kontrol Status Akun OA ({accounts.length} Rekening)
              </h3>
              <p className="text-[11px] text-slate-400">
                Lihat 6 digit PIN Kartu orang lain secara langsung, salin atau ubah PIN di tempat yang sama, edit ID 16 Digit di atas nama user, dan aktifkan status <strong className="text-amber-300">Akun OA</strong>.
              </p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama, no rek, ID 16 digit..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filteredAccounts.map((acc) => {
            const isCurrent = acc.id === currentAccount?.id;
            const isEditing = editingAccountId === acc.id;
            const isConfirmingDelete = confirmDeleteAccountId === acc.id;
            const isFrozen = acc.cardStatus === 'frozen';
            const isPinHidden = Boolean(hiddenPinMap[acc.id]);
            const inlinePinVal = inlinePinEditMap[acc.id] ?? acc.pin;
            const inlineOaPinVal = inlineOaPinEditMap[acc.id] ?? (acc.oaAdminPin || '159357');
            const isOa = Boolean(acc.isOfficialAdminAccount || acc.id === 'acc-admin');

            return (
              <div
                key={acc.id}
                className={`p-4 rounded-2xl border transition-all space-y-3 ${
                  isCurrent
                    ? 'bg-cyan-950/30 border-cyan-400/70 shadow-lg shadow-cyan-500/10'
                    : isFrozen
                    ? 'bg-sky-950/20 border-sky-500/40'
                    : 'bg-slate-950/85 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Summary Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    {/* ID 16 Digit Permanen di atas nama user */}
                    <div className="mb-1">
                      <UserId16AboveNameBanner
                        account={acc}
                        size="xs"
                        showCopyButton={true}
                        showPermanentTag={true}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-white text-sm sm:text-base">
                        {acc.fullName}
                      </span>
                      {acc.isVerified && <VerifiedBadge size="sm" label={acc.verifiedLabel} />}
                      {isOa && <OaAccountBadge size="xs" />}
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-cyan-400 text-slate-950">
                          SEDANG LOGIN AKTIF
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          acc.cardStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : acc.cardStatus === 'frozen'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                            : acc.cardStatus === 'banned'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {acc.cardStatus === 'frozen'
                          ? '❄️ DIBEKUKAN'
                          : acc.cardStatus === 'active'
                          ? '● AKTIF'
                          : acc.cardStatus.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Kartu {acc.cardTier}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono">
                      <span>
                        No. Rek: <strong className="text-amber-300">{acc.accountNumber}</strong>
                      </span>
                      <span>
                        Saldo: <strong className="text-emerald-300">{formatRupiah(acc.balance)}</strong>
                      </span>
                      <span>
                        Lv.{acc.jobLevel || 1} • Koin: {(acc.spinCoins || 0).toLocaleString('id-ID')} • Emas:{' '}
                        {(acc.goldGrams || 0).toFixed(2)}g
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminQuickLoginToAccount(acc.id);
                        showNotice(res.success ? 'success' : 'error', res.message);
                        if (res.success && onQuickSwitchToDashboard) {
                          onQuickSwitchToDashboard();
                        }
                      }}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>⚡ Masuk Cepat</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => copyOaCredentialsPackage(acc)}
                      className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      title="Salin No. Rek, ID 16 Digit, PIN Kartu & PIN Admin OA"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>
                        {copiedOaPackageId === acc.id ? 'Tersalin!' : 'Salin Kredensial OA'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminQuickToggleFreezeAccount(acc.id);
                        showNotice(res.success ? 'success' : 'error', res.message);
                      }}
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border ${
                        isFrozen
                          ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/50'
                          : 'bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border-sky-500/50'
                      }`}
                    >
                      {isFrozen ? (
                        <>
                          <Flame className="w-3.5 h-3.5" />
                          <span>Cairkan</span>
                        </>
                      ) : (
                        <>
                          <Snowflake className="w-3.5 h-3.5" />
                          <span>Bekukan</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (isEditing) {
                          setEditingAccountId(null);
                          setEditDraft(null);
                        } else {
                          startInlineEdit(acc);
                        }
                      }}
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer border ${
                        isEditing
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditing ? 'Tutup Edit' : 'Edit Semua Data'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setConfirmDeleteAccountId(isConfirmingDelete ? null : acc.id)
                      }
                      className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600 hover:text-white text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>

                {/* =========================================================================
                    PANEL KHUSUS: LIHAT / SEMBUNYI / SALIN / UBAH LANGSUNG PIN KARTU ORANG LAIN
                    & PENGATURAN STATUS AKUN OA
                   ========================================================================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80">
                  {/* Kotak Kiri: Lihat, Salin & Ubah PIN Kartu 6 Digit */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          PIN Kartu Pengguna (6 Digit):
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-base font-black text-emerald-300 tracking-widest bg-slate-950 px-2.5 py-0.5 rounded-lg border border-emerald-500/40">
                            {isPinHidden ? '••••••' : acc.pin}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setHiddenPinMap((prev) => ({
                                ...prev,
                                [acc.id]: !prev[acc.id],
                              }))
                            }
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                            title={isPinHidden ? 'Lihat PIN Kartu' : 'Sembunyikan PIN Kartu'}
                          >
                            {isPinHidden ? (
                              <>
                                <Eye className="w-3 h-3 text-cyan-300" />
                                <span>Lihat</span>
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3 text-slate-400" />
                                <span>Sembunyi</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(acc.pin);
                              setCopiedPinId(acc.id);
                              setTimeout(() => setCopiedPinId(null), 1800);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedPinId === acc.id ? (
                              <>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Tersalin</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin PIN</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ubah PIN Langsung di Tempat yang Sama */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={inlinePinVal}
                        onChange={(e) =>
                          setInlinePinEditMap((prev) => ({
                            ...prev,
                            [acc.id]: e.target.value.replace(/\D/g, '').slice(0, 6),
                          }))
                        }
                        placeholder="6 Digit PIN"
                        className="w-24 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs text-center tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const rand = generateRandomPin6();
                          setInlinePinEditMap((prev) => ({ ...prev, [acc.id]: rand }));
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 cursor-pointer"
                        title="Acak PIN 6 Digit"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminDirectChangeAccountPin(acc.id, inlinePinVal);
                          showNotice(res.success ? 'success' : 'error', res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
                      >
                        Ubah PIN
                      </button>
                    </div>
                  </div>

                  {/* Kotak Kanan: Kontrol Status Akun OA & PIN Admin OA */}
                  <div className="p-3 rounded-xl bg-slate-900/90 border border-amber-500/35 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">
                          Status Login Dengan Akun OA:
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                              isOa
                                ? 'bg-amber-500/25 text-amber-200 border border-amber-400/50'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isOa ? '✓ AKUN OA AKTIF' : 'AKUN BIASA (NON-OA)'}
                          </span>
                          <span className="font-mono text-[11px] text-rose-300">
                            PIN Admin OA: <strong>{acc.oaAdminPin || '159357'}</strong>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={inlineOaPinVal}
                        onChange={(e) =>
                          setInlineOaPinEditMap((prev) => ({
                            ...prev,
                            [acc.id]: e.target.value.replace(/\D/g, '').slice(0, 6),
                          }))
                        }
                        placeholder="PIN Admin OA"
                        title="PIN Admin khusus Akun OA"
                        className="w-24 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-rose-200 font-mono text-xs text-center tracking-widest"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminToggleOaAccountStatus(acc.id, true, inlineOaPinVal);
                          showNotice(res.success ? 'success' : 'error', res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                      >
                        {isOa ? 'Simpan OA' : 'Jadikan OA'}
                      </button>
                      {isOa && acc.id !== 'acc-admin' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminToggleOaAccountStatus(acc.id, false);
                            showNotice(res.success ? 'success' : 'error', res.message);
                          }}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-200 text-[10px] font-bold cursor-pointer"
                        >
                          Matikan OA
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Confirmation for Permanent Delete */}
                {isConfirmingDelete && (
                  <div className="p-3.5 rounded-xl bg-rose-950/90 border-2 border-rose-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-white">
                          Konfirmasi Hapus Permanen Akun "{acc.fullName}" ({acc.accountNumber})?
                        </p>
                        <p className="text-[11px] text-rose-200">
                          Seluruh data rekening, riwayat transaksi, celengan, deposito, dan pinjaman akun ini akan dihapus permanen.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminDeleteAccount(acc.id, { logoutIfCurrent: true });
                          showNotice(res.success ? 'success' : 'error', res.message);
                          setConfirmDeleteAccountId(null);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black cursor-pointer"
                      >
                        Ya, Hapus Permanen Sekarang
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteAccountId(null)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline Full Account Editor */}
                {isEditing && editDraft && (
                  <div className="p-4 rounded-2xl bg-slate-900 border-2 border-amber-500/60 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-black text-amber-300 flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4" />
                        <span>Edit Lengkap Semua Data Akun (termasuk ID 16 Digit & Status OA)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccountId(null);
                          setEditDraft(null);
                        }}
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Nama Lengkap Nasabah
                        </label>
                        <input
                          type="text"
                          value={editDraft.fullName}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, fullName: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-cyan-300 font-bold">
                            ID 16 Digit Di Atas Nama
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setEditDraft({
                                ...editDraft,
                                userId16: generateRandomUserId16(
                                  accounts.map((a) => ensureAccountUserId16(a))
                                ),
                              })
                            }
                            className="text-[10px] text-amber-300 font-bold hover:underline cursor-pointer"
                          >
                            Acak 16 Digit
                          </button>
                        </div>
                        <input
                          type="text"
                          maxLength={16}
                          value={editDraft.userId16}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              userId16: e.target.value.replace(/\D/g, '').slice(0, 16),
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/50 text-amber-300 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Nomor Rekening (6–16 Digit)
                        </label>
                        <input
                          type="text"
                          value={editDraft.accountNumber}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, accountNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-emerald-300 font-bold block mb-1">
                          PIN Kartu (6 Digit)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editDraft.pin}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/50 text-emerald-300 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-rose-300 font-bold block mb-1">
                          PIN Admin OA (6 Digit)
                        </label>
                        <input
                          type="text"
                          maxLength={6}
                          value={editDraft.oaAdminPin}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              oaAdminPin: e.target.value.replace(/\D/g, '').slice(0, 6),
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-rose-500/50 text-rose-300 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Nomor Telepon / WA
                        </label>
                        <input
                          type="text"
                          value={editDraft.phone}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, phone: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Email Akun
                        </label>
                        <input
                          type="text"
                          value={editDraft.email}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, email: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          NIK (16 Digit)
                        </label>
                        <input
                          type="text"
                          value={editDraft.nik}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, nik: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Alamat Lengkap
                        </label>
                        <input
                          type="text"
                          value={editDraft.address}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, address: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] text-slate-400 font-bold">
                            Saldo Rekening (Rp)
                          </label>
                          <label className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editDraft.isUnlimited}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, isUnlimited: e.target.checked })
                              }
                            />
                            <span>Unlimited ∞</span>
                          </label>
                        </div>
                        <input
                          type="number"
                          disabled={editDraft.isUnlimited}
                          value={editDraft.balance}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, balance: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono disabled:opacity-50"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Tier Kartu ATM
                        </label>
                        <select
                          value={editDraft.cardTier}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              cardTier: e.target.value as CardTier,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="regular">Reguler (Biru)</option>
                          <option value="gold">Gold (Emas)</option>
                          <option value="premium">Premium (Hitam Emas)</option>
                          <option value="platinum">Platinum VIP (Ungu)</option>
                          <option value="admin">Admin Infinity (∞)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Status Kartu
                        </label>
                        <select
                          value={editDraft.cardStatus}
                          onChange={(e) =>
                            setEditDraft({
                              ...editDraft,
                              cardStatus: e.target.value as CardStatus,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                        >
                          <option value="active">Active (Aktif)</option>
                          <option value="frozen">Frozen (Dibekukan)</option>
                          <option value="pending">Pending (Menunggu)</option>
                          <option value="banned">Banned (Diblokir)</option>
                          <option value="rejected">Rejected (Ditolak)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Nomor Kartu 16 Digit
                        </label>
                        <input
                          type="text"
                          value={editDraft.cardNumber}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, cardNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          CVV & Masa Berlaku
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            maxLength={4}
                            value={editDraft.cvv}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, cvv: e.target.value })
                            }
                            placeholder="CVV"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                          <input
                            type="text"
                            value={editDraft.expiryDate}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, expiryDate: e.target.value })
                            }
                            placeholder="MM/YY"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Level Kerja & Voucher Level
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="number"
                            value={editDraft.jobLevel}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, jobLevel: e.target.value })
                            }
                            placeholder="Level"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                          <input
                            type="number"
                            value={editDraft.levelVouchers}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, levelVouchers: e.target.value })
                            }
                            placeholder="Voucher"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Koin Spin & Emas (Gram)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="number"
                            value={editDraft.spinCoins}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, spinCoins: e.target.value })
                            }
                            placeholder="Koin"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-mono"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={editDraft.goldGrams}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, goldGrams: e.target.value })
                            }
                            placeholder="Emas (g)"
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-yellow-300 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold block mb-1">
                          Click Power & Salary Multiplier
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          <input
                            type="number"
                            value={editDraft.clickPower}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, clickPower: e.target.value })
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono"
                          />
                          <input
                            type="number"
                            value={editDraft.salaryMultiplier}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, salaryMultiplier: e.target.value })
                            }
                            className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] text-amber-300 font-bold block mb-1">
                          Role Dev / Own / Admin (10 Role)
                        </label>
                        <select
                          value={editDraft.devRoleId}
                          onChange={(e) =>
                            setEditDraft({ ...editDraft, devRoleId: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 font-bold"
                        >
                          <option value="">— Nasabah Biasa (Tanpa Role Dev) —</option>
                          {devRoles.map((r) => (
                            <option key={r.id} value={r.id}>
                              Slot #{r.slotNumber}: {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer text-amber-300 font-bold">
                          <input
                            type="checkbox"
                            checked={editDraft.isOfficialAdminAccount}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                isOfficialAdminAccount: e.target.checked,
                              })
                            }
                          />
                          <span>Status Akun OA Resmi (Bisa Login Akun OA)</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer text-cyan-300 font-bold">
                          <input
                            type="checkbox"
                            checked={editDraft.isVerified}
                            onChange={(e) =>
                              setEditDraft({ ...editDraft, isVerified: e.target.checked })
                            }
                          />
                          <span>Centang Biru Verified</span>
                        </label>
                        <label className="inline-flex items-center gap-2 cursor-pointer text-emerald-300 font-bold">
                          <input
                            type="checkbox"
                            checked={editDraft.vipShieldActive}
                            onChange={(e) =>
                              setEditDraft({
                                ...editDraft,
                                vipShieldActive: e.target.checked,
                              })
                            }
                          />
                          <span>VIP Shield Aktif</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveInlineEdit(acc.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Semua Perubahan</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
