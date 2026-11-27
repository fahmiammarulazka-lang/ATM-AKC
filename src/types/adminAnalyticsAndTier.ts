/**
 * Shared Types, Tab Catalog, Quick Presets & RBAC Helpers for:
 * 1. Tab "Pengangkatan Kartu Tier Admin" (Granular Per-Tab Access Control)
 * 2. Tab "Analitik & Trafik Pengunjung Real-Time" (Global / Account / Device-Location)
 */

import type { BankAccount, CardTier } from './bank';

export type AdminPortalTabKey =
  | 'admin_tier_promotion'
  | 'visitor_analytics'
  | 'live_monitor'
  | 'warning_studio'
  | 'help_center'
  | 'missions_admin'
  | 'leaderboard_admin'
  | 'super_tools'
  | 'gift_letters'
  | 'dashboard_effects'
  | 'dev_roles'
  | 'universal_gacha'
  | 'spin_wheel_admin'
  | 'diamond_family_admin'
  | 'gold_transfer_admin'
  | 'debt_admin'
  | 'mintol_admin'
  | 'app_updates'
  | 'global_chat'
  | 'bug_reports'
  | 'suggestions'
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
  | 'audit';

export interface AdminTabCatalogItem {
  key: AdminPortalTabKey;
  label: string;
  shortLabel: string;
  group: 'Utama & Keamanan' | 'Keuangan & Aset' | 'Sosial & Komunitas' | 'Nasabah & Sistem';
  description: string;
  superAdminOnlyByDefault?: boolean;
}

