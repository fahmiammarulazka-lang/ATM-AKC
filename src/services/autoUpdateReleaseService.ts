/**
 * Bank Nusantara — Mesin Penomoran Versi Terstruktur (vAAA.SSS.DDD),
 * Sinkronisasi Katalog Rilis, Pembersihan Spam Auto-DD & Filter Visibilitas Khusus Admin
 * ------------------------------------------------------------------------------------
 * Aturan Resmi Penomoran Versi (vAAA.SSS.DDD):
 * - v   : Singkatan dari version (versi).
 * - AAA (Major): Naik saat ada penambahan fitur baru yang besar atau penambahan lebih dari 3 fitur sekaligus.
 * - SSS (Minor): Naik saat ada penambahan fitur baru (00–99 lalu berlanjut alami ke 100–999, contoh v13.34.00 -> v13.100.00).
 * - DDD (Patch): Naik saat perbaikan bug, optimalisasi kecil, atau tambalan keamanan (00–99 lalu 100–999).
 * - Tanpa reset segmen belakang saat AAA atau SSS naik (+1 melanjutkan angka SSS.DDD)
 * - Rollover otomatis hanya saat melebihi 999 (999 -> 00 ke segmen depannya).
 */
import {
  AppUpdateRecord,
  AppUpdateReleaseType,
  AppUpdateVisibilityMode,
} from '../types/bank';

export const STRUCTURED_BASE_VERSION = 'v16.46.22';

export interface StructuredVersion {
  p: number; // AAA: Major (fitur besar / penambahan > 3 fitur sekaligus)
  w: number; // SSS: Minor / Format S (penambahan fitur baru, 0..999)
  g: number; // DDD: Patch / Format D (perbaikan bug, optimalisasi kecil, keamanan, 0..999)
}

export interface ActiveAppBuildInfo {
  buildId: string;
  buildIso: string;
  buildDateWib: string;
  catalogVersion: string;
}

export interface VersionJumpValidationResult {
  isValidFormat: boolean;
  hasWarning: boolean;
  normalizedVersion: string;
  warningMessage: string | null;
  matchedReleaseType: AppUpdateReleaseType | null;
}

export interface PublicUpdateResolution {
  visible: boolean;
  filteredRecord: AppUpdateRecord | null;
  hiddenPointsCount: number;
  hasAdminContent: boolean;
  effectiveStatus: 'public' | 'filtered_mixed' | 'admin_hidden';
}

export function getActiveAppBuildInfo(): ActiveAppBuildInfo {
  const buildId =
    typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__
      ? __APP_BUILD_ID__
      : 'BLD-20261125-1900';
  const buildIso =
    typeof __APP_BUILD_ISO__ !== 'undefined' && __APP_BUILD_ISO__
      ? __APP_BUILD_ISO__
      : new Date().toISOString();
  const buildDateWib =
    typeof __APP_BUILD_DATE_WIB__ !== 'undefined' && __APP_BUILD_DATE_WIB__
      ? __APP_BUILD_DATE_WIB__
      : 'Rabu, 25 November 2026 • Pukul 19:00 WIB';
  const catalogVersion =
    typeof __APP_CATALOG_RELEASE_VERSION__ !== 'undefined' && __APP_CATALOG_RELEASE_VERSION__
      ? __APP_CATALOG_RELEASE_VERSION__
      : STRUCTURED_BASE_VERSION;

  return { buildId, buildIso, buildDateWib, catalogVersion };
}

/**
 * Mengecek apakah string versi mengikuti format 3-segmen vAAA.SSS.DDD
 */
export function isStructuredThreePartVersion(versionStr?: string): boolean {
  if (!versionStr) return false;
  return /^\s*v?(\d{1,3})\.(\d{1,3})\.(\d{1,3})\s*$/i.test(versionStr);
}

/**
 * Mem-parsing versi 3-segmen vAAA.SSS.DDD menjadi angka { p, w, g }
 */
