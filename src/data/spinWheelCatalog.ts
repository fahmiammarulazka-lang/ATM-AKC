/**
 * Bank Nusantara — Katalog Resmi Spin the Wheel (Rp 100.000 s/d Rp 20.000.000)
 * & 100 Pilihan Pembelian Koin Spin (Mulai dari 1 Koin, 100.000 Koin, hingga 1.000.000 Koin)
 *
 * Ketentuan User:
 * 1. Hadiah Spin the Wheel (20 Segmen):
 *    - Rp 100.000, Rp 500.000, Rp 750.000, Rp 1.000.000 (Kemungkinan 1 Juta = 1%, lalu semakin mengecil)
 *    - Setelah Rp 1.000.000 naik per Rp 500.000 sampai Rp 7.000.000:
 *      Rp 1.500.000, Rp 2.000.000, Rp 2.500.000, Rp 3.000.000, Rp 3.500.000,
 *      Rp 4.000.000, Rp 4.500.000, Rp 5.000.000, Rp 5.500.000, Rp 6.000.000,
 *      Rp 6.500.000, Rp 7.000.000
 *    - Setelah Rp 7.000.000 yaitu Rp 7.500.000, setelah itu Rp 10.000.000
 *    - Terus Rp 15.000.000 dan Rp 20.000.000 dengan kemungkinan 0,000000000001% (1 dari 1.000 Kuadriliun!)
 * 2. Pilihan Jumlah Spin:
 *    - Bisa Spin 1 kali, 3 kali, 5 kali, 7 kali, 10 kali.
 *    - Harga 1 kali Spin = 100 Koin (Setara Rp 1.000.000 karena 1 Koin = Rp 10.000).
 *    - Bisa dikasih diskon di Panel Admin.
 * 3. Pembelian Koin (Klik tombol + di sebelah gambar koin & angka 0 di bagian atas):
 *    - 1 Koin = Rp 10.000 (dikalikan jumlah koin + ada recehan & desimalnya).
 *    - Tersedia 100 pilihan pembelian mulai dari 1 Koin, 100.000 Koin, sampai 1.000.000 Koin (1 Juta Koin).
 *    - Harga bisa dimurahin & dikasih diskon di Panel Admin, serta kemungkinan pendapatan spin bisa diperbesar di Panel Admin.
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
  luckMultiplier: 1, // 1x Normal (Bisa dinaikkan di Panel Admin agar kemungkinan hadiah besar meningkat)
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
 * 100 Pilihan Pembelian Koin Spin:
 * Mulai dari 1 Koin, mencakup 1 s/d 100.000 Koin, hingga 1.000.000 Koin (1 Juta Koin)!
 */
const RAW_100_COIN_AMOUNTS: number[] = [
  // #1 - #25: 1 Koin s/d 95 Koin (Satuan & Eceran)
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
  12, 15, 18, 20, 25, 30, 35, 40, 45, 50,
  60, 70, 75, 85, 95,
  // #26 - #50: 100 Koin (1x Spin) s/d 5.000 Koin (Paket Spin Populer)
  100, 120, 150, 175, 200, 250, 300, 350, 400, 450,
  500, 600, 700, 800, 900, 1_000, 1_250, 1_500, 1_750, 2_000,
  2_500, 3_000, 3_500, 4_000, 5_000,
  // #51 - #75: 6.000 Koin s/d 100.000 Koin (Paket Sultan 100 Ribu Koin)
  6_000, 7_000, 7_500, 8_500, 10_000, 12_500, 15_000, 17_500, 20_000, 22_500,
  25_000, 30_000, 35_000, 40_000, 45_000, 50_000, 55_000, 60_000, 65_000, 70_000,
  75_000, 80_000, 85_000, 90_000, 100_000,
  // #76 - #100: 110.000 Koin s/d 1.000.000 Koin (Paket Mega Triliuner 1 Juta Koin)
  110_000, 125_000, 140_000, 150_000, 175_000, 200_000, 225_000, 250_000, 275_000, 300_000,
  350_000, 400_000, 450_000, 500_000, 550_000, 600_000, 650_000, 700_000, 750_000, 800_000,
  850_000, 900_000, 925_000, 950_000, 1_000_000,
];

