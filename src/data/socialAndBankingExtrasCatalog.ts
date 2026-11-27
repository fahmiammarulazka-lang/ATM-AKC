import { ChatTextEffectStyle } from '../types/bank';

export interface ExpressiveStickerItem {
  id: string;
  label: string;
  emoji: string;
  caption: string;
  gradientClass: string;
  borderClass: string;
}

export const EXPRESSIVE_STICKERS: ExpressiveStickerItem[] = [
  { id: 'stk_halo', label: 'Halo!', emoji: '👋', caption: 'Halo Semuanya!', gradientClass: 'from-emerald-500/25 to-teal-500/20', borderClass: 'border-emerald-400/50' },
  { id: 'stk_cuan', label: 'Auto Cuan', emoji: '💸', caption: 'Saldo Nambah Terus!', gradientClass: 'from-amber-500/25 to-yellow-500/20', borderClass: 'border-amber-400/50' },
  { id: 'stk_mantap', label: 'Mantap Jiwa', emoji: '🔥', caption: 'Mantap Jiwa!', gradientClass: 'from-orange-500/25 to-rose-500/20', borderClass: 'border-orange-400/50' },
  { id: 'stk_sultan', label: 'Sultan Mode', emoji: '👑', caption: 'Mode Sultan Aktif', gradientClass: 'from-yellow-400/25 to-amber-600/20', borderClass: 'border-yellow-400/50' },
  { id: 'stk_thanks', label: 'Makasih Ya', emoji: '🙏', caption: 'Terima Kasih Banyak!', gradientClass: 'from-sky-500/25 to-cyan-500/20', borderClass: 'border-sky-400/50' },
  { id: 'stk_ngakak', label: 'Ngakak Pol', emoji: '🤣', caption: 'Ngakak Abis!', gradientClass: 'from-fuchsia-500/25 to-pink-500/20', borderClass: 'border-fuchsia-400/50' },
  { id: 'stk_semangat', label: 'Gas Terus', emoji: '🚀', caption: 'Semangat Tanpa Rem!', gradientClass: 'from-indigo-500/25 to-blue-500/20', borderClass: 'border-indigo-400/50' },
  { id: 'stk_coffee', label: 'Ngopi Dulu', emoji: '☕', caption: 'Santai Ngopi Dulu', gradientClass: 'from-stone-500/25 to-amber-700/20', borderClass: 'border-amber-500/40' },
  { id: 'stk_gem', label: 'Diamond Time', emoji: '💎', caption: 'Kilau Diamond VIP', gradientClass: 'from-cyan-500/25 to-sky-500/20', borderClass: 'border-cyan-400/50' },
  { id: 'stk_deal', label: 'Deal Setuju', emoji: '🤝', caption: 'Sepakat & Aman!', gradientClass: 'from-teal-500/25 to-emerald-500/20', borderClass: 'border-teal-400/50' },
];

export interface MotionGifPresetItem {
  id: string;
  label: string;
  badge: string;
  primaryEmoji: string;
  secondaryEmoji: string;
  animClass: string;
  bgClass: string;
}

export const MOTION_GIF_PRESETS: MotionGifPresetItem[] = [
  { id: 'gif_party', label: 'Pesta Cuan', badge: 'GIF', primaryEmoji: '🎉', secondaryEmoji: '✨', animClass: 'animate-bounce', bgClass: 'from-amber-600/40 via-rose-600/30 to-indigo-700/40' },
  { id: 'gif_rocket', label: 'Meluncur Cepat', badge: 'GIF', primaryEmoji: '🚀', secondaryEmoji: '💨', animClass: 'animate-pulse', bgClass: 'from-sky-600/40 via-cyan-600/30 to-blue-800/40' },
  { id: 'gif_heart', label: 'Penuh Cinta', badge: 'GIF', primaryEmoji: '❤️', secondaryEmoji: '💫', animClass: 'animate-ping', bgClass: 'from-rose-600/40 via-pink-600/30 to-fuchsia-800/40' },
  { id: 'gif_gold', label: 'Hujan Emas', badge: 'GIF', primaryEmoji: '🪙', secondaryEmoji: '🌟', animClass: 'animate-bounce', bgClass: 'from-yellow-600/40 via-amber-500/30 to-orange-700/40' },
  { id: 'gif_clap', label: 'Tepuk Tangan', badge: 'GIF', primaryEmoji: '👏', secondaryEmoji: '🎊', animClass: 'animate-pulse', bgClass: 'from-emerald-600/40 via-teal-500/30 to-cyan-700/40' },
  { id: 'gif_shock', label: 'Kaget Gokil', badge: 'GIF', primaryEmoji: '🤯', secondaryEmoji: '⚡', animClass: 'animate-bounce', bgClass: 'from-violet-600/40 via-purple-600/30 to-indigo-800/40' },
];

export const CHAT_TEXT_EFFECT_PRESETS: Array<{
  id: ChatTextEffectStyle;
  label: string;
  previewClass: string;
  bubbleTextClass: string;
}> = [
  { id: 'none', label: 'Normal', previewClass: 'bg-slate-800 text-slate-200 border-slate-700', bubbleTextClass: '' },
  { id: 'emerald_glow', label: 'Zamrud', previewClass: 'bg-emerald-950 text-emerald-300 border-emerald-500/50', bubbleTextClass: 'text-emerald-200 font-semibold drop-shadow-[0_0_8px_rgba(16,185,129,0.45)]' },
  { id: 'gold_shimmer', label: 'Emas VIP', previewClass: 'bg-amber-950 text-amber-300 border-amber-400/60', bubbleTextClass: 'bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent font-bold' },
  { id: 'ocean_wave', label: 'Samudra', previewClass: 'bg-sky-950 text-cyan-300 border-cyan-400/60', bubbleTextClass: 'bg-gradient-to-r from-cyan-200 via-sky-300 to-indigo-200 bg-clip-text text-transparent font-semibold' },
  { id: 'sunset_fire', label: 'Senja Api', previewClass: 'bg-rose-950 text-orange-300 border-orange-400/60', bubbleTextClass: 'bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300 bg-clip-text text-transparent font-semibold' },
  { id: 'royal_neon', label: 'Royal Ungu', previewClass: 'bg-violet-950 text-fuchsia-300 border-fuchsia-400/60', bubbleTextClass: 'bg-gradient-to-r from-fuchsia-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent font-bold' },
];

