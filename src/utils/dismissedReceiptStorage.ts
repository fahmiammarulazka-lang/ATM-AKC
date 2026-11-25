/**
 * Penyimpanan Permanen Tanda Terima Baca (Pop-up Unban, Pesan Admin, & Peringatan Admin)
 * Terisolasi per-akun (accountId) dengan penggabungan monotonik anti-rollback agar:
 * - Setelah nasabah klik OK / Tutup, tidak pernah muncul lagi meski keluar-masuk akun atau refresh
 * - Tersinkronisasi lintas perangkat melalui profil BankAccount di Cloud Firestore
 * - Pindah akun (Akun A -> Akun B) di HP yang sama tetap menjaga status baca terpisah per akun
 * - Mendukung tombol Kirim Ulang (resendVersion) Admin dengan mengambil versi tertinggi
 */

export interface AccountDismissedReceipts {
  popupIds: string[];
  warningMap: Record<string, number>;
}

const STORAGE_KEY = 'bank_nusantara_account_dismissed_receipts_v1';
const MAX_DISMISSED_POPUP_IDS = 250;
const MAX_DISMISSED_WARNING_KEYS = 200;

export function sanitizeDismissedPopupIds(ids?: unknown): string[] {
  if (!Array.isArray(ids)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of ids) {
    if (typeof raw !== 'string') continue;
    const clean = raw.trim();
    if (!clean || clean.length > 160 || seen.has(clean)) continue;
    seen.add(clean);
    result.push(clean);
  }
  return result.length > MAX_DISMISSED_POPUP_IDS
    ? result.slice(result.length - MAX_DISMISSED_POPUP_IDS)
    : result;
}

export function sanitizeDismissedWarningMap(map?: unknown): Record<string, number> {
  if (!map || typeof map !== 'object' || Array.isArray(map)) return {};
  const entries: Array<[string, number]> = [];
  for (const [key, val] of Object.entries(map as Record<string, unknown>)) {
    const cleanKey = String(key || '').trim();
    const num = Math.floor(Number(val) || 0);
    if (!cleanKey || cleanKey.length > 160 || num < 1) continue;
    entries.push([cleanKey, num]);
  }
  const sliced =
    entries.length > MAX_DISMISSED_WARNING_KEYS
      ? entries.slice(entries.length - MAX_DISMISSED_WARNING_KEYS)
      : entries;
  const out: Record<string, number> = {};
  for (const [k, v] of sliced) {
    out[k] = v;
  }
  return out;
}

export function mergeDismissedPopupIds(a?: string[], b?: string[]): string[] {
  const cleanA = sanitizeDismissedPopupIds(a);
  const cleanB = sanitizeDismissedPopupIds(b);
  if (cleanA.length === 0) return cleanB;
  if (cleanB.length === 0) return cleanA;
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const id of [...cleanA, ...cleanB]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
  }
  return merged.length > MAX_DISMISSED_POPUP_IDS
    ? merged.slice(merged.length - MAX_DISMISSED_POPUP_IDS)
    : merged;
}

export function mergeDismissedWarningMaps(
  a?: Record<string, number>,
  b?: Record<string, number>
): Record<string, number> {
  const cleanA = sanitizeDismissedWarningMap(a);
  const cleanB = sanitizeDismissedWarningMap(b);
  const merged: Record<string, number> = { ...cleanA };
  for (const [k, v] of Object.entries(cleanB)) {
    merged[k] = Math.max(merged[k] || 0, v);
  }
  return sanitizeDismissedWarningMap(merged);
}

export function loadAllAccountDismissedReceipts(): Record<string, AccountDismissedReceipts> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const result: Record<string, AccountDismissedReceipts> = {};
    for (const [accId, entry] of Object.entries(parsed as Record<string, unknown>)) {
      if (!accId || !entry || typeof entry !== 'object') continue;
      const obj = entry as { popupIds?: unknown; warningMap?: unknown };
      result[accId] = {
        popupIds: sanitizeDismissedPopupIds(obj.popupIds),
        warningMap: sanitizeDismissedWarningMap(obj.warningMap),
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function saveAllAccountDismissedReceipts(
  map: Record<string, AccountDismissedReceipts>
): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Abaikan jika storage penuh / mode privat
  }
}

export function readSingleAccountDismissedReceipts(accountId?: string): AccountDismissedReceipts {
  if (!accountId) return { popupIds: [], warningMap: {} };
  const all = loadAllAccountDismissedReceipts();
  return all[accountId] || { popupIds: [], warningMap: {} };
}