export const ADMIN_TAB_CATALOG: AdminTabCatalogItem[] = [
  {
    key: 'admin_tier_promotion',
    label: 'Pengangkatan Kartu Tier Admin',
    shortLabel: 'Pengangkatan Admin',
    group: 'Utama & Keamanan',
    description: 'Angkat kartu menjadi Tier Admin, atur izin per tab, bekukan, atau cabut akses.',
    superAdminOnlyByDefault: true,
  },
  {
    key: 'visitor_analytics',
    label: 'Analitik & Trafik Pengunjung Real-Time',
    shortLabel: 'Analitik Pengunjung',
    group: 'Utama & Keamanan',
    description: 'Pantau total kunjungan global, per akun, dan per perangkat + lokasi secara real-time.',
  },
  {
    key: 'live_monitor',
    label: 'Live Monitor Aktivitas & Deteksi Otomatis',
    shortLabel: 'Live Monitor',
    group: 'Utama & Keamanan',
    description: 'Intip layar live nasabah, log aktivitas real-time, dan anomali otomatis.',
  },
  {
    key: 'warning_studio',
    label: 'Studio Peringatan & Pemberitahuan',
    shortLabel: 'Studio Peringatan',
    group: 'Utama & Keamanan',
    description: 'Kirim peringatan layar penuh dan notifikasi darurat ke nasabah.',
  },
  {
    key: 'accounts',
    label: 'Masuk Cepat & Edit Semua Akun Nasabah',
    shortLabel: 'Kelola Akun',
    group: 'Nasabah & Sistem',
    description: 'Edit profil, saldo, tier, dan masuk cepat ke akun nasabah.',
  },
  {
    key: 'finance',
    label: 'Tinjauan Keuangan Wajib Admin',
    shortLabel: 'Keuangan',
    group: 'Keuangan & Aset',
    description: 'Setujui atau tolak transaksi keuangan, transfer, dan penarikan.',
  },
  {
    key: 'diamond_family_admin',
    label: 'QRIS Diamond & Keluarga',
    shortLabel: 'QRIS & Keluarga',
    group: 'Keuangan & Aset',
    description: 'Kelola QRIS Top-Up Diamond, QR Manual, BuatQRIS, dan grup Keluarga.',
  },
  {
    key: 'gold_transfer_admin',
    label: 'Kontrol Emas 24K & Transfer Bebas 5%',
    shortLabel: 'Emas & Transfer',
    group: 'Keuangan & Aset',
    description: 'Atur harga emas 24K, spread, dan aturan transfer bebas.',
  },
  {
    key: 'debt_admin',
    label: 'Kelola Hutang & Risiko Rugi',
    shortLabel: 'Hutang',
    group: 'Keuangan & Aset',
    description: 'Pantau hutang nasabah, denda, dan kebijakan penagihan.',
  },
  {
    key: 'loans',
    label: 'Pinjaman Online Nasabah',
    shortLabel: 'Pinjaman',
    group: 'Keuangan & Aset',
    description: 'Persetujuan pengajuan pinjaman dan pelunasan.',
  },
  {
    key: 'spin_wheel_admin',
    label: 'Kontrol Spin Wheel & Diskon Koin',
    shortLabel: 'Spin Wheel',
    group: 'Keuangan & Aset',
    description: 'Atur harga koin, diskon spin, dan hadiah roda.',
  },
  {
    key: 'universal_gacha',
    label: 'Gacha Universal (Semua Fitur)',
    shortLabel: 'Gacha Universal',
    group: 'Keuangan & Aset',
    description: 'Kelola peluang dan paket hadiah Gacha Universal.',
  },
  {
    key: 'redeem',
    label: 'Buat Kode Redeem',
    shortLabel: 'Kode Redeem',
    group: 'Keuangan & Aset',
    description: 'Buat, edit, dan pantau kuota kode redeem hadiah.',
  },
  {
    key: 'global_chat',
    label: 'Settingan Chat Lengkap & Status 24 Jam',
    shortLabel: 'Chat & Status',
    group: 'Sosial & Komunitas',
    description: 'Moderasi Chat Global, Privat, Status 24 Jam, laporan, dan banner tersemat.',
  },
  {
    key: 'gift_letters',
    label: 'Hadiah & Surat Resmi Spesial',
    shortLabel: 'Hadiah & Surat',
    group: 'Sosial & Komunitas',
    description: 'Kirim paket hadiah resmi, tanda tangan, dan surat berkop.',
  },
  {
    key: 'dashboard_effects',
    label: 'Studio Efek Dashboard',
    shortLabel: 'Efek Dashboard',
    group: 'Sosial & Komunitas',
    description: 'Kirim efek visual ke dashboard 1 akun, banyak akun, atau semua.',
  },
  {
    key: 'missions_admin',
    label: 'Misi Harian & 7-Hari',
    shortLabel: 'Misi Harian',
    group: 'Sosial & Komunitas',
    description: 'Kelola misi harian, target 7 hari, dan hadiah misi.',
  },
  {
    key: 'leaderboard_admin',
    label: 'Leaderboard & Badge Top 1–100',
    shortLabel: 'Leaderboard',
    group: 'Sosial & Komunitas',
    description: 'Atur kategori peringkat dan lencana Top 1–100.',
  },
  {
    key: 'verification',
    label: 'Verifikasi Centang Biru',
    shortLabel: 'Centang Biru',
    group: 'Nasabah & Sistem',
    description: 'Berikan atau cabut lencana verifikasi Centang Biru nasabah.',
  },
  {
    key: 'cards',
    label: 'Persetujuan Kartu Baru',
    shortLabel: 'Kartu Baru',
    group: 'Nasabah & Sistem',
    description: 'Setujui atau tolak pengajuan kartu perdana nasabah.',
  },
  {
    key: 'upgrades',
    label: 'Upgrade Kartu Nasabah',
    shortLabel: 'Upgrade Kartu',
    group: 'Nasabah & Sistem',
    description: 'Tinjau permohonan naik tier kartu ATM nasabah.',
  },
  {
    key: 'pinresets',
    label: 'Tinjauan Lupa PIN ATM',
    shortLabel: 'Lupa PIN',
    group: 'Nasabah & Sistem',
    description: 'Proses permohonan lupa PIN kartu ATM nasabah.',
  },
  {
    key: 'ban_cards',
    label: 'Studio Banned & Live Preview',
    shortLabel: 'Studio Banned',
    group: 'Utama & Keamanan',
    description: 'Kelola pemblokiran kartu, layar ban, dan banding nasabah.',
  },
  {
    key: 'help_center',
    label: 'Pusat Bantuan (FAQ & WA)',
    shortLabel: 'Pusat Bantuan',
    group: 'Nasabah & Sistem',
    description: 'Kelola FAQ bantuan dan kontak dukungan nasabah.',
  },
  {
    key: 'mintol_admin',
    label: 'Permintaan Mintol Nasabah',
    shortLabel: 'Mintol Nasabah',
    group: 'Nasabah & Sistem',
    description: 'Tanggapi permintaan tolong nasabah secara cepat.',
  },
  {
    key: 'bug_reports',
    label: 'Laporan Bug',
    shortLabel: 'Laporan Bug',
    group: 'Nasabah & Sistem',
    description: 'Tinjau laporan bug dari nasabah dan kirim hadiah bug.',
  },
  {
    key: 'suggestions',
    label: 'Saran & Hadiah',
    shortLabel: 'Saran',
    group: 'Nasabah & Sistem',
    description: 'Tinjau masukan & saran fitur dari nasabah.',
  },
  {
    key: 'features',
    label: 'Kontrol Fitur, PIN & Visibilitas',
    shortLabel: 'Kontrol Fitur',
    group: 'Nasabah & Sistem',
    description: 'Aktif/nonaktifkan fitur aplikasi, PIN Admin, dan visibilitas menu.',
  },
  {
    key: 'app_updates',
    label: 'Kelola Riwayat Update',
    shortLabel: 'Riwayat Update',
    group: 'Nasabah & Sistem',
    description: 'Publikasikan dan kelola catatan pembaruan sistem.',
  },
  {
    key: 'dev_roles',
    label: '10 Role Dev & Staff',
    shortLabel: 'Role Dev & Staff',
    group: 'Utama & Keamanan',
    description: 'Atur 10 jabatan Dev & Staff beserta hak akses cepat.',
  },
  {
    key: 'super_tools',
    label: 'Super Tools Admin',
    shortLabel: 'Super Tools',
    group: 'Utama & Keamanan',
    description: 'Alat super admin lanjutan, manajemen kantong impian & poin.',
  },
  {
    key: 'audit',
    label: 'Brankas & SOP 100x',
    shortLabel: 'Brankas & SOP',
    group: 'Utama & Keamanan',
    description: 'Log brankas sistem dan kontrol SOP operasional.',
  },
];

