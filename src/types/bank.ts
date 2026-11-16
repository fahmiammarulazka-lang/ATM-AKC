/**
 * Bank Nusantara Comprehensive Type Definitions
 * Includes standard card rules, admin upgrade flow, 60+ digital banking features,
 * Admin Feature & PIN Configurator, Redeem Codes, Purchased Pulsa/Token/Voucher Codes,
 * and Card Ban System (Custom / Permanent Duration, Optional Reason, Admin Unban).
 */

export type CardTier = 'regular' | 'gold' | 'premium' | 'platinum' | 'admin';

export interface CardTierConfig {
  tier: CardTier;
  name: string;
  nameIndo: string;
  colorName: string;
  primaryColor: string;
  accentColor: string;
  gradientClass: string;
  dailyWithdrawalLimit: number;
  monthlyFee: number;
  validityYears: number;
  idealFor: string;
  badgeColor: string;
  isUnlimited?: boolean;
}

export type CardStatus = 'active' | 'frozen' | 'pending' | 'rejected' | 'banned';

export interface CardBanInfo {
  isBanned: boolean;
  reason?: string; // Opsional di Panel Admin
  durationType: 'custom' | 'permanent'; // Custom durasi atau Permanen
  durationMinutes?: number; // Jika custom
  durationLabel: string; // Contoh: "30 Menit", "24 Jam", atau "Permanen"
  bannedAt: string;
  expiresAt?: string; // ISO string jika custom
  // Jika durasi custom, nasabah masih bisa mengajukan tinjauan alasan ke Admin.
  // Jika permanen, TIDAK DAPAT ditinjau lagi oleh nasabah (namun masih bisa dibuka banned-nya di Panel Admin).
  appealStatus?: 'none' | 'pending' | 'rejected';
  appealNote?: string;
  appealRequestedAt?: string;
}

export interface BankAccount {
  id: string;
  accountNumber: string; // 10 digit unique random number
  fullName: string;
  nik: string; // 16 digit ID
  phone: string; // phone number for chat & OTP
  email?: string;
  address: string;
  pin: string; // 6 digit PIN
  balance: number;
  cardTier: CardTier;
  cardNumber: string; // 16 digit formatted card number
  cvv: string; // 3 digit random security code
  expiryDate: string; // MM/YY
  cardStatus: CardStatus;
  rejectionReason?: string;
  banInfo?: CardBanInfo;
  dailyWithdrawnToday: number;
  lastWithdrawalDate: string;
  initialDeposit: number;
  createdAt: string;
  // Custom limits & security settings
  customSpendingLimit?: number;
  allowInternational?: boolean;
  rewardPoints?: number;
  // Active balances from redeeming purchased codes
  pulsaBalance?: number;
  plnKwhBalance?: number;
  // Blue Checkmark Verification Badge (Centang Biru dari Panel Admin)
  isVerified?: boolean;
  verifiedAt?: string;
  verifiedLabel?: string;
  googleEmail?: string;
  // Lowongan Pekerjaan, Sistem Level & Voucher Level (Suit Komputer Medium)
  jobLevel?: number; // Default 1
  levelVouchers?: number; // Default 0 (didapat dari menang Suit lawan Komputer Medium atau Admin)
  jobClickProgress?: Record<string, number>; // Progres klik masing-masing lowongan pekerjaan
  totalJobsCompleted?: number;
  totalJobEarnings?: number;
  suitWins?: number;
  suitPlayed?: number;
  clickPower?: number; // Default 1 klik per tap (bisa di-boost lewat Super Tools Admin)
  salaryMultiplier?: number; // Default 1x gaji (bisa di-boost lewat Super Tools Admin)
  cashbackPercent?: number; // Cashback otomatis setiap transaksi (Super Tools Admin)
  vipShieldActive?: boolean; // Anti-Banned & Proteksi Saldo (Super Tools Admin)
  // Spin the Wheel Koin & Statistik
  spinCoins?: number; // Default 0 koin
  totalSpinsPlayed?: number;
  totalSpinWinnings?: number;
  // Kerajaan Bisnis & Bursa Sultan (Fitur Baru di sebelah Spin the Wheel)
  empireBusinesses?: Record<string, number>; // businessId -> jumlah unit dimiliki
  empireTradingHoldings?: Record<string, number>; // assetId -> jumlah unit dimiliki
  totalEmpireEarnings?: number;
  // Tutorial Kartu Baru (Wajib Disetujui Admin Dulu Baru Ada Tutorialnya)
  hasCompletedTutorial?: boolean;
  tutorialApprovedByAdmin?: boolean;
  // Investasi Emas 24K Mewah (Batch FIFO & Preferensi Visual)
  goldGrams?: number;
  goldBatches?: GoldBatchRecord[];
  goldSavingsTarget?: number;
  goldPreferredForm?: GoldFormType;
  goldPreferredMotif?: GoldMotifType;
  customUserGoldPricePerGram?: number | null;
  // Active Temporary Trial Perks (Centang Biru Trial, VIP Shield Trial, Card Tier Trial, Boost Trial)
  activeTrials?: ActiveAccountTrial[];
  // Custom Dev / Own / Admin Role Slot (10 Role yang dapat dikustomisasi di Panel Admin)
  devRoleId?: string | null;
  hasAccessedAdminPanel?: boolean;
  adminAccessTimestamp?: string;
}

