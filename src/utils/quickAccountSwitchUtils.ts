/**
 * Utilitas Ganti Akun Cepat (Maksimal 5 Akun Terverifikasi Terakhir)
 * & Snapshot Sesi Kembali Sementara untuk Tombol "Kembali" di Pojok Kiri Atas Lobi.
 *
 * Keamanan & Privasi:
 * - Hanya menyimpan metadata ringkas (Nama, Tier Kartu, 4 digit terakhir rekening).
 * - TIDAK PERNAH menyimpan nomor rekening lengkap maupun kode PIN.
 * - Snapshot sesi kembali hanya aktif saat pengguna memilih "Ganti Akun -> Masuk Akun Lain"
 *   dan dibersihkan total saat pengguna menekan "Keluar Akun" secara normal.
 */
import { BankAccount, CardTier, GoogleUserSession } from '../types/bank';

export interface SavedQuickSwitchAccount {
  accountId: string;
  fullName: string;
  cardTier: CardTier;
  accountLast4: string;
  authMode: NonNullable<GoogleUserSession['authMode']>;
  email: string;
  emailKey?: string;
  firebaseUid?: string;
  picture?: string;
  isOfficialAdminAccount?: boolean;
  isGuestAccount?: boolean;
  lastUsedAt: string;
}

export interface QuickSwitchReturnSnapshot {
  accountId: string;
  fullName: string;
  cardTier: CardTier;
  accountLast4: string;
  googleSession: GoogleUserSession;
  activeCloudEmail: string | null;
  createdAt: string;
}

const SAVED_ACCOUNTS_KEY = 'bn_quick_switch_accounts_v1';
const RETURN_SNAPSHOT_KEY = 'bn_quick_switch_return_snapshot_v1';
const SAVED_ACCOUNTS_EVENT = 'bn:quick-switch-accounts-updated';
const RETURN_SNAPSHOT_EVENT = 'bn:quick-switch-return-updated';
export const MAX_QUICK_SWITCH_ACCOUNTS = 5;

export function extractAccountLast4(accountNumber?: string | null): string {
  const digits = String(accountNumber || '').replace(/\D/g, '');
  if (digits.length >= 4) return digits.slice(-4);
  if (digits.length > 0) return digits.padStart(4, '0');
  return '0000';
}

export function loadQuickSwitchAccounts(): SavedQuickSwitchAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is SavedQuickSwitchAccount =>
          Boolean(item && typeof item === 'object' && typeof item.accountId === 'string' && item.accountId)
      )
      .slice(0, MAX_QUICK_SWITCH_ACCOUNTS);
  } catch {
    return [];
  }
}

function writeQuickSwitchAccounts(list: SavedQuickSwitchAccount[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      SAVED_ACCOUNTS_KEY,
      JSON.stringify(list.slice(0, MAX_QUICK_SWITCH_ACCOUNTS))
    );
    window.dispatchEvent(new CustomEvent(SAVED_ACCOUNTS_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function recordVerifiedQuickSwitchAccount(
  account: BankAccount,
  session?: Partial<GoogleUserSession> | null
): SavedQuickSwitchAccount[] {
  if (!account?.id) return loadQuickSwitchAccounts();

  const resolvedAuthMode: NonNullable<GoogleUserSession['authMode']> =
    session?.authMode ||
    (account.isOfficialAdminAccount
      ? 'oa_account'
      : account.isGuestAccount
      ? 'guest'
      : account.googleEmail && !account.googleEmail.endsWith('@guest.banknusantara.local')
      ? 'google'
      : 'standard_account');

  const entry: SavedQuickSwitchAccount = {
    accountId: account.id,
    fullName: account.fullName || session?.name || 'Nasabah Bank Nusantara',
    cardTier: account.cardTier || 'regular',
    accountLast4: extractAccountLast4(account.accountNumber),
    authMode: resolvedAuthMode,
    email:
      session?.email ||
      account.googleEmail ||
      account.email ||
      `${account.id}@nasabah.banknusantara.local`,
    emailKey: session?.emailKey,
    firebaseUid: session?.firebaseUid || account.firebaseUid,
    picture: session?.picture,
    isOfficialAdminAccount: Boolean(account.isOfficialAdminAccount),
    isGuestAccount: Boolean(account.isGuestAccount),
    lastUsedAt: new Date().toISOString(),
  };

  const existing = loadQuickSwitchAccounts().filter((item) => item.accountId !== entry.accountId);
  const next = [entry, ...existing].slice(0, MAX_QUICK_SWITCH_ACCOUNTS);
  writeQuickSwitchAccounts(next);
  return next;
}

export function removeQuickSwitchAccount(accountId: string): SavedQuickSwitchAccount[] {
  const next = loadQuickSwitchAccounts().filter((item) => item.accountId !== accountId);
  writeQuickSwitchAccounts(next);
  return next;
}

export function subscribeQuickSwitchAccounts(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onUpdate = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === SAVED_ACCOUNTS_KEY) cb();
  };
  window.addEventListener(SAVED_ACCOUNTS_EVENT, onUpdate);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(SAVED_ACCOUNTS_EVENT, onUpdate);
    window.removeEventListener('storage', onStorage);
  };
}

// ============================================================================
// SNAPSHOT KEMBALI KE AKUN SEBELUMNYA (HANYA SAAT MODE GANTI AKUN -> MASUK AKUN LAIN)
// ============================================================================

export function saveQuickSwitchReturnSnapshot(snapshot: QuickSwitchReturnSnapshot) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(RETURN_SNAPSHOT_KEY, JSON.stringify(snapshot));
    window.dispatchEvent(new CustomEvent(RETURN_SNAPSHOT_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function loadQuickSwitchReturnSnapshot(): QuickSwitchReturnSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(RETURN_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.accountId !== 'string') {
      return null;
    }
    return parsed as QuickSwitchReturnSnapshot;
  } catch {
    return null;
  }
}

export function clearQuickSwitchReturnSnapshot() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(RETURN_SNAPSHOT_KEY);
    window.dispatchEvent(new CustomEvent(RETURN_SNAPSHOT_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function subscribeQuickSwitchReturnSnapshot(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onUpdate = () => cb();
  window.addEventListener(RETURN_SNAPSHOT_EVENT, onUpdate);
  return () => {
    window.removeEventListener(RETURN_SNAPSHOT_EVENT, onUpdate);
  };
}
