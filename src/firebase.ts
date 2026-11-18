import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import { FIREBASE_CLOUD_CONFIG } from './config/firebaseCloudConfig';

// ==========================================
// KONFIGURASI FIREBASE PROJECT: azkaakc
// App ID: 1:1070517785090:web:158d14b8bf1975b5138d1b
// ==========================================
export const firebaseConfig = {
  apiKey: FIREBASE_CLOUD_CONFIG.apiKey,
  authDomain: FIREBASE_CLOUD_CONFIG.authDomain,
  projectId: FIREBASE_CLOUD_CONFIG.projectId,
  storageBucket: FIREBASE_CLOUD_CONFIG.storageBucket,
  messagingSenderId: FIREBASE_CLOUD_CONFIG.messagingSenderId,
  appId: FIREBASE_CLOUD_CONFIG.appId,
};

// Inisialisasi Firebase
export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Gunakan Cloud Firestore database default pada project azkaakc
export const db =
  !FIREBASE_CLOUD_CONFIG.firestoreDatabaseId ||
  FIREBASE_CLOUD_CONFIG.firestoreDatabaseId === '(default)'
    ? getFirestore(firebaseApp)
    : getFirestore(firebaseApp, FIREBASE_CLOUD_CONFIG.firestoreDatabaseId);

export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };

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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (!options?.suppressThrow) {
    throw new Error(JSON.stringify(errInfo));
  }
}

export async function signInWithGooglePopup(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  errorCode?: string;
  message: string;
}> {
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
    if (code === 'auth/unauthorized-domain') {
      return {
        success: false,
        errorCode: code,
        message: `Domain "${host}" belum terdaftar di Firebase Console Authorized Domains (Project: azkaakc). Pastikan "${host}" sudah ditambahkan di Firebase Console → Authentication → Settings → Authorized domains.`,
      };
    }
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        errorCode: code,
        message: 'Jendela login Google ditutup sebelum proses selesai. Silakan klik tombol Sign in with Google lagi.',
      };
    }
    if (code === 'auth/popup-blocked') {
      return {
        success: false,
        errorCode: code,
        message: 'Browser memblokir popup login Google. Izinkan pop-up untuk situs ini lalu coba lagi.',
      };
    }
    return {
      success: false,
      errorCode: code,
      message: err instanceof Error ? err.message : 'Gagal masuk dengan Google. Periksa koneksi internet atau konfigurasi Firebase Anda.',
    };
  }
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

if (typeof window !== 'undefined') {
  void testConnection();
}
