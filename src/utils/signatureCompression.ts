/**
 * Signature Image Compression & Cloud Sizing Utility
 * ---------------------------------------------------------------------------
 * Menjaga gambar tanda tangan (dari kanvas goresan bebas maupun foto unggahan)
 * tetap tajam, transparan, bebas metadata EXIF, dan berukuran compact (< 44 KB)
 * agar lolos sanitasi Cloud Firestore & Realtime Database serta instan di IndexedDB.
 */

export interface CompressedSignatureResult {
  dataUrl: string;
  byteSize: number;
  kbText: string;
  wasCompressed: boolean;
}

export function estimateDataUrlKb(dataUrl?: string): string {
  if (!dataUrl || typeof dataUrl !== 'string') return '0 KB';
  const kb = Math.max(0.1, dataUrl.length / 1024);
  return `${kb.toFixed(1)} KB`;
}

function encodeCanvasCompact(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number,
  maxChars: number
): string {
  const srcW = Math.max(1, sourceCanvas.width);
  const srcH = Math.max(1, sourceCanvas.height);

  const attemptSizes: Array<{ w: number; h: number }> = [
    { w: maxWidth, h: maxHeight },
    { w: Math.round(maxWidth * 0.8), h: Math.round(maxHeight * 0.8) },
    { w: Math.round(maxWidth * 0.62), h: Math.round(maxHeight * 0.62) },
  ];

  const qualities = [0.88, 0.76, 0.62, 0.48, 0.36];
  let bestCandidate = '';

  for (const box of attemptSizes) {
    const scale = Math.min(1, box.w / srcW, box.h / srcH);
    const targetW = Math.max(40, Math.round(srcW * scale));
    const targetH = Math.max(20, Math.round(srcH * scale));

    const offscreen = document.createElement('canvas');
    offscreen.width = targetW;
    offscreen.height = targetH;
    const ctx = offscreen.getContext('2d');
    if (!ctx) continue;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceCanvas, 0, 0, targetW, targetH);

    // 1. Coba format WebP transparan berurutan
    for (const q of qualities) {
      try {
        const webpUrl = offscreen.toDataURL('image/webp', q);
        if (webpUrl && webpUrl.startsWith('data:image/webp')) {
          if (!bestCandidate || webpUrl.length < bestCandidate.length) {
            bestCandidate = webpUrl;
          }
          if (webpUrl.length <= maxChars) {
            return webpUrl;
          }
        }
      } catch {
        // lanjut jika WebP tidak didukung
      }
    }

    // 2. Coba format PNG sebagai fallback
    try {
      const pngUrl = offscreen.toDataURL('image/png');
      if (pngUrl) {
        if (!bestCandidate || pngUrl.length < bestCandidate.length) {
          bestCandidate = pngUrl;
        }
        if (pngUrl.length <= maxChars) {
          return pngUrl;
        }
      }
    } catch {
      // abaikan error canvas
    }
  }

  return bestCandidate || sourceCanvas.toDataURL('image/png');
}

export function compressCanvasToSignatureDataUrl(
  canvas: HTMLCanvasElement,
  maxChars = 44000
): CompressedSignatureResult {
  const rawPng = canvas.toDataURL('image/png');
  const compact = encodeCanvasCompact(canvas, 420, 150, maxChars);
  const finalUrl = compact && compact.length < rawPng.length ? compact : rawPng;
  return {
    dataUrl: finalUrl,
    byteSize: finalUrl.length,
    kbText: estimateDataUrlKb(finalUrl),
    wasCompressed: finalUrl.length < rawPng.length || finalUrl.startsWith('data:image/webp'),
  };
}

export function compressSignatureDataUrl(
  dataUrl: string,
  maxChars = 44000
): Promise<CompressedSignatureResult> {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string') {
      resolve({ dataUrl: '', byteSize: 0, kbText: '0 KB', wasCompressed: false });
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, 420 / Math.max(1, img.width), 150 / Math.max(1, img.height));
        const w = Math.max(40, Math.round(img.width * scale));
        const h = Math.max(20, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl,
            byteSize: dataUrl.length,
            kbText: estimateDataUrlKb(dataUrl),
            wasCompressed: false,
          });
          return;
        }
        ctx.clearRect(0, 0, w, h);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        const compact = encodeCanvasCompact(canvas, 420, 150, maxChars);
        const chosen = compact && compact.length > 0 ? compact : dataUrl;
        resolve({
          dataUrl: chosen,
          byteSize: chosen.length,
          kbText: estimateDataUrlKb(chosen),
          wasCompressed: chosen.length < dataUrl.length,
        });
      } catch {
        resolve({
          dataUrl,
          byteSize: dataUrl.length,
          kbText: estimateDataUrlKb(dataUrl),
          wasCompressed: false,
        });
      }
    };
    img.onerror = () => {
      resolve({
        dataUrl,
        byteSize: dataUrl.length,
        kbText: estimateDataUrlKb(dataUrl),
        wasCompressed: false,
      });
    };
    img.src = dataUrl;
  });
}