export function parseStructuredVersion(versionStr?: string): StructuredVersion | null {
  if (!versionStr) return null;
  const match = String(versionStr)
    .trim()
    .match(/^v?(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i);
  if (!match) return null;
  const p = Number.parseInt(match[1], 10);
  const w = Number.parseInt(match[2], 10);
  const g = Number.parseInt(match[3], 10);
  if (!Number.isFinite(p) || !Number.isFinite(w) || !Number.isFinite(g)) return null;
  if (p < 0 || p > 999 || w < 0 || w > 999 || g < 0 || g > 999) return null;
  return { p, w, g };
}

/**
 * Memformat { p, w, g } ke bentuk resmi vAAA.SSS.DDD:
 * - Di bawah 100 tampil minimal 2 digit (misal v13.34.00)
 * - Mulai 100 tampil alami 3 digit (misal v13.100.00, v13.101.00)
 */
export function formatStructuredVersion(v: StructuredVersion): string {
  const safeP = Math.max(0, Math.min(999, Math.floor(v.p)));
  const safeW = Math.max(0, Math.min(999, Math.floor(v.w)));
  const safeG = Math.max(0, Math.min(999, Math.floor(v.g)));
  return `v${safeP}.${String(safeW).padStart(2, '0')}.${String(safeG).padStart(2, '0')}`;
}

/**
 * Menormalkan input versi Admin: jika 3 segmen angka, selalu dibakukan menjadi v{p}.{w}.{g}
 */
export function normalizeVersionInput(raw: string): string {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return '';
  const parsed = parseStructuredVersion(trimmed);
  if (parsed) return formatStructuredVersion(parsed);
  return trimmed;
}

/**
 * Membandingkan dua versi 3-segmen: > 0 jika a lebih baru dari b
 */
export function compareStructuredVersions(a: StructuredVersion, b: StructuredVersion): number {
  if (a.p !== b.p) return a.p - b.p;
  if (a.w !== b.w) return a.w - b.w;
  return a.g - b.g;
}

/**
 * Menormalkan tipe rilis historis ('bug' -> 'minor', 'small_bug' -> 'patch', 'feature_and_bug' -> 'feature_and_bug') ke standar vAAA.SSS.DDD
 */
export function normalizeReleaseType(
  releaseType?: AppUpdateReleaseType
): 'major' | 'minor' | 'patch' | 'feature_and_bug' {
  if (releaseType === 'major') return 'major';
  if (releaseType === 'feature_and_bug') return 'feature_and_bug';
  if (releaseType === 'minor' || releaseType === 'bug') return 'minor';
  return 'patch';
}

/**
 * Menaikkan versi 3-segmen sesuai tipe rilis vAAA.SSS.DDD:
 * - major (+AAA): Pembaruan fitur baru yang besar atau penambahan > 3 fitur sekaligus (melanjutkan SSS.DDD tanpa reset)
 * - minor (+SSS / Format S): Penambahan fitur baru (99 -> 100 -> ... -> 999, rollover ke AAA hanya jika > 999)
 * - patch (+DDD / Format D): Perbaikan bug / optimalisasi kecil / keamanan (99 -> 100 -> ... -> 999, rollover ke SSS hanya jika > 999)
 * - feature_and_bug (+SSS & +DDD / Format S + D): Jika ada 2 update sekaligus (1 penambahan fitur baru + 1 perbaikan bug), kedua segmen S dan D naik +1 bersamaan!
 */
export function bumpStructuredVersion(
  baseVersionStr: string | undefined,
  releaseType: AppUpdateReleaseType
): string {
  const base = parseStructuredVersion(baseVersionStr) || { p: 14, w: 35, g: 43 };
  let { p, w, g } = base;
  const kind = normalizeReleaseType(releaseType);

  if (kind === 'major') {
    p = Math.min(999, p + 1);
  } else if (kind === 'feature_and_bug') {
    // Format S + D: Tambah +1 ke SSS (Fitur) dan +1 ke DDD (Bug) sekaligus
    g += 1;
    if (g > 999) {
      g = 0;
      w += 1;
    }
    w += 1;
    if (w > 999) {
      w = 0;
      p = Math.min(999, p + 1);
    }
  } else if (kind === 'minor') {
    w += 1;
    if (w > 999) {
      w = 0;
      p = Math.min(999, p + 1);
    }
  } else {
    // patch (+DDD)
    g += 1;
    if (g > 999) {
      g = 0;
      w += 1;
      if (w > 999) {
        w = 0;
        p = Math.min(999, p + 1);
      }
    }
  }

  return formatStructuredVersion({ p, w, g });
}

/**
 * Mengambil versi format 3-segmen terbaru dari seluruh daftar (mengabaikan arsip 2-segmen lama v1.0–v19.0)
 */
export function getLatestStructuredVersion(records: AppUpdateRecord[]): string {
  let best: StructuredVersion | null = null;
  for (const rec of records) {
    if (rec?.visibilityMode === 'admin_only') continue;
    const parsed = parseStructuredVersion(rec?.version);
    if (!parsed) continue;
    if (!best || compareStructuredVersions(parsed, best) > 0) {
      best = parsed;
    }
  }
  return best ? formatStructuredVersion(best) : STRUCTURED_BASE_VERSION;
}

/**
 * Validasi lunak kenaikan versi di Panel Admin (Format vAAA.SSS.DDD):
 * - Memberi peringatan jika format bukan vAAA.SSS.DDD, versi sama/mundur, atau lompat lebih dari +1
 * - Mengenali kenaikan tunggal (+AAA, +SSS, +DDD) maupun kenaikan gabungan Format S + D (+SSS & +DDD)
 * - Tetap mengizinkan Admin menyimpan apabila dikehendaki
 */
export function validateVersionJump(
  currentVersionStr: string,
  candidateVersionStr: string
): VersionJumpValidationResult {
  const normalized = normalizeVersionInput(candidateVersionStr);
  const currentParsed = parseStructuredVersion(currentVersionStr) || { p: 14, w: 39, g: 49 };
  const currentFormatted = formatStructuredVersion(currentParsed);

  const candidateParsed = parseStructuredVersion(candidateVersionStr);
  if (!candidateParsed) {
    return {
      isValidFormat: false,
      hasWarning: true,
      normalizedVersion: normalized,
      matchedReleaseType: null,
      warningMessage:
        'Format versi disarankan mengikuti pola vAAA.SSS.DDD dengan angka 00–999 untuk SSS & DDD (contoh: v14.39.49). Anda tetap bisa menyimpan jika memang disengaja.',
    };
  }

  const nextMajor = bumpStructuredVersion(currentFormatted, 'major');
  const nextMinor = bumpStructuredVersion(currentFormatted, 'minor');
  const nextPatch = bumpStructuredVersion(currentFormatted, 'patch');
  const nextFeatureAndBug = bumpStructuredVersion(currentFormatted, 'feature_and_bug');

  if (normalized === nextMajor) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'major',
      warningMessage: null,
    };
  }
  if (normalized === nextFeatureAndBug) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'feature_and_bug',
      warningMessage: null,
    };
  }
  if (normalized === nextMinor) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'minor',
      warningMessage: null,
    };
  }
  if (normalized === nextPatch) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'patch',
      warningMessage: null,
    };
  }

  const cmp = compareStructuredVersions(candidateParsed, currentParsed);
  if (cmp === 0) {
    return {
      isValidFormat: true,
      hasWarning: true,
      normalizedVersion: normalized,
      matchedReleaseType: null,
      warningMessage: `Nomor versi ${normalized} sama dengan versi aktif ${currentFormatted}. Pilih salah satu tombol Major (+AAA), Minor (+SSS), Patch (+DDD), atau Gabungan Fitur + Bug (Format S + D) untuk kenaikan bertahap.`,
    };
  }
  if (cmp < 0) {
    return {
      isValidFormat: true,
      hasWarning: true,
      normalizedVersion: normalized,
      matchedReleaseType: null,
      warningMessage: `Nomor versi ${normalized} lebih rendah dari versi aktif saat ini (${currentFormatted}). Pastikan ini memang disengaja sebelum menyimpan.`,
    };
  }

  const dp = candidateParsed.p - currentParsed.p;
  const dw = candidateParsed.w - currentParsed.w;
  const dg = candidateParsed.g - currentParsed.g;
  const jumpParts: string[] = [];
  if (dp > 1) jumpParts.push(`Major AAA melompat +${dp}`);
  if (dw > 1) jumpParts.push(`Minor SSS melompat +${dw}`);
  if (dg > 1) jumpParts.push(`Patch DDD melompat +${dg}`);

  const detail =
    jumpParts.length > 0
      ? jumpParts.join(', ')
      : `perubahan dari ${currentFormatted} ke ${normalized} melebihi satu langkah (+1)`;

  return {
    isValidFormat: true,
    hasWarning: true,
    normalizedVersion: normalized,
    matchedReleaseType: null,
    warningMessage: `Peringatan Anti-Lompat Jauh: ${detail}. Saran bertahap: ${nextPatch} (Patch +DDD), ${nextMinor} (Minor +SSS), atau ${nextMajor} (Major +AAA). Admin tetap dapat menyimpan jika diperlukan.`,
  };
}

// =====================================================================================
// MESIN DETEKSI & PENYARINGAN UPDATE KHUSUS ADMIN (AUTO + SAKELAR MANUAL)
// =====================================================================================

const CUSTOMER_FEE_PROTECT_REGEX = /\bbiaya\s+admin(?:istrasi)?\b/gi;

function maskCustomerFeePhrases(input: string): {
  masked: string;
  restore: (text: string) => string;
} {
  const captured: string[] = [];
  const masked = String(input || '').replace(CUSTOMER_FEE_PROTECT_REGEX, (match) => {
    const idx = captured.length;
    captured.push(match);
    return `__BN_CUSTOMER_FEE_${idx}__`;
  });
  return {
    masked,
    restore: (text: string) =>
      text.replace(/__BN_CUSTOMER_FEE_(\d+)__/g, (_, i) => captured[Number(i)] || 'biaya admin'),
  };
}

const ADMIN_KEYWORD_PATTERNS: RegExp[] = [
  /\bpanel\s+admin\b/i,
  /\bportal\s+admin\b/i,
  /\btab\s+admin\b/i,
  /\badmin\s+portal\b/i,
  /\badmin\s+utama\b/i,
  /\bsuper\s*tool(?:s)?\b/i,
  /\bpin\s+admin\b/i,
  /\brole\s+dev\b/i,
  /\bdev\s+role\b/i,
  /\bakun\s+oa\b/i,
  /\bkartu\s+admin\b/i,
  /\btier\s+admin\b/i,
  /\botorisasi\s+admin\b/i,
  /\bpersetujuan\s+admin\b/i,
  /\btinjauan\s+admin\b/i,
  /\bkhusus\s+admin\b/i,
  /\bmode\s+admin\b/i,
  /\bakses\s+admin\b/i,
  /\bakun\s+admin\b/i,
  /\bgoogle\s+admin\b/i,
  /\bverifikasi\s+admin\b/i,
  /\bpusat\s+kelola\b.*\badmin\b/i,
  /\bkelola\b.*\bpanel\s+admin\b/i,
  /\badmin\s+dapat\b/i,
  /\bdikelola\s+(oleh\s+)?admin\b/i,
  /\bdiedit\s+(oleh\s+|di\s+panel\s+)?admin\b/i,
  /\bdiatur\s+(oleh\s+|di\s+panel\s+)?admin\b/i,
  /\bsuntingan\s+admin\b/i,
  /\bcatatan\s+admin\b/i,
  /\bbuatan\s+admin\b/i,
  /\btombol\s+.*admin\b/i,
  /\bsimulasi\s+tanggal\b.*\badmin\b/i,
  /\bforce\s+clear\s+stage\b/i,
  /\bdaftar\s+riwayat\s+update\s+website\b.*\badmin\b/i,
  /\bstudio\s+tanda\s+tangan\b.*\badmin\b/i,
  /\b\(pa\)\b/i,
  /\badmin\b/i,
];

