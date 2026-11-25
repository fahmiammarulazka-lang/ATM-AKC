/**
 * Bank Nusantara — Katalog Permata (250 Paket 1 s/d 11.099, Maks Rp 998.910),
 * Perhitungan Custom Dua Arah, Pengaturan Fitur Keluarga, dan Kontrol Visibilitas Tab.
 */
import {
  DiamondPackageItem,
  DiamondSystemConfig,
  FamilySystemConfig,
  UiVisibilityConfig,
  UiVisibilityNavKey,
} from '../types/bank';

export const MAX_DIAMOND_PACKAGE_AMOUNT = 11_099;
export const MAX_DIAMOND_PURCHASE_RUPIAH = 998_910; // Harga dasar sebelum angka unik 3 digit QRIS
export const DEFAULT_DIAMOND_PRICE_RUPIAH = 90; // 55% lebih murah dari Rp 200
export const DIAMOND_CONFIG_REVISION = 3; // Revisi batas ganda 11.099 & Rp 998.910

export const DEFAULT_DIAMOND_SYSTEM_CONFIG: DiamondSystemConfig = {
  baseDiamondPriceRupiah: DEFAULT_DIAMOND_PRICE_RUPIAH,
  diamondDiscountPercent: 0,
  priceRevision: DIAMOND_CONFIG_REVISION,
  allowCustomAmount: true,
  minCustomDiamond: 1,
  maxCustomDiamond: MAX_DIAMOND_PACKAGE_AMOUNT,
  maxPurchaseRupiah: MAX_DIAMOND_PURCHASE_RUPIAH,
  useUniqueCode3Digit: true,
  qrisExpiryMinutes: 10,
  enabledFeatures: {
    family_slots: true,
    job_voucher_upgrade: true,
    spin_gacha_auction: true,
    dashboard_vip_effects: true,
    diamond_transfer_exchange: true,
  },
  updatedAt: new Date().toISOString(),
};

export const DEFAULT_UI_VISIBILITY_CONFIG: UiVisibilityConfig = {
  navTabs: {
    debt: true,
    dashboard: true,
    family: true,
    transfer: true,
    emas: true,
    anggaran: true,
    redeem: true,
    jobs: true,
    spin_wheel: true,
    chat: true,
    atm: true,
    guide: true,
    updates: true,
  },
  showDiamondBalance: true,
  showDiamondTopUpButton: true,
  storeTabTopUp: true,
  storeTabUse: true,
  storeTabHistory: true,
  updatedAt: new Date().toISOString(),
};

export const UI_VISIBILITY_NAV_METADATA: Array<{
  key: UiVisibilityNavKey;
  label: string;
  description: string;
}> = [
  { key: 'debt', label: 'Tab Hutang (Kiri Logo)', description: 'Tombol kotak hutang di kiri atas Navbar.' },
  { key: 'dashboard', label: 'Mobile Banking', description: 'Halaman beranda rekening utama nasabah.' },
  { key: 'family', label: 'Keluarga', description: 'Workspace grup keluarga, anggota, dan slot keluarga.' },
  { key: 'transfer', label: 'Transfer', description: 'Transfer reguler antar rekening dan Transfer Bebas.' },
  { key: 'emas', label: 'Emas 24K', description: 'Tabungan dan jual-beli logam mulia emas 24K.' },
  { key: 'anggaran', label: 'Anggaran', description: 'Manajemen anggaran pengeluaran bulanan nasabah.' },
  { key: 'redeem', label: 'Kode Redeem', description: 'Penukaran kode hadiah dan voucher resmi.' },
  { key: 'jobs', label: 'Lowongan Kerja', description: 'Kerja klik harian, level karir, dan arena suit.' },
  { key: 'spin_wheel', label: 'Spin the Wheel', description: 'Roda keberuntungan koin dan hadiah jackpot.' },
  { key: 'chat', label: 'PayChat', description: 'Chat antar rekening dan kirim saldo lewat chat.' },
  { key: 'atm', label: 'Mesin ATM', description: 'Simulator mesin ATM fisik dan cetak struk.' },
  { key: 'guide', label: 'Panduan', description: 'Buku panduan informasi lengkap aplikasi.' },
  { key: 'updates', label: 'Update', description: 'Riwayat pembaruan dan catatan rilis aplikasi.' },
];

