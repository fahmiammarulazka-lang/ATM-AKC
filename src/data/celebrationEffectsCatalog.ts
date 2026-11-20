/**
 * Katalog Lengkap 105+ Efek & Perayaan Hadiah & Surat Bank Nusantara (108 Total Pilihan di 9 Kategori)
 * + Mesin Koreografi Panggung Sinematik 100.000x Ultra Max Overdrive
 * + Synthesizer Musik & Fanfare Web Audio API Otomatis Sesuai Tema
 */
import confetti from 'canvas-confetti';
import {
  EXTRA_CELEBRATION_SEEDS_200,
  ExtraCompactCelebSeed,
} from './extraCelebrationSeeds200';

export type CelebrationCategoryKey =
  | 'all'
  | 'momen_spesial'
  | 'nasional_ri'
  | 'hari_raya'
  | 'musim_dunia'
  | 'sultan_vip'
  | 'cyberpunk_scifi'
  | 'anime_fantasi'
  | 'alam_galaksi'
  | 'profesi_gaya_hidup'
  | 'kerajaan_nusantara'
  | 'mitologi_legenda'
  | 'esports_gaming'
  | 'kuliner_nusantara'
  | 'musik_konser'
  | 'otomotif_balap'
  | 'olahraga_cuaca_quantum';

export type CelebrationIntensityLevel = '1000x' | '10000x' | '100000x' | '1000000x';

export type CelebrationMotionStyle =
  | 'dragon_parade'
  | 'meteor_shower'
  | 'patriot_salute'
  | 'cyber_laser_grid'
  | 'royal_gold_storm'
  | 'sacred_mandala'
  | 'sakura_blizzard'
  | 'supernova_vortex'
  | 'anime_aura_burst'
  | 'festival_carnival'
  | 'matrix_digital_rain'
  | 'thunderbolt_strike'
  | 'theater_curtain_spotlight'
  | 'coin_3d_deluge'
  | 'aurora_wave_ribbon'
  | 'fireworks'
  | 'fountain_burst'
  | 'gentle_snow'
  | 'petal_drift'
  | 'lantern_rise'
  | 'royal_shower'
  | 'none';

export type CelebrationAudioSynthStyle =
  | 'royal_fanfare'
  | 'patriot_march'
  | 'sacred_chime'
  | 'cyber_synth'
  | 'anime_power'
  | 'cosmic_arp'
  | 'festive_party'
  | 'gentle_harp'
  | 'gamelan_royal'
  | 'mythic_orchestra'
  | 'arcade_8bit'
  | 'edm_stadium_drop'
  | 'racing_nitro_rev'
  | 'stadium_champion_horn'
  | 'thunder_storm_bass'
  | 'quantum_ai_pulse'
  | 'silent';

export const AUDIO_SYNTH_STYLE_OPTIONS: {
  id: CelebrationAudioSynthStyle | 'auto_theme';
  label: string;
}[] = [
  { id: 'auto_theme', label: '🎼 Otomatis Sesuai Tema Efek (16 Gaya)' },
  { id: 'royal_fanfare', label: '🎺 Fanfare Istana Kerajaan (Royal Brass)' },
  { id: 'gamelan_royal', label: '🔔 Gamelan Kencana Keraton Nusantara' },
  { id: 'patriot_march', label: '🥁 Mars Patriot & Terompet Kemerdekaan' },
  { id: 'sacred_chime', label: '🕌 Lonceng Suci & Nada Harmoni Kedamaian' },
  { id: 'cyber_synth', label: '🤖 Cyberpunk Sawtooth Synth Overdrive' },
  { id: 'quantum_ai_pulse', label: '⚛️ Quantum AI Neural Pulse Synth' },
  { id: 'anime_power', label: '⚡ Anime Power Opening Shonen Lead' },
  { id: 'arcade_8bit', label: '🕹️ Retro Arcade 8-Bit Chiptune Victory' },
  { id: 'edm_stadium_drop', label: '🎧 EDM Konser Stadion Drop & Bass' },
  { id: 'racing_nitro_rev', label: '🏎️ Turbo Racing Nitro Rev & Finish Horn' },
  { id: 'stadium_champion_horn', label: '🏆 Terompet Juara Stadion Piala Dunia' },
  { id: 'mythic_orchestra', label: '🐉 Orkestra Epik Mitologi Naga & Dewata' },
  { id: 'thunder_storm_bass', label: '🌩️ Sub-Bass Petir Halilintar Menggelegar' },
  { id: 'cosmic_arp', label: '🌌 Arpeggio Galaksi & Nebula Kosmik' },
  { id: 'festive_party', label: '🎉 Musik Pesta Karnaval & Kembang Api' },
  { id: 'gentle_harp', label: '🪷 Harpa Lembut Musim Semi & Sakura' },
  { id: 'silent', label: '🔇 Mode Senyap Tanpa Audio Synth' },
];

export interface CelebrationEffectProfile {
  id: string;
  name: string;
  shortBadge: string;
  category: Exclude<CelebrationCategoryKey, 'all'>;
  categoryLabel: string;
  primaryEmoji: string;
  particleEmojis: string[];
  mascotParadeEmojis: string[];
  trophyTitle: string;
  choreographyLabel: string;
  confettiColors: string[];
  laserColors: [string, string, string];
  motionStyle: CelebrationMotionStyle;
  audioSynthStyle: CelebrationAudioSynthStyle;
  description: string;
  celebrationHeadline: string;
  celebrationSubtext: string;
  recommendedThemeColor: 'amber' | 'emerald' | 'rose' | 'indigo';
  // Token Hiasan Visual Pra-Klaim Hidup & Lembar Surat
  ribbonColorClass: string;
  waxSealGradientClass: string;
  cardBorderAccentClass: string;
  cardGlowClass: string;
  bannerGradientClass: string;
  badgeClass: string;
  cornerOrnamentSymbol: string;
}

export const CELEBRATION_INTENSITY_OPTIONS: {
  id: CelebrationIntensityLevel;
  label: string;
  shortLabel: string;
  badgeText: string;
  particleCount: number;
  laserBeamCount: number;
  shockwaveCount: number;
  paradeCount: number;
  confettiSalvos: number;
}[] = [
  {
    id: '1000x',
    label: '✨ Mode 1.000x Megah (Standard Stage)',
    shortLabel: '1.000x Megah',
    badgeText: '⚡ 1.000X STAGE',
    particleCount: 40,
    laserBeamCount: 6,
    shockwaveCount: 2,
    paradeCount: 4,
    confettiSalvos: 3,
  },
  {
    id: '10000x',
    label: '🔥 Mode 10.000x Super Spektakuler (Epic Show)',
    shortLabel: '10.000x Epik',
    badgeText: '🔥 10.000X EPIC SHOW',
    particleCount: 68,
    laserBeamCount: 10,
    shockwaveCount: 4,
    paradeCount: 7,
    confettiSalvos: 5,
  },
  {
    id: '100000x',
    label: '💥 Mode 100.000x ULTRA MAX OVERDRIVE (Panggung Sinematik Penuh)',
    shortLabel: '100.000x ULTRA MAX',
    badgeText: '💥 100.000X ULTRA MAX OVERDRIVE',
    particleCount: 96,
    laserBeamCount: 14,
    shockwaveCount: 6,
    paradeCount: 10,
    confettiSalvos: 8,
  },
  {
    id: '1000000x',
    label: '🌌 Mode 1.000.000x HYPER GODLIKE OVERDRIVE (Panggung Maksimal 1 Juta Kali)',
    shortLabel: '1.000.000x GODLIKE',
    badgeText: '🌌 1.000.000X HYPER GODLIKE OVERDRIVE',
    particleCount: 160,
    laserBeamCount: 22,
    shockwaveCount: 8,
    paradeCount: 14,
    confettiSalvos: 12,
  },
];

export const getCelebrationIntensityMeta = (level?: string | null) => {
  return (
    CELEBRATION_INTENSITY_OPTIONS.find((o) => o.id === level) ||
    CELEBRATION_INTENSITY_OPTIONS[2] // Default 100.000x Ultra Max Overdrive
  );
};

export const CELEBRATION_CATEGORIES: {
  key: CelebrationCategoryKey;
  label: string;
  emoji: string;
}[] = [
  { key: 'all', label: 'Semua Perayaan (311 Efek • 16 Kategori)', emoji: '💥' },
  { key: 'momen_spesial', label: 'Momen Spesial & Ultah', emoji: '🎂' },
  { key: 'nasional_ri', label: 'Nasional & Kemerdekaan RI', emoji: '🇮🇩' },
  { key: 'hari_raya', label: 'Hari Raya & Keagamaan', emoji: '🕌' },
  { key: 'musim_dunia', label: 'Musim & Festival Dunia', emoji: '🎄' },
  { key: 'sultan_vip', label: 'Sultan & Kemewahan VIP', emoji: '👑' },
  { key: 'cyberpunk_scifi', label: 'Cyberpunk, Mecha & Sci-Fi', emoji: '🤖' },
  { key: 'anime_fantasi', label: 'Anime, Esports & Fantasi', emoji: '⚡' },
  { key: 'alam_galaksi', label: 'Alam Semesta & Galaksi', emoji: '🌌' },
  { key: 'profesi_gaya_hidup', label: 'Pencapaian & Gaya Hidup', emoji: '🏆' },
  { key: 'kerajaan_nusantara', label: 'Kerajaan Nusantara & Pusaka', emoji: '🏛️' },
  { key: 'mitologi_legenda', label: 'Mitologi, Naga & Dewata', emoji: '🐉' },
  { key: 'esports_gaming', label: 'Esports, Gaming & Retro Arcade', emoji: '🎮' },
  { key: 'kuliner_nusantara', label: 'Kuliner & Jamuan Nusantara', emoji: '🍜' },
  { key: 'musik_konser', label: 'Musik, Konser & Festival DJ', emoji: '🎧' },
  { key: 'otomotif_balap', label: 'Otomotif, Balap & Sirkuit', emoji: '🏎️' },
  { key: 'olahraga_cuaca_quantum', label: 'Olahraga Juara, Cuaca & Quantum AI', emoji: '⚛️' },
];

type CompactCelebSeed = {
  id: string;
  name: string;
  shortBadge: string;
  category: Exclude<CelebrationCategoryKey, 'all'>;
  categoryLabel: string;
  primaryEmoji: string;
  particleEmojis: string[];
  mascotParadeEmojis: string[];
  trophyTitle: string;
  choreographyLabel: string;
  confettiColors: string[];
  laserColors: [string, string, string];
  motionStyle: CelebrationMotionStyle;
  audioSynthStyle: CelebrationAudioSynthStyle;
  description: string;
  celebrationHeadline: string;
  celebrationSubtext: string;
  theme: 'amber' | 'emerald' | 'rose' | 'indigo';
  paletteStyle:
    | 'rose_gold'
    | 'red_white'
    | 'emerald_gold'
    | 'royal_gold'
    | 'cyber_cyan'
    | 'purple_magic'
    | 'crimson_gold'
    | 'sky_ice'
    | 'sunset_fire'
    | 'none_slate';
  cornerOrnamentSymbol: string;
};

const PALETTE_TOKENS: Record<
  CompactCelebSeed['paletteStyle'],
  {
    ribbonColorClass: string;
    waxSealGradientClass: string;
    cardBorderAccentClass: string;
    cardGlowClass: string;
    bannerGradientClass: string;
    badgeClass: string;
  }
> = {
  rose_gold: {
    ribbonColorClass: 'bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400 border-pink-200/80',
    waxSealGradientClass: 'from-pink-400 via-rose-500 to-amber-500 border-pink-100',
    cardBorderAccentClass: 'border-pink-400/80 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(244,63,94,0.42)]',
    bannerGradientClass: 'from-rose-950/95 via-fuchsia-950/95 to-amber-950/95 border-pink-400/80',
    badgeClass: 'bg-gradient-to-r from-pink-500 via-rose-500 to-amber-400 text-slate-950',
  },
  red_white: {
    ribbonColorClass: 'bg-gradient-to-b from-red-600 via-red-500 to-white border-red-200',
    waxSealGradientClass: 'from-red-600 via-red-500 to-rose-700 border-white',
    cardBorderAccentClass: 'border-red-500/90 hover:border-white',
    cardGlowClass: 'shadow-[0_0_55px_rgba(239,68,68,0.48)]',
    bannerGradientClass: 'from-red-950/95 via-rose-900/95 to-slate-900/95 border-red-400',
    badgeClass: 'bg-gradient-to-r from-red-600 via-red-500 to-white text-slate-950',
  },
  emerald_gold: {
    ribbonColorClass: 'bg-gradient-to-b from-emerald-500 via-teal-500 to-amber-400 border-emerald-200',
    waxSealGradientClass: 'from-emerald-400 via-green-600 to-amber-500 border-emerald-100',
    cardBorderAccentClass: 'border-emerald-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(16,185,129,0.42)]',
    bannerGradientClass: 'from-emerald-950/95 via-teal-950/95 to-amber-950/95 border-emerald-400/85',
    badgeClass: 'bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 text-slate-950',
  },
  royal_gold: {
    ribbonColorClass: 'bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700 border-yellow-100',
    waxSealGradientClass: 'from-yellow-200 via-amber-400 to-amber-700 border-white',
    cardBorderAccentClass: 'border-amber-300/95 hover:border-yellow-200',
    cardGlowClass: 'shadow-[0_0_60px_rgba(251,191,36,0.52)]',
    bannerGradientClass: 'from-amber-950/95 via-yellow-900/95 to-slate-950/95 border-amber-300',
    badgeClass: 'bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 text-slate-950',
  },
  cyber_cyan: {
    ribbonColorClass: 'bg-gradient-to-b from-cyan-400 via-blue-500 to-fuchsia-500 border-cyan-200',
    waxSealGradientClass: 'from-cyan-300 via-blue-600 to-fuchsia-600 border-cyan-100',
    cardBorderAccentClass: 'border-cyan-400/90 hover:border-fuchsia-300',
    cardGlowClass: 'shadow-[0_0_55px_rgba(34,211,238,0.48)]',
    bannerGradientClass: 'from-cyan-950/95 via-slate-950/95 to-fuchsia-950/95 border-cyan-400/85',
    badgeClass: 'bg-gradient-to-r from-cyan-300 via-sky-400 to-fuchsia-400 text-slate-950',
  },
  purple_magic: {
    ribbonColorClass: 'bg-gradient-to-b from-purple-500 via-fuchsia-500 to-amber-400 border-purple-200',
    waxSealGradientClass: 'from-purple-400 via-fuchsia-600 to-indigo-700 border-purple-100',
    cardBorderAccentClass: 'border-purple-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_55px_rgba(168,85,247,0.48)]',
    bannerGradientClass: 'from-purple-950/95 via-indigo-950/95 to-fuchsia-950/95 border-purple-400/85',
    badgeClass: 'bg-gradient-to-r from-purple-300 via-fuchsia-400 to-amber-300 text-slate-950',
  },
  crimson_gold: {
    ribbonColorClass: 'bg-gradient-to-b from-red-600 via-amber-400 to-red-700 border-yellow-200',
    waxSealGradientClass: 'from-red-500 via-amber-500 to-red-800 border-yellow-200',
    cardBorderAccentClass: 'border-red-500/85 hover:border-yellow-300',
    cardGlowClass: 'shadow-[0_0_55px_rgba(239,68,68,0.48)]',
    bannerGradientClass: 'from-red-950/95 via-amber-950/95 to-red-900/95 border-yellow-400/85',
    badgeClass: 'bg-gradient-to-r from-red-500 via-amber-400 to-yellow-300 text-slate-950',
  },
  sky_ice: {
    ribbonColorClass: 'bg-gradient-to-b from-sky-300 via-cyan-400 to-blue-600 border-white',
    waxSealGradientClass: 'from-sky-200 via-cyan-400 to-blue-700 border-white',
    cardBorderAccentClass: 'border-sky-300/85 hover:border-white',
    cardGlowClass: 'shadow-[0_0_50px_rgba(56,189,248,0.45)]',
    bannerGradientClass: 'from-sky-950/95 via-blue-950/95 to-slate-900/95 border-sky-300/80',
    badgeClass: 'bg-gradient-to-r from-sky-200 via-cyan-300 to-white text-slate-950',
  },
  sunset_fire: {
    ribbonColorClass: 'bg-gradient-to-b from-orange-500 via-amber-500 to-rose-600 border-amber-200',
    waxSealGradientClass: 'from-orange-400 via-red-500 to-amber-600 border-yellow-100',
    cardBorderAccentClass: 'border-orange-400/85 hover:border-yellow-300',
    cardGlowClass: 'shadow-[0_0_55px_rgba(249,115,22,0.48)]',
    bannerGradientClass: 'from-orange-950/95 via-rose-950/95 to-amber-950/95 border-orange-400/85',
    badgeClass: 'bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 text-slate-950',
  },
  none_slate: {
    ribbonColorClass: 'bg-rose-600/90 border-amber-100/60',
    waxSealGradientClass: 'from-amber-300 via-yellow-500 to-amber-700 border-amber-100',
    cardBorderAccentClass: 'border-amber-400/75 hover:border-amber-300',
    cardGlowClass: 'shadow-xl',
    bannerGradientClass: 'from-slate-900 to-slate-950 border-slate-700',
    badgeClass: 'bg-slate-800 text-slate-300',
  },
};

const buildCatalogEntry = (seed: CompactCelebSeed): CelebrationEffectProfile => {
  const pal = PALETTE_TOKENS[seed.paletteStyle];
  return {
    id: seed.id,
    name: seed.name,
    shortBadge: seed.shortBadge,
    category: seed.category,
    categoryLabel: seed.categoryLabel,
    primaryEmoji: seed.primaryEmoji,
    particleEmojis: seed.particleEmojis,
    mascotParadeEmojis: seed.mascotParadeEmojis,
    trophyTitle: seed.trophyTitle,
    choreographyLabel: seed.choreographyLabel,
    confettiColors: seed.confettiColors,
    laserColors: seed.laserColors,
    motionStyle: seed.motionStyle,
    audioSynthStyle: seed.audioSynthStyle,
    description: seed.description,
    celebrationHeadline: seed.celebrationHeadline,
    celebrationSubtext: seed.celebrationSubtext,
    recommendedThemeColor: seed.theme,
    ribbonColorClass: pal.ribbonColorClass,
    waxSealGradientClass: pal.waxSealGradientClass,
    cardBorderAccentClass: pal.cardBorderAccentClass,
    cardGlowClass: pal.cardGlowClass,
    bannerGradientClass: pal.bannerGradientClass,
    badgeClass: pal.badgeClass,
    cornerOrnamentSymbol: seed.cornerOrnamentSymbol,
  };
};

