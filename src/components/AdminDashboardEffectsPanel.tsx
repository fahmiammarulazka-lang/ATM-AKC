/**
 * AdminDashboardEffectsPanel.tsx
 * Studio Efek Dashboard 1.000.000x HYPER GODLIKE (100% Terpusat di Panel Admin — 311 Efek • 16 Kategori • 24 Fitur Canggih)
 * Dilengkapi:
 * - Tombol Darurat Global: 🛑 FORCE CLEAR STAGE (Hapus Paksa Semua Panggung, Partikel, Konfeti, Suara & Aura Live)
 * - 12 Preset Template Cepat 1-Klik
 * - Live Mini Preview Simulator Layar Dashboard Nasabah di dalam Panel Admin
 * - Multi-Combo Layering (1 Efek Utama + 2 Efek Pendukung), Slider Partikel/Kecepatan/Ukuran/Gravitasi
 * - 16 Gaya Audio Synth + Volume + TTS Suara Bahasa Indonesia
 * - Marquee Ticker, Bingkai Layar Neon 3D, Jejak Kursor, Lencana Trofi Hologram, Tema Kartu Saldo, Sirine VIP
 * - Mode Gacha Efek Acak, Playlist Auto-Rotate, Jadwal Jam Otomatis, Filter Tier/Level/Role Dev, VIP Lock, Log Tembakan, Ekspor/Impor JSON
 */
import React, { useMemo, useState } from 'react';
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
  OctagonX,
  Download,
  Upload,
  Shuffle,
  CalendarClock,
  Shield,
  History,
  Wand2,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AdminDashboardEffectPackage,
  CardTier,
  DashboardBalanceCardThemeOverride,
  DashboardCursorTrailStyle,
  DashboardEffectBannerStyle,
  DashboardEffectDurationType,
  DashboardEffectSoundMode,
  DashboardParticleGravityStyle,
  DashboardScreenBorderFrameStyle,
} from '../types/bank';
import {
  AUDIO_SYNTH_STYLE_OPTIONS,
  CELEBRATION_CATEGORIES,
  CELEBRATION_EFFECTS_CATALOG,
  CELEBRATION_INTENSITY_OPTIONS,
  CelebrationAudioSynthStyle,
  CelebrationCategoryKey,
  CelebrationIntensityLevel,
  getCelebrationEffectProfile,
  stopAllCelebrationEffectsAndAudio,
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
  { seconds: 8, label: '8 Detik (Rapi)' },
  { seconds: 12, label: '12 Detik (Standar)' },
  { seconds: 20, label: '20 Detik (Festival)' },
];

interface QuickPresetTemplate {
  id: string;
  emoji: string;
  label: string;
  effectId: string;
  comboIds: string[];
  intensity: CelebrationIntensityLevel;
  title: string;
  welcomeMessage: string;
  gravity: DashboardParticleGravityStyle;
  borderFrame: DashboardScreenBorderFrameStyle;
  cursorTrail: DashboardCursorTrailStyle;
  cardTheme: DashboardBalanceCardThemeOverride;
  spotlights: boolean;
  lightning: boolean;
  siren: boolean;
  marqueeText: string;
}

const QUICK_PRESET_TEMPLATES_12: QuickPresetTemplate[] = [
  {
    id: 'preset_sultan_godlike',
    emoji: '👑',
    label: 'Sultan Godlike 1 Juta X',
    effectId: 'sultan_mahkota_emas',
    comboIds: ['sultan_hujan_berlian', 'kerajaan_majapahit_emas'],
    intensity: '1000000x',
    title: '👑 SELEBRASI SULTAN TRILIUNER 1.000.000X OVERDRIVE',
    welcomeMessage: 'Panggung kemewahan tertinggi Bank Nusantara aktif penuh dengan mahkota emas & hujan berlian 3D!',
    gravity: 'fall_down',
    borderFrame: 'gold_royal',
    cursorTrail: 'gold_coins',
    cardTheme: 'gold_sultan',
    spotlights: true,
    lightning: true,
    siren: false,
    marqueeText: '👑 SELAMAT KEPADA NASABAH VIP SULTAN NUSANTARA • MODE 1.000.000X AKTIF!',
  },
  {
    id: 'preset_majapahit_royal',
    emoji: '🏛️',
    label: 'Keraton Majapahit Emas',
    effectId: 'kerajaan_majapahit_emas',
    comboIds: ['nusantara_gamelan_emas', 'mitologi_garuda_wisnu'],
    intensity: '100000x',
    title: '🏛️ TITAH AGUNG KERATON MAJAPAHIT NUSANTARA',
    welcomeMessage: 'Harmoni Gamelan Kencana & Mahkota Emas Kerajaan Nusantara menyertai langkah rekening Anda.',
    gravity: 'float_up',
    borderFrame: 'gold_royal',
    cursorTrail: 'sparkle_dust',
    cardTheme: 'gold_sultan',
    spotlights: true,
    lightning: false,
    siren: false,
    marqueeText: '🏛️ JAMUAN KERAJAAN NUSANTARA • KEMULIAAN WARISAN MAJAPAHIT',
  },
  {
    id: 'preset_cyber_matrix',
    emoji: '🤖',
    label: 'Cyber Matrix 2099',
    effectId: 'cyberpunk_neon_overload',
    comboIds: ['quantum_ai_singularity', 'esports_cyber_arena'],
    intensity: '1000000x',
    title: '⚡ NEURAL MATRIX QUANTUM OVERDRIVE 2099',
    welcomeMessage: 'Sistem perbankan futuristik AI Quantum aktif dengan hujan kode Matrix digital & kilatan laser neon.',
    gravity: 'matrix_digital_rain',
    borderFrame: 'cyber_neon',
    cursorTrail: 'neon_laser',
    cardTheme: 'cyber_cyan',
    spotlights: true,
    lightning: true,
    siren: false,
    marqueeText: '⚛️ PROTOKOL QUANTUM AI & CYBERPUNK MATRIX ONLINE • KEAMANAN LEVEL TERTINGGI',
  },
  {
    id: 'preset_dragon_mythic',
    emoji: '🐉',
    label: 'Naga Langit Halilintar',
    effectId: 'mitologi_naga_langit',
    comboIds: ['cuaca_petir_halilintar', 'anime_aura_awakening'],
    intensity: '1000000x',
    title: '🐉 KEBANGKITAN NAGA LANGIT HALILINTAR',
    welcomeMessage: 'Aura Naga Emas melintas megah bersama sambaran petir kosmik di Dashboard Anda!',
    gravity: 'vortex_spiral',
    borderFrame: 'fire_inferno',
    cursorTrail: 'fire_aura',
    cardTheme: 'crimson_fire',
    spotlights: true,
    lightning: true,
    siren: false,
    marqueeText: '🐉 KEKUATAN NAGA LANGIT & HALILINTAR AKTIF • BONUS KEJAYAAN NASABAH',
  },
  {
    id: 'preset_merdeka_ri',
    emoji: '🇮🇩',
    label: 'Merdeka RI 17 Agustus',
    effectId: 'ri_kemerdekaan_merah_putih',
    comboIds: ['ri_paskibraka_garuda', 'ri_kembang_api_monas'],
    intensity: '100000x',
    title: '🇮🇩 DIRGAHAYU REPUBLIK INDONESIA • MERDEKA!',
    welcomeMessage: 'Semangat Merah Putih berkibar gagah bersama kembang api Monas & hormat Paskibraka Nusantara!',
    gravity: 'diagonal_storm',
    borderFrame: 'fire_inferno',
    cursorTrail: 'rainbow_stars',
    cardTheme: 'crimson_fire',
    spotlights: true,
    lightning: false,
    siren: false,
    marqueeText: '🇮🇩 DIRGAHAYU KEMERDEKAAN RI • BANK NUSANTARA KEBANGGAAN BANGSA',
  },
  {
    id: 'preset_esports_champion',
    emoji: '🎮',
    label: 'Esports Juara Dunia',
    effectId: 'esports_trophy_mvp',
    comboIds: ['arcade_retro_90s', 'olahraga_piala_dunia'],
    intensity: '100000x',
    title: '🎮 GRAND FINALS MVP CHAMPIONS ARENA',
    welcomeMessage: 'Sorot lampu stadion dan trofi juara MVP menyala khusus untuk pemenang sejati!',
    gravity: 'vortex_spiral',
    borderFrame: 'rainbow_prism',
    cursorTrail: 'rainbow_stars',
    cardTheme: 'galaxy_purple',
    spotlights: true,
    lightning: true,
    siren: false,
    marqueeText: '🏆 MVP CHAMPIONSHIP ARENA • SALAM JUARA NASABAH BANK NUSANTARA',
  },
  {
    id: 'preset_edm_festival',
    emoji: '🎧',
    label: 'Konser EDM Stadion',
    effectId: 'musik_edm_laser_festival',
    comboIds: ['musik_rock_stadium', 'momen_kembang_api_2026'],
    intensity: '100000x',
    title: '🎧 KONSER MEGA STADIUM EDM FESTIVAL',
    welcomeMessage: 'Rasakan dentuman bass festival dan gemerlap laser konser langsung di layar utama Anda.',
    gravity: 'diagonal_storm',
    borderFrame: 'rainbow_prism',
    cursorTrail: 'neon_laser',
    cardTheme: 'galaxy_purple',
    spotlights: true,
    lightning: false,
    siren: false,
    marqueeText: '🎧 LIVE STADIUM DJ DROP FESTIVAL • NIKMATI PERAYAAN MUSIK NUSANTARA',
  },
  {
    id: 'preset_racing_f1',
    emoji: '🏎️',
    label: 'Sirkuit Turbo F1 GP',
    effectId: 'otomotif_f1_grand_prix',
    comboIds: ['otomotif_nitro_drift', 'otomotif_podium_champagne'],
    intensity: '100000x',
    title: '🏎️ PODIUM JUARA GRAND PRIX TURBO',
    welcomeMessage: 'Bendera finish berkibar dan percikan podium champagne merayakan kecepatan transaksi Anda!',
    gravity: 'diagonal_storm',
    borderFrame: 'fire_inferno',
    cursorTrail: 'fire_aura',
    cardTheme: 'crimson_fire',
    spotlights: true,
    lightning: false,
    siren: false,
    marqueeText: '🏁 GRAND PRIX FINISHER • KECEPATAN KILAT TRANSAKSI BANK NUSANTARA',
  },
  {
    id: 'preset_kuliner_pesta',
    emoji: '🍜',
    label: 'Pesta Kuliner Nusantara',
    effectId: 'kuliner_rendang_banquet',
    comboIds: ['kuliner_sate_nusantara', 'kuliner_kopi_keraton'],
    intensity: '10000x',
    title: '🍜 JAMUAN RAYA KULINER KHAS NUSANTARA',
    welcomeMessage: 'Merayakan kekayaan cita rasa Nusantara bersama layanan hangat Bank Nusantara.',
    gravity: 'float_up',
    borderFrame: 'emerald_laser',
    cursorTrail: 'sparkle_dust',
    cardTheme: 'emerald_royal',
    spotlights: false,
    lightning: false,
    siren: false,
    marqueeText: '🍜 FESTIVAL KULINER NUSANTARA • HANGATNYA KEBERSAMAAN BANK NUSANTARA',
  },
  {
    id: 'preset_sakura_spring',
    emoji: '🌸',
    label: 'Sakura Musim Semi',
    effectId: 'musim_sakura_tokyo',
    comboIds: ['anime_sakura_blade', 'musim_aurora_borealis'],
    intensity: '100000x',
    title: '🌸 FESTIVAL HANAMI SAKURA NUSANTARA',
    welcomeMessage: 'Kelopak bunga sakura bermekaran lembut menghadirkan kedamaian dan keberuntungan baru.',
    gravity: 'fall_down',
    borderFrame: 'rainbow_prism',
    cursorTrail: 'rainbow_stars',
    cardTheme: 'galaxy_purple',
    spotlights: false,
    lightning: false,
    siren: false,
    marqueeText: '🌸 HANAMI SAKURA SEASON • SEMOGA REZEKI TERUS BERMEKARAN INDAH',
  },
  {
    id: 'preset_vip_siren',
    emoji: '🚨',
    label: 'Sirine Darurat VIP',
    effectId: 'sultan_karpet_merah_vip',
    comboIds: ['sultan_petir_harta'],
    intensity: '100000x',
    title: '🚨 PENGUMUMAN PRIORITAS VIP DIREKSI BANK NUSANTARA',
    welcomeMessage: 'Perhatian khusus untuk Nasabah Terpilih: Event hadiah & keuntungan VIP sedang berlangsung!',
    gravity: 'fall_down',
    borderFrame: 'fire_inferno',
    cursorTrail: 'gold_coins',
    cardTheme: 'crimson_fire',
    spotlights: true,
    lightning: true,
    siren: true,
    marqueeText: '🚨 PERHATIAN PENTING VIP • SILAKAN CEK SURAT & HADIAH RESMI DARI ADMIN!',
  },
  {
    id: 'preset_galaxy_aurora',
    emoji: '🌌',
    label: 'Aurora Galaksi Kosmik',
    effectId: 'alam_aurora_kutub',
    comboIds: ['alam_supernova_galaksi', 'quantum_portal_dimensi'],
    intensity: '1000000x',
    title: '🌌 PORTAL GALAKSI & AURORA KUTUB 1.000.000X',
    welcomeMessage: 'Gelombang Aurora kosmik dan portal bintang mengelilingi rekening Bank Nusantara Anda.',
    gravity: 'vortex_spiral',
    borderFrame: 'emerald_laser',
    cursorTrail: 'sparkle_dust',
    cardTheme: 'emerald_royal',
    spotlights: true,
    lightning: false,
    siren: false,
    marqueeText: '🌌 AURORA KOSMIK & SUPERNOVA AKTIF • KEBERUNTUNGAN TAK TERBATAS',
  },
];