export type GoldFormType = 'batangan' | 'perhiasan';
export type GoldMotifType = 'klasik' | 'nusantara' | 'royal_platinum';
export type TransferBebasAssetMode = 'uang' | 'coin' | 'emas' | 'gabungan';

export interface GoldBatchRecord {
  id: string;
  purchasedAt: string;
  purchaseDateKey: string; // YYYY-MM-DD local date for same-day rule check
  grams: number;
  costRupiah: number;
  pricePerGramAtBuy: number;
  goldForm: GoldFormType;
  motif: GoldMotifType;
  note?: string;
  karat?: number; // 1 to 24 karat purity
}

export interface GoldPriceHistoryPoint {
  id: string;
  label: string;
  monthKey: string;
  pricePerGram: number;
  changePercent: number;
  timestamp: string;
  isSimulation?: boolean;
}

export interface GoldAndTransferMarketConfig {
  basePricePerGram: number; // Harga dasar awal patokan
  currentPricePerGram: number; // Harga aktif real-time setelah kenaikan tanggal 1
  monthlyGrowthPercent: number; // Default 5% setiap tanggal 1 berganti bulan
  sameDayPenaltyMode: '1%' | '5%' | 'custom'; // Bawaan 1% (opsi 5% di Admin)
  sameDayPenaltyPercent: number; // Default 1
  transferBebasAdminFeePercent: number; // Default 5%
  minNominalRupiah: number; // Default 1000
  lastProcessedMonthKey: string; // Real YYYY-MM terproses terakhir
  simulatedMonthsOffset: number; // Counter bulan simulasi dari Admin
  priceHistory: GoldPriceHistoryPoint[];
  lastMonthlyEventBanner?: {
    title: string;
    message: string;
    monthKey: string;
    growthPercent: number;
    timestamp: string;
  };
}

export interface TransferBebasReceipt {
  referenceNo: string;
  timestamp: string;
  assetMode: TransferBebasAssetMode;
  recipientAccount: string;
  recipientName: string;
  recipientBank: string;
  isInternalAccount: boolean;
  adminFeePercent: number;
  uangSent: number;
  uangAdminFee: number;
  uangReceived: number;
  coinSent: number;
  coinAdminFee: number;
  coinReceived: number;
  goldRupiahSent: number;
  goldGramsSent: number;
  goldAdminFeeRupiah: number;
  goldReceivedRupiah: number;
  goldReceivedGrams: number;
  note?: string;
}

export interface GoogleUserSession {
  email: string;
  name: string;
  picture?: string;
  firebaseUid?: string;
  loggedInAt: string;
  hasCompletedOnboarding: boolean;
}

