/**
 * KONFIGURASI CLOUD FIREBASE KHUSUS (BANK NUSANTARA)
 * ---------------------------------------------------------------------------
 * File konfigurasi khusus agar Anda dapat dengan mudah mengganti API Key,
 * Auth Domain, Project ID, dan Firestore Database ID di satu tempat.
 *
 * Catatan Authorized Domains Firebase Auth:
 * Pastikan domain production "atm-akc.vercel.app" (beserta domain preview Anda)
 * sudah terdaftar di Firebase Console -> Authentication -> Settings -> Authorized domains.
 */
import defaultAppletConfig from '../../firebase-applet-config.json';

export interface FirebaseCloudConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  /** Daftar domain resmi aplikasi untuk login Google Auth */
  authorizedDomains: string[];
}

export const FIREBASE_CLOUD_CONFIG: FirebaseCloudConfig = {
  // Anda dapat mengisi / mengganti konfigurasi Firebase Anda sendiri di bawah ini:
  apiKey: defaultAppletConfig.apiKey,
  authDomain: defaultAppletConfig.authDomain,
  projectId: defaultAppletConfig.projectId,
  firestoreDatabaseId: defaultAppletConfig.firestoreDatabaseId,
  storageBucket: defaultAppletConfig.storageBucket,
  messagingSenderId: defaultAppletConfig.messagingSenderId,
  appId: defaultAppletConfig.appId,
  measurementId: defaultAppletConfig.measurementId || '',
  authorizedDomains: [
    'atm-akc.vercel.app',
    'localhost',
    '127.0.0.1',
  ],
};
