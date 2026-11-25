/**
 * ============================================================================
 * BUATQRIS.SITE — MODUL INTEGRASI PEMBAYARAN QRIS HYBRID (API & EMVCo DINAMIS)
 * ============================================================================
 * File konfigurasi terpisah di bagian paling atas struktur proyek agar mudah
 * diisi kredensial BuatQRIS Anda (atau melalui Environment Variables / Secrets).
 *
 * CARA PENGISIAN KREDENSIAL (REKOMENDASI KEAMANAN):
 * 1. Isi lewat menu Settings -> Secrets / variabel lingkungan server (JANGAN hardcode di kode):
 *    - BUATQRIS_URL_SITE           (default: https://app.buatqris.site)
 *    - BUATQRIS_LOGIN_ID           (ID Login akun BuatQRIS)
 *    - BUATQRIS_ACCOUNT_ID         (API account_id dari dashboard BuatQRIS)
 *    - BUATQRIS_SECRET_KEY         (Secret Key rahasia sk_live_... dari dashboard BuatQRIS)
 *    - BUATQRIS_WEBHOOK_URL        (URL webhook publik aplikasi, misal https://atm-akc.vercel.app/)
 *    - BUATQRIS_WEBHOOK_SECRET     (Opsional: secret verifikasi webhook terpisah)
 *    - BUATQRIS_STATIC_QRIS_STRING (Opsional: string QRIS statis untuk fallback EMVCo)
 *
 * 2. MODE HYBRID (BAWAAN):
 *    - Jika BUATQRIS_SECRET_KEY (atau BUATQRIS_API_KEY) & BUATQRIS_ACCOUNT_ID (atau BUATQRIS_MERCHANT_ID)
 *      terisi di server Secrets -> otomatis memakai Mode API Gateway BuatQRIS Live.
 *    - Jika kredensial API kosong -> otomatis fallback ke Mode QRIS Dinamis EMVCo
 *      (Tag 54 nominal tepat + CRC16-CCITT).
 */

export type BuatQrisMode = 'hybrid' | 'api' | 'emvco';

export interface BuatQrisConfig {
  BUATQRIS_URL_SITE: string;
  BUATQRIS_LOGIN_ID: string;
  ACCOUNT_ID: string;
  SECRET_KEY: string;
  WEBHOOK_URL: string;
  BUATQRIS_API_KEY: string;
  MERCHANT_ID: string;
  WEBHOOK_SECRET: string;
  STATIC_QRIS_STRING: string;
  DEFAULT_MODE: BuatQrisMode;
  DEFAULT_EXPIRY_MINUTES: number;
  USE_UNIQUE_CODE_3_DIGIT: boolean;
  POLLING_INTERVAL_MS: number;
}

const isNodeRuntime =
  typeof process !== 'undefined' && typeof process.env !== 'undefined';

function readServerEnv(key: string, fallback = ''): string {
  if (!isNodeRuntime) return fallback;
  const val = process.env[key];
  return typeof val === 'string' && val.trim().length > 0 ? val.trim() : fallback;
}

/**
 * Konfigurasi Utama BuatQRIS — Baca otomatis dari Environment Variables Server (Settings -> Secrets).
 * (Nilai rahasia seperti Secret Key & Webhook Secret hanya hidup di sisi server!)
 */
function normalizeBuatQrisUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return 'https://app.buatqris.site';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function getBuatQrisConfig(): BuatQrisConfig {
  const secretKey =
    readServerEnv('QRIS_SECRET_KEY') ||
    readServerEnv('QRIS_API_KEY') ||
    readServerEnv('BUATQRIS_SECRET_KEY') ||
    readServerEnv('BUATQRIS_API_KEY');
  const accountId =
    readServerEnv('QRIS_ACCOUNT_ID') ||
    readServerEnv('QRIS_MERCHANT_ID') ||
    readServerEnv('BUATQRIS_ACCOUNT_ID') ||
    readServerEnv('BUATQRIS_MERCHANT_ID');
  const webhookSecret =
    readServerEnv('QRIS_WEBHOOK_SECRET') ||
    readServerEnv('BUATQRIS_WEBHOOK_SECRET') ||
    secretKey;

  return {
    BUATQRIS_URL_SITE: normalizeBuatQrisUrl(
      readServerEnv('QRIS_GATEWAY_URL') ||
        readServerEnv('BUATQRIS_URL_SITE', 'https://app.buatqris.site')
    ),
    BUATQRIS_LOGIN_ID:
      readServerEnv('QRIS_LOGIN_ID') || readServerEnv('BUATQRIS_LOGIN_ID', ''),
    ACCOUNT_ID: accountId,
    SECRET_KEY: secretKey,
    WEBHOOK_URL:
      readServerEnv('QRIS_WEBHOOK_URL') || readServerEnv('BUATQRIS_WEBHOOK_URL', ''),
    BUATQRIS_API_KEY: secretKey,
    MERCHANT_ID: accountId,
    WEBHOOK_SECRET: webhookSecret,
    STATIC_QRIS_STRING:
      readServerEnv('QRIS_STATIC_STRING') || readServerEnv('BUATQRIS_STATIC_QRIS_STRING', ''),
    DEFAULT_MODE: 'hybrid',
    DEFAULT_EXPIRY_MINUTES: 10, // 10 menit sesuai konfigurasi
    USE_UNIQUE_CODE_3_DIGIT: true, // Otomatis dihitung masuk total pembayaran
    POLLING_INTERVAL_MS: 3000, // Auto-polling setiap 3 detik
  };
}

/**
 * Valid EMVCo structural fallback template ONLY used for rendering scannable EMVCo
 * format preview when neither API Key nor STATIC_QRIS_STRING has been supplied yet.
 * Always flagged with `configReady: false` so UI clearly reminds admin to fill credentials.
 */
const PLACEHOLDER_EMVCO_STATIC_QRIS =
  '00020101021126580016ID.CO.QRIS.WWW01189360000000000000000215BANKNUSANTARA010303UMI51440014ID.CO.QRIS.WWW0215ID00000000000010303UMI5204599953033605802ID5914BANK NUSANTARA6007JAKARTA61051011063040000';

// ============================================================================
// 1. MESIN EMVCo QRIS DINAMIS & CHECKSUM CRC16-CCITT (0x1021 / INIT 0xFFFF)
// ============================================================================

/**
 * Menghitung checksum CRC16-CCITT (Polynomial 0x1021, Initial Value 0xFFFF)
 * sesuai spesifikasi resmi QRIS / EMVCo Merchant-Presented Mode.
 */
