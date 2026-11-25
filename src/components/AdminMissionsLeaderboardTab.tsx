import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Award,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Crown,
  Edit3,
  Eye,
  EyeOff,
  Filter,
  Flame,
  Gift,
  History,
  Layers,
  Medal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  Trash2,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AppMissionDefinition,
  CardTier,
  LeaderboardCategoryConfig,
  LeaderboardCategoryKey,
  LeaderboardSystemConfig,
  MissionCategory,
  MissionDayRewardConfig,
  MissionMetricKey,
  MissionRewardBundle,
  MissionStreakMissPolicy,
  MissionTrackingMode,
} from '../types/bank';
import {
  CARD_TIER_CONFIGS,
  formatAssetCount,
  formatIndoDate,
  formatRupiah,
  isAdminCardAccount,
} from '../utils/bankUtils';
import {
  computeLeaderboardRankingForCategory,
  formatLeaderboardMetricValue,
} from '../utils/leaderboardUtils';
import { TopLeaderboardBadges, LeaderboardRankMarker } from './TopLeaderboardBadges';

const METRIC_OPTIONS: Array<{ value: MissionMetricKey; label: string; unit: string }> = [
  { value: 'daily_checkin', label: 'Absen / Check-In Harian (Manual)', unit: 'hari' },
  { value: 'any_tx', label: 'Semua Transaksi Perbankan (Auto)', unit: 'transaksi' },
  { value: 'transfer_count', label: 'Jumlah Transfer Keluar (Auto)', unit: 'transfer' },
  { value: 'transfer_amount', label: 'Total Nominal Transfer Rp (Auto)', unit: 'rupiah' },
  { value: 'deposit_count', label: 'Jumlah Setor Tunai (Auto)', unit: 'setoran' },
  { value: 'withdraw_count', label: 'Jumlah Tarik Tunai (Auto)', unit: 'tarikan' },
  { value: 'spin_count', label: 'Putaran Spin the Wheel (Auto)', unit: 'spin' },
  { value: 'job_clicks', label: 'Klik Bekerja di Lowongan Kerja (Auto)', unit: 'klik' },
  { value: 'job_complete', label: 'Selesai Siklus Gaji Kerja (Auto)', unit: 'gaji' },
  { value: 'gold_tx', label: 'Transaksi Jual/Beli Emas 24K (Auto)', unit: 'transaksi' },
  { value: 'redeem_claim', label: 'Klaim Kode Redeem (Auto)', unit: 'kode' },
  { value: 'family_action', label: 'Aktivitas Menu Keluarga (Auto)', unit: 'aksi' },
  { value: 'manual_claim', label: 'Klaim Manual Bebas Syarat', unit: 'klaim' },
];

const ALL_CARD_TIERS: CardTier[] = [
  'regular',
  'gold',
  'premium',
  'platinum',
  'admin',
];

const LEADERBOARD_METRIC_OPTIONS: Array<{
  key: LeaderboardCategoryKey;
  label: string;
  unitLabel: string;
  accentColor: LeaderboardCategoryConfig['accentColor'];
}> = [
  { key: 'balance', label: 'Uang (Saldo Rekening)', unitLabel: 'Rp', accentColor: 'emerald' },
  { key: 'spinCoins', label: 'Coin Spin', unitLabel: 'Coin', accentColor: 'amber' },
  { key: 'diamonds', label: 'Diamond (Permata)', unitLabel: 'Permata', accentColor: 'cyan' },
  { key: 'goldGrams', label: 'Emas 24K', unitLabel: 'gr', accentColor: 'yellow' },
  { key: 'rewardPoints', label: 'Poin Rewards', unitLabel: 'Poin', accentColor: 'fuchsia' },
  { key: 'jobLevel', label: 'Level Pekerjaan', unitLabel: 'Lv', accentColor: 'indigo' },
  { key: 'txCount', label: 'Total Transaksi', unitLabel: 'Tx', accentColor: 'rose' },
];

interface RewardDraftStrings {
  money: string;
  spinCoins: string;
  diamonds: string;
  goldGrams: string;
  rewardPoints: string;
  levelVouchers: string;
  jobLevelBoost: string;
  cardTierReward: string;
  devRoleId: string;
  dashboardEffectId: string;
  customGiftLabel: string;
}

const bundleToDraft = (b?: MissionRewardBundle): RewardDraftStrings => ({
  money: b?.money !== undefined ? String(b.money) : '0',
  spinCoins: b?.spinCoins !== undefined ? String(b.spinCoins) : '0',
  diamonds: b?.diamonds !== undefined ? String(b.diamonds) : '0',
  goldGrams: b?.goldGrams !== undefined ? String(b.goldGrams) : '0',
  rewardPoints: b?.rewardPoints !== undefined ? String(b.rewardPoints) : '0',
  levelVouchers: b?.levelVouchers !== undefined ? String(b.levelVouchers) : '0',
  jobLevelBoost: b?.jobLevelBoost !== undefined ? String(b.jobLevelBoost) : '0',
  cardTierReward: b?.cardTierReward || '',
  devRoleId: b?.devRoleId || '',
  dashboardEffectId: b?.dashboardEffectId || '',
  customGiftLabel: b?.customGiftLabel || '',
});

const draftToBundle = (d: RewardDraftStrings): MissionRewardBundle => {
  const num = (v: string, int = true) => {
    const trimmed = v.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return 0;
    return int ? Math.max(0, Math.round(parsed)) : Math.max(0, parsed);
  };
  const money = num(d.money, true);
  const spinCoins = num(d.spinCoins, true);
  const diamonds = num(d.diamonds, true);
  const goldGrams = num(d.goldGrams, false);
  const rewardPoints = num(d.rewardPoints, true);
  const levelVouchers = num(d.levelVouchers, true);
  const jobLevelBoost = num(d.jobLevelBoost, true);
  return {
    money: money > 0 ? money : undefined,
    spinCoins: spinCoins > 0 ? spinCoins : undefined,
    diamonds: diamonds > 0 ? diamonds : undefined,
    goldGrams: goldGrams > 0 ? goldGrams : undefined,
    rewardPoints: rewardPoints > 0 ? rewardPoints : undefined,
    levelVouchers: levelVouchers > 0 ? levelVouchers : undefined,
    jobLevelBoost: jobLevelBoost > 0 ? jobLevelBoost : undefined,
    cardTierReward: (d.cardTierReward as CardTier) || undefined,
    devRoleId: d.devRoleId.trim() || undefined,
    dashboardEffectId: d.dashboardEffectId.trim() || undefined,
    customGiftLabel: d.customGiftLabel.trim() || undefined,
  };
};

const parseIntStrict = (raw: string, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const trimmed = raw.trim();
  if (trimmed === '') return min;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
};

const parseFloatStrict = (raw: string, min = 0, max = Number.MAX_SAFE_INTEGER): number => {
  const trimmed = raw.trim();
  if (trimmed === '') return min;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
};

