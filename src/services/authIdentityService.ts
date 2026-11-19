/**
 * Bank Nusantara — Google-Only Identity Linking, Atomic Data Rescue & Security Audit Service
 * -----------------------------------------------------------------------------------------
 * - Mode A: Anonymous Vault (signInAnonymously) dengan persistensi IndexedDB
 * - Mode B: Google Sign-In (signInWithPopup + fallback otomatis signInWithRedirect)
 * - True Cryptographic Account Linking: linkWithPopup (fallback linkWithRedirect) — UID tetap 100% identik
 * - Atomic Data Rescue & Merge Protocol untuk konflik `auth/credential-already-in-use`
 * - Anti-Lockout & Mandatory Google Re-Authentication (reauthenticateWithPopup)
 * - Active Device Session Registry & Revocation
 * - Immutable Security Audit Trail (users/{uid}/security_logs)
 */
import {
  auth,
  db,
  doc,
  writeBatch,
  serverTimestamp,
  googleProvider,
  GoogleAuthProvider,
  authPersistenceReady,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  linkWithPopup,
  linkWithRedirect,
  signInWithCredential,
  reauthenticateWithPopup,
  readUidVaultDoc,
  writeUidVaultDoc,
  deleteUidVaultDoc,
  listUidVaultCollection,
  subscribeUidVaultCollection,
  writeCloudDoc,
  isFirestoreActive,
  markFirestoreUnavailableIfMissing,
  sanitizeSafeText,
  type FirebaseUser,
} from '../lib/firebase';
import {
  getOrCreatePersistentDeviceId,
  stageRescuePayload,
  clearRescuePayload,
  writeVaultStateAtomic,
  readVaultStateWithOfflineFallback,
} from './maxSyncService';

export type SecurityLogEventType =
  | 'session_init'
  | 'anonymous_vault_start'
  | 'google_sign_in'
  | 'account_link_success'
  | 'atomic_merge_complete'
  | 'device_switch'
  | 'snapshot_created'
  | 'snapshot_restored'
  | 'backup_exported'
  | 'backup_imported'
  | 'reauth_verified'
  | 'device_revoked'
  | 'cloud_reset';

export interface SecurityAuditLogRecord {
  id: string;
  ownerUid: string;
  eventType: SecurityLogEventType;
  summary: string;
  status: 'success' | 'warning' | 'blocked';
  deviceId: string;
  deviceLabel: string;
  platform: string;
  userAgent: string;
  createdAtMs: number;
  createdAtIso: string;
  details?: Record<string, string | number | boolean>;
}

export interface DeviceSessionRecord {
  id: string;
  ownerUid: string;
  deviceId: string;
  deviceLabel: string;
  platform: string;
  userAgent: string;
  authMethod: 'google' | 'anonymous';
  firstSeenIso: string;
  lastActiveIso: string;
  lastActiveMs: number;
  revoked: boolean;
  revokedAtIso?: string;
}

export interface AtomicMergeSummary {
  performed: boolean;
  sourceAnonymousUid: string;
  targetGoogleUid: string;
  targetEmail: string;
  mergedAccountsCount: number;
  mergedTransactionsCount: number;
  mergedPocketsCount: number;
  mergedDepositosCount: number;
  mergedAtIso: string;
}

export interface AccountLinkResult {
  success: boolean;
  uid?: string;
  email?: string;
  user?: FirebaseUser;
  sameUidPreserved?: boolean;
  atomicMergeSummary?: AtomicMergeSummary;
  redirecting?: boolean;
  errorCode?: string;
  message: string;
}

export interface ReauthResult {
  success: boolean;
  verifiedAtIso?: string;
  errorCode?: string;
  message: string;
}