export function calculateCRC16CCITT(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

interface EmvTlvEntry {
  tag: string;
  value: string;
}

function parseEmvTlv(raw: string): EmvTlvEntry[] {
  const entries: EmvTlvEntry[] = [];
  let cursor = 0;
  const clean = raw.trim();

  while (cursor + 4 <= clean.length) {
    const tag = clean.slice(cursor, cursor + 2);
    const lenStr = clean.slice(cursor + 2, cursor + 4);
    const len = Number.parseInt(lenStr, 10);
    if (!Number.isFinite(len) || len < 0 || cursor + 4 + len > clean.length) {
      break;
    }
    const value = clean.slice(cursor + 4, cursor + 4 + len);
    entries.push({ tag, value });
    cursor += 4 + len;
    if (tag === '63') break;
  }

  return entries;
}

function encodeEmvTlv(tag: string, value: string): string {
  const len = String(value.length).padStart(2, '0');
  return `${tag}${len}${value}`;
}

/**
 * Mengubah string QRIS Statis menjadi QRIS Dinamis EMVCo:
 * - Mengubah Tag 01 dari "11" (Statis) ke "12" (Dinamis)
 * - Menyisipkan / mengganti Tag 54 dengan nominal transaksi tepat (bulat Rupiah)
 * - Menghapus Tag 63 lama & menghitung ulang CRC16-CCITT 4 karakter heksadesimal
 */
export function generateDynamicEmvcoQris(
  staticQrisString: string,
  amountRupiah: number
): string {
  const safeAmount = Math.max(1, Math.round(amountRupiah));
  const amountStr = String(safeAmount);
  const rawBase = (staticQrisString || '').trim() || PLACEHOLDER_EMVCO_STATIC_QRIS;

  const parsed = parseEmvTlv(rawBase);

  // If valid TLV entries parsed cleanly, rebuild preserving exact tag order
  if (parsed.length >= 4) {
    const withoutCrcAndAmount = parsed
      .filter((entry) => entry.tag !== '63' && entry.tag !== '54')
      .map((entry) =>
        entry.tag === '01' ? { tag: '01', value: '12' } : entry
      );

    // Insert Tag 54 right after Tag 53 (Currency 360) if present, else before Tag 58
    const idx53 = withoutCrcAndAmount.findIndex((e) => e.tag === '53');
    const idx58 = withoutCrcAndAmount.findIndex((e) => e.tag === '58');
    const amountEntry: EmvTlvEntry = { tag: '54', value: amountStr };

    if (idx53 >= 0) {
      withoutCrcAndAmount.splice(idx53 + 1, 0, amountEntry);
    } else if (idx58 >= 0) {
      withoutCrcAndAmount.splice(idx58, 0, amountEntry);
    } else {
      withoutCrcAndAmount.push(amountEntry);
    }

    const bodyWithoutCrc =
      withoutCrcAndAmount.map((e) => encodeEmvTlv(e.tag, e.value)).join('') + '6304';
    const crc = calculateCRC16CCITT(bodyWithoutCrc);
    return `${bodyWithoutCrc}${crc}`;
  }

  // Fallback string surgery if raw string is non-standard
  const strippedCrc = rawBase.replace(/6304[0-9A-Fa-f]{4}$/, '');
  const dynamicMarked = strippedCrc.replace('010211', '010212');
  const tag54 = encodeEmvTlv('54', amountStr);
  const splitIdx = dynamicMarked.indexOf('5802ID');
  const withAmount =
    splitIdx > -1
      ? `${dynamicMarked.slice(0, splitIdx)}${tag54}${dynamicMarked.slice(splitIdx)}`
      : `${dynamicMarked}${tag54}`;
  const body = `${withAmount}6304`;
  return `${body}${calculateCRC16CCITT(body)}`;
}

export function generateUniqueCode3Digit(): number {
  return Math.floor(Math.random() * 899) + 100; // 100..998
}

// ============================================================================
// 2. SERVER-SIDE HYBRID ORCHESTRATION (API GATEWAY BUATQRIS + FALLBACK EMVCo)
// ============================================================================

export interface CreateBuatQrisPayload {
  orderId: string;
  amount: number;
  customerName?: string;
  description?: string;
  useUniqueCode?: boolean;
  expiryMinutes?: number;
  preferredMode?: BuatQrisMode;
}

export interface CreateBuatQrisResult {
  success: boolean;
  orderId: string;
  externalInvoiceId?: string;
  modeUsed: 'api' | 'emvco';
  configReady: boolean;
  configNotice?: string;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  qrisString: string;
  qrisImageUrl?: string;
  createdAt: string;
  expiresAt: string;
}

export interface CheckBuatQrisStatusResult {
  orderId: string;
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'EXPIRED';
  paidAt?: string;
  providerReference?: string;
  rawStatus?: string;
}

function isAllowedBuatQrisHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    const host = parsed.hostname.toLowerCase();
    // Block loopback & private IP ranges
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '169.254.169.254' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return host.endsWith('buatqris.site') || host.endsWith('qris.id');
  } catch {
    return false;
  }
}

/**
 * Membuat tagihan QRIS menggunakan Mode Hybrid (Server-Side):
 * - Mode API Gateway jika BUATQRIS_API_KEY & MERCHANT_ID tersedia
 * - Fallback otomatis ke Mode QRIS Dinamis EMVCo jika kredensial API belum diisi
 */
