/**
 * Bank Nusantara — Utilitas Media Chat (Foto, Video Kompresi Aman, Audio 600d Universal WAV & Cloud Backup)
 */
import { readCloudDoc, writeCloudDoc } from '../lib/firebase';

export interface StagedChatMediaDraft {
  id: string;
  kind: 'image' | 'video';
  file: File;
  previewUrl: string;
  thumbnailDataUrl?: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  durationSec?: number;
}

export interface StagedChatVoiceDraft {
  sourceKind: 'recorded' | 'file';
  blob: Blob;
  previewUrl: string;
  fileName: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  waveformPeaks: number[];
}

export function formatMediaDuration(totalSeconds?: number): string {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const mins = Math.floor(sec / 60);
  const rem = sec % 60;
  return `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export function formatFileSizeBytes(bytes?: number): string {
  const b = Math.max(0, Number(bytes) || 0);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca file media.'));
    reader.readAsDataURL(blob);
  });
}

export async function compressChatImageFileToBlob(file: File): Promise<{
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  fileName: string;
  mimeType: string;
}> {
  const rawUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Format gambar tidak valid atau rusak.'));
      el.src = rawUrl;
    });

    const maxDim = 1280;
    const ratio = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
    const width = Math.max(1, Math.round((img.width || 800) * ratio));
    const height = Math.max(1, Math.round((img.height || 600) * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia untuk kompresi gambar.');
    ctx.drawImage(img, 0, 0, width, height);

    let quality = 0.8;
    let dataUrl = canvas.toDataURL('image/webp', quality);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    while (dataUrl.length > 260_000 && quality > 0.35) {
      quality -= 0.12;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }

    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return {
      blob,
      dataUrl,
      width,
      height,
      sizeBytes: blob.size,
      fileName: file.name,
      mimeType: blob.type || 'image/jpeg',
    };
  } finally {
    URL.revokeObjectURL(rawUrl);
  }
}

export async function inspectVideoFileMetadata(file: File): Promise<{
  durationSec: number;
  width: number;
  height: number;
  thumbnailDataUrl?: string;
}> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.src = objectUrl;

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Timeout membaca metadata video.')), 8000);
      video.onloadeddata = () => {
        window.clearTimeout(timer);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('Format video tidak didukung oleh browser ini.'));
      };
    });

    const width = video.videoWidth || 720;
    const height = video.videoHeight || 1280;
    const durationSec = Math.max(1, Math.round(Number(video.duration) || 1));

    let thumbnailDataUrl: string | undefined;
    try {
      const targetW = Math.min(480, width);
      const targetH = Math.max(1, Math.round((height / Math.max(1, width)) * targetW));
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, targetW, targetH);
        thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.65);
      }
    } catch {
      thumbnailDataUrl = undefined;
    }

    return { durationSec, width, height, thumbnailDataUrl };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressVideoIfOversized(
  file: File,
  meta: { durationSec: number; width: number; height: number; thumbnailDataUrl?: string },
  onProgress?: (pct: number) => void
): Promise<{
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  durationSec: number;
  wasCompressed: boolean;
}> {
  const SAFE_DIRECT_BYTES = 8 * 1024 * 1024;
  const MAX_SERVER_BYTES = 21 * 1024 * 1024;

  if (file.size <= SAFE_DIRECT_BYTES) {
    onProgress?.(100);
    return {
      blob: file,
      mimeType: file.type || 'video/mp4',
      sizeBytes: file.size,
      width: meta.width,
      height: meta.height,
      durationSec: meta.durationSec,
      wasCompressed: false,
    };
  }

  // Attempt safe client-side re-encode for oversized videos (<= 90 MB & supported MediaRecorder)
  const canCapture =
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement !== 'undefined' &&
    file.size <= 90 * 1024 * 1024 &&
    meta.durationSec <= 90;

  if (!canCapture) {
    if (file.size <= MAX_SERVER_BYTES) {
      onProgress?.(100);
      return {
        blob: file,
        mimeType: file.type || 'video/mp4',
        sizeBytes: file.size,
        width: meta.width,
        height: meta.height,
        durationSec: meta.durationSec,
        wasCompressed: false,
      };
    }
    throw new Error('Ukuran video terlalu besar (maks 21 MB setelah kompresi). Pilih video yang lebih singkat.');
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.src = objectUrl;
    video.playsInline = true;
    video.muted = false;
    video.volume = 0.001;

    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error('Gagal memuat video untuk kompresi.'));
    });

    const scale = Math.min(1, 720 / Math.max(video.videoWidth || 720, video.videoHeight || 720));
    const targetW = Math.max(240, Math.round((video.videoWidth || 720) * scale / 2) * 2);
    const targetH = Math.max(240, Math.round((video.videoHeight || 720) * scale / 2) * 2);

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx || typeof canvas.captureStream !== 'function') {
      if (file.size <= MAX_SERVER_BYTES) {
        return {
          blob: file,
          mimeType: file.type || 'video/mp4',
          sizeBytes: file.size,
          width: meta.width,
          height: meta.height,
          durationSec: meta.durationSec,
          wasCompressed: false,
        };
      }
      throw new Error('Browser ini tidak mendukung kompresi video otomatis.');
    }

    const canvasStream = canvas.captureStream(24);
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    try {
      const capVideo = video as HTMLVideoElement & { captureStream?: () => MediaStream };
      if (typeof capVideo.captureStream === 'function') {
        const audioTracks = capVideo.captureStream().getAudioTracks();
        audioTracks.forEach((t) => tracks.push(t));
      }
    } catch {
      // keep video track even if audio track capture is restricted
    }

    const combinedStream = new MediaStream(tracks);
    const preferredMime = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
      ? 'video/webm;codecs=vp8,opus'
      : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : '';

    const recorder = new MediaRecorder(
      combinedStream,
      preferredMime
        ? { mimeType: preferredMime, videoBitsPerSecond: 950_000, audioBitsPerSecond: 96_000 }
        : { videoBitsPerSecond: 950_000 }
    );

    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (ev) => {
      if (ev.data && ev.data.size > 0) chunks.push(ev.data);
    };

    let rafId = 0;
    const drawFrame = () => {
      if (!video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, targetW, targetH);
        const pct = Math.min(98, Math.round((video.currentTime / Math.max(0.5, video.duration || 1)) * 100));
        onProgress?.(pct);
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      recorder.onstop = () => {
        cancelAnimationFrame(rafId);
        resolve(new Blob(chunks, { type: recorder.mimeType || 'video/webm' }));
      };
      recorder.onerror = () => {
        cancelAnimationFrame(rafId);
        reject(new Error('Terjadi kesalahan saat mengompres video.'));
      };
      video.onended = () => {
        if (recorder.state !== 'inactive') recorder.stop();
      };
      recorder.start(250);
      void video.play().then(() => {
        rafId = requestAnimationFrame(drawFrame);
      }).catch(() => {
        if (recorder.state !== 'inactive') recorder.stop();
        reject(new Error('Pemutaran latar untuk kompresi video ditolak browser.'));
      });
    });

    onProgress?.(100);
    const chosen = compressedBlob.size > 0 && compressedBlob.size < file.size ? compressedBlob : file;
    if (chosen.size > MAX_SERVER_BYTES) {
      throw new Error('Video masih melebihi 21 MB setelah dikompres. Potong durasi video agar lebih ringkas.');
    }

    return {
      blob: chosen,
      mimeType: chosen.type || 'video/webm',
      sizeBytes: chosen.size,
      width: chosen === compressedBlob ? targetW : meta.width,
      height: chosen === compressedBlob ? targetH : meta.height,
      durationSec: meta.durationSec,
      wasCompressed: chosen === compressedBlob,
    };
  } catch (err) {
    if (file.size <= MAX_SERVER_BYTES) {
      onProgress?.(100);
      return {
        blob: file,
        mimeType: file.type || 'video/mp4',
        sizeBytes: file.size,
        width: meta.width,
        height: meta.height,
        durationSec: meta.durationSec,
        wasCompressed: false,
      };
    }
    throw err;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export function buildFallbackWaveformPeaks(seedLength = 36): number[] {
  const out: number[] = [];
  for (let i = 0; i < seedLength; i += 1) {
    const val = 0.28 + Math.abs(Math.sin(i * 0.72) * 0.48 + Math.cos(i * 0.31) * 0.2);
    out.push(Number(Math.min(1, Math.max(0.18, val)).toFixed(2)));
  }
  return out;
}

export async function extractAudioDurationAndPeaks(
  blobOrFile: Blob,
  barCount = 36
): Promise<{ durationSec: number; waveformPeaks: number[] }> {
  const objectUrl = URL.createObjectURL(blobOrFile);
  let fallbackDuration = 0;

  try {
    fallbackDuration = await new Promise<number>((resolve) => {
      const audio = document.createElement('audio');
      audio.preload = 'metadata';
      const timer = window.setTimeout(() => resolve(0), 5000);
      audio.onloadedmetadata = () => {
        window.clearTimeout(timer);
        const dur = Number.isFinite(audio.duration) ? Math.round(audio.duration) : 0;
        resolve(dur);
      };
      audio.onerror = () => {
        window.clearTimeout(timer);
        resolve(0);
      };
      audio.src = objectUrl;
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx && blobOrFile.size <= 24 * 1024 * 1024) {
      const ctx = new AudioCtx();
      try {
        const arrayBuf = await blobOrFile.arrayBuffer();
        const decoded = await ctx.decodeAudioData(arrayBuf.slice(0));
        const channel = decoded.getChannelData(0);
        const durationSec = Math.max(1, Math.round(decoded.duration || fallbackDuration || 1));
        const blockSize = Math.max(1, Math.floor(channel.length / barCount));
        const rawPeaks: number[] = [];
        for (let i = 0; i < barCount; i += 1) {
          const start = i * blockSize;
          let sum = 0;
          const step = Math.max(1, Math.floor(blockSize / 64));
          let count = 0;
          for (let j = 0; j < blockSize && start + j < channel.length; j += step) {
            sum += Math.abs(channel[start + j]);
            count += 1;
          }
          rawPeaks.push(count > 0 ? sum / count : 0.15);
        }
        const maxPeak = Math.max(...rawPeaks, 0.01);
        const waveformPeaks = rawPeaks.map((p) =>
          Number(Math.min(1, Math.max(0.16, p / maxPeak)).toFixed(2))
        );
        return { durationSec, waveformPeaks };
      } finally {
        void ctx.close().catch(() => {});
      }
    }
  } catch {
    // Fallback to metadata duration + synthetic waveform bars
  }

  return {
    durationSec: Math.max(1, fallbackDuration || 1),
    waveformPeaks: buildFallbackWaveformPeaks(barCount),
  };
}

export function extractPeaksFromPcm(samples: Float32Array, barCount = 36): number[] {
  if (!samples || samples.length === 0) return buildFallbackWaveformPeaks(barCount);
  const blockSize = Math.max(1, Math.floor(samples.length / barCount));
  const rawPeaks: number[] = [];
  for (let i = 0; i < barCount; i += 1) {
    const start = i * blockSize;
    let sum = 0;
    const step = Math.max(1, Math.floor(blockSize / 64));
    let count = 0;
    for (let j = 0; j < blockSize && start + j < samples.length; j += step) {
      sum += Math.abs(samples[start + j]);
      count += 1;
    }
    rawPeaks.push(count > 0 ? sum / count : 0.14);
  }
  const maxPeak = Math.max(...rawPeaks, 0.01);
  return rawPeaks.map((p) => Number(Math.min(1, Math.max(0.16, p / maxPeak)).toFixed(2)));
}

export function encodePcmFloatToWavBlob(
  samples: Float32Array,
  sourceSampleRate: number,
  targetSampleRate = 16000
): { blob: Blob; durationSec: number; waveformPeaks: number[]; hadSignal: boolean } {
  const safeSrcRate = Math.max(8000, Math.round(sourceSampleRate || 48000));
  const safeDstRate = Math.max(8000, Math.min(safeSrcRate, Math.round(targetSampleRate || 16000)));
  const ratio = safeSrcRate / safeDstRate;
  const outLength = Math.max(1, Math.floor(samples.length / ratio));
  const downsampled = new Float32Array(outLength);

  let peakAbs = 0;
  for (let i = 0; i < outLength; i += 1) {
    const startIdx = Math.floor(i * ratio);
    const endIdx = Math.min(samples.length, Math.max(startIdx + 1, Math.floor((i + 1) * ratio)));
    let acc = 0;
    for (let j = startIdx; j < endIdx; j += 1) {
      acc += samples[j];
    }
    const avg = acc / Math.max(1, endIdx - startIdx);
    downsampled[i] = avg;
    const a = Math.abs(avg);
    if (a > peakAbs) peakAbs = a;
  }

  const hadSignal = peakAbs > 0.0015;
  // Auto-normalize quiet microphone capture so voice note is crisp and loud across all devices
  const normGain =
    peakAbs > 0.0015 && peakAbs < 0.78 ? Math.min(10, 0.86 / peakAbs) : 1;

  const buffer = new ArrayBuffer(44 + outLength * 2);
  const view = new DataView(buffer);
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + outLength * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, safeDstRate, true);
  view.setUint32(28, safeDstRate * 2, true); // ByteRate = SampleRate * 1 * 2
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, outLength * 2, true);

  let offset = 44;
  for (let i = 0; i < outLength; i += 1) {
    let val = downsampled[i] * normGain;
    // Soft saturation limiter above 0.92
    if (val > 0.92) val = 0.92 + Math.tanh((val - 0.92) * 2) * 0.07;
    else if (val < -0.92) val = -0.92 + Math.tanh((val + 0.92) * 2) * 0.07;
    val = Math.max(-1, Math.min(1, val));
    view.setInt16(offset, val < 0 ? val * 0x8000 : val * 0x7fff, true);
    offset += 2;
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  const durationSec = Math.max(1, Math.round(outLength / safeDstRate));
  const waveformPeaks = extractPeaksFromPcm(downsampled, 36);
  return { blob, durationSec, waveformPeaks, hadSignal };
}

export async function tryConvertAudioBlobToUniversalWav(blob: Blob): Promise<{
  blob: Blob;
  mimeType: string;
  durationSec: number;
  waveformPeaks: number[];
} | null> {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx || blob.size > 24 * 1024 * 1024) return null;
    const ctx = new AudioCtx();
    try {
      const arr = await blob.arrayBuffer();
      const decoded = await ctx.decodeAudioData(arr.slice(0));
      const ch0 = decoded.getChannelData(0);
      const res = encodePcmFloatToWavBlob(ch0, decoded.sampleRate || 44100, 16000);
      return {
        blob: res.blob,
        mimeType: 'audio/wav',
        durationSec: Math.max(1, Math.round(decoded.duration || res.durationSec)),
        waveformPeaks: res.waveformPeaks,
      };
    } finally {
      void ctx.close().catch(() => {});
    }
  } catch {
    return null;
  }
}

const restoredCloudMediaCache = new Map<string, string>();
const inflightCloudMediaRestore = new Map<string, Promise<string | null>>();

export async function saveChatMediaToCloudBackup(
  dataUrl: string,
  fileName: string,
  mimeType: string
): Promise<string | undefined> {
  if (!dataUrl || dataUrl.length > 9 * 1024 * 1024) return undefined;
  const backupId = `vn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const nowMs = Date.now();
  const safeMime = mimeType || 'audio/wav';

  try {
    if (dataUrl.length <= 360_000) {
      await writeCloudDoc('bank_state_v1', `chat_media_${backupId}`, {
        id: backupId,
        fileName,
        mimeType: safeMime,
        totalChunks: 1,
        dataUrl,
        updatedAtMs: nowMs,
      });
      restoredCloudMediaCache.set(backupId, dataUrl);
      return backupId;
    }

    const chunkSize = 350_000;
    const totalChunks = Math.ceil(dataUrl.length / chunkSize);
    const writes: Promise<boolean>[] = [
      writeCloudDoc('bank_state_v1', `chat_media_${backupId}`, {
        id: backupId,
        fileName,
        mimeType: safeMime,
        totalChunks,
        updatedAtMs: nowMs,
      }),
    ];
    for (let i = 0; i < totalChunks; i += 1) {
      const slice = dataUrl.slice(i * chunkSize, (i + 1) * chunkSize);
      writes.push(
        writeCloudDoc('bank_state_v1', `chat_media_${backupId}_c${i}`, {
          id: `${backupId}_c${i}`,
          index: i,
          data: slice,
          updatedAtMs: nowMs,
        })
      );
    }
    await Promise.all(writes);
    restoredCloudMediaCache.set(backupId, dataUrl);
    return backupId;
  } catch {
    return undefined;
  }
}

