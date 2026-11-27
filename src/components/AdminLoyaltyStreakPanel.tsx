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
  normalizeLoyaltyAdminConfig,
} from '../utils/loyaltySystemUtils';
import {
  LoyaltyCustomRedeemPackage,
  LoyaltyDailyMissionCategory,
  LoyaltyDailyMissionOverride,
  LoyaltyRedeemTarget,
} from '../types/bank';

interface AdminLoyaltyStreakPanelProps {
  onFeedback?: (message: string) => void;
}

export const AdminLoyaltyStreakPanel: React.FC<AdminLoyaltyStreakPanelProps> = ({ onFeedback }) => {
  const {
    accounts,
    loyaltyMap,
    loyaltyConfig,
    adminUpdateLoyaltyConfig,
    adminAdjustLoyaltyPoints,
    adminManageAccountStreak,
  } = useBank();

  const cfg = useMemo(() => normalizeLoyaltyAdminConfig(loyaltyConfig), [loyaltyConfig]);

  // Global & Streak Drafts
  const [enabledDraft, setEnabledDraft] = useState<boolean>(cfg.enabled !== false);
  const [dailyCheckInDraft, setDailyCheckInDraft] = useState<string>(String(cfg.dailyCheckInPoints));
  const [streakBonus7Draft, setStreakBonus7Draft] = useState<string>(
    String(cfg.streakBonus7DaysPoints)
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

  // 3 Standard Exchange Package Drafts (150=100k, 100=10 Coin, 100=1 Voucher)
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

  // Sub-editors
  const [missionSearch, setMissionSearch] = useState<string>('');
  const [missionCatFilter, setMissionCatFilter] = useState<'all' | LoyaltyDailyMissionCategory>(
    'all'
  );
  const [showMissionEditor, setShowMissionEditor] = useState<boolean>(false);
  const [showAchEditor, setShowAchEditor] = useState<boolean>(false);

  // Target Customer Manual Manager
  const [targetAccId, setTargetAccId] = useState<string>(accounts[0]?.id || 'acc-admin');
  const [pointsAdjustVal, setPointsAdjustVal] = useState<number>(250);
  const [manualStreakVal, setManualStreakVal] = useState<number>(7);
  const [manualRecoveryCardsVal, setManualRecoveryCardsVal] = useState<number>(3);
  const [localMsg, setLocalMsg] = useState<string>('');

  useEffect(() => {
    setEnabledDraft(cfg.enabled !== false);
    setDailyCheckInDraft(String(cfg.dailyCheckInPoints));
    setStreakBonus7Draft(String(cfg.streakBonus7DaysPoints));
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

  // Live Draft Preview Packages (updates instantaneously before saving)
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

  const selectedAcc = accounts.find((a) => a.id === targetAccId) || accounts[0];
  const selectedIsAdmin = isAdminCardAccount(selectedAcc);
  const selectedLoyalty = selectedAcc ? loyaltyMap[selectedAcc.id] : undefined;
  const selectedStreakSnap = computeStreakVisualSnapshot(selectedLoyalty, cfg);

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
      dailyCheckInPoints: Math.max(1, Number(dailyCheckInDraft) || 25),
      streakBonus7DaysPoints: Math.max(0, Number(streakBonus7Draft) || 150),
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

  return (
    <div className="space-y-4">
      {localMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-2.5 text-xs font-bold text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{localMsg}</span>
        </div>
      )}

      {/* 1. KURS PENUKARAN PAKET UTAMA, PAKET KUSTOM, BATAS HARIAN & PRATINJAU NASABAH */}
      <div className="rounded-2xl border border-emerald-500/40 bg-slate-950 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-black text-emerald-300 text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>Pengaturan Kurs Tukar Poin Loyalty &amp; Paket Kustom (Tanpa Diamond)</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Atur biaya poin, nominal hadiah, saklar aktif/nonaktif untuk 3 paket utama (Saldo Tunai, Coin, Voucher Naik Level), batas harian opsional, dan tambah paket kustom.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetDefaultExchangeRates}
              className="inline-flex items-center gap-1.5 rounded-xl border border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-300 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Kurs Bawaan</span>
            </button>
            <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white cursor-pointer">
              <input
                type="checkbox"
                checked={enabledDraft}
                onChange={(e) => setEnabledDraft(e.target.checked)}
                className="accent-amber-400"
              />
              <span>Sistem Loyalty Aktif</span>
            </label>
          </div>
        </div>

        {/* 3 Standard Packages Editor Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Saldo Tunai */}
          <div
            className={`rounded-2xl border p-3.5 space-y-3 ${
              cashEnabledDraft
                ? 'border-emerald-500/40 bg-slate-900/70'
                : 'border-slate-800 bg-slate-900/30 opacity-65'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs text-emerald-300 flex items-center gap-1.5">
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

          {/* Coin */}
          <div
            className={`rounded-2xl border p-3.5 space-y-3 ${
              coinEnabledDraft
                ? 'border-amber-500/40 bg-slate-900/70'
                : 'border-slate-800 bg-slate-900/30 opacity-65'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs text-amber-300 flex items-center gap-1.5">
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

          {/* Voucher Naik Level */}
          <div
            className={`rounded-2xl border p-3.5 space-y-3 ${
              voucherEnabledDraft
                ? 'border-violet-500/40 bg-slate-900/70'
                : 'border-slate-800 bg-slate-900/30 opacity-65'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-xs text-violet-300 flex items-center gap-1.5">
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

        {/* Daily Redemption Limit Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3.5 py-2.5">
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
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-xs font-black text-cyan-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Paket Penukaran Kustom Tambahan ({customPackagesDraft.length})</span>
            </h5>
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
              title="Biaya Poin"
              className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono text-xs text-white tabular-nums"
            />
            <input
              type="number"
              min={1}
              value={newPkgReward}
              onChange={(e) => setNewPkgReward(e.target.value)}
              placeholder="Jumlah Hadiah"
              title="Jumlah Hadiah (Rp / Coin / Voucher)"
              className="sm:col-span-2 rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-2 font-mono text-xs text-emerald-300 tabular-nums"
            />
            <button
              type="button"
              onClick={handleAddCustomPackage}
              className="sm:col-span-2 inline-flex items-center justify-center gap-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
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
                    <span className="text-slate-300 shrink-0">{renderTargetIcon(cp.target, 'w-3.5 h-3.5')}</span>
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

        {/* LIVE CUSTOMER PREVIEW BOX */}
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h5 className="text-xs font-black text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Pratinjau Langsung Kartu Tukar Nasabah (Sebelum Disimpan)</span>
            </h5>
            <span className="text-[11px] font-bold text-slate-400">
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
                    p.enabled ? `${accentClass} bg-slate-950` : 'border-slate-800 bg-slate-950/40 opacity-55'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-xs text-white flex items-center gap-1.5 truncate">
                      {renderTargetIcon(p.target, 'w-4 h-4 shrink-0')}
                      <span className="truncate">{p.title}</span>
                    </span>
                    <span
                      className={`text-[10px] font-black ${
                        p.enabled ? 'text-emerald-300' : 'text-rose-400'
                      }`}
                    >
                      {p.enabled ? (p.isCustom ? 'KUSTOM' : 'AKTIF') : 'NONAKTIF'}
                    </span>
                  </div>
                  <p className="text-xs font-black font-mono tabular-nums">
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

      {/* 2. KONFIGURASI AUTO-STREAK, KARTU PEMULIHAN, 100 MISI & HADIAH PENCAPAIAN */}
      <div className="rounded-2xl border border-amber-500/40 bg-slate-950 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-black text-amber-300 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Pengaturan Hadiah Poin Auto-Streak, Kartu Pemulihan, 100 Misi &amp; Pencapaian</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Atur hadiah poin harian Auto-Streak, bonus 7 hari, harga Diamond Kartu Pemulihan, hari beku tahap 1–3, 100 misi aktif harian, dan hadiah Pencapaian Utama.
            </p>
          </div>
        </div>

        {/* Row A: Streak, Recovery Card & Missions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Poin Auto-Streak / Hr</label>
            <input
              type="number"
              min={1}
              value={dailyCheckInDraft}
              onChange={(e) => setDailyCheckInDraft(e.target.value)}
              className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-amber-300 tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Bonus 7 Hari (Poin)</label>
            <input
              type="number"
              min={0}
              value={streakBonus7Draft}
              onChange={(e) => setStreakBonus7Draft(e.target.value)}
              className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-amber-300 tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Kartu Pulih (💎)</label>
            <input
              type="number"
              min={1}
              value={recoveryPriceDraft}
              onChange={(e) => setRecoveryPriceDraft(e.target.value)}
              className="w-full rounded-xl border border-cyan-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-cyan-300 tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Beku Lv.1 (Hr)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={freeze1Draft}
              onChange={(e) => setFreeze1Draft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Beku Lv.2 (Hr)</label>
            <input
              type="number"
              min={2}
              max={15}
              value={freeze2Draft}
              onChange={(e) => setFreeze2Draft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Wajib Pulih / Hangus</label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="number"
                min={3}
                max={30}
                value={freeze3Draft}
                onChange={(e) => setFreeze3Draft(e.target.value)}
                title="Hari offline wajib kartu pemulihan"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 font-mono font-bold text-white tabular-nums"
              />
              <input
                type="number"
                min={3}
                max={60}
                value={expireAfterDraft}
                onChange={(e) => setExpireAfterDraft(e.target.value)}
                title="Lewat hari ini streak hangus reset 0"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 font-mono font-bold text-rose-300 tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Misi Aktif (1–100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={activeMissionCountDraft}
              onChange={(e) => setActiveMissionCountDraft(e.target.value)}
              className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-amber-300 tabular-nums"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Pengali Misi (x)</label>
            <input
              type="number"
              min={0.25}
              max={10}
              step={0.25}
              value={rewardMultiplierDraft}
              onChange={(e) => setRewardMultiplierDraft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white tabular-nums"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMissionEditor((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 whitespace-nowrap cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>{showMissionEditor ? 'Tutup Editor 100 Misi' : 'Edit 100 Misi Harian'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAchEditor((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 whitespace-nowrap cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {showAchEditor ? 'Tutup Editor Pencapaian' : 'Edit Hadiah Pencapaian Utama'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveGlobalConfig}
            className="min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
          >
            Simpan Seluruh Pengaturan Loyalty &amp; Streak
          </button>
        </div>

        {/* Collapsible Milestone Achievement Reward Editor */}
        {showAchEditor && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-emerald-300">
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
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-[11px]"
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
                        className="w-20 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono font-bold text-amber-300 tabular-nums"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapsible 100 Mission Individual Editor */}
        {showMissionEditor && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3.5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={missionSearch}
                  onChange={(e) => setMissionSearch(e.target.value)}
                  placeholder="Cari nomor atau judul dari 100 misi..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white"
                />
              </div>
              <select
                value={missionCatFilter}
                onChange={(e) =>
                  setMissionCatFilter(e.target.value as 'all' | LoyaltyDailyMissionCategory)
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
              >
                <option value="all">Semua Kategori (100)</option>
                {(Object.keys(LOYALTY_MISSION_CATEGORY_META) as LoyaltyDailyMissionCategory[]).map(
                  (cat) => (
                    <option key={cat} value={cat}>
                      {LOYALTY_MISSION_CATEGORY_META[cat].label}
                    </option>
                  )
                )}
              </select>
              <button
                type="button"
                onClick={() => setOverridesDraft({})}
                className="inline-flex items-center gap-1 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Default</span>
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredCatalog.map((m) => {
                const ov = overridesDraft[m.id] || {};
                const isEnabled = ov.enabled !== false;
                return (
                  <div
                    key={m.id}
                    className={`grid grid-cols-12 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] ${
                      isEnabled
                        ? 'border-slate-800 bg-slate-950/90'
                        : 'border-rose-500/25 bg-rose-950/15 opacity-65'
                    }`}
                  >
                    <label className="col-span-6 flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={(e) =>
                          updateMissionOverride(m.id, { enabled: e.target.checked })
                        }
                        className="accent-amber-400 shrink-0"
                      />
                      <span className="font-mono text-[10px] text-slate-500">#{m.index}</span>
                      <span className="font-bold text-white truncate">{m.title}</span>
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
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-white"
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
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-amber-300"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Catatan: Klik tombol &quot;Simpan Seluruh Pengaturan Loyalty &amp; Streak&quot; di atas untuk menerapkan perubahan editor misi.
            </p>
          </div>
        )}
      </div>

      {/* 3. KONTROL MANUAL STREAK, BEKU, KARTU PEMULIHAN & SUNTIK POIN NASABAH */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="font-black text-white flex items-center gap-1.5 text-sm">
            <Star className="w-4 h-4 text-amber-400" />
            <span>Kontrol Manual Poin Loyalty, Api Streak &amp; Kartu Pemulihan Nasabah</span>
          </h4>
          {selectedAcc && (
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-[11px] font-bold text-cyan-300">
              Status: {selectedStreakSnap.badgeText} · Streak {selectedStreakSnap.activeStreak} Hr ·{' '}
              {selectedIsAdmin ? 'Kartu Pemulihan ∞' : `${selectedLoyalty?.recoveryCards || 0} Kartu`}
            </span>
          )}
        </div>

        <select
          value={targetAccId}
          onChange={(e) => setTargetAccId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white font-bold"
        >
          {accounts.map((acc) => {
            const st = loyaltyMap[acc.id];
            const isAdm = isAdminCardAccount(acc);
            return (
              <option key={acc.id} value={acc.id}>
                {acc.fullName} ({acc.accountNumber}) — {isAdm ? '∞' : st?.points || 0} Poin · Streak{' '}
                {st?.streakDays || 0} Hr · Beku Lv.{st?.freezeStage || 0} ·{' '}
                {isAdm ? '∞' : st?.recoveryCards || 0} Kartu
              </option>
            );
          })}
        </select>

        {selectedIsAdmin && (
          <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-1.5">
            Kartu Tier Admin: Poin Loyalty dan Stok Kartu Pemulihan otomatis terkunci Infinity (∞), namun status Streak harian tetap dapat diuji/diatur di bawah ini.
          </p>
        )}

        {/* Row 1: Points Control */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
          <div className="sm:col-span-4 text-[11px] text-slate-400 font-bold">
            Suntik / Set Poin Loyalty ({cfg.cashPackagePoints} Poin ={' '}
            {formatLoyaltyRewardLabel('cash', cfg.cashPackageAmount || 100_000)})
          </div>
          <input
            type="number"
            min={0}
            value={pointsAdjustVal}
            onChange={(e) => setPointsAdjustVal(Math.max(0, Number(e.target.value) || 0))}
            className="sm:col-span-3 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-mono font-bold text-white"
          />
          <div className="sm:col-span-5 flex gap-2">
            <button
              type="button"
              onClick={() =>
                notify(adminAdjustLoyaltyPoints(targetAccId, pointsAdjustVal, 'add').message)
              }
              className="flex-1 rounded-xl bg-amber-400 hover:bg-amber-300 py-2 font-black text-slate-950 cursor-pointer"
            >
              + Tambah Poin
            </button>
            <button
              type="button"
              onClick={() =>
                notify(adminAdjustLoyaltyPoints(targetAccId, pointsAdjustVal, 'set').message)
              }
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/40 py-2 font-black text-amber-300 cursor-pointer"
            >
              Set Persis
            </button>
          </div>
        </div>

        {/* Row 2: Manual Freeze / Thaw / Restore Streak */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
          <button
            type="button"
            onClick={() =>
              notify(adminManageAccountStreak(targetAccId, { type: 'thaw_restore' }).message)
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Pulihkan &amp; Cairkan</span>
          </button>
          <button
            type="button"
            onClick={() =>
              notify(
                adminManageAccountStreak(targetAccId, { type: 'set_freeze_stage', value: 1 })
                  .message
              )
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-2 text-xs font-bold text-cyan-200 cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Set Beku Tahap 1</span>
          </button>
          <button
            type="button"
            onClick={() =>
              notify(
                adminManageAccountStreak(targetAccId, { type: 'set_freeze_stage', value: 2 })
                  .message
              )
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 hover:bg-sky-900/60 px-3 py-2 text-xs font-bold text-sky-200 cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Set Beku Tahap 2</span>
          </button>
          <button
            type="button"
            onClick={() =>
              notify(
                adminManageAccountStreak(targetAccId, { type: 'set_freeze_stage', value: 3 })
                  .message
              )
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-300/60 bg-cyan-500/20 hover:bg-cyan-500/30 px-3 py-2 text-xs font-black text-cyan-100 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Set Beku Tahap 3</span>
          </button>
        </div>

        {/* Row 3: Set Streak Days & Give Recovery Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
            <span className="text-[11px] font-bold text-slate-300 shrink-0">Angka Streak (Hr):</span>
            <input
              type="number"
              min={0}
              value={manualStreakVal}
              onChange={(e) => setManualStreakVal(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono font-bold text-white"
            />
            <button
              type="button"
              onClick={() =>
                notify(
                  adminManageAccountStreak(targetAccId, {
                    type: 'set_streak_days',
                    value: manualStreakVal,
                  }).message
                )
              }
              className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-400 px-3 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
            >
              Set Streak
            </button>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
            <span className="text-[11px] font-bold text-slate-300 shrink-0">Kartu Pemulihan:</span>
            <input
              type="number"
              min={0}
              value={manualRecoveryCardsVal}
              onChange={(e) => setManualRecoveryCardsVal(Math.max(0, Number(e.target.value) || 0))}
              className="w-16 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono font-bold text-cyan-300"
            />
            <button
              type="button"
              onClick={() =>
                notify(
                  adminManageAccountStreak(targetAccId, {
                    type: 'add_recovery_cards',
                    value: manualRecoveryCardsVal,
                  }).message
                )
              }
              className="rounded-lg bg-cyan-500 hover:bg-cyan-400 px-2.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
            >
              + Tambah
            </button>
            <button
              type="button"
              onClick={() =>
                notify(
                  adminManageAccountStreak(targetAccId, {
                    type: 'set_recovery_cards',
                    value: manualRecoveryCardsVal,
                  }).message
                )
              }
              className="rounded-lg border border-cyan-400/40 bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-cyan-200 cursor-pointer"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
