/**
 * Bank Nusantara — Katalog Resmi Spin the Wheel (Rp 100.000 s/d Rp 20.000.000)
 * & 300 Pilihan Pembelian Koin Spin (Mulai dari 1 Koin s/d 10.000.000 Koin)
 * dengan Format Harga Bulat "Rp xxx.xxx".
 */

import { SpinPrizeSegment, CoinPackageOption, SpinWheelAdminConfig } from '../types/bank';

export const INITIAL_SPIN_WHEEL_CONFIG: SpinWheelAdminConfig = {
  baseCoinPriceRupiah: 10_000, // 1 Koin = Rp 10.000
  coinPurchaseDiscountPercent: 0, // Bisa diatur 0% - 99% di Panel Admin
  spinCostCoinsPer1x: 100, // 1x Spin = 100 Koin (= Rp 1.000.000)
  spinDiscountPercent: 0, // Diskon semua spin di Panel Admin
  bundleExtraDiscountPercent: {
    1: 0,
    3: 0,
    5: 0,
    7: 0,
    10: 0,
  },
  luckMultiplier: 1, // 1x Normal (Bisa dinaikkan di Panel Admin)
  forceJackpotMode: 'none',
  customSegmentWeights: {},
};

export const SPIN_WHEEL_PRIZES: SpinPrizeSegment[] = [
  {
    id: 'spin_100k',
    label: 'Rp 100.000',
    shortLabel: '100 Rb',
    amount: 100_000,
    baseProbabilityPercent: 48.0,
    probabilityDisplay: '48%',
    color: '#0f172a',
    textColor: '#38bdf8',
    tier: 'common',
  },
  {
    id: 'spin_500k',
    label: 'Rp 500.000',
    shortLabel: '500 Rb',
    amount: 500_000,
    baseProbabilityPercent: 28.0,
    probabilityDisplay: '28%',
    color: '#1e293b',
    textColor: '#34d399',
    tier: 'common',
  },
  {
    id: 'spin_750k',
    label: 'Rp 750.000',
    shortLabel: '750 Rb',
    amount: 750_000,
    baseProbabilityPercent: 20.0,
    probabilityDisplay: '20%',
    color: '#0f766e',
    textColor: '#ffffff',
    tier: 'common',
  },
  {
    id: 'spin_1m',
    label: 'Rp 1.000.000',
    shortLabel: '1 Juta',
    amount: 1_000_000,
    baseProbabilityPercent: 1.0,
    probabilityDisplay: '1%',
    color: '#1d4ed8',
    textColor: '#fde047',
    tier: 'rare',
  },
  {
    id: 'spin_1_5m',
    label: 'Rp 1.500.000',
    shortLabel: '1,5 Juta',
    amount: 1_500_000,
    baseProbabilityPercent: 0.75,
    probabilityDisplay: '0,75%',
    color: '#312e81',
    textColor: '#a5b4fc',
    tier: 'rare',
  },
  {
    id: 'spin_2m',
    label: 'Rp 2.000.000',
    shortLabel: '2 Juta',
    amount: 2_000_000,
    baseProbabilityPercent: 0.55,
    probabilityDisplay: '0,55%',
    color: '#4338ca',
    textColor: '#ffffff',
    tier: 'rare',
  },
  {
    id: 'spin_2_5m',
    label: 'Rp 2.500.000',
    shortLabel: '2,5 Juta',
    amount: 2_500_000,
    baseProbabilityPercent: 0.42,
    probabilityDisplay: '0,42%',
    color: '#0369a1',
    textColor: '#e0f2fe',
    tier: 'rare',
  },
  {
    id: 'spin_3m',
    label: 'Rp 3.000.000',
    shortLabel: '3 Juta',
    amount: 3_000_000,
    baseProbabilityPercent: 0.32,
    probabilityDisplay: '0,32%',
    color: '#6d28d9',
    textColor: '#fde047',
    tier: 'epic',
  },
  {
    id: 'spin_3_5m',
    label: 'Rp 3.500.000',
    shortLabel: '3,5 Juta',
    amount: 3_500_000,
    baseProbabilityPercent: 0.24,
    probabilityDisplay: '0,24%',
    color: '#4c1d95',
    textColor: '#ddd6fe',
    tier: 'epic',
  },
  {
    id: 'spin_4m',
    label: 'Rp 4.000.000',
    shortLabel: '4 Juta',
    amount: 4_000_000,
    baseProbabilityPercent: 0.18,
    probabilityDisplay: '0,18%',
    color: '#7e22ce',
    textColor: '#ffffff',
    tier: 'epic',
  },
  {
    id: 'spin_4_5m',
    label: 'Rp 4.500.000',
    shortLabel: '4,5 Juta',
    amount: 4_500_000,
    baseProbabilityPercent: 0.14,
    probabilityDisplay: '0,14%',
    color: '#86198f',
    textColor: '#f5d0fe',
    tier: 'epic',
  },
  {
    id: 'spin_5m',
    label: 'Rp 5.000.000',
    shortLabel: '5 Juta',
    amount: 5_000_000,
    baseProbabilityPercent: 0.11,
    probabilityDisplay: '0,11%',
    color: '#9d174d',
    textColor: '#fde047',
    tier: 'epic',
  },
  {
    id: 'spin_5_5m',
    label: 'Rp 5.500.000',
    shortLabel: '5,5 Juta',
    amount: 5_500_000,
    baseProbabilityPercent: 0.08,
    probabilityDisplay: '0,08%',
    color: '#be185d',
    textColor: '#ffffff',
    tier: 'legendary',
  },
  {
    id: 'spin_6m',
    label: 'Rp 6.000.000',
    shortLabel: '6 Juta',
    amount: 6_000_000,
    baseProbabilityPercent: 0.06,
    probabilityDisplay: '0,06%',
    color: '#b45309',
    textColor: '#fef3c7',
    tier: 'legendary',
  },
  {
    id: 'spin_6_5m',
    label: 'Rp 6.500.000',
    shortLabel: '6,5 Juta',
    amount: 6_500_000,
    baseProbabilityPercent: 0.045,
    probabilityDisplay: '0,045%',
    color: '#92400e',
    textColor: '#fde68a',
    tier: 'legendary',
  },
  {
    id: 'spin_7m',
    label: 'Rp 7.000.000',
    shortLabel: '7 Juta',
    amount: 7_000_000,
    baseProbabilityPercent: 0.035,
    probabilityDisplay: '0,035%',
    color: '#c2410c',
    textColor: '#ffffff',
    tier: 'legendary',
  },
  {
    id: 'spin_7_5m',
    label: 'Rp 7.500.000',
    shortLabel: '7,5 Juta',
    amount: 7_500_000,
    baseProbabilityPercent: 0.02,
    probabilityDisplay: '0,02%',
    color: '#b91c1c',
    textColor: '#fde047',
    tier: 'legendary',
  },
  {
    id: 'spin_10m',
    label: 'Rp 10.000.000',
    shortLabel: '10 Juta',
    amount: 10_000_000,
    baseProbabilityPercent: 0.01,
    probabilityDisplay: '0,01%',
    color: '#991b1b',
    textColor: '#fde047',
    tier: 'legendary',
  },
  {
    id: 'spin_15m',
    label: 'Rp 15.000.000',
    shortLabel: '15 Juta',
    amount: 15_000_000,
    baseProbabilityPercent: 0.000000000001,
    probabilityDisplay: '0,000000000001% (1 dari 1.000 Kuadriliun)',
    color: '#d97706',
    textColor: '#020617',
    tier: 'mythic',
  },
  {
    id: 'spin_20m',
    label: 'Rp 20.000.000',
    shortLabel: '20 Juta',
    amount: 20_000_000,
    baseProbabilityPercent: 0.000000000001,
    probabilityDisplay: '0,000000000001% (1 dari 1.000 Kuadriliun)',
    color: '#facc15',
    textColor: '#020617',
    tier: 'mythic',
  },
];

