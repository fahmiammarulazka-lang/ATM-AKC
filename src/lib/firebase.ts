/**
 * Bank Nusantara — Zero-Trust Firebase Core Layer (Modular SDK v10+)
 * ---------------------------------------------------------------------------
 * - Konfigurasi berbasis environment variables (VITE_FIREBASE_*) dengan fallback
 *   terkelola ke project aktif "azkaakc" (Realtime Database asia-southeast1 + Cloud Firestore).
 * - Auth Session Persistence maksimal: indexedDBLocalPersistence -> fallback browserLocalPersistence.
 * - Cloud Firestore Multi-Tab Offline-First Persistence (persistentLocalCache + persistentMultipleTabManager).
 * - Hybrid Dual-Engine: Realtime Database azkaakc aktif real-time + auto dual-sync Cloud Firestore.
 * - Tanpa reCAPTCHA (sesuai preferensi keamanan pengguna); sanitasi input anti-XSS & validasi payload ketat.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  signInWithCredential,
  reauthenticateWithPopup,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User as FirebaseUser,
  type OAuthCredential,
} from 'firebase/auth';
import {
  getDatabase,
  ref as rtdbRef,
  get as rtdbGet,
  set as rtdbSet,
  update as rtdbUpdate,
  remove as rtdbRemove,
  onValue as rtdbOnValue,
  type Database,
} from 'firebase/database';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  collection,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  limit,
  type Firestore,
} from 'firebase/firestore';
import { FIREBASE_CLOUD_CONFIG } from '../config/firebaseCloudConfig';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env || {};

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || FIREBASE_CLOUD_CONFIG.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_CLOUD_CONFIG.authDomain,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL || FIREBASE_CLOUD_CONFIG.databaseURL,
  projectId: env.VITE_FIREBASE_PROJECT_ID || FIREBASE_CLOUD_CONFIG.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || FIREBASE_CLOUD_CONFIG.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || FIREBASE_CLOUD_CONFIG.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || FIREBASE_CLOUD_CONFIG.appId,
};

export const firebaseApp: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Primary Realtime Database (Project: azkaakc — asia-southeast1)
export const rtdb: Database = getDatabase(firebaseApp, firebaseConfig.databaseURL);

// Multi-Tab Offline-First Cloud Firestore (IndexedDB Persistent Cache)
let firestoreInstance: Firestore;
let indexedDbCacheActive = false;

function initMultiTabFirestore(): Firestore {
  const dbId = FIREBASE_CLOUD_CONFIG.firestoreDatabaseId;
  const isDefaultDb = !dbId || dbId === '(default)';
  try {
    const initialized = isDefaultDb
      ? initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        })
      : initializeFirestore(
          firebaseApp,
          {
            localCache: persistentLocalCache({
              tabManager: persistentMultipleTabManager(),
            }),
          },
          dbId
        );
    indexedDbCacheActive = true;
    return initialized;
  } catch {
    // Jika sudah pernah diinisialisasi sebelumnya (mis. HMR / double import), ambil instance aktif
    indexedDbCacheActive = typeof indexedDB !== 'undefined';
    return isDefaultDb ? getFirestore(firebaseApp) : getFirestore(firebaseApp, dbId);
  }
}

export const db: Firestore = initMultiTabFirestore();
export const isIndexedDbPersistenceEnabled = (): boolean => indexedDbCacheActive;

// Firebase Auth dengan Persistent Session Permanen (browserLocalPersistence)
export const auth: Auth = getAuth(firebaseApp);

let authPersistenceMode: 'localStorage' | 'indexedDB' | 'memory' = 'localStorage';
export const getAuthPersistenceMode = () => authPersistenceMode;

export async function ensureBrowserLocalPersistence(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    await setPersistence(auth, browserLocalPersistence);
    authPersistenceMode = 'localStorage';
  } catch {
    try {
      await setPersistence(auth, indexedDBLocalPersistence);
      authPersistenceMode = 'indexedDB';
    } catch {
      authPersistenceMode = 'memory';
    }
  }
}

export const authPersistenceReady: Promise<void> = ensureBrowserLocalPersistence();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  GoogleAuthProvider,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  signInAnonymously,
  linkWithPopup,
  signInWithCredential,
  reauthenticateWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  collection,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  writeBatch,
  serverTimestamp,
  query,
  orderBy,
  limit,
};
export type { FirebaseUser, OAuthCredential };

// ============================================================================
// DETEKSI OTOMATIS HYBRID DUAL-ENGINE (RTDB azkaakc LANGSUNG + PROBE FIRESTORE LATAR BELAKANG)
// ============================================================================
// Default FALSE pada startup agar jalur baca kritis TIDAK PERNAH menunggu timeout Cloud Firestore (10-30s)
// jika Firestore belum dibuat di project azkaakc. Probe latar belakang pasca-boot akan otomatis mengaktifkannya jika tersedia.
let firestoreDualSyncEnabled = false;
let firestoreAvailabilityStatus: 'checking' | 'active' | 'rtdb_primary' = 'rtdb_primary';

export function isFirestoreActive(): boolean {
  return firestoreDualSyncEnabled && firestoreAvailabilityStatus === 'active';
}

export async function ensureFirestoreActiveNow(): Promise<boolean> {
  if (firestoreDualSyncEnabled && firestoreAvailabilityStatus === 'active') return true;
  return probeFirestoreInBackground();
}

export function getActiveCloudEngineLabel(): 'hybrid_rtdb_firestore' | 'rtdb_azkaakc_indexeddb' {
  return firestoreDualSyncEnabled && firestoreAvailabilityStatus === 'active'
    ? 'hybrid_rtdb_firestore'
    : 'rtdb_azkaakc_indexeddb';
}

function raceWithTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  if (timeoutMs <= 0) return promise;
  return new Promise<T>((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        resolve(fallbackValue);
      }
    }, timeoutMs);
    promise
      .then((val) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(val);
        }
      })
      .catch(() => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(fallbackValue);
        }
      });
  });
}

export function isFirestoreMissingError(err: unknown): boolean {
  const code = String((err as { code?: string })?.code || '').toLowerCase();
  const msg = String((err as { message?: string })?.message || err || '').toLowerCase();
  return (
    code.includes('not-found') ||
    code.includes('unavailable') ||
    code.includes('permission-denied') ||
    msg.includes('5 not_found') ||
    msg.includes('client is offline') ||
    msg.includes('does not exist')
  );
}

export function markFirestoreUnavailableIfMissing(err: unknown): boolean {
  if (isFirestoreMissingError(err)) {
    const code = String((err as { code?: string })?.code || '').toLowerCase();
    const msg = String((err as { message?: string })?.message || err || '').toLowerCase();
    if (
      code.includes('not-found') ||
      msg.includes('5 not_found') ||
      msg.includes('does not exist') ||
      msg.includes('client is offline')
    ) {
      firestoreDualSyncEnabled = false;
      firestoreAvailabilityStatus = 'rtdb_primary';
    }
    return true;
  }
  return false;
}

// ============================================================================
// SANITASI ANTI-XSS & PEMBERSIH PAYLOAD REALTIME DB / FIRESTORE
// ============================================================================
export function sanitizeSafeText(input: unknown, maxLen = 500): string {
  const raw = typeof input === 'string' ? input : String(input ?? '');
  return raw
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, maxLen);
}

export function normalizeEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export function emailToFirestoreDocId(email: string): string {
  const normalized = normalizeEmailKey(email);
  let hash = 2166136261;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const hex = (hash >>> 0).toString(16).padStart(8, '0');
  const slug =
    normalized
      .replace(/@/g, '_at_')
      .replace(/[^a-z0-9_-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 48) || 'user';
  return `${slug}__${hex}`;
}

export function toSafeRtdbPathSegment(segment: string): string {
  return segment.replace(/[.#$[\]/]/g, '_');
}

export function toArraySafe<T>(val: unknown): T[] {
  if (Array.isArray(val)) {
    return val.filter((item): item is T => item !== null && item !== undefined);
  }
  if (val && typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return [];
    const allNumericKeys = entries.every(([k]) => /^\d+$/.test(k));
    if (allNumericKeys) {
      return entries
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([, v]) => v as T)
        .filter((item): item is T => item !== null && item !== undefined);
    }
    return entries
      .map(([, v]) => v as T)
      .filter((item): item is T => item !== null && item !== undefined);
  }
  return [];
}

export function sanitizeForRealtimeDb(value: unknown, depth = 0): unknown {
  if (depth > 9 || value === undefined || value === null) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) {
      return value.length <= 65536 ? value : '';
    }
    return value.length > 24000 ? value.slice(0, 24000) : value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 260)
      .filter((item) => item !== undefined && item !== null)
      .map((item) => sanitizeForRealtimeDb(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(value as Record<string, unknown>)) {
      if (rawVal === undefined || !rawKey) continue;
      const safeKey = toSafeRtdbPathSegment(rawKey);
      if (!safeKey) continue;
      const sanitizedVal = sanitizeForRealtimeDb(rawVal, depth + 1);
      if (sanitizedVal !== undefined) {
        out[safeKey] = sanitizedVal;
      }
    }
    return out;
  }
  return String(value);
}

export function sanitizeForFirestoreDoc(value: unknown, depth = 0): unknown {
  if (depth > 9 || value === undefined) return null;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) {
      return value.length <= 65536 ? value : '';
    }
    return value.length > 24000 ? value.slice(0, 24000) : value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 260)
      .filter((item) => item !== undefined && item !== null)
      .map((item) => sanitizeForFirestoreDoc(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [rawKey, rawVal] of Object.entries(value as Record<string, unknown>)) {
      if (rawVal === undefined || !rawKey || rawKey.length > 128) continue;
      out[rawKey] = sanitizeForFirestoreDoc(rawVal, depth + 1);
    }
    return out;
  }
  return String(value);
}

// ============================================================================
// HYBRID DUAL-ENGINE READ / WRITE / SUBSCRIBE (RTDB azkaakc + FIRESTORE)
// ============================================================================
function buildSafePath(segments: string[]): string {
  return segments.map((s) => toSafeRtdbPathSegment(s)).join('/');
}

export async function readCloudDoc<T = Record<string, any>>(
  collectionName: string,
  docId: string,
  options?: { timeoutMs?: number; skipFirestoreFallback?: boolean }
): Promise<T | null> {
  const safePath = buildSafePath([collectionName, docId]);
  const timeoutMs = options?.timeoutMs ?? 0;

  const rtdbReadPromise = rtdbGet(rtdbRef(rtdb, safePath))
    .then((snap) => {
      if (snap.exists()) {
        const val = snap.val();
        if (val && typeof val === 'object') {
          return val as T;
        }
      }
      return null;
    })
    .catch((rtdbErr) => {
      console.warn(`[RTDB] Gagal membaca ${safePath}:`, rtdbErr);
      return null;
    });

  const rtdbResult =
    timeoutMs > 0 ? await raceWithTimeout(rtdbReadPromise, timeoutMs, null) : await rtdbReadPromise;
  if (rtdbResult) {
    return rtdbResult;
  }

  // Hanya baca fallback Cloud Firestore jika sudah terkonfirmasi aktif di latar belakang & tidak di-skip
  if (firestoreDualSyncEnabled && firestoreAvailabilityStatus === 'active' && !options?.skipFirestoreFallback) {
    try {
      const fsSnap = await raceWithTimeout(
        getDoc(doc(db, collectionName, docId)),
        timeoutMs > 0 ? Math.min(timeoutMs, 1500) : 2000,
        null
      );
      if (fsSnap && fsSnap.exists()) {
        const fsData = fsSnap.data() as T;
        const cleanMirror = sanitizeForRealtimeDb(fsData) as Record<string, unknown>;
        void rtdbSet(rtdbRef(rtdb, safePath), cleanMirror).catch(() => {});
        return fsData;
      }
    } catch (fsErr) {
      markFirestoreUnavailableIfMissing(fsErr);
    }
  }

  return null;
}

// ============================================================================
// EARLY BOOT PREFETCH (T = 0ms) — MULAI BACA RTDB SEBELUM AUTH CALLBACK SELESAI
// ============================================================================
let earlyAccountsPrefetch: Promise<{
  accounts: unknown;
  deletedAccountIds: unknown;
  updatedAtMs: number;
} | null> | null = null;
let earlyFullMasterPrefetch: Promise<Record<string, any> | null> | null = null;

export function startEarlyBootRtdbPrefetch(): void {
  if (typeof window === 'undefined') return;
  if (!earlyAccountsPrefetch) {
    earlyAccountsPrefetch = Promise.all([
      rtdbGet(rtdbRef(rtdb, 'bank_state_v1/master_state/accounts'))
        .then((s) => (s.exists() ? s.val() : null))
        .catch(() => null),
      rtdbGet(rtdbRef(rtdb, 'bank_state_v1/master_state/deletedAccountIds'))
        .then((s) => (s.exists() ? s.val() : null))
        .catch(() => null),
      rtdbGet(rtdbRef(rtdb, 'bank_state_v1/master_state/updatedAtMs'))
        .then((s) => (s.exists() ? Number(s.val()) || 0 : 0))
        .catch(() => 0),
    ])
      .then(([accounts, deletedAccountIds, updatedAtMs]) =>
        accounts ? { accounts, deletedAccountIds, updatedAtMs } : null
      )
      .catch(() => null);
  }
  if (!earlyFullMasterPrefetch) {
    earlyFullMasterPrefetch = rtdbGet(rtdbRef(rtdb, 'bank_state_v1/master_state'))
      .then((snap) => (snap.exists() && typeof snap.val() === 'object' ? (snap.val() as Record<string, any>) : null))
      .catch(() => null);
  }
}

export function getEarlyAccountsPrefetch(timeoutMs = 2200) {
  startEarlyBootRtdbPrefetch();
  return raceWithTimeout(earlyAccountsPrefetch!, timeoutMs, null);
}

export function getEarlyFullMasterPrefetch(timeoutMs = 6000) {
  startEarlyBootRtdbPrefetch();
  return raceWithTimeout(earlyFullMasterPrefetch!, timeoutMs, null);
}

export async function writeCloudDoc(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  options?: { merge?: boolean }
): Promise<boolean> {
  const safePath = buildSafePath([collectionName, docId]);
  const shouldMerge = options?.merge !== false;
  const cleanPayload = sanitizeForRealtimeDb(data) as Record<string, unknown>;

  let rtdbSuccess = false;
  try {
    const nodeRef = rtdbRef(rtdb, safePath);
    if (shouldMerge) {
      await rtdbUpdate(nodeRef, cleanPayload);
    } else {
      await rtdbSet(nodeRef, cleanPayload);
    }
    rtdbSuccess = true;
  } catch (rtdbErr) {
    console.error(`[RTDB] Gagal menulis ${safePath}:`, rtdbErr);
  }

  if (firestoreDualSyncEnabled) {
    void setDoc(doc(db, collectionName, docId), cleanPayload, { merge: shouldMerge })
      .then(() => {
        firestoreAvailabilityStatus = 'active';
      })
      .catch((fsErr) => {
        markFirestoreUnavailableIfMissing(fsErr);
      });
  }

  return rtdbSuccess;
}

export function subscribeCloudDoc<T = Record<string, any>>(
  collectionName: string,
  docId: string,
  onData: (data: T | null, meta: { fromCache: boolean; hasPendingWrites?: boolean }) => void,
  onError?: (err: unknown) => void
): () => void {
  const safePath = buildSafePath([collectionName, docId]);
  const nodeRef = rtdbRef(rtdb, safePath);
  return rtdbOnValue(
    nodeRef,
    (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        onData(val && typeof val === 'object' ? (val as T) : null, {
          fromCache: false,
          hasPendingWrites: false,
        });
      } else {
        onData(null, { fromCache: false, hasPendingWrites: false });
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function writeCloudDocDual(
  collectionName: string,
  docId: string,
  data: Record<string, unknown>,
  options?: { merge?: boolean }
): Promise<{
  ok: boolean;
  rtdbOk: boolean;
  firestoreOk: boolean;
  errorMessage?: string;
}> {
  const safePath = buildSafePath([collectionName, docId]);
  const shouldMerge = options?.merge !== false;
  const rtdbPayload = sanitizeForRealtimeDb(data) as Record<string, unknown>;
  const fsPayload = sanitizeForFirestoreDoc(data) as Record<string, unknown>;

  const rtdbPromise = (async () => {
    try {
      const nodeRef = rtdbRef(rtdb, safePath);
      if (shouldMerge) {
        await rtdbUpdate(nodeRef, rtdbPayload);
      } else {
        await rtdbSet(nodeRef, rtdbPayload);
      }
      return { ok: true as const, err: undefined };
    } catch (err) {
      return {
        ok: false as const,
        err: err instanceof Error ? err.message : String(err),
      };
    }
  })();

  const firestorePromise = (async () => {
    if (!auth.currentUser) {
      return { ok: false as const, err: 'Belum login Firebase Auth' };
    }
    const activeFs = await ensureFirestoreActiveNow();
    if (!activeFs) {
      return { ok: false as const, err: 'Firestore belum aktif' };
    }
    try {
      await setDoc(doc(db, collectionName, docId), fsPayload, { merge: shouldMerge });
      firestoreAvailabilityStatus = 'active';
      return { ok: true as const, err: undefined };
    } catch (fsErr) {
      markFirestoreUnavailableIfMissing(fsErr);
      handleFirestoreError(fsErr, OperationType.WRITE, `${collectionName}/${docId}`, {
        suppressThrow: true,
      });
      return {
        ok: false as const,
        err: fsErr instanceof Error ? fsErr.message : String(fsErr),
      };
    }
  })();

  const [rtdbRes, fsRes] = await Promise.all([rtdbPromise, firestorePromise]);
  return {
    ok: rtdbRes.ok || fsRes.ok,
    rtdbOk: rtdbRes.ok,
    firestoreOk: fsRes.ok,
    errorMessage: !rtdbRes.ok && !fsRes.ok ? fsRes.err || rtdbRes.err : undefined,
  };
}

function extractCloudDocTimestampMs(docVal: Record<string, any> | null): number {
  if (!docVal || typeof docVal !== 'object') return 0;
  return Math.max(
    Number(docVal.giftEventsUpdatedAtMs) || 0,
    Number(docVal.updatedAtMs) || 0
  );
}

export async function readCloudDocDual<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  options?: { timeoutMs?: number }
): Promise<{ data: T | null; respondedCleanly: boolean; source?: 'rtdb' | 'firestore' }> {
  const safePath = buildSafePath([collectionName, docId]);
  const timeoutMs = options?.timeoutMs ?? 4500;

  const rtdbTask = rtdbGet(rtdbRef(rtdb, safePath))
    .then((snap) => ({
      responded: true,
      data: snap.exists() && typeof snap.val() === 'object' ? (snap.val() as T) : null,
    }))
    .catch(() => ({ responded: false, data: null as T | null }));

  const fsTask = (async () => {
    if (!auth.currentUser) {
      return { responded: false, data: null as T | null };
    }
    const activeFs = await ensureFirestoreActiveNow();
    if (!activeFs) {
      return { responded: false, data: null as T | null };
    }
    try {
      const snap = await getDoc(doc(db, collectionName, docId));
      return {
        responded: true,
        data: snap.exists() ? (snap.data() as T) : null,
      };
    } catch (fsErr) {
      markFirestoreUnavailableIfMissing(fsErr);
      handleFirestoreError(fsErr, OperationType.GET, `${collectionName}/${docId}`, {
        suppressThrow: true,
      });
      return { responded: false, data: null as T | null };
    }
  })();

  const [rtdbRes, fsRes] = await Promise.all([
    raceWithTimeout(rtdbTask, timeoutMs, { responded: false, data: null as T | null }),
    raceWithTimeout(fsTask, timeoutMs, { responded: false, data: null as T | null }),
  ]);

  const respondedCleanly = rtdbRes.responded || fsRes.responded;
  if (rtdbRes.data && fsRes.data) {
    const rtdbTs = extractCloudDocTimestampMs(rtdbRes.data);
    const fsTs = extractCloudDocTimestampMs(fsRes.data);
    if (fsTs > rtdbTs) {
      return { data: fsRes.data, respondedCleanly, source: 'firestore' };
    }
    return { data: rtdbRes.data, respondedCleanly, source: 'rtdb' };
  }
  if (fsRes.data) {
    return { data: fsRes.data, respondedCleanly, source: 'firestore' };
  }
  if (rtdbRes.data) {
    return { data: rtdbRes.data, respondedCleanly, source: 'rtdb' };
  }
  return { data: null, respondedCleanly };
}

export function subscribeCloudDocDual<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  onData: (data: T | null, source: 'rtdb' | 'firestore') => void,
  onError?: (err: unknown) => void
): () => void {
  const safePath = buildSafePath([collectionName, docId]);
  const nodeRef = rtdbRef(rtdb, safePath);
  const unsubRtdb = rtdbOnValue(
    nodeRef,
    (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        onData(val && typeof val === 'object' ? (val as T) : null, 'rtdb');
      } else {
        onData(null, 'rtdb');
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  let unsubFs: (() => void) | null = null;
  let cancelled = false;

  const attachFsListener = () => {
    if (cancelled || unsubFs || !auth.currentUser) return;
    try {
      unsubFs = onSnapshot(
        doc(db, collectionName, docId),
        { includeMetadataChanges: false },
        (snap) => {
          if (snap.exists()) {
            onData(snap.data() as T, 'firestore');
          }
        },
        (fsErr) => {
          markFirestoreUnavailableIfMissing(fsErr);
          handleFirestoreError(fsErr, OperationType.GET, `${collectionName}/${docId}`, {
            suppressThrow: true,
          });
        }
      );
    } catch {
      // RTDB tetap aktif 100%
    }
  };

  if (isFirestoreActive()) {
    attachFsListener();
  } else if (auth.currentUser) {
    void ensureFirestoreActiveNow().then((ok) => {
      if (ok && !cancelled) attachFsListener();
    });
  }

  return () => {
    cancelled = true;
    unsubRtdb();
    if (unsubFs) unsubFs();
  };
}

/**
 * Helper khusus Sub-Koleksi UID Private Vault:
 * users/{uid}/{subCollection}/{docId}
 */
