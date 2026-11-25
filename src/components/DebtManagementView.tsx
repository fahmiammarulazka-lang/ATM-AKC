/**
 * Bank Nusantara — Pusat Tab Hutang, Banner Peringatan Jatuh Tempo & Pop-Up Hutang Instan
 * - Menampilkan total hutang aktif, hitung mundur kesepakatan menuju Auto-Ban 1 Hari (24 Jam)
 * - Pembayaran fleksibel: Cicil Bebas Nominal (dengan preset 25%/50%/75%) maupun Lunasi Penuh 1-Klik
 * - Riwayat lengkap sumber hutang (Mining, Lelang, Bursa, Cyber Vault, Beli Kredit, Aksi Admin) & pelunasan
 */
import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  Wallet,
  ReceiptText,
  ArrowRight,
  X,
  TrendingDown,
  History,
  BadgeCheck,
  Flame,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import { DebtHistoryEntry } from '../types/bank';

function formatRemainingCountdown(dueAt?: string): {
  text: string;
  isUrgent: boolean;
  isOverdue: boolean;
} {
  if (!dueAt) {
    return { text: 'Tidak ada tenggat aktif', isUrgent: false, isOverdue: false };
  }
  const diffMs = new Date(dueAt).getTime() - Date.now();
  if (diffMs <= 0) {
    return { text: '00j 00m 00d (JATUH TEMPO!)', isUrgent: true, isOverdue: true };
  }
  const totalSec = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const text =
    days > 0
      ? `${days}h ${pad(hours)}j ${pad(mins)}m ${pad(secs)}d`
      : `${pad(hours)}j ${pad(mins)}m ${pad(secs)}d`;
  return {
    text,
    isUrgent: diffMs <= 3 * 3600 * 1000,
    isOverdue: false,
  };
}

