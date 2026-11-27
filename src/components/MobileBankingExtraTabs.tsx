import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Target,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  QrCode,
  Copy,
  Check,
  Download,
  ScanLine,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Trophy,
  Flame,
  Gift,
  Coins,
  ShieldAlert,
  Lock,
  Unlock,
  Snowflake,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Banknote,
  Ticket,
  Search,
  ExternalLink,
  Clock,
  ShieldCheck,
  RotateCcw,
  Link2,
  ArrowRight,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import {
  DAILY_ACHIEVEMENT_CATALOG,
  DREAM_POCKET_PRESETS,
} from '../data/socialAndBankingExtrasCatalog';
import { DiamondText } from './DiamondIcon';
import {
  LOYALTY_MISSION_CATEGORY_META,
  MANDATORY_TRANSFER_ADMIN_FEE_PERCENT,
  calculateMandatoryTransferFee,
  computeDailyTxActivityStats,
  computeStreakVisualSnapshot,
  ensureTodayLoyaltyAccountState,
  evaluateDailyLoyaltyMissionProgress,
  getEffectiveDailyLoyaltyMissions,
  getWibDateString,
  getWibResetCountdownText,
  normalizeLoyaltyAdminConfig,
} from '../utils/loyaltySystemUtils';
import { LoyaltyDailyMissionCategory } from '../types/bank';

export type MobileBankingExtraTabKey =
  | 'kantong_impian'
  | 'qris_pribadi'
  | 'analitik'
  | 'loyalty'
  | 'brankas';

interface MobileBankingExtraTabsProps {
  activeTab: MobileBankingExtraTabKey;
}

interface ParsedQrisTransferTarget {
  recipientAccount: string;
  recipientBank: string;
  recipientName?: string;
  amount: number;
  note: string;
  sourceKind: 'url' | 'legacy_qr' | 'uid' | 'account' | 'unknown';
}

function parseQrisTransferInput(
  rawInput: string,
  accounts: Array<{ accountNumber: string; userId16?: string; fullName: string }>
): ParsedQrisTransferTarget {
  const trimmed = rawInput.trim();
  const fallback: ParsedQrisTransferTarget = {
    recipientAccount: '',
    recipientBank: 'Bank Nusantara',
    amount: 0,
    note: '',
    sourceKind: 'unknown',
  };
  if (!trimmed) return fallback;

  // 1. Parse URL deep-link (?qris_transfer=1&to=...&amt=...&name=...&bank=...&note=...)
  if (trimmed.includes('qris_transfer=') || /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/?')) {
    try {
      const normalizedUrl = trimmed.startsWith('/?')
        ? `${window.location.origin}${trimmed}`
        : trimmed;
      const urlObj = new URL(normalizedUrl);
      const toParam = (urlObj.searchParams.get('to') || '').trim();
      const uidParam = (urlObj.searchParams.get('uid') || '').trim();
      const nameParam = (urlObj.searchParams.get('name') || '').trim();
      const bankParam = (urlObj.searchParams.get('bank') || 'Bank Nusantara').trim();
      const amtParam = Math.max(0, Math.round(Number(urlObj.searchParams.get('amt') || '0') || 0));
      const noteParam = (urlObj.searchParams.get('note') || '').trim();

      let resolvedAcc = toParam;
      let resolvedName = nameParam;
      if (!resolvedAcc && uidParam) {
        const byUid = accounts.find((a) => a.userId16 === uidParam);
        if (byUid) {
          resolvedAcc = byUid.accountNumber;
          if (!resolvedName) resolvedName = byUid.fullName;
        }
      } else if (resolvedAcc && !resolvedName) {
        const byAcc = accounts.find((a) => a.accountNumber === resolvedAcc);
        if (byAcc) resolvedName = byAcc.fullName;
      }

      if (resolvedAcc) {
        return {
          recipientAccount: resolvedAcc,
          recipientBank: bankParam || 'Bank Nusantara',
          recipientName: resolvedName || undefined,
          amount: amtParam,
          note: noteParam,
          sourceKind: 'url',
        };
      }
    } catch {
      // fallback to other formats
    }
  }

  // 2. Legacy BNUS-QRPAY|ACC:...|UID:...|NAME:...|AMT:...
  if (trimmed.startsWith('BNUS-QRPAY|')) {
    const parts = Object.fromEntries(
      trimmed
        .split('|')
        .slice(1)
        .map((seg) => {
          const idx = seg.indexOf(':');
          return idx > 0 ? [seg.slice(0, idx), seg.slice(idx + 1)] : [seg, ''];
        })
    );
    const acc = (parts.ACC || '').trim();
    const uid = (parts.UID || '').trim();
    const matched = accounts.find((a) => a.accountNumber === acc || (uid && a.userId16 === uid));
    return {
      recipientAccount: matched?.accountNumber || acc,
      recipientBank: 'Bank Nusantara',
      recipientName: parts.NAME || matched?.fullName,
      amount: Math.max(0, Math.round(Number(parts.AMT) || 0)),
      note: (parts.NOTE || '').trim(),
      sourceKind: 'legacy_qr',
    };
  }

  // 3. 16-digit User ID
  const digitsOnly = trimmed.replace(/\s+/g, '');
  if (/^\d{16}$/.test(digitsOnly)) {
    const matched = accounts.find((a) => a.userId16 === digitsOnly);
    return {
      recipientAccount: matched?.accountNumber || '',
      recipientBank: 'Bank Nusantara',
      recipientName: matched?.fullName,
      amount: 0,
      note: '',
      sourceKind: 'uid',
    };
  }

  // 4. 8–12 digit Account Number
  if (/^\d{8,12}$/.test(digitsOnly)) {
    const matched = accounts.find((a) => a.accountNumber === digitsOnly);
    return {
      recipientAccount: digitsOnly,
      recipientBank: 'Bank Nusantara',
      recipientName: matched?.fullName,
      amount: 0,
      note: '',
      sourceKind: 'account',
    };
  }

  return fallback;
}

