/**
 * Real-Time WebSocket + REST Synchronization Store for:
 * 1. Real-Time Visitor Analytics (`global_visits`, `account_visits`, `device_sessions`)
 * 2. Granular Admin Card Tier Promotion & Per-Tab RBAC (`adminTierGrantsMap`, `adminTierAuditLogs`)
 * 3. Instant Official Promotion Letter Push Notifications
 */

import { useEffect, useState, useCallback } from 'react';
import type {
  DeviceReviewStatus,
  VisitorAnalyticsStatePayload,
} from '../services/visitorTracker';
import type {
  AdminTierAuditLogEntry,
  AdminTierGrantRecord,
  AdminTierOfficialLetterPayload,
  AdminPortalTabKey,
} from '../types/adminAnalyticsAndTier';

export interface AdminAnalyticsAndTierSyncState {
  visitorAnalytics: VisitorAnalyticsStatePayload;
  adminTierGrantsMap: Record<string, AdminTierGrantRecord>;
  adminTierAuditLogs: AdminTierAuditLogEntry[];
  pendingOfficialLetter: AdminTierOfficialLetterPayload | null;
  wsConnected: boolean;
  lastSyncedAtMs: number;
}

const EMPTY_VISITOR_ANALYTICS: VisitorAnalyticsStatePayload = {
  globalVisits: [],
  accountVisitsMap: {},
  deviceSessionsMap: {},
  totalAllTimeHits: 0,
  updatedAtMs: 0,
};

// Module-level shared store so App, Navbar, AdminPortal, and Admin tabs share 1 WebSocket connection
let sharedState: AdminAnalyticsAndTierSyncState = {
  visitorAnalytics: EMPTY_VISITOR_ANALYTICS,
  adminTierGrantsMap: {},
  adminTierAuditLogs: [],
  pendingOfficialLetter: null,
  wsConnected: false,
  lastSyncedAtMs: 0,
};

const listeners = new Set<() => void>();
let wsInstance: WebSocket | null = null;
let reconnectTimer: number | null = null;
let initialized = false;
const dismissedLetterIds = new Set<string>();

function notifyListeners() {
  listeners.forEach((cb) => {
    try {
      cb();
    } catch {
      // ignore
    }
  });
}

function updateSharedState(partial: Partial<AdminAnalyticsAndTierSyncState>) {
  sharedState = {
    ...sharedState,
    ...partial,
    lastSyncedAtMs: Date.now(),
  };
  notifyListeners();
}

async function fetchInitialRestState() {
  try {
    const [vaRes, grantsRes] = await Promise.all([
      fetch('/api/visitor-analytics/state').catch(() => null),
      fetch('/api/admin-tier-grants/state').catch(() => null),
    ]);

    const nextPartial: Partial<AdminAnalyticsAndTierSyncState> = {};

    if (vaRes && vaRes.ok) {
      const vaData = (await vaRes.json()) as {
        success?: boolean;
        visitorAnalytics?: VisitorAnalyticsStatePayload;
      };
      if (vaData.visitorAnalytics) {
        nextPartial.visitorAnalytics = vaData.visitorAnalytics;
      }
    }

    if (grantsRes && grantsRes.ok) {
      const gData = (await grantsRes.json()) as {
        success?: boolean;
        adminTierGrantsMap?: Record<string, AdminTierGrantRecord>;
        adminTierAuditLogs?: AdminTierAuditLogEntry[];
      };
      if (gData.adminTierGrantsMap) {
        nextPartial.adminTierGrantsMap = gData.adminTierGrantsMap;
      }
      if (Array.isArray(gData.adminTierAuditLogs)) {
        nextPartial.adminTierAuditLogs = gData.adminTierAuditLogs;
      }
    }

    if (Object.keys(nextPartial).length > 0) {
      updateSharedState(nextPartial);
    }
  } catch {
    // ignore startup fetch error
  }
}

