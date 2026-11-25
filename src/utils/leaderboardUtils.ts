import {
  AccountTopLeaderboardEntry,
  BankAccount,
  LeaderboardBadgeTierStyle,
  LeaderboardCategoryConfig,
  LeaderboardCategoryKey,
  LeaderboardSystemConfig,
  Transaction,
} from '../types/bank';
import {
  formatCompactAssetCount,
  formatMobileCompactRupiah,
  isAdminCardAccount,
  isUnlimitedNumber,
} from './bankUtils';

export function getLeaderboardBadgeTierStyle(rank: number): LeaderboardBadgeTierStyle {
  if (rank === 1) return 'gold_1';
  if (rank === 2) return 'gray_2';
  if (rank === 3) return 'brown_3';
  return 'charcoal_4_100';
}

export function getLeaderboardMetricScore(
  account: BankAccount,
  key: LeaderboardCategoryKey,
  transactions: Transaction[]
): { score: number; isUnlimited: boolean } {
  const isAdmin = isAdminCardAccount(account);
  switch (key) {
    case 'balance': {
      const val = Number(account.balance ?? 0);
      return {
        score: isAdmin || isUnlimitedNumber(val) ? Number.MAX_SAFE_INTEGER : Math.max(0, val),
        isUnlimited: isAdmin || isUnlimitedNumber(val),
      };
    }
    case 'spinCoins': {
      const val = Number(account.spinCoins ?? 0);
      return {
        score: isAdmin || isUnlimitedNumber(val) ? Number.MAX_SAFE_INTEGER : Math.max(0, val),
        isUnlimited: isAdmin || isUnlimitedNumber(val),
      };
    }
    case 'diamonds': {
      const val = Number(account.diamonds ?? 0);
      return {
        score: isAdmin || isUnlimitedNumber(val) ? Number.MAX_SAFE_INTEGER : Math.max(0, val),
        isUnlimited: isAdmin || isUnlimitedNumber(val),
      };
    }
    case 'goldGrams': {
      const val = Number(account.goldGrams ?? 0);
      return {
        score: isAdmin || isUnlimitedNumber(val) ? Number.MAX_SAFE_INTEGER : Math.max(0, val),
        isUnlimited: isAdmin || isUnlimitedNumber(val),
      };
    }
    case 'rewardPoints': {
      const val = Number(account.rewardPoints ?? 0);
      return {
        score: isAdmin || isUnlimitedNumber(val) ? Number.MAX_SAFE_INTEGER : Math.max(0, val),
        isUnlimited: isAdmin || isUnlimitedNumber(val),
      };
    }
    case 'jobLevel': {
      const val = Number(account.jobLevel ?? 1);
      return {
        score: Math.max(1, val),
        isUnlimited: false,
      };
    }
    case 'txCount': {
      const count = transactions.filter((t) => t.accountId === account.id).length;
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
  if (isUnlimited) return '∞';
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

export function filterEligibleLeaderboardAccounts(
  accounts: BankAccount[],
  config: LeaderboardSystemConfig
): BankAccount[] {
  return accounts.filter((acc) => {
    if (!acc || !acc.id) return false;
    if (!config.showAdminTier && isAdminCardAccount(acc)) return false;
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
  transactions: Transaction[]
): Array<{ account: BankAccount; rank: number; score: number; isUnlimited: boolean }> {
  const eligible = filterEligibleLeaderboardAccounts(accounts, config);
  const scored = eligible.map((account) => {
    const metric = getLeaderboardMetricScore(account, category.key, transactions);
    return {
      account,
      score: metric.score,
      isUnlimited: metric.isUnlimited,
    };
  });

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

export function computeAccountTopLeaderboardBadges(
  accountId: string | undefined,
  accounts: BankAccount[],
  config: LeaderboardSystemConfig,
  transactions: Transaction[]
): AccountTopLeaderboardEntry[] {
  if (!accountId || config.enabled === false || config.showTopBadges === false) {
    return [];
  }
  const targetAcc = accounts.find((a) => a.id === accountId);
  if (!targetAcc) return [];
  if (!config.showAdminTier && isAdminCardAccount(targetAcc)) return [];
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
    const ranking = computeLeaderboardRankingForCategory(accounts, cat, config, transactions);
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
