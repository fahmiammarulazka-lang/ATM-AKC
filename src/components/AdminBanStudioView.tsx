/**
 * Studio Pengaturan & Live Preview Banned Real-Time (50 Fitur Lengkap Panel Admin)
 * Tata Letak Split:
 * - Kiri: Panel Kontrol Lengkap (Target Akun, Kelola Akun Banned Aktif, Durasi Permanen/Trial,
 *         4 Mode Alasan [Tanpa Alasan / 30 Alasan Sistem / 20 Preset Cepat / Custom],
 *         Centang 3 Tombol Tinjauan [WA, Email, Tinjau di Sini] + Label Kuning "★ Disarankan",
 *         4 Tema Warna, 4 Ikon, Aturan Banding, Preset Konfigurasi, Catatan Rahasia Admin, & Log Audit Cloud)
 * - Kanan: Live Preview Real-Time Interaktif (Bisa diklik langsung, mode layar HP / Laptop, & Simulasi Status Banding)
 */
import React, { useState, useMemo } from 'react';
import {
  ShieldBan,
  Eye,
  Smartphone,
  Monitor,
  CheckSquare,
  Square,
  Clock,
  Lock,
  AlertTriangle,
  Gavel,
  MessageCircle,
  Mail,
  FileText,
  Save,
  RotateCcw,
  Unlock,
  Copy,
  Sparkles,
  Users,
  UserCheck,
  History,
  Bookmark,
  Trash2,
  Plus,
  RefreshCw,
  Volume2,
  Calendar,
  CheckCircle2,
  XCircle,
  KeyRound,
  Sliders,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  BanScreenCustomizationConfig,
  BanThemeVariant,
  BanIconVariant,
  BanDurationUnit,
  BanReasonSourceMode,
  BanSoundEffectMode,
  BankAccount,
} from '../types/bank';
import {
  SYSTEM_BAN_REASONS_30,
  QUICK_BAN_PRESETS_20,
  DEFAULT_BAN_SCREEN_CONFIG,
  DEFAULT_BAN_CONFIG_PRESETS,
  generateBanCaseId,
  computeDurationMinutesAndLabel,
} from '../data/banStudioCatalog';
import { BanLockScreen } from './BanLockScreen';