export async function readUidVaultDoc<T = Record<string, any>>(
  uid: string,
  subCollection: string,
  docId: string
): Promise<T | null> {
  const safePath = buildSafePath(['users', uid, subCollection, docId]);
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, safePath));
    if (snap.exists()) {
      const val = snap.val();
      if (val && typeof val === 'object') return val as T;
    }
  } catch {
    // lanjut ke fallback Firestore
  }

  if (firestoreDualSyncEnabled) {
    try {
      const fsSnap = await getDoc(doc(db, 'users', uid, subCollection, docId));
      if (fsSnap.exists()) {
        firestoreAvailabilityStatus = 'active';
        return fsSnap.data() as T;
      }
    } catch (err) {
      markFirestoreUnavailableIfMissing(err);
    }
  }
  return null;
}

export async function writeUidVaultDoc(
  uid: string,
  subCollection: string,
  docId: string,
  data: Record<string, unknown>,
  options?: { merge?: boolean }
): Promise<boolean> {
  const safePath = buildSafePath(['users', uid, subCollection, docId]);
  const shouldMerge = options?.merge !== false;
  const cleanPayload = sanitizeForRealtimeDb(data) as Record<string, unknown>;

  let ok = false;
  try {
    const nodeRef = rtdbRef(rtdb, safePath);
    if (shouldMerge) {
      await rtdbUpdate(nodeRef, cleanPayload);
    } else {
      await rtdbSet(nodeRef, cleanPayload);
    }
    ok = true;
  } catch (err) {
    console.warn(`[Vault RTDB] Gagal menulis ${safePath}:`, err);
  }

  if (firestoreDualSyncEnabled) {
    void setDoc(
      doc(db, 'users', uid, subCollection, docId),
      { ...cleanPayload, updatedAtServer: serverTimestamp() },
      { merge: shouldMerge }
    )
      .then(() => {
        firestoreAvailabilityStatus = 'active';
      })
      .catch((err) => {
        markFirestoreUnavailableIfMissing(err);
      });
  }

  return ok;
}