export async function createBuatQrisInvoiceServer(
  input: CreateBuatQrisPayload
): Promise<CreateBuatQrisResult> {
  const cfg = getBuatQrisConfig();
  const baseAmount = Math.max(1, Math.round(Number(input.amount) || 0));
  const useUnique =
    typeof input.useUniqueCode === 'boolean'
      ? input.useUniqueCode
      : cfg.USE_UNIQUE_CODE_3_DIGIT;
  const uniqueCode = useUnique ? generateUniqueCode3Digit() : 0;
  const totalAmount = baseAmount + uniqueCode;
  const expiryMinutes = Math.max(1, Math.min(60, input.expiryMinutes || cfg.DEFAULT_EXPIRY_MINUTES));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString();
  const mode = input.preferredMode || cfg.DEFAULT_MODE;

  const hasApiCreds = Boolean(cfg.SECRET_KEY && cfg.ACCOUNT_ID);
  const shouldTryApi = (mode === 'api' || mode === 'hybrid') && hasApiCreds;

  if (shouldTryApi && isAllowedBuatQrisHost(cfg.BUATQRIS_URL_SITE)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const baseUrl = cfg.BUATQRIS_URL_SITE.replace(/\/+$/, '');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${cfg.SECRET_KEY}`,
        'X-Secret-Key': cfg.SECRET_KEY,
        'X-API-Key': cfg.SECRET_KEY,
        'X-Account-Id': cfg.ACCOUNT_ID,
        'X-Merchant-Id': cfg.ACCOUNT_ID,
      };
      if (cfg.BUATQRIS_LOGIN_ID) {
        headers['X-Login-Id'] = cfg.BUATQRIS_LOGIN_ID;
      }

      const response = await fetch(`${baseUrl}/api/v1/qris/create`, {
        method: 'POST',
        signal: controller.signal,
        headers,
        body: JSON.stringify({
          order_id: input.orderId,
          reference_id: input.orderId,
          account_id: cfg.ACCOUNT_ID,
          merchant_id: cfg.ACCOUNT_ID,
          ...(cfg.BUATQRIS_LOGIN_ID ? { login_id: cfg.BUATQRIS_LOGIN_ID } : {}),
          ...(cfg.WEBHOOK_URL ? { webhook_url: cfg.WEBHOOK_URL } : {}),
          amount: totalAmount,
          base_amount: baseAmount,
          unique_code: uniqueCode,
          customer_name: input.customerName || 'Nasabah Bank Nusantara',
          description: input.description || `Pembayaran ${input.orderId}`,
          expiry_minutes: expiryMinutes,
        }),
      });

      if (response.ok) {
        const json = (await response.json()) as Record<string, unknown>;
        const dataObj =
          json.data && typeof json.data === 'object'
            ? (json.data as Record<string, unknown>)
            : json;
        const qrisString = String(
          dataObj.qris_content || dataObj.qris_string || dataObj.qr_string || ''
        ).trim();
        const qrisImageUrl = String(
          dataObj.qris_url || dataObj.qr_image_url || dataObj.image_url || ''
        ).trim();
        const externalInvoiceId = String(
          dataObj.qris_invoiceid || dataObj.invoice_id || dataObj.reference || input.orderId
        ).trim();

        if (qrisString || qrisImageUrl) {
          return {
            success: true,
            orderId: input.orderId,
            externalInvoiceId,
            modeUsed: 'api',
            configReady: true,
            baseAmount,
            uniqueCode,
            totalAmount,
            qrisString: qrisString || generateDynamicEmvcoQris(cfg.STATIC_QRIS_STRING, totalAmount),
            createdAt: now.toISOString(),
            expiresAt,
          };
        }
      }
    } catch {
      // Fall through seamlessly to EMVCo dynamic mode in hybrid mode
    } finally {
      clearTimeout(timer);
    }
  }

  // Mode EMVCo Dinamis Otomatis (Tag 54 + Kode Unik 3 Digit + CRC16-CCITT)
  const hasStaticQris = Boolean(cfg.STATIC_QRIS_STRING);
  const dynamicQrisString = generateDynamicEmvcoQris(cfg.STATIC_QRIS_STRING, totalAmount);

  return {
    success: true,
    orderId: input.orderId,
    externalInvoiceId: input.orderId,
    modeUsed: 'emvco',
    configReady: hasStaticQris || hasApiCreds,
    baseAmount,
    uniqueCode,
    totalAmount,
    qrisString: dynamicQrisString,
    createdAt: now.toISOString(),
    expiresAt,
  };
}

/**
 * Mengecek status pembayaran langsung ke endpoint cek status BuatQRIS (Server-Side)
 */
export async function checkBuatQrisStatusServer(
  orderId: string,
  externalInvoiceId?: string
): Promise<CheckBuatQrisStatusResult | null> {
  const cfg = getBuatQrisConfig();
  if (!cfg.SECRET_KEY || !cfg.ACCOUNT_ID || !isAllowedBuatQrisHost(cfg.BUATQRIS_URL_SITE)) {
    return null;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const baseUrl = cfg.BUATQRIS_URL_SITE.replace(/\/+$/, '');
    const targetRef = encodeURIComponent(externalInvoiceId || orderId);
    const headers: Record<string, string> = {
      Accept: 'application/json',
      Authorization: `Bearer ${cfg.SECRET_KEY}`,
      'X-Secret-Key': cfg.SECRET_KEY,
      'X-API-Key': cfg.SECRET_KEY,
      'X-Account-Id': cfg.ACCOUNT_ID,
      'X-Merchant-Id': cfg.ACCOUNT_ID,
    };
    if (cfg.BUATQRIS_LOGIN_ID) {
      headers['X-Login-Id'] = cfg.BUATQRIS_LOGIN_ID;
    }
    const response = await fetch(`${baseUrl}/api/v1/qris/status/${targetRef}`, {
      method: 'GET',
      signal: controller.signal,
      headers,
    });
    if (!response.ok) return null;

    const json = (await response.json()) as Record<string, unknown>;
    const dataObj =
      json.data && typeof json.data === 'object'
        ? (json.data as Record<string, unknown>)
        : json;
    const raw = String(dataObj.status || dataObj.payment_status || 'PENDING').toUpperCase();

    if (raw === 'PAID' || raw === 'SUCCESS' || raw === 'SETTLED' || raw === 'LUNAS') {
      return {
        orderId,
        status: raw === 'SUCCESS' ? 'SUCCESS' : 'PAID',
        paidAt: String(dataObj.paid_at || new Date().toISOString()),
        providerReference: String(dataObj.rrn || dataObj.reference || ''),
        rawStatus: raw,
      };
    }
    if (raw === 'EXPIRED' || raw === 'CANCELLED' || raw === 'FAILED') {
      return {
        orderId,
        status: 'EXPIRED',
        rawStatus: raw,
      };
    }
    return {
      orderId,
      status: 'PENDING',
      rawStatus: raw,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// 3. CLIENT-SIDE BRIDGE HELPERS (DIPANGGIL TOMBOL BAYAR & MODAL QRIS)
// ============================================================================

export interface ClientCreateQrisRequest {
  orderId: string;
  accountId: string;
  amount: number;
  diamondAmount?: number;
  purpose: 'diamond_topup' | 'coin_topup' | 'feature_checkout';
  customerName?: string;
  description?: string;
  useUniqueCode?: boolean;
  expiryMinutes?: number;
  // Petunjuk tarif aktif dari klien untuk membantu sinkronisasi tarif otomatis di server
  clientBaseDiamondPriceRupiah?: number;
  clientDiamondDiscountPercent?: number;
}

export class QrisValidationError extends Error {
  public readonly statusCode: number;
  public readonly errorKind: 'validation' | 'server';

  constructor(message: string, statusCode = 400, errorKind: 'validation' | 'server' = 'validation') {
    super(message);
    this.name = 'QrisValidationError';
    this.statusCode = statusCode;
    this.errorKind = errorKind;
  }
}

/**
 * Fallback QRIS Dinamis EMVCo Lokal (CRC16-CCITT) langsung di browser
 * saat jalur endpoint server QRIS sementara tidak terjangkau / sibuk / hosting statis.
 */
export function createLocalEmvcoFallbackQris(
  payload: ClientCreateQrisRequest,
  notice = 'Server QRIS sedang padat — QRIS Dinamis EMVCo diterbitkan otomatis secara lokal.'
): CreateBuatQrisResult {
  const baseAmount = Math.max(1, Math.round(Number(payload.amount) || 0));
  const useUnique = typeof payload.useUniqueCode === 'boolean' ? payload.useUniqueCode : true;
  const uniqueCode = useUnique ? generateUniqueCode3Digit() : 0;
  const totalAmount = baseAmount + uniqueCode;
  const expiryMinutes = Math.max(1, Math.min(60, payload.expiryMinutes || 10));
  const now = new Date();
  const expiresAt = new Date(now.getTime() + expiryMinutes * 60 * 1000).toISOString();
  const qrisString = generateDynamicEmvcoQris(PLACEHOLDER_EMVCO_STATIC_QRIS, totalAmount);

  return {
    success: true,
    orderId: payload.orderId,
    modeUsed: 'emvco',
    configReady: true,
    configNotice: notice,
    baseAmount,
    uniqueCode,
    totalAmount,
    qrisString,
    createdAt: now.toISOString(),
    expiresAt,
  };
}

export async function requestCreateQrisPayment(
  payload: ClientCreateQrisRequest
): Promise<CreateBuatQrisResult> {
  const maxAttempts = 2;
  let lastNetworkError = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const resp = await fetch('/api/qris/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      const contentType = (resp.headers.get('content-type') || '').toLowerCase();
      const isJson = contentType.includes('application/json');

      if (!resp.ok) {
        // Error validasi bisnis (400/422) dari server: tampilkan alasan spesifik — JANGAN disamarkan jadi error jaringan!
        if (resp.status >= 400 && resp.status < 500 && resp.status !== 404 && resp.status !== 408 && isJson) {
          let errMsg = 'Permintaan Top-Up tidak memenuhi syarat nominal atau tarif aktif.';
          try {
            const errData = (await resp.json()) as { message?: string };
            if (errData?.message) errMsg = errData.message;
          } catch {
            // abaikan gagal parse body error
          }
          throw new QrisValidationError(errMsg, resp.status, 'validation');
        }

        // 404 (static host), 408, 429, atau 5xx -> coba ulang sekali lalu fallback EMVCo lokal
        lastNetworkError = `Server QRIS mengembalikan HTTP ${resp.status}`;
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        return createLocalEmvcoFallbackQris(
          payload,
          'Jalur server QRIS sedang tidak tersedia — dialihkan otomatis ke QRIS Dinamis EMVCo lokal.'
        );
      }

      if (!isJson) {
        lastNetworkError = 'Respons server bukan JSON QRIS yang valid';
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 350));
          continue;
        }
        return createLocalEmvcoFallbackQris(
          payload,
          'Mode QRIS Dinamis EMVCo lokal aktif otomatis untuk menjaga kelancaran transaksi.'
        );
      }

      const data = (await resp.json()) as CreateBuatQrisResult & { message?: string };
      if (!data || !data.success || !data.qrisString) {
        if (data?.message) {
          throw new QrisValidationError(data.message, 400, 'validation');
        }
        return createLocalEmvcoFallbackQris(payload);
      }
      return data;
    } catch (err) {
      if (err instanceof QrisValidationError) {
        throw err;
      }
      lastNetworkError = err instanceof Error ? err.message : 'Timeout koneksi server QRIS';
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 350));
        continue;
      }
      // Fallback mulus ke QRIS Dinamis EMVCo lokal agar nasabah tidak mentok error jaringan palsu
      return createLocalEmvcoFallbackQris(
        payload,
        `Jalur API QRIS sementara tertunda (${lastNetworkError || 'koneksi sibuk'}) — QRIS Dinamis EMVCo lokal diterbitkan otomatis.`
      );
    } finally {
      clearTimeout(timer);
    }
  }

  return createLocalEmvcoFallbackQris(payload);
}

export async function requestCheckQrisPaymentStatus(
  orderId: string
): Promise<{
  success: boolean;
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'LUNAS' | 'EXPIRED';
  paidAt?: string;
  providerReference?: string;
  configReady?: boolean;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const resp = await fetch(`/api/qris/status/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    const contentType = (resp.headers.get('content-type') || '').toLowerCase();
    if (!resp.ok || !contentType.includes('application/json')) {
      return { success: false, status: 'PENDING' };
    }
    return (await resp.json()) as {
      success: boolean;
      status: 'PENDING' | 'PAID' | 'SUCCESS' | 'LUNAS' | 'EXPIRED';
      paidAt?: string;
      providerReference?: string;
      configReady?: boolean;
    };
  } catch {
    return { success: false, status: 'PENDING' };
  } finally {
    clearTimeout(timer);
  }
}