// ============================================================================
// DEVICE FINGERPRINT & HUMAN-READABLE PLATFORM PARSER
// ============================================================================
export function parseClientDeviceMetadata(): {
  deviceLabel: string;
  platform: string;
  userAgent: string;
} {
  if (typeof navigator === 'undefined') {
    return { deviceLabel: 'Server Runtime', platform: 'Node', userAgent: 'server' };
  }
  const ua = navigator.userAgent || 'Unknown Browser';
  const platform =
    (navigator as unknown as { userAgentData?: { platform?: string } }).userAgentData?.platform ||
    navigator.platform ||
    'Web';

  let browser = 'Browser';
  if (ua.includes('Edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('OPR/') || ua.includes('Opera')) browser = 'Opera';
  else if (ua.includes('Chrome/') && !ua.includes('Edg/')) browser = 'Google Chrome';
  else if (ua.includes('Firefox/')) browser = 'Mozilla Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome/')) browser = 'Apple Safari';

  let os = platform;
  if (/Android/i.test(ua)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(ua)) os = 'iOS';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/Mac OS X|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Linux/i.test(ua)) os = 'Linux';

  return {
    deviceLabel: sanitizeSafeText(`${browser} di ${os}`, 100),
    platform: sanitizeSafeText(os, 60),
    userAgent: sanitizeSafeText(ua, 280),
  };
}

// ============================================================================
// IMMUTABLE SECURITY AUDIT LOGGER (`users/{uid}/security_logs`)
// ============================================================================
export async function appendSecurityAuditLog(
  uid: string,
  eventType: SecurityLogEventType,
  summary: string,
  options?: {
    status?: 'success' | 'warning' | 'blocked';
    details?: Record<string, string | number | boolean>;
  }
): Promise<SecurityAuditLogRecord | null> {
  if (!uid) return null;
  const deviceId = await getOrCreatePersistentDeviceId();
  const meta = parseClientDeviceMetadata();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const logId = `log_${nowMs}_${Math.random().toString(36).slice(2, 8)}`;

  const record: SecurityAuditLogRecord = {
    id: logId,
    ownerUid: uid,
    eventType,
    summary: sanitizeSafeText(summary, 320),
    status: options?.status || 'success',
    deviceId,
    deviceLabel: meta.deviceLabel,
    platform: meta.platform,
    userAgent: meta.userAgent,
    createdAtMs: nowMs,
    createdAtIso: nowIso,
    ...(options?.details ? { details: options.details } : {}),
  };

  await writeUidVaultDoc(
    uid,
    'security_logs',
    logId,
    record as unknown as Record<string, unknown>,
    { merge: false }
  );

  return record;
}

export async function fetchSecurityAuditLogs(uid: string): Promise<SecurityAuditLogRecord[]> {
  if (!uid) return [];
  const items = await listUidVaultCollection<SecurityAuditLogRecord>(uid, 'security_logs');
  return items
    .filter((item) => item && typeof item.createdAtMs === 'number')
    .sort((a, b) => b.createdAtMs - a.createdAtMs)
    .slice(0, 80);
}

export function subscribeSecurityAuditLogs(
  uid: string,
  onLogs: (logs: SecurityAuditLogRecord[]) => void
): () => void {
  if (!uid) {
    onLogs([]);
    return () => {};
  }
  return subscribeUidVaultCollection<SecurityAuditLogRecord>(uid, 'security_logs', (items) => {
    const sorted = items
      .filter((item) => item && typeof item.createdAtMs === 'number')
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, 80);
    onLogs(sorted);
  });
}

// ============================================================================
// ACTIVE DEVICE SESSION REGISTRY & REVOCATION (`users/{uid}/devices`)
// ============================================================================
export async function registerActiveDeviceSession(
  uid: string,
  authMethod: 'google' | 'anonymous'
): Promise<DeviceSessionRecord | null> {
  if (!uid) return null;
  const deviceId = await getOrCreatePersistentDeviceId();
  const meta = parseClientDeviceMetadata();
  const nowMs = Date.now();
  const nowIso = new Date(nowMs).toISOString();

  const existing = await readUidVaultDoc<DeviceSessionRecord>(uid, 'devices', deviceId);
  const isNewDevice = !existing;

  const sessionDoc: DeviceSessionRecord = {
    id: deviceId,
    ownerUid: uid,
    deviceId,
    deviceLabel: meta.deviceLabel,
    platform: meta.platform,
    userAgent: meta.userAgent,
    authMethod,
    firstSeenIso: existing?.firstSeenIso || nowIso,
    lastActiveIso: nowIso,
    lastActiveMs: nowMs,
    revoked: false,
  };

  await writeUidVaultDoc(
    uid,
    'devices',
    deviceId,
    sessionDoc as unknown as Record<string, unknown>,
    { merge: false }
  );

  if (isNewDevice) {
    await appendSecurityAuditLog(
      uid,
      'device_switch',
      `Perangkat baru terdeteksi & terdaftar: ${meta.deviceLabel} (${deviceId.slice(0, 12)}...)`,
      { details: { authMethod, platform: meta.platform } }
    );
  }

  return sessionDoc;
}

