import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  Clock,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  QrCode,
  Sparkles,
  Loader2,
  Download,
  Share2,
  Lock,
  Upload,
  Image as ImageIcon,
  Send,
  XCircle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';
import {
  QrisValidationError,
  requestCheckQrisPaymentStatus,
  requestCreateQrisPayment,
} from '../../buatQrisService';
import {
  buildQrisDownloadFilename,
  canDeviceSharePngFile,
  downloadPureQrisPng,
  generatePureQrisHdDataUrl,
  sharePureQrisPng,
} from '../utils/qrisDownload';
import { QrisPaymentOrder } from '../types/bank';
import { DiamondIcon, DiamondText } from './DiamondIcon';

const getOrderItemLabel = (order: QrisPaymentOrder): string => {
  if (order.diamondAmount && order.diamondAmount > 0) {
    return `Top-Up ${order.diamondAmount.toLocaleString('id-ID')} 💎`;
  }
  if (order.purpose === 'coin_topup') return 'Top-Up Coin Bank Nusantara';
  return 'Pembayaran Fitur Bank Nusantara';
};

const formatCountdown = (seconds: number): string => {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export const BuatQrisPaymentModal: React.FC = () => {
  const {
    activeQrisModalOrder,
    setActiveQrisModalOrder,
    registerQrisOrder,
    updateQrisOrderStatus,
    fulfillPaidQrisOrder,
    currentAccount,
    diamondConfig,
    recordLiveActivity,
    submitManualQrisProof,
    manualQrisSubmissions,
  } = useBank();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrRenderError, setQrRenderError] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [copiedField, setCopiedField] = useState<'amount' | 'orderId' | null>(null);
  const [isCheckingNow, setIsCheckingNow] = useState<boolean>(false);
  const [lastCheckNote, setLastCheckNote] = useState<string>('Menunggu pembayaran via QRIS...');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [paidSuccessBanner, setPaidSuccessBanner] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success' | 'error'>(
    'idle'
  );
  const [downloadFeedbackMsg, setDownloadFeedbackMsg] = useState<string>('');
  const [hdQrCache, setHdQrCache] = useState<{ orderId: string; dataUrl: string } | null>(null);
  const [showMobileFallbackPanel, setShowMobileFallbackPanel] = useState<boolean>(false);
  const [isSharingQr, setIsSharingQr] = useState<boolean>(false);
  const [proofImageDataUrl, setProofImageDataUrl] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [proofNote, setProofNote] = useState<string>('');
  const [proofFeedback, setProofFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingProof, setIsSubmittingProof] = useState<boolean>(false);

  const pollTimerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const downloadResetTimerRef = useRef<number | null>(null);
  const hasFulfilledRef = useRef<boolean>(false);

  const order = activeQrisModalOrder;
  const linkedManualSub = order
    ? manualQrisSubmissions.find((s) => s.orderId === order.orderId || s.id === order.manualSubmissionId)
    : undefined;

  // Render crisp local QR code directly from qrisString (base64 data URI, zero external URL)
  useEffect(() => {
    if (!order) {
      setQrDataUrl('');
      setPaidSuccessBanner(null);
      hasFulfilledRef.current = false;
      return;
    }

    hasFulfilledRef.current = order.status === 'LUNAS';
    setPaidSuccessBanner(
      order.status === 'LUNAS'
        ? `Pembayaran LUNAS! +${(order.diamondAmount || 0).toLocaleString('id-ID')} 💎 sudah masuk ke akun Anda.`
        : null
    );
    setQrRenderError('');
    setDownloadState('idle');
    setDownloadFeedbackMsg('');
    setShowMobileFallbackPanel(false);
    setProofFeedback(null);
    if (downloadResetTimerRef.current) {
      window.clearTimeout(downloadResetTimerRef.current);
      downloadResetTimerRef.current = null;
    }

    if (order.manualQrImageDataUrl) {
      setQrDataUrl(order.manualQrImageDataUrl);
      return;
    }

    if (order.qrisString) {
      let active = true;
      void QRCode.toDataURL(order.qrisString, {
        width: 360,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => {
          if (active) setQrDataUrl(url);
        })
        .catch(() => {
          if (active && order.qrisImageUrl) {
            setQrDataUrl(order.qrisImageUrl);
          } else if (active) {
            setQrRenderError('Gagal merender gambar QR Code dari string QRIS.');
          }
        });
      return () => {
        active = false;
      };
    } else if (order.qrisImageUrl) {
      setQrDataUrl(order.qrisImageUrl);
    } else {
      setQrDataUrl('');
    }
  }, [order?.orderId, order?.qrisString, order?.qrisImageUrl, order?.manualQrImageDataUrl, order?.status]);

  // Countdown timer (10 minutes)
  useEffect(() => {
    if (!order || order.status !== 'PENDING') {
      if (order?.status === 'EXPIRED') setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const expiresMs = new Date(order.expiresAt).getTime();
      const diffSec = Math.max(0, Math.ceil((expiresMs - Date.now()) / 1000));
      setRemainingSeconds(diffSec);
      if (diffSec <= 0 && order.status === 'PENDING') {
        updateQrisOrderStatus(order.orderId, 'EXPIRED');
        setLastCheckNote('Masa berlaku QRIS 10 menit telah habis.');
      }
    };

    updateTimer();
    const interval = window.setInterval(updateTimer, 1000);
    return () => window.clearInterval(interval);
  }, [order?.orderId, order?.expiresAt, order?.status]);

  // Auto-polling every 3 seconds against QRIS status endpoint
  const runStatusCheck = async (silent = true) => {
    if (!order || order.status !== 'PENDING' || hasFulfilledRef.current) return;
    if (!silent) setIsCheckingNow(true);
    try {
      const statusRes = await requestCheckQrisPaymentStatus(order.orderId);
      if (
        statusRes.status === 'PAID' ||
        statusRes.status === 'SUCCESS' ||
        statusRes.status === 'LUNAS'
      ) {
        hasFulfilledRef.current = true;
        const result = fulfillPaidQrisOrder(order.orderId, statusRes.providerReference);
        setPaidSuccessBanner(
          result.message ||
            `Pembayaran LUNAS! +${(order.diamondAmount || 0).toLocaleString('id-ID')} 💎 ditambahkan ke saldo Anda.`
        );
        setLastCheckNote('Status LUNAS terverifikasi otomatis oleh sistem QRIS Nusantara.');
        if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = window.setTimeout(() => {
          setActiveQrisModalOrder(null);
        }, 2200);
      } else if (statusRes.status === 'EXPIRED') {
        updateQrisOrderStatus(order.orderId, 'EXPIRED');
        setLastCheckNote('Tagihan QRIS kedaluwarsa. Silakan buat ulang QRIS.');
      } else {
        setLastCheckNote(
          `Menunggu konfirmasi pembayaran QRIS (${new Date().toLocaleTimeString('id-ID')})...`
        );
      }
    } catch {
      setLastCheckNote('Sedang menghubungi server QRIS Nusantara untuk sinkronisasi status...');
    } finally {
      if (!silent) setIsCheckingNow(false);
    }
  };

  useEffect(() => {
    if (!order || order.status !== 'PENDING') return;

    pollTimerRef.current = window.setInterval(() => {
      void runStatusCheck(true);
    }, 3000);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
      if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
      if (downloadResetTimerRef.current) window.clearTimeout(downloadResetTimerRef.current);
    };
  }, [order?.orderId, order?.status]);

  if (!order) return null;

  const isManualMode = order.modeUsed === 'manual';
  const isWaitingAdmin = order.status === 'MENUNGGU_ADMIN';
  const isRejected = order.status === 'DITOLAK';
  const isExpired = order.status === 'EXPIRED' || (order.status === 'PENDING' && remainingSeconds <= 0);
  const isPaid = order.status === 'LUNAS' || Boolean(paidSuccessBanner);
  const hasDisplayableQr = Boolean(order.qrisString || order.manualQrImageDataUrl || order.qrisImageUrl || qrDataUrl);
  const isDownloadDisabled = isExpired || isPaid || !hasDisplayableQr || downloadState === 'downloading';
  const expectedFilename = buildQrisDownloadFilename(order.orderId, order.totalAmount);
  const supportsShareFile = canDeviceSharePngFile(expectedFilename);

  const handleSelectProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProofFeedback({ type: 'error', text: 'File bukti harus berupa gambar (JPG/PNG/WebP).' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const rawUrl = String(reader.result || '');
      const img = new Image();
      img.onload = () => {
        const maxSide = 900;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setProofImageDataUrl(canvas.toDataURL('image/jpeg', 0.78));
        } else {
          setProofImageDataUrl(rawUrl);
        }
        setProofFileName(file.name);
        setProofFeedback(null);
      };
      img.onerror = () => {
        setProofImageDataUrl(rawUrl);
        setProofFileName(file.name);
      };
      img.src = rawUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitManualProof = () => {
    if (!proofImageDataUrl) {
      setProofFeedback({ type: 'error', text: 'Silakan unggah foto/screenshot bukti transfer terlebih dahulu.' });
      return;
    }
    setIsSubmittingProof(true);
    const res = submitManualQrisProof({
      orderId: order.orderId,
      proofImageDataUrl,
      proofFileName,
      note: proofNote,
    });
    setIsSubmittingProof(false);
    setProofFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const logQrisDownloadActivity = (methodLabel: string) => {
    if (!currentAccount) return;
    recordLiveActivity({
      actorRole: 'nasabah',
      category: 'transaction',
      accountId: currentAccount.id,
      accountName: currentAccount.fullName,
      accountNumber: currentAccount.accountNumber,
      cardTier: currentAccount.cardTier,
      actionTitle: 'Unduh Gambar QRIS HD (1080px)',
      description: `Nasabah mengunduh file ${expectedFilename} (${formatRupiah(order.totalAmount)}) dari Modal Pembayaran QRIS (${methodLabel}).`,
      amountRupiah: order.totalAmount,
    });
  };

  const handleDownloadQris = async () => {
    if (isDownloadDisabled) return;
    setDownloadState('downloading');
    setDownloadFeedbackMsg('');
    try {
      if (!order.qrisString && (order.manualQrImageDataUrl || qrDataUrl)) {
        const directUrl = order.manualQrImageDataUrl || qrDataUrl;
        const a = document.createElement('a');
        a.href = directUrl;
        a.download = expectedFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setDownloadState('success');
        setDownloadFeedbackMsg(`Gambar QR (${expectedFilename}) berhasil diunduh!`);
        logQrisDownloadActivity('Unduh Gambar QR Manual');
        downloadResetTimerRef.current = window.setTimeout(() => setDownloadState('idle'), 2000);
        return;
      }
      const cachedUrl = hdQrCache && hdQrCache.orderId === order.orderId ? hdQrCache.dataUrl : undefined;
      const result = await downloadPureQrisPng(
        {
          orderId: order.orderId,
          totalAmount: order.totalAmount,
          qrisString: order.qrisString,
        },
        cachedUrl
      );

      if (result.dataUrl) {
        setHdQrCache({ orderId: order.orderId, dataUrl: result.dataUrl });
      }

      if (result.success) {
        setDownloadState('success');
        setDownloadFeedbackMsg(`File ${result.filename} (PNG HD 1080px) siap di-upload ke e-wallet.`);
        if (result.suggestFallbackPanel) {
          setShowMobileFallbackPanel(true);
        }
        logQrisDownloadActivity(result.suggestFallbackPanel ? 'Unduh + Fallback HP' : 'Unduh Langsung');
        if (downloadResetTimerRef.current) window.clearTimeout(downloadResetTimerRef.current);
        downloadResetTimerRef.current = window.setTimeout(() => {
          setDownloadState('idle');
        }, 2000);
      } else {
        setDownloadState('error');
        setShowMobileFallbackPanel(true);
        setDownloadFeedbackMsg(
          result.error || 'Unduhan langsung dibatasi browser. Gunakan panel Simpan / Bagikan di bawah.'
        );
      }
    } catch {
      setDownloadState('error');
      setDownloadFeedbackMsg('Gagal menyiapkan gambar QRIS HD. Silakan tekan Unduh Qris kembali.');
    }
  };

  const handleShareQris = async () => {
    if (isExpired || isPaid || !order.qrisString || isSharingQr) return;
    setIsSharingQr(true);
    try {
      let dataUrl = hdQrCache && hdQrCache.orderId === order.orderId ? hdQrCache.dataUrl : '';
      if (!dataUrl) {
        dataUrl = await generatePureQrisHdDataUrl(order.qrisString);
        setHdQrCache({ orderId: order.orderId, dataUrl });
      }
      const shareOutcome = await sharePureQrisPng(dataUrl, expectedFilename);
      if (shareOutcome === 'shared') {
        setDownloadState('success');
        setDownloadFeedbackMsg('QRIS HD 1080px berhasil dibagikan / disimpan ke perangkat.');
        logQrisDownloadActivity('Bagikan / Simpan HP');
        if (downloadResetTimerRef.current) window.clearTimeout(downloadResetTimerRef.current);
        downloadResetTimerRef.current = window.setTimeout(() => {
          setDownloadState('idle');
        }, 2000);
      } else if (shareOutcome === 'unsupported') {
        setShowMobileFallbackPanel(true);
        setDownloadFeedbackMsg(
          'Browser ini belum mendukung Bagikan File langsung. Tekan lama gambar QRIS di bawah lalu pilih Simpan ke Foto.'
        );
      }
    } catch {
      setShowMobileFallbackPanel(true);
      setDownloadFeedbackMsg(
        'Gagal membuka menu Bagikan. Tekan lama gambar QRIS HD di bawah lalu pilih Simpan ke Foto.'
      );
    } finally {
      setIsSharingQr(false);
    }
  };

  const handleToggleMobileFallback = async () => {
    const nextOpen = !showMobileFallbackPanel;
    setShowMobileFallbackPanel(nextOpen);
    if (nextOpen && order.qrisString && (!hdQrCache || hdQrCache.orderId !== order.orderId)) {
      try {
        const hdUrl = await generatePureQrisHdDataUrl(order.qrisString);
        setHdQrCache({ orderId: order.orderId, dataUrl: hdUrl });
      } catch {
        // Tetap tampilkan qrDataUrl jika gagal
      }
    }
  };

  const handleCopy = async (value: string, field: 'amount' | 'orderId') => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard fallback
    }
  };

  const handleRegenerateQris = async () => {
    if (isRegenerating || !currentAccount) return;
    setIsRegenerating(true);
    try {
      const freshOrderId = `BN-DIA-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const res = await requestCreateQrisPayment({
        orderId: freshOrderId,
        accountId: currentAccount.id,
        amount: order.baseAmount,
        diamondAmount: order.diamondAmount,
        purpose: order.purpose,
        customerName: currentAccount.fullName,
        description: getOrderItemLabel(order),
        useUniqueCode: true,
        expiryMinutes: 10,
        clientBaseDiamondPriceRupiah: diamondConfig.baseDiamondPriceRupiah,
        clientDiamondDiscountPercent: diamondConfig.diamondDiscountPercent,
      });

      if (res.success) {
        const freshOrder: QrisPaymentOrder = {
          orderId: res.orderId,
          externalInvoiceId: res.externalInvoiceId,
          accountId: currentAccount.id,
          accountName: currentAccount.fullName,
          purpose: order.purpose,
          diamondAmount: order.diamondAmount,
          baseAmount: res.baseAmount,
          uniqueCode: res.uniqueCode,
          totalAmount: res.totalAmount,
          discountPercentApplied: order.discountPercentApplied,
          modeUsed: res.modeUsed,
          configReady: res.configReady,
          configNotice: res.configNotice,
          status: 'PENDING',
          qrisString: res.qrisString,
          qrisImageUrl: res.qrisImageUrl,
          manualQrImageDataUrl: res.manualQrImageDataUrl,
          manualPaymentNote: res.manualPaymentNote,
          createdAt: res.createdAt || new Date().toISOString(),
          expiresAt: res.expiresAt,
        };
        registerQrisOrder(freshOrder);
        setActiveQrisModalOrder(freshOrder);
        setLastCheckNote(
          res.configNotice ||
            'QRIS baru berhasil dibuat. Silakan scan dan bayar sesuai nominal tepat.'
        );
      } else {
        setLastCheckNote(res.configNotice || 'Gagal membuat ulang tagihan QRIS. Silakan coba lagi.');
      }
    } catch (err) {
      const errMsg =
        err instanceof QrisValidationError
          ? err.message
          : err instanceof Error && err.message.trim()
          ? err.message.trim()
          : 'Gagal membuat ulang tagihan QRIS. Silakan tekan tombol Buat Ulang QRIS.';
      setLastCheckNote(errMsg);
      recordLiveActivity({
        actorRole: 'nasabah',
        category: 'transaction',
        accountId: currentAccount.id,
        accountName: currentAccount.fullName,
        accountNumber: currentAccount.accountNumber,
        cardTier: currentAccount.cardTier,
        actionTitle: 'Gagal Buat Ulang Tagihan QRIS',
        description: `Gagal buat ulang QRIS (${order.orderId}): ${errMsg}`,
        amountRupiah: order.baseAmount,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 px-5 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 ring-1 ring-sky-400/30">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Pembayaran QRIS Nusantara</h2>
              <p className="text-xs text-sky-200/80">
                {order.modeUsed === 'manual'
                  ? 'Mode QRIS Manual Admin (Verifikasi Bukti Instan)'
                  : order.modeUsed === 'api'
                  ? 'Mode Bot BuatQRIS Live'
                  : 'Mode QRIS Dinamis EMVCo (CRC16-CCITT)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveQrisModalOrder(null)}
            className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white"
            aria-label="Tutup modal QRIS"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5 space-y-4">
          {paidSuccessBanner && (
            <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <p className="text-sm font-black">PEMBAYARAN LUNAS!</p>
                <p className="mt-0.5 text-xs font-medium text-emerald-800">
                  <DiamondText text={paidSuccessBanner} />
                </p>
              </div>
            </div>
          )}

          {order.configNotice && !isPaid && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-[11px] font-semibold text-sky-900">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
              <span>{order.configNotice}</span>
            </div>
          )}

          {/* Order Summary & Timer */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Item Pembelian
              </p>
              <p className="text-sm font-black text-slate-900">
                <DiamondText text={getOrderItemLabel(order)} iconClassName="h-4 w-4 mx-0.5" />
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black tabular-nums ${
                isPaid
                  ? 'bg-emerald-100 text-emerald-800'
                  : isWaitingAdmin
                  ? 'bg-amber-100 text-amber-800'
                  : isRejected
                  ? 'bg-rose-100 text-rose-800'
                  : isExpired
                  ? 'bg-rose-100 text-rose-800'
                  : remainingSeconds <= 120
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-sky-100 text-sky-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {isPaid
                ? 'LUNAS'
                : isWaitingAdmin
                ? 'MENUNGGU ADMIN'
                : isRejected
                ? 'DITOLAK'
                : isExpired
                ? 'EXPIRED'
                : `Berlaku ${formatCountdown(remainingSeconds)}`}
            </div>
          </div>

          {isWaitingAdmin && !isPaid && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
              <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-amber-600" />
              <div>
                <p className="text-xs font-black">Bukti Transfer Sedang Ditinjau Admin</p>
                <p className="mt-0.5 text-[11px] text-amber-800">
                  Admin menerima notifikasi instan. Begitu Admin menekan Setujui Instan, Diamond langsung masuk ke akun Anda!
                </p>
              </div>
            </div>
          )}

          {isRejected && !isPaid && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-950">
              <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div>
                <p className="text-xs font-black">Bukti Transfer Ditolak Admin</p>
                <p className="mt-0.5 text-[11px] text-rose-800">
                  {linkedManualSub?.adminNote || 'Bukti belum sesuai. Anda dapat mengunggah ulang bukti transfer yang benar di bawah.'}
                </p>
              </div>
            </div>
          )}

          {/* Exact Payable Amount (kode unik tetap dihitung otomatis ke totalAmount tanpa ditampilkan) */}
          <div className="rounded-2xl border-2 border-sky-200 bg-sky-50/60 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                  Nominal Tepat yang Harus Dibayar
                </p>
                <p className="mt-0.5 text-2xl font-black tracking-tight text-slate-950 tabular-nums">
                  {formatRupiah(order.totalAmount)}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Bayar persis sesuai nominal di atas agar verifikasi otomatis langsung berhasil.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(String(order.totalAmount), 'amount')}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
              >
                {copiedField === 'amount' ? (
                  <>
                    <Check className="h-4 w-4" />
                    Tersalin
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Salin Nominal
                  </>
                )}
              </button>
            </div>
          </div>

          {/* QR Code Frame */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-4 shadow-inner">
            <div className="relative flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Kode QRIS Nusantara"
                  className={`h-60 w-60 rounded-xl object-contain transition ${
                    isExpired ? 'opacity-25 grayscale' : ''
                  }`}
                />
              ) : (
                <div className="flex h-60 w-60 flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-4 text-center text-slate-500">
                  {qrRenderError ? (
                    <>
                      <AlertTriangle className="h-8 w-8 text-amber-500" />
                      <p className="text-xs font-semibold">{qrRenderError}</p>
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-7 w-7 animate-spin text-sky-600" />
                      <p className="text-xs font-semibold">Menyiapkan QRIS...</p>
                    </>
                  )}
                </div>
              )}

              {isExpired && !isPaid && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-900/65 p-4 text-center text-white backdrop-blur-[2px]">
                  <AlertTriangle className="mb-2 h-8 w-8 text-amber-400" />
                  <p className="text-sm font-black">QRIS Kedaluwarsa</p>
                  <p className="mt-1 text-[11px] text-slate-200">
                    Batas waktu 10 menit berakhir. Buat ulang QRIS baru untuk melanjutkan.
                  </p>
                </div>
              )}
            </div>

            {/* Primary Full-Width "Unduh Qris" Button right below QR Code */}
            <div className="mt-3.5 w-full space-y-2">
              <button
                type="button"
                onClick={() => void handleDownloadQris()}
                disabled={isDownloadDisabled}
                aria-label="Unduh Qris"
                className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black shadow-md transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 whitespace-nowrap ${
                  isPaid || isExpired
                    ? 'cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500 shadow-none'
                    : downloadState === 'success'
                    ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                    : 'bg-gradient-to-r from-sky-600 via-cyan-600 to-blue-600 text-white shadow-sky-600/25 hover:from-sky-500 hover:via-cyan-500 hover:to-blue-500 active:scale-[0.98] disabled:opacity-60'
                }`}
              >
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    <span>Pembayaran Sudah Lunas</span>
                  </>
                ) : isExpired ? (
                  <>
                    <Lock className="h-4 w-4 shrink-0 text-slate-400" />
                    <span>QRIS Kedaluwarsa — Tidak Dapat Diunduh</span>
                  </>
                ) : downloadState === 'downloading' ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    <span>Menyiapkan PNG HD 1080px...</span>
                  </>
                ) : downloadState === 'success' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>QRIS Berhasil Diunduh</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Unduh Qris</span>
                  </>
                )}
              </button>

              {!isPaid && !isExpired && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-slate-500">
                  <span>PNG HD 1080px (Hanya QRIS) · Siap upload ke e-wallet</span>
                  <div className="flex items-center gap-2">
                    {supportsShareFile && (
                      <button
                        type="button"
                        onClick={() => void handleShareQris()}
                        disabled={isSharingQr}
                        className="inline-flex items-center gap-1 font-bold text-sky-700 hover:text-sky-900 whitespace-nowrap disabled:opacity-50"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>{isSharingQr ? 'Membagikan...' : 'Bagikan / Simpan HP'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleToggleMobileFallback()}
                      className="font-semibold text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline whitespace-nowrap"
                    >
                      {showMobileFallbackPanel ? 'Tutup Bantuan HP' : 'Tidak Terunduh di HP?'}
                    </button>
                  </div>
                </div>
              )}

              {downloadFeedbackMsg && (
                <p
                  className={`rounded-xl border px-3 py-2 text-[11px] font-semibold ${
                    downloadState === 'error'
                      ? 'border-amber-200 bg-amber-50 text-amber-900'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {downloadFeedbackMsg}
                </p>
              )}

              {showMobileFallbackPanel && !isPaid && !isExpired && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-slate-900">
                        Simpan Manual di HP (iOS Safari / WebView)
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        Tekan lama gambar QRIS HD di bawah lalu pilih <strong>Simpan ke Foto</strong>, atau gunakan tombol Bagikan.
                      </p>
                    </div>
                  </div>
                  {(hdQrCache?.orderId === order.orderId ? hdQrCache.dataUrl : qrDataUrl) && (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-3">
                      <img
                        src={hdQrCache?.orderId === order.orderId ? hdQrCache.dataUrl : qrDataUrl}
                        alt={`QRIS HD ${order.orderId}`}
                        className="h-44 w-44 rounded-lg object-contain"
                      />
                      <p className="font-mono text-[10px] text-slate-500 break-all text-center">
                        {expectedFilename}
                      </p>
                      {supportsShareFile && (
                        <button
                          type="button"
                          onClick={() => void handleShareQris()}
                          disabled={isSharingQr}
                          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-sky-700 disabled:opacity-50"
                        >
                          <Share2 className="h-3.5 w-3.5" />
                          <span>{isSharingQr ? 'Membuka Menu Bagikan...' : 'Bagikan / Simpan ke Galeri'}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reference / Order ID */}
            <div className="mt-3 flex w-full items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <div className="min-w-0 break-all">
                <span className="font-semibold text-slate-500">Order ID: </span>
                <span className="font-mono font-bold text-slate-800">{order.orderId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(order.orderId, 'orderId')}
                className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
              >
                {copiedField === 'orderId' ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    Disalin
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Salin
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Panel Unggah Bukti Transfer untuk Mode QR Manual Admin */}
          {(isManualMode || isWaitingAdmin || isRejected) && !isPaid && !isExpired && (
            <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4 text-indigo-600" />
                  <p className="text-xs font-black text-indigo-950">
                    Konfirmasi Pembayaran QR Manual (Persetujuan Instan Admin)
                  </p>
                </div>
              </div>
              {order.manualPaymentNote && (
                <p className="rounded-xl border border-indigo-200 bg-white px-3 py-2 text-[11px] font-medium text-indigo-900">
                  Catatan Admin: {order.manualPaymentNote}
                </p>
              )}
              <div className="space-y-2.5">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-indigo-300 bg-white px-4 py-3 text-xs font-bold text-indigo-700 transition hover:bg-indigo-50">
                  <ImageIcon className="h-4 w-4 shrink-0" />
                  <span>{proofFileName ? `File dipilih: ${proofFileName}` : 'Pilih Foto / Screenshot Bukti Transfer'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSelectProofFile}
                    className="hidden"
                  />
                </label>
                {proofImageDataUrl && (
                  <div className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-white p-2.5">
                    <img
                      src={proofImageDataUrl}
                      alt="Pratinjau bukti transfer"
                      className="h-14 w-14 rounded-lg object-cover border border-slate-200"
                    />
                    <div className="min-w-0 flex-1 text-[11px] text-slate-600">
                      <p className="font-bold text-slate-800 truncate">{proofFileName || 'Bukti Transfer'}</p>
                      <p>Siap dikirim ke antrean persetujuan instan Admin.</p>
                    </div>
                  </div>
                )}
                <input
                  type="text"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Catatan opsional (misal: Nama pengirim e-wallet / jam transfer)..."
                  className="w-full rounded-xl border border-indigo-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none"
                />
                {proofFeedback && (
                  <p
                    className={`rounded-xl border px-3 py-2 text-[11px] font-bold ${
                      proofFeedback.type === 'success'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-rose-200 bg-rose-50 text-rose-800'
                    }`}
                  >
                    {proofFeedback.text}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSubmitManualProof}
                  disabled={isSubmittingProof || !proofImageDataUrl}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  <span>{isWaitingAdmin ? 'Kirim Ulang Bukti Transfer' : 'Kirim Bukti Pembayaran ke Admin'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Live Status Polling Bar */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {isManualMode
                    ? 'Verifikasi Manual Admin & Sinkronisasi Real-Time'
                    : 'Sinkronisasi Live QRIS (Auto-cek tiap 3 detik)'}
                </span>
              </div>
              {!isExpired && !isPaid && (
                <button
                  type="button"
                  onClick={() => void runStatusCheck(false)}
                  disabled={isCheckingNow}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isCheckingNow ? 'animate-spin' : ''}`} />
                  Cek Status
                </button>
              )}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">{lastCheckNote}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          {isExpired && !isPaid ? (
            <button
              type="button"
              onClick={() => void handleRegenerateQris()}
              disabled={isRegenerating}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-600 px-4 py-3 text-sm font-black text-white shadow-md transition hover:bg-sky-700 disabled:opacity-60"
            >
              {isRegenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Buat Ulang QRIS
            </button>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" />
                <span className="inline-flex items-center gap-1">
                  <DiamondIcon className="h-3.5 w-3.5" /> masuk otomatis saat status LUNAS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setActiveQrisModalOrder(null)}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                Tutup
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