/**
 * 300 Pilihan Pembelian Koin Spin (#1 s/d #300):
 * Mulai dari 1 Koin hingga 10.000.000 Koin (10 Juta Koin)!
 */
const TIER_1_SATUAN_60: number[] = [
  // #1 - #60: 1 Koin s/d 99 Koin (60 Pilihan Satuan & Eceran)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
  31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
  42, 44, 45, 48, 50, 52, 55, 58, 60, 62,
  65, 68, 70, 72, 75, 80, 85, 90, 95, 99,
];

const TIER_2_PAKET_SPIN_80: number[] = [
  // #61 - #140: 100 Koin (1x Spin) s/d 10.000 Koin (80 Pilihan Paket Spin Populer)
  100, 110, 120, 130, 140, 150, 160, 175, 190, 200,
  220, 240, 250, 275, 300, 325, 350, 375, 400, 425,
  450, 475, 500, 550, 600, 650, 700, 750, 800, 850,
  900, 950, 1_000, 1_100, 1_200, 1_300, 1_400, 1_500, 1_600, 1_750,
  1_900, 2_000, 2_150, 2_300, 2_500, 2_700, 2_900, 3_000, 3_200, 3_400,
  3_500, 3_750, 4_000, 4_250, 4_500, 4_750, 5_000, 5_250, 5_500, 5_750,
  6_000, 6_250, 6_500, 6_750, 7_000, 7_250, 7_500, 7_750, 8_000, 8_250,
  8_500, 8_750, 9_000, 9_200, 9_400, 9_500, 9_600, 9_800, 9_900, 10_000,
];