export function subscribeActiveDevices(
  uid: string,
  onDevices: (devices: DeviceSessionRecord[]) => void
): () => void {
  if (!uid) {
    onDevices([]);
    return () => {};
  }
  return subscribeUidVaultCollection<DeviceSessionRecord>(uid, 'devices', (items) => {
    const sorted = items
      .filter((d) => d && d.deviceId)
      .sort((a, b) => (b.lastActiveMs || 0) - (a.lastActiveMs || 0));
    onDevices(sorted);
  });
}

export async function revokeOtherDevicesWithReauth(
  uid: string
): Promise<{ success: boolean; revokedCount: number; message: string }> {
  const reauth = await requireGoogleReauthentication(
    'Verifikasi ulang Google diperlukan untuk memutus sesi perangkat lain.'
  );
  if (!reauth.success) {
    return { success: false, revokedCount: 0, message: reauth.message };
  }

  const currentDeviceId = await getOrCreatePersistentDeviceId();
  const allDevices = await listUidVaultCollection<DeviceSessionRecord>(uid, 'devices');
  const others = allDevices.filter((d) => d.deviceId !== currentDeviceId && !d.revoked);
  const nowIso = new Date().toISOString();

  await Promise.all(
    others.map((d) =>
      writeUidVaultDoc(
        uid,
        'devices',
        d.deviceId,
        {
          ...d,
          revoked: true,
          revokedAtIso: nowIso,
        },
        { merge: true }
      )
    )
  );

  await appendSecurityAuditLog(
    uid,
    'device_revoked',
    `Memutus sesi ${others.length} perangkat lain setelah verifikasi ulang Google.`,
    { details: { revokedCount: others.length, keptDeviceId: currentDeviceId } }
  );

  return {
    success: true,
    revokedCount: others.length,
    message:
      others.length > 0
        ? `${others.length} sesi perangkat lain berhasil diputus dan dicatat ke log keamanan.`
        : 'Tidak ada perangkat lain aktif selain perangkat ini.',
  };
}

// ============================================================================
// MODE A: ANONYMOUS VAULT INITIALIZER (`signInAnonymously`)
// ============================================================================
export async function ensureAnonymousVaultSession(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  uid?: string;
  isNewAnonymous?: boolean;
  errorCode?: string;
  message: string;
}> {
  await authPersistenceReady;

  if (auth.currentUser) {
    const current = auth.currentUser;
    await registerActiveDeviceSession(
      current.uid,
      current.isAnonymous ? 'anonymous' : 'google'
    );
    return {
      success: true,
      user: current,
      uid: current.uid,
      isNewAnonymous: false,
      message: current.isAnonymous
        ? `Sesi Anonymous Vault aktif (UID: ${current.uid.slice(0, 10)}...).`
        : `Sesi Google Cloud aktif (${current.email || current.uid}).`,
    };
  }

  try {
    const cred = await signInAnonymously(auth);
    const anonUser = cred.user;
    const nowIso = new Date().toISOString();
    const deviceId = await getOrCreatePersistentDeviceId();

    await writeCloudDoc(
      'users',
      anonUser.uid,
      {
        uid: anonUser.uid,
        ownerUid: anonUser.uid,
        email: '',
        displayName: 'Nasabah Anonymous Vault',
        status: 'active',
        authMode: 'guest',
        isAnonymousVault: true,
        lastDeviceId: deviceId,
        createdAt: nowIso,
        updatedAt: nowIso,
        updatedAtMs: Date.now(),
      },
      { merge: true }
    );

    await registerActiveDeviceSession(anonUser.uid, 'anonymous');
    await appendSecurityAuditLog(
      anonUser.uid,
      'anonymous_vault_start',
      'Sesi kriptografis Anonymous Vault berhasil diinisialisasi dengan persistensi IndexedDB.'
    );

    return {
      success: true,
      user: anonUser,
      uid: anonUser.uid,
      isNewAnonymous: true,
      message: `Anonymous Vault berhasil dibuat (UID: ${anonUser.uid.slice(0, 10)}...). Hubungkan ke Google kapan saja tanpa kehilangan data.`,
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/admin-restricted-operation' || code === 'auth/operation-not-allowed') {
      return {
        success: false,
        errorCode: code,
        message:
          'Anonymous Sign-In belum diaktifkan di Firebase Console project azkaakc (Authentication → Sign-in method → Anonymous). Mode Tamu tetap berjalan lewat Cloud RTDB.',
      };
    }
    return {
      success: false,
      errorCode: code,
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menginisialisasi Anonymous Vault. Periksa koneksi internet Anda.',
    };
  }
}

