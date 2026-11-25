/**
 * Bank Nusantara — Max-Sync Engine (Real-Time Multi-Device & Offline-First)
 * ---------------------------------------------------------------------------
 * - Persistent Browser Device ID (UUID disimpan khusus di IndexedDB, bukan localStorage data inti)
 * - IndexedDB Staging Buffer untuk protokol Atomic Data Rescue & Merge
 * - Real-time bidirectional streaming (onSnapshot includeMetadataChanges + RTDB onValue)
 * - Concurrency Control deterministik: ownerUid, createdAt, updatedAt, syncVersion (+1), lastDeviceId
 * - 4-State Live Sync Telemetry HUD Emitter (synced | syncing | offline | error)
 */
import {
  db,
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  readUidVaultDoc,
  writeUidVaultDoc,
  subscribeCloudDoc,
  isFirestoreActive,
  isIndexedDbPersistenceEnabled,
  getActiveCloudEngineLabel,
  markFirestoreUnavailableIfMissing,
  sanitizeForRealtimeDb,
  testConnection,
} from '../lib/firebase';

export type SyncTelemetryStatus = 'synced' | 'syncing' | 'offline' | 'error';

export interface SyncTelemetryState {
  status: SyncTelemetryStatus;
  fromCache: boolean;
  hasPendingWrites: boolean;
  pendingWritesCount: number;
  lastSyncedAt: string | null;
  syncVersion: number;
  syncedDocCount: number;
  deviceId: string;
  engineMode: 'hybrid_rtdb_firestore' | 'rtdb_azkaakc_indexeddb';
  indexedDbActive: boolean;
  isOnline: boolean;
  lastError: string | null;
}

export interface VaultDocumentEnvelope<T = Record<string, unknown>> {
  ownerUid: string;
  createdAtMs: number;
  updatedAtMs: number;
  createdAtIso: string;
  updatedAtIso: string;
  syncVersion: number;
  lastDeviceId: string;
  payload: T;
}

// ============================================================================
// DEDICATED INDEXEDDB STORE (Device ID + Atomic Rescue Staging + Offline Queue)
// ============================================================================
const IDB_NAME = 'bank_nusantara_zero_trust_vault_v1';
const IDB_VERSION = 1;
const STORE_META = 'meta';
const STORE_STAGING = 'rescue_staging';

let memoryDeviceId: string | null = null;
const memoryStagingMap = new Map<string, unknown>();

function openVaultIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(STORE_META)) {
          database.createObjectStore(STORE_META);
        }
        if (!database.objectStoreNames.contains(STORE_STAGING)) {
          database.createObjectStore(STORE_STAGING);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(storeName: string, key: string): Promise<T | null> {
  const database = await openVaultIdb();
  if (!database) return null;
  return new Promise((resolve) => {
    try {
      const tx = database.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbPut(storeName: string, key: string, value: unknown): Promise<void> {
  const database = await openVaultIdb();
  if (!database) return;
  return new Promise((resolve) => {
    try {
      const tx = database.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function idbDelete(storeName: string, key: string): Promise<void> {
  const database = await openVaultIdb();
  if (!database) return;
  return new Promise((resolve) => {
    try {
      const tx = database.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const DEVICE_ID_LS_KEY = 'bn_persistent_device_id_v1';
const ACTIVE_BOOT_SESSION_LS_KEY = 'bn_active_boot_session_envelope_v1';
let deviceIdInitPromise: Promise<string> | null = null;

function readDeviceIdLocalFallback(): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const v = window.localStorage.getItem(DEVICE_ID_LS_KEY);
      if (v && v.length >= 12) return v;
    }
  } catch {
    // ignore storage restriction
  }
  return null;
}

function writeDeviceIdLocalFallback(deviceId: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(DEVICE_ID_LS_KEY, deviceId);
    }
  } catch {
    // ignore storage restriction
  }
}

export async function getOrCreatePersistentDeviceId(): Promise<string> {
  if (memoryDeviceId) return memoryDeviceId;
  if (deviceIdInitPromise) return deviceIdInitPromise;

  deviceIdInitPromise = (async () => {
    const storedIdb = await idbGet<string>(STORE_META, 'last_device_id');
    if (storedIdb && typeof storedIdb === 'string' && storedIdb.length >= 12) {
      memoryDeviceId = storedIdb;
      writeDeviceIdLocalFallback(storedIdb);
      return storedIdb;
    }

    const storedLs = readDeviceIdLocalFallback();
    if (storedLs) {
      memoryDeviceId = storedLs;
      await idbPut(STORE_META, 'last_device_id', storedLs);
      return storedLs;
    }

    const created = `dev-${generateUuidV4()}`;
    memoryDeviceId = created;
    writeDeviceIdLocalFallback(created);
    await idbPut(STORE_META, 'last_device_id', created);
    return created;
  })();

  try {
    return await deviceIdInitPromise;
  } finally {
    deviceIdInitPromise = null;
  }
}

export function getDeviceIdSync(): string {
  if (memoryDeviceId) return memoryDeviceId;
  const fromLs = readDeviceIdLocalFallback();
  if (fromLs) {
    memoryDeviceId = fromLs;
    void idbPut(STORE_META, 'last_device_id', fromLs);
    return fromLs;
  }
  void getOrCreatePersistentDeviceId();
  return `dev-${generateUuidV4()}`;
}

export async function stageRescuePayload(key: string, data: unknown): Promise<void> {
  memoryStagingMap.set(key, data);
  await idbPut(STORE_STAGING, key, {
    stagedAtMs: Date.now(),
    data,
  });
}

export async function readRescuePayload<T>(key: string): Promise<T | null> {
  if (memoryStagingMap.has(key)) {
    return memoryStagingMap.get(key) as T;
  }
  const stored = await idbGet<{ stagedAtMs: number; data: T }>(STORE_STAGING, key);
  return stored?.data ?? null;
}

export async function clearRescuePayload(key: string): Promise<void> {
  memoryStagingMap.delete(key);
  await idbDelete(STORE_STAGING, key);
}

// ============================================================================
// FAST-BOOT INDEXEDDB SNAPSHOT CACHE (ZERO localStorage — INSTAN < 200ms)
// ============================================================================
export interface FastBootCacheSnapshot {
  accounts: any[];
  deletedAccountIds: string[];
  currentAccountId?: string;
  banSupportConfig?: any;
  cachedAtMs: number;
}

const FAST_BOOT_CACHE_KEY = 'fast_boot_snapshot_v1';

export async function saveFastBootSnapshot(snapshot: FastBootCacheSnapshot): Promise<void> {
  try {
    await idbPut(STORE_STAGING, FAST_BOOT_CACHE_KEY, snapshot);
  } catch {
    // abaikan jika IndexedDB dibatasi browser privat
  }
}

export async function readFastBootSnapshot(): Promise<FastBootCacheSnapshot | null> {
  try {
    const cached = await idbGet<FastBootCacheSnapshot>(STORE_STAGING, FAST_BOOT_CACHE_KEY);
    if (cached && Array.isArray(cached.accounts) && cached.accounts.length > 0) {
      return cached;
    }
  } catch {
    // fallback langsung ke RTDB
  }
  return null;
}

export async function clearFastBootSnapshot(): Promise<void> {
  try {
    await idbDelete(STORE_STAGING, FAST_BOOT_CACHE_KEY);
  } catch {
    // abaikan error cleanup
  }
}

// ============================================================================
// DEDICATED GIFT EVENTS & LETTER SEAL INDEXEDDB CACHE (SURVIVES REFRESH)
// ============================================================================
export interface GiftAndSealRegistryCache {
  giftEvents?: any[];
  deletedGiftEventIds?: string[];
  giftEventsInitialized?: boolean;
  giftEventsUpdatedAtMs?: number;
  defaultLetterSealConfig?: any;
  letterSealUpdatedAtMs?: number;
  cachedAtMs: number;
}

const GIFT_SEAL_REGISTRY_CACHE_KEY = 'gift_and_seal_registry_v1';
let registryIdbWriteChain: Promise<void> = Promise.resolve();

export async function readGiftAndSealRegistryIdb(): Promise<GiftAndSealRegistryCache | null> {
  try {
    const cached = await idbGet<GiftAndSealRegistryCache>(
      STORE_STAGING,
      GIFT_SEAL_REGISTRY_CACHE_KEY
    );
    if (cached && typeof cached === 'object') {
      return cached;
    }
  } catch {
    // fallback ke Cloud
  }
  return null;
}

export function saveGiftAndSealRegistryIdb(
  patch: Partial<GiftAndSealRegistryCache>
): Promise<void> {
  registryIdbWriteChain = registryIdbWriteChain
    .then(async () => {
      const existing =
        (await idbGet<GiftAndSealRegistryCache>(STORE_STAGING, GIFT_SEAL_REGISTRY_CACHE_KEY)) ||
        ({ cachedAtMs: 0 } as GiftAndSealRegistryCache);

      const next: GiftAndSealRegistryCache = {
        ...existing,
        cachedAtMs: Date.now(),
      };

      if (patch.giftEvents !== undefined) {
        const incomingGiftTs = Number(patch.giftEventsUpdatedAtMs) || 0;
        const existingGiftTs = Number(existing.giftEventsUpdatedAtMs) || 0;
        if (incomingGiftTs >= existingGiftTs) {
          next.giftEvents = patch.giftEvents;
          if (patch.deletedGiftEventIds !== undefined) {
            next.deletedGiftEventIds = patch.deletedGiftEventIds;
          }
          if (patch.giftEventsInitialized !== undefined) {
            next.giftEventsInitialized = patch.giftEventsInitialized;
          }
          if (incomingGiftTs > 0) {
            next.giftEventsUpdatedAtMs = incomingGiftTs;
          }
        }
      }

      if (patch.defaultLetterSealConfig !== undefined) {
        const incomingSealTs = Number(patch.letterSealUpdatedAtMs) || 0;
        const existingSealTs = Number(existing.letterSealUpdatedAtMs) || 0;
        if (incomingSealTs >= existingSealTs) {
          next.defaultLetterSealConfig = patch.defaultLetterSealConfig;
          if (incomingSealTs > 0) {
            next.letterSealUpdatedAtMs = incomingSealTs;
          }
        }
      }

      await idbPut(STORE_STAGING, GIFT_SEAL_REGISTRY_CACHE_KEY, next);
    })
    .catch(() => {
      // abaikan jika IndexedDB dibatasi browser privat
    });
  return registryIdbWriteChain;
}

// ============================================================================
// ACTIVE BOOT SESSION ENVELOPE (INDEXEDDB — TAHAN REFRESH GOOGLE, OA & GUEST)
// ============================================================================
export interface FastBootSessionSnapshot {
  authMode: 'email_direct' | 'google' | 'oa_account' | 'guest' | 'standard_account';
  firebaseUid?: string;
  email: string;
  emailKey?: string;
  name: string;
  picture?: string;
  activeAccountId: string;
  isPinVerified: boolean;
  hasCompletedOnboarding: boolean;
  accountBackups: any[];
  deviceId?: string;
  verifiedAtMs?: number;
  savedAtMs: number;
}

const ACTIVE_BOOT_SESSION_KEY = 'active_boot_session_v1';
const DEVICE_LOBBY_GUEST_ID_KEY = 'device_lobby_guest_account_id_v1';
const DEVICE_LOBBY_CREATED_ACCOUNT_ID_KEY = 'device_lobby_created_account_id_v1';
const ADMIN_PERSISTENT_DATA_CACHE_KEY = 'admin_persistent_data_cache_v1';

let memoryActiveBootSession: FastBootSessionSnapshot | null = null;
let memoryDeviceLobbyGuestId: string | null = null;
let memoryDeviceLobbyCreatedAccountId: string | null = null;
let adminPersistentIdbChain: Promise<void> = Promise.resolve();

export interface AdminConfigCacheEntry {
  value: unknown;
  updatedAtMs: number;
  updatedAtIso?: string;
}

export interface AdminPersistentDataCache {
  supportFaqs?: any[];
  supportFaqsUpdatedAtMs?: number;
  supportContactConfig?: any;
  supportContactUpdatedAtMs?: number;
  banSupportConfig?: any;
  banSupportUpdatedAtMs?: number;
  banPresets?: any[];
  banPresetsUpdatedAtMs?: number;
  bankSettings?: any;
  bankSettingsUpdatedAtMs?: number;
  configs?: Record<string, AdminConfigCacheEntry>;
  deletedAdminItemIds?: Record<string, string[]>;
  adminConfigRevisionMap?: Record<string, number>;
  forceAuthoritativeOverwrite?: boolean;
  lastAdminSavedAtIso?: string;
  cachedAtMs: number;
}

export async function readAdminPersistentDataIdb(): Promise<AdminPersistentDataCache | null> {
  try {
    const cached = await idbGet<AdminPersistentDataCache>(
      STORE_STAGING,
      ADMIN_PERSISTENT_DATA_CACHE_KEY
    );
    if (cached && typeof cached === 'object') {
      return cached;
    }
  } catch {
    // fallback ke Cloud
  }
  return null;
}

export function saveAdminPersistentDataIdb(
  patch: Partial<AdminPersistentDataCache>
): Promise<void> {
  adminPersistentIdbChain = adminPersistentIdbChain
    .then(async () => {
      const existing =
        (await idbGet<AdminPersistentDataCache>(
          STORE_STAGING,
          ADMIN_PERSISTENT_DATA_CACHE_KEY
        )) || ({ cachedAtMs: 0 } as AdminPersistentDataCache);

      const nowMs = Date.now();
      const nextConfigs: Record<string, AdminConfigCacheEntry> = {
        ...(existing.configs || {}),
      };
      const forceOverwrite = Boolean(patch.forceAuthoritativeOverwrite);

      if (patch.configs && typeof patch.configs === 'object') {
        for (const [key, entry] of Object.entries(patch.configs)) {
          if (!entry || entry.value === undefined) continue;
          const incomingTs = Number(entry.updatedAtMs) || nowMs;
          const existingTs = Number(nextConfigs[key]?.updatedAtMs) || 0;
          if (forceOverwrite || incomingTs >= existingTs) {
            nextConfigs[key] = {
              value: entry.value,
              updatedAtMs: incomingTs,
              updatedAtIso: entry.updatedAtIso || new Date(incomingTs).toISOString(),
            };
          }
        }
      }

      const nextDeletedMap: Record<string, string[]> = {
        ...(existing.deletedAdminItemIds || {}),
      };
      if (patch.deletedAdminItemIds && typeof patch.deletedAdminItemIds === 'object') {
        for (const [k, arr] of Object.entries(patch.deletedAdminItemIds)) {
          if (Array.isArray(arr)) {
            const prevArr = Array.isArray(nextDeletedMap[k]) ? nextDeletedMap[k] : [];
            nextDeletedMap[k] = Array.from(new Set([...prevArr, ...arr.map(String)])).slice(-800);
          }
        }
      }

      const nextRevisionMap: Record<string, number> = {
        ...(existing.adminConfigRevisionMap || {}),
      };
      if (patch.adminConfigRevisionMap && typeof patch.adminConfigRevisionMap === 'object') {
        for (const [k, rev] of Object.entries(patch.adminConfigRevisionMap)) {
          const numRev = Number(rev) || 0;
          if (numRev > (Number(nextRevisionMap[k]) || 0)) {
            nextRevisionMap[k] = numRev;
          }
        }
      }

      const next: AdminPersistentDataCache = {
        ...existing,
        configs: nextConfigs,
        deletedAdminItemIds: nextDeletedMap,
        adminConfigRevisionMap: nextRevisionMap,
        cachedAtMs: nowMs,
        lastAdminSavedAtIso: patch.lastAdminSavedAtIso || existing.lastAdminSavedAtIso || new Date(nowMs).toISOString(),
      };

      if (patch.supportFaqs !== undefined) {
        const incomingTs = Number(patch.supportFaqsUpdatedAtMs) || nowMs;
        const existingTs = Number(existing.supportFaqsUpdatedAtMs) || 0;
        if (incomingTs >= existingTs) {
          next.supportFaqs = patch.supportFaqs;
          next.supportFaqsUpdatedAtMs = incomingTs;
        }
      }

      if (patch.supportContactConfig !== undefined) {
        const incomingTs = Number(patch.supportContactUpdatedAtMs) || nowMs;
        const existingTs = Number(existing.supportContactUpdatedAtMs) || 0;
        if (incomingTs >= existingTs) {
          next.supportContactConfig = patch.supportContactConfig;
          next.supportContactUpdatedAtMs = incomingTs;
        }
      }

      if (patch.banSupportConfig !== undefined) {
        const incomingTs = Number(patch.banSupportUpdatedAtMs) || nowMs;
        const existingTs = Number(existing.banSupportUpdatedAtMs) || 0;
        if (incomingTs >= existingTs) {
          next.banSupportConfig = patch.banSupportConfig;
          next.banSupportUpdatedAtMs = incomingTs;
        }
      }

      if (patch.banPresets !== undefined) {
        const incomingTs = Number(patch.banPresetsUpdatedAtMs) || nowMs;
        const existingTs = Number(existing.banPresetsUpdatedAtMs) || 0;
        if (incomingTs >= existingTs) {
          next.banPresets = patch.banPresets;
          next.banPresetsUpdatedAtMs = incomingTs;
        }
      }

      if (patch.bankSettings !== undefined) {
        const incomingTs = Number(patch.bankSettingsUpdatedAtMs) || nowMs;
        const existingTs = Number(existing.bankSettingsUpdatedAtMs) || 0;
        if (incomingTs >= existingTs) {
          next.bankSettings = patch.bankSettings;
          next.bankSettingsUpdatedAtMs = incomingTs;
        }
      }

      await idbPut(STORE_STAGING, ADMIN_PERSISTENT_DATA_CACHE_KEY, next);
    })
    .catch(() => {
      // abaikan jika IndexedDB dibatasi browser privat
    });
  return adminPersistentIdbChain;
}

export async function saveDeviceLobbyGuestId(accountId: string): Promise<void> {
  memoryDeviceLobbyGuestId = accountId;
  try {
    await idbPut(STORE_STAGING, DEVICE_LOBBY_GUEST_ID_KEY, {
      accountId,
      savedAtMs: Date.now(),
    });
  } catch {
    // abaikan jika IndexedDB dibatasi browser privat
  }
}

export async function readDeviceLobbyGuestId(): Promise<string | null> {
  if (memoryDeviceLobbyGuestId) return memoryDeviceLobbyGuestId;
  try {
    const stored = await idbGet<{ accountId?: string }>(STORE_STAGING, DEVICE_LOBBY_GUEST_ID_KEY);
    if (stored && typeof stored.accountId === 'string' && stored.accountId.trim()) {
      memoryDeviceLobbyGuestId = stored.accountId.trim();
      return memoryDeviceLobbyGuestId;
    }
  } catch {
    // abaikan jika IndexedDB dibatasi browser privat
  }
  return null;
}

export async function saveDeviceLobbyCreatedAccountId(accountId: string): Promise<void> {
  memoryDeviceLobbyCreatedAccountId = accountId;
  try {
    await idbPut(STORE_STAGING, DEVICE_LOBBY_CREATED_ACCOUNT_ID_KEY, {
      accountId,
      savedAtMs: Date.now(),
    });
  } catch {
    // abaikan jika IndexedDB dibatasi browser privat
  }
}

export async function readDeviceLobbyCreatedAccountId(): Promise<string | null> {
  if (memoryDeviceLobbyCreatedAccountId) return memoryDeviceLobbyCreatedAccountId;
  try {
    const stored = await idbGet<{ accountId?: string }>(
      STORE_STAGING,
      DEVICE_LOBBY_CREATED_ACCOUNT_ID_KEY
    );
    if (stored && typeof stored.accountId === 'string' && stored.accountId.trim()) {
      memoryDeviceLobbyCreatedAccountId = stored.accountId.trim();
      return memoryDeviceLobbyCreatedAccountId;
    }
  } catch {
    // abaikan jika IndexedDB dibatasi browser privat
  }
  return null;
}

let activeSessionIdbChain: Promise<void> = Promise.resolve();
let activeSessionWriteSeq = 0;

export function getActiveBootSessionWriteSeq(): number {
  return activeSessionWriteSeq;
}

function writeCompactSessionMirrorLs(session: FastBootSessionSnapshot): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const compact: FastBootSessionSnapshot = {
        authMode: session.authMode,
        firebaseUid: session.firebaseUid,
        email: session.email,
        emailKey: session.emailKey,
        name: session.name,
        picture: session.picture,
        activeAccountId: session.activeAccountId,
        isPinVerified: session.isPinVerified,
        hasCompletedOnboarding: session.hasCompletedOnboarding,
        accountBackups: Array.isArray(session.accountBackups)
          ? session.accountBackups.filter((a) => a && a.id === session.activeAccountId).slice(0, 1)
          : [],
        deviceId: session.deviceId,
        verifiedAtMs: session.verifiedAtMs,
        savedAtMs: session.savedAtMs,
      };
      window.localStorage.setItem(ACTIVE_BOOT_SESSION_LS_KEY, JSON.stringify(compact));
    }
  } catch {
    // abaikan quota/restriction browser
  }
}

function readCompactSessionMirrorLs(): FastBootSessionSnapshot | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(ACTIVE_BOOT_SESSION_LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FastBootSessionSnapshot;
        if (parsed && parsed.activeAccountId && parsed.authMode) {
          return parsed;
        }
      }
    }
  } catch {
    // abaikan
  }
  return null;
}

function clearCompactSessionMirrorLs(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(ACTIVE_BOOT_SESSION_LS_KEY);
    }
  } catch {
    // abaikan
  }
}

