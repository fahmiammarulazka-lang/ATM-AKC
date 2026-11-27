/**
 * Workspace Terpadu Transfer Bank Nusantara
 * Mendukung Transfer Reguler (Antar Rekening & Bank Lain) dan Mode Transfer Bebas 5%
 * (Uang Rupiah, Coin Spin, Emas 24K, atau Paket Gabungan) baik sebagai tab utama di sebelah
 * Mobile Banking maupun di dalam dashboard nasabah.
 */
import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Coins,
  Crown,
  History,
  Send,
  ShieldCheck,
  Star,
  Wallet,
  Eye,
  EyeOff,
  Camera,
  ImageUp,
  QrCode,
  ShieldAlert,
  ReceiptText,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { TransferBebasAssetMode } from '../types/bank';
import {
  formatAccountNumberDisplay,
  formatRupiah,
  isUnlimitedNumber,
  SUPPORTED_BANKS,
} from '../utils/bankUtils';
import { TransferBebasPanel } from './TransferBebasPanel';
import { QrisScannerModal } from './QrisScannerModal';
import {
  MANDATORY_TRANSFER_ADMIN_FEE_PERCENT,
  calculateMandatoryTransferFee,
} from '../utils/loyaltySystemUtils';
import {
  clearPendingQrisTransfer,
  isSelfQrisTransferTarget,
  parsePersonalQrisPayload,
  savePendingQrisTransfer,
} from '../utils/qrisTransferUtils';

interface TransferWorkspaceProps {
  standalone?: boolean;
  initialMode?: 'reguler' | 'bebas';
  initialBebasAssetMode?: TransferBebasAssetMode;
  routeKey?: number;
  prefillAccount?: string;
  prefillBank?: string;
  prefillRecipientName?: string;
  prefillAmount?: number;
  prefillNote?: string;
  prefillFromQris?: boolean;
  onNavigateToMutasi?: () => void;
  onNavigateToDashboard?: () => void;
  onNavigateToGold?: () => void;
  onSuccessNotice?: (msg: string) => void;
}