export async function restoreChatMediaFromCloud(backupId?: string): Promise<string | null> {
  if (!backupId) return null;
  const cached = restoredCloudMediaCache.get(backupId);
  if (cached) return cached;

  const existing = inflightCloudMediaRestore.get(backupId);
  if (existing) return existing;

  const task = (async () => {
    try {
      const meta = await readCloudDoc<{
        dataUrl?: string;
        totalChunks?: number;
        mimeType?: string;
      }>('bank_state_v1', `chat_media_${backupId}`, { timeoutMs: 4500 });
      if (!meta) return null;
      if (typeof meta.dataUrl === 'string' && meta.dataUrl.startsWith('data:')) {
        restoredCloudMediaCache.set(backupId, meta.dataUrl);
        return meta.dataUrl;
      }
      const total = Math.max(0, Number(meta.totalChunks) || 0);
      if (total <= 0 || total > 30) return null;
      const chunkDocs = await Promise.all(
        Array.from({ length: total }, (_, idx) =>
          readCloudDoc<{ data?: string }>('bank_state_v1', `chat_media_${backupId}_c${idx}`, {
            timeoutMs: 4500,
          })
        )
      );
      const parts = chunkDocs.map((d) => (d && typeof d.data === 'string' ? d.data : ''));
      if (parts.some((p) => !p)) return null;
      const assembled = parts.join('');
      if (!assembled.startsWith('data:')) return null;
      restoredCloudMediaCache.set(backupId, assembled);
      return assembled;
    } catch {
      return null;
    } finally {
      inflightCloudMediaRestore.delete(backupId);
    }
  })();

  inflightCloudMediaRestore.set(backupId, task);
  return task;
}

