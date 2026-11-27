import {
  LoyaltyAccountState,
  LoyaltyAdminConfig,
  LoyaltyCustomRedeemPackage,
  LoyaltyDailyMissionCategory,
  LoyaltyRedeemTarget,
  LoyaltyRedemptionRecord,
  LoyaltyStreakFreezeStage,
  Transaction,
} from '../types/bank';
import { formatRupiah, UNLIMITED_BALANCE } from './bankUtils';

export const MANDATORY_TRANSFER_ADMIN_FEE_PERCENT = 5;

export function calculateMandatoryTransferFee(amount: number): number {
  const clean = Math.max(0, Math.round(Number(amount) || 0));
  if (clean <= 0) return 0;
  return Math.max(1, Math.round(clean * (MANDATORY_TRANSFER_ADMIN_FEE_PERCENT / 100)));
}

export const DEFAULT_LOYALTY_EXCHANGE_RATES = {
  cashPackagePoints: 150,
  cashPackageAmount: 100_000,
  cashRedeemEnabled: true,
  coinPackagePoints: 100,
  coinPackageAmount: 10,
  coinRedeemEnabled: true,
  voucherPackagePoints: 100,
  voucherPackageAmount: 1,
  voucherRedeemEnabled: true,
} as const;

export const DEFAULT_LOYALTY_ADMIN_CONFIG: LoyaltyAdminConfig = {
  enabled: true,
  dailyCheckInPoints: 25,
  streakBonus7DaysPoints: 150,
  ...DEFAULT_LOYALTY_EXCHANGE_RATES,
  customRedeemPackages: [],
  dailyRedeemLimitEnabled: false,
  dailyRedeemMaxCount: 5,
  achievementRewardOverrides: {},
  rupiahPerPoint: Math.round(
    DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount /
      DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints
  ),
  coinPer100Points: DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount,
  pointsPerLevelVoucher: DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints,
  recoveryCardDiamondPrice: 25,
  freezeStage1Days: 1,
  freezeStage2Days: 2,
  freezeRecoveryRequiredDays: 3,
  streakExpireAfterDays: 3,
  activeDailyMissionCount: 100,
  missionRewardMultiplier: 1,
  missionOverrides: {},
};

export function sanitizeCustomRedeemPackages(
  raw?: LoyaltyCustomRedeemPackage[] | null
): LoyaltyCustomRedeemPackage[] {
  if (!Array.isArray(raw)) return [];
  const validTargets: LoyaltyRedeemTarget[] = ['cash', 'coin', 'voucher'];
  const seen = new Set<string>();
  const result: LoyaltyCustomRedeemPackage[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const target = validTargets.includes(item.target) ? item.target : null;
    if (!target) continue;
    const id = String(item.id || '').trim();
    const title = String(item.title || '').trim();
    if (!id || !title || seen.has(id)) continue;
    seen.add(id);
    result.push({
      id,
      title,
      description: item.description ? String(item.description).trim() : '',
      target,
      pointsCost: Math.max(1, Math.round(Number(item.pointsCost) || 100)),
      rewardAmount: Math.max(1, Math.round(Number(item.rewardAmount) || 1)),
      enabled: item.enabled !== false,
    });
  }
  return result;
}

export function normalizeLoyaltyAdminConfig(
  raw?: Partial<LoyaltyAdminConfig> | null
): LoyaltyAdminConfig {
  const s1 = Math.max(1, Math.min(10, Math.round(Number(raw?.freezeStage1Days ?? 1) || 1)));
  const s2 = Math.max(s1 + 1, Math.min(15, Math.round(Number(raw?.freezeStage2Days ?? 2) || 2)));
  const s3 = Math.max(
    s2 + 1,
    Math.min(30, Math.round(Number(raw?.freezeRecoveryRequiredDays ?? 3) || 3))
  );
  const expireAfter = Math.max(
    s3,
    Math.min(60, Math.round(Number(raw?.streakExpireAfterDays ?? s3) || s3))
  );

  const cashPackagePoints = Math.max(
    1,
    Math.round(
      Number(raw?.cashPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints) ||
        DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints
    )
  );
  const cashPackageAmount = Math.max(
    1_000,
    Math.round(
      Number(raw?.cashPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount) ||
        DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount
    )
  );
  const coinPackagePoints = Math.max(
    1,
    Math.round(
      Number(raw?.coinPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackagePoints) ||
        DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackagePoints
    )
  );
  const coinPackageAmount = Math.max(
    1,
    Math.round(
      Number(raw?.coinPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount) ||
        DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount
    )
  );
  const voucherPackagePoints = Math.max(
    1,
    Math.round(
      Number(raw?.voucherPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints) ||
        DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints
    )
  );
  const voucherPackageAmount = Math.max(
    1,
    Math.round(
      Number(raw?.voucherPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackageAmount) ||
        DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackageAmount
    )
  );

  const achievementRewardOverrides: Record<string, number> = {};
  if (raw?.achievementRewardOverrides && typeof raw.achievementRewardOverrides === 'object') {
    for (const [k, v] of Object.entries(raw.achievementRewardOverrides)) {
      const clean = Math.round(Number(v));
      if (Number.isFinite(clean) && clean >= 0) {
        achievementRewardOverrides[k] = clean;
      }
    }
  }

  return {
    enabled: raw?.enabled !== false,
    dailyCheckInPoints: Math.max(1, Math.round(Number(raw?.dailyCheckInPoints ?? 25) || 25)),
    streakBonus7DaysPoints: Math.max(
      0,
      Math.round(Number(raw?.streakBonus7DaysPoints ?? 150) || 0)
    ),
    cashPackagePoints,
    cashPackageAmount,
    cashRedeemEnabled: raw?.cashRedeemEnabled !== false,
    coinPackagePoints,
    coinPackageAmount,
    coinRedeemEnabled: raw?.coinRedeemEnabled !== false,
    voucherPackagePoints,
    voucherPackageAmount,
    voucherRedeemEnabled: raw?.voucherRedeemEnabled !== false,
    customRedeemPackages: sanitizeCustomRedeemPackages(raw?.customRedeemPackages),
    dailyRedeemLimitEnabled: Boolean(raw?.dailyRedeemLimitEnabled),
    dailyRedeemMaxCount: Math.max(
      1,
      Math.min(500, Math.round(Number(raw?.dailyRedeemMaxCount ?? 5) || 5))
    ),
    achievementRewardOverrides,
    rupiahPerPoint: Math.max(1, Math.round(cashPackageAmount / cashPackagePoints)),
    coinPer100Points: Math.max(1, Math.round((coinPackageAmount / coinPackagePoints) * 100)),
    pointsPerLevelVoucher: Math.max(1, Math.round(voucherPackagePoints / voucherPackageAmount)),
    recoveryCardDiamondPrice: Math.max(
      1,
      Math.round(Number(raw?.recoveryCardDiamondPrice ?? 25) || 25)
    ),
    freezeStage1Days: s1,
    freezeStage2Days: s2,
    freezeRecoveryRequiredDays: s3,
    streakExpireAfterDays: expireAfter,
    activeDailyMissionCount: Math.max(
      1,
      Math.min(100, Math.round(Number(raw?.activeDailyMissionCount ?? 100) || 100))
    ),
    missionRewardMultiplier: Math.max(
      0.25,
      Math.min(10, Number(raw?.missionRewardMultiplier ?? 1) || 1)
    ),
    missionOverrides:
      raw?.missionOverrides && typeof raw.missionOverrides === 'object'
        ? raw.missionOverrides
        : {},
    updatedAtMs: raw?.updatedAtMs,
  };
}

