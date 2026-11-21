import React, { useMemo, useState } from 'react';
import {
  Gift,
  Plus,
  Trash2,
  Copy,
  Check,
  Search,
  Sparkles,
  Crown,
  Dices,
  Clock,
  BellRing,
  BellOff,
  Lock,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { GIFT_REWARD_CATALOG, formatTrialDurationLabel } from '../data/giftRewardsCatalog';
import { AdminGiftRewardItem, GiftRewardType } from '../types/bank';
import { buildDefaultGachaTiersForReward } from '../utils/gachaUtils';
import { GachaTierBuilder } from './GachaTierBuilder';
import {
  formatSingleRewardSummary,
  getRedeemCodeStatus,
  sanitizeRedeemCodesList,
  summarizeRedeemCodeRewards,
} from '../utils/redeemSanitizer';

type RedeemCodeStatus = ReturnType<typeof getRedeemCodeStatus>;

const isCurrencyRewardType = (type: GiftRewardType): boolean =>
  type === 'cash_balance' ||
  type === 'pulsa_balance' ||
  type === 'special_deposito' ||
  type === 'dream_pocket_fund' ||
  type === 'salary_jackpot_drop' ||
  type === 'fee_waiver_pass' ||
  type === 'high_yield_deposito_vip' ||
  type === 'emergency_vault_fund' ||
  type === 'sultan_empire_dividend';

const minutesToAmountAndUnit = (
  minutes?: number
): { val: number; unit: 'minutes' | 'hours' | 'days' } => {
  const m = Math.max(1, Number(minutes) || 1440);
  if (m >= 1440 && m % 1440 === 0) return { val: m / 1440, unit: 'days' };
  if (m >= 60 && m % 60 === 0) return { val: m / 60, unit: 'hours' };
  return { val: m, unit: 'minutes' };
};

const createDefaultCashReward = (): AdminGiftRewardItem => {
  const cashMeta = GIFT_REWARD_CATALOG.find((m) => m.type === 'cash_balance');
  return {
    id: `rdm-rw-cash-${Date.now()}`,
    type: 'cash_balance',
    label: cashMeta?.label || 'Saldo Tunai Rekening',
    emoji: cashMeta?.emoji || '💵',
    amount: 250_000,
    unitLabel: cashMeta?.unitLabel || 'Rp',
    rewardMode: 'fixed',
  };
};

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RedeemPanelErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Terjadi kendala saat memuat data Kode Redeem.',
    };
  }

  componentDidCatch(error: Error) {
    console.error('[AdminRedeemCodePanel] Caught render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-3xl bg-rose-950/50 border border-rose-500/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center mx-auto text-rose-300">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-white">
            Panel Kode Redeem Mengalami Gangguan Tampilan
          </h3>
          <p className="text-xs text-rose-200 max-w-md mx-auto leading-relaxed">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, errorMessage: '' })}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer inline-flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Muat Ulang Panel Kode Redeem</span>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const AdminRedeemCodePanelInner: React.FC = () => {
  const {
    redeemCodes,
    createRedeemCode,
    deleteRedeemCode,
    toggleRedeemCodeActive,
    devRoles,
  } = useBank();

  const safeDevRoles = useMemo(() => (Array.isArray(devRoles) ? devRoles : []), [devRoles]);
  const safeRedeemCodes = useMemo(() => sanitizeRedeemCodesList(redeemCodes), [redeemCodes]);

  // Creator Form State
  const [codeStr, setCodeStr] = useState<string>('NUSANTARA250K');
  const [title, setTitle] = useState<string>('Promo Spesial Nasabah Bank Nusantara');
  const [description, setDescription] = useState<string>('');
  const [maxClaims, setMaxClaims] = useState<number>(10);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [requireAdminPin, setRequireAdminPin] = useState<boolean>(false);
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  const [selectedRewards, setSelectedRewards] = useState<AdminGiftRewardItem[]>(() => [
    createDefaultCashReward(),
  ]);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Reward Catalog Filters
  const [rewardCatFilter, setRewardCatFilter] = useState<string>('Semua');
  const [rewardSearch, setRewardSearch] = useState<string>('');

  // Registered Codes Management Filters
  const [codeSearch, setCodeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | RedeemCodeStatus>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedClaimersMap, setExpandedClaimersMap] = useState<Record<string, boolean>>({});

  const categories = useMemo(
    () => [
      'Semua',
      'Hadiah Role',
      'Uang & Koin',
      'Karir & Level',
      'Emas & Tabungan',
      'VIP & Proteksi',
      'Hadiah Trial',
    ],
    []
  );

  const visibleCatalog = useMemo(() => {
    const q = rewardSearch.trim().toLowerCase();
    return GIFT_REWARD_CATALOG.filter((meta) => {
      const matchesCat = rewardCatFilter === 'Semua' || meta.category === rewardCatFilter;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        meta.label.toLowerCase().includes(q) ||
        meta.description.toLowerCase().includes(q) ||
        meta.category.toLowerCase().includes(q) ||
        (meta.subOptions || []).some((sub) => sub.label.toLowerCase().includes(q))
      );
    });
  }, [rewardCatFilter, rewardSearch]);

  const buildRewardItemFromMeta = (
    meta: (typeof GIFT_REWARD_CATALOG)[number]
  ): AdminGiftRewardItem => {
    const firstSub = meta.subOptions?.[0];
    return {
      id: `rdm-rw-${meta.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: meta.type,
      label: meta.label,
      emoji: meta.emoji || '🎁',
      amount: firstSub?.defaultAmountOverride ?? meta.defaultAmount,
      unitLabel: firstSub?.unitLabelOverride ?? meta.unitLabel,
      rewardMode: 'fixed',
      selectedSubOptionId: firstSub?.id,
      selectedSubOptionLabel: firstSub?.label,
      trialDurationMinutes: firstSub?.defaultTrialMinutesOverride ?? meta.defaultTrialMinutes,
      targetDevRoleId:
        meta.type === 'role_grant_permanent' || meta.type === 'role_grant_trial'
          ? safeDevRoles[0]?.id || 'dev_1'
          : undefined,
    };
  };

  const toggleRewardType = (type: GiftRewardType) => {
    setSelectedRewards((prev) => {
      if (prev.some((r) => r.type === type)) {
        return prev.filter((r) => r.type !== type);
      }
      const meta = GIFT_REWARD_CATALOG.find((m) => m.type === type);
      if (!meta) return prev;
      return [...prev, buildRewardItemFromMeta(meta)];
    });
  };

  const updateRewardItem = (type: GiftRewardType, patch: Partial<AdminGiftRewardItem>) => {
    setSelectedRewards((prev) =>
      prev.map((item) => (item.type === type ? { ...item, ...patch } : item))
    );
  };

  const handleSelectAllCatalog = () => {
    setSelectedRewards(GIFT_REWARD_CATALOG.map((meta) => buildRewardItemFromMeta(meta)));
  };

  const generateRandomCode = () => {
    const prefixes = ['NUSANTARA', 'BERKAH', 'REZEKI', 'BONUS', 'SULTAN', 'EMAS', 'TRIAL'];
    const p = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    setCodeStr(`${p}${num}`);
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRewards.length === 0) {
      setFeedback({
        type: 'error',
        text: 'Pilih minimal 1 hadiah (atau hadiah Trial) dari Katalog Hadiah di sebelah kanan sebelum menerbitkan kode.',
      });
      return;
    }

    const cashReward = selectedRewards.find((r) => r.type === 'cash_balance');
    const res = createRedeemCode({
      code: codeStr,
      title,
      description: description.trim() || undefined,
      rewardAmount: cashReward ? Math.max(0, Number(cashReward.amount) || 0) : 0,
      rewards: selectedRewards,
      maxClaims,
      durationMinutes,
      requireAdminPin,
      sendNotification,
    });

    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });

    if (res.success) {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setCodeStr(`NUSANTARA${randomSuffix}`);
    }
  };

  const statusCounts = useMemo(() => {
    const nowMs = Date.now();
    const counts: Record<'all' | RedeemCodeStatus, number> = {
      all: safeRedeemCodes.length,
      active: 0,
      quota_full: 0,
      expired: 0,
      inactive: 0,
    };
    for (const rdm of safeRedeemCodes) {
      const st = getRedeemCodeStatus(rdm, nowMs);
      counts[st] += 1;
    }
    return counts;
  }, [safeRedeemCodes]);

  const filteredRedeemCodes = useMemo(() => {
    const nowMs = Date.now();
    const q = codeSearch.trim().toLowerCase();
    return safeRedeemCodes.filter((rdm) => {
      const st = getRedeemCodeStatus(rdm, nowMs);
      if (statusFilter !== 'all' && st !== statusFilter) return false;
      if (!q) return true;
      const matchesCode = rdm.code.toLowerCase().includes(q);
      const matchesTitle = rdm.title.toLowerCase().includes(q);
      const matchesDesc = (rdm.description || '').toLowerCase().includes(q);
      const matchesReward = summarizeRedeemCodeRewards(rdm).toLowerCase().includes(q);
      const matchesClaimer = rdm.claimedBy.some(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.accountNumber.toLowerCase().includes(q) ||
          (c.referenceNo || '').toLowerCase().includes(q)
      );
      return matchesCode || matchesTitle || matchesDesc || matchesReward || matchesClaimer;
    });
  }, [safeRedeemCodes, codeSearch, statusFilter]);

  const selectedTrialCount = useMemo(
    () =>
      selectedRewards.filter((item) => {
        const meta = GIFT_REWARD_CATALOG.find((m) => m.type === item.type);
        const sub = meta?.subOptions?.find((s) => s.id === item.selectedSubOptionId);
        return Boolean(meta?.isTrial || sub?.isTrialVariant);
      }).length,
    [selectedRewards]
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Row 1: Creator Settings (5 cols) + Full Surat & Hadiah Reward Catalog Picker (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Form Buat Kode Redeem Baru */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-white text-base">Buat Kode Redeem Baru</h3>
              <p className="text-[11px] text-slate-400">
                Mendukung seluruh {GIFT_REWARD_CATALOG.length} jenis hadiah &amp; fitur Trial seperti
                tab Surat &amp; Hadiah.
              </p>
            </div>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-xl border font-semibold flex items-start justify-between gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
                  : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <span>{feedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Kode Redeem Unik:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={codeStr}
                  onChange={(e) => setCodeStr(e.target.value.toUpperCase())}
                  placeholder="Contoh: NUSANTARA2026"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold uppercase tracking-wider"
                />
                <button
                  type="button"
                  onClick={generateRandomCode}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer whitespace-nowrap"
                >
                  Acak
                </button>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">
                Judul / Nama Event Kode Redeem:
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Giveaway Saldo & Trial VIP Akhir Pekan"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white"
              />
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">
                Catatan / Keterangan Tambahan (Opsional):
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Khusus nasabah aktif event spesial bulan ini..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-200 leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Kuota Maksimal Klaim:</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100000}
                  value={maxClaims}
                  onChange={(e) => setMaxClaims(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono tabular-nums font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Jumlah nasabah maksimal yang bisa klaim
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Durasi Aktif (Menit):</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={durationMinutes}
                  onChange={(e) =>
                    setDurationMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-cyan-300 font-mono tabular-nums font-bold"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Masa aktif kode: {formatTrialDurationLabel(durationMinutes)}
                </span>
              </div>
            </div>

            {/* Quick Duration Buttons */}
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { label: '5m', mins: 5 },
                { label: '30m', mins: 30 },
                { label: '1 Jam', mins: 60 },
                { label: '24 Jam', mins: 1440 },
                { label: '7 Hari', mins: 10080 },
              ].map((d) => (
                <button
                  key={d.mins}
                  type="button"
                  onClick={() => setDurationMinutes(d.mins)}
                  className={`py-1.5 rounded-lg font-bold text-[10px] cursor-pointer border ${
                    durationMinutes === d.mins
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Ringkasan Hadiah Terpilih */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paket Hadiah Terpilih ({selectedRewards.length})</span>
                </span>
                {selectedTrialCount > 0 && (
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-[10px] font-bold">
                    {selectedTrialCount} Trial
                  </span>
                )}
              </div>
              {selectedRewards.length === 0 ? (
                <p className="text-[10px] text-rose-300">
                  Belum ada hadiah dipilih. Klik tombol &quot;+ Pilih&quot; pada Katalog Hadiah di
                  kanan.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-0.5">
                  {selectedRewards.map((item) => (
                    <span
                      key={item.type}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-slate-200 font-semibold"
                    >
                      <span className="truncate max-w-[190px]">
                        {formatSingleRewardSummary(item)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRewardType(item.type)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus hadiah ini"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wajibkan PIN Admin saat Klaim?</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Jika aktif, nasabah harus memasukkan PIN Admin saat menukar kode ini.
                </span>
              </div>
              <input
                type="checkbox"
                checked={requireAdminPin}
                onChange={(e) => setRequireAdminPin(e.target.checked)}
                className="w-4 h-4 accent-amber-400 cursor-pointer shrink-0"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-indigo-500/40 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold text-white flex items-center gap-1.5">
                  {sendNotification ? (
                    <BellRing className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <BellOff className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <span>Kirim Notifikasi Saat Kode Dibuat?</span>
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {sendNotification
                    ? 'Kirim notifikasi pengumuman event ke seluruh perangkat nasabah (kode tetap rahasia).'
                    : 'Tanpa Notifikasi: Kode diterbitkan secara senyap.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSendNotification((prev) => !prev)}
                className={`px-3 py-1.5 rounded-xl font-black text-[11px] cursor-pointer whitespace-nowrap shrink-0 transition-all ${
                  sendNotification
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/60'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {sendNotification ? 'Ada Notif' : 'Tanpa Notif'}
              </button>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Terbitkan Kode Redeem ({selectedRewards.length} Hadiah)</span>
            </button>
          </form>
        </div>

        {/* Right: Full Surat & Hadiah Reward Multi-Builder (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  Pilih &amp; Atur Hadiah Kode Redeem ({selectedRewards.length} /{' '}
                  {GIFT_REWARD_CATALOG.length})
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Katalog identik dengan tab <strong>Surat &amp; Hadiah</strong>: lengkap dengan{' '}
                <strong>Sub-Pilihan Varian</strong>, <strong>Role Permanen/Trial</strong>,{' '}
                <strong>Mode Gacha</strong>, dan <strong>Durasi Trial</strong>.
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleSelectAllCatalog}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold cursor-pointer whitespace-nowrap"
              >
                Pilih Semua ({GIFT_REWARD_CATALOG.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRewards([createDefaultCashReward()])}
                className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 font-bold cursor-pointer whitespace-nowrap"
              >
                Reset ke Saldo
              </button>
              <button
                type="button"
                onClick={() => setSelectedRewards([])}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer whitespace-nowrap"
              >
                Kosongkan
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRewardCatFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer whitespace-nowrap shrink-0 ${
                    rewardCatFilter === cat
                      ? cat === 'Hadiah Trial'
                        ? 'bg-cyan-400 text-slate-950 font-black'
                        : 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-52 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rewardSearch}
                onChange={(e) => setRewardSearch(e.target.value)}
                placeholder={`Cari ${GIFT_REWARD_CATALOG.length} hadiah & trial...`}
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {visibleCatalog.map((meta) => {
              const selectedItem = selectedRewards.find((r) => r.type === meta.type);
              const isSelected = Boolean(selectedItem);
              const activeSub =
                meta.subOptions?.find((s) => s.id === selectedItem?.selectedSubOptionId) ||
                meta.subOptions?.[0];
              const effectiveIsTrial = Boolean(meta.isTrial || activeSub?.isTrialVariant);
              const effectiveUnitLabel =
                selectedItem?.unitLabel || activeSub?.unitLabelOverride || meta.unitLabel;
              const effectiveStep = activeSub?.stepOverride || meta.step;
              const isSingleChoiceTierCard =
                meta.type === 'upgrade_card_tier' || meta.type === 'trial_card_tier_selector';
              const trialDecoded = minutesToAmountAndUnit(
                selectedItem?.trialDurationMinutes ||
                  activeSub?.defaultTrialMinutesOverride ||
                  meta.defaultTrialMinutes
              );

              return (
                <div
                  key={meta.type}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isSelected
                      ? meta.isRoleGrant
                        ? 'bg-amber-950/45 border-amber-400/80'
                        : effectiveIsTrial
                        ? 'bg-cyan-950/40 border-cyan-400/70'
                        : 'bg-amber-950/40 border-amber-400/70'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => toggleRewardType(meta.type)}
                      className="flex items-start gap-2.5 text-left cursor-pointer flex-1 min-w-0"
                    >
                      <span className="text-xl shrink-0">{meta.emoji}</span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-white text-xs truncate">
                            {meta.label}
                          </span>
                          {meta.subOptions && meta.subOptions.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black">
                              {meta.subOptions.length} PILIHAN
                            </span>
                          )}
                          {meta.isRoleGrant && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black">
                              ROLE
                            </span>
                          )}
                          {meta.isTrial && (
                            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[9px] font-black">
                              TRIAL
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block leading-snug">
                          {meta.description}
                        </span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleRewardType(meta.type)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer shrink-0 ${
                        isSelected
                          ? 'bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? '✓ Dipilih' : '+ Pilih'}
                    </button>
                  </div>

                  {selectedItem && (
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
                      {/* Sub-Options Picker */}
                      {meta.subOptions && meta.subOptions.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-400/40 space-y-2">
                          <span className="text-[10px] font-black text-emerald-300 block">
                            {meta.subOptionsPrompt || 'Pilih Varian Hadiah di Dalamnya:'}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {meta.subOptions.map((sub) => {
                              const isSubActive =
                                (selectedItem.selectedSubOptionId || meta.subOptions?.[0]?.id) ===
                                sub.id;
                              return (
                                <button
                                  key={sub.id}
                                  type="button"
                                  onClick={() =>
                                    updateRewardItem(meta.type, {
                                      selectedSubOptionId: sub.id,
                                      selectedSubOptionLabel: sub.label,
                                      unitLabel: sub.unitLabelOverride ?? meta.unitLabel,
                                      amount: sub.defaultAmountOverride ?? selectedItem.amount,
                                      trialDurationMinutes:
                                        sub.defaultTrialMinutesOverride ??
                                        selectedItem.trialDurationMinutes ??
                                        meta.defaultTrialMinutes,
                                    })
                                  }
                                  className={`p-2 rounded-lg border text-left transition cursor-pointer flex items-center gap-2 ${
                                    isSubActive
                                      ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black shadow'
                                      : 'bg-slate-900 text-slate-200 border-slate-800 hover:border-slate-600'
                                  }`}
                                >
                                  {sub.emoji && <span className="text-sm shrink-0">{sub.emoji}</span>}
                                  <div className="min-w-0">
                                    <span className="text-[10px] font-bold block truncate">
                                      {sub.label}
                                    </span>
                                    {sub.description && (
                                      <span
                                        className={`text-[9px] block truncate ${
                                          isSubActive ? 'text-slate-800' : 'text-slate-400'
                                        }`}
                                      >
                                        {sub.description}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Role Selector */}
                      {(meta.type === 'role_grant_permanent' ||
                        meta.type === 'role_grant_trial') && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 shrink-0">
                            <Crown className="w-3.5 h-3.5" />
                            <span>Pilih Role Hadiah:</span>
                          </span>
                          <select
                            value={selectedItem.targetDevRoleId || safeDevRoles[0]?.id || 'dev_1'}
                            onChange={(e) =>
                              updateRewardItem(meta.type, { targetDevRoleId: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-400/50 text-amber-200 font-bold text-xs"
                          >
                            {safeDevRoles.map((r) => (
                              <option key={r.id} value={r.id}>
                                #{r.slotNumber} • {r.name} (
                                {r.canQuickOpenAdmin
                                  ? r.bypassAdminPin
                                    ? 'Tombol Cepat Bebas PIN'
                                    : 'Tombol Cepat Wajib PIN'
                                  : 'Hanya Badge'}
                                )
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Fixed vs Gacha Switch */}
                      {!meta.isRoleGrant && !isSingleChoiceTierCard && (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => updateRewardItem(meta.type, { rewardMode: 'fixed' })}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer ${
                                (selectedItem.rewardMode || 'fixed') === 'fixed'
                                  ? 'bg-emerald-400 text-slate-950 font-black'
                                  : 'bg-slate-900 text-slate-300 border border-slate-700'
                              }`}
                            >
                              Nominal Pasti
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateRewardItem(meta.type, {
                                  rewardMode: 'gacha',
                                  gachaTiers:
                                    selectedItem.gachaTiers && selectedItem.gachaTiers.length > 0
                                      ? selectedItem.gachaTiers
                                      : buildDefaultGachaTiersForReward(meta, 'balanced'),
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                                selectedItem.rewardMode === 'gacha'
                                  ? 'bg-fuchsia-400 text-slate-950 font-black'
                                  : 'bg-slate-900 text-fuchsia-300 border border-fuchsia-500/40'
                              }`}
                            >
                              <Dices className="w-3 h-3" />
                              <span>Mode Gacha (Min–Max %)</span>
                            </button>
                          </div>

                          {(selectedItem.rewardMode || 'fixed') === 'fixed' && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-amber-300 font-bold">Jumlah:</span>
                              <input
                                type="number"
                                min={1}
                                step={effectiveStep}
                                value={selectedItem.amount}
                                onChange={(e) =>
                                  updateRewardItem(meta.type, {
                                    amount: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className="w-28 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold text-xs tabular-nums"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">
                                {effectiveUnitLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Trial Duration Controls */}
                      {effectiveIsTrial && (
                        <div className="flex flex-wrap items-center gap-2 p-2 rounded-xl bg-slate-950/90 border border-cyan-500/30">
                          <span className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Durasi Trial:</span>
                          </span>
                          <input
                            type="number"
                            min={1}
                            value={trialDecoded.val}
                            onChange={(e) => {
                              const n = Math.max(1, Number(e.target.value) || 1);
                              const mult =
                                trialDecoded.unit === 'days'
                                  ? 1440
                                  : trialDecoded.unit === 'hours'
                                  ? 60
                                  : 1;
                              updateRewardItem(meta.type, { trialDurationMinutes: n * mult });
                            }}
                            className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs tabular-nums"
                          />
                          <select
                            value={trialDecoded.unit}
                            onChange={(e) => {
                              const nextUnit = e.target.value as 'minutes' | 'hours' | 'days';
                              const mult =
                                nextUnit === 'days' ? 1440 : nextUnit === 'hours' ? 60 : 1;
                              updateRewardItem(meta.type, {
                                trialDurationMinutes: trialDecoded.val * mult,
                              });
                            }}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                          >
                            <option value="minutes">Menit</option>
                            <option value="hours">Jam</option>
                            <option value="days">Hari</option>
                          </select>
                          <span className="text-[10px] font-mono text-slate-400">
                            (Berakhir dalam{' '}
                            {formatTrialDurationLabel(
                              selectedItem.trialDurationMinutes ||
                                activeSub?.defaultTrialMinutesOverride ||
                                meta.defaultTrialMinutes
                            )}
                            )
                          </span>
                        </div>
                      )}

                      {/* Inline Multi-Tier Gacha Builder */}
                      {!meta.isRoleGrant &&
                        !isSingleChoiceTierCard &&
                        selectedItem.rewardMode === 'gacha' &&
                        selectedItem.gachaTiers && (
                          <GachaTierBuilder
                            compact
                            tiers={selectedItem.gachaTiers}
                            onChange={(nextTiers) =>
                              updateRewardItem(meta.type, { gachaTiers: nextTiers })
                            }
                            unitLabel={effectiveUnitLabel}
                            isCurrency={isCurrencyRewardType(meta.type)}
                            step={effectiveStep}
                            metaForPreset={meta}
                          />
                        )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Daftar Kode Redeem Terdaftar (Search, Status Filter, Claimer Details) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="font-black text-white text-base">
              Daftar Kode Redeem Terdaftar ({safeRedeemCodes.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Cari kode, saring status aktif/habis/kadaluarsa, serta pantau rincian hadiah &amp;
              daftar pengklaim secara real-time. Data kode lama diperbaiki otomatis jika struktur
              belum lengkap.
            </p>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={codeSearch}
              onChange={(e) => setCodeSearch(e.target.value)}
              placeholder="Cari kode, judul, hadiah, atau pengklaim..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { key: 'all', label: 'Semua', activeCls: 'bg-amber-400 text-slate-950 border-amber-300' },
              { key: 'active', label: 'Aktif', activeCls: 'bg-emerald-400 text-slate-950 border-emerald-300' },
              { key: 'quota_full', label: 'Habis Kuota', activeCls: 'bg-orange-400 text-slate-950 border-orange-300' },
              { key: 'expired', label: 'Kadaluarsa', activeCls: 'bg-rose-500 text-white border-rose-400' },
              { key: 'inactive', label: 'Nonaktif', activeCls: 'bg-slate-600 text-white border-slate-500' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer font-mono tabular-nums ${
                statusFilter === tab.key
                  ? tab.activeCls
                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
              }`}
            >
              {tab.label} ({statusCounts[tab.key]})
            </button>
          ))}
        </div>

        {filteredRedeemCodes.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-1.5">
            <Gift className="w-7 h-7 text-slate-500 mx-auto" />
            <p className="font-bold text-slate-200 text-sm">
              Tidak ada kode redeem yang cocok dengan filter saat ini.
            </p>
            <p className="text-[11px] text-slate-400">
              Coba ubah kata kunci pencarian atau pilih tab status &quot;Semua&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredRedeemCodes.map((rdm) => {
              const status = getRedeemCodeStatus(rdm);
              const isClaimersOpen = Boolean(expandedClaimersMap[rdm.id]);
              const claimCount = rdm.claimedBy.length;
              const quotaPct = Math.min(100, Math.round((claimCount / Math.max(1, rdm.maxClaims)) * 100));
              const expiresDate = new Date(rdm.expiresAt);
              const expiresLabel = Number.isNaN(expiresDate.getTime())
                ? '-'
                : expiresDate.toLocaleString('id-ID');

              const statusBadge =
                status === 'active'
                  ? {
                      text: 'Aktif',
                      cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                    }
                  : status === 'quota_full'
                  ? {
                      text: 'Habis Kuota',
                      cls: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                    }
                  : status === 'expired'
                  ? {
                      text: 'Kadaluarsa',
                      cls: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                    }
                  : {
                      text: 'Nonaktif',
                      cls: 'bg-slate-800 text-slate-300 border-slate-700',
                    };

              return (
                <div
                  key={rdm.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                >
                  {/* Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-900 pb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 font-mono font-black text-amber-300 text-sm tracking-wider shrink-0">
                        {rdm.code}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(rdm.code)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer shrink-0"
                        title="Salin Kode"
                      >
                        {copiedCode === rdm.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <div className="min-w-0">
                        <h4 className="font-bold text-white text-xs sm:text-sm break-words">
                          {rdm.title}
                        </h4>
                        {rdm.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {rdm.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      {rdm.requireAdminPin && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-400/40 inline-flex items-center gap-1 whitespace-nowrap">
                          <Lock className="w-3 h-3" />
                          <span>Wajib PIN</span>
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 whitespace-nowrap border ${
                          rdm.sendNotification !== false
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40'
                            : 'bg-slate-900 text-slate-400 border-slate-700'
                        }`}
                      >
                        {rdm.sendNotification !== false ? (
                          <>
                            <BellRing className="w-3 h-3" />
                            <span>Ada Notif</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="w-3 h-3" />
                            <span>Tanpa Notif</span>
                          </>
                        )}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border whitespace-nowrap ${statusBadge.cls}`}
                      >
                        {statusBadge.text}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleRedeemCodeActive(rdm.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer"
                      >
                        {rdm.active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteRedeemCode(rdm.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                        title="Hapus Kode Redeem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Reward Items List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Isi Hadiah ({rdm.rewards?.length || 1} Item):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {(rdm.rewards && rdm.rewards.length > 0
                        ? rdm.rewards
                        : ([
                            {
                              id: `${rdm.id}-fallback-cash`,
                              type: 'cash_balance',
                              label: 'Saldo Tunai',
                              emoji: '💵',
                              amount: rdm.rewardAmount,
                              unitLabel: 'Rp',
                              rewardMode: 'fixed',
                            },
                          ] as AdminGiftRewardItem[])
                      ).map((rw, idx) => {
                        const meta = GIFT_REWARD_CATALOG.find((m) => m.type === rw.type);
                        const isTrial = Boolean(
                          meta?.isTrial ||
                            meta?.subOptions?.find((s) => s.id === rw.selectedSubOptionId)
                              ?.isTrialVariant
                        );
                        return (
                          <span
                            key={`${rdm.id}-rw-${idx}`}
                            className={`px-2.5 py-1 rounded-lg border text-[10px] font-semibold ${
                              isTrial
                                ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-200'
                                : rw.rewardMode === 'gacha'
                                ? 'bg-fuchsia-950/50 border-fuchsia-500/40 text-fuchsia-200'
                                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                            }`}
                          >
                            {meta?.emoji ? `${meta.emoji} ` : ''}
                            {formatSingleRewardSummary(rw)}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quota, Duration, Expiry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-900/70 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block">Kuota Klaim:</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <strong className="font-mono tabular-nums text-white">
                          {claimCount} / {rdm.maxClaims} Orang
                        </strong>
                        <span className="text-[10px] font-mono tabular-nums text-slate-400">
                          {quotaPct}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${
                            quotaPct >= 100 ? 'bg-orange-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${quotaPct}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Durasi Aktif:</span>
                      <strong className="font-mono tabular-nums text-cyan-300">
                        {formatTrialDurationLabel(rdm.durationMinutes)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Berlaku Sampai:</span>
                      <strong className="font-mono tabular-nums text-amber-300">
                        {expiresLabel}
                      </strong>
                    </div>
                  </div>

                  {/* Claimers Info Section */}
                  <div className="border-t border-slate-900 pt-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedClaimersMap((prev) => ({
                          ...prev,
                          [rdm.id]: !prev[rdm.id],
                        }))
                      }
                      className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 cursor-pointer transition-colors"
                    >
                      <span className="text-[11px] font-bold text-slate-200 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-amber-400" />
                        <span>Info Pengklaim ({claimCount} Nasabah)</span>
                      </span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>{isClaimersOpen ? 'Sembunyikan' : 'Lihat Detail'}</span>
                        {isClaimersOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </span>
                    </button>

                    {isClaimersOpen && (
                      <div className="mt-2 space-y-1.5">
                        {claimCount === 0 ? (
                          <p className="text-[11px] text-slate-500 px-3 py-2">
                            Belum ada nasabah yang menukar kode ini.
                          </p>
                        ) : (
                          rdm.claimedBy.map((c, idx) => {
                            const cDate = new Date(c.claimedAt);
                            const cTime = Number.isNaN(cDate.getTime())
                              ? '-'
                              : cDate.toLocaleString('id-ID');
                            return (
                              <div
                                key={`${rdm.id}-claim-${c.accountId}-${idx}`}
                                className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-bold text-white text-xs">
                                      {c.fullName}
                                    </span>
                                    <span className="font-mono tabular-nums text-[10px] text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
                                      Rek: {c.accountNumber}
                                    </span>
                                    {c.referenceNo && (
                                      <span className="font-mono text-[10px] text-slate-400">
                                        {c.referenceNo}
                                      </span>
                                    )}
                                  </div>
                                  {c.rewardsGranted && c.rewardsGranted.length > 0 ? (
                                    <p className="text-[10px] text-emerald-300 mt-0.5 leading-relaxed">
                                      Diterima: {c.rewardsGranted.join(' · ')}
                                    </p>
                                  ) : c.rewardSummary ? (
                                    <p className="text-[10px] text-emerald-300 mt-0.5">
                                      Diterima: {c.rewardSummary}
                                    </p>
                                  ) : null}
                                </div>
                                <span className="text-[10px] font-mono tabular-nums text-slate-400 shrink-0">
                                  {cTime}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export const AdminRedeemCodePanel: React.FC = () => (
  <RedeemPanelErrorBoundary>
    <AdminRedeemCodePanelInner />
  </RedeemPanelErrorBoundary>
);