export async function saveActiveBootSession(
  session: FastBootSessionSnapshot,
  expectedSeq?: number
): Promise<void> {
  if (typeof expectedSeq === 'number' && expectedSeq !== activeSessionWriteSeq) {
    return;
  }
  const writeSeq = typeof expectedSeq === 'number' ? expectedSeq : ++activeSessionWriteSeq;
  memoryActiveBootSession = session;
  writeCompactSessionMirrorLs(session);
  activeSessionIdbChain = activeSessionIdbChain
    .then(async () => {
      if (writeSeq !== activeSessionWriteSeq) return;
      await idbPut(STORE_STAGING, ACTIVE_BOOT_SESSION_KEY, session);
    })
    .catch(() => {
      // abaikan jika IndexedDB dibatasi browser privat
    });
  return activeSessionIdbChain;
}

export async function readActiveBootSession(): Promise<FastBootSessionSnapshot | null> {
  if (memoryActiveBootSession) {
    return memoryActiveBootSession;
  }
  try {
    const stored = await idbGet<FastBootSessionSnapshot>(STORE_STAGING, ACTIVE_BOOT_SESSION_KEY);
    if (stored && stored.activeAccountId && stored.authMode) {
      memoryActiveBootSession = stored;
      writeCompactSessionMirrorLs(stored);
      return stored;
    }
  } catch {
    // fallback ke mirror lokal
  }
  const lsMirror = readCompactSessionMirrorLs();
  if (lsMirror) {
    memoryActiveBootSession = lsMirror;
    return lsMirror;
  }
  return null;
}