export const DEFAULT_FAMILY_SYSTEM_CONFIG: FamilySystemConfig = {
  enabled: true,
  defaultMaxFamilies: 1,
  baseSlotMoneyCost: 2_500_000,
  baseSlotDiamondCost: 100,
  maxMembersPerFamily: 25,
  allowCoLeaderRenameFamily: true,
  allowMemberChangeNameTag: true,
  updatedAt: new Date().toISOString(),
};

export const DIAMOND_FEATURE_METADATA: Array<{
  key: keyof DiamondSystemConfig['enabledFeatures'];
  label: string;
  description: string;
}> = [
  {
    key: 'family_slots',
    label: 'Tambah Slot Keluarga & Fitur Keluarga',
    description: 'Menggunakan Diamond bersama Saldo Uang untuk menambah slot pembuatan keluarga baru.',
  },
  {
    key: 'job_voucher_upgrade',
    label: 'Beli Voucher Level & Upgrade Pekerjaan',
    description: 'Menukar Diamond langsung menjadi peningkatan Level Pekerjaan atau Voucher Level instan.',
  },
  {
    key: 'spin_gacha_auction',
    label: 'Spin the Wheel, Gacha & Lelang Sultan',
    description: 'Mengaktifkan penggunaan Diamond untuk bonus putaran Spin, Gacha Universal, dan Lelang Sultan.',
  },
  {
    key: 'dashboard_vip_effects',
    label: 'Efek Dashboard, Tema VIP & Custom Kartu',
    description: 'Membuka akses penggunaan Diamond untuk efek visual dashboard dan kustomisasi kartu.',
  },
  {
    key: 'diamond_transfer_exchange',
    label: 'Transfer & Tukar Diamond ke Saldo / Coin',
    description: 'Mengizinkan nasabah menukar Diamond menjadi Saldo Uang atau Coin Spin secara langsung.',
  },
];

/**
 * Menghasilkan tepat 250 pilihan paket unik dan menaik halus
 * mulai dari 1 hingga tepat 11.099.
 */
function build250DiamondPackages(): DiamondPackageItem[] {
  const starter = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    12, 15, 18, 20, 25, 30, 35, 40, 45, 50,
    55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
    110, 120, 130, 140, 150, 160, 175, 190, 200,
    225, 250, 275, 300,
  ];

  const set = new Set<number>(starter);
  const remainingSlots = 250 - set.size; // 207 slots between 301 and 11099

  const minVal = 310;
  const maxVal = MAX_DIAMOND_PACKAGE_AMOUNT;
  const ratio = maxVal / minVal;

  for (let i = 0; i < remainingSlots; i++) {
    const t = i / (remainingSlots - 1);
    let val = Math.round(minVal * Math.pow(ratio, t));
    if (i === remainingSlots - 1) {
      val = MAX_DIAMOND_PACKAGE_AMOUNT;
    } else if (val > 5_000) {
      val = Math.round(val / 25) * 25;
    } else if (val > 1_000) {
      val = Math.round(val / 10) * 10;
    } else {
      val = Math.round(val / 5) * 5;
    }
    val = Math.min(MAX_DIAMOND_PACKAGE_AMOUNT, Math.max(305, val));
    while (set.has(val) && val < MAX_DIAMOND_PACKAGE_AMOUNT) {
      val += 1;
    }
    while (set.has(val) && val > 1) {
      val -= 1;
    }
    set.add(val);
  }

  set.add(1);
  set.add(MAX_DIAMOND_PACKAGE_AMOUNT);
  const sorted = Array.from(set).sort((a, b) => a - b);
  while (sorted.length > 250) {
    sorted.splice(Math.floor(sorted.length / 2), 1);
  }
  while (sorted.length < 250) {
    let candidate = 301;
    while (set.has(candidate) && candidate < MAX_DIAMOND_PACKAGE_AMOUNT) {
      candidate += 1;
    }
    set.add(candidate);
    sorted.push(candidate);
    sorted.sort((a, b) => a - b);
  }

  return sorted.map((diamonds, idx) => {
    let tierLabel: DiamondPackageItem['tierLabel'] = 'Hemat';
    if (diamonds >= 5_001) tierLabel = 'Max Sultan';
    else if (diamonds >= 1_001) tierLabel = 'Sultan';
    else if (diamonds >= 101) tierLabel = 'Populer';

    return {
      id: idx + 1,
      diamonds,
      tierLabel,
      isPopular: [100, 500, 1000, 2500, 5000, 10000, MAX_DIAMOND_PACKAGE_AMOUNT].includes(diamonds),
    };
  });
}

