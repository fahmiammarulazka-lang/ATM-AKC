/**
 * Bank Nusantara — Security & Sync Command Center UI
 * ---------------------------------------------------------------------------
 * Exports:
 * 1) LiveSyncTelemetryHud      — Indikator 4 status real-time ringkas di kanan Navbar
 * 2) SmartProtectionBanner     — Banner elegan non-intrusif di atas Dashboard untuk sesi sementara
 * 3) SecurityCommandCenter     — Modal konsol responsif penuh (Dark & Light Mode toggle):
 *    - Kartu Identitas Google, Anti-Lockout & Sesi Perangkat
 *    - Panel Telemetri Sinkronisasi Real-Time & Paksa Sinkronisasi
 *    - Panel Time-Machine (5 Rolling Snapshots) & Export/Import Backup SHA-256
 *    - Tabel Log Aktivitas Keamanan Real-Time (Search & Filter)
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  Copy,
  Check,
  X,
  Sun,
  Moon,
  History,
  Download,
  Upload,
  Laptop,
  Lock,
  Trash2,
  Search,
  CheckCircle2,
  KeyRound,
  FileCheck2,
  Loader2,
  Database,
  LogOut,
  RotateCcw,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { auth, getAuthPersistenceMode } from '../lib/firebase';
import {
  subscribeSecurityAuditLogs,
  subscribeActiveDevices,
  revokeOtherDevicesWithReauth,
  requireGoogleReauthentication,
  type SecurityAuditLogRecord,
  type DeviceSessionRecord,
} from '../services/authIdentityService';
import {
  subscribeCloudSnapshots,
  createCloudSnapshot,
  verifySnapshotIntegrity,
  exportSignedBackupJson,
  parseAndVerifyBackupJson,
  MAX_ROLLING_SNAPSHOTS,
  type TimeMachineSnapshotRecord,
  type SignedJsonBackupFile,
} from '../services/timeMachineBackupService';
import { formatRupiah } from '../utils/bankUtils';

type CommandCenterSection = 'identity' | 'telemetry' | 'timemachine' | 'audit';
type AuditFilterCategory = 'all' | 'auth' | 'device' | 'backup' | 'sensitive';

function formatDateTimeIndo(iso?: string | null): string {
  if (!iso) return 'Belum tercatat';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Belum tercatat';
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatTimeShort(iso?: string | null): string {
  if (!iso) return '--:--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getAuditCategory(eventType: SecurityAuditLogRecord['eventType']): AuditFilterCategory {
  if (
    eventType === 'session_init' ||
    eventType === 'anonymous_vault_start' ||
    eventType === 'google_sign_in' ||
    eventType === 'account_link_success' ||
    eventType === 'atomic_merge_complete'
  ) {
    return 'auth';
  }
  if (eventType === 'device_switch' || eventType === 'device_revoked') {
    return 'device';
  }
  if (
    eventType === 'snapshot_created' ||
    eventType === 'snapshot_restored' ||
    eventType === 'backup_exported' ||
    eventType === 'backup_imported'
  ) {
    return 'backup';
  }
  return 'sensitive';
}

function getAuditEventLabel(eventType: SecurityAuditLogRecord['eventType']): string {
  const map: Record<SecurityAuditLogRecord['eventType'], string> = {
    session_init: 'Inisialisasi Sesi',
    anonymous_vault_start: 'Anonymous Vault Aktif',
    google_sign_in: 'Login Google',
    account_link_success: 'Penautan Google',
    atomic_merge_complete: 'Atomic Data Merge',
    device_switch: 'Perangkat Baru',
    snapshot_created: 'Snapshot Dibuat',
    snapshot_restored: 'Pulihkan Snapshot',
    backup_exported: 'Export Backup SHA-256',
    backup_imported: 'Import Backup SHA-256',
    reauth_verified: 'Verifikasi Ulang Google',
    device_revoked: 'Putus Sesi Perangkat',
    cloud_reset: 'Reset Data Cloud',
  };
  return map[eventType] || eventType;
}

// ============================================================================
// 1. LIVE SYNC TELEMETRY HUD (4 STATUS REAL-TIME DI KANAN NAVBAR)
// ============================================================================
interface LiveSyncTelemetryHudProps {
  onOpenCommandCenter: (initialSection?: CommandCenterSection) => void;
}

export const LiveSyncTelemetryHud: React.FC<LiveSyncTelemetryHudProps> = ({
  onOpenCommandCenter,
}) => {
  const { syncTelemetry, forceSyncCloudNow } = useBank();
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (retrying) return;
    setRetrying(true);
    try {
      await forceSyncCloudNow();
    } finally {
      setRetrying(false);
    }
  };

  if (syncTelemetry.status === 'error') {
    return (
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onOpenCommandCenter('telemetry')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-500/60 text-rose-200 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
          title={syncTelemetry.lastError || 'Gangguan sinkronisasi cloud — klik untuk detail'}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="hidden sm:inline">Gangguan Sync</span>
        </button>
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="px-2 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60"
          title="Coba sinkronisasi ulang sekarang"
        >
          {retrying ? '...' : 'Retry'}
        </button>
      </div>
    );
  }

  if (syncTelemetry.status === 'offline') {
    return (
      <button
        type="button"
        onClick={() => onOpenCommandCenter('telemetry')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900/80 border border-amber-500/50 text-amber-200 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        title="Mode Offline — pekerjaan aman di IndexedDB perangkat dan otomatis terunggah saat online"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span className="hidden sm:inline">Mode Offline</span>
      </button>
    );
  }

  if (syncTelemetry.status === 'syncing') {
    return (
      <button
        type="button"
        onClick={() => onOpenCommandCenter('telemetry')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-950/80 hover:bg-blue-900/80 border border-blue-500/50 text-blue-200 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
        title={`Menyinkronkan ${Math.max(1, syncTelemetry.pendingWritesCount)} antrean perubahan ke Cloud...`}
      >
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shrink-0" />
        <RefreshCw className="w-3.5 h-3.5 text-blue-300 animate-spin shrink-0" />
        <span className="hidden sm:inline font-mono tabular-nums">
          Sinkron ({Math.max(1, syncTelemetry.pendingWritesCount)})
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpenCommandCenter('telemetry')}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
      title={`Tersinkronisasi (Cloud Verified) · Terakhir: ${formatDateTimeIndo(syncTelemetry.lastSyncedAt)} · Klik buka Pusat Keamanan & Sinkronisasi`}
    >
      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
      <span className="hidden sm:inline">Tersinkronisasi</span>
      {syncTelemetry.lastSyncedAt && (
        <span className="hidden xl:inline text-[10px] font-mono tabular-nums text-emerald-400/80">
          · {formatTimeShort(syncTelemetry.lastSyncedAt)}
        </span>
      )}
    </button>
  );
};

// ============================================================================
// 2. SMART PROTECTION BANNER (ATAS DASHBOARD UNTUK SESI SEMENTARA + MERGE SUMMARY)
// ============================================================================
interface SmartProtectionBannerProps {
  onOpenCommandCenter?: (section?: CommandCenterSection) => void;
}

export const SmartProtectionBanner: React.FC<SmartProtectionBannerProps> = ({
  onOpenCommandCenter,
}) => {
  const {
    currentAccount,
    googleUser,
    firebaseUser,
    linkCurrentAccountWithGooglePopup,
    lastAtomicMergeSummary,
    dismissAtomicMergeSummary,
  } = useBank();

  const [dismissed, setDismissed] = useState(false);
  const [linking, setLinking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const rawEmail = (currentAccount?.googleEmail || currentAccount?.email || googleUser?.email || '')
    .trim()
    .toLowerCase();
  const isUnlinkedSession = Boolean(
    currentAccount &&
      (firebaseUser?.isAnonymous ||
        currentAccount.isGuestAccount ||
        googleUser?.authMode === 'guest' ||
        !rawEmail ||
        rawEmail.endsWith('@nusantara.id') ||
        rawEmail.endsWith('@banknusantara.id'))
  );

  const handleQuickLink = async () => {
    if (linking) return;
    setLinking(true);
    setFeedback(null);
    try {
      const res = await linkCurrentAccountWithGooglePopup();
      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
      } else if (res.errorCode !== 'auth/popup-closed-by-user') {
        setFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setLinking(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Ringkasan Otomatis Jika Baru Saja Terjadi Atomic Data Rescue & Merge */}
      {lastAtomicMergeSummary?.performed && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/60 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-0.5">
              <p className="text-sm font-semibold text-emerald-100">
                Atomic Data Rescue &amp; Merge Selesai Tanpa Kehilangan Data
              </p>
              <p className="text-xs text-emerald-200/85 leading-relaxed">
                Seluruh data dari sesi sementara telah digabungkan ke akun Google{' '}
                <span className="font-mono text-white">{lastAtomicMergeSummary.targetEmail}</span>{' '}
                · {lastAtomicMergeSummary.mergedAccountsCount} kartu ·{' '}
                {lastAtomicMergeSummary.mergedTransactionsCount} mutasi ·{' '}
                {lastAtomicMergeSummary.mergedPocketsCount} kantong.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={dismissAtomicMergeSummary}
            className="px-3 py-1.5 rounded-lg bg-emerald-900/80 hover:bg-emerald-800 text-emerald-100 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer self-end sm:self-center"
          >
            Mengerti
          </button>
        </div>
      )}

      {/* Smart Protection Banner untuk Sesi Sementara / Anonymous Vault */}
      {isUnlinkedSession && !dismissed && (
        <div className="rounded-xl border border-amber-500/35 bg-[#111a2e] px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold text-slate-100">
                Akun masih dalam mode Sesi Lokal-Cloud Sementara
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hubungkan ke Akun Google sekarang agar data permanen, UID terkunci aman, dan bisa
                diakses real-time dari HP maupun Laptop.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleQuickLink}
              disabled={linking}
              className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {linking ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5" />
              )}
              <span>{linking ? 'Menghubungkan...' : 'Hubungkan Google'}</span>
            </button>
            {onOpenCommandCenter && (
              <button
                type="button"
                onClick={() => onOpenCommandCenter('identity')}
                className="px-3 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Pusat Keamanan
              </button>
            )}
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 cursor-pointer transition-colors"
              title="Sembunyikan sementara untuk sesi ini"
              aria-label="Tutup banner sementara"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs font-medium flex items-center justify-between gap-2 ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/70 text-emerald-200'
              : 'border-rose-500/40 bg-rose-950/70 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-current opacity-75 hover:opacity-100 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. SECURITY & SYNC COMMAND CENTER MODAL (DARK & LIGHT MODE READY)
