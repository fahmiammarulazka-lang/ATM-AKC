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

export type BanThemeVariant = 'emergency_red' | 'warning_amber' | 'frozen_blue' | 'pitch_dark';

export type BanIconVariant = 'shield' | 'lock' | 'warning' | 'gavel';

export type BanReasonSourceMode = 'none' | 'system_30' | 'preset_20' | 'custom';

export type BanSoundEffectMode = 'siren' | 'alert' | 'warning' | 'mute' | 'silent';

export type BanDurationUnit =
  | 'minutes'
  | 'hours'
  | 'days'
  | 'weeks'
  | 'months'
  | 'specific_date';

export interface BanScreenCustomizationConfig {
  durationType: 'custom' | 'permanent';
  durationValue?: number;
  durationUnit?: BanDurationUnit;
  durationMinutes?: number;
  durationLabel: string;
  specificEndDate?: string;
  scheduledStartAt?: string;
  bannedAt?: string;
  expiresAt?: string;
  reasonMode: BanReasonSourceMode;
  systemReasonId?: string;
  selectedSystemReasonId?: string;
  presetReasonId?: string;
  selectedPresetReasonId?: string;
  reasonText?: string;
  reason?: string;
  showReasonBox: boolean; // Jika false atau reasonMode === 'none', kotak alasan disembunyikan penuh
  showSubtitle: boolean;
  subtitleText?: string;
  showWhatsAppButton: boolean;
  showEmailButton: boolean;
  showInAppAppealButton: boolean;
  showRecommendedLabel: boolean;
  showCountdown: boolean;
  showCaseId: boolean;
  caseId?: string;
  showBannedAtTime: boolean;
  showStatusBadge: boolean;
  statusBadgeText?: string;
  showAppealStatusBox: boolean;
  themeVariant: BanThemeVariant;
  theme?: BanThemeVariant;
  iconVariant: BanIconVariant;
  icon?: BanIconVariant;
  soundEffect: BanSoundEffectMode;
  showFooterNote?: boolean;
  footerNote?: string;
  maxAppeals: number; // 1, 3, atau 0 (tanpa batas)
  allowResubmitAfterReject: boolean;
  requireAppealCategoryAndPromise: boolean;
  overrideWhatsappNumber?: string;
  overrideWhatsAppNumber?: string;
  overrideEmailAddress?: string;
  messageTemplate?: string;
  appealMessageTemplate?: string;
  internalAdminNote?: string;
  adminInternalNote?: string;
}

export interface BanConfigPreset {
  id: string;
  name: string;
  description?: string;
  config: BanScreenCustomizationConfig;
  createdAt: string;
}

export interface BanAuditLogEntry {
  id: string;
  timestamp: string;
  action:
    | 'ban'
    | 'edit_ban'
    | 'update_ban'
    | 'unban'
    | 'auto_unban'
    | 'pin_5x_ban'
    | 'appeal_submitted'
    | 'appeal_reviewed'
    | 'reset_pin_attempts'
    | 'scheduled_ban';
  accountId?: string;
  targetAccountId?: string;
  accountName?: string;
  targetAccountName?: string;
  accountNumber?: string;
  targetAccountNumber?: string;
  targetEmail?: string;
  summary?: string;
  reasonSummary?: string;
  durationLabel?: string;
  reason?: string;
  caseId?: string;
}

export interface CardBanInfo {
  isBanned: boolean;
  reason?: string; // Opsional di Panel Admin (kosong = sembunyikan kotak alasan)
  durationType: 'custom' | 'permanent'; // Custom durasi (Trial) atau Permanen
  durationMinutes?: number; // Jika custom
  durationLabel: string; // Contoh: "30 Menit", "1 Hari (24 Jam)", atau "Permanen"
  bannedAt: string;
  expiresAt?: string; // ISO string jika custom
  bannedUntil?: string; // Alias expiresAt
  scheduledStartAt?: string; // Jika dijadwalkan mulai pada waktu tertentu
  appealStatus?: 'none' | 'pending' | 'rejected' | 'approved';
  appealNote?: string;
  appealCategory?: string;
  appealPromiseAccepted?: boolean;
  appealCount?: number;
  appealRequestedAt?: string;
  appealAdminNote?: string;
  appealSource?: 'in_app' | 'whatsapp' | 'email';
  customConfig?: BanScreenCustomizationConfig;
}

export type AccountCloudStatus = 'active' | 'banned';

export type CloudSyncStatus = 'syncing' | 'synced' | 'offline' | 'error';

export interface BanSupportConfig {
  whatsappNumber: string; // Nomor WA Admin (misal: 6281234567890)
  emailAddress: string; // Email Admin untuk tinjauan banding
  defaultTemplateConfig?: BanScreenCustomizationConfig;
  defaultTemplate?: BanScreenCustomizationConfig;
  presets?: BanConfigPreset[];
  savedPresets?: BanConfigPreset[];
  auditLogs?: BanAuditLogEntry[];
  updatedAt?: string;
}

export interface CloudUserRecord {
  uid: string;
  email: string;
  displayName: string;
  photoUrl?: string;
  photoURL?: string;
  status: AccountCloudStatus;
  banReason?: string;
  bannedAt?: string;
  banExpiresAt?: string;
  banDurationLabel?: string;
  banCustomConfig?: BanScreenCustomizationConfig;
  failedPinAttempts?: number;
  lastFailedPinAt?: string;
  loginLockedUntil?: string;
  loginLockReason?: string;
  banAppealStatus?: 'none' | 'pending' | 'rejected' | 'approved';
  banAppealMessage?: string;
  banAppealSubmittedAt?: string;
  banAppealAdminNote?: string;
  appealStatus?: 'none' | 'pending' | 'rejected' | 'approved';
  appealNote?: string;
  appealCategory?: string;
  appealCount?: number;
  appealAdminNote?: string;
  appealRequestedAt?: string;
  appealSource?: 'in_app' | 'whatsapp' | 'email';
  currentAccountId?: string;
  lastAccountId?: string;
  hasCompletedOnboarding?: boolean;
  savedAccounts?: BankAccount[];
  authMode?: 'email_direct' | 'google' | 'oa_account' | 'guest' | 'standard_account';
  emailKey?: string;
  emailVerified?: boolean;
  notificationCategoryPermissions?: Record<NotificationCategory10Key, boolean>;
  createdAt?: string;
  updatedAtMs?: number;
  updatedAt?: string;
}

