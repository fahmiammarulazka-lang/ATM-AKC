/**
 * Mode Transfer Bebas (Biaya Admin 5%) — Uang, Coin Spin, Emas 24K, & Paket Gabungan
 * Mendukung pemilihan rekening terdaftar ataupun tujuan bebas manual, nominal Rp1.000–tak terbatas,
 * pemotongan biaya admin 5% dari nominal yang dikirim (contoh kirim 10jt -> penerima terima 9,5jt),
 * otorisasi PIN Kartu 6 digit, struk digital rinci, dan pencatatan Mutasi Rekening otomatis.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Coins,
  Copy,
  Crown,
  KeyRound,
  Layers,
  Receipt,
  Send,
  ShieldCheck,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { TransferBebasAssetMode, TransferBebasReceipt } from '../types/bank';
import { formatIndoDate, formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';

interface TransferBebasPanelProps {
  onNavigateToMutasi?: () => void;
  initialAssetMode?: TransferBebasAssetMode;
}

export const TransferBebasPanel: React.FC<TransferBebasPanelProps> = ({
  onNavigateToMutasi,
  initialAssetMode,
}) => {
  const { accounts, currentAccount, goldMarketConfig, transferBebas } = useBank();

  const [assetMode, setAssetMode] = useState<TransferBebasAssetMode>(initialAssetMode || 'uang');
  useEffect(() => {
    if (initialAssetMode) {
      setAssetMode(initialAssetMode);
    }
  }, [initialAssetMode]);
  const [recipientSource, setRecipientSource] = useState<'registered' | 'manual'>('registered');

  const otherAccounts = useMemo(
    () => accounts.filter((a) => a.id !== currentAccount?.id),
    [accounts, currentAccount?.id]
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    otherAccounts[0]?.id || ''
  );
  const [manualRecAccount, setManualRecAccount] = useState<string>('');
  const [manualRecName, setManualRecName] = useState<string>('');
  const [manualRecBank, setManualRecBank] = useState<string>('Bank / Dompet Bebas');

  const [uangInput, setUangInput] = useState<string>('10000000');
  const [coinInput, setCoinInput] = useState<string>('100');
  const [goldRupiahInput, setGoldRupiahInput] = useState<string>('5000000');
  const [note, setNote] = useState<string>('');

  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [latestReceipt, setLatestReceipt] = useState<TransferBebasReceipt | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  if (!currentAccount) return null;

  const feePercent = Math.max(0, Math.min(50, goldMarketConfig.transferBebasAdminFeePercent ?? 5));
  const feeRate = feePercent / 100;
  const minNom = Math.max(1000, goldMarketConfig.minNominalRupiah || 1000);
  const activeGoldPrice =
    currentAccount.customUserGoldPricePerGram && currentAccount.customUserGoldPricePerGram >= 1000
      ? currentAccount.customUserGoldPricePerGram
      : goldMarketConfig.currentPricePerGram || 1_400_000;

  const ownedGoldGrams =
    currentAccount.goldBatches && currentAccount.goldBatches.length > 0
      ? currentAccount.goldBatches.reduce((s, b) => s + b.grams, 0)
      : currentAccount.goldGrams || 0;
  const ownedGoldRupiah = Math.round(ownedGoldGrams * activeGoldPrice);

  const includeUang = assetMode === 'uang' || assetMode === 'gabungan';
  const includeCoin = assetMode === 'coin' || assetMode === 'gabungan';
  const includeGold = assetMode === 'emas' || assetMode === 'gabungan';

  const uangSent = includeUang ? Math.max(0, Math.round(Number(uangInput) || 0)) : 0;
  const coinSent = includeCoin ? Math.max(0, Math.round(Number(coinInput) || 0)) : 0;
  const goldRupiahSent = includeGold ? Math.max(0, Math.round(Number(goldRupiahInput) || 0)) : 0;

  const uangFee = Math.round(uangSent * feeRate);
  const uangReceived = Math.max(0, uangSent - uangFee);

  const coinFee = Math.round(coinSent * feeRate);
  const coinReceived = Math.max(0, coinSent - coinFee);

  const goldFeeRp = Math.round(goldRupiahSent * feeRate);
  const goldReceivedRp = Math.max(0, goldRupiahSent - goldFeeRp);
  const goldGramsSent = goldRupiahSent > 0 ? goldRupiahSent / activeGoldPrice : 0;
  const goldReceivedGrams = goldReceivedRp > 0 ? goldReceivedRp / activeGoldPrice : 0;

  const selectedInternalAcc = otherAccounts.find((a) => a.id === selectedAccountId) || null;
  const resolvedRecAccount =
    recipientSource === 'registered'
      ? selectedInternalAcc?.accountNumber || ''
      : manualRecAccount.trim();
  const resolvedRecName =
    recipientSource === 'registered'
      ? selectedInternalAcc?.fullName || ''
      : manualRecName.trim() || 'Penerima Transfer Bebas';
  const resolvedRecBank =
    recipientSource === 'registered' ? 'Bank Nusantara' : manualRecBank.trim() || 'Tujuan Bebas';

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!resolvedRecAccount) {
      setErrorMsg('Silakan pilih rekening terdaftar atau ketik nomor rekening/ID tujuan.');
      return;
    }
    if (includeUang && uangSent < minNom) {
      setErrorMsg(`Nominal Transfer Uang minimal ${formatRupiah(minNom)}.`);
      return;
    }
    if (includeCoin && coinSent < 1) {
      setErrorMsg('Jumlah Transfer Coin minimal 1 Koin.');
      return;
    }
    if (includeGold && goldRupiahSent < minNom) {
      setErrorMsg(`Nominal Transfer Emas minimal senilai ${formatRupiah(minNom)}.`);
      return;
    }
    setPinInput('');
    setShowPinModal(true);
  };

  const handleConfirmTransfer = () => {
    setErrorMsg('');
    if (pinInput.length !== 6) {
      setErrorMsg('Masukkan 6 digit PIN Kartu Anda.');
      return;
    }
    const res = transferBebas({
      assetMode,
      recipientAccount: resolvedRecAccount,
      recipientName: resolvedRecName,
      recipientBank: resolvedRecBank,
      uangAmount: uangSent,
      coinAmount: coinSent,
      goldRupiahAmount: goldRupiahSent,
      note,
      pin: pinInput,
    });
    if (res.success && res.receipt) {
      setShowPinModal(false);
      setLatestReceipt(res.receipt);
      setPinInput('');
      setNote('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCopyReceipt = () => {
    if (!latestReceipt) return;
    const lines = [
      `STRUK TRANSFER BEBAS (ADMIN ${latestReceipt.adminFeePercent}%) — BANK NUSANTARA`,
      `No. Referensi: ${latestReceipt.referenceNo}`,
      `Waktu: ${formatIndoDate(latestReceipt.timestamp)}`,
      `Penerima: ${latestReceipt.recipientName} (${latestReceipt.recipientAccount} · ${latestReceipt.recipientBank})`,
    ];
    if (latestReceipt.uangSent > 0) {
      lines.push(
        `Uang Dikirim: ${formatRupiah(latestReceipt.uangSent)} | Admin: -${formatRupiah(
          latestReceipt.uangAdminFee
        )} | Diterima Bersih: ${formatRupiah(latestReceipt.uangReceived)}`
      );
    }
    if (latestReceipt.coinSent > 0) {
      lines.push(
        `Coin Dikirim: ${latestReceipt.coinSent} Koin | Admin: -${latestReceipt.coinAdminFee} Koin | Diterima Bersih: ${latestReceipt.coinReceived} Koin`
      );
    }
    if (latestReceipt.goldRupiahSent > 0) {
      lines.push(
        `Emas Dikirim: ${latestReceipt.goldGramsSent.toFixed(4)} g (${formatRupiah(
          latestReceipt.goldRupiahSent
        )}) | Admin: -${formatRupiah(
          latestReceipt.goldAdminFeeRupiah
        )} | Diterima Bersih: ${latestReceipt.goldReceivedGrams.toFixed(4)} g (${formatRupiah(
          latestReceipt.goldReceivedRupiah
        )})`
      );
    }
    navigator.clipboard?.writeText(lines.join('\n')).catch(() => {});
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT: TRANSFER BEBAS FORM */}
      <div className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-amber-500/30 p-5 sm:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Send className="w-5 h-5 text-amber-400" />
              <span>Transfer Bebas Lintas Aset (Admin {feePercent}%)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kirim Uang, Coin Spin, Emas 24K, atau ketiganya sekaligus. Biaya admin {feePercent}% otomatis dipotong dari jumlah yang dikirim.
            </p>
          </div>
          <span className="font-mono text-xs text-amber-300 font-bold">
            Admin {feePercent}% · Rp 1.000 – ∞
          </span>
        </div>

        {/* Saldo Asset Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="text-slate-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saldo Uang</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-white mt-0.5">
              {isUnlimitedNumber(currentAccount.balance)
                ? '∞ UNLIMITED'
                : formatRupiah(currentAccount.balance)}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="text-slate-400 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Saldo Coin Spin</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-amber-300 mt-0.5">
              {(currentAccount.spinCoins || 0).toLocaleString('id-ID')} Koin
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-3">
            <div className="text-slate-400 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span>Saldo Emas 24K</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-yellow-300 mt-0.5">
              {ownedGoldGrams.toFixed(4)} g ({formatRupiah(ownedGoldRupiah)})
            </div>
          </div>
        </div>

        {errorMsg && !showPinModal && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleOpenConfirm} className="space-y-4 text-xs">
          {/* Asset Mode Selector */}
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">
              1. Pilih Jenis Aset yang Dikirim:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(
                [
                  { id: 'uang', label: 'Uang (Rupiah)' },
                  { id: 'coin', label: 'Coin Spin' },
                  { id: 'emas', label: 'Emas 24K' },
                  { id: 'gabungan', label: 'Gabungan Semua' },
                ] as { id: TransferBebasAssetMode; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setAssetMode(item.id)}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-colors cursor-pointer ${
                    assetMode === item.id
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Mode Selector */}
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-slate-300 font-semibold">
                2. Tujuan Penerima Transfer Bebas:
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRecipientSource('registered')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                    recipientSource === 'registered'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rekening Terdaftar
                </button>
                <button
                  type="button"
                  onClick={() => setRecipientSource('manual')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                    recipientSource === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Input Bebas Manual
                </button>
              </div>
            </div>

            {recipientSource === 'registered' ? (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-amber-400"
              >
                {otherAccounts.length === 0 ? (
                  <option value="">Belum ada akun lain terdaftar — gunakan Input Bebas Manual</option>
                ) : (
                  otherAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} · {acc.accountNumber} ({acc.cardTier.toUpperCase()})
                    </option>
                  ))
                )}
              </select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={manualRecAccount}
                  onChange={(e) => setManualRecAccount(e.target.value)}
                  placeholder="No. Rekening / ID Tujuan"
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-mono focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={manualRecName}
                  onChange={(e) => setManualRecName(e.target.value)}
                  placeholder="Nama Penerima"
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-amber-400"
                />
                <input
                  type="text"
                  value={manualRecBank}
                  onChange={(e) => setManualRecBank(e.target.value)}
                  placeholder="Bank / Platform Tujuan"
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* Nominal Inputs per active asset */}
          {includeUang && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-emerald-300 font-bold">
                  Nominal Uang Rupiah (Minimal {formatRupiah(minNom)}):
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {formatRupiah(uangReceived)}
                </span>
              </div>
              <input
                type="number"
                min={minNom}
                value={uangInput}
                onChange={(e) => setUangInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none focus:border-emerald-400"
              />
              <div className="flex flex-wrap gap-1.5">
                {[100_000, 1_000_000, 10_000_000, 50_000_000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setUangInput(String(v))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] cursor-pointer"
                  >
                    {formatRupiah(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {includeCoin && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-amber-300 font-bold">
                  Jumlah Coin Spin (Minimal 1 Koin):
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {coinReceived.toLocaleString('id-ID')} Koin
                </span>
              </div>
              <input
                type="number"
                min={1}
                value={coinInput}
                onChange={(e) => setCoinInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-amber-200 rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none focus:border-amber-400"
              />
              <div className="flex flex-wrap gap-1.5">
                {[20, 100, 500, 1000].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCoinInput(String(c))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 font-mono text-[11px] cursor-pointer"
                  >
                    {c.toLocaleString('id-ID')} Koin
                  </button>
                ))}
              </div>
            </div>
          )}

          {includeGold && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-yellow-300 font-bold">
                  Nominal Emas 24K dalam Rupiah (≈ {goldGramsSent.toFixed(4)} g):
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {goldReceivedGrams.toFixed(4)} g ({formatRupiah(goldReceivedRp)})
                </span>
              </div>
              <input
                type="number"
                min={minNom}
                value={goldRupiahInput}
                onChange={(e) => setGoldRupiahInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-yellow-200 rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none focus:border-yellow-400"
              />
              <div className="flex flex-wrap gap-1.5">
                {[100_000, 1_000_000, 10_000_000, 20_000_000].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setGoldRupiahInput(String(v))}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-200 font-mono text-[11px] cursor-pointer"
                  >
                    {formatRupiah(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Catatan Transfer Bebas (Opsional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kirim modal usaha, koin spin, & emas 24K"
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-amber-400"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm cursor-pointer shadow-lg shadow-amber-500/20"
          >
            Lanjutkan ke Konfirmasi &amp; PIN (Admin {feePercent}%)
          </button>
        </form>
      </div>

      {/* RIGHT: LIVE BREAKDOWN & LATEST DIGITAL RECEIPT */}
      <div className="lg:col-span-5 space-y-5">
        {/* Live 5% Deduction Preview Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-5 space-y-3 text-xs">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Simulasi Rincian Biaya Admin {feePercent}%</span>
          </h3>
          <p className="text-slate-400 leading-relaxed">
            Saat Anda mengirim nilai tertentu, saldo Anda berkurang tepat sesuai nominal kirim, lalu biaya admin{' '}
            <strong className="text-amber-300">{feePercent}%</strong> dipotong otomatis sehingga penerima menerima bersih{' '}
            <strong className="text-emerald-300">{100 - feePercent}%</strong>.
          </p>

          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2.5 font-mono tabular-nums">
            <div className="flex justify-between text-slate-400">
              <span>Tujuan</span>
              <span className="text-white font-sans font-semibold">
                {resolvedRecName || '-'} ({resolvedRecAccount || '-'})
              </span>
            </div>
            {includeUang && (
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Uang Dikirim</span>
                  <span className="text-white">{formatRupiah(uangSent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin {feePercent}%</span>
                  <span className="text-rose-300">-{formatRupiah(uangFee)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-emerald-300">Diterima Bersih</span>
                  <span className="text-emerald-300">{formatRupiah(uangReceived)}</span>
                </div>
              </div>
            )}
            {includeCoin && (
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Coin Dikirim</span>
                  <span className="text-white">{coinSent.toLocaleString('id-ID')} Koin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin {feePercent}%</span>
                  <span className="text-rose-300">-{coinFee.toLocaleString('id-ID')} Koin</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-amber-300">Diterima Bersih</span>
                  <span className="text-amber-300">{coinReceived.toLocaleString('id-ID')} Koin</span>
                </div>
              </div>
            )}
            {includeGold && (
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Emas Dikirim</span>
                  <span className="text-white">
                    {goldGramsSent.toFixed(4)} g ({formatRupiah(goldRupiahSent)})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin {feePercent}%</span>
                  <span className="text-rose-300">-{formatRupiah(goldFeeRp)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-yellow-300">Diterima Bersih</span>
                  <span className="text-yellow-300">
                    {goldReceivedGrams.toFixed(4)} g ({formatRupiah(goldReceivedRp)})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Latest Digital Receipt Card */}
        {latestReceipt && (
          <div className="rounded-3xl bg-[#0B1210] border border-emerald-500/40 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Receipt className="w-4 h-4" />
                <span>Struk Transfer Bebas Berhasil</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400">
                {latestReceipt.referenceNo}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Penerima</span>
                <span className="text-white font-semibold">
                  {latestReceipt.recipientName} ({latestReceipt.recipientAccount})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tujuan / Status</span>
                <span className="text-cyan-300">
                  {latestReceipt.recipientBank} ·{' '}
                  {latestReceipt.isInternalAccount ? 'Masuk Langsung Internal' : 'Terkirim Eksternal'}
                </span>
              </div>
              {latestReceipt.uangSent > 0 && (
                <div className="border-t border-slate-800 pt-2 font-mono tabular-nums space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uang Dikirim / Admin {latestReceipt.adminFeePercent}%</span>
                    <span className="text-white">
                      {formatRupiah(latestReceipt.uangSent)} (-{formatRupiah(latestReceipt.uangAdminFee)})
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-300 font-bold">
                    <span>Uang Bersih Diterima</span>
                    <span>{formatRupiah(latestReceipt.uangReceived)}</span>
                  </div>
                </div>
              )}
              {latestReceipt.coinSent > 0 && (
                <div className="border-t border-slate-800 pt-2 font-mono tabular-nums space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coin Dikirim / Admin {latestReceipt.adminFeePercent}%</span>
                    <span className="text-white">
                      {latestReceipt.coinSent} (-{latestReceipt.coinAdminFee})
                    </span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold">
                    <span>Coin Bersih Diterima</span>
                    <span>{latestReceipt.coinReceived.toLocaleString('id-ID')} Koin</span>
                  </div>
                </div>
              )}
              {latestReceipt.goldRupiahSent > 0 && (
                <div className="border-t border-slate-800 pt-2 font-mono tabular-nums space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Emas Dikirim / Admin {latestReceipt.adminFeePercent}%</span>
                    <span className="text-white">
                      {latestReceipt.goldGramsSent.toFixed(4)} g (-
                      {formatRupiah(latestReceipt.goldAdminFeeRupiah)})
                    </span>
                  </div>
                  <div className="flex justify-between text-yellow-300 font-bold">
                    <span>Emas Bersih Diterima</span>
                    <span>
                      {latestReceipt.goldReceivedGrams.toFixed(4)} g (
                      {formatRupiah(latestReceipt.goldReceivedRupiah)})
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopyReceipt}
                className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedReceipt ? 'Struk Tersalin!' : 'Salin Struk'}</span>
              </button>
              {onNavigateToMutasi && (
                <button
                  type="button"
                  onClick={onNavigateToMutasi}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold cursor-pointer"
                >
                  Lihat di Mutasi
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6-DIGIT CARD PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400/20 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Otorisasi PIN Transfer Bebas</h3>
                <p className="text-slate-400">
                  Kirim ke {resolvedRecName} ({resolvedRecAccount})
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-1.5 font-mono tabular-nums">
              {includeUang && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Uang (Terima 95%)</span>
                  <span className="text-emerald-300">
                    {formatRupiah(uangSent)} → {formatRupiah(uangReceived)}
                  </span>
                </div>
              )}
              {includeCoin && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Coin (Terima 95%)</span>
                  <span className="text-amber-300">
                    {coinSent} → {coinReceived} Koin
                  </span>
                </div>
              )}
              {includeGold && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Emas (Terima 95%)</span>
                  <span className="text-yellow-300">
                    {goldGramsSent.toFixed(4)}g → {goldReceivedGrams.toFixed(4)}g
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Masukkan 6 Digit PIN Kartu Anda:
              </label>
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-xl p-3 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-amber-400"
              />
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300">
                {errorMsg}
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={pinInput.length !== 6}
                className="flex-1 py-3 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-black rounded-xl cursor-pointer"
              >
                Kirim Transfer Bebas
              </button>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