const CUSTOMER_FEATURE_SIGNAL_PATTERNS: RegExp[] = [
  /\bnasabah\b/i,
  /\bmobile\s+banking\b/i,
  /\bdashboard\b/i,
  /\brekening\b/i,
  /\btransfer\b/i,
  /\bemas\b/i,
  /\bmining\b/i,
  /\blelang\b/i,
  /\bhutang\b/i,
  /\bpinjaman\b/i,
  /\bdeposito\b/i,
  /\bhadiah\b/i,
  /\bsurat\b/i,
  /\bminigame\b/i,
  /\bspin\b/i,
  /\bchat\b/i,
  /\blogin\b/i,
  /\bversi\b/i,
  /\bpanduan\b/i,
  /\batm\b/i,
  /\bqris\b/i,
  /\bsaldo\b/i,
  /\bkartu\b/i,
  /\bnotifikasi\b/i,
  /\bmisi\b/i,
  /\bleaderboard\b/i,
  /\bprofil\b/i,
  /\bkeluarga\b/i,
  /\bsensor\b/i,
  /\bprivasi\b/i,
];

export function isAdminRelatedLine(text?: string): boolean {
  if (!text) return false;
  const { masked } = maskCustomerFeePhrases(text);
  return ADMIN_KEYWORD_PATTERNS.some((re) => re.test(masked));
}

function hasCustomerFeatureSignal(text?: string): boolean {
  if (!text) return false;
  return CUSTOMER_FEATURE_SIGNAL_PATTERNS.some((re) => re.test(text));
}

function stripResidualAdminPhrases(text: string): string {
  const { masked, restore } = maskCustomerFeePhrases(text);
  let clean = masked
    .replace(/\s*\([^)]*\b(?:admin|panel\s+admin|portal\s+admin|super\s*tool|pin\s+admin|role\s+dev|akun\s+oa|kartu\s+admin|tier\s+admin)\b[^)]*\)/gi, '')
    .replace(/\b(?:di|ke|dari|oleh)\s+(?:panel\s+admin|portal\s+admin|admin(?:\s+utama)?)\b/gi, '')
    .replace(/\b(?:kartu\s+admin\s*(?:\(?\s*(?:infinity|∞)\s*\)?)?|tier\s+admin)\b/gi, 'kartu prioritas')
    .replace(/\b(?:panel\s+admin|portal\s+admin|super\s*tool(?:s)?|pin\s+admin|role\s+dev|akun\s+oa)\b/gi, 'sistem')
    .replace(/\badmin\b/gi, 'pengelola sistem')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
  clean = restore(clean);
  return clean;
}

/**
 * Membersihkan frasa atau klausa yang secara eksplisit menyebut istilah Admin dari judul campuran
 * tanpa memotong dengan '...' atau menghilangkan frasa biaya admin transaksi.
 */
function sanitizeTitleForPublic(title: string): string {
  const { masked, restore } = maskCustomerFeePhrases(title.trim());
  let clean = masked
    .replace(/\s*(?:&|\+|dan|serta|,)\s+[^—–-]*\b(?:panel\s+admin|portal\s+admin|khusus\s+admin|super\s*tool(?:s)?|pin\s+admin|role\s+dev|akun\s+oa|kartu\s+admin|tier\s+admin)\b[^—–-]*/gi, '')
    .replace(/\s+di\s+(?:panel\s+admin|portal\s+admin)\b/gi, '')
    .replace(/\b(?:kartu\s+admin(?:\s+infinity\s*\(?∞\)?)?|tier\s+admin)\b/gi, 'Layanan Prioritas')
    .replace(/\b(?:panel\s+admin|portal\s+admin|super\s*tool(?:s)?|pin\s+admin|role\s+dev|akun\s+oa)\b/gi, 'Sistem Terpadu')
    .replace(/\badmin\b/gi, 'Sistem')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,&+-]+$/, '')
    .trim();

  const restored = restore(clean);
  return restored || 'Pembaruan Layanan Bank Nusantara';
}

/**
 * Menyaring kalimat atau klausa bernomor khusus Admin di dalam deskripsi campuran
 * agar teks publik tetap mengalir utuh dan natural (tetap menjaga frasa "biaya admin").
 */
function sanitizeDescriptionForPublic(description: string): string {
  const raw = String(description || '').trim();
  if (!raw) return '';
  if (!isAdminRelatedLine(raw)) return raw;

  const { masked, restore } = maskCustomerFeePhrases(raw);

  // 1. Jika mengandung pemisah klausa titik-koma
  if (masked.includes(';')) {
    const segments = masked.split(';').map((s) => s.trim()).filter(Boolean);
    const keptSegments = segments.filter((seg) => !ADMIN_KEYWORD_PATTERNS.some((re) => re.test(seg)));
    if (keptSegments.length > 0 && keptSegments.length < segments.length) {
      let joined = keptSegments.join('; ').replace(/;\s*$/, '');
      if (!/[.!?]$/.test(joined)) joined += '.';
      return restore(joined);
    }
  }

  // 2. Saring kalimat-kalimat yang khusus membahas fitur internal
  const sentences = masked
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const keptSentences = sentences.filter((s) => !ADMIN_KEYWORD_PATTERNS.some((re) => re.test(s)));
  if (keptSentences.length > 0) {
    return restore(keptSentences.join(' '));
  }

  // 3. Jika hanya satu kalimat panjang namun punya konteks fitur nasabah, bersihkan anak klausa internal
  const stripped = stripResidualAdminPhrases(restore(masked));
  return stripped || 'Pembaruan dan peningkatan kualitas layanan Bank Nusantara.';
}

/**
 * Mengevaluasi visibilitas publik satu catatan update:
 * - visibilityMode === 'admin_only' -> sembunyikan penuh
 * - visibilityMode === 'public' -> tampilkan penuh tanpa penyaringan
 * - visibilityMode === 'auto' (atau undefined) -> saring poin & frasa internal di seluruh rilis lama & baru
 */
