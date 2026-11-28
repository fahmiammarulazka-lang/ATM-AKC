export interface ProfileAvatarPreset {
  id: string;
  label: string;
  bgClass: string;
  accentClass: string;
  symbol: 'initials' | 'crown' | 'shield' | 'gem' | 'flame' | 'briefcase' | 'landmark' | 'sparkles';
}

export interface ProfileAvatarFrame {
  id: string;
  label: string;
  description: string;
  ringClass: string;
  badgeColorClass: string;
  isSpinExclusive?: boolean;
  auraTheme?: 'petir' | 'api' | 'emas' | 'es' | 'galaksi';
  ambientTheme?: 'clean' | 'sapphire' | 'gold' | 'diamond' | 'emerald' | 'flame' | 'violet' | 'obsidian';
  auraCssClass?: string;
  auraGradientClass?: string;
  glowColorHex?: string;
}

export const SPIN_AURA_FRAMES: ProfileAvatarFrame[] = [
  {
    id: 'frame-spin-petir-cyber',
    label: 'Petir Cyber',
    description: 'Rangka cyber neon dengan kumparan Tesla & kilatan petir berkedip bergantian',
    ringClass: 'ring-[3px] ring-cyan-400 ring-offset-2 ring-offset-slate-950 aura-frame-petir-cyber',
    badgeColorClass: 'bg-cyan-500 text-slate-950',
    isSpinExclusive: true,
    auraTheme: 'petir',
    auraCssClass: 'aura-frame-petir-cyber',
    auraGradientClass: 'from-cyan-400 via-sky-500 to-blue-600',
    glowColorHex: '#22d3ee',
  },
  {
    id: 'frame-spin-api-naga',
    label: 'Api Naga',
    description: 'Tanduk & sayap naga bara dengan lidah api bergoyang serta percikan bara naik',
    ringClass: 'ring-[3px] ring-orange-500 ring-offset-2 ring-offset-slate-950 aura-frame-api-naga',
    badgeColorClass: 'bg-gradient-to-r from-orange-500 to-rose-600 text-white',
    isSpinExclusive: true,
    auraTheme: 'api',
    auraCssClass: 'aura-frame-api-naga',
    auraGradientClass: 'from-amber-400 via-orange-500 to-rose-600',
    glowColorHex: '#f97316',
  },
  {
    id: 'frame-spin-emas-imperial',
    label: 'Emas Imperial',
    description: 'Mahkota emas 24K & daun laurel kerajaan dengan kilau cahaya menyapu megah',
    ringClass: 'ring-[3px] ring-amber-400 ring-offset-2 ring-offset-slate-950 aura-frame-emas-imperial',
    badgeColorClass: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950',
    isSpinExclusive: true,
    auraTheme: 'emas',
    auraCssClass: 'aura-frame-emas-imperial',
    auraGradientClass: 'from-yellow-300 via-amber-400 to-amber-600',
    glowColorHex: '#facc15',
  },
  {
    id: 'frame-spin-kristal-es',
    label: 'Kristal Es',
    description: 'Puncak prisma es berlian empat sudut dengan keping salju melayang lembut',
    ringClass: 'ring-[3px] ring-sky-300 ring-offset-2 ring-offset-slate-950 aura-frame-kristal-es',
    badgeColorClass: 'bg-gradient-to-r from-sky-300 to-indigo-400 text-slate-950',
    isSpinExclusive: true,
    auraTheme: 'es',
    auraCssClass: 'aura-frame-kristal-es',
    auraGradientClass: 'from-cyan-200 via-sky-300 to-indigo-400',
    glowColorHex: '#7dd3fc',
  },
  {
    id: 'frame-spin-galaksi-kosmik',
    label: 'Galaksi Kosmik',
    description: 'Cincin orbit planet Saturnus, bulan sabit & kabut nebula bernapas kosmik',
    ringClass: 'ring-[3px] ring-purple-400 ring-offset-2 ring-offset-slate-950 aura-frame-galaksi-kosmik',
    badgeColorClass: 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white',
    isSpinExclusive: true,
    auraTheme: 'galaksi',
    auraCssClass: 'aura-frame-galaksi-kosmik',
    auraGradientClass: 'from-indigo-400 via-purple-500 to-fuchsia-500',
    glowColorHex: '#c084fc',
  },
];

export interface ProfileFeaturedTitle {
  id: string;
  label: string;
  toneClass: string;
  unlockAchievementId: string;
  requirementSummary: string;
  isExclusiveNew?: boolean;
}

export const PROFILE_RENAME_DIAMOND_COST = 50;