// ============================================================================
// REDIRECT RESULT RESOLVER (Auto-complete signInWithRedirect / linkWithRedirect)
// ============================================================================
export async function resolvePendingAuthRedirect(): Promise<FirebaseUser | null> {
  await authPersistenceReady;
  try {
    const result = await getRedirectResult(auth);
    if (result?.user) {
      await registerActiveDeviceSession(
        result.user.uid,
        result.user.isAnonymous ? 'anonymous' : 'google'
      );
      await appendSecurityAuditLog(
        result.user.uid,
        'google_sign_in',
        `Sesi Google berhasil diselesaikan melalui redirect aman (${result.user.email || result.user.uid}).`
      );
      return result.user;
    }
  } catch (err) {
    console.warn('[Auth Redirect Recovery]', err);
  }
  return null;
}

// ============================================================================
// MERGE HELPER (Deduplikasi by ID, Pertahankan Versi Terbaru by updatedAt)
// ============================================================================
function getRecordTimestamp(item: Record<string, any>): number {
  const candidates = [item.updatedAtMs, item.updatedAt, item.timestamp, item.createdAt];
  for (const val of candidates) {
    if (typeof val === 'number' && Number.isFinite(val)) return val;
    if (typeof val === 'string') {
      const parsed = Date.parse(val);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return 0;
}

export function mergeEntitiesByIdKeepLatest<T extends { id: string }>(
  existingTarget: T[],
  incomingAnonymous: T[]
): T[] {
  const map = new Map<string, T>();
  for (const item of existingTarget) {
    if (item && item.id) map.set(item.id, item);
  }
  for (const item of incomingAnonymous) {
    if (!item || !item.id) continue;
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
    } else {
      const prevTs = getRecordTimestamp(prev as Record<string, any>);
      const nextTs = getRecordTimestamp(item as Record<string, any>);
      map.set(item.id, nextTs >= prevTs ? { ...prev, ...item } : prev);
    }
  }
  return Array.from(map.values());
}

// ============================================================================
// TRUE CRYPTOGRAPHIC ACCOUNT LINKING (`linkWithPopup`) + ATOMIC RESCUE MERGE
// ============================================================================
export interface LinkBankingSnapshotInput {
  accounts: any[];
  transactions: any[];
  pockets: any[];
  depositos: any[];
  userSettings?: Record<string, unknown>;
}

export async function linkCurrentSessionToGoogleZeroLoss(
  liveAnonymousPayload?: LinkBankingSnapshotInput
): Promise<AccountLinkResult> {
  await authPersistenceReady;
  const currentUser = auth.currentUser;

  // Jika pengguna belum memiliki Firebase Auth session sama sekali, jalankan Google Sign-In biasa
  if (!currentUser) {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      await registerActiveDeviceSession(res.user.uid, 'google');
      await appendSecurityAuditLog(
        res.user.uid,
        'google_sign_in',
        `Masuk langsung dengan akun Google (${res.user.email || 'Google User'}).`
      );
      return {
        success: true,
        uid: res.user.uid,
        email: res.user.email || '',
        user: res.user,
        sameUidPreserved: false,
        message: `Berhasil masuk dengan Google (${res.user.email || res.user.displayName}).`,
      };
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code || '';
      if (code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
        return {
          success: false,
          redirecting: true,
          errorCode: code,
          message: 'Popup diblokir browser. Mengalihkan ke halaman autentikasi Google...',
        };
      }
      return {
        success: false,
        errorCode: code,
        message:
          code === 'auth/popup-closed-by-user'
            ? 'Jendela login Google ditutup sebelum selesai.'
            : err instanceof Error
            ? err.message
            : 'Gagal masuk dengan Google.',
      };
    }
  }

  // Jika sudah terhubung dengan Google (bukan anonymous), verifikasi dan kembalikan langsung
  if (!currentUser.isAnonymous && currentUser.providerData.some((p) => p.providerId === 'google.com')) {
    return {
      success: true,
      uid: currentUser.uid,
      email: currentUser.email || '',
      user: currentUser,
      sameUidPreserved: true,
      message: `Akun ini sudah terproteksi permanen oleh Google (${currentUser.email}).`,
    };
  }

  // ==========================================================================
  // TAHAP 1: TRUE CRYPTOGRAPHIC LINKING (`linkWithPopup`) UNTUK ANONYMOUS VAULT
  // ==========================================================================
  const anonymousUid = currentUser.uid;
  const stagingKey = `atomic_rescue_${anonymousUid}`;

  // Snapshot data sesi Anonymous sebelum link (ke memori + IndexedDB staging)
  const existingAnonVault = await readVaultStateWithOfflineFallback<Record<string, any>>(anonymousUid);
  const rescueBuffer: LinkBankingSnapshotInput = {
    accounts: liveAnonymousPayload?.accounts || (existingAnonVault?.payload?.accounts as any[]) || [],
    transactions:
      liveAnonymousPayload?.transactions || (existingAnonVault?.payload?.transactions as any[]) || [],
    pockets: liveAnonymousPayload?.pockets || (existingAnonVault?.payload?.pockets as any[]) || [],
    depositos:
      liveAnonymousPayload?.depositos || (existingAnonVault?.payload?.depositos as any[]) || [],
    userSettings:
      liveAnonymousPayload?.userSettings ||
      (existingAnonVault?.payload?.userSettings as Record<string, unknown>) ||
      {},
  };
  await stageRescuePayload(stagingKey, rescueBuffer);

  try {
    const linkedResult = await linkWithPopup(currentUser, googleProvider);
    const linkedUser = linkedResult.user;

    await writeCloudDoc(
      'users',
      linkedUser.uid,
      {
        uid: linkedUser.uid,
        ownerUid: linkedUser.uid,
        email: (linkedUser.email || '').toLowerCase(),
        displayName: sanitizeSafeText(linkedUser.displayName || 'Nasabah Google', 120),
        photoURL: linkedUser.photoURL || '',
        authMode: 'google',
        isAnonymousVault: false,
        linkedFromAnonymousAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        updatedAtMs: Date.now(),
      },
      { merge: true }
    );

    await registerActiveDeviceSession(linkedUser.uid, 'google');
    await appendSecurityAuditLog(
      linkedUser.uid,
      'account_link_success',
      `Penautan kriptografis sukses: Anonymous Vault terikat permanen ke Google (${linkedUser.email}) dengan UID 100% identik.`,
      { details: { sameUidPreserved: true, email: linkedUser.email || '' } }
    );
    await clearRescuePayload(stagingKey);

    return {
      success: true,
      uid: linkedUser.uid,
      email: linkedUser.email || '',
      user: linkedUser,
      sameUidPreserved: linkedUser.uid === anonymousUid,
      message: `Akun berhasil diamankan ke Google (${linkedUser.email}) dengan UID identik — 100% data tetap utuh!`,
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';

    // Fallback otomatis ke linkWithRedirect jika popup diblokir browser seluler / in-app
    if (code === 'auth/popup-blocked') {
      try {
        await linkWithRedirect(currentUser, googleProvider);
        return {
          success: false,
          redirecting: true,
          errorCode: code,
          message: 'Popup diblokir browser. Mengalihkan otomatis untuk menautkan akun Google...',
        };
      } catch {
        return {
          success: false,
          errorCode: code,
          message: 'Browser memblokir popup penautan Google. Izinkan pop-up lalu coba lagi.',
        };
      }
    }

    // ========================================================================
    // TAHAP 2: ATOMIC DATA RESCUE & MERGE PROTOCOL (`auth/credential-already-in-use`)
    // ========================================================================
    if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
      const credential = GoogleAuthProvider.credentialFromError(err as any);
      if (!credential) {
        return {
          success: false,
          errorCode: code,
          message:
            'Akun Google tersebut sudah terdaftar sebelumnya, namun kredensial OAuth tidak tersedia untuk penggabungan otomatis. Silakan coba klik Hubungkan Google sekali lagi.',
        };
      }

      try {
        // 1. Login ke Akun Google tujuan menggunakan credential hasil ekstraksi
        const signedIn = await signInWithCredential(auth, credential);
        const googleUser = signedIn.user;
        const googleUid = googleUser.uid;
        const googleEmail = (googleUser.email || '').toLowerCase();

        // 2. Baca Vault Cloud milik googleUid yang sudah ada sebelumnya
        const existingGoogleVault = await readVaultStateWithOfflineFallback<Record<string, any>>(
          googleUid
        );
        const targetPayload = existingGoogleVault?.payload || {};

        // 3. Re-tag akun anonymous agar terikat permanen ke googleUid & googleEmail
        const rescuedAccounts = (rescueBuffer.accounts || []).map((acc: any) => ({
          ...acc,
          firebaseUid: googleUid,
          email: googleEmail || acc.email,
          googleEmail: googleEmail || acc.googleEmail,
          isGuestAccount: false,
        }));

        const mergedAccounts = mergeEntitiesByIdKeepLatest(
          (targetPayload.accounts as any[]) || [],
          rescuedAccounts
        );
        const mergedTransactions = mergeEntitiesByIdKeepLatest(
          (targetPayload.transactions as any[]) || [],
          rescueBuffer.transactions || []
        );
        const mergedPockets = mergeEntitiesByIdKeepLatest(
          (targetPayload.pockets as any[]) || [],
          rescueBuffer.pockets || []
        );
        const mergedDepositos = mergeEntitiesByIdKeepLatest(
          (targetPayload.depositos as any[]) || [],
          rescueBuffer.depositos || []
        );

        const mergedPayload = {
          ...targetPayload,
          accounts: mergedAccounts,
          transactions: mergedTransactions,
          pockets: mergedPockets,
          depositos: mergedDepositos,
          userSettings: {
            ...(targetPayload.userSettings || {}),
            ...(rescueBuffer.userSettings || {}),
          },
          lastAtomicMergeFromUid: anonymousUid,
          lastAtomicMergeAtIso: new Date().toISOString(),
        };

        // 4. Tulis Atomic Merge ke Vault Google tujuan (runTransaction / writeBatch + RTDB)
        await writeVaultStateAtomic(
          googleUid,
          mergedPayload,
          mergedAccounts.length + mergedTransactions.length + mergedPockets.length
        );

        if (isFirestoreActive()) {
          try {
            const batch = writeBatch(db);
            batch.set(
              doc(db, 'users', googleUid),
              {
                uid: googleUid,
                ownerUid: googleUid,
                email: googleEmail,
                displayName: sanitizeSafeText(googleUser.displayName || 'Nasabah Google', 120),
                photoURL: googleUser.photoURL || '',
                authMode: 'google',
                isAnonymousVault: false,
                updatedAt: serverTimestamp(),
              },
              { merge: true }
            );
            await batch.commit();
          } catch (batchErr) {
            markFirestoreUnavailableIfMissing(batchErr);
          }
        }

        // 5. Catat peristiwa Atomic Merge ke security_logs milik googleUid
        const mergeSummary: AtomicMergeSummary = {
          performed: true,
          sourceAnonymousUid: anonymousUid,
          targetGoogleUid: googleUid,
          targetEmail: googleEmail,
          mergedAccountsCount: rescuedAccounts.length,
          mergedTransactionsCount: (rescueBuffer.transactions || []).length,
          mergedPocketsCount: (rescueBuffer.pockets || []).length,
          mergedDepositosCount: (rescueBuffer.depositos || []).length,
          mergedAtIso: new Date().toISOString(),
        };

        await registerActiveDeviceSession(googleUid, 'google');
        await appendSecurityAuditLog(
          googleUid,
          'atomic_merge_complete',
          `Atomic Data Rescue & Merge selesai: menyelamatkan ${mergeSummary.mergedAccountsCount} kartu, ${mergeSummary.mergedTransactionsCount} mutasi, dan ${mergeSummary.mergedPocketsCount} kantong dari sesi Anonymous ke akun Google ${googleEmail}.`,
          {
            details: {
              sourceAnonymousUid: anonymousUid,
              mergedAccountsCount: mergeSummary.mergedAccountsCount,
              mergedTransactionsCount: mergeSummary.mergedTransactionsCount,
            },
          }
        );

        // 6. Hapus data sementara di anonymousUid & staging IndexedDB setelah verifikasi sukses
        if (anonymousUid !== googleUid) {
          await deleteUidVaultDoc(anonymousUid, 'vault_state', 'primary');
        }
        await clearRescuePayload(stagingKey);

        return {
          success: true,
          uid: googleUid,
          email: googleEmail,
          user: googleUser,
          sameUidPreserved: false,
          atomicMergeSummary: mergeSummary,
          message: `Akun Google ${googleEmail} sudah terdaftar sebelumnya — Atomic Data Rescue & Merge berhasil menggabungkan ${mergeSummary.mergedAccountsCount} kartu & ${mergeSummary.mergedTransactionsCount} mutasi tanpa kehilangan data!`,
        };
      } catch (mergeErr) {
        return {
          success: false,
          errorCode: 'atomic_merge_failed',
          message:
            mergeErr instanceof Error
              ? `Gagal menyelesaikan Atomic Data Merge: ${mergeErr.message}`
              : 'Gagal menyelesaikan penggabungan data ke akun Google.',
        };
      }
    }

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        errorCode: code,
        message: 'Jendela penautan Google ditutup sebelum selesai.',
      };
    }

    return {
      success: false,
      errorCode: code,
      message:
        err instanceof Error
          ? err.message
          : 'Gagal menautkan akun ke Google. Periksa konfigurasi Authorized Domains Anda.',
    };
  }
}