export const MobileBankingExtraTabs: React.FC<MobileBankingExtraTabsProps> = ({ activeTab }) => {
  const {
    currentAccount,
    accounts,
    currentAccountTransactions,
    dreamPockets,
    dreamPocketConfig,
    createDreamPocket,
    depositToDreamPocket,
    withdrawFromDreamPocket,
    deleteDreamPocket,
    safeVaultMap,
    getUnlockedAvailableBalance,
    lockBalanceToSafeVault,
    unlockBalanceFromSafeVault,
    toggleCardFreezeWithPin,
    loyaltyMap,
    loyaltyConfig,
    claimAchievementReward,
    claimDailyLoyaltyMission,
    claimAllReadyLoyaltyMissions,
    buyStreakRecoveryCard,
    useStreakRecoveryCard,
    forfeitFrozenStreak,
    redeemLoyaltyPoints,
    transferMoney,
    chatStatuses,
  } = useBank();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State: Kantong Impian
  const [pocketName, setPocketName] = useState('');
  const [pocketPresetIdx, setPocketPresetIdx] = useState(0);
  const [pocketTarget, setPocketTarget] = useState('1000000');
  const [pocketDeadline, setPocketDeadline] = useState('');
  const [pocketAmounts, setPocketAmounts] = useState<Record<string, string>>({});

  // State: QRIS Rekening Pribadi
  const [personalQrUrl, setPersonalQrUrl] = useState('');
  const [qrRequestAmount, setQrRequestAmount] = useState('');
  const [qrRequestNote, setQrRequestNote] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanInputCode, setScanInputCode] = useState('');
  const [scanPayAmount, setScanPayAmount] = useState('');
  const [scanPayNote, setScanPayNote] = useState('');
  const [scanPayPin, setScanPayPin] = useState('');

  // State: Brankas & Freeze Kartu
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultPin, setVaultPin] = useState('');
  const [freezePin, setFreezePin] = useState('');

  // State: Loyalty & 100 Misi Harian
  const [redeemPointsInput, setRedeemPointsInput] = useState('200');
  const [recoveryBuyQty, setRecoveryBuyQty] = useState<number>(1);
  const [missionCategoryFilter, setMissionCategoryFilter] = useState<'all' | LoyaltyDailyMissionCategory>('all');
  const [missionStatusFilter, setMissionStatusFilter] = useState<'all' | 'ready' | 'in_progress' | 'claimed'>('all');
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [missionVisibleLimit, setMissionVisibleLimit] = useState<number>(20);
  const [loyaltySubView, setLoyaltySubView] = useState<'daily_100' | 'milestones'>('daily_100');

  const isAdminCard = Boolean(
    currentAccount && (currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance))
  );

  const normalizedLoyaltyConfig = useMemo(
    () => normalizeLoyaltyAdminConfig(loyaltyConfig),
    [loyaltyConfig]
  );

  // Personal QRIS sekarang menyimpan Link Transfer Resmi Bank Nusantara agar saat discan nasabah lain langsung mengarah ke halaman Transfer terisi otomatis!
  const personalQrTransferLink = useMemo(() => {
    if (!currentAccount) return '';
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://banknusantara.app';
    const params = new URLSearchParams();
    params.set('qris_transfer', '1');
    params.set('to', currentAccount.accountNumber);
    params.set('uid', currentAccount.userId16 || currentAccount.accountNumber);
    params.set('name', currentAccount.fullName);
    params.set('bank', 'Bank Nusantara');
    const amt = Math.max(0, Math.round(Number(qrRequestAmount) || 0));
    if (amt > 0) params.set('amt', String(amt));
    const note = qrRequestNote.trim();
    if (note) params.set('note', note);
    return `${origin}/?${params.toString()}`;
  }, [currentAccount, qrRequestAmount, qrRequestNote]);

  useEffect(() => {
    if (activeTab !== 'qris_pribadi' || !personalQrTransferLink) return;
    let mounted = true;
    void QRCode.toDataURL(personalQrTransferLink, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (mounted) setPersonalQrUrl(url);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [activeTab, personalQrTransferLink]);

  const parsedScanTarget = useMemo(
    () => parseQrisTransferInput(scanInputCode, accounts),
    [scanInputCode, accounts]
  );

  const effectiveScanAmount = useMemo(() => {
    const manual = Math.max(0, Math.round(Number(scanPayAmount) || 0));
    return manual > 0 ? manual : parsedScanTarget.amount;
  }, [scanPayAmount, parsedScanTarget.amount]);

  const effectiveScanFee = useMemo(
    () => calculateMandatoryTransferFee(effectiveScanAmount),
    [effectiveScanAmount]
  );

  const showNotice = (res: { success: boolean; message: string }) => {
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const copyValue = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch { /* empty */ }
  };

  // Monthly Analytics calculation
  const analytics = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      months.push({ key, label, income: 0, expense: 0 });
    }
    const categoryTotals: Record<string, number> = {
      Transfer: 0,
      Tagihan: 0,
      Investasi: 0,
      Belanja: 0,
      Pemasukan: 0,
    };

    currentAccountTransactions.forEach((tx) => {
      const dateStr = tx.timestamp || tx.date || '';
      const ym = dateStr.slice(0, 7);
      const bucket = months.find((m) => m.key === ym);
      const txTypeStr = String(tx.type || '');
      const isIncoming =
        txTypeStr === 'setor' ||
        txTypeStr === 'gaji_kerja' ||
        txTypeStr === 'bunga_deposito' ||
        txTypeStr === 'terima_transfer' ||
        txTypeStr === 'transfer_in' ||
        (tx.recipientAccount && currentAccount && tx.recipientAccount === currentAccount.accountNumber && tx.senderAccount !== currentAccount.accountNumber);
      const amt = Math.max(0, Number(tx.amount) || 0);
      if (bucket) {
        if (isIncoming) bucket.income += amt;
        else bucket.expense += amt;
      }
      if (isIncoming) categoryTotals.Pemasukan += amt;
      else if (tx.category === 'investasi' || tx.type.includes('emas') || tx.type.includes('celengan')) categoryTotals.Investasi += amt;
      else if (tx.category === 'tagihan' || tx.type.includes('pulsa') || tx.type.includes('listrik')) categoryTotals.Tagihan += amt;
      else if (tx.type.includes('transfer')) categoryTotals.Transfer += amt;
      else categoryTotals.Belanja += amt;
    });

    const curMonth = months[months.length - 1] || { income: 0, expense: 0, label: 'Bulan Ini' };
    const maxBar = Math.max(100_000, ...months.map((m) => Math.max(m.income, m.expense)));
    const savingsRatio =
      curMonth.income > 0
        ? Math.max(0, Math.min(100, Math.round(((curMonth.income - curMonth.expense) / curMonth.income) * 100)))
        : 0;
    return { months, categoryTotals, curMonth, maxBar, savingsRatio };
  }, [currentAccountTransactions, currentAccount]);

  const todayWib = getWibDateString();

  const dailyMissionRows = useMemo(() => {
    if (!currentAccount) return [];
    const effectiveMissions = getEffectiveDailyLoyaltyMissions(normalizedLoyaltyConfig);
    const txStats = computeDailyTxActivityStats(
      currentAccount.id,
      currentAccountTransactions,
      todayWib
    );
    const state = ensureTodayLoyaltyAccountState(loyaltyMap[currentAccount.id], todayWib);
    return effectiveMissions.map((mission) => ({
      mission,
      evalResult: evaluateDailyLoyaltyMissionProgress(mission, state, txStats, todayWib),
    }));
  }, [currentAccount, normalizedLoyaltyConfig, currentAccountTransactions, loyaltyMap, todayWib]);

  const missionSummary = useMemo(() => {
    const total = dailyMissionRows.length;
    let claimed = 0;
    let ready = 0;
    let inProgress = 0;
    for (const row of dailyMissionRows) {
      if (row.evalResult.claimed) claimed += 1;
      else if (row.evalResult.completed) ready += 1;
      else inProgress += 1;
    }
    return { total, claimed, ready, inProgress };
  }, [dailyMissionRows]);

  const filteredMissionRows = useMemo(() => {
    const q = missionSearchQuery.trim().toLowerCase();
    return dailyMissionRows
      .filter(({ mission, evalResult }) => {
        if (missionCategoryFilter !== 'all' && mission.category !== missionCategoryFilter) {
          return false;
        }
        if (missionStatusFilter === 'ready' && !(evalResult.completed && !evalResult.claimed)) {
          return false;
        }
        if (missionStatusFilter === 'claimed' && !evalResult.claimed) {
          return false;
        }
        if (missionStatusFilter === 'in_progress' && (evalResult.completed || evalResult.claimed)) {
          return false;
        }
        if (q) {
          const hay = `${mission.index} ${mission.title} ${mission.description} ${mission.actionHint}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rank = (r: typeof a) =>
          r.evalResult.completed && !r.evalResult.claimed
            ? 0
            : !r.evalResult.claimed
            ? 1
            : 2;
        const d = rank(a) - rank(b);
        return d !== 0 ? d : a.mission.index - b.mission.index;
      });
  }, [dailyMissionRows, missionCategoryFilter, missionStatusFilter, missionSearchQuery]);

  if (!currentAccount) return null;

  const myDreamPockets = dreamPockets.filter((p) => p.accountId === currentAccount.id);
  const myVault = safeVaultMap[currentAccount.id] || { lockedBalanceRupiah: 0 };
  const unlockedBal = getUnlockedAvailableBalance(currentAccount.id);
  const myLoyalty = ensureTodayLoyaltyAccountState(
    loyaltyMap[currentAccount.id] || {
      points: isAdminCard ? Number.MAX_SAFE_INTEGER : 0,
      streakDays: 0,
      claimedAchievementIds: [],
      totalCheckIns: 0,
      redeemedCount: 0,
      recoveryCards: isAdminCard ? Number.MAX_SAFE_INTEGER : 0,
      freezeStage: 0,
      frozenStreakDays: 0,
    },
    todayWib
  );
  const streakVisual = computeStreakVisualSnapshot(myLoyalty, normalizedLoyaltyConfig, todayWib);
  const myStatusesCount = chatStatuses.filter((s) => s.authorAccountId === currentAccount.id).length;

  const handleExportAnalyticsCsv = () => {
    const header = 'Tanggal,Judul,Tipe,Nominal,Status,Referensi\n';
    const rows = currentAccountTransactions
      .slice(0, 200)
      .map((tx) => {
        const safeTitle = `"${String(tx.title || '').replace(/"/g, '""')}"`;
        return `${tx.timestamp || tx.date || ''},${safeTitle},${tx.type},${tx.amount},${tx.status},${tx.referenceNo || ''}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analitik-Keuangan-${currentAccount.accountNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice({ success: true, message: 'Laporan analitik bulanan CSV berhasil diunduh!' });
  };

  const handleOpenScannedTransferPage = () => {
    if (!parsedScanTarget.recipientAccount) {
      showNotice({
        success: false,
        message: 'Tempel Link Transfer QRIS, kode BNUS-QRPAY, Rekening 10-digit, atau User ID 16-digit penerima terlebih dahulu.',
      });
      return;
    }
    window.dispatchEvent(
      new CustomEvent('bn:qris-transfer', {
        detail: {
          recipientAccount: parsedScanTarget.recipientAccount,
          recipientBank: parsedScanTarget.recipientBank || 'Bank Nusantara',
          recipientName: parsedScanTarget.recipientName || '',
          amount: effectiveScanAmount > 0 ? effectiveScanAmount : undefined,
          note: scanPayNote.trim() || parsedScanTarget.note || 'Transfer via Scan QRIS Pribadi',
        },
      })
    );
  };

  const handleScanQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAccount = parsedScanTarget.recipientAccount;
    const amountNum = effectiveScanAmount;

    if (!targetAccount || amountNum < 1000) {
      showNotice({
        success: false,
        message: 'Masukkan Link Transfer QRIS / Rekening / User ID 16-digit penerima dan nominal minimal Rp 1.000.',
      });
      return;
    }
    const res = transferMoney({
      recipientAccount: targetAccount,
      recipientBank: parsedScanTarget.recipientBank || 'Bank Nusantara',
      amount: amountNum,
      note: scanPayNote.trim() || parsedScanTarget.note || 'Pembayaran QRIS Rekening Pribadi',
      pin: scanPayPin,
    });
    showNotice(res);
    if (res.success) {
      setScanPayAmount('');
      setScanPayNote('');
      setScanPayPin('');
    }
  };

  const handleJumpToMissionActivity = (targetNavTab?: string) => {
    if (!targetNavTab) return;
    if (
      targetNavTab === 'kantong_impian' ||
      targetNavTab === 'qris_pribadi' ||
      targetNavTab === 'analitik' ||
      targetNavTab === 'brankas'
    ) {
      window.dispatchEvent(
        new CustomEvent('bn:navigate', {
          detail: { targetView: 'dashboard', targetDashboardTab: targetNavTab },
        })
      );
      return;
    }
    if (targetNavTab === 'mutasi' || targetNavTab === 'ringkasan') {
      window.dispatchEvent(
        new CustomEvent('bn:navigate', {
          detail: { targetView: 'dashboard', targetDashboardTab: targetNavTab },
        })
      );
      return;
    }
    window.dispatchEvent(
      new CustomEvent('bn:navigate', {
        detail: { targetView: targetNavTab },
      })
    );
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
              : 'border-rose-500/40 bg-rose-950/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ==================== 1. KANTONG IMPIAN BERBUNGA ==================== */}
      {activeTab === 'kantong_impian' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Buat Kantong Impian</h3>
                  <p className="text-[11px] text-slate-400">
                    Bunga tabungan {dreamPocketConfig.annualInterestPercent}% / tahun langsung masuk tiap setor
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DREAM_POCKET_PRESETS.map((preset, idx) => (
                <button
                  key={preset.category}
                  type="button"
                  onClick={() => setPocketPresetIdx(idx)}
                  className={`rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                    pocketPresetIdx === idx
                      ? 'border-emerald-400 bg-emerald-500/15 text-white font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="mr-1">{preset.emoji}</span>
                  <span>{preset.category}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Nama Target Impian</label>
                <input
                  type="text"
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  placeholder="Misal: Dana Umrah Keluarga / Laptop Baru"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Nominal (Rp)</label>
                  <input
                    type="number"
                    min={10000}
                    value={pocketTarget}
                    onChange={(e) => setPocketTarget(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white tabular-nums focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Tanggal (Opsional)</label>
                  <input
                    type="date"
                    value={pocketDeadline}
                    onChange={(e) => setPocketDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const p = DREAM_POCKET_PRESETS[pocketPresetIdx] || DREAM_POCKET_PRESETS[0];
                  const res = createDreamPocket({
                    name: pocketName,
                    emoji: p.emoji,
                    category: p.category,
                    targetAmount: Number(pocketTarget) || 1000000,
                    deadlineIso: pocketDeadline || undefined,
                    colorTheme: p.colorTheme,
                  });
                  showNotice(res);
                  if (res.success) setPocketName('');
                }}
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Kantong Impian</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-xs font-black text-white">Daftar Kantong Impian ({myDreamPockets.length})</p>
                <p className="text-[11px] text-slate-400">
                  Saldo bebas tersedia: <strong className="text-emerald-400 tabular-nums">{isAdminCard ? '∞ (Admin Tier)' : formatRupiah(unlockedBal)}</strong>
                </p>
              </div>
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                Bunga {dreamPocketConfig.annualInterestPercent}% p.a
              </span>
            </div>

            {myDreamPockets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
                <Target className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-300">Belum ada Kantong Impian</p>
                <p className="text-xs text-slate-500 mt-1">
                  Pisahkan dana liburan, dana darurat, atau target pembelian agar tidak tercampur saldo harian.
                </p>
              </div>
            ) : (
              myDreamPockets.map((pkt) => {
                const pct = Math.min(100, Math.round((pkt.currentAmount / Math.max(1, pkt.targetAmount)) * 100));
                const amtVal = Number(pocketAmounts[pkt.id] || '50000') || 50000;
                return (
                  <div key={pkt.id} className={`rounded-2xl border bg-gradient-to-br p-4 space-y-3 ${pkt.colorTheme}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">
                          {pkt.emoji} {pkt.name}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          {pkt.category} • Bunga terkumpul: <strong className="text-emerald-300 tabular-nums">{formatRupiah(pkt.interestEarnedTotal)}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => showNotice(deleteDreamPocket(pkt.id))}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                        title="Hapus Kantong (harus 0)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1 tabular-nums">
                        <span className="text-white">{formatRupiah(pkt.currentAmount)}</span>
                        <span className="text-slate-300">Target {formatRupiah(pkt.targetAmount)} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1000}
                        value={pocketAmounts[pkt.id] ?? '50000'}
                        onChange={(e) => setPocketAmounts((prev) => ({ ...prev, [pkt.id]: e.target.value }))}
                        className="w-32 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-white tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => showNotice(depositToDreamPocket(pkt.id, amtVal))}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        <span>Setor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showNotice(withdrawFromDreamPocket(pkt.id, amtVal))}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Cairkan</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. KOTAK SCAN & TERIMA QRIS REKENING PRIBADI ==================== */}
      {activeTab === 'qris_pribadi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Kartu QRIS Link Transfer Pribadi</h3>
                <p className="text-[11px] text-slate-400">
                  Saat di-scan nasabah lain, QRIS ini langsung mengarahkan ke link halaman Transfer Anda dengan rekening terisi otomatis
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-white p-5 flex flex-col items-center text-center space-y-3">
              <div className="text-slate-900">
                <p className="text-sm font-black">{currentAccount.fullName}</p>
                <p className="text-[11px] font-mono text-slate-600">
                  Rek: {currentAccount.accountNumber} · ID: {currentAccount.userId16 || '-'}
                </p>
              </div>
              {personalQrUrl && (
                <img
                  src={personalQrUrl}
                  alt="QRIS Link Transfer Pribadi"
                  className="h-52 w-52 rounded-xl border border-slate-200 p-2"
                />
              )}
              <div className="w-full max-w-xs space-y-2">
                <input
                  type="number"
                  min={0}
                  value={qrRequestAmount}
                  onChange={(e) => setQrRequestAmount(e.target.value)}
                  placeholder="Nominal tagihan opsional (Rp)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 text-center tabular-nums"
                />
                <input
                  type="text"
                  value={qrRequestNote}
                  onChange={(e) => setQrRequestNote(e.target.value)}
                  placeholder="Catatan tagihan opsional (mis. Patungan makan)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 text-center"
                />
              </div>
              <div className="w-full rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-left">
                <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700 flex items-center gap-1">
                  <Link2 className="h-3 w-3" /> Link Tujuan Scan QRIS
                </p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-700 break-all line-clamp-2">
                  {personalQrTransferLink}
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyValue(personalQrTransferLink, 'qr_payload')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  {copiedId === 'qr_payload' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedId === 'qr_payload' ? 'Link Disalin' : 'Salin Link Transfer QRIS'}</span>
                </button>
                {personalQrUrl && (
                  <a
                    href={personalQrUrl}
                    download={`QRIS-Transfer-${currentAccount.accountNumber}.png`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh QR</span>
                  </a>
                )}
              </div>
              <p className="text-[10px] text-slate-500">
                Pengirim akan diarahkan ke halaman Transfer resmi (Biaya Admin Wajib {MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%).
              </p>
            </div>
          </div>

          <form onSubmit={handleScanQrSubmit} className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ScanLine className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Scan / Tempel Link QRIS Pribadi</h3>
                <p className="text-[11px] text-slate-400">
                  Tempel Link Transfer QRIS hasil scan kamera, kode BNUS-QRPAY, No. Rekening 10-digit, atau User ID 16-digit
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Link Transfer QRIS / No. Rekening / User ID 16-digit
                </label>
                <input
                  type="text"
                  value={scanInputCode}
                  onChange={(e) => setScanInputCode(e.target.value)}
                  placeholder="https://.../?qris_transfer=1&to=... atau rekening/User ID"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </div>

              {parsedScanTarget.recipientAccount && (
                <div className="rounded-2xl border border-sky-500/40 bg-sky-950/40 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sky-300 font-bold">Penerima Terdeteksi</span>
                    <span className="text-[10px] font-mono text-sky-200 uppercase">
                      {parsedScanTarget.sourceKind === 'url' ? 'Link Transfer QRIS' : parsedScanTarget.sourceKind}
                    </span>
                  </div>
                  <p className="font-black text-white">
                    {parsedScanTarget.recipientName || 'Nasabah Bank Nusantara'}{' '}
                    <span className="font-mono text-amber-300">({parsedScanTarget.recipientAccount})</span>
                  </p>
                  {parsedScanTarget.amount > 0 && (
                    <p className="text-[11px] text-emerald-300">
                      Nominal dari QRIS: <strong className="tabular-nums">{formatRupiah(parsedScanTarget.amount)}</strong>
                    </p>
                  )}
                  {parsedScanTarget.note && (
                    <p className="text-[11px] text-slate-300">Catatan QRIS: {parsedScanTarget.note}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Nominal Transfer (Rp)</label>
                  <input
                    type="number"
                    min={1000}
                    value={scanPayAmount}
                    onChange={(e) => setScanPayAmount(e.target.value)}
                    placeholder={parsedScanTarget.amount > 0 ? String(parsedScanTarget.amount) : '50000'}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">PIN ATM (6 digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={scanPayPin}
                    onChange={(e) => setScanPayPin(e.target.value)}
                    placeholder="••••••"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={scanPayNote}
                  onChange={(e) => setScanPayNote(e.target.value)}
                  placeholder={parsedScanTarget.note || 'Bayar kopi / patungan makan'}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              {effectiveScanAmount > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-2.5 text-[11px] space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Nominal Kirim</span>
                    <span className="font-mono font-bold text-white tabular-nums">{formatRupiah(effectiveScanAmount)}</span>
                  </div>
                  <div className="flex justify-between text-amber-300">
                    <span>Biaya Admin Wajib ({MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%)</span>
                    <span className="font-mono font-bold tabular-nums">{formatRupiah(effectiveScanFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-amber-500/20 pt-1 text-emerald-300 font-black">
                    <span>Total Dipotong</span>
                    <span className="font-mono tabular-nums">{formatRupiah(effectiveScanAmount + effectiveScanFee)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenScannedTransferPage}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-500 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Lanjut ke Halaman Transfer</span>
                </button>
                <button
                  type="submit"
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black text-white hover:bg-sky-500 cursor-pointer"
                >
                  <ScanLine className="h-4 w-4" />
                  <span>Bayar Instan (+{MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}% Admin)</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================== 3. ANALITIK KEUANGAN BULANAN & EKSPOR ==================== */}
      {activeTab === 'analitik' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-[11px] font-bold text-slate-400">Pemasukan Bulan Ini</p>
              <p className="mt-1 text-xl font-black text-emerald-400 tabular-nums">{formatRupiah(analytics.curMonth.income)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-[11px] font-bold text-slate-400">Pengeluaran Bulan Ini</p>
              <p className="mt-1 text-xl font-black text-rose-400 tabular-nums">{formatRupiah(analytics.curMonth.expense)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-[11px] font-bold text-slate-400">Rasio Tabungan Sehat</p>
              <p className="mt-1 text-xl font-black text-cyan-400 tabular-nums">{analytics.savingsRatio}%</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Grafik Arus Kas 6 Bulan Terakhir</h3>
                  <p className="text-[11px] text-slate-400">Perbandingan Pemasukan (Hijau) vs Pengeluaran (Merah)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAnalyticsCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 border-b border-slate-800 pb-2">
              {analytics.months.map((m) => {
                const incH = Math.max(4, Math.round((m.income / analytics.maxBar) * 100));
                const expH = Math.max(4, Math.round((m.expense / analytics.maxBar) * 100));
                return (
                  <div key={m.key} className="flex flex-col items-center justify-end h-full gap-1.5">
                    <div className="flex items-end gap-1.5 h-32 w-full justify-center">
                      <div
                        className="w-3.5 sm:w-5 rounded-t-lg bg-emerald-500/85 transition-all"
                        style={{ height: `${incH}%` }}
                        title={`Masuk: ${formatRupiah(m.income)}`}
                      />
                      <div
                        className="w-3.5 sm:w-5 rounded-t-lg bg-rose-500/85 transition-all"
                        style={{ height: `${expH}%` }}
                        title={`Keluar: ${formatRupiah(m.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{m.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(analytics.categoryTotals).map(([cat, total]) => (
                <div key={cat} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] font-bold text-slate-400">{cat}</p>
                  <p className="mt-0.5 text-xs font-black text-white tabular-nums">{formatRupiah(total)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. AUTO-STREAK ONLINE, KARTU PEMULIHAN, POIN LOYALTY & 100 MISI HARIAN NYATA ==================== */}
      {activeTab === 'loyalty' && (() => {
        const redeemPts = Math.max(50, Math.round(Number(redeemPointsInput) || 200));
        const estCash = redeemPts * (normalizedLoyaltyConfig.rupiahPerPoint || 500);
        const estCoin = Math.max(
          1,
          Math.floor((redeemPts / 100) * (normalizedLoyaltyConfig.coinPer100Points || 15))
        );
        const estVoucher = Math.floor(
          redeemPts / Math.max(50, normalizedLoyaltyConfig.pointsPerLevelVoucher || 200)
        );
        const recPrice = normalizedLoyaltyConfig.recoveryCardDiamondPrice || 25;
        const recoveryStock = isAdminCard ? Number.MAX_SAFE_INTEGER : myLoyalty.recoveryCards || 0;
        const isFrozen3 = streakVisual.stage === 3;
        const isFrozen2 = streakVisual.stage === 2;
        const isFrozen1 = streakVisual.stage === 1;

        const streakCardClass = isFrozen3
          ? 'border-cyan-400/70 bg-gradient-to-br from-slate-950 via-cyan-950/70 to-sky-950/80'
          : isFrozen2
          ? 'border-sky-400/60 bg-gradient-to-br from-slate-950 via-sky-950/60 to-indigo-950/60'
          : isFrozen1
          ? 'border-cyan-500/40 bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-900'
          : 'border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-slate-950';

        const visibleRows = filteredMissionRows.slice(0, missionVisibleLimit);

        return (
          <div className="space-y-5">
            {/* TOP ROW: AUTO-STREAK + RECOVERY CARD + POINT REDEMPTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT 5 COLS: Auto-Streak, Freeze 3-Stage, Recovery Card & Icon+Name Redemption */}
              <div className="lg:col-span-5 space-y-4">
                {/* Auto-Streak & Freeze Status Card */}
                <div className={`rounded-3xl border p-5 space-y-4 ${streakCardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                          isFrozen3
                            ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-200'
                            : isFrozen2 || isFrozen1
                            ? 'border-sky-400/50 bg-sky-500/20 text-sky-300'
                            : 'border-orange-400/50 bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        {isFrozen3 || isFrozen2 || isFrozen1 ? (
                          <Snowflake className="h-6 w-6" />
                        ) : (
                          <Flame className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                            isFrozen3
                              ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-300/40'
                              : isFrozen2 || isFrozen1
                              ? 'bg-sky-400/20 text-sky-200 border border-sky-300/40'
                              : 'bg-orange-400/20 text-orange-200 border border-orange-300/40'
                          }`}
                        >
                          {streakVisual.badgeText}
                        </span>
                        <h3 className="mt-1 text-base font-black text-white">
                          {streakVisual.headline}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {streakVisual.description}
                  </p>

                  {/* Stats Pair */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-amber-500/30 bg-slate-950/75 p-3.5">
                      <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" /> Total Poin Loyalty
                      </p>
                      <p className="mt-1 text-xl font-black text-white tabular-nums">
                        {isAdminCard ? '∞ (Admin)' : myLoyalty.points.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-500/30 bg-slate-950/75 p-3.5">
                      <p className="text-[11px] text-orange-300 font-bold flex items-center gap-1">
                        {isFrozen3 || isFrozen2 || isFrozen1 ? (
                          <Snowflake className="h-3.5 w-3.5 text-cyan-300" />
                        ) : (
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                        )}
                        <span>{isFrozen3 ? 'Streak Membeku' : 'Streak Online'}</span>
                      </p>
                      <p className="mt-1 text-xl font-black text-white tabular-nums">
                        {streakVisual.activeStreak} Hari
                      </p>
                    </div>
                  </div>

                  {/* 4-Stage Freeze Rule Indicator */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    <div
                      className={`rounded-xl border p-2 ${
                        streakVisual.stage === 0
                          ? 'border-orange-400 bg-orange-500/20 text-orange-200 font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <Flame className="h-3.5 w-3.5 mx-auto mb-0.5 text-orange-400" />
                      <div>Online</div>
                      <div className="text-[9px] opacity-80">Auto-Isi</div>
                    </div>
                    <div
                      className={`rounded-xl border p-2 ${
                        isFrozen1
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <Snowflake className="h-3.5 w-3.5 mx-auto mb-0.5 text-cyan-300" />
                      <div>Off {normalizedLoyaltyConfig.freezeStage1Days} Hr</div>
                      <div className="text-[9px] opacity-80">Mulai Beku</div>
                    </div>
                    <div
                      className={`rounded-xl border p-2 ${
                        isFrozen2
                          ? 'border-sky-400 bg-sky-500/25 text-sky-100 font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <Snowflake className="h-3.5 w-3.5 mx-auto mb-0.5 text-sky-300" />
                      <div>Off {normalizedLoyaltyConfig.freezeStage2Days} Hr</div>
                      <div className="text-[9px] opacity-80">Makin Beku</div>
                    </div>
                    <div
                      className={`rounded-xl border p-2 ${
                        isFrozen3
                          ? 'border-cyan-300 bg-cyan-400/25 text-white font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mx-auto mb-0.5 text-cyan-200" />
                      <div>Off {normalizedLoyaltyConfig.freezeRecoveryRequiredDays} Hr</div>
                      <div className="text-[9px] opacity-80">Pulihkan</div>
                    </div>
                  </div>

                  {/* Stage 3 Recovery Actions */}
                  {isFrozen3 && (
                    <div className="rounded-2xl border border-cyan-300/50 bg-slate-950/85 p-3.5 space-y-2.5">
                      <p className="text-xs font-black text-cyan-200">
                        Selamatkan Streak {streakVisual.recoverableStreak} Hari Anda Sekarang!
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {(isAdminCard || recoveryStock > 0) ? (
                          <button
                            type="button"
                            onClick={() => showNotice(useStreakRecoveryCard())}
                            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-cyan-300 hover:to-sky-400 cursor-pointer"
                          >
                            <Flame className="h-4 w-4" />
                            <span>
                              Gunakan 1 Kartu Pemulihan ({isAdminCard ? 'Stok ∞' : `Sisa ${recoveryStock}`})
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const buyRes = buyStreakRecoveryCard(1);
                              if (!buyRes.success) {
                                showNotice(buyRes);
                                return;
                              }
                              const useRes = useStreakRecoveryCard();
                              showNotice(useRes);
                            }}
                            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:opacity-95 cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Beli &amp; Pakai Kartu Pemulihan ({recPrice} Diamond)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => showNotice(forfeitFrozenStreak())}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-rose-300 hover:border-rose-500/40 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Biarkan Reset ke 0 &amp; Mulai Baru</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recovery Card Stock & Buy Anytime Widget */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-black text-white flex items-center gap-1.5">
                          <Snowflake className="h-4 w-4 text-cyan-400" />
                          <span>Kartu Pemulihan Streak</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Beli cadangan kapan saja •{' '}
                          <span className="text-sky-300 font-bold">
                            <DiamondText text={`${recPrice} Diamond`} iconClassName="w-3 h-3" /> / kartu
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Stok Anda</span>
                        <span className="text-sm font-black text-cyan-300 tabular-nums">
                          {isAdminCard ? '∞ (Admin)' : `${recoveryStock} Kartu`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 3, 5].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setRecoveryBuyQty(q)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                              recoveryBuyQty === q
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {q}x
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => showNotice(buyStreakRecoveryCard(recoveryBuyQty))}
                        className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2 text-xs font-black text-white cursor-pointer"
                      >
                        Beli {recoveryBuyQty} Kartu ({(recoveryBuyQty * recPrice).toLocaleString('id-ID')} Diamond)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Point Redemption Card — ICON + NAME (TANPA DIAMOND!) */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-3.5">
                  <div>
                    <p className="text-sm font-black text-white flex items-center gap-2">
                      <Gift className="h-4 w-4 text-emerald-400" />
                      <span>Tukar Poin Loyalty ke Hadiah</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Pilih tujuan penukaran di bawah ini (Penukaran ke Diamond tidak tersedia)
                    </p>
                  </div>

                  {isAdminCard && (
                    <p className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2">
                      Kartu Tier Admin: Poin Loyalty &amp; Kartu Pemulihan bernilai ∞ selamanya dan tidak pernah berkurang saat ditukar.
                    </p>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Jumlah Poin Ditukar (min. 50)</span>
                      <div className="flex gap-1">
                        {[100, 200, 500, 1000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setRedeemPointsInput(String(preset))}
                            className="rounded-md border border-slate-700 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:border-amber-400 hover:text-amber-300 cursor-pointer"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="number"
                      min={50}
                      step={50}
                      value={redeemPointsInput}
                      onChange={(e) => setRedeemPointsInput(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm font-black text-white tabular-nums"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <button
                      type="button"
                      onClick={() => showNotice(redeemLoyaltyPoints(redeemPts, 'cash'))}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-500/40 bg-emerald-600/20 hover:bg-emerald-600/30 px-3 py-3 text-center transition cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
                        <Banknote className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-white">Saldo Tunai</span>
                      <span className="text-[10px] font-bold text-emerald-300 tabular-nums">
                        +{formatRupiah(estCash)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showNotice(redeemLoyaltyPoints(redeemPts, 'coin'))}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-amber-500/40 bg-amber-600/20 hover:bg-amber-600/30 px-3 py-3 text-center transition cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                        <Coins className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-white">Coin</span>
                      <span className="text-[10px] font-bold text-amber-300 tabular-nums">
                        +{estCoin.toLocaleString('id-ID')} Coin
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => showNotice(redeemLoyaltyPoints(redeemPts, 'voucher'))}
                      className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-violet-500/40 bg-violet-600/20 hover:bg-violet-600/30 px-3 py-3 text-center transition cursor-pointer"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-black text-white">Voucher Naik Level</span>
                      <span className="text-[10px] font-bold text-violet-300 tabular-nums">
                        +{estVoucher} Voucher
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT 7 COLS: 100 MISI AKTIF HARIAN NYATA + PENCAPAIAN UTAMA */}
              <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                {/* Header & Subview Switch */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white">
                        100 Misi Aktif Harian Poin Loyalty
                      </h3>
                      <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-300 tabular-nums">
                        {missionSummary.claimed}/{missionSummary.total} Diklaim
                      </span>
                      {missionSummary.ready > 0 && (
                        <span className="rounded-md bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black text-amber-300 tabular-nums">
                          {missionSummary.ready} Siap Klaim!
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold">
                        <Clock className="h-3 w-3" /> {getWibResetCountdownText()}
                      </span>
                      <span>• Wajib kerjakan aktivitas nyata baru hari ini (termasuk Tier Admin)</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLoyaltySubView('daily_100')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black cursor-pointer ${
                        loyaltySubView === 'daily_100'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Misi Harian ({missionSummary.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoyaltySubView('milestones')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black cursor-pointer ${
                        loyaltySubView === 'milestones'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Pencapaian ({myLoyalty.claimedAchievementIds.length}/{DAILY_ACHIEVEMENT_CATALOG.length})
                    </button>
                  </div>
                </div>

                {loyaltySubView === 'daily_100' ? (
                  <>
                    {/* Claim All Ready Banner */}
                    {missionSummary.ready > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                        <div className="text-xs text-amber-200 font-bold">
                          Ada <strong>{missionSummary.ready} misi nyata</strong> yang sudah selesai dan siap diklaim poinnya!
                        </div>
                        <button
                          type="button"
                          onClick={() => showNotice(claimAllReadyLoyaltyMissions())}
                          className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2 text-xs font-black text-slate-950 cursor-pointer"
                        >
                          Klaim Semua ({missionSummary.ready})
                        </button>
                      </div>
                    )}

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMissionCategoryFilter('all');
                          setMissionVisibleLimit(20);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-[11px] font-bold cursor-pointer transition ${
                          missionCategoryFilter === 'all'
                            ? 'bg-white text-slate-950'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        Semua ({missionSummary.total})
                      </button>
                      {(Object.keys(LOYALTY_MISSION_CATEGORY_META) as LoyaltyDailyMissionCategory[]).map(
                        (catKey) => {
                          const meta = LOYALTY_MISSION_CATEGORY_META[catKey];
                          const countInCat = dailyMissionRows.filter(
                            (r) => r.mission.category === catKey
                          ).length;
                          return (
                            <button
                              key={catKey}
                              type="button"
                              onClick={() => {
                                setMissionCategoryFilter(catKey);
                                setMissionVisibleLimit(20);
                              }}
                              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold cursor-pointer transition ${
                                missionCategoryFilter === catKey
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {meta.shortLabel} ({countInCat})
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Search & Status Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={missionSearchQuery}
                          onChange={(e) => setMissionSearchQuery(e.target.value)}
                          placeholder="Cari dari 100 misi harian..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 text-[11px] font-bold">
                        {(
                          [
                            ['all', 'Semua'],
                            ['ready', `Siap (${missionSummary.ready})`],
                            ['in_progress', 'Berjalan'],
                            ['claimed', `Selesai (${missionSummary.claimed})`],
                          ] as const
                        ).map(([stKey, label]) => (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => setMissionStatusFilter(stKey)}
                            className={`rounded-lg px-2.5 py-1 cursor-pointer transition ${
                              missionStatusFilter === stKey
                                ? 'bg-slate-800 text-amber-300'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mission Cards List */}
                    <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                      {visibleRows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
                          Tidak ada misi yang cocok dengan filter atau kata kunci pencarian.
                        </div>
                      ) : (
                        visibleRows.map(({ mission, evalResult }) => {
                          const catMeta = LOYALTY_MISSION_CATEGORY_META[mission.category];
                          const isReady = evalResult.completed && !evalResult.claimed;
                          return (
                            <div
                              key={mission.id}
                              className={`rounded-2xl border p-3.5 space-y-2.5 transition ${
                                isReady
                                  ? 'border-amber-400/50 bg-amber-950/20'
                                  : evalResult.claimed
                                  ? 'border-emerald-500/25 bg-emerald-950/10 opacity-85'
                                  : 'border-slate-800 bg-slate-950/75'
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-0.5 flex-1 min-w-[200px]">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-bold text-slate-500">
                                      #{String(mission.index).padStart(3, '0')}
                                    </span>
                                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                                      {catMeta.shortLabel}
                                    </span>
                                    <span className="text-xs font-black text-white">
                                      {mission.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {mission.description}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {evalResult.claimed ? (
                                    <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-3 py-1.5 text-[11px] font-black text-emerald-300">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Sudah Diklaim</span>
                                    </span>
                                  ) : isReady ? (
                                    <button
                                      type="button"
                                      onClick={() => showNotice(claimDailyLoyaltyMission(mission.id))}
                                      className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
                                    >
                                      Klaim +{mission.rewardPoints} Poin
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleJumpToMissionActivity(mission.targetNavTab)}
                                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 hover:border-sky-400 hover:text-sky-300 px-3 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                                    >
                                      <span>Kerjakan</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Real Activity Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-slate-400 tabular-nums">
                                    Progres Nyata:{' '}
                                    <strong className="text-white">
                                      {mission.metricKey === 'transfer_amount'
                                        ? `${formatRupiah(evalResult.current)} / ${formatRupiah(evalResult.target)}`
                                        : `${evalResult.current.toLocaleString('id-ID')} / ${evalResult.target.toLocaleString('id-ID')} ${mission.unitLabel}`}
                                    </strong>
                                  </span>
                                  <span className="text-amber-300 tabular-nums">
                                    Hadiah +{mission.rewardPoints} Poin ({evalResult.progressPercent}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      evalResult.claimed
                                        ? 'bg-emerald-400'
                                        : isReady
                                        ? 'bg-amber-400'
                                        : 'bg-sky-400'
                                    }`}
                                    style={{ width: `${evalResult.progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Show More / Show All 100 */}
                    {filteredMissionRows.length > missionVisibleLimit && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setMissionVisibleLimit((n) => n + 25)}
                          className="rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 cursor-pointer"
                        >
                          Muat 25 Misi Lagi ({filteredMissionRows.length - missionVisibleLimit} tersisa)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMissionVisibleLimit(filteredMissionRows.length)}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-amber-300 cursor-pointer"
                        >
                          Tampilkan Semua ({filteredMissionRows.length})
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2.5">
                    {DAILY_ACHIEVEMENT_CATALOG.map((ach) => {
                      const claimed = myLoyalty.claimedAchievementIds.includes(ach.id);
                      const eligible = ach.check({
                        txCount: currentAccountTransactions.length,
                        dreamPocketCount: myDreamPockets.length,
                        loyaltyStreak: myLoyalty.streakDays,
                        goldGrams: currentAccount.goldGrams || 0,
                        statusesPosted: myStatusesCount,
                      });
                      return (
                        <div
                          key={ach.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5"
                        >
                          <div>
                            <p className="text-xs font-black text-white">{ach.title}</p>
                            <p className="text-[11px] text-slate-400">{ach.description}</p>
                          </div>
                          <button
                            type="button"
                            disabled={claimed || !eligible}
                            onClick={() => showNotice(claimAchievementReward(ach.id))}
                            className={`rounded-xl px-3.5 py-2 text-xs font-black transition ${
                              claimed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 cursor-default'
                                : eligible
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {claimed
                              ? 'Sudah Diklaim'
                              : eligible
                              ? `Klaim +${ach.rewardPoints} Poin`
                              : 'Belum Memenuhi'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ==================== 5. BRANKAS PENGAMAN & FREEZE KARTU ==================== */}
      {activeTab === 'brankas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Brankas Pengaman Kunci Saldo</h3>
                <p className="text-[11px] text-slate-400">
                  Dana di Brankas terkunci aman dari transfer keluar & pembayaran sampai Anda membukanya
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3.5">
                <p className="text-[11px] text-indigo-300 font-bold">Saldo Terkunci</p>
                <p className="mt-1 text-lg font-black text-white tabular-nums">
                  {formatRupiah(myVault.lockedBalanceRupiah)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5">
                <p className="text-[11px] text-emerald-300 font-bold">Saldo Bebas Transfer</p>
                <p className="mt-1 text-lg font-black text-white tabular-nums">
                  {isAdminCard ? '∞ (Admin)' : formatRupiah(unlockedBal)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1000}
                  value={vaultAmount}
                  onChange={(e) => setVaultAmount(e.target.value)}
                  placeholder="Nominal (Rp)"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white tabular-nums"
                />
                <input
                  type="password"
                  maxLength={6}
                  value={vaultPin}
                  onChange={(e) => setVaultPin(e.target.value)}
                  placeholder="PIN 6 digit"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => showNotice(lockBalanceToSafeVault(Number(vaultAmount) || 0, vaultPin))}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-500"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Kunci Saldo</span>
                </button>
                <button
                  type="button"
                  onClick={() => showNotice(unlockBalanceFromSafeVault(Number(vaultAmount) || 0, vaultPin))}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-700"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Buka Kunci</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Kunci Darurat Kartu ATM (Freeze / Unfreeze)</h3>
                <p className="text-[11px] text-slate-400">
                  Bekukan kartu seketika bila perangkat hilang atau mencurigakan
                </p>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                currentAccount.cardStatus === 'frozen'
                  ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200'
                  : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
              }`}
            >
              <p className="text-xs font-black uppercase">
                Status Kartu Saat Ini: {currentAccount.cardStatus === 'frozen' ? 'DIBEKUKAN (FROZEN)' : 'AKTIF NORMAL'}
              </p>
              <p className="mt-1 text-[11px] opacity-85">
                {currentAccount.cardStatus === 'frozen'
                  ? 'Semua transaksi keluar & tarik tunai diblokir sementara.'
                  : 'Kartu Anda aktif dan siap bertransaksi dengan perlindungan Brankas.'}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                maxLength={6}
                value={freezePin}
                onChange={(e) => setFreezePin(e.target.value)}
                placeholder="Masukkan PIN ATM 6 digit untuk Freeze / Buka Blokir"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const res = toggleCardFreezeWithPin(currentAccount.id, freezePin);
                  showNotice(res);
                  if (res.success) setFreezePin('');
                }}
                className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white ${
                  currentAccount.cardStatus === 'frozen'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>
                  {currentAccount.cardStatus === 'frozen' ? 'Buka Blokir Kartu ATM Sekarang' : 'Bekukan (Freeze) Kartu ATM Sekarang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