export async function clearActiveBootSession(): Promise<void> {
  const clearSeq = ++activeSessionWriteSeq;
  memoryActiveBootSession = null;
  clearCompactSessionMirrorLs();
  activeSessionIdbChain = activeSessionIdbChain
    .then(async () => {
      if (clearSeq !== activeSessionWriteSeq) return;
      await idbDelete(STORE_STAGING, ACTIVE_BOOT_SESSION_KEY);
    })
    .catch(() => {
      // abaikan error cleanup
    });
  return activeSessionIdbChain;
}

// ============================================================================
// TELEMETRY STORE & 4-STATE LIVE EMITTER
// ============================================================================
type TelemetryListener = (state: SyncTelemetryState) => void;

const telemetryListeners = new Set<TelemetryListener>();
let telemetryState: SyncTelemetryState = {
  status: typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced',
  fromCache: false,
  hasPendingWrites: false,
  pendingWritesCount: 0,
  lastSyncedAt: null,
  syncVersion: 1,
  syncedDocCount: 0,
  deviceId: 'initializing...',
  engineMode: getActiveCloudEngineLabel(),
  indexedDbActive: isIndexedDbPersistenceEnabled(),
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastError: null,
};

function computeTelemetryStatus(next: {
  isOnline: boolean;
  hasPendingWrites: boolean;
  pendingWritesCount: number;
  lastError: string | null;
}): SyncTelemetryStatus {
  if (!next.isOnline) return 'offline';
  if (next.lastError) return 'error';
  if (next.hasPendingWrites || next.pendingWritesCount > 0) return 'syncing';
  return 'synced';
}