function connectSharedWebSocket() {
  if (typeof window === 'undefined') return;
  if (
    wsInstance &&
    (wsInstance.readyState === WebSocket.OPEN || wsInstance.readyState === WebSocket.CONNECTING)
  ) {
    return;
  }

  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsInstance = ws;

    ws.onopen = () => {
      updateSharedState({ wsConnected: true });
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(String(evt.data || '{}')) as {
          type?: string;
          payload?: Record<string, unknown>;
        };
        if (!msg.type || !msg.payload) return;

        if (msg.type === 'init') {
          const p = msg.payload;
          const partial: Partial<AdminAnalyticsAndTierSyncState> = {};
          if (p.visitorAnalytics && typeof p.visitorAnalytics === 'object') {
            partial.visitorAnalytics = p.visitorAnalytics as VisitorAnalyticsStatePayload;
          }
          if (p.adminTierGrantsMap && typeof p.adminTierGrantsMap === 'object') {
            partial.adminTierGrantsMap = p.adminTierGrantsMap as Record<string, AdminTierGrantRecord>;
          }
          if (Array.isArray(p.adminTierAuditLogs)) {
            partial.adminTierAuditLogs = p.adminTierAuditLogs as AdminTierAuditLogEntry[];
          }
          if (Object.keys(partial).length > 0) {
            updateSharedState(partial);
          }
        } else if (msg.type === 'visitor_analytics:updated') {
          const va = msg.payload as unknown as VisitorAnalyticsStatePayload;
          if (va && typeof va === 'object') {
            updateSharedState({ visitorAnalytics: va });
          }
        } else if (msg.type === 'admin_tier_grants:updated') {
          const p = msg.payload as {
            adminTierGrantsMap?: Record<string, AdminTierGrantRecord>;
            adminTierAuditLogs?: AdminTierAuditLogEntry[];
          };
          const partial: Partial<AdminAnalyticsAndTierSyncState> = {};
          if (p.adminTierGrantsMap) partial.adminTierGrantsMap = p.adminTierGrantsMap;
          if (Array.isArray(p.adminTierAuditLogs)) partial.adminTierAuditLogs = p.adminTierAuditLogs;
          updateSharedState(partial);
        } else if (msg.type === 'admin_tier_letter:push') {
          const letter = msg.payload as unknown as AdminTierOfficialLetterPayload;
          if (letter?.id && !dismissedLetterIds.has(letter.id)) {
            updateSharedState({ pendingOfficialLetter: letter });
          }
        }
      } catch {
        // ignore malformed WS frames
      }
    };

    ws.onclose = () => {
      wsInstance = null;
      updateSharedState({ wsConnected: false });
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      reconnectTimer = window.setTimeout(() => {
        connectSharedWebSocket();
      }, 3500);
    };

    ws.onerror = () => {
      // handled in onclose
    };
  } catch {
    // ignore WS init failures
  }
}

function ensureStoreInitialized() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  void fetchInitialRestState();
  connectSharedWebSocket();
}

export function dismissOfficialPromotionLetter(letterId?: string) {
  if (letterId) dismissedLetterIds.add(letterId);
  updateSharedState({ pendingOfficialLetter: null });
}

export async function refreshAdminAnalyticsAndTierState(): Promise<void> {
  await fetchInitialRestState();
}

export async function apiSetDeviceReviewStatus(params: {
  sessionKey: string;
  reviewStatus: DeviceReviewStatus;
  reviewNote?: string;
  adminActorEmail: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/visitor-analytics/device-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      visitorAnalytics?: VisitorAnalyticsStatePayload;
    };
    if (data.visitorAnalytics) {
      updateSharedState({ visitorAnalytics: data.visitorAnalytics });
    }
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'Status perangkat diperbarui.' : 'Gagal memperbarui status.'),
    };
  } catch {
    return { success: false, message: 'Gagal terhubung ke server.' };
  }
}

export async function apiResetVisitorAnalytics(params: {
  confirmPhrase: string;
  adminActorName: string;
  adminActorEmail: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/visitor-analytics/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      visitorAnalytics?: VisitorAnalyticsStatePayload;
    };
    if (data.visitorAnalytics) {
      updateSharedState({ visitorAnalytics: data.visitorAnalytics });
    }
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'Data kunjungan berhasil direset.' : 'Reset ditolak.'),
    };
  } catch {
    return { success: false, message: 'Gagal terhubung ke server.' };
  }
}

