/**
 * Bank Nusantara — Halaman Khusus Tab Kode Redeem
 * Ditempatkan di Navbar utama tepat di sebelah tab "Anggaran".
 * Fitur:
 * - Form Tukar Kode rahasia (daftar kode aktif tidak pernah dibocorkan ke nasabah)
 * - Dukungan otorisasi PIN Admin otomatis jika kode diproteksi PIN
 * - Kartu Struk Hadiah, Saldo Terbaru, rincian seluruh hadiah (termasuk Hadiah Trial & Gacha), serta Animasi Perayaan Konfeti
 * - Riwayat Klaim Saya (berdasarkan akun aktif) & Panduan Klaim lengkap
 */
import React, { useMemo, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Gift,
  Ticket,
  History,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Lock,
  Clock,
  ArrowRight,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AdminPinModal } from './AdminPinModal';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import { sanitizeRedeemCodesList, summarizeRedeemCodeRewards } from '../utils/redeemSanitizer';
import { formatTrialDurationLabel } from '../data/giftRewardsCatalog';
import { GachaClaimedItemResult } from '../types/bank';

interface RedeemCodeViewProps {
  onNavigateToDashboard?: () => void;
  onNavigateToMutasi?: () => void;
}

interface RedeemReceiptData {
  code: string;
  redeemTitle: string;
  referenceNo: string;
  claimedAt: string;
  rewardAmount: number;
  newBalance: number;
  rewardsGranted: string[];
  activeTrialsGranted: {
    label: string;
    emoji: string;
    expiresAt: string;
    durationMinutes: number;
  }[];
  gachaResults?: GachaClaimedItemResult[];
}

