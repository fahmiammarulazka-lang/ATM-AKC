import React, { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Gem,
  Gift,
  Lock,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AppMissionDefinition,
  MissionAccountProgressRecord,
  MissionCategory,
  MissionMetricKey,
  MissionRewardBundle,
} from '../types/bank';
import { CARD_TIER_CONFIGS, formatRupiah } from '../utils/bankUtils';

const getWibDateKeyLocal = (date: Date = new Date(), resetHourWib = 0): string => {
  const safeReset = Math.max(0, Math.min(23, Math.round(resetHourWib || 0)));
  const shifted = new Date(date.getTime() + (7 - safeReset) * 3600_000);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getYesterdayWibDateKeyLocal = (todayWibKey: string): string => {
  const [y, m, d] = todayWibKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2025, (m || 1) - 1, d || 1) - 86400_000);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(
    dt.getUTCDate()
  ).padStart(2, '0')}`;
};

const METRIC_LABELS: Record<MissionMetricKey, string> = {
  any_tx: 'Transaksi Apa Saja',
  transfer_count: 'Frekuensi Transfer',
  transfer_amount: 'Total Nominal Transfer (Rp)',
  deposit_count: 'Setor / Top-Up Saldo',
  withdraw_count: 'Penarikan Dana',
  spin_count: 'Putaran Spin The Wheel',
  job_clicks: 'Klik Kerja Lowongan',
  job_complete: 'Selesai Target Kerja',
  gold_tx: 'Transaksi Emas Digital',
  redeem_claim: 'Klaim Kode Redeem',
  family_action: 'Aktivitas Menu Keluarga',
  daily_checkin: 'Check-In Harian',
  manual_claim: 'Klaim Langsung',
};

const CATEGORY_META: Record<
  MissionCategory,
  { label: string; badge: string; accent: string; desc: string }
> = {
  daily: {
    label: 'Misi Harian',
    badge: 'Reset Tiap Hari',
    accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300',
    desc: 'Target harian otomatis & klaim hadiah setiap hari.',
  },
  streak_7: {
    label: 'Misi Harian 7-Hari',
    badge: 'Streak 7 Hari',
    accent: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300',
    desc: 'Raih hadiah beruntun selama 7 hari berturut-turut.',
  },
  normal: {
    label: 'Misi Biasa',
    badge: 'Pencapaian & Event',
    accent: 'from-indigo-500/20 to-cyan-500/10 border-indigo-500/40 text-indigo-300',
    desc: 'Tantangan pencapaian kumulatif & event spesial.',
  },
};

const renderRewardChips = (
  rewards: MissionRewardBundle,
  devRoles: { id: string; name: string }[]
) => {
  const chips: Array<{ key: string; label: string; cls: string; icon: React.ReactNode }> = [];
  if (rewards.money && rewards.money > 0) {
    chips.push({
      key: 'money',
      label: formatRupiah(rewards.money),
      cls: 'bg-emerald-500/15 text-emerald-200 border-emerald-500/35',
      icon: <Wallet className="w-3 h-3 text-emerald-300" />,
    });
  }
  if (rewards.spinCoins && rewards.spinCoins > 0) {
    chips.push({
      key: 'coins',
      label: `+${rewards.spinCoins.toLocaleString('id-ID')} Koin`,
      cls: 'bg-amber-500/15 text-amber-200 border-amber-500/35',
      icon: <Coins className="w-3 h-3 text-amber-300" />,
    });
  }
  if (rewards.diamonds && rewards.diamonds > 0) {
    chips.push({
      key: 'diamonds',
      label: `+${rewards.diamonds.toLocaleString('id-ID')} Diamond`,
      cls: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/35',
      icon: <Gem className="w-3 h-3 text-cyan-300" />,
    });
  }
  if (rewards.goldGrams && rewards.goldGrams > 0) {
    chips.push({
      key: 'gold',
      label: `+${rewards.goldGrams} gr Emas`,
      cls: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/35',
      icon: <Star className="w-3 h-3 text-yellow-300" />,
    });
  }
  if (rewards.rewardPoints && rewards.rewardPoints > 0) {
    chips.push({
      key: 'pts',
      label: `+${rewards.rewardPoints.toLocaleString('id-ID')} Poin`,
      cls: 'bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/35',
      icon: <Sparkles className="w-3 h-3 text-fuchsia-300" />,
    });
  }
  if (rewards.levelVouchers && rewards.levelVouchers > 0) {
    chips.push({
      key: 'vouchers',
      label: `+${rewards.levelVouchers} Voucher Lv`,
      cls: 'bg-violet-500/15 text-violet-200 border-violet-500/35',
      icon: <TicketIcon />,
    });
  }
  if (rewards.jobLevelBoost && rewards.jobLevelBoost > 0) {
    chips.push({
      key: 'joblv',
      label: `+${rewards.jobLevelBoost} Lv Karir`,
      cls: 'bg-sky-500/15 text-sky-200 border-sky-500/35',
      icon: <TrendingUp className="w-3 h-3 text-sky-300" />,
    });
  }
  if (rewards.cardTierReward) {
    const tierCfg = CARD_TIER_CONFIGS[rewards.cardTierReward];
    chips.push({
      key: 'tier',
      label: `Tier ${tierCfg?.name || rewards.cardTierReward.toUpperCase()}`,
      cls: 'bg-rose-500/15 text-rose-200 border-rose-500/35',
      icon: <Crown className="w-3 h-3 text-rose-300" />,
    });
  }
  if (rewards.devRoleId) {
    const role = devRoles.find((r) => r.id === rewards.devRoleId);
    chips.push({
      key: 'role',
      label: `Role ${role?.name || rewards.devRoleId}`,
      cls: 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40',
      icon: <ShieldCheck className="w-3 h-3 text-indigo-300" />,
    });
  }
  if (rewards.dashboardEffectId) {
    chips.push({
      key: 'fx',
      label: 'Efek Dashboard VIP',
      cls: 'bg-pink-500/15 text-pink-200 border-pink-500/35',
      icon: <Sparkles className="w-3 h-3 text-pink-300" />,
    });
  }
  if (rewards.customGiftLabel) {
    chips.push({
      key: 'custom',
      label: rewards.customGiftLabel,
      cls: 'bg-slate-800 text-slate-200 border-slate-600',
      icon: <Gift className="w-3 h-3 text-amber-300" />,
    });
  }
  return chips;
};

const TicketIcon = () => <Trophy className="w-3 h-3 text-violet-300" />;

export const MissionsView: React.FC = () => {
  const {
    currentAccount,
    missions,
    missionConfig,
    missionProgressByAccount,
    claimMissionReward,
    triggerDailyCheckInMission,
    devRoles,
  } = useBank();

  const [selectedCategory, setSelectedCategory] = useState<MissionCategory | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const nowMs = Date.now();
  const todayKey = getWibDateKeyLocal(new Date(), missionConfig.dailyResetHourWib);
  const yesterdayKey = getYesterdayWibDateKeyLocal(todayKey);

  const visibleMissions = useMemo(() => {
    return [...(missions || [])]
      .filter((m) => m.isActive)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [missions]);

  const availableCategories = useMemo(() => {
    const order: MissionCategory[] = ['daily', 'streak_7', 'normal'];
    return order.filter((cat) => visibleMissions.some((m) => m.category === cat));
  }, [visibleMissions]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setSelectedCategory(null);
      return;
    }
    if (!selectedCategory || !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  const accProgressMap: Record<string, MissionAccountProgressRecord> =
    (currentAccount && missionProgressByAccount[currentAccount.id]) || {};

  const handleCheckIn = () => {
    const res = triggerDailyCheckInMission();
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleClaim = (mission: AppMissionDefinition, day?: number) => {
    const res = claimMissionReward(mission.id, day);
    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const activeList = useMemo(() => {
    if (!selectedCategory) return visibleMissions;
    return visibleMissions.filter((m) => m.category === selectedCategory);
  }, [visibleMissions, selectedCategory]);

  const hasCheckInMission = useMemo(
    () => visibleMissions.some((m) => m.metricKey === 'daily_checkin'),
    [visibleMissions]
  );

  if (!missionConfig.enabled) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 text-center shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-slate-400" />
          </div>
          <h2 className="text-xl font-black text-white mb-2">Sistem Misi Sedang Dijeda</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Pengelola sedang menonaktifkan halaman Misi Harian sementara waktu. Silakan periksa kembali nanti.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 p-5 sm:p-7 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Misi Harian &amp; Hadiah
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35 tabular-nums">
                  {visibleMissions.length} Misi Aktif
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Selesaikan aktivitas perbankan Anda, kumpulkan progres real-time, dan klaim beragam hadiah langsung ke akun.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-1.5 tabular-nums">
              <Timer className="w-3.5 h-3.5 text-cyan-400" />
              Reset Harian: {String(missionConfig.dailyResetHourWib ?? 0).padStart(2, '0')}:00 WIB
            </div>
            {hasCheckInMission && currentAccount && (
              <button
                type="button"
                onClick={handleCheckIn}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Check-In Hari Ini</span>
              </button>
            )}
          </div>
        </div>

        {/* Adaptive Category Tabs — only rendered for categories that have active missions */}
        {availableCategories.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-wrap gap-2">
            {availableCategories.map((cat) => {
              const meta = CATEGORY_META[cat];
              const count = visibleMissions.filter((m) => m.category === cat).length;
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${
                    isActive
                      ? `bg-gradient-to-r ${meta.accent} shadow-md`
                      : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  {cat === 'daily' && <CalendarCheck className="w-3.5 h-3.5" />}
                  {cat === 'streak_7' && <Flame className="w-3.5 h-3.5" />}
                  {cat === 'normal' && <Trophy className="w-3.5 h-3.5" />}
                  <span>{meta.label}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black/30 text-[10px] tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 border text-xs sm:text-sm font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-75 hover:opacity-100 underline cursor-pointer shrink-0"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Clean Empty State when no missions exist */}
      {visibleMissions.length === 0 ? (
        <div className="rounded-3xl bg-slate-900/90 border border-dashed border-slate-700/90 p-10 sm:p-14 text-center shadow-xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
            <Gift className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-black text-white">
            {missionConfig.emptyStateTitle || 'Belum Ada Misi Aktif Saat Ini'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto mt-2 leading-relaxed">
            {missionConfig.emptyStateDescription ||
              'Misi Harian, Misi Harian 7-Hari, dan Misi Biasa masih kosong. Nantikan misi dan hadiah terbaru yang sedang disiapkan untuk Anda!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {activeList.map((mission) => {
            const rec: MissionAccountProgressRecord = accProgressMap[mission.id] || {
              missionId: mission.id,
              progress: 0,
              claimedDates: [],
              totalClaims: 0,
              streakDay: 0,
            };

            const isAutoTarget =
              mission.trackingMode === 'auto' &&
              mission.metricKey !== 'daily_checkin' &&
              mission.metricKey !== 'manual_claim';

            const reqTarget = Math.max(1, mission.targetValue || 1);
            const curProgress =
              mission.category === 'normal'
                ? rec.progress || 0
                : rec.lastProgressDateKey === todayKey
                ? rec.progress || 0
                : 0;
            const progressPct = Math.min(100, Math.round((curProgress / reqTarget) * 100));

            const notStartedYet = mission.startAt && nowMs < new Date(mission.startAt).getTime();
            const expired = mission.endAt && nowMs > new Date(mission.endAt).getTime();
            const quotaExhausted =
              Boolean(mission.globalClaimQuota && mission.globalClaimQuota > 0) &&
              (mission.totalGlobalClaims || 0) >= (mission.globalClaimQuota || 0);
            const tierMismatch =
              Boolean(mission.targetTiers && mission.targetTiers.length > 0) &&
              currentAccount &&
              !mission.targetTiers?.includes(currentAccount.cardTier);
            const verifiedMismatch =
              Boolean(mission.requireVerifiedAccount) &&
              currentAccount &&
              !currentAccount.isVerified;

            if (mission.category === 'streak_7') {
              const currentStreak = rec.streakDay || 0;
              const claimedToday = rec.lastStreakClaimDateKey === todayKey;
              const missedDay =
                Boolean(rec.lastStreakClaimDateKey) &&
                rec.lastStreakClaimDateKey !== yesterdayKey &&
                rec.lastStreakClaimDateKey !== todayKey;
              const nextClaimDay =
                currentStreak >= 7
                  ? (mission.maxClaimsPerAccount || 1) > 1
                    ? 1
                    : 8
                  : missedDay && mission.streakMissPolicy === 'reset_day_1'
                  ? 1
                  : currentStreak + 1;
              const canClaimToday =
                !claimedToday &&
                nextClaimDay <= 7 &&
                !notStartedYet &&
                !expired &&
                !quotaExhausted &&
                !tierMismatch &&
                !verifiedMismatch &&
                (!isAutoTarget || curProgress >= reqTarget);

              return (
                <div
                  key={mission.id}
                  className="lg:col-span-2 rounded-3xl bg-slate-900/95 border border-amber-500/30 p-5 sm:p-6 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
                        {mission.iconEmoji || '🔥'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">
                            {mission.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            7-Hari Streak
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {mission.streakMissPolicy === 'reset_day_1'
                              ? 'Terlewat: Reset Hari 1'
                              : 'Terlewat: Lanjut Tanpa Reset'}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                          {mission.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-amber-300 tabular-nums">
                        Hari {Math.min(7, currentStreak)}/7 Selesai
                      </span>
                      {isAutoTarget && (
                        <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                          Target Hari Ini: {curProgress.toLocaleString('id-ID')} /{' '}
                          {reqTarget.toLocaleString('id-ID')} {mission.unitLabel || ''}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 7 Days Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                    {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
                      const dayCfg = (mission.streakDays || []).find((d) => d.day === dayNum);
                      const dayReward = dayCfg?.rewards || mission.rewards;
                      const chips = renderRewardChips(dayReward, devRoles);
                      const isDone =
                        currentStreak >= dayNum &&
                        !(missedDay && mission.streakMissPolicy === 'reset_day_1');
                      const isCurrentTarget = !claimedToday && nextClaimDay === dayNum;
                      return (
                        <div
                          key={dayNum}
                          className={`rounded-2xl p-3 border flex flex-col justify-between gap-2 transition ${
                            isDone
                              ? 'bg-emerald-500/15 border-emerald-500/45'
                              : isCurrentTarget
                              ? 'bg-amber-500/15 border-amber-400/70 ring-1 ring-amber-400/40'
                              : 'bg-slate-950/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[11px] font-black text-white">
                              Hari {dayNum}
                            </span>
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="text-[10px] font-bold text-slate-400">
                                {isCurrentTarget ? 'Aktif' : 'Terkunci'}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {chips.slice(0, 3).map((ch) => (
                              <span
                                key={ch.key}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${ch.cls}`}
                              >
                                {ch.icon}
                                <span className="truncate max-w-[90px]">{ch.label}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-[11px] text-slate-400">
                      Metode:{' '}
                      <span className="text-slate-200 font-bold">
                        {METRIC_LABELS[mission.metricKey]}
                      </span>
                      {tierMismatch && ' • Khusus tier kartu tertentu'}
                      {verifiedMismatch && ' • Wajib Centang Biru'}
                    </div>
                    <button
                      type="button"
                      disabled={!canClaimToday}
                      onClick={() => handleClaim(mission, nextClaimDay)}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                        claimedToday
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                          : canClaimToday
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 shadow-lg cursor-pointer'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      {claimedToday
                        ? 'Hari Ini Sudah Diklaim'
                        : nextClaimDay > 7
                        ? 'Streak 7 Hari Selesai'
                        : `Klaim Hari ke-${nextClaimDay}`}
                    </button>
                  </div>
                </div>
              );
            }

            // Daily or Normal Mission Card
            const claimedToday =
              mission.category === 'daily' && (rec.claimedDates || []).includes(todayKey);
            const maxClaims = Math.max(1, mission.maxClaimsPerAccount ?? 1);
            const normalMaxed =
              mission.category === 'normal' && (rec.totalClaims || 0) >= maxClaims;
            const alreadyDone = claimedToday || normalMaxed;
            const canClaim =
              !alreadyDone &&
              !notStartedYet &&
              !expired &&
              !quotaExhausted &&
              !tierMismatch &&
              !verifiedMismatch &&
              (!isAutoTarget || curProgress >= reqTarget);

            const rewardChips = renderRewardChips(mission.rewards, devRoles);

            return (
              <div
                key={mission.id}
                className="rounded-3xl bg-slate-900/95 border border-slate-800 p-5 shadow-xl flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                        {mission.iconEmoji || '🎯'}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h3 className="text-sm sm:text-base font-black text-white">
                            {mission.title}
                          </h3>
                          {mission.badgeText && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/35">
                              {mission.badgeText}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{mission.description}</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                      {CATEGORY_META[mission.category].label}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        {METRIC_LABELS[mission.metricKey]}
                      </span>
                      <span className="font-extrabold text-white tabular-nums">
                        {isAutoTarget
                          ? `${curProgress.toLocaleString('id-ID')} / ${reqTarget.toLocaleString(
                              'id-ID'
                            )} ${mission.unitLabel || ''}`
                          : alreadyDone
                          ? 'Selesai'
                          : 'Siap Klaim'}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          alreadyDone
                            ? 'bg-emerald-500'
                            : canClaim
                            ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                            : 'bg-gradient-to-r from-cyan-500 to-indigo-500'
                        }`}
                        style={{
                          width: `${alreadyDone || !isAutoTarget ? 100 : progressPct}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Reward Bundle */}
                  {rewardChips.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {rewardChips.map((ch) => (
                        <span
                          key={ch.key}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-xl border text-[11px] font-bold ${ch.cls}`}
                        >
                          {ch.icon}
                          <span>{ch.label}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer / Action */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 space-x-2">
                    {notStartedYet && <span className="text-amber-300">Belum dimulai</span>}
                    {expired && <span className="text-rose-300">Jadwal berakhir</span>}
                    {quotaExhausted && <span className="text-rose-300">Kuota global habis</span>}
                    {tierMismatch && <span className="text-amber-300">Khusus tier tertentu</span>}
                    {verifiedMismatch && (
                      <span className="text-sky-300">Khusus akun Centang Biru</span>
                    )}
                    {!notStartedYet &&
                      !expired &&
                      !quotaExhausted &&
                      !tierMismatch &&
                      !verifiedMismatch && (
                        <span>
                          {mission.category === 'normal'
                            ? `Klaim: ${rec.totalClaims || 0}/${maxClaims}`
                            : 'Reset otomatis harian'}
                        </span>
                      )}
                  </div>

                  <button
                    type="button"
                    disabled={!canClaim}
                    onClick={() => handleClaim(mission)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      alreadyDone
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : canClaim
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 cursor-pointer'
                        : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    }`}
                  >
                    {alreadyDone ? 'Sudah Diklaim' : 'Klaim Hadiah'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
