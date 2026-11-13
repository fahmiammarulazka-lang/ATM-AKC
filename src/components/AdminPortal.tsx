/**
 * Bank Nusantara Admin Control & Approval Portal
 * Includes:
 * 1. Tinjauan Keuangan Wajib Admin (Approve / Reject with 100% Auto-Refund)
 * 2. Kontrol 60+ Fitur & Otorisasi PIN Admin (Bebas atur fitur mana yang pakai PIN Admin 159357 atau tidak, & wajib persetujuan admin atau tidak)
 * 3. Buat & Kelola Kode Redeem (Atur kode, hadiah saldo, kuota berapa banyak orang yang bisa redeem, dan durasi berapa lama kode berfungsi)
 * 4. Tinjauan Lupa PIN Kartu ATM (Tinjau permohonan lupa PIN dari ATM dan beritahu PIN-nya ke nasabah)
 * 5. Persetujuan Kartu Perdana, Upgrade Kartu, Pinjaman Online, Master Nasabah, & Brankas ATM
 */
import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  XCircle,
  Users,
  CreditCard,
  BadgeDollarSign,
  Search,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Building2,
  CheckCircle2,
  History,
  Sliders,
  KeyRound,
  Gift,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Clock,
  Copy,
  Ban,
  ShieldAlert,
  BadgeCheck,
  Megaphone,
  Package,
  Wrench,
  BookOpen,
  MessageSquare,
  Send,
  Bug,
  Image as ImageIcon,
  Zap,
  Crown,
  HelpCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  formatRupiah,
  formatIndoDate,
  CARD_TIER_CONFIGS,
  isUnlimitedNumber,
  formatBanRemainingTime,
  getFeatureUltraDetailedExplanation,
} from '../utils/bankUtils';
import { CardTier, FeatureSecurityConfig } from '../types/bank';
import { JOB_VACANCIES_CATALOG } from '../data/featuresCatalog';
import {
  SPIN_WHEEL_PRIZES,
  COIN_PURCHASE_PACKAGES_100,
  calculateCoinPackagePrice,
  calculateSpinCost,
  formatRupiahWithDecimals,
} from '../data/spinWheelCatalog';
import {
  SULTAN_BUSINESS_CATALOG,
  SULTAN_TRADING_ASSETS,
  MINTOL_ADMIN_FEATURES_CATALOG,
} from '../data/empireAndMintolCatalog';
import { VerifiedBadge } from './VerifiedBadge';
import { AdminQuickAccountControlPanel } from './AdminQuickAccountControlPanel';
import { AdminGoldTransferPanel } from './AdminGoldTransferPanel';