const TIER_3_SULTAN_80: number[] = [
  // #141 - #220: 10.500 Koin s/d 500.000 Koin (80 Pilihan Paket Sultan)
  10_500, 11_000, 11_500, 12_000, 12_500, 13_000, 14_000, 15_000, 16_000, 17_500,
  19_000, 20_000, 22_000, 24_000, 25_000, 27_500, 30_000, 32_500, 35_000, 37_500,
  40_000, 42_500, 45_000, 47_500, 50_000, 52_500, 55_000, 57_500, 60_000, 62_500,
  65_000, 67_500, 70_000, 72_500, 75_000, 77_500, 80_000, 82_500, 85_000, 90_000,
  95_000, 100_000, 105_000, 110_000, 115_000, 120_000, 125_000, 130_000, 140_000, 150_000,
  160_000, 170_000, 175_000, 185_000, 200_000, 210_000, 225_000, 240_000, 250_000, 260_000,
  275_000, 290_000, 300_000, 310_000, 325_000, 340_000, 350_000, 365_000, 375_000, 390_000,
  400_000, 415_000, 425_000, 440_000, 450_000, 460_000, 475_000, 485_000, 495_000, 500_000,
];

const TIER_4_MEGA_10JUTA_80: number[] = [
  // #221 - #300: 520.000 Koin s/d 10.000.000 Koin (80 Pilihan Paket Mega 1 Juta - 10 Juta Koin)
  520_000, 540_000, 550_000, 575_000, 600_000, 625_000, 650_000, 675_000, 700_000, 725_000,
  750_000, 775_000, 800_000, 825_000, 850_000, 875_000, 900_000, 925_000, 950_000, 975_000,
  1_000_000, 1_050_000, 1_100_000, 1_150_000, 1_200_000, 1_250_000, 1_300_000, 1_400_000, 1_500_000, 1_600_000,
  1_700_000, 1_750_000, 1_850_000, 2_000_000, 2_100_000, 2_250_000, 2_400_000, 2_500_000, 2_600_000, 2_750_000,
  2_900_000, 3_000_000, 3_150_000, 3_250_000, 3_400_000, 3_500_000, 3_750_000, 4_000_000, 4_250_000, 4_500_000,
  4_750_000, 5_000_000, 5_200_000, 5_400_000, 5_500_000, 5_750_000, 6_000_000, 6_250_000, 6_500_000, 6_750_000,
  7_000_000, 7_250_000, 7_500_000, 7_750_000, 8_000_000, 8_200_000, 8_400_000, 8_500_000, 8_750_000, 9_000_000,
  9_100_000, 9_200_000, 9_300_000, 9_400_000, 9_500_000, 9_600_000, 9_750_000, 9_850_000, 9_950_000, 10_000_000,
];