const CATALOG_SEEDS: CompactCelebSeed[] = [
  // ============================================================================
  // 1. MOMEN SPESIAL & ULANG TAHUN (14 EFEK)
  // ============================================================================
  {
    id: 'ulang_tahun_meriah',
    name: 'Ulang Tahun Meriah (Birthday Grand Stage)',
    shortBadge: '🎂 Selamat Ulang Tahun',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🎂',
    particleEmojis: ['🎂', '🎈', '🎉', '🎁', '🥳', '🧁', '✨', '🕯️'],
    mascotParadeEmojis: ['🎂', '🎈', '🥳', '🎁', '🎺'],
    trophyTitle: 'HAPPY BIRTHDAY ROYAL TROPHY',
    choreographyLabel: 'Karnaval Kue Tart & Parade Balon 3D',
    confettiColors: ['#F43F5E', '#FBBF24', '#38BDF8', '#A855F7', '#34D399', '#FFFFFF'],
    laserColors: ['#F43F5E', '#FBBF24', '#38BDF8'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Panggung ulang tahun akbar dengan parade kue tart 3 tingkat, balon terbang, laser pelangi, dan trofi hologram.',
    celebrationHeadline: '🎂 SELAMAT ULANG TAHUN! HAPPY BIRTHDAY 100.000X!',
    celebrationSubtext: 'Semoga panjang umur, sehat selalu, bahagia, dan makin berlimpah rezeki bersama Bank Nusantara!',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🎈',
  },
  {
    id: 'ulang_tahun_sultan_emas',
    name: 'Ulang Tahun Sultan Emas (Golden Royal Birthday)',
    shortBadge: '👑🎂 Ultah Sultan VIP',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '👑',
    particleEmojis: ['👑', '🎂', '🥂', '💎', '🪙', '✨', '🎉', '🏆'],
    mascotParadeEmojis: ['👑', '🎂', '💎', '🥂', '🏆'],
    trophyTitle: 'GOLDEN SULTAN BIRTHDAY CROWN',
    choreographyLabel: 'Badai Mahkota Emas & Kue Berlian',
    confettiColors: ['#FDE047', '#F59E0B', '#D97706', '#FEF08A', '#FFFFFF'],
    laserColors: ['#FDE047', '#F59E0B', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Perayaan ulang tahun kelas triliuner dengan badai mahkota emas 24K, sampanye kerajaan, dan sorot laser emas.',
    celebrationHeadline: '👑 HAPPY GOLDEN BIRTHDAY SULTAN NUSANTARA!',
    celebrationSubtext: 'Persembahan tertinggi di hari kelahiran Anda dengan kemilau mahkota emas abadi!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '👑',
  },
  {
    id: 'sweet_seventeen_glamour',
    name: 'Sweet Seventeen Glamour Starlight',
    shortBadge: '💖✨ Sweet Seventeen',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '💖',
    particleEmojis: ['💖', '👑', '🌸', '✨', '🎀', '🦋', '🎂', '💎'],
    mascotParadeEmojis: ['👑', '💖', '🦋', '🎀', '🌸'],
    trophyTitle: 'SWEET 17TH STARLIGHT TIARA',
    choreographyLabel: 'Parade Tiara Kristal & Kupu-Kupu Neon',
    confettiColors: ['#EC4899', '#F472B6', '#FBCFE8', '#FDE047', '#FFFFFF'],
    laserColors: ['#EC4899', '#F472B6', '#FDE047'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'festive_party',
    description: 'Pesta glamor Sweet Seventeen dengan tiara berlian, kupu-kupu cahaya, dan hujan kelopak mawar.',
    celebrationHeadline: '💖 HAPPY SWEET SEVENTEEN! SHINE LIKE A STAR!',
    celebrationSubtext: 'Selamat memasuki usia penuh pesona dan impian gemilang bersama Bank Nusantara!',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🎀',
  },
  {
    id: 'anniversary_romantis',
    name: 'Happy Anniversary & Cinta Abadi',
    shortBadge: '💍 Happy Anniversary',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '💍',
    particleEmojis: ['💍', '💖', '🌹', '🥂', '✨', '🕊️', '💝', '🎀'],
    mascotParadeEmojis: ['💍', '🌹', '🕊️', '💖', '🥂'],
    trophyTitle: 'ETERNAL LOVE ANNIVERSARY CHALICE',
    choreographyLabel: 'Pusaran Mawar Merah & Merpati Putih',
    confettiColors: ['#E11D48', '#FB7185', '#FDA4AF', '#FBBF24', '#FFFFFF'],
    laserColors: ['#E11D48', '#FB7185', '#FBBF24'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Perayaan hari jadi penuh kemesraan dengan kelopak mawar merah, cincin berlian, dan harpa romantis.',
    celebrationHeadline: '💍 HAPPY ANNIVERSARY! SELAMAT HARI JADI!',
    celebrationSubtext: 'Semoga ikatan kebahagiaan dan kesetiaan senantiasa abadi sepanjang masa.',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🌹',
  },
  {
    id: 'pernikahan_agung',
    name: 'Pernikahan Agung (Royal Wedding Celebration)',
    shortBadge: '👰🤵 Selamat Menempuh Hidup Baru',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '💒',
    particleEmojis: ['💒', '💍', '🕊️', '💐', '🥂', '💖', '✨', '👑'],
    mascotParadeEmojis: ['💒', '🕊️', '💍', '💐', '👑'],
    trophyTitle: 'ROYAL WEDDING BLESSING CROWN',
    choreographyLabel: 'Parade Merpati Kerajaan & Buket Bunga Emas',
    confettiColors: ['#FBBF24', '#F43F5E', '#FFF1F2', '#FDE047', '#FFFFFF'],
    laserColors: ['#FBBF24', '#F43F5E', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'gentle_harp',
    description: 'Panggung resepsi pernikahan kerajaan dengan merpati putih, lonceng cinta, dan mandala bunga emas.',
    celebrationHeadline: '💒 HAPPY ROYAL WEDDING! SELAMAT BERBAHAGIA!',
    celebrationSubtext: 'Doa terbaik dan hadiah pernikahan istimewa dari Bank Nusantara untuk keluarga baru Anda.',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🕊️',
  },
  {
    id: 'kelahiran_bayi_mulia',
    name: 'Kelahiran Buah Hati (Welcome Baby Blessing)',
    shortBadge: '👶🍼 Selamat Kelahiran Bayi',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '👶',
    particleEmojis: ['👶', '🍼', '🧸', '🎈', '🌟', '💖', '🎠', '✨'],
    mascotParadeEmojis: ['👶', '🧸', '🎠', '🍼', '🎈'],
    trophyTitle: 'MIRACLE NEWBORN STAR MEDAL',
    choreographyLabel: 'Parade Boneka Beruang & Bintang Impian',
    confettiColors: ['#38BDF8', '#F472B6', '#FDE047', '#A7F3D0', '#FFFFFF'],
    laserColors: ['#38BDF8', '#F472B6', '#FDE047'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'gentle_harp',
    description: 'Sambutan hangat kelahiran buah hati dengan balon pastel, boneka beruang, dan bintang keberuntungan.',
    celebrationHeadline: '👶 WELCOME TO THE WORLD! SELAMAT ATAS KELAHIRAN BUAH HATI!',
    celebrationSubtext: 'Semoga tumbuh menjadi anak yang sehat, cerdas, dan membanggakan keluarga!',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '🧸',
  },
  {
    id: 'wisuda_kelulusan',
    name: 'Wisuda & Kelulusan Akbar (Graduation Glory)',
    shortBadge: '🎓 Selamat Wisuda & Lulus',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🎓',
    particleEmojis: ['🎓', '📜', '🏆', '🌟', '🎉', '👏', '✨', '🥇'],
    mascotParadeEmojis: ['🎓', '📜', '🏆', '🥇', '🌟'],
    trophyTitle: 'SUMMA CUM LAUDE HONOR TROPHY',
    choreographyLabel: 'Lemparan Topi Toga & Ijazah Emas',
    confettiColors: ['#FBBF24', '#1E3A8A', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#FBBF24', '#38BDF8', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'royal_fanfare',
    description: 'Selebrasi kelulusan dengan topi toga melayang ke angkasa, gulungan ijazah emas, dan piala kehormatan.',
    celebrationHeadline: '🎓 HAPPY GRADUATION! SELAMAT WISUDA & SUKSES!',
    celebrationSubtext: 'Perjuangan Anda membuahkan hasil gemilang! Selamat menapaki masa depan cemerlang.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🎓',
  },
  {
    id: 'promosi_jabatan_karir',
    name: 'Promosi Jabatan & Puncak Karir',
    shortBadge: '🚀Selamat Promosi Jabatan',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🚀',
    particleEmojis: ['🚀', '💼', '📈', '🏆', '👑', '💰', '✨', '🥂'],
    mascotParadeEmojis: ['🚀', '🏆', '📈', '👑', '💼'],
    trophyTitle: 'EXECUTIVE LEADERSHIP TROPHY',
    choreographyLabel: 'Peluncuran Roket Karir & Grafik Emas',
    confettiColors: ['#10B981', '#FBBF24', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#38BDF8'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'royal_fanfare',
    description: 'Perayaan naik jabatan dan kesuksesan karir dengan roket melesat, grafik naik, dan medali eksekutif.',
    celebrationHeadline: '🚀 CONGRATULATIONS ON YOUR PROMOTION!',
    celebrationSubtext: 'Selamat atas pencapaian jabatan baru! Semoga semakin sukses memimpin dan menginspirasi.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🚀',
  },
  {
    id: 'gajian_bonus_cair',
    name: 'Payday Party! Gajian & THR Bonus Cair',
    shortBadge: '💸 Gajian & Bonus Cair',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '💸',
    particleEmojis: ['💸', '💰', '🪙', '💳', '🤑', '🎉', '✨', '🏦'],
    mascotParadeEmojis: ['💸', '💰', '🤑', '💳', '🪙'],
    trophyTitle: 'MEGA PAYDAY WINDFALL TROPHY',
    choreographyLabel: 'Air Mancur Uang Terbang & Koin Emas',
    confettiColors: ['#10B981', '#34D399', '#FBBF24', '#FDE047', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#34D399'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'festive_party',
    description: 'Ledakan uang kertas bersayap, kantong emas, dan kartu sultan saat gajian atau bonus besar masuk rekening.',
    celebrationHeadline: '💸 PAYDAY JACKPOT! GAJIAN & BONUS SPESIAL CAIR!',
    celebrationSubtext: 'Saldo rekening Anda bertambah deras! Nikmati hasil kerja keras bersama Bank Nusantara.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '💸',
  },
  {
    id: 'rumah_baru_impian',
    name: 'Syukuran Rumah Baru & Istana Impian',
    shortBadge: '🏰 Syukuran Rumah Baru',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🏰',
    particleEmojis: ['🏰', '🔑', '🏡', '🎉', '✨', '🥂', '🪴', '🌟'],
    mascotParadeEmojis: ['🏰', '🔑', '🏡', '🥂', '🌟'],
    trophyTitle: 'GOLDEN MASTER KEY TROPHY',
    choreographyLabel: 'Gerbang Istana & Kunci Emas Berputar',
    confettiColors: ['#F59E0B', '#10B981', '#FDE047', '#FFFFFF'],
    laserColors: ['#F59E0B', '#10B981', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'royal_fanfare',
    description: 'Perayaan kunci emas rumah baru dengan gerbang istana megah dan taburan bintang keberkahan.',
    celebrationHeadline: '🏰 SELAMAT ATAS RUMAH & ISTANA BARU ANDA!',
    celebrationSubtext: 'Semoga hunian baru membawa ketenteraman, kebahagiaan, dan rezeki berlipat ganda.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🔑',
  },
  {
    id: 'pensiun_mulia_bahagia',
    name: 'Masa Pensiun Mulia & Purnabakti',
    shortBadge: '🏅 Selamat Purnabakti',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🏅',
    particleEmojis: ['🏅', '🌴', '☕', '👑', '✨', '💐', '🥂', '🌟'],
    mascotParadeEmojis: ['🏅', '👑', '🌴', '💐', '🥂'],
    trophyTitle: 'LIFETIME DEDICATION GOLD MEDAL',
    choreographyLabel: 'Penghormatan Medali Pengabdian Seumur Hidup',
    confettiColors: ['#FBBF24', '#F59E0B', '#10B981', '#FFFFFF'],
    laserColors: ['#FBBF24', '#10B981', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Penghargaan pengabdian luar biasa dengan medali emas kehormatan dan suasana liburan santai.',
    celebrationHeadline: '🏅 SELAMAT PURNABAKTI & TERIMA KASIH ATAS DEDIKASI ANDA!',
    celebrationSubtext: 'Selamat menikmati masa keemasan bersama keluarga tercinta dengan penuh kebahagiaan.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🏅',
  },
  {
    id: 'sahabat_sejati_vip',
    name: 'Apresiasi Sahabat Sejati & Mitra Terbaik',
    shortBadge: '🤝 Sahabat & Mitra Sejati',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🤝',
    particleEmojis: ['🤝', '🌟', '💎', '🎁', '✨', '💖', '🥂', '🏆'],
    mascotParadeEmojis: ['🤝', '💎', '🏆', '🎁', '🌟'],
    trophyTitle: 'BEST PARTNER & FRIENDSHIP CREST',
    choreographyLabel: 'Jabat Tangan Emas & Bintang Persahabatan',
    confettiColors: ['#38BDF8', '#FBBF24', '#34D399', '#FFFFFF'],
    laserColors: ['#38BDF8', '#FBBF24', '#34D399'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Kejutan persahabatan dan kemitraan abadi dengan piala berlian serta kembang api solidaritas.',
    celebrationHeadline: '🤝 TERIMA KASIH SAHABAT & MITRA TERBAIK!',
    celebrationSubtext: 'Persahabatan dan kepercayaan Anda adalah harta paling berharga bagi kami.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🤝',
  },
  {
    id: 'kejutan_misteri_jackpot',
    name: 'Kejutan Misteri Jackpot Tak Terduga',
    shortBadge: '🎁✨ Kejutan Misteri VIP',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🎁',
    particleEmojis: ['🎁', '❓', '💎', '🎉', '⚡', '🌟', '🪙', '🎊'],
    mascotParadeEmojis: ['🎁', '💎', '⚡', '🪙', '🎊'],
    trophyTitle: 'MYSTERY SURPRISE GRAND BOX',
    choreographyLabel: 'Ledakan Kotak Kejutan Hologram Berlapis',
    confettiColors: ['#A855F7', '#EC4899', '#FBBF24', '#22D3EE', '#FFFFFF'],
    laserColors: ['#A855F7', '#EC4899', '#FBBF24'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Portal kotak kejutan misteri yang meledak menjadi berlian, bintang kosmik, dan koin keberuntungan.',
    celebrationHeadline: '🎁 SURPRISE DROP! KEJUTAN MISTERI KHUSUS UNTUK ANDA!',
    celebrationSubtext: 'Anda terpilih menerima paket kejutan spesial dengan efek kemeriahan 100.000x!',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🎁',
  },
  {
    id: 'hari_jadi_bank_nusantara',
    name: 'Dirgahayu HUT Bank Nusantara Royal Gala',
    shortBadge: '🏦👑 HUT Bank Nusantara',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial & Ultah',
    primaryEmoji: '🏦',
    particleEmojis: ['🏦', '👑', '🪙', '💎', '🎉', '🎆', '🏆', '✨'],
    mascotParadeEmojis: ['🏦', '👑', '🏆', '💎', '🎆'],
    trophyTitle: 'BANK NUSANTARA ROYAL ANNIVERSARY CREST',
    choreographyLabel: 'Parade Mahkota Perbankan & Kembang Api Emas',
    confettiColors: ['#FBBF24', '#38BDF8', '#10B981', '#FDE047', '#FFFFFF'],
    laserColors: ['#FBBF24', '#38BDF8', '#10B981'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Gala perayaan ulang tahun Bank Nusantara dengan lambang mahkota emas dan hujan dividen nasabah.',
    celebrationHeadline: '🏦 DIRGAHAYU BANK NUSANTARA! TERIMA KASIH NASABAH SETIA!',
    celebrationSubtext: 'Merayakan kejayaan finansial bersama seluruh nasabah kehormatan Bank Nusantara!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🏦',
  },

  // ============================================================================
  // 2. NASIONAL & KEMERDEKAAN RI (12 EFEK)
  // ============================================================================
  {
    id: 'kemerdekaan_ri_17_agustus',
    name: 'HUT Kemerdekaan RI 17 Agustus (Merah Putih 100.000x)',
    shortBadge: '🇮🇩 Dirgahayu RI 17 Agustus',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🇮🇩',
    particleEmojis: ['🇮🇩', '🦅', '🔴', '⚪', '🎆', '🏆', '🎖️', '✨'],
    mascotParadeEmojis: ['🇮🇩', '🦅', '🎖️', '🎆', '🏆'],
    trophyTitle: 'DIRGAHAYU REPUBLIK INDONESIA 17 AGUSTUS',
    choreographyLabel: 'Salvo Meriam Merah Putih & Formasi Garuda Emas',
    confettiColors: ['#DC2626', '#EF4444', '#FFFFFF', '#F8FAFC', '#FBBF24'],
    laserColors: ['#DC2626', '#FFFFFF', '#FBBF24'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Salvo meriam kehormatan Merah Putih, formasi Garuda terbang megah, laser dwiwarna, dan gegap gempita 17 Agustus.',
    celebrationHeadline: '🇮🇩 DIRGAHAYU REPUBLIK INDONESIA! MERDEKA 100.000X!',
    celebrationSubtext: 'Jayalah Indonesiaku! Semangat kemerdekaan 17 Agustus berkibar megah di seluruh Nusantara!',
    theme: 'rose',
    paletteStyle: 'red_white',
    cornerOrnamentSymbol: '🇮🇩',
  },
  {
    id: 'garuda_pancasila_sakti',
    name: 'Garuda Pancasila Emas & Bhinneka Tunggal Ika',
    shortBadge: '🦅🇮🇩 Garuda Pancasila',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🦅',
    particleEmojis: ['🦅', '🇮🇩', '🛡️', '⭐', '🌾', '⛓️', '🏆', '✨'],
    mascotParadeEmojis: ['🦅', '🛡️', '🇮🇩', '⭐', '🏆'],
    trophyTitle: 'GARUDA PANCASILA GOLDEN SHIELD',
    choreographyLabel: 'Kepak Sayap Garuda Emas & Perisai Bintang',
    confettiColors: ['#FBBF24', '#DC2626', '#FFFFFF', '#D97706'],
    laserColors: ['#FBBF24', '#DC2626', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Kemegahan kepak sayap Garuda emas dengan perisai bintang, padi kapas, dan sinar merah putih.',
    celebrationHeadline: '🦅 BHINNEKA TUNGGAL IKA • GARUDA PANCASILA JAYA!',
    celebrationSubtext: 'Persatuan dan kejayaan bangsa Indonesia dalam balutan emas kebanggaan nasional.',
    theme: 'amber',
    paletteStyle: 'crimson_gold',
    cornerOrnamentSymbol: '🦅',
  },
  {
    id: 'hari_pahlawan_10_november',
    name: 'Hari Pahlawan Nasional (10 November Heroic Salute)',
    shortBadge: '🎖️🇮🇩 Hari Pahlawan',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🎖️',
    particleEmojis: ['🎖️', '🇮🇩', '🔥', '🦅', '⚔️', '🌟', '🏆', '✨'],
    mascotParadeEmojis: ['🎖️', '🇮🇩', '🔥', '🦅', '🏆'],
    trophyTitle: 'PAHLAWAN NASIONAL VALOR MEDAL',
    choreographyLabel: 'Obor Semangat Perjuangan & Bintang Jasa',
    confettiColors: ['#DC2626', '#F59E0B', '#FFFFFF', '#B91C1C'],
    laserColors: ['#DC2626', '#F59E0B', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Penghormatan pahlawan bangsa dengan bintang jasa emas, obor perjuangan, dan salvo kehormatan.',
    celebrationHeadline: '🎖️ SELAMAT HARI PAHLAWAN NASIONAL! KOBARKAN SEMANGAT!',
    celebrationSubtext: 'Bangsa yang besar adalah bangsa yang menghormati jasa para pahlawannya!',
    theme: 'rose',
    paletteStyle: 'red_white',
    cornerOrnamentSymbol: '🎖️',
  },
  {
    id: 'hari_sumpah_pemuda',
    name: 'Hari Sumpah Pemuda (28 Oktober Nusantara Bersatu)',
    shortBadge: '✊🇮🇩 Sumpah Pemuda',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '✊',
    particleEmojis: ['✊', '🇮🇩', '🔥', '🦅', '🌟', '⚡', '🎉', '🏆'],
    mascotParadeEmojis: ['✊', '🇮🇩', '🔥', '⚡', '🦅'],
    trophyTitle: 'SUMPAH PEMUDA UNITY TORCH',
    choreographyLabel: 'Gelombang Energi Pemuda & Api Persatuan',
    confettiColors: ['#EF4444', '#FFFFFF', '#FBBF24', '#38BDF8'],
    laserColors: ['#EF4444', '#FFFFFF', '#FBBF24'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Semangat membara Sumpah Pemuda Satu Nusa, Satu Bangsa, Satu Bahasa Indonesia.',
    celebrationHeadline: '✊ SELAMAT HARI SUMPAH PEMUDA! BERSATU KITA TEGUH!',
    celebrationSubtext: 'Satu Tanah Air, Satu Bangsa, dan Satu Bahasa: Indonesia Jaya!',
    theme: 'rose',
    paletteStyle: 'red_white',
    cornerOrnamentSymbol: '✊',
  },
  {
    id: 'hari_batik_nasional',
    name: 'Hari Batik & Pusaka Budaya Nusantara',
    shortBadge: '👑✨ Hari Batik Nasional',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '👘',
    particleEmojis: ['👘', '👑', '🌺', '✨', '🪙', '🎭', '🇮🇩', '🌟'],
    mascotParadeEmojis: ['👘', '👑', '🎭', '🌺', '🪙'],
    trophyTitle: 'WARISAN BUDAYA BATIK ROYAL CREST',
    choreographyLabel: 'Mandala Motif Batik Emas & Mahkota Nusantara',
    confettiColors: ['#D97706', '#FBBF24', '#78350F', '#FDE047', '#FFFFFF'],
    laserColors: ['#FBBF24', '#D97706', '#FEF08A'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'royal_fanfare',
    description: 'Keanggunan mandala batik sogan emas dan mahkota budaya warisan dunia Nusantara.',
    celebrationHeadline: '👘 SELAMAT HARI BATIK & WARISAN BUDAYA NUSANTARA!',
    celebrationSubtext: 'Bangga melestarikan mahakarya budaya bangsa Indonesia yang mendunia.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🌺',
  },
  {
    id: 'hari_kartini_emansipasi',
    name: 'Hari Kartini (Habis Gelap Terbitlah Terang)',
    shortBadge: '🌺👑 Hari Kartini',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🌺',
    particleEmojis: ['🌺', '👑', '📖', '✨', '🌸', '🕊️', '💖', '🌟'],
    mascotParadeEmojis: ['🌺', '👑', '📖', '🌸', '🌟'],
    trophyTitle: 'CAHAYA INSPIRASI KARTINI MEDAL',
    choreographyLabel: 'Sinar Fajar Terang & Kelopak Melati Nusantara',
    confettiColors: ['#F43F5E', '#FBBF24', '#FDA4AF', '#FFFFFF'],
    laserColors: ['#F43F5E', '#FBBF24', '#FFFFFF'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Cahaya fajar keemasan dan taburan bunga melati serta anggrek untuk perempuan tangguh Indonesia.',
    celebrationHeadline: '🌺 SELAMAT HARI KARTINI! HABIS GELAP TERBITLAH TERANG!',
    celebrationSubtext: 'Mengapresiasi karya, ketangguhan, dan cahaya inspirasi perempuan Indonesia.',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🌺',
  },
  {
    id: 'hari_pendidikan_nasional',
    name: 'Hari Pendidikan Nasional (Tut Wuri Handayani)',
    shortBadge: '📚🌟 Hari Pendidikan Nasional',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '📚',
    particleEmojis: ['📚', '🎓', '💡', '🌟', '🇮🇩', '🖋️', '🏆', '✨'],
    mascotParadeEmojis: ['📚', '🎓', '💡', '🖋️', '🏆'],
    trophyTitle: 'LENTERA ILMU PENDIDIKAN TROPHY',
    choreographyLabel: 'Lentera Cendekia & Pena Emas',
    confettiColors: ['#38BDF8', '#FBBF24', '#1D4ED8', '#FFFFFF'],
    laserColors: ['#38BDF8', '#FBBF24', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'royal_fanfare',
    description: 'Cahaya obor ilmu pengetahuan, buku emas, dan bintang cendekia kebanggaan bangsa.',
    celebrationHeadline: '📚 SELAMAT HARI PENDIDIKAN NASIONAL! CERDASKAN BANGSA!',
    celebrationSubtext: 'Ing Ngarsa Sung Tuladha, Ing Madya Mangun Karsa, Tut Wuri Handayani.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '📚',
  },
  {
    id: 'hari_kebangkitan_nasional',
    name: 'Hari Kebangkitan Nasional (20 Mei Bangkit Bersama)',
    shortBadge: '🌅🇮🇩 Kebangkitan Nasional',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🌅',
    particleEmojis: ['🌅', '🇮🇩', '🦅', '🔥', '🌟', '🚀', '🏆', '✨'],
    mascotParadeEmojis: ['🌅', '🇮🇩', '🦅', '🚀', '🏆'],
    trophyTitle: 'KEBANGKITAN NUSANTARA RISING SUN',
    choreographyLabel: 'Surya Terbit Emas & Salvo Merah Putih',
    confettiColors: ['#DC2626', '#FBBF24', '#FFFFFF', '#F59E0B'],
    laserColors: ['#DC2626', '#FBBF24', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Matahari terbit keemasan diiringi kibaran Merah Putih dan semangat kebangkitan ekonomi bangsa.',
    celebrationHeadline: '🌅 SELAMAT HARI KEBANGKITAN NASIONAL! BANGKIT & MAJU!',
    celebrationSubtext: 'Bersama Bank Nusantara kita wujudkan kemandirian dan kejayaan bangsa.',
    theme: 'amber',
    paletteStyle: 'red_white',
    cornerOrnamentSymbol: '🌅',
  },
  {
    id: 'hari_nusantara_maritim',
    name: 'Hari Nusantara & Kejayaan Maritim Indonesia',
    shortBadge: '⛵🇮🇩 Hari Nusantara',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '⛵',
    particleEmojis: ['⛵', '🌊', '🇮🇩', '🧭', '🐬', '🌟', '⚓', '✨'],
    mascotParadeEmojis: ['⛵', '🌊', '🧭', '⚓', '🇮🇩'],
    trophyTitle: 'KAPAL PHINISI EMAS NUSANTARA',
    choreographyLabel: 'Layar Phinisi Emas & Gelombang Samudra Biru',
    confettiColors: ['#0284C7', '#38BDF8', '#FBBF24', '#FFFFFF'],
    laserColors: ['#38BDF8', '#FBBF24', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'patriot_march',
    description: 'Pelayaran kapal Phinisi emas melintasi samudra zamrud khatulistiwa dari Sabang sampai Merauke.',
    celebrationHeadline: '⛵ SELAMAT HARI NUSANTARA! JALESVEVA JAYAMAHE!',
    celebrationSubtext: 'Dari Sabang sampai Merauke, dari Miangas sampai Pulau Rote, satu Nusantara Jaya!',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '⚓',
  },
  {
    id: 'hari_lahir_pancasila',
    name: 'Hari Lahir Pancasila (1 Juni Sakral & Megah)',
    shortBadge: '🛡️🇮🇩 Hari Lahir Pancasila',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🛡️',
    particleEmojis: ['🛡️', '🦅', '⭐', '🇮🇩', '🌾', '🌟', '🏆', '✨'],
    mascotParadeEmojis: ['🛡️', '🦅', '⭐', '🇮🇩', '🏆'],
    trophyTitle: 'PANCASILA DASAR NEGARA CREST',
    choreographyLabel: 'Cahaya Bintang Emas & Salvo Garuda',
    confettiColors: ['#DC2626', '#FBBF24', '#FFFFFF', '#FDE047'],
    laserColors: ['#DC2626', '#FBBF24', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Sinar lima sila Pancasila yang memancar dari perisai Garuda Emas di tengah panggung merah putih.',
    celebrationHeadline: '🛡️ SELAMAT HARI LAHIR PANCASILA 1 JUNI!',
    celebrationSubtext: 'Pancasila pemersatu bangsa menuju Indonesia Emas yang adil dan makmur.',
    theme: 'rose',
    paletteStyle: 'red_white',
    cornerOrnamentSymbol: '🛡️',
  },
  {
    id: 'hari_tni_bhayangkara',
    name: 'Dirgahayu Pengawal Negeri (Patriot Defend Stage)',
    shortBadge: '🎖️🛡️ Patriot Nusantara',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🎖️',
    particleEmojis: ['🎖️', '🛡️', '🇮🇩', '🦅', '⭐', '🚁', '🎆', '✨'],
    mascotParadeEmojis: ['🎖️', '🛡️', '🦅', '🚁', '🇮🇩'],
    trophyTitle: 'PATRIOT GUARDIAN OF NUSANTARA',
    choreographyLabel: 'Formasi Udara & Bintang Kehormatan',
    confettiColors: ['#DC2626', '#15803D', '#FBBF24', '#FFFFFF'],
    laserColors: ['#DC2626', '#FBBF24', '#10B981'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'patriot_march',
    description: 'Formasi kehormatan dirgantara dan bintang patriot penjaga kedaulatan Nusantara.',
    celebrationHeadline: '🎖️ DIRGAHAYU PENGAWAL KEDAULATAN NUSANTARA!',
    celebrationSubtext: 'Penghormatan setinggi-tingginya atas pengabdian menjaga keamanan dan keutuhan negeri.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🎖️',
  },
  {
    id: 'indonesia_emas_2045',
    name: 'Visi Indonesia Emas 2045 (Nusantara Superpower)',
    shortBadge: '🌟🇮🇩 Indonesia Emas 2045',
    category: 'nasional_ri',
    categoryLabel: 'Nasional & Kemerdekaan RI',
    primaryEmoji: '🌟',
    particleEmojis: ['🌟', '🇮🇩', '🦅', '👑', '🚀', '💎', '🪙', '✨'],
    mascotParadeEmojis: ['🦅', '🇮🇩', '🚀', '👑', '💎'],
    trophyTitle: 'INDONESIA EMAS 2045 CENTENNIAL TROPHY',
    choreographyLabel: 'Badai Emas Merah Putih & Roket Masa Depan',
    confettiColors: ['#FDE047', '#F59E0B', '#DC2626', '#FFFFFF'],
    laserColors: ['#FDE047', '#DC2626', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'patriot_march',
    description: 'Perpaduan kemegahan Merah Putih dan badai emas masa depan menuju 100 tahun Indonesia merdeka.',
    celebrationHeadline: '🌟 MENUJU INDONESIA EMAS 2045 • NUSANTARA MENDUNIA!',
    celebrationSubtext: 'Bersama membangun masa depan ekonomi digital Indonesia yang gemilang!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🌟',
  },

  // ============================================================================
  // 3. HARI RAYA & PERAYAAN BESAR KEAGAMAAN (14 EFEK)
  // ============================================================================
  {
    id: 'idul_fitri_lebaran',
    name: 'Hari Raya Idul Fitri (Lebaran Ketupat & Bedug Akbar)',
    shortBadge: '🕌 Selamat Idul Fitri',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🕌',
    particleEmojis: ['🕌', '🌙', '✨', '💚', '⭐', '🏮', '🤝', '🎁'],
    mascotParadeEmojis: ['🕌', '🌙', '🏮', '✨', '🎁'],
    trophyTitle: 'IDUL FITRI MUBARAK ROYAL CRESCENT',
    choreographyLabel: 'Mandala Bulan Sabit Zamrud & Lentera Ketupat',
    confettiColors: ['#10B981', '#34D399', '#FBBF24', '#FEF08A', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#34D399'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Cahaya kubah masjid zamrud, mandala ketupat lebaran, bulan sabit emas, dan lentera kemenangan.',
    celebrationHeadline: '🕌 SELAMAT HARI RAYA IDUL FITRI • MOHON MAAF LAHIR & BATIN',
    celebrationSubtext: 'Taqabbalallahu Minna Wa Minkum. Semoga berkah kemenangan dan THR berlimpah menyertai Anda!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🌙',
  },
  {
    id: 'ramadhan_mubarak',
    name: 'Marhaban Ya Ramadhan (Bulan Suci Penuh Berkah)',
    shortBadge: '🌙 Ramadhan Mubarak',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🌙',
    particleEmojis: ['🌙', '🕌', '🏮', '✨', '⭐', '📿', '🌴', '💚'],
    mascotParadeEmojis: ['🌙', '🏮', '🕌', '⭐', '🌴'],
    trophyTitle: 'RAMADHAN KAREEM LANTERN OF BLESSING',
    choreographyLabel: 'Lentera Fanous Melayang & Bintang Malam Suci',
    confettiColors: ['#059669', '#10B981', '#FBBF24', '#FDE047', '#ECFDF5'],
    laserColors: ['#10B981', '#FBBF24', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Lentera Ramadhan emas yang naik perlahan ke langit malam bertabur bintang dan bulan sabit.',
    celebrationHeadline: '🌙 MARHABAN YA RAMADHAN • BULAN SUCI PENUH BERKAH',
    celebrationSubtext: 'Selamat menjalankan ibadah di bulan suci Ramadhan bersama berkah Bank Nusantara.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🏮',
  },
  {
    id: 'malam_takbiran_akbar',
    name: 'Gema Malam Takbiran & Kembang Api Kemenangan',
    shortBadge: '🥁🕌 Malam Takbiran',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🥁',
    particleEmojis: ['🥁', '🕌', '🎆', '🌙', '🏮', '✨', '🎇', '⭐'],
    mascotParadeEmojis: ['🥁', '🕌', '🎆', '🏮', '🌙'],
    trophyTitle: 'GEMA TAKBIR VICTORY LANTERN',
    choreographyLabel: 'Pawai Obor Lentera & Kembang Api Zamrud',
    confettiColors: ['#10B981', '#FBBF24', '#38BDF8', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'sacred_chime',
    description: 'Meriahnya pawai obor malam takbiran, tabuhan bedug kemenangan, dan kembang api langit malam.',
    celebrationHeadline: '🥁 GEMA MALAM TAKBIRAN • MENYAMBUT HARI KEMENANGAN!',
    celebrationSubtext: 'Kebahagiaan malam kemenangan menyinari seluruh penjuru Nusantara!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🥁',
  },
  {
    id: 'idul_adha_berkah',
    name: 'Hari Raya Idul Adha (Lebaran Haji & Keikhlasan)',
    shortBadge: '🕋 Selamat Idul Adha',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🕋',
    particleEmojis: ['🕋', '🌙', '✨', '🕌', '⭐', '💚', '🤲', '🌟'],
    mascotParadeEmojis: ['🕋', '🕌', '🌙', '⭐', '🌟'],
    trophyTitle: 'EID AL-ADHA BLESSING CREST',
    choreographyLabel: 'Mandala Cahaya Suci & Bintang Emas',
    confettiColors: ['#10B981', '#F59E0B', '#FBBF24', '#FFFFFF'],
    laserColors: ['#F59E0B', '#10B981', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Kemuliaan Idul Adha dengan cahaya emas berkilau, lentera suci, dan ketulusan berbagi.',
    celebrationHeadline: '🕋 SELAMAT HARI RAYA IDUL ADHA • PENUH KEBERKAHAN',
    celebrationSubtext: 'Semoga keikhlasan dan kebaikan membawa keberkahan berlipat ganda.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🕋',
  },
  {
    id: 'tahun_baru_islam_hijriah',
    name: 'Tahun Baru Islam 1 Muharram (Hijriah Mubarak)',
    shortBadge: '🌙✨ Tahun Baru Hijriah',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🕌',
    particleEmojis: ['🕌', '🌙', '⭐', '✨', '🏮', '📿', '🌟', '💚'],
    mascotParadeEmojis: ['🌙', '🕌', '⭐', '🏮', '🌟'],
    trophyTitle: '1 MUHARRAM HIJRIAH NEW DAWN',
    choreographyLabel: 'Cahaya Hijrah & Bulan Sabit Kembar',
    confettiColors: ['#10B981', '#FBBF24', '#38BDF8', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#38BDF8'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Fajar tahun baru Hijriah dengan cahaya bulan sabit emas dan bintang keberkahan.',
    celebrationHeadline: '🌙 SELAMAT TAHUN BARU ISLAM 1 MUHARRAM!',
    celebrationSubtext: 'Mari berhijrah menuju pribadi dan masa depan yang lebih baik serta penuh berkah.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🌙',
  },
  {
    id: 'maulid_nabi_cahaya',
    name: 'Peringatan Maulid & Cahaya Selawat',
    shortBadge: '🕌💚 Cahaya Maulid',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🏮',
    particleEmojis: ['🏮', '🕌', '🌙', '🌹', '✨', '⭐', '💚', '🌟'],
    mascotParadeEmojis: ['🏮', '🕌', '🌹', '🌙', '⭐'],
    trophyTitle: 'LIGHT OF COMPASSION LANTERN',
    choreographyLabel: 'Lentera Zamrud & Kelopak Mawar Cahaya',
    confettiColors: ['#10B981', '#34D399', '#FBBF24', '#FFFFFF'],
    laserColors: ['#10B981', '#34D399', '#FBBF24'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Keteduhan cahaya zamrud, lentera selawat, dan mawar emas yang menenangkan hati.',
    celebrationHeadline: '🏮 CAHAYA BERKAH & KETELADANAN MULIA',
    celebrationSubtext: 'Semoga kedamaian, kasih sayang, dan keberkahan senantiasa melingkupi kita.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🏮',
  },
  {
    id: 'christmas_wonderland',
    name: 'Hari Raya Natal (Merry Christmas Winter Wonderland)',
    shortBadge: '🎄 Merry Christmas',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🎄',
    particleEmojis: ['🎄', '🎅', '❄️', '⛄', '🦌', '🔔', '🎁', '🌟'],
    mascotParadeEmojis: ['🎅', '🦌', '🎄', '⛄', '🎁'],
    trophyTitle: 'MERRY CHRISTMAS GOLDEN STAR',
    choreographyLabel: 'Kereta Sinterklas, Lonceng Emas & Badai Salju Berlian',
    confettiColors: ['#DC2626', '#16A34A', '#FBBF24', '#FFFFFF', '#BAE6FD'],
    laserColors: ['#DC2626', '#16A34A', '#FBBF24'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Parade kereta Sinterklas & rusa kutub, pohon Natal berkilau, lonceng emas, dan butiran salju kristal.',
    celebrationHeadline: '🎄 MERRY CHRISTMAS & HAPPY HOLIDAYS 100.000X!',
    celebrationSubtext: 'Damai, sukacita, dan kehangatan Natal menyertai Anda beserta seluruh keluarga tercinta!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🎄',
  },
  {
    id: 'malam_natal_bintang_timur',
    name: 'Malam Natal Kudus (Silent Night Star of Bethlehem)',
    shortBadge: '🌟🕯️ Malam Natal Kudus',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🌟',
    particleEmojis: ['🌟', '🕯️', '🔔', '❄️', '🎄', '🕊️', '✨', '🎁'],
    mascotParadeEmojis: ['🌟', '🕯️', '🕊️', '🔔', '🎄'],
    trophyTitle: 'STARLIGHT OF CHRISTMAS EVE',
    choreographyLabel: 'Bintang Timur Bersinar & Lilin Kedamaian',
    confettiColors: ['#FDE047', '#38BDF8', '#FFFFFF', '#16A34A'],
    laserColors: ['#FDE047', '#38BDF8', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'gentle_harp',
    description: 'Bintang kejora keemasan di langit biru malam Natal dengan lilin hangat dan merpati damai.',
    celebrationHeadline: '🌟 DAMAI MALAM NATAL MENYINARI HATI!',
    celebrationSubtext: 'Semoga terang kasih dan pengharapan baru senantiasa memberkati hidup Anda.',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '🕯️',
  },
  {
    id: 'tahun_baru_fireworks',
    name: 'Tahun Baru Masehi (Happy New Year Grand Fireworks)',
    shortBadge: '🎆 Selamat Tahun Baru',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🎆',
    particleEmojis: ['🎆', '🎇', '🥂', '🍾', '🎉', '✨', '🌟', '🎊'],
    mascotParadeEmojis: ['🎆', '🍾', '🥂', '🎇', '🎊'],
    trophyTitle: 'HAPPY NEW YEAR GRAND COUNTDOWN CUP',
    choreographyLabel: 'Ledakan Kembang Api 360° & Pesta Sampanye',
    confettiColors: ['#FBBF24', '#38BDF8', '#F43F5E', '#A855F7', '#34D399', '#FFFFFF'],
    laserColors: ['#FBBF24', '#38BDF8', '#F43F5E'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Pesta hitung mundur Tahun Baru dengan rentetan kembang api langit malam dan laser warna-warni.',
    celebrationHeadline: '🎆 HAPPY NEW YEAR! SELAMAT TAHUN BARU PENUH KESUKSESAN!',
    celebrationSubtext: 'Sambut lembaran tahun yang baru dengan semangat, harapan, dan keberuntungan spektakuler!',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🎆',
  },
  {
    id: 'imlek_lunar_new_year',
    name: 'Tahun Baru Imlek (Gong Xi Fa Cai Golden Dragon)',
    shortBadge: '🧧 Gong Xi Fa Cai • Imlek',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🧧',
    particleEmojis: ['🧧', '🐉', '🏮', '🪙', '🍊', '🧨', '✨', '🦁'],
    mascotParadeEmojis: ['🐉', '🦁', '🧧', '🏮', '🪙'],
    trophyTitle: 'GOLDEN IMPERIAL DRAGON HOKI',
    choreographyLabel: 'Parade Naga Emas Meliuk, Barongsai & Hujan Angpao',
    confettiColors: ['#DC2626', '#EF4444', '#FBBF24', '#FDE047', '#F59E0B'],
    laserColors: ['#DC2626', '#FBBF24', '#FDE047'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'royal_fanfare',
    description: 'Tarian Naga Emas raksasa yang meliuk melintasi layar, lampion merah, petasan, dan hujan angpao keberuntungan.',
    celebrationHeadline: '🧧 GONG XI FA CAI! XIN NIAN KUAI LE 100.000X!',
    celebrationSubtext: 'Semoga tahun ini membawa kemakmuran, kesehatan, dan hoki berlimpah ruah!',
    theme: 'rose',
    paletteStyle: 'crimson_gold',
    cornerOrnamentSymbol: '🏮',
  },
  {
    id: 'cap_go_meh_barongsai',
    name: 'Festival Cap Go Meh & Atraksi Barongsai Naga',
    shortBadge: '🦁🏮 Festival Cap Go Meh',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🦁',
    particleEmojis: ['🦁', '🐉', '🏮', '🧨', '🧧', '🌕', '🪙', '✨'],
    mascotParadeEmojis: ['🦁', '🐉', '🏮', '🧨', '🧧'],
    trophyTitle: 'CAP GO MEH LION DANCE TROPHY',
    choreographyLabel: 'Lompatan Barongsai & Seribu Lampion Purnama',
    confettiColors: ['#EF4444', '#FBBF24', '#F97316', '#FFFFFF'],
    laserColors: ['#EF4444', '#FBBF24', '#F97316'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'festive_party',
    description: 'Kemeriahan malam purnama ke-15 dengan lompatan Barongsai, naga cahaya, dan seribu lampion terbang.',
    celebrationHeadline: '🦁 SELAMAT MERAYAKAN FESTIVAL CAP GO MEH!',
    celebrationSubtext: 'Cahaya purnama membawa keharmonisan, keberuntungan, dan sukacita bagi kita semua.',
    theme: 'amber',
    paletteStyle: 'crimson_gold',
    cornerOrnamentSymbol: '🦁',
  },
  {
    id: 'hari_raya_waisak',
    name: 'Hari Raya Tri Suci Waisak (Seribu Lampion Teratai)',
    shortBadge: '🪷 Selamat Hari Raya Waisak',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🪷',
    particleEmojis: ['🪷', '🏮', '✨', '🌕', '🕊️', '🌟', '💛', '🕯️'],
    mascotParadeEmojis: ['🪷', '🏮', '🕊️', '🌕', '🕯️'],
    trophyTitle: 'VESAK GOLDEN LOTUS ENLIGHTENMENT',
    choreographyLabel: 'Teratai Emas Mekar & Pelepasan 1.000 Lampion Langit',
    confettiColors: ['#FBBF24', '#FDE047', '#F59E0B', '#FEF08A', '#FFFFFF'],
    laserColors: ['#FBBF24', '#FDE047', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Pelepasan ribuan lampion terbang Borobudur dan mekarnya bunga teratai emas di bawah bulan purnama.',
    celebrationHeadline: '🪷 SELAMAT HARI RAYA TRI SUCI WAISAK',
    celebrationSubtext: 'Sabbe Satta Bhavantu Sukhitatta. Semoga semua makhluk hidup berbahagia dan damai.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🪷',
  },
  {
    id: 'hari_raya_nyepi',
    name: 'Hari Raya Nyepi & Tahun Baru Saka (Dharma Santi)',
    shortBadge: '🌺 Selamat Hari Raya Nyepi',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🌺',
    particleEmojis: ['🌺', '✨', '🌙', '⭐', '🕊️', '🌿', '💛', '🌟'],
    mascotParadeEmojis: ['🌺', '🕊️', '🌙', '🌿', '⭐'],
    trophyTitle: 'TAHUN BARU SAKA DHARMA MANDALA',
    choreographyLabel: 'Mandala Bunga Jepun Bali & Bintang Langit Hening',
    confettiColors: ['#FBBF24', '#10B981', '#38BDF8', '#FFFFFF'],
    laserColors: ['#FBBF24', '#10B981', '#38BDF8'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Harmoni bunga jepun Bali, mandala alam semesta, dan langit bertabur bintang yang hening nan agung.',
    celebrationHeadline: '🌺 SELAMAT HARI RAYA NYEPI • TAHUN BARU SAKA',
    celebrationSubtext: 'Semoga keheningan dan kesucian membawa kedamaian serta keseimbangan alam semesta.',
    theme: 'amber',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🌺',
  },
  {
    id: 'deepavali_festival_cahaya',
    name: 'Deepavali / Diwali (Festival Seribu Pelita Cahaya)',
    shortBadge: '🪔 Happy Deepavali',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya & Keagamaan',
    primaryEmoji: '🪔',
    particleEmojis: ['🪔', '✨', '🎆', '🪷', '🌟', '🪙', '🎇', '🌺'],
    mascotParadeEmojis: ['🪔', '🪷', '🎆', '🪙', '🌺'],
    trophyTitle: 'DEEPAVALI FESTIVAL OF LIGHTS DIYA',
    choreographyLabel: 'Mandala Rangoli Pelita Emas & Kembang Api',
    confettiColors: ['#F59E0B', '#EC4899', '#A855F7', '#FDE047', '#EF4444'],
    laserColors: ['#F59E0B', '#EC4899', '#A855F7'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'sacred_chime',
    description: 'Pelita diya emas yang menyala di atas mandala rangoli warna-warni dan kembang api kemenangan cahaya.',
    celebrationHeadline: '🪔 HAPPY DEEPAVALI • FESTIVAL CAHAYA KEMENANGAN!',
    celebrationSubtext: 'Semoga terang kebaikan dan kesejahteraan senantiasa menyinari langkah Anda.',
    theme: 'amber',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🪔',
  },

  // ============================================================================
  // 4. MUSIM & FESTIVAL DUNIA (12 EFEK)
  // ============================================================================
  {
    id: 'musim_semi_sakura',
    name: 'Musim Semi Bunga Sakura (Cherry Blossom Breeze)',
    shortBadge: '🌸 Musim Semi Sakura',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🌸',
    particleEmojis: ['🌸', '🌺', '🦋', '✨', '🌷', '🍃', '💖', '🎀'],
    mascotParadeEmojis: ['🌸', '🦋', '🌺', '🌷', '🎀'],
    trophyTitle: 'IMPERIAL SAKURA BLOSSOM CREST',
    choreographyLabel: 'Badai Kelopak Sakura Melayang & Kupu-Kupu Cahaya',
    confettiColors: ['#F472B6', '#FBCFE8', '#FB7185', '#FEF08A', '#FFFFFF'],
    laserColors: ['#F472B6', '#FBCFE8', '#FEF08A'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Tiupan angin musim semi yang menerbangkan ribuan kelopak bunga sakura merah muda dan kupu-kupu.',
    celebrationHeadline: '🌸 KEINDAHAN MUSIM SEMI SAKURA UNTUK ANDA!',
    celebrationSubtext: 'Harum dan pesona bunga sakura mengiringi hadiah spesial Anda hari ini.',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🌸',
  },
  {
    id: 'musim_dingin_salju',
    name: 'Keajaiban Salju Musim Dingin (Frozen Crystal Snowfall)',
    shortBadge: '❄️ Salju Musim Dingin',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '❄️',
    particleEmojis: ['❄️', '⛄', '🌨️', '✨', '💎', '🌬️', '🦌', '🌟'],
    mascotParadeEmojis: ['❄️', '⛄', '🦌', '💎', '🌨️'],
    trophyTitle: 'FROZEN DIAMOND SNOWFLAKE CROWN',
    choreographyLabel: 'Pusaran Kristal Es Berlian & Salju Lembut',
    confettiColors: ['#38BDF8', '#BAE6FD', '#E0F2FE', '#FFFFFF', '#818CF8'],
    laserColors: ['#38BDF8', '#BAE6FD', '#FFFFFF'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Butiran kristal es berlian yang turun lembut diiringi kilau biru langit musim dingin.',
    celebrationHeadline: '❄️ WINTER WONDERLAND • KEAJAIBAN MUSIM DINGIN!',
    celebrationSubtext: 'Kesejukan kristal salju dan kemilau berlian es mempercantik kiriman Anda.',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '❄️',
  },
  {
    id: 'musim_panas_tropis',
    name: 'Pesta Musim Panas Pantai Tropis (Tropical Summer Vibes)',
    shortBadge: '🌴☀️ Musim Panas Tropis',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🌴',
    particleEmojis: ['🌴', '☀️', '🌊', '🌺', '🍹', '🐬', '🐚', '✨'],
    mascotParadeEmojis: ['🌴', '☀️', '🐬', '🌊', '🍹'],
    trophyTitle: 'TROPICAL PARADISE GOLDEN SUN',
    choreographyLabel: 'Gelombang Samudra Biru & Lumba-Lumba Emas',
    confettiColors: ['#FBBF24', '#38BDF8', '#10B981', '#F43F5E', '#FFFFFF'],
    laserColors: ['#FBBF24', '#38BDF8', '#10B981'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Sinar matahari pantai tropis Bali & Raja Ampat dengan lumba-lumba melompat dan bunga sepatu.',
    celebrationHeadline: '🌴 TROPICAL SUMMER PARADISE • LIBURAN SULTAN!',
    celebrationSubtext: 'Nikmati suasana cerah pantai tropis dan hadiah menyegarkan di rekening Anda!',
    theme: 'amber',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🌴',
  },
  {
    id: 'musim_gugur_maple',
    name: 'Musim Gugur Daun Maple Emas (Golden Autumn Leaves)',
    shortBadge: '🍁 Musim Gugur Maple',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🍁',
    particleEmojis: ['🍁', '🍂', '🌾', '✨', '☕', '🎃', '🌕', '🌟'],
    mascotParadeEmojis: ['🍁', '🍂', '🌾', '🌕', '☕'],
    trophyTitle: 'GOLDEN AUTUMN HARVEST MEDAL',
    choreographyLabel: 'Tarian Daun Maple Jingga & Angin Senja',
    confettiColors: ['#F97316', '#F59E0B', '#DC2626', '#FDE047', '#FEF3C7'],
    laserColors: ['#F97316', '#F59E0B', '#DC2626'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Guguran daun maple keemasan dan merah senja yang menari lembut melintasi panggung.',
    celebrationHeadline: '🍁 GOLDEN AUTUMN • KEHANGATAN MUSIM GUGUR!',
    celebrationSubtext: 'Nuansa keemasan musim panen membawa ketenangan dan kemakmuran.',
    theme: 'amber',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🍁',
  },
  {
    id: 'halloween_spooky_party',
    name: 'Festival Halloween (Spooky Pumpkin & Magic Night)',
    shortBadge: '🎃 Happy Halloween',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🎃',
    particleEmojis: ['🎃', '👻', '🦇', '🍬', '🍭', '🕸️', '🌙', '✨'],
    mascotParadeEmojis: ['🎃', '👻', '🦇', '🍬', '🌙'],
    trophyTitle: 'JACK-O-LANTERN MYSTIC CROWN',
    choreographyLabel: 'Parade Labu Menyala, Kelelawar & Permen Ajaib',
    confettiColors: ['#F97316', '#A855F7', '#FACC15', '#1E1B4B', '#4ADE80'],
    laserColors: ['#F97316', '#A855F7', '#4ADE80'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'cyber_synth',
    description: 'Malam misteri Halloween yang seru dengan labu menyala, kelelawar terbang, dan hujan permen.',
    celebrationHeadline: '🎃 HAPPY HALLOWEEN • TRICK OR TREAT!',
    celebrationSubtext: 'Bukan jebakan, melainkan hadiah spesial penuh kejutan manis untuk Anda!',
    theme: 'amber',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🎃',
  },
  {
    id: 'valentine_kasih_sayang',
    name: 'Hari Kasih Sayang (Happy Valentine Heart Storm)',
    shortBadge: '💝 Hari Kasih Sayang',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '💝',
    particleEmojis: ['💝', '💖', '💘', '🌹', '🍫', '🧸', '💌', '✨'],
    mascotParadeEmojis: ['💝', '💘', '🌹', '🧸', '🍫'],
    trophyTitle: 'CUPID GOLDEN HEART CHALICE',
    choreographyLabel: 'Panah Asmara Cupid & Badai Hati Berlian',
    confettiColors: ['#F43F5E', '#EC4899', '#FDA4AF', '#FBBF24', '#FFFFFF'],
    laserColors: ['#F43F5E', '#EC4899', '#FBBF24'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Kiriman penuh cinta dengan hujan hati merah muda, buket mawar, cokelat, dan panah asmara.',
    celebrationHeadline: '💝 HAPPY VALENTINE • PENUH KASIH SAYANG!',
    celebrationSubtext: 'Pesan tulus dan hadiah manis untuk orang yang paling istimewa!',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '💝',
  },
  {
    id: 'hari_ibu_tercinta',
    name: 'Hari Ibu (Kasih Ibu Sepanjang Masa)',
    shortBadge: '💐💖 Selamat Hari Ibu',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '💐',
    particleEmojis: ['💐', '💖', '🌹', '👑', '🕊️', '✨', '🌷', '💝'],
    mascotParadeEmojis: ['💐', '👑', '💖', '🌹', '🕊️'],
    trophyTitle: 'QUEEN OF OUR HEARTS MOTHER MEDAL',
    choreographyLabel: 'Mahkota Kasih Ibu & Taman Mawar Mekar',
    confettiColors: ['#EC4899', '#F43F5E', '#FBBF24', '#FBCFE8', '#FFFFFF'],
    laserColors: ['#EC4899', '#FBBF24', '#FFFFFF'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Buket bunga mawar dan mahkota ratu sebagai persembahan kasih sayang untuk Ibu tercinta.',
    celebrationHeadline: '💐 SELAMAT HARI IBU • KASIHMU SEPANJANG MASA!',
    celebrationSubtext: 'Terima kasih atas doa, cinta, dan ketulusan yang tak terhingga.',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '💐',
  },
  {
    id: 'hari_ayah_pahlawan',
    name: 'Hari Ayah (Pahlawan Keluarga Tangguh)',
    shortBadge: '👔🏆 Selamat Hari Ayah',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🏆',
    particleEmojis: ['🏆', '👔', '👑', '🛡️', '🌟', '☕', '💙', '✨'],
    mascotParadeEmojis: ['🏆', '👑', '🛡️', '👔', '🌟'],
    trophyTitle: 'WORLD BEST FATHER CHAMPION CUP',
    choreographyLabel: 'Perisai Pelindung Emas & Piala Ayah Terbaik',
    confettiColors: ['#38BDF8', '#1D4ED8', '#FBBF24', '#FFFFFF'],
    laserColors: ['#38BDF8', '#FBBF24', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Piala emas dan perisai kehormatan untuk sosok Ayah pelindung dan pahlawan keluarga.',
    celebrationHeadline: '🏆 SELAMAT HARI AYAH • PAHLAWAN KELUARGA KAMI!',
    celebrationSubtext: 'Terima kasih atas ketangguhan, bimbingan, dan kerja kerasmu setiap hari.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '👔',
  },
  {
    id: 'hari_anak_ceria',
    name: 'Hari Anak & Taman Bermain Pelangi (Joyful Carnival)',
    shortBadge: '🎠🎈 Hari Anak Ceria',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🎠',
    particleEmojis: ['🎠', '🎡', '🎈', '🍭', '🧸', '🌈', '🎉', '✨'],
    mascotParadeEmojis: ['🎠', '🎡', '🌈', '🎈', '🧸'],
    trophyTitle: 'RAINBOW CARNIVAL JOY TROPHY',
    choreographyLabel: 'Komidi Putar Pelangi & Balon Karnaval',
    confettiColors: ['#F43F5E', '#FBBF24', '#34D399', '#38BDF8', '#A855F7'],
    laserColors: ['#F43F5E', '#FBBF24', '#38BDF8'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Taman bermain penuh pelangi, bianglala, balon warna-warni, dan permen manis yang ceria.',
    celebrationHeadline: '🎠 SELAMAT HARI ANAK! CERIA & PENUH IMPIAN!',
    celebrationSubtext: 'Teruslah bermimpi setinggi langit dengan senyum dan keceriaan setiap hari!',
    theme: 'rose',
    paletteStyle: 'rose_gold',
    cornerOrnamentSymbol: '🎠',
  },
  {
    id: 'karnaval_rio_samba',
    name: 'Festival Karnaval Dunia (Grand Fiesta Parade)',
    shortBadge: '🎭🎉 Karnaval Akbar Dunia',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🎭',
    particleEmojis: ['🎭', '💃', '🎺', '🥁', '🦚', '🎆', '🎉', '✨'],
    mascotParadeEmojis: ['🎭', '🦚', '🎺', '🥁', '🎆'],
    trophyTitle: 'GRAND WORLD CARNIVAL CROWN',
    choreographyLabel: 'Parade Topeng Emas, Merak & Terompet Samba',
    confettiColors: ['#10B981', '#FBBF24', '#EC4899', '#38BDF8', '#A855F7'],
    laserColors: ['#10B981', '#FBBF24', '#EC4899'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Parade karnaval internasional dengan topeng emas, bulu merak berkilau, dan musik pesta.',
    celebrationHeadline: '🎭 GRAND CARNIVAL FIESTA 100.000X!',
    celebrationSubtext: 'Panggung karnaval paling meriah di dunia menyambut keberuntungan Anda!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🎭',
  },
  {
    id: 'festival_lentera_langit',
    name: 'Festival Seribu Lentera Langit (Sky Lantern Wish)',
    shortBadge: '🏮✨ Festival Lentera Langit',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🏮',
    particleEmojis: ['🏮', '✨', '🌕', '🌟', '🕯️', '🦋', '💛', '🌌'],
    mascotParadeEmojis: ['🏮', '🌕', '🌟', '🕯️', '🦋'],
    trophyTitle: 'CELESTIAL WISH LANTERN TROPHY',
    choreographyLabel: 'Ribuan Lentera Harapan Melayang ke Bintang',
    confettiColors: ['#F59E0B', '#FBBF24', '#FDE047', '#FEF08A', '#FFFFFF'],
    laserColors: ['#F59E0B', '#FDE047', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'gentle_harp',
    description: 'Ribuan lentera harapan bercahaya keemasan yang terbang serentak memenuhi langit malam.',
    celebrationHeadline: '🏮 FESTIVAL SERIBU LENTERA HARAPAN!',
    celebrationSubtext: 'Semoga setiap doa dan harapan terbaik Anda terbang tinggi dan terkabul.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🏮',
  },
  {
    id: 'festival_kembang_api_hanabi',
    name: 'Festival Kembang Api Hanabi (Summer Sky Fireworks)',
    shortBadge: '🎇🎆 Festival Hanabi',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Festival Dunia',
    primaryEmoji: '🎇',
    particleEmojis: ['🎇', '🎆', '🏮', '🌸', '✨', '🌟', '🎐', '🎊'],
    mascotParadeEmojis: ['🎇', '🎆', '🏮', '🎐', '🌸'],
    trophyTitle: 'HANABI GRAND FIREWORKS MEDAL',
    choreographyLabel: 'Ledakan Kembang Api Bunga Krisan Raksasa',
    confettiColors: ['#F43F5E', '#38BDF8', '#FBBF24', '#A855F7', '#FFFFFF'],
    laserColors: ['#F43F5E', '#38BDF8', '#FBBF24'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Kembang api Hanabi Jepang yang membentuk kelopak bunga cahaya raksasa di langit malam.',
    celebrationHeadline: '🎇 HANABI MATSURI • PESTA KEMBANG API LANGIT!',
    celebrationSubtext: 'Gemuruh kembang api spektakuler mewarnai momen klaim hadiah Anda!',
    theme: 'rose',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🎇',
  },

  // ============================================================================
  // 5. SELEBRASI SULTAN & KEMEWAHAN VIP (14 EFEK)
  // ============================================================================
  {
    id: 'hujan_emas_sultan',
    name: 'Hujan Emas & Berlian Sultan (24K Gold & Diamond Storm)',
    shortBadge: '👑 Hujan Emas Sultan',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '👑',
    particleEmojis: ['👑', '🪙', '💎', '💰', '🏆', '✨', '⚜️', '🥂'],
    mascotParadeEmojis: ['👑', '💎', '🏆', '💰', '🪙'],
    trophyTitle: 'SULTAN TRILLIONAIRE 24K GOLD CROWN',
    choreographyLabel: 'Badai Emas Batangan 24K, Berlian & Mahkota Raja',
    confettiColors: ['#FBBF24', '#F59E0B', '#FDE047', '#FEF08A', '#D97706', '#FFFFFF'],
    laserColors: ['#FDE047', '#F59E0B', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Badai emas batangan 24 karat, koin sultan, berlian murni, dan mahkota kerajaan kelas VVIP.',
    celebrationHeadline: '👑 ROYAL SULTAN JACKPOT! HUJAN EMAS & BERLIAN 100.000X!',
    celebrationSubtext: 'Persembahan kemewahan tertinggi Bank Nusantara untuk Nasabah Prioritas & Sultan!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '👑',
  },
  {
    id: 'jackpot_mega_miliarder',
    name: 'Mega Jackpot 777 Triliuner (Casino Royal Jackpot)',
    shortBadge: '🎰💎 Mega Jackpot 777',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🎰',
    particleEmojis: ['🎰', '💎', '🪙', '💰', '7️⃣', '👑', '🎆', '✨'],
    mascotParadeEmojis: ['🎰', '7️⃣', '💎', '💰', '👑'],
    trophyTitle: '777 ULTRA TRILLIONAIRE JACKPOT CUP',
    choreographyLabel: 'Semburan Koin Jackpot 777 & Laser Kasino Emas',
    confettiColors: ['#FDE047', '#10B981', '#F43F5E', '#38BDF8', '#FFFFFF'],
    laserColors: ['#FDE047', '#10B981', '#F43F5E'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Sirine kemenangan 777 Mega Jackpot dengan semburan ribuan koin emas dan berlian tanpa henti.',
    celebrationHeadline: '🎰 777 MEGA JACKPOT WINNER • TRILIUNER NUSANTARA!',
    celebrationSubtext: 'Keberuntungan mutlak berpihak pada Anda! Seluruh hadiah jackpot langsung cair!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🎰',
  },
  {
    id: 'penobatan_raja_ratu',
    name: 'Penobatan Raja & Ratu (Imperial Coronation Ceremony)',
    shortBadge: '👑⚜️ Penobatan Raja & Ratu',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '⚜️',
    particleEmojis: ['⚜️', '👑', '🏰', '💎', '🗡️', '🛡️', '🎺', '✨'],
    mascotParadeEmojis: ['👑', '⚜️', '🏰', '🎺', '💎'],
    trophyTitle: 'IMPERIAL SOVEREIGN CORONATION SCEPTER',
    choreographyLabel: 'Fanfare Terompet Kerajaan & Tongkat Mahkota',
    confettiColors: ['#FBBF24', '#7C3AED', '#DC2626', '#FDE047', '#FFFFFF'],
    laserColors: ['#FBBF24', '#7C3AED', '#DC2626'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Upacara penobatan kaisar dengan terompet emas, jubah beludru ungu, dan mahkota permata.',
    celebrationHeadline: '⚜️ PENOBATAN KEHORMATAN TERTINGGI BANK NUSANTARA!',
    celebrationSubtext: 'Anda dinobatkan sebagai pemegang privilese kedaulatan tertinggi di Bank Nusantara!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '⚜️',
  },
  {
    id: 'harta_karun_brankas_emas',
    name: 'Pembukaan Brankas Harta Karun Kerajaan (Royal Vault Open)',
    shortBadge: '🔐💰 Brankas Harta Karun',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '💰',
    particleEmojis: ['💰', '🪙', '💎', '🔑', '👑', '🏦', '✨', '🏆'],
    mascotParadeEmojis: ['💰', '🔑', '💎', '🪙', '🏦'],
    trophyTitle: 'ROYAL TREASURY VAULT MASTER KEY',
    choreographyLabel: 'Roda Brankas Emas Terbuka & Semburan Permata',
    confettiColors: ['#F59E0B', '#FDE047', '#10B981', '#FFFFFF'],
    laserColors: ['#FDE047', '#F59E0B', '#10B981'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Pintu brankas utama Bank Nusantara terbuka lebar memuntahkan peti emas dan permata langka.',
    celebrationHeadline: '💰 BRANKAS UTAMA TERBUKA • HARTA KARUN SULTAN CAIR!',
    celebrationSubtext: 'Akses eksklusif ke perbendaharaan emas dan hadiah prioritas telah dibuka untuk Anda.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '💰',
  },
  {
    id: 'black_card_infinite_prestige',
    name: 'Black Card Infinite VVIP Prestige',
    shortBadge: '💳👑 Black Card VVIP',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '💳',
    particleEmojis: ['💳', '👑', '💎', '✨', '🥂', '🛩️', '🪙', '⚜️'],
    mascotParadeEmojis: ['💳', '👑', '💎', '🛩️', '🥂'],
    trophyTitle: 'INFINITE BLACK CARD VVIP EMBLEM',
    choreographyLabel: 'Hologram Kartu Hitam Titanium & Kilau Berlian',
    confettiColors: ['#FBBF24', '#1E293B', '#FDE047', '#E2E8F0', '#FFFFFF'],
    laserColors: ['#FBBF24', '#FFFFFF', '#38BDF8'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Kemewahan eksklusif pemegang Black Card dengan aura hitam-emas titanium dan jet pribadi.',
    celebrationHeadline: '💳 BLACK CARD INFINITE PRESTIGE • TANPA BATAS!',
    celebrationSubtext: 'Privilese tanpa batas bagi nasabah kasta tertinggi Bank Nusantara.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '💳',
  },
  {
    id: 'yacht_private_jet_party',
    name: 'Pesta Kapal Pesiar & Private Jet Sultan',
    shortBadge: '🛥️🛩️ Yacht & Private Jet',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🛥️',
    particleEmojis: ['🛥️', '🛩️', '🥂', '🍾', '💎', '👑', '🌴', '✨'],
    mascotParadeEmojis: ['🛩️', '🛥️', '🥂', '💎', '👑'],
    trophyTitle: 'BILLIONAIRE JETSET LIFESTYLE TROPHY',
    choreographyLabel: 'Lintasan Jet Pribadi & Kapal Pesiar Emas',
    confettiColors: ['#38BDF8', '#FBBF24', '#FFFFFF', '#10B981'],
    laserColors: ['#38BDF8', '#FBBF24', '#FFFFFF'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'festive_party',
    description: 'Gaya hidup miliarder dunia dengan formasi jet pribadi melintas dan pesta kapal pesiar mewah.',
    celebrationHeadline: '🛥️ BILLIONAIRE JETSET PARTY • GAYA HIDUP SULTAN!',
    celebrationSubtext: 'Terbang tinggi dengan jet pribadi dan berlayar di samudra kemewahan!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🛩️',
  },
  {
    id: 'mahkota_kaisar_nusantara',
    name: 'Mahkota Kaisar & Takhta Kencana Nusantara',
    shortBadge: '👑🏯 Takhta Kencana',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '👑',
    particleEmojis: ['👑', '🏯', '🐉', '🪙', '💎', '🔥', '⚜️', '✨'],
    mascotParadeEmojis: ['👑', '🐉', '🏯', '💎', '⚜️'],
    trophyTitle: 'TAKHTA KENCANA EMPEROR CROWN',
    choreographyLabel: 'Naga Kencana & Singgasana Emas Murni',
    confettiColors: ['#FDE047', '#DC2626', '#F59E0B', '#FFFFFF'],
    laserColors: ['#FDE047', '#DC2626', '#F59E0B'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'royal_fanfare',
    description: 'Kemegahan singgasana kencana dengan pengawalan naga emas dan mahkota pusaka.',
    celebrationHeadline: '👑 TAKHTA KENCANA KAISAR NUSANTARA!',
    celebrationSubtext: 'Kemuliaan dan kekuasaan finansial tertinggi berada di genggaman Anda.',
    theme: 'amber',
    paletteStyle: 'crimson_gold',
    cornerOrnamentSymbol: '🏯',
  },
  {
    id: 'hujan_uang_rupiah_dolar',
    name: 'Badai Uang Tunai Rupiah & Dolar (Cash Tornado)',
    shortBadge: '💵💸 Badai Uang Tunai',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '💵',
    particleEmojis: ['💵', '💴', '💶', '💷', '💸', '💰', '🪙', '🤑'],
    mascotParadeEmojis: ['💵', '💸', '💰', '💶', '🤑'],
    trophyTitle: 'GLOBAL CURRENCY CASH TORNADO CUP',
    choreographyLabel: 'Angin Puyuh Lembaran Uang & Koin Emas',
    confettiColors: ['#10B981', '#34D399', '#FBBF24', '#22C55E', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#22C55E'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'festive_party',
    description: 'Pusaran tornado uang kertas dari berbagai mata uang dunia dan batangan emas.',
    celebrationHeadline: '💵 CASH TORNADO 100.000X • BADAI UANG TUNAI!',
    celebrationSubtext: 'Hujan likuiditas raksasa mengalir langsung memperkuat saldo rekening Anda!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '💵',
  },
  {
    id: 'pesta_sampanye_piala_emas',
    name: 'Gala Sampanye & Piala Emas Kemenangan',
    shortBadge: '🍾🏆 Gala Sampanye Emas',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🍾',
    particleEmojis: ['🍾', '🥂', '🏆', '👑', '✨', '🌟', '🪙', '🎉'],
    mascotParadeEmojis: ['🍾', '🥂', '🏆', '👑', '🌟'],
    trophyTitle: 'GRAND GALA CHAMPAGNE CHALICE',
    choreographyLabel: 'Semburan Sampanye Emas & Bersulang Piala',
    confettiColors: ['#FDE047', '#FBBF24', '#FEF08A', '#FFFFFF'],
    laserColors: ['#FDE047', '#FBBF24', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Letupan botol sampanye emas di malam gala VVIP dengan kilauan lampu kristal.',
    celebrationHeadline: '🍾 CHEERS TO VICTORY • GALA SAMPANYE SULTAN!',
    celebrationSubtext: 'Mari bersulang merayakan pencapaian dan hadiah istimewa Anda malam ini!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🥂',
  },
  {
    id: 'berlian_biru_kerajaan',
    name: 'Hujan Berlian Biru Langka (Royal Blue Diamond Rain)',
    shortBadge: '💎✨ Berlian Biru Langka',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '💎',
    particleEmojis: ['💎', '👑', '✨', '💍', '🌟', '❄️', '💠', '🏆'],
    mascotParadeEmojis: ['💎', '💍', '👑', '💠', '🏆'],
    trophyTitle: 'HOPE BLUE DIAMOND IMPERIAL TIARA',
    choreographyLabel: 'Biasan Prisma Berlian Biru 1.000 Karat',
    confettiColors: ['#38BDF8', '#0284C7', '#E0F2FE', '#FDE047', '#FFFFFF'],
    laserColors: ['#38BDF8', '#E0F2FE', '#FDE047'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Kilauan biasan cahaya berlian biru paling langka di dunia dengan laser safir.',
    celebrationHeadline: '💎 ROYAL BLUE DIAMOND • PERMATA LANGKA SULTAN!',
    celebrationSubtext: 'Keanggunan berlian biru murni memperindah hadiah kehormatan Anda.',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '💎',
  },
  {
    id: 'karpet_merah_gala_vip',
    name: 'Red Carpet Hollywood & VIP Spotlight',
    shortBadge: '🎬🌟 Red Carpet VVIP',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🌟',
    particleEmojis: ['🌟', '🎬', '📸', '🏆', '👑', '🥂', '✨', '💎'],
    mascotParadeEmojis: ['🏆', '📸', '🌟', '👑', '🎬'],
    trophyTitle: 'GOLDEN ACADEMY AWARD STATUETTE',
    choreographyLabel: 'Kilatan Kamera Paparazzi & Sorot Lampu Gala',
    confettiColors: ['#DC2626', '#FBBF24', '#FDE047', '#FFFFFF'],
    laserColors: ['#FBBF24', '#DC2626', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'royal_fanfare',
    description: 'Sambutan karpet merah dengan ribuan blitz kamera, lampu sorot emas, dan piala bintang utama.',
    celebrationHeadline: '🌟 VIP RED CARPET • BINTANG UTAMA MALAM INI!',
    celebrationSubtext: 'Seluruh sorot lampu panggung tertuju pada kemenangannya Anda!',
    theme: 'rose',
    paletteStyle: 'crimson_gold',
    cornerOrnamentSymbol: '📸',
  },
  {
    id: 'takhta_naga_emas_sultan',
    name: 'Takhta Sembilan Naga Emas (Nine Golden Dragons)',
    shortBadge: '🐉👑 Sembilan Naga Emas',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🐉',
    particleEmojis: ['🐉', '👑', '🪙', '🔥', '💎', '🏮', '✨', '🏆'],
    mascotParadeEmojis: ['🐉', '👑', '🔥', '🪙', '💎'],
    trophyTitle: 'NINE GOLDEN DRAGONS EMPEROR SEAL',
    choreographyLabel: 'Tarian 9 Naga Emas & Bola Api Keberuntungan',
    confettiColors: ['#FDE047', '#F59E0B', '#EF4444', '#FFFFFF'],
    laserColors: ['#FDE047', '#EF4444', '#F59E0B'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'royal_fanfare',
    description: 'Sembilan naga emas legendaris yang terbang berputar mengelilingi stempel kekaisaran.',
    celebrationHeadline: '🐉 SEMBILAN NAGA EMAS • KEBERUNTUNGAN TAK TERBATAS!',
    celebrationSubtext: 'Aura kemakmuran sembilan naga emas mengawal rekening Anda!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🐉',
  },
  {
    id: 'kripto_bull_run_moon',
    name: 'Bitcoin & Crypto Bull Run To The Moon',
    shortBadge: '🚀🪙 Crypto Bull Run',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🪙',
    particleEmojis: ['🪙', '🚀', '📈', '💎', '🌕', '⚡', '💰', '✨'],
    mascotParadeEmojis: ['🚀', '🪙', '📈', '💎', '🌕'],
    trophyTitle: 'TO THE MOON DIAMOND HANDS TROPHY',
    choreographyLabel: 'Roket Menuju Bulan & Lilin Hijau Raksasa',
    confettiColors: ['#F59E0B', '#10B981', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#10B981', '#F59E0B', '#38BDF8'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'cyber_synth',
    description: 'Roket koin emas melesat menembus bulan dengan grafik hijau vertikal dan tangan berlian.',
    celebrationHeadline: '🚀 TO THE MOON 100.000X • BULL RUN JACKPOT!',
    celebrationSubtext: 'Portofolio dan hadiah Anda terbang menembus atmosfer menuju bulan!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🪙',
  },
  {
    id: 'dividen_triliuner_cair',
    name: 'Pencairan Dividen Konglomerat Triliuner',
    shortBadge: '🏦💎 Dividen Triliuner',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & Kemewahan VIP',
    primaryEmoji: '🏦',
    particleEmojis: ['🏦', '💎', '📈', '💰', '👑', '🪙', '🥂', '✨'],
    mascotParadeEmojis: ['🏦', '💰', '📈', '👑', '💎'],
    trophyTitle: 'SOVEREIGN WEALTH DIVIDEND TROPHY',
    choreographyLabel: 'Hujan Sertifikat Saham Emas & Berlian',
    confettiColors: ['#10B981', '#FBBF24', '#FDE047', '#FFFFFF'],
    laserColors: ['#10B981', '#FBBF24', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Distribusi dividen akbar pemegang saham utama dengan hujan emas dan zamrud.',
    celebrationHeadline: '🏦 DIVIDEN KONGLOMERAT CAIR • REZEKI SULTAN!',
    celebrationSubtext: 'Hasil dividen kehormatan telah dikreditkan penuh ke rekening Anda.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '📈',
  },

  // ============================================================================
  // 6. CYBERPUNK, MECHA & SCI-FI (12 EFEK)
  // ============================================================================
  {
    id: 'cyberpunk_neon_overdrive',
    name: 'Cyberpunk 2099 Neon Matrix Overdrive',
    shortBadge: '🤖⚡ Cyberpunk Overdrive',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🤖',
    particleEmojis: ['🤖', '⚡', '💠', '🔮', '🛸', '💿', '✨', '🔋'],
    mascotParadeEmojis: ['🤖', '🛸', '⚡', '💠', '🔮'],
    trophyTitle: 'CYBERPUNK 2099 NEURAL CORE TROPHY',
    choreographyLabel: 'Jaring Laser Sian-Magenta & Portal Hologram 3D',
    confettiColors: ['#22D3EE', '#EC4899', '#A855F7', '#FACC15', '#FFFFFF'],
    laserColors: ['#22D3EE', '#EC4899', '#A855F7'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cyber_synth',
    description: 'Panggung masa depan Cyberpunk dengan jaring laser neon sian-magenta, glitch hologram, dan bass synthwave.',
    celebrationHeadline: '🤖 CYBERPUNK NEON OVERDRIVE • SYSTEM 100.000X BOOST!',
    celebrationSubtext: 'Transmisi hadiah masa depan terenkripsi berhasil didekripsi ke rekening Anda!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '💠',
  },
  {
    id: 'matrix_digital_code_rain',
    name: 'Matrix Quantum Code & Cyber Hacker Drop',
    shortBadge: '💻🟢 Matrix Quantum Drop',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '💻',
    particleEmojis: ['💻', '🔋', '⚡', '🔐', '💎', '🪙', '✨', '🛸'],
    mascotParadeEmojis: ['💻', '⚡', '🔐', '💎', '🪙'],
    trophyTitle: 'QUANTUM MAINFRAME ACCESS KEY',
    choreographyLabel: 'Hujan Kode Hijau Neon & Gelombang Pulsa Kuantum',
    confettiColors: ['#10B981', '#34D399', '#4ADE80', '#A7F3D0', '#FFFFFF'],
    laserColors: ['#10B981', '#4ADE80', '#22D3EE'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cyber_synth',
    description: 'Hujan kode kuantum hijau emerald dengan laser pemindai matriks dan brankas kripto terbuka.',
    celebrationHeadline: '💻 QUANTUM MAINFRAME UNLOCKED • REWARD TRANSFERRED!',
    celebrationSubtext: 'Protokol hadiah kuantum telah mengeksekusi pengiriman aset ke akun Anda.',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '💻',
  },
  {
    id: 'portal_time_travel_dimension',
    name: 'Portal Lintas Dimensi & Mesin Waktu (Chrono Rift)',
    shortBadge: '🌀⏳ Portal Lintas Dimensi',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🌀',
    particleEmojis: ['🌀', '⏳', '⚡', '🌌', '💠', '✨', '🔮', '🪐'],
    mascotParadeEmojis: ['🌀', '⏳', '🪐', '⚡', '🔮'],
    trophyTitle: 'CHRONO DIMENSIONAL RIFT CORE',
    choreographyLabel: 'Cincin Waktu Berputar & Pusaran Lubang Cacing',
    confettiColors: ['#38BDF8', '#818CF8', '#C084FC', '#FBBF24', '#FFFFFF'],
    laserColors: ['#38BDF8', '#C084FC', '#FBBF24'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Gerbang waktu antar-dimensi yang membuka pusaran cahaya biru-ungu dan jam pasir emas.',
    celebrationHeadline: '🌀 PORTAL DIMENSI TERBUKA • HADIAH LINTAS WAKTU!',
    celebrationSubtext: 'Kiriman spesial menembus ruang dan waktu langsung menuju rekening Anda.',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🌀',
  },
  {
    id: 'mecha_gundam_launch',
    name: 'Mecha Titan Launch & Hanggar Masa Depan',
    shortBadge: '🤖🚀 Mecha Titan Launch',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🚀',
    particleEmojis: ['🤖', '🚀', '⚡', '🛡️', '🔥', '💠', '🌟', '✨'],
    mascotParadeEmojis: ['🤖', '🚀', '🛡️', '⚡', '🔥'],
    trophyTitle: 'MECHA TITAN HYPER CORE CREST',
    choreographyLabel: 'Peluncuran Katapel Mecha & Sayap Plasma Biru',
    confettiColors: ['#38BDF8', '#EF4444', '#FBBF24', '#FFFFFF'],
    laserColors: ['#38BDF8', '#EF4444', '#FBBF24'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cyber_synth',
    description: 'Peluncuran robot Mecha raksasa dengan sayap plasma biru, laser pertahanan, dan efek pendorong jet.',
    celebrationHeadline: '🚀 MECHA TITAN LAUNCH • FULL BURST 100.000X!',
    celebrationSubtext: 'Seluruh senjata dan reaktor hadiah telah diaktifkan pada kapasitas maksimum!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🤖',
  },
  {
    id: 'laser_rave_hologram',
    name: 'Festival Laser Rave & Panggung EDM Hologram',
    shortBadge: '🎧⚡ Laser Rave EDM',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🎧',
    particleEmojis: ['🎧', '⚡', '🔊', '💿', '🎇', '✨', '🌈', '🔥'],
    mascotParadeEmojis: ['🎧', '🔊', '💿', '⚡', '🔥'],
    trophyTitle: 'ULTRA EDM LASER FESTIVAL STAGE',
    choreographyLabel: '14 Sinar Laser Rave & Gelombang Bass Drop',
    confettiColors: ['#22D3EE', '#F43F5E', '#A3E635', '#FACC15', '#C084FC'],
    laserColors: ['#22D3EE', '#F43F5E', '#A3E635'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cyber_synth',
    description: 'Panggung konser EDM masa depan dengan dentuman bass drop dan sapuan 14 sinar laser neon.',
    celebrationHeadline: '🎧 ULTRA LASER RAVE • DROP THE BASS 100.000X!',
    celebrationSubtext: 'Dentuman frekuensi kemenangan mengguncang panggung hadiah Anda!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🎧',
  },
  {
    id: 'ai_quantum_singularity',
    name: 'Quantum Singularity & Neural Star',
    shortBadge: '⚛️💠 Quantum Singularity',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '⚛️',
    particleEmojis: ['⚛️', '💠', '⚡', '🔮', '🌟', '✨', '💎', '🌌'],
    mascotParadeEmojis: ['⚛️', '💠', '🔮', '⚡', '💎'],
    trophyTitle: 'QUANTUM SINGULARITY CORE',
    choreographyLabel: 'Orbit Atom Kuantum & Jaringan Cahaya Neural',
    confettiColors: ['#38BDF8', '#818CF8', '#2DD4BF', '#FFFFFF'],
    laserColors: ['#38BDF8', '#2DD4BF', '#818CF8'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Inti atom kuantum yang memancarkan gelombang energi murni berkecepatan cahaya.',
    celebrationHeadline: '⚛️ QUANTUM SINGULARITY • ENERGI TAK TERBATAS!',
    celebrationSubtext: 'Sinkronisasi tingkat tinggi berhasil menggandakan kemeriahan hadiah Anda.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '⚛️',
  },
  {
    id: 'hyperloop_warp_speed',
    name: 'Hyperspace Warp Speed 100.000x (Kecepatan Cahaya)',
    shortBadge: '🛸⚡ Hyperspace Warp',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🛸',
    particleEmojis: ['🛸', '⚡', '🌠', '🚀', '💠', '✨', '🌌', '🌟'],
    mascotParadeEmojis: ['🛸', '🚀', '🌠', '⚡', '💠'],
    trophyTitle: 'HYPERSPACE WARP DRIVE ENGINE',
    choreographyLabel: 'Terowongan Garis Bintang Kecepatan Cahaya',
    confettiColors: ['#38BDF8', '#FFFFFF', '#FDE047', '#818CF8'],
    laserColors: ['#38BDF8', '#FFFFFF', '#818CF8'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'cyber_synth',
    description: 'Lompatan antarbintang berkecepatan cahaya dengan garis-garis meteor biru putih.',
    celebrationHeadline: '🛸 HYPERSPACE JUMP • KECEPATAN CAHAYA 100.000X!',
    celebrationSubtext: 'Pengiriman instan berkecepatan warp langsung mendarat di akun Anda!',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '🛸',
  },
  {
    id: 'synthwave_outrun_sunset',
    name: 'Synthwave Outrun 1984 (Retro Neon Sunset)',
    shortBadge: '🌆🕶️ Synthwave Retro',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🌆',
    particleEmojis: ['🌆', '🕶️', '🏎️', '🌴', '⚡', '💿', '✨', '🌅'],
    mascotParadeEmojis: ['🏎️', '🌆', '🌴', '🕶️', '⚡'],
    trophyTitle: 'SYNTHWAVE OUTRUN HORIZON TROPHY',
    choreographyLabel: 'Matahari Grid Magenta & Supercar Neon',
    confettiColors: ['#EC4899', '#F97316', '#A855F7', '#22D3EE', '#FACC15'],
    laserColors: ['#EC4899', '#F97316', '#22D3EE'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cyber_synth',
    description: 'Horison matahari terbenam bergaya retro-futuristik dengan grid laser ungu-jingga.',
    celebrationHeadline: '🌆 SYNTHWAVE OUTRUN • RETRO NEON VICTORY!',
    celebrationSubtext: 'Estetika neon masa depan berpadu dengan hadiah spektakuler untuk Anda.',
    theme: 'rose',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🌆',
  },
  {
    id: 'neon_tokyo_shibuya',
    name: 'Neon Tokyo Cyber Night (Electric Metropolis)',
    shortBadge: '🗼⚡ Neon Metropolis',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🗼',
    particleEmojis: ['🗼', '⚡', '🏮', '🌸', '💠', '🎆', '✨', '🤖'],
    mascotParadeEmojis: ['🗼', '🏮', '🤖', '🌸', '⚡'],
    trophyTitle: 'NEO METROPOLIS CYBER CROWN',
    choreographyLabel: 'Papan Hologram Kota & Sakura Neon',
    confettiColors: ['#F43F5E', '#22D3EE', '#FBBF24', '#A855F7', '#FFFFFF'],
    laserColors: ['#F43F5E', '#22D3EE', '#A855F7'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cyber_synth',
    description: 'Gemerlap malam metropolis masa depan dengan menara bercahaya dan sakura elektrik.',
    celebrationHeadline: '🗼 NEO METROPOLIS NIGHT • ELECTRIC CELEBRATION!',
    celebrationSubtext: 'Kemeriahan kota masa depan menyala terang menyambut klaim hadiah Anda.',
    theme: 'rose',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🗼',
  },
  {
    id: 'hologram_metaverse_vip',
    name: 'Hologram Metaverse & Virtual Reality Crown',
    shortBadge: '🥽💎 Metaverse VIP',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🥽',
    particleEmojis: ['🥽', '💎', '🌐', '💠', '👑', '✨', '⚡', '🪐'],
    mascotParadeEmojis: ['🥽', '🌐', '💎', '👑', '💠'],
    trophyTitle: 'METAVERSE SOVEREIGN HOLO-CROWN',
    choreographyLabel: 'Kubus Hologram 3D & Jaringan Dunia Virtual',
    confettiColors: ['#38BDF8', '#A855F7', '#2DD4BF', '#FDE047', '#FFFFFF'],
    laserColors: ['#38BDF8', '#A855F7', '#2DD4BF'],
    motionStyle: 'cyber_laser_grid',
    audioSynthStyle: 'cosmic_arp',
    description: 'Portal dunia virtual 3D dengan mahkota hologram dan permata digital.',
    celebrationHeadline: '🥽 METAVERSE HOLOGRAM • DIMENSI VIP TERBUKA!',
    celebrationSubtext: 'Aset digital dan hadiah kehormatan Anda telah tersinkronisasi penuh.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🌐',
  },
  {
    id: 'plasma_reactor_core',
    name: 'Reaktor Plasma Fusion 100.000x Overcharge',
    shortBadge: '⚡🔋 Reaktor Plasma',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '⚡',
    particleEmojis: ['⚡', '🔋', '💠', '🔥', '🌟', '✨', '⚛️', '💥'],
    mascotParadeEmojis: ['⚡', '⚛️', '🔥', '💠', '💥'],
    trophyTitle: 'PLASMA FUSION OVERCHARGE CORE',
    choreographyLabel: 'Gelombang Kejut Plasma & Petir Biru Elektrik',
    confettiColors: ['#22D3EE', '#38BDF8', '#FACC15', '#FFFFFF'],
    laserColors: ['#22D3EE', '#FACC15', '#FFFFFF'],
    motionStyle: 'anime_aura_burst',
    audioSynthStyle: 'cyber_synth',
    description: 'Inti reaktor plasma yang melepaskan gelombang kejut elektrik berdaya 100.000x.',
    celebrationHeadline: '⚡ PLASMA REACTOR OVERCHARGE 100.000X!',
    celebrationSubtext: 'Energi maksimum dilepaskan untuk merayakan klaim hadiah Anda!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '⚡',
  },
  {
    id: 'starship_armada_fleet',
    name: 'Armada Pesawat Antariksa (Galactic Fleet Salute)',
    shortBadge: '🚀🛸 Armada Antariksa',
    category: 'cyberpunk_scifi',
    categoryLabel: 'Cyberpunk, Mecha & Sci-Fi',
    primaryEmoji: '🚀',
    particleEmojis: ['🚀', '🛸', '🪐', '🌟', '⚡', '🌌', '🛰️', '✨'],
    mascotParadeEmojis: ['🚀', '🛸', '🛰️', '🪐', '🌟'],
    trophyTitle: 'GALACTIC FLEET ADMIRAL MEDAL',
    choreographyLabel: 'Formasi Terbang Armada Bintang & Laser Orbital',
    confettiColors: ['#38BDF8', '#FBBF24', '#818CF8', '#FFFFFF'],
    laserColors: ['#38BDF8', '#FBBF24', '#818CF8'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'cosmic_arp',
    description: 'Parade armada kapal induk antariksa yang menembakkan salvo penghormatan orbital.',
    celebrationHeadline: '🚀 GALACTIC FLEET SALUTE • KOMANDAN ANTARIKSA!',
    celebrationSubtext: 'Seluruh armada galaksi memberi penghormatan atas hadiah spesial Anda!',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '🛰️',
  },

  // ============================================================================
  // 7. ANIME, ESPORTS & FANTASI SIHIR (12 EFEK)
  // ============================================================================
  {
    id: 'aura_super_saiyan_emas',
    name: 'Aura Super Awakening 100.000x (Golden Ki Explosion)',
    shortBadge: '⚡🔥 Aura Awakening Emas',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '⚡',
    particleEmojis: ['⚡', '🔥', '🌟', '💥', '👑', '✨', '🐉', '💫'],
    mascotParadeEmojis: ['⚡', '🔥', '🐉', '💥', '🌟'],
    trophyTitle: 'LEGENDARY AWAKENING POWER CORE',
    choreographyLabel: 'Pilar Aura Emas Membara, Petir & Gelombang Kejut',
    confettiColors: ['#FDE047', '#FACC15', '#F59E0B', '#38BDF8', '#FFFFFF'],
    laserColors: ['#FDE047', '#F59E0B', '#38BDF8'],
    motionStyle: 'anime_aura_burst',
    audioSynthStyle: 'anime_power',
    description: 'Ledakan aura energi emas legendaris dengan sambaran petir biru dan guncangan bumi.',
    celebrationHeadline: '⚡ LIMIT BREAKER AWAKENING • POWER LEVEL 100.000X!',
    celebrationSubtext: 'Kekuatan penuh bangkit! Hadiah legendaris telah menyatu dengan akun Anda!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '⚡',
  },
  {
    id: 'esports_world_champion',
    name: 'Turnamen Esports World Champion (Grand Finals MVP)',
    shortBadge: '🎮🏆 Esports World Champion',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🎮',
    particleEmojis: ['🎮', '🏆', '👑', '🔥', '⚡', '🥇', '🎆', '✨'],
    mascotParadeEmojis: ['🏆', '🎮', '👑', '🥇', '🔥'],
    trophyTitle: 'ESPORTS GRAND FINALS MVP AEGIS',
    choreographyLabel: 'Panggung Arena Grand Final, Semburan Api & Konfeti Emas',
    confettiColors: ['#FBBF24', '#38BDF8', '#EF4444', '#A855F7', '#FFFFFF'],
    laserColors: ['#FBBF24', '#38BDF8', '#EF4444'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'anime_power',
    description: 'Panggung utama Grand Final Esports dengan semburan api panggung, piala Aegis, dan sorak kemenangan.',
    celebrationHeadline: '🎮 VICTORY! ESPORTS WORLD CHAMPION MVP!',
    celebrationSubtext: 'GGWP! Anda mengangkat piala juara utama dengan hadiah spektakuler!',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🎮',
  },
  {
    id: 'ssr_gacha_mythic_pull',
    name: 'SSR+ Mythic Gacha Rainbow Pull (0.001% Ultra Rare)',
    shortBadge: '🌈💎 SSR+ Mythic Pull',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🌈',
    particleEmojis: ['🌈', '💎', '🌟', '⚡', '👑', '🔮', '✨', '🎴'],
    mascotParadeEmojis: ['🌈', '💎', '🎴', '👑', '🌟'],
    trophyTitle: 'SSR+ MYTHIC RAINBOW ARTIFACT',
    choreographyLabel: 'Meteor Pelangi Jatuh & Transformasi Kartu Emas',
    confettiColors: ['#F43F5E', '#FBBF24', '#34D399', '#38BDF8', '#A855F7', '#FFFFFF'],
    laserColors: ['#F43F5E', '#FBBF24', '#38BDF8'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'anime_power',
    description: 'Animasi tarikan gacha kasta tertinggi SSR+ dengan meteor pelangi yang membelah langit.',
    celebrationHeadline: '🌈 SSR+ MYTHIC PULL! ULTRA RARE 100.000X DROP!',
    celebrationSubtext: 'Selamat! Anda mendapatkan kiriman kasta tertinggi dengan aura pelangi legendaris!',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🎴',
  },
  {
    id: 'lingkaran_sihir_arcana',
    name: 'Lingkaran Sihir Agung (Grand Arcana Magic Circle)',
    shortBadge: '🔮✨ Lingkaran Sihir Arcana',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🔮',
    particleEmojis: ['🔮', '✨', '🌟', '📜', '🪄', '💎', '🌙', '⚡'],
    mascotParadeEmojis: ['🔮', '🪄', '📜', '💎', '🌟'],
    trophyTitle: 'ARCHMAGE GRAND ARCANA CODEX',
    choreographyLabel: 'Mandala Rune Sihir Berputar & Kilau Mana Ungu',
    confettiColors: ['#A855F7', '#EC4899', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#A855F7', '#EC4899', '#38BDF8'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'cosmic_arp',
    description: 'Lingkaran sihir kuno berlapis tiga yang berputar memancarkan rune emas dan kristal mana.',
    celebrationHeadline: '🔮 GRAND ARCANA INVOCATION • SIHIR KEMAKMURAN!',
    celebrationSubtext: 'Segel sihir kerajaan terbuka dan menyalurkan berkah hadiah ke akun Anda!',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🔮',
  },
  {
    id: 'naga_api_legendaris',
    name: 'Naga Api Legendaris (Crimson Flame Dragon Breath)',
    shortBadge: '🐉🔥 Naga Api Legendaris',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🐉',
    particleEmojis: ['🐉', '🔥', '🌋', '⚔️', '👑', '🪙', '💥', '✨'],
    mascotParadeEmojis: ['🐉', '🔥', '⚔️', '👑', '🪙'],
    trophyTitle: 'CRIMSON DRAGON LORD CREST',
    choreographyLabel: 'Terbangan Naga Api Raksasa & Hujan Bara Emas',
    confettiColors: ['#DC2626', '#F97316', '#FBBF24', '#FDE047', '#FFFFFF'],
    laserColors: ['#DC2626', '#F97316', '#FBBF24'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'anime_power',
    description: 'Naga api merah-emas yang menyemburkan lidah api kemakmuran dan harta karun naga.',
    celebrationHeadline: '🐉 ROAR OF THE CRIMSON DRAGON 100.000X!',
    celebrationSubtext: 'Sang Naga Legendaris mempersembahkan harta karun abadinya untuk Anda!',
    theme: 'rose',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🔥',
  },
  {
    id: 'burung_phoenix_bangkit',
    name: 'Kebangkitan Phoenix Emas (Immortal Golden Phoenix)',
    shortBadge: '🦅🔥 Phoenix Emas Abadi',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🔥',
    particleEmojis: ['🔥', '🦅', '✨', '🌟', '👑', '💛', '☀️', '💎'],
    mascotParadeEmojis: ['🦅', '🔥', '☀️', '👑', '🌟'],
    trophyTitle: 'IMMORTAL PHOENIX REBIRTH WINGS',
    choreographyLabel: 'Kepakan Sayap Api Phoenix & Bulu Cahaya Emas',
    confettiColors: ['#F97316', '#FBBF24', '#EF4444', '#FDE047', '#FFFFFF'],
    laserColors: ['#F97316', '#FDE047', '#EF4444'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'royal_fanfare',
    description: 'Burung Phoenix emas yang membentangkan sayap api keabadian dan menjatuhkan bulu berkah.',
    celebrationHeadline: '🔥 GOLDEN PHOENIX RISING • KEJAYAAN ABADI!',
    celebrationSubtext: 'Sayap api Phoenix membawa semangat baru dan keberuntungan tak terbatas!',
    theme: 'amber',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🔥',
  },
  {
    id: 'pedang_excalibur_cahaya',
    name: 'Pedang Suci Ksatria Cahaya (Holy Paladin Excalibur)',
    shortBadge: '⚔️🛡️ Ksatria Cahaya',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '⚔️',
    particleEmojis: ['⚔️', '🛡️', '👑', '✨', '🌟', '🦁', '🏆', '💎'],
    mascotParadeEmojis: ['⚔️', '🛡️', '🦁', '👑', '🏆'],
    trophyTitle: 'EXCALIBUR HOLY PALADIN SHIELD',
    choreographyLabel: 'Tebasan Cahaya Emas & Perisai Singa Kerajaan',
    confettiColors: ['#FDE047', '#38BDF8', '#FFFFFF', '#F59E0B'],
    laserColors: ['#FDE047', '#38BDF8', '#FFFFFF'],
    motionStyle: 'anime_aura_burst',
    audioSynthStyle: 'royal_fanfare',
    description: 'Cahaya suci pedang raja ksatria yang membelah kegelapan dengan berkah emas dan biru langit.',
    celebrationHeadline: '⚔️ HOLY EXCALIBUR BLESSING • KSATRIA UTAMA!',
    celebrationSubtext: 'Kehormatan ksatria tertinggi dianugerahkan beserta paket hadiah kerajaan.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '⚔️',
  },
  {
    id: 'kristal_mana_fantasi',
    name: 'Hujan Kristal Mana & Permata Aether',
    shortBadge: '💎🔮 Kristal Aether',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '💎',
    particleEmojis: ['💎', '🔮', '💠', '✨', '🌟', '🦋', '🌙', '⚡'],
    mascotParadeEmojis: ['💎', '💠', '🔮', '🦋', '🌟'],
    trophyTitle: 'AETHER CRYSTAL SANCTUARY CORE',
    choreographyLabel: 'Biasan Kristal Aether Melayang & Sinar Aurora',
    confettiColors: ['#22D3EE', '#A855F7', '#34D399', '#FFFFFF'],
    laserColors: ['#22D3EE', '#A855F7', '#34D399'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Kristal Aether bercahaya biru-ungu yang berputar memancarkan partikel sihir murni.',
    celebrationHeadline: '💎 AETHER CRYSTAL RESONANCE • HADIAH FANTASI!',
    celebrationSubtext: 'Resonansi kristal murni memperkuat kemewahan kiriman hadiah Anda.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '💠',
  },
  {
    id: 'level_up_999_max',
    name: 'Level Up 999 MAX! (Status Awakening Overflow)',
    shortBadge: '🆙👑 Level 999 MAX',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🆙',
    particleEmojis: ['🆙', '👑', '⚡', '🌟', '🏆', '🔥', '💎', '✨'],
    mascotParadeEmojis: ['🆙', '👑', '🏆', '⚡', '💎'],
    trophyTitle: 'LEVEL 999 MAX SOVEREIGN BADGE',
    choreographyLabel: 'Pilar Cahaya Level Up &Bintang Statistik Penuh',
    confettiColors: ['#FACC15', '#10B981', '#38BDF8', '#F43F5E', '#FFFFFF'],
    laserColors: ['#FACC15', '#10B981', '#38BDF8'],
    motionStyle: 'anime_aura_burst',
    audioSynthStyle: 'anime_power',
    description: 'Pilar cahaya Level Up RPG saat mencapai level maksimum 999 dengan seluruh atribut penuh.',
    celebrationHeadline: '🆙 LEVEL UP 999 MAX • STATUS OVERFLOW 100.000X!',
    celebrationSubtext: 'Level kemakmuran dan hadiah akun Anda melonjak ke batas tertinggi!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🆙',
  },
  {
    id: 'victory_royale_crown',
    name: ' #1 Victory Royale Winner Winner Crown',
    shortBadge: '👑🏆 #1 Victory Royale',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🏆',
    particleEmojis: ['🏆', '👑', '🥇', '🪂', '🎆', '⚡', '💎', '✨'],
    mascotParadeEmojis: ['👑', '🏆', '🪂', '🥇', '🎆'],
    trophyTitle: '#1 VICTORY ROYALE GOLDEN CROWN',
    choreographyLabel: 'Airdrop Emas Mendarat & Ledakan Victory Biru-Emas',
    confettiColors: ['#38BDF8', '#FBBF24', '#FDE047', '#FFFFFF'],
    laserColors: ['#38BDF8', '#FBBF24', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'anime_power',
    description: 'Spanduk #1 Victory Royale legendaris dengan peti supply drop emas dan mahkota juara.',
    celebrationHeadline: '👑 #1 VICTORY ROYALE • JUARA BERTAHAN!',
    celebrationSubtext: 'Supply drop hadiah spesial telah mendarat tepat di rekening Anda!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🪂',
  },
  {
    id: 'guild_master_glory',
    name: 'Kejayaan Guild Master & Aliansi Legendaris',
    shortBadge: '🛡️👑 Guild Master Glory',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🛡️',
    particleEmojis: ['🛡️', '👑', '⚔️', '🏰', '🦁', '🏆', '🪙', '✨'],
    mascotParadeEmojis: ['🛡️', '🏰', '🦁', '👑', '🏆'],
    trophyTitle: 'GRAND GUILD MASTER BANNER',
    choreographyLabel: 'Panji Bendera Aliansi & Hujan Koin Rampasan',
    confettiColors: ['#F59E0B', '#DC2626', '#FDE047', '#FFFFFF'],
    laserColors: ['#F59E0B', '#DC2626', '#FFFFFF'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'royal_fanfare',
    description: 'Panji kebesaran pemimpin guild dengan peti harta rampasan perang dan mahkota komandan.',
    celebrationHeadline: '🛡️ GLORY TO THE GUILD MASTER • KEMENANGAN MUTLAK!',
    celebrationSubtext: 'Pembagian harta kemenangan guild telah masuk ke brankas rekening Anda!',
    theme: 'amber',
    paletteStyle: 'crimson_gold',
    cornerOrnamentSymbol: '🏰',
  },
  {
    id: 'summon_mythic_guardian',
    name: 'Pemanggilan Penjaga Mitos (Celestial Guardian Summon)',
    shortBadge: '🦄🌟 Summon Penjaga Mitos',
    category: 'anime_fantasi',
    categoryLabel: 'Anime, Esports & Fantasi',
    primaryEmoji: '🦄',
    particleEmojis: ['🦄', '🐉', '🦅', '🌟', '🔮', '✨', '🌈', '💎'],
    mascotParadeEmojis: ['🦄', '🐉', '🦅', '🔮', '🌈'],
    trophyTitle: 'CELESTIAL GUARDIAN SUMMON SEAL',
    choreographyLabel: 'Gerbang Summon Bintang & Parade Makhluk Mitos',
    confettiColors: ['#EC4899', '#A855F7', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#EC4899', '#A855F7', '#38BDF8'],
    motionStyle: 'dragon_parade',
    audioSynthStyle: 'cosmic_arp',
    description: 'Portal pemanggilan makhluk mitos bersayap cahaya yang mengawal kiriman hadiah Anda.',
    celebrationHeadline: '🦄 CELESTIAL GUARDIAN SUMMONED • BERKAH MITOS!',
    celebrationSubtext: 'Penjaga langit mengantarkan paket hadiah paling langka langsung kepada Anda!',
    theme: 'rose',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🦄',
  },

  // ============================================================================
  // 8. ALAM SEMESTA, GALAKSI & ELEMEN (10 EFEK)
  // ============================================================================
  {
    id: 'aurora_borealis_magic',
    name: 'Cahaya Aurora Borealis Kutub Utara (Cosmic Aurora)',
    shortBadge: '🌌 Aurora Borealis',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌌',
    particleEmojis: ['🌌', '✨', '🌠', '🪐', '⭐', '💫', '🌙', '💎'],
    mascotParadeEmojis: ['🌌', '🌠', '🪐', '💫', '⭐'],
    trophyTitle: 'AURORA BOREALIS CELESTIAL CROWN',
    choreographyLabel: 'Tirai Cahaya Aurora Zamrud-Ungu & Bintang Jatuh',
    confettiColors: ['#2DD4BF', '#38BDF8', '#A855F7', '#4ADE80', '#F472B6'],
    laserColors: ['#2DD4BF', '#38BDF8', '#A855F7'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Gelombang tirai cahaya Aurora hijau zamrud, biru langit, dan ungu kosmik di langit kutub.',
    celebrationHeadline: '🌌 KEAJAIBAN CAHAYA AURORA BOREALIS 100.000X!',
    celebrationSubtext: 'Simfoni cahaya semesta mengiringi hadiah spesial Anda hari ini!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🌌',
  },
  {
    id: 'supernova_ledakan_bintang',
    name: 'Ledakan Bintang Supernova (Galactic Hypernova)',
    shortBadge: '💥🌟 Supernova Kosmik',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '💥',
    particleEmojis: ['💥', '🌟', '🪐', '🌌', '☄️', '✨', '💫', '☀️'],
    mascotParadeEmojis: ['💥', '🪐', '☄️', '🌟', '🌌'],
    trophyTitle: 'HYPERNOVA STELLAR CORE TROPHY',
    choreographyLabel: 'Ledakan Inti Bintang & Gelombang Debu Emas Kosmik',
    confettiColors: ['#F59E0B', '#EC4899', '#38BDF8', '#A855F7', '#FFFFFF'],
    laserColors: ['#F59E0B', '#EC4899', '#38BDF8'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Ledakan bintang raksasa Supernova yang memancarkan gelombang energi berlapis ke seluruh galaksi.',
    celebrationHeadline: '💥 GALACTIC SUPERNOVA • LEDAKAN BINTANG 100.000X!',
    celebrationSubtext: 'Terang jutaan bintang meledak serentak merayakan hadiah Anda!',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '💫',
  },
  {
    id: 'hujan_meteor_perseid',
    name: 'Hujan Meteor Emas & Bintang Jatuh (Starfall Wish)',
    shortBadge: '🌠☄️ Hujan Meteor Emas',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌠',
    particleEmojis: ['🌠', '☄️', '🌟', '✨', '🌙', '🪐', '💫', '💎'],
    mascotParadeEmojis: ['🌠', '☄️', '🪐', '🌟', '💫'],
    trophyTitle: 'STARFALL METEOR SHOWER CHALICE',
    choreographyLabel: 'Lintasan Meteor Diagonal Beruntun & Ekor Bintang',
    confettiColors: ['#FDE047', '#38BDF8', '#F59E0B', '#FFFFFF'],
    laserColors: ['#FDE047', '#38BDF8', '#FFFFFF'],
    motionStyle: 'meteor_shower',
    audioSynthStyle: 'cosmic_arp',
    description: 'Ratusan bintang jatuh dan meteor berlapis emas yang melesat diagonal membelah angkasa.',
    celebrationHeadline: '🌠 STARFALL METEOR SHOWER • BINTANG KEBERUNTUNGAN!',
    celebrationSubtext: 'Setiap bintang jatuh membawa berkah dan hadiah baru ke rekening Anda.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🌠',
  },
  {
    id: 'badai_petir_halilintar',
    name: 'Badai Halilintar Dewa Petir (Thunderstorm Sovereign)',
    shortBadge: '⚡🌩️ Halilintar Petir',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌩️',
    particleEmojis: ['⚡', '🌩️', '💥', '🔮', '🌟', '✨', '💠', '👑'],
    mascotParadeEmojis: ['⚡', '🌩️', '💥', '👑', '💠'],
    trophyTitle: 'THUNDERBOLT SOVEREIGN HAMMER',
    choreographyLabel: 'Sambaran Petir Beruntun &Kilatan Layar',
    confettiColors: ['#FACC15', '#38BDF8', '#E0F2FE', '#FFFFFF'],
    laserColors: ['#FACC15', '#38BDF8', '#FFFFFF'],
    motionStyle: 'anime_aura_burst',
    audioSynthStyle: 'anime_power',
    description: 'Sambaran petir emas dan biru elektrik yang menyambar panggung dengan gelombang kejut dahsyat.',
    celebrationHeadline: '⚡ THUNDERSTORM OVERDRIVE • SAMBARAN HALILINTAR!',
    celebrationSubtext: 'Kekuatan halilintar membuka segel hadiah Anda dengan dentuman spektakuler!',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '⚡',
  },
  {
    id: 'gerhana_matahari_cincin',
    name: 'Gerhana Matahari Cincin Berlian (Diamond Ring Eclipse)',
    shortBadge: '🌑☀️ Gerhana Cincin Berlian',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌑',
    particleEmojis: ['🌑', '☀️', '💍', '✨', '🌟', '🪐', '👑', '🔥'],
    mascotParadeEmojis: ['🌑', '☀️', '💍', '🪐', '👑'],
    trophyTitle: 'SOLAR ECLIPSE DIAMOND RING CROWN',
    choreographyLabel: 'Korona Matahari Emas & Cincin Berlian Kosmik',
    confettiColors: ['#F59E0B', '#FDE047', '#1E293B', '#FFFFFF'],
    laserColors: ['#FDE047', '#F59E0B', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'cosmic_arp',
    description: 'Fenomena langka gerhana matahari cincin berlian dengan korona api keemasan yang memukau.',
    celebrationHeadline: '🌑 DIAMOND RING ECLIPSE • FENOMENA LANGKA!',
    celebrationSubtext: 'Selangka gerhana cincin berlian, hadiah istimewa ini hadir khusus untuk Anda.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🌑',
  },
  {
    id: 'samudra_bioluminesensi',
    name: 'Samudra Cahaya Bioluminesensi (Mystic Ocean Glow)',
    shortBadge: '🌊🐬 Samudra Cahaya',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌊',
    particleEmojis: ['🌊', '🐬', '🪼', '🐚', '💎', '✨', '🫧', '🌟'],
    mascotParadeEmojis: ['🐬', '🪼', '🌊', '🐚', '💎'],
    trophyTitle: 'ATLANTIS BIOLUMINESCENT PEARL',
    choreographyLabel: 'Parade Ubur-Ubur Cahaya & Mutiara Samudra',
    confettiColors: ['#22D3EE', '#38BDF8', '#2DD4BF', '#818CF8', '#FFFFFF'],
    laserColors: ['#22D3EE', '#2DD4BF', '#818CF8'],
    motionStyle: 'sakura_blizzard',
    audioSynthStyle: 'gentle_harp',
    description: 'Kedalaman samudra Atlantis yang menyala biru neon dengan ubur-ubur cahaya dan mutiara.',
    celebrationHeadline: '🌊 ATLANTIS OCEAN GLOW • MUTIARA SAMUDRA!',
    celebrationSubtext: 'Harta karun mutiara dari kedalaman samudra bercahaya hadir untuk Anda.',
    theme: 'indigo',
    paletteStyle: 'cyber_cyan',
    cornerOrnamentSymbol: '🐚',
  },
  {
    id: 'gunung_berapi_lava_emas',
    name: 'Erupsi Lava Emas & Batu Mulia (Golden Magma Eruption)',
    shortBadge: '🌋🔥 Erupsi Lava Emas',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌋',
    particleEmojis: ['🌋', '🔥', '🪙', '💎', '💥', '👑', '✨', '🌟'],
    mascotParadeEmojis: ['🌋', '🔥', '💎', '🪙', '💥'],
    trophyTitle: 'GOLDEN MAGMA ERUPTION CORE',
    choreographyLabel: 'Semburan Air Mancur Lava Emas & Berlian',
    confettiColors: ['#DC2626', '#F97316', '#FBBF24', '#FDE047'],
    laserColors: ['#DC2626', '#F97316', '#FDE047'],
    motionStyle: 'anime_aura_burst',
    audioSynthStyle: 'anime_power',
    description: 'Gunung emas yang menyemburkan lava emas cair, rubi merah, dan berlian ke seluruh layar.',
    celebrationHeadline: '🌋 GOLDEN MAGMA ERUPTION 100.000X!',
    celebrationSubtext: 'Semburan kekayaan bumi meledak hebat mengisi pundi-pundi rekening Anda!',
    theme: 'rose',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🌋',
  },
  {
    id: 'pelangi_kembar_zamrud',
    name: 'Pelangi Kembar & Hujan Zamrud (Double Rainbow Emerald)',
    shortBadge: '🌈💚 Pelangi Zamrud',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🌈',
    particleEmojis: ['🌈', '🍀', '💎', '🪙', '✨', '🦋', '☀️', '🌟'],
    mascotParadeEmojis: ['🌈', '🍀', '💎', '🪙', '🦋'],
    trophyTitle: 'EMERALD DOUBLE RAINBOW POT OF GOLD',
    choreographyLabel: 'Busur Pelangi Kembar & Semanggi Berdaun Empat',
    confettiColors: ['#10B981', '#FBBF24', '#38BDF8', '#F43F5E', '#A855F7'],
    laserColors: ['#10B981', '#FBBF24', '#38BDF8'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Pelangi kembar setelah hujan dengan guci emas di ujung pelangi dan daun semanggi keberuntungan.',
    celebrationHeadline: '🌈 DOUBLE RAINBOW LUCK • KEBERUNTUNGAN BERLIPAT!',
    celebrationSubtext: 'Di ujung pelangi kembar ini terdapat harta karun nyata untuk Anda!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '🍀',
  },
  {
    id: 'kristal_amethyst_geode',
    name: 'Istana Kristal Amethyst Ungu (Royal Amethyst Palace)',
    shortBadge: '🔮💎 Kristal Amethyst',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🔮',
    particleEmojis: ['🔮', '💎', '✨', '👑', '💜', '🌟', '💠', '💍'],
    mascotParadeEmojis: ['🔮', '💎', '👑', '💍', '🌟'],
    trophyTitle: 'ROYAL AMETHYST CRYSTAL THRONE',
    choreographyLabel: 'Gugusan Kristal Ungu & Biasan Laser Mulia',
    confettiColors: ['#A855F7', '#C084FC', '#FDE047', '#F472B6', '#FFFFFF'],
    laserColors: ['#A855F7', '#FDE047', '#F472B6'],
    motionStyle: 'royal_gold_storm',
    audioSynthStyle: 'gentle_harp',
    description: 'Kemilau gua kristal Amethyst ungu kerajaan yang memantulkan sinar emas di setiap sudutnya.',
    celebrationHeadline: '🔮 ROYAL AMETHYST PALACE • KEMILAU PERMATA UNGU!',
    celebrationSubtext: 'Keanggunan permata amethyst kerajaan menyempurnakan kiriman Anda.',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '💜',
  },
  {
    id: 'kabut_nebula_kosmik',
    name: 'Galaksi Nebula Orion & Bintang Kembar',
    shortBadge: '🪐🌌 Galaksi Nebula',
    category: 'alam_galaksi',
    categoryLabel: 'Alam Semesta & Galaksi',
    primaryEmoji: '🪐',
    particleEmojis: ['🪐', '🌌', '🌟', '☄️', '✨', '🌙', '🛸', '💫'],
    mascotParadeEmojis: ['🪐', '🌌', '☄️', '🌟', '🛸'],
    trophyTitle: 'ORION NEBULA COSMIC COMPASS',
    choreographyLabel: 'Orbit Planet Bercincin & Pusaran Nebula',
    confettiColors: ['#818CF8', '#EC4899', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#818CF8', '#EC4899', '#38BDF8'],
    motionStyle: 'supernova_vortex',
    audioSynthStyle: 'cosmic_arp',
    description: 'Pusaran awan antarbintang Nebula Orion dengan planet bercincin emas yang mengorbit.',
    celebrationHeadline: '🪐 ORION NEBULA ODYSSEY • KEJAYAAN SEMESTA!',
    celebrationSubtext: 'Perjalanan melintasi galaksi membawa hadiah kosmik terbaik untuk Anda.',
    theme: 'indigo',
    paletteStyle: 'purple_magic',
    cornerOrnamentSymbol: '🪐',
  },

  // ============================================================================
  // 9. PROFESI, PENCAPAIAN & GAYA HIDUP (8 EFEK + 1 TANPA EFEK = 9)
  // ============================================================================
  {
    id: 'juara_1_medali_emas',
    name: 'Juara 1 Podium Utama & Medali Emas (Champion Podium)',
    shortBadge: '🥇🏆 Juara 1 Medali Emas',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '🥇',
    particleEmojis: ['🥇', '🏆', '👑', '🎉', '🎆', '🌟', '👏', '✨'],
    mascotParadeEmojis: ['🥇', '🏆', '👑', '🎆', '🌟'],
    trophyTitle: 'GRAND CHAMPION GOLD MEDALIST',
    choreographyLabel: 'Podium Juara 1 & Hujan Medali Emas',
    confettiColors: ['#FDE047', '#F59E0B', '#38BDF8', '#EF4444', '#FFFFFF'],
    laserColors: ['#FDE047', '#F59E0B', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'royal_fanfare',
    description: 'Penyerahan medali emas di podium juara pertama dengan lagu kemenangan dan kembang api.',
    celebrationHeadline: '🥇 JUARA 1 MUTLAK • GOLD MEDAL CHAMPION!',
    celebrationSubtext: 'Selamat atas pencapaian terbaik nomor satu! Piala kemenangan ini milik Anda.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🥇',
  },
  {
    id: 'kopi_inspirasi_pagi',
    name: 'Kopi Sultan & Semangat Pagi Produktif',
    shortBadge: '☕✨ Semangat Pagi Sultan',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '☕',
    particleEmojis: ['☕', '🥐', '☀️', '✨', '💡', '📈', '🪙', '🌟'],
    mascotParadeEmojis: ['☕', '🥐', '☀️', '💡', '🪙'],
    trophyTitle: 'GOLDEN ESPRESSO MORNING BOOST',
    choreographyLabel: 'Aroma Kopi Emas & Sinar Surya Pagi',
    confettiColors: ['#D97706', '#FBBF24', '#78350F', '#FEF3C7', '#FFFFFF'],
    laserColors: ['#FBBF24', '#D97706', '#FFFFFF'],
    motionStyle: 'sacred_mandala',
    audioSynthStyle: 'gentle_harp',
    description: 'Kehangatan secangkir kopi emas di pagi hari disertai koin rezeki pembuka hari.',
    celebrationHeadline: '☕ SELAMAT PAGI & SEMANGAT MENJEMPUT REZEKI!',
    celebrationSubtext: 'Awali hari Anda dengan traktiran spesial dan energi positif dari Bank Nusantara.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '☕',
  },
  {
    id: 'konser_musik_rock_edm',
    name: 'Konser Stadion Musik Akbar (World Tour Headliner)',
    shortBadge: '🎸🎤 Konser Musik Akbar',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '🎸',
    particleEmojis: ['🎸', '🎤', '🥁', '🎹', '🔥', '🎆', '🌟', '✨'],
    mascotParadeEmojis: ['🎸', '🎤', '🥁', '🔥', '🎆'],
    trophyTitle: 'PLATINUM RECORD WORLD TOUR TROPHY',
    choreographyLabel: 'Pyro Api Panggung Stadion & Laser Konser',
    confettiColors: ['#EF4444', '#FBBF24', '#A855F7', '#38BDF8', '#FFFFFF'],
    laserColors: ['#EF4444', '#FBBF24', '#A855F7'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Kemeriahan panggung utama tur konser dunia dengan semburan api dan piringan hitam platinum.',
    celebrationHeadline: '🎸 ROCKSTAR WORLD TOUR • PANGGUNG STADION 100.000X!',
    celebrationSubtext: 'Sorak gemuruh puluhan ribu penonton mengiringi hadiah spesial Anda!',
    theme: 'rose',
    paletteStyle: 'sunset_fire',
    cornerOrnamentSymbol: '🎸',
  },
  {
    id: 'kuliner_nusantara_feast',
    name: 'Pesta Jamuan Kuliner Kerajaan Nusantara',
    shortBadge: '🍽️👑 Jamuan Kerajaan',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '🍽️',
    particleEmojis: ['🍽️', '🍖', '🍰', '🥂', '👑', '🍍', '✨', '🎉'],
    mascotParadeEmojis: ['🍽️', '🍰', '🥂', '👑', '🍖'],
    trophyTitle: 'ROYAL BANQUET GOLDEN PLATTER',
    choreographyLabel: 'Parade Hidangan Istana & Piala Jamuan Emas',
    confettiColors: ['#F59E0B', '#10B981', '#EF4444', '#FDE047', '#FFFFFF'],
    laserColors: ['#F59E0B', '#10B981', '#FDE047'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Meja perjamuan agung istana dengan hidangan lezat dan piala emas kemakmuran.',
    celebrationHeadline: '🍽️ ROYAL BANQUET FEAST • JAMUAN KEHORMATAN!',
    celebrationSubtext: 'Selamat menikmati perjamuan dan hadiah berlimpah dari Bank Nusantara.',
    theme: 'amber',
    paletteStyle: 'royal_gold',
    cornerOrnamentSymbol: '🍽️',
  },
  {
    id: 'petualang_puncak_gunung',
    name: 'Penakluk Puncak Tertinggi (Summit Conqueror)',
    shortBadge: '🏔️🚩 Penakluk Puncak',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '🏔️',
    particleEmojis: ['🏔️', '🚩', '🦅', '☀️', '🏆', '🌟', '🧭', '✨'],
    mascotParadeEmojis: ['🏔️', '🚩', '🦅', '🏆', '🧭'],
    trophyTitle: 'EVEREST SUMMIT CONQUEROR FLAG',
    choreographyLabel: 'Bendera Puncak Tertinggi & Elang Gunung',
    confettiColors: ['#38BDF8', '#FBBF24', '#FFFFFF', '#10B981'],
    laserColors: ['#38BDF8', '#FBBF24', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    audioSynthStyle: 'royal_fanfare',
    description: 'Mengibarkan bendera kemenangan di puncak gunung tertinggi di atas awan.',
    celebrationHeadline: '🏔️ SUMMIT CONQUEROR • DI PUNCAK TERTINGGI!',
    celebrationSubtext: 'Tidak ada puncak yang terlalu tinggi! Selamat atas pencapaian luar biasa Anda.',
    theme: 'indigo',
    paletteStyle: 'sky_ice',
    cornerOrnamentSymbol: '🏔️',
  },
  {
    id: 'atlet_stadion_gol_emas',
    name: 'Gol Emas Stadion & Juara Liga Dunia',
    shortBadge: '⚽🏆 Gol Emas Juara',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '⚽',
    particleEmojis: ['⚽', '🏆', '🥇', '🥅', '🎆', '🎉', '👑', '✨'],
    mascotParadeEmojis: ['⚽', '🏆', '🥇', '👑', '🎆'],
    trophyTitle: 'GOLDEN BOOT & WORLD CUP TROPHY',
    choreographyLabel: 'Tendangan Bola Api Emas & Sorot Lampu Stadion',
    confettiColors: ['#10B981', '#FDE047', '#38BDF8', '#FFFFFF'],
    laserColors: ['#10B981', '#FDE047', '#FFFFFF'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Selebrasi gol penentu di final stadion akbar dengan sepatu emas dan piala dunia.',
    celebrationHeadline: '⚽ GOOOAL! GOLDEN BOOT WORLD CHAMPION!',
    celebrationSubtext: 'Kemenangan dramatis di menit akhir dengan hadiah juara penuh!',
    theme: 'emerald',
    paletteStyle: 'emerald_gold',
    cornerOrnamentSymbol: '⚽',
  },
  {
    id: 'kreator_viral_trending_1',
    name: 'Kreator Diamond Play Button & Trending #1',
    shortBadge: '▶️💎 Trending #1 Diamond',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '💎',
    particleEmojis: ['💎', '🎬', '🔥', '🚀', '👑', '🌟', '💖', '✨'],
    mascotParadeEmojis: ['💎', '🎬', '🚀', '👑', '🔥'],
    trophyTitle: '100M DIAMOND CREATOR PLAY BUTTON',
    choreographyLabel: 'Plakat Berlian 3D & Ledakan Like Jutaan Penonton',
    confettiColors: ['#EF4444', '#38BDF8', '#FDE047', '#FFFFFF'],
    laserColors: ['#EF4444', '#38BDF8', '#FDE047'],
    motionStyle: 'festival_carnival',
    audioSynthStyle: 'festive_party',
    description: 'Penghargaan plakat berlian kreator 100 juta pengikut dengan roket trending #1.',
    celebrationHeadline: '💎 TRENDING #1 • DIAMOND CREATOR AWARD!',
    celebrationSubtext: 'Karya dan prestasi Anda bersinar di puncak popularitas!',
    theme: 'rose',
    paletteStyle: 'red_white',
    cornerOrnamentSymbol: '🎬',
  },
  {
    id: 'none',
    name: 'Tanpa Efek Perayaan Khusus (Tampilan Standar)',
    shortBadge: '✉️ Standar Resmi',
    category: 'profesi_gaya_hidup',
    categoryLabel: 'Pencapaian & Gaya Hidup',
    primaryEmoji: '✉️',
    particleEmojis: ['✨'],
    mascotParadeEmojis: ['✉️'],
    trophyTitle: 'BANK NUSANTARA OFFICIAL DELIVERY',
    choreographyLabel: 'Tampilan Formal Tanpa Efek Panggung',
    confettiColors: ['#FBBF24', '#FFFFFF'],
    laserColors: ['#FBBF24', '#FFFFFF', '#F59E0B'],
    motionStyle: 'none',
    audioSynthStyle: 'silent',
    description: 'Menggunakan tampilan formal Bank Nusantara tanpa hiasan perayaan maupun panggung sinematik.',
    celebrationHeadline: 'SURAT & HADIAH RESMI BANK NUSANTARA',
    celebrationSubtext: 'Kiriman resmi telah diterima di rekening Anda.',
    theme: 'amber',
    paletteStyle: 'none_slate',
    cornerOrnamentSymbol: '✦',
  },
];

const COMBINED_CATALOG_SEEDS: (CompactCelebSeed | ExtraCompactCelebSeed)[] = [
  ...CATALOG_SEEDS.filter((s) => s.id !== 'none'),
  ...EXTRA_CELEBRATION_SEEDS_200,
  ...CATALOG_SEEDS.filter((s) => s.id === 'none'),
];

export const CELEBRATION_EFFECTS_CATALOG: CelebrationEffectProfile[] =
  COMBINED_CATALOG_SEEDS.map((seed) => buildCatalogEntry(seed as CompactCelebSeed));

const LEGACY_EFFECT_MAP: Record<string, string> = {
  confetti: 'ulang_tahun_meriah',
  gold_rain: 'hujan_emas_sultan',
  fireworks: 'tahun_baru_fireworks',
  none: 'none',
};

export const getCelebrationEffectProfile = (effectId?: string | null): CelebrationEffectProfile => {
  if (!effectId) {
    return CELEBRATION_EFFECTS_CATALOG[0];
  }
  const mappedId = LEGACY_EFFECT_MAP[effectId] || effectId;
  const found = CELEBRATION_EFFECTS_CATALOG.find((c) => c.id === mappedId);
  return found || CELEBRATION_EFFECTS_CATALOG[0];
};

// ============================================================================
// TRACKING TIMER KONFETI & SYNTH AUDIO AGAR BISA DIHENTIKAN SEKETIKA (FORCE CLEAR)
// ============================================================================
let activeConfettiTimeoutIds: number[] = [];
let sharedAudioCtx: AudioContext | null = null;
let sharedMasterGain: GainNode | null = null;
let activeOscillators: OscillatorNode[] = [];

const getOrCreateAudioContext = (): { ctx: AudioContext; masterGain: GainNode } | null => {
  if (typeof window === 'undefined') return null;
  try {
    if (!sharedAudioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        sharedAudioCtx = new AudioCtx();
        sharedMasterGain = sharedAudioCtx.createGain();
        sharedMasterGain.gain.setValueAtTime(1, sharedAudioCtx.currentTime);
        sharedMasterGain.connect(sharedAudioCtx.destination);
      }
    }
    if (!sharedAudioCtx) return null;
    if (!sharedMasterGain) {
      sharedMasterGain = sharedAudioCtx.createGain();
      sharedMasterGain.gain.setValueAtTime(1, sharedAudioCtx.currentTime);
      sharedMasterGain.connect(sharedAudioCtx.destination);
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return { ctx: sharedAudioCtx, masterGain: sharedMasterGain };
  } catch {
    return null;
  }
};

export const stopAllCelebrationEffectsAndAudio = (): void => {
  // 1. Batalkan seluruh timer salvo confetti yang masih antre
  if (typeof window !== 'undefined') {
    activeConfettiTimeoutIds.forEach((tid) => window.clearTimeout(tid));
    activeConfettiTimeoutIds = [];
  }

  // 2. Bersihkan kanvas confetti seketika
  try {
    confetti.reset();
  } catch {
    /* ignore */
  }

  // 3. Hentikan paksa semua oscillator synthesizer yang masih berbunyi
  try {
    activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        /* already stopped */
      }
    });
    activeOscillators = [];
    if (sharedAudioCtx && sharedMasterGain) {
      sharedMasterGain.gain.cancelScheduledValues(sharedAudioCtx.currentTime);
      sharedMasterGain.gain.setValueAtTime(0, sharedAudioCtx.currentTime);
      // Restore master gain slightly after for future blasts
      window.setTimeout(() => {
        if (sharedAudioCtx && sharedMasterGain) {
          sharedMasterGain.gain.setValueAtTime(1, sharedAudioCtx.currentTime);
        }
      }, 60);
    }
  } catch {
    /* ignore */
  }

  // 4. Hentikan suara Web Speech TTS seketika
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }
  }
};

export const speakCelebrationTtsAnnouncement = (
  text: string,
  volumePercent: number = 100
): void => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const clean = text.trim();
  if (!clean) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(clean);
    utter.lang = 'id-ID';
    utter.rate = 1.03;
    utter.pitch = 1.05;
    utter.volume = Math.max(0.05, Math.min(1, volumePercent / 100));
    window.speechSynthesis.speak(utter);
  } catch {
    /* ignore TTS failure */
  }
};

export const playCelebrationBuildupRiserSynth = (volumePercent: number = 100): void => {
  const audio = getOrCreateAudioContext();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  const volScale = Math.max(0.05, Math.min(1, volumePercent / 100));
  try {
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(volScale, now);

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.58);
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14 * volScale, now + 0.48);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.62);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(now);
    osc.stop(now + 0.64);
    activeOscillators.push(osc);

    [0, 0.19, 0.38].forEach((offset, idx) => {
      const tickOsc = ctx.createOscillator();
      const tickGain = ctx.createGain();
      tickOsc.type = 'triangle';
      tickOsc.frequency.setValueAtTime(523.25 + idx * 130, now + offset);
      tickGain.gain.setValueAtTime(0.14 * volScale, now + offset);
      tickGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.12);
      tickOsc.connect(tickGain);
      tickGain.connect(masterGain);
      tickOsc.start(now + offset);
      tickOsc.stop(now + offset + 0.13);
      activeOscillators.push(tickOsc);
    });
  } catch {
    /* ignore audio errors */
  }
};

export const playCelebrationFanfareSynth = (
  effectId?: string | null,
  styleOverride?: CelebrationAudioSynthStyle | 'auto_theme',
  volumePercent: number = 100
): void => {
  const profile = getCelebrationEffectProfile(effectId);
  const resolvedStyle: CelebrationAudioSynthStyle =
    styleOverride && styleOverride !== 'auto_theme'
      ? styleOverride
      : profile.audioSynthStyle;

  if (profile.id === 'none' || resolvedStyle === 'silent') return;
  const audio = getOrCreateAudioContext();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  const volScale = Math.max(0.05, Math.min(1, volumePercent / 100));

  try {
    const now = ctx.currentTime;
    masterGain.gain.setValueAtTime(volScale, now);

    // 1. Sub-Bass Impact Drop
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(135, now);
    bassOsc.frequency.exponentialRampToValueAtTime(36, now + 0.55);
    bassGain.gain.setValueAtTime(0.28 * volScale, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    bassOsc.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(now);
    bassOsc.stop(now + 0.62);
    activeOscillators.push(bassOsc);

    // 2. Thematic Melodic Fanfare Arpeggio (16 Styles)
    const melodies: Record<
      Exclude<CelebrationAudioSynthStyle, 'silent'>,
      { notes: number[]; wave: OscillatorType; stepSec: number }
    > = {
      royal_fanfare: {
        notes: [261.63, 329.63, 392.0, 523.25, 659.25, 783.99, 1046.5],
        wave: 'triangle',
        stepSec: 0.09,
      },
      gamelan_royal: {
        notes: [293.66, 329.63, 392.0, 440.0, 587.33, 659.25, 783.99],
        wave: 'sine',
        stepSec: 0.11,
      },
      patriot_march: {
        notes: [392.0, 392.0, 523.25, 659.25, 783.99, 659.25, 1046.5],
        wave: 'sawtooth',
        stepSec: 0.1,
      },
      sacred_chime: {
        notes: [293.66, 369.99, 440.0, 587.33, 739.99, 880.0],
        wave: 'sine',
        stepSec: 0.12,
      },
      cyber_synth: {
        notes: [220.0, 330.0, 440.0, 659.25, 880.0, 1318.5],
        wave: 'sawtooth',
        stepSec: 0.075,
      },
      quantum_ai_pulse: {
        notes: [246.94, 369.99, 493.88, 739.99, 987.77, 1479.98],
        wave: 'sine',
        stepSec: 0.065,
      },
      anime_power: {
        notes: [329.63, 392.0, 493.88, 659.25, 783.99, 987.77, 1318.5],
        wave: 'square',
        stepSec: 0.07,
      },
      arcade_8bit: {
        notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1567.98],
        wave: 'square',
        stepSec: 0.06,
      },
      edm_stadium_drop: {
        notes: [196.0, 293.66, 392.0, 587.33, 783.99, 1174.66],
        wave: 'sawtooth',
        stepSec: 0.07,
      },
      racing_nitro_rev: {
        notes: [185.0, 277.18, 369.99, 554.37, 739.99, 1108.73],
        wave: 'sawtooth',
        stepSec: 0.055,
      },
      stadium_champion_horn: {
        notes: [349.23, 440.0, 523.25, 698.46, 880.0, 1046.5, 1396.91],
        wave: 'triangle',
        stepSec: 0.09,
      },
      mythic_orchestra: {
        notes: [220.0, 261.63, 329.63, 440.0, 523.25, 659.25, 880.0],
        wave: 'triangle',
        stepSec: 0.1,
      },
      thunder_storm_bass: {
        notes: [110.0, 146.83, 220.0, 293.66, 440.0, 587.33],
        wave: 'sawtooth',
        stepSec: 0.085,
      },
      cosmic_arp: {
        notes: [261.63, 311.13, 392.0, 466.16, 523.25, 622.25, 783.99, 1046.5],
        wave: 'sine',
        stepSec: 0.08,
      },
      festive_party: {
        notes: [349.23, 440.0, 523.25, 698.46, 880.0, 1046.5],
        wave: 'triangle',
        stepSec: 0.085,
      },
      gentle_harp: {
        notes: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25, 783.99],
        wave: 'sine',
        stepSec: 0.1,
      },
    };

    const conf = melodies[resolvedStyle] || melodies.royal_fanfare;

    conf.notes.forEach((freq, idx) => {
      const start = now + idx * conf.stepSec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = conf.wave;
      osc.frequency.setValueAtTime(freq, start);
      const peakGain = (conf.wave === 'square' || conf.wave === 'sawtooth' ? 0.08 : 0.14) * volScale;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.linearRampToValueAtTime(peakGain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(start);
      osc.stop(start + 0.48);
      activeOscillators.push(osc);
    });
  } catch {
    /* ignore audio errors */
  }
};

export const playCelebrationComboHitSynth = (
  comboCount: number,
  volumePercent: number = 100
): void => {
  const audio = getOrCreateAudioContext();
  if (!audio) return;
  const { ctx, masterGain } = audio;
  const volScale = Math.max(0.05, Math.min(1, volumePercent / 100));
  try {
    const now = ctx.currentTime;
    const baseFreq = 440 + Math.min(comboCount, 24) * 32;
    [baseFreq, baseFreq * 1.25, baseFreq * 1.5].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);
      gain.gain.setValueAtTime(0.12 * volScale, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.28);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.3);
      activeOscillators.push(osc);
    });
  } catch {
    /* ignore audio errors */
  }
};

// ============================================================================
// KOREOGRAFI MULTI-SALVO CANVAS CONFETTI HINGGA 1.000.000X HYPER GODLIKE
// ============================================================================
export const triggerCanvasConfettiForCelebration = (
  effectId?: string | null,
  intensityLevel: CelebrationIntensityLevel = '100000x'
): void => {
  const profile = getCelebrationEffectProfile(effectId);
  if (profile.id === 'none' || profile.motionStyle === 'none') return;

  const colors = profile.confettiColors;
  const mult =
    intensityLevel === '1000000x'
      ? 1.9
      : intensityLevel === '100000x'
      ? 1.45
      : intensityLevel === '10000x'
      ? 1.15
      : 0.75;

  const queueConfetti = (delayMs: number, fn: () => void) => {
    if (typeof window === 'undefined') return;
    const tid = window.setTimeout(() => {
      try {
        fn();
      } catch {
        /* ignore */
      }
    }, delayMs);
    activeConfettiTimeoutIds.push(tid);
  };

  try {
    // Gelombang 1: Ledakan Inti Pusat (Super Center Nova)
    confetti({
      particleCount: Math.round(130 * mult),
      spread: 115,
      startVelocity: 55,
      origin: { x: 0.5, y: 0.52 },
      colors,
      scalar: 1.25,
    });

    // Gelombang 2: Salvo Meriam Kembar Kiri & Kanan
    queueConfetti(220, () => {
      confetti({
        particleCount: Math.round(80 * mult),
        angle: 62,
        spread: 72,
        startVelocity: 62,
        origin: { x: 0.04, y: 0.78 },
        colors,
      });
      confetti({
        particleCount: Math.round(80 * mult),
        angle: 118,
        spread: 72,
        startVelocity: 62,
        origin: { x: 0.96, y: 0.78 },
        colors,
      });
    });

    // Gelombang 3: Kembang Api Udara Kiri-Atas & Kanan-Atas
    queueConfetti(480, () => {
      confetti({
        particleCount: Math.round(75 * mult),
        spread: 360,
        startVelocity: 38,
        origin: { x: 0.24, y: 0.28 },
        colors,
        scalar: 1.15,
      });
      confetti({
        particleCount: Math.round(75 * mult),
        spread: 360,
        startVelocity: 38,
        origin: { x: 0.76, y: 0.28 },
        colors,
        scalar: 1.15,
      });
    });

    if (
      intensityLevel === '10000x' ||
      intensityLevel === '100000x' ||
      intensityLevel === '1000000x'
    ) {
      queueConfetti(780, () => {
        confetti({
          particleCount: Math.round(95 * mult),
          spread: 150,
          startVelocity: 25,
          gravity: 0.75,
          origin: { x: 0.5, y: 0.08 },
          colors,
          scalar: 1.3,
        });
      });
    }

    if (intensityLevel === '100000x' || intensityLevel === '1000000x') {
      queueConfetti(1120, () => {
        confetti({
          particleCount: 110,
          angle: 75,
          spread: 85,
          startVelocity: 65,
          origin: { x: 0.15, y: 0.85 },
          colors,
          scalar: 1.35,
        });
        confetti({
          particleCount: 110,
          angle: 105,
          spread: 85,
          startVelocity: 65,
          origin: { x: 0.85, y: 0.85 },
          colors,
          scalar: 1.35,
        });
      });

      queueConfetti(1480, () => {
        confetti({
          particleCount: 140,
          spread: 360,
          startVelocity: 48,
          origin: { x: 0.5, y: 0.38 },
          colors,
          scalar: 1.4,
        });
      });
    }

    if (intensityLevel === '1000000x') {
      queueConfetti(1820, () => {
        confetti({
          particleCount: 160,
          spread: 360,
          startVelocity: 55,
          origin: { x: 0.2, y: 0.5 },
          colors,
          scalar: 1.5,
        });
        confetti({
          particleCount: 160,
          spread: 360,
          startVelocity: 55,
          origin: { x: 0.8, y: 0.5 },
          colors,
          scalar: 1.5,
        });
      });
    }
  } catch {
    /* ignore canvas-confetti errors */
  }
};

export const triggerComboClickConfettiAtPoint = (
  effectId: string | null | undefined,
  normX: number,
  normY: number
): void => {
  const profile = getCelebrationEffectProfile(effectId);
  try {
    confetti({
      particleCount: 55,
      spread: 110,
      startVelocity: 42,
      origin: {
        x: Math.max(0.05, Math.min(0.95, normX)),
        y: Math.max(0.05, Math.min(0.95, normY)),
      },
      colors: profile.confettiColors,
      scalar: 1.25,
    });
  } catch {
    /* ignore */
  }
};
