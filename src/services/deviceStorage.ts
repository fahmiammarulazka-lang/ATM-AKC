/**
 * Bank Nusantara Cloud-Only Storage Cleanup Utility
 * Seluruh penggunaan localStorage dan IndexedDB lokal untuk menyimpan data utama telah DIHAPUS 100%.
 * Semua data aplikasi (termasuk Akun Google, Akun OA, Akun Guest, Transaksi, Aset, dan Pengaturan)
 * kini langsung disimpan dan disinkronkan secara real-time di Firebase Cloud Firestore (Project: azkaakc)
 * menggunakan onSnapshot lintas perangkat (Laptop & HP).
 */

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
  deletedAccountIds?: string[];
  accountDeletionRequests?: unknown[];
  giftEvents?: unknown[];
  deletedGiftEventIds?: string[];
  giftEventsInitialized?: boolean;
  banSupportConfig?: unknown;
  defaultLetterSealConfig?: unknown;
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

/**
 * Menghapus bersih seluruh sisa key localStorage & sessionStorage lama dari perangkat
 * agar aplikasi 100% hanya menggunakan data real-time dari Firebase Cloud Firestore.
 */
export function wipeLegacyBrowserStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('bank_nusantara_')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    // ignore
  }
  try {
    const sKeysToRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith('bank_nusantara_')) {
        sKeysToRemove.push(k);
      }
    }
    sKeysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * No-op: Akun Guest tidak lagi menggunakan localStorage, melainkan langsung tersimpan di Firebase Firestore.
 */
export function loadGuestAccountsFromLocalStorage<T>(): T[] {
  wipeLegacyBrowserStorage();
  return [];
}

/**
 * No-op: Akun Guest tidak lagi disimpan ke localStorage, melainkan langsung tersimpan di Firebase Firestore.
 */
export function saveGuestAccountsToLocalStorage<T>(_guestAccounts: T[]): void {
  wipeLegacyBrowserStorage();
}

export async function clearDeviceSnapshotStorage(): Promise<void> {
  wipeLegacyBrowserStorage();
  if (typeof window !== 'undefined' && 'indexedDB' in window) {
    try {
      window.indexedDB.deleteDatabase('bank_nusantara_device_db');
    } catch {
      // ignore
    }
  }
}