interface AdminPortalProps {
  onNavigateToCustomerDashboard?: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onNavigateToCustomerDashboard }) => {
  const {
    accounts,
    loans,
    transactions,
    pendingFinancialTransactions,
    adminApproveFinancialTransaction,
    adminRejectFinancialTransaction,
    adminApproveAllFinancialTransactions,
    adminApproveCard,
    adminRejectCard,
    adminApproveAllCards,
    adminApproveLoan,
    adminRejectLoan,
    adminApproveAllLoans,
    cardUpgrades,
    adminApproveUpgrade,
    adminRejectUpgrade,
    adminApproveAllUpgrades,
    pinResetRequests,
    adminApprovePinReset,
    adminRejectPinReset,
    featureConfigs,
    deletedFeaturesList,
    deleteFeatureById,
    restoreDeletedFeature,
    restoreAllDeletedFeatures,
    toggleFeatureAdminPin,
    toggleFeatureAdminApproval,
    setAllFeaturesAdminPin,
    setAllFeaturesAdminApproval,
    redeemCodes,
    createRedeemCode,
    deleteRedeemCode,
    toggleRedeemCodeActive,
    adminBanCard,
    adminUnbanCard,
    adminUnbanAllCards,
    adminToggleVerifyAccount,
    adminVerifyAllAccounts,
    adminAdjustAccountBalance,
    adminDirectChangeAccountTier,
    adminDirectChangeAccountPin,
    adminSendWebsiteBroadcast,
    resiList,
    adminUpdateResiStatus,
    purchasedCodes,
    resetAllData,
    globalChats,
    sendGlobalChatMessage,
    deleteGlobalChatMessage,
    clearGlobalChatMessages,
    connectedDevicesCount,
    bugReports,
    adminUpdateBugReport,
    adminDeleteBugReport,
    adminClearBugReports,
    adminMassBalanceRain,
    adminSetCustomAccountNumber,
    adminSetCustomCardDetails,
    adminAdjustRewardPoints,
    adminInjectPulsaAndPln,
    adminForceTransferBetweenAccounts,
    adminCreateInstantActiveAccount,
    adminCloneAccount,
    adminMassFreezeOrUnfreezeAll,
    adminResetDailyWithdrawalQuota,
    adminSetSpendingLimitAndIntl,
    adminForgiveOrPayoffLoans,
    adminBoostDepositosAndPockets,
    adminGenerateInstantVoucher,
    adminGenerateBulkRedeemCodes,
    adminClearTransactionHistory,
    adminCreateCustomTransaction,
    adminUpdateAccountIdentity,
    adminMultiplyAccountBalance,
    adminSetAllAccountsTier,
    adminDeleteAccount,
    appUpdates,
    adminAddAppUpdate,
    adminEditAppUpdate,
    adminSetCurrentAppUpdate,
    adminDeleteAppUpdate,
    adminResetAppUpdates,
    adminAddCustomFeature,
    atmVaultBalance,
    adminSetAccountJobLevel,
    adminAdjustLevelVouchers,
    adminInstantCompleteJobSalary,
    adminSetClickPower,
    adminSetSalaryMultiplier,
    adminMassLevelVoucherRain,
    adminMassUpgradeAllJobLevels,
    adminRefillAtmVaultCash,
    adminApplyMassTaxOrAdminFee,
    adminDistributeBankDividend,
    adminSetAccountCashbackPercent,
    adminToggleVipShield,
    adminRollbackLastTransaction,
    adminMergeTwoAccounts,
    adminConvertPointsToCash,
    adminConvertPulsaPlnToCash,
    adminCreateSpecialDeposito,
    adminForceLiquidateAllDepositos,
    adminCreateFundedPocket,
    adminFreeClearAllCodResi,
    adminCreateCustomResiForAccount,
    adminExecuteAllScheduledPaymentsNow,
    adminMasterApproveEverything,
    adminResetCareerStats,
    adminDuplicateCustomerVouchers,
    adminExtendAllRedeemCodes,
    adminBoostAllRedeemQuotas,
    adminSendThrSultanPackage,
    adminRunForensicAutoHeal,
    adminExportMasterBankJson,
    spinWheelConfig,
    adminUpdateSpinWheelConfig,
    adminResetSpinWheelConfig,
    adminAdjustAccountSpinCoins,
    adminMassSpinCoinRain,
    sultanEmpireConfig,
    adminUpdateSultanEmpireConfig,
    adminResetSultanEmpireConfig,
    adminGiftAllSultanBusinessesToAccount,
    adminHelpRequests,
    adminGrantAndExecuteMintolRequest,
    adminRejectMintolRequest,
    adminDeleteMintolRequest,
    adminClearMintolRequests,
  } = useBank();

  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'super_tools'
    | 'spin_wheel_admin'
    | 'gold_transfer_admin'
    | 'empire_admin'
    | 'mintol_admin'
    | 'app_updates'
    | 'global_chat'
    | 'bug_reports'
    | 'finance'
    | 'verification'
    | 'features'
    | 'redeem'
    | 'ban_cards'
    | 'pinresets'
    | 'cards'
    | 'upgrades'
    | 'loans'
    | 'accounts'
    | 'audit'
  >('super_tools');

  const [spinAdminCoinInput, setSpinAdminCoinInput] = useState<number>(1000);
  const [spinAdminFeedback, setSpinAdminFeedback] = useState<string>('');
  const [empireAdminFeedback, setEmpireAdminFeedback] = useState<string>('');
  const [empireGiftLevels, setEmpireGiftLevels] = useState<number>(5);
  const [mintolReplyMap, setMintolReplyMap] = useState<Record<string, string>>({});
  const [mintolFeedback, setMintolFeedback] = useState<string>('');

  // States for Super Tools #27 to #56 (56+ Super Tools Ga Kaleng-Kaleng)
  const [stJobLevelInput, setStJobLevelInput] = useState<number>(25);
  const [stJobLevelMode, setStJobLevelMode] = useState<'set' | 'add' | 'max'>('set');
  const [stVoucherInput, setStVoucherInput] = useState<number>(10);
  const [stVoucherMode, setStVoucherMode] = useState<'add' | 'set'>('add');
  const [stSelectedJobId, setStSelectedJobId] = useState<string>('job_2000k');
  const [stClickPowerInput, setStClickPowerInput] = useState<number>(25);
  const [stSalaryMultInput, setStSalaryMultInput] = useState<number>(5);
  const [stMassVoucherRain, setStMassVoucherRain] = useState<number>(5);
  const [stMassLevelAdd, setStMassLevelAdd] = useState<number>(5);
  const [stAtmRefillAmt, setStAtmRefillAmt] = useState<number>(500_000_000);
  const [stTaxValue, setStTaxValue] = useState<number>(5);
  const [stTaxMode, setStTaxMode] = useState<'percent' | 'fixed'>('percent');
  const [stTaxReason, setStTaxReason] = useState<string>('Pajak Administrasi Bank Nusantara');
  const [stDividendPct, setStDividendPct] = useState<number>(15);
  const [stCashbackPct, setStCashbackPct] = useState<number>(10);
  const [stMergeSourceId, setStMergeSourceId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [stMergeTargetId, setStMergeTargetId] = useState<string>(accounts[0]?.id || '');
  const [stPointRate, setStPointRate] = useState<number>(1000);
  const [stDepoPrincipal, setStDepoPrincipal] = useState<number>(25_000_000);
  const [stDepoTenor, setStDepoTenor] = useState<number>(6);
  const [stDepoBonusRate, setStDepoBonusRate] = useState<number>(18);
  const [stLiquidateBonusPct, setStLiquidateBonusPct] = useState<number>(20);
  const [stPocketTitle, setStPocketTitle] = useState<string>('Dana Impian Hadiah Admin');
  const [stPocketAmt, setStPocketAmt] = useState<number>(15_000_000);
  const [stCustomResiCourier, setStCustomResiCourier] = useState<string>('Nusantara Express VIP');
  const [stCustomResiItem, setStCustomResiItem] = useState<string>('Kartu Emas Batangan & Merchandise');
  const [stCustomResiCod, setStCustomResiCod] = useState<number>(0);
  const [stExtendRedeemMins, setStExtendRedeemMins] = useState<number>(1440);
  const [stBoostRedeemQuota, setStBoostRedeemQuota] = useState<number>(50);
  const [stThrCash, setStThrCash] = useState<number>(5_000_000);
  const [stThrVouchers, setStThrVouchers] = useState<number>(5);
  const [stThrPoints, setStThrPoints] = useState<number>(25_000);

  // State for Admin Riwayat Update Website (Update Sekarang & Update Sebelumnya)
  const getTodayCompleteIndoDate = () => {
    const now = new Date();
    const datePart = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const timePart = now
      .toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      .replace('.', ':');
    return `${datePart} • Pukul ${timePart} WIB`;
  };

  const [newUpdateVersion, setNewUpdateVersion] = useState<string>(`v${appUpdates.length + 1}.0`);
  const [newUpdateTitle, setNewUpdateTitle] = useState<string>(
    'Pembaruan Sistem & Penambahan Fitur Ekosistem Bank Nusantara'
  );
  const [newUpdateDateText, setNewUpdateDateText] = useState<string>(getTodayCompleteIndoDate());
  const [newUpdateDesc, setNewUpdateDesc] = useState<string>(
    'Pembaruan resmi sistem Bank Nusantara mencakup penambahan panduan lengkap, fitur perbankan digital baru, serta peningkatan stabilitas dan sinkronisasi real-time di seluruh perangkat nasabah.'
  );
  const [newUpdateChangesText, setNewUpdateChangesText] = useState<string>(
    'Penambahan fitur layanan digital perbankan terbaru\nSinkronisasi real-time lebih cepat di semua perangkat\nPembaruan dokumentasi buku panduan dan keamanan transaksi'
  );
  const [newUpdateAuthor, setNewUpdateAuthor] = useState<string>('Admin Utama Bank Nusantara');
  const [newUpdateSetCurrent, setNewUpdateSetCurrent] = useState<boolean>(true);
  const [updateFeedback, setUpdateFeedback] = useState<string>('');
  const [editingUpdateId, setEditingUpdateId] = useState<string | null>(null);
  const [editUpdateVersion, setEditUpdateVersion] = useState<string>('');
  const [editUpdateTitle, setEditUpdateTitle] = useState<string>('');
  const [editUpdateDateText, setEditUpdateDateText] = useState<string>('');
  const [editUpdateDesc, setEditUpdateDesc] = useState<string>('');
  const [editUpdateChangesText, setEditUpdateChangesText] = useState<string>('');

  // State for Admin Custom Feature Creator
  const [showAddFeatureForm, setShowAddFeatureForm] = useState<boolean>(false);
  const [customFeatTitle, setCustomFeatTitle] = useState<string>('');
  const [customFeatCat, setCustomFeatCat] = useState<string>('Layanan Baru & Eksklusif');
  const [customFeatDesc, setCustomFeatDesc] = useState<string>('');
  const [customFeatAmount, setCustomFeatAmount] = useState<number>(100_000);
  const [customFeatPin, setCustomFeatPin] = useState<boolean>(false);
  const [customFeatApproval, setCustomFeatApproval] = useState<boolean>(false);
  const [customFeatFeedback, setCustomFeatFeedback] = useState<string>('');

  // State for Admin Global Chat ("Pesan dari Admin" ke Semua HP - Hanya Admin)
  const [globalChatText, setGlobalChatText] = useState<string>('');
  const [globalChatAdminName, setGlobalChatAdminName] = useState<string>('Admin Bank Nusantara');
  const [globalChatFeedback, setGlobalChatFeedback] = useState<string>('');

  // State for Bug Reports in Admin Panel
  const [bugReplyMap, setBugReplyMap] = useState<Record<string, string>>({});
  const [bugFeedback, setBugFeedback] = useState<string>('');
  const [zoomBugPhotoUrl, setZoomBugPhotoUrl] = useState<string | null>(null);

  // Additional States for 25 Super Tools
  const [rainAmount, setRainAmount] = useState<number>(500_000);
  const [rainNote, setRainNote] = useState<string>('Bonus Hujan Saldo Spesial dari Admin Bank Nusantara');
  const [customAccNumInput, setCustomAccNumInput] = useState<string>('8888888888');
  const [customCardNumInput, setCustomCardNumInput] = useState<string>('5392 8888 8888 8888');
  const [customCvvInput, setCustomCvvInput] = useState<string>('888');
  const [customExpInput, setCustomExpInput] = useState<string>('12/35');
  const [rewardPtsInput, setRewardPtsInput] = useState<number>(10_000);
  const [rewardPtsMode, setRewardPtsMode] = useState<'add' | 'set' | 'unlimited'>('add');
  const [injectPulsaAmt, setInjectPulsaAmt] = useState<number>(250_000);
  const [injectKwhAmt, setInjectKwhAmt] = useState<number>(150);
  const [forceFromAccId, setForceFromAccId] = useState<string>(accounts[1]?.id || accounts[0]?.id || '');
  const [forceToAccId, setForceToAccId] = useState<string>(accounts[0]?.id || '');
  const [forceTransferAmt, setForceTransferAmt] = useState<number>(500_000);
  const [instantAccName, setInstantAccName] = useState<string>('Sultan Nusantara VIP');
  const [instantAccPin, setInstantAccPin] = useState<string>('123456');
  const [instantAccBal, setInstantAccBal] = useState<number>(50_000_000);
  const [instantAccTier, setInstantAccTier] = useState<CardTier>('platinum');
  const [customSpendLimit, setCustomSpendLimit] = useState<number>(25_000_000);
  const [customAllowIntl, setCustomAllowIntl] = useState<boolean>(true);
  const [boostPercentInput, setBoostPercentInput] = useState<number>(25);
  const [instantVoucherType, setInstantVoucherType] = useState<'pulsa' | 'token_listrik' | 'voucher_lain'>('token_listrik');
  const [instantVoucherNominal, setInstantVoucherNominal] = useState<number>(200_000);
  const [instantVoucherTarget, setInstantVoucherTarget] = useState<string>('542109847163');
  const [bulkRedeemCount, setBulkRedeemCount] = useState<number>(5);
  const [bulkRedeemReward, setBulkRedeemReward] = useState<number>(250_000);
  const [customTxTitle, setCustomTxTitle] = useState<string>('Hadiah Apresiasi Eksklusif Admin');
  const [customTxAmt, setCustomTxAmt] = useState<number>(1_500_000);
  const [customTxType, setCustomTxType] = useState<'transfer_in' | 'transfer_out' | 'setor' | 'tarik'>('transfer_in');
  const [editIdentityName, setEditIdentityName] = useState<string>('');
  const [editIdentityPhone, setEditIdentityPhone] = useState<string>('');
  const [editIdentityEmail, setEditIdentityEmail] = useState<string>('');
  const [editIdentityAddress, setEditIdentityAddress] = useState<string>('');
  const [multiplyFactor, setMultiplyFactor] = useState<number>(2);
  const [massTierTarget, setMassTierTarget] = useState<CardTier>('platinum');

  // Live 1-second tick for real-time ban countdowns in Admin Panel
  const [, setAdminTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setAdminTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Card Ban management state (Default 1 Menit for instant testing!)
  const [selectedBanAccountId, setSelectedBanAccountId] = useState<string>(accounts[0]?.id || '');
  const [banDurationType, setBanDurationType] = useState<'custom' | 'permanent'>('custom');
  const [banDurationUnit, setBanDurationUnit] = useState<'menit' | 'jam' | 'hari'>('menit');
  const [banDurationValue, setBanDurationValue] = useState<number>(1);
  const [banReasonInput, setBanReasonInput] = useState<string>('');
  const [banFeedback, setBanFeedback] = useState<string>('');

  // Centang Biru Verification state
  const [customVerifyLabel, setCustomVerifyLabel] = useState<string>(
    'Nasabah Resmi Terverifikasi (Centang Biru)'
  );
  const [verifyFeedback, setVerifyFeedback] = useState<string>('');

  // Super Admin Tools state
  const [superToolAccountId, setSuperToolAccountId] = useState<string>(accounts[0]?.id || '');
  const [balanceActionMode, setBalanceActionMode] = useState<'add' | 'subtract' | 'set' | 'unlimited'>('add');
  const [balanceAdjustAmount, setBalanceAdjustAmount] = useState<number>(1_000_000);
  const [balanceAdjustNote, setBalanceAdjustNote] = useState<string>('Penambahan Saldo Resmi oleh Admin');
  const [directTierTarget, setDirectTierTarget] = useState<CardTier>('platinum');
  const [directNewPinInput, setDirectNewPinInput] = useState<string>('123456');
  const [broadcastTargetId, setBroadcastTargetId] = useState<string>('');
  const [broadcastTitle, setBroadcastTitle] = useState<string>(
    '🔔 Pengumuman Resmi Sistem Website Bank Nusantara'
  );
  const [broadcastMessage, setBroadcastMessage] = useState<string>(
    'Halo Nasabah Setia! Kartu dan rekening Anda telah disinkronisasi dengan perlindungan keamanan terbaru Bank Nusantara.'
  );
  const [superToolFeedback, setSuperToolFeedback] = useState<string>('');

  // 100x Detailed Feature Explanation Modal in Admin Panel
  const [adminDetailFeature, setAdminDetailFeature] = useState<FeatureSecurityConfig | null>(null);

  // Feature filter state
  const [featureSearch, setFeatureSearch] = useState<string>('');
  const [featureCategoryFilter, setFeatureCategoryFilter] = useState<string>('Semua');

  // Redeem Code Creator form state
  const [newRedeemCodeStr, setNewRedeemCodeStr] = useState<string>('BONUS250K');
  const [newRedeemTitle, setNewRedeemTitle] = useState<string>('Promo Spesial Nasabah Nusantara');
  const [newRedeemAmount, setNewRedeemAmount] = useState<number>(250_000);
  const [newRedeemMaxClaims, setNewRedeemMaxClaims] = useState<number>(5);
  const [newRedeemDurationMins, setNewRedeemDurationMins] = useState<number>(60);
  const [newRedeemRequirePin, setNewRedeemRequirePin] = useState<boolean>(false);
  const [redeemFeedback, setRedeemFeedback] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Rejection Modals
  const [rejectCardModalId, setRejectCardModalId] = useState<string | null>(null);
  const [rejectionCardReason, setRejectionCardReason] = useState<string>(
    'Foto KTP buram dan tidak terbaca jelas. Silakan ajukan ulang dengan foto identitas yang terang.'
  );

  const [rejectLoanModalId, setRejectLoanModalId] = useState<string | null>(null);
  const [rejectionLoanReason, setRejectionLoanReason] = useState<string>(
    'Rasio angsuran terhadap penghasilan bulanan melebihi batas ketentuan kredit (maks 40%).'
  );

  const [rejectUpgradeModalId, setRejectUpgradeModalId] = useState<string | null>(null);
  const [rejectionUpgradeReason, setRejectionUpgradeReason] = useState<string>(
    'Penghasilan bulanan belum mencukupi batas ketentuan minimum untuk jenis kartu yang diajukan.'
  );

  const [rejectFinanceModalId, setRejectFinanceModalId] = useState<string | null>(null);
  const [rejectionFinanceReason, setRejectionFinanceReason] = useState<string>(
    'Transaksi dibatalkan atas permintaan verifikasi keamanan (Saldo dikembalikan 100% ke rekening nasabah).'
  );

  const pendingCards = accounts.filter((a) => a.cardStatus === 'pending');
  const bannedCards = accounts.filter((a) => a.cardStatus === 'banned');
  const pendingBanAppeals = bannedCards.filter((a) => a.banInfo?.appealStatus === 'pending');
  const pendingLoans = loans.filter((l) => l.status === 'pending');
  const pendingUpgrades = (cardUpgrades || []).filter((u) => u.status === 'pending');
  const pendingPinResets = (pinResetRequests || []).filter((r) => r.status === 'pending');

  const handleBanCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBanAccountId) return;
    let totalMinutes = banDurationValue;
    let label = `${banDurationValue} Menit`;
    if (banDurationUnit === 'jam') {
      totalMinutes = banDurationValue * 60;
      label = `${banDurationValue} Jam`;
    } else if (banDurationUnit === 'hari') {
      totalMinutes = banDurationValue * 60 * 24;
      label = `${banDurationValue} Hari`;
    }

    const res = adminBanCard({
      accountId: selectedBanAccountId,
      reason: banReasonInput, // Opsional! Bisa dikosongkan
      durationType: banDurationType,
      durationMinutes: banDurationType === 'custom' ? totalMinutes : undefined,
      durationLabel: banDurationType === 'custom' ? label : 'Permanen',
    });

    setBanFeedback(res.message);
    if (res.success) {
      setBanReasonInput('');
    }
    setTimeout(() => setBanFeedback(''), 6000);
  };

  const handleUnbanCardClick = (accountId: string) => {
    const res = adminUnbanCard(accountId);
    setBanFeedback(res.message);
    setTimeout(() => setBanFeedback(''), 5000);
  };

  const handleApproveCardClick = (id: string) => {
    adminApproveCard(id);
  };

  const handleRejectCardClick = () => {
    if (!rejectCardModalId) return;
    adminRejectCard(rejectCardModalId, rejectionCardReason);
    setRejectCardModalId(null);
  };

  const handleApproveUpgradeClick = (id: string) => {
    adminApproveUpgrade(id);
  };

  const handleRejectUpgradeClick = () => {
    if (!rejectUpgradeModalId) return;
    adminRejectUpgrade(rejectUpgradeModalId, rejectionUpgradeReason);
    setRejectUpgradeModalId(null);
  };

  const handleApproveLoanClick = (id: string) => {
    adminApproveLoan(id);
  };

  const handleRejectLoanClick = () => {
    if (!rejectLoanModalId) return;
    adminRejectLoan(rejectLoanModalId, rejectionLoanReason);
    setRejectLoanModalId(null);
  };

  const handleCreateRedeemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createRedeemCode({
      code: newRedeemCodeStr,
      title: newRedeemTitle,
      rewardAmount: newRedeemAmount,
      maxClaims: newRedeemMaxClaims,
      durationMinutes: newRedeemDurationMins,
      requireAdminPin: newRedeemRequirePin,
    });
    setRedeemFeedback(res.message);
    if (res.success) {
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      setNewRedeemCodeStr(`NUSANTARA${randomSuffix}`);
    }
    setTimeout(() => setRedeemFeedback(''), 5000);
  };

  const generateRandomRedeemCode = () => {
    const prefixes = ['NUSANTARA', 'BERKAH', 'REZEKI', 'BONUS', 'MANDIRI', 'EMAS'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setNewRedeemCodeStr(`${p}${num}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Categories for 60+ features
  const categories = ['Semua', ...Array.from(new Set(featureConfigs.map((f) => f.category)))];
  const filteredFeatures = featureConfigs.filter((f) => {
    const matchesCat = featureCategoryFilter === 'Semua' || f.category === featureCategoryFilter;
    const matchesSearch =
      f.title.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(featureSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(featureSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Total metrics (excluding unlimited Admin card from regular sum so numbers stay readable, while noting ∞)
  const totalCustomerFunds = accounts
    .filter((a) => a.cardStatus === 'active' && !isUnlimitedNumber(a.balance))
    .reduce((acc, curr) => acc + curr.balance, 0);

  const totalDisbursedLoans = loans
    .filter((l) => l.status === 'approved')
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 rounded-3xl p-6 border border-red-800/40 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs uppercase font-mono tracking-widest text-rose-400 font-bold">
              PANEL OTORITAS PUSAT • ADMIN BANK NUSANTARA (PIN: 159357)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            Pusat Kendali Semua Fitur, PIN Admin, Kode Redeem & Persetujuan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Atur bebas apakah setiap fitur layanan membutuhkan PIN Admin atau tidak, kelola antrean persetujuan pembelian nasabah, buat Kode Redeem dengan kuota &amp; batas waktu, serta tinjau permohonan Lupa PIN ATM.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Reset seluruh data ke kondisi awal demo?')) resetAllData();
          }}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Data Demo</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
        <div
          onClick={() => setActiveAdminTab('super_tools')}
          className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-950/80 via-slate-900 to-indigo-950/80 border-2 border-fuchsia-400/70 hover:border-fuchsia-300 shadow-lg cursor-pointer transition-all"
        >
          <span className="text-fuchsia-300 font-bold block text-[11px]">🛠️ Super Tools Admin</span>
          <div className="font-mono text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <span>25 Tools</span>
            <span className="w-2.5 h-2.5 rounded-full bg-fuchsia-400 animate-ping" />
          </div>
          <span className="text-[10px] text-fuchsia-300 font-mono block mt-0.5">
            Eksekusi Instan 1-Klik
          </span>
        </div>

        <div
          onClick={() => setActiveAdminTab('bug_reports')}
          className="p-4 rounded-2xl bg-gradient-to-br from-rose-950/80 via-slate-900 to-amber-950/80 border-2 border-amber-400/70 hover:border-amber-300 shadow-lg cursor-pointer transition-all"
        >
          <span className="text-amber-300 font-bold block text-[11px]">🐛 Laporan Bug Masuk</span>
          <div className="font-mono text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <span>{bugReports.length} Bug</span>
            {bugReports.some((b) => b.status === 'baru') && (
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            )}
          </div>
          <span className="text-[10px] text-amber-200 font-mono block mt-0.5">
            Penjelasan & Foto Bebas
          </span>
        </div>

        <div
          onClick={() => setActiveAdminTab('global_chat')}
          className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 shadow-lg cursor-pointer transition-all"
        >
          <span className="text-amber-300 font-bold block text-[11px]">💬 Chat Global (Hanya Admin)</span>
          <div className="font-mono text-xl sm:text-2xl font-black text-white mt-1 flex items-center gap-2">
            <span>{globalChats.length} Pesan</span>
          </div>
          <span className="text-[10px] text-emerald-300 font-mono block mt-0.5">
            Khusus Admin Panel
          </span>
        </div>

        <div
          onClick={() => setActiveAdminTab('finance')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 shadow-lg cursor-pointer transition-all"
        >
          <span className="text-slate-400 block text-[11px]">Tinjauan Pembelian & Keuangan</span>
          <div className="font-mono text-2xl font-black text-amber-400 mt-1 flex items-center gap-2">
            <span>{pendingFinancialTransactions.length} Antrean</span>
            {pendingFinancialTransactions.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />}
          </div>
        </div>

        <div
          onClick={() => setActiveAdminTab('features')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 shadow-lg cursor-pointer transition-all"
        >
          <span className="text-slate-400 block text-[11px]">Konfigurasi Otorisasi Layanan</span>
          <div className="font-mono text-2xl font-black text-cyan-400 mt-1 flex items-center gap-2">
            <span>Kontrol PIN</span>
          </div>
        </div>

        <div
          onClick={() => setActiveAdminTab('pinresets')}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 shadow-lg cursor-pointer transition-all"
        >
          <span className="text-slate-400 block text-[11px]">Tinjauan Lupa PIN ATM</span>
          <div className="font-mono text-2xl font-black text-rose-400 mt-1 flex items-center gap-2">
            <span>{pendingPinResets.length} Antrean</span>
            {pendingPinResets.length > 0 && <span className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />}
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveAdminTab('accounts')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'accounts'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-950/60 border-2 border-amber-400/70'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>⚡ Masuk Cepat &amp; Edit Semua Akun Tanpa Masuk ({accounts.length} Akun)</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('app_updates')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'app_updates'
              ? 'bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-black shadow-lg shadow-emerald-500/30'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60 border border-emerald-400/50'
          }`}
        >
          <History className="w-4 h-4" />
          <span>🚀 Kelola Riwayat Update ({appUpdates.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('super_tools')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'super_tools'
              ? 'bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white font-black shadow-lg shadow-fuchsia-500/30'
              : 'text-fuchsia-300 hover:text-white hover:bg-fuchsia-950/60 border border-fuchsia-500/40'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>🛠️ Super Tools (56 Fitur Super Admin Ga Kaleng-Kaleng)</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('spin_wheel_admin')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'spin_wheel_admin'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-950/60 border border-amber-400/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>🎡 Kontrol Spin Wheel, Diskon Koin &amp; Probabilitas</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('gold_transfer_admin')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'gold_transfer_admin'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-950/60 border border-amber-400/60'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span>🪙 Kontrol Emas 24K &amp; Transfer Bebas 5%</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('empire_admin')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'empire_admin'
              ? 'bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 text-slate-950 font-black shadow-lg shadow-cyan-500/30'
              : 'text-cyan-300 hover:text-white hover:bg-cyan-950/60 border border-cyan-400/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>💎 Kontrol Mining Kripto, Lelang Supercar &amp; Cyber Vault</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('mintol_admin')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'mintol_admin'
              ? 'bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-200 hover:text-white hover:bg-amber-950/60 border border-amber-400/60'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>🙏 Permintaan Mintol Nasabah ({adminHelpRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('bug_reports')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'bug_reports'
              ? 'bg-gradient-to-r from-amber-400 to-rose-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-950/60 border border-amber-400/50'
          }`}
        >
          <Bug className="w-4 h-4" />
          <span>🐛 Laporan Bug ({bugReports.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('global_chat')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'global_chat'
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/30'
              : 'text-amber-300 hover:text-white hover:bg-amber-950/60 border border-amber-400/50'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>💬 Chat Global Khusus Admin ({globalChats.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('finance')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'finance'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BadgeDollarSign className="w-4 h-4" />
          <span>Tinjauan Keuangan ({pendingFinancialTransactions.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('verification')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'verification'
              ? 'bg-sky-500 text-slate-950 font-bold shadow-lg shadow-sky-500/30'
              : 'text-sky-300 hover:text-white hover:bg-sky-950/60 border border-sky-500/30'
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          <span>Verifikasi Centang Biru ({accounts.filter((a) => a.isVerified).length}/{accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('ban_cards')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'ban_cards'
              ? 'bg-rose-600 text-white font-bold shadow-lg shadow-rose-600/30'
              : 'text-rose-300 hover:text-white hover:bg-rose-950/60 border border-rose-500/30'
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>Banned Kartu ({bannedCards.length})</span>
          {pendingBanAppeals.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              {pendingBanAppeals.length} Tinjauan
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('features')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'features'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Kontrol Fitur, PIN &amp; Fitur Dihapus</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('redeem')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'redeem'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Buat Kode Redeem ({redeemCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('pinresets')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'pinresets'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Tinjauan Lupa PIN ({pendingPinResets.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('cards')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'cards'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Kartu Baru ({pendingCards.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('upgrades')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'upgrades'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Upgrade Kartu ({pendingUpgrades.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('loans')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'loans'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <BadgeDollarSign className="w-4 h-4" />
          <span>Pinjaman ({pendingLoans.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('accounts')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'accounts'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Nasabah ({accounts.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-3.5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
            activeAdminTab === 'audit'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brankas & SOP 100x</span>
        </button>
      </div>

      {/* ================= ADMIN TAB: KONTROL EMAS 24K & TRANSFER BEBAS 5% ================= */}
      {activeAdminTab === 'gold_transfer_admin' && <AdminGoldTransferPanel />}

      {/* ================= ADMIN TAB: KONTROL SPIN THE WHEEL, DISKON KOIN (1-1 JUTA) & PROBABILITAS ================= */}
      {activeAdminTab === 'spin_wheel_admin' && (
        <div className="space-y-6 text-xs">
          <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-fuchsia-950/90 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-block">
                  🎡 PUSAT KONTROL ADMIN SPIN THE WHEEL &amp; 100 PAKET KOIN
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                  Atur Diskon Spin (1x, 3x, 5x, 7x, 10x), Murahin Harga Koin &amp; Perbesar Kemungkinan Menang
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Sesuai permintaan Anda: Di sini Admin bisa memberikan diskon biaya Spin (1x, 3x, 5x, 7x, 10x), memurahkan harga dasar 1 Koin (normal Rp 10.000 + recehan desimal), memberi diskon pada 100 pilihan pembelian koin (1 s/d 1.000.000 Koin), serta memperbesar kemungkinan pendapatan saat nyepin!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminResetSpinWheelConfig();
                  setSpinAdminFeedback(res.message);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs cursor-pointer shrink-0 self-start"
              >
                Reset ke Standar Awal
              </button>
            </div>

            {spinAdminFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
                <span>✅ {spinAdminFeedback}</span>
                <button
                  type="button"
                  onClick={() => setSpinAdminFeedback('')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* 1. KONTROL HARGA 1 KOIN & DISKON 100 PILIHAN PEMBELIAN KOIN */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/40 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                    1. HARGA KOIN &amp; DISKON 100 PILIHAN KOIN
                  </span>
                  <h3 className="text-sm font-black text-white mt-0.5">
                    Murahin Harga 1 Koin &amp; Diskon Beli Koin
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Normal: <strong>1 Koin = Rp 10.000</strong> (+ recehan desimal). Bisa dimurahin dan dikasih diskon untuk seluruh 100 pilihan (1 s/d 1 Juta Koin).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Harga Dasar per 1 Koin (Normal Rp 10.000):
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={spinWheelConfig.baseCoinPriceRupiah}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 10000);
                      adminUpdateSpinWheelConfig({ baseCoinPriceRupiah: val });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[10_000, 5_000, 2_500, 1_000, 500, 100].map((price) => (
                      <button
                        key={price}
                        type="button"
                        onClick={() => {
                          const res = adminUpdateSpinWheelConfig({ baseCoinPriceRupiah: price });
                          setSpinAdminFeedback(res.message);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold cursor-pointer ${
                          spinWheelConfig.baseCoinPriceRupiah === price
                            ? 'bg-amber-400 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        Rp {price.toLocaleString('id-ID')}/Koin
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">
                      Diskon Pembelian Koin (100 Pilihan):
                    </label>
                    <span className="font-mono font-black text-emerald-400 text-xs">
                      {spinWheelConfig.coinPurchaseDiscountPercent}% OFF
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={99}
                    value={spinWheelConfig.coinPurchaseDiscountPercent}
                    onChange={(e) =>
                      adminUpdateSpinWheelConfig({
                        coinPurchaseDiscountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 10, 25, 50, 75, 90, 99].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const res = adminUpdateSpinWheelConfig({
                            coinPurchaseDiscountPercent: pct,
                          });
                          setSpinAdminFeedback(res.message);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold cursor-pointer ${
                          spinWheelConfig.coinPurchaseDiscountPercent === pct
                            ? 'bg-emerald-400 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {pct === 0 ? 'Normal (0%)' : `Diskon ${pct}%`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Preview of Coin Package Prices with Recehan Decimals */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[10px] font-mono">
                  <span className="text-amber-300 font-bold block">
                    Pratinjau Harga Koin (+ Recehan Desimal):
                  </span>
                  {[1, 100, 100_000, 1_000_000].map((coinQty) => {
                    const pkg = COIN_PURCHASE_PACKAGES_100.find((p) => p.coins === coinQty);
                    if (!pkg) return null;
                    const priceInfo = calculateCoinPackagePrice(pkg, spinWheelConfig);
                    return (
                      <div key={coinQty} className="flex items-center justify-between">
                        <span className="text-slate-300">
                          • {coinQty.toLocaleString('id-ID')} Koin:
                        </span>
                        <span className="text-emerald-400 font-bold">
                          {formatRupiahWithDecimals(priceInfo.finalPrice)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. KONTROL DISKON SPIN (1x, 3x, 5x, 7x, 10x SPIN) */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-fuchsia-500/40 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-fuchsia-400 font-bold block">
                    2. DISKON BIAYA SPIN (1x, 3x, 5x, 7x, 10x)
                  </span>
                  <h3 className="text-sm font-black text-white mt-0.5">
                    Atur Biaya Koin &amp; Diskon Putaran Spin
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Normal 1x Spin = <strong>100 Koin (Setara Rp 1.000.000)</strong>. Anda bisa memberi diskon semua spin maupun diskon khusus per paket 1x, 3x, 5x, 7x, 10x.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">
                      Diskon Semua Spin (Global):
                    </label>
                    <span className="font-mono font-black text-fuchsia-300 text-xs">
                      {spinWheelConfig.spinDiscountPercent}% OFF
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={spinWheelConfig.spinDiscountPercent}
                    onChange={(e) =>
                      adminUpdateSpinWheelConfig({
                        spinDiscountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full accent-fuchsia-400 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {[0, 20, 50, 75, 90, 100].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => {
                          const res = adminUpdateSpinWheelConfig({ spinDiscountPercent: pct });
                          setSpinAdminFeedback(res.message);
                        }}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold cursor-pointer ${
                          spinWheelConfig.spinDiscountPercent === pct
                            ? 'bg-fuchsia-400 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {pct === 100 ? '100% (GRATIS SPIN)' : `${pct}% OFF`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Rincian Biaya &amp; Diskon Tambahan (1x, 3x, 5x, 7x, 10x):
                  </span>
                  {([1, 3, 5, 7, 10] as const).map((cnt) => {
                    const cost = calculateSpinCost(cnt, spinWheelConfig);
                    const extraDisc = spinWheelConfig.bundleExtraDiscountPercent?.[cnt] || 0;
                    return (
                      <div
                        key={cnt}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-black text-white font-mono text-xs">
                            Spin {cnt}x: {cost.finalCoins} Koin
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            Setara {formatRupiah(cost.finalRupiahEquivalent)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-slate-400">Ekstra Diskon %:</span>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={extraDisc}
                            onChange={(e) =>
                              adminUpdateSpinWheelConfig({
                                bundleExtraDiscountPercent: {
                                  ...spinWheelConfig.bundleExtraDiscountPercent,
                                  [cnt]: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                                },
                              })
                            }
                            className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-xs text-center"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3. KONTROL KEMUNGKINAN PENDAPATAN (PROBABILITAS & LUCK BOOSTER) + SUNTIK KOIN */}
              <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/40 space-y-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold block">
                    3. PERBESAR KEMUNGKINAN PENDAPATAN SPIN
                  </span>
                  <h3 className="text-sm font-black text-white mt-0.5">
                    Boost Kemungkinan Hadiah Besar &amp; Suntik Koin
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Normalnya hadiah <strong>Rp 1 Juta = 1%</strong> (mengecil ke atas) dan <strong>Rp 15 Juta &amp; Rp 20 Juta = 0,000000000001% (1 dari 1.000 Kuadriliun)</strong>. Perbesar kemungkinannya di bawah ini!
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Pengali Keberuntungan (Luck Multiplier Hadiah ≥ Rp 1 Juta):
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { mult: 1, label: '1x (Normal)' },
                      { mult: 10, label: '10x Lipat' },
                      { mult: 100, label: '100x Lipat' },
                      { mult: 1_000, label: '1.000x Lipat' },
                      { mult: 100_000, label: '100.000x' },
                      { mult: 1_000_000_000, label: '1 Miliar x!' },
                    ].map((item) => (
                      <button
                        key={item.mult}
                        type="button"
                        onClick={() => {
                          const res = adminUpdateSpinWheelConfig({ luckMultiplier: item.mult });
                          setSpinAdminFeedback(res.message);
                        }}
                        className={`py-1.5 px-2 rounded-xl font-mono text-[10px] font-bold cursor-pointer ${
                          spinWheelConfig.luckMultiplier === item.mult
                            ? 'bg-cyan-400 text-slate-950 font-black'
                            : 'bg-slate-900 text-slate-300 border border-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Mode Jaminan Hadiah Besar (Force Jackpot Admin):
                  </label>
                  <select
                    value={spinWheelConfig.forceJackpotMode}
                    onChange={(e) => {
                      const res = adminUpdateSpinWheelConfig({
                        forceJackpotMode: e.target.value as any,
                      });
                      setSpinAdminFeedback(res.message);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                  >
                    <option value="none">
                      Standar Probabilitas (1 Juta = 1%, 15 &amp; 20 Juta = 0,000000000001%)
                    </option>
                    <option value="min_1m">
                      🔥 Pasti Dapat Minimal Rp 1.000.000 s/d Rp 20.000.000
                    </option>
                    <option value="min_5m">
                      💎 Pasti Dapat Minimal Rp 5.000.000 s/d Rp 20.000.000
                    </option>
                    <option value="only_15m_20m">
                      👑 Pasti Jackpot Rp 15.000.000 atau Rp 20.000.000 (100% Tembus Kuadriliun!)
                    </option>
                  </select>
                </div>

                {/* Suntik Koin Spin Cepat ke Nasabah */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-bold text-amber-300 block">
                    🪙 Suntik Koin Spin Gratis ke Semua Nasabah:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={spinAdminCoinInput}
                      onChange={(e) => setSpinAdminCoinInput(Math.max(1, Number(e.target.value) || 100))}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminMassSpinCoinRain(spinAdminCoinInput);
                        setSpinAdminFeedback(res.message);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shrink-0"
                    >
                      +Bagikan Koin
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: KELOLA RIWAYAT UPDATE WEBSITE (UPDATE SEKARANG & SEBELUMNYA) ================= */}
      {activeAdminTab === 'app_updates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Left Column: Form Tambah / Isi Riwayat Update Baru (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/95 border-2 border-emerald-500/60 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 shrink-0">
                <History className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
                  PANEL MANAJEMEN RIWAYAT UPDATE RESMI
                </span>
                <h3 className="font-black text-white text-base">
                  Isi & Terbitkan Riwayat Update Baru
                </h3>
                <p className="text-[11px] text-slate-400">
                  Isi Tanggal Lengkap, Nama Update, dan Deskripsi Lengkap untuk ditampilkan di halaman &quot;Riwayat Update&quot; sebelah Buku Panduan.
                </p>
              </div>
            </div>

            {updateFeedback && (
              <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{updateFeedback}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUpdateFeedback('')}
                  className="text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const changesArr = newUpdateChangesText
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean);
                const res = adminAddAppUpdate({
                  version: newUpdateVersion,
                  title: newUpdateTitle,
                  dateText: newUpdateDateText,
                  description: newUpdateDesc,
                  changes: changesArr,
                  isCurrent: newUpdateSetCurrent,
                  author: newUpdateAuthor,
                });
                setUpdateFeedback(res.message);
                if (res.success) {
                  setNewUpdateVersion(`v${appUpdates.length + 2}.0`);
                  setNewUpdateDateText(getTodayCompleteIndoDate());
                }
              }}
              className="space-y-3.5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Kode Versi Update:
                  </label>
                  <input
                    type="text"
                    required
                    value={newUpdateVersion}
                    onChange={(e) => setNewUpdateVersion(e.target.value)}
                    placeholder="Contoh: v14.0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-300 font-mono font-bold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">
                    Diterbitkan Oleh:
                  </label>
                  <input
                    type="text"
                    value={newUpdateAuthor}
                    onChange={(e) => setNewUpdateAuthor(e.target.value)}
                    placeholder="Admin Utama Bank Nusantara"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">
                    📅 Tanggal Lengkap Update (Wajib):
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewUpdateDateText(getTodayCompleteIndoDate())}
                    className="text-[10px] font-bold text-amber-300 hover:text-amber-200 underline cursor-pointer"
                  >
                    ⚡ Isi Tanggal & Jam Sekarang
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={newUpdateDateText}
                  onChange={(e) => setNewUpdateDateText(e.target.value)}
                  placeholder="Contoh: Rabu, 21 Oktober 2026 • Pukul 14:30 WIB"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  🏷️ Nama / Judul Update (Wajib):
                </label>
                <input
                  type="text"
                  required
                  value={newUpdateTitle}
                  onChange={(e) => setNewUpdateTitle(e.target.value)}
                  placeholder="Masukkan nama update..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  📝 Deskripsi Lengkap Update (Wajib):
                </label>
                <textarea
                  rows={4}
                  required
                  value={newUpdateDesc}
                  onChange={(e) => setNewUpdateDesc(e.target.value)}
                  placeholder="Tuliskan deskripsi lengkap mengenai pembaruan ini..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white leading-relaxed"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  📋 Rincian Poin Perubahan (1 Baris = 1 Poin Update):
                </label>
                <textarea
                  rows={4}
                  value={newUpdateChangesText}
                  onChange={(e) => setNewUpdateChangesText(e.target.value)}
                  placeholder="Pisahkan dengan baris baru (Enter)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-[11px] leading-relaxed"
                />
              </div>

              <label className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/50 border border-emerald-500/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newUpdateSetCurrent}
                  onChange={(e) => setNewUpdateSetCurrent(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
                <div>
                  <span className="font-bold text-emerald-300 block">
                    Jadikan sebagai &quot;UPDATE SEKARANG (TERBARU)&quot;
                  </span>
                  <span className="text-[10px] text-slate-300 block">
                    Jika dicentang, update sebelumnya otomatis berpindah ke daftar &quot;Update Sebelumnya&quot;.
                  </span>
                </div>
              </label>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 hover:from-emerald-300 hover:to-cyan-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/25 cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Simpan & Publikasikan ke Riwayat Update</span>
              </button>
            </form>
          </div>

          {/* Right Column: Daftar Update Sekarang & Update Sebelumnya (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  <span>Daftar Riwayat Update Website ({appUpdates.length} Versi)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Kelola, edit tanggal/nama/deskripsi, atau ubah mana yang tampil sebagai <strong>Update Sekarang</strong> dan <strong>Update Sebelumnya</strong>.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset daftar Riwayat Update ke bawaan sistem?')) {
                    const res = adminResetAppUpdates();
                    setUpdateFeedback(res.message);
                  }
                }}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[680px] overflow-y-auto pr-1">
              {appUpdates.map((upd) => {
                const isEditing = editingUpdateId === upd.id;
                return (
                  <div
                    key={upd.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3 ${
                      upd.isCurrent
                        ? 'bg-gradient-to-br from-emerald-950/60 via-slate-950 to-slate-950 border-2 border-emerald-400/80 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800/80 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          {upd.isCurrent ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                              ★ UPDATE SEKARANG (AKTIF)
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold text-[10px] uppercase">
                              UPDATE SEBELUMNYA
                            </span>
                          )}
                          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono font-bold text-xs">
                            {upd.version}
                          </span>
                          <span className="text-[11px] font-mono text-cyan-300">
                            📅 {upd.dateText}
                          </span>
                        </div>
                        <h4 className="font-black text-white text-sm sm:text-base mt-1">
                          {upd.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!upd.isCurrent && (
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminSetCurrentAppUpdate(upd.id);
                              setUpdateFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] cursor-pointer"
                          >
                            Jadikan Update Sekarang
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            if (isEditing) {
                              setEditingUpdateId(null);
                            } else {
                              setEditingUpdateId(upd.id);
                              setEditUpdateVersion(upd.version);
                              setEditUpdateTitle(upd.title);
                              setEditUpdateDateText(upd.dateText);
                              setEditUpdateDesc(upd.description);
                              setEditUpdateChangesText((upd.changes || []).join('\n'));
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-[10px] cursor-pointer"
                        >
                          {isEditing ? 'Batal Edit' : '✏️ Edit'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Hapus riwayat update "${upd.title}"?`)) {
                              const res = adminDeleteAppUpdate(upd.id);
                              setUpdateFeedback(res.message);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 cursor-pointer"
                          title="Hapus Update"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-blue-500/40 space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Versi:</label>
                            <input
                              type="text"
                              value={editUpdateVersion}
                              onChange={(e) => setEditUpdateVersion(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono font-bold text-xs"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] text-slate-400 block mb-1">Tanggal Lengkap:</label>
                            <input
                              type="text"
                              value={editUpdateDateText}
                              onChange={(e) => setEditUpdateDateText(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-cyan-300 font-mono text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Nama Update:</label>
                          <input
                            type="text"
                            value={editUpdateTitle}
                            onChange={(e) => setEditUpdateTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">Deskripsi Lengkap:</label>
                          <textarea
                            rows={3}
                            value={editUpdateDesc}
                            onChange={(e) => setEditUpdateDesc(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-400 block mb-1">
                            Daftar Perubahan Detail (1 baris = 1 poin):
                          </label>
                          <textarea
                            rows={3}
                            value={editUpdateChangesText}
                            onChange={(e) => setEditUpdateChangesText(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono text-[11px]"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUpdateId(null)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminEditAppUpdate(upd.id, {
                                version: editUpdateVersion,
                                title: editUpdateTitle,
                                dateText: editUpdateDateText,
                                description: editUpdateDesc,
                                changes: editUpdateChangesText
                                  .split('\n')
                                  .map((s) => s.trim())
                                  .filter(Boolean),
                              });
                              setUpdateFeedback(res.message);
                              if (res.success) setEditingUpdateId(null);
                            }}
                            className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                          >
                            ✓ Simpan Perubahan Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {upd.description}
                        </p>
                        {upd.changes && upd.changes.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                            {upd.changes.map((chg, idx) => (
                              <div
                                key={idx}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800/90 text-[11px] text-slate-300 flex items-start gap-1.5"
                              >
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span>{chg}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: LAPORAN BUG MASUK (PENJELASAN WAJIB & FOTO BEBAS OPSIONAL) ================= */}
      {activeAdminTab === 'bug_reports' && (
        <div className="bg-slate-900/90 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl space-y-5 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-mono font-bold text-[10px] uppercase tracking-wider">
                  🐛 MONITORING LAPORAN BUG DARI TOMBOL PALING BAWAH
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1.5 flex items-center gap-2">
                <Bug className="w-5 h-5 text-amber-400" />
                <span>Daftar Laporan Bug Pengguna ({bugReports.length} Laporan)</span>
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
                Sesuai permintaan Anda: Semua laporan dari tombol <strong>&quot;Lapor Bug&quot;</strong> di paling bawah halaman masuk ke sini lengkap dengan <strong>Penjelasan Bug (Wajib)</strong> dan <strong>Foto Bebas (Opsional)</strong>. Klik foto untuk memperbesar ukuran penuh!
              </p>
            </div>

            {bugReports.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Hapus semua daftar laporan bug?')) {
                    adminClearBugReports();
                    setBugFeedback('Seluruh laporan bug telah dibersihkan.');
                  }
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>Bersihkan Semua Laporan</span>
              </button>
            )}
          </div>

          {bugFeedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{bugFeedback}</span>
              </div>
              <button onClick={() => setBugFeedback('')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {bugReports.length === 0 ? (
            <div className="py-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
              <Bug className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-white font-bold text-sm">Belum Ada Laporan Bug Masuk</p>
              <p className="text-slate-400 text-xs">
                Pengguna dapat mengirim laporan bug melalui tombol &quot;Lapor Bug&quot; di bagian paling bawah aplikasi.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {bugReports.map((bug) => (
                <div
                  key={bug.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-amber-400/50 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              bug.status === 'selesai'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : bug.status === 'diproses'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}
                          >
                            {bug.status === 'selesai'
                              ? '✓ Selesai'
                              : bug.status === 'diproses'
                              ? '⏳ Diproses'
                              : '🆕 Baru'}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 font-mono text-[10px] border border-slate-800">
                            {bug.category}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-white text-sm mt-1">
                          {bug.reporterName}
                          {bug.reporterAccountNumber && (
                            <span className="text-amber-300 font-mono text-xs ml-1.5">
                              ({bug.reporterAccountNumber})
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          Waktu Lapor: {new Date(bug.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => adminDeleteBugReport(bug.id)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 cursor-pointer"
                        title="Hapus laporan bug ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Penjelasan Bug (Wajib) */}
                    <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                        📝 PENJELASAN BUG DARI PELAPOR:
                      </span>
                      <p className="text-white font-semibold text-xs sm:text-sm whitespace-pre-line leading-relaxed">
                        {bug.explanation}
                      </p>
                    </div>

                    {/* Foto Lampiran (Opsional) */}
                    {bug.photoDataUrl ? (
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono uppercase text-emerald-300 font-bold flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>📷 FOTO BUKTI TERLAMPIR ({bug.photoFileName || 'Foto Bebas'}):</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setZoomBugPhotoUrl(bug.photoDataUrl || null)}
                            className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold cursor-pointer hover:bg-emerald-500/30"
                          >
                            🔍 Perbesar Foto
                          </button>
                        </div>
                        <div className="rounded-xl overflow-hidden bg-black/70 border border-slate-800 max-h-56 flex items-center justify-center">
                          <img
                            src={bug.photoDataUrl}
                            alt="Lampiran Bug"
                            onClick={() => setZoomBugPhotoUrl(bug.photoDataUrl || null)}
                            className="max-h-52 w-auto object-contain cursor-pointer hover:opacity-90"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-2 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[11px] text-slate-500 italic">
                        Tanpa lampiran foto (Pengguna hanya mengirim penjelasan).
                      </div>
                    )}
                  </div>

                  {/* Admin Controls: Update Status & Reply */}
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center gap-1.5">
                      {(['baru', 'diproses', 'selesai'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={async () => {
                            const res = await adminUpdateBugReport(
                              bug.id,
                              st,
                              bugReplyMap[bug.id] !== undefined ? bugReplyMap[bug.id] : bug.adminReply
                            );
                            setBugFeedback(res.message);
                            setTimeout(() => setBugFeedback(''), 3500);
                          }}
                          className={`flex-1 py-1.5 rounded-lg font-bold text-[10px] uppercase cursor-pointer border ${
                            bug.status === st
                              ? 'bg-amber-400 text-slate-950 border-amber-300'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                          }`}
                        >
                          {st === 'baru' ? '🆕 Baru' : st === 'diproses' ? '⏳ Diproses' : '✓ Selesai'}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={bugReplyMap[bug.id] ?? bug.adminReply ?? ''}
                        onChange={(e) =>
                          setBugReplyMap((prev) => ({ ...prev, [bug.id]: e.target.value }))
                        }
                        placeholder="Tulis balasan / catatan perbaikan Admin..."
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          const replyText = bugReplyMap[bug.id] ?? bug.adminReply ?? '';
                          const res = await adminUpdateBugReport(bug.id, 'selesai', replyText);
                          setBugFeedback(`Balasan disimpan & status diubah ke Selesai! (${res.message})`);
                          setTimeout(() => setBugFeedback(''), 3500);
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer shrink-0"
                      >
                        Kirim Balasan
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lightbox Zoom Foto Bug di Panel Admin */}
          {zoomBugPhotoUrl && (
            <div
              onClick={() => setZoomBugPhotoUrl(null)}
              className="fixed inset-0 z-[170] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
            >
              <img
                src={zoomBugPhotoUrl}
                alt="Zoom Foto Bug"
                className="max-w-full max-h-[88vh] rounded-2xl border-2 border-amber-400 shadow-2xl object-contain"
              />
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TAB: CHAT GLOBAL (HANYA BISA DIKIRIM OLEH ADMIN LEWAT PANEL ADMIN) ================= */}
      {activeAdminTab === 'global_chat' && (
        <div className="bg-slate-900/90 border-2 border-amber-400/60 rounded-3xl p-6 shadow-2xl space-y-6 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>KHUSUS ADMIN PANEL • {connectedDevicesCount} HP TERHUBUNG</span>
                </span>
                <VerifiedBadge size="sm" showText text="HANYA ADMIN YANG BISA MENGIRIM" />
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white mt-1.5 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-400" />
                <span>Chat Global Khusus Admin — Kirim &quot;Pesan dari Admin&quot; ke Semua HP</span>
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
                Sesuai permintaan Anda: <strong>Global Chat hanya bisa dikirim oleh Admin melalui Panel Admin ini</strong> (Sahabat/Nasabah tidak bisa mengirim pesan). Saat Anda mengirim pesan, di semua HP akan muncul jendela pop-up sistem website bertuliskan <strong className="text-amber-300">&quot;Pesan dari Admin&quot;</strong> beserta isi pesan Anda!
              </p>
            </div>
          </div>

          {globalChatFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{globalChatFeedback}</span>
              </div>
              <button onClick={() => setGlobalChatFeedback('')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Send Message to All Phones Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!globalChatText.trim()) return;
                const res = await sendGlobalChatMessage({
                  text: globalChatText.trim(),
                  asAdmin: true,
                  senderName: globalChatAdminName.trim() || 'Admin Bank Nusantara',
                  showPopupOnAllPhones: true,
                });
                setGlobalChatFeedback(res.message);
                if (res.success) {
                  setGlobalChatText('');
                }
                setTimeout(() => setGlobalChatFeedback(''), 6000);
              }}
              className="lg:col-span-6 bg-slate-950 border border-amber-400/40 rounded-3xl p-5 space-y-4"
            >
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                  FORMULIR SIARAN CHAT GLOBAL ADMIN
                </span>
                <h4 className="font-black text-white text-sm sm:text-base mt-0.5">
                  Tulis Pesan untuk Dikirim ke Semua HP
                </h4>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  Nama Pengirim Admin (Muncul dengan Centang Biru ☑️):
                </label>
                <input
                  type="text"
                  value={globalChatAdminName}
                  onChange={(e) => setGlobalChatAdminName(e.target.value)}
                  placeholder="Admin Bank Nusantara"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="text-amber-300 font-bold block mb-1">
                  Isi Pesan yang Akan Tampil di Semua HP (Di Bawah Tulisan &quot;Pesan dari Admin&quot;):
                </label>
                <textarea
                  rows={4}
                  required
                  value={globalChatText}
                  onChange={(e) => setGlobalChatText(e.target.value)}
                  placeholder="Ketik pesan Anda di sini... Contoh: Halo seluruh nasabah! Hari ini tersedia promo spesial dan layanan berjalan lancar."
                  className="w-full bg-slate-900 border-2 border-amber-400/50 focus:border-amber-400 rounded-2xl p-3.5 text-white text-sm font-semibold focus:outline-none"
                />
              </div>

              {/* Quick Templates */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-semibold block">
                  Contoh Pesan Cepat (Klik untuk Mengisi):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Halo semuanya! Ini pesan resmi dari Admin Bank Nusantara untuk semua HP.',
                    'Pengumuman: Kode Redeem baru telah diaktifkan, silakan klaim di menu Kode Redeem!',
                    'Seluruh antrean transaksi dan pembukaan kartu sedang diproses oleh Admin.',
                    'Peringatan Keamanan: Jangan pernah membagikan 6 digit PIN kartu Anda kepada siapa pun.',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setGlobalChatText(tpl)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-400/50 text-slate-300 hover:text-amber-200 text-[10px] text-left cursor-pointer transition-all"
                    >
                      &ldquo;{tpl.slice(0, 52)}...&rdquo;
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-amber-950/70 border border-amber-400/50 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 block font-bold">
                  📱 PRATINJAU TAMPILAN DI SEMUA HP:
                </span>
                <div className="font-black text-white text-sm flex items-center gap-1.5">
                  <span>Pesan dari Admin</span>
                  <VerifiedBadge size="xs" />
                </div>
                <p className="text-amber-200 font-bold text-xs break-words">
                  {globalChatText.trim() || '(Isi pesan yang Anda tulis akan tampil persis di sini di semua HP...)'}
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 cursor-pointer flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Kirim &quot;Pesan dari Admin&quot; ke Semua HP Sekarang</span>
              </button>
            </form>

            {/* Right Column: Live Global Chat History */}
            <div className="lg:col-span-6 bg-slate-950 border border-slate-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
                    <span>Riwayat Chat Global Aktif ({globalChats.length})</span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Daftar pesan yang sedang tampil secara real-time di seluruh HP.
                  </p>
                </div>
                {globalChats.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearGlobalChatMessages()}
                    className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                )}
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {globalChats.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 space-y-2">
                    <MessageSquare className="w-8 h-8 mx-auto opacity-50" />
                    <p>Belum ada pesan di Chat Global. Kirim pesan pertama Anda di sebelah kiri!</p>
                  </div>
                ) : (
                  globalChats.map((msg) => {
                    const isAdmin = msg.senderRole === 'admin';
                    return (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-2xl border space-y-1.5 ${
                          isAdmin
                            ? 'bg-amber-500/10 border-amber-400/60'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                isAdmin
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {isAdmin ? '📢 Pesan dari Admin' : 'Nasabah'}
                            </span>
                            <span className="font-bold text-white text-xs flex items-center gap-1">
                              <span>{msg.senderName}</span>
                              {(isAdmin || msg.isVerified) && <VerifiedBadge size="xs" />}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(msg.timestamp).toLocaleTimeString('id-ID')} WIB
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteGlobalChatMessage(msg.id)}
                              className="text-slate-500 hover:text-rose-400 cursor-pointer"
                              title="Hapus pesan"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="text-white font-bold text-xs sm:text-sm whitespace-pre-wrap break-words">
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 0: TINJAUAN KEUANGAN WAJIB ADMIN ================= */}
      {activeAdminTab === 'finance' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 uppercase tracking-wider">
                  Otorisasi Pembelian & Pembayaran Nasabah
                </span>
                <span className="text-xs text-amber-400 font-mono font-bold">
                  {pendingFinancialTransactions.length} Menunggu Persetujuan
                </span>
              </div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2 mt-1">
                <BadgeDollarSign className="w-5 h-5 text-emerald-400" />
                <span>Pusat Tinjauan Pembelian & Keuangan Admin</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                Saat nasabah membeli barang/layanan yang dibayar dengan uang, <strong>saldo nasabah sudah langsung dipotong</strong> dan masuk ke antrean ini. Klik <strong>Terima & Sahkan</strong> untuk menyetujui, atau <strong>Tolak</strong> untuk mengembalikan (refund) saldo ke nasabah. (Catatan: Transfer antar rekening langsung berhasil tanpa perlu persetujuan admin).
              </p>
            </div>

            {pendingFinancialTransactions.length > 0 && (
              <button
                onClick={() => adminApproveAllFinancialTransactions()}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui Semua Transaksi ({pendingFinancialTransactions.length})</span>
              </button>
            )}
          </div>

          {pendingFinancialTransactions.length === 0 ? (
            <div className="py-12 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">Tidak Ada Pembelian / Transaksi Keuangan Tertunda</p>
              <p className="text-slate-500 text-xs max-w-md mx-auto">
                Semua transaksi pembelian, tagihan, dan setoran nasabah telah disetujui atau diproses oleh Admin.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingFinancialTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-4 sm:p-5 rounded-2xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px] border border-amber-500/30">
                        {tx.type.toUpperCase()}
                      </span>
                      <div>
                        <h4 className="font-bold text-white text-xs sm:text-sm">{tx.title}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Ref: {tx.referenceNo} • {new Date(tx.timestamp).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-emerald-400 font-semibold block">
                        {tx.balanceDeducted ? '✓ Saldo Nasabah Sudah Dipotong' : 'Menunggu Eksekusi Saldo'}
                      </span>
                      <span className="text-base sm:text-lg font-mono font-black text-amber-300">
                        {formatRupiah(tx.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800/40">
                    <div>
                      <span className="text-slate-500 block">Nasabah Pembeli:</span>
                      <span className="font-semibold text-white">{tx.senderName || 'Nasabah Bank Nusantara'}</span>
                      <span className="block text-slate-400 font-mono text-[10px]">{tx.senderAccount || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tujuan / ID Pelanggan:</span>
                      <span className="font-semibold text-white">{tx.recipientName || '-'}</span>
                      {tx.generatedCode ? (
                        <span className="block text-amber-300 font-mono text-[10px] font-bold">
                          🔒 Kode Tukar: Disembunyikan (Terbit saat disetujui Admin)
                        </span>
                      ) : tx.requiresBuyerApproval ? (
                        <span className="block text-cyan-300 font-mono text-[10px] font-bold">
                          ✅ Tanpa Kode Tukar: Menunggu Persetujuan Pembeli setelah disetujui Admin
                        </span>
                      ) : null}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Keterangan Sistem:</span>
                      <span className="text-slate-300 italic">{tx.description || 'Sedang diproses'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => setRejectFinanceModalId(tx.id)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak & Refund Saldo</span>
                    </button>
                    <button
                      onClick={() => adminApproveFinancialTransaction(tx.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Terima & Sahkan Transaksi</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Log Riwayat Audit Transaksi Terakhir */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="font-bold text-white text-xs mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Log Transaksi Finansial Terakhir Sistem Bank ({transactions.length} Total)</span>
            </h4>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
              {transactions.slice(0, 12).map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex items-center justify-between text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        tx.status === 'success'
                          ? 'bg-emerald-400'
                          : tx.status === 'pending'
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-rose-400'
                      }`}
                    />
                    <span className="font-bold text-slate-200">{tx.title}</span>
                    <span className="text-slate-500 font-mono text-[10px]">({tx.referenceNo})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-white">{formatRupiah(tx.amount)}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.status === 'success'
                          ? tx.requiresBuyerApproval && !tx.buyerApproved
                            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                            : 'bg-emerald-500/10 text-emerald-400'
                          : tx.status === 'pending'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      {tx.status === 'success'
                        ? tx.requiresBuyerApproval
                          ? tx.buyerApproved
                            ? '✓ Disetujui Admin & Pembeli'
                            : 'Disetujui Admin (Menunggu Persetujuan Pembeli)'
                          : 'Selesai / Disetujui'
                        : tx.status === 'pending'
                        ? 'Menunggu Admin'
                        : 'Ditolak (Refund)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: VERIFIKASI CENTANG BIRU (VERIFICATION BADGE ICON) ================= */}
      {activeAdminTab === 'verification' && (
        <div className="bg-slate-900/90 border-2 border-sky-500/40 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <VerifiedBadge size="sm" showText text="VERIFIED BADGE" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-sky-400 font-bold">
                  OTORITAS VERIFIKASI CENTANG BIRU NASABAH
                </span>
              </div>
              <h3 className="font-black text-white text-base sm:text-lg mt-1 flex items-center gap-2">
                <span>Manajemen Verifikasi Centang Biru (Verification Badge Icon)</span>
              </h3>
              <p className="text-slate-300 text-xs mt-1 max-w-2xl">
                Sesuai permintaan Anda: Di panel admin ini Anda dapat memberikan atau mencabut <strong>Centang Biru (Verification Badge Icon)</strong> pada setiap kartu nasabah. Saat diberikan, ikon Centang Biru akan tampil di Kartu 3D, Navbar, Dashboard, dan nasabah menerima Notifikasi Sistem Website.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  adminVerifyAllAccounts(true);
                  setVerifyFeedback('Seluruh kartu nasabah berhasil diberikan lencana Verifikasi Centang Biru!');
                  setTimeout(() => setVerifyFeedback(''), 4000);
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-black text-xs cursor-pointer shadow-lg flex items-center gap-1.5"
              >
                <BadgeCheck className="w-4 h-4" />
                <span>Berikan Centang Biru ke Semua Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  adminVerifyAllAccounts(false);
                  setVerifyFeedback('Seluruh lencana Centang Biru telah dicabut.');
                  setTimeout(() => setVerifyFeedback(''), 4000);
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cabut Semua Centang Biru
              </button>
            </div>
          </div>

          {verifyFeedback && (
            <div className="p-3.5 rounded-2xl bg-sky-950/90 border border-sky-400 text-sky-200 font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VerifiedBadge size="sm" />
                <span>{verifyFeedback}</span>
              </div>
              <button onClick={() => setVerifyFeedback('')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Custom Verification Label Input */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex-1">
              <label className="text-sky-300 font-bold block mb-1">
                Label Gelar Verifikasi Centang Biru (Muncul saat ikon Centang Biru diarahkan/dilihat):
              </label>
              <input
                type="text"
                value={customVerifyLabel}
                onChange={(e) => setCustomVerifyLabel(e.target.value)}
                placeholder="Contoh: Nasabah Resmi Terverifikasi (Centang Biru)"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 sm:pt-5">
              {[
                'Nasabah Resmi Terverifikasi (Centang Biru)',
                'VIP Prioritas Terverifikasi ✓',
                'Akun Resmi Otoritas Bank Nusantara',
              ].map((lbl) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setCustomVerifyLabel(lbl)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-sky-500/20 border border-slate-700 text-[10px] text-sky-300 font-semibold cursor-pointer"
                >
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          {/* Accounts Grid for Centang Biru Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {accounts.map((acc, idx) => (
              <div
                key={acc.id}
                className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                  acc.isVerified
                    ? 'bg-sky-950/30 border-sky-500/60 shadow-lg shadow-sky-950/40'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                      Kartu #{idx + 1}
                    </span>
                    <span className="font-extrabold text-white text-sm truncate">{acc.fullName}</span>
                    {acc.isVerified && (
                      <VerifiedBadge size="md" showText text="CENTANG BIRU AKTIF" label={acc.verifiedLabel} />
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    No. Rek: <strong className="text-amber-300">{acc.accountNumber}</strong> • Kartu: {acc.cardNumber}
                  </p>
                  {acc.isVerified && (
                    <p className="text-[10px] text-sky-300 font-semibold">
                      ✓ Label: "{acc.verifiedLabel || 'Nasabah Resmi Terverifikasi (Centang Biru)'}"
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = adminToggleVerifyAccount(acc.id, customVerifyLabel);
                    setVerifyFeedback(res.message);
                    setTimeout(() => setVerifyFeedback(''), 4000);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs shrink-0 cursor-pointer transition-all flex items-center gap-1.5 shadow-md ${
                    acc.isVerified
                      ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40'
                      : 'bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white'
                  }`}
                >
                  <BadgeCheck className="w-4 h-4" />
                  <span>{acc.isVerified ? 'Cabut Centang Biru' : 'Verifikasi Centang Biru'}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: 26 SUPER TOOLS OTORITAS PENUH ADMIN ================= */}
      {activeAdminTab === 'super_tools' && (
        <div className="space-y-6 text-xs">
          {/* FITUR UTAMA: MASUK CEPAT KE AKUN ORANG & EDIT SEMUA AKUN TANPA HARUS MASUK & TANPA RIBET */}
          <AdminQuickAccountControlPanel
            onNavigateToCustomerDashboard={onNavigateToCustomerDashboard}
          />

          {superToolFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 font-bold flex items-center justify-between shadow-xl sticky top-20 z-30">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{superToolFeedback}</span>
              </div>
              <button onClick={() => setSuperToolFeedback('')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Header & Target Account Selector */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-fuchsia-950/70 via-slate-900 to-indigo-950/70 border-2 border-fuchsia-500/50 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/50 font-mono font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>56 FITUR SUPER TOOLS EKSEKUSI INSTAN GA KALENG-KALENG</span>
                  </span>
                </div>
                <h3 className="font-black text-white text-base sm:text-lg mt-1">
                  Pusat 56+ Super Tools Otoritas Penuh Administrator Bank Nusantara
                </h3>
                <p className="text-slate-300 text-xs mt-0.5">
                  Pilih kartu target di bawah ini untuk menjalankan Super Tools spesifik kartu (termasuk Level Pekerjaan, Voucher Level, Click Power, Gaji Instan, Saldo, Brankas ATM, Pajak, Dividen, Rollback, dll.), atau gunakan Super Tools Massal untuk mengeksekusi ke seluruh nasabah sekaligus!
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    adminApproveAllCards();
                    setSuperToolFeedback('Semua antrean kartu baru telah disetujui!');
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold cursor-pointer"
                >
                  ✓ Setujui Kartu ({pendingCards.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adminApproveAllUpgrades();
                    setSuperToolFeedback('Semua antrean upgrade kartu telah disetujui!');
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold cursor-pointer"
                >
                  ✓ Setujui Upgrade ({pendingUpgrades.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adminApproveAllLoans();
                    setSuperToolFeedback('Semua antrean pinjaman online telah dicairkan!');
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold cursor-pointer"
                >
                  ✓ Cairkan Pinjaman ({pendingLoans.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    adminUnbanAllCards();
                    setSuperToolFeedback('Semua kartu yang dibanned telah dibuka kembali!');
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold cursor-pointer"
                >
                  🔓 Buka Semua Banned ({bannedCards.length})
                </button>
              </div>
            </div>

            {/* Master Target Account Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-fuchsia-500/40 flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="text-fuchsia-300 font-black whitespace-nowrap">
                🎯 Pilih Kartu / Rekening Target Utama:
              </label>
              <select
                value={superToolAccountId}
                onChange={(e) => setSuperToolAccountId(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
              >
                {accounts.map((acc, idx) => (
                  <option key={acc.id} value={acc.id}>
                    Kartu #{idx + 1}: {acc.fullName} — Rek: {acc.accountNumber} | Saldo: {formatRupiah(acc.balance)} | Tier: {acc.cardTier.toUpperCase()} | PIN: {acc.pin}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* GRID OF 26 SUPER TOOLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* SUPER TOOL #1: Injeksi / Set / Unlimited Saldo */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #1 • INJEKSI SALDO & INFINITY (∞)
                </span>
                <h4 className="font-black text-white text-sm">Atur Saldo Rekening Target (+ / - / = / ∞)</h4>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: 'add', label: '+ Tambah' },
                    { id: 'subtract', label: '- Kurang' },
                    { id: 'set', label: '= Set' },
                    { id: 'unlimited', label: '∞ Tak Terbatas' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setBalanceActionMode(m.id as 'add' | 'subtract' | 'set' | 'unlimited')}
                      className={`py-1.5 rounded-lg font-bold text-[10px] cursor-pointer border ${
                        balanceActionMode === m.id
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {balanceActionMode !== 'unlimited' && (
                  <input
                    type="number"
                    value={balanceAdjustAmount}
                    onChange={(e) => setBalanceAdjustAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono font-bold text-emerald-400"
                    placeholder="Nominal (Rp)"
                  />
                )}
                <input
                  type="text"
                  value={balanceAdjustNote}
                  onChange={(e) => setBalanceAdjustNote(e.target.value)}
                  placeholder="Catatan mutasi..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-[11px]"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminAdjustAccountBalance({
                    accountId: superToolAccountId,
                    mode: balanceActionMode,
                    amount: balanceAdjustAmount,
                    note: balanceAdjustNote,
                  });
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Eksekusi Perubahan Saldo
              </button>
            </div>

            {/* SUPER TOOL #2: Hujan Saldo Massal ke Semua Rekening */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #2 • MONEY RAIN (HUJAN SALDO MASSAL)
                </span>
                <h4 className="font-black text-white text-sm">Bagikan Saldo Gratis ke Seluruh Rekening</h4>
                <p className="text-[11px] text-slate-400">
                  Menambahkan saldo secara serentak ke semua rekening nasabah aktif beserta notifikasi sistem website.
                </p>
                <input
                  type="number"
                  value={rainAmount}
                  onChange={(e) => setRainAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono font-bold text-amber-300"
                  placeholder="Nominal Hujan Saldo (Rp)"
                />
                <input
                  type="text"
                  value={rainNote}
                  onChange={(e) => setRainNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white text-[11px]"
                  placeholder="Pesan bonus..."
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminMassBalanceRain(rainAmount, rainNote);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                💸 Luncurkan Hujan Saldo ke Semua Akun
              </button>
            </div>

            {/* SUPER TOOL #3: Pengganda Saldo Instan (Multiplier x2, x5, x10, x100) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #3 • PENGGANDA SALDO (MULTIPLIER)
                </span>
                <h4 className="font-black text-white text-sm">Lipat Gandakan Saldo Rekening Target</h4>
                <p className="text-[11px] text-slate-400">
                  Kalikan saldo rekening target secara instan dengan pengali pilihan Anda.
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[2, 5, 10, 100].map((mult) => (
                    <button
                      key={mult}
                      type="button"
                      onClick={() => setMultiplyFactor(mult)}
                      className={`py-2 rounded-xl font-mono font-black text-xs cursor-pointer border ${
                        multiplyFactor === mult
                          ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      x{mult}
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminMultiplyAccountBalance(superToolAccountId, multiplyFactor);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-fuchsia-500 hover:bg-fuchsia-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                ⚡ Kalikan Saldo Target (x{multiplyFactor})
              </button>
            </div>

            {/* SUPER TOOL #4: Ubah Tier Kartu Langsung (Termasuk Kartu Admin ∞) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #4 • UBAH TIER KARTU INSTAN
                </span>
                <h4 className="font-black text-white text-sm">Ganti Jenis Kartu Target Tanpa Antrean</h4>
                <p className="text-[11px] text-slate-400">
                  Ubah kartu nasabah ke Silver, Gold, Platinum, Infinite, atau Kartu Admin (Infinity ∞).
                </p>
                <select
                  value={directTierTarget}
                  onChange={(e) => setDirectTierTarget(e.target.value as CardTier)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                >
                  {Object.values(CARD_TIER_CONFIGS).map((cfg) => (
                    <option key={cfg.tier} value={cfg.tier}>
                      {cfg.nameIndo}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminDirectChangeAccountTier(superToolAccountId, directTierTarget);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Simpan Jenis Kartu Baru
              </button>
            </div>

            {/* SUPER TOOL #5: Ubah Tier Seluruh Akun Sekaligus */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #5 • UPGRADE TIER MASSAL SEMUA AKUN
                </span>
                <h4 className="font-black text-white text-sm">Seragamkan Tier Seluruh Kartu Nasabah</h4>
                <p className="text-[11px] text-slate-400">
                  Jadikan seluruh rekening nasabah ke kasta kartu pilihan Anda dalam 1 klik.
                </p>
                <select
                  value={massTierTarget}
                  onChange={(e) => setMassTierTarget(e.target.value as CardTier)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                >
                  {Object.values(CARD_TIER_CONFIGS).map((cfg) => (
                    <option key={cfg.tier} value={cfg.tier}>
                      {cfg.nameIndo}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetAllAccountsTier(massTierTarget);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl cursor-pointer"
              >
                Terapkan Tier ke Semua Kartu
              </button>
            </div>

            {/* SUPER TOOL #6: Ubah / Override 6-Digit PIN Kartu */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #6 • OVERRIDE PIN KARTU ATM
                </span>
                <h4 className="font-black text-white text-sm">Ganti PIN 6 Digit Kartu Target Langsung</h4>
                <p className="text-[11px] text-slate-400">
                  Reset atau ubah PIN kartu tanpa perlu mengetahui PIN lama nasabah.
                </p>
                <input
                  type="text"
                  maxLength={6}
                  value={directNewPinInput}
                  onChange={(e) => setDirectNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 digit PIN baru"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 font-mono font-bold text-center text-white tracking-widest text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminDirectChangeAccountPin(superToolAccountId, directNewPinInput);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Simpan PIN 6 Digit Baru
              </button>
            </div>

            {/* SUPER TOOL #7: Custom Nomor Rekening Cantik (VIP Number) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #7 • NOMOR REKENING CANTIK (VIP)
                </span>
                <h4 className="font-black text-white text-sm">Kustomisasi Nomor Rekening Target</h4>
                <p className="text-[11px] text-slate-400">
                  Berikan nomor rekening cantik kembar (contoh: 8888888888 atau 9999999999).
                </p>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customAccNumInput}
                    onChange={(e) => setCustomAccNumInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono font-bold text-amber-300"
                    placeholder="Contoh: 8888888888"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomAccNumInput('8888888888')}
                    className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded-lg font-mono text-[10px] cursor-pointer"
                  >
                    8888..
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomAccNumInput('7777777777')}
                    className="px-2.5 py-1 bg-slate-800 text-amber-300 rounded-lg font-mono text-[10px] cursor-pointer"
                  >
                    7777..
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetCustomAccountNumber(superToolAccountId, customAccNumInput);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Pasang Nomor Rekening Cantik
              </button>
            </div>

            {/* SUPER TOOL #8: Kustomisasi Nomor Kartu 16 Digit, CVV & Masa Berlaku */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #8 • CUSTOM 16 DIGIT KARTU, CVV & EXPIRY
                </span>
                <h4 className="font-black text-white text-sm">Atur Nomor Fisik Kartu, CVV & Expired</h4>
                <input
                  type="text"
                  value={customCardNumInput}
                  onChange={(e) => setCustomCardNumInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-white text-xs"
                  placeholder="16 Digit Kartu (5392 8888 8888 8888)"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={customCvvInput}
                    onChange={(e) => setCustomCvvInput(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-amber-300 text-xs"
                    placeholder="CVV (888)"
                  />
                  <input
                    type="text"
                    maxLength={7}
                    value={customExpInput}
                    onChange={(e) => setCustomExpInput(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-cyan-300 text-xs"
                    placeholder="Exp (12/35)"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetCustomCardDetails(superToolAccountId, {
                    cardNumber: customCardNumInput,
                    cvv: customCvvInput,
                    expiryDate: customExpInput,
                  });
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl cursor-pointer"
              >
                Update Data Fisik Kartu 3D
              </button>
            </div>

            {/* SUPER TOOL #9: Injeksi Nusantara Poin Rewards & Loyalty */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2.5">
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #9 • GENERATOR POIN REWARDS
                </span>
                <h4 className="font-black text-white text-sm">Tambah / Set / ∞ Nusantara Poin</h4>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { id: 'add', label: '+ Tambah' },
                    { id: 'set', label: '= Set Poin' },
                    { id: 'unlimited', label: '∞ Unlimited' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setRewardPtsMode(m.id as 'add' | 'set' | 'unlimited')}
                      className={`py-1.5 rounded-lg font-bold text-[10px] cursor-pointer border ${
                        rewardPtsMode === m.id
                          ? 'bg-yellow-400 text-slate-950 border-yellow-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                {rewardPtsMode !== 'unlimited' && (
                  <input
                    type="number"
                    value={rewardPtsInput}
                    onChange={(e) => setRewardPtsInput(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono font-bold text-yellow-300"
                    placeholder="Jumlah Poin"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminAdjustRewardPoints(superToolAccountId, rewardPtsInput, rewardPtsMode);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Terapkan Poin Rewards
              </button>
            </div>

            {/* SUPER TOOL #10: Injeksi Saldo Pulsa HP & kWh Token Listrik */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #10 • INJEKSI PULSA & TOKEN LISTRIK KWH
                </span>
                <h4 className="font-black text-white text-sm">Tambah Saldo Pulsa & Meteran Listrik</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">+ Pulsa HP (Rp):</label>
                    <input
                      type="number"
                      value={injectPulsaAmt}
                      onChange={(e) => setInjectPulsaAmt(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-emerald-400 font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">+ Listrik (kWh):</label>
                    <input
                      type="number"
                      value={injectKwhAmt}
                      onChange={(e) => setInjectKwhAmt(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-amber-300 font-bold"
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminInjectPulsaAndPln(superToolAccountId, injectPulsaAmt, injectKwhAmt);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Injeksi Pulsa & kWh Sekarang
              </button>
            </div>

            {/* SUPER TOOL #11: Force Transfer Antar Rekening Tanpa PIN */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #11 • FORCE TRANSFER ANTAR REKENING
                </span>
                <h4 className="font-black text-white text-sm">Pindahkan Dana Antar Akun Tanpa PIN</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={forceFromAccId}
                    onChange={(e) => setForceFromAccId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white text-[11px]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        Dari: {a.fullName}
                      </option>
                    ))}
                  </select>
                  <select
                    value={forceToAccId}
                    onChange={(e) => setForceToAccId(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white text-[11px]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        Ke: {a.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="number"
                  value={forceTransferAmt}
                  onChange={(e) => setForceTransferAmt(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono font-bold text-rose-300"
                  placeholder="Nominal Transfer Paksa (Rp)"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminForceTransferBetweenAccounts(
                    forceFromAccId,
                    forceToAccId,
                    forceTransferAmt,
                    'Pemindahan Dana Otoritas Admin'
                  );
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl cursor-pointer"
              >
                Eksekusi Force Transfer
              </button>
            </div>

            {/* SUPER TOOL #12: Buat Kartu / Rekening Baru Aktif Instan (Bypass Onboarding) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #12 • GENERATOR REKENING VIP INSTAN
                </span>
                <h4 className="font-black text-white text-sm">Ciptakan Kartu Baru Langsung Aktif</h4>
                <input
                  type="text"
                  value={instantAccName}
                  onChange={(e) => setInstantAccName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                  placeholder="Nama Pemilik Kartu Baru"
                />
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    maxLength={6}
                    value={instantAccPin}
                    onChange={(e) => setInstantAccPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-white text-center"
                    placeholder="PIN"
                  />
                  <input
                    type="number"
                    value={instantAccBal}
                    onChange={(e) => setInstantAccBal(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-emerald-400"
                    placeholder="Saldo"
                  />
                  <select
                    value={instantAccTier}
                    onChange={(e) => setInstantAccTier(e.target.value as CardTier)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-amber-300 font-bold"
                  >
                    {Object.values(CARD_TIER_CONFIGS).map((c) => (
                      <option key={c.tier} value={c.tier}>
                        {c.tier.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminCreateInstantActiveAccount({
                    fullName: instantAccName,
                    cardTier: instantAccTier,
                    initialBalance: instantAccBal,
                    pin: instantAccPin,
                    isVerified: true,
                  });
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                + Buat Kartu Aktif Sekarang
              </button>
            </div>

            {/* SUPER TOOL #13: Kloning / Duplikasi Kartu Target */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #13 • DUPLIKASI / KLONING KARTU
                </span>
                <h4 className="font-black text-white text-sm">Gandakan Kartu Target Beserta Saldonya</h4>
                <p className="text-[11px] text-slate-400">
                  Menduplikasi profil, saldo, poin rewards, dan tier kartu target menjadi rekening baru dengan nomor unik.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminCloneAccount(superToolAccountId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl cursor-pointer"
              >
                🧬 Kloning Kartu Target Sekarang
              </button>
            </div>

            {/* SUPER TOOL #14: Pembekuan (Freeze) / Buka Beku Massal Semua Kartu */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #14 • MASS CARD FREEZE / UNFREEZE
                </span>
                <h4 className="font-black text-white text-sm">Bekukan / Aktifkan Seluruh Kartu</h4>
                <p className="text-[11px] text-slate-400">
                  Kunci sementara semua kartu nasabah (selain kartu Admin) atau buka kembali secara serentak.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminMassFreezeOrUnfreezeAll(true);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold rounded-xl cursor-pointer"
                >
                  ❄️ Freeze Semua
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = adminMassFreezeOrUnfreezeAll(false);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  🔥 Unfreeze Semua
                </button>
              </div>
            </div>

            {/* SUPER TOOL #15: Reset Kuota Penarikan Tunai ATM Harian */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #15 • RESET KUOTA TARIK TUNAI ATM
                </span>
                <h4 className="font-black text-white text-sm">Nol-kan Pemakaian Limit ATM Harian</h4>
                <p className="text-[11px] text-slate-400">
                  Mereset perhitungan kuota tarik tunai harian ke Rp 0 agar nasabah bisa menarik uang lagi tanpa batas.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminResetDailyWithdrawalQuota(superToolAccountId);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl cursor-pointer"
                >
                  Reset Target Saja
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = adminResetDailyWithdrawalQuota();
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Reset Semua Akun
                </button>
              </div>
            </div>

            {/* SUPER TOOL #16: Atur Limit Belanja Harian & Akses Internasional */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #16 • LIMIT BELANJA & AKSES INTERNASIONAL
                </span>
                <h4 className="font-black text-white text-sm">Override Limit Harian & Roaming Kartu</h4>
                <input
                  type="number"
                  value={customSpendLimit}
                  onChange={(e) => setCustomSpendLimit(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-indigo-300 font-bold"
                  placeholder="Limit Belanja Harian (Rp)"
                />
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customAllowIntl}
                    onChange={(e) => setCustomAllowIntl(e.target.checked)}
                    className="accent-indigo-400"
                  />
                  <span>Aktifkan Transaksi Internasional Luar Negeri</span>
                </label>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetSpendingLimitAndIntl(superToolAccountId, customSpendLimit, customAllowIntl);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl cursor-pointer"
              >
                Terapkan Limit & Akses
              </button>
            </div>

            {/* SUPER TOOL #17: Pelunasan / Penghapusan Pinjaman Online Nasabah */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #17 • PEMUTIHAN / PELUNASAN PINJAMAN
                </span>
                <h4 className="font-black text-white text-sm">Lunasi / Hapus Tagihan Pinjaman Online</h4>
                <p className="text-[11px] text-slate-400">
                  Bebaskan nasabah dari kewajiban cicilan pinjaman online secara instan oleh Admin.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminForgiveOrPayoffLoans(superToolAccountId);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  Lunasi Pinjaman Target
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = adminForgiveOrPayoffLoans();
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold rounded-xl cursor-pointer"
                >
                  Lunasi Semua Pinjaman
                </button>
              </div>
            </div>

            {/* SUPER TOOL #18: Booster Bunga Deposito & Kantong Tabungan */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #18 • BOOSTER DEPOSITO & KANTONG TABUNGAN
                </span>
                <h4 className="font-black text-white text-sm">Lonjakkan Nilai Deposito & Tabungan Impian</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={1000}
                    value={boostPercentInput}
                    onChange={(e) => setBoostPercentInput(parseInt(e.target.value, 10) || 10)}
                    className="w-24 bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono font-bold text-emerald-400 text-center"
                  />
                  <span className="text-slate-300 font-bold">% Kenaikan Bonus Bunga Instan</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminBoostDepositosAndPockets(boostPercentInput);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                📈 Boost Seluruh Deposito & Kantong (+{boostPercentInput}%)
              </button>
            </div>

            {/* SUPER TOOL #19: Generator Kode Voucher / Stroom Token Listrik Gratis */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #19 • GENERATOR KODE VOUCHER & STROOM PLN
                </span>
                <h4 className="font-black text-white text-sm">Cetak Kode Token Listrik / Pulsa Gratis</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={instantVoucherType}
                    onChange={(e) =>
                      setInstantVoucherType(e.target.value as 'pulsa' | 'token_listrik' | 'voucher_lain')
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
                  >
                    <option value="token_listrik">Token Listrik PLN</option>
                    <option value="pulsa">Voucher Pulsa HP</option>
                    <option value="voucher_lain">Voucher Game/Lain</option>
                  </select>
                  <input
                    type="number"
                    value={instantVoucherNominal}
                    onChange={(e) => setInstantVoucherNominal(parseInt(e.target.value, 10) || 50000)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-amber-300 font-bold"
                    placeholder="Nominal"
                  />
                </div>
                <input
                  type="text"
                  value={instantVoucherTarget}
                  onChange={(e) => setInstantVoucherTarget(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-white"
                  placeholder="No. Meter PLN / No. HP Tujuan"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminGenerateInstantVoucher({
                    category: instantVoucherType,
                    title:
                      instantVoucherType === 'token_listrik'
                        ? 'Token Listrik PLN Hadiah Admin'
                        : 'Voucher Spesial Hadiah Admin',
                    nominal: instantVoucherNominal,
                    targetNumber: instantVoucherTarget,
                  });
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🎟️ Terbitkan Kode Voucher Gratis
              </button>
            </div>

            {/* SUPER TOOL #20: Bulk Generator Kode Redeem Otomatis */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #20 • BULK REDEEM CODE GENERATOR
                </span>
                <h4 className="font-black text-white text-sm">Cetak Banyak Kode Redeem Sekaligus</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block">Jumlah Kode:</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bulkRedeemCount}
                      onChange={(e) => setBulkRedeemCount(parseInt(e.target.value, 10) || 5)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block">Hadiah / Kode (Rp):</label>
                    <input
                      type="number"
                      value={bulkRedeemReward}
                      onChange={(e) => setBulkRedeemReward(parseInt(e.target.value, 10) || 100000)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 font-mono text-emerald-400 font-bold"
                    />
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminGenerateBulkRedeemCodes(bulkRedeemCount, bulkRedeemReward, 10, 120);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-pink-500 hover:bg-pink-400 text-white font-black rounded-xl cursor-pointer"
              >
                🎁 Generate {bulkRedeemCount} Kode Redeem Otomatis
              </button>
            </div>

            {/* SUPER TOOL #21: Pembuat Mutasi / Riwayat Transaksi Custom */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #21 • CUSTOM TRANSACTION RECORD BUILDER
                </span>
                <h4 className="font-black text-white text-sm">Sisipkan Riwayat Mutasi Transaksi Custom</h4>
                <input
                  type="text"
                  value={customTxTitle}
                  onChange={(e) => setCustomTxTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-white"
                  placeholder="Judul Transaksi..."
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={customTxType}
                    onChange={(e) =>
                      setCustomTxType(e.target.value as 'transfer_in' | 'transfer_out' | 'setor' | 'tarik')
                    }
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
                  >
                    <option value="transfer_in">Dana Masuk (+)</option>
                    <option value="setor">Setor Tunai (+)</option>
                    <option value="transfer_out">Dana Keluar (-)</option>
                    <option value="tarik">Tarik Tunai (-)</option>
                  </select>
                  <input
                    type="number"
                    value={customTxAmt}
                    onChange={(e) => setCustomTxAmt(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-emerald-400 font-bold"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminCreateCustomTransaction({
                    accountId: superToolAccountId,
                    title: customTxTitle,
                    amount: customTxAmt,
                    type: customTxType,
                    description: 'Mutasi Resmi Otoritas Admin',
                  });
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Tambahkan ke Buku Mutasi
              </button>
            </div>

            {/* SUPER TOOL #22: Pembersih Log Riwayat Mutasi Transaksi */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #22 • PEMBERSIH RIWAYAT MUTASI
                </span>
                <h4 className="font-black text-white text-sm">Bersihkan Log Riwayat Transaksi</h4>
                <p className="text-[11px] text-slate-400">
                  Hapus catatan riwayat mutasi untuk rekening target atau bersihkan seluruh log transaksi bank.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminClearTransactionHistory(superToolAccountId);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold rounded-xl cursor-pointer"
                >
                  Hapus Mutasi Target
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = adminClearTransactionHistory();
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl cursor-pointer"
                >
                  Hapus Semua Mutasi
                </button>
              </div>
            </div>

            {/* SUPER TOOL #23: Editor Identitas Profil Nasabah (Nama, No HP, Email, Alamat) */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #23 • EDITOR IDENTITAS KARTU & PROFIL
                </span>
                <h4 className="font-black text-white text-sm">Ubah Nama Tercetak di Kartu, HP & Email</h4>
                <input
                  type="text"
                  value={editIdentityName}
                  onChange={(e) => setEditIdentityName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                  placeholder="Nama Baru di Kartu (Kosongkan jika tetap)"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={editIdentityPhone}
                    onChange={(e) => setEditIdentityPhone(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                    placeholder="No. HP Baru"
                  />
                  <input
                    type="text"
                    value={editIdentityEmail}
                    onChange={(e) => setEditIdentityEmail(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                    placeholder="Email Baru"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminUpdateAccountIdentity(superToolAccountId, {
                    fullName: editIdentityName || undefined,
                    phone: editIdentityPhone || undefined,
                    email: editIdentityEmail || undefined,
                    address: editIdentityAddress || undefined,
                  });
                  setSuperToolFeedback(res.message);
                  setEditIdentityName('');
                  setEditIdentityPhone('');
                  setEditIdentityEmail('');
                }}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Update Identitas Kartu Target
              </button>
            </div>

            {/* SUPER TOOL #24: Broadcast Pop-Up Sistem Website ke Layar Nasabah */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #24 • POP-UP SISTEM WEBSITE LANGSUNG
                </span>
                <h4 className="font-black text-white text-sm">Tampilkan Jendela Pop-Up Sistem Website</h4>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
                  placeholder="Judul Pop-Up"
                />
                <textarea
                  rows={2}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                  placeholder="Isi pesan pop-up sistem website..."
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSendWebsiteBroadcast({
                    title: broadcastTitle,
                    message: broadcastMessage,
                    targetAccountId: broadcastTargetId || undefined,
                  });
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                📢 Kirim Pop-Up Sistem Website
              </button>
            </div>

            {/* SUPER TOOL #25: Kontrol Status Resi Pengiriman Ekspedisi */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #25 • KONTROL TRACKING RESI EKSPEDISI
                </span>
                <h4 className="font-black text-white text-sm">Ubah Status Pengiriman Paket ({resiList.length})</h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {resiList.map((r) => (
                    <div
                      key={r.id}
                      className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <span className="font-mono font-bold text-amber-300 text-[10px] truncate">
                        {r.resiNumber}
                      </span>
                      <select
                        value={r.status}
                        onChange={(e) => {
                          adminUpdateResiStatus(
                            r.id,
                            e.target.value as 'Diproses' | 'Dalam Perjalanan' | 'Tiba di Kota Tujuan' | 'Selesai Diterima'
                          );
                          setSuperToolFeedback(`Status resi ${r.resiNumber} diubah menjadi ${e.target.value}`);
                        }}
                        className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-[10px] text-cyan-300 font-bold"
                      >
                        <option value="Diproses">Diproses</option>
                        <option value="Dalam Perjalanan">Dalam Perjalanan</option>
                        <option value="Tiba di Kota Tujuan">Tiba di Kota Tujuan</option>
                        <option value="Selesai Diterima">Selesai Diterima</option>
                      </select>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  resiList.forEach((r) => adminUpdateResiStatus(r.id, 'Selesai Diterima'));
                  setSuperToolFeedback('Seluruh paket resi telah ditandai Selesai Diterima!');
                }}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl cursor-pointer"
              >
                📦 Tandai Semua Paket Selesai Diterima
              </button>
            </div>

            {/* SUPER TOOL #26: Hapus Rekening Target / Reset Master Data */}
            <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #26 • PENGHAPUSAN KARTU & MASTER RESET
                </span>
                <h4 className="font-black text-white text-sm">Hapus Rekening Target atau Reset Sistem</h4>
                <p className="text-[11px] text-slate-400">
                  Hapus permanen rekening target yang dipilih (Kartu Admin Utama dilindungi), atau kembalikan seluruh data ke awal.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminDeleteAccount(superToolAccountId);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-bold rounded-xl cursor-pointer"
                >
                  🗑️ Hapus Kartu Target
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset seluruh data bank ke kondisi awal?')) {
                      resetAllData();
                      setSuperToolFeedback('Seluruh sistem Bank Nusantara berhasil direset ke kondisi awal.');
                    }
                  }}
                  className="py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl cursor-pointer"
                >
                  🔄 Reset Master Bank
                </button>
              </div>
            </div>

            {/* SUPER TOOL #27: Atur Level Pekerjaan Nasabah (Level 1 s/d Level 100) */}
            <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #27 • OVERRIDE LEVEL PEKERJAAN NASABAH
                </span>
                <h4 className="font-black text-white text-sm">
                  Atur Level Pekerjaan Target (Saat Ini: Lv.{accounts.find((a) => a.id === superToolAccountId)?.jobLevel || 1})
                </h4>
                <div className="grid grid-cols-3 gap-1">
                  {(['set', 'add', 'max'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setStJobLevelMode(m)}
                      className={`py-1 rounded-lg font-bold text-[10px] cursor-pointer border ${
                        stJobLevelMode === m
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      {m === 'set' ? '= Set Level' : m === 'add' ? '+ Tambah Lv' : '🔥 MAX Lv.100'}
                    </button>
                  ))}
                </div>
                {stJobLevelMode !== 'max' && (
                  <input
                    type="number"
                    min="1"
                    value={stJobLevelInput}
                    onChange={(e) => setStJobLevelInput(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-emerald-300 font-bold"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetAccountJobLevel(superToolAccountId, stJobLevelInput, stJobLevelMode);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Terapkan Level Pekerjaan
              </button>
            </div>

            {/* SUPER TOOL #28: Suntik Voucher Level Tanpa Suit Komputer */}
            <div className="bg-slate-900/90 border-2 border-cyan-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #28 • GENERATOR VOUCHER LEVEL INSTAN
                </span>
                <h4 className="font-black text-white text-sm">
                  Suntik Voucher Level (Milik Target: {accounts.find((a) => a.id === superToolAccountId)?.levelVouchers || 0} Voucher)
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={stVoucherMode}
                    onChange={(e) => setStVoucherMode(e.target.value as 'add' | 'set')}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
                  >
                    <option value="add">+ Tambah Voucher</option>
                    <option value="set">= Set Jumlah Voucher</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={stVoucherInput}
                    onChange={(e) => setStVoucherInput(parseInt(e.target.value, 10) || 1)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-cyan-300 font-bold"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminAdjustLevelVouchers(superToolAccountId, stVoucherInput, stVoucherMode);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🎫 Suntik Voucher Level Sekarang
              </button>
            </div>

            {/* SUPER TOOL #29: Gajian Instan Tanpa Perlu Klik (Auto-Complete Job) */}
            <div className="bg-slate-900/90 border-2 border-amber-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #29 • CAIRKAN GAJI PEKERJAAN TANPA KLIK
                </span>
                <h4 className="font-black text-white text-sm">Langsung Gajian (Bypass Target Klik & Level)</h4>
                <select
                  value={stSelectedJobId}
                  onChange={(e) => setStSelectedJobId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-amber-300 font-bold"
                >
                  {JOB_VACANCIES_CATALOG.map((j) => (
                    <option key={j.id} value={j.id}>
                      Gaji {formatRupiah(j.salary)} — {j.title.slice(0, 28)}...
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminInstantCompleteJobSalary(superToolAccountId, stSelectedJobId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                💰 Cairkan Gaji Pekerjaan Ini Sekarang
              </button>
            </div>

            {/* SUPER TOOL #30: Boost Kekuatan Klik Kerja (Click Power 1x s/d 100x Klik) */}
            <div className="bg-slate-900/90 border border-fuchsia-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #30 • TURBO CLICK POWER PEKERJAAN
                </span>
                <h4 className="font-black text-white text-sm">
                  Atur Kekuatan Klik (1 Ketukan = {stClickPowerInput} Klik Sekaligus)
                </h4>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 5, 10, 25, 100].map((pw) => (
                    <button
                      key={pw}
                      type="button"
                      onClick={() => setStClickPowerInput(pw)}
                      className={`py-1.5 rounded-lg font-mono font-bold text-[10px] cursor-pointer border ${
                        stClickPowerInput === pw
                          ? 'bg-fuchsia-500 text-white border-fuchsia-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {pw}x Klik
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetClickPower(superToolAccountId, stClickPowerInput);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-black rounded-xl cursor-pointer"
              >
                ⚡ Aktifkan Turbo {stClickPowerInput}x Klik
              </button>
            </div>

            {/* SUPER TOOL #31: Multiplier Gaji Pekerjaan (2x s/d 10x Lipat Gaji) */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #31 • MULTIPLIER BONUS GAJI KERJA
                </span>
                <h4 className="font-black text-white text-sm">
                  Lipat Gandakan Gaji Pekerjaan ({stSalaryMultInput}x Lipat Gaji)
                </h4>
                <div className="grid grid-cols-5 gap-1">
                  {[1, 2, 3, 5, 10].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setStSalaryMultInput(m)}
                      className={`py-1.5 rounded-lg font-mono font-bold text-[10px] cursor-pointer border ${
                        stSalaryMultInput === m
                          ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}
                    >
                      {m}x Gaji
                    </button>
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetSalaryMultiplier(superToolAccountId, stSalaryMultInput);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🚀 Pasang Multiplier {stSalaryMultInput}x Gaji
              </button>
            </div>

            {/* SUPER TOOL #32: Hujan Voucher Level ke Semua Nasabah */}
            <div className="bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #32 • HUJAN VOUCHER LEVEL MASSAL
                </span>
                <h4 className="font-black text-white text-sm">
                  Bagikan Voucher Level ke Seluruh {accounts.length} Nasabah
                </h4>
                <input
                  type="number"
                  min="1"
                  value={stMassVoucherRain}
                  onChange={(e) => setStMassVoucherRain(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-cyan-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminMassLevelVoucherRain(stMassVoucherRain);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🌧️ Sebar +{stMassVoucherRain} Voucher ke Semua Akun
              </button>
            </div>

            {/* SUPER TOOL #33: Naikkan Level Pekerjaan Seluruh Nasabah Sekaligus */}
            <div className="bg-slate-900/90 border border-indigo-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #33 • PROMOSI LEVEL KARIR MASSAL
                </span>
                <h4 className="font-black text-white text-sm">
                  Naikkan Level Kerja Semua Nasabah Sekaligus
                </h4>
                <input
                  type="number"
                  min="1"
                  value={stMassLevelAdd}
                  onChange={(e) => setStMassLevelAdd(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-indigo-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminMassUpgradeAllJobLevels(stMassLevelAdd);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl cursor-pointer"
              >
                ⬆️ Naikkan +{stMassLevelAdd} Level Semua Nasabah
              </button>
            </div>

            {/* SUPER TOOL #34: Isi Ulang Kas Brankas Mesin ATM Fisik */}
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #34 • REFILL BRANKAS MESIN ATM FISIK
                </span>
                <h4 className="font-black text-white text-sm">
                  Kas Brankas ATM: {formatRupiah(atmVaultBalance)}
                </h4>
                <input
                  type="number"
                  step="50000000"
                  value={stAtmRefillAmt}
                  onChange={(e) => setStAtmRefillAmt(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-emerald-400 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminRefillAtmVaultCash(stAtmRefillAmt);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🏦 Suntik Uang ke Brankas ATM
              </button>
            </div>

            {/* SUPER TOOL #35: Pemotongan Pajak / Biaya Administrasi Massal */}
            <div className="bg-slate-900/90 border border-rose-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #35 • PAJAK & POTONGAN ADMIN MASSAL
                </span>
                <h4 className="font-black text-white text-sm">Tarif Pajak / Potong Saldo Massal</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={stTaxMode}
                    onChange={(e) => setStTaxMode(e.target.value as 'percent' | 'fixed')}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white font-bold"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                  <input
                    type="number"
                    value={stTaxValue}
                    onChange={(e) => setStTaxValue(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-rose-300 font-bold"
                  />
                </div>
                <input
                  type="text"
                  value={stTaxReason}
                  onChange={(e) => setStTaxReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                  placeholder="Alasan Pajak..."
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminApplyMassTaxOrAdminFee(stTaxValue, stTaxMode, stTaxReason);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl cursor-pointer"
              >
                📉 Terapkan Pemotongan Pajak Massal
              </button>
            </div>

            {/* SUPER TOOL #36: Pembagian Dividen Saham & Bunga Massal (%) */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #36 • DIVIDEN SAHAM & BUNGA MASSAL
                </span>
                <h4 className="font-black text-white text-sm">
                  Bagikan Dividen +{stDividendPct}% ke Saldo Semua Nasabah
                </h4>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={stDividendPct}
                  onChange={(e) => setStDividendPct(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-amber-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminDistributeBankDividend(stDividendPct);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                📈 Bagikan Dividen +{stDividendPct}% Sekarang
              </button>
            </div>

            {/* SUPER TOOL #37: Auto-Cashback Permanen Rekening Target */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #37 • AUTO-CASHBACK TRANSAKSI (%)
                </span>
                <h4 className="font-black text-white text-sm">Atur Persentase Cashback Kartu Target</h4>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={stCashbackPct}
                  onChange={(e) => setStCashbackPct(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-teal-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSetAccountCashbackPercent(superToolAccountId, stCashbackPct);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Pasang Auto-Cashback {stCashbackPct}%
              </button>
            </div>

            {/* SUPER TOOL #38: Perisai VIP Shield Anti-Banned & Anti-Beku */}
            <div className="bg-slate-900/90 border border-sky-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #38 • VIP SHIELD KEKEBALAN KARTU
                </span>
                <h4 className="font-black text-white text-sm">Perisai Kebal Banned & Buka Blokir Otomatis</h4>
                <p className="text-[11px] text-slate-400">
                  Memberikan kekebalan penuh pada kartu target dari pembekuan maupun pemblokiran.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminToggleVipShield(superToolAccountId, true);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl cursor-pointer"
                >
                  🛡️ Aktifkan Shield
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = adminToggleVipShield(superToolAccountId, false);
                    setSuperToolFeedback(res.message);
                  }}
                  className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Matikan Shield
                </button>
              </div>
            </div>

            {/* SUPER TOOL #39: Rollback / Batalkan & Refund Transaksi Terakhir */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #39 • TIME-MACHINE ROLLBACK TRANSAKSI
                </span>
                <h4 className="font-black text-white text-sm">Batalkan & Refund Transaksi Terakhir Nasabah</h4>
                <p className="text-[11px] text-slate-400">
                  Menarik kembali transaksi paling akhir pada rekening target dan mengembalikan saldonya secara utuh.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminRollbackLastTransaction(superToolAccountId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                ⏪ Rollback Transaksi Terakhir
              </button>
            </div>

            {/* SUPER TOOL #40: Akuisisi & Merger Gabungkan 2 Rekening */}
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #40 • MERGER & AKUISISI 2 REKENING
                </span>
                <h4 className="font-black text-white text-sm">Gabungkan Saldo, Poin & Voucher 2 Akun</h4>
                <select
                  value={stMergeSourceId}
                  onChange={(e) => setStMergeSourceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-rose-300 font-bold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      Sumber: {a.fullName} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
                <select
                  value={stMergeTargetId}
                  onChange={(e) => setStMergeTargetId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-emerald-300 font-bold"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      Tujuan: {a.fullName} ({formatRupiah(a.balance)})
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminMergeTwoAccounts(stMergeSourceId, stMergeTargetId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl cursor-pointer"
              >
                🔗 Gabungkan Seluruh Aset Rekening
              </button>
            </div>

            {/* SUPER TOOL #41: Konversi Poin Reward Jadi Uang Tunai Instan */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #41 • PENCAIRAN POIN REWARD JADI TUNAI
                </span>
                <h4 className="font-black text-white text-sm">Ubah Poin Reward Nasabah Jadi Saldo (Rp/Poin)</h4>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={stPointRate}
                  onChange={(e) => setStPointRate(parseInt(e.target.value, 10) || 1000)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-emerald-400 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminConvertPointsToCash(superToolAccountId, stPointRate);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                💎 Cairkan Semua Poin ke Saldo
              </button>
            </div>

            {/* SUPER TOOL #42: Konversi Saldo Pulsa & Token PLN Jadi Uang Tunai */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #42 • BUYBACK PULSA & TOKEN PLN KE TUNAI
                </span>
                <h4 className="font-black text-white text-sm">Cairkan Pulsa & kWh Listrik Jadi Saldo</h4>
                <p className="text-[11px] text-slate-400">
                  Mengubah seluruh saldo Pulsa HP & kWh Listrik meteran nasabah kembali menjadi uang tunai di rekening.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminConvertPulsaPlnToCash(superToolAccountId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white font-black rounded-xl cursor-pointer"
              >
                ⚡ Cairkan Pulsa & kWh ke Rekening
              </button>
            </div>

            {/* SUPER TOOL #43: Terbitkan Deposito Sultan Gratis (Bunga Khusus Admin) */}
            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #43 • HIBAH DEPOSITO SULTAN VIP
                </span>
                <h4 className="font-black text-white text-sm">Terbitkan Bilyet Deposito Bunga Spesial</h4>
                <input
                  type="number"
                  step="5000000"
                  value={stDepoPrincipal}
                  onChange={(e) => setStDepoPrincipal(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-emerald-400 font-bold"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    value={stDepoTenor}
                    onChange={(e) => setStDepoTenor(parseInt(e.target.value, 10) || 6)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-white"
                    placeholder="Tenor (Bln)"
                  />
                  <input
                    type="number"
                    value={stDepoBonusRate}
                    onChange={(e) => setStDepoBonusRate(parseInt(e.target.value, 10) || 15)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-amber-300 font-bold"
                    placeholder="Bunga % p.a"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminCreateSpecialDeposito(
                    superToolAccountId,
                    stDepoPrincipal,
                    stDepoTenor,
                    stDepoBonusRate
                  );
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                📜 Terbitkan Deposito Gratis
              </button>
            </div>

            {/* SUPER TOOL #44: Cairkan Paksa Semua Deposito + Bonus Bunga */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #44 • PENCAIRAN DEPOSITO INSTAN + BONUS
                </span>
                <h4 className="font-black text-white text-sm">
                  Cairkan Semua Deposito Target (+{stLiquidateBonusPct}% Bonus)
                </h4>
                <input
                  type="number"
                  min="0"
                  value={stLiquidateBonusPct}
                  onChange={(e) => setStLiquidateBonusPct(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-emerald-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminForceLiquidateAllDepositos(superToolAccountId, stLiquidateBonusPct);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                💰 Cairkan Semua Deposito ke Saldo
              </button>
            </div>

            {/* SUPER TOOL #45: Buat Kantong Tabungan (Pocket) Langsung Penuh 100% */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #45 • HIBAH KANTONG TABUNGAN LUNAS 100%
                </span>
                <h4 className="font-black text-white text-sm">Buat Kantong Impian Terisi Penuh</h4>
                <input
                  type="text"
                  value={stPocketTitle}
                  onChange={(e) => setStPocketTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                  placeholder="Nama Kantong Tabungan"
                />
                <input
                  type="number"
                  step="1000000"
                  value={stPocketAmt}
                  onChange={(e) => setStPocketAmt(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-cyan-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminCreateFundedPocket(superToolAccountId, stPocketTitle, stPocketAmt);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🐷 Tambahkan Kantong Penuh 100%
              </button>
            </div>

            {/* SUPER TOOL #46: Bebaskan & Lunasi Semua Tagihan COD Resi Pengiriman */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #46 • SUBSIDI LUNAS SEMUA COD EKSPEDISI
                </span>
                <h4 className="font-black text-white text-sm">Lunasi Gratis Semua Tagihan Paket COD</h4>
                <p className="text-[11px] text-slate-400">
                  Membebaskan biaya COD seluruh paket resi nasabah tanpa memotong saldo dan langsung berstatus Selesai Diterima.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminFreeClearAllCodResi();
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-black rounded-xl cursor-pointer"
              >
                🚚 Lunasi & Selesaikan Semua COD
              </button>
            </div>

            {/* SUPER TOOL #47: Kirim Paket & Buat Nomor Resi Ekspedisi Baru untuk Nasabah */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #47 • GENERATOR RESI PENGIRIMAN BARU
                </span>
                <h4 className="font-black text-white text-sm">Terbitkan Paket Resi ke Nasabah Target</h4>
                <input
                  type="text"
                  value={stCustomResiItem}
                  onChange={(e) => setStCustomResiItem(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-white"
                  placeholder="Nama Barang / Pengirim"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="text"
                    value={stCustomResiCourier}
                    onChange={(e) => setStCustomResiCourier(e.target.value)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 text-cyan-300"
                    placeholder="Kurir"
                  />
                  <input
                    type="number"
                    value={stCustomResiCod}
                    onChange={(e) => setStCustomResiCod(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-amber-300"
                    placeholder="COD (Rp)"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminCreateCustomResiForAccount(
                    superToolAccountId,
                    stCustomResiCourier,
                    stCustomResiItem,
                    stCustomResiCod
                  );
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                📦 Buat & Kirim Resi Baru
              </button>
            </div>

            {/* SUPER TOOL #48: Eksekusi Semua Jadwal Pembayaran Rutin Sekarang */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #48 • EKSEKUTOR JADWAL AUTO-DEBIT
                </span>
                <h4 className="font-black text-white text-sm">Jalankan Semua Jadwal Pembayaran Rutin</h4>
                <p className="text-[11px] text-slate-400">
                  Mengeksekusi dan melunasi seluruh tagihan terjadwal nasabah saat ini juga tanpa menunggu tanggal jatuh tempo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminExecuteAllScheduledPaymentsNow();
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl cursor-pointer"
              >
                ⏱️ Eksekusi Semua Jadwal Sekarang
              </button>
            </div>

            {/* SUPER TOOL #49: One-Click Sapu Bersih Semua Antrean Persetujuan */}
            <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #49 • ONE-CLICK MASTER APPROVE ALL
                </span>
                <h4 className="font-black text-white text-sm">Sapu Bersih Setujui Seluruh Antrean Bank</h4>
                <p className="text-[11px] text-slate-400">
                  Menyetujui seluruh Kartu Baru, Upgrade Kartu, Pinjaman Online, dan Tinjauan Keuangan dalam 1 klik!
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminMasterApproveEverything();
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                ✅ Setujui Semua Antrean Sekaligus
              </button>
            </div>

            {/* SUPER TOOL #50: Reset Statistik Karir & Progres Klik Pekerjaan */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #50 • RESET KARIR & LEVEL PEKERJAAN
                </span>
                <h4 className="font-black text-white text-sm">Reset Level, Voucher & Klik Kerja Target</h4>
                <p className="text-[11px] text-slate-400">
                  Mengembalikan Level Pekerjaan ke Level 1, Voucher Level ke 0, serta me-reset progres klik dan statistik suit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminResetCareerStats(superToolAccountId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 font-black rounded-xl cursor-pointer"
              >
                🔄 Reset Karir & Level Target
              </button>
            </div>

            {/* SUPER TOOL #51: Gandakan 2x Lipat Voucher Pulsa & Token Listrik Nasabah */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #51 • DUPLIKATOR VOUCHER PULSA & PLN
                </span>
                <h4 className="font-black text-white text-sm">Gandakan 2x Semua Kode Voucher Aktif Target</h4>
                <p className="text-[11px] text-slate-400">
                  Menduplikasi seluruh kode voucher pulsa & token listrik yang dimiliki nasabah agar bisa ditukar 2 kali lipat.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminDuplicateCustomerVouchers(superToolAccountId);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                ✨ Gandakan Semua Voucher Target
              </button>
            </div>

            {/* SUPER TOOL #52: Perpanjang Masa Aktif Seluruh Kode Redeem */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #52 • EXTENDER DURASI KODE REDEEM
                </span>
                <h4 className="font-black text-white text-sm">Perpanjang Waktu Aktif Semua Kode Redeem</h4>
                <input
                  type="number"
                  min="10"
                  value={stExtendRedeemMins}
                  onChange={(e) => setStExtendRedeemMins(parseInt(e.target.value, 10) || 60)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-amber-300 font-bold"
                  placeholder="Tambahan Menit"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminExtendAllRedeemCodes(stExtendRedeemMins);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                ⏳ Tambah +{stExtendRedeemMins} Menit Semua Redeem
              </button>
            </div>

            {/* SUPER TOOL #53: Tambah Kuota Klaim Semua Kode Redeem */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #53 • BOOSTER KUOTA KODE REDEEM
                </span>
                <h4 className="font-black text-white text-sm">Tambah Kuota Orang Klaim Semua Redeem</h4>
                <input
                  type="number"
                  min="1"
                  value={stBoostRedeemQuota}
                  onChange={(e) => setStBoostRedeemQuota(parseInt(e.target.value, 10) || 10)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-emerald-300 font-bold"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminBoostAllRedeemQuotas(stBoostRedeemQuota);
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                👥 Tambah +{stBoostRedeemQuota} Kuota Semua Redeem
              </button>
            </div>

            {/* SUPER TOOL #54: Kirim Paket Bundling THR Sultan Spesial */}
            <div className="bg-slate-900/90 border-2 border-fuchsia-500/50 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #54 • PAKET BUNDLING THR SULTAN VIP
                </span>
                <h4 className="font-black text-white text-sm">Kirim Uang + Voucher Level + Poin + Pulsa + PLN</h4>
                <div className="grid grid-cols-3 gap-1">
                  <input
                    type="number"
                    value={stThrCash}
                    onChange={(e) => setStThrCash(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-emerald-300 text-[10px]"
                    placeholder="Tunai"
                  />
                  <input
                    type="number"
                    value={stThrVouchers}
                    onChange={(e) => setStThrVouchers(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-cyan-300 text-[10px]"
                    placeholder="Voucher Lv"
                  />
                  <input
                    type="number"
                    value={stThrPoints}
                    onChange={(e) => setStThrPoints(parseInt(e.target.value, 10) || 0)}
                    className="bg-slate-950 border border-slate-700 rounded-lg p-1.5 font-mono text-amber-300 text-[10px]"
                    placeholder="Poin"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminSendThrSultanPackage(
                    superToolAccountId,
                    stThrCash,
                    stThrVouchers,
                    stThrPoints
                  );
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-fuchsia-500 to-amber-500 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🎁 Kirim Paket THR Sultan Sekarang
              </button>
            </div>

            {/* SUPER TOOL #55: Audit Forensik & Auto-Heal Integritas Rekening */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #55 • FORENSIC AUTO-HEAL ENGINE
                </span>
                <h4 className="font-black text-white text-sm">Normalisasi & Perbaikan Otomatis Semua Akun</h4>
                <p className="text-[11px] text-slate-400">
                  Memperbaiki anomali saldo negatif, me-reset limit harian semua kartu, dan menyinkronkan level karir.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminRunForensicAutoHeal();
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                🩺 Jalankan Forensic Auto-Heal
              </button>
            </div>

            {/* SUPER TOOL #56: Ekspor Snapshot JSON Cadangan Master Bank */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[10px]">
                  SUPER TOOL #56 • EKSPOR SNAPSHOT JSON MASTER BANK
                </span>
                <h4 className="font-black text-white text-sm">Salin Cadangan JSON Database ke Clipboard</h4>
                <p className="text-[11px] text-slate-400">
                  Mengekspor ringkasan JSON struktur database rekening, mutasi, katalog fitur, dan riwayat update ke clipboard.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const res = adminExportMasterBankJson();
                  setSuperToolFeedback(res.message);
                }}
                className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                📋 Salin Snapshot JSON Master
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: KONTROL SEMUA FITUR & PIN ADMIN (60+ FITUR) ================= */}
      {activeAdminTab === 'features' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
                KONFIGURASI KEAMANAN & OTORISASI FITUR NASABAH
              </span>
              <h3 className="font-bold text-white text-base sm:text-lg mt-0.5">
                Daftar Lengkap Layanan Bank Nusantara (Bebas Atur PIN Admin &amp; Persetujuan)
              </h3>
              <p className="text-slate-400 text-xs mt-1 max-w-2xl">
                Sesuai permintaan Anda: Di sini terdapat <strong>semua fitur</strong> aplikasi. Anda bebas mengatur apakah setiap fitur <strong>Memakai PIN Admin (159357) atau Tidak</strong> saat diakses nasabah, serta apakah fitur tersebut <strong>Wajib Persetujuan Admin atau Langsung Otomatis</strong>.
              </p>
            </div>

            {/* Bulk Quick Actions */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <button
                onClick={() => setAllFeaturesAdminPin(true)}
                className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-[11px] cursor-pointer flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Pasang PIN Admin Semua</span>
              </button>
              <button
                onClick={() => setAllFeaturesAdminPin(false)}
                className="px-3 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-[11px] cursor-pointer flex items-center gap-1"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Bebaskan PIN Admin Semua</span>
              </button>
              <button
                onClick={() => setAllFeaturesAdminApproval(true)}
                className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-[11px] cursor-pointer"
              >
                ⏳ Wajibkan Persetujuan Admin Semua
              </button>
              <button
                onClick={() => setAllFeaturesAdminApproval(false)}
                className="px-3 py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/40 font-bold text-[11px] cursor-pointer"
              >
                ⚡ Otomatis Tanpa Persetujuan Semua
              </button>
              <button
                onClick={() => setShowAddFeatureForm((v) => !v)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1 shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddFeatureForm ? 'Tutup Form Fitur Baru' : 'Tambah Fitur Baru'}</span>
              </button>
            </div>
          </div>

          {customFeatFeedback && (
            <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
              <span>{customFeatFeedback}</span>
              <button onClick={() => setCustomFeatFeedback('')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showAddFeatureForm && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = adminAddCustomFeature({
                  title: customFeatTitle,
                  category: customFeatCat,
                  description: customFeatDesc,
                  defaultAmount: customFeatAmount,
                  requireAdminPin: customFeatPin,
                  requireAdminApproval: customFeatApproval,
                });
                setCustomFeatFeedback(res.message);
                if (res.success) {
                  setCustomFeatTitle('');
                  setCustomFeatDesc('');
                  setShowAddFeatureForm(false);
                }
              }}
              className="p-4 rounded-2xl bg-slate-950 border-2 border-emerald-500/50 space-y-3"
            >
              <h4 className="font-black text-emerald-300 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Buat & Tambahkan Fitur Layanan Baru ke Aplikasi</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Nama Fitur Baru:</label>
                  <input
                    type="text"
                    required
                    value={customFeatTitle}
                    onChange={(e) => setCustomFeatTitle(e.target.value)}
                    placeholder="Contoh: Bayar Langganan Satelit"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Kategori Fitur:</label>
                  <input
                    type="text"
                    required
                    value={customFeatCat}
                    onChange={(e) => setCustomFeatCat(e.target.value)}
                    placeholder="Contoh: Tagihan & Utilitas"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-cyan-300"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Nominal Default (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={customFeatAmount}
                    onChange={(e) => setCustomFeatAmount(parseInt(e.target.value, 10) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Deskripsi Lengkap Fitur:</label>
                <input
                  type="text"
                  required
                  value={customFeatDesc}
                  onChange={(e) => setCustomFeatDesc(e.target.value)}
                  placeholder="Penjelasan fungsi fitur bagi nasabah..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={customFeatPin}
                      onChange={(e) => setCustomFeatPin(e.target.checked)}
                    />
                    <span>Wajib PIN Admin (159357)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={customFeatApproval}
                      onChange={(e) => setCustomFeatApproval(e.target.checked)}
                    />
                    <span>Wajib Persetujuan Admin</span>
                  </label>
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer"
                >
                  ✓ Simpan Fitur Baru
                </button>
              </div>
            </form>
          )}

          {/* Keranjang Fitur Dihapus di Panel Admin */}
          {deletedFeaturesList.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-500/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/30 text-rose-200">
                    🗑️ DAFTAR FITUR DIHAPUS ({deletedFeaturesList.length} FITUR)
                  </span>
                  <h4 className="font-bold text-white text-sm mt-1">
                    Pulihkan Fitur yang Telah Dihapus
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => restoreAllDeletedFeatures()}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer"
                >
                  ♻️ Pulihkan Semua ({deletedFeaturesList.length} Fitur)
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {deletedFeaturesList.map((df) => (
                  <div
                    key={df.id}
                    className="p-2.5 rounded-xl bg-slate-950 border border-rose-500/30 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] text-rose-300 block">{df.category}</span>
                      <span className="font-bold text-white truncate block">{df.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreDeletedFeature(df.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shrink-0 cursor-pointer"
                    >
                      Pulihkan
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Category Filter */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                placeholder="Cari nama fitur (misal: Transfer, Pulsa, PLN, Resi, Redeem, Tiket, Emas)..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFeatureCategoryFilter(cat)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    featureCategoryFilter === cat
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Features Table / Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
            {filteredFeatures.map((feat) => (
              <div
                key={feat.id}
                className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex flex-col justify-between gap-3 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      {feat.category}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {feat.id}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm">{feat.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{feat.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-900 grid grid-cols-2 gap-2">
                  {/* Toggle 1: PIN Admin */}
                  <button
                    type="button"
                    onClick={() => toggleFeatureAdminPin(feat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      feat.requireAdminPin
                        ? 'bg-rose-500/20 border-rose-500/50 text-rose-200'
                        : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block">Otorisasi PIN Admin:</span>
                      <span className="font-bold text-[11px] flex items-center gap-1 mt-0.5">
                        {feat.requireAdminPin ? (
                          <>
                            <Lock className="w-3 h-3 text-rose-400" />
                            <span className="text-rose-300">Wajib PIN Admin</span>
                          </>
                        ) : (
                          <>
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-300">Bebas (Tanpa PIN)</span>
                          </>
                        )}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        feat.requireAdminPin ? 'bg-rose-500' : 'bg-slate-700'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          feat.requireAdminPin ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>

                  {/* Toggle 2: Persetujuan Admin */}
                  <button
                    type="button"
                    onClick={() => toggleFeatureAdminApproval(feat.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      feat.requireAdminApproval
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                        : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] text-slate-400 block">Persetujuan Admin:</span>
                      <span className="font-bold text-[11px] block mt-0.5">
                        {feat.requireAdminApproval ? '⏳ Wajib Tinjauan' : '⚡ Langsung Lunas'}
                      </span>
                    </div>
                    <div
                      className={`w-8 h-4 rounded-full p-0.5 transition-colors ${
                        feat.requireAdminApproval ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${
                          feat.requireAdminApproval ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>

                {/* Tombol Penjelasan 100x Lipat & Tombol Hapus Fitur untuk Admin */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAdminDetailFeature(feat)}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-slate-900 hover:bg-indigo-950/70 border border-slate-800 hover:border-indigo-500/40 text-indigo-300 font-bold text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span>📚 Penjelasan 100x Lipat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteFeatureById(feat.id)}
                    className="py-1.5 px-3 rounded-xl bg-rose-950/70 hover:bg-rose-600 border border-rose-500/40 text-rose-300 hover:text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                    title="Hapus Fitur Ini dari Katalog Aktif"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Fitur</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: BUAT & KELOLA KODE REDEEM ================= */}
      {activeAdminTab === 'redeem' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
          {/* Form Buat Kode Redeem Baru (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
                <Gift className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Buat Kode Redeem Baru</h3>
                <p className="text-[11px] text-slate-400">
                  Atur kode, kuota berapa orang yang bisa klaim, & berapa lama kodenya berfungsi.
                </p>
              </div>
            </div>

            {redeemFeedback && (
              <div className="p-3 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 font-semibold">
                {redeemFeedback}
              </div>
            )}

            <form onSubmit={handleCreateRedeemSubmit} className="space-y-3.5">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Kode Redeem Unik:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newRedeemCodeStr}
                    onChange={(e) => setNewRedeemCodeStr(e.target.value.toUpperCase())}
                    placeholder="Contoh: NUSANTARA2026"
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={generateRandomRedeemCode}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold cursor-pointer"
                  >
                    🎲 Acak
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Judul / Nama Event Kode Redeem:
                </label>
                <input
                  type="text"
                  required
                  value={newRedeemTitle}
                  onChange={(e) => setNewRedeemTitle(e.target.value)}
                  placeholder="Contoh: Giveaway Saldo Gratis Akhir Pekan"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Nominal Hadiah Saldo (Rp):
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={newRedeemAmount}
                  onChange={(e) => setNewRedeemAmount(parseInt(e.target.value, 10) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold text-sm"
                />
                <div className="grid grid-cols-4 gap-1.5 mt-1.5">
                  {[50_000, 100_000, 500_000, 1_000_000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setNewRedeemAmount(amt)}
                      className="py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-mono text-[10px] cursor-pointer"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Kuota Maksimal Orang Klaim:
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="10000"
                    value={newRedeemMaxClaims}
                    onChange={(e) => setNewRedeemMaxClaims(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Berapa banyak orang bisa me-redeem
                  </span>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Durasi Aktif (Menit):
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newRedeemDurationMins}
                    onChange={(e) => setNewRedeemDurationMins(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Berapa lama kodenya berfungsi
                  </span>
                </div>
              </div>

              {/* Quick Duration Buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '5 Menit', mins: 5 },
                  { label: '30 Menit', mins: 30 },
                  { label: '1 Jam', mins: 60 },
                  { label: '24 Jam', mins: 1440 },
                ].map((d) => (
                  <button
                    key={d.mins}
                    type="button"
                    onClick={() => setNewRedeemDurationMins(d.mins)}
                    className={`py-1.5 rounded-lg font-semibold text-[10px] cursor-pointer border ${
                      newRedeemDurationMins === d.mins
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    ⏱️ {d.label}
                  </button>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Wajibkan PIN Admin saat Klaim?</span>
                  <span className="text-[10px] text-slate-400">Jika aktif, nasabah butuh PIN Admin untuk klaim</span>
                </div>
                <input
                  type="checkbox"
                  checked={newRedeemRequirePin}
                  onChange={(e) => setNewRedeemRequirePin(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Terbitkan Kode Redeem Sekarang</span>
              </button>
            </form>
          </div>

          {/* Daftar Kode Redeem (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-white text-base">Daftar Kode Redeem Terdaftar ({redeemCodes.length})</h3>
                <p className="text-[11px] text-slate-400">
                  Pantau sisa kuota klaim dan masa berlaku setiap kode secara real-time.
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {redeemCodes.map((rdm) => {
                const isExpired = new Date() > new Date(rdm.expiresAt);
                const isQuotaFull = rdm.claimedBy.length >= rdm.maxClaims;
                const isFunctional = rdm.active && !isExpired && !isQuotaFull;

                return (
                  <div
                    key={rdm.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 font-mono font-black text-amber-300 text-sm tracking-wider">
                          {rdm.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(rdm.code)}
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                          title="Salin Kode"
                        >
                          {copiedCode === rdm.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <div>
                          <h4 className="font-bold text-white text-xs">{rdm.title}</h4>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            Hadiah: +{formatRupiah(rdm.rewardAmount)} / orang
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            isFunctional
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {isFunctional
                            ? '● Berfungsi / Aktif'
                            : isQuotaFull
                            ? 'Kuota Penuh'
                            : isExpired
                            ? 'Waktu Habis'
                            : 'Dinonaktifkan'}
                        </span>
                        <button
                          onClick={() => toggleRedeemCodeActive(rdm.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold cursor-pointer"
                        >
                          {rdm.active ? 'Nonaktifkan' : 'Aktifkan'}
                        </button>
                        <button
                          onClick={() => deleteRedeemCode(rdm.id)}
                          className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded-xl">
                      <div>
                        <span className="text-slate-500 block">Kuota Orang Redeem:</span>
                        <strong className="font-mono text-white">
                          {rdm.claimedBy.length} / {rdm.maxClaims} Orang
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Durasi Berfungsi:</span>
                        <strong className="font-mono text-cyan-300">{rdm.durationMinutes} Menit</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Berlaku Sampai:</span>
                        <strong className="font-mono text-amber-300">
                          {new Date(rdm.expiresAt).toLocaleString('id-ID')}
                        </strong>
                      </div>
                    </div>

                    {rdm.claimedBy.length > 0 && (
                      <div className="text-[10px] text-slate-400">
                        <span className="font-semibold text-slate-300">Sudah Diklaim Oleh: </span>
                        {rdm.claimedBy.map((c) => `${c.fullName} (${c.accountNumber})`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: TINJAUAN LUPA PIN ATM ================= */}
      {activeAdminTab === 'pinresets' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <span>Antrean Tinjauan Lupa PIN Kartu ATM</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saat nasabah menekan tombol <strong>"Lupa PIN?"</strong> di mesin ATM, permohonannya masuk ke sini. Klik <strong>Setujui & Beritahu PIN</strong> agar PIN kartu ditampilkan kepada nasabah di layar ATM.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {pendingPinResets.length} Menunggu Tinjauan
            </span>
          </div>

          {pinResetRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <p className="font-semibold text-white">Belum ada permohonan Lupa PIN dari Mesin ATM.</p>
              <p>Jika nasabah lupa PIN saat di ATM, permohonannya akan muncul di sini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pinResetRequests.map((req) => {
                const acc = accounts.find((a) => a.id === req.accountId);
                return (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{req.fullName}</span>
                        <span className="font-mono text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                          Rek: {req.accountNumber}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            req.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                              : req.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {req.status === 'pending'
                            ? '⏳ Menunggu Tinjauan'
                            : req.status === 'approved'
                            ? '✓ PIN Telah Diberitahukan'
                            : 'Ditolak'}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[11px]">
                        NIK: <strong className="text-white font-mono">{req.nik}</strong> • No. HP:{' '}
                        <strong className="text-white font-mono">{req.phone}</strong>
                      </p>
                      <p className="text-slate-300 text-[11px] italic">"{req.reason}"</p>
                      {acc && (
                        <div className="pt-1">
                          <span className="text-[11px] text-slate-400">Data PIN Kartu di Database Bank: </span>
                          <strong className="font-mono text-sm text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                            {acc.pin}
                          </strong>
                        </div>
                      )}
                    </div>

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => adminApprovePinReset(req.id)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
                        >
                          <Check className="w-4 h-4" />
                          <span>Setujui & Beritahu PIN ke Nasabah</span>
                        </button>
                        <button
                          onClick={() => adminRejectPinReset(req.id, 'Verifikasi identitas belum sesuai.')}
                          className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs cursor-pointer"
                        >
                          Tolak
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TAB 1: VERIFIKASI KARTU ================= */}
      {activeAdminTab === 'cards' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-amber-400" />
                <span>Antrean Persetujuan Kartu Nasabah</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Saat disetujui, sistem akan otomatis mengacak 10 digit nomor rekening dan mengaktifkan kartu.
              </p>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {pendingCards.length} Menunggu Persetujuan
            </span>
          </div>

          {pendingCards.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <p className="font-semibold text-white">Tidak ada antrean pendaftaran kartu baru.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCards.map((acc) => {
                const tierCfg = CARD_TIER_CONFIGS[acc.cardTier];
                return (
                  <div
                    key={acc.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{acc.fullName}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierCfg.badgeColor}`}>
                          {tierCfg.nameIndo}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400 pt-1">
                        <div>
                          <span>NIK KTP:</span> <strong className="text-white font-mono">{acc.nik}</strong>
                        </div>
                        <div>
                          <span>No. Telepon:</span> <strong className="text-white font-mono">{acc.phone}</strong>
                        </div>
                        <div>
                          <span>Setoran Awal:</span>{' '}
                          <strong className="text-emerald-400 font-mono">{formatRupiah(acc.initialDeposit)}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveCardClick(acc.id)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui Kartu</span>
                      </button>
                      <button
                        onClick={() => setRejectCardModalId(acc.id)}
                        className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TAB: PERSETUJUAN UPGRADE KARTU ================= */}
      {activeAdminTab === 'upgrades' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span>Antrean Persetujuan Upgrade Kartu Nasabah</span>
              </h3>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {pendingUpgrades.length} Menunggu Persetujuan
            </span>
          </div>

          {pendingUpgrades.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <p className="font-semibold text-white">Tidak ada antrean permohonan upgrade kartu.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUpgrades.map((upg) => {
                const currentCfg = CARD_TIER_CONFIGS[upg.currentTier] || CARD_TIER_CONFIGS.regular;
                const requestedCfg = CARD_TIER_CONFIGS[upg.requestedTier] || CARD_TIER_CONFIGS.gold;

                return (
                  <div
                    key={upg.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                  >
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{upg.applicantName}</span>
                        <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                          Rek. {upg.accountNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${currentCfg.badgeColor}`}>
                          {currentCfg.nameIndo} ➔ {requestedCfg.nameIndo}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">Alasan: {upg.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleApproveUpgradeClick(upg.id)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui Upgrade</span>
                      </button>
                      <button
                        onClick={() => setRejectUpgradeModalId(upg.id)}
                        className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TAB 2: VERIFIKASI PINJAMAN ONLINE ================= */}
      {activeAdminTab === 'loans' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <BadgeDollarSign className="w-5 h-5 text-cyan-400" />
              <span>Antrean Persetujuan Pinjaman Online</span>
            </h3>
            <span className="text-xs text-cyan-400 font-bold bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
              {pendingLoans.length} Menunggu Analisis
            </span>
          </div>

          {pendingLoans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs space-y-2">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto opacity-70" />
              <p className="font-semibold text-white">Tidak ada antrean permohonan pinjaman online.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{loan.applicantName}</span>
                      <span className="text-[10px] font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded">
                        Rek. {loan.accountNumber}
                      </span>
                    </div>
                    <div className="text-amber-300 font-mono font-bold text-sm">
                      Plafon: {formatRupiah(loan.amount)} ({loan.tenorMonths} Bulan)
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Pekerjaan: {loan.jobTitle} • Keperluan: {loan.purpose}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleApproveLoanClick(loan.id)}
                      className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Setujui & Cairkan Dana</span>
                    </button>
                    <button
                      onClick={() => setRejectLoanModalId(loan.id)}
                      className="px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Tolak
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= ADMIN TAB: BANNED KARTU NASABAH (CUSTOM / PERMANEN & ALASAN OPSIONAL) ================= */}
      {activeAdminTab === 'ban_cards' && (
        <div className="space-y-6 text-xs">
          {banFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{banFeedback}</span>
              </div>
              <button onClick={() => setBanFeedback('')} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Banned Kartu */}
            <form
              onSubmit={handleBanCardSubmit}
              className="lg:col-span-5 bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-6 shadow-xl space-y-4"
            >
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block">
                  EKSEKUSI PEMBLOKIRAN / BANNED KARTU
                </span>
                <h3 className="font-black text-white text-base flex items-center gap-2 mt-0.5">
                  <Ban className="w-5 h-5 text-rose-500" />
                  <span>Banned Kartu Nasabah</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Kartu yang di-banned akan menampilkan cap <strong>BANNED</strong> dan kotak <strong>Tinjauan Alasan</strong> di layar kartu. Jika dipilih <strong>Permanen</strong>, nasabah tidak dapat mengajukan tinjauan lagi, namun Admin tetap bisa membuka banned kapan saja di panel ini.
                </p>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  1. Pilih Kartu / Rekening Nasabah yang Akan Di-Banned:
                </label>
                <select
                  value={selectedBanAccountId}
                  onChange={(e) => setSelectedBanAccountId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-semibold focus:outline-none focus:border-rose-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} — Rek: {acc.accountNumber} ({acc.cardTier.toUpperCase()}) [{acc.cardStatus.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">
                  2. Pilih Tipe Durasi Banned (Custom atau Permanen):
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setBanDurationType('custom')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      banDurationType === 'custom'
                        ? 'bg-amber-500/20 border-2 border-amber-400 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-black text-amber-300 text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>Durasi Custom</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      Bisa diatur menit/jam/hari & masih bisa ditinjau nasabah.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBanDurationType('permanent')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      banDurationType === 'permanent'
                        ? 'bg-rose-600/25 border-2 border-rose-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <div className="font-black text-rose-400 text-xs flex items-center gap-1.5">
                      <Ban className="w-4 h-4" />
                      <span>Permanen</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      Tidak dapat ditinjau nasabah lagi (tetap bisa dibuka di Admin).
                    </p>
                  </button>
                </div>
              </div>

              {banDurationType === 'custom' ? (
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3">
                  <label className="text-amber-300 font-bold block text-[11px]">
                    Atur Lama Durasi Custom:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      required
                      value={banDurationValue}
                      onChange={(e) => setBanDurationValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-28 bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-mono font-bold text-white text-center"
                    />
                    <select
                      value={banDurationUnit}
                      onChange={(e) => setBanDurationUnit(e.target.value as 'menit' | 'jam' | 'hari')}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2.5 font-bold text-amber-300"
                    >
                      <option value="menit">Menit</option>
                      <option value="jam">Jam</option>
                      <option value="hari">Hari</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: '⏱️ 1 Menit (Uji Buka Otomatis)', val: 1, unit: 'menit' as const },
                      { label: '5 Menit', val: 5, unit: 'menit' as const },
                      { label: '15 Menit', val: 15, unit: 'menit' as const },
                      { label: '30 Menit', val: 30, unit: 'menit' as const },
                      { label: '1 Jam', val: 1, unit: 'jam' as const },
                      { label: '1 Hari', val: 1, unit: 'hari' as const },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setBanDurationValue(preset.val);
                          setBanDurationUnit(preset.unit);
                        }}
                        className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer ${
                          banDurationValue === preset.val && banDurationUnit === preset.unit
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-900 hover:bg-amber-500/20 border-slate-700 text-slate-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-[11px] leading-relaxed">
                  ⚠️ <strong>Mode Banned Permanen:</strong> Kartu ini tidak akan memiliki batas waktu berakhir dan nasabah <strong>tidak dapat mengajukan tinjauan banding lagi</strong> dari layar kartunya. Namun, Admin tetap dapat membuka blokir (Unban) kartu ini kapan saja melalui daftar di sebelah kanan.
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-bold">
                    3. Tinjauan Alasan Banned:
                  </label>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-semibold">
                    Opsional (Boleh Dikosongkan)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={banReasonInput}
                  onChange={(e) => setBanReasonInput(e.target.value)}
                  placeholder="Opsional: Ketik alasan banned kartu (atau biarkan kosong jika tidak ingin mencantumkan alasan spesifik)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-rose-400"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 text-white font-black rounded-xl cursor-pointer shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2"
              >
                <Ban className="w-4 h-4" />
                <span>
                  Eksekusi Banned Kartu ({banDurationType === 'permanent' ? 'PERMANEN' : `${banDurationValue} ${banDurationUnit.toUpperCase()}`})
                </span>
              </button>
            </form>

            {/* Daftar Kartu yang Sedang Di-Banned & Tinjauan Banding */}
            <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    <span>Daftar Kartu berstatus BANNED & Buka Blokir</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Baik kartu dengan durasi Custom maupun Permanen masih bisa dibuka banned-nya kapan saja di sini.
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold text-xs shrink-0">
                  {bannedCards.length} Kartu Di-Banned
                </span>
              </div>

              {bannedCards.length === 0 ? (
                <div className="p-10 text-center text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto opacity-80" />
                  <p className="font-bold text-white text-sm">Belum ada kartu nasabah yang di-banned.</p>
                  <p className="text-xs text-slate-500">
                    Gunakan formulir di sebelah kiri atau tabel Nasabah untuk melakukan Banned Kartu dengan durasi Custom atau Permanen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bannedCards.map((acc) => {
                    const bInfo = acc.banInfo;
                    const isPerm = bInfo?.durationType === 'permanent';
                    return (
                      <div
                        key={acc.id}
                        className="p-4 rounded-2xl bg-slate-950 border-2 border-rose-500/50 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-white text-sm">{acc.fullName}</span>
                              <span className="font-mono text-xs text-amber-300">Rek. {acc.accountNumber}</span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  isPerm
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                }`}
                              >
                                {isPerm ? '🚫 BANNED PERMANEN' : `⏳ BANNED CUSTOM (${bInfo?.durationLabel})`}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                              No. Kartu: {acc.cardNumber} • Jenis: {acc.cardTier.toUpperCase()}
                            </span>
                          </div>

                          <button
                            onClick={() => handleUnbanCardClick(acc.id)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shrink-0 shadow-lg"
                          >
                            <Unlock className="w-4 h-4" />
                            <span>Buka Banned Kartu</span>
                          </button>
                        </div>

                        {/* Tinjauan Alasan Box */}
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-rose-300 font-bold block">
                            📋 Tinjauan Alasan Banned (Dilihat di Layar Kartu Nasabah):
                          </span>
                          <p className="text-white text-xs">
                            {bInfo?.reason && bInfo.reason.trim().length > 0 ? (
                              bInfo.reason
                            ) : (
                              <span className="italic text-slate-400">
                                (Tanpa alasan spesifik — Admin mengosongkan kolom alasan opsional)
                              </span>
                            )}
                          </p>
                          {!isPerm && (bInfo?.expiresAt || bInfo?.bannedUntil) && (() => {
                            const expStr = bInfo.expiresAt || bInfo.bannedUntil;
                            const rem = formatBanRemainingTime(expStr);
                            return (
                              <div className="pt-1.5 space-y-1">
                                <p className="text-[10px] text-amber-300 font-mono">
                                  Berakhir Pada: {formatIndoDate(expStr!)}
                                </p>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-amber-200 font-mono font-black text-xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-300 animate-spin" />
                                  <span>Hitung Mundur Buka Otomatis: {rem.text}</span>
                                </div>
                              </div>
                            );
                          })()}
                          {isPerm && (
                            <p className="text-[10px] text-rose-300 font-semibold pt-1">
                              Status Tinjauan Nasabah: Ditutup Permanen (Nasabah tidak dapat mengajukan tinjauan ulang, namun Admin tetap dapat klik "Buka Banned Kartu" di atas).
                            </p>
                          )}
                        </div>

                        {/* Jika Nasabah Mengajukan Tinjauan Banding (Hanya untuk Custom Duration) */}
                        {!isPerm && bInfo?.appealStatus === 'pending' && (
                          <div className="p-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-black uppercase text-amber-300 block">
                                📩 Permohonan Tinjauan Banding dari Nasabah:
                              </span>
                              <p className="text-white text-xs mt-0.5">"{bInfo.appealNote}"</p>
                            </div>
                            <button
                              onClick={() => handleUnbanCardClick(acc.id)}
                              className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-xs cursor-pointer shrink-0"
                            >
                              Setujui Tinjauan & Buka Banned
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 3: SELURUH REKENING (MASUK CEPAT & EDIT SEMUA AKUN TANPA MASUK) ================= */}
      {activeAdminTab === 'accounts' && (
        <div className="space-y-6">
          <AdminQuickAccountControlPanel
            onNavigateToCustomerDashboard={onNavigateToCustomerDashboard}
          />

          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-white text-base">Tabel Ringkasan Seluruh Rekening &amp; Aksi Banned</h3>
                <p className="text-[11px] text-slate-400">
                  Anda juga dapat langsung melakukan Banned Kartu atau Membuka Banned Kartu dari tabel di bawah ini.
                </p>
              </div>
              <span className="text-slate-400">
                Total Dana Simpanan: <strong className="text-emerald-400 font-mono">{formatRupiah(totalCustomerFunds)}</strong> • Pinjaman: <strong className="text-cyan-400 font-mono">{formatRupiah(totalDisbursedLoans)}</strong>
              </span>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2">Nama Pemilik & Centang Biru</th>
                  <th className="pb-2">Nomor Rekening</th>
                  <th className="pb-2">PIN Kartu</th>
                  <th className="pb-2">Jenis Kartu</th>
                  <th className="pb-2">Status Kartu</th>
                  <th className="pb-2 text-right">Saldo Efektif</th>
                  <th className="pb-2 text-right">Verifikasi & Aksi Banned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{acc.fullName}</span>
                        {acc.isVerified && <VerifiedBadge size="xs" label={acc.verifiedLabel} />}
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-amber-300">{acc.accountNumber}</td>
                    <td className="py-2.5 font-mono text-emerald-400 font-bold">{acc.pin}</td>
                    <td className="py-2.5 uppercase font-semibold text-slate-300">{acc.cardTier}</td>
                    <td className="py-2.5">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          acc.cardStatus === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : acc.cardStatus === 'pending'
                            ? 'bg-amber-500/20 text-amber-300'
                            : acc.cardStatus === 'banned'
                            ? 'bg-rose-600 text-white'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {acc.cardStatus === 'banned'
                          ? `BANNED (${acc.banInfo?.durationType === 'permanent' ? 'PERMANEN' : acc.banInfo?.durationLabel || 'CUSTOM'})`
                          : acc.cardStatus}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-white">
                      {formatRupiah(acc.balance)}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => adminToggleVerifyAccount(acc.id, customVerifyLabel)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                            acc.isVerified
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                              : 'bg-slate-800 text-slate-300 hover:bg-sky-600 hover:text-white'
                          }`}
                          title={acc.isVerified ? 'Cabut Centang Biru' : 'Berikan Centang Biru'}
                        >
                          <BadgeCheck className="w-3 h-3" />
                          <span>{acc.isVerified ? 'Verified ✓' : '+ Centang Biru'}</span>
                        </button>

                        {acc.cardStatus === 'banned' ? (
                          <button
                            onClick={() => handleUnbanCardClick(acc.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            Buka Banned
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedBanAccountId(acc.id);
                              setActiveAdminTab('ban_cards');
                            }}
                            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold rounded-lg text-[10px] cursor-pointer"
                          >
                            🚫 Banned Kartu
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB 4: BRANKAS ATM & PANDUAN SOP ADMIN 100x LIPAT ================= */}
      {activeAdminTab === 'audit' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <span>Monitoring Brankas Kas Mesin ATM #JKT-042 & Ensiklopedia SOP Admin 100x Lipat</span>
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Dokumentasi komprehensif tata kelola Otoritas Admin Bank Nusantara (PIN Otoritas: 159357).
              </p>
            </div>
            <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              Unit Normal & Online
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Lembar Rp 100.000</span>
              <span className="font-mono text-lg font-bold text-white">850 Lembar</span>
              <span className="text-[10px] text-amber-300 block font-mono">Rp 85.000.000</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Lembar Rp 50.000</span>
              <span className="font-mono text-lg font-bold text-white">620 Lembar</span>
              <span className="text-[10px] text-blue-300 block font-mono">Rp 31.000.000</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Total Kas di Mesin</span>
              <span className="font-mono text-lg font-bold text-emerald-400">Rp 116.000.000</span>
              <span className="text-[10px] text-slate-400 block">Kapasitas 78%</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">Kertas Struk Thermal</span>
              <span className="font-mono text-lg font-bold text-cyan-300">84% Tersisa</span>
              <span className="text-[10px] text-slate-400 block">~420 Transaksi lagi</span>
            </div>
          </div>

          {/* 100x Detailed Admin SOP Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-amber-300 text-xs uppercase">
                SOP 1: Alur Masuk Akun Google, Pendaftaran & Login Kartu Lama
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Saat pertama kali membuka sistem, nasabah masuk menggunakan Akun Google, kemudian diarahkan untuk mendaftar kartu baru. Apabila nasabah sudah memiliki kartu baru maupun kartu lama dan ingin beralih/login kembali ke Kartu Lama, sistem mewajibkan verifikasi <strong>PIN Kartu Lama</strong> (bukan PIN Admin). Jika lupa PIN kartu lama, nasabah dapat menekan tombol <strong>"Lupa PIN?"</strong> yang akan masuk ke tab Tinjauan Lupa PIN di Panel Admin ini.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-sky-300 text-xs uppercase">
                SOP 2: Otorisasi Verifikasi Centang Biru (Verification Badge Icon)
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Melalui tab <strong>Verifikasi Centang Biru</strong>, Admin memiliki wewenang penuh untuk memberikan atau mencabut lencana resmi Centang Biru beserta label gelar khusus pada setiap kartu. Kartu yang telah diverifikasi menampilkan ikon Centang Biru di atas permukaan Kartu 3D, bilah navigasi, dan header dashboard, serta mengirimkan Notifikasi Sistem Website kepada nasabah.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-rose-300 text-xs uppercase">
                SOP 3: Mekanisme Banned Kartu, Timer Detik Real-Time & Notifikasi Website
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Ketika Admin melakukan Banned Kartu dengan durasi Custom (misalnya <strong>1 Menit</strong>), sistem menjalankan mesin penghitung mundur real-time setiap 1 detik (`1000ms`). Tepat ketika waktu mencapai `00m 00d`, status Banned otomatis terbuka menjadi Aktif dan sistem memunculkan <strong>Notifikasi Sistem Website</strong> (bukan dari Google atau HP) yang memberi tahu bahwa kartu telah terbuka dan dapat ditutup oleh nasabah.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <h4 className="font-extrabold text-emerald-300 text-xs uppercase">
                SOP 4: Kerahasiaan Kode Tukar & Persetujuan Pembeli Layanan Non-Kode
              </h4>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Seluruh pembelian menggunakan uang langsung memotong saldo rekening dan menampilkan status <em>"Sedang Diproses"</em>. Untuk pembelian berbasis voucher (Pulsa, Token Listrik, Game, Streaming), kode tukar disembunyikan rapat hingga disetujui Admin. Sedangkan untuk pembelian non-kode (seperti Air/PDAM, Tagihan, Makanan, Tiket), tidak diterbitkan kode melainkan masuk ke tahap <strong>Persetujuan Pembeli</strong> setelah disetujui Admin.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: KONTROL KERAJAAN BISNIS & BURSA SULTAN ================= */}
      {activeAdminTab === 'empire_admin' && (
        <div className="space-y-6 text-xs">
          {empireAdminFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
              <span>{empireAdminFeedback}</span>
              <button onClick={() => setEmpireAdminFeedback('')} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-cyan-950 to-indigo-950 border-2 border-cyan-400/50 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-300/40 font-black text-[10px] uppercase">
                  OTORITAS ADMIN • PUSAT MINING KRIPTO, BALAI LELANG SUPERCAR &amp; CYBER VAULT (PENGGANTI KERAJAAN)
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  💎 Pusat Kendali 12 Rig Mining Kripto, Lelang Supercar (+250%), Bursa Crypto/Saham &amp; Cyber Vault
                </h3>
                <p className="text-slate-300 mt-0.5">
                  Atur diskon harga akuisisi 12 Rig Mining &amp; Supercar, pengali hasil klaim mining &amp; lelang, bonus koin spin per klaim, hadiahkan seluruh 12 unit ke nasabah, atau pompa harga bursa crypto &amp; saham AI!
                </p>
              </div>
              <button
                onClick={() => {
                  const res = adminResetSultanEmpireConfig();
                  setEmpireAdminFeedback(res.message);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold cursor-pointer shrink-0"
              >
                Reset ke Default
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Diskon Harga Bisnis & Brankas */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2.5">
                <label className="font-black text-amber-300 uppercase block">
                  1. Diskon Harga Bisnis &amp; Brankas (0% - 99%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={sultanEmpireConfig.businessDiscountPercent}
                  onChange={(e) => {
                    const v = Math.min(99, Math.max(0, Number(e.target.value) || 0));
                    const res = adminUpdateSultanEmpireConfig({ businessDiscountPercent: v });
                    setEmpireAdminFeedback(res.message);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-black text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[0, 25, 50, 75, 90, 99].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        const res = adminUpdateSultanEmpireConfig({ businessDiscountPercent: pct });
                        setEmpireAdminFeedback(res.message);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold cursor-pointer"
                    >
                      Diskon {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Pengali Profit Dividen Panen */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2.5">
                <label className="font-black text-emerald-300 uppercase block">
                  2. Multiplier Profit Panen Rupiah (1x - 100x)
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={sultanEmpireConfig.profitMultiplier}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value) || 1);
                    const res = adminUpdateSultanEmpireConfig({ profitMultiplier: v });
                    setEmpireAdminFeedback(res.message);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-black text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 5, 10, 25, 100].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        const res = adminUpdateSultanEmpireConfig({ profitMultiplier: m });
                        setEmpireAdminFeedback(res.message);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold cursor-pointer"
                    >
                      Profit {m}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Pengali Bonus Koin Spin per Panen */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-2.5">
                <label className="font-black text-purple-300 uppercase block">
                  3. Multiplier Bonus Koin Spin (1x - 50x)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={sultanEmpireConfig.bonusCoinMultiplier}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value) || 1);
                    const res = adminUpdateSultanEmpireConfig({ bonusCoinMultiplier: v });
                    setEmpireAdminFeedback(res.message);
                  }}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-black text-sm"
                />
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 5, 10, 25].map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        const res = adminUpdateSultanEmpireConfig({ bonusCoinMultiplier: m });
                        setEmpireAdminFeedback(res.message);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold cursor-pointer"
                    >
                      Koin {m}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Hadiahkan Semua 12 Bisnis Sultan ke Nasabah */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-400/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <h4 className="font-black text-amber-300 text-sm">
                  🎁 Modalkan Seluruh 12 Aset Kerajaan Bisnis Sultan ke Akun Target
                </h4>
                <p className="text-slate-300 text-[11px]">
                  Memberikan level kepemilikan ke seluruh 12 bisnis (Minimarket hingga Maskapai
                  Jet &amp; Satelit) sekaligus secara gratis!
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={superToolAccountId}
                  onChange={(e) => setSuperToolAccountId(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-xl p-2 text-white font-bold"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={empireGiftLevels}
                  onChange={(e) => setEmpireGiftLevels(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 bg-slate-950 border border-slate-700 rounded-xl p-2 text-amber-300 font-black"
                />
                <button
                  onClick={() => {
                    const res = adminGiftAllSultanBusinessesToAccount(
                      superToolAccountId,
                      empireGiftLevels
                    );
                    setEmpireAdminFeedback(res.message);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-black cursor-pointer"
                >
                  ⚡ Hadiahkan +{empireGiftLevels} Level Semua 12 Bisnis
                </button>
              </div>
            </div>

            {/* Kontrol Harga Bursa Emas, Saham & Kripto */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-black text-emerald-300 text-sm">
                  📈 Manipulasi / Pump &amp; Dump Harga Bursa Saham, Emas 24K &amp; Kripto
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const next: Record<string, number> = {};
                      SULTAN_TRADING_ASSETS.forEach((a) => {
                        const cur = sultanEmpireConfig.marketPrices?.[a.id] || a.defaultPrice;
                        next[a.id] = Math.round(cur * 2);
                      });
                      const res = adminUpdateSultanEmpireConfig({ marketPrices: next });
                      setEmpireAdminFeedback('🚀 MARKET PUMP +100% Berhasil! ' + res.message);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer"
                  >
                    🚀 Pump Semua +100% (2x Lipat)
                  </button>
                  <button
                    onClick={() => {
                      const next: Record<string, number> = {};
                      SULTAN_TRADING_ASSETS.forEach((a) => {
                        const cur = sultanEmpireConfig.marketPrices?.[a.id] || a.defaultPrice;
                        next[a.id] = Math.max(10_000, Math.round(cur * 0.5));
                      });
                      const res = adminUpdateSultanEmpireConfig({ marketPrices: next });
                      setEmpireAdminFeedback('📉 MARKET DUMP -50% (Harga Diskon Beli)! ' + res.message);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-500 text-white font-black cursor-pointer"
                  >
                    📉 Dump Semua -50% (Murahin Harga Beli)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SULTAN_TRADING_ASSETS.map((asset) => {
                  const curPrice =
                    sultanEmpireConfig.marketPrices?.[asset.id] || asset.defaultPrice;
                  return (
                    <div
                      key={asset.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">
                          {asset.icon} {asset.name}
                        </span>
                        <span className="text-[10px] font-mono text-amber-300">{asset.symbol}</span>
                      </div>
                      <input
                        type="number"
                        value={curPrice}
                        onChange={(e) => {
                          const v = Math.max(1000, Number(e.target.value) || asset.defaultPrice);
                          adminUpdateSultanEmpireConfig({
                            marketPrices: { [asset.id]: v },
                          });
                        }}
                        className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= ADMIN TAB: PERMINTAAN MINTA TOLONG NASABAH (MINTOL ADMIN - 35 FITUR) ================= */}
      {activeAdminTab === 'mintol_admin' && (
        <div className="space-y-6 text-xs">
          {mintolFeedback && (
            <div className="p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-emerald-200 font-bold flex items-center justify-between">
              <span>{mintolFeedback}</span>
              <button onClick={() => setMintolFeedback('')} className="cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-purple-950 to-amber-950 border-2 border-amber-400/50 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-300/40 font-black text-[10px] uppercase">
                  PUSAT PERMINTAAN MINTA TOLONG NASABAH (MINTOL ADMIN) • {MINTOL_ADMIN_FEATURES_CATALOG.length} FITUR
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  🙏 Daftar Permintaan Minta Tolong ke Admin (Dari Tombol Sebelah Lapor Bug)
                </h3>
                <p className="text-slate-300 mt-0.5">
                  Setiap permintaan wajib disertai pesan penjelasan dan pilihan fitur dari 35 fitur
                  Mintol. Klik tombol <strong>"⚡ Kabulkan &amp; Eksekusi Otomatis Sekarang"</strong>{' '}
                  untuk langsung memberikan semua yang diminta nasabah dalam 1 klik!
                </p>
              </div>
              {adminHelpRequests.length > 0 && (
                <button
                  onClick={() => {
                    adminClearMintolRequests();
                    setMintolFeedback('Seluruh daftar permintaan Mintol berhasil dibersihkan.');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold cursor-pointer shrink-0"
                >
                  Bersihkan Semua ({adminHelpRequests.length})
                </button>
              )}
            </div>

            {adminHelpRequests.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/80 border border-slate-800 text-center text-slate-400">
                Belum ada permintaan Minta Tolong dari nasabah. Nasabah dapat mengirim Mintol dari
                tombol <strong>"🙏 Minta Tolong ke Admin"</strong> di paling bawah sebelah tombol
                Lapor Bug.
              </div>
            ) : (
              <div className="space-y-4">
                {adminHelpRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-5 rounded-2xl bg-slate-900/95 border border-slate-700 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            req.status === 'granted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : req.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                          }`}
                        >
                          {req.status === 'granted'
                            ? '✅ DIKABULKAN & DIEKSEKUSI'
                            : req.status === 'rejected'
                            ? '❌ DITOLAK'
                            : '⏳ MENUNGGU ACC ADMIN'}
                        </span>
                        <span className="font-black text-white text-sm">{req.senderName}</span>
                        <span className="font-mono text-amber-300">
                          (Rek: {req.senderAccountNumber})
                        </span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold uppercase text-[10px]">
                          Urgensi: {req.urgency}
                        </span>
                      </div>
                      <span className="text-slate-400">
                        {new Date(req.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Pesan Wajib dari Nasabah */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-400/30">
                      <span className="text-[10px] font-bold text-amber-300 uppercase block mb-1">
                        Pesan Wajib Nasabah:
                      </span>
                      <p className="text-white font-bold text-sm whitespace-pre-wrap">
                        "{req.message}"
                      </p>
                    </div>

                    {/* Daftar Fitur yang Dimintol */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Fitur yang Diminta ({req.featureLabels.length} Fitur):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {req.featureLabels.map((lbl, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-bold text-[11px]"
                          >
                            {lbl}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Parameter Tambahan */}
                    <div className="flex flex-wrap gap-3 text-[11px] text-slate-300">
                      {req.requestedAmount ? (
                        <span>
                          Nominal Diminta:{' '}
                          <strong className="text-emerald-300">
                            {formatRupiah(req.requestedAmount)}
                          </strong>
                        </span>
                      ) : null}
                      {req.requestedCoins ? (
                        <span>
                          Koin Spin Diminta:{' '}
                          <strong className="text-amber-300">
                            {req.requestedCoins.toLocaleString('id-ID')} 🪙
                          </strong>
                        </span>
                      ) : null}
                      {req.requestedLevel ? (
                        <span>
                          Target Level Kerja:{' '}
                          <strong className="text-purple-300">Lv.{req.requestedLevel}</strong>
                        </span>
                      ) : null}
                    </div>

                    {/* Input Catatan Balasan Admin & Tombol Eksekusi */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={mintolReplyMap[req.id] || ''}
                        onChange={(e) =>
                          setMintolReplyMap((prev) => ({ ...prev, [req.id]: e.target.value }))
                        }
                        placeholder="Catatan balasan Admin (opsional)..."
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                      />
                      <button
                        onClick={() => {
                          const res = adminGrantAndExecuteMintolRequest(
                            req.id,
                            mintolReplyMap[req.id]
                          );
                          setMintolFeedback(res.message);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-amber-400 hover:from-emerald-300 hover:to-amber-300 text-slate-950 font-black cursor-pointer"
                      >
                        ⚡ Kabulkan &amp; Eksekusi Otomatis Sekarang
                      </button>
                      <button
                        onClick={() => {
                          const res = adminRejectMintolRequest(req.id, mintolReplyMap[req.id]);
                          setMintolFeedback(res.message);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold cursor-pointer"
                      >
                        Tolak
                      </button>
                      <button
                        onClick={() => adminDeleteMintolRequest(req.id)}
                        className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECTION MODALS */}
      {rejectCardModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-rose-400">Tolak Permohonan Kartu</h3>
            <textarea
              rows={3}
              value={rejectionCardReason}
              onChange={(e) => setRejectionCardReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3"
            />
            <div className="flex gap-2">
              <button onClick={handleRejectCardClick} className="flex-1 py-2.5 bg-rose-600 font-bold rounded-xl cursor-pointer">
                Kirim Penolakan
              </button>
              <button onClick={() => setRejectCardModalId(null)} className="px-4 py-2.5 bg-slate-800 rounded-xl cursor-pointer">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectLoanModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-rose-400">Tolak Pengajuan Pinjaman</h3>
            <textarea
              rows={3}
              value={rejectionLoanReason}
              onChange={(e) => setRejectionLoanReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3"
            />
            <div className="flex gap-2">
              <button onClick={handleRejectLoanClick} className="flex-1 py-2.5 bg-rose-600 font-bold rounded-xl cursor-pointer">
                Tolak Kredit
              </button>
              <button onClick={() => setRejectLoanModalId(null)} className="px-4 py-2.5 bg-slate-800 rounded-xl cursor-pointer">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectUpgradeModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-rose-400">Tolak Permohonan Upgrade Kartu</h3>
            <textarea
              rows={3}
              value={rejectionUpgradeReason}
              onChange={(e) => setRejectionUpgradeReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3"
            />
            <div className="flex gap-2">
              <button onClick={handleRejectUpgradeClick} className="flex-1 py-2.5 bg-rose-600 font-bold rounded-xl cursor-pointer">
                Kirim Penolakan Upgrade
              </button>
              <button onClick={() => setRejectUpgradeModalId(null)} className="px-4 py-2.5 bg-slate-800 rounded-xl cursor-pointer">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectFinanceModalId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-rose-400">Tolak Transaksi & Refund Saldo Nasabah</h3>
            <p className="text-slate-400 text-[11px]">
              Menolak transaksi ini akan mengembalikan (refund 100%) saldo yang telah terpotong ke rekening nasabah.
            </p>
            <textarea
              rows={3}
              value={rejectionFinanceReason}
              onChange={(e) => setRejectionFinanceReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  adminRejectFinancialTransaction(rejectFinanceModalId, rejectionFinanceReason);
                  setRejectFinanceModalId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 font-bold rounded-xl cursor-pointer"
              >
                Tolak & Refund Saldo
              </button>
              <button onClick={() => setRejectFinanceModalId(null)} className="px-4 py-2.5 bg-slate-800 rounded-xl cursor-pointer">
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 100x Detailed Feature Explanation Modal inside Admin Panel */}
      {adminDetailFeature && (() => {
        const exp = getFeatureUltraDetailedExplanation(adminDetailFeature);
        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-slate-900 border-2 border-indigo-500/60 text-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 text-xs my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 sticky top-0 bg-slate-900 z-10">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    ENSIKLOPEDIA ADMIN 100x LIPAT • {adminDetailFeature.category}
                  </span>
                  <h3 className="font-black text-base sm:text-lg text-white mt-1">
                    {adminDetailFeature.title} (ID: {adminDetailFeature.id})
                  </h3>
                </div>
                <button
                  onClick={() => setAdminDetailFeature(null)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h4 className="font-extrabold text-amber-300 uppercase">1. Ringkasan Eksekutif & Definisi 100x Detail</h4>
                <p className="text-slate-200 leading-relaxed">{exp.executiveSummary}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-cyan-300 uppercase">2. Standar Operasional Prosedur (SOP) 6 Tahap</h4>
                {exp.stepByStepSop.map((s, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                    {s}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-1">
                  <h4 className="font-extrabold text-indigo-300 uppercase">3. Arsitektur Core-Banking</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{exp.technicalArchitecture}</p>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-1">
                  <h4 className="font-extrabold text-emerald-300 uppercase">4. Keamanan & Otorisasi Admin</h4>
                  <p className="text-slate-300 leading-relaxed text-[11px]">{exp.securityAndCompliance}</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/40 space-y-1">
                <h4 className="font-extrabold text-amber-300 uppercase">5. Simulasi Perhitungan Saldo & Limit</h4>
                <p className="text-slate-200 font-mono">{exp.financialSimulation}</p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <h4 className="font-extrabold text-purple-300 uppercase">6. FAQ Nasabah & Admin</h4>
                {exp.faqList.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-amber-300 block">Q: {f.q}</strong>
                    <span className="text-slate-300 text-[11px]">A: {f.a}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setAdminDetailFeature(null)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Tutup Dokumentasi 100x Lipat
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