export const AVATAR_PRESETS: ProfileAvatarPreset[] = [
  {
    id: 'preset-royal-blue',
    label: 'Royal Blue',
    bgClass: 'bg-gradient-to-br from-blue-600 to-indigo-700',
    accentClass: 'text-white',
    symbol: 'initials',
  },
  {
    id: 'preset-emerald',
    label: 'Emerald Vault',
    bgClass: 'bg-gradient-to-br from-emerald-500 to-teal-700',
    accentClass: 'text-white',
    symbol: 'shield',
  },
  {
    id: 'preset-gold-sovereign',
    label: 'Sovereign Gold',
    bgClass: 'bg-gradient-to-br from-amber-500 to-yellow-600',
    accentClass: 'text-slate-950',
    symbol: 'crown',
  },
  {
    id: 'preset-cyan-diamond',
    label: 'Cyan Diamond',
    bgClass: 'bg-gradient-to-br from-cyan-500 to-sky-700',
    accentClass: 'text-white',
    symbol: 'gem',
  },
  {
    id: 'preset-obsidian',
    label: 'Obsidian Elite',
    bgClass: 'bg-gradient-to-br from-slate-800 to-slate-950',
    accentClass: 'text-amber-300',
    symbol: 'landmark',
  },
  {
    id: 'preset-flame-streak',
    label: 'Flame Streak',
    bgClass: 'bg-gradient-to-br from-orange-500 to-rose-600',
    accentClass: 'text-white',
    symbol: 'flame',
  },
  {
    id: 'preset-violet-exec',
    label: 'Violet Executive',
    bgClass: 'bg-gradient-to-br from-violet-600 to-purple-800',
    accentClass: 'text-white',
    symbol: 'briefcase',
  },
  {
    id: 'preset-aurora-prism',
    label: 'Aurora Prism',
    bgClass: 'bg-gradient-to-br from-indigo-500 via-sky-500 to-teal-500',
    accentClass: 'text-white',
    symbol: 'sparkles',
  },
];

export const AVATAR_FRAMES: ProfileAvatarFrame[] = [
  {
    id: 'frame-clean',
    label: 'Klasik Rapi',
    description: 'Bingkai perak berkilau hidup ringan',
    ringClass: 'ring-2 ring-slate-300 ring-offset-2 ring-offset-white ambient-frame-clean',
    badgeColorClass: 'bg-slate-700 text-white',
    ambientTheme: 'clean',
    glowColorHex: '#cbd5e1',
  },
  {
    id: 'frame-sapphire',
    label: 'Sapphire Bank',
    description: 'Cincin biru institusional bercahaya hidup',
    ringClass: 'ring-[3px] ring-blue-500 ring-offset-2 ring-offset-white ambient-frame-sapphire',
    badgeColorClass: 'bg-blue-600 text-white',
    ambientTheme: 'sapphire',
    glowColorHex: '#3b82f6',
  },
  {
    id: 'frame-gold-royal',
    label: 'Emas 24K',
    description: 'Bingkai emas berkilau hidup',
    ringClass: 'ring-[3px] ring-amber-400 ring-offset-2 ring-offset-amber-50 ambient-frame-gold',
    badgeColorClass: 'bg-amber-500 text-slate-950',
    ambientTheme: 'gold',
    glowColorHex: '#f59e0b',
  },
  {
    id: 'frame-cyan-diamond',
    label: 'Kristal Permata',
    description: 'Bingkai cyan berlian berbinar',
    ringClass: 'ring-[3px] ring-cyan-400 ring-offset-2 ring-offset-cyan-50 ambient-frame-diamond',
    badgeColorClass: 'bg-cyan-600 text-white',
    ambientTheme: 'diamond',
    glowColorHex: '#06b6d4',
  },
  {
    id: 'frame-emerald-guard',
    label: 'Pelindung Zamrud',
    description: 'Bingkai zamrud terenkripsi bercahaya',
    ringClass: 'ring-[3px] ring-emerald-400 ring-offset-2 ring-offset-emerald-50 ambient-frame-emerald',
    badgeColorClass: 'bg-emerald-600 text-white',
    ambientTheme: 'emerald',
    glowColorHex: '#10b981',
  },
  {
    id: 'frame-crimson-flame',
    label: 'Api Streak',
    description: 'Bingkai energi streak menyala ringan',
    ringClass: 'ring-[3px] ring-orange-500 ring-offset-2 ring-offset-orange-50 ambient-frame-flame',
    badgeColorClass: 'bg-orange-600 text-white',
    ambientTheme: 'flame',
    glowColorHex: '#f97316',
  },
  {
    id: 'frame-violet-prestige',
    label: 'Violet Prestige',
    description: 'Bingkai eksekutif berkilau ungu',
    ringClass: 'ring-[3px] ring-violet-500 ring-offset-2 ring-offset-violet-50 ambient-frame-violet',
    badgeColorClass: 'bg-violet-600 text-white',
    ambientTheme: 'violet',
    glowColorHex: '#8b5cf6',
  },
  {
    id: 'frame-obsidian-vip',
    label: 'Obsidian VIP',
    description: 'Bingkai gelap monokrom dengan kilap emas',
    ringClass: 'ring-[3px] ring-slate-900 ring-offset-2 ring-offset-slate-100 ambient-frame-obsidian',
    badgeColorClass: 'bg-slate-900 text-amber-300',
    ambientTheme: 'obsidian',
    glowColorHex: '#facc15',
  },
];