export function resolvePublicAppUpdate(rec: AppUpdateRecord): PublicUpdateResolution {
  const mode: AppUpdateVisibilityMode = rec.visibilityMode || 'auto';
  const rawPoints =
    Array.isArray(rec.highlights) && rec.highlights.length > 0
      ? rec.highlights
      : Array.isArray(rec.changes)
      ? rec.changes
      : [];

  const adminPoints = rawPoints.filter((p) => isAdminRelatedLine(p));
  const publicPoints = rawPoints.filter((p) => !isAdminRelatedLine(p));
  const titleHasAdmin = isAdminRelatedLine(rec.title);
  const descHasAdmin = isAdminRelatedLine(rec.description);
  const authorHasAdmin = isAdminRelatedLine(rec.author);
  const hasAdminContent = adminPoints.length > 0 || titleHasAdmin || descHasAdmin || authorHasAdmin;

  if (mode === 'admin_only') {
    return {
      visible: false,
      filteredRecord: null,
      hiddenPointsCount: rawPoints.length,
      hasAdminContent: true,
      effectiveStatus: 'admin_hidden',
    };
  }

  if (mode === 'public') {
    return {
      visible: true,
      filteredRecord: { ...rec },
      hiddenPointsCount: 0,
      hasAdminContent,
      effectiveStatus: 'public',
    };
  }

  // Mode 'auto': deteksi jika keseluruhan catatan murni tentang Admin/Internal
  const allPointsAreAdmin = rawPoints.length > 0 && publicPoints.length === 0;
  const cleanedTitleProbe = maskCustomerFeePhrases(rec.title || '').masked.replace(
    /\b(?:panel\s+admin|portal\s+admin|super\s*tool(?:s)?|pin\s+admin|role\s+dev|akun\s+oa|kartu\s+admin|tier\s+admin|admin)\b/gi,
    ''
  );
  const cleanedDescProbe = maskCustomerFeePhrases(rec.description || '').masked.replace(
    /\b(?:panel\s+admin|portal\s+admin|super\s*tool(?:s)?|pin\s+admin|role\s+dev|akun\s+oa|kartu\s+admin|tier\s+admin|admin)\b/gi,
    ''
  );

  const purelyAdminWithoutPoints =
    rawPoints.length === 0 &&
    (titleHasAdmin || descHasAdmin) &&
    !hasCustomerFeatureSignal(`${cleanedTitleProbe} ${cleanedDescProbe}`);

  const titleOnlyAdmin =
    titleHasAdmin &&
    !hasCustomerFeatureSignal(cleanedTitleProbe) &&
    publicPoints.length === 0;

  if (allPointsAreAdmin || purelyAdminWithoutPoints || titleOnlyAdmin) {
    return {
      visible: false,
      filteredRecord: null,
      hiddenPointsCount: rawPoints.length,
      hasAdminContent: true,
      effectiveStatus: 'admin_hidden',
    };
  }

  const sanitizedTitle = titleHasAdmin ? sanitizeTitleForPublic(rec.title) : rec.title;
  const sanitizedDesc = descHasAdmin
    ? sanitizeDescriptionForPublic(rec.description)
    : rec.description;
  const sanitizedAuthor = authorHasAdmin
    ? 'Tim Pengembangan Bank Nusantara'
    : rec.author;

  const filteredRecord: AppUpdateRecord = {
    ...rec,
    title: sanitizedTitle,
    description: sanitizedDesc,
    ...(sanitizedAuthor ? { author: sanitizedAuthor } : {}),
    highlights: rawPoints.length > 0 ? publicPoints : undefined,
    changes: rawPoints.length > 0 ? publicPoints : undefined,
  };

  return {
    visible: true,
    filteredRecord,
    hiddenPointsCount: adminPoints.length,
    hasAdminContent,
    effectiveStatus: hasAdminContent ? 'filtered_mixed' : 'public',
  };
}

/**
 * Memproyeksikan daftar penuh appUpdates menjadi daftar publik untuk nasabah (dan pratinjau Tab Update).
 * Jika rilis aktif (isCurrent) asli tersembunyi khusus Admin, otomatis mempromosikan rilis publik terbaru.
 */
export function getPublicAppUpdates(records: AppUpdateRecord[]): AppUpdateRecord[] {
  const resolved: AppUpdateRecord[] = [];
  for (const rec of records) {
    const res = resolvePublicAppUpdate(rec);
    if (res.visible && res.filteredRecord) {
      resolved.push(res.filteredRecord);
    }
  }

  if (resolved.length === 0) return [];

  const existingCurrent = resolved.find((u) => u.isCurrent);
  const activePublicId = existingCurrent ? existingCurrent.id : resolved[0].id;

  const normalized = resolved.map((u) => ({
    ...u,
    isCurrent: u.id === activePublicId,
  }));

  normalized.sort((a, b) => {
    if (a.isCurrent && !b.isCurrent) return -1;
    if (!a.isCurrent && b.isCurrent) return 1;
    return 0;
  });

  return normalized;
}

export function getPublicCurrentUpdate(records: AppUpdateRecord[]): AppUpdateRecord | null {
  const pub = getPublicAppUpdates(records);
  return pub.find((u) => u.isCurrent) || pub[0] || null;
}

/**
 * Katalog rilis khusus Admin (menggunakan penomoran terpisah vAdmin agar terpisah
 * dari nomor versi aplikasi publik v16.46.21).
 */