const RAW_300_COIN_AMOUNTS: number[] = [
  ...TIER_1_SATUAN_60,
  ...TIER_2_PAKET_SPIN_80,
  ...TIER_3_SULTAN_80,
  ...TIER_4_MEGA_10JUTA_80,
];

export const COIN_PURCHASE_SAVINGS_VS_CASH_PERCENT = 0.5;

const computeDeterministicReceh3Digit = (id: number, coins: number): number => {
  // Menghasilkan angka receh unik deterministik antara 001 sampai 999
  const raw = (id * 137 + coins * 19 + 211) % 999;
  return raw + 1;
};

export const COIN_PURCHASE_PACKAGES_300: CoinPackageOption[] = RAW_300_COIN_AMOUNTS.map(
  (coins, index) => {
    const id = index + 1;

    let badge: string | undefined;
    if (coins === 1) badge = 'MULAI DARI 1 KOIN';
    else if (coins === 100) badge = 'PAS UNTUK 1x SPIN';
    else if (coins === 300) badge = 'PAS UNTUK 3x SPIN';
    else if (coins === 500) badge = 'PAS UNTUK 5x SPIN';
    else if (coins === 700) badge = 'PAS UNTUK 7x SPIN';
    else if (coins === 1_000) badge = 'PAS UNTUK 10x SPIN';
    else if (coins === 100_000) badge = 'PAKET 100.000 KOIN';
    else if (coins === 1_000_000) badge = 'PAKET 1.000.000 KOIN';
    else if (coins === 5_000_000) badge = 'PAKET 5.000.000 KOIN';
    else if (coins === 10_000_000) badge = 'MAKSIMAL 10.000.000 KOIN';

    const category: CoinPackageOption['category'] =
      id <= 60
        ? 'satuan'
        : id <= 140
        ? 'paket_spin'
        : id <= 220
        ? 'sultan_100k'
        : 'mega_1juta';

    const extraRecehanRupiah = computeDeterministicReceh3Digit(id, coins);

    return {
      id,
      coins,
      label: `${coins.toLocaleString('id-ID')} Koin`,
      recehanDecimal: 0,
      extraRecehanRupiah,
      badge,
      category,
    };
  }
);

// Backward-compatible export alias used by existing components
export const COIN_PURCHASE_PACKAGES_100: CoinPackageOption[] = COIN_PURCHASE_PACKAGES_300;

/**
 * Menghitung harga paket koin dalam format "Rp xxx.XXX":
 * - Pembelian koin otomatis 0,50% lebih murah dibanding Spin melalui uang langsung.
 * - Menyematkan receh unik 3 digit terakhir (001-999) tanpa koma desimal.
 * - Tetap memotong diskon tambahan dari Panel Admin.
 */
