/**
 * Katalog Lengkap 32+ Efek & Perayaan Hadiah & Surat Bank Nusantara
 * - Mendukung Pemilihan Eksklusif 1 Efek Perayaan (Single-Select) di Panel Admin
 * - Menyediakan Hiasan Pra-Klaim (Popup Pojok, Latar Modal, Amplop Tersegel, Kotak Hadiah Tersegel)
 * - Menyediakan Koreografi Selebrasi Berlapis (Canvas Confetti + Hujan Ikon Tematik + Banner Selebrasi + Bingkai Surat)
 */
import confetti from 'canvas-confetti';

export type CelebrationCategoryKey =
  | 'all'
  | 'momen_spesial'
  | 'nasional_ri'
  | 'hari_raya'
  | 'musim_dunia'
  | 'sultan_vip';

export type CelebrationMotionStyle =
  | 'fireworks'
  | 'fountain_burst'
  | 'gentle_snow'
  | 'petal_drift'
  | 'lantern_rise'
  | 'royal_shower'
  | 'patriot_salute'
  | 'none';

export interface CelebrationEffectProfile {
  id: string;
  name: string;
  shortBadge: string;
  category: Exclude<CelebrationCategoryKey, 'all'>;
  categoryLabel: string;
  primaryEmoji: string;
  particleEmojis: string[];
  confettiColors: string[];
  motionStyle: CelebrationMotionStyle;
  description: string;
  celebrationHeadline: string;
  celebrationSubtext: string;
  recommendedThemeColor: 'amber' | 'emerald' | 'rose' | 'indigo';
  // Token Hiasan Visual Pra-Klaim & Lembar Surat
  ribbonColorClass: string;
  waxSealGradientClass: string;
  cardBorderAccentClass: string;
  cardGlowClass: string;
  bannerGradientClass: string;
  badgeClass: string;
  cornerOrnamentSymbol: string;
}

export const CELEBRATION_CATEGORIES: {
  key: CelebrationCategoryKey;
  label: string;
  emoji: string;
}[] = [
  { key: 'all', label: 'Semua Perayaan (33)', emoji: '✨' },
  { key: 'momen_spesial', label: 'Momen Spesial & Ulang Tahun', emoji: '🎂' },
  { key: 'nasional_ri', label: 'Nasional & Kemerdekaan RI', emoji: '🇮🇩' },
  { key: 'hari_raya', label: 'Hari Raya & Perayaan Besar', emoji: '🕌' },
  { key: 'musim_dunia', label: 'Musim & Festival Dunia', emoji: '🎄' },
  { key: 'sultan_vip', label: 'Selebrasi Sultan & VIP', emoji: '👑' },
];

