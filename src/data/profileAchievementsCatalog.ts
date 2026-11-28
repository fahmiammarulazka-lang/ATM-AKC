import {
  BankAccount,
  ChatMessage,
  DepositoRecord,
  DreamPocket,
  FamilyGroup,
  FrameSpinHistoryRecord,
  GlobalChatMessage,
  LoyaltyAccountState,
  MissionAccountProgressRecord,
  QrisPaymentOrder,
  SavingsPocket,
  Transaction,
} from '../types/bank';
import { isAdminCardAccount, isUnlimitedNumber } from '../utils/bankUtils';
import {
  FEATURED_TITLES,
  ProfileFeaturedTitle,
  getFeaturedTitleById,
} from './profileCustomizationCatalog';

export type ProfileAchievementCategory =
  | 'kekayaan'
  | 'emas_investasi'
  | 'qris_transaksi'
  | 'misi_spin'
  | 'sosial_profil';

export type ProfileAchievementTier =
  | 'perunggu'
  | 'perak'
  | 'emas'
  | 'berlian'
  | 'legendaris';

export interface ProfileAchievementMetrics {
  balance: number;
  netWorth: number;
  totalIncome: number;
  activePocketsAndDreamsCount: number;
  goldGrams: number;
  depositoCount: number;
  totalDepositoPrincipal: number;
  txCount: number;
  qrisTxCount: number;
  streakDays: number;
  claimedMissionsCount: number;
  diamonds: number;
  spinCountTotal: number;
  ownedSpinFramesCount: number;
  payChatMessagesCount: number;
  savedContactsCount: number;
  familyCount: number;
  profileCompletionScore: number;
  isUnlimitedBalance: boolean;
}

export interface ProfileAchievementDefinition {
  id: string;
  title: string;
  description: string;
  requirementLabel: string;
  category: ProfileAchievementCategory;
  tier: ProfileAchievementTier;
  points: number;
  rewardTitleId?: string;
  targetValue: number;
  unitLabel: string;
  formatValue?: (val: number) => string;
  evaluateValue: (metrics: ProfileAchievementMetrics) => number;
}

export type ProfileAchievementStatus = 'claimed' | 'ready' | 'locked';

export interface EvaluatedProfileAchievement {
  definition: ProfileAchievementDefinition;
  currentValue: number;
  targetValue: number;
  progressPct: number;
  status: ProfileAchievementStatus;
  claimedAtIso?: string;
  rewardTitle?: ProfileFeaturedTitle;
}

export const PROFILE_ACHIEVEMENT_CATEGORY_LABELS: Record<
  ProfileAchievementCategory,
  string
> = {
  kekayaan: 'Kekayaan & Kantong',
  emas_investasi: 'Emas & Investasi',
  qris_transaksi: 'QRIS & Transaksi',
  misi_spin: 'Misi, Streak & Permata',
  sosial_profil: 'Spin, PayChat & Profil',
};

export const PROFILE_ACHIEVEMENT_TIER_META: Record<
  ProfileAchievementTier,
  { label: string; badgeClass: string; barClass: string }
> = {
  perunggu: {
    label: 'Perunggu',
    badgeClass: 'text-orange-800 bg-orange-50 border-orange-200',
    barClass: 'bg-orange-500',
  },
  perak: {
    label: 'Perak',
    badgeClass: 'text-slate-700 bg-slate-100 border-slate-300',
    barClass: 'bg-slate-600',
  },
  emas: {
    label: 'Emas',
    badgeClass: 'text-amber-900 bg-amber-50 border-amber-300',
    barClass: 'bg-amber-500',
  },
  berlian: {
    label: 'Berlian',
    badgeClass: 'text-cyan-900 bg-cyan-50 border-cyan-300',
    barClass: 'bg-cyan-500',
  },
  legendaris: {
    label: 'Legendaris',
    badgeClass: 'text-fuchsia-900 bg-fuchsia-50 border-fuchsia-300',
    barClass: 'bg-gradient-to-r from-violet-600 to-fuchsia-600',
  },
};