export const ALL_ADMIN_TAB_KEYS: AdminPortalTabKey[] = ADMIN_TAB_CATALOG.map((t) => t.key);

export interface AdminPermissionPreset {
  id: string;
  name: string;
  badgeText: string;
  description: string;
  defaultTitle: string;
  tabs: AdminPortalTabKey[] | 'ALL';
  allowPromotionTab?: boolean;
}

export const ADMIN_PERMISSION_PRESETS: AdminPermissionPreset[] = [
  {
    id: 'preset_finance',
    name: 'Admin Keuangan, Pinjaman & QRIS Diamond',
    badgeText: 'Keuangan & QRIS',
    description: 'Fokus tinjauan transaksi, QRIS Diamond, pinjaman, hutang, dan emas.',
    defaultTitle: 'Admin Keuangan & QRIS',
    tabs: ['finance', 'diamond_family_admin', 'loans', 'debt_admin', 'gold_transfer_admin', 'redeem'],
  },
  {
    id: 'preset_chat',
    name: 'Admin Chat & Moderasi Status 24 Jam',
    badgeText: 'Chat & Moderasi',
    description: 'Moderasi Chat Global, Chat Privat, Status 24 Jam, Peringatan, dan Surat.',
    defaultTitle: 'Admin Moderasi Chat',
    tabs: ['global_chat', 'warning_studio', 'gift_letters', 'ban_cards'],
  },
  {
    id: 'preset_analytics',
    name: 'Admin Pantau Analitik Pengunjung & Live Monitor',
    badgeText: 'Analitik & Monitor',
    description: 'Pantau trafik pengunjung real-time, perangkat, live monitor, dan audit.',
    defaultTitle: 'Admin Analitik & Keamanan',
    tabs: ['visitor_analytics', 'live_monitor', 'audit'],
  },
  {
    id: 'preset_cards_cs',
    name: 'Admin Kartu, Centang Biru & Bantuan Nasabah',
    badgeText: 'Kartu & CS',
    description: 'Persetujuan kartu baru, upgrade, lupa PIN, centang biru, bantuan, dan bug.',
    defaultTitle: 'Admin Layanan & Kartu',
    tabs: ['cards', 'upgrades', 'pinresets', 'verification', 'help_center', 'mintol_admin', 'bug_reports', 'suggestions'],
  },
  {
    id: 'preset_super',
    name: 'Super Admin Akses Penuh Semua Tab',
    badgeText: 'Super Admin',
    description: 'Membuka seluruh tab Panel Admin secara penuh.',
    defaultTitle: 'Super Admin Operasional',
    tabs: 'ALL',
    allowPromotionTab: true,
  },
];

export type AdminTierAccessLevel = 'full' | 'read_only';
export type AdminTierAssetMode =
  | 'unlimited_all'
  | 'keep_original'
  | 'custom_bonus'
  | 'daily_capped';
export type AdminTierPanelAccessMode = 'auto_open' | 'require_pin';
export type AdminTierDurationMode = 'permanent' | 'timed';
export type AdminTierTrustedDeviceMode =
  | 'unrestricted'
  | 'alert_new_device'
  | 'lock_trusted_device';

