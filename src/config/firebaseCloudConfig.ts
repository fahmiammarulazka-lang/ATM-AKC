/**
 * KONFIGURASI CLOUD FIREBASE KHUSUS (BANK NUSANTARA — PROJECT: azkaakc)
 * ---------------------------------------------------------------------------
 * Terhubung langsung ke Firebase Firestore project "azkaakc"
 * App ID: 1:1070517785090:web:158d14b8bf1975b5138d1b
 */

export interface FirebaseCloudConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
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
  apiKey: 'AIzaSyAD1MYxchkSYAEExsQ6RoBOrQ1DOU8U16g',
  authDomain: 'azkaakc.firebaseapp.com',
  databaseURL: 'https://azkaakc-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'azkaakc',
  firestoreDatabaseId: '(default)',
  storageBucket: 'azkaakc.firebasestorage.app',
  messagingSenderId: '1070517785090',
  appId: '1:1070517785090:web:158d14b8bf1975b5138d1b',
  measurementId: '',
  authorizedDomains: [
    'azkaakc.firebaseapp.com',
    'azkaakc.web.app',
    'atm-akc.vercel.app',
    'localhost',
    '127.0.0.1',
  ],
};
