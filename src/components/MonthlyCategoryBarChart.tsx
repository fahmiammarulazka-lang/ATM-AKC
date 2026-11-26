import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  LabelList,
} from 'recharts';
import {
  BarChart3,
  ArrowUpDown,
  Download,
  Image as ImageIcon,
  FileCode2,
  Maximize2,
  Minimize2,
  Plus,
  RotateCcw,
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Filter,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { formatRupiah } from '../utils/bankUtils';
import {
  computeMonthlyBudgetReport,
  formatMonthLabelIndo,
} from '../utils/budgetUtils';
import type {
  BudgetCategory,
  ManualExpenseRecord,
  Transaction,
} from '../types/bank';

type CompareMode = 'limit_vs_actual' | 'multi_month';
type MultiMonthSubMode = 'by_category' | 'by_month_total';
type MonthRange = 3 | 6;
type ChartOrientation = 'vertical' | 'horizontal';
type SourceFilter = 'all' | 'bank' | 'manual';
type SortOption = 'spent_desc' | 'percent_desc' | 'default';

interface MonthlyCategoryBarChartProps {
  accountId: string;
  selectedMonth: string;
  budgetCategories: BudgetCategory[];
  transactions: Transaction[];
  manualExpenses: ManualExpenseRecord[];
  budgetTxCategoryMap: Record<string, string>;
  activeCategoryFilter: string;
  sourceFilter: SourceFilter;
  onChangeSourceFilter: (source: SourceFilter) => void;
  onSelectCategory: (categoryId: string) => void;
  onScrollToLedger: () => void;
  onOpenManualExpense: (presetCatId?: string) => void;
}

interface LimitVsActualRow {
  categoryId: string;
  name: string;
  shortName: string;
  limit: number;
  spent: number;
  bankSpent: number;
  manualSpent: number;
  entryCount: number;
  percentUsed: number;
  remaining: number;
  status: 'safe' | 'warning' | 'exceeded';
  prevSpent: number;
  momDeltaPct: number | null;
}

interface MonthMeta {
  key: string;
  shortLabel: string;
  fullLabel: string;
  color: string;
}

interface MultiMonthCategoryRow {
  categoryId: string;
  name: string;
  shortName: string;
  limit: number;
  currentSpent: number;
  currentPercent: number;
  avgSpent: number;
  [monthKey: string]: string | number;
}

interface MultiMonthTotalRow {
  monthKey: string;
  shortLabel: string;
  fullLabel: string;
  spent: number;
  bankSpent: number;
  manualSpent: number;
  limit: number;
  percentUsed: number;
  status: 'safe' | 'warning' | 'exceeded';
  momDeltaPct: number | null;
}

const MONTH_SHORT_INDO = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const MULTI_MONTH_COLORS_6 = [
  '#475569', // oldest
  '#64748b',
  '#0ea5e9',
  '#06b6d4',
  '#8b5cf6',
  '#6366f1', // active / latest month
];

const STATUS_HEX: Record<'safe' | 'warning' | 'exceeded', string> = {
  safe: '#10b981',
  warning: '#f59e0b',
  exceeded: '#f43f5e',
};

function getOffsetMonthKey(baseMonthKey: string, deltaMonths: number): string {
  const [y, m] = baseMonthKey.split('-').map(Number);
  if (!y || !m) return baseMonthKey;
  const d = new Date(y, m - 1 + deltaMonths, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthShort(monthKey: string): string {
  const [yStr, mStr] = monthKey.split('-');
  const mIdx = Number(mStr) - 1;
  if (mIdx < 0 || mIdx > 11 || !yStr) return monthKey;
  return `${MONTH_SHORT_INDO[mIdx]} '${yStr.slice(-2)}`;
}

function shortenCategoryName(name: string, maxLen: number): string {
  if (name.length <= maxLen) return name;
  return `${name.slice(0, Math.max(4, maxLen - 1)).trimEnd()}…`;
}

function formatCompactRupiah(val: number): string {
  if (!Number.isFinite(val) || val === 0) return '0';
  const abs = Math.abs(val);
  const sign = val < 0 ? '-' : '';
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1).replace('.', ',')} M`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace('.', ',')} jt`;
  }
  if (abs >= 1_000) {
    return `${sign}${Math.round(abs / 1_000)} rb`;
  }
  return `${sign}${Math.round(abs)}`;
}

function computeMomDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) {
    return current > 0 ? null : 0;
  }
  return ((current - previous) / previous) * 100;
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const MonthlyCategoryBarChart: React.FC<MonthlyCategoryBarChartProps> = ({
  accountId,
  selectedMonth,
  budgetCategories,
  transactions,
  manualExpenses,
  budgetTxCategoryMap,
  activeCategoryFilter,
  sourceFilter,
  onChangeSourceFilter,
  onSelectCategory,
  onScrollToLedger,
  onOpenManualExpense,
}) => {
  const [compareMode, setCompareMode] = useState<CompareMode>('limit_vs_actual');
  const [multiMonthSubMode, setMultiMonthSubMode] = useState<MultiMonthSubMode>('by_category');
  const [monthRange, setMonthRange] = useState<MonthRange>(3);
  const [orientation, setOrientation] = useState<ChartOrientation>('vertical');
  const [sortBy, setSortBy] = useState<SortOption>('spent_desc');
  const [hoveredCategoryId, setHoveredCategoryId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const chartHostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  useEffect(() => {
    if (!exportNotice) return;
    const timer = window.setTimeout(() => setExportNotice(null), 2800);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  // Build rolling window of 6 months ending at selectedMonth (chronological oldest -> latest)
  const sixMonthKeys = useMemo(() => {
    const keys: string[] = [];
    for (let i = 5; i >= 0; i--) {
      keys.push(getOffsetMonthKey(selectedMonth, -i));
    }
    return keys;
  }, [selectedMonth]);

  // Precompute reports for all 6 months once per dependency change
  const sixMonthReports = useMemo(() => {
    return sixMonthKeys.map((monthKey) => ({
      monthKey,
      report: computeMonthlyBudgetReport({
        accountId,
        monthKey,
        categories: budgetCategories,
        transactions,
        manualExpenses,
        txCategoryMap: budgetTxCategoryMap,
      }),
    }));
  }, [
    sixMonthKeys,
    accountId,
    budgetCategories,
    transactions,
    manualExpenses,
    budgetTxCategoryMap,
  ]);

  const currentMonthEntry = sixMonthReports[sixMonthReports.length - 1];
  const prevMonthEntry = sixMonthReports[sixMonthReports.length - 2];

  const getSpentBySource = (bankSpent: number, manualSpent: number): number => {
    if (sourceFilter === 'bank') return bankSpent;
    if (sourceFilter === 'manual') return manualSpent;
    return bankSpent + manualSpent;
  };

  // Mode 1 data: Realisasi vs Batas Anggaran (selectedMonth)
  const limitVsActualRows = useMemo<LimitVsActualRow[]>(() => {
    const prevMap = new Map<string, number>();
    prevMonthEntry.report.usages.forEach((u) => {
      prevMap.set(u.category.id, getSpentBySource(u.bankSpent, u.manualSpent));
    });

    const rows: LimitVsActualRow[] = currentMonthEntry.report.usages.map((u) => {
      const spent = getSpentBySource(u.bankSpent, u.manualSpent);
      const prevSpent = prevMap.get(u.category.id) ?? 0;
      const limit = Math.max(0, u.limit);
      const percentUsed = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
      const remaining = limit - spent;
      const status: 'safe' | 'warning' | 'exceeded' =
        limit > 0 && spent >= limit
          ? 'exceeded'
          : limit > 0 && percentUsed >= 80
          ? 'warning'
          : 'safe';

      return {
        categoryId: u.category.id,
        name: u.category.name,
        shortName: shortenCategoryName(u.category.name, orientation === 'horizontal' ? 22 : 13),
        limit,
        spent,
        bankSpent: u.bankSpent,
        manualSpent: u.manualSpent,
        entryCount: u.entryCount,
        percentUsed,
        remaining,
        status,
        prevSpent,
        momDeltaPct: computeMomDeltaPct(spent, prevSpent),
      };
    });

    if (sortBy === 'spent_desc') {
      return [...rows].sort((a, b) => b.spent - a.spent || b.limit - a.limit);
    }
    if (sortBy === 'percent_desc') {
      return [...rows].sort((a, b) => b.percentUsed - a.percentUsed || b.spent - a.spent);
    }
    return rows;
  }, [currentMonthEntry, prevMonthEntry, sourceFilter, sortBy, orientation]);

  // Active months slice for Multi-Month mode (3 or 6 months)
  const activeMultiMonths = useMemo<MonthMeta[]>(() => {
    const slice = sixMonthReports.slice(sixMonthReports.length - monthRange);
    const paletteOffset = 6 - slice.length;
    return slice.map((item, idx) => ({
      key: item.monthKey,
      shortLabel: formatMonthShort(item.monthKey),
      fullLabel: formatMonthLabelIndo(item.monthKey),
      color: MULTI_MONTH_COLORS_6[paletteOffset + idx] || '#6366f1',
    }));
  }, [sixMonthReports, monthRange]);

  // Mode 2A data: Per Kategori across 3 or 6 months
  const multiMonthCategoryRows = useMemo<MultiMonthCategoryRow[]>(() => {
    const slice = sixMonthReports.slice(sixMonthReports.length - monthRange);
    const activeCats = currentMonthEntry.report.activeCategories;

    const rows: MultiMonthCategoryRow[] = activeCats.map((cat) => {
      const row: MultiMonthCategoryRow = {
        categoryId: cat.id,
        name: cat.name,
        shortName: shortenCategoryName(cat.name, orientation === 'horizontal' ? 22 : 13),
        limit: Math.max(0, cat.monthlyLimit),
        currentSpent: 0,
        currentPercent: 0,
        avgSpent: 0,
      };

      let sumSpent = 0;
      slice.forEach((mEntry, idx) => {
        const usage = mEntry.report.usages.find((u) => u.category.id === cat.id);
        const val = usage ? getSpentBySource(usage.bankSpent, usage.manualSpent) : 0;
        row[mEntry.monthKey] = val;
        sumSpent += val;
        if (idx === slice.length - 1) {
          row.currentSpent = val;
          row.currentPercent =
            cat.monthlyLimit > 0 ? (val / cat.monthlyLimit) * 100 : val > 0 ? 100 : 0;
        }
      });

      row.avgSpent = slice.length > 0 ? sumSpent / slice.length : 0;
      return row;
    });

    if (sortBy === 'spent_desc') {
      return [...rows].sort((a, b) => b.currentSpent - a.currentSpent || b.avgSpent - a.avgSpent);
    }
    if (sortBy === 'percent_desc') {
      return [...rows].sort(
        (a, b) => b.currentPercent - a.currentPercent || b.currentSpent - a.currentSpent
      );
    }
    return rows;
  }, [sixMonthReports, monthRange, currentMonthEntry, sourceFilter, sortBy, orientation]);

  // Mode 2B data: Total Bulanan across 3 or 6 months
  const multiMonthTotalRows = useMemo<MultiMonthTotalRow[]>(() => {
    const slice = sixMonthReports.slice(sixMonthReports.length - monthRange);
    return slice.map((item, idx) => {
      const bankSpent = item.report.usages.reduce((s, u) => s + u.bankSpent, 0);
      const manualSpent = item.report.usages.reduce((s, u) => s + u.manualSpent, 0);
      const spent = getSpentBySource(bankSpent, manualSpent);
      const limit = item.report.totalBudgetLimit;
      const percentUsed = limit > 0 ? (spent / limit) * 100 : spent > 0 ? 100 : 0;
      const status: 'safe' | 'warning' | 'exceeded' =
        limit > 0 && spent >= limit
          ? 'exceeded'
          : limit > 0 && percentUsed >= 80
          ? 'warning'
          : 'safe';

      // Compare with previous month (from full 6-month array if available)
      const fullIdx = sixMonthReports.findIndex((r) => r.monthKey === item.monthKey);
      let prevSpent = 0;
      if (fullIdx > 0) {
        const prev = sixMonthReports[fullIdx - 1];
        const prevBank = prev.report.usages.reduce((s, u) => s + u.bankSpent, 0);
        const prevManual = prev.report.usages.reduce((s, u) => s + u.manualSpent, 0);
        prevSpent = getSpentBySource(prevBank, prevManual);
      }

      return {
        monthKey: item.monthKey,
        shortLabel: formatMonthShort(item.monthKey),
        fullLabel: formatMonthLabelIndo(item.monthKey),
        spent,
        bankSpent,
        manualSpent,
        limit,
        percentUsed,
        status,
        momDeltaPct: fullIdx > 0 || idx > 0 ? computeMomDeltaPct(spent, prevSpent) : null,
      };
    });
  }, [sixMonthReports, monthRange, sourceFilter]);

  // Insights & Reference lines
  const insights = useMemo(() => {
    const currentTotal = limitVsActualRows.reduce((s, r) => s + r.spent, 0);
    const prevTotal = limitVsActualRows.reduce((s, r) => s + r.prevSpent, 0);
    const totalLimit = limitVsActualRows.reduce((s, r) => s + r.limit, 0);
    const momDeltaPct = computeMomDeltaPct(currentTotal, prevTotal);
    const momDeltaDiff = currentTotal - prevTotal;

    const avgCategorySpend =
      limitVsActualRows.length > 0 ? currentTotal / limitVsActualRows.length : 0;
    const avgCategoryLimit =
      limitVsActualRows.length > 0 ? totalLimit / limitVsActualRows.length : 0;

    const avgMonthlyTotal =
      multiMonthTotalRows.length > 0
        ? multiMonthTotalRows.reduce((s, r) => s + r.spent, 0) / multiMonthTotalRows.length
        : 0;

    const spentRows = limitVsActualRows.filter((r) => r.spent > 0);
    const highestSpendCat =
      spentRows.length > 0
        ? [...spentRows].sort((a, b) => b.spent - a.spent || b.percentUsed - a.percentUsed)[0]
        : null;

    const thriftCandidates = limitVsActualRows.filter((r) => r.limit > 0);
    const mostThriftyCat =
      thriftCandidates.length > 0
        ? [...thriftCandidates].sort(
            (a, b) => a.percentUsed - b.percentUsed || b.remaining - a.remaining
          )[0]
        : null;

    return {
      currentTotal,
      prevTotal,
      totalLimit,
      momDeltaPct,
      momDeltaDiff,
      avgCategorySpend,
      avgCategoryLimit,
      avgMonthlyTotal,
      highestSpendCat,
      mostThriftyCat,
    };
  }, [limitVsActualRows, multiMonthTotalRows]);

  const hasCurrentMonthSpending = insights.currentTotal > 0;
  const activeHighlightCatId =
    hoveredCategoryId || (activeCategoryFilter !== '__ALL__' ? activeCategoryFilter : null);

  const handleCategoryBarClick = (categoryId?: string) => {
    if (!categoryId) return;
    const next = activeCategoryFilter === categoryId ? '__ALL__' : categoryId;
    onSelectCategory(next);
  };

  // Export CSV
  const handleExportCsv = () => {
    const lines: string[] = [];

    if (compareMode === 'limit_vs_actual') {
      lines.push(
        [
          'Kategori',
          'Bulan',
          'Sumber Filter',
          'Realisasi (Rp)',
          'Mutasi Bank (Rp)',
          'Catatan Manual (Rp)',
          'Batas Anggaran (Rp)',
          'Terpakai (%)',
          'Sisa / Selisih (Rp)',
          'Status',
          'Bulan Lalu (Rp)',
          'Perubahan vs Bulan Lalu (%)',
        ]
          .map(escapeCsvCell)
          .join(',')
      );
      limitVsActualRows.forEach((row) => {
        const statusLabel =
          row.status === 'exceeded'
            ? 'Melebihi Limit'
            : row.status === 'warning'
            ? 'Mendekati Limit'
            : 'Aman';
        lines.push(
          [
            row.name,
            formatMonthLabelIndo(selectedMonth),
            sourceFilter === 'all' ? 'Semua' : sourceFilter === 'bank' ? 'Mutasi Bank' : 'Manual',
            row.spent,
            row.bankSpent,
            row.manualSpent,
            row.limit,
            row.percentUsed.toFixed(1),
            row.remaining,
            statusLabel,
            row.prevSpent,
            row.momDeltaPct === null ? 'Baru' : row.momDeltaPct.toFixed(1),
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    } else if (multiMonthSubMode === 'by_category') {
      lines.push(
        [
          'Kategori',
          'Batas Bulanan (Rp)',
          ...activeMultiMonths.map((m) => `${m.fullLabel} (Rp)`),
          `Rata-rata ${monthRange} Bulan (Rp)`,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
      multiMonthCategoryRows.forEach((row) => {
        lines.push(
          [
            row.name,
            row.limit,
            ...activeMultiMonths.map((m) => Number(row[m.key] || 0)),
            Math.round(row.avgSpent),
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    } else {
      lines.push(
        [
          'Bulan',
          'Total Realisasi (Rp)',
          'Mutasi Bank (Rp)',
          'Catatan Manual (Rp)',
          'Total Batas Anggaran (Rp)',
          'Terpakai (%)',
          'Perubahan MoM (%)',
        ]
          .map(escapeCsvCell)
          .join(',')
      );
      multiMonthTotalRows.forEach((row) => {
        lines.push(
          [
            row.fullLabel,
            row.spent,
            row.bankSpent,
            row.manualSpent,
            row.limit,
            row.percentUsed.toFixed(1),
            row.momDeltaPct === null ? '-' : row.momDeltaPct.toFixed(1),
          ]
            .map(escapeCsvCell)
            .join(',')
        );
      });
    }

    const csvContent = `\uFEFF${lines.join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `perbandingan-pengeluaran-${selectedMonth}-${compareMode}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportNotice('File CSV perbandingan berhasil diunduh.');
  };

  // Serialize Recharts SVG with dark slate background for clean SVG / PNG download
  const buildSerializedSvg = (): { svgString: string; width: number; height: number } | null => {
    const host = chartHostRef.current;
    if (!host) return null;
    const svgEl = host.querySelector('svg.recharts-surface') as SVGSVGElement | null;
    if (!svgEl) return null;

    const rect = svgEl.getBoundingClientRect();
    const width = Math.max(640, Math.round(rect.width || 900));
    const height = Math.max(320, Math.round(rect.height || 360));
    const padTop = 44;
    const totalHeight = height + padTop + 16;

    const clone = svgEl.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', String(width));
    clone.setAttribute('height', String(totalHeight));
    clone.setAttribute('viewBox', `0 0 ${width} ${totalHeight}`);

    // Wrap original chart children in translated group
    const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    contentGroup.setAttribute('transform', `translate(0, ${padTop})`);
    while (clone.firstChild) {
      contentGroup.appendChild(clone.firstChild);
    }

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(totalHeight));
    bgRect.setAttribute('rx', '12');
    bgRect.setAttribute('fill', '#0f172a');

    const titleText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleText.setAttribute('x', '20');
    titleText.setAttribute('y', '26');
    titleText.setAttribute('fill', '#f8fafc');
    titleText.setAttribute('font-size', '14');
    titleText.setAttribute('font-weight', '700');
    titleText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
    titleText.textContent =
      compareMode === 'limit_vs_actual'
        ? `Perbandingan Pengeluaran vs Batas Anggaran — ${formatMonthLabelIndo(selectedMonth)}`
        : `Perbandingan Pengeluaran ${monthRange} Bulan Terakhir — s.d. ${formatMonthLabelIndo(selectedMonth)}`;

    clone.appendChild(bgRect);
    clone.appendChild(titleText);
    clone.appendChild(contentGroup);

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);
    return { svgString, width, height: totalHeight };
  };

  const handleExportSvg = () => {
    const res = buildSerializedSvg();
    if (!res) return;
    const blob = new Blob([res.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grafik-pengeluaran-${selectedMonth}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportNotice('Grafik vektor SVG berhasil diunduh.');
  };

  const handleExportPng = () => {
    const res = buildSerializedSvg();
    if (!res) return;
    const svgBlob = new Blob([res.svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = res.width * scale;
      canvas.height = res.height * scale;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, res.width, res.height);
        ctx.drawImage(img, 0, 0, res.width, res.height);
        const pngUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = pngUrl;
        a.download = `grafik-pengeluaran-${selectedMonth}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setExportNotice('Gambar grafik PNG (HD) berhasil diunduh.');
      }
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setExportNotice('Gagal merender PNG. Gunakan ekspor SVG.');
    };
    img.src = url;
  };

  // Dynamic chart height so horizontal bars & fullscreen stay spacious
  const rowCount =
    compareMode === 'limit_vs_actual'
      ? limitVsActualRows.length
      : multiMonthSubMode === 'by_category'
      ? multiMonthCategoryRows.length
      : multiMonthTotalRows.length;

  const chartHeight = useMemo(() => {
    if (orientation === 'horizontal') {
      const perRow =
        compareMode === 'multi_month' && multiMonthSubMode === 'by_category'
          ? monthRange === 6
            ? 68
            : 54
          : 50;
      const minH = isFullscreen ? 460 : 340;
      return Math.max(minH, rowCount * perRow + 56);
    }
    return isFullscreen ? 480 : 340;
  }, [orientation, compareMode, multiMonthSubMode, monthRange, rowCount, isFullscreen]);

  // Custom Tooltip Renderer
  const renderCustomTooltip = (tooltipProps: {
    active?: boolean;
    payload?: ReadonlyArray<{
      payload?: unknown;
    }>;
  }) => {
    const { active, payload } = tooltipProps;
    if (!active || !payload || payload.length === 0) return null;

    if (compareMode === 'limit_vs_actual') {
      const row = payload[0]?.payload as LimitVsActualRow | undefined;
      if (!row) return null;
      const statusText =
        row.status === 'exceeded'
          ? 'Melebihi Limit'
          : row.status === 'warning'
          ? 'Mendekati Limit'
          : 'Aman';
      const statusClass =
        row.status === 'exceeded'
          ? 'text-rose-400'
          : row.status === 'warning'
          ? 'text-amber-400'
          : 'text-emerald-400';

      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-xl min-w-[240px] max-w-[300px] space-y-2 text-xs">
          <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
            <div>
              <p className="font-bold text-white leading-tight">{row.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formatMonthLabelIndo(selectedMonth)} · {row.entryCount} transaksi
              </p>
            </div>
            <span className={`text-[11px] font-semibold shrink-0 ${statusClass}`}>
              {statusText}
            </span>
          </div>

          <div className="space-y-1 font-mono tabular-nums">
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-sans">Realisasi</span>
              <span className="font-bold text-white">{formatRupiah(row.spent)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-sans">Batas Anggaran</span>
              <span className="text-slate-300">{formatRupiah(row.limit)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-sans">Pemakaian Limit</span>
              <span className={`font-semibold ${statusClass}`}>{row.percentUsed.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-400 font-sans">
                {row.remaining < 0 ? 'Kelebihan' : 'Sisa Limit'}
              </span>
              <span className={row.remaining < 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                {row.remaining < 0
                  ? `+${formatRupiah(Math.abs(row.remaining))}`
                  : formatRupiah(row.remaining)}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-2 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-400 font-mono tabular-nums">
              <span className="font-sans">Mutasi / Manual</span>
              <span>
                {formatCompactRupiah(row.bankSpent)} / {formatCompactRupiah(row.manualSpent)}
              </span>
            </div>
            <div className="flex items-center justify-between font-mono tabular-nums">
              <span className="text-slate-400 font-sans">vs Bulan Lalu</span>
              {row.momDeltaPct === null ? (
                <span className="text-indigo-300 font-sans">Baru bulan ini</span>
              ) : row.momDeltaPct > 0 ? (
                <span className="text-rose-400">+{row.momDeltaPct.toFixed(1)}% naik</span>
              ) : row.momDeltaPct < 0 ? (
                <span className="text-emerald-400">{row.momDeltaPct.toFixed(1)}% turun</span>
              ) : (
                <span className="text-slate-400">0% tetap</span>
              )}
            </div>
          </div>

          <p className="text-[10px] text-indigo-300/90 border-t border-slate-800/80 pt-1.5">
            Klik batang untuk memfilter tabel rincian kategori ini
          </p>
        </div>
      );
    }

    if (multiMonthSubMode === 'by_category') {
      const row = payload[0]?.payload as MultiMonthCategoryRow | undefined;
      if (!row) return null;
      return (
        <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-xl min-w-[230px] space-y-2 text-xs">
          <div className="border-b border-slate-800 pb-2">
            <p className="font-bold text-white leading-tight">{row.name}</p>
            <p className="text-[11px] text-slate-400 mt-0.5 font-mono tabular-nums">
              Limit/bln: {formatRupiah(row.limit)} · Rata-rata: {formatRupiah(Math.round(row.avgSpent))}
            </p>
          </div>
          <div className="space-y-1 font-mono tabular-nums">
            {activeMultiMonths.map((m) => {
              const val = Number(row[m.key] || 0);
              return (
                <div key={m.key} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-1.5 font-sans text-slate-300">
                    <span
                      className="w-2 h-2 rounded-xs shrink-0"
                      style={{ backgroundColor: m.color }}
                    />
                    <span>{m.fullLabel}</span>
                  </span>
                  <span className="font-semibold text-white">{formatRupiah(val)}</span>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-indigo-300/90 border-t border-slate-800/80 pt-1.5">
            Klik batang kategori untuk memfilter tabel rincian
          </p>
        </div>
      );
    }

    // Multi-month Total view
    const totalRow = payload[0]?.payload as MultiMonthTotalRow | undefined;
    if (!totalRow) return null;
    const statusClass =
      totalRow.status === 'exceeded'
        ? 'text-rose-400'
        : totalRow.status === 'warning'
        ? 'text-amber-400'
        : 'text-emerald-400';

    return (
      <div className="bg-slate-950/95 border border-slate-700 rounded-xl p-3.5 shadow-xl min-w-[230px] space-y-2 text-xs">
        <div className="border-b border-slate-800 pb-2">
          <p className="font-bold text-white">{totalRow.fullLabel}</p>
          <p className="text-[11px] text-slate-400">Ringkasan Pengeluaran Bulanan</p>
        </div>
        <div className="space-y-1 font-mono tabular-nums">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400 font-sans">Total Realisasi</span>
            <span className="font-bold text-white">{formatRupiah(totalRow.spent)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400 font-sans">Batas Anggaran</span>
            <span className="text-slate-300">{formatRupiah(totalRow.limit)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-400 font-sans">Pemakaian</span>
            <span className={`font-semibold ${statusClass}`}>{totalRow.percentUsed.toFixed(1)}%</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 pt-1 border-t border-slate-800">
            <span className="font-sans">Mutasi / Manual</span>
            <span>
              {formatCompactRupiah(totalRow.bankSpent)} / {formatCompactRupiah(totalRow.manualSpent)}
            </span>
          </div>
          {totalRow.momDeltaPct !== null && (
            <div className="flex items-center justify-between gap-3 text-[11px]">
              <span className="text-slate-400 font-sans">Perubahan MoM</span>
              <span className={totalRow.momDeltaPct > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                {totalRow.momDeltaPct > 0 ? '+' : ''}
                {totalRow.momDeltaPct.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderChartBody = () => {
    const isHorizontal = orientation === 'horizontal';
    const labelPos = isHorizontal ? 'right' : 'top';

    if (compareMode === 'limit_vs_actual') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={limitVsActualRows}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
            margin={
              isHorizontal
                ? { top: 12, right: 64, left: 12, bottom: 12 }
                : { top: 26, right: 20, left: 8, bottom: 16 }
            }
            barGap={4}
            barCategoryGap="22%"
            onMouseLeave={() => setHoveredCategoryId(null)}
          >
            <CartesianGrid
              stroke="#1e293b"
              strokeDasharray="3 3"
              vertical={isHorizontal}
              horizontal={!isHorizontal}
            />
            {isHorizontal ? (
              <>
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactRupiah(Number(v))}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={150}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey="shortName"
                  interval={0}
                  angle={limitVsActualRows.length > 6 ? -18 : 0}
                  textAnchor={limitVsActualRows.length > 6 ? 'end' : 'middle'}
                  height={limitVsActualRows.length > 6 ? 54 : 36}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  width={62}
                  tickFormatter={(v) => formatCompactRupiah(Number(v))}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}

            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={renderCustomTooltip}
            />

            {/* Reference Line: Average Category Spending */}
            {insights.avgCategorySpend > 0 &&
              (isHorizontal ? (
                <ReferenceLine
                  x={insights.avgCategorySpend}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Rata-rata ${formatCompactRupiah(insights.avgCategorySpend)}`,
                    position: 'top',
                    fill: '#38bdf8',
                    fontSize: 10,
                  }}
                />
              ) : (
                <ReferenceLine
                  y={insights.avgCategorySpend}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Rata-rata ${formatCompactRupiah(insights.avgCategorySpend)}`,
                    position: 'insideTopRight',
                    fill: '#38bdf8',
                    fontSize: 10,
                  }}
                />
              ))}

            {/* Reference Line: Average Category Budget Limit */}
            {insights.avgCategoryLimit > 0 &&
              (isHorizontal ? (
                <ReferenceLine
                  x={insights.avgCategoryLimit}
                  stroke="#f59e0b"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Rata-rata Limit ${formatCompactRupiah(insights.avgCategoryLimit)}`,
                    position: 'bottom',
                    fill: '#f59e0b',
                    fontSize: 10,
                  }}
                />
              ) : (
                <ReferenceLine
                  y={insights.avgCategoryLimit}
                  stroke="#f59e0b"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Rata-rata Limit ${formatCompactRupiah(insights.avgCategoryLimit)}`,
                    position: 'insideTopLeft',
                    fill: '#f59e0b',
                    fontSize: 10,
                  }}
                />
              ))}

            {/* Budget Limit Bar */}
            <Bar
              dataKey="limit"
              name="Batas Anggaran"
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={28}
              className="cursor-pointer"
              onMouseEnter={(barData) => {
                const payload = (barData as { payload?: LimitVsActualRow })?.payload;
                if (payload?.categoryId) setHoveredCategoryId(payload.categoryId);
              }}
              onClick={(barData) => {
                const payload = (barData as { payload?: LimitVsActualRow })?.payload;
                handleCategoryBarClick(payload?.categoryId);
              }}
            >
              {limitVsActualRows.map((entry) => {
                const isDimmed =
                  activeHighlightCatId !== null && activeHighlightCatId !== entry.categoryId;
                return (
                  <Cell
                    key={`limit-${entry.categoryId}`}
                    fill="#334155"
                    fillOpacity={isDimmed ? 0.25 : 0.85}
                    stroke={activeCategoryFilter === entry.categoryId ? '#94a3b8' : 'none'}
                    strokeWidth={activeCategoryFilter === entry.categoryId ? 1.5 : 0}
                  />
                );
              })}
              {!hasCurrentMonthSpending && (
                <LabelList
                  dataKey="limit"
                  position={labelPos}
                  formatter={(v: unknown) => formatCompactRupiah(Number(v ?? 0))}
                  style={{
                    fill: '#94a3b8',
                    fontSize: 10,
                    fontFamily: 'ui-monospace, monospace',
                  }}
                />
              )}
            </Bar>

            {/* Actual Spending Bar (Color-coded by status) */}
            <Bar
              dataKey="spent"
              name="Realisasi Pengeluaran"
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
              maxBarSize={28}
              className="cursor-pointer"
              onMouseEnter={(barData) => {
                const payload = (barData as { payload?: LimitVsActualRow })?.payload;
                if (payload?.categoryId) setHoveredCategoryId(payload.categoryId);
              }}
              onClick={(barData) => {
                const payload = (barData as { payload?: LimitVsActualRow })?.payload;
                handleCategoryBarClick(payload?.categoryId);
              }}
            >
              {limitVsActualRows.map((entry) => {
                const isDimmed =
                  activeHighlightCatId !== null && activeHighlightCatId !== entry.categoryId;
                const isSelected = activeCategoryFilter === entry.categoryId;
                return (
                  <Cell
                    key={`spent-${entry.categoryId}`}
                    fill={STATUS_HEX[entry.status]}
                    fillOpacity={isDimmed ? 0.3 : 1}
                    stroke={isSelected ? '#f8fafc' : 'none'}
                    strokeWidth={isSelected ? 1.5 : 0}
                  />
                );
              })}
              <LabelList
                dataKey="spent"
                position={labelPos}
                formatter={(v: unknown) => formatCompactRupiah(Number(v ?? 0))}
                style={{
                  fill: '#e2e8f0',
                  fontSize: 10,
                  fontWeight: 600,
                  fontFamily: 'ui-monospace, monospace',
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (multiMonthSubMode === 'by_category') {
      return (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={multiMonthCategoryRows}
            layout={isHorizontal ? 'vertical' : 'horizontal'}
            margin={
              isHorizontal
                ? { top: 12, right: 64, left: 12, bottom: 12 }
                : { top: 24, right: 20, left: 8, bottom: 16 }
            }
            barGap={2}
            barCategoryGap="18%"
            onMouseLeave={() => setHoveredCategoryId(null)}
          >
            <CartesianGrid
              stroke="#1e293b"
              strokeDasharray="3 3"
              vertical={isHorizontal}
              horizontal={!isHorizontal}
            />
            {isHorizontal ? (
              <>
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatCompactRupiah(Number(v))}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="shortName"
                  width={150}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="category"
                  dataKey="shortName"
                  interval={0}
                  angle={multiMonthCategoryRows.length > 5 ? -18 : 0}
                  textAnchor={multiMonthCategoryRows.length > 5 ? 'end' : 'middle'}
                  height={multiMonthCategoryRows.length > 5 ? 54 : 36}
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  width={62}
                  tickFormatter={(v) => formatCompactRupiah(Number(v))}
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
              </>
            )}

            <Tooltip
              cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
              content={renderCustomTooltip}
            />

            {insights.avgCategorySpend > 0 &&
              (isHorizontal ? (
                <ReferenceLine
                  x={insights.avgCategorySpend}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              ) : (
                <ReferenceLine
                  y={insights.avgCategorySpend}
                  stroke="#38bdf8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  label={{
                    value: `Rata-rata Bln Aktif ${formatCompactRupiah(insights.avgCategorySpend)}`,
                    position: 'insideTopRight',
                    fill: '#38bdf8',
                    fontSize: 10,
                  }}
                />
              ))}

            {activeMultiMonths.map((month, mIdx) => {
              const isLatestMonth = mIdx === activeMultiMonths.length - 1;
              return (
                <Bar
                  key={month.key}
                  dataKey={month.key}
                  name={month.shortLabel}
                  fill={month.color}
                  radius={isHorizontal ? [0, 3, 3, 0] : [3, 3, 0, 0]}
                  maxBarSize={monthRange === 6 ? 14 : 22}
                  className="cursor-pointer"
                  onMouseEnter={(barData) => {
                    const payload = (barData as { payload?: MultiMonthCategoryRow })?.payload;
                    if (payload?.categoryId) setHoveredCategoryId(payload.categoryId);
                  }}
                  onClick={(barData) => {
                    const payload = (barData as { payload?: MultiMonthCategoryRow })?.payload;
                    handleCategoryBarClick(payload?.categoryId);
                  }}
                >
                  {multiMonthCategoryRows.map((entry) => {
                    const isDimmed =
                      activeHighlightCatId !== null && activeHighlightCatId !== entry.categoryId;
                    return (
                      <Cell
                        key={`${month.key}-${entry.categoryId}`}
                        fill={month.color}
                        fillOpacity={isDimmed ? 0.25 : 1}
                      />
                    );
                  })}
                  {isLatestMonth && (
                    <LabelList
                      dataKey={month.key}
                      position={labelPos}
                      formatter={(v: unknown) => {
                        const num = Number(v ?? 0);
                        return num > 0 ? formatCompactRupiah(num) : '';
                      }}
                      style={{
                        fill: '#e2e8f0',
                        fontSize: 10,
                        fontWeight: 600,
                        fontFamily: 'ui-monospace, monospace',
                      }}
                    />
                  )}
                </Bar>
              );
            })}
          </BarChart>
        </ResponsiveContainer>
      );
    }

    // Mode 2B: Total Pengeluaran per Bulan vs Batas Total Anggaran
    return (
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={multiMonthTotalRows}
          layout={isHorizontal ? 'vertical' : 'horizontal'}
          margin={
            isHorizontal
              ? { top: 12, right: 72, left: 12, bottom: 12 }
              : { top: 26, right: 20, left: 8, bottom: 12 }
          }
          barCategoryGap="28%"
        >
          <CartesianGrid
            stroke="#1e293b"
            strokeDasharray="3 3"
            vertical={isHorizontal}
            horizontal={!isHorizontal}
          />
          {isHorizontal ? (
            <>
              <XAxis
                type="number"
                tickFormatter={(v) => formatCompactRupiah(Number(v))}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="shortLabel"
                width={86}
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
            </>
          ) : (
            <>
              <XAxis
                type="category"
                dataKey="shortLabel"
                tick={{ fill: '#cbd5e1', fontSize: 11 }}
                axisLine={{ stroke: '#334155' }}
                tickLine={false}
              />
              <YAxis
                type="number"
                width={66}
                tickFormatter={(v) => formatCompactRupiah(Number(v))}
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'ui-monospace, monospace' }}
                axisLine={false}
                tickLine={false}
              />
            </>
          )}

          <Tooltip
            cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }}
            content={renderCustomTooltip}
          />

          {/* Reference Line: Monthly Average */}
          {insights.avgMonthlyTotal > 0 &&
            (isHorizontal ? (
              <ReferenceLine
                x={insights.avgMonthlyTotal}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Rata-rata ${formatCompactRupiah(insights.avgMonthlyTotal)}`,
                  position: 'top',
                  fill: '#38bdf8',
                  fontSize: 10,
                }}
              />
            ) : (
              <ReferenceLine
                y={insights.avgMonthlyTotal}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                label={{
                  value: `Rata-rata ${formatCompactRupiah(insights.avgMonthlyTotal)}`,
                  position: 'insideTopRight',
                  fill: '#38bdf8',
                  fontSize: 10,
                }}
              />
            ))}

          {/* Reference Line: Total Monthly Budget Limit */}
          {insights.totalLimit > 0 &&
            (isHorizontal ? (
              <ReferenceLine
                x={insights.totalLimit}
                stroke="#f59e0b"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Total Limit ${formatCompactRupiah(insights.totalLimit)}`,
                  position: 'bottom',
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />
            ) : (
              <ReferenceLine
                y={insights.totalLimit}
                stroke="#f59e0b"
                strokeDasharray="5 4"
                strokeWidth={1.5}
                label={{
                  value: `Total Limit ${formatCompactRupiah(insights.totalLimit)}`,
                  position: 'insideTopLeft',
                  fill: '#f59e0b',
                  fontSize: 10,
                }}
              />
            ))}

          <Bar
            dataKey="spent"
            name="Total Pengeluaran Bulanan"
            radius={isHorizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]}
            maxBarSize={48}
          >
            {multiMonthTotalRows.map((entry) => (
              <Cell
                key={`total-${entry.monthKey}`}
                fill={STATUS_HEX[entry.status]}
                fillOpacity={entry.monthKey === selectedMonth ? 1 : 0.78}
                stroke={entry.monthKey === selectedMonth ? '#f8fafc' : 'none'}
                strokeWidth={entry.monthKey === selectedMonth ? 1.5 : 0}
              />
            ))}
            <LabelList
              dataKey="spent"
              position={labelPos}
              formatter={(v: unknown) => formatCompactRupiah(Number(v ?? 0))}
              style={{
                fill: '#e2e8f0',
                fontSize: 11,
                fontWeight: 600,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const activeCategoryName =
    activeCategoryFilter !== '__ALL__'
      ? currentMonthEntry.report.activeCategories.find((c) => c.id === activeCategoryFilter)?.name
      : null;

  const panelContent = (
    <div
      className={`bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4 ${
        isFullscreen ? 'w-full max-w-7xl max-h-[92vh] overflow-y-auto shadow-2xl' : ''
      }`}
    >
      {/* Top Header & Utility Actions */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-400 shrink-0" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Grafik Batang Perbandingan Pengeluaran Kategori
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            {compareMode === 'limit_vs_actual'
              ? `Perbandingan realisasi belanja terhadap batas anggaran kategori pada ${formatMonthLabelIndo(
                  selectedMonth
                )}. Klik batang untuk menyaring rincian transaksi.`
              : `Perbandingan tren pengeluaran ${monthRange} bulan terakhir hingga ${formatMonthLabelIndo(
                  selectedMonth
                )}.`}
          </p>
        </div>

        {/* Utility / Export Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleExportCsv}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Unduh data perbandingan dalam format CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportPng}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Unduh grafik sebagai gambar PNG resolusi tinggi"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>PNG</span>
          </button>
          <button
            type="button"
            onClick={handleExportSvg}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title="Unduh grafik vektor SVG"
          >
            <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>SVG</span>
          </button>
          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            title={isFullscreen ? 'Keluar dari layar penuh (Esc)' : 'Perluas grafik ke layar penuh'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Tutup</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                <span>Perluas</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Export Confirmation Notice */}
      {exportNotice && (
        <div className="px-3.5 py-2 rounded-xl bg-emerald-950/50 border border-emerald-800/70 text-emerald-200 text-xs flex items-center justify-between gap-2">
          <span>{exportNotice}</span>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          {/* Primary Comparison Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setCompareMode('limit_vs_actual')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                compareMode === 'limit_vs_actual'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Realisasi vs Limit
            </button>
            <button
              type="button"
              onClick={() => setCompareMode('multi_month')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                compareMode === 'multi_month'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Antar Bulan
            </button>
          </div>

          {/* Multi-Month Range & Sub-Mode */}
          {compareMode === 'multi_month' && (
            <>
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                {([3, 6] as const).map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setMonthRange(range)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap font-mono tabular-nums ${
                      monthRange === range
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {range} Bulan
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMultiMonthSubMode('by_category')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    multiMonthSubMode === 'by_category'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Per Kategori
                </button>
                <button
                  type="button"
                  onClick={() => setMultiMonthSubMode('by_month_total')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    multiMonthSubMode === 'by_month_total'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Total Bulanan
                </button>
              </div>
            </>
          )}

          {/* Orientation Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setOrientation('vertical')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                orientation === 'vertical'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Vertikal
            </button>
            <button
              type="button"
              onClick={() => setOrientation('horizontal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                orientation === 'horizontal'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Horizontal
            </button>
          </div>
        </div>

        {/* Right Controls: Source Filter + Sort */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Source Filter */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            {(['all', 'bank', 'manual'] as const).map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => onChangeSourceFilter(src)}
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

          {/* Sort Selector */}
          {(compareMode === 'limit_vs_actual' || multiMonthSubMode === 'by_category') && (
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-xs font-medium text-slate-200 focus:outline-none cursor-pointer"
                aria-label="Urutkan kategori grafik"
              >
                <option value="spent_desc" className="bg-slate-900 text-white">
                  Pengeluaran Terbesar
                </option>
                <option value="percent_desc" className="bg-slate-900 text-white">
                  Persen Limit Tertinggi
                </option>
                <option value="default" className="bg-slate-900 text-white">
                  Urutan Bawaan
                </option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Single-Elevation Insight Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-950/60 border border-slate-800 rounded-xl">
        {/* Insight 1: MoM Comparison */}
        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Perbandingan vs Bulan Lalu</span>
            <span className="font-mono tabular-nums">{formatMonthShort(prevMonthEntry.monthKey)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-bold text-white font-mono tabular-nums">
              {formatRupiah(insights.currentTotal)}
            </span>
            {insights.momDeltaPct === null ? (
              <span className="text-xs font-medium text-indigo-300">
                Baru bulan ini
              </span>
            ) : insights.momDeltaPct > 0 ? (
              <span className="text-xs font-semibold text-rose-400 font-mono tabular-nums inline-flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{insights.momDeltaPct.toFixed(1)}%
              </span>
            ) : insights.momDeltaPct < 0 ? (
              <span className="text-xs font-semibold text-emerald-400 font-mono tabular-nums inline-flex items-center gap-0.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                {insights.momDeltaPct.toFixed(1)}%
              </span>
            ) : (
              <span className="text-xs font-medium text-slate-400 font-mono tabular-nums inline-flex items-center gap-0.5">
                <Minus className="w-3.5 h-3.5" />
                0%
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 font-mono tabular-nums">
            Bulan lalu: {formatRupiah(insights.prevTotal)}
          </div>
        </div>

        {/* Insight 2: Highest Spending Category */}
        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Kategori Paling Boros</span>
            {insights.highestSpendCat && (
              <span
                className={`font-mono tabular-nums font-semibold ${
                  insights.highestSpendCat.status === 'exceeded'
                    ? 'text-rose-400'
                    : insights.highestSpendCat.status === 'warning'
                    ? 'text-amber-400'
                    : 'text-slate-300'
                }`}
              >
                {insights.highestSpendCat.percentUsed.toFixed(0)}% limit
              </span>
            )}
          </div>
          {insights.highestSpendCat ? (
            <>
              <div className="text-sm font-bold text-white truncate">
                {insights.highestSpendCat.name}
              </div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                {formatRupiah(insights.highestSpendCat.spent)} dari{' '}
                {formatRupiah(insights.highestSpendCat.limit)}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 pt-1">
              Belum ada pengeluaran bulan ini
            </div>
          )}
        </div>

        {/* Insight 3: Most Thrifty Category */}
        <div className="px-4 py-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Kategori Paling Hemat</span>
            {insights.mostThriftyCat && (
              <span className="font-mono tabular-nums font-semibold text-emerald-400">
                {insights.mostThriftyCat.percentUsed.toFixed(0)}% terpakai
              </span>
            )}
          </div>
          {insights.mostThriftyCat ? (
            <>
              <div className="text-sm font-bold text-white truncate">
                {insights.mostThriftyCat.name}
              </div>
              <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                Sisa {formatRupiah(Math.max(0, insights.mostThriftyCat.remaining))} dari{' '}
                {formatRupiah(insights.mostThriftyCat.limit)}
              </div>
            </>
          ) : (
            <div className="text-xs text-slate-500 pt-1">
              Tambahkan batas anggaran kategori
            </div>
          )}
        </div>
      </div>

      {/* Active Category Filter Sync Strip */}
      {activeCategoryName && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 bg-indigo-950/40 border border-indigo-700/50 rounded-xl text-xs">
          <div className="flex items-center gap-2 text-indigo-200">
            <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Kategori disorot &amp; difilter di tabel rincian:{' '}
              <strong className="text-white">{activeCategoryName}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onScrollToLedger}
              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Lihat Tabel Rincian
            </button>
            <button
              type="button"
              onClick={() => onSelectCategory('__ALL__')}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* Zero-Spend Action Banner (Still Renders Limit Bars Below) */}
      {!hasCurrentMonthSpending && compareMode === 'limit_vs_actual' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border border-dashed border-slate-700 rounded-xl">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-200">
              Belum ada realisasi pengeluaran di {formatMonthLabelIndo(selectedMonth)}
            </p>
            <p className="text-[11px] text-slate-400">
              Grafik tetap menampilkan batas anggaran per kategori (realisasi Rp 0). Catat transaksi untuk mulai memantau perbandingan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenManualExpense()}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Catat Pengeluaran</span>
          </button>
        </div>
      )}

      {/* Inline Legend Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        {compareMode === 'limit_vs_actual' ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              <span>Aman (&lt;80%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              <span>Waspada (80%–99%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
              <span>Over-Budget (≥100%)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-slate-700 inline-block" />
              <span>Batas Anggaran</span>
            </span>
          </div>
        ) : multiMonthSubMode === 'by_category' ? (
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5">
            {activeMultiMonths.map((m) => (
              <span key={m.key} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-xs inline-block"
                  style={{ backgroundColor: m.color }}
                />
                <span className={m.key === selectedMonth ? 'text-white font-semibold' : ''}>
                  {m.shortLabel}
                </span>
              </span>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
              <span>Bulan Aman</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" />
              <span>Waspada 80%+</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" />
              <span>Over-Budget</span>
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 border-t border-dashed border-sky-400 inline-block" />
            <span>Garis Rata-rata</span>
          </span>
          {(compareMode === 'limit_vs_actual' || multiMonthSubMode === 'by_month_total') && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 border-t border-dashed border-amber-400 inline-block" />
              <span>
                {compareMode === 'limit_vs_actual' ? 'Rata-rata Limit' : 'Total Batas Bulanan'}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main Recharts Canvas */}
      <div
        ref={chartHostRef}
        className="w-full bg-slate-950/50 border border-slate-800/80 rounded-xl p-2 sm:p-3 overflow-x-auto"
      >
        <div className="min-w-[520px]">{renderChartBody()}</div>
      </div>

      {/* Footer Hint */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <SlidersHorizontal className="w-3 h-3 text-slate-400" />
          <span>
            Sumber aktif:{' '}
            <strong className="text-slate-300">
              {sourceFilter === 'all'
                ? 'Mutasi Bank + Catatan Manual'
                : sourceFilter === 'bank'
                ? 'Mutasi Bank Saja'
                : 'Catatan Manual Saja'}
            </strong>
          </span>
        </span>
        <span className="font-mono tabular-nums">
          Rata-rata kategori: {formatRupiah(Math.round(insights.avgCategorySpend))} · Total Limit:{' '}
          {formatRupiah(insights.totalLimit)}
        </span>
      </div>
    </div>
  );

  if (isFullscreen) {
    return (
      <div
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) setIsFullscreen(false);
        }}
      >
        {panelContent}
      </div>
    );
  }

  return panelContent;
};