export async function deleteUidVaultDoc(
  uid: string,
  subCollection: string,
  docId: string
): Promise<boolean> {
  const safePath = buildSafePath(['users', uid, subCollection, docId]);
  let ok = false;
  try {
    await rtdbRemove(rtdbRef(rtdb, safePath));
    ok = true;
  } catch {
    // abaikan jika tidak ada
  }

  if (firestoreDualSyncEnabled) {
    void deleteDoc(doc(db, 'users', uid, subCollection, docId)).catch((err) => {
      markFirestoreUnavailableIfMissing(err);
    });
  }

  return ok;
}

export async function listUidVaultCollection<T extends { id?: string }>(
  uid: string,
  subCollection: string
): Promise<T[]> {
  const safePath = buildSafePath(['users', uid, subCollection]);
  try {
    const snap = await rtdbGet(rtdbRef(rtdb, safePath));
    if (snap.exists()) {
      const val = snap.val();
      if (val && typeof val === 'object') {
        return Object.entries(val as Record<string, any>)
          .filter(([, v]) => v && typeof v === 'object')
          .map(([k, v]) => ({ id: k, ...v } as T));
      }
    }
  } catch {
    // lanjut ke fallback Firestore
  }

  if (firestoreDualSyncEnabled) {
    try {
      const qSnap = await getDocs(collection(db, 'users', uid, subCollection));
      firestoreAvailabilityStatus = 'active';
      return qSnap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    } catch (err) {
      markFirestoreUnavailableIfMissing(err);
    }
  }
  return [];
}