export const BUILT_IN_ADMIN_UPDATES_CATALOG: AppUpdateRecord[] = [
  {
    id: 'upd-admin-v1-5-0',
    version: 'vAdmin 1.5.0',
    releaseType: 'minor',
    visibilityMode: 'admin_only',
    title:
      'Panel Kontrol Spin Bingkai 25 Heksagon (Harga 18/87 Koin, Peluang 5%, Token Berbobot 1–20, Toko 500 Token, Mode Paksa Menang & Kirim/Cabut Bingkai Aura Nasabah)',
    description:
      'Pembaruan Panel Admin vAdmin 1.5.0 (bersamaan rilis publik v16.46.21) menambahkan kendali lengkap mode Spin Bingkai pusaran 25 heksagon di dalam tab Kontrol Spin the Wheel: atur status aktif/tutup Spin Bingkai, ubah harga 1x (18 Koin) & 5x (87 Koin), persentase peluang menang Bingkai Aura (default 5%), rentang hadiah Token berbobot kotak 1–25 (default 1–20), kompensasi duplikat (+5 Token), biaya tukar Toko Bingkai (500 Token dengan migrasi otomatis nilai lama), saklar Mode Paksa Dapat Bingkai (100%), serta panel pemberian/penarikan Token dan 5 Bingkai Aura hidup langsung per rekening nasabah.',
    highlights: [
      'Pengaturan Penuh Spin Bingkai di Tab Spin Admin: Ubah biaya 1x (18 Koin) & 5x (87 Koin), biaya tukar toko (500 Token), peluang menang Bingkai (default 5%), rentang Token berbobot (1–20), serta kompensasi bingkai duplikat (+5 Token).',
      'Saklar Buka/Tutup & Mode Paksa Menang Bingkai: Aktifkan atau tutup sementara mode Spin Bingkai maupun aktifkan Mode Paksa Dapat Bingkai (100%) untuk acara khusus.',
      'Kelola Token & 5 Bingkai Aura per Akun Nasabah: Tambah +100 / +500 Token serta kirim atau tarik langsung Bingkai Petir Cyber, Api Naga, Emas Imperial, Kristal Es, dan Galaksi Kosmik per rekening.',
      'Sinkronisasi Real-Time Cloud, Migrasi Otomatis & Toast Admin: Konfigurasi lama 5–25 Token / 300 Tukar otomatis dimigrasi ke 1–20 Token / 500 Tukar dan setiap perubahan memberi toast konfirmasi pojok kanan atas.',
    ],
    changes: [
      'Menambahkan sub-bagian 5 (Kontrol Spin Bingkai) dan sub-bagian 6 (Kelola Token & 5 Bingkai Aura per Nasabah) di AdminPortal tab spin_wheel_admin dengan default 1–20 Token dan 500 Token tukar.',
      'Menambahkan aksi adminGrantSpinTokensAndFrame, commitPendingFrameSpinReward, dan migrasi otomatis normalizeFrameSpinConfig di BankContext & spinWheelCatalog.',
      'Menjamin pemegang Kartu Tier Admin tetap mempertahankan saldo Koin Spin Infinity (∞) saat memutar Spin Bingkai maupun Spin Uang.',
    ],
    dateText: '28 Nov 2026',
    fullDate: 'Sabtu, 28 November 2026 • Pukul 13:00 WIB',
    categoryBadge: 'Rilis Internal Admin Terbaru',
    isCurrent: true,
    author: 'Super Admin Utama (AzkaAKC)',
    createdAt: '2026-11-28T06:00:00.000Z',
    isAutoDetected: true,
  },
  {
    id: 'upd-admin-v1-4-0',
    version: 'vAdmin 1.4.0',
    releaseType: 'minor',
    visibilityMode: 'admin_only',
    title:
      '7 Pilihan Jadwal Reset 100 Misi Aktif Loyalty (Default Mingguan Senin 00:00 WIB + Jam/Hari Custom, Reset Sekarang Opsional & Hitung Mundur Real-Time WIB)',
    description:
      'Pembaruan Panel Admin vAdmin 1.4.0 (bersamaan rilis publik v16.43.20) menambahkan kendali penuh 7 pilihan jadwal reset khusus 100 Misi Aktif Loyalty pada sub-tab 100 Misi & Pencapaian di tab Setting Streak & Loyalty. Default sistem kini Mingguan setiap Senin pukul 00:00 WIB dengan pemilih jam reset (00:00–23:00 WIB), patokan hari (Senin–Minggu), pratinjau hitung mundur real-time WIB, serta tombol opsional "Reset Misi Sekarang". Perubahan jadwal langsung berlaku pada siklus berjalan, sedangkan Auto-Streak harian dan batas penukaran poin harian tetap berjalan terpisah setiap hari pukul 00:00 WIB.',
    highlights: [
      '7 Pilihan Jadwal Reset 100 Misi Loyalty (Default Mingguan): Pilih Setiap 1 Hari, Setiap 3 Hari, Mingguan (Default), Setiap 2 Minggu, Bulanan (Tanggal 1), Pilih Hari Tertentu (Senin–Minggu), atau Manual Admin Saja.',
      'Patokan Hari & Jam Reset WIB yang Bisa Diubah + Pratinjau Langsung: Default Mingguan jatuh pada Senin 00:00 WIB; Admin dapat mengatur hari patokan (Senin–Minggu) serta jam reset (00:00–23:00 WIB) dan langsung melihat pratinjau hitung mundurnya sebelum menyimpan.',
      'Berlaku Langsung di Siklus Aktif + Tombol Opsional Reset Sekarang: Menyimpan jadwal baru langsung memperbarui siklus aktif nasabah, ditambah tombol konfirmasi "Reset Misi Sekarang" yang otomatis mengosongkan progres, klaim, dan batas transaksi misi ke nol.',
      'Isolasi Penuh Auto-Streak & Batas Tukar Harian: Mesin Auto-Streak online dan kuota batas penukaran poin harian nasabah tetap terkunci harian pukul 00:00 WIB agar kedisiplinan streak tidak ikut melambat.',
    ],
    changes: [
      'Menambahkan 7 pilihan jadwal reset (daily, every_3_days, weekly, biweekly, monthly, custom_day, manual) dengan default weekly (Senin 00:00 WIB) pada konfigurasi Admin Loyalty.',
      'Menambahkan UI pemilih 7 opsi jadwal reset, patokan hari Senin–Minggu, jam reset WIB (00:00–23:00), kotak pratinjau hitung mundur real-time, serta tombol opsional Reset Misi Sekarang di Sub-Tab 3 AdminLoyaltyStreakPanel.',
      'Memisahkan missionCycleKey dan rentang jendela transaksi misi dari tanggal harian WIB agar Auto-Streak dan dailyRedemptionCount tetap reset harian pukul 00:00 WIB.',
      'Memperbarui halaman Misi Nasabah dengan label jadwal reset aktif, waktu reset berikutnya, serta hitung mundur WIB detik-per-detik secara real-time.',
    ],
    dateText: '27 Nov 2026',
    fullDate: 'Jumat, 27 November 2026 • Pukul 23:10 WIB',
    categoryBadge: 'Rilis Internal Admin Terbaru',
    isCurrent: false,
    author: 'Super Admin Utama (AzkaAKC)',
    createdAt: '2026-11-27T16:10:00.000Z',
    isAutoDetected: true,
  },
  {
    id: 'upd-admin-v1-3-0',
    version: 'vAdmin 1.3.0',
    releaseType: 'minor',
    visibilityMode: 'admin_only',
    title:
      'Tab Khusus Panel Admin: Setting Streak & Loyalty (5 Sub-Tab Rapi, Mode Libur Nasional, Bonus 14/30 Hari, 4 Aksi Massal, Badge Kritis 3 & Log Penukaran Live)',
    description:
      'Pembaruan eksklusif internal Admin vAdmin 1.3.0 tanpa mengubah versi publik (tetap v16.43.10). Memindahkan penuh kontrol Loyalty & Streak dari area Kantong Impian menjadi tab khusus tepat di sebelah Misi Harian & Leaderboard, lengkap dengan badge merah jumlah nasabah beku kritis tahap 3, izin per-tab di Pengangkatan Admin, 4 kartu statistik atas + Top 5 Streak & Poin, 5 sub-tab rapi, Mode Libur Nasional anti-beku, bonus streak Hari ke-14 & ke-30, 4 aksi massal aman, filter lengkap kelola per nasabah, dan tabel log penukaran live.',
    highlights: [
      'Tab Navigasi Khusus + Badge Kritis Tahap 3 & RBAC: Ditempatkan di sebelah Misi Harian & Leaderboard lengkap dengan lencana merah jumlah nasabah Beku Kritis Tahap 3, pintasan cepat dari Kantong Impian, dan masuk daftar izin per-tab Pengangkatan Kartu Tier Admin.',
      'Pita Statistik Atas + 5 Sub-Tab Rapi: Menampilkan Total Poin Beredar & Rata-Rata Streak, Rincian Kesehatan Api (Aktif / Beku 1 / Beku 2 / Kritis 3), Penukaran Hari Ini & Stok Kartu, Top 5 Streak & Poin Terbanyak, serta 5 sub-tab manajemen.',
      'Mode Libur Nasional, Saklar Terpisah, Bonus Hari ke-14/30 & 4 Aksi Massal: Aktifkan Mode Libur Nasional agar streak tidak membeku otomatis, nyalakan/matikan Streak & Penukaran terpisah, atur bonus hari ke-14 & ke-30, serta jalankan Cairkan Semua Beku, Bonus Poin Massal, Bagikan Kartu Massal, atau Reset Misi Harian Semua Nasabah.',
      'Kelola Nasabah Berfilter Lengkap & Log Penukaran Global Live: Filter status api (Aktif, Beku 1–2, Kritis 3, Reset 0), filter khusus Tier Admin (∞), urutkan streak/poin, kontrol cepat per akun, dan pantau tabel log penukaran poin seluruh nasabah secara live.',
    ],
    changes: [
      'Menambahkan tab khusus loyalty_streak_admin ("Setting Streak & Loyalty") di sebelah tab Misi Harian & Leaderboard beserta badge peringatan nasabah beku kritis tahap 3.',
      'Memindahkan penuh AdminLoyaltyStreakPanel ke tab khusus dengan menyisakan tombol pintasan cepat di Super Tools > Kantong Impian.',
      'Mendaftarkan tab Setting Streak & Loyalty ke ADMIN_TAB_CATALOG sehingga hak aksesnya dapat didelegasikan lewat Pengangkatan Kartu Tier Admin.',
      'Menambahkan Mode Libur Nasional, saklar terpisah Streak & Penukaran Poin, bonus streak Hari ke-14 & ke-30, 4 aksi massal aman, filter kelola per nasabah, dan log penukaran poin live.',
    ],
    dateText: '27 Nov 2026',
    fullDate: 'Jumat, 27 November 2026 • Pukul 22:15 WIB',
    categoryBadge: 'Rilis Internal Admin Terbaru',
    isCurrent: false,
    author: 'Super Admin Utama (AzkaAKC)',
    createdAt: '2026-11-27T15:15:00.000Z',
    isAutoDetected: true,
  },
  {
    id: 'upd-admin-v1-2-0',
    version: 'vAdmin 1.2.0',
    releaseType: 'minor',
    visibilityMode: 'admin_only',
    title:
      'Panel Pengaturan Paket Kurs Poin Loyalty (150P=Rp100rb / 100P=10 Coin / 100P=1 Voucher), Paket Kustom CRUD, Reset Kurs Bawaan, Batas Harian, Editor Hadiah Pencapaian & Pratinjau Kartu Nasabah',
    description:
      'Pembaruan Panel Admin vAdmin 1.2.0 memberikan kendali menyeluruh atas seluruh ekonomi Poin Loyalty: Admin dapat mengatur biaya poin & hadiah 3 paket utama beserta saklar aktif/nonaktif masing-masing, menekan tombol cepat Reset Kurs Bawaan (150 Poin = Rp 100.000, 100 Poin = 10 Coin, 100 Poin = 1 Voucher), menambah/mengedit/menghapus Paket Penukaran Kustom (Saldo Tunai, Coin, Voucher — tanpa Diamond), mengaktifkan saklar Batas Maksimal Penukaran Harian, mengubah nominal hadiah Poin Pencapaian (Milestone) & Auto-Streak, serta memantau Pratinjau Langsung Kartu Tukar Nasabah sebelum menyimpan.',
    highlights: [
      'Editor 3 Paket Kurs Utama + Saklar Aktif & Tombol Reset Kurs Bawaan: Atur bebas biaya poin dan hasil hadiah Saldo Tunai, Coin, dan Voucher Naik Level, nyalakan/matikan tiap opsi, atau kembalikan instan ke standar 150P=Rp100.000, 100P=10 Coin, dan 100P=1 Voucher.',
      'Manajemen Paket Penukaran Kustom (CRUD Tanpa Diamond): Tambah, aktifkan/nonaktifkan, atau hapus paket tukar kustom tambahan khusus Saldo Tunai, Coin, atau Voucher Naik Level lengkap dengan label dan deskripsi.',
      'Saklar Batas Penukaran Harian & Editor Hadiah Pencapaian + Auto-Streak: Kendalikan apakah penukaran bebas tanpa batas atau dibatasi per nasabah per hari, serta ubah hadiah poin untuk setiap Pencapaian (Milestone), Auto-Streak harian, bonus 7 hari, dan 100 misi harian.',
      'Kotak Pratinjau Langsung Tampilan Nasabah: Melihat wujud kartu penukaran Poin Loyalty nasabah secara real-time saat Admin mengubah angka kurs atau paket kustom sebelum menekan Simpan Pengaturan.',
    ],
    changes: [
      'Memperbarui AdminLoyaltyStreakPanel dengan editor biaya poin & hadiah 3 paket utama plus saklar aktif/nonaktif dan tombol Reset Kurs Bawaan.',
      'Menambahkan fitur Tambah/Toggle/Hapus Paket Penukaran Kustom (Saldo Tunai, Coin, Voucher — tanpa Diamond) di Panel Admin.',
      'Menambahkan saklar Batas Maksimal Penukaran Harian per nasabah beserta input jumlah batas harian.',
      'Menambahkan Editor Hadiah Poin Pencapaian (Milestone) per kartu pencapaian dan Kotak Pratinjau Langsung Kartu Tukar Nasabah.',
    ],
    dateText: '27 Nov 2026',
    fullDate: 'Jumat, 27 November 2026 • Pukul 21:30 WIB',
    categoryBadge: 'Rilis Internal Admin Terbaru',
    isCurrent: false,
    author: 'Super Admin Utama (AzkaAKC)',
    createdAt: '2026-11-27T14:30:00.000Z',
    isAutoDetected: true,
  },
  {
    id: 'upd-admin-v1-1-0',
    version: 'vAdmin 1.1.0',
    releaseType: 'minor',
    visibilityMode: 'admin_only',
    title:
      'Kontrol Admin Syarat Minimal Leaderboard + Panel Manajemen 100 Misi Loyalty, Auto-Streak Beku & Kartu Pemulihan 25 Diamond',
    description:
      'Pembaruan eksklusif Panel Admin (vAdmin 1.1.0). Admin kini dapat mengatur syarat minimal masuk Leaderboard secara global maupun per kategori (6 kriteria, AND/OR, Preset, Whitelist, & Pratinjau Langsung) sekaligus mengelola penuh sistem 100 Misi Aktif Harian Loyalty, harga Diamond Kartu Pemulihan Streak, ambang hari beku tahap 1–3, kurs penukaran (Saldo Tunai, Coin, Voucher — tanpa Diamond), editor individual 100 misi, serta kontrol manual pulihkan/bekukan/atur streak nasabah.',
    highlights: [
      'Syarat Minimal Leaderboard (Global & Per Kategori): Saklar ganda, 6 kriteria syarat minimal, mode Wajib Semua (AND) / Salah Satu (OR), Preset Terbuka / Standar / Sultan, Whitelist pengecualian akun, serta pratinjau langsung nasabah lolos vs gugur sebelum simpan.',
      'Kendali Penuh Auto-Streak Beku & Kartu Pemulihan: Atur harga Diamond Kartu Pemulihan (default 25 Diamond), batas hari beku Tahap 1, Tahap 2, Wajib Pulihkan Tahap 3, hingga batas hangus reset 0.',
      'Editor 100 Misi Harian Loyalty & Kurs Tukar (Tanpa Diamond): Atur jumlah misi aktif harian (1–100), pengali hadiah poin, aktif/nonaktif serta edit target & poin tiap misi secara individual, plus kurs tukar Saldo Tunai, Coin, dan Voucher Naik Level.',
      'Kontrol Manual Streak & Kartu Pemulihan Nasabah: Admin dapat mencairkan & memulihkan streak nasabah, menguji status Beku Tahap 1/2/3, menetapkan angka hari streak, serta menambah/menyetel stok Kartu Pemulihan nasabah secara instan.',
    ],
    changes: [
      'Menambahkan kontrol Syarat Minimal Masuk Leaderboard di Tab Leaderboard Panel Admin (saklar global, saklar & angka minimal tiap kategori, 6 kriteria, mode Wajib Semua/Salah Satu, Preset Cepat, Whitelist, dan Pratinjau Langsung).',
      'Menambahkan panel AdminLoyaltyStreakPanel di Panel Admin untuk mengatur harga Kartu Pemulihan (Diamond), batas hari beku 1–3, jumlah misi aktif (1–100), pengali hadiah, editor 100 misi individual, dan kurs tukar Saldo Tunai / Coin / Voucher.',
      'Menambahkan kontrol manual Streak nasabah (Pulihkan & Cairkan, Set Beku 1/2/3, Set Angka Streak, Tambah/Set Kartu Pemulihan).',
      'Menyinkronkan pencabutan otomatis Badge Top 1–100 pada Kartu ATM & Profil bagi akun yang belum memenuhi syarat minimal Leaderboard.',
    ],
    dateText: '27 Nov 2026',
    fullDate: 'Jumat, 27 November 2026 • Pukul 19:00 WIB',
    categoryBadge: 'Rilis Internal Admin Terbaru',
    isCurrent: false,
    author: 'Super Admin Utama (AzkaAKC)',
    createdAt: '2026-11-27T12:00:00.000Z',
    isAutoDetected: true,
  },
  {
    id: 'upd-admin-v1-0-0',
    version: 'vAdmin 1.0.0',
    releaseType: 'major',
    visibilityMode: 'admin_only',
    title:
      'Peluncuran Panel Pengangkatan Kartu Tier Admin, Analitik Pengunjung Real-Time, Infinity Level/Voucher/Poin & Riwayat Update Admin',
    description:
      'Pembaruan eksklusif internal Admin tanpa mengubah nomor versi publik (tetap v16.42.50). Mencakup sistem pengangkatan kartu menjadi Tier Admin dengan kontrol izin per-tab granular, pelacakan pengunjung real-time 3 koleksi lengkap dengan Multi-Server GeoIP & GPS Presisi, status Infinity (∞) penuh untuk Level, Voucher, dan Poin bagi seluruh pemegang Kartu Tier Admin, serta halaman khusus Riwayat Update Admin di Navbar.',
    highlights: [
      'Tab Pengangkatan Kartu Tier Admin: Tampilan Kartu Visual ATM & Tabel Cepat, pilih izin 1 tab / beberapa tab / Semua Tab, mode Akses Penuh atau Hanya Lihat, 5 preset cepat, kontrak berbatas waktu, bekukan sementara, Mode Penyamaran, dan kunci mutlak Super Admin Utama AzkaAKC (No. Rek 1234567890).',
      'Tab Analitik & Trafik Pengunjung Real-Time: Pencatatan instan bebas race-condition untuk Global Hits, Kunjungan Per Akun, dan Per Perangkat & Lokasi, status live ONLINE instan (heartbeat 20 detik / offline 45 detik), Multi-Server GeoIP + opsi GPS Presisi browser, deteksi Multi-Akun >3 mencurigakan, serta persistensi 3 lapis (WebSocket + Cloud Firestore + Local Backup).',
      'Kartu Tier Admin Infinity (∞) Menyeluruh: Seluruh Level (Karier, Profil, Reputasi Chat), semua stok Voucher Naik Level & internal, Poin Rewards, serta Poin Loyalty otomatis bernilai ∞, tidak pernah berkurang saat dipakai/ditukar, otomatis membuka seluruh syarat lowongan kerja, tampil pada blok khusus Leaderboard, mendukung Mode Penyamaran bagi publik, dan memulihkan snapshot nilai asli saat turun tier.',
      'Tab Navbar Riwayat Update Admin: Tampil khusus di samping Riwayat Update bagi pemegang Kartu Tier Admin & Super Admin Utama AzkaAKC (tersembunyi otomatis saat Mode Penyamaran), menampilkan seluruh update Admin & campuran tanpa filter, indikator titik merah BARU, penomoran versi terpisah vAdmin, dan tombol cepat Tambah Update Admin.',
    ],
    changes: [
      'Tab Pengangkatan Kartu Tier Admin dengan kontrol izin per-tab granular dan kunci Super Admin Utama AzkaAKC (1234567890).',
      'Perbaikan total Tab Analitik & Trafik Pengunjung Real-Time: kunjungan instan, status ONLINE real-time, Multi-Server GeoIP + GPS Presisi, dan persistensi 3 lapis.',
      'Infinity (∞) penuh untuk semua jenis Level, Voucher, Poin Rewards, dan Poin Loyalty bagi seluruh Kartu Tier Admin beserta snapshot rollback saat turun tier.',
      'Tab Navbar Riwayat Update Admin tanpa filter dengan penomoran versi vAdmin terpisah dan tombol Tambah Update Admin cepat.',
    ],
    dateText: '27 Nov 2026',
    fullDate: 'Jumat, 27 November 2026 • Pukul 17:20 WIB',
    categoryBadge: 'Rilis Internal Admin Terbaru',
    isCurrent: false,
    author: 'Super Admin Utama (AzkaAKC)',
    createdAt: '2026-11-27T10:20:00.000Z',
    isAutoDetected: true,
  },
];