export interface BankAccount {
  id: string;
  userId16?: string; // 16 digit permanent user ID displayed above user's name (format 4x4)
  accountNumber: string; // 10 digit unique random number
  fullName: string;
  nik: string; // 16 digit ID
  phone: string; // phone number for chat & OTP
  email?: string;
  firebaseUid?: string;
  status?: AccountCloudStatus; // Status cloud real-time ('active' | 'banned')
  banReason?: string; // Alasan banned terpusat di database
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
  scheduledBanConfig?: BanScreenCustomizationConfig;
  failedPinAttempts?: number;
  lastFailedPinAt?: string;
  loginLockedUntil?: string;
  loginLockReason?: string;
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
  levelUpVouchers?: number; // Alias levelVouchers
  jobClickProgress?: Record<string, number>; // Progres klik masing-masing lowongan pekerjaan
  totalJobsCompleted?: number;
  totalJobEarnings?: number;
  suitWins?: number;
  suitPlayed?: number;
  suitWinStreak?: number;
  stopwatchWins?: number;
  stopwatchPlayed?: number;
  arcadeClaimedTargets?: Record<string, number[]>;
  arcadeHighScores?: Record<string, number>;
  clickPower?: number; // Default 1 klik per tap (bisa di-boost lewat Super Tools Admin)
  salaryMultiplier?: number; // Default 1x gaji (bisa di-boost lewat Super Tools Admin)
  cashbackPercent?: number; // Cashback otomatis setiap transaksi (Super Tools Admin)
  vipShieldActive?: boolean; // Anti-Banned & Proteksi Saldo (Super Tools Admin)
  // Spin the Wheel Koin & Statistik
  spinCoins?: number; // Default 0 koin
  totalSpinsPlayed?: number;
  totalSpinWinnings?: number;
  // Mata Uang Diamond Premium & Slot Keluarga Tambahan
  diamonds?: number; // Default 0 diamond (1 Diamond = Rp 200 via BuatQRIS)
  extraFamilySlots?: number; // Default 0 (total slot keluarga = defaultMaxFamilies + extraFamilySlots)
  accountUpdatedAtMs?: number; // Timestamp mutasi otoritatif agar jobLevel/diamonds/saldo tidak tertimpa sync lama
  unbannedAtMs?: number; // Timestamp otoritatif pembukaan blokir (anti-rollback cache ban lama)
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
  // Akun OA Resmi buatan Panel Admin (Bisa login lewat tombol "Login Dengan Akun OA" di Lobi Awal)
  isOfficialAdminAccount?: boolean;
  oaAdminPin?: string; // Default '159357' atau PIN Admin khusus per Akun OA
  // Akun Guest (Tamu - Maks 1 jika dibuat dari Lobby, tanpa batas jika dibuat dari Panel Admin)
  isGuestAccount?: boolean;
  // Akun Biasa Tanpa Sambungan Google (Dibuat dari Panel Admin, login via "Login Ke Akun")
  isRegularNoGoogleAccount?: boolean;
  // Penanda akun yang dibuat langsung oleh Panel Admin (tidak menghitung kuota 1 Guest Lobby)
  createdByAdmin?: boolean;
  // Alamat wilayah administratif Indonesia terstruktur (Provinsi -> Kab/Kota -> Kec -> Desa -> Kode Pos -> RT/RW -> Jalan opsional)
  structuredAddress?: StructuredIndonesiaAddress;
  // Sistem Hutang & Kerugian Mining/Lelang VIP (Auto-Ban 1 Hari saat Jatuh Tempo)
  debtAmount?: number; // Total hutang aktif saat ini (Rp)
  debtDueAt?: string; // Batas waktu kesepakatan bayar (ISO string, default +24 jam)
  debtCreatedAt?: string; // Kapan siklus hutang aktif dimulai
  debtHistory?: DebtHistoryEntry[]; // Riwayat lengkap hutang, kerugian, cicilan & aksi Admin
  isDebtAutoBanned?: boolean; // true jika sedang dibanned otomatis karena gagal bayar hutang
  debtBanCount?: number; // Total kali akun pernah terkena ban jatuh tempo hutang
  lastDebtPenaltyAt?: string; // Timestamp terakhir bunga denda diterapkan (jika diaktifkan Admin)
  // Sensor privasi Nomor & ID (Default false / nonaktif, tersinkron permanen per akun ke Cloud)
  hideSensitiveNumbers?: boolean;
  // Jeda sementara Spin Roda oleh Admin dari Peringatan Deteksi Otomatis
  spinPausedUntil?: string;
  spinPauseReason?: string;
  // Tanda terima baca permanen per akun (sinkron Cloud & anti-rollback agar Pop-up Unban & Peringatan tampil tepat sekali)
  dismissedPopupIds?: string[];
  dismissedWarningMap?: Record<string, number>;
  // Kontak nasabah tersimpan untuk Chat Privat (sinkron Cloud per akun)
  savedChatContacts?: PrivateChatContact[];
  // Pesan berbintang / bookmark, pesan dihapus untuk saya sendiri & grup yang dibisukan notifikasinya (sinkron Cloud per akun)
  bookmarkedChatIds?: string[];
  hiddenChatMessageIds?: string[];
  mutedGroupIds?: string[];
  // Chat v15.41.49: Sambutan akun baru 1x, Lencana Khusus Admin, Pin/Arsip ruang, Blokir, DND, & Opsi tombol Enter
  hasSeenChatWelcome?: boolean;
  chatCustomBadge?: ChatCustomBadgeTier | null;
  pinnedChatRoomKeys?: string[];
  archivedChatRoomKeys?: string[];
  blockedChatAccountIds?: string[];
  blockedChatIntervalsMap?: Record<string, Array<{ startMs: number; endMs?: number }>>;
  chatDndEnabled?: boolean;
  enterKeySendsMessage?: boolean;
}

export interface DebtHistoryEntry {
  id: string;
  type:
    | 'mining_loss'
    | 'auction_loss'
    | 'trading_loss'
    | 'vault_loss'
    | 'credit_purchase'
    | 'admin_add'
    | 'payment_partial'
    | 'payment_full'
    | 'admin_reduce'
    | 'admin_forgive'
    | 'penalty_interest'
    | 'deadline_extended'
    | 'auto_ban_1d'
    | 'unban_extended';
  amount: number; // positif = tambah hutang, negatif = pengurangan/pelunasan, 0 = info waktu/ban
  balanceAfterDebt: number; // sisa hutang setelah kejadian
  sourceLabel: string;
  note: string;
  timestamp: string;
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
  authMode?: 'email_direct' | 'google' | 'oa_account' | 'guest' | 'standard_account';
  emailKey?: string;
  loggedInAt: string;
  hasCompletedOnboarding: boolean;
  isPinVerified?: boolean;
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
  targetUid?: string;
  targetEmail?: string;
  privateAccountOnly?: boolean;
  cardTier?: CardTier;
  senderName?: string;
  timestamp: string;
  dismissed: boolean;
}

export interface ChatReadReceiptEntry {
  accountId: string;
  accountName: string;
  readAt: string;
  readAtMs: number;
}

export interface ChatPollOption {
  id: string;
  text: string;
}

export interface ChatPollData {
  question: string;
  options: ChatPollOption[];
  votesByAccountId: Record<string, string[]>;
  allowMultiple?: boolean;
  closed?: boolean;
}

export interface ChatForwardInfo {
  originalSenderName: string;
  sourceRoomLabel?: string;
}

export interface GlobalChatMutedUser {
  accountId: string;
  accountName: string;
  accountNumber?: string;
  mutedUntilMs: number | null;
  isPermanent: boolean;
  durationLabel: string;
  reason?: string;
  mutedBy: string;
  mutedAt: string;
}

export interface ChatModerationLog {
  id: string;
  action:
    | 'delete_msg'
    | 'bulk_delete'
    | 'mute_user'
    | 'unmute_user'
    | 'warn_user'
    | 'pin_msg'
    | 'unpin_msg'
    | 'toggle_lock'
    | 'slow_mode'
    | 'banned_words'
    | 'clear_chat'
    | 'announcement'
    | 'edit_msg';
  adminName: string;
  targetName?: string;
  targetAccountId?: string;
  detail: string;
  timestamp: string;
  createdAtMs: number;
}

export interface ChatTypingStateEntry {
  roomKey: string;
  accountId: string;
  accountName: string;
  expiresAtMs: number;
}

export type ChatAssetKind = 'uang' | 'coin' | 'diamond';
export type ChatRedPacketMode = 'fastest_biggest' | 'random' | 'equal';
export type ChatCustomBadgeTier = 'verified' | 'vip' | 'sultan';
export type ChatAdminDivision = 'CS Resmi' | 'Tim Keamanan' | 'Pimpinan' | string;