// ============================================================================
// ANTI-LOCKOUT & MANDATORY GOOGLE RE-AUTHENTICATION (`reauthenticateWithPopup`)
// ============================================================================
export async function requireGoogleReauthentication(reasonLabel: string): Promise<ReauthResult> {
  await authPersistenceReady;
  const user = auth.currentUser;

  if (!user) {
    return {
      success: false,
      errorCode: 'auth/no-current-user',
      message:
        'Tidak ada sesi Firebase aktif. Hubungkan akun Google terlebih dahulu sebelum menjalankan aksi sensitif ini.',
    };
  }

  if (user.isAnonymous) {
    return {
      success: false,
      errorCode: 'auth/anonymous-requires-link',
      message:
        'Akun masih berstatus Sesi Sementara (Anonymous). Hubungkan ke Akun Google terlebih dahulu untuk memverifikasi aksi sensitif ini.',
    };
  }

  try {
    await reauthenticateWithPopup(user, googleProvider);
    const verifiedAtIso = new Date().toISOString();
    await appendSecurityAuditLog(
      user.uid,
      'reauth_verified',
      `Verifikasi ulang Google berhasil untuk aksi sensitif: ${sanitizeSafeText(reasonLabel, 180)}`,
      { details: { email: user.email || '' } }
    );
    return {
      success: true,
      verifiedAtIso,
      message: 'Identitas Google berhasil diverifikasi ulang.',
    };
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code || '';
    await appendSecurityAuditLog(
      user.uid,
      'reauth_verified',
      `Verifikasi ulang Google dibatalkan/gagal untuk: ${sanitizeSafeText(reasonLabel, 140)}`,
      { status: 'blocked', details: { errorCode: code || 'unknown' } }
    );
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return {
        success: false,
        errorCode: code,
        message: 'Verifikasi ulang Google dibatalkan. Aksi sensitif tidak dijalankan demi keamanan.',
      };
    }
    if (code === 'auth/user-mismatch') {
      return {
        success: false,
        errorCode: code,
        message:
          'Akun Google yang dipilih tidak cocok dengan pemilik sesi saat ini. Pilih akun Google yang sedang login.',
      };
    }
    return {
      success: false,
      errorCode: code,
      message:
        err instanceof Error
          ? err.message
          : 'Verifikasi ulang identitas Google gagal. Aksi sensitif dibatalkan.',
    };
  }
}
