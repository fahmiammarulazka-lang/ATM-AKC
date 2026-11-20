/**
 * arcadeMinigamesCatalog.ts
 * Katalog Lengkap 12 Minigame Arcade + 100 Target Skor Independen (Total 1.200 Target Hadiah)
 * - Game #1: Dino Chrome (Skor Target 1 = 500 poin s/d Target 100 = 10.000 poin)
 * - Game #2–#12: 11 Minigame Arcade Lebih Menantang dengan Hadiah Setara Dino Chrome
 */

export type ArcadeGameId =
  | 'dino_chrome'
  | 'flappy_garuda'
  | 'snake_turbo'
  | 'meteor_dodger'
  | 'brick_breaker'
  | 'space_shooter'
  | 'tetris_kilat'
  | 'crossy_nusantara'
  | 'laser_jump_dash'
  | 'catch_falling_gold'
  | 'fruit_slice_ninja'
  | 'cyber_maze_runner';

export interface ArcadeGameDefinition {
  id: ArcadeGameId;
  number: number;
  title: string;
  emoji: string;
  difficultyLabel: 'Standar Arcade' | 'Sulit' | 'Sangat Sulit' | 'Ekstrem';
  genre: string;
  controlsDesktop: string;
  controlsMobile: string;
  shortRule: string;
  accentClass: string;
  badgeClass: string;
}

export const ARCADE_MINIGAME_ENTRY_COST = 500_000;

export const ARCADE_TARGET_COUNT = 100;

export const getArcadeTargetScore = (targetNumber: number): number => {
  const clamped = Math.max(1, Math.min(ARCADE_TARGET_COUNT, Math.round(targetNumber)));
  if (clamped === 1) return 500;
  if (clamped === 100) return 10_000;
  const raw = 500 + ((clamped - 1) / 99) * 9_500;
  return Math.round(raw / 10) * 10;
};

export interface ArcadeTargetReward {
  targetNumber: number;
  requiredScore: number;
  cashReward: number;
  voucherReward: number;
  tierLabel: string;
}

export const getArcadeTargetReward = (targetNumber: number): ArcadeTargetReward => {
  const t = Math.max(1, Math.min(ARCADE_TARGET_COUNT, Math.round(targetNumber)));
  const requiredScore = getArcadeTargetScore(t);

  if (t === 1) {
    return {
      targetNumber: 1,
      requiredScore,
      cashReward: 300_000,
      voucherReward: 1,
      tierLabel: 'Target 1 (Pemula)',
    };
  }
  if (t <= 19) {
    return {
      targetNumber: t,
      requiredScore,
      cashReward: 500_000,
      voucherReward: 1,
      tierLabel: 'Target 2–19 (Penantang)',
    };
  }
  if (t <= 50) {
    return {
      targetNumber: t,
      requiredScore,
      cashReward: 1_000_000,
      voucherReward: 3,
      tierLabel: 'Target 20–50 (Pro)',
    };
  }
  if (t <= 74) {
    return {
      targetNumber: t,
      requiredScore,
      cashReward: 1_500_000,
      voucherReward: 5,
      tierLabel: 'Target 51–74 (Master)',
    };
  }
  return {
    targetNumber: t,
    requiredScore,
    cashReward: 2_500_000,
    voucherReward: 7,
    tierLabel: 'Target 75–100 (Legenda)',
  };
};

