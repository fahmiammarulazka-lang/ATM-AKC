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
}

export interface ProfileFeaturedTitle {
  id: string;
  label: string;
  toneClass: string;
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
    description: 'Bingkai tipis profesional',
    ringClass: 'ring-2 ring-slate-300 ring-offset-2 ring-offset-white',
    badgeColorClass: 'bg-slate-700 text-white',
  },
  {
    id: 'frame-sapphire',
    label: 'Sapphire Bank',
    description: 'Cincin biru institusional',
    ringClass: 'ring-[3px] ring-blue-600 ring-offset-2 ring-offset-white',
    badgeColorClass: 'bg-blue-600 text-white',
  },
  {
    id: 'frame-gold-royal',
    label: 'Emas 24K',
    description: 'Bingkai emas berkilau',
    ringClass: 'ring-[3px] ring-amber-500 ring-offset-2 ring-offset-amber-50',
    badgeColorClass: 'bg-amber-500 text-slate-950',
  },
  {
    id: 'frame-cyan-diamond',
    label: 'Kristal Permata',
    description: 'Bingkai cyan berlian',
    ringClass: 'ring-[3px] ring-cyan-500 ring-offset-2 ring-offset-cyan-50',
    badgeColorClass: 'bg-cyan-600 text-white',
  },
  {
    id: 'frame-emerald-guard',
    label: 'Pelindung Zamrud',
    description: 'Bingkai keamanan terenkripsi',
    ringClass: 'ring-[3px] ring-emerald-500 ring-offset-2 ring-offset-emerald-50',
    badgeColorClass: 'bg-emerald-600 text-white',
  },
  {
    id: 'frame-crimson-flame',
    label: 'Api Streak',
    description: 'Bingkai energi streak aktif',
    ringClass: 'ring-[3px] ring-orange-500 ring-offset-2 ring-offset-orange-50',
    badgeColorClass: 'bg-orange-600 text-white',
  },
  {
    id: 'frame-violet-prestige',
    label: 'Violet Prestige',
    description: 'Bingkai eksekutif premium',
    ringClass: 'ring-[3px] ring-violet-600 ring-offset-2 ring-offset-violet-50',
    badgeColorClass: 'bg-violet-600 text-white',
  },
  {
    id: 'frame-obsidian-vip',
    label: 'Obsidian VIP',
    description: 'Bingkai gelap monokrom elegan',
    ringClass: 'ring-[3px] ring-slate-900 ring-offset-2 ring-offset-slate-100',
    badgeColorClass: 'bg-slate-900 text-amber-300',
  },
];

export const FEATURED_TITLES: ProfileFeaturedTitle[] = [
  {
    id: 'title-nasabah-prioritas',
    label: 'Nasabah Prioritas',
    toneClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    id: 'title-kolektor-emas',
    label: 'Kolektor Emas 24K',
    toneClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    id: 'title-penjaga-streak',
    label: 'Penjaga Api Streak',
    toneClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  {
    id: 'title-pemburu-diamond',
    label: 'Pemburu Permata',
    toneClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  },
  {
    id: 'title-saudagar-nusantara',
    label: 'Saudagar Nusantara',
    toneClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    id: 'title-investor-ulung',
    label: 'Investor Ulung',
    toneClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    id: 'title-penjelajah-misi',
    label: 'Penjelajah 100 Misi',
    toneClass: 'bg-violet-50 text-violet-800 border-violet-200',
  },
  {
    id: 'title-pioner-digital',
    label: 'Pioner Digital QRIS',
    toneClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
];

export function getAvatarPresetById(id?: string): ProfileAvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((p) => p.id === id);
}

export function getAvatarFrameById(id?: string): ProfileAvatarFrame {
  return AVATAR_FRAMES.find((f) => f.id === id) || AVATAR_FRAMES[0];
}

export function getFeaturedTitleById(id?: string): ProfileFeaturedTitle | undefined {
  if (!id) return undefined;
  return FEATURED_TITLES.find((t) => t.id === id);
}
