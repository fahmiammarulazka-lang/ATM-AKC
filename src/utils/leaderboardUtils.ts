import {
  AccountTopLeaderboardEntry,
  BankAccount,
  CardTier,
  LeaderboardAccountEligibilityResult,
  LeaderboardBadgeTierStyle,
  LeaderboardCategoryConfig,
  LeaderboardCategoryKey,
  LeaderboardMinCardTier,
  LeaderboardMinEntryCheckResult,
  LeaderboardMinEntryConfig,
  LeaderboardSystemConfig,
  Transaction,
} from '../types/bank';
import {
  formatCompactAssetCount,
  formatMobileCompactRupiah,
  isAdminCardAccount,
  isUnlimitedNumber,
} from './bankUtils';

export const LEADERBOARD_MIN_CARD_TIER_ORDER: Record<LeaderboardMinCardTier, number> = {
  regular: 1,
  gold: 2,
  premium: 3,
  platinum: 4,
};

export const LEADERBOARD_MIN_CARD_TIER_LABELS: Record<LeaderboardMinCardTier, string> = {
  regular: 'Reguler',
  gold: 'Gold',
  premium: 'Premium',
  platinum: 'Platinum',
};

export const DEFAULT_LEADERBOARD_MIN_ENTRY_CONFIG: LeaderboardMinEntryConfig = {
  enabled: false,
  evaluationMode: 'ALL',
  showRequirementsBanner: true,
  categoryAssetMinEnabled: true,
  minJobLevelEnabled: false,
  minJobLevel: 2,
  minCardTierEnabled: false,
  minCardTier: 'gold',
  minTxCountEnabled: false,
  minTxCount: 1,
  minAccountAgeDaysEnabled: false,
  minAccountAgeDays: 1,
  requireVerified: false,
  whitelistedAccountIds: [],
};

export function normalizeLeaderboardMinEntryConfig(
  raw?: Partial<LeaderboardMinEntryConfig> | null
): LeaderboardMinEntryConfig {
  const safeTier: LeaderboardMinCardTier =
    raw?.minCardTier === 'regular' ||
    raw?.minCardTier === 'gold' ||
    raw?.minCardTier === 'premium' ||
    raw?.minCardTier === 'platinum'
      ? raw.minCardTier
      : DEFAULT_LEADERBOARD_MIN_ENTRY_CONFIG.minCardTier;

  return {
    enabled: Boolean(raw?.enabled),
    evaluationMode: raw?.evaluationMode === 'ANY' ? 'ANY' : 'ALL',
    showRequirementsBanner: raw?.showRequirementsBanner !== false,
    categoryAssetMinEnabled: raw?.categoryAssetMinEnabled !== false,
    minJobLevelEnabled: Boolean(raw?.minJobLevelEnabled),
    minJobLevel: Math.max(1, Math.min(50, Math.round(Number(raw?.minJobLevel ?? 2) || 2))),
    minCardTierEnabled: Boolean(raw?.minCardTierEnabled),
    minCardTier: safeTier,
    minTxCountEnabled: Boolean(raw?.minTxCountEnabled),
    minTxCount: Math.max(0, Math.round(Number(raw?.minTxCount ?? 1) || 0)),
    minAccountAgeDaysEnabled: Boolean(raw?.minAccountAgeDaysEnabled),
    minAccountAgeDays: Math.max(0, Math.round(Number(raw?.minAccountAgeDays ?? 1) || 0)),
    requireVerified: Boolean(raw?.requireVerified),
    whitelistedAccountIds: Array.isArray(raw?.whitelistedAccountIds)
      ? Array.from(
          new Set(raw.whitelistedAccountIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0))
        )
      : [],
  };
}

