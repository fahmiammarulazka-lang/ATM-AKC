/**
 * Bank Nusantara Layer 1 Persistence: Cloud Firestore Sync (Native Maps & Lists, No JSON Strings)
 * Menyimpan dan menyinkronkan data nasabah secara real-time sesuai firebase-blueprint.json & firestore.rules.
 */
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, type FirebaseUser } from '../firebase';
import type { BankPersistableSnapshot } from './deviceStorage';

const knownVaultDocExists = new Set<string>();

function sanitizeValueForFirestore(value: unknown, depth = 0): unknown {
  if (depth > 8 || value === undefined) return null;
  if (value === null || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    if (value.startsWith('data:image/') && value.length > 2048) {
      return '[local-image-stored-on-device]';
    }
    return value.length > 3000 ? value.slice(0, 3000) : value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 200)
      .filter((item) => item !== undefined)
      .map((item) => sanitizeValueForFirestore(item, depth + 1));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      if (!k || k.length > 128) continue;
      out[k] = sanitizeValueForFirestore(v, depth + 1);
    }
    return out;
  }
  return String(value);
}

function clampList(list: unknown[], maxLen: number): Record<string, unknown>[] {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, maxLen)
    .map((item) => sanitizeValueForFirestore(item))
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object' && !Array.isArray(item)));
}

function clampStringList(list: string[], maxLen: number): string[] {
  if (!Array.isArray(list)) return [];
  return list
    .slice(0, maxLen)
    .map((item) => String(item).slice(0, 128))
    .filter(Boolean);
}

export async function ensureUserRootProfile(user: FirebaseUser): Promise<void> {
  if (!user || !user.uid || !user.emailVerified) return;
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);
  const displayName = (user.displayName || user.email?.split('@')[0] || 'Nasabah Nusantara').slice(0, 120);
  const email = (user.email || 'nasabah@gmail.com').slice(0, 160);
  const photoUrl = user.photoURL ? user.photoURL.slice(0, 512) : '';

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email,
        displayName,
        ...(photoUrl ? { photoUrl } : {}),
        role: 'customer',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(userRef, {
        email,
        displayName,
        ...(photoUrl ? { photoUrl } : {}),
        updatedAt: serverTimestamp(),
      });
    }
    knownVaultDocExists.add(userPath);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