export interface ChatImageAttachment {
  dataUrl?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface ChatVideoAttachment {
  url: string;
  dataUrl?: string;
  thumbnailDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
}

export interface ChatMediaAttachmentItem {
  id: string;
  kind: 'image' | 'video';
  url?: string;
  dataUrl?: string;
  thumbnailDataUrl?: string;
  fileName?: string;
  mimeType?: string;
  durationSec?: number;
  width?: number;
  height?: number;
  sizeBytes?: number;
  caption?: string;
}

export interface ChatVoiceAttachment {
  dataUrl?: string;
  url?: string;
  fileName?: string;
  durationSec: number;
  mimeType?: string;
  sizeBytes?: number;
  waveformPeaks?: number[];
}

export interface ChatContactAttachment {
  accountId: string;
  accountNumber: string;
  userId16?: string;
  fullName: string;
  cardTier?: CardTier;
  isVerified?: boolean;
}

export interface ChatRedPacketClaim {
  accountId: string;
  accountNumber?: string;
  accountName: string;
  amount: number;
  claimedAt: string;
  claimedAtMs: number;
  rank: number;
}

export interface ChatRedPacketData {
  id: string;
  creatorAccountId: string;
  creatorName: string;
  senderRole?: 'admin' | 'customer';
  assetKind: ChatAssetKind;
  totalAmount: number;
  remainingAmount: number;
  quota: number;
  remainingQuota: number;
  mode: ChatRedPacketMode;
  note?: string;
  claims: ChatRedPacketClaim[];
  status: 'active' | 'exhausted';
  isOfficialAdmin?: boolean;
  createdAt?: string;
  createdAtMs: number;
}

export interface ChatSplitBillData {
  id: string;
  creatorAccountId: string;
  creatorName: string;
  title: string;
  assetKind: ChatAssetKind;
  totalAmount: number;
  perPersonAmount: number;
  participantAccountIds: string[];
  paidByAccountIdMap: Record<
    string,
    { accountName: string; paidAt: string; paidAtMs: number; amount?: number; referenceNo?: string }
  >;
  createdAt?: string;
  createdAtMs: number;
}

export interface ChatBillReminderData {
  id: string;
  title: string;
  assetKind: ChatAssetKind;
  amount: number;
  dueDateLabel: string;
  note?: string;
}

export interface ChatReportEntry {
  id: string;
  scope: 'global' | 'private';
  roomScope?: 'global' | 'private';
  roomKey: string;
  messageId: string;
  messagePreview: string;
  reportedAccountId?: string;
  reportedName: string;
  reportedAccountNumber?: string;
  reporterAccountId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  resolutionNote?: string;
  adminNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  createdAtMs: number;
}

export interface ScheduledChatAnnouncement {
  id: string;
  text: string;
  scheduledAtMs: number;
  isPinned?: boolean;
  showPopupOnAllPhones?: boolean;
  adminDivisionLabel?: string;
  createdBy: string;
  sent?: boolean;
  sentAtMs?: number;
}

export interface ChatFeatureFlags {
  chatSystemDisabled?: boolean;
  disableGlobalChat?: boolean;
  disablePrivateChat?: boolean;
  disableGroupChat?: boolean;
  disableCreateGroup?: boolean;
  disableAssetTransfers?: boolean;
  disableRedPacket?: boolean;
  disableSplitBill?: boolean;
  disableImages?: boolean;
  disableVideos?: boolean;
  disableVoiceNotes?: boolean;
  disablePolls?: boolean;
  disableReactions?: boolean;
  disableMessageEdit?: boolean;
  disableChatSystemNotifications?: boolean;
  disableWelcomeGreeting?: boolean;
}

export interface ChatAntiSpamConfig {
  enabled: boolean;
  maxMessagesPer10s: number;
  blockExternalLinks: boolean;
}

export interface GlobalChatMessage {
  id: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  senderAccountId?: string;
  senderAccount?: string;
  senderUserId16?: string;
  senderCardTier?: CardTier;
  isVerified?: boolean;
  adminDivisionLabel?: ChatAdminDivision;
  senderCustomBadge?: ChatCustomBadgeTier | null;
  title: string;
  text: string;
  timestamp: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  editedAt?: string;
  editedAtMs?: number;
  expiresAtMs?: number;
  isPinned?: boolean;
  isOfficialAnnouncement?: boolean;
  isAdminHighlight?: boolean;
  replyToId?: string;
  replyToSender?: string;
  replyToPreview?: string;
  reactions?: Record<string, string[]>;
  poll?: ChatPollData;
  forwardedFrom?: ChatForwardInfo;
  mentions?: string[];
  imageAttachment?: ChatImageAttachment;
  videoAttachment?: ChatVideoAttachment;
  mediaAttachments?: ChatMediaAttachmentItem[];
  voiceAttachment?: ChatVoiceAttachment;
  contactAttachment?: ChatContactAttachment;
  redPacket?: ChatRedPacketData;
}

export interface GlobalChatConfig {
  adminOnlyLock: boolean;
  cooldownMs: number;
  maxVoiceDurationSec?: number;
  lockedBy?: string;
  mutedUsers?: Record<string, GlobalChatMutedUser>;
  bannedWords?: string[];
  bannedWordMode?: 'censor' | 'block';
  adminHighlightDefault?: boolean;
  featureFlags?: ChatFeatureFlags;
  maintenanceNotice?: string;
  customWelcomeText?: string;
  activeAdminDivision?: ChatAdminDivision;
  antiSpamConfig?: ChatAntiSpamConfig;
  scheduledAnnouncements?: ScheduledChatAnnouncement[];
  updatedAtMs: number;
}

export interface PrivateChatContact {
  id: string;
  targetAccountId: string;
  targetAccountNumber: string;
  targetUserId16?: string;
  customName?: string;
  registeredName: string;
  cardTier?: CardTier;
  addedAt: string;
}

export interface PrivateChatGroup {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  iconKey: string;
  accentColor: string;
  creatorAccountId: string;
  coAdminAccountIds?: string[];
  memberAccountIds: string[];
  pinnedMessageIds?: string[];
  createdAt: string;
  updatedAtMs: number;
}

export type NotificationCategory10Key =
  | 'transaksi'
  | 'transfer'
  | 'keamanan'
  | 'pinjaman'
  | 'kartu'
  | 'emas'
  | 'kerja'
  | 'spin'
  | 'hadiah'
  | 'sistem';

export type NotificationCategory =
  | NotificationCategory10Key
  | 'transaction'
  | 'loan'
  | 'security'
  | 'promo';

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

export type BugReportStatus =
  | 'baru'
  | 'antrean_tinjauan'
  | 'ditinjau'
  | 'cek_bukti_log'
  | 'terverifikasi'
  | 'analisis_akar'
  | 'reproduksi_teknis'
  | 'prioritas_perbaikan'
  | 'diteruskan_tim_inti'
  | 'dijadwalkan_perbaikan'
  | 'dalam_perbaikan'
  | 'penyusunan_patch'
  | 'integrasi_modul'
  | 'optimasi_keamanan'
  | 'diperbaiki'
  | 'uji_ulang'
  | 'sedang_diuji_ulang'
  | 'lulus_uji_qa'
  | 'siap_rilis_publik'
  | 'telah_dirilis'
  | 'selesai'
  | 'arsip_pemeliharaan'
  | 'ditolak'
  | 'duplikat'
  | 'tidak_repro'
  | 'diproses'; // Legacy compatibility alias

export interface BugReportReward {
  given: boolean;
  cashAmount: number;
  coinAmount: number;
  diamondAmount: number;
  goldGrams?: number;
  voucherAmount: number;
  pointsAmount: number;
  familySlotAmount?: number;
  adminRewardMessage?: string;
  awardedAt?: string;
  awardedBy?: string;
}

export interface BugRewardProgramConfig {
  enabled: boolean; // Sakelar global Aktifkan Program Hadiah Bug
  cashAmount: number; // Saldo Uang (Rp)
  coinAmount: number; // Coin Spin
  diamondAmount: number; // Permata
  goldGrams: number; // Emas 24K (gram)
  voucherAmount: number; // Voucher Level
  pointsAmount: number; // Poin Rewards
  familySlotAmount: number; // Slot Keluarga tambahan
  defaultRewardMessage: string;
  autoRewardTriggerStatuses?: BugReportStatus[]; // Daftar status dari 25 tahap yang otomatis mencairkan hadiah (anti-ganda 1x)
  updatedAt?: string;
}

export interface BugReportRecord {
  id: string;
  accountId?: string;
  reporterAccountId?: string;
  reporterName: string;
  reporterAccountNumber?: string;
  reporterEmail?: string;
  category: string;
  explanation: string; // Wajib diisi
  photoDataUrl?: string; // Opsional (foto bebas)
  photoFileName?: string;
  status: BugReportStatus;
  isVerifiedByAdmin?: boolean;
  verifiedAt?: string;
  rejectionReason?: string;
  adminReply?: string;
  reward?: BugReportReward;
  createdAt: string;
  updatedAt?: string;
}

export type SuggestionStatus =
  | 'baru'
  | 'ditinjau'
  | 'diterima'
  | 'dikerjakan'
  | 'dirilis'
  | 'ditolak';

export type SuggestionPriority = 'ringan' | 'sedang' | 'penting' | 'kritis';

export interface SuggestionReward {
  given: boolean;
  cashAmount: number;
  coinAmount: number;
  diamondAmount: number;
  goldGrams?: number;
  voucherAmount: number;
  pointsAmount: number;
  familySlotAmount?: number;
  adminRewardMessage?: string;
  awardedAt?: string;
  awardedBy?: string;
}

export interface SuggestionRewardProgramConfig {
  enabled: boolean;
  cashAmount: number;
  coinAmount: number;
  diamondAmount: number;
  goldGrams: number;
  voucherAmount: number;
  pointsAmount: number;
  familySlotAmount: number;
  defaultRewardMessage: string;
  autoRewardTriggerStatuses?: SuggestionStatus[];
  updatedAt?: string;
  updatedAtMs?: number;
}

export interface SuggestionRecord {
  id: string;
  reporterAccountId?: string;
  reporterName: string;
  reporterAccountNumber?: string;
  reporterUserId16?: string;
  reporterEmail?: string;
  title: string;
  category: string;
  priority: SuggestionPriority;
  explanation: string;
  photoDataUrl?: string;
  photoFileName?: string;
  status: SuggestionStatus;
  isAcceptedByAdmin?: boolean;
  acceptedAt?: string;
  rejectionReason?: string;
  adminReply?: string;
  reward?: SuggestionReward;
  createdAt: string;
  updatedAt?: string;
}

export type AppUpdateReleaseType =
  | 'major'
  | 'minor'
  | 'patch'
  | 'feature_and_bug'
  | 'bug'
  | 'small_bug';
export type AppUpdateVisibilityMode = 'auto' | 'public' | 'admin_only';

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
  buildId?: string; // ID Build otomatis saat kompilasi/publish (mis. BLD-20261120-1230)
  isAutoDetected?: boolean; // true jika tercatat otomatis oleh detektor build/rilis
  editedByAdmin?: boolean; // true jika telah diedit manual oleh Admin agar tidak ditimpa ulang
  releaseType?: AppUpdateReleaseType; // Format vAAA.SS.DD: major (+AAA), minor (+SS), patch (+DD)
  visibilityMode?: AppUpdateVisibilityMode; // auto = saring poin Admin otomatis, public = tampil penuh, admin_only = sembunyikan khusus Admin
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
  // Kontrol Risiko Kerugian & Kebijakan Hutang (Panel Admin)
  lossRiskPercent?: number; // Default 25% (peluang kerugian 0 - 80%)
  lossSeverityPercent?: number; // Default 35% (persentase kerugian terhadap nilai aktivitas)
  debtDefaultTermHours?: number; // Default 24 jam batas waktu kesepakatan bayar hutang
  debtBanDurationHours?: number; // Default 24 jam (1 Hari) durasi auto-ban jika lewat tenggat
  debtLateFeeEnabled?: boolean; // Default false (pokok murni, opsi bunga denda di Panel Admin)
  debtLateFeePercent?: number; // Default 5% bunga denda jika diaktifkan Admin
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
  | 'tagihan'
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
  balanceAfter?: number;
  date?: string;
  note?: string;
  senderAccount?: string;
  senderName?: string;
  recipientAccount?: string;
  recipientName?: string;
  recipientBank?: string;
  description?: string;
  status: 'success' | 'pending' | 'rejected' | 'berhasil';
  referenceNo: string;
  timestamp: string;
  balanceDeducted?: boolean;
  generatedCode?: string;
  requiresBuyerApproval?: boolean;
  buyerApproved?: boolean;
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
    | 'emas'
    | 'lainnya';
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
  // Notifikasi Khusus Kartu Tier ADMIN & Akun OA Admin
  isAdminTierOnly?: boolean;
  // Notifikasi Privat Khusus Pemegang Akun Tertentu (contoh: Unban hanya muncul di perangkat pemegang akun tsb)
  privateAccountOnly?: boolean;
  adminEventType?: AdminTierNotificationEventType;
  adminQuickAction?: AdminTierNotificationQuickAction;
  adminTargetTab?: string;
}

