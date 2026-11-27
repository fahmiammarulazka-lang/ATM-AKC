import jsQR from 'jsqr';
import { BankAccount } from '../types/bank';

export const PENDING_QRIS_TRANSFER_STORAGE_KEY = 'bn_pending_qris_transfer_v1';
export const PENDING_QRIS_TRANSFER_TTL_MS = 30 * 60 * 1000; // 30 menit

export interface PendingQrisTransferPayload {
  recipientAccount: string;
  recipientUserId?: string;
  recipientBank: string;
  recipientName?: string;
  amount?: number;
  note?: string;
  source: 'url' | 'camera' | 'gallery' | 'manual';
  createdAtMs: number;
}

export interface ParsedPersonalQrisTarget {
  recipientAccount: string;
  recipientUserId?: string;
  recipientBank: string;
  recipientName?: string;
  amount: number;
  note: string;
  sourceKind: 'url' | 'legacy' | 'raw' | 'empty';
}

export function normalizeNumericIdentifier(value?: string | null): string {
  return String(value || '').replace(/\D/g, '');
}

export function parsePersonalQrisPayload(rawInput: string): ParsedPersonalQrisTarget {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) {
    return {
      recipientAccount: '',
      recipientBank: 'Bank Nusantara',
      amount: 0,
      note: '',
      sourceKind: 'empty',
    };
  }

  // 1. Parse URL deep-link (?qris_transfer=1&to=...&uid=...&amt=...&name=...&bank=...&note=...)
  if (
    trimmed.includes('qris_transfer=') ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/?') ||
    trimmed.startsWith('?')
  ) {
    try {
      const urlObj =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? new URL(trimmed)
          : new URL(
              trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
              'https://banknusantara.app'
            );
      const sp = urlObj.searchParams;
      const to = (sp.get('to') || sp.get('acc') || sp.get('uid') || '').trim();
      const uid = (sp.get('uid') || '').trim() || undefined;
      const bank = (sp.get('bank') || 'Bank Nusantara').trim() || 'Bank Nusantara';
      const name = (sp.get('name') || '').trim() || undefined;
      const amt = Math.max(0, Math.round(Number(sp.get('amt') || sp.get('amount') || '0') || 0));
      const note = (sp.get('note') || '').trim();
      if (to) {
        return {
          recipientAccount: to,
          recipientUserId: uid,
          recipientBank: bank,
          recipientName: name,
          amount: amt,
          note,
          sourceKind: 'url',
        };
      }
    } catch {
      // fallback below
    }
  }

  // 2. Parse legacy BNUS-QRPAY|... format
  if (trimmed.startsWith('BNUS-QRPAY|')) {
    const parts = trimmed.split('|');
    const acc = (parts[1] || '').trim();
    const uid = (parts[2] || '').trim() || undefined;
    const amt = Math.max(0, Math.round(Number(parts[3] || '0') || 0));
    const note = (parts[4] || '').trim();
    if (acc) {
      return {
        recipientAccount: acc,
        recipientUserId: uid,
        recipientBank: 'Bank Nusantara',
        amount: amt,
        note,
        sourceKind: 'legacy',
      };
    }
  }

  // 3. Fallback: raw account number (10-digit) or User ID (16-digit)
  const digits = normalizeNumericIdentifier(trimmed);
  if (digits.length >= 8 && digits.length <= 20) {
    return {
      recipientAccount: digits,
      recipientUserId: digits.length === 16 ? digits : undefined,
      recipientBank: 'Bank Nusantara',
      amount: 0,
      note: '',
      sourceKind: 'raw',
    };
  }

  return {
    recipientAccount: '',
    recipientBank: 'Bank Nusantara',
    amount: 0,
    note: '',
    sourceKind: 'empty',
  };
}

export function savePendingQrisTransfer(
  payload: Omit<PendingQrisTransferPayload, 'createdAtMs'> & { createdAtMs?: number }
): PendingQrisTransferPayload | null {
  const cleanAcc = String(payload.recipientAccount || '').trim();
  if (!cleanAcc) return null;
  const full: PendingQrisTransferPayload = {
    recipientAccount: cleanAcc,
    recipientUserId: payload.recipientUserId?.trim() || undefined,
    recipientBank: String(payload.recipientBank || 'Bank Nusantara').trim() || 'Bank Nusantara',
    recipientName: payload.recipientName?.trim() || undefined,
    amount:
      payload.amount && Number(payload.amount) > 0 ? Math.round(Number(payload.amount)) : undefined,
    note: payload.note?.trim() || undefined,
    source: payload.source || 'url',
    createdAtMs: payload.createdAtMs || Date.now(),
  };
  try {
    window.sessionStorage.setItem(PENDING_QRIS_TRANSFER_STORAGE_KEY, JSON.stringify(full));
  } catch {
    // ignore storage quota/privacy mode errors
  }
  return full;
}

