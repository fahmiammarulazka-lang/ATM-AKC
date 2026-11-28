/**
 * Mode Transfer Bebas (Biaya Admin 5%) — Uang, Coin Spin, Emas 24K, Permata, Token Bingkai & Paket Gabungan
 * Mendukung pemilihan rekening terdaftar ataupun tujuan bebas manual, nominal Rp1.000–tak terbatas,
 * pemotongan biaya admin 5% dari nominal yang dikirim (contoh kirim 10jt -> penerima terima 9,5jt),
 * otorisasi PIN Kartu 6 digit, struk digital rinci, dan pencatatan Mutasi Rekening otomatis.
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Coins,
  Copy,
  Crown,
  KeyRound,
  Layers,
  Receipt,
  Send,
  Sparkles,
  Wallet,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { TransferBebasAssetMode, TransferBebasReceipt } from '../types/bank';
import {
  formatAccountNumberDisplay,
  formatIndoDate,
  formatRupiah,
  isUnlimitedNumber,
} from '../utils/bankUtils';
import { DiamondIcon } from './DiamondIcon';
import {
  PersonalQrisAdminPolicy,
  PersonalQrisSubMode,
  readPersonalQrisAdminPolicy,
} from '../utils/qrisTransferUtils';

interface TransferBebasPanelProps {
  onNavigateToMutasi?: () => void;
  initialAssetMode?: TransferBebasAssetMode;
  prefillQrisSubMode?: PersonalQrisSubMode;
  prefillLockAmountAndAsset?: boolean;
  prefillQrisExpiresAtMs?: number;
  prefillRecipientAccount?: string;
  prefillRecipientName?: string;
  prefillUangAmount?: number;
  prefillGoldRupiahAmount?: number;
  prefillCoinAmount?: number;
  prefillDiamondAmount?: number;
  prefillTokenAmount?: number;
  prefillNote?: string;
  prefillFromQris?: boolean;
}

export const TransferBebasPanel: React.FC<TransferBebasPanelProps> = ({
  onNavigateToMutasi,
  initialAssetMode,
  prefillQrisSubMode,
  prefillLockAmountAndAsset,
  prefillQrisExpiresAtMs,
  prefillRecipientAccount,
  prefillRecipientName,
  prefillUangAmount,
  prefillGoldRupiahAmount,
  prefillCoinAmount,
  prefillDiamondAmount,
  prefillTokenAmount,
  prefillNote,
  prefillFromQris,
}) => {
  const { accounts, currentAccount, goldMarketConfig, transferBebas } = useBank();

  const [assetMode, setAssetMode] = useState<TransferBebasAssetMode>(initialAssetMode || 'uang');
  const [qrisSubMode, setQrisSubMode] = useState<PersonalQrisSubMode>(prefillQrisSubMode || 'tf');
  const [qrisLockAmountAndAsset, setQrisLockAmountAndAsset] = useState<boolean>(
    Boolean(prefillLockAmountAndAsset || prefillQrisSubMode === 'minta')
  );
  const [qrisExpiresAtMs, setQrisExpiresAtMs] = useState<number | undefined>(
    prefillQrisExpiresAtMs
  );
  const [qrisAdminPolicy, setQrisAdminPolicy] = useState<PersonalQrisAdminPolicy>(() =>
    readPersonalQrisAdminPolicy()
  );

  useEffect(() => {
    const syncPolicy = () => setQrisAdminPolicy(readPersonalQrisAdminPolicy());
    window.addEventListener('bn:personal-qris-policy-updated', syncPolicy);
    return () => window.removeEventListener('bn:personal-qris-policy-updated', syncPolicy);
  }, []);

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
  const [diamondInput, setDiamondInput] = useState<string>('25');
  const [tokenInput, setTokenInput] = useState<string>('3');
  const [note, setNote] = useState<string>('');
  const [isFromQris, setIsFromQris] = useState<boolean>(Boolean(prefillFromQris));

  useEffect(() => {
    if (prefillRecipientAccount) {
      const cleaned = prefillRecipientAccount.trim();
      const matched = otherAccounts.find(
        (a) => a.accountNumber === cleaned || a.userId16 === cleaned
      );
      if (matched) {
        setRecipientSource('registered');
        setSelectedAccountId(matched.id);
      } else {
        setRecipientSource('manual');
        setManualRecAccount(cleaned);
        if (prefillRecipientName) setManualRecName(prefillRecipientName);
        setManualRecBank('Bank Nusantara (QRIS)');
      }
    }
    if (typeof prefillUangAmount === 'number' && prefillUangAmount > 0) {
      setUangInput(String(prefillUangAmount));
    }
    if (typeof prefillGoldRupiahAmount === 'number' && prefillGoldRupiahAmount > 0) {
      setGoldRupiahInput(String(prefillGoldRupiahAmount));
    }
    if (typeof prefillCoinAmount === 'number' && prefillCoinAmount > 0) {
      setCoinInput(String(prefillCoinAmount));
    }
    if (typeof prefillDiamondAmount === 'number' && prefillDiamondAmount > 0) {
      setDiamondInput(String(prefillDiamondAmount));
    }
    if (typeof prefillTokenAmount === 'number' && prefillTokenAmount > 0) {
      setTokenInput(String(prefillTokenAmount));
    }
    if (typeof prefillNote === 'string' && prefillNote.trim()) {
      setNote(prefillNote.trim());
    }
    if (typeof prefillFromQris === 'boolean') {
      setIsFromQris(prefillFromQris);
    }
    if (prefillQrisSubMode) {
      setQrisSubMode(prefillQrisSubMode);
    }
    setQrisLockAmountAndAsset(Boolean(prefillLockAmountAndAsset || prefillQrisSubMode === 'minta'));
    setQrisExpiresAtMs(prefillQrisExpiresAtMs);
  }, [
    prefillRecipientAccount,
    prefillRecipientName,
    prefillUangAmount,
    prefillGoldRupiahAmount,
    prefillCoinAmount,
    prefillDiamondAmount,
    prefillTokenAmount,
    prefillNote,
    prefillFromQris,
    prefillQrisSubMode,
    prefillLockAmountAndAsset,
    prefillQrisExpiresAtMs,
    otherAccounts,
  ]);

  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [latestReceipt, setLatestReceipt] = useState<TransferBebasReceipt | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const [peekSenderAccount, setPeekSenderAccount] = useState<boolean>(false);

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
  const includeDiamond = assetMode === 'permata' || assetMode === 'gabungan';
  const includeToken = assetMode === 'token' || assetMode === 'gabungan';

  const uangSent = includeUang ? Math.max(0, Math.round(Number(uangInput) || 0)) : 0;
  const coinSent = includeCoin ? Math.max(0, Math.round(Number(coinInput) || 0)) : 0;
  const goldRupiahSent = includeGold ? Math.max(0, Math.round(Number(goldRupiahInput) || 0)) : 0;
  const diamondSent = includeDiamond ? Math.max(0, Math.round(Number(diamondInput) || 0)) : 0;
  const tokenSent = includeToken ? Math.max(0, Math.round(Number(tokenInput) || 0)) : 0;

  const uangFee = Math.round(uangSent * feeRate);
  const uangReceived = Math.max(0, uangSent - uangFee);

  const coinFee = Math.round(coinSent * feeRate);
  const coinReceived = Math.max(0, coinSent - coinFee);

  const goldFeeRp = Math.round(goldRupiahSent * feeRate);
  const goldReceivedRp = Math.max(0, goldRupiahSent - goldFeeRp);
  const goldGramsSent = goldRupiahSent > 0 ? goldRupiahSent / activeGoldPrice : 0;
  const goldReceivedGrams = goldReceivedRp > 0 ? goldReceivedRp / activeGoldPrice : 0;

  const diamondFee = Math.round(diamondSent * feeRate);
  const diamondReceived = Math.max(0, diamondSent - diamondFee);

  const tokenFee = Math.round(tokenSent * feeRate);
  const tokenReceived = Math.max(0, tokenSent - tokenFee);

  const estimatedTotalValueRupiah =
    uangSent +
    goldRupiahSent +
    coinSent * 10_000 +
    diamondSent * 1_000 +
    tokenSent * 50_000;

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

  const isQrisMintaLocked =
    isFromQris &&
    qrisSubMode === 'minta' &&
    qrisLockAmountAndAsset &&
    qrisAdminPolicy.enforceQrisMintaLock;
  const isQrisExpired = Boolean(
    isFromQris &&
      qrisSubMode === 'minta' &&
      qrisExpiresAtMs &&
      qrisExpiresAtMs > 0 &&
      Date.now() > qrisExpiresAtMs
  );

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (isFromQris) {
      if (qrisSubMode === 'minta' && !qrisAdminPolicy.enableQrisMinta) {
        setErrorMsg('Mode QRIS MINTA sedang dinonaktifkan sementara oleh kebijakan Admin.');
        return;
      }
      if (qrisSubMode === 'tf' && !qrisAdminPolicy.enableQrisTf) {
        setErrorMsg('Mode QRIS TF sedang dinonaktifkan sementara oleh kebijakan Admin.');
        return;
      }
      if (isQrisExpired) {
        setErrorMsg(
          'Kode QRIS MINTA ini sudah melewati batas waktu aktif (kedaluwarsa). Minta penerima membuat kode QRIS MINTA baru.'
        );
        return;
      }
    }
    if (!resolvedRecAccount) {
      setErrorMsg('Silakan pilih rekening terdaftar atau ketik nomor rekening/ID tujuan.');
      return;
    }
    if (assetMode === 'uang' && uangSent < minNom) {
      setErrorMsg(`Nominal Transfer Uang minimal ${formatRupiah(minNom)}.`);
      return;
    }
    if (assetMode === 'coin' && coinSent < 1) {
      setErrorMsg('Jumlah Transfer Coin minimal 1 Koin.');
      return;
    }
    if (assetMode === 'emas' && goldRupiahSent < minNom) {
      setErrorMsg(`Nominal Transfer Emas minimal senilai ${formatRupiah(minNom)}.`);
      return;
    }
    if (assetMode === 'permata' && diamondSent < 1) {
      setErrorMsg('Jumlah Transfer Permata minimal 1 Permata.');
      return;
    }
    if (assetMode === 'token' && tokenSent < 1) {
      setErrorMsg('Jumlah Transfer Token Spin Bingkai minimal 1 Token.');
      return;
    }
    if (
      assetMode === 'gabungan' &&
      uangSent <= 0 &&
      coinSent <= 0 &&
      goldRupiahSent <= 0 &&
      diamondSent <= 0 &&
      tokenSent <= 0
    ) {
      setErrorMsg('Pada mode Paket Gabungan, isi minimal satu jenis aset untuk dikirim.');
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
    const qrisLabelTag = isFromQris
      ? qrisSubMode === 'minta'
        ? '[QRIS MINTA]'
        : '[QRIS TF]'
      : '';
    const rawNote = note.trim();
    const formattedNote = isFromQris
      ? rawNote.startsWith('[QRIS')
        ? rawNote
        : `${qrisLabelTag} ${rawNote || (qrisSubMode === 'minta' ? 'Pembayaran Permintaan QRIS MINTA Multi-Aset' : 'Transfer Multi-Aset via Scan QRIS TF')}`
      : rawNote;

    const res = transferBebas({
      assetMode,
      recipientAccount: resolvedRecAccount,
      recipientName: resolvedRecName,
      recipientBank: resolvedRecBank,
      uangAmount: uangSent,
      coinAmount: coinSent,
      goldRupiahAmount: goldRupiahSent,
      diamondAmount: diamondSent,
      tokenAmount: tokenSent,
      fromQris: isFromQris,
      note: formattedNote,
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
      `STRUK TRANSFER MULTI-ASET ${latestReceipt.fromQris ? 'QRIS PRIBADI ' : ''}(ADMIN ${latestReceipt.adminFeePercent}%) — BANK NUSANTARA`,
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
    if (latestReceipt.goldRupiahSent > 0) {
      lines.push(
        `Emas 24K Dikirim: ${latestReceipt.goldGramsSent.toFixed(4)} g (${formatRupiah(
          latestReceipt.goldRupiahSent
        )}) | Admin: -${formatRupiah(
          latestReceipt.goldAdminFeeRupiah
        )} | Diterima Bersih: ${latestReceipt.goldReceivedGrams.toFixed(4)} g (${formatRupiah(
          latestReceipt.goldReceivedRupiah
        )})`
      );
    }
    if (latestReceipt.coinSent > 0) {
      lines.push(
        `Coin Spin Dikirim: ${latestReceipt.coinSent} Koin | Admin: -${latestReceipt.coinAdminFee} Koin | Diterima Bersih: ${latestReceipt.coinReceived} Koin`
      );
    }
    if ((latestReceipt.diamondSent || 0) > 0) {
      lines.push(
        `Permata Dikirim: ${latestReceipt.diamondSent} Permata | Admin: -${latestReceipt.diamondAdminFee || 0} Permata | Diterima Bersih: ${latestReceipt.diamondReceived || 0} Permata`
      );
    }
    if ((latestReceipt.tokenSent || 0) > 0) {
      lines.push(
        `Token Bingkai Dikirim: ${latestReceipt.tokenSent} Token | Admin: -${latestReceipt.tokenAdminFee || 0} Token | Diterima Bersih: ${latestReceipt.tokenReceived || 0} Token`
      );
    }
    if (latestReceipt.estimatedTotalValueRupiah) {
      lines.push(`Estimasi Total Nilai Transaksi: ${formatRupiah(latestReceipt.estimatedTotalValueRupiah)}`);
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
              <span>Transfer Multi-Aset &amp; QRIS (Admin {feePercent}%)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kirim Uang Rupiah, Emas 24K, Coin Spin, Permata, Token Bingkai, atau Paket Gabungan sekaligus. Biaya admin {feePercent}% otomatis dipotong dari aset yang dikirim.
            </p>
          </div>
          <span className="font-mono text-xs text-amber-300 font-bold">
            Admin {feePercent}% · Multi-Aset
          </span>
        </div>

        {/* Saldo Asset Strip (5 Aset Lengkap) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Saldo Uang</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-white mt-0.5 truncate">
              {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance)
                ? '∞'
                : formatRupiah(currentAccount.balance)}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              <span>Emas 24K</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-yellow-300 mt-0.5 truncate">
              {ownedGoldGrams.toFixed(3)} g
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Coin Spin</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-amber-300 mt-0.5 truncate">
              {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.spinCoins)
                ? '∞'
                : `${(currentAccount.spinCoins || 0).toLocaleString('id-ID')} Koin`}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <DiamondIcon className="w-3.5 h-3.5" />
              <span>Permata</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-cyan-300 mt-0.5 truncate">
              {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.diamonds)
                ? '∞'
                : `${(currentAccount.diamonds || 0).toLocaleString('id-ID')} Diamond`}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950 border border-slate-800 p-2.5 col-span-2 sm:col-span-1">
            <div className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Token Bingkai</span>
            </div>
            <div className="font-mono tabular-nums font-bold text-fuchsia-300 mt-0.5 truncate">
              {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.spinTokens)
                ? '∞'
                : `${(currentAccount.spinTokens || 0).toLocaleString('id-ID')} Token`}
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
          {/* Asset Mode Selector (6 Mode Lengkap) */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-slate-300 font-semibold">
                1. Pilih Jenis Aset yang Dikirim:
              </label>
              {isFromQris && (
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-black font-mono ${
                    isQrisMintaLocked
                      ? 'border-amber-400/50 bg-amber-500/20 text-amber-200'
                      : 'border-sky-400/50 bg-sky-500/20 text-sky-200'
                  }`}
                >
                  {isQrisMintaLocked
                    ? 'QRIS MINTA • JENIS ASET & NOMINAL TERKUNCI'
                    : 'QRIS TF • BEBAS PILIH ASET & NOMINAL'}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(
                [
                  { id: 'uang', label: 'Saldo Rupiah' },
                  { id: 'emas', label: 'Emas 24K' },
                  { id: 'coin', label: 'Coin Spin' },
                  { id: 'permata', label: 'Permata (Diamond)' },
                  { id: 'token', label: 'Token Bingkai' },
                  { id: 'gabungan', label: 'Paket Gabungan' },
                ] as { id: TransferBebasAssetMode; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  disabled={isQrisMintaLocked && assetMode !== item.id}
                  onClick={() => {
                    if (isQrisMintaLocked) return;
                    setAssetMode(item.id);
                  }}
                  className={`py-2.5 px-3 rounded-xl font-bold border transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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
                2. Tujuan Penerima Transfer Multi-Aset:
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
                  Nominal Uang Rupiah {isQrisMintaLocked ? '(Terkunci QRIS MINTA)' : assetMode === 'gabungan' ? '(Isi 0 jika tidak disertakan)' : `(Minimal ${formatRupiah(minNom)})`}:
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {formatRupiah(uangReceived)}
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={uangInput}
                readOnly={isQrisMintaLocked}
                onChange={(e) => {
                  if (isQrisMintaLocked) return;
                  setUangInput(e.target.value);
                }}
                className={`w-full bg-slate-900 border text-white rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none ${
                  isQrisMintaLocked ? 'border-amber-500/50 cursor-not-allowed' : 'border-slate-700 focus:border-emerald-400'
                }`}
              />
              {!isQrisMintaLocked && (
                <div className="flex flex-wrap gap-1.5">
                  {[0, 100_000, 1_000_000, 10_000_000, 50_000_000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setUangInput(String(v))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-[11px] cursor-pointer"
                    >
                      {v === 0 ? '0 (Lewati)' : formatRupiah(v)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {includeGold && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-yellow-300 font-bold">
                  Nominal Emas 24K dalam Rupiah (≈ {goldGramsSent.toFixed(4)} g){isQrisMintaLocked ? ' [Terkunci]' : ''}:
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {goldReceivedGrams.toFixed(4)} g ({formatRupiah(goldReceivedRp)})
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={goldRupiahInput}
                readOnly={isQrisMintaLocked}
                onChange={(e) => {
                  if (isQrisMintaLocked) return;
                  setGoldRupiahInput(e.target.value);
                }}
                className={`w-full bg-slate-900 border text-yellow-200 rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none ${
                  isQrisMintaLocked ? 'border-amber-500/50 cursor-not-allowed' : 'border-slate-700 focus:border-yellow-400'
                }`}
              />
              {!isQrisMintaLocked && (
                <div className="flex flex-wrap gap-1.5">
                  {[0, 100_000, 1_000_000, 5_000_000, 20_000_000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setGoldRupiahInput(String(v))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-yellow-200 font-mono text-[11px] cursor-pointer"
                    >
                      {v === 0 ? '0 (Lewati)' : formatRupiah(v)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {includeCoin && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-amber-300 font-bold">
                  Jumlah Coin Spin{isQrisMintaLocked ? ' (Terkunci)' : ''}:
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {coinReceived.toLocaleString('id-ID')} Koin
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={coinInput}
                readOnly={isQrisMintaLocked}
                onChange={(e) => {
                  if (isQrisMintaLocked) return;
                  setCoinInput(e.target.value);
                }}
                className={`w-full bg-slate-900 border text-amber-200 rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none ${
                  isQrisMintaLocked ? 'border-amber-500/50 cursor-not-allowed' : 'border-slate-700 focus:border-amber-400'
                }`}
              />
              {!isQrisMintaLocked && (
                <div className="flex flex-wrap gap-1.5">
                  {[0, 20, 100, 500, 1000].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCoinInput(String(c))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-200 font-mono text-[11px] cursor-pointer"
                    >
                      {c === 0 ? '0 (Lewati)' : `${c.toLocaleString('id-ID')} Koin`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {includeDiamond && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-cyan-300 font-bold">
                  Jumlah Permata (Diamond){isQrisMintaLocked ? ' (Terkunci)' : ''}:
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {diamondReceived.toLocaleString('id-ID')} Permata
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={diamondInput}
                readOnly={isQrisMintaLocked}
                onChange={(e) => {
                  if (isQrisMintaLocked) return;
                  setDiamondInput(e.target.value);
                }}
                className={`w-full bg-slate-900 border text-cyan-200 rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none ${
                  isQrisMintaLocked ? 'border-amber-500/50 cursor-not-allowed' : 'border-slate-700 focus:border-cyan-400'
                }`}
              />
              {!isQrisMintaLocked && (
                <div className="flex flex-wrap gap-1.5">
                  {[0, 10, 25, 100, 500].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDiamondInput(String(d))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-200 font-mono text-[11px] cursor-pointer"
                    >
                      {d === 0 ? '0 (Lewati)' : `${d.toLocaleString('id-ID')} Permata`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {includeToken && (
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between">
                <label className="text-fuchsia-300 font-bold">
                  Jumlah Token Spin Bingkai{isQrisMintaLocked ? ' (Terkunci)' : ''}:
                </label>
                <span className="font-mono text-slate-400">
                  Diterima: {tokenReceived.toLocaleString('id-ID')} Token
                </span>
              </div>
              <input
                type="number"
                min={0}
                value={tokenInput}
                readOnly={isQrisMintaLocked}
                onChange={(e) => {
                  if (isQrisMintaLocked) return;
                  setTokenInput(e.target.value);
                }}
                className={`w-full bg-slate-900 border text-fuchsia-200 rounded-xl p-3 font-mono tabular-nums text-sm font-bold focus:outline-none ${
                  isQrisMintaLocked ? 'border-amber-500/50 cursor-not-allowed' : 'border-slate-700 focus:border-fuchsia-400'
                }`}
              />
              {!isQrisMintaLocked && (
                <div className="flex flex-wrap gap-1.5">
                  {[0, 1, 3, 10, 25].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTokenInput(String(t))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-fuchsia-200 font-mono text-[11px] cursor-pointer"
                    >
                      {t === 0 ? '0 (Lewati)' : `${t.toLocaleString('id-ID')} Token`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="text-slate-300 font-semibold block mb-1">
              Catatan Transfer Multi-Aset (Opsional):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Kirim uang, emas 24K, coin, permata & token via QRIS"
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
            Saat Anda mengirim aset, saldo berkurang sesuai jumlah kirim, lalu biaya admin{' '}
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
            {includeUang && uangSent > 0 && (
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
            {includeGold && goldRupiahSent > 0 && (
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
            {includeCoin && coinSent > 0 && (
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
            {includeDiamond && diamondSent > 0 && (
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Permata Dikirim</span>
                  <span className="text-white">{diamondSent.toLocaleString('id-ID')} Permata</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin {feePercent}%</span>
                  <span className="text-rose-300">-{diamondFee.toLocaleString('id-ID')} Permata</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-cyan-300">Diterima Bersih</span>
                  <span className="text-cyan-300">{diamondReceived.toLocaleString('id-ID')} Permata</span>
                </div>
              </div>
            )}
            {includeToken && tokenSent > 0 && (
              <div className="border-t border-slate-800 pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Token Bingkai Dikirim</span>
                  <span className="text-white">{tokenSent.toLocaleString('id-ID')} Token</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin {feePercent}%</span>
                  <span className="text-rose-300">-{tokenFee.toLocaleString('id-ID')} Token</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-fuchsia-300">Diterima Bersih</span>
                  <span className="text-fuchsia-300">{tokenReceived.toLocaleString('id-ID')} Token</span>
                </div>
              </div>
            )}
            <div className="border-t border-slate-800 pt-2 flex justify-between font-bold">
              <span className="text-slate-300">Estimasi Nilai Transaksi</span>
              <span className="text-amber-300">{formatRupiah(estimatedTotalValueRupiah)}</span>
            </div>
          </div>
        </div>

        {/* Latest Digital Receipt Card */}
        {latestReceipt && (
          <div className="rounded-3xl bg-[#0B1210] border border-emerald-500/40 p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                <Receipt className="w-4 h-4" />
                <span>Struk Transfer Multi-Aset Berhasil</span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400">
                {latestReceipt.referenceNo}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-950/90 border border-slate-800 p-4 space-y-2">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Pengirim</span>
                <span className="text-slate-200 font-semibold font-mono flex items-center gap-1.5">
                  <span>
                    {currentAccount.fullName} (
                    {formatAccountNumberDisplay(
                      currentAccount.accountNumber,
                      Boolean(currentAccount.hideSensitiveNumbers) && !peekSenderAccount
                    )}
                    )
                  </span>
                  {currentAccount.hideSensitiveNumbers && (
                    <button
                      type="button"
                      onClick={() => setPeekSenderAccount((p) => !p)}
                      className="p-0.5 rounded bg-slate-800 text-cyan-300 hover:text-white cursor-pointer"
                      title="Intip nomor pengirim"
                    >
                      {peekSenderAccount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                  )}
                </span>
              </div>
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
              {(latestReceipt.diamondSent || 0) > 0 && (
                <div className="border-t border-slate-800 pt-2 font-mono tabular-nums space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Permata Dikirim / Admin {latestReceipt.adminFeePercent}%</span>
                    <span className="text-white">
                      {latestReceipt.diamondSent} (-{latestReceipt.diamondAdminFee || 0})
                    </span>
                  </div>
                  <div className="flex justify-between text-cyan-300 font-bold">
                    <span>Permata Bersih Diterima</span>
                    <span>{(latestReceipt.diamondReceived || 0).toLocaleString('id-ID')} Permata</span>
                  </div>
                </div>
              )}
              {(latestReceipt.tokenSent || 0) > 0 && (
                <div className="border-t border-slate-800 pt-2 font-mono tabular-nums space-y-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token Bingkai Dikirim / Admin {latestReceipt.adminFeePercent}%</span>
                    <span className="text-white">
                      {latestReceipt.tokenSent} (-{latestReceipt.tokenAdminFee || 0})
                    </span>
                  </div>
                  <div className="flex justify-between text-fuchsia-300 font-bold">
                    <span>Token Bersih Diterima</span>
                    <span>{(latestReceipt.tokenReceived || 0).toLocaleString('id-ID')} Token</span>
                  </div>
                </div>
              )}
              {latestReceipt.estimatedTotalValueRupiah && (
                <div className="border-t border-slate-800 pt-2 flex justify-between font-mono font-bold text-amber-300">
                  <span>Estimasi Total Nilai</span>
                  <span>{formatRupiah(latestReceipt.estimatedTotalValueRupiah)}</span>
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
                <h3 className="font-bold text-base text-white">Otorisasi PIN Transfer Multi-Aset</h3>
                <p className="text-slate-400">
                  Kirim ke {resolvedRecName} ({resolvedRecAccount})
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5 space-y-1.5 font-mono tabular-nums">
              {includeUang && uangSent > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Uang (Terima {100 - feePercent}%)</span>
                  <span className="text-emerald-300">
                    {formatRupiah(uangSent)} → {formatRupiah(uangReceived)}
                  </span>
                </div>
              )}
              {includeGold && goldRupiahSent > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Emas (Terima {100 - feePercent}%)</span>
                  <span className="text-yellow-300">
                    {goldGramsSent.toFixed(4)}g → {goldReceivedGrams.toFixed(4)}g
                  </span>
                </div>
              )}
              {includeCoin && coinSent > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Coin (Terima {100 - feePercent}%)</span>
                  <span className="text-amber-300">
                    {coinSent} → {coinReceived} Koin
                  </span>
                </div>
              )}
              {includeDiamond && diamondSent > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Permata (Terima {100 - feePercent}%)</span>
                  <span className="text-cyan-300">
                    {diamondSent} → {diamondReceived} Permata
                  </span>
                </div>
              )}
              {includeToken && tokenSent > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Token (Terima {100 - feePercent}%)</span>
                  <span className="text-fuchsia-300">
                    {tokenSent} → {tokenReceived} Token
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
                Kirim Transfer Multi-Aset
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