export const TransferWorkspace: React.FC<TransferWorkspaceProps> = ({
  standalone = false,
  initialMode = 'reguler',
  initialBebasAssetMode,
  routeKey = 0,
  prefillAccount = '',
  prefillBank = 'Bank Nusantara',
  prefillRecipientName = '',
  prefillAmount,
  prefillNote = '',
  prefillFromQris = false,
  onNavigateToMutasi,
  onNavigateToDashboard,
  onNavigateToGold,
  onSuccessNotice,
}) => {
  const {
    currentAccount,
    goldMarketConfig,
    favorites,
    transferMoney,
    addFavorite,
    deleteFavorite,
    lookupAccount,
  } = useBank();

  const [transferMode, setTransferMode] = useState<'reguler' | 'bebas'>(initialMode);
  const [destBank, setDestBank] = useState<string>(prefillBank || 'Bank Nusantara');
  const [destAccount, setDestAccount] = useState<string>(prefillAccount || '');
  const [recipientLookup, setRecipientLookup] = useState<{ found: boolean; name?: string } | null>(
    null
  );
  const [transferAmount, setTransferAmount] = useState<string>(
    prefillAmount && prefillAmount > 0 ? String(Math.round(prefillAmount)) : ''
  );
  const [transferNote, setTransferNote] = useState<string>(prefillNote || '');
  const [transferPin, setTransferPin] = useState<string>('');
  const [showTransferConfirmModal, setShowTransferConfirmModal] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string>('');
  const [transferSuccess, setTransferSuccess] = useState<string>('');
  const [saveAsFav, setSaveAsFav] = useState<boolean>(false);
  const [peekSenderAccount, setPeekSenderAccount] = useState<boolean>(false);
  const [isQrisPrefillBanner, setIsQrisPrefillBanner] = useState<boolean>(Boolean(prefillFromQris));
  const [qrisPrefillRecipientLabel, setQrisPrefillRecipientLabel] = useState<string>(
    prefillRecipientName || ''
  );
  const [qrisSelfScanAlert, setQrisSelfScanAlert] = useState<string>('');
  const [qrisScannerModal, setQrisScannerModal] = useState<{
    open: boolean;
    mode: 'camera' | 'gallery';
  }>({ open: false, mode: 'camera' });
  const [transferReceipt, setTransferReceipt] = useState<{
    referenceNo: string;
    timestampText: string;
    recipientName: string;
    recipientAccount: string;
    recipientBank: string;
    amount: number;
    adminFee: number;
    totalDeducted: number;
    note: string;
    fromQris: boolean;
  } | null>(null);

  useEffect(() => {
    if (initialMode) {
      setTransferMode(initialMode);
    }
  }, [initialMode, routeKey]);

  useEffect(() => {
    if (prefillAccount) {
      if (currentAccount && isSelfQrisTransferTarget({ recipientAccount: prefillAccount }, currentAccount)) {
        clearPendingQrisTransfer();
        setIsQrisPrefillBanner(false);
        setQrisSelfScanAlert(
          `QRIS Pribadi ini milik rekening Anda sendiri (${currentAccount.fullName} · ${currentAccount.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`
        );
        return;
      }

      const targetBank = prefillBank || 'Bank Nusantara';
      setQrisSelfScanAlert('');
      setDestAccount(prefillAccount);
      setDestBank(targetBank);
      setQrisPrefillRecipientLabel(prefillRecipientName || '');
      if (prefillAmount && prefillAmount > 0) {
        setTransferAmount(String(Math.round(prefillAmount)));
      }
      if (prefillNote) {
        setTransferNote(prefillNote);
      }
      setIsQrisPrefillBanner(Boolean(prefillFromQris));
      const looked = lookupAccount(
        prefillAccount,
        targetBank === 'Bank Nusantara' ? 'BNUS' : targetBank
      );
      if (looked.found) {
        setRecipientLookup(looked);
      } else if (prefillRecipientName) {
        setRecipientLookup({ found: true, name: prefillRecipientName });
      } else {
        setRecipientLookup(null);
      }
    }
  }, [
    prefillAccount,
    prefillBank,
    prefillAmount,
    prefillNote,
    prefillFromQris,
    prefillRecipientName,
    routeKey,
    lookupAccount,
    currentAccount,
  ]);

  if (!currentAccount) {
    return (
      <div className="p-8 text-center text-slate-300 bg-slate-900/80 border border-slate-800 rounded-2xl">
        <p>Silakan pilih atau daftarkan rekening Bank Nusantara terlebih dahulu.</p>
      </div>
    );
  }

  const activeGoldPrice =
    currentAccount.customUserGoldPricePerGram && currentAccount.customUserGoldPricePerGram >= 1000
      ? currentAccount.customUserGoldPricePerGram
      : goldMarketConfig.currentPricePerGram || 1_400_000;
  const ownedGoldGrams =
    currentAccount.goldBatches && currentAccount.goldBatches.length > 0
      ? currentAccount.goldBatches.reduce((sum, b) => sum + b.grams, 0)
      : currentAccount.goldGrams || 0;
  const ownedGoldRupiah = Math.round(ownedGoldGrams * activeGoldPrice);

  const handleLookupCheck = () => {
    if (!destAccount || destAccount.length < 8) return;
    const res = lookupAccount(destAccount, destBank === 'Bank Nusantara' ? 'BNUS' : destBank);
    setRecipientLookup(res);
  };

  const handleStartTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');
    const amt = parseInt(transferAmount, 10);
    if (!amt || amt <= 0) {
      setTransferError('Jumlah transfer tidak valid');
      return;
    }
    if (!recipientLookup?.found) {
      setTransferError('Silakan verifikasi nomor rekening tujuan terlebih dahulu');
      return;
    }
    setShowTransferConfirmModal(true);
  };

  const handleConfirmTransferSubmit = () => {
    if (transferPin.length !== 6) {
      setTransferError('Masukkan 6 digit PIN Anda');
      return;
    }

    const amt = parseInt(transferAmount, 10);
    const res = transferMoney({
      recipientAccount: destAccount,
      recipientBank: destBank,
      amount: amt,
      note: transferNote,
      pin: transferPin,
    });

    if (res.success) {
      const feePaid = calculateMandatoryTransferFee(amt);
      const wasFromQris = isQrisPrefillBanner;
      const finalRecipientName =
        recipientLookup?.name || qrisPrefillRecipientLabel || destAccount;
      if (saveAsFav && recipientLookup?.name) {
        addFavorite(destAccount, recipientLookup.name, destBank, transferNote);
      }
      clearPendingQrisTransfer();
      setTransferReceipt({
        referenceNo: `TRF${Date.now().toString().slice(-8)}`,
        timestampText: new Date().toLocaleString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        recipientName: finalRecipientName,
        recipientAccount: destAccount,
        recipientBank: destBank,
        amount: amt,
        adminFee: feePaid,
        totalDeducted: amt + feePaid,
        note: transferNote || (wasFromQris ? 'Transfer via Scan QRIS Pribadi' : '-'),
        fromQris: wasFromQris,
      });
      setIsQrisPrefillBanner(false);
      setShowTransferConfirmModal(false);
      setTransferAmount('');
      setTransferNote('');
      setTransferPin('');
      setDestAccount('');
      setRecipientLookup(null);
      setTransferSuccess(res.message);
      if (onSuccessNotice) {
        onSuccessNotice(res.message);
      }
    } else {
      setTransferError(res.message);
    }
  };

  const handleQrisDetectedInWorkspace = (rawText: string, source: 'camera' | 'gallery') => {
    setQrisScannerModal((prev) => ({ ...prev, open: false }));
    const parsed = parsePersonalQrisPayload(rawText);
    if (!parsed.recipientAccount) {
      setTransferError(
        'Kode QR yang dipindai tidak dikenali sebagai QRIS Pribadi Bank Nusantara.'
      );
      return;
    }
    if (isSelfQrisTransferTarget(parsed, currentAccount)) {
      clearPendingQrisTransfer();
      setIsQrisPrefillBanner(false);
      setQrisSelfScanAlert(
        `QRIS Pribadi ini milik rekening Anda sendiri (${currentAccount.fullName} · ${currentAccount.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`
      );
      return;
    }

    setQrisSelfScanAlert('');
    setTransferError('');
    setTransferReceipt(null);
    setTransferMode('reguler');
    savePendingQrisTransfer({
      recipientAccount: parsed.recipientAccount,
      recipientUserId: parsed.recipientUserId,
      recipientBank: parsed.recipientBank || 'Bank Nusantara',
      recipientName: parsed.recipientName,
      amount: parsed.amount > 0 ? parsed.amount : undefined,
      note: parsed.note || 'Transfer via Scan QRIS Pribadi',
      source,
    });
    setDestAccount(parsed.recipientAccount);
    setDestBank(parsed.recipientBank || 'Bank Nusantara');
    setQrisPrefillRecipientLabel(parsed.recipientName || '');
    if (parsed.amount > 0) {
      setTransferAmount(String(parsed.amount));
    }
    setTransferNote(parsed.note || 'Transfer via Scan QRIS Pribadi');
    setIsQrisPrefillBanner(true);
    const looked = lookupAccount(
      parsed.recipientAccount,
      parsed.recipientBank === 'Bank Nusantara' ? 'BNUS' : parsed.recipientBank
    );
    if (looked.found) {
      setRecipientLookup(looked);
    } else if (parsed.recipientName) {
      setRecipientLookup({ found: true, name: parsed.recipientName });
    } else {
      setRecipientLookup(null);
    }
  };

  return (
    <div className="space-y-5">
      {/* Standalone Top Header & Multi-Asset Strip when opened from Navbar next to M-Banking */}
      {standalone && (
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-400" />
                <span>Pusat Transfer Bank Nusantara</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                <span>{currentAccount.fullName} · No. Rek</span>
                <span className="font-mono text-amber-300">
                  {formatAccountNumberDisplay(
                    currentAccount.accountNumber,
                    Boolean(currentAccount.hideSensitiveNumbers) && !peekSenderAccount
                  )}
                </span>
                {currentAccount.hideSensitiveNumbers && (
                  <button
                    type="button"
                    onClick={() => setPeekSenderAccount((p) => !p)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-cyan-300 cursor-pointer"
                    title="Intip cepat nomor rekening pengirim"
                  >
                    {peekSenderAccount ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{peekSenderAccount ? 'Tutup' : 'Intip'}</span>
                  </button>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {onNavigateToDashboard && (
                <button
                  type="button"
                  onClick={onNavigateToDashboard}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>M-Banking</span>
                </button>
              )}
              {onNavigateToGold && (
                <button
                  type="button"
                  onClick={onNavigateToGold}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Buka Emas 24K</span>
                </button>
              )}
              {onNavigateToMutasi && (
                <button
                  type="button"
                  onClick={onNavigateToMutasi}
                  className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Mutasi Rekening</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Saldo Rupiah</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-sm text-white">
                {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance)
                  ? '∞'
                  : formatRupiah(currentAccount.balance)}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Coins className="w-4 h-4 text-fuchsia-400" />
                <span>Saldo Coin Spin</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-sm text-amber-300">
                {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.spinCoins)
                  ? '∞'
                  : `${(currentAccount.spinCoins ?? 0).toLocaleString('id-ID')} Coin`}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 px-3.5 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Portofolio Emas 24K</span>
              </div>
              <span className="font-mono tabular-nums font-bold text-sm text-amber-200">
                {ownedGoldGrams.toFixed(3)} g · {formatRupiah(ownedGoldRupiah)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Struk Digital Berhasil + Tombol Kembali */}
      {transferReceipt && (
        <div className="rounded-3xl border border-emerald-500/45 bg-slate-900 p-5 space-y-4 shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-emerald-300">
                  Struk Transfer Berhasil{transferReceipt.fromQris ? ' (Scan QRIS Pribadi)' : ''}
                </h3>
                <p className="text-[11px] font-mono text-slate-400">
                  Ref {transferReceipt.referenceNo} · {transferReceipt.timestampText}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setTransferReceipt(null)}
              aria-label="Tutup struk transfer"
              className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Penerima</span>
                <span className="font-black text-white text-right">{transferReceipt.recipientName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">No. Rekening</span>
                <span className="font-mono font-bold text-amber-300">{transferReceipt.recipientAccount}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Bank Tujuan</span>
                <span className="font-bold text-slate-200">{transferReceipt.recipientBank}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Catatan</span>
                <span className="text-slate-300 text-right">{transferReceipt.note}</span>
              </div>
            </div>
            <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-800 pt-2 sm:pt-0 sm:pl-4">
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">Nominal Kirim</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  {formatRupiah(transferReceipt.amount)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-400">
                  Biaya Admin Wajib ({MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%)
                </span>
                <span className="font-mono font-bold text-amber-300 tabular-nums">
                  {formatRupiah(transferReceipt.adminFee)}
                </span>
              </div>
              <div className="flex justify-between gap-2 border-t border-slate-800 pt-1.5">
                <span className="font-bold text-slate-200">Total Dipotong</span>
                <span className="font-mono font-black text-emerald-300 tabular-nums">
                  {formatRupiah(transferReceipt.totalDeducted)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToDashboard && (
              <button
                type="button"
                onClick={onNavigateToDashboard}
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Dashboard</span>
              </button>
            )}
            {onNavigateToMutasi && (
              <button
                type="button"
                onClick={onNavigateToMutasi}
                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-600/20 hover:bg-blue-600/30 px-4 py-2 text-xs font-bold text-blue-200 whitespace-nowrap cursor-pointer"
              >
                <History className="h-4 w-4" />
                <span>Lihat Mutasi Rekening</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setTransferReceipt(null);
                setTransferSuccess('');
              }}
              className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 whitespace-nowrap cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Transfer Lagi</span>
            </button>
          </div>
        </div>
      )}

      {transferSuccess && !transferReceipt && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{transferSuccess}</span>
          </div>
          {onNavigateToMutasi && (
            <button
              type="button"
              onClick={onNavigateToMutasi}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold cursor-pointer shrink-0"
            >
              Lihat Mutasi
            </button>
          )}
        </div>
      )}

      {/* Self-Scan Guard Warning */}
      {qrisSelfScanAlert && (
        <div className="rounded-2xl border border-rose-500/50 bg-rose-950/80 p-4 text-xs text-rose-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{qrisSelfScanAlert}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setQrisSelfScanAlert('');
                setQrisScannerModal({ open: true, mode: 'camera' });
              }}
              className="min-h-[38px] rounded-xl bg-rose-500 hover:bg-rose-400 px-3.5 py-1.5 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
            >
              Scan QRIS Lain
            </button>
            <button
              type="button"
              onClick={() => setQrisSelfScanAlert('')}
              className="text-rose-300 hover:text-white font-bold cursor-pointer px-2 py-1"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Segmented Mode Switcher + Quick QRIS Camera / Gallery Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900/90 border border-slate-800 p-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setTransferMode('reguler')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              transferMode === 'reguler'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            Transfer Reguler (Antar Rekening)
          </button>
          <button
            type="button"
            onClick={() => setTransferMode('bebas')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              transferMode === 'bebas'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-amber-300 hover:text-white'
            }`}
          >
            Transfer Bebas 5% (Uang, Coin &amp; Emas)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setQrisScannerModal({ open: true, mode: 'camera' })}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Kamera QRIS</span>
          </button>
          <button
            type="button"
            onClick={() => setQrisScannerModal({ open: true, mode: 'gallery' })}
            className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-3.5 py-2 text-xs font-bold text-emerald-200 whitespace-nowrap cursor-pointer"
          >
            <ImageUp className="w-4 h-4" />
            <span>Upload Gambar QR</span>
          </button>
        </div>
      </div>

      {/* Verified QRIS Recipient Summary Card + Live 5% Admin Fee Breakdown */}
      {isQrisPrefillBanner && destAccount && (() => {
        const previewAmt = Math.max(0, parseInt(transferAmount, 10) || 0);
        const previewFee = calculateMandatoryTransferFee(previewAmt);
        const previewTotal = previewAmt + previewFee;
        return (
          <div className="rounded-3xl border border-sky-500/45 bg-slate-900 p-4 sm:p-5 space-y-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-sky-500/40 bg-sky-500/15 text-sky-300">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-white flex items-center gap-2">
                    <span>Penerima QRIS Pribadi Terverifikasi</span>
                  </p>
                  <p className="text-xs text-slate-300 mt-0.5">
                    <strong className="text-emerald-300">
                      {recipientLookup?.name || qrisPrefillRecipientLabel || 'Nasabah Bank Nusantara'}
                    </strong>{' '}
                    · <span className="font-mono text-amber-300">{destAccount}</span> · {destBank}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setQrisScannerModal({ open: true, mode: 'camera' })}
                  className="min-h-[36px] rounded-xl border border-sky-500/40 bg-sky-500/15 hover:bg-sky-500/25 px-3 py-1.5 text-xs font-bold text-sky-200 whitespace-nowrap cursor-pointer"
                >
                  Scan QRIS Lain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearPendingQrisTransfer();
                    setIsQrisPrefillBanner(false);
                  }}
                  className="min-h-[36px] rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 whitespace-nowrap cursor-pointer"
                >
                  Tutup Sesi
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5">
                <span className="text-[11px] text-slate-400 block">Nominal Kirim (Dapat Diubah)</span>
                <strong className="font-mono font-black text-white text-sm tabular-nums">
                  {previewAmt > 0 ? formatRupiah(previewAmt) : 'Isi nominal di bawah'}
                </strong>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-slate-950 px-3.5 py-2.5">
                <span className="text-[11px] text-amber-300 block">
                  Biaya Admin Wajib ({MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%)
                </span>
                <strong className="font-mono font-black text-amber-300 text-sm tabular-nums">
                  {formatRupiah(previewFee)}
                </strong>
              </div>
              <div className="rounded-xl border border-emerald-500/30 bg-slate-950 px-3.5 py-2.5">
                <span className="text-[11px] text-emerald-300 block">Total Potong Saldo</span>
                <strong className="font-mono font-black text-emerald-300 text-sm tabular-nums">
                  {formatRupiah(previewTotal)}
                </strong>
              </div>
            </div>
          </div>
        );
      })()}

      {transferMode === 'bebas' ? (
        <TransferBebasPanel
          onNavigateToMutasi={onNavigateToMutasi}
          initialAssetMode={initialBebasAssetMode}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Send className="w-5 h-5 text-emerald-400" />
                  <span>Transfer Antar Rekening &amp; Bank Lain</span>
                </h2>
                <span className="text-xs text-amber-300 font-bold whitespace-nowrap shrink-0">
                  Biaya Admin Wajib {MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Langkah 1 hingga 8: Masukkan nomor tujuan, cek nama penerima, isi nominal (biaya admin wajib {MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%), dan konfirmasi PIN Anda.
              </p>
            </div>

            {transferError && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{transferError}</span>
              </div>
            )}

            <form onSubmit={handleStartTransfer} className="space-y-4 text-xs">
              {/* Step 2: Bank Selection */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Langkah 2 — Pilih Jenis / Bank Tujuan:
                </label>
                <select
                  value={destBank}
                  onChange={(e) => {
                    setDestBank(e.target.value);
                    setRecipientLookup(null);
                  }}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                >
                  {SUPPORTED_BANKS.map((b) => (
                    <option key={b.code} value={b.name}>
                      {b.icon} {b.name} • Biaya Admin Wajib {MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: Destination Account Number */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">
                    Langkah 3 — Nomor Rekening Tujuan (10 Digit Unik):
                  </label>
                  <button
                    type="button"
                    onClick={handleLookupCheck}
                    className="text-blue-400 hover:underline cursor-pointer"
                  >
                    Cek Nama Pemilik
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={destAccount}
                    onChange={(e) => {
                      setDestAccount(e.target.value);
                      setRecipientLookup(null);
                    }}
                    placeholder="Contoh: 1029384756"
                    maxLength={16}
                    className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleLookupCheck}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Periksa
                  </button>
                </div>
              </div>

              {/* Step 4: System displays Recipient Name */}
              {recipientLookup && (
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    recipientLookup.found
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-rose-500/10 border-rose-500/40 text-rose-200'
                  }`}
                >
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">
                      Langkah 4 — Hasil Validasi Pemilik Rekening:
                    </span>
                    {recipientLookup.found ? (
                      <div className="font-bold text-sm text-emerald-300 mt-0.5 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>{recipientLookup.name}</span>
                      </div>
                    ) : (
                      <div className="font-semibold text-rose-300 mt-0.5">
                        Rekening tidak ditemukan! Pastikan 10 digit nomor rekening benar.
                      </div>
                    )}
                  </div>
                  {recipientLookup.found && (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                      Valid
                    </span>
                  )}
                </div>
              )}

              {/* Step 5: Transfer Amount */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Langkah 5 — Masukkan Jumlah Uang (Nominal):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-500 font-mono">Rp</span>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="100.000"
                    min="10000"
                    step="10000"
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 pl-10 font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {[100_000, 250_000, 500_000, 1_000_000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTransferAmount(amt.toString())}
                      className="text-[11px] px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 font-mono cursor-pointer"
                    >
                      +{formatRupiah(amt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note / Description */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Catatan Transaksi (Opsional):
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Contoh: Bayar sewa, tagihan listrik, dll."
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Save payee as favorite toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={saveAsFav}
                  onChange={(e) => setSaveAsFav(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span>Simpan nomor rekening ini ke daftar Rekening Favorit</span>
              </label>

              {/* Step 6 Button */}
              <button
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Langkah 6: Konfirmasi Rincian Transfer ➔</span>
              </button>
            </form>
          </div>

          {/* Right Column: Important Transfer Rules & Quick Payees */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Hal Penting tentang Transfer (Bab 7)</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>
                    <strong>Nomor rekening tujuan harus benar</strong>, karena setiap nomor itu unik
                    dan diacak sistem secara otomatis.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>
                    <strong>Cek nama penerima:</strong> Sebelum mengirim, sistem selalu memverifikasi
                    dan menampilkan nama pemilik rekening.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">!</span>
                  <span>
                    <strong>Jika nomor salah</strong>, uang bisa masuk ke rekening orang lain.
                    Periksa kembali sebelum konfirmasi.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold shrink-0">•</span>
                  <span>
                    <strong>Langsung Masuk:</strong> Transfer antar rekening Bank Nusantara diproses
                    seketika tanpa jeda waktu.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-400 font-bold shrink-0">•</span>
                  <span>
                    <strong>Riwayat tercatat:</strong> Semua mutasi transfer tersimpan aman dan
                    struk dapat dicetak ulang kapan saja.
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Daftar Rekening Favorit</span>
                </h3>
              </div>
              <div className="space-y-2">
                {favorites.map((fav) => (
                  <div
                    key={fav.id}
                    className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white block">{fav.ownerName}</span>
                      <span className="font-mono text-amber-300 text-[11px]">
                        {fav.accountNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block">{fav.bankName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setDestAccount(fav.accountNumber);
                          setDestBank(fav.bankName);
                          lookupAccount(
                            fav.accountNumber,
                            fav.bankName === 'Bank Nusantara' ? 'BNUS' : fav.bankName
                          );
                          setRecipientLookup({ found: true, name: fav.ownerName });
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-semibold cursor-pointer"
                      >
                        Pilih
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFavorite(fav.id)}
                        className="p-1 text-slate-400 hover:text-rose-400 cursor-pointer"
                        title="Hapus favorit"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TRANSFER CONFIRMATION MODAL (Step 6, 7, 8) */}
      {showTransferConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="text-center">
              <h3 className="font-bold text-lg text-white">Konfirmasi Rincian Transfer</h3>
              <p className="text-xs text-slate-400 mt-1">
                Langkah 6 &amp; 7: Periksa kembali detail dan masukkan PIN Anda
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center gap-2">
                <span className="text-slate-400">Pengirim (Anda):</span>
                <span className="font-mono font-bold text-slate-200 flex items-center gap-1.5">
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
                <span className="text-slate-400">Penerima:</span>
                <span className="font-bold text-emerald-400">{recipientLookup?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">No. Rekening Tujuan:</span>
                <span className="font-mono font-bold text-amber-300">{destAccount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank Tujuan:</span>
                <span>{destBank}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-400">Nominal Transfer:</span>
                <span className="font-mono font-bold text-white">
                  {formatRupiah(parseInt(transferAmount, 10) || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Biaya Admin Wajib ({MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%):
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {formatRupiah(calculateMandatoryTransferFee(parseInt(transferAmount, 10) || 0))}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2">
                <span className="text-slate-200 font-bold">Total Dipotong dari Saldo:</span>
                <span className="font-mono font-black text-emerald-300">
                  {formatRupiah(
                    (parseInt(transferAmount, 10) || 0) +
                      calculateMandatoryTransferFee(parseInt(transferAmount, 10) || 0)
                  )}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">
                Langkah 7: Masukkan 6 Digit Kode PIN Anda:
              </label>
              <input
                type="password"
                maxLength={6}
                value={transferPin}
                onChange={(e) => setTransferPin(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-xl p-3 font-mono text-center text-xl tracking-widest focus:outline-none focus:border-amber-400"
              />
            </div>

            {transferError && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs">
                {transferError}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleConfirmTransferSubmit}
                disabled={transferPin.length !== 6}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-emerald-600/30"
              >
                Langkah 8: Kirim Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowTransferConfirmModal(false)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
      <QrisScannerModal
        isOpen={qrisScannerModal.open}
        initialMode={qrisScannerModal.mode}
        onClose={() => setQrisScannerModal((prev) => ({ ...prev, open: false }))}
        onDetected={handleQrisDetectedInWorkspace}
      />
    </div>
  );
};
