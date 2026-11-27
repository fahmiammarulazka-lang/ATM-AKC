import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Coins,
  Crown,
  EyeOff,
  Gem,
  Lock,
  Medal,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { CardTier } from '../types/bank';
import {
  computeLeaderboardRankingForCategory,
  evaluateAccountLeaderboardEligibility,
  formatLeaderboardMetricValue,
  getActiveLeaderboardRequirementSummaries,
} from '../utils/leaderboardUtils';
import {
  CARD_TIER_CONFIGS,
  formatAccountNumberDisplay,
  isAdminCardAccount,
} from '../utils/bankUtils';
import { VerifiedBadge } from './VerifiedBadge';
import { LeaderboardRankMarker, TopLeaderboardBadges } from './TopLeaderboardBadges';
import { ProfileAvatarBadge } from './ProfileAvatarBadge';
import { useAdminAnalyticsAndTierSync } from '../hooks/useAdminAnalyticsAndTierSync';
import { isAccountDisguisedAdmin, isPrimarySystemOwnerAccount } from '../types/adminAnalyticsAndTier';

export const LeaderboardView: React.FC = () => {
  const { accounts, currentAccount, leaderboardConfig, transactions } = useBank();
  const { adminTierGrantsMap } = useAdminAnalyticsAndTierSync();

  const { disguisedAdminIds, disguisedPublicTierMap } = useMemo(() => {
    const set = new Set<string>();
    const tierMap: Record<string, CardTier> = {};
    accounts.forEach((acc) => {
      if (isAdminCardAccount(acc) && isAccountDisguisedAdmin(acc.id, adminTierGrantsMap)) {
        set.add(acc.id);
        const prev = adminTierGrantsMap[acc.id]?.previousCardTier;
        tierMap[acc.id] = prev && prev !== 'admin' ? prev : 'regular';
      }
    });
    return { disguisedAdminIds: set, disguisedPublicTierMap: tierMap };
  }, [accounts, adminTierGrantsMap]);

  const adminHonorAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      if (!acc || !acc.id) return false;
      if (!isAdminCardAccount(acc)) return false;
      // Admin yang sedang memakai Mode Penyamaran tidak ditampilkan di blok Kehormatan Admin publik
      if (disguisedAdminIds.has(acc.id)) return false;
      if (leaderboardConfig.hideBannedAccounts && (acc.cardStatus === 'banned' || acc.status === 'banned')) {
        return false;
      }
      return true;
    });
  }, [accounts, disguisedAdminIds, leaderboardConfig.hideBannedAccounts]);

  const activeCategories = useMemo(
    () =>
      [...(leaderboardConfig.categories || [])]
        .filter((c) => c.enabled)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [leaderboardConfig.categories]
  );

  const [selectedCatId, setSelectedCatId] = useState<string>(
    activeCategories[0]?.id || 'lb-cat-balance'
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
      transactions,
      disguisedAdminIds,
      disguisedPublicTierMap
    );
  }, [accounts, activeCategory, leaderboardConfig, transactions, disguisedAdminIds, disguisedPublicTierMap]);

  const requirementSummary = useMemo(() => {
    if (!activeCategory) return null;
    return getActiveLeaderboardRequirementSummaries(activeCategory, leaderboardConfig);
  }, [activeCategory, leaderboardConfig]);

  const myEligibility = useMemo(() => {
    if (!currentAccount || !activeCategory) return null;
    return evaluateAccountLeaderboardEligibility(
      currentAccount,
      activeCategory,
      leaderboardConfig,
      transactions,
      { disguisedAdminIds, disguisedPublicTierMap }
    );
  }, [currentAccount, activeCategory, leaderboardConfig, transactions, disguisedAdminIds, disguisedPublicTierMap]);

  const maxLimit = Math.max(1, Math.min(200, leaderboardConfig.maxEntries || 100));
  const displayedRanking = useMemo(
    () => fullRanking.slice(0, maxLimit),
    [fullRanking, maxLimit]
  );

  const myRankEntry = useMemo(() => {
    if (!currentAccount) return null;
    return fullRanking.find((r) => r.account.id === currentAccount.id) || null;
  }, [fullRanking, currentAccount]);

  const isCurrentAccountAdmin = isAdminCardAccount(currentAccount);
  const isCurrentAccountDisguised = Boolean(
    currentAccount && disguisedAdminIds.has(currentAccount.id)
  );
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
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-200 border border-amber-400/40">
                  <Crown className="w-3 h-3 text-amber-300" />
                  Tier ADMIN (∞) Di Luar Persaingan Nasabah
                </span>
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

      {/* Banner Ringkasan Syarat Minimal Masuk Leaderboard (Kontrol Saklar Admin) */}
      {requirementSummary && requirementSummary.active && requirementSummary.showBanner && activeCategory && (
        <div className="rounded-2xl bg-slate-900/95 border border-sky-500/35 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-400/35 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-white">
                  Syarat Minimal Masuk Leaderboard ({activeCategory.label})
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-sky-500/15 text-sky-300 border border-sky-500/35">
                  {requirementSummary.evaluationMode === 'ANY'
                    ? 'Cukup Salah Satu Syarat'
                    : 'Wajib Semua Syarat'}
                </span>
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-300 tabular-nums">
                {requirementSummary.items.map((item, idx) => (
                  <span key={`${item}-${idx}`} className="inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>{item}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blok Lencana Khusus Kehormatan Admin (Di Luar Persaingan Nasabah) */}
      {adminHonorAccounts.length > 0 && (
        <div className="rounded-3xl bg-gradient-to-r from-amber-950/50 via-slate-900 to-slate-950 border border-amber-500/40 p-4 sm:p-5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">
                Lencana Kehormatan Khusus Tier Admin (Di Luar Persaingan Nasabah)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-amber-200/80">
              {adminHonorAccounts.length} Kartu Tier Admin • Level ∞ • Voucher ∞ • Poin ∞
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {adminHonorAccounts.map((acc) => {
              const grant = adminTierGrantsMap[acc.id];
              const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
              return (
                <div
                  key={acc.id}
                  className="rounded-2xl bg-slate-950/80 border border-amber-500/35 px-3.5 py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-white truncate">
                        {acc.fullName}
                      </span>
                      {acc.isVerified && <VerifiedBadge size="sm" />}
                    </div>
                    <p className="text-[10px] text-amber-200/80 font-semibold mt-0.5 truncate">
                      {isOwner
                        ? 'Super Admin Utama'
                        : grant?.customTitle || 'Kartu Tier Admin Resmi'}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono font-black text-[11px]">
                      Lv.∞ • Poin ∞
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kartu Peringkat Saya + Progres Kekurangan Syarat Minimal */}
      {leaderboardConfig.showMyRankCard !== false && currentAccount && activeCategory && (
        <div
          className={`rounded-3xl p-4 sm:p-5 shadow-xl border space-y-4 ${
            myEligibility && !myEligibility.eligible && !(isCurrentAccountAdmin && !isCurrentAccountDisguised)
              ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/45'
              : 'bg-gradient-to-r from-indigo-950/85 via-slate-900 to-slate-900 border-indigo-500/45'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              {isCurrentAccountAdmin && !isCurrentAccountDisguised ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/20 border border-amber-400/60 text-xs font-black text-amber-300">
                  <Crown className="w-4 h-4 text-amber-300" />
                  Lencana Admin (∞)
                </span>
              ) : myRankEntry ? (
                <LeaderboardRankMarker rank={myRankEntry.rank} size="lg" />
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-xs font-extrabold text-amber-200">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  Belum Masuk Peringkat
                </span>
              )}

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300">
                    {isCurrentAccountAdmin && !isCurrentAccountDisguised
                      ? 'Status Kehormatan Admin'
                      : 'Peringkat Saya'}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white">
                    {currentAccount.fullName}
                  </span>
                  {currentAccount.isVerified && <VerifiedBadge size="sm" />}
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-200 border border-slate-700">
                    {CARD_TIER_CONFIGS[currentAccount.cardTier]?.name ||
                      currentAccount.cardTier.toUpperCase()}
                  </span>
                  {myEligibility?.isWhitelisted && !myEligibility.noRequirementsActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40">
                      <ShieldCheck className="w-3 h-3" />
                      Pengecualian Resmi
                    </span>
                  )}
                  {isCurrentAccountDisguised && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-200 border border-amber-400/40">
                      <EyeOff className="w-3 h-3" />
                      Mode Penyamaran (Pribadi ∞ • Publik Normal)
                    </span>
                  )}
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
                {isCurrentAccountAdmin && !isCurrentAccountDisguised
                  ? activeCategory.key === 'jobLevel'
                    ? 'Level ∞'
                    : activeCategory.key === 'txCount' && myRankEntry
                    ? formatLeaderboardMetricValue(myRankEntry.score, activeCategory.key, activeCategory.unitLabel, false)
                    : '∞'
                  : myRankEntry
                  ? formatLeaderboardMetricValue(
                      myRankEntry.score,
                      activeCategory.key,
                      activeCategory.unitLabel,
                      myRankEntry.isUnlimited
                    )
                  : myEligibility && !myEligibility.eligible
                  ? `${myEligibility.overallProgressPercent}% Menuju Syarat`
                  : '—'}
              </div>
            </div>
          </div>

          {/* Batang Progres Lengkap Sisa Kekurangan Jika Belum Lolos Syarat Minimal */}
          {myEligibility &&
            !myEligibility.eligible &&
            !myEligibility.excludedByAccountStatus &&
            myEligibility.checks.length > 0 &&
            !(isCurrentAccountAdmin && !isCurrentAccountDisguised) && (
              <div className="pt-3.5 border-t border-slate-800/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs font-bold text-amber-200">
                    {myEligibility.evaluationMode === 'ANY'
                      ? 'Penuhi minimal 1 syarat berikut untuk masuk Leaderboard & meraih Badge Top 1–100:'
                      : `Penuhi semua syarat berikut (${myEligibility.passedCount}/${myEligibility.totalChecks} terpenuhi) untuk masuk Leaderboard & meraih Badge Top 1–100:`}
                  </div>
                  <span className="text-xs font-black text-amber-300 tabular-nums">
                    Progres Total: {myEligibility.overallProgressPercent}%
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {myEligibility.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className={`rounded-2xl border p-3 space-y-2 ${
                        chk.passed
                          ? 'bg-emerald-950/35 border-emerald-500/35'
                          : 'bg-slate-950/80 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          {chk.passed ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span>{chk.label}</span>
                        </span>
                        <span
                          className={`text-[11px] font-black tabular-nums ${
                            chk.passed ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {chk.progressPercent}%
                        </span>
                      </div>

                      <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            chk.passed
                              ? 'bg-emerald-400'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-400'
                          }`}
                          style={{ width: `${Math.max(4, chk.progressPercent)}%` }}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] tabular-nums">
                        <span className="text-slate-400">
                          Saat ini: <strong className="text-slate-200">{chk.currentDisplay}</strong> /{' '}
                          {chk.targetDisplay}
                        </span>
                        <span
                          className={`font-bold ${
                            chk.passed ? 'text-emerald-400' : 'text-rose-300'
                          }`}
                        >
                          {chk.remainingText}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            Belum ada nasabah yang memenuhi kriteria minimal peringkat kategori ini.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl bg-slate-900/95 border border-slate-800 overflow-hidden shadow-2xl">
          <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-400">
            <span>
              Menampilkan {displayedRanking.length} dari {fullRanking.length} nasabah lolos
            </span>
            <span>Kategori: {activeCategory.label}</span>
          </div>

          <div className="divide-y divide-slate-800/75">
            {displayedRanking.map((entry) => {
              const isMe = currentAccount?.id === entry.account.id;
              const publicTierKey = entry.isDisguised
                ? disguisedPublicTierMap[entry.account.id] || 'regular'
                : entry.account.cardTier;
              const tierCfg = CARD_TIER_CONFIGS[publicTierKey];
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
                    <ProfileAvatarBadge account={entry.account} size="sm" />

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm font-black text-white truncate max-w-[220px] sm:max-w-xs">
                          {entry.account.fullName}
                        </span>
                        {entry.account.isVerified && <VerifiedBadge size="sm" />}
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                            publicTierKey === 'admin'
                              ? 'bg-rose-500/20 text-rose-200 border-rose-500/40'
                              : 'bg-slate-800 text-slate-200 border-slate-700'
                          }`}
                        >
                          <Crown className="w-2.5 h-2.5 text-amber-300" />
                          {tierCfg?.name || publicTierKey.toUpperCase()}
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
