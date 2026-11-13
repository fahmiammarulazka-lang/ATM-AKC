/**
 * Bank Nusantara Layer 3 Persistence: Penyimpanan HP / Device Storage
 * Menggabungkan IndexedDB berkapasitas besar (tahan hingga ratusan MB di HP Android/iOS)
 * dengan sinkronisasi localStorage dan Persistent Storage API agar data nasabah tidak hilang.
 */

const IDB_NAME = 'bank_nusantara_device_db';
const IDB_VERSION = 1;
const IDB_STORE = 'bank_vault';
const FULL_SNAPSHOT_KEY = 'full_snapshot_v1';
export const DEVICE_FULL_SNAPSHOT_LS_KEY = 'bank_nusantara_full_snapshot_ls_v1';

export interface BankPersistableSnapshot {
  version: number;
  updatedAtMs: number;
  currentAccountId: string;
  googleUser: unknown;
  accounts: unknown[];
  transactions: unknown[];
  goldMarketConfig: unknown;
  userSettings: unknown;
  pockets: unknown[];
  depositos: unknown[];
  loans: unknown[];
  scheduledPayments: unknown[];
  favorites: unknown[];
  notifications: unknown[];
  cardlessTokens: unknown[];
  cardUpgrades: unknown[];
  pinResetRequests: unknown[];
  redeemCodes: unknown[];
  purchasedCodes: unknown[];
  resiList: unknown[];
  chats: unknown[];
  spinWheelConfig: unknown;
  spinHistory: unknown[];
  sultanEmpireConfig: unknown;
  featureConfigs: unknown[];
  deletedFeatureIds: string[];
  adminHelpRequests: unknown[];
  appUpdates: unknown[];
  budgetCategories: unknown[];
  manualExpenses: unknown[];
  budgetTxCategoryMap: Record<string, string>;
  budgetAlertHistory: string[];
  websitePopups: unknown[];
  dismissedPopupIds: string[];
  globalChats: unknown[];
  bugReports: unknown[];
  adminUnlocked: boolean;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;
let persistenceRequested = false;

export async function requestPersistentDeviceStorage(): Promise<boolean> {
  if (persistenceRequested || typeof navigator === 'undefined') return false;
  persistenceRequested = true;
  try {
    if (navigator.storage && typeof navigator.storage.persist === 'function') {
      return await navigator.storage.persist();
    }
  } catch {
    // ignore if unsupported in sandboxed iframe
  }
  return false;
}

function openDeviceDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const database = req.result;
        if (!database.objectStoreNames.contains(IDB_STORE)) {
          database.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  const database = await openDeviceDB();
  if (!database) return null;
  return new Promise((resolve) => {
    try {
      const tx = database.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: unknown): Promise<boolean> {
  const database = await openDeviceDB();
  if (!database) return false;
  return new Promise((resolve) => {
    try {
      const tx = database.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(value, key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function saveSnapshotToDeviceStorage(
  snapshot: BankPersistableSnapshot,
  scopeEmail?: string
): Promise<void> {
  void requestPersistentDeviceStorage();

  // 1. IndexedDB (High-capacity HP/Browser storage)
  await idbSet(FULL_SNAPSHOT_KEY, snapshot);
  if (scopeEmail) {
    await idbSet(`scope:${scopeEmail.trim().toLowerCase()}`, snapshot);
  }

  // 2. Fast localStorage mirror (best effort)
  try {
    localStorage.setItem(DEVICE_FULL_SNAPSHOT_LS_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota exceeded on tiny localStorage; IndexedDB still safely holds complete data
  }
}

export async function loadSnapshotFromDeviceStorage(
  scopeEmail?: string
): Promise<BankPersistableSnapshot | null> {
  if (scopeEmail) {
    const scoped = await idbGet<BankPersistableSnapshot>(`scope:${scopeEmail.trim().toLowerCase()}`);
    if (scoped && typeof scoped.updatedAtMs === 'number') {
      return scoped;
    }
  }

  const fromIdb = await idbGet<BankPersistableSnapshot>(FULL_SNAPSHOT_KEY);
  if (fromIdb && typeof fromIdb.updatedAtMs === 'number') {
    return fromIdb;
  }

  try {
    const raw = localStorage.getItem(DEVICE_FULL_SNAPSHOT_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as BankPersistableSnapshot;
      if (parsed && typeof parsed.updatedAtMs === 'number') {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function clearDeviceSnapshotStorage(): Promise<void> {
  const database = await openDeviceDB();
  if (database) {
    await new Promise<void>((resolve) => {
      try {
        const tx = database.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  try {
    localStorage.removeItem(DEVICE_FULL_SNAPSHOT_LS_KEY);
  } catch {
    // ignore
  }
}
