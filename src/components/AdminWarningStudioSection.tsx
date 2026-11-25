import React, { useEffect, useMemo, useState } from 'react';
import {
  Send,
  RefreshCw,
  Trash2,
  Edit3,
  Power,
  Search,
  Check,
  Sparkles,
  Users,
  Eye,
  BellRing,
  Maximize2,
  PanelTop,
  X,
  Lock,
  Unlock,
  Star,
  Palette,
  Layers,
  Play,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AdminSystemWarning,
  AdminSystemWarningPreset,
  AdminWarningAnimationStyle,
  AdminWarningBgPattern,
  AdminWarningCategory,
  AdminWarningColorTheme,
  AdminWarningDisplayMode,
  AdminWarningIconKey,
  AdminWarningTargetMode,
  AdminWarningVisualStyle,
  CardTier,
} from '../types/bank';
import {
  ADMIN_WARNING_ANIMATION_STYLES,
  ADMIN_WARNING_BG_PATTERNS,
  ADMIN_WARNING_CATEGORIES,
  ADMIN_WARNING_ICON_OPTIONS,
  ADMIN_WARNING_PRESETS_80,
  ADMIN_WARNING_THEME_OPTIONS,
  ADMIN_WARNING_VISUAL_STYLES,
  getAdminWarningPatternStyle,
  getAdminWarningThemeMeta,
} from '../data/adminWarningPresets';
import {
  AdminWarningBannerBar,
  AdminWarningPopupCard,
  AdminWarningVisualModel,
  renderAdminWarningIcon,
  resolveWarningLockScreen,
} from './AdminWarningOverlay';

const CARD_TIERS_LIST: { tier: CardTier; label: string }[] = [
  { tier: 'regular', label: 'Reguler' },
  { tier: 'gold', label: 'Gold' },
  { tier: 'premium', label: 'Platinum' },
  { tier: 'platinum', label: 'Infinite Metal' },
  { tier: 'admin', label: 'Admin' },
];

const FAVORITE_TEMPLATES_STORAGE_KEY = 'bn_admin_warning_fav_templates_v1';

function loadFavoriteTemplateIds(): string[] {
  try {
    if (typeof window === 'undefined') return ['preset-01', 'preset-18', 'preset-39', 'preset-51'];
    const raw = window.localStorage.getItem(FAVORITE_TEMPLATES_STORAGE_KEY);
    if (!raw) return ['preset-01', 'preset-18', 'preset-39', 'preset-51'];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return ['preset-01', 'preset-18', 'preset-39', 'preset-51'];
  }
}