export interface WebsiteSystemPopupNotification {
  id: string;
  type: 'unban' | 'broadcast' | 'verified' | 'security' | 'admin_chat';
  title: string;
  subtitle: string;
  message: string;
  accountId?: string;
  accountName?: string;
  accountNumber?: string;
  cardTier?: CardTier;
  senderName?: string;
  timestamp: string;
  dismissed: boolean;
}

export interface GlobalChatMessage {
  id: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  senderAccount?: string;
  isVerified?: boolean;
  title: string;
  text: string;
  timestamp: string;
  isPinned?: boolean;
}

export type NotificationCategory = 'transaction' | 'loan' | 'security' | 'promo';

export interface MobilePushBannerToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'admin_chat';
  category?: NotificationCategory;
  targetView?: string;
  targetDashboardTab?: string;
  accountId?: string;
  referenceId?: string;
  timestamp: string;
}

export interface BugReportRecord {
  id: string;
  reporterName: string;
  reporterAccountNumber?: string;
  reporterEmail?: string;
  category: string;
  explanation: string; // Wajib diisi
  photoDataUrl?: string; // Opsional (foto bebas)
  photoFileName?: string;
  status: 'baru' | 'diproses' | 'selesai';
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppUpdateRecord {
  id: string;
  version: string;
  title: string; // Nama update
  fullDate: string; // Tanggal lengkap (hari, tanggal, bulan, tahun, jam WIB)
  dateText?: string; // Alias tanggal lengkap
  description: string; // Deskripsi lengkap update
  highlights?: string[]; // Daftar poin fitur/perubahan dalam update
  changes?: string[]; // Alias highlights
  isCurrent: boolean; // true = Update Sekarang, false = Update Sebelumnya
  categoryBadge?: string;
  author?: string;
  createdAt: string;
}

export interface JobVacancyItem {
  id: string;
  title: string;
  department: string;
  salary: number;
  coinReward?: number;
  requiredLevel: number;
  targetClicks: number;
  isFreeStarter?: boolean;
  description: string;
  badgeText: string;
}

export interface SpinPrizeSegment {
  id: string;
  label: string;
  shortLabel: string;
  amount: number;
  baseProbabilityPercent: number; // e.g., 48, 28, 20, 1, ..., 0.000000000001
  probabilityDisplay: string; // e.g., "1%" or "0,000000000001% (1 dari 1.000 Kuadriliun)"
  color: string;
  textColor: string;
  tier: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
}

export interface CoinPackageOption {
  id: number; // 1 to 100
  coins: number; // 1 to 1,000,000
  label: string;
  recehanDecimal: number; // e.g. 0.25, 0.50, 0.75, 0.88, 0.99
  extraRecehanRupiah: number; // e.g. 0 to 99 rupiah recehan
  badge?: string;
  category: 'satuan' | 'paket_spin' | 'sultan_100k' | 'mega_1juta';
}

export interface SpinWheelAdminConfig {
  baseCoinPriceRupiah: number; // Default 10,000 (1 Koin = Rp 10.000), bisa dimurahin di Panel Admin
  coinPurchaseDiscountPercent: number; // 0 - 99% diskon beli koin di Panel Admin
  spinCostCoinsPer1x: number; // Default 100 koin (= Rp 1.000.000 untuk 1x spin)
  spinDiscountPercent: number; // 0 - 100% diskon spin (1x, 3x, 5x, 7x, 10x) di Panel Admin
  bundleExtraDiscountPercent: Record<1 | 3 | 5 | 7 | 10, number>; // Diskon khusus masing-masing 1x, 3x, 5x, 7x, 10x
  luckMultiplier: number; // Default 1x. Bisa dinaikkan di Panel Admin (10x, 100x, 1000x, 1000000x) agar hadiah besar makin mudah didapat
  forceJackpotMode: 'none' | 'min_1m' | 'min_5m' | 'only_15m_20m'; // Mode khusus Admin untuk memperbesar/memastikan jackpot
  customSegmentWeights?: Record<string, number>; // Override bobot per hadiah di Panel Admin
}

export interface SpinHistoryRecord {
  id: string;
  accountId: string;
  accountName: string;
  spinCount: 1 | 3 | 5 | 7 | 10;
  paymentMethod?: 'coins' | 'cash';
  coinsSpent: number;
  rupiahSpent?: number;
  prizesWon: { amount: number; label: string }[];
  totalWonAmount: number;
  timestamp: string;
}

export interface AdminHelpRequestRecord {
  id: string;
  requesterAccountId?: string;
  accountId?: string;
  requesterName?: string;
  senderName?: string;
  requesterAccountNumber?: string;
  senderAccountNumber?: string;
  selectedFeatureIds?: string[];
  selectedFeatures?: string[];
  selectedFeatureLabels?: string[];
  featureLabels?: string[];
  requestedAmountOrValue?: number;
  requestedAmount?: number;
  requestedCoins?: number;
  requestedLevel?: number;
  urgency?: 'normal' | 'penting' | 'darurat_sultan';
  message: string;
  status: 'pending' | 'granted' | 'rejected' | 'menunggu' | 'dikabulkan' | 'ditolak';
  attachmentDataUrl?: string;
  attachmentName?: string;
  adminReply?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface SultanBusinessCatalogItem {
  id: string;
  name: string;
  category: string;
  iconEmoji: string;
  icon?: string;
  tierLabel?: string;
  baseCost: number;
  basePrice: number;
  profitPerClaim: number;
  profitPerCycle: number;
  bonusSpinCoinsPerClaim: number;
  bonusSpinCoinsPerCycle: number;
  resaleProfitPercent?: number;
  description: string;
  badge: string;
}

export interface SultanEmpireAdminConfig {
  businessDiscountPercent: number; // 0 - 99% diskon beli Rig Mining & Lelang Supercar di Panel Admin
  profitMultiplier: number; // 1x s/d 1000x lipat panen hasil Mining & Lelang
  bonusCoinMultiplier?: number;
  marketPriceMultiplier: Record<string, number>; // Pump/Dump harga Emas, Saham, Bitcoin, Berlian dari Panel Admin
  marketPrices?: Record<string, number>;
  vaultGuaranteedJackpot: boolean; // Jaminan hadiah besar saat buka Cyber Vault
  customAnnouncement?: string;
  updatedAt?: string;
}


export interface CardUpgradeApplication {
  id: string;
  accountId: string;
  applicantName: string;
  accountNumber: string;
  currentTier: CardTier;
  requestedTier: CardTier;
  monthlyIncome: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  requestedAt: string;
  decidedAt?: string;
}

export type TransactionType =
  | 'tarik'
  | 'setor'
  | 'transfer_out'
  | 'transfer_in'
  | 'pinjaman_disburse'
  | 'pinjaman_bayar'
  | 'biaya_admin'
  | 'qris_pay'
  | 'tagihan_listrik'
  | 'tagihan_pulsa'
  | 'tagihan_bpjs'
  | 'tagihan_pdam'
  | 'tagihan_pajak'
  | 'topup_ewallet'
  | 'donasi'
  | 'celengan_simpan'
  | 'celengan_tarik'
  | 'deposito_buka'
  | 'voucher_game'
  | 'tiket_travel'
  | 'chat_transfer'
  | 'cardless_withdraw'
  | 'redeem_code'
  | 'bayar_resi'
  | 'belanja_fitur'
  | 'transfer_bebas_out'
  | 'transfer_bebas_in'
  | 'beli_emas'
  | 'jual_emas';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  title: string;
  amount: number;
  senderAccount?: string;
  senderName?: string;
  recipientAccount?: string;
  recipientName?: string;
  recipientBank?: string;
  description?: string;
  status: 'success' | 'pending' | 'rejected';
  referenceNo: string;
  timestamp: string;
  balanceDeducted?: boolean;
  generatedCode?: string;
  requiresBuyerApproval?: boolean;
  buyerApprovalStatus?: 'waiting_admin' | 'waiting_buyer' | 'approved' | 'rejected';
  buyerApprovedAt?: string;
  featureId?: string;
  goldGrams?: number;
  coinAmount?: number;
  adminFeeAmount?: number;
  category?:
    | 'transfer'
    | 'tarik_tunai'
    | 'setor_tunai'
    | 'pinjaman'
    | 'biaya'
    | 'tagihan'
    | 'qris'
    | 'ewallet'
    | 'investasi'
    | 'donasi'
    | 'redeem'
    | 'emas';
}

export type LoanType = 'kecil' | 'menengah' | 'bisnis';

export interface LoanTierConfig {
  type: LoanType;
  title: string;
  minAmount: number;
  maxAmount: number;
  minTenor: number;
  maxTenor: number;
  interestRateMonthly: number;
  idealFor: string;
  color: string;
}

export interface LoanApplication {
  id: string;
  accountId: string;
  applicantName: string;
  accountNumber: string;
  loanType: LoanType;
  amount: number;
  tenorMonths: number;
  monthlyInterestRate: number;
  monthlyInstallment: number;
  totalRepayment: number;
  monthlyIncome: number;
  jobTitle: string;
  purpose: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  appliedAt: string;
  decidedAt?: string;
  remainingInstallments?: number;
}

export interface ScheduledPayment {
  id: string;
  accountId: string;
  title: string;
  recipientAccount: string;
  recipientName: string;
  recipientBank: string;
  amount: number;
  dayOfMonth: number;
  nextExecutionDate: string;
  active: boolean;
  category: string;
}

export interface FavoriteAccount {
  id: string;
  accountNumber: string;
  ownerName: string;
  bankName: string;
  alias?: string;
  avatarColor: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  category?: NotificationCategory;
  targetView?: string;
  targetDashboardTab?: string;
  accountId?: string;
  referenceId?: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

export interface ChatMessage {
  id: string;
  senderAccount: string;
  senderName: string;
  recipientAccount: string;
  recipientName: string;
  text: string;
  timestamp: string;
  transferAttachment?: {
    amount: number;
    referenceNo: string;
    note?: string;
    isRequest?: boolean;
    status?: 'pending' | 'paid';
  };
}

export interface PocketSaving {
  id: string;
  accountId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  color: string;
  icon: string;
  deadline?: string;
}

export interface DepositoRecord {
  id: string;
  accountId: string;
  principalAmount: number;
  tenorMonths: number;
  interestRateAnnual: number;
  maturityDate: string;
  projectedReturn: number;
  certificateNumber: string;
  status: 'active' | 'matured';
  openedAt: string;
}

export interface CardlessToken {
  id: string;
  accountId: string;
  tokenCode: string;
  amount: number;
  createdAt: string;
  expiresAt: string;
  status: 'active' | 'used';
  adminApproved?: boolean;
}

export interface PinResetRequest {
  id: string;
  accountId: string;
  fullName: string;
  accountNumber: string;
  phone: string;
  nik: string;
  cardTier: CardTier;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  revealedPin?: string;
  adminNotes?: string;
}

export interface ResiTrackingRecord {
  id: string;
  resiNumber: string;
  courier: string;
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  status: 'Diproses' | 'Dalam Perjalanan' | 'Sedang Diantar Kurir' | 'Terkirim';
  history: {
    time: string;
    location: string;
    description: string;
  }[];
  shippingFee: number;
  codAmount?: number;
  paidViaBank?: boolean;
}

export interface FeatureSecurityConfig {
  id: string;
  title: string;
  category: string;
  description: string;
  defaultAmount?: number;
  isPaidWithMoney: boolean;
  requireAdminPin: boolean; // Bisa dikasih PIN Admin (159357) atau tidak bebas di Panel Admin
  requireAdminApproval: boolean; // Wajib Persetujuan Admin atau langsung berhasil bebas di Panel Admin
}

export interface RedeemCode {
  id: string;
  code: string;
  title: string;
  rewardAmount: number;
  maxClaims: number; // Berapa banyak orang yang bisa me-redeem
  claimedBy: {
    accountId: string;
    accountNumber: string;
    fullName: string;
    claimedAt: string;
  }[];
  createdAt: string;
  expiresAt: string; // Berapa lama kodenya berfungsi (ISO timestamp)
  durationMinutes: number;
  active: boolean;
  requireAdminPin?: boolean;
  sendNotification?: boolean;
}

export interface PurchasedVoucherCode {
  id: string;
  accountId: string;
  accountNumber: string;
  fullName: string;
  type: 'pulsa' | 'token_listrik' | 'voucher_lain';
  code: string; // Kode voucher pulsa (16 digit), Kode token listrik (20 digit), atau Kode voucher lainnya
  providerOrMeter: string;
  nominal: number;
  kwhAmount?: number;
  status: 'available' | 'redeemed';
  adminApproved: boolean;
  purchasedAt: string;
  redeemedAt?: string;
  redeemedTarget?: string;
  transactionId?: string;
}

export interface MintolFeatureOption {
  id: string;
  category: string;
  title: string;
  label: string;
  iconEmoji: string;
  icon: string;
  description: string;
  defaultSuggestedAmount?: number;
}

export interface UserAppSettings {
  // 1. Keamanan & Privasi
  hideBalanceDefault: boolean;
  requirePinForTransferUnder1M: boolean;
  biometricFingerprintSim: boolean;
  faceIdUnlockSim: boolean;
  twoFactorOtpSim: boolean;
  antiPhishingCode: string;
  autoLockMinutes: number;
  blockScreenshotsSim: boolean;
  suspiciousLoginAlert: boolean;