export interface ChatMessage {
  id: string;
  senderAccountId?: string;
  senderAccount: string;
  senderName: string;
  senderRole?: 'admin' | 'customer';
  senderCardTier?: CardTier;
  adminDivisionLabel?: ChatAdminDivision;
  senderCustomBadge?: ChatCustomBadgeTier | null;
  recipientAccountId?: string;
  recipientAccount: string;
  receiverAccount?: string;
  recipientName: string;
  groupId?: string;
  text: string;
  timestamp: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  editedAt?: string;
  editedAtMs?: number;
  expiresAtMs?: number;
  replyToId?: string;
  replyToSender?: string;
  replyToPreview?: string;
  deleted?: boolean;
  isPinned?: boolean;
  reactions?: Record<string, string[]>;
  readBy?: Record<string, ChatReadReceiptEntry>;
  poll?: ChatPollData;
  forwardedFrom?: ChatForwardInfo;
  mentions?: string[];
  imageAttachment?: ChatImageAttachment;
  videoAttachment?: ChatVideoAttachment;
  mediaAttachments?: ChatMediaAttachmentItem[];
  voiceAttachment?: ChatVoiceAttachment;
  contactAttachment?: ChatContactAttachment;
  redPacket?: ChatRedPacketData;
  splitBill?: ChatSplitBillData;
  billReminder?: ChatBillReminderData;
  transferAttachment?: {
    assetKind?: ChatAssetKind;
    amount: number;
    referenceNo: string;
    note?: string;
    isRequest?: boolean;
    status?: 'pending' | 'paid' | 'rejected';
    targetAccountNumber?: string;
    targetName?: string;
    paidByAccountId?: string;
    paidByName?: string;
    paidAt?: string;
    rejectedAt?: string;
    rejectedByName?: string;
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
  iconName?: string;
  colorClass?: string;
  deadline?: string;
}

export type SavingsPocket = PocketSaving;

export interface DepositoRecord {
  id: string;
  accountId: string;
  principalAmount: number;
  tenorMonths: number;
  interestRateAnnual: number;
  startDate?: string;
  maturityDate: string;
  projectedReturn: number;
  certificateNumber: string;
  status: 'active' | 'matured';
  openedAt: string;
}

export type DepositoItem = DepositoRecord;

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
  accountId?: string;
  resiNumber: string;
  courier: string;
  sender: string;
  recipient: string;
  origin: string;
  destination: string;
  currentLocation?: string;
  status:
    | 'Diproses'
    | 'Dalam Perjalanan'
    | 'Sedang Diantar Kurir'
    | 'Tiba di Kota Tujuan'
    | 'Terkirim'
    | 'Selesai Diterima';
  history: {
    time: string;
    location: string;
    description?: string;
    note?: string;
  }[];
  shippingFee: number;
  codAmount?: number;
  isCodPaid?: boolean;
  updatedAt?: string;
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

export interface RedeemCodeClaimRecord {
  accountId: string;
  accountNumber: string;
  fullName: string;
  claimedAt: string;
  rewardSummary?: string;
  rewardsGranted?: string[];
  referenceNo?: string;
}

export interface RedeemCode {
  id: string;
  code: string;
  title: string;
  description?: string;
  rewardAmount: number;
  rewards?: AdminGiftRewardItem[]; // Paket hadiah lengkap setara Surat & Hadiah (termasuk Trial & Gacha)
  maxClaims: number; // Berapa banyak orang yang bisa me-redeem
  unlimitedClaims?: boolean; // Jika true, kuota klaim tanpa batas
  claimedBy: RedeemCodeClaimRecord[];
  createdAt: string;
  expiresAt: string; // Berapa lama kodenya berfungsi (ISO timestamp)
  durationMinutes: number;
  unlimitedDuration?: boolean; // Jika true, masa aktif kode tanpa batas waktu
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
  secretCode?: string;
  providerOrMeter: string;
  nominal: number;
  kwhAmount?: number;
  status: 'available' | 'redeemed';
  isRedeemed?: boolean;
  adminApproved: boolean;
  purchasedAt: string;
  createdAt?: string;
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
  defaultValueHint?: number | string;
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

