/**
 * AdminGiftEventPanel
 * Pusat Kendali Hadiah & Surat (58 Macam Hadiah, Hadiah Role Permanen/Trial, Gacha Min–Max %,
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
  const [triggerMode, setTriggerMode] = useState<'scheduled_date' | 'manual_instant' | 'both'>('both');
  const [autoPopupEnabled, setAutoPopupEnabled] = useState<boolean>(true);
  const [strictDateLock, setStrictDateLock] = useState<boolean>(true);
  const [scheduleMonth, setScheduleMonth] = useState<number>(1);
  const [scheduleDay, setScheduleDay] = useState<number>(29);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [targetAccountId, setTargetAccountId] = useState<string>('__ALL__');
  const [themeColor, setThemeColor] = useState<'amber' | 'emerald' | 'rose' | 'indigo'>('amber');

  // Custom Signature & Stamp settings for this event (or use Default Global)
  const [sealScope, setSealScope] = useState<'global' | 'custom'>('global');
  const [customSealDraft, setCustomSealDraft] = useState<LetterSignatureStampConfig>(() => {
    try {
      const savedDraft = localStorage.getItem('bank_nusantara_custom_seal_draft_v1');
      if (savedDraft) {
        return { ...defaultLetterSealConfig, ...JSON.parse(savedDraft) };
      }
    } catch { /* empty */ }
    return defaultLetterSealConfig;
  });
  const [showSealStudio, setShowSealStudio] = useState<boolean>(true);

  // 20+ Advanced Admin Features State
  const [frequencyType, setFrequencyType] = useState<'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom_recurring'>('monthly');
  const [recurringIntervalHours, setRecurringIntervalHours] = useState<number>(24);
  const [autoRotateRecurring, setAutoRotateRecurring] = useState<boolean>(false);
  const [maxRedeemsPerUser, setMaxRedeemsPerUser] = useState<number>(1);
  const [targetCardTier, setTargetCardTier] = useState<string>('all');
  const [targetDevRoleOnly, setTargetDevRoleOnly] = useState<string>('');
  const [celebrationEffect, setCelebrationEffect] = useState<'confetti' | 'gold_rain' | 'fireworks' | 'none'>('confetti');
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
  const [allowTransferableGift, setAllowTransferableGift] = useState<boolean>(false);

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
        r.category.toLowerCase().includes(q)
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
    setSelectedRewards((prev) => [
      ...prev,
      {
        id: `rew-${type}-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        type: meta.type,
        label: meta.label,
        amount: meta.defaultAmount,
        unitLabel: meta.unitLabel,
        emoji: meta.emoji,
        rewardMode: 'fixed',
        trialDurationMinutes: meta.defaultTrialMinutes,
        targetDevRoleId: meta.isRoleGrant ? devRoles[0]?.id : undefined,
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
        return {
          id: `rew-all-${idx}-${Date.now()}`,
          type: meta.type,
          label: meta.label,
          amount: meta.defaultAmount,
          unitLabel: meta.unitLabel,
          emoji: meta.emoji,
          rewardMode: 'fixed',
          trialDurationMinutes: meta.defaultTrialMinutes,
          targetDevRoleId: meta.isRoleGrant ? devRoles[0]?.id : undefined,
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
    setTriggerMode('both');
    setAutoPopupEnabled(true);
    setStrictDateLock(true);
    setScheduleMonth(1);
    setScheduleDay(29);
    setIsActive(true);
    setTargetAccountId('__ALL__');
    setThemeColor('amber');
    setSealScope('global');
    setCustomSealDraft(defaultLetterSealConfig);
    setFrequencyType('monthly');
    setRecurringIntervalHours(24);
    setAutoRotateRecurring(false);
    setMaxRedeemsPerUser(1);
    setTargetCardTier('all');
    setTargetDevRoleOnly('');
    setCelebrationEffect('confetti');
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
    setAllowTransferableGift(false);
  };

  const loadEventIntoEditor = (ev: AdminGiftEventPackage) => {
    setEditingEventId(ev.id);
    setTitle(ev.title);
    setSenderName(ev.senderName);
    setLetterMessage(ev.letterMessage);
    setTriggerMode(ev.triggerMode);
    setAutoPopupEnabled(ev.autoPopupEnabled);
    setStrictDateLock(ev.strictDateLock !== undefined ? ev.strictDateLock : true);
    setScheduleMonth(ev.scheduleMonth);
    setScheduleDay(ev.scheduleDay);
    setIsActive(ev.isActive);
    setTargetAccountId(ev.targetAccountId || '__ALL__');
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
    setCelebrationEffect(ev.celebrationEffect || 'confetti');
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
    setAllowTransferableGift(ev.allowTransferableGift ?? false);

    setFeedback(`Mengedit paket "${ev.title}" (Pengirim: ${ev.senderName}).`);
  };

  const handleSave = (alsoSendNow: boolean) => {
    if (selectedRewards.length === 0) {
      setFeedback(`Pilih minimal 1 hadiah dari daftar ${GIFT_REWARD_CATALOG.length} macam hadiah!`);
      return;
    }
    const res = adminCreateOrUpdateGiftEvent({
      id: editingEventId || undefined,
      title,
      senderName,
      letterMessage,
      triggerMode,
      autoPopupEnabled,
      strictDateLock,
      isGachaBox: selectedRewards.some((r) => r.rewardMode === 'gacha'),
      scheduleMonth,
      scheduleDay,
      isActive,
      targetAccountId,
      themeColor,
      rewards: selectedRewards,
      customSealConfig: sealScope === 'custom' ? customSealDraft : null,
      frequencyType,
      recurringIntervalHours,
      autoRotateRecurring,
      maxRedeemsPerUser,
      targetCardTier: targetCardTier as any,
      targetDevRoleOnly,
      celebrationEffect,
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

  return (
    <div className="space-y-6 text-xs">
      {/* Header & Date Simulation Banner */}
      <div className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-rose-950/80 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1.5">
            <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-block">
              🎁 HADIAH &amp; SURAT ROYAL ({GIFT_REWARD_CATALOG.length} MACAM HADIAH + ROLE + GACHA + STEMPEL &amp; TTD)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Atur Kotak Hadiah, 50+ Hadiah &amp; Role, Gacha Min–Max %, Tanda Tangan &amp; Stempel
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Pilih dari <strong>{GIFT_REWARD_CATALOG.length} jenis hadiah</strong> (termasuk <strong>Hadiah Role Dev Permanen/Trial</strong> &amp; Mode <strong>🎲 Gacha Min–Max %</strong>), aktifkan <strong>Kunci Ketat Tanggal</strong>, serta atur desain <strong>Tanda Tangan Gambar / 5 Template Huruf</strong> &amp; <strong>5 Template Stempel</strong>!
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
                try {
                  localStorage.setItem('bank_nusantara_custom_seal_draft_v1', JSON.stringify(nextCfg));
                } catch { /* empty */ }
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Tanggal (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={scheduleDay}
                  onChange={(e) => setScheduleDay(Math.min(31, Math.max(1, Number(e.target.value) || 1)))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Bulan Jadwal
                </label>
                <select
                  value={scheduleMonth}
                  onChange={(e) => setScheduleMonth(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                >
                  {MONTHS_INDO.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Mode Pengiriman
                </label>
                <select
                  value={triggerMode}
                  onChange={(e) => setTriggerMode(e.target.value as 'scheduled_date' | 'manual_instant' | 'both')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-200 font-semibold"
                >
                  <option value="both">Otomatis Tanggal + Manual</option>
                  <option value="scheduled_date">Hanya Otomatis Tanggal</option>
                  <option value="manual_instant">Hanya Kirim Manual</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Target Nasabah
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-emerald-200 font-semibold"
                >
                  <option value="__ALL__">Semua Nasabah ({accounts.length})</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} ({acc.accountNumber})
                    </option>
                  ))}
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Efek Perayaan Visual
                  </label>
                  <select
                    value={celebrationEffect}
                    onChange={(e) => setCelebrationEffect(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs"
                  >
                    <option value="confetti">Konfeti Warna-Warni</option>
                    <option value="gold_rain">Hujan Emas Sulta</option>
                    <option value="fireworks">Kembang Api Megah</option>
                    <option value="none">Tanpa Efek</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-300 block mb-1">
                    Efek Suara Perayaan
                  </label>
                  <select
                    value={soundEffect}
                    onChange={(e) => setSoundEffect(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold text-xs"
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
                Tersedia <strong>{GIFT_REWARD_CATALOG.length} macam hadiah</strong> (50+ variasi termasuk <strong>Hadiah Role Permanen/Trial</strong> &amp; Mode <strong>Gacha Min–Max %</strong>).
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
                placeholder="Cari 58 hadiah..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-[560px] overflow-y-auto pr-1">
            {visibleCatalog.map((meta) => {
              const selectedItem = selectedRewards.find((r) => r.type === meta.type);
              const isSelected = Boolean(selectedItem);
              const trialDecoded = minutesToAmountAndUnit(
                selectedItem?.trialDurationMinutes || meta.defaultTrialMinutes
              );

              return (
                <div
                  key={meta.type}
                  className={`p-3.5 rounded-2xl border transition-all space-y-2.5 ${
                    isSelected
                      ? meta.isRoleGrant
                        ? 'bg-amber-950/45 border-amber-400/80'
                        : meta.isTrial
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
                      {isSelected ? '✓ Dipilih' : '+ Tambah'}
                    </button>
                  </div>

                  {selectedItem && (
                    <div className="space-y-2.5 pt-2 border-t border-white/10">
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

                      {/* Fixed vs Gacha Switch (hidden for direct Role picks, enabled for numeric/everything else) */}
                      {!meta.isRoleGrant && (
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
                                step={meta.step}
                                value={selectedItem.amount}
                                onChange={(e) =>
                                  updateRewardItem(meta.type, {
                                    amount: Math.max(1, Number(e.target.value) || 1),
                                  })
                                }
                                className="w-28 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold text-xs tabular-nums"
                              />
                              <span className="text-[10px] text-slate-400 font-mono">
                                {meta.unitLabel}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Custom Trial Duration Control */}
                      {meta.isTrial && (
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
                              selectedItem.trialDurationMinutes || meta.defaultTrialMinutes
                            )}
                            )
                          </span>
                        </div>
                      )}

                      {/* Inline Multi-Tier Gacha Builder */}
                      {!meta.isRoleGrant &&
                        selectedItem.rewardMode === 'gacha' &&
                        selectedItem.gachaTiers && (
                          <GachaTierBuilder
                            compact
                            tiers={selectedItem.gachaTiers}
                            onChange={(nextTiers) =>
                              updateRewardItem(meta.type, { gachaTiers: nextTiers })
                            }
                            unitLabel={meta.unitLabel}
                            isCurrency={isCurrencyRewardType(meta.type)}
                            step={meta.step}
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

      {/* Scheduled & Manual Event List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="font-black text-white text-base flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span>Daftar Semua Paket &amp; Jadwal Hadiah Surat ({giftEvents.length} Paket)</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {giftEvents.map((ev) => (
            <div
              key={ev.id}
              className={`p-4 rounded-2xl border-2 space-y-3 ${
                ev.isActive
                  ? 'bg-slate-950/90 border-amber-400/50'
                  : 'bg-slate-950/50 border-slate-800 opacity-70'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] tabular-nums">
                      📅 {ev.scheduleLabel}
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
                    {ev.rewards.some((r) => r.rewardMode === 'gacha') && (
                      <span className="px-2 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 font-bold text-[10px]">
                        🎲 Gacha
                      </span>
                    )}
                    {ev.customSealConfig && (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-[10px]">
                        ✒️ TTD/Stempel Khusus
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-white text-sm">{ev.title}</h4>
                  <span className="text-[11px] text-amber-200 font-semibold block">
                    Pengirim Surat: {ev.senderName}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 line-clamp-2">{ev.letterMessage}</p>

              <div className="flex flex-wrap gap-1.5">
                {ev.rewards.slice(0, 5).map((r) => (
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
                {ev.rewards.length > 5 && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 text-[10px] font-bold">
                    +{ev.rewards.length - 5} lainnya
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800/80">
                <span>
                  Diklaim: {(ev.claimedByAccountIds || []).length} akun • Dibuka:{' '}
                  {(ev.viewedByAccountIds || []).length} akun
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const res = adminTriggerGiftEventNow(ev.id);
                    setFeedback(res.message);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <Send className="w-3 h-3" />
                  <span>Kirim Manual Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={() => openGiftEventModal(ev.id, true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <Eye className="w-3 h-3" />
                  <span>Preview Royal</span>
                </button>

                <button
                  type="button"
                  onClick={() => loadEventIntoEditor(ev)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer flex items-center gap-1 whitespace-nowrap"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Edit</span>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