export interface AdminUpdateViewItem {
  record: AppUpdateRecord;
  kind: 'admin_only' | 'mixed';
  hiddenPublicPointsCount: number;
}

export function isAdminStreamVersion(versionStr?: string): boolean {
  return /^\s*v?admin\b/i.test(String(versionStr || ''));
}

function parseAdminStreamVersion(versionStr?: string): { major: number; minor: number; patch: number } | null {
  const m = String(versionStr || '')
    .trim()
    .match(/^v?admin\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?$/i);
  if (!m) return null;
  return {
    major: Number.parseInt(m[1], 10) || 1,
    minor: Number.parseInt(m[2] ?? '0', 10) || 0,
    patch: Number.parseInt(m[3] ?? '0', 10) || 0,
  };
}

/**
 * Menyarankan nomor versi Admin berikutnya (mis. vAdmin 1.1.0) tanpa menyentuh versi publik.
 */
export function getNextAdminVersion(records: AppUpdateRecord[]): string {
  const all = [...BUILT_IN_ADMIN_UPDATES_CATALOG, ...records];
  let best = { major: 1, minor: 0, patch: 0 };
  let found = false;
  for (const rec of all) {
    const parsed = parseAdminStreamVersion(rec?.version);
    if (!parsed) continue;
    found = true;
    if (
      parsed.major > best.major ||
      (parsed.major === best.major && parsed.minor > best.minor) ||
      (parsed.major === best.major && parsed.minor === best.minor && parsed.patch > best.patch)
    ) {
      best = parsed;
    }
  }
  if (!found) return 'vAdmin 1.0.0';
  return `vAdmin ${best.major}.${best.minor + 1}.0`;
}