const RECEHAN_DECIMALS = [
  0.12, 0.25, 0.37, 0.45, 0.58, 0.64, 0.75, 0.82, 0.88, 0.95,
  0.19, 0.33, 0.49, 0.67, 0.79, 0.91, 0.15, 0.28, 0.53, 0.99,
];

export const COIN_PURCHASE_PACKAGES_100: CoinPackageOption[] = RAW_100_COIN_AMOUNTS.map(
  (coins, index) => {
    const id = index + 1;
    const recehanDecimal = RECEHAN_DECIMALS[index % RECEHAN_DECIMALS.length];
    // Recehan rupiah unik (0 untuk 1 koin agar pas Rp 10.000,12, dan recehan unik untuk paket di atasnya)
    const extraRecehanRupiah = coins === 1 ? 0 : ((index * 17 + 3) % 89) + 1;

    let badge: string | undefined;
    if (coins === 1) badge = 'MULAI DARI 1 KOIN';
    else if (coins === 100) badge = 'PAS UNTUK 1x SPIN';
    else if (coins === 300) badge = 'PAS UNTUK 3x SPIN';
    else if (coins === 500) badge = 'PAS UNTUK 5x SPIN';
    else if (coins === 700) badge = 'PAS UNTUK 7x SPIN';
    else if (coins === 1_000) badge = 'PAS UNTUK 10x SPIN';
    else if (coins === 100_000) badge = 'PAKET 100.000 KOIN';
    else if (coins === 1_000_000) badge = 'MAKSIMAL 1 JUTA KOIN';

    const category: CoinPackageOption['category'] =
      id <= 25
        ? 'satuan'
        : id <= 50
        ? 'paket_spin'
        : id <= 75
        ? 'sultan_100k'
        : 'mega_1juta';

    return {
      id,
      coins,
      label: `${coins.toLocaleString('id-ID')} Koin`,
      recehanDecimal,
      extraRecehanRupiah,
      badge,
      category,
    };
  }
);

/**
 * Menghitung harga paket koin lengkap dengan perkalian + recehan & desimal,
 * serta memperhitungkan harga dasar per 1 koin & diskon dari Panel Admin.
 */
export function calculateCoinPackagePrice(
  pkg: CoinPackageOption,
  config: SpinWheelAdminConfig
): {
  normalPrice: number;
  finalPrice: number;
  discountPercent: number;
} {
  const baseUnit = config.baseCoinPriceRupiah ?? 10_000;
  // Harga asli dengan patokan Rp 10.000/koin + recehan rupiah + desimal sen
  const standardNormalPrice =
    pkg.coins * 10_000 + pkg.extraRecehanRupiah + pkg.recehanDecimal;

  // Harga setelah harga dasar dimurahin di Panel Admin
  const rawCurrentPrice =
    pkg.coins * baseUnit + pkg.extraRecehanRupiah + pkg.recehanDecimal;

  const discountPct = Math.max(0, Math.min(99, config.coinPurchaseDiscountPercent || 0));
  const discountedPrice =
    discountPct > 0
      ? Number((rawCurrentPrice * (1 - discountPct / 100)).toFixed(2))
      : Number(rawCurrentPrice.toFixed(2));

  return {
    normalPrice: Number(standardNormalPrice.toFixed(2)),
    finalPrice: Math.max(0.01, discountedPrice),
    discountPercent: discountPct,
  };
}

/**
 * Format angka Rupiah lengkap dengan recehan desimal 2 angka di belakang koma (contoh: Rp 10.000,12)
 */
export function formatRupiahWithDecimals(amount: number): string {
  if (!Number.isFinite(amount)) return 'Rp ∞ (Tidak Terbatas)';
  const fixed = amount.toFixed(2);
  const [intPart, decPart] = fixed.split('.');
  const formattedInt = Number(intPart).toLocaleString('id-ID');
  return `Rp ${formattedInt},${decPart}`;
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
    normalRupiahEquivalent: normalCoins * 10_000,
    finalRupiahEquivalent: finalCoins * unitRupiah,
    totalDiscountPercent: combinedDiscountPercent,
  };
}
