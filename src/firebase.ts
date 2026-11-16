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

const firebaseInitOptions = {
  apiKey: FIREBASE_CLOUD_CONFIG.apiKey,
  authDomain: FIREBASE_CLOUD_CONFIG.authDomain,
  projectId: FIREBASE_CLOUD_CONFIG.projectId,
  storageBucket: FIREBASE_CLOUD_CONFIG.storageBucket,
  messagingSenderId: FIREBASE_CLOUD_CONFIG.messagingSenderId,
  appId: FIREBASE_CLOUD_CONFIG.appId,
  ...(FIREBASE_CLOUD_CONFIG.measurementId ? { measurementId: FIREBASE_CLOUD_CONFIG.measurementId } : {}),
};

export const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseInitOptions);

export const db = getFirestore(firebaseApp, FIREBASE_CLOUD_CONFIG.firestoreDatabaseId);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export { signInWithPopup, signOut, onAuthStateChanged };
export type { FirebaseUser };

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
        message: `Domain "${host}" belum terdaftar di Firebase Console Authorized Domains. Pastikan "${host}" dan "atm-akc.vercel.app" sudah ditambahkan di Firebase Console → Authentication → Settings → Authorized domains.`,
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
