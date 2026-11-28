import {
  AccountLevelSystemConfig,
  BankAccount,
  LevelMilestoneReward,
  LevelXpSourceKey,
} from '../types/bank';
import { isAdminCardAccount, isUnlimitedNumber, UNLIMITED_BALANCE } from '../utils/bankUtils';
import { ProfileAchievementMetrics } from './profileAchievementsCatalog';
import { FEATURED_TITLES, getFeaturedTitleById } from './profileCustomizationCatalog';

export const MAX_REGULAR_ACCOUNT_LEVEL = 100;

export const LEVEL_XP_SOURCE_LABELS: Record<
  LevelXpSourceKey,
  { label: string; description: string }
> = {
  tx: {
    label: 'Transaksi & Transfer',
    description: 'Transfer, setor, tarik, deposito, dan pembayaran tagihan',
  },
  qris: {
    label: 'Pembayaran & Order QRIS',
    description: 'Transaksi QRIS merchant maupun order Top-Up QRIS LUNAS',
  },
  gold: {
    label: 'Jual / Beli Emas 24K',
    description: 'Setiap aktivitas pembelian maupun penjualan Emas Digital',
  },
  mission: {
    label: 'Klaim Misi Harian / Loyalty',
    description: 'Setiap misi harian atau misi Loyalty yang selesai diklaim',
  },
  streak: {
    label: 'Check-In & Streak Harian',
    description: 'Aktivasi streak harian dan pemulihan streak',
  },
  spin: {
    label: 'Putaran Spin Bingkai',
    description: 'Dihitung per putaran (1x atau 5x) di arena Spin Bingkai',
  },
  achievement: {
    label: 'Klaim Achievement Profil',
    description: 'Tambahan XP setiap kali nasabah mengklaim Achievement',
  },
};

export const DEFAULT_LEVEL_SYSTEM_CONFIG: AccountLevelSystemConfig = {
  enabled: true,
  xpPerSource: {
    tx: 45,
    qris: 75,
    gold: 65,
    mission: 90,
    streak: 110,
    spin: 40,
    achievement: 120,
  },
  milestones: [
    {
      id: 'lvl-ms-5',
      levelTarget: 5,
      enabled: true,
      rewardMoney: 150_000,
      rewardDiamonds: 15,
      rewardSpinCoins: 2,
      rewardSpinTokens: 20,
      note: 'Bonus Pembuka Nasabah Aktif Level 5',
    },
    {
      id: 'lvl-ms-10',
      levelTarget: 10,
      enabled: true,
      rewardMoney: 350_000,
      rewardDiamonds: 35,
      rewardSpinCoins: 5,
      rewardSpinTokens: 50,
      note: 'Apresiasi Nasabah Reguler Level 10',
    },
    {
      id: 'lvl-ms-20',
      levelTarget: 20,
      enabled: true,
      rewardMoney: 750_000,
      rewardDiamonds: 75,
      rewardSpinCoins: 10,
      rewardSpinTokens: 100,
      rewardTitleId: 'title-pioner-digital',
      note: 'Paket Kenaikan Level 20 + Gelar Pioner Digital',
    },
    {
      id: 'lvl-ms-35',
      levelTarget: 35,
      enabled: true,
      rewardMoney: 1_500_000,
      rewardDiamonds: 150,
      rewardSpinCoins: 20,
      rewardSpinTokens: 150,
      rewardTitleId: 'title-arsitek-impian',
      note: 'Paket Kenaikan Level 35 + Gelar Arsitek Impian',
    },
    {
      id: 'lvl-ms-50',
      levelTarget: 50,
      enabled: true,
      rewardMoney: 3_500_000,
      rewardDiamonds: 300,
      rewardSpinCoins: 35,
      rewardSpinTokens: 250,
      rewardTitleId: 'title-nasabah-prioritas',
      note: 'Pencapaian Setengah Jalan Level 50',
    },
    {
      id: 'lvl-ms-75',
      levelTarget: 75,
      enabled: true,
      rewardMoney: 7_500_000,
      rewardDiamonds: 600,
      rewardSpinCoins: 60,
      rewardSpinTokens: 400,
      rewardTitleId: 'title-saudagar-nusantara',
      note: 'Pencapaian Elite Level 75',
    },
    {
      id: 'lvl-ms-100',
      levelTarget: 100,
      enabled: true,
      rewardMoney: 25_000_000,
      rewardDiamonds: 1_500,
      rewardSpinCoins: 150,
      rewardSpinTokens: 500,
      rewardTitleId: 'title-sultan-nusantara',
      note: 'Puncak Maksimal Level 100 Bank Nusantara',
    },
  ],
};

/**
 * XP dibutuhkan untuk naik dari level `lv` ke `lv + 1`.
 */
export function getXpRequiredForNextLevel(level: number): number {
  const safeLv = Math.max(1, Math.min(MAX_REGULAR_ACCOUNT_LEVEL - 1, Math.floor(level)));
  return Math.round(90 + safeLv * 35 + Math.pow(safeLv, 1.4) * 3);
}

