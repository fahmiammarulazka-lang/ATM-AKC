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
  disguisedAdminIds?: Set<string>
): Array<{ account: BankAccount; rank: number; score: number; isUnlimited: boolean; isDisguised?: boolean }> {
  const eligible = filterEligibleLeaderboardAccounts(accounts, config, disguisedAdminIds);
  const scored = eligible.map((account) => {
    const isDisguised = Boolean(disguisedAdminIds?.has(account.id));
    const metric = getLeaderboardMetricScore(account, category.key, transactions, {
      treatAsPublicDisguised: isDisguised,
    });
    return {
      account,
      score: metric.score,
      isUnlimited: metric.isUnlimited,
      isDisguised,
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
