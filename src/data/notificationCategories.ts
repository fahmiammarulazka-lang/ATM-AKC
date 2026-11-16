import { NotificationCategory, NotificationCategory10Key } from '../types/bank';

export interface NotificationCategoryMeta {
  key: NotificationCategory10Key;
  numberLabel: string;
  label: string;
  description: string;
  badgeClass: string;
  accentTextClass: string;
  defaultTargetView: string;
  defaultDashboardTab: string;
}

export const NOTIFICATION_CATEGORIES_10: NotificationCategoryMeta[] = [
  {
    key: 'transaksi',
    numberLabel: '01',
    label: 'Transaksi',
    description: 'Setor, tarik tunai, pulsa, token PLN, deposito & tagihan',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    accentTextClass: 'text-emerald-300',
    defaultTargetView: 'dashboard',
    defaultDashboardTab: 'mutasi',
  },
  {
    key: 'transfer',
    numberLabel: '02',
    label: 'Transfer',
    description: 'Transfer reguler antar rekening & transfer bebas aset',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    accentTextClass: 'text-cyan-300',
    defaultTargetView: 'transfer',
    defaultDashboardTab: 'mutasi',
  },
  {
    key: 'keamanan',
    numberLabel: '03',
    label: 'Keamanan',
    description: 'PIN ATM, kunci kartu, status banned, unban & audit sesi',
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    accentTextClass: 'text-rose-300',
    defaultTargetView: 'dashboard',
    defaultDashboardTab: 'ringkasan',
  },
  {
    key: 'pinjaman',
    numberLabel: '04',
    label: 'Pinjaman',
    description: 'Pengajuan kredit, persetujuan & pembayaran angsuran',
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    accentTextClass: 'text-amber-300',
    defaultTargetView: 'dashboard',
    defaultDashboardTab: 'pinjaman',
  },
  {
    key: 'kartu',
    numberLabel: '05',
    label: 'Kartu',
    description: 'Pendaftaran kartu baru, upgrade tier & aktivasi kartu',
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    accentTextClass: 'text-blue-300',
    defaultTargetView: 'dashboard',
    defaultDashboardTab: 'ringkasan',
  },
  {
    key: 'emas',
    numberLabel: '06',
    label: 'Emas',
    description: 'Beli & jual emas 24K serta perubahan harga bulanan',
    badgeClass: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
    accentTextClass: 'text-yellow-300',
    defaultTargetView: 'emas',
    defaultDashboardTab: 'ringkasan',
  },
  {
    key: 'kerja',
    numberLabel: '07',
    label: 'Kerja',
    description: 'Lowongan pekerjaan, naik level, voucher & gaji',
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    accentTextClass: 'text-indigo-300',
    defaultTargetView: 'jobs',
    defaultDashboardTab: 'ringkasan',
  },
  {
    key: 'spin',
    numberLabel: '08',
    label: 'Spin',
    description: 'Spin the Wheel, koin spin & jackpot roda keberuntungan',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
    accentTextClass: 'text-fuchsia-300',
    defaultTargetView: 'spin_wheel',
    defaultDashboardTab: 'ringkasan',
  },
  {
    key: 'hadiah',
    numberLabel: '09',
    label: 'Hadiah',
    description: 'Surat & hadiah event admin, gacha & kode redeem',
    badgeClass: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
    accentTextClass: 'text-orange-300',
    defaultTargetView: 'dashboard',
    defaultDashboardTab: 'ringkasan',
  },
  {
    key: 'sistem',
    numberLabel: '10',
    label: 'Sistem',
    description: 'Pengumuman admin, update versi, chat global & info umum',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    accentTextClass: 'text-slate-300',
    defaultTargetView: 'updates',
    defaultDashboardTab: 'ringkasan',
  },
];

export const DEFAULT_NOTIFICATION_CATEGORY_PERMISSIONS: Record<NotificationCategory10Key, boolean> = {
  transaksi: true,
  transfer: true,
  keamanan: true,
  pinjaman: true,
  kartu: true,
  emas: true,
  kerja: true,
  spin: true,
  hadiah: true,
  sistem: true,
};

