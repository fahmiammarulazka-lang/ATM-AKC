/**
 * AdminGiftEventPanel
 * Pusat Kendali Hadiah & Surat (100 Macam Hadiah + Sub-Pilihan Varian, Trial Lengkap, Role Permanen/Trial, Gacha Min–Max %,
 * Date Lock Ketat, & Studio Tanda Tangan Gambar/Template + 5 Template Stempel)
 */
import React, { useState } from 'react';
import {
  Gift,
  Calendar,
  Send,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Sparkles,
  Power,
  RotateCcw,
  UserCheck,
  Lock,
  Dices,
  Clock,
  Search,
  Crown,
  PenTool,
  Mail,
  Users,
  CheckSquare,
  Square,
  Copy,
  Ban,
  CheckCircle2,
  Sliders,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { GIFT_REWARD_CATALOG, MONTHS_INDO, formatTrialDurationLabel } from '../data/giftRewardsCatalog';
import {
  AdminGiftEventPackage,
  AdminGiftRewardItem,
  GiftRewardType,
  LetterSignatureStampConfig,
} from '../types/bank';
import { buildDefaultGachaTiersForReward } from '../utils/gachaUtils';
import { GachaTierBuilder } from './GachaTierBuilder';
import { LetterSealStudioEditor } from './LetterSealRenderer';
import {
  CELEBRATION_CATEGORIES,
  CELEBRATION_EFFECTS_CATALOG,
  CELEBRATION_INTENSITY_OPTIONS,
  CelebrationCategoryKey,
  CelebrationIntensityLevel,
  getCelebrationEffectProfile,
  triggerCanvasConfettiForCelebration,
} from '../data/celebrationEffectsCatalog';
import { CelebrationClaimBurstOverlay } from './CelebrationSpectacleOverlay';

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

const minutesToAmountAndUnit = (minutes?: number): { val: number; unit: 'minutes' | 'hours' | 'days' } => {
  const m = Math.max(1, minutes || 1440);
  if (m >= 1440 && m % 1440 === 0) return { val: m / 1440, unit: 'days' };
  if (m >= 60 && m % 60 === 0) return { val: m / 60, unit: 'hours' };
  return { val: m, unit: 'minutes' };
};

export const AdminGiftEventPanel: React.FC = () => {
  const {
    accounts,
    giftEvents,
    giftDateTestOverride,
    adminCreateOrUpdateGiftEvent,
    adminDeleteGiftEvent,
    adminToggleGiftEventActive,
    adminTriggerGiftEventNow,
    adminResetGiftEventStatus,
    adminToggleRevokeGiftEventRecipient,
    adminDuplicateGiftEvent,
    adminUpdateGiftEventQuickSettings,
    adminSetGiftDateTestOverride,
    openGiftEventModal,
    devRoles,
    defaultLetterSealConfig,
    adminUpdateDefaultLetterSealConfig,
  } = useBank();

  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('Hadiah & Surat Spesial Bank Nusantara');
  const [senderName, setSenderName] = useState<string>('Admin Utama Bank Nusantara');
  const [letterMessage, setLetterMessage] = useState<string>(
    'Terima kasih telah menjadi nasabah setia Bank Nusantara! Silakan nikmati paket hadiah spesial dan pesan hangat ini langsung di rekening Anda.'
  );
  const [deliveryContentMode, setDeliveryContentMode] = useState<'both' | 'letter_only' | 'gift_only'>('both');
  const [triggerMode, setTriggerMode] = useState<'scheduled_date' | 'manual_instant' | 'both'>('both');
  const [autoPopupEnabled, setAutoPopupEnabled] = useState<boolean>(true);
  const [strictDateLock, setStrictDateLock] = useState<boolean>(true);
  const [scheduleMonth, setScheduleMonth] = useState<number>(1);
  const [scheduleDay, setScheduleDay] = useState<number>(29);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [targetAccountId, setTargetAccountId] = useState<string>('__ALL__');
  const [recipientSelectionMode, setRecipientSelectionMode] = useState<'all' | 'single' | 'multi'>('all');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');
  const [managingEventId, setManagingEventId] = useState<string | null>(null);
  const [manageRecipientSearch, setManageRecipientSearch] = useState<string>('');
  const [themeColor, setThemeColor] = useState<'amber' | 'emerald' | 'rose' | 'indigo'>('amber');

  // Custom Signature & Stamp settings for this event (or use Default Global)
  const [sealScope, setSealScope] = useState<'global' | 'custom'>('global');
  const [customSealDraft, setCustomSealDraft] = useState<LetterSignatureStampConfig>(
    defaultLetterSealConfig
  );
  const [showSealStudio, setShowSealStudio] = useState<boolean>(true);

  // 20+ Advanced Admin Features State
  const [frequencyType, setFrequencyType] = useState<'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_recurring'>('monthly');
  const [recurringIntervalHours, setRecurringIntervalHours] = useState<number>(24);
  const [autoRotateRecurring, setAutoRotateRecurring] = useState<boolean>(false);
  const [maxRedeemsPerUser, setMaxRedeemsPerUser] = useState<number>(1);
  const [targetCardTier, setTargetCardTier] = useState<string>('all');
  const [targetDevRoleOnly, setTargetDevRoleOnly] = useState<string>('');
  const [celebrationEffect, setCelebrationEffect] = useState<string>('ulang_tahun_meriah');
  const [celebrationIntensity, setCelebrationIntensity] =
    useState<CelebrationIntensityLevel>('100000x');
  const [celebCategoryFilter, setCelebCategoryFilter] = useState<CelebrationCategoryKey>('all');
  const [celebSearchQuery, setCelebSearchQuery] = useState<string>('');
  const [previewBurstState, setPreviewBurstState] = useState<{
    effectId: string;
    intensity: CelebrationIntensityLevel;
    nonce: number;
  } | null>(null);
  const [soundEffect, setSoundEffect] = useState<'chime' | 'harp' | 'fanfare' | 'silent'>('chime');
  const [requireAdminVerifiedAccessForNotif, setRequireAdminVerifiedAccessForNotif] = useState<boolean>(true);
  const [adminAuditLogTag, setAdminAuditLogTag] = useState<string>('GIFT-AUDIT-LOG');
  const [customStampText, setCustomStampText] = useState<string>('BANK NUSANTARA RESMI');
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL SULTAN');
  const [securityHashToken, setSecurityHashToken] = useState<string>('BN-HASH-999');
  const [allowAnonymousClaim, setAllowAnonymousClaim] = useState<boolean>(false);
  const [notifyOnlyAdminVerifiedUsers, setNotifyOnlyAdminVerifiedUsers] = useState<boolean>(true);
  const [priorityLevel, setPriorityLevel] = useState<'normal' | 'high' | 'vip_exclusive'>('normal');
  const [customCssTheme, setCustomCssTheme] = useState<string>('default');
  const [attachmentFileUrl, setAttachmentFileUrl] = useState<string>('');
  const [attachmentFileName, setAttachmentFileName] = useState<string>('');
  const [autoExpireHours, setAutoExpireHours] = useState<number>(72);
  const [allowTransferableGift, setAllowTransferableGift] = useState<boolean>(true);

  const [selectedRewards, setSelectedRewards] = useState<AdminGiftRewardItem[]>(() =>
    GIFT_REWARD_CATALOG.slice(0, 4).map((meta, idx) => ({
      id: `rew-init-${idx}`,
      type: meta.type,
      label: meta.label,
      amount: meta.defaultAmount,
      unitLabel: meta.unitLabel,
      emoji: meta.emoji,
      rewardMode: 'fixed',
      trialDurationMinutes: meta.defaultTrialMinutes,
    }))
  );

  const [rewardCatFilter, setRewardCatFilter] = useState<string>('Semua');
  const [rewardSearch, setRewardSearch] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');

  const categories = ['Semua', ...Array.from(new Set(GIFT_REWARD_CATALOG.map((r) => r.category)))];
  const visibleCatalog = GIFT_REWARD_CATALOG.filter((r) => {
    if (rewardCatFilter !== 'Semua' && r.category !== rewardCatFilter) return false;
    if (rewardSearch.trim()) {
      const q = rewardSearch.toLowerCase();
      return (
        r.label.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        Boolean(r.subOptions?.some((s) => s.label.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const toggleRewardType = (type: GiftRewardType) => {
    const exists = selectedRewards.find((r) => r.type === type);
    if (exists) {
      setSelectedRewards((prev) => prev.filter((r) => r.type !== type));
      return;
    }
    const meta = GIFT_REWARD_CATALOG.find((m) => m.type === type);
    if (!meta) return;
    const defaultSub = meta.subOptions?.[0];
    setSelectedRewards((prev) => [
      ...prev,
      {
        id: `rew-${type}-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        type: meta.type,
        label: meta.label,
        amount: defaultSub?.defaultAmountOverride ?? meta.defaultAmount,
        unitLabel: defaultSub?.unitLabelOverride ?? meta.unitLabel,
        emoji: meta.emoji,
        rewardMode: 'fixed',
        trialDurationMinutes: defaultSub?.defaultTrialMinutesOverride ?? meta.defaultTrialMinutes,
        targetDevRoleId: meta.isRoleGrant ? devRoles[0]?.id : undefined,
        selectedSubOptionId: defaultSub?.id,
        selectedSubOptionLabel: defaultSub?.label,
      },
    ]);
  };

  const updateRewardItem = (type: GiftRewardType, patch: Partial<AdminGiftRewardItem>) => {
    setSelectedRewards((prev) =>
      prev.map((r) => (r.type === type ? { ...r, ...patch } : r))
    );
  };

  const handleSelectAllCatalog = () => {
    setSelectedRewards(
      GIFT_REWARD_CATALOG.map((meta, idx) => {
        const existing = selectedRewards.find((s) => s.type === meta.type);
        if (existing) return existing;
        const defaultSub = meta.subOptions?.[0];
        return {
          id: `rew-all-${idx}-${Date.now()}`,
          type: meta.type,
          label: meta.label,
          amount: defaultSub?.defaultAmountOverride ?? meta.defaultAmount,
          unitLabel: defaultSub?.unitLabelOverride ?? meta.unitLabel,
          emoji: meta.emoji,
          rewardMode: 'fixed',
          trialDurationMinutes: defaultSub?.defaultTrialMinutesOverride ?? meta.defaultTrialMinutes,
          targetDevRoleId: meta.isRoleGrant ? devRoles[0]?.id : undefined,
          selectedSubOptionId: defaultSub?.id,
          selectedSubOptionLabel: defaultSub?.label,
        };
      })
    );
  };

  const resetFormToNew = () => {
    setEditingEventId(null);
    setTitle('Hadiah & Surat Spesial Bank Nusantara');
    setSenderName('Admin Utama Bank Nusantara');
    setLetterMessage(
      'Terima kasih telah menjadi nasabah setia Bank Nusantara! Silakan nikmati paket hadiah spesial dan pesan hangat ini langsung di rekening Anda.'
    );
    setDeliveryContentMode('both');
    setTriggerMode('both');
    setAutoPopupEnabled(true);
    setStrictDateLock(true);
    setScheduleMonth(1);
    setScheduleDay(29);
    setIsActive(true);
    setTargetAccountId('__ALL__');
    setRecipientSelectionMode('all');
    setSelectedRecipientIds([]);
    setRecipientSearchQuery('');
    setThemeColor('amber');
    setSealScope('global');
    setCustomSealDraft(defaultLetterSealConfig);
    setFrequencyType('monthly');
    setRecurringIntervalHours(24);
    setAutoRotateRecurring(false);
    setMaxRedeemsPerUser(1);
    setTargetCardTier('all');
    setTargetDevRoleOnly('');
    setCelebrationEffect('ulang_tahun_meriah');
    setCelebrationIntensity('100000x');
    setSoundEffect('chime');
    setRequireAdminVerifiedAccessForNotif(true);
    setAdminAuditLogTag('GIFT-AUDIT-LOG');
    setCustomStampText('BANK NUSANTARA RESMI');
    setWatermarkText('CONFIDENTIAL SULTAN');
    setSecurityHashToken('BN-HASH-999');
    setAllowAnonymousClaim(false);
    setNotifyOnlyAdminVerifiedUsers(true);
    setPriorityLevel('normal');
    setCustomCssTheme('default');
    setAttachmentFileUrl('');
    setAttachmentFileName('');
    setAutoExpireHours(72);
    setAllowTransferableGift(true);
  };

  const loadEventIntoEditor = (ev: AdminGiftEventPackage) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setSenderName(ev.senderName);
    setLetterMessage(ev.letterMessage);
    setDeliveryContentMode(ev.deliveryContentMode || 'both');
    setTriggerMode(ev.triggerMode);
    setAutoPopupEnabled(ev.autoPopupEnabled);
    setStrictDateLock(ev.strictDateLock !== undefined ? ev.strictDateLock : true);
    setScheduleMonth(ev.scheduleMonth);
    setScheduleDay(ev.scheduleDay);
    setIsActive(ev.isActive);

    const existingTargets = Array.isArray(ev.targetAccountIds) && ev.targetAccountIds.length > 0
      ? ev.targetAccountIds
      : ev.targetAccountId && ev.targetAccountId !== '__ALL__' && ev.targetAccountId !== '__MULTI__'
      ? [ev.targetAccountId]
      : [];

    if (!ev.targetAccountId || ev.targetAccountId === '__ALL__') {
      setRecipientSelectionMode('all');
      setTargetAccountId('__ALL__');
      setSelectedRecipientIds([]);
    } else if (existingTargets.length === 1) {
      setRecipientSelectionMode('single');
      setTargetAccountId(existingTargets[0]);
      setSelectedRecipientIds(existingTargets);
    } else {
      setRecipientSelectionMode('multi');
      setTargetAccountId('__MULTI__');
      setSelectedRecipientIds(existingTargets);
    }

    setThemeColor(ev.themeColor || 'amber');
    setSelectedRewards(ev.rewards);
    if (ev.customSealConfig) {
      setSealScope('custom');
      setCustomSealDraft(ev.customSealConfig);
    } else {
      setSealScope('global');
      setCustomSealDraft(defaultLetterSealConfig);
    }
    setFrequencyType(ev.frequencyType || 'monthly');
    setRecurringIntervalHours(ev.recurringIntervalHours || 24);
    setAutoRotateRecurring(ev.autoRotateRecurring ?? false);
    setMaxRedeemsPerUser(ev.maxRedeemsPerUser || 1);
    setTargetCardTier(ev.targetCardTier || 'all');
    setTargetDevRoleOnly(ev.targetDevRoleOnly || '');
    setCelebrationEffect(getCelebrationEffectProfile(ev.celebrationEffect).id);
    setCelebrationIntensity(ev.celebrationIntensity || '100000x');
    setSoundEffect(ev.soundEffect || 'chime');
    setRequireAdminVerifiedAccessForNotif(ev.requireAdminVerifiedAccessForNotif ?? true);
    setAdminAuditLogTag(ev.adminAuditLogTag || 'GIFT-AUDIT-LOG');
    setCustomStampText(ev.customStampText || 'BANK NUSANTARA RESMI');
    setWatermarkText(ev.watermarkText || 'CONFIDENTIAL SULTAN');
    setSecurityHashToken(ev.securityHashToken || 'BN-HASH-999');
    setAllowAnonymousClaim(ev.allowAnonymousClaim ?? false);
    setNotifyOnlyAdminVerifiedUsers(ev.notifyOnlyAdminVerifiedUsers ?? true);
    setPriorityLevel(ev.priorityLevel || 'normal');
    setCustomCssTheme(ev.customCssTheme || 'default');
    setAttachmentFileUrl(ev.attachmentFileUrl || '');
    setAttachmentFileName(ev.attachmentFileName || '');
    setAutoExpireHours(ev.autoExpireHours || 72);
    setAllowTransferableGift(ev.allowTransferableGift ?? true);

    setFeedback(`✏️ Mengedit paket "${ev.title}" (Pengirim: ${ev.senderName}). Silakan ubah isi surat, hadiah, mode kirim, atau pengguna penerima lalu klik Simpan.`);
  };

  const toggleRecipientAccountCheckbox = (accountId: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const filteredRecipientAccounts = accounts.filter((acc) => {
    if (!recipientSearchQuery.trim()) return true;
    const q = recipientSearchQuery.toLowerCase();
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.accountNumber.toLowerCase().includes(q) ||
      acc.cardTier.toLowerCase().includes(q) ||
      (acc.phone || '').toLowerCase().includes(q)
    );
  });

  const handleSave = (alsoSendNow: boolean) => {
    if (deliveryContentMode !== 'letter_only' && selectedRewards.length === 0) {
      setFeedback(`Pilih minimal 1 hadiah dari daftar ${GIFT_REWARD_CATALOG.length} macam hadiah (atau ubah Mode Isi Kiriman menjadi "Surat Saja")!`);
      return;
    }

    let finalTargetAccountId = '__ALL__';
    let finalTargetAccountIds: string[] = [];

    if (recipientSelectionMode === 'all') {
      finalTargetAccountId = '__ALL__';
      finalTargetAccountIds = [];
    } else if (recipientSelectionMode === 'single') {
      const chosenSingle =
        targetAccountId && targetAccountId !== '__ALL__' && targetAccountId !== '__MULTI__'
          ? targetAccountId
          : selectedRecipientIds[0] || accounts[0]?.id || '__ALL__';
      if (chosenSingle === '__ALL__') {
        finalTargetAccountId = '__ALL__';
        finalTargetAccountIds = [];
      } else {
        finalTargetAccountId = chosenSingle;
        finalTargetAccountIds = [chosenSingle];
      }
    } else {
      if (selectedRecipientIds.length === 0) {
        setFeedback('Centang minimal 1 akun nasabah penerima pada daftar pemilihan pengguna (atau pilih Semua Nasabah)!');
        return;
      }
      finalTargetAccountIds = Array.from(new Set(selectedRecipientIds));
      finalTargetAccountId =
        finalTargetAccountIds.length === 1 ? finalTargetAccountIds[0] : '__MULTI__';
    }

    const res = adminCreateOrUpdateGiftEvent({
      id: editingEventId || undefined,
      title,
      senderName,
      letterMessage,
      deliveryContentMode,
      triggerMode,
      autoPopupEnabled,
      strictDateLock,
      isGachaBox:
        deliveryContentMode === 'letter_only'
          ? false
          : selectedRewards.some((r) => r.rewardMode === 'gacha'),
      scheduleMonth,
      scheduleDay,
      isActive,
      targetAccountId: finalTargetAccountId,
      targetAccountIds: finalTargetAccountIds,
      themeColor,
      rewards: deliveryContentMode === 'letter_only' ? [] : selectedRewards,
      customSealConfig: sealScope === 'custom' ? customSealDraft : null,
      frequencyType,
      recurringIntervalHours,
      autoRotateRecurring,
      maxRedeemsPerUser,
      targetCardTier: targetCardTier as any,
      targetDevRoleOnly,
      celebrationEffect,
      celebrationIntensity,
      soundEffect,
      requireAdminVerifiedAccessForNotif,
      adminAuditLogTag,
      customStampText,
      watermarkText,
      securityHashToken,
      allowAnonymousClaim,
      notifyOnlyAdminVerifiedUsers,
      priorityLevel,
      customCssTheme,
      attachmentFileUrl,
      attachmentFileName,
      autoExpireHours,
      allowTransferableGift,
    });
    if (alsoSendNow && res.success) {
      const sendRes = adminTriggerGiftEventNow(res.event.id);
      setFeedback(`${res.message} ${sendRes.message}`);
    } else {
      setFeedback(res.message);
    }
    if (!editingEventId) {
      resetFormToNew();
    }
  };

  const activeCelebrationProfile = getCelebrationEffectProfile(celebrationEffect);

  const filteredCelebrations = CELEBRATION_EFFECTS_CATALOG.filter((item) => {
    if (celebCategoryFilter !== 'all' && item.category !== celebCategoryFilter) {
      return false;
    }
    if (celebSearchQuery.trim()) {
      const q = celebSearchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.shortBadge.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleTestCelebrationEffect = (
    effectId: string,
    intensity: CelebrationIntensityLevel = celebrationIntensity
  ) => {
    triggerCanvasConfettiForCelebration(effectId, intensity);
    setPreviewBurstState({
      effectId,
      intensity,
      nonce: Date.now(),
    });
  };

  return (
    <div className="space-y-6 text-xs">
      {/* FULL-SCREEN LIVE PREVIEW OVERLAY FOR 108 CELEBRATION EFFECTS (100,000X STAGE) */}
      {previewBurstState && (
        <CelebrationClaimBurstOverlay
          effectId={previewBurstState.effectId}
          burstNonce={previewBurstState.nonce}
          intensityLevel={previewBurstState.intensity}
          isPreviewMode
          onDismiss={() => setPreviewBurstState(null)}
        />
      )}
      {/* Header & Date Simulation Banner */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-rose-950/80 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-block">
              🎁 HADIAH &amp; SURAT ROYAL ({GIFT_REWARD_CATALOG.length} MACAM HADIAH + SUB-PILIHAN + TRIAL LENGKAP + GACHA)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Atur Kotak Hadiah, {GIFT_REWARD_CATALOG.length} Hadiah + Sub-Pilihan &amp; Trial Lengkap, Gacha, TTD &amp; Stempel
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Pilih dari <strong>{GIFT_REWARD_CATALOG.length} jenis hadiah jelas</strong> dengan <strong>sub-pilihan varian di dalam kartu</strong> (Upgrade Kartu 5 Tier, Pekerjaan &amp; Lowongan, Bisnis, Bursa, VIP), puluhan <strong>Fitur Trial Berdurasi Lengkap</strong>, <strong>Hadiah Role Dev</strong> &amp; Mode <strong>🎲 Gacha Min–Max %</strong>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                adminSetGiftDateTestOverride({ month: 1, day: 29 });
                setFeedback(
                  '🗓️ Simulasi Tanggal 29 Januari AKTIF! Event tanggal 29 Januari siap dibuka nasabah.'
                );
              }}
              className={`px-4 py-2.5 rounded-xl font-black cursor-pointer transition-all flex items-center gap-1.5 whitespace-nowrap ${
                giftDateTestOverride?.month === 1 && giftDateTestOverride?.day === 29
                  ? 'bg-emerald-400 text-slate-950 shadow-lg'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Simulasikan Tanggal 29 Januari</span>
            </button>

            {giftDateTestOverride && (
              <button
                type="button"
                onClick={() => {
                  adminSetGiftDateTestOverride(null);
                  setFeedback('Tanggal dikembalikan ke tanggal asli perangkat hari ini.');
                }}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tanggal Asli</span>
              </button>
            )}
          </div>
        </div>

        {giftDateTestOverride && (
          <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-200 font-bold flex items-center justify-between gap-2">
            <span>
              ✅ Mode Simulasi Kalender Aktif: Sistem membaca tanggal hari ini sebagai{' '}
              <strong className="font-mono">
                {giftDateTestOverride.day}{' '}
                {MONTHS_INDO.find((m) => m.value === giftDateTestOverride.month)?.label}
              </strong>
              .
            </span>
          </div>
        )}

        {feedback && (
          <div className="p-3.5 rounded-2xl bg-slate-950 border-2 border-cyan-400/60 text-cyan-200 font-bold flex items-center justify-between gap-2">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* STUDIO TANDA TANGAN & STEMPEL RESMI (DEFAULT GLOBAL & KHUSUS PER SURAT) */}
      <div className="bg-slate-900/95 border-2 border-amber-400/50 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <PenTool className="w-4 h-4 text-amber-400" />
              <span>Studio Tanda Tangan (Gambar Kanvas / 5 Template) &amp; 5 Stempel Resmi</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Atur <strong>Default Global</strong> untuk semua surat atau pilih <strong>Khusus Surat Ini</strong> agar paket surat yang diedit memakai tanda tangan &amp; stempel tersendiri.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setSealScope('global')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                  sealScope === 'global'
                    ? 'bg-amber-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                🌐 Default Global
              </button>
              <button
                type="button"
                onClick={() => setSealScope('custom')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-black cursor-pointer ${
                  sealScope === 'custom'
                    ? 'bg-fuchsia-400 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ✉️ Khusus Surat Ini
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSealStudio((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
            >
              {showSealStudio ? 'Sembunyikan Studio' : 'Buka Studio TTD & Stempel'}
            </button>
          </div>
        </div>

        {showSealStudio && (
          <LetterSealStudioEditor
            value={sealScope === 'global' ? defaultLetterSealConfig : customSealDraft}
            onChange={(nextCfg) => {
              if (sealScope === 'global') {
                adminUpdateDefaultLetterSealConfig(nextCfg);
              } else {
                setCustomSealDraft(nextCfg);
              }
            }}
          />
        )}
      </div>

      {/* Form Builder + 58 Reward Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Letter & Schedule Settings (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>
                {editingEventId ? 'Edit Paket Hadiah & Surat' : 'Buat Jadwal / Kiriman Hadiah Baru'}
              </span>
            </h3>
            {editingEventId && (
              <button
                type="button"
                onClick={resetFormToNew}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold cursor-pointer"
              >
                + Buat Baru
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Judul Kotak Hadiah &amp; Surat
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Hadiah Spesial 29 Januari"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Nama Pengirim di Surat &amp; Kotak Hadiah (Bisa Diganti Bebas)</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: CEO Bank Nusantara / Admin Baik Hati"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-amber-400/50 text-amber-200 font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Isi Pesan Surat untuk Nasabah
              </label>
              <textarea
                rows={4}
                value={letterMessage}
                onChange={(e) => setLetterMessage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 leading-relaxed"
              />
            </div>

            {/* Pengaturan Frekuensi Jadwal + Otomatisasi Tombol Tanggal & Bulan */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-400/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pengaturan Siklus Jadwal (Bulanan / Harian / Tahunan)</span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-200 text-[9px] font-mono font-bold">
                  {frequencyType === 'monthly'
                    ? 'Bulan Otomatis Nonaktif (Aktif Tiap Bulan)'
                    : frequencyType === 'daily' || frequencyType === 'hourly'
                    ? 'Tanggal & Bulan Otomatis Nonaktif (Aktif Tiap Hari)'
                    : 'Tanggal & Bulan Aktif'}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-300 block mb-1">
                  Pilih Mode Jadwal Pengiriman
                </label>
                <select
                  value={frequencyType}
                  onChange={(e) => setFrequencyType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-amber-400/50 text-amber-200 font-bold text-xs"
                >
                  <option value="monthly">Setiap Bulan (Tombol Bulan Otomatis Mati — Aktif Tiap Tanggal Terpilih)</option>
                  <option value="daily">Setiap Hari (Tombol Tanggal &amp; Bulan Otomatis Mati — Aktif Setiap Hari)</option>
                  <option value="yearly">Setiap Tahun / Tanggal &amp; Bulan Spesifik (Tanggal &amp; Bulan Aktif)</option>
                  <option value="once">Sekali Saja pada Tanggal &amp; Bulan Terpilih</option>
                  <option value="weekly">Setiap Minggu</option>
                  <option value="hourly">Setiap Jam (Tombol Tanggal &amp; Bulan Otomatis Mati)</option>
                  <option value="custom_recurring">Kustom Berulang (Interval Jam)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between gap-1 mb-1">
                    <span>Tanggal (1–31)</span>
                    {(frequencyType === 'daily' || frequencyType === 'hourly') && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-mono">
                        NONAKTIF OTOMATIS
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    disabled={frequencyType === 'daily' || frequencyType === 'hourly'}
                    value={scheduleDay}
                    onChange={(e) =>
                      setScheduleDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold transition-all ${
                      frequencyType === 'daily' || frequencyType === 'hourly'
                        ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-55'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  />
                  <span className="text-[9.5px] text-slate-400 block mt-1">
                    {frequencyType === 'daily' || frequencyType === 'hourly'
                      ? 'Tombol tanggal otomatis mati karena jadwal berjalan setiap hari.'
                      : frequencyType === 'monthly'
                      ? `Otomatis aktif setiap tanggal ${scheduleDay} di semua bulan.`
                      : `Aktif pada tanggal ${scheduleDay}.`}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between gap-1 mb-1">
                    <span>Bulan Jadwal</span>
                    {(frequencyType === 'monthly' ||
                      frequencyType === 'daily' ||
                      frequencyType === 'hourly') && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-mono">
                        NONAKTIF OTOMATIS
                      </span>
                    )}
                  </label>
                  <select
                    value={scheduleMonth}
                    disabled={
                      frequencyType === 'monthly' ||
                      frequencyType === 'daily' ||
                      frequencyType === 'hourly'
                    }
                    onChange={(e) => setScheduleMonth(Number(e.target.value))}
                    className={`w-full px-3 py-2 rounded-xl border font-semibold transition-all ${
                      frequencyType === 'monthly' ||
                      frequencyType === 'daily' ||
                      frequencyType === 'hourly'
                        ? 'bg-slate-900/50 border-slate-800 text-slate-500 cursor-not-allowed opacity-55'
                        : 'bg-slate-950 border-slate-700 text-white'
                    }`}
                  >
                    {MONTHS_INDO.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[9.5px] text-slate-400 block mt-1">
                    {frequencyType === 'monthly'
                      ? 'Tombol bulan otomatis mati karena berulang setiap bulan.'
                      : frequencyType === 'daily' || frequencyType === 'hourly'
                      ? 'Tombol bulan otomatis mati karena aktif setiap hari.'
                      : `Aktif pada bulan ${MONTHS_INDO.find((m) => m.value === scheduleMonth)?.label}.`}
                  </span>
                </div>
              </div>
            </div>

            {/* MODE ISI KIRIMAN: HADIAH + SURAT SEKALIGUS / SURAT SAJA / HADIAH SAJA */}
            <div className="p-3.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400/50 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Mode Isi Kiriman (Hadiah &amp; Surat / Surat Saja / Hadiah Saja)</span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-[9.5px] font-mono font-bold">
                  {deliveryContentMode === 'both'
                    ? 'Tampil 2 Kartu (Amplop + Hadiah)'
                    : deliveryContentMode === 'letter_only'
                    ? 'Tampil Amplop Surat Saja'
                    : 'Tampil Kotak Hadiah Saja'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDeliveryContentMode('both')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    deliveryContentMode === 'both'
                      ? 'bg-amber-400 text-slate-950 border-amber-200 font-black shadow-lg'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-amber-400/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Gift className="w-3.5 h-3.5 shrink-0" />
                    <span>Keduanya Sekaligus</span>
                  </div>
                  <span
                    className={`text-[9.5px] block leading-tight ${
                      deliveryContentMode === 'both' ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Kirim Amplop Surat + Kotak Hadiah berdampingan
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryContentMode('letter_only')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    deliveryContentMode === 'letter_only'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-200 font-black shadow-lg'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-cyan-400/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span>Surat Saja</span>
                  </div>
                  <span
                    className={`text-[9.5px] block leading-tight ${
                      deliveryContentMode === 'letter_only' ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Hanya tampilkan Amplop Surat Resmi (tanpa hadiah)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryContentMode('gift_only')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                    deliveryContentMode === 'gift_only'
                      ? 'bg-emerald-400 text-slate-950 border-emerald-200 font-black shadow-lg'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700 hover:border-emerald-400/50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs font-black">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Hadiah Saja</span>
                  </div>
                  <span
                    className={`text-[9.5px] block leading-tight ${
                      deliveryContentMode === 'gift_only' ? 'text-slate-900 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    Hanya tampilkan Kotak Hadiah Sultan (tanpa surat)
                  </span>
                </button>
              </div>
            </div>

            {/* PEMILIH PENGGUNA PENERIMA: SEMUA NASABAH / 1 AKUN / CENTANG BANYAK AKUN + PENCARIAN */}
            <div className="p-3.5 rounded-2xl bg-slate-950/95 border-2 border-emerald-400/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Pilih Pengguna Penerima Kiriman</span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[9.5px] font-mono font-bold">
                  {recipientSelectionMode === 'all'
                    ? `Semua Nasabah (${accounts.length} Akun)`
                    : recipientSelectionMode === 'single'
                    ? '1 Akun Spesifik'
                    : `${selectedRecipientIds.length} Akun Dicentang`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientSelectionMode('all');
                    setTargetAccountId('__ALL__');
                  }}
                  className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border cursor-pointer transition-all ${
                    recipientSelectionMode === 'all'
                      ? 'bg-emerald-400 text-slate-950 border-emerald-200 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  🌐 Semua ({accounts.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientSelectionMode('single');
                    const fallbackId =
                      targetAccountId !== '__ALL__' && targetAccountId !== '__MULTI__'
                        ? targetAccountId
                        : selectedRecipientIds[0] || accounts[0]?.id || '__ALL__';
                    setTargetAccountId(fallbackId);
                    if (fallbackId !== '__ALL__') {
                      setSelectedRecipientIds([fallbackId]);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border cursor-pointer transition-all ${
                    recipientSelectionMode === 'single'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-200 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  👤 Pilih 1 Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientSelectionMode('multi');
                    setTargetAccountId('__MULTI__');
                    if (
                      selectedRecipientIds.length === 0 &&
                      targetAccountId !== '__ALL__' &&
                      targetAccountId !== '__MULTI__'
                    ) {
                      setSelectedRecipientIds([targetAccountId]);
                    }
                  }}
                  className={`py-2 px-2.5 rounded-xl font-bold text-[11px] border cursor-pointer transition-all ${
                    recipientSelectionMode === 'multi'
                      ? 'bg-amber-400 text-slate-950 border-amber-200 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  ☑️ Banyak Akun
                </button>
              </div>

              {recipientSelectionMode === 'single' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={recipientSearchQuery}
                      onChange={(e) => setRecipientSearchQuery(e.target.value)}
                      placeholder="Cari nama nasabah atau nomor rekening..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-white"
                    />
                  </div>
                  <select
                    value={
                      targetAccountId !== '__ALL__' && targetAccountId !== '__MULTI__'
                        ? targetAccountId
                        : filteredRecipientAccounts[0]?.id || ''
                    }
                    onChange={(e) => {
                      setTargetAccountId(e.target.value);
                      setSelectedRecipientIds(e.target.value ? [e.target.value] : []);
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-cyan-400/50 text-cyan-200 font-bold text-xs"
                  >
                    {filteredRecipientAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.fullName} — No. Rek: {acc.accountNumber} ({acc.cardTier.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientSelectionMode === 'multi' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={recipientSearchQuery}
                        onChange={(e) => setRecipientSearchQuery(e.target.value)}
                        placeholder="Cari nama, no. rekening, atau tier kartu..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedRecipientIds(
                          Array.from(
                            new Set([
                              ...selectedRecipientIds,
                              ...filteredRecipientAccounts.map((a) => a.id),
                            ])
                          )
                        )
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-bold text-[10px] cursor-pointer whitespace-nowrap"
                    >
                      + Centang Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipientIds([])}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] cursor-pointer whitespace-nowrap"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    {filteredRecipientAccounts.map((acc) => {
                      const isChecked = selectedRecipientIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleRecipientAccountCheckbox(acc.id)}
                          className={`w-full p-2 rounded-lg border flex items-center justify-between gap-2 text-left cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-emerald-950/60 border-emerald-400/70 text-white'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="font-bold text-xs block truncate">
                                {acc.fullName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400 block">
                                Rek: {acc.accountNumber} • {acc.cardTier.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9.5px] font-black shrink-0 ${
                              isChecked
                                ? 'bg-emerald-400 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {isChecked ? '✓ Terpilih' : 'Pilih'}
                          </span>
                        </button>
                      );
                    })}
                    {filteredRecipientAccounts.length === 0 && (
                      <div className="text-center py-3 text-slate-400 text-[11px]">
                        Tidak ada akun yang cocok dengan pencarian &ldquo;{recipientSearchQuery}&rdquo;.
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Mode Trigger Pengiriman (Jadwal / Manual)
                </label>
                <select
                  value={triggerMode}
                  onChange={(e) => setTriggerMode(e.target.value as 'scheduled_date' | 'manual_instant' | 'both')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-200 font-semibold"
                >
                  <option value="both">Otomatis Sesuai Jadwal + Bisa Kirim Manual</option>
                  <option value="scheduled_date">Hanya Otomatis Sesuai Jadwal</option>
                  <option value="manual_instant">Hanya Kirim Manual Instan</option>
                </select>
              </div>
            </div>

            {/* Strict Date Lock Toggle */}
            <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-950/40 border border-rose-500/40 cursor-pointer">
              <input
                type="checkbox"
                checked={strictDateLock}
                onChange={(e) => setStrictDateLock(e.target.checked)}
                className="mt-0.5"
              />
              <div>
                <span className="font-black text-rose-200 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Kunci Ketat Tanggal (Hanya Bisa Dibuka di Tanggal Jadwal)</span>
                </span>
                <span className="text-[10px] text-slate-300 block mt-0.5 leading-snug">
                  Bila dicentang, kotak hadiah akan terkunci di pojok layar hingga tepat tanggal jadwal tiba (kecuali Admin menekan Kirim Manual Sekarang).
                </span>
              </div>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoPopupEnabled}
                  onChange={(e) => setAutoPopupEnabled(e.target.checked)}
                />
                <span className="font-bold text-slate-200">Layar Blur Otomatis</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span className="font-bold text-emerald-300">Status Event Aktif</span>
              </label>
            </div>

            {/* 20+ ADVANCED ADMIN FEATURES SECTION */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3">
              <h4 className="font-black text-amber-300 text-xs flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Pengaturan 20+ Fitur Lanjutan Hadiah &amp; Surat (Frekuensi, Stempel, &amp; Keamanan)</span>
              </h4>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Frekuensi Pengiriman Hadiah
                  </label>
                  <select
                    value={frequencyType}
                    onChange={(e) => setFrequencyType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-200 font-bold text-xs"
                  >
                    <option value="once">Sekali Saja</option>
                    <option value="hourly">Setiap Jam (Hourly)</option>
                    <option value="daily">Setiap Hari (Daily)</option>
                    <option value="weekly">Setiap Minggu (Weekly)</option>
                    <option value="monthly">Setiap Bulan (Monthly)</option>
                    <option value="yearly">Setiap Tahun (Yearly)</option>
                    <option value="custom_recurring">Kustom Berulang</option>
                  </select>
                </div>

                {frequencyType === 'custom_recurring' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      Interval Jam Kustom
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={recurringIntervalHours}
                      onChange={(e) => setRecurringIntervalHours(Math.max(1, Number(e.target.value) || 24))}
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Maks Klaim Per Nasabah
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxRedeemsPerUser}
                    onChange={(e) => setMaxRedeemsPerUser(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-bold text-xs"
                  />
                </div>
              </div>

              {/* =========================================================================
                  KATALOG EKSKLUSIF 108 EFEK & PANGGUNG PERAYAAN 100.000X (WAJIB HANYA 1 PILIHAN)
                 ========================================================================= */}
              <div className="p-3.5 rounded-2xl bg-slate-900/95 border-2 border-amber-400/60 space-y-3 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider inline-block mb-1">
                      💥 {CELEBRATION_EFFECTS_CATALOG.length} EFEK PANGGUNG SINEMATIK 100.000X (9 KATEGORI • 1 PILIHAN AKTIF)
                    </span>
                    <h5 className="font-black text-white text-xs sm:text-sm">
                      Pilih 1 Tema Perayaan untuk Hiasan Sebelum Diklaim &amp; Panggung 100.000x Saat Diklaim
                    </h5>
                    <p className="text-[10.5px] text-slate-300 mt-0.5 leading-snug">
                      Dilengkapi <strong>Hitung Mundur 3-2-1 Dramatis, Portal 3D, 14 Sinar Laser, Parade Maskot Raksasa, Trofi Hologram 3D, Synthesizer Musik Fanfare, &amp; Kombo Klik Interaktif</strong>!
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      handleTestCelebrationEffect(
                        activeCelebrationProfile.id,
                        celebrationIntensity
                      )
                    }
                    className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1.5 shadow-lg shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>
                      💥 Tes Panggung {celebrationIntensity.toUpperCase()}:{' '}
                      {activeCelebrationProfile.primaryEmoji} {activeCelebrationProfile.name}
                    </span>
                  </button>
                </div>

                {/* Intensity Multiplier Selector (1.000x / 10.000x / 100.000x Ultra Max Overdrive) */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-400/40 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10.5px] font-black text-amber-300">
                      ⚡ Tingkat Intensitas Panggung Selebrasi (Multiplier):
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 font-mono font-black text-[9.5px]">
                      Mode Aktif: {celebrationIntensity.toUpperCase()}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {CELEBRATION_INTENSITY_OPTIONS.map((opt) => {
                      const isActiveInt = celebrationIntensity === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setCelebrationIntensity(opt.id)}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                            isActiveInt
                              ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 border-white font-black shadow-lg'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/50'
                          }`}
                        >
                          <div className="text-[11px] font-black">{opt.label}</div>
                          <div
                            className={`text-[9px] leading-tight mt-0.5 ${
                              isActiveInt ? 'text-slate-900 font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {opt.badgeText} • {opt.particleCount} Partikel &amp; {opt.laserBeamCount} Laser
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active Selected Single Celebration Summary Box */}
                <div
                  className={`p-3 rounded-xl bg-gradient-to-r ${activeCelebrationProfile.bannerGradientClass} border ${activeCelebrationProfile.cardBorderAccentClass} flex flex-wrap items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-950/70 border border-white/25 flex items-center justify-center text-xl shrink-0">
                      {activeCelebrationProfile.primaryEmoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/85 text-amber-300 font-black text-[9.5px] uppercase tracking-wider">
                          ✓ 1 EFEK TERPILIH • {celebrationIntensity.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-white/90">
                          {activeCelebrationProfile.categoryLabel}
                        </span>
                      </div>
                      <h6 className="font-black text-white text-xs sm:text-sm truncate">
                        {activeCelebrationProfile.name}
                      </h6>
                      <p className="text-[10px] text-white/85 truncate">
                        {activeCelebrationProfile.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-950/65 px-2.5 py-1 rounded-lg border border-white/15">
                    {activeCelebrationProfile.particleEmojis.map((em, idx) => (
                      <span key={idx} className="text-sm select-none">
                        {em}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Category Filter Buttons & Search Input */}
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {CELEBRATION_CATEGORIES.map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setCelebCategoryFilter(cat.key)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border transition ${
                          celebCategoryFilter === cat.key
                            ? 'bg-amber-400 text-slate-950 border-amber-200 shadow'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {cat.emoji} {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={celebSearchQuery}
                      onChange={(e) => setCelebSearchQuery(e.target.value)}
                      placeholder={`Cari dari ${CELEBRATION_EFFECTS_CATALOG.length} perayaan (contoh: Ulang Tahun, 17 Agustus, Idul Fitri, Cyberpunk, Anime, Galaksi, Sultan...)`}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px]"
                    />
                  </div>
                </div>

                {/* Exclusive Single-Select Celebration Grid (Radio Cards) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {filteredCelebrations.map((item) => {
                    const isSelected = activeCelebrationProfile.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setCelebrationEffect(item.id);
                          setThemeColor(item.recommendedThemeColor);
                        }}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setCelebrationEffect(item.id);
                            setThemeColor(item.recommendedThemeColor);
                          }
                        }}
                        className={`p-2.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                          isSelected
                            ? 'bg-gradient-to-br from-amber-500/25 via-slate-900 to-slate-950 border-amber-400 shadow-lg ring-1 ring-amber-300/50'
                            : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 border ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border-white font-black'
                                  : 'bg-slate-900 border-slate-700'
                              }`}
                            >
                              {item.primaryEmoji}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="font-black text-white text-[11px] truncate">
                                  {item.name}
                                </span>
                              </div>
                              <span className="text-[9.5px] text-slate-400 block line-clamp-1">
                                {item.description}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase shrink-0 ${
                              isSelected
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-slate-900 text-slate-400 border border-slate-800'
                            }`}
                          >
                            {isSelected ? '● Dipilih' : 'Pilih'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-slate-800/80">
                          <div className="flex items-center gap-1 text-xs">
                            {item.particleEmojis.slice(0, 5).map((em, i) => (
                              <span key={i} className="select-none">
                                {em}
                              </span>
                            ))}
                          </div>
                          {item.id !== 'none' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCelebrationEffect(item.id);
                                setThemeColor(item.recommendedThemeColor);
                                handleTestCelebrationEffect(item.id);
                              }}
                              className="px-2 py-0.5 rounded-md bg-amber-400/20 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/50 text-amber-200 font-black text-[9.5px] cursor-pointer transition"
                            >
                              ✨ Tes Efek
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sound Effect Selector */}
                <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-300">
                    Efek Suara Pendamping Perayaan:
                  </label>
                  <select
                    value={soundEffect}
                    onChange={(e) => setSoundEffect(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold text-xs"
                  >
                    <option value="chime">Chime Emas Khas</option>
                    <option value="harp">Petikan Harpa Royal</option>
                    <option value="fanfare">Fanfare Raja</option>
                    <option value="silent">Senyap / Silent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Teks Stempel Khusus Surat
                  </label>
                  <input
                    type="text"
                    value={customStampText}
                    onChange={(e) => setCustomStampText(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-amber-200 font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Teks Watermark Surat
                  </label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-cyan-200 font-bold text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Token Keamanan Hash
                  </label>
                  <input
                    type="text"
                    value={securityHashToken}
                    onChange={(e) => setSecurityHashToken(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Tag Audit Log Admin
                  </label>
                  <input
                    type="text"
                    value={adminAuditLogTag}
                    onChange={(e) => setAdminAuditLogTag(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyOnlyAdminVerifiedUsers}
                    onChange={(e) => setNotifyOnlyAdminVerifiedUsers(e.target.checked)}
                  />
                  <span className="font-bold text-amber-300 text-[11px]">
                    Notifikasi Hanya untuk Pengguna yang Pernah Akses Panel Admin dengan Benar
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRotateRecurring}
                    onChange={(e) => setAutoRotateRecurring(e.target.checked)}
                  />
                  <span className="font-bold text-slate-200 text-[11px]">
                    Rotasi Otomatis Hadiah Saat Jadwal Berulang Tiba
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowTransferableGift}
                    onChange={(e) => setAllowTransferableGift(e.target.checked)}
                  />
                  <span className="font-bold text-slate-200 text-[11px]">
                    Izinkan Hadiah Ditransfer ke Nasabah Lain
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
                Tema Warna Kotak &amp; Surat
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['amber', 'emerald', 'rose', 'indigo'] as const).map((clr) => (
                  <button
                    key={clr}
                    type="button"
                    onClick={() => setThemeColor(clr)}
                    className={`py-2 rounded-xl font-bold capitalize cursor-pointer border ${
                      themeColor === clr
                        ? 'bg-white text-slate-950 border-white'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}
                  >
                    {clr}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleSave(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 font-black cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{editingEventId ? 'Simpan Perubahan' : 'Simpan Jadwal Hadiah'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-lg"
              >
                <Send className="w-4 h-4" />
                <span>Simpan &amp; Kirim Sekarang!</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: 58-Reward Multi-Builder (Fixed or Gacha + Role Selector + Custom Trial Duration) (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>
                  Pilih &amp; Atur Hadiah ({selectedRewards.length} / {GIFT_REWARD_CATALOG.length} Macam Hadiah)
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tersedia tepat <strong>{GIFT_REWARD_CATALOG.length} macam hadiah</strong> dengan{' '}
                <strong>Sub-Pilihan Varian</strong> di dalam hadiah &amp; banyak <strong>Fitur Trial</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAllCatalog}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-300 font-bold cursor-pointer whitespace-nowrap"
              >
                Pilih Semua ({GIFT_REWARD_CATALOG.length})
              </button>
              <button
                type="button"
                onClick={() => setSelectedRewards([])}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold cursor-pointer whitespace-nowrap"
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
                      ? cat === 'Hadiah Role'
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : cat === 'Hadiah Trial'
                        ? 'bg-cyan-400 text-slate-950 font-black'
                        : 'bg-amber-400 text-slate-950 font-black'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={rewardSearch}
                onChange={(e) => setRewardSearch(e.target.value)}
                placeholder={`Cari ${GIFT_REWARD_CATALOG.length} hadiah...`}
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
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-black">
                              {meta.subOptions.length} PILIHAN
                            </span>
                          )}
                          {meta.isRoleGrant && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] font-black">
                              ROLE
                            </span>
                          )}
                          {meta.isTrial && (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-[9px] font-black">
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
                      {/* Interactive Sub-Options Picker inside the clicked Reward */}
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
                                  onClick={() => {
                                    updateRewardItem(meta.type, {
                                      selectedSubOptionId: sub.id,
                                      selectedSubOptionLabel: sub.label,
                                      unitLabel: sub.unitLabelOverride ?? meta.unitLabel,
                                      amount: sub.defaultAmountOverride ?? selectedItem.amount,
                                      trialDurationMinutes:
                                        sub.defaultTrialMinutesOverride ??
                                        selectedItem.trialDurationMinutes ??
                                        meta.defaultTrialMinutes,
                                    });
                                  }}
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

                      {/* Role Selector when meta.isRoleGrant (for specific permanent/trial Role) */}
                      {(meta.type === 'role_grant_permanent' || meta.type === 'role_grant_trial') && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-amber-300 font-bold flex items-center gap-1 shrink-0">
                            <Crown className="w-3.5 h-3.5" />
                            <span>Pilih Role Hadiah:</span>
                          </span>
                          <select
                            value={selectedItem.targetDevRoleId || devRoles[0]?.id || 'dev_1'}
                            onChange={(e) =>
                              updateRewardItem(meta.type, { targetDevRoleId: e.target.value })
                            }
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-amber-400/50 text-amber-200 font-bold text-xs"
                          >
                            {devRoles.map((r) => (
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

                      {/* Fixed vs Gacha Switch (hidden for direct Role/Card-Tier picks) */}
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

                      {/* Custom Trial Duration Control */}
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
                            (Otomatis berakhir dalam{' '}
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

      {/* PUSAT PENGELOLAAN SURAT & HADIAH YANG SUDAH DIKIRIM / DIJADWALKAN */}
      <div className="bg-slate-900/90 border-2 border-amber-400/50 rounded-3xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-white text-base flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              <span>
                Pusat Kelola Surat &amp; Hadiah yang Sudah Dikirim / Dijadwalkan ({giftEvents.length} Paket)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Atur kembali surat &amp; hadiah kapan saja: <strong>Edit Ulang Isi/Mode/Penerima</strong>,{' '}
              <strong>Reset Status Klaim &amp; Baca</strong> (per pengguna atau semua),{' '}
              <strong>Tarik Kembali / Batalkan</strong> dari pengguna tertentu, atau{' '}
              <strong>Duplikasi &amp; Kirim Ulang Instan</strong>!
            </p>
          </div>
        </div>

        {giftEvents.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-950/80 border border-slate-800 text-center space-y-2">
            <Gift className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm font-black text-white">
              Belum Ada Paket Hadiah &amp; Surat (0 Paket)
            </p>
            <p className="text-xs text-slate-400">
              Seluruh paket yang telah dihapus tersimpan permanen di Cloud Firestore dan akan tetap kosong (0 paket) meski halaman di-refresh di HP maupun laptop.
            </p>
          </div>
        ) : (
        <div className="grid grid-cols-1 gap-4">
          {giftEvents.map((ev) => {
            const evMode = ev.deliveryContentMode || 'both';
            const isManagingThis = managingEventId === ev.id;
            const targetIds =
              Array.isArray(ev.targetAccountIds) && ev.targetAccountIds.length > 0
                ? ev.targetAccountIds
                : ev.targetAccountId &&
                  ev.targetAccountId !== '__ALL__' &&
                  ev.targetAccountId !== '__MULTI__'
                ? [ev.targetAccountId]
                : [];
            const isAllTarget = !ev.targetAccountId || ev.targetAccountId === '__ALL__';
            const targetAccountsForEvent = isAllTarget
              ? accounts
              : accounts.filter(
                  (a) =>
                    targetIds.includes(a.id) ||
                    (ev.transferredToAccountIds || []).includes(a.id)
                );
            const filteredManageAccounts = targetAccountsForEvent.filter((acc) => {
              if (!manageRecipientSearch.trim()) return true;
              const q = manageRecipientSearch.toLowerCase();
              return (
                acc.fullName.toLowerCase().includes(q) ||
                acc.accountNumber.toLowerCase().includes(q)
              );
            });

            return (
              <div
                key={ev.id}
                className={`p-5 rounded-3xl border-2 space-y-3.5 transition-all ${
                  ev.isActive
                    ? 'bg-slate-950/95 border-amber-400/60 shadow-xl'
                    : 'bg-slate-950/50 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] tabular-nums">
                        📅 {ev.scheduleLabel}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-black text-[10px] ${
                          evMode === 'letter_only'
                            ? 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-200'
                            : evMode === 'gift_only'
                            ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-200'
                            : 'bg-amber-500/20 border border-amber-400/50 text-amber-200'
                        }`}
                      >
                        {evMode === 'letter_only'
                          ? '✉️ Mode: Surat Saja'
                          : evMode === 'gift_only'
                          ? '🎁 Mode: Hadiah Saja'
                          : '👑 Mode: Hadiah & Surat Sekaligus'}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-bold text-[10px]">
                        👥 Penerima:{' '}
                        {isAllTarget
                          ? `Semua Nasabah (${accounts.length} Akun)`
                          : targetIds.length === 1
                          ? (() => {
                              const singleAcc = accounts.find((a) => a.id === targetIds[0]);
                              return singleAcc
                                ? `${singleAcc.fullName} (${singleAcc.accountNumber})`
                                : '1 Akun Spesifik';
                            })()
                          : `${targetIds.length} Akun Terpilih`}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          ev.isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {ev.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                      {ev.strictDateLock !== false && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                          🔒 Terkunci Tanggal
                        </span>
                      )}
                      {evMode !== 'letter_only' && ev.rewards.some((r) => r.rewardMode === 'gacha') && (
                        <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-bold text-[10px]">
                          🎲 Gacha
                        </span>
                      )}
                      {(() => {
                        const evCeleb = getCelebrationEffectProfile(ev.celebrationEffect);
                        const evInt = ev.celebrationIntensity || '100000x';
                        return (
                          <button
                            type="button"
                            onClick={() => handleTestCelebrationEffect(evCeleb.id, evInt)}
                            title="Klik untuk memutar pratinjau panggung perayaan 100.000x paket ini"
                            className="px-2.5 py-0.5 rounded-full bg-amber-400/20 hover:bg-amber-400 hover:text-slate-950 border border-amber-300/50 text-amber-200 font-black text-[10px] cursor-pointer transition flex items-center gap-1"
                          >
                            <span>{evCeleb.shortBadge}</span>
                            <span className="opacity-90">({evInt.toUpperCase()})</span>
                            <span className="underline">• Tes Panggung</span>
                          </button>
                        );
                      })()}
                    </div>
                    <h4 className="font-black text-white text-sm sm:text-base">{ev.title}</h4>
                    <span className="text-[11px] text-amber-200 font-semibold block">
                      Pengirim: {ev.senderName}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 font-bold">
                      ✓ Diklaim: {(ev.claimedByAccountIds || []).length} akun
                    </span>
                    <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-bold">
                      ✉️ Dibuka/Dibaca: {(ev.viewedByAccountIds || []).length} akun
                    </span>
                    {(ev.revokedAccountIds || []).length > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 font-bold">
                        🚫 Ditarik: {(ev.revokedAccountIds || []).length} akun
                      </span>
                    )}
                  </div>
                </div>

                {evMode !== 'gift_only' && (
                  <p className="text-[11px] text-slate-300 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800/90 line-clamp-2">
                    <strong className="text-amber-300">Isi Surat:</strong> {ev.letterMessage}
                  </p>
                )}

                {evMode !== 'letter_only' && (
                  <div className="flex flex-wrap gap-1.5">
                    {ev.rewards.slice(0, 6).map((r) => (
                      <span
                        key={r.id}
                        className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-200"
                      >
                        {r.emoji} {r.label}{' '}
                        {r.rewardMode === 'gacha'
                          ? '[🎲 Gacha]'
                          : r.type.startsWith('role_')
                          ? ''
                          : `(${r.amount.toLocaleString('id-ID')})`}
                      </span>
                    ))}
                    {ev.rewards.length > 6 && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                        +{ev.rewards.length - 6} lainnya
                      </span>
                    )}
                  </div>
                )}

                {/* BARIS TOMBOL UTAMA PENGELOLAAN KIRIMAN */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminTriggerGiftEventNow(ev.id);
                      setFeedback(res.message);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap shadow"
                  >
                    <Send className="w-3 h-3" />
                    <span>Kirim / Siarkan Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setManagingEventId((prev) => (prev === ev.id ? null : ev.id))
                    }
                    className={`px-3 py-1.5 rounded-xl font-black text-[11px] cursor-pointer flex items-center gap-1.5 whitespace-nowrap border ${
                      isManagingThis
                        ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                        : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                    }`}
                  >
                    <Sliders className="w-3 h-3" />
                    <span>
                      {isManagingThis
                        ? 'Tutup Panel Kelola'
                        : 'Kelola Kiriman & Penerima'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const res = adminResetGiftEventStatus(ev.id, {
                        resetType: 'all',
                        retriggerPopup: true,
                      });
                      setFeedback(res.message);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Semua Klaim &amp; Baca</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const res = adminDuplicateGiftEvent(ev.id, { sendNow: true });
                      setFeedback(res.message);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-fuchsia-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplikasi &amp; Kirim Ulang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openGiftEventModal(ev.id, true)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Preview Penerima</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadEventIntoEditor(ev)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit Lengkap di Form</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => adminToggleGiftEventActive(ev.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Power className="w-3 h-3" />
                    <span>{ev.isActive ? 'Nonaktifkan' : 'Aktifkan'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const res = adminDeleteGiftEvent(ev.id);
                      setFeedback(res.message);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>

                {/* PANEL KELOLA KIRIMAN & PENERIMA (EXPANDABLE DRAWER PER EVENT) */}
                {isManagingThis && (
                  <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-cyan-400/60 space-y-4 animate-fadeIn">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
                      <div>
                        <h5 className="font-black text-cyan-200 text-xs sm:text-sm flex items-center gap-1.5">
                          <Sliders className="w-4 h-4 text-cyan-400" />
                          <span>Pengaturan Ulang &amp; Kendali Penerima: {ev.title}</span>
                        </h5>
                        <span className="text-[10px] text-slate-400 block">
                          Ubah mode isi kiriman secara instan, reset status klaim/baca per pengguna, atau tarik kembali (batalkan) kiriman dari pengguna tertentu.
                        </span>
                      </div>

                      {/* Quick Mode Switcher for Already-Sent Package */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-300">Ubah Mode Cepat:</span>
                        {(
                          [
                            { id: 'both', label: '🎁+✉️ Keduanya' },
                            { id: 'letter_only', label: '✉️ Surat Saja' },
                            { id: 'gift_only', label: '🎁 Hadiah Saja' },
                          ] as const
                        ).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              const res = adminUpdateGiftEventQuickSettings(ev.id, {
                                deliveryContentMode: m.id,
                                retriggerPopup: false,
                              });
                              setFeedback(res.message);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer border ${
                              evMode === m.id
                                ? 'bg-amber-400 text-slate-950 border-amber-200'
                                : 'bg-slate-950 text-slate-300 border-slate-700 hover:text-white'
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Quick Celebration Effect Switcher (108 Celebrations + Intensity 100,000x, Live Sync to Cloud RTDB) */}
                    <div className="p-3 rounded-xl bg-slate-950 border border-amber-400/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {getCelebrationEffectProfile(ev.celebrationEffect).primaryEmoji}
                        </span>
                        <div>
                          <span className="text-[11px] font-black text-amber-200 block">
                            💥 Ganti Cepat Efek ({CELEBRATION_EFFECTS_CATALOG.length} Tema) &amp; Intensitas Panggung 100.000x:
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Langsung mengubah hiasan sebelum diklaim &amp; panggung sinematik saat diklaim secara real-time.
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={getCelebrationEffectProfile(ev.celebrationEffect).id}
                          onChange={(e) => {
                            const nextId = e.target.value;
                            const res = adminUpdateGiftEventQuickSettings(ev.id, {
                              celebrationEffect: nextId,
                              retriggerPopup: false,
                            });
                            setFeedback(res.message);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-400/50 text-white font-bold text-[11px]"
                        >
                          {CELEBRATION_EFFECTS_CATALOG.map((cel) => (
                            <option key={cel.id} value={cel.id}>
                              {cel.primaryEmoji} {cel.name} ({cel.categoryLabel})
                            </option>
                          ))}
                        </select>
                        <select
                          value={ev.celebrationIntensity || '100000x'}
                          onChange={(e) => {
                            const nextInt = e.target.value as CelebrationIntensityLevel;
                            const res = adminUpdateGiftEventQuickSettings(ev.id, {
                              celebrationIntensity: nextInt,
                              retriggerPopup: false,
                            });
                            setFeedback(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-cyan-400/50 text-cyan-200 font-black text-[11px]"
                        >
                          {CELEBRATION_INTENSITY_OPTIONS.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() =>
                            handleTestCelebrationEffect(
                              getCelebrationEffectProfile(ev.celebrationEffect).id,
                              ev.celebrationIntensity || '100000x'
                            )
                          }
                          className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10.5px] cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Tes Panggung</span>
                        </button>
                      </div>
                    </div>

                    {/* Bulk Reset Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[11px] font-bold text-slate-200">
                        Aksi Reset Massal untuk Semua Penerima Paket Ini:
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminResetGiftEventStatus(ev.id, {
                              resetType: 'all',
                              retriggerPopup: true,
                            });
                            setFeedback(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-bold text-[10px] cursor-pointer"
                        >
                          🔄 Reset Klaim Hadiah &amp; Status Baca (Semua)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminResetGiftEventStatus(ev.id, {
                              resetType: 'claim_only',
                              retriggerPopup: true,
                            });
                            setFeedback(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-bold text-[10px] cursor-pointer"
                        >
                          🎁 Reset Status Klaim Hadiah Saja
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = adminResetGiftEventStatus(ev.id, {
                              resetType: 'letter_only',
                              retriggerPopup: true,
                            });
                            setFeedback(res.message);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-[10px] cursor-pointer"
                        >
                          ✉️ Reset Status Baca Surat Saja
                        </button>
                      </div>
                    </div>

                    {/* Per-Recipient Status Table & Individual Controls */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-black text-white">
                          Daftar Pengguna Penerima ({filteredManageAccounts.length} Akun):
                        </span>
                        <div className="relative w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={manageRecipientSearch}
                            onChange={(e) => setManageRecipientSearch(e.target.value)}
                            placeholder="Cari nama / no. rekening penerima..."
                            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-[11px] text-white"
                          />
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                        {filteredManageAccounts.map((acc) => {
                          const hasClaimed = (ev.claimedByAccountIds || []).includes(acc.id);
                          const hasReadLetter =
                            (ev.letterOpenedByAccountIds || []).includes(acc.id) ||
                            (ev.viewedByAccountIds || []).includes(acc.id);
                          const isRevoked = (ev.revokedAccountIds || []).includes(acc.id);

                          return (
                            <div
                              key={acc.id}
                              className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                                isRevoked
                                  ? 'bg-rose-950/40 border-rose-500/50 opacity-80'
                                  : 'bg-slate-950/90 border-slate-800'
                              }`}
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-bold text-white text-xs">
                                    {acc.fullName}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    ({acc.accountNumber})
                                  </span>
                                  {isRevoked ? (
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-black text-[9.5px]">
                                      🚫 Ditarik Kembali / Dibatalkan
                                    </span>
                                  ) : (
                                    <>
                                      {evMode !== 'gift_only' && (
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                            hasReadLetter
                                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                                              : 'bg-slate-800 text-slate-400'
                                          }`}
                                        >
                                          {hasReadLetter ? '✉️ Surat Dibaca' : '✉️ Belum Dibaca'}
                                        </span>
                                      )}
                                      {evMode !== 'letter_only' && (
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-bold ${
                                            hasClaimed
                                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                                              : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                                          }`}
                                        >
                                          {hasClaimed ? '🎁 Sudah Diklaim' : '🎁 Belum Diklaim'}
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = adminResetGiftEventStatus(ev.id, {
                                      accountId: acc.id,
                                      resetType: 'all',
                                      retriggerPopup: true,
                                    });
                                    setFeedback(res.message);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 font-bold text-[10px] cursor-pointer flex items-center gap-1"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Reset Klaim &amp; Baca</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = adminToggleRevokeGiftEventRecipient(ev.id, acc.id);
                                    setFeedback(res.message);
                                  }}
                                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] cursor-pointer flex items-center gap-1 border ${
                                    isRevoked
                                      ? 'bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-400/50 text-cyan-200'
                                      : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-400/50 text-rose-200'
                                  }`}
                                >
                                  {isRevoked ? (
                                    <>
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Pulihkan Kiriman</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3" />
                                      <span>Tarik Kembali / Batalkan</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
};