// ============================================================================
interface SecurityCommandCenterProps {
  isOpen: boolean;
  initialSection?: CommandCenterSection;
  onClose: () => void;
}

export const SecurityCommandCenter: React.FC<SecurityCommandCenterProps> = ({
  isOpen,
  initialSection = 'identity',
  onClose,
}) => {
  const {
    currentAccount,
    googleUser,
    firebaseUser,
    syncTelemetry,
    linkCurrentAccountWithGooglePopup,
    buildPersonalBackupPayload,
    restoreFromBankingPayload,
    forceSyncCloudNow,
    resetCloudDataWithReauth,
    ensureAnonymousSessionNow,
  } = useBank();

  const [section, setSection] = useState<CommandCenterSection>(initialSection);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Data subscriptions for UID Private Vault
  const activeUid = auth.currentUser?.uid || firebaseUser?.uid || googleUser?.firebaseUid || '';
  const [snapshots, setSnapshots] = useState<TimeMachineSnapshotRecord[]>([]);
  const [snapshotsLoading, setSnapshotsLoading] = useState<boolean>(true);
  const [auditLogs, setAuditLogs] = useState<SecurityAuditLogRecord[]>([]);
  const [logsLoading, setLogsLoading] = useState<boolean>(true);
  const [devices, setDevices] = useState<DeviceSessionRecord[]>([]);

  // Interactive UI states
  const [copiedKey, setCopiedKey] = useState<'uid' | 'device' | 'hash' | null>(null);
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [bannerNotice, setBannerNotice] = useState<{
    tone: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Backup Export / Import SHA-256 states
  const [lastExportInfo, setLastExportInfo] = useState<{
    filename: string;
    sha256: string;
    exportedAtIso: string;
  } | null>(null);
  const [verifiedImportFile, setVerifiedImportFile] = useState<{
    filename: string;
    backup: SignedJsonBackupFile;
    verifiedHash: string;
  } | null>(null);
  const [importVerifyError, setImportVerifyError] = useState<string | null>(null);
  const [snapshotCustomLabel, setSnapshotCustomLabel] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Audit Log search & filter
  const [auditSearch, setAuditSearch] = useState<string>('');
  const [auditCategory, setAuditCategory] = useState<AuditFilterCategory>('all');

  // Confirmation gate for sensitive cloud reset
  const [confirmResetStep, setConfirmResetStep] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSection(initialSection);
    }
  }, [isOpen, initialSection]);

  useEffect(() => {
    if (!isOpen) return;
    if (!activeUid) {
      setSnapshots([]);
      setAuditLogs([]);
      setDevices([]);
      setSnapshotsLoading(false);
      setLogsLoading(false);
      return;
    }

    setSnapshotsLoading(true);
    setLogsLoading(true);

    const unsubSnaps = subscribeCloudSnapshots(activeUid, (list) => {
      setSnapshots(list);
      setSnapshotsLoading(false);
    });
    const unsubLogs = subscribeSecurityAuditLogs(activeUid, (list) => {
      setAuditLogs(list);
      setLogsLoading(false);
    });
    const unsubDevices = subscribeActiveDevices(activeUid, (list) => {
      setDevices(list);
    });

    return () => {
      unsubSnaps();
      unsubLogs();
      unsubDevices();
    };
  }, [isOpen, activeUid]);

  const filteredAuditLogs = useMemo(() => {
    const q = auditSearch.trim().toLowerCase();
    return auditLogs.filter((log) => {
      if (auditCategory !== 'all' && getAuditCategory(log.eventType) !== auditCategory) {
        return false;
      }
      if (!q) return true;
      return (
        log.summary.toLowerCase().includes(q) ||
        log.deviceLabel.toLowerCase().includes(q) ||
        log.platform.toLowerCase().includes(q) ||
        getAuditEventLabel(log.eventType).toLowerCase().includes(q)
      );
    });
  }, [auditLogs, auditSearch, auditCategory]);

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isGoogleProtected = Boolean(
    (auth.currentUser && !auth.currentUser.isAnonymous && auth.currentUser.email) ||
      (googleUser?.authMode === 'google' && googleUser.email)
  );
  const displayEmail =
    auth.currentUser?.email ||
    googleUser?.email ||
    currentAccount?.googleEmail ||
    'Belum tertaut ke Google';
  const displayName =
    auth.currentUser?.displayName ||
    googleUser?.name ||
    currentAccount?.fullName ||
    'Nasabah Bank Nusantara';
  const avatarPhoto = auth.currentUser?.photoURL || googleUser?.picture || '';
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const handleCopy = async (value: string, key: 'uid' | 'device' | 'hash') => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setBannerNotice({ tone: 'error', text: 'Gagal menyalin ke clipboard browser.' });
    }
  };

  const handleLinkGoogle = async () => {
    setActionBusy('link_google');
    setBannerNotice(null);
    try {
      const res = await linkCurrentAccountWithGooglePopup();
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleInitAnonymousVault = async () => {
    setActionBusy('init_anon');
    setBannerNotice(null);
    try {
      const res = await ensureAnonymousSessionNow();
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleVerifyIdentityNow = async () => {
    setActionBusy('reauth');
    setBannerNotice(null);
    try {
      const res = await requireGoogleReauthentication('Verifikasi manual identitas Google');
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleRevokeOtherDevices = async () => {
    if (!activeUid) return;
    setActionBusy('revoke_devices');
    setBannerNotice(null);
    try {
      const res = await revokeOtherDevicesWithReauth(activeUid);
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleForceSync = async () => {
    setActionBusy('force_sync');
    setBannerNotice(null);
    try {
      const res = await forceSyncCloudNow();
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleCreateManualSnapshot = async () => {
    let targetUid = activeUid;
    if (!targetUid) {
      const anon = await ensureAnonymousSessionNow();
      if (!anon.success || !anon.uid) {
        setBannerNotice({ tone: 'error', text: anon.message });
        return;
      }
      targetUid = anon.uid;
    }

    setActionBusy('create_snapshot');
    setBannerNotice(null);
    try {
      const payload = buildPersonalBackupPayload();
      const res = await createCloudSnapshot(
        targetUid,
        payload,
        'manual',
        snapshotCustomLabel.trim() || undefined
      );
      if (res.success) {
        setSnapshotCustomLabel('');
      }
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleRestoreSnapshot = async (snap: TimeMachineSnapshotRecord) => {
    setActionBusy(`restore_${snap.id}`);
    setBannerNotice(null);
    try {
      const check = await verifySnapshotIntegrity(snap);
      if (!check.valid) {
        setBannerNotice({
          tone: 'error',
          text: 'Hash SHA-256 snapshot ini tidak cocok. Pemulihan dibatalkan demi mencegah korupsi data.',
        });
        return;
      }
      const res = await restoreFromBankingPayload(snap.payload, `Snapshot "${snap.label}"`);
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleExportBackup = async () => {
    setActionBusy('export_json');
    setBannerNotice(null);
    try {
      const payload = buildPersonalBackupPayload();
      const uidForLog = activeUid || payload.profile.uid || 'local-session';
      const result = await exportSignedBackupJson(uidForLog, payload);
      setLastExportInfo({
        filename: result.filename,
        sha256: result.sha256,
        exportedAtIso: result.exportedAtIso,
      });
      setBannerNotice({
        tone: 'success',
        text: `File backup "${result.filename}" berhasil diunduh dengan segel integritas SHA-256.`,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setImportVerifyError(null);
    setVerifiedImportFile(null);
    setActionBusy('verify_import');
    try {
      const text = await file.text();
      const verified = await parseAndVerifyBackupJson(text);
      if (!verified.valid || !verified.backup || !verified.computedHash) {
        setImportVerifyError(verified.error || 'File backup gagal lolos verifikasi SHA-256.');
        return;
      }
      setVerifiedImportFile({
        filename: file.name,
        backup: verified.backup,
        verifiedHash: verified.computedHash,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleConfirmRestoreImport = async () => {
    if (!verifiedImportFile) return;
    setActionBusy('restore_import');
    setBannerNotice(null);
    try {
      const res = await restoreFromBankingPayload(
        verifiedImportFile.backup.payload,
        `Backup JSON (${verifiedImportFile.filename})`
      );
      if (res.success) {
        setVerifiedImportFile(null);
      }
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  const handleExecuteCloudReset = async () => {
    setActionBusy('cloud_reset');
    setBannerNotice(null);
    try {
      const res = await resetCloudDataWithReauth();
      if (res.success) {
        setConfirmResetStep(false);
      }
      setBannerNotice({
        tone: res.success ? 'success' : 'error',
        text: res.message,
      });
    } finally {
      setActionBusy(null);
    }
  };

  // Paired theme tokens (60-30-10 discipline, single-elevation flat borders, WCAG AA contrast)
  const shellBg = isDark
    ? 'bg-[#0b1220] text-slate-100 border-slate-800'
    : 'bg-[#f8fafc] text-slate-900 border-slate-200';
  const surfaceBg = isDark
    ? 'bg-[#111a2e] border-slate-800'
    : 'bg-white border-slate-200';
  const subSurfaceBg = isDark
    ? 'bg-[#0d1526] border-slate-800'
    : 'bg-slate-50 border-slate-200';
  const mutedText = isDark ? 'text-slate-400' : 'text-slate-600';
  const headingText = isDark ? 'text-white' : 'text-slate-950';
  const dividerBorder = isDark ? 'border-slate-800' : 'border-slate-200';

  const navItems: { id: CommandCenterSection; label: string; icon: React.ReactNode }[] = [
    { id: 'identity', label: 'Identitas Google', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
    { id: 'telemetry', label: 'Telemetri Sync', icon: <Cloud className="w-4 h-4 shrink-0" /> },
    { id: 'timemachine', label: 'Time-Machine & Backup', icon: <History className="w-4 h-4 shrink-0" /> },
    { id: 'audit', label: 'Log Keamanan', icon: <KeyRound className="w-4 h-4 shrink-0" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-2 sm:p-4 lg:p-6"
      role="dialog"
      aria-modal="true"
      aria-label="Security & Sync Command Center"
    >
      <div
        className={`w-full max-w-6xl max-h-[92vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-colors ${shellBg}`}
      >
        {/* Top Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-4 shrink-0 ${dividerBorder}`}
        >
          <div className="min-w-0">
            <h2 className={`text-base sm:text-lg font-bold tracking-tight ${headingText}`}>
              Security &amp; Sync Command Center
            </h2>
            <p className={`text-xs mt-0.5 truncate ${mutedText}`}>
              Zero-Trust Cloud Identity · Hybrid Max-Sync Engine · Time-Machine SHA-256
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
              }`}
              title="Ganti tema tampilan Command Center"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span>{isDark ? 'Light' : 'Dark'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-600 hover:text-slate-950 hover:bg-slate-100'
              }`}
              aria-label="Tutup Command Center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Segmented Navigation */}
        <div className={`lg:hidden flex items-center gap-1 p-2 border-b overflow-x-auto shrink-0 ${dividerBorder}`}>
          {navItems.map((item) => {
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  active
                    ? isDark
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-900 text-white'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main 2-Column Workspace */}
        <div className="flex-1 min-h-0 flex overflow-hidden">
          {/* Desktop Sidebar (240px) */}
          <aside className={`hidden lg:flex w-64 shrink-0 flex-col justify-between border-r p-4 ${dividerBorder}`}>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const active = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 text-left whitespace-nowrap cursor-pointer transition-colors ${
                      active
                        ? isDark
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-900 text-white font-bold'
                        : isDark
                        ? 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-950'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className={`pt-4 border-t text-[11px] space-y-1.5 ${dividerBorder} ${mutedText}`}>
              <div className="flex items-center justify-between">
                <span>Project Cloud</span>
                <span className="font-mono font-semibold text-amber-500">azkaakc</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Versi Sync</span>
                <span className="font-mono tabular-nums font-semibold">v{syncTelemetry.syncVersion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Auth Persist</span>
                <span className="font-mono">{getAuthPersistenceMode()}</span>
              </div>
            </div>
          </aside>

          {/* Main Content Viewport */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            {bannerNotice && (
              <div
                className={`rounded-xl border px-4 py-3 text-xs font-medium flex items-center justify-between gap-3 ${
                  bannerNotice.tone === 'success'
                    ? isDark
                      ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
                      : 'border-emerald-300 bg-emerald-50 text-emerald-900'
                    : bannerNotice.tone === 'error'
                    ? isDark
                      ? 'border-rose-500/40 bg-rose-950/60 text-rose-200'
                      : 'border-rose-300 bg-rose-50 text-rose-900'
                    : isDark
                    ? 'border-blue-500/40 bg-blue-950/60 text-blue-200'
                    : 'border-blue-300 bg-blue-50 text-blue-900'
                }`}
              >
                <span>{bannerNotice.text}</span>
                <button
                  type="button"
                  onClick={() => setBannerNotice(null)}
                  className="opacity-75 hover:opacity-100 cursor-pointer shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ============================================================
                PANEL 1: KARTU IDENTITAS GOOGLE, ANTI-LOCKOUT & PERANGKAT
                ============================================================ */}
            {section === 'identity' && (
              <div className="space-y-6">
                <section className={`rounded-xl border p-5 space-y-5 ${surfaceBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      {avatarPhoto ? (
                        <img
                          src={avatarPhoto}
                          alt={`Avatar ${displayName}`}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold text-lg shrink-0 ${
                            isDark ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30' : 'bg-slate-900 text-amber-400'
                          }`}
                        >
                          {initials || 'BN'}
                        </div>
                      )}
                      <div className="min-w-0 space-y-1">
                        <h3 className={`text-base font-bold truncate ${headingText}`}>
                          {displayName}
                        </h3>
                        <p className={`text-xs truncate ${mutedText}`}>{displayEmail}</p>
                        <div className="flex items-center gap-2 text-xs pt-0.5">
                          {isGoogleProtected ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-500">
                              <ShieldCheck className="w-4 h-4 shrink-0" />
                              <span>TERPROTEKSI GOOGLE</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-500">
                              <ShieldAlert className="w-4 h-4 shrink-0" />
                              <span>BELUM TERHUBUNG — SESI SEMENTARA</span>
                            </span>
                          )}
                          {currentAccount?.isOfficialAdminAccount && (
                            <>
                              <span className={mutedText} aria-hidden="true">·</span>
                              <span className={`font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                                Akun OA Resmi Aktif
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {!isGoogleProtected ? (
                        <button
                          type="button"
                          onClick={handleLinkGoogle}
                          disabled={actionBusy === 'link_google'}
                          className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5"
                        >
                          {actionBusy === 'link_google' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          )}
                          <span>Amankan &amp; Hubungkan Akun Google</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleVerifyIdentityNow}
                          disabled={actionBusy === 'reauth'}
                          className={`px-4 py-2.5 rounded-lg border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5 ${
                            isDark
                              ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100'
                              : 'border-slate-300 bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {actionBusy === 'reauth' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Lock className="w-3.5 h-3.5" />
                          )}
                          <span>Verifikasi Ulang Identitas</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* UID & Cryptographic Session Metadata */}
                  <div className={`pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4 ${dividerBorder}`}>
                    <div className={`p-3.5 rounded-lg border ${subSurfaceBg}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-medium ${mutedText}`}>Firebase Cryptographic UID</span>
                        {activeUid && (
                          <button
                            type="button"
                            onClick={() => handleCopy(activeUid, 'uid')}
                            className={`text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                              isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-700 hover:text-amber-800'
                            }`}
                          >
                            {copiedKey === 'uid' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedKey === 'uid' ? 'Tersalin' : 'Salin UID'}</span>
                          </button>
                        )}
                      </div>
                      <p className={`mt-1.5 font-mono text-xs tabular-nums break-all ${headingText}`}>
                        {activeUid || 'Belum diinisialisasi'}
                      </p>
                      {!activeUid && (
                        <button
                          type="button"
                          onClick={handleInitAnonymousVault}
                          disabled={actionBusy === 'init_anon'}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold cursor-pointer"
                        >
                          {actionBusy === 'init_anon' ? 'Menginisialisasi...' : 'Aktifkan Anonymous Vault'}
                        </button>
                      )}
                    </div>

                    <div className={`p-3.5 rounded-lg border ${subSurfaceBg}`}>
                      <span className={`text-xs font-medium block ${mutedText}`}>Kebijakan Anti-Lockout &amp; Identitas</span>
                      <p className={`mt-1.5 text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        Autentikasi eksklusif Google tanpa Email/Password. Akun yang telah tertaut tidak dapat diputus secara tidak sengaja; setiap aksi sensitif mewajibkan verifikasi ulang Google.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Active Devices & Session Revocation */}
                <section className={`rounded-xl border p-5 space-y-4 ${surfaceBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-bold ${headingText}`}>Perangkat &amp; Sesi Aktif</h3>
                      <p className={`text-xs mt-0.5 ${mutedText}`}>
                        Daftar browser yang tercatat mengakses Vault UID Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRevokeOtherDevices}
                      disabled={actionBusy === 'revoke_devices' || !isGoogleProtected}
                      className={`px-3.5 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                        isDark
                          ? 'border-rose-500/40 text-rose-300 hover:bg-rose-950/60'
                          : 'border-rose-300 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Putuskan Sesi Perangkat Lain</span>
                    </button>
                  </div>

                  {devices.length === 0 ? (
                    <p className={`text-xs py-4 ${mutedText}`}>
                      Belum ada sesi perangkat tambahan tercatat selain browser aktif ini ({syncTelemetry.deviceId.slice(0, 14)}...).
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b ${dividerBorder} ${mutedText}`}>
                            <th className="py-2 pr-4 font-semibold">Perangkat</th>
                            <th className="py-2 pr-4 font-semibold">Device ID</th>
                            <th className="py-2 pr-4 font-semibold">Aktif Terakhir</th>
                            <th className="py-2 font-semibold text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {devices.map((dev) => {
                            const isCurrent = dev.deviceId === syncTelemetry.deviceId;
                            return (
                              <tr key={dev.id} className={`border-b last:border-b-0 ${dividerBorder}`}>
                                <td className={`py-2.5 pr-4 font-medium ${headingText}`}>
                                  <div className="flex items-center gap-2">
                                    <Laptop className="w-3.5 h-3.5 opacity-70 shrink-0" />
                                    <span>{dev.deviceLabel}</span>
                                    {isCurrent && (
                                      <span className="text-[11px] text-emerald-500 font-semibold">
                                        (Perangkat Ini)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className={`py-2.5 pr-4 font-mono tabular-nums ${mutedText}`}>
                                  {dev.deviceId.slice(0, 16)}...
                                </td>
                                <td className={`py-2.5 pr-4 font-mono tabular-nums ${mutedText}`}>
                                  {formatDateTimeIndo(dev.lastActiveIso)}
                                </td>
                                <td className="py-2.5 text-right font-semibold">
                                  {dev.revoked ? (
                                    <span className="text-rose-500">Diputus</span>
                                  ) : (
                                    <span className="text-emerald-500">Aktif</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>

                {/* Sensitive Cloud Reset Zone (Mandatory Re-Authentication) */}
                <section className={`rounded-xl border p-5 space-y-3 ${isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50/60 border-rose-200'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-rose-200' : 'text-rose-900'}`}>
                        Zona Sensitif: Reset Seluruh Data Cloud
                      </h3>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-rose-200/75' : 'text-rose-800'}`}>
                        Memerlukan verifikasi ulang Google. Sistem otomatis membuat checkpoint Time-Machine sebelum reset dijalankan.
                      </p>
                    </div>
                    {!confirmResetStep ? (
                      <button
                        type="button"
                        onClick={() => setConfirmResetStep(true)}
                        className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Reset Data Cloud</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={handleExecuteCloudReset}
                          disabled={actionBusy === 'cloud_reset'}
                          className="px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
                        >
                          {actionBusy === 'cloud_reset'
                            ? 'Memverifikasi Google...'
                            : 'Verifikasi Google & Reset'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmResetStep(false)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${
                            isDark
                              ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-300 text-slate-700 hover:bg-white'
                          }`}
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {/* ============================================================
                PANEL 2: TELEMETRI SINKRONISASI REAL-TIME
                ============================================================ */}
            {section === 'telemetry' && (
              <div className="space-y-6">
                <section className={`rounded-xl border p-5 space-y-5 ${surfaceBg}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className={`text-base font-bold ${headingText}`}>
                        Status Mesin Sinkronisasi (Max-Sync Engine)
                      </h3>
                      <p className={`text-xs ${mutedText}`}>
                        Sinkronisasi dua arah real-time lintas perangkat dengan perlindungan anti-timpa berbasis versi.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleForceSync}
                      disabled={actionBusy === 'force_sync'}
                      className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${actionBusy === 'force_sync' ? 'animate-spin' : ''}`} />
                      <span>{actionBusy === 'force_sync' ? 'Menyinkronkan...' : 'Paksa Sinkronisasi Sekarang'}</span>
                    </button>
                  </div>

                  {/* Live Status Summary Strip */}
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subSurfaceBg}`}>
                    <div className="flex items-center gap-3">
                      {syncTelemetry.status === 'synced' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      )}
                      {syncTelemetry.status === 'syncing' && (
                        <RefreshCw className="w-5 h-5 text-blue-500 animate-spin shrink-0" />
                      )}
                      {syncTelemetry.status === 'offline' && (
                        <CloudOff className="w-5 h-5 text-amber-500 shrink-0" />
                      )}
                      {syncTelemetry.status === 'error' && (
                        <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                      )}
                      <div>
                        <p className={`text-sm font-bold ${headingText}`}>
                          {syncTelemetry.status === 'synced' && 'Tersinkronisasi (Cloud Verified)'}
                          {syncTelemetry.status === 'syncing' &&
                            `Menyinkronkan Perubahan (${Math.max(1, syncTelemetry.pendingWritesCount)} antrean)`}
                          {syncTelemetry.status === 'offline' && 'Mode Offline (Tersimpan Aman di Perangkat)'}
                          {syncTelemetry.status === 'error' && 'Gangguan Sinkronisasi Cloud'}
                        </p>
                        <p className={`text-xs mt-0.5 ${mutedText}`}>
                          {syncTelemetry.lastError ||
                            `Sinkronisasi terakhir terverifikasi: ${formatDateTimeIndo(syncTelemetry.lastSyncedAt)}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Telemetry Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl border ${subSurfaceBg}`}>
                      <span className={`text-xs block ${mutedText}`}>Device ID Aktif</span>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className={`font-mono text-xs tabular-nums truncate ${headingText}`}>
                          {syncTelemetry.deviceId}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(syncTelemetry.deviceId, 'device')}
                          className="text-amber-500 hover:text-amber-400 cursor-pointer shrink-0"
                          title="Salin Device ID"
                        >
                          {copiedKey === 'device' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl border ${subSurfaceBg}`}>
                      <span className={`text-xs block ${mutedText}`}>Dokumen Tersinkronisasi</span>
                      <p className={`mt-1.5 font-mono text-lg font-bold tabular-nums ${headingText}`}>
                        {syncTelemetry.syncedDocCount.toLocaleString('id-ID')}
                      </p>
                      <span className={`text-[11px] font-mono tabular-nums ${mutedText}`}>
                        Versi Konkurensi v{syncTelemetry.syncVersion}
                      </span>
                    </div>

                    <div className={`p-4 rounded-xl border ${subSurfaceBg}`}>
                      <span className={`text-xs block ${mutedText}`}>Cache Offline IndexedDB</span>
                      <p className={`mt-1.5 text-sm font-bold ${syncTelemetry.indexedDbActive ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {syncTelemetry.indexedDbActive ? 'Aktif · Multi-Tab' : 'Mode Memori'}
                      </p>
                      <span className={`text-[11px] ${mutedText}`}>
                        fromCache: {syncTelemetry.fromCache ? 'ya' : 'server'}
                      </span>
                    </div>

                    <div className={`p-4 rounded-xl border ${subSurfaceBg}`}>
                      <span className={`text-xs block ${mutedText}`}>Mesin Cloud Aktif</span>
                      <p className={`mt-1.5 text-sm font-bold flex items-center gap-1.5 ${headingText}`}>
                        <Database className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>
                          {syncTelemetry.engineMode === 'hybrid_rtdb_firestore'
                            ? 'Hybrid RTDB + Firestore'
                            : 'RTDB azkaakc + IDB'}
                        </span>
                      </p>
                      <span className={`text-[11px] ${mutedText}`}>asia-southeast1</span>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ============================================================
                PANEL 3: TIME-MACHINE SNAPSHOT (MAX 5) & BACKUP SHA-256
                ============================================================ */}
            {section === 'timemachine' && (
              <div className="space-y-6">
                {/* Rolling Cloud Snapshots */}
                <section className={`rounded-xl border p-5 space-y-4 ${surfaceBg}`}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-base font-bold ${headingText}`}>
                        Time-Machine Cloud Snapshots (Maksimal {MAX_ROLLING_SNAPSHOTS} Versi)
                      </h3>
                      <p className={`text-xs mt-0.5 ${mutedText}`}>
                        Checkpoint otomatis tercipta sebelum aksi besar &amp; restore. Pemulihan dilindungi verifikasi SHA-256 dan re-autentikasi Google.
                      </p>
                    </div>
                  </div>

                  {/* Manual Checkpoint Creator */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={snapshotCustomLabel}
                      onChange={(e) => setSnapshotCustomLabel(e.target.value)}
                      placeholder="Label opsional (mis. Sebelum Transfer Besar)..."
                      maxLength={80}
                      className={`flex-1 px-3.5 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-amber-400/50 ${
                        isDark
                          ? 'bg-[#0b1220] border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleCreateManualSnapshot}
                      disabled={actionBusy === 'create_snapshot'}
                      className="px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                    >
                      {actionBusy === 'create_snapshot' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <History className="w-3.5 h-3.5" />
                      )}
                      <span>Buat Snapshot Sekarang</span>
                    </button>
                  </div>

                  {/* Snapshot List (Loading / Empty / Populated) */}
                  {snapshotsLoading ? (
                    <div className="space-y-2 py-2">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          className={`h-14 rounded-lg animate-pulse ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/70'}`}
                        />
                      ))}
                    </div>
                  ) : snapshots.length === 0 ? (
                    <div className={`rounded-xl border border-dashed p-6 text-center space-y-2 ${dividerBorder}`}>
                      <p className={`text-sm font-semibold ${headingText}`}>Belum ada checkpoint snapshot cloud</p>
                      <p className={`text-xs ${mutedText}`}>
                        Buat checkpoint pertama sekarang untuk mengaktifkan titik pemulihan Time-Machine.
                      </p>
                    </div>
                  ) : (
                    <div className={`divide-y border rounded-xl overflow-hidden ${dividerBorder}`}>
                      {snapshots.map((snap, idx) => (
                        <div
                          key={snap.id}
                          className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subSurfaceBg}`}
                        >
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-mono text-xs font-bold tabular-nums ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                #{idx + 1}
                              </span>
                              <span className={`text-xs font-bold truncate ${headingText}`}>
                                {snap.label}
                              </span>
                            </div>
                            <div className={`text-[11px] flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono tabular-nums ${mutedText}`}>
                              <span>{formatDateTimeIndo(snap.createdAtIso)}</span>
                              <span aria-hidden="true">·</span>
                              <span>{snap.accountCount} kartu</span>
                              <span aria-hidden="true">·</span>
                              <span>{snap.transactionCount} mutasi</span>
                              <span aria-hidden="true">·</span>
                              <span>{formatRupiah(snap.totalBalance)}</span>
                              <span aria-hidden="true">·</span>
                              <span>SHA-256: {snap.sha256.slice(0, 12)}...</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRestoreSnapshot(snap)}
                            disabled={actionBusy === `restore_${snap.id}`}
                            className={`px-3.5 py-2 rounded-lg border text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5 ${
                              isDark
                                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100'
                                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900'
                            }`}
                          >
                            {actionBusy === `restore_${snap.id}` ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="w-3.5 h-3.5" />
                            )}
                            <span>Pulihkan Versi Ini</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Crypto-Verified JSON Export & Import */}
                <section className={`rounded-xl border p-5 space-y-4 ${surfaceBg}`}>
                  <div>
                    <h3 className={`text-base font-bold ${headingText}`}>
                      Backup JSON Terverifikasi Kriptografis (SHA-256)
                    </h3>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Mencakup profil akun, kartu, saldo, mutasi, kantong, emas 24K, anggaran, dan pengaturan. Hash SHA-256 dihitung via Web Crypto API.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleExportBackup}
                      disabled={actionBusy === 'export_json'}
                      className="px-4 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold whitespace-nowrap cursor-pointer transition-colors disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Backup (SHA-256)</span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleImportFileSelected}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={actionBusy === 'verify_import'}
                      className={`px-4 py-2.5 rounded-lg border text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors flex items-center gap-1.5 ${
                        isDark
                          ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-100'
                          : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import &amp; Verifikasi Backup</span>
                    </button>
                  </div>

                  {lastExportInfo && (
                    <div className={`p-3.5 rounded-xl border space-y-1 ${subSurfaceBg}`}>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={`font-semibold ${headingText}`}>
                          Berhasil Diekspor: {lastExportInfo.filename}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(lastExportInfo.sha256, 'hash')}
                          className="text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey === 'hash' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedKey === 'hash' ? 'Tersalin' : 'Salin Hash'}</span>
                        </button>
                      </div>
                      <p className={`font-mono text-[11px] break-all ${mutedText}`}>
                        SHA-256: {lastExportInfo.sha256}
                      </p>
                    </div>
                  )}

                  {importVerifyError && (
                    <div
                      className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                        isDark
                          ? 'border-rose-500/50 bg-rose-950/60 text-rose-200'
                          : 'border-rose-300 bg-rose-50 text-rose-900'
                      }`}
                    >
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="leading-relaxed font-medium">{importVerifyError}</p>
                    </div>
                  )}

                  {verifiedImportFile && (
                    <div
                      className={`p-4 rounded-xl border space-y-3 ${
                        isDark
                          ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-100'
                          : 'border-emerald-300 bg-emerald-50 text-emerald-950'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <FileCheck2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                        <div className="min-w-0 space-y-1">
                          <p className="text-xs font-bold">
                            Integritas SHA-256 Terverifikasi Valid — {verifiedImportFile.filename}
                          </p>
                          <p className="text-[11px] font-mono tabular-nums opacity-85 break-all">
                            Hash Cocok: {verifiedImportFile.verifiedHash}
                          </p>
                          <p className="text-xs opacity-90">
                            Isi Paket: {verifiedImportFile.backup.payload.accounts.length} kartu ·{' '}
                            {verifiedImportFile.backup.payload.transactions.length} mutasi ·{' '}
                            {verifiedImportFile.backup.payload.pockets.length} kantong · Diekspor{' '}
                            {formatDateTimeIndo(verifiedImportFile.backup.exportedAtIso)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmRestoreImport}
                          disabled={actionBusy === 'restore_import'}
                          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
                        >
                          {actionBusy === 'restore_import'
                            ? 'Memverifikasi Google & Memulihkan...'
                            : 'Konfirmasi & Pulihkan ke Cloud'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setVerifiedImportFile(null)}
                          className="px-3 py-2 rounded-lg border border-current/25 text-xs font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </div>
            )}

            {/* ============================================================
                PANEL 4: IMMUTABLE SECURITY AUDIT TRAIL
                ============================================================ */}
            {section === 'audit' && (
              <section className={`rounded-xl border p-5 space-y-4 ${surfaceBg}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className={`text-base font-bold ${headingText}`}>
                      Log Aktivitas Keamanan (Immutable Audit Trail)
                    </h3>
                    <p className={`text-xs mt-0.5 ${mutedText}`}>
                      Merekam login, penautan Google, Atomic Merge, perangkat baru, snapshot, dan ekspor/impor backup.
                    </p>
                  </div>
                </div>

                {/* Search & Category Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${mutedText}`} />
                    <input
                      type="text"
                      value={auditSearch}
                      onChange={(e) => setAuditSearch(e.target.value)}
                      placeholder="Cari peristiwa, perangkat, atau platform..."
                      className={`w-full pl-9 pr-3 py-2 rounded-lg border text-xs outline-none focus:ring-2 focus:ring-amber-400/50 ${
                        isDark
                          ? 'bg-[#0b1220] border-slate-700 text-white placeholder:text-slate-500'
                          : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                      }`}
                    />
                  </div>
                  <div className={`flex items-center gap-1 p-1 rounded-lg border overflow-x-auto ${subSurfaceBg}`}>
                    {(
                      [
                        { key: 'all', label: 'Semua' },
                        { key: 'auth', label: 'Auth' },
                        { key: 'device', label: 'Perangkat' },
                        { key: 'backup', label: 'Backup' },
                        { key: 'sensitive', label: 'Sensitif' },
                      ] as { key: AuditFilterCategory; label: string }[]
                    ).map((tab) => (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => setAuditCategory(tab.key)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                          auditCategory === tab.key
                            ? isDark
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-900 text-white'
                            : mutedText
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chronological Table */}
                {logsLoading ? (
                  <div className="space-y-2 py-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-10 rounded-lg animate-pulse ${isDark ? 'bg-slate-800/70' : 'bg-slate-200/70'}`}
                      />
                    ))}
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className={`rounded-xl border border-dashed p-6 text-center space-y-1 ${dividerBorder}`}>
                    <p className={`text-sm font-semibold ${headingText}`}>Belum ada catatan log yang cocok</p>
                    <p className={`text-xs ${mutedText}`}>
                      Aktivitas keamanan baru seperti login Google, penautan akun, dan snapshot akan langsung tercatat di sini.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className={`border-b ${dividerBorder} ${mutedText}`}>
                          <th className="py-2 pr-4 font-semibold whitespace-nowrap">Waktu</th>
                          <th className="py-2 pr-4 font-semibold whitespace-nowrap">Peristiwa</th>
                          <th className="py-2 pr-4 font-semibold">Ringkasan</th>
                          <th className="py-2 pr-4 font-semibold whitespace-nowrap">Perangkat</th>
                          <th className="py-2 font-semibold text-right whitespace-nowrap">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAuditLogs.map((log) => (
                          <tr
                            key={log.id}
                            className={`border-b last:border-b-0 transition-colors ${dividerBorder} ${
                              isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className={`py-2.5 pr-4 font-mono tabular-nums whitespace-nowrap ${mutedText}`}>
                              {formatDateTimeIndo(log.createdAtIso)}
                            </td>
                            <td className={`py-2.5 pr-4 font-semibold whitespace-nowrap ${headingText}`}>
                              {getAuditEventLabel(log.eventType)}
                            </td>
                            <td className={`py-2.5 pr-4 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                              {log.summary}
                            </td>
                            <td className={`py-2.5 pr-4 whitespace-nowrap ${mutedText}`}>
                              {log.deviceLabel}
                            </td>
                            <td className="py-2.5 text-right font-semibold whitespace-nowrap">
                              {log.status === 'blocked' ? (
                                <span className="text-rose-500">Diblokir</span>
                              ) : log.status === 'warning' ? (
                                <span className="text-amber-500">Peringatan</span>
                              ) : (
                                <span className="text-emerald-500">Sukses</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