/**
 * Mengembalikan seluruh catatan update khusus Admin dan update campuran TANPA penyaringan
 * (judul, deskripsi, dan daftar perubahan tampil utuh apa adanya), digabungkan dengan
 * katalog rilis Admin bawaan.
 */
export function getAdminAppUpdates(records: AppUpdateRecord[]): AdminUpdateViewItem[] {
  const byId = new Map<string, AppUpdateRecord>();
  for (const seed of BUILT_IN_ADMIN_UPDATES_CATALOG) {
    byId.set(seed.id, seed);
  }
  for (const rec of records || []) {
    if (!rec || !rec.id) continue;
    byId.set(rec.id, rec);
  }

  const results: AdminUpdateViewItem[] = [];
  for (const rec of byId.values()) {
    const res = resolvePublicAppUpdate(rec);
    const isAdminOnly =
      rec.visibilityMode === 'admin_only' ||
      isAdminStreamVersion(rec.version) ||
      res.effectiveStatus === 'admin_hidden';
    const isMixed = !isAdminOnly && res.hasAdminContent;

    if (isAdminOnly || isMixed) {
      results.push({
        record: rec,
        kind: isAdminOnly ? 'admin_only' : 'mixed',
        hiddenPublicPointsCount: res.hiddenPointsCount,
      });
    }
  }

  results.sort((a, b) => {
    const aAdminVer = parseAdminStreamVersion(a.record.version);
    const bAdminVer = parseAdminStreamVersion(b.record.version);
    if (aAdminVer && !bAdminVer) return -1;
    if (!aAdminVer && bAdminVer) return 1;
    if (aAdminVer && bAdminVer) {
      if (bAdminVer.major !== aAdminVer.major) return bAdminVer.major - aAdminVer.major;
      if (bAdminVer.minor !== aAdminVer.minor) return bAdminVer.minor - aAdminVer.minor;
      if (bAdminVer.patch !== aAdminVer.patch) return bAdminVer.patch - aAdminVer.patch;
    }
    const ta = Date.parse(a.record.createdAt || '') || 0;
    const tb = Date.parse(b.record.createdAt || '') || 0;
    if (tb !== ta) return tb - ta;
    return compareRecordsNewestFirst(a.record, b.record);
  });

  return results;
}

// =====================================================================================
// PENGURUTAN & AUTO-MERGE KATALOG RILIS + DETEKSI BUILD BARU
// =====================================================================================

function parseLegacyPair(versionStr: string): { major: number; minor: number } {
  const match = String(versionStr || '').match(/v?(\d+)(?:\.(\d+))?/i);
  if (!match) return { major: 0, minor: 0 };
  const major = Number.parseInt(match[1], 10);
  const minor = match[2] !== undefined ? Number.parseInt(match[2], 10) : 0;
  return {
    major: Number.isFinite(major) ? major : 0,
    minor: Number.isFinite(minor) ? minor : 0,
  };
}