export function calculateCoinPackagePrice(
  pkg: CoinPackageOption,
  config: SpinWheelAdminConfig
): {
  normalPrice: number;
  cashEquivalentPrice: number;
  finalPrice: number;
  discountPercent: number;
  totalSavingsVsCashPercent: number;
  savingsRupiahVsCash: number;
  recehDigits: number;
} {
  const baseUnit = config.baseCoinPriceRupiah ?? 10_000;
  const standardNormalPrice = Math.round(pkg.coins * 10_000);
  const cashEquivalentPrice = Math.max(1, Math.round(pkg.coins * baseUnit));

  // Potongan wajib 0,50% lebih murah dari harga Spin melalui uang langsung
  const halfPercentDiscounted = cashEquivalentPrice * (1 - COIN_PURCHASE_SAVINGS_VS_CASH_PERCENT / 100);

  const adminDiscountPct = Math.max(0, Math.min(99, config.coinPurchaseDiscountPercent || 0));
  const afterAdminDiscount =
    adminDiscountPct > 0
      ? halfPercentDiscounted * (1 - adminDiscountPct / 100)
      : halfPercentDiscounted;

  const rawTarget = Math.max(1, Math.round(afterAdminDiscount));
  const receh3 =
    pkg.extraRecehanRupiah >= 1 && pkg.extraRecehanRupiah <= 999
      ? pkg.extraRecehanRupiah
      : computeDeterministicReceh3Digit(pkg.id, pkg.coins);

  let finalPrice = rawTarget;

  if (rawTarget >= 500_000) {
    // Paket besar (>= Rp 500.000): ganti 3 digit terakhir persis ke receh unik 001..999
    // di blok ribuan terdekat yang tetap menjaga hemat ~0,50% & di bawah tarif Spin Uang
    const thousandsBase = Math.floor(rawTarget / 1000) * 1000;
    const candLow = Math.max(1, thousandsBase - 1000 + receh3);
    const candSame = thousandsBase + receh3;

    const validSame = cashEquivalentPrice > 1 ? candSame < cashEquivalentPrice : true;
    if (validSame && Math.abs(candSame - rawTarget) <= Math.abs(candLow - rawTarget)) {
      finalPrice = candSame;
    } else {
      finalPrice = candLow;
    }
  } else if (rawTarget >= 2_000) {
    // Paket kecil/menengah (misal 1 Koin Rp 9.95x): sisipkan variasi receh kecil
    // agar 3 digit akhir tetap unik (001..999, tidak pernah 000) & tetap di kisaran -0,50%
    const maxShift = Math.max(2, Math.min(45, Math.floor(rawTarget * 0.004)));
    const signedOffset = ((receh3 % (maxShift * 2 + 1)) - maxShift) || 3;
    let candidate = Math.max(1, rawTarget + signedOffset);
    if (candidate % 1000 === 0) {
      candidate = candidate > 10 ? candidate - 3 : candidate + 3;
    }
    if (cashEquivalentPrice > 1 && candidate >= cashEquivalentPrice) {
      candidate = Math.max(1, cashEquivalentPrice - (1 + (receh3 % 9)));
    }
    if (candidate % 1000 === 0 && candidate > 1) {
      candidate -= 1;
    }
    finalPrice = candidate;
  } else {
    finalPrice = Math.max(1, rawTarget);
  }

  const savingsRupiahVsCash = Math.max(0, cashEquivalentPrice - finalPrice);
  const totalSavingsVsCashPercent =
    cashEquivalentPrice > 0
      ? Number(((savingsRupiahVsCash / cashEquivalentPrice) * 100).toFixed(2))
      : 0;

  return {
    normalPrice: standardNormalPrice,
    cashEquivalentPrice,
    finalPrice,
    discountPercent: adminDiscountPct,
    totalSavingsVsCashPercent,
    savingsRupiahVsCash,
    recehDigits: finalPrice % 1000,
  };
}

/**
 * Memisahkan nominal Rupiah menjadi bagian utama dan 3 digit receh akhir ("Rp xxx." + "XXX")
 * untuk penyorotan visual sesuai format Rp xxx.XXX.
 */