  // 6. Preferensi Kategori Notifikasi Push (10 Jenis Lengkap + Kompatibilitas Lama)
  pushTransactionAlerts: boolean;
  pushLoanAlerts: boolean;
  pushSecurityAlerts: boolean;
  pushPromoAlerts: boolean;
  notificationCategoryPermissions?: Record<NotificationCategory10Key, boolean>;
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
  // Hadiah Tambahan Katalog (Saldo, Koin, Karir, Emas, Tabungan, VIP — Tanpa Mining / Supercar)
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
  | 'trading_sp500_vip'
  | 'sultan_empire_dividend'
  | 'upgrade_card_platinum_perm'
  | 'trial_diamond_combo'
  | 'trial_all_assets_boost'
  | 'upgrade_card_admin_infinity_perm'
  | 'royal_crown_100g_50m_pack'
  | 'job_career_custom_selector'
  | 'trading_custom_selector'
  | 'vip_protection_selector'
  | 'trial_card_tier_selector'
  | 'trial_regular_card'
  | 'trial_premium_card'
  | 'trial_admin_infinity_card'
  | 'trial_job_career_selector'
  | 'trial_job_salary_2x'
  | 'trial_job_salary_5x'
  | 'trial_job_click_power'
  | 'trial_job_coin_rain'
  | 'trial_cashback_15'
  | 'trial_cashback_50'
  | 'trial_free_transfer_vip'
  | 'trial_priority_badge_verified'
  | 'trial_trading_selector'
  | 'trial_trading_btc_whale'
  | 'trial_trading_gold_bullion'
  | 'trial_royal_emperor_all_access'
  | 'trial_gacha_mystery_duration'
  | 'trial_double_reward_points'
  | 'cash_thr_lebaran_pack'
  | 'cash_startup_modal'
  | 'cash_billionaire_vault'
  | 'spin_mega_ticket_bundle'
  | 'job_level_mega_jump'
  | 'voucher_sultan_50'
  | 'gold_bar_50g_royal'
  | 'gold_coin_nusantara_pack'
  | 'deposito_platinum_50m'
  | 'dream_pocket_education_fund'
  | 'dream_pocket_house_fund'
  | 'pln_industrial_pack'
  | 'pulsa_roaming_vip'
  | 'diamond_all_permanent_pack';

export interface GiftRewardSubOption {
  id: string;
  label: string;
  emoji?: string;
  description?: string;
  unitLabelOverride?: string;
  defaultAmountOverride?: number;
  stepOverride?: number;
  isTrialVariant?: boolean;
  defaultTrialMinutesOverride?: number;
}

export interface ActiveAccountTrial {
  id: string;
  rewardType: GiftRewardType;
  label: string;
  emoji: string;
  startedAt: string;
  expiresAt: string;
  durationMinutes: number;
  grantedTrialCardTier?: CardTier;
  revertSnapshot: {
    previousVerified?: boolean;
    previousVerifiedLabel?: string;
    previousVipShield?: boolean;
    previousCardTier?: CardTier;
    previousDevRoleId?: string | null;
    previousCashbackPercent?: number;
    deltaClickPower?: number;
    deltaSalaryMultiplier?: number;
    temporaryBusinessDeltas?: Record<string, number>;
    temporaryTradingDeltas?: Record<string, number>;
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
    | 'VIP & Proteksi'
    | 'Hadiah Trial';
  description: string;
  isTrial?: boolean;
  defaultTrialMinutes?: number;
  isRoleGrant?: boolean;
  subOptionsPrompt?: string;
  subOptions?: GiftRewardSubOption[];
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
  selectedSubOptionId?: string;
  selectedSubOptionLabel?: string;
  rewardMode?: 'fixed' | 'gacha';
  gachaTiers?: GachaTierRange[];
}

export interface GiftTransferRecordInfo {
  fromAccountId: string;
  fromAccountName: string;
  fromAccountNumber: string;
  toAccountId: string;
  toAccountName: string;
  toAccountNumber: string;
  note?: string;
  transferredAt: string;
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
  deliveryContentMode?: 'both' | 'letter_only' | 'gift_only'; // 'both' (Hadiah + Surat), 'letter_only' (Surat Saja), 'gift_only' (Hadiah Saja)
  targetAccountId?: string; // '__ALL__' | '__MULTI__' | specific BankAccount.id
  targetAccountIds?: string[]; // Daftar akun spesifik saat memilih 1 atau banyak pengguna sekaligus
  revokedAccountIds?: string[]; // Daftar akun yang ditarik kembali / dibatalkan kirimannya oleh Admin
  letterOpenedByAccountIds?: string[]; // Daftar akun yang sudah membuka amplop surat
  themeColor?: 'amber' | 'emerald' | 'rose' | 'indigo';
  rewards: AdminGiftRewardItem[];
  claimedByAccountIds: string[];
  viewedByAccountIds: string[];
  gachaResultsByAccount?: Record<string, GachaClaimedItemResult[]>;
  customSealConfig?: LetterSignatureStampConfig | null;
  createdAt: string;
  updatedAt?: string;
  lastTriggeredAt?: string;

  // Transfer Hadiah ke Teman (Saat hadiah belum dibuka)
  transferredOutByAccountIds?: string[];
  transferredToAccountIds?: string[];
  transferHistoryByRecipient?: Record<string, GiftTransferRecordInfo>;