export const AdminBanStudioView: React.FC = () => {
  const {
    accounts,
    banSupportConfig,
    adminUpdateBanSupportConfig,
    adminApplyCustomBanConfig,
    adminSaveDefaultBanTemplate,
    adminSaveBanPreset,
    adminDeleteBanPreset,
    adminUnbanCard,
    adminUnbanAllCards,
    adminReviewUnifiedBanAppeal,
    adminResetPinAttempts,
  } = useBank();

  // Selection mode: single account, multiple accounts, or all accounts (Q39)
  const [targetScope, setTargetScope] = useState<'single' | 'multi' | 'all'>('single');
  const [selectedSingleAccountId, setSelectedSingleAccountId] = useState<string>(
    () => accounts[0]?.id || ''
  );
  const [selectedMultiAccountIds, setSelectedMultiAccountIds] = useState<string[]>([]);

  // Live Preview Config State
  const [draftConfig, setDraftConfig] = useState<BanScreenCustomizationConfig>(() => ({
    ...(banSupportConfig.defaultTemplate || DEFAULT_BAN_SCREEN_CONFIG),
    caseId: generateBanCaseId(),
    bannedAt: new Date().toISOString(),
  }));

  // Live Preview Device & Appeal Simulator State (Q41 & Q42)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [simulatedAppealStatus, setSimulatedAppealStatus] = useState<
    'none' | 'pending' | 'rejected' | 'approved'
  >('none');

  // Schedule mode (Q45: Langsung atau Terjadwal)
  const [useScheduledStart, setUseScheduledStart] = useState<boolean>(false);

  // Preset Save Form
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');

  // Global WA & Email Support inputs
  const [globalWa, setGlobalWa] = useState<string>(banSupportConfig.whatsappNumber || '');
  const [globalEmail, setGlobalEmail] = useState<string>(banSupportConfig.emailAddress || '');

  // Appeal Review Admin Reply Note per account
  const [adminAppealReplyMap, setAdminAppealReplyMap] = useState<Record<string, string>>({});

  // Action feedback banner
  const [studioFeedback, setStudioFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Active sub-section tab on Left Control Panel for clean organization
  const [controlSection, setControlSection] = useState<
    'target_manage' | 'duration_reason' | 'buttons_appeal' | 'theme_meta' | 'presets_logs'
  >('duration_reason');

  const bannedAccounts = useMemo(
    () => accounts.filter((a) => a.cardStatus === 'banned' || a.status === 'banned'),
    [accounts]
  );

  const effectiveTargetIds = useMemo(() => {
    if (targetScope === 'all') return accounts.map((a) => a.id);
    if (targetScope === 'multi') return selectedMultiAccountIds;
    return selectedSingleAccountId ? [selectedSingleAccountId] : [];
  }, [targetScope, accounts, selectedMultiAccountIds, selectedSingleAccountId]);

  const primarySelectedAccount: BankAccount | undefined = useMemo(
    () => accounts.find((a) => a.id === effectiveTargetIds[0]) || accounts[0],
    [accounts, effectiveTargetIds]
  );

  // Helper to update draftConfig and recompute durationLabel & expiresAt live
  const updateDraft = (patch: Partial<BanScreenCustomizationConfig>) => {
    setDraftConfig((prev) => {
      const merged: BanScreenCustomizationConfig = { ...prev, ...patch };
      const computed = computeDurationMinutesAndLabel(merged);
      const now = Date.now();
      const nextExpiresAt =
        merged.durationType === 'custom' && computed.durationMinutes
          ? new Date(now + computed.durationMinutes * 60 * 1000).toISOString()
          : undefined;
      return {
        ...merged,
        durationMinutes: computed.durationMinutes,
        durationLabel: computed.durationLabel,
        expiresAt: nextExpiresAt,
      };
    });
  };

  // Load an existing account's ban config into the Live Preview editor (Q6, Q30, Q44)
  const handleLoadAccountIntoStudio = (acc: BankAccount, mode: 'edit' | 'copy') => {
    const sourceCfg =
      acc.banInfo?.customConfig || banSupportConfig.defaultTemplate || DEFAULT_BAN_SCREEN_CONFIG;
    const loaded: BanScreenCustomizationConfig = {
      ...DEFAULT_BAN_SCREEN_CONFIG,
      ...sourceCfg,
      reason: acc.banInfo?.reason ?? sourceCfg.reason ?? sourceCfg.reasonText ?? '',
      reasonText: acc.banInfo?.reason ?? sourceCfg.reasonText ?? sourceCfg.reason ?? '',
      reasonMode:
        acc.banInfo?.reason || sourceCfg.reason || sourceCfg.reasonText
          ? sourceCfg.reasonMode === 'none'
            ? 'custom'
            : sourceCfg.reasonMode
          : 'none',
      showReasonBox:
        Boolean(acc.banInfo?.reason || sourceCfg.reason || sourceCfg.reasonText) &&
        sourceCfg.showReasonBox,
      caseId: mode === 'edit' ? sourceCfg.caseId || generateBanCaseId() : generateBanCaseId(),
      bannedAt: mode === 'edit' ? acc.banInfo?.bannedAt || new Date().toISOString() : new Date().toISOString(),
    };
    setDraftConfig(loaded);
    if (mode === 'edit') {
      setTargetScope('single');
      setSelectedSingleAccountId(acc.id);
      setStudioFeedback({
        type: 'info',
        text: `Sedang mengelola pengaturan Banned milik ${acc.fullName} (${acc.accountNumber}). Ubah pengaturan di bawah lalu klik "Simpan Perubahan" untuk update real-time!`,
      });
    } else {
      setStudioFeedback({
        type: 'info',
        text: `Konfigurasi Banned dari akun ${acc.fullName} berhasil disalin ke Live Preview! Pilih akun tujuan lalu klik "Terapkan Banned".`,
      });
    }
  };

  // Quick add/subtract duration for Trial Ban (Q33)
  const handleQuickAdjustTrialMinutes = (deltaMinutes: number) => {
    const currentMins = draftConfig.durationMinutes || 60;
    const nextMins = Math.max(1, currentMins + deltaMinutes);
    updateDraft({
      durationType: 'custom',
      durationUnit: 'minutes',
      durationValue: nextMins,
    });
  };

  // 4 Main Action Buttons (Q50)
  const handleApplyNewBan = () => {
    const res = adminApplyCustomBanConfig({
      targetAccountIds: effectiveTargetIds,
      config: {
        ...draftConfig,
        scheduledStartAt: useScheduledStart ? draftConfig.scheduledStartAt : undefined,
      },
      isUpdateExisting: false,
    });
    setStudioFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSaveExistingBanChanges = () => {
    const res = adminApplyCustomBanConfig({
      targetAccountIds: effectiveTargetIds,
      config: {
        ...draftConfig,
        scheduledStartAt: useScheduledStart ? draftConfig.scheduledStartAt : undefined,
      },
      isUpdateExisting: true,
    });
    setStudioFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleUnbanSelected = () => {
    if (targetScope === 'all') {
      const res = adminUnbanAllCards();
      setStudioFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      return;
    }
    if (effectiveTargetIds.length === 0) {
      setStudioFeedback({
        type: 'error',
        text: 'Pilih minimal 1 akun untuk dibuka blokirnya (Unban).',
      });
      return;
    }
    let unbannedCount = 0;
    effectiveTargetIds.forEach((id) => {
      const r = adminUnbanCard(id);
      if (r.success) unbannedCount += 1;
    });
    setStudioFeedback({
      type: unbannedCount > 0 ? 'success' : 'error',
      text:
        unbannedCount > 0
          ? `Berhasil membuka status Banned (Unban) untuk ${unbannedCount} akun secara real-time!`
          : 'Gagal membuka Banned.',
    });
  };

  const handleResetToDefault = () => {
    const base = banSupportConfig.defaultTemplate || DEFAULT_BAN_SCREEN_CONFIG;
    setDraftConfig({
      ...base,
      caseId: generateBanCaseId(),
      bannedAt: new Date().toISOString(),
    });
    setUseScheduledStart(false);
    setSimulatedAppealStatus('none');
    setStudioFeedback({
      type: 'info',
      text: 'Pengaturan Live Preview dikembalikan ke Template Default.',
    });
  };

  const toggleMultiAccountSelection = (id: string) => {
    setSelectedMultiAccountIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const savedPresets = banSupportConfig.savedPresets || DEFAULT_BAN_CONFIG_PRESETS;
  const auditLogs = banSupportConfig.auditLogs || [];

  return (
    <div className="space-y-6">
      {/* Top Studio Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-rose-950/70 via-slate-900 to-slate-950 border border-rose-500/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[11px] font-mono font-bold">
            <ShieldBan className="w-4 h-4" />
            <span>STUDIO PENGATURAN &amp; LIVE PREVIEW BANNED REAL-TIME</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white">
            Kontrol Penuh Layar Banned, Tombol Tinjauan, Alasan Opsional &amp; Live Preview
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
            Atur tampilan layar Banned secara langsung di bawah ini. Pilih mode <strong>Permanen</strong> atau{' '}
            <strong>Trial (Sementara)</strong>, pilih alasan atau <strong>Tanpa Alasan</strong> (kotak alasan otomatis disembunyikan penuh jika dikosongkan), centang izin 3 tombol tinjauan (<strong>WhatsApp</strong>, <strong>Email</strong>, <strong>Tinjau di Sini</strong>), serta kelola ulang akun yang sudah di-banned kapan saja.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-rose-500/40 text-xs font-mono">
            <span className="text-slate-400 block text-[10px]">Akun Sedang Banned</span>
            <span className="text-rose-400 font-black text-sm">
              {bannedAccounts.length} / {accounts.length} Akun
            </span>
          </div>
          {bannedAccounts.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const res = adminUnbanAllCards();
                setStudioFeedback({
                  type: res.success ? 'success' : 'info',
                  text: res.message,
                });
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-600/20"
            >
              <Unlock className="w-4 h-4" />
              <span>Unban Semua ({bannedAccounts.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {studioFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            studioFeedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : studioFeedback.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              : 'bg-amber-500/15 border-amber-400/40 text-amber-200'
          }`}
        >
          <span>{studioFeedback.text}</span>
          <button
            type="button"
            onClick={() => setStudioFeedback(null)}
            className="text-white/80 hover:text-white font-bold px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =======================================================================
          DAFTAR AKUN YANG SEDANG DI-BANNED (BISA DIEDIT, DISIMPAN ULANG, COPY, ATAU UNBAN REAL-TIME)
         ======================================================================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-slate-950 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldBan className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-mono">
              Daftar Akun Sedang Terkena Banned ({bannedAccounts.length}) — Bisa Diedit &amp; Dikelola Ulang Real-Time
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            Klik &quot;Kelola di Preview&quot; untuk memperbaiki durasi, alasan, atau tombol tinjauan akun yang sudah di-banned
          </span>
        </div>

        {bannedAccounts.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
            Saat ini tidak ada akun nasabah yang sedang berstatus Banned. Gunakan kontrol di bawah untuk mengatur preview dan menerapkan Banned.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {bannedAccounts.map((acc) => {
              const cfg = acc.banInfo?.customConfig;
              const isPerm = (acc.banInfo?.durationType || 'permanent') === 'permanent';
              const appealSt = acc.banInfo?.appealStatus || 'none';
              const activeButtonsCount = [
                cfg?.showWhatsAppButton ?? true,
                cfg?.showEmailButton ?? true,
                cfg?.showInAppAppealButton ?? true,
              ].filter(Boolean).length;

              return (
                <div
                  key={acc.id}
                  className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/40 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-black text-white text-sm flex items-center gap-2 flex-wrap">
                        <span>{acc.fullName}</span>
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-mono">
                          {isPerm ? 'PERMANEN' : `TRIAL: ${acc.banInfo?.durationLabel || 'Sementara'}`}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-amber-300 mt-0.5">
                        Rek: {acc.accountNumber} · Email: {acc.googleEmail || acc.email}
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300">
                      {activeButtonsCount}/3 Tombol Aktif
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1 text-[11px]">
                    <div>
                      <span className="text-slate-400">Alasan di Layar Nasabah: </span>
                      {acc.banInfo?.reason && (cfg?.showReasonBox ?? true) && cfg?.reasonMode !== 'none' ? (
                        <span className="text-white font-semibold">&quot;{acc.banInfo.reason}&quot;</span>
                      ) : (
                        <span className="text-amber-300 font-mono">
                          [Tanpa Alasan — Kotak Alasan Disembunyikan Penuh]
                        </span>
                      )}
                    </div>
                    {(cfg?.adminInternalNote || cfg?.internalAdminNote) && (
                      <div className="text-cyan-300 font-mono text-[10px]">
                        Catatan Rahasia Admin: {cfg.adminInternalNote || cfg.internalAdminNote}
                      </div>
                    )}
                  </div>

                  {/* Incoming Appeal Review Box if user submitted appeal */}
                  {appealSt !== 'none' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-400/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 text-[11px]">
                          Status Banding Nasabah: {appealSt.toUpperCase()} ({acc.banInfo?.appealSource || 'in_app'})
                        </span>
                        {acc.banInfo?.appealCategory && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-200">
                            {acc.banInfo.appealCategory}
                          </span>
                        )}
                      </div>
                      {acc.banInfo?.appealNote && (
                        <p className="text-[11px] text-white italic">
                          &quot;{acc.banInfo.appealNote}&quot;
                        </p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2 pt-1">
                        <input
                          type="text"
                          value={adminAppealReplyMap[acc.id] || ''}
                          onChange={(e) =>
                            setAdminAppealReplyMap((prev) => ({
                              ...prev,
                              [acc.id]: e.target.value,
                            }))
                          }
                          placeholder="Catatan balasan Admin (opsional)..."
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] text-white"
                        />
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await adminReviewUnifiedBanAppeal(
                                acc.id,
                                'approve',
                                adminAppealReplyMap[acc.id]
                              );
                              setStudioFeedback({
                                type: r.success ? 'success' : 'error',
                                text: r.message,
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Setujui &amp; Unban</span>
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const r = await adminReviewUnifiedBanAppeal(
                                acc.id,
                                'reject',
                                adminAppealReplyMap[acc.id]
                              );
                              setStudioFeedback({
                                type: r.success ? 'info' : 'error',
                                text: r.message,
                              });
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Management Buttons for this Banned Account */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleLoadAccountIntoStudio(acc, 'edit')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Kelola &amp; Edit di Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadAccountIntoStudio(acc, 'copy')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Salin Konfigurasi</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const r = adminUnbanCard(acc.id);
                        setStudioFeedback({
                          type: r.success ? 'success' : 'error',
                          text: r.message,
                        });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Buka Banned (Unban)</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* =======================================================================
          MAIN SPLIT LAYOUT: LEFT CONTROLS & RIGHT REAL-TIME LIVE PREVIEW (Q1)
         ======================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* =====================================================================
            LEFT COLUMN (7 COLS): STUDIO PENGATURAN BANNED LENGKAP
           ===================================================================== */}
        <div className="xl:col-span-7 bg-slate-950 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6">
          {/* Step 1: Pilih Target Akun (1 Akun / Multi Akun / Semua Akun) + Monitor Gagal PIN X/5 */}
          <div className="space-y-3 pb-5 border-b border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>1. Pilih Target Akun &amp; Monitor Gagal PIN (X/5)</span>
              </label>

              <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(
                  [
                    { id: 'single', label: '1 Akun Spesifik' },
                    { id: 'multi', label: 'Pilih Banyak Akun' },
                    { id: 'all', label: `Semua Akun (${accounts.length})` },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setTargetScope(tab.id)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                      targetScope === tab.id
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {targetScope === 'single' && (
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                <select
                  value={selectedSingleAccountId}
                  onChange={(e) => setSelectedSingleAccountId(e.target.value)}
                  className="sm:col-span-8 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold focus:outline-none focus:border-amber-400"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.fullName} ({a.accountNumber}) —{' '}
                      {a.cardStatus === 'banned' || a.status === 'banned'
                        ? '🚫 SEDANG BANNED'
                        : '✅ AKTIF'}{' '}
                      • Gagal PIN: {a.failedPinAttempts || 0}/5
                    </option>
                  ))}
                </select>

                {primarySelectedAccount && (
                  <div className="sm:col-span-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const r = adminResetPinAttempts(primarySelectedAccount.id);
                        setStudioFeedback({
                          type: r.success ? 'success' : 'error',
                          text: r.message,
                        });
                      }}
                      title="Reset hitungan gagal PIN kartu kembali ke 0/5"
                      className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-[11px] flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>
                        Reset PIN ({primarySelectedAccount.failedPinAttempts || 0}/5)
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {targetScope === 'multi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto p-2 rounded-2xl bg-slate-900/70 border border-slate-800">
                {accounts.map((a) => {
                  const checked = selectedMultiAccountIds.includes(a.id);
                  const isBanned = a.cardStatus === 'banned' || a.status === 'banned';
                  return (
                    <div
                      key={a.id}
                      onClick={() => toggleMultiAccountSelection(a.id)}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer ${
                        checked
                          ? 'bg-amber-500/15 border-amber-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-amber-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-500 shrink-0" />
                        )}
                        <div className="truncate">
                          <span className="font-bold block truncate">{a.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {a.accountNumber} • PIN: {a.failedPinAttempts || 0}/5
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isBanned
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {isBanned ? 'BANNED' : 'AKTIF'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation Tabs for Control Categories */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(
              [
                {
                  id: 'duration_reason',
                  label: '2. Durasi & Alasan',
                  desc: 'Permanen/Trial & 30 Alasan',
                },
                {
                  id: 'buttons_appeal',
                  label: '3. Centang 3 Tombol',
                  desc: 'WA, Email, Tinjau di Sini',
                },
                {
                  id: 'theme_meta',
                  label: '4. Tema & Atribut',
                  desc: 'Warna, Ikon, Suara, Note',
                },
                {
                  id: 'presets_logs',
                  label: '5. Preset & Riwayat',
                  desc: 'Template & Log Cloud',
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setControlSection(tab.id)}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  controlSection === tab.id
                    ? 'bg-rose-600/20 border-rose-400 text-white shadow-lg shadow-rose-600/10'
                    : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="text-xs font-black block">{tab.label}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* ===================================================================
              SECTION A: DURASI (PERMANEN / TRIAL) & ALASAN (OPSIONAL / 30 SISTEM / 20 PRESET / CUSTOM)
             =================================================================== */}
          {controlSection === 'duration_reason' && (
            <div className="space-y-5 text-xs">
              {/* Mode Durasi: Permanen vs Trial (Sementara) (Q2, Q11, Q12, Q14) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <span>Mode Durasi Banned: Permanen atau Trial (Sementara)</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-300 font-bold">
                    Aktif: {draftConfig.durationLabel}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => updateDraft({ durationType: 'permanent' })}
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      draftConfig.durationType === 'permanent'
                        ? 'bg-rose-600 text-white border-rose-400 font-black shadow-lg shadow-rose-600/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-black">Banned Permanen</div>
                    <div className="text-[10px] opacity-85 mt-0.5">
                      Berlaku selamanya hingga dibuka manual oleh Admin
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      updateDraft({
                        durationType: 'custom',
                        durationValue: draftConfig.durationValue || 1,
                        durationUnit: draftConfig.durationUnit || 'days',
                      })
                    }
                    className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      draftConfig.durationType === 'custom'
                        ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="text-xs sm:text-sm font-black">
                      Banned Trial (Sementara / Hitung Mundur)
                    </div>
                    <div className="text-[10px] opacity-85 mt-0.5">
                      Otomatis Unban real-time begitu waktu habis
                    </div>
                  </button>
                </div>

                {draftConfig.durationType === 'custom' && (
                  <div className="space-y-3 pt-2 border-t border-slate-800">
                    {/* Preset Durasi Cepat (Q14: 15m, 1j, 1h, 7h, 30h) */}
                    <div>
                      <span className="text-[11px] text-slate-400 font-semibold block mb-1.5">
                        Preset Durasi Trial Cepat:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: '15 Menit (15m)', val: 15, unit: 'minutes' as BanDurationUnit },
                          { label: '1 Jam (1j)', val: 1, unit: 'hours' as BanDurationUnit },
                          { label: '1 Hari (1h / 24 Jam)', val: 1, unit: 'days' as BanDurationUnit },
                          { label: '7 Hari (7h)', val: 7, unit: 'days' as BanDurationUnit },
                          { label: '30 Hari (30h)', val: 30, unit: 'days' as BanDurationUnit },
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() =>
                              updateDraft({
                                durationType: 'custom',
                                durationValue: p.val,
                                durationUnit: p.unit,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-amber-500/20 border border-slate-700 hover:border-amber-400 text-amber-300 font-mono text-[11px] font-bold cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Input Angka Bebas & Satuan Waktu (Q11: Menit, Jam, Hari, Minggu, Bulan, Tanggal Spesifik) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                          Pilih Satuan Waktu Trial:
                        </label>
                        <select
                          value={draftConfig.durationUnit}
                          onChange={(e) =>
                            updateDraft({
                              durationUnit: e.target.value as BanDurationUnit,
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                        >
                          <option value="minutes">Menit</option>
                          <option value="hours">Jam</option>
                          <option value="days">Hari</option>
                          <option value="weeks">Minggu</option>
                          <option value="months">Bulan</option>
                          <option value="specific_date">Tanggal &amp; Jam Berakhir Spesifik</option>
                        </select>
                      </div>

                      {draftConfig.durationUnit === 'specific_date' ? (
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            Tanggal &amp; Jam Berakhir Banned:
                          </label>
                          <input
                            type="datetime-local"
                            value={draftConfig.specificEndDate || ''}
                            onChange={(e) =>
                              updateDraft({
                                specificEndDate: e.target.value,
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[11px] text-slate-300 font-semibold block mb-1">
                            Jumlah Durasi Bebas:
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={draftConfig.durationValue}
                            onChange={(e) =>
                              updateDraft({
                                durationValue: Math.max(1, parseInt(e.target.value, 10) || 1),
                              })
                            }
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-amber-300 font-mono font-bold text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Tombol Tambah / Kurangi Waktu Cepat (Q33) */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[11px] text-slate-400">Sesuaikan Cepat:</span>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustTrialMinutes(15)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-[11px] cursor-pointer"
                      >
                        +15m
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustTrialMinutes(60)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-[11px] cursor-pointer"
                      >
                        +1 Jam
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustTrialMinutes(1440)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono text-[11px] cursor-pointer"
                      >
                        +1 Hari
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickAdjustTrialMinutes(-15)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-rose-300 font-mono text-[11px] cursor-pointer"
                      >
                        -15m
                      </button>
                    </div>

                    {/* Centang Tampilkan Hitung Mundur (Q12) */}
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftConfig.showCountdown}
                        onChange={(e) => updateDraft({ showCountdown: e.target.checked })}
                        className="accent-amber-400 w-4 h-4"
                      />
                      <span className="text-xs font-semibold text-slate-200">
                        Tampilkan penghitung waktu mundur (Countdown Timer) di layar pengguna yang di-banned
                      </span>
                    </label>
                  </div>
                )}

                {/* Jadwalkan Waktu Mulai Banned (Q45) */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useScheduledStart}
                      onChange={(e) => setUseScheduledStart(e.target.checked)}
                      className="accent-amber-400 w-4 h-4"
                    />
                    <span className="text-xs font-semibold text-slate-300">
                      Jadwalkan Waktu Mulai Banned (Opsional — jika tidak dicentang maka langsung aktif detik ini juga)
                    </span>
                  </label>
                  {useScheduledStart && (
                    <input
                      type="datetime-local"
                      value={draftConfig.scheduledStartAt || ''}
                      onChange={(e) => updateDraft({ scheduledStartAt: e.target.value })}
                      className="w-full bg-slate-950 border border-amber-500/50 rounded-xl p-2.5 text-amber-300 font-mono text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Pengaturan Penjelasan / Alasan Banned (Q3, Q8, Q28) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-white text-sm">
                    Pengaturan Penjelasan / Alasan Banned (Opsional)
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    Judul Tetap: &quot;Akun Anda Telah Dibanned&quot;
                  </span>
                </div>

                {/* 4 Mode Alasan: Tanpa Alasan / 30 Alasan Sistem / 20 Preset Cepat / Custom */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      {
                        mode: 'none' as BanReasonSourceMode,
                        title: 'Tanpa Alasan',
                        sub: 'Sembunyikan Kotak Alasan',
                      },
                      {
                        mode: 'system_30' as BanReasonSourceMode,
                        title: '30 Alasan Sistem',
                        sub: 'Daftar Resmi Bank',
                      },
                      {
                        mode: 'preset_20' as BanReasonSourceMode,
                        title: '20 Preset Cepat',
                        sub: 'Klik Sekali Pilih',
                      },
                      {
                        mode: 'custom' as BanReasonSourceMode,
                        title: 'Alasan Custom',
                        sub: 'Ketik Penjelasan Bebas',
                      },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.mode}
                      type="button"
                      onClick={() => {
                        if (item.mode === 'none') {
                          updateDraft({
                            reasonMode: 'none',
                            reason: '',
                            reasonText: '',
                            showReasonBox: false,
                          });
                        } else if (item.mode === 'system_30') {
                          const defaultSys = SYSTEM_BAN_REASONS_30[0];
                          updateDraft({
                            reasonMode: 'system_30',
                            selectedSystemReasonId: defaultSys.id,
                            systemReasonId: defaultSys.id,
                            reason: defaultSys.reasonText,
                            reasonText: defaultSys.reasonText,
                            showReasonBox: true,
                          });
                        } else if (item.mode === 'preset_20') {
                          const defaultPre = QUICK_BAN_PRESETS_20[1] || QUICK_BAN_PRESETS_20[0];
                          updateDraft({
                            reasonMode: 'preset_20',
                            selectedPresetReasonId: defaultPre.id,
                            presetReasonId: defaultPre.id,
                            reason: defaultPre.reasonText,
                            reasonText: defaultPre.reasonText,
                            showReasonBox: Boolean(defaultPre.reasonText),
                          });
                        } else {
                          updateDraft({
                            reasonMode: 'custom',
                            showReasonBox: true,
                          });
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        draftConfig.reasonMode === item.mode
                          ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{item.title}</span>
                      <span className="text-[10px] opacity-80 block">{item.sub}</span>
                    </button>
                  ))}
                </div>

                {draftConfig.reasonMode === 'none' && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-200 text-xs">
                    <strong>Mode Tanpa Alasan Aktif:</strong> Di layar pengguna yang terkena banned, kotak penjelasan/alasan akan <strong>disembunyikan sama sekali tanpa teks tambahan apa pun</strong> (hanya tampil &quot;Akun Anda Telah Dibanned&quot;).
                  </div>
                )}

                {draftConfig.reasonMode === 'system_30' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Pilih dari 30 Alasan Buatan Sistem Bank Nusantara:
                    </label>
                    <select
                      value={
                        draftConfig.selectedSystemReasonId ||
                        draftConfig.systemReasonId ||
                        SYSTEM_BAN_REASONS_30[0].id
                      }
                      onChange={(e) => {
                        const found = SYSTEM_BAN_REASONS_30.find((r) => r.id === e.target.value);
                        if (found) {
                          updateDraft({
                            selectedSystemReasonId: found.id,
                            systemReasonId: found.id,
                            reason: found.reasonText,
                            reasonText: found.reasonText,
                            showReasonBox: true,
                          });
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs"
                    >
                      {SYSTEM_BAN_REASONS_30.map((r, idx) => (
                        <option key={r.id} value={r.id}>
                          #{idx + 1} [{r.code}] {r.title} — {r.reasonText}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {draftConfig.reasonMode === 'preset_20' && (
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 block">
                      Klik Salah Satu dari 20 Preset Alasan Cepat:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {QUICK_BAN_PRESETS_20.map((p, idx) => {
                        const active =
                          (draftConfig.selectedPresetReasonId || draftConfig.presetReasonId) ===
                          p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              updateDraft({
                                selectedPresetReasonId: p.id,
                                presetReasonId: p.id,
                                reason: p.reasonText,
                                reasonText: p.reasonText,
                                showReasonBox: Boolean(p.reasonText),
                              })
                            }
                            className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                              active
                                ? 'bg-amber-500/20 border-amber-400 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-[10px] font-mono text-amber-300 block">
                              Preset #{idx + 1}: {p.label}
                            </span>
                            <span className="text-[11px] line-clamp-2 mt-0.5 block">
                              {p.reasonText || '(Tanpa Alasan — Sembunyikan Kotak Alasan)'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {draftConfig.reasonMode !== 'none' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300">
                        Teks Penjelasan / Alasan yang Tampil di Preview (Kosongkan untuk Sembunyikan):
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateDraft({
                            reasonMode: 'none',
                            reason: '',
                            reasonText: '',
                            showReasonBox: false,
                          })
                        }
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                      >
                        Kosongkan &amp; Sembunyikan Alasan
                      </button>
                    </div>
                    <textarea
                      rows={3}
                      value={draftConfig.reason ?? draftConfig.reasonText ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateDraft({
                          reason: val,
                          reasonText: val,
                          showReasonBox: Boolean(val.trim()),
                        });
                      }}
                      placeholder="Jika dikosongkan, kotak alasan otomatis disembunyikan tanpa teks apa pun..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}

                {/* Pengaturan Subjudul / Deskripsi Pengantar di Bawah Judul (Q9) */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draftConfig.showSubtitle}
                        onChange={(e) => updateDraft({ showSubtitle: e.target.checked })}
                        className="accent-amber-400 w-4 h-4"
                      />
                      <span className="font-bold text-slate-200">
                        Tampilkan Subjudul / Deskripsi Pengantar di Bawah Judul Utama
                      </span>
                    </label>
                    {draftConfig.showSubtitle && (
                      <button
                        type="button"
                        onClick={() => updateDraft({ subtitleText: '', showSubtitle: false })}
                        className="text-[11px] text-slate-400 hover:text-rose-300 cursor-pointer"
                      >
                        Sembunyikan Subjudul
                      </button>
                    )}
                  </div>
                  {draftConfig.showSubtitle && (
                    <input
                      type="text"
                      value={draftConfig.subtitleText}
                      onChange={(e) => updateDraft({ subtitleText: e.target.value })}
                      placeholder="Seluruh akses fitur dan sesi aktif telah dihentikan secara otomatis..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION B: CENTANG 3 TOMBOL TINJAUAN (WA, EMAIL, TINJAU DI SINI) & ATURAN BANDING
             =================================================================== */}
          {controlSection === 'buttons_appeal' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-black text-white text-sm">
                    Centang Izin 3 Tombol Tinjauan di Layar Banned
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          showWhatsAppButton: true,
                          showEmailButton: true,
                          showInAppAppealButton: true,
                          showRecommendedLabel: true,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-[11px] cursor-pointer"
                    >
                      Centang Semua
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateDraft({
                          showWhatsAppButton: false,
                          showEmailButton: false,
                          showInAppAppealButton: false,
                          showRecommendedLabel: false,
                        })
                      }
                      className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[11px] cursor-pointer"
                    >
                      Matikan Semua Tombol
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Tombol yang tidak dicentang <strong>tidak akan muncul sama sekali</strong> di layar pengguna yang terkena banned. Jika ketiganya dimatikan, seluruh tombol dan tulisan kuning &quot;★ Disarankan&quot; disembunyikan secara total.
                </p>

                {/* 3 Independent Button Checkboxes (Q4, Q5, Q23) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      draftConfig.showWhatsAppButton
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={draftConfig.showWhatsAppButton}
                      onChange={(e) => updateDraft({ showWhatsAppButton: e.target.checked })}
                      className="mt-0.5 accent-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-black text-xs flex items-center gap-1.5 text-emerald-300">
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>1. Tinjau dengan WhatsApp</span>
                      </span>
                      <span className="text-[10px] opacity-80 block mt-0.5">
                        Tombol hijau hubungi nomor WA Admin
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      draftConfig.showEmailButton
                        ? 'bg-sky-950/40 border-sky-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={draftConfig.showEmailButton}
                      onChange={(e) => updateDraft({ showEmailButton: e.target.checked })}
                      className="mt-0.5 accent-sky-500 w-4 h-4"
                    />
                    <div>
                      <span className="font-black text-xs flex items-center gap-1.5 text-sky-300">
                        <Mail className="w-3.5 h-3.5" />
                        <span>2. Tinjau dengan Email</span>
                      </span>
                      <span className="text-[10px] opacity-80 block mt-0.5">
                        Tombol biru kirim email banding
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3.5 rounded-2xl border cursor-pointer flex items-start gap-2.5 transition-all ${
                      draftConfig.showInAppAppealButton
                        ? 'bg-amber-950/40 border-amber-500/60 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={draftConfig.showInAppAppealButton}
                      onChange={(e) => updateDraft({ showInAppAppealButton: e.target.checked })}
                      className="mt-0.5 accent-amber-400 w-4 h-4"
                    />
                    <div>
                      <span className="font-black text-xs flex items-center gap-1.5 text-amber-300">
                        <FileText className="w-3.5 h-3.5" />
                        <span>3. Tinjau di Sini</span>
                      </span>
                      <span className="text-[10px] opacity-80 block mt-0.5">
                        Form pengajuan langsung ke Panel Admin
                      </span>
                    </div>
                  </label>
                </div>

                {/* Centang Label Kuning Cerah "★ Disarankan" (Q10) */}
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftConfig.showRecommendedLabel}
                    onChange={(e) => updateDraft({ showRecommendedLabel: e.target.checked })}
                    className="accent-yellow-400 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-slate-200">
                    Tampilkan tulisan kecil warna kuning cerah{' '}
                    <strong className="text-yellow-300">★ Disarankan</strong> di atas tombol WhatsApp &amp; Email
                  </span>
                </label>

                {/* Nomor WA & Email Global + Override Khusus Akun (Q21) */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="font-bold text-white">
                    Tujuan Kontak WhatsApp &amp; Email Banding (Global &amp; Override Per Akun)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Nomor WhatsApp Global Admin:
                      </label>
                      <input
                        type="text"
                        value={globalWa}
                        onChange={(e) => setGlobalWa(e.target.value)}
                        onBlur={() =>
                          void adminUpdateBanSupportConfig({
                            ...banSupportConfig,
                            whatsappNumber: globalWa,
                            emailAddress: globalEmail,
                          })
                        }
                        placeholder="6281298765432"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 block mb-1">
                        Alamat Email Global Admin:
                      </label>
                      <input
                        type="email"
                        value={globalEmail}
                        onChange={(e) => setGlobalEmail(e.target.value)}
                        onBlur={() =>
                          void adminUpdateBanSupportConfig({
                            ...banSupportConfig,
                            whatsappNumber: globalWa,
                            emailAddress: globalEmail,
                          })
                        }
                        placeholder="admin@banknusantara.id"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-emerald-300 block mb-1">
                        Override Nomor WA Khusus Akun Ini (Opsional):
                      </label>
                      <input
                        type="text"
                        value={draftConfig.overrideWhatsAppNumber || draftConfig.overrideWhatsappNumber || ''}
                        onChange={(e) =>
                          updateDraft({
                            overrideWhatsAppNumber: e.target.value,
                            overrideWhatsappNumber: e.target.value,
                          })
                        }
                        placeholder="Kosongkan untuk pakai WA Global"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-sky-300 block mb-1">
                        Override Email Khusus Akun Ini (Opsional):
                      </label>
                      <input
                        type="email"
                        value={draftConfig.overrideEmailAddress || ''}
                        onChange={(e) =>
                          updateDraft({ overrideEmailAddress: e.target.value })
                        }
                        placeholder="Kosongkan untuk pakai Email Global"
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Template Pesan Otomatis WA & Email (Q22) */}
                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300">
                      Template Pesan Otomatis Saat Klik WA / Email:
                    </label>
                    <span className="text-[10px] font-mono text-amber-300">
                      Variabel: {'{nama}'} {'{email}'} {'{rekening}'} {'{alasan}'} {'{caseId}'}
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={draftConfig.appealMessageTemplate || draftConfig.messageTemplate || ''}
                    onChange={(e) =>
                      updateDraft({
                        appealMessageTemplate: e.target.value,
                        messageTemplate: e.target.value,
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>

                {/* Aturan Form "Tinjau di Sini" & Kotak Status Banding (Q24, Q25, Q26, Q27) */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="font-bold text-white">
                    Aturan Form &quot;Tinjau di Sini&quot; &amp; Kotak Status Tinjauan
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-300 block mb-1">
                        Batas Maksimal Pengajuan Banding per Akun:
                      </label>
                      <select
                        value={draftConfig.maxAppeals}
                        onChange={(e) =>
                          updateDraft({ maxAppeals: parseInt(e.target.value, 10) })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                      >
                        <option value={1}>Maksimal 1x Pengajuan</option>
                        <option value={3}>Maksimal 3x Pengajuan</option>
                        <option value={0}>Tanpa Batas (Bebas Mengajukan)</option>
                      </select>
                    </div>

                    <div className="flex flex-col justify-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.allowResubmitAfterReject}
                          onChange={(e) =>
                            updateDraft({ allowResubmitAfterReject: e.target.checked })
                          }
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span className="text-slate-200">
                          Izinkan kirim ulang setelah banding ditolak Admin
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.requireAppealCategoryAndPromise}
                          onChange={(e) =>
                            updateDraft({
                              requireAppealCategoryAndPromise: e.target.checked,
                            })
                          }
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span className="text-slate-200">
                          Wajib pilih kategori alasan &amp; centang janji kepatuhan
                        </span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draftConfig.showAppealStatusBox}
                          onChange={(e) =>
                            updateDraft({ showAppealStatusBox: e.target.checked })
                          }
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span className="text-slate-200">
                          Tampilkan kotak status hasil tinjauan &amp; balasan Admin
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION C: TEMA WARNA, IKON, METADATA, EFEK SUARA & CATATAN RAHASIA ADMIN
             =================================================================== */}
          {controlSection === 'theme_meta' && (
            <div className="space-y-5 text-xs">
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                {/* 4 Pilihan Tema Warna (Q16) */}
                <div>
                  <label className="font-bold text-white block mb-2">
                    Pilih Tema Warna Layar Banned:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { id: 'emergency_red', label: 'Merah Darurat', color: 'border-rose-500 bg-rose-950/50 text-rose-200' },
                        { id: 'warning_amber', label: 'Kuning Peringatan', color: 'border-amber-500 bg-amber-950/50 text-amber-200' },
                        { id: 'frozen_blue', label: 'Biru Beku', color: 'border-cyan-500 bg-cyan-950/50 text-cyan-200' },
                        { id: 'pitch_dark', label: 'Gelap Total', color: 'border-slate-600 bg-slate-950 text-slate-200' },
                      ] as { id: BanThemeVariant; label: string; color: string }[]
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => updateDraft({ theme: t.id, themeVariant: t.id })}
                        className={`p-3 rounded-xl border-2 font-black text-xs cursor-pointer transition-all ${
                          (draftConfig.theme || draftConfig.themeVariant) === t.id
                            ? `${t.color} ring-2 ring-white/40`
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4 Pilihan Ikon Utama (Q17) */}
                <div>
                  <label className="font-bold text-white block mb-2">
                    Pilih Ikon Utama di Bagian Atas Layar Banned:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        { id: 'shield', label: 'Perisai', Icon: ShieldBan },
                        { id: 'lock', label: 'Gembok', Icon: Lock },
                        { id: 'warning', label: 'Segitiga Peringatan', Icon: AlertTriangle },
                        { id: 'gavel', label: 'Palu Hukum', Icon: Gavel },
                      ] as { id: BanIconVariant; label: string; Icon: React.FC<{ className?: string }> }[]
                    ).map((ic) => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => updateDraft({ icon: ic.id, iconVariant: ic.id })}
                        className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                          (draftConfig.icon || draftConfig.iconVariant) === ic.id
                            ? 'bg-amber-500 text-slate-950 border-amber-300 font-black'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <ic.Icon className="w-5 h-5" />
                        <span className="text-[11px]">{ic.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Centang Atribut Tambahan: Badge Status, Case ID, Timestamp, Footer Note (Q18, Q19, Q20, Q49) */}
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="font-bold text-white">
                    Centang Informasi Tambahan di Layar Banned
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                        <input
                          type="checkbox"
                          checked={draftConfig.showStatusBadge}
                          onChange={(e) => updateDraft({ showStatusBadge: e.target.checked })}
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span>Tampilkan Badge Label Status</span>
                      </label>
                      {draftConfig.showStatusBadge && (
                        <input
                          type="text"
                          value={draftConfig.statusBadgeText}
                          onChange={(e) => updateDraft({ statusBadgeText: e.target.value })}
                          placeholder="Contoh: BANNED PERMANEN / BANNED TRIAL"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono text-[11px]"
                        />
                      )}
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                        <input
                          type="checkbox"
                          checked={draftConfig.showCaseId}
                          onChange={(e) => updateDraft({ showCaseId: e.target.checked })}
                          className="accent-amber-400 w-4 h-4"
                        />
                        <span>Tampilkan Kode Referensi Kasus (Case ID)</span>
                      </label>
                      {draftConfig.showCaseId && (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={draftConfig.caseId || ''}
                            onChange={(e) => updateDraft({ caseId: e.target.value })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-amber-300 font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={() => updateDraft({ caseId: generateBanCaseId() })}
                            className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs cursor-pointer"
                            title="Acak Case ID Baru"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={draftConfig.showBannedAtTime}
                        onChange={(e) => updateDraft({ showBannedAtTime: e.target.checked })}
                        className="accent-amber-400 w-4 h-4"
                      />
                      <span>Tampilkan Tanggal &amp; Jam Kejadian Banned</span>
                    </label>

                    <div>
                      <label className="text-[11px] font-bold text-slate-300 block mb-1">
                        Efek Suara Saat Layar Banned Muncul (Q48):
                      </label>
                      <select
                        value={draftConfig.soundEffect}
                        onChange={(e) =>
                          updateDraft({ soundEffect: e.target.value as BanSoundEffectMode })
                        }
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                      >
                        <option value="siren">Sirene Darurat</option>
                        <option value="warning">Nada Peringatan</option>
                        <option value="silent">Senyap (Tanpa Suara)</option>
                      </select>
                    </div>
                  </div>

                  {/* Catatan Kaki Tambahan (Q49) */}
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-200">
                      <input
                        type="checkbox"
                        checked={draftConfig.showFooterNote}
                        onChange={(e) => updateDraft({ showFooterNote: e.target.checked })}
                        className="accent-amber-400 w-4 h-4"
                      />
                      <span>Tampilkan Catatan Kaki Tambahan (Footer Note) di Bawah Layar Banned</span>
                    </label>
                    {draftConfig.showFooterNote && (
                      <input
                        type="text"
                        value={draftConfig.footerNote}
                        onChange={(e) => updateDraft({ footerNote: e.target.value })}
                        placeholder="Contoh: Keamanan Siber PT Bank Nusantara (Persero) Tbk — Pengawasan Real-Time 24/7"
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-xs"
                      />
                    )}
                  </div>

                  {/* Catatan Internal Rahasia Admin (Q46) */}
                  <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/40 space-y-1.5">
                    <label className="font-bold text-cyan-300 block">
                      Catatan Internal Rahasia Admin (Hanya tampil di Panel Admin, TIDAK tampil di layar nasabah):
                    </label>
                    <input
                      type="text"
                      value={draftConfig.adminInternalNote || draftConfig.internalAdminNote || ''}
                      onChange={(e) =>
                        updateDraft({
                          adminInternalNote: e.target.value,
                          internalAdminNote: e.target.value,
                        })
                      }
                      placeholder="Contoh: Indikasi percobaan akses perangkat baru — pantau 24 jam"
                      className="w-full bg-slate-950 border border-cyan-500/40 rounded-lg p-2.5 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              SECTION D: PRESET KONFIGURASI, TEMPLATE GLOBAL & LOG RIWAYAT CLOUD
             =================================================================== */}
          {controlSection === 'presets_logs' && (
            <div className="space-y-5 text-xs">
              {/* Simpan sebagai Template Default Global atau Preset Baru (Q7, Q29) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-black text-white text-sm block">
                      Template Global &amp; Preset Konfigurasi Banned Tersimpan
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Simpan kombinasi tema, durasi, alasan, dan centang 3 tombol agar tinggal sekali klik
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const r = adminSaveDefaultBanTemplate(draftConfig);
                      setStudioFeedback({
                        type: r.success ? 'success' : 'error',
                        text: r.message,
                      });
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>Jadikan Template Global Default</span>
                  </button>
                </div>

                {/* Form Simpan Preset Baru */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="text"
                    value={newPresetName}
                    onChange={(e) => setNewPresetName(e.target.value)}
                    placeholder="Nama Preset Baru (misal: Banned Tanpa Tombol & Tanpa Alasan)"
                    className="sm:col-span-5 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={newPresetDesc}
                    onChange={(e) => setNewPresetDesc(e.target.value)}
                    placeholder="Keterangan singkat..."
                    className="sm:col-span-4 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const r = adminSaveBanPreset({
                        name: newPresetName,
                        description: newPresetDesc,
                        config: draftConfig,
                      });
                      setStudioFeedback({
                        type: r.success ? 'success' : 'error',
                        text: r.message,
                      });
                      if (r.success) {
                        setNewPresetName('');
                        setNewPresetDesc('');
                      }
                    }}
                    className="sm:col-span-3 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Simpan Preset</span>
                  </button>
                </div>

                {/* Daftar Preset Tersimpan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {savedPresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <span className="font-bold text-white block truncate">{preset.name}</span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {preset.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setDraftConfig({
                              ...preset.config,
                              caseId: generateBanCaseId(),
                              bannedAt: new Date().toISOString(),
                            });
                            setStudioFeedback({
                              type: 'info',
                              text: `Preset "${preset.name}" berhasil dimuat ke Live Preview!`,
                            });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] cursor-pointer"
                        >
                          Pakai
                        </button>
                        {preset.id.startsWith('preset-custom-') && (
                          <button
                            type="button"
                            onClick={() => adminDeleteBanPreset(preset.id)}
                            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Log Riwayat Banned & Unban di Cloud Firestore (Q43) */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-sm flex items-center gap-1.5">
                    <History className="w-4 h-4 text-amber-400" />
                    <span>Log Riwayat Banned, Edit &amp; Unban (Tersinkron di Cloud)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {auditLogs.length} Catatan
                  </span>
                </div>

                {auditLogs.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950 text-slate-400 text-center">
                    Belum ada riwayat tindakan Banned/Unban tercatat.
                  </div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {auditLogs.slice(0, 30).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                      >
                        <div>
                          <span className="font-bold text-white">
                            [{log.action.toUpperCase()}] {log.targetAccountName || log.accountName || 'Akun'} (
                            {log.targetAccountNumber || log.accountNumber || '-'})
                          </span>
                          <span className="block text-slate-400">
                            Durasi: {log.durationLabel || '-'} • {log.reasonSummary || log.summary || log.reason || '-'}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-500 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================
              4 TOMBOL AKSI UTAMA DI STUDIO BANNED (Q50)
             =================================================================== */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>
                Target Aksi:{' '}
                <strong className="text-amber-300">
                  {targetScope === 'all'
                    ? `Semua Akun (${accounts.length})`
                    : `${effectiveTargetIds.length} Akun Dipilih`}
                </strong>
              </span>
              <span>Perubahan langsung tersinkron real-time ke Cloud Firestore</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* 1. Terapkan Banned */}
              <button
                type="button"
                onClick={handleApplyNewBan}
                className="py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/25 cursor-pointer transition-all"
              >
                <ShieldBan className="w-4 h-4 shrink-0" />
                <span>Terapkan Banned</span>
              </button>

              {/* 2. Simpan Perubahan (untuk akun yang sudah di-banned) */}
              <button
                type="button"
                onClick={handleSaveExistingBanChanges}
                className="py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>Simpan Perubahan</span>
              </button>

              {/* 3. Buka Banned (Unban) */}
              <button
                type="button"
                onClick={handleUnbanSelected}
                className="py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer transition-all"
              >
                <Unlock className="w-4 h-4 shrink-0" />
                <span>Buka Banned (Unban)</span>
              </button>

              {/* 4. Reset ke Default */}
              <button
                type="button"
                onClick={handleResetToDefault}
                className="py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>Reset ke Default</span>
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (5 COLS): LIVE PREVIEW REAL-TIME INTERAKTIF (Q1, Q40, Q41, Q42)
           ===================================================================== */}
        <div className="xl:col-span-5 xl:sticky xl:top-20 space-y-4">
          <div className="bg-slate-950 border border-amber-500/40 rounded-3xl p-4 sm:p-5 space-y-4 shadow-2xl">
            {/* Live Preview Toolbar: Switcher HP / Laptop & Simulasi Status Banding */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-black uppercase tracking-wider text-white font-mono">
                  LIVE PREVIEW REAL-TIME
                </span>
              </div>

              {/* Switcher Ukuran Layar HP vs Laptop (Q41) */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'mobile'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                    previewDevice === 'desktop'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Laptop</span>
                </button>
              </div>
            </div>

            {/* Simulasi Kondisi Status Banding di Live Preview (Q42) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="text-slate-400 font-semibold">Simulasi Status Banding:</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { id: 'none', label: 'Baru Terkena Banned' },
                    { id: 'pending', label: 'Menunggu Banding' },
                    { id: 'rejected', label: 'Banding Ditolak' },
                  ] as const
                ).map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSimulatedAppealStatus(st.id)}
                    className={`px-2.5 py-1 rounded-lg border font-bold cursor-pointer ${
                      simulatedAppealStatus === st.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ringkasan Cepat Konfigurasi yang Sedang Aktif di Preview */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300">
                Mode: {draftConfig.durationType === 'permanent' ? 'PERMANEN' : `TRIAL (${draftConfig.durationLabel})`}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
                Alasan:{' '}
                {draftConfig.reasonMode === 'none' ||
                !(draftConfig.reason ?? draftConfig.reasonText ?? '').trim()
                  ? 'Tanpa Alasan (Sembunyi)'
                  : 'Tampil'}
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                Tombol: {[
                  draftConfig.showWhatsAppButton && 'WA',
                  draftConfig.showEmailButton && 'Email',
                  draftConfig.showInAppAppealButton && 'Tinjau',
                ]
                  .filter(Boolean)
                  .join(' + ') || 'Semua Sembunyi'}
              </span>
            </div>

            {/* Interactive Live Preview Canvas */}
            <div className="max-h-[740px] overflow-y-auto rounded-2xl">
              <BanLockScreen
                previewState={{
                  config: draftConfig,
                  simulatedAppealStatus,
                  deviceMode: previewDevice,
                  sampleAccountName: primarySelectedAccount?.fullName || 'Nasabah Contoh',
                  sampleAccountEmail:
                    primarySelectedAccount?.googleEmail ||
                    primarySelectedAccount?.email ||
                    'nasabah@banknusantara.id',
                  sampleAccountNumber: primarySelectedAccount?.accountNumber || '1234567890',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