export function subscribeUidVaultCollection<T extends { id?: string }>(
  uid: string,
  subCollection: string,
  onItems: (items: T[], meta: { fromCache: boolean; hasPendingWrites: boolean }) => void,
  onError?: (err: unknown) => void
): () => void {
  const safePath = buildSafePath(['users', uid, subCollection]);
  const nodeRef = rtdbRef(rtdb, safePath);
  const unsubRtdb = rtdbOnValue(
    nodeRef,
    (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        if (val && typeof val === 'object') {
          const items = Object.entries(val as Record<string, any>)
            .filter(([, v]) => v && typeof v === 'object')
            .map(([k, v]) => ({ id: k, ...v } as T));
          onItems(items, { fromCache: false, hasPendingWrites: false });
          return;
        }
      }
      onItems([], { fromCache: false, hasPendingWrites: false });
    },
    (err) => {
      if (onError) onError(err);
    }
  );

  // Jika Firestore aktif, pasang listener paralel dengan includeMetadataChanges: true
  let unsubFs: (() => void) | null = null;
  if (firestoreDualSyncEnabled && firestoreAvailabilityStatus === 'active') {
    try {
      unsubFs = onSnapshot(
        collection(db, 'users', uid, subCollection),
        { includeMetadataChanges: true },
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
          if (items.length > 0) {
            onItems(items, {
              fromCache: snap.metadata.fromCache,
              hasPendingWrites: snap.metadata.hasPendingWrites,
            });
          }
        },
        (err) => {
          markFirestoreUnavailableIfMissing(err);
        }
      );
    } catch {
      // RTDB tetap menjadi tulang punggung real-time
    }
  }

  return () => {
    unsubRtdb();
    if (unsubFs) unsubFs();
  };
}

