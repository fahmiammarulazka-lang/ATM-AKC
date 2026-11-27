import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  ImageUp,
  RefreshCw,
  X,
  AlertTriangle,
  ScanLine,
  Loader2,
} from 'lucide-react';
import { decodeQrFromCanvas, decodeQrFromImageFile } from '../utils/qrisTransferUtils';

interface QrisScannerModalProps {
  isOpen: boolean;
  initialMode?: 'camera' | 'gallery';
  onClose: () => void;
  onDetected: (rawText: string, source: 'camera' | 'gallery') => void;
}

export const QrisScannerModal: React.FC<QrisScannerModalProps> = ({
  isOpen,
  initialMode = 'camera',
  onClose,
  onDetected,
}) => {
  const [mode, setMode] = useState<'camera' | 'gallery'>(initialMode);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'active' | 'error'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [galleryBusy, setGalleryBusy] = useState<boolean>(false);

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

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage('');
    } else {
      stopCamera();
      setCameraStatus('idle');
    }
  }, [isOpen, initialMode, stopCamera]);

  useEffect(() => {
    if (!isOpen || mode !== 'camera') {
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
          setErrorMessage(
            'Browser ini tidak mendukung akses kamera langsung. Gunakan tombol Upload Gambar QR dari galeri di bawah.'
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
                  stopCamera();
                  onDetected(detected, 'camera');
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
          const msg = err instanceof Error ? err.message : '';
          setErrorMessage(
            msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission')
              ? 'Izin kamera ditolak. Aktifkan izin kamera browser atau pilih Upload Gambar QR dari galeri HP.'
              : 'Kamera tidak tersedia atau sedang dipakai aplikasi lain. Anda tetap bisa unggah screenshot QRIS lewat Upload Gambar QR.'
          );
        }
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [isOpen, mode, facingMode, stopCamera, onDetected]);

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
          'Kode QR tidak terbaca pada gambar tersebut. Pastikan gambar QRIS Pribadi jelas, utuh, dan tidak terpotong.'
        );
      } else {
        stopCamera();
        onDetected(decoded, 'gallery');
      }
    } catch {
      setErrorMessage('Gagal memproses gambar. Coba pilih file PNG/JPG QRIS Pribadi yang lain.');
    } finally {
      setGalleryBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Pemindai QRIS Pribadi Bank Nusantara"
    >
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/40 bg-sky-500/15 text-sky-300">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Pindai QRIS Pribadi</h3>
              <p className="text-[11px] text-slate-400">
                Arahkan kamera ke QRIS penerima atau unggah gambar QR dari galeri.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            aria-label="Tutup pemindai QRIS"
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Switch */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setMode('camera');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black whitespace-nowrap transition cursor-pointer ${
              mode === 'camera'
                ? 'bg-sky-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Kamera Langsung</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setErrorMessage('');
              setMode('gallery');
            }}
            className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-black whitespace-nowrap transition cursor-pointer ${
              mode === 'gallery'
                ? 'bg-emerald-500 text-slate-950'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <ImageUp className="h-4 w-4" />
            <span>Upload Galeri QR</span>
          </button>
        </div>

        {/* Camera View */}
        {mode === 'camera' && (
          <div className="space-y-3">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                autoPlay
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Clean Viewfinder Corner Frame */}
              {cameraStatus === 'active' && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="relative h-56 w-56 rounded-2xl border border-sky-400/50 shadow-[0_0_0_999px_rgba(2,6,23,0.48)]">
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
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950/95 p-5 text-center">
                  <AlertTriangle className="h-8 w-8 text-amber-400" />
                  <p className="text-xs text-slate-300 leading-relaxed">{errorMessage}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('gallery');
                    }}
                    className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                  >
                    <ImageUp className="h-4 w-4" />
                    <span>Pilih Gambar QR dari Galeri</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'))
                }
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-200 whitespace-nowrap cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5 text-sky-400" />
                <span>
                  {facingMode === 'environment' ? 'Kamera Belakang' : 'Kamera Depan'}
                </span>
              </button>
              <span className="text-[11px] text-slate-400">
                Otomatis masuk Transfer saat QR terbaca
              </span>
            </div>
          </div>
        )}

        {/* Gallery Upload View */}
        {mode === 'gallery' && (
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
              className="w-full rounded-2xl border-2 border-dashed border-slate-700 hover:border-emerald-400/70 bg-slate-950/80 px-5 py-10 flex flex-col items-center justify-center gap-2.5 text-center transition cursor-pointer"
            >
              {galleryBusy ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
                  <span className="text-xs font-black text-white">Membaca kode QRIS dari gambar...</span>
                </>
              ) : (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/15 text-emerald-300">
                    <ImageUp className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-black text-white">
                    Pilih Screenshot / Foto QRIS dari Galeri
                  </span>
                  <span className="text-[11px] text-slate-400 max-w-xs">
                    Mendukung PNG, JPG, atau hasil unduhan Kartu QRIS Pribadi Bank Nusantara.
                  </span>
                </>
              )}
            </button>

            {errorMessage && (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3.5 py-2.5 text-xs text-rose-200 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