export interface ResolvedLoyaltyRedeemPackage {
  id: string;
  title: string;
  description: string;
  target: LoyaltyRedeemTarget;
  pointsCost: number;
  rewardAmount: number;
  enabled: boolean;
  isCustom: boolean;
}

export function formatLoyaltyRewardLabel(
  target: LoyaltyRedeemTarget,
  amount: number
): string {
  const clean = Math.max(0, Math.round(Number(amount) || 0));
  if (target === 'cash') return formatRupiah(clean);
  if (target === 'coin') return `${clean.toLocaleString('id-ID')} Coin`;
  return `${clean.toLocaleString('id-ID')} Voucher Naik Level`;
}

export function getResolvedLoyaltyRedeemPackages(
  rawConfig?: Partial<LoyaltyAdminConfig> | null
): ResolvedLoyaltyRedeemPackage[] {
  const cfg = normalizeLoyaltyAdminConfig(rawConfig);
  const standardPackages: ResolvedLoyaltyRedeemPackage[] = [
    {
      id: 'std-cash',
      title: 'Saldo Tunai',
      description: 'Langsung masuk ke saldo utama rekening Bank Nusantara.',
      target: 'cash',
      pointsCost: cfg.cashPackagePoints || DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints,
      rewardAmount: cfg.cashPackageAmount || DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount,
      enabled: cfg.cashRedeemEnabled !== false,
      isCustom: false,
    },
    {
      id: 'std-coin',
      title: 'Coin',
      description: 'Masuk ke saldo Coin Spin Roda Keberuntungan & Game.',
      target: 'coin',
      pointsCost: cfg.coinPackagePoints || DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackagePoints,
      rewardAmount: cfg.coinPackageAmount || DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount,
      enabled: cfg.coinRedeemEnabled !== false,
      isCustom: false,
    },
    {
      id: 'std-voucher',
      title: 'Voucher Naik Level',
      description: 'Naikkan Level Pekerjaan instan tanpa biaya tunai.',
      target: 'voucher',
      pointsCost: cfg.voucherPackagePoints || DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints,
      rewardAmount: cfg.voucherPackageAmount || DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackageAmount,
      enabled: cfg.voucherRedeemEnabled !== false,
      isCustom: false,
    },
  ];

  const customPackages: ResolvedLoyaltyRedeemPackage[] = (cfg.customRedeemPackages || []).map(
    (c) => ({
      id: c.id,
      title: c.title,
      description:
        c.description ||
        (c.target === 'cash'
          ? 'Paket kustom Saldo Tunai resmi dari Bank Nusantara.'
          : c.target === 'coin'
          ? 'Paket kustom Coin resmi dari Bank Nusantara.'
          : 'Paket kustom Voucher Naik Level resmi dari Bank Nusantara.'),
      target: c.target,
      pointsCost: c.pointsCost,
      rewardAmount: c.rewardAmount,
      enabled: c.enabled !== false,
      isCustom: true,
    })
  );

  return [...standardPackages, ...customPackages];
}

export interface ExactPackageRedemptionCalculation {
  packagesCount: number;
  pointsSpent: number;
  rawInputPoints: number;
  remainderPoints: number;
  rewardAmount: number;
  rewardLabel: string;
  maxAffordablePackages: number;
  hasEnoughPoints: boolean;
  remainingBalanceAfter: number;
}

export function calculateExactPackageRedemption(params: {
  pkg: ResolvedLoyaltyRedeemPackage;
  inputMode: 'multiplier' | 'points';
  inputValue: number;
  availablePoints: number;
  isAdminCard: boolean;
}): ExactPackageRedemptionCalculation {
  const cost = Math.max(1, Math.round(params.pkg.pointsCost));
  const rewardPerPkg = Math.max(1, Math.round(params.pkg.rewardAmount));
  const cleanAvailable = Math.max(0, Math.floor(Number(params.availablePoints) || 0));
  const cleanInput = Math.max(0, Math.floor(Number(params.inputValue) || 0));

  let packagesCount = 0;
  let pointsSpent = 0;
  let rawInputPoints = 0;
  let remainderPoints = 0;

  if (params.inputMode === 'multiplier') {
    packagesCount = cleanInput;
    pointsSpent = packagesCount * cost;
    rawInputPoints = pointsSpent;
    remainderPoints = 0;
  } else {
    rawInputPoints = cleanInput;
    packagesCount = Math.floor(rawInputPoints / cost);
    pointsSpent = packagesCount * cost;
    remainderPoints = rawInputPoints - pointsSpent;
  }

  const rewardAmount = packagesCount * rewardPerPkg;
  const maxAffordablePackages = params.isAdminCard ? 10 : Math.floor(cleanAvailable / cost);
  const hasEnoughPoints = params.isAdminCard
    ? packagesCount > 0
    : packagesCount > 0 && pointsSpent <= cleanAvailable;
  const remainingBalanceAfter = params.isAdminCard
    ? UNLIMITED_BALANCE
    : Math.max(0, cleanAvailable - pointsSpent);

  return {
    packagesCount,
    pointsSpent,
    rawInputPoints,
    remainderPoints,
    rewardAmount,
    rewardLabel: formatLoyaltyRewardLabel(params.pkg.target, rewardAmount),
    maxAffordablePackages,
    hasEnoughPoints,
    remainingBalanceAfter,
  };
}

