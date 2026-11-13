import type {
  BudgetCategory,
  BudgetCategoryColor,
  BudgetCategoryIcon,
  ManualExpenseRecord,
  Transaction,
} from '../types/bank';

export const DEFAULT_BUDGET_CATEGORIES: BudgetCategory[] = [
  {
    id: 'cat-groceries',
    accountId: '__ALL__',
    name: 'Belanja Harian & Groceries',
    monthlyLimit: 3_000_000,
    icon: 'shopping-cart',
    color: 'emerald',
    keywords: [
      'supermarket',
      'minimarket',
      'indomaret',
      'alfamart',
      'sembako',
      'grocer',
      'pasar',
      'sayur',
      'buah',
      'belanja harian',
      'dapur',
    ],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-utilities',
    accountId: '__ALL__',
    name: 'Tagihan & Utilitas',
    monthlyLimit: 2_000_000,
    icon: 'zap',
    color: 'amber',
    keywords: [
      'pln',
      'listrik',
      'token',
      'pdam',
      'air',
      'internet',
      'wifi',
      'indihome',
      'pulsa',
      'kuota',
      'bpjs',
      'pajak',
      'telkom',
      'cicilan',
      'pinjaman',
    ],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-entertainment',
    accountId: '__ALL__',
    name: 'Hiburan & Streaming',
    monthlyLimit: 1_500_000,
    icon: 'film',
    color: 'violet',
    keywords: [
      'netflix',
      'spotify',
      'bioskop',
      'game',
      'steam',
      'voucher',
      'hiburan',
      'tiket',
      'konser',
      'youtube',
      'spin',
      'koin',
    ],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-food',
    accountId: '__ALL__',
    name: 'Makan & Minum',
    monthlyLimit: 2_500_000,
    icon: 'utensils',
    color: 'orange',
    keywords: [
      'makan',
      'minum',
      'kopi',
      'restoran',
      'cafe',
      'kafe',
      'gofood',
      'grabfood',
      'warung',
      'kuliner',
      'sarapan',
      'siang',
      'malam',
    ],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-transport',
    accountId: '__ALL__',
    name: 'Transportasi & BBM',
    monthlyLimit: 1_500_000,
    icon: 'car',
    color: 'cyan',
    keywords: [
      'bensin',
      'bbm',
      'pertamina',
      'shell',
      'tol',
      'etoll',
      'parkir',
      'ojol',
      'gojek',
      'grab',
      'kereta',
      'pesawat',
      'transport',
      'krl',
      'mrt',
    ],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-health',
    accountId: '__ALL__',
    name: 'Kesehatan & Farmasi',
    monthlyLimit: 1_200_000,
    icon: 'heart-pulse',
    color: 'rose',
    keywords: ['apotek', 'dokter', 'rumah sakit', 'klinik', 'obat', 'vitamin', 'kesehatan', 'gym'],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-lifestyle',
    accountId: '__ALL__',
    name: 'Belanja & Gaya Hidup',
    monthlyLimit: 2_500_000,
    icon: 'shopping-bag',
    color: 'indigo',
    keywords: [
      'tokopedia',
      'shopee',
      'lazada',
      'baju',
      'sepatu',
      'elektronik',
      'cod',
      'resi',
      'fashion',
      'pembayaran',
      'belanja',
    ],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'cat-other',
    accountId: '__ALL__',
    name: 'Transfer & Pengeluaran Lainnya',
    monthlyLimit: 5_000_000,
    icon: 'wallet',
    color: 'slate',
    keywords: ['transfer', 'tarik', 'atm', 'kirim', 'admin', 'emas', 'sultan', 'celengan', 'deposito'],
    isDefault: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];

export const BUDGET_COLOR_PALETTE: Record<
  BudgetCategoryColor,
  { hex: string; text: string; bgSoft: string; border: string; bar: string }
> = {
  emerald: {
    hex: '#10b981',
    text: 'text-emerald-400',
    bgSoft: 'bg-emerald-500/15',
    border: 'border-emerald-500/35',
    bar: 'bg-emerald-500',
  },
  amber: {
    hex: '#f59e0b',
    text: 'text-amber-400',
    bgSoft: 'bg-amber-500/15',
    border: 'border-amber-500/35',
    bar: 'bg-amber-500',
  },
  indigo: {
    hex: '#6366f1',
    text: 'text-indigo-400',
    bgSoft: 'bg-indigo-500/15',
    border: 'border-indigo-500/35',
    bar: 'bg-indigo-500',
  },
  rose: {
    hex: '#f43f5e',
    text: 'text-rose-400',
    bgSoft: 'bg-rose-500/15',
    border: 'border-rose-500/35',
    bar: 'bg-rose-500',
  },
  cyan: {
    hex: '#06b6d4',
    text: 'text-cyan-400',
    bgSoft: 'bg-cyan-500/15',
    border: 'border-cyan-500/35',
    bar: 'bg-cyan-500',
  },
  violet: {
    hex: '#8b5cf6',
    text: 'text-violet-400',
    bgSoft: 'bg-violet-500/15',
    border: 'border-violet-500/35',
    bar: 'bg-violet-500',
  },
  orange: {
    hex: '#f97316',
    text: 'text-orange-400',
    bgSoft: 'bg-orange-500/15',
    border: 'border-orange-500/35',
    bar: 'bg-orange-500',
  },
  slate: {
    hex: '#64748b',
    text: 'text-slate-300',
    bgSoft: 'bg-slate-500/15',
    border: 'border-slate-500/35',
    bar: 'bg-slate-400',
  },
};

const OUTGOING_EXPENSE_TYPES = new Set<string>([
  'tarik',
  'transfer_out',
  'pinjaman_bayar',
  'biaya_admin',
  'qris_pay',
  'tagihan_listrik',
  'tagihan_pulsa',
  'tagihan_bpjs',
  'tagihan_pdam',
  'tagihan_pajak',
  'topup_ewallet',
  'donasi',
  'voucher_game',
  'tiket_travel',
  'chat_transfer',
  'cardless_withdraw',
  'bayar_resi',
  'belanja_fitur',
  'transfer_bebas_out',
  'beli_emas',
]);

export function isOutgoingExpenseTransaction(tx: Transaction): boolean {
  if (!tx || tx.status === 'rejected') return false;
  if (typeof tx.amount !== 'number' || tx.amount <= 0) return false;
  return OUTGOING_EXPENSE_TYPES.has(tx.type);
}

export function getMonthKeyFromTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatMonthLabelIndo(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const year = Number(yStr);
  const monthIdx = Number(mStr) - 1;
  const names = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  if (!year || monthIdx < 0 || monthIdx > 11) return monthKey;
  return `${names[monthIdx]} ${year}`;
}

export function detectBudgetCategoryId(
  tx: Transaction,
  categories: BudgetCategory[],
  txCategoryMap: Record<string, string>
): string {
  const overridden = txCategoryMap[tx.id];
  if (overridden && categories.some((c) => c.id === overridden)) {
    return overridden;
  }

  const haystack = `${tx.title || ''} ${tx.description || ''} ${tx.recipientBank || ''} ${tx.recipientName || ''} ${tx.type || ''}`.toLowerCase();

  // Check custom categories with keywords first so user rules take priority
  const ordered = [
    ...categories.filter((c) => !c.isDefault),
    ...categories.filter((c) => c.isDefault && c.id !== 'cat-other'),
  ];

  for (const cat of ordered) {
    if (cat.keywords.some((kw) => kw.trim() && haystack.includes(kw.trim().toLowerCase()))) {
      return cat.id;
    }
  }

  if (
    tx.type === 'tagihan_listrik' ||
    tx.type === 'tagihan_pulsa' ||
    tx.type === 'tagihan_bpjs' ||
    tx.type === 'tagihan_pdam' ||
    tx.type === 'tagihan_pajak' ||
    tx.type === 'pinjaman_bayar'
  ) {
    const util = categories.find((c) => c.id === 'cat-utilities');
    if (util) return util.id;
  }
  if (tx.type === 'voucher_game' || tx.type === 'tiket_travel') {
    const ent = categories.find((c) => c.id === 'cat-entertainment');
    if (ent) return ent.id;
  }
  if (
    tx.type === 'belanja_fitur' ||
    tx.type === 'bayar_resi' ||
    tx.type === 'qris_pay' ||
    tx.type === 'topup_ewallet'
  ) {
    const lifestyle = categories.find((c) => c.id === 'cat-lifestyle');
    if (lifestyle) return lifestyle.id;
  }

  return categories.find((c) => c.id === 'cat-other')?.id || categories[0]?.id || 'cat-other';
}

export interface UnifiedExpenseEntry {
  id: string;
  source: 'bank' | 'manual';
  title: string;
  subtitle: string;
  amount: number;
  categoryId: string;
  timestamp: string;
  referenceNo?: string;
}

export interface CategoryBudgetUsage {
  category: BudgetCategory;
  spent: number;
  bankSpent: number;
  manualSpent: number;
  entryCount: number;
  limit: number;
  percentUsed: number;
  remaining: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export function computeMonthlyBudgetReport(params: {
  accountId: string;
  monthKey: string;
  categories: BudgetCategory[];
  transactions: Transaction[];
  manualExpenses: ManualExpenseRecord[];
  txCategoryMap: Record<string, string>;
}): {
  activeCategories: BudgetCategory[];
  usages: CategoryBudgetUsage[];
  entries: UnifiedExpenseEntry[];
  totalBudgetLimit: number;
  totalSpent: number;
  warningCount: number;
  exceededCount: number;
} {
  const { accountId, monthKey, categories, transactions, manualExpenses, txCategoryMap } = params;

  const activeCategories = categories.filter(
    (c) => c.accountId === '__ALL__' || c.accountId === accountId
  );

  const bankEntries: UnifiedExpenseEntry[] = transactions
    .filter(
      (tx) =>
        tx.accountId === accountId &&
        isOutgoingExpenseTransaction(tx) &&
        getMonthKeyFromTimestamp(tx.timestamp || '') === monthKey
    )
    .map((tx) => ({
      id: tx.id,
      source: 'bank' as const,
      title: tx.title || tx.description || 'Transaksi Keluar',
      subtitle: tx.recipientName
        ? `Ke ${tx.recipientName}${tx.recipientBank ? ` · ${tx.recipientBank}` : ''}`
        : tx.description || 'Mutasi Rekening',
      amount: tx.amount,
      categoryId: detectBudgetCategoryId(tx, activeCategories, txCategoryMap),
      timestamp: tx.timestamp || new Date().toISOString(),
      referenceNo: tx.referenceNo,
    }));

  const manualEntries: UnifiedExpenseEntry[] = manualExpenses
    .filter(
      (m) =>
        m.accountId === accountId &&
        getMonthKeyFromTimestamp(m.timestamp) === monthKey
    )
    .map((m) => ({
      id: m.id,
      source: 'manual' as const,
      title: m.title,
      subtitle: m.note ? m.note : 'Catatan Pengeluaran Manual',
      amount: m.amount,
      categoryId: activeCategories.some((c) => c.id === m.categoryId)
        ? m.categoryId
        : activeCategories[0]?.id || 'cat-other',
      timestamp: m.timestamp,
    }));

  const entries = [...manualEntries, ...bankEntries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const usages: CategoryBudgetUsage[] = activeCategories.map((cat) => {
    const catEntries = entries.filter((e) => e.categoryId === cat.id);
    const bankSpent = catEntries
      .filter((e) => e.source === 'bank')
      .reduce((sum, e) => sum + e.amount, 0);
    const manualSpent = catEntries
      .filter((e) => e.source === 'manual')
      .reduce((sum, e) => sum + e.amount, 0);
    const spent = bankSpent + manualSpent;
    const limit = Math.max(0, cat.monthlyLimit);
    const percentUsed = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
    const remaining = limit - spent;
    const status: 'safe' | 'warning' | 'exceeded' =
      limit > 0 && spent >= limit
        ? 'exceeded'
        : limit > 0 && percentUsed >= 80
        ? 'warning'
        : 'safe';

    return {
      category: cat,
      spent,
      bankSpent,
      manualSpent,
      entryCount: catEntries.length,
      limit,
      percentUsed,
      remaining,
      status,
    };
  });

  const totalBudgetLimit = usages.reduce((sum, u) => sum + u.limit, 0);
  const totalSpent = usages.reduce((sum, u) => sum + u.spent, 0);
  const warningCount = usages.filter((u) => u.status === 'warning').length;
  const exceededCount = usages.filter((u) => u.status === 'exceeded').length;

  return {
    activeCategories,
    usages,
    entries,
    totalBudgetLimit,
    totalSpent,
    warningCount,
    exceededCount,
  };
}

export const BUDGET_ICON_OPTIONS: { value: BudgetCategoryIcon; label: string }[] = [
  { value: 'shopping-cart', label: 'Belanja' },
  { value: 'zap', label: 'Tagihan' },
  { value: 'film', label: 'Hiburan' },
  { value: 'utensils', label: 'Kuliner' },
  { value: 'car', label: 'Transport' },
  { value: 'heart-pulse', label: 'Kesehatan' },
  { value: 'shopping-bag', label: 'Gaya Hidup' },
  { value: 'wallet', label: 'Lainnya' },
];

export const BUDGET_COLOR_OPTIONS: { value: BudgetCategoryColor; label: string }[] = [
  { value: 'emerald', label: 'Zamrud' },
  { value: 'amber', label: 'Kuning Amber' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'rose', label: 'Crimson' },
  { value: 'cyan', label: 'Cyan' },
  { value: 'violet', label: 'Violet' },
  { value: 'orange', label: 'Oranye' },
  { value: 'slate', label: 'Abu Netral' },
];
