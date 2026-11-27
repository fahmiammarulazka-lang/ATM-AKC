import React, { useMemo } from 'react';
import { Award, Medal, Trophy } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AccountTopLeaderboardEntry, BankAccount, CardTier } from '../types/bank';
import {
  computeAccountTopLeaderboardBadges,
  getLeaderboardBadgeTierStyle,
} from '../utils/leaderboardUtils';
import { isAdminCardAccount } from '../utils/bankUtils';
import { useAdminAnalyticsAndTierSync } from '../hooks/useAdminAnalyticsAndTierSync';
import { isAccountDisguisedAdmin } from '../types/adminAnalyticsAndTier';

interface LeaderboardRankMarkerProps {
  rank: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  prefix?: string;
  className?: string;
}

/**
 * Penanda Peringkat Leaderboard:
 * - Top 1: Emas + kilau halus + ikon Piala/Medali Emas (angka #1 diganti medali)
 * - Top 2: Abu-abu Perak elegan + ikon Medali Perak (angka #2 diganti medali)
 * - Top 3: Coklat Perunggu elegan + ikon Medali Perunggu (angka #3 diganti medali)
 * - Top 4-100: Abu-abu kehitaman dengan label `Top #4` .. `Top #100`
 */
export const LeaderboardRankMarker: React.FC<LeaderboardRankMarkerProps> = ({
  rank,
  size = 'md',
  prefix,
  className = '',
}) => {
  const tierStyle = getLeaderboardBadgeTierStyle(rank);
  const lead = prefix?.trim() || 'Top';

  const iconSize =
    size === 'xs'
      ? 'w-3 h-3'
      : size === 'sm'
      ? 'w-3.5 h-3.5'
      : size === 'lg'
      ? 'w-5 h-5'
      : 'w-4 h-4';

  const padSize =
    size === 'xs'
      ? 'px-1.5 py-0.5 text-[10px]'
      : size === 'sm'
      ? 'px-2 py-0.5 text-[11px]'
      : size === 'lg'
      ? 'px-3 py-1.5 text-sm'
      : 'px-2.5 py-1 text-xs';

  if (tierStyle === 'gold_1') {
    return (
      <span
        className={`top-badge-gold-shimmer inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black border border-yellow-200/80 shadow-[0_0_14px_rgba(251,191,36,0.45)] shrink-0 ${padSize} ${className}`}
        title="Juara 1 Leaderboard (Top 1 Emas)"
      >
        <Trophy className={`${iconSize} text-amber-950 fill-amber-200 shrink-0`} />
        <span className="tracking-tight">{lead} 1</span>
      </span>
    );
  }

  if (tierStyle === 'gray_2') {
    return (
      <span
        className={`inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-slate-400 via-zinc-300 to-slate-400 text-slate-950 font-black border border-slate-100/80 shadow-sm shrink-0 ${padSize} ${className}`}
        title="Peringkat 2 Leaderboard (Top 2 Abu-abu Perak)"
      >
        <Medal className={`${iconSize} text-slate-800 fill-slate-100 shrink-0`} />
        <span className="tracking-tight">{lead} 2</span>
      </span>
    );
  }

  if (tierStyle === 'brown_3') {
    return (
      <span
        className={`inline-flex items-center justify-center gap-1 rounded-full bg-gradient-to-r from-amber-800 via-amber-700 to-orange-900 text-amber-50 font-black border border-amber-500/70 shadow-sm shrink-0 ${padSize} ${className}`}
        title="Peringkat 3 Leaderboard (Top 3 Coklat Perunggu)"
      >
        <Award className={`${iconSize} text-amber-200 fill-amber-600/40 shrink-0`} />
        <span className="tracking-tight">{lead} 3</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center gap-1 rounded-full bg-zinc-900/95 text-zinc-100 font-extrabold border border-zinc-600/80 shadow-sm tabular-nums shrink-0 ${padSize} ${className}`}
      title={`Peringkat #${rank} Leaderboard`}
    >
      <span className="tracking-tight">{lead} #{rank}</span>
    </span>
  );
};

interface SingleTopBadgePillProps {
  entry: AccountTopLeaderboardEntry;
  variant: 'card_corner' | 'compact' | 'full';
  prefixText?: string;
}

const SingleTopBadgePill: React.FC<SingleTopBadgePillProps> = ({
  entry,
  variant,
  prefixText,
}) => {
  const isSmall = variant !== 'full';
  const iconCls = isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const padCls =
    variant === 'card_corner'
      ? 'px-1.5 py-0.5 text-[9px] gap-1'
      : variant === 'compact'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-2.5 py-1 text-[11px] gap-1.5';

  const shortCategory = entry.categoryLabel.replace(/^Top\s+/i, '').trim();
  const customLead = prefixText && prefixText.trim().toLowerCase() !== 'top' ? `${prefixText.trim()} ` : '';

  if (entry.tierStyle === 'gold_1') {
    return (
      <span
        className={`top-badge-gold-shimmer inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black border border-yellow-200/85 shadow-[0_0_12px_rgba(251,191,36,0.45)] shrink-0 ${padCls}`}
        title={`Top 1 ${shortCategory}`}
      >
        <Trophy className={`${iconCls} text-amber-950 fill-amber-200 shrink-0`} />
        <span className="whitespace-nowrap">
          {customLead}
          {shortCategory}
        </span>
      </span>
    );
  }

  if (entry.tierStyle === 'gray_2') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-slate-400 via-zinc-300 to-slate-400 text-slate-950 font-black border border-slate-100/80 shadow-sm shrink-0 ${padCls}`}
        title={`Top 2 ${shortCategory}`}
      >
        <Medal className={`${iconCls} text-slate-800 fill-slate-100 shrink-0`} />
        <span className="whitespace-nowrap">
          {customLead}
          {shortCategory}
        </span>
      </span>
    );
  }

  if (entry.tierStyle === 'brown_3') {
    return (
      <span
        className={`inline-flex items-center rounded-full bg-gradient-to-r from-amber-800 via-amber-700 to-orange-900 text-amber-50 font-black border border-amber-500/70 shadow-sm shrink-0 ${padCls}`}
        title={`Top 3 ${shortCategory}`}
      >
        <Award className={`${iconCls} text-amber-200 fill-amber-600/40 shrink-0`} />
        <span className="whitespace-nowrap">
          {customLead}
          {shortCategory}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full bg-zinc-900/95 text-zinc-100 font-extrabold border border-zinc-600/80 shadow-sm tabular-nums shrink-0 ${padCls}`}
      title={`Top #${entry.rank} ${shortCategory}`}
    >
      <span className="whitespace-nowrap">
        {prefixText?.trim() ? prefixText.trim() : 'Top'} #{entry.rank} {shortCategory}
      </span>
    </span>
  );
};