export const FEATURED_TITLES: ProfileFeaturedTitle[] = [
  {
    id: 'title-nasabah-prioritas',
    label: 'Nasabah Prioritas',
    toneClass: 'bg-blue-50 text-blue-800 border-blue-200',
    unlockAchievementId: 'ach-nasabah-prioritas',
    requirementSummary: 'Saldo rekening mencapai minimal Rp 10.000.000',
  },
  {
    id: 'title-kolektor-emas',
    label: 'Kolektor Emas 24K',
    toneClass: 'bg-amber-50 text-amber-800 border-amber-200',
    unlockAchievementId: 'ach-kolektor-emas',
    requirementSummary: 'Memiliki simpanan Emas Digital minimal 5 gram',
  },
  {
    id: 'title-penjaga-streak',
    label: 'Penjaga Api Streak',
    toneClass: 'bg-orange-50 text-orange-800 border-orange-200',
    unlockAchievementId: 'ach-penjaga-streak',
    requirementSummary: 'Mencapai Streak Harian Loyalty minimal 7 hari',
  },
  {
    id: 'title-pemburu-diamond',
    label: 'Pemburu Permata',
    toneClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    unlockAchievementId: 'ach-pemburu-permata',
    requirementSummary: 'Mengumpulkan saldo minimal 250 Permata (Diamond)',
  },
  {
    id: 'title-saudagar-nusantara',
    label: 'Saudagar Nusantara',
    toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    unlockAchievementId: 'ach-saudagar-nusantara',
    requirementSummary: 'Menyelesaikan minimal 25 kali transaksi keuangan',
  },
  {
    id: 'title-investor-ulung',
    label: 'Investor Ulung',
    toneClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    unlockAchievementId: 'ach-investor-ulung',
    requirementSummary: 'Memiliki minimal 2 Deposito aktif atau total pokok Rp 5.000.000+',
  },
  {
    id: 'title-penjelajah-misi',
    label: 'Penjelajah 100 Misi',
    toneClass: 'bg-violet-50 text-violet-800 border-violet-200',
    unlockAchievementId: 'ach-penjelajah-misi',
    requirementSummary: 'Mengklaim minimal 15 misi harian atau Loyalty',
  },
  {
    id: 'title-pioner-digital',
    label: 'Pioner Digital QRIS',
    toneClass: 'bg-slate-100 text-slate-800 border-slate-300',
    unlockAchievementId: 'ach-pioner-qris',
    requirementSummary: 'Menyelesaikan minimal 5 transaksi atau pembayaran QRIS',
  },
  {
    id: 'title-sultan-nusantara',
    label: 'Sultan Nusantara',
    toneClass: 'bg-yellow-50 text-yellow-900 border-yellow-300',
    unlockAchievementId: 'ach-sultan-nusantara',
    requirementSummary: 'Total aset bersih (Saldo + Emas + Deposito + Kantong) Rp 100.000.000+',
    isExclusiveNew: true,
  },
  {
    id: 'title-kolektor-aura',
    label: 'Kolektor Aura Legendaris',
    toneClass: 'bg-fuchsia-50 text-fuchsia-900 border-fuchsia-300',
    unlockAchievementId: 'ach-kolektor-aura',
    requirementSummary: 'Memiliki minimal 3 Bingkai Aura Eksklusif Spin Bingkai',
    isExclusiveNew: true,
  },
  {
    id: 'title-bintang-paychat',
    label: 'Bintang PayChat',
    toneClass: 'bg-sky-50 text-sky-900 border-sky-300',
    unlockAchievementId: 'ach-bintang-paychat',
    requirementSummary: 'Mengirim minimal 25 pesan PayChat & menyimpan minimal 1 kontak',
    isExclusiveNew: true,
  },
  {
    id: 'title-arsitek-impian',
    label: 'Arsitek Impian',
    toneClass: 'bg-teal-50 text-teal-900 border-teal-300',
    unlockAchievementId: 'ach-arsitek-impian',
    requirementSummary: 'Mengisi minimal 3 Kantong Nabung atau Kantong Impian',
    isExclusiveNew: true,
  },
];

export function getAvatarPresetById(id?: string): ProfileAvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((p) => p.id === id);
}

export function getAvatarFrameById(id?: string): ProfileAvatarFrame {
  return (
    SPIN_AURA_FRAMES.find((f) => f.id === id) ||
    AVATAR_FRAMES.find((f) => f.id === id) ||
    AVATAR_FRAMES[0]
  );
}

export function getFeaturedTitleById(id?: string): ProfileFeaturedTitle | undefined {
  if (!id) return undefined;
  return FEATURED_TITLES.find((t) => t.id === id);
}