/**
 * Total XP kumulatif minimal untuk mencapai `level` (Lv 1 = 0 XP).
 */
export function getCumulativeXpForLevel(level: number): number {
  const target = Math.max(1, Math.min(MAX_REGULAR_ACCOUNT_LEVEL, Math.floor(level)));
  let total = 0;
  for (let lv = 1; lv < target; lv += 1) {
    total += getXpRequiredForNextLevel(lv);
  }
  return total;
}

export const MAX_REGULAR_CUMULATIVE_XP = getCumulativeXpForLevel(MAX_REGULAR_ACCOUNT_LEVEL);

export function computeLevelFromXp(xpRaw: number): {
  level: number;
  xp: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  isMaxLevel: boolean;
} {
  const safeXp = Math.max(0, Math.floor(Number(xpRaw) || 0));
  let lv = 1;
  let remaining = safeXp;

  while (lv < MAX_REGULAR_ACCOUNT_LEVEL) {
    const req = getXpRequiredForNextLevel(lv);
    if (remaining < req) {
      const progressPct = Math.min(100, Math.max(0, Math.round((remaining / req) * 100)));
      return {
        level: lv,
        xp: safeXp,
        xpInCurrentLevel: remaining,
        xpForNextLevel: req,
        progressPct,
        isMaxLevel: false,
      };
    }
    remaining -= req;
    lv += 1;
  }

  return {
    level: MAX_REGULAR_ACCOUNT_LEVEL,
    xp: safeXp,
    xpInCurrentLevel: 0,
    xpForNextLevel: 0,
    progressPct: 100,
    isMaxLevel: true,
  };
}

export interface AccountLevelSnapshot {
  isInfinity: boolean;
  level: number;
  displayLabel: string;
  shortLabel: string;
  xp: number;
  xpInCurrentLevel: number;
  xpForNextLevel: number;
  progressPct: number;
  isMaxLevel: boolean;
}

export function getAccountLevelSnapshot(
  account: Partial<BankAccount> | null | undefined,
  options?: { isDisguisedViewer?: boolean }
): AccountLevelSnapshot {
  if (!account) {
    return {
      isInfinity: false,
      level: 1,
      displayLabel: 'Lv. 1',
      shortLabel: 'Lv.1',
      xp: 0,
      xpInCurrentLevel: 0,
      xpForNextLevel: getXpRequiredForNextLevel(1),
      progressPct: 0,
      isMaxLevel: false,
    };
  }

  const isDisguised = Boolean(options?.isDisguisedViewer);
  const isAdmin =
    !isDisguised &&
    (isAdminCardAccount(account) || isUnlimitedNumber(account.accountLevel));

  if (isAdmin) {
    return {
      isInfinity: true,
      level: UNLIMITED_BALANCE,
      displayLabel: 'Lv. ∞',
      shortLabel: 'Lv.∞',
      xp: UNLIMITED_BALANCE,
      xpInCurrentLevel: 0,
      xpForNextLevel: 0,
      progressPct: 100,
      isMaxLevel: true,
    };
  }

  const rawXp = isDisguised
    ? account.preAdminSnapshot?.accountXp ?? 0
    : Math.max(0, Math.floor(Number(account.accountXp) || 0));

  const explicitLevel = isDisguised
    ? account.preAdminSnapshot?.accountLevel
    : account.accountLevel;

  // Gunakan tingkat tertinggi yang valid antara perhitungan XP atau level manual admin
  const fromXp = computeLevelFromXp(rawXp);
  const cleanExplicit =
    typeof explicitLevel === 'number' && !isUnlimitedNumber(explicitLevel) && explicitLevel >= 1
      ? Math.min(MAX_REGULAR_ACCOUNT_LEVEL, Math.floor(explicitLevel))
      : 1;

  if (cleanExplicit > fromXp.level) {
    const floorXp = getCumulativeXpForLevel(cleanExplicit);
    const req = cleanExplicit >= MAX_REGULAR_ACCOUNT_LEVEL ? 0 : getXpRequiredForNextLevel(cleanExplicit);
    return {
      isInfinity: false,
      level: cleanExplicit,
      displayLabel: `Lv. ${cleanExplicit}`,
      shortLabel: `Lv.${cleanExplicit}`,
      xp: Math.max(rawXp, floorXp),
      xpInCurrentLevel: 0,
      xpForNextLevel: req,
      progressPct: cleanExplicit >= MAX_REGULAR_ACCOUNT_LEVEL ? 100 : 0,
      isMaxLevel: cleanExplicit >= MAX_REGULAR_ACCOUNT_LEVEL,
    };
  }

  return {
    isInfinity: false,
    level: fromXp.level,
    displayLabel: `Lv. ${fromXp.level}`,
    shortLabel: `Lv.${fromXp.level}`,
    xp: fromXp.xp,
    xpInCurrentLevel: fromXp.xpInCurrentLevel,
    xpForNextLevel: fromXp.xpForNextLevel,
    progressPct: fromXp.progressPct,
    isMaxLevel: fromXp.isMaxLevel,
  };
}