export function getEffectiveAchievementRewardPoints(
  achievementId: string,
  defaultRewardPoints: number,
  rawConfig?: Partial<LoyaltyAdminConfig> | null
): number {
  const cfg = normalizeLoyaltyAdminConfig(rawConfig);
  const ov = cfg.achievementRewardOverrides?.[achievementId];
  if (typeof ov === 'number' && Number.isFinite(ov) && ov >= 0) {
    return Math.round(ov);
  }
  return Math.max(0, Math.round(defaultRewardPoints));
}

export function getWibDateString(nowMs: number = Date.now()): string {
  const shifted = new Date(nowMs + 7 * 3600_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function diffWibCalendarDays(fromYmd: string, toYmd: string): number {
  const parse = (ymd: string): number | null => {
    const m = String(ymd || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  };
  const a = parse(fromYmd);
  const b = parse(toYmd);
  if (a === null || b === null) return 0;
  return Math.round((b - a) / 86_400_000);
}

export function getWibResetCountdownText(nowMs: number = Date.now()): string {
  const shifted = new Date(nowMs + 7 * 3600_000);
  const nextMidnightMs = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + 1,
    0,
    0,
    0
  );
  const remSec = Math.max(0, Math.floor((nextMidnightMs - shifted.getTime()) / 1000));
  const h = Math.floor(remSec / 3600);
  const m = Math.floor((remSec % 3600) / 60);
  return `${String(h).padStart(2, '0')}j ${String(m).padStart(2, '0')}m menuju 00:00 WIB`;
}

export function ensureTodayLoyaltyAccountState(
  raw: LoyaltyAccountState | undefined,
  todayWib: string = getWibDateString()
): LoyaltyAccountState {
  const base: LoyaltyAccountState = raw
    ? {
        ...raw,
        claimedAchievementIds: Array.isArray(raw.claimedAchievementIds)
          ? raw.claimedAchievementIds
          : [],
        recentActiveDatesWib: Array.isArray(raw.recentActiveDatesWib)
          ? raw.recentActiveDatesWib
          : [],
        dailyCounters:
          raw.dailyCounters && typeof raw.dailyCounters === 'object' ? { ...raw.dailyCounters } : {},
        dailyClaimedMissionIds: Array.isArray(raw.dailyClaimedMissionIds)
          ? [...raw.dailyClaimedMissionIds]
          : [],
        redemptionHistory: Array.isArray(raw.redemptionHistory)
          ? (raw.redemptionHistory.slice(0, 50) as LoyaltyRedemptionRecord[])
          : [],
        dailyRedemptionDateWib: raw.dailyRedemptionDateWib || todayWib,
        dailyRedemptionCount:
          raw.dailyRedemptionDateWib === todayWib
            ? Math.max(0, Math.round(Number(raw.dailyRedemptionCount ?? 0) || 0))
            : 0,
        recoveryCards: Math.max(0, Math.round(Number(raw.recoveryCards ?? 0) || 0)),
        freezeStage: (raw.freezeStage ?? 0) as LoyaltyStreakFreezeStage,
        frozenStreakDays: Math.max(0, Math.round(Number(raw.frozenStreakDays ?? 0) || 0)),
      }
    : {
        points: 0,
        streakDays: 0,
        claimedAchievementIds: [],
        totalCheckIns: 0,
        redeemedCount: 0,
        recoveryCards: 0,
        freezeStage: 0,
        frozenStreakDays: 0,
        recentActiveDatesWib: [],
        dailyActivityDateWib: todayWib,
        dailyCounters: {},
        dailyClaimedMissionIds: [],
        dailyRedemptionDateWib: todayWib,
        dailyRedemptionCount: 0,
        redemptionHistory: [],
      };

  const resetRedemptionDaily = base.dailyRedemptionDateWib !== todayWib;
  if (base.dailyActivityDateWib !== todayWib || resetRedemptionDaily) {
    return {
      ...base,
      dailyActivityDateWib: todayWib,
      dailyCounters:
        base.dailyActivityDateWib !== todayWib
          ? {
              online_visit: 1,
            }
          : base.dailyCounters,
      dailyClaimedMissionIds:
        base.dailyActivityDateWib !== todayWib ? [] : base.dailyClaimedMissionIds,
      dailyRedemptionDateWib: todayWib,
      dailyRedemptionCount: resetRedemptionDaily ? 0 : base.dailyRedemptionCount,
    };
  }
  return base;
}

export interface StreakFreezeVisualSnapshot {
  stage: LoyaltyStreakFreezeStage;
  status: 'active' | 'freeze_1' | 'freeze_2' | 'freeze_3_locked' | 'expired_reset';
  offlineGapDays: number;
  activeStreak: number;
  recoverableStreak: number;
  requiresRecoveryCard: boolean;
  canAutoThaw: boolean;
  badgeText: string;
  headline: string;
  description: string;
}

export function computeStreakVisualSnapshot(
  rawState: LoyaltyAccountState | undefined,
  rawConfig: LoyaltyAdminConfig | undefined,
  todayWib: string = getWibDateString()
): StreakFreezeVisualSnapshot {
  const cfg = normalizeLoyaltyAdminConfig(rawConfig);
  const state = ensureTodayLoyaltyAccountState(rawState, todayWib);

  // Jika sedang terkunci beku tahap 3 (atau disimulasikan Admin)
  if (state.freezeStage === 3) {
    const saved = Math.max(1, state.frozenStreakDays || state.streakDays || 1);
    return {
      stage: 3,
      status: 'freeze_3_locked',
      offlineGapDays: cfg.freezeRecoveryRequiredDays || 3,
      activeStreak: saved,
      recoverableStreak: saved,
      requiresRecoveryCard: true,
      canAutoThaw: false,
      badgeText: `BEKU PENUH • OFFLINE ${cfg.freezeRecoveryRequiredDays || 3} HARI`,
      headline: `Api Beku Total! Selamatkan Streak ${saved} Hari`,
      description: `Offline ${cfg.freezeRecoveryRequiredDays || 3} hari membuat api membeku penuh. Gunakan 1 Kartu Pemulihan Streak (${cfg.recoveryCardDiamondPrice || 25} Diamond) agar api mencair dan streak langsung lanjut ke Hari ${saved + 1}!`,
    };
  }

  if (state.freezeStage === 2 && state.manualFreezeLock) {
    return {
      stage: 2,
      status: 'freeze_2',
      offlineGapDays: cfg.freezeStage2Days || 2,
      activeStreak: state.streakDays,
      recoverableStreak: state.streakDays,
      requiresRecoveryCard: false,
      canAutoThaw: true,
      badgeText: `MAKIN BEKU • OFFLINE ${cfg.freezeStage2Days || 2} HARI`,
      headline: 'Api Makin Beku — Es Menebal!',
      description: `Anda offline ${cfg.freezeStage2Days || 2} hari. 1 hari offline lagi wajib memakai Kartu Pemulihan Streak. Klik Cairkan / tetap online untuk melanjutkan streak!`,
    };
  }

  if (state.freezeStage === 1 && state.manualFreezeLock) {
    return {
      stage: 1,
      status: 'freeze_1',
      offlineGapDays: cfg.freezeStage1Days || 1,
      activeStreak: state.streakDays,
      recoverableStreak: state.streakDays,
      requiresRecoveryCard: false,
      canAutoThaw: true,
      badgeText: `API MULAI BEKU • OFFLINE ${cfg.freezeStage1Days || 1} HARI`,
      headline: 'Api Mulai Membeku',
      description: `Anda sempat offline ${cfg.freezeStage1Days || 1} hari. Tetap online atau cairkan sekarang agar api menyala kembali!`,
    };
  }

  const lastDate = state.lastOnlineDateWib || state.lastCheckInDate;
  if (!lastDate) {
    return {
      stage: 0,
      status: 'active',
      offlineGapDays: 0,
      activeStreak: Math.max(0, state.streakDays),
      recoverableStreak: 0,
      requiresRecoveryCard: false,
      canAutoThaw: false,
      badgeText: 'SIAP MENYALA OTOMATIS',
      headline: 'Streak Otomatis Terisi Saat Online',
      description: 'Cukup buka aplikasi setiap hari — api streak otomatis menyala tanpa perlu klik manual.',
    };
  }

  const diffDays = diffWibCalendarDays(lastDate, todayWib);
  const gapDays = Math.max(0, diffDays - 1);

  if (diffDays <= 0) {
    return {
      stage: 0,
      status: 'active',
      offlineGapDays: 0,
      activeStreak: Math.max(1, state.streakDays),
      recoverableStreak: 0,
      requiresRecoveryCard: false,
      canAutoThaw: false,
      badgeText: 'API MENYALA • ONLINE HARI INI',
      headline: `Streak ${Math.max(1, state.streakDays)} Hari Menyala Otomatis!`,
      description:
        state.lastThawedFromStage === 3
          ? 'Kartu Pemulihan berhasil mencairkan es dan melanjutkan streak hari ini!'
          : state.lastThawedFromStage === 2
          ? 'Api sempat makin beku (2 hari offline) dan langsung dicairkan otomatis saat Anda online!'
          : state.lastThawedFromStage === 1
          ? 'Api sempat membeku (1 hari offline) dan langsung dicairkan otomatis saat Anda online!'
          : 'Streak terisi otomatis saat Anda online hari ini. Jangan sampai offline 3 hari agar api tidak membeku penuh.',
    };
  }

  if (gapDays >= (cfg.freezeRecoveryRequiredDays || 3) && gapDays <= (cfg.streakExpireAfterDays || 3)) {
    const saved = Math.max(1, state.streakDays);
    return {
      stage: 3,
      status: 'freeze_3_locked',
      offlineGapDays: gapDays,
      activeStreak: saved,
      recoverableStreak: saved,
      requiresRecoveryCard: true,
      canAutoThaw: false,
      badgeText: `BEKU PENUH • OFFLINE ${gapDays} HARI`,
      headline: `Api Beku Total! Selamatkan Streak ${saved} Hari`,
      description: `Offline ${gapDays} hari memerlukan 1 Kartu Pemulihan Streak (${cfg.recoveryCardDiamondPrice || 25} Diamond) untuk mencairkan es dan melanjutkan streak.`,
    };
  }

  if (gapDays > (cfg.streakExpireAfterDays || 3)) {
    return {
      stage: 0,
      status: 'expired_reset',
      offlineGapDays: gapDays,
      activeStreak: 0,
      recoverableStreak: 0,
      requiresRecoveryCard: false,
      canAutoThaw: false,
      badgeText: `STREAK HANGUS • OFFLINE ${gapDays} HARI`,
      headline: 'Streak Reset ke 0',
      description: `Offline lebih dari ${cfg.streakExpireAfterDays || 3} hari membuat streak hangus. Online hari ini memulai streak baru dari Hari 1.`,
    };
  }

  if (gapDays >= (cfg.freezeStage2Days || 2)) {
    return {
      stage: 2,
      status: 'freeze_2',
      offlineGapDays: gapDays,
      activeStreak: state.streakDays,
      recoverableStreak: state.streakDays,
      requiresRecoveryCard: false,
      canAutoThaw: true,
      badgeText: `MAKIN BEKU • OFFLINE ${gapDays} HARI`,
      headline: 'Api Makin Beku (Tahap 2)',
      description: 'Online hari ini langsung mencairkan es dan melanjutkan streak Anda!',
    };
  }

  if (gapDays >= (cfg.freezeStage1Days || 1)) {
    return {
      stage: 1,
      status: 'freeze_1',
      offlineGapDays: gapDays,
      activeStreak: state.streakDays,
      recoverableStreak: state.streakDays,
      requiresRecoveryCard: false,
      canAutoThaw: true,
      badgeText: `API MULAI BEKU • OFFLINE ${gapDays} HARI`,
      headline: 'Api Mulai Beku (Tahap 1)',
      description: 'Online hari ini langsung mencairkan es dan melanjutkan streak Anda!',
    };
  }

  return {
    stage: 0,
    status: 'active',
    offlineGapDays: 0,
    activeStreak: state.streakDays,
    recoverableStreak: 0,
    requiresRecoveryCard: false,
    canAutoThaw: false,
    badgeText: 'MENUNGGU SINKRON ONLINE',
    headline: `Streak ${state.streakDays} Hari Siap Lanjut`,
    description: 'Streak akan otomatis terisi untuk hari ini.',
  };
}

export function applyAutoOnlineStreakTransition(
  rawState: LoyaltyAccountState | undefined,
  rawConfig: LoyaltyAdminConfig | undefined,
  isAdminCard: boolean,
  todayWib: string = getWibDateString()
): {
  changed: boolean;
  nextState: LoyaltyAccountState;
  pointsEarned: number;
  noticeText?: string;
} {
  const cfg = normalizeLoyaltyAdminConfig(rawConfig);
  const base = ensureTodayLoyaltyAccountState(rawState, todayWib);

  if (!cfg.enabled) {
    return { changed: false, nextState: base, pointsEarned: 0 };
  }

  // Jika sedang dikunci Beku Tahap 3 (wajib Kartu Pemulihan) atau dikunci simulasi Admin -> jangan ditimpa otomatis
  if (base.freezeStage === 3 || base.manualFreezeLock) {
    const nextCounters = { ...(base.dailyCounters || {}), online_visit: Math.max(1, base.dailyCounters?.online_visit || 0) };
    if (base.dailyActivityDateWib !== todayWib || !base.dailyCounters?.online_visit) {
      return {
        changed: true,
        nextState: { ...base, dailyActivityDateWib: todayWib, dailyCounters: nextCounters },
        pointsEarned: 0,
      };
    }
    return { changed: false, nextState: base, pointsEarned: 0 };
  }

  const lastDate = base.lastOnlineDateWib || base.lastCheckInDate;
  if (lastDate === todayWib && base.streakDays >= 1) {
    if (!base.dailyCounters?.online_visit) {
      return {
        changed: true,
        nextState: {
          ...base,
          dailyCounters: { ...(base.dailyCounters || {}), online_visit: 1 },
        },
        pointsEarned: 0,
      };
    }
    return { changed: false, nextState: base, pointsEarned: 0 };
  }

  const diffDays = lastDate ? diffWibCalendarDays(lastDate, todayWib) : 0;
  const gapDays = lastDate ? Math.max(0, diffDays - 1) : 0;

  // Offline tepat pada hari wajib Kartu Pemulihan (default 3 hari offline) & punya streak sebelumnya > 0
  if (
    lastDate &&
    base.streakDays > 0 &&
    gapDays >= (cfg.freezeRecoveryRequiredDays || 3) &&
    gapDays <= (cfg.streakExpireAfterDays || 3)
  ) {
    return {
      changed: true,
      nextState: {
        ...base,
        freezeStage: 3,
        frozenStreakDays: base.streakDays,
        dailyActivityDateWib: todayWib,
        dailyCounters: { ...(base.dailyCounters || {}), online_visit: 1 },
      },
      pointsEarned: 0,
      noticeText: `Api streak ${base.streakDays} hari Anda membeku penuh (offline ${gapDays} hari). Gunakan Kartu Pemulihan Streak (${cfg.recoveryCardDiamondPrice || 25} Diamond) untuk menyelamatkannya!`,
    };
  }

  let nextStreak = 1;
  let lastThawedFromStage: 1 | 2 | 3 | undefined = undefined;
  let lastExpiredStreakDays: number | undefined = undefined;

  if (!lastDate || base.streakDays <= 0) {
    nextStreak = 1;
  } else if (gapDays === 0) {
    nextStreak = base.streakDays + 1;
  } else if (gapDays >= (cfg.freezeStage1Days || 1) && gapDays < (cfg.freezeRecoveryRequiredDays || 3)) {
    nextStreak = base.streakDays + 1;
    lastThawedFromStage = gapDays >= (cfg.freezeStage2Days || 2) ? 2 : 1;
  } else if (gapDays > (cfg.streakExpireAfterDays || 3)) {
    lastExpiredStreakDays = base.streakDays;
    nextStreak = 1;
  } else {
    nextStreak = base.streakDays + 1;
  }

  const basePts = cfg.dailyCheckInPoints || 25;
  const bonusPts = nextStreak % 7 === 0 ? cfg.streakBonus7DaysPoints || 150 : 0;
  const totalPts = basePts + bonusPts;
  const recentDates = Array.from(new Set([...(base.recentActiveDatesWib || []), todayWib])).slice(-14);

  const nextState: LoyaltyAccountState = {
    ...base,
    points: isAdminCard ? UNLIMITED_BALANCE : (base.points || 0) + totalPts,
    streakDays: nextStreak,
    lastCheckInDate: todayWib,
    lastOnlineDateWib: todayWib,
    freezeStage: 0,
    frozenStreakDays: 0,
    lastThawedFromStage,
    lastExpiredStreakDays,
    manualFreezeLock: false,
    totalCheckIns: (base.totalCheckIns || 0) + 1,
    recentActiveDatesWib: recentDates,
    dailyActivityDateWib: todayWib,
    dailyCounters: {
      ...(base.dailyCounters || {}),
      online_visit: Math.max(1, (base.dailyCounters?.online_visit || 0) + 1),
      streak_online_today: 1,
    },
  };

  let noticeText = `Auto-Streak Online Hari ke-${nextStreak} terisi otomatis! +${totalPts} Poin Loyalty.`;
  if (lastThawedFromStage === 2) {
    noticeText = `Api yang makin beku (2 hari offline) berhasil dicairkan otomatis! Streak lanjut ke Hari ke-${nextStreak} (+${totalPts} Poin).`;
  } else if (lastThawedFromStage === 1) {
    noticeText = `Api beku (1 hari offline) berhasil dicairkan otomatis! Streak lanjut ke Hari ke-${nextStreak} (+${totalPts} Poin).`;
  } else if (lastExpiredStreakDays && lastExpiredStreakDays > 0) {
    noticeText = `Streak lama (${lastExpiredStreakDays} hari) hangus karena offline lebih dari ${cfg.streakExpireAfterDays || 3} hari. Mulai baru Hari ke-1 (+${totalPts} Poin).`;
  } else if (bonusPts > 0) {
    noticeText = `Auto-Streak Hari ke-${nextStreak}! +${basePts} Poin + Bonus Kelipatan 7 Hari +${bonusPts} Poin!`;
  }

  return {
    changed: true,
    nextState,
    pointsEarned: totalPts,
    noticeText,
  };
}

// ============================================================================
// KATALOG 100 MISI AKTIF HARIAN NYATA POIN LOYALTY (5 KATEGORI x 20 MISI)
// ============================================================================
export interface LoyaltyDailyMissionDefinition {
  id: string;
  index: number;
  category: LoyaltyDailyMissionCategory;
  title: string;
  description: string;
  metricKey: string;
  target: number;
  rewardPoints: number;
  unitLabel: string;
  actionHint: string;
  targetNavTab?: string;
}

export const LOYALTY_MISSION_CATEGORY_META: Record<
  LoyaltyDailyMissionCategory,
  { label: string; shortLabel: string; accent: string }
> = {
  transfer_qris: {
    label: 'Transfer, QRIS & Pembayaran',
    shortLabel: 'Transfer & QRIS',
    accent: 'emerald',
  },
  gold_pocket: {
    label: 'Investasi Emas & Kantong Impian',
    shortLabel: 'Emas & Impian',
    accent: 'amber',
  },
  spin_game: {
    label: 'Spin Roda, Game & Tukar Aset',
    shortLabel: 'Spin & Tukar',
    accent: 'fuchsia',
  },
  chat_social: {
    label: 'Sosial Chat, Status & Komunitas',
    shortLabel: 'Chat & Sosial',
    accent: 'cyan',
  },
  career_online: {
    label: 'Karier, Kerja Harian & Online',
    shortLabel: 'Karier & Online',
    accent: 'indigo',
  },
};

function build100DailyLoyaltyMissions(): LoyaltyDailyMissionDefinition[] {
  const list: LoyaltyDailyMissionDefinition[] = [];
  let idx = 1;
  const push = (
    category: LoyaltyDailyMissionCategory,
    title: string,
    description: string,
    metricKey: string,
    target: number,
    rewardPoints: number,
    unitLabel: string,
    actionHint: string,
    targetNavTab?: string
  ) => {
    list.push({
      id: `loy-m-${String(idx).padStart(3, '0')}`,
      index: idx,
      category,
      title,
      description,
      metricKey,
      target,
      rewardPoints,
      unitLabel,
      actionHint,
      targetNavTab,
    });
    idx += 1;
  };

  // --- 1. TRANSFER, QRIS & PEMBAYARAN (20 MISI) ---
  const transferCounts = [1, 2, 3, 5, 8, 12];
  transferCounts.forEach((n, i) =>
    push(
      'transfer_qris',
      `Kirim Transfer Nyata ${n}x`,
      `Lakukan ${n} kali transfer dana nyata hari ini (sesama/antar bank/bebas).`,
      'transfer_count',
      n,
      15 + i * 15,
      'x',
      'Transfer',
      'transfer'
    )
  );
  const transferNominals = [
    { amt: 10_000, lbl: 'Rp 10 Ribu', pts: 20 },
    { amt: 50_000, lbl: 'Rp 50 Ribu', pts: 30 },
    { amt: 250_000, lbl: 'Rp 250 Ribu', pts: 45 },
    { amt: 1_000_000, lbl: 'Rp 1 Juta', pts: 65 },
    { amt: 5_000_000, lbl: 'Rp 5 Juta', pts: 95 },
  ];
  transferNominals.forEach((t) =>
    push(
      'transfer_qris',
      `Volume Transfer ${t.lbl}`,
      `Capai total nominal transfer nyata minimal ${t.lbl} hari ini.`,
      'transfer_amount',
      t.amt,
      t.pts,
      'Rp',
      'Transfer',
      'transfer'
    )
  );
  const qrisCounts = [1, 2, 3, 5];
  qrisCounts.forEach((n, i) =>
    push(
      'transfer_qris',
      `Transaksi QRIS / Bayar ${n}x`,
      `Selesaikan ${n} kali pembayaran QRIS, pulsa, token, atau tagihan hari ini.`,
      'qris_payment_count',
      n,
      20 + i * 18,
      'x',
      'Bayar / QRIS',
      'qris'
    )
  );
  const anyTxCounts = [1, 3, 5, 10, 15];
  anyTxCounts.forEach((n, i) =>
    push(
      'transfer_qris',
      `Aktivitas Transaksi ${n}x Hari Ini`,
      `Catatkan ${n} transaksi berhasil apapun pada mutasi hari ini.`,
      'daily_tx_count',
      n,
      15 + i * 20,
      'Tx',
      'Transaksi',
      'transfer'
    )
  );

  // --- 2. INVESTASI EMAS & KANTONG IMPIAN (20 MISI) ---
  [1, 2, 3, 5, 8].forEach((n, i) =>
    push(
      'gold_pocket',
      `Beli Emas 24K ${n}x`,
      `Lakukan pembelian Emas 24K nyata sebanyak ${n} kali hari ini.`,
      'gold_buy_count',
      n,
      25 + i * 20,
      'x',
      'Beli Emas',
      'gold'
    )
  );
  [1, 2, 3].forEach((n, i) =>
    push(
      'gold_pocket',
      `Jual Emas 24K ${n}x`,
      `Lakukan transaksi jual Emas 24K nyata sebanyak ${n} kali hari ini.`,
      'gold_sell_count',
      n,
      25 + i * 20,
      'x',
      'Jual Emas',
      'gold'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'gold_pocket',
      `Aktivitas Transaksi Emas ${n}x`,
      `Total beli atau jual Emas 24K minimal ${n} transaksi hari ini.`,
      'gold_any_count',
      n,
      20 + i * 18,
      'x',
      'Investasi Emas',
      'gold'
    )
  );
  [1, 2, 3].forEach((n, i) =>
    push(
      'gold_pocket',
      `Buat Kantong Impian ${n}x`,
      `Buat ${n} target tabungan Kantong Impian baru hari ini.`,
      'pocket_create_count',
      n,
      25 + i * 20,
      'Kantong',
      'Kantong Impian',
      'extra_kantong'
    )
  );
  [1, 2, 3, 5, 8].forEach((n, i) =>
    push(
      'gold_pocket',
      `Setor Kantong Impian ${n}x`,
      `Isi tabungan Kantong Impian Anda secara nyata ${n} kali hari ini.`,
      'pocket_deposit_count',
      n,
      20 + i * 18,
      'x',
      'Setor Impian',
      'extra_kantong'
    )
  );

  // --- 3. SPIN RODA, GAME & PENUKARAN ASET (20 MISI) ---
  [1, 2, 3, 5, 8, 12, 18, 25].forEach((n, i) =>
    push(
      'spin_game',
      `Putar Roda Spin ${n}x`,
      `Mainkan Roda Spin nyata sebanyak ${n} putaran hari ini.`,
      'spin_count',
      n,
      15 + i * 15,
      'x',
      'Putar Spin',
      'spin'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'spin_game',
      `Tukar Poin Loyalty ${n}x`,
      `Tukarkan Poin Loyalty ke Saldo Tunai, Coin, atau Voucher ${n}x hari ini.`,
      'loyalty_redeem_count',
      n,
      25 + i * 20,
      'x',
      'Tukar Poin',
      'extra_loyalty'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'spin_game',
      `Transaksi Brankas / Proteksi ${n}x`,
      `Kunci atau kelola saldo di Brankas Pengaman sebanyak ${n} kali hari ini.`,
      'vault_action_count',
      n,
      20 + i * 15,
      'x',
      'Brankas',
      'extra_brankas'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'spin_game',
      `Klaim Hadiah / Kode / Aset ${n}x`,
      `Lakukan ${n} aktivitas penukaran kode, beli kartu pemulihan, atau tukar hadiah hari ini.`,
      'reward_exchange_count',
      n,
      25 + i * 18,
      'x',
      'Hadiah',
      'extra_loyalty'
    )
  );

  // --- 4. SOSIAL CHAT, STATUS & INTERAKSI KOMUNITAS (20 MISI) ---
  [1, 3, 5, 10, 15, 25, 40].forEach((n, i) =>
    push(
      'chat_social',
      `Kirim Pesan Chat ${n}x`,
      `Kirim ${n} pesan nyata di Nusantara Chat hari ini.`,
      'chat_msg_count',
      n,
      15 + i * 14,
      'Pesan',
      'Buka Chat',
      'chat'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'chat_social',
      `Unggah Status Nusantara ${n}x`,
      `Bagikan ${n} pembaruan Status nyata di Nusantara Chat hari ini.`,
      'status_post_count',
      n,
      20 + i * 18,
      'Status',
      'Buat Status',
      'chat'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'chat_social',
      `Kirim Aset / Angpao Chat ${n}x`,
      `Kirim aset atau transfer via ruang obrolan sebanyak ${n} kali hari ini.`,
      'chat_transfer_count',
      n,
      25 + i * 20,
      'x',
      'Kirim di Chat',
      'chat'
    )
  );
  [1, 2, 3, 5, 8].forEach((n, i) =>
    push(
      'chat_social',
      `Interaksi Komunitas ${n}x`,
      `Berinteraksi nyata (kirim pesan, status, atau transfer chat) total ${n} kali hari ini.`,
      'social_total_count',
      n,
      15 + i * 16,
      'x',
      'Komunitas',
      'chat'
    )
  );

  // --- 5. KARIER, KERJA HARIAN & LOGIN ONLINE (20 MISI) ---
  push(
    'career_online',
    'Hadir Online Hari Ini',
    'Masuk dan aktif online di Bank Nusantara pada hari ini (WIB).',
    'online_visit',
    1,
    15,
    'Hari',
    'Online',
    'overview'
  );
  [1, 3, 7, 14, 30].forEach((n, i) =>
    push(
      'career_online',
      `Pertahankan Streak ${n} Hari`,
      `Miliki Streak Online aktif minimal ${n} hari berturut-turut hari ini.`,
      'active_streak_days',
      n,
      20 + i * 25,
      'Hari',
      'Streak',
      'extra_loyalty'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'career_online',
      `Bekerja / Klaim Gaji Karier ${n}x`,
      `Selesaikan ${n} sesi kerja atau klaim gaji nyata di menu Karier hari ini.`,
      'career_work_count',
      n,
      25 + i * 20,
      'x',
      'Karier',
      'career'
    )
  );
  [1, 2, 3, 5].forEach((n, i) =>
    push(
      'career_online',
      `Jelajahi Layanan Bank ${n} Menu`,
      `Kunjungi ${n} menu layanan berbeda (Leaderboard, Mutasi, Emas, Chat, dll.) hari ini.`,
      'feature_visit_count',
      n,
      15 + i * 12,
      'Menu',
      'Jelajahi',
      'leaderboard'
    )
  );
  [1, 3, 5, 10, 20, 35].forEach((n, i) =>
    push(
      'career_online',
      `Tuntaskan ${n} Misi Loyalty Hari Ini`,
      `Klaim minimal ${n} misi Poin Loyalty nyata lainnya pada hari ini.`,
      'daily_missions_claimed',
      n,
      20 + i * 22,
      'Misi',
      'Selesaikan',
      'extra_loyalty'
    )
  );

  return list;
}

export const LOYALTY_100_DAILY_MISSIONS: LoyaltyDailyMissionDefinition[] =
  build100DailyLoyaltyMissions();

export interface EffectiveLoyaltyDailyMission extends LoyaltyDailyMissionDefinition {
  enabled: boolean;
}

export function getEffectiveDailyLoyaltyMissions(
  rawConfig?: Partial<LoyaltyAdminConfig> | null
): EffectiveLoyaltyDailyMission[] {
  const cfg = normalizeLoyaltyAdminConfig(rawConfig);
  const limit = Math.max(1, Math.min(100, cfg.activeDailyMissionCount || 100));
  const mult = cfg.missionRewardMultiplier || 1;
  const overrides = cfg.missionOverrides || {};

  return LOYALTY_100_DAILY_MISSIONS.slice(0, limit).map((base) => {
    const ov = overrides[base.id];
    const target =
      ov && typeof ov.target === 'number' && Number.isFinite(ov.target) && ov.target > 0
        ? ov.target
        : base.target;
    const rewardPoints =
      ov && typeof ov.rewardPoints === 'number' && Number.isFinite(ov.rewardPoints) && ov.rewardPoints >= 0
        ? Math.round(ov.rewardPoints)
        : Math.max(1, Math.round(base.rewardPoints * mult));
    const enabled = ov && typeof ov.enabled === 'boolean' ? ov.enabled : true;
    return {
      ...base,
      target,
      rewardPoints,
      enabled,
    };
  });
}

export interface DailyLoyaltyRealActivityStats {
  transferCountToday: number;
  transferAmountToday: number;
  qrisPaymentCountToday: number;
  dailyTxCountToday: number;
  goldBuyCountToday: number;
  goldSellCountToday: number;
}

export function computeDailyTxActivityStats(
  accountId: string,
  transactions: Transaction[],
  todayWib: string = getWibDateString()
): DailyLoyaltyRealActivityStats {
  let transferCountToday = 0;
  let transferAmountToday = 0;
  let qrisPaymentCountToday = 0;
  let dailyTxCountToday = 0;
  let goldBuyCountToday = 0;
  let goldSellCountToday = 0;

  for (const tx of transactions) {
    if (tx.accountId !== accountId) continue;
    if (tx.status === 'pending' || tx.status === 'rejected') continue;
    const tsMs = Date.parse(tx.timestamp || '');
    if (!Number.isFinite(tsMs)) continue;
    if (getWibDateString(tsMs) !== todayWib) continue;

    dailyTxCountToday += 1;
    const t = String(tx.type || '').toLowerCase();
    const cat = String(tx.category || '').toLowerCase();
    const title = String(tx.title || '').toLowerCase();

    if (
      t === 'transfer_out' ||
      t === 'transfer_bebas_out' ||
      (t === 'chat_transfer' && tx.balanceDeducted)
    ) {
      transferCountToday += 1;
      transferAmountToday += Math.max(0, Number(tx.amount || 0));
    }
    if (
      t.includes('qris') ||
      t.includes('payment') ||
      t.includes('bill') ||
      t.includes('pulsa') ||
      t.includes('token') ||
      cat === 'payment' ||
      title.includes('qris') ||
      title.includes('bayar') ||
      title.includes('pulsa') ||
      title.includes('token')
    ) {
      qrisPaymentCountToday += 1;
    }
    if (t.includes('gold_buy') || title.includes('beli emas')) {
      goldBuyCountToday += 1;
    }
    if (t.includes('gold_sell') || title.includes('jual emas')) {
      goldSellCountToday += 1;
    }
  }

  return {
    transferCountToday,
    transferAmountToday,
    qrisPaymentCountToday,
    dailyTxCountToday,
    goldBuyCountToday,
    goldSellCountToday,
  };
}

export function evaluateDailyLoyaltyMissionProgress(
  mission: EffectiveLoyaltyDailyMission,
  rawState: LoyaltyAccountState | undefined,
  txStats: DailyLoyaltyRealActivityStats,
  todayWib: string = getWibDateString()
): {
  current: number;
  target: number;
  progressPercent: number;
  completed: boolean;
  claimed: boolean;
} {
  const state = ensureTodayLoyaltyAccountState(rawState, todayWib);
  const counters = state.dailyCounters || {};
  const claimedIds = state.dailyClaimedMissionIds || [];
  const claimed = claimedIds.includes(mission.id);

  let current = 0;
  switch (mission.metricKey) {
    case 'transfer_count':
      current = Math.max(txStats.transferCountToday, Number(counters.transfer_count || 0));
      break;
    case 'transfer_amount':
      current = Math.max(txStats.transferAmountToday, Number(counters.transfer_amount || 0));
      break;
    case 'qris_payment_count':
      current = Math.max(txStats.qrisPaymentCountToday, Number(counters.qris_payment_count || 0));
      break;
    case 'daily_tx_count':
      current = Math.max(txStats.dailyTxCountToday, Number(counters.daily_tx_count || 0));
      break;
    case 'gold_buy_count':
      current = Math.max(txStats.goldBuyCountToday, Number(counters.gold_buy_count || 0));
      break;
    case 'gold_sell_count':
      current = Math.max(txStats.goldSellCountToday, Number(counters.gold_sell_count || 0));
      break;
    case 'gold_any_count':
      current =
        Math.max(txStats.goldBuyCountToday, Number(counters.gold_buy_count || 0)) +
        Math.max(txStats.goldSellCountToday, Number(counters.gold_sell_count || 0));
      break;
    case 'social_total_count':
      current =
        Number(counters.chat_msg_count || 0) +
        Number(counters.status_post_count || 0) +
        Number(counters.chat_transfer_count || 0);
      break;
    case 'active_streak_days':
      current = state.freezeStage === 3 ? 0 : Math.max(0, Number(state.streakDays || 0));
      break;
    case 'daily_missions_claimed':
      current = claimedIds.filter((id) => id !== mission.id).length;
      break;
    case 'online_visit':
      current = Math.max(1, Number(counters.online_visit || 0));
      break;
    default:
      current = Math.max(0, Number(counters[mission.metricKey] || 0));
      break;
  }

  const target = Math.max(1, mission.target);
  const completed = current >= target;
  const progressPercent = completed
    ? 100
    : Math.max(0, Math.min(99, Math.round((current / target) * 100)));

  return {
    current,
    target,
    progressPercent,
    completed,
    claimed,
  };
}