export function sanitizeNotificationCategoryPermissions(
  raw?: Partial<Record<string, boolean>> | null
): Record<NotificationCategory10Key, boolean> {
  const result = { ...DEFAULT_NOTIFICATION_CATEGORY_PERMISSIONS };
  if (!raw || typeof raw !== 'object') return result;
  for (const item of NOTIFICATION_CATEGORIES_10) {
    if (typeof raw[item.key] === 'boolean') {
      result[item.key] = Boolean(raw[item.key]);
    }
  }
  return result;
}

export function normalizeNotificationCategory(
  rawCategory?: NotificationCategory | string,
  title = '',
  message = '',
  targetView = ''
): NotificationCategory10Key {
  const directKeys = new Set<string>(NOTIFICATION_CATEGORIES_10.map((c) => c.key));
  const text = `${title} ${message}`.toLowerCase();
  const view = targetView.toLowerCase();

  // If explicit one of the 10 keys, return directly
  if (rawCategory && directKeys.has(rawCategory)) {
    return rawCategory as NotificationCategory10Key;
  }

  // Keyword & targetView enrichment (also refines legacy 'transaction' | 'loan' | 'security' | 'promo')
  if (view === 'emas' || text.includes('emas 24k') || text.includes('emas ') || text.includes('gram emas')) {
    return 'emas';
  }
  if (view === 'spin_wheel' || text.includes('spin') || text.includes('koin spin') || text.includes('roda')) {
    return 'spin';
  }
  if (
    view === 'jobs' ||
    text.includes('lowongan') ||
    text.includes('kerja') ||
    text.includes('gaji') ||
    text.includes('suit') ||
    text.includes('voucher level')
  ) {
    return 'kerja';
  }
  if (
    text.includes('hadiah') ||
    text.includes('surat') ||
    text.includes('gacha') ||
    text.includes('redeem') ||
    text.includes('thr') ||
    text.includes('trial')
  ) {
    return 'hadiah';
  }
  if (text.includes('transfer')) {
    return 'transfer';
  }
  if (
    rawCategory === 'loan' ||
    text.includes('pinjam') ||
    text.includes('angsuran') ||
    text.includes('kredit')
  ) {
    return 'pinjaman';
  }
  if (
    text.includes('upgrade tier') ||
    text.includes('upgrade kartu') ||
    text.includes('kartu baru') ||
    text.includes('permohonan kartu') ||
    text.includes('kartu disetujui') ||
    text.includes('kartu ditolak')
  ) {
    return 'kartu';
  }
  if (
    rawCategory === 'security' ||
    text.includes('pin') ||
    text.includes('kunci') ||
    text.includes('blokir') ||
    text.includes('freeze') ||
    text.includes('banned') ||
    text.includes('unban') ||
    text.includes('banding') ||
    text.includes('tinjau') ||
    text.includes('nomor rekening') ||
    text.includes('centang biru')
  ) {
    return 'keamanan';
  }
  if (
    rawCategory === 'transaction' ||
    text.includes('tarik') ||
    text.includes('setor') ||
    text.includes('transaksi') ||
    text.includes('mutasi') ||
    text.includes('deposito') ||
    text.includes('celengan') ||
    text.includes('pulsa') ||
    text.includes('token') ||
    text.includes('tagihan') ||
    text.includes('resi') ||
    text.includes('cod') ||
    text.includes('pesanan') ||
    text.includes('saldo')
  ) {
    return 'transaksi';
  }

  if (rawCategory === 'promo') return 'sistem';
  return 'sistem';
}

export function getNotificationCategoryMeta(key: NotificationCategory10Key): NotificationCategoryMeta {
  return NOTIFICATION_CATEGORIES_10.find((c) => c.key === key) || NOTIFICATION_CATEGORIES_10[9];
}