// ============================================================================
// 1. BANNER PERINGATAN HUTANG AKTIF (Muncul otomatis di atas layar saat punya hutang)
// ============================================================================
export const DebtWarningBanner: React.FC<{
  onOpenDebtTab: () => void;
  isAlreadyOnDebtTab?: boolean;
}> = ({ onOpenDebtTab, isAlreadyOnDebtTab }) => {
  const { currentAccount, sultanEmpireConfig } = useBank();
  const [, setTick] = useState(0);

  const debtAmount = Math.max(0, Math.round(currentAccount?.debtAmount || 0));
  const debtDueAt = currentAccount?.debtDueAt;

  useEffect(() => {
    if (debtAmount <= 0 || !debtDueAt) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [debtAmount, debtDueAt]);

  if (!currentAccount || debtAmount <= 0) return null;

  const countdown = formatRemainingCountdown(debtDueAt);
  const banHours = sultanEmpireConfig.debtBanDurationHours ?? 24;

  return (
    <div
      className={`w-full border-b ${
        countdown.isUrgent
          ? 'bg-gradient-to-r from-rose-950 via-red-950/95 to-rose-950 border-rose-500/60'
          : 'bg-gradient-to-r from-rose-950/90 via-slate-950 to-amber-950/80 border-rose-500/45'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-black text-rose-300 uppercase tracking-wider text-[11px]">
                Peringatan Tagihan Hutang Aktif
              </span>
              <span className="font-mono font-black text-white tabular-nums text-xs sm:text-sm">
                {formatRupiah(debtAmount)}
              </span>
            </div>
            <p className="text-[11px] text-rose-200/85 truncate sm:whitespace-normal">
              Lunasi sebelum waktu kesepakatan habis agar akun tidak terkena{' '}
              <strong className="text-amber-300">
                Banned Otomatis {banHours === 24 ? '1 Hari (24 Jam)' : `${banHours} Jam`}
              </strong>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-950/90 border border-rose-500/50 font-mono text-[11px] font-bold tabular-nums text-amber-300">
            <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>Sisa Waktu: {countdown.text}</span>
          </div>

          {!isAlreadyOnDebtTab && (
            <button
              type="button"
              onClick={onOpenDebtTab}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer transition-colors"
            >
              <span>Bayar Sekarang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. POP-UP PERINGATAN INSTAN SAAT BARU TERKENA HUTANG
// ============================================================================
export const DebtIncurredPopupModal: React.FC<{
  onOpenDebtTab: () => void;
}> = ({ onOpenDebtTab }) => {
  const { debtAlertModal, dismissDebtAlertModal, sultanEmpireConfig } = useBank();
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!debtAlertModal) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [debtAlertModal]);

  if (!debtAlertModal) return null;

  const countdown = formatRemainingCountdown(debtAlertModal.dueAt);
  const banHours = sultanEmpireConfig.debtBanDurationHours ?? 24;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0b1120] border-2 border-rose-500/70 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-rose-950 via-red-900/80 to-rose-950 px-5 py-4 border-b border-rose-500/40 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/50 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-300" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-300 font-bold block">
                PEMBERITAHUAN HUTANG RESMI
              </span>
              <h3 className="text-base font-black text-white">Akun Anda Terkena Hutang!</h3>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissDebtAlertModal}
            className="w-8 h-8 rounded-lg bg-slate-900/70 hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
            aria-label="Tutup peringatan hutang"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-rose-500/40 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Sumber Hutang</span>
              <span className="font-bold text-rose-300 text-right">{debtAlertModal.sourceLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Hutang Baru Tercatat</span>
              <span className="font-mono font-black text-rose-400 text-sm tabular-nums">
                +{formatRupiah(debtAlertModal.debtAdded)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-slate-300 font-bold">Total Tagihan Hutang</span>
              <span className="font-mono font-black text-white text-base tabular-nums">
                {formatRupiah(debtAlertModal.totalDebt)}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-950/35 border border-amber-500/40 space-y-1.5">
            <div className="flex items-center justify-between text-amber-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Batas Waktu Kesepakatan</span>
              </span>
              <span className="font-mono tabular-nums">{countdown.text}</span>
            </div>
            <p className="text-[11px] text-amber-100/90 leading-relaxed">
              Apabila hutang tidak dilunasi sebelum batas waktu kesepakatan berakhir, akun Anda akan{' '}
              <strong className="text-rose-300">
                otomatis dibanned selama {banHours === 24 ? '1 Hari (24 Jam)' : `${banHours} Jam`}
              </strong>
              . Anda dapat mencicil atau melunasinya kapan saja melalui <strong>Tab Kotak Hutang</strong> di sebelah kiri logo Bank Nusantara.
            </p>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">{debtAlertModal.message}</p>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => {
                dismissDebtAlertModal();
                onOpenDebtTab();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/25 cursor-pointer transition-colors"
            >
              <ReceiptText className="w-4 h-4" />
              <span>Buka Tab Hutang &amp; Bayar</span>
            </button>
            <button
              type="button"
              onClick={dismissDebtAlertModal}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
            >
              Nanti Dulu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. HALAMAN UTAMA PUSAT TAB HUTANG (DEBT MANAGEMENT VIEW)
// ============================================================================
export const DebtManagementView: React.FC<{
  onNavigateToView: (view: 'dashboard') => void;
}> = ({ onNavigateToView }) => {
  const { currentAccount, sultanEmpireConfig, payAccountDebt } = useBank();
  const [customPayAmount, setCustomPayAmount] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [, setTick] = useState(0);

  const debtAmount = Math.max(0, Math.round(currentAccount?.debtAmount || 0));
  const debtDueAt = currentAccount?.debtDueAt;
  const debtHistory: DebtHistoryEntry[] = currentAccount?.debtHistory || [];

  useEffect(() => {
    if (debtAmount <= 0 || !debtDueAt) return;
    const t = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [debtAmount, debtDueAt]);

  if (!currentAccount) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-3xl text-center text-white">
        <p className="text-base font-bold">Silakan pilih rekening aktif terlebih dahulu.</p>
      </div>
    );
  }

  const countdown = formatRemainingCountdown(debtDueAt);
  const isInf = isUnlimitedNumber(currentAccount.balance);
  const maxPayable = isInf ? debtAmount : Math.min(debtAmount, Math.max(0, Math.floor(currentAccount.balance)));
  const banHours = sultanEmpireConfig.debtBanDurationHours ?? 24;
  const termHours = sultanEmpireConfig.debtDefaultTermHours ?? 24;

  const handlePayPartial = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = Number(customPayAmount.replace(/[^\d]/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) {
      setFeedback({ type: 'error', text: 'Masukkan nominal cicilan hutang yang valid.' });
      return;
    }
    const res = payAccountDebt(numeric, 'partial');
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setCustomPayAmount('');
    }
  };

  const handlePayFull = () => {
    const res = payAccountDebt(debtAmount, 'full');
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setCustomPayAmount('');
    }
  };

  const applyPercentPreset = (pct: number) => {
    const target = Math.max(1_000, Math.min(debtAmount, Math.round((debtAmount * pct) / 100)));
    setCustomPayAmount(String(target));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Banner Tab Hutang */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border-2 shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 ${
          debtAmount > 0
            ? 'bg-gradient-to-r from-rose-950 via-slate-900 to-amber-950/60 border-rose-500/60'
            : 'bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-950 border-emerald-500/40'
        }`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-3 py-1 rounded-lg font-mono font-black text-[10px] uppercase tracking-widest flex items-center gap-1.5 border ${
                debtAmount > 0
                  ? 'bg-rose-500/20 text-rose-300 border-rose-400/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
              }`}
            >
              <ReceiptText className="w-3.5 h-3.5" />
              <span>PUSAT KESEPAKATAN &amp; TAGIHAN HUTANG</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-950/80 border border-slate-700 text-slate-300 font-mono text-[10px] font-bold">
              Tenggat Bawaan: {termHours} Jam • Sanksi Telat: Ban {banHours === 24 ? '1 Hari' : `${banHours} Jam`}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {debtAmount > 0
              ? 'Tagihan Hutang Aktif Rekening Anda'
              : 'Rekening Anda Bebas Hutang'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Kelola seluruh tagihan hutang aktif rekening Anda. Bayar cicil bebas nominal atau lunasi penuh sebelum tenggat berakhir agar terhindar dari{' '}
            <strong className="text-rose-300">Auto-Ban {banHours === 24 ? '1 Hari (24 Jam)' : `${banHours} Jam`}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => onNavigateToView('dashboard')}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition-colors"
          >
            ← Kembali ke Dashboard
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Grid Utama: Status & Pembayaran */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Ringkasan Tagihan & Countdown */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
              Total Tagihan Hutang
            </span>
            {debtAmount > 0 ? (
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 font-mono text-[10px] font-black uppercase animate-pulse">
                WAJIB DILUNASI
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono text-[10px] font-black uppercase flex items-center gap-1">
                <BadgeCheck className="w-3.5 h-3.5" />
                AMAN
              </span>
            )}
          </div>

          <div
            className={`font-mono text-3xl sm:text-4xl font-black tabular-nums tracking-tight ${
              debtAmount > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatRupiah(debtAmount)}
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Saldo Rekening Tersedia</span>
              </div>
              <span className="font-mono font-bold text-emerald-300 text-xs sm:text-sm tabular-nums">
                {isInf ? '∞' : formatRupiah(currentAccount.balance)}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-2xl border flex items-center justify-between gap-2 ${
                debtAmount > 0
                  ? 'bg-rose-950/35 border-rose-500/45'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Clock className={`w-4 h-4 shrink-0 ${debtAmount > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Sisa Waktu Kesepakatan</span>
              </div>
              <span
                className={`font-mono font-black text-xs sm:text-sm tabular-nums ${
                  debtAmount > 0
                    ? countdown.isUrgent
                      ? 'text-rose-300'
                      : 'text-amber-300'
                    : 'text-slate-500'
                }`}
              >
                {debtAmount > 0 ? countdown.text : 'Tidak ada tenggat'}
              </span>
            </div>

            {debtAmount > 0 && debtDueAt && (
              <div className="p-3.5 rounded-2xl bg-amber-950/25 border border-amber-500/35 text-[11px] text-amber-200/90 leading-relaxed space-y-1">
                <div className="font-bold text-amber-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Ketentuan Kesepakatan Pembayaran</span>
                </div>
                <p>
                  Jatuh tempo pada{' '}
                  <strong className="text-white">
                    {new Date(debtDueAt).toLocaleString('id-ID', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                  . Jika belum lunas saat tenggat habis, akun dibanned otomatis{' '}
                  <strong>{banHours === 24 ? '1 Hari (24 Jam)' : `${banHours} Jam`}</strong>, dan setelah terbuka sisa hutang diperpanjang {termHours} jam baru.
                </p>
                {sultanEmpireConfig.debtLateFeeEnabled && (
                  <p className="text-rose-300 font-semibold">
                    * Kebijakan Bunga Denda Admin aktif (+{sultanEmpireConfig.debtLateFeePercent ?? 5}% jika mendekati jatuh tempo).
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form Pembayaran Cicil & Lunasi Penuh */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
            <div>
              <h2 className="text-lg font-black text-white">Pembayaran &amp; Pelunasan Hutang</h2>
              <p className="text-xs text-slate-400">
                Cicil bebas sesuai kemampuan saldo atau lunasi seluruh tagihan dalam 1 klik.
              </p>
            </div>
            <TrendingDown className="w-5 h-5 text-rose-400 shrink-0" />
          </div>

          {debtAmount <= 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-black text-white">Tidak Ada Tagihan Hutang Aktif</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Rekening Anda bersih dari hutang. Bila suatu saat Anda mengalami kerugian besar atau menggunakan fasilitas Beli Pakai Hutang di Tab Mining &amp; Lelang VIP, rincian tagihan dan pembayaran akan otomatis muncul di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Tombol 1-Klik Lunasi Penuh */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-slate-950 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-300 font-bold block">
                    PELUNASAN INSTAN 1-KLIK
                  </span>
                  <div className="text-sm font-black text-white mt-0.5">
                    Lunasi Penuh {formatRupiah(debtAmount)}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Menghapus seluruh tagihan hutang &amp; menghentikan timer risiko banned 1 hari seketika.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handlePayFull}
                  disabled={!isInf && currentAccount.balance < debtAmount}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer transition-colors"
                >
                  {!isInf && currentAccount.balance < debtAmount
                    ? 'Saldo Belum Cukup Penuh'
                    : 'Lunasi Penuh Sekarang'}
                </button>
              </div>

              {/* Form Bayar Cicil Bebas Nominal */}
              <form onSubmit={handlePayPartial} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    Bayar Cicilan Bebas Nominal (Rp)
                  </label>
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    Maks. dari saldo: {isInf ? formatRupiah(debtAmount) : formatRupiah(maxPayable)}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customPayAmount}
                    onChange={(e) => setCustomPayAmount(e.target.value.replace(/[^\d]/g, ''))}
                    placeholder="Contoh: 250000"
                    className="flex-1 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl px-4 py-2.5 text-white font-mono text-sm focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs whitespace-nowrap cursor-pointer transition-colors"
                  >
                    Bayar Cicilan
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {[25, 50, 75, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => applyPercentPreset(pct)}
                      className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-amber-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      {pct}% ({formatRupiah(Math.round((debtAmount * pct) / 100))})
                    </button>
                  ))}
                  {!isInf && currentAccount.balance > 0 && currentAccount.balance < debtAmount && (
                    <button
                      type="button"
                      onClick={() => setCustomPayAmount(String(Math.floor(currentAccount.balance)))}
                      className="px-3 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Pakai Semua Saldo ({formatRupiah(Math.floor(currentAccount.balance))})
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Riwayat Lengkap Hutang, Kerugian & Pelunasan */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-base sm:text-lg font-black text-white">
              Riwayat Hutang, Kerugian &amp; Pelunasan ({debtHistory.length})
            </h3>
          </div>
          {(currentAccount.debtBanCount || 0) > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-[11px] font-bold">
              Riwayat Auto-Ban Hutang: {currentAccount.debtBanCount}x
            </span>
          )}
        </div>

        {debtHistory.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
            Belum ada riwayat catatan hutang atau pelunasan pada rekening ini.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {debtHistory.map((item) => {
              const isIncrease = item.amount > 0;
              const isDecrease = item.amount < 0;
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-black uppercase ${
                          isIncrease
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : isDecrease
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {item.sourceLabel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {new Date(item.timestamp).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{item.note}</p>
                  </div>

                  <div className="sm:text-right shrink-0 font-mono tabular-nums">
                    {item.amount !== 0 && (
                      <div
                        className={`text-sm font-black ${
                          isIncrease ? 'text-rose-400' : 'text-emerald-400'
                        }`}
                      >
                        {isIncrease ? `+${formatRupiah(item.amount)}` : `-${formatRupiah(Math.abs(item.amount))}`}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      Sisa Hutang: <strong className="text-white">{formatRupiah(item.balanceAfterDebt)}</strong>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