export async function apiUpsertAdminTierGrants(params: {
  grants: Array<
    Omit<AdminTierGrantRecord, 'grantedAtIso' | 'grantedAtMs' | 'updatedAtIso' | 'updatedAtMs' | 'officialLetterNonce' | 'trustedDeviceAlertCount'>
  >;
  actorName: string;
  actorEmail: string;
  isBulk?: boolean;
  sendOfficialLetter?: boolean;
}): Promise<{
  success: boolean;
  message: string;
  updatedCount?: number;
}> {
  try {
    const res = await fetch('/api/admin-tier-grants/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      updatedCount?: number;
      adminTierGrantsMap?: Record<string, AdminTierGrantRecord>;
      adminTierAuditLogs?: AdminTierAuditLogEntry[];
    };
    if (data.adminTierGrantsMap) {
      updateSharedState({
        adminTierGrantsMap: data.adminTierGrantsMap,
        ...(Array.isArray(data.adminTierAuditLogs) ? { adminTierAuditLogs: data.adminTierAuditLogs } : {}),
      });
    }
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'Izin Kartu Tier Admin berhasil disimpan.' : 'Gagal menyimpan izin.'),
      updatedCount: data.updatedCount,
    };
  } catch {
    return { success: false, message: 'Gagal menghubungi server.' };
  }
}

export async function apiToggleFreezeAdminTierGrant(params: {
  accountIds: string[];
  freeze: boolean;
  reason?: string;
  actorName: string;
  actorEmail: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin-tier-grants/freeze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      adminTierGrantsMap?: Record<string, AdminTierGrantRecord>;
      adminTierAuditLogs?: AdminTierAuditLogEntry[];
    };
    if (data.adminTierGrantsMap) {
      updateSharedState({
        adminTierGrantsMap: data.adminTierGrantsMap,
        ...(Array.isArray(data.adminTierAuditLogs) ? { adminTierAuditLogs: data.adminTierAuditLogs } : {}),
      });
    }
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'Status akses Admin diperbarui.' : 'Gagal memperbarui status.'),
    };
  } catch {
    return { success: false, message: 'Gagal menghubungi server.' };
  }
}

export async function apiRevokeAdminTierGrant(params: {
  accountId: string;
  actorName: string;
  actorEmail: string;
  reason: string;
  restoredTierLabel: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/admin-tier-grants/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as {
      success?: boolean;
      message?: string;
      adminTierGrantsMap?: Record<string, AdminTierGrantRecord>;
      adminTierAuditLogs?: AdminTierAuditLogEntry[];
    };
    if (data.adminTierGrantsMap) {
      updateSharedState({
        adminTierGrantsMap: data.adminTierGrantsMap,
        ...(Array.isArray(data.adminTierAuditLogs) ? { adminTierAuditLogs: data.adminTierAuditLogs } : {}),
      });
    }
    return {
      success: Boolean(data.success),
      message: data.message || (data.success ? 'Akses Kartu Tier Admin dicabut.' : 'Gagal mencabut akses.'),
    };
  } catch {
    return { success: false, message: 'Gagal menghubungi server.' };
  }
}

export async function apiLogDelegatedAdminTabActivity(params: {
  accountId: string;
  accountName: string;
  accountNumber: string;
  accountEmail: string;
  tabKey: AdminPortalTabKey;
  detail: string;
}): Promise<void> {
  try {
    await fetch('/api/admin-tier-grants/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  } catch {
    // non-blocking
  }
}

export function useAdminAnalyticsAndTierSync(): AdminAnalyticsAndTierSyncState & {
  refresh: () => Promise<void>;
  dismissLetter: (letterId?: string) => void;
} {
  const [state, setState] = useState<AdminAnalyticsAndTierSyncState>(() => sharedState);

  useEffect(() => {
    ensureStoreInitialized();
    const onChange = () => setState({ ...sharedState });
    listeners.add(onChange);
    // Sync immediately in case state updated before effect attached
    setState({ ...sharedState });
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  const refresh = useCallback(async () => {
    await refreshAdminAnalyticsAndTierState();
  }, []);

  const dismissLetter = useCallback((letterId?: string) => {
    dismissOfficialPromotionLetter(letterId);
  }, []);

  return {
    ...state,
    refresh,
    dismissLetter,
  };
}