export async function uploadChatMediaToServer(
  blobOrFile: Blob,
  fileName: string,
  mimeType: string
): Promise<{
  url?: string;
  dataUrl?: string;
  cloudBackupId?: string;
  sizeBytes: number;
  mimeType: string;
}> {
  const dataUrl = await blobToDataUrl(blobOrFile);
  const resolvedMime = mimeType || blobOrFile.type || 'application/octet-stream';
  const isAudio = resolvedMime.startsWith('audio/');
  const inlineLimit = isAudio ? 165_000 : 55_000;

  let cloudBackupId: string | undefined;
  const cloudPromise = isAudio
    ? Promise.race([
        saveChatMediaToCloudBackup(dataUrl, fileName, resolvedMime),
        new Promise<undefined>((resolve) => window.setTimeout(() => resolve(undefined), 3500)),
      ])
    : Promise.resolve(undefined);

  try {
    const [resp, backupResult] = await Promise.all([
      fetch('/api/chat-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataUrl,
          fileName,
          mimeType: resolvedMime,
        }),
      }).catch(() => null),
      cloudPromise,
    ]);
    cloudBackupId = backupResult;

    if (resp && resp.ok) {
      const json = (await resp.json()) as {
        success?: boolean;
        url?: string;
        sizeBytes?: number;
        mimeType?: string;
      };
      if (json.success && json.url) {
        return {
          url: json.url,
          dataUrl: dataUrl.length <= inlineLimit ? dataUrl : undefined,
          cloudBackupId,
          sizeBytes: json.sizeBytes || blobOrFile.size,
          mimeType: json.mimeType || resolvedMime,
        };
      }
    }
  } catch {
    cloudBackupId = await cloudPromise;
  }

  if (cloudBackupId || dataUrl.length <= (isAudio ? 280_000 : 180_000)) {
    return {
      dataUrl: dataUrl.length <= (isAudio ? 280_000 : 180_000) ? dataUrl : undefined,
      cloudBackupId,
      sizeBytes: blobOrFile.size,
      mimeType: resolvedMime,
    };
  }

  throw new Error('Gagal mengunggah media ke server Bank Nusantara. Periksa koneksi lalu coba lagi.');
}

