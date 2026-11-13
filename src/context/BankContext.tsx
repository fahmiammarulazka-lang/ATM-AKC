/**
 * Bank Nusantara Core Context & State Manager
 * Includes:
 * - Instant Transfer (tanpa persetujuan admin secara default)
 * - Immediate Balance Deduction on Purchases + Mandatory Admin Review Notification
 * - Admin Feature Security Configurator (65+ Fitur: Bebas atur PIN Admin & Persetujuan Admin)
 * - Redeem Code System (Dibuat di Panel Admin dengan kuota maksimal & batas waktu aktif)
 * - Tukar Kode Pulsa & Tukar Kode Token Listrik yang sudah dibeli
 * - Lupa PIN ATM -> Tinjauan Admin -> Admin memberitahu PIN
 */
import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import {
  BankAccount,
  Transaction,
  LoanApplication,
  ScheduledPayment,
  FavoriteAccount,
  AppNotification,
  ChatMessage,
  CardTier,
  CardStatus,
  LoanType,
  CardUpgradeApplication,
  PocketSaving,
  DepositoRecord,
  CardlessToken,
  TransactionType,
  PinResetRequest,
  FeatureSecurityConfig,
  RedeemCode,
  PurchasedVoucherCode,
  ResiTrackingRecord,
  GoogleUserSession,
  WebsiteSystemPopupNotification,
  GlobalChatMessage,
  MobilePushBannerToast,
  BugReportRecord,
  AppUpdateRecord,
  SpinWheelAdminConfig,
  SpinHistoryRecord,
  SpinPrizeSegment,
  AdminHelpRequestRecord,
  SultanEmpireAdminConfig,
  UserAppSettings,
} from '../types/bank';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_SCHEDULED_PAYMENTS,
  INITIAL_FAVORITES,
  INITIAL_NOTIFICATIONS,
  INITIAL_CHATS,
  INITIAL_UPGRADES,
  INITIAL_POCKETS,
  INITIAL_DEPOSITOS,
  INITIAL_CARDLESS,
} from '../data/initialData';
import {
  INITIAL_FEATURE_CONFIGS,
  INITIAL_REDEEM_CODES,
  INITIAL_PURCHASED_CODES,
  INITIAL_RESI_LIST,
  INITIAL_APP_UPDATES,
  JOB_VACANCIES_CATALOG,
} from '../data/featuresCatalog';
import {
  INITIAL_SPIN_WHEEL_CONFIG,
  SPIN_WHEEL_PRIZES,
  COIN_PURCHASE_PACKAGES_100,
  calculateCoinPackagePrice,
  calculateSpinCost,
  formatRupiahWithDecimals,
} from '../data/spinWheelCatalog';
import {
  INITIAL_SULTAN_EMPIRE_CONFIG,
  SULTAN_BUSINESS_CATALOG,
  SULTAN_TRADING_ASSETS,
  SULTAN_MYSTERY_VAULTS,
  MINTOL_ADMIN_FEATURES_CATALOG,
} from '../data/empireAndMintolCatalog';
import {
  generateRandomAccountNumber,
  generateRandomCardNumber,
  generateRandomCVV,
  generateExpiryDate,
  CARD_TIER_CONFIGS,
  LOAN_TIER_CONFIGS,
  playAtmSound,
  UNLIMITED_BALANCE,
  isUnlimitedNumber,
  formatRupiah,
} from '../utils/bankUtils';

interface RegisterCardInput {
  fullName: string;
  nik: string;
  phone: string;
  email: string;
  address: string;
  pin: string;
  cardTier?: CardTier;
  initialDeposit: number;
}

interface TransferInput {
  recipientAccount: string;
  recipientBank: string;
  amount: number;
  note?: string;
  pin: string;
}

interface ApplyLoanInput {
  loanType: LoanType;
  amount: number;
  tenorMonths: number;
  monthlyIncome: number;
  jobTitle: string;
  purpose: string;
}

interface SendChatInput {
  recipientAccount: string;
  recipientName: string;
  text: string;
  transferAttachment?: {
    amount: number;
    referenceNo: string;
    note?: string;
    isRequest?: boolean;
    status?: 'pending' | 'paid';
  };
}

export interface PayBillResult {
  success: boolean;
  message: string;
  tokenNumber?: string;
  voucherCode?: string;
  requiresApproval?: boolean;
  requiresBuyerApproval?: boolean;
  hasPendingCode?: boolean;
  pendingCodeType?: 'token_listrik' | 'pulsa' | 'voucher_lain';
  previousBalance?: number;
  newBalance?: number;
  amountDeducted?: number;
  transaction?: Transaction;
}

interface BankContextType {
  // Accounts & Active user
  accounts: BankAccount[];
  currentAccount: BankAccount | null;
  setCurrentAccountId: (id: string) => void;
  userRole: 'customer' | 'admin';
  setUserRole: (role: 'customer' | 'admin') => void;

  // Google Login & Initial Registration Onboarding Flow
  googleUser: GoogleUserSession | null;
  loginWithGoogle: (email: string, name: string, picture?: string) => void;
  completeGoogleOnboarding: () => void;
  reopenGoogleOnboarding: () => void;
  logoutGoogle: () => void;

  // Website System Popup Notifications (Notifikasi Sistem Website saat Kartu Terbuka dari Banned / Broadcast Admin / Pesan dari Admin, Bisa Ditutup)
  websitePopups: WebsiteSystemPopupNotification[];
  activeWebsitePopups: WebsiteSystemPopupNotification[];
  dismissWebsitePopup: (id: string) => void;
  dismissAllWebsitePopups: () => void;

  // Global Chat ("Pesan dari Admin" tampil di Semua HP secara Real-Time — HANYA Admin lewat Panel Admin)
  globalChats: GlobalChatMessage[];
  sendGlobalChatMessage: (input: {
    text: string;
    asAdmin?: boolean;
    senderName?: string;
    showPopupOnAllPhones?: boolean;
  }) => Promise<{ success: boolean; message: string }>;
  deleteGlobalChatMessage: (id: string) => Promise<void>;
  clearGlobalChatMessages: () => Promise<void>;
  isGlobalChatModalOpen: boolean;
  setIsGlobalChatModalOpen: (open: boolean) => void;
  connectedDevicesCount: number;

  // Lapor Bug (Di paling bawah aplikasi, wajib penjelasan & opsional foto bebas, tampil di Panel Admin)
  bugReports: BugReportRecord[];
  isBugReportModalOpen: boolean;
  setIsBugReportModalOpen: (open: boolean) => void;
  submitBugReport: (input: {
    explanation: string;
    category?: string;
    photoDataUrl?: string;
    photoFileName?: string;
  }) => Promise<{ success: boolean; message: string; bugReport?: BugReportRecord }>;
  adminUpdateBugReport: (
    id: string,
    status: 'baru' | 'diproses' | 'selesai',
    adminReply?: string
  ) => Promise<{ success: boolean; message: string }>;
  adminDeleteBugReport: (id: string) => Promise<void>;
  adminClearBugReports: () => Promise<void>;

  // Legacy Notification State (Dinonaktifkan sesuai permintaan user)
  notificationsEnabled: boolean;
  notificationPermissionStatus: 'default' | 'granted' | 'denied';
  requestAndEnableNotifications: () => Promise<{ success: boolean; message: string }>;
  sendTestNotificationNow: () => void;
  activePushBanners: MobilePushBannerToast[];
  dismissPushBanner: (id: string) => void;

  // Admin PIN Gate (Strictly 159357)
  adminUnlocked: boolean;
  setAdminUnlocked: (unlocked: boolean) => void;

  // Admin Feature Configurator (Semua fitur bisa dikasih PIN Admin atau tidak & Persetujuan Admin bebas di Panel Admin + Fitur Dihapus)
  featureConfigs: FeatureSecurityConfig[];
  deletedFeatureIds: string[];
  deletedFeaturesList: FeatureSecurityConfig[];
  deleteFeatureById: (featureId: string) => { success: boolean; message: string };
  deleteMultipleFeatures: (featureIds: string[]) => { success: boolean; message: string; count: number };
  restoreDeletedFeature: (featureId: string) => { success: boolean; message: string };
  restoreAllDeletedFeatures: () => { success: boolean; message: string; count: number };
  getFeatureConfig: (featureId: string) => FeatureSecurityConfig | undefined;
  toggleFeatureAdminPin: (featureId: string) => void;
  toggleFeatureAdminApproval: (featureId: string) => void;
  setAllFeaturesAdminPin: (enabled: boolean) => void;
  setAllFeaturesAdminApproval: (enabled: boolean) => void;

  // Pusat Pengaturan Super Lengkap (60+ Opsi Pengaturan)
  userSettings: UserAppSettings;
  updateUserSettings: (partial: Partial<UserAppSettings>) => { success: boolean; message: string };
  resetUserSettings: () => { success: boolean; message: string };
  updateCustomerProfileIdentity: (input: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    nik?: string;
  }) => { success: boolean; message: string };

  // Redeem Codes (Tukar Kode Redeem dibuat di Panel Admin dengan kuota & durasi)
  redeemCodes: RedeemCode[];
  createRedeemCode: (input: {
    code: string;
    title: string;
    rewardAmount: number;
    maxClaims: number;
    durationMinutes: number;
    requireAdminPin?: boolean;
  }) => { success: boolean; message: string; redeemCode?: RedeemCode };
  deleteRedeemCode: (id: string) => void;
  toggleRedeemCodeActive: (id: string) => void;
  claimRedeemCode: (code: string) => {
    success: boolean;
    message: string;
    rewardAmount?: number;
    newBalance?: number;
  };

  // Purchased Voucher Codes (Tukar Pulsa & Tukar Token Listrik pakai kode yang sudah dibeli)
  purchasedCodes: PurchasedVoucherCode[];
  currentAccountPurchasedCodes: PurchasedVoucherCode[];
  redeemPurchasedCode: (
    codeInput: string,
    targetPhoneOrMeter?: string
  ) => {
    success: boolean;
    message: string;
    voucher?: PurchasedVoucherCode;
  };

  // Resi Pengiriman (Masukkan & Lacak Resi + Bayar COD)
  resiList: ResiTrackingRecord[];
  addResiRecord: (input: {
    resiNumber: string;
    courier: string;
    sender: string;
    recipient: string;
    origin: string;
    destination: string;
    shippingFee: number;
    codAmount?: number;
  }) => { success: boolean; message: string; resi?: ResiTrackingRecord };
  payResiCod: (resiId: string) => PayBillResult;

  // Card Upgrade Applications
  cardUpgrades: CardUpgradeApplication[];
  applyCardUpgrade: (input: { requestedTier: CardTier; monthlyIncome: number; reason: string }) => { success: boolean; message: string };
  adminApproveUpgrade: (upgradeId: string) => { success: boolean; message: string };
  adminRejectUpgrade: (upgradeId: string, reason: string) => { success: boolean; message: string };

  // Lupa PIN Kartu (Permohonan Tinjauan Admin -> Admin kasih tahu PIN-nya)
  pinResetRequests: PinResetRequest[];
  requestPinReset: (accountId: string, reason?: string) => { success: boolean; message: string; requestId?: string };
  adminApprovePinReset: (requestId: string) => { success: boolean; message: string; pin?: string };
  adminRejectPinReset: (requestId: string, reason: string) => { success: boolean; message: string };

  // Transactions & History
  transactions: Transaction[];
  currentAccountTransactions: Transaction[];

  // Chats (Perpesanan antar nomor)
  chats: ChatMessage[];
  sendChatMessage: (input: SendChatInput) => void;

  // Pockets (Celengan Impian)
  pockets: PocketSaving[];
  currentAccountPockets: PocketSaving[];
  addPocket: (data: Omit<PocketSaving, 'id' | 'accountId' | 'currentAmount'>) => void;
  depositToPocket: (pocketId: string, amount: number) => { success: boolean; message: string };
  withdrawFromPocket: (pocketId: string, amount: number) => { success: boolean; message: string };

  // Deposito Berjangka Online
  depositos: DepositoRecord[];
  currentAccountDepositos: DepositoRecord[];
  openDeposito: (principalAmount: number, tenorMonths: number) => { success: boolean; message: string };

  // Tarik Tunai Tanpa Kartu (Cardless Cash)
  cardlessTokens: CardlessToken[];
  currentAccountCardlessTokens: CardlessToken[];
  createCardlessToken: (amount: number, pin: string) => {
    success: boolean;
    message: string;
    token?: CardlessToken;
    requiresApproval?: boolean;
  };

  // 60+ Bill & Payment Operations (PLN, Pulsa, BPJS, PDAM, E-Wallet, QRIS, dll.)
  payBill: (
    type: TransactionType,
    title: string,
    amount: number,
    customerId: string,
    category?: any,
    featureId?: string
  ) => PayBillResult;

  // Card Controls & Settings
  updateCardSpendingLimit: (newLimit: number) => void;
  toggleInternationalUsage: () => void;

  // Loans
  loans: LoanApplication[];
  currentAccountLoans: LoanApplication[];

  // Scheduled & Favorites
  scheduledPayments: ScheduledPayment[];
  currentAccountScheduled: ScheduledPayment[];
  favorites: FavoriteAccount[];

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'alert') => void;

  // Receipts for ATM reprint
  reprintReceipts: Transaction[];

  // Account operations with Card PIN or Admin Code requirement
  registerCard: (data: RegisterCardInput) => { success: boolean; message: string; accountId?: string };
  toggleCardFreezeWithPin: (accountId: string, pin: string) => { success: boolean; message: string; newStatus?: string };
  regenerateAccountNumberWithPin: (accountId: string, pin: string) => { success: boolean; message: string; newAccountNumber?: string };
  changePin: (accountId: string, oldPin: string, newPin: string) => { success: boolean; message: string };
  updatePhone: (accountId: string, newPhone: string) => { success: boolean; message: string };

  // Switch / Login to Old Card using that Old Card's 6-Digit PIN (Bukan PIN Admin!)
  loginToCardWithPin: (targetAccountId: string, cardPin: string) => {
    success: boolean;
    message: string;
  };

  // Switch Card / Change Card Tier with Admin Code (159357) without creating a new card
  switchCardWithAdminCode: (input: {
    adminCode: string;
    targetAccountId?: string;
    targetCardTier?: CardTier;
    regenerateCardDigits?: boolean;
  }) => { success: boolean; message: string };

  // Card Ban & Unban Operations (Panel Admin)
  adminBanCard: (input: {
    accountId: string;
    reason?: string; // Opsional di Panel Admin
    durationType: 'custom' | 'permanent';
    durationMinutes?: number;
    durationLabel?: string;
  }) => { success: boolean; message: string };
  adminUnbanCard: (accountId: string) => { success: boolean; message: string };
  adminUnbanAllCards: () => { success: boolean; message: string; count: number };
  submitCardBanAppeal: (accountId: string, appealNote?: string) => { success: boolean; message: string };

  // Admin Blue Checkmark Verification Badge (Centang Biru di Panel Admin)
  adminToggleVerifyAccount: (
    accountId: string,
    customLabel?: string
  ) => { success: boolean; message: string; isVerified: boolean };
  adminVerifyAllAccounts: (verified: boolean) => { success: boolean; message: string };

  // Extra Admin Power Controls (Suntik Saldo, Ubah Kartu/PIN, Broadcast Sistem Website, Update Resi, Bulk Approve)
  adminAdjustAccountBalance: (
    accountIdOrObj:
      | string
      | {
          accountId: string;
          mode: 'add' | 'subtract' | 'set' | 'unlimited';
          amount: number;
          note?: string;
        },
    mode?: 'add' | 'subtract' | 'set' | 'unlimited',
    amount?: number,
    note?: string
  ) => { success: boolean; message: string };
  adminDirectChangeAccountTier: (accountId: string, newTier: CardTier) => { success: boolean; message: string };
  adminDirectChangeAccountPin: (accountId: string, newPin: string) => { success: boolean; message: string };
  adminSendWebsiteBroadcast: (
    titleOrObj: string | { title: string; message: string; targetAccountId?: string },
    message?: string,
    targetAccountId?: string
  ) => { success: boolean; message: string };
  adminUpdateResiStatus: (
    resiId: string,
    newStatus: ResiTrackingRecord['status'],
    locationNote?: string
  ) => { success: boolean; message: string };
  adminApproveAllPendingCards: () => { success: boolean; message: string; count: number };
  adminApproveAllPendingUpgrades: () => { success: boolean; message: string; count: number };
  adminApproveAllPendingLoans: () => { success: boolean; message: string; count: number };
  adminApproveAllCards: () => { success: boolean; message: string; count: number };
  adminApproveAllUpgrades: () => { success: boolean; message: string; count: number };
  adminApproveAllLoans: () => { success: boolean; message: string; count: number };

  // 20+ Additional Super Tools in Admin Panel
  adminMassBalanceRain: (amount: number, note?: string) => { success: boolean; message: string };
  adminSetCustomAccountNumber: (accountId: string, newAccountNumber: string) => { success: boolean; message: string };
  adminSetCustomCardDetails: (
    accountId: string,
    newCardNumber: string,
    newCvv: string,
    newExpiry: string
  ) => { success: boolean; message: string };
  adminAdjustRewardPoints: (
    accountId: string,
    points: number,
    mode: 'add' | 'set' | 'unlimited'
  ) => { success: boolean; message: string };
  adminInjectPulsaAndPln: (
    accountId: string,
    pulsaAmount: number,
    kwhAmount: number
  ) => { success: boolean; message: string };
  adminForceTransferBetweenAccounts: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    note?: string
  ) => { success: boolean; message: string };
  adminCreateInstantActiveAccount: (input: {
    fullName: string;
    accountNumber?: string;
    pin: string;
    balance: number;
    cardTier: CardTier;
    isVerified?: boolean;
  }) => { success: boolean; message: string };
  adminCloneAccount: (accountId: string) => { success: boolean; message: string };
  adminMassFreezeOrUnfreezeAll: (freeze: boolean) => { success: boolean; message: string };
  adminResetDailyWithdrawalQuota: (accountId?: string) => { success: boolean; message: string };
  adminSetSpendingLimitAndIntl: (
    accountId: string,
    limit: number,
    allowInternational: boolean
  ) => { success: boolean; message: string };
  adminForgiveOrPayoffLoans: (accountId?: string) => { success: boolean; message: string };
  adminBoostDepositosAndPockets: (bonusPercent: number) => { success: boolean; message: string };
  adminGenerateInstantVoucher: (input: {
    accountId: string;
    type: 'pulsa' | 'token_listrik' | 'voucher_lain';
    nominal: number;
    targetId: string;
  }) => { success: boolean; message: string; code?: string };
  adminGenerateBulkRedeemCodes: (
    count: number,
    rewardAmount: number,
    maxClaims: number,
    durationMinutes: number
  ) => { success: boolean; message: string };
  adminClearTransactionHistory: (accountId?: string) => { success: boolean; message: string };
  adminCreateCustomTransaction: (input: {
    accountId: string;
    title: string;
    amount: number;
    type: TransactionType;
    description?: string;
  }) => { success: boolean; message: string };
  adminUpdateAccountIdentity: (
    accountId: string,
    input: {
      fullName: string;
      nik: string;
      phone: string;
      email: string;
      address: string;
    }
  ) => { success: boolean; message: string };
  adminMultiplyAccountBalance: (accountId: string, multiplier: number) => { success: boolean; message: string };
  adminSetAllAccountsTier: (tier: CardTier) => { success: boolean; message: string };
  adminDeleteAccount: (accountId: string) => { success: boolean; message: string };
  adminQuickLoginToAccount: (accountId: string) => { success: boolean; message: string };
  adminQuickToggleFreezeAccount: (accountId: string) => { success: boolean; message: string };
  adminQuickFullEditAccount: (
    accountId: string,
    updates: Partial<BankAccount>
  ) => { success: boolean; message: string };

  // App Update History (Riwayat Update: Update Sekarang & Update Sebelumnya)
  appUpdates: AppUpdateRecord[];
  adminAddAppUpdate: (input: {
    version: string;
    title: string;
    fullDate?: string;
    dateText?: string;
    description: string;
    highlights?: string[];
    changes?: string[];
    isCurrent: boolean;
    categoryBadge?: string;
    author?: string;
  }) => { success: boolean; message: string };
  adminEditAppUpdate: (
    id: string,
    input: Partial<AppUpdateRecord>
  ) => { success: boolean; message: string };
  adminSetCurrentAppUpdate: (id: string) => { success: boolean; message: string };
  adminDeleteAppUpdate: (id: string) => { success: boolean; message: string };
  adminResetAppUpdates: () => { success: boolean; message: string };
  adminAddCustomFeature: (input: {
    title: string;
    category: string;
    description: string;
    defaultAmount: number;
    requireAdminPin: boolean;
    requireAdminApproval: boolean;
  }) => { success: boolean; message: string };

  // Lowongan Pekerjaan, Sistem Level & Arena Suit Lawan Komputer Medium
  workJobClick: (
    jobId: string,
    salary: number,
    targetClicks: number,
    requiredLevel: number,
    jobTitle: string
  ) => {
    success: boolean;
    completed: boolean;
    currentClicks: number;
    targetClicks: number;
    paidAmount?: number;
    message: string;
  };
  upgradeJobLevelWithCash: () => { success: boolean; newLevel?: number; message: string };
  useJobLevelVoucher: (count?: number) => { success: boolean; newLevel?: number; message: string };
  playSuitForLevelVoucher: (
    playerChoice: 'batu' | 'gunting' | 'kertas'
  ) => {
    success: boolean;
    outcome?: 'win' | 'draw' | 'lose';
    playerChoice: 'batu' | 'gunting' | 'kertas';
    computerChoice?: 'batu' | 'gunting' | 'kertas';
    rewardCash?: number;
    rewardVoucher?: number;
    message: string;
  };

  // 30+ Additional Super Tools Admin Ga Kaleng-Kaleng (Total 56 Super Tools)
  atmVaultBalance: number;
  adminSetAccountJobLevel: (
    accountId: string,
    level: number,
    mode: 'add' | 'set' | 'max'
  ) => { success: boolean; message: string };
  adminAdjustLevelVouchers: (
    accountId: string,
    count: number,
    mode: 'add' | 'set'
  ) => { success: boolean; message: string };
  adminInstantCompleteJobSalary: (
    accountId: string,
    jobId: string
  ) => { success: boolean; message: string };
  adminSetClickPower: (accountId: string, power: number) => { success: boolean; message: string };
  adminSetSalaryMultiplier: (
    accountId: string,
    multiplier: number
  ) => { success: boolean; message: string };
  adminMassLevelVoucherRain: (vouchers: number) => { success: boolean; message: string };
  adminMassUpgradeAllJobLevels: (levelsToAdd: number) => { success: boolean; message: string };
  adminRefillAtmVaultCash: (amount: number) => { success: boolean; message: string };
  adminApplyMassTaxOrAdminFee: (
    value: number,
    mode: 'percent' | 'fixed',
    reason: string
  ) => { success: boolean; message: string };
  adminDistributeBankDividend: (percentBonus: number) => { success: boolean; message: string };
  adminSetAccountCashbackPercent: (
    accountId: string,
    percent: number
  ) => { success: boolean; message: string };
  adminToggleVipShield: (
    accountId: string,
    active: boolean
  ) => { success: boolean; message: string };
  adminRollbackLastTransaction: (accountId: string) => { success: boolean; message: string };
  adminMergeTwoAccounts: (
    sourceAccountId: string,
    targetAccountId: string
  ) => { success: boolean; message: string };
  adminConvertPointsToCash: (
    accountId: string,
    ratePerPoint: number
  ) => { success: boolean; message: string };
  adminConvertPulsaPlnToCash: (accountId: string) => { success: boolean; message: string };
  adminCreateSpecialDeposito: (
    accountId: string,
    principal: number,
    tenorMonths: number,
    bonusRatePercent: number
  ) => { success: boolean; message: string };
  adminForceLiquidateAllDepositos: (
    accountId: string,
    bonusPercent: number
  ) => { success: boolean; message: string };
  adminCreateFundedPocket: (
    accountId: string,
    title: string,
    amount: number
  ) => { success: boolean; message: string };
  adminFreeClearAllCodResi: () => { success: boolean; message: string };
  adminCreateCustomResiForAccount: (
    accountId: string,
    courier: string,
    itemDesc: string,
    codAmount: number
  ) => { success: boolean; message: string };
  adminExecuteAllScheduledPaymentsNow: () => { success: boolean; message: string };
  adminMasterApproveEverything: () => { success: boolean; message: string };
  adminResetCareerStats: (accountId: string) => { success: boolean; message: string };
  adminDuplicateCustomerVouchers: (accountId: string) => { success: boolean; message: string };
  adminExtendAllRedeemCodes: (extraMinutes: number) => { success: boolean; message: string };
  adminBoostAllRedeemQuotas: (extraClaims: number) => { success: boolean; message: string };
  adminSendThrSultanPackage: (
    accountId: string,
    cashAmount: number,
    vouchers: number,
    points: number
  ) => { success: boolean; message: string };
  adminRunForensicAutoHeal: () => { success: boolean; message: string };
  adminExportMasterBankJson: () => { success: boolean; message: string; json?: string };

  // Spin the Wheel & Pembelian 100 Paket Koin (1 Koin s/d 1.000.000 Koin) + Pengaturan Diskon/Probabilitas Admin
  spinWheelConfig: SpinWheelAdminConfig;
  spinHistory: SpinHistoryRecord[];
  buySpinCoins: (packageId: number) => {
    success: boolean;
    message: string;
    coinsAdded?: number;
    paidAmount?: number;
    newCoinBalance?: number;
  };
  spinTheWheel: (spinCount: 1 | 3 | 5 | 7 | 10) => {
    success: boolean;
    message: string;
    coinsSpent?: number;
    results?: { segment: SpinPrizeSegment; index: number }[];
    totalWonAmount?: number;
    newCoinBalance?: number;
    newAccountBalance?: number;
  };
  adminUpdateSpinWheelConfig: (
    partial: Partial<SpinWheelAdminConfig>
  ) => { success: boolean; message: string };
  adminResetSpinWheelConfig: () => { success: boolean; message: string };
  adminAdjustAccountSpinCoins: (
    accountId: string,
    coins: number,
    mode: 'add' | 'set'
  ) => { success: boolean; message: string };
  adminMassSpinCoinRain: (coins: number) => { success: boolean; message: string };

  // Mining Kripto, Lelang Supercar & Cyber Vault (Sebelah Spin the Wheel - Pengganti Kerajaan) + Kontrol Admin
  sultanEmpireConfig: SultanEmpireAdminConfig;
  buySultanBusiness: (businessId: string, quantity?: number) => {
    success: boolean;
    message: string;
    newLevel?: number;
  };
  sellSultanBusinessAuction: (businessId: string, quantity?: number) => {
    success: boolean;
    message: string;
    cashReceived?: number;
    remainingLevel?: number;
  };
  claimAllSultanBusinessProfits: () => {
    success: boolean;
    message: string;
    cashClaimed?: number;
    coinsClaimed?: number;
  };
  tradeSultanAsset: (
    assetId: string,
    action: 'buy' | 'sell',
    units: number
  ) => {
    success: boolean;
    message: string;
  };
  openSultanMysteryVault: (vaultId: string) => {
    success: boolean;
    message: string;
    cashWon?: number;
    coinsWon?: number;
    vouchersWon?: number;
  };
  adminUpdateSultanEmpireConfig: (
    partial: Partial<SultanEmpireAdminConfig>
  ) => { success: boolean; message: string };
  adminResetSultanEmpireConfig: () => { success: boolean; message: string };
  adminGiftAllSultanBusinessesToAccount: (
    accountId: string,
    levelsPerBusiness: number
  ) => { success: boolean; message: string };

  // Minta Tolong ke Admin (Mintol Admin) - Di paling bawah sebelah Lapor Bug
  adminHelpRequests: AdminHelpRequestRecord[];
  isMintolModalOpen: boolean;
  setIsMintolModalOpen: (open: boolean) => void;
  submitMintolRequest: (input: {
    selectedFeatures: string[];
    requestedAmount?: number;
    requestedCoins?: number;
    requestedLevel?: number;
    urgency: 'normal' | 'penting' | 'darurat_sultan';
    message: string;
    attachmentDataUrl?: string;
    attachmentName?: string;
  }) => { success: boolean; message: string; record?: AdminHelpRequestRecord };
  adminGrantAndExecuteMintolRequest: (
    requestId: string,
    adminReplyNote?: string
  ) => { success: boolean; message: string };
  adminRejectMintolRequest: (
    requestId: string,
    adminReplyNote?: string
  ) => { success: boolean; message: string };
  adminDeleteMintolRequest: (requestId: string) => void;
  adminClearMintolRequests: () => void;

  // Tutorial Aplikasi (Wajib Kartu Disetujui Admin Dulu Baru Terbuka + Auto-Tambah Setiap Ada Fitur Baru)
  isTutorialModalOpen: boolean;
  setIsTutorialModalOpen: (open: boolean) => void;
  markTutorialCompleted: (accountId?: string) => void;

  // Bot-Bot AI Khusus Aplikasi + Voice Chat / Suara (Gemini 1.5 Flash) di sebelah tombol Notifikasi
  isAiBotModalOpen: boolean;
  setIsAiBotModalOpen: (open: boolean) => void;

  // Banking operations
  withdrawCash: (amount: number, pin: string) => { success: boolean; message: string; transaction?: Transaction };
  depositCash: (amount: number, note?: string) => { success: boolean; message: string; transaction?: Transaction };
  transferMoney: (input: TransferInput) => { success: boolean; message: string; transaction?: Transaction; requiresApproval?: boolean };

  // Loan operations
  applyLoan: (input: ApplyLoanInput) => { success: boolean; message: string; loanId?: string };
  payLoanInstallment: (loanId: string) => { success: boolean; message: string };

  // Admin approvals
  adminApproveCard: (accountId: string) => { success: boolean; message: string };
  adminRejectCard: (accountId: string, reason: string) => { success: boolean; message: string };
  adminApproveLoan: (loanId: string) => { success: boolean; message: string };
  adminRejectLoan: (loanId: string, reason: string) => { success: boolean; message: string };

  // Admin Financial Approvals & Buyer Confirmations
  pendingFinancialTransactions: Transaction[];
  pendingBuyerApprovalTransactions: Transaction[];
  adminApproveFinancialTransaction: (transactionId: string) => { success: boolean; message: string };
  adminRejectFinancialTransaction: (transactionId: string, reason: string) => { success: boolean; message: string };
  adminApproveAllFinancialTransactions: () => { success: boolean; message: string; count: number };
  buyerApproveTransaction: (transactionId: string) => { success: boolean; message: string };
  buyerApproveAllTransactions: () => { success: boolean; message: string; count: number };

  // Favorites & Schedules
  addFavorite: (accountNumber: string, ownerName: string, bankName: string, alias?: string) => void;
  deleteFavorite: (id: string) => void;
  addScheduledPayment: (payment: Omit<ScheduledPayment, 'id' | 'accountId' | 'active'>) => void;
  toggleScheduledPayment: (id: string) => void;
  deleteScheduledPayment: (id: string) => void;

  // Account lookup helper
  lookupAccount: (accountNumber: string, bankCode?: string) => { found: boolean; name?: string; bank?: string };

  // Reset to default or start from zero
  resetAllData: () => void;
  startFromZero: () => void;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'bank_nusantara_accounts_v5',
  CURRENT_ACC: 'bank_nusantara_current_acc_v5',
  USER_ROLE: 'bank_nusantara_user_role_v5',
  TRANSACTIONS: 'bank_nusantara_transactions_v5',
  LOANS: 'bank_nusantara_loans_v5',
  SCHEDULED: 'bank_nusantara_scheduled_v5',
  FAVORITES: 'bank_nusantara_favorites_v5',
  NOTIFICATIONS: 'bank_nusantara_notifications_v5',
  CHATS: 'bank_nusantara_chats_v5',
  UPGRADES: 'bank_nusantara_upgrades_v5',
  POCKETS: 'bank_nusantara_pockets_v5',
  DEPOSITOS: 'bank_nusantara_depositos_v5',
  CARDLESS: 'bank_nusantara_cardless_v5',
  PIN_RESETS: 'bank_nusantara_pin_resets_v5',
  ADMIN_UNLOCKED: 'bank_nusantara_admin_unlocked_v5',
  FEATURE_CONFIGS: 'bank_nusantara_feature_configs_v13',
  REDEEM_CODES: 'bank_nusantara_redeem_codes_v5',
  PURCHASED_CODES: 'bank_nusantara_purchased_codes_v5',
  RESI_LIST: 'bank_nusantara_resi_list_v5',
  GOOGLE_USER: 'bank_nusantara_google_user_v6',
  WEBSITE_POPUPS: 'bank_nusantara_website_popups_v6',
  GLOBAL_CHATS: 'bank_nusantara_global_chats_v1',
  DISMISSED_POPUPS: 'bank_nusantara_dismissed_popups_v1',
  NOTIF_ENABLED: 'bank_nusantara_notif_enabled_v1',
  BUG_REPORTS: 'bank_nusantara_bug_reports_v1',
  APP_UPDATES: 'bank_nusantara_app_updates_v13',
  SPIN_CONFIG: 'bank_nusantara_spin_config_v1',
  SPIN_HISTORY: 'bank_nusantara_spin_history_v1',
  EMPIRE_CONFIG: 'bank_nusantara_empire_config_v2',
  MINTOL_REQUESTS: 'bank_nusantara_mintol_requests_v1',
  DELETED_FEATURES: 'bank_nusantara_deleted_features_v1',
  USER_SETTINGS: 'bank_nusantara_user_settings_v1',
};

export const DEFAULT_USER_APP_SETTINGS: UserAppSettings = {
  hideBalanceDefault: false,
  requirePinForTransferUnder1M: true,
  biometricFingerprintSim: true,
  faceIdUnlockSim: true,
  twoFactorOtpSim: false,
  antiPhishingCode: 'NUSANTARA-RESMI-99',
  autoLockMinutes: 15,
  blockScreenshotsSim: false,
  suspiciousLoginAlert: true,
  contactlessPaywaveEnabled: true,
  onlineEcommerceEnabled: true,
  autoDebitSubscriptionEnabled: true,
  overseasAtmWithdrawalEnabled: true,
  qrisCrossBorderEnabled: true,
  singleTransactionMaxLimit: 100_000_000,
  dailyTransferMaxLimit: 500_000_000,
  atmBeepSoundEnabled: true,
  cashCountingSoundEnabled: true,
  voiceReceiptReadoutEnabled: false,
  aiVoiceAutoSpeak: true,
  aiVoiceSpeechRate: 1.05,
  notificationChimeSound: true,
  hapticVibrationSim: true,
  themeColorAccent: 'indigo',
  fontSizeScale: 'normal',
  highContrastMode: false,
  compactCardLayout: false,
  animationsConfettiEnabled: true,
  showFloatingAiButton: true,
  showFloatingFooterButtons: true,
  currencyDisplayDecimals: false,
  languageLocale: 'id-ID',
  autoSaveRoundUpPocket: false,
  autoPrintReceiptAfterTx: true,
  autoClaimMiningOnOpen: false,
  miningOverclockDefault: 1,
  spinTurboAnimation: false,
  workClickVisualEffect: true,
  confirmBeforeCoinPurchase: false,
  autoRedeemPulsaTokenNotif: true,
};

