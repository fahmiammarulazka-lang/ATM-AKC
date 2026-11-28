import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Coins,
  Crown,
  Edit3,
  Infinity as InfinityIcon,
  Layers,
  Plus,
  Power,
  RotateCcw,
  Save,
  Search,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  Zap,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  DEFAULT_LEVEL_SYSTEM_CONFIG,
  LEVEL_XP_SOURCE_LABELS,
  MAX_REGULAR_ACCOUNT_LEVEL,
  formatMilestoneRewardSummary,
  getAccountLevelSnapshot,
  normalizeAccountLevelSystemConfig,
} from '../data/levelSystemCatalog';
import { FEATURED_TITLES } from '../data/profileCustomizationCatalog';
import {
  AccountLevelSystemConfig,
  LevelMilestoneReward,
  LevelXpSourceKey,
} from '../types/bank';
import { formatRupiah, isAdminCardAccount } from '../utils/bankUtils';

interface AdminLevelSystemTabProps {
  isReadOnly?: boolean;
}

const XP_SOURCE_KEYS: LevelXpSourceKey[] = [
  'tx',
  'qris',
  'gold',
  'mission',
  'streak',
  'spin',
  'achievement',
];

export const AdminLevelSystemTab: React.FC<AdminLevelSystemTabProps> = ({
  isReadOnly = false,
}) => {
  const {
    accounts,
    levelSystemConfig,
    updateLevelSystemConfig,
    resetLevelSystemConfig,
    adminAdjustAccountLevelOrXp,
  } = useBank();

  const normalizedCfg = useMemo(
    () => normalizeAccountLevelSystemConfig(levelSystemConfig),
    [levelSystemConfig]
  );

  const [enabledDraft, setEnabledDraft] = useState<boolean>(normalizedCfg.enabled);
  const [xpDraft, setXpDraft] = useState<Record<LevelXpSourceKey, number>>(
    normalizedCfg.xpPerSource
  );
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Form Milestone Hadiah Level
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [msLevelTarget, setMsLevelTarget] = useState<string>('15');
  const [msMoney, setMsMoney] = useState<string>('500000');
  const [msDiamonds, setMsDiamonds] = useState<string>('50');
  const [msCoins, setMsCoins] = useState<string>('5');
  const [msTokens, setMsTokens] = useState<string>('50');
  const [msTitleId, setMsTitleId] = useState<string>('');
  const [msNote, setMsNote] = useState<string>('');
  const [msEnabled, setMsEnabled] = useState<boolean>(true);

  // Kontrol Level & XP Nasabah
  const [accountQuery, setAccountQuery] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    () => accounts.find((a) => !isAdminCardAccount(a))?.id || accounts[0]?.id || ''
  );
  const [setLevelInput, setSetLevelInput] = useState<string>('10');
  const [deltaLevelInput, setDeltaLevelInput] = useState<string>('1');
  const [setXpInput, setSetXpInput] = useState<string>('1000');
  const [addXpInput, setAddXpInput] = useState<string>('500');
  const [grantNewMilestones, setGrantNewMilestones] = useState<boolean>(true);

  useEffect(() => {
    setEnabledDraft(normalizedCfg.enabled);
    setXpDraft(normalizedCfg.xpPerSource);
  }, [normalizedCfg]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const showStatus = (ok: boolean, text: string) => {
    setFeedback({ type: ok ? 'success' : 'error', text });
  };

  const summaryStats = useMemo(() => {
    let adminCount = 0;
    let highestRegularLevel = 1;
    for (const acc of accounts) {
      if (isAdminCardAccount(acc)) {
        adminCount += 1;
      } else {
        const snap = getAccountLevelSnapshot(acc);
        if (snap.level > highestRegularLevel) highestRegularLevel = snap.level;
      }
    }
    const activeMilestones = normalizedCfg.milestones.filter((m) => m.enabled).length;
    return {
      totalAccounts: accounts.length,
      adminCount,
      highestRegularLevel,
      activeMilestones,
      totalMilestones: normalizedCfg.milestones.length,
    };
  }, [accounts, normalizedCfg.milestones]);

  const filteredAccounts = useMemo(() => {
    const q = accountQuery.trim().toLowerCase();
    const list = !q
      ? accounts
      : accounts.filter(
          (a) =>
            a.fullName.toLowerCase().includes(q) ||
            a.accountNumber.toLowerCase().includes(q) ||
            (a.userId16 || '').toLowerCase().includes(q)
        );
    return list.slice(0, 60);
  }, [accounts, accountQuery]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || accounts[0] || null,
    [accounts, selectedAccountId]
  );

  const selectedSnapshot = useMemo(
    () => (selectedAccount ? getAccountLevelSnapshot(selectedAccount) : null),
    [selectedAccount]
  );

  const handleToggleGlobalEnabled = () => {
    if (isReadOnly) return;
    const next = !enabledDraft;
    setEnabledDraft(next);
    const res = updateLevelSystemConfig({ enabled: next });
    showStatus(res.success, res.message);
  };

  const handleSaveXpWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const cleanWeights: Record<LevelXpSourceKey, number> = { ...xpDraft };
    for (const k of XP_SOURCE_KEYS) {
      cleanWeights[k] = Math.max(0, Math.min(100_000, Math.round(Number(xpDraft[k]) || 0)));
    }
    const res = updateLevelSystemConfig({
      enabled: enabledDraft,
      xpPerSource: cleanWeights,
    });
    showStatus(res.success, res.message);
  };

  const handleResetDefaultConfig = () => {
    if (isReadOnly) return;
    const res = resetLevelSystemConfig();
    setEditingMilestoneId(null);
    showStatus(res.success, res.message);
  };

  const resetMilestoneForm = () => {
    setEditingMilestoneId(null);
    setMsLevelTarget('15');
    setMsMoney('500000');
    setMsDiamonds('50');
    setMsCoins('5');
    setMsTokens('50');
    setMsTitleId('');
    setMsNote('');
    setMsEnabled(true);
  };

  const handleStartEditMilestone = (m: LevelMilestoneReward) => {
    setEditingMilestoneId(m.id);
    setMsLevelTarget(String(m.levelTarget));
    setMsMoney(String(m.rewardMoney || 0));
    setMsDiamonds(String(m.rewardDiamonds || 0));
    setMsCoins(String(m.rewardSpinCoins || 0));
    setMsTokens(String(m.rewardSpinTokens || 0));
    setMsTitleId(m.rewardTitleId || '');
    setMsNote(m.note || '');
    setMsEnabled(m.enabled);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    const levelTarget = Math.max(
      1,
      Math.min(MAX_REGULAR_ACCOUNT_LEVEL, Math.round(Number(msLevelTarget) || 0))
    );
    if (!Number.isFinite(levelTarget) || levelTarget < 1) {
      showStatus(false, 'Target level harus antara 1 sampai 100.');
      return;
    }

    const rewardMoney = Math.max(0, Math.round(Number(msMoney) || 0));
    const rewardDiamonds = Math.max(0, Math.round(Number(msDiamonds) || 0));
    const rewardSpinCoins = Math.max(0, Math.round(Number(msCoins) || 0));
    const rewardSpinTokens = Math.max(0, Math.round(Number(msTokens) || 0));

    if (
      rewardMoney === 0 &&
      rewardDiamonds === 0 &&
      rewardSpinCoins === 0 &&
      rewardSpinTokens === 0 &&
      !msTitleId
    ) {
      showStatus(false, 'Isi minimal satu jenis hadiah (Saldo, Permata, Koin, Token, atau Gelar).');
      return;
    }

    const newItem: LevelMilestoneReward = {
      id: editingMilestoneId || `lvl-ms-${levelTarget}-${Date.now()}`,
      levelTarget,
      enabled: msEnabled,
      rewardMoney,
      rewardDiamonds,
      rewardSpinCoins,
      rewardSpinTokens,
      rewardTitleId: msTitleId || undefined,
      note: msNote.trim() || `Hadiah Kenaikan Level ${levelTarget}`,
    };

    const existingList = normalizedCfg.milestones.filter(
      (m) => m.id !== editingMilestoneId && m.levelTarget !== levelTarget
    );
    const nextMilestones = [...existingList, newItem].sort(
      (a, b) => a.levelTarget - b.levelTarget
    );

    const res = updateLevelSystemConfig({ milestones: nextMilestones });
    if (res.success) {
      showStatus(
        true,
        `Hadiah Level ${levelTarget} (${formatMilestoneRewardSummary(newItem)}) tersimpan.`
      );
      resetMilestoneForm();
    } else {
      showStatus(false, res.message);
    }
  };

  const handleToggleMilestoneEnabled = (m: LevelMilestoneReward) => {
    if (isReadOnly) return;
    const nextMilestones = normalizedCfg.milestones.map((item) =>
      item.id === m.id ? { ...item, enabled: !item.enabled } : item
    );
    const res = updateLevelSystemConfig({ milestones: nextMilestones });
    showStatus(
      res.success,
      `Milestone Level ${m.levelTarget} ${!m.enabled ? 'diaktifkan' : 'dinonaktifkan'}.`
    );
  };

  const handleDeleteMilestone = (m: LevelMilestoneReward) => {
    if (isReadOnly) return;
    const nextMilestones = normalizedCfg.milestones.filter((item) => item.id !== m.id);
    const res = updateLevelSystemConfig({ milestones: nextMilestones });
    if (editingMilestoneId === m.id) resetMilestoneForm();
    showStatus(res.success, `Milestone hadiah Level ${m.levelTarget} dihapus.`);
  };

  const handleAccountLevelAction = (
    mode: 'set_level' | 'add_level' | 'set_xp' | 'add_xp' | 'reset_rewards',
    rawVal?: number
  ) => {
    if (isReadOnly || !selectedAccount) return;
    const res = adminAdjustAccountLevelOrXp(selectedAccount.id, {
      mode,
      value: rawVal,
      grantNewMilestones,
    });
    showStatus(res.success, res.message);
  };

  const selectedIsAdmin = selectedAccount ? isAdminCardAccount(selectedAccount) : false;

  return (
    <div className="space-y-6 text-xs">
      {/* Header Utama Sistem Level */}
      <div className="rounded-2xl border border-amber-500/35 bg-slate-900 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Layers className="w-4 h-4" />
              <span>Sistem Level Akun XP (Lv. 1–100) &amp; Tier Admin Infinity (∞)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pengaturan Level, Bobot XP &amp; Hadiah Milestone Nasabah
            </h2>
            <p className="text-slate-400 max-w-3xl leading-relaxed">
              Tentukan angka level mana saja yang memberi hadiah otomatis (Saldo, Permata, Coin Spin,
              Token Bingkai, dan Gelar Eksklusif), atur perolehan XP 7 aktivitas, serta kelola Level &amp;
              XP nasabah. Kartu Tier Admin terkunci otomatis di level <strong className="text-amber-300">∞ (Infinity)</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isReadOnly}
              onClick={handleToggleGlobalEnabled}
              className={`min-h-[40px] px-4 py-2 rounded-xl font-bold inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 ${
                enabledDraft
                  ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{enabledDraft ? 'Sistem Level Aktif' : 'Sistem Level Dijeda'}</span>
            </button>
            <button
              type="button"
              disabled={isReadOnly}
              onClick={handleResetDefaultConfig}
              className="min-h-[40px] px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Default</span>
            </button>
          </div>
        </div>

        {/* KPI Ringkas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-slate-400">Total Nasabah Terdata</p>
            <p className="text-lg font-black text-white font-mono tabular-nums mt-0.5">
              {summaryStats.totalAccounts.toLocaleString('id-ID')} Akun
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
            <p className="text-slate-400">Level Reguler Tertinggi</p>
            <p className="text-lg font-black text-indigo-300 font-mono tabular-nums mt-0.5">
              Lv. {summaryStats.highestRegularLevel} / {MAX_REGULAR_ACCOUNT_LEVEL}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5">
            <p className="text-amber-300 font-semibold flex items-center gap-1">
              <Crown className="w-3.5 h-3.5" />
              <span>Tier Admin Infinity</span>
            </p>
            <p className="text-lg font-black text-amber-300 font-mono tabular-nums mt-0.5">
              {summaryStats.adminCount} Akun (Lv. ∞)
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5">
            <p className="text-emerald-300 font-semibold">Milestone Hadiah Aktif</p>
            <p className="text-lg font-black text-emerald-300 font-mono tabular-nums mt-0.5">
              {summaryStats.activeMilestones} / {summaryStats.totalMilestones} Target
            </p>
          </div>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200'
                : 'border-rose-500/40 bg-rose-950/50 text-rose-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback.text}</span>
          </div>
        )}
      </div>

      {/* Section 1: Bobot XP 7 Sumber Aktivitas */}
      <form
        onSubmit={handleSaveXpWeights}
        className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Bobot Perolehan XP per Aktivitas (Tersimpan ke Cloud)</span>
            </h3>
            <p className="text-slate-400 mt-0.5">
              Atur berapa XP yang diperoleh nasabah tiap kali menjalankan aktivitas berikut (0 = nonaktif).
            </p>
          </div>
          <button
            type="submit"
            disabled={isReadOnly}
            className="min-h-[38px] px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Bobot XP</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {XP_SOURCE_KEYS.map((key) => {
            const meta = LEVEL_XP_SOURCE_LABELS[key];
            return (
              <div
                key={key}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-slate-100">{meta.label}</label>
                  <span className="text-[10px] font-mono text-slate-500">
                    Def: {DEFAULT_LEVEL_SYSTEM_CONFIG.xpPerSource[key]}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 min-h-[30px]">
                  {meta.description}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min={0}
                    max={100000}
                    disabled={isReadOnly}
                    value={xpDraft[key]}
                    onChange={(e) =>
                      setXpDraft((prev) => ({
                        ...prev,
                        [key]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                      }))
                    }
                    className="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-white font-mono tabular-nums font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <span className="text-[11px] font-bold text-cyan-300 shrink-0">XP</span>
                </div>
              </div>
            );
          })}
        </div>
      </form>

      {/* Section 2: Konfigurator Milestone Hadiah Level Dinamis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form
          onSubmit={handleSaveMilestone}
          className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3.5 h-fit"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                {editingMilestoneId
                  ? `Edit Hadiah Level ${msLevelTarget}`
                  : 'Tambah / Atur Hadiah di Level Target'}
              </span>
            </h3>
            {editingMilestoneId && (
              <button
                type="button"
                onClick={resetMilestoneForm}
                className="text-[11px] font-bold text-slate-400 hover:text-white underline cursor-pointer"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-300 mb-1">
                Level Target (1–100)
              </label>
              <input
                type="number"
                min={1}
                max={MAX_REGULAR_ACCOUNT_LEVEL}
                required
                disabled={isReadOnly}
                value={msLevelTarget}
                onChange={(e) => setMsLevelTarget(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-amber-300 font-mono font-black tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-200 font-semibold cursor-pointer w-full">
                <input
                  type="checkbox"
                  disabled={isReadOnly}
                  checked={msEnabled}
                  onChange={(e) => setMsEnabled(e.target.checked)}
                  className="rounded border-slate-600 text-amber-500"
                />
                <span>Aktifkan Hadiah</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Saldo Rupiah</label>
              <input
                type="number"
                min={0}
                disabled={isReadOnly}
                value={msMoney}
                onChange={(e) => setMsMoney(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Permata (Diamond)</label>
              <input
                type="number"
                min={0}
                disabled={isReadOnly}
                value={msDiamonds}
                onChange={(e) => setMsDiamonds(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-cyan-300 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Coin Spin</label>
              <input
                type="number"
                min={0}
                disabled={isReadOnly}
                value={msCoins}
                onChange={(e) => setMsCoins(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-amber-200 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Token Bingkai</label>
              <input
                type="number"
                min={0}
                disabled={isReadOnly}
                value={msTokens}
                onChange={(e) => setMsTokens(e.target.value)}
                className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-fuchsia-300 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-fuchsia-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Hadiah Gelar Eksklusif (Opsional)
            </label>
            <select
              disabled={isReadOnly}
              value={msTitleId}
              onChange={(e) => setMsTitleId(e.target.value)}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">-- Tanpa Gelar Tambahan --</option>
              {FEATURED_TITLES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              Catatan / Label Hadiah
            </label>
            <input
              type="text"
              maxLength={120}
              disabled={isReadOnly}
              value={msNote}
              onChange={(e) => setMsNote(e.target.value)}
              placeholder={`Contoh: Apresiasi Level ${msLevelTarget || '15'}`}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            disabled={isReadOnly}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-50 text-slate-950 font-black inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            {editingMilestoneId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>
              {editingMilestoneId
                ? `Simpan Perubahan Level ${msLevelTarget}`
                : `Simpan Hadiah Level ${msLevelTarget}`}
            </span>
          </button>
        </form>

        {/* Daftar Milestone Aktif */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Daftar Target Level Berisi Hadiah ({normalizedCfg.milestones.length})</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              Cair otomatis saat nasabah menembus level
            </span>
          </div>

          {normalizedCfg.milestones.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-slate-400">
              Belum ada milestone hadiah level. Gunakan formulir di samping untuk menambahkan level target apa saja (1–100).
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {normalizedCfg.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    m.enabled
                      ? 'border-slate-700 bg-slate-950/75'
                      : 'border-slate-800 bg-slate-950/35 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-indigo-500/20 border border-amber-400/40 flex flex-col items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold uppercase text-amber-300">Lv.</span>
                      <span className="text-base font-black text-white font-mono tabular-nums leading-none">
                        {m.levelTarget}
                      </span>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-white truncate">
                          {m.note || `Target Level ${m.levelTarget}`}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.enabled
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {m.enabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-amber-200 break-words">
                        {formatMilestoneRewardSummary(m)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleToggleMilestoneEnabled(m)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer disabled:opacity-50"
                      title={m.enabled ? 'Nonaktifkan sementara' : 'Aktifkan'}
                    >
                      {m.enabled ? 'Jeda' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleStartEditMilestone(m)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-200 font-semibold inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handleDeleteMilestone(m)}
                      className="min-h-[34px] px-2.5 py-1 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 font-semibold inline-flex items-center cursor-pointer disabled:opacity-50"
                      title="Hapus milestone"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Section 3: Manajemen Manual Level, XP & Reset Hadiah Akun Nasabah */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Kontrol Manual Level, XP &amp; Reset Hadiah Akun Nasabah</span>
            </h3>
            <p className="text-slate-400 mt-0.5">
              Pilih rekening nasabah untuk mengatur Level (1–100), menyuntik atau menyetel XP, serta mereset riwayat klaim hadiah milestone.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-slate-200 font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={grantNewMilestones}
              onChange={(e) => setGrantNewMilestones(e.target.checked)}
              className="rounded border-slate-600"
            />
            <span>Otomatis Cairkan Hadiah Level Terlewati</span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Picker Nasabah */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={accountQuery}
                onChange={(e) => setAccountQuery(e.target.value)}
                placeholder="Cari nama, nomor rekening, atau ID 16 digit..."
                className="w-full min-h-[40px] pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {filteredAccounts.map((acc) => {
                const snap = getAccountLevelSnapshot(acc);
                const selected = selectedAccount?.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccountId(acc.id)}
                    className={`w-full text-left rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      selected
                        ? 'border-indigo-400 bg-indigo-950/60 text-white'
                        : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold truncate">{acc.fullName}</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {acc.accountNumber} · {acc.cardTier.toUpperCase()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono font-black shrink-0 ${
                        snap.isInfinity
                          ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950'
                          : 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30'
                      }`}
                    >
                      {snap.displayLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detail & Tombol Aksi Akun Terpilih */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-950/75 p-4 space-y-4">
            {selectedAccount && selectedSnapshot ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-white truncate">
                      {selectedAccount.fullName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Rek. {selectedAccount.accountNumber} · Saldo:{' '}
                      {selectedIsAdmin ? '∞' : formatRupiah(selectedAccount.balance)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1.5 rounded-xl font-mono font-black text-xs inline-flex items-center gap-1.5 ${
                        selectedSnapshot.isInfinity
                          ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {selectedSnapshot.isInfinity && <InfinityIcon className="w-4 h-4" />}
                      <span>
                        {selectedSnapshot.isInfinity
                          ? 'Lv. ∞ (Tier Admin)'
                          : `Lv. ${selectedSnapshot.level} / ${MAX_REGULAR_ACCOUNT_LEVEL}`}
                      </span>
                    </span>
                  </div>
                </div>

                {!selectedSnapshot.isInfinity && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">
                        Total XP Akumulasi:{' '}
                        <strong className="text-white font-mono tabular-nums">
                          {selectedSnapshot.xp.toLocaleString('id-ID')} XP
                        </strong>
                      </span>
                      <span className="text-indigo-300 font-mono tabular-nums font-bold">
                        {selectedSnapshot.isMaxLevel
                          ? 'Level Maksimal 100'
                          : `${selectedSnapshot.xpInCurrentLevel.toLocaleString('id-ID')} / ${selectedSnapshot.xpForNextLevel.toLocaleString('id-ID')} XP (${selectedSnapshot.progressPct}%)`}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400"
                        style={{ width: `${selectedSnapshot.progressPct}%` }}
                      />
                    </div>
                  </div>
                )}

                {selectedIsAdmin ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5 text-amber-200 flex items-start gap-2.5">
                    <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-100">
                        Level Infinity (∞) Terkunci Otomatis untuk Kartu Tier Admin
                      </p>
                      <p className="text-[11px] text-amber-200/80 mt-0.5">
                        Seluruh akun bertier Admin selalu tampil sebagai Lv. ∞ dan tidak dapat diturunkan ke level biasa selama berstatus Tier Admin.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2">
                      <label className="block font-bold text-slate-200">
                        Atur Langsung ke Level (1–100)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={MAX_REGULAR_ACCOUNT_LEVEL}
                          disabled={isReadOnly}
                          value={setLevelInput}
                          onChange={(e) => setSetLevelInput(e.target.value)}
                          className="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono tabular-nums"
                        />
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            handleAccountLevelAction('set_level', Number(setLevelInput) || 1)
                          }
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold shrink-0 cursor-pointer"
                        >
                          Set
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2">
                      <label className="block font-bold text-slate-200">
                        Naikkan / Turunkan Level (+/-)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={99}
                          disabled={isReadOnly}
                          value={deltaLevelInput}
                          onChange={(e) => setDeltaLevelInput(e.target.value)}
                          className="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono tabular-nums"
                        />
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            handleAccountLevelAction(
                              'add_level',
                              Math.abs(Number(deltaLevelInput) || 1)
                            )
                          }
                          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black shrink-0 cursor-pointer"
                        >
                          +Lv
                        </button>
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            handleAccountLevelAction(
                              'add_level',
                              -Math.abs(Number(deltaLevelInput) || 1)
                            )
                          }
                          className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 disabled:opacity-50 text-white font-black shrink-0 cursor-pointer"
                        >
                          -Lv
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2">
                      <label className="block font-bold text-slate-200">Set Total XP</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          disabled={isReadOnly}
                          value={setXpInput}
                          onChange={(e) => setSetXpInput(e.target.value)}
                          className="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono tabular-nums"
                        />
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            handleAccountLevelAction('set_xp', Math.max(0, Number(setXpInput) || 0))
                          }
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black shrink-0 cursor-pointer"
                        >
                          Set XP
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3 space-y-2">
                      <label className="block font-bold text-slate-200">Suntik Tambah XP</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          disabled={isReadOnly}
                          value={addXpInput}
                          onChange={(e) => setAddXpInput(e.target.value)}
                          className="w-full min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-white font-mono tabular-nums"
                        />
                        <button
                          type="button"
                          disabled={isReadOnly}
                          onClick={() =>
                            handleAccountLevelAction(
                              'add_xp',
                              Math.max(1, Number(addXpInput) || 0)
                            )
                          }
                          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black shrink-0 cursor-pointer"
                        >
                          +XP
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
                  <div className="text-[11px] text-slate-400">
                    Milestone Hadiah Sudah Cair:{' '}
                    <strong className="text-slate-200 font-mono">
                      {(selectedAccount.claimedLevelRewardLevels || []).length > 0
                        ? (selectedAccount.claimedLevelRewardLevels || [])
                            .map((lv) => `Lv.${lv}`)
                            .join(', ')
                        : 'Belum ada'}
                    </strong>
                  </div>
                  <button
                    type="button"
                    disabled={isReadOnly}
                    onClick={() => handleAccountLevelAction('reset_rewards')}
                    className="min-h-[34px] px-3 py-1.5 rounded-lg border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 disabled:opacity-50 text-rose-200 font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Klaim Hadiah Level</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-slate-400">
                Pilih akun nasabah di samping untuk mengatur Level &amp; XP.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