  // 20+ Advanced Admin Features for Gift & Letter
  frequencyType?: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_recurring';
  recurringIntervalHours?: number;
  autoRotateRecurring?: boolean;
  maxRedeemsPerUser?: number;
  targetCardTier?: CardTier | 'all';
  targetDevRoleOnly?: string;
  celebrationEffect?: string;
  celebrationIntensity?: '1000x' | '10000x' | '100000x' | '1000000x';
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

export type DashboardEffectDurationType =
  | '15s'
  | '30s'
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '1h'
  | '6h'
  | '24h'
  | '72h'
  | '168h'
  | 'permanent';

export type DashboardEffectBannerStyle =
  | 'full_top_banner'
  | 'compact_ribbon'
  | 'aura_only_no_banner';

export type DashboardEffectSoundMode = 'fanfare_auto' | 'silent';

export type DashboardScreenBorderFrameStyle =
  | 'none'
  | 'gold_royal'
  | 'cyber_neon'
  | 'rainbow_prism'
  | 'fire_inferno'
  | 'emerald_laser'
  | 'emerald_matrix'
  | 'crimson_alert'
  | 'rainbow_overdrive';

export type DashboardCursorTrailStyle =
  | 'none'
  | 'sparkle_dust'
  | 'rainbow_stars'
  | 'theme_sparkles'
  | 'gold_coins'
  | 'neon_laser'
  | 'fire_aura';

export type DashboardParticleGravityStyle =
  | 'theme_default'
  | 'fall_down'
  | 'float_up'
  | 'diagonal_storm'
  | 'vortex_spiral'
  | 'matrix_digital_rain';

export type DashboardBalanceCardThemeOverride =
  | 'auto_effect'
  | 'gold_sultan'
  | 'cyber_cyan'
  | 'emerald_royal'
  | 'crimson_fire'
  | 'galaxy_purple';

export interface DashboardEffectBlastLogEntry {
  id: string;
  timestamp: string;
  effectId: string;
  intensity: string;
  targetLabel?: string;
  targetSummary?: string;
  actionType?: string;
}

export interface AdminDashboardEffectPackage {
  id: string;
  title: string;
  senderName: string;
  welcomeMessage: string;
  celebrationEffect: string;
  celebrationIntensity: '1000x' | '10000x' | '100000x' | '1000000x';
  targetAccountId: string; // '__ALL__' | '__MULTI__' | specific BankAccount.id
  targetAccountIds?: string[];
  revokedAccountIds?: string[];
  forcedPrimaryForAccountIds?: string[];
  durationType: DashboardEffectDurationType;
  expiresAt?: string | null;
  autoBlastOnOpen: boolean;
  showPersistentDashboardAura: boolean;
  decorateBalanceCard: boolean;
  showAmbientParticles?: boolean;
  bannerStyle?: DashboardEffectBannerStyle;
  soundMode?: DashboardEffectSoundMode;
  stageDurationSeconds?: number;
  // 20+ Fitur Canggih Studio Efek Dashboard (100% Dikendalikan Admin)
  secondaryComboEffectIds?: string[]; // Fitur 2: Multi-Combo Layering (Gabung 2-3 Efek Sekaligus)
  customParticleCount?: number; // Fitur 3: Custom Slider Kepadatan Partikel (20 - 240)
  animationSpeedMultiplier?: number; // Fitur 4: Kecepatan Animasi (0.5x, 1x, 1.5x, 2.5x)
  particleSizeScale?: number; // Fitur 5: Ukuran Partikel (0.75x, 1x, 1.35x, 1.75x)
  gravityDirection?: DashboardParticleGravityStyle; // Fitur 6: Arah Jatuh & Gravitasi Partikel
  screenBorderFrame?: DashboardScreenBorderFrameStyle; // Fitur 7: Bingkai Layar Penuh Neon 3D
  showMarqueeTicker?: boolean; // Fitur 8: Ticker Teks Berjalan di Atas Dashboard
  marqueeTickerText?: string; // Isi Teks Marquee Berjalan
  cursorTrailMode?: DashboardCursorTrailStyle; // Fitur 9: Efek Jejak Kursor / Sentuhan di Dashboard Nasabah
  showFloatingTrophyBadge?: boolean; // Fitur 10: Lencana Trofi Hologram 3D Mengambang di Pojok Dashboard
  floatingBadgePosition?:
    | 'top_right'
    | 'bottom_right'
    | 'bottom_left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-right';
  balanceCardThemeOverride?: DashboardBalanceCardThemeOverride; // Fitur 11: Tema Warna Kartu Saldo Utama
  showStadiumSpotlights?: boolean; // Fitur 12a: Sorot Lampu Stadion & Tirai Teater
  showLightningBolts?: boolean; // Fitur 12b: Sambaran Petir Halilintar Sinematik
  ttsVoiceAnnouncementEnabled?: boolean; // Fitur 13: Pengumuman Suara Bicara TTS Bahasa Indonesia Otomatis
  ttsCustomText?: string;
  audioSynthOverride?: string; // Fitur 14: Pemilih 16 Gaya Musik Synthesizer & Volume
  soundVolumePercent?: number;
  gachaRandomEffectOnBlast?: boolean; // Fitur 15: Mode Gacha Efek Acak Saat Ditembak
  autoRotatePlaylistEnabled?: boolean; // Fitur 16: Playlist Auto-Rotate Efek
  playlistEffectIds?: string[];
  playlistIntervalSeconds?: number;
  scheduledTriggerTime?: string; // Fitur 17: Jadwal Jam/Tanggal Otomatis
  vipSirenAlertMode?: boolean; // Fitur 18: Sirine Darurat / Pengumuman VIP Prioritas
  targetCardTiers?: CardTier[]; // Fitur 19: Filter Target Per Tier Kartu
  minJobLevelTarget?: number; // Fitur 20: Filter Target Per Level Karir / Role Dev
  targetDevRoleId?: string;
  vipPriorityLock?: boolean; // Fitur 21: Kunci Prioritas VIP (Anti-Tertimpa)
  presetTemplateId?: string; // Fitur 22: ID Preset Template Cepat
  blastLogHistory?: DashboardEffectBlastLogEntry[];
  isActive: boolean;
  triggerNonce: number;
  createdAt: string;
  updatedAt?: string;
  lastTriggeredAt?: string;
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

export interface AccountDeletionRequest {
  id: string;
  accountId: string;
  accountNumber: string;
  accountName: string;
  cardTier: CardTier;
  balanceSnapshot: number;
  reasonCategory: string;
  reasonDetail: string;
  confirmationAnswers: {
    understandPermanentLoss: boolean;
    noPendingObligations: boolean;
    agreeAdminReview: boolean;
  };
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNote?: string;
}

export interface AdminFullCustomAccountInput {
  fullName: string;
  userId16?: string;
  accountNumber?: string;
  cardNumber?: string;
  cvv?: string;
  expiryDate?: string;
  pin?: string;
  oaAdminPin?: string;
  nik?: string;
  phone?: string;
  email?: string;
  address?: string;
  structuredAddress?: StructuredIndonesiaAddress;
  cardTier: CardTier;
  balance: number;
  isUnlimitedBalance?: boolean;
  goldGrams?: number;
  spinCoins?: number;
  rewardPoints?: number;
  pulsaBalance?: number;
  plnKwhBalance?: number;
  jobLevel?: number;
  levelVouchers?: number;
  clickPower?: number;
  salaryMultiplier?: number;
  cashbackPercent?: number;
  vipShieldActive?: boolean;
  allowInternational?: boolean;
  customSpendingLimit?: number;
  isVerified?: boolean;
  verifiedLabel?: string;
  devRoleId?: string | null;
  grantAllSultanBusinesses?: boolean;
  sultanBusinessUnitsEach?: number;
  isOfficialAdminAccount?: boolean;
  accountCategory?: 'guest' | 'regular_no_google' | 'oa';
}

export interface StructuredIndonesiaAddress {
  provinceCode: string;
  provinceName: string;
  regencyCode: string;
  regencyName: string;
  districtCode: string;
  districtName: string;
  villageCode: string;
  villageName: string;
  postalCode: string;
  rt: string;
  rw: string;
  streetAddress?: string;
}

export type SupportFaqCategory =
  | 'akun'
  | 'kartu'
  | 'atm'
  | 'pinjaman'
  | 'keamanan'
  | 'transfer'
  | 'emas'
  | 'spin'
  | 'oa_guest'
  | 'umum';

export interface SupportFaqItem {
  id: string;
  category: SupportFaqCategory;
  question: string;
  answer: string;
  steps: string[];
  tip?: string;
  keywords?: string[];
  isActive?: boolean;
  isCustomAdmin?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SupportContactSubOptionPreset {
  id: string;
  categoryId: string;
  label: string;
  shortLabel: string;
  explanation: string;
  isDefault?: boolean;
  isActive?: boolean;
  updatedAt?: string;
}

export interface SupportContactCategoryPreset {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  accentClass?: string;
  subOptions: SupportContactSubOptionPreset[];
  isDefault?: boolean;
  isActive?: boolean;
  updatedAt?: string;
}

export interface SupportContactConfig {
  serviceName: string;
  whatsappNumber: string;
  whatsappEnabled: boolean;
  whatsappAutoMessage: string;
  emailAddress: string;
  emailEnabled: boolean;
  emailAutoSubject: string;
  emailAutoBody: string;
  operatingHours: string;
  responseEstimate: string;
  presetCategories?: SupportContactCategoryPreset[];
  updatedAt?: string;
}

// ==================== MATA UANG DIAMOND & BUATQRIS ====================
export type DiamondFeatureKey =
  | 'family_slots'
  | 'job_voucher_upgrade'
  | 'spin_gacha_auction'
  | 'dashboard_vip_effects'
  | 'diamond_transfer_exchange';

export interface DiamondSystemConfig {
  baseDiamondPriceRupiah: number; // Default Rp 90 (55% lebih murah dari Rp 200)
  diamondDiscountPercent: number; // 0..99% (dikelola di Panel Admin)
  priceRevision?: number; // Revisi migrasi harga & batas maksimal (v3: maks 11.099 & Rp 998.910)
  allowCustomAmount: boolean;
  minCustomDiamond: number;
  maxCustomDiamond: number; // Default 11.099 (batas keras 11.099)
  maxPurchaseRupiah?: number; // Default 998.910 (harga dasar sebelum angka unik 3 digit)
  useUniqueCode3Digit: boolean; // Default true
  qrisExpiryMinutes: number; // Default 10 menit
  enabledFeatures: Record<DiamondFeatureKey, boolean>;
  updatedAt?: string;
}

export interface DiamondPackageItem {
  id: number; // 1..250
  diamonds: number; // 1..11099
  tierLabel: 'Hemat' | 'Populer' | 'Sultan' | 'Max Sultan';
  isPopular?: boolean;
}

// ==================== KONTROL VISIBILITAS TAB & FITUR ADMIN ====================
export type UiVisibilityNavKey =
  | 'debt'
  | 'dashboard'
  | 'missions'
  | 'leaderboard'
  | 'family'
  | 'transfer'
  | 'emas'
  | 'anggaran'
  | 'redeem'
  | 'jobs'
  | 'spin_wheel'
  | 'chat'
  | 'atm'
  | 'guide'
  | 'updates';

export interface UiVisibilityConfig {
  navTabs: Record<UiVisibilityNavKey, boolean>;
  showDiamondBalance: boolean;
  showDiamondTopUpButton: boolean;
  storeTabTopUp: boolean;
  storeTabUse: boolean;
  storeTabHistory: boolean;
  updatedAt?: string;
}

// ==================== SISTEM PERINGATAN ADMIN (MANUAL + 80 TEMPLATE DESAIN UNIK) ====================
export type AdminWarningIconKey =
  | 'wrench'
  | 'alert-triangle'
  | 'shield-alert'
  | 'info'
  | 'megaphone'
  | 'sparkles'
  | 'wifi-off'
  | 'server-crash'
  | 'lock'
  | 'bell-ring'
  | 'clock'
  | 'gift'
  | 'ban'
  | 'check-circle'
  | 'bug'
  | 'zap'
  | 'crown'
  | 'gem'
  | 'flame'
  | 'rocket'
  | 'shield-check'
  | 'credit-card'
  | 'calendar'
  | 'radio'
  | 'award'
  | 'receipt'
  | 'scale'
  | 'heart-handshake';

export type AdminWarningColorTheme =
  | 'amber'
  | 'rose'
  | 'sky'
  | 'emerald'
  | 'indigo'
  | 'slate'
  | 'gold_sultan'
  | 'crimson_alert'
  | 'cyber_cyan'
  | 'royal_violet'
  | 'festive_teal'
  | 'obsidian_luxe';

export type AdminWarningCategory =
  | 'perbaikan'
  | 'jaringan'
  | 'keamanan'
  | 'promo'
  | 'vip_sultan'
  | 'update'
  | 'pengumuman'
  | 'individu';

export type AdminWarningVisualStyle =
  | 'royal_gold'
  | 'cyber_terminal'
  | 'emergency_siren'
  | 'vault_shield'
  | 'festive_celebration'
  | 'neon_pulse'
  | 'executive_glass'
  | 'split_banner'
  | 'hologram_vip'
  | 'radar_network'
  | 'official_decree'
  | 'individual_formal';

export type AdminWarningBgPattern =
  | 'none'
  | 'diagonal_stripes'
  | 'dot_matrix'
  | 'circuit_grid'
  | 'radial_spotlight'
  | 'gold_shimmer'
  | 'hazard_chevron'
  | 'starburst_confetti'
  | 'wave_mesh'
  | 'security_grid';

export type AdminWarningAnimationStyle =
  | 'smooth_zoom'
  | 'slide_drop'
  | 'pulse_glow'
  | 'shimmer_border'
  | 'float_gentle'
  | 'urgent_shake';

export type AdminWarningDisplayMode = 'popup' | 'banner';
export type AdminWarningTargetMode = 'all' | 'tiers' | 'accounts';

export interface AdminSystemWarning {
  id: string;
  title: string;
  message: string;
  iconKey: AdminWarningIconKey;
  colorTheme: AdminWarningColorTheme;
  displayMode: AdminWarningDisplayMode;
  isPermanent: boolean;
  showPermanentLabel: boolean;
  dismissible: boolean;
  lockScreen?: boolean;
  templateId?: string;
  visualStyle?: AdminWarningVisualStyle;
  bgPattern?: AdminWarningBgPattern;
  animationStyle?: AdminWarningAnimationStyle;
  badgeText?: string;
  estimatedDurationText?: string;
  referenceCode?: string;
  ctaLabel?: string;
  showOfficialStamp?: boolean;
  targetMode: AdminWarningTargetMode;
  targetTiers: CardTier[];
  targetAccountIds: string[];
  isActive: boolean;
  resendVersion: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSystemWarningPreset {
  id: string;
  code: number;
  category: AdminWarningCategory;
  name: string;
  designTag: string;
  title: string;
  message: string;
  iconKey: AdminWarningIconKey;
  colorTheme: AdminWarningColorTheme;
  visualStyle: AdminWarningVisualStyle;
  bgPattern: AdminWarningBgPattern;
  animationStyle: AdminWarningAnimationStyle;
  badgeText: string;
  estimatedDurationText?: string;
  referenceCode?: string;
  ctaLabel?: string;
  showOfficialStamp: boolean;
  suggestedDisplayMode: AdminWarningDisplayMode;
  suggestedPermanent: boolean;
  suggestedShowPermanentLabel: boolean;
  suggestedDismissible: boolean;
  suggestedLockScreen: boolean;
}

export type QrisOrderStatus = 'PENDING' | 'LUNAS' | 'EXPIRED';

export interface QrisPaymentOrder {
  orderId: string;
  externalInvoiceId?: string;
  accountId: string;
  accountName: string;
  purpose: 'diamond_topup' | 'coin_topup' | 'feature_checkout';
  diamondAmount?: number;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  discountPercentApplied?: number;
  modeUsed: 'api' | 'emvco';
  configReady: boolean;
  configNotice?: string;
  qrisString: string;
  qrisImageUrl?: string;
  status: QrisOrderStatus;
  fulfilled?: boolean;
  providerReference?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
}

// ==================== FITUR KELUARGA BANK NUSANTARA ====================
export type FamilyMemberRole = 'owner' | 'co_leader' | 'member';

export interface FamilyMemberRecord {
  accountId: string;
  role: FamilyMemberRole;
  nameTag: string;
  canEditNameTag: boolean; // Sakelar izin langsung dari pemilik
  canEditFamilyName: boolean; // Sakelar izin langsung khusus Wakil Kepala Keluarga
  joinedAt: string;
}

export interface FamilyPermissionRequest {
  id: string;
  requesterAccountId: string;
  requesterName: string;
  type: 'name_tag' | 'family_name';
  proposedValue: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
}

export interface FamilyGroup {
  id: string;
  familyCode: string; // Format 4x3: "XXXX XXXX XXXX"
  name: string;
  ownerAccountId: string;
  members: FamilyMemberRecord[];
  pendingRequests: FamilyPermissionRequest[];
  createdAt: string;
  updatedAt?: string;
}

export interface FamilySystemConfig {
  enabled: boolean;
  defaultMaxFamilies: number; // Default 1
  baseSlotMoneyCost: number; // Default 2.500.000
  baseSlotDiamondCost: number; // Default 100
  maxMembersPerFamily: number; // Default 25
  allowCoLeaderRenameFamily: boolean;
  allowMemberChangeNameTag: boolean;
  updatedAt?: string;
}

// ==================== SISTEM MISI HARIAN, 7-HARI & BIASA + 25 KONTROL ADMIN ====================
export type MissionCategory = 'daily' | 'streak_7' | 'normal';
export type MissionTrackingMode = 'auto' | 'manual';
export type MissionStreakMissPolicy = 'reset_day_1' | 'continue';

export type MissionMetricKey =
  | 'any_tx'
  | 'transfer_count'
  | 'transfer_amount'
  | 'deposit_count'
  | 'withdraw_count'
  | 'spin_count'
  | 'job_clicks'
  | 'job_complete'
  | 'gold_tx'
  | 'redeem_claim'
  | 'family_action'
  | 'daily_checkin'
  | 'manual_claim';

export interface MissionRewardBundle {
  money?: number;
  spinCoins?: number;
  diamonds?: number;
  goldGrams?: number;
  rewardPoints?: number;
  levelVouchers?: number;
  jobLevelBoost?: number;
  devRoleId?: string;
  cardTierReward?: CardTier;
  dashboardEffectId?: string;
  customGiftLabel?: string;
}

export interface MissionDayRewardConfig {
  day: number; // 1..7
  title?: string;
  rewards: MissionRewardBundle;
}

export interface AppMissionDefinition {
  id: string;
  category: MissionCategory;
  title: string;
  description: string;
  iconEmoji?: string;
  trackingMode: MissionTrackingMode;
  metricKey: MissionMetricKey;
  targetValue: number;
  unitLabel?: string;
  isActive: boolean;
  sortOrder: number;
  rewards: MissionRewardBundle;
  streakDays?: MissionDayRewardConfig[];
  streakMissPolicy?: MissionStreakMissPolicy;
  startAt?: string;
  endAt?: string;
  maxClaimsPerAccount?: number;
  globalClaimQuota?: number;
  totalGlobalClaims?: number;
  targetTiers?: CardTier[];
  requireVerifiedAccount?: boolean;
  badgeText?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface MissionAccountProgressRecord {
  missionId: string;
  progress: number;
  lastProgressDateKey?: string;
  claimedDates?: string[];
  totalClaims?: number;
  lastClaimedAt?: string;
  streakDay?: number;
  lastStreakClaimDateKey?: string;
}

export interface MissionSystemConfig {
  enabled: boolean;
  dailyResetHourWib: number;
  showEmptyBannerInfo: boolean;
  emptyStateTitle: string;
  emptyStateDescription: string;
  allowManualClaimFallback: boolean;
  notifyOnMissionComplete: boolean;
  updatedAt?: string;
}

export interface MissionClaimAuditLog {
  id: string;
  missionId: string;
  missionTitle: string;
  category: MissionCategory;
  accountId: string;
  accountName: string;
  dayClaimed?: number;
  rewardsSummary: string;
  grantedByAdmin?: boolean;
  claimedAt: string;
}

// ==================== SISTEM LEADERBOARD MULTI-ASET ====================
export type LeaderboardCategoryKey =
  | 'balance'
  | 'spinCoins'
  | 'diamonds'
  | 'goldGrams'
  | 'rewardPoints'
  | 'jobLevel'
  | 'txCount'
  | string;

export interface LeaderboardCategoryConfig {
  id: string;
  key: LeaderboardCategoryKey;
  label: string;
  unitLabel: string;
  enabled: boolean;
  sortOrder: number;
  accentColor?: 'emerald' | 'amber' | 'cyan' | 'yellow' | 'indigo' | 'fuchsia' | 'rose';
}

export type LeaderboardBadgeTierStyle = 'gold_1' | 'gray_2' | 'brown_3' | 'charcoal_4_100';

export interface AccountTopLeaderboardEntry {
  categoryId: string;
  categoryKey: LeaderboardCategoryKey;
  categoryLabel: string;
  unitLabel: string;
  rank: number;
  score: number;
  tierStyle: LeaderboardBadgeTierStyle;
  isUnlimited?: boolean;
}

export interface LeaderboardSystemConfig {
  enabled: boolean;
  showAdminTier: boolean;
  maxEntries: number;
  showMyRankCard: boolean;
  hideBannedAccounts: boolean;
  hidePendingAccounts: boolean;
  showTopBadges?: boolean;
  maxBadgeRank?: number;
  topBadgeCustomPrefix?: string;
  showTopBadgesOnCard?: boolean;
  showTopBadgesInProfile?: boolean;
  categories: LeaderboardCategoryConfig[];
  updatedAt?: string;
}

// ==================== SISTEM NOTIFIKASI KHUSUS KARTU TIER ADMIN ====================
export type AdminTierNotificationEventType =
  | 'card_approval'
  | 'bug_report'
  | 'qris_topup'
  | 'pin_lock_1day'
  | 'pin_reset'
  | 'account_deletion'
  | 'card_upgrade'
  | 'high_value_tx'
  | 'anomaly_detector'
  | 'admin_broadcast';

export type AdminTierQuickActionType =
  | 'approve_card'
  | 'verify_bug_reward'
  | 'reset_pin_lock'
  | 'approve_pin_reset'
  | 'approve_card_upgrade'
  | 'pause_spin'
  | 'freeze_account'
  | 'open_admin_tab';

export interface AdminTierNotificationQuickAction {
  actionType?: AdminTierQuickActionType;
  type?: AdminTierQuickActionType;
  targetId?: string;
  targetEntityId?: string;
  label: string;
  adminTab?: string;
  completed?: boolean;
}

export interface AdminTierNotificationConfig {
  enabled: boolean;
  soundEnabled: boolean;
  showTopToast: boolean;
  showTopToastBanner?: boolean;
  showDashboardCommandBox: boolean;
  showNavbarQueueBadge: boolean;
  highValueTxThreshold: number;
  triggers: Record<AdminTierNotificationEventType, boolean>;
  updatedAt?: string;
}

// ==================== TOMBSTONE REGISTRY PENGHAPUSAN GLOBAL ADMIN (ANTI-MUNCUL LAGI DI HP) ====================
export type AdminDeletableCollectionKey =
  | 'adminWarnings'
  | 'websitePopups'
  | 'dashboardEffectEvents'
  | 'missions'
  | 'redeemCodes'
  | 'giftEvents'
  | 'bugReports'
  | 'globalChats'
  | 'adminHelpRequests'
  | 'supportFaqs'
  | 'appUpdates'
  | 'devRoles'
  | 'accounts'
  | 'families'
  | 'banPresets'
  | 'suggestions'
  | 'privateChats'
  | 'privateChatGroups'
  | 'chatReports';

export type DeletedAdminItemIdsMap = Partial<Record<AdminDeletableCollectionKey, string[]>>;

// ==================== KEHADIRAN NASABAH REAL-TIME (FITUR INTIP LIVE ADMIN) ====================
export type CustomerPresenceStatus = 'online' | 'idle' | 'offline';

export interface CustomerPresenceRecentAction {
  id: string;
  title?: string;
  actionLabel?: string;
  screenLabel: string;
  timestamp: string;
}

export interface CustomerPresenceRecord {
  accountId: string;
  accountNumber: string;
  accountName?: string;
  fullName?: string;
  cardTier: CardTier;
  cardStatus?: CardStatus;
  status: CustomerPresenceStatus;
  currentView?: string;
  currentViewKey?: string;
  currentScreenLabel: string;
  currentActionLabel: string;
  currentSubTabLabel?: string;
  deviceType: 'mobile' | 'desktop' | 'HP / Mobile' | 'Laptop / Desktop';
  deviceLabel?: string;
  browserLabel?: string;
  sessionId: string;
  lastActiveAt?: string;
  lastActiveAtIso?: string;
  lastHeartbeatAtMs?: number;
  lastHeartbeatMs?: number;
  lastInteractionAtMs?: number;
  onlineSince?: string;
  onlineSinceIso?: string;
  lastOfflineAt?: string;
  lastOfflineAtIso?: string;
  balanceSnapshot?: number;
  goldGramsSnapshot?: number;
  spinCoinsSnapshot?: number;
  diamondsSnapshot?: number;
  recentActions: CustomerPresenceRecentAction[];
}

// ==================== LIVE MONITOR AKTIVITAS NASABAH & ADMIN + 69 PENDETEKSI OTOMATIS REAL-TIME ====================
export type LiveActivityActorRole = 'nasabah' | 'admin' | 'auto_detector';

export type LiveActivityCategory =
  | 'spin_game'
  | 'transaction'
  | 'auth_security'
  | 'admin_action'
  | 'auto_detector';

export type AutoDetectorRuleKey = string;

export interface LiveSystemActivityLog {
  id: string;
  timestamp: string;
  actorRole: LiveActivityActorRole;
  category: LiveActivityCategory;
  accountId?: string;
  accountName: string;
  accountNumber?: string;
  cardTier?: CardTier;
  actionTitle: string;
  description: string;
  amountRupiah?: number;
  spinCountType?: 1 | 3 | 5 | 7 | 10;
  spin1xTotalCount?: number;
  spin10xStreakCount?: number;
  spin10xThreshold?: number;
  prizesSummary?: string;
  isAnomalyDetected?: boolean;
  anomalyRuleKey?: AutoDetectorRuleKey;
  anomalyRuleCode?: number;
  screenLabel?: string;
  deviceType?: 'mobile' | 'desktop' | 'HP / Mobile' | 'Laptop / Desktop';
}

export interface AutoDetectedAnomalyAlert {
  id: string;
  ruleKey: AutoDetectorRuleKey;
  ruleCode?: number;
  ruleNumber?: number;
  categoryKey?: string;
  ruleCategory?: string;
  severity?: 'kritis' | 'tinggi' | 'menengah';
  accountId: string;
  accountName: string;
  accountNumber: string;
  cardTier: CardTier;
  title: string;
  detailSummary: string;
  occurrenceCount: number;
  thresholdCount: number;
  windowMinutes: number;
  totalRewardOrAmount: number;
  rewardBreakdownText?: string;
  deviceLabel?: string;
  detectedAt: string;
  status: 'active' | 'ignored' | 'resolved';
  actionTakenLabel?: string;
}

export interface LiveActivityDetectorConfig {
  enabled: boolean;
  soundAlertEnabled: boolean;
  spin10xThresholdCount: number;
  spin10xWindowMinutes: number;
  rapidTxThresholdCount: number;
  rapidTxWindowMinutes: number;
  repeatedPinFailThreshold: number;
  largeAssetMutationThresholdRupiah: number;
  pauseSpinDefaultMinutes: number;
  rulesEnabled: Record<string, boolean>;
  ruleThresholds?: Record<string, number>;
  ruleWindowMinutes?: Record<string, number>;
  updatedAt?: string;
}