export const BankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (saved) {
        const parsed: BankAccount[] = JSON.parse(saved);
        const missing = INITIAL_ACCOUNTS.filter((initAcc) => !parsed.some((p) => p.id === initAcc.id));
        return [...parsed, ...missing];
      }
      return INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [googleUser, setGoogleUser] = useState<GoogleUserSession | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GOOGLE_USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [websitePopups, setWebsitePopups] = useState<WebsiteSystemPopupNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WEBSITE_POPUPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dismissedPopupIds, setDismissedPopupIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISMISSED_POPUPS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [globalChats, setGlobalChats] = useState<GlobalChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GLOBAL_CHATS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'gchat-welcome-1',
        senderName: 'Admin Utama Bank Nusantara',
        senderRole: 'admin',
        senderAccount: '9999999999',
        isVerified: true,
        title: 'Pesan dari Admin',
        text: 'Selamat datang di Bank Nusantara! Pesan Chat Global hanya dapat dikirim resmi oleh Admin melalui Panel Admin.',
        timestamp: new Date().toISOString(),
        isPinned: true,
      },
    ];
  });

  const [bugReports, setBugReports] = useState<BugReportRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUG_REPORTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'bug-sample-1',
        reporterName: 'Raden Satrio (Saya)',
        reporterAccountNumber: '1029384756',
        reporterEmail: 'satrio@nusantara.id',
        category: 'Tampilan & Fitur',
        explanation:
          'Contoh laporan bug: Saat mencoba cek mutasi di layar potret HP, tampilan sudah lancar namun mohon dicek kembali oleh Admin.',
        status: 'baru',
        createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      },
    ];
  });

  const [appUpdates, setAppUpdates] = useState<AppUpdateRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.APP_UPDATES);
      if (saved) {
        const parsed: AppUpdateRecord[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Otomatis gabungkan update terbaru dari INITIAL_APP_UPDATES setiap kali aplikasi diupdate!
          const missingNewUpdates = INITIAL_APP_UPDATES.filter(
            (initUpd) => !parsed.some((p) => p.id === initUpd.id)
          );
          if (missingNewUpdates.length > 0) {
            const demotedExisting = parsed.map((p) => ({ ...p, isCurrent: false }));
            const merged = [...missingNewUpdates, ...demotedExisting];
            return merged.map((u, idx) => ({ ...u, isCurrent: idx === 0 }));
          }
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_APP_UPDATES;
  });

  const [spinWheelConfig, setSpinWheelConfig] = useState<SpinWheelAdminConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPIN_CONFIG);
      if (saved) {
        return { ...INITIAL_SPIN_WHEEL_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return INITIAL_SPIN_WHEEL_CONFIG;
  });

  const [spinHistory, setSpinHistory] = useState<SpinHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPIN_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [sultanEmpireConfig, setSultanEmpireConfig] = useState<SultanEmpireAdminConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.EMPIRE_CONFIG);
      if (saved) {
        return { ...INITIAL_SULTAN_EMPIRE_CONFIG, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return INITIAL_SULTAN_EMPIRE_CONFIG;
  });

  const [adminHelpRequests, setAdminHelpRequests] = useState<AdminHelpRequestRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MINTOL_REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState<boolean>(false);
  const [isMintolModalOpen, setIsMintolModalOpen] = useState<boolean>(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState<boolean>(false);
  const [isAiBotModalOpen, setIsAiBotModalOpen] = useState<boolean>(false);
  const [isGlobalChatModalOpen, setIsGlobalChatModalOpen] = useState<boolean>(false);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const [activePushBanners, setActivePushBanners] = useState<MobilePushBannerToast[]>([]);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(false);

  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState<
    'default' | 'granted' | 'denied'
  >(() => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        return Notification.permission;
      }
    } catch {
      // ignore
    }
    return 'default';
  });

  const [currentAccountId, setCurrentAccountIdState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_ACC);
      return saved || 'acc-1';
    } catch {
      return 'acc-1';
    }
  });

  const [userRole, setUserRoleState] = useState<'customer' | 'admin'>('customer');
  const [adminUnlocked, setAdminUnlockedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_UNLOCKED) === 'true';
    } catch {
      return false;
    }
  });

  const [rawFeatureConfigs, setFeatureConfigs] = useState<FeatureSecurityConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FEATURE_CONFIGS);
      if (saved) {
        const parsed: FeatureSecurityConfig[] = JSON.parse(saved);
        // Merge with INITIAL_FEATURE_CONFIGS and keep any custom features added by Admin, strictly deduplicated by id
        const mergedDefaults = INITIAL_FEATURE_CONFIGS.map((initFeat) => {
          const found = parsed.find((p) => p.id === initFeat.id);
          return found
            ? {
                ...initFeat,
                requireAdminPin: found.requireAdminPin,
                requireAdminApproval: found.requireAdminApproval,
              }
            : initFeat;
        });
        const customFeatures = parsed.filter(
          (p) => !INITIAL_FEATURE_CONFIGS.some((initFeat) => initFeat.id === p.id)
        );
        const combined = [...customFeatures, ...mergedDefaults];
        const seenIds = new Set<string>();
        return combined.filter((item) => {
          if (seenIds.has(item.id)) return false;
          seenIds.add(item.id);
          return true;
        });
      }
      return INITIAL_FEATURE_CONFIGS;
    } catch {
      return INITIAL_FEATURE_CONFIGS;
    }
  });

  const [deletedFeatureIds, setDeletedFeatureIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETED_FEATURES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [userSettings, setUserSettings] = useState<UserAppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
      if (saved) {
        return { ...DEFAULT_USER_APP_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER_APP_SETTINGS;
  });

  // Active features exclude any feature ID in deletedFeatureIds
  const featureConfigs = rawFeatureConfigs.filter((f) => !deletedFeatureIds.includes(f.id));
  const deletedFeaturesList = rawFeatureConfigs.filter((f) => deletedFeatureIds.includes(f.id));

  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REDEEM_CODES);
      return saved ? JSON.parse(saved) : INITIAL_REDEEM_CODES;
    } catch {
      return INITIAL_REDEEM_CODES;
    }
  });

  const [purchasedCodes, setPurchasedCodes] = useState<PurchasedVoucherCode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PURCHASED_CODES);
      return saved ? JSON.parse(saved) : INITIAL_PURCHASED_CODES;
    } catch {
      return INITIAL_PURCHASED_CODES;
    }
  });

  const [resiList, setResiList] = useState<ResiTrackingRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.RESI_LIST);
      return saved ? JSON.parse(saved) : INITIAL_RESI_LIST;
    } catch {
      return INITIAL_RESI_LIST;
    }
  });

  const [cardUpgrades, setCardUpgrades] = useState<CardUpgradeApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.UPGRADES);
      return saved ? JSON.parse(saved) : INITIAL_UPGRADES;
    } catch {
      return INITIAL_UPGRADES;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (saved) {
        const parsed: any[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((tx) => ({
            ...tx,
            title: tx.title || tx.description || 'Transaksi Bank Nusantara',
            referenceNo: tx.referenceNo || tx.referenceCode || `BNUS-${String(tx.id || '').slice(-6)}`,
            timestamp: tx.timestamp || tx.date || new Date().toISOString(),
          }));
        }
      }
      return INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  const [loans, setLoans] = useState<LoanApplication[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
      return saved ? JSON.parse(saved) : INITIAL_LOANS;
    } catch {
      return INITIAL_LOANS;
    }
  });

  const [chats, setChats] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CHATS);
      return saved ? JSON.parse(saved) : INITIAL_CHATS;
    } catch {
      return INITIAL_CHATS;
    }
  });

  const [pockets, setPockets] = useState<PocketSaving[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.POCKETS);
      return saved ? JSON.parse(saved) : INITIAL_POCKETS;
    } catch {
      return INITIAL_POCKETS;
    }
  });

  const [depositos, setDepositos] = useState<DepositoRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITOS);
      return saved ? JSON.parse(saved) : INITIAL_DEPOSITOS;
    } catch {
      return INITIAL_DEPOSITOS;
    }
  });

  const [cardlessTokens, setCardlessTokens] = useState<CardlessToken[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CARDLESS);
      return saved ? JSON.parse(saved) : INITIAL_CARDLESS;
    } catch {
      return INITIAL_CARDLESS;
    }
  });

  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SCHEDULED);
      return saved ? JSON.parse(saved) : INITIAL_SCHEDULED_PAYMENTS;
    } catch {
      return INITIAL_SCHEDULED_PAYMENTS;
    }
  });

  const [favorites, setFavorites] = useState<FavoriteAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      return saved ? JSON.parse(saved) : INITIAL_FAVORITES;
    } catch {
      return INITIAL_FAVORITES;
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [pinResetRequests, setPinResetRequests] = useState<PinResetRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PIN_RESETS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch { /* empty */ }
  }, [accounts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_ACC, currentAccountId);
    } catch { /* empty */ }
  }, [currentAccountId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FEATURE_CONFIGS, JSON.stringify(rawFeatureConfigs));
    } catch { /* empty */ }
  }, [rawFeatureConfigs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DELETED_FEATURES, JSON.stringify(deletedFeatureIds));
    } catch { /* empty */ }
  }, [deletedFeatureIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(userSettings));
    } catch { /* empty */ }
  }, [userSettings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.REDEEM_CODES, JSON.stringify(redeemCodes));
    } catch { /* empty */ }
  }, [redeemCodes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PURCHASED_CODES, JSON.stringify(purchasedCodes));
    } catch { /* empty */ }
  }, [purchasedCodes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.RESI_LIST, JSON.stringify(resiList));
    } catch { /* empty */ }
  }, [resiList]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PIN_RESETS, JSON.stringify(pinResetRequests));
    } catch { /* empty */ }
  }, [pinResetRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.UPGRADES, JSON.stringify(cardUpgrades));
    } catch { /* empty */ }
  }, [cardUpgrades]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.POCKETS, JSON.stringify(pockets));
    } catch { /* empty */ }
  }, [pockets]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DEPOSITOS, JSON.stringify(depositos));
    } catch { /* empty */ }
  }, [depositos]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CARDLESS, JSON.stringify(cardlessTokens));
    } catch { /* empty */ }
  }, [cardlessTokens]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
    } catch { /* empty */ }
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPIN_CONFIG, JSON.stringify(spinWheelConfig));
    } catch { /* empty */ }
  }, [spinWheelConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SPIN_HISTORY, JSON.stringify(spinHistory));
    } catch { /* empty */ }
  }, [spinHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.EMPIRE_CONFIG, JSON.stringify(sultanEmpireConfig));
    } catch { /* empty */ }
  }, [sultanEmpireConfig]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MINTOL_REQUESTS, JSON.stringify(adminHelpRequests));
    } catch { /* empty */ }
  }, [adminHelpRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ADMIN_UNLOCKED, String(adminUnlocked));
    } catch { /* empty */ }
  }, [adminUnlocked]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch { /* empty */ }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
    } catch { /* empty */ }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEDULED, JSON.stringify(scheduledPayments));
    } catch { /* empty */ }
  }, [scheduledPayments]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch { /* empty */ }
  }, [favorites]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
    } catch { /* empty */ }
  }, [notifications]);

  useEffect(() => {
    try {
      if (googleUser) {
        localStorage.setItem(STORAGE_KEYS.GOOGLE_USER, JSON.stringify(googleUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.GOOGLE_USER);
      }
    } catch { /* empty */ }
  }, [googleUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WEBSITE_POPUPS, JSON.stringify(websitePopups));
    } catch { /* empty */ }
  }, [websitePopups]);

  const currentAccount = accounts.find((a) => a.id === currentAccountId) || accounts[0] || null;

  // ================= GOOGLE LOGIN & ONBOARDING HANDLERS =================
  const loginWithGoogle = (email: string, name: string, picture?: string) => {
    const cleanEmail = email.trim().toLowerCase() || 'fahmiammarulazka@gmail.com';
    const cleanName = name.trim() || cleanEmail.split('@')[0];
    const session: GoogleUserSession = {
      email: cleanEmail,
      name: cleanName,
      picture,
      loggedInAt: new Date().toISOString(),
      hasCompletedOnboarding: false, // Setelah login Google disuruh mulai daftar kartu (atau login ke kartu lama)
    };
    setGoogleUser(session);
    playAtmSound('success');
  };

  const completeGoogleOnboarding = () => {
    setGoogleUser((prev) => (prev ? { ...prev, hasCompletedOnboarding: true } : prev));
  };

  const reopenGoogleOnboarding = () => {
    setGoogleUser((prev) => (prev ? { ...prev, hasCompletedOnboarding: false } : prev));
  };

  const logoutGoogle = () => {
    setGoogleUser(null);
    playAtmSound('beep');
  };

  // ================= WEBSITE SYSTEM POPUP NOTIFICATIONS (CLOSABLE) & REAL-TIME SYNC =================
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.DISMISSED_POPUPS, JSON.stringify(dismissedPopupIds));
    } catch { /* empty */ }
  }, [dismissedPopupIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.GLOBAL_CHATS, JSON.stringify(globalChats));
    } catch { /* empty */ }
  }, [globalChats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BUG_REPORTS, JSON.stringify(bugReports));
    } catch { /* empty */ }
  }, [bugReports]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.APP_UPDATES, JSON.stringify(appUpdates));
    } catch { /* empty */ }
  }, [appUpdates]);

  const activeWebsitePopups = websitePopups.filter(
    (p) => !p.dismissed && !dismissedPopupIds.includes(p.id)
  );

  const dismissWebsitePopup = (id: string) => {
    setDismissedPopupIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setWebsitePopups((prev) => prev.map((p) => (p.id === id ? { ...p, dismissed: true } : p)));
    playAtmSound('beep');
  };

  const dismissAllWebsitePopups = () => {
    const allIds = websitePopups.map((p) => p.id);
    setDismissedPopupIds((prev) => Array.from(new Set([...prev, ...allIds])));
    setWebsitePopups((prev) => prev.map((p) => ({ ...p, dismissed: true })));
    playAtmSound('beep');
  };

  const dismissPushBanner = (id: string) => {
    setActivePushBanners((prev) => prev.filter((b) => b.id !== id));
  };

  // Register Service Worker on mount for mobile push notifications
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(() => {
          // ignore if blocked in iframe
        });
      }
    } catch {
      // ignore
    }
  }, []);

  // Notification feature disabled per user request ("Hapus global chat dan juga fitur notifikasi")
  const triggerMobileAndNativeNotification = (
    _title: string,
    _message: string,
    _type: 'info' | 'success' | 'warning' | 'alert' | 'admin_chat' = 'info'
  ) => {
    // No push banners or browser notifications
  };

  const requestAndEnableNotifications = async (): Promise<{ success: boolean; message: string }> => {
    setNotificationsEnabled(false);
    return {
      success: false,
      message: 'Fitur notifikasi telah dinonaktifkan.',
    };
  };

  const sendTestNotificationNow = () => {
    // Disabled
  };

  // Real-time WebSocket + HTTP Sync across ALL Phones ("di semua HP")
  const wsRef = useRef<WebSocket | null>(null);
  const seenChatIdsRef = useRef<Set<string>>(new Set(globalChats.map((c) => c.id)));
  const seenPopupIdsRef = useRef<Set<string>>(new Set(websitePopups.map((p) => p.id)));
  const seenBugIdsRef = useRef<Set<string>>(new Set(bugReports.map((b) => b.id)));

  useEffect(() => {
    globalChats.forEach((c) => seenChatIdsRef.current.add(c.id));
  }, [globalChats]);

  useEffect(() => {
    websitePopups.forEach((p) => seenPopupIdsRef.current.add(p.id));
  }, [websitePopups]);

  useEffect(() => {
    let isMounted = true;

    const handleIncomingGlobalChat = (
      newMsg: GlobalChatMessage,
      popup?: WebsiteSystemPopupNotification | null,
      triggerAlert = true
    ) => {
      if (!newMsg || !newMsg.id) return;
      const isAlreadySeen = seenChatIdsRef.current.has(newMsg.id);
      seenChatIdsRef.current.add(newMsg.id);

      setGlobalChats((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [newMsg, ...prev].slice(0, 200);
      });

      if (popup && popup.id) {
        seenPopupIdsRef.current.add(popup.id);
        setWebsitePopups((prev) => {
          if (prev.some((p) => p.id === popup.id)) return prev;
          return [popup, ...prev];
        });
      }

      if (!isAlreadySeen && triggerAlert) {
        const alertTitle = newMsg.senderRole === 'admin' ? 'Pesan dari Admin' : `Chat Global: ${newMsg.senderName}`;
        triggerMobileAndNativeNotification(
          alertTitle,
          newMsg.text,
          newMsg.senderRole === 'admin' ? 'admin_chat' : 'info'
        );
        const appNotif: AppNotification = {
          id: `notif-gchat-${newMsg.id}`,
          title: `${alertTitle} 💬`,
          message: newMsg.text,
          type: 'info',
          timestamp: newMsg.timestamp || new Date().toISOString(),
          read: false,
        };
        setNotifications((prev) => {
          if (prev.some((n) => n.id === appNotif.id)) return prev;
          return [appNotif, ...prev];
        });
        playAtmSound('success');
      }
    };

    const handleIncomingPopup = (popup: WebsiteSystemPopupNotification, triggerAlert = true) => {
      if (!popup || !popup.id) return;
      const isAlreadySeen = seenPopupIdsRef.current.has(popup.id);
      seenPopupIdsRef.current.add(popup.id);

      setWebsitePopups((prev) => {
        if (prev.some((p) => p.id === popup.id)) return prev;
        return [popup, ...prev];
      });

      if (!isAlreadySeen && triggerAlert) {
        triggerMobileAndNativeNotification(
          popup.type === 'admin_chat' ? 'Pesan dari Admin' : popup.title,
          popup.message,
          popup.type === 'admin_chat' ? 'admin_chat' : 'info'
        );
        playAtmSound('success');
      }
    };

    // 1. Initial & Periodic HTTP Sync (guarantees delivery across all phones even if mobile network blocks WS)
    const syncFromServer = async (isInitial = false) => {
      try {
        const res = await fetch('/api/global-chat');
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted) return;

        if (typeof data.connectedDevices === 'number') {
          setConnectedDevicesCount(Math.max(1, data.connectedDevices));
        }

        if (Array.isArray(data.globalChats)) {
          const incomingChats: GlobalChatMessage[] = data.globalChats;
          // Check for any newly arrived chat message not seen before
          incomingChats.forEach((msg) => {
            if (!seenChatIdsRef.current.has(msg.id)) {
              handleIncomingGlobalChat(msg, null, !isInitial);
            }
          });
          setGlobalChats(incomingChats);
        }

        if (Array.isArray(data.websitePopups)) {
          const incomingPopups: WebsiteSystemPopupNotification[] = data.websitePopups;
          incomingPopups.forEach((p) => {
            if (!seenPopupIdsRef.current.has(p.id)) {
              handleIncomingPopup(p, !isInitial);
            }
          });
        }

        if (Array.isArray(data.bugReports)) {
          setBugReports(data.bugReports);
        }
      } catch {
        // ignore offline
      }
    };

    syncFromServer(true);
    const pollInterval = setInterval(() => syncFromServer(false), 2000);

    // 2. WebSocket Connection for instant (<50ms) delivery across all connected phones
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    const connectWs = () => {
      if (!isMounted || typeof window === 'undefined') return;
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'init' && msg.payload) {
              if (Array.isArray(msg.payload.globalChats)) {
                msg.payload.globalChats.forEach((c: GlobalChatMessage) => seenChatIdsRef.current.add(c.id));
                setGlobalChats(msg.payload.globalChats);
              }
              if (Array.isArray(msg.payload.websitePopups)) {
                msg.payload.websitePopups.forEach((p: WebsiteSystemPopupNotification) =>
                  seenPopupIdsRef.current.add(p.id)
                );
                setWebsitePopups((prev) => {
                  const existingIds = new Set(prev.map((x) => x.id));
                  const added = msg.payload.websitePopups.filter(
                    (x: WebsiteSystemPopupNotification) => !existingIds.has(x.id)
                  );
                  return [...added, ...prev];
                });
              }
              if (Array.isArray(msg.payload.bugReports)) {
                setBugReports(msg.payload.bugReports);
              }
              if (typeof msg.payload.connectedDevices === 'number') {
                setConnectedDevicesCount(Math.max(1, msg.payload.connectedDevices));
              }
            } else if (msg.type === 'presence' && msg.payload) {
              if (typeof msg.payload.connectedDevices === 'number') {
                setConnectedDevicesCount(Math.max(1, msg.payload.connectedDevices));
              }
            } else if (msg.type === 'global_chat:new' && msg.payload?.message) {
              handleIncomingGlobalChat(msg.payload.message, msg.payload.popup, true);
            } else if (msg.type === 'global_chat:delete' && msg.payload?.id) {
              setGlobalChats((prev) => prev.filter((m) => m.id !== msg.payload.id));
            } else if (msg.type === 'global_chat:clear') {
              setGlobalChats([]);
            } else if (msg.type === 'website_popup:new' && msg.payload?.popup) {
              handleIncomingPopup(msg.payload.popup, true);
            } else if (msg.type === 'bug_report:new' && msg.payload?.bugReport) {
              const incomingBug: BugReportRecord = msg.payload.bugReport;
              seenBugIdsRef.current.add(incomingBug.id);
              setBugReports((prev) => {
                if (prev.some((b) => b.id === incomingBug.id)) return prev;
                return [incomingBug, ...prev];
              });
            } else if (msg.type === 'bug_report:updated' && msg.payload?.bugReport) {
              const updatedBug: BugReportRecord = msg.payload.bugReport;
              setBugReports((prev) => prev.map((b) => (b.id === updatedBug.id ? updatedBug : b)));
            } else if (msg.type === 'bug_report:deleted' && msg.payload?.id) {
              setBugReports((prev) => prev.filter((b) => b.id !== msg.payload.id));
            } else if (msg.type === 'bug_report:clear') {
              setBugReports([]);
            }
          } catch {
            // ignore
          }
        };

        ws.onclose = () => {
          if (isMounted) {
            reconnectTimer = setTimeout(connectWs, 3000);
          }
        };
      } catch {
        // ignore
      }
    };

    connectWs();

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch { /* empty */ }
      }
    };
  }, []);

  // Send Global Chat Message -> ONLY ADMIN VIA PANEL ADMIN CAN SEND ("Global chat hanya bisa dikirim oleh admin dan sahabat tidak bisa, hanya admin lewat panel admin")
  const sendGlobalChatMessage = async (input: {
    text: string;
    asAdmin?: boolean;
    senderName?: string;
    showPopupOnAllPhones?: boolean;
  }): Promise<{ success: boolean; message: string }> => {
    if (input.asAdmin === false) {
      return {
        success: false,
        message: 'Global Chat hanya bisa dikirim oleh Admin melalui Panel Admin! Sahabat/Nasabah tidak dapat mengirim pesan Global Chat.',
      };
    }

    const cleanText = input.text.trim();
    if (!cleanText) {
      return { success: false, message: 'Pesan Chat Global tidak boleh kosong!' };
    }

    const msgId = `gchat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const senderName = input.senderName?.trim() || 'Admin Bank Nusantara';

    const newMsg: GlobalChatMessage = {
      id: msgId,
      senderName,
      senderRole: 'admin',
      senderAccount: '9999999999',
      isVerified: true,
      title: 'Pesan dari Admin',
      text: cleanText,
      timestamp: new Date().toISOString(),
      isPinned: true,
    };

    seenChatIdsRef.current.add(msgId);
    setGlobalChats((prev) => [newMsg, ...prev]);

    const popupId = `popup-gchat-${msgId}`;
    if (input.showPopupOnAllPhones !== false) {
      const adminPopup: WebsiteSystemPopupNotification = {
        id: popupId,
        type: 'admin_chat',
        title: 'Pesan dari Admin',
        subtitle: 'PESAN RESMI DARI PANEL ADMIN BANK NUSANTARA',
        message: cleanText,
        senderName,
        accountName: 'Seluruh HP & Nasabah Bank Nusantara',
        accountNumber: 'PESAN DARI ADMIN',
        timestamp: newMsg.timestamp,
        dismissed: false,
      };
      seenPopupIdsRef.current.add(popupId);
      setWebsitePopups((prev) => [adminPopup, ...prev]);
    }

    playAtmSound('success');

    try {
      await fetch('/api/global-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: msgId,
          senderName,
          senderRole: 'admin',
          senderAccount: newMsg.senderAccount,
          isVerified: true,
          title: 'Pesan dari Admin',
          text: cleanText,
          isPinned: true,
          showPopupOnAllPhones: input.showPopupOnAllPhones ?? true,
        }),
      });
    } catch {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'global_chat:send',
            payload: {
              id: msgId,
              senderName,
              senderRole: 'admin',
              text: cleanText,
              showPopupOnAllPhones: input.showPopupOnAllPhones ?? true,
            },
          })
        );
      }
    }

    return {
      success: true,
      message: `Pesan dari Admin "${cleanText}" berhasil dikirim dari Panel Admin dan tampil di semua HP!`,
    };
  };

  const deleteGlobalChatMessage = async (id: string) => {
    setGlobalChats((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch(`/api/global-chat/${id}`, { method: 'DELETE' });
    } catch { /* empty */ }
  };

  const clearGlobalChatMessages = async () => {
    setGlobalChats([]);
    try {
      await fetch('/api/global-chat/clear', { method: 'POST' });
    } catch { /* empty */ }
  };

  // ================= LAPOR BUG HANDLERS (FOTO BEBAS OPSIONAL & PENJELASAN WAJIB) =================
  const submitBugReport = async (input: {
    explanation: string;
    category?: string;
    photoDataUrl?: string;
    photoFileName?: string;
  }): Promise<{ success: boolean; message: string; bugReport?: BugReportRecord }> => {
    const cleanExplanation = input.explanation.trim();
    if (!cleanExplanation) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Penjelasan bug wajib diisi sebelum mengirim laporan!',
      };
    }

    const bugId = `bug-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newBug: BugReportRecord = {
      id: bugId,
      reporterName: currentAccount?.fullName || googleUser?.name || 'Pengguna Bank Nusantara',
      reporterAccountNumber: currentAccount?.accountNumber,
      reporterEmail: googleUser?.email || currentAccount?.email,
      category: input.category?.trim() || 'Kendala Aplikasi / Umum',
      explanation: cleanExplanation,
      photoDataUrl: input.photoDataUrl || undefined,
      photoFileName: input.photoFileName || undefined,
      status: 'baru',
      createdAt: new Date().toISOString(),
    };

    seenBugIdsRef.current.add(bugId);
    setBugReports((prev) => [newBug, ...prev]);
    playAtmSound('success');

    try {
      await fetch('/api/bug-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBug),
      });
    } catch {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'bug_report:send',
            payload: newBug,
          })
        );
      }
    }

    return {
      success: true,
      message: 'Laporan Bug berhasil dikirim! Tim Admin dapat langsung melihat penjelasan & foto Anda di Panel Admin.',
      bugReport: newBug,
    };
  };

  const adminUpdateBugReport = async (
    id: string,
    status: 'baru' | 'diproses' | 'selesai',
    adminReply?: string
  ): Promise<{ success: boolean; message: string }> => {
    setBugReports((prev) =>
      prev.map((b) =>
        b.id === id
          ? {
              ...b,
              status,
              adminReply: adminReply !== undefined ? adminReply : b.adminReply,
              updatedAt: new Date().toISOString(),
            }
          : b
      )
    );
    playAtmSound('success');

    try {
      await fetch(`/api/bug-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminReply }),
      });
    } catch { /* empty */ }

    return {
      success: true,
      message: `Status laporan bug berhasil diperbarui menjadi "${status.toUpperCase()}"!`,
    };
  };

  const adminDeleteBugReport = async (id: string) => {
    setBugReports((prev) => prev.filter((b) => b.id !== id));
    playAtmSound('beep');
    try {
      await fetch(`/api/bug-reports/${id}`, { method: 'DELETE' });
    } catch { /* empty */ }
  };

  const adminClearBugReports = async () => {
    setBugReports([]);
    playAtmSound('beep');
    try {
      await fetch('/api/bug-reports/clear', { method: 'POST' });
    } catch { /* empty */ }
  };

  const setCurrentAccountId = (id: string) => {
    setCurrentAccountIdState(id);
  };

  const setUserRole = (role: 'customer' | 'admin') => {
    setUserRoleState(role);
  };

  const setAdminUnlocked = (unlocked: boolean) => {
    setAdminUnlockedState(unlocked);
  };

  const currentAccountTransactions = transactions.filter(
    (tx) => tx.accountId === currentAccountId || (currentAccount && tx.recipientAccount === currentAccount.accountNumber)
  );

  const currentAccountLoans = loans.filter((l) => l.accountId === currentAccountId);
  const currentAccountScheduled = scheduledPayments.filter((s) => s.accountId === currentAccountId);
  const currentAccountPockets = pockets.filter((p) => p.accountId === currentAccountId);
  const currentAccountDepositos = depositos.filter((d) => d.accountId === currentAccountId);
  const currentAccountCardlessTokens = cardlessTokens.filter(
    (c) => c.accountId === currentAccountId && c.status === 'active' && c.adminApproved !== false
  );
  const currentAccountPurchasedCodes = purchasedCodes.filter(
    (c) => c.accountId === currentAccountId && c.adminApproved
  );

  const unreadNotificationCount = notifications.filter((n) => !n.read).length;

  const addNotification = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'alert' = 'info') => {
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      title,
      message,
      type,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
    // Also show top mobile push banner & native browser notification!
    triggerMobileAndNativeNotification(title, message, type);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // ================= ADMIN FEATURE CONFIGURATOR =================
  const getFeatureConfig = (featureId: string) => {
    return featureConfigs.find((f) => f.id === featureId);
  };

  const toggleFeatureAdminPin = (featureId: string) => {
    setFeatureConfigs((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, requireAdminPin: !f.requireAdminPin } : f))
    );
    playAtmSound('beep');
  };

  const toggleFeatureAdminApproval = (featureId: string) => {
    setFeatureConfigs((prev) =>
      prev.map((f) => (f.id === featureId ? { ...f, requireAdminApproval: !f.requireAdminApproval } : f))
    );
    playAtmSound('beep');
  };

  const setAllFeaturesAdminPin = (enabled: boolean) => {
    setFeatureConfigs((prev) => prev.map((f) => ({ ...f, requireAdminPin: enabled })));
    playAtmSound('success');
  };

  const setAllFeaturesAdminApproval = (enabled: boolean) => {
    setFeatureConfigs((prev) =>
      prev.map((f) => (f.id === 'transfer' && !enabled ? { ...f, requireAdminApproval: false } : { ...f, requireAdminApproval: enabled }))
    );
    playAtmSound('success');
  };

  // ================= REDEEM CODE SYSTEM =================
  const createRedeemCode = (input: {
    code: string;
    title: string;
    rewardAmount: number;
    maxClaims: number;
    durationMinutes: number;
    requireAdminPin?: boolean;
  }) => {
    const cleanCode = input.code.trim().toUpperCase().replace(/\s+/g, '');
    if (!cleanCode || cleanCode.length < 3) {
      return { success: false, message: 'Kode redeem minimal 3 karakter!' };
    }
    if (redeemCodes.some((r) => r.code.toUpperCase() === cleanCode)) {
      return { success: false, message: 'Kode redeem tersebut sudah terdaftar!' };
    }
    if (input.rewardAmount <= 0 || input.maxClaims <= 0 || input.durationMinutes <= 0) {
      return { success: false, message: 'Nominal, kuota orang, dan durasi harus lebih dari 0!' };
    }

    const now = Date.now();
    const newRedeem: RedeemCode = {
      id: `rdm-${now}`,
      code: cleanCode,
      title: input.title.trim() || `Voucher Redeem Rp ${input.rewardAmount.toLocaleString('id-ID')}`,
      rewardAmount: input.rewardAmount,
      maxClaims: input.maxClaims,
      claimedBy: [],
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + input.durationMinutes * 60 * 1000).toISOString(),
      durationMinutes: input.durationMinutes,
      active: true,
      requireAdminPin: input.requireAdminPin || false,
    };

    setRedeemCodes((prev) => [newRedeem, ...prev]);
    addNotification(
      'Kode Redeem Baru Dibuat 🎁',
      `Kode "${cleanCode}" senilai Rp ${input.rewardAmount.toLocaleString('id-ID')} aktif untuk ${input.maxClaims} orang selama ${input.durationMinutes} menit.`,
      'success'
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Kode Redeem "${cleanCode}" berhasil dibuat! Berlaku untuk ${input.maxClaims} orang selama ${input.durationMinutes} menit.`,
      redeemCode: newRedeem,
    };
  };

  const deleteRedeemCode = (id: string) => {
    setRedeemCodes((prev) => prev.filter((r) => r.id !== id));
    playAtmSound('beep');
  };

  const toggleRedeemCodeActive = (id: string) => {
    setRedeemCodes((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
    playAtmSound('beep');
  };

  const claimRedeemCode = (code: string) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif!' };
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '');
    const target = redeemCodes.find((r) => r.code.toUpperCase() === cleanCode);

    if (!target) {
      playAtmSound('alert');
      return { success: false, message: `Kode Redeem "${cleanCode}" tidak ditemukan! Periksa kembali huruf/angkanya.` };
    }

    if (!target.active) {
      playAtmSound('alert');
      return { success: false, message: `Kode Redeem "${cleanCode}" sedang dinonaktifkan oleh Admin.` };
    }

    const now = new Date();
    const exp = new Date(target.expiresAt);
    if (now > exp) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Masa berlaku Kode Redeem "${cleanCode}" telah habis (Kedaluwarsa pada ${exp.toLocaleTimeString('id-ID')} WIB).`,
      };
    }

    if (target.claimedBy.length >= target.maxClaims) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Kuota klaim Kode Redeem "${cleanCode}" sudah penuh (${target.claimedBy.length}/${target.maxClaims} orang telah mengklaim).`,
      };
    }

    if (target.claimedBy.some((c) => c.accountId === currentAccount.id)) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Akun Anda (${currentAccount.fullName}) sudah pernah menukarkan kode "${cleanCode}" ini!`,
      };
    }

    const newBalance = currentAccount.balance + target.rewardAmount;

    // Update account balance
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === currentAccount.id
          ? { ...acc, balance: newBalance, rewardPoints: (acc.rewardPoints || 0) + 50 }
          : acc
      )
    );

    // Record claim
    setRedeemCodes((prev) =>
      prev.map((r) =>
        r.id === target.id
          ? {
              ...r,
              claimedBy: [
                ...r.claimedBy,
                {
                  accountId: currentAccount.id,
                  accountNumber: currentAccount.accountNumber,
                  fullName: currentAccount.fullName,
                  claimedAt: new Date().toISOString(),
                },
              ],
            }
          : r
      )
    );

    // Add transaction history
    const tx: Transaction = {
      id: `tx-rdm-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'redeem_code',
      title: `Klaim Kode Redeem: ${target.code} (${target.title})`,
      amount: target.rewardAmount,
      recipientAccount: currentAccount.accountNumber,
      recipientName: currentAccount.fullName,
      description: `Hadiah saldo Kode Redeem ${target.code} berhasil masuk ke rekening`,
      status: 'success',
      referenceNo: `RDM${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'redeem',
    };
    setTransactions((prev) => [tx, ...prev]);

    addNotification(
      'Kode Redeem Berhasil Diklaim! 🎉',
      `Selamat! Saldo sebesar Rp ${target.rewardAmount.toLocaleString('id-ID')} dari kode "${target.code}" telah langsung ditambahkan ke rekening Anda.`,
      'success'
    );

    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');

    return {
      success: true,
      message: `Selamat! Kode "${target.code}" berhasil ditukar. Saldo Anda bertambah Rp ${target.rewardAmount.toLocaleString('id-ID')}!`,
      rewardAmount: target.rewardAmount,
      newBalance,
    };
  };

  // ================= TUKAR KODE PULSA, TOKEN LISTRIK & VOUCHER LAINNYA YANG SUDAH DIBELI =================
  const redeemPurchasedCode = (codeInput: string, targetPhoneOrMeter?: string) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif!' };
    const cleanInput = codeInput.replace(/[-\s]/g, '').trim();

    if (!cleanInput) {
      return { success: false, message: 'Masukkan kode voucher pulsa, kode token listrik, atau kode tukar lainnya terlebih dahulu!' };
    }

    const found = purchasedCodes.find(
      (vc) => vc.code.replace(/[-\s]/g, '').toUpperCase() === cleanInput.toUpperCase()
    );

    if (!found) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Kode tidak ditemukan! Pastikan Anda memasukkan kode Pulsa, Token Listrik, atau Voucher yang sudah Anda beli di Bank Nusantara.',
      };
    }

    if (!found.adminApproved) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Pembelian kode ini masih SEDANG DIPROSES! Kode tukar belum aktif dan akan tersedia setelah proses selesai.',
      };
    }

    if (found.status === 'redeemed') {
      playAtmSound('alert');
      return {
        success: false,
        message: `Kode ${found.code} ini sudah pernah ditukarkan sebelumnya pada ${found.redeemedAt ? new Date(found.redeemedAt).toLocaleString('id-ID') : 'waktu lalu'}!`,
      };
    }

    const finalTarget = targetPhoneOrMeter?.trim() || found.providerOrMeter;

    // Mark as redeemed
    const updatedVoucher: PurchasedVoucherCode = {
      ...found,
      status: 'redeemed',
      redeemedAt: new Date().toISOString(),
      redeemedTarget: finalTarget,
    };

    setPurchasedCodes((prev) =>
      prev.map((vc) => (vc.id === found.id ? updatedVoucher : vc))
    );

    if (found.type === 'pulsa') {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === currentAccount.id
            ? { ...acc, pulsaBalance: (acc.pulsaBalance || 0) + found.nominal }
            : acc
        )
      );
      addNotification(
        'Kode Voucher Pulsa Berhasil Ditukar! 📱',
        `Pulsa senilai Rp ${found.nominal.toLocaleString('id-ID')} (Kode: ${found.code}) telah aktif dan masuk ke nomor ${finalTarget}.`,
        'success'
      );
    } else if (found.type === 'token_listrik') {
      const addedKwh = found.kwhAmount || Number((found.nominal / 1460).toFixed(1));
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === currentAccount.id
            ? { ...acc, plnKwhBalance: Number(((acc.plnKwhBalance || 0) + addedKwh).toFixed(1)) }
            : acc
        )
      );
      addNotification(
        'Token Listrik Berhasil Dimasukkan ke Meteran! ⚡',
        `Kode Stroom ${found.code} diterima meteran (${finalTarget}). Daya listrik bertambah +${addedKwh} kWh!`,
        'success'
      );
    } else {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === currentAccount.id
            ? { ...acc, rewardPoints: (acc.rewardPoints || 0) + 100 }
            : acc
        )
      );
      addNotification(
        'Kode Voucher Berhasil Ditukarkan! 🎟️',
        `Voucher ${found.providerOrMeter} senilai Rp ${found.nominal.toLocaleString('id-ID')} (Kode: ${found.code}) berhasil diaktifkan untuk ${finalTarget}.`,
        'success'
      );
    }

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');

    return {
      success: true,
      message:
        found.type === 'pulsa'
          ? `Berhasil! Kode Pulsa ${found.code} senilai Rp ${found.nominal.toLocaleString('id-ID')} telah masuk ke nomor ${finalTarget}!`
          : found.type === 'token_listrik'
          ? `BENAR! Kode Token PLN ${found.code} berhasil masuk ke meteran ${finalTarget}. Listrik bertambah +${found.kwhAmount || Number((found.nominal / 1460).toFixed(1))} kWh!`
          : `Berhasil! Kode Voucher ${found.code} (${found.providerOrMeter}) senilai Rp ${found.nominal.toLocaleString('id-ID')} berhasil diaktifkan ke ${finalTarget}!`,
      voucher: updatedVoucher,
    };
  };

  // ================= MASUKKAN & LACAK RESI + BAYAR COD =================
  const addResiRecord = (input: {
    resiNumber: string;
    courier: string;
    sender: string;
    recipient: string;
    origin: string;
    destination: string;
    shippingFee: number;
    codAmount?: number;
  }) => {
    const cleanResi = input.resiNumber.trim().toUpperCase();
    if (!cleanResi) return { success: false, message: 'Nomor resi tidak boleh kosong!' };

    const newResi: ResiTrackingRecord = {
      id: `resi-${Date.now()}`,
      resiNumber: cleanResi,
      courier: input.courier || 'JNE Express',
      sender: input.sender || 'Toko Online Nusantara',
      recipient: input.recipient || currentAccount?.fullName || 'Nasabah',
      origin: input.origin || 'Jakarta',
      destination: input.destination || 'Bandung',
      status: 'Dalam Perjalanan',
      shippingFee: input.shippingFee || 20000,
      codAmount: input.codAmount || 0,
      paidViaBank: false,
      history: [
        {
          time: 'Baru saja',
          location: `Sorting Center ${input.origin || 'Jakarta'}`,
          description: `Nomor resi ${cleanResi} berhasil didaftarkan ke sistem pelacakan logistik Bank Nusantara.`,
        },
      ],
    };

    setResiList((prev) => [newResi, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Resi ${cleanResi} (${newResi.courier}) berhasil dimasukkan ke daftar pelacakan!`,
      resi: newResi,
    };
  };

  const payResiCod = (resiId: string): PayBillResult => {
    const target = resiList.find((r) => r.id === resiId);
    if (!target) return { success: false, message: 'Data resi tidak ditemukan!' };
    if (target.paidViaBank) return { success: false, message: 'Tagihan resi ini sudah lunas dibayar!' };

    const totalPay = (target.codAmount || 0) + target.shippingFee;
    const res = payBill(
      'bayar_resi',
      `Pembayaran Resi & COD ${target.courier} (${target.resiNumber})`,
      totalPay,
      target.resiNumber,
      'tagihan',
      'lacak_resi'
    );

    if (res.success) {
      setResiList((prev) =>
        prev.map((r) =>
          r.id === resiId
            ? {
                ...r,
                paidViaBank: true,
                status: 'Terkirim',
                history: [
                  {
                    time: 'Baru saja',
                    location: 'Pembayaran Bank Nusantara',
                    description: `Tagihan COD/Ongkir sebesar Rp ${totalPay.toLocaleString('id-ID')} telah dibayar via Rekening Bank Nusantara.`,
                  },
                  ...r.history,
                ],
              }
            : r
        )
      );
    }

    return res;
  };

  // ================= LUPA PIN KARTU (TINJAUAN ADMIN) =================
  const requestPinReset = (accountId: string, reason = 'Nasabah lupa 6 digit PIN kartu saat akan bertransaksi di ATM') => {
    const acc = accounts.find((a) => a.id === accountId);
    if (!acc) return { success: false, message: 'Rekening tidak ditemukan' };

    const existingPending = pinResetRequests.find((r) => r.accountId === accountId && r.status === 'pending');
    if (existingPending) {
      return {
        success: true,
        message: 'Permohonan Lupa PIN Anda sedang dalam antrean tinjauan Admin. Silakan buka Panel Admin untuk menyetujui dan melihat PIN.',
        requestId: existingPending.id,
      };
    }

    const newReq: PinResetRequest = {
      id: `pinreq-${Date.now()}`,
      accountId: acc.id,
      fullName: acc.fullName,
      accountNumber: acc.accountNumber,
      phone: acc.phone,
      nik: acc.nik,
      cardTier: acc.cardTier,
      reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    setPinResetRequests((prev) => [newReq, ...prev]);
    addNotification(
      'Permohonan Lupa PIN Terkirim ke Admin 🔐',
      `Permintaan bantuan Lupa PIN untuk rekening ${acc.accountNumber} telah masuk ke Panel Admin. Setelah disetujui Admin, PIN akan diberitahukan kepada Anda.`,
      'info'
    );
    playAtmSound('beep');

    return {
      success: true,
      message: 'Permohonan Lupa PIN berhasil dikirim ke Admin! Silakan buka Panel Admin untuk meninjau & menampilkan PIN Anda.',
      requestId: newReq.id,
    };
  };

  const adminApprovePinReset = (requestId: string) => {
    const req = pinResetRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Permohonan tidak ditemukan' };
    const acc = accounts.find((a) => a.id === req.accountId);
    if (!acc) return { success: false, message: 'Akun nasabah tidak ditemukan' };

    setPinResetRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved',
              decidedAt: new Date().toISOString(),
              revealedPin: acc.pin,
              adminNotes: `Disetujui Admin. PIN Kartu Anda adalah: ${acc.pin}`,
            }
          : r
      )
    );

    addNotification(
      'Tinjauan Lupa PIN Disetujui Admin! 🔑',
      `Admin telah memverifikasi identitas Anda. PIN Kartu ATM (${acc.accountNumber}) Anda adalah: ${acc.pin}. Silakan gunakan untuk masuk ke mesin ATM.`,
      'success'
    );
    playAtmSound('success');

    return {
      success: true,
      message: `Tinjauan Lupa PIN ${acc.fullName} disetujui! PIN (${acc.pin}) kini telah diberitahukan ke nasabah.`,
      pin: acc.pin,
    };
  };

  const adminRejectPinReset = (requestId: string, reason: string) => {
    const req = pinResetRequests.find((r) => r.id === requestId);
    if (!req) return { success: false, message: 'Permohonan tidak ditemukan' };

    setPinResetRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              decidedAt: new Date().toISOString(),
              adminNotes: reason || 'Data verifikasi belum sesuai.',
            }
          : r
      )
    );

    addNotification(
      'Permohonan Lupa PIN Ditolak ❌',
      `Permohonan Lupa PIN ditolak Admin: ${reason}`,
      'alert'
    );
    playAtmSound('alert');
    return { success: true, message: 'Permohonan Lupa PIN telah ditolak.' };
  };

  /**
   * Card Upgrade Flow
   */
  const applyCardUpgrade = (input: { requestedTier: CardTier; monthlyIncome: number; reason: string }) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };

    if (currentAccount.cardTier === input.requestedTier) {
      return { success: false, message: 'Anda sudah menggunakan jenis kartu ini.' };
    }

    const newUpgrade: CardUpgradeApplication = {
      id: `upg-${Date.now()}`,
      accountId: currentAccount.id,
      applicantName: currentAccount.fullName,
      accountNumber: currentAccount.accountNumber,
      currentTier: currentAccount.cardTier,
      requestedTier: input.requestedTier,
      monthlyIncome: input.monthlyIncome,
      reason: input.reason,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    setCardUpgrades((prev) => [newUpgrade, ...prev]);

    addNotification(
      'Pengajuan Upgrade Kartu Sedang Diproses 💳',
      `Permohonan upgrade dari ${CARD_TIER_CONFIGS[currentAccount.cardTier].nameIndo} ke ${CARD_TIER_CONFIGS[input.requestedTier].nameIndo} sedang diproses oleh sistem.`,
      'info'
    );

    return {
      success: true,
      message: 'Permohonan upgrade kartu berhasil dikirim dan saat ini sedang diproses!',
    };
  };

  const adminApproveUpgrade = (upgradeId: string) => {
    const upgrade = cardUpgrades.find((u) => u.id === upgradeId);
    if (!upgrade) return { success: false, message: 'Data pengajuan tidak ditemukan' };

    setCardUpgrades((prev) =>
      prev.map((u) => (u.id === upgradeId ? { ...u, status: 'approved', decidedAt: new Date().toISOString() } : u))
    );

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === upgrade.accountId
          ? {
              ...acc,
              cardTier: upgrade.requestedTier,
            }
          : acc
      )
    );

    addNotification(
      'Upgrade Kartu Disetujui! 🌟',
      `Selamat! Permohonan upgrade kartu Anda ke ${CARD_TIER_CONFIGS[upgrade.requestedTier].nameIndo} telah disetujui Admin. Batas tarik tunai harian Anda kini menjadi Rp ${CARD_TIER_CONFIGS[upgrade.requestedTier].dailyWithdrawalLimit.toLocaleString('id-ID')}.`,
      'success'
    );

    try {
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.5 } });
    } catch { /* empty */ }

    playAtmSound('success');
    return { success: true, message: `Kartu ${upgrade.applicantName} berhasil diupgrade ke ${CARD_TIER_CONFIGS[upgrade.requestedTier].nameIndo}!` };
  };

  const adminRejectUpgrade = (upgradeId: string, reason: string) => {
    const upgrade = cardUpgrades.find((u) => u.id === upgradeId);
    if (!upgrade) return { success: false, message: 'Data pengajuan tidak ditemukan' };

    setCardUpgrades((prev) =>
      prev.map((u) =>
        u.id === upgradeId
          ? { ...u, status: 'rejected', decidedAt: new Date().toISOString(), adminNotes: reason }
          : u
      )
    );

    addNotification(
      'Upgrade Kartu Ditolak ⚠️',
      `Permohonan upgrade ke ${CARD_TIER_CONFIGS[upgrade.requestedTier].nameIndo} belum dapat disetujui. Alasan: ${reason}.`,
      'alert'
    );

    return { success: true, message: 'Permohonan upgrade kartu telah ditolak.' };
  };

  /**
   * Nusantara PayChat
   */
  const sendChatMessage = (input: SendChatInput) => {
    if (!currentAccount) return;
    const newMsg: ChatMessage = {
      id: `chat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderAccount: currentAccount.accountNumber,
      senderName: currentAccount.fullName,
      recipientAccount: input.recipientAccount,
      recipientName: input.recipientName,
      text: input.text,
      timestamp: new Date().toISOString(),
      transferAttachment: input.transferAttachment,
    };

    setChats((prev) => [...prev, newMsg]);
  };

  /**
   * Celengan Impian (Pocket Savings)
   */
  const addPocket = (data: Omit<PocketSaving, 'id' | 'accountId' | 'currentAmount'>) => {
    if (!currentAccount) return;
    const newPocket: PocketSaving = {
      ...data,
      id: `pkt-${Date.now()}`,
      accountId: currentAccount.id,
      currentAmount: 0,
    };
    setPockets((prev) => [newPocket, ...prev]);
    addNotification('Celengan Impian Dibuat 🎯', `Target tabungan "${data.title}" berhasil dibuat!`, 'success');
  };

  const depositToPocket = (pocketId: string, amount: number) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };
    if (amount <= 0 || currentAccount.balance < amount) {
      return { success: false, message: 'Saldo rekening utama tidak mencukupi!' };
    }

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, balance: acc.balance - amount } : acc))
    );

    setPockets((prev) =>
      prev.map((pkt) => (pkt.id === pocketId ? { ...pkt, currentAmount: pkt.currentAmount + amount } : pkt))
    );

    const tx: Transaction = {
      id: `tx-pkt-in-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'celengan_simpan',
      title: 'Menabung ke Celengan Impian',
      amount,
      status: 'success',
      referenceNo: `PKT${Date.now()}`,
      timestamp: new Date().toISOString(),
      balanceDeducted: true,
      category: 'investasi',
    };
    setTransactions((prev) => [tx, ...prev]);

    playAtmSound('success');
    return { success: true, message: `Berhasil menabung Rp ${amount.toLocaleString('id-ID')} ke celengan! Saldo utama Anda telah dikurangi.` };
  };

  const withdrawFromPocket = (pocketId: string, amount: number) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };
    const pocket = pockets.find((p) => p.id === pocketId);
    if (!pocket || pocket.currentAmount < amount) {
      return { success: false, message: 'Saldo celengan tidak mencukupi untuk ditarik!' };
    }

    setPockets((prev) =>
      prev.map((pkt) => (pkt.id === pocketId ? { ...pkt, currentAmount: pkt.currentAmount - amount } : pkt))
    );

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, balance: acc.balance + amount } : acc))
    );

    const tx: Transaction = {
      id: `tx-pkt-out-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'celengan_tarik',
      title: 'Pencairan dari Celengan Impian',
      amount,
      status: 'success',
      referenceNo: `PKT${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'investasi',
    };
    setTransactions((prev) => [tx, ...prev]);

    playAtmSound('cash');
    return { success: true, message: `Berhasil menarik Rp ${amount.toLocaleString('id-ID')} kembali ke rekening utama!` };
  };

  /**
   * Deposito Berjangka Online
   */
  const openDeposito = (principalAmount: number, tenorMonths: number) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };
    if (principalAmount < 5_000_000) {
      return { success: false, message: 'Minimal penempatan deposito berjangka adalah Rp 5.000.000' };
    }
    if (currentAccount.balance < principalAmount) {
      return { success: false, message: 'Saldo rekening tidak mencukupi untuk membuka deposito!' };
    }

    const featCfg = getFeatureConfig('deposito');
    const requiresApproval = featCfg ? featCfg.requireAdminApproval : true;

    const annualRate = 0.0575;
    const projectedReturn = Math.round((principalAmount * annualRate * tenorMonths) / 12);
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + tenorMonths);

    const newDepo: DepositoRecord = {
      id: `depo-${Date.now()}`,
      accountId: currentAccount.id,
      principalAmount,
      tenorMonths,
      interestRateAnnual: annualRate,
      maturityDate: maturity.toISOString().split('T')[0],
      projectedReturn,
      certificateNumber: `DEP-NUS-${Date.now()}`,
      status: 'active',
      openedAt: new Date().toISOString(),
    };

    const isAdminCard = currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    // Deduct balance immediately (or keep ∞ for Kartu Admin)!
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === currentAccount.id
          ? { ...acc, balance: isAdminCard ? UNLIMITED_BALANCE : acc.balance - principalAmount }
          : acc
      )
    );

    setDepositos((prev) => [newDepo, ...prev]);

    const tx: Transaction = {
      id: `tx-depo-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'deposito_buka',
      title: requiresApproval
        ? `Pembukaan Deposito Berjangka ${tenorMonths} Bulan (Sedang Diproses)`
        : `Pembukaan Deposito Berjangka ${tenorMonths} Bulan`,
      amount: principalAmount,
      senderAccount: currentAccount.accountNumber,
      senderName: currentAccount.fullName,
      recipientAccount: newDepo.certificateNumber,
      recipientName: 'Deposito Bank Nusantara',
      description: requiresApproval
        ? 'Penempatan Deposito Berjangka • Sedang Diproses'
        : 'Penempatan Deposito Berjangka Aktif',
      status: requiresApproval ? 'pending' : 'success',
      referenceNo: newDepo.certificateNumber,
      timestamp: new Date().toISOString(),
      balanceDeducted: true,
      requiresBuyerApproval: true,
      buyerApprovalStatus: requiresApproval ? 'waiting_admin' : 'waiting_buyer',
      featureId: 'deposito',
      category: 'investasi',
    };
    setTransactions((prev) => [tx, ...prev]);

    addNotification(
      requiresApproval ? 'Deposito Sedang Diproses ⏳' : 'Sertifikat Deposito Terbit 📜',
      requiresApproval
        ? `Penempatan Deposito (${newDepo.certificateNumber}) sebesar Rp ${principalAmount.toLocaleString('id-ID')} saat ini sedang diproses.`
        : `Deposito sebesar Rp ${principalAmount.toLocaleString('id-ID')} (${tenorMonths} bulan) berhasil ditempatkan.`,
      requiresApproval ? 'info' : 'success'
    );

    playAtmSound('success');
    return {
      success: true,
      message: requiresApproval
        ? `Pembukaan Deposito Rp ${principalAmount.toLocaleString('id-ID')} berhasil diajukan dan saat ini SEDANG DIPROSES!`
        : `Deposito berjangka Rp ${principalAmount.toLocaleString('id-ID')} berhasil dibuka!`,
    };
  };

  /**
   * Tarik Tunai Tanpa Kartu (Cardless Cash)
   * Sesuai permintaan: Sebelum disetujui Admin, meskipun sudah dibeli/diajukan, kodenya JANGAN ditampilkan terlebih dahulu!
   */
  const createCardlessToken = (amount: number, pin: string) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };
    if (currentAccount.pin !== pin) {
      playAtmSound('alert');
      return { success: false, message: 'PIN kartu salah!' };
    }
    if (currentAccount.balance < amount) {
      playAtmSound('alert');
      return { success: false, message: 'Saldo rekening tidak mencukupi!' };
    }

    const featCfg = getFeatureConfig('cardless');
    const requiresApproval = featCfg ? featCfg.requireAdminApproval : true;
    const isAdminCard = currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);
    const newBalance = isAdminCard ? UNLIMITED_BALANCE : currentAccount.balance - amount;

    // Potong saldo langsung saat pengajuan kode tarik tunai tanpa kartu (Kartu Admin tetap ∞)
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, balance: newBalance } : acc))
    );

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const token: CardlessToken = {
      id: `cdl-${Date.now()}`,
      accountId: currentAccount.id,
      tokenCode: code,
      amount,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      status: 'active',
      adminApproved: !requiresApproval,
    };

    setCardlessTokens((prev) => [token, ...prev]);

    const tx: Transaction = {
      id: `tx-cdl-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'cardless_withdraw',
      title: requiresApproval
        ? `Kode Tarik Tunai Tanpa Kartu (Sedang Diproses)`
        : `Kode Tarik Tunai Tanpa Kartu (Cardless)`,
      amount,
      senderAccount: currentAccount.accountNumber,
      senderName: currentAccount.fullName,
      recipientAccount: 'ATM-CARDLESS',
      recipientName: currentAccount.fullName,
      description: requiresApproval
        ? 'Permintaan Kode Tarik Tunai Sedang Diproses • Kode Akan Muncul Setelah Proses Selesai'
        : `Kode Tarik Tunai Resmi: ${code} • Berlaku di ATM Bank Nusantara`,
      status: requiresApproval ? 'pending' : 'success',
      referenceNo: `CDL${Date.now()}`,
      timestamp: new Date().toISOString(),
      balanceDeducted: true,
      generatedCode: code,
      featureId: 'cardless',
      category: 'tarik_tunai',
    };
    setTransactions((prev) => [tx, ...prev]);

    if (requiresApproval) {
      addNotification(
        'Permintaan Kode Cardless Sedang Diproses ⏳',
        `Permintaan tarik tunai tanpa kartu sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses. Kode akan segera muncul setelah proses selesai.`,
        'info'
      );
      playAtmSound('beep');
      return {
        success: true,
        requiresApproval: true,
        message: `Permintaan tarik tunai Rp ${amount.toLocaleString('id-ID')} sedang diproses! Kode Tarik Tunai akan ditampilkan setelah proses selesai.`,
      };
    }

    addNotification(
      'Kode Tarik Tunai Dibuat 📱',
      `Kode penarikan tanpa kartu: ${code} (Berlaku 30 menit di seluruh ATM Nusantara).`,
      'success'
    );
    playAtmSound('success');

    return {
      success: true,
      requiresApproval: false,
      message: 'Kode tarik tunai berhasil dibuat!',
      token,
    };
  };

  /**
   * Pembayaran Tagihan & 60+ Fitur Digital (PLN, Pulsa, BPJS, PDAM/Air, Pajak, E-Wallet, Voucher, Donasi, dll.)
   * PERBAIKAN UTAMA SESUAI PERMINTAAN USER:
   * 1. Saat membeli barang/tagihan, SALDO LANGSUNG BERKURANG saat itu juga (atau tetap ∞ jika Kartu Admin)!
   * 2. JANGAN beri tahu nasabah bahwa transaksi "membutuhkan persetujuan admin" — cukup beri tahu bahwa transaksi "SEDANG DIPROSES"!
   * 3. Hanya fitur yang memang ditukar pakai kode (Pulsa / Paket Data, Token Listrik Prabayar, Voucher Game) yang menghasilkan Kode Tukar (dan disembunyikan selama sedang diproses).
   * 4. Untuk pembelian yang TIDAK BISA DITUKAR KODE (seperti Beli Air / PDAM, Tagihan Listrik Pascabayar, BPJS, Makanan, E-Wallet, Pajak, Internet, dll.),
   *    JANGAN tampilkan kode! Gunakan mekanisme PERSETUJUAN PEMBELI setelah disetujui Admin!
   */
  const payBill = (
    type: TransactionType,
    title: string,
    amount: number,
    customerId: string,
    category = 'tagihan',
    featureId?: string
  ): PayBillResult => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };
    if (currentAccount.cardStatus === 'banned') {
      playAtmSound('alert');
      return {
        success: false,
        message: `Kartu Anda sedang di-BANNED (${currentAccount.banInfo?.durationType === 'permanent' ? 'PERMANEN' : currentAccount.banInfo?.durationLabel || 'Sementara'}). Transaksi tidak dapat dilakukan.`,
      };
    }
    if (amount <= 0) return { success: false, message: 'Nominal pembayaran tidak valid!' };

    const isAdminCard = currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isAdminCard && currentAccount.balance < amount) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Saldo rekening tidak cukup! Saldo Anda Rp ${currentAccount.balance.toLocaleString('id-ID')}, sedangkan total pembayaran Rp ${amount.toLocaleString('id-ID')}.`,
      };
    }

    const resolvedFeatureId =
      featureId ||
      (type === 'tagihan_listrik'
        ? 'pln'
        : type === 'tagihan_pulsa'
        ? 'pulsa'
        : type === 'tagihan_pdam'
        ? 'pdam'
        : type === 'tagihan_bpjs'
        ? 'bpjs'
        : type === 'topup_ewallet'
        ? 'ewallet'
        : type === 'qris_pay'
        ? 'qris'
        : 'belanja_fitur');

    const featCfg = getFeatureConfig(resolvedFeatureId);
    const requiresApproval = featCfg ? featCfg.requireAdminApproval : true;

    const previousBalance = currentAccount.balance;
    const newBalance = isAdminCard ? UNLIMITED_BALANCE : currentAccount.balance - amount;

    // 1. LANGSUNG KURANGI SALDO NASABAH SAAT PEMBELIAN (Kartu Admin tetap ∞ / Tidak Terbatas)!
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === currentAccount.id
          ? {
              ...acc,
              balance: newBalance,
              rewardPoints: isAdminCard ? UNLIMITED_BALANCE : (acc.rewardPoints || 0) + 10,
            }
          : acc
      )
    );

    // 2. Cek apakah item ini adalah produk yang punya Kode Tukar (Token Listrik Prabayar, Pulsa/Paket Data, atau Voucher Game)
    //    Atau produk Non-Kode (seperti Beli Air / PDAM, Tagihan Pascabayar, BPJS, Kuliner, E-Wallet, QRIS, Resi, dll.)
    //    yang menggunakan PERSETUJUAN PEMBELI setelah disetujui Admin!
    const lowerTitle = title.toLowerCase();
    const isPlnToken =
      (type === 'tagihan_listrik' || resolvedFeatureId === 'pln') &&
      !lowerTitle.includes('pascabayar') &&
      !lowerTitle.includes('tagihan listrik');
    const isPulsaVoucher =
      type === 'tagihan_pulsa' ||
      resolvedFeatureId === 'pulsa' ||
      resolvedFeatureId === 'paket_data' ||
      resolvedFeatureId === 'roaming';
    const isGameVoucher = resolvedFeatureId === 'voucher_game';

    const isRedeemableCodeProduct = isPlnToken || isPulsaVoucher || isGameVoucher;
    const requiresBuyerApproval = !isRedeemableCodeProduct;

    let tokenNumber: string | undefined = undefined;
    let voucherCode: string | undefined = undefined;
    let pendingCodeType: 'token_listrik' | 'pulsa' | 'voucher_lain' | undefined = undefined;

    if (isPlnToken) {
      tokenNumber = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      pendingCodeType = 'token_listrik';
      const kwh = Number((amount / 1460).toFixed(1));
      const newVc: PurchasedVoucherCode = {
        id: `vc-pln-${Date.now()}`,
        accountId: currentAccount.id,
        accountNumber: currentAccount.accountNumber,
        fullName: currentAccount.fullName,
        type: 'token_listrik',
        code: tokenNumber,
        providerOrMeter: `ID Pel PLN: ${customerId}`,
        nominal: amount,
        kwhAmount: kwh,
        status: 'available',
        adminApproved: !requiresApproval,
        purchasedAt: new Date().toISOString(),
      };
      setPurchasedCodes((prev) => [newVc, ...prev]);
    } else if (isPulsaVoucher) {
      voucherCode = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      pendingCodeType = 'pulsa';
      const newVc: PurchasedVoucherCode = {
        id: `vc-pls-${Date.now()}`,
        accountId: currentAccount.id,
        accountNumber: currentAccount.accountNumber,
        fullName: currentAccount.fullName,
        type: 'pulsa',
        code: voucherCode,
        providerOrMeter: customerId,
        nominal: amount,
        status: 'available',
        adminApproved: !requiresApproval,
        purchasedAt: new Date().toISOString(),
      };
      setPurchasedCodes((prev) => [newVc, ...prev]);
    } else if (isGameVoucher) {
      voucherCode = `VCR-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
      pendingCodeType = 'voucher_lain';
      const newVc: PurchasedVoucherCode = {
        id: `vc-gam-${Date.now()}`,
        accountId: currentAccount.id,
        accountNumber: currentAccount.accountNumber,
        fullName: currentAccount.fullName,
        type: 'voucher_lain',
        code: voucherCode,
        providerOrMeter: `${title} (${customerId})`,
        nominal: amount,
        status: 'available',
        adminApproved: !requiresApproval,
        purchasedAt: new Date().toISOString(),
      };
      setPurchasedCodes((prev) => [newVc, ...prev]);
    }

    const refNo = `PAY${Date.now()}`;
    const generatedCodeStr = tokenNumber || voucherCode;

    const tx: Transaction = {
      id: `tx-bill-${Date.now()}`,
      accountId: currentAccount.id,
      type,
      title: requiresApproval ? `${title} (Sedang Diproses)` : title,
      amount,
      senderAccount: currentAccount.accountNumber,
      senderName: currentAccount.fullName,
      recipientAccount: customerId,
      recipientName: customerId,
      description: requiresApproval
        ? requiresBuyerApproval
          ? 'Pesanan Sedang Diproses • Konfirmasi Persetujuan Pembeli Akan Muncul Setelah Proses Selesai'
          : 'Pesanan Sedang Diproses • Kode Tukar Akan Muncul Setelah Proses Selesai'
        : generatedCodeStr
        ? `Kode Resmi Anda: ${generatedCodeStr} • Pembelian Lunas`
        : requiresBuyerApproval
        ? `${title} • Menunggu Konfirmasi Persetujuan Pembeli`
        : `${title} • Pembayaran Lunas`,
      status: requiresApproval ? 'pending' : 'success',
      referenceNo: refNo,
      timestamp: new Date().toISOString(),
      balanceDeducted: true,
      generatedCode: generatedCodeStr,
      requiresBuyerApproval,
      buyerApprovalStatus: requiresBuyerApproval
        ? requiresApproval
          ? 'waiting_admin'
          : 'waiting_buyer'
        : undefined,
      featureId: resolvedFeatureId,
      category: category as any,
    };

    setTransactions((prev) => [tx, ...prev]);

    const sisaSaldoText = isAdminCard ? '∞ (Tidak Terbatas)' : formatRupiah(newBalance);

    if (requiresApproval) {
      addNotification(
        'Transaksi Sedang Diproses ⏳',
        requiresBuyerApproval
          ? `Pembayaran "${title}" sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses (Sisa Saldo: ${sisaSaldoText}). Setelah proses selesai, Anda dapat menekan tombol Persetujuan Pembeli untuk menyelesaikan pesanan.`
          : `Pembelian "${title}" sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses (Sisa Saldo: ${sisaSaldoText}). Kode tukar akan otomatis muncul setelah proses selesai.`,
        'info'
      );
    } else {
      addNotification(
        requiresBuyerApproval ? 'Pesanan Siap Dikonfirmasi Pembeli ✅' : 'Pembelian & Pembayaran Berhasil ✅',
        requiresBuyerApproval
          ? `Transaksi "${title}" sebesar Rp ${amount.toLocaleString('id-ID')} siap dikonfirmasi! Silakan klik "Setujui Pesanan (Persetujuan Pembeli)" pada daftar pesanan Anda.`
          : `Transaksi "${title}" sebesar Rp ${amount.toLocaleString('id-ID')} berhasil diproses! Sisa saldo Anda: ${sisaSaldoText}.${generatedCodeStr ? ` Kode Anda: ${generatedCodeStr}` : ''}`,
        'success'
      );
    }

    playAtmSound('success');

    return {
      success: true,
      message: requiresApproval
        ? requiresBuyerApproval
          ? `Transaksi "${title}" berhasil diajukan dan saat ini SEDANG DIPROSES! Saldo terpotong Rp ${amount.toLocaleString('id-ID')} (Sisa Saldo: ${sisaSaldoText}). Setelah diproses, silakan berikan Persetujuan Pembeli Anda.`
          : `Transaksi "${title}" berhasil diajukan dan saat ini SEDANG DIPROSES! Saldo terpotong Rp ${amount.toLocaleString('id-ID')} (Sisa Saldo: ${sisaSaldoText}). Kode akan muncul setelah proses selesai.`
        : requiresBuyerApproval
        ? `Pembayaran berhasil! Silakan klik tombol Persetujuan Pembeli untuk mengonfirmasi penerimaan "${title}".`
        : `Pembayaran berhasil! Saldo Anda telah berkurang Rp ${amount.toLocaleString('id-ID')} (Sisa Saldo: ${sisaSaldoText}).`,
      tokenNumber: requiresApproval ? undefined : tokenNumber,
      voucherCode: requiresApproval ? undefined : voucherCode,
      requiresApproval,
      requiresBuyerApproval,
      hasPendingCode: Boolean(generatedCodeStr),
      pendingCodeType,
      previousBalance,
      newBalance,
      amountDeducted: amount,
      transaction: tx,
    };
  };

  const updateCardSpendingLimit = (newLimit: number) => {
    if (!currentAccount) return;
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, customSpendingLimit: newLimit } : acc))
    );
    addNotification('Limit Belanja Diperbarui ⚙️', `Batas transaksi belanja harian kartu Anda diatur ke Rp ${newLimit.toLocaleString('id-ID')}.`, 'info');
  };

  const toggleInternationalUsage = () => {
    if (!currentAccount) return;
    const nextVal = !currentAccount.allowInternational;
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, allowInternational: nextVal } : acc))
    );
    addNotification(
      'Transaksi Luar Negeri 🌐',
      nextVal ? 'Fitur transaksi luar negeri kartu Mandiri Debit Anda AKTIF.' : 'Fitur transaksi luar negeri dinonaktifkan.',
      'info'
    );
  };

  /**
   * Pendaftaran Kartu Baru -> Bikin Kartu Biasa (Reguler) secara default!
   */
  const registerCard = (data: RegisterCardInput) => {
    const existingAccountsNumbers = accounts.map((a) => a.accountNumber);
    const tempAccountNum = generateRandomAccountNumber(existingAccountsNumbers);
    const newCardNumber = generateRandomCardNumber();
    const newCVV = generateRandomCVV();
    const finalTier: CardTier = data.cardTier || 'regular';
    const expiry = generateExpiryDate(CARD_TIER_CONFIGS[finalTier].validityYears);

    const newAccount: BankAccount = {
      id: `acc-${Date.now()}`,
      accountNumber: tempAccountNum,
      fullName: data.fullName.trim(),
      nik: data.nik.trim(),
      phone: data.phone.trim(),
      email: data.email.trim(),
      address: data.address.trim(),
      pin: data.pin.trim(),
      balance: 0,
      cardTier: finalTier,
      cardNumber: newCardNumber,
      cvv: newCVV,
      expiryDate: expiry,
      cardStatus: 'pending',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: data.initialDeposit,
      createdAt: new Date().toISOString(),
      rewardPoints: 100,
      allowInternational: false,
      googleEmail: googleUser?.email || data.email.trim(),
      hasCompletedTutorial: false,
      tutorialApprovedByAdmin: false,
    };

    setAccounts((prev) => [newAccount, ...prev]);
    setCurrentAccountIdState(newAccount.id);
    if (googleUser && !googleUser.hasCompletedOnboarding) {
      setGoogleUser({ ...googleUser, hasCompletedOnboarding: true });
    }

    addNotification(
      'Permohonan Kartu Baru Menunggu Persetujuan Admin ⏳',
      `Pembuatan ${CARD_TIER_CONFIGS[finalTier].nameIndo} atas nama ${data.fullName} berhasil diajukan! Pembuatan kartu harus disetujui Admin terlebih dahulu di Panel Admin sebelum Tutorial Lengkap Aplikasi terbuka.`,
      'info'
    );

    return {
      success: true,
      message:
        'Permohonan kartu baru berhasil dikirim! Pembuatan kartu harus disetujui Admin dulu di Panel Admin baru Tutorial Lengkap terbuka.',
      accountId: newAccount.id,
    };
  };

  const markTutorialCompleted = (accountId?: string) => {
    const targetId = accountId || currentAccount?.id;
    if (!targetId) return;
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === targetId
          ? {
              ...acc,
              hasCompletedTutorial: true,
              tutorialApprovedByAdmin: true,
            }
          : acc
      )
    );
  };

  const adminApproveCard = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };

    const existingNumbers = accounts.filter((a) => a.id !== accountId).map((a) => a.accountNumber);
    const finalAccountNumber = generateRandomAccountNumber(existingNumbers);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            accountNumber: finalAccountNumber,
            cardStatus: 'active',
            balance: acc.initialDeposit,
            rejectionReason: undefined,
            tutorialApprovedByAdmin: true,
            hasCompletedTutorial: false,
          };
        }
        return acc;
      })
    );

    const depositTx: Transaction = {
      id: `tx-init-${Date.now()}`,
      accountId: accountId,
      type: 'setor',
      title: 'Setoran Awal Pembukaan Rekening',
      amount: target.initialDeposit,
      recipientAccount: finalAccountNumber,
      recipientName: target.fullName,
      description: `Setoran awal pembukaan ${CARD_TIER_CONFIGS[target.cardTier].nameIndo}`,
      status: 'success',
      referenceNo: `SET${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'setor_tunai',
    };
    setTransactions((prev) => [depositTx, ...prev]);

    addNotification(
      '🎓 Kartu Disetujui Admin & Tutorial Lengkap Terbuka! 🎉',
      `Selamat! Pembuatan ${CARD_TIER_CONFIGS[target.cardTier].nameIndo} (${finalAccountNumber}) telah disetujui Admin. Tutorial Lengkap Seluruh Tombol & Fitur kini terbuka untuk kartu Anda!`,
      'success'
    );

    // Otomatis buka Tutorial Lengkap begitu pembuatan kartu disetujui Admin!
    setIsTutorialModalOpen(true);

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { /* empty */ }

    playAtmSound('success');
    return {
      success: true,
      message: `Kartu ${target.fullName} berhasil disetujui Admin & Tutorial Lengkap Aplikasi telah dibuka!`,
    };
  };

  const adminRejectCard = (accountId: string, reason: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            cardStatus: 'rejected',
            rejectionReason: reason || 'Dokumen identitas tidak memenuhi syarat verifikasi.',
          };
        }
        return acc;
      })
    );

    addNotification(
      'Permohonan Kartu Ditolak ❌',
      `Permohonan kartu Anda belum dapat disetujui. Alasan: ${reason}. Anda dapat memperbaiki data dan mengajukan kembali.`,
      'alert'
    );

    playAtmSound('alert');
    return { success: true, message: `Permohonan ${target.fullName} telah ditolak.` };
  };

  const toggleCardFreezeWithPin = (accountId: string, pin: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };

    if (target.pin !== pin) {
      playAtmSound('alert');
      return { success: false, message: 'Kode PIN kartu salah! Tindakan keamanan dibatalkan.' };
    }

    const nextStatus: CardStatus = target.cardStatus === 'active' ? 'frozen' : 'active';
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          return { ...acc, cardStatus: nextStatus };
        }
        return acc;
      })
    );

    if (nextStatus === 'frozen') {
      addNotification(
        'Kartu Berhasil Dikunci 🔐',
        'Kartu ATM Mandiri Debit Anda berhasil dikunci sementara dengan verifikasi PIN.',
        'warning'
      );
      playAtmSound('alert');
      return { success: true, message: 'Kartu ATM Debit berhasil dikunci sementara!', newStatus: nextStatus };
    } else {
      addNotification(
        'Blokir Kartu Dibuka 🔓',
        'Kartu ATM Mandiri Debit Anda telah dibuka blokirnya dengan verifikasi PIN.',
        'success'
      );
      playAtmSound('success');
      return { success: true, message: 'Blokir kartu berhasil dibuka!', newStatus: nextStatus };
    }
  };

  const regenerateAccountNumberWithPin = (accountId: string, pin: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };
    // Terima PIN Kartu ATAU Kode Admin (159357)
    if (target.pin !== pin && pin !== '159357') {
      playAtmSound('alert');
      return { success: false, message: 'Kode PIN / Kode Admin salah!' };
    }

    const existingNumbers = accounts.map((a) => a.accountNumber);
    const newNumber = generateRandomAccountNumber(existingNumbers);

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, accountNumber: newNumber } : acc))
    );

    addNotification(
      'Nomor Rekening Baru Diterbitkan 🔄',
      `Sistem Bank Nusantara telah secara otomatis mengacak nomor rekening baru Anda: ${newNumber}.`,
      'info'
    );

    playAtmSound('success');
    return { success: true, message: 'Nomor rekening baru berhasil diacak oleh sistem!', newAccountNumber: newNumber };
  };

  /**
  /**
   * LOGIN / PINDAH KE KARTU LAMA MENGGUNAKAN PIN KARTU LAMA (6 DIGIT PIN KARTU, BUKAN PIN ADMIN!)
   * Sesuai permintaan user:
   * "Jika kita lupa, untuk ganti contohnya aku kan mau ganti ke kartu ku yang lama, itu tuh pakai pin kartu bukan pakai pin admin, tapi pakai pin kartu kita yang lama.
   * Contohnya aku kan punya kartu baru dan juga kartu lama. Nah, kartu barunya aku mau aku login. Nah, aku mau login ke kartu lama. Nah, itu juga kita membutuhkan kita harus tahu pin kartu lama kita."
   */
  const loginToCardWithPin = (targetAccountId: string, cardPin: string) => {
    const targetAcc = accounts.find((a) => a.id === targetAccountId);
    if (!targetAcc) {
      playAtmSound('alert');
      return { success: false, message: 'Kartu tujuan tidak ditemukan!' };
    }

    if (targetAcc.pin !== cardPin.trim()) {
      playAtmSound('alert');
      return {
        success: false,
        message: `PIN Kartu salah! Untuk masuk/ganti ke kartu ${targetAcc.fullName} (${targetAcc.accountNumber}), Anda harus memasukkan 6 digit PIN Kartu tersebut. Jika lupa PIN, klik tombol "Lupa PIN Kartu?" untuk ditinjau Admin.`,
      };
    }

    setCurrentAccountIdState(targetAcc.id);
    if (googleUser && !googleUser.hasCompletedOnboarding) {
      setGoogleUser({ ...googleUser, hasCompletedOnboarding: true });
    }

    addNotification(
      'Berhasil Login ke Kartu Anda! 💳',
      `Anda telah berhasil masuk ke kartu milik ${targetAcc.fullName} (No. Rekening: ${targetAcc.accountNumber}) menggunakan verifikasi 6 digit PIN Kartu.`,
      'success'
    );
    playAtmSound('success');

    return {
      success: true,
      message: `Berhasil login ke kartu ${targetAcc.fullName} (${targetAcc.accountNumber}) menggunakan PIN Kartu!`,
    };
  };

  /**
   * GANTI JENIS KARTU TANPA HARUS MEMBUAT KARTU BARU
   * Cukup memasukkan Kode Admin (159357)
   */
  const switchCardWithAdminCode = (input: {
    adminCode: string;
    targetAccountId?: string;
    targetCardTier?: CardTier;
    regenerateCardDigits?: boolean;
  }) => {
    if (input.adminCode.trim() !== '159357') {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Kode Admin salah! Masukkan 6 digit Kode Admin resmi.',
      };
    }

    // 1. Jika ingin pindah/ganti ke akun kartu lain yang sudah terdaftar
    if (input.targetAccountId) {
      const targetAcc = accounts.find((a) => a.id === input.targetAccountId);
      if (!targetAcc) {
        return { success: false, message: 'Kartu tujuan tidak ditemukan!' };
      }
      setCurrentAccountIdState(targetAcc.id);

      // Jika sekaligus ingin mengubah jenis kartu pada akun tersebut
      if (input.targetCardTier && input.targetCardTier !== targetAcc.cardTier) {
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.id === targetAcc.id
              ? {
                  ...acc,
                  cardTier: input.targetCardTier!,
                  cardNumber: input.regenerateCardDigits ? generateRandomCardNumber() : acc.cardNumber,
                }
              : acc
          )
        );
      }

      addNotification(
        'Berhasil Ganti Kartu! 💳',
        `Kartu aktif berhasil diganti ke kartu milik ${targetAcc.fullName} (${targetAcc.accountNumber}).`,
        'success'
      );
      playAtmSound('success');
      return {
        success: true,
        message: `Berhasil pindah ke kartu ${targetAcc.fullName} (${targetAcc.accountNumber})!`,
      };
    }

    // 2. Jika ingin mengganti kartu saat ini ke jenis kartu lain (Biasa / Emas / Premium / Platinum / Admin ∞) tanpa membuat kartu dari awal
    if (!currentAccount) {
      return { success: false, message: 'Tidak ada kartu aktif!' };
    }

    const nextTier = input.targetCardTier || currentAccount.cardTier;
    const nextCardNumber = input.regenerateCardDigits ? generateRandomCardNumber() : currentAccount.cardNumber;
    const nextCvv = input.regenerateCardDigits ? generateRandomCVV() : currentAccount.cvv;
    const tierCfg = CARD_TIER_CONFIGS[nextTier];

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === currentAccount.id
          ? {
              ...acc,
              cardTier: nextTier,
              balance: nextTier === 'admin' ? UNLIMITED_BALANCE : acc.balance,
              cardNumber: nextCardNumber,
              cvv: nextCvv,
              cardStatus: acc.cardStatus === 'pending' || acc.cardStatus === 'rejected' ? 'active' : acc.cardStatus,
            }
          : acc
      )
    );

    addNotification(
      'Kartu Berhasil Diganti via Kode Admin! ✨',
      `Kartu Anda telah langsung diganti menjadi ${tierCfg.nameIndo} (Limit Tarik: ${formatRupiah(tierCfg.dailyWithdrawalLimit)}/hari) menggunakan Kode Admin tanpa perlu membuat kartu baru.`,
      'success'
    );
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');

    return {
      success: true,
      message: `Kartu berhasil diganti ke ${tierCfg.nameIndo} menggunakan Kode Admin tanpa perlu membuat kartu baru!`,
    };
  };

  /**
   * FITUR BANNED KARTU DI PANEL ADMIN + AUTO-UNBAN TIMER 1 DETIK REAL-TIME
   * - Alasan bersifat opsional di Panel Admin
   * - Durasi bisa diatur Custom (menit/jam/hari) atau Permanen
   * - Jika Custom (misal 1 menit), begitu waktu habis kartu OTOMATIS TERBUKA dan memunculkan NOTIFIKASI SISTEM WEBSITE yang bisa ditutup!
   */
  useEffect(() => {
    const checkExpiredBans = () => {
      const now = Date.now();
      const expiredList = accounts.filter(
        (acc) =>
          acc.cardStatus === 'banned' &&
          acc.banInfo?.durationType === 'custom' &&
          acc.banInfo?.expiresAt &&
          now >= new Date(acc.banInfo.expiresAt).getTime()
      );

      if (expiredList.length > 0) {
        setAccounts((prev) =>
          prev.map((acc) =>
            expiredList.some((exp) => exp.id === acc.id)
              ? { ...acc, cardStatus: 'active', banInfo: undefined }
              : acc
          )
        );

        const newPopups: WebsiteSystemPopupNotification[] = expiredList.map((unbannedAcc) => {
          const prevDurationLabel = unbannedAcc.banInfo?.durationLabel || '1 Menit';
          return {
            id: `sys-unban-auto-${Date.now()}-${unbannedAcc.id}`,
            type: 'unban',
            title: '🔓 KARTU ANDA TELAH TERBUKA KEMBALI!',
            subtitle: 'NOTIFIKASI RESMI DARI SISTEM WEBSITE BANK NUSANTARA',
            message: `Pemberitahuan Sistem Website: Masa Banned kartu ATM Anda atas nama ${unbannedAcc.fullName} (No. Rekening: ${unbannedAcc.accountNumber}) dengan durasi "${prevDurationLabel}" telah habis. Saat ini kartu Anda adalah TERBUKA (AKTIF) dan sudah dapat digunakan kembali seperti semula!`,
            accountId: unbannedAcc.id,
            accountName: unbannedAcc.fullName,
            accountNumber: unbannedAcc.accountNumber,
            cardTier: unbannedAcc.cardTier,
            timestamp: new Date().toISOString(),
            dismissed: false,
          };
        });

        setWebsitePopups((prev) => [...newPopups, ...prev]);

        expiredList.forEach((unbannedAcc) => {
          const prevDurationLabel = unbannedAcc.banInfo?.durationLabel || 'Sementara';
          addNotification(
            '🔓 Sistem Website: Kartu Anda Telah Terbuka!',
            `Durasi Banned (${prevDurationLabel}) untuk kartu ${unbannedAcc.fullName} (${unbannedAcc.accountNumber}) telah selesai. Kartu Anda kini kembali TERBUKA & AKTIF!`,
            'success'
          );
        });

        try {
          confetti({ particleCount: 75, spread: 65, origin: { y: 0.6 } });
        } catch { /* empty */ }
        playAtmSound('success');
      }
    };

    checkExpiredBans();
    const intervalId = setInterval(checkExpiredBans, 1000);
    return () => clearInterval(intervalId);
  }, [accounts]);

  const adminBanCard = (input: {
    accountId: string;
    reason?: string;
    durationType: 'custom' | 'permanent';
    durationMinutes?: number;
    durationLabel?: string;
  }) => {
    const target = accounts.find((a) => a.id === input.accountId);
    if (!target) return { success: false, message: 'Kartu nasabah tidak ditemukan!' };

    const now = Date.now();
    const mins = input.durationType === 'custom' ? Math.max(0.1, input.durationMinutes || 1) : undefined;
    const expiresAt = mins ? new Date(now + mins * 60 * 1000).toISOString() : undefined;
    const cleanReason = input.reason?.trim() || undefined;
    const label =
      input.durationType === 'permanent'
        ? 'PERMANEN (Tidak Dapat Ditinjau Lagi)'
        : input.durationLabel || `${mins} Menit`;

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === input.accountId
          ? {
              ...acc,
              cardStatus: 'banned',
              banInfo: {
                isBanned: true,
                reason: cleanReason,
                durationType: input.durationType,
                durationMinutes: mins,
                durationLabel: label,
                bannedAt: new Date(now).toISOString(),
                expiresAt,
                appealStatus: 'none',
              },
            }
          : acc
      )
    );

    addNotification(
      `🚫 Kartu Di-BANNED (${input.durationType === 'permanent' ? 'PERMANEN' : label})`,
      `Kartu ${target.fullName} (${target.accountNumber}) telah di-BANNED oleh Admin.${cleanReason ? ` Alasan: "${cleanReason}".` : ' (Tanpa alasan spesifik).'}${
        input.durationType === 'permanent'
          ? ' Status Banned Permanen tidak dapat diajukan tinjauan ulang oleh nasabah, namun tetap bisa dibuka di Panel Admin.'
          : ' Kartu akan otomatis terbuka begitu hitung mundur waktu selesai.'
      }`,
      'alert'
    );

    playAtmSound('alert');
    return {
      success: true,
      message: `Kartu milik ${target.fullName} (${target.accountNumber}) berhasil di-BANNED (${label})!`,
    };
  };

  const adminUnbanCard = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Kartu nasabah tidak ditemukan!' };

    const prevDurationLabel = target.banInfo?.durationLabel || 'Banned';

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              cardStatus: 'active',
              banInfo: undefined,
            }
          : acc
      )
    );

    const unbanPopup: WebsiteSystemPopupNotification = {
      id: `sys-unban-manual-${Date.now()}-${target.id}`,
      type: 'unban',
      title: '🔓 KARTU ANDA TELAH DIBUKA KEMBALI!',
      subtitle: 'NOTIFIKASI RESMI DARI SISTEM WEBSITE BANK NUSANTARA',
      message: `Pemberitahuan Sistem Website: Status Banned (${prevDurationLabel}) pada kartu ATM atas nama ${target.fullName} (No. Rekening: ${target.accountNumber}) telah resmi DIBUKA! Kartu Anda kini kembali AKTIF dan siap digunakan bertransaksi.`,
      accountId: target.id,
      accountName: target.fullName,
      accountNumber: target.accountNumber,
      cardTier: target.cardTier,
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    setWebsitePopups((prev) => [unbanPopup, ...prev]);

    addNotification(
      '🔓 Sistem Website: Banned Kartu Telah Dibuka!',
      `Status BANNED pada kartu ${target.fullName} (${target.accountNumber}) telah dibuka. Kartu kini kembali AKTIF.`,
      'success'
    );
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');
    return {
      success: true,
      message: `Status Banned pada kartu ${target.fullName} (${target.accountNumber}) berhasil dibuka & notifikasi sistem website telah dikirim!`,
    };
  };

  const adminUnbanAllCards = () => {
    const bannedList = accounts.filter((a) => a.cardStatus === 'banned');
    if (bannedList.length === 0) {
      return { success: false, message: 'Tidak ada kartu yang sedang di-banned saat ini.', count: 0 };
    }
    bannedList.forEach((acc) => adminUnbanCard(acc.id));
    return {
      success: true,
      message: `Seluruh ${bannedList.length} kartu yang di-banned berhasil dibuka kembali!`,
      count: bannedList.length,
    };
  };

  const submitCardBanAppeal = (accountId: string, appealNote?: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target || target.cardStatus !== 'banned' || !target.banInfo) {
      return { success: false, message: 'Kartu ini tidak dalam status Banned.' };
    }

    if (target.banInfo.durationType === 'permanent') {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Kartu ini di-BANNED PERMANEN oleh Admin dan TIDAK DAPAT ditinjau lagi! Hanya Admin yang dapat membuka banned secara langsung di Panel Admin.',
      };
    }

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId && acc.banInfo
          ? {
              ...acc,
              banInfo: {
                ...acc.banInfo,
                appealStatus: 'pending',
                appealNote: appealNote?.trim() || 'Nasabah mengajukan permohonan tinjauan pembukaan Banned Kartu.',
                appealRequestedAt: new Date().toISOString(),
              },
            }
          : acc
      )
    );

    addNotification(
      'Permohonan Tinjauan Banned Terkirim ke Admin 📩',
      `Pengajuan tinjauan alasan Banned untuk kartu ${target.fullName} (${target.accountNumber}) telah dikirim ke Panel Admin.`,
      'info'
    );
    playAtmSound('beep');
    return {
      success: true,
      message: 'Permohonan tinjauan Banned berhasil dikirim ke Panel Admin!',
    };
  };

  // ================= VERIFIKASI CENTANG BIRU (BLUE VERIFICATION BADGE) DI PANEL ADMIN =================
  const adminToggleVerifyAccount = (accountId: string, customLabel?: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan!', isVerified: false };

    const nextVerified = !target.isVerified;
    const badgeLabel =
      customLabel?.trim() ||
      target.verifiedLabel ||
      'Akun Terverifikasi Resmi (Centang Biru Bank Nusantara)';

    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              isVerified: nextVerified,
              verifiedAt: nextVerified ? new Date().toISOString() : undefined,
              verifiedLabel: nextVerified ? badgeLabel : undefined,
            }
          : acc
      )
    );

    if (nextVerified) {
      const popup: WebsiteSystemPopupNotification = {
        id: `sys-verif-${Date.now()}-${target.id}`,
        type: 'verified',
        title: '☑️ AKUN ANDA MENDAPATKAN CENTANG BIRU RESMI!',
        subtitle: 'VERIFIKASI IDENTITAS RESMI SISTEM WEBSITE BANK NUSANTARA',
        message: `Selamat! Akun & Kartu ATM atas nama ${target.fullName} (No. Rekening: ${target.accountNumber}) telah diverifikasi oleh Admin dan mendapatkan Lencana Centang Biru Resmi (${badgeLabel}).`,
        accountId: target.id,
        accountName: target.fullName,
        accountNumber: target.accountNumber,
        cardTier: target.cardTier,
        timestamp: new Date().toISOString(),
        dismissed: false,
      };
      setWebsitePopups((prev) => [popup, ...prev]);

      addNotification(
        '☑️ Verifikasi Centang Biru Aktif!',
        `Akun ${target.fullName} (${target.accountNumber}) kini berstatus Terverifikasi Centang Biru (${badgeLabel}).`,
        'success'
      );
      playAtmSound('success');
    } else {
      addNotification(
        'Lencana Centang Biru Dicabut',
        `Status verifikasi Centang Biru pada akun ${target.fullName} (${target.accountNumber}) telah dinonaktifkan oleh Admin.`,
        'info'
      );
      playAtmSound('beep');
    }

    return {
      success: true,
      isVerified: nextVerified,
      message: nextVerified
        ? `Berhasil memberikan Centang Biru (Verified Badge) kepada ${target.fullName}!`
        : `Centang Biru pada ${target.fullName} telah dilepas.`,
    };
  };

  const adminVerifyAllAccounts = (verified: boolean) => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isVerified: verified,
        verifiedAt: verified ? new Date().toISOString() : undefined,
        verifiedLabel: verified
          ? acc.verifiedLabel || 'Akun Terverifikasi Resmi (Centang Biru Bank Nusantara)'
          : undefined,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: verified
        ? 'Seluruh akun nasabah berhasil diberikan Verifikasi Centang Biru!'
        : 'Seluruh lencana Centang Biru nasabah telah dilepas.',
    };
  };

  // ================= EXTRA ADMIN POWER TOOLS =================
  const adminAdjustAccountBalance = (
    accountIdOrObj:
      | string
      | {
          accountId: string;
          mode: 'add' | 'subtract' | 'set' | 'unlimited';
          amount: number;
          note?: string;
        },
    modeArg?: 'add' | 'subtract' | 'set' | 'unlimited',
    amountArg?: number,
    noteArg?: string
  ) => {
    const accountId = typeof accountIdOrObj === 'object' ? accountIdOrObj.accountId : accountIdOrObj;
    const mode = typeof accountIdOrObj === 'object' ? accountIdOrObj.mode : modeArg || 'add';
    const amount = typeof accountIdOrObj === 'object' ? accountIdOrObj.amount : amountArg || 0;
    const note = typeof accountIdOrObj === 'object' ? accountIdOrObj.note : noteArg;

    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening nasabah tidak ditemukan!' };

    let nextBalance = target.balance;
    if (mode === 'unlimited') {
      nextBalance = UNLIMITED_BALANCE;
    } else if (mode === 'set') {
      nextBalance = Math.max(0, amount);
    } else if (mode === 'add') {
      nextBalance = isUnlimitedNumber(target.balance) ? UNLIMITED_BALANCE : target.balance + Math.max(0, amount);
    } else if (mode === 'subtract') {
      nextBalance = isUnlimitedNumber(target.balance)
        ? UNLIMITED_BALANCE
        : Math.max(0, target.balance - Math.max(0, amount));
    }

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, balance: nextBalance } : acc))
    );

    const tx: Transaction = {
      id: `tx-adm-bal-${Date.now()}`,
      accountId: target.id,
      type: mode === 'subtract' ? 'biaya_admin' : 'setor',
      title:
        mode === 'unlimited'
          ? 'Otorisasi Saldo Tak Terbatas (∞) oleh Admin'
          : mode === 'add'
          ? `Suntik Dana / Tambah Saldo oleh Admin`
          : mode === 'subtract'
          ? `Penyesuaian Pengurangan Saldo oleh Admin`
          : `Penetapan Saldo Rekening oleh Admin`,
      amount: mode === 'unlimited' ? UNLIMITED_BALANCE : amount,
      recipientAccount: target.accountNumber,
      recipientName: target.fullName,
      description: note || `Penyesuaian saldo langsung dari Panel Admin`,
      status: 'success',
      referenceNo: `ADM${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'setor_tunai',
    };
    setTransactions((prev) => [tx, ...prev]);

    addNotification(
      'Saldo Diperbarui oleh Admin 💰',
      `Saldo rekening ${target.fullName} (${target.accountNumber}) kini menjadi ${formatRupiah(nextBalance)}.`,
      'success'
    );
    playAtmSound('success');

    return {
      success: true,
      message: `Saldo ${target.fullName} berhasil diperbarui menjadi ${formatRupiah(nextBalance)}!`,
    };
  };

  const adminDirectChangeAccountTier = (accountId: string, newTier: CardTier) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };

    const cfg = CARD_TIER_CONFIGS[newTier];
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              cardTier: newTier,
              balance: newTier === 'admin' ? UNLIMITED_BALANCE : acc.balance,
              cardStatus: acc.cardStatus === 'pending' ? 'active' : acc.cardStatus,
            }
          : acc
      )
    );

    addNotification(
      'Jenis Kartu Diubah oleh Admin 💳',
      `Kartu ${target.fullName} (${target.accountNumber}) telah diubah langsung menjadi ${cfg.nameIndo}.`,
      'success'
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Jenis kartu ${target.fullName} berhasil diubah ke ${cfg.nameIndo}!`,
    };
  };

  const adminDirectChangeAccountPin = (accountId: string, newPin: string) => {
    if (!/^\d{6}$/.test(newPin.trim())) {
      return { success: false, message: 'PIN Kartu harus terdiri dari tepat 6 digit angka!' };
    }
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, pin: newPin.trim() } : acc))
    );

    addNotification(
      'PIN Kartu Diatur Ulang oleh Admin 🔐',
      `PIN 6 digit untuk kartu ${target.fullName} (${target.accountNumber}) telah diperbarui oleh Admin menjadi: ${newPin.trim()}.`,
      'info'
    );
    playAtmSound('success');
    return {
      success: true,
      message: `PIN Kartu ${target.fullName} (${target.accountNumber}) berhasil diubah menjadi ${newPin.trim()}!`,
    };
  };

  const adminSendWebsiteBroadcast = (
    titleOrObj: string | { title: string; message: string; targetAccountId?: string },
    messageArg?: string,
    targetAccountIdArg?: string
  ) => {
    const rawTitle = typeof titleOrObj === 'object' ? titleOrObj.title : titleOrObj;
    const rawMessage = typeof titleOrObj === 'object' ? titleOrObj.message : messageArg || '';
    const targetAccountId = typeof titleOrObj === 'object' ? titleOrObj.targetAccountId : targetAccountIdArg;

    if (!rawTitle?.trim() || !rawMessage?.trim()) {
      return { success: false, message: 'Judul dan isi pesan notifikasi sistem website tidak boleh kosong!' };
    }
    const targetAcc = targetAccountId ? accounts.find((a) => a.id === targetAccountId) : undefined;
    const popup: WebsiteSystemPopupNotification = {
      id: `sys-bcast-${Date.now()}`,
      type: 'broadcast',
      title: `📢 ${rawTitle.trim()}`,
      subtitle: 'PENGUMUMAN RESMI SISTEM WEBSITE BANK NUSANTARA',
      message: rawMessage.trim(),
      accountId: targetAcc?.id,
      accountName: targetAcc ? targetAcc.fullName : 'Seluruh Nasabah Bank Nusantara',
      accountNumber: targetAcc ? targetAcc.accountNumber : 'SEMUA REKENING',
      cardTier: targetAcc?.cardTier,
      timestamp: new Date().toISOString(),
      dismissed: false,
    };
    seenPopupIdsRef.current.add(popup.id);
    setWebsitePopups((prev) => [popup, ...prev]);

    // Broadcast popup to all connected phones via server
    fetch('/api/website-popup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(popup),
    }).catch(() => {});

    addNotification(`📢 ${rawTitle.trim()}`, rawMessage.trim(), 'info');
    playAtmSound('success');
    return {
      success: true,
      message: 'Notifikasi Sistem Website berhasil dikirim dan ditampilkan di layar semua HP!',
    };
  };

  const adminUpdateResiStatus = (
    resiId: string,
    newStatus: ResiTrackingRecord['status'],
    locationNote?: string
  ) => {
    const target = resiList.find((r) => r.id === resiId);
    if (!target) return { success: false, message: 'Data resi tidak ditemukan!' };

    setResiList((prev) =>
      prev.map((r) =>
        r.id === resiId
          ? {
              ...r,
              status: newStatus,
              history: [
                {
                  time: new Date().toLocaleTimeString('id-ID') + ' WIB',
                  location: locationNote?.trim() || `Hub Logistik ${r.destination}`,
                  description: `Status pengiriman diperbarui oleh Admin menjadi: ${newStatus}.`,
                },
                ...r.history,
              ],
            }
          : r
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Status Resi ${target.resiNumber} berhasil diperbarui menjadi "${newStatus}"!`,
    };
  };

  const adminApproveAllPendingCards = () => {
    const pendings = accounts.filter((a) => a.cardStatus === 'pending');
    pendings.forEach((a) => adminApproveCard(a.id));
    return {
      success: true,
      message: `${pendings.length} pendaftaran kartu baru berhasil disetujui sekaligus!`,
      count: pendings.length,
    };
  };

  const adminApproveAllPendingUpgrades = () => {
    const pendings = cardUpgrades.filter((u) => u.status === 'pending');
    pendings.forEach((u) => adminApproveUpgrade(u.id));
    return {
      success: true,
      message: `${pendings.length} permohonan upgrade kartu berhasil disetujui sekaligus!`,
      count: pendings.length,
    };
  };

  const adminApproveAllPendingLoans = () => {
    const pendings = loans.filter((l) => l.status === 'pending');
    pendings.forEach((l) => adminApproveLoan(l.id));
    return {
      success: true,
      message: `${pendings.length} permohonan pinjaman online berhasil disetujui & dicairkan sekaligus!`,
      count: pendings.length,
    };
  };

  // ================= 20+ NEW SUPER ADMIN TOOLS IMPLEMENTATIONS =================
  const adminMassBalanceRain = (amount: number, note?: string) => {
    if (!amount || amount <= 0) {
      return { success: false, message: 'Nominal hujan saldo massal harus lebih dari Rp 0!' };
    }
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        balance: isUnlimitedNumber(acc.balance) ? UNLIMITED_BALANCE : acc.balance + amount,
      }))
    );
    const rainTx: Transaction = {
      id: `tx-rain-${Date.now()}`,
      accountId: currentAccountId,
      type: 'setor',
      title: `Hujan Bonus Saldo Massal Admin (${accounts.length} Rekening)`,
      amount,
      recipientAccount: 'SEMUA REKENING',
      recipientName: 'Seluruh Nasabah Bank Nusantara',
      description: note || 'Pembagian bonus saldo massal dari Super Tool Admin',
      status: 'success',
      referenceNo: `RAIN${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'setor_tunai',
    };
    setTransactions((prev) => [rainTx, ...prev]);
    playAtmSound('success');
    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch { /* empty */ }
    return {
      success: true,
      message: `Hujan Saldo Massal sebesar ${formatRupiah(amount)} berhasil dibagikan ke seluruh ${accounts.length} rekening nasabah!`,
    };
  };

  const adminSetCustomAccountNumber = (accountId: string, newAccountNumber: string) => {
    const cleanNum = newAccountNumber.replace(/\D/g, '').trim();
    if (cleanNum.length < 6 || cleanNum.length > 16) {
      return { success: false, message: 'Nomor rekening custom harus terdiri dari 6 hingga 16 digit angka!' };
    }
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    if (accounts.some((a) => a.id !== accountId && a.accountNumber === cleanNum)) {
      return { success: false, message: 'Nomor rekening tersebut sudah digunakan oleh kartu lain!' };
    }
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, accountNumber: cleanNum } : acc))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Nomor rekening ${target.fullName} berhasil diubah menjadi Nomor Cantik VIP: ${cleanNum}!`,
    };
  };

  const adminSetCustomCardDetails = (
    accountId: string,
    newCardNumber: string,
    newCvv: string,
    newExpiry: string
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const formattedCard = newCardNumber.trim() || target.cardNumber;
    const formattedCvv = newCvv.trim() || target.cvv;
    const formattedExp = newExpiry.trim() || target.expiryDate;
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              cardNumber: formattedCard,
              cvv: formattedCvv,
              expiryDate: formattedExp,
            }
          : acc
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Detail fisik kartu ATM ${target.fullName} (No. Kartu: ${formattedCard}, CVV: ${formattedCvv}, Exp: ${formattedExp}) berhasil diperbarui!`,
    };
  };

  const adminAdjustRewardPoints = (
    accountId: string,
    points: number,
    mode: 'add' | 'set' | 'unlimited'
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const currentPts = target.rewardPoints || 0;
    const nextPts =
      mode === 'unlimited'
        ? UNLIMITED_BALANCE
        : mode === 'set'
        ? Math.max(0, points)
        : isUnlimitedNumber(currentPts)
        ? UNLIMITED_BALANCE
        : currentPts + Math.max(0, points);
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, rewardPoints: nextPts } : acc))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Poin Reward Nusantara untuk ${target.fullName} berhasil diatur menjadi ${
        isUnlimitedNumber(nextPts) ? '∞ (Tidak Terbatas)' : nextPts.toLocaleString('id-ID')
      } Poin!`,
    };
  };

  const adminInjectPulsaAndPln = (accountId: string, pulsaAmount: number, kwhAmount: number) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              pulsaBalance: isUnlimitedNumber(acc.pulsaBalance || 0)
                ? UNLIMITED_BALANCE
                : (acc.pulsaBalance || 0) + Math.max(0, pulsaAmount),
              plnKwhBalance: isUnlimitedNumber(acc.plnKwhBalance || 0)
                ? 999_999_999
                : Number(((acc.plnKwhBalance || 0) + Math.max(0, kwhAmount)).toFixed(1)),
            }
          : acc
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Berhasil menyuntikkan Pulsa ${formatRupiah(pulsaAmount)} & Listrik +${kwhAmount} kWh ke kartu ${target.fullName}!`,
    };
  };

  const adminForceTransferBetweenAccounts = (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    note?: string
  ) => {
    if (fromAccountId === toAccountId) {
      return { success: false, message: 'Rekening pengirim dan penerima tidak boleh sama!' };
    }
    if (!amount || amount <= 0) {
      return { success: false, message: 'Nominal force transfer harus lebih dari Rp 0!' };
    }
    const sender = accounts.find((a) => a.id === fromAccountId);
    const receiver = accounts.find((a) => a.id === toAccountId);
    if (!sender || !receiver) return { success: false, message: 'Rekening tidak ditemukan!' };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromAccountId) {
          return {
            ...acc,
            balance: isUnlimitedNumber(acc.balance) ? UNLIMITED_BALANCE : Math.max(0, acc.balance - amount),
          };
        }
        if (acc.id === toAccountId) {
          return {
            ...acc,
            balance: isUnlimitedNumber(acc.balance) ? UNLIMITED_BALANCE : acc.balance + amount,
          };
        }
        return acc;
      })
    );

    const tx: Transaction = {
      id: `tx-force-${Date.now()}`,
      accountId: fromAccountId,
      type: 'transfer_out',
      title: `Force Transfer Admin: ${sender.fullName} ➔ ${receiver.fullName}`,
      amount,
      senderAccount: sender.accountNumber,
      senderName: sender.fullName,
      recipientAccount: receiver.accountNumber,
      recipientName: receiver.fullName,
      description: note || 'Pemindahan dana otoritas Super Tool Admin tanpa PIN',
      status: 'success',
      referenceNo: `FTR${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'transfer',
    };
    setTransactions((prev) => [tx, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Force Transfer ${formatRupiah(amount)} dari ${sender.fullName} ke ${receiver.fullName} berhasil dieksekusi tanpa PIN!`,
    };
  };

  const adminCreateInstantActiveAccount = (input: {
    fullName: string;
    accountNumber?: string;
    pin: string;
    balance: number;
    cardTier: CardTier;
    isVerified?: boolean;
  }) => {
    const cleanName = input.fullName.trim();
    if (!cleanName) return { success: false, message: 'Nama lengkap nasabah wajib diisi!' };
    const cleanPin = input.pin.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) return { success: false, message: 'PIN harus 6 digit angka!' };

    const existingNums = accounts.map((a) => a.accountNumber);
    const accNum =
      input.accountNumber && input.accountNumber.replace(/\D/g, '').length >= 6
        ? input.accountNumber.replace(/\D/g, '')
        : generateRandomAccountNumber(existingNums);

    const newAcc: BankAccount = {
      id: `acc-inst-${Date.now()}`,
      accountNumber: accNum,
      fullName: cleanName,
      nik: `3171${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      phone: `0812${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nusantara.id`,
      address: 'Kantor Cabang Utama Bank Nusantara',
      pin: cleanPin,
      balance: input.cardTier === 'admin' ? UNLIMITED_BALANCE : Math.max(0, input.balance),
      cardTier: input.cardTier,
      cardNumber: generateRandomCardNumber(),
      cvv: generateRandomCVV(),
      expiryDate: input.cardTier === 'admin' ? '∞ / SELAMANYA' : generateExpiryDate(5),
      cardStatus: 'active',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: input.balance,
      createdAt: new Date().toISOString(),
      rewardPoints: 1000,
      allowInternational: true,
      isVerified: Boolean(input.isVerified),
      verifiedAt: input.isVerified ? new Date().toISOString() : undefined,
      verifiedLabel: input.isVerified ? 'Nasabah VIP Instan Terverifikasi' : undefined,
    };

    setAccounts((prev) => [newAcc, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Kartu & Rekening baru atas nama "${cleanName}" (No. Rek: ${accNum}, PIN: ${cleanPin}) langsung dibuat & AKTIF tanpa antrean!`,
    };
  };

  const adminCloneAccount = (accountId: string) => {
    const source = accounts.find((a) => a.id === accountId);
    if (!source) return { success: false, message: 'Rekening sumber tidak ditemukan!' };
    const existingNums = accounts.map((a) => a.accountNumber);
    const newAccNum = generateRandomAccountNumber(existingNums);
    const cloned: BankAccount = {
      ...source,
      id: `acc-clone-${Date.now()}`,
      accountNumber: newAccNum,
      fullName: `${source.fullName} (Kloning)`,
      cardNumber: generateRandomCardNumber(),
      cvv: generateRandomCVV(),
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [cloned, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Kartu "${source.fullName}" berhasil dikloning! Rekening baru: ${newAccNum} (PIN: ${cloned.pin}).`,
    };
  };

  const adminMassFreezeOrUnfreezeAll = (freeze: boolean) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.cardTier === 'admin') return acc;
        if (acc.cardStatus === 'pending' || acc.cardStatus === 'banned') return acc;
        return { ...acc, cardStatus: freeze ? 'frozen' : 'active' };
      })
    );
    playAtmSound('success');
    return {
      success: true,
      message: freeze
        ? 'Seluruh kartu reguler nasabah telah dibekukan sementara (Frozen)!'
        : 'Seluruh kartu yang dibekukan telah dibuka kembali (Active)!',
    };
  };

  const adminResetDailyWithdrawalQuota = (accountId?: string) => {
    setAccounts((prev) =>
      prev.map((acc) =>
        !accountId || acc.id === accountId ? { ...acc, dailyWithdrawnToday: 0, lastWithdrawalDate: '' } : acc
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: accountId
        ? 'Kuota penarikan tunai harian ATM untuk rekening terpilih berhasil di-reset menjadi Rp 0!'
        : 'Kuota penarikan tunai harian ATM seluruh nasabah berhasil di-reset menjadi Rp 0!',
    };
  };

  const adminSetSpendingLimitAndIntl = (
    accountId: string,
    limit: number,
    allowInternational: boolean
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              customSpendingLimit: Math.max(0, limit),
              allowInternational,
            }
          : acc
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Limit belanja harian ${target.fullName} diatur ke ${formatRupiah(limit)} & Akses Internasional: ${
        allowInternational ? 'AKTIF' : 'NONAKTIF'
      }!`,
    };
  };

  const adminForgiveOrPayoffLoans = (accountId?: string) => {
    setLoans((prev) =>
      prev.map((l) =>
        (!accountId || l.accountId === accountId) && l.status === 'approved'
          ? {
              ...l,
              remainingInstallments: 0,
              adminNotes: 'Pinjaman telah dilunasi / diputihkan 100% melalui Super Tool Admin.',
            }
          : l
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: accountId
        ? 'Seluruh cicilan pinjaman aktif untuk rekening ini berhasil dilunasi (Pemutihan 100%)!'
        : 'Seluruh cicilan pinjaman online semua nasabah berhasil dilunasi (Pemutihan Massal 100%)!',
    };
  };

  const adminBoostDepositosAndPockets = (bonusPercent: number) => {
    const pct = Math.max(1, bonusPercent) / 100;
    setPockets((prev) =>
      prev.map((p) => ({
        ...p,
        currentAmount: Math.round(p.currentAmount * (1 + pct)),
      }))
    );
    setDepositos((prev) =>
      prev.map((d) => ({
        ...d,
        projectedReturn: Math.round(d.projectedReturn * (1 + pct)),
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Seluruh saldo Celengan Impian & imbal hasil Deposito nasabah berhasil ditambah bonus +${bonusPercent}%!`,
    };
  };

  const adminGenerateInstantVoucher = (input: {
    accountId: string;
    type: 'pulsa' | 'token_listrik' | 'voucher_lain';
    nominal: number;
    targetId: string;
  }) => {
    const target = accounts.find((a) => a.id === input.accountId) || accounts[0];
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };

    const code =
      input.type === 'token_listrik'
        ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
            1000 + Math.random() * 9000
          )}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
        : `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(
            1000 + Math.random() * 9000
          )}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newVc: PurchasedVoucherCode = {
      id: `vc-super-${Date.now()}`,
      accountId: target.id,
      accountNumber: target.accountNumber,
      fullName: target.fullName,
      type: input.type,
      code,
      providerOrMeter: input.targetId || target.phone,
      nominal: input.nominal,
      kwhAmount: input.type === 'token_listrik' ? Number((input.nominal / 1460).toFixed(1)) : undefined,
      status: 'available',
      adminApproved: true,
      purchasedAt: new Date().toISOString(),
    };
    setPurchasedCodes((prev) => [newVc, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      code,
      message: `Kode Voucher ${input.type.toUpperCase()} senilai ${formatRupiah(
        input.nominal
      )} berhasil diterbitkan untuk ${target.fullName}: ${code}`,
    };
  };

  const adminGenerateBulkRedeemCodes = (
    count: number,
    rewardAmount: number,
    maxClaims: number,
    durationMinutes: number
  ) => {
    const safeCount = Math.min(20, Math.max(1, count));
    const createdCodes: RedeemCode[] = [];
    const now = Date.now();
    for (let i = 0; i < safeCount; i++) {
      const codeStr = `SUPER${Math.floor(10000 + Math.random() * 90000)}`;
      createdCodes.push({
        id: `rdm-bulk-${now}-${i}`,
        code: codeStr,
        title: `Paket Giveaway Super Tool #${i + 1}`,
        rewardAmount: Math.max(10000, rewardAmount),
        maxClaims: Math.max(1, maxClaims),
        claimedBy: [],
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + Math.max(5, durationMinutes) * 60 * 1000).toISOString(),
        durationMinutes: Math.max(5, durationMinutes),
        active: true,
        requireAdminPin: false,
      });
    }
    setRedeemCodes((prev) => [...createdCodes, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `${safeCount} Kode Redeem baru (${createdCodes.map((c) => c.code).join(', ')}) masing-masing senilai ${formatRupiah(
        rewardAmount
      )} berhasil dibuat sekaligus!`,
    };
  };

  const adminClearTransactionHistory = (accountId?: string) => {
    if (accountId) {
      setTransactions((prev) => prev.filter((t) => t.accountId !== accountId));
      playAtmSound('beep');
      return {
        success: true,
        message: 'Riwayat mutasi transaksi untuk rekening terpilih telah dibersihkan!',
      };
    }
    setTransactions([]);
    playAtmSound('beep');
    return {
      success: true,
      message: 'Seluruh riwayat mutasi transaksi di sistem telah dibersihkan!',
    };
  };

  const adminCreateCustomTransaction = (input: {
    accountId: string;
    title: string;
    amount: number;
    type: TransactionType;
    description?: string;
  }) => {
    const target = accounts.find((a) => a.id === input.accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const tx: Transaction = {
      id: `tx-custom-${Date.now()}`,
      accountId: target.id,
      type: input.type,
      title: input.title.trim() || 'Transaksi Khusus Otoritas Admin',
      amount: Math.max(0, input.amount),
      senderAccount: target.accountNumber,
      senderName: target.fullName,
      recipientAccount: target.accountNumber,
      recipientName: target.fullName,
      description: input.description?.trim() || 'Mutasi resmi ditambahkan melalui Super Tool Admin',
      status: 'success',
      referenceNo: `CST${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'transfer',
    };
    setTransactions((prev) => [tx, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Mutasi transaksi custom "${tx.title}" sebesar ${formatRupiah(tx.amount)} berhasil ditambahkan ke riwayat ${target.fullName}!`,
    };
  };

  const adminUpdateAccountIdentity = (
    accountId: string,
    input: {
      fullName: string;
      nik: string;
      phone: string;
      email: string;
      address: string;
    }
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              fullName: input.fullName.trim() || acc.fullName,
              nik: input.nik.trim() || acc.nik,
              phone: input.phone.trim() || acc.phone,
              email: input.email.trim() || acc.email,
              address: input.address.trim() || acc.address,
            }
          : acc
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Profil & identitas lengkap nasabah (${input.fullName || target.fullName}) berhasil diperbarui!`,
    };
  };

  const adminMultiplyAccountBalance = (accountId: string, multiplier: number) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const safeMult = Math.max(2, multiplier);
    const nextBal = isUnlimitedNumber(target.balance)
      ? UNLIMITED_BALANCE
      : Math.min(UNLIMITED_BALANCE, Math.max(100_000, target.balance) * safeMult);
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, balance: nextBal } : acc))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Saldo ${target.fullName} berhasil dilipatgandakan ${safeMult}x menjadi ${formatRupiah(nextBal)}!`,
    };
  };

  const adminSetAllAccountsTier = (tier: CardTier) => {
    const cfg = CARD_TIER_CONFIGS[tier];
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        cardTier: tier,
        balance: tier === 'admin' ? UNLIMITED_BALANCE : acc.balance,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Seluruh kartu nasabah berhasil diubah secara massal menjadi kelas ${cfg.nameIndo}!`,
    };
  };

  const adminDeleteAccount = (accountId: string) => {
    if (accounts.length <= 1) {
      return { success: false, message: 'Tidak dapat menghapus satu-satunya rekening yang tersisa!' };
    }
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const remaining = accounts.filter((a) => a.id !== accountId);
    setAccounts(remaining);
    if (currentAccountId === accountId && remaining[0]) {
      setCurrentAccountIdState(remaining[0].id);
    }
    playAtmSound('beep');
    return {
      success: true,
      message: `Rekening & kartu atas nama ${target.fullName} (${target.accountNumber}) berhasil dihapus!`,
    };
  };

  const changePin = (accountId: string, oldPin: string, newPin: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };
    if (target.pin !== oldPin) {
      playAtmSound('alert');
      return { success: false, message: 'PIN lama yang Anda masukkan salah!' };
    }
    if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
      return { success: false, message: 'PIN baru harus terdiri dari tepat 6 digit angka!' };
    }

    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, pin: newPin } : acc))
    );

    addNotification(
      'PIN Kartu Berhasil Diubah 🛡️',
      'Kode PIN kartu ATM Anda telah berhasil diperbarui.',
      'success'
    );
    playAtmSound('success');
    return { success: true, message: 'PIN berhasil diubah!' };
  };

  const updatePhone = (accountId: string, newPhone: string) => {
    if (!newPhone || newPhone.length < 10) {
      return { success: false, message: 'Nomor telepon tidak valid' };
    }
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, phone: newPhone } : acc))
    );
    addNotification('Nomor HP Diperbarui 📱', `Nomor telepon terdaftar berhasil diganti ke ${newPhone}.`, 'info');
    return { success: true, message: 'Nomor telepon terdaftar berhasil diubah!' };
  };

  /**
   * Tarik Tunai Mesin ATM
   */
  const withdrawCash = (amount: number, pin: string) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };

    if (currentAccount.cardStatus === 'frozen') {
      playAtmSound('alert');
      return { success: false, message: 'Kartu sedang dikunci sementara! Buka blokir kartu terlebih dahulu menggunakan PIN.' };
    }

    if (currentAccount.cardStatus !== 'active') {
      playAtmSound('alert');
      return { success: false, message: 'Kartu belum aktif atau telah dinonaktifkan.' };
    }

    if (currentAccount.pin !== pin) {
      playAtmSound('alert');
      return { success: false, message: 'PIN kartu yang Anda masukkan salah.' };
    }

    if (amount <= 0 || amount % 50000 !== 0) {
      return { success: false, message: 'Jumlah penarikan harus kelipatan Rp 50.000 atau Rp 100.000' };
    }

    const isAdminCard = currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isAdminCard && currentAccount.balance < amount) {
      playAtmSound('alert');
      return { success: false, message: 'Saldo rekening Anda tidak mencukupi untuk penarikan ini.' };
    }

    const tierConfig = CARD_TIER_CONFIGS[currentAccount.cardTier];
    const today = new Date().toISOString().split('T')[0];
    const withdrawnToday = currentAccount.lastWithdrawalDate === today ? currentAccount.dailyWithdrawnToday : 0;

    if (!isAdminCard && !tierConfig.isUnlimited && withdrawnToday + amount > tierConfig.dailyWithdrawalLimit) {
      playAtmSound('alert');
      const sisaLimit = Math.max(0, tierConfig.dailyWithdrawalLimit - withdrawnToday);
      return {
        success: false,
        message: `Melebihi batas tarik harian ${tierConfig.nameIndo} (Batas: Rp ${tierConfig.dailyWithdrawalLimit.toLocaleString('id-ID')}). Sisa limit Anda hari ini: Rp ${sisaLimit.toLocaleString('id-ID')}`,
      };
    }

    const nextBalance = isAdminCard ? UNLIMITED_BALANCE : currentAccount.balance - amount;

    // Langsung kurangi saldo saat tarik tunai di ATM agar uang keluar (Kartu Admin tetap ∞)!
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === currentAccount.id) {
          return {
            ...acc,
            balance: nextBalance,
            dailyWithdrawnToday: withdrawnToday + amount,
            lastWithdrawalDate: today,
          };
        }
        return acc;
      })
    );

    const refNo = `ATM${Date.now()}`;
    const newTx: Transaction = {
      id: `tx-wd-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'tarik',
      title: 'Tarik Tunai Mesin ATM Nusantara',
      amount: amount,
      senderAccount: currentAccount.accountNumber,
      senderName: currentAccount.fullName,
      recipientAccount: currentAccount.accountNumber,
      recipientName: currentAccount.fullName,
      description: 'Penarikan uang tunai di mesin ATM Nusantara',
      status: 'success',
      referenceNo: refNo,
      timestamp: new Date().toISOString(),
      balanceDeducted: true,
      category: 'tarik_tunai',
    };

    setTransactions((prev) => [newTx, ...prev]);
    addNotification(
      'Tarik Tunai ATM Berhasil 💵',
      `Penarikan tunai sebesar Rp ${amount.toLocaleString('id-ID')} berhasil. Sisa saldo Anda: ${isAdminCard ? '∞ (Tidak Terbatas)' : formatRupiah(nextBalance)}.`,
      'success'
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Penarikan tunai Rp ${amount.toLocaleString('id-ID')} berhasil! Silakan ambil uang tunai Anda di dispenser ATM.`,
      transaction: newTx,
    };
  };

  /**
   * Setor Tunai Mesin ATM
   */
  const depositCash = (amount: number, note?: string) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };

    if (amount <= 0 || amount % 50000 !== 0) {
      return { success: false, message: 'Jumlah setoran harus kelipatan Rp 50.000 atau Rp 100.000' };
    }

    const refNo = `CDM${Date.now()}`;
    const newTx: Transaction = {
      id: `tx-dep-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'setor',
      title: 'Setor Tunai Mesin ATM Nusantara (Sedang Diproses)',
      amount: amount,
      recipientAccount: currentAccount.accountNumber,
      recipientName: currentAccount.fullName,
      description: note || 'Penyetoran uang tunai langsung ke rekening — Sedang Diproses',
      status: 'pending',
      referenceNo: refNo,
      timestamp: new Date().toISOString(),
      category: 'setor_tunai',
    };

    setTransactions((prev) => [newTx, ...prev]);
    addNotification(
      'Setor Tunai Sedang Diproses ⏳',
      `Setoran tunai sebesar Rp ${amount.toLocaleString('id-ID')} sedang diproses oleh sistem. Saldo akan segera bertambah setelah proses selesai.`,
      'info'
    );
    playAtmSound('beep');
    return {
      success: true,
      message: 'Setoran tunai berhasil diterima mesin dan saat ini sedang diproses!',
      transaction: newTx,
    };
  };

  const lookupAccount = (accountNumber: string, bankCode = 'BNUS') => {
    const cleanNum = accountNumber.replace(/\s+/g, '');
    if (bankCode === 'BNUS' || !bankCode || bankCode === 'Bank Nusantara') {
      const found = accounts.find((a) => (a.accountNumber === cleanNum || a.phone === cleanNum) && a.cardStatus === 'active');
      if (found) {
        return { found: true, name: found.fullName, bank: 'Bank Nusantara' };
      }
    } else {
      const mockNames: Record<string, string> = {
        '1122334455': 'PT Telekomunikasi Indonesia',
        '9988776655': 'Arief Muhammad Rizky',
        '5544332211': 'Universitas Negeri',
      };
      if (cleanNum.length >= 8) {
        return {
          found: true,
          name: mockNames[cleanNum] || `Nasabah Terverifikasi (${bankCode})`,
          bank: bankCode,
        };
      }
    }
    return { found: false };
  };

  /**
   * Transfer Antar Rekening
   * SESUAI PERMINTAAN USER: "Pas aku transfer, transfer itu tidak memakai persetujuan admin."
   * Secara default `requireAdminApproval` untuk `transfer` adalah FALSE (Langsung berhasil & saldo langsung berkurang!),
   * namun tetap terhubung ke konfigurasi Panel Admin jika Admin suatu saat ingin mengubahnya.
   */
  const transferMoney = (input: TransferInput) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };

    if (currentAccount.cardStatus === 'frozen') {
      playAtmSound('alert');
      return { success: false, message: 'Kartu sedang dikunci sementara! Buka blokir kartu terlebih dahulu menggunakan PIN.' };
    }

    if (currentAccount.pin !== input.pin) {
      playAtmSound('alert');
      return { success: false, message: 'PIN transaksi yang Anda masukkan salah!' };
    }

    const cleanDest = input.recipientAccount.replace(/\s+/g, '');
    if (cleanDest === currentAccount.accountNumber && (input.recipientBank === 'Bank Nusantara' || input.recipientBank === 'BNUS')) {
      return { success: false, message: 'Tidak dapat mentransfer ke nomor rekening Anda sendiri!' };
    }

    const isInternal = input.recipientBank === 'Bank Nusantara' || input.recipientBank === 'BNUS';
    const fee = isInternal ? 0 : 6500;
    const totalRequired = input.amount + fee;

    const isAdminCard = currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isAdminCard && currentAccount.balance < totalRequired) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Saldo tidak cukup! Total transfer + biaya admin: Rp ${totalRequired.toLocaleString('id-ID')}`,
      };
    }

    let recipientName = 'Penerima Transfer';
    const internalReceiver = isInternal
      ? accounts.find((a) => a.accountNumber === cleanDest || a.phone === cleanDest)
      : null;

    if (isInternal) {
      if (!internalReceiver) {
        return {
          success: false,
          message: 'Nomor rekening Bank Nusantara tidak ditemukan! Pastikan 10 digit nomor sudah benar.',
        };
      }
      recipientName = internalReceiver.fullName;
    } else {
      recipientName = lookupAccount(cleanDest, input.recipientBank).name || 'Penerima Bank Lain';
    }

    const transferConfig = getFeatureConfig('transfer');
    const requiresApproval = transferConfig ? transferConfig.requireAdminApproval : false; // Default FALSE!

    const refNo = `TRX${Date.now()}`;
    const nextSenderBalance = isAdminCard ? UNLIMITED_BALANCE : currentAccount.balance - totalRequired;

    if (!requiresApproval) {
      // INSTANT TRANSFER (TIDAK MEMAKAI PERSETUJUAN ADMIN!)
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === currentAccount.id) {
            return {
              ...acc,
              balance: nextSenderBalance,
              rewardPoints: isAdminCard ? UNLIMITED_BALANCE : (acc.rewardPoints || 0) + 15,
            };
          }
          if (isInternal && internalReceiver && acc.id === internalReceiver.id) {
            const isReceiverAdmin = acc.cardTier === 'admin' || isUnlimitedNumber(acc.balance);
            return { ...acc, balance: isReceiverAdmin ? UNLIMITED_BALANCE : acc.balance + input.amount };
          }
          return acc;
        })
      );

      const senderTx: Transaction = {
        id: `tx-tf-out-${Date.now()}`,
        accountId: currentAccount.id,
        type: 'transfer_out',
        title: `Transfer ke ${recipientName}`,
        amount: totalRequired,
        senderAccount: currentAccount.accountNumber,
        senderName: currentAccount.fullName,
        recipientAccount: cleanDest,
        recipientName: recipientName,
        recipientBank: input.recipientBank,
        description: input.note || `Transfer instan ke ${input.recipientBank}`,
        status: 'success',
        referenceNo: refNo,
        timestamp: new Date().toISOString(),
        balanceDeducted: true,
        featureId: 'transfer',
        category: 'transfer',
      };

      const newTxList: Transaction[] = [senderTx];

      if (isInternal && internalReceiver) {
        const receiverTx: Transaction = {
          id: `tx-tf-in-${Date.now() + 1}`,
          accountId: internalReceiver.id,
          type: 'transfer_in',
          title: `Transfer Masuk dari ${currentAccount.fullName}`,
          amount: input.amount,
          senderAccount: currentAccount.accountNumber,
          senderName: currentAccount.fullName,
          recipientAccount: internalReceiver.accountNumber,
          recipientName: internalReceiver.fullName,
          recipientBank: 'Bank Nusantara',
          description: input.note || 'Transfer dana masuk instan',
          status: 'success',
          referenceNo: refNo,
          timestamp: new Date().toISOString(),
          category: 'transfer',
        };
        newTxList.push(receiverTx);
      }

      setTransactions((prev) => [...newTxList, ...prev]);

      addNotification(
        'Transfer Berhasil Instan! ✅',
        `Transfer sebesar Rp ${input.amount.toLocaleString('id-ID')} ke ${recipientName} (${input.recipientBank}) berhasil dikirim secara instan. Sisa saldo: ${isAdminCard ? '∞ (Tidak Terbatas)' : formatRupiah(nextSenderBalance)}.`,
        'success'
      );

      playAtmSound('success');
      return {
        success: true,
        message: `Transfer sebesar Rp ${input.amount.toLocaleString('id-ID')} ke ${recipientName} berhasil dikirim secara instan!`,
        transaction: senderTx,
        requiresApproval: false,
      };
    } else {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === currentAccount.id ? { ...acc, balance: nextSenderBalance } : acc
        )
      );

      const senderTx: Transaction = {
        id: `tx-tf-out-${Date.now()}`,
        accountId: currentAccount.id,
        type: 'transfer_out',
        title: `Transfer ke ${recipientName} (Sedang Diproses)`,
        amount: totalRequired,
        senderAccount: currentAccount.accountNumber,
        senderName: currentAccount.fullName,
        recipientAccount: cleanDest,
        recipientName: recipientName,
        recipientBank: input.recipientBank,
        description: input.note ? `(Sedang Diproses) ${input.note}` : 'Transfer dana — Sedang Diproses',
        status: 'pending',
        referenceNo: refNo,
        timestamp: new Date().toISOString(),
        balanceDeducted: true,
        featureId: 'transfer',
        category: 'transfer',
      };

      setTransactions((prev) => [senderTx, ...prev]);

      addNotification(
        'Transfer Sedang Diproses ⏳',
        `Transfer sebesar Rp ${totalRequired.toLocaleString('id-ID')} ke ${recipientName} saat ini sedang diproses oleh sistem.`,
        'info'
      );

      playAtmSound('beep');
      return {
        success: true,
        message: `Transfer Rp ${totalRequired.toLocaleString('id-ID')} ke ${recipientName} berhasil diajukan dan saat ini sedang diproses.`,
        transaction: senderTx,
        requiresApproval: true,
      };
    }
  };

  /**
   * ADMIN FINANCIAL APPROVAL SYSTEM
   * Karena saat nasabah membeli barang/tagihan saldo sudah langsung dipotong (`tx.balanceDeducted === true`),
   * saat Admin menyetujui, saldo tidak dipotong dua kali, melainkan statusnya disahkan menjadi 'success'.
   * Jika Admin menolak, saldo yang sudah terpotong otomatis DIKEMBALIKAN (Refund 100%) ke nasabah!
   */
  const adminApproveFinancialTransaction = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };
    if (tx.status !== 'pending') return { success: false, message: 'Transaksi sudah diproses sebelumnya' };

    const sender = accounts.find((a) => a.id === tx.accountId || a.accountNumber === tx.senderAccount);

    if (tx.type === 'transfer_out') {
      if (!tx.balanceDeducted) {
        if (!sender || sender.balance < tx.amount) {
          return { success: false, message: 'Saldo pengirim tidak mencukupi!' };
        }
      }
      const isInternal = tx.recipientBank === 'Bank Nusantara' || tx.recipientBank === 'BNUS' || !tx.recipientBank;
      const internalReceiver = isInternal
        ? accounts.find((a) => a.accountNumber === tx.recipientAccount || a.phone === tx.recipientAccount)
        : null;

      setAccounts((prev) =>
        prev.map((acc) => {
          if (sender && acc.id === sender.id && !tx.balanceDeducted) {
            return { ...acc, balance: acc.balance - tx.amount, rewardPoints: (acc.rewardPoints || 0) + 15 };
          }
          if (isInternal && internalReceiver && acc.id === internalReceiver.id) {
            return { ...acc, balance: acc.balance + tx.amount };
          }
          return acc;
        })
      );

      if (isInternal && internalReceiver) {
        const receiverTx: Transaction = {
          id: `tx-tf-in-${Date.now()}`,
          accountId: internalReceiver.id,
          type: 'transfer_in',
          title: `Transfer Masuk dari ${sender ? sender.fullName : tx.senderName || 'Nasabah'}`,
          amount: tx.amount,
          senderAccount: sender ? sender.accountNumber : tx.senderAccount,
          senderName: sender ? sender.fullName : tx.senderName,
          recipientAccount: internalReceiver.accountNumber,
          recipientName: internalReceiver.fullName,
          recipientBank: 'Bank Nusantara',
          description: tx.description?.replace('(Menunggu Tinjauan) ', '') || 'Transfer dana masuk',
          status: 'success',
          referenceNo: tx.referenceNo,
          timestamp: new Date().toISOString(),
          category: 'transfer',
        };
        setTransactions((prev) => [receiverTx, ...prev]);
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: 'success',
                title: t.title
                  .replace('(Menunggu Tinjauan Admin)', '(Disetujui Admin)')
                  .replace('(Menunggu Persetujuan Admin)', '(Disetujui Admin)'),
              }
            : t
        )
      );

      addNotification(
        'Transfer Disetujui Admin! ✅',
        `Transfer sebesar Rp ${tx.amount.toLocaleString('id-ID')} ke ${tx.recipientName} telah disetujui Admin.`,
        'success'
      );
    } else if (tx.type === 'tarik') {
      if (!tx.balanceDeducted) {
        if (!sender || sender.balance < tx.amount) {
          return { success: false, message: 'Saldo tidak mencukupi untuk penarikan tunai!' };
        }
        setAccounts((prev) =>
          prev.map((acc) => {
            if (sender && acc.id === sender.id) {
              const today = new Date().toISOString().split('T')[0];
              const prevWd = acc.lastWithdrawalDate === today ? acc.dailyWithdrawnToday : 0;
              return {
                ...acc,
                balance: acc.balance - tx.amount,
                dailyWithdrawnToday: prevWd + tx.amount,
                lastWithdrawalDate: today,
              };
            }
            return acc;
          })
        );
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: 'success',
                title: t.title
                  .replace('(Menunggu Tinjauan Admin)', '(Disetujui Admin)')
                  .replace('(Menunggu Persetujuan Admin)', '(Disetujui Admin)'),
              }
            : t
        )
      );

      addNotification(
        'Tarik Tunai Disetujui Admin! 💵',
        `Penarikan tunai sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah disetujui Admin.`,
        'success'
      );
    } else if (tx.type === 'setor') {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (sender && acc.id === sender.id) {
            return { ...acc, balance: acc.balance + tx.amount };
          }
          return acc;
        })
      );

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: 'success',
                title: t.title
                  .replace('(Menunggu Tinjauan Admin)', '(Disetujui Admin)')
                  .replace('(Menunggu Persetujuan Admin)', '(Disetujui Admin)'),
              }
            : t
        )
      );

      addNotification(
        'Setor Tunai Disetujui Admin! 💰',
        `Setoran tunai sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah disetujui dan masuk ke saldo rekening Anda.`,
        'success'
      );
    } else {
      // Untuk semua pembelian barang, pulsa, token listrik, tagihan, deposito, dll.
      if (!tx.balanceDeducted) {
        if (!sender || sender.balance < tx.amount) {
          return { success: false, message: 'Saldo tidak mencukupi!' };
        }
        setAccounts((prev) =>
          prev.map((acc) => {
            if (sender && acc.id === sender.id) {
              return { ...acc, balance: acc.balance - tx.amount, rewardPoints: (acc.rewardPoints || 0) + 10 };
            }
            return acc;
          })
        );
      }

      // Jika transaksi memiliki kode voucher pulsa / token listrik / cardless, tandai adminApproved = true setelah disetujui Admin!
      if (tx.generatedCode) {
        setPurchasedCodes((prev) =>
          prev.map((vc) => (vc.code === tx.generatedCode ? { ...vc, adminApproved: true } : vc))
        );
        setCardlessTokens((prev) =>
          prev.map((ct) => (ct.tokenCode === tx.generatedCode ? { ...ct, adminApproved: true } : ct))
        );
      }

      const cleanBaseTitle = tx.title
        .replace('(Menunggu Tinjauan Admin)', '')
        .replace('(Menunggu Persetujuan Admin)', '')
        .replace('(Sedang Diproses)', '')
        .trim();

      const needsBuyerConfirm = Boolean(tx.requiresBuyerApproval && !tx.generatedCode);

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                status: 'success',
                buyerApprovalStatus: needsBuyerConfirm ? 'waiting_buyer' : t.buyerApprovalStatus,
                title: needsBuyerConfirm
                  ? `${cleanBaseTitle} (Menunggu Persetujuan Pembeli)`
                  : `${cleanBaseTitle} (Selesai)`,
                description: t.generatedCode
                  ? `Kode Resmi Anda: ${t.generatedCode} • Pesanan Selesai & Lunas`
                  : needsBuyerConfirm
                  ? 'Proses Verifikasi Selesai • Silakan Klik Setujui Pesanan (Persetujuan Pembeli)'
                  : 'Transaksi Selesai & Lunas',
              }
            : t
        )
      );

      addNotification(
        tx.generatedCode
          ? 'Pesanan Selesai Diproses — Kode Tukar Telah Terbit! 🔓'
          : needsBuyerConfirm
          ? 'Pesanan Siap — Menunggu Persetujuan Pembeli! ✅'
          : 'Transaksi Selesai Diproses! ✅',
        tx.generatedCode
          ? `Transaksi "${cleanBaseTitle}" sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah selesai diproses! Kode Tukar Resmi Anda kini aktif: ${tx.generatedCode}.`
          : needsBuyerConfirm
          ? `Transaksi "${cleanBaseTitle}" sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah selesai diproses! Silakan klik tombol "Setujui Pesanan (Persetujuan Pembeli)" untuk mengonfirmasi pesanan Anda.`
          : `Transaksi "${cleanBaseTitle}" sebesar Rp ${tx.amount.toLocaleString('id-ID')} telah selesai diproses!`,
        'success'
      );
    }

    try {
      confetti({ particleCount: 65, spread: 55, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');

    return { success: true, message: `Transaksi "${tx.title}" berhasil disetujui!` };
  };

  /**
   * PERSETUJUAN PEMBELI SETELAH DISETUJUI ADMIN
   * Untuk pembelian non-kode (seperti Beli Air / PDAM, Tagihan Listrik Pascabayar, Makanan, BPJS, E-Wallet, dll.)
   * yang tidak bisa ditukar dengan kode: setelah disetujui Admin, Pembeli memberikan Persetujuan Pembeli!
   */
  const buyerApproveTransaction = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan!' };
    if (tx.buyerApprovalStatus !== 'waiting_buyer') {
      return { success: false, message: 'Pesanan ini belum siap atau sudah disetujui pembeli sebelumnya.' };
    }

    const cleanBaseTitle = tx.title
      .replace('(Menunggu Persetujuan Pembeli)', '')
      .replace('(Sedang Diproses)', '')
      .replace('(Disetujui Admin)', '')
      .trim();

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              buyerApprovalStatus: 'approved',
              buyerApprovedAt: new Date().toISOString(),
              title: `${cleanBaseTitle} (Disetujui Pembeli ✅)`,
              description: `Telah Disetujui Pembeli pada ${new Date().toLocaleTimeString('id-ID')} WIB • Transaksi Lunas & Selesai`,
            }
          : t
      )
    );

    addNotification(
      'Persetujuan Pembeli Berhasil Dikonfirmasi! 🎉',
      `Anda telah menyetujui pesanan "${cleanBaseTitle}" sebesar Rp ${tx.amount.toLocaleString('id-ID')}. Transaksi kini telah tuntas sepenuhnya!`,
      'success'
    );

    try {
      confetti({ particleCount: 80, spread: 65, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');

    return {
      success: true,
      message: `Pesanan "${cleanBaseTitle}" berhasil dikonfirmasi & disetujui oleh Pembeli!`,
    };
  };

  const buyerApproveAllTransactions = () => {
    const waitingList = transactions.filter(
      (t) => t.accountId === currentAccountId && t.buyerApprovalStatus === 'waiting_buyer'
    );
    let count = 0;
    for (const tx of waitingList) {
      buyerApproveTransaction(tx.id);
      count++;
    }
    return {
      success: true,
      message: `${count} pesanan berhasil disetujui oleh Pembeli sekaligus!`,
      count,
    };
  };

  const adminRejectFinancialTransaction = (transactionId: string, reason: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx) return { success: false, message: 'Transaksi tidak ditemukan' };

    // REFUND SALDO JIKA SUDAH TERPOTONG SAAT PEMBELIAN!
    if (tx.balanceDeducted && tx.type !== 'setor') {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === tx.accountId) {
            const isAdminCard = acc.cardTier === 'admin' || isUnlimitedNumber(acc.balance);
            return { ...acc, balance: isAdminCard ? UNLIMITED_BALANCE : acc.balance + tx.amount };
          }
          return acc;
        })
      );
    }

    // Jika ada kode voucher / cardless yang tergenerate dari transaksi ini, hapus dari daftar kode aktif
    if (tx.generatedCode) {
      setPurchasedCodes((prev) => prev.filter((vc) => vc.code !== tx.generatedCode));
      setCardlessTokens((prev) => prev.filter((ct) => ct.tokenCode !== tx.generatedCode));
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              status: 'rejected',
              buyerApprovalStatus: t.requiresBuyerApproval ? 'rejected' : undefined,
              description: `Dibatalkan: ${reason} (Saldo Rp ${tx.amount.toLocaleString('id-ID')} telah dikembalikan ke rekening)`,
              title: t.title
                .replace('(Menunggu Tinjauan Admin)', '(Dibatalkan - Refund)')
                .replace('(Menunggu Persetujuan Admin)', '(Dibatalkan - Refund)')
                .replace('(Sedang Diproses)', '(Dibatalkan - Refund)'),
            }
          : t
      )
    );

    addNotification(
      'Transaksi Dibatalkan & Saldo Dikembalikan 🔄',
      `Transaksi ${tx.title.replace('(Sedang Diproses)', '').replace('(Menunggu Persetujuan Admin)', '')} sebesar Rp ${tx.amount.toLocaleString('id-ID')} tidak dapat diproses (${reason}). Dana Rp ${tx.amount.toLocaleString('id-ID')} telah dikembalikan 100% ke saldo Anda.`,
      'alert'
    );

    playAtmSound('alert');
    return { success: true, message: 'Transaksi ditolak dan saldo nasabah telah dikembalikan (Refund 100%).' };
  };

  const adminApproveAllFinancialTransactions = () => {
    const pendingList = transactions.filter((t) => t.status === 'pending');
    let count = 0;
    for (const tx of pendingList) {
      adminApproveFinancialTransaction(tx.id);
      count++;
    }
    return { success: true, message: `${count} transaksi keuangan berhasil disetujui sekaligus!`, count };
  };

  /**
   * Pinjaman Online
   */
  const applyLoan = (input: ApplyLoanInput) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };

    const config = LOAN_TIER_CONFIGS[input.loanType];
    if (input.amount < config.minAmount || input.amount > config.maxAmount) {
      return {
        success: false,
        message: `Jumlah pinjaman ${config.title} harus antara Rp ${config.minAmount.toLocaleString('id-ID')} dan Rp ${config.maxAmount.toLocaleString('id-ID')}`,
      };
    }

    const totalInterest = input.amount * config.interestRateMonthly * input.tenorMonths;
    const totalRepayment = input.amount + totalInterest;
    const monthlyInstallment = Math.round(totalRepayment / input.tenorMonths);

    const newLoan: LoanApplication = {
      id: `loan-${Date.now()}`,
      accountId: currentAccount.id,
      applicantName: currentAccount.fullName,
      accountNumber: currentAccount.accountNumber,
      loanType: input.loanType,
      amount: input.amount,
      tenorMonths: input.tenorMonths,
      monthlyInterestRate: config.interestRateMonthly,
      monthlyInstallment,
      totalRepayment,
      monthlyIncome: input.monthlyIncome,
      jobTitle: input.jobTitle,
      purpose: input.purpose,
      status: 'pending',
      appliedAt: new Date().toISOString(),
    };

    setLoans((prev) => [newLoan, ...prev]);
    addNotification('Pengajuan Pinjaman Sedang Diproses 📋', `Permohonan ${config.title} sebesar Rp ${input.amount.toLocaleString('id-ID')} sedang diproses oleh sistem Bank Nusantara.`, 'info');
    return {
      success: true,
      message: 'Permohonan pinjaman online berhasil diajukan dan saat ini sedang diproses!',
      loanId: newLoan.id,
    };
  };

  const adminApproveLoan = (loanId: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Data pinjaman tidak ditemukan' };

    const targetAccount = accounts.find((a) => a.id === loan.accountId);
    if (!targetAccount) return { success: false, message: 'Rekening peminjam tidak ditemukan' };

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'approved',
              decidedAt: new Date().toISOString(),
              remainingInstallments: l.tenorMonths,
              adminNotes: 'Permohonan memenuhi syarat kredit Bank Nusantara. Dana telah dicairkan.',
            }
          : l
      )
    );

    const newBalance = targetAccount.balance + loan.amount;
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === targetAccount.id ? { ...acc, balance: newBalance } : acc))
    );

    const disburseTx: Transaction = {
      id: `tx-loan-${Date.now()}`,
      accountId: targetAccount.id,
      type: 'pinjaman_disburse',
      title: `Pencairan Pinjaman Online (${loan.loanType.toUpperCase()})`,
      amount: loan.amount,
      recipientAccount: targetAccount.accountNumber,
      recipientName: targetAccount.fullName,
      description: `Pencairan dana pinjaman online ${loan.tenorMonths} bulan ke rekening`,
      status: 'success',
      referenceNo: `LOAN${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'pinjaman',
    };
    setTransactions((prev) => [disburseTx, ...prev]);

    addNotification('Pinjaman Disetujui & Cair! 💸', `Pinjaman Anda sebesar Rp ${loan.amount.toLocaleString('id-ID')} telah disetujui Admin dan dana telah langsung masuk ke rekening Anda.`, 'success');
    try {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.5 } });
    } catch { /* empty */ }
    playAtmSound('success');
    return { success: true, message: `Pinjaman Rp ${loan.amount.toLocaleString('id-ID')} berhasil disetujui dan dicairkan ke nasabah!` };
  };

  const adminRejectLoan = (loanId: string, reason: string) => {
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) return { success: false, message: 'Data pinjaman tidak ditemukan' };

    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId
          ? {
              ...l,
              status: 'rejected',
              decidedAt: new Date().toISOString(),
              adminNotes: reason || 'Kapasitas angsuran belum mencukupi batas credit score.',
            }
          : l
      )
    );

    addNotification('Pengajuan Pinjaman Ditolak ⚠️', `Pengajuan pinjaman Anda belum dapat disetujui. Alasan: ${reason}.`, 'alert');
    return { success: true, message: 'Pengajuan pinjaman telah ditolak.' };
  };

  const payLoanInstallment = (loanId: string) => {
    if (!currentAccount) return { success: false, message: 'Akun tidak aktif' };
    const loan = loans.find((l) => l.id === loanId);
    if (!loan || loan.status !== 'approved') return { success: false, message: 'Pinjaman tidak valid' };

    const remaining = loan.remainingInstallments ?? loan.tenorMonths;
    if (remaining <= 0) return { success: false, message: 'Pinjaman ini telah lunas seluruhnya!' };

    if (currentAccount.balance < loan.monthlyInstallment) {
      playAtmSound('alert');
      return { success: false, message: 'Saldo rekening tidak cukup untuk membayar angsuran bulan ini!' };
    }

    const newBalance = currentAccount.balance - loan.monthlyInstallment;
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === currentAccount.id ? { ...acc, balance: newBalance } : acc))
    );

    setLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, remainingInstallments: remaining - 1 } : l))
    );

    const tx: Transaction = {
      id: `tx-pay-loan-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'pinjaman_bayar',
      title: `Pembayaran Angsuran Pinjaman #${loanId.slice(-4)}`,
      amount: loan.monthlyInstallment,
      recipientAccount: 'BANK-NUSANTARA-LOAN',
      recipientName: 'Bank Nusantara Kredit',
      description: `Angsuran pinjaman online`,
      status: 'success',
      referenceNo: `PAY${Date.now()}`,
      timestamp: new Date().toISOString(),
      balanceDeducted: true,
      category: 'pinjaman',
    };
    setTransactions((prev) => [tx, ...prev]);
    addNotification('Pembayaran Angsuran Berhasil 💳', `Angsuran sebesar Rp ${loan.monthlyInstallment.toLocaleString('id-ID')} berhasil dibayarkan.`, 'success');
    playAtmSound('success');
    return { success: true, message: 'Pembayaran angsuran berhasil dilakukan!' };
  };

  const addFavorite = (accountNumber: string, ownerName: string, bankName: string, alias?: string) => {
    const newFav: FavoriteAccount = {
      id: `fav-${Date.now()}`,
      accountNumber: accountNumber.replace(/\s+/g, ''),
      ownerName,
      bankName,
      alias,
      avatarColor: 'bg-blue-600',
    };
    setFavorites((prev) => [newFav, ...prev]);
  };

  const deleteFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const addScheduledPayment = (payment: Omit<ScheduledPayment, 'id' | 'accountId' | 'active'>) => {
    if (!currentAccount) return;
    const newSch: ScheduledPayment = {
      ...payment,
      id: `sch-${Date.now()}`,
      accountId: currentAccount.id,
      active: true,
    };
    setScheduledPayments((prev) => [newSch, ...prev]);
  };

  const toggleScheduledPayment = (id: string) => {
    setScheduledPayments((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const deleteScheduledPayment = (id: string) => {
    setScheduledPayments((prev) => prev.filter((s) => s.id !== id));
  };

  const resetAllData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setCurrentAccountIdState('acc-1');
    setUserRoleState('customer');
    setTransactions(INITIAL_TRANSACTIONS);
    setLoans(INITIAL_LOANS);
    setScheduledPayments(INITIAL_SCHEDULED_PAYMENTS);
    setFavorites(INITIAL_FAVORITES);
    setNotifications(INITIAL_NOTIFICATIONS);
    setChats(INITIAL_CHATS);
    setCardUpgrades(INITIAL_UPGRADES);
    setPockets(INITIAL_POCKETS);
    setDepositos(INITIAL_DEPOSITOS);
    setCardlessTokens(INITIAL_CARDLESS);
    setFeatureConfigs(INITIAL_FEATURE_CONFIGS);
    setRedeemCodes(INITIAL_REDEEM_CODES);
    setPurchasedCodes(INITIAL_PURCHASED_CODES);
    setResiList(INITIAL_RESI_LIST);
    setPinResetRequests([]);
    setWebsitePopups([]);
    setGoogleUser(null);
    try {
      localStorage.clear();
    } catch { /* empty */ }
  };

  const startFromZero = () => {
    const freshPending: BankAccount = {
      id: `acc-zero-${Date.now()}`,
      accountNumber: 'MENUNGGU-ACC',
      fullName: 'Nasabah Baru (Mulai dari Nol)',
      nik: '',
      phone: '081299990000',
      address: '',
      pin: '',
      balance: 0,
      cardTier: 'regular',
      cardNumber: '5392 •••• •••• ••••',
      cvv: '000',
      expiryDate: '10/31',
      cardStatus: 'pending',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: 0,
      createdAt: new Date().toISOString(),
    };
    setAccounts((prev) => [freshPending, ...prev]);
    setCurrentAccountIdState(freshPending.id);
  };

  // ================= RIWAYAT UPDATE (UPDATE SEKARANG & UPDATE SEBELUMNYA) + CUSTOM FEATURE ADMIN HANDLERS =================
  const syncUpdatesToServer = (nextUpdates: AppUpdateRecord[]) => {
    try {
      fetch('/api/sync-state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appUpdates: nextUpdates }),
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  const adminAddAppUpdate = (input: {
    version: string;
    title: string;
    fullDate?: string;
    dateText?: string;
    description: string;
    highlights?: string[];
    changes?: string[];
    isCurrent: boolean;
    categoryBadge?: string;
    author?: string;
  }): { success: boolean; message: string } => {
    const cleanTitle = input.title.trim();
    const cleanDate = (input.fullDate || input.dateText || '').trim();
    const cleanDesc = input.description.trim();
    if (!cleanTitle || !cleanDate || !cleanDesc) {
      return {
        success: false,
        message: 'Nama Update, Tanggal Lengkap, dan Deskripsi wajib diisi!',
      };
    }

    const rawHighlights = input.highlights || input.changes || [];
    const filteredHighlights =
      rawHighlights.length > 0 ? rawHighlights.filter((h) => h.trim().length > 0) : undefined;

    const newUpdate: AppUpdateRecord = {
      id: `upd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      version: input.version.trim() || `v${(appUpdates.length + 1).toFixed(1)}`,
      title: cleanTitle,
      fullDate: cleanDate,
      dateText: cleanDate,
      description: cleanDesc,
      highlights: filteredHighlights,
      changes: filteredHighlights,
      isCurrent: input.isCurrent,
      categoryBadge:
        input.categoryBadge?.trim() ||
        (input.isCurrent ? 'UPDATE SEKARANG (TERBARU)' : 'Riwayat Update'),
      author: input.author?.trim() || 'Admin Utama Bank Nusantara',
      createdAt: new Date().toISOString(),
    };

    setAppUpdates((prev) => {
      const updatedPrev = input.isCurrent
        ? prev.map((u) => ({
            ...u,
            isCurrent: false,
            categoryBadge:
              u.categoryBadge === 'UPDATE SEKARANG (RILIS UTAMA)' ||
              u.categoryBadge === 'UPDATE SEKARANG (TERBARU)'
                ? 'Update Sebelumnya'
                : u.categoryBadge,
          }))
        : prev;
      const next = [newUpdate, ...updatedPrev];
      syncUpdatesToServer(next);
      return next;
    });

    playAtmSound('success');
    return {
      success: true,
      message: `Riwayat Update "${newUpdate.title}" (${newUpdate.fullDate}) berhasil disimpan dan langsung tampil di halaman Riwayat Update!`,
    };
  };

  const adminEditAppUpdate = (
    id: string,
    input: Partial<AppUpdateRecord>
  ): { success: boolean; message: string } => {
    setAppUpdates((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          const mergedDate = input.fullDate || input.dateText || u.fullDate || u.dateText || '';
          const mergedHighlights = input.highlights || input.changes || u.highlights || u.changes;
          return {
            ...u,
            ...input,
            fullDate: mergedDate,
            dateText: mergedDate,
            highlights: mergedHighlights,
            changes: mergedHighlights,
          };
        }
        if (input.isCurrent === true) {
          return { ...u, isCurrent: false };
        }
        return u;
      });
      syncUpdatesToServer(next);
      return next;
    });
    playAtmSound('success');
    return {
      success: true,
      message: 'Data Riwayat Update berhasil diperbarui oleh Admin.',
    };
  };

  const adminSetCurrentAppUpdate = (id: string): { success: boolean; message: string } => {
    let targetTitle = '';
    setAppUpdates((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          targetTitle = u.title;
          return {
            ...u,
            isCurrent: true,
            categoryBadge: 'UPDATE SEKARANG (TERBARU)',
          };
        }
        return {
          ...u,
          isCurrent: false,
          categoryBadge:
            u.categoryBadge?.includes('UPDATE SEKARANG') ? 'Update Sebelumnya' : u.categoryBadge,
        };
      });
      syncUpdatesToServer(next);
      return next;
    });
    playAtmSound('success');
    return {
      success: true,
      message: `"${targetTitle}" kini ditetapkan sebagai Update Sekarang (Terbaru), dan update lainnya dipindahkan ke Update Sebelumnya!`,
    };
  };

  const adminDeleteAppUpdate = (id: string): { success: boolean; message: string } => {
    setAppUpdates((prev) => {
      const filtered = prev.filter((u) => u.id !== id);
      if (filtered.length > 0 && !filtered.some((u) => u.isCurrent)) {
        filtered[0] = { ...filtered[0], isCurrent: true };
      }
      syncUpdatesToServer(filtered);
      return filtered;
    });
    playAtmSound('beep');
    return {
      success: true,
      message: 'Catatan Riwayat Update telah dihapus.',
    };
  };

  const adminResetAppUpdates = (): { success: boolean; message: string } => {
    setAppUpdates(INITIAL_APP_UPDATES);
    syncUpdatesToServer(INITIAL_APP_UPDATES);
    playAtmSound('success');
    return {
      success: true,
      message: 'Daftar Riwayat Update dikembalikan ke daftar bawaan resmi.',
    };
  };

  const adminAddCustomFeature = (input: {
    title: string;
    category: string;
    description: string;
    defaultAmount: number;
    requireAdminPin: boolean;
    requireAdminApproval: boolean;
  }): { success: boolean; message: string } => {
    const cleanTitle = input.title.trim();
    if (!cleanTitle) {
      return { success: false, message: 'Nama fitur baru wajib diisi!' };
    }
    const newFeat: FeatureSecurityConfig = {
      id: `custom_feat_${Date.now()}`,
      title: cleanTitle,
      category: input.category.trim() || 'Layanan Ekstra Admin',
      description:
        input.description.trim() ||
        `Layanan perbankan digital resmi ${cleanTitle} yang ditambahkan melalui Panel Admin Bank Nusantara.`,
      defaultAmount: Math.max(0, input.defaultAmount || 100_000),
      isPaidWithMoney: true,
      requireAdminPin: input.requireAdminPin,
      requireAdminApproval: input.requireAdminApproval,
    };
    setFeatureConfigs((prev) => [newFeat, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Fitur baru "${newFeat.title}" berhasil ditambahkan ke Katalog Fitur Nasabah & Kontrol Fitur Admin!`,
    };
  };

  // ============================================================================
  // LOWONGAN PEKERJAAN, SISTEM LEVEL, VOUCHER LEVEL & ARENA SUIT KOMPUTER MEDIUM
  // ============================================================================
  const [atmVaultBalance, setAtmVaultBalance] = useState<number>(850_000_000);

  const workJobClick = (
    jobId: string,
    salary: number,
    targetClicks: number,
    requiredLevel: number,
    jobTitle: string
  ): {
    success: boolean;
    completed: boolean;
    currentClicks: number;
    targetClicks: number;
    paidAmount?: number;
    message: string;
  } => {
    if (!currentAccount) {
      return {
        success: false,
        completed: false,
        currentClicks: 0,
        targetClicks,
        message: 'Silakan login ke kartu rekening terlebih dahulu.',
      };
    }

    const userLevel = currentAccount.jobLevel || 1;
    if (userLevel < requiredLevel) {
      playAtmSound('alert');
      return {
        success: false,
        completed: false,
        currentClicks: currentAccount.jobClickProgress?.[jobId] || 0,
        targetClicks,
        message: `Pekerjaan ini membutuhkan Level ${requiredLevel} (Level Anda saat ini: Level ${userLevel}). Silakan tingkatkan level terlebih dahulu!`,
      };
    }

    const power = Math.max(1, currentAccount.clickPower || 1);
    const mult = Math.max(1, currentAccount.salaryMultiplier || 1);
    const prevClicks = currentAccount.jobClickProgress?.[jobId] || 0;
    const nextClicks = prevClicks + power;

    if (nextClicks >= targetClicks) {
      const finalSalary = Math.round(salary * mult);
      const isUnlim =
        currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);
      const newBalance = isUnlim ? UNLIMITED_BALANCE : currentAccount.balance + finalSalary;

      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== currentAccount.id) return a;
          const nextMap = { ...(a.jobClickProgress || {}), [jobId]: 0 };
          return {
            ...a,
            balance: newBalance,
            jobClickProgress: nextMap,
            totalJobsCompleted: (a.totalJobsCompleted || 0) + 1,
            totalJobEarnings: (a.totalJobEarnings || 0) + finalSalary,
            rewardPoints: (a.rewardPoints || 0) + Math.max(10, Math.round(finalSalary / 10_000)),
          };
        })
      );

      const salaryTx: Transaction = {
        id: `tx-job-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        accountId: currentAccount.id,
        type: 'setor',
        title: `💼 Gaji Pekerjaan Cair: ${jobTitle} (${targetClicks}/${targetClicks} Klik)`,
        amount: finalSalary,
        balanceAfter: newBalance,
        date: new Date().toISOString(),
        referenceNo: `JOB-${Date.now().toString().slice(-6)}`,
        status: 'berhasil',
        note: `Gaji langsung masuk rekening setelah menyelesaikan target ${targetClicks} klik.`,
      };
      setTransactions((prev) => [salaryTx, ...prev]);

      playAtmSound('cash');
      return {
        success: true,
        completed: true,
        currentClicks: 0,
        targetClicks,
        paidAmount: finalSalary,
        message: `🎉 TARGET ${targetClicks} KLIK TERCAPAI! Anda langsung digaji ${formatRupiah(
          finalSalary
        )} dari pekerjaan "${jobTitle}"! Saldo langsung bertambah.`,
      };
    } else {
      setAccounts((prev) =>
        prev.map((a) => {
          if (a.id !== currentAccount.id) return a;
          const nextMap = { ...(a.jobClickProgress || {}), [jobId]: nextClicks };
          return {
            ...a,
            jobClickProgress: nextMap,
          };
        })
      );
      return {
        success: true,
        completed: false,
        currentClicks: nextClicks,
        targetClicks,
        message: `Progres kerja: ${nextClicks} / ${targetClicks} klik.`,
      };
    }
  };

  const upgradeJobLevelWithCash = (): {
    success: boolean;
    newLevel?: number;
    message: string;
  } => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }
    const UPGRADE_COST = 1_000_000;
    const isUnlim =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isUnlim && currentAccount.balance < UPGRADE_COST) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Saldo tidak cukup! Biaya meningkatkan level secara langsung adalah Rp 1.000.000 (Saldo Anda: ${formatRupiah(
          currentAccount.balance
        )}). Anda juga bisa main Suit lawan Komputer (Rp 500.000) untuk mendapat Voucher Level + Rp 300.000!`,
      };
    }

    const oldLevel = currentAccount.jobLevel || 1;
    const newLevel = oldLevel + 1;
    const newBalance = isUnlim ? UNLIMITED_BALANCE : currentAccount.balance - UPGRADE_COST;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: newBalance,
              jobLevel: newLevel,
            }
          : a
      )
    );

    const tx: Transaction = {
      id: `tx-lvlup-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'tagihan',
      title: `⬆️ Upgrade Level Pekerjaan (Level ${oldLevel} ➔ Level ${newLevel})`,
      amount: UPGRADE_COST,
      balanceAfter: newBalance,
      date: new Date().toISOString(),
      referenceNo: `LVL-${Date.now().toString().slice(-6)}`,
      status: 'berhasil',
      note: `Pembayaran Rp 1.000.000 untuk meningkatkan Level Pekerjaan ke Level ${newLevel}.`,
    };
    setTransactions((prev) => [tx, ...prev]);
    playAtmSound('success');

    return {
      success: true,
      newLevel,
      message: `✅ Berhasil! Level Pekerjaan Anda naik dari Level ${oldLevel} menjadi Level ${newLevel} dengan pembayaran Rp 1.000.000!`,
    };
  };

  const useJobLevelVoucher = (
    count = 1
  ): {
    success: boolean;
    newLevel?: number;
    message: string;
  } => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login terlebih dahulu.' };
    }
    const available = currentAccount.levelVouchers || 0;
    const useCount = Math.max(1, Math.min(count, available));
    if (available < 1) {
      playAtmSound('alert');
      return {
        success: false,
        message:
          'Anda belum memiliki Voucher Level! Menangkan permainan Suit lawan Komputer (Level Medium) untuk mendapatkan 1 Voucher Level + Rp 300.000.',
      };
    }

    const oldLevel = currentAccount.jobLevel || 1;
    const newLevel = oldLevel + useCount;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              jobLevel: newLevel,
              levelVouchers: Math.max(0, (a.levelVouchers || 0) - useCount),
            }
          : a
      )
    );

    playAtmSound('success');
    return {
      success: true,
      newLevel,
      message: `🎫 ${useCount} Voucher Level berhasil digunakan! Level Anda meningkat dari Level ${oldLevel} ke Level ${newLevel} tanpa potongan saldo!`,
    };
  };

  const playSuitForLevelVoucher = (
    playerChoice: 'batu' | 'gunting' | 'kertas'
  ): {
    success: boolean;
    outcome?: 'win' | 'draw' | 'lose';
    playerChoice: 'batu' | 'gunting' | 'kertas';
    computerChoice?: 'batu' | 'gunting' | 'kertas';
    rewardCash?: number;
    rewardVoucher?: number;
    message: string;
  } => {
    if (!currentAccount) {
      return {
        success: false,
        playerChoice,
        message: 'Silakan login terlebih dahulu.',
      };
    }

    const SUIT_COST = 500_000;
    const WIN_CASH_PRIZE = 300_000;
    const isUnlim =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isUnlim && currentAccount.balance < SUIT_COST) {
      playAtmSound('alert');
      return {
        success: false,
        playerChoice,
        message: `Saldo tidak mencukupi untuk Suit! Biaya Suit lawan Komputer (Medium) adalah Rp 500.000 (Saldo Anda: ${formatRupiah(
          currentAccount.balance
        )}). Kerjakan lowongan Rp 100.000 (Gratis) terlebih dahulu untuk mengumpulkan modal!`,
      };
    }

    // Komputer Level Medium (Sedang): peluang adil & seimbang (45% Menang, 25% Seri/Ulang Gratis, 30% Kalah)
    const roll = Math.random();
    let outcome: 'win' | 'draw' | 'lose';
    if (roll < 0.45) {
      outcome = 'win';
    } else if (roll < 0.7) {
      outcome = 'draw';
    } else {
      outcome = 'lose';
    }

    const winningMap: Record<'batu' | 'gunting' | 'kertas', 'batu' | 'gunting' | 'kertas'> = {
      batu: 'gunting', // batu mengalahkan gunting
      gunting: 'kertas', // gunting mengalahkan kertas
      kertas: 'batu', // kertas mengalahkan batu
    };
    const losingMap: Record<'batu' | 'gunting' | 'kertas', 'batu' | 'gunting' | 'kertas'> = {
      batu: 'kertas',
      gunting: 'batu',
      kertas: 'gunting',
    };

    let computerChoice: 'batu' | 'gunting' | 'kertas';
    if (outcome === 'win') {
      computerChoice = winningMap[playerChoice];
    } else if (outcome === 'draw') {
      computerChoice = playerChoice;
    } else {
      computerChoice = losingMap[playerChoice];
    }

    if (outcome === 'win') {
      // Bayar 500.000, dapat 1 Voucher Level + hadiah uang 300.000
      const afterEntryBal = isUnlim ? UNLIMITED_BALANCE : currentAccount.balance - SUIT_COST;
      const finalBal = isUnlim ? UNLIMITED_BALANCE : afterEntryBal + WIN_CASH_PRIZE;

      setAccounts((prev) =>
        prev.map((a) =>
          a.id === currentAccount.id
            ? {
                ...a,
                balance: finalBal,
                levelVouchers: (a.levelVouchers || 0) + 1,
                suitWins: (a.suitWins || 0) + 1,
                suitPlayed: (a.suitPlayed || 0) + 1,
              }
            : a
        )
      );

      const entryTx: Transaction = {
        id: `tx-suit-in-${Date.now()}`,
        accountId: currentAccount.id,
        type: 'tagihan',
        title: `🎮 Biaya Suit Lawan Komputer Medium (${playerChoice.toUpperCase()} vs ${computerChoice.toUpperCase()})`,
        amount: SUIT_COST,
        balanceAfter: afterEntryBal,
        date: new Date().toISOString(),
        referenceNo: `SUIT-${Date.now().toString().slice(-6)}`,
        status: 'berhasil',
      };
      const prizeTx: Transaction = {
        id: `tx-suit-win-${Date.now() + 1}`,
        accountId: currentAccount.id,
        type: 'setor',
        title: `🏆 Menang Suit Komputer Medium (+1 Voucher Level & Hadiah Rp 300.000)`,
        amount: WIN_CASH_PRIZE,
        balanceAfter: finalBal,
        date: new Date().toISOString(),
        referenceNo: `WIN-${Date.now().toString().slice(-6)}`,
        status: 'berhasil',
      };
      setTransactions((prev) => [prizeTx, entryTx, ...prev]);
      playAtmSound('cash');

      return {
        success: true,
        outcome: 'win',
        playerChoice,
        computerChoice,
        rewardCash: WIN_CASH_PRIZE,
        rewardVoucher: 1,
        message: `🎉 MENANG SUIT! (${playerChoice.toUpperCase()} mengalahkan ${computerChoice.toUpperCase()} Komputer Medium). Anda mendapatkan +1 VOUCHER LEVEL dan hadiah uang Rp 300.000!`,
      };
    } else if (outcome === 'draw') {
      // Seri: biaya 500.000 dikembalikan utuh
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === currentAccount.id
            ? {
                ...a,
                suitPlayed: (a.suitPlayed || 0) + 1,
              }
            : a
        )
      );
      playAtmSound('beep');
      return {
        success: true,
        outcome: 'draw',
        playerChoice,
        computerChoice,
        rewardCash: 0,
        rewardVoucher: 0,
        message: `🤝 SERI / DRAW! (${playerChoice.toUpperCase()} vs ${computerChoice.toUpperCase()}). Biaya Rp 500.000 TIDAK DIPOTONG (dikembalikan 100%). Ayo suit lagi!`,
      };
    } else {
      // Kalah: potong 500.000
      const finalBal = isUnlim ? UNLIMITED_BALANCE : currentAccount.balance - SUIT_COST;
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === currentAccount.id
            ? {
                ...a,
                balance: finalBal,
                suitPlayed: (a.suitPlayed || 0) + 1,
              }
            : a
        )
      );

      const loseTx: Transaction = {
        id: `tx-suit-lose-${Date.now()}`,
        accountId: currentAccount.id,
        type: 'tagihan',
        title: `🎮 Suit Lawan Komputer Medium - Kalah (${playerChoice.toUpperCase()} vs ${computerChoice.toUpperCase()})`,
        amount: SUIT_COST,
        balanceAfter: finalBal,
        date: new Date().toISOString(),
        referenceNo: `SUIT-${Date.now().toString().slice(-6)}`,
        status: 'berhasil',
      };
      setTransactions((prev) => [loseTx, ...prev]);
      playAtmSound('alert');

      return {
        success: true,
        outcome: 'lose',
        playerChoice,
        computerChoice,
        rewardCash: 0,
        rewardVoucher: 0,
        message: `💥 Komputer Medium menang (${computerChoice.toUpperCase()} mengalahkan ${playerChoice.toUpperCase()}). Biaya Rp 500.000 terpakai. Coba lagi untuk merebut Voucher Level + Rp 300.000!`,
      };
    }
  };

  // ============================================================================
  // 30+ FITUR SUPER TOOLS BARU DI PANEL ADMIN (TOTAL 56 SUPER TOOLS GA KALENG-KALENG)
  // ============================================================================
  const adminSetAccountJobLevel = (
    accountId: string,
    level: number,
    mode: 'add' | 'set' | 'max'
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const currentLvl = target.jobLevel || 1;
    const nextLvl =
      mode === 'max'
        ? 100
        : mode === 'add'
        ? Math.max(1, currentLvl + level)
        : Math.max(1, level);

    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, jobLevel: nextLvl } : a))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Level Pekerjaan ${target.fullName} berhasil diubah menjadi Level ${nextLvl}! Semua lowongan hingga Level ${nextLvl} langsung terbuka.`,
    };
  };

  const adminAdjustLevelVouchers = (
    accountId: string,
    count: number,
    mode: 'add' | 'set'
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const cur = target.levelVouchers || 0;
    const next = mode === 'add' ? Math.max(0, cur + count) : Math.max(0, count);
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, levelVouchers: next } : a))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Voucher Level ${target.fullName} berhasil diatur menjadi ${next} Voucher Level!`,
    };
  };

  const adminInstantCompleteJobSalary = (
    accountId: string,
    jobId: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const job =
      JOB_VACANCIES_CATALOG.find((j) => j.id === jobId) ||
      JOB_VACANCIES_CATALOG[JOB_VACANCIES_CATALOG.length - 1];
    const mult = Math.max(1, target.salaryMultiplier || 1);
    const totalPay = job.salary * mult;
    const isUnlim = target.cardTier === 'admin' || isUnlimitedNumber(target.balance);
    const nextBal = isUnlim ? UNLIMITED_BALANCE : target.balance + totalPay;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              balance: nextBal,
              totalJobsCompleted: (a.totalJobsCompleted || 0) + 1,
              totalJobEarnings: (a.totalJobEarnings || 0) + totalPay,
            }
          : a
      )
    );

    const tx: Transaction = {
      id: `tx-admin-job-${Date.now()}`,
      accountId: target.id,
      type: 'setor',
      title: `⚡ Gajian Instan Otoritas Admin: ${job.title}`,
      amount: totalPay,
      balanceAfter: nextBal,
      date: new Date().toISOString(),
      referenceNo: `ADMJOB-${Date.now().toString().slice(-6)}`,
      status: 'berhasil',
    };
    setTransactions((prev) => [tx, ...prev]);
    playAtmSound('cash');
    return {
      success: true,
      message: `Gaji pekerjaan "${job.title}" sebesar ${formatRupiah(
        totalPay
      )} langsung dicairkan ke rekening ${target.fullName} tanpa perlu klik!`,
    };
  };

  const adminSetClickPower = (
    accountId: string,
    power: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const cleanPower = Math.max(1, power);
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, clickPower: cleanPower } : a))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Kekuatan Klik Kerja (Click Power) ${target.fullName} disetel ke ${cleanPower}x Klik per 1 ketukan!`,
    };
  };

  const adminSetSalaryMultiplier = (
    accountId: string,
    multiplier: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const cleanMult = Math.max(1, multiplier);
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, salaryMultiplier: cleanMult } : a))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Multiplier Gaji Pekerjaan ${target.fullName} berhasil diatur menjadi ${cleanMult}x Lipat!`,
    };
  };

  const adminMassLevelVoucherRain = (
    vouchers: number
  ): { success: boolean; message: string } => {
    const addV = Math.max(1, vouchers);
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        levelVouchers: (a.levelVouchers || 0) + addV,
      }))
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Hujan ${addV} Voucher Level berhasil dibagikan ke seluruh ${accounts.length} nasabah Bank Nusantara!`,
    };
  };

  const adminMassUpgradeAllJobLevels = (
    levelsToAdd: number
  ): { success: boolean; message: string } => {
    const addL = Math.max(1, levelsToAdd);
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        jobLevel: (a.jobLevel || 1) + addL,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Level Pekerjaan seluruh ${accounts.length} nasabah berhasil dinaikkan +${addL} Level secara serentak!`,
    };
  };

  const adminRefillAtmVaultCash = (amount: number): { success: boolean; message: string } => {
    const addAmt = Math.max(10_000_000, amount);
    setAtmVaultBalance((prev) => prev + addAmt);
    playAtmSound('cash');
    return {
      success: true,
      message: `Brankas Mesin ATM Fisik berhasil diisi ulang sebesar ${formatRupiah(
        addAmt
      )}. Total Kas Brankas ATM sekarang: ${formatRupiah(atmVaultBalance + addAmt)}.`,
    };
  };

  const adminApplyMassTaxOrAdminFee = (
    value: number,
    mode: 'percent' | 'fixed',
    reason: string
  ): { success: boolean; message: string } => {
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.cardTier === 'admin' || isUnlimitedNumber(a.balance)) return a;
        const deduction =
          mode === 'percent'
            ? Math.round((a.balance * Math.min(90, Math.max(1, value))) / 100)
            : Math.max(0, value);
        return {
          ...a,
          balance: Math.max(0, a.balance - deduction),
        };
      })
    );
    playAtmSound('beep');
    return {
      success: true,
      message: `Pemotongan Pajak / Biaya Admin Massal (${
        mode === 'percent' ? `${value}%` : formatRupiah(value)
      }) untuk "${reason || 'Pajak Resmi'}" berhasil diterapkan ke seluruh nasabah reguler.`,
    };
  };

  const adminDistributeBankDividend = (
    percentBonus: number
  ): { success: boolean; message: string } => {
    const pct = Math.max(1, percentBonus);
    setAccounts((prev) =>
      prev.map((a) => {
        if (a.cardTier === 'admin' || isUnlimitedNumber(a.balance)) return a;
        const bonus = Math.round((a.balance * pct) / 100);
        return {
          ...a,
          balance: a.balance + bonus,
        };
      })
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Dividen Saham & Bunga Bonus +${pct}% berhasil dibagikan ke saldo seluruh nasabah Bank Nusantara!`,
    };
  };

  const adminSetAccountCashbackPercent = (
    accountId: string,
    percent: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const cleanPct = Math.max(0, Math.min(100, percent));
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, cashbackPercent: cleanPct } : a))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Auto-Cashback rekening ${target.fullName} berhasil diatur ke ${cleanPct}%!`,
    };
  };

  const adminToggleVipShield = (
    accountId: string,
    active: boolean
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              vipShieldActive: active,
              cardStatus: active ? 'active' : a.cardStatus,
              banInfo: active ? undefined : a.banInfo,
            }
          : a
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Perisai VIP Anti-Banned & Proteksi Saldo untuk ${target.fullName} kini ${
        active ? 'AKTIF (Kebal Banned & Beku)' : 'DINONAKTIFKAN'
      }.`,
    };
  };

  const adminRollbackLastTransaction = (
    accountId: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const lastTx = transactions.find((t) => t.accountId === accountId);
    if (!lastTx) {
      return { success: false, message: 'Tidak ada transaksi untuk di-rollback pada rekening ini.' };
    }

    const isOut =
      lastTx.type === 'tarik' ||
      lastTx.type === 'transfer_out' ||
      lastTx.type === 'tagihan' ||
      lastTx.type === 'pinjaman_bayar';
    const isUnlim = target.cardTier === 'admin' || isUnlimitedNumber(target.balance);
    const nextBal = isUnlim
      ? UNLIMITED_BALANCE
      : isOut
      ? target.balance + lastTx.amount
      : Math.max(0, target.balance - lastTx.amount);

    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, balance: nextBal } : a))
    );
    setTransactions((prev) => prev.filter((t) => t.id !== lastTx.id));
    playAtmSound('success');
    return {
      success: true,
      message: `Transaksi terakhir "${lastTx.title}" (${formatRupiah(
        lastTx.amount
      )}) berhasil di-rollback dan saldo ${target.fullName} dikembalikan!`,
    };
  };

  const adminMergeTwoAccounts = (
    sourceAccountId: string,
    targetAccountId: string
  ): { success: boolean; message: string } => {
    if (sourceAccountId === targetAccountId) {
      return { success: false, message: 'Pilih dua rekening yang berbeda untuk digabungkan.' };
    }
    const src = accounts.find((a) => a.id === sourceAccountId);
    const dst = accounts.find((a) => a.id === targetAccountId);
    if (!src || !dst) return { success: false, message: 'Rekening sumber atau tujuan tidak valid.' };

    const transferBal = isUnlimitedNumber(src.balance) ? 50_000_000 : src.balance;
    const transferPts = src.rewardPoints || 0;
    const transferVouchers = src.levelVouchers || 0;

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id === sourceAccountId) {
          return { ...a, balance: 0, rewardPoints: 0, levelVouchers: 0 };
        }
        if (a.id === targetAccountId) {
          const isUnlim = a.cardTier === 'admin' || isUnlimitedNumber(a.balance);
          return {
            ...a,
            balance: isUnlim ? UNLIMITED_BALANCE : a.balance + transferBal,
            rewardPoints: (a.rewardPoints || 0) + transferPts,
            levelVouchers: (a.levelVouchers || 0) + transferVouchers,
            jobLevel: Math.max(a.jobLevel || 1, src.jobLevel || 1),
          };
        }
        return a;
      })
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Seluruh aset ${src.fullName} (Saldo ${formatRupiah(
        transferBal
      )}, ${transferPts} Poin, & ${transferVouchers} Voucher Level) berhasil digabungkan ke rekening ${
        dst.fullName
      }!`,
    };
  };

  const adminConvertPointsToCash = (
    accountId: string,
    ratePerPoint: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const pts = isUnlimitedNumber(target.rewardPoints || 0) ? 100_000 : target.rewardPoints || 0;
    if (pts <= 0) {
      return { success: false, message: 'Nasabah ini belum memiliki Poin Reward.' };
    }
    const cashVal = pts * Math.max(100, ratePerPoint);
    const isUnlim = target.cardTier === 'admin' || isUnlimitedNumber(target.balance);
    const nextBal = isUnlim ? UNLIMITED_BALANCE : target.balance + cashVal;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId ? { ...a, balance: nextBal, rewardPoints: 0 } : a
      )
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `${pts.toLocaleString('id-ID')} Poin Reward milik ${
        target.fullName
      } berhasil dikonversi menjadi uang tunai ${formatRupiah(cashVal)}!`,
    };
  };

  const adminConvertPulsaPlnToCash = (
    accountId: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const pulsaVal = isUnlimitedNumber(target.pulsaBalance || 0) ? 1_000_000 : target.pulsaBalance || 0;
    const plnVal = (isUnlimitedNumber(target.plnKwhBalance || 0) ? 500 : target.plnKwhBalance || 0) * 1500;
    const totalRefund = pulsaVal + plnVal;
    if (totalRefund <= 0) {
      return { success: false, message: 'Saldo Pulsa dan Token kWh pada rekening ini masih 0.' };
    }
    const isUnlim = target.cardTier === 'admin' || isUnlimitedNumber(target.balance);
    const nextBal = isUnlim ? UNLIMITED_BALANCE : target.balance + totalRefund;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? { ...a, balance: nextBal, pulsaBalance: 0, plnKwhBalance: 0 }
          : a
      )
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Saldo Pulsa & Token PLN milik ${target.fullName} berhasil dicairkan kembali menjadi saldo rekening sebesar ${formatRupiah(
        totalRefund
      )}!`,
    };
  };

  const adminCreateSpecialDeposito = (
    accountId: string,
    principal: number,
    tenorMonths: number,
    bonusRatePercent: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const newDepo: DepositoItem = {
      id: `depo-vip-${Date.now()}`,
      accountId,
      principalAmount: Math.max(1_000_000, principal),
      tenorMonths: Math.max(1, tenorMonths),
      interestRateAnnual: Math.max(5, bonusRatePercent) / 100,
      startDate: new Date().toISOString().slice(0, 10),
      maturityDate: new Date(Date.now() + tenorMonths * 30 * 86400000).toISOString().slice(0, 10),
      status: 'active',
    };
    setDepositos((prev) => [newDepo, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Deposito Sultan Khusus (${formatRupiah(
        newDepo.principalAmount
      )}, Bunga ${bonusRatePercent}% p.a) berhasil diterbitkan gratis untuk ${target.fullName}!`,
    };
  };

  const adminForceLiquidateAllDepositos = (
    accountId: string,
    bonusPercent: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const accDepos = depositos.filter((d) => d.accountId === accountId && d.status === 'active');
    if (accDepos.length === 0) {
      return { success: false, message: 'Nasabah ini tidak memiliki deposito aktif.' };
    }
    const totalPrincipal = accDepos.reduce((acc, d) => acc + d.principalAmount, 0);
    const totalPayout = Math.round(totalPrincipal * (1 + Math.max(0, bonusPercent) / 100));
    const isUnlim = target.cardTier === 'admin' || isUnlimitedNumber(target.balance);

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? { ...a, balance: isUnlim ? UNLIMITED_BALANCE : a.balance + totalPayout }
          : a
      )
    );
    setDepositos((prev) => prev.filter((d) => d.accountId !== accountId));
    playAtmSound('cash');
    return {
      success: true,
      message: `${accDepos.length} Deposito milik ${target.fullName} berhasil dicairkan penuh + bonus ${bonusPercent}% (${formatRupiah(
        totalPayout
      )}) langsung ke saldo utama!`,
    };
  };

  const adminCreateFundedPocket = (
    accountId: string,
    title: string,
    amount: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const cleanAmt = Math.max(500_000, amount);
    const newPocket: SavingsPocket = {
      id: `pck-adm-${Date.now()}`,
      accountId,
      title: title.trim() || 'Kantong Impian Hadiah Admin',
      targetAmount: cleanAmt,
      currentAmount: cleanAmt,
      iconName: 'Sparkles',
      colorClass: 'from-emerald-500 to-teal-600',
    };
    setPockets((prev) => [newPocket, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Kantong Tabungan "${newPocket.title}" terisi penuh 100% (${formatRupiah(
        cleanAmt
      )}) berhasil ditambahkan ke akun ${target.fullName}!`,
    };
  };

  const adminFreeClearAllCodResi = (): { success: boolean; message: string } => {
    setResiList((prev) =>
      prev.map((r) => ({
        ...r,
        isCodPaid: true,
        status: 'Selesai Diterima',
        currentLocation: `${r.destination} (Lunas Subsidi Admin)`,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Seluruh paket Resi & Tagihan COD (${resiList.length} paket) berhasil dilunasi gratis oleh Admin dan berstatus Selesai Diterima!`,
    };
  };

  const adminCreateCustomResiForAccount = (
    accountId: string,
    courier: string,
    itemDesc: string,
    codAmount: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const resiNo = `BNUS${Math.floor(100000000 + Math.random() * 900000000)}`;
    const newResi: ResiTrackingRecord = {
      id: `resi-adm-${Date.now()}`,
      accountId,
      resiNumber: resiNo,
      courier: courier || 'Nusantara Express VIP',
      sender: itemDesc || 'Logistik Pusat Bank Nusantara',
      recipient: target.fullName,
      origin: 'Jakarta Pusat',
      destination: target.address || 'Alamat Nasabah',
      status: 'Dalam Perjalanan',
      currentLocation: 'Hub Sorting Nusantara Pusat',
      shippingFee: 0,
      codAmount: Math.max(0, codAmount),
      isCodPaid: codAmount <= 0,
      updatedAt: new Date().toISOString(),
      history: [
        {
          time: new Date().toLocaleString('id-ID'),
          location: 'Jakarta Pusat',
          note: `Paket "${itemDesc || 'Kiriman Khusus Admin'}" dikirim melalui Panel Admin.`,
        },
      ],
    };
    setResiList((prev) => [newResi, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Nomor Resi baru ${resiNo} (${newResi.courier}) untuk ${target.fullName} berhasil diterbitkan!`,
    };
  };

  const adminExecuteAllScheduledPaymentsNow = (): {
    success: boolean;
    message: string;
  } => {
    const activeScheds = scheduledPayments.filter((s) => s.active);
    if (activeScheds.length === 0) {
      return { success: false, message: 'Tidak ada jadwal pembayaran aktif saat ini.' };
    }
    const newTxs: Transaction[] = activeScheds.map((s, idx) => ({
      id: `tx-sched-adm-${Date.now()}-${idx}`,
      accountId: s.accountId,
      type: 'tagihan',
      title: `⚡ Eksekusi Jadwal Rutin oleh Admin: ${s.title}`,
      amount: s.amount,
      balanceAfter:
        accounts.find((a) => a.id === s.accountId)?.balance || 10_000_000,
      date: new Date().toISOString(),
      referenceNo: `SCH-${Date.now().toString().slice(-5)}${idx}`,
      status: 'berhasil',
    }));
    setTransactions((prev) => [...newTxs, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `${activeScheds.length} Jadwal Pembayaran Rutin nasabah berhasil dieksekusi & dilunasi langsung oleh Admin!`,
    };
  };

  const adminMasterApproveEverything = (): { success: boolean; message: string } => {
    const c1 = adminApproveAllPendingCards().count;
    const c2 = adminApproveAllPendingUpgrades().count;
    const c3 = adminApproveAllPendingLoans().count;
    const c4 = adminApproveAllFinancialTransactions().count;
    playAtmSound('cash');
    return {
      success: true,
      message: `⚡ SAPU BERSIH SELESAI! Disetujui serentak: ${c1} Kartu Baru, ${c2} Upgrade Kartu, ${c3} Pinjaman Online, dan ${c4} Transaksi Keuangan.`,
    };
  };

  const adminResetCareerStats = (
    accountId: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              jobLevel: 1,
              levelVouchers: 0,
              jobClickProgress: {},
              totalJobsCompleted: 0,
              totalJobEarnings: 0,
              suitWins: 0,
              suitPlayed: 0,
              clickPower: 1,
              salaryMultiplier: 1,
            }
          : a
      )
    );
    playAtmSound('beep');
    return {
      success: true,
      message: `Statistik Karir, Level Pekerjaan, & Voucher Level untuk ${target.fullName} berhasil di-reset kembali ke Level 1.`,
    };
  };

  const adminDuplicateCustomerVouchers = (
    accountId: string
  ): { success: boolean; message: string } => {
    const myCodes = purchasedCodes.filter((c) => c.accountId === accountId && !c.isRedeemed);
    if (myCodes.length === 0) {
      return {
        success: false,
        message: 'Nasabah ini belum memiliki voucher aktif untuk digandakan.',
      };
    }
    const clones: PurchasedVoucherCode[] = myCodes.map((c, idx) => ({
      ...c,
      id: `vc-clone-${Date.now()}-${idx}`,
      secretCode: `${c.secretCode.slice(0, -4)}${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
    }));
    setPurchasedCodes((prev) => [...clones, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `${clones.length} Kode Voucher Pulsa & Token Listrik milik nasabah berhasil digandakan 2x lipat!`,
    };
  };

  const adminExtendAllRedeemCodes = (
    extraMinutes: number
  ): { success: boolean; message: string } => {
    const addMs = Math.max(10, extraMinutes) * 60 * 1000;
    setRedeemCodes((prev) =>
      prev.map((r) => ({
        ...r,
        active: true,
        expiresAt: new Date(Math.max(Date.now(), new Date(r.expiresAt).getTime()) + addMs).toISOString(),
        durationMinutes: r.durationMinutes + extraMinutes,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Masa aktif seluruh ${redeemCodes.length} Kode Redeem berhasil diperpanjang +${extraMinutes} menit dan diaktifkan kembali!`,
    };
  };

  const adminBoostAllRedeemQuotas = (
    extraClaims: number
  ): { success: boolean; message: string } => {
    const addQ = Math.max(1, extraClaims);
    setRedeemCodes((prev) =>
      prev.map((r) => ({
        ...r,
        active: true,
        maxClaims: r.maxClaims + addQ,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Kuota klaim seluruh ${redeemCodes.length} Kode Redeem berhasil ditambah +${addQ} orang pengklaim!`,
    };
  };

  const adminSendThrSultanPackage = (
    accountId: string,
    cashAmount: number,
    vouchers: number,
    points: number
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const isUnlim = target.cardTier === 'admin' || isUnlimitedNumber(target.balance);
    const nextBal = isUnlim ? UNLIMITED_BALANCE : target.balance + Math.max(0, cashAmount);

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              balance: nextBal,
              levelVouchers: (a.levelVouchers || 0) + Math.max(0, vouchers),
              rewardPoints: (a.rewardPoints || 0) + Math.max(0, points),
              pulsaBalance: (a.pulsaBalance || 0) + 250_000,
              plnKwhBalance: (a.plnKwhBalance || 0) + 100,
            }
          : a
      )
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `🎁 Paket THR Sultan (${formatRupiah(
        cashAmount
      )} Tunai + ${vouchers} Voucher Level + ${points.toLocaleString(
        'id-ID'
      )} Poin + Pulsa Rp 250rb + 100 kWh PLN) berhasil dikirim ke ${target.fullName}!`,
    };
  };

  const adminRunForensicAutoHeal = (): { success: boolean; message: string } => {
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        balance: a.balance < 0 ? 0 : a.balance,
        jobLevel: Math.max(1, a.jobLevel || 1),
        levelVouchers: Math.max(0, a.levelVouchers || 0),
        dailyWithdrawnToday: 0,
      }))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `🛡️ Audit Forensik & Auto-Heal selesai! Seluruh ${accounts.length} rekening telah dinormalisasi, kuota tarik harian di-reset, dan integritas database 100% sehat.`,
    };
  };

  const adminExportMasterBankJson = (): {
    success: boolean;
    message: string;
    json?: string;
  } => {
    const payload = {
      exportedAt: new Date().toISOString(),
      bank: 'PT Bank Nusantara (Persero) Tbk',
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
      featuresCount: featureConfigs.length,
      updatesCount: appUpdates.length,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    try {
      navigator.clipboard.writeText(jsonStr);
    } catch {
      // ignore
    }
    playAtmSound('success');
    return {
      success: true,
      json: jsonStr,
      message: `Snapshot JSON Master Bank (${accounts.length} rekening, ${transactions.length} transaksi, ${featureConfigs.length} fitur) berhasil disalin ke clipboard!`,
    };
  };

  // ============================================================================
  // SPIN THE WHEEL & 100 PILIHAN PEMBELIAN KOIN SPIN + PANEL ADMIN KONTROL
  // ============================================================================
  const buySpinCoins = (packageId: number) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login ke kartu rekening terlebih dahulu.' };
    }
    if (currentAccount.cardStatus !== 'active') {
      return {
        success: false,
        message: 'Kartu Anda sedang tidak aktif / diblokir sehingga tidak dapat membeli koin spin.',
      };
    }

    const pkg = COIN_PURCHASE_PACKAGES_100.find((p) => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Paket koin tidak ditemukan.' };
    }

    const { finalPrice, discountPercent } = calculateCoinPackagePrice(pkg, spinWheelConfig);
    const isAdminCard =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isAdminCard && currentAccount.balance < finalPrice) {
      playAtmSound('error');
      return {
        success: false,
        message: `Saldo rekening tidak mencukupi untuk membeli Paket #${pkg.id} (${pkg.coins.toLocaleString(
          'id-ID'
        )} Koin seharga ${formatRupiahWithDecimals(finalPrice)}). Saldo Anda: ${formatRupiahWithDecimals(
          currentAccount.balance
        )}.`,
      };
    }

    const currentCoins = currentAccount.spinCoins || 0;
    const newCoinBalance = currentCoins + pkg.coins;
    const newAccountBalance = isAdminCard
      ? UNLIMITED_BALANCE
      : Number((currentAccount.balance - finalPrice).toFixed(2));

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: newAccountBalance,
              spinCoins: newCoinBalance,
            }
          : a
      )
    );

    const newTx: Transaction = {
      id: `tx-buycoin-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'belanja_fitur',
      title: `Beli Koin Spin Wheel: +${pkg.coins.toLocaleString('id-ID')} Koin (Paket #${pkg.id})`,
      amount: finalPrice,
      description: `Pembelian ${pkg.coins.toLocaleString('id-ID')} Koin Spin the Wheel seharga ${formatRupiahWithDecimals(
        finalPrice
      )}${discountPercent > 0 ? ` (Diskon Admin ${discountPercent}%)` : ''}. Total Koin: ${newCoinBalance.toLocaleString(
        'id-ID'
      )} Koin.`,
      status: 'success',
      referenceNo: `COIN-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      category: 'ewallet',
    };
    setTransactions((prev) => [newTx, ...prev]);

    playAtmSound('success');
    addNotification(
      `🪙 Pembelian +${pkg.coins.toLocaleString('id-ID')} Koin Berhasil`,
      `Anda membeli ${pkg.coins.toLocaleString('id-ID')} Koin Spin seharga ${formatRupiahWithDecimals(
        finalPrice
      )}. Saldo Koin Anda kini: ${newCoinBalance.toLocaleString('id-ID')} Koin.`,
      'success'
    );

    return {
      success: true,
      message: `Berhasil membeli +${pkg.coins.toLocaleString('id-ID')} Koin Spin seharga ${formatRupiahWithDecimals(
        finalPrice
      )}! Total Koin Anda sekarang: ${newCoinBalance.toLocaleString('id-ID')} Koin.`,
      coinsAdded: pkg.coins,
      paidAmount: finalPrice,
      newCoinBalance,
    };
  };

  const pickSingleSpinPrize = (): { segment: SpinPrizeSegment; index: number } => {
    const luck = Math.max(1, spinWheelConfig.luckMultiplier || 1);
    const forceMode = spinWheelConfig.forceJackpotMode || 'none';

    let eligibleIndices = SPIN_WHEEL_PRIZES.map((_, idx) => idx);
    if (forceMode === 'min_1m') {
      eligibleIndices = SPIN_WHEEL_PRIZES.map((p, idx) => (p.amount >= 1_000_000 ? idx : -1)).filter(
        (idx) => idx >= 0
      );
    } else if (forceMode === 'min_5m') {
      eligibleIndices = SPIN_WHEEL_PRIZES.map((p, idx) => (p.amount >= 5_000_000 ? idx : -1)).filter(
        (idx) => idx >= 0
      );
    } else if (forceMode === 'only_15m_20m') {
      eligibleIndices = SPIN_WHEEL_PRIZES.map((p, idx) =>
        p.amount >= 15_000_000 ? idx : -1
      ).filter((idx) => idx >= 0);
    }

    const weights = eligibleIndices.map((idx) => {
      const prize = SPIN_WHEEL_PRIZES[idx];
      const customW = spinWheelConfig.customSegmentWeights?.[prize.id];
      let baseW =
        customW !== undefined && customW >= 0 ? customW : prize.baseProbabilityPercent;

      // Apply Admin Luck Multiplier to prizes >= Rp 1.000.000
      if (prize.amount >= 15_000_000) {
        if (luck > 1) {
          // Boost ultra-rare 15M & 20M when Admin activates high luck multiplier
          baseW = baseW * Math.pow(luck, 3);
        }
      } else if (prize.amount >= 1_000_000) {
        baseW = baseW * luck;
      }
      return Math.max(0, baseW);
    });

    const totalWeight = weights.reduce((acc, w) => acc + w, 0);
    if (totalWeight <= 0) {
      const fallbackIdx = eligibleIndices[0] ?? 0;
      return { segment: SPIN_WHEEL_PRIZES[fallbackIdx], index: fallbackIdx };
    }

    let rand = Math.random() * totalWeight;
    for (let i = 0; i < eligibleIndices.length; i++) {
      rand -= weights[i];
      if (rand <= 0) {
        const chosenIdx = eligibleIndices[i];
        return { segment: SPIN_WHEEL_PRIZES[chosenIdx], index: chosenIdx };
      }
    }

    const lastIdx = eligibleIndices[eligibleIndices.length - 1] ?? 0;
    return { segment: SPIN_WHEEL_PRIZES[lastIdx], index: lastIdx };
  };

  const spinTheWheel = (spinCount: 1 | 3 | 5 | 7 | 10) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login ke kartu rekening terlebih dahulu.' };
    }
    if (currentAccount.cardStatus !== 'active') {
      return {
        success: false,
        message: 'Kartu Anda sedang tidak aktif / diblokir sehingga tidak dapat memutar Spin the Wheel.',
      };
    }

    const { finalCoins } = calculateSpinCost(spinCount, spinWheelConfig);
    const currentCoins = currentAccount.spinCoins || 0;

    if (currentCoins < finalCoins) {
      playAtmSound('error');
      return {
        success: false,
        message: `Koin Spin Anda belum mencukupi untuk ${spinCount}x Spin! Dibutuhkan ${finalCoins.toLocaleString(
          'id-ID'
        )} Koin (Koin Anda saat ini: ${currentCoins.toLocaleString(
          'id-ID'
        )} Koin). Silakan klik tombol [+] di sebelah gambar koin di atas untuk membeli koin!`,
      };
    }

    const results: { segment: SpinPrizeSegment; index: number }[] = [];
    let totalWonAmount = 0;

    for (let i = 0; i < spinCount; i++) {
      const picked = pickSingleSpinPrize();
      results.push(picked);
      totalWonAmount += picked.segment.amount;
    }

    const newCoinBalance = Math.max(0, currentCoins - finalCoins);
    const isAdminCard =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);
    const newAccountBalance = isAdminCard
      ? UNLIMITED_BALANCE
      : currentAccount.balance + totalWonAmount;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: newAccountBalance,
              spinCoins: newCoinBalance,
              totalSpinsPlayed: (a.totalSpinsPlayed || 0) + spinCount,
              totalSpinWinnings: (a.totalSpinWinnings || 0) + totalWonAmount,
            }
          : a
      )
    );

    const historyItem: SpinHistoryRecord = {
      id: `spinhist-${Date.now()}`,
      accountId: currentAccount.id,
      accountName: currentAccount.fullName,
      spinCount,
      coinsSpent: finalCoins,
      prizesWon: results.map((r) => ({ amount: r.segment.amount, label: r.segment.label })),
      totalWonAmount,
      timestamp: new Date().toISOString(),
    };
    setSpinHistory((prev) => [historyItem, ...prev.slice(0, 49)]);

    const newTx: Transaction = {
      id: `tx-spinwin-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'setor',
      title: `Hadiah Spin the Wheel (${spinCount}x Spin): +${formatRupiah(totalWonAmount)}`,
      amount: totalWonAmount,
      description: `Memutar Spin the Wheel ${spinCount}x menggunakan ${finalCoins.toLocaleString(
        'id-ID'
      )} Koin. Rincian hadiah: ${results.map((r) => r.segment.label).join(', ')}.`,
      status: 'success',
      referenceNo: `SPIN-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      category: 'redeem',
    };
    setTransactions((prev) => [newTx, ...prev]);

    playAtmSound('cash');
    try {
      confetti({
        particleCount: totalWonAmount >= 1_000_000 ? 110 : 55,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `Selamat! Dari ${spinCount}x Spin (${finalCoins.toLocaleString(
        'id-ID'
      )} Koin), Anda memenangkan total hadiah ${formatRupiah(
        totalWonAmount
      )} yang langsung masuk ke saldo rekening Anda!`,
      coinsSpent: finalCoins,
      results,
      totalWonAmount,
      newCoinBalance,
      newAccountBalance,
    };
  };

  const adminUpdateSpinWheelConfig = (partial: Partial<SpinWheelAdminConfig>) => {
    setSpinWheelConfig((prev) => ({
      ...prev,
      ...partial,
      bundleExtraDiscountPercent: partial.bundleExtraDiscountPercent
        ? { ...prev.bundleExtraDiscountPercent, ...partial.bundleExtraDiscountPercent }
        : prev.bundleExtraDiscountPercent,
      customSegmentWeights: partial.customSegmentWeights
        ? { ...(prev.customSegmentWeights || {}), ...partial.customSegmentWeights }
        : prev.customSegmentWeights,
    }));
    playAtmSound('success');
    return {
      success: true,
      message:
        'Pengaturan Diskon Spin the Wheel, Harga Koin, & Probabilitas Kemungkinan Pendapatan berhasil diperbarui di Panel Admin!',
    };
  };

  const adminResetSpinWheelConfig = () => {
    setSpinWheelConfig(INITIAL_SPIN_WHEEL_CONFIG);
    playAtmSound('beep');
    return {
      success: true,
      message: 'Pengaturan Spin the Wheel & Harga Koin dikembalikan ke pengaturan standar awal.',
    };
  };

  const adminAdjustAccountSpinCoins = (
    accountId: string,
    coins: number,
    mode: 'add' | 'set'
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan.' };
    const cleanCoins = Math.max(0, Math.floor(coins));
    const nextCoins =
      mode === 'add' ? (target.spinCoins || 0) + cleanCoins : cleanCoins;

    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, spinCoins: nextCoins } : a))
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Koin Spin untuk ${target.fullName} berhasil diatur menjadi ${nextCoins.toLocaleString(
        'id-ID'
      )} Koin!`,
    };
  };

  const adminMassSpinCoinRain = (coins: number) => {
    const cleanCoins = Math.max(1, Math.floor(coins));
    setAccounts((prev) =>
      prev.map((a) => ({
        ...a,
        spinCoins: (a.spinCoins || 0) + cleanCoins,
      }))
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Hujan Koin Spin Berhasil! Seluruh ${accounts.length} nasabah menerima +${cleanCoins.toLocaleString(
        'id-ID'
      )} Koin Spin gratis!`,
    };
  };

  // ================= PUSAT MINING KRIPTO, BALAI LELANG SUPERCAR & CYBER VAULT (PENGGANTI KERAJAAN - BEBAS LEVEL!) =================
  const buySultanBusiness = (businessId: string, quantity = 1) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    const biz = SULTAN_BUSINESS_CATALOG.find((b) => b.id === businessId);
    if (!biz) {
      return { success: false, message: 'Unit Rig Mining / Koleksi Supercar tidak ditemukan.' };
    }
    const cleanQty = Math.max(1, Math.floor(quantity));
    const currentOwned = currentAccount.empireBusinesses?.[businessId] || 0;
    const discountMult = Math.max(
      0,
      1 - Math.min(99, Math.max(0, sultanEmpireConfig.businessDiscountPercent || 0)) / 100
    );
    const unitBase = biz.basePrice || biz.baseCost || 2_500_000;
    let totalCost = 0;
    for (let i = 0; i < cleanQty; i++) {
      const lvl = currentOwned + i;
      totalCost += Math.round(unitBase * Math.pow(1.12, lvl) * discountMult);
    }

    const isInf = isUnlimitedNumber(currentAccount.balance);
    if (!isInf && currentAccount.balance < totalCost) {
      playAtmSound('error');
      return {
        success: false,
        message: `Saldo tidak mencukupi untuk membeli ${cleanQty}x ${biz.name}. Dibutuhkan ${formatRupiah(
          totalCost
        )}.`,
      };
    }

    const nextLevel = currentOwned + cleanQty;
    const nextBalance = isInf ? currentAccount.balance : currentAccount.balance - totalCost;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: nextBalance,
              empireBusinesses: {
                ...(a.empireBusinesses || {}),
                [businessId]: nextLevel,
              },
            }
          : a
      )
    );

    const newTx: Transaction = {
      id: `tx-mining-buy-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'transfer_out',
      title: `Akuisisi Mining & Lelang VIP: ${cleanQty}x ${biz.name} (Unit Lv.${nextLevel})`,
      amount: totalCost,
      timestamp: new Date().toISOString(),
      description: `Pembelian ${cleanQty}x ${biz.name} (Total Kepemilikan: ${nextLevel} Unit)`,
      recipientName: 'Pusat Mining & Balai Lelang VIP',
      status: 'success',
      referenceNo: `MIN-${Date.now().toString().slice(-6)}`,
      category: 'lainnya',
    };
    setTransactions((prev) => [newTx, ...prev]);
    playAtmSound('cash');

    return {
      success: true,
      message: `Berhasil membeli ${cleanQty}x ${biz.name} (Kini ${nextLevel} Unit) seharga ${formatRupiah(
        totalCost
      )}!`,
      newLevel: nextLevel,
    };
  };

  const sellSultanBusinessAuction = (businessId: string, quantity = 1) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    const biz = SULTAN_BUSINESS_CATALOG.find((b) => b.id === businessId);
    if (!biz) {
      return { success: false, message: 'Unit Rig Mining / Supercar tidak ditemukan.' };
    }
    const currentOwned = currentAccount.empireBusinesses?.[businessId] || 0;
    const cleanQty = Math.max(1, Math.min(currentOwned, Math.floor(quantity)));
    if (currentOwned <= 0 || cleanQty <= 0) {
      playAtmSound('error');
      return {
        success: false,
        message: `Anda belum memiliki unit ${biz.name} untuk dilelang.`,
      };
    }

    const unitBase = biz.basePrice || biz.baseCost || 2_500_000;
    const resaleBonusMult = 1 + (biz.resaleProfitPercent || 50) / 100;
    const adminProfitMult = Math.max(1, sultanEmpireConfig.profitMultiplier || 1);
    const auctionProceeds = Math.round(unitBase * cleanQty * resaleBonusMult * adminProfitMult);

    const remainingLevel = Math.max(0, currentOwned - cleanQty);
    const isInf = isUnlimitedNumber(currentAccount.balance);
    const nextBalance = isInf ? currentAccount.balance : currentAccount.balance + auctionProceeds;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: nextBalance,
              totalEmpireEarnings: (a.totalEmpireEarnings || 0) + auctionProceeds,
              empireBusinesses: {
                ...(a.empireBusinesses || {}),
                [businessId]: remainingLevel,
              },
            }
          : a
      )
    );

    const newTx: Transaction = {
      id: `tx-auction-sell-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'setor',
      title: `Terjual di Balai Lelang VIP: ${cleanQty}x ${biz.name} (+Profit ${biz.resaleProfitPercent || 50}%)`,
      amount: auctionProceeds,
      timestamp: new Date().toISOString(),
      description: `Hasil Lelang ${cleanQty}x ${biz.name} dengan keuntungan lelang +${biz.resaleProfitPercent || 50}%`,
      senderName: 'Balai Lelang Supercar & Aset VIP',
      status: 'success',
      referenceNo: `AUC-${Date.now().toString().slice(-6)}`,
      category: 'redeem',
    };
    setTransactions((prev) => [newTx, ...prev]);
    playAtmSound('cash');
    try {
      confetti({ particleCount: 75, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `🔨 SOLD AT AUCTION! ${cleanQty}x ${biz.name} laku terjual di Balai Lelang VIP seharga ${formatRupiah(
        auctionProceeds
      )} (Termasuk Profit Lelang +${biz.resaleProfitPercent || 50}%)!`,
      cashReceived: auctionProceeds,
      remainingLevel,
    };
  };

  const claimAllSultanBusinessProfits = () => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    const ownedMap = currentAccount.empireBusinesses || {};
    let baseCash = 0;
    let baseCoins = 0;
    let totalUnits = 0;

    SULTAN_BUSINESS_CATALOG.forEach((biz) => {
      const count = ownedMap[biz.id] || 0;
      if (count > 0) {
        totalUnits += count;
        baseCash += (biz.profitPerCycle || biz.profitPerClaim || 0) * count;
        baseCoins += (biz.bonusSpinCoinsPerCycle || biz.bonusSpinCoinsPerClaim || 0) * count;
      }
    });

    if (totalUnits === 0) {
      playAtmSound('error');
      return {
        success: false,
        message: 'Anda belum memiliki Rig Mining atau Aset Lelang. Beli minimal 1 unit terlebih dahulu!',
      };
    }

    const profitMult = Math.max(1, sultanEmpireConfig.profitMultiplier || 1);
    const coinMult = Math.max(1, sultanEmpireConfig.bonusCoinMultiplier || 1);

    const finalCash = Math.round(baseCash * profitMult);
    const finalCoins = Math.round(baseCoins * coinMult);

    const isInf = isUnlimitedNumber(currentAccount.balance);
    const nextBalance = isInf ? currentAccount.balance : currentAccount.balance + finalCash;
    const nextCoins = (currentAccount.spinCoins || 0) + finalCoins;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: nextBalance,
              spinCoins: nextCoins,
              totalEmpireEarnings: (a.totalEmpireEarnings || 0) + finalCash,
            }
          : a
      )
    );

    const newTx: Transaction = {
      id: `tx-mining-claim-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'setor',
      title: `Panen Hasil Mining Kripto & Sewa Supercar (${totalUnits} Unit) + ${finalCoins.toLocaleString('id-ID')} Koin Spin`,
      amount: finalCash,
      timestamp: new Date().toISOString(),
      description: `Klaim Hasil Mining Kripto & Sewa Supercar (${totalUnits} Unit) + Bonus ${finalCoins.toLocaleString(
        'id-ID'
      )} Koin Spin`,
      senderName: 'Pusat Mining & Balai Lelang VIP',
      status: 'success',
      referenceNo: `MNG-${Date.now().toString().slice(-6)}`,
      category: 'redeem',
    };
    setTransactions((prev) => [newTx, ...prev]);
    playAtmSound('cash');
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `⚡ Klaim Mining & Sewa Supercar Berhasil! Saldo bertambah +${formatRupiah(
        finalCash
      )} & +${finalCoins.toLocaleString('id-ID')} Koin Spin gratis!`,
      cashClaimed: finalCash,
      coinsClaimed: finalCoins,
    };
  };

  const tradeSultanAsset = (assetId: string, action: 'buy' | 'sell', units: number) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    const asset = SULTAN_TRADING_ASSETS.find((a) => a.id === assetId);
    if (!asset) {
      return { success: false, message: 'Instrumen bursa tidak ditemukan.' };
    }
    const cleanUnits = Math.max(1, Math.floor(units));
    const mult = sultanEmpireConfig.marketPriceMultiplier?.[assetId] || 1;
    const baseP = sultanEmpireConfig.marketPrices?.[assetId] || asset.defaultPrice || asset.basePrice;
    const currentPrice = Math.round(baseP * mult);
    const totalValue = Math.round(currentPrice * cleanUnits);
    const currentHolding = currentAccount.empireTradingHoldings?.[assetId] || 0;
    const isInf = isUnlimitedNumber(currentAccount.balance);

    if (action === 'buy') {
      if (!isInf && currentAccount.balance < totalValue) {
        playAtmSound('error');
        return {
          success: false,
          message: `Saldo tidak cukup untuk membeli ${cleanUnits} ${asset.unitLabel} ${asset.name} (${formatRupiah(
            totalValue
          )}).`,
        };
      }
      const nextBalance = isInf ? currentAccount.balance : currentAccount.balance - totalValue;
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === currentAccount.id
            ? {
                ...a,
                balance: nextBalance,
                empireTradingHoldings: {
                  ...(a.empireTradingHoldings || {}),
                  [assetId]: currentHolding + cleanUnits,
                },
              }
            : a
        )
      );
      playAtmSound('cash');
      return {
        success: true,
        message: `BUY ORDER FILLED: Berhasil membeli ${cleanUnits} ${asset.unitLabel} ${asset.name} senilai ${formatRupiah(
          totalValue
        )}!`,
      };
    } else {
      if (currentHolding < cleanUnits) {
        playAtmSound('error');
        return {
          success: false,
          message: `Portofolio ${asset.name} kamu hanya ${currentHolding} ${asset.unitLabel}.`,
        };
      }
      const nextBalance = isInf ? currentAccount.balance : currentAccount.balance + totalValue;
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === currentAccount.id
            ? {
                ...a,
                balance: nextBalance,
                totalEmpireEarnings: (a.totalEmpireEarnings || 0) + totalValue,
                empireTradingHoldings: {
                  ...(a.empireTradingHoldings || {}),
                  [assetId]: currentHolding - cleanUnits,
                },
              }
            : a
        )
      );
      playAtmSound('cash');
      return {
        success: true,
        message: `SELL ORDER FILLED: Berhasil menjual ${cleanUnits} ${asset.unitLabel} ${asset.name} dan menerima ${formatRupiah(
          totalValue
        )}!`,
      };
    }
  };

  const openSultanMysteryVault = (vaultId: string) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    const vault = SULTAN_MYSTERY_VAULTS.find((v) => v.id === vaultId);
    if (!vault) {
      return { success: false, message: 'Cyber Container tidak ditemukan.' };
    }
    const discountMult = Math.max(
      0,
      1 - Math.min(99, Math.max(0, sultanEmpireConfig.businessDiscountPercent || 0)) / 100
    );
    const rawVaultPrice = vault.price || vault.cost || 1_500_000;
    const finalPrice = Math.round(rawVaultPrice * discountMult);
    const isInf = isUnlimitedNumber(currentAccount.balance);

    if (!isInf && currentAccount.balance < finalPrice) {
      playAtmSound('error');
      return {
        success: false,
        message: `Saldo kurang untuk membuka ${vault.name}. Dibutuhkan ${formatRupiah(finalPrice)}.`,
      };
    }

    const profitMult = Math.max(1, sultanEmpireConfig.profitMultiplier || 1);
    const coinMult = Math.max(1, sultanEmpireConfig.bonusCoinMultiplier || 1);
    const isGuaranteedJackpot = Boolean(sultanEmpireConfig.vaultGuaranteedJackpot);

    const randCash = Math.round(
      (isGuaranteedJackpot
        ? vault.maxCashReward
        : vault.minCashReward + Math.random() * (vault.maxCashReward - vault.minCashReward)) *
        profitMult
    );
    const randCoins = Math.round(
      (isGuaranteedJackpot
        ? vault.maxSpinCoins
        : vault.minSpinCoins + Math.random() * (vault.maxSpinCoins - vault.minSpinCoins)) * coinMult
    );
    const randVouchers = isGuaranteedJackpot
      ? vault.maxLevelVouchers
      : vault.minLevelVouchers +
        Math.floor(Math.random() * (vault.maxLevelVouchers - vault.minLevelVouchers + 1));

    const nextBalance = isInf
      ? currentAccount.balance
      : currentAccount.balance - finalPrice + randCash;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: nextBalance,
              spinCoins: (a.spinCoins || 0) + randCoins,
              levelVouchers: (a.levelVouchers || 0) + randVouchers,
              totalEmpireEarnings: (a.totalEmpireEarnings || 0) + randCash,
            }
          : a
      )
    );

    playAtmSound('cash');
    try {
      confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
    } catch {
      // ignore
    }

    return {
      success: true,
      message: `🎉 ${vault.name} Terbuka! Kamu mendapatkan Uang Tunai ${formatRupiah(
        randCash
      )}, +${randCoins.toLocaleString('id-ID')} Koin Spin, dan +${randVouchers} Voucher Level!`,
      cashWon: randCash,
      coinsWon: randCoins,
      vouchersWon: randVouchers,
    };
  };

  const adminUpdateSultanEmpireConfig = (partial: Partial<SultanEmpireAdminConfig>) => {
    setSultanEmpireConfig((prev) => ({
      ...prev,
      ...partial,
      marketPriceMultiplier: {
        ...(prev.marketPriceMultiplier || {}),
        ...(partial.marketPriceMultiplier || {}),
      },
      marketPrices: {
        ...(prev.marketPrices || {}),
        ...(partial.marketPrices || {}),
      },
      updatedAt: new Date().toISOString(),
    }));
    playAtmSound('success');
    return {
      success: true,
      message: 'Konfigurasi Pusat Mining Kripto, Lelang Supercar & Cyber Vault berhasil diperbarui!',
    };
  };

  const adminResetSultanEmpireConfig = () => {
    setSultanEmpireConfig(INITIAL_SULTAN_EMPIRE_CONFIG);
    playAtmSound('beep');
    return {
      success: true,
      message: 'Konfigurasi Pusat Mining Kripto, Lelang Supercar & Cyber Vault dikembalikan ke awal.',
    };
  };

  const adminGiftAllSultanBusinessesToAccount = (accountId: string, levelsPerBusiness: number) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Nasabah tidak ditemukan.' };
    }
    const cleanLv = Math.max(1, Math.floor(levelsPerBusiness));
    const nextBizMap: Record<string, number> = { ...(target.empireBusinesses || {}) };
    SULTAN_BUSINESS_CATALOG.forEach((b) => {
      nextBizMap[b.id] = (nextBizMap[b.id] || 0) + cleanLv;
    });

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              empireBusinesses: nextBizMap,
            }
          : a
      )
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Seluruh 12 Unit Rig Mining Kripto & Koleksi Supercar Lelang (+${cleanLv} Unit per item) berhasil dihadiahkan ke ${target.fullName}!`,
    };
  };

  // ================= FITUR DIHAPUS (HAPUS & PULIHKAN FITUR) + PENGATURAN SUPER LENGKAP =================
  const deleteFeatureById = (featureId: string) => {
    const found = rawFeatureConfigs.find((f) => f.id === featureId);
    if (!found) {
      return { success: false, message: 'Fitur tidak ditemukan di katalog.' };
    }
    if (deletedFeatureIds.includes(featureId)) {
      return { success: false, message: `Fitur "${found.title}" sudah berada di daftar Fitur Dihapus.` };
    }
    setDeletedFeatureIds((prev) => [...prev, featureId]);
    playAtmSound('beep');
    return {
      success: true,
      message: `🗑️ Fitur "${found.title}" (${found.category}) berhasil dihapus dari menu aktif dan dipindahkan ke Keranjang Fitur Dihapus!`,
    };
  };

  const deleteMultipleFeatures = (featureIds: string[]) => {
    const validIds = featureIds.filter(
      (id) => rawFeatureConfigs.some((f) => f.id === id) && !deletedFeatureIds.includes(id)
    );
    if (validIds.length === 0) {
      return { success: false, message: 'Tidak ada fitur baru yang dipilih untuk dihapus.', count: 0 };
    }
    setDeletedFeatureIds((prev) => Array.from(new Set([...prev, ...validIds])));
    playAtmSound('beep');
    return {
      success: true,
      message: `🗑️ ${validIds.length} Fitur berhasil dihapus sekaligus dan dipindahkan ke daftar Fitur Dihapus!`,
      count: validIds.length,
    };
  };

  const restoreDeletedFeature = (featureId: string) => {
    const found = rawFeatureConfigs.find((f) => f.id === featureId);
    setDeletedFeatureIds((prev) => prev.filter((id) => id !== featureId));
    playAtmSound('success');
    return {
      success: true,
      message: `♻️ Fitur "${found?.title || featureId}" berhasil dipulihkan dan aktif kembali di katalog layanan!`,
    };
  };

  const restoreAllDeletedFeatures = () => {
    const count = deletedFeatureIds.length;
    setDeletedFeatureIds([]);
    playAtmSound('success');
    return {
      success: true,
      message: `♻️ Seluruh ${count} Fitur yang Dihapus berhasil dipulihkan kembali 100%!`,
      count,
    };
  };

  const updateUserSettings = (partial: Partial<UserAppSettings>) => {
    setUserSettings((prev) => ({
      ...prev,
      ...partial,
    }));
    playAtmSound('beep');
    return {
      success: true,
      message: 'Pengaturan aplikasi berhasil disimpan dan diterapkan!',
    };
  };

  const resetUserSettings = () => {
    setUserSettings(DEFAULT_USER_APP_SETTINGS);
    playAtmSound('beep');
    return {
      success: true,
      message: 'Seluruh 60+ opsi Pengaturan berhasil dikembalikan ke setelan pabrik standar.',
    };
  };

  const updateCustomerProfileIdentity = (input: {
    fullName?: string;
    email?: string;
    phone?: string;
    address?: string;
    nik?: string;
  }) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih rekening aktif terlebih dahulu.' };
    }
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              fullName: input.fullName?.trim() ? input.fullName.trim() : a.fullName,
              email: input.email?.trim() ? input.email.trim() : a.email,
              phone: input.phone?.trim() ? input.phone.trim() : a.phone,
              address: input.address?.trim() ? input.address.trim() : a.address,
              nik: input.nik?.trim() ? input.nik.trim() : a.nik,
            }
          : a
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: 'Profil & Identitas Nasabah berhasil diperbarui!',
    };
  };

  // ================= MINTA TOLONG KE ADMIN (MINTOL ADMIN) - PESAN WAJIB & 35 FITUR =================
  const submitMintolRequest = (input: {
    selectedFeatures: string[];
    requestedAmount?: number;
    requestedCoins?: number;
    requestedLevel?: number;
    urgency: 'normal' | 'penting' | 'darurat_sultan';
    message: string;
    attachmentDataUrl?: string;
    attachmentName?: string;
  }) => {
    const cleanMsg = (input.message || '').trim();
    if (!cleanMsg) {
      playAtmSound('error');
      return {
        success: false,
        message: 'Pesan penjelasan minta tolong ke Admin WAJIB diisi dan tidak boleh kosong!',
      };
    }

    const selectedIds =
      input.selectedFeatures && input.selectedFeatures.length > 0
        ? input.selectedFeatures
        : ['mintol_custom_request'];

    const featureLabels = selectedIds.map((fid) => {
      const found = MINTOL_ADMIN_FEATURES_CATALOG.find((f) => f.id === fid);
      return found ? `${found.icon} ${found.label}` : fid;
    });

    const newRecord: AdminHelpRequestRecord = {
      id: `mintol-${Date.now()}`,
      accountId: currentAccount?.id || 'guest',
      senderName: currentAccount?.fullName || googleUser?.name || 'Nasabah Bank Nusantara',
      senderAccountNumber: currentAccount?.accountNumber || '-',
      selectedFeatures: selectedIds,
      featureLabels,
      requestedAmount: input.requestedAmount,
      requestedCoins: input.requestedCoins,
      requestedLevel: input.requestedLevel,
      urgency: input.urgency || 'penting',
      message: cleanMsg,
      attachmentDataUrl: input.attachmentDataUrl,
      attachmentName: input.attachmentName,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setAdminHelpRequests((prev) => [newRecord, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message:
        'Permintaan Minta Tolong berhasil dikirim ke Panel Admin! Admin dapat mengabulkan & mengeksekusi otomatis permintaanmu.',
      record: newRecord,
    };
  };

  const adminGrantAndExecuteMintolRequest = (requestId: string, adminReplyNote?: string) => {
    const req = adminHelpRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Data permintaan Mintol tidak ditemukan.' };
    }
    const targetAcc = accounts.find((a) => a.id === req.accountId) || currentAccount;
    const executedLogs: string[] = [];

    if (targetAcc) {
      const targetId = targetAcc.id;
      const reqAmount = req.requestedAmount && req.requestedAmount > 0 ? req.requestedAmount : 25_000_000;
      const reqCoins = req.requestedCoins && req.requestedCoins > 0 ? req.requestedCoins : 5_000;
      const reqLevel = req.requestedLevel && req.requestedLevel > 0 ? req.requestedLevel : 50;

      req.selectedFeatures.forEach((fid) => {
        switch (fid) {
          case 'mintol_suntik_saldo':
            adminAdjustAccountBalance({
              accountId: targetId,
              mode: 'add',
              amount: reqAmount,
              note: 'Dikabulkan lewat Mintol Admin',
            });
            executedLogs.push(`+Saldo ${formatRupiah(reqAmount)}`);
            break;
          case 'mintol_gandakan_saldo':
            adminMultiplyAccountBalance(targetId, 10);
            executedLogs.push('Saldo dikali 10x lipat');
            break;
          case 'mintol_paket_thr_sultan':
            adminSendThrSultanPackage(targetId, 50_000_000, 10, 50_000);
            executedLogs.push('Paket THR Sultan (Rp 50 Juta + 10 Voucher + 50rb Poin)');
            break;
          case 'mintol_koin_spin_gratis':
            adminAdjustAccountSpinCoins(targetId, reqCoins, 'add');
            executedLogs.push(`+${reqCoins.toLocaleString('id-ID')} Koin Spin`);
            break;
          case 'mintol_diskon_spin_wheel':
            adminUpdateSpinWheelConfig({ spinDiscountPercent: 80 });
            executedLogs.push('Diskon Biaya Spin 80%');
            break;
          case 'mintol_diskon_beli_koin':
            adminUpdateSpinWheelConfig({ coinPackageDiscountPercent: 80 });
            executedLogs.push('Diskon Pembelian 100 Paket Koin 80%');
            break;
          case 'mintol_murahin_harga_koin':
            adminUpdateSpinWheelConfig({ basePricePerCoin: 1000 });
            executedLogs.push('Harga dasar 1 Koin diturunkan jadi Rp 1.000');
            break;
          case 'mintol_boost_probabilitas_spin':
            adminUpdateSpinWheelConfig({ highPrizeProbabilityBoost: 500 });
            executedLogs.push('Boost Probabilitas Hadiah Besar Spin 500x');
            break;
          case 'mintol_force_jackpot_20m':
            adminUpdateSpinWheelConfig({ guaranteedMinPrizeId: 'spin-20m' });
            executedLogs.push('Mode Pasti Jackpot Rp 20 Juta Diaktifkan');
            break;
          case 'mintol_naik_level_kerja':
            adminSetAccountJobLevel(targetId, reqLevel);
            executedLogs.push(`Level Kerja di-set ke Level ${reqLevel}`);
            break;
          case 'mintol_voucher_level_kerja':
            adminAdjustLevelVouchers(targetId, 20, 'add');
            executedLogs.push('+20 Voucher Level Kerja');
            break;
          case 'mintol_gajian_instan_tanpa_klik':
            adminInstantCompleteJobSalary(targetId, 'job-2000k');
            executedLogs.push('Gajian Instan Rp 2.000.000 cair');
            break;
          case 'mintol_click_power_boost':
            adminSetClickPower(targetId, 50);
            executedLogs.push('Kekuatan Klik 50x per klik');
            break;
          case 'mintol_salary_multiplier':
            adminSetSalaryMultiplier(targetId, 5);
            executedLogs.push('Multiplier Gaji Kerja 5x Lipat');
            break;
          case 'mintol_unban_kartu':
            adminUnbanCard(targetId);
            executedLogs.push('Kartu ATM di-Unban & Aktif');
            break;
          case 'mintol_centang_biru':
            if (!targetAcc.isVerified) adminToggleVerifyAccount(targetId);
            executedLogs.push('Centang Biru Verified Aktif');
            break;
          case 'mintol_upgrade_kartu_admin':
            adminDirectChangeAccountTier(targetId, 'admin');
            executedLogs.push('Upgrade ke Kartu ADMIN Infinity Unlimited');
            break;
          case 'mintol_upgrade_kartu_platinum':
            adminDirectChangeAccountTier(targetId, 'platinum');
            executedLogs.push('Upgrade ke Kartu Platinum VIP');
            break;
          case 'mintol_lupa_pin_reset':
            adminDirectChangeAccountPin(targetId, '123456');
            executedLogs.push('PIN ATM direset menjadi 123456');
            break;
          case 'mintol_nomor_rekening_cantik':
            adminSetCustomAccountNumber(targetId, '8888999988');
            executedLogs.push('Nomor Rekening Cantik 8888999988');
            break;
          case 'mintol_vip_shield_anti_pajak':
            adminToggleVipShield(targetId, true);
            executedLogs.push('VIP Shield & Cashback 15% Aktif');
            break;
          case 'mintol_modalkan_bisnis_sultan':
            if ((targetAcc.jobLevel || 1) < 50) {
              adminSetAccountJobLevel(targetId, 50);
            }
            adminGiftAllSultanBusinessesToAccount(targetId, 5);
            executedLogs.push('Level 50 Terbuka + 5 Level Semua 12 Aset Kerajaan Bisnis Sultan');
            break;
          case 'mintol_boost_profit_bisnis':
            adminUpdateSultanEmpireConfig({
              profitMultiplier: 5,
              businessDiscountPercent: 50,
              bonusCoinMultiplier: 3,
            });
            executedLogs.push('Profit Kerajaan Bisnis 5x + Diskon 50%');
            break;
          case 'mintol_pump_bursa_sultan': {
            const pumped: Record<string, number> = {};
            SULTAN_TRADING_ASSETS.forEach((a) => {
              const cur = sultanEmpireConfig.marketPrices?.[a.id] || a.defaultPrice;
              pumped[a.id] = Math.round(cur * 2);
            });
            adminUpdateSultanEmpireConfig({ marketPrices: pumped });
            executedLogs.push('Harga Bursa Saham & Emas Sultan Pump +100%');
            break;
          }
          case 'mintol_acc_semua_transaksi':
            adminMasterApproveEverything();
            executedLogs.push('Semua transaksi/kartu/pinjaman di-ACC');
            break;
          case 'mintol_lunasi_semua_pinjaman':
            adminForgiveOrPayoffLoans(targetId);
            executedLogs.push('Semua pinjaman diputihkan LUNAS');
            break;
          case 'mintol_kode_redeem_spesial':
            createRedeemCode({
              code: `MINTOL-${targetAcc.accountNumber.slice(-4)}`,
              rewardAmount: reqAmount,
              maxQuota: 5,
              expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
              description: `Kode Redeem Khusus Mintol ${targetAcc.fullName}`,
            });
            executedLogs.push(`Kode Redeem MINTOL-${targetAcc.accountNumber.slice(-4)} dibuat`);
            break;
          case 'mintol_suntik_pulsa_pln':
            adminInjectPulsaAndPln(targetId, 1_000_000, 1_000_000);
            executedLogs.push('+Pulsa Rp 1 Juta & +Token PLN Rp 1 Juta');
            break;
          case 'mintol_lunasi_cod_resi':
            adminFreeClearAllCodResi(targetId);
            executedLogs.push('Semua paket COD lunas & terkirim');
            break;
          case 'mintol_bunga_deposito_celengan':
            adminBoostDepositosAndPockets(targetId, 25);
            executedLogs.push('Deposito & Celengan ditambah bonus +25%');
            break;
          case 'mintol_poin_reward_sultan':
            adminAdjustRewardPoints(targetId, 100_000, 'add');
            executedLogs.push('+100.000 Poin Reward VIP');
            break;
          case 'mintol_matikan_pin_admin_fitur':
            setAllFeaturesAdminPin(false);
            setAllFeaturesAdminApproval(false);
            executedLogs.push('Semua fitur bebas PIN Admin & bebas antrean');
            break;
          case 'mintol_pulihkan_fitur_dihapus':
            restoreAllDeletedFeatures();
            executedLogs.push('Semua fitur yang dihapus berhasil dipulihkan kembali');
            break;
          case 'mintol_custom_request':
          default:
            if (req.requestedAmount && req.requestedAmount > 0) {
              adminAdjustAccountBalance({
                accountId: targetId,
                mode: 'add',
                amount: req.requestedAmount,
                note: 'Bantuan Mintol Admin',
              });
              executedLogs.push(`+Bantuan Saldo ${formatRupiah(req.requestedAmount)}`);
            } else {
              executedLogs.push('Permintaan khusus disetujui Admin');
            }
            break;
        }
      });
    }

    const summaryReply =
      adminReplyNote?.trim() ||
      `Permintaan Mintol telah dikabulkan & dieksekusi oleh Admin: ${executedLogs.join(', ')}.`;

    setAdminHelpRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'granted',
              adminReply: summaryReply,
              grantedAt: new Date().toISOString(),
            }
          : r
      )
    );

    if (targetAcc) {
      addNotification({
        accountId: targetAcc.id,
        title: '✅ Permintaan Minta Tolong (Mintol) Dikabulkan Admin!',
        message: summaryReply,
        type: 'success',
      });
    }

    playAtmSound('cash');
    return {
      success: true,
      message: `Permintaan Mintol dari ${req.senderName} berhasil dikabulkan! (${executedLogs.join(
        ' • '
      )})`,
    };
  };

  const adminRejectMintolRequest = (requestId: string, adminReplyNote?: string) => {
    const req = adminHelpRequests.find((r) => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Data permintaan Mintol tidak ditemukan.' };
    }
    const reply = adminReplyNote?.trim() || 'Mohon maaf, permintaan Mintol belum dapat disetujui saat ini.';
    setAdminHelpRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected',
              adminReply: reply,
            }
          : r
      )
    );
    playAtmSound('beep');
    return {
      success: true,
      message: `Permintaan Mintol dari ${req.senderName} ditandai Ditolak.`,
    };
  };

  const adminDeleteMintolRequest = (requestId: string) => {
    setAdminHelpRequests((prev) => prev.filter((r) => r.id !== requestId));
    playAtmSound('beep');
  };

  const adminClearMintolRequests = () => {
    setAdminHelpRequests([]);
    playAtmSound('beep');
  };

  // ⚡ Admin Quick Login 1-Klik ke Akun Orang Tanpa PIN Kartu
  const adminQuickLoginToAccount = (accountId: string): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Akun nasabah tidak ditemukan.' };
    }
    setCurrentAccountId(target.id);
    if (!googleUser) {
      setGoogleUser({
        email: target.email || 'nasabah@gmail.com',
        name: target.fullName,
        loginTime: new Date().toISOString(),
        hasCompletedOnboarding: true,
      });
    } else if (!googleUser.hasCompletedOnboarding) {
      setGoogleUser({
        ...googleUser,
        hasCompletedOnboarding: true,
      });
    }
    playAtmSound('success');
    return {
      success: true,
      message: `⚡ Berhasil masuk cepat ke akun "${target.fullName}" (No. Rek: ${target.accountNumber}) tanpa PIN!`,
    };
  };

  // ❄️ Admin Quick Toggle Bekukan / Cairkan Kartu Tanpa Masuk Akun
  const adminQuickToggleFreezeAccount = (
    accountId: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }
    const nextStatus: CardStatus = target.cardStatus === 'frozen' ? 'active' : 'frozen';
    setAccounts((prev) =>
      prev.map((a) => (a.id === accountId ? { ...a, cardStatus: nextStatus } : a))
    );
    playAtmSound('beep');
    return {
      success: true,
      message:
        nextStatus === 'frozen'
          ? `❄️ Kartu milik "${target.fullName}" (${target.accountNumber}) berhasil DIBEKUKAN tanpa masuk akun!`
          : `🔥 Kartu milik "${target.fullName}" (${target.accountNumber}) berhasil DICAIRKAN (Aktif kembali)!`,
    };
  };

  // 🛠️ Admin Quick Full Inline Edit Semua Data Akun Tanpa Masuk Akun
  const adminQuickFullEditAccount = (
    accountId: string,
    updates: Partial<BankAccount>
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Akun tidak ditemukan.' };
    }
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === accountId
          ? {
              ...a,
              ...updates,
            }
          : a
      )
    );
    playAtmSound('success');
    return {
      success: true,
      message: `✅ Seluruh perubahan pada akun "${updates.fullName || target.fullName}" (${
        updates.accountNumber || target.accountNumber
      }) berhasil disimpan langsung dari Panel Admin!`,
    };
  };

  const reprintReceipts = currentAccountTransactions.slice(0, 10);
  const pendingFinancialTransactions = transactions.filter((t) => t.status === 'pending');
  const pendingBuyerApprovalTransactions = transactions.filter(
    (t) => t.accountId === currentAccountId && t.buyerApprovalStatus === 'waiting_buyer'
  );

  return (
    <BankContext.Provider
      value={{
        accounts,
        currentAccount,
        setCurrentAccountId,
        userRole,
        setUserRole,
        googleUser,
        loginWithGoogle,
        completeGoogleOnboarding,
        reopenGoogleOnboarding,
        logoutGoogle,
        websitePopups,
        activeWebsitePopups,
        dismissWebsitePopup,
        dismissAllWebsitePopups,
        globalChats,
        sendGlobalChatMessage,
        deleteGlobalChatMessage,
        clearGlobalChatMessages,
        isGlobalChatModalOpen,
        setIsGlobalChatModalOpen,
        connectedDevicesCount,
        bugReports,
        isBugReportModalOpen,
        setIsBugReportModalOpen,
        submitBugReport,
        adminUpdateBugReport,
        adminDeleteBugReport,
        adminClearBugReports,
        notificationsEnabled,
        notificationPermissionStatus,
        requestAndEnableNotifications,
        sendTestNotificationNow,
        activePushBanners,
        dismissPushBanner,
        adminUnlocked,
        setAdminUnlocked,
        featureConfigs,
        deletedFeatureIds,
        deletedFeaturesList,
        deleteFeatureById,
        deleteMultipleFeatures,
        restoreDeletedFeature,
        restoreAllDeletedFeatures,
        getFeatureConfig,
        toggleFeatureAdminPin,
        toggleFeatureAdminApproval,
        setAllFeaturesAdminPin,
        setAllFeaturesAdminApproval,
        userSettings,
        updateUserSettings,
        resetUserSettings,
        updateCustomerProfileIdentity,
        redeemCodes,
        createRedeemCode,
        deleteRedeemCode,
        toggleRedeemCodeActive,
        claimRedeemCode,
        purchasedCodes,
        currentAccountPurchasedCodes,
        redeemPurchasedCode,
        resiList,
        addResiRecord,
        payResiCod,
        cardUpgrades,
        applyCardUpgrade,
        adminApproveUpgrade,
        adminRejectUpgrade,
        pinResetRequests,
        requestPinReset,
        adminApprovePinReset,
        adminRejectPinReset,
        transactions,
        currentAccountTransactions,
        pendingFinancialTransactions,
        pendingBuyerApprovalTransactions,
        adminApproveFinancialTransaction,
        adminRejectFinancialTransaction,
        adminApproveAllFinancialTransactions,
        buyerApproveTransaction,
        buyerApproveAllTransactions,
        chats,
        sendChatMessage,
        pockets,
        currentAccountPockets,
        addPocket,
        depositToPocket,
        withdrawFromPocket,
        depositos,
        currentAccountDepositos,
        openDeposito,
        cardlessTokens,
        currentAccountCardlessTokens,
        createCardlessToken,
        payBill,
        updateCardSpendingLimit,
        toggleInternationalUsage,
        loans,
        currentAccountLoans,
        scheduledPayments,
        currentAccountScheduled,
        favorites,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        reprintReceipts,
        registerCard,
        toggleCardFreezeWithPin,
        regenerateAccountNumberWithPin,
        changePin,
        updatePhone,
        loginToCardWithPin,
        switchCardWithAdminCode,
        adminBanCard,
        adminUnbanCard,
        adminUnbanAllCards,
        submitCardBanAppeal,
        adminToggleVerifyAccount,
        adminVerifyAllAccounts,
        adminAdjustAccountBalance,
        adminDirectChangeAccountTier,
        adminDirectChangeAccountPin,
        adminSendWebsiteBroadcast,
        adminUpdateResiStatus,
        adminApproveAllPendingCards,
        adminApproveAllPendingUpgrades,
        adminApproveAllPendingLoans,
        adminApproveAllCards: adminApproveAllPendingCards,
        adminApproveAllUpgrades: adminApproveAllPendingUpgrades,
        adminApproveAllLoans: adminApproveAllPendingLoans,
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
        adminQuickLoginToAccount,
        adminQuickToggleFreezeAccount,
        adminQuickFullEditAccount,
        appUpdates,
        adminAddAppUpdate,
        adminEditAppUpdate,
        adminSetCurrentAppUpdate,
        adminDeleteAppUpdate,
        adminResetAppUpdates,
        adminAddCustomFeature,
        workJobClick,
        upgradeJobLevelWithCash,
        useJobLevelVoucher,
        playSuitForLevelVoucher,
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
        spinHistory,
        buySpinCoins,
        spinTheWheel,
        adminUpdateSpinWheelConfig,
        adminResetSpinWheelConfig,
        adminAdjustAccountSpinCoins,
        adminMassSpinCoinRain,
        sultanEmpireConfig,
        buySultanBusiness,
        sellSultanBusinessAuction,
        claimAllSultanBusinessProfits,
        tradeSultanAsset,
        openSultanMysteryVault,
        adminUpdateSultanEmpireConfig,
        adminResetSultanEmpireConfig,
        adminGiftAllSultanBusinessesToAccount,
        adminHelpRequests,
        isMintolModalOpen,
        setIsMintolModalOpen,
        submitMintolRequest,
        adminGrantAndExecuteMintolRequest,
        adminRejectMintolRequest,
        adminDeleteMintolRequest,
        adminClearMintolRequests,
        isTutorialModalOpen,
        setIsTutorialModalOpen,
        markTutorialCompleted,
        isAiBotModalOpen,
        setIsAiBotModalOpen,
        withdrawCash,
        depositCash,
        transferMoney,
        applyLoan,
        payLoanInstallment,
        adminApproveCard,
        adminRejectCard,
        adminApproveLoan,
        adminRejectLoan,
        addFavorite,
        deleteFavorite,
        addScheduledPayment,
        toggleScheduledPayment,
        deleteScheduledPayment,
        lookupAccount,
        resetAllData,
        startFromZero,
      }}
    >
      {children}
    </BankContext.Provider>
  );
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
};