async function upsertVaultDoc(
  userId: string,
  subDocName: 'core' | 'ledger' | 'extras',
  fields: Record<string, unknown>
): Promise<void> {
  const docPath = `users/${userId}/vault/${subDocName}`;
  const ref = doc(db, 'users', userId, 'vault', subDocName);

  try {
    let exists = knownVaultDocExists.has(docPath);
    if (!exists) {
      const snap = await getDoc(ref);
      exists = snap.exists();
      if (exists) {
        knownVaultDocExists.add(docPath);
      }
    }

    if (!exists) {
      await setDoc(ref, {
        ownerId: userId,
        ...fields,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      knownVaultDocExists.add(docPath);
    } else {
      await updateDoc(ref, {
        ...fields,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function saveSnapshotToFirestore(
  user: FirebaseUser,
  snapshot: BankPersistableSnapshot
): Promise<void> {
  if (!user || !user.uid || !user.emailVerified) return;

  await ensureUserRootProfile(user);

  const safeEmail = (user.email || 'nasabah@gmail.com').slice(0, 160);
  const currentAccountId = String(snapshot.currentAccountId || 'acc-1').slice(0, 128);
  const updatedAtMs = typeof snapshot.updatedAtMs === 'number' ? snapshot.updatedAtMs : Date.now();

  const coreFields = {
    email: safeEmail,
    currentAccountId,
    accounts: clampList(snapshot.accounts, 30),
    goldMarketConfig: (sanitizeValueForFirestore(snapshot.goldMarketConfig) || {}) as Record<string, unknown>,
    userSettings: (sanitizeValueForFirestore(snapshot.userSettings) || {}) as Record<string, unknown>,
    updatedAtMs,
  };

  const ledgerFields = {
    transactions: clampList(snapshot.transactions, 150),
    pockets: clampList(snapshot.pockets, 60),
    depositos: clampList(snapshot.depositos, 60),
    loans: clampList(snapshot.loans, 60),
    scheduledPayments: clampList(snapshot.scheduledPayments, 60),
    favorites: clampList(snapshot.favorites, 60),
    notifications: clampList(snapshot.notifications, 80),
    cardlessTokens: clampList(snapshot.cardlessTokens, 40),
    cardUpgrades: clampList(snapshot.cardUpgrades, 40),
    pinResetRequests: clampList(snapshot.pinResetRequests, 40),
    redeemCodes: clampList(snapshot.redeemCodes, 60),
    purchasedCodes: clampList(snapshot.purchasedCodes, 60),
    resiList: clampList(snapshot.resiList, 60),
    chats: clampList(snapshot.chats, 100),
    updatedAtMs,
  };

  const extrasFields = {
    spinWheelConfig: (sanitizeValueForFirestore(snapshot.spinWheelConfig) || {}) as Record<string, unknown>,
    spinHistory: clampList(snapshot.spinHistory, 80),
    sultanEmpireConfig: (sanitizeValueForFirestore(snapshot.sultanEmpireConfig) || {}) as Record<string, unknown>,
    featureConfigs: clampList(snapshot.featureConfigs, 200),
    deletedFeatureIds: clampStringList(snapshot.deletedFeatureIds, 200),
    adminHelpRequests: clampList(snapshot.adminHelpRequests, 60),
    appUpdates: clampList(snapshot.appUpdates, 40),
    budgetCategories: clampList(snapshot.budgetCategories, 30),
    manualExpenses: clampList(snapshot.manualExpenses, 200),
    budgetTxCategoryMap: (sanitizeValueForFirestore(snapshot.budgetTxCategoryMap) || {}) as Record<string, string>,
    budgetAlertHistory: clampStringList(snapshot.budgetAlertHistory, 150),
    updatedAtMs,
  };

  await Promise.all([
    upsertVaultDoc(user.uid, 'core', coreFields),
    upsertVaultDoc(user.uid, 'ledger', ledgerFields),
    upsertVaultDoc(user.uid, 'extras', extrasFields),
  ]);
}

export async function loadSnapshotFromFirestoreOnce(
  user: FirebaseUser
): Promise<Partial<BankPersistableSnapshot> | null> {
  if (!user || !user.uid || !user.emailVerified) return null;

  const corePath = `users/${user.uid}/vault/core`;
  const ledgerPath = `users/${user.uid}/vault/ledger`;
  const extrasPath = `users/${user.uid}/vault/extras`;

  let merged: Partial<BankPersistableSnapshot> = {};
  let hasAny = false;

  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return null;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
  }

  try {
    const coreSnap = await getDoc(doc(db, 'users', user.uid, 'vault', 'core'));
    if (coreSnap.exists()) {
      knownVaultDocExists.add(corePath);
      const data = coreSnap.data();
      hasAny = true;
      merged = {
        ...merged,
        currentAccountId: data.currentAccountId,
        accounts: data.accounts,
        goldMarketConfig: data.goldMarketConfig,
        userSettings: data.userSettings,
        updatedAtMs: data.updatedAtMs,
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, corePath);
  }

  try {
    const ledgerSnap = await getDoc(doc(db, 'users', user.uid, 'vault', 'ledger'));
    if (ledgerSnap.exists()) {
      knownVaultDocExists.add(ledgerPath);
      const data = ledgerSnap.data();
      hasAny = true;
      merged = {
        ...merged,
        transactions: data.transactions,
        pockets: data.pockets,
        depositos: data.depositos,
        loans: data.loans,
        scheduledPayments: data.scheduledPayments,
        favorites: data.favorites,
        notifications: data.notifications,
        cardlessTokens: data.cardlessTokens,
        cardUpgrades: data.cardUpgrades,
        pinResetRequests: data.pinResetRequests,
        redeemCodes: data.redeemCodes,
        purchasedCodes: data.purchasedCodes,
        resiList: data.resiList,
        chats: data.chats,
        updatedAtMs: Math.max(merged.updatedAtMs || 0, data.updatedAtMs || 0),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, ledgerPath);
  }

  try {
    const extrasSnap = await getDoc(doc(db, 'users', user.uid, 'vault', 'extras'));
    if (extrasSnap.exists()) {
      knownVaultDocExists.add(extrasPath);
      const data = extrasSnap.data();
      hasAny = true;
      merged = {
        ...merged,
        spinWheelConfig: data.spinWheelConfig,
        spinHistory: data.spinHistory,
        sultanEmpireConfig: data.sultanEmpireConfig,
        featureConfigs: data.featureConfigs,
        deletedFeatureIds: data.deletedFeatureIds,
        adminHelpRequests: data.adminHelpRequests,
        appUpdates: data.appUpdates,
        budgetCategories: data.budgetCategories,
        manualExpenses: data.manualExpenses,
        budgetTxCategoryMap: data.budgetTxCategoryMap,
        budgetAlertHistory: data.budgetAlertHistory,
        updatedAtMs: Math.max(merged.updatedAtMs || 0, data.updatedAtMs || 0),
      };
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, extrasPath);
  }

  return hasAny ? merged : null;
}

export function subscribeFirestoreVault(
  user: FirebaseUser,
  onRemoteUpdate: (partial: Partial<BankPersistableSnapshot>) => void
): Unsubscribe {
  const corePath = `users/${user.uid}/vault/core`;
  const ledgerPath = `users/${user.uid}/vault/ledger`;
  const extrasPath = `users/${user.uid}/vault/extras`;

  const unsubCore = onSnapshot(
    doc(db, 'users', user.uid, 'vault', 'core'),
    (snap) => {
      if (!snap.exists()) return;
      knownVaultDocExists.add(corePath);
      const data = snap.data();
      onRemoteUpdate({
        currentAccountId: data.currentAccountId,
        accounts: data.accounts,
        goldMarketConfig: data.goldMarketConfig,
        userSettings: data.userSettings,
        updatedAtMs: data.updatedAtMs,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, corePath);
    }
  );

  const unsubLedger = onSnapshot(
    doc(db, 'users', user.uid, 'vault', 'ledger'),
    (snap) => {
      if (!snap.exists()) return;
      knownVaultDocExists.add(ledgerPath);
      const data = snap.data();
      onRemoteUpdate({
        transactions: data.transactions,
        pockets: data.pockets,
        depositos: data.depositos,
        loans: data.loans,
        scheduledPayments: data.scheduledPayments,
        favorites: data.favorites,
        notifications: data.notifications,
        cardlessTokens: data.cardlessTokens,
        cardUpgrades: data.cardUpgrades,
        pinResetRequests: data.pinResetRequests,
        redeemCodes: data.redeemCodes,
        purchasedCodes: data.purchasedCodes,
        resiList: data.resiList,
        chats: data.chats,
        updatedAtMs: data.updatedAtMs,
      });
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, ledgerPath);
    }
  );

  const unsubExtras = onSnapshot(
    doc(db, 'users', user.uid, 'vault', 'extras'),
    (snap) => {
      if (!snap.exists()) return;
      knownVaultDocExists.add(extrasPath);
      const data = extrasSnapData(snap.data());
      onRemoteUpdate(data);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, extrasPath);
    }
  );

  return () => {
    unsubCore();
    unsubLedger();
    unsubExtras();
  };
}

function extrasSnapData(data: Record<string, unknown>): Partial<BankPersistableSnapshot> {
  return {
    spinWheelConfig: data.spinWheelConfig,
    spinHistory: data.spinHistory as unknown[],
    sultanEmpireConfig: data.sultanEmpireConfig,
    featureConfigs: data.featureConfigs as unknown[],
    deletedFeatureIds: data.deletedFeatureIds as string[],
    adminHelpRequests: data.adminHelpRequests as unknown[],
    appUpdates: data.appUpdates as unknown[],
    budgetCategories: data.budgetCategories as unknown[],
    manualExpenses: data.manualExpenses as unknown[],
    budgetTxCategoryMap: data.budgetTxCategoryMap as Record<string, string>,
    budgetAlertHistory: data.budgetAlertHistory as string[],
    updatedAtMs: typeof data.updatedAtMs === 'number' ? data.updatedAtMs : Date.now(),
  };
}

export async function saveBugReportToFirestore(
  user: FirebaseUser,
  report: {
    id: string;
    reporterName: string;
    reporterAccountNumber?: string;
    reporterEmail?: string;
    category: string;
    explanation: string;
    photoFileName?: string;
  }
): Promise<void> {
  if (!user || !user.uid || !user.emailVerified) return;
  const cleanId = report.id.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 128);
  const path = `bug_reports/${cleanId}`;
  try {
    await setDoc(doc(db, 'bug_reports', cleanId), {
      id: cleanId,
      authorId: user.uid,
      reporterName: String(report.reporterName || 'Pengguna').slice(0, 120),
      ...(report.reporterAccountNumber
        ? { reporterAccountNumber: String(report.reporterAccountNumber).slice(0, 32) }
        : {}),
      ...(report.reporterEmail ? { reporterEmail: String(report.reporterEmail).slice(0, 160) } : {}),
      category: String(report.category || 'Umum').slice(0, 80),
      explanation: String(report.explanation || '').slice(0, 2000),
      ...(report.photoFileName ? { photoFileName: String(report.photoFileName).slice(0, 180) } : {}),
      status: 'baru',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