export function getSuggestedMinEntryValueForCategory(
  key: LeaderboardCategoryKey,
  preset: 'standard' | 'sultan'
): number {
  if (preset === 'sultan') {
    switch (key) {
      case 'balance':
        return 10_000_000;
      case 'spinCoins':
        return 5_000;
      case 'diamonds':
        return 500;
      case 'goldGrams':
        return 5;
      case 'rewardPoints':
        return 5_000;
      case 'jobLevel':
        return 10;
      case 'txCount':
        return 15;
      default:
        return 1_000;
    }
  }
  switch (key) {
    case 'balance':
      return 50_000;
    case 'spinCoins':
      return 50;
    case 'diamonds':
      return 10;
    case 'goldGrams':
      return 0.1;
    case 'rewardPoints':
      return 100;
    case 'jobLevel':
      return 2;
    case 'txCount':
      return 1;
    default:
      return 10;
  }
}

export function buildLeaderboardMinEntryPreset(
  preset: 'open' | 'standard' | 'sultan',
  categories: LeaderboardCategoryConfig[],
  existingWhitelist: string[] = []
): {
  minEntryConfig: LeaderboardMinEntryConfig;
  categories: LeaderboardCategoryConfig[];
} {
  if (preset === 'open') {
    return {
      minEntryConfig: {
        ...DEFAULT_LEADERBOARD_MIN_ENTRY_CONFIG,
        enabled: false,
        showRequirementsBanner: true,
        whitelistedAccountIds: [...existingWhitelist],
      },
      categories: categories.map((c) => ({
        ...c,
        minEntryEnabled: c.minEntryEnabled !== false,
      })),
    };
  }

  if (preset === 'standard') {
    return {
      minEntryConfig: {
        enabled: true,
        evaluationMode: 'ALL',
        showRequirementsBanner: true,
        categoryAssetMinEnabled: true,
        minJobLevelEnabled: true,
        minJobLevel: 2,
        minCardTierEnabled: false,
        minCardTier: 'gold',
        minTxCountEnabled: true,
        minTxCount: 1,
        minAccountAgeDaysEnabled: false,
        minAccountAgeDays: 1,
        requireVerified: false,
        whitelistedAccountIds: [...existingWhitelist],
      },
      categories: categories.map((c) => ({
        ...c,
        minEntryEnabled: true,
        minEntryValue: getSuggestedMinEntryValueForCategory(c.key, 'standard'),
      })),
    };
  }

  // preset === 'sultan'
  return {
    minEntryConfig: {
      enabled: true,
      evaluationMode: 'ALL',
      showRequirementsBanner: true,
      categoryAssetMinEnabled: true,
      minJobLevelEnabled: true,
      minJobLevel: 10,
      minCardTierEnabled: true,
      minCardTier: 'platinum',
      minTxCountEnabled: true,
      minTxCount: 15,
      minAccountAgeDaysEnabled: true,
      minAccountAgeDays: 7,
      requireVerified: true,
      whitelistedAccountIds: [...existingWhitelist],
    },
    categories: categories.map((c) => ({
      ...c,
      minEntryEnabled: true,
      minEntryValue: getSuggestedMinEntryValueForCategory(c.key, 'sultan'),
    })),
  };
}

export function getLeaderboardBadgeTierStyle(rank: number): LeaderboardBadgeTierStyle {
  if (rank === 1) return 'gold_1';
  if (rank === 2) return 'gray_2';
  if (rank === 3) return 'brown_3';
  return 'charcoal_4_100';
}

export function getCompletedTransactionCount(
  accountId: string,
  transactions: Transaction[]
): number {
  let count = 0;
  for (const t of transactions) {
    if (t.accountId !== accountId) continue;
    if (t.status === 'pending' || t.status === 'rejected') continue;
    count += 1;
  }
  return count;
}

export function getAccountAgeDays(account: BankAccount, nowMs: number = Date.now()): number {
  if (!account.createdAt) return 0;
  const parsed = Date.parse(account.createdAt);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor((nowMs - parsed) / 86_400_000));
}