function getRecordSortTime(rec: AppUpdateRecord): number {
  const parsed = Date.parse(rec.createdAt || '');
  if (Number.isFinite(parsed)) return parsed;
  const structured = parseStructuredVersion(rec.version);
  if (structured) {
    return 2_000_000_000_000 + structured.p * 10_000 + structured.w * 100 + structured.g;
  }
  const legacy = parseLegacyPair(rec.version);
  return legacy.major * 1_000_000 + legacy.minor * 1_000;
}

function compareRecordsNewestFirst(a: AppUpdateRecord, b: AppUpdateRecord): number {
  const aStructured = parseStructuredVersion(a.version);
  const bStructured = parseStructuredVersion(b.version);

  // Era Baru (vppp.ww.gg) selalu tampil di atas Arsip Lama (v1.0–v19.0)
  if (aStructured && !bStructured) return -1;
  if (!aStructured && bStructured) return 1;

  if (aStructured && bStructured) {
    const verCmp = compareStructuredVersions(bStructured, aStructured);
    if (verCmp !== 0) return verCmp;
  }

  const timeDiff = getRecordSortTime(b) - getRecordSortTime(a);
  if (Math.abs(timeDiff) > 1000) return timeDiff;

  const la = parseLegacyPair(a.version);
  const lb = parseLegacyPair(b.version);
  if (lb.major !== la.major) return lb.major - la.major;
  return lb.minor - la.minor;
}

export interface AutoMergeUpdatesResult {
  mergedUpdates: AppUpdateRecord[];
  didChange: boolean;
  newlyAddedIds: string[];
  cleanedAutoNoiseCount?: number;
}

/**
 * Mendeteksi catatan auto-DD berlebih yang dibuat otomatis saat muat ulang build di versi lama
 * (hanya menyaring entri otomatis yang belum pernah diedit oleh Admin).
 */
export function isExcessAutoDdNoiseRecord(rec?: AppUpdateRecord | null): boolean {
  if (!rec || !rec.id) return false;
  if (rec.editedByAdmin) return false;
  const idLower = String(rec.id).toLowerCase();
  const titleLower = String(rec.title || '').toLowerCase();
  return (
    idLower.startsWith('upd-auto-') ||
    (rec.isAutoDetected === true &&
      titleLower.startsWith('pembaruan stabilitas & optimalisasi'))
  );
}

/**
 * Membersihkan entri auto-DD berlebih tanpa menyentuh rilis resmi katalog maupun suntingan Admin.
 */
export function cleanupExcessAutoDdUpdates(records: AppUpdateRecord[]): {
  cleaned: AppUpdateRecord[];
  removedCount: number;
} {
  const safeList = Array.isArray(records)
    ? records.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];
  const kept = safeList.filter((rec) => !isExcessAutoDdNoiseRecord(rec));
  return {
    cleaned: kept,
    removedCount: Math.max(0, safeList.length - kept.length),
  };
}

export function mergeAutoDetectedAppUpdates(
  existingUpdates: AppUpdateRecord[],
  builtInCatalog: AppUpdateRecord[]
): AutoMergeUpdatesResult {
  const buildInfo = getActiveAppBuildInfo();
  const rawExisting = Array.isArray(existingUpdates)
    ? existingUpdates.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];
  const { cleaned: safeExisting, removedCount: cleanedAutoNoiseCount } =
    cleanupExcessAutoDdUpdates(rawExisting);
  const safeCatalog = Array.isArray(builtInCatalog)
    ? builtInCatalog.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];

  const byId = new Map<string, AppUpdateRecord>();
  const existingVersions = new Set<string>();

  for (const item of safeExisting) {
    byId.set(item.id, { ...item });
    if (item.version) existingVersions.add(item.version.trim().toLowerCase());
  }

  let didChange = cleanedAutoNoiseCount > 0;
  const newlyAddedIds: string[] = [];
  const newestCatalogId = safeCatalog[0]?.id;

  // 1. Gabungkan katalog rilis resmi terbaru (mis. v12.32.97 Major) tanpa pernah menimpa suntingan Admin
  for (const catItem of safeCatalog) {
    const prev = byId.get(catItem.id);
    const isNewestCatalog = catItem.id === newestCatalogId;
    const versionAlreadyPresent =
      Boolean(catItem.version) && existingVersions.has(catItem.version.trim().toLowerCase());

    if (!prev && !versionAlreadyPresent) {
      const enriched: AppUpdateRecord = {
        ...catItem,
        ...(isNewestCatalog && !catItem.buildId ? { buildId: buildInfo.buildId } : {}),
        isAutoDetected: catItem.isAutoDetected ?? true,
      };
      byId.set(enriched.id, enriched);
      existingVersions.add(enriched.version.trim().toLowerCase());
      newlyAddedIds.push(enriched.id);
      didChange = true;
    } else if (prev && !prev.editedByAdmin && isNewestCatalog && !prev.buildId) {
      byId.set(prev.id, {
        ...prev,
        buildId: buildInfo.buildId,
      });
      didChange = true;
    }
  }

  // 2. TIDAK lagi membuat entri auto-DD generik setiap kali buildId berubah.
  // Versi hanya naik ketika benar-benar ada rilis fitur/perbaikan baru di katalog resmi atau diterbitkan Admin.

  // 3. Urutkan kronologis (Era Baru vAAA.SS.DD di atas Arsip Lama) dan pastikan tepat satu entri aktif sebagai Update Sekarang
  const mergedList = Array.from(byId.values()).sort(compareRecordsNewestFirst);

  if (mergedList.length > 0) {
    const publicEligibleList = mergedList.filter(
      (u) => u.visibilityMode !== 'admin_only' && !isAdminStreamVersion(u.version)
    );
    const currentPool = publicEligibleList.length > 0 ? publicEligibleList : mergedList;

    let targetCurrentId: string;
    const hasExistingStructuredCurrent = currentPool.some(
      (u) => u.isCurrent && isStructuredThreePartVersion(u.version)
    );

    const newlyAddedPublic = newlyAddedIds.filter((id) =>
      currentPool.some((u) => u.id === id)
    );

    if (newlyAddedPublic.length > 0) {
      const newestAdded =
        currentPool.find((u) => newlyAddedPublic.includes(u.id)) || currentPool[0];
      targetCurrentId = newestAdded.id;
    } else if (!hasExistingStructuredCurrent && isStructuredThreePartVersion(currentPool[0].version)) {
      targetCurrentId = currentPool[0].id;
    } else {
      const existingCurrent = currentPool.find((u) => u.isCurrent);
      targetCurrentId = existingCurrent ? existingCurrent.id : currentPool[0].id;
    }

    const normalizedList = mergedList.map((u) => {
      const isAdminOnlyRec = u.visibilityMode === 'admin_only' || isAdminStreamVersion(u.version);
      const shouldBeCurrent = !isAdminOnlyRec && u.id === targetCurrentId;
      let nextBadge = u.categoryBadge;
      if (isAdminOnlyRec) {
        if (!nextBadge) nextBadge = 'Khusus Admin';
      } else if (shouldBeCurrent) {
        if (!nextBadge || nextBadge === 'Update Sebelumnya') {
          nextBadge = 'Update Sekarang';
        }
      } else if (nextBadge && nextBadge.toUpperCase().includes('UPDATE SEKARANG')) {
        nextBadge = 'Update Sebelumnya';
      }
      if (u.isCurrent !== shouldBeCurrent || u.categoryBadge !== nextBadge) {
        didChange = true;
      }
      return {
        ...u,
        isCurrent: shouldBeCurrent,
        categoryBadge: nextBadge,
      };
    });

    normalizedList.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return 0;
    });

    return {
      mergedUpdates: normalizedList,
      didChange,
      newlyAddedIds,
      cleanedAutoNoiseCount,
    };
  }

  return {
    mergedUpdates: mergedList,
    didChange,
    newlyAddedIds,
    cleanedAutoNoiseCount,
  };
}
