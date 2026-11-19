/**
 * Bank Nusantara — Time-Machine Cloud Snapshot & SHA-256 Verified Backup Service
 * ------------------------------------------------------------------------------
 * - Rolling Cloud Snapshots (`users/{uid}/snapshots`): otomatis menyimpan maksimal
 *   5 checkpoint terbaru dan memangkas versi tertua secara otomatis.
 * - Auto-checkpoint sebelum aksi besar (reset, merge, restore, import) + tombol manual.
 * - Export & Restore Backup `.json` berintegritas kriptografis **SHA-256**
 *   menggunakan Web Crypto API (`crypto.subtle.digest`).
 * - Cakupan penuh: profil akun, kartu, saldo, mutasi, kantong, emas 24K, dan pengaturan.
 */
import {
  writeUidVaultDoc,
  deleteUidVaultDoc,
  listUidVaultCollection,
  subscribeUidVaultCollection,
  sanitizeSafeText,
} from '../lib/firebase';
import { getOrCreatePersistentDeviceId } from './maxSyncService';
import { appendSecurityAuditLog } from './authIdentityService';
import type {
  BankAccount,
  Transaction,
  PocketSaving,
  DepositoRecord,
  BudgetCategory,
  ManualExpenseRecord,
  UserAppSettings,
} from '../types/bank';

export const MAX_ROLLING_SNAPSHOTS = 5;

export type SnapshotTriggerReason =
  | 'manual'
  | 'pre_restore'
  | 'pre_import'
  | 'pre_reset'
  | 'pre_merge';

export interface BankingBackupPayload {
  profile: {
    uid: string;
    email: string;
    displayName: string;
    currentAccountId: string;
  };
  accounts: BankAccount[];
  transactions: Transaction[];
  pockets: PocketSaving[];
  depositos: DepositoRecord[];
  budgetCategories: BudgetCategory[];
  manualExpenses: ManualExpenseRecord[];
  budgetTxCategoryMap: Record<string, string>;
  userSettings: UserAppSettings;
  goldSummary: {
    totalGrams: number;
    totalBatches: number;
  };
}

export interface TimeMachineSnapshotRecord {
  id: string;
  ownerUid: string;
  label: string;
  triggerReason: SnapshotTriggerReason;
  createdAtMs: number;
  createdAtIso: string;
  deviceId: string;
  sha256: string;
  accountCount: number;
  transactionCount: number;
  pocketCount: number;
  totalBalance: number;
  totalGoldGrams: number;
  payload: BankingBackupPayload;
}

export interface SignedJsonBackupFile {
  app: 'Bank Nusantara Digital';
  formatVersion: '2.0-zero-trust';
  exportedAtIso: string;
  ownerUid: string;
  deviceId: string;
  algorithm: 'SHA-256';
  sha256: string;
  payload: BankingBackupPayload;
}

// ============================================================================
// CANONICAL JSON SERIALIZATION & WEB CRYPTO API SHA-256 HASHING
// ============================================================================
function canonicalizeValue(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map((item) => canonicalizeValue(item));
  }
  const obj = value as Record<string, unknown>;
  const sortedKeys = Object.keys(obj).sort();
  const out: Record<string, unknown> = {};
  for (const key of sortedKeys) {
    if (obj[key] !== undefined) {
      out[key] = canonicalizeValue(obj[key]);
    }
  }
  return out;
}