export function getPublicCardTierRank(
  account: BankAccount,
  isDisguised: boolean,
  disguisedPublicTier?: CardTier
): { tier: LeaderboardMinCardTier; rank: number } {
  let resolved: CardTier = account.cardTier;
  if (isDisguised) {
    resolved =
      disguisedPublicTier && disguisedPublicTier !== 'admin'
        ? disguisedPublicTier
        : 'regular';
  }
  if (resolved === 'platinum' || resolved === 'admin') {
    return { tier: 'platinum', rank: LEADERBOARD_MIN_CARD_TIER_ORDER.platinum };
  }
  if (resolved === 'premium') {
    return { tier: 'premium', rank: LEADERBOARD_MIN_CARD_TIER_ORDER.premium };
  }
  if (resolved === 'gold') {
    return { tier: 'gold', rank: LEADERBOARD_MIN_CARD_TIER_ORDER.gold };
  }
  return { tier: 'regular', rank: LEADERBOARD_MIN_CARD_TIER_ORDER.regular };
}

export function getLeaderboardMetricScore(
  account: BankAccount,
  key: LeaderboardCategoryKey,
  transactions: Transaction[],
  options?: { treatAsPublicDisguised?: boolean }
): { score: number; isUnlimited: boolean } {
  const isDisguised = Boolean(options?.treatAsPublicDisguised);
  const isAdmin = !isDisguised && isAdminCardAccount(account);
  const snap = account.preAdminSnapshot;
  switch (key) {
    case 'balance': {
      const rawVal = isDisguised
        ? Number(snap?.balance ?? (isUnlimitedNumber(account.balance) ? 0 : account.balance ?? 0))
        : Number(account.balance ?? 0);
      return {
        score: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)) ? Number.MAX_SAFE_INTEGER : Math.max(0, rawVal),
        isUnlimited: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)),
      };
    }
    case 'spinCoins': {
      const rawVal = isDisguised
        ? Number(snap?.spinCoins ?? (isUnlimitedNumber(account.spinCoins) ? 0 : account.spinCoins ?? 0))
        : Number(account.spinCoins ?? 0);
      return {
        score: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)) ? Number.MAX_SAFE_INTEGER : Math.max(0, rawVal),
        isUnlimited: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)),
      };
    }
    case 'diamonds': {
      const rawVal = isDisguised
        ? Number(snap?.diamonds ?? (isUnlimitedNumber(account.diamonds) ? 0 : account.diamonds ?? 0))
        : Number(account.diamonds ?? 0);
      return {
        score: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)) ? Number.MAX_SAFE_INTEGER : Math.max(0, rawVal),
        isUnlimited: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)),
      };
    }
    case 'goldGrams': {
      const val = Number(account.goldGrams ?? 0);
      return {
        score: isAdmin || (!isDisguised && isUnlimitedNumber(val)) ? Number.MAX_SAFE_INTEGER : Math.max(0, val),
        isUnlimited: isAdmin || (!isDisguised && isUnlimitedNumber(val)),
      };
    }
    case 'rewardPoints': {
      const rawVal = isDisguised
        ? Number(snap?.rewardPoints ?? (isUnlimitedNumber(account.rewardPoints) ? 0 : account.rewardPoints ?? 0))
        : Number(account.rewardPoints ?? 0);
      return {
        score: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)) ? Number.MAX_SAFE_INTEGER : Math.max(0, rawVal),
        isUnlimited: isAdmin || (!isDisguised && isUnlimitedNumber(rawVal)),
      };
    }
    case 'jobLevel': {
      const rawVal = isDisguised
        ? Number(snap?.jobLevel ?? (isUnlimitedNumber(account.jobLevel) ? 1 : account.jobLevel ?? 1))
        : Number(account.jobLevel ?? 1);
      const isInf = isAdmin || (!isDisguised && isUnlimitedNumber(rawVal));
      return {
        score: isInf ? Number.MAX_SAFE_INTEGER : Math.max(1, rawVal),
        isUnlimited: isInf,
      };
    }
    case 'txCount': {
      const count = getCompletedTransactionCount(account.id, transactions);
      return {
        score: count,
        isUnlimited: false,
      };
    }
    default: {
      const dynamicVal = Number((account as unknown as Record<string, unknown>)[key] ?? 0);
      return {
        score: Number.isFinite(dynamicVal) ? Math.max(0, dynamicVal) : 0,
        isUnlimited: false,
      };
    }
  }
}