export function isIncomingDmBlockedForViewer(
  msg: {
    deleted?: boolean;
    groupId?: string;
    senderAccountId?: string;
    senderAccount?: string;
    recipientAccountId?: string;
    recipientAccount?: string;
    createdAtMs?: number;
    timestamp?: string;
  },
  viewer: {
    id: string;
    accountNumber?: string;
    blockedChatAccountIds?: string[];
    blockedChatIntervalsMap?: Record<string, Array<{ startMs: number; endMs?: number }>>;
  } | null | undefined,
  accountsList?: Array<{ id: string; accountNumber?: string }>
): boolean {
  if (!viewer || !msg || msg.deleted || msg.groupId) return false;

  const isFromViewer =
    (Boolean(msg.senderAccountId) && msg.senderAccountId === viewer.id) ||
    (Boolean(viewer.accountNumber) && msg.senderAccount === viewer.accountNumber);
  if (isFromViewer) return false;

  const isToViewer =
    (Boolean(msg.recipientAccountId) && msg.recipientAccountId === viewer.id) ||
    (Boolean(viewer.accountNumber) && msg.recipientAccount === viewer.accountNumber);
  if (!isToViewer) return false;

  const senderAcc = accountsList?.find(
    (a) =>
      (msg.senderAccountId && a.id === msg.senderAccountId) ||
      (msg.senderAccount && a.accountNumber === msg.senderAccount)
  );
  const candidateKeys = Array.from(
    new Set(
      [msg.senderAccountId, senderAcc?.id, msg.senderAccount].filter(
        (v): v is string => typeof v === 'string' && v.length > 0
      )
    )
  );
  if (candidateKeys.length === 0) return false;

  const intervalsMap = viewer.blockedChatIntervalsMap || {};
  const msgTs = msg.createdAtMs || (msg.timestamp ? Date.parse(msg.timestamp) : 0) || 0;
  let hasRecordedIntervals = false;

  for (const key of candidateKeys) {
    const intervals = intervalsMap[key];
    if (Array.isArray(intervals) && intervals.length > 0) {
      hasRecordedIntervals = true;
      for (const iv of intervals) {
        if (!iv || typeof iv.startMs !== 'number') continue;
        const end = typeof iv.endMs === 'number' ? iv.endMs : Number.POSITIVE_INFINITY;
        if (msgTs > 0) {
          if (msgTs >= iv.startMs && msgTs <= end) return true;
        } else if (typeof iv.endMs !== 'number') {
          return true;
        }
      }
    }
  }

  const blockedIds = Array.isArray(viewer.blockedChatAccountIds) ? viewer.blockedChatAccountIds : [];
  if (!hasRecordedIntervals && blockedIds.length > 0) {
    const blockedSet = new Set(blockedIds);
    if (candidateKeys.some((k) => blockedSet.has(k))) return true;
  }

  return false;
}