export function updateSyncTelemetry(partial: Partial<SyncTelemetryState>): SyncTelemetryState {
  const merged = {
    ...telemetryState,
    ...partial,
    engineMode: getActiveCloudEngineLabel(),
    indexedDbActive: isIndexedDbPersistenceEnabled(),
  };
  merged.status = computeTelemetryStatus({
    isOnline: merged.isOnline,
    hasPendingWrites: merged.hasPendingWrites,
    pendingWritesCount: merged.pendingWritesCount,
    lastError: merged.lastError,
  });
  telemetryState = merged;
  telemetryListeners.forEach((cb) => {
    try {
      cb(telemetryState);
    } catch {
      // isolasi error subscriber UI
    }
  });
  return telemetryState;
}

export function getSyncTelemetrySnapshot(): SyncTelemetryState {
  return telemetryState;
}

export function subscribeSyncTelemetry(listener: TelemetryListener): () => void {
  telemetryListeners.add(listener);
  listener(telemetryState);
  return () => {
    telemetryListeners.delete(listener);
  };
}

// Inisialisasi Device ID persisten & event jaringan browser
if (typeof window !== 'undefined') {
  void getOrCreatePersistentDeviceId().then((id) => {
    updateSyncTelemetry({ deviceId: id });
  });

  window.addEventListener('online', () => {
    updateSyncTelemetry({
      isOnline: true,
      lastError: null,
      hasPendingWrites: telemetryState.pendingWritesCount > 0,
    });
  });

  window.addEventListener('offline', () => {
    updateSyncTelemetry({
      isOnline: false,
      fromCache: true,
    });
  });
}