export const DIAMOND_PACKAGES_250: DiamondPackageItem[] = build250DiamondPackages();

/**
 * Mengembalikan batas efektif ganda yang selalu mengunci:
 * - Jumlah maksimal <= min(11.099, config.maxCustomDiamond)
 * - Harga dasar maksimal <= min(Rp 998.910, config.maxPurchaseRupiah)
 */
export function getEffectiveDiamondPurchaseLimits(config: DiamondSystemConfig): {
  baseUnitPrice: number;
  discountPercent: number;
  effectiveUnitPrice: number;
  minRupiah: number;
  maxDiamonds: number;
  maxBaseRupiah: number;
  configuredMaxDiamonds: number;
  configuredMaxRupiah: number;
} {
  const baseUnitPrice = Math.max(
    1,
    Math.round(Number(config.baseDiamondPriceRupiah) || DEFAULT_DIAMOND_PRICE_RUPIAH)
  );
  const discountPercent = Math.min(99, Math.max(0, Math.round(Number(config.diamondDiscountPercent) || 0)));
  const effectiveUnitPrice = Math.max(0.01, baseUnitPrice * (1 - discountPercent / 100));

  const configuredMaxDiamonds = Math.min(
    MAX_DIAMOND_PACKAGE_AMOUNT,
    Math.max(1, Math.round(Number(config.maxCustomDiamond) || MAX_DIAMOND_PACKAGE_AMOUNT))
  );
  const configuredMaxRupiah = Math.min(
    MAX_DIAMOND_PURCHASE_RUPIAH,
    Math.max(1, Math.round(Number(config.maxPurchaseRupiah) || MAX_DIAMOND_PURCHASE_RUPIAH))
  );

  // Cari jumlah maksimal agar harga dasarnya tidak melebihi configuredMaxRupiah
  let maxByRupiah = Math.floor(configuredMaxRupiah / effectiveUnitPrice);
  while (
    maxByRupiah > 1 &&
    Math.max(1, Math.round(maxByRupiah * baseUnitPrice * (1 - discountPercent / 100))) > configuredMaxRupiah
  ) {
    maxByRupiah -= 1;
  }

  const maxDiamonds = Math.max(1, Math.min(configuredMaxDiamonds, Math.max(1, maxByRupiah)));
  const exactPriceForMax = Math.max(
    1,
    Math.round(maxDiamonds * baseUnitPrice * (1 - discountPercent / 100))
  );
  const maxBaseRupiah = Math.min(configuredMaxRupiah, exactPriceForMax);
  const minRupiah = Math.max(1, Math.round(baseUnitPrice * (1 - discountPercent / 100)));

  return {
    baseUnitPrice,
    discountPercent,
    effectiveUnitPrice,
    minRupiah,
    maxDiamonds,
    maxBaseRupiah,
    configuredMaxDiamonds,
    configuredMaxRupiah,
  };
}

export function calculateDiamondPurchasePrice(
  diamonds: number,
  config: DiamondSystemConfig
): {
  diamonds: number;
  unitPrice: number;
  originalPrice: number;
  discountPercent: number;
  discountSaved: number;
  finalPrice: number;
  wasClampedToMax: boolean;
} {
  const limits = getEffectiveDiamondPurchaseLimits(config);
  const rawQty = Math.max(1, Math.floor(Number(diamonds) || 1));
  const qty = Math.min(limits.maxDiamonds, rawQty);
  const wasClampedToMax = rawQty > limits.maxDiamonds;

  const originalPrice = qty * limits.baseUnitPrice;
  const computedFinal = Math.max(1, Math.round(originalPrice * (1 - limits.discountPercent / 100)));
  const finalPrice = Math.min(limits.configuredMaxRupiah, computedFinal);
  const discountSaved = Math.max(0, originalPrice - finalPrice);

  return {
    diamonds: qty,
    unitPrice: limits.baseUnitPrice,
    originalPrice,
    discountPercent: limits.discountPercent,
    discountSaved,
    finalPrice,
    wasClampedToMax,
  };
}

