import QRCode from 'qrcode';

export interface QrisDownloadOrderInput {
  orderId: string;
  totalAmount: number;
  qrisString: string;
}

export interface QrisDownloadResult {
  success: boolean;
  method: 'download' | 'fallback';
  dataUrl: string;
  filename: string;
  canShareFile: boolean;
  suggestFallbackPanel: boolean;
  error?: string;
}

/**
 * Format nama file otomatis sesuai standar Bank Nusantara:
 * QRIS-BankNusantara-OrderID-Nominal.png
 */
export function buildQrisDownloadFilename(orderId: string, totalAmount: number): string {
  const safeOrderId = (orderId || 'ORDER')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '');
  const safeAmount = Math.max(0, Math.round(Number(totalAmount) || 0));
  return `QRIS-BankNusantara-${safeOrderId || 'ORDER'}-${safeAmount}.png`;
}

/**
 * Render gambar QRIS murni beresolusi tinggi 1080x1080px PNG
 * (tanpa teks tambahan, tanpa bingkai kartu, quiet zone putih standar agar 100% mudah discan e-wallet).
 */
export async function generatePureQrisHdDataUrl(qrisString: string): Promise<string> {
  const cleanPayload = (qrisString || '').trim();
  if (!cleanPayload) {
    throw new Error('Data QRIS belum tersedia untuk diunduh.');
  }
  return QRCode.toDataURL(cleanPayload, {
    width: 1080,
    margin: 4,
    errorCorrectionLevel: 'M',
    type: 'image/png',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
}

/**
 * Konversi base64 data URI PNG ke objek Blob secara sinkron tanpa bergantung pada fetch().
 */
export function dataUrlToPngBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binaryString = window.atob(parts[1] || '');
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function canDeviceSharePngFile(filename = 'QRIS-BankNusantara.png'): boolean {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return false;
    }
    if (typeof File === 'undefined') return false;
    if (typeof navigator.canShare === 'function') {
      const probe = new File([new Uint8Array([137, 80, 78, 71])], filename, {
        type: 'image/png',
      });
      return navigator.canShare({ files: [probe] });
    }
    return false;
  } catch {
    return false;
  }
}

export function isLikelyRestrictedMobileDownloadEnv(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isInAppWebView = /FBAN|FBAV|Instagram|Line\/|TikTok|wv\)/i.test(ua);
  return isIos || isInAppWebView;
}

/**
 * Memutar bunyi notifikasi halus (2 nada lembut) saat gambar QRIS berhasil diunduh.
 */
export function playSoftDownloadChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, startOffset: number, duration: number, peakGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.01);
    };

    playTone(659.25, 0, 0.14, 0.055); // E5
    playTone(880.0, 0.09, 0.2, 0.06); // A5

    window.setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 500);
  } catch {
    // Abaikan jika browser membatasi autoplay Web Audio
  }
}

/**
 * Mengunduh gambar QRIS murni 1080px PNG langsung ke perangkat pengguna.
 * Menyediakan dataUrl + informasi dukungan Web Share API sebagai fallback untuk iOS/WebView.
 */
export async function downloadPureQrisPng(
  order: QrisDownloadOrderInput,
  cachedHdDataUrl?: string
): Promise<QrisDownloadResult> {
  const filename = buildQrisDownloadFilename(order.orderId, order.totalAmount);
  const dataUrl = cachedHdDataUrl || (await generatePureQrisHdDataUrl(order.qrisString));
  const canShareFile = canDeviceSharePngFile(filename);
  const restrictedMobile = isLikelyRestrictedMobileDownloadEnv();

  try {
    const blob = dataUrlToPngBlob(dataUrl);
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl);
      } catch {
        // ignore cleanup failure
      }
    }, 1500);

    playSoftDownloadChime();
    return {
      success: true,
      method: 'download',
      dataUrl,
      filename,
      canShareFile,
      suggestFallbackPanel: restrictedMobile,
    };
  } catch (err) {
    return {
      success: false,
      method: 'fallback',
      dataUrl,
      filename,
      canShareFile,
      suggestFallbackPanel: true,
      error:
        err instanceof Error && err.message
          ? err.message
          : 'Browser membatasi unduhan otomatis. Gunakan opsi Simpan / Bagikan di bawah.',
    };
  }
}

/**
 * Jalur cadangan khusus HP (Android/iOS): membagikan file PNG 1080px langsung ke Galeri / e-Wallet.
 */
export async function sharePureQrisPng(
  dataUrl: string,
  filename: string
): Promise<'shared' | 'cancelled' | 'unsupported'> {
  try {
    if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') {
      return 'unsupported';
    }
    const blob = dataUrlToPngBlob(dataUrl);
    const file = new File([blob], filename, { type: 'image/png' });
    if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
      return 'unsupported';
    }
    await navigator.share({
      files: [file],
      title: 'QRIS Pembayaran Bank Nusantara',
    });
    playSoftDownloadChime();
    return 'shared';
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return 'cancelled';
    }
    return 'unsupported';
  }
}