interface TopLeaderboardBadgesProps {
  account?: BankAccount | null;
  accountId?: string;
  variant?: 'card_corner' | 'compact' | 'full';
  context?: 'card' | 'profile' | 'leaderboard';
  maxVisible?: number;
  className?: string;
}

/**
 * Menampilkan SEMUA badge kategori Leaderboard (Top 1-100) yang diraih akun secara berderet.
 * Tetap tampil penuh meski nasabah menyalakan Sensor Nomor & ID.
 */
export const TopLeaderboardBadges: React.FC<TopLeaderboardBadgesProps> = ({
  account,
  accountId,
  variant = 'compact',
  context = 'profile',
  maxVisible,
  className = '',
}) => {
  const { accounts, leaderboardConfig, transactions } = useBank();
  const { adminTierGrantsMap } = useAdminAnalyticsAndTierSync();
  const targetId = account?.id || accountId;

  const { disguisedAdminIds, disguisedPublicTierMap } = useMemo(() => {
    const ids = new Set<string>();
    const tierMap: Record<string, CardTier> = {};
    accounts.forEach((acc) => {
      if (isAdminCardAccount(acc) && isAccountDisguisedAdmin(acc.id, adminTierGrantsMap)) {
        ids.add(acc.id);
        const prevTier = adminTierGrantsMap[acc.id]?.previousCardTier;
        tierMap[acc.id] = prevTier && prevTier !== 'admin' ? prevTier : 'regular';
      }
    });
    return { disguisedAdminIds: ids, disguisedPublicTierMap: tierMap };
  }, [accounts, adminTierGrantsMap]);

  if (!targetId) return null;
  if (leaderboardConfig.enabled === false || leaderboardConfig.showTopBadges === false) {
    return null;
  }
  if (context === 'card' && leaderboardConfig.showTopBadgesOnCard === false) {
    return null;
  }
  if (context === 'profile' && leaderboardConfig.showTopBadgesInProfile === false) {
    return null;
  }

  const entries = computeAccountTopLeaderboardBadges(
    targetId,
    accounts,
    leaderboardConfig,
    transactions,
    disguisedAdminIds,
    disguisedPublicTierMap
  );

  if (entries.length === 0) return null;

  const visibleEntries =
    typeof maxVisible === 'number' && maxVisible > 0 ? entries.slice(0, maxVisible) : entries;

  return (
    <div
      className={`flex flex-wrap items-center gap-1 ${
        variant === 'card_corner' ? 'justify-end max-w-[78%]' : ''
      } ${className}`}
    >
      {visibleEntries.map((entry) => (
        <SingleTopBadgePill
          key={`${entry.categoryId}-${entry.rank}`}
          entry={entry}
          variant={variant}
          prefixText={leaderboardConfig.topBadgeCustomPrefix}
        />
      ))}
    </div>
  );
};
