import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  Cloud,
  Edit3,
  Files,
  CalendarPlus,
  Infinity as InfinityIcon,
  Wand2,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { GIFT_REWARD_CATALOG, formatTrialDurationLabel } from '../data/giftRewardsCatalog';
import { AdminGiftRewardItem, GiftRewardType, RedeemCode } from '../types/bank';
import { buildDefaultGachaTiersForReward } from '../utils/gachaUtils';
import { GachaTierBuilder } from './GachaTierBuilder';
import {
  formatSingleRewardSummary,
  generateUniqueRedeemCode,
  getRedeemCodeStatus,
  sanitizeRedeemCodesList,
  summarizeRedeemCodeRewards,
} from '../utils/redeemSanitizer';

type RedeemCodeStatus = ReturnType<typeof getRedeemCodeStatus>;
type DurationUnit = 'minutes' | 'hours' | 'days';

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

const minutesToAmountAndUnit = (minutes?: number): { val: number; unit: DurationUnit } => {
  const m = Math.max(1, Number(minutes) || 60);
  if (m >= 1440 && m % 1440 === 0) return { val: m / 1440, unit: 'days' };
  if (m >= 60 && m % 60 === 0) return { val: m / 60, unit: 'hours' };
  return { val: m, unit: 'minutes' };
};

const unitToMinutesMultiplier = (unit: DurationUnit): number =>
  unit === 'days' ? 1440 : unit === 'hours' ? 60 : 1;

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