// ============================================================================
// ATOMIC CONCURRENCY WRITER (runTransaction + RTDB Version Guard)
// ============================================================================
let activePendingWrites = 0;

export async function writeVaultStateAtomic<T extends Record<string, unknown>>(
  uid: string,
  payload: T,
  docCountHint?: number
): Promise<{ ok: boolean; syncVersion: number; error?: string }> {
  if (!uid) {
    return { ok: false, syncVersion: telemetryState.syncVersion, error: 'UID tidak ditemukan.' };
  }

  const deviceId = await getOrCreatePersistentDeviceId();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  activePendingWrites += 1;
  updateSyncTelemetry({
    deviceId,
    hasPendingWrites: true,
    pendingWritesCount: activePendingWrites,
    lastError: null,
    ...(typeof docCountHint === 'number' ? { syncedDocCount: docCountHint } : {}),
  });

  try {
    // 1. Baca versi saat ini dari Cloud Vault untuk inkremen deterministik syncVersion (+1)
    const existingEnvelope = await readUidVaultDoc<VaultDocumentEnvelope<T>>(
      uid,
      'vault_state',
      'primary'
    );
    const nextVersion = Math.max(
      (existingEnvelope?.syncVersion || 0) + 1,
      telemetryState.syncVersion + 1
    );
    const preservedCreatedMs = existingEnvelope?.createdAtMs || nowMs;
    const preservedCreatedIso = existingEnvelope?.createdAtIso || nowIso;

    const cleanPayload = sanitizeForRealtimeDb(payload) as T;
    const envelope: VaultDocumentEnvelope<T> = {
      ownerUid: uid,
      createdAtMs: preservedCreatedMs,
      createdAtIso: preservedCreatedIso,
      updatedAtMs: nowMs,
      updatedAtIso: nowIso,
      syncVersion: nextVersion,
      lastDeviceId: deviceId,
      payload: cleanPayload,
    };

    // 2. Simpan offline copy ke IndexedDB staging agar aman walau koneksi putus total
    await idbPut(STORE_STAGING, `vault_cache_${uid}`, envelope);

    // 3. Jika sedang offline, tahan di IndexedDB dan beri status offline (auto-upload saat online)
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      activePendingWrites = Math.max(0, activePendingWrites - 1);
      updateSyncTelemetry({
        isOnline: false,
        fromCache: true,
        hasPendingWrites: true,
        pendingWritesCount: Math.max(1, activePendingWrites),
        syncVersion: nextVersion,
      });
      return { ok: true, syncVersion: nextVersion };
    }

    // 4. Tulis ke Realtime Database azkaakc (primary live sync)
    const rtdbOk = await writeUidVaultDoc(
      uid,
      'vault_state',
      'primary',
      envelope as unknown as Record<string, unknown>,
      { merge: false }
    );

    // 5. Jalankan Firestore runTransaction atomik apabila Firestore aktif di azkaakc
    if (isFirestoreActive()) {
      try {
        const fsRef = doc(db, 'users', uid, 'vault_state', 'primary');
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(fsRef);
          const prevData = snap.exists() ? snap.data() : null;
          const prevVersion = typeof prevData?.syncVersion === 'number' ? prevData.syncVersion : 0;
          const txNextVersion = Math.max(prevVersion + 1, nextVersion);
          tx.set(
            fsRef,
            {
              ownerUid: uid,
              createdAt: prevData?.createdAt ?? serverTimestamp(),
              updatedAt: serverTimestamp(),
              createdAtMs: preservedCreatedMs,
              updatedAtMs: nowMs,
              createdAtIso: preservedCreatedIso,
              updatedAtIso: nowIso,
              syncVersion: txNextVersion,
              lastDeviceId: deviceId,
              payload: cleanPayload,
            },
            { merge: false }
          );
        });
      } catch (fsErr) {
        markFirestoreUnavailableIfMissing(fsErr);
      }
    }

    activePendingWrites = Math.max(0, activePendingWrites - 1);
    if (!rtdbOk) {
      updateSyncTelemetry({
        hasPendingWrites: activePendingWrites > 0,
        pendingWritesCount: activePendingWrites,
        lastError: 'Gagal mengunggah perubahan ke server cloud azkaakc.',
      });
      return {
        ok: false,
        syncVersion: nextVersion,
        error: 'Gagal menulis ke Firebase Cloud. Perubahan tetap aman di cache lokal.',
      };
    }

    updateSyncTelemetry({
      fromCache: false,
      hasPendingWrites: activePendingWrites > 0,
      pendingWritesCount: activePendingWrites,
      lastSyncedAt: nowIso,
      syncVersion: nextVersion,
      lastError: null,
      ...(typeof docCountHint === 'number' ? { syncedDocCount: docCountHint } : {}),
    });

    return { ok: true, syncVersion: nextVersion };
  } catch (err) {
    activePendingWrites = Math.max(0, activePendingWrites - 1);
    const msg = err instanceof Error ? err.message : 'Gangguan sinkronisasi cloud.';
    updateSyncTelemetry({
      hasPendingWrites: activePendingWrites > 0,
      pendingWritesCount: activePendingWrites,
      lastError: msg,
    });
    return { ok: false, syncVersion: telemetryState.syncVersion, error: msg };
  }
}

