import React, { useEffect, useMemo, useState } from 'react';
import {
  Coins,
  Crown,
  EyeOff,
  Gem,
  Lock,
  Medal,
  ShieldAlert,
  Sparkles,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  computeLeaderboardRankingForCategory,
  formatLeaderboardMetricValue,
} from '../utils/leaderboardUtils';
import {
  CARD_TIER_CONFIGS,
  formatAccountNumberDisplay,
  isAdminCardAccount,
} from '../utils/bankUtils';
import { VerifiedBadge } from './VerifiedBadge';
import { LeaderboardRankMarker, TopLeaderboardBadges } from './TopLeaderboardBadges';

export const LeaderboardView: React.FC = () => {
  const { accounts, currentAccount, leaderboardConfig, transactions } = useBank();

  const activeCategories = useMemo(
    () =>
      [...(leaderboardConfig.categories || [])]
        .filter((c) => c.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [leaderboardConfig.categories]
  );

  const [selectedCatId, setSelectedCatId] = useState<string>(
    activeCategories[0]?.id || 'cat_balance'
  );

  useEffect(() => {
    if (activeCategories.length > 0 && !activeCategories.some((c) => c.id === selectedCatId)) {
      setSelectedCatId(activeCategories[0].id);
    }
  }, [activeCategories, selectedCatId]);

  const activeCategory =
    activeCategories.find((c) => c.id === selectedCatId) || activeCategories[0];

  const fullRanking = useMemo(() => {
    if (!activeCategory) return [];
    return computeLeaderboardRankingForCategory(
      accounts,
      activeCategory,
      leaderboardConfig,
      transactions
    );
  }, [accounts, activeCategory, leaderboardConfig, transactions]);

  const maxLimit = Math.max(1, Math.min(200, leaderboardConfig.maxEntries || 100));
  const displayedRanking = useMemo(
    () => fullRanking.slice(0, maxLimit),
    [fullRanking, maxLimit]
  );

  const myRankEntry = useMemo(() => {
    if (!currentAccount) return null;
    return fullRanking.find((r) => r.account.id === currentAccount.id) || null;
  }, [fullRanking, currentAccount]);

  const isPrivacyMasked = Boolean(currentAccount?.hideSensitiveNumbers);

  if (leaderboardConfig.enabled === false) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Leaderboard Sedang Dijeda</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Fitur papan peringkat sementara dinonaktifkan oleh pengelola sistem.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-5">
      {/* Header + Category Selector */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/35 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Trophy className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Leaderboard Kekayaan &amp; Aset
                </h1>
                {!leaderboardConfig.showAdminTier && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    <EyeOff className="w-3 h-3 text-slate-400" />
                    Tier ADMIN (∞) Tersembunyi
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Peringkat nasabah terbaik di setiap kategori. Juara Top 1–100 otomatis menerima badge resmi pada kartu &amp; profil.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-300">
            <span className="px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-200 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-300" /> Top 1 Emas
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-slate-400/15 border border-slate-300/40 text-slate-200 flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-slate-300" /> Top 2 Perak
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-800/35 border border-amber-600/50 text-amber-100 flex items-center gap-1">
              <Medal className="w-3.5 h-3.5 text-amber-400" /> Top 3 Coklat
            </span>
          </div>
        </div>

        {/* Category Tabs */}
        {activeCategories.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
            {activeCategories.map((cat) => {
              const isSelected = activeCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 border-amber-400/70 text-amber-200 shadow-md'
                      : 'bg-slate-950/75 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat.key === 'balance' && <Wallet className="w-3.5 h-3.5 text-emerald-400" />}
                  {cat.key === 'spinCoins' && <Coins className="w-3.5 h-3.5 text-amber-400" />}
                  {cat.key === 'diamonds' && <Gem className="w-3.5 h-3.5 text-cyan-400" />}
                  {cat.key !== 'balance' && cat.key !== 'spinCoins' && cat.key !== 'diamonds' && (
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  )}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Kartu Peringkat Saya (Sticky highlight obeying Privacy Mask & showing Top Badges visibly) */}
      {leaderboardConfig.showMyRankCard !== false && currentAccount && activeCategory && (
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950/85 via-slate-900 to-slate-900 border border-indigo-500/45 p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {myRankEntry ? (
                <LeaderboardRankMarker rank={myRankEntry.rank} size="lg" />
              ) : (
                <span className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-extrabold text-slate-300">
                  {isAdminCardAccount(currentAccount) && !leaderboardConfig.showAdminTier
                    ? 'ADMIN Tersembunyi'
                    : 'Di Luar Peringkat'}
                </span>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                    Peringkat Saya
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white">
                    {currentAccount.fullName}
                  </span>
                  {currentAccount.isVerified && <VerifiedBadge size="sm" />}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {CARD_TIER_CONFIGS[currentAccount.cardTier]?.name ||
                      currentAccount.cardTier.toUpperCase()}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Rek:{' '}
                  <span className="text-slate-200 font-bold">
                    {formatAccountNumberDisplay(currentAccount.accountNumber, isPrivacyMasked)}
                  </span>
                  {isPrivacyMasked && (
                    <span className="ml-2 text-[10px] text-amber-300 font-sans font-bold">
                      (Sensor Privasi Aktif)
                    </span>
                  )}
                </div>
                <TopLeaderboardBadges
                  account={currentAccount}
                  variant="compact"
                  context="leaderboard"
                  className="pt-0.5"
                />
              </div>
            </div>

            <div className="text-left md:text-right shrink-0">
              <div className="text-[11px] text-slate-400">{activeCategory.label}</div>
              <div className="text-lg sm:text-xl font-black text-amber-300 tabular-nums">
                {myRankEntry
                  ? formatLeaderboardMetricValue(
                      myRankEntry.score,
                      activeCategory.key,
                      activeCategory.unitLabel,
                      myRankEntry.isUnlimited
                    )
                  : isAdminCardAccount(currentAccount) && !leaderboardConfig.showAdminTier
                  ? 'Disembunyikan Pengaturan Admin'
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ranking List */}
      {!activeCategory ? (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">Belum ada kategori Leaderboard aktif.</p>
        </div>
      ) : displayedRanking.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-10 text-center">
          <Trophy className="w-8 h-8 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-300">
            Belum ada nasabah yang memenuhi kriteria peringkat kategori ini.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/95 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>
              Menampilkan {displayedRanking.length} dari {fullRanking.length} nasabah
            </span>
            <span>Kategori: {activeCategory.label}</span>
          </div>

          <div className="divide-y divide-slate-800/75">
            {displayedRanking.map((entry) => {
              const isMe = currentAccount?.id === entry.account.id;
              const tierCfg = CARD_TIER_CONFIGS[entry.account.cardTier];
              const rowHighlight =
                entry.rank === 1
                  ? 'bg-gradient-to-r from-amber-500/12 via-yellow-500/5 to-transparent'
                  : entry.rank === 2
                  ? 'bg-gradient-to-r from-slate-400/10 to-transparent'
                  : entry.rank === 3
                  ? 'bg-gradient-to-r from-amber-800/15 to-transparent'
                  : isMe
                  ? 'bg-indigo-500/10'
                  : '';

              return (
                <div
                  key={entry.account.id}
                  className={`px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${rowHighlight}`}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <LeaderboardRankMarker rank={entry.rank} size="md" />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-black text-white truncate max-w-[220px] sm:max-w-xs">
                          {entry.account.fullName}
                        </span>
                        {entry.account.isVerified && <VerifiedBadge size="sm" />}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            entry.account.cardTier === 'admin'
                              ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}
                        >
                          <Crown className="w-2.5 h-2.5 text-amber-300" />
                          {tierCfg?.name || entry.account.cardTier.toUpperCase()}
                        </span>
                        {isMe && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/25 text-indigo-200 border border-indigo-400/50">
                            Anda
                          </span>
                        )}
                      </div>

                      <TopLeaderboardBadges
                        account={entry.account}
                        variant="compact"
                        context="leaderboard"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pl-10 sm:pl-0">
                    {isMe && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {formatAccountNumberDisplay(entry.account.accountNumber, isPrivacyMasked)}
                      </span>
                    )}
                    <div className="text-right">
                      <div
                        className={`text-sm sm:text-base font-black tabular-nums ${
                          entry.rank === 1
                            ? 'text-amber-300'
                            : entry.rank === 2
                            ? 'text-slate-200'
                            : entry.rank === 3
                            ? 'text-amber-200'
                            : 'text-emerald-300'
                        }`}
                      >
                        {formatLeaderboardMetricValue(
                          entry.score,
                          activeCategory.key,
                          activeCategory.unitLabel,
                          entry.isUnlimited
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
