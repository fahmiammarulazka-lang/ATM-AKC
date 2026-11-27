/**
 * Server-Side Real-Time Visitor Analytics & Admin Card Tier RBAC Engine
 * ---------------------------------------------------------------------------
 * - Handles 3 separate collections: `global_visits`, `account_visits`, `device_sessions`
 * - Server-side IP extraction + SSRF-safe allowlisted GeoIP lookup + timezone fallback
 * - 45-second Heartbeat Offline sweep + Real-Time WebSocket broadcast
 * - Granular Per-Tab Admin Card Tier Promotion registry, Owner lock protection,
 *   timed contract auto-expiration, trusted device alerts, and audit logging.
 */

import type { Express, Request, Response } from 'express';

export interface ServerVisitorAnalyticsState {
  globalVisits: Array<Record<string, unknown>>;
  accountVisitsMap: Record<string, Record<string, unknown>>;
  deviceSessionsMap: Record<string, Record<string, unknown>>;
  totalAllTimeHits: number;
  updatedAtMs: number;
}

export const DEFAULT_VISITOR_ANALYTICS_STATE: ServerVisitorAnalyticsState = {
  globalVisits: [],
  accountVisitsMap: {},
  deviceSessionsMap: {},
  totalAllTimeHits: 0,
  updatedAtMs: 0,
};

const OFFLINE_TIMEOUT_MS = 45_000;
const PRIMARY_OWNER_EMAIL = 'fahmiammarulazka@gmail.com';

function cleanStr(val: unknown, maxLen = 200): string {
  return String(val ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen);
}

function getWibDateParts(tsMs: number): { dateKey: string; monthKey: string; hourOfDay: number } {
  try {
    const d = new Date(tsMs);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false,
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
    const year = get('year');
    const month = get('month');
    const day = get('day');
    const hourRaw = Number(get('hour'));
    const hourOfDay = Number.isFinite(hourRaw) ? hourRaw % 24 : d.getHours();
    return {
      dateKey: `${year}-${month}-${day}`,
      monthKey: `${year}-${month}`,
      hourOfDay,
    };
  } catch {
    const d = new Date(tsMs);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return {
      dateKey: `${y}-${m}-${day}`,
      monthKey: `${y}-${m}`,
      hourOfDay: d.getHours(),
    };
  }
}

function isPrivateOrInvalidIp(ip: string): boolean {
  const clean = ip.trim().replace(/^::ffff:/i, '');
  if (!clean) return true;
  if (clean === '::1' || clean === 'localhost' || clean === '0.0.0.0') return true;
  // IPv4 private / loopback / link-local
  if (/^127\./.test(clean)) return true;
  if (/^10\./.test(clean)) return true;
  if (/^192\.168\./.test(clean)) return true;
  if (/^169\.254\./.test(clean)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(clean)) return true;
  // IPv6 private / link-local
  if (/^(fc|fd|fe80)/i.test(clean)) return true;
  // Must look like valid IPv4 or IPv6
  const isV4 = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(clean);
  const isV6 = /^[0-9a-fA-F:]{3,45}$/.test(clean) && clean.includes(':');
  return !isV4 && !isV6;
}

function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  const cfIp = req.headers['cf-connecting-ip'];
  const realIp = req.headers['x-real-ip'];
  const candidate =
    (typeof cfIp === 'string' && cfIp.trim()) ||
    (typeof forwarded === 'string' && forwarded.split(',')[0]?.trim()) ||
    (typeof realIp === 'string' && realIp.trim()) ||
    req.socket?.remoteAddress ||
    '';
  return candidate.replace(/^::ffff:/i, '').trim() || '127.0.0.1';
}

interface GeoIpInfo {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  fetchedAtMs: number;
}

const geoIpCache = new Map<string, GeoIpInfo>();

function inferGeoFromTimezone(timezone: string, rawIp: string): GeoIpInfo {
  const tz = (timezone || 'Asia/Jakarta').trim();
  const tzMap: Record<string, { city: string; region: string; country: string; code: string }> = {
    'Asia/Jakarta': { city: 'Jakarta (WIB)', region: 'DKI Jakarta', country: 'Indonesia', code: 'ID' },
    'Asia/Makassar': { city: 'Makassar (WITA)', region: 'Sulawesi Selatan', country: 'Indonesia', code: 'ID' },
    'Asia/Jayapura': { city: 'Jayapura (WIT)', region: 'Papua', country: 'Indonesia', code: 'ID' },
    'Asia/Pontianak': { city: 'Pontianak (WIB)', region: 'Kalimantan Barat', country: 'Indonesia', code: 'ID' },
    'Asia/Singapore': { city: 'Singapore', region: 'Central Region', country: 'Singapore', code: 'SG' },
    'Asia/Kuala_Lumpur': { city: 'Kuala Lumpur', region: 'Wilayah Persekutuan', country: 'Malaysia', code: 'MY' },
    'Asia/Tokyo': { city: 'Tokyo', region: 'Kanto', country: 'Japan', code: 'JP' },
  };
  const match = tzMap[tz];
  if (match) {
    return {
      ip: rawIp || '127.0.0.1',
      city: match.city,
      region: match.region,
      country: match.country,
      countryCode: match.code,
      isp: isPrivateOrInvalidIp(rawIp) ? 'Jaringan Lokal / Gateway Proxy' : 'ISP Terdeteksi (Fallback TZ)',
      fetchedAtMs: Date.now(),
    };
  }
  const cityPart = tz.includes('/') ? tz.split('/')[1].replace(/_/g, ' ') : tz;
  return {
    ip: rawIp || '127.0.0.1',
    city: cityPart || 'Tidak Diketahui',
    region: tz.includes('/') ? tz.split('/')[0] : '-',
    country: 'Internasional',
    countryCode: 'INTL',
    isp: isPrivateOrInvalidIp(rawIp) ? 'Jaringan Lokal / Gateway Proxy' : 'ISP Umum',
    fetchedAtMs: Date.now(),
  };
}