export function formatLeaderboardMetricValue(
  score: number,
  key: LeaderboardCategoryKey,
  unitLabel?: string,
  isUnlimited = false,
  compact = false
): string {
  if (isUnlimited) return key === 'jobLevel' ? 'Level ∞' : '∞';
  if (key === 'balance') {
    return compact
      ? formatMobileCompactRupiah(score, { isAdmin: false })
      : `Rp ${Math.round(score).toLocaleString('id-ID')}`;
  }
  if (key === 'goldGrams') {
    return `${score.toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr`;
  }
  if (key === 'jobLevel') {
    return `Lv.${Math.max(1, Math.round(score))}`;
  }
  if (key === 'txCount') {
    return `${Math.round(score).toLocaleString('id-ID')} Tx`;
  }
  const numStr = compact
    ? formatCompactAssetCount(score, { isAdmin: false })
    : Math.round(score).toLocaleString('id-ID');
  return unitLabel ? `${numStr} ${unitLabel}` : numStr;
}

export function evaluateAccountLeaderboardEligibility(
  account: BankAccount,
  category: LeaderboardCategoryConfig,
  config: LeaderboardSystemConfig,
  transactions: Transaction[],
  options?: {
    disguisedAdminIds?: Set<string>;
    disguisedPublicTierMap?: Record<string, CardTier>;
    nowMs?: number;
  }
): LeaderboardAccountEligibilityResult {
  const minCfg = normalizeLeaderboardMinEntryConfig(config.minEntryConfig);
  const isDisguised = Boolean(options?.disguisedAdminIds?.has(account.id));

  // Kartu Tier Admin tanpa Mode Penyamaran bebas syarat (tampil di blok Kehormatan Admin di luar persaingan nasabah)
  if (!isDisguised && isAdminCardAccount(account)) {
    return {
      eligible: true,
      noRequirementsActive: false,
      isAdminBypass: true,
      isWhitelisted: false,
      evaluationMode: minCfg.evaluationMode,
      checks: [],
      passedCount: 0,
      totalChecks: 0,
      overallProgressPercent: 100,
    };
  }

  // Filter status akun dasar (Banned / Pending)
  if (config.hideBannedAccounts && (account.cardStatus === 'banned' || account.status === 'banned')) {
    return {
      eligible: false,
      noRequirementsActive: false,
      isAdminBypass: false,
      isWhitelisted: false,
      excludedByAccountStatus: true,
      evaluationMode: minCfg.evaluationMode,
      checks: [],
      passedCount: 0,
      totalChecks: 0,
      overallProgressPercent: 0,
    };
  }
  if (
    config.hidePendingAccounts &&
    (account.cardStatus === 'pending' || account.cardStatus === 'rejected')
  ) {
    return {
      eligible: false,
      noRequirementsActive: false,
      isAdminBypass: false,
      isWhitelisted: false,
      excludedByAccountStatus: true,
      evaluationMode: minCfg.evaluationMode,
      checks: [],
      passedCount: 0,
      totalChecks: 0,
      overallProgressPercent: 0,
    };
  }

  const isWhitelisted = minCfg.whitelistedAccountIds.includes(account.id);

  // Jika Saklar Global OFF atau Saklar Khusus Kategori ini OFF -> tidak ada syarat minimal
  if (!minCfg.enabled || category.minEntryEnabled === false) {
    return {
      eligible: true,
      noRequirementsActive: true,
      isAdminBypass: false,
      isWhitelisted,
      evaluationMode: minCfg.evaluationMode,
      checks: [],
      passedCount: 0,
      totalChecks: 0,
      overallProgressPercent: 100,
    };
  }

  const checks: LeaderboardMinEntryCheckResult[] = [];

  // 1. Nominal minimal aset kategori ini
  const catMinVal = Number(category.minEntryValue ?? 0);
  if (minCfg.categoryAssetMinEnabled && Number.isFinite(catMinVal) && catMinVal > 0) {
    const metric = getLeaderboardMetricScore(account, category.key, transactions, {
      treatAsPublicDisguised: isDisguised,
    });
    const passed = metric.isUnlimited || metric.score >= catMinVal;
    const pct = passed
      ? 100
      : Math.max(0, Math.min(99, Math.round((Math.max(0, metric.score) / catMinVal) * 100)));
    const shortfall = Math.max(0, catMinVal - metric.score);
    checks.push({
      id: 'categoryAsset',
      label: `Minimal ${category.label}`,
      passed,
      currentDisplay: formatLeaderboardMetricValue(
        metric.score,
        category.key,
        category.unitLabel,
        metric.isUnlimited
      ),
      targetDisplay: formatLeaderboardMetricValue(catMinVal, category.key, category.unitLabel, false),
      progressPercent: pct,
      remainingText: passed
        ? 'Terpenuhi'
        : `Kurang ${formatLeaderboardMetricValue(shortfall, category.key, category.unitLabel, false)} lagi`,
    });
  }

  // 2. Minimal Level Pekerjaan
  if (minCfg.minJobLevelEnabled && minCfg.minJobLevel > 0) {
    const jobMetric = getLeaderboardMetricScore(account, 'jobLevel', transactions, {
      treatAsPublicDisguised: isDisguised,
    });
    const currentLvl = jobMetric.isUnlimited ? minCfg.minJobLevel : Math.max(1, Math.round(jobMetric.score));
    const passed = jobMetric.isUnlimited || currentLvl >= minCfg.minJobLevel;
    const pct = passed
      ? 100
      : Math.max(0, Math.min(99, Math.round((currentLvl / minCfg.minJobLevel) * 100)));
    const diff = Math.max(0, minCfg.minJobLevel - currentLvl);
    checks.push({
      id: 'minJobLevel',
      label: 'Minimal Level Pekerjaan',
      passed,
      currentDisplay: jobMetric.isUnlimited ? 'Level ∞' : `Lv.${currentLvl}`,
      targetDisplay: `Lv.${minCfg.minJobLevel}`,
      progressPercent: pct,
      remainingText: passed ? 'Terpenuhi' : `Naik ${diff} Level lagi`,
    });
  }

  // 3. Minimal Tier Kartu ATM
  if (minCfg.minCardTierEnabled) {
    const reqRank = LEADERBOARD_MIN_CARD_TIER_ORDER[minCfg.minCardTier];
    const currentTierInfo = getPublicCardTierRank(
      account,
      isDisguised,
      options?.disguisedPublicTierMap?.[account.id]
    );
    const passed = currentTierInfo.rank >= reqRank;
    const pct = passed
      ? 100
      : Math.max(10, Math.min(95, Math.round((currentTierInfo.rank / reqRank) * 100)));
    checks.push({
      id: 'minCardTier',
      label: 'Minimal Tier Kartu ATM',
      passed,
      currentDisplay: LEADERBOARD_MIN_CARD_TIER_LABELS[currentTierInfo.tier],
      targetDisplay: LEADERBOARD_MIN_CARD_TIER_LABELS[minCfg.minCardTier],
      progressPercent: pct,
      remainingText: passed
        ? 'Terpenuhi'
        : `Upgrade ke Kartu ${LEADERBOARD_MIN_CARD_TIER_LABELS[minCfg.minCardTier]}`,
    });
  }

  // 4. Minimal Total Transaksi Selesai
  if (minCfg.minTxCountEnabled && minCfg.minTxCount > 0) {
    const txCount = getCompletedTransactionCount(account.id, transactions);
    const passed = txCount >= minCfg.minTxCount;
    const pct = passed
      ? 100
      : Math.max(0, Math.min(99, Math.round((txCount / minCfg.minTxCount) * 100)));
    const diff = Math.max(0, minCfg.minTxCount - txCount);
    checks.push({
      id: 'minTxCount',
      label: 'Minimal Transaksi Selesai',
      passed,
      currentDisplay: `${txCount.toLocaleString('id-ID')} Tx`,
      targetDisplay: `${minCfg.minTxCount.toLocaleString('id-ID')} Tx`,
      progressPercent: pct,
      remainingText: passed ? 'Terpenuhi' : `Kurang ${diff.toLocaleString('id-ID')} transaksi lagi`,
    });
  }

  // 5. Minimal Umur Akun Terdaftar (Hari)
  if (minCfg.minAccountAgeDaysEnabled && minCfg.minAccountAgeDays > 0) {
    const ageDays = getAccountAgeDays(account, options?.nowMs);
    const passed = ageDays >= minCfg.minAccountAgeDays;
    const pct = passed
      ? 100
      : Math.max(0, Math.min(99, Math.round((ageDays / minCfg.minAccountAgeDays) * 100)));
    const diff = Math.max(0, minCfg.minAccountAgeDays - ageDays);
    checks.push({
      id: 'minAccountAgeDays',
      label: 'Minimal Umur Akun',
      passed,
      currentDisplay: `${ageDays} Hari`,
      targetDisplay: `${minCfg.minAccountAgeDays} Hari`,
      progressPercent: pct,
      remainingText: passed ? 'Terpenuhi' : `Kurang ${diff} hari lagi`,
    });
  }

  // 6. Wajib Verifikasi Centang Biru
  if (minCfg.requireVerified) {
    const passed = Boolean(account.isVerified);
    checks.push({
      id: 'requireVerified',
      label: 'Verifikasi Centang Biru',
      passed,
      currentDisplay: passed ? 'Terverifikasi' : 'Belum Terverifikasi',
      targetDisplay: 'Wajib Centang Biru',
      progressPercent: passed ? 100 : 0,
      remainingText: passed ? 'Terpenuhi' : 'Wajib verifikasi Centang Biru',
    });
  }

  if (checks.length === 0) {
    return {
      eligible: true,
      noRequirementsActive: true,
      isAdminBypass: false,
      isWhitelisted,
      evaluationMode: minCfg.evaluationMode,
      checks: [],
      passedCount: 0,
      totalChecks: 0,
      overallProgressPercent: 100,
    };
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const passedByRules =
    minCfg.evaluationMode === 'ANY' ? passedCount > 0 : passedCount === checks.length;
  const eligible = isWhitelisted || passedByRules;

  const overallProgressPercent = eligible
    ? 100
    : minCfg.evaluationMode === 'ANY'
    ? Math.max(...checks.map((c) => c.progressPercent))
    : Math.round(checks.reduce((acc, c) => acc + c.progressPercent, 0) / checks.length);

  return {
    eligible,
    noRequirementsActive: false,
    isAdminBypass: false,
    isWhitelisted,
    evaluationMode: minCfg.evaluationMode,
    checks,
    passedCount,
    totalChecks: checks.length,
    overallProgressPercent,
  };
}

export function getActiveLeaderboardRequirementSummaries(
  category: LeaderboardCategoryConfig,
  config: LeaderboardSystemConfig
): {
  active: boolean;
  evaluationMode: 'ALL' | 'ANY';
  showBanner: boolean;
  items: string[];
} {
  const minCfg = normalizeLeaderboardMinEntryConfig(config.minEntryConfig);
  if (!minCfg.enabled || category.minEntryEnabled === false) {
    return {
      active: false,
      evaluationMode: minCfg.evaluationMode,
      showBanner: minCfg.showRequirementsBanner,
      items: [],
    };
  }

  const items: string[] = [];
  const catMinVal = Number(category.minEntryValue ?? 0);
  if (minCfg.categoryAssetMinEnabled && Number.isFinite(catMinVal) && catMinVal > 0) {
    items.push(
      `${category.label} ≥ ${formatLeaderboardMetricValue(catMinVal, category.key, category.unitLabel, false)}`
    );
  }
  if (minCfg.minJobLevelEnabled && minCfg.minJobLevel > 0) {
    items.push(`Level Pekerjaan ≥ Lv.${minCfg.minJobLevel}`);
  }
  if (minCfg.minCardTierEnabled) {
    items.push(`Kartu ATM ≥ ${LEADERBOARD_MIN_CARD_TIER_LABELS[minCfg.minCardTier]}`);
  }
  if (minCfg.minTxCountEnabled && minCfg.minTxCount > 0) {
    items.push(`Transaksi Selesai ≥ ${minCfg.minTxCount.toLocaleString('id-ID')} Tx`);
  }
  if (minCfg.minAccountAgeDaysEnabled && minCfg.minAccountAgeDays > 0) {
    items.push(`Umur Akun ≥ ${minCfg.minAccountAgeDays} Hari`);
  }
  if (minCfg.requireVerified) {
    items.push('Wajib Centang Biru');
  }

  return {
    active: items.length > 0,
    evaluationMode: minCfg.evaluationMode,
    showBanner: minCfg.showRequirementsBanner,
    items,
  };
}

export function filterEligibleLeaderboardAccounts(
  accounts: BankAccount[],
  config: LeaderboardSystemConfig,
  disguisedAdminIds?: Set<string>
): BankAccount[] {
  return accounts.filter((acc) => {
    if (!acc || !acc.id) return false;
    const isDisguised = Boolean(disguisedAdminIds?.has(acc.id));
    if (!isDisguised && isAdminCardAccount(acc)) {
      // Kartu Tier Admin yang tidak menyamar tampil pada blok Kehormatan Admin di luar persaingan nasabah
      if (!config.showAdminTier) return false;
      return false;
    }
    if (config.hideBannedAccounts && (acc.cardStatus === 'banned' || acc.status === 'banned')) {
      return false;
    }
    if (config.hidePendingAccounts && (acc.cardStatus === 'pending' || acc.cardStatus === 'rejected')) {
      return false;
    }
    return true;
  });
}

export function computeLeaderboardRankingForCategory(
  accounts: BankAccount[],
  category: LeaderboardCategoryConfig,
  config: LeaderboardSystemConfig,
  transactions: Transaction[],
  disguisedAdminIds?: Set<string>,
  disguisedPublicTierMap?: Record<string, CardTier>
): Array<{
  account: BankAccount;
  rank: number;
  score: number;
  isUnlimited: boolean;
  isDisguised?: boolean;
  isWhitelisted?: boolean;
}> {
  const baseEligible = filterEligibleLeaderboardAccounts(accounts, config, disguisedAdminIds);
  const scored: Array<{
    account: BankAccount;
    score: number;
    isUnlimited: boolean;
    isDisguised: boolean;
    isWhitelisted: boolean;
  }> = [];

  for (const account of baseEligible) {
    const eligibility = evaluateAccountLeaderboardEligibility(
      account,
      category,
      config,
      transactions,
      { disguisedAdminIds, disguisedPublicTierMap }
    );
    if (!eligibility.eligible) continue;

    const isDisguised = Boolean(disguisedAdminIds?.has(account.id));
    const metric = getLeaderboardMetricScore(account, category.key, transactions, {
      treatAsPublicDisguised: isDisguised,
    });
    scored.push({
      account,
      score: metric.score,
      isUnlimited: metric.isUnlimited,
      isDisguised,
      isWhitelisted: eligibility.isWhitelisted,
    });
  }

  scored.sort((a, b) => {
    if (a.isUnlimited !== b.isUnlimited) return a.isUnlimited ? -1 : 1;
    if (b.score !== a.score) return b.score - a.score;
    return String(a.account.createdAt || '').localeCompare(String(b.account.createdAt || ''));
  });

  return scored.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

export interface LeaderboardEligibilityPreviewSummary {
  totalCandidates: number;
  eligibleCount: number;
  disqualifiedCount: number;
  whitelistedBypassCount: number;
  adminBypassCount: number;
  disqualifiedSamples: Array<{
    account: BankAccount;
    eligibility: LeaderboardAccountEligibilityResult;
  }>;
}

export function computeLeaderboardEligibilityPreview(
  accounts: BankAccount[],
  category: LeaderboardCategoryConfig,
  config: LeaderboardSystemConfig,
  transactions: Transaction[],
  disguisedAdminIds?: Set<string>,
  disguisedPublicTierMap?: Record<string, CardTier>
): LeaderboardEligibilityPreviewSummary {
  const baseCandidates = filterEligibleLeaderboardAccounts(accounts, config, disguisedAdminIds);
  const adminBypassCount = accounts.filter(
    (acc) => acc && acc.id && isAdminCardAccount(acc) && !disguisedAdminIds?.has(acc.id)
  ).length;

  let eligibleCount = 0;
  let disqualifiedCount = 0;
  let whitelistedBypassCount = 0;
  const disqualifiedSamples: Array<{
    account: BankAccount;
    eligibility: LeaderboardAccountEligibilityResult;
  }> = [];

  for (const acc of baseCandidates) {
    const eligibility = evaluateAccountLeaderboardEligibility(acc, category, config, transactions, {
      disguisedAdminIds,
      disguisedPublicTierMap,
    });
    if (eligibility.eligible) {
      eligibleCount += 1;
      const passedByRules =
        eligibility.checks.length === 0 ||
        (eligibility.evaluationMode === 'ANY'
          ? eligibility.passedCount > 0
          : eligibility.passedCount === eligibility.totalChecks);
      if (eligibility.isWhitelisted && !passedByRules) {
        whitelistedBypassCount += 1;
      }
    } else {
      disqualifiedCount += 1;
      if (disqualifiedSamples.length < 12) {
        disqualifiedSamples.push({ account: acc, eligibility });
      }
    }
  }

  return {
    totalCandidates: baseCandidates.length,
    eligibleCount,
    disqualifiedCount,
    whitelistedBypassCount,
    adminBypassCount,
    disqualifiedSamples,
  };
}

export function computeAccountTopLeaderboardBadges(
  accountId: string | undefined,
  accounts: BankAccount[],
  config: LeaderboardSystemConfig,
  transactions: Transaction[],
  disguisedAdminIds?: Set<string>,
  disguisedPublicTierMap?: Record<string, CardTier>
): AccountTopLeaderboardEntry[] {
  if (!accountId || config.enabled === false || config.showTopBadges === false) {
    return [];
  }
  const targetAcc = accounts.find((a) => a.id === accountId);
  if (!targetAcc) return [];
  const isDisguised = Boolean(disguisedAdminIds?.has(targetAcc.id));
  if (!isDisguised && isAdminCardAccount(targetAcc)) return [];
  if (config.hideBannedAccounts && (targetAcc.cardStatus === 'banned' || targetAcc.status === 'banned')) {
    return [];
  }
  if (config.hidePendingAccounts && (targetAcc.cardStatus === 'pending' || targetAcc.cardStatus === 'rejected')) {
    return [];
  }

  const maxBadgeRank = Math.max(1, Math.min(500, Math.round(config.maxBadgeRank ?? 100)));
  const activeCategories = [...(config.categories || [])]
    .filter((c) => c.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const results: AccountTopLeaderboardEntry[] = [];
  for (const cat of activeCategories) {
    const ranking = computeLeaderboardRankingForCategory(
      accounts,
      cat,
      config,
      transactions,
      disguisedAdminIds,
      disguisedPublicTierMap
    );
    const found = ranking.find((r) => r.account.id === accountId);
    if (found && found.rank <= maxBadgeRank) {
      results.push({
        categoryId: cat.id,
        categoryKey: cat.key,
        categoryLabel: cat.label,
        unitLabel: cat.unitLabel,
        rank: found.rank,
        score: found.score,
        tierStyle: getLeaderboardBadgeTierStyle(found.rank),
        isUnlimited: found.isUnlimited,
      });
    }
  }

  results.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.categoryLabel.localeCompare(b.categoryLabel);
  });

  return results;
}
