/**
 * Seed initial data for Bank Nusantara
 * Seluruh 6 akun bot warga dan transaksi/chat dummy telah dihapus permanen.
 * Database hanya menyimpan akun asli yang dibuat oleh pengguna & Panel Admin, serta 1 Kartu Admin Utama bawaan.
 */
import {
  BankAccount,
  Transaction,
  LoanApplication,
  ScheduledPayment,
  FavoriteAccount,
  AppNotification,
  ChatMessage,
  CardUpgradeApplication,
  PocketSaving,
  DepositoRecord,
  CardlessToken,
} from '../types/bank';

/**
 * Daftar ID dan Nomor Rekening 6 akun bot lama yang wajib dihapus permanen dari Cloud Firestore & State
 */
export const PURGED_BOT_ACCOUNT_IDS: string[] = [
  'acc-1',
  'acc-friend',
  'acc-2',
  'acc-3',
  'acc-4',
  'acc-pending-1',
];

export const PURGED_BOT_ACCOUNT_NUMBERS: string[] = [
  '1029384756',
  '5566778899',
  '8849201934',
  '7741902835',
  '2910384756',
  '9102847163',
];

export const INITIAL_ACCOUNTS: BankAccount[] = [
  {
    id: 'acc-admin',
    userId16: '9999999999999999',
    accountNumber: '9999999999', // KARTU ADMIN UTAMA (SEMUANYA TIDAK TERBATAS / INFINITY ∞)
    fullName: 'Kartu Admin Utama (∞ Unlimited)',
    nik: '9999999999999999',
    phone: '089999999999',
    email: 'admin.infinity@banknusantara.co.id',
    address: 'Kantor Pusat Otoritas Bank Nusantara, Menara Nusantara Lt. 99',
    pin: '159357',
    balance: 999_999_999_999_999, // ∞ (Tidak Terbatas)
    cardTier: 'admin',
    cardNumber: '5392 9999 9999 9999',
    cvv: '999',
    expiryDate: '∞ / SELAMANYA',
    cardStatus: 'active',
    dailyWithdrawnToday: 0,
    lastWithdrawalDate: '',
    initialDeposit: 999_999_999_999_999,
    createdAt: '2020-01-01T00:00:00Z',
    rewardPoints: 999_999_999_999_999,
    allowInternational: true,
    customSpendingLimit: 999_999_999_999_999,
    pulsaBalance: 999_999_999_999_999,
    plnKwhBalance: 999_999_999,
    isVerified: true,
    verifiedAt: '2020-01-01T00:00:00Z',
    verifiedLabel: 'Otoritas Pusat Admin (∞ Verified)',
    isOfficialAdminAccount: true,
    oaAdminPin: '159357',
  },
];

export const INITIAL_UPGRADES: CardUpgradeApplication[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_LOANS: LoanApplication[] = [];

export const INITIAL_SCHEDULED_PAYMENTS: ScheduledPayment[] = [];

export const INITIAL_FAVORITES: FavoriteAccount[] = [];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'Selamat Datang di Bank Nusantara Digital 💳',
    message:
      'Seluruh data akun Anda tersinkronisasi secara real-time di Cloud Firestore lintas perangkat (Laptop & HP).',
    type: 'success',
    timestamp: new Date().toISOString(),
    read: false,
  },
];

export const INITIAL_CHATS: ChatMessage[] = [];

export const INITIAL_POCKETS: PocketSaving[] = [];

export const INITIAL_DEPOSITOS: DepositoRecord[] = [];

export const INITIAL_CARDLESS: CardlessToken[] = [];
