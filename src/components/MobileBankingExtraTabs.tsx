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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import {
  DAILY_ACHIEVEMENT_CATALOG,
  DREAM_POCKET_PRESETS,
} from '../data/socialAndBankingExtrasCatalog';
import { DiamondText } from './DiamondIcon';

export type MobileBankingExtraTabKey =
  | 'kantong_impian'
  | 'qris_pribadi'
  | 'analitik'
  | 'loyalty'
  | 'brankas';

interface MobileBankingExtraTabsProps {
  activeTab: MobileBankingExtraTabKey;
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
    claimDailyCheckIn,
    claimAchievementReward,
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanInputCode, setScanInputCode] = useState('');
  const [scanPayAmount, setScanPayAmount] = useState('');
  const [scanPayNote, setScanPayNote] = useState('');
  const [scanPayPin, setScanPayPin] = useState('');

  // State: Brankas & Freeze Kartu
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultPin, setVaultPin] = useState('');
  const [freezePin, setFreezePin] = useState('');

  // State: Loyalty
  const [redeemPointsInput, setRedeemPointsInput] = useState('100');

  const isAdminCard = Boolean(
    currentAccount && (currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance))
  );

  const personalQrPayload = useMemo(() => {
    if (!currentAccount) return '';
    const amt = Math.max(0, Math.round(Number(qrRequestAmount) || 0));
    return `BNUS-QRPAY|ACC:${currentAccount.accountNumber}|UID:${currentAccount.userId16 || currentAccount.accountNumber}|NAME:${currentAccount.fullName}|AMT:${amt}`;
  }, [currentAccount, qrRequestAmount]);

  useEffect(() => {
    if (activeTab !== 'qris_pribadi' || !personalQrPayload) return;
    let mounted = true;
    void QRCode.toDataURL(personalQrPayload, {
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
  }, [activeTab, personalQrPayload]);

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
      const isIncoming =
        tx.type === 'setor' ||
        tx.type === 'gaji_kerja' ||
        tx.type === 'bunga_deposito' ||
        tx.type === 'terima_transfer' ||
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

  if (!currentAccount) return null;

  const myDreamPockets = dreamPockets.filter((p) => p.accountId === currentAccount.id);
  const myVault = safeVaultMap[currentAccount.id] || { lockedBalanceRupiah: 0 };
  const unlockedBal = getUnlockedAvailableBalance(currentAccount.id);
  const myLoyalty = loyaltyMap[currentAccount.id] || {
    points: isAdminCard ? Number.MAX_SAFE_INTEGER : 0,
    streakDays: 0,
    claimedAchievementIds: [],
    totalCheckIns: 0,
    redeemedCount: 0,
  };
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

  const handleScanQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let targetAccount = scanInputCode.trim();
    let amountNum = Math.round(Number(scanPayAmount) || 0);
    if (targetAccount.startsWith('BNUS-QRPAY|')) {
      const parts = Object.fromEntries(
        targetAccount
          .split('|')
          .slice(1)
          .map((seg) => {
            const idx = seg.indexOf(':');
            return idx > 0 ? [seg.slice(0, idx), seg.slice(idx + 1)] : [seg, ''];
          })
      );
      if (parts.ACC) targetAccount = parts.ACC;
      if (!amountNum && Number(parts.AMT) > 0) amountNum = Number(parts.AMT);
    } else if (/^\d{16}$/.test(targetAccount.replace(/\s+/g, ''))) {
      const cleanUid = targetAccount.replace(/\s+/g, '');
      const matched = accounts.find((a) => a.userId16 === cleanUid);
      if (matched) targetAccount = matched.accountNumber;
    }

    if (!targetAccount || amountNum < 1000) {
      showNotice({ type: 'error', success: false, message: 'Masukkan Rekening/User ID 16-digit atau kode QR BNUS-QRPAY dan nominal minimal Rp 1.000.' } as any);
      return;
    }
    const res = transferMoney({
      recipientAccount: targetAccount,
      recipientBank: 'Bank Nusantara',
      amount: amountNum,
      note: scanPayNote.trim() || 'Pembayaran QRIS Rekening Pribadi',
      pin: scanPayPin,
    });
    showNotice(res);
    if (res.success) {
      setScanPayAmount('');
      setScanPayNote('');
      setScanPayPin('');
    }
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
                <h3 className="text-sm font-black text-white">Kartu QRIS Terima Dana Pribadi</h3>
                <p className="text-[11px] text-slate-400">
                  Bagikan kode QR ini ke sesama nasabah untuk menerima transfer cepat
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
                  alt="QRIS Rekening Pribadi"
                  className="h-52 w-52 rounded-xl border border-slate-200 p-2"
                />
              )}
              <div className="w-full max-w-xs">
                <input
                  type="number"
                  min={0}
                  value={qrRequestAmount}
                  onChange={(e) => setQrRequestAmount(e.target.value)}
                  placeholder="Nominal tagihan opsional (Rp)..."
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 text-center tabular-nums"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyValue(personalQrPayload, 'qr_payload')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white"
                >
                  {copiedId === 'qr_payload' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>Salin Kode QR</span>
                </button>
                {personalQrUrl && (
                  <a
                    href={personalQrUrl}
                    download={`QRIS-${currentAccount.accountNumber}.png`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-3 py-2 text-xs font-bold text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Unduh QR</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleScanQrSubmit} className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ScanLine className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Bayar via Kode QR / User ID</h3>
                <p className="text-[11px] text-slate-400">
                  Tempel kode BNUS-QRPAY, Nomor Rekening 10-digit, atau User ID 16-digit penerima
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Kode QR / No. Rekening / User ID 16-digit</label>
                <input
                  type="text"
                  value={scanInputCode}
                  onChange={(e) => setScanInputCode(e.target.value)}
                  placeholder="Tempel BNUS-QRPAY|... atau ketik rekening/User ID"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Nominal Bayar (Rp)</label>
                  <input
                    type="number"
                    min={1000}
                    value={scanPayAmount}
                    onChange={(e) => setScanPayAmount(e.target.value)}
                    placeholder="50000"
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
                  placeholder="Bayar kopi / patungan makan"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black text-white hover:bg-sky-500"
              >
                <ScanLine className="h-4 w-4" />
                <span>Bayar QRIS Rekening Instan</span>
              </button>
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

      {/* ==================== 4. PENCAPAIAN HARIAN, STREAK & POIN LOYALTY ==================== */}
      {activeTab === 'loyalty' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  <Trophy className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Poin Loyalty & Streak Login</h3>
                  <p className="text-[11px] text-slate-400">
                    Check-in harian untuk bonus streak 7 hari (+{loyaltyConfig.streakBonus7DaysPoints} poin)
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-3.5">
                <p className="text-[11px] text-amber-300 font-bold">Total Poin Loyalty</p>
                <p className="mt-1 text-2xl font-black text-white tabular-nums">
                  {isAdminCard ? '∞ (Admin)' : myLoyalty.points.toLocaleString('id-ID')}
                </p>
              </div>
              <div className="rounded-2xl border border-orange-500/30 bg-orange-950/30 p-3.5">
                <p className="text-[11px] text-orange-300 font-bold flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5" /> Streak Harian
                </p>
                <p className="mt-1 text-2xl font-black text-white tabular-nums">{myLoyalty.streakDays} Hari</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => showNotice(claimDailyCheckIn())}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg hover:from-amber-400 hover:to-orange-400"
            >
              <Sparkles className="h-4 w-4" />
              <span>Klaim Check-In Harian (+{loyaltyConfig.dailyCheckInPoints} Poin)</span>
            </button>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
              <p className="text-xs font-black text-white flex items-center gap-1.5">
                <Gift className="h-4 w-4 text-emerald-400" />
                Tukar Poin ke Hadiah Instan
              </p>
              <input
                type="number"
                min={50}
                step={50}
                value={redeemPointsInput}
                onChange={(e) => setRedeemPointsInput(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white tabular-nums"
              />
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => showNotice(redeemLoyaltyPoints(Number(redeemPointsInput) || 100, 'cash'))}
                  className="rounded-xl bg-emerald-600/90 px-2.5 py-2 text-[11px] font-bold text-white hover:bg-emerald-500"
                >
                  Saldo Tunai
                </button>
                <button
                  type="button"
                  onClick={() => showNotice(redeemLoyaltyPoints(Number(redeemPointsInput) || 100, 'coin'))}
                  className="rounded-xl bg-amber-600/90 px-2.5 py-2 text-[11px] font-bold text-white hover:bg-amber-500 inline-flex items-center justify-center gap-1"
                >
                  <Coins className="h-3 w-3" /> Coin
                </button>
                <button
                  type="button"
                  onClick={() => showNotice(redeemLoyaltyPoints(Number(redeemPointsInput) || 100, 'diamond'))}
                  className="rounded-xl bg-sky-600/90 px-2.5 py-2 text-[11px] font-bold text-white hover:bg-sky-500"
                >
                  <DiamondText text="💎 Diamond" iconClassName="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-3">
            <h3 className="text-sm font-black text-white">Pencapaian Aktif ({myLoyalty.claimedAchievementIds.length}/{DAILY_ACHIEVEMENT_CATALOG.length})</h3>
            <div className="space-y-2.5">
              {DAILY_ACHIEVEMENT_CATALOG.map((ach) => {
                const claimed = myLoyalty.claimedAchievementIds.includes(ach.id);
                const eligible =
                  isAdminCard ||
                  ach.check({
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
                          ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {claimed ? 'Sudah Diklaim' : eligible ? `Klaim +${ach.rewardPoints} Poin` : 'Belum Memenuhi'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
