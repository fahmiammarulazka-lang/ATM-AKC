import React, { useEffect, useMemo, useState } from 'react';
import {
  Flame,
  Snowflake,
  Star,
  Search,
  CheckCircle2,
  RotateCcw,
  Sliders,
  Banknote,
  Coins,
  Ticket,
  ShieldCheck,
  Plus,
  Trash2,
  Eye,
  Trophy,
  Gift,
  Users,
  History,
  CalendarHeart,
  AlertTriangle,
  Power,
  Send,
  RefreshCw,
  Crown,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { isAdminCardAccount } from '../utils/bankUtils';
import { DAILY_ACHIEVEMENT_CATALOG } from '../data/socialAndBankingExtrasCatalog';
import {
  DEFAULT_LOYALTY_EXCHANGE_RATES,
  LOYALTY_100_DAILY_MISSIONS,
  LOYALTY_MISSION_CATEGORY_META,
  computeStreakVisualSnapshot,
  formatLoyaltyRewardLabel,
  getResolvedLoyaltyRedeemPackages,
  getWibDateString,
  normalizeLoyaltyAdminConfig,
} from '../utils/loyaltySystemUtils';
import {
  LoyaltyCustomRedeemPackage,
  LoyaltyDailyMissionCategory,
  LoyaltyDailyMissionOverride,
  LoyaltyRedeemTarget,
  LoyaltyRedemptionRecord,
} from '../types/bank';

interface AdminLoyaltyStreakPanelProps {
  onFeedback?: (message: string) => void;
  isReadOnly?: boolean;
}

type LoyaltyAdminSubTab =
  | 'global_bulk'
  | 'exchange_rates'
  | 'missions_achievements'
  | 'customers_manager'
  | 'redemption_logs';

type CustomerFlameFilter = 'all' | 'active' | 'freeze_1_2' | 'critical_3' | 'reset_0';
type CustomerSortKey = 'streak_desc' | 'points_desc' | 'freeze_desc' | 'name_asc';
type BulkActionType = 'thaw_all' | 'grant_points' | 'grant_cards' | 'reset_missions';

export const AdminLoyaltyStreakPanel: React.FC<AdminLoyaltyStreakPanelProps> = ({
  onFeedback,
  isReadOnly = false,
}) => {
  const {
    accounts,
    loyaltyMap,
    loyaltyConfig,
    adminUpdateLoyaltyConfig,
    adminAdjustLoyaltyPoints,
    adminManageAccountStreak,
    adminBulkThawAllFrozenStreaks,
    adminBulkGrantLoyaltyPoints,
    adminBulkGrantRecoveryCards,
    adminBulkResetDailyLoyaltyMissions,
  } = useBank();

  const cfg = useMemo(() => normalizeLoyaltyAdminConfig(loyaltyConfig), [loyaltyConfig]);
  const todayWib = getWibDateString();

  const [activeSubTab, setActiveSubTab] = useState<LoyaltyAdminSubTab>('global_bulk');

  // Global & Streak Drafts
  const [enabledDraft, setEnabledDraft] = useState<boolean>(cfg.enabled !== false);
  const [streakEnabledDraft, setStreakEnabledDraft] = useState<boolean>(cfg.streakEnabled !== false);
  const [redeemEnabledDraft, setRedeemEnabledDraft] = useState<boolean>(cfg.redeemEnabled !== false);
  const [nationalHolidayDraft, setNationalHolidayDraft] = useState<boolean>(
    Boolean(cfg.nationalHolidayMode)
  );
  const [dailyCheckInDraft, setDailyCheckInDraft] = useState<string>(String(cfg.dailyCheckInPoints));
  const [streakBonus7Draft, setStreakBonus7Draft] = useState<string>(
    String(cfg.streakBonus7DaysPoints)
  );
  const [streakBonus14Draft, setStreakBonus14Draft] = useState<string>(
    String(cfg.streakBonus14DaysPoints ?? 350)
  );
  const [streakBonus30Draft, setStreakBonus30Draft] = useState<string>(
    String(cfg.streakBonus30DaysPoints ?? 1000)
  );
  const [recoveryPriceDraft, setRecoveryPriceDraft] = useState<string>(
    String(cfg.recoveryCardDiamondPrice || 25)
  );
  const [freeze1Draft, setFreeze1Draft] = useState<string>(String(cfg.freezeStage1Days || 1));
  const [freeze2Draft, setFreeze2Draft] = useState<string>(String(cfg.freezeStage2Days || 2));
  const [freeze3Draft, setFreeze3Draft] = useState<string>(
    String(cfg.freezeRecoveryRequiredDays || 3)
  );
  const [expireAfterDraft, setExpireAfterDraft] = useState<string>(
    String(cfg.streakExpireAfterDays || 3)
  );
  const [activeMissionCountDraft, setActiveMissionCountDraft] = useState<string>(
    String(cfg.activeDailyMissionCount || 100)
  );
  const [rewardMultiplierDraft, setRewardMultiplierDraft] = useState<string>(
    String(cfg.missionRewardMultiplier || 1)
  );

  // 3 Standard Exchange Package Drafts
  const [cashPtsDraft, setCashPtsDraft] = useState<string>(
    String(cfg.cashPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints)
  );
  const [cashAmtDraft, setCashAmtDraft] = useState<string>(
    String(cfg.cashPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount)
  );
  const [cashEnabledDraft, setCashEnabledDraft] = useState<boolean>(
    cfg.cashRedeemEnabled !== false
  );

  const [coinPtsDraft, setCoinPtsDraft] = useState<string>(
    String(cfg.coinPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackagePoints)
  );
  const [coinAmtDraft, setCoinAmtDraft] = useState<string>(
    String(cfg.coinPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount)
  );
  const [coinEnabledDraft, setCoinEnabledDraft] = useState<boolean>(
    cfg.coinRedeemEnabled !== false
  );

  const [voucherPtsDraft, setVoucherPtsDraft] = useState<string>(
    String(cfg.voucherPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints)
  );
  const [voucherAmtDraft, setVoucherAmtDraft] = useState<string>(
    String(cfg.voucherPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackageAmount)
  );
  const [voucherEnabledDraft, setVoucherEnabledDraft] = useState<boolean>(
    cfg.voucherRedeemEnabled !== false
  );

  // Daily Redemption Limit Draft
  const [dailyLimitEnabledDraft, setDailyLimitEnabledDraft] = useState<boolean>(
    Boolean(cfg.dailyRedeemLimitEnabled)
  );
  const [dailyLimitMaxDraft, setDailyLimitMaxDraft] = useState<string>(
    String(cfg.dailyRedeemMaxCount || 5)
  );

  // Custom Packages CRUD Draft
  const [customPackagesDraft, setCustomPackagesDraft] = useState<LoyaltyCustomRedeemPackage[]>(
    () => [...(cfg.customRedeemPackages || [])]
  );
  const [newPkgTitle, setNewPkgTitle] = useState<string>('');
  const [newPkgTarget, setNewPkgTarget] = useState<LoyaltyRedeemTarget>('cash');
  const [newPkgPoints, setNewPkgPoints] = useState<string>('500');
  const [newPkgReward, setNewPkgReward] = useState<string>('400000');
  const [newPkgDesc, setNewPkgDesc] = useState<string>('');

  // Mission & Achievement Overrides
  const [overridesDraft, setOverridesDraft] = useState<Record<string, LoyaltyDailyMissionOverride>>(
    () => ({ ...(cfg.missionOverrides || {}) })
  );
  const [achOverridesDraft, setAchOverridesDraft] = useState<Record<string, number>>(() => ({
    ...(cfg.achievementRewardOverrides || {}),
  }));
  const [missionSearch, setMissionSearch] = useState<string>('');
  const [missionCatFilter, setMissionCatFilter] = useState<'all' | LoyaltyDailyMissionCategory>(
    'all'
  );
  const [missionEditorView, setMissionEditorView] = useState<'missions_100' | 'achievements'>(
    'missions_100'
  );

  // Bulk Action Inputs & Safety Confirmation
  const [bulkPointsVal, setBulkPointsVal] = useState<string>('100');
  const [bulkCardsVal, setBulkCardsVal] = useState<string>('1');
  const [pendingBulkConfirm, setPendingBulkConfirm] = useState<BulkActionType | null>(null);

  // Customer Manager Filters & Quick Control State
  const [customerSearch, setCustomerSearch] = useState<string>('');
  const [customerFlameFilter, setCustomerFlameFilter] = useState<CustomerFlameFilter>('all');
  const [onlyAdminTierFilter, setOnlyAdminTierFilter] = useState<boolean>(false);
  const [customerSort, setCustomerSort] = useState<CustomerSortKey>('streak_desc');
  const [targetAccId, setTargetAccId] = useState<string>(accounts[0]?.id || 'acc-admin');
  const [pointsAdjustVal, setPointsAdjustVal] = useState<number>(250);
  const [manualStreakVal, setManualStreakVal] = useState<number>(7);
  const [manualRecoveryCardsVal, setManualRecoveryCardsVal] = useState<number>(3);

  // Live Redemption Log Filters
  const [logSearch, setLogSearch] = useState<string>('');
  const [logTargetFilter, setLogTargetFilter] = useState<'all' | LoyaltyRedeemTarget | 'custom'>(
    'all'
  );

  const [localMsg, setLocalMsg] = useState<string>('');

  useEffect(() => {
    setEnabledDraft(cfg.enabled !== false);
    setStreakEnabledDraft(cfg.streakEnabled !== false);
    setRedeemEnabledDraft(cfg.redeemEnabled !== false);
    setNationalHolidayDraft(Boolean(cfg.nationalHolidayMode));
    setDailyCheckInDraft(String(cfg.dailyCheckInPoints));
    setStreakBonus7Draft(String(cfg.streakBonus7DaysPoints));
    setStreakBonus14Draft(String(cfg.streakBonus14DaysPoints ?? 350));
    setStreakBonus30Draft(String(cfg.streakBonus30DaysPoints ?? 1000));
    setCashPtsDraft(
      String(cfg.cashPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints)
    );
    setCashAmtDraft(
      String(cfg.cashPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount)
    );
    setCashEnabledDraft(cfg.cashRedeemEnabled !== false);
    setCoinPtsDraft(
      String(cfg.coinPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackagePoints)
    );
    setCoinAmtDraft(
      String(cfg.coinPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount)
    );
    setCoinEnabledDraft(cfg.coinRedeemEnabled !== false);
    setVoucherPtsDraft(
      String(cfg.voucherPackagePoints ?? DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints)
    );
    setVoucherAmtDraft(
      String(cfg.voucherPackageAmount ?? DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackageAmount)
    );
    setVoucherEnabledDraft(cfg.voucherRedeemEnabled !== false);
    setDailyLimitEnabledDraft(Boolean(cfg.dailyRedeemLimitEnabled));
    setDailyLimitMaxDraft(String(cfg.dailyRedeemMaxCount || 5));
    setCustomPackagesDraft([...(cfg.customRedeemPackages || [])]);
    setRecoveryPriceDraft(String(cfg.recoveryCardDiamondPrice || 25));
    setFreeze1Draft(String(cfg.freezeStage1Days || 1));
    setFreeze2Draft(String(cfg.freezeStage2Days || 2));
    setFreeze3Draft(String(cfg.freezeRecoveryRequiredDays || 3));
    setExpireAfterDraft(String(cfg.streakExpireAfterDays || 3));
    setActiveMissionCountDraft(String(cfg.activeDailyMissionCount || 100));
    setRewardMultiplierDraft(String(cfg.missionRewardMultiplier || 1));
    setOverridesDraft({ ...(cfg.missionOverrides || {}) });
    setAchOverridesDraft({ ...(cfg.achievementRewardOverrides || {}) });
  }, [cfg]);

  const notify = (text: string) => {
    setLocalMsg(text);
    onFeedback?.(text);
    window.setTimeout(() => setLocalMsg(''), 4500);
  };

  // Enriched Customer Rows & Fleet Telemetry
  const fleetData = useMemo(() => {
    const rows = accounts.map((acc) => {
      const st = loyaltyMap[acc.id];
      const isAdm = isAdminCardAccount(acc);
      const snap = computeStreakVisualSnapshot(st, cfg, todayWib);
      const points = isAdm ? 0 : Math.max(0, Number(st?.points || 0));
      const recoveryCards = isAdm ? 0 : Math.max(0, Number(st?.recoveryCards || 0));
      const todayRedemptions = (st?.redemptionHistory || []).filter((r) => {
        try {
          const wib = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Jakarta',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
          }).format(new Date(r.timestampIso));
          return wib === todayWib;
        } catch {
          return false;
        }
      });

      return {
        acc,
        st,
        isAdm,
        snap,
        points,
        recoveryCards,
        todayRedeemCount: todayRedemptions.length,
        todayRedeemPoints: todayRedemptions.reduce((s, r) => s + (r.pointsSpent || 0), 0),
      };
    });

    const regularRows = rows.filter((r) => !r.isAdm);
    const adminTierCount = rows.filter((r) => r.isAdm).length;
    const totalPointsCirculating = regularRows.reduce((s, r) => s + r.points, 0);
    const totalRecoveryCards = regularRows.reduce((s, r) => s + r.recoveryCards, 0);
    const activeStreaks = regularRows.filter((r) => r.snap.activeStreak > 0 && r.snap.stage === 0);
    const avgActiveStreak =
      activeStreaks.length > 0
        ? (
            activeStreaks.reduce((s, r) => s + r.snap.activeStreak, 0) / activeStreaks.length
          ).toFixed(1)
        : '0.0';

    const stageActiveCount = rows.filter(
      (r) => r.snap.stage === 0 && r.snap.status !== 'expired_reset'
    ).length;
    const freezeStage1Count = rows.filter((r) => r.snap.stage === 1).length;
    const freezeStage2Count = rows.filter((r) => r.snap.stage === 2).length;
    const criticalStage3Count = rows.filter((r) => r.snap.stage === 3).length;
    const expiredResetCount = rows.filter((r) => r.snap.status === 'expired_reset').length;

    const totalTodayRedeemTx = rows.reduce((s, r) => s + r.todayRedeemCount, 0);
    const totalTodayRedeemPoints = rows.reduce((s, r) => s + r.todayRedeemPoints, 0);

    const top5Streak = [...regularRows]
      .sort((a, b) => b.snap.activeStreak - a.snap.activeStreak || b.points - a.points)
      .slice(0, 5);
    const top5Points = [...regularRows]
      .sort((a, b) => b.points - a.points || b.snap.activeStreak - a.snap.activeStreak)
      .slice(0, 5);

    const allRedemptionLogs: Array<{
      record: LoyaltyRedemptionRecord;
      accountId: string;
      accountName: string;
      accountNumber: string;
      isAdm: boolean;
    }> = [];

    for (const r of rows) {
      for (const rec of r.st?.redemptionHistory || []) {
        allRedemptionLogs.push({
          record: rec,
          accountId: r.acc.id,
          accountName: r.acc.fullName,
          accountNumber: r.acc.accountNumber,
          isAdm: r.isAdm,
        });
      }
    }
    allRedemptionLogs.sort(
      (a, b) =>
        new Date(b.record.timestampIso).getTime() - new Date(a.record.timestampIso).getTime()
    );

    return {
      rows,
      regularCount: regularRows.length,
      adminTierCount,
      totalPointsCirculating,
      totalRecoveryCards,
      avgActiveStreak,
      stageActiveCount,
      freezeStage1Count,
      freezeStage2Count,
      criticalStage3Count,
      expiredResetCount,
      totalFrozenAllStages: freezeStage1Count + freezeStage2Count + criticalStage3Count,
      totalTodayRedeemTx,
      totalTodayRedeemPoints,
      top5Streak,
      top5Points,
      allRedemptionLogs,
    };
  }, [accounts, loyaltyMap, cfg, todayWib]);

  // Filtered & Sorted Customers (Sub-Tab 4)
  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    return fleetData.rows
      .filter((r) => {
        if (onlyAdminTierFilter && !r.isAdm) return false;
        if (customerFlameFilter === 'active') {
          if (r.snap.stage !== 0 || r.snap.status === 'expired_reset') return false;
        } else if (customerFlameFilter === 'freeze_1_2') {
          if (r.snap.stage !== 1 && r.snap.stage !== 2) return false;
        } else if (customerFlameFilter === 'critical_3') {
          if (r.snap.stage !== 3) return false;
        } else if (customerFlameFilter === 'reset_0') {
          if (r.snap.status !== 'expired_reset') return false;
        }
        if (q) {
          const hay = `${r.acc.fullName} ${r.acc.accountNumber} ${r.acc.cardTier}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (customerSort === 'points_desc') {
          return (b.isAdm ? 1e15 : b.points) - (a.isAdm ? 1e15 : a.points);
        }
        if (customerSort === 'freeze_desc') {
          return b.snap.stage - a.snap.stage || b.snap.offlineGapDays - a.snap.offlineGapDays;
        }
        if (customerSort === 'name_asc') {
          return a.acc.fullName.localeCompare(b.acc.fullName);
        }
        return b.snap.activeStreak - a.snap.activeStreak || b.points - a.points;
      });
  }, [fleetData.rows, customerSearch, customerFlameFilter, onlyAdminTierFilter, customerSort]);

  // Filtered Redemption Logs (Sub-Tab 5)
  const filteredRedemptionLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return fleetData.allRedemptionLogs.filter((item) => {
      if (logTargetFilter === 'custom') {
        if (!item.record.isCustomPackage) return false;
      } else if (logTargetFilter !== 'all') {
        if (item.record.target !== logTargetFilter) return false;
      }
      if (q) {
        const hay = `${item.accountName} ${item.accountNumber} ${item.record.packageTitle} ${item.record.referenceNo}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [fleetData.allRedemptionLogs, logSearch, logTargetFilter]);

  // Live Draft Preview Packages
  const livePreviewPackages = useMemo(() => {
    return getResolvedLoyaltyRedeemPackages({
      ...cfg,
      cashPackagePoints: Math.max(1, Math.round(Number(cashPtsDraft) || 150)),
      cashPackageAmount: Math.max(1_000, Math.round(Number(cashAmtDraft) || 100_000)),
      cashRedeemEnabled: cashEnabledDraft,
      coinPackagePoints: Math.max(1, Math.round(Number(coinPtsDraft) || 100)),
      coinPackageAmount: Math.max(1, Math.round(Number(coinAmtDraft) || 10)),
      coinRedeemEnabled: coinEnabledDraft,
      voucherPackagePoints: Math.max(1, Math.round(Number(voucherPtsDraft) || 100)),
      voucherPackageAmount: Math.max(1, Math.round(Number(voucherAmtDraft) || 1)),
      voucherRedeemEnabled: voucherEnabledDraft,
      customRedeemPackages: customPackagesDraft,
    });
  }, [
    cfg,
    cashPtsDraft,
    cashAmtDraft,
    cashEnabledDraft,
    coinPtsDraft,
    coinAmtDraft,
    coinEnabledDraft,
    voucherPtsDraft,
    voucherAmtDraft,
    voucherEnabledDraft,
    customPackagesDraft,
  ]);

  const selectedCustomerRow =
    fleetData.rows.find((r) => r.acc.id === targetAccId) || fleetData.rows[0];

  const filteredCatalog = useMemo(() => {
    const q = missionSearch.trim().toLowerCase();
    return LOYALTY_100_DAILY_MISSIONS.filter((m) => {
      if (missionCatFilter !== 'all' && m.category !== missionCatFilter) return false;
      if (q) {
        const hay = `${m.index} ${m.title} ${m.description} ${m.metricKey}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [missionSearch, missionCatFilter]);

  const handleResetDefaultExchangeRates = () => {
    setCashPtsDraft(String(DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackagePoints));
    setCashAmtDraft(String(DEFAULT_LOYALTY_EXCHANGE_RATES.cashPackageAmount));
    setCashEnabledDraft(true);
    setCoinPtsDraft(String(DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackagePoints));
    setCoinAmtDraft(String(DEFAULT_LOYALTY_EXCHANGE_RATES.coinPackageAmount));
    setCoinEnabledDraft(true);
    setVoucherPtsDraft(String(DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackagePoints));
    setVoucherAmtDraft(String(DEFAULT_LOYALTY_EXCHANGE_RATES.voucherPackageAmount));
    setVoucherEnabledDraft(true);
    notify(
      'Kurs bawaan dipulihkan ke draf: 150 Poin = Rp 100.000 · 100 Poin = 10 Coin · 100 Poin = 1 Voucher. Klik Simpan untuk menerbitkan.'
    );
  };

  const handleAddCustomPackage = () => {
    const title = newPkgTitle.trim();
    const pts = Math.max(1, Math.round(Number(newPkgPoints) || 0));
    const reward = Math.max(1, Math.round(Number(newPkgReward) || 0));
    if (!title) {
      notify('Isi nama paket kustom terlebih dahulu.');
      return;
    }
    const nextItem: LoyaltyCustomRedeemPackage = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      title,
      description: newPkgDesc.trim(),
      target: newPkgTarget,
      pointsCost: pts,
      rewardAmount: reward,
      enabled: true,
    };
    setCustomPackagesDraft((prev) => [...prev, nextItem]);
    setNewPkgTitle('');
    setNewPkgDesc('');
    notify(`Paket kustom "${title}" ditambahkan ke draf. Klik Simpan untuk mengaktifkan bagi nasabah.`);
  };

  const handleUpdateCustomPackage = (
    pkgId: string,
    patch: Partial<LoyaltyCustomRedeemPackage>
  ) => {
    setCustomPackagesDraft((prev) =>
      prev.map((item) => (item.id === pkgId ? { ...item, ...patch } : item))
    );
  };

  const handleRemoveCustomPackage = (pkgId: string) => {
    setCustomPackagesDraft((prev) => prev.filter((item) => item.id !== pkgId));
  };

  const handleSaveGlobalConfig = () => {
    const res = adminUpdateLoyaltyConfig({
      enabled: enabledDraft,
      streakEnabled: streakEnabledDraft,
      redeemEnabled: redeemEnabledDraft,
      nationalHolidayMode: nationalHolidayDraft,
      dailyCheckInPoints: Math.max(1, Number(dailyCheckInDraft) || 25),
      streakBonus7DaysPoints: Math.max(0, Number(streakBonus7Draft) || 0),
      streakBonus14DaysPoints: Math.max(0, Number(streakBonus14Draft) || 0),
      streakBonus30DaysPoints: Math.max(0, Number(streakBonus30Draft) || 0),
      cashPackagePoints: Math.max(1, Math.round(Number(cashPtsDraft) || 150)),
      cashPackageAmount: Math.max(1_000, Math.round(Number(cashAmtDraft) || 100_000)),
      cashRedeemEnabled: cashEnabledDraft,
      coinPackagePoints: Math.max(1, Math.round(Number(coinPtsDraft) || 100)),
      coinPackageAmount: Math.max(1, Math.round(Number(coinAmtDraft) || 10)),
      coinRedeemEnabled: coinEnabledDraft,
      voucherPackagePoints: Math.max(1, Math.round(Number(voucherPtsDraft) || 100)),
      voucherPackageAmount: Math.max(1, Math.round(Number(voucherAmtDraft) || 1)),
      voucherRedeemEnabled: voucherEnabledDraft,
      customRedeemPackages: customPackagesDraft,
      dailyRedeemLimitEnabled: dailyLimitEnabledDraft,
      dailyRedeemMaxCount: Math.max(1, Math.min(500, Math.round(Number(dailyLimitMaxDraft) || 5))),
      recoveryCardDiamondPrice: Math.max(1, Number(recoveryPriceDraft) || 25),
      freezeStage1Days: Math.max(1, Number(freeze1Draft) || 1),
      freezeStage2Days: Math.max(2, Number(freeze2Draft) || 2),
      freezeRecoveryRequiredDays: Math.max(3, Number(freeze3Draft) || 3),
      streakExpireAfterDays: Math.max(3, Number(expireAfterDraft) || 3),
      activeDailyMissionCount: Math.max(1, Math.min(100, Number(activeMissionCountDraft) || 100)),
      missionRewardMultiplier: Math.max(0.25, Math.min(10, Number(rewardMultiplierDraft) || 1)),
      missionOverrides: overridesDraft,
      achievementRewardOverrides: achOverridesDraft,
    });
    notify(res.message);
  };

  const executeConfirmedBulkAction = () => {
    if (!pendingBulkConfirm) return;
    if (pendingBulkConfirm === 'thaw_all') {
      notify(adminBulkThawAllFrozenStreaks().message);
    } else if (pendingBulkConfirm === 'grant_points') {
      const pts = Math.max(1, Math.round(Number(bulkPointsVal) || 100));
      notify(adminBulkGrantLoyaltyPoints(pts).message);
    } else if (pendingBulkConfirm === 'grant_cards') {
      const cards = Math.max(1, Math.round(Number(bulkCardsVal) || 1));
      notify(adminBulkGrantRecoveryCards(cards).message);
    } else if (pendingBulkConfirm === 'reset_missions') {
      notify(adminBulkResetDailyLoyaltyMissions().message);
    }
    setPendingBulkConfirm(null);
  };

  const updateMissionOverride = (
    missionId: string,
    patch: Partial<LoyaltyDailyMissionOverride>
  ) => {
    setOverridesDraft((prev) => ({
      ...prev,
      [missionId]: {
        ...(prev[missionId] || {}),
        ...patch,
      },
    }));
  };

  const renderTargetIcon = (target: LoyaltyRedeemTarget, sizeClass = 'w-4 h-4') => {
    if (target === 'cash') return <Banknote className={sizeClass} />;
    if (target === 'coin') return <Coins className={sizeClass} />;
    return <Ticket className={sizeClass} />;
  };

  const formatWibShort = (iso: string) => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-5 text-xs">
      {/* Header Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-400">
                <span>Pusat Kendali Streak &amp; Loyalty</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums text-amber-300">
                  {fleetData.rows.length} Akun Terpantau
                </span>
                <span aria-hidden="true">·</span>
                <span className={cfg.nationalHolidayMode ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  {cfg.nationalHolidayMode ? 'Mode Libur Nasional Aktif' : 'Jadwal Normal WIB'}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">
                Setting Streak, Kartu Pemulihan, Kurs Tukar &amp; 100 Misi Loyalty
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {fleetData.criticalStage3Count > 0 && (
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => {
                  setActiveSubTab('customers_manager');
                  setCustomerFlameFilter('critical_3');
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-rose-500/50 bg-rose-950/60 hover:bg-rose-900/60 px-3.5 py-2 text-xs font-bold text-rose-200 whitespace-nowrap cursor-pointer"
              >
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                <span className="font-mono tabular-nums">
                  {fleetData.criticalStage3Count} Nasabah Beku Kritis Tahap 3
                </span>
              </button>
            )}
            {isReadOnly && (
              <span className="rounded-xl border border-amber-500/40 bg-amber-950/40 px-3 py-2 text-[11px] font-bold text-amber-300">
                Mode Hanya Lihat
              </span>
            )}
          </div>
        </div>

        {localMsg && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/50 px-3.5 py-2.5 text-xs font-semibold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{localMsg}</span>
          </div>
        )}

        {/* Top 4 Live Summary KPI Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          {/* Card 1: Total Poin & Avg Streak */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Poin Beredar &amp; Rata-Rata Streak</span>
              <Star className="h-4 w-4 text-amber-400 shrink-0" />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold font-mono tabular-nums text-amber-300">
                {fleetData.totalPointsCirculating.toLocaleString('id-ID')}
              </p>
              <span className="text-xs font-mono tabular-nums text-orange-300 font-semibold">
                Avg {fleetData.avgActiveStreak} Hr
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
              {fleetData.regularCount} Nasabah Reguler · {fleetData.adminTierCount} Tier Admin (∞)
            </p>
          </div>

          {/* Card 2: Freeze Breakdown Stage 1, 2, Critical 3 */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Kesehatan Api Nasabah</span>
              <Snowflake className="h-4 w-4 text-cyan-400 shrink-0" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono tabular-nums">
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => {
                  setActiveSubTab('customers_manager');
                  setCustomerFlameFilter('active');
                }}
                className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 py-1.5 hover:border-emerald-400 cursor-pointer"
              >
                <span className="block text-sm font-bold text-emerald-300">
                  {fleetData.stageActiveCount}
                </span>
                <span className="text-[10px] text-slate-400">Aktif</span>
              </button>
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => {
                  setActiveSubTab('customers_manager');
                  setCustomerFlameFilter('freeze_1_2');
                }}
                className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 py-1.5 hover:border-cyan-400 cursor-pointer"
              >
                <span className="block text-sm font-bold text-cyan-300">
                  {fleetData.freezeStage1Count}
                </span>
                <span className="text-[10px] text-slate-400">Beku 1</span>
              </button>
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => {
                  setActiveSubTab('customers_manager');
                  setCustomerFlameFilter('freeze_1_2');
                }}
                className="rounded-lg border border-sky-500/30 bg-sky-950/30 py-1.5 hover:border-sky-400 cursor-pointer"
              >
                <span className="block text-sm font-bold text-sky-300">
                  {fleetData.freezeStage2Count}
                </span>
                <span className="text-[10px] text-slate-400">Beku 2</span>
              </button>
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => {
                  setActiveSubTab('customers_manager');
                  setCustomerFlameFilter('critical_3');
                }}
                className="rounded-lg border border-rose-500/40 bg-rose-950/40 py-1.5 hover:border-rose-400 cursor-pointer"
              >
                <span className="block text-sm font-bold text-rose-300">
                  {fleetData.criticalStage3Count}
                </span>
                <span className="text-[10px] text-rose-200">Kritis 3</span>
              </button>
            </div>
          </div>

          {/* Card 3: Penukaran Hari Ini & Stok Kartu Pemulihan */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Tukar Poin Hari Ini &amp; Kartu Pulih</span>
              <Ticket className="h-4 w-4 text-emerald-400 shrink-0" />
            </div>
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xl font-bold font-mono tabular-nums text-emerald-300">
                {fleetData.totalTodayRedeemTx}x
              </p>
              <span className="text-xs font-mono tabular-nums text-cyan-300 font-semibold">
                {fleetData.totalRecoveryCards.toLocaleString('id-ID')} Kartu
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono tabular-nums">
              {fleetData.totalTodayRedeemPoints.toLocaleString('id-ID')} Poin ditukar hari ini ·{' '}
              {fleetData.allRedemptionLogs.length} total log
            </p>
          </div>

          {/* Card 4: Top Streak & Poin Leader Preview */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Pimpinan Streak &amp; Poin</span>
              <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
            </div>
            <div className="text-[11px] space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-300 truncate">
                  Top Streak: <strong>{fleetData.top5Streak[0]?.acc.fullName || '-'}</strong>
                </span>
                <span className="font-mono tabular-nums font-bold text-orange-300 shrink-0">
                  {fleetData.top5Streak[0]?.snap.activeStreak || 0} Hr
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-300 truncate">
                  Top Poin: <strong>{fleetData.top5Points[0]?.acc.fullName || '-'}</strong>
                </span>
                <span className="font-mono tabular-nums font-bold text-amber-300 shrink-0">
                  {(fleetData.top5Points[0]?.points || 0).toLocaleString('id-ID')} P
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Top 5 Dual Leaderboard Strip */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-orange-300">
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5" /> Top 5 Nasabah Streak Tertinggi
              </span>
              <span className="text-slate-400 font-normal">Non-Admin</span>
            </div>
            <div className="divide-y divide-slate-800/80">
              {fleetData.top5Streak.map((item, idx) => (
                <div
                  key={item.acc.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono tabular-nums text-slate-400 w-4">#{idx + 1}</span>
                    <span className="font-semibold text-white truncate">{item.acc.fullName}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {item.acc.accountNumber}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-orange-300 shrink-0">
                    {item.snap.activeStreak} Hari
                  </span>
                </div>
              ))}
              {fleetData.top5Streak.length === 0 && (
                <p className="text-[11px] text-slate-500 py-2">Belum ada nasabah reguler.</p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5" /> Top 5 Nasabah Poin Terbanyak
              </span>
              <span className="text-slate-400 font-normal">Non-Admin</span>
            </div>
            <div className="divide-y divide-slate-800/80">
              {fleetData.top5Points.map((item, idx) => (
                <div
                  key={item.acc.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-[11px]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono tabular-nums text-slate-400 w-4">#{idx + 1}</span>
                    <span className="font-semibold text-white truncate">{item.acc.fullName}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">
                      {item.acc.accountNumber}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-amber-300 shrink-0">
                    {item.points.toLocaleString('id-ID')} Poin
                  </span>
                </div>
              ))}
              {fleetData.top5Points.length === 0 && (
                <p className="text-[11px] text-slate-500 py-2">Belum ada nasabah reguler.</p>
              )}
            </div>
          </div>
        </div>

        {/* 5 Clean Sub-Tab Navigation */}
        <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-800 bg-slate-900 p-1.5">
          {(
            [
              { key: 'global_bulk', label: '1. Global, Libur & Massal', icon: Power },
              { key: 'exchange_rates', label: '2. Kurs & Paket Tukar', icon: Gift },
              { key: 'missions_achievements', label: '3. 100 Misi & Pencapaian', icon: Sliders },
              {
                key: 'customers_manager',
                label: `4. Kelola Nasabah (${fleetData.rows.length})`,
                icon: Users,
              },
              {
                key: 'redemption_logs',
                label: `5. Log Penukaran (${fleetData.allRedemptionLogs.length})`,
                icon: History,
              },
            ] as Array<{ key: LoyaltyAdminSubTab; label: string; icon: React.ComponentType<{ className?: string }> }>
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                data-allow-readonly="true"
                onClick={() => setActiveSubTab(tab.key)}
                className={`min-h-[40px] flex-1 min-w-[165px] inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  active
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================= SUB-TAB 1: GLOBAL SWITCHES, LIBUR NASIONAL, BONUS 7/14/30 & AKSI MASSAL ================= */}
      {activeSubTab === 'global_bulk' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Saklar Sistem Global, Mode Libur Nasional &amp; Aturan Streak
                </h3>
                <p className="text-[11px] text-slate-400">
                  Kontrol aktif/nonaktif sistem secara terpisah, aktifkan Mode Libur Nasional anti-beku, serta atur hadiah bonus Hari ke-7, 14, dan 30.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSaveGlobalConfig}
                className="min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
              >
                Simpan Pengaturan Global &amp; Streak
              </button>
            </div>

            {/* 4 Global Feature Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label
                className={`rounded-xl border p-3.5 flex items-start gap-2.5 cursor-pointer ${
                  enabledDraft
                    ? 'border-emerald-500/40 bg-emerald-950/20'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={enabledDraft}
                  onChange={(e) => setEnabledDraft(e.target.checked)}
                  className="mt-0.5 accent-emerald-400"
                />
                <div>
                  <span className="font-bold text-white block">Sistem Loyalty Induk</span>
                  <span className="text-[11px] text-slate-400">
                    {enabledDraft ? 'Aktif untuk seluruh nasabah' : 'Seluruh program Loyalty dijeda'}
                  </span>
                </div>
              </label>

              <label
                className={`rounded-xl border p-3.5 flex items-start gap-2.5 cursor-pointer ${
                  streakEnabledDraft
                    ? 'border-orange-500/40 bg-orange-950/20'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={streakEnabledDraft}
                  onChange={(e) => setStreakEnabledDraft(e.target.checked)}
                  className="mt-0.5 accent-orange-400"
                />
                <div>
                  <span className="font-bold text-white block">Sistem Auto-Streak</span>
                  <span className="text-[11px] text-slate-400">
                    {streakEnabledDraft
                      ? 'Pengisian & cek beku harian berjalan'
                      : 'Auto-streak & pembekuan dijeda'}
                  </span>
                </div>
              </label>

              <label
                className={`rounded-xl border p-3.5 flex items-start gap-2.5 cursor-pointer ${
                  redeemEnabledDraft
                    ? 'border-cyan-500/40 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={redeemEnabledDraft}
                  onChange={(e) => setRedeemEnabledDraft(e.target.checked)}
                  className="mt-0.5 accent-cyan-400"
                />
                <div>
                  <span className="font-bold text-white block">Penukaran Poin Loyalty</span>
                  <span className="text-[11px] text-slate-400">
                    {redeemEnabledDraft
                      ? 'Nasabah bebas menukar Saldo/Coin/Voucher'
                      : 'Penukaran poin ditutup sementara'}
                  </span>
                </div>
              </label>

              <label
                className={`rounded-xl border p-3.5 flex items-start gap-2.5 cursor-pointer ${
                  nationalHolidayDraft
                    ? 'border-emerald-400/60 bg-emerald-950/35'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={nationalHolidayDraft}
                  onChange={(e) => setNationalHolidayDraft(e.target.checked)}
                  className="mt-0.5 accent-emerald-400"
                />
                <div>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <CalendarHeart className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Mode Libur Nasional</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {nationalHolidayDraft
                      ? 'AKTIF: Streak tidak beku/hangus meski offline!'
                      : 'Nonaktif: aturan offline 1/2/3 hari normal'}
                  </span>
                </div>
              </label>
            </div>

            {/* Streak Rewards (Harian, 7, 14, 30 Hari) & Freeze Days */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Poin Auto-Streak / Hari</label>
                <input
                  type="number"
                  min={1}
                  value={dailyCheckInDraft}
                  onChange={(e) => setDailyCheckInDraft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-amber-300 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bonus Streak 7 Hari</label>
                <input
                  type="number"
                  min={0}
                  value={streakBonus7Draft}
                  onChange={(e) => setStreakBonus7Draft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-amber-300 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bonus Streak 14 Hari</label>
                <input
                  type="number"
                  min={0}
                  value={streakBonus14Draft}
                  onChange={(e) => setStreakBonus14Draft(e.target.value)}
                  className="w-full rounded-xl border border-orange-500/40 bg-slate-900 px-3 py-2 font-mono font-bold text-orange-300 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Bonus Streak 30 Hari</label>
                <input
                  type="number"
                  min={0}
                  value={streakBonus30Draft}
                  onChange={(e) => setStreakBonus30Draft(e.target.value)}
                  className="w-full rounded-xl border border-emerald-500/40 bg-slate-900 px-3 py-2 font-mono font-bold text-emerald-300 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Harga Kartu Pulih (💎)</label>
                <input
                  type="number"
                  min={1}
                  value={recoveryPriceDraft}
                  onChange={(e) => setRecoveryPriceDraft(e.target.value)}
                  className="w-full rounded-xl border border-cyan-500/40 bg-slate-900 px-3 py-2 font-mono font-bold text-cyan-300 tabular-nums"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Beku Lv.1 (Hari Offline)</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={freeze1Draft}
                  onChange={(e) => setFreeze1Draft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Beku Lv.2 (Hari Offline)</label>
                <input
                  type="number"
                  min={2}
                  max={15}
                  value={freeze2Draft}
                  onChange={(e) => setFreeze2Draft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Wajib Pulih Lv.3 (Hari)</label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={freeze3Draft}
                  onChange={(e) => setFreeze3Draft(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-cyan-300 tabular-nums"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Hangus Reset 0 (Lewat Hari)</label>
                <input
                  type="number"
                  min={3}
                  max={60}
                  value={expireAfterDraft}
                  onChange={(e) => setExpireAfterDraft(e.target.value)}
                  className="w-full rounded-xl border border-rose-500/40 bg-slate-900 px-3 py-2 font-mono font-bold text-rose-300 tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* 4 Bulk Operational Actions */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">
                4 Aksi Massal Operasional Admin
              </h3>
              <p className="text-[11px] text-slate-400">
                Eksekusi aksi ke seluruh akun sekaligus. Setiap aksi meminta konfirmasi aman di halaman sebelum berjalan.
              </p>
            </div>

            {pendingBulkConfirm && (
              <div className="rounded-xl border border-amber-400/50 bg-amber-950/40 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-amber-100">
                  {pendingBulkConfirm === 'thaw_all' && (
                    <span>
                      Konfirmasi: Cairkan &amp; pulihkan seluruh{' '}
                      <strong className="font-mono tabular-nums">
                        {fleetData.totalFrozenAllStages} nasabah
                      </strong>{' '}
                      yang sedang membeku (Tahap 1–3)?
                    </span>
                  )}
                  {pendingBulkConfirm === 'grant_points' && (
                    <span>
                      Konfirmasi: Kirim bonus{' '}
                      <strong className="font-mono tabular-nums">
                        +{(Math.max(1, Number(bulkPointsVal) || 100)).toLocaleString('id-ID')} Poin
                      </strong>{' '}
                      ke seluruh{' '}
                      <strong className="font-mono tabular-nums">
                        {fleetData.regularCount} nasabah reguler
                      </strong>
                      ?
                    </span>
                  )}
                  {pendingBulkConfirm === 'grant_cards' && (
                    <span>
                      Konfirmasi: Bagikan{' '}
                      <strong className="font-mono tabular-nums">
                        +{(Math.max(1, Number(bulkCardsVal) || 1)).toLocaleString('id-ID')} Kartu
                        Pemulihan Streak
                      </strong>{' '}
                      ke seluruh{' '}
                      <strong className="font-mono tabular-nums">
                        {fleetData.regularCount} nasabah reguler
                      </strong>
                      ?
                    </span>
                  )}
                  {pendingBulkConfirm === 'reset_missions' && (
                    <span>
                      Konfirmasi: Reset paksa progres &amp; klaim 100 misi harian hari ini ({todayWib}) untuk seluruh{' '}
                      <strong className="font-mono tabular-nums">{fleetData.rows.length} akun</strong>?
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    data-allow-readonly="true"
                    onClick={() => setPendingBulkConfirm(null)}
                    className="min-h-[40px] rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={executeConfirmedBulkAction}
                    className="min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                  >
                    Ya, Jalankan Sekarang
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bulk 1: Thaw All Frozen */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Flame className="h-4 w-4" /> Cairkan Semua Streak Beku
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Menyelamatkan &amp; mencairkan serentak semua nasabah Beku Tahap 1, 2, maupun Kritis Tahap 3 tanpa memotong kartu mereka.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingBulkConfirm('thaw_all')}
                  className="min-h-[40px] w-full rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-black text-white whitespace-nowrap cursor-pointer"
                >
                  Cairkan Semua ({fleetData.totalFrozenAllStages} Nasabah Beku)
                </button>
              </div>

              {/* Bulk 2: Grant Points */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Send className="h-4 w-4" /> Kirim Bonus Poin Loyalty Massal
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tambahkan bonus poin serentak ke seluruh nasabah reguler (Kartu Tier Admin otomatis tetap ∞).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={bulkPointsVal}
                    onChange={(e) => setBulkPointsVal(e.target.value)}
                    className="w-28 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono font-bold text-amber-300 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingBulkConfirm('grant_points')}
                    className="flex-1 min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                  >
                    Bagikan Poin Massal
                  </button>
                </div>
              </div>

              {/* Bulk 3: Grant Recovery Cards */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Bagikan Kartu Pemulihan Massal
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kirim stok Kartu Pemulihan Streak gratis ke seluruh nasabah reguler sebagai kompensasi atau event spesial.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={bulkCardsVal}
                    onChange={(e) => setBulkCardsVal(e.target.value)}
                    className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 font-mono font-bold text-cyan-300 tabular-nums"
                  />
                  <button
                    type="button"
                    onClick={() => setPendingBulkConfirm('grant_cards')}
                    className="flex-1 min-h-[40px] rounded-xl bg-cyan-500 hover:bg-cyan-400 px-4 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                  >
                    Bagikan Kartu Massal
                  </button>
                </div>
              </div>

              {/* Bulk 4: Reset Daily Missions */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between gap-3">
                <div>
                  <h4 className="font-bold text-rose-300 flex items-center gap-1.5">
                    <RefreshCw className="h-4 w-4" /> Reset Paksa Progres Misi Harian
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Mengosongkan penghitung &amp; klaim 100 misi harian hari ini ({todayWib}) agar seluruh nasabah dapat mengulang misi dari nol.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingBulkConfirm('reset_missions')}
                  className="min-h-[40px] w-full rounded-xl border border-rose-500/50 bg-rose-950/60 hover:bg-rose-900/60 px-4 py-2 text-xs font-black text-rose-200 whitespace-nowrap cursor-pointer"
                >
                  Reset Progres Misi Semua Nasabah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: KURS TUKAR, PAKET KUSTOM & PRATINJAU ================= */}
      {activeSubTab === 'exchange_rates' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Kurs Tukar Poin Loyalty &amp; Paket Kustom (Tanpa Diamond)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur biaya poin, nominal hadiah, saklar aktif/nonaktif untuk 3 paket utama (Saldo Tunai, Coin, Voucher Naik Level), batas harian, dan paket kustom.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultExchangeRates}
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 text-xs font-bold text-amber-300 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Kurs Bawaan</span>
              </button>
              <button
                type="button"
                onClick={handleSaveGlobalConfig}
                className="min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
              >
                Simpan Kurs &amp; Paket
              </button>
            </div>
          </div>

          {/* 3 Standard Packages Editor Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className={`rounded-xl border p-4 space-y-3 ${
                cashEnabledDraft
                  ? 'border-emerald-500/40 bg-slate-900/70'
                  : 'border-slate-800 bg-slate-900/30 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4" /> Saldo Tunai
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cashEnabledDraft}
                    onChange={(e) => setCashEnabledDraft(e.target.checked)}
                    className="accent-emerald-400"
                  />
                  <span>{cashEnabledDraft ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Biaya Poin / Paket</label>
                  <input
                    type="number"
                    min={1}
                    value={cashPtsDraft}
                    onChange={(e) => setCashPtsDraft(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hadiah Tunai (Rp)</label>
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={cashAmtDraft}
                    onChange={(e) => setCashAmtDraft(e.target.value)}
                    className="w-full rounded-xl border border-emerald-500/40 bg-slate-950 px-2.5 py-2 font-mono font-bold text-emerald-300 tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 space-y-3 ${
                coinEnabledDraft
                  ? 'border-amber-500/40 bg-slate-900/70'
                  : 'border-slate-800 bg-slate-900/30 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4" /> Coin
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={coinEnabledDraft}
                    onChange={(e) => setCoinEnabledDraft(e.target.checked)}
                    className="accent-amber-400"
                  />
                  <span>{coinEnabledDraft ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Biaya Poin / Paket</label>
                  <input
                    type="number"
                    min={1}
                    value={coinPtsDraft}
                    onChange={(e) => setCoinPtsDraft(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hadiah Coin</label>
                  <input
                    type="number"
                    min={1}
                    value={coinAmtDraft}
                    onChange={(e) => setCoinAmtDraft(e.target.value)}
                    className="w-full rounded-xl border border-amber-500/40 bg-slate-950 px-2.5 py-2 font-mono font-bold text-amber-300 tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div
              className={`rounded-xl border p-4 space-y-3 ${
                voucherEnabledDraft
                  ? 'border-violet-500/40 bg-slate-900/70'
                  : 'border-slate-800 bg-slate-900/30 opacity-65'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-xs text-violet-300 flex items-center gap-1.5">
                  <Ticket className="w-4 h-4" /> Voucher Naik Level
                </span>
                <label className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={voucherEnabledDraft}
                    onChange={(e) => setVoucherEnabledDraft(e.target.checked)}
                    className="accent-violet-400"
                  />
                  <span>{voucherEnabledDraft ? 'Aktif' : 'Nonaktif'}</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Biaya Poin / Paket</label>
                  <input
                    type="number"
                    min={1}
                    value={voucherPtsDraft}
                    onChange={(e) => setVoucherPtsDraft(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hadiah Voucher</label>
                  <input
                    type="number"
                    min={1}
                    value={voucherAmtDraft}
                    onChange={(e) => setVoucherAmtDraft(e.target.value)}
                    className="w-full rounded-xl border border-violet-500/40 bg-slate-950 px-2.5 py-2 font-mono font-bold text-violet-300 tabular-nums"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Daily Limit Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={dailyLimitEnabledDraft}
                onChange={(e) => setDailyLimitEnabledDraft(e.target.checked)}
                className="accent-cyan-400"
              />
              <span>Aktifkan Batas Maksimal Penukaran Poin per Hari (Reset 00:00 WIB)</span>
            </label>
            {dailyLimitEnabledDraft ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400">Maksimal / Hari:</span>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={dailyLimitMaxDraft}
                  onChange={(e) => setDailyLimitMaxDraft(e.target.value)}
                  className="w-20 rounded-lg border border-cyan-500/40 bg-slate-950 px-2.5 py-1.5 font-mono font-bold text-cyan-300 tabular-nums"
                />
                <span className="text-[11px] text-slate-400">transaksi</span>
              </div>
            ) : (
              <span className="text-[11px] font-bold text-emerald-300">
                Mode Bebas Tanpa Batas Harian
              </span>
            )}
          </div>

          {/* Custom Packages CRUD */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Paket Penukaran Kustom Tambahan ({customPackagesDraft.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">
                Hanya Saldo Tunai, Coin, atau Voucher (tanpa Diamond)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newPkgTitle}
                onChange={(e) => setNewPkgTitle(e.target.value)}
                placeholder="Nama Paket (mis. Paket Hemat 500 Poin)"
                className="sm:col-span-4 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <select
                value={newPkgTarget}
                onChange={(e) => setNewPkgTarget(e.target.value as LoyaltyRedeemTarget)}
                className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-bold text-white"
              >
                <option value="cash">Saldo Tunai</option>
                <option value="coin">Coin</option>
                <option value="voucher">Voucher Level</option>
              </select>
              <input
                type="number"
                min={1}
                value={newPkgPoints}
                onChange={(e) => setNewPkgPoints(e.target.value)}
                placeholder="Biaya Poin"
                className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white tabular-nums"
              />
              <input
                type="number"
                min={1}
                value={newPkgReward}
                onChange={(e) => setNewPkgReward(e.target.value)}
                placeholder="Jumlah Hadiah"
                className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono text-xs text-emerald-300 tabular-nums"
              />
              <button
                type="button"
                onClick={handleAddCustomPackage}
                className="sm:col-span-2 min-h-[40px] inline-flex items-center justify-center gap-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {customPackagesDraft.length > 0 && (
              <div className="space-y-2">
                {customPackagesDraft.map((cp) => (
                  <div
                    key={cp.id}
                    className={`grid grid-cols-12 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${
                      cp.enabled
                        ? 'border-slate-700 bg-slate-950'
                        : 'border-rose-500/30 bg-rose-950/15 opacity-70'
                    }`}
                  >
                    <label className="col-span-4 flex items-center gap-2 cursor-pointer min-w-0">
                      <input
                        type="checkbox"
                        checked={cp.enabled}
                        onChange={(e) =>
                          handleUpdateCustomPackage(cp.id, { enabled: e.target.checked })
                        }
                        className="accent-cyan-400 shrink-0"
                      />
                      <span className="text-slate-300 shrink-0">
                        {renderTargetIcon(cp.target, 'w-3.5 h-3.5')}
                      </span>
                      <span className="font-bold text-white truncate">{cp.title}</span>
                    </label>
                    <div className="col-span-3 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Poin:</span>
                      <input
                        type="number"
                        min={1}
                        value={cp.pointsCost}
                        onChange={(e) =>
                          handleUpdateCustomPackage(cp.id, {
                            pointsCost: Math.max(1, Math.round(Number(e.target.value) || 1)),
                          })
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white tabular-nums"
                      />
                    </div>
                    <div className="col-span-4 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400">Hadiah:</span>
                      <input
                        type="number"
                        min={1}
                        value={cp.rewardAmount}
                        onChange={(e) =>
                          handleUpdateCustomPackage(cp.id, {
                            rewardAmount: Math.max(1, Math.round(Number(e.target.value) || 1)),
                          })
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-emerald-300 tabular-nums"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomPackage(cp.id)}
                        aria-label={`Hapus paket ${cp.title}`}
                        className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Customer Preview Box */}
          <div className="rounded-xl border border-slate-700 bg-slate-900/75 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span>Pratinjau Langsung Kartu Tukar Nasabah (Sebelum Disimpan)</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                {dailyLimitEnabledDraft
                  ? `Batas Harian: Maks ${Math.max(1, Number(dailyLimitMaxDraft) || 5)}x / hari`
                  : 'Tanpa Batas Harian · Kelipatan 1x, 2x, 5x, Maksimal & Poin Bebas'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {livePreviewPackages.map((p) => {
                const accentClass =
                  p.target === 'cash'
                    ? 'border-emerald-500/40 text-emerald-300'
                    : p.target === 'coin'
                    ? 'border-amber-500/40 text-amber-300'
                    : 'border-violet-500/40 text-violet-300';
                return (
                  <div
                    key={p.id}
                    className={`rounded-xl border p-3 space-y-2 ${
                      p.enabled
                        ? `${accentClass} bg-slate-950`
                        : 'border-slate-800 bg-slate-950/40 opacity-55'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-white flex items-center gap-1.5 truncate">
                        {renderTargetIcon(p.target, 'w-4 h-4 shrink-0')}
                        <span className="truncate">{p.title}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          p.enabled ? 'text-emerald-300' : 'text-rose-400'
                        }`}
                      >
                        {p.enabled ? (p.isCustom ? 'KUSTOM' : 'AKTIF') : 'NONAKTIF'}
                      </span>
                    </div>
                    <p className="text-xs font-bold font-mono tabular-nums">
                      {p.pointsCost.toLocaleString('id-ID')} Poin ={' '}
                      {formatLoyaltyRewardLabel(p.target, p.rewardAmount)}
                    </p>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-bold text-slate-400">
                      <span className="rounded-md bg-slate-900 border border-slate-800 py-1">1x</span>
                      <span className="rounded-md bg-slate-900 border border-slate-800 py-1">2x</span>
                      <span className="rounded-md bg-slate-900 border border-slate-800 py-1">5x</span>
                      <span className="rounded-md bg-slate-900 border border-slate-800 py-1">Maks</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: 100 MISI HARIAN & PENCAPAIAN ================= */}
      {activeSubTab === 'missions_achievements' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sliders className="h-4 w-4 text-amber-400" />
                <span>Pengaturan 100 Misi Aktif Harian &amp; Pencapaian Utama</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Kendalikan jumlah misi aktif per hari (1–100), pengali hadiah global, target tiap misi, dan hadiah poin pencapaian.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveGlobalConfig}
              className="min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
            >
              Simpan 100 Misi &amp; Pencapaian
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Jumlah Misi Aktif Harian (1–100)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={activeMissionCountDraft}
                onChange={(e) => setActiveMissionCountDraft(e.target.value)}
                className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-3 py-2 font-mono font-bold text-amber-300 tabular-nums"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">
                Pengali Hadiah Poin Misi (x)
              </label>
              <input
                type="number"
                min={0.25}
                max={10}
                step={0.25}
                value={rewardMultiplierDraft}
                onChange={(e) => setRewardMultiplierDraft(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white tabular-nums"
              />
            </div>
            <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1">
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => setMissionEditorView('missions_100')}
                className={`flex-1 min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                  missionEditorView === 'missions_100'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Editor 100 Misi
              </button>
              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => setMissionEditorView('achievements')}
                className={`flex-1 min-h-[36px] rounded-lg px-3 py-1.5 text-xs font-bold whitespace-nowrap cursor-pointer ${
                  missionEditorView === 'achievements'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Pencapaian Utama
              </button>
            </div>
          </div>

          {missionEditorView === 'missions_100' ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={missionSearch}
                    onChange={(e) => setMissionSearch(e.target.value)}
                    placeholder="Cari nomor atau judul dari 100 misi..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white"
                  />
                </div>
                <select
                  value={missionCatFilter}
                  onChange={(e) =>
                    setMissionCatFilter(e.target.value as 'all' | LoyaltyDailyMissionCategory)
                  }
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white font-bold"
                >
                  <option value="all">Semua Kategori (100)</option>
                  {(
                    Object.keys(LOYALTY_MISSION_CATEGORY_META) as LoyaltyDailyMissionCategory[]
                  ).map((cat) => (
                    <option key={cat} value={cat}>
                      {LOYALTY_MISSION_CATEGORY_META[cat].label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
                {filteredCatalog.map((m) => {
                  const ov = overridesDraft[m.id] || {};
                  const isEnabled = ov.enabled ?? true;
                  return (
                    <div
                      key={m.id}
                      className={`grid grid-cols-12 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${
                        isEnabled
                          ? 'border-slate-800 bg-slate-900/70'
                          : 'border-rose-500/30 bg-rose-950/15 opacity-65'
                      }`}
                    >
                      <label className="col-span-6 flex items-center gap-2 cursor-pointer min-w-0">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={(e) =>
                            updateMissionOverride(m.id, { enabled: e.target.checked })
                          }
                          className="accent-amber-400 shrink-0"
                        />
                        <span className="font-mono text-slate-400 shrink-0">#{m.index}</span>
                        <span className="font-semibold text-white truncate">{m.title}</span>
                      </label>
                      <div className="col-span-3 flex items-center gap-1">
                        <span className="text-[10px] text-slate-400">Target:</span>
                        <input
                          type="number"
                          min={1}
                          value={ov.target ?? m.target}
                          onChange={(e) =>
                            updateMissionOverride(m.id, {
                              target: Math.max(1, Number(e.target.value) || m.target),
                            })
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-white tabular-nums"
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-1">
                        <span className="text-[10px] text-amber-300">Poin:</span>
                        <input
                          type="number"
                          min={1}
                          value={ov.rewardPoints ?? m.rewardPoints}
                          onChange={(e) =>
                            updateMissionOverride(m.id, {
                              rewardPoints: Math.max(1, Number(e.target.value) || m.rewardPoints),
                            })
                          }
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-amber-300 tabular-nums"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold text-emerald-300">
                  Editor Hadiah Poin Pencapaian Utama ({DAILY_ACHIEVEMENT_CATALOG.length} Pencapaian)
                </p>
                <button
                  type="button"
                  onClick={() => setAchOverridesDraft({})}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {DAILY_ACHIEVEMENT_CATALOG.map((ach) => {
                  const currentVal =
                    typeof achOverridesDraft[ach.id] === 'number'
                      ? achOverridesDraft[ach.id]
                      : ach.rewardPoints;
                  return (
                    <div
                      key={ach.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2.5 text-[11px]"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">{ach.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{ach.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] text-amber-300">Poin:</span>
                        <input
                          type="number"
                          min={0}
                          value={currentVal}
                          onChange={(e) =>
                            setAchOverridesDraft((prev) => ({
                              ...prev,
                              [ach.id]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                            }))
                          }
                          className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 font-mono font-bold text-amber-300 tabular-nums"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= SUB-TAB 4: KELOLA STREAK, POIN & KARTU PER NASABAH ================= */}
      {activeSubTab === 'customers_manager' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          {/* Left 7 Cols: Search, Flame Status Filters, Admin Tier Filter, Sort & Customer Rows */}
          <div className="xl:col-span-7 rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Cari nama nasabah atau nomor rekening..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white"
                />
              </div>
              <select
                value={customerSort}
                onChange={(e) => setCustomerSort(e.target.value as CustomerSortKey)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="streak_desc">Urut: Streak Tertinggi</option>
                <option value="points_desc">Urut: Poin Terbanyak</option>
                <option value="freeze_desc">Urut: Beku Paling Parah</option>
                <option value="name_asc">Urut: Nama A–Z</option>
              </select>
            </div>

            {/* Flame Status Filter & Admin Tier Filter */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ['all', 'Semua'],
                    ['active', 'Aktif'],
                    ['freeze_1_2', 'Beku 1–2'],
                    ['critical_3', `Kritis 3 (${fleetData.criticalStage3Count})`],
                    ['reset_0', 'Reset 0'],
                  ] as Array<[CustomerFlameFilter, string]>
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    data-allow-readonly="true"
                    onClick={() => setCustomerFlameFilter(key)}
                    className={`min-h-[34px] rounded-lg border px-2.5 py-1 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                      customerFlameFilter === key
                        ? key === 'critical_3'
                          ? 'border-rose-400 bg-rose-500 text-white'
                          : 'border-amber-400 bg-amber-400 text-slate-950'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                data-allow-readonly="true"
                onClick={() => setOnlyAdminTierFilter((v) => !v)}
                className={`min-h-[34px] inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  onlyAdminTierFilter
                    ? 'border-amber-400 bg-amber-500/20 text-amber-200'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600'
                }`}
              >
                <Crown className="h-3.5 w-3.5 text-amber-400" />
                <span>Khusus Tier Admin (∞)</span>
              </button>
            </div>

            {/* Customer List Rows */}
            <div className="max-h-[460px] overflow-y-auto divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-900/40">
              {filteredCustomers.map((row) => {
                const isSelected = selectedCustomerRow?.acc.id === row.acc.id;
                const statusLabel =
                  row.snap.stage === 3
                    ? 'Kritis Lv.3'
                    : row.snap.stage === 2
                    ? 'Beku Lv.2'
                    : row.snap.stage === 1
                    ? 'Beku Lv.1'
                    : row.snap.status === 'expired_reset'
                    ? 'Reset 0'
                    : 'Aktif';
                const statusTone =
                  row.snap.stage === 3
                    ? 'text-rose-300'
                    : row.snap.stage === 1 || row.snap.stage === 2
                    ? 'text-cyan-300'
                    : row.snap.status === 'expired_reset'
                    ? 'text-slate-400'
                    : 'text-emerald-300';

                return (
                  <div
                    key={row.acc.id}
                    className={`p-3 flex flex-wrap items-center justify-between gap-2 transition ${
                      isSelected ? 'bg-slate-800/80' : 'hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-white truncate">{row.acc.fullName}</span>
                        {row.isAdm && (
                          <span className="text-[10px] font-bold text-amber-300 shrink-0">
                            ADMIN ∞
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 text-[11px] text-slate-400 font-mono tabular-nums mt-0.5">
                        <span>{row.acc.accountNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span className={statusTone}>{statusLabel}</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-orange-300">Streak {row.snap.activeStreak} Hr</span>
                        <span aria-hidden="true">·</span>
                        <span className="text-amber-300">
                          {row.isAdm ? '∞ Poin' : `${row.points.toLocaleString('id-ID')} Poin`}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="text-cyan-300">
                          {row.isAdm ? '∞ Kartu' : `${row.recoveryCards} Kartu`}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {row.snap.stage > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            notify(
                              adminManageAccountStreak(row.acc.id, { type: 'thaw_restore' }).message
                            )
                          }
                          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[11px] font-bold text-white whitespace-nowrap cursor-pointer"
                        >
                          Cairkan
                        </button>
                      )}
                      {!row.isAdm && (
                        <button
                          type="button"
                          onClick={() =>
                            notify(adminAdjustLoyaltyPoints(row.acc.id, 100, 'add').message)
                          }
                          className="rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 whitespace-nowrap cursor-pointer"
                        >
                          +100 Poin
                        </button>
                      )}
                      <button
                        type="button"
                        data-allow-readonly="true"
                        onClick={() => setTargetAccId(row.acc.id)}
                        className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? 'border-amber-400 bg-amber-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        {isSelected ? 'Terpilih' : 'Pilih'}
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredCustomers.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada nasabah yang cocok dengan filter status api atau pencarian saat ini.
                </div>
              )}
            </div>
          </div>

          {/* Right 5 Cols: Inspector & Quick Controls for Selected Customer */}
          <div className="xl:col-span-5 rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[11px] text-amber-300 font-bold block">
                Panel Kontrol Nasabah Terpilih
              </span>
              {selectedCustomerRow ? (
                <>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {selectedCustomerRow.acc.fullName}
                  </h4>
                  <p className="text-[11px] font-mono tabular-nums text-slate-400 mt-0.5">
                    Rek {selectedCustomerRow.acc.accountNumber} ·{' '}
                    {selectedCustomerRow.snap.badgeText} · Streak{' '}
                    {selectedCustomerRow.snap.activeStreak} Hr ·{' '}
                    {selectedCustomerRow.isAdm
                      ? '∞ Poin & Kartu'
                      : `${selectedCustomerRow.points.toLocaleString('id-ID')} Poin · ${selectedCustomerRow.recoveryCards} Kartu`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-400 mt-1">Pilih nasabah di sebelah kiri.</p>
              )}
            </div>

            {selectedCustomerRow && (
              <>
                {selectedCustomerRow.isAdm && (
                  <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2">
                    Kartu Tier Admin: Poin Loyalty &amp; Stok Kartu Pemulihan terkunci Infinity (∞), sedangkan status api streak harian tetap dapat dikelola di bawah.
                  </p>
                )}

                {/* Points Adjust */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Ubah Poin Loyalty
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={pointsAdjustVal}
                      onChange={(e) => setPointsAdjustVal(Math.max(0, Number(e.target.value) || 0))}
                      className="w-28 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminAdjustLoyaltyPoints(
                            selectedCustomerRow.acc.id,
                            pointsAdjustVal,
                            'add'
                          ).message
                        )
                      }
                      className="flex-1 min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 font-black text-slate-950 whitespace-nowrap cursor-pointer"
                    >
                      + Tambah
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminAdjustLoyaltyPoints(
                            selectedCustomerRow.acc.id,
                            pointsAdjustVal,
                            'set'
                          ).message
                        )
                      }
                      className="flex-1 min-h-[40px] rounded-xl border border-amber-400/40 bg-slate-900 hover:bg-slate-800 font-black text-amber-300 whitespace-nowrap cursor-pointer"
                    >
                      Set Persis
                    </button>
                  </div>
                </div>

                {/* Streak Freeze / Thaw Buttons */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-bold text-slate-300 block">
                    Kontrol Api Streak &amp; Beku
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'thaw_restore',
                          }).message
                        )
                      }
                      className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white whitespace-nowrap cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>Pulihkan &amp; Cairkan</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'set_freeze_stage',
                            value: 1,
                          }).message
                        )
                      }
                      className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-2 text-xs font-bold text-cyan-200 whitespace-nowrap cursor-pointer"
                    >
                      <Snowflake className="w-3.5 h-3.5" />
                      <span>Set Beku Lv.1</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'set_freeze_stage',
                            value: 2,
                          }).message
                        )
                      }
                      className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 hover:bg-sky-900/60 px-3 py-2 text-xs font-bold text-sky-200 whitespace-nowrap cursor-pointer"
                    >
                      <Snowflake className="w-3.5 h-3.5" />
                      <span>Set Beku Lv.2</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'set_freeze_stage',
                            value: 3,
                          }).message
                        )
                      }
                      className="min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-400/50 bg-rose-950/60 hover:bg-rose-900/60 px-3 py-2 text-xs font-black text-rose-100 whitespace-nowrap cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Set Kritis Lv.3</span>
                    </button>
                  </div>
                </div>

                {/* Manual Streak Days & Recovery Cards */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-300 w-28 shrink-0">
                      Angka Streak (Hr)
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={manualStreakVal}
                      onChange={(e) => setManualStreakVal(Math.max(0, Number(e.target.value) || 0))}
                      className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'set_streak_days',
                            value: manualStreakVal,
                          }).message
                        )
                      }
                      className="flex-1 min-h-[40px] rounded-xl bg-orange-500 hover:bg-orange-400 px-3 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                    >
                      Set Streak
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-300 w-28 shrink-0">
                      Kartu Pemulihan
                    </span>
                    <input
                      type="number"
                      min={0}
                      value={manualRecoveryCardsVal}
                      onChange={(e) =>
                        setManualRecoveryCardsVal(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-20 rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-cyan-300 tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'add_recovery_cards',
                            value: manualRecoveryCardsVal,
                          }).message
                        )
                      }
                      className="flex-1 min-h-[40px] rounded-xl bg-cyan-500 hover:bg-cyan-400 px-2.5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                    >
                      + Tambah
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        notify(
                          adminManageAccountStreak(selectedCustomerRow.acc.id, {
                            type: 'set_recovery_cards',
                            value: manualRecoveryCardsVal,
                          }).message
                        )
                      }
                      className="min-h-[40px] rounded-xl border border-cyan-400/40 bg-slate-900 hover:bg-slate-800 px-3 py-2 text-xs font-bold text-cyan-200 whitespace-nowrap cursor-pointer"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 5: LOG PENUKARAN POIN LOYALTY LIVE ================= */}
      {activeSubTab === 'redemption_logs' && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="h-4 w-4 text-cyan-400" />
                <span>Log Riwayat Penukaran Poin Loyalty Global ({filteredRedemptionLogs.length})</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Pantau seluruh transaksi penukaran poin ke Saldo Tunai, Coin, Voucher Naik Level, maupun Paket Kustom secara live.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter nama, rekening, atau ref..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-8 pr-3 py-2 text-xs text-white"
                />
              </div>
              <select
                value={logTargetFilter}
                onChange={(e) =>
                  setLogTargetFilter(e.target.value as 'all' | LoyaltyRedeemTarget | 'custom')
                }
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-white"
              >
                <option value="all">Semua Hadiah</option>
                <option value="cash">Saldo Tunai</option>
                <option value="coin">Coin</option>
                <option value="voucher">Voucher Naik Level</option>
                <option value="custom">Paket Kustom</option>
              </select>
            </div>
          </div>

          {filteredRedemptionLogs.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Waktu WIB</th>
                    <th className="px-3 py-2.5 font-semibold">Nasabah</th>
                    <th className="px-3 py-2.5 font-semibold">Paket Tukar</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Poin Dipotong</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Hadiah Diterima</th>
                    <th className="px-3 py-2.5 font-semibold">Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-950">
                  {filteredRedemptionLogs.map(({ record, accountName, accountNumber, isAdm }) => (
                    <tr key={record.id} className="hover:bg-slate-900/60">
                      <td className="px-3 py-2.5 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {formatWibShort(record.timestampIso)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-white">
                          {accountName}{' '}
                          {isAdm && <span className="text-[10px] text-amber-300">(Admin ∞)</span>}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">{accountNumber}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200">
                          {renderTargetIcon(record.target, 'h-3.5 w-3.5 text-slate-300')}
                          <span>
                            {record.packageTitle} ({record.packagesCount}x)
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-amber-300 whitespace-nowrap">
                        {isAdm ? '∞ (Admin)' : `${record.pointsSpent.toLocaleString('id-ID')} Poin`}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-bold text-emerald-300 whitespace-nowrap">
                        {record.rewardLabel}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {record.referenceNo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-1.5">
              <p className="text-xs font-bold text-slate-300">
                Belum Ada Log Penukaran Poin yang Cocok
              </p>
              <p className="text-[11px] text-slate-500">
                Saat nasabah menukar Poin Loyalty ke Saldo Tunai, Coin, atau Voucher Naik Level, riwayat lengkap beserta nomor referensi akan langsung tercatat di sini.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