export const AdminWarningStudioSection: React.FC = () => {
  const {
    accounts,
    adminWarnings,
    adminSaveWarning,
    adminToggleWarningActive,
    adminResendWarning,
    adminDeleteWarning,
  } = useBank();

  // State editor peringatan
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>('preset-01');
  const [title, setTitle] = useState(ADMIN_WARNING_PRESETS_80[0]?.title || '');
  const [message, setMessage] = useState(ADMIN_WARNING_PRESETS_80[0]?.message || '');
  const [iconKey, setIconKey] = useState<AdminWarningIconKey>(
    ADMIN_WARNING_PRESETS_80[0]?.iconKey || 'wrench'
  );
  const [colorTheme, setColorTheme] = useState<AdminWarningColorTheme>(
    ADMIN_WARNING_PRESETS_80[0]?.colorTheme || 'amber'
  );
  const [displayMode, setDisplayMode] = useState<AdminWarningDisplayMode>('popup');
  const [lockScreen, setLockScreen] = useState<boolean>(false);
  const [isPermanent, setIsPermanent] = useState(false);
  const [showPermanentLabel, setShowPermanentLabel] = useState(true);
  const [dismissible, setDismissible] = useState(true);

  // State desain visual khas template & kustomisasi manual
  const [visualStyle, setVisualStyle] = useState<AdminWarningVisualStyle>(
    ADMIN_WARNING_PRESETS_80[0]?.visualStyle || 'cyber_terminal'
  );
  const [bgPattern, setBgPattern] = useState<AdminWarningBgPattern>(
    ADMIN_WARNING_PRESETS_80[0]?.bgPattern || 'circuit_grid'
  );
  const [animationStyle, setAnimationStyle] = useState<AdminWarningAnimationStyle>(
    ADMIN_WARNING_PRESETS_80[0]?.animationStyle || 'smooth_zoom'
  );
  const [badgeText, setBadgeText] = useState<string>(
    ADMIN_WARNING_PRESETS_80[0]?.badgeText || 'MAINTENANCE SISTEM'
  );
  const [estimatedDurationText, setEstimatedDurationText] = useState<string>(
    ADMIN_WARNING_PRESETS_80[0]?.estimatedDurationText || '± 15 Menit'
  );
  const [referenceCode, setReferenceCode] = useState<string>(
    ADMIN_WARNING_PRESETS_80[0]?.referenceCode || 'BN-MNT-001'
  );
  const [ctaLabel, setCtaLabel] = useState<string>(
    ADMIN_WARNING_PRESETS_80[0]?.ctaLabel || 'Mengerti & Lanjutkan'
  );
  const [showOfficialStamp, setShowOfficialStamp] = useState<boolean>(true);

  // Target penerima
  const [targetMode, setTargetMode] = useState<AdminWarningTargetMode>('all');
  const [targetTiers, setTargetTiers] = useState<CardTier[]>([
    'regular',
    'gold',
    'premium',
    'platinum',
  ]);
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>([]);

  // Navigasi galeri 80 template
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<
    'all' | 'favorites' | AdminWarningCategory
  >('all');
  const [templateSearch, setTemplateSearch] = useState('');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(loadFavoriteTemplateIds);

  // Preview & feedback
  const [previewReplayKey, setPreviewReplayKey] = useState(0);
  const [isFullscreenPreviewOpen, setIsFullscreenPreviewOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState('');
  const [feedback, setFeedback] = useState<string>('');
  const [showAllIcons, setShowAllIcons] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(FAVORITE_TEMPLATES_STORAGE_KEY, JSON.stringify(favoriteIds));
    } catch {
      // Abaikan jika penyimpanan lokal penuh
    }
  }, [favoriteIds]);

  const toggleFavoriteTemplate = (presetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setFavoriteIds((prev) =>
      prev.includes(presetId) ? prev.filter((id) => id !== presetId) : [...prev, presetId]
    );
  };

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: ADMIN_WARNING_PRESETS_80.length,
      favorites: favoriteIds.length,
    };
    for (const p of ADMIN_WARNING_PRESETS_80) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [favoriteIds]);

  const filteredPresets = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    return ADMIN_WARNING_PRESETS_80.filter((preset) => {
      if (presetCategoryFilter === 'favorites' && !favoriteIds.includes(preset.id)) {
        return false;
      }
      if (
        presetCategoryFilter !== 'all' &&
        presetCategoryFilter !== 'favorites' &&
        preset.category !== presetCategoryFilter
      ) {
        return false;
      }
      if (!q) return true;
      const codeStr = `#${String(preset.code).padStart(2, '0')}`;
      return (
        preset.name.toLowerCase().includes(q) ||
        preset.title.toLowerCase().includes(q) ||
        preset.message.toLowerCase().includes(q) ||
        preset.designTag.toLowerCase().includes(q) ||
        preset.badgeText.toLowerCase().includes(q) ||
        codeStr.includes(q) ||
        String(preset.code) === q
      );
    });
  }, [presetCategoryFilter, templateSearch, favoriteIds]);

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        (a.userId16 || '').toLowerCase().includes(q)
    );
  }, [accounts, accountSearch]);

  const applyPreset = (preset: AdminSystemWarningPreset) => {
    setEditingId(null);
    setSelectedTemplateId(preset.id);
    setTitle(preset.title);
    setMessage(preset.message);
    setIconKey(preset.iconKey);
    setColorTheme(preset.colorTheme);
    setDisplayMode(preset.suggestedDisplayMode);
    setLockScreen(preset.suggestedLockScreen);
    setIsPermanent(preset.suggestedPermanent);
    setShowPermanentLabel(preset.suggestedShowPermanentLabel);
    setDismissible(preset.suggestedDismissible);
    setVisualStyle(preset.visualStyle);
    setBgPattern(preset.bgPattern);
    setAnimationStyle(preset.animationStyle);
    setBadgeText(preset.badgeText);
    setEstimatedDurationText(preset.estimatedDurationText || '');
    setReferenceCode(preset.referenceCode || '');
    setCtaLabel(preset.ctaLabel || 'Mengerti & Tutup');
    setShowOfficialStamp(preset.showOfficialStamp);
    setPreviewReplayKey((k) => k + 1);
    setFeedback(
      `Template #${String(preset.code).padStart(2, '0')} "${preset.name}" dimuat (${
        preset.suggestedDisplayMode === 'popup'
          ? preset.suggestedLockScreen
            ? 'Pop-up • Kunci Layar'
            : 'Pop-up • Bisa Klik Belakang'
          : 'Banner Atas'
      }). Anda bebas ubah desain atau langsung kirim.`
    );
  };

  const loadForEdit = (w: AdminSystemWarning) => {
    setEditingId(w.id);
    setSelectedTemplateId(w.templateId || null);
    setTitle(w.title);
    setMessage(w.message);
    setIconKey(w.iconKey);
    setColorTheme(w.colorTheme);
    setDisplayMode(w.displayMode);
    setLockScreen(resolveWarningLockScreen(w));
    setIsPermanent(w.isPermanent);
    setShowPermanentLabel(w.showPermanentLabel);
    setDismissible(w.dismissible);
    setVisualStyle(w.visualStyle || 'executive_glass');
    setBgPattern(w.bgPattern || 'radial_spotlight');
    setAnimationStyle(w.animationStyle || 'smooth_zoom');
    setBadgeText(w.badgeText || '');
    setEstimatedDurationText(w.estimatedDurationText || '');
    setReferenceCode(w.referenceCode || '');
    setCtaLabel(w.ctaLabel || 'Mengerti & Tutup');
    setShowOfficialStamp(w.showOfficialStamp ?? true);
    setTargetMode(w.targetMode);
    setTargetTiers(w.targetTiers || []);
    setTargetAccountIds(w.targetAccountIds || []);
    setPreviewReplayKey((k) => k + 1);
    setFeedback(`Mengedit peringatan "${w.title}".`);
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedTemplateId(null);
    setTitle('');
    setMessage('');
    setIconKey('megaphone');
    setColorTheme('sky');
    setDisplayMode('popup');
    setLockScreen(false);
    setIsPermanent(false);
    setShowPermanentLabel(true);
    setDismissible(true);
    setVisualStyle('executive_glass');
    setBgPattern('radial_spotlight');
    setAnimationStyle('smooth_zoom');
    setBadgeText('PEMBERITAHUAN RESMI');
    setEstimatedDurationText('');
    setReferenceCode('');
    setCtaLabel('Mengerti & Tutup');
    setShowOfficialStamp(true);
    setTargetMode('all');
    setTargetAccountIds([]);
    setPreviewReplayKey((k) => k + 1);
  };

  const handleToggleTier = (tier: CardTier) => {
    setTargetTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleToggleAccount = (accId: string) => {
    setTargetAccountIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  const buildWarningPayloadFromExisting = (
    w: AdminSystemWarning,
    overrides: Partial<AdminSystemWarning>
  ) => ({
    id: w.id,
    title: overrides.title ?? w.title,
    message: overrides.message ?? w.message,
    iconKey: overrides.iconKey ?? w.iconKey,
    colorTheme: overrides.colorTheme ?? w.colorTheme,
    displayMode: overrides.displayMode ?? w.displayMode,
    isActive: overrides.isActive ?? w.isActive,
    isPermanent: overrides.isPermanent ?? w.isPermanent,
    showPermanentLabel: overrides.showPermanentLabel ?? w.showPermanentLabel,
    dismissible: overrides.dismissible ?? w.dismissible,
    lockScreen: overrides.lockScreen ?? resolveWarningLockScreen(w),
    templateId: overrides.templateId ?? w.templateId,
    visualStyle: overrides.visualStyle ?? w.visualStyle,
    bgPattern: overrides.bgPattern ?? w.bgPattern,
    animationStyle: overrides.animationStyle ?? w.animationStyle,
    badgeText: overrides.badgeText ?? w.badgeText,
    estimatedDurationText: overrides.estimatedDurationText ?? w.estimatedDurationText,
    referenceCode: overrides.referenceCode ?? w.referenceCode,
    ctaLabel: overrides.ctaLabel ?? w.ctaLabel,
    showOfficialStamp: overrides.showOfficialStamp ?? w.showOfficialStamp,
    targetMode: overrides.targetMode ?? w.targetMode,
    targetTiers: overrides.targetTiers ?? w.targetTiers,
    targetAccountIds: overrides.targetAccountIds ?? w.targetAccountIds,
  });

  const handleQuickSwitchDisplayMode = (w: AdminSystemWarning) => {
    const nextMode: AdminWarningDisplayMode = w.displayMode === 'popup' ? 'banner' : 'popup';
    const res = adminSaveWarning(buildWarningPayloadFromExisting(w, { displayMode: nextMode }));
    setFeedback(
      res.success
        ? `Mode "${w.title}" diubah ke ${nextMode === 'popup' ? 'Pop-up Tengah' : 'Banner Atas'} dan disinkronkan real-time.`
        : res.message
    );
  };

  const handleQuickToggleLockScreen = (w: AdminSystemWarning) => {
    const nextLock = !resolveWarningLockScreen(w);
    const res = adminSaveWarning(buildWarningPayloadFromExisting(w, { lockScreen: nextLock }));
    setFeedback(
      res.success
        ? `Mode interaksi "${w.title}" diubah ke ${
            nextLock ? 'Kunci Total Layar' : 'Tetap Bisa Klik Belakang'
          } secara real-time.`
        : res.message
    );
  };

  const handleSaveAndSend = (e: React.FormEvent) => {
    e.preventDefault();
    const res = adminSaveWarning({
      id: editingId || undefined,
      title,
      message,
      iconKey,
      colorTheme,
      displayMode,
      isActive: true,
      isPermanent,
      showPermanentLabel,
      dismissible,
      lockScreen: displayMode === 'popup' ? lockScreen : false,
      templateId: selectedTemplateId || undefined,
      visualStyle,
      bgPattern,
      animationStyle,
      badgeText: badgeText.trim() || undefined,
      estimatedDurationText: estimatedDurationText.trim() || undefined,
      referenceCode: referenceCode.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      showOfficialStamp,
      targetMode,
      targetTiers,
      targetAccountIds,
    });
    setFeedback(res.message);
    if (res.success && editingId) {
      setEditingId(null);
    }
  };

  const previewModel: AdminWarningVisualModel = useMemo(
    () => ({
      title: title || 'Judul Pemberitahuan Sistem',
      message:
        message ||
        'Pratinjau isi pesan akan tampil di sini secara real-time. Pilih salah satu dari 80 template atau ubah desainnya secara manual.',
      iconKey,
      colorTheme,
      isPermanent,
      showPermanentLabel,
      dismissible,
      lockScreen: displayMode === 'popup' ? lockScreen : false,
      visualStyle,
      bgPattern,
      animationStyle,
      badgeText: badgeText.trim() || undefined,
      estimatedDurationText: estimatedDurationText.trim() || undefined,
      referenceCode: referenceCode.trim() || undefined,
      ctaLabel: ctaLabel.trim() || undefined,
      showOfficialStamp,
    }),
    [
      title,
      message,
      iconKey,
      colorTheme,
      isPermanent,
      showPermanentLabel,
      dismissible,
      displayMode,
      lockScreen,
      visualStyle,
      bgPattern,
      animationStyle,
      badgeText,
      estimatedDurationText,
      referenceCode,
      ctaLabel,
      showOfficialStamp,
    ]
  );

  const activeCount = adminWarnings.filter((w) => w.isActive).length;
  const visibleIcons = showAllIcons
    ? ADMIN_WARNING_ICON_OPTIONS
    : ADMIN_WARNING_ICON_OPTIONS.slice(0, 14);

  return (
    <div className="space-y-6">
      {/* Header Studio Peringatan */}
      <div className="rounded-2xl border border-amber-500/35 bg-gradient-to-br from-slate-900 via-[#101627] to-slate-950 p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-black uppercase tracking-wider whitespace-nowrap">
                <BellRing className="w-3.5 h-3.5" />
                Studio Peringatan Pro • 80 Template
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-300 text-[11px] font-bold whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5" />
                Panel Admin Bebas Blokir Pop-up
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Studio Peringatan &amp; Pemberitahuan Nasabah
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Pilih dari <strong className="text-amber-300">80 template berdesain khas</strong> (25
              preset sistem yang ditingkatkan + 55 desain baru), atur apakah Pop-up Tengah{' '}
              <strong className="text-white">Kunci Total Layar</strong> atau{' '}
              <strong className="text-emerald-300">Tetap Bisa Klik Belakang</strong>, dan kirim
              sinkron real-time ke Laptop &amp; HP nasabah tanpa menghalangi layar Panel Admin.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Template
              </span>
              <span className="block text-xl font-black text-amber-300 tabular-nums">80</span>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Aktif
              </span>
              <span className="block text-xl font-black text-emerald-300 tabular-nums">
                {activeCount}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3.5 py-2.5 text-center">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Tersimpan
              </span>
              <span className="block text-xl font-black text-sky-300 tabular-nums">
                {adminWarnings.length}
              </span>
            </div>
          </div>
        </div>

        {feedback && (
          <div className="mt-4 rounded-xl border border-amber-400/40 bg-amber-950/45 px-4 py-2.5 text-xs font-semibold text-amber-100 flex items-center justify-between gap-3">
            <span>{feedback}</span>
            <button
              type="button"
              onClick={() => setFeedback('')}
              className="p-1 rounded-lg hover:bg-white/10 text-amber-200 cursor-pointer shrink-0"
              aria-label="Tutup pesan status"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* BAGIAN 1: GALERI 80 TEMPLATE BERDESAIN KHAS */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Galeri 80 Template Siap Pakai (Desain Unik Tiap Template)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik kartu template untuk langsung memuat desain, pola latar, animasi, dan teks ke
              editor di bawah. Tekan ikon bintang untuk menyimpan ke Favorit.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Cari template (#01–#80, promo, VIP, bug...)"
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
            {templateSearch && (
              <button
                type="button"
                onClick={() => setTemplateSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Kategori + Favorit */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {ADMIN_WARNING_CATEGORIES.map((cat) => {
            const isSelected = presetCategoryFilter === cat.key;
            const count = categoryCounts[cat.key] ?? 0;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setPresetCategoryFilter(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                    : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-600 hover:text-white'
                }`}
              >
                {cat.key === 'favorites' && (
                  <Star
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'fill-slate-950 text-slate-950' : 'text-amber-400'
                    }`}
                  />
                )}
                <span>{cat.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black tabular-nums ${
                    isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Grid Kartu Visual Preview 80 Template */}
        {filteredPresets.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-8 text-center space-y-2">
            <p className="text-sm font-bold text-slate-300">
              Tidak ada template yang cocok dengan filter ini.
            </p>
            <button
              type="button"
              onClick={() => {
                setPresetCategoryFilter('all');
                setTemplateSearch('');
              }}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-black cursor-pointer"
            >
              Tampilkan Semua 80 Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {filteredPresets.map((preset) => {
              const tMeta = getAdminWarningThemeMeta(preset.colorTheme);
              const patternStyle = getAdminWarningPatternStyle(preset.bgPattern, tMeta.patternTint);
              const isSelected = selectedTemplateId === preset.id;
              const isFav = favoriteIds.includes(preset.id);

              return (
                <div
                  key={preset.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => applyPreset(preset)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      applyPreset(preset);
                    }
                  }}
                  className={`group relative rounded-xl overflow-hidden border text-left transition-all cursor-pointer flex flex-col ${
                    tMeta.cardSurfaceClass
                  } ${
                    isSelected
                      ? 'border-amber-300 ring-2 ring-amber-400/50 shadow-lg'
                      : `${tMeta.popupBorderClass} opacity-95 hover:opacity-100 hover:-translate-y-0.5`
                  }`}
                >
                  {/* Pola Latar Mini Preview */}
                  {preset.bgPattern !== 'none' && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 pointer-events-none opacity-75"
                      style={patternStyle}
                    />
                  )}
                  <div className={`relative z-10 h-1 w-full ${tMeta.accentLineClass}`} />

                  {/* Header Mini Preview */}
                  <div
                    className={`relative z-10 px-3 py-2.5 border-b border-white/10 ${tMeta.headerGradientClass} flex items-start justify-between gap-2`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`p-1.5 rounded-lg border shrink-0 ${tMeta.iconBgClass}`}>
                        {renderAdminWarningIcon(preset.iconKey, 'w-3.5 h-3.5')}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono font-black text-white/90 tabular-nums">
                            #{String(preset.code).padStart(2, '0')}
                          </span>
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-black/35 border border-white/15 text-slate-200 truncate">
                            {preset.designTag}
                          </span>
                        </div>
                        <p className="text-xs font-black text-white truncate mt-0.5">
                          {preset.name}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFavoriteTemplate(preset.id, e)}
                      title={isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
                      className="p-1 rounded-lg bg-black/35 hover:bg-black/60 border border-white/15 shrink-0 cursor-pointer"
                      aria-label={isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          isFav ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Isi Mini Preview */}
                  <div className="relative z-10 p-3 flex-1 flex flex-col justify-between gap-2">
                    <div className="space-y-1">
                      <p className="text-[11px] font-bold text-white/95 line-clamp-1">
                        {preset.title}
                      </p>
                      <p className="text-[10px] text-slate-300/90 line-clamp-2 leading-relaxed">
                        {preset.message}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/40 border border-white/15 text-slate-200 whitespace-nowrap">
                          {preset.suggestedDisplayMode === 'popup' ? 'Pop-up' : 'Banner'}
                        </span>
                        {preset.suggestedDisplayMode === 'popup' && (
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap ${
                              preset.suggestedLockScreen
                                ? 'bg-rose-950/60 border-rose-400/35 text-rose-200'
                                : 'bg-emerald-950/60 border-emerald-400/35 text-emerald-200'
                            }`}
                          >
                            {preset.suggestedLockScreen ? 'Kunci Layar' : 'Klik Belakang'}
                          </span>
                        )}
                      </div>

                      {isSelected && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-300 whitespace-nowrap">
                          <Check className="w-3 h-3" />
                          Dipakai
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BAGIAN 2: EDITOR KUSTOMISASI DESAIN + LIVE PREVIEW INTERAKTIF */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Form Kustomisasi (7 Kolom) */}
        <form
          onSubmit={handleSaveAndSend}
          className="xl:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/95 p-5 space-y-5 shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                {editingId ? 'Edit Peringatan Tersimpan' : 'Editor Desain & Pengiriman Peringatan'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Semua perubahan gaya desain &amp; aturan kunci layar langsung sinkron real-time ke HP
                nasabah.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          {/* 1. Mode Tampilan & Mode Interaksi Kunci Layar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                1. Mode Tampilan Layar
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayMode('popup')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                    displayMode === 'popup'
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  Pop-up Tengah
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('banner')}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                    displayMode === 'banner'
                      ? 'bg-sky-400 text-slate-950 border-sky-300 shadow-md'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <PanelTop className="w-3.5 h-3.5" />
                  Banner Atas
                </button>
              </div>
            </div>

            {/* Pengaturan Kunci Layar khusus Pop-up Tengah */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-200">
                2. Interaksi Pop-up Tengah (Layar Nasabah)
              </label>
              {displayMode === 'popup' ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setLockScreen(false)}
                    className={`px-2.5 py-2.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                      !lockScreen
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Unlock className="w-3.5 h-3.5 shrink-0" />
                    Klik Belakang
                  </button>
                  <button
                    type="button"
                    onClick={() => setLockScreen(true)}
                    className={`px-2.5 py-2.5 rounded-xl border text-[11px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all whitespace-nowrap ${
                      lockScreen
                        ? 'bg-rose-500 text-white border-rose-400 shadow-md'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                    Kunci Total
                  </button>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 text-[11px] text-slate-400">
                  Banner Atas menempel rapi di puncak layar &amp; selalu bisa klik belakang.
                </div>
              )}
            </div>
          </div>

          {displayMode === 'popup' && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-[11px] leading-relaxed ${
                lockScreen
                  ? 'bg-rose-950/35 border-rose-500/35 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-500/35 text-emerald-200'
              }`}
            >
              {lockScreen ? (
                <span>
                  <strong>Mode Kunci Total Layar Aktif:</strong> Nasabah biasa tidak bisa klik
                  belakang, menggulir halaman, maupun menekan ESC.{' '}
                  <strong className="text-white">Layar Panel Admin tetap aman tidak terhalang.</strong>
                </span>
              ) : (
                <span>
                  <strong>Mode Tetap Bisa Klik Belakang Aktif:</strong> Pop-up tampil melayang di
                  tengah layar, namun nasabah tetap bebas mengklik menu &amp; menggulir halaman di
                  belakangnya.
                </span>
              )}
            </div>
          )}

          {/* 3. Judul & Pesan */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Judul Peringatan / Pemberitahuan
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Aplikasi Sedang Dalam Perbaikan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Isi Pesan Lengkap
              </label>
              <textarea
                required
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis pesan informasi, jadwal maintenance, promo, atau peringatan..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 leading-relaxed"
              />
            </div>
          </div>

          {/* 4. Elemen Detail Tambahan (Badge, Estimasi Waktu, Kode Ref, Tombol CTA) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Label Badge Status
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="Misal: MAINTENANCE SISTEM / VIP SULTAN"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Teks Tombol Aksi (CTA)
              </label>
              <input
                type="text"
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="Misal: Mengerti & Tutup / Klaim Sekarang"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Estimasi Waktu / Jadwal (Opsional)
              </label>
              <input
                type="text"
                value={estimatedDurationText}
                onChange={(e) => setEstimatedDurationText(e.target.value)}
                placeholder="Misal: ± 15 Menit atau 23:00–01:00 WIB"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                Nomor Referensi Resmi (Opsional)
              </label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder="Misal: BN-MNT-001"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* 5. Kustomisasi Visual Manual (Gaya Desain, Pola Latar, Animasi, Tema Warna, Ikon) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                Kustomisasi Visual Manual
              </span>
              <button
                type="button"
                onClick={() => setPreviewReplayKey((k) => k + 1)}
                className="text-[11px] font-bold text-sky-300 hover:text-sky-200 flex items-center gap-1 cursor-pointer"
              >
                <Play className="w-3 h-3" />
                Putar Ulang Animasi
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Gaya Desain Kartu (12)
                </label>
                <select
                  value={visualStyle}
                  onChange={(e) => setVisualStyle(e.target.value as AdminWarningVisualStyle)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {ADMIN_WARNING_VISUAL_STYLES.map((st) => (
                    <option key={st.key} value={st.key}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Pola Latar Kartu (10)
                </label>
                <select
                  value={bgPattern}
                  onChange={(e) => setBgPattern(e.target.value as AdminWarningBgPattern)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {ADMIN_WARNING_BG_PATTERNS.map((pat) => (
                    <option key={pat.key} value={pat.key}>
                      {pat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Animasi Kartu (6)
                </label>
                <select
                  value={animationStyle}
                  onChange={(e) => {
                    setAnimationStyle(e.target.value as AdminWarningAnimationStyle);
                    setPreviewReplayKey((k) => k + 1);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {ADMIN_WARNING_ANIMATION_STYLES.map((an) => (
                    <option key={an.key} value={an.key}>
                      {an.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Palet Warna (12) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                Palet Tema Warna (12)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                {ADMIN_WARNING_THEME_OPTIONS.map((t) => {
                  const active = colorTheme === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => setColorTheme(t.key)}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-2 cursor-pointer transition-all truncate ${
                        active
                          ? 'bg-slate-800 border-amber-400 text-white'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full shrink-0 ${t.swatchClass}`} />
                      <span className="truncate">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ikon Vektor (28) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-300">
                  Ikon Bercahaya (28)
                </label>
                <button
                  type="button"
                  onClick={() => setShowAllIcons((v) => !v)}
                  className="text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
                >
                  {showAllIcons ? 'Ringkas Ikon' : 'Lihat Semua 28 Ikon'}
                </button>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                {visibleIcons.map((ic) => {
                  const active = iconKey === ic.key;
                  return (
                    <button
                      key={ic.key}
                      type="button"
                      onClick={() => setIconKey(ic.key)}
                      title={ic.label}
                      className={`px-2 py-2 rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
                        active
                          ? 'bg-amber-400/20 border-amber-400 text-amber-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {renderAdminWarningIcon(ic.key, 'w-4 h-4')}
                      <span className="text-[9px] font-bold truncate w-full text-center">
                        {ic.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 6. Opsi Perilaku & Stempel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={dismissible}
                onChange={(e) => setDismissible(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span className="text-xs font-semibold text-slate-200">
                Nasabah boleh menutup peringatan
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showOfficialStamp}
                onChange={(e) => setShowOfficialStamp(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span className="text-xs font-semibold text-slate-200">
                Tampilkan Stempel Resmi Bank
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isPermanent}
                onChange={(e) => setIsPermanent(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span className="text-xs font-semibold text-slate-200">
                Status Permanen (muncul terus)
              </span>
            </label>

            <label className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showPermanentLabel}
                onChange={(e) => setShowPermanentLabel(e.target.checked)}
                disabled={!isPermanent}
                className="rounded accent-amber-400 disabled:opacity-40"
              />
              <span className="text-xs font-semibold text-slate-200">
                Tampilkan badge &quot;Permanen&quot;
              </span>
            </label>
          </div>

          {/* 7. Target Penerima */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <label className="block text-xs font-black text-slate-200 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-400" />
              Target Penerima Peringatan
            </label>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: 'all', label: 'Semua Nasabah' },
                  { key: 'tiers', label: 'Per Tier Kartu' },
                  { key: 'accounts', label: 'Pilih Akun' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTargetMode(opt.key)}
                  className={`px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
                    targetMode === opt.key
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {targetMode === 'tiers' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {CARD_TIERS_LIST.map((item) => {
                  const active = targetTiers.includes(item.tier);
                  return (
                    <button
                      key={item.tier}
                      type="button"
                      onClick={() => handleToggleTier(item.tier)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                        active
                          ? 'bg-amber-400 text-slate-950 border-amber-300'
                          : 'bg-slate-900 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {targetMode === 'accounts' && (
              <div className="space-y-2 pt-1">
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Cari nama, nomor rekening, atau ID 16 digit..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500"
                />
                <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                  {filteredAccounts.map((acc) => {
                    const checked = targetAccountIds.includes(acc.id);
                    return (
                      <label
                        key={acc.id}
                        className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer ${
                          checked
                            ? 'bg-sky-950/60 border-sky-400/50 text-white'
                            : 'bg-slate-900/70 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleToggleAccount(acc.id)}
                            className="accent-sky-400"
                          />
                          <span className="font-bold truncate">{acc.fullName}</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 shrink-0 tabular-nums">
                          {acc.accountNumber}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Send className="w-4 h-4" />
            <span>
              {editingId
                ? 'Simpan Perubahan & Sinkron Real-Time'
                : 'Kirim Peringatan Sekarang (Sinkron Laptop & HP)'}
            </span>
          </button>
        </form>

        {/* Panel Live Preview Interaktif + Coba Tampilan Penuh (5 Kolom) */}
        <div className="xl:col-span-5 space-y-4 xl:sticky xl:top-20">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  Live Preview Interaktif
                </h3>
                <p className="text-[11px] text-slate-400">
                  Identik 100% dengan tampilan di layar nasabah (Laptop &amp; HP).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFullscreenPreviewOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md whitespace-nowrap shrink-0"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                Coba Tampilan Penuh
              </button>
            </div>

            {/* Area Preview */}
            <div className="rounded-2xl border border-slate-800 bg-[#050811] p-4 min-h-[260px] flex items-center justify-center">
              <div key={previewReplayKey} className="w-full">
                {displayMode === 'banner' ? (
                  <AdminWarningBannerBar
                    warning={previewModel}
                    canClose={dismissible}
                    onClose={() => setPreviewReplayKey((k) => k + 1)}
                    isPreviewMode
                  />
                ) : (
                  <AdminWarningPopupCard
                    warning={previewModel}
                    canClose={dismissible}
                    isLocked={lockScreen}
                    onClose={() => setPreviewReplayKey((k) => k + 1)}
                    isPreviewMode
                  />
                )}
              </div>
            </div>

            {/* Ringkasan Konfigurasi Desain */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2">
                <span className="text-slate-400 block text-[10px]">Gaya Desain</span>
                <span className="font-bold text-white truncate block">
                  {ADMIN_WARNING_VISUAL_STYLES.find((s) => s.key === visualStyle)?.label ||
                    visualStyle}
                </span>
              </div>
              <div className="rounded-xl bg-slate-950/80 border border-slate-800 px-3 py-2">
                <span className="text-slate-400 block text-[10px]">Pola &amp; Animasi</span>
                <span className="font-bold text-white truncate block">
                  {ADMIN_WARNING_BG_PATTERNS.find((p) => p.key === bgPattern)?.label} •{' '}
                  {ADMIN_WARNING_ANIMATION_STYLES.find((a) => a.key === animationStyle)?.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BAGIAN 3: DAFTAR PERINGATAN TERSIMPAN & AKTIF (SINKRON REAL-TIME LAPTOP <-> HP) */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/95 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-black text-white">
              Daftar Peringatan &amp; Pemberitahuan Tersimpan ({adminWarnings.length})
            </h3>
            <p className="text-xs text-slate-400">
              Ubah mode, kunci layar, kirim ulang, atau hapus permanen — langsung sinkron antara
              Laptop Admin, Cloud, dan HP Nasabah.
            </p>
          </div>
        </div>

        {adminWarnings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
            Belum ada peringatan tersimpan. Pilih salah satu dari 80 template di atas lalu klik
            &quot;Kirim Peringatan Sekarang&quot;.
          </div>
        ) : (
          <div className="space-y-3">
            {adminWarnings.map((w) => {
              const tMeta = getAdminWarningThemeMeta(w.colorTheme);
              const isLocked = resolveWarningLockScreen(w);
              const styleLabel =
                ADMIN_WARNING_VISUAL_STYLES.find((s) => s.key === w.visualStyle)?.label ||
                'Executive Glass';

              return (
                <div
                  key={w.id}
                  className={`rounded-xl border p-4 transition-all ${
                    w.isActive
                      ? 'bg-slate-950/90 border-slate-700'
                      : 'bg-slate-950/45 border-slate-800/80 opacity-75'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className={`p-2 rounded-xl border shrink-0 ${tMeta.iconBgClass}`}>
                        {renderAdminWarningIcon(w.iconKey, 'w-4 h-4')}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase whitespace-nowrap ${
                              w.isActive
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {w.isActive ? 'Aktif' : 'Nonaktif'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-200 border border-slate-700 whitespace-nowrap">
                            {w.displayMode === 'popup' ? 'Pop-up Tengah' : 'Banner Atas'}
                          </span>
                          {w.displayMode === 'popup' && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                isLocked
                                  ? 'bg-rose-950/60 text-rose-200 border-rose-500/40'
                                  : 'bg-emerald-950/50 text-emerald-200 border-emerald-500/35'
                              }`}
                            >
                              {isLocked ? 'Kunci Layar' : 'Klik Belakang'}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 text-amber-200 border border-slate-700 whitespace-nowrap">
                            {styleLabel}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white">{w.title}</h4>
                        <p className="text-xs text-slate-300 line-clamp-2">{w.message}</p>
                        <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-2 pt-0.5">
                          <span>
                            Target:{' '}
                            <strong className="text-slate-200">
                              {w.targetMode === 'all'
                                ? 'Semua Nasabah'
                                : w.targetMode === 'tiers'
                                ? `${(w.targetTiers || []).length} Tier Kartu`
                                : `${(w.targetAccountIds || []).length} Akun`}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="tabular-nums">Versi Kirim #{w.resendVersion || 1}</span>
                          {w.referenceCode && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-slate-300">#{w.referenceCode}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tombol Aksi Cepat */}
                    <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => adminToggleWarningActive(w.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer border whitespace-nowrap ${
                          w.isActive
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35 hover:bg-emerald-500/25'
                            : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        {w.isActive ? 'Matikan' : 'Aktifkan'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickSwitchDisplayMode(w)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Tukar Pop-up Tengah <-> Banner Atas"
                      >
                        {w.displayMode === 'popup' ? (
                          <>
                            <PanelTop className="w-3.5 h-3.5" />
                            Jadi Banner
                          </>
                        ) : (
                          <>
                            <Maximize2 className="w-3.5 h-3.5" />
                            Jadi Pop-up
                          </>
                        )}
                      </button>

                      {w.displayMode === 'popup' && (
                        <button
                          type="button"
                          onClick={() => handleQuickToggleLockScreen(w)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="Tukar Kunci Total Layar <-> Tetap Bisa Klik Belakang"
                        >
                          {isLocked ? (
                            <>
                              <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                              Buka Klik
                            </>
                          ) : (
                            <>
                              <Lock className="w-3.5 h-3.5 text-rose-300" />
                              Kunci Layar
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          const r = adminResendWarning(w.id);
                          setFeedback(r.message);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Munculkan ulang ke semua nasabah yang sudah menutup"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Kirim Ulang
                      </button>

                      <button
                        type="button"
                        onClick={() => loadForEdit(w)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 text-amber-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const r = adminDeleteWarning(w.id);
                          setFeedback(r.message);
                          if (editingId === w.id) resetForm();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL PRATINJAU TAMPILAN PENUH DI LAYAR (COBA SEBELUM KIRIM) */}
      {isFullscreenPreviewOpen && (
        <div
          className={`fixed inset-0 z-[200] ${
            displayMode === 'popup' && lockScreen
              ? 'bg-slate-950/85 backdrop-blur-sm'
              : 'bg-slate-950/35'
          } flex flex-col`}
        >
          {/* Bar kontrol pratinjau aman di pojok atas */}
          <div className="w-full px-4 py-3 bg-slate-950/95 border-b border-amber-400/40 flex flex-wrap items-center justify-between gap-2 shadow-xl">
            <div className="flex items-center gap-2 text-xs text-amber-200 font-bold">
              <Eye className="w-4 h-4 text-amber-400" />
              <span>
                Mode Uji Tampilan Penuh •{' '}
                {displayMode === 'banner'
                  ? 'Banner Atas'
                  : lockScreen
                  ? 'Pop-up Tengah (Kunci Total Layar)'
                  : 'Pop-up Tengah (Tetap Bisa Klik Belakang)'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsFullscreenPreviewOpen(false)}
              className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <X className="w-4 h-4" />
              Keluar Pratinjau Penuh
            </button>
          </div>

          {displayMode === 'banner' ? (
            <div className="w-full p-4">
              <AdminWarningBannerBar
                warning={previewModel}
                canClose
                onClose={() => setIsFullscreenPreviewOpen(false)}
                isPreviewMode
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
              <div className="w-full max-w-lg my-auto">
                <AdminWarningPopupCard
                  warning={previewModel}
                  canClose
                  isLocked={lockScreen}
                  onClose={() => setIsFullscreenPreviewOpen(false)}
                  isPreviewMode
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