async function resolveGeoIpServerSide(rawIp: string, timezone: string): Promise<GeoIpInfo> {
  if (isPrivateOrInvalidIp(rawIp)) {
    return inferGeoFromTimezone(timezone, rawIp);
  }

  const cached = geoIpCache.get(rawIp);
  if (cached && Date.now() - cached.fetchedAtMs < 60 * 60 * 1000) {
    return cached;
  }

  // Strict allowlisted public GeoIP provider (SSRF-safe: validated public IP literal only)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2400);
  try {
    const resp = await fetch(`https://ipwho.is/${encodeURIComponent(rawIp)}`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (resp.ok) {
      const data = (await resp.json()) as {
        success?: boolean;
        city?: string;
        region?: string;
        country?: string;
        country_code?: string;
        connection?: { isp?: string; org?: string };
      };
      if (data && data.success !== false && (data.city || data.country)) {
        const resolved: GeoIpInfo = {
          ip: rawIp,
          city: cleanStr(data.city || 'Tidak Diketahui', 80),
          region: cleanStr(data.region || '-', 80),
          country: cleanStr(data.country || 'Indonesia', 80),
          countryCode: cleanStr(data.country_code || 'ID', 8),
          isp: cleanStr(data.connection?.isp || data.connection?.org || 'ISP Publik', 120),
          fetchedAtMs: Date.now(),
        };
        geoIpCache.set(rawIp, resolved);
        return resolved;
      }
    }
  } catch {
    // timeout or offline fallback
  } finally {
    clearTimeout(timer);
  }

  const fallback = inferGeoFromTimezone(timezone, rawIp);
  geoIpCache.set(rawIp, fallback);
  return fallback;
}

function makeLocationKey(city: string, region: string, country: string): string {
  const norm = `${city}|${region}|${country}`
    .toLowerCase()
    .replace(/[^a-z0-9|]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 80);
  return norm || 'unknown_loc';
}

function isProtectedOwnerTarget(accountId: string, accountEmail?: string, accountNumber?: string): boolean {
  const em = cleanStr(accountEmail, 160).toLowerCase();
  if (em === PRIMARY_OWNER_EMAIL) return true;
  if (accountId === 'acc-oa-admin' || accountNumber === '9999999999') return true;
  return false;
}

export function attachVisitorAnalyticsAndTierRoutes(params: {
  app: Express;
  getServerState: () => {
    visitorAnalytics: ServerVisitorAnalyticsState;
    adminTierGrantsMap: Record<string, Record<string, unknown>>;
    adminTierAuditLogs: Array<Record<string, unknown>>;
  };
  savePersistedState: () => void;
  broadcastToAll: (event: { type: string; payload: unknown }) => void;
}) {
  const { app, getServerState, savePersistedState, broadcastToAll } = params;

  const ensureBuckets = () => {
    const st = getServerState();
    if (!st.visitorAnalytics || typeof st.visitorAnalytics !== 'object') {
      st.visitorAnalytics = {
        globalVisits: [],
        accountVisitsMap: {},
        deviceSessionsMap: {},
        totalAllTimeHits: 0,
        updatedAtMs: Date.now(),
      };
    }
    if (!Array.isArray(st.visitorAnalytics.globalVisits)) st.visitorAnalytics.globalVisits = [];
    if (!st.visitorAnalytics.accountVisitsMap) st.visitorAnalytics.accountVisitsMap = {};
    if (!st.visitorAnalytics.deviceSessionsMap) st.visitorAnalytics.deviceSessionsMap = {};
    if (!st.adminTierGrantsMap) st.adminTierGrantsMap = {};
    if (!Array.isArray(st.adminTierAuditLogs)) st.adminTierAuditLogs = [];
    return st;
  };

  // Helper: Check Trusted Device alert for active Admin Tier Grant
  const evaluateAdminTrustedDeviceAlert = (
    accountId: string | null,
    accountName: string,
    accountNumber: string,
    deviceId: string,
    deviceModel: string,
    locationLabel: string,
    nowIso: string,
    nowMs: number
  ): boolean => {
    if (!accountId || !deviceId) return false;
    const st = ensureBuckets();
    const grant = st.adminTierGrantsMap[accountId] as Record<string, unknown> | undefined;
    if (!grant || grant.status === 'revoked' || grant.status === 'expired') return false;
    const mode = String(grant.trustedDeviceMode || 'unrestricted');
    if (mode === 'unrestricted') return false;
    const trustedIds = Array.isArray(grant.trustedDeviceIds)
      ? (grant.trustedDeviceIds as string[])
      : [];
    if (trustedIds.length === 0) {
      // Auto-register first device as trusted if empty
      grant.trustedDeviceIds = [deviceId];
      return true;
    }
    if (!trustedIds.includes(deviceId)) {
      const prevCount = Number(grant.trustedDeviceAlertCount) || 0;
      const alertMsg = `Perangkat baru (${deviceId} · ${deviceModel}) terdeteksi di ${locationLabel}`;
      const lastMsg = String(grant.lastDeviceAlertMessage || '');
      const lastAtMs = Date.parse(String(grant.lastDeviceAlertAtIso || '')) || 0;
      // Avoid spamming duplicate alerts within 60s
      if (lastMsg === alertMsg && nowMs - lastAtMs < 60_000) return false;

      grant.trustedDeviceAlertCount = prevCount + 1;
      grant.lastDeviceAlertMessage = alertMsg;
      grant.lastDeviceAlertAtIso = nowIso;
      grant.updatedAtIso = nowIso;
      grant.updatedAtMs = nowMs;

      st.adminTierAuditLogs.unshift({
        id: `ata-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
        action: 'device_alert',
        actorName: 'Sistem Keamanan Fingerprint',
        actorEmail: 'system@banknusantara.id',
        targetAccountId: accountId,
        targetAccountName: accountName,
        targetAccountNumber: accountNumber,
        allowedTabsSummary: Array.isArray(grant.allowedTabs)
          ? `${(grant.allowedTabs as string[]).length} Tab`
          : 'Semua Tab',
        detail: `${mode === 'lock_trusted_device' ? '[DIBLOKIR] ' : '[PERINGATAN] '}${alertMsg}`,
        timestampIso: nowIso,
        timestampMs: nowMs,
      });
      return true;
    }
    return false;
  };

  // Upsert Device Session + Cross-Link Location History
  const upsertDeviceSession = (
    rawSpecs: Record<string, unknown>,
    geo: GeoIpInfo,
    account: Record<string, unknown> | null,
    incrementVisit: boolean,
    nowIso: string,
    nowMs: number
  ) => {
    const st = ensureBuckets();
    const va = st.visitorAnalytics;

    const deviceId = cleanStr(rawSpecs.deviceId || `DEV-${Date.now().toString(36)}`, 64);
    const locationKey = makeLocationKey(geo.city, geo.region, geo.country);
    const sessionKey = `${deviceId}__${locationKey}`;
    const locationLabel = `${geo.city}${geo.region && geo.region !== '-' ? `, ${geo.region}` : ''}, ${geo.country}`;

    const mergedSpecs = {
      ...rawSpecs,
      deviceId,
      publicIp: geo.ip,
      city: geo.city,
      region: geo.region,
      country: geo.country,
      countryCode: geo.countryCode,
      isp: geo.isp,
    };

    const existing = va.deviceSessionsMap[sessionKey] as Record<string, unknown> | undefined;

    // Cross-link any other sessions with the same physical deviceId at different locations
    const siblingSessions = Object.values(va.deviceSessionsMap).filter(
      (s) => String(s.deviceId) === deviceId && String(s.sessionKey) !== sessionKey
    );
    const prevLocationsSet = new Set<string>(
      Array.isArray(existing?.previousLocations) ? (existing.previousLocations as string[]) : []
    );
    const linkedKeysSet = new Set<string>(
      Array.isArray(existing?.linkedSessionKeys) ? (existing.linkedSessionKeys as string[]) : []
    );

    for (const sib of siblingSessions) {
      const sibLoc = cleanStr(sib.locationLabel, 140);
      const sibKey = cleanStr(sib.sessionKey, 140);
      if (sibLoc && sibLoc !== locationLabel) prevLocationsSet.add(sibLoc);
      if (sibKey) linkedKeysSet.add(sibKey);

      const sibPrev = new Set<string>(
        Array.isArray(sib.previousLocations) ? (sib.previousLocations as string[]) : []
      );
      sibPrev.add(locationLabel);
      sib.previousLocations = Array.from(sibPrev);

      const sibLinked = new Set<string>(
        Array.isArray(sib.linkedSessionKeys) ? (sib.linkedSessionKeys as string[]) : []
      );
      sibLinked.add(sessionKey);
      sib.linkedSessionKeys = Array.from(sibLinked);
    }

    const accountsHistory: Array<Record<string, unknown>> = Array.isArray(existing?.accountsHistory)
      ? [...(existing.accountsHistory as Array<Record<string, unknown>>)]
      : [];

    let currentAccountKey = (existing?.currentAccountKey as string | null) || null;
    let currentAccountName = cleanStr(existing?.currentAccountName || 'Pengunjung Tamu (Belum Login)', 120);
    let currentAccountEmail = cleanStr(existing?.currentAccountEmail || '-', 160);
    let currentAccountRole: 'admin' | 'customer' | 'guest' =
      (existing?.currentAccountRole as 'admin' | 'customer' | 'guest') || 'guest';
    let isAdminActive = Boolean(existing?.isAdminActive);

    if (account && (account.accountId || account.accountEmail)) {
      const accId = cleanStr(account.accountId, 128);
      const accEmail = cleanStr(account.accountEmail || '-', 160);
      const accKey = (accEmail && accEmail !== '-' ? accEmail : accId).toLowerCase();
      const accName = cleanStr(account.accountName || 'Nasabah', 120);
      const accNum = cleanStr(account.accountNumber || '-', 40);
      const accUid = cleanStr(account.accountUid || accId, 128);
      const accIsAdmin = Boolean(account.isAdmin || account.role === 'admin');
      const accRole: 'admin' | 'customer' = accIsAdmin ? 'admin' : 'customer';

      currentAccountKey = accKey;
      currentAccountName = accName;
      currentAccountEmail = accEmail;
      currentAccountRole = accRole;
      isAdminActive = accIsAdmin;

      const idx = accountsHistory.findIndex((a) => String(a.accountKey) === accKey);
      if (idx >= 0) {
        const entry = accountsHistory[idx];
        accountsHistory[idx] = {
          ...entry,
          accountId: accId || entry.accountId,
          accountUid: accUid || entry.accountUid,
          accountName: accName,
          accountEmail: accEmail,
          accountNumber: accNum,
          role: accRole,
          isAdmin: accIsAdmin,
          loginCount: Number(entry.loginCount || 0) + (incrementVisit ? 1 : 0),
          lastLoginIso: nowIso,
          lastLoginMs: nowMs,
        };
      } else {
        accountsHistory.unshift({
          accountKey: accKey,
          accountId: accId,
          accountUid: accUid,
          accountName: accName,
          accountEmail: accEmail,
          accountNumber: accNum,
          role: accRole,
          isAdmin: accIsAdmin,
          loginCount: 1,
          firstLoginIso: nowIso,
          lastLoginIso: nowIso,
          lastLoginMs: nowMs,
        });
      }
    }

    const updatedSession: Record<string, unknown> = {
      sessionKey,
      deviceId,
      fingerprintHash: cleanStr(rawSpecs.fingerprintHash || deviceId, 64),
      locationKey,
      locationLabel,
      previousLocations: Array.from(prevLocationsSet),
      linkedSessionKeys: Array.from(linkedKeysSet),
      totalVisits: Number(existing?.totalVisits || 0) + (incrementVisit ? 1 : existing ? 0 : 1),
      firstSeenIso: String(existing?.firstSeenIso || nowIso),
      firstSeenMs: Number(existing?.firstSeenMs || nowMs),
      lastSeenIso: nowIso,
      lastSeenMs: nowMs,
      isOnline: true,
      currentAccountKey,
      currentAccountName,
      currentAccountEmail,
      currentAccountRole,
      isAdminActive,
      accountsHistory,
      reviewStatus: String(existing?.reviewStatus || 'normal'),
      reviewNote: existing?.reviewNote ? String(existing.reviewNote) : '',
      specs: mergedSpecs,
    };

    va.deviceSessionsMap[sessionKey] = updatedSession;
    va.updatedAtMs = nowMs;
    return updatedSession;
  };

  // =========================================================================
  // 1. VISITOR ANALYTICS REST ENDPOINTS
  // =========================================================================

  // Record Visit (Global Hits + Account Activity + Device Session)
  app.post('/api/visitor-analytics/record-visit', async (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
      const rawSpecs = (body.specs && typeof body.specs === 'object' ? body.specs : {}) as Record<string, unknown>;
      const account =
        body.account && typeof body.account === 'object'
          ? (body.account as Record<string, unknown>)
          : null;
      const triggerType = cleanStr(body.triggerType || 'app_open', 32);
      const sessionId = cleanStr(body.sessionId || `SES-${Date.now()}`, 80);

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const { dateKey, monthKey, hourOfDay } = getWibDateParts(nowMs);

      const clientIp = extractClientIp(req);
      const timezone = cleanStr(rawSpecs.timezone || 'Asia/Jakarta', 64);
      const geo = await resolveGeoIpServerSide(clientIp, timezone);

      const st = ensureBuckets();
      const va = st.visitorAnalytics;

      // 1) Update/Create Device Session (`device_sessions`)
      const deviceSession = upsertDeviceSession(rawSpecs, geo, account, true, nowIso, nowMs);

      const accId = account ? cleanStr(account.accountId, 128) : null;
      const accUid = account ? cleanStr(account.accountUid || account.accountId, 128) : null;
      const accName = account ? cleanStr(account.accountName || 'Nasabah', 120) : 'Pengunjung Tamu (Belum Login)';
      const accEmail = account ? cleanStr(account.accountEmail || '-', 160) : '-';
      const accNum = account ? cleanStr(account.accountNumber || '-', 40) : '-';
      const isAdmin = Boolean(account && (account.isAdmin || account.role === 'admin'));
      const accRole: 'admin' | 'customer' | 'guest' = account
        ? isAdmin
          ? 'admin'
          : 'customer'
        : 'guest';

      const accessType =
        rawSpecs.accessType === 'apk_webview' ? 'apk_webview' : 'web_browser';
      const accessTypeLabel = cleanStr(rawSpecs.accessTypeLabel || 'Web Browser', 80);
      const deviceBrandModel = cleanStr(rawSpecs.deviceBrandModel || 'Perangkat', 100);
      const osLabel = `${cleanStr(rawSpecs.osName || 'OS', 40)} ${cleanStr(rawSpecs.osVersion || '', 30)}`.trim();
      const browserLabel = `${cleanStr(rawSpecs.browserName || 'Browser', 50)} ${cleanStr(rawSpecs.browserVersion || '', 24)}`.trim();

      // 2) Append to `global_visits` (Unbounded persistence per user requirement)
      const visitId = `gv-${nowMs}-${Math.random().toString(36).slice(2, 8)}`;
      const globalVisit: Record<string, unknown> = {
        id: visitId,
        sessionId,
        timestampIso: nowIso,
        timestampMs: nowMs,
        dateKey,
        monthKey,
        hourOfDay,
        deviceId: String(deviceSession.deviceId),
        deviceSessionKey: String(deviceSession.sessionKey),
        accessType,
        accessTypeLabel,
        deviceBrandModel,
        osLabel,
        browserLabel,
        publicIp: geo.ip,
        city: geo.city,
        region: geo.region,
        country: geo.country,
        isp: geo.isp,
        accountId: accId,
        accountUid: accUid,
        accountName: accName,
        accountEmail: accEmail,
        accountNumber: accNum,
        accountRole: accRole,
        isAdmin,
        triggerType,
      };
      va.globalVisits.push(globalVisit);
      va.totalAllTimeHits = Math.max(va.totalAllTimeHits + 1, va.globalVisits.length);

      // 3) Upsert `account_visits` if logged in
      let accountSummary: Record<string, unknown> | null = null;
      if (account && (accId || (accEmail && accEmail !== '-'))) {
        const accountKey = (accId || accEmail).toLowerCase();
        const prevAcc = va.accountVisitsMap[accountKey] as Record<string, unknown> | undefined;

        const deviceIdsSet = new Set<string>(
          Array.isArray(prevAcc?.deviceIds) ? (prevAcc.deviceIds as string[]) : []
        );
        deviceIdsSet.add(String(deviceSession.deviceId));

        const locationsSet = new Set<string>(
          Array.isArray(prevAcc?.locations) ? (prevAcc.locations as string[]) : []
        );
        locationsSet.add(String(deviceSession.locationLabel));

        const recentVisits = Array.isArray(prevAcc?.recentVisits)
          ? [...(prevAcc.recentVisits as Array<Record<string, unknown>>)]
          : [];
        recentVisits.unshift({
          id: visitId,
          timestampIso: nowIso,
          timestampMs: nowMs,
          deviceId: String(deviceSession.deviceId),
          deviceSessionKey: String(deviceSession.sessionKey),
          deviceBrandModel,
          osLabel,
          browserLabel,
          accessType,
          accessTypeLabel,
          publicIp: geo.ip,
          city: geo.city,
          region: geo.region,
          country: geo.country,
          isp: geo.isp,
          triggerType,
        });

        accountSummary = {
          accountKey,
          accountId: accId || accountKey,
          accountUid: accUid || accId || accountKey,
          accountNumber: accNum,
          accountName: accName,
          accountEmail: accEmail,
          role: isAdmin ? 'admin' : 'customer',
          roleLabel: cleanStr(account.roleLabel || (isAdmin ? 'Admin' : 'Nasabah'), 60),
          isAdmin,
          totalVisits: Number(prevAcc?.totalVisits || 0) + 1,
          firstVisitIso: String(prevAcc?.firstVisitIso || nowIso),
          lastActiveIso: nowIso,
          lastActiveMs: nowMs,
          deviceIds: Array.from(deviceIdsSet),
          locations: Array.from(locationsSet),
          recentVisits,
        };
        va.accountVisitsMap[accountKey] = accountSummary;
      }

      // Check Trusted Device Alert for Admin Tier Grants
      const alertTriggered = evaluateAdminTrustedDeviceAlert(
        accId,
        accName,
        accNum,
        String(deviceSession.deviceId),
        deviceBrandModel,
        String(deviceSession.locationLabel),
        nowIso,
        nowMs
      );

      va.updatedAtMs = nowMs;
      savePersistedState();

      broadcastToAll({
        type: 'visitor_analytics:updated',
        payload: va,
      });

      if (alertTriggered) {
        broadcastToAll({
          type: 'admin_tier_grants:updated',
          payload: {
            adminTierGrantsMap: st.adminTierGrantsMap,
            adminTierAuditLogs: st.adminTierAuditLogs,
          },
        });
      }

      res.json({
        success: true,
        globalVisit,
        accountSummary,
        deviceSession,
      });
    } catch (err) {
      console.error('Error recording visitor analytics:', err);
      res.status(500).json({ success: false, message: 'Gagal mencatat kunjungan.' });
    }
  });

  // 20-second Heartbeat Ping
  app.post('/api/visitor-analytics/heartbeat', async (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
      const rawSpecs = (body.specs && typeof body.specs === 'object' ? body.specs : {}) as Record<string, unknown>;
      const account =
        body.account && typeof body.account === 'object'
          ? (body.account as Record<string, unknown>)
          : null;

      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();
      const clientIp = extractClientIp(req);
      const timezone = cleanStr(rawSpecs.timezone || 'Asia/Jakarta', 64);
      const geo = await resolveGeoIpServerSide(clientIp, timezone);

      const st = ensureBuckets();
      const deviceSession = upsertDeviceSession(rawSpecs, geo, account, false, nowIso, nowMs);

      // Update account lastActiveMs if already tracked
      if (account && (account.accountId || account.accountEmail)) {
        const key = cleanStr(account.accountId || account.accountEmail, 128).toLowerCase();
        const existingAcc = st.visitorAnalytics.accountVisitsMap[key];
        if (existingAcc) {
          existingAcc.lastActiveIso = nowIso;
          existingAcc.lastActiveMs = nowMs;
        }
      }

      st.visitorAnalytics.updatedAtMs = nowMs;
      savePersistedState();

      broadcastToAll({
        type: 'visitor_analytics:updated',
        payload: st.visitorAnalytics,
      });

      res.json({ success: true, deviceSession });
    } catch {
      res.status(500).json({ success: false });
    }
  });

  // Immediate Offline signal when tab/APK closes
  app.post('/api/visitor-analytics/leave', (req: Request, res: Response) => {
    try {
      const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
      const sessionKey = cleanStr(body.sessionKey, 160);
      const deviceId = cleanStr(body.deviceId, 80);
      const st = ensureBuckets();
      let changed = false;

      if (sessionKey && st.visitorAnalytics.deviceSessionsMap[sessionKey]) {
        st.visitorAnalytics.deviceSessionsMap[sessionKey].isOnline = false;
        changed = true;
      } else if (deviceId) {
        for (const sess of Object.values(st.visitorAnalytics.deviceSessionsMap)) {
          if (String(sess.deviceId) === deviceId && sess.isOnline) {
            sess.isOnline = false;
            changed = true;
          }
        }
      }

      if (changed) {
        st.visitorAnalytics.updatedAtMs = Date.now();
        savePersistedState();
        broadcastToAll({
          type: 'visitor_analytics:updated',
          payload: st.visitorAnalytics,
        });
      }
      res.json({ success: true });
    } catch {
      res.json({ success: false });
    }
  });

  // Fetch Full Visitor Analytics State
  app.get('/api/visitor-analytics/state', (_req: Request, res: Response) => {
    const st = ensureBuckets();
    res.json({
      success: true,
      visitorAnalytics: st.visitorAnalytics,
    });
  });

  // Admin Review Status on Suspicious Device (Safe / Watched / Normal)
  app.post('/api/visitor-analytics/device-review', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const sessionKey = cleanStr(body.sessionKey, 160);
    const reviewStatus = cleanStr(body.reviewStatus, 24);
    const reviewNote = cleanStr(body.reviewNote, 240);

    if (!['normal', 'watched', 'safe'].includes(reviewStatus)) {
      res.status(400).json({ success: false, message: 'Status review tidak valid.' });
      return;
    }
    const st = ensureBuckets();
    const target = st.visitorAnalytics.deviceSessionsMap[sessionKey];
    if (!target) {
      res.status(404).json({ success: false, message: 'Sesi perangkat tidak ditemukan.' });
      return;
    }

    target.reviewStatus = reviewStatus;
    target.reviewNote = reviewNote;
    st.visitorAnalytics.updatedAtMs = Date.now();
    savePersistedState();

    broadcastToAll({
      type: 'visitor_analytics:updated',
      payload: st.visitorAnalytics,
    });

    res.json({
      success: true,
      message: `Status perangkat diubah menjadi ${
        reviewStatus === 'safe' ? 'Aman' : reviewStatus === 'watched' ? 'Dalam Pantauan' : 'Normal'
      }.`,
      visitorAnalytics: st.visitorAnalytics,
    });
  });

  // Admin Double-Confirmed Reset of Visitor Analytics
  app.post('/api/visitor-analytics/reset', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const confirmPhrase = cleanStr(body.confirmPhrase, 64).toUpperCase();
    if (confirmPhrase !== 'RESET ANALITIK') {
      res.status(400).json({
        success: false,
        message: 'Konfirmasi ganda tidak sesuai. Ketik persis "RESET ANALITIK".',
      });
      return;
    }

    const st = ensureBuckets();
    st.visitorAnalytics = {
      globalVisits: [],
      accountVisitsMap: {},
      deviceSessionsMap: {},
      totalAllTimeHits: 0,
      updatedAtMs: Date.now(),
    };
    savePersistedState();

    broadcastToAll({
      type: 'visitor_analytics:updated',
      payload: st.visitorAnalytics,
    });

    res.json({
      success: true,
      message: 'Seluruh data analitik & riwayat kunjungan berhasil direset bersih.',
      visitorAnalytics: st.visitorAnalytics,
    });
  });

  // =========================================================================
  // 2. ADMIN CARD TIER PROMOTION & GRANULAR PER-TAB RBAC ENDPOINTS
  // =========================================================================

  app.get('/api/admin-tier-grants/state', (_req: Request, res: Response) => {
    const st = ensureBuckets();
    res.json({
      success: true,
      adminTierGrantsMap: st.adminTierGrantsMap,
      adminTierAuditLogs: st.adminTierAuditLogs,
    });
  });

  app.post('/api/admin-tier-grants/upsert', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const grantsInput = Array.isArray(body.grants)
      ? (body.grants as Array<Record<string, unknown>>)
      : [];
    const actorName = cleanStr(body.actorName || 'Super Admin', 120);
    const actorEmail = cleanStr(body.actorEmail || PRIMARY_OWNER_EMAIL, 160);
    const isBulk = Boolean(body.isBulk);
    const sendOfficialLetter = body.sendOfficialLetter !== false;

    if (grantsInput.length === 0) {
      res.status(400).json({ success: false, message: 'Tidak ada akun target yang dipilih.' });
      return;
    }

    const st = ensureBuckets();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    let updatedCount = 0;

    for (const raw of grantsInput) {
      const accountId = cleanStr(raw.accountId, 128);
      const accountEmail = cleanStr(raw.accountEmail, 160);
      const accountNumber = cleanStr(raw.accountNumber, 40);
      const accountName = cleanStr(raw.accountName || 'Nasabah', 120);

      if (!accountId) continue;

      // Absolute Primary Owner Lock Protection
      if (isProtectedOwnerTarget(accountId, accountEmail, accountNumber)) {
        if (grantsInput.length === 1) {
          res.status(403).json({
            success: false,
            message: 'Akun Super Admin Utama (Owner) terkunci mutlak dan tidak dapat diubah atau dibatasi.',
          });
          return;
        }
        continue;
      }

      const prev = st.adminTierGrantsMap[accountId] as Record<string, unknown> | undefined;
      const isNewPromotion = !prev || prev.status === 'revoked' || prev.status === 'expired';
      const allowedTabs =
        raw.allowedTabs === 'ALL'
          ? 'ALL'
          : Array.isArray(raw.allowedTabs)
          ? (raw.allowedTabs as unknown[]).map((t) => cleanStr(t, 64)).filter(Boolean)
          : [];

      const accessLevel = raw.accessLevel === 'read_only' ? 'read_only' : 'full';
      const durationMode = raw.durationMode === 'timed' ? 'timed' : 'permanent';
      const expiresAtMs =
        durationMode === 'timed' && Number(raw.expiresAtMs) > nowMs
          ? Number(raw.expiresAtMs)
          : null;

      const trustedDeviceMode =
        raw.trustedDeviceMode === 'lock_trusted_device' ||
        raw.trustedDeviceMode === 'alert_new_device'
          ? raw.trustedDeviceMode
          : 'unrestricted';

      const trustedDeviceIds = Array.isArray(raw.trustedDeviceIds)
        ? Array.from(new Set((raw.trustedDeviceIds as unknown[]).map((x) => cleanStr(x, 80)).filter(Boolean)))
        : [];

      const record: Record<string, unknown> = {
        accountId,
        accountNumber,
        accountName,
        accountEmail,
        previousCardTier: cleanStr(raw.previousCardTier || prev?.previousCardTier || 'silver', 40),
        allowedTabs,
        accessLevel,
        canManageAdminTiers: Boolean(raw.canManageAdminTiers),
        assetMode: cleanStr(raw.assetMode || 'keep_original', 40),
        customBonusAssets: raw.customBonusAssets && typeof raw.customBonusAssets === 'object' ? raw.customBonusAssets : undefined,
        dailyAssetCapRupiah: Number(raw.dailyAssetCapRupiah) > 0 ? Number(raw.dailyAssetCapRupiah) : undefined,
        panelAccessMode: raw.panelAccessMode === 'require_pin' ? 'require_pin' : 'auto_open',
        customAdminPin: cleanStr(raw.customAdminPin, 24),
        durationMode,
        expiresAtMs,
        durationLabel: cleanStr(raw.durationLabel || (durationMode === 'permanent' ? 'Permanen' : 'Berbatas Waktu'), 60),
        customTitle: cleanStr(raw.customTitle || 'Admin Tier Nusantara', 80),
        showCrownBadge: raw.showCrownBadge !== false,
        hideAdminStatus: Boolean(raw.hideAdminStatus),
        isFrozen: Boolean(raw.isFrozen),
        trustedDeviceMode,
        trustedDeviceIds,
        trustedDeviceAlertCount: Number(prev?.trustedDeviceAlertCount) || 0,
        lastDeviceAlertMessage: prev?.lastDeviceAlertMessage,
        lastDeviceAlertAtIso: prev?.lastDeviceAlertAtIso,
        status: raw.isFrozen ? 'frozen' : 'active',
        reason: cleanStr(raw.reason || 'Pengangkatan resmi Kartu Tier Admin', 280),
        grantedByName: actorName,
        grantedByEmail: actorEmail,
        grantedAtIso: String(prev?.grantedAtIso || nowIso),
        grantedAtMs: Number(prev?.grantedAtMs || nowMs),
        updatedAtIso: nowIso,
        updatedAtMs: nowMs,
        officialLetterNonce: (Number(prev?.officialLetterNonce) || 0) + 1,
      };

      st.adminTierGrantsMap[accountId] = record;
      updatedCount++;

      const tabsSummary =
        allowedTabs === 'ALL'
          ? 'Semua Tab Panel Admin'
          : `${allowedTabs.length} Tab (${allowedTabs.slice(0, 4).join(', ')}${
              allowedTabs.length > 4 ? ', ...' : ''
            })`;

      st.adminTierAuditLogs.unshift({
        id: `ata-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
        action: isBulk ? 'bulk_update' : isNewPromotion ? 'promote' : 'update_permissions',
        actorName,
        actorEmail,
        targetAccountId: accountId,
        targetAccountName: accountName,
        targetAccountNumber: accountNumber,
        allowedTabsSummary: tabsSummary,
        accessLevel,
        detail: `${isNewPromotion ? 'Diangkat menjadi Kartu Tier Admin' : 'Izin tab diperbarui'} · ${tabsSummary} · Mode ${
          accessLevel === 'read_only' ? 'Hanya Lihat' : 'Akses Penuh'
        } · ${String(record.durationLabel)}`,
        reason: String(record.reason),
        timestampIso: nowIso,
        timestampMs: nowMs,
      });

      if (sendOfficialLetter) {
        broadcastToAll({
          type: 'admin_tier_letter:push',
          payload: {
            id: `ltr-${nowMs}-${accountId}`,
            targetAccountId: accountId,
            targetAccountName: accountName,
            targetAccountNumber: accountNumber,
            customTitle: String(record.customTitle),
            allowedTabLabels:
              allowedTabs === 'ALL' ? ['Seluruh Tab Panel Admin (Super Access)'] : allowedTabs,
            accessLevel,
            durationLabel: String(record.durationLabel),
            panelAccessMode: record.panelAccessMode,
            grantedByName: actorName,
            reason: String(record.reason),
            timestampIso: nowIso,
          },
        });
      }
    }

    savePersistedState();
    broadcastToAll({
      type: 'admin_tier_grants:updated',
      payload: {
        adminTierGrantsMap: st.adminTierGrantsMap,
        adminTierAuditLogs: st.adminTierAuditLogs,
      },
    });

    res.json({
      success: true,
      updatedCount,
      message:
        updatedCount > 1
          ? `${updatedCount} akun berhasil diperbarui status & izin Kartu Tier Admin secara real-time.`
          : 'Pengangkatan & izin Kartu Tier Admin berhasil disimpan dan langsung aktif real-time.',
      adminTierGrantsMap: st.adminTierGrantsMap,
      adminTierAuditLogs: st.adminTierAuditLogs,
    });
  });

  // Freeze / Unfreeze Admin Panel Access without revoking Tier Admin Card
  app.post('/api/admin-tier-grants/freeze', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const accountIds = Array.isArray(body.accountIds)
      ? (body.accountIds as unknown[]).map((x) => cleanStr(x, 128)).filter(Boolean)
      : [];
    const freeze = Boolean(body.freeze);
    const reason = cleanStr(body.reason || (freeze ? 'Dibekukan sementara oleh Super Admin' : 'Diaktifkan kembali oleh Super Admin'), 240);
    const actorName = cleanStr(body.actorName || 'Super Admin', 120);
    const actorEmail = cleanStr(body.actorEmail || PRIMARY_OWNER_EMAIL, 160);

    const st = ensureBuckets();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    let changed = 0;

    for (const accId of accountIds) {
      const grant = st.adminTierGrantsMap[accId] as Record<string, unknown> | undefined;
      if (!grant) continue;
      if (
        isProtectedOwnerTarget(
          accId,
          String(grant.accountEmail || ''),
          String(grant.accountNumber || '')
        )
      ) {
        continue;
      }

      grant.isFrozen = freeze;
      grant.status = freeze ? 'frozen' : 'active';
      grant.frozenAtIso = freeze ? nowIso : undefined;
      grant.frozenReason = freeze ? reason : undefined;
      grant.updatedAtIso = nowIso;
      grant.updatedAtMs = nowMs;
      changed++;

      st.adminTierAuditLogs.unshift({
        id: `ata-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
        action: freeze ? 'freeze' : 'unfreeze',
        actorName,
        actorEmail,
        targetAccountId: accId,
        targetAccountName: String(grant.accountName || accId),
        targetAccountNumber: String(grant.accountNumber || '-'),
        allowedTabsSummary:
          grant.allowedTabs === 'ALL'
            ? 'Semua Tab'
            : `${Array.isArray(grant.allowedTabs) ? grant.allowedTabs.length : 0} Tab`,
        detail: freeze
          ? 'Akses Panel Admin dibekukan sementara (Kartu Tier Admin tetap terpasang).'
          : 'Akses Panel Admin diaktifkan kembali secara instan.',
        reason,
        timestampIso: nowIso,
        timestampMs: nowMs,
      });
    }

    savePersistedState();
    broadcastToAll({
      type: 'admin_tier_grants:updated',
      payload: {
        adminTierGrantsMap: st.adminTierGrantsMap,
        adminTierAuditLogs: st.adminTierAuditLogs,
      },
    });

    res.json({
      success: changed > 0,
      message:
        changed > 0
          ? freeze
            ? `${changed} akun Admin dibekukan sementara secara real-time.`
            : `${changed} akun Admin diaktifkan kembali secara real-time.`
          : 'Tidak ada akun Admin yang dapat diubah status bekunya.',
      adminTierGrantsMap: st.adminTierGrantsMap,
      adminTierAuditLogs: st.adminTierAuditLogs,
    });
  });

  // Revoke / Demote Admin Tier Grant
  app.post('/api/admin-tier-grants/revoke', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const accountId = cleanStr(body.accountId, 128);
    const actorName = cleanStr(body.actorName || 'Super Admin', 120);
    const actorEmail = cleanStr(body.actorEmail || PRIMARY_OWNER_EMAIL, 160);
    const reason = cleanStr(body.reason || 'Pencabutan status Kartu Tier Admin', 240);
    const restoredTierLabel = cleanStr(body.restoredTierLabel || 'Tier Kartu Awal', 60);

    const st = ensureBuckets();
    const grant = st.adminTierGrantsMap[accountId] as Record<string, unknown> | undefined;
    if (
      isProtectedOwnerTarget(
        accountId,
        String(grant?.accountEmail || ''),
        String(grant?.accountNumber || '')
      )
    ) {
      res.status(403).json({
        success: false,
        message: 'Akun Super Admin Utama (Owner) terkunci mutlak dan tidak dapat dicabut.',
      });
      return;
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    if (grant) {
      grant.status = 'revoked';
      grant.isFrozen = false;
      grant.allowedTabs = [];
      grant.updatedAtIso = nowIso;
      grant.updatedAtMs = nowMs;
    }

    st.adminTierAuditLogs.unshift({
      id: `ata-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
      action: 'revoke',
      actorName,
      actorEmail,
      targetAccountId: accountId,
      targetAccountName: String(grant?.accountName || accountId),
      targetAccountNumber: String(grant?.accountNumber || '-'),
      allowedTabsSummary: '0 Tab (Dicabut)',
      detail: `Status Kartu Tier Admin dicabut dan dikembalikan ke ${restoredTierLabel}.`,
      reason,
      timestampIso: nowIso,
      timestampMs: nowMs,
    });

    savePersistedState();
    broadcastToAll({
      type: 'admin_tier_grants:updated',
      payload: {
        adminTierGrantsMap: st.adminTierGrantsMap,
        adminTierAuditLogs: st.adminTierAuditLogs,
      },
    });

    res.json({
      success: true,
      message: `Status Tier Admin dicabut dan kartu dikembalikan ke ${restoredTierLabel}.`,
      adminTierGrantsMap: st.adminTierGrantsMap,
      adminTierAuditLogs: st.adminTierAuditLogs,
    });
  });

  // Log Delegated Admin Tab Activity
  app.post('/api/admin-tier-grants/activity', (req: Request, res: Response) => {
    const body = (req.body && typeof req.body === 'object' ? req.body : {}) as Record<string, unknown>;
    const accountId = cleanStr(body.accountId, 128);
    const accountName = cleanStr(body.accountName || 'Admin', 120);
    const accountNumber = cleanStr(body.accountNumber || '-', 40);
    const accountEmail = cleanStr(body.accountEmail || '-', 160);
    const tabKey = cleanStr(body.tabKey, 64);
    const detail = cleanStr(body.detail, 240);
    if (!accountId || !tabKey) {
      res.json({ success: false });
      return;
    }

    const st = ensureBuckets();
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    st.adminTierAuditLogs.unshift({
      id: `ata-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
      action: 'admin_tab_activity',
      actorName: accountName,
      actorEmail: accountEmail,
      targetAccountId: accountId,
      targetAccountName: accountName,
      targetAccountNumber: accountNumber,
      allowedTabsSummary: tabKey,
      tabKey,
      detail: detail || `Membuka tab ${tabKey}`,
      timestampIso: nowIso,
      timestampMs: nowMs,
    });
    if (st.adminTierAuditLogs.length > 2000) {
      st.adminTierAuditLogs = st.adminTierAuditLogs.slice(0, 2000);
    }
    savePersistedState();

    broadcastToAll({
      type: 'admin_tier_grants:updated',
      payload: {
        adminTierGrantsMap: st.adminTierGrantsMap,
        adminTierAuditLogs: st.adminTierAuditLogs,
      },
    });

    res.json({ success: true });
  });

  // =========================================================================
  // 3. PERIODIC SWEEP (15s): 45s OFFLINE TIMEOUT + TIMED CONTRACT AUTO-EXPIRE
  // =========================================================================
  setInterval(() => {
    try {
      const st = ensureBuckets();
      const nowMs = Date.now();
      const nowIso = new Date(nowMs).toISOString();

      let analyticsChanged = false;
      for (const sess of Object.values(st.visitorAnalytics.deviceSessionsMap)) {
        if (sess.isOnline && nowMs - Number(sess.lastSeenMs || 0) > OFFLINE_TIMEOUT_MS) {
          sess.isOnline = false;
          analyticsChanged = true;
        }
      }

      let grantsChanged = false;
      for (const grant of Object.values(st.adminTierGrantsMap)) {
        if (
          grant.status === 'active' &&
          grant.durationMode === 'timed' &&
          typeof grant.expiresAtMs === 'number' &&
          grant.expiresAtMs > 0 &&
          nowMs >= grant.expiresAtMs
        ) {
          grant.status = 'expired';
          grant.updatedAtIso = nowIso;
          grant.updatedAtMs = nowMs;
          grantsChanged = true;

          st.adminTierAuditLogs.unshift({
            id: `ata-${nowMs}-${Math.random().toString(36).slice(2, 7)}`,
            action: 'auto_expire',
            actorName: 'Sistem Kontrak Otomatis',
            actorEmail: 'system@banknusantara.id',
            targetAccountId: String(grant.accountId || ''),
            targetAccountName: String(grant.accountName || ''),
            targetAccountNumber: String(grant.accountNumber || '-'),
            allowedTabsSummary: 'Kontrak Berakhir',
            detail: `Masa kontrak Tier Admin (${String(grant.durationLabel || 'Berbatas Waktu')}) telah berakhir otomatis.`,
            timestampIso: nowIso,
            timestampMs: nowMs,
          });
        }
      }

      if (analyticsChanged || grantsChanged) {
        if (analyticsChanged) st.visitorAnalytics.updatedAtMs = nowMs;
        savePersistedState();
      }
      if (analyticsChanged) {
        broadcastToAll({
          type: 'visitor_analytics:updated',
          payload: st.visitorAnalytics,
        });
      }
      if (grantsChanged) {
        broadcastToAll({
          type: 'admin_tier_grants:updated',
          payload: {
            adminTierGrantsMap: st.adminTierGrantsMap,
            adminTierAuditLogs: st.adminTierAuditLogs,
          },
        });
      }
    } catch {
      // ignore sweep error
    }
  }, 15_000);
}
