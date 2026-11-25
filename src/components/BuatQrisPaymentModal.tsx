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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';
import {
  requestCheckQrisPaymentStatus,
  requestCreateQrisPayment,
} from '../../buatQrisService';
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
  } = useBank();

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrRenderError, setQrRenderError] = useState<string>('');
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [copiedField, setCopiedField] = useState<'amount' | 'orderId' | null>(null);
  const [isCheckingNow, setIsCheckingNow] = useState<boolean>(false);
  const [lastCheckNote, setLastCheckNote] = useState<string>('Menunggu pembayaran via QRIS...');
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);
  const [paidSuccessBanner, setPaidSuccessBanner] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const autoCloseTimerRef = useRef<number | null>(null);
  const hasFulfilledRef = useRef<boolean>(false);

  const order = activeQrisModalOrder;

  // Render crisp QR code from qrisString or use qrisImageUrl from BuatQRIS API
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

    if (order.qrisImageUrl) {
      setQrDataUrl(order.qrisImageUrl);
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
          if (active) setQrRenderError('Gagal merender gambar QR Code dari string QRIS.');
        });
      return () => {
        active = false;
      };
    } else {
      setQrDataUrl('');
    }
  }, [order?.orderId, order?.qrisString, order?.qrisImageUrl, order?.status]);

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

  // Auto-polling every 3 seconds strictly against BuatQRIS status endpoint
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
        setLastCheckNote('Status LUNAS diterima langsung dari BuatQRIS.');
        if (autoCloseTimerRef.current) window.clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = window.setTimeout(() => {
          setActiveQrisModalOrder(null);
        }, 2200);
      } else if (statusRes.status === 'EXPIRED') {
        updateQrisOrderStatus(order.orderId, 'EXPIRED');
        setLastCheckNote('Tagihan QRIS kedaluwarsa. Silakan buat ulang QRIS.');
      } else {
        setLastCheckNote(
          `Menunggu konfirmasi live BuatQRIS (${new Date().toLocaleTimeString('id-ID')})...`
        );
      }
    } catch {
      setLastCheckNote('Sedang menghubungi server BuatQRIS untuk sinkronisasi status...');
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
    };
  }, [order?.orderId, order?.status]);

  if (!order) return null;

  const isExpired = order.status === 'EXPIRED' || remainingSeconds <= 0;
  const isPaid = order.status === 'LUNAS' || Boolean(paidSuccessBanner);

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
          createdAt: res.createdAt || new Date().toISOString(),
          expiresAt: res.expiresAt,
        };
        registerQrisOrder(freshOrder);
        setActiveQrisModalOrder(freshOrder);
        setLastCheckNote('QRIS baru berhasil dibuat. Silakan scan dan bayar sesuai nominal tepat.');
      } else {
        setLastCheckNote('Gagal membuat ulang tagihan QRIS.');
      }
    } catch {
      setLastCheckNote('Gagal menghubungi server BuatQRIS saat membuat ulang QRIS.');
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
              <h2 className="text-base font-black tracking-tight">Pembayaran BuatQRIS</h2>
              <p className="text-xs text-sky-200/80">
                {order.modeUsed === 'api'
                  ? 'Mode Gateway API BuatQRIS Live'
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
                  : isExpired
                  ? 'bg-rose-100 text-rose-800'
                  : remainingSeconds <= 120
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-sky-100 text-sky-900'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              {isPaid ? 'LUNAS' : isExpired ? 'EXPIRED' : `Berlaku ${formatCountdown(remainingSeconds)}`}
            </div>
          </div>

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
                  alt="Kode QRIS BuatQRIS"
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

            {order.configNotice && !isExpired && !isPaid && (
              <div className="mt-3 w-full rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                {order.configNotice}
              </div>
            )}

            {/* Reference / Order ID */}
            <div className="mt-3 flex w-full items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
              <div className="truncate">
                <span className="font-semibold text-slate-500">Order ID: </span>
                <span className="font-mono font-bold text-slate-800">{order.orderId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(order.orderId, 'orderId')}
                className="ml-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-slate-200"
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

          {/* Live Status Polling Bar (No Simulation Button - Live BuatQRIS Only) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Sinkronisasi Live BuatQRIS (Auto-cek tiap 3 detik)</span>
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