/**
 * Menghitung jumlah permata dari budget Rupiah custom:
 * - Diskon aktif membuat jumlah permata bertambah dari budget yang diketik.
 * - Dibulatkan ke bawah (floor) agar total bayar QRIS tidak pernah melebihi budget ketikan.
 * - Otomatis terkunci pada batas ganda (maks 11.099 & maks Rp 998.910).
 */
export function calculateDiamondsFromRupiahBudget(
  budgetRupiah: number,
  config: DiamondSystemConfig
): {
  inputBudget: number;
  clampedBudget: number;
  diamonds: number;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  discountSaved: number;
  remainingChange: number;
  wasClampedToMax: boolean;
  isBelowMin: boolean;
  minRupiah: number;
} {
  const limits = getEffectiveDiamondPurchaseLimits(config);
  const cleanBudget = Math.max(0, Math.floor(Number(budgetRupiah) || 0));

  if (cleanBudget < limits.minRupiah) {
    return {
      inputBudget: cleanBudget,
      clampedBudget: cleanBudget,
      diamonds: 0,
      originalPrice: 0,
      finalPrice: 0,
      discountPercent: limits.discountPercent,
      discountSaved: 0,
      remainingChange: cleanBudget,
      wasClampedToMax: false,
      isBelowMin: true,
      minRupiah: limits.minRupiah,
    };
  }

  const wasClampedByRupiah = cleanBudget > limits.maxBaseRupiah;
  const effectiveBudget = Math.min(cleanBudget, limits.maxBaseRupiah);

  let rawDiamonds = Math.floor(effectiveBudget / limits.effectiveUnitPrice);
  const wasClampedByQty = rawDiamonds > limits.maxDiamonds;
  let qty = Math.max(1, Math.min(limits.maxDiamonds, rawDiamonds));

  // Pastikan harga akhir tidak melebihi effectiveBudget (pembulatan ke bawah yang ketat)
  while (
    qty > 1 &&
    Math.max(1, Math.round(qty * limits.baseUnitPrice * (1 - limits.discountPercent / 100))) > effectiveBudget
  ) {
    qty -= 1;
  }

  const pricing = calculateDiamondPurchasePrice(qty, config);
  const remainingChange = Math.max(0, effectiveBudget - pricing.finalPrice);

  return {
    inputBudget: cleanBudget,
    clampedBudget: effectiveBudget,
    diamonds: pricing.diamonds,
    originalPrice: pricing.originalPrice,
    finalPrice: pricing.finalPrice,
    discountPercent: pricing.discountPercent,
    discountSaved: pricing.discountSaved,
    remainingChange,
    wasClampedToMax: wasClampedByRupiah || wasClampedByQty,
    isBelowMin: false,
    minRupiah: limits.minRupiah,
  };
}

/**
 * Menghitung biaya tambah slot keluarga ke-N (linear bertingkat).
 */
export function calculateNextFamilySlotCost(
  currentExtraSlots: number,
  config: FamilySystemConfig = DEFAULT_FAMILY_SYSTEM_CONFIG
): {
  nextSlotNumber: number;
  multiplier: number;
  moneyCost: number;
  diamondCost: number;
} {
  const safeExtra = Math.max(0, Math.floor(currentExtraSlots || 0));
  const multiplier = safeExtra + 1;
  const baseMoney = Math.max(0, Math.round(config.baseSlotMoneyCost || 2_500_000));
  const baseDiamond = Math.max(0, Math.round(config.baseSlotDiamondCost || 100));

  return {
    nextSlotNumber: (config.defaultMaxFamilies || 1) + multiplier,
    multiplier,
    moneyCost: baseMoney * multiplier,
    diamondCost: baseDiamond * multiplier,
  };
}

export function formatFamilyCode4x3(raw: string): string {
  const cleaned = String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12);
  const parts: string[] = [];
  for (let i = 0; i < cleaned.length; i += 4) {
    parts.push(cleaned.slice(i, i + 4));
  }
  return parts.join(' ');
}

export function generateRandomFamilyCode4x3(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let raw = '';
  for (let i = 0; i < 12; i++) {
    raw += chars[Math.floor(Math.random() * chars.length)];
  }
  return formatFamilyCode4x3(raw);
}
