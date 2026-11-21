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
import { BankAccount, CardStatus, CardTier, StructuredIndonesiaAddress } from '../types/bank';
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
import { IndonesiaAddressPicker } from './IndonesiaAddressPicker';
import {
  createEmptyStructuredAddress,
  validateStructuredAddress,
} from '../data/indonesiaRegionsOffline';

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
    adminSetAccountJobLevel,
    adminToggleVerifyAccount,
    adminAssignAccountDevRole,
    adminBanCard,
    adminUnbanCard,
    adminResetPinAttempts,
    adminCloneAccount,
    adminForgiveOrPayoffLoans,
    adminClearTransactionHistory,
    adminGrantAccountSultanBusinesses,
    adminConnectAccountToEmail,
    adminSendWebsiteBroadcast,
    linkCurrentAccountWithGooglePopup,
  } = useBank();

  const [searchQuery, setSearchQuery] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // State Studio Buat Akun 3 Mode Terpisah (Tanpa Batas di Panel Admin): Guest | Biasa Tanpa Google | Akun OA
  const [showCreateStudio, setShowCreateStudio] = useState<boolean>(true);
  const [cAccountCategory, setCAccountCategory] = useState<'guest' | 'regular_no_google' | 'oa'>('oa');
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
  const [cAddress, setCAddress] = useState('');
  const [cStructuredAddress, setCStructuredAddress] = useState<StructuredIndonesiaAddress>(() =>
    createEmptyStructuredAddress()
  );
  const [cCardTier, setCCardTier] = useState<CardTier>('platinum');
  const [cBalance, setCBalance] = useState('0');
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
    structuredAddress?: StructuredIndonesiaAddress;
    isGuestAccount?: boolean;
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

  // State Laci Super Kontrol & Suntik Aset Lengkap per akun di Kelola Akun
  const [expandedControlDrawerMap, setExpandedControlDrawerMap] = useState<Record<string, boolean>>({});
  const [linkingGoogleAccId, setLinkingGoogleAccId] = useState<string | null>(null);
  const [customEmailInputMap, setCustomEmailInputMap] = useState<Record<string, string>>({});
  const [customInjectInputMap, setCustomInjectInputMap] = useState<
    Record<
      string,
      {
        balance?: string;
        gold?: string;
        coins?: string;
        pulsa?: string;
        pln?: string;
        points?: string;
        vouchers?: string;
        clickPower?: string;
        salaryMult?: string;
        cashback?: string;
        spendingLimit?: string;
        popupTitle?: string;
        popupMsg?: string;
      }
    >
  >({});

  // Daftar email Google nyata yang sudah terdaftar di sistem untuk dropdown sambung cepat
  const registeredGoogleEmails = React.useMemo(() => {
    const set = new Set<string>();
    for (const a of accounts) {
      const em = (a.email || '').trim().toLowerCase();
      if (
        em &&
        em.includes('@') &&
        !em.endsWith('@nusantara.id') &&
        !em.endsWith('@banknusantara.id') &&
        !em.startsWith('oa.')
      ) {
        set.add(em);
      }
    }
    return Array.from(set);
  }, [accounts]);

  const updateInjectInput = (
    accId: string,
    field: keyof NonNullable<typeof customInjectInputMap[string]>,
    value: string
  ) => {
    setCustomInjectInputMap((prev) => ({
      ...prev,
      [accId]: {
        ...(prev[accId] || {}),
        [field]: value,
      },
    }));
  };

  const handleLinkAccountWithGooglePopupFromAdmin = async (accId: string) => {
    if (linkingGoogleAccId) return;
    setLinkingGoogleAccId(accId);
    try {
      const res = await linkCurrentAccountWithGooglePopup(accId);
      if (res.success || res.errorCode !== 'auth/popup-closed-by-user') {
        showNotice(res.success ? 'success' : 'error', res.message);
      }
    } finally {
      setLinkingGoogleAccId(null);
    }
  };

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
    const isGuest = cAccountCategory === 'guest';
    const isOa = cAccountCategory === 'oa';

    if (!isGuest) {
      const addrCheck = validateStructuredAddress(cStructuredAddress);
      if (!addrCheck.valid && !cAddress.trim()) {
        showNotice(
          'error',
          addrCheck.message ||
            'Alamat wilayah Indonesia (Provinsi hingga RT/RW) wajib dipilih secara manual untuk Akun Biasa dan Akun OA.'
        );
        return;
      }
    }

    const res = adminCreateFullCustomAccount({
      fullName: cFullName,
      userId16: cUserId16,
      accountNumber: cAccountNumber,
      cardNumber: cCardNumber,
      cvv: cCvv,
      expiryDate: cExpiryDate,
      pin: cPin,
      oaAdminPin: isOa ? cOaAdminPin : undefined,
      nik: cNik,
      phone: cPhone,
      email: isOa ? cEmail : '',
      address: isGuest ? '' : cAddress,
      structuredAddress: isGuest ? undefined : cStructuredAddress,
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
      isOfficialAdminAccount: isOa,
      accountCategory: cAccountCategory,
    });

    showNotice(res.success ? 'success' : 'error', res.message);
    if (res.success && res.account) {
      setLastCreatedOaAccount(res.account);
      setCFullName('');
      setCAddress('');
      setCStructuredAddress(createEmptyStructuredAddress());
      handleRandomizeAllCreatorFields();
    }
  };

  const copyOaCredentialsPackage = (acc: BankAccount) => {
    const id16 = ensureAccountUserId16(acc);
    const isOa = Boolean(acc.isOfficialAdminAccount || acc.id === 'acc-admin');
    const isGuest = Boolean(acc.isGuestAccount);
    const oaPin = acc.oaAdminPin || '159357';
    const headerTitle = isOa
      ? '=== KREDENSIAL LOGIN AKUN OA BANK NUSANTARA ==='
      : isGuest
      ? '=== KREDENSIAL LOGIN AKUN GUEST (VIA "LOGIN KE AKUN") ==='
      : '=== KREDENSIAL LOGIN AKUN BIASA TANPA GOOGLE (VIA "LOGIN KE AKUN") ===';
    const lines = [
      headerTitle,
      `Nama Pemilik : ${acc.fullName}`,
      `No. Rekening : ${acc.accountNumber}`,
      `ID 16 Digit  : ${formatUserId16(id16)} (${id16})`,
      `PIN Kartu    : ${acc.pin}`,
    ];
    if (isOa) {
      lines.push(`PIN Admin OA : ${oaPin}`);
      lines.push('Jalur Masuk  : Lobi Awal -> Login Dengan Akun OA');
    } else {
      lines.push('Jalur Masuk  : Lobi Awal -> Login Ke Akun');
    }
    lines.push(`Jenis Kartu  : ${CARD_TIER_CONFIGS[acc.cardTier]?.nameIndo || acc.cardTier}`);
    const text = lines.join('\n');
    navigator.clipboard.writeText(text);
    setCopiedOaPackageId(acc.id);
    setTimeout(() => setCopiedOaPackageId(null), 2200);
    showNotice('success', `Paket Kredensial Login untuk "${acc.fullName}" berhasil disalin!`);
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
      structuredAddress: acc.structuredAddress || createEmptyStructuredAddress(),
      isGuestAccount: Boolean(acc.isGuestAccount),
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
      address: editDraft.isGuestAccount ? '' : editDraft.address.trim(),
      structuredAddress: editDraft.isGuestAccount ? undefined : editDraft.structuredAddress,
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
                  Studio Buat Akun 3 Mode (Guest · Biasa Tanpa Google · Akun OA)
                </h3>
                <OaAccountBadge size="sm" />
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Admin bebas membuat tanpa batas untuk <strong>3 jenis akun terpisah</strong> dengan saldo awal bebas (Rp 0 hingga Unlimited ∞). <strong>Akun Guest</strong> tanpa alamat, sedangkan <strong>Akun Biasa Tanpa Google</strong> dan <strong>Akun OA</strong> menggunakan pemilih wilayah Indonesia 38 provinsi manual.
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

        {/* Pemilih 3 Mode Pembuatan Akun Terpisah di Panel Admin (Tanpa Batas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {(
            [
              {
                id: 'guest' as const,
                title: '1. Buat Akun Guest',
                subtitle: 'Tanpa batas di Admin · Tanpa alamat · Login via "Login Ke Akun"',
                activeCls: 'bg-emerald-500/15 border-emerald-400 text-white',
                titleCls: 'text-emerald-300',
              },
              {
                id: 'regular_no_google' as const,
                title: '2. Buat Akun Biasa Tanpa Google',
                subtitle: 'Tanpa Google · Alamat 38 Provinsi Manual · Login via "Login Ke Akun"',
                activeCls: 'bg-sky-500/15 border-sky-400 text-white',
                titleCls: 'text-sky-300',
              },
              {
                id: 'oa' as const,
                title: '3. Buat Akun OA (Official Admin)',
                subtitle: 'Akun Otoritas Admin · Alamat 38 Provinsi Manual · Login via "Akun OA"',
                activeCls: 'bg-amber-500/15 border-amber-400 text-white',
                titleCls: 'text-amber-300',
              },
            ]
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => {
                setCAccountCategory(mode.id);
                if (mode.id === 'guest') {
                  setCCardTier('regular');
                  setCIsUnlimited(false);
                  setCAddress('');
                  setCStructuredAddress(createEmptyStructuredAddress());
                  setCEmail('');
                } else if (mode.id === 'regular_no_google') {
                  setCEmail('');
                }
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                cAccountCategory === mode.id
                  ? mode.activeCls
                  : 'bg-slate-950/75 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className={`text-xs font-black ${mode.titleCls}`}>{mode.title}</div>
              <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{mode.subtitle}</div>
            </button>
          ))}
        </div>

        {/* Kartu Ringkasan Kredensial Akun yang Baru Saja Dibuat */}
        {lastCreatedOaAccount && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400/70 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-black text-sm text-white">
                  {lastCreatedOaAccount.isOfficialAdminAccount
                    ? 'Akun OA Berhasil Dibuat & Langsung Aktif! Login via "Login Dengan Akun OA"'
                    : lastCreatedOaAccount.isGuestAccount
                    ? 'Akun Guest Berhasil Dibuat & Langsung Aktif! Login via "Login Ke Akun"'
                    : 'Akun Biasa Tanpa Google Berhasil Dibuat! Login via "Login Ke Akun"'}
                </span>
                {lastCreatedOaAccount.isOfficialAdminAccount && <OaAccountBadge size="xs" />}
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
                      : 'Salin Paket Kredensial'}
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
              {lastCreatedOaAccount.isOfficialAdminAccount && (
                <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">4. PIN Admin OA</span>
                  <span className="font-mono font-black text-rose-300 text-sm">
                    {lastCreatedOaAccount.oaAdminPin || '159357'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {showCreateStudio && (
          <form onSubmit={handleCreateCustomAccountSubmit} className="space-y-4 text-xs">
            {/* Baris 1: Identitas & Kredensial Utama */}
            <div className="p-4 rounded-2xl bg-slate-950/85 border border-amber-500/30 space-y-3">
              <div className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                <Fingerprint className="w-4 h-4" />
                <span>
                  A. Identitas, ID 16 Digit Permanen &amp; Kredensial Login (
                  {cAccountCategory === 'guest'
                    ? 'Mode Akun Guest — Tanpa Alamat'
                    : cAccountCategory === 'regular_no_google'
                    ? 'Mode Akun Biasa Tanpa Google'
                    : 'Mode Akun OA Resmi'}
                  )
                </span>
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

                {cAccountCategory === 'oa' && (
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
                )}

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

                {cAccountCategory === 'oa' && (
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-slate-300 font-bold block mb-1">
                      Email Akun OA (Opsional)
                    </label>
                    <input
                      type="text"
                      value={cEmail}
                      onChange={(e) => setCEmail(e.target.value)}
                      placeholder="Email OA (opsional)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                )}

                {cAccountCategory === 'guest' ? (
                  <div className="sm:col-span-2 lg:col-span-4 p-3 rounded-xl bg-emerald-950/35 border border-emerald-500/35 text-[11px] text-emerald-200">
                    <strong>Mode Akun Guest:</strong> Sesuai kebijakan, Akun Guest dibuat <strong>tanpa kolom alamat domisili</strong> dan tanpa sambungan email Google.
                  </div>
                ) : (
                  <div className="sm:col-span-2 lg:col-span-4 pt-1">
                    <IndonesiaAddressPicker
                      value={cStructuredAddress}
                      formattedAddress={cAddress}
                      onChange={(formatted, structured) => {
                        setCAddress(formatted);
                        setCStructuredAddress(structured);
                      }}
                      enableGoogleMapsTab
                      compact
                      label="Alamat Wilayah Indonesia Lengkap (Manual 38 Provinsi hingga Desa & RT/RW — Wajib Urut dari Atas)"
                    />
                  </div>
                )}
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
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="text-[10px] text-slate-300 font-bold">Saldo Rekening (Rp)</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCIsUnlimited(false);
                          setCBalance('0');
                        }}
                        className="text-[10px] font-bold text-cyan-300 hover:underline cursor-pointer"
                      >
                        Set Rp 0
                      </button>
                      <label className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cIsUnlimited}
                          onChange={(e) => setCIsUnlimited(e.target.checked)}
                        />
                        <span>Unlimited ∞</span>
                      </label>
                    </div>
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

                {/* =========================================================================
                    BAR TOMBOL SAKLAR 1-KLIK LANGSUNG DI TIAP KARTU AKUN (KELOLA AKUN SUPER)
                    - Toggle Perlindungan VIP (VIP Shield), Centang Biru, Saldo Unlimited
                    - Ganti Kasta Kartu Cepat, Level 50, 12 Bisnis Sultan
                    - Reset 5x Salah PIN, Buka Banned / Banned Cepat, Duplikat Akun
                    - Sign in with Google (Sambungkan Akun OA / Guest ke Email Google)
                    - Tombol Buka Laci Super Kontrol & Suntik Aset Lengkap
                   ========================================================================= */}
                <div className="p-3 rounded-2xl bg-slate-900/95 border border-cyan-500/30 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Bar Saklar 1-Klik & Kontrol Cepat Akun:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedControlDrawerMap((prev) => ({
                          ...prev,
                          [acc.id]: !prev[acc.id],
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1.5 cursor-pointer transition shadow ${
                        expandedControlDrawerMap[acc.id]
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950'
                          : 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 hover:from-cyan-500/30 hover:to-indigo-500/30 border border-cyan-400/50 text-cyan-200'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {expandedControlDrawerMap[acc.id]
                          ? '▲ Tutup Laci Super Kontrol & Suntik Aset'
                          : '⚡ Buka Laci Super Kontrol & Suntik Aset Lengkap'}
                      </span>
                    </button>
                  </div>

                  {/* Deretan Tombol Saklar 1-Klik */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    {/* 1. Toggle Perlindungan VIP (VIP Shield) */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextShield = !acc.vipShieldActive;
                        const res = adminQuickFullEditAccount(acc.id, {
                          vipShieldActive: nextShield,
                        });
                        showNotice(
                          res.success ? 'success' : 'error',
                          `🛡️ Perlindungan VIP (VIP Shield) untuk "${acc.fullName}" ${
                            nextShield ? 'DIAKTIFKAN (Anti-Pajak & Proteksi Penuh)' : 'DIMATIKAN'
                          }.`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer border transition ${
                        acc.vipShieldActive
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title="Toggle Perlindungan VIP (Anti-Pajak, Proteksi Saldo & Prioritas VIP)"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Perlindungan VIP: {acc.vipShieldActive ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* 2. Toggle Centang Biru (Verified) */}
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminToggleVerifyAccount(
                          acc.id,
                          acc.verifiedLabel || 'Nasabah VIP Terverifikasi Resmi'
                        );
                        showNotice(res.success ? 'success' : 'error', res.message);
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer border transition ${
                        acc.isVerified
                          ? 'bg-sky-500/25 border-sky-400 text-sky-200'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Centang Biru: {acc.isVerified ? 'ON' : 'OFF'}</span>
                    </button>

                    {/* 3. Toggle Saldo Unlimited ∞ */}
                    <button
                      type="button"
                      onClick={() => {
                        const currentlyUnlim = isUnlimitedNumber(acc.balance);
                        const res = adminQuickFullEditAccount(acc.id, {
                          balance: currentlyUnlim ? 100_000_000 : UNLIMITED_BALANCE,
                        });
                        showNotice(
                          res.success ? 'success' : 'error',
                          currentlyUnlim
                            ? `Saldo "${acc.fullName}" dikembalikan ke Rp 100.000.000.`
                            : `∞ Saldo "${acc.fullName}" diubah menjadi UNLIMITED (Tak Terbatas)!`
                        );
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-black flex items-center gap-1 cursor-pointer border transition ${
                        isUnlimitedNumber(acc.balance)
                          ? 'bg-fuchsia-500/25 border-fuchsia-400 text-fuchsia-200'
                          : 'bg-slate-950 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <InfinityIcon className="w-3.5 h-3.5" />
                      <span>
                        Unlimited ∞: {isUnlimitedNumber(acc.balance) ? 'ON' : 'OFF'}
                      </span>
                    </button>

                    {/* 4. Ganti Kasta Kartu Cepat */}
                    <div className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-slate-950 border border-indigo-500/40">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                      <select
                        value={acc.cardTier}
                        onChange={(e) => {
                          const nextTier = e.target.value as CardTier;
                          const res = adminQuickFullEditAccount(acc.id, {
                            cardTier: nextTier,
                            ...(nextTier === 'admin'
                              ? {
                                  balance: UNLIMITED_BALANCE,
                                  expiryDate: '∞ / SELAMANYA',
                                }
                              : {}),
                          });
                          showNotice(
                            res.success ? 'success' : 'error',
                            `💳 Kasta kartu "${acc.fullName}" diubah ke ${nextTier.toUpperCase()}!`
                          );
                        }}
                        className="bg-transparent text-indigo-200 font-black text-[11px] focus:outline-none cursor-pointer"
                        title="Ganti Kasta Kartu Instan"
                      >
                        <option value="regular" className="bg-slate-900">
                          Kasta: Reguler
                        </option>
                        <option value="gold" className="bg-slate-900">
                          Kasta: Gold
                        </option>
                        <option value="premium" className="bg-slate-900">
                          Kasta: Premium
                        </option>
                        <option value="platinum" className="bg-slate-900">
                          Kasta: Platinum VIP
                        </option>
                        <option value="admin" className="bg-slate-900">
                          Kasta: Admin ∞
                        </option>
                      </select>
                    </div>

                    {/* 5. Tombol 1-Klik Level 50 */}
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminSetAccountJobLevel(acc.id, 50);
                        showNotice(res.success ? 'success' : 'error', res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>Level 50 Max</span>
                    </button>

                    {/* 6. Tombol 1-Klik 12 Bisnis Sultan */}
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminGrantAccountSultanBusinesses(acc.id, 10);
                        showNotice(res.success ? 'success' : 'error', res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-black flex items-center gap-1 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>+12 Bisnis Sultan</span>
                    </button>

                    {/* 7. Tombol 1-Klik Reset 5x Salah PIN */}
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminResetPinAttempts(acc.id);
                        showNotice(res.success ? 'success' : 'error', res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
                      title="Reset percobaan salah PIN kembali ke 0/5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reset Salah PIN ({acc.failedPinAttempts || 0}/5)</span>
                    </button>

                    {/* 8. Tombol 1-Klik Buka Banned / Banned Cepat */}
                    {acc.cardStatus === 'banned' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminUnbanCard(acc.id);
                          showNotice(res.success ? 'success' : 'error', res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>🔓 Buka Banned</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminBanCard({
                            accountId: acc.id,
                            durationType: 'custom',
                            durationMinutes: 1440,
                            durationLabel: '1 Hari',
                            reason: 'Diblokir sementara oleh Otoritas Panel Admin',
                          });
                          showNotice(res.success ? 'success' : 'error', res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>🚫 Banned 1 Hari</span>
                      </button>
                    )}

                    {/* 9. Tombol 1-Klik Duplikat Akun */}
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminCloneAccount(acc.id);
                        showNotice(res.success ? 'success' : 'error', res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/50 text-purple-200 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>🧬 Duplikat Akun</span>
                    </button>

                    {/* 10. Tombol Sign in with Google / Status Email Terhubung */}
                    {(() => {
                      const rawEm = (acc.email || '').trim().toLowerCase();
                      const isUnlinked =
                        acc.isGuestAccount ||
                        !rawEm ||
                        rawEm.endsWith('@nusantara.id') ||
                        rawEm.endsWith('@banknusantara.id') ||
                        rawEm.startsWith('oa.');
                      return isUnlinked ? (
                        <button
                          type="button"
                          onClick={() => handleLinkAccountWithGooglePopupFromAdmin(acc.id)}
                          disabled={linkingGoogleAccId === acc.id}
                          className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black flex items-center gap-1.5 cursor-pointer shadow"
                          title="Sambungkan akun ini ke email Google lewat popup Sign in with Google"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          <span>
                            {linkingGoogleAccId === acc.id
                              ? 'Menyambungkan...'
                              : 'Sign in with Google'}
                          </span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] font-bold">
                          🔗 Google: {acc.email}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* =========================================================================
                    LACI SUPER KONTROL & SUNTIK ASET LENGKAP (EXPANDABLE DRAWER PER AKUN)
                   ========================================================================= */}
                {expandedControlDrawerMap[acc.id] && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/60 border-2 border-cyan-500/50 space-y-4 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-black text-white text-sm">
                          Laci Super Kontrol, Suntik Aset, Boost & Sambung Email Google — "{acc.fullName}"
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedControlDrawerMap((prev) => ({ ...prev, [acc.id]: false }))
                        }
                        className="text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* SEKSI 1: SUNTIK & ATUR 6 ASET INSTAN */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {/* 1. Suntik Saldo Rupiah */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-emerald-500/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-emerald-300">1. Suntik Saldo Rupiah</span>
                          <span className="font-mono text-[11px] text-white font-bold">
                            {isUnlimitedNumber(acc.balance) ? '∞ UNLIMITED' : formatRupiah(acc.balance)}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: '+10 Jt', add: 10_000_000 },
                            { label: '+100 Jt', add: 100_000_000 },
                            { label: '+1 Miliar', add: 1_000_000_000 },
                            { label: '+100 M', add: 100_000_000_000 },
                          ].map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              onClick={() => {
                                const base = isUnlimitedNumber(acc.balance) ? 0 : acc.balance;
                                const res = adminQuickFullEditAccount(acc.id, {
                                  balance: base + b.add,
                                });
                                showNotice(
                                  res.success ? 'success' : 'error',
                                  `💰 Saldo "${acc.fullName}" ditambah ${b.label}!`
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-[10px] cursor-pointer"
                            >
                              {b.label}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminQuickFullEditAccount(acc.id, {
                                balance: UNLIMITED_BALANCE,
                              });
                              showNotice(
                                res.success ? 'success' : 'error',
                                `∞ Saldo "${acc.fullName}" diset ke UNLIMITED!`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            Set ∞
                          </button>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={customInjectInputMap[acc.id]?.balance || ''}
                            onChange={(e) => updateInjectInput(acc.id, 'balance', e.target.value)}
                            placeholder="Nominal Rp bebas..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(customInjectInputMap[acc.id]?.balance || 0);
                              if (!val) return;
                              const base = isUnlimitedNumber(acc.balance) ? 0 : acc.balance;
                              adminQuickFullEditAccount(acc.id, { balance: Math.max(0, base + val) });
                              showNotice('success', `Saldo "${acc.fullName}" ditambah ${formatRupiah(val)}.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            +Tambah
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(customInjectInputMap[acc.id]?.balance || 0);
                              adminQuickFullEditAccount(acc.id, { balance: Math.max(0, val) });
                              showNotice('success', `Saldo "${acc.fullName}" diatur ke ${formatRupiah(val)}.`);
                            }}
                            className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[10px] cursor-pointer"
                          >
                            Set
                          </button>
                        </div>
                      </div>

                      {/* 2. Suntik Emas 24K */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-300">2. Suntik Emas 24K (Gram)</span>
                          <span className="font-mono text-[11px] text-amber-200 font-bold">
                            {(acc.goldGrams || 0).toFixed(2)} g
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[10, 100, 1000, 10000].map((g) => (
                            <button
                              key={g}
                              type="button"
                              onClick={() => {
                                adminQuickFullEditAccount(acc.id, {
                                  goldGrams: (acc.goldGrams || 0) + g,
                                });
                                showNotice('success', `🪙 +${g}g Emas 24K ditambahkan ke "${acc.fullName}"!`);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[10px] cursor-pointer"
                            >
                              +{g.toLocaleString('id-ID')}g
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            value={customInjectInputMap[acc.id]?.gold || ''}
                            onChange={(e) => updateInjectInput(acc.id, 'gold', e.target.value)}
                            placeholder="Gram emas..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(customInjectInputMap[acc.id]?.gold || 0);
                              adminQuickFullEditAccount(acc.id, {
                                goldGrams: Math.max(0, (acc.goldGrams || 0) + val),
                              });
                              showNotice('success', `Emas 24K "${acc.fullName}" ditambah ${val}g.`);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            +Gram
                          </button>
                        </div>
                      </div>

                      {/* 3. Suntik Koin Spin */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-fuchsia-500/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-fuchsia-300">3. Suntik Koin Spin</span>
                          <span className="font-mono text-[11px] text-fuchsia-200 font-bold">
                            {(acc.spinCoins || 0).toLocaleString('id-ID')} Koin
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[1000, 10000, 100000, 1000000].map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => {
                                const res = adminQuickFullEditAccount(acc.id, {
                                  spinCoins: (acc.spinCoins || 0) + c,
                                });
                                showNotice(
                                  res.success ? 'success' : 'error',
                                  `🎰 +${c.toLocaleString('id-ID')} Koin Spin ditambahkan ke "${acc.fullName}"!`
                                );
                              }}
                              className="px-2 py-1 rounded-lg bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/40 text-fuchsia-200 font-bold text-[10px] cursor-pointer"
                            >
                              +{c.toLocaleString('id-ID')}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={customInjectInputMap[acc.id]?.coins || ''}
                            onChange={(e) => updateInjectInput(acc.id, 'coins', e.target.value)}
                            placeholder="Jumlah koin..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = Number(customInjectInputMap[acc.id]?.coins || 0);
                              const res = adminQuickFullEditAccount(acc.id, {
                                spinCoins: Math.max(0, (acc.spinCoins || 0) + val),
                              });
                              showNotice(
                                res.success ? 'success' : 'error',
                                `Koin Spin "${acc.fullName}" ditambah ${val.toLocaleString('id-ID')} koin.`
                              );
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            +Koin
                          </button>
                        </div>
                      </div>

                      {/* 4. Suntik Pulsa & Token PLN kWh */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-cyan-300">4. Suntik Pulsa & Token PLN</span>
                          <span className="font-mono text-[10px] text-cyan-200">
                            {formatRupiah(acc.pulsaBalance || 0)} • {acc.plnKwhBalance || 0} kWh
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              adminQuickFullEditAccount(acc.id, {
                                pulsaBalance: (acc.pulsaBalance || 0) + 1_000_000,
                              });
                              showNotice('success', `📱 +Rp 1.000.000 Pulsa ditambahkan ke "${acc.fullName}".`);
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-[10px] cursor-pointer"
                          >
                            +1 Jt Pulsa
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              adminQuickFullEditAccount(acc.id, {
                                plnKwhBalance: (acc.plnKwhBalance || 0) + 500,
                              });
                              showNotice('success', `⚡ +500 kWh Token PLN ditambahkan ke "${acc.fullName}".`);
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[10px] cursor-pointer"
                          >
                            +500 kWh PLN
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              adminQuickFullEditAccount(acc.id, {
                                pulsaBalance: (acc.pulsaBalance || 0) + 10_000_000,
                                plnKwhBalance: (acc.plnKwhBalance || 0) + 5000,
                              });
                              showNotice(
                                'success',
                                `⚡ Paket +10 Jt Pulsa & +5.000 kWh PLN disuntikkan ke "${acc.fullName}"!`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-[10px] cursor-pointer"
                          >
                            +10 Jt & +5.000 kWh
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={customInjectInputMap[acc.id]?.pulsa || ''}
                              onChange={(e) => updateInjectInput(acc.id, 'pulsa', e.target.value)}
                              placeholder="Pulsa Rp"
                              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = Number(customInjectInputMap[acc.id]?.pulsa || 0);
                                adminQuickFullEditAccount(acc.id, {
                                  pulsaBalance: Math.max(0, (acc.pulsaBalance || 0) + val),
                                });
                                showNotice('success', `Pulsa ditambah ${formatRupiah(val)}.`);
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-500 text-slate-950 font-black text-[10px] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={customInjectInputMap[acc.id]?.pln || ''}
                              onChange={(e) => updateInjectInput(acc.id, 'pln', e.target.value)}
                              placeholder="PLN kWh"
                              className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-[10px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const val = Number(customInjectInputMap[acc.id]?.pln || 0);
                                adminQuickFullEditAccount(acc.id, {
                                  plnKwhBalance: Math.max(0, (acc.plnKwhBalance || 0) + val),
                                });
                                showNotice('success', `Token PLN ditambah ${val} kWh.`);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-[10px] cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 5. Suntik Poin Reward & Voucher Level Kerja */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-indigo-300">5. Poin Reward & Voucher Lv</span>
                          <span className="font-mono text-[10px] text-indigo-200">
                            {(acc.rewardPoints || 0).toLocaleString('id-ID')} Poin • {acc.levelVouchers || 0} Vch
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              adminQuickFullEditAccount(acc.id, {
                                rewardPoints: (acc.rewardPoints || 0) + 50_000,
                              });
                              showNotice('success', `🎁 +50.000 Poin Reward ditambahkan!`);
                            }}
                            className="px-2 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-200 font-bold text-[10px] cursor-pointer"
                          >
                            +50.000 Poin
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminQuickFullEditAccount(acc.id, {
                                levelVouchers: (acc.levelVouchers || 0) + 10,
                              });
                              showNotice(
                                res.success ? 'success' : 'error',
                                `🎟️ +10 Voucher Level Kerja ditambahkan ke "${acc.fullName}"!`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-[10px] cursor-pointer"
                          >
                            +10 Voucher Lv
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminQuickFullEditAccount(acc.id, {
                                levelVouchers: (acc.levelVouchers || 0) + 50,
                              });
                              showNotice(
                                res.success ? 'success' : 'error',
                                `🎟️ +50 Voucher Level Kerja ditambahkan ke "${acc.fullName}"!`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[10px] cursor-pointer"
                          >
                            +50 Voucher Lv
                          </button>
                        </div>
                      </div>

                      {/* 6. Atur Kekuatan Klik, Pengali Gaji, Cashback & Limit Harian */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/35 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-amber-300">
                            6. Boost Klik, Gaji, Cashback & Limit
                          </span>
                          <span className="font-mono text-[10px] text-emerald-300">
                            Klik {acc.clickPower || 1}x • Gaji {acc.salaryMultiplier || 1}x • CB{' '}
                            {acc.cashbackPercent || 0}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {[
                            { label: 'Klik 50x', patch: { clickPower: 50 } },
                            { label: 'Klik 500x', patch: { clickPower: 500 } },
                            { label: 'Gaji 25x', patch: { salaryMultiplier: 25 } },
                            { label: 'Gaji 100x', patch: { salaryMultiplier: 100 } },
                            { label: 'Cashback 25%', patch: { cashbackPercent: 25 } },
                            { label: 'Cashback 100%', patch: { cashbackPercent: 100 } },
                          ].map((b) => (
                            <button
                              key={b.label}
                              type="button"
                              onClick={() => {
                                adminQuickFullEditAccount(acc.id, b.patch);
                                showNotice('success', `⚡ Boost "${b.label}" diaktifkan untuk "${acc.fullName}"!`);
                              }}
                              className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 font-bold text-[10px] cursor-pointer"
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              adminQuickFullEditAccount(acc.id, {
                                dailyWithdrawnToday: 0,
                                customSpendingLimit: 1_000_000_000,
                                allowInternational: true,
                              });
                              showNotice(
                                'success',
                                `💳 Kuota tarik harian di-reset ke Rp 0, Limit Belanja diset Rp 1 Miliar & Internasional ON!`
                              );
                            }}
                            className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold text-[10px] cursor-pointer"
                          >
                            Reset Limit Harian + Set Rp 1 M + Intl ON
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminForgiveOrPayoffLoans(acc.id);
                              showNotice(res.success ? 'success' : 'error', res.message);
                            }}
                            className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold text-[10px] cursor-pointer"
                          >
                            Lunasi Pinjaman 100%
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminClearTransactionHistory(acc.id);
                              showNotice(res.success ? 'success' : 'error', res.message);
                            }}
                            className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold text-[10px] cursor-pointer"
                          >
                            Bersihkan Mutasi
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* SEKSI 2: SAMBUNGKAN AKUN KE EMAIL GOOGLE TERDAFTAR & KIRIM POPUP PRIBADI */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                      {/* Kiri: Sambungkan ke Email Google Terdaftar / Popup Sign in with Google */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-cyan-500/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-cyan-300">
                            🔗 Sambungkan Akun Ini ke Email Google (Bisa Pilih Saat Sign in with Google)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleLinkAccountWithGooglePopupFromAdmin(acc.id)}
                            disabled={linkingGoogleAccId === acc.id}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-900 font-black text-[10px] flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            <span>
                              {linkingGoogleAccId === acc.id
                                ? 'Membuka Popup...'
                                : 'Popup Sign in with Google'}
                            </span>
                          </button>
                        </div>

                        {registeredGoogleEmails.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-slate-400">Pilih Email Terdaftar:</span>
                            {registeredGoogleEmails.map((em) => (
                              <button
                                key={em}
                                type="button"
                                onClick={() => {
                                  const res = adminConnectAccountToEmail(acc.id, em);
                                  showNotice(res.success ? 'success' : 'error', res.message);
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold cursor-pointer border ${
                                  (acc.email || '').toLowerCase() === em
                                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                    : 'bg-slate-900 hover:bg-slate-800 text-cyan-200 border-slate-700'
                                }`}
                              >
                                {em}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-1.5">
                          <input
                            type="email"
                            value={customEmailInputMap[acc.id] ?? acc.email ?? ''}
                            onChange={(e) =>
                              setCustomEmailInputMap((prev) => ({
                                ...prev,
                                [acc.id]: e.target.value,
                              }))
                            }
                            placeholder="Ketik email Google tujuan (contoh: nama@gmail.com)..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const targetEm = (
                                customEmailInputMap[acc.id] ??
                                acc.email ??
                                ''
                              ).trim();
                              const res = adminConnectAccountToEmail(acc.id, targetEm);
                              showNotice(res.success ? 'success' : 'error', res.message);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[10px] cursor-pointer shrink-0"
                          >
                            Sambungkan Email
                          </button>
                        </div>
                      </div>

                      {/* Kanan: Kirim Popup Langsung ke Layar Akun Ini & Atur Role Dev */}
                      <div className="p-3 rounded-xl bg-slate-950/90 border border-amber-500/40 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-black text-amber-300">
                            📣 Kirim Popup ke Akun Ini & Role Otoritas
                          </span>
                          <select
                            value={acc.devRoleId || ''}
                            onChange={(e) => {
                              const val = e.target.value || null;
                              const res = adminAssignAccountDevRole(acc.id, val);
                              showNotice(res.success ? 'success' : 'error', res.message);
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-amber-500/40 text-amber-200 font-bold text-[10px]"
                          >
                            <option value="">— Tanpa Role Dev —</option>
                            {devRoles.map((r) => (
                              <option key={r.id} value={r.id}>
                                #{r.slotNumber} {r.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          <input
                            type="text"
                            value={customInjectInputMap[acc.id]?.popupTitle || ''}
                            onChange={(e) => updateInjectInput(acc.id, 'popupTitle', e.target.value)}
                            placeholder="Judul Popup (misal: Hadiah VIP)"
                            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                          />
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={customInjectInputMap[acc.id]?.popupMsg || ''}
                              onChange={(e) => updateInjectInput(acc.id, 'popupMsg', e.target.value)}
                              placeholder="Isi pesan popup ke layar..."
                              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const title =
                                  (customInjectInputMap[acc.id]?.popupTitle || '').trim() ||
                                  `Pesan Resmi Otoritas Admin untuk ${acc.fullName}`;
                                const msg =
                                  (customInjectInputMap[acc.id]?.popupMsg || '').trim() ||
                                  `Halo ${acc.fullName}, akun Anda telah diperbarui oleh Panel Admin Bank Nusantara.`;
                                const res = adminSendWebsiteBroadcast({
                                  title,
                                  message: msg,
                                  targetAccountId: acc.id,
                                });
                                showNotice(res.success ? 'success' : 'error', res.message);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] cursor-pointer shrink-0"
                            >
                              Kirim Popup
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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

                      <div className="sm:col-span-2 lg:col-span-3">
                        {editDraft.isGuestAccount ? (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400">
                            Akun Guest tidak menggunakan alamat domisili.
                          </div>
                        ) : (
                          <IndonesiaAddressPicker
                            value={editDraft.structuredAddress || createEmptyStructuredAddress()}
                            formattedAddress={editDraft.address}
                            onChange={(formatted, structured) =>
                              setEditDraft({
                                ...editDraft,
                                address: formatted,
                                structuredAddress: structured,
                              })
                            }
                            enableGoogleMapsTab
                            compact
                            label="Edit Alamat Wilayah Indonesia Lengkap (38 Provinsi hingga RT/RW)"
                          />
                        )}
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