  // 2. Kontrol Kartu & Transaksi Internasional
  contactlessPaywaveEnabled: boolean;
  onlineEcommerceEnabled: boolean;
  autoDebitSubscriptionEnabled: boolean;
  overseasAtmWithdrawalEnabled: boolean;
  qrisCrossBorderEnabled: boolean;
  singleTransactionMaxLimit: number;
  dailyTransferMaxLimit: number;

  // 3. Audio, Suara ATM & Voice AI
  atmBeepSoundEnabled: boolean;
  cashCountingSoundEnabled: boolean;
  voiceReceiptReadoutEnabled: boolean;
  aiVoiceAutoSpeak: boolean;
  aiVoiceSpeechRate: number;
  notificationChimeSound: boolean;
  hapticVibrationSim: boolean;

  // 4. Tampilan, Tema & Aksesibilitas
  themeColorAccent: 'indigo' | 'emerald' | 'amber' | 'rose' | 'cyan';
  fontSizeScale: 'normal' | 'large' | 'xlarge';
  highContrastMode: boolean;
  compactCardLayout: boolean;
  animationsConfettiEnabled: boolean;
  showFloatingAiButton: boolean;
  showFloatingFooterButtons: boolean;
  currencyDisplayDecimals: boolean;
  languageLocale: 'id-ID' | 'en-US';

