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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { isAdminCardAccount, formatRupiah } from '../utils/bankUtils';
import {
  LOYALTY_100_DAILY_MISSIONS,
  LOYALTY_MISSION_CATEGORY_META,
  computeStreakVisualSnapshot,
  normalizeLoyaltyAdminConfig,
} from '../utils/loyaltySystemUtils';
import { LoyaltyDailyMissionCategory, LoyaltyDailyMissionOverride } from '../types/bank';

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

  const [enabledDraft, setEnabledDraft] = useState<boolean>(cfg.enabled !== false);
  const [dailyCheckInDraft, setDailyCheckInDraft] = useState<string>(String(cfg.dailyCheckInPoints));
  const [streakBonus7Draft, setStreakBonus7Draft] = useState<string>(String(cfg.streakBonus7DaysPoints));
  const [rupiahPerPointDraft, setRupiahPerPointDraft] = useState<string>(String(cfg.rupiahPerPoint));
  const [coinPer100Draft, setCoinPer100Draft] = useState<string>(String(cfg.coinPer100Points));
  const [voucherPtsDraft, setVoucherPtsDraft] = useState<string>(String(cfg.pointsPerLevelVoucher || 200));
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
  const [overridesDraft, setOverridesDraft] = useState<Record<string, LoyaltyDailyMissionOverride>>(
    () => ({ ...(cfg.missionOverrides || {}) })
  );

  // Mission Editor filter
  const [missionSearch, setMissionSearch] = useState<string>('');
  const [missionCatFilter, setMissionCatFilter] = useState<'all' | LoyaltyDailyMissionCategory>('all');
  const [showMissionEditor, setShowMissionEditor] = useState<boolean>(false);

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
    setRupiahPerPointDraft(String(cfg.rupiahPerPoint));
    setCoinPer100Draft(String(cfg.coinPer100Points));
    setVoucherPtsDraft(String(cfg.pointsPerLevelVoucher || 200));
    setRecoveryPriceDraft(String(cfg.recoveryCardDiamondPrice || 25));
    setFreeze1Draft(String(cfg.freezeStage1Days || 1));
    setFreeze2Draft(String(cfg.freezeStage2Days || 2));
    setFreeze3Draft(String(cfg.freezeRecoveryRequiredDays || 3));
    setExpireAfterDraft(String(cfg.streakExpireAfterDays || 3));
    setActiveMissionCountDraft(String(cfg.activeDailyMissionCount || 100));
    setRewardMultiplierDraft(String(cfg.missionRewardMultiplier || 1));
    setOverridesDraft({ ...(cfg.missionOverrides || {}) });
  }, [cfg]);

  const notify = (text: string) => {
    setLocalMsg(text);
    onFeedback?.(text);
    window.setTimeout(() => setLocalMsg(''), 4500);
  };

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

  const handleSaveGlobalConfig = () => {
    const res = adminUpdateLoyaltyConfig({
      enabled: enabledDraft,
      dailyCheckInPoints: Math.max(1, Number(dailyCheckInDraft) || 25),
      streakBonus7DaysPoints: Math.max(0, Number(streakBonus7Draft) || 150),
      rupiahPerPoint: Math.max(10, Number(rupiahPerPointDraft) || 500),
      coinPer100Points: Math.max(1, Number(coinPer100Draft) || 15),
      pointsPerLevelVoucher: Math.max(50, Number(voucherPtsDraft) || 200),
      recoveryCardDiamondPrice: Math.max(1, Number(recoveryPriceDraft) || 25),
      freezeStage1Days: Math.max(1, Number(freeze1Draft) || 1),
      freezeStage2Days: Math.max(2, Number(freeze2Draft) || 2),
      freezeRecoveryRequiredDays: Math.max(3, Number(freeze3Draft) || 3),
      streakExpireAfterDays: Math.max(3, Number(expireAfterDraft) || 3),
      activeDailyMissionCount: Math.max(1, Math.min(100, Number(activeMissionCountDraft) || 100)),
      missionRewardMultiplier: Math.max(0.25, Math.min(10, Number(rewardMultiplierDraft) || 1)),
      missionOverrides: overridesDraft,
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

  return (
    <div className="space-y-4">
      {localMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-3.5 py-2.5 text-xs font-bold text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{localMsg}</span>
        </div>
      )}

      {/* 1. KONFIGURASI STREAK, KARTU PEMULIHAN, 100 MISI & KURS TUKAR (TANPA DIAMOND) */}
      <div className="rounded-2xl border border-amber-500/40 bg-slate-950 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="font-black text-amber-300 text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Pengaturan Auto-Streak, Kartu Pemulihan &amp; 100 Misi Poin Loyalty</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Atur harga Diamond Kartu Pemulihan, hari beku tahap 1–3, jumlah misi aktif harian (1–100), pengali hadiah, dan kurs tukar (Saldo Tunai, Coin, Voucher Naik Level — tanpa Diamond).
            </p>
          </div>
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

        {/* Row A: Streak & Recovery Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Harga Kartu Pemulihan (Diamond)</label>
            <input
              type="number"
              min={1}
              value={recoveryPriceDraft}
              onChange={(e) => setRecoveryPriceDraft(e.target.value)}
              className="w-full rounded-xl border border-cyan-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-cyan-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Off Beku Tahap 1 (Hari)</label>
            <input
              type="number"
              min={1}
              max={10}
              value={freeze1Draft}
              onChange={(e) => setFreeze1Draft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Off Makin Beku (Hari)</label>
            <input
              type="number"
              min={2}
              max={15}
              value={freeze2Draft}
              onChange={(e) => setFreeze2Draft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Off Wajib Pulihkan (Hari)</label>
            <input
              type="number"
              min={3}
              max={30}
              value={freeze3Draft}
              onChange={(e) => setFreeze3Draft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Hangus Reset 0 (&gt; Hari)</label>
            <input
              type="number"
              min={3}
              max={60}
              value={expireAfterDraft}
              onChange={(e) => setExpireAfterDraft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Poin Auto-Streak / Bonus 7 Hr</label>
            <div className="grid grid-cols-2 gap-1">
              <input
                type="number"
                min={1}
                value={dailyCheckInDraft}
                onChange={(e) => setDailyCheckInDraft(e.target.value)}
                title="Poin Harian Auto-Streak"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 font-mono font-bold text-white"
              />
              <input
                type="number"
                min={0}
                value={streakBonus7Draft}
                onChange={(e) => setStreakBonus7Draft(e.target.value)}
                title="Bonus Kelipatan 7 Hari"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2 py-2 font-mono font-bold text-amber-300"
              />
            </div>
          </div>
        </div>

        {/* Row B: 100 Missions & Exchange Rates (Saldo Tunai, Coin, Voucher Naik Level — NO DIAMOND) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Jumlah Misi Aktif (1–100)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={activeMissionCountDraft}
              onChange={(e) => setActiveMissionCountDraft(e.target.value)}
              className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-amber-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-slate-400 block mb-1">Pengali Hadiah Misi (x)</label>
            <input
              type="number"
              min={0.25}
              max={10}
              step={0.25}
              value={rewardMultiplierDraft}
              onChange={(e) => setRewardMultiplierDraft(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono font-bold text-white"
            />
          </div>
          <div>
            <label className="text-[10px] text-emerald-300 flex items-center gap-1 mb-1">
              <Banknote className="w-3 h-3" /> Saldo Tunai (Rp / Poin)
            </label>
            <input
              type="number"
              min={10}
              value={rupiahPerPointDraft}
              onChange={(e) => setRupiahPerPointDraft(e.target.value)}
              className="w-full rounded-xl border border-emerald-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-emerald-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-amber-300 flex items-center gap-1 mb-1">
              <Coins className="w-3 h-3" /> Coin (per 100 Poin)
            </label>
            <input
              type="number"
              min={1}
              value={coinPer100Draft}
              onChange={(e) => setCoinPer100Draft(e.target.value)}
              className="w-full rounded-xl border border-amber-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-amber-300"
            />
          </div>
          <div>
            <label className="text-[10px] text-violet-300 flex items-center gap-1 mb-1">
              <Ticket className="w-3 h-3" /> Voucher Naik Level (Poin/Voucher)
            </label>
            <input
              type="number"
              min={50}
              value={voucherPtsDraft}
              onChange={(e) => setVoucherPtsDraft(e.target.value)}
              className="w-full rounded-xl border border-violet-500/40 bg-slate-900 px-2.5 py-2 font-mono font-bold text-violet-300"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowMissionEditor((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {showMissionEditor
                ? 'Tutup Editor 100 Misi Harian'
                : 'Edit Misi Individual (Aktif/Nonaktif, Target & Hadiah)'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSaveGlobalConfig}
            className="rounded-xl bg-amber-400 hover:bg-amber-300 px-5 py-2 text-xs font-black text-slate-950 cursor-pointer"
          >
            Simpan Seluruh Pengaturan Loyalty &amp; Streak
          </button>
        </div>

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
                onChange={(e) => setMissionCatFilter(e.target.value as 'all' | LoyaltyDailyMissionCategory)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white font-bold"
              >
                <option value="all">Semua Kategori (100)</option>
                {(Object.keys(LOYALTY_MISSION_CATEGORY_META) as LoyaltyDailyMissionCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {LOYALTY_MISSION_CATEGORY_META[cat].label}
                  </option>
                ))}
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

      {/* 2. KONTROL MANUAL STREAK, BEKU, KARTU PEMULIHAN & SUNTIK POIN NASABAH */}
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
                {acc.fullName} ({acc.accountNumber}) — {isAdm ? '∞' : (st?.points || 0)} Poin · Streak {st?.streakDays || 0} Hr · Beku Lv.{st?.freezeStage || 0} · {isAdm ? '∞' : (st?.recoveryCards || 0)} Kartu
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
            Suntik / Set Poin Loyalty (1 Poin = {formatRupiah(cfg.rupiahPerPoint)})
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
              onClick={() => notify(adminAdjustLoyaltyPoints(targetAccId, pointsAdjustVal, 'add').message)}
              className="flex-1 rounded-xl bg-amber-400 hover:bg-amber-300 py-2 font-black text-slate-950 cursor-pointer"
            >
              + Tambah Poin
            </button>
            <button
              type="button"
              onClick={() => notify(adminAdjustLoyaltyPoints(targetAccId, pointsAdjustVal, 'set').message)}
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
              notify(adminManageAccountStreak(targetAccId, { type: 'set_freeze_stage', value: 1 }).message)
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/60 hover:bg-cyan-900/60 px-3 py-2 text-xs font-bold text-cyan-200 cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Set Beku Tahap 1</span>
          </button>
          <button
            type="button"
            onClick={() =>
              notify(adminManageAccountStreak(targetAccId, { type: 'set_freeze_stage', value: 2 }).message)
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/60 hover:bg-sky-900/60 px-3 py-2 text-xs font-bold text-sky-200 cursor-pointer"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Set Beku Tahap 2</span>
          </button>
          <button
            type="button"
            onClick={() =>
              notify(adminManageAccountStreak(targetAccId, { type: 'set_freeze_stage', value: 3 }).message)
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