export async function readVaultStateWithOfflineFallback<T = Record<string, unknown>>(
  uid: string
): Promise<VaultDocumentEnvelope<T> | null> {
  if (!uid) return null;
  const cloud = await readUidVaultDoc<VaultDocumentEnvelope<T>>(uid, 'vault_state', 'primary');
  if (cloud) {
    updateSyncTelemetry({
      syncVersion: Math.max(telemetryState.syncVersion, cloud.syncVersion || 1),
      lastSyncedAt: cloud.updatedAtIso || new Date().toISOString(),
      fromCache: false,
      lastError: null,
    });
    return cloud;
  }
  const cached = await idbGet<VaultDocumentEnvelope<T>>(STORE_STAGING, `vault_cache_${uid}`);
  if (cached) {
    updateSyncTelemetry({
      fromCache: true,
      syncVersion: Math.max(telemetryState.syncVersion, cached.syncVersion || 1),
    });
  }
  return cached;
}

// ============================================================================
// REAL-TIME BIDIRECTIONAL STREAMING (onSnapshot includeMetadataChanges + RTDB)
// ============================================================================
export function subscribeVaultStateStream<T = Record<string, unknown>>(
  uid: string,
  onEnvelope: (envelope: VaultDocumentEnvelope<T>) => void
): () => void {
  if (!uid) return () => {};

  const unsubRtdb = subscribeCloudDoc<VaultDocumentEnvelope<T>>(
    `users/${uid}/vault_state`,
    'primary',
    (data, meta) => {
      if (data && data.ownerUid === uid) {
        updateSyncTelemetry({
          fromCache: meta.fromCache,
          hasPendingWrites: Boolean(meta.hasPendingWrites),
          syncVersion: Math.max(telemetryState.syncVersion, data.syncVersion || 1),
          lastSyncedAt: data.updatedAtIso || new Date().toISOString(),
          lastError: null,
        });
        onEnvelope(data);
      }
    },
    (err) => {
      updateSyncTelemetry({
        lastError: err instanceof Error ? err.message : 'Gagal terhubung ke stream sinkronisasi.',
      });
    }
  );

  let unsubFirestore: (() => void) | null = null;
  if (isFirestoreActive()) {
    try {
      const fsRef = doc(db, 'users', uid, 'vault_state', 'primary');
      unsubFirestore = onSnapshot(
        fsRef,
        { includeMetadataChanges: true },
        (snap) => {
          const fromCache = snap.metadata.fromCache;
          const hasPendingWrites = snap.metadata.hasPendingWrites;
          if (snap.exists()) {
            const data = snap.data() as VaultDocumentEnvelope<T>;
            updateSyncTelemetry({
              fromCache,
              hasPendingWrites,
              pendingWritesCount: hasPendingWrites ? Math.max(1, activePendingWrites) : activePendingWrites,
              syncVersion: Math.max(telemetryState.syncVersion, data.syncVersion || 1),
              lastSyncedAt: fromCache ? telemetryState.lastSyncedAt : new Date().toISOString(),
              lastError: null,
            });
            onEnvelope(data);
          }
        },
        (err) => {
          markFirestoreUnavailableIfMissing(err);
        }
      );
    } catch {
      // RTDB tetap aktif 100%
    }
  }

  return () => {
    unsubRtdb();
    if (unsubFirestore) unsubFirestore();
  };
}