// ============================================================================
// TAB 1: ADMIN KONTROL MISI HARIAN, 7-HARI & MISI BIASA (25 FITUR LENGKAP)
// ============================================================================
export const AdminMissionsTab: React.FC = () => {
  const {
    accounts,
    missions,
    missionConfig,
    missionProgressByAccount,
    missionClaimLogs,
    devRoles,
    dashboardEffectEvents,
    adminConfigSyncTelemetry,
    adminCreateMission,
    adminUpdateMission,
    adminDeleteMission,
    adminDuplicateMission,
    adminToggleMissionActive,
    adminReorderMissions,
    adminUpdateMissionRewards,
    adminUpdateMission7DayRewards,
    adminUpdateMissionScheduleAndQuota,
    adminCreateMissionFromPreset,
    adminBulkToggleAllMissions,
    adminBulkScaleMissionRewards,
    adminBulkDeletePausedMissions,
    adminResetAccountMissionProgress,
    adminResetAllDailyMissionsProgress,
    adminGrantMissionRewardToAccount,
    adminSimulateMissionTickForAccount,
    adminSetAccountStreakDay,
    adminUpdateMissionSystemConfig,
    adminClearMissionClaimLogs,
  } = useBank();

  const [subTab, setSubTab] = useState<'list_editor' | 'bulk_tools' | 'account_ops' | 'system_logs'>(
    'list_editor'
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const flash = (ok: boolean, text: string) => {
    setFeedback({ type: ok ? 'success' : 'error', text });
  };

  // Search & Filter missions
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MissionCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');

  // Create / Edit Mission Form
  const [editingMissionId, setEditingMissionId] = useState<string | null>(null);
  const [mCategory, setMCategory] = useState<MissionCategory>('daily');
  const [mTitle, setMTitle] = useState('');
  const [mDesc, setMDesc] = useState('');
  const [mEmoji, setMEmoji] = useState('🎯');
  const [mTrackingMode, setMTrackingMode] = useState<MissionTrackingMode>('auto');
  const [mMetricKey, setMMetricKey] = useState<MissionMetricKey>('transfer_count');
  const [mTargetValue, setMTargetValue] = useState<string>('1');
  const [mUnitLabel, setMUnitLabel] = useState<string>('kali');
  const [mBadgeText, setMBadgeText] = useState<string>('');
  const [mIsActive, setMIsActive] = useState<boolean>(true);
  const [mSortOrder, setMSortOrder] = useState<string>('1');
  const [mRewardDraft, setMRewardDraft] = useState<RewardDraftStrings>(() => bundleToDraft());

  // 7-Day Streak Editor state
  const [mStreakMissPolicy, setMStreakMissPolicy] = useState<MissionStreakMissPolicy>('reset_day_1');
  const [mStreakDays, setMStreakDays] = useState<
    Array<{ day: number; title: string; rewards: RewardDraftStrings }>
  >(() =>
    [1, 2, 3, 4, 5, 6, 7].map((day) => ({
      day,
      title: `Hari ke-${day}`,
      rewards: bundleToDraft({ money: day * 250_000, spinCoins: day * 5 }),
    }))
  );

  // Schedule, Quota & Eligibility state
  const [mStartAt, setMStartAt] = useState('');
  const [mEndAt, setMEndAt] = useState('');
  const [mMaxClaimsPerAccount, setMMaxClaimsPerAccount] = useState<string>('0');
  const [mGlobalClaimQuota, setMGlobalClaimQuota] = useState<string>('0');
  const [mRequireVerified, setMRequireVerified] = useState<boolean>(false);
  const [mTargetTiers, setMTargetTiers] = useState<CardTier[]>([]);

  // System config draft (protected by isDirtyRef so polling NEVER overwrites while typing!)
  const isSysConfigDirtyRef = useRef(false);
  const [sysDraft, setSysDraft] = useState(() => ({
    enabled: missionConfig.enabled,
    dailyResetHourWib: String(missionConfig.dailyResetHourWib ?? 0),
    showEmptyBannerInfo: missionConfig.showEmptyBannerInfo,
    emptyStateTitle: missionConfig.emptyStateTitle ?? '',
    emptyStateDescription: missionConfig.emptyStateDescription ?? '',
    allowManualClaimFallback: missionConfig.allowManualClaimFallback,
    notifyOnMissionComplete: missionConfig.notifyOnMissionComplete,
  }));

  useEffect(() => {
    if (!isSysConfigDirtyRef.current) {
      setSysDraft({
        enabled: missionConfig.enabled,
        dailyResetHourWib: String(missionConfig.dailyResetHourWib ?? 0),
        showEmptyBannerInfo: missionConfig.showEmptyBannerInfo,
        emptyStateTitle: missionConfig.emptyStateTitle ?? '',
        emptyStateDescription: missionConfig.emptyStateDescription ?? '',
        allowManualClaimFallback: missionConfig.allowManualClaimFallback,
        notifyOnMissionComplete: missionConfig.notifyOnMissionComplete,
      });
    }
  }, [missionConfig]);

  // Bulk Ops state
  const [bulkScaleMult, setBulkScaleMult] = useState<string>('2');

  // Account Ops state
  const [opsAccountId, setOpsAccountId] = useState<string>(() => accounts[0]?.id || '');
  const [opsMissionId, setOpsMissionId] = useState<string>(() => missions[0]?.id || '');
  const [opsTickDelta, setOpsTickDelta] = useState<string>('1');
  const [opsStreakDay, setOpsStreakDay] = useState<string>('1');
  const [opsGrantDay, setOpsGrantDay] = useState<string>('1');

  useEffect(() => {
    if (missions.length > 0 && !missions.some((m) => m.id === opsMissionId)) {
      setOpsMissionId(missions[0].id);
    }
  }, [missions, opsMissionId]);

  useEffect(() => {
    if (accounts.length > 0 && !accounts.some((a) => a.id === opsAccountId)) {
      setOpsAccountId(accounts[0].id);
    }
  }, [accounts, opsAccountId]);

  const sortedFilteredMissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return [...missions]
      .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
      .filter((m) => {
        if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;
        if (statusFilter === 'active' && !m.isActive) return false;
        if (statusFilter === 'paused' && m.isActive) return false;
        if (q) {
          return (
            m.title.toLowerCase().includes(q) ||
            m.description.toLowerCase().includes(q) ||
            m.metricKey.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [missions, searchQuery, categoryFilter, statusFilter]);

  const loadMissionIntoEditor = (m: AppMissionDefinition) => {
    setEditingMissionId(m.id);
    setMCategory(m.category);
    setMTitle(m.title);
    setMDesc(m.description);
    setMEmoji(m.iconEmoji || '🎯');
    setMTrackingMode(m.trackingMode);
    setMMetricKey(m.metricKey);
    setMTargetValue(String(m.targetValue ?? 1));
    setMUnitLabel(m.unitLabel || '');
    setMBadgeText(m.badgeText || '');
    setMIsActive(m.isActive);
    setMSortOrder(String(m.sortOrder ?? 1));
    setMRewardDraft(bundleToDraft(m.rewards));
    setMStreakMissPolicy(m.streakMissPolicy || 'reset_day_1');
    setMStreakDays(
      [1, 2, 3, 4, 5, 6, 7].map((d) => {
        const found = m.streakDays?.find((x) => x.day === d);
        return {
          day: d,
          title: found?.title || `Hari ke-${d}`,
          rewards: bundleToDraft(found?.rewards),
        };
      })
    );
    setMStartAt(m.startAt || '');
    setMEndAt(m.endAt || '');
    setMMaxClaimsPerAccount(m.maxClaimsPerAccount !== undefined ? String(m.maxClaimsPerAccount) : '0');
    setMGlobalClaimQuota(m.globalClaimQuota !== undefined ? String(m.globalClaimQuota) : '0');
    setMRequireVerified(Boolean(m.requireVerifiedAccount));
    setMTargetTiers(m.targetTiers || []);
    setSubTab('list_editor');
  };

  const resetEditorToNew = () => {
    setEditingMissionId(null);
    setMCategory('daily');
    setMTitle('');
    setMDesc('');
    setMEmoji('🎯');
    setMTrackingMode('auto');
    setMMetricKey('transfer_count');
    setMTargetValue('1');
    setMUnitLabel('kali');
    setMBadgeText('');
    setMIsActive(true);
    setMSortOrder(String(missions.length + 1));
    setMRewardDraft(bundleToDraft());
    setMStreakMissPolicy('reset_day_1');
    setMStartAt('');
    setMEndAt('');
    setMMaxClaimsPerAccount('0');
    setMGlobalClaimQuota('0');
    setMRequireVerified(false);
    setMTargetTiers([]);
  };

  const handleSaveMissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rewardBundle = draftToBundle(mRewardDraft);
    const streakDaysPayload: MissionDayRewardConfig[] = mStreakDays.map((d) => ({
      day: d.day,
      title: d.title.trim() || `Hari ke-${d.day}`,
      rewards: draftToBundle(d.rewards),
    }));
    const maxClaimsNum = parseIntStrict(mMaxClaimsPerAccount, 0);
    const globalQuotaNum = parseIntStrict(mGlobalClaimQuota, 0);

    const payload = {
      category: mCategory,
      title: mTitle.trim(),
      description: mDesc.trim() || 'Selesaikan misi untuk mengklaim hadiah.',
      iconEmoji: mEmoji.trim() || '🎯',
      trackingMode: mTrackingMode,
      metricKey: mMetricKey,
      targetValue: parseIntStrict(mTargetValue, 1),
      unitLabel: mUnitLabel.trim() || undefined,
      badgeText: mBadgeText.trim() || undefined,
      isActive: mIsActive,
      sortOrder: parseIntStrict(mSortOrder, 1),
      rewards: rewardBundle,
      streakDays: mCategory === 'streak_7' ? streakDaysPayload : undefined,
      streakMissPolicy: mCategory === 'streak_7' ? mStreakMissPolicy : undefined,
      startAt: mStartAt.trim() || undefined,
      endAt: mEndAt.trim() || undefined,
      maxClaimsPerAccount: maxClaimsNum > 0 ? maxClaimsNum : undefined,
      globalClaimQuota: globalQuotaNum > 0 ? globalQuotaNum : undefined,
      requireVerifiedAccount: mRequireVerified,
      targetTiers: mTargetTiers.length > 0 ? mTargetTiers : undefined,
    };

    if (editingMissionId) {
      const r1 = adminUpdateMission(editingMissionId, payload);
      adminUpdateMissionRewards(editingMissionId, rewardBundle);
      if (mCategory === 'streak_7') {
        adminUpdateMission7DayRewards(editingMissionId, streakDaysPayload, mStreakMissPolicy);
      }
      adminUpdateMissionScheduleAndQuota(editingMissionId, {
        startAt: payload.startAt,
        endAt: payload.endAt,
        maxClaimsPerAccount: payload.maxClaimsPerAccount,
        globalClaimQuota: payload.globalClaimQuota,
        targetTiers: payload.targetTiers,
        requireVerifiedAccount: payload.requireVerifiedAccount,
      });
      flash(r1.success, r1.message);
      if (r1.success) resetEditorToNew();
    } else {
      const res = adminCreateMission(payload);
      flash(res.success, res.message);
      if (res.success) resetEditorToNew();
    }
  };

  const handleMoveMissionOrder = (missionId: string, dir: -1 | 1) => {
    const ordered = [...missions].sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
    const idx = ordered.findIndex((m) => m.id === missionId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= ordered.length) return;
    const temp = ordered[idx];
    ordered[idx] = ordered[swapIdx];
    ordered[swapIdx] = temp;
    const res = adminReorderMissions(ordered.map((m) => m.id));
    flash(res.success, res.message);
  };

  const handleSaveSystemConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminUpdateMissionSystemConfig({
      enabled: sysDraft.enabled,
      dailyResetHourWib: parseIntStrict(sysDraft.dailyResetHourWib, 0, 23),
      showEmptyBannerInfo: sysDraft.showEmptyBannerInfo,
      emptyStateTitle: sysDraft.emptyStateTitle,
      emptyStateDescription: sysDraft.emptyStateDescription,
      allowManualClaimFallback: sysDraft.allowManualClaimFallback,
      notifyOnMissionComplete: sysDraft.notifyOnMissionComplete,
    });
    isSysConfigDirtyRef.current = false;
    flash(res.success, res.message);
  };

  const renderRewardFieldsGrid = (
    draft: RewardDraftStrings,
    onChange: (next: RewardDraftStrings) => void,
    compact = false
  ) => (
    <div className={`grid ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'} gap-2.5`}>
      <div>
        <label className="text-[10px] font-bold text-emerald-300 block mb-1">Uang Tunai (Rp)</label>
        <input
          type="number"
          min={0}
          value={draft.money}
          onChange={(e) => onChange({ ...draft, money: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-amber-300 block mb-1">Coin Spin</label>
        <input
          type="number"
          min={0}
          value={draft.spinCoins}
          onChange={(e) => onChange({ ...draft, spinCoins: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-cyan-300 block mb-1">Diamond (Permata)</label>
        <input
          type="number"
          min={0}
          value={draft.diamonds}
          onChange={(e) => onChange({ ...draft, diamonds: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-yellow-300 block mb-1">Emas 24K (gram)</label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={draft.goldGrams}
          onChange={(e) => onChange({ ...draft, goldGrams: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-yellow-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-fuchsia-300 block mb-1">Poin Rewards</label>
        <input
          type="number"
          min={0}
          value={draft.rewardPoints}
          onChange={(e) => onChange({ ...draft, rewardPoints: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-fuchsia-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-indigo-300 block mb-1">Voucher Level</label>
        <input
          type="number"
          min={0}
          value={draft.levelVouchers}
          onChange={(e) => onChange({ ...draft, levelVouchers: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-indigo-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-sky-300 block mb-1">Boost Level Kerja</label>
        <input
          type="number"
          min={0}
          value={draft.jobLevelBoost}
          onChange={(e) => onChange({ ...draft, jobLevelBoost: e.target.value })}
          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sky-300 font-mono text-xs"
        />
      </div>
      <div>
        <label className="text-[10px] font-bold text-rose-300 block mb-1">Hadiah Tier Kartu</label>
        <select
          value={draft.cardTierReward}
          onChange={(e) => onChange({ ...draft, cardTierReward: e.target.value })}
          className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
        >
          <option value="">-- Tidak Ada --</option>
          {ALL_CARD_TIERS.map((t) => (
            <option key={t} value={t}>
              Tier {CARD_TIER_CONFIGS[t].name}
            </option>
          ))}
        </select>
      </div>
      {!compact && (
        <>
          <div>
            <label className="text-[10px] font-bold text-amber-200 block mb-1">Hadiah Role Dev/Staff</label>
            <select
              value={draft.devRoleId}
              onChange={(e) => onChange({ ...draft, devRoleId: e.target.value })}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="">-- Tidak Ada --</option>
              {(devRoles || []).map((r) => (
                <option key={r.id} value={r.id}>
                  🛡️ Slot {r.slotNumber} — {r.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-cyan-200 block mb-1">Efek Dashboard</label>
            <select
              value={draft.dashboardEffectId}
              onChange={(e) => onChange({ ...draft, dashboardEffectId: e.target.value })}
              className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="">-- Tidak Ada --</option>
              {(dashboardEffectEvents || []).map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-300 block mb-1">
              Label Hadiah Khusus / Catatan Kustom
            </label>
            <input
              type="text"
              value={draft.customGiftLabel}
              onChange={(e) => onChange({ ...draft, customGiftLabel: e.target.value })}
              placeholder="Contoh: Title Sultan Harian (opsional)..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Header Banner */}
      <div className="rounded-3xl border-2 border-emerald-500/50 bg-gradient-to-br from-slate-900 via-emerald-950/35 to-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              <span>PUSAT KENDALI MISI HARIAN, 7-HARI &amp; MISI BIASA (25 FITUR ADMIN)</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Editor Misi Lengkap, Multi-Hadiah, Jadwal, Kuota &amp; Operasi Massal
            </h2>
            <p className="text-slate-300">
              Secara bawaan daftar misi dimulai <strong>kosong (0 misi)</strong>. Tambahkan misi lewat 7 preset kilat atau buat misi kustom dengan hadiah penuh (Uang, Coin, Diamond, Emas, Level, Tier, Role, Efek).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/40 font-mono text-[11px] text-emerald-300 flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5" />
              <span>
                {adminConfigSyncTelemetry.lastSavedWibLabel
                  ? `Tersimpan ${adminConfigSyncTelemetry.lastSavedWibLabel}`
                  : 'Sinkronisasi Cloud Real-Time Aktif'}
              </span>
            </div>
          </div>
        </div>

        {/* Sub-tab Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'list_editor', label: `Editor & Daftar Misi (${missions.length})`, icon: <Edit3 className="w-3.5 h-3.5" /> },
            { id: 'bulk_tools', label: 'Preset Kilat & Kontrol Massal', icon: <Layers className="w-3.5 h-3.5" /> },
            { id: 'account_ops', label: 'Operasi Progres & Hibah Akun', icon: <Users className="w-3.5 h-3.5" /> },
            { id: 'system_logs', label: `Sistem Misi & Log Klaim (${missionClaimLogs.length})`, icon: <History className="w-3.5 h-3.5" /> },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as typeof subTab)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition ${
                subTab === t.id
                  ? 'bg-emerald-400 text-slate-950 font-black shadow-lg'
                  : 'bg-slate-950 text-slate-300 border border-slate-700 hover:border-emerald-400/60'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
              : 'bg-rose-950/90 border-rose-400 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer opacity-75 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {confirmAction && (
        <div className="p-4 rounded-2xl border-2 border-rose-400 bg-rose-950/90 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-sm">{confirmAction.title}</p>
              <p className="text-[11px] text-rose-200">{confirmAction.message}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setConfirmAction(null)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                confirmAction.onConfirm();
                setConfirmAction(null);
              }}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-black cursor-pointer"
            >
              Ya, Jalankan Sekarang
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 1: EDITOR & DAFTAR MISI */}
      {subTab === 'list_editor' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* LEFT: Form Buat / Edit Misi */}
          <form
            onSubmit={handleSaveMissionSubmit}
            className="xl:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-white text-base flex items-center gap-2">
                  {editingMissionId ? <Edit3 className="w-4 h-4 text-amber-400" /> : <Plus className="w-4 h-4 text-emerald-400" />}
                  <span>{editingMissionId ? 'Edit Misi Terpilih' : 'Buat Misi Baru'}</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Misi akan langsung tampil ke semua nasabah sesuai kategori &amp; filter target.
                </p>
              </div>
              {editingMissionId && (
                <button
                  type="button"
                  onClick={resetEditorToNew}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer hover:bg-slate-700"
                >
                  Batal Edit
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Kategori Misi</label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as MissionCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                >
                  <option value="daily">📅 Misi Harian</option>
                  <option value="streak_7">🔥 Misi Harian 7-Hari</option>
                  <option value="normal">🏆 Misi Biasa</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Mode Pelacakan</label>
                <select
                  value={mTrackingMode}
                  onChange={(e) => setMTrackingMode(e.target.value as MissionTrackingMode)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                >
                  <option value="auto">Otomatis Real-Time</option>
                  <option value="manual">Klaim / Check-In Manual</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Ikon Emoji &amp; Urutan</label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={mEmoji}
                    onChange={(e) => setMEmoji(e.target.value)}
                    className="w-14 px-2 py-2 rounded-xl bg-slate-950 border border-slate-700 text-center text-white"
                  />
                  <input
                    type="number"
                    min={1}
                    value={mSortOrder}
                    onChange={(e) => setMSortOrder(e.target.value)}
                    className="flex-1 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                    title="Urutan Tampil"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Judul Misi *</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="Contoh: Transfer Kilat Harian Berhadiah..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Label Lencana (Opsional)</label>
                <input
                  type="text"
                  value={mBadgeText}
                  onChange={(e) => setMBadgeText(e.target.value)}
                  placeholder="Misal: Harian / VIP"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">Deskripsi Tugas Misi</label>
              <textarea
                rows={2}
                value={mDesc}
                onChange={(e) => setMDesc(e.target.value)}
                placeholder="Jelaskan cara menyelesaikan misi bagi nasabah..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Pemicu Aktivitas</label>
                <select
                  value={mMetricKey}
                  onChange={(e) => {
                    const key = e.target.value as MissionMetricKey;
                    setMMetricKey(key);
                    const meta = METRIC_OPTIONS.find((x) => x.value === key);
                    if (meta) setMUnitLabel(meta.unit);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  {METRIC_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Target Angka</label>
                <input
                  type="number"
                  min={1}
                  value={mTargetValue}
                  onChange={(e) => setMTargetValue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">Satuan Unit</label>
                <input
                  type="text"
                  value={mUnitLabel}
                  onChange={(e) => setMUnitLabel(e.target.value)}
                  placeholder="kali / spin / Rp"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Paket Multi-Hadiah */}
            <div className="rounded-2xl border border-amber-500/40 bg-slate-950/90 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 flex items-center gap-1.5">
                  <Gift className="w-4 h-4" />
                  <span>Paket Multi-Hadiah Lengkap (Isi 0 jika tidak diberikan)</span>
                </span>
              </div>
              {renderRewardFieldsGrid(mRewardDraft, setMRewardDraft)}
            </div>

            {/* Editor khusus Misi 7-Hari */}
            {mCategory === 'streak_7' && (
              <div className="rounded-2xl border border-orange-500/50 bg-orange-950/20 p-3.5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-orange-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4" />
                    <span>Konfigurasi Misi Beruntun 7-Hari (Hari 1 s/d Hari 7)</span>
                  </span>
                  <select
                    value={mStreakMissPolicy}
                    onChange={(e) => setMStreakMissPolicy(e.target.value as MissionStreakMissPolicy)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-orange-400/50 text-orange-200 font-bold"
                  >
                    <option value="reset_day_1">Jika Terlewat 1 Hari: Reset ke Hari 1</option>
                    <option value="continue">Jika Terlewat 1 Hari: Tetap Lanjut</option>
                  </select>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {mStreakDays.map((dayCfg, idx) => (
                    <div key={dayCfg.day} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-black font-mono">
                          Hari {dayCfg.day}
                        </span>
                        <input
                          type="text"
                          value={dayCfg.title}
                          onChange={(e) => {
                            const next = [...mStreakDays];
                            next[idx] = { ...dayCfg, title: e.target.value };
                            setMStreakDays(next);
                          }}
                          className="flex-1 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white font-bold text-[11px]"
                        />
                      </div>
                      {renderRewardFieldsGrid(
                        dayCfg.rewards,
                        (nextRewards) => {
                          const next = [...mStreakDays];
                          next[idx] = { ...dayCfg, rewards: nextRewards };
                          setMStreakDays(next);
                        },
                        true
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Jadwal, Kuota & Target Tier */}
            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-3">
              <span className="font-black text-sky-300 flex items-center gap-1.5">
                <CalendarClock className="w-4 h-4" />
                <span>Jadwal, Kuota &amp; Filter Nasabah (0 = Tanpa Batas)</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Mulai (Opsional)</label>
                  <input
                    type="datetime-local"
                    value={mStartAt}
                    onChange={(e) => setMStartAt(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Berakhir (Opsional)</label>
                  <input
                    type="datetime-local"
                    value={mEndAt}
                    onChange={(e) => setMEndAt(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Maks Klaim/Akun</label>
                  <input
                    type="number"
                    min={0}
                    value={mMaxClaimsPerAccount}
                    onChange={(e) => setMMaxClaimsPerAccount(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Kuota Global</label>
                  <input
                    type="number"
                    min={0}
                    value={mGlobalClaimQuota}
                    onChange={(e) => setMGlobalClaimQuota(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-200 font-bold">
                  <input
                    type="checkbox"
                    checked={mIsActive}
                    onChange={(e) => setMIsActive(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span>Langsung Aktif</span>
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-sky-300 font-bold">
                  <input
                    type="checkbox"
                    checked={mRequireVerified}
                    onChange={(e) => setMRequireVerified(e.target.checked)}
                    className="accent-sky-400"
                  />
                  <span>Wajib Centang Biru</span>
                </label>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CARD_TIERS.map((tier) => {
                  const selected = mTargetTiers.includes(tier);
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() =>
                        setMTargetTiers((prev) =>
                          prev.includes(tier) ? prev.filter((x) => x !== tier) : [...prev, tier]
                        )
                      }
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border ${
                        selected
                          ? 'bg-sky-400 text-slate-950 border-sky-300'
                          : 'bg-slate-900 text-slate-400 border-slate-700'
                      }`}
                    >
                      {tier}
                    </button>
                  );
                })}
                <span className="text-[10px] text-slate-500 self-center">
                  {mTargetTiers.length === 0 ? '(Semua Tier Kartu)' : `(${mTargetTiers.length} tier dipilih)`}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg"
            >
              <Save className="w-4 h-4" />
              <span>{editingMissionId ? 'Simpan Perubahan Misi' : 'Terbitkan Misi Sekarang'}</span>
            </button>
          </form>

          {/* RIGHT: Daftar Misi Terdaftar */}
          <div className="xl:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">Daftar Misi ({sortedFilteredMissions.length})</h3>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari misi..."
                    className="pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px]"
                  />
                </div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as typeof categoryFilter)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px]"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="daily">Misi Harian</option>
                  <option value="streak_7">Misi 7-Hari</option>
                  <option value="normal">Misi Biasa</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px]"
                >
                  <option value="all">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="paused">Dijeda</option>
                </select>
              </div>
            </div>

            {sortedFilteredMissions.length === 0 ? (
              <div className="py-12 text-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 space-y-2 px-4">
                <Target className="w-9 h-9 text-slate-600 mx-auto" />
                <p className="font-black text-white text-sm">Belum Ada Misi Aktif</p>
                <p className="text-slate-400">
                  Misi sengaja dimulai dalam kondisi kosong. Gunakan form di kiri atau buka tab <strong>Preset Kilat &amp; Kontrol Massal</strong> untuk langsung menambahkan misi.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[780px] overflow-y-auto pr-1">
                {sortedFilteredMissions.map((m) => (
                  <div
                    key={m.id}
                    className={`rounded-2xl border p-3.5 space-y-2.5 ${
                      m.isActive ? 'border-emerald-500/40 bg-slate-950' : 'border-slate-800 bg-slate-950/60 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-base">{m.iconEmoji || '🎯'}</span>
                          <span className="font-black text-white text-sm">{m.title}</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              m.category === 'daily'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : m.category === 'streak_7'
                                ? 'bg-orange-500/20 text-orange-300'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {m.category === 'daily' ? 'Harian' : m.category === 'streak_7' ? '7-Hari' : 'Biasa'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              m.isActive ? 'bg-emerald-400 text-slate-950' : 'bg-slate-700 text-slate-300'
                            }`}
                          >
                            {m.isActive ? 'AKTIF' : 'DIJEDA'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{m.description}</p>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">
                          Target: {m.targetValue} {m.unitLabel || m.metricKey} • Klaim Global: {m.totalGlobalClaims || 0}
                          {m.globalClaimQuota ? `/${m.globalClaimQuota}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveMissionOrder(m.id, -1)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Naikkan Urutan"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveMissionOrder(m.id, 1)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          title="Turunkan Urutan"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => loadMissionIntoEditor(m)}
                        className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminToggleMissionActive(m.id);
                          flash(res.success, res.message);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {m.isActive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{m.isActive ? 'Jeda' : 'Aktifkan'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminDuplicateMission(m.id);
                          flash(res.success, res.message);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Duplikasi
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            title: `Hapus Misi "${m.title}"?`,
                            message: 'Misi akan dihapus permanen dari semua perangkat.',
                            onConfirm: () => {
                              const res = adminDeleteMission(m.id);
                              flash(res.success, res.message);
                            },
                          })
                        }
                        className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PRESET KILAT & KONTROL MASSAL */}
      {subTab === 'bulk_tools' && (
        <div className="space-y-5">
          <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/95 p-5 space-y-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>7 Template Misi Siap Pakai (Tambah 1-Klik)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(
                [
                  { key: 'daily_login', label: '📅 Absen Harian', desc: 'Check-In manual harian + Rp 250rb & 5 Coin' },
                  { key: 'daily_transfer', label: '💸 Transfer Kilat Harian', desc: 'Auto 2x transfer + Rp 500rb & 5 Permata' },
                  { key: 'daily_spin', label: '🎡 Pemutar Spin Harian', desc: 'Auto 3x spin + 15 Coin & Rp 350rb' },
                  { key: 'daily_job', label: '💼 Pekerja Rajin', desc: 'Auto 25 klik kerja + Rp 400rb & Voucher' },
                  { key: 'streak_7_starter', label: '🔥 Misi 7-Hari Sultan', desc: 'Rangkaian Hari 1–7 berhadiah jackpot' },
                  { key: 'normal_gold_investor', label: '👑 Investor Emas 24K', desc: 'Misi Biasa 5x transaksi emas + 2.5 gr' },
                  { key: 'normal_royal_sultan', label: '🏆 Ekspedisi 20x Transaksi', desc: 'Misi Biasa 20 tx + Rp 5 Juta & Boost Lv' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    const res = adminCreateMissionFromPreset(preset.key);
                    flash(res.success, res.message);
                  }}
                  className="p-4 rounded-2xl border border-slate-700 bg-slate-950 hover:border-emerald-400 text-left space-y-1 cursor-pointer transition"
                >
                  <p className="font-black text-white text-sm">{preset.label}</p>
                  <p className="text-[11px] text-slate-400">{preset.desc}</p>
                  <span className="inline-block text-[10px] font-black text-emerald-400 pt-1">
                    + Tambah Misi Ini
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-500/40 bg-slate-900/95 p-5 space-y-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Operasi Massal Seluruh Misi</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <p className="font-bold text-white">Aktifkan / Jeda Semua Misi Sekaligus</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminBulkToggleAllMissions(true);
                      flash(res.success, res.message);
                    }}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer"
                  >
                    Aktifkan Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminBulkToggleAllMissions(false);
                      flash(res.success, res.message);
                    }}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-200 font-bold cursor-pointer"
                  >
                    Jeda Semua
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <p className="font-bold text-white">Kalikan Semua Hadiah Misi (Event Lipat Ganda)</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={0.1}
                    step="0.5"
                    value={bulkScaleMult}
                    onChange={(e) => setBulkScaleMult(e.target.value)}
                    className="w-24 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const mult = parseFloatStrict(bulkScaleMult, 0.1, 100);
                      const res = adminBulkScaleMissionRewards(mult);
                      flash(res.success, res.message);
                    }}
                    className="flex-1 py-2 rounded-xl bg-amber-400 text-slate-950 font-black cursor-pointer"
                  >
                    Kalikan Hadiah
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <p className="font-bold text-white">Bersihkan Misi Jeda &amp; Reset Harian</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        title: 'Hapus Semua Misi Dijeda?',
                        message: 'Semua misi berstatus Dijeda akan dihapus permanen.',
                        onConfirm: () => {
                          const res = adminBulkDeletePausedMissions();
                          flash(res.success, res.message);
                        },
                      })
                    }
                    className="flex-1 py-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 font-bold cursor-pointer"
                  >
                    Hapus Dijeda
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setConfirmAction({
                        title: 'Reset Progres Harian Semua Akun?',
                        message: 'Seluruh progres Misi Harian di semua nasabah diulang dari 0.',
                        onConfirm: () => {
                          const res = adminResetAllDailyMissionsProgress();
                          flash(res.success, res.message);
                        },
                      })
                    }
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-amber-300 font-bold cursor-pointer"
                  >
                    Reset Harian
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: OPERASI PROGRES & HIBAH AKUN */}
      {subTab === 'account_ops' && (
        <div className="rounded-3xl border border-cyan-500/40 bg-slate-900/95 p-5 space-y-4">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>Simulasi Progres, Atur Hari 7-Hari &amp; Kirim Hadiah Misi Langsung</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">Pilih Rekening Nasabah</label>
              <select
                value={opsAccountId}
                onChange={(e) => setOpsAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.fullName} — {acc.accountNumber} ({acc.cardTier.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">Pilih Misi Target</label>
              <select
                value={opsMissionId}
                onChange={(e) => setOpsMissionId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
              >
                {missions.length === 0 ? (
                  <option value="">(Belum ada misi yang dibuat)</option>
                ) : (
                  missions.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.category}] {m.title}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {opsAccountId && opsMissionId && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300">
              Progres Saat Ini:{' '}
              <strong>{missionProgressByAccount[opsAccountId]?.[opsMissionId]?.progress ?? 0}</strong> • Hari Streak:{' '}
              <strong>{missionProgressByAccount[opsAccountId]?.[opsMissionId]?.streakDay ?? 0}</strong> • Total Klaim Akun:{' '}
              <strong>{missionProgressByAccount[opsAccountId]?.[opsMissionId]?.totalClaims ?? 0}</strong>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="font-bold text-emerald-300 block">+ Tambah Progres Simulasi</label>
              <input
                type="number"
                min={1}
                value={opsTickDelta}
                onChange={(e) => setOpsTickDelta(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
              <button
                type="button"
                disabled={!opsMissionId}
                onClick={() => {
                  const res = adminSimulateMissionTickForAccount(
                    opsAccountId,
                    opsMissionId,
                    parseIntStrict(opsTickDelta, 1)
                  );
                  flash(res.success, res.message);
                }}
                className="w-full py-2 rounded-xl bg-emerald-500 text-slate-950 font-black cursor-pointer disabled:opacity-40"
              >
                Tambah Progres
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="font-bold text-orange-300 block">Set Hari Streak (0–7)</label>
              <input
                type="number"
                min={0}
                max={7}
                value={opsStreakDay}
                onChange={(e) => setOpsStreakDay(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
              <button
                type="button"
                disabled={!opsMissionId}
                onClick={() => {
                  const res = adminSetAccountStreakDay(
                    opsAccountId,
                    opsMissionId,
                    parseIntStrict(opsStreakDay, 0, 7)
                  );
                  flash(res.success, res.message);
                }}
                className="w-full py-2 rounded-xl bg-orange-400 text-slate-950 font-black cursor-pointer disabled:opacity-40"
              >
                Terapkan Hari Streak
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="font-bold text-amber-300 block">Hibahkan Hadiah (Hari Opsional)</label>
              <input
                type="number"
                min={1}
                max={7}
                value={opsGrantDay}
                onChange={(e) => setOpsGrantDay(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono"
              />
              <button
                type="button"
                disabled={!opsMissionId}
                onClick={() => {
                  const targetM = missions.find((m) => m.id === opsMissionId);
                  const res = adminGrantMissionRewardToAccount(
                    opsAccountId,
                    opsMissionId,
                    targetM?.category === 'streak_7' ? parseIntStrict(opsGrantDay, 1, 7) : undefined
                  );
                  flash(res.success, res.message);
                }}
                className="w-full py-2 rounded-xl bg-amber-400 text-slate-950 font-black cursor-pointer disabled:opacity-40"
              >
                Kirim Hadiah Misi
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 flex flex-col justify-between">
              <span className="font-bold text-rose-300">Reset Progres Akun Ini</span>
              <div className="space-y-1.5">
                <button
                  type="button"
                  disabled={!opsMissionId}
                  onClick={() => {
                    const res = adminResetAccountMissionProgress(opsAccountId, opsMissionId);
                    flash(res.success, res.message);
                  }}
                  className="w-full py-1.5 rounded-xl bg-rose-500/20 text-rose-200 font-bold cursor-pointer disabled:opacity-40"
                >
                  Reset Misi Ini
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = adminResetAccountMissionProgress(opsAccountId);
                    flash(res.success, res.message);
                  }}
                  className="w-full py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Reset Semua Misi Akun
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: PENGATURAN SISTEM & LOG KLAIM */}
      {subTab === 'system_logs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <form
            onSubmit={handleSaveSystemConfig}
            className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-4"
          >
            <div className="border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Global Sistem Misi (Anti-Reset)</span>
              </h3>
            </div>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="font-bold text-white">Aktifkan Sistem Misi Nasabah</span>
                <input
                  type="checkbox"
                  checked={sysDraft.enabled}
                  onChange={(e) => {
                    isSysConfigDirtyRef.current = true;
                    setSysDraft((prev) => ({ ...prev, enabled: e.target.checked }));
                  }}
                  className="accent-emerald-400"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="font-bold text-white">Tampilkan Info Saat Misi Kosong</span>
                <input
                  type="checkbox"
                  checked={sysDraft.showEmptyBannerInfo}
                  onChange={(e) => {
                    isSysConfigDirtyRef.current = true;
                    setSysDraft((prev) => ({ ...prev, showEmptyBannerInfo: e.target.checked }));
                  }}
                  className="accent-emerald-400"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="font-bold text-white">Izinkan Klaim Manual Cadangan</span>
                <input
                  type="checkbox"
                  checked={sysDraft.allowManualClaimFallback}
                  onChange={(e) => {
                    isSysConfigDirtyRef.current = true;
                    setSysDraft((prev) => ({ ...prev, allowManualClaimFallback: e.target.checked }));
                  }}
                  className="accent-emerald-400"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <span className="font-bold text-white">Notifikasi Saat Misi Siap Klaim</span>
                <input
                  type="checkbox"
                  checked={sysDraft.notifyOnMissionComplete}
                  onChange={(e) => {
                    isSysConfigDirtyRef.current = true;
                    setSysDraft((prev) => ({ ...prev, notifyOnMissionComplete: e.target.checked }));
                  }}
                  className="accent-emerald-400"
                />
              </label>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">Jam Reset Harian (0–23 WIB)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={sysDraft.dailyResetHourWib}
                onChange={(e) => {
                  isSysConfigDirtyRef.current = true;
                  setSysDraft((prev) => ({ ...prev, dailyResetHourWib: e.target.value }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">Judul Status Kosong</label>
              <input
                type="text"
                value={sysDraft.emptyStateTitle}
                onChange={(e) => {
                  isSysConfigDirtyRef.current = true;
                  setSysDraft((prev) => ({ ...prev, emptyStateTitle: e.target.value }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-300 block mb-1">Deskripsi Status Kosong</label>
              <textarea
                rows={2}
                value={sysDraft.emptyStateDescription}
                onChange={(e) => {
                  isSysConfigDirtyRef.current = true;
                  setSysDraft((prev) => ({ ...prev, emptyStateDescription: e.target.value }));
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Pengaturan Sistem Misi</span>
            </button>
          </form>

          {/* Log Klaim Misi */}
          <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-base">
                Log Klaim Hadiah Misi ({missionClaimLogs.length})
              </h3>
              {missionClaimLogs.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      title: 'Bersihkan Log Klaim Misi?',
                      message: 'Seluruh riwayat log klaim misi akan dikosongkan.',
                      onConfirm: () => {
                        const res = adminClearMissionClaimLogs();
                        flash(res.success, res.message);
                      },
                    })
                  }
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold cursor-pointer"
                >
                  Bersihkan Log
                </button>
              )}
            </div>
            {missionClaimLogs.length === 0 ? (
              <p className="py-10 text-center text-slate-500">Belum ada riwayat klaim misi.</p>
            ) : (
              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {missionClaimLogs.slice(0, 60).map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-bold text-white">
                        {log.accountName} • {log.missionTitle}
                        {log.dayClaimed ? ` (Hari ke-${log.dayClaimed})` : ''}
                      </p>
                      <p className="text-[11px] text-emerald-300">{log.rewardsSummary}</p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {formatIndoDate(log.claimedAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// TAB 2: ADMIN LEADERBOARD MULTI-ASET & BADGE TOP 1–100
// ============================================================================
export const AdminLeaderboardTab: React.FC = () => {
  const {
    accounts,
    transactions,
    leaderboardConfig,
    adminConfigSyncTelemetry,
    adminUpdateLeaderboardConfig,
    adminToggleLeaderboardAdminTier,
    adminAddLeaderboardCategory,
    adminUpdateLeaderboardCategory,
    adminDeleteLeaderboardCategory,
    adminResetLeaderboardDefault,
  } = useBank();

  const isDirtyRef = useRef(false);
  const [draft, setDraft] = useState(() => ({
    enabled: leaderboardConfig.enabled,
    showAdminTier: leaderboardConfig.showAdminTier,
    maxEntries: String(leaderboardConfig.maxEntries ?? 100),
    showMyRankCard: leaderboardConfig.showMyRankCard,
    hideBannedAccounts: leaderboardConfig.hideBannedAccounts,
    hidePendingAccounts: leaderboardConfig.hidePendingAccounts,
    showTopBadges: leaderboardConfig.showTopBadges !== false,
    showTopBadgesOnCard: leaderboardConfig.showTopBadgesOnCard !== false,
    showTopBadgesInProfile: leaderboardConfig.showTopBadgesInProfile !== false,
    maxBadgeRank: String(leaderboardConfig.maxBadgeRank ?? 100),
    topBadgeCustomPrefix: leaderboardConfig.topBadgeCustomPrefix ?? 'Top',
  }));

  useEffect(() => {
    if (!isDirtyRef.current) {
      setDraft({
        enabled: leaderboardConfig.enabled,
        showAdminTier: leaderboardConfig.showAdminTier,
        maxEntries: String(leaderboardConfig.maxEntries ?? 100),
        showMyRankCard: leaderboardConfig.showMyRankCard,
        hideBannedAccounts: leaderboardConfig.hideBannedAccounts,
        hidePendingAccounts: leaderboardConfig.hidePendingAccounts,
        showTopBadges: leaderboardConfig.showTopBadges !== false,
        showTopBadgesOnCard: leaderboardConfig.showTopBadgesOnCard !== false,
        showTopBadgesInProfile: leaderboardConfig.showTopBadgesInProfile !== false,
        maxBadgeRank: String(leaderboardConfig.maxBadgeRank ?? 100),
        topBadgeCustomPrefix: leaderboardConfig.topBadgeCustomPrefix ?? 'Top',
      });
    }
  }, [leaderboardConfig]);

  // Add category form
  const [newCatKey, setNewCatKey] = useState<LeaderboardCategoryKey>('goldGrams');
  const [newCatLabel, setNewCatLabel] = useState<string>('Emas 24K');
  const [newCatUnit, setNewCatUnit] = useState<string>('gr');
  const [newCatAccent, setNewCatAccent] =
    useState<LeaderboardCategoryConfig['accentColor']>('yellow');

  // Preview tab
  const [previewCatId, setPreviewCatId] = useState<string>(
    () => leaderboardConfig.categories[0]?.id || 'lb-balance'
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const flash = (ok: boolean, text: string) => {
    setFeedback({ type: ok ? 'success' : 'error', text });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminUpdateLeaderboardConfig({
      enabled: draft.enabled,
      showAdminTier: draft.showAdminTier,
      maxEntries: parseIntStrict(draft.maxEntries, 5, 500),
      showMyRankCard: draft.showMyRankCard,
      hideBannedAccounts: draft.hideBannedAccounts,
      hidePendingAccounts: draft.hidePendingAccounts,
      showTopBadges: draft.showTopBadges,
      showTopBadgesOnCard: draft.showTopBadgesOnCard,
      showTopBadgesInProfile: draft.showTopBadgesInProfile,
      maxBadgeRank: parseIntStrict(draft.maxBadgeRank, 1, 500),
      topBadgeCustomPrefix: draft.topBadgeCustomPrefix,
    });
    isDirtyRef.current = false;
    flash(res.success, res.message);
  };

  const sortedCategories = useMemo(
    () => [...(leaderboardConfig.categories || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [leaderboardConfig.categories]
  );

  const previewCategory =
    sortedCategories.find((c) => c.id === previewCatId) || sortedCategories[0];

  const previewRows = useMemo(() => {
    if (!previewCategory) return [];
    return computeLeaderboardRankingForCategory(
      accounts,
      previewCategory,
      leaderboardConfig,
      transactions
    ).slice(0, 15);
  }, [accounts, previewCategory, leaderboardConfig, transactions]);

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="rounded-3xl border-2 border-amber-400/60 bg-gradient-to-br from-slate-900 via-amber-950/35 to-slate-900 p-6 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>PUSAT KENDALI LEADERBOARD MULTI-ASET &amp; BADGE TOP 1–100</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Atur Kategori Leaderboard, Visibilitas Tier ADMIN (∞) &amp; Lencana Top 1–100
            </h2>
            <p className="text-slate-300">
              Bawaan sistem memiliki 3 papan peringkat (<strong>Uang</strong>, <strong>Coin</strong>, <strong>Diamond</strong>) dengan tier <strong>ADMIN (∞) disembunyikan</strong> secara default, serta Badge Top 1 Emas, Top 2 Abu-abu, Top 3 Coklat, &amp; Top #4–#100 Abu-abu Kehitaman.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                const res = adminToggleLeaderboardAdminTier();
                isDirtyRef.current = false;
                setDraft((prev) => ({ ...prev, showAdminTier: res.showAdminTier }));
                flash(res.success, res.message);
              }}
              className={`px-3.5 py-2.5 rounded-xl font-black cursor-pointer border flex items-center gap-1.5 ${
                leaderboardConfig.showAdminTier
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-amber-400'
              }`}
            >
              {leaderboardConfig.showAdminTier ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span>
                {leaderboardConfig.showAdminTier
                  ? 'Tier ADMIN (∞): DITAMPILKAN'
                  : 'Tier ADMIN (∞): DISEMBUNYIKAN (Default)'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 font-bold cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>
      </div>

      {confirmReset && (
        <div className="p-4 rounded-2xl border-2 border-rose-400 bg-rose-950/90 text-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <p className="font-black text-sm">Reset Pengaturan Leaderboard ke Standar Awal?</p>
              <p className="text-[11px] text-rose-200">
                Kategori akan kembali menjadi Uang, Coin, Diamond; Badge Top 1–100 Aktif; Tier ADMIN disembunyikan.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                const res = adminResetLeaderboardDefault();
                isDirtyRef.current = false;
                setConfirmReset(false);
                flash(res.success, res.message);
              }}
              className="px-4 py-1.5 rounded-xl bg-rose-500 text-white font-black cursor-pointer"
            >
              Ya, Reset Standar
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-2xl border font-bold flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
              : 'bg-rose-950/90 border-rose-400 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer">
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: Pengaturan Global & Badge Top 1-100 */}
        <form
          onSubmit={handleSaveSettings}
          className="xl:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Pengaturan Papan Peringkat &amp; Lencana Top</span>
            </h3>
            {adminConfigSyncTelemetry.lastSavedWibLabel && (
              <span className="text-[10px] font-mono text-emerald-300">
                {adminConfigSyncTelemetry.lastSavedWibLabel}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {[
              { key: 'enabled', label: 'Aktifkan Halaman Leaderboard' },
              { key: 'showAdminTier', label: 'Tampilkan Akun Tier ADMIN (∞ Infinity)' },
              { key: 'showMyRankCard', label: 'Tampilkan Kartu "Peringkat Saya"' },
              { key: 'hideBannedAccounts', label: 'Sembunyikan Akun Banned dari Peringkat' },
              { key: 'hidePendingAccounts', label: 'Sembunyikan Akun Pending/Ditolak' },
            ].map((item) => (
              <label
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer"
              >
                <span className="font-bold text-slate-200">{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(draft[item.key as keyof typeof draft])}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setDraft((prev) => ({ ...prev, [item.key]: e.target.checked }));
                  }}
                  className="accent-amber-400"
                />
              </label>
            ))}
          </div>

          {/* Pengaturan Badge Top 1-100 */}
          <div className="rounded-2xl border border-amber-500/40 bg-slate-950/90 p-4 space-y-3">
            <h4 className="font-black text-amber-300 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>Pengaturan Badge Top 1–100 Leaderboard</span>
            </h4>
            <div className="space-y-2">
              <label className="flex items-center justify-between cursor-pointer text-white font-bold">
                <span>Aktifkan Badge Top 1–100</span>
                <input
                  type="checkbox"
                  checked={draft.showTopBadges}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setDraft((prev) => ({ ...prev, showTopBadges: e.target.checked }));
                  }}
                  className="accent-amber-400"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 font-bold">
                <span>Tampilkan di Pojok Kartu ATM</span>
                <input
                  type="checkbox"
                  checked={draft.showTopBadgesOnCard}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setDraft((prev) => ({ ...prev, showTopBadgesOnCard: e.target.checked }));
                  }}
                  className="accent-amber-400"
                />
              </label>
              <label className="flex items-center justify-between cursor-pointer text-slate-300 font-bold">
                <span>Tampilkan di Profil, Pengaturan &amp; Info Akun</span>
                <input
                  type="checkbox"
                  checked={draft.showTopBadgesInProfile}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setDraft((prev) => ({ ...prev, showTopBadgesInProfile: e.target.checked }));
                  }}
                  className="accent-amber-400"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Batas Peringkat Badge (1–500)
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={draft.maxBadgeRank}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setDraft((prev) => ({ ...prev, maxBadgeRank: e.target.value }));
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">
                  Label Awalan Badge (misal: Top)
                </label>
                <input
                  type="text"
                  value={draft.topBadgeCustomPrefix}
                  onChange={(e) => {
                    isDirtyRef.current = true;
                    setDraft((prev) => ({ ...prev, topBadgeCustomPrefix: e.target.value }));
                  }}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">
                Maks Baris Peringkat Ditampilkan (5–500)
              </label>
              <input
                type="number"
                min={5}
                max={500}
                value={draft.maxEntries}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setDraft((prev) => ({ ...prev, maxEntries: e.target.value }));
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
              />
            </div>

            {/* Live Badge Tier Visual Legend */}
            <div className="pt-2 border-t border-slate-800 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 block">
                Pratinjau Gaya Medali &amp; Lencana Top 1–100:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <LeaderboardRankMarker rank={1} prefix={draft.topBadgeCustomPrefix} />
                <LeaderboardRankMarker rank={2} prefix={draft.topBadgeCustomPrefix} />
                <LeaderboardRankMarker rank={3} prefix={draft.topBadgeCustomPrefix} />
                <LeaderboardRankMarker rank={4} prefix={draft.topBadgeCustomPrefix} />
                <LeaderboardRankMarker rank={100} prefix={draft.topBadgeCustomPrefix} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Pengaturan Leaderboard &amp; Badge</span>
          </button>
        </form>

        {/* RIGHT: Kelola Kategori & Pratinjau Peringkat */}
        <div className="xl:col-span-7 space-y-5">
          {/* Tambah & Kelola Kategori */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-4">
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <span>Kategori Papan Peringkat ({sortedCategories.length})</span>
            </h3>

            <div className="space-y-2">
              {sortedCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-[10px] text-cyan-300">
                      {cat.key}
                    </span>
                    <input
                      type="text"
                      value={cat.label}
                      onChange={(e) =>
                        adminUpdateLeaderboardCategory(cat.id, { label: e.target.value })
                      }
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs w-36"
                    />
                    <input
                      type="text"
                      value={cat.unitLabel}
                      onChange={(e) =>
                        adminUpdateLeaderboardCategory(cat.id, { unitLabel: e.target.value })
                      }
                      className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono text-xs w-20"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        adminUpdateLeaderboardCategory(cat.id, { enabled: !cat.enabled })
                      }
                      className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                        cat.enabled
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {cat.enabled ? 'Aktif' : 'Sembunyi'}
                    </button>
                    {sortedCategories.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminDeleteLeaderboardCategory(cat.id);
                          flash(res.success, res.message);
                        }}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Form Tambah Kategori Baru */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2.5">
              <span className="font-bold text-cyan-300 block">Tambah Kategori Leaderboard Baru</span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={newCatKey}
                  onChange={(e) => {
                    const k = e.target.value;
                    setNewCatKey(k);
                    const meta = LEADERBOARD_METRIC_OPTIONS.find((x) => x.key === k);
                    if (meta) {
                      setNewCatLabel(meta.label.split(' ')[0]);
                      setNewCatUnit(meta.unitLabel);
                      setNewCatAccent(meta.accentColor);
                    }
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                >
                  {LEADERBOARD_METRIC_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCatLabel}
                  onChange={(e) => setNewCatLabel(e.target.value)}
                  placeholder="Nama Tab (mis: Emas)"
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                />
                <input
                  type="text"
                  value={newCatUnit}
                  onChange={(e) => setNewCatUnit(e.target.value)}
                  placeholder="Satuan (gr / Poin)"
                  className="px-2.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
                <button
                  type="button"
                  onClick={() => {
                    const res = adminAddLeaderboardCategory({
                      key: newCatKey,
                      label: newCatLabel,
                      unitLabel: newCatUnit,
                      accentColor: newCatAccent,
                    });
                    flash(res.success, res.message);
                  }}
                  className="py-2 px-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Tambah
                </button>
              </div>
            </div>
          </div>

          {/* Live Admin Preview Leaderboard (Nomor & ID Utuh Tanpa Sensor) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-sm">
                Pratinjau Peringkat Langsung (Data Asli Admin Tanpa Sensor)
              </h3>
              <select
                value={previewCategory?.id || ''}
                onChange={(e) => setPreviewCatId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
              >
                {sortedCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {previewRows.map((row) => (
                <div
                  key={row.account.id}
                  className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LeaderboardRankMarker rank={row.rank} prefix={draft.topBadgeCustomPrefix} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white truncate">{row.account.fullName}</span>
                        {isAdminCardAccount(row.account) && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black text-[9px]">
                            ADMIN
                          </span>
                        )}
                        <TopLeaderboardBadges
                          accountId={row.account.id}
                          variant="compact"
                          context="profile"
                        />
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        Rek: {row.account.accountNumber} • ID: {row.account.userId16 || '-'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-black text-emerald-300 tabular-nums shrink-0">
                    {previewCategory
                      ? formatLeaderboardMetricValue(
                          row.score,
                          previewCategory.key,
                          previewCategory.unitLabel,
                          row.isUnlimited
                        )
                      : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
