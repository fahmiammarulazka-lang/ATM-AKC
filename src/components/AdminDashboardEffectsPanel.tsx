/**
 * AdminDashboardEffectsPanel.tsx
 * Studio Efek Dashboard 100.000x (Fitur & Pengaturan 100% Terpusat di Panel Admin)
 * - Menggunakan Katalog 108 Efek Perayaan (9 Kategori) & Mesin Panggung 100.000x Ultra Max Overdrive
 *   yang sama persis dengan Hadiah & Surat.
 * - Tab & seluruh pengaturan Efek Dashboard hanya berada di Panel Admin (Zero Customer Controls).
 * - Bebas dikirim ke: Semua Nasabah (__ALL__), 1 Akun Spesifik, atau Centang Banyak Akun Sekaligus (__MULTI__).
 * - Dilengkapi:
 *   1) Saklar On/Off per Elemen Tampilan Nasabah (Ledakan Panggung 100.000x, Spanduk Sambutan & Segel 3D,
 *      Aura Kartu Saldo Utama, dan Hujan Partikel Latar Layar).
 *   2) Pengatur Gaya & Posisi Spanduk (Spanduk Penuh, Pita Ringkas, atau Hanya Aura Tanpa Spanduk).
 *   3) Pengatur Suara Fanfare Synthesizer (Suara Fanfare Otomatis vs Mode Senyap).
 *   4) Pengatur Durasi Granular (15 Detik, 30 Detik, 1 Menit, 5 Menit, 15 Menit, 30 Menit, 1 Jam, 6 Jam,
 *      24 Jam, 3 Hari, 7 Hari, hingga Permanen) + Durasi Tampil Panggung Ledakan (6s - 30s).
 *   5) Tabel Pantauan Live Efek Aktif Per Akun Nasabah dengan kontrol 1-klik: Tembak Ledakan ke Akun,
 *      Ganti Efek Utama Akun, dan Sembunyikan / Paksa Tampil per Akun secara Real-Time.
 */
import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Plus,
  Trash2,
  Edit3,
  Power,
  Users,
  Search,
  CheckSquare,
  Square,
  Copy,
  Ban,
  CheckCircle2,
  Sliders,
  Zap,
  Clock,
  Layers,
  CreditCard,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Layout,
  Monitor,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AdminDashboardEffectPackage,
  DashboardEffectBannerStyle,
  DashboardEffectDurationType,
  DashboardEffectSoundMode,
} from '../types/bank';
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
import {
  formatDashboardEffectRemainingLabel,
  resolveActiveDashboardEffectsForAccount,
} from './DashboardEffectLayerAndStudio';

const DURATION_OPTIONS: {
  id: DashboardEffectDurationType;
  label: string;
  desc: string;
}[] = [
  { id: '15s', label: '⚡ 15 Detik', desc: 'Kilat 15 detik' },
  { id: '30s', label: '⚡ 30 Detik', desc: 'Singkat 30 detik' },
  { id: '1m', label: '⏱️ 1 Menit', desc: 'Aktif 60 detik' },
  { id: '5m', label: '⏱️ 5 Menit', desc: 'Aktif 5 menit' },
  { id: '15m', label: '⏱️ 15 Menit', desc: 'Aktif 15 menit' },
  { id: '30m', label: '⏱️ 30 Menit', desc: 'Aktif setengah jam' },
  { id: '1h', label: '🕐 1 Jam', desc: 'Aktif 60 menit' },
  { id: '6h', label: '🕕 6 Jam', desc: 'Aktif 6 jam' },
  { id: '24h', label: '📅 24 Jam (1 Hari)', desc: 'Aktif 1 hari penuh' },
  { id: '72h', label: '📅 3 Hari (72 Jam)', desc: 'Aktif 3 hari' },
  { id: '168h', label: '📅 7 Hari (1 Minggu)', desc: 'Aktif 1 minggu penuh' },
  { id: 'permanent', label: '♾️ Permanen', desc: 'Aktif terus sampai dimatikan Admin' },
];

const BANNER_STYLE_OPTIONS: {
  id: DashboardEffectBannerStyle;
  label: string;
  desc: string;
}[] = [
  {
    id: 'full_top_banner',
    label: '👑 Spanduk Penuh & Segel Mandala 3D',
    desc: 'Spanduk besar di atas Kartu Saldo lengkap dengan segel 3D, judul & pesan',
  },
  {
    id: 'compact_ribbon',
    label: '🎗️ Pita Ringkas Elegan',
    desc: 'Baris pita kompak di bagian atas Dashboard tanpa memakan ruang vertikal',
  },
  {
    id: 'aura_only_no_banner',
    label: '✨ Hanya Aura Kartu & Partikel (Tanpa Spanduk)',
    desc: 'Sembunyikan kotak spanduk teks, hanya tampilkan aura Kartu Saldo & partikel',
  },
];

const STAGE_DURATION_OPTIONS: { seconds: number; label: string }[] = [
  { seconds: 6, label: '6 Detik (Cepat)' },
  { seconds: 10, label: '10 Detik (Standar)' },
  { seconds: 15, label: '15 Detik (Sinematik)' },
  { seconds: 25, label: '25 Detik (Festival Panjang)' },
];