export interface AdminTierCustomBonusAssets {
  money: number;
  coins: number;
  diamonds: number;
  jobVouchers: number;
  goldGrams: number;
}

export interface AdminTierGrantRecord {
  accountId: string;
  accountNumber: string;
  accountName: string;
  accountEmail: string;
  previousCardTier: CardTier;
  allowedTabs: AdminPortalTabKey[] | 'ALL';
  accessLevel: AdminTierAccessLevel;
  canManageAdminTiers: boolean;
  assetMode: AdminTierAssetMode;
  customBonusAssets?: AdminTierCustomBonusAssets;
  dailyAssetCapRupiah?: number;
  panelAccessMode: AdminTierPanelAccessMode;
  customAdminPin?: string;
  durationMode: AdminTierDurationMode;
  expiresAtMs?: number | null;
  durationLabel?: string;
  customTitle: string;
  showCrownBadge: boolean;
  hideAdminStatus: boolean;
  isFrozen: boolean;
  frozenAtIso?: string;
  frozenReason?: string;
  trustedDeviceMode: AdminTierTrustedDeviceMode;
  trustedDeviceIds: string[];
  trustedDeviceAlertCount: number;
  lastDeviceAlertMessage?: string;
  lastDeviceAlertAtIso?: string;
  status: 'active' | 'frozen' | 'expired' | 'revoked';
  reason: string;
  grantedByName: string;
  grantedByEmail: string;
  grantedAtIso: string;
  grantedAtMs: number;
  updatedAtIso: string;
  updatedAtMs: number;
  officialLetterNonce: number;
}

export interface AdminTierAuditLogEntry {
  id: string;
  action:
    | 'promote'
    | 'update_permissions'
    | 'freeze'
    | 'unfreeze'
    | 'revoke'
    | 'auto_expire'
    | 'bulk_update'
    | 'device_alert'
    | 'admin_tab_activity';
  actorName: string;
  actorEmail: string;
  targetAccountId: string;
  targetAccountName: string;
  targetAccountNumber: string;
  allowedTabsSummary: string;
  accessLevel?: AdminTierAccessLevel;
  tabKey?: AdminPortalTabKey;
  detail: string;
  reason?: string;
  timestampIso: string;
  timestampMs: number;
}

export interface AdminTierOfficialLetterPayload {
  id: string;
  targetAccountId: string;
  targetAccountName: string;
  targetAccountNumber: string;
  customTitle: string;
  allowedTabLabels: string[];
  accessLevel: AdminTierAccessLevel;
  durationLabel: string;
  panelAccessMode: AdminTierPanelAccessMode;
  grantedByName: string;
  reason: string;
  timestampIso: string;
}

export const PRIMARY_OWNER_EMAIL = 'fahmiammarulazka@gmail.com';
export const SUPER_ADMIN_ACCOUNT_NUMBER = '1234567890';
export const SUPER_ADMIN_FULL_NAME = 'AzkaAKC';

/**
 * Checks whether an account is the Primary System Owner / Super Admin Utama
 * (AzkaAKC • No. Rek 1234567890) whose Admin privileges are permanently locked
 * and cannot be demoted or restricted.
 */
export function isPrimarySystemOwnerAccount(
  account?: Partial<BankAccount> | null,
  signedInEmail?: string | null
): boolean {
  if (!account) {
    return Boolean(
      signedInEmail &&
        String(signedInEmail).trim().toLowerCase() === PRIMARY_OWNER_EMAIL
    );
  }

  const normalizedAccNum = String(account.accountNumber || '').replace(/\s+/g, '');
  const normalizedName = String(account.fullName || '').trim().toLowerCase();

  if (normalizedAccNum === SUPER_ADMIN_ACCOUNT_NUMBER) return true;
  if (normalizedName === SUPER_ADMIN_FULL_NAME.toLowerCase()) return true;
  return false;
}

/**
 * Computes the effective list of allowed tabs for an account inside AdminPortal.
 */