  // 5. Otomatisasi Transaksi, Mining & Spin
  autoSaveRoundUpPocket: boolean;
  autoPrintReceiptAfterTx: boolean;
  autoClaimMiningOnOpen: boolean;
  miningOverclockDefault: 1 | 2 | 5;
  spinTurboAnimation: boolean;
  workClickVisualEffect: boolean;
  confirmBeforeCoinPurchase: boolean;
  autoRedeemPulsaTokenNotif: boolean;

  // 6. Preferensi Kategori Notifikasi Push
  pushTransactionAlerts: boolean;
  pushLoanAlerts: boolean;
  pushSecurityAlerts: boolean;
  pushPromoAlerts: boolean;
}

export type BudgetCategoryIcon =
  | 'shopping-cart'
  | 'zap'
  | 'film'
  | 'utensils'
  | 'car'
  | 'heart-pulse'
  | 'shopping-bag'
  | 'wallet';

export type BudgetCategoryColor =
  | 'emerald'
  | 'amber'
  | 'indigo'
  | 'rose'
  | 'cyan'
  | 'violet'
  | 'orange'
  | 'slate';

export interface BudgetCategory {
  id: string;
  accountId: string; // '__ALL__' or specific BankAccount.id
  name: string;
  monthlyLimit: number;
  icon: BudgetCategoryIcon;
  color: BudgetCategoryColor;
  keywords: string[];
  isDefault: boolean;
  createdAt: string;
}

export interface ManualExpenseRecord {
  id: string;
  accountId: string;
  categoryId: string;
  title: string;
  amount: number;
  note?: string;
  timestamp: string;
}

export type GiftRewardType =
  | 'cash_balance'
  | 'spin_coins'
  | 'level_voucher'
  | 'job_level_up'
  | 'gold_grams'
  | 'reward_points'
  | 'pulsa_balance'
  | 'pln_kwh'
  | 'click_power_boost'
  | 'salary_multiplier_boost'
  | 'cashback_percent'
  | 'vip_shield'
  | 'blue_checkmark'
  | 'upgrade_card_tier'
  | 'special_deposito'
  | 'dream_pocket_fund'
  | 'mining_rig_rtx'
  | 'mining_ai_cluster'
  | 'supercar_porsche'
  | 'supercar_lambo'
  | 'trading_gold_kg'
  | 'trading_btc_vip'
  | 'forgive_loans'
  | 'mystery_thr_combo'
  | 'trial_blue_checkmark'
  | 'trial_vip_shield'
  | 'trial_gold_card'
  | 'trial_platinum_card'
  | 'trial_career_boost'
  | 'sultan_starter_pack'
  // Hadiah Role Dev / Own / Admin (Permanen, Trial & Gacha Role)
  | 'role_grant_permanent'
  | 'role_grant_trial'
  | 'role_gacha_random_permanent'
  | 'role_gacha_random_trial'
  // Hadiah Tambahan 50+ Katalog (Saldo, Koin, Karir, Emas, Bisnis, VIP)
  | 'salary_jackpot_drop'
  | 'coin_jackpot_rain'
  | 'cashback_tier_max'
  | 'double_wallet_bonus'
  | 'loyalty_point_chest'
  | 'fee_waiver_pass'
  | 'career_turbo_pack'
  | 'job_progress_boost'
  | 'suit_victory_charm'
  | 'instant_executive_unlock'
  | 'voucher_bundle_pro'
  | 'gold_bar_royal_10g'
  | 'gold_jewel_bonus'
  | 'high_yield_deposito_vip'
  | 'emergency_vault_fund'
  | 'pln_super_pack'
  | 'mining_quantum_datacenter'
  | 'supercar_bugatti_chiron'
  | 'supercar_ferrari_sf90'
  | 'trading_sp500_vip'
  | 'sultan_empire_dividend'
  | 'upgrade_card_platinum_perm'
  | 'trial_diamond_combo'
  | 'trial_all_assets_boost';

export interface ActiveAccountTrial {
  id: string;
  rewardType: GiftRewardType;
  label: string;
  emoji: string;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  revertSnapshot: {
    previousVerified?: boolean;
    previousVerifiedLabel?: string;
    previousVipShield?: boolean;
    previousCardTier?: CardTier;
    previousDevRoleId?: string | null;
    deltaClickPower?: number;
    deltaSalaryMultiplier?: number;
  };
}

export interface GiftRewardCatalogMeta {
  type: GiftRewardType;
  label: string;
  emoji: string;
  unitLabel: string;
  defaultAmount: number;
  step: number;
  category:
    | 'Hadiah Role'
    | 'Uang & Koin'
    | 'Karir & Level'
    | 'Emas & Tabungan'
    | 'Aset & Bisnis'
    | 'VIP & Proteksi'
    | 'Hadiah Trial';
  description: string;
  isTrial?: boolean;
  defaultTrialMinutes?: number;
  isRoleGrant?: boolean;
}

export interface GachaTierRange {
  id: string;
  label: string;
  minAmount: number;
  maxAmount: number;
  probabilityPercent: number;
}

export interface GachaClaimedItemResult {
  rewardId: string;
  type: GiftRewardType;
  label: string;
  emoji: string;
  unitLabel: string;
  tierLabel: string;
  probabilityPercent: number;
  rolledAmount: number;
  minAmount: number;
  maxAmount: number;
}

export interface JobCoinBonusConfig {
  enabled: boolean;
  coinMultiplier: number; // Pengali Coin Kerja (1x, 2x, 3x, 5x, dst.)
  extraBonusCoins: number; // Bonus Coin Ekstra tetap tiap selesai target klik
}

export interface AdminGiftRewardItem {
  id: string;
  type: GiftRewardType;
  label: string;
  amount: number;
  unitLabel: string;
  emoji: string;
  customNote?: string;
  trialDurationMinutes?: number;
  targetDevRoleId?: string;
  rewardMode?: 'fixed' | 'gacha';
  gachaTiers?: GachaTierRange[];
}

export interface AdminGiftEventPackage {
  id: string;
  title: string;
  senderName: string;
  letterMessage: string;
  triggerMode: 'scheduled_date' | 'manual_instant' | 'both';
  autoPopupEnabled: boolean;
  strictDateLock?: boolean; // Default true: hanya bisa dibuka tepat pada tanggal jadwal
  unlockedByManualSend?: boolean; // True jika Admin baru klik Kirim Manual Sekarang
  isGachaBox?: boolean;
  scheduleMonth: number; // 1 - 12 (default 1 = Januari)
  scheduleDay: number; // 1 - 31 (default 29)
  scheduleLabel?: string;
  isActive: boolean;
  targetAccountId?: string; // '__ALL__' or specific BankAccount.id
  themeColor?: 'amber' | 'emerald' | 'rose' | 'indigo';
  rewards: AdminGiftRewardItem[];
  claimedByAccountIds: string[];
  viewedByAccountIds: string[];
  gachaResultsByAccount?: Record<string, GachaClaimedItemResult[]>;
  customSealConfig?: LetterSignatureStampConfig | null;
  createdAt: string;
  updatedAt?: string;
  lastTriggeredAt?: string;