interface FeedbackState {
  type: 'success' | 'error';
  text: string;
  isDuplicate?: boolean;
  createdCode?: string;
}

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
    redeemCloudStatus,
    redeemLastSavedAt,
    redeemSaveError,
    retrySaveRedeemCodesToCloud,
    createRedeemCode,
    updateRedeemCode,
    duplicateRedeemCode,
    extendRedeemCode,
    deleteRedeemCode,
    toggleRedeemCodeActive,
    devRoles,
  } = useBank();

  const safeDevRoles = useMemo(() => (Array.isArray(devRoles) ? devRoles : []), [devRoles]);
  const safeRedeemCodes = useMemo(() => sanitizeRedeemCodesList(redeemCodes), [redeemCodes]);

  const builderTopRef = useRef<HTMLDivElement | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Mode Edit vs Buat Baru
  const [editingRedeemId, setEditingRedeemId] = useState<string | null>(null);

  // Creator Form State (selalu otomatis kode acak unik saat tab dibuka, input angka pakai string agar bebas ketik di HP/Laptop)
  const [codeStr, setCodeStr] = useState<string>(() => generateUniqueRedeemCode(safeRedeemCodes));
  const [title, setTitle] = useState<string>('Promo Spesial Nasabah Bank Nusantara');
  const [description, setDescription] = useState<string>('');
  const [maxClaimsText, setMaxClaimsText] = useState<string>('10');
  const [unlimitedClaims, setUnlimitedClaims] = useState<boolean>(false);
  const [durationValueText, setDurationValueText] = useState<string>('1');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('hours');
  const [unlimitedDuration, setUnlimitedDuration] = useState<boolean>(false);
  const [requireAdminPin, setRequireAdminPin] = useState<boolean>(false);
  const [sendNotification, setSendNotification] = useState<boolean>(true);
  const [selectedRewards, setSelectedRewards] = useState<AdminGiftRewardItem[]>(() => [
    createDefaultCashReward(),
  ]);

  // Inline feedback (dekat tombol Terbitkan) + Floating Toast
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [floatingToast, setFloatingToast] = useState<FeedbackState | null>(null);
  const [isRetryingCloud, setIsRetryingCloud] = useState<boolean>(false);

  // Reward Catalog Filters
  const [rewardCatFilter, setRewardCatFilter] = useState<string>('Semua');
  const [rewardSearch, setRewardSearch] = useState<string>('');

  // Registered Codes Management Filters
  const [codeSearch, setCodeSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | RedeemCodeStatus>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [expandedClaimersMap, setExpandedClaimersMap] = useState<Record<string, boolean>>({});

  // Extend Panel State per code card
  const [extendingCodeId, setExtendingCodeId] = useState<string | null>(null);
  const [extendValueText, setExtendValueText] = useState<string>('1');
  const [extendUnit, setExtendUnit] = useState<DurationUnit>('hours');
  const [extendExtraClaimsText, setExtendExtraClaimsText] = useState<string>('');

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showDualFeedback = (next: FeedbackState) => {
    setFeedback(next);
    setFloatingToast(next);
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setFloatingToast(null);
    }, 6000);
  };

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
    const item: AdminGiftRewardItem = {
      id: `rdm-rw-${meta.type}-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      type: meta.type,
      label: meta.label,
      emoji: meta.emoji || '🎁',
      amount: firstSub?.defaultAmountOverride ?? meta.defaultAmount,
      unitLabel: firstSub?.unitLabelOverride ?? meta.unitLabel,
      rewardMode: 'fixed',
    };
    if (firstSub?.id) item.selectedSubOptionId = firstSub.id;
    if (firstSub?.label) item.selectedSubOptionLabel = firstSub.label;
    const defaultTrial = firstSub?.defaultTrialMinutesOverride ?? meta.defaultTrialMinutes;
    if (defaultTrial && defaultTrial > 0) item.trialDurationMinutes = defaultTrial;
    if (meta.type === 'role_grant_permanent' || meta.type === 'role_grant_trial') {
      item.targetDevRoleId = safeDevRoles[0]?.id || 'dev_1';
    }
    return item;
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
    showDualFeedback({
      type: 'success',
      text: `Seluruh ${GIFT_REWARD_CATALOG.length} macam hadiah (termasuk semua Trial & Role) telah dipilih. Klik Terbitkan untuk membuat kode!`,
    });
  };

  const handleGenerateUniqueCode = (basePrefix?: string) => {
    const fresh = generateUniqueRedeemCode(safeRedeemCodes, basePrefix);
    setCodeStr(fresh);
    if (feedback?.isDuplicate) {
      setFeedback(null);
    }
  };

  const handleCopyCode = (code: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(code).catch(() => {});
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((prev) => (prev === code ? null : prev)), 2000);
  };

  const resetFormToCreateMode = (nextExistingList: RedeemCode[] = safeRedeemCodes) => {
    setEditingRedeemId(null);
    setCodeStr(generateUniqueRedeemCode(nextExistingList));
    setTitle('Promo Spesial Nasabah Bank Nusantara');
    setDescription('');
    setMaxClaimsText('10');
    setUnlimitedClaims(false);
    setDurationValueText('1');
    setDurationUnit('hours');
    setUnlimitedDuration(false);
    setRequireAdminPin(false);
    setSendNotification(true);
    setSelectedRewards([createDefaultCashReward()]);
  };

  const handleStartEditCode = (rdm: RedeemCode) => {
    setEditingRedeemId(rdm.id);
    setCodeStr(rdm.code);
    setTitle(rdm.title);
    setDescription(rdm.description || '');
    setUnlimitedClaims(Boolean(rdm.unlimitedClaims));
    setMaxClaimsText(String(rdm.unlimitedClaims ? 10 : Math.max(1, Number(rdm.maxClaims) || 1)));
    setUnlimitedDuration(Boolean(rdm.unlimitedDuration));
    const decodedDur = minutesToAmountAndUnit(rdm.durationMinutes);
    setDurationValueText(String(rdm.unlimitedDuration ? 1 : decodedDur.val));
    setDurationUnit(rdm.unlimitedDuration ? 'hours' : decodedDur.unit);
    setRequireAdminPin(Boolean(rdm.requireAdminPin));
    setSendNotification(rdm.sendNotification !== false);
    if (Array.isArray(rdm.rewards) && rdm.rewards.length > 0) {
      setSelectedRewards(rdm.rewards.map((item) => ({ ...item })));
    } else if (rdm.rewardAmount > 0) {
      const baseCash = createDefaultCashReward();
      setSelectedRewards([{ ...baseCash, amount: rdm.rewardAmount }]);
    } else {
      setSelectedRewards([createDefaultCashReward()]);
    }
    setFeedback(null);
    builderTopRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDuplicateClick = (rdm: RedeemCode) => {
    const res = duplicateRedeemCode(rdm.id);
    showDualFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
      createdCode: res.redeemCode?.code,
    });
  };

  const handleApplyExtend = (
    rdm: RedeemCode,
    opts: { extraMinutes?: number; setUnlimitedDuration?: boolean }
  ) => {
    const extraClaimsNum = parseInt(extendExtraClaimsText.trim(), 10);
    const res = extendRedeemCode(rdm.id, {
      ...opts,
      extraClaims: Number.isFinite(extraClaimsNum) && extraClaimsNum > 0 ? extraClaimsNum : undefined,
      reactivate: true,
    });
    showDualFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
      createdCode: res.redeemCode?.code,
    });
    if (res.success) {
      setExtendExtraClaimsText('');
      setExtendingCodeId(null);
    }
  };

  const computedDurationMinutes = useMemo(() => {
    if (unlimitedDuration) return 5256000;
    const rawNum = Number(durationValueText.replace(',', '.'));
    if (!Number.isFinite(rawNum) || rawNum <= 0) return 0;
    return Math.max(1, Math.round(rawNum * unitToMinutesMultiplier(durationUnit)));
  }, [durationValueText, durationUnit, unlimitedDuration]);

  const parsedMaxClaims = useMemo(() => {
    if (unlimitedClaims) return 999999999;
    const n = parseInt(maxClaimsText.trim(), 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [maxClaimsText, unlimitedClaims]);

  const isCodeCurrentlyDuplicate = useMemo(() => {
    const clean = codeStr.trim().toLowerCase();
    if (!clean) return false;
    return safeRedeemCodes.some(
      (r) => r.id !== editingRedeemId && r.code.trim().toLowerCase() === clean
    );
  }, [codeStr, safeRedeemCodes, editingRedeemId]);

  const executePublishOrUpdate = () => {
    const cleanCode = codeStr.trim();
    if (!cleanCode) {
      showDualFeedback({
        type: 'error',
        text: 'Kolom Kode Redeem masih kosong. Ketik kode bebas apa saja atau klik tombol Acak.',
      });
      return;
    }

    if (isCodeCurrentlyDuplicate) {
      showDualFeedback({
        type: 'error',
        isDuplicate: true,
        text: `Kode "${cleanCode}" sudah pernah dipakai. Ubah kodenya atau klik "Buat Kode Unik Otomatis".`,
      });
      return;
    }

    if (selectedRewards.length === 0) {
      showDualFeedback({
        type: 'error',
        text: 'Belum ada hadiah yang dipilih. Pilih minimal 1 hadiah (atau Trial) dari Katalog Hadiah di kanan.',
      });
      return;
    }

    if (!unlimitedClaims && parsedMaxClaims <= 0) {
      showDualFeedback({
        type: 'error',
        text: 'Isi Kuota Maksimal Klaim dengan angka minimal 1, atau aktifkan opsi Tanpa Batas.',
      });
      return;
    }

    if (!unlimitedDuration && computedDurationMinutes <= 0) {
      showDualFeedback({
        type: 'error',
        text: 'Isi Durasi Aktif dengan angka lebih dari 0, atau aktifkan opsi Tanpa Batas.',
      });
      return;
    }

    const cashReward = selectedRewards.find((r) => r.type === 'cash_balance');
    const payload = {
      code: cleanCode,
      title: title.trim() || `Event Kode ${cleanCode}`,
      description: description.trim() || undefined,
      rewardAmount: cashReward ? Math.max(0, Number(cashReward.amount) || 0) : 0,
      rewards: selectedRewards,
      maxClaims: parsedMaxClaims,
      unlimitedClaims,
      durationMinutes: computedDurationMinutes,
      unlimitedDuration,
      requireAdminPin,
      sendNotification,
    };

    if (editingRedeemId) {
      const res = updateRedeemCode(editingRedeemId, payload);
      showDualFeedback({
        type: res.success ? 'success' : 'error',
        isDuplicate: res.isDuplicate,
        text: res.message,
        createdCode: res.redeemCode?.code,
      });
      if (res.success) {
        const nextList = res.redeemCode
          ? safeRedeemCodes.map((r) => (r.id === editingRedeemId ? res.redeemCode! : r))
          : safeRedeemCodes;
        resetFormToCreateMode(nextList);
      }
      return;
    }

    const res = createRedeemCode(payload);
    showDualFeedback({
      type: res.success ? 'success' : 'error',
      isDuplicate: res.isDuplicate,
      text: res.message,
      createdCode: res.redeemCode?.code,
    });

    if (res.success) {
      const nextList = res.redeemCode ? [res.redeemCode, ...safeRedeemCodes] : safeRedeemCodes;
      setCodeStr(generateUniqueRedeemCode(nextList));
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    executePublishOrUpdate();
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

  const cloudStatusLabel = useMemo(() => {
    if (redeemCloudStatus === 'saving') return 'Menyimpan ke Cloud...';
    if (redeemCloudStatus === 'saved') {
      const timeStr = redeemLastSavedAt
        ? new Date(redeemLastSavedAt).toLocaleTimeString('id-ID')
        : '';
      return timeStr ? `Tersimpan di Cloud · ${timeStr}` : 'Tersimpan di Cloud';
    }
    if (redeemCloudStatus === 'error') {
      return redeemSaveError || 'Tersimpan Lokal (Cloud tertunda)';
    }
    return `Siap Sinkron Cloud · ${safeRedeemCodes.length} Kode`;
  }, [redeemCloudStatus, redeemLastSavedAt, redeemSaveError, safeRedeemCodes.length]);

  return (
    <div ref={builderTopRef} className="space-y-6 text-xs pb-24">
      {/* Floating Toast Notification */}
      {floatingToast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed top-20 right-4 left-4 sm:left-auto sm:w-[400px] z-[90] p-3.5 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start justify-between gap-3 ${
            floatingToast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-400/70 text-emerald-100'
              : 'bg-rose-950/95 border-rose-400/70 text-rose-100'
          }`}
        >
          <div className="flex items-start gap-2.5 min-w-0">
            {floatingToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 min-w-0">
              <p className="font-bold text-xs leading-relaxed break-words">{floatingToast.text}</p>
              {floatingToast.createdCode && (
                <button
                  type="button"
                  onClick={() => handleCopyCode(floatingToast.createdCode!)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-emerald-400/40 text-amber-300 font-mono font-bold text-[11px] cursor-pointer inline-flex items-center gap-1.5"
                >
                  {copiedCode === floatingToast.createdCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tersalin: {floatingToast.createdCode}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode: {floatingToast.createdCode}</span>
                    </>
                  )}
                </button>
              )}
              {floatingToast.isDuplicate && (
                <button
                  type="button"
                  onClick={() => handleGenerateUniqueCode(codeStr.slice(0, 10))}
                  className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] cursor-pointer inline-flex items-center gap-1"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>Buat Kode Unik Otomatis</span>
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setFloatingToast(null)}
            className="text-slate-300 hover:text-white cursor-pointer shrink-0 p-0.5"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cloud Persistence Status Bar */}
      <div className="px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Cloud
            className={`w-4 h-4 shrink-0 ${
              redeemCloudStatus === 'saved'
                ? 'text-emerald-400'
                : redeemCloudStatus === 'saving'
                ? 'text-amber-400 animate-pulse'
                : redeemCloudStatus === 'error'
                ? 'text-rose-400'
                : 'text-cyan-400'
            }`}
          />
          <span className="font-mono tabular-nums text-[11px] font-bold text-slate-200 truncate">
            {cloudStatusLabel}
          </span>
        </div>
        <button
          type="button"
          disabled={isRetryingCloud || redeemCloudStatus === 'saving'}
          onClick={async () => {
            setIsRetryingCloud(true);
            try {
              const ok = await retrySaveRedeemCodesToCloud();
              showDualFeedback({
                type: ok ? 'success' : 'error',
                text: ok
                  ? 'Seluruh daftar Kode Redeem berhasil disinkronkan ulang ke Cloud!'
                  : 'Sinkronisasi ke Cloud masih tertunda, data tetap aman di penyimpanan perangkat.',
              });
            } finally {
              setIsRetryingCloud(false);
            }
          }}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 border border-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetryingCloud ? 'animate-spin' : ''}`} />
          <span>{isRetryingCloud ? 'Menyimpan...' : 'Sinkron ke Cloud Sekarang'}</span>
        </button>
      </div>

      {/* Row 1: Creator Settings (5 cols) + Full Surat & Hadiah Reward Catalog Picker (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Form Buat / Edit Kode Redeem */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
                {editingRedeemId ? <Edit3 className="w-5 h-5" /> : <Gift className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-black text-white text-base">
                  {editingRedeemId ? 'Edit Kode Redeem' : 'Buat Kode Redeem Baru'}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {editingRedeemId
                    ? 'Ubah detail atau hadiah kode tanpa menghapus riwayat pengklaim.'
                    : `Mendukung seluruh ${GIFT_REWARD_CATALOG.length} hadiah, Trial, Role, Gacha & Pilih Semua.`}
                </p>
              </div>
            </div>
            {editingRedeemId && (
              <button
                type="button"
                onClick={() => resetFormToCreateMode(safeRedeemCodes)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[11px] cursor-pointer whitespace-nowrap shrink-0"
              >
                Batal Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmitForm} noValidate className="space-y-3.5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="text-slate-300 font-bold">Kode Redeem Unik:</label>
                <span className="text-[10px] text-slate-400">Bebas karakter, tanpa batas minimal</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={codeStr}
                  onChange={(e) => {
                    setCodeStr(e.target.value);
                    if (feedback?.isDuplicate) setFeedback(null);
                  }}
                  placeholder="Ketik kode apa saja..."
                  className={`flex-1 bg-slate-950 border rounded-xl p-2.5 font-mono font-bold tracking-wider ${
                    isCodeCurrentlyDuplicate
                      ? 'border-rose-500 text-rose-300'
                      : 'border-slate-700 text-amber-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleGenerateUniqueCode()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer whitespace-nowrap shrink-0"
                >
                  Acak Unik
                </button>
              </div>
              {isCodeCurrentlyDuplicate && (
                <div className="mt-1.5 p-2.5 rounded-xl bg-rose-950/70 border border-rose-500/50 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-200 font-semibold">
                    Kode &quot;{codeStr.trim()}&quot; sudah terdaftar.
                  </span>
                  <button
                    type="button"
                    onClick={() => handleGenerateUniqueCode(codeStr.trim().slice(0, 10))}
                    className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                  >
                    <Wand2 className="w-3 h-3" />
                    <span>Buat Kode Unik Otomatis</span>
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">
                Judul / Nama Event Kode Redeem:
              </label>
              <input
                type="text"
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

            {/* Kuota Klaim (Bebas ketik + Tanpa Batas) */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-slate-200 font-bold">Kuota Maksimal Klaim</label>
                <button
                  type="button"
                  onClick={() => setUnlimitedClaims((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border inline-flex items-center gap-1 whitespace-nowrap ${
                    unlimitedClaims
                      ? 'bg-emerald-400 text-slate-950 border-emerald-300'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <InfinityIcon className="w-3 h-3" />
                  <span>{unlimitedClaims ? 'Tanpa Batas Aktif' : 'Tanpa Batas'}</span>
                </button>
              </div>
              {unlimitedClaims ? (
                <div className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] font-bold">
                  ∞ Semua nasabah dapat menukarkan kode ini (1x per akun).
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={maxClaimsText}
                    onChange={(e) => setMaxClaimsText(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Contoh: 10"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono tabular-nums font-bold"
                  />
                  <span className="text-[11px] text-slate-400 font-semibold shrink-0">Orang</span>
                </div>
              )}
            </div>

            {/* Durasi Aktif (Bebas ketik + Menit/Jam/Hari + Tanpa Batas) */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-slate-200 font-bold">Masa Aktif Kode</label>
                <button
                  type="button"
                  onClick={() => setUnlimitedDuration((v) => !v)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border inline-flex items-center gap-1 whitespace-nowrap ${
                    unlimitedDuration
                      ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <InfinityIcon className="w-3 h-3" />
                  <span>{unlimitedDuration ? 'Tanpa Batas Aktif' : 'Tanpa Batas'}</span>
                </button>
              </div>

              {unlimitedDuration ? (
                <div className="px-3 py-2 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 font-mono text-[11px] font-bold">
                  ∞ Kode aktif selamanya sampai Admin menonaktifkannya.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={durationValueText}
                      onChange={(e) => setDurationValueText(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Contoh: 60"
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-cyan-300 font-mono tabular-nums font-bold"
                    />
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                      className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
                    >
                      <option value="minutes">Menit</option>
                      <option value="hours">Jam</option>
                      <option value="days">Hari</option>
                    </select>
                  </div>
                  <span className="text-[10px] text-slate-400 block font-mono tabular-nums">
                    Total durasi:{' '}
                    {computedDurationMinutes > 0
                      ? formatTrialDurationLabel(computedDurationMinutes)
                      : 'Masukkan angka > 0'}
                  </span>
                </>
              )}

              {/* Quick Duration Buttons */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { label: '5m', val: '5', unit: 'minutes' as DurationUnit, unlimited: false },
                  { label: '30m', val: '30', unit: 'minutes' as DurationUnit, unlimited: false },
                  { label: '1 Jam', val: '1', unit: 'hours' as DurationUnit, unlimited: false },
                  { label: '24 Jam', val: '1', unit: 'days' as DurationUnit, unlimited: false },
                  { label: '7 Hari', val: '7', unit: 'days' as DurationUnit, unlimited: false },
                  { label: '∞', val: '1', unit: 'days' as DurationUnit, unlimited: true },
                ].map((preset) => {
                  const isActivePreset = preset.unlimited
                    ? unlimitedDuration
                    : !unlimitedDuration &&
                      durationValueText === preset.val &&
                      durationUnit === preset.unit;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (preset.unlimited) {
                          setUnlimitedDuration(true);
                        } else {
                          setUnlimitedDuration(false);
                          setDurationValueText(preset.val);
                          setDurationUnit(preset.unit);
                        }
                      }}
                      className={`py-1.5 rounded-lg font-bold text-[10px] cursor-pointer border whitespace-nowrap ${
                        isActivePreset
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ringkasan Hadiah Terpilih */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Paket Hadiah Terpilih ({selectedRewards.length})</span>
                </span>
                {selectedTrialCount > 0 && (
                  <span className="text-[10px] font-mono font-bold text-cyan-300">
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

            {/* Inline Feedback Banner TEPAT DI DEKAT TOMBOL TERBITKAN */}
            {feedback && (
              <div
                role="alert"
                className={`p-3 rounded-xl border font-semibold space-y-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                    : 'bg-rose-950/90 border-rose-500/60 text-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    {feedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span className="leading-relaxed">{feedback.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFeedback(null)}
                    className="text-slate-400 hover:text-white cursor-pointer shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {feedback.isDuplicate && (
                  <button
                    type="button"
                    onClick={() => handleGenerateUniqueCode(codeStr.trim().slice(0, 10))}
                    className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[11px] cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Buat Kode Unik Otomatis</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.99] text-slate-950 font-black rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2 transition-all"
            >
              {editingRedeemId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>
                {editingRedeemId
                  ? `Simpan Perubahan Kode (${selectedRewards.length} Hadiah)`
                  : `Terbitkan Kode Redeem (${selectedRewards.length} Hadiah)`}
              </span>
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
                            <span className="text-[10px] font-mono text-emerald-300 font-bold">
                              · {meta.subOptions.length} Varian
                            </span>
                          )}
                          {meta.isRoleGrant && (
                            <span className="text-[10px] font-mono text-amber-300 font-bold">
                              · Role
                            </span>
                          )}
                          {meta.isTrial && (
                            <span className="text-[10px] font-mono text-cyan-300 font-bold">
                              · Trial
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
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black cursor-pointer shrink-0 whitespace-nowrap ${
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
                                  {sub.emoji && (
                                    <span className="text-sm shrink-0">{sub.emoji}</span>
                                  )}
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
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap ${
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
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 whitespace-nowrap ${
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
                              const mult = unitToMinutesMultiplier(trialDecoded.unit);
                              updateRewardItem(meta.type, { trialDurationMinutes: n * mult });
                            }}
                            className="w-20 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs tabular-nums"
                          />
                          <select
                            value={trialDecoded.unit}
                            onChange={(e) => {
                              const nextUnit = e.target.value as DurationUnit;
                              const mult = unitToMinutesMultiplier(nextUnit);
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

      {/* Row 2: Daftar Kode Redeem Terdaftar (Search, Status Filter, Edit, Duplicate, Extend, Claimer Details) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div>
            <h3 className="font-black text-white text-base">
              Daftar Kode Redeem Terdaftar ({safeRedeemCodes.length})
            </h3>
            <p className="text-[11px] text-slate-400">
              Cari kode, saring status, edit isi hadiah, duplikat, perpanjang masa aktif, dan pantau
              pengklaim secara real-time.
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
              {
                key: 'all',
                label: 'Semua',
                activeCls: 'bg-amber-400 text-slate-950 border-amber-300',
              },
              {
                key: 'active',
                label: 'Aktif',
                activeCls: 'bg-emerald-400 text-slate-950 border-emerald-300',
              },
              {
                key: 'quota_full',
                label: 'Habis Kuota',
                activeCls: 'bg-orange-400 text-slate-950 border-orange-300',
              },
              {
                key: 'expired',
                label: 'Kadaluarsa',
                activeCls: 'bg-rose-500 text-white border-rose-400',
              },
              {
                key: 'inactive',
                label: 'Nonaktif',
                activeCls: 'bg-slate-600 text-white border-slate-500',
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-colors cursor-pointer font-mono tabular-nums whitespace-nowrap ${
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
          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredRedeemCodes.map((rdm) => {
              const status = getRedeemCodeStatus(rdm);
              const isClaimersOpen = Boolean(expandedClaimersMap[rdm.id]);
              const isExtending = extendingCodeId === rdm.id;
              const claimCount = rdm.claimedBy.length;
              const quotaPct = rdm.unlimitedClaims
                ? 0
                : Math.min(100, Math.round((claimCount / Math.max(1, rdm.maxClaims)) * 100));
              const expiresDate = new Date(rdm.expiresAt);
              const expiresLabel = rdm.unlimitedDuration
                ? '∞ Tanpa Batas'
                : Number.isNaN(expiresDate.getTime())
                ? '-'
                : expiresDate.toLocaleString('id-ID');

              const statusTextColor =
                status === 'active'
                  ? 'text-emerald-400'
                  : status === 'quota_full'
                  ? 'text-orange-400'
                  : status === 'expired'
                  ? 'text-rose-400'
                  : 'text-slate-400';

              const statusLabel =
                status === 'active'
                  ? 'Aktif'
                  : status === 'quota_full'
                  ? 'Habis Kuota'
                  : status === 'expired'
                  ? 'Kadaluarsa'
                  : 'Nonaktif';

              return (
                <div
                  key={rdm.id}
                  className={`p-4 rounded-2xl bg-slate-950 border space-y-3 ${
                    editingRedeemId === rdm.id
                      ? 'border-amber-400 ring-1 ring-amber-400/40'
                      : 'border-slate-800'
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3 border-b border-slate-900 pb-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-400/40 font-mono font-black text-amber-300 text-sm tracking-wider shrink-0">
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-400 mt-0.5">
                          <span className={`font-bold ${statusTextColor}`}>{statusLabel}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {rdm.sendNotification !== false ? 'Dengan Notifikasi' : 'Tanpa Notif'}
                          </span>
                          {rdm.requireAdminPin && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-300 font-semibold">Wajib PIN Admin</span>
                            </>
                          )}
                        </div>
                        {rdm.description && (
                          <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                            {rdm.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Controls: Edit, Duplikat, Perpanjang, Aktif/Nonaktif, Hapus */}
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEditCode(rdm)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateClick(rdm)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-400/40 text-indigo-200 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Files className="w-3 h-3" />
                        <span>Duplikat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setExtendingCodeId(isExtending ? null : rdm.id);
                          setExtendValueText('1');
                          setExtendUnit('hours');
                          setExtendExtraClaimsText('');
                        }}
                        className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 whitespace-nowrap ${
                          isExtending
                            ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                            : 'bg-cyan-500/15 hover:bg-cyan-500/25 border-cyan-400/40 text-cyan-200'
                        }`}
                      >
                        <CalendarPlus className="w-3 h-3" />
                        <span>Perpanjang</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleRedeemCodeActive(rdm.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold cursor-pointer whitespace-nowrap"
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

                  {/* Quick Extend Drawer */}
                  {isExtending && (
                    <div className="p-3 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
                          <CalendarPlus className="w-3.5 h-3.5" />
                          <span>Perpanjang Masa Aktif &amp; Tambah Kuota ({rdm.code})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setExtendingCodeId(null)}
                          className="text-slate-400 hover:text-white cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '+30 Menit', mins: 30 },
                          { label: '+1 Jam', mins: 60 },
                          { label: '+24 Jam', mins: 1440 },
                          { label: '+7 Hari', mins: 10080 },
                        ].map((opt) => (
                          <button
                            key={opt.mins}
                            type="button"
                            onClick={() => handleApplyExtend(rdm, { extraMinutes: opt.mins })}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-cyan-200 font-bold text-[10px] cursor-pointer whitespace-nowrap"
                          >
                            {opt.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleApplyExtend(rdm, { setUnlimitedDuration: true })}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-400 hover:text-slate-950 border border-cyan-400/50 text-cyan-200 font-black text-[10px] cursor-pointer whitespace-nowrap"
                        >
                          ∞ Jadikan Tanpa Batas
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={extendValueText}
                            onChange={(e) =>
                              setExtendValueText(e.target.value.replace(/[^0-9]/g, ''))
                            }
                            placeholder="Durasi"
                            className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold text-xs"
                          />
                          <select
                            value={extendUnit}
                            onChange={(e) => setExtendUnit(e.target.value as DurationUnit)}
                            className="flex-1 px-2 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-xs"
                          >
                            <option value="minutes">Menit</option>
                            <option value="hours">Jam</option>
                            <option value="days">Hari</option>
                          </select>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={extendExtraClaimsText}
                          onChange={(e) =>
                            setExtendExtraClaimsText(e.target.value.replace(/[^0-9]/g, ''))
                          }
                          placeholder="+ Kuota (opsional)"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = parseInt(extendValueText.trim(), 10) || 0;
                            const extraMins =
                              val > 0 ? val * unitToMinutesMultiplier(extendUnit) : undefined;
                            handleApplyExtend(rdm, { extraMinutes: extraMins });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs cursor-pointer whitespace-nowrap"
                        >
                          Terapkan Perpanjangan
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reward Items List */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 block">
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
                      )
                        .slice(0, 12)
                        .map((rw, idx) => {
                          const meta = GIFT_REWARD_CATALOG.find((m) => m.type === rw.type);
                          const isTrial = Boolean(
                            meta?.isTrial ||
                              meta?.subOptions?.find((s) => s.id === rw.selectedSubOptionId)
                                ?.isTrialVariant
                          );
                          return (
                            <span
                              key={`${rdm.id}-rw-${idx}`}
                              className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold ${
                                isTrial
                                  ? 'bg-cyan-950/50 border-cyan-500/40 text-cyan-200'
                                  : rw.rewardMode === 'gacha'
                                  ? 'bg-fuchsia-950/50 border-fuchsia-500/40 text-fuchsia-200'
                                  : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                              }`}
                            >
                              {formatSingleRewardSummary(rw)}
                            </span>
                          );
                        })}
                      {rdm.rewards && rdm.rewards.length > 12 && (
                        <span className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 text-[10px] font-mono font-bold">
                          +{rdm.rewards.length - 12} hadiah lainnya
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quota, Duration, Expiry */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] bg-slate-900/70 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block">Kuota Klaim:</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <strong className="font-mono tabular-nums text-white">
                          {rdm.unlimitedClaims
                            ? `${claimCount} / ∞ Tanpa Batas`
                            : `${claimCount} / ${rdm.maxClaims} Orang`}
                        </strong>
                        {!rdm.unlimitedClaims && (
                          <span className="text-[10px] font-mono tabular-nums text-slate-400">
                            {quotaPct}%
                          </span>
                        )}
                      </div>
                      {!rdm.unlimitedClaims && (
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              quotaPct >= 100 ? 'bg-orange-400' : 'bg-emerald-400'
                            }`}
                            style={{ width: `${quotaPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-400 block">Durasi Aktif:</span>
                      <strong className="font-mono tabular-nums text-cyan-300">
                        {rdm.unlimitedDuration
                          ? '∞ Tanpa Batas'
                          : formatTrialDurationLabel(rdm.durationMinutes)}
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
                                    <span className="font-mono tabular-nums text-[10px] text-amber-300">
                                      Rek {c.accountNumber}
                                    </span>
                                    {c.referenceNo && (
                                      <span className="font-mono text-[10px] text-slate-400">
                                        · {c.referenceNo}
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

      {/* Floating Sticky Bottom Action Bar (Ringkas & Nyaman di HP maupun Laptop saat memilih hadiah di katalog) */}
      <div className="sticky bottom-3 z-40">
        <div className="px-4 py-2.5 rounded-2xl bg-slate-950/95 border border-amber-400/60 shadow-2xl backdrop-blur-md flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono tabular-nums">
              <span className="font-black text-amber-300 truncate max-w-[140px] sm:max-w-[220px]">
                {codeStr.trim() || '(Kode kosong)'}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-slate-200 font-bold whitespace-nowrap">
                {selectedRewards.length} Hadiah
              </span>
              {selectedTrialCount > 0 && (
                <span className="hidden sm:inline text-cyan-300 font-bold whitespace-nowrap">
                  · {selectedTrialCount} Trial
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 block truncate">
              {editingRedeemId
                ? 'Sedang mengedit kode terdaftar'
                : unlimitedClaims
                ? 'Kuota Tanpa Batas'
                : `Kuota ${parsedMaxClaims || 0} orang`}
              {' · '}
              {unlimitedDuration
                ? 'Aktif Tanpa Batas'
                : computedDurationMinutes > 0
                ? formatTrialDurationLabel(computedDurationMinutes)
                : 'Atur durasi'}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {editingRedeemId && (
              <button
                type="button"
                onClick={() => resetFormToCreateMode(safeRedeemCodes)}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer whitespace-nowrap"
              >
                Batal
              </button>
            )}
            <button
              type="button"
              onClick={executePublishOrUpdate}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 active:scale-[0.98] text-slate-950 font-black text-xs cursor-pointer inline-flex items-center gap-1.5 shadow-lg shadow-amber-500/25 whitespace-nowrap"
            >
              {editingRedeemId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingRedeemId ? 'Simpan Perubahan' : 'Terbitkan Kode'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminRedeemCodePanel: React.FC = () => (
  <RedeemPanelErrorBoundary>
    <AdminRedeemCodePanelInner />
  </RedeemPanelErrorBoundary>
);