export function resolveEffectiveAdminPermissions(params: {
  account: BankAccount | null;
  signedInEmail?: string | null;
  adminUnlocked: boolean;
  grant: AdminTierGrantRecord | null;
  currentDeviceId?: string | null;
}): {
  isSuperOwner: boolean;
  hasPanelAccess: boolean;
  canOpenWithoutPin: boolean;
  allowedTabs: AdminPortalTabKey[];
  accessLevel: AdminTierAccessLevel;
  canManageAdminTiers: boolean;
  isFrozen: boolean;
  isExpired: boolean;
  isDeviceLockedOut: boolean;
  deviceAlertMessage?: string;
  customTitle: string;
  showCrownBadge: boolean;
  hideAdminStatus: boolean;
} {
  const { account, signedInEmail, adminUnlocked, grant, currentDeviceId } = params;
  const isSuperOwner = isPrimarySystemOwnerAccount(account, signedInEmail);

  if (isSuperOwner) {
    return {
      isSuperOwner: true,
      hasPanelAccess: true,
      canOpenWithoutPin: true,
      allowedTabs: ALL_ADMIN_TAB_KEYS,
      accessLevel: 'full',
      canManageAdminTiers: true,
      isFrozen: false,
      isExpired: false,
      isDeviceLockedOut: false,
      customTitle: 'Super Admin Utama (AzkaAKC)',
      showCrownBadge: true,
      hideAdminStatus: false,
    };
  }

  // If there is an active or managed grant record for this account, enforce its granular RBAC
  if (grant && grant.status !== 'revoked') {
    const isExpired =
      grant.status === 'expired' ||
      (grant.durationMode === 'timed' &&
        typeof grant.expiresAtMs === 'number' &&
        grant.expiresAtMs > 0 &&
        Date.now() >= grant.expiresAtMs);

    const isFrozen = grant.isFrozen || grant.status === 'frozen';

    const isDeviceLockedOut =
      grant.trustedDeviceMode === 'lock_trusted_device' &&
      Array.isArray(grant.trustedDeviceIds) &&
      grant.trustedDeviceIds.length > 0 &&
      Boolean(currentDeviceId) &&
      !grant.trustedDeviceIds.includes(String(currentDeviceId));

    const baseTabs: AdminPortalTabKey[] =
      grant.allowedTabs === 'ALL'
        ? ALL_ADMIN_TAB_KEYS
        : Array.isArray(grant.allowedTabs)
        ? grant.allowedTabs.filter((t) => ALL_ADMIN_TAB_KEYS.includes(t))
        : [];

    // Unless explicitly delegated by Super Admin, hide `admin_tier_promotion`
    const filteredTabs = grant.canManageAdminTiers
      ? Array.from(new Set<AdminPortalTabKey>([...baseTabs, 'admin_tier_promotion']))
      : baseTabs.filter((t) => t !== 'admin_tier_promotion');

    return {
      isSuperOwner: false,
      hasPanelAccess: !isExpired && !isFrozen && !isDeviceLockedOut && filteredTabs.length > 0,
      canOpenWithoutPin:
        !isExpired &&
        !isFrozen &&
        !isDeviceLockedOut &&
        grant.panelAccessMode === 'auto_open' &&
        filteredTabs.length > 0,
      allowedTabs: filteredTabs,
      accessLevel: grant.accessLevel || 'full',
      canManageAdminTiers: Boolean(grant.canManageAdminTiers),
      isFrozen,
      isExpired,
      isDeviceLockedOut,
      deviceAlertMessage: isDeviceLockedOut
        ? `Akses Panel Admin dikunci hanya untuk perangkat terpercaya (${grant.trustedDeviceIds.join(', ')}). Perangkat saat ini: ${currentDeviceId}.`
        : grant.lastDeviceAlertMessage,
      customTitle: grant.customTitle || 'Admin Tier',
      showCrownBadge: grant.showCrownBadge !== false,
      hideAdminStatus: Boolean(grant.hideAdminStatus),
    };
  }

  // Fallback for direct Super Admin PIN unlock (no restricted grant record on account)
  if (adminUnlocked) {
    return {
      isSuperOwner: true,
      hasPanelAccess: true,
      canOpenWithoutPin: true,
      allowedTabs: ALL_ADMIN_TAB_KEYS,
      accessLevel: 'full',
      canManageAdminTiers: true,
      isFrozen: false,
      isExpired: false,
      isDeviceLockedOut: false,
      customTitle: 'Administrator Utama',
      showCrownBadge: true,
      hideAdminStatus: false,
    };
  }

  return {
    isSuperOwner: false,
    hasPanelAccess: false,
    canOpenWithoutPin: false,
    allowedTabs: [],
    accessLevel: 'read_only',
    canManageAdminTiers: false,
    isFrozen: false,
    isExpired: false,
    isDeviceLockedOut: false,
    customTitle: '',
    showCrownBadge: false,
    hideAdminStatus: false,
  };
}
