/**
 * Bank Nusantara — Mesin Penomoran Versi Terstruktur (vppp.ww.gg),
 * Deteksi Rilis & Build Otomatis, serta Filter Visibilitas Khusus Admin
 * ------------------------------------------------------------------------------------
 * Aturan Resmi Penomoran Versi:
 * - Format 3-segmen: vppp.ww.gg (p = Update Besar, w = Update Bug, g = Update Bug Kecil)
 * - Prefiks 'v', p ditulis alami (1–3 digit, mis. 11), w & g selalu 2 digit (leading zero, mis. 02.05)
 * - Rilis awal era baru: v11.32.97
 * - Tanpa reset segmen saat p atau w naik (+1 terus melanjutkan angka di belakangnya)
 * - Rollover otomatis 99 -> 00:
 *     * g > 99 -> g = 00, w + 1
 *     * w > 99 -> w = 00, p + 1
 * - Auto-build / publish baru tanpa input manual: selalu naik +1 pada g (Update Bug Kecil)
 * - Arsip lama (v1.0–v19.0) tetap dipertahankan utuh di Update Sebelumnya
 * - Deteksi otomatis konten khusus Admin + sakelar manual Panel Admin (auto / public / admin_only)
 */
import {
  AppUpdateRecord,
  AppUpdateReleaseType,
  AppUpdateVisibilityMode,
} from '../types/bank';

export const STRUCTURED_BASE_VERSION = 'v11.32.97';

export interface StructuredVersion {
  p: number; // Update Besar (penambahan/penghapusan fitur)
  w: number; // Update Bug
  g: number; // Update Bug Kecil
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
      : 'BLD-20261120-1230';
  const buildIso =
    typeof __APP_BUILD_ISO__ !== 'undefined' && __APP_BUILD_ISO__
      ? __APP_BUILD_ISO__
      : new Date().toISOString();
  const buildDateWib =
    typeof __APP_BUILD_DATE_WIB__ !== 'undefined' && __APP_BUILD_DATE_WIB__
      ? __APP_BUILD_DATE_WIB__
      : 'Jumat, 20 November 2026 • Pukul 12:30 WIB';
  const catalogVersion =
    typeof __APP_CATALOG_RELEASE_VERSION__ !== 'undefined' && __APP_CATALOG_RELEASE_VERSION__
      ? __APP_CATALOG_RELEASE_VERSION__
      : STRUCTURED_BASE_VERSION;

  return { buildId, buildIso, buildDateWib, catalogVersion };
}

/**
 * Mengecek apakah string versi mengikuti format 3-segmen baru (vppp.ww.gg atau ppp.ww.gg)
 */
export function isStructuredThreePartVersion(versionStr?: string): boolean {
  if (!versionStr) return false;
  return /^\s*v?(\d{1,3})\.(\d{1,2})\.(\d{1,2})\s*$/i.test(versionStr);
}

/**
 * Mem-parsing versi 3-segmen vppp.ww.gg menjadi angka { p, w, g }
 */
export function parseStructuredVersion(versionStr?: string): StructuredVersion | null {
  if (!versionStr) return null;
  const match = String(versionStr)
    .trim()
    .match(/^v?(\d{1,3})\.(\d{1,2})\.(\d{1,2})$/i);
  if (!match) return null;
  const p = Number.parseInt(match[1], 10);
  const w = Number.parseInt(match[2], 10);
  const g = Number.parseInt(match[3], 10);
  if (!Number.isFinite(p) || !Number.isFinite(w) || !Number.isFinite(g)) return null;
  if (p < 0 || p > 999 || w < 0 || w > 99 || g < 0 || g > 99) return null;
  return { p, w, g };
}

/**
 * Memformat { p, w, g } ke bentuk resmi vppp.ww.gg (p alami, w & g 2 digit dengan leading zero)
 */
export function formatStructuredVersion(v: StructuredVersion): string {
  const safeP = Math.max(0, Math.min(999, Math.floor(v.p)));
  const safeW = Math.max(0, Math.min(99, Math.floor(v.w)));
  const safeG = Math.max(0, Math.min(99, Math.floor(v.g)));
  return `v${safeP}.${String(safeW).padStart(2, '0')}.${String(safeG).padStart(2, '0')}`;
}

/**
 * Menormalkan input versi Admin: jika 3 segmen angka, selalu dibakukan menjadi v{p}.{ww}.{gg}
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
 * Menaikkan versi 3-segmen sesuai tipe rilis:
 * - Tanpa reset segmen di belakangnya
 * - Rollover otomatis 99 -> 00 ke segmen kiri (+1)
 */