function formatShortRupiah(value: number): string {
  if (!Number.isFinite(value) || value >= 999_999_999_999) return '∞';
  if (value >= 1_000_000_000) {
    return `Rp ${(value / 1_000_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000_000) {
    return `Rp ${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}jt`;
  }
  if (value >= 1_000) {
    return `Rp ${Math.round(value / 1_000).toLocaleString('id-ID')}rb`;
  }
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function formatGram(value: number): string {
  return `${Number(value.toFixed(2))}g`;
}

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString('id-ID');
}

export const PROFILE_ACHIEVEMENTS: ProfileAchievementDefinition[] = [
  // ======================== KATEGORI 1: KEKAYAAN & KANTONG (6) ========================
  {
    id: 'ach-saldo-pertama',
    title: 'Langkah Awal Tabungan',
    description: 'Menjaga saldo rekening utama tetap sehat di atas setengah juta.',
    requirementLabel: 'Saldo rekening mencapai minimal Rp 500.000',
    category: 'kekayaan',
    tier: 'perunggu',
    points: 25,
    targetValue: 500_000,
    unitLabel: 'Saldo',
    formatValue: formatShortRupiah,
    evaluateValue: (m) => m.balance,
  },
  {
    id: 'ach-nasabah-prioritas',
    title: 'Nasabah Prioritas',
    description: 'Memiliki likuiditas utama papan atas untuk membuka status prioritas.',
    requirementLabel: 'Saldo rekening mencapai minimal Rp 10.000.000',
    category: 'kekayaan',
    tier: 'emas',
    points: 150,
    rewardTitleId: 'title-nasabah-prioritas',
    targetValue: 10_000_000,
    unitLabel: 'Saldo',
    formatValue: formatShortRupiah,
    evaluateValue: (m) => m.balance,
  },
  {
    id: 'ach-kantong-pertama',
    title: 'Penabung Disiplin',
    description: 'Mulai memisahkan dana di Kantong Nabung atau Kantong Impian.',
    requirementLabel: 'Memiliki minimal 1 Kantong / Kantong Impian terisi saldo',
    category: 'kekayaan',
    tier: 'perunggu',
    points: 40,
    targetValue: 1,
    unitLabel: 'Kantong',
    formatValue: formatInteger,
    evaluateValue: (m) => m.activePocketsAndDreamsCount,
  },
  {
    id: 'ach-arsitek-impian',
    title: 'Arsitek Impian',
    description: 'Merencanakan masa depan finansial lewat berbagai kantong target.',
    requirementLabel: 'Mengisi minimal 3 Kantong Nabung / Kantong Impian aktif',
    category: 'kekayaan',
    tier: 'perak',
    points: 120,
    rewardTitleId: 'title-arsitek-impian',
    targetValue: 3,
    unitLabel: 'Kantong',
    formatValue: formatInteger,
    evaluateValue: (m) => m.activePocketsAndDreamsCount,
  },
  {
    id: 'ach-arus-kas-50jt',
    title: 'Arus Kas Deras',
    description: 'Mencatat total pemasukan historis bernilai besar di rekening.',
    requirementLabel: 'Total dana masuk historis minimal Rp 50.000.000',
    category: 'kekayaan',
    tier: 'emas',
    points: 140,
    targetValue: 50_000_000,
    unitLabel: 'Masuk',
    formatValue: formatShortRupiah,
    evaluateValue: (m) => m.totalIncome,
  },
  {
    id: 'ach-sultan-nusantara',
    title: 'Sultan Nusantara',
    description: 'Puncak portofolio kekayaan gabungan saldo, emas, deposito, dan kantong.',
    requirementLabel: 'Total kekayaan bersih mencapai minimal Rp 100.000.000',
    category: 'kekayaan',
    tier: 'legendaris',
    points: 400,
    rewardTitleId: 'title-sultan-nusantara',
    targetValue: 100_000_000,
    unitLabel: 'Aset',
    formatValue: formatShortRupiah,
    evaluateValue: (m) => m.netWorth,
  },

  // ======================== KATEGORI 2: EMAS & INVESTASI (5) ========================
  {
    id: 'ach-keping-emas',
    title: 'Keping Emas Pertama',
    description: 'Memulai proteksi nilai kekayaan lewat brankas Emas Digital.',
    requirementLabel: 'Memiliki simpanan Emas Digital minimal 0,1 gram',
    category: 'emas_investasi',
    tier: 'perunggu',
    points: 35,
    targetValue: 0.1,
    unitLabel: 'Emas',
    formatValue: formatGram,
    evaluateValue: (m) => m.goldGrams,
  },
  {
    id: 'ach-kolektor-emas',
    title: 'Kolektor Emas 24K',
    description: 'Mengumpulkan cadangan logam mulia dalam jumlah solid.',
    requirementLabel: 'Memiliki simpanan Emas Digital minimal 5 gram',
    category: 'emas_investasi',
    tier: 'emas',
    points: 160,
    rewardTitleId: 'title-kolektor-emas',
    targetValue: 5,
    unitLabel: 'Emas',
    formatValue: formatGram,
    evaluateValue: (m) => m.goldGrams,
  },
  {
    id: 'ach-juragan-emas-25',
    title: 'Juragan Emas 25 Gram',
    description: 'Cadangan emas fisik digital tingkat lanjut di brankas Nusantara.',
    requirementLabel: 'Memiliki simpanan Emas Digital minimal 25 gram',
    category: 'emas_investasi',
    tier: 'berlian',
    points: 260,
    targetValue: 25,
    unitLabel: 'Emas',
    formatValue: formatGram,
    evaluateValue: (m) => m.goldGrams,
  },
  {
    id: 'ach-deposito-pertama',
    title: 'Investor Pemula',
    description: 'Membuka instrumen Deposito Berjangka pertama untuk imbal hasil tetap.',
    requirementLabel: 'Memiliki minimal 1 portofolio Deposito aktif',
    category: 'emas_investasi',
    tier: 'perak',
    points: 75,
    targetValue: 1,
    unitLabel: 'Deposito',
    formatValue: formatInteger,
    evaluateValue: (m) => m.depositoCount,
  },
  {
    id: 'ach-investor-ulung',
    title: 'Investor Ulung',
    description: 'Mengembangkan modal jangka panjang melalui portofolio deposito.',
    requirementLabel: 'Memiliki minimal 2 Deposito atau total pokok Rp 5.000.000+',
    category: 'emas_investasi',
    tier: 'emas',
    points: 180,
    rewardTitleId: 'title-investor-ulung',
    targetValue: 1,
    unitLabel: 'Syarat',
    formatValue: (v) => (v >= 1 ? 'Terpenuhi' : 'Belum'),
    evaluateValue: (m) =>
      m.depositoCount >= 2 || m.totalDepositoPrincipal >= 5_000_000 ? 1 : 0,
  },

  // ======================== KATEGORI 3: QRIS & TRANSAKSI (6) ========================
  {
    id: 'ach-transaksi-pertama',
    title: 'Langkah Pertama Finansial',
    description: 'Menyelesaikan aktivitas mutasi keuangan pertama Anda.',
    requirementLabel: 'Menyelesaikan minimal 1 transaksi keuangan tercatat',
    category: 'qris_transaksi',
    tier: 'perunggu',
    points: 25,
    targetValue: 1,
    unitLabel: 'Transaksi',
    formatValue: formatInteger,
    evaluateValue: (m) => m.txCount,
  },
  {
    id: 'ach-qris-pertama',
    title: 'Pembayar Cepat QRIS',
    description: 'Mencicipi pembayaran nirsentuh QRIS Digital pertama.',
    requirementLabel: 'Menyelesaikan minimal 1 transaksi atau order QRIS',
    category: 'qris_transaksi',
    tier: 'perunggu',
    points: 35,
    targetValue: 1,
    unitLabel: 'QRIS',
    formatValue: formatInteger,
    evaluateValue: (m) => m.qrisTxCount,
  },
  {
    id: 'ach-pioner-qris',
    title: 'Pioner Digital QRIS',
    description: 'Terbiasa bertransaksi serba cepat dengan QRIS Bank Nusantara.',
    requirementLabel: 'Menyelesaikan minimal 5 transaksi atau order QRIS',
    category: 'qris_transaksi',
    tier: 'perak',
    points: 120,
    rewardTitleId: 'title-pioner-digital',
    targetValue: 5,
    unitLabel: 'QRIS',
    formatValue: formatInteger,
    evaluateValue: (m) => m.qrisTxCount,
  },
  {
    id: 'ach-sultan-qris',
    title: 'Master QRIS 20x',
    description: 'Menjadi pengguna aktif ekosistem QRIS di berbagai merchant & toko.',
    requirementLabel: 'Menyelesaikan minimal 20 transaksi atau order QRIS',
    category: 'qris_transaksi',
    tier: 'berlian',
    points: 240,
    targetValue: 20,
    unitLabel: 'QRIS',
    formatValue: formatInteger,
    evaluateValue: (m) => m.qrisTxCount,
  },
  {
    id: 'ach-saudagar-nusantara',
    title: 'Saudagar Nusantara',
    description: 'Perputaran transaksi rutin tingkat saudagar aktif.',
    requirementLabel: 'Menyelesaikan minimal 25 kali transaksi keuangan',
    category: 'qris_transaksi',
    tier: 'emas',
    points: 175,
    rewardTitleId: 'title-saudagar-nusantara',
    targetValue: 25,
    unitLabel: 'Transaksi',
    formatValue: formatInteger,
    evaluateValue: (m) => m.txCount,
  },
  {
    id: 'ach-transaksi-100',
    title: 'Mesin Transaksi 100',
    description: 'Menembus seratus riwayat transaksi pada rekening pribadi.',
    requirementLabel: 'Menyelesaikan minimal 100 kali transaksi keuangan',
    category: 'qris_transaksi',
    tier: 'legendaris',
    points: 350,
    targetValue: 100,
    unitLabel: 'Transaksi',
    formatValue: formatInteger,
    evaluateValue: (m) => m.txCount,
  },

  // ======================== KATEGORI 4: MISI, STREAK & PERMATA (6) ========================
  {
    id: 'ach-streak-3',
    title: 'Nyala Api Pertama',
    description: 'Menjaga konsistensi check-in harian selama tiga hari berturut-turut.',
    requirementLabel: 'Mencapai Streak Loyalty minimal 3 hari',
    category: 'misi_spin',
    tier: 'perunggu',
    points: 40,
    targetValue: 3,
    unitLabel: 'Hari',
    formatValue: formatInteger,
    evaluateValue: (m) => m.streakDays,
  },
  {
    id: 'ach-penjaga-streak',
    title: 'Penjaga Api Streak',
    description: 'Dedikasi mingguan menjaga api streak Loyalty tetap menyala.',
    requirementLabel: 'Mencapai Streak Loyalty minimal 7 hari berturut-turut',
    category: 'misi_spin',
    tier: 'emas',
    points: 160,
    rewardTitleId: 'title-penjaga-streak',
    targetValue: 7,
    unitLabel: 'Hari',
    formatValue: formatInteger,
    evaluateValue: (m) => m.streakDays,
  },
  {
    id: 'ach-streak-30',
    title: 'Penguasa Bulan Streak',
    description: 'Satu bulan penuh hadir aktif tanpa memadamkan api streak.',
    requirementLabel: 'Mencapai Streak Loyalty minimal 30 hari',
    category: 'misi_spin',
    tier: 'legendaris',
    points: 400,
    targetValue: 30,
    unitLabel: 'Hari',
    formatValue: formatInteger,
    evaluateValue: (m) => m.streakDays,
  },
  {
    id: 'ach-penjelajah-misi',
    title: 'Penjelajah 100 Misi',
    description: 'Rajin menuntaskan berbagai tantangan harian di pusat Misi & Loyalty.',
    requirementLabel: 'Mengklaim minimal 15 kali misi harian atau Loyalty',
    category: 'misi_spin',
    tier: 'emas',
    points: 170,
    rewardTitleId: 'title-penjelajah-misi',
    targetValue: 15,
    unitLabel: 'Misi',
    formatValue: formatInteger,
    evaluateValue: (m) => m.claimedMissionsCount,
  },
  {
    id: 'ach-pemburu-permata',
    title: 'Pemburu Permata',
    description: 'Mengoleksi cadangan Permata (Diamond) bernilai tinggi.',
    requirementLabel: 'Memiliki saldo minimal 250 Permata (Diamond)',
    category: 'misi_spin',
    tier: 'emas',
    points: 150,
    rewardTitleId: 'title-pemburu-diamond',
    targetValue: 250,
    unitLabel: 'Permata',
    formatValue: formatInteger,
    evaluateValue: (m) => m.diamonds,
  },
  {
    id: 'ach-permata-1000',
    title: 'Gudang Permata 1.000',
    description: 'Memiliki koleksi seribu Permata sekaligus di brankas akun.',
    requirementLabel: 'Memiliki saldo minimal 1.000 Permata (Diamond)',
    category: 'misi_spin',
    tier: 'berlian',
    points: 280,
    targetValue: 1000,
    unitLabel: 'Permata',
    formatValue: formatInteger,
    evaluateValue: (m) => m.diamonds,
  },

  // ======================== KATEGORI 5: SPIN, PAYCHAT & PROFIL (5) ========================
  {
    id: 'ach-spin-bingkai-5',
    title: 'Pemutar Roda Bingkai',
    description: 'Mencoba peruntungan di arena heksagon Spin Bingkai.',
    requirementLabel: 'Melakukan minimal 5 putaran di Spin Bingkai',
    category: 'sosial_profil',
    tier: 'perak',
    points: 80,
    targetValue: 5,
    unitLabel: 'Putaran',
    formatValue: formatInteger,
    evaluateValue: (m) => m.spinCountTotal,
  },
  {
    id: 'ach-kolektor-aura',
    title: 'Kolektor Aura Legendaris',
    description: 'Menguasai mayoritas bingkai aura eksklusif paling langka.',
    requirementLabel: 'Memiliki minimal 3 Bingkai Aura Eksklusif Spin Bingkai',
    category: 'sosial_profil',
    tier: 'legendaris',
    points: 380,
    rewardTitleId: 'title-kolektor-aura',
    targetValue: 3,
    unitLabel: 'Bingkai',
    formatValue: formatInteger,
    evaluateValue: (m) => m.ownedSpinFramesCount,
  },
  {
    id: 'ach-sosial-paychat-10',
    title: 'Sapaan Ramah PayChat',
    description: 'Aktif berkomunikasi dengan komunitas nasabah di PayChat Nusantara.',
    requirementLabel: 'Mengirim minimal 10 pesan di PayChat Global/Privat',
    category: 'sosial_profil',
    tier: 'perunggu',
    points: 50,
    targetValue: 10,
    unitLabel: 'Pesan',
    formatValue: formatInteger,
    evaluateValue: (m) => m.payChatMessagesCount,
  },
  {
    id: 'ach-bintang-paychat',
    title: 'Bintang PayChat',
    description: 'Komunikator sosial unggulan dengan jejaring kontak PayChat.',
    requirementLabel: 'Mengirim minimal 25 pesan PayChat & memiliki minimal 1 kontak tersimpan',
    category: 'sosial_profil',
    tier: 'emas',
    points: 180,
    rewardTitleId: 'title-bintang-paychat',
    targetValue: 25,
    unitLabel: 'Pesan+Kontak',
    formatValue: formatInteger,
    evaluateValue: (m) =>
      m.savedContactsCount >= 1 ? m.payChatMessagesCount : Math.min(24, m.payChatMessagesCount),
  },
  {
    id: 'ach-profil-bintang-5',
    title: 'Profil Lengkap Bintang 5',
    description: 'Melengkapi identitas personal (Bio, Kota Domisili, & Avatar Preset).',
    requirementLabel: 'Mengisi Bio Profil, Kota Domisili, dan memilih Avatar Preset',
    category: 'sosial_profil',
    tier: 'perak',
    points: 75,
    targetValue: 3,
    unitLabel: 'Kelengkapan',
    formatValue: (v) => `${Math.round(v)}/3`,
    evaluateValue: (m) => m.profileCompletionScore,
  },
];

export interface ComputeAchievementMetricsInput {
  account: BankAccount;
  transactions: Transaction[];
  pockets: SavingsPocket[];
  dreamPockets: DreamPocket[];
  depositos: DepositoRecord[];
  families: FamilyGroup[];
  loyaltyState?: LoyaltyAccountState;
  missionProgressByAccount?: Record<string, MissionAccountProgressRecord>;
  qrisOrders?: QrisPaymentOrder[];
  frameSpinHistory?: FrameSpinHistoryRecord[];
  globalChats?: GlobalChatMessage[];
  privateChats?: ChatMessage[];
  goldPricePerGram?: number;
}

export function computeProfileAchievementMetrics(
  input: ComputeAchievementMetricsInput
): ProfileAchievementMetrics {
  const {
    account,
    transactions,
    pockets,
    dreamPockets,
    depositos,
    families,
    loyaltyState,
    missionProgressByAccount,
    qrisOrders = [],
    frameSpinHistory = [],
    globalChats = [],
    privateChats = [],
    goldPricePerGram = 1_450_000,
  } = input;

  const isAdmin = isAdminCardAccount(account);
  const isUnlimitedBal = isAdmin || isUnlimitedNumber(account.balance);
  const effectiveBalance = isUnlimitedBal
    ? 999_999_999_999
    : Math.max(0, Number(account.balance) || 0);

  const myTxs = transactions.filter((t) => t.accountId === account.id);
  const incomeTypes = new Set([
    'setor',
    'transfer_in',
    'pinjaman_disburse',
    'celengan_tarik',
    'transfer_bebas_in',
    'jual_emas',
  ]);
  const totalIncome = myTxs
    .filter((t) => incomeTypes.has(t.type))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const myPockets = pockets.filter((p) => p.accountId === account.id);
  const myDreams = dreamPockets.filter((d) => d.accountId === account.id);
  const totalPocketsBal =
    myPockets.reduce((s, p) => s + (Number(p.currentAmount) || 0), 0) +
    myDreams.reduce((s, d) => s + (Number(d.currentAmount) || 0), 0);
  const activePocketsAndDreamsCount =
    myPockets.filter((p) => (Number(p.currentAmount) || 0) > 0).length +
    myDreams.filter((d) => (Number(d.currentAmount) || 0) > 0).length;

  const myDepositos = depositos.filter((d) => d.accountId === account.id);
  const totalDepositoPrincipal = myDepositos.reduce(
    (s, d) => s + (Number(d.principalAmount) || 0),
    0
  );

  const goldGrams = Math.max(0, Number(account.goldGrams) || 0);
  const goldValue = Math.round(goldGrams * goldPricePerGram);

  const netWorth = isUnlimitedBal
    ? 999_999_999_999
    : effectiveBalance + totalPocketsBal + totalDepositoPrincipal + goldValue;

  const qrisPaidOrdersCount = qrisOrders.filter(
    (o) => o.accountId === account.id && o.status === 'LUNAS'
  ).length;
  const qrisFromTxCount = myTxs.filter((t) => t.type === 'qris_pay').length;
  const qrisTxCount = Math.max(qrisFromTxCount, qrisPaidOrdersCount) + (qrisFromTxCount > 0 && qrisPaidOrdersCount > 0 ? 0 : 0);

  const loyaltyClaimedCount =
    (loyaltyState?.dailyClaimedMissionIds?.length || 0) +
    (loyaltyState?.claimedAchievementIds?.length || 0);
  const trackedMissionClaims = missionProgressByAccount
    ? Object.values(missionProgressByAccount).reduce(
        (sum, rec) => sum + Math.max(0, Number(rec.totalClaims) || (rec.claimedDates?.length || 0)),
        0
      )
    : 0;
  const claimedMissionsCount = loyaltyClaimedCount + trackedMissionClaims;

  const myFrameSpins = frameSpinHistory
    .filter((h) => h.accountId === account.id)
    .reduce((sum, h) => sum + (Number(h.spinCount) || 1), 0);

  const myGlobalMsgs = globalChats.filter(
    (m) =>
      m.senderAccountId === account.id ||
      m.senderAccount === account.accountNumber
  ).length;
  const myPrivateMsgs = privateChats.filter(
    (m) =>
      m.senderAccountId === account.id ||
      m.senderAccount === account.accountNumber
  ).length;

  const myFamiliesCount = families.filter((f) =>
    f.members.some((m) => m.accountId === account.id)
  ).length;

  const profileCompletionScore =
    (account.profileBio && account.profileBio.trim().length > 0 ? 1 : 0) +
    (account.city && account.city.trim().length > 0 ? 1 : 0) +
    (account.avatarPresetId && account.avatarPresetId.trim().length > 0 ? 1 : 0);

  return {
    balance: effectiveBalance,
    netWorth,
    totalIncome: isUnlimitedBal ? 999_999_999_999 : totalIncome,
    activePocketsAndDreamsCount,
    goldGrams: isAdmin ? Math.max(goldGrams, 100) : goldGrams,
    depositoCount: myDepositos.length,
    totalDepositoPrincipal,
    txCount: myTxs.length,
    qrisTxCount: Math.max(qrisFromTxCount, qrisPaidOrdersCount),
    streakDays: Math.max(0, Number(loyaltyState?.streakDays) || 0),
    claimedMissionsCount,
    diamonds: isAdmin ? 999_999_999 : Math.max(0, Number(account.diamonds) || 0),
    spinCountTotal: myFrameSpins,
    ownedSpinFramesCount: (account.ownedSpinFrameIds || []).length,
    payChatMessagesCount: myGlobalMsgs + myPrivateMsgs,
    savedContactsCount: (account.savedChatContacts || []).length,
    familyCount: myFamiliesCount,
    profileCompletionScore,
    isUnlimitedBalance: isUnlimitedBal,
  };
}

export interface EvaluatedAchievementBundle {
  items: EvaluatedProfileAchievement[];
  byId: Record<string, EvaluatedProfileAchievement>;
  byTitleId: Record<string, EvaluatedProfileAchievement>;
  claimedCount: number;
  readyCount: number;
  totalPoints: number;
  unlockedTitleIds: Set<string>;
}

export function evaluateProfileAchievements(
  metrics: ProfileAchievementMetrics,
  claimsMap?: Record<string, string>
): EvaluatedAchievementBundle {
  const safeClaims = claimsMap || {};
  const items: EvaluatedProfileAchievement[] = [];
  const byId: Record<string, EvaluatedProfileAchievement> = {};
  const byTitleId: Record<string, EvaluatedProfileAchievement> = {};
  const unlockedTitleIds = new Set<string>();

  let claimedCount = 0;
  let readyCount = 0;
  let totalPoints = 0;

  for (const def of PROFILE_ACHIEVEMENTS) {
    const rawVal = Math.max(0, def.evaluateValue(metrics));
    const claimedAtIso = safeClaims[def.id];
    const isClaimed = Boolean(claimedAtIso);
    const isMet = rawVal >= def.targetValue;
    const status: ProfileAchievementStatus = isClaimed
      ? 'claimed'
      : isMet
      ? 'ready'
      : 'locked';

    const progressPct = isClaimed
      ? 100
      : Math.min(100, Math.max(0, Math.round((rawVal / Math.max(0.0001, def.targetValue)) * 100)));

    const rewardTitle = def.rewardTitleId
      ? getFeaturedTitleById(def.rewardTitleId)
      : undefined;

    if (isClaimed) {
      claimedCount += 1;
      totalPoints += def.points;
      if (def.rewardTitleId) {
        unlockedTitleIds.add(def.rewardTitleId);
      }
    } else if (isMet) {
      readyCount += 1;
    }

    const evaluated: EvaluatedProfileAchievement = {
      definition: def,
      currentValue: rawVal,
      targetValue: def.targetValue,
      progressPct,
      status,
      claimedAtIso,
      rewardTitle,
    };

    items.push(evaluated);
    byId[def.id] = evaluated;
    if (def.rewardTitleId) {
      byTitleId[def.rewardTitleId] = evaluated;
    }
  }

  return {
    items,
    byId,
    byTitleId,
    claimedCount,
    readyCount,
    totalPoints,
    unlockedTitleIds,
  };
}

export function isTitleUnlockedForAccount(
  account: Pick<BankAccount, 'profileAchievementClaims' | 'unlockedAdminTitleIds'>,
  titleId?: string
): boolean {
  if (!titleId) return false;
  const title = FEATURED_TITLES.find((t) => t.id === titleId);
  if (!title) return false;
  if (Array.isArray(account.unlockedAdminTitleIds) && account.unlockedAdminTitleIds.includes(titleId)) {
    return true;
  }
  return Boolean(account.profileAchievementClaims?.[title.unlockAchievementId]);
}