export const STATUS_BG_THEMES: Array<{ id: string; label: string; className: string }> = [
  { id: 'emerald', label: 'Zamrud', className: 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900' },
  { id: 'ocean', label: 'Samudra', className: 'bg-gradient-to-br from-sky-600 via-blue-800 to-indigo-950' },
  { id: 'sunset', label: 'Senja', className: 'bg-gradient-to-br from-rose-600 via-orange-600 to-amber-700' },
  { id: 'royal', label: 'Royal', className: 'bg-gradient-to-br from-indigo-700 via-violet-800 to-slate-950' },
  { id: 'obsidian', label: 'Hitam Elegan', className: 'bg-gradient-to-br from-slate-800 via-slate-900 to-black' },
  { id: 'gold', label: 'Emas Nusantara', className: 'bg-gradient-to-br from-amber-600 via-yellow-700 to-stone-900' },
];

export const MOOD_MUSIC_PRESETS: Array<{ emoji: string; label: string; music: string }> = [
  { emoji: '🎧', label: 'Fokus Produktif', music: 'Lo-Fi Chill Nusantara' },
  { emoji: '☕', label: 'Santai Sore', music: 'Akustik Kopi Hangat' },
  { emoji: '🚀', label: 'Lagi Semangat!', music: 'Synthwave Upbeat Mix' },
  { emoji: '💼', label: 'Sibuk Urus Bisnis', music: 'Jazz Lounge Klasik' },
  { emoji: '🌙', label: 'Istirahat Malam', music: 'Piano Hujan Tenang' },
];

export const DREAM_POCKET_PRESETS: Array<{ emoji: string; category: string; colorTheme: string }> = [
  { emoji: '🛡️', category: 'Dana Darurat', colorTheme: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40' },
  { emoji: '📱', category: 'Gadget & Kerja', colorTheme: 'from-sky-500/20 to-cyan-500/10 border-sky-500/40' },
  { emoji: '✈️', category: 'Liburan & Umrah', colorTheme: 'from-amber-500/20 to-orange-500/10 border-amber-500/40' },
  { emoji: '🏠', category: 'Rumah & Aset', colorTheme: 'from-indigo-500/20 to-blue-500/10 border-indigo-500/40' },
  { emoji: '🎓', category: 'Pendidikan', colorTheme: 'from-violet-500/20 to-purple-500/10 border-violet-500/40' },
];

export interface DailyAchievementDef {
  id: string;
  title: string;
  description: string;
  rewardPoints: number;
  check: (params: {
    txCount: number;
    dreamPocketCount: number;
    loyaltyStreak: number;
    goldGrams: number;
    statusesPosted: number;
  }) => boolean;
}

export const DAILY_ACHIEVEMENT_CATALOG: DailyAchievementDef[] = [
  {
    id: 'ach_first_tx',
    title: 'Penggerak Transaksi',
    description: 'Lakukan minimal 1 transaksi perbankan di rekening Anda.',
    rewardPoints: 50,
    check: ({ txCount }) => txCount >= 1,
  },
  {
    id: 'ach_dream_starter',
    title: 'Perencana Kantong Impian',
    description: 'Buat minimal 1 Kantong Impian Tabungan Target.',
    rewardPoints: 75,
    check: ({ dreamPocketCount }) => dreamPocketCount >= 1,
  },
  {
    id: 'ach_streak_3',
    title: 'Konsisten 3 Hari Berturut',
    description: 'Capai streak check-in harian minimal 3 hari.',
    rewardPoints: 100,
    check: ({ loyaltyStreak }) => loyaltyStreak >= 3,
  },
  {
    id: 'ach_gold_saver',
    title: 'Kolektor Emas Nusantara',
    description: 'Miliki simpanan Emas 24K minimal 0.5 gram.',
    rewardPoints: 120,
    check: ({ goldGrams }) => goldGrams >= 0.5,
  },
  {
    id: 'ach_social_status',
    title: 'Aktif Berbagi Status',
    description: 'Bagikan minimal 1 Status 24 jam di PayChat.',
    rewardPoints: 60,
    check: ({ statusesPosted }) => statusesPosted >= 1,
  },
];

export function computeChatReputationRank(params: {
  isAdmin?: boolean;
  loyaltyPoints?: number;
  txCount?: number;
  messageCount?: number;
}): { title: string; badgeClass: string } {
  if (params.isAdmin) {
    return {
      title: 'Komandan Admin • Lv.∞',
      badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/50',
    };
  }
  const score =
    (params.loyaltyPoints || 0) +
    (params.txCount || 0) * 15 +
    (params.messageCount || 0) * 5;
  if (score >= 1000) {
    return { title: 'Sultan Prioritas', badgeClass: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40' };
  }
  if (score >= 450) {
    return { title: 'Jawara Finansial', badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' };
  }
  if (score >= 150) {
    return { title: 'Sobat Nusantara', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' };
  }
  if (score >= 40) {
    return { title: 'Nasabah Aktif', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40' };
  }
  return { title: 'Warga Baru', badgeClass: 'bg-slate-800 text-slate-300 border-slate-700' };
}
