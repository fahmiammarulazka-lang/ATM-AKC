/**
 * Background Real-Time Visitor, Account, & Device/Location Tracker (`visitorTracker.ts`)
 * ---------------------------------------------------------------------------
 * - Collects complete device fingerprint (Canvas, WebGL ID, screen resolution,
 *   timezone, hardware specs, persistent storage ID) and detailed device specs.
 * - Parses User-Agent & Client Hints, CPU cores, RAM, GPU renderer, battery status,
 *   network connection type, and Web Browser vs APK (WebView/Android) mode.
 * - Enforces 10-second Session Debounce against accidental page refreshes while
 *   counting every genuine app/APK close & reopen or account login.
 * - Sends automatic 20-second Heartbeat pings (with 45s server offline timeout)
 *   and exit signals on tab/app close.
 * - Synchronizes with Server Express + WebSocket (/ws) and dual-syncs to
 *   Cloud Firestore / Realtime Database (`global_visits`, `account_visits`, `device_sessions`).
 */

import { useEffect, useRef } from 'react';
import { writeCloudDoc } from '../lib/firebase';

export type AccessEnvironmentType = 'web_browser' | 'apk_webview';
export type DeviceReviewStatus = 'normal' | 'watched' | 'safe';

export interface DeviceFullSpecifications {
  // Identitas & Sistem
  deviceId: string;
  fingerprintHash: string;
  deviceBrandModel: string;
  deviceCategory: 'Smartphone' | 'Tablet' | 'Desktop / PC';
  osName: string;
  osVersion: string;
  accessType: AccessEnvironmentType;
  accessTypeLabel: string;
  browserName: string;
  browserVersion: string;
  userAgent: string;
  platform: string;
  // Hardware & Layar
  cpuArchitecture: string;
  cpuCores: number;
  ramGb: number | null;
  ramLabel: string;
  gpuVendor: string;
  gpuRenderer: string;
  screenResolution: string;
  viewportSize: string;
  pixelRatio: number;
  screenOrientation: string;
  colorDepth: number;
  maxTouchPoints: number;
  // Jaringan, Lokasi & Baterai
  publicIp: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  isp: string;
  locationSource?: 'gps' | 'geoip' | 'timezone';
  gpsLat?: number | null;
  gpsLng?: number | null;
  gpsAccuracyMeters?: number | null;
  timezone: string;
  systemLanguage: string;
  connectionType: string;
  downlinkMbps: number | null;
  rttMs: number | null;
  batteryLevelPct: number | null;
  batteryCharging: boolean | null;
}

export interface GlobalVisitLogEntry {
  id: string;
  sessionId: string;
  timestampIso: string;
  timestampMs: number;
  dateKey: string; // YYYY-MM-DD (WIB/local)
  monthKey: string; // YYYY-MM
  hourOfDay: number; // 0-23
  deviceId: string;
  deviceSessionKey: string;
  accessType: AccessEnvironmentType;
  accessTypeLabel: string;
  deviceBrandModel: string;
  osLabel: string;
  browserLabel: string;
  publicIp: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  accountId: string | null;
  accountUid: string | null;
  accountName: string;
  accountEmail: string;
  accountNumber: string;
  accountRole: 'admin' | 'customer' | 'guest';
  isAdmin: boolean;
  triggerType: 'app_open' | 'account_login' | 'reopen';
}

export interface AccountVisitHistoryItem {
  id: string;
  timestampIso: string;
  timestampMs: number;
  deviceId: string;
  deviceSessionKey: string;
  deviceBrandModel: string;
  osLabel: string;
  browserLabel: string;
  accessType: AccessEnvironmentType;
  accessTypeLabel: string;
  publicIp: string;
  city: string;
  region: string;
  country: string;
  isp: string;
  triggerType: 'app_open' | 'account_login' | 'reopen';
}

export interface AccountVisitSummaryRecord {
  accountKey: string;
  accountId: string;
  accountUid: string;
  accountNumber: string;
  accountName: string;
  accountEmail: string;
  role: 'admin' | 'customer';
  roleLabel: string;
  isAdmin: boolean;
  totalVisits: number;
  firstVisitIso: string;
  lastActiveIso: string;
  lastActiveMs: number;
  deviceIds: string[];
  locations: string[];
  recentVisits: AccountVisitHistoryItem[];
}

export interface DeviceAccountLoginEntry {
  accountKey: string;
  accountId: string;
  accountUid: string;
  accountName: string;
  accountEmail: string;
  accountNumber: string;
  role: 'admin' | 'customer';
  isAdmin: boolean;
  loginCount: number;
  firstLoginIso: string;
  lastLoginIso: string;
  lastLoginMs: number;
}

export interface DeviceSessionRecord {
  sessionKey: string; // deviceId + normalized location key
  deviceId: string;
  fingerprintHash: string;
  locationKey: string;
  locationLabel: string;
  previousLocations: string[];
  linkedSessionKeys: string[];
  totalVisits: number;
  firstSeenIso: string;
  firstSeenMs: number;
  lastSeenIso: string;
  lastSeenMs: number;
  isOnline: boolean;
  currentAccountId?: string | null;
  currentAccountNumber?: string | null;
  currentAccountKey: string | null;
  currentAccountName: string;
  currentAccountEmail: string;
  currentAccountRole: 'admin' | 'customer' | 'guest';
  isAdminActive: boolean;
  locationSource?: 'gps' | 'geoip' | 'timezone';
  gpsLat?: number | null;
  gpsLng?: number | null;
  accountsHistory: DeviceAccountLoginEntry[];
  reviewStatus: DeviceReviewStatus;
  reviewNote?: string;
  specs: DeviceFullSpecifications;
}