export function readPendingQrisTransfer(): PendingQrisTransferPayload | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingQrisTransferPayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.recipientAccount) {
      window.sessionStorage.removeItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
      return null;
    }
    const created = Number(parsed.createdAtMs || 0);
    if (created > 0 && Date.now() - created > PENDING_QRIS_TRANSFER_TTL_MS) {
      window.sessionStorage.removeItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
      return null;
    }
    return {
      recipientAccount: String(parsed.recipientAccount).trim(),
      recipientUserId: parsed.recipientUserId ? String(parsed.recipientUserId).trim() : undefined,
      recipientBank: String(parsed.recipientBank || 'Bank Nusantara').trim() || 'Bank Nusantara',
      recipientName: parsed.recipientName ? String(parsed.recipientName).trim() : undefined,
      amount:
        parsed.amount && Number(parsed.amount) > 0 ? Math.round(Number(parsed.amount)) : undefined,
      note: parsed.note ? String(parsed.note).trim() : undefined,
      source: (parsed.source as PendingQrisTransferPayload['source']) || 'url',
      createdAtMs: created || Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPendingQrisTransfer(): void {
  try {
    window.sessionStorage.removeItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Tangkap parameter URL `?qris_transfer=1&to=...` sejak awal boot halaman,
 * simpan persisten ke sessionStorage terlebih dahulu baru bersihkan URL query
 * agar 100% kebal terhadap redirect Firebase Auth, verifikasi PIN, maupun reload!
 */
export function capturePendingQrisFromCurrentUrl(): PendingQrisTransferPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const isQrisTransfer = params.get('qris_transfer') === '1';
    const qTo = (params.get('to') || params.get('acc') || params.get('uid') || '').trim();
    if (!isQrisTransfer || !qTo) return null;

    const qUid = (params.get('uid') || '').trim() || undefined;
    const qAmt = Math.max(0, Math.round(Number(params.get('amt') || params.get('amount') || '0') || 0));
    const qName = (params.get('name') || '').trim() || undefined;
    const qBank = (params.get('bank') || 'Bank Nusantara').trim() || 'Bank Nusantara';
    const qNote = (params.get('note') || '').trim() || undefined;

    const saved = savePendingQrisTransfer({
      recipientAccount: qTo,
      recipientUserId: qUid,
      recipientBank: qBank,
      recipientName: qName,
      amount: qAmt > 0 ? qAmt : undefined,
      note: qNote || 'Transfer via Scan QRIS Pribadi',
      source: 'url',
    });

    try {
      const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, '', cleanUrl);
    } catch {
      // ignore history API restriction
    }

    return saved;
  } catch {
    return null;
  }
}

export function isSelfQrisTransferTarget(
  target: { recipientAccount?: string; recipientUserId?: string },
  currentAccount?: Pick<BankAccount, 'accountNumber' | 'userId16'> | null
): boolean {
  if (!currentAccount) return false;
  const myAcc = normalizeNumericIdentifier(currentAccount.accountNumber);
  const myUid = normalizeNumericIdentifier(currentAccount.userId16);
  const targetAcc = normalizeNumericIdentifier(target.recipientAccount);
  const targetUid = normalizeNumericIdentifier(target.recipientUserId);

  if (myAcc && targetAcc && myAcc === targetAcc) return true;
  if (myUid && targetAcc && myUid === targetAcc) return true;
  if (myUid && targetUid && myUid === targetUid) return true;
  if (myAcc && targetUid && myAcc === targetUid) return true;
  return false;
}

interface NativeBarcodeDetectorResult {
  rawValue?: string;
}

interface NativeBarcodeDetector {
  detect: (source: ImageBitmapSource) => Promise<NativeBarcodeDetectorResult[]>;
}

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: new (options?: { formats?: string[] }) => NativeBarcodeDetector;
}

export async function decodeQrFromCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<string | null> {
  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return null;

  // 1. Native hardware-accelerated BarcodeDetector when available
  try {
    const DetectorCtor = (window as unknown as WindowWithBarcodeDetector).BarcodeDetector;
    if (DetectorCtor) {
      const detector = new DetectorCtor({ formats: ['qr_code'] });
      const results = await detector.detect(canvas);
      const first = results.find((r) => r?.rawValue && r.rawValue.trim().length > 0);
      if (first?.rawValue) {
        return first.rawValue.trim();
      }
    }
  } catch {
    // fallback to jsQR
  }

  // 2. Universal pure-JS jsQR fallback (works on iOS Safari, Firefox, Chrome, Desktop)
  try {
    const imageData = ctx.getImageData(0, 0, w, h);
    const decoded = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
    if (decoded?.data && decoded.data.trim().length > 0) {
      return decoded.data.trim();
    }
  } catch {
    // ignore decode failure
  }

  return null;
}

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
    el.src = dataUrl;
  });

  // Coba resolusi optimal (maksimal 1200px agar akurat & cepat di HP)
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || 600) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 600) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const firstTry = await decodeQrFromCanvas(canvas, ctx);
  if (firstTry) return firstTry;

  // Retry dengan dimensi asli bila gambar kecil/beresolusi rendah
  if (scale < 1) {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return decodeQrFromCanvas(canvas, ctx);
  }

  return null;
}