export const CELEBRATION_EFFECTS_CATALOG: CelebrationEffectProfile[] = [
  // ============================================================================
  // KATEGORI 1: MOMEN SPESIAL & PERSONAL (7 TEMA)
  // ============================================================================
  {
    id: 'ulang_tahun_meriah',
    name: 'Ulang Tahun Meriah (Birthday Bash)',
    shortBadge: '🎂 Selamat Ulang Tahun',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '🎂',
    particleEmojis: ['🎂', '🎈', '🎉', '🎁', '🥳', '🧁', '✨'],
    confettiColors: ['#F43F5E', '#FBBF24', '#38BDF8', '#A855F7', '#34D399', '#FFFFFF'],
    motionStyle: 'fountain_burst',
    description: 'Pesta ulang tahun meriah dengan balon terbang, kue tart, terompet pesta, dan semburan konfeti pelangi.',
    celebrationHeadline: '🎂 SELAMAT ULANG TAHUN! HAPPY BIRTHDAY!',
    celebrationSubtext: 'Semoga panjang umur, sehat selalu, dan makin berlimpah rezeki bersama Bank Nusantara!',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-pink-500 via-rose-500 to-amber-400 border-pink-200/80',
    waxSealGradientClass: 'from-pink-400 via-rose-500 to-amber-500 border-pink-100',
    cardBorderAccentClass: 'border-pink-400/80 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(244,63,94,0.35)]',
    bannerGradientClass: 'from-rose-950/95 via-fuchsia-950/90 to-amber-950/90 border-pink-400/70',
    badgeClass: 'bg-gradient-to-r from-pink-400 via-rose-400 to-amber-300 text-slate-950',
    cornerOrnamentSymbol: '🎈',
  },
  {
    id: 'anniversary_romantis',
    name: 'Hari Jadi & Anniversary Romantis',
    shortBadge: '💍 Happy Anniversary',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '💍',
    particleEmojis: ['💍', '🌹', '💖', '🥂', '✨', '💎'],
    confettiColors: ['#FB7185', '#F43F5E', '#FDE047', '#FFF1F2', '#E11D48'],
    motionStyle: 'petal_drift',
    description: 'Taburan kelopak mawar merah, kilau cincin berlian, dan cahaya emas hangat untuk perayaan hari jadi.',
    celebrationHeadline: '💍 HAPPY ANNIVERSARY & HARI JADI ISTIMEWA!',
    celebrationSubtext: 'Merayakan momen berharga penuh kebahagiaan, kesetiaan, dan kemakmuran bersama.',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-rose-600 via-pink-500 to-amber-300 border-rose-100/80',
    waxSealGradientClass: 'from-rose-400 via-red-600 to-amber-600 border-rose-100',
    cardBorderAccentClass: 'border-rose-400/80 hover:border-pink-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(225,29,72,0.35)]',
    bannerGradientClass: 'from-rose-950/95 via-red-950/90 to-slate-950 border-rose-400/70',
    badgeClass: 'bg-gradient-to-r from-rose-300 via-pink-300 to-amber-200 text-slate-950',
    cornerOrnamentSymbol: '🌹',
  },
  {
    id: 'kelulusan_wisuda',
    name: 'Kelulusan & Wisuda (Graduation Day)',
    shortBadge: '🎓 Happy Graduation',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '🎓',
    particleEmojis: ['🎓', '📜', '🏆', '🌟', '🎉', '👏'],
    confettiColors: ['#FACC15', '#38BDF8', '#1D4ED8', '#FEF08A', '#FFFFFF'],
    motionStyle: 'fountain_burst',
    description: 'Lemparan topi toga wisuda, gulungan ijazah kehormatan, dan konfeti biru-emas akademik.',
    celebrationHeadline: '🎓 SELAMAT ATAS KELULUSAN & WISUDA KEHORMATAN!',
    celebrationSubtext: 'Langkah gemilang menuju puncak kesuksesan masa depan bersama Bank Nusantara.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-blue-600 via-indigo-600 to-amber-400 border-amber-200/80',
    waxSealGradientClass: 'from-amber-300 via-blue-600 to-indigo-800 border-amber-100',
    cardBorderAccentClass: 'border-indigo-400/80 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(99,102,241,0.35)]',
    bannerGradientClass: 'from-indigo-950/95 via-blue-950/90 to-amber-950/85 border-amber-400/70',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-cyan-300 text-slate-950',
    cornerOrnamentSymbol: '🎓',
  },
  {
    id: 'promosi_karier_vip',
    name: 'Promosi Jabatan & Prestasi Karier',
    shortBadge: '🏆 Promosi & Prestasi',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '🏆',
    particleEmojis: ['🏆', '🥇', '👑', '💼', '🚀', '✨'],
    confettiColors: ['#F59E0B', '#10B981', '#FDE047', '#34D399', '#FFFFFF'],
    motionStyle: 'royal_shower',
    description: 'Kilauan piala emas, medali juara, dan pancaran zamrud kesuksesan karier eksekutif.',
    celebrationHeadline: '🏆 SELAMAT ATAS PROMOSI JABATAN & PRESTASI GEMILANG!',
    celebrationSubtext: 'Apresiasi tertinggi atas dedikasi, kepemimpinan, dan pencapaian luar biasa Anda.',
    recommendedThemeColor: 'emerald',
    ribbonColorClass: 'bg-gradient-to-b from-emerald-500 via-teal-600 to-amber-400 border-emerald-200/80',
    waxSealGradientClass: 'from-amber-300 via-emerald-500 to-teal-700 border-amber-100',
    cardBorderAccentClass: 'border-emerald-400/80 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(16,185,129,0.35)]',
    bannerGradientClass: 'from-emerald-950/95 via-teal-950/90 to-amber-950/85 border-emerald-400/70',
    badgeClass: 'bg-gradient-to-r from-emerald-300 via-amber-300 to-yellow-400 text-slate-950',
    cornerOrnamentSymbol: '🏆',
  },
  {
    id: 'kelahiran_bayi_syukuran',
    name: 'Kelahiran Bayi & Syukuran Keluarga',
    shortBadge: '👶 Syukuran Kelahiran',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '👶',
    particleEmojis: ['👶', '🍼', '🧸', '🎈', '🌟', '💝'],
    confettiColors: ['#7DD3FC', '#F9A8D4', '#FDE047', '#C4B5FD', '#FFFFFF'],
    motionStyle: 'petal_drift',
    description: 'Nuansa pastel biru-merah muda lembut dengan boneka beruang, bintang, dan balon syukuran keluarga.',
    celebrationHeadline: '👶 SELAMAT ATAS KELAHIRAN BUAH HATI TERCINTA!',
    celebrationSubtext: 'Semoga tumbuh sehat, cerdas, dan membawa keberkahan berlimpah bagi seluruh keluarga.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-sky-400 via-pink-400 to-amber-300 border-white/80',
    waxSealGradientClass: 'from-sky-300 via-pink-400 to-indigo-500 border-white',
    cardBorderAccentClass: 'border-sky-300/80 hover:border-pink-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(56,189,248,0.32)]',
    bannerGradientClass: 'from-sky-950/95 via-indigo-950/90 to-pink-950/85 border-sky-300/70',
    badgeClass: 'bg-gradient-to-r from-sky-200 via-pink-200 to-amber-200 text-slate-950',
    cornerOrnamentSymbol: '🧸',
  },
  {
    id: 'pernikahan_agung',
    name: 'Pernikahan Agung (Royal Wedding)',
    shortBadge: '💒 Royal Wedding',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '💒',
    particleEmojis: ['💒', '🕊️', '💍', '💐', '🥂', '✨'],
    confettiColors: ['#FDE68A', '#FFFFFF', '#F9A8D4', '#F59E0B', '#FFFBEB'],
    motionStyle: 'petal_drift',
    description: 'Kemewahan pernikahan kerajaan dengan merpati putih, buket bunga melati, dan kilau mutiara emas.',
    celebrationHeadline: '💒 HAPPY ROYAL WEDDING • SELAMAT MENEMPUH HIDUP BARU!',
    celebrationSubtext: 'Doa terbaik untuk ikatan suci yang bahagia, harmonis, dan penuh berkah selamanya.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-200 via-yellow-400 to-rose-400 border-white/90',
    waxSealGradientClass: 'from-amber-200 via-yellow-500 to-amber-700 border-white',
    cardBorderAccentClass: 'border-amber-200/85 hover:border-white',
    cardGlowClass: 'shadow-[0_0_45px_rgba(253,230,138,0.38)]',
    bannerGradientClass: 'from-amber-950/95 via-rose-950/85 to-slate-950 border-amber-200/70',
    badgeClass: 'bg-gradient-to-r from-amber-100 via-yellow-200 to-rose-200 text-slate-950',
    cornerOrnamentSymbol: '🕊️',
  },
  {
    id: 'hari_valentine_kasih',
    name: 'Hari Kasih Sayang (Valentine Day)',
    shortBadge: '💖 Hari Kasih Sayang',
    category: 'momen_spesial',
    categoryLabel: 'Momen Spesial',
    primaryEmoji: '💖',
    particleEmojis: ['💖', '💘', '💝', '🌹', '🍫', '✨'],
    confettiColors: ['#FF1493', '#FB7185', '#E11D48', '#FFB6C1', '#FFFFFF'],
    motionStyle: 'petal_drift',
    description: 'Hujan hati merah muda, cokelat pita emas, dan bunga mawar penuh kehangatan kasih sayang.',
    celebrationHeadline: '💖 HAPPY VALENTINE’S DAY • PENUH KASIH & APRESIASI!',
    celebrationSubtext: 'Bingkisan tulus penuh kehangatan untuk nasabah paling istimewa di hati kami.',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-pink-500 via-rose-600 to-red-600 border-pink-100/80',
    waxSealGradientClass: 'from-pink-400 via-rose-600 to-red-800 border-pink-100',
    cardBorderAccentClass: 'border-pink-400/85 hover:border-rose-200',
    cardGlowClass: 'shadow-[0_0_45px_rgba(236,72,153,0.4)]',
    bannerGradientClass: 'from-pink-950/95 via-rose-950/90 to-red-950/85 border-pink-400/70',
    badgeClass: 'bg-gradient-to-r from-pink-300 via-rose-400 to-red-300 text-slate-950',
    cornerOrnamentSymbol: '💘',
  },

  // ============================================================================
  // KATEGORI 2: NASIONAL & KEBANGGAAN INDONESIA (7 TEMA)
  // ============================================================================
  {
    id: 'kemerdekaan_ri_17_agustus',
    name: 'HUT Kemerdekaan RI (17 Agustus Merah Putih)',
    shortBadge: '🇮🇩 HUT Kemerdekaan RI',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '🇮🇩',
    particleEmojis: ['🇮🇩', '🦅', '🎆', '🎖️', '🔥', '✨', '🎊'],
    confettiColors: ['#EF4444', '#DC2626', '#FFFFFF', '#F8FAFC', '#FBBF24'],
    motionStyle: 'patriot_salute',
    description: 'Semarak Dirgahayu Republik Indonesia dengan kibaran Merah Putih, Garuda Emas, dan salvo meriam kemerdekaan!',
    celebrationHeadline: '🇮🇩 DIRGAHAYU KEMERDEKAAN REPUBLIK INDONESIA • MERDEKA!',
    celebrationSubtext: 'Jayalah Indonesiaku! Semangat Merah Putih berkibar megah bersama Bank Nusantara.',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-red-600 via-red-500 to-white border-red-200',
    waxSealGradientClass: 'from-red-600 via-red-500 to-amber-500 border-white',
    cardBorderAccentClass: 'border-red-500/90 hover:border-white',
    cardGlowClass: 'shadow-[0_0_50px_rgba(239,68,68,0.45)]',
    bannerGradientClass: 'from-red-950/95 via-rose-950/90 to-slate-950 border-red-400/80',
    badgeClass: 'bg-gradient-to-r from-red-600 via-red-500 to-white text-slate-950',
    cornerOrnamentSymbol: '🇮🇩',
  },
  {
    id: 'hari_lahir_pancasila',
    name: 'Hari Lahir Pancasila & Garuda Nusantara',
    shortBadge: '🦅 Hari Lahir Pancasila',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '🦅',
    particleEmojis: ['🦅', '🇮🇩', '⭐', '🛡️', '🌾', '✨'],
    confettiColors: ['#F59E0B', '#DC2626', '#FFFFFF', '#FDE047'],
    motionStyle: 'patriot_salute',
    description: 'Kewibawaan Garuda Pancasila dengan perisai bintang emas dan semburan merah-putih-emas.',
    celebrationHeadline: '🦅 PERINGATAN HARI LAHIR PANCASILA • BHINNEKA TUNGGAL IKA!',
    celebrationSubtext: 'Bersatu dalam semangat gotong royong dan kedaulatan ekonomi Bank Nusantara.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-red-600 to-white border-amber-200',
    waxSealGradientClass: 'from-amber-300 via-yellow-500 to-red-700 border-white',
    cardBorderAccentClass: 'border-amber-400/85 hover:border-red-400',
    cardGlowClass: 'shadow-[0_0_45px_rgba(245,158,11,0.4)]',
    bannerGradientClass: 'from-amber-950/95 via-red-950/90 to-slate-950 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-red-500 to-white text-slate-950',
    cornerOrnamentSymbol: '🦅',
  },
  {
    id: 'hari_kartini_nusantara',
    name: 'Hari Kartini & Pesona Nusantara (21 April)',
    shortBadge: '🌺 Hari Kartini',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '🌺',
    particleEmojis: ['🌺', '🌸', '👑', '📖', '✨', '🇮🇩'],
    confettiColors: ['#F472B6', '#FBBF24', '#34D399', '#FDE047', '#FFF1F2'],
    motionStyle: 'petal_drift',
    description: 'Keanggunan bunga melati & anggrek Nusantara berpadu kilau emas Habis Gelap Terbitlah Terang.',
    celebrationHeadline: '🌺 SELAMAT HARI KARTINI • HABIS GELAP TERBITLAH TERANG!',
    celebrationSubtext: 'Menghormati inspirasi, karya, dan kemandirian perempuan hebat Indonesia.',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-pink-500 via-amber-400 to-emerald-500 border-amber-100',
    waxSealGradientClass: 'from-pink-400 via-amber-400 to-emerald-600 border-amber-100',
    cardBorderAccentClass: 'border-pink-400/80 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(244,114,182,0.35)]',
    bannerGradientClass: 'from-pink-950/95 via-amber-950/85 to-emerald-950/85 border-pink-400/70',
    badgeClass: 'bg-gradient-to-r from-pink-300 via-amber-300 to-emerald-300 text-slate-950',
    cornerOrnamentSymbol: '🌺',
  },
  {
    id: 'hari_sumpah_pemuda',
    name: 'Hari Sumpah Pemuda (28 Oktober)',
    shortBadge: '🔥 Sumpah Pemuda',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '🔥',
    particleEmojis: ['🔥', '🇮🇩', '⚡', '🦅', '🌟', '🚀'],
    confettiColors: ['#EF4444', '#F97316', '#FACC15', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    description: 'Kobaran api semangat pemuda Indonesia dengan ledakan merah menyala, jingga obor, dan putih suci.',
    celebrationHeadline: '🔥 SELAMAT HARI SUMPAH PEMUDA • SATU NUSA, SATU BANGSA!',
    celebrationSubtext: 'Kobarkan semangat muda yang tangguh, inovatif, dan berdaya saing global!',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-orange-500 via-red-600 to-white border-amber-200',
    waxSealGradientClass: 'from-amber-400 via-orange-600 to-red-700 border-white',
    cardBorderAccentClass: 'border-orange-400/85 hover:border-red-400',
    cardGlowClass: 'shadow-[0_0_45px_rgba(249,115,22,0.4)]',
    bannerGradientClass: 'from-red-950/95 via-orange-950/90 to-slate-950 border-orange-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-orange-400 to-red-500 text-slate-950',
    cornerOrnamentSymbol: '🔥',
  },
  {
    id: 'hari_pahlawan_nasional',
    name: 'Hari Pahlawan Nasional (10 November)',
    shortBadge: '🎖️ Hari Pahlawan',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '🎖️',
    particleEmojis: ['🎖️', '🇮🇩', '🦅', '⭐', '🔥', '🛡️'],
    confettiColors: ['#D97706', '#DC2626', '#FDE047', '#FFFFFF'],
    motionStyle: 'patriot_salute',
    description: 'Medali bintang kehormatan, lencana perunggu-emas, dan salvo penghormatan pahlawan bangsa.',
    celebrationHeadline: '🎖️ SELAMAT HARI PAHLAWAN NASIONAL • PAHLAWANKU TELADANKU!',
    celebrationSubtext: 'Meneruskan perjuangan para pahlawan dengan karya nyata bagi kejayaan Nusantara.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-500 via-red-700 to-amber-300 border-amber-100',
    waxSealGradientClass: 'from-amber-400 via-yellow-600 to-red-800 border-amber-100',
    cardBorderAccentClass: 'border-amber-400/85 hover:border-red-400',
    cardGlowClass: 'shadow-[0_0_45px_rgba(217,119,6,0.38)]',
    bannerGradientClass: 'from-amber-950/95 via-red-950/90 to-slate-950 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-yellow-500 to-red-400 text-slate-950',
    cornerOrnamentSymbol: '🎖️',
  },
  {
    id: 'hari_batik_budaya',
    name: 'Hari Batik & Pusaka Budaya Nusantara',
    shortBadge: '🏛️ Pusaka Batik RI',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '🏛️',
    particleEmojis: ['🏛️', '👑', '✨', '🌺', '🪙', '🇮🇩'],
    confettiColors: ['#D97706', '#92400E', '#FDE047', '#38BDF8', '#FFFBEB'],
    motionStyle: 'royal_shower',
    description: 'Ornamen sogan keraton, emas klasik, dan mega mendung biru royal warisan budaya dunia.',
    celebrationHeadline: '🏛️ SELAMAT HARI BATIK & PUSAKA BUDAYA NUSANTARA!',
    celebrationSubtext: 'Melestarikan mahakarya leluhur dan keagungan budaya Indonesia di panggung dunia.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-600 via-yellow-500 to-indigo-700 border-amber-200',
    waxSealGradientClass: 'from-amber-400 via-amber-700 to-indigo-900 border-amber-200',
    cardBorderAccentClass: 'border-amber-500/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(217,119,6,0.35)]',
    bannerGradientClass: 'from-amber-950/95 via-slate-900 to-indigo-950/90 border-amber-400/70',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950',
    cornerOrnamentSymbol: '🏛️',
  },
  {
    id: 'hari_pendidikan_guru',
    name: 'Hari Pendidikan Nasional & Hari Guru',
    shortBadge: '📚 Hari Pendidikan & Guru',
    category: 'nasional_ri',
    categoryLabel: 'Nasional RI',
    primaryEmoji: '📚',
    particleEmojis: ['📚', '🎓', '✒️', '🌟', '💡', '🇮🇩'],
    confettiColors: ['#38BDF8', '#FACC15', '#34D399', '#FFFFFF'],
    motionStyle: 'fountain_burst',
    description: 'Cahaya lentera ilmu pengetahuan, buku emas, dan bintang penghormatan pahlawan tanpa tanda jasa.',
    celebrationHeadline: '📚 SELAMAT HARI PENDIDIKAN NASIONAL & HARI GURU!',
    celebrationSubtext: 'Tut Wuri Handayani — Mencerdaskan kehidupan bangsa menuju Indonesia Emas.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-cyan-500 via-blue-600 to-amber-400 border-cyan-100',
    waxSealGradientClass: 'from-cyan-300 via-blue-600 to-amber-500 border-white',
    cardBorderAccentClass: 'border-cyan-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(56,189,248,0.35)]',
    bannerGradientClass: 'from-blue-950/95 via-cyan-950/90 to-slate-950 border-cyan-400/70',
    badgeClass: 'bg-gradient-to-r from-cyan-300 via-blue-300 to-amber-300 text-slate-950',
    cornerOrnamentSymbol: '📚',
  },

  // ============================================================================
  // KATEGORI 3: HARI RAYA & PERAYAAN BESAR (9 TEMA)
  // ============================================================================
  {
    id: 'idul_fitri_lebaran',
    name: 'Hari Raya Idul Fitri (Lebaran Mubarak)',
    shortBadge: '🕌 Selamat Idul Fitri',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🕌',
    particleEmojis: ['🕌', '🌙', '✨', '🟢', '🪙', '🙏', '🌟'],
    confettiColors: ['#10B981', '#059669', '#FBBF24', '#FDE047', '#ECFDF5'],
    motionStyle: 'lantern_rise',
    description: 'Kemeriahan malam kemenangan dengan ketupat lebaran, bulan sabit emas, kubah masjid, dan cahaya zamrud.',
    celebrationHeadline: '🕌 SELAMAT HARI RAYA IDUL FITRI • MINAL AIDIN WAL FAIZIN!',
    celebrationSubtext: 'Mohon maaf lahir dan batin. SemogaTHR & berkah kemenangan melimpah di rekening Anda!',
    recommendedThemeColor: 'emerald',
    ribbonColorClass: 'bg-gradient-to-b from-emerald-500 via-green-600 to-amber-400 border-amber-200',
    waxSealGradientClass: 'from-emerald-400 via-green-600 to-amber-500 border-amber-100',
    cardBorderAccentClass: 'border-emerald-400/90 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(16,185,129,0.42)]',
    bannerGradientClass: 'from-emerald-950/95 via-green-950/90 to-amber-950/85 border-emerald-400/80',
    badgeClass: 'bg-gradient-to-r from-emerald-300 via-green-400 to-amber-300 text-slate-950',
    cornerOrnamentSymbol: '🌙',
  },
  {
    id: 'berkah_ramadhan',
    name: 'Berkah Suci Ramadhan (Marhaban ya Ramadhan)',
    shortBadge: '🌙 Berkah Ramadhan',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🌙',
    particleEmojis: ['🌙', '🕌', '🏮', '✨', '🌟', '🤲'],
    confettiColors: ['#FACC15', '#10B981', '#6366F1', '#FDE68A', '#FFFFFF'],
    motionStyle: 'lantern_rise',
    description: 'Lentera fanous Ramadhan bercahaya emas yang melayang anggun di langit malam penuh berkah.',
    celebrationHeadline: '🌙 MARHABAN YA RAMADHAN • PENUH BERKAH & AMPUNAN!',
    celebrationSubtext: 'Selamat menunaikan ibadah puasa, semoga setiap amal ibadah dilipatgandakan pahalanya.',
    recommendedThemeColor: 'emerald',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-emerald-600 to-indigo-700 border-amber-200',
    waxSealGradientClass: 'from-amber-300 via-emerald-500 to-indigo-800 border-amber-100',
    cardBorderAccentClass: 'border-amber-400/85 hover:border-emerald-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(250,204,21,0.38)]',
    bannerGradientClass: 'from-indigo-950/95 via-emerald-950/90 to-amber-950/85 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-200 text-slate-950',
    cornerOrnamentSymbol: '🌙',
  },
  {
    id: 'idul_adha_kurban',
    name: 'Hari Raya Idul Adha (Lebaran Haji)',
    shortBadge: '🕋 Selamat Idul Adha',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🕋',
    particleEmojis: ['🕋', '🌙', '🕌', '✨', '🌟', '🤲'],
    confettiColors: ['#F59E0B', '#10B981', '#FDE047', '#FFFFFF', '#047857'],
    motionStyle: 'lantern_rise',
    description: 'Nuansa emas Baitullah dan hijau zamrud yang khidmat untuk merayakan keikhlasan Hari Raya Idul Adha.',
    celebrationHeadline: '🕋 SELAMAT HARI RAYA IDUL ADHA • BERKAH KEIKHLASAN!',
    celebrationSubtext: 'Semoga semangat berbagi dan pengorbanan membawa kedamaian serta rezeki yang berkah.',
    recommendedThemeColor: 'emerald',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-yellow-600 to-emerald-700 border-amber-100',
    waxSealGradientClass: 'from-amber-300 via-yellow-600 to-emerald-800 border-amber-100',
    cardBorderAccentClass: 'border-emerald-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(16,185,129,0.38)]',
    bannerGradientClass: 'from-emerald-950/95 via-slate-950 to-amber-950/90 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-emerald-400 to-yellow-300 text-slate-950',
    cornerOrnamentSymbol: '🕋',
  },
  {
    id: 'hari_natal_christmas',
    name: 'Hari Natal (Merry Christmas & Winter Wonderland)',
    shortBadge: '🎄 Merry Christmas',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🎄',
    particleEmojis: ['🎄', '🎅', '❄️', '🔔', '🎁', '🦌', '⛄'],
    confettiColors: ['#DC2626', '#16A34A', '#FACC15', '#FFFFFF', '#EF4444', '#22C55E'],
    motionStyle: 'gentle_snow',
    description: 'Turunnya salju Natal berkilau, pohon cemara, lonceng emas, Sinterklas, dan pita klasik merah-hijau!',
    celebrationHeadline: '🎄 MERRY CHRISTMAS • SELAMAT HARI NATAL PENUH DAMAI & SUKACITA!',
    celebrationSubtext: 'Semoga kehangatan, damai sejahtera, dan keajaiban Natal menyertai Anda beserta keluarga.',
    recommendedThemeColor: 'emerald',
    ribbonColorClass: 'bg-gradient-to-b from-red-600 via-green-600 to-amber-400 border-white',
    waxSealGradientClass: 'from-red-600 via-green-600 to-amber-500 border-white',
    cardBorderAccentClass: 'border-red-400/85 hover:border-emerald-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(22,163,74,0.42)]',
    bannerGradientClass: 'from-red-950/95 via-emerald-950/90 to-slate-950 border-red-400/75',
    badgeClass: 'bg-gradient-to-r from-red-500 via-emerald-500 to-amber-300 text-white',
    cornerOrnamentSymbol: '🎄',
  },
  {
    id: 'tahun_baru_masehi',
    name: 'Tahun Baru Masehi (Happy New Year Fireworks)',
    shortBadge: '🎆 Happy New Year',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🎆',
    particleEmojis: ['🎆', '🎇', '🥂', '🎉', '🌟', '🎊', '✨'],
    confettiColors: ['#FACC15', '#38BDF8', '#F43F5E', '#A855F7', '#34D399', '#FFFFFF'],
    motionStyle: 'fireworks',
    description: 'Pesta kembang api langit malam berlapis-lapis dengan terompet tahun baru dan bintang gemerlap!',
    celebrationHeadline: '🎆 HAPPY NEW YEAR • SELAMAT TAHUN BARU PENUH HARAPAN!',
    celebrationSubtext: 'Menyambut tahun baru dengan semangat baru, peluang emas, dan kesuksesan berlipat ganda!',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-fuchsia-500 to-cyan-400 border-white',
    waxSealGradientClass: 'from-amber-300 via-indigo-600 to-fuchsia-600 border-white',
    cardBorderAccentClass: 'border-cyan-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(56,189,248,0.42)]',
    bannerGradientClass: 'from-indigo-950/95 via-fuchsia-950/85 to-slate-950 border-amber-400/80',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-cyan-300 to-fuchsia-300 text-slate-950',
    cornerOrnamentSymbol: '🎆',
  },
  {
    id: 'tahun_baru_imlek',
    name: 'Tahun Baru Imlek (Lunar New Year & Angpao)',
    shortBadge: '🏮 Gong Xi Fa Cai',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🏮',
    particleEmojis: ['🏮', '🧧', '🐉', '🪙', '🎆', '🍊', '✨'],
    confettiColors: ['#DC2626', '#EF4444', '#FACC15', '#F59E0B', '#FEF08A'],
    motionStyle: 'lantern_rise',
    description: 'Lampion merah keberuntungan, hujan Angpao emas, naga kemakmuran, dan petasan merah-emas Imlek!',
    celebrationHeadline: '🏮 GONG XI FA CAI • SELAMAT TAHUN BARU IMLEK PENUH HOKI!',
    celebrationSubtext: 'Semoga tahun ini membawa kemakmuran besar, kesehatan, dan keberuntungan tanpa batas!',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-red-600 via-red-700 to-amber-400 border-amber-300',
    waxSealGradientClass: 'from-amber-300 via-red-600 to-red-800 border-amber-200',
    cardBorderAccentClass: 'border-red-500/90 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(220,38,38,0.45)]',
    bannerGradientClass: 'from-red-950/95 via-amber-950/90 to-slate-950 border-amber-400/85',
    badgeClass: 'bg-gradient-to-r from-red-600 via-amber-400 to-yellow-300 text-slate-950',
    cornerOrnamentSymbol: '🏮',
  },
  {
    id: 'hari_raya_waisak',
    name: 'Hari Raya Waisak (Lentera Perdamaian)',
    shortBadge: '🪷 Selamat Hari Waisak',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🪷',
    particleEmojis: ['🪷', '🏮', '✨', '🌕', '🕊️', '🌟'],
    confettiColors: ['#FDE047', '#F59E0B', '#F9A8D4', '#38BDF8', '#FFFFFF'],
    motionStyle: 'lantern_rise',
    description: 'Pelepasan seribu lampion emas Waisak ke langit malam berpadu bunga teratai suci yang mekar.',
    celebrationHeadline: '🪷 SELAMAT HARI RAYA TRISUCI WAISAK • SABBE SATTA BHAVANTU SUKHITATTA!',
    celebrationSubtext: 'Semoga semua makhluk hidup berbahagia, damai, dan diberkahi cahaya kebijaksanaan.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-300 via-yellow-500 to-pink-400 border-amber-100',
    waxSealGradientClass: 'from-amber-200 via-yellow-500 to-amber-700 border-white',
    cardBorderAccentClass: 'border-amber-300/85 hover:border-pink-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(250,204,21,0.38)]',
    bannerGradientClass: 'from-amber-950/95 via-indigo-950/90 to-slate-950 border-amber-300/75',
    badgeClass: 'bg-gradient-to-r from-amber-200 via-yellow-300 to-pink-200 text-slate-950',
    cornerOrnamentSymbol: '🪷',
  },
  {
    id: 'hari_raya_nyepi',
    name: 'Hari Raya Nyepi & Tahun Baru Saka',
    shortBadge: '🕉️ Selamat Hari Nyepi',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🕉️',
    particleEmojis: ['🕉️', '🌺', '🌌', '✨', '🌕', '🌿'],
    confettiColors: ['#FACC15', '#38BDF8', '#FFFFFF', '#A855F7'],
    motionStyle: 'petal_drift',
    description: 'Keheningan langit bintang Bali yang jernih dengan bunga kamboja emas dan cahaya dharma.',
    celebrationHeadline: '🕉️ SELAMAT HARI RAYA NYEPI & TAHUN BARU SAKA • RAHAYU!',
    celebrationSubtext: 'Dalam keheningan Catur Brata Penyepian, semoga kedamaian dan harmoni menyertai semesta.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-indigo-600 to-slate-800 border-amber-200',
    waxSealGradientClass: 'from-amber-300 via-indigo-600 to-slate-900 border-amber-100',
    cardBorderAccentClass: 'border-indigo-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(99,102,241,0.35)]',
    bannerGradientClass: 'from-indigo-950/95 via-slate-950 to-amber-950/85 border-amber-400/70',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-indigo-300 to-cyan-200 text-slate-950',
    cornerOrnamentSymbol: '🌺',
  },
  {
    id: 'festival_deepavali',
    name: 'Festival Cahaya Deepavali (Diwali Festival)',
    shortBadge: '🪔 Happy Deepavali',
    category: 'hari_raya',
    categoryLabel: 'Hari Raya',
    primaryEmoji: '🪔',
    particleEmojis: ['🪔', '🎆', '✨', '🌺', '🌟', '🪙'],
    confettiColors: ['#F59E0B', '#EC4899', '#A855F7', '#FACC15', '#10B981'],
    motionStyle: 'fireworks',
    description: 'Cahaya pelita diya, warna-warni mandala rangoli, dan kembang api emas kemenangan terang atas gelap.',
    celebrationHeadline: '🪔 HAPPY DEEPAVALI • FESTIVAL CAHAYA & KEMAKMURAN!',
    celebrationSubtext: 'Semoga cahaya kebaikan, kebahagiaan, dan kesejahteraan menerangi langkah Anda.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-fuchsia-600 to-orange-500 border-amber-200',
    waxSealGradientClass: 'from-amber-300 via-orange-500 to-fuchsia-700 border-amber-100',
    cardBorderAccentClass: 'border-amber-400/85 hover:border-fuchsia-400',
    cardGlowClass: 'shadow-[0_0_45px_rgba(245,158,11,0.4)]',
    bannerGradientClass: 'from-amber-950/95 via-fuchsia-950/90 to-slate-950 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-orange-400 to-fuchsia-300 text-slate-950',
    cornerOrnamentSymbol: '🪔',
  },

  // ============================================================================
  // KATEGORI 4: MUSIM & FESTIVAL DUNIA (5 TEMA)
  // ============================================================================
  {
    id: 'malam_halloween',
    name: 'Malam Halloween (Spooky Pumpkin Fiesta)',
    shortBadge: '🎃 Happy Halloween',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Dunia',
    primaryEmoji: '🎃',
    particleEmojis: ['🎃', '🦇', '👻', '🍬', '🕸️', '🌙'],
    confettiColors: ['#F97316', '#9333EA', '#FACC15', '#1E1B4B', '#4ADE80'],
    motionStyle: 'fountain_burst',
    description: 'Malam misteri Halloween dengan labu bercahaya jingga, kelelawar ungu, dan hujan permen kejutan!',
    celebrationHeadline: '🎃 HAPPY HALLOWEEN • TRICK OR TREAT SULTAN SURPRISE!',
    celebrationSubtext: 'Malam penuh kejutan manis dan hadiah spesial tanpa misteri yang tersembunyi!',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-orange-500 via-purple-700 to-amber-500 border-orange-200',
    waxSealGradientClass: 'from-orange-400 via-purple-700 to-slate-950 border-orange-200',
    cardBorderAccentClass: 'border-orange-500/85 hover:border-purple-400',
    cardGlowClass: 'shadow-[0_0_45px_rgba(249,115,22,0.4)]',
    bannerGradientClass: 'from-purple-950/95 via-orange-950/90 to-slate-950 border-orange-400/75',
    badgeClass: 'bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400 text-slate-950',
    cornerOrnamentSymbol: '🎃',
  },
  {
    id: 'musim_semi_sakura',
    name: 'Musim Semi Bunga Sakura (Sakura Blossom)',
    shortBadge: '🌸 Sakura Blossom',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Dunia',
    primaryEmoji: '🌸',
    particleEmojis: ['🌸', '🌺', '🦋', '✨', '🌷', '🍃'],
    confettiColors: ['#F9A8D4', '#F472B6', '#FBCFE8', '#FFF1F2', '#FDE047'],
    motionStyle: 'petal_drift',
    description: 'Guguran kelopak bunga Sakura merah muda yang berterbangan lembut diembus angin musim semi.',
    celebrationHeadline: '🌸 SAKURA SPRING FESTIVAL • MUSIM SEMI PENUH KEINDAHAN!',
    celebrationSubtext: 'Seiring mekarnya bunga Sakura, semoga harapan dan kebahagiaan baru turut bersemi.',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-pink-300 via-rose-400 to-amber-200 border-white',
    waxSealGradientClass: 'from-pink-300 via-rose-400 to-pink-600 border-white',
    cardBorderAccentClass: 'border-pink-300/85 hover:border-white',
    cardGlowClass: 'shadow-[0_0_45px_rgba(249,168,212,0.38)]',
    bannerGradientClass: 'from-pink-950/95 via-rose-950/85 to-slate-950 border-pink-300/75',
    badgeClass: 'bg-gradient-to-r from-pink-200 via-rose-300 to-white text-slate-950',
    cornerOrnamentSymbol: '🌸',
  },
  {
    id: 'musim_dingin_salju',
    name: 'Musim Dingin Salju Kristal (Arctic Snowfall)',
    shortBadge: '❄️ Winter Snowfall',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Dunia',
    primaryEmoji: '❄️',
    particleEmojis: ['❄️', '☃️', '💎', '✨', '🌨️', '🧊'],
    confettiColors: ['#E0F2FE', '#7DD3FC', '#38BDF8', '#FFFFFF', '#BAE6FD'],
    motionStyle: 'gentle_snow',
    description: 'Hujan kristal salju biru-perak berkilau yang menyejukkan seluruh tampilan kartu hadiah dan surat.',
    celebrationHeadline: '❄️ CRYSTAL WINTER WONDERLAND • KEAJAIBAN SALJU ABADI!',
    celebrationSubtext: 'Kilau kristal es yang jernih membawa kesejukan dan kejutan eksklusif untuk Anda.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-sky-300 via-cyan-500 to-blue-700 border-white',
    waxSealGradientClass: 'from-sky-200 via-cyan-400 to-blue-700 border-white',
    cardBorderAccentClass: 'border-sky-300/85 hover:border-white',
    cardGlowClass: 'shadow-[0_0_45px_rgba(125,211,252,0.4)]',
    bannerGradientClass: 'from-sky-950/95 via-blue-950/90 to-slate-950 border-sky-300/75',
    badgeClass: 'bg-gradient-to-r from-white via-sky-200 to-cyan-300 text-slate-950',
    cornerOrnamentSymbol: '❄️',
  },
  {
    id: 'musim_gugur_maple',
    name: 'Musim Gugur Daun Maple Emas (Autumn Harvest)',
    shortBadge: '🍁 Golden Autumn',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Dunia',
    primaryEmoji: '🍁',
    particleEmojis: ['🍁', '🍂', '🌾', '✨', '🎃', '🪙'],
    confettiColors: ['#F97316', '#EA580C', '#FACC15', '#D97706', '#FEF3C7'],
    motionStyle: 'petal_drift',
    description: 'Guguran daun maple jingga-keemasan yang hangat melambangkan musim panen raya yang berlimpah.',
    celebrationHeadline: '🍁 GOLDEN AUTUMN HARVEST • MUSIM PANEN KEMAKMURAN!',
    celebrationSubtext: 'Menikmati hangatnya musim panen raya dengan bingkisan istimewa di rekening Anda.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-500 via-orange-600 to-red-700 border-amber-200',
    waxSealGradientClass: 'from-amber-400 via-orange-600 to-amber-800 border-amber-100',
    cardBorderAccentClass: 'border-orange-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(234,88,12,0.38)]',
    bannerGradientClass: 'from-orange-950/95 via-amber-950/90 to-slate-950 border-orange-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-orange-400 to-yellow-300 text-slate-950',
    cornerOrnamentSymbol: '🍁',
  },
  {
    id: 'aurora_borealis_langit',
    name: 'Cahaya Langit Aurora Borealis (Cosmic Northern Lights)',
    shortBadge: '🌌 Aurora Borealis',
    category: 'musim_dunia',
    categoryLabel: 'Musim & Dunia',
    primaryEmoji: '🌌',
    particleEmojis: ['🌌', '🌠', '✨', '🪐', '💎', '🌟'],
    confettiColors: ['#2DD4BF', '#38BDF8', '#A855F7', '#34D399', '#E0E7FF'],
    motionStyle: 'lantern_rise',
    description: 'Pendaran gelombang cahaya Aurora hijau-toska, sian, dan ungu kosmik beserta bintang jatuh.',
    celebrationHeadline: '🌌 AURORA BOREALIS SPECTACLE • CAHAYA LANGIT KOSMIK!',
    celebrationSubtext: 'Keindahan fenomena langit malam paling langka kini menghiasi kiriman spesial Anda.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-teal-400 via-cyan-500 to-purple-600 border-teal-200',
    waxSealGradientClass: 'from-teal-300 via-cyan-500 to-purple-700 border-white',
    cardBorderAccentClass: 'border-teal-400/85 hover:border-purple-300',
    cardGlowClass: 'shadow-[0_0_50px_rgba(45,212,191,0.4)]',
    bannerGradientClass: 'from-teal-950/95 via-indigo-950/90 to-purple-950/90 border-teal-400/75',
    badgeClass: 'bg-gradient-to-r from-teal-300 via-cyan-300 to-purple-300 text-slate-950',
    cornerOrnamentSymbol: '🌠',
  },

  // ============================================================================
  // KATEGORI 5: SELEBRASI SULTAN & PERBANKAN VIP (5 TEMA + TANPA EFEK)
  // ============================================================================
  {
    id: 'hujan_emas_sultan',
    name: 'Hujan Emas 24K & Berlian Sultan (Royal Gold Rain)',
    shortBadge: '👑 Hujan Emas Sultan',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & VIP',
    primaryEmoji: '👑',
    particleEmojis: ['👑', '🪙', '💎', '💰', '🏆', '✨', '🌟'],
    confettiColors: ['#FACC15', '#F59E0B', '#FDE047', '#FFFBEB', '#D97706'],
    motionStyle: 'royal_shower',
    description: 'Curahan koin emas murni 24K, berlian kerajaan, dan mahkota Sultan dari puncak brankas Bank Nusantara!',
    celebrationHeadline: '👑 ROYAL GOLD & DIAMOND SHOWER • BERKAH SULTAN NUSANTARA!',
    celebrationSubtext: 'Kemewahan tertinggi koin emas 24K dan permata kerajaan resmi mendarat di akun Anda!',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-yellow-300 via-amber-500 to-yellow-700 border-white',
    waxSealGradientClass: 'from-yellow-200 via-amber-400 to-amber-700 border-white',
    cardBorderAccentClass: 'border-amber-400/95 hover:border-yellow-200',
    cardGlowClass: 'shadow-[0_0_55px_rgba(251,191,36,0.48)]',
    bannerGradientClass: 'from-amber-950/95 via-yellow-950/90 to-slate-950 border-amber-300/85',
    badgeClass: 'bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-300 text-slate-950',
    cornerOrnamentSymbol: '👑',
  },
  {
    id: 'jackpot_cyber_matrix',
    name: 'Jackpot Digital & Neon Cyber VIP',
    shortBadge: '🚀 Jackpot Digital VIP',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & VIP',
    primaryEmoji: '🚀',
    particleEmojis: ['🚀', '⚡', '💎', '🪙', '🌐', '✨'],
    confettiColors: ['#22D3EE', '#38BDF8', '#818CF8', '#34D399', '#FACC15'],
    motionStyle: 'fireworks',
    description: 'Ledakan energi futuristik sian-elektrik dengan roket peluncuran dan kilatan matriks berkecepatan tinggi.',
    celebrationHeadline: '🚀 HYPER DIGITAL JACKPOT • TRANSMISI VIP BERHASIL!',
    celebrationSubtext: 'Paket aset prioritas masa depan telah tervalidasi penuh dan masuk ke rekening Anda.',
    recommendedThemeColor: 'indigo',
    ribbonColorClass: 'bg-gradient-to-b from-cyan-400 via-blue-600 to-indigo-700 border-cyan-200',
    waxSealGradientClass: 'from-cyan-300 via-blue-500 to-indigo-800 border-white',
    cardBorderAccentClass: 'border-cyan-400/90 hover:border-cyan-200',
    cardGlowClass: 'shadow-[0_0_50px_rgba(34,211,238,0.42)]',
    bannerGradientClass: 'from-cyan-950/95 via-blue-950/90 to-indigo-950/90 border-cyan-400/80',
    badgeClass: 'bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-300 text-slate-950',
    cornerOrnamentSymbol: '⚡',
  },
  {
    id: 'gala_red_carpet_vip',
    name: 'Gala Dinner & Red Carpet Eksklusif',
    shortBadge: '💎 Red Carpet Gala',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & VIP',
    primaryEmoji: '💎',
    particleEmojis: ['💎', '🥂', '🌟', '🎩', '👑', '✨'],
    confettiColors: ['#E11D48', '#FACC15', '#FDE047', '#FFFFFF', '#9F1239'],
    motionStyle: 'fountain_burst',
    description: 'Nuansa karpet merah beludru kerajaan berpadu kilatan blitz kamera emas malam penganugerahan VIP.',
    celebrationHeadline: '💎 EXCLUSIVE RED CARPET GALA • PENGHARGAAN NASABAH KEHORMATAN!',
    celebrationSubtext: 'Sambutan karpet merah paling bergengsi khusus bagi pemegang kehormatan Bank Nusantara.',
    recommendedThemeColor: 'rose',
    ribbonColorClass: 'bg-gradient-to-b from-rose-700 via-red-600 to-amber-400 border-amber-200',
    waxSealGradientClass: 'from-amber-300 via-red-700 to-rose-950 border-amber-100',
    cardBorderAccentClass: 'border-rose-400/85 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(225,29,72,0.38)]',
    bannerGradientClass: 'from-rose-950/95 via-red-950/90 to-amber-950/85 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-rose-400 to-amber-200 text-slate-950',
    cornerOrnamentSymbol: '💎',
  },
  {
    id: 'karnaval_konfeti_klasik',
    name: 'Karnaval Konfeti Klasik Bank Nusantara',
    shortBadge: '🎊 Karnaval Nusantara',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & VIP',
    primaryEmoji: '🎊',
    particleEmojis: ['🎊', '🎉', '✨', '🏛️', '🪙', '🌟'],
    confettiColors: ['#FBBF24', '#38BDF8', '#34D399', '#F43F5E', '#A855F7', '#FFFFFF'],
    motionStyle: 'fountain_burst',
    description: 'Semburan pita konfeti warna-warni resmi Bank Nusantara untuk merayakan setiap kejutan bahagia.',
    celebrationHeadline: '🎊 SELAMAT! KEJUTAN SPESIAL BANK NUSANTARA UNTUK ANDA!',
    celebrationSubtext: 'Terima kasih atas kepercayaan Anda bersama layanan perbankan digital terpadu Bank Nusantara.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-gradient-to-b from-amber-400 via-rose-500 to-cyan-500 border-amber-100',
    waxSealGradientClass: 'from-amber-300 via-yellow-500 to-amber-700 border-amber-100',
    cardBorderAccentClass: 'border-amber-400/80 hover:border-amber-300',
    cardGlowClass: 'shadow-[0_0_45px_rgba(251,191,36,0.35)]',
    bannerGradientClass: 'from-amber-950/95 via-slate-900 to-indigo-950/90 border-amber-400/75',
    badgeClass: 'bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-slate-950',
    cornerOrnamentSymbol: '🎊',
  },
  {
    id: 'none',
    name: 'Tanpa Efek Perayaan (Standar Resmi)',
    shortBadge: '🏛️ Standar Resmi',
    category: 'sultan_vip',
    categoryLabel: 'Sultan & VIP',
    primaryEmoji: '🏛️',
    particleEmojis: ['✨'],
    confettiColors: ['#FBBF24', '#FFFFFF'],
    motionStyle: 'none',
    description: 'Tampilan surat dan kotak hadiah formal klasik tanpa animasi ledakan partikel perayaan.',
    celebrationHeadline: '🏛️ KIRIMAN RESMI BANK NUSANTARA',
    celebrationSubtext: 'Dokumen dan paket resmi Bank Nusantara telah dibuka.',
    recommendedThemeColor: 'amber',
    ribbonColorClass: 'bg-rose-600/90 border-amber-100/60',
    waxSealGradientClass: 'from-amber-300 via-yellow-500 to-amber-700 border-amber-100',
    cardBorderAccentClass: 'border-amber-400/75 hover:border-amber-300',
    cardGlowClass: 'shadow-xl',
    bannerGradientClass: 'from-slate-900 via-slate-950 to-slate-900 border-amber-400/40',
    badgeClass: 'bg-amber-400 text-slate-950',
    cornerOrnamentSymbol: '✦',
  },
];

// Pemetaan backward-compatible untuk paket lama yang masih menyimpan 'confetti' | 'gold_rain' | 'fireworks'
const LEGACY_EFFECT_MAP: Record<string, string> = {
  confetti: 'karnaval_konfeti_klasik',
  gold_rain: 'hujan_emas_sultan',
  fireworks: 'tahun_baru_masehi',
  none: 'none',
};

export function getCelebrationEffectProfile(effectId?: string | null): CelebrationEffectProfile {
  const raw = (effectId || 'ulang_tahun_meriah').trim();
  const mappedId = LEGACY_EFFECT_MAP[raw] || raw;
  return (
    CELEBRATION_EFFECTS_CATALOG.find((item) => item.id === mappedId) ||
    CELEBRATION_EFFECTS_CATALOG[0]
  );
}

/**
 * Menembakkan Koreografi Canvas-Confetti Berlapis Sesuai Profil Perayaan Terpilih
 */
export function triggerCanvasConfettiForCelebration(effectId?: string | null): void {
  const profile = getCelebrationEffectProfile(effectId);
  if (profile.id === 'none' || profile.motionStyle === 'none') return;

  const colors = profile.confettiColors;

  try {
    if (profile.motionStyle === 'patriot_salute') {
      // Salvo Meriam Kiri-Kanan + Bintang Tengah (Khas Kemerdekaan RI / Nasional)
      confetti({
        particleCount: 85,
        angle: 60,
        spread: 65,
        origin: { x: 0.04, y: 0.65 },
        colors,
        startVelocity: 52,
      });
      confetti({
        particleCount: 85,
        angle: 120,
        spread: 65,
        origin: { x: 0.96, y: 0.65 },
        colors,
        startVelocity: 52,
      });
      window.setTimeout(() => {
        confetti({
          particleCount: 110,
          spread: 110,
          origin: { x: 0.5, y: 0.42 },
          colors,
          scalar: 1.15,
        });
      }, 280);
      return;
    }

    if (profile.motionStyle === 'fireworks') {
      // Ledakan Kembang Api Bertahap di 3 Titik Langit
      const points = [
        { x: 0.25, y: 0.35, delay: 0 },
        { x: 0.75, y: 0.32, delay: 240 },
        { x: 0.5, y: 0.28, delay: 500 },
      ];
      points.forEach((pt) => {
        window.setTimeout(() => {
          confetti({
            particleCount: 90,
            spread: 360,
            startVelocity: 38,
            ticks: 90,
            origin: { x: pt.x, y: pt.y },
            colors,
            scalar: 1.1,
          });
        }, pt.delay);
      });
      return;
    }

    if (profile.motionStyle === 'gentle_snow' || profile.motionStyle === 'petal_drift') {
      // Hujan Salju / Kelopak Bunga dari Atas Layar
      confetti({
        particleCount: 95,
        spread: 140,
        startVelocity: 22,
        gravity: 0.55,
        ticks: 160,
        origin: { x: 0.5, y: 0.12 },
        colors,
        scalar: 1.05,
      });
      window.setTimeout(() => {
        confetti({
          particleCount: 65,
          spread: 120,
          startVelocity: 20,
          gravity: 0.5,
          ticks: 150,
          origin: { x: 0.3, y: 0.15 },
          colors,
        });
        confetti({
          particleCount: 65,
          spread: 120,
          startVelocity: 20,
          gravity: 0.5,
          ticks: 150,
          origin: { x: 0.7, y: 0.15 },
          colors,
        });
      }, 320);
      return;
    }

    if (profile.motionStyle === 'royal_shower') {
      // Curahan Emas & Permata dari Atas + Meriam Samping
      confetti({
        particleCount: 120,
        spread: 115,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.35 },
        colors,
        scalar: 1.2,
      });
      window.setTimeout(() => {
        confetti({
          particleCount: 70,
          angle: 65,
          spread: 55,
          origin: { x: 0.08, y: 0.6 },
          colors,
        });
        confetti({
          particleCount: 70,
          angle: 115,
          spread: 55,
          origin: { x: 0.92, y: 0.6 },
          colors,
        });
      }, 250);
      return;
    }

    // Default: Fountain Burst / Lantern Rise
    confetti({
      particleCount: 110,
      spread: 95,
      origin: { x: 0.5, y: 0.55 },
      colors,
      startVelocity: 46,
    });
    window.setTimeout(() => {
      confetti({
        particleCount: 65,
        angle: 60,
        spread: 60,
        origin: { x: 0.1, y: 0.65 },
        colors,
      });
      confetti({
        particleCount: 65,
        angle: 120,
        spread: 60,
        origin: { x: 0.9, y: 0.65 },
        colors,
      });
    }, 220);
  } catch {
    /* ignore canvas confetti errors in headless/sandbox browsers */
  }
}