export interface VisitorAnalyticsStatePayload {
  globalVisits: GlobalVisitLogEntry[];
  accountVisitsMap: Record<string, AccountVisitSummaryRecord>;
  deviceSessionsMap: Record<string, DeviceSessionRecord>;
  totalAllTimeHits: number;
  updatedAtMs: number;
}

const PERSISTENT_DEVICE_UUID_KEY = 'bn_visitor_persistent_device_uuid_v1';
const SESSION_DEBOUNCE_STORAGE_KEY = 'bn_visitor_last_visit_debounce_v1';
const ACTIVE_TAB_SESSION_ID_KEY = 'bn_visitor_active_tab_session_v1';
const DEBOUNCE_WINDOW_MS = 10_000; // 10 seconds debounce for accidental refresh
export const HEARTBEAT_INTERVAL_MS = 20_000; // 20 seconds heartbeat ping
export const OFFLINE_TIMEOUT_MS = 45_000; // 45 seconds offline threshold

function fnv1aHash(input: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 ^= ch;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= ch + (i & 0xff);
    h2 = Math.imul(h2, 0x811c9dc5);
  }
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}`.toUpperCase();
}

function getOrCreatePersistentStorageId(): string {
  if (typeof window === 'undefined') return 'SSR-NODE';
  try {
    const existing = window.localStorage.getItem(PERSISTENT_DEVICE_UUID_KEY);
    if (existing && existing.length >= 8) return existing;
    const created = `PDEV-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 10)
      .toUpperCase()}`;
    window.localStorage.setItem(PERSISTENT_DEVICE_UUID_KEY, created);
    return created;
  } catch {
    return 'PDEV-VOLATILE';
  }
}

function getOrCreateTabSessionId(): string {
  if (typeof window === 'undefined') return 'TAB-SSR';
  try {
    const existing = window.sessionStorage.getItem(ACTIVE_TAB_SESSION_ID_KEY);
    if (existing) return existing;
    const created = `SES-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase()}`;
    window.sessionStorage.setItem(ACTIVE_TAB_SESSION_ID_KEY, created);
    return created;
  } catch {
    return `SES-${Date.now().toString(36).toUpperCase()}`;
  }
}

function getCanvasFingerprint(): string {
  if (typeof document === 'undefined') return 'no-canvas';
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 48;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'ctx-unavailable';
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial, sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(10, 4, 80, 22);
    ctx.fillStyle = '#069';
    ctx.fillText('BankNusantara-FP-v16', 6, 12);
    ctx.strokeStyle = 'rgba(120, 200, 95, 0.75)';
    ctx.arc(60, 24, 16, 0, Math.PI, false);
    ctx.stroke();
    return fnv1aHash(canvas.toDataURL());
  } catch {
    return 'canvas-blocked';
  }
}

function getWebGlSpecs(): { vendor: string; renderer: string; webglHash: string } {
  if (typeof document === 'undefined') {
    return { vendor: 'Tidak Terdeteksi', renderer: 'Tidak Terdeteksi', webglHash: 'no-webgl' };
  }
  try {
    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl') as WebGLRenderingContext | null) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    if (!gl) {
      return { vendor: 'Standard Display', renderer: 'Software Rasterizer', webglHash: 'no-gl-ctx' };
    }
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '')
      : String(gl.getParameter(gl.VENDOR) || '');
    const renderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : String(gl.getParameter(gl.RENDERER) || '');
    const cleanVendor = vendor.trim() || 'GPU Vendor Standar';
    const cleanRenderer = renderer.trim() || 'GPU Terintegrasi';
    return {
      vendor: cleanVendor,
      renderer: cleanRenderer,
      webglHash: fnv1aHash(`${cleanVendor}|${cleanRenderer}`),
    };
  } catch {
    return { vendor: 'GPU Standar', renderer: 'GPU Terintegrasi', webglHash: 'gl-err' };
  }
}

function parseUserAgentAndAccessType(ua: string): {
  osName: string;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  deviceBrandModel: string;
  deviceCategory: 'Smartphone' | 'Tablet' | 'Desktop / PC';
  accessType: AccessEnvironmentType;
  accessTypeLabel: string;
  cpuArchitecture: string;
} {
  const raw = ua || '';

  // Detect APK / WebView
  const isAndroid = /Android/i.test(raw);
  const isIos = /iPhone|iPad|iPod/i.test(raw);
  const isStandalonePwa =
    typeof window !== 'undefined' &&
    ((typeof window.matchMedia === 'function' &&
      window.matchMedia('(display-mode: standalone)').matches) ||
      Boolean((window.navigator as unknown as { standalone?: boolean }).standalone));

  const hasAndroidWebViewToken =
    /; wv\)/i.test(raw) ||
    (/Android/i.test(raw) && /Version\/\d+\.\d+/i.test(raw) && /Chrome\/\d+/i.test(raw)) ||
    /NusantaraAPK|WebView|Capacitor|Cordova|ReactNative/i.test(raw);
  const hasIosWebViewToken =
    isIos && !/Safari\//i.test(raw) && /AppleWebKit\//i.test(raw);

  const isApkWebView = Boolean(hasAndroidWebViewToken || hasIosWebViewToken || (isAndroid && isStandalonePwa));

  // OS detection
  let osName = 'Sistem Operasi';
  let osVersion = '-';
  if (isAndroid) {
    osName = 'Android';
    const m = raw.match(/Android\s+([0-9.]+)/i);
    osVersion = m?.[1] || '14+';
  } else if (/iPhone|iPod/i.test(raw)) {
    osName = 'iOS';
    const m = raw.match(/OS\s+([0-9_]+)/i);
    osVersion = m?.[1]?.replace(/_/g, '.') || '17+';
  } else if (/iPad/i.test(raw)) {
    osName = 'iPadOS';
    const m = raw.match(/OS\s+([0-9_]+)/i);
    osVersion = m?.[1]?.replace(/_/g, '.') || '17+';
  } else if (/Windows NT/i.test(raw)) {
    osName = 'Windows';
    const m = raw.match(/Windows NT\s+([0-9.]+)/i);
    const nt = m?.[1] || '';
    osVersion = nt === '10.0' ? '10 / 11' : nt || '11';
  } else if (/Mac OS X/i.test(raw)) {
    osName = 'macOS';
    const m = raw.match(/Mac OS X\s+([0-9_]+)/i);
    osVersion = m?.[1]?.replace(/_/g, '.') || 'Sonoma';
  } else if (/CrOS/i.test(raw)) {
    osName = 'ChromeOS';
    osVersion = 'Terbaru';
  } else if (/Linux/i.test(raw)) {
    osName = 'Linux';
    osVersion = 'x86_64';
  }

  // CPU Architecture
  let cpuArchitecture = '64-bit (x86_64 / ARM64)';
  if (/aarch64|arm64|armv8/i.test(raw) || isAndroid || isIos) {
    cpuArchitecture = 'ARM64 (64-bit Mobile Architecture)';
  } else if (/x86_64|Win64|x64|amd64/i.test(raw)) {
    cpuArchitecture = 'x86_64 (64-bit Desktop)';
  } else if (/i686|i386|Win32/i.test(raw)) {
    cpuArchitecture = 'x86 (32-bit)';
  }

  // Browser name & version
  let browserName = 'Browser';
  let browserVersion = '';
  if (isApkWebView) {
    browserName = isIos ? 'iOS WebView Container' : 'Android APK WebView';
    const m = raw.match(/Chrome\/([0-9.]+)/i) || raw.match(/Version\/([0-9.]+)/i);
    browserVersion = m?.[1]?.split('.')[0] || '1.0';
  } else if (/Edg\/([0-9.]+)/i.test(raw)) {
    browserName = 'Microsoft Edge';
    browserVersion = raw.match(/Edg\/([0-9.]+)/i)?.[1]?.split('.')[0] || '';
  } else if (/OPR\/([0-9.]+)/i.test(raw)) {
    browserName = 'Opera';
    browserVersion = raw.match(/OPR\/([0-9.]+)/i)?.[1]?.split('.')[0] || '';
  } else if (/SamsungBrowser\/([0-9.]+)/i.test(raw)) {
    browserName = 'Samsung Internet';
    browserVersion = raw.match(/SamsungBrowser\/([0-9.]+)/i)?.[1] || '';
  } else if (/Firefox\/([0-9.]+)/i.test(raw)) {
    browserName = 'Mozilla Firefox';
    browserVersion = raw.match(/Firefox\/([0-9.]+)/i)?.[1]?.split('.')[0] || '';
  } else if (/Chrome\/([0-9.]+)/i.test(raw) || /CriOS\/([0-9.]+)/i.test(raw)) {
    browserName = 'Google Chrome';
    browserVersion =
      raw.match(/Chrome\/([0-9.]+)/i)?.[1]?.split('.')[0] ||
      raw.match(/CriOS\/([0-9.]+)/i)?.[1]?.split('.')[0] ||
      '';
  } else if (/Version\/([0-9.]+).*Safari/i.test(raw)) {
    browserName = 'Apple Safari';
    browserVersion = raw.match(/Version\/([0-9.]+)/i)?.[1] || '';
  }

  // Brand & Model extraction
  let deviceBrandModel = `${osName} Device`;
  if (isAndroid) {
    const buildMatch = raw.match(/Android\s+[0-9.]+;\s*([^)]+)\)/i);
    if (buildMatch?.[1]) {
      const cleaned = buildMatch[1]
        .replace(/Build\/.*$/i, '')
        .replace(/;\s*wv$/i, '')
        .trim();
      const parts = cleaned.split(';').map((p) => p.trim()).filter(Boolean);
      const modelCode = parts[parts.length - 1] || 'Android Smartphone';
      if (/^SM-/i.test(modelCode)) {
        deviceBrandModel = `Samsung Galaxy (${modelCode})`;
      } else if (/^RMX/i.test(modelCode)) {
        deviceBrandModel = `Realme (${modelCode})`;
      } else if (/^CPH/i.test(modelCode)) {
        deviceBrandModel = `OPPO (${modelCode})`;
      } else if (/^V\d{4}|vivo/i.test(modelCode)) {
        deviceBrandModel = `Vivo (${modelCode})`;
      } else if (/Redmi|POCO|Mi\s|M20|220|230/i.test(modelCode)) {
        deviceBrandModel = `Xiaomi / Redmi (${modelCode})`;
      } else if (/Pixel/i.test(modelCode)) {
        deviceBrandModel = `Google ${modelCode}`;
      } else if (/Infinix/i.test(modelCode)) {
        deviceBrandModel = modelCode;
      } else if (modelCode && modelCode !== 'K') {
        deviceBrandModel = `Android (${modelCode})`;
      } else {
        deviceBrandModel = 'Android Smartphone (Chrome Reduced-UA)';
      }
    }
  } else if (/iPhone/i.test(raw)) {
    deviceBrandModel = 'Apple iPhone';
  } else if (/iPad/i.test(raw)) {
    deviceBrandModel = 'Apple iPad';
  } else if (/Macintosh/i.test(raw)) {
    deviceBrandModel = 'Apple Mac / MacBook';
  } else if (/Windows/i.test(raw)) {
    deviceBrandModel = 'PC / Laptop Windows';
  } else if (/Linux/i.test(raw)) {
    deviceBrandModel = 'Workstation Linux';
  }

  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(raw) || (isAndroid && !/Mobile/i.test(raw));
  const isMobile = isAndroid || isIos || /Mobile/i.test(raw);
  const deviceCategory: 'Smartphone' | 'Tablet' | 'Desktop / PC' = isTablet
    ? 'Tablet'
    : isMobile
    ? 'Smartphone'
    : 'Desktop / PC';

  const accessType: AccessEnvironmentType = isApkWebView ? 'apk_webview' : 'web_browser';
  const accessTypeLabel = isApkWebView
    ? 'APK Android / WebView'
    : `Web Browser (${browserName}${browserVersion ? ` ${browserVersion}` : ''})`;

  return {
    osName,
    osVersion,
    browserName,
    browserVersion,
    deviceBrandModel,
    deviceCategory,
    accessType,
    accessTypeLabel,
    cpuArchitecture,
  };
}

export async function collectFullDeviceSpecifications(): Promise<DeviceFullSpecifications> {
  if (typeof window === 'undefined') {
    return {
      deviceId: 'DEV-SERVER',
      fingerprintHash: '00000000',
      deviceBrandModel: 'Server Environment',
      deviceCategory: 'Desktop / PC',
      osName: 'Linux',
      osVersion: '-',
      accessType: 'web_browser',
      accessTypeLabel: 'Web Browser',
      browserName: 'Server',
      browserVersion: '1.0',
      userAgent: '',
      platform: 'Server',
      cpuArchitecture: 'x86_64',
      cpuCores: 4,
      ramGb: 8,
      ramLabel: '8 GB',
      gpuVendor: '-',
      gpuRenderer: '-',
      screenResolution: '1920x1080',
      viewportSize: '1920x1080',
      pixelRatio: 1,
      screenOrientation: 'Landscape',
      colorDepth: 24,
      maxTouchPoints: 0,
      publicIp: 'Deteksi Server...',
      city: 'Mendeteksi...',
      region: '-',
      country: 'Indonesia',
      countryCode: 'ID',
      isp: 'Mendeteksi ISP...',
      timezone: 'Asia/Jakarta',
      systemLanguage: 'id-ID',
      connectionType: 'WiFi / Broadband',
      downlinkMbps: null,
      rttMs: null,
      batteryLevelPct: null,
      batteryCharging: null,
    };
  }

  const nav = window.navigator as Navigator & {
    deviceMemory?: number;
    connection?: {
      effectiveType?: string;
      type?: string;
      downlink?: number;
      rtt?: number;
    };
    getBattery?: () => Promise<{ level: number; charging: boolean }>;
    userAgentData?: {
      mobile?: boolean;
      platform?: string;
      brands?: Array<{ brand: string; version: string }>;
      getHighEntropyValues?: (hints: string[]) => Promise<{
        model?: string;
        platformVersion?: string;
        architecture?: string;
        bitness?: string;
      }>;
    };
  };

  const ua = nav.userAgent || '';
  const parsed = parseUserAgentAndAccessType(ua);

  // Enhance with User-Agent Client Hints if supported
  let brandModel = parsed.deviceBrandModel;
  let osVer = parsed.osVersion;
  let cpuArch = parsed.cpuArchitecture;
  try {
    if (nav.userAgentData?.getHighEntropyValues) {
      const high = await Promise.race([
        nav.userAgentData.getHighEntropyValues([
          'model',
          'platformVersion',
          'architecture',
          'bitness',
        ]),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 350)),
      ]);
      if (high) {
        if (high.model && high.model.trim()) {
          brandModel = `${parsed.osName} (${high.model.trim()})`;
        }
        if (high.platformVersion && high.platformVersion.trim() && osVer === '14+') {
          osVer = high.platformVersion.trim();
        }
        if (high.architecture) {
          cpuArch = `${high.architecture.toUpperCase()}${high.bitness ? ` (${high.bitness}-bit)` : ''}`;
        }
      }
    }
  } catch {
    // fallback to parsed UA
  }

  const cpuCores = Number(nav.hardwareConcurrency) || 4;
  const ramGb = typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null;
  const ramLabel = ramGb ? `~${ramGb} GB RAM` : 'Standar Browser (Tidak diekspos OS)';

  const webgl = getWebGlSpecs();
  const canvasHash = getCanvasFingerprint();
  const persistentStorageId = getOrCreatePersistentStorageId();

  const screenW = window.screen?.width || window.innerWidth || 1280;
  const screenH = window.screen?.height || window.innerHeight || 720;
  const minDim = Math.min(screenW, screenH);
  const maxDim = Math.max(screenW, screenH);
  const screenResolution = `${screenW} x ${screenH} px`;
  const viewportSize = `${window.innerWidth || screenW} x ${window.innerHeight || screenH} px`;
  const pixelRatio = Number((window.devicePixelRatio || 1).toFixed(2));
  const colorDepth = window.screen?.colorDepth || 24;
  const maxTouchPoints = Number(nav.maxTouchPoints) || 0;
  const rawOrientation =
    window.screen?.orientation?.type ||
    (window.innerWidth >= window.innerHeight ? 'landscape-primary' : 'portrait-primary');
  const screenOrientation = rawOrientation.includes('portrait') ? 'Portrait (Tegak)' : 'Landscape (Mendatar)';

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  const systemLanguage = nav.language || (nav.languages && nav.languages[0]) || 'id-ID';

  // Connection info
  const conn = nav.connection;
  const rawConnType = conn?.type || conn?.effectiveType || '';
  let connectionType = 'WiFi / Broadband';
  if (/wifi/i.test(rawConnType)) {
    connectionType = 'WiFi';
  } else if (/5g/i.test(rawConnType)) {
    connectionType = 'Seluler 5G';
  } else if (/4g/i.test(rawConnType)) {
    connectionType = maxTouchPoints > 0 ? 'Seluler 4G LTE / WiFi Cepat' : 'Broadband / WiFi 4G+';
  } else if (/3g/i.test(rawConnType)) {
    connectionType = 'Seluler 3G';
  } else if (/2g|slow-2g/i.test(rawConnType)) {
    connectionType = 'Seluler 2G (Lambat)';
  }
  const downlinkMbps = typeof conn?.downlink === 'number' ? conn.downlink : null;
  const rttMs = typeof conn?.rtt === 'number' ? conn.rtt : null;

  // Battery info (if supported)
  let batteryLevelPct: number | null = null;
  let batteryCharging: boolean | null = null;
  try {
    if (typeof nav.getBattery === 'function') {
      const bat = await Promise.race([
        nav.getBattery(),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 350)),
      ]);
      if (bat && typeof bat.level === 'number') {
        batteryLevelPct = Math.round(bat.level * 100);
        batteryCharging = Boolean(bat.charging);
      }
    }
  } catch {
    // ignore battery API errors
  }

  // Deterministic Device Fingerprint combining Hardware + Canvas + WebGL + Screen + Timezone + Persistent ID
  const rawFingerprintMaterial = [
    persistentStorageId,
    canvasHash,
    webgl.webglHash,
    `${minDim}x${maxDim}@${pixelRatio}`,
    timezone,
    `${cpuCores}C-${ramGb ?? 'X'}G`,
    parsed.osName,
  ].join('||');

  const fingerprintHash = fnv1aHash(rawFingerprintMaterial);
  const deviceId = `DEV-${fingerprintHash.slice(0, 12)}`;

  return {
    deviceId,
    fingerprintHash,
    deviceBrandModel: brandModel,
    deviceCategory: parsed.deviceCategory,
    osName: parsed.osName,
    osVersion: osVer,
    accessType: parsed.accessType,
    accessTypeLabel: parsed.accessTypeLabel,
    browserName: parsed.browserName,
    browserVersion: parsed.browserVersion,
    userAgent: ua.slice(0, 320),
    platform: nav.platform || parsed.osName,
    cpuArchitecture: cpuArch,
    cpuCores,
    ramGb,
    ramLabel,
    gpuVendor: webgl.vendor,
    gpuRenderer: webgl.renderer,
    screenResolution,
    viewportSize,
    pixelRatio,
    screenOrientation,
    colorDepth,
    maxTouchPoints,
    publicIp: 'Mendeteksi IP...',
    city: 'Mendeteksi...',
    region: '-',
    country: 'Indonesia',
    countryCode: 'ID',
    isp: 'Mendeteksi ISP...',
    timezone,
    systemLanguage,
    connectionType,
    downlinkMbps,
    rttMs,
    batteryLevelPct,
    batteryCharging,
  };
}

/**
 * Checks 10-second Session Debounce for accidental page reload vs deliberate reopen/login
 */
function shouldRecordVisitAfterDebounce(accountKey: string | null, forceLoginEvent: boolean): boolean {
  if (forceLoginEvent) return true;
  if (typeof window === 'undefined') return false;
  try {
    const now = Date.now();
    const raw = window.localStorage.getItem(SESSION_DEBOUNCE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { ts?: number; acc?: string | null };
      const elapsed = now - Number(parsed.ts || 0);
      // Block if same account/guest refreshed within 10 seconds
      if (elapsed >= 0 && elapsed < DEBOUNCE_WINDOW_MS && parsed.acc === accountKey) {
        return false;
      }
    }
    window.localStorage.setItem(
      SESSION_DEBOUNCE_STORAGE_KEY,
      JSON.stringify({ ts: now, acc: accountKey })
    );
    return true;
  } catch {
    return true;
  }
}

export interface ActiveTrackerAccountInfo {
  accountId: string;
  accountUid?: string;
  accountNumber: string;
  accountName: string;
  accountEmail: string;
  role: 'admin' | 'customer';
  roleLabel?: string;
  isAdmin: boolean;
}

/**
 * Syncs visitor tracking records to Cloud Firestore / RTDB collections:
 * 1. `global_visits`
 * 2. `account_visits`
 * 3. `device_sessions`
 */
function toSafeCloudDocId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
  return cleaned || `doc_${Date.now()}`;
}

async function syncVisitorRecordsToCloud(responsePayload: {
  globalVisit?: GlobalVisitLogEntry | null;
  accountSummary?: AccountVisitSummaryRecord | null;
  deviceSession?: DeviceSessionRecord | null;
}): Promise<void> {
  try {
    const tasks: Promise<unknown>[] = [];
    if (responsePayload.globalVisit?.id) {
      tasks.push(
        writeCloudDoc(
          'global_visits',
          toSafeCloudDocId(responsePayload.globalVisit.id),
          responsePayload.globalVisit as unknown as Record<string, unknown>,
          { merge: true }
        )
      );
    }
    if (responsePayload.accountSummary?.accountKey) {
      tasks.push(
        writeCloudDoc(
          'account_visits',
          toSafeCloudDocId(responsePayload.accountSummary.accountKey),
          responsePayload.accountSummary as unknown as Record<string, unknown>,
          { merge: true }
        )
      );
    }
    if (responsePayload.deviceSession?.sessionKey) {
      tasks.push(
        writeCloudDoc(
          'device_sessions',
          toSafeCloudDocId(responsePayload.deviceSession.sessionKey),
          responsePayload.deviceSession as unknown as Record<string, unknown>,
          { merge: true }
        )
      );
    }
    if (tasks.length > 0) {
      await Promise.allSettled(tasks);
    }
  } catch {
    // Cloud mirror is non-blocking
  }
}

const GPS_OVERRIDE_STORAGE_KEY = 'bn_visitor_gps_override_v1';
export const VISITOR_LOCAL_BACKUP_STORAGE_KEY = 'bn_visitor_analytics_local_backup_v1';

interface CachedGpsLocation {
  lat: number;
  lng: number;
  accuracyMeters: number;
  city?: string;
  region?: string;
  country?: string;
  countryCode?: string;
  updatedAtMs: number;
}

// Module-level singleton state (immune to React StrictMode double-mount cancellation!)
let cachedSpecsPromise: Promise<DeviceFullSpecifications> | null = null;
let cachedSpecsValue: DeviceFullSpecifications | null = null;
let cachedGpsLocation: CachedGpsLocation | null = null;
let activeModuleSessionKey: string | null = null;
let hasCompletedInitialVisit = false;
let lastTrackedAccountIdModule: string | null = null;
let latestActiveAccountModule: ActiveTrackerAccountInfo | null = null;
let visitAnalyticsDirectListener: ((va: VisitorAnalyticsStatePayload) => void) | null = null;

export function registerVisitorTrackerDirectListener(
  cb: ((va: VisitorAnalyticsStatePayload) => void) | null
): void {
  visitAnalyticsDirectListener = cb;
}

function loadSavedGpsLocation(): CachedGpsLocation | null {
  if (cachedGpsLocation) return cachedGpsLocation;
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(GPS_OVERRIDE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGpsLocation;
    if (
      typeof parsed?.lat === 'number' &&
      typeof parsed?.lng === 'number' &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng) &&
      Date.now() - Number(parsed.updatedAtMs || 0) < 12 * 60 * 60 * 1000
    ) {
      cachedGpsLocation = parsed;
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

async function getOrCollectSpecsSingleton(): Promise<DeviceFullSpecifications> {
  if (!cachedSpecsPromise) {
    cachedSpecsPromise = collectFullDeviceSpecifications().then((specs) => {
      cachedSpecsValue = specs;
      return specs;
    });
  }
  const base = cachedSpecsValue || (await cachedSpecsPromise);
  const gps = loadSavedGpsLocation();
  if (gps) {
    return {
      ...base,
      gpsLat: gps.lat,
      gpsLng: gps.lng,
      gpsAccuracyMeters: gps.accuracyMeters,
      locationSource: 'gps',
      ...(gps.city ? { city: gps.city } : {}),
      ...(gps.region ? { region: gps.region } : {}),
      ...(gps.country ? { country: gps.country } : {}),
      ...(gps.countryCode ? { countryCode: gps.countryCode } : {}),
    };
  }
  return base;
}

export function saveLocalVisitorBackup(va: VisitorAnalyticsStatePayload | null | undefined): void {
  if (typeof window === 'undefined' || !va) return;
  try {
    const existing = loadLocalVisitorBackup();
    const incomingHits = Math.max(va.totalAllTimeHits || 0, va.globalVisits?.length || 0);
    const existingHits = existing
      ? Math.max(existing.totalAllTimeHits || 0, existing.globalVisits?.length || 0)
      : 0;
    if (incomingHits === 0 && existingHits > 0) return;

    // Keep last 400 raw visits in browser localStorage backup so storage stays fast & compact
    const compact: VisitorAnalyticsStatePayload = {
      globalVisits: (va.globalVisits || []).slice(-400),
      accountVisitsMap: va.accountVisitsMap || {},
      deviceSessionsMap: va.deviceSessionsMap || {},
      totalAllTimeHits: Math.max(incomingHits, existingHits),
      updatedAtMs: va.updatedAtMs || Date.now(),
    };
    window.localStorage.setItem(VISITOR_LOCAL_BACKUP_STORAGE_KEY, JSON.stringify(compact));
  } catch {
    // quota safe
  }
}

export function loadLocalVisitorBackup(): VisitorAnalyticsStatePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(VISITOR_LOCAL_BACKUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as VisitorAnalyticsStatePayload;
    if (!parsed || typeof parsed !== 'object') return null;
    return {
      globalVisits: Array.isArray(parsed.globalVisits) ? parsed.globalVisits : [],
      accountVisitsMap: parsed.accountVisitsMap || {},
      deviceSessionsMap: parsed.deviceSessionsMap || {},
      totalAllTimeHits: Number(parsed.totalAllTimeHits || 0),
      updatedAtMs: Number(parsed.updatedAtMs || 0),
    };
  } catch {
    return null;
  }
}

async function dispatchHeartbeatSingleton(
  acc: ActiveTrackerAccountInfo | null,
  tabSessionId: string
): Promise<DeviceSessionRecord | null> {
  try {
    const specs = await getOrCollectSpecsSingleton();
    const res = await fetch('/api/visitor-analytics/heartbeat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tabSessionId,
        sessionKey: activeModuleSessionKey,
        specs,
        account: acc,
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      deviceSession?: DeviceSessionRecord;
      accountSummary?: AccountVisitSummaryRecord | null;
      visitorAnalytics?: VisitorAnalyticsStatePayload;
    };
    if (data.deviceSession?.sessionKey) {
      activeModuleSessionKey = data.deviceSession.sessionKey;
      void syncVisitorRecordsToCloud({
        deviceSession: data.deviceSession,
        accountSummary: data.accountSummary || null,
      });
    }
    if (data.visitorAnalytics) {
      saveLocalVisitorBackup(data.visitorAnalytics);
      visitAnalyticsDirectListener?.(data.visitorAnalytics);
    }
    return data.deviceSession || null;
  } catch {
    return null;
  }
}

async function dispatchRecordVisitSingleton(
  acc: ActiveTrackerAccountInfo | null,
  triggerType: 'app_open' | 'account_login' | 'reopen',
  tabSessionId: string,
  forceBypassDebounce = false
): Promise<void> {
  try {
    const specs = await getOrCollectSpecsSingleton();
    const accountKey = acc
      ? (acc.accountId || acc.accountEmail || acc.accountNumber || '').trim().toLowerCase()
      : null;

    const isLoginTransition = triggerType === 'account_login';
    const shouldRecord =
      forceBypassDebounce || shouldRecordVisitAfterDebounce(accountKey, isLoginTransition);

    if (!shouldRecord) {
      await dispatchHeartbeatSingleton(acc, tabSessionId);
      return;
    }

    const res = await fetch('/api/visitor-analytics/record-visit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: tabSessionId,
        triggerType,
        specs,
        account: acc,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        globalVisit?: GlobalVisitLogEntry;
        accountSummary?: AccountVisitSummaryRecord;
        deviceSession?: DeviceSessionRecord;
        visitorAnalytics?: VisitorAnalyticsStatePayload;
      };
      if (data.deviceSession?.sessionKey) {
        activeModuleSessionKey = data.deviceSession.sessionKey;
      }
      if (data.visitorAnalytics) {
        saveLocalVisitorBackup(data.visitorAnalytics);
        visitAnalyticsDirectListener?.(data.visitorAnalytics);
      }
      void syncVisitorRecordsToCloud(data);
    }
  } catch {
    // non-blocking background tracker
  }
}

/**
 * Opt-in browser GPS capture: asks the browser for high-accuracy coordinates,
 * stores them locally, and immediately updates the live server & Firestore device session.
 */
export async function requestPreciseGpsLocation(
  activeAccount?: ActiveTrackerAccountInfo | null
): Promise<{
  success: boolean;
  message: string;
  locationLabel?: string;
  lat?: number;
  lng?: number;
}> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return {
      success: false,
      message: 'Browser atau perangkat ini tidak mendukung GPS Geolocation.',
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        const accuracyMeters = Math.round(pos.coords.accuracy || 0);

        let city: string | undefined;
        let region: string | undefined;
        let country: string | undefined;
        let countryCode: string | undefined;

        try {
          const revRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(
              String(lat)
            )}&longitude=${encodeURIComponent(String(lng))}&localityLanguage=id`
          );
          if (revRes.ok) {
            const rev = (await revRes.json()) as {
              city?: string;
              locality?: string;
              principalSubdivision?: string;
              countryName?: string;
              countryCode?: string;
            };
            city = rev.city || rev.locality || undefined;
            region = rev.principalSubdivision || undefined;
            country = rev.countryName || undefined;
            countryCode = rev.countryCode || undefined;
          }
        } catch {
          // server will also attempt reverse geocode cleanly
        }

        cachedGpsLocation = {
          lat,
          lng,
          accuracyMeters,
          city,
          region,
          country,
          countryCode,
          updatedAtMs: Date.now(),
        };
        try {
          window.localStorage.setItem(GPS_OVERRIDE_STORAGE_KEY, JSON.stringify(cachedGpsLocation));
        } catch {
          // ignore
        }

        const acc = activeAccount ?? latestActiveAccountModule;
        const updated = await dispatchHeartbeatSingleton(acc, getOrCreateTabSessionId());
        const locLabel =
          updated?.locationLabel ||
          [city, region, country].filter(Boolean).join(', ') ||
          `${lat}, ${lng}`;

        resolve({
          success: true,
          message: `Lokasi GPS presisi aktif: ${locLabel} (akurasi ±${accuracyMeters}m).`,
          locationLabel: locLabel,
          lat,
          lng,
        });
      },
      (err) => {
        const msg =
          err.code === 1
            ? 'Izin lokasi GPS ditolak oleh browser. Anda dapat mengizinkannya melalui pengaturan situs browser.'
            : err.code === 2
            ? 'Sinyal lokasi GPS tidak tersedia saat ini. Sistem tetap memakai deteksi Multi-Server GeoIP otomatis.'
            : 'Permintaan lokasi GPS melebihi batas waktu. Silakan coba lagi.';
        resolve({ success: false, message: msg });
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 }
    );
  });
}

