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

export interface MobilePushBannerToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert' | 'admin_chat';
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
  coinsSpent: number;
  prizesWon: { amount: number; label: string }[];
  totalWonAmount: number;
  timestamp: string;
}

export interface AdminHelpRequestRecord {
  id: string;
  requesterAccountId: string;
  requesterName: string;
  requesterAccountNumber: string;
  selectedFeatureIds: string[]; // Bisa pilih 1 atau banyak fitur dari 32 fitur Mintol Admin
  selectedFeatureLabels: string[];
  requestedAmountOrValue?: number; // Nominal saldo / koin / level yang diminta
  message: string; // WAJIB DIISI (Sesuai permintaan user: "Dan pesannya itu wajib")
  status: 'menunggu' | 'dikabulkan' | 'ditolak';
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
}

