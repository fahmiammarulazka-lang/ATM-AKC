import React, { useMemo, useState } from 'react';
import {
  PieChart,
  TrendingUp,
  Plus,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Pencil,
  Trash2,
  Search,
  ShoppingCart,
  Zap,
  Film,
  Utensils,
  Car,
  HeartPulse,
  ShoppingBag,
  Wallet,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';
import {
  BUDGET_COLOR_PALETTE,
  BUDGET_COLOR_OPTIONS,
  BUDGET_ICON_OPTIONS,
  computeMonthlyBudgetReport,
  formatMonthLabelIndo,
  getCurrentMonthKey,
  getMonthKeyFromTimestamp,
} from '../utils/budgetUtils';
import type { BudgetCategory, BudgetCategoryColor, BudgetCategoryIcon } from '../types/bank';

const CategoryIcon: React.FC<{ icon: BudgetCategoryIcon; className?: string }> = ({
  icon,
  className = 'w-4 h-4',
}) => {
  switch (icon) {
    case 'shopping-cart':
      return <ShoppingCart className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'film':
      return <Film className={className} />;
    case 'utensils':
      return <Utensils className={className} />;
    case 'car':
      return <Car className={className} />;
    case 'heart-pulse':
      return <HeartPulse className={className} />;
    case 'shopping-bag':
      return <ShoppingBag className={className} />;
    default:
      return <Wallet className={className} />;
  }
};

export const BudgetingWorkspace: React.FC = () => {
  const {
    currentAccount,
    transactions,
    budgetCategories,
    manualExpenses,
    budgetTxCategoryMap,
    addBudgetCategory,
    updateBudgetCategory,
    deleteBudgetCategory,
    addManualExpense,
    deleteManualExpense,
    setTransactionBudgetCategory,
  } = useBank();

  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [selectedDonutCatId, setSelectedDonutCatId] = useState<string | null>(null);
  const [trendCategoryId, setTrendCategoryId] = useState<string>('__ALL__');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // Filter & Search Ledger
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'bank' | 'manual'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('__ALL__');

  // Modals & Feedback
  const [feedbackBanner, setFeedbackBanner] = useState<{ ok: boolean; text: string } | null>(null);
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expCategoryId, setExpCategoryId] = useState<string>('cat-groceries');
  const [expTitle, setExpTitle] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [expNote, setExpNote] = useState<string>('');

  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState<boolean>(false);
  const [catName, setCatName] = useState<string>('');
  const [catLimit, setCatLimit] = useState<string>('2000000');
  const [catIcon, setCatIcon] = useState<BudgetCategoryIcon>('shopping-cart');
  const [catColor, setCatColor] = useState<BudgetCategoryColor>('indigo');
  const [catKeywords, setCatKeywords] = useState<string>('');

  const accountId = currentAccount?.id || 'acc-1';

  // Build Month Options (last 6 months + any month in data)
  const monthOptions = useMemo(() => {
    const keys = new Set<string>();
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    transactions.forEach((tx) => {
      if (tx.accountId === accountId && tx.timestamp) {
        keys.add(getMonthKeyFromTimestamp(tx.timestamp));
      }
    });
    manualExpenses.forEach((m) => {
      if (m.accountId === accountId) {
        keys.add(getMonthKeyFromTimestamp(m.timestamp));
      }
    });
    return Array.from(keys).sort((a, b) => (a > b ? -1 : 1));
  }, [transactions, manualExpenses, accountId]);

  const report = useMemo(
    () =>
      computeMonthlyBudgetReport({
        accountId,
        monthKey: selectedMonth,
        categories: budgetCategories,
        transactions,
        manualExpenses,
        txCategoryMap: budgetTxCategoryMap,
      }),
    [accountId, selectedMonth, budgetCategories, transactions, manualExpenses, budgetTxCategoryMap]
  );

  // Remaining & daily safe spend math
  const [selYear, selMonthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = selYear && selMonthNum ? new Date(selYear, selMonthNum, 0).getDate() : 30;
  const now = new Date();
  const isCurrentMonth = selectedMonth === getCurrentMonthKey();
  const remainingDays = isCurrentMonth ? Math.max(1, daysInMonth - now.getDate() + 1) : daysInMonth;
  const totalRemaining = report.totalBudgetLimit - report.totalSpent;
  const dailySafeBudget = totalRemaining > 0 ? Math.floor(totalRemaining / remainingDays) : 0;

  // Alert collections (80% warning & 100% exceeded)
  const warningUsages = report.usages.filter((u) => u.status === 'warning');
  const exceededUsages = report.usages.filter((u) => u.status === 'exceeded');

  // Donut Chart geometry
  const donutSegments = useMemo(() => {
    const positive = report.usages.filter((u) => u.spent > 0);
    const total = positive.reduce((s, u) => s + u.spent, 0);
    if (total <= 0) return [];
    const radius = 64;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    return positive.map((u) => {
      const ratio = u.spent / total;
      const strokeLength = ratio * circumference;
      const offset = -cumulative * circumference;
      cumulative += ratio;
      return {
        usage: u,
        ratio,
        percent: ratio * 100,
        strokeDasharray: `${strokeLength} ${circumference}`,
        strokeDashoffset: offset,
        colorHex: BUDGET_COLOR_PALETTE[u.category.color]?.hex || '#6366f1',
      };
    });
  }, [report.usages]);

  const activeDonutSegment = useMemo(() => {
    if (selectedDonutCatId) {
      return donutSegments.find((s) => s.usage.category.id === selectedDonutCatId) || donutSegments[0] || null;
    }
    return donutSegments[0] || null;
  }, [donutSegments, selectedDonutCatId]);

  // Daily Cumulative Spending Trend Chart data
  const trendData = useMemo(() => {
    const filteredEntries =
      trendCategoryId === '__ALL__'
        ? report.entries
        : report.entries.filter((e) => e.categoryId === trendCategoryId);

    const dailySpend = new Array<number>(daysInMonth).fill(0);
    filteredEntries.forEach((entry) => {
      const d = new Date(entry.timestamp);
      if (!Number.isNaN(d.getTime())) {
        const dayIndex = Math.min(daysInMonth - 1, Math.max(0, d.getDate() - 1));
        dailySpend[dayIndex] += entry.amount;
      }
    });

    const cumulative = new Array<number>(daysInMonth).fill(0);
    let running = 0;
    for (let i = 0; i < daysInMonth; i++) {
      running += dailySpend[i];
      cumulative[i] = running;
    }

    const activeLimit =
      trendCategoryId === '__ALL__'
        ? report.totalBudgetLimit
        : report.usages.find((u) => u.category.id === trendCategoryId)?.limit || 0;

    const maxVal = Math.max(running, activeLimit, 100_000);
    return {
      dailySpend,
      cumulative,
      activeLimit,
      maxVal,
    };
  }, [report.entries, report.totalBudgetLimit, report.usages, trendCategoryId, daysInMonth]);

  const filteredLedgerEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return report.entries.filter((entry) => {
      if (sourceFilter !== 'all' && entry.source !== sourceFilter) return false;
      if (categoryFilter !== '__ALL__' && entry.categoryId !== categoryFilter) return false;
      if (q) {
        const catName =
          report.activeCategories.find((c) => c.id === entry.categoryId)?.name.toLowerCase() || '';
        const match =
          entry.title.toLowerCase().includes(q) ||
          entry.subtitle.toLowerCase().includes(q) ||
          catName.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [report.entries, report.activeCategories, searchQuery, sourceFilter, categoryFilter]);

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatLimit('1500000');
    setCatIcon('shopping-bag');
    setCatColor('indigo');
    setCatKeywords('');
    setShowCategoryModal(true);
  };

  const openEditCategoryModal = (cat: BudgetCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatLimit(String(cat.monthlyLimit));
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setCatKeywords(cat.keywords.join(', '));
    setShowCategoryModal(true);
  };

  const openManualExpenseModal = (presetCatId?: string) => {
    setExpCategoryId(presetCatId || report.activeCategories[0]?.id || 'cat-groceries');
    setExpTitle('');
    setExpAmount('');
    setExpNote('');
    setExpDate(`${selectedMonth}-${String(Math.min(daysInMonth, now.getDate())).padStart(2, '0')}`);
    setShowExpenseModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const numericLimit = Number(catLimit.replace(/[^\d]/g, ''));
    const kwList = catKeywords
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    const res = editingCategory
      ? updateBudgetCategory(editingCategory.id, {
          name: catName,
          monthlyLimit: numericLimit,
          icon: catIcon,
          color: catColor,
          keywords: kwList,
        })
      : addBudgetCategory({
          name: catName,
          monthlyLimit: numericLimit,
          icon: catIcon,
          color: catColor,
          keywords: kwList,
        });

    setFeedbackBanner({ ok: res.success, text: res.message });
    if (res.success) {
      setShowCategoryModal(false);
    }
  };

  const handleSaveManualExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = Number(expAmount.replace(/[^\d]/g, ''));
    const isoTs = expDate ? new Date(`${expDate}T12:00:00`).toISOString() : new Date().toISOString();
    const res = addManualExpense({
      categoryId: expCategoryId,
      title: expTitle,
      amount: numericAmount,
      note: expNote,
      timestamp: isoTs,
    });
    setFeedbackBanner({ ok: res.success, text: res.message });
    if (res.success) {
      setShowExpenseModal(false);
    }
  };

  const shiftMonth = (delta: number) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    if (!y || !m) return;
    const d = new Date(y, m - 1 + delta, 1);
    setSelectedMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    setSelectedDonutCatId(null);
  };

  const bankSpentTotal = report.entries
    .filter((e) => e.source === 'bank')
    .reduce((s, e) => s + e.amount, 0);
  const manualSpentTotal = report.entries
    .filter((e) => e.source === 'manual')
    .reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Anggaran Bulanan</span>
            <span aria-hidden="true">·</span>
            <span>{currentAccount?.fullName || 'Nasabah'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{currentAccount?.accountNumber}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Perencanaan Anggaran &amp; Pola Pengeluaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Realisasi terhitung otomatis dari mutasi keluar rekening ditambah catatan pengeluaran manual Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Month Switcher */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDonutCatId(null);
                }}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
              >
                {monthOptions.map((mk) => (
                  <option key={mk} value={mk} className="bg-slate-900 text-white">
                    {formatMonthLabelIndo(mk)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={openAddCategoryModal}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Kategori Kustom</span>
          </button>

          <button
            type="button"
            onClick={() => openManualExpenseModal()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      </div>

      {/* Operation Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`rounded-xl px-4 py-3 border flex items-center justify-between gap-3 text-xs ${
            feedbackBanner.ok
              ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/50 border-rose-700/60 text-rose-200'
          }`}
        >
          <span className="font-medium">{feedbackBanner.text}</span>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Threshold Alerts (80% Warning & 100% Exceeded) */}
      {(exceededUsages.length > 0 || warningUsages.length > 0) && (
        <div className="space-y-2.5">
          {exceededUsages.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-700/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-rose-200">
                    Batas Anggaran Terlampaui (100%+) · {exceededUsages.length} Kategori
                  </p>
                  <p className="text-xs text-rose-300/90">
                    {exceededUsages
                      .map(
                        (u) =>
                          `${u.category.name} (${Math.round(u.percentUsed)}% · lebih ${formatRupiah(
                            Math.abs(u.remaining)
                          )})`
                      )
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryFilter(exceededUsages[0].category.id)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Tinjau Rincian
              </button>
            </div>
          )}

          {warningUsages.length > 0 && (
            <div className="bg-amber-950/35 border border-amber-700/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-200">
                    Mendekati Batas Anggaran (80%–99%) · {warningUsages.length} Kategori
                  </p>
                  <p className="text-xs text-amber-300/90">
                    {warningUsages
                      .map(
                        (u) =>
                          `${u.category.name} (${Math.round(u.percentUsed)}% · sisa ${formatRupiah(
                            u.remaining
                          )})`
                      )
                      .join(' · ')}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCategoryFilter(warningUsages[0].category.id)}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
              >
                Filter Kategori
              </button>
            </div>
          )}
        </div>
      )}

      {/* 4 KPI Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
          <span className="text-xs text-slate-400">Total Batas Anggaran</span>
          <div className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">
            {formatRupiah(report.totalBudgetLimit)}
          </div>
          <div className="text-[11px] text-slate-400">
            {report.activeCategories.length} kategori aktif bulan ini
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
          <span className="text-xs text-slate-400">Realisasi Pengeluaran</span>
          <div className="text-lg sm:text-xl font-bold text-white font-mono tabular-nums">
            {formatRupiah(report.totalSpent)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            Mutasi {formatRupiah(bankSpentTotal)} · Manual {formatRupiah(manualSpentTotal)}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
          <span className="text-xs text-slate-400">Sisa Anggaran &amp; Kuota Harian</span>
          <div
            className={`text-lg sm:text-xl font-bold font-mono tabular-nums ${
              totalRemaining < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {totalRemaining < 0 ? `-${formatRupiah(Math.abs(totalRemaining))}` : formatRupiah(totalRemaining)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
            Batas aman {formatRupiah(dailySafeBudget)}/hari ({remainingDays} hari tersisa)
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1.5">
          <span className="text-xs text-slate-400">Status Peringatan Limit</span>
          <div className="flex items-center gap-2">
            {exceededUsages.length > 0 ? (
              <span className="text-lg font-bold text-rose-400 font-mono tabular-nums">
                {exceededUsages.length} Melebihi · {warningUsages.length} Waspada
              </span>
            ) : warningUsages.length > 0 ? (
              <span className="text-lg font-bold text-amber-400 font-mono tabular-nums">
                {warningUsages.length} Mendekati 80%+
              </span>
            ) : (
              <span className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5" />
                <span>Semua Aman</span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-400">
            Notifikasi aktif di ambang 80% dan 100%
          </div>
        </div>
      </div>

      {/* Visualizations Row: Donut Breakdown + Daily Trend Line */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Donut Chart */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <PieChart className="w-4 h-4 text-indigo-400" />
                <span>Distribusi Kategori</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Klik irisan grafik untuk menyorot porsi belanja
              </p>
            </div>
            {selectedDonutCatId && (
              <button
                type="button"
                onClick={() => setSelectedDonutCatId(null)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>

          {donutSegments.length === 0 ? (
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center gap-2 border border-dashed border-slate-800 rounded-xl p-6">
              <PieChart className="w-8 h-8 text-slate-600" />
              <p className="text-xs font-semibold text-slate-300">Belum ada pengeluaran pada bulan ini</p>
              <p className="text-[11px] text-slate-500">
                Catat pengeluaran manual atau lakukan transaksi keluar untuk melihat grafik donat.
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-5">
              <div className="relative w-44 h-44 shrink-0">
                <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="64"
                    fill="transparent"
                    stroke="#1e293b"
                    strokeWidth="22"
                  />
                  {donutSegments.map((seg) => {
                    const isSelected = activeDonutSegment?.usage.category.id === seg.usage.category.id;
                    return (
                      <circle
                        key={seg.usage.category.id}
                        cx="80"
                        cy="80"
                        r="64"
                        fill="transparent"
                        stroke={seg.colorHex}
                        strokeWidth={isSelected ? '26' : '20'}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        className="cursor-pointer transition-all duration-200"
                        opacity={!selectedDonutCatId || isSelected ? 1 : 0.45}
                        onClick={() =>
                          setSelectedDonutCatId((prev) =>
                            prev === seg.usage.category.id ? null : seg.usage.category.id
                          )
                        }
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5 pointer-events-none">
                  <span className="text-[10px] text-slate-400 truncate max-w-full">
                    {activeDonutSegment?.usage.category.name}
                  </span>
                  <span className="text-xs font-bold text-white font-mono tabular-nums mt-0.5">
                    {activeDonutSegment ? `${activeDonutSegment.percent.toFixed(1)}%` : '0%'}
                  </span>
                  <span className="text-[10px] text-slate-300 font-mono tabular-nums truncate max-w-full">
                    {activeDonutSegment ? formatRupiah(activeDonutSegment.usage.spent) : 'Rp 0'}
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-2 max-h-52 overflow-y-auto pr-1">
                {donutSegments.map((seg) => {
                  const isSelected = selectedDonutCatId === seg.usage.category.id;
                  return (
                    <button
                      key={seg.usage.category.id}
                      type="button"
                      onClick={() =>
                        setSelectedDonutCatId((prev) =>
                          prev === seg.usage.category.id ? null : seg.usage.category.id
                        )
                      }
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                        isSelected ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-sm shrink-0"
                          style={{ backgroundColor: seg.colorHex }}
                        />
                        <span className="text-xs truncate">{seg.usage.category.name}</span>
                      </div>
                      <span className="text-xs font-mono tabular-nums text-slate-200 shrink-0">
                        {seg.percent.toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Daily Cumulative Trend Chart */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span>Tren Akumulasi Pengeluaran Harian</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Kurva belanja aktual dibanding garis target batas bulanan ({formatMonthLabelIndo(selectedMonth)})
              </p>
            </div>
            <select
              value={trendCategoryId}
              onChange={(e) => setTrendCategoryId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="__ALL__">Semua Kategori</option>
              {report.activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Trend Readout Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl px-3.5 py-2">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-3 h-0.5 bg-indigo-400 inline-block" />
                <span>Realisasi</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-3 h-0.5 border-t border-dashed border-amber-400 inline-block" />
                <span>Target Limit ({formatRupiah(trendData.activeLimit)})</span>
              </span>
            </div>
            <div className="font-mono tabular-nums text-slate-200">
              {hoveredDay !== null
                ? `Tgl ${hoveredDay + 1}: +${formatRupiah(trendData.dailySpend[hoveredDay])} · Akumulasi ${formatRupiah(
                    trendData.cumulative[hoveredDay]
                  )}`
                : `Total Bulan Ini: ${formatRupiah(
                    trendData.cumulative[daysInMonth - 1] || 0
                  )}`}
            </div>
          </div>

          {/* Interactive SVG Area/Line Chart */}
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 640 210" className="w-full h-48 select-none">
              <defs>
                <linearGradient id="budgetAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid Lines */}
              {[0.25, 0.5, 0.75, 1].map((step) => {
                const y = 180 - step * 155;
                return (
                  <g key={step}>
                    <line x1="36" y1={y} x2="624" y2={y} stroke="#1e293b" strokeWidth="1" />
                    <text
                      x="30"
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-500 text-[9px] font-mono"
                    >
                      {Math.round((trendData.maxVal * step) / 1000).toLocaleString('id-ID')}k
                    </text>
                  </g>
                );
              })}

              {/* Dashed Linear Budget Trajectory */}
              {trendData.activeLimit > 0 && (
                <line
                  x1="36"
                  y1={180}
                  x2="624"
                  y2={180 - Math.min(1, trendData.activeLimit / trendData.maxVal) * 155}
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
              )}

              {/* Actual Spending Path + Area */}
              {(() => {
                const points = trendData.cumulative.map((val, idx) => {
                  const x = 36 + (idx / Math.max(1, daysInMonth - 1)) * 588;
                  const y = 180 - (val / trendData.maxVal) * 155;
                  return { x, y, idx };
                });
                const linePath = points
                  .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
                  .join(' ');
                const areaPath = `${linePath} L 624 180 L 36 180 Z`;
                return (
                  <>
                    <path d={areaPath} fill="url(#budgetAreaGrad)" />
                    <path d={linePath} fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinejoin="round" />
                    {points.map((p) => (
                      <g
                        key={p.idx}
                        onMouseEnter={() => setHoveredDay(p.idx)}
                        onMouseLeave={() => setHoveredDay(null)}
                      >
                        <rect
                          x={p.x - 9}
                          y={15}
                          width="18"
                          height="170"
                          fill="transparent"
                          className="cursor-crosshair"
                        />
                        {hoveredDay === p.idx && (
                          <>
                            <line
                              x1={p.x}
                              y1={20}
                              x2={p.x}
                              y2={180}
                              stroke="#475569"
                              strokeWidth="1"
                            />
                            <circle cx={p.x} cy={p.y} r="4.5" fill="#818cf8" stroke="#0f172a" strokeWidth="2" />
                          </>
                        )}
                      </g>
                    ))}
                  </>
                );
              })()}

              {/* Day Axis Labels */}
              {[1, 8, 15, 22, daysInMonth].map((dayNum) => {
                const idx = dayNum - 1;
                const x = 36 + (idx / Math.max(1, daysInMonth - 1)) * 588;
                return (
                  <text
                    key={dayNum}
                    x={x}
                    y="198"
                    textAnchor="middle"
                    className="fill-slate-500 text-[9px] font-mono"
                  >
                    Tgl {dayNum}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>
      </div>

      {/* Category Progress & Management Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Batas &amp; Pemakaian per Kategori</h2>
            <p className="text-xs text-slate-400">
              Ubah batas limit bulanan atau tambahkan kategori kustom sesuai kebutuhan Anda.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {report.usages.length} Kategori
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.usages.map((usage) => {
            const palette = BUDGET_COLOR_PALETTE[usage.category.color] || BUDGET_COLOR_PALETTE.indigo;
            const barWidth = Math.min(100, Math.round(usage.percentUsed));
            const barColorClass =
              usage.status === 'exceeded'
                ? 'bg-rose-500'
                : usage.status === 'warning'
                ? 'bg-amber-500'
                : palette.bar;

            const statusText =
              usage.status === 'exceeded'
                ? `Melebihi Limit (${Math.round(usage.percentUsed)}%)`
                : usage.status === 'warning'
                ? `Mendekati Limit (${Math.round(usage.percentUsed)}%)`
                : `Aman (${Math.round(usage.percentUsed)}%)`;

            const statusColorClass =
              usage.status === 'exceeded'
                ? 'text-rose-400'
                : usage.status === 'warning'
                ? 'text-amber-400'
                : 'text-emerald-400';

            return (
              <div
                key={usage.category.id}
                className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl ${palette.bgSoft} border ${palette.border} flex items-center justify-center shrink-0`}
                    >
                      <CategoryIcon icon={usage.category.icon} className={`w-4 h-4 ${palette.text}`} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-white truncate">{usage.category.name}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                        <span>{usage.category.isDefault ? 'Kategori Bawaan' : 'Kategori Kustom'}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{usage.entryCount} transaksi</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openManualExpenseModal(usage.category.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer whitespace-nowrap"
                      title="Catat pengeluaran ke kategori ini"
                    >
                      + Catat
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditCategoryModal(usage.category)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                      title="Edit limit & kategori"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!usage.category.isDefault && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = deleteBudgetCategory(usage.category.id);
                          setFeedbackBanner({ ok: res.success, text: res.message });
                        }}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 border border-slate-700 hover:border-rose-700 text-slate-400 hover:text-rose-300 cursor-pointer"
                        title="Hapus kategori kustom"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColorClass}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

                {/* Tabular Numbers + Explicit Status Text */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-mono tabular-nums text-slate-200">
                    {formatRupiah(usage.spent)}{' '}
                    <span className="text-slate-500">/ {formatRupiah(usage.limit)}</span>
                  </span>
                  <span className={`font-semibold font-mono tabular-nums ${statusColorClass}`}>
                    {statusText}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Unified Expense Ledger (Auto Mutasi + Manual) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-white">Rincian Pengeluaran Bulanan</h2>
            <p className="text-xs text-slate-400">
              Gabungan mutasi keluar Bank Nusantara dan catatan manual. Anda dapat memindahkan kategori transaksi kapan saja.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pengeluaran..."
                className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 w-44"
              />
            </div>

            {/* Source Segmented Filter */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
              {(['all', 'bank', 'manual'] as const).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    sourceFilter === src
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {src === 'all' ? 'Semua' : src === 'bank' ? 'Mutasi Bank' : 'Manual'}
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="__ALL__">Semua Kategori</option>
              {report.activeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLedgerEntries.length === 0 ? (
          <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center space-y-3">
            <Wallet className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-200">
                Tidak ada pengeluaran yang cocok di {formatMonthLabelIndo(selectedMonth)}
              </p>
              <p className="text-xs text-slate-400">
                Catat pengeluaran tunai secara manual atau ubah filter pencarian di atas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openManualExpenseModal()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Catat Pengeluaran Pertama</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                  <th className="py-2.5 pr-3 font-medium">Tanggal</th>
                  <th className="py-2.5 pr-3 font-medium">Keterangan</th>
                  <th className="py-2.5 pr-3 font-medium">Sumber</th>
                  <th className="py-2.5 pr-3 font-medium">Kategori</th>
                  <th className="py-2.5 pr-3 font-medium text-right">Nominal</th>
                  <th className="py-2.5 pl-2 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 text-xs">
                {filteredLedgerEntries.slice(0, 60).map((entry) => {
                  const dateObj = new Date(entry.timestamp);
                  const dateStr = Number.isNaN(dateObj.getTime())
                    ? '-'
                    : dateObj.toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      });

                  return (
                    <tr key={entry.id} className="hover:bg-slate-800/35 transition-colors">
                      <td className="py-2.5 pr-3 font-mono tabular-nums text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-2.5 pr-3 min-w-[200px]">
                        <div className="font-semibold text-slate-100">{entry.title}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{entry.subtitle}</div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300 whitespace-nowrap">
                        {entry.source === 'bank' ? 'Mutasi Keluar' : 'Input Manual'}
                      </td>
                      <td className="py-2.5 pr-3">
                        {entry.source === 'bank' ? (
                          <select
                            value={entry.categoryId}
                            onChange={(e) => setTransactionBudgetCategory(entry.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none cursor-pointer"
                          >
                            {report.activeCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-200">
                            {report.activeCategories.find((c) => c.id === entry.categoryId)?.name || 'Lainnya'}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-right font-mono tabular-nums font-semibold text-rose-300 whitespace-nowrap">
                        -{formatRupiah(entry.amount)}
                      </td>
                      <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                        {entry.source === 'manual' ? (
                          <button
                            type="button"
                            onClick={() => deleteManualExpense(entry.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-950/60 transition-colors cursor-pointer"
                            title="Hapus catatan manual"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500">Otomatis</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Catat Pengeluaran Manual */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveManualExpense}
            className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Catat Pengeluaran Manual</h3>
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Kategori Anggaran</label>
                <select
                  value={expCategoryId}
                  onChange={(e) => setExpCategoryId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                >
                  {report.activeCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Judul / Keperluan</label>
                <input
                  type="text"
                  required
                  value={expTitle}
                  onChange={(e) => setExpTitle(e.target.value)}
                  placeholder="Contoh: Belanja Mingguan Pasar / Tiket Bioskop"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={expAmount}
                  onChange={(e) => setExpAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono tabular-nums"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {[50_000, 100_000, 250_000, 500_000, 1_000_000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setExpAmount(String(preset))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] cursor-pointer"
                    >
                      {formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Tanggal</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={expNote}
                  onChange={(e) => setExpNote(e.target.value)}
                  placeholder="Keterangan tambahan..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExpenseModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Simpan Pengeluaran
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Tambah / Edit Kategori Anggaran */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveCategory}
            className="max-w-md w-full bg-slate-900 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                {editingCategory ? `Atur Kategori: ${editingCategory.name}` : 'Tambah Kategori Anggaran Kustom'}
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Nama Kategori</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Contoh: Pendidikan Anak / Hobi"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Batas Anggaran Bulanan (Rp)</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={catLimit}
                  onChange={(e) => setCatLimit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono tabular-nums"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Ikon</label>
                  <select
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value as BudgetCategoryIcon)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    {BUDGET_ICON_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Warna Grafik</label>
                  <select
                    value={catColor}
                    onChange={(e) => setCatColor(e.target.value as BudgetCategoryColor)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                  >
                    {BUDGET_COLOR_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  Kata Kunci Auto-Deteksi Mutasi (pisahkan koma)
                </label>
                <input
                  type="text"
                  value={catKeywords}
                  onChange={(e) => setCatKeywords(e.target.value)}
                  placeholder="Contoh: spp, buku, kursus, les"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer"
              >
                Simpan Kategori
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