// ============================================================================
// STRUCTURED ERROR HANDLING (FIREBASE INTEGRATION STANDARD)
// ============================================================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: boolean | string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  options?: { suppressThrow?: boolean }
): void {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firebase Cloud Error: ', JSON.stringify(errInfo));
  if (!options?.suppressThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export async function signInWithGooglePopup(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  errorCode?: string;
  redirecting?: boolean;
  message: string;
}> {
  // Wajib aktifkan browserLocalPersistence tepat sebelum login popup agar token sesi permanen di browser
  await ensureBrowserLocalPersistence();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return {
      success: true,
      user: result.user,
      message: `Berhasil login dengan Google (${result.user.email || result.user.displayName || 'Akun Google'}).`,
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    const host = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
    if (code === 'auth/popup-blocked') {
      return {
        success: false,
        errorCode: code,
        message:
          'Popup login Google diblokir oleh browser Anda. Mohon izinkan pop-up pada bilah alamat browser untuk situs ini, lalu klik tombol Coba Lagi.',
      };
    }
    if (code === 'auth/unauthorized-domain') {
      return {
        success: false,
        errorCode: code,
        message: `Domain "${host}" belum terdaftar di Firebase Console Authorized Domains (Project: azkaakc). Tambahkan "${host}" di Firebase Console → Authentication → Settings → Authorized domains.`,
      };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        errorCode: code,
        message: 'Jendela login Google ditutup sebelum proses selesai. Silakan klik tombol Sign in with Google lagi.',
      };
    }
    return {
      success: false,
      errorCode: code,
      message:
        err instanceof Error
          ? err.message
          : 'Gagal masuk dengan Google. Periksa koneksi internet atau konfigurasi Firebase Anda.',
    };
  }
}

export async function probeFirestoreInBackground(): Promise<boolean> {
  if (firestoreAvailabilityStatus === 'active') return true;
  try {
    const res = await raceWithTimeout(
      getDocFromServer(doc(db, 'test', 'connection'))
        .then(() => 'active' as const)
        .catch((error) => {
          const msg = error instanceof Error ? error.message : String(error);
          if (
            msg.includes('5 NOT_FOUND') ||
            msg.includes('the client is offline') ||
            msg.includes('not-found')
          ) {
            return 'missing' as const;
          }
          // Permission denied membuktikan instance Firestore ADA & aktif dengan rules Zero-Trust
          return 'active' as const;
        }),
      2500,
      'missing' as const
    );

    if (res === 'active') {
      firestoreDualSyncEnabled = true;
      firestoreAvailabilityStatus = 'active';
      return true;
    }
  } catch {
    // tetap di mode RTDB Primary tanpa mengganggu UI
  }
  firestoreDualSyncEnabled = false;
  firestoreAvailabilityStatus = 'rtdb_primary';
  return false;
}

export async function testConnection(): Promise<boolean> {
  try {
    const ok = await raceWithTimeout(
      rtdbGet(rtdbRef(rtdb, 'bank_state_v1/master_state/updatedAtMs'))
        .then(() => true)
        .catch(() => false),
      2500,
      false
    );
    return ok;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  // T = 0ms: Langsung mulai prefetch RTDB azkaakc sedini mungkin sebelum React selesai mount
  startEarlyBootRtdbPrefetch();
  // Pasca-boot (non-blocking): cek ketersediaan Cloud Firestore di latar belakang setelah 3 detik
  window.setTimeout(() => {
    void probeFirestoreInBackground();
  }, 3000);
}