export function splitRupiahRecehParts(amount: number): {
  prefix: string;
  mainPart: string;
  recehPart: string;
  fullText: string;
} {
  if (!Number.isFinite(amount) || amount >= 900_000_000_000_000) {
    return {
      prefix: '',
      mainPart: '∞',
      recehPart: '',
      fullText: '∞',
    };
  }
  const rounded = Math.round(amount);
  const formattedNumbers = rounded.toLocaleString('id-ID');
  const lastDotIdx = formattedNumbers.lastIndexOf('.');
  if (lastDotIdx === -1) {
    return {
      prefix: 'Rp ',
      mainPart: '',
      recehPart: formattedNumbers,
      fullText: `Rp ${formattedNumbers}`,
    };
  }
  return {
    prefix: 'Rp ',
    mainPart: formattedNumbers.slice(0, lastDotIdx + 1),
    recehPart: formattedNumbers.slice(lastDotIdx + 1),
    fullText: `Rp ${formattedNumbers}`,
  };
}

/**
 * Format angka Rupiah sesuai permintaan user: "Rp xxx.XXX" (bulat dengan pemisah titik ribuan tanpa koma).
 */
export function formatRupiahWithDecimals(amount: number): string {
  if (!Number.isFinite(amount) || amount >= 900_000_000_000_000) return '∞';
  const rounded = Math.round(amount);
  return `Rp ${rounded.toLocaleString('id-ID')}`;
}

/**
 * Menghitung biaya koin & setara Rupiah untuk 1x, 3x, 5x, 7x, 10x Spin
 */
export function calculateSpinCost(
  spinCount: 1 | 3 | 5 | 7 | 10,
  config: SpinWheelAdminConfig
): {
  normalCoins: number;
  finalCoins: number;
  normalRupiahEquivalent: number;
  finalRupiahEquivalent: number;
  totalDiscountPercent: number;
} {
  const baseCoinsPerSpin = config.spinCostCoinsPer1x ?? 100;
  const normalCoins = spinCount * 100;
  const rawCoins = spinCount * baseCoinsPerSpin;

  const globalDisc = Math.max(0, Math.min(100, config.spinDiscountPercent || 0));
  const bundleDisc = Math.max(
    0,
    Math.min(100, config.bundleExtraDiscountPercent?.[spinCount] || 0)
  );
  const combinedDiscountPercent = Math.min(100, globalDisc + bundleDisc);

  const finalCoins = Math.max(
    0,
    Math.round(rawCoins * (1 - combinedDiscountPercent / 100))
  );

  const unitRupiah = config.baseCoinPriceRupiah ?? 10_000;

  return {
    normalCoins,
    finalCoins,
    normalRupiahEquivalent: Math.round(normalCoins * 10_000),
    finalRupiahEquivalent: Math.round(finalCoins * unitRupiah),
    totalDiscountPercent: combinedDiscountPercent,
  };
}

/**
 * Menghitung tarif Spin Pakai Uang Rekening Langsung (1x, 3x, 5x, 7x, 10x).
 * Tarif Spin Uang menggunakan tarif penuh (tanpa potongan 0,50% pembelian koin),
 * namun tetap menghormati diskon Spin dari Panel Admin.
 */
export function calculateCashSpinCost(
  spinCount: 1 | 3 | 5 | 7 | 10,
  config: SpinWheelAdminConfig
): {
  normalRupiah: number;
  finalRupiah: number;
  coinModeEstimatedRupiah: number;
  coinSavingsRupiah: number;
  totalDiscountPercent: number;
} {
  const coinCost = calculateSpinCost(spinCount, config);
  const normalRupiah = coinCost.normalRupiahEquivalent;
  const finalRupiah = coinCost.finalRupiahEquivalent;
  const coinModeEstimatedRupiah = Math.max(
    0,
    Math.round(finalRupiah * (1 - COIN_PURCHASE_SAVINGS_VS_CASH_PERCENT / 100))
  );
  const coinSavingsRupiah = Math.max(0, finalRupiah - coinModeEstimatedRupiah);

  return {
    normalRupiah,
    finalRupiah,
    coinModeEstimatedRupiah,
    coinSavingsRupiah,
    totalDiscountPercent: coinCost.totalDiscountPercent,
  };
}