  // 20+ Advanced Admin Features for Gift & Letter
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
}

export type SignatureTemplateId =
  | 'kaligrafi_royal'
  | 'kursif_klasik'
  | 'modern_eksekutif'
  | 'minimalis_tajam'
  | 'aristokrat_garis';

export type StampTemplateId =
  | 'bulat_resmi'
  | 'royal_wax'
  | 'oval_notaris'
  | 'perisai_vip'
  | 'bintang_emas';

export type SealColorTheme = 'amber' | 'emerald' | 'cyan' | 'rose' | 'white';

export interface LetterSignatureStampConfig {
  signatureMode: 'draw' | 'template';
  signatureDrawingDataUrl?: string;
  signatureTemplateId: SignatureTemplateId;
  signatureName: string;
  signatureColor: SealColorTheme;
  stampTemplateId: StampTemplateId;
  stampPrimaryName: string;
  stampSecondaryName: string;
  stampColor: SealColorTheme;
}

export type DevRoleBadgeColor =
  | 'amber'
  | 'orange'
  | 'cyan'
  | 'indigo'
  | 'rose'
  | 'purple'
  | 'emerald'
  | 'teal'
  | 'sky'
  | 'slate';

export interface DevRoleConfig {
  id: string; // 'dev_1' .. 'dev_10'
  slotNumber: number; // 1 .. 10
  name: string;
  badgeColor: DevRoleBadgeColor;
  canQuickOpenAdmin: boolean;
  bypassAdminPin: boolean;
  autoApproveAccount?: boolean;
  description: string;
}