export const AdminDashboardEffectsPanel: React.FC = () => {
  const {
    accounts,
    devRoles,
    dashboardEffectEvents,
    stageForceClearNonce,
    forceClearAllCelebrationStages,
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
  const [title, setTitle] = useState<string>('👑 Panggung Perayaan Dashboard Sultan 1.000.000x');
  const [senderName, setSenderName] = useState<string>('Dewan Direksi Bank Nusantara');
  const [welcomeMessage, setWelcomeMessage] = useState<string>(
    'Selamat datang di Dashboard Utama Bank Nusantara! Nikmati Panggung Selebrasi 1.000.000x Hyper Godlike Overdrive lengkap dengan Multi-Combo Efek, Portal 3D, Laser Stadion, dan Aura Eksklusif di rekening Anda.'
  );
  const [celebrationEffect, setCelebrationEffect] = useState<string>('sultan_mahkota_emas');
  const [secondaryComboEffectIds, setSecondaryComboEffectIds] = useState<string[]>([]);
  const [celebrationIntensity, setCelebrationIntensity] =
    useState<CelebrationIntensityLevel>('100000x');
  const [celebCategoryFilter, setCelebCategoryFilter] = useState<CelebrationCategoryKey>('all');
  const [celebSearchQuery, setCelebSearchQuery] = useState<string>('');

  // Recipient Targeting
  const [recipientSelectionMode, setRecipientSelectionMode] = useState<'all' | 'single' | 'multi'>('all');
  const [targetAccountId, setTargetAccountId] = useState<string>('__ALL__');
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([]);
  const [recipientSearchQuery, setRecipientSearchQuery] = useState<string>('');

  // Basic Controls
  const [durationType, setDurationType] = useState<DashboardEffectDurationType>('permanent');
  const [stageDurationSeconds, setStageDurationSeconds] = useState<number>(8);
  const [bannerStyle, setBannerStyle] =
    useState<DashboardEffectBannerStyle>('full_top_banner');
  const [soundMode, setSoundMode] = useState<DashboardEffectSoundMode>('fanfare_auto');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [autoBlastOnOpen, setAutoBlastOnOpen] = useState<boolean>(true);
  const [showPersistentDashboardAura, setShowPersistentDashboardAura] = useState<boolean>(true);
  const [decorateBalanceCard, setDecorateBalanceCard] = useState<boolean>(true);
  const [showAmbientParticles, setShowAmbientParticles] = useState<boolean>(true);

  // 24 Advanced Features State
  const [customParticleCount, setCustomParticleCount] = useState<number>(96);
  const [animationSpeedMultiplier, setAnimationSpeedMultiplier] = useState<number>(1);
  const [particleSizeScale, setParticleSizeScale] = useState<number>(1);
  const [gravityDirection, setGravityDirection] =
    useState<DashboardParticleGravityStyle>('theme_default');
  const [screenBorderFrame, setScreenBorderFrame] =
    useState<DashboardScreenBorderFrameStyle>('gold_royal');
  const [showMarqueeTicker, setShowMarqueeTicker] = useState<boolean>(false);
  const [marqueeTickerText, setMarqueeTickerText] = useState<string>(
    '👑 SELAMAT DATANG DI BANK NUSANTARA DIGITAL • EVENT SELEBRASI AKTIF!'
  );
  const [cursorTrailMode, setCursorTrailMode] =
    useState<DashboardCursorTrailStyle>('sparkle_dust');
  const [showFloatingTrophyBadge, setShowFloatingTrophyBadge] = useState<boolean>(false);
  const [floatingBadgePosition, setFloatingBadgePosition] = useState<
    'top_right' | 'bottom_right' | 'bottom_left'
  >('bottom_right');
  const [balanceCardThemeOverride, setBalanceCardThemeOverride] =
    useState<DashboardBalanceCardThemeOverride>('auto_effect');
  const [showStadiumSpotlights, setShowStadiumSpotlights] = useState<boolean>(true);
  const [showLightningBolts, setShowLightningBolts] = useState<boolean>(false);
  const [audioSynthOverride, setAudioSynthOverride] = useState<
    CelebrationAudioSynthStyle | 'auto_theme'
  >('auto_theme');
  const [soundVolumePercent, setSoundVolumePercent] = useState<number>(100);
  const [ttsVoiceAnnouncementEnabled, setTtsVoiceAnnouncementEnabled] = useState<boolean>(false);
  const [ttsCustomText, setTtsCustomText] = useState<string>('');
  const [vipSirenAlertMode, setVipSirenAlertMode] = useState<boolean>(false);
  const [gachaRandomEffectOnBlast, setGachaRandomEffectOnBlast] = useState<boolean>(false);
  const [autoRotatePlaylistEnabled, setAutoRotatePlaylistEnabled] = useState<boolean>(false);
  const [playlistEffectIds, setPlaylistEffectIds] = useState<string[]>([
    'sultan_mahkota_emas',
    'cyberpunk_neon_overload',
    'mitologi_naga_langit',
  ]);
  const [playlistIntervalSeconds, setPlaylistIntervalSeconds] = useState<number>(10);
  const [scheduledTriggerTime, setScheduledTriggerTime] = useState<string>('');
  const [targetCardTiers, setTargetCardTiers] = useState<CardTier[]>([]);
  const [minJobLevelTarget, setMinJobLevelTarget] = useState<number>(1);
  const [targetDevRoleId, setTargetDevRoleId] = useState<string>('');
  const [vipPriorityLock, setVipPriorityLock] = useState<boolean>(false);
  const [presetTemplateId, setPresetTemplateId] = useState<string>('');

  // Management, Preview & JSON Export/Import States
  const [managingPkgId, setManagingPkgId] = useState<string | null>(null);
  const [manageRecipientSearch, setManageRecipientSearch] = useState<string>('');
  const [accountMonitorSearch, setAccountMonitorSearch] = useState<string>('');
  const [jsonImportText, setJsonImportText] = useState<string>('');
  const [showJsonPanel, setShowJsonPanel] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  const [previewBurstState, setPreviewBurstState] = useState<{
    effectId: string;
    intensity: CelebrationIntensityLevel;
    headline?: string;
    soundMode?: DashboardEffectSoundMode;
    nonce: number;
  } | null>(null);

  const usableCelebrations = useMemo(
    () => CELEBRATION_EFFECTS_CATALOG.filter((c) => c.id !== 'none'),
    []
  );
  const activeCelebrationProfile = getCelebrationEffectProfile(
    celebrationEffect === 'none' ? 'sultan_mahkota_emas' : celebrationEffect
  );

  const filteredCelebrations = useMemo(
    () =>
      usableCelebrations.filter((item) => {
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
      }),
    [usableCelebrations, celebCategoryFilter, celebSearchQuery]
  );

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

  const allBlastLogs = useMemo(() => {
    const combined: {
      pkgTitle: string;
      id: string;
      timestamp: string;
      effectId: string;
      intensity: string;
      targetLabel: string;
    }[] = [];
    dashboardEffectEvents.forEach((pkg) => {
      (pkg.blastLogHistory || []).forEach((log) => {
        combined.push({
          ...log,
          targetLabel: log.targetLabel || log.targetSummary || 'Semua Nasabah',
          pkgTitle: pkg.title,
        });
      });
    });
    return combined.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [dashboardEffectEvents]);

  const toggleRecipientAccountCheckbox = (accountId: string) => {
    setSelectedRecipientIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const toggleSecondaryCombo = (effectId: string) => {
    if (effectId === activeCelebrationProfile.id) return;
    setSecondaryComboEffectIds((prev) => {
      if (prev.includes(effectId)) return prev.filter((id) => id !== effectId);
      if (prev.length >= 2) return [prev[1], effectId];
      return [...prev, effectId];
    });
  };

  const applyQuickPreset = (preset: QuickPresetTemplate) => {
    setPresetTemplateId(preset.id);
    setCelebrationEffect(preset.effectId);
    setSecondaryComboEffectIds(preset.comboIds);
    setCelebrationIntensity(preset.intensity);
    setTitle(preset.title);
    setWelcomeMessage(preset.welcomeMessage);
    setGravityDirection(preset.gravity);
    setScreenBorderFrame(preset.borderFrame);
    setCursorTrailMode(preset.cursorTrail);
    setBalanceCardThemeOverride(preset.cardTheme);
    setShowStadiumSpotlights(preset.spotlights);
    setShowLightningBolts(preset.lightning);
    setVipSirenAlertMode(preset.siren);
    setShowMarqueeTicker(true);
    setMarqueeTickerText(preset.marqueeText);
    setShowFloatingTrophyBadge(true);
    setFeedback(`✨ Preset Cepat "${preset.label}" diterapkan! Siap disimpan atau ditembakkan ke Dashboard Nasabah.`);
  };

  const resetFormToNew = () => {
    setEditingPkgId(null);
    setPresetTemplateId('');
    setTitle('👑 Panggung Perayaan Dashboard Sultan 1.000.000x');
    setSenderName('Dewan Direksi Bank Nusantara');
    setWelcomeMessage(
      'Selamat datang di Dashboard Utama Bank Nusantara! Nikmati Panggung Selebrasi 1.000.000x Hyper Godlike Overdrive lengkap dengan Multi-Combo Efek, Portal 3D, Laser Stadion, dan Aura Eksklusif di rekening Anda.'
    );
    setCelebrationEffect('sultan_mahkota_emas');
    setSecondaryComboEffectIds([]);
    setCelebrationIntensity('100000x');
    setRecipientSelectionMode('all');
    setTargetAccountId('__ALL__');
    setSelectedRecipientIds([]);
    setRecipientSearchQuery('');
    setDurationType('permanent');
    setStageDurationSeconds(8);
    setBannerStyle('full_top_banner');
    setSoundMode('fanfare_auto');
    setIsActive(true);
    setAutoBlastOnOpen(true);
    setShowPersistentDashboardAura(true);
    setDecorateBalanceCard(true);
    setShowAmbientParticles(true);
    setCustomParticleCount(96);
    setAnimationSpeedMultiplier(1);
    setParticleSizeScale(1);
    setGravityDirection('theme_default');
    setScreenBorderFrame('gold_royal');
    setShowMarqueeTicker(false);
    setCursorTrailMode('sparkle_dust');
    setShowFloatingTrophyBadge(false);
    setFloatingBadgePosition('bottom_right');
    setBalanceCardThemeOverride('auto_effect');
    setShowStadiumSpotlights(true);
    setShowLightningBolts(false);
    setAudioSynthOverride('auto_theme');
    setSoundVolumePercent(100);
    setTtsVoiceAnnouncementEnabled(false);
    setTtsCustomText('');
    setVipSirenAlertMode(false);
    setGachaRandomEffectOnBlast(false);
    setAutoRotatePlaylistEnabled(false);
    setScheduledTriggerTime('');
    setTargetCardTiers([]);
    setMinJobLevelTarget(1);
    setTargetDevRoleId('');
    setVipPriorityLock(false);
  };

  const loadPackageIntoEditor = (pkg: AdminDashboardEffectPackage) => {
    setEditingPkgId(pkg.id);
    setPresetTemplateId(pkg.presetTemplateId || '');
    setTitle(pkg.title);
    setSenderName(pkg.senderName);
    setWelcomeMessage(pkg.welcomeMessage);
    setCelebrationEffect(
      pkg.celebrationEffect && pkg.celebrationEffect !== 'none'
        ? pkg.celebrationEffect
        : 'sultan_mahkota_emas'
    );
    setSecondaryComboEffectIds(pkg.secondaryComboEffectIds || []);
    setCelebrationIntensity(pkg.celebrationIntensity || '100000x');
    setDurationType(pkg.durationType || 'permanent');
    setStageDurationSeconds(pkg.stageDurationSeconds || 8);
    setBannerStyle(pkg.bannerStyle || 'full_top_banner');
    setSoundMode(pkg.soundMode || 'fanfare_auto');
    setIsActive(pkg.isActive);
    setAutoBlastOnOpen(pkg.autoBlastOnOpen);
    setShowPersistentDashboardAura(pkg.showPersistentDashboardAura);
    setDecorateBalanceCard(pkg.decorateBalanceCard);
    setShowAmbientParticles(pkg.showAmbientParticles !== false);
    setCustomParticleCount(pkg.customParticleCount ?? 96);
    setAnimationSpeedMultiplier(pkg.animationSpeedMultiplier ?? 1);
    setParticleSizeScale(pkg.particleSizeScale ?? 1);
    setGravityDirection(pkg.gravityDirection || 'theme_default');
    setScreenBorderFrame(pkg.screenBorderFrame || 'none');
    setShowMarqueeTicker(Boolean(pkg.showMarqueeTicker));
    setMarqueeTickerText(pkg.marqueeTickerText || '');
    setCursorTrailMode(pkg.cursorTrailMode || 'none');
    setShowFloatingTrophyBadge(Boolean(pkg.showFloatingTrophyBadge));
    const normPos = (pkg.floatingBadgePosition || 'bottom_right').replace(/-/g, '_') as
      | 'top_right'
      | 'bottom_right'
      | 'bottom_left';
    setFloatingBadgePosition(normPos);
    setBalanceCardThemeOverride(pkg.balanceCardThemeOverride || 'auto_effect');
    setShowStadiumSpotlights(pkg.showStadiumSpotlights !== false);
    setShowLightningBolts(Boolean(pkg.showLightningBolts));
    setAudioSynthOverride(
      (pkg.audioSynthOverride as CelebrationAudioSynthStyle | 'auto_theme') || 'auto_theme'
    );
    setSoundVolumePercent(pkg.soundVolumePercent ?? 100);
    setTtsVoiceAnnouncementEnabled(Boolean(pkg.ttsVoiceAnnouncementEnabled));
    setTtsCustomText(pkg.ttsCustomText || '');
    setVipSirenAlertMode(Boolean(pkg.vipSirenAlertMode));
    setGachaRandomEffectOnBlast(Boolean(pkg.gachaRandomEffectOnBlast));
    setAutoRotatePlaylistEnabled(Boolean(pkg.autoRotatePlaylistEnabled));
    setPlaylistEffectIds(
      pkg.playlistEffectIds && pkg.playlistEffectIds.length > 0
        ? pkg.playlistEffectIds
        : ['sultan_mahkota_emas', 'cyberpunk_neon_overload', 'mitologi_naga_langit']
    );
    setPlaylistIntervalSeconds(pkg.playlistIntervalSeconds ?? 10);
    setScheduledTriggerTime(pkg.scheduledTriggerTime || '');
    setTargetCardTiers(pkg.targetCardTiers || []);
    setMinJobLevelTarget(pkg.minJobLevelTarget ?? 1);
    setTargetDevRoleId(pkg.targetDevRoleId || '');
    setVipPriorityLock(Boolean(pkg.vipPriorityLock));

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

    setFeedback(`✏️ Mengedit Paket Efek "${pkg.title}". Sesuaikan 24 fitur di bawah lalu klik Simpan / Tembakkan!`);
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

  const handleForceClearAllStages = () => {
    stopAllCelebrationEffectsAndAudio();
    setPreviewBurstState(null);
    const res = forceClearAllCelebrationStages({ deactivateEffects: true });
    setFeedback(res.message);
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
        setFeedback('⚠️ Centang minimal 1 akun nasabah penerima Efek Dashboard!');
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
      secondaryComboEffectIds,
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
      audioSynthOverride,
      soundVolumePercent,
      ttsVoiceAnnouncementEnabled,
      ttsCustomText,
      stageDurationSeconds,
      durationType,
      customParticleCount,
      animationSpeedMultiplier,
      particleSizeScale,
      gravityDirection,
      screenBorderFrame,
      showMarqueeTicker,
      marqueeTickerText,
      cursorTrailMode,
      showFloatingTrophyBadge,
      floatingBadgePosition,
      balanceCardThemeOverride,
      showStadiumSpotlights,
      showLightningBolts,
      vipSirenAlertMode,
      gachaRandomEffectOnBlast,
      autoRotatePlaylistEnabled,
      playlistEffectIds,
      playlistIntervalSeconds,
      scheduledTriggerTime: scheduledTriggerTime.trim() || undefined,
      targetCardTiers,
      minJobLevelTarget,
      targetDevRoleId: targetDevRoleId || undefined,
      vipPriorityLock,
      presetTemplateId: presetTemplateId || undefined,
      sendNow: blastImmediately,
    });

    setFeedback(res.message);
    if (!editingPkgId) {
      resetFormToNew();
    }
  };

  const handleQuickSendNewEffectToAccount = (accountId: string, effectId: string) => {
    const acc = accounts.find((a) => a.id === accountId);
    const prof = getCelebrationEffectProfile(effectId);
    const res = adminCreateOrUpdateDashboardEffect({
      title: `${prof.primaryEmoji} ${prof.celebrationHeadline}`,
      senderName: 'Otoritas Panel Admin Bank Nusantara',
      welcomeMessage: `Panggung Selebrasi ${prof.name} (${celebrationIntensity.toUpperCase()}) diaktifkan langsung oleh Admin untuk rekening ${
        acc ? acc.fullName : 'Anda'
      }!`,
      celebrationEffect: prof.id,
      secondaryComboEffectIds,
      celebrationIntensity,
      targetAccountId: accountId,
      targetAccountIds: [accountId],
      forcedPrimaryForAccountIds: [accountId],
      isActive: true,
      autoBlastOnOpen: true,
      showPersistentDashboardAura: true,
      decorateBalanceCard: true,
      showAmbientParticles: true,
      bannerStyle: 'full_top_banner',
      soundMode,
      stageDurationSeconds,
      durationType: 'permanent',
      sendNow: true,
    });
    setFeedback(res.message);
  };

  const handleExportPresetJson = () => {
    const payload = {
      title,
      senderName,
      welcomeMessage,
      celebrationEffect: activeCelebrationProfile.id,
      secondaryComboEffectIds,
      celebrationIntensity,
      durationType,
      stageDurationSeconds,
      bannerStyle,
      soundMode,
      audioSynthOverride,
      soundVolumePercent,
      ttsVoiceAnnouncementEnabled,
      ttsCustomText,
      customParticleCount,
      animationSpeedMultiplier,
      particleSizeScale,
      gravityDirection,
      screenBorderFrame,
      showMarqueeTicker,
      marqueeTickerText,
      cursorTrailMode,
      showFloatingTrophyBadge,
      floatingBadgePosition,
      balanceCardThemeOverride,
      showStadiumSpotlights,
      showLightningBolts,
      vipSirenAlertMode,
      gachaRandomEffectOnBlast,
      autoRotatePlaylistEnabled,
      playlistEffectIds,
      playlistIntervalSeconds,
    };
    const json = JSON.stringify(payload, null, 2);
    setJsonImportText(json);
    navigator.clipboard?.writeText(json).catch(() => {});
    setFeedback('📋 Preset Studio Efek berhasil diekspor ke JSON & disalin ke clipboard!');
  };

  const handleImportPresetJson = () => {
    try {
      const parsed = JSON.parse(jsonImportText);
      if (parsed.title) setTitle(String(parsed.title));
      if (parsed.senderName) setSenderName(String(parsed.senderName));
      if (parsed.welcomeMessage) setWelcomeMessage(String(parsed.welcomeMessage));
      if (parsed.celebrationEffect) setCelebrationEffect(String(parsed.celebrationEffect));
      if (Array.isArray(parsed.secondaryComboEffectIds))
        setSecondaryComboEffectIds(parsed.secondaryComboEffectIds);
      if (parsed.celebrationIntensity) setCelebrationIntensity(parsed.celebrationIntensity);
      if (parsed.gravityDirection) setGravityDirection(parsed.gravityDirection);
      if (parsed.screenBorderFrame) setScreenBorderFrame(parsed.screenBorderFrame);
      if (parsed.cursorTrailMode) setCursorTrailMode(parsed.cursorTrailMode);
      if (parsed.balanceCardThemeOverride)
        setBalanceCardThemeOverride(parsed.balanceCardThemeOverride);
      if (typeof parsed.customParticleCount === 'number')
        setCustomParticleCount(parsed.customParticleCount);
      if (typeof parsed.animationSpeedMultiplier === 'number')
        setAnimationSpeedMultiplier(parsed.animationSpeedMultiplier);
      if (typeof parsed.particleSizeScale === 'number')
        setParticleSizeScale(parsed.particleSizeScale);
      setFeedback('✅ JSON Konfigurasi Efek berhasil diimpor ke editor!');
    } catch {
      setFeedback('❌ Format JSON tidak valid. Periksa kembali teks JSON Anda.');
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* FULL-SCREEN LIVE STAGE PREVIEW FOR ADMIN */}
      {previewBurstState && (
        <CelebrationClaimBurstOverlay
          effectId={previewBurstState.effectId}
          secondaryComboEffectIds={secondaryComboEffectIds}
          burstNonce={previewBurstState.nonce}
          intensityLevel={previewBurstState.intensity}
          customHeadlineOverride={previewBurstState.headline}
          customSubtextOverride={welcomeMessage}
          customSenderOverride={senderName}
          forceSilentAudio={previewBurstState.soundMode === 'silent'}
          autoDismissSeconds={stageDurationSeconds}
          customParticleCount={customParticleCount}
          animationSpeedMultiplier={animationSpeedMultiplier}
          particleSizeScale={particleSizeScale}
          gravityDirection={gravityDirection}
          showStadiumSpotlights={showStadiumSpotlights}
          showLightningBolts={showLightningBolts}
          ttsVoiceAnnouncementEnabled={ttsVoiceAnnouncementEnabled}
          ttsCustomText={ttsCustomText}
          audioSynthOverride={audioSynthOverride}
          soundVolumePercent={soundVolumePercent}
          forceClearNonce={stageForceClearNonce}
          isPreviewMode
          onDismiss={() => setPreviewBurstState(null)}
        />
      )}

      {/* TOP HERO BANNER WITH FORCE CLEAR STAGE BUTTON */}
      <div className="bg-gradient-to-r from-indigo-950/95 via-slate-900 to-amber-950/90 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                💥 STUDIO EFEK DASHBOARD 1.000.000X (KHUSUS PANEL ADMIN)
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-mono font-bold text-[10px]">
                {usableCelebrations.length} Efek • 16 Kategori • 24 Fitur Lengkap
              </span>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-200 font-mono font-bold text-[10px]">
                Zero Tombol di Layar Nasabah • Real-Time Cloud RTDB
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pusat Kendali Studio Efek Dashboard ({usableCelebrations.length} Efek, 16 Kategori, Mode 1.000.000x &amp; Force Clear Stage)
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Pilih dari <strong>{usableCelebrations.length} efek di 16 kategori</strong>, gabungkan hingga <strong>3 efek Multi-Combo</strong>, atur <strong>Gravitasi, Kecepatan, Ukuran, Marquee, Bingkai Neon, Jejak Kursor, Audio Synth, TTS Suara, Playlist Auto-Rotate, &amp; Jadwal Jam</strong>!
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleForceClearAllStages}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 border-2 border-white/75 text-white font-black text-xs cursor-pointer flex items-center gap-2 shadow-2xl active:scale-95"
              title="Hapus Paksa seluruh panggung, partikel, konfeti, suara, dan aura ke semua layar nasabah seketika!"
            >
              <OctagonX className="w-4 h-4 shrink-0" />
              <span>🛑 FORCE CLEAR STAGE (Hapus Paksa Semua Live)</span>
            </button>

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
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                💥 Tes {celebrationIntensity.toUpperCase()} ({activeCelebrationProfile.primaryEmoji})
              </span>
            </button>
          </div>
        </div>

        {/* 12 QUICK 1-CLICK PRESET TEMPLATES BAR */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-amber-400/40 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              <span>⚡ Preset Template Cepat 1-Klik (12 Tema Siap Pakai):</span>
            </span>
            <button
              type="button"
              onClick={() => setShowJsonPanel((p) => !p)}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-bold text-[10px] cursor-pointer"
            >
              {showJsonPanel ? 'Tutup Export/Import JSON' : '📦 Export / Import JSON'}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {QUICK_PRESET_TEMPLATES_12.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyQuickPreset(preset)}
                className={`px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold border cursor-pointer transition flex items-center gap-1 ${
                  presetTemplateId === preset.id
                    ? 'bg-amber-400 text-slate-950 border-white font-black shadow'
                    : 'bg-slate-900 text-slate-200 border-slate-700 hover:border-amber-400/60'
                }`}
              >
                <span>{preset.emoji}</span>
                <span>{preset.label}</span>
              </button>
            ))}
          </div>

          {showJsonPanel && (
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <textarea
                rows={4}
                value={jsonImportText}
                onChange={(e) => setJsonImportText(e.target.value)}
                placeholder="Tempel JSON konfigurasi efek atau klik Ekspor Preset..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] font-mono text-cyan-200"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportPresetJson}
                  className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor JSON Sekarang</span>
                </button>
                <button
                  type="button"
                  onClick={handleImportPresetJson}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Terapkan JSON ke Studio</span>
                </button>
              </div>
            </div>
          )}
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

      {/* MAIN STUDIO GRID: LEFT = TARGET, 24 FEATURES & LIVE MINI PREVIEW (5 COLS), RIGHT = 311 EFFECTS PICKER (7 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-5 space-y-4">
          {/* LIVE MINI CUSTOMER DASHBOARD SIMULATOR */}
          <div className="bg-slate-900/95 border-2 border-cyan-400/50 rounded-3xl p-4 space-y-2.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10.5px] font-black text-cyan-300 flex items-center gap-1.5">
                <Monitor className="w-3.5 h-3.5" />
                <span>SIMULATOR PRATINJAU MINI LAYAR NASABAH (LIVE)</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-400 text-slate-950 font-black text-[9px]">
                {celebrationIntensity.toUpperCase()}
              </span>
            </div>

            <div
              className={`relative rounded-2xl p-3 bg-slate-950 overflow-hidden border-2 ${activeCelebrationProfile.cardBorderAccentClass} ${
                screenBorderFrame === 'gold_royal'
                  ? 'ring-2 ring-amber-400'
                  : screenBorderFrame === 'cyber_neon'
                  ? 'ring-2 ring-cyan-400'
                  : screenBorderFrame === 'rainbow_prism'
                  ? 'ring-2 ring-fuchsia-400'
                  : screenBorderFrame === 'fire_inferno'
                  ? 'ring-2 ring-orange-500'
                  : screenBorderFrame === 'emerald_laser'
                  ? 'ring-2 ring-emerald-400'
                  : ''
              } space-y-2`}
            >
              {vipSirenAlertMode && (
                <div className="px-2 py-1 rounded bg-rose-600/90 text-white font-black text-[9px] text-center animate-pulse">
                  🚨 SIRINE VIP: {title}
                </div>
              )}
              {showMarqueeTicker && (
                <div className="px-2 py-0.5 rounded bg-slate-900 border border-amber-400/40 text-amber-300 font-bold text-[9px] truncate">
                  📻 LIVE TICKER: {marqueeTickerText || welcomeMessage}
                </div>
              )}
              {showPersistentDashboardAura && bannerStyle !== 'aura_only_no_banner' && (
                <div
                  className={`p-2 rounded-xl bg-gradient-to-r ${activeCelebrationProfile.bannerGradientClass} text-white flex items-center justify-between gap-2`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-lg shrink-0">{activeCelebrationProfile.primaryEmoji}</span>
                    <div className="min-w-0">
                      <div className="font-black text-[10px] truncate">{title}</div>
                      <div className="text-[9px] opacity-90 truncate">{welcomeMessage}</div>
                    </div>
                  </div>
                  {secondaryComboEffectIds.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-black/50 text-[8.5px] font-mono shrink-0">
                      +{secondaryComboEffectIds.length} Combo
                    </span>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-[10px] text-slate-300">
                  <span className="block font-bold text-white">Kartu Saldo Utama</span>
                  <span className="text-[9px] text-slate-400">
                    Gravitasi: {gravityDirection} • {customParticleCount} partikel
                  </span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs font-black text-amber-300 block">Rp 125.000.000</span>
                  <span className="text-[8.5px] text-emerald-300">
                    {decorateBalanceCard ? `✓ Tema ${balanceCardThemeOverride}` : 'Standar'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>
                  {editingPkgId
                    ? '✏️ Edit Paket & 24 Fitur Efek Dashboard'
                    : '🚀 Konfigurasi 24 Fitur Efek Dashboard'}
                </span>
              </h3>
              {editingPkgId && (
                <button
                  type="button"
                  onClick={resetFormToNew}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] cursor-pointer"
                >
                  + Paket Baru
                </button>
              )}
            </div>

            {/* 1. TARGET RECIPIENTS + TIER/LEVEL/ROLE FILTERS */}
            <div className="p-3.5 rounded-2xl bg-slate-950/95 border-2 border-emerald-400/50 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-[11px] font-black text-emerald-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Target Penerima &amp; Filter Tier/Level/Role</span>
                </label>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[9.5px] font-mono font-bold">
                  {recipientSelectionMode === 'all'
                    ? `Semua (${accounts.length} Akun)`
                    : recipientSelectionMode === 'single'
                    ? '1 Akun'
                    : `${selectedRecipientIds.length} Akun`}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecipientSelectionMode('all');
                    setTargetAccountId('__ALL__');
                  }}
                  className={`py-2 px-2 rounded-xl font-bold text-[11px] border cursor-pointer transition-all ${
                    recipientSelectionMode === 'all'
                      ? 'bg-emerald-400 text-slate-950 border-emerald-200 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
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
                    if (fallbackId !== '__ALL__') setSelectedRecipientIds([fallbackId]);
                  }}
                  className={`py-2 px-2 rounded-xl font-bold text-[11px] border cursor-pointer transition-all ${
                    recipientSelectionMode === 'single'
                      ? 'bg-cyan-400 text-slate-950 border-cyan-200 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  👤 1 Orang
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRecipientSelectionMode('multi');
                    setTargetAccountId('__MULTI__');
                  }}
                  className={`py-2 px-2 rounded-xl font-bold text-[11px] border cursor-pointer transition-all ${
                    recipientSelectionMode === 'multi'
                      ? 'bg-amber-400 text-slate-950 border-amber-200 font-black'
                      : 'bg-slate-900 text-slate-300 border-slate-700'
                  }`}
                >
                  ☑️ Banyak Akun
                </button>
              </div>

              {recipientSelectionMode === 'single' && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={recipientSearchQuery}
                    onChange={(e) => setRecipientSearchQuery(e.target.value)}
                    placeholder="Cari nama nasabah atau nomor rekening..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-white"
                  />
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
                        {acc.fullName} — {acc.accountNumber} ({acc.cardTier.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {recipientSelectionMode === 'multi' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={recipientSearchQuery}
                      onChange={(e) => setRecipientSearchQuery(e.target.value)}
                      placeholder="Cari nama/no.rek..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-[11px] text-white"
                    />
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
                      className="px-2 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-[10px] cursor-pointer"
                    >
                      +Semua
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedRecipientIds([])}
                      className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-bold text-[10px] cursor-pointer"
                    >
                      Reset
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                    {filteredRecipientAccounts.map((acc) => {
                      const isChecked = selectedRecipientIds.includes(acc.id);
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => toggleRecipientAccountCheckbox(acc.id)}
                          className={`w-full p-2 rounded-lg border flex items-center justify-between gap-2 text-left cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-950/60 border-emerald-400/70 text-white'
                              : 'bg-slate-950/80 border-slate-800 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <span className="font-bold text-xs truncate">{acc.fullName}</span>
                          </div>
                          <span className="text-[9.5px] font-mono text-amber-300 shrink-0">
                            {acc.cardTier.toUpperCase()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Tier, Level & Dev Role Filters */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-cyan-300 block">
                  🎯 Filter Tambahan (Opsional — Kosongkan untuk Semua):
                </span>
                <div className="flex flex-wrap gap-1">
                  {(['regular', 'gold', 'platinum', 'prioritas', 'admin'] as CardTier[]).map(
                    (tier) => {
                      const activeT = targetCardTiers.includes(tier);
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() =>
                            setTargetCardTiers((prev) =>
                              prev.includes(tier)
                                ? prev.filter((x) => x !== tier)
                                : [...prev, tier]
                            )
                          }
                          className={`px-2 py-0.5 rounded-lg text-[9.5px] font-black uppercase cursor-pointer border ${
                            activeT
                              ? 'bg-cyan-400 text-slate-950 border-white'
                              : 'bg-slate-900 text-slate-400 border-slate-700'
                          }`}
                        >
                          {tier}
                        </button>
                      );
                    }
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9.5px] text-slate-400 block mb-0.5">
                      Min Level Karir:
                    </span>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={minJobLevelTarget}
                      onChange={(e) => setMinJobLevelTarget(Math.max(1, Number(e.target.value) || 1))}
                      className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                    />
                  </div>
                  <div>
                    <span className="text-[9.5px] text-slate-400 block mb-0.5">
                      Khusus Role Dev:
                    </span>
                    <select
                      value={targetDevRoleId}
                      onChange={(e) => setTargetDevRoleId(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-white text-[11px]"
                    >
                      <option value="">Semua Role</option>
                      {devRoles.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. JUDUL, PENGIRIM, MARQUEE TICKER & SIRINE */}
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800">
              <label className="text-[11px] font-bold text-amber-300 block">
                2. Judul Spanduk, Pengumuman &amp; Teks Marquee
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Judul spanduk..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold text-xs"
              />
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nama pengirim..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-200 font-semibold text-xs"
              />
              <textarea
                rows={2}
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="Pesan sambutan dashboard..."
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />

              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showMarqueeTicker}
                  onChange={(e) => setShowMarqueeTicker(e.target.checked)}
                />
                <span className="text-[11px] font-bold text-cyan-300">
                  📻 Tampilkan Ticker Teks Berjalan (Live Marquee)
                </span>
              </label>
              {showMarqueeTicker && (
                <input
                  type="text"
                  value={marqueeTickerText}
                  onChange={(e) => setMarqueeTickerText(e.target.value)}
                  placeholder="Isi teks marquee berjalan..."
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-amber-200 text-[11px]"
                />
              )}

              <div className="flex flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vipSirenAlertMode}
                    onChange={(e) => setVipSirenAlertMode(e.target.checked)}
                  />
                  <span className="text-[11px] font-bold text-rose-300">
                    🚨 Sirine Pengumuman VIP
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={vipPriorityLock}
                    onChange={(e) => setVipPriorityLock(e.target.checked)}
                  />
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Shield className="w-3 h-3" /> Kunci Prioritas VIP
                  </span>
                </label>
              </div>
            </div>

            {/* 3. DURASI AKTIF + JADWAL JAM OTOMATIS + AUTO-ROTATE PLAYLIST */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-cyan-400/40 space-y-3">
              <label className="text-[11px] font-black text-cyan-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>3. Durasi Aktif, Jadwal Jam &amp; Playlist Auto-Rotate</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DURATION_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setDurationType(d.id)}
                    className={`p-1.5 rounded-xl border text-left cursor-pointer ${
                      durationType === d.id
                        ? 'bg-cyan-400 text-slate-950 border-white font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <span className="text-[10px] font-black block">{d.label}</span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                {STAGE_DURATION_OPTIONS.map((st) => (
                  <button
                    key={st.seconds}
                    type="button"
                    onClick={() => setStageDurationSeconds(st.seconds)}
                    className={`py-1.5 px-2 rounded-xl border text-[10px] font-black cursor-pointer ${
                      stageDurationSeconds === st.seconds
                        ? 'bg-amber-400 text-slate-950 border-white'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-amber-300 flex items-center gap-1 mb-1">
                    <CalendarClock className="w-3 h-3" /> Jadwal Jam Auto-Blast (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={scheduledTriggerTime}
                    onChange={(e) => setScheduledTriggerTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div className="flex flex-col justify-end gap-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={gachaRandomEffectOnBlast}
                      onChange={(e) => setGachaRandomEffectOnBlast(e.target.checked)}
                    />
                    <span className="text-[10.5px] font-bold text-fuchsia-300 flex items-center gap-1">
                      <Shuffle className="w-3 h-3" /> Mode Gacha Efek Acak
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRotatePlaylistEnabled}
                      onChange={(e) => setAutoRotatePlaylistEnabled(e.target.checked)}
                    />
                    <span className="text-[10.5px] font-bold text-emerald-300">
                      🔄 Playlist Auto-Rotate ({playlistIntervalSeconds}d)
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. KOREOGRAFI PARTIKEL, BINGKAI LAYAR, KURSOR, AUDIO SYNTH & TTS */}
            <div className="p-3.5 rounded-2xl bg-slate-950/90 border-2 border-amber-400/50 space-y-3">
              <span className="text-[11px] font-black text-amber-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>4. Kendali Partikel, Bingkai 3D, Kursor, Trofi &amp; Audio TTS</span>
              </span>

              {/* Particle Density / Speed / Size Sliders */}
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300 font-bold block">Partikel: {customParticleCount}</span>
                  <input
                    type="range"
                    min={20}
                    max={240}
                    step={8}
                    value={customParticleCount}
                    onChange={(e) => setCustomParticleCount(Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300 font-bold block">Kecepatan: {animationSpeedMultiplier}x</span>
                  <input
                    type="range"
                    min={0.5}
                    max={2.5}
                    step={0.25}
                    value={animationSpeedMultiplier}
                    onChange={(e) => setAnimationSpeedMultiplier(Number(e.target.value))}
                    className="w-full accent-cyan-400"
                  />
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-300 font-bold block">Ukuran: {particleSizeScale}x</span>
                  <input
                    type="range"
                    min={0.75}
                    max={1.75}
                    step={0.1}
                    value={particleSizeScale}
                    onChange={(e) => setParticleSizeScale(Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>

              {/* Gravity / Border Frame / Cursor Trail / Balance Card Theme */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Arah Gravitasi Partikel:</label>
                  <select
                    value={gravityDirection}
                    onChange={(e) =>
                      setGravityDirection(e.target.value as DashboardParticleGravityStyle)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px]"
                  >
                    <option value="theme_default">✨ Default Tema</option>
                    <option value="fall_down">❄️ Jatuh Salju / Kelopak</option>
                    <option value="float_up">🎈 Balon / Lampion Naik</option>
                    <option value="diagonal_storm">⛈️ Badai Miring Kencang</option>
                    <option value="vortex_spiral">🌀 Vortex Portal Berputar</option>
                    <option value="matrix_digital_rain">🟩 Matrix Digital Rain</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Bingkai Layar Neon 3D:</label>
                  <select
                    value={screenBorderFrame}
                    onChange={(e) =>
                      setScreenBorderFrame(e.target.value as DashboardScreenBorderFrameStyle)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px]"
                  >
                    <option value="none">Tanpa Bingkai Layar</option>
                    <option value="gold_royal">👑 Bingkai Emas Kerajaan</option>
                    <option value="cyber_neon">💠 Bingkai Cyber Neon</option>
                    <option value="rainbow_prism">🌈 Bingkai Prisma Pelangi</option>
                    <option value="fire_inferno">🔥 Bingkai Api Naga</option>
                    <option value="emerald_laser">💚 Bingkai Laser Zamrud</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Efek Jejak Kursor Trail:</label>
                  <select
                    value={cursorTrailMode}
                    onChange={(e) =>
                      setCursorTrailMode(e.target.value as DashboardCursorTrailStyle)
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px]"
                  >
                    <option value="none">Tanpa Jejak Kursor</option>
                    <option value="sparkle_dust">✨ Debu Bintang Kilau</option>
                    <option value="rainbow_stars">🌟 Bintang Pelangi</option>
                    <option value="gold_coins">🪙 Koin Emas Sultan</option>
                    <option value="neon_laser">💠 Laser Cyberpunk</option>
                    <option value="fire_aura">🔥 Jejak Api Membara</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tema Kartu Saldo:</label>
                  <select
                    value={balanceCardThemeOverride}
                    onChange={(e) =>
                      setBalanceCardThemeOverride(
                        e.target.value as DashboardBalanceCardThemeOverride
                      )
                    }
                    className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[11px]"
                  >
                    <option value="auto_effect">🎨 Mengikuti Efek Aktif</option>
                    <option value="gold_sultan">👑 Emas Sultan</option>
                    <option value="cyber_cyan">🤖 Cyber Neon Cyan</option>
                    <option value="emerald_royal">💚 Zamrud Kerajaan</option>
                    <option value="crimson_fire">🔥 Merah Api Naga</option>
                    <option value="galaxy_purple">🌌 Ungu Galaksi</option>
                  </select>
                </div>
              </div>

              {/* Stage Spotlights, Lightning, Trophy Badge */}
              <div className="flex flex-wrap gap-3 pt-1">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showStadiumSpotlights}
                    onChange={(e) => setShowStadiumSpotlights(e.target.checked)}
                  />
                  <span className="text-[10.5px] font-bold text-amber-200">
                    🎭 Tirai Teater &amp; Sorot Stadion
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLightningBolts}
                    onChange={(e) => setShowLightningBolts(e.target.checked)}
                  />
                  <span className="text-[10.5px] font-bold text-cyan-200">
                    ⚡ Sambaran Petir Halilintar
                  </span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFloatingTrophyBadge}
                    onChange={(e) => setShowFloatingTrophyBadge(e.target.checked)}
                  />
                  <span className="text-[10.5px] font-bold text-emerald-200">
                    🏆 Lencana Trofi Mengambang
                  </span>
                </label>
              </div>

              {showFloatingTrophyBadge && (
                <select
                  value={floatingBadgePosition}
                  onChange={(e) =>
                    setFloatingBadgePosition(
                      e.target.value as 'top_right' | 'bottom_right' | 'bottom_left'
                    )
                  }
                  className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-200 text-[11px]"
                >
                  <option value="bottom_right">Posisi Trofi: Pojok Kanan Bawah</option>
                  <option value="bottom_left">Posisi Trofi: Pojok Kiri Bawah</option>
                  <option value="top_right">Posisi Trofi: Pojok Kanan Atas</option>
                </select>
              )}

              {/* Banner Style */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="text-[10.5px] font-bold text-slate-300 flex items-center gap-1">
                  <Layout className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Gaya Spanduk di Dashboard Nasabah:</span>
                </label>
                <div className="grid grid-cols-1 gap-1.5">
                  {BANNER_STYLE_OPTIONS.map((bs) => (
                    <button
                      key={bs.id}
                      type="button"
                      onClick={() => {
                        setBannerStyle(bs.id);
                        setShowPersistentDashboardAura(bs.id !== 'aura_only_no_banner');
                      }}
                      className={`p-2 rounded-xl border text-left cursor-pointer ${
                        bannerStyle === bs.id
                          ? 'bg-amber-400/20 border-amber-300 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="font-black text-[10.5px] block">{bs.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Synth & TTS Announcement */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSoundMode('fanfare_auto')}
                    className={`p-2 rounded-xl border text-left cursor-pointer flex items-center gap-2 ${
                      soundMode === 'fanfare_auto'
                        ? 'bg-emerald-400 text-slate-950 border-white font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span className="text-[10.5px] font-black">Fanfare Aktif</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSoundMode('silent')}
                    className={`p-2 rounded-xl border text-left cursor-pointer flex items-center gap-2 ${
                      soundMode === 'silent'
                        ? 'bg-rose-400 text-slate-950 border-white font-black'
                        : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}
                  >
                    <VolumeX className="w-4 h-4 shrink-0" />
                    <span className="text-[10.5px] font-black">Mode Senyap</span>
                  </button>
                </div>

                {soundMode !== 'silent' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <select
                      value={audioSynthOverride}
                      onChange={(e) =>
                        setAudioSynthOverride(
                          e.target.value as CelebrationAudioSynthStyle | 'auto_theme'
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-[10.5px]"
                    >
                      {AUDIO_SYNTH_STYLE_OPTIONS.map((opt) => (
                        <option key={opt.id} value={opt.id}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700">
                      <span className="text-[10px] text-slate-300 shrink-0">Vol {soundVolumePercent}%</span>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={soundVolumePercent}
                        onChange={(e) => setSoundVolumePercent(Number(e.target.value))}
                        className="w-full accent-emerald-400"
                      />
                    </div>
                  </div>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ttsVoiceAnnouncementEnabled}
                    onChange={(e) => setTtsVoiceAnnouncementEnabled(e.target.checked)}
                  />
                  <span className="text-[10.5px] font-bold text-amber-200">
                    🗣️ Pengumuman Suara Bicara TTS Bahasa Indonesia Saat Meledak
                  </span>
                </label>
                {ttsVoiceAnnouncementEnabled && (
                  <input
                    type="text"
                    value={ttsCustomText}
                    onChange={(e) => setTtsCustomText(e.target.value)}
                    placeholder="Kosongkan untuk pakai judul + pesan otomatis..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-amber-500/40 text-white text-[11px]"
                  />
                )}
              </div>

              {/* Core Element Switches */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoBlastOnOpen}
                    onChange={(e) => setAutoBlastOnOpen(e.target.checked)}
                  />
                  <span className="font-bold text-amber-200 text-[10.5px]">
                    1. Otomatis Ledakkan Panggung Saat Dikirim Admin
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showPersistentDashboardAura}
                    onChange={(e) => setShowPersistentDashboardAura(e.target.checked)}
                  />
                  <span className="font-bold text-cyan-200 text-[10.5px]">
                    2. Tampilkan Spanduk Sambutan &amp; Segel 3D
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={decorateBalanceCard}
                    onChange={(e) => setDecorateBalanceCard(e.target.checked)}
                  />
                  <span className="font-bold text-emerald-200 text-[10.5px]">
                    3. Hiasi Kartu Saldo Utama dengan Aura Neon
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showAmbientParticles}
                    onChange={(e) => setShowAmbientParticles(e.target.checked)}
                  />
                  <span className="font-bold text-fuchsia-200 text-[10.5px]">
                    4. Tampilkan Hujan Partikel Latar di Dashboard
                  </span>
                </label>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleSaveAndSend(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-400/50 text-amber-300 font-black cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>{editingPkgId ? 'Simpan Perubahan' : 'Simpan Tanpa Ledakan'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleSaveAndSend(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 hover:from-amber-200 hover:to-yellow-300 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-xl"
              >
                <Send className="w-4 h-4" />
                <span>💥 Kirim &amp; Ledakkan Sekarang!</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 311 CELEBRATION EFFECTS CATALOG + 1.000.000X INTENSITY + MULTI-COMBO LAYERING */}
        <div className="lg:col-span-7 bg-slate-900/95 border-2 border-amber-400/60 rounded-3xl p-5 space-y-4 shadow-2xl">
          <div className="border-b border-slate-800 pb-3">
            <span className="px-2.5 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider inline-block mb-1">
              💥 KATALOG {usableCelebrations.length} EFEK PERAYAAN • 16 KATEGORI • MULTI-COMBO 3 LAPIS
            </span>
            <h3 className="font-black text-white text-sm sm:text-base">
              Pilih Efek Utama, Tambah Combo (Maks 2 Pendamping), &amp; Tingkat Kemeriahan (Hingga 1.000.000x)
            </h3>
          </div>

          {/* 4-TIER INTENSITY MULTIPLIER SELECTOR */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-400/50 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-black text-amber-300">
                ⚡ Pilih Tingkat Intensitas Panggung (Hingga 1.000.000x Hyper Godlike):
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[10px]">
                AKTIF: {celebrationIntensity.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

          {/* ACTIVE SELECTED EFFECT + MULTI-COMBO LAYERING BAR */}
          <div
            className={`p-3.5 rounded-2xl bg-gradient-to-r ${activeCelebrationProfile.bannerGradientClass} border-2 ${activeCelebrationProfile.cardBorderAccentClass} space-y-2.5`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-950/75 border-2 border-white/30 flex items-center justify-center text-2xl shrink-0 shadow-lg">
                  {activeCelebrationProfile.primaryEmoji}
                </div>
                <div className="min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-slate-950/90 text-amber-300 font-black text-[9.5px] uppercase">
                    ✓ EFEK UTAMA • {activeCelebrationProfile.categoryLabel}
                  </span>
                  <h4 className="font-black text-white text-sm truncate mt-0.5">
                    {activeCelebrationProfile.name}
                  </h4>
                </div>
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
                💥 Uji Panggung + Combo
              </button>
            </div>

            {/* Active Multi-Combo Layers Display */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/20 text-[10px]">
              <span className="font-black text-white flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Multi-Combo Layer ({secondaryComboEffectIds.length}/2):
              </span>
              {secondaryComboEffectIds.length === 0 ? (
                <span className="text-white/80">Klik tombol &ldquo;+ Combo&rdquo; di kartu efek manapun untuk menggabung!</span>
              ) : (
                secondaryComboEffectIds.map((cid) => {
                  const cp = getCelebrationEffectProfile(cid);
                  return (
                    <button
                      key={cid}
                      type="button"
                      onClick={() => toggleSecondaryCombo(cid)}
                      className="px-2 py-0.5 rounded-full bg-slate-950/85 border border-white/40 text-amber-200 font-bold cursor-pointer"
                    >
                      {cp.primaryEmoji} {cp.name} ✕
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* 16 CATEGORY TABS + SEARCH */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {CELEBRATION_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setCelebCategoryFilter(cat.key)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black cursor-pointer border transition ${
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
                placeholder={`Cari dari ${usableCelebrations.length} efek di 16 kategori...`}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
              />
            </div>
          </div>

          {/* 311 EFFECTS RADIO + COMBO GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredCelebrations.map((item) => {
              const isSelected = activeCelebrationProfile.id === item.id;
              const isInCombo = secondaryComboEffectIds.includes(item.id);
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
                      ? 'bg-gradient-to-br from-amber-500/25 via-slate-900 to-slate-950 border-amber-400 shadow-lg'
                      : isInCombo
                      ? 'bg-gradient-to-br from-cyan-500/20 via-slate-900 to-slate-950 border-cyan-400'
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
                        <span className="text-[9.5px] text-amber-300/90 font-semibold block truncate">
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
                          : isInCombo
                          ? 'bg-cyan-400 text-slate-950'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isSelected ? '● Utama' : isInCombo ? '+ Combo' : 'Pilih'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 text-xs">
                      {item.particleEmojis.slice(0, 4).map((em, i) => (
                        <span key={i} className="select-none">
                          {em}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      {!isSelected && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSecondaryCombo(item.id);
                          }}
                          className={`px-2 py-1 rounded-lg font-black text-[9.5px] cursor-pointer border ${
                            isInCombo
                              ? 'bg-cyan-400 text-slate-950 border-white'
                              : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200 hover:bg-cyan-500/30'
                          }`}
                        >
                          {isInCombo ? '✓ Combo' : '+ Combo'}
                        </button>
                      )}
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
                        className="px-2 py-1 rounded-lg bg-amber-400/20 hover:bg-amber-400 hover:text-slate-950 border border-amber-400/50 text-amber-200 font-black text-[9.5px] cursor-pointer"
                      >
                        💥 Tes
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =========================================================================
          TABEL PANTAUAN LIVE EFEK AKTIF PER AKUN NASABAH
         ========================================================================= */}
      <div className="bg-slate-900/95 border-2 border-cyan-400/60 rounded-3xl p-5 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-black text-[9.5px] uppercase tracking-wider inline-block mb-1">
              📡 PANTAUAN LIVE &amp; KONTROL PAKSA PER AKUN NASABAH
            </span>
            <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
              <Monitor className="w-4 h-4 text-cyan-400" />
              <span>Tabel Status Efek Dashboard Aktif ({accounts.length} Akun)</span>
            </h3>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={accountMonitorSearch}
              onChange={(e) => setAccountMonitorSearch(e.target.value)}
              placeholder="Cari nama / no. rekening..."
              className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-2.5 px-3">Nasabah &amp; Rekening</th>
                <th className="py-2.5 px-3">Efek Utama Aktif</th>
                <th className="py-2.5 px-3">Elemen &amp; Durasi</th>
                <th className="py-2.5 px-3 text-right">Kontrol Langsung Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-xs">
              {filteredMonitorAccounts.map((acc) => {
                const { eligiblePackages, primaryPackage } =
                  resolveActiveDashboardEffectsForAccount(dashboardEffectEvents, acc);
                const activeCeleb = primaryPackage
                  ? getCelebrationEffectProfile(primaryPackage.celebrationEffect)
                  : null;

                return (
                  <tr key={acc.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-black text-white">{acc.fullName}</div>
                      <div className="text-[10.5px] font-mono text-slate-400">
                        {acc.accountNumber} • <span className="text-amber-300 uppercase">{acc.cardTier}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {primaryPackage && activeCeleb ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{activeCeleb.primaryEmoji}</span>
                          <div>
                            <div className="font-black text-white text-xs">
                              {activeCeleb.name}{' '}
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px]">
                                {(primaryPackage.celebrationIntensity || '100000x').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {eligiblePackages.length} paket aktif
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10.5px]">🚫 Kosong / Disembunyikan</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      {primaryPackage ? (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 font-mono text-[10px]">
                          {formatDashboardEffectRemainingLabel(primaryPackage)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
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
                            className="px-2.5 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-black text-[10.5px] cursor-pointer flex items-center gap-1"
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
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-400 text-slate-950 font-black text-[10.5px] cursor-pointer flex items-center gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            <span>💥 Pasang {activeCelebrationProfile.primaryEmoji}</span>
                          </button>
                        )}

                        {primaryPackage ? (
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminHideAllDashboardEffectsForAccount(acc.id);
                              setFeedback(res.message);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400/50 text-rose-200 font-bold text-[10.5px] cursor-pointer flex items-center gap-1"
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
                              className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-bold text-[10.5px] cursor-pointer flex items-center gap-1"
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
          DAFTAR PAKET EFEK DASHBOARD + LOG TEMBAKAN
         ========================================================================= */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Daftar Paket Efek Dashboard ({dashboardEffectEvents.length} Paket)</span>
          </h3>
        </div>

        <div className="space-y-3">
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
                className={`p-4 rounded-3xl border-2 space-y-3 ${
                  pkg.isActive
                    ? 'bg-slate-950/95 border-amber-400/60'
                    : 'bg-slate-950/50 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-full bg-gradient-to-r ${celeb.bannerGradientClass} text-white font-black text-[10px]`}
                      >
                        {celeb.primaryEmoji} {celeb.name} • {intensity.toUpperCase()}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-200 font-bold text-[10px]">
                        {formatDashboardEffectRemainingLabel(pkg)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          pkg.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {pkg.isActive ? '● Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <h4 className="font-black text-white text-sm">{pkg.title}</h4>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminTriggerDashboardEffectBlastNow(pkg.id);
                      setFeedback(res.message);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-300 to-yellow-400 text-slate-950 font-black text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>💥 Tembak Ulang Sekarang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setManagingPkgId((prev) => (prev === pkg.id ? null : pkg.id))
                    }
                    className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/50 text-cyan-200 font-black text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isManagingThis ? 'Tutup Kelola' : 'Pengaturan Cepat & Penerima'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const res = adminDuplicateDashboardEffect(pkg.id, { sendNow: true });
                      setFeedback(res.message);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-fuchsia-500/20 text-fuchsia-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplikasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => loadPackageIntoEditor(pkg)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-amber-200 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const res = adminToggleDashboardEffectActive(pkg.id);
                      setFeedback(res.message);
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-emerald-300 font-bold text-[11px] cursor-pointer flex items-center gap-1"
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
                    className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 font-bold text-[11px] cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>

                {isManagingThis && (
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-cyan-400/50 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <select
                        value={celeb.id}
                        onChange={(e) => {
                          const res = adminUpdateDashboardEffectQuickSettings(pkg.id, {
                            celebrationEffect: e.target.value,
                            autoBlastNow: true,
                          });
                          setFeedback(res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-amber-400/50 text-white text-[11px]"
                      >
                        {usableCelebrations.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.primaryEmoji} {c.name}
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
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-cyan-400/50 text-cyan-200 text-[11px]"
                      >
                        {CELEBRATION_INTENSITY_OPTIONS.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto">
                      <input
                        type="text"
                        value={manageRecipientSearch}
                        onChange={(e) => setManageRecipientSearch(e.target.value)}
                        placeholder="Cari penerima..."
                        className="w-full px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-[11px]"
                      />
                      {filteredManageAccounts.map((acc) => {
                        const isRevoked = (pkg.revokedAccountIds || []).includes(acc.id);
                        return (
                          <div
                            key={acc.id}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                          >
                            <span className="font-bold text-white text-xs">
                              {acc.fullName} ({acc.accountNumber})
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const res = adminToggleRevokeDashboardEffectRecipient(
                                  pkg.id,
                                  acc.id
                                );
                                setFeedback(res.message);
                              }}
                              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer flex items-center gap-1 ${
                                isRevoked
                                  ? 'bg-cyan-500/20 text-cyan-200'
                                  : 'bg-rose-500/20 text-rose-200'
                              }`}
                            >
                              {isRevoked ? <CheckCircle2 className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                              <span>{isRevoked ? 'Tampilkan' : 'Sembunyikan'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* BLAST LOG HISTORY */}
        {allBlastLogs.length > 0 && (
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <h4 className="font-black text-amber-300 text-xs flex items-center gap-1.5">
              <History className="w-4 h-4" />
              <span>Riwayat Log Tembakan Efek Terbaru ({allBlastLogs.length})</span>
            </h4>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {allBlastLogs.slice(0, 20).map((log) => {
                const lp = getCelebrationEffectProfile(log.effectId);
                return (
                  <div
                    key={log.id}
                    className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10.5px]"
                  >
                    <span className="text-white font-bold">
                      {lp.primaryEmoji} {log.pkgTitle} ({log.intensity.toUpperCase()})
                    </span>
                    <span className="text-cyan-300 font-mono">
                      Target: {log.targetLabel} •{' '}
                      {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