export function bumpStructuredVersion(
  baseVersionStr: string | undefined,
  releaseType: AppUpdateReleaseType
): string {
  const base = parseStructuredVersion(baseVersionStr) || { p: 11, w: 32, g: 97 };
  let { p, w, g } = base;

  if (releaseType === 'major') {
    p = Math.min(999, p + 1);
  } else if (releaseType === 'bug') {
    w += 1;
    if (w > 99) {
      w = 0;
      p = Math.min(999, p + 1);
    }
  } else {
    // small_bug (+g)
    g += 1;
    if (g > 99) {
      g = 0;
      w += 1;
      if (w > 99) {
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
    const parsed = parseStructuredVersion(rec?.version);
    if (!parsed) continue;
    if (!best || compareStructuredVersions(parsed, best) > 0) {
      best = parsed;
    }
  }
  return best ? formatStructuredVersion(best) : STRUCTURED_BASE_VERSION;
}

/**
 * Validasi lunak kenaikan versi di Panel Admin:
 * - Memberi peringatan jika format bukan vppp.ww.gg, versi sama/mundur, atau lompat lebih dari +1
 * - Tetap mengizinkan Admin menyimpan apabila dikehendaki
 */
export function validateVersionJump(
  currentVersionStr: string,
  candidateVersionStr: string
): VersionJumpValidationResult {
  const normalized = normalizeVersionInput(candidateVersionStr);
  const currentParsed = parseStructuredVersion(currentVersionStr) || { p: 11, w: 32, g: 97 };
  const currentFormatted = formatStructuredVersion(currentParsed);

  const candidateParsed = parseStructuredVersion(candidateVersionStr);
  if (!candidateParsed) {
    return {
      isValidFormat: false,
      hasWarning: true,
      normalizedVersion: normalized,
      matchedReleaseType: null,
      warningMessage:
        'Format versi disarankan mengikuti pola vppp.ww.gg dengan angka 00–99 untuk w & g (contoh: v11.32.98). Anda tetap bisa menyimpan jika memang disengaja.',
    };
  }

  const nextMajor = bumpStructuredVersion(currentFormatted, 'major');
  const nextBug = bumpStructuredVersion(currentFormatted, 'bug');
  const nextSmallBug = bumpStructuredVersion(currentFormatted, 'small_bug');

  if (normalized === nextMajor) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'major',
      warningMessage: null,
    };
  }
  if (normalized === nextBug) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'bug',
      warningMessage: null,
    };
  }
  if (normalized === nextSmallBug) {
    return {
      isValidFormat: true,
      hasWarning: false,
      normalizedVersion: normalized,
      matchedReleaseType: 'small_bug',
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
      warningMessage: `Nomor versi ${normalized} sama dengan versi aktif ${currentFormatted}. Pilih salah satu tombol +p, +w, atau +g untuk kenaikan bertahap (+1).`,
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
  if (dp > 1) jumpParts.push(`Update Besar p melompat +${dp}`);
  if (dw > 1) jumpParts.push(`Update Bug w melompat +${dw}`);
  if (dg > 1) jumpParts.push(`Bug Kecil g melompat +${dg}`);

  const detail =
    jumpParts.length > 0
      ? jumpParts.join(', ')
      : `perubahan dari ${currentFormatted} ke ${normalized} melebihi satu langkah (+1)`;

  return {
    isValidFormat: true,
    hasWarning: true,
    normalizedVersion: normalized,
    matchedReleaseType: null,
    warningMessage: `Peringatan Anti-Lompat Jauh: ${detail}. Saran bertahap: ${nextSmallBug} (+g), ${nextBug} (+w), atau ${nextMajor} (+p). Admin tetap dapat menyimpan jika diperlukan.`,
  };
}

// =====================================================================================
// MESIN DETEKSI & PENYARINGAN UPDATE KHUSUS ADMIN (AUTO + SAKELAR MANUAL)
// =====================================================================================

const ADMIN_KEYWORD_PATTERNS: RegExp[] = [
  /\bpanel\s+admin\b/i,
  /\bportal\s+admin\b/i,
  /\btab\s+admin\b/i,
  /\badmin\s+portal\b/i,
  /\badmin\s+utama\b/i,
  /\bsuper\s*tool/i,
  /\bpin\s+admin\b/i,
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
  /\brole\s+dev\b/i,
  /\bdev\s+role\b/i,
  /\b\(pa\)\b/i,
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
];

export function isAdminRelatedLine(text?: string): boolean {
  if (!text) return false;
  return ADMIN_KEYWORD_PATTERNS.some((re) => re.test(text));
}

function hasCustomerFeatureSignal(text?: string): boolean {
  if (!text) return false;
  return CUSTOMER_FEATURE_SIGNAL_PATTERNS.some((re) => re.test(text));
}

/**
 * Membersihkan frasa atau klausa yang secara eksplisit menyebut Panel Admin dari judul campuran
 * tanpa memotong dengan '...' atau merusak kalimat fitur nasabah.
 */
function sanitizeTitleForPublic(title: string): string {
  let clean = title.trim();
  // Hapus klausa belakang seperti "& Pusat Kelola ... Panel Admin" atau "+ Kontrol Panel Admin"
  clean = clean
    .replace(/\s*(?:&|\+|dan|serta)\s+[^—–-]*\b(?:panel\s+admin|portal\s+admin|khusus\s+admin|super\s*tool\s+admin)[^—–-]*/gi, '')
    .replace(/\s*,\s*[^,—–-]*\b(?:panel\s+admin|portal\s+admin|khusus\s+admin)\b[^,—–-]*/gi, '')
    .replace(/\s+di\s+panel\s+admin\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/[\s,&+-]+$/, '')
    .trim();

  return clean || title.trim();
}

/**
 * Menyaring kalimat atau klausa bernomor khusus Panel Admin di dalam deskripsi campuran
 * agar teks publik tetap mengalir utuh dan natural tanpa pemotongan (...).
 */
function sanitizeDescriptionForPublic(description: string): string {
  const raw = String(description || '').trim();
  if (!raw) return '';
  if (!isAdminRelatedLine(raw)) return raw;

  // 1. Jika mengandung pemisah klausa titik-koma (seperti poin bernomor "(1) ...; (2) ...; serta (5) Tab Kelola ... di Panel Admin.")
  if (raw.includes(';')) {
    const segments = raw.split(';').map((s) => s.trim()).filter(Boolean);
    const keptSegments = segments.filter((seg) => !isAdminRelatedLine(seg));
    if (keptSegments.length > 0 && keptSegments.length < segments.length) {
      let joined = keptSegments.join('; ').replace(/;\s*$/, '');
      if (!/[.!?]$/.test(joined)) joined += '.';
      return joined;
    }
  }

  // 2. Saring kalimat-kalimat yang khusus membahas Panel Admin
  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const keptSentences = sentences.filter((s) => !isAdminRelatedLine(s));
  if (keptSentences.length > 0) {
    return keptSentences.join(' ');
  }

  // 3. Jika hanya satu kalimat panjang namun tetap punya fitur nasabah, hapus anak kalimat "di Panel Admin..."
  const stripped = raw
    .replace(/,?\s*(?:serta|dan)\s+[^.]*\b(?:panel\s+admin|portal\s+admin|admin\s+dapat|khusus\s+admin)[^.]*/gi, '')
    .replace(/\s*\([^)]*\badmin\b[^)]*\)/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  return stripped || raw;
}