export function normalizeLevelMilestoneReward(
  raw: Partial<LevelMilestoneReward>,
  index = 0
): LevelMilestoneReward {
  const levelTarget = Math.max(
    1,
    Math.min(MAX_REGULAR_ACCOUNT_LEVEL, Math.round(Number(raw.levelTarget) || 1))
  );
  const validTitle =
    raw.rewardTitleId && FEATURED_TITLES.some((t) => t.id === raw.rewardTitleId)
      ? raw.rewardTitleId
      : undefined;

  return {
    id: raw.id && String(raw.id).trim() ? String(raw.id).trim() : `lvl-ms-${levelTarget}-${index}`,
    levelTarget,
    enabled: raw.enabled !== false,
    rewardMoney: Math.max(0, Math.round(Number(raw.rewardMoney) || 0)),
    rewardDiamonds: Math.max(0, Math.round(Number(raw.rewardDiamonds) || 0)),
    rewardSpinCoins: Math.max(0, Math.round(Number(raw.rewardSpinCoins) || 0)),
    rewardSpinTokens: Math.max(0, Math.round(Number(raw.rewardSpinTokens) || 0)),
    rewardTitleId: validTitle,
    note: raw.note ? String(raw.note).slice(0, 120) : undefined,
  };
}

export function normalizeAccountLevelSystemConfig(
  raw?: Partial<AccountLevelSystemConfig> | null
): AccountLevelSystemConfig {
  const baseXp = DEFAULT_LEVEL_SYSTEM_CONFIG.xpPerSource;
  const incXp = (raw?.xpPerSource || {}) as Partial<Record<LevelXpSourceKey, number>>;
  const clampXp = (val: unknown, fallback: number) => {
    const n = Number(val);
    return Number.isFinite(n) && n >= 0 ? Math.min(100_000, Math.round(n)) : fallback;
  };

  const rawMilestones = Array.isArray(raw?.milestones)
    ? raw!.milestones
    : DEFAULT_LEVEL_SYSTEM_CONFIG.milestones;

  // Dedupe levelTarget keeping latest entry, sorted ascending
  const byLevel = new Map<number, LevelMilestoneReward>();
  rawMilestones.forEach((m, idx) => {
    const norm = normalizeLevelMilestoneReward(m, idx);
    byLevel.set(norm.levelTarget, norm);
  });

  const milestones = Array.from(byLevel.values()).sort(
    (a, b) => a.levelTarget - b.levelTarget
  );

  return {
    enabled: raw?.enabled !== false,
    xpPerSource: {
      tx: clampXp(incXp.tx, baseXp.tx),
      qris: clampXp(incXp.qris, baseXp.qris),
      gold: clampXp(incXp.gold, baseXp.gold),
      mission: clampXp(incXp.mission, baseXp.mission),
      streak: clampXp(incXp.streak, baseXp.streak),
      spin: clampXp(incXp.spin, baseXp.spin),
      achievement: clampXp(incXp.achievement, baseXp.achievement),
    },
    milestones,
    updatedAtIso: raw?.updatedAtIso || DEFAULT_LEVEL_SYSTEM_CONFIG.updatedAtIso,
  };
}

export function estimateRetroactiveXpFromMetrics(
  metrics: ProfileAchievementMetrics,
  claimedAchievementsCount: number,
  config: AccountLevelSystemConfig
): number {
  const src = config.xpPerSource;
  const txOnly = Math.max(0, metrics.txCount - metrics.qrisTxCount);
  const estimated =
    txOnly * src.tx +
    metrics.qrisTxCount * src.qris +
    Math.min(50, Math.round(metrics.goldGrams * 2)) * src.gold +
    metrics.claimedMissionsCount * src.mission +
    metrics.streakDays * src.streak +
    metrics.spinCountTotal * src.spin +
    claimedAchievementsCount * src.achievement;

  return Math.max(0, Math.min(MAX_REGULAR_CUMULATIVE_XP, Math.round(estimated)));
}

export function formatMilestoneRewardSummary(m: LevelMilestoneReward): string {
  const parts: string[] = [];
  if (m.rewardMoney > 0) parts.push(`Rp ${m.rewardMoney.toLocaleString('id-ID')}`);
  if (m.rewardDiamonds > 0) parts.push(`${m.rewardDiamonds.toLocaleString('id-ID')} Permata`);
  if (m.rewardSpinCoins > 0) parts.push(`${m.rewardSpinCoins.toLocaleString('id-ID')} Coin Spin`);
  if (m.rewardSpinTokens > 0) parts.push(`${m.rewardSpinTokens.toLocaleString('id-ID')} Token Bingkai`);
  if (m.rewardTitleId) {
    const t = getFeaturedTitleById(m.rewardTitleId);
    if (t) parts.push(`Gelar "${t.label}"`);
  }
  return parts.length > 0 ? parts.join(' + ') : 'Tanpa nominal';
}