export const AdminDashboardEffectsPanel: React.FC = () => {
  const {
    accounts,
    dashboardEffectEvents,
    adminCreateOrUpdateDashboardEffect,
    adminDeleteDashboardEffect,
    adminToggleDashboardEffectActive,
    adminTriggerDashboardEffectBlastNow,
    adminUpdateDashboardEffectQuickSettings,
    adminDuplicateDashboardEffect,
    adminToggleRevokeDashboardEffectRecipient,
    adminSetPrimaryDashboardEffectForAccount,
    adminHideAllDashboardEffectsForAccount,
    adminRestoreAllDashboardEffectsForAccount,
  } = useBank();

  const [editingPkgId, setEditingPkgId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('👑 Panggung Perayaan Dashboard Sultan 100.000x');
  const [senderName, setSenderName] = useState<string>('Dewan Direksi Bank Nusantara');
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    'Selamat datang di Dashboard Utama Bank Nusantara! Nikmati Panggung Selebrasi 100.000x Ultra Max Overdrive lengkap dengan portal 3D, laser, trofi hologram, dan hiasan aura eksklusif di rekening Anda.'
  );
  const [celebrationEffect, setCelebrationEffect] = useState<string>('sultan_mahkota_emas');
  const [celebrationIntensity, setCelebrationIntensity] =
    useState<CelebrationIntensityLevel>('100000x');
  const [celebCategoryFilter, setCelebCategoryFilter] = useState<CelebrationCategoryKey>('all');
  const [celebSearchQuery, setCelebSearchQuery] = useState<string>('');

  // Recipient Targeting: Semua Nasabah / 1 Akun / Banyak Akun
  const [recipientSelectionMode, setRecipientSelectionMode] = useState<'all' | 'single' | 'multi'>('all');
  const [targetAccountId, setTargetAccountId] = useState<string>('__ALL__');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');

  // Full Admin Behavior, Element Switches, Audio, Banner Style & Duration Controls
  const [durationType, setDurationType] = useState<DashboardEffectDurationType>('permanent');
  const [stageDurationSeconds, setStageDurationSeconds] = useState<number>(12);
  const [bannerStyle, setBannerStyle] =
    useState<DashboardEffectBannerStyle>('full_top_banner');
  const [soundMode, setSoundMode] = useState<DashboardEffectSoundMode>('fanfare_auto');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [autoBlastOnOpen, setAutoBlastOnOpen] = useState<boolean>(true);
  const [showPersistentDashboardAura, setShowPersistentDashboardAura] = useState<boolean>(true);
  const [decorateBalanceCard, setDecorateBalanceCard] = useState<boolean>(true);
  const [showAmbientParticles, setShowAmbientParticles] = useState<boolean>(true);

  // Management, Live Account Monitor & Preview States
  const [managingPkgId, setManagingPkgId] = useState<string | null>(null);
  const [manageRecipientSearch, setManageRecipientSearch] = useState<string>('');
  const [accountMonitorSearch, setAccountMonitorSearch] = useState<string>('');
  const [feedback, setFeedback] = useState<string>('');
  const [previewBurstState, setPreviewBurstState] = useState<{
    effectId: string;
    intensity: CelebrationIntensityLevel;
    headline?: string;
    soundMode?: DashboardEffectSoundMode;
    nonce: number;
  } | null>(null);

  const usableCelebrations = CELEBRATION_EFFECTS_CATALOG.filter((c) => c.id !== 'none');
  const activeCelebrationProfile = getCelebrationEffectProfile(
    celebrationEffect === 'none' ? 'sultan_mahkota_emas' : celebrationEffect
  );

  const filteredCelebrations = usableCelebrations.filter((item) => {
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

  const filteredMonitorAccounts = accounts.filter((acc) => {
    if (!accountMonitorSearch.trim()) return true;
    const q = accountMonitorSearch.toLowerCase();
    return (
      acc.fullName.toLowerCase().includes(q) ||
      acc.accountNumber.toLowerCase().includes(q) ||
      acc.cardTier.toLowerCase().includes(q)
    );
  });

  const toggleRecipientAccountCheckbox = (accountId: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const resetFormToNew = () => {
    setEditingPkgId(null);
    setTitle('👑 Panggung Perayaan Dashboard Sultan 100.000x');
    setSenderName('Dewan Direksi Bank Nusantara');
    setWelcomeMessage(
      'Selamat datang di Dashboard Utama Bank Nusantara! Nikmati Panggung Selebrasi 100.000x Ultra Max Overdrive lengkap dengan portal 3D, laser, trofi hologram, dan hiasan aura eksklusif di rekening Anda.'
    );
    setCelebrationEffect('sultan_mahkota_emas');
    setCelebrationIntensity('100000x');
    setRecipientSelectionMode('all');
    setTargetAccountId('__ALL__');
    setSelectedRecipientIds([]);
    setRecipientSearchQuery('');
    setDurationType('permanent');
    setStageDurationSeconds(12);
    setBannerStyle('full_top_banner');
    setSoundMode('fanfare_auto');
    setIsActive(true);
    setAutoBlastOnOpen(true);
    setShowPersistentDashboardAura(true);
    setDecorateBalanceCard(true);
    setShowAmbientParticles(true);
  };

  const loadPackageIntoEditor = (pkg: AdminDashboardEffectPackage) => {
    setEditingPkgId(pkg.id);
    setTitle(pkg.title);
    setSenderName(pkg.senderName);
    setWelcomeMessage(pkg.welcomeMessage);
    setCelebrationEffect(
      pkg.celebrationEffect && pkg.celebrationEffect !== 'none'
        ? pkg.celebrationEffect
        : 'sultan_mahkota_emas'
    );
    setCelebrationIntensity(pkg.celebrationIntensity || '100000x');
    setDurationType(pkg.durationType || 'permanent');
    setStageDurationSeconds(pkg.stageDurationSeconds || 12);
    setBannerStyle(pkg.bannerStyle || 'full_top_banner');
    setSoundMode(pkg.soundMode || 'fanfare_auto');
    setIsActive(pkg.isActive);
    setAutoBlastOnOpen(pkg.autoBlastOnOpen);
    setShowPersistentDashboardAura(pkg.showPersistentDashboardAura);
    setDecorateBalanceCard(pkg.decorateBalanceCard);
    setShowAmbientParticles(pkg.showAmbientParticles !== false);

    const existingTargets =
      Array.isArray(pkg.targetAccountIds) && pkg.targetAccountIds.length > 0
        ? pkg.targetAccountIds
        : pkg.targetAccountId &&
          pkg.targetAccountId !== '__ALL__' &&
          pkg.targetAccountId !== '__MULTI__'
        ? [pkg.targetAccountId]
        : [];

    if (!pkg.targetAccountId || pkg.targetAccountId === '__ALL__') {
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

    setFeedback(
      `✏️ Mengedit Efek Dashboard "${pkg.title}". Silakan sesuaikan saklar tampilan, durasi, suara, atau target nasabah lalu klik Simpan / Tembakkan!`
    );
  };

  const handleTestStage = (
    effectId: string,
    intensity: CelebrationIntensityLevel = celebrationIntensity,
    customHeadline?: string,
    overrideSoundMode: DashboardEffectSoundMode = soundMode
  ) => {
    triggerCanvasConfettiForCelebration(effectId, intensity);
    setPreviewBurstState({
      effectId,
      intensity,
      headline: customHeadline || title,
      soundMode: overrideSoundMode,
      nonce: Date.now(),
    });
  };

  const handleSaveAndSend = (blastImmediately: boolean) => {
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
        setFeedback(
          '⚠️ Centang minimal 1 akun nasabah penerima Efek Dashboard (atau pilih Semua Nasabah)!'
        );
        return;
      }
      finalTargetAccountIds = Array.from(new Set(selectedRecipientIds));
      finalTargetAccountId =
        finalTargetAccountIds.length === 1 ? finalTargetAccountIds[0] : '__MULTI__';
    }

    const res = adminCreateOrUpdateDashboardEffect({
      id: editingPkgId || undefined,
      title,
      senderName,
      welcomeMessage,
      celebrationEffect: activeCelebrationProfile.id,
      celebrationIntensity,
      targetAccountId: finalTargetAccountId,
      targetAccountIds: finalTargetAccountIds,
      isActive,
      autoBlastOnOpen: blastImmediately ? true : autoBlastOnOpen,
      showPersistentDashboardAura,
      decorateBalanceCard,
      showAmbientParticles,
      bannerStyle,
      soundMode,
      stageDurationSeconds,
      durationType,
      sendNow: blastImmediately,
    });

    setFeedback(res.message);
    if (!editingPkgId) {
      resetFormToNew();
    }
  };

  // Helper to blast a fresh single-account effect directly from the Live Account Monitor Table
  const handleQuickSendNewEffectToAccount = (accountId: string, effectId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    const prof = getCelebrationEffectProfile(effectId);
    const res = adminCreateOrUpdateDashboardEffect({
      title: `${prof.primaryEmoji} ${prof.celebrationHeadline}`,
      senderName: 'Otoritas Panel Admin Bank Nusantara',
      welcomeMessage: `Panggung Selebrasi ${prof.name} (100.000x Ultra Max Overdrive) diaktifkan langsung oleh Admin untuk rekening ${
        acc ? acc.fullName : 'Anda'
      }!`,
      celebrationEffect: prof.id,
      celebrationIntensity: '100000x',
      targetAccountId: accountId,
      targetAccountIds: [accountId],
      forcedPrimaryForAccountIds: [accountId],
      isActive: true,
      autoBlastOnOpen: true,
      showPersistentDashboardAura: true,
      decorateBalanceCard: true,
      showAmbientParticles: true,
      bannerStyle: 'full_top_banner',
      soundMode: 'fanfare_auto',
      stageDurationSeconds: 12,
      durationType: 'permanent',
      sendNow: true,
    });
    setFeedback(res.message);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* FULL-SCREEN LIVE STAGE PREVIEW FOR ADMIN */}
      {previewBurstState && (
        <CelebrationClaimBurstOverlay
          effectId={previewBurstState.effectId}
          burstNonce={previewBurstState.nonce}
          intensityLevel={previewBurstState.intensity}
          customHeadlineOverride={previewBurstState.headline}
          forceSilentAudio={previewBurstState.soundMode === 'silent'}
          autoDismissSeconds={stageDurationSeconds}
          isPreviewMode
          onDismiss={() => setPreviewBurstState(null)}
        />
      )}

      {/* TOP HERO BANNER */}
      <div className="bg-gradient-to-r from-indigo-950/95 via-slate-900 to-amber-950/90 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                💥 STUDIO EFEK DASHBOARD 100.000X (KHUSUS PANEL ADMIN)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono font-bold text-[10px]">
                100% Dikendalikan Admin • Tanpa Tombol di Sisi Nasabah
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono font-bold text-[10px]">
                {usableCelebrations.length} Efek • 9 Kategori • Real-Time Cloud RTDB
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pusat Kendali Penuh Efek Dashboard 100.000x (1 Orang, Banyak Akun &amp; Semua Nasabah)
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Seluruh tab &amp; pengaturan Efek Dashboard berada <strong>100% di Panel Admin</strong>. Saat Anda mengirim atau menembak efek dari halaman ini, layar Dashboard nasabah yang dituju{' '}
              <strong className="text-amber-300">otomatis meledakkan Panggung 7-Lapis 100.000x</strong> serta menampilkan Spanduk, Aura Kartu Saldo, Partikel Latar, dan Suara Fanfare sesuai saklar yang Anda atur di bawah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() =>
                handleTestStage(
                  activeCelebrationProfile.id,
                  celebrationIntensity,
                  title,
                  soundMode
                )
              }
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-2 shadow-xl"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                💥 Tes Panggung {celebrationIntensity.toUpperCase()} ({activeCelebrationProfile.primaryEmoji}{' '}
                {activeCelebrationProfile.name})
              </span>
            </button>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-400/60 text-emerald-200 font-bold flex items-center justify-between gap-2">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 text-[10px] cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </div>

      {/* MAIN STUDIO GRID: LEFT = TARGET, BANNER & FULL ADMIN SETTINGS (5 COLS), RIGHT = 108 EFFECTS PICKER (7 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN: RECIPIENT SELECTOR, BANNER MESSAGE, DURATION & GRANULAR ADMIN DISPLAY SWITCHES */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>
                {editingPkgId
                  ? '✏️ Edit Paket & Pengaturan Efek Dashboard'
                  : '🚀 Buat & Pengaturan Penuh Efek Dashboard'}
              </span>
            </h3>
            {editingPkgId && (
              <button
                type="button"
                onClick={resetFormToNew}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] cursor-pointer"
              >
                + Buat Paket Baru
              </button>
            )}
          </div>

          {/* 1. PEMILIH PENERIMA: SEMUA NASABAH / 1 AKUN / BANYAK AKUN */}
          <div className="p-3.5 rounded-2xl bg-slate-950/95 border-2 border-emerald-400/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Pilih Target Akun Penerima Efek Dashboard</span>
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
                👤 1 Orang / Akun
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
                </div>
              </div>
            )}
          </div>

          {/* 2. JUDUL SPANDUK, NAMA PENGIRIM & PESAN SAMBUTAN DASHBOARD */}
          <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
            <div>
              <label className="text-[11px] font-bold text-amber-300 block mb-1">
                2. Judul Spanduk &amp; Pengumuman Panggung Dashboard
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: 👑 Selebrasi Kejayaan Sultan Triliuner 100.000x"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Nama Pengirim / Otoritas Resmi
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: Dewan Direksi Bank Nusantara"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-200 font-semibold text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Pesan Sambutan / Spanduk Khusus di Dashboard Nasabah
              </label>
              <textarea
                rows={3}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Tulis pesan sambutan yang akan tampil di Spanduk Efek Dashboard nasabah..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs leading-relaxed"
              />
            </div>
          </div>

          {/* 3. DURASI AKTIF (DETIK / MENIT / JAM / HARI / PERMANEN) & DURASI TAMPIL PANGGUNG */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-400/40 space-y-3">
            <div>
              <label className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Durasi Aktif Efek di Dashboard Nasabah (Detik / Menit / Jam / Hari / Permanen)</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DURATION_OPTIONS.map((d) => {
                  const isSel = durationType === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDurationType(d.id)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition ${
                        isSel
                          ? 'bg-cyan-400 text-slate-950 border-white font-black shadow'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-cyan-400/50'
                      }`}
                    >
                      <span className="text-[10.5px] font-black block">{d.label}</span>
                      <span
                        className={`text-[9px] block leading-tight mt-0.5 ${
                          isSel ? 'text-slate-900 font-semibold' : 'text-slate-400'
                        }`}
                      >
                        {d.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STAGE AUTO-DISMISS DURATION */}
            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold text-amber-300 block mb-1.5">
                ⏱️ Durasi Tampil Panggung Ledakan 100.000x di Layar Nasabah:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {STAGE_DURATION_OPTIONS.map((st) => {
                  const isSel = stageDurationSeconds === st.seconds;
                  return (
                    <button
                      key={st.seconds}
                      type="button"
                      onClick={() => setStageDurationSeconds(st.seconds)}
                      className={`py-1.5 px-2 rounded-xl border text-[10px] font-black cursor-pointer transition ${
                        isSel
                          ? 'bg-amber-400 text-slate-950 border-white'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/40'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 4. PENGATURAN PENUH ELEMEN TAMPILAN, POSISI SPANDUK & SUARA FANFARE (100% ADMIN CONTROL) */}
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border-2 border-amber-400/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Pengaturan Elemen Tampilan, Gaya Spanduk &amp; Suara di Layar Nasabah</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-400/20 text-amber-200 font-mono font-bold text-[9px]">
                100% Kontrol Admin
              </span>
            </div>

            {/* BANNER POSITION / STYLE PRESET */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1">
                <Layout className="w-3.5 h-3.5 text-cyan-400" />
                <span>Gaya &amp; Posisi Spanduk di Dashboard Nasabah:</span>
              </label>
              <div className="grid grid-cols-1 gap-1.5">
                {BANNER_STYLE_OPTIONS.map((bs) => {
                  const isSel = bannerStyle === bs.id;
                  return (
                    <button
                      key={bs.id}
                      type="button"
                      onClick={() => {
                        setBannerStyle(bs.id);
                        if (bs.id === 'aura_only_no_banner') {
                          setShowPersistentDashboardAura(false);
                        } else {
                          setShowPersistentDashboardAura(true);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        isSel
                          ? 'bg-gradient-to-r from-amber-400/25 to-cyan-500/20 border-amber-300 text-white'
                          : 'bg-slate-900/90 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-black text-[11px] flex items-center justify-between">
                        <span>{bs.label}</span>
                        {isSel && (
                          <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                            ✓ Terpilih
                          </span>
                        )}
                      </div>
                      <span className="text-[9.5px] text-slate-400 block mt-0.5">{bs.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AUDIO SYNTHESIZER CONTROL */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[10.5px] font-bold text-slate-300 block">
                🔊 Pengaturan Suara Musik Fanfare Synthesizer di Layar Nasabah:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSoundMode('fanfare_auto')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer flex items-center gap-2 transition ${
                    soundMode === 'fanfare_auto'
                      ? 'bg-emerald-400 text-slate-950 border-white font-black shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  <Volume2 className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[10.5px] font-black block">Suara Fanfare Aktif</span>
                    <span className="text-[9px] block opacity-80">Musik &amp; dentuman otomatis</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setSoundMode('silent')}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer flex items-center gap-2 transition ${
                    soundMode === 'silent'
                      ? 'bg-rose-400 text-slate-950 border-white font-black shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="text-[10.5px] font-black block">Mode Senyap (Silent)</span>
                    <span className="text-[9px] block opacity-80">Visual 100.000x tanpa suara</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 4 GRANULAR ELEMENT SWITCHES */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10.5px] font-black text-cyan-300 block">
                Saklar On/Off Per Elemen Tampilan di Dashboard Nasabah:
              </span>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-amber-400/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoBlastOnOpen}
                  onChange={(e) => setAutoBlastOnOpen(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-black text-amber-200 text-[11px] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>1. Otomatis Ledakkan Panggung 100.000x Saat Dikirim Admin</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Begitu Admin menekan Kirim / Tembak Ulang, layar Dashboard nasabah langsung meledakkan Panggung 7-Lapis 100.000x secara Real-Time!
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPersistentDashboardAura}
                  onChange={(e) => setShowPersistentDashboardAura(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-cyan-200 text-[11px] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    <span>2. Tampilkan Spanduk Sambutan &amp; Segel Mandala 3D di Dashboard</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Menampilkan spanduk pengumuman dan segel mandala 3D di atas Dashboard nasabah (tanpa tombol di sisi nasabah).
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={decorateBalanceCard}
                  onChange={(e) => setDecorateBalanceCard(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-emerald-200 text-[11px] flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. Hiasi Kartu Saldo Utama &amp; Header Dashboard dengan Aura Neon</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Memberikan bingkai neon menyala &amp; pancaran warna tema pada Kartu Saldo Utama nasabah.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showAmbientParticles}
                  onChange={(e) => setShowAmbientParticles(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <span className="font-bold text-fuchsia-200 text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>4. Tampilkan Hujan Partikel Latar Melayang di Layar Dashboard</span>
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    Menampilkan partikel tema melayang halus di seluruh latar layar Dashboard nasabah.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleSaveAndSend(false)}
              className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 font-black cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>{editingPkgId ? 'Simpan Pengaturan' : 'Simpan Tanpa Ledakan'}</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAndSend(true)}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xl"
            >
              <Send className="w-4 h-4" />
              <span>💥 Kirim &amp; Ledakkan 100.000x Sekarang!</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: 108 CELEBRATION EFFECTS CATALOG + 100,000X INTENSITY SELECTOR */}
        <div className="lg:col-span-7 bg-slate-900/95 border-2 border-amber-400/60 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider inline-block mb-1">
                💥 KATALOG {usableCelebrations.length} EFEK PERAYAAN (SAMA PERSIS DENGAN HADIAH &amp; SURAT)
              </span>
              <h3 className="font-black text-white text-sm sm:text-base">
                Pilih 1 Efek Perayaan &amp; Tingkat Kemeriahan Panggung (Hingga 100.000x Ultra Max Overdrive)
              </h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Setiap efek memiliki <strong>koreografi parade maskot unik, 14 sinar laser panggung, portal mandala 3D, trofi hologram 3D, dan melodi synthesizer Web Audio API</strong>.
              </p>
            </div>
          </div>

          {/* INTENSITY MULTIPLIER SELECTOR */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-400/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black text-amber-300">
                ⚡ Pilih Tingkat Intensitas Panggung Selebrasi Dashboard:
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[10px]">
                AKTIF: {celebrationIntensity.toUpperCase()}
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
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      isActiveInt
                        ? 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 border-white font-black shadow-lg'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-amber-400/50'
                    }`}
                  >
                    <div className="text-xs font-black">{opt.label}</div>
                    <div
                      className={`text-[9.5px] leading-tight mt-0.5 ${
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

          {/* ACTIVE SELECTED EFFECT SUMMARY CARD */}
          <div
            className={`p-3.5 rounded-2xl bg-gradient-to-r ${activeCelebrationProfile.bannerGradientClass} border-2 ${activeCelebrationProfile.cardBorderAccentClass} flex flex-wrap items-center justify-between gap-3`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-slate-950/75 border-2 border-white/30 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                {activeCelebrationProfile.primaryEmoji}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950/90 text-amber-300 font-black text-[9.5px] uppercase tracking-wider">
                    ✓ EFEK DASHBOARD TERPILIH • {celebrationIntensity.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-white/95">
                    {activeCelebrationProfile.categoryLabel}
                  </span>
                </div>
                <h4 className="font-black text-white text-sm truncate mt-0.5">
                  {activeCelebrationProfile.name}
                </h4>
                <p className="text-[10.5px] text-white/90 truncate">
                  {activeCelebrationProfile.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-950/70 px-2.5 py-1.5 rounded-xl border border-white/15">
                {activeCelebrationProfile.particleEmojis.map((em, idx) => (
                  <span key={idx} className="text-base select-none">
                    {em}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  handleTestStage(
                    activeCelebrationProfile.id,
                    celebrationIntensity,
                    title,
                    soundMode
                  )
                }
                className="px-3 py-2 rounded-xl bg-amber-300 hover:bg-white text-slate-950 font-black text-[11px] cursor-pointer shadow-lg shrink-0"
              >
                💥 Uji Panggung
              </button>
            </div>
          </div>

          {/* 9 CATEGORY TABS + SEARCH */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {CELEBRATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCelebCategoryFilter(cat.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-black cursor-pointer border transition ${
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
                placeholder={`Cari dari ${usableCelebrations.length} efek perayaan (Ulang Tahun, 17 Agustus, Idul Fitri, Sultan, Cyberpunk, Anime, Galaksi...)`}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* 108 EFFECTS RADIO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[540px] overflow-y-auto pr-1">
            {filteredCelebrations.map((item) => {
              const isSelected = activeCelebrationProfile.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setCelebrationEffect(item.id)}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setCelebrationEffect(item.id);
                    }
                  }}
                  className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'bg-gradient-to-br from-amber-500/25 via-slate-900 to-slate-950 border-amber-400 shadow-lg ring-1 ring-amber-300/50'
                      : 'bg-slate-950/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border-white font-black'
                            : 'bg-slate-900 border-slate-700'
                        }`}
                      >
                        {item.primaryEmoji}
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-white text-xs block truncate">
                          {item.name}
                        </span>
                        <span className="text-[9.5px] text-amber-300/90 font-semibold block">
                          {item.categoryLabel}
                        </span>
                        <span className="text-[9.5px] text-slate-400 block line-clamp-1">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase shrink-0 ${
                        isSelected
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isSelected ? '● Aktif' : 'Pilih'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-xs">
                      {item.particleEmojis.slice(0, 5).map((em, i) => (
                        <span key={i} className="select-none">
                          {em}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCelebrationEffect(item.id);
                        handleTestStage(
                          item.id,
                          celebrationIntensity,
                          item.celebrationHeadline,
                          soundMode
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/50 text-amber-200 font-black text-[9.5px] cursor-pointer transition"
                    >
                      💥 Tes 100.000x
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABEL PANTAUAN LIVE EFEK AKTIF PER AKUN NASABAH (KONTROL REAL-TIME 1-KLIK)
         ========================================================================= */}
      <div className="bg-slate-900/95 border-2 border-cyan-400/60 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider inline-block mb-1">
              📡 PANTAUAN LIVE &amp; KONTROL PAKSA PER AKUN NASABAH
            </span>
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>
                Tabel Status Efek Dashboard Aktif di Setiap Akun Nasabah ({accounts.length} Akun)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Pantau efek mana yang sedang tampil di layar masing-masing nasabah, ganti efek utama per akun, tembak ledakan 100.000x ke 1 akun, atau sembunyikan/tampilkan efek secara real-time.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={accountMonitorSearch}
              onChange={(e) => setAccountMonitorSearch(e.target.value)}
              placeholder="Cari nama nasabah / nomor rekening..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Nasabah &amp; Rekening</th>
                <th className="py-2.5 px-3">Efek Utama yang Tampil di Dashboard</th>
                <th className="py-2.5 px-3">Elemen &amp; Durasi</th>
                <th className="py-2.5 px-3 text-right">Kontrol Langsung Admin (Real-Time)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredMonitorAccounts.map((acc) => {
                const { eligiblePackages, primaryPackage } =
                  resolveActiveDashboardEffectsForAccount(dashboardEffectEvents, acc.id);
                const activeCeleb = primaryPackage
                  ? getCelebrationEffectProfile(primaryPackage.celebrationEffect)
                  : null;

                return (
                  <tr
                    key={acc.id}
                    className="hover:bg-slate-950/60 transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-black text-white">{acc.fullName}</div>
                      <div className="text-[10.5px] font-mono text-slate-400">
                        Rek: {acc.accountNumber} •{' '}
                        <span className="text-amber-300 uppercase">{acc.cardTier}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {primaryPackage && activeCeleb ? (
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-950 border border-amber-400/50 flex items-center justify-center text-lg shrink-0">
                            {activeCeleb.primaryEmoji}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-black text-white text-xs">
                                {activeCeleb.name}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                                {(primaryPackage.celebrationIntensity || '100000x').toUpperCase()}
                              </span>
                              {eligiblePackages.length > 1 && (
                                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[9px]">
                                  +{eligiblePackages.length - 1} paket lain
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-300 line-clamp-1">
                              {primaryPackage.title}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 text-[10.5px] font-semibold inline-block">
                          🚫 Tidak Ada Efek Tampil (Disembunyikan / Kosong)
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {primaryPackage ? (
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 font-mono font-bold text-[9.5px]">
                              {formatDashboardEffectRemainingLabel(primaryPackage)}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 text-[9.5px]">
                              {primaryPackage.soundMode === 'silent' ? '🔇 Senyap' : '🔊 Fanfare'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {primaryPackage.showPersistentDashboardAura ? '✓ Spanduk' : '✗ Spanduk'} •{' '}
                            {primaryPackage.decorateBalanceCard ? '✓ Aura Kartu' : '✗ Aura Kartu'} •{' '}
                            {primaryPackage.showAmbientParticles !== false
                              ? '✓ Partikel'
                              : '✗ Partikel'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-[10.5px] text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {/* Quick Switch Primary Package or Blast Directly from 108 Catalog */}
                        {dashboardEffectEvents.length > 0 && (
                          <select
                            value={primaryPackage?.id || ''}
                            onChange={(e) => {
                              const chosenPkgId = e.target.value;
                              if (!chosenPkgId) return;
                              const res = adminSetPrimaryDashboardEffectForAccount(
                                chosenPkgId,
                                acc.id,
                                true
                              );
                              setFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-400/50 text-amber-200 font-bold text-[10.5px] max-w-[180px]"
                            title="Pilih Paket Efek Utama untuk Akun Ini"
                          >
                            <option value="" disabled>
                              🎨 Pilih Paket Efek...
                            </option>
                            {dashboardEffectEvents.map((p) => {
                              const c = getCelebrationEffectProfile(p.celebrationEffect);
                              return (
                                <option key={p.id} value={p.id}>
                                  {c.primaryEmoji} {p.title}
                                </option>
                              );
                            })}
                          </select>
                        )}

                        {/* Quick Blast Current Active Effect to This Account */}
                        {primaryPackage ? (
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminSetPrimaryDashboardEffectForAccount(
                                primaryPackage.id,
                                acc.id,
                                true
                              );
                              setFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 hover:from-white hover:to-amber-200 text-slate-950 font-black text-[10.5px] cursor-pointer flex items-center gap-1 shadow"
                            title="Tembak Ulang Ledakan 100.000x ke Akun Ini"
                          >
                            <Zap className="w-3 h-3" />
                            <span>💥 Tembak</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleQuickSendNewEffectToAccount(
                                acc.id,
                                activeCelebrationProfile.id
                              )
                            }
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black text-[10.5px] cursor-pointer flex items-center gap-1 shadow"
                          >
                            <Zap className="w-3 h-3" />
                            <span>
                              💥 Pasang {activeCelebrationProfile.primaryEmoji}
                            </span>
                          </button>
                        )}

                        {/* Force Hide or Restore for This Specific Account */}
                        {primaryPackage ? (
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminHideAllDashboardEffectsForAccount(acc.id);
                              setFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/50 text-rose-200 font-bold text-[10.5px] cursor-pointer flex items-center gap-1"
                            title="Sembunyikan Seluruh Efek Dashboard di Akun Ini"
                          >
                            <EyeOff className="w-3 h-3" />
                            <span>Sembunyikan</span>
                          </button>
                        ) : (
                          dashboardEffectEvents.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = adminRestoreAllDashboardEffectsForAccount(acc.id);
                                setFeedback(res.message);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/50 text-cyan-200 font-bold text-[10.5px] cursor-pointer flex items-center gap-1"
                              title="Tampilkan Kembali Efek Dashboard di Akun Ini"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Tampilkan</span>
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          DAFTAR PAKET EFEK DASHBOARD YANG SUDAH DIKIRIM / AKTIF
         ========================================================================= */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                Daftar Paket Efek Dashboard Terkirim &amp; Pengaturan Cepat ({dashboardEffectEvents.length} Paket)
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ubah saklar tampilan (Spanduk, Aura Kartu Saldo, Partikel Latar, Suara Fanfare, Gaya Spanduk, Durasi), ganti efek cepat, atau tembak ulang ledakan 100.000x secara real-time.
            </p>
          </div>
        </div>

        {dashboardEffectEvents.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            Belum ada paket Efek Dashboard yang dibuat. Silakan pilih efek di atas lalu klik Kirim!
          </div>
        ) : (
          <div className="space-y-3.5">
            {dashboardEffectEvents.map((pkg) => {
              const celeb = getCelebrationEffectProfile(pkg.celebrationEffect);
              const intensity = pkg.celebrationIntensity || '100000x';
              const isAllTarget = !pkg.targetAccountId || pkg.targetAccountId === '__ALL__';
              const targetIds =
                Array.isArray(pkg.targetAccountIds) && pkg.targetAccountIds.length > 0
                  ? pkg.targetAccountIds
                  : pkg.targetAccountId &&
                    pkg.targetAccountId !== '__ALL__' &&
                    pkg.targetAccountId !== '__MULTI__'
                  ? [pkg.targetAccountId]
                  : [];
              const isManagingThis = managingPkgId === pkg.id;
              const durationMeta =
                DURATION_OPTIONS.find((d) => d.id === pkg.durationType) ||
                DURATION_OPTIONS[DURATION_OPTIONS.length - 1];

              const baseRecipientAccounts = isAllTarget
                ? accounts
                : accounts.filter((a) => targetIds.includes(a.id));
              const filteredManageAccounts = baseRecipientAccounts.filter((a) => {
                if (!manageRecipientSearch.trim()) return true;
                const q = manageRecipientSearch.toLowerCase();
                return (
                  a.fullName.toLowerCase().includes(q) ||
                  a.accountNumber.toLowerCase().includes(q)
                );
              });

              return (
                <div
                  key={pkg.id}
                  className={`p-5 rounded-3xl border-2 space-y-3.5 transition-all ${
                    pkg.isActive
                      ? 'bg-slate-950/95 border-amber-400/60 shadow-xl'
                      : 'bg-slate-950/50 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${celeb.bannerGradientClass} border ${celeb.cardBorderAccentClass} text-white font-black text-[10px] flex items-center gap-1`}
                        >
                          <span>{celeb.primaryEmoji}</span>
                          <span>{celeb.name}</span>
                          <span>• {intensity.toUpperCase()}</span>
                        </span>

                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 font-bold text-[10px]">
                          👥 Target:{' '}
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

                        <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-bold text-[10px]">
                          {durationMeta.label} ({formatDashboardEffectRemainingLabel(pkg)})
                        </span>

                        <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-bold text-[10px]">
                          {pkg.soundMode === 'silent' ? '🔇 Mode Senyap' : '🔊 Fanfare Aktif'}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            pkg.isActive
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {pkg.isActive ? '● Aktif di Dashboard' : 'Nonaktif'}
                        </span>
                      </div>

                      <h4 className="font-black text-white text-sm sm:text-base">{pkg.title}</h4>
                      <span className="text-[11px] text-amber-200 font-semibold block">
                        Pengirim: {pkg.senderName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {celeb.particleEmojis.map((em, idx) => (
                        <span key={idx} className="text-base select-none">
                          {em}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* QUICK ADMIN ELEMENT TOGGLE PILLS DIRECTLY ON PACKAGE CARD */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 mr-1">
                      Saklar Cepat Admin:
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                          showPersistentDashboardAura: !pkg.showPersistentDashboardAura,
                        });
                        setFeedback(res.message);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition ${
                        pkg.showPersistentDashboardAura
                          ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {pkg.showPersistentDashboardAura ? '✓ Spanduk ON' : '✗ Spanduk OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                          decorateBalanceCard: !pkg.decorateBalanceCard,
                        });
                        setFeedback(res.message);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition ${
                        pkg.decorateBalanceCard
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-200'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {pkg.decorateBalanceCard ? '✓ Aura Kartu ON' : '✗ Aura Kartu OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                          showAmbientParticles: pkg.showAmbientParticles === false,
                        });
                        setFeedback(res.message);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition ${
                        pkg.showAmbientParticles !== false
                          ? 'bg-fuchsia-500/20 border-fuchsia-400/60 text-fuchsia-200'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {pkg.showAmbientParticles !== false
                        ? '✓ Partikel Latar ON'
                        : '✗ Partikel Latar OFF'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                          soundMode: pkg.soundMode === 'silent' ? 'fanfare_auto' : 'silent',
                        });
                        setFeedback(res.message);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border transition ${
                        pkg.soundMode !== 'silent'
                          ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400'
                      }`}
                    >
                      {pkg.soundMode !== 'silent' ? '🔊 Suara Fanfare ON' : '🔇 Mode Senyap'}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-300 bg-slate-900/75 p-2.5 rounded-xl border border-slate-800">
                    <strong className="text-amber-300">Spanduk Dashboard:</strong>{' '}
                    {pkg.welcomeMessage}
                  </p>

                  {/* ACTION BAR */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminTriggerDashboardEffectBlastNow(pkg.id);
                        setFeedback(res.message);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1.5 shadow-lg"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>💥 Tembak Ulang Ledakan 100.000x Sekarang</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleTestStage(
                          celeb.id,
                          intensity,
                          pkg.title,
                          pkg.soundMode || 'fanfare_auto'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 font-black text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Tes Panggung di Admin</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setManagingPkgId((prev) => (prev === pkg.id ? null : pkg.id))
                      }
                      className={`px-3 py-1.5 rounded-xl font-black text-[11px] cursor-pointer flex items-center gap-1.5 border ${
                        isManagingThis
                          ? 'bg-cyan-400 text-slate-950 border-cyan-200'
                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border-cyan-400/50'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>
                        {isManagingThis
                          ? 'Tutup Panel Kelola'
                          : 'Pengaturan Cepat & Kelola Penerima'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminDuplicateDashboardEffect(pkg.id, { sendNow: true });
                        setFeedback(res.message);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/40 text-fuchsia-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplikasi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadPackageIntoEditor(pkg)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit di Form</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminToggleDashboardEffectActive(pkg.id);
                        setFeedback(res.message);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Power className="w-3 h-3" />
                      <span>{pkg.isActive ? 'Matikan' : 'Aktifkan'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminDeleteDashboardEffect(pkg.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Hapus</span>
                    </button>
                  </div>

                  {/* EXPANDABLE DRAWER: QUICK EFFECT / INTENSITY / DURATION / BANNER STYLE SWITCHER & PER-ACCOUNT REVOKE */}
                  {isManagingThis && (
                    <div className="p-4 rounded-2xl bg-slate-900/95 border-2 border-cyan-400/60 space-y-4 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-slate-950 border border-amber-400/40 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-black text-amber-200 block">
                            💥 Ganti Cepat Efek ({usableCelebrations.length} Tema), Intensitas, Gaya Spanduk &amp; Durasi:
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Langsung berubah &amp; meledak real-time di layar Dashboard nasabah penerima!
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={celeb.id}
                            onChange={(e) => {
                              const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                                celebrationEffect: e.target.value,
                                autoBlastNow: true,
                              });
                              setFeedback(res.message);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-400/50 text-white font-bold text-[11px]"
                          >
                            {usableCelebrations.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.primaryEmoji} {c.name} ({c.categoryLabel})
                              </option>
                            ))}
                          </select>

                          <select
                            value={intensity}
                            onChange={(e) => {
                              const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                                celebrationIntensity: e.target.value as CelebrationIntensityLevel,
                                autoBlastNow: true,
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

                          <select
                            value={pkg.durationType || 'permanent'}
                            onChange={(e) => {
                              const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                                durationType: e.target.value as DashboardEffectDurationType,
                              });
                              setFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-400/50 text-emerald-200 font-bold text-[11px]"
                          >
                            {DURATION_OPTIONS.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.label}
                              </option>
                            ))}
                          </select>

                          <select
                            value={pkg.bannerStyle || 'full_top_banner'}
                            onChange={(e) => {
                              const nextStyle = e.target.value as DashboardEffectBannerStyle;
                              const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                                bannerStyle: nextStyle,
                                showPersistentDashboardAura:
                                  nextStyle !== 'aura_only_no_banner',
                              });
                              setFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-fuchsia-400/50 text-fuchsia-200 font-bold text-[11px]"
                          >
                            {BANNER_STYLE_OPTIONS.map((bs) => (
                              <option key={bs.id} value={bs.id}>
                                {bs.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Per-Recipient Revoke / Restore / Force Primary List */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-black text-white">
                            Daftar Akun Penerima Paket Ini ({filteredManageAccounts.length} Akun):
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

                        <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                          {filteredManageAccounts.map((acc) => {
                            const isRevoked = (pkg.revokedAccountIds || []).includes(acc.id);
                            const isForcedPrimary = (
                              pkg.forcedPrimaryForAccountIds || []
                            ).includes(acc.id);
                            return (
                              <div
                                key={acc.id}
                                className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 ${
                                  isRevoked
                                    ? 'bg-rose-950/40 border-rose-500/50 opacity-80'
                                    : 'bg-slate-950/90 border-slate-800'
                                }`}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-white text-xs">
                                    {acc.fullName}
                                  </span>
                                  <span className="font-mono text-[10px] text-slate-400">
                                    ({acc.accountNumber})
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                                      isRevoked
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                                    }`}
                                  >
                                    {isRevoked
                                      ? '🚫 Disembunyikan dari Akun Ini'
                                      : '✨ Tampil di Dashboard Akun Ini'}
                                  </span>
                                  {isForcedPrimary && !isRevoked && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[9px]">
                                      ★ Efek Utama Akun Ini
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5">
                                  {!isRevoked && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const res = adminSetPrimaryDashboardEffectForAccount(
                                          pkg.id,
                                          acc.id,
                                          true
                                        );
                                        setFeedback(res.message);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer flex items-center gap-1"
                                    >
                                      <Zap className="w-3 h-3" />
                                      <span>💥 Jadikan Utama &amp; Ledakkan</span>
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => {
                                      const res = adminToggleRevokeDashboardEffectRecipient(
                                        pkg.id,
                                        acc.id
                                      );
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
                                        <span>Tampilkan Kembali</span>
                                      </>
                                    ) : (
                                      <>
                                        <Ban className="w-3 h-3" />
                                        <span>Sembunyikan dari Akun Ini</span>
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