export const RedeemCodeView: React.FC<RedeemCodeViewProps> = ({
  onNavigateToDashboard,
  onNavigateToMutasi,
}) => {
  const { currentAccount, redeemCodes, transactions, claimRedeemCode } = useBank();

  const [codeInput, setCodeInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<RedeemReceiptData | null>(null);
  const [rightTab, setRightTab] = useState<'riwayat' | 'panduan'>('riwayat');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [pendingAdminPinCode, setPendingAdminPinCode] = useState<{
    code: string;
    title: string;
  } | null>(null);

  const safeCodes = useMemo(() => sanitizeRedeemCodesList(redeemCodes), [redeemCodes]);

  // Gabungkan riwayat klaim akun aktif dari redeemCodes + mutasi transaksi tipe redeem_code
  const myClaimHistory = useMemo(() => {
    if (!currentAccount) return [];
    const seenKeys = new Set<string>();
    const items: Array<{
      id: string;
      code: string;
      title: string;
      claimedAt: string;
      referenceNo: string;
      rewardsGranted: string[];
      summaryText: string;
    }> = [];

    for (const rdm of safeCodes) {
      const myClaims = (rdm.claimedBy || []).filter((c) => c.accountId === currentAccount.id);
      for (const claim of myClaims) {
        const key = claim.referenceNo || `${rdm.code}-${claim.claimedAt}`;
        if (seenKeys.has(key)) continue;
        seenKeys.add(key);
        items.push({
          id: `${rdm.id}-${claim.claimedAt}`,
          code: rdm.code,
          title: rdm.title,
          claimedAt: claim.claimedAt,
          referenceNo: claim.referenceNo || '-',
          rewardsGranted: claim.rewardsGranted || [],
          summaryText: claim.rewardSummary || summarizeRedeemCodeRewards(rdm),
        });
      }
    }

    // Tambahkan riwayat dari mutasi jika kode sudah pernah dihapus Admin
    for (const tx of transactions || []) {
      if (tx.accountId !== currentAccount.id || tx.type !== 'redeem_code') continue;
      if (tx.referenceNo && seenKeys.has(tx.referenceNo)) continue;
      const codeMatch = String(tx.title || '').match(/Klaim Kode Redeem:\s*([A-Z0-9_-]+)/i);
      const parsedCode = codeMatch ? codeMatch[1].toUpperCase() : 'REDEEM';
      if (items.some((it) => it.code === parsedCode && Math.abs(Date.parse(it.claimedAt) - Date.parse(tx.timestamp)) < 5000)) {
        continue;
      }
      items.push({
        id: tx.id,
        code: parsedCode,
        title: tx.title || `Klaim Kode ${parsedCode}`,
        claimedAt: tx.timestamp,
        referenceNo: tx.referenceNo || '-',
        rewardsGranted: [],
        summaryText:
          tx.description ||
          (tx.amount > 0 ? `Saldo +${formatRupiah(tx.amount)}` : 'Hadiah Kode Redeem'),
      });
    }

    return items.sort((a, b) => (Date.parse(b.claimedAt) || 0) - (Date.parse(a.claimedAt) || 0));
  }, [currentAccount, safeCodes, transactions]);

  if (!currentAccount) return null;

  const triggerCelebration = () => {
    try {
      const reducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;

      confetti({
        particleCount: 95,
        spread: 75,
        origin: { y: 0.55 },
        colors: ['#f59e0b', '#10b981', '#38bdf8', '#fbbf24', '#f43f5e'],
      });
      window.setTimeout(() => {
        try {
          confetti({
            particleCount: 55,
            angle: 60,
            spread: 55,
            origin: { x: 0.1, y: 0.65 },
          });
          confetti({
            particleCount: 55,
            angle: 120,
            spread: 55,
            origin: { x: 0.9, y: 0.65 },
          });
        } catch {
          // ignore
        }
      }, 220);
    } catch {
      // ignore
    }
  };

  const executeClaim = (rawCode: string, adminPinVerified = false) => {
    setErrorMessage(null);
    const cleaned = rawCode.trim();
    if (!cleaned) {
      setErrorMessage('Masukkan kode redeem terlebih dahulu sebelum menekan tombol tukar.');
      return;
    }

    const res = claimRedeemCode(cleaned, { adminPinVerified });
    if (res.requiresAdminPin) {
      setPendingAdminPinCode({
        code: res.code || cleaned,
        title: res.redeemTitle || cleaned,
      });
      return;
    }

    if (!res.success) {
      setErrorMessage(res.message);
      return;
    }

    setCodeInput('');
    setReceipt({
      code: res.code || cleaned,
      redeemTitle: res.redeemTitle || `Hadiah ${cleaned}`,
      referenceNo: res.referenceNo || `RDM-${Date.now().toString().slice(-8)}`,
      claimedAt: res.claimedAt || new Date().toISOString(),
      rewardAmount: res.rewardAmount || 0,
      newBalance: res.newBalance ?? currentAccount.balance,
      rewardsGranted:
        res.rewardsGranted && res.rewardsGranted.length > 0
          ? res.rewardsGranted
          : res.rewardAmount && res.rewardAmount > 0
          ? [`💵 Saldo Uang Tunai: +${formatRupiah(res.rewardAmount)}`]
          : ['🎁 Hadiah Kode Redeem berhasil ditambahkan'],
      activeTrialsGranted: res.activeTrialsGranted || [],
      gachaResults: res.gachaResults,
    });
    triggerCelebration();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeClaim(codeInput, false);
  };

  const handleCopyReference = (refText: string) => {
    navigator.clipboard.writeText(refText).catch(() => {});
    setCopiedRef(refText);
    window.setTimeout(() => setCopiedRef(null), 2000);
  };

  const isBalanceUnlimited =
    currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 pb-10">
      {/* Header Halaman Kode Redeem */}
      <header className="rounded-2xl bg-slate-900/80 border border-slate-800 px-6 py-6 sm:px-8 flex flex-col lg:flex-row lg:items-end justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono tabular-nums text-slate-400">
            <span className="text-amber-300 font-semibold">Penukaran Hadiah Resmi</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Rekening {currentAccount.accountNumber}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{myClaimHistory.length} Kode Pernah Diklaim</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white [text-wrap:balance]">
            Tukar Kode Redeem Bank Nusantara
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Masukkan kode redeem resmi yang Anda terima dari Admin untuk langsung menerima saldo tunai, koin spin, emas 24K, upgrade kartu, role, hingga hadiah Trial berdurasi di rekening Anda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-right">
            <span className="block text-[11px] text-slate-400">Saldo Rekening Aktif</span>
            <span className="block font-mono tabular-nums text-sm sm:text-base font-bold text-emerald-400">
              {currentAccount.cardTier === 'admin' || isBalanceUnlimited ? '∞' : formatRupiah(currentAccount.balance)}
            </span>
          </div>
          {onNavigateToMutasi && (
            <button
              type="button"
              onClick={onNavigateToMutasi}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <span>Lihat Mutasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* Grid Utama 2 Kolom: Kiri (Form / Kartu Struk Hadiah) & Kanan (Riwayat Klaim & Panduan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (7 Kolom): Form Tukar Kode ATAU Kartu Struk Hadiah */}
        <section className="lg:col-span-7 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 sm:p-8 space-y-6">
          {receipt ? (
            /* KARTU STRUK HADIAH + SALDO BARU + ANIMASI PERAYAAN */
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-400 font-semibold">
                      <span>Klaim Berhasil Diterima</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono tabular-nums text-slate-400">
                        {new Date(receipt.claimedAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}{' '}
                        WIB
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-white leading-snug">
                      Kartu Struk Hadiah Kode Redeem
                    </h2>
                    <p className="text-xs text-slate-400">{receipt.redeemTitle}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerCelebration}
                  className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Rayakan Lagi</span>
                </button>
              </div>

              {/* Detail Identitas Struk */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block">Kode Redeem Ditukar</span>
                  <span className="font-mono font-bold text-base text-amber-300 tracking-wider mt-0.5 block">
                    {receipt.code}
                  </span>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 block">Nomor Referensi Struk</span>
                  <div className="inline-flex items-center gap-1.5 mt-0.5">
                    <span className="font-mono tabular-nums font-semibold text-slate-200">
                      {receipt.referenceNo}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyReference(receipt.referenceNo)}
                      className="p-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
                      title="Salin Nomor Referensi"
                    >
                      {copiedRef === receipt.referenceNo ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ringkasan Saldo Baru */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-1">
                  <span className="text-xs text-slate-400 block">Tambahan Saldo Tunai</span>
                  <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-emerald-400 block">
                    {receipt.rewardAmount > 0 ? `+ ${formatRupiah(receipt.rewardAmount)}` : 'Hadiah Non-Tunai / Item'}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400 block">Saldo Rekening Terbaru</span>
                  <span className="font-mono tabular-nums text-xl sm:text-2xl font-bold text-white block">
                    {isUnlimitedNumber(receipt.newBalance) || currentAccount.cardTier === 'admin'
                      ? '∞'
                      : formatRupiah(receipt.newBalance)}
                  </span>
                </div>
              </div>

              {/* Rincian Seluruh Hadiah Diterima */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300">
                  Rincian Hadiah yang Masuk ke Akun ({receipt.rewardsGranted.length} Item)
                </h3>
                <ul className="divide-y divide-slate-800/80 rounded-xl bg-slate-950 border border-slate-800">
                  {receipt.rewardsGranted.map((line, idx) => (
                    <li
                      key={idx}
                      className="px-4 py-3 text-sm text-slate-100 flex items-center justify-between gap-3"
                    >
                      <span className="leading-snug">{line}</span>
                      <span className="text-[11px] font-medium text-emerald-400 shrink-0">
                        Diterima
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rincian Hadiah Trial Aktif jika Ada */}
              {receipt.activeTrialsGranted.length > 0 && (
                <div className="space-y-2.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Hadiah Trial Aktif Otomatis ({receipt.activeTrialsGranted.length})</span>
                  </div>
                  <div className="space-y-2">
                    {receipt.activeTrialsGranted.map((trial, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <span className="font-semibold text-white">
                          {trial.emoji} {trial.label}
                        </span>
                        <span className="font-mono tabular-nums text-cyan-300 shrink-0">
                          Berakhir: {new Date(trial.expiresAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })} WIB ({formatTrialDurationLabel(trial.durationMinutes)})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aksi Setelah Klaim */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReceipt(null)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tukar Kode Lainnya</span>
                </button>

                {onNavigateToDashboard && (
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Kembali ke Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* FORM TUKAR KODE REDEEM */
            <div className="space-y-6">
              <div className="flex items-start gap-3.5 pb-5 border-b border-slate-800">
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Form Penukaran Kode Redeem</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ketikkan kode rahasia yang dibagikan Admin. Hadiah langsung dikreditkan setelah validasi berhasil.
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5 leading-relaxed"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div className="space-y-2">
                  <label
                    htmlFor="redeem-code-input"
                    className="block text-xs font-semibold text-slate-200"
                  >
                    Kode Redeem Resmi
                  </label>
                  <input
                    id="redeem-code-input"
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    value={codeInput}
                    onChange={(e) => {
                      setCodeInput(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="Ketik kode redeem dari Admin di sini..."
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 focus:border-amber-400 focus:outline-none px-4 py-4 text-center font-mono text-lg sm:text-xl font-bold text-amber-300 tracking-wider placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal transition-colors"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Mendukung semua karakter sesuai kode dari Admin (tidak peka huruf besar/kecil)</span>
                    <span className="font-mono tabular-nums">{codeInput.trim().length} karakter</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-bold text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/15"
                >
                  <Gift className="w-4 h-4" />
                  <span>Tukar Kode Sekarang</span>
                </button>
              </form>

              {/* Pemberitahuan Kerahasiaan Kode */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3 text-xs text-slate-400 leading-relaxed">
                <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-200 font-semibold">Kerahasiaan Daftar Kode: </strong>
                  Daftar kode redeem aktif dijaga kerahasiaannya dan tidak ditampilkan di halaman nasabah. Pastikan Anda memasukkan kode persis seperti yang diberikan oleh Admin Bank Nusantara.
                </div>
              </div>
            </div>
          )}
        </section>

        {/* KOLOM KANAN (5 Kolom): Riwayat Klaim Saya & Panduan */}
        <aside className="lg:col-span-5 rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-5">
          {/* Segmented Control: Riwayat Klaim Saya | Panduan */}
          <div
            role="tablist"
            aria-label="Panel informasi Kode Redeem"
            className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800"
          >
            <button
              type="button"
              role="tab"
              aria-selected={rightTab === 'riwayat'}
              onClick={() => setRightTab('riwayat')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                rightTab === 'riwayat'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span>Riwayat Klaim ({myClaimHistory.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={rightTab === 'panduan'}
              onClick={() => setRightTab('panduan')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                rightTab === 'panduan'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" />
              <span>Panduan Klaim</span>
            </button>
          </div>

          {rightTab === 'riwayat' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                <span>Riwayat penukaran akun {currentAccount.fullName}</span>
                <span className="font-mono tabular-nums">{myClaimHistory.length} entri</span>
              </div>

              {myClaimHistory.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <Ticket className="w-7 h-7 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-200">
                    Belum Ada Riwayat Klaim
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                    Setelah Anda menukarkan Kode Redeem resmi dari Admin, struk dan rincian hadiah yang diterima akan tercatat rapi di sini.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {myClaimHistory.map((item) => (
                    <article
                      key={item.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sm text-amber-300 tracking-wide">
                          {item.code}
                        </span>
                        <span className="text-[11px] font-mono tabular-nums text-slate-400">
                          {new Date(item.claimedAt).toLocaleString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <h4 className="text-xs font-semibold text-white">{item.title}</h4>

                      {item.rewardsGranted.length > 0 ? (
                        <ul className="space-y-1 pt-1 border-t border-slate-800/80 text-[11px] text-emerald-300">
                          {item.rewardsGranted.map((line, i) => (
                            <li key={i} className="leading-snug">
                              {line}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-emerald-300 leading-relaxed pt-1 border-t border-slate-800/80">
                          {item.summaryText}
                        </p>
                      )}

                      {item.referenceNo && item.referenceNo !== '-' && (
                        <div className="text-[10px] font-mono tabular-nums text-slate-500 pt-0.5">
                          Ref: {item.referenceNo}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* PANDUAN KLAIM KODE REDEEM */
            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="pb-2 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white">Panduan Penukaran Kode Redeem</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Ikuti langkah berikut agar proses klaim hadiah berjalan lancar.
                </p>
              </div>

              <ol className="space-y-3.5">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    01
                  </span>
                  <div>
                    <strong className="text-white block">Dapatkan Kode Resmi dari Admin</strong>
                    <span className="text-slate-400">
                      Kode bersifat rahasia dan dibagikan pada event, giveaway, atau kompensasi khusus. Daftar kode aktif tidak ditampilkan kepada nasabah.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    02
                  </span>
                  <div>
                    <strong className="text-white block">Ketik Kode &amp; Tekan Tukar</strong>
                    <span className="text-slate-400">
                      Masukkan huruf dan angka kode tanpa spasi pada kolom penukaran di sebelah kiri, lalu tekan tombol <strong>Tukar Kode Sekarang</strong>.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    03
                  </span>
                  <div>
                    <strong className="text-white block">Verifikasi PIN Admin (Jika Diaktifkan)</strong>
                    <span className="text-slate-400">
                      Kode khusus bernilai tinggi dapat dilindungi PIN Admin. Jika diminta, masukkan PIN otorisasi untuk melanjutkan klaim.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    04
                  </span>
                  <div>
                    <strong className="text-white block">Hadiah Langsung Masuk &amp; Mode Trial</strong>
                    <span className="text-slate-400">
                      Saldo, koin spin, emas, level, kartu, maupun role langsung masuk dan menampilkan Kartu Struk Hadiah. Untuk <strong>Hadiah Trial</strong>, status aktif otomatis selama durasi yang ditetapkan lalu kembali ke kondisi semula saat waktu habis.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    05
                  </span>
                  <div>
                    <strong className="text-white block">Ketentuan Kuota &amp; Masa Berlaku</strong>
                    <span className="text-slate-400">
                      Setiap kode memiliki batas kuota pengklaim, batas waktu berlaku, dan hanya dapat diklaim maksimal 1 kali per rekening nasabah.
                    </span>
                  </div>
                </li>
              </ol>
            </div>
          )}
        </aside>
      </div>

      {/* Modal PIN Admin khusus jika kode redeem dilindungi PIN */}
      <AdminPinModal
        isOpen={Boolean(pendingAdminPinCode)}
        title={`Otorisasi PIN Admin — Kode ${pendingAdminPinCode?.code || ''}`}
        description={`Kode Redeem "${pendingAdminPinCode?.code || ''}" (${pendingAdminPinCode?.title || ''}) dilindungi PIN Admin. Masukkan PIN Admin untuk melanjutkan klaim hadiah.`}
        onSuccess={() => {
          const targetCode = pendingAdminPinCode?.code || '';
          setPendingAdminPinCode(null);
          if (targetCode) {
            executeClaim(targetCode, true);
          }
        }}
        onCancel={() => setPendingAdminPinCode(null)}
      />
    </div>
  );
};