/**
 * Mengevaluasi visibilitas publik satu catatan update:
 * - visibilityMode === 'admin_only' -> sembunyikan penuh
 * - visibilityMode === 'public' -> tampilkan penuh tanpa penyaringan
 * - visibilityMode === 'auto' (atau undefined) -> saring poin Admin otomatis & sembunyikan penuh jika seluruh catatan murni tentang Admin
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
  const hasAdminContent = adminPoints.length > 0 || titleHasAdmin || descHasAdmin;

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

  // Mode 'auto': deteksi jika keseluruhan catatan murni tentang Admin
  const allPointsAreAdmin = rawPoints.length > 0 && publicPoints.length === 0;
  const purelyAdminWithoutPoints =
    rawPoints.length === 0 &&
    (titleHasAdmin || descHasAdmin) &&
    !hasCustomerFeatureSignal(`${rec.title} ${rec.description}`.replace(/\bpanel\s+admin\b/gi, ''));

  const titleOnlyAdmin =
    titleHasAdmin &&
    !hasCustomerFeatureSignal(sanitizeTitleForPublic(rec.title)) &&
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

  const filteredRecord: AppUpdateRecord = {
    ...rec,
    title: sanitizedTitle,
    description: sanitizedDesc,
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
}

export function mergeAutoDetectedAppUpdates(
  existingUpdates: AppUpdateRecord[],
  builtInCatalog: AppUpdateRecord[]
): AutoMergeUpdatesResult {
  const buildInfo = getActiveAppBuildInfo();
  const safeExisting = Array.isArray(existingUpdates)
    ? existingUpdates.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];
  const safeCatalog = Array.isArray(builtInCatalog)
    ? builtInCatalog.filter((u): u is AppUpdateRecord => Boolean(u && u.id))
    : [];

  const byId = new Map<string, AppUpdateRecord>();
  const existingVersions = new Set<string>();
  const existingBuildIds = new Set<string>();

  for (const item of safeExisting) {
    byId.set(item.id, { ...item });
    if (item.version) existingVersions.add(item.version.trim().toLowerCase());
    if (item.buildId) existingBuildIds.add(item.buildId.trim().toUpperCase());
  }

  let didChange = false;
  const newlyAddedIds: string[] = [];
  const newestCatalogId = safeCatalog[0]?.id;

  // 1. Gabungkan katalog rilis bawaan baru (termasuk v11.32.97) tanpa pernah menghapus / menimpa suntingan Admin
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
      if (enriched.buildId) existingBuildIds.add(enriched.buildId.trim().toUpperCase());
      newlyAddedIds.push(enriched.id);
      didChange = true;
    } else if (prev && !prev.editedByAdmin && isNewestCatalog && !prev.buildId) {
      byId.set(prev.id, {
        ...prev,
        buildId: buildInfo.buildId,
      });
      existingBuildIds.add(buildInfo.buildId.trim().toUpperCase());
      didChange = true;
    }
  }

  // 2. Deteksi build/publish baru di masa depan -> naikkan +1 pada segmen g (Update Bug Kecil) dari versi 3-segmen terakhir
  const normalizedActiveBuildId = buildInfo.buildId.trim().toUpperCase();
  const autoBuildRecordId = `upd-auto-${normalizedActiveBuildId.toLowerCase()}`;
  const buildAlreadyTracked =
    existingBuildIds.has(normalizedActiveBuildId) || byId.has(autoBuildRecordId);

  if (!buildAlreadyTracked && safeExisting.length > 0) {
    const currentPool = Array.from(byId.values());
    const latestStructured = getLatestStructuredVersion(currentPool);
    const nextVersion = bumpStructuredVersion(latestStructured, 'small_bug');
    const autoRecord: AppUpdateRecord = {
      id: autoBuildRecordId,
      version: nextVersion,
      releaseType: 'small_bug',
      visibilityMode: 'auto',
      title: `Pembaruan Stabilitas & Optimalisasi ${nextVersion}`,
      fullDate: buildInfo.buildDateWib,
      dateText: buildInfo.buildDateWib,
      description: `Aplikasi Bank Nusantara Digital baru saja diperbarui secara otomatis ke versi ${nextVersion} pada ${buildInfo.buildDateWib}. Seluruh penyempurnaan performa, keandalan sinkronisasi Cloud, serta perbaikan stabilitas ringan telah aktif secara instan di seluruh perangkat nasabah tanpa perlu login ulang.`,
      highlights: [
        `Peningkatan stabilitas dan optimalisasi performa versi ${nextVersion} telah aktif secara otomatis.`,
        'Sesi login permanen tetap terjaga sehingga nasabah langsung masuk ke Dashboard tanpa kembali ke halaman login.',
        'Sinkronisasi otomatis Cloud menjaga konsistensi data transaksi, hadiah, dan pengaturan lintas perangkat.',
      ],
      changes: [
        `Peningkatan stabilitas dan optimalisasi performa versi ${nextVersion} telah aktif secara otomatis.`,
        'Sesi login permanen tetap terjaga sehingga nasabah langsung masuk ke Dashboard tanpa kembali ke halaman login.',
        'Sinkronisasi otomatis Cloud menjaga konsistensi data transaksi, hadiah, dan pengaturan lintas perangkat.',
      ],
      isCurrent: true,
      categoryBadge: `Update Sekarang`,
      author: 'Tim Pengembangan Bank Nusantara',
      createdAt: buildInfo.buildIso,
      buildId: buildInfo.buildId,
      isAutoDetected: true,
      editedByAdmin: false,
    };
    byId.set(autoRecord.id, autoRecord);
    newlyAddedIds.push(autoRecord.id);
    didChange = true;
  }

  // 3. Urutkan kronologis (Era Baru vppp.ww.gg di atas Arsip Lama) dan pastikan tepat satu entri aktif sebagai Update Sekarang
  const mergedList = Array.from(byId.values()).sort(compareRecordsNewestFirst);

  if (mergedList.length > 0) {
    let targetCurrentId: string;
    const hasExistingStructuredCurrent = mergedList.some(
      (u) => u.isCurrent && isStructuredThreePartVersion(u.version)
    );

    if (newlyAddedIds.length > 0) {
      const newestAdded =
        mergedList.find((u) => newlyAddedIds.includes(u.id)) || mergedList[0];
      targetCurrentId = newestAdded.id;
    } else if (!hasExistingStructuredCurrent && isStructuredThreePartVersion(mergedList[0].version)) {
      // Saat migrasi dari versi lama (mis. v19.0) ke format baru (v11.32.97), promosikan versi 3-segmen terbaru sebagai aktif
      targetCurrentId = mergedList[0].id;
    } else {
      const existingCurrent = mergedList.find((u) => u.isCurrent);
      targetCurrentId = existingCurrent ? existingCurrent.id : mergedList[0].id;
    }

    const normalizedList = mergedList.map((u) => {
      const shouldBeCurrent = u.id === targetCurrentId;
      let nextBadge = u.categoryBadge;
      if (shouldBeCurrent) {
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
    };
  }

  return {
    mergedUpdates: mergedList,
    didChange,
    newlyAddedIds,
  };
}
