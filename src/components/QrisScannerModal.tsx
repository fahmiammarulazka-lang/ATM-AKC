import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImageUp,
  RefreshCw,
  X,
  AlertTriangle,
  ScanLine,
  Loader2,
  Link2,
  ArrowRight,
  UserCheck,
  Send,
  Sparkles,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import {
  ClassifiedScannedQrPayload,
  classifyScannedQrPayload,
  decodeQrFromCanvas,
  decodeQrFromImageFile,
  formatMultiAssetSummaryLabel,
} from '../utils/qrisTransferUtils';
import { OFFICIAL_BUATQRIS_MERCHANT_INFO } from '../../buatQrisService';
import { formatRupiah } from '../utils/bankUtils';

export type QrScannerPurpose = 'universal' | 'transfer_only' | 'qrp_only';

interface QrisScannerModalProps {
  isOpen: boolean;
  initialMode?: 'camera' | 'gallery' | 'paste';
  scannerPurpose?: QrScannerPurpose;
  onClose: () => void;
  onDetected: (rawText: string, source: 'camera' | 'gallery' | 'manual') => void;
}

export const QrisScannerModal: React.FC<QrisScannerModalProps> = ({
  isOpen,
  initialMode = 'camera',
  scannerPurpose = 'transfer_only',
  onClose,
  onDetected,
}) => {
  const [mode, setMode] = useState<'camera' | 'gallery' | 'paste'>(initialMode);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [galleryBusy, setGalleryBusy] = useState<boolean>(false);
  const [pasteInput, setPasteInput] = useState<string>('');
  const [showGoogleLensGuide, setShowGoogleLensGuide] = useState<boolean>(false);

  // State peringatan Salah Kamera atau hasil deteksi multi-pilihan di Kamera Universal
  const [wrongCameraState, setWrongCameraState] = useState<{
    expected: QrScannerPurpose;
    detectedKind: 'qrp_profile' | 'qris_transfer' | 'qris_diamond_merchant';
    classified: ClassifiedScannedQrPayload;
    source: 'camera' | 'gallery' | 'manual';
  } | null>(null);

  const [universalChoiceState, setUniversalChoiceState] = useState<{
    classified: ClassifiedScannedQrPayload;
    source: 'camera' | 'gallery' | 'manual';
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const decodingRef = useRef<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    decodingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const evaluateRawDetection = useCallback(
    (rawText: string, source: 'camera' | 'gallery' | 'manual') => {
      const clean = String(rawText || '').trim();
      if (!clean) return;
      stopCamera();
      setErrorMessage('');
      setWrongCameraState(null);
      setUniversalChoiceState(null);

      const classified = classifyScannedQrPayload(clean);

      // 1. Jika Kamera Khusus Transfer (tab QRIS Pribadi / Halaman Transfer) dipakai scan QRP Profil -> SALAH KAMERA!
      if (scannerPurpose === 'transfer_only' && classified.kind === 'qrp_profile') {
        setWrongCameraState({
          expected: 'transfer_only',
          detectedKind: 'qrp_profile',
          classified,
          source,
        });
        return;
      }

      // 2. Jika Kamera Khusus Transfer dipakai scan kode QRIS Top-Up Permata buatqris.site -> SALAH KAMERA!
      if (scannerPurpose === 'transfer_only' && classified.kind === 'qris_diamond_merchant') {
        setWrongCameraState({
          expected: 'transfer_only',
          detectedKind: 'qris_diamond_merchant',
          classified,
          source,
        });
        return;
      }

      // 3. Jika Kamera Khusus QRP Profil dipakai scan QRIS Pribadi Transfer -> SALAH KAMERA!
      if (scannerPurpose === 'qrp_only' && classified.kind === 'qris_transfer') {
        setWrongCameraState({
          expected: 'qrp_only',
          detectedKind: 'qris_transfer',
          classified,
          source,
        });
        return;
      }

      // 4. Jika Kamera Khusus QRP Profil dipakai scan QRIS Top-Up Permata -> SALAH KAMERA!
      if (scannerPurpose === 'qrp_only' && classified.kind === 'qris_diamond_merchant') {
        setWrongCameraState({
          expected: 'qrp_only',
          detectedKind: 'qris_diamond_merchant',
          classified,
          source,
        });
        return;
      }

      // 5. Jika Kamera Scan Universal (paling bawah M-Banking) mendeteksi QRIS Top-Up Permata atau Nomor Rekening/UID umum
      if (
        scannerPurpose === 'universal' &&
        (classified.kind === 'qris_diamond_merchant' || classified.kind === 'account_or_uid')
      ) {
        setUniversalChoiceState({ classified, source });
        return;
      }

      onDetected(clean, source);
    },
    [scannerPurpose, stopCamera, onDetected]
  );

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
      setPasteInput('');
      setWrongCameraState(null);
      setUniversalChoiceState(null);
    } else {
      stopCamera();
      setCameraStatus('idle');
    }
  }, [isOpen, initialMode, stopCamera]);

  useEffect(() => {
    if (!isOpen || mode !== 'camera' || wrongCameraState || universalChoiceState) {
      stopCamera();
      return;
    }

    let cancelled = false;
    setCameraStatus('starting');
    setErrorMessage('');

    const startCamera = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        if (!cancelled) {
          setCameraStatus('error');
          setShowGoogleLensGuide(true);
          setErrorMessage(
            'Browser ini tidak mendukung akses kamera langsung. Gunakan Upload Gambar QR dari galeri atau pindai lewat Google Lens.'
          );
        }
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
        }
        setCameraStatus('active');

        const scanFrame = async () => {
          if (cancelled) return;
          const v = videoRef.current;
          const c = canvasRef.current;
          if (v && c && v.readyState >= 2 && v.videoWidth > 0 && !decodingRef.current) {
            decodingRef.current = true;
            try {
              const targetW = Math.min(720, v.videoWidth);
              const scale = targetW / v.videoWidth;
              const targetH = Math.max(1, Math.round(v.videoHeight * scale));
              c.width = targetW;
              c.height = targetH;
              const ctx = c.getContext('2d', { willReadFrequently: true });
              if (ctx) {
                ctx.drawImage(v, 0, 0, targetW, targetH);
                const detected = await decodeQrFromCanvas(c, ctx);
                if (detected && !cancelled) {
                  evaluateRawDetection(detected, 'camera');
                  return;
                }
              }
            } finally {
              decodingRef.current = false;
            }
          }
          if (!cancelled) {
            rafRef.current = window.requestAnimationFrame(() => {
              void scanFrame();
            });
          }
        };

        rafRef.current = window.requestAnimationFrame(() => {
          void scanFrame();
        });
      } catch (err) {
        if (!cancelled) {
          setCameraStatus('error');
          setShowGoogleLensGuide(true);
          const msg = err instanceof Error ? err.message : '';
          setErrorMessage(
            msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission')
              ? 'Izin kamera ditolak oleh browser. Aktifkan izin kamera, pilih Upload Gambar QR dari galeri, atau gunakan Google Lens di HP Anda.'
              : 'Kamera tidak tersedia atau sedang dipakai aplikasi lain. Gunakan Upload Gambar QR atau pindai cepat lewat Google Lens.'
          );
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, mode, facingMode, wrongCameraState, universalChoiceState, stopCamera, evaluateRawDetection]);

  const handleGalleryFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setGalleryBusy(true);
    setErrorMessage('');
    try {
      const decoded = await decodeQrFromImageFile(file);
      if (!decoded) {
        setErrorMessage(
          'Kode QR tidak terbaca pada gambar tersebut. Pastikan gambar QRP / QRIS jelas, utuh, atau pindai lewat Google Lens lalu tempel tautannya.'
        );
      } else {
        evaluateRawDetection(decoded, 'gallery');
      }
    } catch {
      setErrorMessage('Gagal memproses gambar. Coba pilih file PNG/JPG QRP atau QRIS yang lain.');
    } finally {
      setGalleryBusy(false);
    }
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = pasteInput.trim();
    if (!clean) {
      setErrorMessage('Tempel tautan QRP, tautan QRIS Pribadi, atau Nomor Rekening / ID 16 Digit terlebih dahulu.');
      return;
    }
    evaluateRawDetection(clean, 'manual');
  };

  if (!isOpen) return null;

  const headerMeta =
    scannerPurpose === 'universal'
      ? {
          badge: 'KAMERA SCAN UNIVERSAL M-BANKING',
          title: 'Pemindai Universal (QRP Profil & QRIS Multi-Aset)',
          subtitle:
            'Mendukung semua kode: QRP Statistik Umum, QRIS Pribadi Multi-Aset, & QRIS Top-Up Permata (buatqris.site).',
          accentClass: 'border-amber-500/40 bg-amber-500/15 text-amber-300',
        }
      : scannerPurpose === 'qrp_only'
      ? {
          badge: 'PEMINDAI KHUSUS QRP PROFIL',
          title: 'Pindai QRP (QR Profil Statistik Umum)',
          subtitle:
            'Khusus melihat Statistik Umum nasabah (Level Akun, Gelar, Achievement, Streak, No. Rekening).',
          accentClass: 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300',
        }
      : {
          badge: 'PEMINDAI KHUSUS TRANSFER QRIS PRIBADI',
          title: 'Pindai QRIS Pribadi (Khusus Transfer Multi-Aset)',
          subtitle:
            'Khusus mengirim Saldo Rupiah, Emas 24K, Coin Spin, Permata, Token, atau Paket Gabungan.',
          accentClass: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
        };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={headerMeta.title}
    >
      <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${headerMeta.accentClass}`}
            >
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <span className="inline-block text-[10px] font-mono font-extrabold uppercase tracking-wider text-amber-300">
                {headerMeta.badge}
              </span>
              <h3 className="text-sm font-black text-white">{headerMeta.title}</h3>
              <p className="text-[11px] text-slate-400">{headerMeta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Tutup pemindai"
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* PERINGATAN SALAH KAMERA + TOMBOL PINDAH 1-KLIK */}
        {wrongCameraState && (
          <div className="rounded-2xl border-2 border-amber-400/70 bg-amber-950/75 p-4 space-y-3 text-xs text-amber-100 shadow-lg">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-black text-amber-300">
                  Salah Kamera! Jenis Kode QR Tidak Sesuai dengan Kamera Ini
                </p>
                {wrongCameraState.expected === 'transfer_only' &&
                  wrongCameraState.detectedKind === 'qrp_profile' && (
                    <p className="text-slate-200 leading-relaxed">
                      Anda sedang memakai <strong>Kamera Khusus Transfer QRIS Pribadi</strong>, sedangkan kode yang Anda pindai adalah{' '}
                      <strong className="text-cyan-300">
                        QRP (QR Profil Statistik Umum)
                      </strong>{' '}
                      milik{' '}
                      <strong>
                        {wrongCameraState.classified.qrpTarget?.targetName ||
                          wrongCameraState.classified.qrpTarget?.targetAccount}
                      </strong>
                      . Untuk melihat Statistik Umum (Level, Gelar, Achievement, No. Rekening), gunakan Kamera Scan Universal / Pemindai QRP.
                    </p>
                  )}
                {wrongCameraState.expected === 'qrp_only' &&
                  wrongCameraState.detectedKind === 'qris_transfer' && (
                    <p className="text-slate-200 leading-relaxed">
                      Anda sedang memakai <strong>Kamera Khusus QRP Profil</strong>, sedangkan kode yang Anda pindai adalah{' '}
                      <strong className="text-emerald-300">
                        QRIS Pribadi (Khusus Transfer Multi-Aset)
                      </strong>{' '}
                      milik{' '}
                      <strong>
                        {wrongCameraState.classified.transferTarget?.recipientName ||
                          wrongCameraState.classified.transferTarget?.recipientAccount}
                      </strong>{' '}
                      ({formatMultiAssetSummaryLabel(wrongCameraState.classified.transferTarget || {})}).
                    </p>
                  )}
                {wrongCameraState.detectedKind === 'qris_diamond_merchant' && (
                  <p className="text-slate-200 leading-relaxed">
                    Kode yang Anda pindai adalah{' '}
                    <strong className="text-sky-300">
                      QRIS Tagihan Top-Up Permata ({OFFICIAL_BUATQRIS_MERCHANT_INFO.gatewaySiteLabel})
                    </strong>
                    , bukan kode kamera ini. Gunakan Kamera Scan Universal M-Banking untuk melihat detail tagihan Top-Up Permata.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              {wrongCameraState.detectedKind === 'qrp_profile' &&
                wrongCameraState.classified.qrpTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = wrongCameraState.classified.qrpTarget!;
                      stopCamera();
                      onClose();
                      window.dispatchEvent(
                        new CustomEvent('bn:open-qrp-profile', {
                          detail: {
                            targetAccount: target.targetAccount,
                            targetUserId: target.targetUserId,
                            targetName: target.targetName,
                            source: wrongCameraState.source,
                          },
                        })
                      );
                    }}
                    className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Pindah ke Kamera QRP &amp; Lihat Statistik Umum (1-Klik)</span>
                  </button>
                )}

              {wrongCameraState.detectedKind === 'qris_transfer' &&
                wrongCameraState.classified.transferTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      const t = wrongCameraState.classified.transferTarget!;
                      stopCamera();
                      onClose();
                      window.dispatchEvent(
                        new CustomEvent('bn:qris-transfer', {
                          detail: {
                            recipientAccount: t.recipientAccount,
                            recipientUserId: t.recipientUserId,
                            recipientBank: t.recipientBank,
                            recipientName: t.recipientName,
                            assetMode: t.assetMode,
                            amount: t.amount > 0 ? t.amount : undefined,
                            goldRupiahAmount: t.goldRupiahAmount > 0 ? t.goldRupiahAmount : undefined,
                            coinAmount: t.coinAmount > 0 ? t.coinAmount : undefined,
                            diamondAmount: t.diamondAmount > 0 ? t.diamondAmount : undefined,
                            tokenAmount: t.tokenAmount > 0 ? t.tokenAmount : undefined,
                            note: t.note || 'Transfer via Scan QRIS Pribadi',
                            source: wrongCameraState.source,
                          },
                        })
                      );
                    }}
                    className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 px-4 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Pindah ke Kamera Transfer Multi-Aset (1-Klik)</span>
                  </button>
                )}

              {wrongCameraState.detectedKind === 'qris_diamond_merchant' && (
                <button
                  type="button"
                  onClick={() => {
                    const cls = wrongCameraState.classified;
                    const src = wrongCameraState.source;
                    setWrongCameraState(null);
                    setUniversalChoiceState({ classified: cls, source: src });
                  }}
                  className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 hover:bg-sky-300 px-4 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Buka di Kamera Scan Universal (1-Klik)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setWrongCameraState(null)}
                className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 cursor-pointer"
              >
                Scan Ulang
              </button>
            </div>
          </div>
        )}

        {/* HASIL DETEKSI KAMERA SCAN UNIVERSAL (TAGIHAN TOP-UP PERMATA ATAU REKENING UMUM) */}
        {universalChoiceState && (
          <div className="rounded-2xl border border-sky-500/50 bg-slate-950 p-4 space-y-3 text-xs">
            {universalChoiceState.classified.kind === 'qris_diamond_merchant' &&
              universalChoiceState.classified.emvcoMerchant && (
                <>
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                    <span className="font-black text-sky-300 uppercase tracking-wider">
                      Tagihan QRIS Top-Up Permata Terdeteksi
                    </span>
                    <span className="rounded-md bg-sky-500/20 border border-sky-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-sky-200">
                      {OFFICIAL_BUATQRIS_MERCHANT_INFO.gatewaySiteLabel}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                      <span className="text-slate-400 block text-[10px]">Merchant Resmi</span>
                      <span className="font-bold text-white">
                        {universalChoiceState.classified.emvcoMerchant.merchantName}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                      <span className="text-slate-400 block text-[10px]">Nominal Tagihan QRIS</span>
                      <span className="font-mono font-black text-amber-300">
                        {universalChoiceState.classified.emvcoMerchant.amountRupiah > 0
                          ? formatRupiah(universalChoiceState.classified.emvcoMerchant.amountRupiah)
                          : 'Nominal Dinamis EMVCo'}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                      <span className="text-slate-400 block text-[10px]">ID Login Merchant</span>
                      <span className="font-mono text-slate-200 break-all">
                        {OFFICIAL_BUATQRIS_MERCHANT_INFO.loginId}
                      </span>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-2.5">
                      <span className="text-slate-400 block text-[10px]">API Account ID</span>
                      <span className="font-mono text-slate-200 break-all">
                        {OFFICIAL_BUATQRIS_MERCHANT_INFO.accountId}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        onClose();
                        window.dispatchEvent(new CustomEvent('bn:open-diamond-store'));
                      }}
                      className="flex-1 min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-4 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Lanjut Bayar / Buka Tagihan Top-Up Permata</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUniversalChoiceState(null)}
                      className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 cursor-pointer"
                    >
                      Scan Lainnya
                    </button>
                  </div>
                </>
              )}

            {universalChoiceState.classified.kind === 'account_or_uid' && (
              <>
                <p className="font-black text-white text-sm">
                  Nomor Rekening / ID 16 Digit Terdeteksi:{' '}
                  <span className="font-mono text-amber-300">
                    {universalChoiceState.classified.qrpTarget?.targetAccount}
                  </span>
                </p>
                <p className="text-slate-300">
                  Pilih tindakan yang ingin Anda lakukan di Kamera Scan Universal:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      const target = universalChoiceState.classified.qrpTarget!;
                      stopCamera();
                      onClose();
                      window.dispatchEvent(
                        new CustomEvent('bn:open-qrp-profile', {
                          detail: {
                            targetAccount: target.targetAccount,
                            targetUserId: target.targetUserId,
                            targetName: target.targetName,
                            source: universalChoiceState.source,
                          },
                        })
                      );
                    }}
                    className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 px-3.5 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                  >
                    <UserCheck className="h-4 w-4" />
                    <span>Lihat Statistik Umum QRP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const t = universalChoiceState.classified.transferTarget!;
                      stopCamera();
                      onClose();
                      window.dispatchEvent(
                        new CustomEvent('bn:qris-transfer', {
                          detail: {
                            recipientAccount: t.recipientAccount,
                            recipientUserId: t.recipientUserId,
                            recipientBank: t.recipientBank,
                            recipientName: t.recipientName,
                            assetMode: 'uang',
                            source: universalChoiceState.source,
                          },
                        })
                      );
                    }}
                    className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    <span>Transfer Multi-Aset</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Mode Switch (3 Metode: Kamera Langsung, Upload Galeri, Tempel Link) */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setWrongCameraState(null);
              setUniversalChoiceState(null);
              setMode('camera');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black whitespace-nowrap transition cursor-pointer ${
              mode === 'camera'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="h-3.5 w-3.5 shrink-0" />
            <span>Kamera</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setWrongCameraState(null);
              setUniversalChoiceState(null);
              setMode('gallery');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black whitespace-nowrap transition cursor-pointer ${
              mode === 'gallery'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ImageUp className="h-3.5 w-3.5 shrink-0" />
            <span>Upload Galeri</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setWrongCameraState(null);
              setUniversalChoiceState(null);
              setMode('paste');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-black whitespace-nowrap transition cursor-pointer ${
              mode === 'paste'
                ? 'bg-amber-400 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" />
            <span>Tempel Link</span>
          </button>
        </div>

        {/* 1. Camera View */}
        {mode === 'camera' && !wrongCameraState && !universalChoiceState && (
          <div className="space-y-3">
            <div className="relative aspect-square w-full max-h-72 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {cameraStatus === 'active' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-52 w-52 rounded-2xl border border-sky-400/50 shadow-[0_0_0_999px_rgba(2,6,23,0.48)]">
                    <span className="absolute -top-0.5 -left-0.5 h-6 w-6 rounded-tl-xl border-t-4 border-l-4 border-sky-400" />
                    <span className="absolute -top-0.5 -right-0.5 h-6 w-6 rounded-tr-xl border-t-4 border-r-4 border-sky-400" />
                    <span className="absolute -bottom-0.5 -left-0.5 h-6 w-6 rounded-bl-xl border-b-4 border-l-4 border-sky-400" />
                    <span className="absolute -bottom-0.5 -right-0.5 h-6 w-6 rounded-br-xl border-b-4 border-r-4 border-sky-400" />
                  </div>
                </div>
              )}

              {cameraStatus === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-950/90 text-xs text-slate-300">
                  <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                  <span>Menyiapkan kamera pemindai...</span>
                </div>
              )}

              {cameraStatus === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-slate-950/95 p-4 text-center">
                  <AlertTriangle className="h-7 w-7 text-amber-400" />
                  <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setMode('gallery');
                      }}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
                    >
                      <ImageUp className="h-4 w-4" />
                      <span>Upload Gambar Galeri</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setMode('paste');
                      }}
                      className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
                    >
                      <Link2 className="h-4 w-4" />
                      <span>Tempel Link Google Lens</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
                <span>
                  {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setShowGoogleLensGuide((v) => !v)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 cursor-pointer"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>{showGoogleLensGuide ? 'Tutup Panduan Lens' : 'Kamera Error? Pakai Google Lens'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. Gallery Upload View */}
        {mode === 'gallery' && !wrongCameraState && !universalChoiceState && (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleGalleryFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={galleryBusy}
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-400/70 bg-slate-950/80 px-5 py-8 flex flex-col items-center justify-center gap-2.5 text-center transition cursor-pointer"
            >
              {galleryBusy ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-black text-white">Membaca kode QR dari gambar...</span>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                    <ImageUp className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-black text-white">
                    Pilih Screenshot / Foto Kartu QRP atau QRIS dari Galeri
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-xs">
                    Mendukung file PNG/JPG hasil unduhan QRP (QR Profil), QRIS Pribadi Multi-Aset, maupun QRIS Top-Up Permata.
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {/* 3. Paste Link / Code View */}
        {mode === 'paste' && !wrongCameraState && !universalChoiceState && (
          <form onSubmit={handlePasteSubmit} className="space-y-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5">
              <label className="block text-xs font-bold text-slate-200">
                Tempel Tautan Hasil Scan Google Lens / Kode QRP / QRIS / No. Rekening
              </label>
              <input
                type="text"
                value={pasteInput}
                onChange={(e) => setPasteInput(e.target.value)}
                placeholder={
                  scannerPurpose === 'qrp_only'
                    ? 'https://.../?qrp_profile=1&acc=... atau No. Rekening / ID 16 Digit'
                    : 'https://.../?qris_transfer=1&to=... atau ?qrp_profile=1...'
                }
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs text-white font-mono"
              />
              <button
                type="submit"
                className="w-full min-h-[42px] inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 hover:bg-amber-300 px-4 py-2.5 text-xs font-black text-slate-950 cursor-pointer"
              >
                <ArrowRight className="h-4 w-4" />
                <span>Proses Kode / Tautan Sekarang</span>
              </button>
            </div>
          </form>
        )}

        {errorMessage && mode !== 'camera' && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PANDUAN ALTERNATIF GOOGLE LENS SAAT KAMERA ERROR / BANTUAN */}
        {(showGoogleLensGuide || cameraStatus === 'error') && (
          <div className="rounded-2xl border border-amber-500/35 bg-amber-950/30 p-3.5 text-[11px] text-amber-100 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-black text-amber-300 flex items-center gap-1.5">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>Petunjuk Scan Alternatif via Google Lens (Jika Kamera Browser Terkendala)</span>
              </span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-200 leading-relaxed">
              <li>
                Buka aplikasi <strong>Google Lens</strong> atau Kamera bawaan HP Anda, lalu arahkan ke kode{' '}
                <strong>QRP (QR Profil)</strong> atau <strong>QRIS Pribadi Multi-Aset</strong>.
              </li>
              <li>
                Ketuk tautan resmi (<code className="text-amber-300">?qrp_profile=1...</code> atau{' '}
                <code className="text-emerald-300">?qris_transfer=1...</code>) yang muncul di layar Google Lens untuk langsung membuka Statistik Umum QRP atau Transfer Multi-Aset.
              </li>
              <li>
                Atau salin tautan dari Google Lens lalu tempel di tab <strong>Tempel Link</strong> di atas, maupun unggah tangkapan layar QR lewat tab <strong>Upload Galeri</strong>.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