// ============================================================================
// FORCE SYNC & CONNECTION RECOVERY
// ============================================================================
export async function forceSyncVaultNow<T extends Record<string, unknown>>(
  uid: string | null,
  payload?: T,
  docCountHint?: number
): Promise<{ success: boolean; message: string; syncedAt?: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    updateSyncTelemetry({ isOnline: false, fromCache: true });
    return {
      success: false,
      message: 'Perangkat sedang offline. Seluruh perubahan tersimpan aman di IndexedDB dan akan otomatis terunggah begitu online.',
    };
  }

  updateSyncTelemetry({ hasPendingWrites: true, pendingWritesCount: Math.max(1, activePendingWrites), lastError: null });
  const connected = await testConnection();
  if (!connected) {
    updateSyncTelemetry({
      hasPendingWrites: false,
      pendingWritesCount: 0,
      lastError: 'Server Firebase azkaakc tidak merespons. Periksa koneksi internet Anda.',
    });
    return {
      success: false,
      message: 'Gagal menjangkau server Firebase azkaakc. Silakan coba lagi beberapa saat.',
    };
  }

  if (uid && payload) {
    const res = await writeVaultStateAtomic(uid, payload, docCountHint);
    if (!res.ok) {
      return { success: false, message: res.error || 'Gagal menyinkronkan Vault.' };
    }
  }

  const nowIso = new Date().toISOString();
  updateSyncTelemetry({
    isOnline: true,
    fromCache: false,
    hasPendingWrites: false,
    pendingWritesCount: 0,
    lastSyncedAt: nowIso,
    lastError: null,
    ...(typeof docCountHint === 'number' ? { syncedDocCount: docCountHint } : {}),
  });

  return {
    success: true,
    syncedAt: nowIso,
    message: `Sinkronisasi cloud terverifikasi pada ${new Date(nowIso).toLocaleTimeString('id-ID')}.`,
  };
}

// ============================================================================
// LAST SEEN UPDATE TRACKER (IndexedDB — untuk titik penanda BARU di tab Update)
// ============================================================================
const LAST_SEEN_UPDATE_KEY = 'last_seen_app_update_id_v1';

export async function readLastSeenUpdateId(): Promise<string | null> {
  try {
    const val = await idbGet<string>(STORE_META, LAST_SEEN_UPDATE_KEY);
    return typeof val === 'string' && val.length > 0 ? val : null;
  } catch {
    return null;
  }
}

export async function saveLastSeenUpdateId(updateId: string): Promise<void> {
  if (!updateId) return;
  try {
    await idbPut(STORE_META, LAST_SEEN_UPDATE_KEY, updateId);
  } catch {
    // non-fatal
  }
}