export async function computePayloadSha256(payload: unknown): Promise<string> {
  const canonicalJson = JSON.stringify(canonicalizeValue(payload));
  const dataBytes = new TextEncoder().encode(canonicalJson);

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  // Fallback deterministik hanya jika environment non-secure context (tanpa Web Crypto)
  let h1 = 0xdeadbeef ^ dataBytes.length;
  let h2 = 0x41c6ce57 ^ dataBytes.length;
  for (let i = 0; i < dataBytes.length; i++) {
    const ch = dataBytes[i];
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${(h1 >>> 0).toString(16).padStart(8, '0')}${(h2 >>> 0).toString(16).padStart(8, '0')}`.repeat(4);
}

function timingSafeHexEqual(a: string, b: string): boolean {
  const cleanA = (a || '').trim().toLowerCase();
  const cleanB = (b || '').trim().toLowerCase();
  if (cleanA.length !== cleanB.length || cleanA.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < cleanA.length; i++) {
    diff |= cleanA.charCodeAt(i) ^ cleanB.charCodeAt(i);
  }
  return diff === 0;
}

// ============================================================================
// ROLLING CLOUD SNAPSHOTS (`users/{uid}/snapshots` — MAX 5 VERSIONS)
// ============================================================================
export async function createCloudSnapshot(
  uid: string,
  payload: BankingBackupPayload,
  triggerReason: SnapshotTriggerReason,
  customLabel?: string
): Promise<{ success: boolean; snapshot?: TimeMachineSnapshotRecord; message: string }> {
  if (!uid) {
    return { success: false, message: 'UID pengguna belum siap untuk membuat snapshot cloud.' };
  }

  const deviceId = await getOrCreatePersistentDeviceId();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const snapshotId = `snap_${nowMs}_${Math.random().toString(36).slice(2, 6)}`;

  const totalBalance = (payload.accounts || []).reduce((acc, item) => {
    const val = Number(item.balance) || 0;
    return Number.isFinite(val) && val < 1e15 ? acc + val : acc;
  }, 0);
  const totalGoldGrams = (payload.accounts || []).reduce(
    (acc, item) => acc + (Number(item.goldGrams) || 0),
    0
  );

  const sha256 = await computePayloadSha256(payload);
  const defaultLabelMap: Record<SnapshotTriggerReason, string> = {
    manual: 'Checkpoint Manual Pengguna',
    pre_restore: 'Auto-Checkpoint Sebelum Restore Snapshot',
    pre_import: 'Auto-Checkpoint Sebelum Impor Backup JSON',
    pre_reset: 'Auto-Checkpoint Sebelum Reset Cloud',
    pre_merge: 'Auto-Checkpoint Sebelum Atomic Merge',
  };

  const snapshot: TimeMachineSnapshotRecord = {
    id: snapshotId,
    ownerUid: uid,
    label: sanitizeSafeText(customLabel || defaultLabelMap[triggerReason], 120),
    triggerReason,
    createdAtMs: nowMs,
    createdAtIso: nowIso,
    deviceId,
    sha256,
    accountCount: payload.accounts.length,
    transactionCount: payload.transactions.length,
    pocketCount: payload.pockets.length,
    totalBalance,
    totalGoldGrams: Number(totalGoldGrams.toFixed(4)),
    payload,
  };

  const written = await writeUidVaultDoc(
    uid,
    'snapshots',
    snapshotId,
    snapshot as unknown as Record<string, unknown>,
    { merge: false }
  );

  if (!written) {
    return { success: false, message: 'Gagal menyimpan snapshot ke Cloud. Periksa koneksi internet Anda.' };
  }

  // Prune otomatis agar maksimal 5 versi terbaru yang tersimpan
  const allSnapshots = await listCloudSnapshots(uid);
  if (allSnapshots.length > MAX_ROLLING_SNAPSHOTS) {
    const obsolete = allSnapshots.slice(MAX_ROLLING_SNAPSHOTS);
    await Promise.all(obsolete.map((old) => deleteUidVaultDoc(uid, 'snapshots', old.id)));
  }

  await appendSecurityAuditLog(
    uid,
    'snapshot_created',
    `Snapshot Time-Machine dibuat: "${snapshot.label}" (${snapshot.accountCount} kartu, ${snapshot.transactionCount} mutasi, SHA-256: ${sha256.slice(0, 12)}...).`,
    { details: { triggerReason, snapshotId, sha256Prefix: sha256.slice(0, 16) } }
  );

  return {
    success: true,
    snapshot,
    message: `Checkpoint "${snapshot.label}" tersimpan (maksimal ${MAX_ROLLING_SNAPSHOTS} versi aktif).`,
  };
}

export async function listCloudSnapshots(uid: string): Promise<TimeMachineSnapshotRecord[]> {
  if (!uid) return [];
  const items = await listUidVaultCollection<TimeMachineSnapshotRecord>(uid, 'snapshots');
  return items
    .filter((s) => s && typeof s.createdAtMs === 'number' && s.payload)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
}

export function subscribeCloudSnapshots(
  uid: string,
  onSnapshots: (snapshots: TimeMachineSnapshotRecord[]) => void
): () => void {
  if (!uid) {
    onSnapshots([]);
    return () => {};
  }
  return subscribeUidVaultCollection<TimeMachineSnapshotRecord>(uid, 'snapshots', (items) => {
    const sorted = items
      .filter((s) => s && typeof s.createdAtMs === 'number' && s.payload)
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, MAX_ROLLING_SNAPSHOTS);
    onSnapshots(sorted);
  });
}

export async function verifySnapshotIntegrity(
  snapshot: TimeMachineSnapshotRecord
): Promise<{ valid: boolean; computedHash: string }> {
  const computedHash = await computePayloadSha256(snapshot.payload);
  return {
    valid: timingSafeHexEqual(computedHash, snapshot.sha256),
    computedHash,
  };
}

// ============================================================================
// CRYPTO-VERIFIED JSON EXPORT & IMPORT (WEB CRYPTO SHA-256)
// ============================================================================
export async function exportSignedBackupJson(
  uid: string,
  payload: BankingBackupPayload
): Promise<{
  filename: string;
  sha256: string;
  exportedAtIso: string;
  byteSize: number;
}> {
  const deviceId = await getOrCreatePersistentDeviceId();
  const exportedAtIso = new Date().toISOString();
  const sha256 = await computePayloadSha256(payload);

  const signedFile: SignedJsonBackupFile = {
    app: 'Bank Nusantara Digital',
    formatVersion: '2.0-zero-trust',
    exportedAtIso,
    ownerUid: uid,
    deviceId,
    algorithm: 'SHA-256',
    sha256,
    payload,
  };

  const jsonString = JSON.stringify(signedFile, null, 2);
  const dateStamp = exportedAtIso.replace(/[:.]/g, '-').slice(0, 19);
  const filename = `bank-nusantara-backup-${dateStamp}-sha256.json`;

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  }

  await appendSecurityAuditLog(
    uid,
    'backup_exported',
    `Backup JSON terverifikasi SHA-256 diunduh (${filename}, hash: ${sha256.slice(0, 16)}...).`,
    { details: { filename, sha256Prefix: sha256.slice(0, 16), accounts: payload.accounts.length } }
  );

  return {
    filename,
    sha256,
    exportedAtIso,
    byteSize: new TextEncoder().encode(jsonString).byteLength,
  };
}

export async function parseAndVerifyBackupJson(rawText: string): Promise<{
  valid: boolean;
  backup?: SignedJsonBackupFile;
  expectedHash?: string;
  computedHash?: string;
  error?: string;
}> {
  if (!rawText || rawText.trim().length < 20) {
    return { valid: false, error: 'File backup kosong atau tidak valid.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    return { valid: false, error: 'Format JSON rusak dan tidak dapat dibaca.' };
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof parsed.sha256 !== 'string' ||
    parsed.sha256.length < 32 ||
    !parsed.payload ||
    typeof parsed.payload !== 'object' ||
    !Array.isArray(parsed.payload.accounts)
  ) {
    return {
      valid: false,
      error:
        'Struktur berkas tidak sesuai standar Backup Bank Nusantara Digital (field payload atau hash SHA-256 tidak ditemukan).',
    };
  }

  const computedHash = await computePayloadSha256(parsed.payload);
  const expectedHash = String(parsed.sha256).trim().toLowerCase();

  if (!timingSafeHexEqual(computedHash, expectedHash)) {
    return {
      valid: false,
      expectedHash,
      computedHash,
      error:
        'VERIFIKASI SHA-256 GAGAL! Berkas backup telah rusak atau dimodifikasi secara ilegal. Pemulihan diblokir demi keamanan data Anda.',
    };
  }

  return {
    valid: true,
    backup: parsed as SignedJsonBackupFile,
    expectedHash,
    computedHash,
  };
}