/**
 * React Hook: Automatically runs in the background whenever the Web App or APK opens,
 * records initial visit immediately (immune to StrictMode double-mount!), detects account
 * login transitions (+1 visit), and sends immediate + 20s real-time heartbeats + exit signal on close.
 */
export function useBackgroundVisitorTracker(activeAccount: ActiveTrackerAccountInfo | null): void {
  const tabSessionIdRef = useRef<string>(getOrCreateTabSessionId());

  useEffect(() => {
    latestActiveAccountModule = activeAccount;
    const currentAccId = activeAccount
      ? (activeAccount.accountId || activeAccount.accountNumber || activeAccount.accountEmail)
          .trim()
          .toLowerCase()
      : null;

    if (!hasCompletedInitialVisit) {
      hasCompletedInitialVisit = true;
      lastTrackedAccountIdModule = currentAccId;
      // Record visit immediately upon opening app — never aborted by StrictMode cleanup!
      void dispatchRecordVisitSingleton(activeAccount, 'app_open', tabSessionIdRef.current, true);
    } else if (currentAccId && currentAccId !== lastTrackedAccountIdModule) {
      // User logged in or switched account -> record +1 visit immediately
      lastTrackedAccountIdModule = currentAccId;
      void dispatchRecordVisitSingleton(
        activeAccount,
        'account_login',
        tabSessionIdRef.current,
        true
      );
    } else if (!currentAccId && lastTrackedAccountIdModule !== null) {
      lastTrackedAccountIdModule = null;
      void dispatchHeartbeatSingleton(null, tabSessionIdRef.current);
    } else {
      // Same account mounted/settled -> fire immediate heartbeat so status is ONLINE right away
      void dispatchHeartbeatSingleton(activeAccount, tabSessionIdRef.current);
    }
  }, [
    activeAccount?.accountId,
    activeAccount?.accountEmail,
    activeAccount?.accountNumber,
    activeAccount?.accountUid,
    activeAccount?.role,
    activeAccount?.isAdmin,
  ]);

  // 20-second Heartbeat Loop + Visibility/Online Recovery + Page Close Offline Signal
  useEffect(() => {
    let mounted = true;
    const tabId = tabSessionIdRef.current;

    const sendBeat = () => {
      if (!mounted) return;
      void dispatchHeartbeatSingleton(latestActiveAccountModule, tabId);
    };

    const intervalId = window.setInterval(sendBeat, HEARTBEAT_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendBeat();
      }
    };

    const handleWindowOnline = () => {
      sendBeat();
    };

    const handleBeforeUnload = () => {
      const payload = JSON.stringify({
        sessionId: tabId,
        sessionKey: activeModuleSessionKey,
        deviceId: cachedSpecsValue?.deviceId,
      });
      if (typeof navigator.sendBeacon === 'function') {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/visitor-analytics/leave', blob);
      } else {
        void fetch('/api/visitor-analytics/leave', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleWindowOnline);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleWindowOnline);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, []);
}
