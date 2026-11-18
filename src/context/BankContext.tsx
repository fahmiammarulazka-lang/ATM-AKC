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
  db,
  auth,
  onAuthStateChanged,
  signOut,
  signInWithGooglePopup,
  normalizeEmailKey,
  emailToFirestoreDocId,
  testConnection,
  handleFirestoreError,
  OperationType,
  type FirebaseUser,
} from '../firebase';
import { doc, getDoc, getDocFromServer, setDoc, onSnapshot } from 'firebase/firestore';
import {
  BankAccount,
  Transaction,
  LoanApplication,
  ScheduledPayment,
  FavoriteAccount,
  AppNotification,
  NotificationCategory,
  ChatMessage,
  CardTier,
  CardStatus,
  LoanType,
  CardUpgradeApplication,
  PocketSaving,
  SavingsPocket,
  DepositoRecord,
  DepositoItem,
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
  GoldFormType,
  GoldMotifType,
  GoldBatchRecord,
  GoldPriceHistoryPoint,
  GoldAndTransferMarketConfig,
  TransferBebasAssetMode,
  TransferBebasReceipt,
  BudgetCategory,
  BudgetCategoryIcon,
  BudgetCategoryColor,
  ManualExpenseRecord,
  AdminGiftEventPackage,
  AdminGiftRewardItem,
  ActiveAccountTrial,
  GachaTierRange,
  GachaClaimedItemResult,
  JobCoinBonusConfig,
  GiftRewardType,
  DevRoleConfig,
  LetterSignatureStampConfig,
  AccountDeletionRequest,
  BanSupportConfig,
  BanScreenCustomizationConfig,
  BanConfigPreset,
  BanAuditLogEntry,
  CloudUserRecord,
  CloudSyncStatus,
  NotificationCategory10Key,
  AdminFullCustomAccountInput,
} from '../types/bank';
import {
  DEFAULT_NOTIFICATION_CATEGORY_PERMISSIONS,
  sanitizeNotificationCategoryPermissions,
  normalizeNotificationCategory,
  getNotificationCategoryMeta,
} from '../data/notificationCategories';
import {
  DEFAULT_BAN_SCREEN_CONFIG,
  DEFAULT_BAN_CONFIG_PRESETS,
  SYSTEM_BAN_REASONS_30,
  generateBanCaseId,
  computeDurationMinutesAndLabel,
} from '../data/banStudioCatalog';
import {
  DEFAULT_ADMIN_GIFT_EVENTS,
  GIFT_REWARD_CATALOG,
  MONTHS_INDO,
  formatTrialDurationLabel,
} from '../data/giftRewardsCatalog';
import { DEFAULT_DEV_ROLES_10 } from '../data/devRolesCatalog';
import { rollGachaOutcome } from '../utils/gachaUtils';
import {
  clearDeviceSnapshotStorage,
  wipeLegacyBrowserStorage,
  loadGuestAccountsFromLocalStorage,
  saveGuestAccountsToLocalStorage,
  type BankPersistableSnapshot,
} from '../services/deviceStorage';
import {
  DEFAULT_BUDGET_CATEGORIES,
  computeMonthlyBudgetReport,
  getCurrentMonthKey,
  formatMonthLabelIndo,
} from '../utils/budgetUtils';
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
  PURGED_BOT_ACCOUNT_IDS,
  PURGED_BOT_ACCOUNT_NUMBERS,
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
  COIN_PURCHASE_PACKAGES_300,
  calculateCoinPackagePrice,
  calculateSpinCost,
  calculateCashSpinCost,
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
  generateRandomUserId16,
  ensureAccountUserId16,
  formatUserId16,
  generateRandomPin6,
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

  // Cloud Auth, Real-Time Sync & Onboarding Flow (Wajib Google Sign-In)
  googleUser: GoogleUserSession | null;
  firebaseUser: FirebaseUser | null;
  isCloudBootReady: boolean;
  cloudSyncStatus: CloudSyncStatus;
  lastCloudSyncAt: string | null;
  cloudUserStatus: CloudUserRecord | null;
  loginOrRegisterWithEmail: (input: {
    email: string;
    displayName?: string;
  }) => Promise<{ success: boolean; isNewUser?: boolean; message: string }>;
  loginWithGooglePopup: () => Promise<{ success: boolean; errorCode?: string; message: string }>;
  loginWithOaAccount: (input: {
    accountNumber: string;
    userId16: string;
    cardPin: string;
    adminPin: string;
  }) => Promise<{ success: boolean; message: string }>;
  guestLocalAccounts: BankAccount[];
  registerGuestRegularCard: (
    input: Omit<RegisterCardInput, 'cardTier' | 'email'>
  ) => { success: boolean; message: string; account?: BankAccount };
  loginToGuestAccountWithPin: (
    accountId: string,
    cardPin: string
  ) => { success: boolean; message: string };
  linkCurrentAccountWithGooglePopup: (
    targetAccountId?: string
  ) => Promise<{ success: boolean; message: string; email?: string; errorCode?: string }>;
  enterBankPortal: () => void;
  loginWithGoogle: (email: string, name: string, picture?: string, firebaseUid?: string) => void;
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

  // Background & Multi-Channel Notification System (Service Worker + Browser + Banner + Bell)
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  backgroundAutoNotifEnabled: boolean;
  setBackgroundAutoNotifEnabled: (enabled: boolean) => void;
  notificationPermissionStatus: 'default' | 'granted' | 'denied';
  requestAndEnableNotifications: () => Promise<{ success: boolean; message: string }>;
  sendTestNotificationNow: () => void;
  sendBulkNotifications: (
    count: number,
    customTitle?: string,
    customMessage?: string
  ) => { success: boolean; message: string; sentCount: number };
  activePushBanners: MobilePushBannerToast[];
  dismissPushBanner: (id: string) => void;
  emitPinSecurityAlert: (targetAccountName?: string, contextLabel?: string) => void;

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

  // Redeem Codes (Tukar Kode Redeem dibuat di Panel Admin dengan kuota, durasi & opsi notifikasi)
  redeemCodes: RedeemCode[];
  createRedeemCode: (input: {
    code: string;
    title: string;
    rewardAmount: number;
    maxClaims: number;
    durationMinutes: number;
    requireAdminPin?: boolean;
    sendNotification?: boolean;
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

  // Notifications (10 Jenis + Izin Real-Time Cloud)
  notifications: AppNotification[];
  unreadNotificationCount: number;
  notificationCategoryPermissions: Record<NotificationCategory10Key, boolean>;
  toggleNotificationCategoryPermission: (categoryKey: NotificationCategory10Key) => void;
  setAllNotificationCategoryPermissions: (allowed: boolean) => void;
  markCategoryNotificationsAsRead: (categoryKey: NotificationCategory10Key) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'warning' | 'alert',
    meta?: {
      category?: NotificationCategory;
      targetView?: string;
      targetDashboardTab?: string;
      accountId?: string;
      referenceId?: string;
      skipServerBroadcast?: boolean;
    }
  ) => void;

  // Receipts for ATM reprint
  reprintReceipts: Transaction[];

  // Account operations with Card PIN or Admin Code requirement
  registerCard: (data: RegisterCardInput) => { success: boolean; message: string; accountId?: string };
  toggleCardFreezeWithPin: (accountId: string, pin: string) => { success: boolean; message: string; newStatus?: string };
  regenerateAccountNumberWithPin: (accountId: string, pin: string) => { success: boolean; message: string; newAccountNumber?: string };
  changePin: (accountId: string, oldPin: string, newPin: string) => { success: boolean; message: string };
  updatePhone: (accountId: string, newPhone: string) => { success: boolean; message: string };

  // Switch / Login to Old Card using that Old Card's 6-Digit PIN (Bukan PIN Admin!)
  loginToCardWithPin: (
    targetAccountIdOrObj: string | { targetAccountId: string; cardPin: string },
    cardPin?: string
  ) => {
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

  // Card Ban & Unban Operations + 50-Feature Admin Ban Studio (Panel Admin)
  linkedUserAccount: BankAccount | null;
  linkedUserAccounts: BankAccount[];
  verifyInitialCardPin: (
    cardPin: string,
    targetAccountId?: string
  ) => {
    success: boolean;
    failedAttempts?: number;
    remainingAttempts?: number;
    bannedNow?: boolean;
    message: string;
  };
  adminResetPinAttempts: (accountId: string) => { success: boolean; message: string };
  adminBanCard: (input: {
    accountId: string;
    reason?: string; // Opsional di Panel Admin
    durationType: 'custom' | 'permanent';
    durationMinutes?: number;
    durationLabel?: string;
    customConfig?: BanScreenCustomizationConfig;
  }) => { success: boolean; message: string };
  adminApplyCustomBanConfig: (input: {
    targetAccountIds: string[];
    config: BanScreenCustomizationConfig;
    isUpdateExisting?: boolean;
    isEditExisting?: boolean;
  }) => { success: boolean; message: string; count: number };
  adminSaveDefaultBanTemplate: (
    config: BanScreenCustomizationConfig
  ) => { success: boolean; message: string };
  adminSaveBanPreset: (input: {
    name: string;
    description?: string;
    config: BanScreenCustomizationConfig;
  }) => { success: boolean; message: string };
  adminDeleteBanPreset: (presetId: string) => { success: boolean; message: string };
  adminUnbanCard: (accountId: string) => { success: boolean; message: string };
  adminUnbanAllCards: () => { success: boolean; message: string; count: number };
  submitCardBanAppeal: (accountId: string, appealNote?: string) => { success: boolean; message: string };
  activeBanLockState: {
    isBanned: boolean;
    reason: string;
    bannedAt?: string;
    durationLabel?: string;
    expiresAt?: string;
    appealStatus: 'none' | 'pending' | 'rejected' | 'approved';
    appealNote?: string;
    appealCategory?: string;
    appealCount: number;
    appealAdminNote?: string;
    customConfig: BanScreenCustomizationConfig;
  };
  banSupportConfig: BanSupportConfig;
  adminUpdateBanSupportConfig: (config: BanSupportConfig) => Promise<{ success: boolean; message: string }>;
  submitUnifiedBanAppeal: (
    message: string,
    source?: 'in_app' | 'whatsapp' | 'email',
    appealCategory?: string,
    promiseAccepted?: boolean
  ) => Promise<{ success: boolean; message: string }>;
  adminReviewUnifiedBanAppeal: (
    accountId: string,
    action: 'approve' | 'reject',
    adminNote?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Admin Blue Checkmark Verification Badge (Centang Biru di Panel Admin)
  adminToggleVerifyAccount: (
    accountId: string,
    customLabel?: string
  ) => { success: boolean; message: string; isVerified: boolean };
  adminVerifyAllAccounts: (verified: boolean, customLabel?: string) => { success: boolean; message: string };

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
    modeOrAmount?: 'add' | 'subtract' | 'set' | 'unlimited' | number,
    amountOrMode?: number | 'add' | 'subtract' | 'set' | 'unlimited',
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
    newCardNumberOrObj:
      | string
      | {
          cardNumber?: string;
          cvv?: string;
          expiryDate?: string;
        },
    newCvv?: string,
    newExpiry?: string
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
    userId16?: string;
    pin: string;
    oaAdminPin?: string;
    balance?: number;
    initialBalance?: number;
    cardTier: CardTier;
    isVerified?: boolean;
  }) => { success: boolean; message: string };
  adminCreateFullCustomAccount: (
    input: AdminFullCustomAccountInput
  ) => { success: boolean; message: string; account?: BankAccount };
  adminToggleOaAccountStatus: (
    accountId: string,
    enabled: boolean,
    customOaAdminPin?: string
  ) => { success: boolean; message: string };
  adminGrantAccountSultanBusinesses: (
    accountId: string,
    unitsEach?: number
  ) => { success: boolean; message: string };
  adminConnectAccountToEmail: (
    accountId: string,
    email: string
  ) => { success: boolean; message: string };
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
    accountId?: string;
    type?: 'pulsa' | 'token_listrik' | 'voucher_lain';
    category?: 'pulsa' | 'token_listrik' | 'voucher_lain';
    title?: string;
    nominal: number;
    targetId?: string;
    targetNumber?: string;
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
      fullName?: string;
      nik?: string;
      phone?: string;
      email?: string;
      address?: string;
    }
  ) => { success: boolean; message: string };
  adminMultiplyAccountBalance: (accountId: string, multiplier: number) => { success: boolean; message: string };
  adminSetAllAccountsTier: (tier: CardTier) => { success: boolean; message: string };
  adminDeleteAccount: (
    accountId: string,
    options?: { logoutIfCurrent?: boolean }
  ) => { success: boolean; message: string };
  accountDeletionRequests: AccountDeletionRequest[];
  submitAccountDeletionRequest: (input: {
    accountId: string;
    reasonCategory: string;
    reasonDetail: string;
    confirmationAnswers: {
      understandPermanentLoss: boolean;
      noPendingObligations: boolean;
      agreeAdminReview: boolean;
    };
  }) => { success: boolean; message: string; request?: AccountDeletionRequest };
  cancelAccountDeletionRequest: (requestId: string) => { success: boolean; message: string };
  approveAccountDeletionRequest: (
    requestId: string,
    adminNote?: string
  ) => { success: boolean; message: string };
  rejectAccountDeletionRequest: (
    requestId: string,
    adminNote?: string
  ) => { success: boolean; message: string };
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

  // Lowongan Pekerjaan (25 Jenjang Rp 100.000 - Rp 10.000.000), Ikon Uang & Coin, Sistem Level & Arena Suit
  workJobClick: (
    jobId: string,
    salary: number,
    targetClicks: number,
    requiredLevel: number,
    jobTitle: string,
    coinReward?: number,
    clickCount?: number
  ) => {
    success: boolean;
    completed: boolean;
    currentClicks: number;
    targetClicks: number;
    paidAmount?: number;
    coinsEarned?: number;
    baseCoinsEarned?: number;
    bonusCoinsEarned?: number;
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
    mode?: 'add' | 'set' | 'max'
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
  spinTheWheel: (
    spinCount: 1 | 3 | 5 | 7 | 10,
    paymentMethod?: 'coins' | 'cash'
  ) => {
    success: boolean;
    message: string;
    paymentMethod?: 'coins' | 'cash';
    coinsSpent?: number;
    rupiahSpent?: number;
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

  // Tab Emas Mewah 24K Real-Time & Transfer Bebas (Admin 5% - Uang, Coin, Emas, Gabungan)
  goldMarketConfig: GoldAndTransferMarketConfig;
  buyGold: (input: {
    rupiahAmount: number;
    goldForm: GoldFormType;
    motif: GoldMotifType;
    karat?: number;
    note?: string;
  }) => {
    success: boolean;
    message: string;
    gramsAdded?: number;
    batch?: GoldBatchRecord;
    newBalance?: number;
    newGoldGrams?: number;
  };
  sellGold: (input: {
    mode: 'rupiah' | 'batch' | 'all';
    rupiahAmount?: number;
    batchId?: string;
  }) => {
    success: boolean;
    message: string;
    proceedsRupiah?: number;
    grossMarketValue?: number;
    penaltyDeducted?: number;
    profitOrLoss?: number;
    gramsSold?: number;
    sameDayApplied?: boolean;
  };
  setCustomerCustomGoldPrice: (pricePerGram: number | null) => {
    success: boolean;
    message: string;
  };
  updateCustomerGoldPreferences: (input: {
    targetRupiah?: number;
    preferredForm?: GoldFormType;
    preferredMotif?: GoldMotifType;
  }) => { success: boolean; message: string };
  dismissGoldMonthlyBanner: () => void;
  transferBebas: (input: {
    assetMode: TransferBebasAssetMode;
    recipientAccount: string;
    recipientName: string;
    recipientBank: string;
    uangAmount: number;
    coinAmount: number;
    goldRupiahAmount: number;
    note?: string;
    pin: string;
  }) => {
    success: boolean;
    message: string;
    receipt?: TransferBebasReceipt;
    transaction?: Transaction;
  };
  adminUpdateGoldMarketConfig: (
    partial: Partial<GoldAndTransferMarketConfig>
  ) => { success: boolean; message: string };
  adminSimulateGoldNextMonth: (months?: number) => {
    success: boolean;
    message: string;
    newPricePerGram: number;
  };
  adminResetGoldMarketConfig: () => { success: boolean; message: string };
  adminAdjustAccountGold: (
    accountId: string,
    value: number,
    inputUnit: 'rupiah' | 'grams',
    mode: 'add' | 'set'
  ) => { success: boolean; message: string };

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

  // Budgeting & Expense Tracking (Anggaran Bulanan)
  budgetCategories: BudgetCategory[];
  manualExpenses: ManualExpenseRecord[];
  budgetTxCategoryMap: Record<string, string>;
  budgetAlertHistory: string[];
  addBudgetCategory: (input: {
    name: string;
    monthlyLimit: number;
    icon: BudgetCategoryIcon;
    color: BudgetCategoryColor;
    keywords?: string[];
  }) => { success: boolean; message: string };
  updateBudgetCategory: (
    categoryId: string,
    updates: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit' | 'icon' | 'color' | 'keywords'>>
  ) => { success: boolean; message: string };
  deleteBudgetCategory: (categoryId: string) => { success: boolean; message: string };
  addManualExpense: (input: {
    categoryId: string;
    title: string;
    amount: number;
    note?: string;
    timestamp?: string;
  }) => { success: boolean; message: string };
  deleteManualExpense: (expenseId: string) => void;
  setTransactionBudgetCategory: (transactionId: string, categoryId: string) => void;

  // Reset to default or start from zero
  resetAllData: () => void;
  startFromZero: () => void;

  // Sistem Hadiah & Surat Spesial Admin (Tanggal Tertentu / 29 Januari Otomatis + Kirim Manual + Kunci Tanggal + 100 Hadiah & Trial + Transfer ke Teman)
  giftEvents: AdminGiftEventPackage[];
  deletedGiftEventIds: string[];
  giftEventsInitialized: boolean;
  activeGiftModal: { eventId: string; isReplay: boolean } | null;
  giftDateTestOverride: { month: number; day: number } | null;
  isGiftEventOpenableNow: (ev: AdminGiftEventPackage, accountId?: string) => boolean;
  openGiftEventModal: (eventId: string, isReplay?: boolean) => void;
  closeGiftEventModal: () => void;
  markGiftLetterOpened: (eventId: string) => void;
  beginOpeningGiftBox: (eventId: string) => void;
  isGiftBoxTransferLocked: (eventId: string, accountId?: string) => boolean;
  transferGiftEventToFriend: (
    eventId: string,
    recipientQuery: string,
    personalNote?: string
  ) => {
    success: boolean;
    message: string;
    recipientName?: string;
    recipientAccountNumber?: string;
  };
  claimAndOpenGiftEvent: (eventId: string) => {
    success: boolean;
    alreadyClaimed: boolean;
    lockedByDate?: boolean;
    summaryLines: string[];
    rolledResults?: GachaClaimedItemResult[];
    message: string;
  };
  adminCreateOrUpdateGiftEvent: (input: {
    id?: string;
    title: string;
    senderName: string;
    letterMessage: string;
    deliveryContentMode?: 'both' | 'letter_only' | 'gift_only';
    triggerMode: 'scheduled_date' | 'manual_instant' | 'both';
    autoPopupEnabled: boolean;
    strictDateLock?: boolean;
    isGachaBox?: boolean;
    scheduleMonth: number;
    scheduleDay: number;
    isActive: boolean;
    targetAccountId?: string;
    targetAccountIds?: string[];
    revokedAccountIds?: string[];
    themeColor?: 'amber' | 'emerald' | 'rose' | 'indigo';
    rewards: AdminGiftRewardItem[];
    customSealConfig?: LetterSignatureStampConfig | null;
    frequencyType?: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_recurring';
    recurringIntervalHours?: number;
    autoRotateRecurring?: boolean;
    maxRedeemsPerUser?: number;
    targetCardTier?: CardTier | 'all';
    targetDevRoleOnly?: string;
    celebrationEffect?: 'confetti' | 'gold_rain' | 'fireworks' | 'none';
    soundEffect?: 'chime' | 'harp' | 'fanfare' | 'silent';
    requireAdminVerifiedAccessForNotif?: boolean;
    adminAuditLogTag?: string;
    customStampText?: string;
    watermarkText?: string;
    securityHashToken?: string;
    allowAnonymousClaim?: boolean;
    notifyOnlyAdminVerifiedUsers?: boolean;
    priorityLevel?: 'normal' | 'high' | 'vip_exclusive';
    customCssTheme?: string;
    attachmentFileUrl?: string;
    attachmentFileName?: string;
    autoExpireHours?: number;
    allowTransferableGift?: boolean;
  }) => { success: boolean; message: string; event: AdminGiftEventPackage };
  adminDeleteGiftEvent: (eventId: string) => { success: boolean; message: string };
  adminToggleGiftEventActive: (eventId: string) => { success: boolean; message: string };
  adminTriggerGiftEventNow: (eventId: string) => { success: boolean; message: string };
  adminResetGiftEventStatus: (
    eventId: string,
    options?: {
      accountId?: string;
      resetType?: 'all' | 'claim_only' | 'letter_only';
      retriggerPopup?: boolean;
    }
  ) => { success: boolean; message: string };
  adminToggleRevokeGiftEventRecipient: (
    eventId: string,
    accountId: string
  ) => { success: boolean; message: string; isRevoked: boolean };
  adminDuplicateGiftEvent: (
    eventId: string,
    options?: {
      targetAccountId?: string;
      targetAccountIds?: string[];
      deliveryContentMode?: 'both' | 'letter_only' | 'gift_only';
      sendNow?: boolean;
    }
  ) => { success: boolean; message: string; event?: AdminGiftEventPackage };
  adminUpdateGiftEventQuickSettings: (
    eventId: string,
    patch: {
      deliveryContentMode?: 'both' | 'letter_only' | 'gift_only';
      targetAccountId?: string;
      targetAccountIds?: string[];
      letterMessage?: string;
      title?: string;
      senderName?: string;
      retriggerPopup?: boolean;
    }
  ) => { success: boolean; message: string };
  adminSetGiftDateTestOverride: (override: { month: number; day: number } | null) => void;

  // Sistem Bonus Coin Lowongan Pekerjaan (Pengali & Bonus Ekstra) & Gacha Universal Admin
  jobCoinBonusConfig: JobCoinBonusConfig;
  adminUpdateJobCoinBonusConfig: (config: JobCoinBonusConfig) => { success: boolean; message: string };
  adminExecuteUniversalGachaDrop: (input: {
    targetAccountId: string | '__ALL__';
    rewardType: GiftRewardType;
    title: string;
    senderName: string;
    letterMessage?: string;
    deliveryMode: 'send_animated_box' | 'instant_roll_to_accounts';
    tiers: GachaTierRange[];
    trialDurationMinutes?: number;
  }) => {
    success: boolean;
    message: string;
    logs: { accountName: string; accountNumber: string; tierLabel: string; amount: number; unitLabel: string }[];
  };

  // Sistem 10 Role Dev / Own / Admin yang dapat di-setting di Panel Admin
  devRoles: DevRoleConfig[];
  adminUpdateDevRole: (roleId: string, patch: Partial<Omit<DevRoleConfig, 'id' | 'slotNumber'>>) => {
    success: boolean;
    message: string;
  };
  adminResetDevRoles: () => { success: boolean; message: string };
  adminAssignAccountDevRole: (accountId: string, roleId: string | null) => {
    success: boolean;
    message: string;
  };

  // Konfigurasi Tanda Tangan & Stempel Surat Admin (Default Global)
  defaultLetterSealConfig: LetterSignatureStampConfig;
  adminUpdateDefaultLetterSealConfig: (config: LetterSignatureStampConfig) => {
    success: boolean;
    message: string;
  };
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
  GOLD_TRANSFER_MARKET: 'bank_nusantara_gold_transfer_v1',
  BUDGET_CATEGORIES: 'bank_nusantara_budget_categories_v1',
  MANUAL_EXPENSES: 'bank_nusantara_manual_expenses_v1',
  BUDGET_TX_MAP: 'bank_nusantara_budget_tx_map_v1',
  BUDGET_ALERTS: 'bank_nusantara_budget_alerts_v1',
  SPIN_VAULT: 'bank_nusantara_spin_vault_v1',
  GIFT_EVENTS: 'bank_nusantara_gift_events_v1',
  JOB_COIN_BONUS: 'bank_nusantara_job_coin_bonus_v1',
  DEV_ROLES: 'bank_nusantara_dev_roles_v1',
  LETTER_SEAL: 'bank_nusantara_letter_seal_v1',
  DELETED_ACCOUNTS: 'bank_nusantara_deleted_accounts_v1',
  ACCOUNT_DELETION_REQUESTS: 'bank_nusantara_account_deletion_requests_v1',
};

const DEFAULT_JOB_COIN_BONUS_CONFIG: JobCoinBonusConfig = {
  enabled: true,
  coinMultiplier: 1,
  extraBonusCoins: 0,
};

const writeSpinVaultFromAccounts = (_accs: BankAccount[], _nowMs: number = Date.now()) => {
  // Penyimpanan lokal dinonaktifkan — seluruh data koin & akun tersimpan 100% di Cloud Firestore.
};

const mergeAccountsWithSpinVault = (accs: BankAccount[]): BankAccount[] => accs;

function sanitizeForFirestore(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === undefined) return null;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    if (value.startsWith('data:image/') && value.length > 4096) {
      return '';
    }
    return value.length > 8000 ? value.slice(0, 8000) : value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 260)
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined || !k) continue;
      out[k] = sanitizeForFirestore(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

const getLocalDateKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const getLocalMonthKey = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
};

const computeMonthsDifference = (fromYM: string, toYM: string): number => {
  const [fy, fm] = fromYM.split('-').map((n) => parseInt(n, 10));
  const [ty, tm] = toYM.split('-').map((n) => parseInt(n, 10));
  if (!fy || !fm || !ty || !tm) return 0;
  return (ty - fy) * 12 + (tm - fm);
};

const formatMonthShortIndo = (d: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
};

const createInitialGoldMarketConfig = (): GoldAndTransferMarketConfig => {
  const now = new Date();
  const currentPrice = 1_400_000;
  const growth = 5;
  const history: GoldPriceHistoryPoint[] = [];
  // Build 5 previous months + current month curve reflecting +5% monthly growth
  for (let i = 5; i >= 0; i--) {
    const dt = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const priceAtMonth = Math.round(currentPrice / Math.pow(1 + growth / 100, i));
    history.push({
      id: `gold-hist-init-${i}`,
      label: formatMonthShortIndo(dt),
      monthKey: getLocalMonthKey(dt),
      pricePerGram: priceAtMonth,
      changePercent: i === 5 ? 0 : growth,
      timestamp: dt.toISOString(),
      isSimulation: false,
    });
  }
  return {
    basePricePerGram: currentPrice,
    currentPricePerGram: currentPrice,
    monthlyGrowthPercent: 5,
    sameDayPenaltyMode: '1%',
    sameDayPenaltyPercent: 1,
    transferBebasAdminFeePercent: 5,
    minNominalRupiah: 1_000,
    lastProcessedMonthKey: getLocalMonthKey(now),
    simulatedMonthsOffset: 0,
    priceHistory: history,
  };
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
  pushTransactionAlerts: true,
  pushLoanAlerts: true,
  pushSecurityAlerts: true,
  pushPromoAlerts: true,
  notificationCategoryPermissions: { ...DEFAULT_NOTIFICATION_CATEGORY_PERMISSIONS },
};

export const BankProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const clientSessionId = useRef<string>(
    `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  ).current;

  const [isCloudBootReady, setIsCloudBootReady] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('syncing');
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [activeCloudEmail, setActiveCloudEmail] = useState<string | null>(null);
  const activeCloudEmailRef = useRef<string | null>(null);
  activeCloudEmailRef.current = activeCloudEmail;
  const [cloudUserStatus, setCloudUserStatus] = useState<CloudUserRecord | null>(null);
  const [banSupportConfig, setBanSupportConfig] = useState<BanSupportConfig>({
    whatsappNumber: '6281234567890',
    emailAddress: 'support@banknusantara.id',
    defaultTemplateConfig: { ...DEFAULT_BAN_SCREEN_CONFIG },
    presets: [...DEFAULT_BAN_CONFIG_PRESETS],
    auditLogs: [],
  });

  const [deletedAccountIds, setDeletedAccountIds] = useState<string[]>(() => [
    ...PURGED_BOT_ACCOUNT_IDS,
  ]);
  const deletedAccountIdsRef = useRef<string[]>([...PURGED_BOT_ACCOUNT_IDS]);
  deletedAccountIdsRef.current = deletedAccountIds;

  const [accountDeletionRequests, setAccountDeletionRequests] = useState<AccountDeletionRequest[]>([]);

  const isRealGoogleLinkedEmail = (rawEmail?: string): boolean => {
    const em = (rawEmail || '').trim().toLowerCase();
    return Boolean(
      em &&
        em.includes('@') &&
        !em.endsWith('@nusantara.id') &&
        !em.endsWith('@banknusantara.id') &&
        !em.startsWith('oa.')
    );
  };

  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const base: BankAccount[] = INITIAL_ACCOUNTS.filter(
      (a) =>
        !PURGED_BOT_ACCOUNT_IDS.includes(a.id) &&
        !PURGED_BOT_ACCOUNT_NUMBERS.includes(a.accountNumber)
    ).map((a) => ({
      ...a,
      status: a.cardStatus === 'banned' || a.banInfo?.isBanned ? ('banned' as const) : ('active' as const),
      banReason: a.banInfo?.reason || a.banReason || '',
    }));
    const localGuests = loadGuestAccountsFromLocalStorage<BankAccount>();
    for (const g of localGuests) {
      if (
        g &&
        g.id &&
        !PURGED_BOT_ACCOUNT_IDS.includes(g.id) &&
        !PURGED_BOT_ACCOUNT_NUMBERS.includes(g.accountNumber) &&
        !base.some((b) => b.id === g.id)
      ) {
        const hasGoogle = isRealGoogleLinkedEmail(g.googleEmail || g.email);
        base.unshift({
          ...g,
          userId16: ensureAccountUserId16(g),
          isOfficialAdminAccount: Boolean(g.isOfficialAdminAccount),
          oaAdminPin: g.oaAdminPin || '159357',
          status: g.status === 'banned' || g.cardStatus === 'banned' ? ('banned' as const) : ('active' as const),
          banReason: g.banReason || '',
          isGuestAccount: !hasGoogle,
          googleEmail: hasGoogle ? normalizeEmailKey(g.googleEmail || g.email || '') : g.googleEmail,
          email: hasGoogle ? normalizeEmailKey(g.email || g.googleEmail || '') : g.email,
        });
      }
    }
    return base;
  });

  // Simpan akun Guest murni yang belum tersambung Google ke LocalStorage perangkat secara otomatis
  useEffect(() => {
    const pureGuests = accounts.filter(
      (a) =>
        Boolean(a.isGuestAccount && !isRealGoogleLinkedEmail(a.googleEmail || a.email)) &&
        !PURGED_BOT_ACCOUNT_IDS.includes(a.id)
    );
    saveGuestAccountsToLocalStorage(pureGuests);
  }, [accounts]);

  const [googleUser, setGoogleUser] = useState<GoogleUserSession | null>(null);
  const [websitePopups, setWebsitePopups] = useState<WebsiteSystemPopupNotification[]>([]);
  const [dismissedPopupIds, setDismissedPopupIds] = useState<string[]>([]);
  const [globalChats, setGlobalChats] = useState<GlobalChatMessage[]>([
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
  ]);

  const [bugReports, setBugReports] = useState<BugReportRecord[]>([]);
  const [appUpdates, setAppUpdates] = useState<AppUpdateRecord[]>(INITIAL_APP_UPDATES);
  const [spinWheelConfig, setSpinWheelConfig] = useState<SpinWheelAdminConfig>(INITIAL_SPIN_WHEEL_CONFIG);
  const [spinHistory, setSpinHistory] = useState<SpinHistoryRecord[]>([]);
  const [sultanEmpireConfig, setSultanEmpireConfig] = useState<SultanEmpireAdminConfig>(
    INITIAL_SULTAN_EMPIRE_CONFIG
  );
  const [goldMarketConfig, setGoldMarketConfig] = useState<GoldAndTransferMarketConfig>(() =>
    createInitialGoldMarketConfig()
  );
  const [adminHelpRequests, setAdminHelpRequests] = useState<AdminHelpRequestRecord[]>([]);

  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState<boolean>(false);
  const [isMintolModalOpen, setIsMintolModalOpen] = useState<boolean>(false);
  const [isGlobalChatModalOpen, setIsGlobalChatModalOpen] = useState<boolean>(false);
  const [connectedDevicesCount, setConnectedDevicesCount] = useState<number>(1);
  const [activePushBanners, setActivePushBanners] = useState<MobilePushBannerToast[]>([]);

  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const notificationsEnabledRef = useRef<boolean>(notificationsEnabled);
  notificationsEnabledRef.current = notificationsEnabled;

  const [backgroundAutoNotifEnabled, setBackgroundAutoNotifEnabled] = useState<boolean>(true);

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

  const [currentAccountId, setCurrentAccountIdState] = useState<string>('acc-admin');
  const [userRole, setUserRoleState] = useState<'customer' | 'admin'>('customer');
  const [adminUnlocked, setAdminUnlockedState] = useState<boolean>(false);

  const [rawFeatureConfigs, setFeatureConfigs] = useState<FeatureSecurityConfig[]>(INITIAL_FEATURE_CONFIGS);
  const [deletedFeatureIds, setDeletedFeatureIds] = useState<string[]>([]);
  const [userSettings, setUserSettings] = useState<UserAppSettings>(DEFAULT_USER_APP_SETTINGS);
  const userSettingsRef = useRef<UserAppSettings>(userSettings);
  userSettingsRef.current = userSettings;

  const featureConfigs = rawFeatureConfigs.filter((f) => !deletedFeatureIds.includes(f.id));
  const deletedFeaturesList = rawFeatureConfigs.filter((f) => deletedFeatureIds.includes(f.id));

  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>(INITIAL_REDEEM_CODES);
  const [purchasedCodes, setPurchasedCodes] = useState<PurchasedVoucherCode[]>(INITIAL_PURCHASED_CODES);
  const [resiList, setResiList] = useState<ResiTrackingRecord[]>(INITIAL_RESI_LIST);
  const [cardUpgrades, setCardUpgrades] = useState<CardUpgradeApplication[]>(INITIAL_UPGRADES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [loans, setLoans] = useState<LoanApplication[]>(INITIAL_LOANS);
  const [chats, setChats] = useState<ChatMessage[]>(INITIAL_CHATS);
  const [pockets, setPockets] = useState<PocketSaving[]>(INITIAL_POCKETS);
  const [depositos, setDepositos] = useState<DepositoRecord[]>(INITIAL_DEPOSITOS);
  const [cardlessTokens, setCardlessTokens] = useState<CardlessToken[]>(INITIAL_CARDLESS);
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>(INITIAL_SCHEDULED_PAYMENTS);
  const [favorites, setFavorites] = useState<FavoriteAccount[]>(INITIAL_FAVORITES);
  const [notifications, setNotifications] = useState<AppNotification[]>(INITIAL_NOTIFICATIONS);
  const [pinResetRequests, setPinResetRequests] = useState<PinResetRequest[]>([]);

  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(DEFAULT_BUDGET_CATEGORIES);
  const [manualExpenses, setManualExpenses] = useState<ManualExpenseRecord[]>([]);
  const [budgetTxCategoryMap, setBudgetTxCategoryMap] = useState<Record<string, string>>({});
  const [budgetAlertHistory, setBudgetAlertHistory] = useState<string[]>([]);

  const [deletedGiftEventIds, setDeletedGiftEventIds] = useState<string[]>([]);
  const deletedGiftEventIdsRef = useRef<string[]>([]);
  deletedGiftEventIdsRef.current = deletedGiftEventIds;

  const [giftEventsInitialized, setGiftEventsInitialized] = useState<boolean>(false);
  const giftEventsInitializedRef = useRef<boolean>(giftEventsInitialized);
  giftEventsInitializedRef.current = giftEventsInitialized;

  const [giftEvents, setGiftEvents] = useState<AdminGiftEventPackage[]>(DEFAULT_ADMIN_GIFT_EVENTS);
  const [activeGiftModal, setActiveGiftModal] = useState<{ eventId: string; isReplay: boolean } | null>(null);
  const [openingGiftBoxKeys, setOpeningGiftBoxKeys] = useState<string[]>([]);
  const openingGiftBoxKeysRef = useRef<Set<string>>(new Set());
  const [giftDateTestOverride, setGiftDateTestOverride] = useState<{ month: number; day: number } | null>(null);
  const [jobCoinBonusConfig, setJobCoinBonusConfig] = useState<JobCoinBonusConfig>(DEFAULT_JOB_COIN_BONUS_CONFIG);
  const [devRoles, setDevRoles] = useState<DevRoleConfig[]>(DEFAULT_DEV_ROLES_10);

  // Bersihkan sisa localStorage & sessionStorage lama sekali saat startup agar zero local cache tertinggal
  useEffect(() => {
    wipeLegacyBrowserStorage();
    void clearDeviceSnapshotStorage();
  }, []);

  // Real-time Firestore Sync across devices & mobile (Laptop/Admin as Master Data to HP)
  const hasFirestoreHydratedRef = useRef<boolean>(false);
  const isApplyingFirestoreRef = useRef<boolean>(false);
  const lastFirestoreWriteMsRef = useRef<number>(0);
  const isLinkingAccountToGoogleRef = useRef<boolean>(false);

  const applyMasterCloudData = (
    data: Record<string, any>,
    options?: { forceInitial?: boolean }
  ) => {
    if (!data || typeof data !== 'object') return;
    if (!options?.forceInitial && data.writerSessionId === clientSessionId) {
      return;
    }

    const incomingMs = typeof data.updatedAtMs === 'number' ? data.updatedAtMs : 0;
    // Hanya abaikan snapshot basi dari sesi writer yang SAMA; jika berasal dari perangkat berbeda (HP <-> Laptop), tetap terapkan meskipun jam sistem selisih beberapa detik
    if (
      !options?.forceInitial &&
      hasFirestoreHydratedRef.current &&
      data.writerSessionId === clientSessionId &&
      incomingMs > 0 &&
      incomingMs <= lastFirestoreWriteMsRef.current
    ) {
      return;
    }
    if (incomingMs > lastFirestoreWriteMsRef.current) {
      lastFirestoreWriteMsRef.current = incomingMs;
    }

    isApplyingFirestoreRef.current = true;

    const mergedDelAccountIds: string[] = Array.from(
      new Set([
        ...PURGED_BOT_ACCOUNT_IDS,
        ...deletedAccountIdsRef.current,
        ...(Array.isArray(data.deletedAccountIds) ? (data.deletedAccountIds as string[]) : []),
      ])
    );
    setDeletedAccountIds(mergedDelAccountIds);
    deletedAccountIdsRef.current = mergedDelAccountIds;

    const mergedDelGiftIds: string[] = Array.isArray(data.deletedGiftEventIds)
      ? Array.from(new Set([...deletedGiftEventIdsRef.current, ...data.deletedGiftEventIds]))
      : deletedGiftEventIdsRef.current;
    if (Array.isArray(data.deletedGiftEventIds)) {
      setDeletedGiftEventIds(mergedDelGiftIds);
    }

    let hadPurgedBotAccountsInCloud = false;

    if (Array.isArray(data.accounts)) {
      const incomingAccounts = data.accounts as BankAccount[];
      hadPurgedBotAccountsInCloud = incomingAccounts.some(
        (a) =>
          PURGED_BOT_ACCOUNT_IDS.includes(a.id) ||
          PURGED_BOT_ACCOUNT_NUMBERS.includes(a.accountNumber)
      );

      const cleanAccounts: BankAccount[] = incomingAccounts
        .filter(
          (a) =>
            a &&
            a.id &&
            !mergedDelAccountIds.includes(a.id) &&
            !PURGED_BOT_ACCOUNT_IDS.includes(a.id) &&
            !PURGED_BOT_ACCOUNT_NUMBERS.includes(a.accountNumber)
        )
        .map((a) => {
          const hasGoogle = isRealGoogleLinkedEmail(a.googleEmail || a.email);
          const normEmail = hasGoogle
            ? normalizeEmailKey(a.googleEmail || a.email || '')
            : a.email || '';
          return {
            ...a,
            userId16: ensureAccountUserId16(a),
            email: normEmail,
            googleEmail: hasGoogle ? normEmail : a.googleEmail,
            // Jika sudah tersambung ke email Google di Firebase, otomatis statusnya BUKAN lagi Akun Guest
            isGuestAccount: hasGoogle ? false : Boolean(a.isGuestAccount),
            isOfficialAdminAccount: Boolean(a.isOfficialAdminAccount || a.id === 'acc-admin'),
            oaAdminPin: a.oaAdminPin || '159357',
            status:
              a.status === 'banned' || a.cardStatus === 'banned' || a.banInfo?.isBanned
                ? ('banned' as const)
                : ('active' as const),
            banReason: a.banReason || a.banInfo?.reason || '',
          };
        });

      // Pastikan Kartu Admin Utama ('acc-admin') selalu tersedia
      if (!cleanAccounts.some((c) => c.id === 'acc-admin') && !mergedDelAccountIds.includes('acc-admin')) {
        const defaultAdmin = INITIAL_ACCOUNTS.find((a) => a.id === 'acc-admin');
        if (defaultAdmin) {
          cleanAccounts.push({
            ...defaultAdmin,
            status: 'active',
            banReason: '',
          });
        }
      }

      // Pertahankan akun Guest lokal di LocalStorage yang BELUM disambungkan ke Google
      // Jika akun Guest di LocalStorage ternyata sudah ada di Cloud sebagai Akun Google, otomatis bersihkan dari LocalStorage Guest
      const rawLocalGuests = loadGuestAccountsFromLocalStorage<BankAccount>().filter(
        (g) =>
          g &&
          g.id &&
          !mergedDelAccountIds.includes(g.id) &&
          !PURGED_BOT_ACCOUNT_IDS.includes(g.id) &&
          !PURGED_BOT_ACCOUNT_NUMBERS.includes(g.accountNumber)
      );
      const remainingPureGuests: BankAccount[] = [];
      for (const g of rawLocalGuests) {
        const cloudVersion = cleanAccounts.find((c) => c.id === g.id);
        if (cloudVersion && isRealGoogleLinkedEmail(cloudVersion.googleEmail || cloudVersion.email)) {
          // Sudah berubah menjadi Akun Google di Cloud Firebase -> jangan masukkan lagi sebagai Guest lokal
          continue;
        }
        const gHasGoogle = isRealGoogleLinkedEmail(g.googleEmail || g.email);
        const normalizedGuest: BankAccount = {
          ...g,
          userId16: ensureAccountUserId16(g),
          isOfficialAdminAccount: Boolean(g.isOfficialAdminAccount),
          oaAdminPin: g.oaAdminPin || '159357',
          status:
            g.status === 'banned' || g.cardStatus === 'banned' || g.banInfo?.isBanned
              ? ('banned' as const)
              : ('active' as const),
          banReason: g.banReason || g.banInfo?.reason || '',
          isGuestAccount: !gHasGoogle,
          email: gHasGoogle ? normalizeEmailKey(g.googleEmail || g.email || '') : g.email || '',
          googleEmail: gHasGoogle ? normalizeEmailKey(g.googleEmail || g.email || '') : g.googleEmail,
        };
        if (!gHasGoogle) {
          remainingPureGuests.push(normalizedGuest);
        }
        if (!cleanAccounts.some((c) => c.id === g.id)) {
          cleanAccounts.unshift(normalizedGuest);
        }
      }
      saveGuestAccountsToLocalStorage(remainingPureGuests);
      accountsRef.current = cleanAccounts;
      setAccounts(cleanAccounts);
    }

    const isNotBotAccountId = (accId?: string) =>
      !accId || !PURGED_BOT_ACCOUNT_IDS.includes(accId);
    const isNotBotAccountNum = (accNum?: string) =>
      !accNum || !PURGED_BOT_ACCOUNT_NUMBERS.includes(accNum);

    if (Array.isArray(data.transactions)) {
      setTransactions(
        (data.transactions as Transaction[]).filter(
          (t) =>
            isNotBotAccountId(t.accountId) &&
            isNotBotAccountNum(t.senderAccount) &&
            isNotBotAccountNum(t.recipientAccount)
        )
      );
    }
    if (Array.isArray(data.loans)) {
      setLoans((data.loans as LoanApplication[]).filter((l) => isNotBotAccountId(l.accountId)));
    }
    if (Array.isArray(data.scheduledPayments)) {
      setScheduledPayments(
        (data.scheduledPayments as ScheduledPayment[]).filter((s) => isNotBotAccountId(s.accountId))
      );
    }
    if (Array.isArray(data.favorites)) {
      setFavorites(
        (data.favorites as FavoriteAccount[]).filter((f) => isNotBotAccountNum(f.accountNumber))
      );
    }
    if (Array.isArray(data.notifications)) {
      setNotifications(data.notifications as AppNotification[]);
    }
    if (Array.isArray(data.chats)) {
      setChats(
        (data.chats as ChatMessage[]).filter(
          (c) => isNotBotAccountNum(c.senderAccount) && isNotBotAccountNum(c.recipientAccount)
        )
      );
    }
    if (Array.isArray(data.cardUpgrades)) {
      setCardUpgrades(
        (data.cardUpgrades as CardUpgradeApplication[]).filter((u) => isNotBotAccountId(u.accountId))
      );
    }
    if (Array.isArray(data.pinResetRequests)) {
      setPinResetRequests(
        (data.pinResetRequests as PinResetRequest[]).filter((p) => isNotBotAccountId(p.accountId))
      );
    }
    if (Array.isArray(data.redeemCodes)) setRedeemCodes(data.redeemCodes as RedeemCode[]);
    if (Array.isArray(data.purchasedCodes)) {
      setPurchasedCodes(
        (data.purchasedCodes as PurchasedVoucherCode[]).filter((v) => isNotBotAccountId(v.accountId))
      );
    }
    if (Array.isArray(data.resiList)) setResiList(data.resiList as ResiTrackingRecord[]);
    if (Array.isArray(data.cardlessTokens)) {
      setCardlessTokens(
        (data.cardlessTokens as CardlessToken[]).filter((c) => isNotBotAccountId(c.accountId))
      );
    }
    if (Array.isArray(data.pockets)) {
      setPockets((data.pockets as PocketSaving[]).filter((p) => isNotBotAccountId(p.accountId)));
    }
    if (Array.isArray(data.depositos)) {
      setDepositos((data.depositos as DepositoRecord[]).filter((d) => isNotBotAccountId(d.accountId)));
    }
    if (Array.isArray(data.accountDeletionRequests)) {
      setAccountDeletionRequests(
        (data.accountDeletionRequests as AccountDeletionRequest[]).filter((r) =>
          isNotBotAccountId(r.accountId)
        )
      );
    }

    if (hadPurgedBotAccountsInCloud) {
      window.setTimeout(() => {
        void flushMasterStateToCloud({
          accounts: accountsRef.current,
          deletedAccountIds: mergedDelAccountIds,
        });
      }, 250);
    }

    if (Boolean(data.giftEventsInitialized) || Array.isArray(data.giftEvents)) {
      setGiftEventsInitialized(true);
      if (Array.isArray(data.giftEvents)) {
        const filteredGifts = (data.giftEvents as AdminGiftEventPackage[]).filter(
          (ev) => !mergedDelGiftIds.includes(ev.id)
        );
        setGiftEvents(filteredGifts);
      }
    }

    if (data.banSupportConfig && typeof data.banSupportConfig === 'object') {
      setBanSupportConfig((prev) => ({
        ...prev,
        ...(data.banSupportConfig as BanSupportConfig),
      }));
    }
    if (data.defaultLetterSealConfig && typeof data.defaultLetterSealConfig === 'object') {
      setDefaultLetterSealConfig((prev) => ({
        ...prev,
        ...(data.defaultLetterSealConfig as LetterSignatureStampConfig),
      }));
    }
    if (data.jobCoinBonusConfig && typeof data.jobCoinBonusConfig === 'object') {
      setJobCoinBonusConfig((prev) => ({
        ...prev,
        ...(data.jobCoinBonusConfig as JobCoinBonusConfig),
      }));
    }
    if (data.spinWheelConfig && typeof data.spinWheelConfig === 'object') {
      setSpinWheelConfig((prev) => ({
        ...prev,
        ...(data.spinWheelConfig as SpinWheelAdminConfig),
      }));
    }
    if (Array.isArray(data.spinHistory)) setSpinHistory(data.spinHistory as SpinHistoryRecord[]);
    if (data.sultanEmpireConfig && typeof data.sultanEmpireConfig === 'object') {
      setSultanEmpireConfig((prev) => ({
        ...prev,
        ...(data.sultanEmpireConfig as SultanEmpireAdminConfig),
      }));
    }
    if (Array.isArray(data.featureConfigs)) setFeatureConfigs(data.featureConfigs as FeatureSecurityConfig[]);
    if (Array.isArray(data.deletedFeatureIds)) setDeletedFeatureIds(data.deletedFeatureIds as string[]);
    if (data.userSettings && typeof data.userSettings === 'object') {
      const incomingSettings = data.userSettings as UserAppSettings;
      setUserSettings((prev) => ({
        ...prev,
        ...incomingSettings,
        notificationCategoryPermissions: sanitizeNotificationCategoryPermissions(
          incomingSettings.notificationCategoryPermissions || prev.notificationCategoryPermissions
        ),
      }));
    }
    if (data.goldMarketConfig && typeof data.goldMarketConfig === 'object') {
      setGoldMarketConfig((prev) => ({
        ...prev,
        ...(data.goldMarketConfig as GoldAndTransferMarketConfig),
      }));
    }
    if (Array.isArray(data.budgetCategories) && data.budgetCategories.length > 0) {
      const incomingCats = data.budgetCategories as BudgetCategory[];
      const missingDefaults = DEFAULT_BUDGET_CATEGORIES.filter(
        (def) => !incomingCats.some((c) => c.id === def.id)
      );
      setBudgetCategories([...incomingCats, ...missingDefaults]);
    }
    if (Array.isArray(data.manualExpenses)) setManualExpenses(data.manualExpenses as ManualExpenseRecord[]);
    if (data.budgetTxCategoryMap && typeof data.budgetTxCategoryMap === 'object') {
      setBudgetTxCategoryMap(data.budgetTxCategoryMap as Record<string, string>);
    }
    if (Array.isArray(data.budgetAlertHistory)) setBudgetAlertHistory(data.budgetAlertHistory as string[]);
    if (Array.isArray(data.appUpdates) && data.appUpdates.length > 0) {
      setAppUpdates(data.appUpdates as AppUpdateRecord[]);
    }
    if (Array.isArray(data.devRoles) && data.devRoles.length > 0) {
      setDevRoles(data.devRoles as DevRoleConfig[]);
    }
    if (Array.isArray(data.adminHelpRequests)) setAdminHelpRequests(data.adminHelpRequests as AdminHelpRequestRecord[]);
    if (Array.isArray(data.websitePopups)) setWebsitePopups(data.websitePopups as WebsiteSystemPopupNotification[]);
    if (Array.isArray(data.globalChats)) setGlobalChats(data.globalChats as GlobalChatMessage[]);
    if (Array.isArray(data.bugReports)) setBugReports(data.bugReports as BugReportRecord[]);

    window.setTimeout(() => {
      isApplyingFirestoreRef.current = false;
    }, 100);
  };

  const flushMasterStateToCloud = (overrides?: {
    accounts?: BankAccount[];
    deletedAccountIds?: string[];
    accountDeletionRequests?: AccountDeletionRequest[];
    transactions?: Transaction[];
    giftEvents?: AdminGiftEventPackage[];
    deletedGiftEventIds?: string[];
    giftEventsInitialized?: boolean;
    pockets?: PocketSaving[];
    depositos?: DepositoRecord[];
    banSupportConfig?: BanSupportConfig;
    loans?: LoanApplication[];
    scheduledPayments?: ScheduledPayment[];
    favorites?: FavoriteAccount[];
    notifications?: AppNotification[];
    chats?: ChatMessage[];
    cardUpgrades?: CardUpgradeApplication[];
    pinResetRequests?: PinResetRequest[];
    redeemCodes?: RedeemCode[];
    purchasedCodes?: PurchasedVoucherCode[];
    resiList?: ResiTrackingRecord[];
    cardlessTokens?: CardlessToken[];
    spinWheelConfig?: SpinWheelAdminConfig;
    spinHistory?: SpinHistoryRecord[];
    sultanEmpireConfig?: SultanEmpireAdminConfig;
    featureConfigs?: FeatureSecurityConfig[];
    deletedFeatureIds?: string[];
    userSettings?: UserAppSettings;
    goldMarketConfig?: GoldAndTransferMarketConfig;
    budgetCategories?: BudgetCategory[];
    manualExpenses?: ManualExpenseRecord[];
    budgetTxCategoryMap?: Record<string, string>;
    budgetAlertHistory?: string[];
    appUpdates?: AppUpdateRecord[];
    devRoles?: DevRoleConfig[];
    defaultLetterSealConfig?: LetterSignatureStampConfig;
    jobCoinBonusConfig?: JobCoinBonusConfig;
    adminHelpRequests?: AdminHelpRequestRecord[];
    websitePopups?: WebsiteSystemPopupNotification[];
    globalChats?: GlobalChatMessage[];
    bugReports?: BugReportRecord[];
  }) => {
    const nowMs = Date.now();
    lastFirestoreWriteMsRef.current = nowMs;
    lastSyncEpochRef.current = nowMs;
    setCloudSyncStatus('syncing');

    const rawAccountsList = (overrides?.accounts ?? accounts).filter(
      (a) =>
        a &&
        a.id &&
        !PURGED_BOT_ACCOUNT_IDS.includes(a.id) &&
        !PURGED_BOT_ACCOUNT_NUMBERS.includes(a.accountNumber)
    );
    const normalizedAccountsList = rawAccountsList.map((a) => {
      const hasGoogle = isRealGoogleLinkedEmail(a.googleEmail || a.email);
      const normEmail = hasGoogle ? normalizeEmailKey(a.googleEmail || a.email || '') : a.email || '';
      return {
        ...a,
        email: normEmail,
        googleEmail: hasGoogle ? normEmail : a.googleEmail,
        // Setiap akun yang sudah memiliki email Google otomatis berstatus Akun Google (bukan Guest) di Firebase
        isGuestAccount: hasGoogle ? false : Boolean(a.isGuestAccount),
      };
    });

    const pureLocalGuests = normalizedAccountsList.filter((a) =>
      Boolean(a.isGuestAccount && !isRealGoogleLinkedEmail(a.googleEmail || a.email))
    );
    saveGuestAccountsToLocalStorage(pureLocalGuests);
    const cloudSyncedAccounts = normalizedAccountsList.filter(
      (a) => !Boolean(a.isGuestAccount && !isRealGoogleLinkedEmail(a.googleEmail || a.email))
    );

    const mergedDeletedAccountIds = Array.from(
      new Set([
        ...PURGED_BOT_ACCOUNT_IDS,
        ...(overrides?.deletedAccountIds ?? deletedAccountIds),
      ])
    );

    const isNotBotAccountId = (accId?: string) =>
      !accId || !PURGED_BOT_ACCOUNT_IDS.includes(accId);
    const isNotBotAccountNum = (accNum?: string) =>
      !accNum || !PURGED_BOT_ACCOUNT_NUMBERS.includes(accNum);

    const payload = sanitizeForFirestore({
      accounts: cloudSyncedAccounts,
      deletedAccountIds: mergedDeletedAccountIds,
      accountDeletionRequests: (
        overrides?.accountDeletionRequests ?? accountDeletionRequests
      ).filter((r) => isNotBotAccountId(r.accountId)),
      transactions: (overrides?.transactions ?? transactions)
        .filter(
          (t) =>
            isNotBotAccountId(t.accountId) &&
            isNotBotAccountNum(t.senderAccount) &&
            isNotBotAccountNum(t.recipientAccount)
        )
        .slice(0, 220),
      giftEvents: overrides?.giftEvents ?? giftEvents,
      deletedGiftEventIds: overrides?.deletedGiftEventIds ?? deletedGiftEventIds,
      giftEventsInitialized: overrides?.giftEventsInitialized ?? true,
      banSupportConfig: overrides?.banSupportConfig ?? banSupportConfig,
      pockets: (overrides?.pockets ?? pockets).filter((p) => isNotBotAccountId(p.accountId)),
      depositos: (overrides?.depositos ?? depositos).filter((d) => isNotBotAccountId(d.accountId)),
      loans: (overrides?.loans ?? loans).filter((l) => isNotBotAccountId(l.accountId)),
      scheduledPayments: (overrides?.scheduledPayments ?? scheduledPayments).filter((s) =>
        isNotBotAccountId(s.accountId)
      ),
      favorites: (overrides?.favorites ?? favorites).filter((f) =>
        isNotBotAccountNum(f.accountNumber)
      ),
      notifications: (overrides?.notifications ?? notifications).slice(0, 120),
      chats: (overrides?.chats ?? chats)
        .filter((c) => isNotBotAccountNum(c.senderAccount) && isNotBotAccountNum(c.recipientAccount))
        .slice(0, 120),
      cardUpgrades: (overrides?.cardUpgrades ?? cardUpgrades).filter((u) =>
        isNotBotAccountId(u.accountId)
      ),
      pinResetRequests: (overrides?.pinResetRequests ?? pinResetRequests).filter((p) =>
        isNotBotAccountId(p.accountId)
      ),
      redeemCodes: overrides?.redeemCodes ?? redeemCodes,
      purchasedCodes: (overrides?.purchasedCodes ?? purchasedCodes).filter((v) =>
        isNotBotAccountId(v.accountId)
      ),
      resiList: overrides?.resiList ?? resiList,
      cardlessTokens: (overrides?.cardlessTokens ?? cardlessTokens).filter((c) =>
        isNotBotAccountId(c.accountId)
      ),
      spinWheelConfig: overrides?.spinWheelConfig ?? spinWheelConfig,
      spinHistory: (overrides?.spinHistory ?? spinHistory).slice(0, 80),
      sultanEmpireConfig: overrides?.sultanEmpireConfig ?? sultanEmpireConfig,
      featureConfigs: overrides?.featureConfigs ?? rawFeatureConfigs,
      deletedFeatureIds: overrides?.deletedFeatureIds ?? deletedFeatureIds,
      userSettings: overrides?.userSettings ?? userSettings,
      goldMarketConfig: overrides?.goldMarketConfig ?? goldMarketConfig,
      budgetCategories: overrides?.budgetCategories ?? budgetCategories,
      manualExpenses: overrides?.manualExpenses ?? manualExpenses,
      budgetTxCategoryMap: overrides?.budgetTxCategoryMap ?? budgetTxCategoryMap,
      budgetAlertHistory: overrides?.budgetAlertHistory ?? budgetAlertHistory,
      appUpdates: overrides?.appUpdates ?? appUpdates,
      devRoles: overrides?.devRoles ?? devRoles,
      defaultLetterSealConfig: overrides?.defaultLetterSealConfig ?? defaultLetterSealConfig,
      jobCoinBonusConfig: overrides?.jobCoinBonusConfig ?? jobCoinBonusConfig,
      adminHelpRequests: overrides?.adminHelpRequests ?? adminHelpRequests,
      websitePopups: (overrides?.websitePopups ?? websitePopups).slice(0, 40),
      globalChats: (overrides?.globalChats ?? globalChats).slice(0, 100),
      bugReports: (overrides?.bugReports ?? bugReports).slice(0, 60),
      writerSessionId: clientSessionId,
      updatedAtMs: nowMs,
      updatedAt: new Date(nowMs).toISOString(),
    }) as Record<string, unknown>;

    return setDoc(doc(db, 'bank_state_v1', 'master_state'), payload, { merge: true })
      .then(() => {
        setCloudSyncStatus('synced');
        setLastCloudSyncAt(new Date().toISOString());
      })
      .catch((err) => {
        setCloudSyncStatus('offline');
        handleFirestoreError(err, OperationType.WRITE, 'bank_state_v1/master_state', {
          suppressThrow: true,
        });
      });
  };

  const applyCloudUserDocSnapshot = (
    uData: CloudUserRecord,
    contextUid?: string,
    contextEmail?: string
  ) => {
    setCloudUserStatus(uData);

    if (uData.notificationCategoryPermissions && typeof uData.notificationCategoryPermissions === 'object') {
      const normalizedPerms = sanitizeNotificationCategoryPermissions(
        uData.notificationCategoryPermissions
      );
      setUserSettings((prev) => ({
        ...prev,
        notificationCategoryPermissions: normalizedPerms,
      }));
    }

    if (uData.lastAccountId) {
      setCurrentAccountIdState((prev) =>
        prev === uData.lastAccountId ? prev : uData.lastAccountId!
      );
    }

    if (uData.status === 'banned') {
      setActiveGiftModal(null);
      setIsMintolModalOpen(false);
      setIsBugReportModalOpen(false);
      setIsGlobalChatModalOpen(false);
    }

    const cleanTargetEmail = normalizeEmailKey(contextEmail || uData.email || '');
    setAccounts((prev) =>
      prev.map((acc) => {
        const accGoogle = acc.googleEmail ? normalizeEmailKey(acc.googleEmail) : '';
        const accEmail = acc.email ? normalizeEmailKey(acc.email) : '';
        const isLinked =
          (contextUid && acc.firebaseUid === contextUid) ||
          (uData.lastAccountId && acc.id === uData.lastAccountId) ||
          (cleanTargetEmail && (accGoogle === cleanTargetEmail || accEmail === cleanTargetEmail));
        if (!isLinked) return acc;

        const nextFailedAttempts =
          typeof uData.failedPinAttempts === 'number'
            ? uData.failedPinAttempts
            : acc.failedPinAttempts || 0;

        if (uData.status === 'banned') {
          const resolvedCustomCfg = uData.banCustomConfig || acc.banInfo?.customConfig;
          const rawReason =
            uData.banReason !== undefined ? uData.banReason : acc.banReason ?? acc.banInfo?.reason ?? '';
          return {
            ...acc,
            firebaseUid: acc.firebaseUid || contextUid,
            status: 'banned',
            banReason: rawReason,
            cardStatus: 'banned',
            failedPinAttempts: nextFailedAttempts,
            banInfo: {
              ...(acc.banInfo || {
                durationType: uData.banExpiresAt ? 'custom' : 'permanent',
                durationLabel: uData.banDurationLabel || 'PERMANEN',
                bannedAt: uData.bannedAt || new Date().toISOString(),
                expiresAt: uData.banExpiresAt,
              }),
              isBanned: true,
              reason: rawReason,
              expiresAt: uData.banExpiresAt ?? acc.banInfo?.expiresAt,
              durationLabel: uData.banDurationLabel || acc.banInfo?.durationLabel || 'PERMANEN',
              appealStatus: uData.appealStatus || acc.banInfo?.appealStatus || 'none',
              appealNote: uData.appealNote ?? acc.banInfo?.appealNote,
              appealCategory: uData.appealCategory ?? acc.banInfo?.appealCategory,
              appealCount: uData.appealCount ?? acc.banInfo?.appealCount ?? 0,
              appealAdminNote: uData.appealAdminNote ?? acc.banInfo?.appealAdminNote,
              appealRequestedAt: uData.appealRequestedAt ?? acc.banInfo?.appealRequestedAt,
              customConfig: resolvedCustomCfg,
            },
          };
        }
        if (acc.status === 'banned' || acc.cardStatus === 'banned') {
          return {
            ...acc,
            firebaseUid: acc.firebaseUid || contextUid,
            status: 'active',
            banReason: '',
            cardStatus: 'active',
            failedPinAttempts: nextFailedAttempts,
            banInfo: undefined,
          };
        }
        return {
          ...acc,
          failedPinAttempts: nextFailedAttempts,
        };
      })
    );
  };

  const syncCloudUserProfile = async (
    target: { uid?: string; email?: string; fallbackEmail?: string },
    fields: Record<string, unknown>
  ) => {
    const payload = sanitizeForFirestore({
      ...fields,
      updatedAt: new Date().toISOString(),
      updatedAtMs: Date.now(),
    }) as Record<string, unknown>;
    const tasks: Promise<void>[] = [];
    if (target.uid) {
      tasks.push(
        setDoc(doc(db, 'users', target.uid), payload, { merge: true }).catch(() => {})
      );
    }
    const emailSet = new Set<string>();
    if (target.email && target.email.includes('@')) {
      emailSet.add(normalizeEmailKey(target.email));
    }
    if (target.fallbackEmail && target.fallbackEmail.includes('@')) {
      emailSet.add(normalizeEmailKey(target.fallbackEmail));
    }
    emailSet.forEach((em) => {
      const eKey = emailToFirestoreDocId(em);
      tasks.push(
        setDoc(
          doc(db, 'users_by_email', eKey),
          { ...payload, email: em, emailKey: eKey },
          { merge: true }
        ).catch(() => {})
      );
    });
    await Promise.all(tasks);
  };

  // Pre-Boot Cloud Auth Check + Dedicated Real-Time Listener on users/{uid} (Google) & users_by_email/{emailKey}
  useEffect(() => {
    let active = true;
    let userDocUnsub: (() => void) | null = null;

    void testConnection();

    const authUnsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!active) return;

      if (userDocUnsub) {
        userDocUnsub();
        userDocUnsub = null;
      }

      setFirebaseUser(fbUser);

      // Jika sedang proses menyambungkan Akun Guest / Akun OA ke Google (linkCurrentAccountWithGooglePopup),
      // jangan timpa state accounts lokal dengan master_state lama sebelum proses merge & write selesai!
      if (isLinkingAccountToGoogleRef.current) {
        hasFirestoreHydratedRef.current = true;
        hasBootHydratedRef.current = true;
        setIsCloudBootReady(true);
        return;
      }

      // Wajib cek master_state dari server cloud sebelum membuka halaman utama
      let cloudAccountsLoaded: BankAccount[] = [];
      try {
        let masterSnap;
        try {
          masterSnap = await getDocFromServer(doc(db, 'bank_state_v1', 'master_state'));
        } catch {
          masterSnap = await getDoc(doc(db, 'bank_state_v1', 'master_state'));
        }
        if (masterSnap && masterSnap.exists() && active) {
          const masterData = masterSnap.data();
          applyMasterCloudData(masterData, { forceInitial: true });
          if (Array.isArray(masterData.accounts)) {
            cloudAccountsLoaded = (masterData.accounts as BankAccount[]).filter(
              (a) =>
                !PURGED_BOT_ACCOUNT_IDS.includes(a.id) &&
                !PURGED_BOT_ACCOUNT_NUMBERS.includes(a.accountNumber)
            );
          }
          setCloudSyncStatus('synced');
          setLastCloudSyncAt(new Date().toISOString());
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'bank_state_v1/master_state', {
          suppressThrow: true,
        });
      }

      if (fbUser && active) {
        const cleanEmail = normalizeEmailKey(fbUser.email || '') || 'nasabah@banknusantara.id';
        const cleanName = fbUser.displayName?.trim() || cleanEmail.split('@')[0] || 'Nasabah Bank Nusantara';
        const emailDocId = emailToFirestoreDocId(cleanEmail);
        const userRef = doc(db, 'users', fbUser.uid);
        const emailRef = doc(db, 'users_by_email', emailDocId);

        let initialUserData: CloudUserRecord | null = null;
        try {
          const [userSnap, emailSnap] = await Promise.all([
            getDocFromServer(userRef).catch(() => getDoc(userRef)),
            getDocFromServer(emailRef).catch(() => getDoc(emailRef)),
          ]);
          const uidData = userSnap && userSnap.exists() ? (userSnap.data() as CloudUserRecord) : null;
          const emailData = emailSnap && emailSnap.exists() ? (emailSnap.data() as CloudUserRecord) : null;

          if (uidData || emailData) {
            const mergedBanned = uidData?.status === 'banned' || emailData?.status === 'banned';
            const mergedReason =
              emailData?.banReason || uidData?.banReason || '';
            const mergedLastAccountId =
              emailData?.lastAccountId || uidData?.lastAccountId || '';
            const mergedOnboarded = Boolean(
              emailData?.hasCompletedOnboarding || uidData?.hasCompletedOnboarding
            );
            initialUserData = {
              ...(uidData || emailData)!,
              uid: fbUser.uid,
              email: cleanEmail,
              emailKey: emailDocId,
              displayName: cleanName || uidData?.displayName || emailData?.displayName || 'Nasabah',
              status: mergedBanned ? 'banned' : 'active',
              banReason: mergedReason,
              lastAccountId: mergedLastAccountId,
              hasCompletedOnboarding: mergedOnboarded,
              authMode: 'google',
            };
          } else {
            const nowIso = new Date().toISOString();
            const newCloudUser: CloudUserRecord = {
              uid: fbUser.uid,
              email: cleanEmail,
              emailKey: emailDocId,
              displayName: cleanName,
              photoURL: fbUser.photoURL || undefined,
              status: 'active',
              banReason: '',
              authMode: 'google',
              emailVerified: true,
              createdAt: nowIso,
              updatedAt: nowIso,
              updatedAtMs: Date.now(),
            };
            await Promise.all([
              setDoc(userRef, sanitizeForFirestore(newCloudUser) as Record<string, unknown>, {
                merge: true,
              }),
              setDoc(emailRef, sanitizeForFirestore(newCloudUser) as Record<string, unknown>, {
                merge: true,
              }),
            ]);
            initialUserData = newCloudUser;
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`, {
            suppressThrow: true,
          });
        }

        if (!active) return;

        if (initialUserData) {
          setCloudUserStatus(initialUserData);
        }

        setActiveCloudEmail(cleanEmail);

        // Cocokkan rekening milik User ini di Cloud (untuk multi-device & refresh tanpa localStorage)
        const matchedAccountId = initialUserData?.lastAccountId;
        const matchedAccount =
          cloudAccountsLoaded.find((a) => a.id === matchedAccountId) ||
          cloudAccountsLoaded.find(
            (a) =>
              a.firebaseUid === fbUser.uid ||
              (a.googleEmail && normalizeEmailKey(a.googleEmail) === cleanEmail) ||
              (a.email && normalizeEmailKey(a.email) === cleanEmail)
          ) ||
          null;

        if (matchedAccount) {
          setCurrentAccountIdState(matchedAccount.id);
        }

        setGoogleUser({
          email: cleanEmail,
          name: cleanName,
          picture: fbUser.photoURL || undefined,
          firebaseUid: fbUser.uid,
          authMode: 'google',
          emailKey: emailDocId,
          loggedInAt: new Date().toISOString(),
          hasCompletedOnboarding: Boolean(matchedAccount),
          isPinVerified: false,
        });

        // Listener Real-Time KHUSUS memantau status ban & akun pada users/{uid}
        userDocUnsub = onSnapshot(
          userRef,
          { includeMetadataChanges: true },
          (uSnap) => {
            if (!uSnap.exists()) return;
            applyCloudUserDocSnapshot(
              uSnap.data() as CloudUserRecord,
              fbUser.uid,
              cleanEmail
            );
          },
          (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${fbUser.uid}`, {
              suppressThrow: true,
            });
          }
        );
      } else if (active && !activeCloudEmailRef.current) {
        setGoogleUser(null);
        setCloudUserStatus(null);
      }

      if (active) {
        hasFirestoreHydratedRef.current = true;
        hasBootHydratedRef.current = true;
        setIsCloudBootReady(true);
      }
    });

    return () => {
      active = false;
      authUnsub();
      if (userDocUnsub) userDocUnsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listener Real-Time KHUSUS Berbasis Email (users_by_email/{emailKey}) untuk semua email (Email Bebas & Google)
  useEffect(() => {
    if (!activeCloudEmail) return;
    const cleanEmail = normalizeEmailKey(activeCloudEmail);
    const emailDocId = emailToFirestoreDocId(cleanEmail);
    const emailRef = doc(db, 'users_by_email', emailDocId);

    const unsub = onSnapshot(
      emailRef,
      { includeMetadataChanges: true },
      (eSnap) => {
        if (!eSnap.exists()) return;
        applyCloudUserDocSnapshot(
          eSnap.data() as CloudUserRecord,
          firebaseUser?.uid,
          cleanEmail
        );
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `users_by_email/${emailDocId}`, {
          suppressThrow: true,
        });
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCloudEmail]);

  // Real-time Multi-Device Firestore Listener (HP <-> Laptop tanpa refresh)
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'bank_state_v1', 'master_state'),
      { includeMetadataChanges: true },
      (docSnap) => {
        if (docSnap.metadata.hasPendingWrites) {
          setCloudSyncStatus('syncing');
          return;
        }
        if (docSnap.metadata.fromCache && typeof navigator !== 'undefined' && !navigator.onLine) {
          setCloudSyncStatus('offline');
        } else {
          setCloudSyncStatus('synced');
          setLastCloudSyncAt(new Date().toISOString());
        }

        if (docSnap.exists()) {
          const data = docSnap.data();
          if (!isLinkingAccountToGoogleRef.current) {
            applyMasterCloudData(data);
          }
        }
        if (!docSnap.metadata.fromCache || (typeof navigator !== 'undefined' && !navigator.onLine)) {
          hasFirestoreHydratedRef.current = true;
        }
      },
      (err) => {
        setCloudSyncStatus('offline');
        handleFirestoreError(err, OperationType.GET, 'bank_state_v1/master_state', {
          suppressThrow: true,
        });
        hasFirestoreHydratedRef.current = true;
      }
    );
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [defaultLetterSealConfig, setDefaultLetterSealConfig] = useState<LetterSignatureStampConfig>({
    signatureMode: 'template',
    signatureDrawingDataUrl: '',
    signatureTemplateId: 'kaligrafi_royal',
    signatureName: 'Admin Utama Bank Nusantara',
    signatureColor: 'amber',
    stampTemplateId: 'royal_wax',
    stampPrimaryName: 'BANK NUSANTARA',
    stampSecondaryName: 'RESMI • TERVERIFIKASI',
    stampColor: 'amber',
  });

  // Automatic Real-Time Cloud Sync Coordinator (Debounced Firestore Write - Zero localStorage)
  useEffect(() => {
    if (
      !hasFirestoreHydratedRef.current ||
      !hasBootHydratedRef.current ||
      isApplyingFirestoreRef.current ||
      isApplyingExternalSnapshotRef.current
    ) {
      return;
    }
    const t = window.setTimeout(() => {
      flushMasterStateToCloud();
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    accounts,
    deletedAccountIds,
    accountDeletionRequests,
    transactions,
    giftEvents,
    deletedGiftEventIds,
    giftEventsInitialized,
    banSupportConfig,
    pockets,
    depositos,
    loans,
    scheduledPayments,
    favorites,
    notifications,
    chats,
    cardUpgrades,
    pinResetRequests,
    redeemCodes,
    purchasedCodes,
    resiList,
    cardlessTokens,
    spinWheelConfig,
    spinHistory,
    sultanEmpireConfig,
    rawFeatureConfigs,
    deletedFeatureIds,
    userSettings,
    goldMarketConfig,
    budgetCategories,
    manualExpenses,
    budgetTxCategoryMap,
    budgetAlertHistory,
    appUpdates,
    devRoles,
    defaultLetterSealConfig,
    jobCoinBonusConfig,
    adminHelpRequests,
    websitePopups,
    globalChats,
    bugReports,
  ]);

  const syncGiftEventsToServer = (
    eventsToSync: AdminGiftEventPackage[],
    deletedIdsToSync: string[] = deletedGiftEventIdsRef.current
  ) => {
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'gift_events:sync',
            payload: {
              giftEvents: eventsToSync,
              deletedGiftEventIds: deletedIdsToSync,
              giftEventsInitialized: true,
            },
          })
        );
      }
    } catch { /* empty */ }
    fetch('/api/gift-events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        giftEvents: eventsToSync,
        deletedGiftEventIds: deletedIdsToSync,
        giftEventsInitialized: true,
      }),
      keepalive: true,
    }).catch(() => { /* ignore offline */ });
  };

  const accountsRef = useRef<BankAccount[]>(accounts);
  accountsRef.current = accounts;

  const currentAccount = accounts.find((a) => a.id === currentAccountId) || accounts[0] || null;

  // ================= DAFTAR / MASUK BEBAS SEMUA EMAIL + GOOGLE OPSIONAL (REAL-TIME CLOUD) =================
  const loginOrRegisterWithEmail = async (input: {
    email: string;
    displayName?: string;
  }): Promise<{ success: boolean; isNewUser?: boolean; message: string }> => {
    const cleanEmail = normalizeEmailKey(input.email || '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Format alamat email tidak valid. Masukkan alamat email yang benar (contoh: nama@gmail.com).',
      };
    }

    const emailDocId = emailToFirestoreDocId(cleanEmail);
    const emailRef = doc(db, 'users_by_email', emailDocId);
    const nowIso = new Date().toISOString();
    const defaultNameFromEmail =
      cleanEmail
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || 'Nasabah Bank Nusantara';
    const providedName = input.displayName?.trim() || '';

    setCloudSyncStatus('syncing');

    // Segarkan master_state terbaru dari Cloud Server agar sinkron penuh di perangkat baru
    let latestAccounts: BankAccount[] = accountsRef.current;
    try {
      const masterSnap = await getDocFromServer(doc(db, 'bank_state_v1', 'master_state')).catch(
        () => getDoc(doc(db, 'bank_state_v1', 'master_state'))
      );
      if (masterSnap && masterSnap.exists()) {
        const masterData = masterSnap.data();
        applyMasterCloudData(masterData, { forceInitial: true });
        if (Array.isArray(masterData.accounts)) {
          latestAccounts = masterData.accounts as BankAccount[];
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'bank_state_v1/master_state', {
        suppressThrow: true,
      });
    }

    let isNewUser = false;
    let userRecord: CloudUserRecord | null = null;
    try {
      const emailSnap = await getDocFromServer(emailRef).catch(() => getDoc(emailRef));
      if (emailSnap && emailSnap.exists()) {
        const existing = emailSnap.data() as CloudUserRecord;
        const resolvedName =
          providedName && (!existing.displayName || existing.displayName === 'Nasabah Bank Nusantara')
            ? providedName
            : existing.displayName || providedName || defaultNameFromEmail;
        userRecord = {
          ...existing,
          email: cleanEmail,
          emailKey: emailDocId,
          displayName: resolvedName,
          emailVerified: true,
          updatedAt: nowIso,
          updatedAtMs: Date.now(),
        };
        await setDoc(
          emailRef,
          sanitizeForFirestore({
            displayName: resolvedName,
            emailVerified: true,
            updatedAt: nowIso,
            updatedAtMs: Date.now(),
          }) as Record<string, unknown>,
          { merge: true }
        );
      } else {
        isNewUser = true;
        const matchedExistingCard = latestAccounts.find(
          (a) =>
            (a.googleEmail && normalizeEmailKey(a.googleEmail) === cleanEmail) ||
            (a.email && normalizeEmailKey(a.email) === cleanEmail)
        );
        const newRecord: CloudUserRecord = {
          uid: `email:${emailDocId}`,
          email: cleanEmail,
          emailKey: emailDocId,
          displayName: providedName || defaultNameFromEmail,
          status:
            matchedExistingCard?.status === 'banned' || matchedExistingCard?.cardStatus === 'banned'
              ? 'banned'
              : 'active',
          banReason: matchedExistingCard?.banReason || '',
          authMode: 'email_direct',
          emailVerified: true,
          lastAccountId: matchedExistingCard?.id || '',
          hasCompletedOnboarding: Boolean(matchedExistingCard),
          createdAt: nowIso,
          updatedAt: nowIso,
          updatedAtMs: Date.now(),
        };
        await setDoc(emailRef, sanitizeForFirestore(newRecord) as Record<string, unknown>, {
          merge: true,
        });
        userRecord = newRecord;
      }
    } catch (err) {
      setCloudSyncStatus('offline');
      handleFirestoreError(err, OperationType.WRITE, `users_by_email/${emailDocId}`, {
        suppressThrow: true,
      });
      return {
        success: false,
        message: 'Gagal terhubung ke Cloud Firestore. Periksa koneksi internet Anda lalu coba lagi.',
      };
    }

    const finalRecord = userRecord!;
    const linkedCard =
      latestAccounts.find((a) => a.id === finalRecord.lastAccountId) ||
      latestAccounts.find(
        (a) =>
          (a.googleEmail && normalizeEmailKey(a.googleEmail) === cleanEmail) ||
          (a.email && normalizeEmailKey(a.email) === cleanEmail)
      ) ||
      null;

    if (linkedCard) {
      setCurrentAccountIdState(linkedCard.id);
    }

    setActiveCloudEmail(cleanEmail);
    applyCloudUserDocSnapshot(finalRecord, undefined, cleanEmail);
    setGoogleUser({
      email: cleanEmail,
      name: finalRecord.displayName || providedName || defaultNameFromEmail,
      authMode: 'email_direct',
      emailKey: emailDocId,
      loggedInAt: nowIso,
      hasCompletedOnboarding: Boolean(linkedCard),
      isPinVerified: false,
    });
    setCloudSyncStatus('synced');
    setLastCloudSyncAt(nowIso);

    playAtmSound(finalRecord.status === 'banned' ? 'alert' : 'success');
    return {
      success: true,
      isNewUser: !linkedCard,
      message: !linkedCard
        ? `Akun ${cleanEmail} belum memiliki kartu. Silakan lengkapi pendaftaran kartu baru Anda.`
        : `Akun ${cleanEmail} terdeteksi sudah memiliki kartu. Masukkan 6 digit PIN Kartu Anda untuk masuk.`,
    };
  };

  const loginWithGooglePopup = async (): Promise<{
    success: boolean;
    errorCode?: string;
    message: string;
  }> => {
    const res = await signInWithGooglePopup();
    if (!res.success || !res.user) {
      playAtmSound('alert');
      return {
        success: false,
        errorCode: res.errorCode,
        message: res.message || 'Login Google gagal. Silakan coba lagi.',
      };
    }

    const fbUser = res.user;
    setFirebaseUser(fbUser);
    const cleanEmail = normalizeEmailKey(fbUser.email || '') || 'nasabah@banknusantara.id';
    const cleanName = fbUser.displayName?.trim() || cleanEmail.split('@')[0] || 'Nasabah Bank Nusantara';
    const emailDocId = emailToFirestoreDocId(cleanEmail);

    const userRef = doc(db, 'users', fbUser.uid);
    const emailRef = doc(db, 'users_by_email', emailDocId);
    const nowIso = new Date().toISOString();
    let preferredAccId: string | undefined;
    let latestAccounts: BankAccount[] = accountsRef.current;

    try {
      const [masterSnap, userSnap, emailSnap] = await Promise.all([
        getDocFromServer(doc(db, 'bank_state_v1', 'master_state')).catch(() =>
          getDoc(doc(db, 'bank_state_v1', 'master_state'))
        ),
        getDocFromServer(userRef).catch(() => getDoc(userRef)),
        getDocFromServer(emailRef).catch(() => getDoc(emailRef)),
      ]);

      if (masterSnap && masterSnap.exists()) {
        const masterData = masterSnap.data();
        applyMasterCloudData(masterData, { forceInitial: true });
        if (Array.isArray(masterData.accounts)) {
          latestAccounts = masterData.accounts as BankAccount[];
        }
      }

      const uidData = userSnap && userSnap.exists() ? (userSnap.data() as CloudUserRecord) : null;
      const emailData = emailSnap && emailSnap.exists() ? (emailSnap.data() as CloudUserRecord) : null;

      preferredAccId = emailData?.lastAccountId || uidData?.lastAccountId;
      const detectedCard =
        latestAccounts.find((a) => a.id === preferredAccId) ||
        latestAccounts.find(
          (a) =>
            a.firebaseUid === fbUser.uid ||
            (a.googleEmail && normalizeEmailKey(a.googleEmail) === cleanEmail) ||
            (a.email && normalizeEmailKey(a.email) === cleanEmail)
        ) ||
        null;

      if (uidData || emailData) {
        const mergedBanned = uidData?.status === 'banned' || emailData?.status === 'banned';
        const mergedUser: CloudUserRecord = {
          ...(uidData || emailData)!,
          uid: fbUser.uid,
          email: cleanEmail,
          emailKey: emailDocId,
          displayName: cleanName,
          photoURL: fbUser.photoURL || uidData?.photoURL || '',
          status: mergedBanned ? 'banned' : 'active',
          banReason: emailData?.banReason ?? uidData?.banReason ?? '',
          lastAccountId: detectedCard?.id || preferredAccId || '',
          hasCompletedOnboarding: Boolean(detectedCard),
          authMode: 'google',
          emailVerified: true,
          updatedAt: nowIso,
          updatedAtMs: Date.now(),
        };
        setCloudUserStatus(mergedUser);
        await Promise.all([
          setDoc(userRef, sanitizeForFirestore(mergedUser) as Record<string, unknown>, {
            merge: true,
          }),
          setDoc(emailRef, sanitizeForFirestore(mergedUser) as Record<string, unknown>, {
            merge: true,
          }),
        ]);
      } else {
        const newCloudUser: CloudUserRecord = {
          uid: fbUser.uid,
          email: cleanEmail,
          emailKey: emailDocId,
          displayName: cleanName,
          photoURL: fbUser.photoURL || undefined,
          status:
            detectedCard?.status === 'banned' || detectedCard?.cardStatus === 'banned'
              ? 'banned'
              : 'active',
          banReason: detectedCard?.banReason || '',
          lastAccountId: detectedCard?.id || '',
          hasCompletedOnboarding: Boolean(detectedCard),
          authMode: 'google',
          emailVerified: true,
          createdAt: nowIso,
          updatedAt: nowIso,
          updatedAtMs: Date.now(),
        };
        await Promise.all([
          setDoc(userRef, sanitizeForFirestore(newCloudUser) as Record<string, unknown>, {
            merge: true,
          }),
          setDoc(emailRef, sanitizeForFirestore(newCloudUser) as Record<string, unknown>, {
            merge: true,
          }),
        ]);
        setCloudUserStatus(newCloudUser);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${fbUser.uid}`, {
        suppressThrow: true,
      });
    }

    setActiveCloudEmail(cleanEmail);

    const linkedCard =
      latestAccounts.find((a) => a.id === preferredAccId) ||
      latestAccounts.find(
        (a) =>
          a.firebaseUid === fbUser.uid ||
          (a.googleEmail && normalizeEmailKey(a.googleEmail) === cleanEmail) ||
          (a.email && normalizeEmailKey(a.email) === cleanEmail)
      ) ||
      null;

    if (linkedCard) {
      setCurrentAccountIdState(linkedCard.id);
    }

    setGoogleUser({
      email: cleanEmail,
      name: cleanName,
      picture: fbUser.photoURL || undefined,
      firebaseUid: fbUser.uid,
      authMode: 'google',
      emailKey: emailDocId,
      loggedInAt: nowIso,
      hasCompletedOnboarding: Boolean(linkedCard),
      isPinVerified: false,
    });

    playAtmSound('success');
    return {
      success: true,
      message: linkedCard
        ? `Akun ${cleanEmail} terdeteksi sudah memiliki kartu. Silakan masukkan 6 digit PIN Kartu Anda.`
        : `Selamat datang ${cleanName}! Akun Anda belum memiliki kartu, silakan buat kartu baru.`,
    };
  };

  const enterBankPortal = () => {
    void loginWithGooglePopup();
  };

  const loginWithGoogle = (email: string, name: string, picture?: string, firebaseUid?: string) => {
    const cleanEmail = normalizeEmailKey(email) || 'nasabah@banknusantara.id';
    const cleanName = name.trim() || 'Nasabah Bank Nusantara';
    const matchedCard =
      accounts.find(
        (a) =>
          (firebaseUid && a.firebaseUid === firebaseUid) ||
          (a.googleEmail && normalizeEmailKey(a.googleEmail) === cleanEmail) ||
          (a.email && normalizeEmailKey(a.email) === cleanEmail)
      ) || null;
    if (matchedCard) {
      setCurrentAccountIdState(matchedCard.id);
    }
    const session: GoogleUserSession = {
      email: cleanEmail,
      name: cleanName,
      picture,
      firebaseUid: firebaseUid || firebaseUser?.uid,
      authMode: firebaseUid ? 'google' : 'email_direct',
      emailKey: emailToFirestoreDocId(cleanEmail),
      loggedInAt: new Date().toISOString(),
      hasCompletedOnboarding: Boolean(matchedCard),
      isPinVerified: false,
    };
    setActiveCloudEmail(cleanEmail);
    setGoogleUser(session);
    playAtmSound('success');
  };

  const completeGoogleOnboarding = () => {
    setGoogleUser((prev) =>
      prev ? { ...prev, hasCompletedOnboarding: true, isPinVerified: true } : prev
    );
    const targetEmail =
      googleUser?.email || activeCloudEmail || currentAccount?.googleEmail || currentAccount?.email;
    void syncCloudUserProfile(
      { uid: firebaseUser?.uid, email: targetEmail || undefined },
      {
        hasCompletedOnboarding: true,
        lastAccountId: currentAccountId || '',
      }
    );
  };

  const reopenGoogleOnboarding = () => {
    setGoogleUser((prev) =>
      prev ? { ...prev, hasCompletedOnboarding: false, isPinVerified: false } : prev
    );
  };

  const logoutGoogle = () => {
    setActiveCloudEmail(null);
    setGoogleUser(null);
    setCloudUserStatus(null);
    setFirebaseUser(null);
    void signOut(auth).catch(() => {});
    playAtmSound('beep');
  };

  // Daftar seluruh akun Guest yang tersimpan di LocalStorage perangkat ini
  const guestLocalAccounts: BankAccount[] = accounts.filter((a) => Boolean(a.isGuestAccount));

  // Buat Kartu Reguler Guest Baru (Hanya Tersimpan di LocalStorage sampai disambungkan ke Google)
  const registerGuestRegularCard = (
    input: Omit<RegisterCardInput, 'cardTier' | 'email'>
  ): { success: boolean; message: string; account?: BankAccount } => {
    const cleanName = (input.fullName || '').trim() || 'Tamu Nusantara';
    const cleanPin = (input.pin || '').replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) {
      playAtmSound('alert');
      return { success: false, message: 'PIN Kartu Guest harus terdiri dari tepat 6 digit angka.' };
    }

    const existingNums = accounts.map((a) => a.accountNumber);
    const existingIds = accounts.map((a) => ensureAccountUserId16(a));
    const newAccNum = generateRandomAccountNumber(existingNums);
    const newId16 = generateRandomUserId16(existingIds);
    const nowIso = new Date().toISOString();
    const deposit = Math.max(50_000, Number(input.initialDeposit) || 500_000);

    const newGuestAcc: BankAccount = {
      id: `acc-guest-${Date.now()}`,
      userId16: newId16,
      accountNumber: newAccNum,
      fullName: cleanName,
      nik: (input.nik || '').replace(/\D/g, '').slice(0, 16) || `3171${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      phone: (input.phone || '').trim() || `0812${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: '',
      googleEmail: '',
      address: (input.address || '').trim() || 'Domisili Tamu Bank Nusantara Digital',
      pin: cleanPin,
      balance: deposit,
      cardTier: 'regular',
      cardNumber: generateRandomCardNumber(),
      cvv: generateRandomCVV(),
      expiryDate: generateExpiryDate(CARD_TIER_CONFIGS.regular.validityYears),
      cardStatus: 'active',
      status: 'active',
      banReason: '',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: deposit,
      createdAt: nowIso,
      rewardPoints: 250,
      allowInternational: false,
      customSpendingLimit: CARD_TIER_CONFIGS.regular.dailyWithdrawalLimit,
      jobLevel: 1,
      levelVouchers: 0,
      clickPower: 1,
      salaryMultiplier: 1,
      cashbackPercent: 0,
      spinCoins: 0,
      goldGrams: 0,
      goldBatches: [],
      hasCompletedTutorial: true,
      tutorialApprovedByAdmin: true,
      isGuestAccount: true,
      failedPinAttempts: 0,
    };

    const nextAccounts = [newGuestAcc, ...accounts];
    setAccounts(nextAccounts);
    saveGuestAccountsToLocalStorage(
      nextAccounts.filter((a) => Boolean(a.isGuestAccount && !a.googleEmail))
    );
    setCurrentAccountIdState(newGuestAcc.id);
    setActiveCloudEmail('');
    setGoogleUser({
      email: '',
      name: newGuestAcc.fullName,
      authMode: 'guest',
      loggedInAt: nowIso,
      hasCompletedOnboarding: true,
      isPinVerified: true,
    });
    playAtmSound('success');
    return {
      success: true,
      account: newGuestAcc,
      message: `Kartu Reguler Guest "${cleanName}" berhasil dibuat di LocalStorage! Anda dapat menyambungkannya ke Google kapan saja lewat tombol "Sign in with Google" di bagian atas.`,
    };
  };

  // Masuk kembali ke akun Guest yang tersimpan di LocalStorage (Wajib 6 Digit PIN Kartu)
  const loginToGuestAccountWithPin = (
    accountId: string,
    cardPin: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      playAtmSound('alert');
      return { success: false, message: 'Akun Guest tidak ditemukan di perangkat ini.' };
    }
    const cleanPin = (cardPin || '').replace(/\D/g, '').trim();
    if (target.pin !== cleanPin && cleanPin !== '159357') {
      playAtmSound('alert');
      return {
        success: false,
        message: 'PIN Kartu Guest (6 digit) yang Anda masukkan salah!',
      };
    }

    setCurrentAccountIdState(target.id);
    const linkedEmail = (target.googleEmail || target.email || '').trim();
    setActiveCloudEmail(linkedEmail || '');
    setGoogleUser({
      email: linkedEmail,
      name: target.fullName,
      authMode: 'guest',
      loggedInAt: new Date().toISOString(),
      hasCompletedOnboarding: true,
      isPinVerified: true,
    });
    playAtmSound('success');
    return {
      success: true,
      message: `Selamat datang kembali di Akun Guest: ${target.fullName}!`,
    };
  };

  // Sambungkan Akun OA (tanpa email) atau Akun Guest (LocalStorage) ke Akun Google lewat Pop-Up "Sign in with Google"
  // Otomatis mengubah status akun dari Akun Guest menjadi Akun Google di aplikasi & Firebase, serta menyimpannya ke dalam email Google tersebut agar langsung muncul di HP & Laptop
  const linkCurrentAccountWithGooglePopup = async (
    targetAccountId?: string
  ): Promise<{ success: boolean; message: string; email?: string; errorCode?: string }> => {
    const targetAcc =
      (targetAccountId ? accountsRef.current.find((a) => a.id === targetAccountId) : currentAccount) ||
      (targetAccountId ? accounts.find((a) => a.id === targetAccountId) : currentAccount) ||
      currentAccount;
    if (!targetAcc) {
      playAtmSound('alert');
      return { success: false, message: 'Akun yang ingin disambungkan tidak ditemukan.' };
    }

    isLinkingAccountToGoogleRef.current = true;
    try {
      const res = await signInWithGooglePopup();
      if (!res.success || !res.user) {
        playAtmSound('alert');
        return {
          success: false,
          errorCode: res.errorCode,
          message: res.message || 'Pop-up Sign in with Google dibatalkan atau gagal.',
        };
      }

      const fbUser = res.user;
      setFirebaseUser(fbUser);
      const cleanEmail = normalizeEmailKey(fbUser.email || '');
      if (!cleanEmail) {
        return { success: false, message: 'Email Google tidak ditemukan dari sesi login.' };
      }

      // 1. Ambil snapshot terbaru dari Cloud Firestore agar akun yang sudah ada di HP/Cloud tidak tertimpa
      let serverCloudAccounts: BankAccount[] = [];
      let serverDeletedIds: string[] = [];
      try {
        const masterSnap = await getDocFromServer(doc(db, 'bank_state_v1', 'master_state')).catch(
          () => getDoc(doc(db, 'bank_state_v1', 'master_state'))
        );
        if (masterSnap && masterSnap.exists()) {
          const mData = masterSnap.data();
          if (Array.isArray(mData.accounts)) {
            serverCloudAccounts = mData.accounts as BankAccount[];
          }
          if (Array.isArray(mData.deletedAccountIds)) {
            serverDeletedIds = mData.deletedAccountIds as string[];
          }
        }
      } catch {
        // fallback ke state lokal jika gagal baca server
      }

      const mergedDeletedIds = Array.from(
        new Set([...PURGED_BOT_ACCOUNT_IDS, ...deletedAccountIdsRef.current, ...serverDeletedIds])
      ).filter((id) => id !== targetAcc.id);
      setDeletedAccountIds(mergedDeletedIds);
      deletedAccountIdsRef.current = mergedDeletedIds;

      // 2. Transformasi penuh Akun Guest (atau Akun OA) menjadi Akun Google yang terikat ke email Google tersebut
      const wasGuest = Boolean(targetAcc.isGuestAccount);
      const convertedGoogleAccount: BankAccount = {
        ...targetAcc,
        userId16: ensureAccountUserId16(targetAcc),
        email: cleanEmail,
        googleEmail: cleanEmail,
        firebaseUid: fbUser.uid,
        isGuestAccount: false,
        isOfficialAdminAccount: wasGuest ? false : Boolean(targetAcc.isOfficialAdminAccount),
        cardStatus: targetAcc.cardStatus === 'banned' ? 'banned' : 'active',
        status: targetAcc.status === 'banned' ? 'banned' : 'active',
      };

      // 3. Gabungkan daftar akun dari Server Cloud + State Lokal + Akun yang baru dikonversi ke Google
      const combinedMap = new Map<string, BankAccount>();
      for (const sAcc of serverCloudAccounts) {
        if (
          sAcc &&
          sAcc.id &&
          !mergedDeletedIds.includes(sAcc.id) &&
          !PURGED_BOT_ACCOUNT_IDS.includes(sAcc.id) &&
          !PURGED_BOT_ACCOUNT_NUMBERS.includes(sAcc.accountNumber)
        ) {
          combinedMap.set(sAcc.id, sAcc);
        }
      }
      for (const lAcc of accountsRef.current) {
        if (
          lAcc &&
          lAcc.id &&
          !mergedDeletedIds.includes(lAcc.id) &&
          !PURGED_BOT_ACCOUNT_IDS.includes(lAcc.id) &&
          !PURGED_BOT_ACCOUNT_NUMBERS.includes(lAcc.accountNumber)
        ) {
          if (!combinedMap.has(lAcc.id)) {
            combinedMap.set(lAcc.id, lAcc);
          }
        }
      }
      combinedMap.set(convertedGoogleAccount.id, convertedGoogleAccount);

      const nextAccounts: BankAccount[] = [
        convertedGoogleAccount,
        ...Array.from(combinedMap.values()).filter((a) => a.id !== convertedGoogleAccount.id),
      ];

      // 4. Hapus dari LocalStorage Guest (karena sekarang sudah resmi menjadi Akun Google di Cloud Firebase)
      const remainingLocalGuests = nextAccounts.filter((a) =>
        Boolean(a.isGuestAccount && !isRealGoogleLinkedEmail(a.googleEmail || a.email))
      );
      saveGuestAccountsToLocalStorage(remainingLocalGuests);

      // 5. Perbarui state aplikasi & tulis langsung ke Firebase Cloud Firestore (tunggu hingga selesai 100%)
      accountsRef.current = nextAccounts;
      setAccounts(nextAccounts);

      await Promise.all([
        flushMasterStateToCloud({
          accounts: nextAccounts,
          deletedAccountIds: mergedDeletedIds,
        }),
        syncCloudUserProfile(
          { uid: fbUser.uid, email: cleanEmail },
          {
            lastAccountId: convertedGoogleAccount.id,
            hasCompletedOnboarding: true,
            authMode: 'google',
            displayName: convertedGoogleAccount.fullName,
            photoURL: fbUser.photoURL || undefined,
          }
        ),
      ]);

      hasFirestoreHydratedRef.current = true;
      hasBootHydratedRef.current = true;

      if (!targetAccountId || targetAccountId === currentAccount?.id) {
        setCurrentAccountIdState(convertedGoogleAccount.id);
        setActiveCloudEmail(cleanEmail);
        setGoogleUser((prev) => ({
          email: cleanEmail,
          name: convertedGoogleAccount.fullName,
          picture: fbUser.photoURL || prev?.picture,
          firebaseUid: fbUser.uid,
          authMode: 'google',
          emailKey: emailToFirestoreDocId(cleanEmail),
          loggedInAt: new Date().toISOString(),
          hasCompletedOnboarding: true,
          isPinVerified: true,
        }));
      }

      playAtmSound('success');
      addNotification(
        wasGuest
          ? 'Akun Guest Berubah Menjadi Akun Google ☁️'
          : 'Akun OA Berhasil Disambungkan ke Google 🔗',
        `Rekening "${convertedGoogleAccount.fullName}" (No. Rek: ${convertedGoogleAccount.accountNumber}) kini resmi berstatus Akun Google di Firebase pada email ${cleanEmail} dan otomatis muncul di HP maupun Laptop.`,
        'success'
      );

      return {
        success: true,
        email: cleanEmail,
        message: wasGuest
          ? `✅ Akun Guest "${convertedGoogleAccount.fullName}" (${convertedGoogleAccount.accountNumber}) resmi berubah menjadi Akun Google di Firebase (${cleanEmail}) dan siap dibuka di HP maupun Laptop!`
          : `✅ Akun "${convertedGoogleAccount.fullName}" (${convertedGoogleAccount.accountNumber}) berhasil disambungkan ke email Google ${cleanEmail}!`,
      };
    } finally {
      isLinkingAccountToGoogleRef.current = false;
    }
  };

  // Deteksi SELURUH kartu/akun yang terhubung ke email Google yang sedang login (Reguler, Akun OA yang disambungkan, maupun Guest yang disambungkan)
  const linkedUserAccounts: BankAccount[] = (() => {
    if (!googleUser) return [];
    const cleanEmail = normalizeEmailKey(googleUser.email || activeCloudEmail || '');
    const uid = googleUser.firebaseUid || firebaseUser?.uid;

    const matched: BankAccount[] = [];
    const seenIds = new Set<string>();

    if (cleanEmail) {
      for (const a of accounts) {
        const gEmail = a.googleEmail ? normalizeEmailKey(a.googleEmail) : '';
        const aEmail = a.email ? normalizeEmailKey(a.email) : '';
        if ((gEmail === cleanEmail || aEmail === cleanEmail) && !seenIds.has(a.id)) {
          seenIds.add(a.id);
          matched.push(a);
        }
      }
    }

    if (uid) {
      for (const a of accounts) {
        if (a.firebaseUid === uid && !seenIds.has(a.id)) {
          // Hanya masukkan jika email akun cocok atau kosong
          const gEmail = a.googleEmail ? normalizeEmailKey(a.googleEmail) : '';
          const aEmail = a.email ? normalizeEmailKey(a.email) : '';
          if (!cleanEmail || !gEmail || gEmail === cleanEmail || aEmail === cleanEmail) {
            seenIds.add(a.id);
            matched.push(a);
          }
        }
      }
    }

    if (matched.length === 0 && cloudUserStatus?.lastAccountId) {
      const byPreferred = accounts.find((a) => a.id === cloudUserStatus.lastAccountId);
      if (byPreferred && !seenIds.has(byPreferred.id)) {
        const gEmail = byPreferred.googleEmail ? normalizeEmailKey(byPreferred.googleEmail) : '';
        const aEmail = byPreferred.email ? normalizeEmailKey(byPreferred.email) : '';
        if (!cleanEmail || gEmail === cleanEmail || aEmail === cleanEmail) {
          matched.push(byPreferred);
        }
      }
    }

    return matched;
  })();

  // Deteksi kartu aktif utama dari daftar linkedUserAccounts
  const linkedUserAccount: BankAccount | null = (() => {
    if (linkedUserAccounts.length === 0) return null;
    const byCurrent = linkedUserAccounts.find((a) => a.id === currentAccountId);
    if (byCurrent) return byCurrent;
    const preferredId = cloudUserStatus?.lastAccountId;
    if (preferredId) {
      const byPref = linkedUserAccounts.find((a) => a.id === preferredId);
      if (byPref) return byPref;
    }
    return linkedUserAccounts[0] || null;
  })();

  const appendBanAuditLog = (
    entry: Omit<BanAuditLogEntry, 'id' | 'timestamp'>,
    baseConfig?: BanSupportConfig
  ): BanSupportConfig => {
    const currentCfg = baseConfig || banSupportConfig;
    const newEntry: BanAuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    const nextLogs = [newEntry, ...(currentCfg.auditLogs || [])].slice(0, 120);
    return {
      ...currentCfg,
      auditLogs: nextLogs,
      updatedAt: new Date().toISOString(),
    };
  };

  // Verifikasi 6 Digit PIN Kartu di awal untuk Akun Terpilih (Gagal 5x -> Banned 1 Hari Real-Time Berulang)
  const verifyInitialCardPin = (cardPin: string, targetAccountId?: string) => {
    const targetAcc =
      (targetAccountId ? accounts.find((a) => a.id === targetAccountId) : null) ||
      linkedUserAccount ||
      currentAccount;
    if (!targetAcc) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Kartu akun Anda tidak ditemukan. Silakan buat kartu baru.',
      };
    }

    const cleanPin = cardPin.trim();
    const isCardPinMatch = targetAcc.pin === cleanPin;
    const isAdminPinMatch = cleanPin === '159357';

    const activeEmailSession =
      googleUser?.email || activeCloudEmail || targetAcc.googleEmail || targetAcc.email || '';
    const targetUid = firebaseUser?.uid || targetAcc.firebaseUid;

    if (isCardPinMatch || isAdminPinMatch) {
      const nextAccounts = accounts.map((acc) =>
        acc.id === targetAcc.id
          ? {
              ...acc,
              failedPinAttempts: 0,
              lastFailedPinAt: undefined,
              firebaseUid: acc.firebaseUid || targetUid,
              googleEmail: acc.googleEmail || activeEmailSession || acc.email,
              email: acc.email || activeEmailSession,
            }
          : acc
      );
      setAccounts(nextAccounts);
      setCurrentAccountIdState(targetAcc.id);
      setGoogleUser((prev) =>
        prev
          ? {
              ...prev,
              name: targetAcc.fullName,
              hasCompletedOnboarding: true,
              isPinVerified: true,
            }
          : prev
      );
      flushMasterStateToCloud({ accounts: nextAccounts });
      void syncCloudUserProfile(
        { uid: targetUid, email: activeEmailSession, fallbackEmail: targetAcc.email },
        {
          failedPinAttempts: 0,
          lastAccountId: targetAcc.id,
          hasCompletedOnboarding: true,
        }
      );
      playAtmSound('success');
      return {
        success: true,
        failedAttempts: 0,
        remainingAttempts: 5,
        bannedNow: false,
        message: `PIN Kartu benar! Selamat datang kembali, ${targetAcc.fullName}.`,
      };
    }

    // Jika salah PIN Kartu:
    const currentAttempts =
      typeof targetAcc.failedPinAttempts === 'number'
        ? targetAcc.failedPinAttempts
        : cloudUserStatus?.failedPinAttempts || 0;
    const nextAttempts = currentAttempts + 1;
    const nowIso = new Date().toISOString();

    if (nextAttempts >= 5) {
      // Gagal 5x berturut-turut -> Banned Trial 1 Hari (1.440 menit / 24 jam) mengikuti template Admin
      // dan selalu menampilkan alasan salah memasukkan PIN 5 kali. Reset failedPinAttempts ke 0 agar jika diulangi lagi nanti kena 1 hari lagi.
      const baseTemplate: BanScreenCustomizationConfig = {
        ...DEFAULT_BAN_SCREEN_CONFIG,
        ...(banSupportConfig.defaultTemplateConfig || {}),
      };
      const oneDayExpiresAt = new Date(Date.now() + 1440 * 60 * 1000).toISOString();
      const pinBanReason = SYSTEM_BAN_REASONS_30[0].reasonText;
      const caseId = generateBanCaseId();

      const appliedCustomConfig: BanScreenCustomizationConfig = {
        ...baseTemplate,
        durationType: 'custom',
        durationValue: 1,
        durationUnit: 'days',
        durationMinutes: 1440,
        durationLabel: '1 Hari (24 Jam)',
        reasonMode: 'system_30',
        systemReasonId: 'sys-01',
        reasonText: pinBanReason,
        showReasonBox: true, // Q41: Selalu tampilkan alasan salah memasukkan PIN 5 kali
        showCountdown: baseTemplate.showCountdown !== false,
        caseId,
        statusBadgeText: 'BANNED TRIAL · 1 HARI (GAGAL PIN 5X)',
      };

      const nextAccounts: BankAccount[] = accounts.map((acc) =>
        acc.id === targetAcc.id
          ? {
              ...acc,
              status: 'banned' as const,
              banReason: pinBanReason,
              cardStatus: 'banned' as const,
              failedPinAttempts: 0, // Reset ke 0 agar setelah unban bila salah 5x lagi akan terbanned 1 hari lagi
              lastFailedPinAt: nowIso,
              banInfo: {
                isBanned: true,
                reason: pinBanReason,
                durationType: 'custom',
                durationMinutes: 1440,
                durationLabel: '1 Hari (24 Jam)',
                bannedAt: nowIso,
                expiresAt: oneDayExpiresAt,
                appealStatus: 'none',
                appealCount: 0,
                customConfig: appliedCustomConfig,
              },
            }
          : acc
      );

      const nextBanSupport = appendBanAuditLog({
        action: 'pin_5x_ban',
        accountId: targetAcc.id,
        accountName: targetAcc.fullName,
        accountNumber: targetAcc.accountNumber,
        durationLabel: '1 Hari (24 Jam)',
        reason: pinBanReason,
        caseId,
        summary: `Gagal memasukkan PIN Kartu 5x berturut-turut — otomatis Banned 1 Hari (${targetAcc.fullName})`,
      });

      setAccounts(nextAccounts);
      setBanSupportConfig(nextBanSupport);
      setCloudUserStatus((prev) =>
        prev
          ? {
              ...prev,
              status: 'banned',
              banReason: pinBanReason,
              bannedAt: nowIso,
              banExpiresAt: oneDayExpiresAt,
              banDurationLabel: '1 Hari (24 Jam)',
              banCustomConfig: appliedCustomConfig,
              failedPinAttempts: 0,
              appealStatus: 'none',
            }
          : prev
      );
      flushMasterStateToCloud({ accounts: nextAccounts, banSupportConfig: nextBanSupport });

      void syncCloudUserProfile(
        { uid: targetUid, email: activeEmailSession, fallbackEmail: targetAcc.email },
        {
          status: 'banned',
          banReason: pinBanReason,
          bannedAt: nowIso,
          banExpiresAt: oneDayExpiresAt,
          banDurationLabel: '1 Hari (24 Jam)',
          banCustomConfig: appliedCustomConfig,
          failedPinAttempts: 0,
          appealStatus: 'none',
        }
      );

      playAtmSound('alert');
      return {
        success: false,
        failedAttempts: 5,
        remainingAttempts: 0,
        bannedNow: true,
        message:
          'Anda telah salah memasukkan PIN Kartu sebanyak 5 kali! Akun otomatis dibanned selama 1 Hari (24 Jam).',
      };
    }

    // Jika belum 5x (1/5 s.d. 4/5): simpan jumlah gagal ke Cloud
    const remaining = 5 - nextAttempts;
    const nextAccounts = accounts.map((acc) =>
      acc.id === targetAcc.id
        ? {
            ...acc,
            failedPinAttempts: nextAttempts,
            lastFailedPinAt: nowIso,
          }
        : acc
    );
    setAccounts(nextAccounts);
    setCloudUserStatus((prev) =>
      prev ? { ...prev, failedPinAttempts: nextAttempts, lastFailedPinAt: nowIso } : prev
    );
    flushMasterStateToCloud({ accounts: nextAccounts });
    void syncCloudUserProfile(
      { uid: targetUid, email: activeEmailSession, fallbackEmail: targetAcc.email },
      {
        failedPinAttempts: nextAttempts,
        lastFailedPinAt: nowIso,
      }
    );

    emitPinSecurityAlert(targetAcc.fullName, `Gagal PIN Login (${nextAttempts}/5)`);
    playAtmSound('alert');
    return {
      success: false,
      failedAttempts: nextAttempts,
      remainingAttempts: remaining,
      bannedNow: false,
      message: `PIN Kartu salah! Percobaan gagal ${nextAttempts}/5 — tersisa ${remaining} kesempatan sebelum akun dibanned otomatis selama 1 hari.`,
    };
  };

  const adminResetPinAttempts = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan.' };

    const nextAccounts = accounts.map((acc) =>
      acc.id === accountId ? { ...acc, failedPinAttempts: 0, lastFailedPinAt: undefined } : acc
    );
    const nextBanSupport = appendBanAuditLog({
      action: 'reset_pin_attempts',
      accountId: target.id,
      accountName: target.fullName,
      accountNumber: target.accountNumber,
      summary: `Admin me-reset penghitung gagal PIN (${target.failedPinAttempts || 0}/5 -> 0/5) untuk ${target.fullName}`,
    });

    setAccounts(nextAccounts);
    setBanSupportConfig(nextBanSupport);
    flushMasterStateToCloud({ accounts: nextAccounts, banSupportConfig: nextBanSupport });
    void syncCloudUserProfile(
      {
        uid: target.firebaseUid,
        email: target.googleEmail || target.email,
        fallbackEmail: target.email,
      },
      { failedPinAttempts: 0 }
    );
    playAtmSound('success');
    return {
      success: true,
      message: `Jumlah percobaan gagal PIN untuk ${target.fullName} berhasil di-reset ke 0/5!`,
    };
  };

  // ================= REAL-TIME BAN LOCK STATE & UNIFIED APPEALS (WA / EMAIL / IN-APP) =================
  const computeActiveBanLockState = () => {
    const targetAcc = linkedUserAccount || currentAccount;
    const cloudBanned = cloudUserStatus?.status === 'banned';
    const accountBanned =
      Boolean(targetAcc) &&
      (targetAcc?.status === 'banned' ||
        targetAcc?.cardStatus === 'banned' ||
        Boolean(targetAcc?.banInfo?.isBanned));

    const baseTemplate: BanScreenCustomizationConfig = {
      ...DEFAULT_BAN_SCREEN_CONFIG,
      ...(banSupportConfig.defaultTemplateConfig || {}),
    };

    const isBanned = Boolean(cloudBanned || accountBanned);
    if (!isBanned) {
      return {
        isBanned: false,
        reason: '',
        appealStatus: 'none' as const,
        appealCount: 0,
        customConfig: baseTemplate,
      };
    }

    const customCfg: BanScreenCustomizationConfig = {
      ...baseTemplate,
      ...(cloudUserStatus?.banCustomConfig || {}),
      ...(targetAcc?.banInfo?.customConfig || {}),
    };

    const rawReason =
      targetAcc?.banInfo?.reason !== undefined
        ? targetAcc.banInfo.reason
        : cloudUserStatus?.banReason !== undefined
        ? cloudUserStatus.banReason
        : targetAcc?.banReason !== undefined
        ? targetAcc.banReason
        : customCfg.reasonText || '';

    const cleanReason =
      customCfg.reasonMode === 'none' || customCfg.showReasonBox === false
        ? ''
        : (rawReason || '').trim();

    const appealStatus =
      targetAcc?.banInfo?.appealStatus ||
      cloudUserStatus?.appealStatus ||
      ('none' as const);

    const appealCount =
      targetAcc?.banInfo?.appealCount ??
      cloudUserStatus?.appealCount ??
      (appealStatus !== 'none' ? 1 : 0);

    return {
      isBanned: true,
      reason: cleanReason,
      bannedAt:
        targetAcc?.banInfo?.bannedAt ||
        cloudUserStatus?.bannedAt ||
        cloudUserStatus?.updatedAt,
      durationLabel:
        targetAcc?.banInfo?.durationLabel ||
        cloudUserStatus?.banDurationLabel ||
        customCfg.durationLabel ||
        'Diblokir Real-Time',
      expiresAt:
        targetAcc?.banInfo?.expiresAt || cloudUserStatus?.banExpiresAt,
      appealStatus,
      appealNote: targetAcc?.banInfo?.appealNote || cloudUserStatus?.appealNote,
      appealCategory:
        targetAcc?.banInfo?.appealCategory || cloudUserStatus?.appealCategory,
      appealCount,
      appealAdminNote:
        targetAcc?.banInfo?.appealAdminNote || cloudUserStatus?.appealAdminNote,
      customConfig: customCfg,
    };
  };

  const activeBanLockState = computeActiveBanLockState();

  // Pastikan jika tiba-tiba dibanned secara real-time, seluruh modal terbuka langsung ditutup & bunyikan efek suara sesuai pengaturan Admin
  const prevBannedStateRef = useRef<boolean>(false);
  useEffect(() => {
    if (activeBanLockState.isBanned) {
      setActiveGiftModal(null);
      setIsMintolModalOpen(false);
      setIsBugReportModalOpen(false);
      setIsGlobalChatModalOpen(false);
      if (!prevBannedStateRef.current) {
        const sound = activeBanLockState.customConfig.soundEffect;
        if (sound === 'siren' || sound === 'alert') {
          playAtmSound('alert');
        }
      }
    }
    prevBannedStateRef.current = activeBanLockState.isBanned;
  }, [activeBanLockState.isBanned, activeBanLockState.customConfig.soundEffect]);

  const adminUpdateBanSupportConfig = async (
    config: BanSupportConfig
  ): Promise<{ success: boolean; message: string }> => {
    const cleanWa = config.whatsappNumber.replace(/[^\d+]/g, '').trim();
    const cleanEmail = config.emailAddress.trim();
    const nextConfig: BanSupportConfig = {
      ...banSupportConfig,
      ...config,
      whatsappNumber: cleanWa,
      emailAddress: cleanEmail,
      updatedAt: new Date().toISOString(),
    };
    setBanSupportConfig(nextConfig);
    flushMasterStateToCloud({ banSupportConfig: nextConfig });
    playAtmSound('success');
    return {
      success: true,
      message: 'Konfigurasi Kontak & Studio Banned berhasil disimpan ke Cloud Firestore!',
    };
  };

  const submitUnifiedBanAppeal = async (
    message: string,
    source: 'in_app' | 'whatsapp' | 'email' = 'in_app',
    appealCategory?: string,
    promiseAccepted?: boolean
  ): Promise<{ success: boolean; message: string }> => {
    const targetAcc = linkedUserAccount || currentAccount;
    const cfg = activeBanLockState.customConfig;
    const currentAppealCount = activeBanLockState.appealCount || 0;

    if (source === 'in_app') {
      if (
        activeBanLockState.appealStatus === 'rejected' &&
        cfg.allowResubmitAfterReject === false
      ) {
        return {
          success: false,
          message: 'Pengajuan tinjauan Anda sebelumnya telah ditolak dan form pengiriman ulang dikunci oleh Admin.',
        };
      }
      if (cfg.maxAppeals > 0 && currentAppealCount >= cfg.maxAppeals) {
        return {
          success: false,
          message: `Batas maksimal pengajuan tinjauan (${cfg.maxAppeals}x) telah tercapai.`,
        };
      }
      if (cfg.requireAppealCategoryAndPromise && (!appealCategory || !promiseAccepted)) {
        return {
          success: false,
          message: 'Wajib memilih kategori alasan banding dan mencentang pernyataan janji terlebih dahulu.',
        };
      }
    }

    const cleanNote = message.trim();
    if (source === 'in_app' && cleanNote.length < 5) {
      return {
        success: false,
        message: 'Mohon tulis alasan atau penjelasan tinjauan Anda minimal 5 karakter.',
      };
    }

    const nowIso = new Date().toISOString();
    const finalNote =
      cleanNote ||
      (source === 'whatsapp'
        ? 'Pengguna menghubungi Admin melalui tombol Tinjau dengan WhatsApp.'
        : 'Pengguna menghubungi Admin melalui tombol Tinjau dengan Email.');
    const nextAppealCount = currentAppealCount + 1;

    const updatedAccounts = targetAcc
      ? accounts.map((acc) =>
          acc.id === targetAcc.id
            ? {
                ...acc,
                status: 'banned' as const,
                cardStatus: 'banned' as const,
                banInfo: {
                  ...(acc.banInfo || {
                    isBanned: true,
                    durationType: cfg.durationType,
                    durationLabel: activeBanLockState.durationLabel || 'PERMANEN',
                    bannedAt: nowIso,
                    reason: activeBanLockState.reason,
                  }),
                  appealStatus: 'pending' as const,
                  appealNote: finalNote,
                  appealCategory: appealCategory || acc.banInfo?.appealCategory,
                  appealPromiseAccepted: promiseAccepted ?? acc.banInfo?.appealPromiseAccepted,
                  appealCount: nextAppealCount,
                  appealSource: source,
                  appealRequestedAt: nowIso,
                },
              }
            : acc
        )
      : accounts;

    const nextBanSupport = appendBanAuditLog({
      action: 'appeal_submitted',
      accountId: targetAcc?.id,
      accountName: targetAcc?.fullName || googleUser?.name,
      accountNumber: targetAcc?.accountNumber,
      reason: finalNote,
      caseId: cfg.caseId,
      summary: `Pengajuan tinjauan ban (${source.toUpperCase()}) dikirim — Percobaan #${nextAppealCount}`,
    });

    if (targetAcc) {
      setAccounts(updatedAccounts);
    }
    setBanSupportConfig(nextBanSupport);
    flushMasterStateToCloud({ accounts: updatedAccounts, banSupportConfig: nextBanSupport });

    const targetUid = firebaseUser?.uid || targetAcc?.firebaseUid;
    const targetEmail =
      googleUser?.email || activeCloudEmail || targetAcc?.googleEmail || targetAcc?.email;
    await syncCloudUserProfile(
      { uid: targetUid, email: targetEmail || undefined },
      {
        appealStatus: 'pending',
        appealNote: finalNote,
        appealCategory: appealCategory || '',
        appealCount: nextAppealCount,
        appealSource: source,
        appealRequestedAt: nowIso,
      }
    );

    playAtmSound('success');
    return {
      success: true,
      message: 'Permohonan tinjauan Anda telah terkirim ke Panel Admin secara real-time!',
    };
  };

  const adminReviewUnifiedBanAppeal = async (
    accountId: string,
    action: 'approve' | 'reject',
    adminNote?: string
  ): Promise<{ success: boolean; message: string }> => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Rekening nasabah tidak ditemukan.' };
    }
    const cleanAdminNote = adminNote?.trim() || '';

    const targetUid =
      target.firebaseUid ||
      (firebaseUser &&
      ((target.googleEmail && normalizeEmailKey(target.googleEmail) === normalizeEmailKey(googleUser?.email || '')) ||
        target.id === currentAccountId)
        ? firebaseUser.uid
        : undefined);

    if (action === 'approve') {
      const nextAccounts: BankAccount[] = accounts.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              status: 'active' as const,
              banReason: '',
              cardStatus: 'active' as const,
              banInfo: undefined,
            }
          : acc
      );
      setAccounts(nextAccounts);
      flushMasterStateToCloud({ accounts: nextAccounts });

      await syncCloudUserProfile(
        {
          uid: targetUid,
          email: target.googleEmail || target.email,
          fallbackEmail: target.email,
        },
        {
          status: 'active',
          banReason: '',
          appealStatus: 'approved',
          appealAdminNote: cleanAdminNote || 'Banding disetujui Admin, akun dibuka kembali.',
        }
      );

      addNotification(
        '🔓 Banding Diterima — Akun Dibuka Kembali!',
        `Tinjauan akun ${target.fullName} (${target.accountNumber}) disetujui Admin. Akun kini aktif normal.`,
        'success',
        { category: 'keamanan', targetView: 'dashboard', accountId: target.id }
      );
      playAtmSound('success');
      return {
        success: true,
        message: `Tinjauan disetujui! Akun ${target.fullName} telah dibuka dari status Banned.`,
      };
    } else {
      const nextAccounts: BankAccount[] = accounts.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              banInfo: acc.banInfo
                ? {
                    ...acc.banInfo,
                    appealStatus: 'rejected' as const,
                    appealAdminNote:
                      cleanAdminNote || 'Permohonan tinjauan ditolak oleh Admin.',
                  }
                : undefined,
            }
          : acc
      );
      setAccounts(nextAccounts);
      flushMasterStateToCloud({ accounts: nextAccounts });

      await syncCloudUserProfile(
        {
          uid: targetUid,
          email: target.googleEmail || target.email,
          fallbackEmail: target.email,
        },
        {
          appealStatus: 'rejected',
          appealAdminNote: cleanAdminNote || 'Permohonan tinjauan ditolak oleh Admin.',
        }
      );

      playAtmSound('beep');
      return {
        success: true,
        message: `Permohonan tinjauan ${target.fullName} ditolak.`,
      };
    }
  };

  // ================= WEBSITE SYSTEM POPUP NOTIFICATIONS =================
  const lastSyncEpochRef = useRef<number>(0);
  const isApplyingExternalSnapshotRef = useRef<boolean>(false);
  const hasBootHydratedRef = useRef<boolean>(false);

  const buildPersistableSnapshot = (epochMs: number): BankPersistableSnapshot => ({
    version: 1,
    updatedAtMs: epochMs,
    currentAccountId,
    googleUser,
    accounts,
    transactions,
    goldMarketConfig,
    userSettings,
    pockets,
    depositos,
    loans,
    scheduledPayments,
    favorites,
    notifications,
    cardlessTokens,
    cardUpgrades,
    pinResetRequests,
    redeemCodes,
    purchasedCodes,
    resiList,
    chats,
    spinWheelConfig,
    spinHistory,
    sultanEmpireConfig,
    featureConfigs: rawFeatureConfigs,
    deletedFeatureIds,
    deletedAccountIds,
    accountDeletionRequests,
    defaultLetterSealConfig,
    adminHelpRequests,
    appUpdates,
    budgetCategories,
    manualExpenses,
    budgetTxCategoryMap,
    budgetAlertHistory,
    websitePopups,
    dismissedPopupIds,
    globalChats,
    bugReports,
    giftEvents,
    deletedGiftEventIds,
    giftEventsInitialized,
    banSupportConfig,
    adminUnlocked,
  });

  // Real-time Calendar Watcher: Checks every 1 second whether system month rolled over onto Tanggal 1
  // and compounds +5% per month automatically (even across multiple missed months).
  useEffect(() => {
    const checkMonthlyRollover = () => {
      const now = new Date();
      const realMonthKey = getLocalMonthKey(now);
      setGoldMarketConfig((prev) => {
        const monthsDiff = computeMonthsDifference(prev.lastProcessedMonthKey, realMonthKey);
        if (monthsDiff <= 0) return prev;
        const growthRate = Math.max(0, prev.monthlyGrowthPercent ?? 5);
        const factor = Math.pow(1 + growthRate / 100, monthsDiff);
        const updatedPrice = Math.round(prev.currentPricePerGram * factor);
        const newPoints: GoldPriceHistoryPoint[] = [];
        for (let step = 1; step <= monthsDiff; step++) {
          const [fy, fm] = prev.lastProcessedMonthKey.split('-').map(Number);
          const stepDate = new Date(fy, fm - 1 + step, 1);
          const stepPrice = Math.round(
            prev.currentPricePerGram * Math.pow(1 + growthRate / 100, step)
          );
          newPoints.push({
            id: `gold-m-${Date.now()}-${step}`,
            label: formatMonthShortIndo(stepDate),
            monthKey: getLocalMonthKey(stepDate),
            pricePerGram: stepPrice,
            changePercent: growthRate,
            timestamp: stepDate.toISOString(),
            isSimulation: false,
          });
        }
        return {
          ...prev,
          currentPricePerGram: updatedPrice,
          lastProcessedMonthKey: realMonthKey,
          priceHistory: [...prev.priceHistory, ...newPoints].slice(-24),
          lastMonthlyEventBanner: {
            title: `Kenaikan Otomatis Tanggal 1 (+${growthRate}%${monthsDiff > 1 ? ` × ${monthsDiff} Bulan` : ''})`,
            message: `Bulan baru telah tiba! Harga Emas 24K naik otomatis menjadi ${formatRupiah(updatedPrice)}/gram.`,
            monthKey: realMonthKey,
            growthPercent: growthRate,
            timestamp: now.toISOString(),
          },
        };
      });
    };

    checkMonthlyRollover();
    const timer = window.setInterval(checkMonthlyRollover, 1000);
    return () => window.clearInterval(timer);
  }, []);

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

  // Notification toggles remain purely in memory & cloud userSettings (zero localStorage)

  const inferNotificationMeta = (
    title: string,
    message: string,
    explicit?: {
      category?: NotificationCategory;
      targetView?: string;
      targetDashboardTab?: string;
      accountId?: string;
      referenceId?: string;
      skipServerBroadcast?: boolean;
    }
  ): {
    category: NotificationCategory10Key;
    targetView: string;
    targetDashboardTab: string;
    accountId?: string;
    referenceId?: string;
    skipServerBroadcast?: boolean;
  } => {
    const resolvedCategory = normalizeNotificationCategory(
      explicit?.category,
      title,
      message,
      explicit?.targetView
    );
    const metaCfg = getNotificationCategoryMeta(resolvedCategory);

    return {
      category: resolvedCategory,
      targetView: explicit?.targetView || metaCfg.defaultTargetView,
      targetDashboardTab: explicit?.targetDashboardTab || metaCfg.defaultDashboardTab,
      accountId: explicit?.accountId,
      referenceId: explicit?.referenceId,
      skipServerBroadcast: explicit?.skipServerBroadcast,
    };
  };

  const notificationCategoryPermissions = sanitizeNotificationCategoryPermissions(
    userSettings.notificationCategoryPermissions
  );

  const isCategoryAlertEnabled = (category: NotificationCategory): boolean => {
    const currentSettings = userSettingsRef.current;
    const key = normalizeNotificationCategory(category);
    const perms = sanitizeNotificationCategoryPermissions(
      currentSettings.notificationCategoryPermissions
    );
    if (perms[key] === false) return false;
    if (key === 'transaksi' && currentSettings.pushTransactionAlerts === false) return false;
    if (key === 'pinjaman' && currentSettings.pushLoanAlerts === false) return false;
    if (key === 'keamanan' && currentSettings.pushSecurityAlerts === false) return false;
    return true;
  };

  const persistNotificationCategoryPermissions = (
    nextPerms: Record<NotificationCategory10Key, boolean>
  ) => {
    const nextSettings: UserAppSettings = {
      ...userSettingsRef.current,
      notificationCategoryPermissions: nextPerms,
      pushTransactionAlerts: nextPerms.transaksi,
      pushLoanAlerts: nextPerms.pinjaman,
      pushSecurityAlerts: nextPerms.keamanan,
      pushPromoAlerts: nextPerms.sistem,
    };
    setUserSettings(nextSettings);
    flushMasterStateToCloud({ userSettings: nextSettings });
    const targetEmail =
      googleUser?.email || activeCloudEmail || currentAccount?.googleEmail || currentAccount?.email;
    void syncCloudUserProfile(
      { uid: firebaseUser?.uid, email: targetEmail || undefined },
      { notificationCategoryPermissions: nextPerms }
    );
  };

  const toggleNotificationCategoryPermission = (categoryKey: NotificationCategory10Key) => {
    const currentPerms = sanitizeNotificationCategoryPermissions(
      userSettingsRef.current.notificationCategoryPermissions
    );
    const nextAllowed = !currentPerms[categoryKey];
    const nextPerms: Record<NotificationCategory10Key, boolean> = {
      ...currentPerms,
      [categoryKey]: nextAllowed,
    };
    if (!nextAllowed) {
      setActivePushBanners((prev) =>
        prev.filter((b) => normalizeNotificationCategory(b.category, b.title, b.message, b.targetView) !== categoryKey)
      );
    }
    persistNotificationCategoryPermissions(nextPerms);
    playAtmSound('beep');
  };

  const setAllNotificationCategoryPermissions = (allowed: boolean) => {
    const nextPerms: Record<NotificationCategory10Key, boolean> = {
      transaksi: allowed,
      transfer: allowed,
      keamanan: allowed,
      pinjaman: allowed,
      kartu: allowed,
      emas: allowed,
      kerja: allowed,
      spin: allowed,
      hadiah: allowed,
      sistem: allowed,
    };
    if (!allowed) {
      setActivePushBanners([]);
    }
    persistNotificationCategoryPermissions(nextPerms);
    playAtmSound('beep');
  };

  const markCategoryNotificationsAsRead = (categoryKey: NotificationCategory10Key) => {
    setNotifications((prev) =>
      prev.map((n) =>
        normalizeNotificationCategory(n.category, n.title, n.message, n.targetView) === categoryKey
          ? { ...n, read: true }
          : n
      )
    );
  };

  const triggerMobileAndNativeNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'alert' | 'admin_chat' = 'info',
    meta?: {
      category?: NotificationCategory;
      targetView?: string;
      targetDashboardTab?: string;
      accountId?: string;
      referenceId?: string;
    }
  ) => {
    if (!notificationsEnabledRef.current) return;

    const resolvedMeta = inferNotificationMeta(title, message, meta);
    if (!isCategoryAlertEnabled(resolvedMeta.category)) return;
    const bannerId = `push-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const newBanner: MobilePushBannerToast = {
      id: bannerId,
      title,
      message,
      type,
      category: resolvedMeta.category,
      targetView: resolvedMeta.targetView,
      targetDashboardTab: resolvedMeta.targetDashboardTab,
      accountId: resolvedMeta.accountId,
      referenceId: resolvedMeta.referenceId,
      timestamp: new Date().toISOString(),
    };

    setActivePushBanners((prev) => [newBanner, ...prev].slice(0, 5));
    setTimeout(() => {
      setActivePushBanners((prev) => prev.filter((b) => b.id !== bannerId));
    }, 6500);

    try {
      if (userSettingsRef.current.notificationChimeSound) {
        playAtmSound('beep');
      }
    } catch { /* empty */ }

    // Background OS / Browser Notification via Service Worker + Fallback Notification API
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        const tag = `bn-${resolvedMeta.category}-${type}-${Date.now()}`;
        const deepUrl = `/?notifView=${encodeURIComponent(resolvedMeta.targetView)}&notifTab=${encodeURIComponent(
          resolvedMeta.targetDashboardTab
        )}`;
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready
            .then((reg) => {
              if (reg && typeof reg.showNotification === 'function') {
                return reg.showNotification(title, {
                  body: message,
                  tag,
                  data: {
                    url: deepUrl,
                    targetView: resolvedMeta.targetView,
                    targetDashboardTab: resolvedMeta.targetDashboardTab,
                    category: resolvedMeta.category,
                  },
                });
              }
              if (reg && reg.active) {
                reg.active.postMessage({
                  type: 'SHOW_BANK_NOTIFICATION',
                  title,
                  body: message,
                  tag,
                  url: deepUrl,
                  targetView: resolvedMeta.targetView,
                  targetDashboardTab: resolvedMeta.targetDashboardTab,
                  category: resolvedMeta.category,
                });
              }
              return undefined;
            })
            .catch(() => {
              try {
                new Notification(title, { body: message, tag });
              } catch { /* empty */ }
            });
        } else {
          new Notification(title, { body: message, tag });
        }
      }
    } catch { /* empty */ }
  };

  const requestAndEnableNotifications = async (): Promise<{ success: boolean; message: string }> => {
    setNotificationsEnabled(true);
    setBackgroundAutoNotifEnabled(true);

    try {
      if (typeof window === 'undefined' || !('Notification' in window)) {
        triggerMobileAndNativeNotification(
          'Notifikasi Aplikasi Aktif',
          'Banner push & lonceng Bank Nusantara aktif. Perangkat ini tidak mendukung native browser push.',
          'info'
        );
        return {
          success: true,
          message: 'Notifikasi banner aplikasi & lonceng aktif (browser tidak mendukung native OS push).',
        };
      }

      if (Notification.permission === 'granted') {
        setNotificationPermissionStatus('granted');
        triggerMobileAndNativeNotification(
          'Notifikasi Latar Belakang Aktif 🔔',
          'Semua transaksi, Spin the Wheel, promo berkala, dan kode redeem siap dikirim ke layar Anda.',
          'success'
        );
        return {
          success: true,
          message: 'Izin notifikasi latar belakang sudah aktif! Notifikasi siap diterima kapan saja.',
        };
      }

      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);

      if (permission === 'granted') {
        triggerMobileAndNativeNotification(
          'Notifikasi Latar Belakang Diaktifkan 🔔',
          'Bank Nusantara kini dapat mengirim notifikasi meski tab ditutup atau diminimalkan.',
          'success'
        );
        return {
          success: true,
          message: 'Berhasil! Izin notifikasi latar belakang browser & Service Worker telah diaktifkan.',
        };
      }

      triggerMobileAndNativeNotification(
        'Mode Banner Aplikasi Aktif',
        'Izin browser belum diberikan, notifikasi tetap muncul melalui lonceng dan banner di dalam aplikasi.',
        'warning'
      );
      return {
        success: permission !== 'denied',
        message:
          permission === 'denied'
            ? 'Izin browser diblokir oleh perangkat, namun notifikasi banner aplikasi & lonceng tetap berjalan aktif.'
            : 'Permintaan izin ditutup. Notifikasi dalam aplikasi tetap aktif.',
      };
    } catch {
      triggerMobileAndNativeNotification(
        'Notifikasi Aplikasi Aktif',
        'Banner push & lonceng Bank Nusantara aktif untuk seluruh aktivitas rekening.',
        'info'
      );
      return {
        success: true,
        message: 'Notifikasi banner aplikasi & lonceng aktif.',
      };
    }
  };

  const sendTestNotificationNow = () => {
    addNotification(
      'Tes Notifikasi Latar Belakang Berhasil 🔔',
      'Notifikasi Bank Nusantara aktif di lonceng aplikasi, push banner, dan Service Worker latar belakang.',
      'success'
    );
  };

  const sendBulkNotifications = (
    count: number,
    customTitle?: string,
    customMessage?: string
  ): { success: boolean; message: string; sentCount: number } => {
    const safeCount = Math.max(1, Math.min(25, Math.floor(count || 5)));
    const templates: Array<{
      title: string;
      message: string;
      type: 'info' | 'success' | 'warning' | 'alert';
    }> = [
      {
        title: 'Promo Hemat 0,50% Koin Spin 🪙',
        message: 'Beli paket koin Spin (Rp xxx.XXX) lebih murah 0,50% dibanding Spin Pakai Uang Langsung!',
        type: 'success',
      },
      {
        title: 'Jackpot Spin Rp 20.000.000 Menanti 🎡',
        message: 'Putar Spin the Wheel 1x, 3x, 5x, 7x, atau 10x langsung pakai Koin maupun Saldo Rekening.',
        type: 'info',
      },
      {
        title: 'Pantau Mutasi & Saldo Rekening Real-Time 💳',
        message: 'Semua transaksi keluar-masuk tersimpan aman di Server Database & Penyimpanan Perangkat.',
        type: 'info',
      },
      {
        title: 'Tabungan Emas 24K & Transfer Bebas 🪙',
        message: 'Cek pergerakan harga Emas 24K hari ini dan nikmati Transfer Bebas lintas aset.',
        type: 'success',
      },
      {
        title: 'Pengingat Keamanan PIN Kartu 6 Digit 🔐',
        message: 'Jangan bagikan PIN 6 digit kartu Anda kepada siapa pun demi keamanan dana.',
        type: 'warning',
      },
      {
        title: 'Info Kode Redeem Bank Nusantara 🎁',
        message: 'Segera tukarkan Kode Redeem aktif sebelum kuota klaim atau durasi waktunya habis!',
        type: 'info',
      },
      {
        title: 'Peluang Gaji Lowongan Kerja & Arena Suit 💼',
        message: 'Tingkatkan level pekerjaan dan menangkan Voucher Level untuk membuka penghasilan lebih tinggi.',
        type: 'success',
      },
    ];

    for (let i = 0; i < safeCount; i++) {
      const tpl = templates[i % templates.length];
      const title = customTitle?.trim()
        ? safeCount > 1
          ? `${customTitle.trim()} (#${i + 1})`
          : customTitle.trim()
        : `${tpl.title} • #${i + 1}`;
      const message = customMessage?.trim() ? customMessage.trim() : tpl.message;

      setTimeout(() => {
        addNotification(title, message, tpl.type);
      }, i * 220);
    }

    return {
      success: true,
      sentCount: safeCount,
      message: `${safeCount} notifikasi latar belakang & banner aplikasi sedang dikirim bertahap ke nasabah!`,
    };
  };

  // Real-time WebSocket + HTTP Sync across ALL Phones ("di semua HP")
  const wsRef = useRef<WebSocket | null>(null);
  const seenChatIdsRef = useRef<Set<string>>(new Set(globalChats.map((c) => c.id)));
  const seenPopupIdsRef = useRef<Set<string>>(new Set(websitePopups.map((p) => p.id)));
  const seenBugIdsRef = useRef<Set<string>>(new Set(bugReports.map((b) => b.id)));
  const seenPushIdsRef = useRef<Set<string>>(new Set(notifications.map((n) => n.id)));

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

        if (Array.isArray(data.deletedGiftEventIds)) {
          const mergedDeleted = Array.from(
            new Set([...deletedGiftEventIdsRef.current, ...data.deletedGiftEventIds])
          );
          setDeletedGiftEventIds(mergedDeleted);
        }

        if (Boolean(data.giftEventsInitialized) && Array.isArray(data.giftEvents)) {
          const deletedSet = new Set([
            ...deletedGiftEventIdsRef.current,
            ...(Array.isArray(data.deletedGiftEventIds) ? data.deletedGiftEventIds : []),
          ]);
          const filtered = (data.giftEvents as AdminGiftEventPackage[]).filter(
            (ev) => !deletedSet.has(ev.id)
          );
          setGiftEventsInitialized(true);
          setGiftEvents(filtered);
        }

        if (Array.isArray(data.pushAlerts)) {
          const incomingAlerts: AppNotification[] = data.pushAlerts;
          incomingAlerts.forEach((incomingAlert) => {
            if (!incomingAlert || !incomingAlert.id) return;
            if (isInitial) {
              seenPushIdsRef.current.add(incomingAlert.id);
              return;
            }
            if (!seenPushIdsRef.current.has(incomingAlert.id)) {
              seenPushIdsRef.current.add(incomingAlert.id);
              const resolvedMeta = inferNotificationMeta(incomingAlert.title, incomingAlert.message, {
                category: incomingAlert.category,
                targetView: incomingAlert.targetView,
                targetDashboardTab: incomingAlert.targetDashboardTab,
              });
              if (isCategoryAlertEnabled(resolvedMeta.category)) {
                setNotifications((prev) => {
                  if (prev.some((n) => n.id === incomingAlert.id)) return prev;
                  return [
                    {
                      ...incomingAlert,
                      category: resolvedMeta.category,
                      targetView: resolvedMeta.targetView,
                      targetDashboardTab: resolvedMeta.targetDashboardTab,
                      read: false,
                    },
                    ...prev,
                  ].slice(0, 180);
                });
                triggerMobileAndNativeNotification(
                  incomingAlert.title,
                  incomingAlert.message,
                  incomingAlert.type || 'info',
                  resolvedMeta
                );
              }
            }
          });
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
              if (Array.isArray(msg.payload.deletedGiftEventIds)) {
                setDeletedGiftEventIds((prev) =>
                  Array.from(new Set([...prev, ...msg.payload.deletedGiftEventIds]))
                );
              }
              if (
                Boolean(msg.payload.giftEventsInitialized) &&
                Array.isArray(msg.payload.giftEvents)
              ) {
                const deletedSet = new Set([
                  ...deletedGiftEventIdsRef.current,
                  ...(Array.isArray(msg.payload.deletedGiftEventIds)
                    ? msg.payload.deletedGiftEventIds
                    : []),
                ]);
                setGiftEventsInitialized(true);
                setGiftEvents(
                  (msg.payload.giftEvents as AdminGiftEventPackage[]).filter(
                    (ev) => !deletedSet.has(ev.id)
                  )
                );
              }
              if (Array.isArray(msg.payload.pushAlerts)) {
                msg.payload.pushAlerts.forEach((pa: AppNotification) => seenPushIdsRef.current.add(pa.id));
              }
              if (typeof msg.payload.connectedDevices === 'number') {
                setConnectedDevicesCount(Math.max(1, msg.payload.connectedDevices));
              }
            } else if (
              msg.type === 'gift_events:updated' &&
              Array.isArray(msg.payload?.giftEvents)
            ) {
              const incomingDel: string[] = Array.isArray(msg.payload?.deletedGiftEventIds)
                ? msg.payload.deletedGiftEventIds
                : [];
              if (incomingDel.length > 0) {
                setDeletedGiftEventIds((prev) => Array.from(new Set([...prev, ...incomingDel])));
              }
              const deletedSet = new Set([...deletedGiftEventIdsRef.current, ...incomingDel]);
              setGiftEventsInitialized(true);
              setGiftEvents(
                (msg.payload.giftEvents as AdminGiftEventPackage[]).filter(
                  (ev) => !deletedSet.has(ev.id)
                )
              );
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
            } else if (msg.type === 'push_alert:new' && msg.payload?.alert) {
              const incomingAlert = msg.payload.alert as AppNotification;
              if (incomingAlert.id && !seenPushIdsRef.current.has(incomingAlert.id)) {
                seenPushIdsRef.current.add(incomingAlert.id);
                const resolvedMeta = inferNotificationMeta(incomingAlert.title, incomingAlert.message, {
                  category: incomingAlert.category,
                  targetView: incomingAlert.targetView,
                  targetDashboardTab: incomingAlert.targetDashboardTab,
                });
                if (isCategoryAlertEnabled(resolvedMeta.category)) {
                  setNotifications((prev) => {
                    if (prev.some((n) => n.id === incomingAlert.id)) return prev;
                    return [
                      {
                        ...incomingAlert,
                        category: resolvedMeta.category,
                        targetView: resolvedMeta.targetView,
                        targetDashboardTab: resolvedMeta.targetDashboardTab,
                        read: false,
                      },
                      ...prev,
                    ].slice(0, 180);
                  });
                  triggerMobileAndNativeNotification(
                    incomingAlert.title,
                    incomingAlert.message,
                    incomingAlert.type || 'info',
                    resolvedMeta
                  );
                }
              }
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
    const targetEmail = googleUser?.email || activeCloudEmail;
    void syncCloudUserProfile(
      { uid: firebaseUser?.uid, email: targetEmail || undefined },
      { lastAccountId: id }
    );
  };

  const setUserRole = (role: 'customer' | 'admin') => {
    setUserRoleState(role);
  };

  const setAdminUnlocked = (unlocked: boolean) => {
    setAdminUnlockedState(unlocked);
    if (unlocked && currentAccount) {
      const nextAccounts = accounts.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              hasAccessedAdminPanel: true,
              adminAccessTimestamp: new Date().toISOString(),
            }
          : a
      );
      setAccounts(nextAccounts);
      flushMasterStateToCloud({ accounts: nextAccounts });
    }
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

  const addNotification = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'alert' = 'info',
    meta?: {
      category?: NotificationCategory;
      targetView?: string;
      targetDashboardTab?: string;
      accountId?: string;
      referenceId?: string;
      skipServerBroadcast?: boolean;
    }
  ) => {
    const resolvedMeta = inferNotificationMeta(title, message, meta);
    if (!isCategoryAlertEnabled(resolvedMeta.category)) {
      return;
    }

    const notifId = `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    seenPushIdsRef.current.add(notifId);

    const newNotif: AppNotification = {
      id: notifId,
      title,
      message,
      type,
      category: resolvedMeta.category,
      targetView: resolvedMeta.targetView,
      targetDashboardTab: resolvedMeta.targetDashboardTab,
      accountId: resolvedMeta.accountId,
      referenceId: resolvedMeta.referenceId,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev].slice(0, 180));

    // Also show top mobile push banner & background Service Worker / native browser notification!
    triggerMobileAndNativeNotification(title, message, type, resolvedMeta);

    // Broadcast real-time push alert across WebSocket server if connected
    if (!meta?.skipServerBroadcast) {
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'push_alert:send',
              payload: newNotif,
            })
          );
        }
      } catch {
        // ignore WS send error
      }
    }
  };

  const emitPinSecurityAlert = (targetAccountName?: string, contextLabel?: string) => {
    addNotification(
      'Peringatan Keamanan: Percobaan PIN Gagal 🚨',
      `Terdeteksi percobaan memasukkan kode PIN yang salah${targetAccountName ? ` pada akun ${targetAccountName}` : ''}${contextLabel ? ` (${contextLabel})` : ''}. Segera periksa keamanan kartu Anda.`,
      'alert',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        skipServerBroadcast: true,
      }
    );
  };

  // Background Periodic & Tab-Hidden Multi-Notification Scheduler
  const bgNotifTickRef = useRef<number>(0);
  useEffect(() => {
    if (!notificationsEnabled || !backgroundAutoNotifEnabled || !googleUser?.hasCompletedOnboarding) {
      return;
    }

    const bgEvents: Array<{
      title: string;
      getBody: () => string;
      type: 'info' | 'success' | 'warning';
      category: NotificationCategory;
      targetDashboardTab: string;
    }> = [
      {
        title: 'Hemat 0,50% Beli Koin Spin 🪙',
        getBody: () =>
          `Beli 100 Koin hanya sekitar Rp 994.xxx–995.xxx (lebih murah 0,50% dari Spin Uang Langsung).`,
        type: 'success',
        category: 'spin',
        targetDashboardTab: 'ringkasan',
      },
      {
        title: 'Ringkasan Rekening Bank Nusantara 💳',
        getBody: () =>
          `Rekening ${currentAccount?.fullName || 'Anda'} aktif • Koin Spin: ${(
            currentAccount?.spinCoins || 0
          ).toLocaleString('id-ID')} Koin.`,
        type: 'info',
        category: 'transaksi',
        targetDashboardTab: 'mutasi',
      },
      {
        title: 'Peluang Spin Berhadiah s/d Rp 20 Juta 🎡',
        getBody: () =>
          'Coba keberuntungan Anda sekarang pakai Koin Spin atau langsung pakai Saldo Uang Rekening.',
        type: 'info',
        category: 'spin',
        targetDashboardTab: 'ringkasan',
      },
      {
        title: 'Keamanan Akun & Proteksi PIN 🔐',
        getBody: () =>
          'Notifikasi latar belakang terus memantau penguncian kartu, PIN, dan aktivitas rekening Anda.',
        type: 'warning',
        category: 'keamanan',
        targetDashboardTab: 'ringkasan',
      },
      {
        title: 'Pantau Pinjaman & Kode Redeem 🎁',
        getBody: () =>
          'Cek status pengajuan pinjaman online atau klaim Kode Redeem yang dibagikan Admin sebelum kuota penuh!',
        type: 'success',
        category: 'pinjaman',
        targetDashboardTab: 'pinjaman',
      },
    ];

    const dispatchBackgroundRound = () => {
      const idx = bgNotifTickRef.current % bgEvents.length;
      bgNotifTickRef.current += 1;
      const item = bgEvents[idx];
      addNotification(item.title, item.getBody(), item.type, {
        category: item.category,
        targetView: 'dashboard',
        targetDashboardTab: item.targetDashboardTab,
        skipServerBroadcast: true,
      });
    };

    const intervalId = window.setInterval(() => {
      dispatchBackgroundRound();
    }, 32_000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        dispatchBackgroundRound();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    notificationsEnabled,
    backgroundAutoNotifEnabled,
    googleUser?.hasCompletedOnboarding,
    currentAccount?.id,
    currentAccount?.spinCoins,
  ]);

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
    sendNotification?: boolean;
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

    const shouldNotify = input.sendNotification !== false;
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
      sendNotification: shouldNotify,
    };

    setRedeemCodes((prev) => [newRedeem, ...prev]);
    if (shouldNotify) {
      addNotification(
        'Kode Redeem Baru Dibuat 🎁',
        `Kode "${cleanCode}" senilai Rp ${input.rewardAmount.toLocaleString('id-ID')} aktif untuk ${input.maxClaims} orang selama ${input.durationMinutes} menit.`,
        'success'
      );
    }
    playAtmSound('success');
    return {
      success: true,
      message: `Kode Redeem "${cleanCode}" berhasil dibuat (${
        shouldNotify ? 'dengan notifikasi ke nasabah' : 'mode senyap tanpa notifikasi'
      })! Berlaku untuk ${input.maxClaims} orang selama ${input.durationMinutes} menit.`,
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
    const existingUserIds = accounts.map((a) => ensureAccountUserId16(a));
    const tempAccountNum = generateRandomAccountNumber(existingAccountsNumbers);
    const newUserId16 = generateRandomUserId16(existingUserIds);
    const newCardNumber = generateRandomCardNumber();
    const newCVV = generateRandomCVV();
    // Saat masuk lewat Google dan buat kartu baru, otomatis bertipe Reguler
    const finalTier: CardTier =
      googleUser?.authMode === 'google' ? 'regular' : data.cardTier || 'regular';
    const expiry = generateExpiryDate(CARD_TIER_CONFIGS[finalTier].validityYears);

    const linkedEmail = googleUser?.email || activeCloudEmail || data.email.trim();
    const newAccount: BankAccount = {
      id: `acc-${Date.now()}`,
      userId16: newUserId16,
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
      status: 'active',
      banReason: '',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: data.initialDeposit,
      createdAt: new Date().toISOString(),
      rewardPoints: 100,
      allowInternational: false,
      firebaseUid: firebaseUser?.uid,
      googleEmail: linkedEmail,
      hasCompletedTutorial: false,
      tutorialApprovedByAdmin: false,
      failedPinAttempts: 0,
    };

    const nextAccounts = [newAccount, ...accounts];
    setAccounts(nextAccounts);
    setCurrentAccountIdState(newAccount.id);
    if (googleUser) {
      setGoogleUser({ ...googleUser, hasCompletedOnboarding: true, isPinVerified: true });
    }
    void syncCloudUserProfile(
      { uid: firebaseUser?.uid, email: linkedEmail },
      {
        lastAccountId: newAccount.id,
        hasCompletedOnboarding: true,
        failedPinAttempts: 0,
      }
    );
    flushMasterStateToCloud({ accounts: nextAccounts });

    addNotification(
      'Permohonan Kartu Baru Menunggu Persetujuan Admin ⏳',
      `Pembuatan ${CARD_TIER_CONFIGS[finalTier].nameIndo} atas nama ${data.fullName} berhasil diajukan dan sedang menunggu persetujuan Admin.`,
      'info',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId: newAccount.id,
      }
    );

    return {
      success: true,
      message:
        'Permohonan kartu baru berhasil dikirim dan sedang menunggu persetujuan Admin.',
      accountId: newAccount.id,
    };
  };

  const adminApproveCard = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };

    const existingNumbers = accounts.filter((a) => a.id !== accountId).map((a) => a.accountNumber);
    const finalAccountNumber = /^\d{10}$/.test(target.accountNumber || '')
      ? target.accountNumber
      : generateRandomAccountNumber(existingNumbers);

    const nextAccounts: BankAccount[] = accounts.map((acc) => {
      if (acc.id === accountId) {
        const nextBalance =
          acc.cardTier === 'admin'
            ? UNLIMITED_BALANCE
            : acc.balance > 0
            ? acc.balance
            : acc.initialDeposit || 500_000;
        return {
          ...acc,
          accountNumber: finalAccountNumber,
          cardStatus: 'active' as const,
          balance: nextBalance,
          banInfo: undefined,
          rejectionReason: undefined,
          tutorialApprovedByAdmin: true,
          hasCompletedTutorial: true,
        };
      }
      return acc;
    });

    setAccounts(nextAccounts);

    const depositTx: Transaction = {
      id: `tx-init-${Date.now()}`,
      accountId: accountId,
      type: 'setor',
      title: 'Aktivasi & Setoran Awal Rekening',
      amount: target.balance > 0 ? target.balance : target.initialDeposit || 500_000,
      recipientAccount: finalAccountNumber,
      recipientName: target.fullName,
      description: `Aktivasi permanen ${CARD_TIER_CONFIGS[target.cardTier].nameIndo}`,
      status: 'success',
      referenceNo: `SET${Date.now()}`,
      timestamp: new Date().toISOString(),
      category: 'setor_tunai',
    };
    const nextTransactions = [depositTx, ...transactions];
    setTransactions(nextTransactions);

    // Ensure onboarding state is also marked completed so user is never asked to activate/register again
    if (!googleUser || !googleUser.hasCompletedOnboarding) {
      setGoogleUser({
        email: googleUser?.email || target.email || 'nasabah@banknusantara.id',
        name: googleUser?.name || target.fullName,
        loggedInAt: googleUser?.loggedInAt || new Date().toISOString(),
        hasCompletedOnboarding: true,
      });
    }

    // Immediate 1-click permanent flush to Server & Cloud Firestore so background sync never reverts it
    flushMasterStateToCloud({
      accounts: nextAccounts,
      transactions: nextTransactions,
    });

    addNotification(
      'Kartu Disetujui Admin & Siap Digunakan! 🎉',
      `Selamat! Pembuatan ${CARD_TIER_CONFIGS[target.cardTier].nameIndo} (${finalAccountNumber}) telah disetujui Admin dan kini aktif permanen.`,
      'success',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId,
      }
    );

    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { /* empty */ }

    playAtmSound('success');
    return {
      success: true,
      message: `Kartu ${target.fullName} (${finalAccountNumber}) berhasil diaktifkan permanen!`,
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
      'alert',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId,
      }
    );

    playAtmSound('alert');
    return { success: true, message: `Permohonan ${target.fullName} telah ditolak.` };
  };

  const toggleCardFreezeWithPin = (accountId: string, pin: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };

    if (target.pin !== pin) {
      playAtmSound('alert');
      emitPinSecurityAlert(target.fullName, 'Penguncian/Pembukaan Kunci Kartu');
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
        'warning',
        {
          category: 'security',
          targetView: 'dashboard',
          targetDashboardTab: 'ringkasan',
          accountId,
        }
      );
      playAtmSound('alert');
      return { success: true, message: 'Kartu ATM Debit berhasil dikunci sementara!', newStatus: nextStatus };
    } else {
      addNotification(
        'Blokir Kartu Dibuka 🔓',
        'Kartu ATM Mandiri Debit Anda telah dibuka blokirnya dengan verifikasi PIN.',
        'success',
        {
          category: 'security',
          targetView: 'dashboard',
          targetDashboardTab: 'ringkasan',
          accountId,
        }
      );
      playAtmSound('success');
      return { success: true, message: 'Blokir kartu berhasil dibuka!', newStatus: nextStatus };
    }
  };

  const regenerateAccountNumberWithPin = (accountId: string, pin: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan' };
    // Terima PIN Kartu ATAU Kode Admin
    if (target.pin !== pin && pin !== '159357') {
      playAtmSound('alert');
      emitPinSecurityAlert(target.fullName, 'Acak Ulang Nomor Rekening');
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
      'info',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId,
      }
    );

    playAtmSound('success');
    return { success: true, message: 'Nomor rekening baru berhasil diacak oleh sistem!', newAccountNumber: newNumber };
  };

  /**
   * LOGIN / PINDAH KE KARTU LAMA MENGGUNAKAN PIN KARTU LAMA (6 DIGIT PIN KARTU, BUKAN PIN ADMIN!)
   */
  const loginToCardWithPin = (
    targetAccountIdOrObj: string | { targetAccountId: string; cardPin: string },
    cardPinArg?: string
  ) => {
    const targetAccountId =
      typeof targetAccountIdOrObj === 'object'
        ? targetAccountIdOrObj.targetAccountId
        : targetAccountIdOrObj;
    const cardPin =
      typeof targetAccountIdOrObj === 'object'
        ? targetAccountIdOrObj.cardPin
        : cardPinArg || '';
    const targetAcc = accounts.find((a) => a.id === targetAccountId);
    if (!targetAcc) {
      playAtmSound('alert');
      return { success: false, message: 'Kartu tujuan tidak ditemukan!' };
    }

    const cleanPin = cardPin.trim();
    const isCardPinMatch = targetAcc.pin === cleanPin;
    const isAdminPinMatch = cleanPin === '159357';

    if (!isCardPinMatch && !isAdminPinMatch) {
      playAtmSound('alert');
      emitPinSecurityAlert(targetAcc.fullName, 'Login Ganti Kartu');
      return {
        success: false,
        message: `PIN salah! Untuk masuk/ganti ke kartu ${targetAcc.fullName} (${targetAcc.accountNumber}), masukkan 6 digit PIN Kartu tersebut atau PIN Admin. Jika lupa PIN, klik tombol "Lupa PIN Kartu?" untuk ditinjau Admin.`,
      };
    }

    setCurrentAccountIdState(targetAcc.id);
    const activeEmailSession = googleUser?.email || activeCloudEmail || firebaseUser?.email || '';
    if (firebaseUser || activeEmailSession) {
      const nextAccounts = accounts.map((a) =>
        a.id === targetAcc.id
          ? {
              ...a,
              firebaseUid: a.firebaseUid || firebaseUser?.uid,
              googleEmail: a.googleEmail || activeEmailSession || a.email,
            }
          : a
      );
      setAccounts(nextAccounts);
      flushMasterStateToCloud({ accounts: nextAccounts });
      void syncCloudUserProfile(
        {
          uid: firebaseUser?.uid,
          email: activeEmailSession || targetAcc.googleEmail || targetAcc.email,
        },
        {
          lastAccountId: targetAcc.id,
          hasCompletedOnboarding: true,
        }
      );
    }
    if (googleUser) {
      setGoogleUser({ ...googleUser, hasCompletedOnboarding: true, isPinVerified: true });
    } else {
      const loginEmail = normalizeEmailKey(targetAcc.googleEmail || targetAcc.email || 'nasabah@banknusantara.id');
      setActiveCloudEmail(loginEmail);
      setGoogleUser({
        email: loginEmail,
        name: targetAcc.fullName,
        authMode: 'email_direct',
        emailKey: emailToFirestoreDocId(loginEmail),
        loggedInAt: new Date().toISOString(),
        hasCompletedOnboarding: true,
        isPinVerified: true,
      });
    }

    addNotification(
      'Berhasil Login ke Kartu Anda! 💳',
      `Anda telah berhasil masuk ke kartu milik ${targetAcc.fullName} (No. Rekening: ${targetAcc.accountNumber}) menggunakan ${
        isAdminPinMatch && !isCardPinMatch ? 'otorisasi PIN Admin' : 'verifikasi 6 digit PIN Kartu'
      }.`,
      'success',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId: targetAcc.id,
      }
    );
    playAtmSound('success');

    return {
      success: true,
      message: `Berhasil login ke kartu ${targetAcc.fullName} (${targetAcc.accountNumber})!`,
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
    const checkExpiredAndScheduledBans = () => {
      const currentAccounts = accountsRef.current;
      const now = Date.now();

      // 1. Cek apakah ada Banned Terjadwal yang waktunya sudah tiba
      const readyScheduledList = currentAccounts.filter(
        (acc) =>
          acc.cardStatus !== 'banned' &&
          acc.scheduledBanConfig?.scheduledStartAt &&
          now >= new Date(acc.scheduledBanConfig.scheduledStartAt).getTime()
      );

      if (readyScheduledList.length > 0) {
        const activatedAccounts: BankAccount[] = currentAccounts.map((acc) => {
          const sched = acc.scheduledBanConfig;
          if (!sched || !readyScheduledList.some((r) => r.id === acc.id)) return acc;
          const computed = computeDurationMinutesAndLabel(sched);
          const expiresAt =
            sched.durationType === 'custom' && computed.durationMinutes
              ? new Date(now + computed.durationMinutes * 60 * 1000).toISOString()
              : undefined;
          const resolvedReason =
            sched.reasonMode === 'none' || !sched.showReasonBox ? '' : (sched.reason || '').trim();
          const finalCustomCfg: BanScreenCustomizationConfig = {
            ...sched,
            scheduledStartAt: undefined,
            bannedAt: new Date(now).toISOString(),
            expiresAt,
            durationMinutes: computed.durationMinutes,
            durationLabel: computed.durationLabel,
            reason: resolvedReason,
          };
          return {
            ...acc,
            status: 'banned' as const,
            banReason: resolvedReason,
            cardStatus: 'banned' as const,
            scheduledBanConfig: undefined,
            banInfo: {
              isBanned: true,
              reason: resolvedReason || undefined,
              durationType: sched.durationType,
              durationMinutes: computed.durationMinutes,
              durationLabel: computed.durationLabel,
              bannedAt: new Date(now).toISOString(),
              expiresAt,
              appealStatus: 'none' as const,
              appealCount: 0,
              customConfig: finalCustomCfg,
            },
          };
        });
        setAccounts(activatedAccounts);
        readyScheduledList.forEach((schedAcc) => {
          const updatedAcc = activatedAccounts.find((a) => a.id === schedAcc.id);
          if (!updatedAcc?.banInfo) return;
          void syncCloudUserProfile(
            {
              uid: updatedAcc.firebaseUid,
              email: updatedAcc.googleEmail || updatedAcc.email,
              fallbackEmail: updatedAcc.email,
            },
            {
              status: 'banned',
              banReason: updatedAcc.banReason || '',
              banExpiresAt: updatedAcc.banInfo.expiresAt || '',
              banDurationLabel: updatedAcc.banInfo.durationLabel,
              banCustomConfig: updatedAcc.banInfo.customConfig,
              appealStatus: 'none',
            }
          );
        });
        flushMasterStateToCloud({ accounts: activatedAccounts });
      }

      // 2. Cek apakah ada Banned Trial / Sementara yang waktunya sudah habis
      const latestAccounts = readyScheduledList.length > 0 ? accountsRef.current : currentAccounts;
      const expiredList = latestAccounts.filter(
        (acc) =>
          (acc.cardStatus === 'banned' || acc.status === 'banned') &&
          acc.banInfo?.durationType === 'custom' &&
          acc.banInfo?.expiresAt &&
          now >= new Date(acc.banInfo.expiresAt).getTime()
      );

      if (expiredList.length > 0) {
        const nextAccounts: BankAccount[] = latestAccounts.map((acc) =>
          expiredList.some((exp) => exp.id === acc.id)
            ? {
                ...acc,
                status: 'active' as const,
                banReason: '',
                cardStatus: 'active' as const,
                banInfo: undefined,
                failedPinAttempts: 0,
              }
            : acc
        );
        setAccounts(nextAccounts);
        expiredList.forEach((exp) => {
          void syncCloudUserProfile(
            {
              uid: exp.firebaseUid,
              email: exp.googleEmail || exp.email,
              fallbackEmail: exp.email,
            },
            {
              status: 'active',
              banReason: '',
              banExpiresAt: '',
              banDurationLabel: '',
              failedPinAttempts: 0,
            }
          );
          appendBanAuditLog({
            action: 'auto_unban',
            targetAccountId: exp.id,
            targetAccountName: exp.fullName,
            targetAccountNumber: exp.accountNumber,
            targetEmail: exp.googleEmail || exp.email,
            durationLabel: exp.banInfo?.durationLabel || 'Sementara',
            reasonSummary: 'Waktu Banned Trial selesai — Otomatis Unban Real-Time',
            caseId: exp.banInfo?.customConfig?.caseId,
          });
        });
        flushMasterStateToCloud({ accounts: nextAccounts });

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

    checkExpiredAndScheduledBans();
    const intervalId = setInterval(checkExpiredAndScheduledBans, 1000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adminBanCard = (input: {
    accountId: string;
    reason?: string;
    durationType: 'custom' | 'permanent';
    durationMinutes?: number;
    durationLabel?: string;
  }) => {
    const baseTemplate = banSupportConfig.defaultTemplate || DEFAULT_BAN_SCREEN_CONFIG;
    const cleanReason = input.reason?.trim() || '';
    const customConfig: BanScreenCustomizationConfig = {
      ...baseTemplate,
      durationType: input.durationType,
      durationValue: input.durationMinutes || 60,
      durationUnit: 'minutes',
      durationMinutes: input.durationMinutes,
      durationLabel:
        input.durationType === 'permanent'
          ? 'PERMANEN'
          : input.durationLabel || `${input.durationMinutes || 1} Menit`,
      reasonMode: cleanReason ? 'custom' : 'none',
      reason: cleanReason,
      showReasonBox: Boolean(cleanReason),
      caseId: generateBanCaseId(),
      bannedAt: new Date().toISOString(),
    };
    return adminApplyCustomBanConfig({
      targetAccountIds: [input.accountId],
      config: customConfig,
      isUpdateExisting: false,
    });
  };

  /**
   * Terapkan atau Perbarui Konfigurasi Banned Lengkap dari Studio Live Preview
   * Mendukung 1 akun, banyak akun, atau semua akun sekaligus + Banned Langsung atau Terjadwal
   */
  const adminApplyCustomBanConfig = (input: {
    targetAccountIds: string[];
    config: BanScreenCustomizationConfig;
    isUpdateExisting?: boolean;
  }): { success: boolean; message: string; count: number } => {
    const targetAccounts = accounts.filter((a) => input.targetAccountIds.includes(a.id));
    if (targetAccounts.length === 0) {
      return { success: false, message: 'Pilih minimal 1 akun nasabah terlebih dahulu!', count: 0 };
    }

    const now = Date.now();
    const nowIso = new Date(now).toISOString();
    const isScheduledFuture =
      Boolean(input.config.scheduledStartAt) &&
      new Date(input.config.scheduledStartAt!).getTime() > now + 5000;

    const computed = computeDurationMinutesAndLabel(input.config);
    const expiresAt =
      input.config.durationType === 'custom' && computed.durationMinutes
        ? new Date(now + computed.durationMinutes * 60 * 1000).toISOString()
        : undefined;

    const cleanReason =
      input.config.reasonMode === 'none' || !input.config.showReasonBox
        ? ''
        : (input.config.reason || '').trim();

    const nextAccounts: BankAccount[] = accounts.map((acc) => {
      if (!input.targetAccountIds.includes(acc.id)) return acc;
      const caseId =
        input.isUpdateExisting && acc.banInfo?.customConfig?.caseId
          ? acc.banInfo.customConfig.caseId
          : input.config.caseId || generateBanCaseId();
      const bannedAtVal =
        input.isUpdateExisting && acc.banInfo?.bannedAt ? acc.banInfo.bannedAt : nowIso;

      const finalCfg: BanScreenCustomizationConfig = {
        ...input.config,
        reason: cleanReason,
        showReasonBox: Boolean(cleanReason) && input.config.showReasonBox,
        durationMinutes: computed.durationMinutes,
        durationLabel: computed.durationLabel,
        caseId,
        bannedAt: bannedAtVal,
        expiresAt,
      };

      if (isScheduledFuture) {
        return {
          ...acc,
          scheduledBanConfig: finalCfg,
        };
      }

      return {
        ...acc,
        status: 'banned' as const,
        banReason: cleanReason,
        cardStatus: 'banned' as const,
        scheduledBanConfig: undefined,
        banInfo: {
          isBanned: true,
          reason: cleanReason || undefined,
          durationType: input.config.durationType,
          durationMinutes: computed.durationMinutes,
          durationLabel: computed.durationLabel,
          bannedAt: bannedAtVal,
          expiresAt,
          appealStatus: input.isUpdateExisting ? acc.banInfo?.appealStatus || 'none' : 'none',
          appealNote: input.isUpdateExisting ? acc.banInfo?.appealNote : undefined,
          appealCategory: input.isUpdateExisting ? acc.banInfo?.appealCategory : undefined,
          appealPromiseAccepted: input.isUpdateExisting
            ? acc.banInfo?.appealPromiseAccepted
            : undefined,
          appealCount: input.isUpdateExisting ? acc.banInfo?.appealCount || 0 : 0,
          appealAdminNote: input.isUpdateExisting ? acc.banInfo?.appealAdminNote : undefined,
          customConfig: finalCfg,
        },
      };
    });

    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });

    if (!isScheduledFuture) {
      targetAccounts.forEach((target) => {
        const updated = nextAccounts.find((a) => a.id === target.id);
        const targetUid =
          target.firebaseUid ||
          (firebaseUser &&
          ((target.googleEmail &&
            normalizeEmailKey(target.googleEmail) === normalizeEmailKey(firebaseUser.email || '')) ||
            target.id === currentAccountId)
            ? firebaseUser.uid
            : undefined);

        void syncCloudUserProfile(
          {
            uid: targetUid,
            email: target.googleEmail || target.email,
            fallbackEmail: target.email,
          },
          {
            status: 'banned',
            banReason: cleanReason,
            banExpiresAt: expiresAt || '',
            banDurationLabel: computed.durationLabel,
            banCustomConfig: updated?.banInfo?.customConfig,
            ...(input.isUpdateExisting ? {} : { appealStatus: 'none', appealCount: 0 }),
          }
        );

        appendBanAuditLog({
          action: input.isUpdateExisting ? 'update_ban' : 'ban',
          targetAccountId: target.id,
          targetAccountName: target.fullName,
          targetAccountNumber: target.accountNumber,
          targetEmail: target.googleEmail || target.email,
          durationLabel: computed.durationLabel,
          reasonSummary: cleanReason || '(Tanpa Alasan / Kosong)',
          caseId: updated?.banInfo?.customConfig?.caseId,
        });

        addNotification(
          input.isUpdateExisting
            ? `⚙️ Pengaturan Banned Diperbarui (${computed.durationLabel})`
            : `🚫 Kartu Di-BANNED (${computed.durationLabel})`,
          `Akun ${target.fullName} (${target.accountNumber}) ${
            input.isUpdateExisting ? 'telah diperbarui status Banned-nya' : 'telah di-BANNED oleh Admin'
          }.${cleanReason ? ` Alasan: "${cleanReason}".` : ''}`,
          'alert',
          {
            category: 'keamanan',
            targetView: 'dashboard',
            targetDashboardTab: 'ringkasan',
            accountId: target.id,
          }
        );
      });
    }

    playAtmSound('alert');
    return {
      success: true,
      count: targetAccounts.length,
      message: isScheduledFuture
        ? `Jadwal Banned berhasil disimpan untuk ${targetAccounts.length} akun pada ${new Date(
            input.config.scheduledStartAt!
          ).toLocaleString('id-ID')}!`
        : input.isUpdateExisting
        ? `Pengaturan Banned untuk ${targetAccounts.length} akun berhasil diperbarui dan langsung berubah real-time!`
        : `Berhasil menerapkan Banned (${computed.durationLabel}) pada ${targetAccounts.length} akun secara real-time!`,
    };
  };

  const adminSaveDefaultBanTemplate = (
    template: BanScreenCustomizationConfig
  ): { success: boolean; message: string } => {
    const nextConfig: BanSupportConfig = {
      ...banSupportConfig,
      defaultTemplate: { ...template },
      updatedAt: new Date().toISOString(),
    };
    setBanSupportConfig(nextConfig);
    flushMasterStateToCloud({ banSupportConfig: nextConfig });
    playAtmSound('success');
    return {
      success: true,
      message: 'Template Global Default Layar Banned berhasil disimpan ke Cloud Firestore!',
    };
  };

  const adminSaveBanPreset = (input: {
    name: string;
    description?: string;
    config: BanScreenCustomizationConfig;
  }): { success: boolean; message: string } => {
    const cleanName = input.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Nama preset konfigurasi tidak boleh kosong.' };
    }
    const newPreset: BanConfigPreset = {
      id: `preset-custom-${Date.now()}`,
      name: cleanName,
      description: input.description?.trim() || `${input.config.durationLabel} • Tema ${input.config.theme}`,
      createdAt: new Date().toISOString(),
      config: { ...input.config },
    };
    const nextPresets = [newPreset, ...(banSupportConfig.savedPresets || DEFAULT_BAN_CONFIG_PRESETS)];
    const nextConfig: BanSupportConfig = {
      ...banSupportConfig,
      savedPresets: nextPresets,
      updatedAt: new Date().toISOString(),
    };
    setBanSupportConfig(nextConfig);
    flushMasterStateToCloud({ banSupportConfig: nextConfig });
    playAtmSound('success');
    return {
      success: true,
      message: `Preset Konfigurasi Banned "${cleanName}" berhasil disimpan ke Cloud!`,
    };
  };

  const adminDeleteBanPreset = (presetId: string): { success: boolean; message: string } => {
    const nextPresets = (banSupportConfig.savedPresets || DEFAULT_BAN_CONFIG_PRESETS).filter(
      (p) => p.id !== presetId
    );
    const nextConfig: BanSupportConfig = {
      ...banSupportConfig,
      savedPresets: nextPresets,
      updatedAt: new Date().toISOString(),
    };
    setBanSupportConfig(nextConfig);
    flushMasterStateToCloud({ banSupportConfig: nextConfig });
    return {
      success: true,
      message: 'Preset konfigurasi Banned berhasil dihapus.',
    };
  };

  const adminUnbanCard = (accountId: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Kartu nasabah tidak ditemukan!' };

    const prevDurationLabel = target.banInfo?.durationLabel || 'Banned';
    const prevCaseId = target.banInfo?.customConfig?.caseId;

    const nextAccounts: BankAccount[] = accounts.map((acc) =>
      acc.id === accountId
        ? {
            ...acc,
            status: 'active' as const,
            banReason: '',
            cardStatus: 'active' as const,
            banInfo: undefined,
            scheduledBanConfig: undefined,
            failedPinAttempts: 0,
          }
        : acc
    );
    setAccounts(nextAccounts);

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
    const nextPopups = [unbanPopup, ...websitePopups];
    setWebsitePopups(nextPopups);
    flushMasterStateToCloud({ accounts: nextAccounts, websitePopups: nextPopups });

    const targetUid =
      target.firebaseUid ||
      (firebaseUser &&
      ((target.googleEmail && normalizeEmailKey(target.googleEmail) === normalizeEmailKey(firebaseUser.email || '')) ||
        target.id === currentAccountId)
        ? firebaseUser.uid
        : undefined);
    void syncCloudUserProfile(
      {
        uid: targetUid,
        email: target.googleEmail || target.email,
        fallbackEmail: target.email,
      },
      {
        status: 'active',
        banReason: '',
        banExpiresAt: '',
        banDurationLabel: '',
        appealStatus: 'approved',
        failedPinAttempts: 0,
      }
    );

    appendBanAuditLog({
      action: 'unban',
      targetAccountId: target.id,
      targetAccountName: target.fullName,
      targetAccountNumber: target.accountNumber,
      targetEmail: target.googleEmail || target.email,
      durationLabel: prevDurationLabel,
      reasonSummary: 'Dibuka Banned (Unban) oleh Admin',
      caseId: prevCaseId,
    });

    addNotification(
      '🔓 Sistem Website: Banned Kartu Telah Dibuka!',
      `Status BANNED pada kartu ${target.fullName} (${target.accountNumber}) telah dibuka. Kartu kini kembali AKTIF.`,
      'success',
      {
        category: 'keamanan',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId: target.id,
      }
    );
    try {
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
    } catch { /* empty */ }
    playAtmSound('success');
    return {
      success: true,
      message: `Status Banned pada kartu ${target.fullName} (${target.accountNumber}) berhasil dibuka & disinkronkan real-time!`,
    };
  };

  const adminUnbanAllCards = () => {
    const bannedList = accounts.filter((a) => a.cardStatus === 'banned' || a.status === 'banned');
    if (bannedList.length === 0) {
      return { success: false, message: 'Tidak ada kartu yang sedang di-banned saat ini.', count: 0 };
    }
    const nextAccounts: BankAccount[] = accounts.map((acc) =>
      acc.cardStatus === 'banned' || acc.status === 'banned'
        ? {
            ...acc,
            status: 'active' as const,
            banReason: '',
            cardStatus: 'active' as const,
            banInfo: undefined,
            scheduledBanConfig: undefined,
            failedPinAttempts: 0,
          }
        : acc
    );
    setAccounts(nextAccounts);
    const newPopups: WebsiteSystemPopupNotification[] = bannedList.map((acc) => ({
      id: `sys-unban-all-${Date.now()}-${acc.id}`,
      type: 'unban',
      title: '🔓 KARTU ANDA TELAH DIBUKA KEMBALI!',
      subtitle: 'NOTIFIKASI RESMI DARI SISTEM WEBSITE BANK NUSANTARA',
      message: `Pemberitahuan Sistem Website: Status Banned pada kartu ATM atas nama ${acc.fullName} (No. Rekening: ${acc.accountNumber}) telah resmi DIBUKA! Kartu Anda kini kembali AKTIF.`,
      accountId: acc.id,
      accountName: acc.fullName,
      accountNumber: acc.accountNumber,
      cardTier: acc.cardTier,
      timestamp: new Date().toISOString(),
      dismissed: false,
    }));
    const nextPopups = [...newPopups, ...websitePopups];
    setWebsitePopups(nextPopups);
    flushMasterStateToCloud({ accounts: nextAccounts, websitePopups: nextPopups });
    bannedList.forEach((acc) => {
      void syncCloudUserProfile(
        {
          uid: acc.firebaseUid,
          email: acc.googleEmail || acc.email,
          fallbackEmail: acc.email,
        },
        {
          status: 'active',
          banReason: '',
          banExpiresAt: '',
          banDurationLabel: '',
          appealStatus: 'approved',
          failedPinAttempts: 0,
        }
      );
      appendBanAuditLog({
        action: 'unban',
        targetAccountId: acc.id,
        targetAccountName: acc.fullName,
        targetAccountNumber: acc.accountNumber,
        targetEmail: acc.googleEmail || acc.email,
        durationLabel: acc.banInfo?.durationLabel || 'Banned',
        reasonSummary: 'Mass Unban oleh Admin',
        caseId: acc.banInfo?.customConfig?.caseId,
      });
    });
    playAtmSound('success');
    return {
      success: true,
      message: `Seluruh ${bannedList.length} kartu yang di-banned berhasil dibuka kembali!`,
      count: bannedList.length,
    };
  };

  const submitCardBanAppeal = (accountId: string, appealNote?: string) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target || (target.cardStatus !== 'banned' && target.status !== 'banned')) {
      return { success: false, message: 'Kartu ini tidak dalam status Banned.' };
    }

    const nowIso = new Date().toISOString();
    const cleanNote =
      appealNote?.trim() || 'Nasabah mengajukan permohonan tinjauan pembukaan Banned Akun.';
    const nextAccounts: BankAccount[] = accounts.map((acc) =>
      acc.id === accountId
        ? {
            ...acc,
            banInfo: {
              ...(acc.banInfo || {
                isBanned: true,
                durationType: 'permanent' as const,
                durationLabel: 'PERMANEN',
                bannedAt: nowIso,
                reason: acc.banReason,
              }),
              appealStatus: 'pending' as const,
              appealNote: cleanNote,
              appealSource: 'in_app' as const,
              appealRequestedAt: nowIso,
            },
          }
        : acc
    );
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    void syncCloudUserProfile(
      {
        uid: target.firebaseUid,
        email: target.googleEmail || target.email,
        fallbackEmail: target.email,
      },
      {
        appealStatus: 'pending',
        appealNote: cleanNote,
        appealSource: 'in_app',
        appealRequestedAt: nowIso,
      }
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

  const adminVerifyAllAccounts = (verified: boolean, customLabel?: string) => {
    setAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        isVerified: verified,
        verifiedAt: verified ? new Date().toISOString() : undefined,
        verifiedLabel: verified
          ? customLabel?.trim() || acc.verifiedLabel || 'Akun Terverifikasi Resmi (Centang Biru Bank Nusantara)'
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
    modeOrAmountArg?: 'add' | 'subtract' | 'set' | 'unlimited' | number,
    amountOrModeArg?: number | 'add' | 'subtract' | 'set' | 'unlimited',
    noteArg?: string
  ) => {
    const accountId = typeof accountIdOrObj === 'object' ? accountIdOrObj.accountId : accountIdOrObj;
    const mode: 'add' | 'subtract' | 'set' | 'unlimited' =
      typeof accountIdOrObj === 'object'
        ? accountIdOrObj.mode
        : typeof modeOrAmountArg === 'string'
        ? modeOrAmountArg
        : typeof amountOrModeArg === 'string'
        ? amountOrModeArg
        : 'add';
    const amount: number =
      typeof accountIdOrObj === 'object'
        ? accountIdOrObj.amount
        : typeof modeOrAmountArg === 'number'
        ? modeOrAmountArg
        : typeof amountOrModeArg === 'number'
        ? amountOrModeArg
        : 0;
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

    const nextAccounts = accounts.map((acc) =>
      acc.id === accountId ? { ...acc, pin: newPin.trim() } : acc
    );
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });

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
    newCardNumberOrObj:
      | string
      | {
          cardNumber?: string;
          cvv?: string;
          expiryDate?: string;
        },
    newCvvArg?: string,
    newExpiryArg?: string
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const rawCardNum =
      typeof newCardNumberOrObj === 'object' ? newCardNumberOrObj.cardNumber || '' : newCardNumberOrObj;
    const rawCvv =
      typeof newCardNumberOrObj === 'object' ? newCardNumberOrObj.cvv || '' : newCvvArg || '';
    const rawExp =
      typeof newCardNumberOrObj === 'object' ? newCardNumberOrObj.expiryDate || '' : newExpiryArg || '';
    const formattedCard = rawCardNum.trim() || target.cardNumber;
    const formattedCvv = rawCvv.trim() || target.cvv;
    const formattedExp = rawExp.trim() || target.expiryDate;
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
    userId16?: string;
    pin: string;
    oaAdminPin?: string;
    balance?: number;
    initialBalance?: number;
    cardTier: CardTier;
    isVerified?: boolean;
  }) => {
    const cleanName = input.fullName.trim();
    if (!cleanName) return { success: false, message: 'Nama lengkap nasabah wajib diisi!' };
    const cleanPin = input.pin.replace(/\D/g, '').slice(0, 6);
    if (cleanPin.length !== 6) return { success: false, message: 'PIN harus 6 digit angka!' };
    const baseBalance = input.balance ?? input.initialBalance ?? 0;

    const existingNums = accounts.map((a) => a.accountNumber);
    const existingIds = accounts.map((a) => ensureAccountUserId16(a));
    const accNum =
      input.accountNumber && input.accountNumber.replace(/\D/g, '').length >= 6
        ? input.accountNumber.replace(/\D/g, '')
        : generateRandomAccountNumber(existingNums);
    const cleanId16 =
      input.userId16 && input.userId16.replace(/\D/g, '').length === 16
        ? input.userId16.replace(/\D/g, '')
        : generateRandomUserId16(existingIds);
    const cleanOaPin =
      input.oaAdminPin && /^\d{6}$/.test(input.oaAdminPin.trim())
        ? input.oaAdminPin.trim()
        : '159357';

    const newAcc: BankAccount = {
      id: `acc-inst-${Date.now()}`,
      userId16: cleanId16,
      accountNumber: accNum,
      fullName: cleanName,
      nik: `3171${Math.floor(100000000000 + Math.random() * 899999999999)}`,
      phone: `0812${Math.floor(10000000 + Math.random() * 89999999)}`,
      email: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nusantara.id`,
      address: 'Kantor Cabang Utama Bank Nusantara',
      pin: cleanPin,
      balance: input.cardTier === 'admin' ? UNLIMITED_BALANCE : Math.max(0, baseBalance),
      cardTier: input.cardTier,
      cardNumber: generateRandomCardNumber(),
      cvv: generateRandomCVV(),
      expiryDate: input.cardTier === 'admin' ? '∞ / SELAMANYA' : generateExpiryDate(5),
      cardStatus: 'active',
      status: 'active',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: baseBalance,
      createdAt: new Date().toISOString(),
      rewardPoints: 1000,
      allowInternational: true,
      isVerified: Boolean(input.isVerified),
      verifiedAt: input.isVerified ? new Date().toISOString() : undefined,
      verifiedLabel: input.isVerified ? 'Nasabah VIP Instan Terverifikasi' : undefined,
      hasCompletedTutorial: true,
      tutorialApprovedByAdmin: true,
      isOfficialAdminAccount: true,
      oaAdminPin: cleanOaPin,
    };

    const nextAccounts = [newAcc, ...accounts];
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    playAtmSound('success');
    return {
      success: true,
      message: `Akun OA "${cleanName}" (ID 16 Digit: ${formatUserId16(cleanId16)}, No. Rek: ${accNum}, PIN Kartu: ${cleanPin}, PIN Admin OA: ${cleanOaPin}) langsung dibuat & AKTIF!`,
    };
  };

  const adminCreateFullCustomAccount = (
    input: AdminFullCustomAccountInput
  ): { success: boolean; message: string; account?: BankAccount } => {
    const cleanName = (input.fullName || '').trim();
    if (!cleanName) {
      return { success: false, message: 'Nama lengkap pemilik akun wajib diisi!' };
    }

    const existingNums = accounts.map((a) => a.accountNumber);
    const existingIds = accounts.map((a) => ensureAccountUserId16(a));

    const rawAcct = (input.accountNumber || '').replace(/\D/g, '');
    const finalAccountNumber =
      rawAcct.length >= 6 && rawAcct.length <= 16
        ? rawAcct
        : generateRandomAccountNumber(existingNums);

    if (accounts.some((a) => a.accountNumber === finalAccountNumber)) {
      return {
        success: false,
        message: `Nomor Rekening ${finalAccountNumber} sudah dipakai akun lain. Silakan klik Acak Otomatis atau ganti nomornya.`,
      };
    }

    const rawId16 = (input.userId16 || '').replace(/\D/g, '');
    const finalUserId16 =
      rawId16.length === 16 ? rawId16 : generateRandomUserId16(existingIds);

    if (accounts.some((a) => ensureAccountUserId16(a) === finalUserId16)) {
      return {
        success: false,
        message: `ID 16 Digit ${formatUserId16(finalUserId16)} sudah dipakai akun lain. Silakan klik Acak Otomatis atau ubah angkanya.`,
      };
    }

    const rawPin = (input.pin || '').replace(/\D/g, '');
    const finalPin = rawPin.length === 6 ? rawPin : generateRandomPin6();

    const rawOaPin = (input.oaAdminPin || '').replace(/\D/g, '');
    const finalOaAdminPin = rawOaPin.length === 6 ? rawOaPin : '159357';

    const rawCardDigits = (input.cardNumber || '').replace(/\D/g, '');
    const finalCardNumber =
      rawCardDigits.length === 16
        ? rawCardDigits.replace(/(\d{4})(?=\d)/g, '$1 ')
        : generateRandomCardNumber();

    const rawCvv = (input.cvv || '').replace(/\D/g, '');
    const finalCvv = rawCvv.length === 3 ? rawCvv : generateRandomCVV();

    const finalExpiry =
      input.expiryDate && input.expiryDate.trim()
        ? input.expiryDate.trim()
        : input.cardTier === 'admin'
        ? '∞ / SELAMANYA'
        : generateExpiryDate(CARD_TIER_CONFIGS[input.cardTier]?.validityYears || 5);

    const rawNik = (input.nik || '').replace(/\D/g, '');
    const finalNik =
      rawNik.length === 16
        ? rawNik
        : `3171${Math.floor(100000000000 + Math.random() * 899999999999)}`;

    const finalPhone =
      input.phone && input.phone.trim()
        ? input.phone.trim()
        : `0812${Math.floor(10000000 + Math.random() * 89999999)}`;

    const finalEmail =
      input.email && input.email.trim()
        ? normalizeEmailKey(input.email.trim())
        : '';

    const finalAddress =
      input.address && input.address.trim()
        ? input.address.trim()
        : 'Menara Otoritas Bank Nusantara Digital';

    const finalBalance =
      input.isUnlimitedBalance || input.cardTier === 'admin'
        ? UNLIMITED_BALANCE
        : Math.max(0, Number(input.balance) || 0);

    const goldGrams = Math.max(0, Number(input.goldGrams) || 0);
    const goldPrice = goldMarketConfig.currentPricePerGram || 1_400_000;
    const nowIso = new Date().toISOString();
    const goldBatches: GoldBatchRecord[] =
      goldGrams > 0
        ? [
            {
              id: `gold-oa-${Date.now()}`,
              purchasedAt: nowIso,
              purchaseDateKey: nowIso.split('T')[0],
              grams: goldGrams,
              costRupiah: Math.round(goldGrams * goldPrice),
              pricePerGramAtBuy: goldPrice,
              goldForm: 'batangan',
              motif: 'nusantara',
              note: 'Modal Emas Awal Akun OA Panel Admin',
            },
          ]
        : [];

    const empireBusinesses: Record<string, number> = {};
    if (input.grantAllSultanBusinesses) {
      const units = Math.max(1, Number(input.sultanBusinessUnitsEach) || 5);
      SULTAN_BUSINESS_CATALOG.forEach((b) => {
        empireBusinesses[b.id] = units;
      });
    }

    const newAcc: BankAccount = {
      id: `acc-oa-${Date.now()}`,
      userId16: finalUserId16,
      accountNumber: finalAccountNumber,
      fullName: cleanName,
      nik: finalNik,
      phone: finalPhone,
      email: finalEmail,
      googleEmail: finalEmail || undefined,
      address: finalAddress,
      pin: finalPin,
      balance: finalBalance,
      cardTier: input.cardTier,
      cardNumber: finalCardNumber,
      cvv: finalCvv,
      expiryDate: finalExpiry,
      cardStatus: 'active',
      status: 'active',
      banReason: '',
      dailyWithdrawnToday: 0,
      lastWithdrawalDate: '',
      initialDeposit: finalBalance === UNLIMITED_BALANCE ? UNLIMITED_BALANCE : finalBalance,
      createdAt: nowIso,
      rewardPoints:
        input.rewardPoints !== undefined ? Math.max(0, Number(input.rewardPoints)) : 5000,
      pulsaBalance:
        input.pulsaBalance !== undefined ? Math.max(0, Number(input.pulsaBalance)) : 0,
      plnKwhBalance:
        input.plnKwhBalance !== undefined ? Math.max(0, Number(input.plnKwhBalance)) : 0,
      allowInternational: input.allowInternational !== undefined ? input.allowInternational : true,
      customSpendingLimit:
        input.customSpendingLimit !== undefined
          ? Math.max(0, Number(input.customSpendingLimit))
          : CARD_TIER_CONFIGS[input.cardTier]?.dailyWithdrawalLimit || 10_000_000,
      isVerified: Boolean(input.isVerified),
      verifiedAt: input.isVerified ? nowIso : undefined,
      verifiedLabel: input.isVerified
        ? input.verifiedLabel?.trim() || 'Akun OA Resmi Terverifikasi Admin'
        : undefined,
      jobLevel: Math.min(50, Math.max(1, Number(input.jobLevel) || 1)),
      levelVouchers: Math.max(0, Number(input.levelVouchers) || 0),
      clickPower: Math.max(1, Number(input.clickPower) || 1),
      salaryMultiplier: Math.max(1, Number(input.salaryMultiplier) || 1),
      cashbackPercent: Math.max(0, Number(input.cashbackPercent) || 0),
      vipShieldActive: Boolean(input.vipShieldActive),
      spinCoins: Math.max(0, Number(input.spinCoins) || 0),
      goldGrams,
      goldBatches,
      empireBusinesses,
      devRoleId: input.devRoleId || null,
      hasCompletedTutorial: true,
      tutorialApprovedByAdmin: true,
      isOfficialAdminAccount: input.isOfficialAdminAccount !== false,
      oaAdminPin: finalOaAdminPin,
      failedPinAttempts: 0,
    };

    const nextAccounts = [newAcc, ...accounts];
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    playAtmSound('cash');

    return {
      success: true,
      account: newAcc,
      message: `🎉 Akun OA "${cleanName}" berhasil dibuat & langsung AKTIF! (No. Rek: ${finalAccountNumber} • ID 16 Digit: ${formatUserId16(
        finalUserId16
      )} • PIN Kartu: ${finalPin} • PIN Admin OA: ${finalOaAdminPin})`,
    };
  };

  const adminToggleOaAccountStatus = (
    accountId: string,
    enabled: boolean,
    customOaAdminPin?: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan!' };

    const cleanOaPin =
      customOaAdminPin && /^\d{6}$/.test(customOaAdminPin.trim())
        ? customOaAdminPin.trim()
        : target.oaAdminPin || '159357';

    const nextAccounts = accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            userId16: ensureAccountUserId16(a),
            isOfficialAdminAccount: enabled,
            oaAdminPin: cleanOaPin,
            ...(enabled
              ? {
                  cardStatus: a.cardStatus === 'pending' ? ('active' as const) : a.cardStatus,
                  hasCompletedTutorial: true,
                  tutorialApprovedByAdmin: true,
                }
              : {}),
          }
        : a
    );
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    playAtmSound('success');
    return {
      success: true,
      message: enabled
        ? `✅ Akun "${target.fullName}" kini berstatus AKUN OA RESMI dan bisa login lewat menu "Login Dengan Akun OA" (PIN Admin OA: ${cleanOaPin})!`
        : `Status Akun OA pada "${target.fullName}" telah dinonaktifkan.`,
    };
  };

  const loginWithOaAccount = async (input: {
    accountNumber: string;
    userId16: string;
    cardPin: string;
    adminPin: string;
  }): Promise<{ success: boolean; message: string }> => {
    const cleanAccNum = (input.accountNumber || '').replace(/\D/g, '').trim();
    const cleanUserId16 = (input.userId16 || '').replace(/\D/g, '').trim();
    const cleanCardPin = (input.cardPin || '').replace(/\D/g, '').trim();
    const cleanAdminPin = (input.adminPin || '').replace(/\D/g, '').trim();

    if (!cleanAccNum || !cleanUserId16 || !cleanCardPin || !cleanAdminPin) {
      playAtmSound('alert');
      return {
        success: false,
        message:
          'Wajib mengisi keempat kolom: Nomor Rekening, ID 16 Digit, PIN Kartu, dan PIN Admin!',
      };
    }

    if (cleanUserId16.length !== 16) {
      playAtmSound('alert');
      return {
        success: false,
        message: `ID User harus tepat 16 digit angka (saat ini ${cleanUserId16.length} digit).`,
      };
    }

    if (cleanCardPin.length !== 6) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'PIN Kartu harus tepat 6 digit angka.',
      };
    }

    // Ambil state terbaru dari Cloud terlebih dahulu agar Akun OA yang baru dibuat di perangkat lain langsung terbaca
    let latestAccounts: BankAccount[] = accounts;
    try {
      const snap = await getDocFromServer(doc(db, 'bank_state_v1', 'master_state')).catch(() =>
        getDoc(doc(db, 'bank_state_v1', 'master_state'))
      );
      if (snap && snap.exists()) {
        const masterData = snap.data();
        if (Array.isArray(masterData.accounts)) {
          latestAccounts = (masterData.accounts as BankAccount[]).map((a) => ({
            ...a,
            userId16: ensureAccountUserId16(a),
            isOfficialAdminAccount: Boolean(a.isOfficialAdminAccount || a.id === 'acc-admin'),
            oaAdminPin: a.oaAdminPin || '159357',
          }));
          setAccounts(latestAccounts);
        }
      }
    } catch {
      // Gunakan state lokal jika sedang offline
    }

    const byAccountNum = latestAccounts.find((a) => a.accountNumber === cleanAccNum);
    if (!byAccountNum) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Nomor Rekening "${cleanAccNum}" tidak ditemukan di database Bank Nusantara.`,
      };
    }

    const accountId16 = ensureAccountUserId16(byAccountNum);
    if (accountId16 !== cleanUserId16) {
      playAtmSound('alert');
      return {
        success: false,
        message:
          'ID 16 Digit tidak cocok dengan Nomor Rekening tersebut! Periksa kembali ID 16 Digit di atas nama akun.',
      };
    }

    if (!byAccountNum.isOfficialAdminAccount && byAccountNum.id !== 'acc-admin') {
      playAtmSound('alert');
      return {
        success: false,
        message:
          'Akses Ditolak: Akun tersebut adalah akun biasa (bukan Akun OA buatan Panel Admin). Hanya Akun OA yang dibuat/diaktifkan di Panel Admin yang dapat masuk lewat jalur ini.',
      };
    }

    //Catatan: Salah PIN di Login Akun OA TIDAK menambah failedPinAttempts / TIDAK di-banned
    if (byAccountNum.pin !== cleanCardPin) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'PIN Kartu 6 digit yang Anda masukkan salah! (Akun OA aman dan tidak dibanned).',
      };
    }

    const expectedOaPin = byAccountNum.oaAdminPin || '159357';
    if (cleanAdminPin !== '159357' && cleanAdminPin !== expectedOaPin) {
      playAtmSound('alert');
      return {
        success: false,
        message:
          'PIN Admin tidak valid! Masukkan PIN Admin pusat (159357) atau PIN Admin khusus Akun OA tersebut.',
      };
    }

    // Berhasil verifikasi keempat kredensial OA -> Langsung masuk ke Dashboard tanpa diminta PIN ulang
    setCurrentAccountIdState(byAccountNum.id);
    const rawLinkedEmail = (byAccountNum.googleEmail || byAccountNum.email || '').trim().toLowerCase();
    const hasRealGoogleEmail =
      Boolean(rawLinkedEmail) &&
      !rawLinkedEmail.endsWith('@nusantara.id') &&
      !rawLinkedEmail.endsWith('@banknusantara.id') &&
      !rawLinkedEmail.startsWith('oa.');
    const sessionEmail = hasRealGoogleEmail ? rawLinkedEmail : '';
    setActiveCloudEmail(sessionEmail);
    setGoogleUser({
      email: sessionEmail,
      name: byAccountNum.fullName,
      authMode: 'oa_account',
      emailKey: sessionEmail ? emailToFirestoreDocId(normalizeEmailKey(sessionEmail)) : undefined,
      loggedInAt: new Date().toISOString(),
      hasCompletedOnboarding: true,
      isPinVerified: true,
    });
    playAtmSound('success');
    return {
      success: true,
      message: `Selamat datang kembali di Akun OA Resmi: ${byAccountNum.fullName}!`,
    };
  };

  const adminGrantAccountSultanBusinesses = (
    accountId: string,
    unitsEach = 10
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan!' };

    const safeUnits = Math.max(0, Math.round(unitsEach));
    const nextBusinesses: Record<string, number> = {};
    if (safeUnits > 0) {
      SULTAN_BUSINESS_CATALOG.forEach((b) => {
        nextBusinesses[b.id] = safeUnits;
      });
    }

    const nextAccounts = accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            jobLevel: safeUnits > 0 ? Math.max(50, a.jobLevel || 1) : a.jobLevel,
            empireBusinesses: nextBusinesses,
          }
        : a
    );
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    playAtmSound('success');
    return {
      success: true,
      message:
        safeUnits > 0
          ? `🏢 Seluruh 12 Bisnis Kerajaan Sultan (${safeUnits} unit/bisnis) + Level 50 berhasil diberikan ke akun "${target.fullName}"!`
          : `Kepemilikan 12 Bisnis Kerajaan Sultan pada akun "${target.fullName}" telah di-reset.`,
    };
  };

  const adminConnectAccountToEmail = (
    accountId: string,
    email: string
  ): { success: boolean; message: string } => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Akun tidak ditemukan!' };

    const cleanEmail = email.trim() ? normalizeEmailKey(email.trim()) : '';
    const wasGuest = Boolean(target.isGuestAccount);
    const nextAccounts = accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            email: cleanEmail,
            googleEmail: cleanEmail || undefined,
            isGuestAccount: cleanEmail ? false : a.isGuestAccount,
            isOfficialAdminAccount:
              cleanEmail && wasGuest ? false : Boolean(a.isOfficialAdminAccount),
          }
        : a
    );
    accountsRef.current = nextAccounts;
    setAccounts(nextAccounts);
    saveGuestAccountsToLocalStorage(
      nextAccounts.filter((a) => Boolean(a.isGuestAccount && !isRealGoogleLinkedEmail(a.googleEmail || a.email)))
    );
    void flushMasterStateToCloud({ accounts: nextAccounts });
    if (cleanEmail) {
      void syncCloudUserProfile(
        { email: cleanEmail },
        {
          lastAccountId: accountId,
          hasCompletedOnboarding: true,
          authMode: 'google',
        }
      );
    }
    playAtmSound('success');
    return {
      success: true,
      message: cleanEmail
        ? `🔗 Akun "${target.fullName}" (${target.accountNumber}) berhasil diubah menjadi Akun Google di Firebase pada email: ${cleanEmail}! Saat Sign in with Google memakai email tersebut di HP maupun Laptop, pengguna dapat memilih akun ini dan memasukkan PIN Kartunya.`
        : `Tautan email Google pada akun "${target.fullName}" telah dilepas (kini tampil tombol "Sign in with Google" di bagian atas).`,
    };
  };

  const adminCloneAccount = (accountId: string) => {
    const source = accounts.find((a) => a.id === accountId);
    if (!source) return { success: false, message: 'Rekening sumber tidak ditemukan!' };
    const existingNums = accounts.map((a) => a.accountNumber);
    const existingIds = accounts.map((a) => ensureAccountUserId16(a));
    const newAccNum = generateRandomAccountNumber(existingNums);
    const newId16 = generateRandomUserId16(existingIds);
    const cloned: BankAccount = {
      ...source,
      id: `acc-clone-${Date.now()}`,
      userId16: newId16,
      accountNumber: newAccNum,
      fullName: `${source.fullName} (Kloning)`,
      cardNumber: generateRandomCardNumber(),
      cvv: generateRandomCVV(),
      createdAt: new Date().toISOString(),
      isOfficialAdminAccount: true,
      oaAdminPin: source.oaAdminPin || '159357',
    };
    const nextAccounts = [cloned, ...accounts];
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    playAtmSound('success');
    return {
      success: true,
      message: `Kartu "${source.fullName}" berhasil dikloning! Rekening baru: ${newAccNum} (ID: ${formatUserId16(
        newId16
      )}, PIN: ${cloned.pin}).`,
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
    addNotification(
      freeze ? 'Peringatan Keamanan: Kunci Kartu Massal 🔐' : 'Keamanan Kartu: Kunci Massal Dibuka 🔓',
      freeze
        ? 'Seluruh kartu reguler nasabah telah dikunci sementara (Frozen) oleh Administrator demi keamanan.'
        : 'Seluruh kartu nasabah yang terkunci telah dibuka kembali (Active) dan siap digunakan.',
      freeze ? 'warning' : 'success',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
      }
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
    accountId?: string;
    type?: 'pulsa' | 'token_listrik' | 'voucher_lain';
    category?: 'pulsa' | 'token_listrik' | 'voucher_lain';
    title?: string;
    nominal: number;
    targetId?: string;
    targetNumber?: string;
  }) => {
    const target =
      (input.accountId ? accounts.find((a) => a.id === input.accountId) : currentAccount) ||
      accounts[0];
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    const resolvedType = input.type || input.category || 'voucher_lain';
    const resolvedTarget = input.targetId || input.targetNumber || target.phone;

    const code =
      resolvedType === 'token_listrik'
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
      type: resolvedType,
      code,
      providerOrMeter: resolvedTarget,
      nominal: input.nominal,
      kwhAmount: resolvedType === 'token_listrik' ? Number((input.nominal / 1460).toFixed(1)) : undefined,
      status: 'available',
      adminApproved: true,
      purchasedAt: new Date().toISOString(),
    };
    setPurchasedCodes((prev) => [newVc, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      code,
      message: `Kode Voucher ${resolvedType.toUpperCase()} senilai ${formatRupiah(
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
      fullName?: string;
      nik?: string;
      phone?: string;
      email?: string;
      address?: string;
    }
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };
    setAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
              ...acc,
              fullName: input.fullName?.trim() || acc.fullName,
              nik: input.nik?.trim() || acc.nik,
              phone: input.phone?.trim() || acc.phone,
              email: input.email?.trim() || acc.email,
              address: input.address?.trim() || acc.address,
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

  const adminDeleteAccount = (
    accountId: string,
    options?: { logoutIfCurrent?: boolean }
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) return { success: false, message: 'Rekening tidak ditemukan!' };

    const remaining = accounts.filter((a) => a.id !== accountId);
    const nextDeletedAccountIds = Array.from(new Set([...deletedAccountIds, accountId]));
    const nextTransactions = transactions.filter((tx) => tx.accountId !== accountId);
    const nextLoans = loans.filter((l) => l.accountId !== accountId);
    const nextScheduledPayments = scheduledPayments.filter((s) => s.accountId !== accountId);
    const nextPockets = pockets.filter((p) => p.accountId !== accountId);
    const nextDepositos = depositos.filter((d) => d.accountId !== accountId);
    const nextCardUpgrades = cardUpgrades.filter((u) => u.accountId !== accountId);
    const nextPinResets = pinResetRequests.filter(
      (p) => p.accountId !== accountId && p.accountNumber !== target.accountNumber
    );
    const nextCardless = cardlessTokens.filter((c) => c.accountId !== accountId);
    const nextFavorites = favorites.filter((f) => f.accountNumber !== target.accountNumber);
    const nextPurchasedCodes = purchasedCodes.filter((c) => c.accountId !== accountId);
    const nextResiList = resiList.filter((r) => r.accountId !== accountId);
    const nextChats = chats.filter(
      (c) => c.senderAccount !== target.accountNumber && c.receiverAccount !== target.accountNumber
    );
    const nextSpinHistory = spinHistory.filter((s) => s.accountId !== accountId);
    const nextAdminHelpRequests = adminHelpRequests.filter(
      (r) => r.requesterAccountId !== accountId
    );
    const nextManualExpenses = manualExpenses.filter((m) => m.accountId !== accountId);

    const isDeletingCurrent = currentAccountId === accountId;
    const nextCurrentAccountId = isDeletingCurrent
      ? remaining[0]?.id || ''
      : currentAccountId;
    const shouldLogout =
      remaining.length === 0 || (Boolean(options?.logoutIfCurrent) && isDeletingCurrent);
    const nextGoogleUser = shouldLogout ? null : googleUser;

    setDeletedAccountIds(nextDeletedAccountIds);
    setAccounts(remaining);
    setTransactions(nextTransactions);
    setLoans(nextLoans);
    setScheduledPayments(nextScheduledPayments);
    setPockets(nextPockets);
    setDepositos(nextDepositos);
    setCardUpgrades(nextCardUpgrades);
    setPinResetRequests(nextPinResets);
    setCardlessTokens(nextCardless);
    setFavorites(nextFavorites);
    setPurchasedCodes(nextPurchasedCodes);
    setResiList(nextResiList);
    setChats(nextChats);
    setSpinHistory(nextSpinHistory);
    setAdminHelpRequests(nextAdminHelpRequests);
    setManualExpenses(nextManualExpenses);

    if (isDeletingCurrent) {
      setCurrentAccountIdState(nextCurrentAccountId);
    }
    if (shouldLogout) {
      setGoogleUser(null);
    }

    const nowEpoch = Date.now();
    lastSyncEpochRef.current = nowEpoch;

    flushMasterStateToCloud({
      accounts: remaining,
      deletedAccountIds: nextDeletedAccountIds,
      transactions: nextTransactions,
      loans: nextLoans,
      scheduledPayments: nextScheduledPayments,
      pockets: nextPockets,
      depositos: nextDepositos,
      cardUpgrades: nextCardUpgrades,
      pinResetRequests: nextPinResets,
      cardlessTokens: nextCardless,
      favorites: nextFavorites,
      purchasedCodes: nextPurchasedCodes,
      resiList: nextResiList,
      chats: nextChats,
      spinHistory: nextSpinHistory,
      adminHelpRequests: nextAdminHelpRequests,
      manualExpenses: nextManualExpenses,
    });

    if (isDeletingCurrent) {
      void syncCloudUserProfile(
        {
          uid: firebaseUser?.uid,
          email: googleUser?.email || activeCloudEmail || undefined,
        },
        {
          lastAccountId: nextCurrentAccountId || '',
          hasCompletedOnboarding: Boolean(nextCurrentAccountId),
        }
      );
    }

    playAtmSound('beep');
    return {
      success: true,
      message: `Rekening & kartu atas nama ${target.fullName} (${target.accountNumber}) berhasil dihapus permanen dari seluruh sistem!`,
    };
  };

  const submitAccountDeletionRequest = (input: {
    accountId: string;
    reasonCategory: string;
    reasonDetail: string;
    confirmationAnswers: {
      understandPermanentLoss: boolean;
      noPendingObligations: boolean;
      agreeAdminReview: boolean;
    };
  }) => {
    const target = accounts.find((a) => a.id === input.accountId);
    if (!target) {
      return { success: false, message: 'Rekening tidak ditemukan.' };
    }
    const existingPending = accountDeletionRequests.find(
      (r) => r.accountId === input.accountId && r.status === 'pending'
    );
    if (existingPending) {
      return {
        success: false,
        message: 'Pengajuan hapus akun sudah dikirim dan sedang menunggu persetujuan Admin.',
        request: existingPending,
      };
    }
    const cleanReason = input.reasonDetail.trim();
    if (cleanReason.length < 5) {
      return { success: false, message: 'Mohon isi alasan penghapusan secara jelas terlebih dahulu.' };
    }
    const newReq: AccountDeletionRequest = {
      id: `delreq-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
      accountId: target.id,
      accountNumber: target.accountNumber,
      accountName: target.fullName,
      cardTier: target.cardTier,
      balanceSnapshot: target.balance,
      reasonCategory: input.reasonCategory || 'Lainnya',
      reasonDetail: cleanReason,
      confirmationAnswers: input.confirmationAnswers,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    const nextList = [newReq, ...accountDeletionRequests];
    setAccountDeletionRequests(nextList);
    flushMasterStateToCloud({ accountDeletionRequests: nextList });

    addNotification(
      '⏳ Pengajuan Hapus Akun Dikirim ke Admin',
      `Permohonan penghapusan rekening ${target.accountNumber} telah masuk antrean persetujuan Admin. Akun tetap dapat digunakan dan dapat dibatalkan kapan saja sebelum disetujui.`,
      'warning',
      { category: 'security', targetView: 'dashboard', accountId: target.id }
    );
    playAtmSound('beep');
    return {
      success: true,
      message: 'Pengajuan hapus akun berhasil dikirim! Menunggu persetujuan Admin.',
      request: newReq,
    };
  };

  const cancelAccountDeletionRequest = (requestId: string) => {
    const targetReq = accountDeletionRequests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Data pengajuan tidak ditemukan.' };
    }
    if (targetReq.status !== 'pending') {
      return { success: false, message: 'Pengajuan ini sudah diproses dan tidak bisa dibatalkan.' };
    }
    const nextList: AccountDeletionRequest[] = accountDeletionRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'cancelled' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Nasabah (Dibatalkan Mandiri)',
          }
        : r
    );
    setAccountDeletionRequests(nextList);
    flushMasterStateToCloud({ accountDeletionRequests: nextList });

    addNotification(
      '✅ Pengajuan Hapus Akun Dibatalkan',
      `Pengajuan penghapusan rekening ${targetReq.accountNumber} telah berhasil Anda batalkan. Rekening tetap aktif normal.`,
      'success',
      { category: 'security', targetView: 'dashboard', accountId: targetReq.accountId }
    );
    playAtmSound('success');
    return {
      success: true,
      message: 'Pengajuan hapus akun berhasil dibatalkan. Rekening Anda tetap aman dan aktif!',
    };
  };

  const approveAccountDeletionRequest = (requestId: string, adminNote?: string) => {
    const targetReq = accountDeletionRequests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Pengajuan hapus akun tidak ditemukan.' };
    }
    if (targetReq.status !== 'pending') {
      return { success: false, message: 'Pengajuan ini sudah selesai diproses.' };
    }
    const nextList: AccountDeletionRequest[] = accountDeletionRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'approved' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin Utama',
            adminNote: adminNote?.trim() || 'Disetujui Admin untuk penghapusan permanen.',
          }
        : r
    );
    setAccountDeletionRequests(nextList);

    const delRes = adminDeleteAccount(targetReq.accountId, { logoutIfCurrent: false });
    flushMasterStateToCloud({ accountDeletionRequests: nextList });
    if (!delRes.success) {
      return {
        success: true,
        message: `Pengajuan atas nama ${targetReq.accountName} ditandai Disetujui (rekening sudah tidak ada).`,
      };
    }
    return {
      success: true,
      message: `Disetujui! Rekening ${targetReq.accountName} (${targetReq.accountNumber}) telah dihapus permanen oleh Admin.`,
    };
  };

  const rejectAccountDeletionRequest = (requestId: string, adminNote?: string) => {
    const targetReq = accountDeletionRequests.find((r) => r.id === requestId);
    if (!targetReq) {
      return { success: false, message: 'Pengajuan hapus akun tidak ditemukan.' };
    }
    if (targetReq.status !== 'pending') {
      return { success: false, message: 'Pengajuan ini sudah selesai diproses.' };
    }
    const cleanNote =
      adminNote?.trim() || 'Ditolak oleh Admin demi keamanan aset & rekening nasabah.';
    const nextList: AccountDeletionRequest[] = accountDeletionRequests.map((r) =>
      r.id === requestId
        ? {
            ...r,
            status: 'rejected' as const,
            reviewedAt: new Date().toISOString(),
            reviewedBy: 'Admin Utama',
            adminNote: cleanNote,
          }
        : r
    );
    setAccountDeletionRequests(nextList);
    flushMasterStateToCloud({ accountDeletionRequests: nextList });

    addNotification(
      '🛡️ Pengajuan Hapus Akun Ditolak Admin',
      `Permohonan hapus rekening ${targetReq.accountNumber} ditolak oleh Admin. Catatan: ${cleanNote}`,
      'info',
      { category: 'security', targetView: 'dashboard', accountId: targetReq.accountId }
    );
    playAtmSound('beep');
    return {
      success: true,
      message: `Pengajuan hapus akun ${targetReq.accountName} berhasil ditolak dan rekening tetap aktif.`,
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
      'success',
      {
        category: 'security',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId,
      }
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
    addNotification(
      'Pengajuan Pinjaman Sedang Diproses 📋',
      `Permohonan ${config.title} sebesar Rp ${input.amount.toLocaleString('id-ID')} sedang diproses oleh sistem Bank Nusantara.`,
      'info',
      {
        category: 'loan',
        targetView: 'dashboard',
        targetDashboardTab: 'pinjaman',
        accountId: currentAccount.id,
        referenceId: newLoan.id,
      }
    );
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

    addNotification(
      'Pinjaman Disetujui & Cair! 💸',
      `Pinjaman Anda sebesar Rp ${loan.amount.toLocaleString('id-ID')} telah disetujui Admin dan dana telah langsung masuk ke rekening Anda.`,
      'success',
      {
        category: 'loan',
        targetView: 'dashboard',
        targetDashboardTab: 'pinjaman',
        accountId: targetAccount.id,
        referenceId: loanId,
      }
    );
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

    addNotification(
      'Pengajuan Pinjaman Ditolak ⚠️',
      `Pengajuan pinjaman Anda belum dapat disetujui. Alasan: ${reason}.`,
      'alert',
      {
        category: 'loan',
        targetView: 'dashboard',
        targetDashboardTab: 'pinjaman',
        accountId: loan.accountId,
        referenceId: loanId,
      }
    );
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

  // ================= BUDGETING & EXPENSE TRACKER HANDLERS =================
  const addBudgetCategory = (input: {
    name: string;
    monthlyLimit: number;
    icon: BudgetCategoryIcon;
    color: BudgetCategoryColor;
    keywords?: string[];
  }): { success: boolean; message: string } => {
    const cleanName = input.name.trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, message: 'Nama kategori minimal 2 karakter.' };
    }
    if (!Number.isFinite(input.monthlyLimit) || input.monthlyLimit < 0) {
      return { success: false, message: 'Batas anggaran bulanan tidak valid.' };
    }
    const newCat: BudgetCategory = {
      id: `cat-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountId: currentAccountId || '__ALL__',
      name: cleanName.slice(0, 50),
      monthlyLimit: Math.round(input.monthlyLimit),
      icon: input.icon || 'wallet',
      color: input.color || 'indigo',
      keywords: (input.keywords || []).map((k) => k.trim().toLowerCase()).filter(Boolean),
      isDefault: false,
      createdAt: new Date().toISOString(),
    };
    setBudgetCategories((prev) => [...prev, newCat]);
    playAtmSound('success');
    return {
      success: true,
      message: `Kategori "${newCat.name}" dengan limit ${formatRupiah(newCat.monthlyLimit)} berhasil ditambahkan.`,
    };
  };

  const updateBudgetCategory = (
    categoryId: string,
    updates: Partial<Pick<BudgetCategory, 'name' | 'monthlyLimit' | 'icon' | 'color' | 'keywords'>>
  ): { success: boolean; message: string } => {
    const target = budgetCategories.find((c) => c.id === categoryId);
    if (!target) {
      return { success: false, message: 'Kategori anggaran tidak ditemukan.' };
    }
    if (updates.monthlyLimit !== undefined && (!Number.isFinite(updates.monthlyLimit) || updates.monthlyLimit < 0)) {
      return { success: false, message: 'Nominal limit anggaran harus 0 atau lebih.' };
    }
    setBudgetCategories((prev) =>
      prev.map((c) =>
        c.id === categoryId
          ? {
              ...c,
              ...(updates.name !== undefined && updates.name.trim() ? { name: updates.name.trim().slice(0, 50) } : {}),
              ...(updates.monthlyLimit !== undefined ? { monthlyLimit: Math.round(updates.monthlyLimit) } : {}),
              ...(updates.icon !== undefined ? { icon: updates.icon } : {}),
              ...(updates.color !== undefined ? { color: updates.color } : {}),
              ...(updates.keywords !== undefined ? { keywords: updates.keywords } : {}),
            }
          : c
      )
    );
    playAtmSound('success');
    return { success: true, message: `Pengaturan kategori "${updates.name || target.name}" diperbarui.` };
  };

  const deleteBudgetCategory = (categoryId: string): { success: boolean; message: string } => {
    const target = budgetCategories.find((c) => c.id === categoryId);
    if (!target) {
      return { success: false, message: 'Kategori tidak ditemukan.' };
    }
    if (target.isDefault) {
      return { success: false, message: 'Kategori bawaan tidak dapat dihapus, namun limitnya bebas diubah.' };
    }
    setBudgetCategories((prev) => prev.filter((c) => c.id !== categoryId));
    setManualExpenses((prev) =>
      prev.map((m) => (m.categoryId === categoryId ? { ...m, categoryId: 'cat-other' } : m))
    );
    setBudgetTxCategoryMap((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((txId) => {
        if (next[txId] === categoryId) next[txId] = 'cat-other';
      });
      return next;
    });
    playAtmSound('beep');
    return { success: true, message: `Kategori kustom "${target.name}" berhasil dihapus.` };
  };

  const addManualExpense = (input: {
    categoryId: string;
    title: string;
    amount: number;
    note?: string;
    timestamp?: string;
  }): { success: boolean; message: string } => {
    const cleanTitle = input.title.trim();
    if (!cleanTitle) {
      return { success: false, message: 'Judul pengeluaran wajib diisi.' };
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      return { success: false, message: 'Nominal pengeluaran harus lebih dari Rp 0.' };
    }
    const newEntry: ManualExpenseRecord = {
      id: `exp-man-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      accountId: currentAccountId,
      categoryId: input.categoryId || 'cat-other',
      title: cleanTitle.slice(0, 80),
      amount: Math.round(input.amount),
      note: input.note?.trim().slice(0, 180) || undefined,
      timestamp: input.timestamp || new Date().toISOString(),
    };
    setManualExpenses((prev) => [newEntry, ...prev]);
    playAtmSound('success');
    return {
      success: true,
      message: `Pengeluaran "${newEntry.title}" sebesar ${formatRupiah(newEntry.amount)} dicatat.`,
    };
  };

  const deleteManualExpense = (expenseId: string) => {
    setManualExpenses((prev) => prev.filter((e) => e.id !== expenseId));
    playAtmSound('beep');
  };

  const setTransactionBudgetCategory = (transactionId: string, categoryId: string) => {
    setBudgetTxCategoryMap((prev) => ({ ...prev, [transactionId]: categoryId }));
    playAtmSound('beep');
  };

  // Monitor 80% (Warning) & 100% (Exceeded) budget thresholds for current month -> trigger Notification Bell alert once per threshold
  useEffect(() => {
    if (!currentAccountId) return;
    const monthKey = getCurrentMonthKey();
    const report = computeMonthlyBudgetReport({
      accountId: currentAccountId,
      monthKey,
      categories: budgetCategories,
      transactions,
      manualExpenses,
      txCategoryMap: budgetTxCategoryMap,
    });

    const newKeys: string[] = [];
    const newNotifs: AppNotification[] = [];

    report.usages.forEach((usage) => {
      if (usage.limit <= 0) return;
      if (usage.status === 'warning' || usage.status === 'exceeded') {
        const key80 = `${currentAccountId}:${monthKey}:${usage.category.id}:80`;
        if (!budgetAlertHistory.includes(key80) && !newKeys.includes(key80)) {
          newKeys.push(key80);
          if (usage.status === 'warning') {
            newNotifs.push({
              id: `notif-b80-${usage.category.id}-${Date.now()}`,
              title: `Peringatan Anggaran 80% · ${usage.category.name}`,
              message: `Pemakaian ${usage.category.name} (${formatMonthLabelIndo(monthKey)}) sudah mencapai ${Math.round(usage.percentUsed)}% (${formatRupiah(usage.spent)} dari batas ${formatRupiah(usage.limit)}).`,
              type: 'warning',
              timestamp: new Date().toISOString(),
              read: false,
            });
          }
        }
      }
      if (usage.status === 'exceeded') {
        const key100 = `${currentAccountId}:${monthKey}:${usage.category.id}:100`;
        if (!budgetAlertHistory.includes(key100) && !newKeys.includes(key100)) {
          newKeys.push(key100);
          newNotifs.push({
            id: `notif-b100-${usage.category.id}-${Date.now() + 1}`,
            title: `Batas Anggaran Terlampaui · ${usage.category.name}`,
            message: `Pengeluaran ${usage.category.name} (${formatMonthLabelIndo(monthKey)}) telah melewati limit bulanan: ${formatRupiah(usage.spent)} / ${formatRupiah(usage.limit)}.`,
            type: 'alert',
            timestamp: new Date().toISOString(),
            read: false,
          });
        }
      }
    });

    if (newKeys.length > 0) {
      setBudgetAlertHistory((prev) => Array.from(new Set([...prev, ...newKeys])).slice(-150));
    }
    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev].slice(0, 80));
    }
  }, [currentAccountId, budgetCategories, transactions, manualExpenses, budgetTxCategoryMap, budgetAlertHistory]);

  const resetAllData = () => {
    const cleanInitialAccounts = INITIAL_ACCOUNTS.map((a) => ({
      ...a,
      status: 'active' as const,
      banReason: '',
    }));
    setAccounts(cleanInitialAccounts);
    setCurrentAccountIdState('acc-admin');
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
    setBudgetCategories(DEFAULT_BUDGET_CATEGORIES);
    setManualExpenses([]);
    setBudgetTxCategoryMap({});
    setDeletedAccountIds([...PURGED_BOT_ACCOUNT_IDS]);
    setBudgetAlertHistory([]);
    setGiftEvents(DEFAULT_ADMIN_GIFT_EVENTS);
    setDeletedGiftEventIds([]);
    setGiftEventsInitialized(true);
    wipeLegacyBrowserStorage();
    void clearDeviceSnapshotStorage();
    flushMasterStateToCloud({
      accounts: cleanInitialAccounts,
      deletedAccountIds: [],
      transactions: INITIAL_TRANSACTIONS,
      pockets: INITIAL_POCKETS,
      depositos: INITIAL_DEPOSITOS,
      giftEvents: DEFAULT_ADMIN_GIFT_EVENTS,
      deletedGiftEventIds: [],
      giftEventsInitialized: true,
    });
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
    jobTitle: string,
    coinReward = 0,
    clickCount = 1
  ): {
    success: boolean;
    completed: boolean;
    currentClicks: number;
    targetClicks: number;
    paidAmount?: number;
    coinsEarned?: number;
    baseCoinsEarned?: number;
    bonusCoinsEarned?: number;
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
    const safeClickCount = Math.max(1, Math.round(clickCount || 1));
    const prevClicks = currentAccount.jobClickProgress?.[jobId] || 0;
    const nextClicks = prevClicks + power * safeClickCount;

    if (nextClicks >= targetClicks) {
      const finalSalary = Math.round(salary * mult);
      const baseCoins = coinReward > 0 ? coinReward : Math.max(2, Math.round(salary / 50_000));
      const baseWithSalaryMult = Math.max(1, Math.round(baseCoins * mult));
      const adminCoinMult = jobCoinBonusConfig.enabled
        ? Math.max(0.1, jobCoinBonusConfig.coinMultiplier || 1)
        : 1;
      const adminExtraCoins = jobCoinBonusConfig.enabled
        ? Math.max(0, Math.round(jobCoinBonusConfig.extraBonusCoins || 0))
        : 0;
      const multipliedCoins = Math.max(1, Math.round(baseWithSalaryMult * adminCoinMult));
      const totalCoinsCredited = multipliedCoins + adminExtraCoins;
      const bonusCoinsEarned = Math.max(0, totalCoinsCredited - baseWithSalaryMult);

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
            spinCoins: (a.spinCoins || 0) + totalCoinsCredited,
            jobClickProgress: nextMap,
            totalJobsCompleted: (a.totalJobsCompleted || 0) + 1,
            totalJobEarnings: (a.totalJobEarnings || 0) + finalSalary,
            rewardPoints: (a.rewardPoints || 0) + Math.max(10, Math.round(finalSalary / 10_000)),
          };
        })
      );

      const coinBonusDesc =
        bonusCoinsEarned > 0
          ? ` (termasuk Bonus Coin Admin +${bonusCoinsEarned.toLocaleString('id-ID')} Coin)`
          : '';

      const salaryTx: Transaction = {
        id: `tx-job-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        accountId: currentAccount.id,
        type: 'setor',
        title: `💼 Gaji & Coin Cair: ${jobTitle} (${targetClicks}/${targetClicks} Klik)`,
        amount: finalSalary,
        coinAmount: totalCoinsCredited,
        recipientAccount: currentAccount.accountNumber,
        recipientName: currentAccount.fullName,
        description: `Gaji ${formatRupiah(finalSalary)} + ${totalCoinsCredited.toLocaleString('id-ID')} Coin${coinBonusDesc}`,
        referenceNo: `JOB-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        status: 'success',
        category: 'setor_tunai',
      };
      setTransactions((prev) => [salaryTx, ...prev]);

      playAtmSound('cash');
      return {
        success: true,
        completed: true,
        currentClicks: 0,
        targetClicks,
        paidAmount: finalSalary,
        coinsEarned: totalCoinsCredited,
        baseCoinsEarned: baseWithSalaryMult,
        bonusCoinsEarned,
        message: `🎉 TARGET ${targetClicks.toLocaleString('id-ID')} KLIK TERCAPAI! Anda langsung digaji ${formatRupiah(
          finalSalary
        )} + ${totalCoinsCredited.toLocaleString('id-ID')} Coin${coinBonusDesc}!`,
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
      timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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
        timestamp: new Date().toISOString(),
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
    mode: 'add' | 'set' | 'max' = 'set'
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
      timestamp: new Date().toISOString(),
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
    const cleanPrinc = Math.max(1_000_000, principal);
    const cleanTenor = Math.max(1, tenorMonths);
    const annualRate = Math.max(5, bonusRatePercent) / 100;
    const newDepo: DepositoItem = {
      id: `depo-vip-${Date.now()}`,
      accountId,
      principalAmount: cleanPrinc,
      tenorMonths: cleanTenor,
      interestRateAnnual: annualRate,
      startDate: new Date().toISOString().slice(0, 10),
      maturityDate: new Date(Date.now() + cleanTenor * 30 * 86400000).toISOString().slice(0, 10),
      projectedReturn: Math.round(cleanPrinc + cleanPrinc * annualRate * (cleanTenor / 12)),
      certificateNumber: `DEP-VIP-${Date.now().toString().slice(-6)}`,
      openedAt: new Date().toISOString(),
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
      color: 'from-emerald-500 to-teal-600',
      icon: '✨',
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
      timestamp: new Date().toISOString(),
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
    const myCodes = purchasedCodes.filter((c) => c.accountId === accountId && !c.isRedeemed && c.status !== 'redeemed');
    if (myCodes.length === 0) {
      return {
        success: false,
        message: 'Nasabah ini belum memiliki voucher aktif untuk digandakan.',
      };
    }
    const clones: PurchasedVoucherCode[] = myCodes.map((c, idx) => {
      const baseCode = c.secretCode || c.code || '00000000';
      const newCode = `${baseCode.slice(0, -4)}${Math.floor(1000 + Math.random() * 9000)}`;
      return {
        ...c,
        id: `vc-clone-${Date.now()}-${idx}`,
        code: newCode,
        secretCode: newCode,
        createdAt: new Date().toISOString(),
      };
    });
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
      message: `Snapshot JSON Master Bank (${accounts.length} rekening, ${transactions.length} transaksi) berhasil disalin ke clipboard!`,
    };
  };

  // ============================================================================
  // SPIN THE WHEEL & 300 PILIHAN PEMBELIAN KOIN SPIN + PANEL ADMIN KONTROL
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

    const pkg = COIN_PURCHASE_PACKAGES_300.find((p) => p.id === packageId);
    if (!pkg) {
      return { success: false, message: 'Paket koin tidak ditemukan.' };
    }

    const { finalPrice, discountPercent } = calculateCoinPackagePrice(pkg, spinWheelConfig);
    const isAdminCard =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isAdminCard && currentAccount.balance < finalPrice) {
      playAtmSound('alert');
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
      : Math.max(0, Math.round(currentAccount.balance - finalPrice));

    const updatedAccounts = accounts.map((a) =>
      a.id === currentAccount.id
        ? {
            ...a,
            balance: newAccountBalance,
            spinCoins: newCoinBalance,
          }
        : a
    );
    setAccounts(updatedAccounts);
    flushMasterStateToCloud({ accounts: updatedAccounts });

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

  const spinTheWheel = (
    spinCount: 1 | 3 | 5 | 7 | 10,
    paymentMethod: 'coins' | 'cash' = 'coins'
  ) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login ke kartu rekening terlebih dahulu.' };
    }
    if (currentAccount.cardStatus !== 'active') {
      return {
        success: false,
        message: 'Kartu Anda sedang tidak aktif / diblokir sehingga tidak dapat memutar Spin the Wheel.',
      };
    }

    const currentCoins = currentAccount.spinCoins || 0;
    const isAdminCard =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    let coinsToSpend = 0;
    let rupiahToSpend = 0;

    if (paymentMethod === 'cash') {
      const cashCost = calculateCashSpinCost(spinCount, spinWheelConfig);
      rupiahToSpend = cashCost.finalRupiah;
      if (!isAdminCard && currentAccount.balance < rupiahToSpend) {
        playAtmSound('alert');
        return {
          success: false,
          message: `Saldo rekening Anda tidak mencukupi untuk ${spinCount}x Spin Pakai Uang Langsung! Dibutuhkan ${formatRupiahWithDecimals(
            rupiahToSpend
          )} (Saldo Anda: ${formatRupiahWithDecimals(
            currentAccount.balance
          )}). Tip: Beli Koin Spin lebih murah 0,50%!`,
        };
      }
    } else {
      const { finalCoins } = calculateSpinCost(spinCount, spinWheelConfig);
      coinsToSpend = finalCoins;
      if (currentCoins < coinsToSpend) {
        playAtmSound('alert');
        return {
          success: false,
          message: `Koin Spin Anda belum mencukupi untuk ${spinCount}x Spin! Dibutuhkan ${coinsToSpend.toLocaleString(
            'id-ID'
          )} Koin (Koin Anda saat ini: ${currentCoins.toLocaleString(
            'id-ID'
          )} Koin). Beli koin di tombol [+] (lebih murah 0,50%) atau pilih Spin Pakai Uang Langsung!`,
        };
      }
    }

    const results: { segment: SpinPrizeSegment; index: number }[] = [];
    let totalWonAmount = 0;

    for (let i = 0; i < spinCount; i++) {
      const picked = pickSingleSpinPrize();
      results.push(picked);
      totalWonAmount += picked.segment.amount;
    }

    const newCoinBalance =
      paymentMethod === 'coins' ? Math.max(0, currentCoins - coinsToSpend) : currentCoins;
    const newAccountBalance = isAdminCard
      ? UNLIMITED_BALANCE
      : Math.max(0, Math.round(currentAccount.balance - rupiahToSpend + totalWonAmount));

    const updatedAccountsAfterSpin = accounts.map((a) =>
      a.id === currentAccount.id
        ? {
            ...a,
            balance: newAccountBalance,
            spinCoins: newCoinBalance,
            totalSpinsPlayed: (a.totalSpinsPlayed || 0) + spinCount,
            totalSpinWinnings: (a.totalSpinWinnings || 0) + totalWonAmount,
          }
        : a
    );
    setAccounts(updatedAccountsAfterSpin);
    flushMasterStateToCloud({ accounts: updatedAccountsAfterSpin });

    const historyItem: SpinHistoryRecord = {
      id: `spinhist-${Date.now()}`,
      accountId: currentAccount.id,
      accountName: currentAccount.fullName,
      spinCount,
      paymentMethod,
      coinsSpent: coinsToSpend,
      rupiahSpent: rupiahToSpend,
      prizesWon: results.map((r) => ({ amount: r.segment.amount, label: r.segment.label })),
      totalWonAmount,
      timestamp: new Date().toISOString(),
    };
    setSpinHistory((prev) => [historyItem, ...prev.slice(0, 49)]);

    const spendLabel =
      paymentMethod === 'cash'
        ? `Uang Rekening ${formatRupiahWithDecimals(rupiahToSpend)}`
        : `${coinsToSpend.toLocaleString('id-ID')} Koin`;

    const newTx: Transaction = {
      id: `tx-spinwin-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'setor',
      title: `Hadiah Spin (${spinCount}x ${
        paymentMethod === 'cash' ? 'Uang Langsung' : 'Koin'
      }): +${formatRupiah(totalWonAmount)}`,
      amount: totalWonAmount,
      description: `Memutar Spin the Wheel ${spinCount}x menggunakan ${spendLabel}. Rincian hadiah: ${results
        .map((r) => r.segment.label)
        .join(', ')}.`,
      status: 'success',
      referenceNo: `SPIN-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      category: 'redeem',
    };
    setTransactions((prev) => [newTx, ...prev]);

    addNotification(
      `🎡 Menang Spin +${formatRupiah(totalWonAmount)}!`,
      `Putaran ${spinCount}x (${spendLabel}) berhasil! Hadiah ${formatRupiah(
        totalWonAmount
      )} langsung masuk ke saldo rekening.`,
      'success'
    );

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
      message: `Selamat! Dari ${spinCount}x Spin (${spendLabel}), Anda memenangkan total hadiah ${formatRupiah(
        totalWonAmount
      )} yang langsung masuk ke saldo rekening Anda!`,
      paymentMethod,
      coinsSpent: coinsToSpend,
      rupiahSpent: rupiahToSpend,
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

    const updatedAdjustedAccounts = accounts.map((a) =>
      a.id === accountId ? { ...a, spinCoins: nextCoins } : a
    );
    setAccounts(updatedAdjustedAccounts);
    flushMasterStateToCloud({ accounts: updatedAdjustedAccounts });
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
    const updatedRainAccounts = accounts.map((a) => ({
      ...a,
      spinCoins: (a.spinCoins || 0) + cleanCoins,
    }));
    setAccounts(updatedRainAccounts);
    flushMasterStateToCloud({ accounts: updatedRainAccounts });
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
      playAtmSound('alert');
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
      playAtmSound('alert');
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
      playAtmSound('alert');
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
        playAtmSound('alert');
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
        playAtmSound('alert');
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
      playAtmSound('alert');
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

  // ================= TAB EMAS MEWAH 24K REAL-TIME & TRANSFER BEBAS (ADMIN 5%) =================
  const getEffectiveGoldPrice = (acc: BankAccount | null | undefined): number => {
    if (acc?.customUserGoldPricePerGram && acc.customUserGoldPricePerGram >= 1000) {
      return acc.customUserGoldPricePerGram;
    }
    return goldMarketConfig.currentPricePerGram || 1_400_000;
  };

  const buyGold = (input: {
    rupiahAmount: number;
    goldForm: GoldFormType;
    motif: GoldMotifType;
    karat?: number;
    note?: string;
  }) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login ke kartu rekening terlebih dahulu.' };
    }
    if (currentAccount.cardStatus !== 'active') {
      return {
        success: false,
        message: 'Kartu tidak aktif/dibekukan sehingga pembelian emas ditolak.',
      };
    }
    const minNom = Math.max(1000, goldMarketConfig.minNominalRupiah || 1000);
    const cleanAmount = Math.round(Number(input.rupiahAmount) || 0);
    if (cleanAmount < minNom) {
      return {
        success: false,
        message: `Nominal pembelian minimal adalah ${formatRupiah(minNom)}.`,
      };
    }
    const isInf = isUnlimitedNumber(currentAccount.balance);
    if (!isInf && currentAccount.balance < cleanAmount) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Saldo rekening tidak mencukupi. Dibutuhkan ${formatRupiah(cleanAmount)}.`,
      };
    }

    const karat = input.karat && input.karat >= 1 && input.karat <= 24 ? input.karat : 24;
    const basePrice = getEffectiveGoldPrice(currentAccount);
    const activePricePerGram = Math.round(basePrice * (karat / 24));
    const gramsAdded = cleanAmount / activePricePerGram;
    const now = new Date();
    const newBatch: GoldBatchRecord = {
      id: `gold-batch-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      purchasedAt: now.toISOString(),
      purchaseDateKey: getLocalDateKey(now),
      grams: gramsAdded,
      costRupiah: cleanAmount,
      pricePerGramAtBuy: activePricePerGram,
      goldForm: input.goldForm,
      motif: input.motif,
      karat,
      note: input.note,
    };

    const nextBatches = [...(currentAccount.goldBatches || []), newBatch];
    const nextGoldGrams = nextBatches.reduce((sum, b) => sum + b.grams, 0);
    const nextBalance = isInf ? currentAccount.balance : currentAccount.balance - cleanAmount;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: nextBalance,
              goldGrams: nextGoldGrams,
              goldBatches: nextBatches,
              goldPreferredForm: input.goldForm,
              goldPreferredMotif: input.motif,
            }
          : a
      )
    );

    const newTx: Transaction = {
      id: `tx-gold-buy-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'beli_emas',
      title: `Beli Emas ${karat}K (${input.goldForm === 'batangan' ? 'Batangan' : 'Perhiasan'}) — ${gramsAdded.toFixed(4)} g`,
      amount: cleanAmount,
      goldGrams: gramsAdded,
      timestamp: now.toISOString(),
      description: `Pembelian Emas ${karat}K senilai ${formatRupiah(cleanAmount)} @ ${formatRupiah(activePricePerGram)}/gr`,
      recipientName: `Brankas Emas ${karat}K Bank Nusantara`,
      status: 'success',
      referenceNo: `GLD-${Date.now().toString().slice(-6)}`,
      category: 'emas',
    };
    setTransactions((prev) => [newTx, ...prev]);
    playAtmSound('cash');

    return {
      success: true,
      message: `Pembelian Emas ${karat}K sebesar ${formatRupiah(cleanAmount)} (${gramsAdded.toFixed(4)} gram) berhasil!`,
      gramsAdded,
      batch: newBatch,
      newBalance: nextBalance,
      newGoldGrams: nextGoldGrams,
    };
  };

  const sellGold = (input: {
    mode: 'rupiah' | 'batch' | 'all';
    rupiahAmount?: number;
    batchId?: string;
  }) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login ke kartu rekening terlebih dahulu.' };
    }
    if (currentAccount.cardStatus !== 'active') {
      return {
        success: false,
        message: 'Kartu tidak aktif/dibekukan sehingga penjualan emas tidak dapat diproses.',
      };
    }

    const batches = [...(currentAccount.goldBatches || [])];
    const totalOwnedGrams =
      batches.length > 0
        ? batches.reduce((s, b) => s + b.grams, 0)
        : currentAccount.goldGrams || 0;

    if (totalOwnedGrams <= 0.000001) {
      return { success: false, message: 'Anda belum memiliki saldo emas untuk dijual.' };
    }

    const activePrice = getEffectiveGoldPrice(currentAccount);
    const todayKey = getLocalDateKey(new Date());
    const penaltyPercent = Math.max(0, Math.min(99, goldMarketConfig.sameDayPenaltyPercent ?? 1));
    const minNom = Math.max(1000, goldMarketConfig.minNominalRupiah || 1000);

    // Ensure at least a fallback legacy batch exists if goldGrams was set directly without batches
    const workingBatches: GoldBatchRecord[] =
      batches.length > 0
        ? batches.map((b) => ({ ...b }))
        : [
            {
              id: `gold-legacy-${Date.now()}`,
              purchasedAt: new Date(Date.now() - 86400_000 * 32).toISOString(),
              purchaseDateKey: '2020-01-01',
              grams: totalOwnedGrams,
              costRupiah: Math.round(totalOwnedGrams * activePrice),
              pricePerGramAtBuy: activePrice,
              goldForm: currentAccount.goldPreferredForm || 'batangan',
              motif: currentAccount.goldPreferredMotif || 'klasik',
            },
          ];

    let gramsRemainingToSell = 0;
    const totalMarketVal = workingBatches.reduce((sum, b) => {
      const bk = b.karat || 24;
      return sum + b.grams * activePrice * (bk / 24);
    }, 0);

    if (input.mode === 'all') {
      gramsRemainingToSell = totalOwnedGrams;
    } else if (input.mode === 'batch' && input.batchId) {
      const targetBatch = workingBatches.find((b) => b.id === input.batchId);
      if (!targetBatch) {
        return { success: false, message: 'Batch pembelian emas tidak ditemukan.' };
      }
      gramsRemainingToSell = targetBatch.grams;
    } else {
      const cleanNominal = Math.round(Number(input.rupiahAmount) || 0);
      if (cleanNominal < minNom) {
        return {
          success: false,
          message: `Nominal penjualan minimal adalah ${formatRupiah(minNom)}.`,
        };
      }
      if (cleanNominal > totalMarketVal + 100) {
        return {
          success: false,
          message: `Saldo emas tidak mencukupi. Maksimal nilai pasar emas Anda saat ini adalah ${formatRupiah(
            Math.round(totalMarketVal)
          )}.`,
        };
      }
      let rem = cleanNominal;
      let totalGramsToSell = 0;
      for (const b of workingBatches) {
        if (rem <= 0) break;
        const bk = b.karat || 24;
        const bPrice = activePrice * (bk / 24);
        const bMax = b.grams * bPrice;
        const takeVal = Math.min(bMax, rem);
        totalGramsToSell += takeVal / bPrice;
        rem -= takeVal;
      }
      gramsRemainingToSell = totalGramsToSell;
    }

    let grossMarketValue = 0;
    let totalProceeds = 0;
    let totalOriginalCost = 0;
    let gramsActuallySold = 0;
    let sameDayApplied = false;

    const updatedBatches: GoldBatchRecord[] = [];
    for (const batch of workingBatches) {
      if (input.mode === 'batch' && batch.id !== input.batchId) {
        updatedBatches.push(batch);
        continue;
      }
      if (gramsRemainingToSell <= 0.0000001) {
        updatedBatches.push(batch);
        continue;
      }
      const takeGrams = Math.min(batch.grams, gramsRemainingToSell);
      const portionRatio = batch.grams > 0 ? takeGrams / batch.grams : 0;
      const bk = batch.karat || 24;
      const batchActivePrice = activePrice * (bk / 24);
      const portionMarketValue = takeGrams * batchActivePrice;
      const isSameDay = batch.purchaseDateKey === todayKey;
      if (isSameDay) sameDayApplied = true;
      const netProceeds = isSameDay
        ? portionMarketValue * (1 - penaltyPercent / 100)
        : portionMarketValue;

      grossMarketValue += portionMarketValue;
      totalProceeds += netProceeds;
      totalOriginalCost += batch.costRupiah * portionRatio;
      gramsActuallySold += takeGrams;
      gramsRemainingToSell -= takeGrams;

      const leftoverGrams = batch.grams - takeGrams;
      if (leftoverGrams > 0.000001) {
        updatedBatches.push({
          ...batch,
          grams: leftoverGrams,
          costRupiah: Math.max(0, Math.round(batch.costRupiah * (1 - portionRatio))),
        });
      }
    }

    const finalProceeds = Math.round(totalProceeds);
    const finalGross = Math.round(grossMarketValue);
    const penaltyDeducted = Math.max(0, finalGross - finalProceeds);
    const profitOrLoss = finalProceeds - Math.round(totalOriginalCost);
    const nextGoldGrams = updatedBatches.reduce((sum, b) => sum + b.grams, 0);
    const isInf = isUnlimitedNumber(currentAccount.balance);
    const nextBalance = isInf ? currentAccount.balance : currentAccount.balance + finalProceeds;

    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              balance: nextBalance,
              goldGrams: nextGoldGrams,
              goldBatches: updatedBatches,
            }
          : a
      )
    );

    const newTx: Transaction = {
      id: `tx-gold-sell-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'jual_emas',
      title: `Jual Emas 24K (${gramsActuallySold.toFixed(4)} g)${sameDayApplied ? ` · Penyesuaian Hari Sama -${penaltyPercent}%` : ''}`,
      amount: finalProceeds,
      goldGrams: gramsActuallySold,
      adminFeeAmount: penaltyDeducted,
      timestamp: new Date().toISOString(),
      description: `Pencairan ${gramsActuallySold.toFixed(4)} g Emas @ ${formatRupiah(activePrice)}/gr${
        sameDayApplied ? ` (Potongan jual hari sama -${penaltyPercent}%: ${formatRupiah(penaltyDeducted)})` : ''
      }`,
      senderName: 'Brankas Emas 24K Bank Nusantara',
      status: 'success',
      referenceNo: `SLD-${Date.now().toString().slice(-6)}`,
      category: 'emas',
    };
    setTransactions((prev) => [newTx, ...prev]);
    playAtmSound('cash');

    return {
      success: true,
      message: `Penjualan ${gramsActuallySold.toFixed(4)} g Emas berhasil cair sebesar ${formatRupiah(
        finalProceeds
      )}${sameDayApplied ? ` (Penyesuaian jual hari sama -${penaltyPercent}% sebesar ${formatRupiah(penaltyDeducted)})` : ''}!`,
      proceedsRupiah: finalProceeds,
      grossMarketValue: finalGross,
      penaltyDeducted,
      profitOrLoss,
      gramsSold: gramsActuallySold,
      sameDayApplied,
    };
  };

  const setCustomerCustomGoldPrice = (pricePerGram: number | null) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    if (pricePerGram !== null && pricePerGram < 1000) {
      return {
        success: false,
        message: 'Harga patokan kustom minimal adalah Rp 1.000 per gram.',
      };
    }
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id ? { ...a, customUserGoldPricePerGram: pricePerGram } : a
      )
    );
    playAtmSound('beep');
    return {
      success: true,
      message:
        pricePerGram === null
          ? `Patokan harga dikembalikan ke harga pasar aktif (${formatRupiah(
              goldMarketConfig.currentPricePerGram
            )}/gr).`
          : `Harga patokan emas Anda diatur ke ${formatRupiah(pricePerGram)}/gram.`,
    };
  };

  const updateCustomerGoldPreferences = (input: {
    targetRupiah?: number;
    preferredForm?: GoldFormType;
    preferredMotif?: GoldMotifType;
  }) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan pilih akun terlebih dahulu.' };
    }
    setAccounts((prev) =>
      prev.map((a) =>
        a.id === currentAccount.id
          ? {
              ...a,
              ...(input.targetRupiah !== undefined
                ? { goldSavingsTarget: Math.max(1000, Math.round(input.targetRupiah)) }
                : {}),
              ...(input.preferredForm ? { goldPreferredForm: input.preferredForm } : {}),
              ...(input.preferredMotif ? { goldPreferredMotif: input.preferredMotif } : {}),
            }
          : a
      )
    );
    playAtmSound('beep');
    return { success: true, message: 'Preferensi Brankas Emas berhasil disimpan.' };
  };

  const dismissGoldMonthlyBanner = () => {
    setGoldMarketConfig((prev) => ({
      ...prev,
      lastMonthlyEventBanner: undefined,
    }));
  };

  const transferBebas = (input: {
    assetMode: TransferBebasAssetMode;
    recipientAccount: string;
    recipientName: string;
    recipientBank: string;
    uangAmount: number;
    coinAmount: number;
    goldRupiahAmount: number;
    note?: string;
    pin: string;
  }) => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan login ke kartu terlebih dahulu.' };
    }
    if (currentAccount.cardStatus !== 'active') {
      return {
        success: false,
        message: 'Kartu Anda sedang tidak aktif / dibekukan.',
      };
    }
    if (input.pin !== currentAccount.pin) {
      playAtmSound('alert');
      return { success: false, message: 'PIN Kartu 6 digit yang Anda masukkan salah!' };
    }
    const cleanRecAcc = (input.recipientAccount || '').trim();
    const cleanRecName = (input.recipientName || '').trim() || 'Penerima Transfer Bebas';
    if (!cleanRecAcc) {
      return { success: false, message: 'Nomor rekening / ID tujuan wajib diisi.' };
    }
    if (cleanRecAcc === currentAccount.accountNumber) {
      return { success: false, message: 'Tidak dapat melakukan Transfer Bebas ke rekening sendiri.' };
    }

    const feePercent = Math.max(0, Math.min(50, goldMarketConfig.transferBebasAdminFeePercent ?? 5));
    const feeRate = feePercent / 100;
    const minNom = Math.max(1000, goldMarketConfig.minNominalRupiah || 1000);
    const activeGoldPrice = getEffectiveGoldPrice(currentAccount);

    const includeUang = input.assetMode === 'uang' || input.assetMode === 'gabungan';
    const includeCoin = input.assetMode === 'coin' || input.assetMode === 'gabungan';
    const includeGold = input.assetMode === 'emas' || input.assetMode === 'gabungan';

    const uangSent = includeUang ? Math.round(Number(input.uangAmount) || 0) : 0;
    const coinSent = includeCoin ? Math.round(Number(input.coinAmount) || 0) : 0;
    const goldRupiahSent = includeGold ? Math.round(Number(input.goldRupiahAmount) || 0) : 0;

    if (includeUang && uangSent < minNom) {
      return { success: false, message: `Nominal Transfer Uang minimal ${formatRupiah(minNom)}.` };
    }
    if (includeCoin && coinSent < 1) {
      return { success: false, message: 'Jumlah Transfer Coin minimal 1 Koin.' };
    }
    if (includeGold && goldRupiahSent < minNom) {
      return {
        success: false,
        message: `Nominal Transfer Emas minimal senilai ${formatRupiah(minNom)}.`,
      };
    }

    const isInf = isUnlimitedNumber(currentAccount.balance);
    if (!isInf && uangSent > currentAccount.balance) {
      return { success: false, message: 'Saldo Uang Rupiah tidak mencukupi untuk Transfer Bebas.' };
    }
    if (coinSent > (currentAccount.spinCoins || 0)) {
      return { success: false, message: 'Saldo Coin Spin tidak mencukupi untuk Transfer Bebas.' };
    }
    const ownedGoldGrams =
      (currentAccount.goldBatches && currentAccount.goldBatches.length > 0
        ? currentAccount.goldBatches.reduce((s, b) => s + b.grams, 0)
        : currentAccount.goldGrams) || 0;
    const goldGramsSent = goldRupiahSent > 0 ? goldRupiahSent / activeGoldPrice : 0;
    if (goldGramsSent > ownedGoldGrams + 0.00001) {
      return {
        success: false,
        message: `Saldo Emas Anda (${ownedGoldGrams.toFixed(4)} g) tidak mencukupi untuk mengirim senilai ${formatRupiah(
          goldRupiahSent
        )}.`,
      };
    }

    // Q2 Exact Admin Fee Rule: Sender sends X, recipient receives X * (1 - 5%)
    const uangAdminFee = Math.round(uangSent * feeRate);
    const uangReceived = Math.max(0, uangSent - uangAdminFee);

    const coinAdminFee = Math.round(coinSent * feeRate);
    const coinReceived = Math.max(0, coinSent - coinAdminFee);

    const goldAdminFeeRupiah = Math.round(goldRupiahSent * feeRate);
    const goldReceivedRupiah = Math.max(0, goldRupiahSent - goldAdminFeeRupiah);
    const goldReceivedGrams = goldReceivedRupiah > 0 ? goldReceivedRupiah / activeGoldPrice : 0;

    // Deduct sender gold FIFO batches
    let nextSenderBatches = [...(currentAccount.goldBatches || [])];
    if (goldGramsSent > 0) {
      if (nextSenderBatches.length === 0 && ownedGoldGrams > 0) {
        nextSenderBatches = [
          {
            id: `gold-legacy-${Date.now()}`,
            purchasedAt: new Date(Date.now() - 86400_000 * 32).toISOString(),
            purchaseDateKey: '2020-01-01',
            grams: ownedGoldGrams,
            costRupiah: Math.round(ownedGoldGrams * activeGoldPrice),
            pricePerGramAtBuy: activeGoldPrice,
            goldForm: currentAccount.goldPreferredForm || 'batangan',
            motif: currentAccount.goldPreferredMotif || 'klasik',
          },
        ];
      }
      let rem = goldGramsSent;
      const kept: GoldBatchRecord[] = [];
      for (const b of nextSenderBatches) {
        if (rem <= 0.0000001) {
          kept.push(b);
          continue;
        }
        const take = Math.min(b.grams, rem);
        const ratio = b.grams > 0 ? take / b.grams : 0;
        rem -= take;
        const left = b.grams - take;
        if (left > 0.000001) {
          kept.push({
            ...b,
            grams: left,
            costRupiah: Math.max(0, Math.round(b.costRupiah * (1 - ratio))),
          });
        }
      }
      nextSenderBatches = kept;
    }
    const nextSenderGoldGrams = nextSenderBatches.reduce((s, b) => s + b.grams, 0);

    const internalRecipient = accounts.find((a) => a.accountNumber === cleanRecAcc);
    const nowIso = new Date().toISOString();
    const todayKey = getLocalDateKey();
    const refNo = `TFB-${Date.now().toString().slice(-6)}`;

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === currentAccount.id) {
          return {
            ...acc,
            balance: isInf ? acc.balance : Math.max(0, acc.balance - uangSent),
            spinCoins: Math.max(0, (acc.spinCoins || 0) - coinSent),
            goldGrams: goldGramsSent > 0 ? nextSenderGoldGrams : acc.goldGrams,
            goldBatches: goldGramsSent > 0 ? nextSenderBatches : acc.goldBatches,
          };
        }
        if (internalRecipient && acc.id === internalRecipient.id) {
          const recIsInf = isUnlimitedNumber(acc.balance);
          const recNewBatches = [...(acc.goldBatches || [])];
          if (goldReceivedGrams > 0) {
            recNewBatches.push({
              id: `gold-tf-${Date.now()}`,
              purchasedAt: nowIso,
              purchaseDateKey: todayKey,
              grams: goldReceivedGrams,
              costRupiah: goldReceivedRupiah,
              pricePerGramAtBuy: activeGoldPrice,
              goldForm: acc.goldPreferredForm || 'batangan',
              motif: acc.goldPreferredMotif || 'klasik',
              note: `Kiriman Transfer Bebas dari ${currentAccount.fullName}`,
            });
          }
          const recGoldGrams =
            goldReceivedGrams > 0
              ? (acc.goldGrams || 0) + goldReceivedGrams
              : acc.goldGrams || 0;
          return {
            ...acc,
            balance: recIsInf ? acc.balance : acc.balance + uangReceived,
            spinCoins: (acc.spinCoins || 0) + coinReceived,
            goldGrams: recGoldGrams,
            goldBatches: goldReceivedGrams > 0 ? recNewBatches : acc.goldBatches,
          };
        }
        return acc;
      })
    );

    const assetLabelParts: string[] = [];
    if (uangSent > 0) assetLabelParts.push(`Uang ${formatRupiah(uangSent)}`);
    if (coinSent > 0) assetLabelParts.push(`${coinSent.toLocaleString('id-ID')} Coin`);
    if (goldRupiahSent > 0)
      assetLabelParts.push(`Emas ${goldGramsSent.toFixed(4)} g (${formatRupiah(goldRupiahSent)})`);

    const senderTx: Transaction = {
      id: `tx-tfb-out-${Date.now()}`,
      accountId: currentAccount.id,
      type: 'transfer_bebas_out',
      title: `Transfer Bebas (${feePercent}% Admin) ke ${internalRecipient?.fullName || cleanRecName}`,
      amount: uangSent + goldRupiahSent,
      goldGrams: goldGramsSent || undefined,
      coinAmount: coinSent || undefined,
      adminFeeAmount: uangAdminFee + goldAdminFeeRupiah,
      senderAccount: currentAccount.accountNumber,
      senderName: currentAccount.fullName,
      recipientAccount: cleanRecAcc,
      recipientName: internalRecipient?.fullName || cleanRecName,
      recipientBank: input.recipientBank || 'Transfer Bebas Lintas Aset',
      description: `Dikirim: ${assetLabelParts.join(' + ')} · Potongan Admin ${feePercent}% ditanggung dari nominal kirim.${
        input.note ? ` Catatan: ${input.note}` : ''
      }`,
      status: 'success',
      referenceNo: refNo,
      timestamp: nowIso,
      category: 'transfer',
    };

    const nextTxs: Transaction[] = [senderTx];
    if (internalRecipient) {
      const receivedParts: string[] = [];
      if (uangReceived > 0) receivedParts.push(`Uang ${formatRupiah(uangReceived)}`);
      if (coinReceived > 0) receivedParts.push(`${coinReceived.toLocaleString('id-ID')} Coin`);
      if (goldReceivedGrams > 0)
        receivedParts.push(
          `Emas ${goldReceivedGrams.toFixed(4)} g (${formatRupiah(goldReceivedRupiah)})`
        );
      nextTxs.push({
        id: `tx-tfb-in-${Date.now() + 1}`,
        accountId: internalRecipient.id,
        type: 'transfer_bebas_in',
        title: `Terima Transfer Bebas dari ${currentAccount.fullName}`,
        amount: uangReceived + goldReceivedRupiah,
        goldGrams: goldReceivedGrams || undefined,
        coinAmount: coinReceived || undefined,
        senderAccount: currentAccount.accountNumber,
        senderName: currentAccount.fullName,
        recipientAccount: internalRecipient.accountNumber,
        recipientName: internalRecipient.fullName,
        recipientBank: 'Bank Nusantara Transfer Bebas',
        description: `Bersih diterima (setelah admin ${feePercent}%): ${receivedParts.join(' + ')}`,
        status: 'success',
        referenceNo: refNo,
        timestamp: nowIso,
        category: 'transfer',
      });
    }

    setTransactions((prev) => [...nextTxs, ...prev]);
    playAtmSound('success');

    const receipt: TransferBebasReceipt = {
      referenceNo: refNo,
      timestamp: nowIso,
      assetMode: input.assetMode,
      recipientAccount: cleanRecAcc,
      recipientName: internalRecipient?.fullName || cleanRecName,
      recipientBank: input.recipientBank || 'Tujuan Bebas',
      isInternalAccount: Boolean(internalRecipient),
      adminFeePercent: feePercent,
      uangSent,
      uangAdminFee,
      uangReceived,
      coinSent,
      coinAdminFee,
      coinReceived,
      goldRupiahSent,
      goldGramsSent,
      goldAdminFeeRupiah,
      goldReceivedRupiah,
      goldReceivedGrams,
      note: input.note,
    };

    return {
      success: true,
      message: `Transfer Bebas berhasil dikirim ke ${receipt.recipientName} (Biaya Admin ${feePercent}% dipotong dari nominal kirim)!`,
      receipt,
      transaction: senderTx,
    };
  };

  const adminUpdateGoldMarketConfig = (partial: Partial<GoldAndTransferMarketConfig>) => {
    setGoldMarketConfig((prev) => {
      const nextPenaltyPercent =
        partial.sameDayPenaltyMode === '1%'
          ? 1
          : partial.sameDayPenaltyMode === '5%'
          ? 5
          : partial.sameDayPenaltyPercent !== undefined
          ? partial.sameDayPenaltyPercent
          : prev.sameDayPenaltyPercent;
      return {
        ...prev,
        ...partial,
        sameDayPenaltyPercent: nextPenaltyPercent,
      };
    });
    playAtmSound('success');
    return {
      success: true,
      message: 'Konfigurasi Harga Emas 24K & Transfer Bebas Admin berhasil disimpan!',
    };
  };

  const adminSimulateGoldNextMonth = (months = 1) => {
    const cleanMonths = Math.max(1, Math.min(24, Math.floor(months)));
    let computedNewPrice = goldMarketConfig.currentPricePerGram;
    setGoldMarketConfig((prev) => {
      const growthRate = Math.max(0, prev.monthlyGrowthPercent ?? 5);
      const nextOffset = (prev.simulatedMonthsOffset || 0) + cleanMonths;
      const now = new Date();
      const newPoints: GoldPriceHistoryPoint[] = [];
      let runningPrice = prev.currentPricePerGram;
      for (let i = 1; i <= cleanMonths; i++) {
        runningPrice = Math.round(runningPrice * (1 + growthRate / 100));
        const simDate = new Date(
          now.getFullYear(),
          now.getMonth() + (prev.simulatedMonthsOffset || 0) + i,
          1
        );
        newPoints.push({
          id: `gold-sim-${Date.now()}-${i}`,
          label: `${formatMonthShortIndo(simDate)} (Tgl 1)`,
          monthKey: getLocalMonthKey(simDate),
          pricePerGram: runningPrice,
          changePercent: growthRate,
          timestamp: new Date().toISOString(),
          isSimulation: true,
        });
      }
      computedNewPrice = runningPrice;
      const latestSimDate = new Date(now.getFullYear(), now.getMonth() + nextOffset, 1);
      return {
        ...prev,
        currentPricePerGram: runningPrice,
        simulatedMonthsOffset: nextOffset,
        priceHistory: [...prev.priceHistory, ...newPoints].slice(-24),
        lastMonthlyEventBanner: {
          title: `Simulasi Tanggal 1 Aktif (+${growthRate}% × ${cleanMonths} Bulan)`,
          message: `Harga Emas 24K resmi naik +${growthRate}% per bulan menjadi ${formatRupiah(
            runningPrice
          )}/gram (${formatMonthShortIndo(latestSimDate)}).`,
          monthKey: getLocalMonthKey(latestSimDate),
          growthPercent: growthRate,
          timestamp: new Date().toISOString(),
        },
      };
    });
    playAtmSound('cash');
    return {
      success: true,
      message: `Simulasi Tanggal 1 (+${cleanMonths} bulan) berhasil dijalankan! Harga emas naik menjadi ${formatRupiah(
        computedNewPrice
      )}/gram.`,
      newPricePerGram: computedNewPrice,
    };
  };

  const adminResetGoldMarketConfig = () => {
    const fresh = createInitialGoldMarketConfig();
    setGoldMarketConfig(fresh);
    playAtmSound('beep');
    return {
      success: true,
      message: 'Konfigurasi & harga Emas 24K dikembalikan ke standar awal (Rp 1.400.000/gr, +5%/bulan, -1% hari sama).',
    };
  };

  const adminAdjustAccountGold = (
    accountId: string,
    value: number,
    inputUnit: 'rupiah' | 'grams',
    mode: 'add' | 'set'
  ) => {
    const target = accounts.find((a) => a.id === accountId);
    if (!target) {
      return { success: false, message: 'Rekening nasabah tidak ditemukan.' };
    }
    const price = goldMarketConfig.currentPricePerGram || 1_400_000;
    const cleanVal = Math.max(0, Number(value) || 0);
    const deltaGrams = inputUnit === 'rupiah' ? cleanVal / price : cleanVal;
    const costRp = inputUnit === 'rupiah' ? Math.round(cleanVal) : Math.round(deltaGrams * price);
    const now = new Date();

    setAccounts((prev) =>
      prev.map((a) => {
        if (a.id !== accountId) return a;
        if (mode === 'set') {
          const newBatch: GoldBatchRecord[] =
            deltaGrams > 0
              ? [
                  {
                    id: `gold-adm-${Date.now()}`,
                    purchasedAt: now.toISOString(),
                    purchaseDateKey: getLocalDateKey(now),
                    grams: deltaGrams,
                    costRupiah: costRp,
                    pricePerGramAtBuy: price,
                    goldForm: a.goldPreferredForm || 'batangan',
                    motif: a.goldPreferredMotif || 'klasik',
                    note: 'Penyesuaian saldo emas oleh Admin',
                  },
                ]
              : [];
          return {
            ...a,
            goldGrams: deltaGrams,
            goldBatches: newBatch,
          };
        }
        const addedBatch: GoldBatchRecord = {
          id: `gold-adm-${Date.now()}`,
          purchasedAt: now.toISOString(),
          purchaseDateKey: getLocalDateKey(now),
          grams: deltaGrams,
          costRupiah: costRp,
          pricePerGramAtBuy: price,
          goldForm: a.goldPreferredForm || 'batangan',
          motif: a.goldPreferredMotif || 'klasik',
          note: 'Suntikan saldo emas dari Panel Admin',
        };
        const nextBatches = deltaGrams > 0 ? [...(a.goldBatches || []), addedBatch] : a.goldBatches || [];
        return {
          ...a,
          goldGrams: (a.goldGrams || 0) + deltaGrams,
          goldBatches: nextBatches,
        };
      })
    );
    playAtmSound('cash');
    return {
      success: true,
      message: `Saldo Emas untuk ${target.fullName} berhasil ${
        mode === 'add' ? `ditambahkan +${deltaGrams.toFixed(4)} g (${formatRupiah(costRp)})` : `diatur menjadi ${deltaGrams.toFixed(4)} g`
      }!`,
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
      playAtmSound('alert');
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

      (req.selectedFeatures || req.selectedFeatureIds || []).forEach((fid) => {
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
            adminUpdateSpinWheelConfig({ coinPurchaseDiscountPercent: 80 });
            executedLogs.push('Diskon Pembelian 100 Paket Koin 80%');
            break;
          case 'mintol_murahin_harga_koin':
            adminUpdateSpinWheelConfig({ baseCoinPriceRupiah: 1000 });
            executedLogs.push('Harga dasar 1 Koin diturunkan jadi Rp 1.000');
            break;
          case 'mintol_boost_probabilitas_spin':
            adminUpdateSpinWheelConfig({ luckMultiplier: 10 });
            executedLogs.push('Boost Probabilitas Hadiah Besar Spin 10x');
            break;
          case 'mintol_force_jackpot_20m':
            adminUpdateSpinWheelConfig({ forceJackpotMode: 'only_15m_20m' });
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
              title: `Voucher Mintol ${targetAcc.fullName}`,
              rewardAmount: reqAmount,
              maxClaims: 5,
              durationMinutes: 10080,
            });
            executedLogs.push(`Kode Redeem MINTOL-${targetAcc.accountNumber.slice(-4)} dibuat`);
            break;
          case 'mintol_suntik_pulsa_pln':
            adminInjectPulsaAndPln(targetId, 1_000_000, 1_000_000);
            executedLogs.push('+Pulsa Rp 1 Juta & +Token PLN Rp 1 Juta');
            break;
          case 'mintol_lunasi_cod_resi':
            adminFreeClearAllCodResi();
            executedLogs.push('Semua paket COD lunas & terkirim');
            break;
          case 'mintol_bunga_deposito_celengan':
            adminBoostDepositosAndPockets(25);
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
      addNotification(
        '✅ Permintaan Minta Tolong (Mintol) Dikabulkan Admin!',
        summaryReply,
        'success',
        { accountId: targetAcc.id }
      );
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
        email: target.email || 'nasabah@banknusantara.id',
        name: target.fullName,
        loggedInAt: new Date().toISOString(),
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
    const nextAccounts = accounts.map((a) =>
      a.id === accountId ? { ...a, cardStatus: nextStatus } : a
    );
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
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
    const nextAccounts = accounts.map((a) =>
      a.id === accountId
        ? {
            ...a,
            ...updates,
          }
        : a
    );
    setAccounts(nextAccounts);
    flushMasterStateToCloud({ accounts: nextAccounts });
    playAtmSound('success');
    return {
      success: true,
      message: `✅ Seluruh perubahan pada akun "${updates.fullName || target.fullName}" (${
        updates.accountNumber || target.accountNumber
      }) berhasil disimpan langsung dari Panel Admin!`,
    };
  };

  // ============================================================================
  // SISTEM HADIAH & SURAT EVENT ADMIN (KUNCI TANGGAL KETAT + 60 HADIAH & TRIAL + FREKUENSI BULANAN/HARIAN)
  // ============================================================================
  const isGiftEventOpenableNow = (ev: AdminGiftEventPackage, accountId?: string): boolean => {
    if (!ev.isActive) return false;
    if (accountId && (ev.claimedByAccountIds || []).includes(accountId)) {
      return true;
    }
    if (accountId && (ev.transferredToAccountIds || []).includes(accountId)) {
      return true;
    }
    if (ev.strictDateLock === false) {
      return true;
    }
    if (ev.unlockedByManualSend) {
      return true;
    }
    if (ev.frequencyType === 'daily' || ev.frequencyType === 'hourly') {
      return true;
    }
    const now = new Date();
    const activeMonth = giftDateTestOverride ? giftDateTestOverride.month : now.getMonth() + 1;
    const activeDay = giftDateTestOverride ? giftDateTestOverride.day : now.getDate();
    if (ev.frequencyType === 'monthly') {
      return ev.scheduleDay === activeDay;
    }
    return ev.scheduleMonth === activeMonth && ev.scheduleDay === activeDay;
  };

  // Auto-Expiration Watcher untuk Hadiah Trial (Centang Biru Trial, VIP Shield Trial, Kartu Tier Trial, Boost Trial)
  useEffect(() => {
    const sweepExpiredTrials = () => {
      const nowMs = Date.now();
      let anyExpired = false;
      const currentExpiredLabels: string[] = [];

      setAccounts((prev) => {
        const hasAnyToExpire = prev.some((acc) =>
          (acc.activeTrials || []).some((t) => new Date(t.expiresAt).getTime() <= nowMs)
        );
        if (!hasAnyToExpire) return prev;
        anyExpired = true;

        return prev.map((acc) => {
          const trials = acc.activeTrials || [];
          const expired = trials.filter((t) => new Date(t.expiresAt).getTime() <= nowMs);
          if (expired.length === 0) return acc;

          const remaining = trials.filter((t) => new Date(t.expiresAt).getTime() > nowMs);
          let nextVerified = acc.isVerified;
          let nextVerifiedLabel = acc.verifiedLabel;
          let nextVipShield = acc.vipShieldActive;
          let nextCardTier = acc.cardTier;
          let nextClickPower = acc.clickPower || 1;
          let nextSalaryMult = acc.salaryMultiplier || 1;
          let nextCashback = acc.cashbackPercent || 0;
          let nextDevRoleId = acc.devRoleId;
          const nextBiz = { ...(acc.empireBusinesses || {}) };
          const nextTrd = { ...(acc.empireTradingHoldings || {}) };

          const cardRankOrder: CardTier[] = ['regular', 'gold', 'premium', 'platinum', 'admin'];
          const resolveTrialGrantedTier = (t: ActiveAccountTrial): CardTier | undefined => {
            if (t.grantedTrialCardTier) return t.grantedTrialCardTier;
            if (t.rewardType === 'trial_admin_infinity_card' || t.rewardType === 'trial_royal_emperor_all_access') return 'admin';
            if (t.rewardType === 'trial_platinum_card' || t.rewardType === 'sultan_starter_pack' || t.rewardType === 'trial_diamond_combo' || t.rewardType === 'trial_gacha_mystery_duration') return 'platinum';
            if (t.rewardType === 'trial_premium_card' || t.rewardType === 'trial_priority_badge_verified') return 'premium';
            if (t.rewardType === 'trial_gold_card') return 'gold';
            if (t.rewardType === 'trial_regular_card') return 'regular';
            return undefined;
          };

          for (const exp of expired) {
            if (acc.id === currentAccountId) {
              currentExpiredLabels.push(exp.label);
            }
            if (exp.revertSnapshot.previousVerified !== undefined) {
              const stillHasTrialBlue = remaining.some(
                (r) => r.revertSnapshot.previousVerified !== undefined
              );
              if (!stillHasTrialBlue && !exp.revertSnapshot.previousVerified) {
                nextVerified = false;
                if (nextVerifiedLabel?.includes('Trial') || nextVerifiedLabel?.includes('Prioritas')) {
                  nextVerifiedLabel = undefined;
                }
              } else if (!stillHasTrialBlue && exp.revertSnapshot.previousVerified) {
                nextVerified = true;
                nextVerifiedLabel = exp.revertSnapshot.previousVerifiedLabel;
              }
            }

            if (exp.revertSnapshot.previousVipShield !== undefined) {
              const stillHasShield = remaining.some(
                (r) => r.revertSnapshot.previousVipShield !== undefined
              );
              if (!stillHasShield) {
                nextVipShield = Boolean(exp.revertSnapshot.previousVipShield);
              }
            }

            if (exp.revertSnapshot.previousCardTier !== undefined) {
              const remainingCardTrials = remaining
                .map((r) => resolveTrialGrantedTier(r))
                .filter((t): t is CardTier => Boolean(t));
              if (remainingCardTrials.length > 0) {
                remainingCardTrials.sort(
                  (a, b) => cardRankOrder.indexOf(b) - cardRankOrder.indexOf(a)
                );
                nextCardTier = remainingCardTrials[0];
              } else {
                nextCardTier = exp.revertSnapshot.previousCardTier;
              }
            }

            if (exp.revertSnapshot.previousCashbackPercent !== undefined) {
              const stillHasCashbackTrial = remaining.some(
                (r) => r.revertSnapshot.previousCashbackPercent !== undefined
              );
              if (!stillHasCashbackTrial) {
                nextCashback = exp.revertSnapshot.previousCashbackPercent;
              }
            }

            if (exp.revertSnapshot.deltaClickPower) {
              nextClickPower = Math.max(1, nextClickPower - exp.revertSnapshot.deltaClickPower);
            }
            if (exp.revertSnapshot.deltaSalaryMultiplier) {
              nextSalaryMult = Math.max(1, nextSalaryMult - exp.revertSnapshot.deltaSalaryMultiplier);
            }

            if (exp.revertSnapshot.previousDevRoleId !== undefined) {
              const stillHasRoleTrial = remaining.some(
                (r) => r.revertSnapshot.previousDevRoleId !== undefined
              );
              if (!stillHasRoleTrial) {
                nextDevRoleId = exp.revertSnapshot.previousDevRoleId ?? null;
              }
            }

            if (exp.revertSnapshot.temporaryBusinessDeltas) {
              Object.entries(exp.revertSnapshot.temporaryBusinessDeltas).forEach(([k, delta]) => {
                const updated = Math.max(0, (nextBiz[k] || 0) - delta);
                if (updated === 0) {
                  delete nextBiz[k];
                } else {
                  nextBiz[k] = updated;
                }
              });
            }

            if (exp.revertSnapshot.temporaryTradingDeltas) {
              Object.entries(exp.revertSnapshot.temporaryTradingDeltas).forEach(([k, delta]) => {
                const updated = Math.max(0, (nextTrd[k] || 0) - delta);
                if (updated === 0) {
                  delete nextTrd[k];
                } else {
                  nextTrd[k] = updated;
                }
              });
            }
          }

          return {
            ...acc,
            isVerified: nextVerified,
            verifiedLabel: nextVerifiedLabel,
            vipShieldActive: nextVipShield,
            cardTier: nextCardTier,
            clickPower: nextClickPower,
            salaryMultiplier: nextSalaryMult,
            cashbackPercent: nextCashback,
            devRoleId: nextDevRoleId,
            empireBusinesses: nextBiz,
            empireTradingHoldings: nextTrd,
            activeTrials: remaining,
          };
        });
      });

      if (anyExpired && currentExpiredLabels.length > 0 && currentAccountId) {
        addNotification(
          '⏳ Masa Trial Hadiah Berakhir',
          `Durasi ${currentExpiredLabels.join(', ')} telah habis dan status kartu dikembalikan seperti semula.`,
          'info',
          { category: 'promo', targetView: 'dashboard', targetDashboardTab: 'ringkasan', accountId: currentAccountId }
        );
      }
    };

    sweepExpiredTrials();
    const timer = setInterval(sweepExpiredTrials, 10_000);
    return () => clearInterval(timer);
  }, [currentAccountId, accounts.length]);

  useEffect(() => {
    if (!currentAccount || !googleUser?.hasCompletedOnboarding || activeGiftModal) return;

    const now = new Date();
    const activeMonth = giftDateTestOverride ? giftDateTestOverride.month : now.getMonth() + 1;
    const activeDay = giftDateTestOverride ? giftDateTestOverride.day : now.getDate();

    const matchingPendingEvent = giftEvents.find((ev) => {
      if (!ev.isActive) return false;
      if ((ev.revokedAccountIds || []).includes(currentAccount.id)) return false;
      if ((ev.transferredOutByAccountIds || []).includes(currentAccount.id)) return false;
      const isTransferredRecipient = (ev.transferredToAccountIds || []).includes(currentAccount.id);
      const hasMultiTargets = Array.isArray(ev.targetAccountIds) && ev.targetAccountIds.length > 0;
      const isTargetedRecipient =
        isTransferredRecipient ||
        !ev.targetAccountId ||
        ev.targetAccountId === '__ALL__' ||
        ev.targetAccountId === currentAccount.id ||
        (hasMultiTargets && ev.targetAccountIds!.includes(currentAccount.id));
      if (!isTargetedRecipient) {
        return false;
      }
      if ((ev.viewedByAccountIds || []).includes(currentAccount.id)) return false;
      if (!isGiftEventOpenableNow(ev, currentAccount.id)) return false;

      const isDateMatch =
        ev.autoPopupEnabled &&
        (ev.triggerMode === 'scheduled_date' || ev.triggerMode === 'both') &&
        (ev.frequencyType === 'daily' ||
          ev.frequencyType === 'hourly' ||
          (ev.frequencyType === 'monthly' && ev.scheduleDay === activeDay) ||
          (ev.scheduleMonth === activeMonth && ev.scheduleDay === activeDay));

      const isManualTriggered =
        (ev.triggerMode === 'manual_instant' || ev.triggerMode === 'both') &&
        Boolean(ev.lastTriggeredAt);

      return isDateMatch || isManualTriggered || isTransferredRecipient;
    });

    if (matchingPendingEvent) {
      setActiveGiftModal({ eventId: matchingPendingEvent.id, isReplay: false });
    }
  }, [currentAccount, googleUser?.hasCompletedOnboarding, giftEvents, giftDateTestOverride, activeGiftModal]);

  const openGiftEventModal = (eventId: string, isReplay = true) => {
    setActiveGiftModal({ eventId, isReplay });
  };

  const closeGiftEventModal = () => {
    if (activeGiftModal && currentAccount) {
      const targetId = activeGiftModal.eventId;
      const targetEv = giftEvents.find((ev) => ev.id === targetId);
      const canMarkViewed = targetEv ? isGiftEventOpenableNow(targetEv, currentAccount.id) : false;
      if (canMarkViewed) {
        const updated = giftEvents.map((ev) => {
          if (ev.id !== targetId) return ev;
          const viewed = ev.viewedByAccountIds || [];
          if (viewed.includes(currentAccount.id)) return ev;
          return { ...ev, viewedByAccountIds: [...viewed, currentAccount.id] };
        });
        setGiftEvents(updated);
        syncGiftEventsToServer(updated);
      }
    }
    setActiveGiftModal(null);
  };

  // Buka Amplop Surat saja tanpa mengklaim Kotak Hadiah (agar Kotak Hadiah tetap bisa diklaim atau ditransfer ke teman)
  const markGiftLetterOpened = (eventId: string) => {
    if (!currentAccount) return;
    const updated = giftEvents.map((ev) => {
      if (ev.id !== eventId) return ev;
      const viewed = ev.viewedByAccountIds || [];
      const letterOpened = ev.letterOpenedByAccountIds || [];
      const nextViewed = viewed.includes(currentAccount.id) ? viewed : [...viewed, currentAccount.id];
      const nextLetterOpened = letterOpened.includes(currentAccount.id)
        ? letterOpened
        : [...letterOpened, currentAccount.id];
      return {
        ...ev,
        viewedByAccountIds: nextViewed,
        letterOpenedByAccountIds: nextLetterOpened,
      };
    });
    setGiftEvents(updated);
    syncGiftEventsToServer(updated);
    flushMasterStateToCloud({ giftEvents: updated });
    playAtmSound('beep');
  };

  // Matikan fitur Transfer Hadiah ke Teman seketika saat tombol Buka Kotak Hadiah ditekan
  const beginOpeningGiftBox = (eventId: string) => {
    if (!currentAccount) return;
    const key = `${eventId}:${currentAccount.id}`;
    if (!openingGiftBoxKeysRef.current.has(key)) {
      openingGiftBoxKeysRef.current.add(key);
      setOpeningGiftBoxKeys(Array.from(openingGiftBoxKeysRef.current));
    }
  };

  const isGiftBoxTransferLocked = (eventId: string, accountId?: string): boolean => {
    const accId = accountId || currentAccount?.id;
    if (!accId) return true;
    const ev = giftEvents.find((item) => item.id === eventId);
    if (!ev) return true;
    if ((ev.claimedByAccountIds || []).includes(accId)) return true;
    if ((ev.transferredOutByAccountIds || []).includes(accId)) return true;
    if (openingGiftBoxKeysRef.current.has(`${eventId}:${accId}`)) return true;
    if (openingGiftBoxKeys.includes(`${eventId}:${accId}`)) return true;
    return false;
  };

  // Kirim / Transfer Kotak Hadiah yang belum dibuka ke Teman
  const transferGiftEventToFriend = (
    eventId: string,
    recipientQuery: string,
    personalNote?: string
  ): {
    success: boolean;
    message: string;
    recipientName?: string;
    recipientAccountNumber?: string;
  } => {
    if (!currentAccount) {
      return { success: false, message: 'Silakan masuk ke rekening terlebih dahulu.' };
    }
    const ev = giftEvents.find((item) => item.id === eventId);
    if (!ev) {
      return { success: false, message: 'Kotak Hadiah tidak ditemukan.' };
    }
    if (
      (ev.claimedByAccountIds || []).includes(currentAccount.id) ||
      openingGiftBoxKeysRef.current.has(`${eventId}:${currentAccount.id}`)
    ) {
      playAtmSound('alert');
      return {
        success: false,
        message: 'Kotak Hadiah ini sudah dibuka sehingga fitur Transfer ke Teman otomatis dimatikan dan tidak dapat ditransfer lagi.',
      };
    }
    if ((ev.transferredOutByAccountIds || []).includes(currentAccount.id)) {
      return {
        success: false,
        message: 'Kotak Hadiah ini sudah pernah Anda transfer ke teman.',
      };
    }

    const q = recipientQuery.trim();
    if (!q) {
      return {
        success: false,
        message: 'Pilih teman dari daftar atau ketik nomor rekening teman terlebih dahulu.',
      };
    }

    const cleanDigits = q.replace(/\D/g, '');
    const friend = accounts.find(
      (a) =>
        a.id !== currentAccount.id &&
        (a.id === q ||
          (cleanDigits.length >= 6 &&
            (a.accountNumber === cleanDigits || a.phone === cleanDigits)) ||
          a.fullName.toLowerCase() === q.toLowerCase())
    );

    if (!friend) {
      playAtmSound('alert');
      return {
        success: false,
        message: `Rekening teman "${q}" tidak ditemukan. Pastikan nomor rekening 10 digit benar atau pilih dari daftar akun teman.`,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedEvents = giftEvents.map((item) => {
      if (item.id !== eventId) return item;
      const nextTransferredOut = Array.from(
        new Set([...(item.transferredOutByAccountIds || []), currentAccount.id])
      ).filter((id) => id !== friend.id);
      const nextTransferredTo = Array.from(
        new Set([...(item.transferredToAccountIds || []), friend.id])
      );
      const nextViewed = Array.from(
        new Set([...(item.viewedByAccountIds || []), currentAccount.id])
      ).filter((id) => id !== friend.id);
      const nextClaimed = (item.claimedByAccountIds || []).filter((id) => id !== friend.id);

      const nextTargetAccountId =
        item.targetAccountId &&
        item.targetAccountId !== '__ALL__' &&
        item.targetAccountId === currentAccount.id
          ? friend.id
          : item.targetAccountId;

      return {
        ...item,
        targetAccountId: nextTargetAccountId,
        unlockedByManualSend: true,
        transferredOutByAccountIds: nextTransferredOut,
        transferredToAccountIds: nextTransferredTo,
        viewedByAccountIds: nextViewed,
        claimedByAccountIds: nextClaimed,
        transferHistoryByRecipient: {
          ...(item.transferHistoryByRecipient || {}),
          [friend.id]: {
            fromAccountId: currentAccount.id,
            fromAccountName: currentAccount.fullName,
            fromAccountNumber: currentAccount.accountNumber,
            toAccountId: friend.id,
            toAccountName: friend.fullName,
            toAccountNumber: friend.accountNumber,
            note: personalNote?.trim() || undefined,
            transferredAt: nowIso,
          },
        },
        updatedAt: nowIso,
      };
    });

    setGiftEvents(updatedEvents);
    syncGiftEventsToServer(updatedEvents);
    flushMasterStateToCloud({ giftEvents: updatedEvents });

    addNotification(
      `🎁 Kotak Hadiah Ditransfer ke ${friend.fullName}`,
      `Anda berhasil mengirim Kotak Hadiah "${ev.title}" dalam keadaan utuh ke ${friend.fullName} (${friend.accountNumber}).`,
      'success',
      {
        category: 'promo',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId: currentAccount.id,
      }
    );

    addNotification(
      `🎁 Kiriman Kotak Hadiah dari ${currentAccount.fullName}!`,
      `${currentAccount.fullName} mengirim Kotak Hadiah "${ev.title}"${
        personalNote?.trim() ? ` dengan pesan: "${personalNote.trim()}"` : ''
      } untuk Anda buka!`,
      'success',
      {
        category: 'promo',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId: friend.id,
      }
    );

    playAtmSound('success');
    return {
      success: true,
      recipientName: friend.fullName,
      recipientAccountNumber: friend.accountNumber,
      message: `Berhasil! Kotak Hadiah "${ev.title}" telah dikirim ke ${friend.fullName} (No. Rek: ${friend.accountNumber}).`,
    };
  };

  const claimAndOpenGiftEvent = (
    eventId: string
  ): {
    success: boolean;
    alreadyClaimed: boolean;
    lockedByDate?: boolean;
    summaryLines: string[];
    rolledResults?: GachaClaimedItemResult[];
    message: string;
  } => {
    if (!currentAccount) {
      return {
        success: false,
        alreadyClaimed: false,
        summaryLines: [],
        message: 'Silakan masuk ke kartu terlebih dahulu.',
      };
    }

    const ev = giftEvents.find((item) => item.id === eventId);
    if (!ev) {
      return {
        success: false,
        alreadyClaimed: false,
        summaryLines: [],
        message: 'Paket hadiah & surat tidak ditemukan.',
      };
    }

    const alreadyClaimed = (ev.claimedByAccountIds || []).includes(currentAccount.id);
    if (!alreadyClaimed && !isGiftEventOpenableNow(ev, currentAccount.id)) {
      playAtmSound('alert');
      return {
        success: false,
        alreadyClaimed: false,
        lockedByDate: true,
        summaryLines: [],
        message: `Kotak hadiah ini terkunci! Hanya dapat dibuka pada tanggal ${ev.scheduleLabel}.`,
      };
    }

    if (alreadyClaimed) {
      const updated = giftEvents.map((item) =>
        item.id === eventId && !(item.viewedByAccountIds || []).includes(currentAccount.id)
          ? { ...item, viewedByAccountIds: [...(item.viewedByAccountIds || []), currentAccount.id] }
          : item
      );
      setGiftEvents(updated);
      const savedRolls = ev.gachaResultsByAccount?.[currentAccount.id] || [];
      return {
        success: true,
        alreadyClaimed: true,
        rolledResults: savedRolls,
        summaryLines: ev.rewards.map((r) => `${r.emoji} ${r.label}: ${r.amount.toLocaleString('id-ID')} ${r.unitLabel}`),
        message: 'Anda sudah pernah mengklaim hadiah ini. Menampilkan kembali surat & daftar hadiah!',
      };
    }

    let addCash = 0;
    let addCoins = 0;
    let addVouchers = 0;
    let addJobLevels = 0;
    let addGoldGrams = 0;
    let addPoints = 0;
    let addPulsa = 0;
    let addPlnKwh = 0;
    let addClickPower = 0;
    let addSalaryMult = 0;
    let setCashbackPct: number | null = null;
    let enableShield = false;
    let enableBlueCheck = false;
    let tierUpgradeSteps = 0;
    let depositoAmount = 0;
    let pocketAmount = 0;
    const addBusinesses: Record<string, number> = {};
    const addTrading: Record<string, number> = {};
    let shouldForgiveLoans = false;
    let forceCardTier: CardTier | null = null;
    let explicitTargetTier: CardTier | null = null;
    let grantedDevRoleId: string | null | undefined = undefined;
    const createdTrials: ActiveAccountTrial[] = [];
    const rolledResults: GachaClaimedItemResult[] = [];
    const summaryLines: string[] = [];

    const existingActiveTrials = (currentAccount.activeTrials || []).filter(
      (t) => new Date(t.expiresAt).getTime() > Date.now()
    );
    const nonTrialCardTier: CardTier =
      existingActiveTrials.find((t) => t.revertSnapshot.previousCardTier)?.revertSnapshot.previousCardTier ||
      currentAccount.cardTier;
    const nonTrialVerified: boolean =
      existingActiveTrials.some((t) => t.revertSnapshot.previousVerified !== undefined)
        ? Boolean(existingActiveTrials.find((t) => t.revertSnapshot.previousVerified !== undefined)?.revertSnapshot.previousVerified)
        : Boolean(currentAccount.isVerified);
    const nonTrialVerifiedLabel: string | undefined =
      existingActiveTrials.find((t) => t.revertSnapshot.previousVerifiedLabel !== undefined)?.revertSnapshot
        .previousVerifiedLabel || currentAccount.verifiedLabel;
    const nonTrialVipShield: boolean =
      existingActiveTrials.some((t) => t.revertSnapshot.previousVipShield !== undefined)
        ? Boolean(existingActiveTrials.find((t) => t.revertSnapshot.previousVipShield !== undefined)?.revertSnapshot.previousVipShield)
        : Boolean(currentAccount.vipShieldActive);
    const nonTrialCashbackPercent: number =
      existingActiveTrials.find((t) => t.revertSnapshot.previousCashbackPercent !== undefined)
        ?.revertSnapshot.previousCashbackPercent ?? (currentAccount.cashbackPercent || 0);
    const nonTrialDevRoleId: string | null | undefined =
      existingActiveTrials.some((t) => t.revertSnapshot.previousDevRoleId !== undefined)
        ? existingActiveTrials.find((t) => t.revertSnapshot.previousDevRoleId !== undefined)?.revertSnapshot.previousDevRoleId ?? null
        : currentAccount.devRoleId ?? null;

    for (const rew of ev.rewards) {
      const catMeta = GIFT_REWARD_CATALOG.find((c) => c.type === rew.type);
      const selectedSub = catMeta?.subOptions?.find((s) => s.id === rew.selectedSubOptionId);
      const step = selectedSub?.stepOverride || catMeta?.step || 1;
      let qty = Math.max(1, Number(rew.amount) || 1);
      if (rew.rewardMode === 'gacha' && rew.gachaTiers && rew.gachaTiers.length > 0) {
        const rolled = rollGachaOutcome(rew.gachaTiers, step);
        qty = rolled.rolledAmount;
        rolledResults.push({
          rewardId: rew.id,
          type: rew.type,
          label: rew.selectedSubOptionLabel ? `${rew.label} (${rew.selectedSubOptionLabel})` : rew.label,
          emoji: rew.emoji,
          unitLabel: rew.unitLabel,
          tierLabel: rolled.tierLabel,
          probabilityPercent: rolled.probabilityPercent,
          rolledAmount: rolled.rolledAmount,
          minAmount: rolled.minAmount,
          maxAmount: rolled.maxAmount,
        });
      }
      const isTrialItem = Boolean(catMeta?.isTrial || selectedSub?.isTrialVariant);
      const trialMins = isTrialItem
        ? Math.max(1, Number(rew.trialDurationMinutes) || (rew.rewardMode === 'gacha' ? qty : selectedSub?.defaultTrialMinutesOverride || catMeta?.defaultTrialMinutes || 1440))
        : 0;
      const subSuffix = rew.selectedSubOptionLabel ? ` • ${rew.selectedSubOptionLabel}` : '';
      const trialSuffix = trialMins > 0 ? ` [Trial ${formatTrialDurationLabel(trialMins)}]` : '';
      const gachaTag = rolledResults.find((gr) => gr.rewardId === rew.id)
        ? ` [🎲 Gacha: ${rolledResults.find((gr) => gr.rewardId === rew.id)?.tierLabel}]`
        : '';
      summaryLines.push(`${rew.emoji} ${rew.label}${subSuffix} (${qty.toLocaleString('id-ID')} ${rew.unitLabel})${trialSuffix}${gachaTag}`);

      const nowDate = new Date();
      const expiresIso = new Date(nowDate.getTime() + (trialMins || 1440) * 60_000).toISOString();

      switch (rew.type) {
        case 'cash_balance':
          addCash += qty;
          break;
        case 'spin_coins':
          addCoins += qty;
          break;
        case 'level_voucher':
          addVouchers += qty;
          break;
        case 'job_level_up':
          addJobLevels += qty;
          break;
        case 'gold_grams':
          addGoldGrams += qty;
          break;
        case 'reward_points':
          addPoints += qty;
          break;
        case 'pulsa_balance':
          addPulsa += qty;
          break;
        case 'pln_kwh':
          addPlnKwh += qty;
          break;
        case 'click_power_boost':
          addClickPower += qty;
          break;
        case 'salary_multiplier_boost':
          addSalaryMult += qty;
          break;
        case 'cashback_percent':
          setCashbackPct = Math.max(setCashbackPct || 0, Math.min(100, qty));
          break;
        case 'vip_shield':
          enableShield = true;
          break;
        case 'blue_checkmark':
          enableBlueCheck = true;
          break;
        case 'upgrade_card_tier': {
          const subTierMap: Record<string, CardTier> = {
            tier_regular: 'regular',
            tier_gold: 'gold',
            tier_premium: 'premium',
            tier_platinum: 'platinum',
            tier_admin: 'admin',
          };
          if (rew.selectedSubOptionId && subTierMap[rew.selectedSubOptionId]) {
            const chosenTier = subTierMap[rew.selectedSubOptionId];
            explicitTargetTier = chosenTier;
            if (chosenTier === 'admin') {
              enableShield = true;
              enableBlueCheck = true;
            }
          } else {
            tierUpgradeSteps += qty;
          }
          break;
        }
        case 'special_deposito':
          depositoAmount += qty;
          break;
        case 'dream_pocket_fund':
          pocketAmount += qty;
          break;
        case 'mining_rig_rtx':
          addBusinesses['mining_rtx_rig'] = (addBusinesses['mining_rtx_rig'] || 0) + qty;
          break;
        case 'mining_ai_cluster':
          addBusinesses['mining_ai_datacenter'] = (addBusinesses['mining_ai_datacenter'] || 0) + qty;
          break;
        case 'supercar_porsche':
          addBusinesses['auction_porsche_gt3rs'] = (addBusinesses['auction_porsche_gt3rs'] || 0) + qty;
          break;
        case 'supercar_lambo':
          addBusinesses['auction_lambo_revuelto'] = (addBusinesses['auction_lambo_revuelto'] || 0) + qty;
          break;
        case 'trading_gold_kg':
          addTrading['gold_antam_kg'] = (addTrading['gold_antam_kg'] || 0) + qty;
          break;
        case 'trading_btc_vip':
          addTrading['crypto_btc_vip'] = (addTrading['crypto_btc_vip'] || 0) + qty;
          break;
        case 'forgive_loans':
          shouldForgiveLoans = true;
          break;
        case 'mystery_thr_combo':
          addCash += 1_500_000 * qty;
          addCoins += 100 * qty;
          addPoints += 2_000 * qty;
          break;
        case 'trial_blue_checkmark':
          enableBlueCheck = true;
          createdTrials.push({
            id: `trial-blue-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_blue_checkmark',
            label: `Centang Biru Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '☑️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
            },
          });
          break;
        case 'trial_vip_shield':
          enableShield = true;
          createdTrials.push({
            id: `trial-vip-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_vip_shield',
            label: `VIP Shield Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🛡️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousVipShield: nonTrialVipShield,
            },
          });
          break;
        case 'trial_gold_card':
          if (currentAccount.cardTier !== 'admin') {
            forceCardTier = forceCardTier === 'platinum' ? 'platinum' : 'gold';
          }
          createdTrials.push({
            id: `trial-gold-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_gold_card',
            label: `Kartu Emas Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🌟',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousCardTier: nonTrialCardTier,
            },
          });
          break;
        case 'trial_platinum_card':
          if (currentAccount.cardTier !== 'admin') {
            forceCardTier = 'platinum';
          }
          createdTrials.push({
            id: `trial-plat-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_platinum_card',
            label: `Kartu Platinum Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '💎',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousCardTier: nonTrialCardTier,
            },
          });
          break;
        case 'trial_career_boost':
          addClickPower += 5;
          addSalaryMult += qty;
          createdTrials.push({
            id: `trial-boost-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_career_boost',
            label: `Boost Gaji +${qty}x & Klik +5 Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '⚡',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              deltaClickPower: 5,
              deltaSalaryMultiplier: qty,
            },
          });
          break;
        case 'sultan_starter_pack':
          addCash += 5_000_000 * qty;
          addCoins += 300 * qty;
          enableBlueCheck = true;
          if (currentAccount.cardTier !== 'admin') {
            forceCardTier = 'platinum';
          }
          createdTrials.push({
            id: `trial-sultan-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'sultan_starter_pack',
            label: `Paket Kartu Sultan Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '👑',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
              previousCardTier: nonTrialCardTier,
            },
          });
          break;
        // === 4 HADIAH ROLE DEV / OWN / ADMIN (PERMANEN & TRIAL) ===
        case 'role_grant_permanent': {
          const roleObj = devRoles.find((r) => r.id === rew.targetDevRoleId) || devRoles[0];
          if (roleObj) {
            grantedDevRoleId = roleObj.id;
          }
          break;
        }
        case 'role_grant_trial': {
          const roleObj = devRoles.find((r) => r.id === rew.targetDevRoleId) || devRoles[0];
          if (roleObj) {
            grantedDevRoleId = roleObj.id;
            createdTrials.push({
              id: `trial-role-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              rewardType: 'role_grant_trial',
              label: `Role ${roleObj.name} Trial (${formatTrialDurationLabel(trialMins)})`,
              emoji: '⏳',
              startedAt: nowDate.toISOString(),
              expiresAt: expiresIso,
              durationMinutes: trialMins,
              revertSnapshot: { previousDevRoleId: nonTrialDevRoleId },
            });
          }
          break;
        }
        case 'role_gacha_random_permanent': {
          const randRole = devRoles[Math.floor(Math.random() * devRoles.length)] || devRoles[0];
          if (randRole) {
            grantedDevRoleId = randRole.id;
          }
          break;
        }
        case 'role_gacha_random_trial': {
          const randRole = devRoles[Math.floor(Math.random() * devRoles.length)] || devRoles[0];
          if (randRole) {
            grantedDevRoleId = randRole.id;
            createdTrials.push({
              id: `trial-randrole-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              rewardType: 'role_gacha_random_trial',
              label: `Gacha Role ${randRole.name} Trial (${formatTrialDurationLabel(trialMins)})`,
              emoji: '🎟️',
              startedAt: nowDate.toISOString(),
              expiresAt: expiresIso,
              durationMinutes: trialMins,
              revertSnapshot: { previousDevRoleId: nonTrialDevRoleId },
            });
          }
          break;
        }
        // === 24+ HADIAH TAMBAHAN KATALOG 58 MACAM HADIAH ===
        case 'salary_jackpot_drop':
        case 'fee_waiver_pass':
        case 'sultan_empire_dividend':
          addCash += qty;
          break;
        case 'coin_jackpot_rain':
          addCoins += qty;
          break;
        case 'cashback_tier_max':
          setCashbackPct = Math.max(setCashbackPct || 0, Math.min(100, qty));
          break;
        case 'double_wallet_bonus':
          addCash += 3_000_000 * qty;
          addCoins += 200 * qty;
          break;
        case 'loyalty_point_chest':
          addPoints += qty;
          break;
        case 'career_turbo_pack':
          addJobLevels += 2 * qty;
          addVouchers += 3 * qty;
          addClickPower += 2 * qty;
          break;
        case 'job_progress_boost':
          addClickPower += qty;
          break;
        case 'suit_victory_charm':
        case 'voucher_bundle_pro':
          addVouchers += qty;
          break;
        case 'instant_executive_unlock':
          addJobLevels += qty;
          break;
        case 'gold_bar_royal_10g':
        case 'gold_jewel_bonus':
          addGoldGrams += qty;
          break;
        case 'high_yield_deposito_vip':
          depositoAmount += qty;
          break;
        case 'emergency_vault_fund':
          pocketAmount += qty;
          break;
        case 'pln_super_pack':
          addPlnKwh += qty;
          break;
        case 'mining_quantum_datacenter':
          addBusinesses['mining_ai_datacenter'] = (addBusinesses['mining_ai_datacenter'] || 0) + qty;
          break;
        case 'supercar_bugatti_chiron':
        case 'supercar_ferrari_sf90':
          addBusinesses['auction_lambo_revuelto'] = (addBusinesses['auction_lambo_revuelto'] || 0) + qty;
          break;
        case 'trading_sp500_vip':
          addTrading['gold_antam_kg'] = (addTrading['gold_antam_kg'] || 0) + qty;
          break;
        case 'upgrade_card_platinum_perm':
          if (currentAccount.cardTier !== 'admin') {
            forceCardTier = 'platinum';
          }
          break;
        case 'upgrade_card_admin_infinity_perm':
          forceCardTier = 'admin';
          enableShield = true;
          enableBlueCheck = true;
          break;
        case 'royal_crown_100g_50m_pack':
          addGoldGrams += 100 * qty;
          addCash += 50_000_000 * qty;
          break;
        case 'trial_diamond_combo':
          addCash += 2_000_000 * qty;
          enableBlueCheck = true;
          enableShield = true;
          if (currentAccount.cardTier !== 'admin') forceCardTier = 'platinum';
          createdTrials.push({
            id: `trial-diamond-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_diamond_combo',
            label: `Paket Diamond VIP Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '💠',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
              previousVipShield: nonTrialVipShield,
              previousCardTier: nonTrialCardTier,
            },
          });
          break;
        case 'trial_all_assets_boost':
          addGoldGrams += 1 * qty;
          addCoins += 50 * qty;
          addSalaryMult += qty;
          addClickPower += 4;
          createdTrials.push({
            id: `trial-allboost-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_all_assets_boost',
            label: `Turbo Boost Kerja & Emas Trial (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🌟',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              deltaClickPower: 4,
              deltaSalaryMultiplier: qty,
            },
          });
          break;
        // === 40 HADIAH TAMBAHAN (#61 - #100) ===
        case 'job_career_custom_selector': {
          const subId = rew.selectedSubOptionId || 'job_level';
          if (subId === 'job_level') addJobLevels += qty;
          else if (subId === 'job_voucher') addVouchers += qty;
          else if (subId === 'job_click') addClickPower += qty;
          else if (subId === 'job_salary') addSalaryMult += qty;
          else if (subId === 'job_coin') addCoins += qty;
          else if (subId === 'job_trial') {
            addClickPower += 5;
            addSalaryMult += qty;
            addVouchers += 1;
            createdTrials.push({
              id: `trial-jobpack-${Date.now()}-${Math.floor(Math.random() * 999)}`,
              rewardType: 'job_career_custom_selector',
              label: `Trial Paket Pekerjaan Lengkap (${formatTrialDurationLabel(trialMins)})`,
              emoji: '⏳',
              startedAt: nowDate.toISOString(),
              expiresAt: expiresIso,
              durationMinutes: trialMins,
              revertSnapshot: { deltaClickPower: 5, deltaSalaryMultiplier: qty },
            });
          }
          break;
        }
        case 'business_custom_selector': {
          const bizId = rew.selectedSubOptionId || 'mining_rtx_rig';
          addBusinesses[bizId] = (addBusinesses[bizId] || 0) + qty;
          break;
        }
        case 'trading_custom_selector': {
          const trdId = rew.selectedSubOptionId || 'gold_antam_kg';
          addTrading[trdId] = (addTrading[trdId] || 0) + qty;
          break;
        }
        case 'vip_protection_selector': {
          const vipId = rew.selectedSubOptionId || 'vip_full';
          if (vipId === 'vip_blue' || vipId === 'vip_full') enableBlueCheck = true;
          if (vipId === 'vip_shield' || vipId === 'vip_full') enableShield = true;
          if (vipId === 'vip_cashback' || vipId === 'vip_full') {
            setCashbackPct = Math.max(setCashbackPct || 0, 25);
          }
          break;
        }
        case 'trial_card_tier_selector': {
          const subTierMap: Record<string, CardTier> = {
            tier_regular: 'regular',
            tier_gold: 'gold',
            tier_premium: 'premium',
            tier_platinum: 'platinum',
            tier_admin: 'admin',
          };
          const chosenTier = subTierMap[rew.selectedSubOptionId || 'tier_platinum'] || 'platinum';
          explicitTargetTier = chosenTier;
          if (chosenTier === 'admin') {
            enableShield = true;
            enableBlueCheck = true;
          }
          createdTrials.push({
            id: `trial-cardsel-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_card_tier_selector',
            label: `Trial Kartu ${chosenTier.toUpperCase()} (${formatTrialDurationLabel(trialMins)})`,
            emoji: '💳',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: chosenTier,
            revertSnapshot: {
              previousCardTier: nonTrialCardTier,
              ...(chosenTier === 'admin'
                ? {
                    previousVerified: nonTrialVerified,
                    previousVerifiedLabel: nonTrialVerifiedLabel,
                    previousVipShield: nonTrialVipShield,
                  }
                : {}),
            },
          });
          break;
        }
        case 'trial_regular_card':
          explicitTargetTier = 'regular';
          createdTrials.push({
            id: `trial-reg-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_regular_card',
            label: `Trial Kartu Reguler (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🪪',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: 'regular',
            revertSnapshot: { previousCardTier: nonTrialCardTier },
          });
          break;
        case 'trial_premium_card':
          if (currentAccount.cardTier !== 'admin') forceCardTier = 'premium';
          createdTrials.push({
            id: `trial-prem-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_premium_card',
            label: `Trial Kartu Premium (${formatTrialDurationLabel(trialMins)})`,
            emoji: '✨',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: 'premium',
            revertSnapshot: { previousCardTier: nonTrialCardTier },
          });
          break;
        case 'trial_admin_infinity_card':
          explicitTargetTier = 'admin';
          enableShield = true;
          enableBlueCheck = true;
          createdTrials.push({
            id: `trial-admintrial-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_admin_infinity_card',
            label: `Trial Kartu Admin Infinity (${formatTrialDurationLabel(trialMins)})`,
            emoji: '👑',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: 'admin',
            revertSnapshot: {
              previousCardTier: nonTrialCardTier,
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
              previousVipShield: nonTrialVipShield,
            },
          });
          break;
        case 'trial_job_career_selector': {
          const subId = rew.selectedSubOptionId || 'trial_job_combo';
          let dClick = 0;
          let dSalary = 0;
          if (subId === 'trial_job_salary') {
            dSalary = qty;
          } else if (subId === 'trial_job_click') {
            dClick = qty * 4;
          } else if (subId === 'trial_job_coin') {
            addCoins += 150 * qty;
            dClick = 3;
            dSalary = 1;
          } else {
            addVouchers += 2;
            dClick = 6;
            dSalary = qty;
          }
          addClickPower += dClick;
          addSalaryMult += dSalary;
          createdTrials.push({
            id: `trial-jobsel-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_job_career_selector',
            label: `${rew.selectedSubOptionLabel || 'Trial Pekerjaan'} (${formatTrialDurationLabel(trialMins)})`,
            emoji: '⚙️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { deltaClickPower: dClick, deltaSalaryMultiplier: dSalary },
          });
          break;
        }
        case 'trial_job_salary_2x':
        case 'trial_job_salary_5x':
          addSalaryMult += qty;
          createdTrials.push({
            id: `trial-jsal-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: rew.type,
            label: `${catMeta?.label || 'Trial Pengali Gaji'} (${formatTrialDurationLabel(trialMins)})`,
            emoji: '💵',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { deltaSalaryMultiplier: qty },
          });
          break;
        case 'trial_job_click_power':
          addClickPower += qty;
          createdTrials.push({
            id: `trial-jclk-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_job_click_power',
            label: `Trial Klik Kerja +${qty} (${formatTrialDurationLabel(trialMins)})`,
            emoji: '👆',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { deltaClickPower: qty },
          });
          break;
        case 'trial_job_coin_rain':
          addCoins += 150 * qty;
          addClickPower += 3;
          addSalaryMult += 1;
          createdTrials.push({
            id: `trial-jcoin-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_job_coin_rain',
            label: `Trial Bonus Koin & Boost Kerja (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🪙',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { deltaClickPower: 3, deltaSalaryMultiplier: 1 },
          });
          break;
        case 'trial_cashback_15':
        case 'trial_cashback_50': {
          const pct = Math.min(100, qty);
          setCashbackPct = Math.max(setCashbackPct || 0, pct);
          createdTrials.push({
            id: `trial-cb-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: rew.type,
            label: `Trial Cashback ${pct}% (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🏷️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { previousCashbackPercent: nonTrialCashbackPercent },
          });
          break;
        }
        case 'trial_free_transfer_vip':
          addCash += 250_000 * qty;
          enableShield = true;
          setCashbackPct = Math.max(setCashbackPct || 0, 20);
          createdTrials.push({
            id: `trial-freetf-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_free_transfer_vip',
            label: `Trial Bebas Admin & VIP Shield (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🛡️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              previousVipShield: nonTrialVipShield,
              previousCashbackPercent: nonTrialCashbackPercent,
            },
          });
          break;
        case 'trial_priority_badge_verified':
          enableBlueCheck = true;
          if (currentAccount.cardTier !== 'admin') forceCardTier = 'premium';
          createdTrials.push({
            id: `trial-prio-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_priority_badge_verified',
            label: `Trial Lencana Prioritas & Centang Biru (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🎖️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: 'premium',
            revertSnapshot: {
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
              previousCardTier: nonTrialCardTier,
            },
          });
          break;
        case 'trial_trading_selector': {
          const trdId = rew.selectedSubOptionId || 'gold_antam_kg';
          addTrading[trdId] = (addTrading[trdId] || 0) + qty;
          createdTrials.push({
            id: `trial-trdsel-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_trading_selector',
            label: `${rew.selectedSubOptionLabel || 'Trial Bursa'} (${formatTrialDurationLabel(trialMins)})`,
            emoji: '📊',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { temporaryTradingDeltas: { [trdId]: qty } },
          });
          break;
        }
        case 'trial_trading_btc_whale':
          addTrading['crypto_btc_vip'] = (addTrading['crypto_btc_vip'] || 0) + qty;
          createdTrials.push({
            id: `trial-btc-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_trading_btc_whale',
            label: `Trial Whale Bitcoin VIP (${formatTrialDurationLabel(trialMins)})`,
            emoji: '₿',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { temporaryTradingDeltas: { crypto_btc_vip: qty } },
          });
          break;
        case 'trial_trading_gold_bullion':
          addTrading['gold_antam_kg'] = (addTrading['gold_antam_kg'] || 0) + qty;
          createdTrials.push({
            id: `trial-bull-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_trading_gold_bullion',
            label: `Trial Kolektor Emas Bullion (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🥇',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { temporaryTradingDeltas: { gold_antam_kg: qty } },
          });
          break;
        case 'trial_business_selector': {
          const bizId = rew.selectedSubOptionId || 'mining_rtx_rig';
          addBusinesses[bizId] = (addBusinesses[bizId] || 0) + qty;
          createdTrials.push({
            id: `trial-bizsel-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_business_selector',
            label: `${rew.selectedSubOptionLabel || 'Trial Bisnis'} (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🏢',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { temporaryBusinessDeltas: { [bizId]: qty } },
          });
          break;
        }
        case 'trial_business_mining_farm':
          addBusinesses['mining_rtx_rig'] = (addBusinesses['mining_rtx_rig'] || 0) + qty;
          addBusinesses['mining_ai_datacenter'] = (addBusinesses['mining_ai_datacenter'] || 0) + qty;
          createdTrials.push({
            id: `trial-mfarm-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_business_mining_farm',
            label: `Trial Mining Farm RTX & AI (${formatTrialDurationLabel(trialMins)})`,
            emoji: '⛏️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              temporaryBusinessDeltas: { mining_rtx_rig: qty, mining_ai_datacenter: qty },
            },
          });
          break;
        case 'trial_business_hypercar_garage':
          addBusinesses['auction_porsche_gt3rs'] = (addBusinesses['auction_porsche_gt3rs'] || 0) + qty;
          addBusinesses['auction_lambo_revuelto'] = (addBusinesses['auction_lambo_revuelto'] || 0) + qty;
          createdTrials.push({
            id: `trial-hcar-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_business_hypercar_garage',
            label: `Trial Garasi Hypercar (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🏎️',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: {
              temporaryBusinessDeltas: { auction_porsche_gt3rs: qty, auction_lambo_revuelto: qty },
            },
          });
          break;
        case 'trial_royal_emperor_all_access':
          explicitTargetTier = 'admin';
          enableBlueCheck = true;
          enableShield = true;
          addSalaryMult += 5;
          addClickPower += 10;
          createdTrials.push({
            id: `trial-emperor-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_royal_emperor_all_access',
            label: `Trial Royal Emperor All-Access (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🔱',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: 'admin',
            revertSnapshot: {
              previousCardTier: nonTrialCardTier,
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
              previousVipShield: nonTrialVipShield,
              deltaClickPower: 10,
              deltaSalaryMultiplier: 5,
            },
          });
          break;
        case 'trial_gacha_mystery_duration':
          addCash += 1_000_000 * qty;
          enableBlueCheck = true;
          if (currentAccount.cardTier !== 'admin') forceCardTier = 'platinum';
          addSalaryMult += 3;
          createdTrials.push({
            id: `trial-mystdur-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_gacha_mystery_duration',
            label: `Trial Misteri VIP & Boost (${formatTrialDurationLabel(trialMins)})`,
            emoji: '🎲',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            grantedTrialCardTier: 'platinum',
            revertSnapshot: {
              previousCardTier: nonTrialCardTier,
              previousVerified: nonTrialVerified,
              previousVerifiedLabel: nonTrialVerifiedLabel,
              deltaSalaryMultiplier: 3,
            },
          });
          break;
        case 'trial_double_reward_points':
          addPoints += 5_000 * qty;
          addGoldGrams += 1 * qty;
          setCashbackPct = Math.max(setCashbackPct || 0, 30);
          createdTrials.push({
            id: `trial-dblpts-${Date.now()}-${Math.floor(Math.random() * 999)}`,
            rewardType: 'trial_double_reward_points',
            label: `Trial Cashback 30% & Loyalitas (${formatTrialDurationLabel(trialMins)})`,
            emoji: '⭐',
            startedAt: nowDate.toISOString(),
            expiresAt: expiresIso,
            durationMinutes: trialMins,
            revertSnapshot: { previousCashbackPercent: nonTrialCashbackPercent },
          });
          break;
        case 'cash_thr_lebaran_pack':
          addCash += 4_000_000 * qty;
          addGoldGrams += 2 * qty;
          addCoins += 250 * qty;
          break;
        case 'cash_startup_modal':
        case 'cash_billionaire_vault':
          addCash += qty;
          break;
        case 'spin_mega_ticket_bundle':
          addCoins += 500 * qty;
          addPoints += 10_000 * qty;
          break;
        case 'job_level_mega_jump':
          addJobLevels += qty;
          break;
        case 'voucher_sultan_50':
          addVouchers += qty;
          break;
        case 'gold_bar_50g_royal':
          addGoldGrams += qty;
          break;
        case 'gold_coin_nusantara_pack':
          addGoldGrams += 5 * qty;
          addCoins += 300 * qty;
          break;
        case 'deposito_platinum_50m':
          depositoAmount += qty;
          break;
        case 'dream_pocket_education_fund':
        case 'dream_pocket_house_fund':
          pocketAmount += qty;
          break;
        case 'pln_industrial_pack':
          addPlnKwh += qty;
          break;
        case 'pulsa_roaming_vip':
          addPulsa += qty;
          break;
        case 'diamond_all_permanent_pack':
          if (currentAccount.cardTier !== 'admin') forceCardTier = 'platinum';
          enableBlueCheck = true;
          enableShield = true;
          addCash += 10_000_000 * qty;
          addGoldGrams += 10 * qty;
          break;
      }
    }

    const tierOrder: CardTier[] = ['regular', 'gold', 'premium', 'platinum'];
    const isUnlim =
      currentAccount.cardTier === 'admin' ||
      forceCardTier === 'admin' ||
      explicitTargetTier === 'admin' ||
      isUnlimitedNumber(currentAccount.balance);

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id !== currentAccount.id) return acc;
        let nextTier = acc.cardTier;
        if (explicitTargetTier) {
          nextTier = explicitTargetTier;
        } else if (forceCardTier === 'admin') {
          nextTier = 'admin';
        } else {
          if (tierUpgradeSteps > 0 && acc.cardTier !== 'admin') {
            const idx = tierOrder.indexOf(acc.cardTier);
            const nextIdx = Math.min(tierOrder.length - 1, Math.max(0, idx) + tierUpgradeSteps);
            nextTier = tierOrder[nextIdx];
          }
          if (forceCardTier && acc.cardTier !== 'admin') {
            const curIdx = tierOrder.indexOf(nextTier);
            const forceIdx = tierOrder.indexOf(forceCardTier);
            if (forceIdx > curIdx) {
              nextTier = forceCardTier;
            }
          }
        }
        const nextBiz = { ...(acc.empireBusinesses || {}) };
        Object.entries(addBusinesses).forEach(([k, v]) => {
          nextBiz[k] = (nextBiz[k] || 0) + v;
        });
        const nextTrd = { ...(acc.empireTradingHoldings || {}) };
        Object.entries(addTrading).forEach(([k, v]) => {
          nextTrd[k] = (nextTrd[k] || 0) + v;
        });
        const newGoldBatches =
          addGoldGrams > 0
            ? [
                ...(acc.goldBatches || []),
                {
                  id: `gold-gift-${Date.now()}`,
                  purchasedAt: new Date().toISOString(),
                  purchaseDateKey: new Date().toISOString().slice(0, 10),
                  grams: addGoldGrams,
                  costRupiah: 0,
                  pricePerGramAtBuy: goldMarketConfig.currentPricePerGram,
                  goldForm: 'batangan' as const,
                  motif: 'royal_platinum' as const,
                  note: `Hadiah Surat dari ${ev.senderName}`,
                },
              ]
            : acc.goldBatches;

        const hasBlueTrial = createdTrials.some(
          (t) =>
            t.rewardType === 'trial_blue_checkmark' ||
            t.rewardType === 'sultan_starter_pack' ||
            t.rewardType === 'trial_diamond_combo'
        );

        return {
          ...acc,
          balance: isUnlim ? UNLIMITED_BALANCE : acc.balance + addCash,
          spinCoins: (acc.spinCoins || 0) + addCoins,
          levelVouchers: (acc.levelVouchers || 0) + addVouchers,
          jobLevel: (acc.jobLevel || 1) + addJobLevels,
          goldGrams: (acc.goldGrams || 0) + addGoldGrams,
          goldBatches: newGoldBatches,
          rewardPoints: (acc.rewardPoints || 0) + addPoints,
          pulsaBalance: (acc.pulsaBalance || 0) + addPulsa,
          plnKwhBalance: (acc.plnKwhBalance || 0) + addPlnKwh,
          clickPower: (acc.clickPower || 1) + addClickPower,
          salaryMultiplier: (acc.salaryMultiplier || 1) + addSalaryMult,
          cashbackPercent: setCashbackPct !== null ? Math.max(acc.cashbackPercent || 0, setCashbackPct) : acc.cashbackPercent,
          vipShieldActive: enableShield ? true : acc.vipShieldActive,
          isVerified: enableBlueCheck ? true : acc.isVerified,
          verifiedAt: enableBlueCheck ? acc.verifiedAt || new Date().toISOString() : acc.verifiedAt,
          verifiedLabel: enableBlueCheck
            ? acc.verifiedLabel || (hasBlueTrial ? 'Centang Biru Trial' : 'Nasabah Prioritas Terverifikasi')
            : acc.verifiedLabel,
          cardTier: nextTier,
          devRoleId: grantedDevRoleId !== undefined ? grantedDevRoleId : acc.devRoleId,
          empireBusinesses: nextBiz,
          empireTradingHoldings: nextTrd,
          activeTrials: [...existingActiveTrials, ...createdTrials],
        };
      })
    );

    if (depositoAmount > 0) {
      const dep: DepositoRecord = {
        id: `depo-gift-${Date.now()}`,
        accountId: currentAccount.id,
        principalAmount: depositoAmount,
        tenorMonths: 6,
        interestRateAnnual: 12,
        maturityDate: new Date(Date.now() + 180 * 86400 * 1000).toISOString(),
        projectedReturn: Math.round(depositoAmount * 1.06),
        certificateNumber: `DEP-GIFT-${Date.now().toString().slice(-6)}`,
        status: 'active',
        openedAt: new Date().toISOString(),
      };
      setDepositos((prev) => [dep, ...prev]);
    }

    if (pocketAmount > 0) {
      const pkt: PocketSaving = {
        id: `pkt-gift-${Date.now()}`,
        accountId: currentAccount.id,
        title: `Celengan Hadiah: ${ev.title.slice(0, 28)}`,
        targetAmount: pocketAmount,
        currentAmount: pocketAmount,
        color: 'amber',
        icon: '🎁',
      };
      setPockets((prev) => [pkt, ...prev]);
    }

    if (shouldForgiveLoans) {
      setLoans((prev) =>
        prev.map((ln) =>
          ln.accountId === currentAccount.id && ln.status === 'approved'
            ? { ...ln, status: 'approved', remainingInstallments: 0, adminNotes: `Dilunasi oleh Hadiah ${ev.senderName}` }
            : ln
        )
      );
    }

    if (addCash > 0 || addCoins > 0) {
      const tx: Transaction = {
        id: `tx-gift-${Date.now()}`,
        accountId: currentAccount.id,
        type: 'setor',
        title: `🎁 Hadiah & Surat Spesial: ${ev.title} (Dari ${ev.senderName})`,
        amount: addCash,
        coinAmount: addCoins,
        recipientAccount: currentAccount.accountNumber,
        recipientName: currentAccount.fullName,
        description: summaryLines.join(' • '),
        status: 'success',
        referenceNo: `GIFT-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        category: 'redeem',
      };
      setTransactions((prev) => [tx, ...prev]);
    }

    const updatedEvents = giftEvents.map((item) => {
      if (item.id !== eventId) return item;
      const nextClaimed = Array.from(new Set([...(item.claimedByAccountIds || []), currentAccount.id]));
      const nextViewed = Array.from(new Set([...(item.viewedByAccountIds || []), currentAccount.id]));
      const nextGachaMap =
        rolledResults.length > 0
          ? { ...(item.gachaResultsByAccount || {}), [currentAccount.id]: rolledResults }
          : item.gachaResultsByAccount;
      return {
        ...item,
        claimedByAccountIds: nextClaimed,
        viewedByAccountIds: nextViewed,
        gachaResultsByAccount: nextGachaMap,
      };
    });
    setGiftEvents(updatedEvents);
    syncGiftEventsToServer(updatedEvents);

    addNotification(
      `🎁 Kotak Hadiah Berhasil Diklaim`,
      `Kotak Hadiah "${ev.title}" dari ${ev.senderName} berhasil diklaim ke akun Anda.`,
      'success',
      {
        category: 'promo',
        targetView: 'dashboard',
        targetDashboardTab: 'ringkasan',
        accountId: currentAccount.id,
      }
    );

    try {
      confetti({ particleCount: 95, spread: 80, origin: { y: 0.55 } });
    } catch { /* empty */ }
    playAtmSound('success');

    return {
      success: true,
      alreadyClaimed: false,
      summaryLines,
      rolledResults,
      message: `Kotak Hadiah dari ${ev.senderName} berhasil diklaim dan seluruh isinya langsung masuk otomatis ke akun Anda!`,
    };
  };

  const adminCreateOrUpdateGiftEvent = (input: {
    id?: string;
    title: string;
    senderName: string;
    letterMessage: string;
    deliveryContentMode?: 'both' | 'letter_only' | 'gift_only';
    triggerMode: 'scheduled_date' | 'manual_instant' | 'both';
    autoPopupEnabled: boolean;
    strictDateLock?: boolean;
    isGachaBox?: boolean;
    scheduleMonth: number;
    scheduleDay: number;
    isActive: boolean;
    targetAccountId?: string;
    targetAccountIds?: string[];
    revokedAccountIds?: string[];
    themeColor?: 'amber' | 'emerald' | 'rose' | 'indigo';
    rewards: AdminGiftRewardItem[];
    customSealConfig?: LetterSignatureStampConfig | null;
    frequencyType?: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_recurring';
    recurringIntervalHours?: number;
    autoRotateRecurring?: boolean;
    maxRedeemsPerUser?: number;
    targetCardTier?: CardTier | 'all';
    targetDevRoleOnly?: string;
    celebrationEffect?: 'confetti' | 'gold_rain' | 'fireworks' | 'none';
    soundEffect?: 'chime' | 'harp' | 'fanfare' | 'silent';
    requireAdminVerifiedAccessForNotif?: boolean;
    adminAuditLogTag?: string;
    customStampText?: string;
    watermarkText?: string;
    securityHashToken?: string;
    allowAnonymousClaim?: boolean;
    notifyOnlyAdminVerifiedUsers?: boolean;
    priorityLevel?: 'normal' | 'high' | 'vip_exclusive';
    customCssTheme?: string;
    attachmentFileUrl?: string;
    attachmentFileName?: string;
    autoExpireHours?: number;
    allowTransferableGift?: boolean;
  }): { success: boolean; message: string; event: AdminGiftEventPackage } => {
    const monthLabel = MONTHS_INDO.find((m) => m.value === input.scheduleMonth)?.label || `Bulan ${input.scheduleMonth}`;
    const freq = input.frequencyType || 'monthly';
    const scheduleLabel =
      freq === 'daily'
        ? 'Setiap Hari (Otomatis)'
        : freq === 'hourly'
        ? 'Setiap Jam (Otomatis)'
        : freq === 'monthly'
        ? `Setiap Bulan • Tgl ${input.scheduleDay}`
        : `${input.scheduleDay} ${monthLabel}`;
    const existing = input.id ? giftEvents.find((e) => e.id === input.id) : null;
    const contentMode: 'both' | 'letter_only' | 'gift_only' =
      input.deliveryContentMode || existing?.deliveryContentMode || 'both';

    // Normalize recipient targets (All accounts vs 1 specific account vs Multiple selected accounts)
    let resolvedTargetAccountId: string = '__ALL__';
    let resolvedTargetAccountIds: string[] = [];

    if (input.targetAccountId === '__ALL__') {
      resolvedTargetAccountId = '__ALL__';
      resolvedTargetAccountIds = [];
    } else if (Array.isArray(input.targetAccountIds) && input.targetAccountIds.length > 0) {
      resolvedTargetAccountIds = Array.from(new Set(input.targetAccountIds.filter(Boolean)));
      resolvedTargetAccountId =
        resolvedTargetAccountIds.length === 1 ? resolvedTargetAccountIds[0] : '__MULTI__';
    } else if (input.targetAccountId && input.targetAccountId !== '__MULTI__') {
      resolvedTargetAccountId = input.targetAccountId;
      resolvedTargetAccountIds = [input.targetAccountId];
    }

    const resolvedRewards =
      contentMode === 'letter_only'
        ? input.rewards
        : input.rewards.length > 0
        ? input.rewards
        : DEFAULT_ADMIN_GIFT_EVENTS[0].rewards;

    const savedEvent: AdminGiftEventPackage = {
      id: existing ? existing.id : `gift-ev-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      title:
        input.title.trim() ||
        (contentMode === 'letter_only'
          ? `Surat Resmi ${scheduleLabel}`
          : contentMode === 'gift_only'
          ? `Kotak Hadiah ${scheduleLabel}`
          : `Hadiah & Surat ${scheduleLabel}`),
      senderName: input.senderName.trim() || 'Admin Utama Bank Nusantara',
      letterMessage: input.letterMessage.trim() || 'Selamat menerima kiriman spesial dari Bank Nusantara!',
      deliveryContentMode: contentMode,
      triggerMode: input.triggerMode,
      autoPopupEnabled: input.autoPopupEnabled,
      strictDateLock: input.strictDateLock !== undefined ? input.strictDateLock : true,
      unlockedByManualSend: existing?.unlockedByManualSend ?? false,
      isGachaBox:
        contentMode === 'letter_only'
          ? false
          : input.isGachaBox ?? resolvedRewards.some((r) => r.rewardMode === 'gacha'),
      scheduleMonth: Math.min(12, Math.max(1, input.scheduleMonth || 1)),
      scheduleDay: Math.min(31, Math.max(1, input.scheduleDay || 29)),
      scheduleLabel,
      isActive: input.isActive,
      targetAccountId: resolvedTargetAccountId,
      targetAccountIds: resolvedTargetAccountIds,
      revokedAccountIds:
        input.revokedAccountIds !== undefined
          ? input.revokedAccountIds
          : existing?.revokedAccountIds || [],
      letterOpenedByAccountIds: existing?.letterOpenedByAccountIds || [],
      themeColor: input.themeColor || 'amber',
      rewards: resolvedRewards,
      claimedByAccountIds: existing ? existing.claimedByAccountIds : [],
      viewedByAccountIds: existing ? existing.viewedByAccountIds : [],
      gachaResultsByAccount: existing?.gachaResultsByAccount,
      customSealConfig: input.customSealConfig !== undefined ? input.customSealConfig : existing?.customSealConfig,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastTriggeredAt: existing?.lastTriggeredAt,
      transferredOutByAccountIds: existing?.transferredOutByAccountIds,
      transferredToAccountIds: existing?.transferredToAccountIds,
      transferHistoryByRecipient: existing?.transferHistoryByRecipient,

      frequencyType: input.frequencyType || 'monthly',
      recurringIntervalHours: input.recurringIntervalHours || 24,
      autoRotateRecurring: input.autoRotateRecurring ?? false,
      maxRedeemsPerUser: input.maxRedeemsPerUser || 1,
      targetCardTier: input.targetCardTier || 'all',
      targetDevRoleOnly: input.targetDevRoleOnly || '',
      celebrationEffect: input.celebrationEffect || 'confetti',
      soundEffect: input.soundEffect || 'chime',
      requireAdminVerifiedAccessForNotif: input.requireAdminVerifiedAccessForNotif ?? true,
      adminAuditLogTag: input.adminAuditLogTag || 'GIFT-AUDIT-LOG',
      customStampText: input.customStampText || 'BANK NUSANTARA RESMI',
      watermarkText: input.watermarkText || 'CONFIDENTIAL SULTAN',
      securityHashToken: input.securityHashToken || `BN-HASH-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      allowAnonymousClaim: input.allowAnonymousClaim ?? false,
      notifyOnlyAdminVerifiedUsers: input.notifyOnlyAdminVerifiedUsers ?? true,
      priorityLevel: input.priorityLevel || 'normal',
      customCssTheme: input.customCssTheme || 'default',
      attachmentFileUrl: input.attachmentFileUrl || '',
      attachmentFileName: input.attachmentFileName || '',
      autoExpireHours: input.autoExpireHours || 72,
      allowTransferableGift: input.allowTransferableGift ?? true,
    };

    const nextList = existing
      ? giftEvents.map((e) => (e.id === existing.id ? savedEvent : e))
      : [savedEvent, ...giftEvents];
    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });
    playAtmSound('success');

    const modeLabel =
      contentMode === 'letter_only'
        ? 'Surat Saja'
        : contentMode === 'gift_only'
        ? 'Hadiah Saja'
        : 'Hadiah & Surat Sekaligus';
    const recipientSummary =
      resolvedTargetAccountId === '__ALL__'
        ? `Semua Nasabah (${accounts.length} akun)`
        : `${resolvedTargetAccountIds.length} akun terpilih`;

    return {
      success: true,
      event: savedEvent,
      message: existing
        ? `Paket "${savedEvent.title}" [Mode: ${modeLabel} • Penerima: ${recipientSummary}] berhasil diperbarui!`
        : `Paket baru "${savedEvent.title}" [Mode: ${modeLabel} • Penerima: ${recipientSummary}] dijadwalkan untuk ${scheduleLabel}!`,
    };
  };

  const adminDeleteGiftEvent = (eventId: string) => {
    const nextList = giftEvents.filter((e) => e.id !== eventId);
    const nextDeletedGiftEventIds = Array.from(new Set([...deletedGiftEventIds, eventId]));
    setDeletedGiftEventIds(nextDeletedGiftEventIds);
    setGiftEventsInitialized(true);
    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList, nextDeletedGiftEventIds);
    flushMasterStateToCloud({
      giftEvents: nextList,
      deletedGiftEventIds: nextDeletedGiftEventIds,
      giftEventsInitialized: true,
    });
    playAtmSound('beep');
    return { success: true, message: 'Paket Hadiah & Surat berhasil dihapus permanen di semua perangkat & Cloud!' };
  };

  const adminToggleGiftEventActive = (eventId: string) => {
    const nextList = giftEvents.map((e) =>
      e.id === eventId ? { ...e, isActive: !e.isActive, updatedAt: new Date().toISOString() } : e
    );
    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });
    return { success: true, message: 'Status aktif paket Hadiah & Surat berhasil diubah.' };
  };

  const adminTriggerGiftEventNow = (eventId: string) => {
    const target = giftEvents.find((e) => e.id === eventId);
    if (!target) return { success: false, message: 'Paket hadiah tidak ditemukan.' };
    const nowIso = new Date().toISOString();
    const nextList = giftEvents.map((e) =>
      e.id === eventId
        ? {
            ...e,
            isActive: true,
            unlockedByManualSend: true,
            triggerMode: e.triggerMode === 'scheduled_date' ? ('both' as const) : e.triggerMode,
            lastTriggeredAt: nowIso,
            viewedByAccountIds: [],
            letterOpenedByAccountIds: [],
            claimedByAccountIds: [],
            updatedAt: nowIso,
          }
        : e
    );
    setGiftEvents(nextList);
    Array.from(openingGiftBoxKeysRef.current).forEach((k) => {
      if (k.startsWith(`${eventId}:`)) {
        openingGiftBoxKeysRef.current.delete(k);
      }
    });
    setOpeningGiftBoxKeys(Array.from(openingGiftBoxKeysRef.current));
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });
    playAtmSound('success');
    const modeLabel =
      target.deliveryContentMode === 'letter_only'
        ? 'Surat Resmi'
        : target.deliveryContentMode === 'gift_only'
        ? 'Kotak Hadiah'
        : 'Hadiah & Surat';
    return {
      success: true,
      message: `🎁 Kiriman Manual ${modeLabel} "${target.title}" dari "${target.senderName}" langsung dikirimkan ke penerima terpilih!`,
    };
  };

  const adminResetGiftEventStatus = (
    eventId: string,
    options?: {
      accountId?: string;
      resetType?: 'all' | 'claim_only' | 'letter_only';
      retriggerPopup?: boolean;
    }
  ): { success: boolean; message: string } => {
    const target = giftEvents.find((e) => e.id === eventId);
    if (!target) return { success: false, message: 'Paket hadiah & surat tidak ditemukan.' };
    const resetType = options?.resetType || 'all';
    const specificAccId = options?.accountId;
    const retrigger = options?.retriggerPopup !== false;
    const nowIso = new Date().toISOString();

    const nextList = giftEvents.map((e) => {
      if (e.id !== eventId) return e;
      let nextClaimed = e.claimedByAccountIds || [];
      let nextViewed = e.viewedByAccountIds || [];
      let nextLetterOpened = e.letterOpenedByAccountIds || [];
      let nextGachaMap = { ...(e.gachaResultsByAccount || {}) };
      let nextTransferredOut = e.transferredOutByAccountIds || [];
      let nextRevoked = e.revokedAccountIds || [];

      if (specificAccId) {
        nextRevoked = nextRevoked.filter((id) => id !== specificAccId);
        if (resetType === 'all' || resetType === 'claim_only') {
          nextClaimed = nextClaimed.filter((id) => id !== specificAccId);
          nextTransferredOut = nextTransferredOut.filter((id) => id !== specificAccId);
          delete nextGachaMap[specificAccId];
        }
        if (resetType === 'all' || resetType === 'letter_only') {
          nextViewed = nextViewed.filter((id) => id !== specificAccId);
          nextLetterOpened = nextLetterOpened.filter((id) => id !== specificAccId);
        } else if (retrigger) {
          nextViewed = nextViewed.filter((id) => id !== specificAccId);
        }
      } else {
        nextRevoked = [];
        if (resetType === 'all' || resetType === 'claim_only') {
          nextClaimed = [];
          nextTransferredOut = [];
          nextGachaMap = {};
        }
        if (resetType === 'all' || resetType === 'letter_only') {
          nextViewed = [];
          nextLetterOpened = [];
        } else if (retrigger) {
          nextViewed = [];
        }
      }

      return {
        ...e,
        isActive: true,
        unlockedByManualSend: retrigger ? true : e.unlockedByManualSend,
        lastTriggeredAt: retrigger ? nowIso : e.lastTriggeredAt,
        claimedByAccountIds: nextClaimed,
        viewedByAccountIds: nextViewed,
        letterOpenedByAccountIds: nextLetterOpened,
        gachaResultsByAccount: nextGachaMap,
        transferredOutByAccountIds: nextTransferredOut,
        revokedAccountIds: nextRevoked,
        updatedAt: nowIso,
      };
    });

    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });

    // Aktifkan kembali fitur Transfer Hadiah ke Teman saat Admin mereset status klaim
    if (resetType === 'all' || resetType === 'claim_only') {
      if (specificAccId) {
        openingGiftBoxKeysRef.current.delete(`${eventId}:${specificAccId}`);
      } else {
        Array.from(openingGiftBoxKeysRef.current).forEach((k) => {
          if (k.startsWith(`${eventId}:`)) {
            openingGiftBoxKeysRef.current.delete(k);
          }
        });
      }
      setOpeningGiftBoxKeys(Array.from(openingGiftBoxKeysRef.current));
    }

    playAtmSound('success');

    const accObj = specificAccId ? accounts.find((a) => a.id === specificAccId) : null;
    const targetName = accObj ? `${accObj.fullName} (${accObj.accountNumber})` : 'Seluruh Penerima';
    const typeLabel =
      resetType === 'claim_only'
        ? 'Status Klaim Hadiah'
        : resetType === 'letter_only'
        ? 'Status Baca Surat'
        : 'Status Klaim Hadiah & Baca Surat';

    return {
      success: true,
      message: `🔄 ${typeLabel} untuk ${targetName} pada paket "${target.title}" berhasil di-reset! Pengguna dapat membuka/mengklaim ulang sekarang.`,
    };
  };

  const adminToggleRevokeGiftEventRecipient = (
    eventId: string,
    accountId: string
  ): { success: boolean; message: string; isRevoked: boolean } => {
    const target = giftEvents.find((e) => e.id === eventId);
    if (!target) {
      return { success: false, message: 'Paket tidak ditemukan.', isRevoked: false };
    }
    const accObj = accounts.find((a) => a.id === accountId);
    const currentlyRevoked = (target.revokedAccountIds || []).includes(accountId);
    const nowIso = new Date().toISOString();

    const nextList = giftEvents.map((e) => {
      if (e.id !== eventId) return e;
      const prevRevoked = e.revokedAccountIds || [];
      const nextRevoked = currentlyRevoked
        ? prevRevoked.filter((id) => id !== accountId)
        : Array.from(new Set([...prevRevoked, accountId]));
      const nextViewed = currentlyRevoked
        ? (e.viewedByAccountIds || []).filter((id) => id !== accountId)
        : e.viewedByAccountIds || [];
      return {
        ...e,
        revokedAccountIds: nextRevoked,
        viewedByAccountIds: nextViewed,
        updatedAt: nowIso,
      };
    });

    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });
    if (
      !currentlyRevoked &&
      currentAccount?.id === accountId &&
      activeGiftModal?.eventId === eventId
    ) {
      setActiveGiftModal(null);
    }
    playAtmSound('beep');

    const accLabel = accObj ? `${accObj.fullName} (${accObj.accountNumber})` : accountId;
    return {
      success: true,
      isRevoked: !currentlyRevoked,
      message: !currentlyRevoked
        ? `🚫 Kiriman "${target.title}" telah ditarik kembali / dibatalkan dari akun ${accLabel}.`
        : `✅ Kiriman "${target.title}" telah dipulihkan kembali untuk akun ${accLabel}!`,
    };
  };

  const adminDuplicateGiftEvent = (
    eventId: string,
    options?: {
      targetAccountId?: string;
      targetAccountIds?: string[];
      deliveryContentMode?: 'both' | 'letter_only' | 'gift_only';
      sendNow?: boolean;
    }
  ): { success: boolean; message: string; event?: AdminGiftEventPackage } => {
    const source = giftEvents.find((e) => e.id === eventId);
    if (!source) return { success: false, message: 'Paket sumber tidak ditemukan.' };
    const nowIso = new Date().toISOString();

    let nextTargetId = options?.targetAccountId ?? source.targetAccountId ?? '__ALL__';
    let nextTargetIds = options?.targetAccountIds ?? source.targetAccountIds ?? [];
    if (nextTargetId === '__ALL__') {
      nextTargetIds = [];
    } else if (nextTargetIds.length > 0) {
      nextTargetIds = Array.from(new Set(nextTargetIds));
      nextTargetId = nextTargetIds.length === 1 ? nextTargetIds[0] : '__MULTI__';
    } else if (nextTargetId && nextTargetId !== '__MULTI__') {
      nextTargetIds = [nextTargetId];
    }

    const sendNow = options?.sendNow !== false;
    const duplicated: AdminGiftEventPackage = {
      ...source,
      id: `gift-ev-dup-${Date.now()}-${Math.floor(Math.random() * 999)}`,
      title: `${source.title} (Salinan)`,
      deliveryContentMode: options?.deliveryContentMode || source.deliveryContentMode || 'both',
      targetAccountId: nextTargetId,
      targetAccountIds: nextTargetIds,
      revokedAccountIds: [],
      claimedByAccountIds: [],
      viewedByAccountIds: [],
      letterOpenedByAccountIds: [],
      gachaResultsByAccount: {},
      transferredOutByAccountIds: [],
      transferredToAccountIds: [],
      transferHistoryByRecipient: {},
      isActive: true,
      unlockedByManualSend: sendNow ? true : source.unlockedByManualSend,
      lastTriggeredAt: sendNow ? nowIso : undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const nextList = [duplicated, ...giftEvents];
    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });
    playAtmSound('success');

    return {
      success: true,
      event: duplicated,
      message: sendNow
        ? `✨ Paket "${source.title}" berhasil diduplikasi dan langsung dikirimkan ulang!`
        : `✨ Paket "${source.title}" berhasil diduplikasi ke daftar paket!`,
    };
  };

  const adminUpdateGiftEventQuickSettings = (
    eventId: string,
    patch: {
      deliveryContentMode?: 'both' | 'letter_only' | 'gift_only';
      targetAccountId?: string;
      targetAccountIds?: string[];
      letterMessage?: string;
      title?: string;
      senderName?: string;
      retriggerPopup?: boolean;
    }
  ): { success: boolean; message: string } => {
    const target = giftEvents.find((e) => e.id === eventId);
    if (!target) return { success: false, message: 'Paket tidak ditemukan.' };
    const nowIso = new Date().toISOString();

    const nextList = giftEvents.map((e) => {
      if (e.id !== eventId) return e;
      let nextTargetId = patch.targetAccountId ?? e.targetAccountId ?? '__ALL__';
      let nextTargetIds = patch.targetAccountIds ?? e.targetAccountIds ?? [];
      if (nextTargetId === '__ALL__') {
        nextTargetIds = [];
      } else if (nextTargetIds.length > 0) {
        nextTargetIds = Array.from(new Set(nextTargetIds));
        nextTargetId = nextTargetIds.length === 1 ? nextTargetIds[0] : '__MULTI__';
      } else if (nextTargetId && nextTargetId !== '__MULTI__') {
        nextTargetIds = [nextTargetId];
      }

      return {
        ...e,
        title: patch.title !== undefined ? patch.title : e.title,
        senderName: patch.senderName !== undefined ? patch.senderName : e.senderName,
        letterMessage: patch.letterMessage !== undefined ? patch.letterMessage : e.letterMessage,
        deliveryContentMode: patch.deliveryContentMode || e.deliveryContentMode || 'both',
        targetAccountId: nextTargetId,
        targetAccountIds: nextTargetIds,
        unlockedByManualSend: patch.retriggerPopup ? true : e.unlockedByManualSend,
        lastTriggeredAt: patch.retriggerPopup ? nowIso : e.lastTriggeredAt,
        viewedByAccountIds: patch.retriggerPopup ? [] : e.viewedByAccountIds,
        updatedAt: nowIso,
      };
    });

    setGiftEvents(nextList);
    syncGiftEventsToServer(nextList);
    flushMasterStateToCloud({ giftEvents: nextList });
    playAtmSound('success');

    return {
      success: true,
      message: `✅ Pengaturan paket "${target.title}" berhasil diperbarui secara real-time!`,
    };
  };

  const adminSetGiftDateTestOverride = (override: { month: number; day: number } | null) => {
    setGiftDateTestOverride(override);
    if (override) {
      // Allow re-viewing scheduled events for that test date when testing in Admin
      const nextList = giftEvents.map((e) =>
        e.scheduleMonth === override.month && e.scheduleDay === override.day
          ? { ...e, viewedByAccountIds: [] }
          : e
      );
      setGiftEvents(nextList);
    }
  };

  const adminUpdateJobCoinBonusConfig = (config: JobCoinBonusConfig) => {
    const cleanConfig: JobCoinBonusConfig = {
      enabled: Boolean(config.enabled),
      coinMultiplier: Math.max(0.1, Number(config.coinMultiplier) || 1),
      extraBonusCoins: Math.max(0, Math.round(Number(config.extraBonusCoins) || 0)),
    };
    setJobCoinBonusConfig(cleanConfig);
    playAtmSound('success');
    return {
      success: true,
      message: cleanConfig.enabled
        ? `✅ Bonus Coin Pekerjaan AKTIF: Pengali ${cleanConfig.coinMultiplier}x Coin + Ekstra +${cleanConfig.extraBonusCoins.toLocaleString('id-ID')} Coin per selesai kerja!`
        : '⏸️ Pengali & Bonus Coin Ekstra Pekerjaan dinonaktifkan (kembali ke 1x Coin dasar).',
    };
  };

  const adminExecuteUniversalGachaDrop = (input: {
    targetAccountId: string | '__ALL__';
    rewardType: GiftRewardType;
    title: string;
    senderName: string;
    letterMessage?: string;
    deliveryMode: 'send_animated_box' | 'instant_roll_to_accounts';
    tiers: GachaTierRange[];
    trialDurationMinutes?: number;
  }): {
    success: boolean;
    message: string;
    logs: { accountName: string; accountNumber: string; tierLabel: string; amount: number; unitLabel: string }[];
  } => {
    const meta = GIFT_REWARD_CATALOG.find((c) => c.type === input.rewardType) || GIFT_REWARD_CATALOG[0];
    if (!input.tiers || input.tiers.length === 0) {
      return { success: false, message: 'Tambahkan minimal 1 tier rentang Min–Max.', logs: [] };
    }

    if (input.deliveryMode === 'send_animated_box') {
      const now = new Date();
      const nowMonth = now.getMonth() + 1;
      const nowDay = now.getDate();
      const monthLabel = MONTHS_INDO.find((m) => m.value === nowMonth)?.label || '';
      const gachaPackage: AdminGiftEventPackage = {
        id: `gacha-box-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        title: input.title.trim() || `🎲 Kotak Gacha Spesial: ${meta.label}`,
        senderName: input.senderName.trim() || 'Admin Gacha Nusantara',
        letterMessage:
          input.letterMessage?.trim() ||
          `Anda mendapat kiriman Kotak Gacha berpeluang dari ${input.senderName || 'Admin'}! Periksa rentang Min–Max dan peluang % di bawah lalu putar Gacha untuk mengklaim hadiah Anda.`,
        triggerMode: 'manual_instant',
        autoPopupEnabled: true,
        strictDateLock: false,
        unlockedByManualSend: true,
        isGachaBox: true,
        scheduleMonth: nowMonth,
        scheduleDay: nowDay,
        scheduleLabel: `${nowDay} ${monthLabel}`,
        isActive: true,
        targetAccountId: input.targetAccountId || '__ALL__',
        themeColor: 'indigo',
        rewards: [
          {
            id: `gacha-rew-${Date.now()}`,
            type: meta.type,
            label: meta.label,
            amount: meta.defaultAmount,
            unitLabel: meta.unitLabel,
            emoji: meta.emoji,
            trialDurationMinutes: meta.isTrial ? input.trialDurationMinutes || meta.defaultTrialMinutes || 1440 : undefined,
            rewardMode: 'gacha',
            gachaTiers: input.tiers,
          },
        ],
        claimedByAccountIds: [],
        viewedByAccountIds: [],
        lastTriggeredAt: now.toISOString(),
        createdAt: now.toISOString(),
      };

      const nextEvents = [gachaPackage, ...giftEvents];
      setGiftEvents(nextEvents);
      syncGiftEventsToServer(nextEvents);
      playAtmSound('success');
      return {
        success: true,
        message: `🎲 Kotak Gacha "${gachaPackage.title}" langsung dikirim ke layar nasabah! Nasabah bisa melihat info Min–Max & % peluang sebelum menekan Roll.`,
        logs: [],
      };
    }

    // Instant roll & credit to target account(s)
    const targetAccs =
      input.targetAccountId === '__ALL__'
        ? accounts
        : accounts.filter((a) => a.id === input.targetAccountId);
    if (targetAccs.length === 0) {
      return { success: false, message: 'Tidak ada rekening tujuan yang valid.', logs: [] };
    }

    const logs: { accountName: string; accountNumber: string; tierLabel: string; amount: number; unitLabel: string }[] = [];
    const perAccountRoll = new Map<
      string,
      { tierLabel: string; probabilityPercent: number; amount: number }
    >();
    targetAccs.forEach((acc) => {
      const r = rollGachaOutcome(input.tiers, meta.step);
      perAccountRoll.set(acc.id, {
        tierLabel: r.tierLabel,
        probabilityPercent: r.probabilityPercent,
        amount: r.rolledAmount,
      });
      logs.push({
        accountName: acc.fullName,
        accountNumber: acc.accountNumber,
        tierLabel: r.tierLabel,
        amount: r.rolledAmount,
        unitLabel: meta.unitLabel,
      });
    });

    const newTxs: Transaction[] = [];
    const tierOrder: CardTier[] = ['regular', 'gold', 'premium', 'platinum'];

    setAccounts((prev) =>
      prev.map((acc) => {
        const res = perAccountRoll.get(acc.id);
        if (!res) return acc;
        const qty = Math.max(1, res.amount);
        const isUnlim = acc.cardTier === 'admin' || isUnlimitedNumber(acc.balance);
        const trialMins = Math.max(1, input.trialDurationMinutes || meta.defaultTrialMinutes || 1440);
        const nowDate = new Date();
        const expiresIso = new Date(nowDate.getTime() + trialMins * 60_000).toISOString();
        const activeTrials = (acc.activeTrials || []).filter(
          (t) => new Date(t.expiresAt).getTime() > Date.now()
        );

        let next = { ...acc };
        switch (meta.type) {
          case 'cash_balance':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + qty;
            break;
          case 'spin_coins':
            next.spinCoins = (acc.spinCoins || 0) + qty;
            break;
          case 'level_voucher':
            next.levelVouchers = (acc.levelVouchers || 0) + qty;
            break;
          case 'job_level_up':
            next.jobLevel = (acc.jobLevel || 1) + qty;
            break;
          case 'gold_grams':
            next.goldGrams = (acc.goldGrams || 0) + qty;
            break;
          case 'reward_points':
            next.rewardPoints = (acc.rewardPoints || 0) + qty;
            break;
          case 'pulsa_balance':
            next.pulsaBalance = (acc.pulsaBalance || 0) + qty;
            break;
          case 'pln_kwh':
            next.plnKwhBalance = (acc.plnKwhBalance || 0) + qty;
            break;
          case 'click_power_boost':
            next.clickPower = (acc.clickPower || 1) + qty;
            break;
          case 'salary_multiplier_boost':
            next.salaryMultiplier = (acc.salaryMultiplier || 1) + qty;
            break;
          case 'cashback_percent':
            next.cashbackPercent = Math.max(acc.cashbackPercent || 0, Math.min(100, qty));
            break;
          case 'vip_shield':
            next.vipShieldActive = true;
            break;
          case 'blue_checkmark':
            next.isVerified = true;
            next.verifiedAt = acc.verifiedAt || nowDate.toISOString();
            next.verifiedLabel = acc.verifiedLabel || 'Terverifikasi Admin';
            break;
          case 'upgrade_card_tier':
            if (acc.cardTier !== 'admin') {
              const idx = Math.min(tierOrder.length - 1, Math.max(0, tierOrder.indexOf(acc.cardTier)) + qty);
              next.cardTier = tierOrder[idx];
            }
            break;
          case 'trial_blue_checkmark':
            next.isVerified = true;
            next.verifiedLabel = acc.verifiedLabel || 'Centang Biru Trial';
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-gacha-blue-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_blue_checkmark',
                label: `Centang Biru Trial (${formatTrialDurationLabel(trialMins)})`,
                emoji: '☑️',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { previousVerified: acc.isVerified, previousVerifiedLabel: acc.verifiedLabel },
              },
            ];
            break;
          case 'trial_vip_shield':
            next.vipShieldActive = true;
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-gacha-vip-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_vip_shield',
                label: `VIP Shield Trial (${formatTrialDurationLabel(trialMins)})`,
                emoji: '🛡️',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { previousVipShield: acc.vipShieldActive },
              },
            ];
            break;
          case 'trial_gold_card':
          case 'trial_platinum_card':
            if (acc.cardTier !== 'admin') {
              next.cardTier = meta.type === 'trial_platinum_card' ? 'platinum' : 'gold';
            }
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-gacha-tier-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: meta.type,
                label: `${meta.label} (${formatTrialDurationLabel(trialMins)})`,
                emoji: meta.emoji,
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { previousCardTier: acc.cardTier },
              },
            ];
            break;
          case 'trial_career_boost':
            next.clickPower = (acc.clickPower || 1) + 5;
            next.salaryMultiplier = (acc.salaryMultiplier || 1) + qty;
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-gacha-boost-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_career_boost',
                label: `Boost Karir Trial (${formatTrialDurationLabel(trialMins)})`,
                emoji: '⚡',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { deltaClickPower: 5, deltaSalaryMultiplier: qty },
              },
            ];
            break;
          case 'sultan_starter_pack':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 5_000_000 * qty;
            next.spinCoins = (acc.spinCoins || 0) + 300 * qty;
            next.isVerified = true;
            if (acc.cardTier !== 'admin') next.cardTier = 'platinum';
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-gacha-sultan-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'sultan_starter_pack',
                label: `Paket Sultan Trial (${formatTrialDurationLabel(trialMins)})`,
                emoji: '👑',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: {
                  previousVerified: acc.isVerified,
                  previousVerifiedLabel: acc.verifiedLabel,
                  previousCardTier: acc.cardTier,
                },
              },
            ];
            break;
          case 'mystery_thr_combo':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 1_500_000 * qty;
            next.spinCoins = (acc.spinCoins || 0) + 100 * qty;
            next.rewardPoints = (acc.rewardPoints || 0) + 2_000 * qty;
            break;
          case 'salary_jackpot_drop':
          case 'fee_waiver_pass':
          case 'sultan_empire_dividend':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + qty;
            break;
          case 'coin_jackpot_rain':
            next.spinCoins = (acc.spinCoins || 0) + qty;
            break;
          case 'cashback_tier_max':
            next.cashbackPercent = Math.max(acc.cashbackPercent || 0, Math.min(100, qty));
            break;
          case 'double_wallet_bonus':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 3_000_000 * qty;
            next.spinCoins = (acc.spinCoins || 0) + 200 * qty;
            break;
          case 'loyalty_point_chest':
            next.rewardPoints = (acc.rewardPoints || 0) + qty;
            break;
          case 'career_turbo_pack':
            next.jobLevel = (acc.jobLevel || 1) + 2 * qty;
            next.levelVouchers = (acc.levelVouchers || 0) + 3 * qty;
            next.clickPower = (acc.clickPower || 1) + 2 * qty;
            break;
          case 'job_progress_boost':
            next.clickPower = (acc.clickPower || 1) + qty;
            break;
          case 'suit_victory_charm':
          case 'voucher_bundle_pro':
            next.levelVouchers = (acc.levelVouchers || 0) + qty;
            break;
          case 'instant_executive_unlock':
            next.jobLevel = (acc.jobLevel || 1) + qty;
            break;
          case 'gold_bar_royal_10g':
          case 'gold_jewel_bonus':
            next.goldGrams = (acc.goldGrams || 0) + qty;
            break;
          case 'pln_super_pack':
            next.plnKwhBalance = (acc.plnKwhBalance || 0) + qty;
            break;
          case 'upgrade_card_platinum_perm':
            if (acc.cardTier !== 'admin') next.cardTier = 'platinum';
            break;
          case 'role_grant_permanent':
          case 'role_gacha_random_permanent': {
            const randRole = devRoles[Math.floor(Math.random() * devRoles.length)] || devRoles[0];
            if (randRole) next.devRoleId = randRole.id;
            break;
          }
          case 'role_grant_trial':
          case 'role_gacha_random_trial': {
            const randRole = devRoles[Math.floor(Math.random() * devRoles.length)] || devRoles[0];
            if (randRole) {
              next.devRoleId = randRole.id;
              next.activeTrials = [
                ...activeTrials,
                {
                  id: `trial-ugacha-role-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                  rewardType: meta.type,
                  label: `Role ${randRole.name} Trial (${formatTrialDurationLabel(trialMins)})`,
                  emoji: '👑',
                  startedAt: nowDate.toISOString(),
                  expiresAt: expiresIso,
                  durationMinutes: trialMins,
                  revertSnapshot: { previousDevRoleId: acc.devRoleId ?? null },
                },
              ];
            }
            break;
          }
          case 'trial_diamond_combo':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 2_000_000 * qty;
            next.isVerified = true;
            next.vipShieldActive = true;
            if (acc.cardTier !== 'admin') next.cardTier = 'platinum';
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-ugacha-dia-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_diamond_combo',
                label: `Diamond VIP Trial (${formatTrialDurationLabel(trialMins)})`,
                emoji: '💠',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: {
                  previousVerified: acc.isVerified,
                  previousVerifiedLabel: acc.verifiedLabel,
                  previousVipShield: acc.vipShieldActive,
                  previousCardTier: acc.cardTier,
                },
              },
            ];
            break;
          case 'trial_all_assets_boost':
            next.goldGrams = (acc.goldGrams || 0) + 1 * qty;
            next.spinCoins = (acc.spinCoins || 0) + 50 * qty;
            next.clickPower = (acc.clickPower || 1) + 4;
            next.salaryMultiplier = (acc.salaryMultiplier || 1) + qty;
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-ugacha-all-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_all_assets_boost',
                label: `Turbo Boost Trial (${formatTrialDurationLabel(trialMins)})`,
                emoji: '🌟',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { deltaClickPower: 4, deltaSalaryMultiplier: qty },
              },
            ];
            break;
          case 'cash_thr_lebaran_pack':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 4_000_000 * qty;
            next.goldGrams = (acc.goldGrams || 0) + 2 * qty;
            next.spinCoins = (acc.spinCoins || 0) + 250 * qty;
            break;
          case 'cash_startup_modal':
          case 'cash_billionaire_vault':
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + qty;
            break;
          case 'spin_mega_ticket_bundle':
            next.spinCoins = (acc.spinCoins || 0) + 500 * qty;
            next.rewardPoints = (acc.rewardPoints || 0) + 10_000 * qty;
            break;
          case 'job_level_mega_jump':
          case 'job_career_custom_selector':
            next.jobLevel = (acc.jobLevel || 1) + qty;
            break;
          case 'voucher_sultan_50':
            next.levelVouchers = (acc.levelVouchers || 0) + qty;
            break;
          case 'gold_bar_50g_royal':
            next.goldGrams = (acc.goldGrams || 0) + qty;
            break;
          case 'gold_coin_nusantara_pack':
            next.goldGrams = (acc.goldGrams || 0) + 5 * qty;
            next.spinCoins = (acc.spinCoins || 0) + 300 * qty;
            break;
          case 'pln_industrial_pack':
            next.plnKwhBalance = (acc.plnKwhBalance || 0) + qty;
            break;
          case 'pulsa_roaming_vip':
            next.pulsaBalance = (acc.pulsaBalance || 0) + qty;
            break;
          case 'upgrade_card_admin_infinity_perm':
          case 'trial_admin_infinity_card':
            next.cardTier = 'admin';
            next.isVerified = true;
            next.vipShieldActive = true;
            if (meta.type === 'trial_admin_infinity_card') {
              next.activeTrials = [
                ...activeTrials,
                {
                  id: `trial-ugacha-adm-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                  rewardType: 'trial_admin_infinity_card',
                  label: `Trial Kartu Admin Infinity (${formatTrialDurationLabel(trialMins)})`,
                  emoji: '👑',
                  startedAt: nowDate.toISOString(),
                  expiresAt: expiresIso,
                  durationMinutes: trialMins,
                  grantedTrialCardTier: 'admin',
                  revertSnapshot: {
                    previousCardTier: acc.cardTier,
                    previousVerified: acc.isVerified,
                    previousVerifiedLabel: acc.verifiedLabel,
                    previousVipShield: acc.vipShieldActive,
                  },
                },
              ];
            }
            break;
          case 'royal_crown_100g_50m_pack':
            next.goldGrams = (acc.goldGrams || 0) + 100 * qty;
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 50_000_000 * qty;
            break;
          case 'diamond_all_permanent_pack':
            if (acc.cardTier !== 'admin') next.cardTier = 'platinum';
            next.isVerified = true;
            next.vipShieldActive = true;
            next.balance = isUnlim ? UNLIMITED_BALANCE : acc.balance + 10_000_000 * qty;
            next.goldGrams = (acc.goldGrams || 0) + 10 * qty;
            break;
          case 'trial_job_salary_2x':
          case 'trial_job_salary_5x':
          case 'trial_job_career_selector':
            next.salaryMultiplier = (acc.salaryMultiplier || 1) + qty;
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-ugacha-jsal-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: meta.type,
                label: `${meta.label} (${formatTrialDurationLabel(trialMins)})`,
                emoji: meta.emoji,
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { deltaSalaryMultiplier: qty },
              },
            ];
            break;
          case 'trial_job_click_power':
            next.clickPower = (acc.clickPower || 1) + qty;
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-ugacha-jclk-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_job_click_power',
                label: `Trial Klik Kerja (${formatTrialDurationLabel(trialMins)})`,
                emoji: '👆',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { deltaClickPower: qty },
              },
            ];
            break;
          case 'trial_cashback_15':
          case 'trial_cashback_50':
            next.cashbackPercent = Math.max(acc.cashbackPercent || 0, Math.min(100, qty));
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-ugacha-cb-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: meta.type,
                label: `Trial Cashback (${formatTrialDurationLabel(trialMins)})`,
                emoji: '🏷️',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                revertSnapshot: { previousCashbackPercent: acc.cashbackPercent || 0 },
              },
            ];
            break;
          case 'trial_royal_emperor_all_access':
            next.cardTier = 'admin';
            next.isVerified = true;
            next.vipShieldActive = true;
            next.salaryMultiplier = (acc.salaryMultiplier || 1) + 5;
            next.clickPower = (acc.clickPower || 1) + 10;
            next.activeTrials = [
              ...activeTrials,
              {
                id: `trial-ugacha-emp-${Date.now()}-${Math.floor(Math.random() * 999)}`,
                rewardType: 'trial_royal_emperor_all_access',
                label: `Trial Royal Emperor (${formatTrialDurationLabel(trialMins)})`,
                emoji: '🔱',
                startedAt: nowDate.toISOString(),
                expiresAt: expiresIso,
                durationMinutes: trialMins,
                grantedTrialCardTier: 'admin',
                revertSnapshot: {
                  previousCardTier: acc.cardTier,
                  previousVerified: acc.isVerified,
                  previousVerifiedLabel: acc.verifiedLabel,
                  previousVipShield: acc.vipShieldActive,
                  deltaClickPower: 10,
                  deltaSalaryMultiplier: 5,
                },
              },
            ];
            break;
          default:
            break;
        }

        if (meta.type === 'cash_balance' || meta.type === 'spin_coins' || meta.type === 'mystery_thr_combo' || meta.type === 'sultan_starter_pack') {
          newTxs.push({
            id: `tx-ugacha-${Date.now()}-${acc.id.slice(-4)}`,
            accountId: acc.id,
            type: 'setor',
            title: `🎲 Gacha Admin [${res.tierLabel}]: ${meta.label}`,
            amount:
              meta.type === 'cash_balance'
                ? qty
                : meta.type === 'mystery_thr_combo'
                ? 1_500_000 * qty
                : meta.type === 'sultan_starter_pack'
                ? 5_000_000 * qty
                : 0,
            coinAmount:
              meta.type === 'spin_coins'
                ? qty
                : meta.type === 'mystery_thr_combo'
                ? 100 * qty
                : meta.type === 'sultan_starter_pack'
                ? 300 * qty
                : undefined,
            recipientAccount: acc.accountNumber,
            recipientName: acc.fullName,
            description: `Hasil Gacha Admin (${res.tierLabel} • Peluang ${res.probabilityPercent}%) dari ${input.senderName}`,
            referenceNo: `GACHA-${Date.now().toString().slice(-6)}`,
            timestamp: nowDate.toISOString(),
            status: 'success',
            category: 'redeem',
          });
        }
        return next;
      })
    );

    if (newTxs.length > 0) {
      setTransactions((prev) => [...newTxs, ...prev]);
    }

    playAtmSound('cash');
    return {
      success: true,
      logs,
      message: `🎲 Roll Gacha Langsung selesai untuk ${targetAccs.length} nasabah (${meta.label})!`,
    };
  };

  const adminUpdateDevRole = (
    roleId: string,
    patch: Partial<Omit<DevRoleConfig, 'id' | 'slotNumber'>>
  ): { success: boolean; message: string } => {
    setDevRoles((prev) =>
      prev.map((r) => (r.id === roleId ? { ...r, ...patch } : r))
    );
    return { success: true, message: `Konfigurasi Role ${roleId} berhasil diperbarui.` };
  };

  const adminResetDevRoles = (): { success: boolean; message: string } => {
    setDevRoles(DEFAULT_DEV_ROLES_10);
    return { success: true, message: 'Ke-10 Role Dev/Own/Admin dikembalikan ke setelan awal.' };
  };

  const adminAssignAccountDevRole = (
    accountId: string,
    roleId: string | null
  ): { success: boolean; message: string } => {
    const targetAcc = accounts.find((a) => a.id === accountId);
    if (!targetAcc) return { success: false, message: 'Rekening tidak ditemukan.' };
    const roleObj = roleId ? devRoles.find((r) => r.id === roleId) : null;
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const autoActive = roleObj && roleObj.autoApproveAccount;
          return {
            ...acc,
            devRoleId: roleObj ? roleObj.id : null,
            ...(autoActive
              ? {
                  cardStatus: 'active' as const,
                  hasCompletedTutorial: true,
                  tutorialApprovedByAdmin: true,
                }
              : {}),
          };
        }
        return acc;
      })
    );
    return {
      success: true,
      message: roleObj
        ? `Akun ${targetAcc.fullName} resmi ditugaskan menjadi ${roleObj.name}!${roleObj.autoApproveAccount ? ' (Tanpa Persetujuan / Langsung Aktif)' : ''}`
        : `Role Dev pada akun ${targetAcc.fullName} dilepas kembali ke Nasabah Biasa.`,
    };
  };

  const adminUpdateDefaultLetterSealConfig = (
    config: LetterSignatureStampConfig
  ): { success: boolean; message: string } => {
    setDefaultLetterSealConfig(config);
    return {
      success: true,
      message: 'Desain Tanda Tangan & Stempel Default Global berhasil disimpan!',
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
        firebaseUser,
        isCloudBootReady,
        cloudSyncStatus,
        lastCloudSyncAt,
        cloudUserStatus,
        loginOrRegisterWithEmail,
        loginWithGooglePopup,
        loginWithOaAccount,
        guestLocalAccounts,
        registerGuestRegularCard,
        loginToGuestAccountWithPin,
        linkCurrentAccountWithGooglePopup,
        enterBankPortal,
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
        setNotificationsEnabled,
        backgroundAutoNotifEnabled,
        setBackgroundAutoNotifEnabled,
        notificationPermissionStatus,
        requestAndEnableNotifications,
        sendTestNotificationNow,
        sendBulkNotifications,
        activePushBanners,
        dismissPushBanner,
        emitPinSecurityAlert,
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
        notificationCategoryPermissions,
        toggleNotificationCategoryPermission,
        setAllNotificationCategoryPermissions,
        markCategoryNotificationsAsRead,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,
        reprintReceipts,
        registerCard,
        linkedUserAccount,
        linkedUserAccounts,
        verifyInitialCardPin,
        adminResetPinAttempts,
        toggleCardFreezeWithPin,
        regenerateAccountNumberWithPin,
        changePin,
        updatePhone,
        loginToCardWithPin,
        switchCardWithAdminCode,
        adminBanCard,
        adminApplyCustomBanConfig,
        adminSaveDefaultBanTemplate,
        adminSaveBanPreset,
        adminDeleteBanPreset,
        adminUnbanCard,
        adminUnbanAllCards,
        submitCardBanAppeal,
        activeBanLockState,
        banSupportConfig,
        adminUpdateBanSupportConfig,
        submitUnifiedBanAppeal,
        adminReviewUnifiedBanAppeal,
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
        adminCreateFullCustomAccount,
        adminToggleOaAccountStatus,
        adminGrantAccountSultanBusinesses,
        adminConnectAccountToEmail,
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
        accountDeletionRequests,
        submitAccountDeletionRequest,
        cancelAccountDeletionRequest,
        approveAccountDeletionRequest,
        rejectAccountDeletionRequest,
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
        goldMarketConfig,
        buyGold,
        sellGold,
        setCustomerCustomGoldPrice,
        updateCustomerGoldPreferences,
        dismissGoldMonthlyBanner,
        transferBebas,
        adminUpdateGoldMarketConfig,
        adminSimulateGoldNextMonth,
        adminResetGoldMarketConfig,
        adminAdjustAccountGold,
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
        budgetCategories,
        manualExpenses,
        budgetTxCategoryMap,
        budgetAlertHistory,
        addBudgetCategory,
        updateBudgetCategory,
        deleteBudgetCategory,
        addManualExpense,
        deleteManualExpense,
        setTransactionBudgetCategory,
        resetAllData,
        startFromZero,
        giftEvents,
        deletedGiftEventIds,
        giftEventsInitialized,
        activeGiftModal,
        giftDateTestOverride,
        isGiftEventOpenableNow,
        openGiftEventModal,
        closeGiftEventModal,
        markGiftLetterOpened,
        beginOpeningGiftBox,
        isGiftBoxTransferLocked,
        transferGiftEventToFriend,
        claimAndOpenGiftEvent,
        adminCreateOrUpdateGiftEvent,
        adminDeleteGiftEvent,
        adminToggleGiftEventActive,
        adminTriggerGiftEventNow,
        adminResetGiftEventStatus,
        adminToggleRevokeGiftEventRecipient,
        adminDuplicateGiftEvent,
        adminUpdateGiftEventQuickSettings,
        adminSetGiftDateTestOverride,
        jobCoinBonusConfig,
        adminUpdateJobCoinBonusConfig,
        adminExecuteUniversalGachaDrop,
        devRoles,
        adminUpdateDevRole,
        adminResetDevRoles,
        adminAssignAccountDevRole,
        defaultLetterSealConfig,
        adminUpdateDefaultLetterSealConfig,
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