export const ARCADE_MINIGAMES_12: ArcadeGameDefinition[] = [
  {
    id: 'dino_chrome',
    number: 1,
    title: 'Dino Chrome Nusantara',
    emoji: '🦖',
    difficultyLabel: 'Standar Arcade',
    genre: 'Endless Runner',
    controlsDesktop: 'Spasi / Panah Atas = Lompat · Panah Bawah = Menunduk',
    controlsMobile: 'Tombol Lompat & Menunduk di bawah layar',
    shortRule: 'Lompati kaktus gurun & hindari burung terbang. Kecepatan terus naik seiring skor!',
    accentClass: 'border-emerald-400/70 bg-emerald-950/35',
    badgeClass: 'bg-emerald-400 text-slate-950',
  },
  {
    id: 'flappy_garuda',
    number: 2,
    title: 'Flappy Garuda',
    emoji: '🦅',
    difficultyLabel: 'Sulit',
    genre: 'Precision Flapper',
    controlsDesktop: 'Spasi / Panah Atas / Klik Layar = Kepak Sayap',
    controlsMobile: 'Tap Kanvas atau Tombol Kepak Sayap',
    shortRule: 'Terbangkan Garuda melewati celah pilar sempit & hembusan angin tanpa menyentuh pilar.',
    accentClass: 'border-amber-400/70 bg-amber-950/35',
    badgeClass: 'bg-amber-400 text-slate-950',
  },
  {
    id: 'snake_turbo',
    number: 3,
    title: 'Snake Turbo 3000',
    emoji: '🐍',
    difficultyLabel: 'Sulit',
    genre: 'Turbo Grid Snake',
    controlsDesktop: 'Panah / WASD = Belok',
    controlsMobile: 'Tombol Arah D-Pad 4 Arah',
    shortRule: 'Makan koin emas (+100 poin) & permata (+250 poin), hindari dinding tembok & batu ranjau.',
    accentClass: 'border-lime-400/70 bg-lime-950/35',
    badgeClass: 'bg-lime-400 text-slate-950',
  },
  {
    id: 'meteor_dodger',
    number: 4,
    title: 'Meteor Dodger Storm',
    emoji: '☄️',
    difficultyLabel: 'Sulit',
    genre: 'Bullet Hell Dodger',
    controlsDesktop: 'Panah Kiri/Kanan atau A/D = Geser Pesawat',
    controlsMobile: 'Tombol Kiri / Kanan Responsif',
    shortRule: 'Hindari hujan meteor berkecepatan tinggi & kumpulkan inti energi bintang untuk skor berlipat.',
    accentClass: 'border-orange-400/70 bg-orange-950/35',
    badgeClass: 'bg-orange-400 text-slate-950',
  },
  {
    id: 'brick_breaker',
    number: 5,
    title: 'Brick Breaker Hyper',
    emoji: '🧱',
    difficultyLabel: 'Sulit',
    genre: 'Hyper Breakout',
    controlsDesktop: 'Panah Kiri/Kanan atau Mouse = Gerak Papan',
    controlsMobile: 'Tombol Geser Kiri / Kanan',
    shortRule: 'Pantulkan bola cepat menghancurkan blok baja berlapis. Jangan sampai bola jatuh!',
    accentClass: 'border-rose-400/70 bg-rose-950/35',
    badgeClass: 'bg-rose-400 text-slate-950',
  },
  {
    id: 'space_shooter',
    number: 6,
    title: 'Space Shooter Galaksi',
    emoji: '🚀',
    difficultyLabel: 'Sangat Sulit',
    genre: 'Wave Shooter',
    controlsDesktop: 'Panah/AD = Gerak · Spasi/Auto = Tembak Laser',
    controlsMobile: 'Tombol Kiri / Kanan + Tembak',
    shortRule: 'Hancurkan skuadron alien penyerang sebelum menabrak atau menembus pertahanan.',
    accentClass: 'border-cyan-400/70 bg-cyan-950/35',
    badgeClass: 'bg-cyan-400 text-slate-950',
  },
  {
    id: 'tetris_kilat',
    number: 7,
    title: 'Tetris Kilat Pro',
    emoji: '🟦',
    difficultyLabel: 'Sangat Sulit',
    genre: 'Speed Puzzle',
    controlsDesktop: 'Panah Kiri/Kanan = Geser · Atas = Putar · Bawah = Jatuhkan',
    controlsMobile: 'Tombol Kiri / Putar / Turun / Kanan',
    shortRule: 'Susun balok tetromino berkecepatan tinggi. Setiap baris penuh meledak jadi skor besar!',
    accentClass: 'border-indigo-400/70 bg-indigo-950/35',
    badgeClass: 'bg-indigo-400 text-slate-950',
  },
  {
    id: 'crossy_nusantara',
    number: 8,
    title: 'Crossy Jalan Nusantara',
    emoji: '🐸',
    difficultyLabel: 'Sangat Sulit',
    genre: 'Lane Hopper',
    controlsDesktop: 'Panah / WASD = Lompat Maju/Mundur/Samping',
    controlsMobile: 'D-Pad 4 Arah Sentuh Cepat',
    shortRule: 'Seberangi jalan tol berkecepatan tinggi dengan truk & bus ngebut. 1 langkah maju = +120 poin!',
    accentClass: 'border-teal-400/70 bg-teal-950/35',
    badgeClass: 'bg-teal-400 text-slate-950',
  },
  {
    id: 'laser_jump_dash',
    number: 9,
    title: 'Laser Jump Dash',
    emoji: '⚡',
    difficultyLabel: 'Sangat Sulit',
    genre: 'Rhythm Geometry Dash',
    controlsDesktop: 'Spasi / Panah Atas / Klik = Lompat Rintangan',
    controlsMobile: 'Tombol Lompat Cepat / Tap Kanvas',
    shortRule: 'Meluncur dengan kecepatan kilat melompati duri laser ganda & menara energi.',
    accentClass: 'border-fuchsia-400/70 bg-fuchsia-950/35',
    badgeClass: 'bg-fuchsia-400 text-slate-950',
  },
  {
    id: 'catch_falling_gold',
    number: 10,
    title: 'Catch The Falling Gold',
    emoji: '🪙',
    difficultyLabel: 'Sulit',
    genre: 'Reflex Catcher',
    controlsDesktop: 'Panah Kiri/Kanan atau AD = Gerak Keranjang Sultan',
    controlsMobile: 'Tombol Kiri / Kanan Kecepatan Tinggi',
    shortRule: 'Tangkap koin & berlian jatuh secepat kilat, hindari bom tengkorak merah (3 nyawa)!',
    accentClass: 'border-yellow-400/70 bg-yellow-950/35',
    badgeClass: 'bg-yellow-400 text-slate-950',
  },
  {
    id: 'fruit_slice_ninja',
    number: 11,
    title: 'Fruit Slice Ninja',
    emoji: '🍉',
    difficultyLabel: 'Sangat Sulit',
    genre: 'Reflex Slicer',
    controlsDesktop: 'Klik / Gerakkan Kursor menebas buah yang terlempar',
    controlsMobile: 'Tap / Usap Buah Terbang (Hindari Bom!)',
    shortRule: 'Tebas buah segar & emas di udara untuk kombo skor. Menyentuh bom langsung Game Over!',
    accentClass: 'border-pink-400/70 bg-pink-950/35',
    badgeClass: 'bg-pink-400 text-slate-950',
  },
  {
    id: 'cyber_maze_runner',
    number: 12,
    title: 'Cyber Maze Runner',
    emoji: '👾',
    difficultyLabel: 'Ekstrem',
    genre: 'Stealth Maze Chase',
    controlsDesktop: 'Panah / WASD = Gerak dalam Labirin Neon',
    controlsMobile: 'Tombol D-Pad 4 Arah',
    shortRule: 'Ambil seluruh kristal data di labirin sambil menghindari pengejaran 3 drone pemburu!',
    accentClass: 'border-sky-400/70 bg-sky-950/35',
    badgeClass: 'bg-sky-400 text-slate-950',
  },
];
