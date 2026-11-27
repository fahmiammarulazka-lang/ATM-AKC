import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import {
  createBuatQrisInvoiceServer,
  checkBuatQrisStatusServer,
  getBuatQrisConfig,
  testBuatQrisGatewayServer,
} from './buatQrisService';
import {
  attachVisitorAnalyticsAndTierRoutes,
  DEFAULT_VISITOR_ANALYTICS_STATE,
  type ServerVisitorAnalyticsState,
} from './serverVisitorAndTierEngine';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const STATE_FILE = path.join(__dirname, '.bank-global-state.json');
const DB_FILE = path.join(__dirname, '.bank-database.json');
const DB_TEMP_FILE = path.join(__dirname, '.bank-database.json.tmp');
const CHAT_MEDIA_DIR = path.join(__dirname, '.chat-media');

function ensureChatMediaDir() {
  try {
    if (!fs.existsSync(CHAT_MEDIA_DIR)) {
      fs.mkdirSync(CHAT_MEDIA_DIR, { recursive: true });
    }
  } catch {
    // ignore
  }
}
ensureChatMediaDir();

export interface ServerGlobalChatMessage {
  id: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  senderAccountId?: string;
  senderAccount?: string;
  senderUserId16?: string;
  senderCardTier?: string;
  isVerified?: boolean;
  adminDivisionLabel?: string;
  senderCustomBadge?: string | null;
  title: string;
  text: string;
  timestamp: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  editedAt?: string;
  editedAtMs?: number;
  expiresAtMs?: number;
  isPinned?: boolean;
  isOfficialAnnouncement?: boolean;
  isAdminHighlight?: boolean;
  replyToId?: string;
  replyToSender?: string;
  replyToPreview?: string;
  reactions?: Record<string, string[]>;
  poll?: Record<string, unknown>;
  forwardedFrom?: Record<string, unknown>;
  mentions?: string[];
  imageAttachment?: Record<string, unknown>;
  videoAttachment?: Record<string, unknown>;
  mediaAttachments?: Array<Record<string, unknown>>;
  voiceAttachment?: Record<string, unknown>;
  redPacket?: Record<string, unknown>;
}

export interface ServerGlobalChatConfig {
  adminOnlyLock: boolean;
  cooldownMs: number;
  maxVoiceDurationSec?: number;
  lockedBy?: string;
  mutedUsers?: Record<string, Record<string, unknown>>;
  bannedWords?: string[];
  bannedWordMode?: 'censor' | 'block';
  adminHighlightDefault?: boolean;
  featureFlags?: Record<string, boolean>;
  maintenanceNotice?: string;
  customWelcomeText?: string;
  activeAdminDivision?: string;
  antiSpamConfig?: { enabled: boolean; maxMessagesPer10s: number; blockExternalLinks: boolean };
  scheduledAnnouncements?: Array<Record<string, unknown>>;
  updatedAtMs: number;
}

export interface ServerPrivateChatMessage {
  id: string;
  senderAccountId?: string;
  senderAccount: string;
  senderName: string;
  senderRole?: 'admin' | 'customer';
  senderCardTier?: string;
  adminDivisionLabel?: string;
  senderCustomBadge?: string | null;
  recipientAccountId?: string;
  recipientAccount: string;
  receiverAccount?: string;
  recipientName: string;
  groupId?: string;
  text: string;
  timestamp: string;
  createdAtMs?: number;
  updatedAtMs?: number;
  editedAt?: string;
  editedAtMs?: number;
  expiresAtMs?: number;
  replyToId?: string;
  replyToSender?: string;
  replyToPreview?: string;
  deleted?: boolean;
  isPinned?: boolean;
  reactions?: Record<string, string[]>;
  readBy?: Record<string, { accountId: string; accountName: string; readAt: string; readAtMs: number }>;
  poll?: Record<string, unknown>;
  forwardedFrom?: Record<string, unknown>;
  mentions?: string[];
  imageAttachment?: Record<string, unknown>;
  videoAttachment?: Record<string, unknown>;
  mediaAttachments?: Array<Record<string, unknown>>;
  voiceAttachment?: Record<string, unknown>;
  contactAttachment?: Record<string, unknown>;
  redPacket?: Record<string, unknown>;
  splitBill?: Record<string, unknown>;
  billReminder?: Record<string, unknown>;
  transferAttachment?: Record<string, unknown>;
}

export interface ServerChatReportEntry {
  id: string;
  scope: 'global' | 'private';
  roomScope?: 'global' | 'private';
  roomKey: string;
  messageId: string;
  messagePreview: string;
  reportedAccountId?: string;
  reportedName: string;
  reportedAccountNumber?: string;
  reporterAccountId: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  resolutionNote?: string;
  adminNote?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  createdAtMs: number;
}

export interface ServerPrivateChatGroup {
  id: string;
  name: string;
  description?: string;
  rules?: string;
  iconKey: string;
  accentColor: string;
  creatorAccountId: string;
  coAdminAccountIds?: string[];
  memberAccountIds: string[];
  pinnedMessageIds?: string[];
  createdAt: string;
  updatedAtMs: number;
}

export interface ServerChatModerationLog {
  id: string;
  action: string;
  adminName: string;
  targetName?: string;
  targetAccountId?: string;
  detail: string;
  timestamp: string;
  createdAtMs: number;
}

export interface ServerSuggestionRecord {
  id: string;
  reporterAccountId?: string;
  reporterName: string;
  reporterAccountNumber?: string;
  reporterUserId16?: string;
  reporterEmail?: string;
  title: string;
  category: string;
  priority: string;
  explanation: string;
  photoDataUrl?: string;
  photoFileName?: string;
  status: string;
  isAcceptedByAdmin?: boolean;
  acceptedAt?: string;
  rejectionReason?: string;
  adminReply?: string;
  reward?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ServerPopupNotification {
  id: string;
  type: 'unban' | 'broadcast' | 'verified' | 'security' | 'admin_chat';
  title: string;
  subtitle: string;
  message: string;
  accountId?: string;
  accountName?: string;
  accountNumber?: string;
  cardTier?: string;
  senderName?: string;
  timestamp: string;
  dismissed: boolean;
}

export interface ServerBugReport {
  id: string;
  reporterAccountId?: string;
  reporterName: string;
  reporterAccountNumber?: string;
  reporterEmail?: string;
  category: string;
  explanation: string;
  photoDataUrl?: string;
  photoFileName?: string;
  status: string;
  isVerifiedByAdmin?: boolean;
  verifiedAt?: string;
  rejectionReason?: string;
  adminReply?: string;
  reward?: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
}

export interface ServerQrisOrder {
  orderId: string;
  externalInvoiceId?: string;
  accountId: string;
  purpose: string;
  diamondAmount?: number;
  baseAmount: number;
  uniqueCode: number;
  totalAmount: number;
  modeUsed: 'api' | 'emvco' | 'manual';
  configReady: boolean;
  configNotice?: string;
  qrisString: string;
  qrisImageUrl?: string;
  manualQrImageDataUrl?: string;
  manualPaymentNote?: string;
  manualSubmissionId?: string;
  manualSubmissionStatus?: 'menunggu' | 'disetujui' | 'ditolak';
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'LUNAS' | 'EXPIRED' | 'MENUNGGU_ADMIN' | 'DITOLAK';
  customerName?: string;
  description?: string;
  providerReference?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
}

export interface ServerPushAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  category: 'transaction' | 'loan' | 'security' | 'promo';
  targetView?: string;
  targetDashboardTab?: string;
  accountId?: string;
  referenceId?: string;
  timestamp: string;
}

interface PersistedGlobalState {
  globalChats: ServerGlobalChatMessage[];
  globalChatConfig: ServerGlobalChatConfig;
  privateChatMessages: ServerPrivateChatMessage[];
  privateChatGroups: ServerPrivateChatGroup[];
  chatModerationLogs: ServerChatModerationLog[];
  chatReports: ServerChatReportEntry[];
  websitePopups: ServerPopupNotification[];
  bugReports: ServerBugReport[];
  suggestions: ServerSuggestionRecord[];
  suggestionRewardConfig?: Record<string, unknown> | null;
  pushAlerts: ServerPushAlert[];
  giftEvents: unknown[];
  deletedGiftEventIds: string[];
  giftEventsInitialized: boolean;
  giftEventsUpdatedAtMs: number;
  diamondConfig?: Record<string, unknown> | null;
  uiVisibilityConfig?: Record<string, unknown> | null;
  adminWarnings: Array<Record<string, unknown>>;
  bugRewardConfig?: Record<string, unknown> | null;
  adminConfigs: Record<string, unknown>;
  configUpdatedAtMsMap: Record<string, number>;
  adminConfigRevisionMap: Record<string, number>;
  deletedAdminItemIds: Record<string, string[]>;
  customerPresenceMap: Record<string, Record<string, unknown>>;
  liveActivityLogs: Array<Record<string, unknown>>;
  autoDetectedAnomalies: Array<Record<string, unknown>>;
  sharedBankData: Record<string, unknown>;
  userSnapshotsByScope: Record<string, Record<string, unknown>>;
  qrisOrders: Record<string, ServerQrisOrder>;
  qrisAdminConfig?: Record<string, unknown> | null;
  manualQrisSubmissions: Array<Record<string, unknown>>;
  chatStatuses: Array<Record<string, unknown>>;
  chatStatusReports: Array<Record<string, unknown>>;
  socialChatPreferencesMap: Record<string, Record<string, unknown>>;
  scheduledChatMessages: Array<Record<string, unknown>>;
  dreamPockets: Array<Record<string, unknown>>;
  dreamPocketConfig?: Record<string, unknown> | null;
  safeVaultMap: Record<string, Record<string, unknown>>;
  loyaltyMap: Record<string, Record<string, unknown>>;
  loyaltyConfig?: Record<string, unknown> | null;
  visitorAnalytics: ServerVisitorAnalyticsState;
  adminTierGrantsMap: Record<string, Record<string, unknown>>;
  adminTierAuditLogs: Array<Record<string, unknown>>;
  lastUpdated: number;
}

const DEFAULT_STATE: PersistedGlobalState = {
  globalChats: [
    {
      id: 'gchat-welcome-1',
      senderName: 'Admin Utama Bank Nusantara',
      senderRole: 'admin',
      senderAccount: '9999999999',
      isVerified: true,
      title: 'Pengumuman Resmi Admin',
      text: 'Selamat datang di Chat Global & Priv Bank Nusantara! Semua nasabah kini bisa saling menyapa di Chat Global, serta menambahkan nasabah atau membuat grup tertutup di tab Chat Privat.',
      timestamp: new Date().toISOString(),
      createdAtMs: Date.now(),
      isPinned: true,
      isOfficialAnnouncement: true,
    },
  ],
  globalChatConfig: {
    adminOnlyLock: false,
    cooldownMs: 2500,
    maxVoiceDurationSec: 600,
    mutedUsers: {},
    bannedWords: [],
    bannedWordMode: 'censor',
    adminHighlightDefault: true,
    featureFlags: {},
    maintenanceNotice:
      'Layanan Chat Global & Priv sedang dinonaktifkan sementara oleh Admin untuk pemeliharaan sistem. Silakan coba kembali beberapa saat lagi.',
    customWelcomeText:
      'Selamat datang di Chat Global & Priv Bank Nusantara! Semua nasabah kini bisa saling menyapa di Chat Global, berbagi Amplop Kaget, serta menambahkan nasabah atau membuat grup tertutup di tab Chat Privat.',
    activeAdminDivision: 'CS Resmi',
    antiSpamConfig: { enabled: true, maxMessagesPer10s: 5, blockExternalLinks: false },
    scheduledAnnouncements: [],
    updatedAtMs: Date.now(),
  },
  privateChatMessages: [],
  privateChatGroups: [],
  chatModerationLogs: [],
  chatReports: [],
  websitePopups: [],
  bugReports: [
    {
      id: 'bug-sample-1',
      reporterName: 'Raden Satrio (Saya)',
      reporterAccountNumber: '1029384756',
      reporterEmail: 'satrio@nusantara.id',
      category: 'Tampilan & Fitur',
      explanation: 'Contoh laporan bug: Saat mencoba cek mutasi di layar potret HP, tampilan sudah lancar namun mohon dicek kembali oleh Admin.',
      status: 'baru',
      createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    },
  ],
  suggestions: [],
  suggestionRewardConfig: null,
  sharedBankData: {},
  userSnapshotsByScope: {},
  qrisOrders: {},
  qrisAdminConfig: { mode: 'auto_buatqris', manualUseDynamicEmvco: true, updatedAtMs: Date.now() },
  manualQrisSubmissions: [],
  chatStatuses: [],
  chatStatusReports: [],
  socialChatPreferencesMap: {},
  scheduledChatMessages: [],
  dreamPockets: [],
  dreamPocketConfig: null,
  safeVaultMap: {},
  loyaltyMap: {},
  loyaltyConfig: null,
  pushAlerts: [],
  giftEvents: [],
  deletedGiftEventIds: [],
  giftEventsInitialized: false,
  giftEventsUpdatedAtMs: 0,
  diamondConfig: null,
  uiVisibilityConfig: null,
  adminWarnings: [],
  bugRewardConfig: null,
  adminConfigs: {},
  configUpdatedAtMsMap: {},
  adminConfigRevisionMap: {},
  deletedAdminItemIds: {},
  customerPresenceMap: {},
  liveActivityLogs: [],
  autoDetectedAnomalies: [],
  visitorAnalytics: {
    ...DEFAULT_VISITOR_ANALYTICS_STATE,
    globalVisits: [],
    accountVisitsMap: {},
    deviceSessionsMap: {},
  },
  adminTierGrantsMap: {},
  adminTierAuditLogs: [],
  lastUpdated: Date.now(),
};

function loadPersistedState(): PersistedGlobalState {
  try {
    const targetFile = fs.existsSync(DB_FILE)
      ? DB_FILE
      : fs.existsSync(STATE_FILE)
      ? STATE_FILE
      : null;

    if (targetFile) {
      const raw = fs.readFileSync(targetFile, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        globalChats: Array.isArray(parsed.globalChats)
          ? parsed.globalChats
          : DEFAULT_STATE.globalChats,
        globalChatConfig:
          parsed.globalChatConfig && typeof parsed.globalChatConfig === 'object'
            ? {
                adminOnlyLock: Boolean(parsed.globalChatConfig.adminOnlyLock),
                cooldownMs: Math.max(0, Number(parsed.globalChatConfig.cooldownMs ?? 2500) || 0),
                lockedBy: parsed.globalChatConfig.lockedBy ? String(parsed.globalChatConfig.lockedBy) : undefined,
                mutedUsers:
                  parsed.globalChatConfig.mutedUsers && typeof parsed.globalChatConfig.mutedUsers === 'object'
                    ? parsed.globalChatConfig.mutedUsers
                    : {},
                bannedWords: Array.isArray(parsed.globalChatConfig.bannedWords)
                  ? parsed.globalChatConfig.bannedWords.map((w: unknown) => String(w || '').trim()).filter(Boolean)
                  : [],
                bannedWordMode: parsed.globalChatConfig.bannedWordMode === 'block' ? 'block' : 'censor',
                adminHighlightDefault: parsed.globalChatConfig.adminHighlightDefault !== false,
                featureFlags:
                  parsed.globalChatConfig.featureFlags && typeof parsed.globalChatConfig.featureFlags === 'object'
                    ? parsed.globalChatConfig.featureFlags
                    : {},
                maintenanceNotice:
                  typeof parsed.globalChatConfig.maintenanceNotice === 'string'
                    ? parsed.globalChatConfig.maintenanceNotice
                    : DEFAULT_STATE.globalChatConfig.maintenanceNotice,
                customWelcomeText:
                  typeof parsed.globalChatConfig.customWelcomeText === 'string'
                    ? parsed.globalChatConfig.customWelcomeText
                    : DEFAULT_STATE.globalChatConfig.customWelcomeText,
                activeAdminDivision:
                  typeof parsed.globalChatConfig.activeAdminDivision === 'string'
                    ? parsed.globalChatConfig.activeAdminDivision
                    : 'CS Resmi',
                antiSpamConfig:
                  parsed.globalChatConfig.antiSpamConfig && typeof parsed.globalChatConfig.antiSpamConfig === 'object'
                    ? parsed.globalChatConfig.antiSpamConfig
                    : DEFAULT_STATE.globalChatConfig.antiSpamConfig,
                scheduledAnnouncements: Array.isArray(parsed.globalChatConfig.scheduledAnnouncements)
                  ? parsed.globalChatConfig.scheduledAnnouncements
                  : [],
                updatedAtMs: Number(parsed.globalChatConfig.updatedAtMs) || Date.now(),
              }
            : DEFAULT_STATE.globalChatConfig,
        privateChatMessages: Array.isArray(parsed.privateChatMessages) ? parsed.privateChatMessages : [],
        privateChatGroups: Array.isArray(parsed.privateChatGroups) ? parsed.privateChatGroups : [],
        chatModerationLogs: Array.isArray(parsed.chatModerationLogs) ? parsed.chatModerationLogs : [],
        chatReports: Array.isArray(parsed.chatReports) ? parsed.chatReports : [],
        websitePopups: Array.isArray(parsed.websitePopups) ? parsed.websitePopups : [],
        bugReports: Array.isArray(parsed.bugReports) ? parsed.bugReports : DEFAULT_STATE.bugReports,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        suggestionRewardConfig:
          parsed.suggestionRewardConfig && typeof parsed.suggestionRewardConfig === 'object'
            ? parsed.suggestionRewardConfig
            : null,
        pushAlerts: Array.isArray(parsed.pushAlerts) ? parsed.pushAlerts : [],
        giftEvents: Array.isArray(parsed.giftEvents) ? parsed.giftEvents : [],
        deletedGiftEventIds: Array.isArray(parsed.deletedGiftEventIds)
          ? parsed.deletedGiftEventIds.map((x: unknown) => String(x))
          : [],
        giftEventsInitialized: Boolean(parsed.giftEventsInitialized),
        giftEventsUpdatedAtMs: Number(parsed.giftEventsUpdatedAtMs) || 0,
        diamondConfig:
          parsed.diamondConfig && typeof parsed.diamondConfig === 'object'
            ? parsed.diamondConfig
            : null,
        uiVisibilityConfig:
          parsed.uiVisibilityConfig && typeof parsed.uiVisibilityConfig === 'object'
            ? parsed.uiVisibilityConfig
            : null,
        adminWarnings: Array.isArray(parsed.adminWarnings) ? parsed.adminWarnings : [],
        bugRewardConfig:
          parsed.bugRewardConfig && typeof parsed.bugRewardConfig === 'object'
            ? parsed.bugRewardConfig
            : null,
        adminConfigs:
          parsed.adminConfigs && typeof parsed.adminConfigs === 'object'
            ? parsed.adminConfigs
            : {},
        configUpdatedAtMsMap:
          parsed.configUpdatedAtMsMap && typeof parsed.configUpdatedAtMsMap === 'object'
            ? parsed.configUpdatedAtMsMap
            : {},
        adminConfigRevisionMap:
          parsed.adminConfigRevisionMap && typeof parsed.adminConfigRevisionMap === 'object'
            ? parsed.adminConfigRevisionMap
            : {},
        deletedAdminItemIds:
          parsed.deletedAdminItemIds && typeof parsed.deletedAdminItemIds === 'object'
            ? parsed.deletedAdminItemIds
            : {},
        customerPresenceMap:
          parsed.customerPresenceMap && typeof parsed.customerPresenceMap === 'object'
            ? parsed.customerPresenceMap
            : {},
        liveActivityLogs: Array.isArray(parsed.liveActivityLogs) ? parsed.liveActivityLogs : [],
        autoDetectedAnomalies: Array.isArray(parsed.autoDetectedAnomalies)
          ? parsed.autoDetectedAnomalies
          : [],
        sharedBankData: parsed.sharedBankData || {},
        userSnapshotsByScope:
          parsed.userSnapshotsByScope && typeof parsed.userSnapshotsByScope === 'object'
            ? parsed.userSnapshotsByScope
            : {},
        qrisOrders:
          parsed.qrisOrders && typeof parsed.qrisOrders === 'object'
            ? parsed.qrisOrders
            : {},
        qrisAdminConfig:
          parsed.qrisAdminConfig && typeof parsed.qrisAdminConfig === 'object'
            ? parsed.qrisAdminConfig
            : DEFAULT_STATE.qrisAdminConfig,
        manualQrisSubmissions: Array.isArray(parsed.manualQrisSubmissions)
          ? parsed.manualQrisSubmissions
          : [],
        chatStatuses: Array.isArray(parsed.chatStatuses)
          ? parsed.chatStatuses.filter((s: { expiresAtMs?: unknown }) => Number(s?.expiresAtMs) > Date.now())
          : [],
        chatStatusReports: Array.isArray(parsed.chatStatusReports) ? parsed.chatStatusReports : [],
        socialChatPreferencesMap:
          parsed.socialChatPreferencesMap && typeof parsed.socialChatPreferencesMap === 'object'
            ? parsed.socialChatPreferencesMap
            : {},
        scheduledChatMessages: Array.isArray(parsed.scheduledChatMessages)
          ? parsed.scheduledChatMessages
          : [],
        dreamPockets: Array.isArray(parsed.dreamPockets) ? parsed.dreamPockets : [],
        dreamPocketConfig:
          parsed.dreamPocketConfig && typeof parsed.dreamPocketConfig === 'object'
            ? parsed.dreamPocketConfig
            : null,
        safeVaultMap:
          parsed.safeVaultMap && typeof parsed.safeVaultMap === 'object' ? parsed.safeVaultMap : {},
        loyaltyMap:
          parsed.loyaltyMap && typeof parsed.loyaltyMap === 'object' ? parsed.loyaltyMap : {},
        loyaltyConfig:
          parsed.loyaltyConfig && typeof parsed.loyaltyConfig === 'object'
            ? parsed.loyaltyConfig
            : null,
        visitorAnalytics:
          parsed.visitorAnalytics && typeof parsed.visitorAnalytics === 'object'
            ? {
                globalVisits: Array.isArray(parsed.visitorAnalytics.globalVisits)
                  ? parsed.visitorAnalytics.globalVisits
                  : [],
                accountVisitsMap:
                  parsed.visitorAnalytics.accountVisitsMap &&
                  typeof parsed.visitorAnalytics.accountVisitsMap === 'object'
                    ? parsed.visitorAnalytics.accountVisitsMap
                    : {},
                deviceSessionsMap:
                  parsed.visitorAnalytics.deviceSessionsMap &&
                  typeof parsed.visitorAnalytics.deviceSessionsMap === 'object'
                    ? parsed.visitorAnalytics.deviceSessionsMap
                    : {},
                totalAllTimeHits: Number(parsed.visitorAnalytics.totalAllTimeHits) || 0,
                updatedAtMs: Number(parsed.visitorAnalytics.updatedAtMs) || Date.now(),
              }
            : {
                ...DEFAULT_VISITOR_ANALYTICS_STATE,
                globalVisits: [],
                accountVisitsMap: {},
                deviceSessionsMap: {},
              },
        adminTierGrantsMap:
          parsed.adminTierGrantsMap && typeof parsed.adminTierGrantsMap === 'object'
            ? parsed.adminTierGrantsMap
            : {},
        adminTierAuditLogs: Array.isArray(parsed.adminTierAuditLogs)
          ? parsed.adminTierAuditLogs
          : [],
        lastUpdated: parsed.lastUpdated || Date.now(),
      };
    }
  } catch (err) {
    console.error('Failed to load persisted database state:', err);
  }
  return { ...DEFAULT_STATE };
}

let serverState: PersistedGlobalState = loadPersistedState();

function savePersistedState() {
  try {
    serverState.lastUpdated = Date.now();
    const serialized = JSON.stringify(serverState, null, 2);
    fs.writeFileSync(DB_TEMP_FILE, serialized, 'utf-8');
    fs.renameSync(DB_TEMP_FILE, DB_FILE);
    fs.writeFileSync(STATE_FILE, serialized, 'utf-8');
  } catch (err) {
    console.error('Failed to save persisted database state:', err);
  }
}

function recordServerTombstones(collectionKey: string, ids: string[]) {
  if (!collectionKey || !Array.isArray(ids) || ids.length === 0) return;
  const cleanIds = ids.map((x) => String(x || '').trim()).filter(Boolean);
  if (cleanIds.length === 0) return;
  const prev = Array.isArray(serverState.deletedAdminItemIds?.[collectionKey])
    ? serverState.deletedAdminItemIds[collectionKey]
    : [];
  serverState.deletedAdminItemIds = {
    ...(serverState.deletedAdminItemIds || {}),
    [collectionKey]: Array.from(new Set([...prev, ...cleanIds])).slice(-800),
  };
}

function mergeIncomingTombstonesMap(incomingMap: unknown) {
  if (!incomingMap || typeof incomingMap !== 'object') return;
  for (const [k, list] of Object.entries(incomingMap as Record<string, unknown>)) {
    if (Array.isArray(list)) {
      recordServerTombstones(k, list.map((x) => String(x)));
    }
  }
}

function filterListByServerTombstones<T extends { id?: unknown }>(collectionKey: string, list: T[]): T[] {
  const deleted = serverState.deletedAdminItemIds?.[collectionKey];
  if (!Array.isArray(deleted) || deleted.length === 0) return list;
  const delSet = new Set(deleted);
  return list.filter((item) => !item?.id || !delSet.has(String(item.id)));
}

function bumpServerConfigRevision(key: string, incomingRev?: number): number {
  const cur = Number(serverState.adminConfigRevisionMap?.[key]) || 0;
  const next = incomingRev && incomingRev > cur ? incomingRev : cur + 1;
  serverState.adminConfigRevisionMap = {
    ...(serverState.adminConfigRevisionMap || {}),
    [key]: next,
  };
  return next;
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);

  // Support up to 25MB JSON payloads for free photo uploads in Lapor Bug
  app.use(express.json({ limit: '25mb' }));

  // WebSocket Server on /ws (same port 3000)
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Set<WebSocket>();

  function broadcastToAll(event: { type: string; payload: unknown }) {
    const data = JSON.stringify(event);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(data);
        } catch {
          // ignore broken socket
        }
      }
    }
  }

  wss.on('connection', (ws) => {
    clients.add(ws);

    try {
      ws.send(
        JSON.stringify({
          type: 'init',
          payload: {
            globalChats: serverState.globalChats,
            globalChatConfig: serverState.globalChatConfig,
            privateChatMessages: serverState.privateChatMessages,
            privateChatGroups: serverState.privateChatGroups,
            chatModerationLogs: serverState.chatModerationLogs,
            chatReports: serverState.chatReports,
            websitePopups: serverState.websitePopups,
            bugReports: serverState.bugReports,
            suggestions: serverState.suggestions,
            suggestionRewardConfig: serverState.suggestionRewardConfig || null,
            pushAlerts: serverState.pushAlerts,
            giftEvents: serverState.giftEvents,
            deletedGiftEventIds: serverState.deletedGiftEventIds,
            giftEventsInitialized: serverState.giftEventsInitialized,
            giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs || 0,
            diamondConfig: serverState.diamondConfig || null,
            uiVisibilityConfig: serverState.uiVisibilityConfig || null,
            adminWarnings: serverState.adminWarnings || [],
            bugRewardConfig: serverState.bugRewardConfig || null,
            adminConfigs: serverState.adminConfigs || {},
            configUpdatedAtMsMap: serverState.configUpdatedAtMsMap || {},
            adminConfigRevisionMap: serverState.adminConfigRevisionMap || {},
            deletedAdminItemIds: serverState.deletedAdminItemIds || {},
            customerPresenceMap: serverState.customerPresenceMap || {},
            liveActivityLogs: serverState.liveActivityLogs || [],
            autoDetectedAnomalies: serverState.autoDetectedAnomalies || [],
            sharedBankData: serverState.sharedBankData,
            qrisAdminConfig: serverState.qrisAdminConfig || DEFAULT_STATE.qrisAdminConfig,
            manualQrisSubmissions: serverState.manualQrisSubmissions || [],
            chatStatuses: (serverState.chatStatuses || []).filter(
              (s) => Number(s?.expiresAtMs) > Date.now()
            ),
            chatStatusReports: serverState.chatStatusReports || [],
            socialChatPreferencesMap: serverState.socialChatPreferencesMap || {},
            scheduledChatMessages: serverState.scheduledChatMessages || [],
            dreamPockets: serverState.dreamPockets || [],
            dreamPocketConfig: serverState.dreamPocketConfig || null,
            safeVaultMap: serverState.safeVaultMap || {},
            loyaltyMap: serverState.loyaltyMap || {},
            loyaltyConfig: serverState.loyaltyConfig || null,
            visitorAnalytics: serverState.visitorAnalytics || DEFAULT_VISITOR_ANALYTICS_STATE,
            adminTierGrantsMap: serverState.adminTierGrantsMap || {},
            adminTierAuditLogs: serverState.adminTierAuditLogs || [],
            connectedDevices: clients.size,
            lastUpdated: serverState.lastUpdated,
          },
        })
      );
    } catch {
      // ignore
    }

    broadcastToAll({
      type: 'presence',
      payload: { connectedDevices: clients.size },
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'global_chat:send' && msg.payload) {
          handleNewGlobalChat(msg.payload);
        } else if (msg.type === 'private_chat:send' && msg.payload) {
          handleNewPrivateChatMessage(msg.payload);
        } else if (msg.type === 'private_group:upsert' && msg.payload) {
          handleUpsertPrivateGroup(msg.payload);
        } else if (msg.type === 'chat:typing' && msg.payload) {
          broadcastToAll({
            type: 'chat:typing',
            payload: {
              roomKey: String(msg.payload.roomKey || ''),
              accountId: String(msg.payload.accountId || ''),
              accountName: String(msg.payload.accountName || 'Nasabah').slice(0, 60),
              expiresAtMs: Date.now() + 4500,
            },
          });
        } else if (msg.type === 'qris_admin_config:sync' && msg.payload) {
          const incoming = msg.payload as Record<string, unknown>;
          const incTs = Number(incoming.updatedAtMs) || Date.now();
          const curTs = Number(serverState.qrisAdminConfig?.updatedAtMs) || 0;
          if (incTs >= curTs) {
            serverState.qrisAdminConfig = { ...incoming, updatedAtMs: incTs };
            savePersistedState();
            broadcastToAll({
              type: 'qris_admin_config:updated',
              payload: { qrisAdminConfig: serverState.qrisAdminConfig },
            });
          }
        } else if (msg.type === 'qris_manual_submission:upsert' && msg.payload?.submission) {
          const sub = msg.payload.submission as Record<string, unknown>;
          const id = String(sub.id || '');
          if (id) {
            const list = Array.isArray(serverState.manualQrisSubmissions)
              ? [...serverState.manualQrisSubmissions]
              : [];
            const idx = list.findIndex((x) => String(x.id) === id);
            if (idx >= 0) list[idx] = sub;
            else list.unshift(sub);
            serverState.manualQrisSubmissions = list.slice(0, 200);
            if (sub.orderId && serverState.qrisOrders?.[String(sub.orderId)]) {
              const targetOrd = serverState.qrisOrders[String(sub.orderId)];
              if (sub.status === 'disetujui') {
                targetOrd.status = 'LUNAS';
                targetOrd.manualSubmissionStatus = 'disetujui';
                targetOrd.paidAt = new Date().toISOString();
              } else if (sub.status === 'ditolak') {
                targetOrd.status = 'DITOLAK';
                targetOrd.manualSubmissionStatus = 'ditolak';
              } else {
                targetOrd.status = 'MENUNGGU_ADMIN';
                targetOrd.manualSubmissionStatus = 'menunggu';
                targetOrd.manualSubmissionId = id;
              }
            }
            savePersistedState();
            broadcastToAll({
              type: 'qris_manual_submission:updated',
              payload: {
                submission: sub,
                manualQrisSubmissions: serverState.manualQrisSubmissions,
              },
            });
          }
        } else if (msg.type === 'chat_status:upsert' && msg.payload?.statusEntry) {
          const entry = msg.payload.statusEntry as Record<string, unknown>;
          const id = String(entry.id || '');
          if (id) {
            const nowMs = Date.now();
            const list = (serverState.chatStatuses || []).filter(
              (s) => Number(s.expiresAtMs) > nowMs && String(s.id) !== id
            );
            if (Number(entry.expiresAtMs) > nowMs) {
              list.unshift(entry);
            }
            serverState.chatStatuses = list.slice(0, 300);
            savePersistedState();
            broadcastToAll({
              type: 'chat_status:updated',
              payload: { chatStatuses: serverState.chatStatuses },
            });
          }
        } else if (msg.type === 'chat_status:delete' && msg.payload?.statusId) {
          const targetId = String(msg.payload.statusId);
          serverState.chatStatuses = (serverState.chatStatuses || []).filter(
            (s) => String(s.id) !== targetId
          );
          savePersistedState();
          broadcastToAll({
            type: 'chat_status:updated',
            payload: { chatStatuses: serverState.chatStatuses },
          });
        } else if (msg.type === 'chat_status_report:upsert' && msg.payload?.report) {
          const rep = msg.payload.report as Record<string, unknown>;
          const id = String(rep.id || '');
          if (id) {
            const list = [...(serverState.chatStatusReports || [])];
            const idx = list.findIndex((r) => String(r.id) === id);
            if (idx >= 0) list[idx] = rep;
            else list.unshift(rep);
            serverState.chatStatusReports = list.slice(0, 150);
            savePersistedState();
            broadcastToAll({
              type: 'chat_status_report:updated',
              payload: { chatStatusReports: serverState.chatStatusReports },
            });
          }
        } else if (msg.type === 'social_prefs:sync' && msg.payload?.accountId && msg.payload?.prefs) {
          const accId = String(msg.payload.accountId);
          serverState.socialChatPreferencesMap = {
            ...(serverState.socialChatPreferencesMap || {}),
            [accId]: msg.payload.prefs as Record<string, unknown>,
          };
          savePersistedState();
          broadcastToAll({
            type: 'social_prefs:updated',
            payload: { accountId: accId, prefs: msg.payload.prefs },
          });
        } else if (msg.type === 'scheduled_chat:sync' && Array.isArray(msg.payload?.items)) {
          serverState.scheduledChatMessages = (msg.payload.items as Array<Record<string, unknown>>).slice(0, 200);
          savePersistedState();
          broadcastToAll({
            type: 'scheduled_chat:updated',
            payload: { scheduledChatMessages: serverState.scheduledChatMessages },
          });
        } else if (msg.type === 'dream_pockets:sync' && msg.payload) {
          if (Array.isArray(msg.payload.dreamPockets)) {
            serverState.dreamPockets = (msg.payload.dreamPockets as Array<Record<string, unknown>>).slice(0, 300);
          }
          if (msg.payload.dreamPocketConfig && typeof msg.payload.dreamPocketConfig === 'object') {
            serverState.dreamPocketConfig = msg.payload.dreamPocketConfig as Record<string, unknown>;
          }
          savePersistedState();
          broadcastToAll({
            type: 'dream_pockets:updated',
            payload: {
              dreamPockets: serverState.dreamPockets,
              dreamPocketConfig: serverState.dreamPocketConfig,
            },
          });
        } else if (msg.type === 'safe_vault:sync' && msg.payload?.accountId && msg.payload?.state) {
          const accId = String(msg.payload.accountId);
          serverState.safeVaultMap = {
            ...(serverState.safeVaultMap || {}),
            [accId]: msg.payload.state as Record<string, unknown>,
          };
          savePersistedState();
          broadcastToAll({
            type: 'safe_vault:updated',
            payload: { accountId: accId, state: msg.payload.state },
          });
        } else if (msg.type === 'loyalty:sync' && msg.payload) {
          if (msg.payload.loyaltyMap && typeof msg.payload.loyaltyMap === 'object') {
            serverState.loyaltyMap = {
              ...(serverState.loyaltyMap || {}),
              ...(msg.payload.loyaltyMap as Record<string, Record<string, unknown>>),
            };
          }
          if (msg.payload.loyaltyConfig && typeof msg.payload.loyaltyConfig === 'object') {
            serverState.loyaltyConfig = msg.payload.loyaltyConfig as Record<string, unknown>;
          }
          savePersistedState();
          broadcastToAll({
            type: 'loyalty:updated',
            payload: {
              loyaltyMap: serverState.loyaltyMap,
              loyaltyConfig: serverState.loyaltyConfig,
            },
          });
        } else if (msg.type === 'website_popup:send' && msg.payload) {
          handleNewPopup(msg.payload);
        } else if (msg.type === 'bug_report:send' && msg.payload) {
          handleNewBugReport(msg.payload);
        } else if (msg.type === 'suggestion:send' && msg.payload) {
          handleNewSuggestion(msg.payload);
        } else if (msg.type === 'push_alert:send' && msg.payload) {
          handleNewPushAlert(msg.payload);
        } else if (msg.type === 'gift_events:sync' && Array.isArray(msg.payload?.giftEvents)) {
          const incomingGiftTs = Number(msg.payload?.giftEventsUpdatedAtMs) || 0;
          const currentGiftTs = Number(serverState.giftEventsUpdatedAtMs) || 0;
          if (incomingGiftTs > 0 && currentGiftTs > 0 && incomingGiftTs < currentGiftTs) {
            return;
          }
          if (Array.isArray(msg.payload?.deletedGiftEventIds)) {
            serverState.deletedGiftEventIds = Array.from(
              new Set([
                ...serverState.deletedGiftEventIds,
                ...msg.payload.deletedGiftEventIds.map((id: unknown) => String(id)),
              ])
            );
          }
          serverState.giftEvents = (msg.payload.giftEvents as Array<{ id?: string }>).filter(
            (e) => !e?.id || !serverState.deletedGiftEventIds.includes(String(e.id))
          );
          serverState.giftEventsInitialized = true;
          serverState.giftEventsUpdatedAtMs =
            incomingGiftTs > 0 ? incomingGiftTs : Math.max(Date.now(), currentGiftTs + 1);
          savePersistedState();
          broadcastToAll({
            type: 'gift_events:updated',
            payload: {
              giftEvents: serverState.giftEvents,
              deletedGiftEventIds: serverState.deletedGiftEventIds,
              giftEventsInitialized: serverState.giftEventsInitialized,
              giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs,
              lastUpdated: serverState.lastUpdated,
            },
          });
        } else if (msg.type === 'diamond_config:sync' && msg.payload && typeof msg.payload === 'object') {
          const rawCfg = (msg.payload.diamondConfig || msg.payload) as Record<string, unknown>;
          const incomingTs = Number(msg.payload?.updatedAtMs ?? rawCfg.updatedAtMs) || 0;
          const currentTs = Number(serverState.configUpdatedAtMsMap?.diamondConfig) || 0;
          if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) return;
          const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
          const basePriceRaw = Number(rawCfg.baseDiamondPriceRupiah);
          const discRaw = Number(rawCfg.diamondDiscountPercent);
          const maxCustomRaw = Number(rawCfg.maxCustomDiamond);
          const maxPurchRaw = Number(rawCfg.maxPurchaseRupiah);
          serverState.diamondConfig = {
            ...rawCfg,
            baseDiamondPriceRupiah: Math.max(1, Math.round(Number.isFinite(basePriceRaw) && rawCfg.baseDiamondPriceRupiah !== undefined ? basePriceRaw : 90)),
            diamondDiscountPercent: Math.max(0, Math.min(99, Math.round(Number.isFinite(discRaw) ? discRaw : 0))),
            maxCustomDiamond: Math.max(1, Math.min(11_099, Math.round(Number.isFinite(maxCustomRaw) && rawCfg.maxCustomDiamond !== undefined ? maxCustomRaw : 11_099))),
            maxPurchaseRupiah: Math.max(1, Math.min(998_910, Math.round(Number.isFinite(maxPurchRaw) && rawCfg.maxPurchaseRupiah !== undefined ? maxPurchRaw : 998_910))),
            priceRevision: 3,
            updatedAtMs: nextTs,
            updatedAt: new Date(nextTs).toISOString(),
          };
          serverState.configUpdatedAtMsMap = {
            ...(serverState.configUpdatedAtMsMap || {}),
            diamondConfig: nextTs,
          };
          serverState.adminConfigs = {
            ...(serverState.adminConfigs || {}),
            diamondConfig: serverState.diamondConfig,
          };
          savePersistedState();
          broadcastToAll({
            type: 'diamond_config:updated',
            payload: { diamondConfig: serverState.diamondConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated },
          });
        } else if (msg.type === 'ui_visibility:sync' && msg.payload && typeof msg.payload === 'object') {
          const rawVis = (msg.payload.uiVisibilityConfig || msg.payload) as Record<string, unknown>;
          const incomingTs = Number(msg.payload?.updatedAtMs ?? rawVis.updatedAtMs) || 0;
          const currentTs = Number(serverState.configUpdatedAtMsMap?.uiVisibilityConfig) || 0;
          if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) return;
          const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
          serverState.uiVisibilityConfig = {
            ...rawVis,
            updatedAtMs: nextTs,
            updatedAt: new Date(nextTs).toISOString(),
          };
          serverState.configUpdatedAtMsMap = {
            ...(serverState.configUpdatedAtMsMap || {}),
            uiVisibilityConfig: nextTs,
          };
          serverState.adminConfigs = {
            ...(serverState.adminConfigs || {}),
            uiVisibilityConfig: serverState.uiVisibilityConfig,
          };
          savePersistedState();
          broadcastToAll({
            type: 'ui_visibility:updated',
            payload: { uiVisibilityConfig: serverState.uiVisibilityConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated },
          });
        } else if (msg.type === 'admin_warnings:sync' && Array.isArray(msg.payload?.adminWarnings)) {
          const incomingTs = Number(msg.payload?.updatedAtMs) || 0;
          const incomingRev = Number(msg.payload?.revision) || 0;
          const currentTs = Number(serverState.configUpdatedAtMsMap?.adminWarnings) || 0;
          const currentRev = Number(serverState.adminConfigRevisionMap?.adminWarnings) || 0;
          if (incomingRev > 0 && currentRev > 0 && incomingRev < currentRev) return;
          if (incomingRev === 0 && incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) return;
          if (Array.isArray(msg.payload?.deletedIds)) {
            recordServerTombstones('adminWarnings', msg.payload.deletedIds);
          }
          mergeIncomingTombstonesMap(msg.payload?.deletedAdminItemIds);
          const nextTs = Math.max(Date.now(), incomingTs, currentTs + 1);
          const nextRev = bumpServerConfigRevision('adminWarnings', incomingRev);
          serverState.adminWarnings = filterListByServerTombstones(
            'adminWarnings',
            (msg.payload.adminWarnings as Array<Record<string, unknown>>).slice(0, 100)
          );
          serverState.configUpdatedAtMsMap = {
            ...(serverState.configUpdatedAtMsMap || {}),
            adminWarnings: nextTs,
          };
          serverState.adminConfigs = {
            ...(serverState.adminConfigs || {}),
            adminWarnings: serverState.adminWarnings,
          };
          savePersistedState();
          broadcastToAll({
            type: 'admin_warnings:updated',
            payload: {
              adminWarnings: serverState.adminWarnings,
              updatedAtMs: nextTs,
              revision: nextRev,
              deletedAdminItemIds: serverState.deletedAdminItemIds,
              lastUpdated: serverState.lastUpdated,
            },
          });
        } else if (msg.type === 'bug_reward_config:sync' && msg.payload && typeof msg.payload === 'object') {
          const rawBug = (msg.payload.bugRewardConfig || msg.payload) as Record<string, unknown>;
          const incomingTs = Number(msg.payload?.updatedAtMs ?? rawBug.updatedAtMs) || 0;
          const currentTs = Number(serverState.configUpdatedAtMsMap?.bugRewardConfig) || 0;
          if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) return;
          const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
          serverState.bugRewardConfig = {
            ...rawBug,
            enabled: Boolean(rawBug.enabled),
            cashAmount: Math.max(0, Math.floor(Number(rawBug.cashAmount ?? 0) || 0)),
            coinAmount: Math.max(0, Math.floor(Number(rawBug.coinAmount ?? 0) || 0)),
            diamondAmount: Math.max(0, Math.floor(Number(rawBug.diamondAmount ?? 0) || 0)),
            goldGrams: Math.max(0, Math.round((Number(rawBug.goldGrams ?? 0) || 0) * 100) / 100),
            voucherAmount: Math.max(0, Math.floor(Number(rawBug.voucherAmount ?? 0) || 0)),
            pointsAmount: Math.max(0, Math.floor(Number(rawBug.pointsAmount ?? 0) || 0)),
            familySlotAmount: Math.max(0, Math.floor(Number(rawBug.familySlotAmount ?? 0) || 0)),
            defaultRewardMessage: String(rawBug.defaultRewardMessage ?? rawBug.defaultMessage ?? '').slice(0, 300),
            updatedAtMs: nextTs,
            updatedAt: new Date(nextTs).toISOString(),
          };
          serverState.configUpdatedAtMsMap = {
            ...(serverState.configUpdatedAtMsMap || {}),
            bugRewardConfig: nextTs,
          };
          serverState.adminConfigs = {
            ...(serverState.adminConfigs || {}),
            bugRewardConfig: serverState.bugRewardConfig,
          };
          savePersistedState();
          broadcastToAll({
            type: 'bug_reward_config:updated',
            payload: { bugRewardConfig: serverState.bugRewardConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated },
          });
        } else if (msg.type === 'admin_config:sync' && msg.payload && typeof msg.payload.key === 'string') {
          const cfgKey = String(msg.payload.key).trim().slice(0, 80);
          if (!cfgKey || msg.payload.value === undefined) return;
          const incomingTs = Number(msg.payload.updatedAtMs) || 0;
          const incomingRev = Number(msg.payload.revision) || 0;
          const currentTs = Number(serverState.configUpdatedAtMsMap?.[cfgKey]) || 0;
          const currentRev = Number(serverState.adminConfigRevisionMap?.[cfgKey]) || 0;
          if (incomingRev > 0 && currentRev > 0 && incomingRev < currentRev) return;
          if (incomingRev === 0 && incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) return;
          if (Array.isArray(msg.payload.deletedIds)) {
            recordServerTombstones(cfgKey, msg.payload.deletedIds);
          }
          mergeIncomingTombstonesMap(msg.payload.deletedAdminItemIds);
          const nextTs = Math.max(Date.now(), incomingTs, currentTs + 1);
          const nextRev = bumpServerConfigRevision(cfgKey, incomingRev);
          const nextVal = Array.isArray(msg.payload.value)
            ? filterListByServerTombstones(cfgKey, msg.payload.value as Array<{ id?: unknown }>)
            : msg.payload.value;
          serverState.adminConfigs = {
            ...(serverState.adminConfigs || {}),
            [cfgKey]: nextVal,
          };
          serverState.configUpdatedAtMsMap = {
            ...(serverState.configUpdatedAtMsMap || {}),
            [cfgKey]: nextTs,
          };
          if (cfgKey === 'bugRewardConfig' && nextVal && typeof nextVal === 'object') {
            serverState.bugRewardConfig = nextVal as Record<string, unknown>;
          } else if (cfgKey === 'diamondConfig' && nextVal && typeof nextVal === 'object') {
            serverState.diamondConfig = nextVal as Record<string, unknown>;
          } else if (cfgKey === 'uiVisibilityConfig' && nextVal && typeof nextVal === 'object') {
            serverState.uiVisibilityConfig = nextVal as Record<string, unknown>;
          } else if (cfgKey === 'adminWarnings' && Array.isArray(nextVal)) {
            serverState.adminWarnings = nextVal as Array<Record<string, unknown>>;
          } else if (cfgKey === 'bugReports' && Array.isArray(nextVal)) {
            serverState.bugReports = nextVal as ServerBugReport[];
          } else if (cfgKey === 'globalChats' && Array.isArray(nextVal)) {
            serverState.globalChats = nextVal as ServerGlobalChatMessage[];
          } else if (cfgKey === 'websitePopups' && Array.isArray(nextVal)) {
            serverState.websitePopups = nextVal as ServerPopupNotification[];
          }
          savePersistedState();
          broadcastToAll({
            type: 'admin_config:updated',
            payload: {
              key: cfgKey,
              value: nextVal,
              updatedAtMs: nextTs,
              revision: nextRev,
              deletedAdminItemIds: serverState.deletedAdminItemIds,
              lastUpdated: serverState.lastUpdated,
            },
          });
        } else if (msg.type === 'presence:heartbeat' && msg.payload && msg.payload.accountId) {
          const accId = String(msg.payload.accountId);
          serverState.customerPresenceMap = {
            ...(serverState.customerPresenceMap || {}),
            [accId]: {
              ...(msg.payload as Record<string, unknown>),
              serverReceivedAtMs: Date.now(),
            },
          };
          broadcastToAll({
            type: 'presence:updated',
            payload: {
              accountId: accId,
              presence: serverState.customerPresenceMap[accId],
            },
          });
        } else if (msg.type === 'live_activity:push' && msg.payload && msg.payload.id) {
          const entry = msg.payload as Record<string, unknown>;
          if (!serverState.liveActivityLogs.some((l) => String(l.id) === String(entry.id))) {
            serverState.liveActivityLogs = [entry, ...serverState.liveActivityLogs].slice(0, 500);
            broadcastToAll({
              type: 'live_activity:new',
              payload: { entry },
            });
          }
        } else if (msg.type === 'anomaly:push' && msg.payload && msg.payload.id) {
          const alertItem = msg.payload as Record<string, unknown>;
          const exists = serverState.autoDetectedAnomalies.some((a) => String(a.id) === String(alertItem.id));
          serverState.autoDetectedAnomalies = exists
            ? serverState.autoDetectedAnomalies.map((a) =>
                String(a.id) === String(alertItem.id) ? alertItem : a
              )
            : [alertItem, ...serverState.autoDetectedAnomalies].slice(0, 120);
          savePersistedState();
          broadcastToAll({
            type: 'anomaly:updated',
            payload: { alert: alertItem, autoDetectedAnomalies: serverState.autoDetectedAnomalies },
          });
        } else if (msg.type === 'bank_data:sync' && msg.payload) {
          serverState.sharedBankData = {
            ...serverState.sharedBankData,
            ...msg.payload,
          };
          savePersistedState();
          broadcastToAll({
            type: 'bank_data:updated',
            payload: {
              sharedBankData: serverState.sharedBankData,
              lastUpdated: serverState.lastUpdated,
            },
          });
        }
      } catch {
        // ignore malformed message
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      broadcastToAll({
        type: 'presence',
        payload: { connectedDevices: clients.size },
      });
    });
  });

  // Track per-sender anti-spam cooldown for non-Admin Global Chat messages
  const globalChatLastSentMs = new Map<string, number>();
  const globalChatBurstTimesMs = new Map<string, number[]>();

  // Global Chat terbuka untuk semua nasabah & Admin (Admin punya lencana khusus, anti-spam & mode khusus Admin opsional)
  function handleNewGlobalChat(input: {
    id?: string;
    senderName?: string;
    senderRole?: 'admin' | 'customer';
    senderAccountId?: string;
    senderAccount?: string;
    senderUserId16?: string;
    senderCardTier?: string;
    isVerified?: boolean;
    adminDivisionLabel?: string;
    senderCustomBadge?: string | null;
    title?: string;
    text: string;
    timestamp?: string;
    createdAtMs?: number;
    expiresAtMs?: number;
    isPinned?: boolean;
    isOfficialAnnouncement?: boolean;
    isAdminHighlight?: boolean;
    replyToId?: string;
    replyToSender?: string;
    replyToPreview?: string;
    reactions?: Record<string, string[]>;
    poll?: Record<string, unknown>;
    forwardedFrom?: { originalSenderName: string; sourceRoomLabel?: string };
    mentions?: string[];
    imageAttachment?: Record<string, unknown>;
    videoAttachment?: Record<string, unknown>;
    mediaAttachments?: Array<Record<string, unknown>>;
    voiceAttachment?: Record<string, unknown>;
    redPacket?: Record<string, unknown>;
    showPopupOnAllPhones?: boolean;
  }): { message?: ServerGlobalChatMessage; popup?: ServerPopupNotification | null; error?: string } | null {
    const cleanText = String(input.text || '').trim();
    const hasMediaArray = Array.isArray(input.mediaAttachments) && input.mediaAttachments.length > 0;
    if (!cleanText && !input.poll && !input.imageAttachment && !input.videoAttachment && !hasMediaArray && !input.voiceAttachment && !input.redPacket) {
      return { error: 'Pesan Chat Global tidak boleh kosong.' };
    }
    const isAdminSender = input.senderRole === 'admin';
    const flags = serverState.globalChatConfig?.featureFlags || {};

    let processedText = cleanText;

    if (!isAdminSender) {
      if (flags.chatSystemDisabled || flags.disableGlobalChat) {
        return { error: 'Fitur Chat Global sedang dinonaktifkan sementara oleh Admin.' };
      }
      const hasImageMedia =
        Boolean(input.imageAttachment) ||
        (hasMediaArray && input.mediaAttachments!.some((m) => m?.kind === 'image'));
      const hasVideoMedia =
        Boolean(input.videoAttachment) ||
        (hasMediaArray && input.mediaAttachments!.some((m) => m?.kind === 'video'));
      if (hasImageMedia && flags.disableImages) {
        return { error: 'Pengiriman foto di chat sedang dinonaktifkan oleh Admin.' };
      }
      if (hasVideoMedia && flags.disableVideos) {
        return { error: 'Pengiriman video di chat sedang dinonaktifkan oleh Admin.' };
      }
      if (input.voiceAttachment && flags.disableVoiceNotes) {
        return { error: 'Pengiriman pesan suara sedang dinonaktifkan oleh Admin.' };
      }
      if (input.poll && flags.disablePolls) {
        return { error: 'Fitur Polling sedang dinonaktifkan oleh Admin.' };
      }
      if (input.redPacket && flags.disableRedPacket) {
        return { error: 'Fitur Amplop Kaget sedang dinonaktifkan oleh Admin.' };
      }
      if (serverState.globalChatConfig?.adminOnlyLock) {
        return { error: 'Ruang Chat Global sedang dalam Mode Khusus Admin sementara.' };
      }

      // Check Mute status
      const senderAccId = String(input.senderAccountId || '');
      const mutedEntry = senderAccId && serverState.globalChatConfig?.mutedUsers
        ? (serverState.globalChatConfig.mutedUsers[senderAccId] as {
            isPermanent?: boolean;
            mutedUntilMs?: number | null;
            durationLabel?: string;
            reason?: string;
          } | undefined)
        : undefined;
      if (mutedEntry) {
        const untilMs = Number(mutedEntry.mutedUntilMs || 0);
        if (mutedEntry.isPermanent || (untilMs > 0 && untilMs > Date.now())) {
          const reasonSuffix = mutedEntry.reason ? ` (${mutedEntry.reason})` : '';
          return {
            error: mutedEntry.isPermanent
              ? `Akun Anda dibisukan permanen di Chat Global oleh Admin${reasonSuffix}.`
              : `Akun Anda sedang dibisukan di Chat Global (${mutedEntry.durationLabel || 'sementara'})${reasonSuffix}.`,
          };
        }
      }

      // Anti-Spam Burst & Link check
      const antiSpam = serverState.globalChatConfig?.antiSpamConfig;
      if (antiSpam?.enabled) {
        if (antiSpam.blockExternalLinks && /(https?:\/\/|www\.|\.[a-z]{2,}\/)/i.test(processedText)) {
          return { error: 'Anti-Spam: Pengiriman tautan/link eksternal dinonaktifkan oleh Admin.' };
        }
        const senderKey = String(input.senderAccountId || input.senderAccount || input.senderName || 'anon');
        const nowBurst = Date.now();
        const prevTimes = (globalChatBurstTimesMs.get(senderKey) || []).filter((t) => nowBurst - t < 10_000);
        const maxPer10s = Math.max(2, Number(antiSpam.maxMessagesPer10s) || 5);
        if (prevTimes.length >= maxPer10s) {
          return { error: `Anti-Spam Otomatis: Terlalu banyak pesan dalam 10 detik (maks ${maxPer10s}).` };
        }
        globalChatBurstTimesMs.set(senderKey, [...prevTimes, nowBurst]);
      }

      // Check Banned Words filter
      const bannedWords = Array.isArray(serverState.globalChatConfig?.bannedWords)
        ? serverState.globalChatConfig.bannedWords
        : [];
      if (bannedWords.length > 0 && processedText) {
        const mode = serverState.globalChatConfig?.bannedWordMode === 'block' ? 'block' : 'censor';
        for (const rawWord of bannedWords) {
          const w = String(rawWord || '').trim();
          if (!w) continue;
          const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escaped, 'gi');
          if (regex.test(processedText)) {
            if (mode === 'block') {
              return { error: 'Pesan ditolak karena mengandung kata terlarang di Chat Global.' };
            }
            processedText = processedText.replace(regex, '*'.repeat(Math.max(3, w.length)));
          }
        }
      }

      const cooldownMs = Math.max(0, Number(serverState.globalChatConfig?.cooldownMs ?? 2500) || 0);
      const senderKey = String(input.senderAccountId || input.senderAccount || input.senderName || 'anon');
      const lastSent = globalChatLastSentMs.get(senderKey) || 0;
      const elapsed = Date.now() - lastSent;
      if (cooldownMs > 0 && elapsed < cooldownMs) {
        const waitSec = Math.max(1, Math.ceil((cooldownMs - elapsed) / 1000));
        return { error: `Anti-spam aktif: tunggu ${waitSec} detik sebelum mengirim pesan lagi.` };
      }
      globalChatLastSentMs.set(senderKey, Date.now());
    }

    const msgId = input.id || `gchat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = serverState.globalChats.find((m) => m.id === msgId);
    if (existing) return { message: existing, popup: null };

    const nowMs = Date.now();
    const newMsg: ServerGlobalChatMessage = {
      id: msgId,
      senderName: String(input.senderName || (isAdminSender ? 'Admin Bank Nusantara' : 'Nasabah Bank Nusantara')).trim().slice(0, 80),
      senderRole: isAdminSender ? 'admin' : 'customer',
      senderAccountId: input.senderAccountId ? String(input.senderAccountId) : undefined,
      senderAccount: input.senderAccount ? String(input.senderAccount) : isAdminSender ? '9999999999' : undefined,
      senderUserId16: input.senderUserId16 ? String(input.senderUserId16) : undefined,
      senderCardTier: input.senderCardTier ? String(input.senderCardTier) : undefined,
      isVerified: isAdminSender ? true : Boolean(input.isVerified),
      adminDivisionLabel: isAdminSender && input.adminDivisionLabel ? String(input.adminDivisionLabel).slice(0, 40) : undefined,
      senderCustomBadge: input.senderCustomBadge ? String(input.senderCustomBadge) : null,
      title: isAdminSender ? String(input.title || 'Pesan dari Admin') : 'Chat Global Nasabah',
      text: processedText.slice(0, 1500),
      timestamp: input.timestamp || new Date(nowMs).toISOString(),
      createdAtMs: Number(input.createdAtMs) || nowMs,
      updatedAtMs: nowMs,
      expiresAtMs: Number(input.expiresAtMs) > nowMs ? Number(input.expiresAtMs) : undefined,
      isPinned: isAdminSender ? Boolean(input.isPinned) : false,
      isOfficialAnnouncement: isAdminSender ? Boolean(input.isOfficialAnnouncement ?? input.showPopupOnAllPhones) : false,
      isAdminHighlight: isAdminSender ? Boolean(input.isAdminHighlight ?? serverState.globalChatConfig?.adminHighlightDefault ?? true) : false,
      replyToId: input.replyToId ? String(input.replyToId) : undefined,
      replyToSender: input.replyToSender ? String(input.replyToSender).slice(0, 80) : undefined,
      replyToPreview: input.replyToPreview ? String(input.replyToPreview).slice(0, 140) : undefined,
      reactions: input.reactions && typeof input.reactions === 'object' ? input.reactions : undefined,
      poll: input.poll && typeof input.poll === 'object' ? input.poll : undefined,
      forwardedFrom: input.forwardedFrom && typeof input.forwardedFrom === 'object' ? input.forwardedFrom : undefined,
      mentions: Array.isArray(input.mentions) ? input.mentions.map((x) => String(x)).slice(0, 20) : undefined,
      imageAttachment: input.imageAttachment && typeof input.imageAttachment === 'object' ? input.imageAttachment : undefined,
      videoAttachment: input.videoAttachment && typeof input.videoAttachment === 'object' ? input.videoAttachment : undefined,
      mediaAttachments: Array.isArray(input.mediaAttachments) ? input.mediaAttachments.slice(0, 12) : undefined,
      voiceAttachment: input.voiceAttachment && typeof input.voiceAttachment === 'object' ? input.voiceAttachment : undefined,
      redPacket: input.redPacket && typeof input.redPacket === 'object' ? input.redPacket : undefined,
    };

    serverState.globalChats = [newMsg, ...serverState.globalChats].slice(0, 300);

    // Pop-up layar penuh HANYA muncul untuk pengumuman resmi Admin yang menandai showPopupOnAllPhones === true
    let createdPopup: ServerPopupNotification | null = null;
    if (isAdminSender && input.showPopupOnAllPhones === true) {
      createdPopup = {
        id: `popup-gchat-${msgId}`,
        type: 'admin_chat',
        title: 'Pesan dari Admin',
        subtitle: 'PESAN RESMI DARI PANEL ADMIN BANK NUSANTARA',
        message: processedText,
        senderName: newMsg.senderName,
        accountName: 'Seluruh HP & Nasabah Bank Nusantara',
        accountNumber: 'PESAN DARI ADMIN',
        timestamp: newMsg.timestamp,
        dismissed: false,
      };
      serverState.websitePopups = [createdPopup, ...serverState.websitePopups].slice(0, 100);
    }

    savePersistedState();

    broadcastToAll({
      type: 'global_chat:new',
      payload: {
        message: newMsg,
        popup: createdPopup,
        lastUpdated: serverState.lastUpdated,
      },
    });

    return { message: newMsg, popup: createdPopup };
  }

  function handleNewPrivateChatMessage(input: Partial<ServerPrivateChatMessage>) {
    const cleanText = String(input.text || '').trim();
    const hasMediaArray = Array.isArray(input.mediaAttachments) && input.mediaAttachments.length > 0;
    if (
      !cleanText &&
      !input.transferAttachment &&
      !input.poll &&
      !input.imageAttachment &&
      !input.videoAttachment &&
      !hasMediaArray &&
      !input.voiceAttachment &&
      !input.contactAttachment &&
      !input.redPacket &&
      !input.splitBill &&
      !input.billReminder
    ) {
      return null;
    }
    const flags = serverState.globalChatConfig?.featureFlags || {};
    const isAdminSender = input.senderRole === 'admin';
    if (!isAdminSender) {
      if (flags.chatSystemDisabled || flags.disablePrivateChat) return null;
      if (input.groupId && flags.disableGroupChat) return null;
      const hasImageMedia =
        Boolean(input.imageAttachment) ||
        (hasMediaArray && input.mediaAttachments!.some((m) => m?.kind === 'image'));
      const hasVideoMedia =
        Boolean(input.videoAttachment) ||
        (hasMediaArray && input.mediaAttachments!.some((m) => m?.kind === 'video'));
      if (hasImageMedia && flags.disableImages) return null;
      if (hasVideoMedia && flags.disableVideos) return null;
      if (input.voiceAttachment && flags.disableVoiceNotes) return null;
    }
    const msgId = input.id || `pchat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = serverState.privateChatMessages.find((m) => m.id === msgId);
    if (existing) return existing;

    const nowMs = Date.now();
    const newMsg: ServerPrivateChatMessage = {
      id: msgId,
      senderAccountId: input.senderAccountId ? String(input.senderAccountId) : undefined,
      senderAccount: String(input.senderAccount || ''),
      senderName: String(input.senderName || 'Nasabah').slice(0, 80),
      senderRole: isAdminSender ? 'admin' : 'customer',
      senderCardTier: input.senderCardTier ? String(input.senderCardTier) : undefined,
      adminDivisionLabel: isAdminSender && input.adminDivisionLabel ? String(input.adminDivisionLabel).slice(0, 40) : undefined,
      senderCustomBadge: input.senderCustomBadge ? String(input.senderCustomBadge) : null,
      recipientAccountId: input.recipientAccountId ? String(input.recipientAccountId) : undefined,
      recipientAccount: String(input.recipientAccount || ''),
      receiverAccount: input.receiverAccount ? String(input.receiverAccount) : undefined,
      recipientName: String(input.recipientName || '').slice(0, 80),
      groupId: input.groupId ? String(input.groupId) : undefined,
      text: cleanText.slice(0, 1500),
      timestamp: input.timestamp || new Date(nowMs).toISOString(),
      createdAtMs: Number(input.createdAtMs) || nowMs,
      updatedAtMs: nowMs,
      expiresAtMs: Number(input.expiresAtMs) > nowMs ? Number(input.expiresAtMs) : undefined,
      replyToId: input.replyToId ? String(input.replyToId) : undefined,
      replyToSender: input.replyToSender ? String(input.replyToSender).slice(0, 80) : undefined,
      replyToPreview: input.replyToPreview ? String(input.replyToPreview).slice(0, 140) : undefined,
      deleted: Boolean(input.deleted),
      isPinned: Boolean(input.isPinned),
      reactions: input.reactions && typeof input.reactions === 'object' ? input.reactions : undefined,
      readBy: input.readBy && typeof input.readBy === 'object' ? input.readBy : undefined,
      poll: input.poll && typeof input.poll === 'object' ? input.poll : undefined,
      forwardedFrom: input.forwardedFrom && typeof input.forwardedFrom === 'object' ? input.forwardedFrom : undefined,
      mentions: Array.isArray(input.mentions) ? input.mentions.map((x) => String(x)).slice(0, 20) : undefined,
      imageAttachment: input.imageAttachment && typeof input.imageAttachment === 'object' ? input.imageAttachment : undefined,
      videoAttachment: input.videoAttachment && typeof input.videoAttachment === 'object' ? input.videoAttachment : undefined,
      mediaAttachments: Array.isArray(input.mediaAttachments) ? input.mediaAttachments.slice(0, 12) : undefined,
      voiceAttachment: input.voiceAttachment && typeof input.voiceAttachment === 'object' ? input.voiceAttachment : undefined,
      contactAttachment: input.contactAttachment && typeof input.contactAttachment === 'object' ? input.contactAttachment : undefined,
      redPacket: input.redPacket && typeof input.redPacket === 'object' ? input.redPacket : undefined,
      splitBill: input.splitBill && typeof input.splitBill === 'object' ? input.splitBill : undefined,
      billReminder: input.billReminder && typeof input.billReminder === 'object' ? input.billReminder : undefined,
      transferAttachment:
        input.transferAttachment && typeof input.transferAttachment === 'object'
          ? input.transferAttachment
          : undefined,
    };

    serverState.privateChatMessages = [...serverState.privateChatMessages, newMsg].slice(-800);
    savePersistedState();
    broadcastToAll({
      type: 'private_chat:new',
      payload: { message: newMsg, lastUpdated: serverState.lastUpdated },
    });
    return newMsg;
  }

  function handleUpsertPrivateGroup(input: Partial<ServerPrivateChatGroup>) {
    const cleanName = String(input.name || '').trim();
    if (!cleanName || !input.creatorAccountId) return null;
    const grpId = input.id || `pgrp-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const memberIds = Array.from(
      new Set(
        (Array.isArray(input.memberAccountIds) ? input.memberAccountIds : [])
          .map((x) => String(x || '').trim())
          .filter(Boolean)
      )
    );
    const existing = serverState.privateChatGroups.find((g) => g.id === grpId);
    const coAdminIds = Array.isArray(input.coAdminAccountIds)
      ? Array.from(new Set(input.coAdminAccountIds.map((x) => String(x || '').trim()).filter((x) => memberIds.includes(x))))
      : existing?.coAdminAccountIds || [];
    const pinnedIds = Array.isArray(input.pinnedMessageIds)
      ? Array.from(new Set(input.pinnedMessageIds.map((x) => String(x || '').trim()).filter(Boolean)))
      : existing?.pinnedMessageIds || [];
    const nextGroup: ServerPrivateChatGroup = {
      id: grpId,
      name: cleanName.slice(0, 80),
      description: input.description !== undefined ? String(input.description || '').slice(0, 300) : existing?.description,
      rules: input.rules !== undefined ? String(input.rules || '').slice(0, 600) : existing?.rules,
      iconKey: String(input.iconKey || existing?.iconKey || 'users'),
      accentColor: String(input.accentColor || existing?.accentColor || 'indigo'),
      creatorAccountId: String(existing?.creatorAccountId || input.creatorAccountId),
      coAdminAccountIds: coAdminIds,
      memberAccountIds: memberIds,
      pinnedMessageIds: pinnedIds,
      createdAt: existing?.createdAt || input.createdAt || new Date().toISOString(),
      updatedAtMs: Date.now(),
    };

    serverState.privateChatGroups = existing
      ? serverState.privateChatGroups.map((g) => (g.id === grpId ? nextGroup : g))
      : [nextGroup, ...serverState.privateChatGroups].slice(0, 200);
    savePersistedState();
    broadcastToAll({
      type: 'private_group:upserted',
      payload: { group: nextGroup, lastUpdated: serverState.lastUpdated },
    });
    return nextGroup;
  }

  function handleNewSuggestion(input: Partial<ServerSuggestionRecord>) {
    const cleanTitle = String(input.title || '').trim();
    const cleanExplanation = String(input.explanation || '').trim();
    if (!cleanTitle || !cleanExplanation) return null;
    const sugId = input.id || `sug-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = serverState.suggestions.find((s) => s.id === sugId);
    if (existing) return existing;

    const newSug: ServerSuggestionRecord = {
      id: sugId,
      reporterAccountId: input.reporterAccountId ? String(input.reporterAccountId) : undefined,
      reporterName: String(input.reporterName || 'Nasabah Bank Nusantara').trim(),
      reporterAccountNumber: input.reporterAccountNumber ? String(input.reporterAccountNumber) : undefined,
      reporterUserId16: input.reporterUserId16 ? String(input.reporterUserId16) : undefined,
      reporterEmail: input.reporterEmail ? String(input.reporterEmail) : undefined,
      title: cleanTitle.slice(0, 140),
      category: String(input.category || 'Ide Fitur Baru'),
      priority: String(input.priority || 'sedang'),
      explanation: cleanExplanation.slice(0, 3000),
      photoDataUrl: input.photoDataUrl ? String(input.photoDataUrl) : undefined,
      photoFileName: input.photoFileName ? String(input.photoFileName) : undefined,
      status: 'baru',
      createdAt: input.createdAt || new Date().toISOString(),
    };

    serverState.suggestions = [newSug, ...serverState.suggestions].slice(0, 250);
    savePersistedState();
    broadcastToAll({
      type: 'suggestion:new',
      payload: { suggestion: newSug, lastUpdated: serverState.lastUpdated },
    });
    return newSug;
  }

  function handleNewPopup(popupInput: ServerPopupNotification) {
    if (!popupInput || !popupInput.id) return null;
    if (serverState.websitePopups.some((p) => p.id === popupInput.id)) {
      return popupInput;
    }
    const newPopup: ServerPopupNotification = {
      ...popupInput,
      dismissed: false,
      timestamp: popupInput.timestamp || new Date().toISOString(),
    };
    serverState.websitePopups = [newPopup, ...serverState.websitePopups].slice(0, 100);
    savePersistedState();

    broadcastToAll({
      type: 'website_popup:new',
      payload: {
        popup: newPopup,
        lastUpdated: serverState.lastUpdated,
      },
    });
    return newPopup;
  }

  function handleNewBugReport(input: Partial<ServerBugReport>) {
    const cleanExplanation = String(input.explanation || '').trim();
    if (!cleanExplanation) return null;

    const bugId = input.id || `bug-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = serverState.bugReports.find((b) => b.id === bugId);
    if (existing) return existing;

    const newBug: ServerBugReport = {
      id: bugId,
      reporterAccountId: input.reporterAccountId ? String(input.reporterAccountId) : undefined,
      reporterName: String(input.reporterName || 'Pengguna Bank Nusantara').trim(),
      reporterAccountNumber: input.reporterAccountNumber ? String(input.reporterAccountNumber) : undefined,
      reporterEmail: input.reporterEmail ? String(input.reporterEmail) : undefined,
      category: String(input.category || 'Umum / Lainnya'),
      explanation: cleanExplanation,
      photoDataUrl: input.photoDataUrl ? String(input.photoDataUrl) : undefined,
      photoFileName: input.photoFileName ? String(input.photoFileName) : undefined,
      status: 'baru',
      createdAt: input.createdAt || new Date().toISOString(),
    };

    serverState.bugReports = [newBug, ...serverState.bugReports].slice(0, 200);
    savePersistedState();

    broadcastToAll({
      type: 'bug_report:new',
      payload: {
        bugReport: newBug,
        lastUpdated: serverState.lastUpdated,
      },
    });

    return newBug;
  }

  function handleNewPushAlert(input: Partial<ServerPushAlert>) {
    const cleanTitle = String(input.title || '').trim();
    const cleanMessage = String(input.message || '').trim();
    if (!cleanTitle || !cleanMessage) return null;

    const alertId = input.id || `push-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = serverState.pushAlerts.find((a) => a.id === alertId);
    if (existing) return existing;

    const newAlert: ServerPushAlert = {
      id: alertId,
      title: cleanTitle,
      message: cleanMessage,
      type: (input.type as ServerPushAlert['type']) || 'info',
      category: (input.category as ServerPushAlert['category']) || 'transaction',
      targetView: input.targetView ? String(input.targetView) : 'dashboard',
      targetDashboardTab: input.targetDashboardTab ? String(input.targetDashboardTab) : 'mutasi',
      accountId: input.accountId ? String(input.accountId) : undefined,
      referenceId: input.referenceId ? String(input.referenceId) : undefined,
      timestamp: input.timestamp || new Date().toISOString(),
    };

    serverState.pushAlerts = [newAlert, ...serverState.pushAlerts].slice(0, 120);
    savePersistedState();

    broadcastToAll({
      type: 'push_alert:new',
      payload: {
        alert: newAlert,
        lastUpdated: serverState.lastUpdated,
      },
    });

    return newAlert;
  }

  // ==================== REST API ROUTES ====================
  app.get('/api/global-chat', (_req, res) => {
    res.json({
      globalChats: serverState.globalChats,
      globalChatConfig: serverState.globalChatConfig,
      privateChatMessages: serverState.privateChatMessages,
      privateChatGroups: serverState.privateChatGroups,
      chatModerationLogs: serverState.chatModerationLogs,
      chatReports: serverState.chatReports,
      websitePopups: serverState.websitePopups,
      bugReports: serverState.bugReports,
      suggestions: serverState.suggestions,
      suggestionRewardConfig: serverState.suggestionRewardConfig || null,
      pushAlerts: serverState.pushAlerts,
      giftEvents: serverState.giftEvents,
      deletedGiftEventIds: serverState.deletedGiftEventIds,
      giftEventsInitialized: serverState.giftEventsInitialized,
      giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs || 0,
      diamondConfig: serverState.diamondConfig || null,
      uiVisibilityConfig: serverState.uiVisibilityConfig || null,
      adminWarnings: serverState.adminWarnings || [],
      bugRewardConfig: serverState.bugRewardConfig || null,
      adminConfigs: serverState.adminConfigs || {},
      configUpdatedAtMsMap: serverState.configUpdatedAtMsMap || {},
      adminConfigRevisionMap: serverState.adminConfigRevisionMap || {},
      deletedAdminItemIds: serverState.deletedAdminItemIds || {},
      customerPresenceMap: serverState.customerPresenceMap || {},
      liveActivityLogs: serverState.liveActivityLogs || [],
      autoDetectedAnomalies: serverState.autoDetectedAnomalies || [],
      sharedBankData: serverState.sharedBankData,
      connectedDevices: Math.max(1, clients.size),
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.get('/api/presence', (_req, res) => {
    res.json({
      success: true,
      customerPresenceMap: serverState.customerPresenceMap || {},
      liveActivityLogs: serverState.liveActivityLogs || [],
      autoDetectedAnomalies: serverState.autoDetectedAnomalies || [],
      serverTimeMs: Date.now(),
    });
  });

  app.post('/api/presence', (req, res) => {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const accId = typeof body.accountId === 'string' ? body.accountId.trim() : '';
    if (!accId) {
      res.status(400).json({ success: false, message: 'accountId wajib diisi.' });
      return;
    }
    const record = {
      ...body,
      accountId: accId,
      serverReceivedAtMs: Date.now(),
    };
    serverState.customerPresenceMap = {
      ...(serverState.customerPresenceMap || {}),
      [accId]: record,
    };
    broadcastToAll({
      type: 'presence:updated',
      payload: { accountId: accId, presence: record },
    });
    res.json({ success: true, presence: record, serverTimeMs: Date.now() });
  });

  app.get('/api/admin-config', (_req, res) => {
    res.json({
      success: true,
      adminConfigs: serverState.adminConfigs || {},
      configUpdatedAtMsMap: serverState.configUpdatedAtMsMap || {},
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/admin-config', (req, res) => {
    const rawKey = typeof req.body?.key === 'string' ? req.body.key.trim().slice(0, 80) : '';
    const value = req.body?.value;
    if (!rawKey || value === undefined) {
      res.status(400).json({ success: false, message: 'Parameter key/value tidak valid.' });
      return;
    }
    const incomingTs = Number(req.body?.updatedAtMs) || 0;
    const incomingRev = Number(req.body?.revision) || 0;
    const currentTs = Number(serverState.configUpdatedAtMsMap?.[rawKey]) || 0;
    const currentRev = Number(serverState.adminConfigRevisionMap?.[rawKey]) || 0;
    if (incomingRev > 0 && currentRev > 0 && incomingRev < currentRev) {
      res.json({
        success: true,
        ignoredStale: true,
        key: rawKey,
        value: serverState.adminConfigs?.[rawKey],
        updatedAtMs: currentTs,
        revision: currentRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      });
      return;
    }
    if (incomingRev === 0 && incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
      res.json({
        success: true,
        ignoredStale: true,
        key: rawKey,
        value: serverState.adminConfigs?.[rawKey],
        updatedAtMs: currentTs,
        revision: currentRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      });
      return;
    }
    if (Array.isArray(req.body?.deletedIds)) {
      recordServerTombstones(rawKey, req.body.deletedIds);
    }
    mergeIncomingTombstonesMap(req.body?.deletedAdminItemIds);
    const nextTs = Math.max(Date.now(), incomingTs, currentTs + 1);
    const nextRev = bumpServerConfigRevision(rawKey, incomingRev);
    const filteredVal = Array.isArray(value)
      ? filterListByServerTombstones(rawKey, value as Array<{ id?: unknown }>)
      : value;
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      [rawKey]: filteredVal,
    };
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      [rawKey]: nextTs,
    };
    if (rawKey === 'bugRewardConfig' && filteredVal && typeof filteredVal === 'object') {
      serverState.bugRewardConfig = filteredVal as Record<string, unknown>;
    } else if (rawKey === 'diamondConfig' && filteredVal && typeof filteredVal === 'object') {
      serverState.diamondConfig = filteredVal as Record<string, unknown>;
    } else if (rawKey === 'uiVisibilityConfig' && filteredVal && typeof filteredVal === 'object') {
      serverState.uiVisibilityConfig = filteredVal as Record<string, unknown>;
    } else if (rawKey === 'adminWarnings' && Array.isArray(filteredVal)) {
      serverState.adminWarnings = filteredVal as Array<Record<string, unknown>>;
    } else if (rawKey === 'bugReports' && Array.isArray(filteredVal)) {
      serverState.bugReports = filteredVal as ServerBugReport[];
    } else if (rawKey === 'globalChats' && Array.isArray(filteredVal)) {
      serverState.globalChats = filteredVal as ServerGlobalChatMessage[];
    } else if (rawKey === 'websitePopups' && Array.isArray(filteredVal)) {
      serverState.websitePopups = filteredVal as ServerPopupNotification[];
    }
    savePersistedState();
    broadcastToAll({
      type: 'admin_config:updated',
      payload: {
        key: rawKey,
        value: filteredVal,
        updatedAtMs: nextTs,
        revision: nextRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      key: rawKey,
      value: filteredVal,
      updatedAtMs: nextTs,
      revision: nextRev,
      deletedAdminItemIds: serverState.deletedAdminItemIds,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.get('/api/diamond-config', (_req, res) => {
    res.json({
      success: true,
      diamondConfig: serverState.diamondConfig || null,
      updatedAtMs: serverState.configUpdatedAtMsMap?.diamondConfig || 0,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/diamond-config', (req, res) => {
    const rawCfg = (req.body?.diamondConfig || req.body || {}) as Record<string, unknown>;
    if (!rawCfg || typeof rawCfg !== 'object') {
      res.status(400).json({ success: false, message: 'Konfigurasi tidak valid.' });
      return;
    }
    const incomingTs = Number(req.body?.updatedAtMs ?? rawCfg.updatedAtMs) || 0;
    const currentTs = Number(serverState.configUpdatedAtMsMap?.diamondConfig) || 0;
    if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
      res.json({ success: true, ignoredStale: true, diamondConfig: serverState.diamondConfig, updatedAtMs: currentTs, lastUpdated: serverState.lastUpdated });
      return;
    }
    const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
    const basePriceRaw = Number(rawCfg.baseDiamondPriceRupiah);
    const discRaw = Number(rawCfg.diamondDiscountPercent);
    const maxCustomRaw = Number(rawCfg.maxCustomDiamond);
    const maxPurchRaw = Number(rawCfg.maxPurchaseRupiah);
    serverState.diamondConfig = {
      ...rawCfg,
      baseDiamondPriceRupiah: Math.max(1, Math.round(Number.isFinite(basePriceRaw) && rawCfg.baseDiamondPriceRupiah !== undefined ? basePriceRaw : 90)),
      diamondDiscountPercent: Math.max(0, Math.min(99, Math.round(Number.isFinite(discRaw) ? discRaw : 0))),
      maxCustomDiamond: Math.max(1, Math.min(11_099, Math.round(Number.isFinite(maxCustomRaw) && rawCfg.maxCustomDiamond !== undefined ? maxCustomRaw : 11_099))),
      maxPurchaseRupiah: Math.max(1, Math.min(998_910, Math.round(Number.isFinite(maxPurchRaw) && rawCfg.maxPurchaseRupiah !== undefined ? maxPurchRaw : 998_910))),
      priceRevision: 3,
      updatedAtMs: nextTs,
      updatedAt: new Date(nextTs).toISOString(),
    };
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      diamondConfig: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      diamondConfig: serverState.diamondConfig,
    };
    savePersistedState();
    broadcastToAll({
      type: 'diamond_config:updated',
      payload: { diamondConfig: serverState.diamondConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, diamondConfig: serverState.diamondConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated });
  });

  app.get('/api/ui-visibility', (_req, res) => {
    res.json({
      success: true,
      uiVisibilityConfig: serverState.uiVisibilityConfig || null,
      updatedAtMs: serverState.configUpdatedAtMsMap?.uiVisibilityConfig || 0,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/ui-visibility', (req, res) => {
    const incoming = (req.body?.uiVisibilityConfig || req.body || {}) as Record<string, unknown>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ success: false, message: 'Konfigurasi visibilitas tidak valid.' });
      return;
    }
    const incomingTs = Number(req.body?.updatedAtMs ?? incoming.updatedAtMs) || 0;
    const currentTs = Number(serverState.configUpdatedAtMsMap?.uiVisibilityConfig) || 0;
    if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
      res.json({ success: true, ignoredStale: true, uiVisibilityConfig: serverState.uiVisibilityConfig, updatedAtMs: currentTs, lastUpdated: serverState.lastUpdated });
      return;
    }
    const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
    serverState.uiVisibilityConfig = {
      ...incoming,
      updatedAtMs: nextTs,
      updatedAt: new Date(nextTs).toISOString(),
    };
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      uiVisibilityConfig: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      uiVisibilityConfig: serverState.uiVisibilityConfig,
    };
    savePersistedState();
    broadcastToAll({
      type: 'ui_visibility:updated',
      payload: { uiVisibilityConfig: serverState.uiVisibilityConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, uiVisibilityConfig: serverState.uiVisibilityConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated });
  });

  app.get('/api/admin-warnings', (_req, res) => {
    res.json({
      success: true,
      adminWarnings: serverState.adminWarnings || [],
      updatedAtMs: serverState.configUpdatedAtMsMap?.adminWarnings || 0,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/admin-warnings', (req, res) => {
    const incomingTs = Number(req.body?.updatedAtMs) || 0;
    const incomingRev = Number(req.body?.revision) || 0;
    const currentTs = Number(serverState.configUpdatedAtMsMap?.adminWarnings) || 0;
    const currentRev = Number(serverState.adminConfigRevisionMap?.adminWarnings) || 0;
    if (incomingRev > 0 && currentRev > 0 && incomingRev < currentRev) {
      res.json({
        success: true,
        ignoredStale: true,
        adminWarnings: serverState.adminWarnings,
        updatedAtMs: currentTs,
        revision: currentRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      });
      return;
    }
    if (incomingRev === 0 && incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
      res.json({
        success: true,
        ignoredStale: true,
        adminWarnings: serverState.adminWarnings,
        updatedAtMs: currentTs,
        revision: currentRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      });
      return;
    }
    if (Array.isArray(req.body?.deletedIds)) {
      recordServerTombstones('adminWarnings', req.body.deletedIds);
    }
    mergeIncomingTombstonesMap(req.body?.deletedAdminItemIds);
    if (Array.isArray(req.body?.adminWarnings)) {
      serverState.adminWarnings = filterListByServerTombstones(
        'adminWarnings',
        (req.body.adminWarnings as Array<Record<string, unknown>>).slice(0, 100)
      );
    } else if (req.body && typeof req.body === 'object' && req.body.id) {
      const incoming = req.body as Record<string, unknown>;
      const exists = serverState.adminWarnings.some((w) => String(w.id) === String(incoming.id));
      serverState.adminWarnings = filterListByServerTombstones(
        'adminWarnings',
        exists
          ? serverState.adminWarnings.map((w) => (String(w.id) === String(incoming.id) ? incoming : w))
          : [incoming, ...serverState.adminWarnings].slice(0, 100)
      );
    } else {
      res.status(400).json({ success: false, message: 'Data peringatan admin tidak valid.' });
      return;
    }
    const nextTs = Math.max(Date.now(), incomingTs, currentTs + 1);
    const nextRev = bumpServerConfigRevision('adminWarnings', incomingRev);
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      adminWarnings: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      adminWarnings: serverState.adminWarnings,
    };
    savePersistedState();
    broadcastToAll({
      type: 'admin_warnings:updated',
      payload: {
        adminWarnings: serverState.adminWarnings,
        updatedAtMs: nextTs,
        revision: nextRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      adminWarnings: serverState.adminWarnings,
      updatedAtMs: nextTs,
      revision: nextRev,
      deletedAdminItemIds: serverState.deletedAdminItemIds,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.patch('/api/admin-warnings/:id/resend', (req, res) => {
    const targetId = String(req.params.id || '');
    let found = false;
    serverState.adminWarnings = serverState.adminWarnings.map((w) => {
      if (String(w.id) === targetId) {
        found = true;
        return {
          ...w,
          isActive: true,
          resendVersion: (Number(w.resendVersion) || 1) + 1,
          updatedAt: new Date().toISOString(),
        };
      }
      return w;
    });
    if (!found) {
      res.status(404).json({ success: false, message: 'Peringatan tidak ditemukan.' });
      return;
    }
    const nextTs = Math.max(Date.now(), (Number(serverState.configUpdatedAtMsMap?.adminWarnings) || 0) + 1);
    const nextRev = bumpServerConfigRevision('adminWarnings');
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      adminWarnings: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      adminWarnings: serverState.adminWarnings,
    };
    savePersistedState();
    broadcastToAll({
      type: 'admin_warnings:updated',
      payload: {
        adminWarnings: serverState.adminWarnings,
        updatedAtMs: nextTs,
        revision: nextRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      adminWarnings: serverState.adminWarnings,
      updatedAtMs: nextTs,
      revision: nextRev,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.delete('/api/admin-warnings/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    recordServerTombstones('adminWarnings', [targetId]);
    serverState.adminWarnings = serverState.adminWarnings.filter((w) => String(w.id) !== targetId);
    const nextTs = Math.max(Date.now(), (Number(serverState.configUpdatedAtMsMap?.adminWarnings) || 0) + 1);
    const nextRev = bumpServerConfigRevision('adminWarnings');
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      adminWarnings: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      adminWarnings: serverState.adminWarnings,
    };
    savePersistedState();
    broadcastToAll({
      type: 'admin_warnings:updated',
      payload: {
        adminWarnings: serverState.adminWarnings,
        updatedAtMs: nextTs,
        revision: nextRev,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      adminWarnings: serverState.adminWarnings,
      updatedAtMs: nextTs,
      revision: nextRev,
      deletedAdminItemIds: serverState.deletedAdminItemIds,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.get('/api/bug-reward-config', (_req, res) => {
    res.json({
      success: true,
      bugRewardConfig: serverState.bugRewardConfig || null,
      updatedAtMs: serverState.configUpdatedAtMsMap?.bugRewardConfig || 0,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/bug-reward-config', (req, res) => {
    const incoming = (req.body?.bugRewardConfig || req.body || {}) as Record<string, unknown>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ success: false, message: 'Konfigurasi hadiah bug tidak valid.' });
      return;
    }
    const incomingTs = Number(req.body?.updatedAtMs ?? incoming.updatedAtMs) || 0;
    const currentTs = Number(serverState.configUpdatedAtMsMap?.bugRewardConfig) || 0;
    if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
      res.json({ success: true, ignoredStale: true, bugRewardConfig: serverState.bugRewardConfig, updatedAtMs: currentTs, lastUpdated: serverState.lastUpdated });
      return;
    }
    const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
    serverState.bugRewardConfig = {
      ...incoming,
      enabled: Boolean(incoming.enabled),
      cashAmount: Math.max(0, Math.floor(Number(incoming.cashAmount ?? 0) || 0)),
      coinAmount: Math.max(0, Math.floor(Number(incoming.coinAmount ?? 0) || 0)),
      diamondAmount: Math.max(0, Math.floor(Number(incoming.diamondAmount ?? 0) || 0)),
      goldGrams: Math.max(0, Math.round((Number(incoming.goldGrams ?? 0) || 0) * 100) / 100),
      voucherAmount: Math.max(0, Math.floor(Number(incoming.voucherAmount ?? 0) || 0)),
      pointsAmount: Math.max(0, Math.floor(Number(incoming.pointsAmount ?? 0) || 0)),
      familySlotAmount: Math.max(0, Math.floor(Number(incoming.familySlotAmount ?? 0) || 0)),
      defaultRewardMessage: String(incoming.defaultRewardMessage ?? incoming.defaultMessage ?? '').slice(0, 300),
      autoRewardTriggerStatuses: Array.isArray(incoming.autoRewardTriggerStatuses)
        ? incoming.autoRewardTriggerStatuses.map((s) => String(s))
        : ['terverifikasi'],
      updatedAtMs: nextTs,
      updatedAt: new Date(nextTs).toISOString(),
    };
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      bugRewardConfig: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      bugRewardConfig: serverState.bugRewardConfig,
    };
    savePersistedState();
    broadcastToAll({
      type: 'bug_reward_config:updated',
      payload: { bugRewardConfig: serverState.bugRewardConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, bugRewardConfig: serverState.bugRewardConfig, updatedAtMs: nextTs, lastUpdated: serverState.lastUpdated });
  });

  app.get('/api/gift-events', (_req, res) => {
    res.json({
      success: true,
      giftEvents: serverState.giftEvents,
      deletedGiftEventIds: serverState.deletedGiftEventIds,
      giftEventsInitialized: serverState.giftEventsInitialized,
      giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs || 0,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/gift-events', (req, res) => {
    const incoming = req.body?.giftEvents;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ success: false, message: 'Daftar giftEvents tidak valid.' });
      return;
    }
    const incomingGiftTs = Number(req.body?.giftEventsUpdatedAtMs) || 0;
    const currentGiftTs = Number(serverState.giftEventsUpdatedAtMs) || 0;
    if (incomingGiftTs > 0 && currentGiftTs > 0 && incomingGiftTs < currentGiftTs) {
      res.json({
        success: true,
        ignoredStale: true,
        giftEvents: serverState.giftEvents,
        deletedGiftEventIds: serverState.deletedGiftEventIds,
        giftEventsInitialized: serverState.giftEventsInitialized,
        giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs,
        lastUpdated: serverState.lastUpdated,
      });
      return;
    }
    if (Array.isArray(req.body?.deletedGiftEventIds)) {
      serverState.deletedGiftEventIds = Array.from(
        new Set([
          ...serverState.deletedGiftEventIds,
          ...req.body.deletedGiftEventIds.map((id: unknown) => String(id)),
        ])
      );
    }
    serverState.giftEvents = (incoming as Array<{ id?: string }>).filter(
      (e) => !e?.id || !serverState.deletedGiftEventIds.includes(String(e.id))
    );
    serverState.giftEventsInitialized = true;
    serverState.giftEventsUpdatedAtMs =
      incomingGiftTs > 0 ? incomingGiftTs : Math.max(Date.now(), currentGiftTs + 1);
    savePersistedState();
    broadcastToAll({
      type: 'gift_events:updated',
      payload: {
        giftEvents: serverState.giftEvents,
        deletedGiftEventIds: serverState.deletedGiftEventIds,
        giftEventsInitialized: serverState.giftEventsInitialized,
        giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      giftEvents: serverState.giftEvents,
      deletedGiftEventIds: serverState.deletedGiftEventIds,
      giftEventsInitialized: serverState.giftEventsInitialized,
      giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/push-alert', (req, res) => {
    const created = handleNewPushAlert(req.body || {});
    if (!created) {
      res.status(400).json({ success: false, message: 'Judul dan pesan notifikasi wajib diisi.' });
      return;
    }
    res.json({ success: true, alert: created, pushAlerts: serverState.pushAlerts });
  });

  app.post('/api/global-chat', (req, res) => {
    const result = handleNewGlobalChat(req.body || {});
    if (!result || result.error || !result.message) {
      res.status(400).json({
        success: false,
        message: result?.error || 'Gagal mengirim pesan Chat Global.',
      });
      return;
    }
    res.json({
      success: true,
      ...result,
      globalChats: serverState.globalChats,
      globalChatConfig: serverState.globalChatConfig,
      websitePopups: serverState.websitePopups,
      connectedDevices: Math.max(1, clients.size),
    });
  });

  app.patch('/api/global-chat/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    const nowMs = Date.now();
    let updatedMsg: ServerGlobalChatMessage | null = null;
    serverState.globalChats = serverState.globalChats.map((m) => {
      if (m.id !== targetId) return m;
      let nextRedPacket = m.redPacket;
      if (req.body?.redPacket && typeof req.body.redPacket === 'object') {
        const incRp = req.body.redPacket as Record<string, unknown>;
        const prevClaims = Array.isArray((m.redPacket as Record<string, unknown> | undefined)?.claims)
          ? ((m.redPacket as Record<string, unknown>).claims as Array<{ accountId: string }>)
          : [];
        const incClaims = Array.isArray(incRp.claims) ? (incRp.claims as Array<{ accountId: string }>) : [];
        const byAcc = new Map<string, { accountId: string; amount?: number }>();
        prevClaims.forEach((c) => c?.accountId && byAcc.set(c.accountId, c as { accountId: string; amount?: number }));
        incClaims.forEach((c) => c?.accountId && !byAcc.has(c.accountId) && byAcc.set(c.accountId, c as { accountId: string; amount?: number }));
        const mergedClaims = Array.from(byAcc.values());
        const totalAmt = Number(incRp.totalAmount ?? (m.redPacket as Record<string, unknown> | undefined)?.totalAmount ?? 0);
        const claimedSum = mergedClaims.reduce((s, c) => s + (Number(c.amount) || 0), 0);
        nextRedPacket = {
          ...(m.redPacket || {}),
          ...incRp,
          claims: mergedClaims,
          remainingAmount: Math.max(0, totalAmt - claimedSum),
        };
      }
      const next: ServerGlobalChatMessage = {
        ...m,
        ...(typeof req.body?.text === 'string' && req.body.text.trim()
          ? {
              text: req.body.text.trim().slice(0, 1500),
              editedAt: req.body?.editedAt || new Date(nowMs).toISOString(),
              editedAtMs: Number(req.body?.editedAtMs) || nowMs,
            }
          : {}),
        ...(typeof req.body?.isPinned === 'boolean' ? { isPinned: req.body.isPinned } : {}),
        ...(req.body?.reactions && typeof req.body.reactions === 'object'
          ? { reactions: req.body.reactions as Record<string, string[]> }
          : {}),
        ...(req.body?.poll && typeof req.body.poll === 'object'
          ? { poll: req.body.poll as Record<string, unknown> }
          : {}),
        ...(nextRedPacket ? { redPacket: nextRedPacket } : {}),
        updatedAtMs: nowMs,
      };
      updatedMsg = next;
      return next;
    });
    savePersistedState();
    if (updatedMsg) {
      broadcastToAll({
        type: 'global_chat:updated',
        payload: { message: updatedMsg, lastUpdated: serverState.lastUpdated },
      });
    }
    res.json({ success: Boolean(updatedMsg), message: updatedMsg });
  });

  app.post('/api/global-chat/:id/pin', (req, res) => {
    const targetId = String(req.params.id || '');
    const desiredPin = typeof req.body?.isPinned === 'boolean' ? req.body.isPinned : undefined;
    const nowMs = Date.now();
    let updatedMsg: ServerGlobalChatMessage | null = null;
    serverState.globalChats = serverState.globalChats.map((m) => {
      if (m.id === targetId) {
        const nextPin = desiredPin !== undefined ? desiredPin : !m.isPinned;
        updatedMsg = { ...m, isPinned: nextPin, updatedAtMs: nowMs };
        return updatedMsg;
      }
      return m;
    });
    savePersistedState();
    if (updatedMsg) {
      broadcastToAll({
        type: 'global_chat:updated',
        payload: { message: updatedMsg, lastUpdated: serverState.lastUpdated },
      });
    }
    res.json({ success: Boolean(updatedMsg), message: updatedMsg, globalChats: serverState.globalChats });
  });

  app.post('/api/global-chat/lock', (req, res) => {
    const nextLocked =
      typeof req.body?.adminOnlyLock === 'boolean'
        ? req.body.adminOnlyLock
        : Boolean(serverState.globalChatConfig?.adminOnlyLock);
    const nextCooldown =
      req.body?.cooldownMs !== undefined
        ? Math.max(0, Math.min(120000, Number(req.body.cooldownMs) || 0))
        : serverState.globalChatConfig?.cooldownMs ?? 2500;
    const nextMaxVoiceDurationSec =
      req.body?.maxVoiceDurationSec !== undefined
        ? Math.max(15, Math.min(600, Math.round(Number(req.body.maxVoiceDurationSec) || 600)))
        : serverState.globalChatConfig?.maxVoiceDurationSec ?? 600;
    serverState.globalChatConfig = {
      ...serverState.globalChatConfig,
      adminOnlyLock: nextLocked,
      cooldownMs: nextCooldown,
      maxVoiceDurationSec: nextMaxVoiceDurationSec,
      lockedBy: req.body?.lockedBy !== undefined ? String(req.body.lockedBy || '') || undefined : serverState.globalChatConfig?.lockedBy,
      mutedUsers:
        req.body?.mutedUsers && typeof req.body.mutedUsers === 'object'
          ? (req.body.mutedUsers as Record<string, Record<string, unknown>>)
          : serverState.globalChatConfig?.mutedUsers || {},
      bannedWords: Array.isArray(req.body?.bannedWords)
        ? (req.body.bannedWords as unknown[]).map((w) => String(w || '').trim()).filter(Boolean)
        : serverState.globalChatConfig?.bannedWords || [],
      bannedWordMode:
        req.body?.bannedWordMode === 'block' || req.body?.bannedWordMode === 'censor'
          ? req.body.bannedWordMode
          : serverState.globalChatConfig?.bannedWordMode || 'censor',
      adminHighlightDefault:
        typeof req.body?.adminHighlightDefault === 'boolean'
          ? req.body.adminHighlightDefault
          : serverState.globalChatConfig?.adminHighlightDefault ?? true,
      featureFlags:
        req.body?.featureFlags && typeof req.body.featureFlags === 'object'
          ? { ...(serverState.globalChatConfig?.featureFlags || {}), ...(req.body.featureFlags as Record<string, boolean>) }
          : serverState.globalChatConfig?.featureFlags || {},
      maintenanceNotice:
        typeof req.body?.maintenanceNotice === 'string'
          ? req.body.maintenanceNotice
          : serverState.globalChatConfig?.maintenanceNotice,
      customWelcomeText:
        typeof req.body?.customWelcomeText === 'string'
          ? req.body.customWelcomeText
          : serverState.globalChatConfig?.customWelcomeText,
      activeAdminDivision:
        typeof req.body?.activeAdminDivision === 'string'
          ? req.body.activeAdminDivision
          : serverState.globalChatConfig?.activeAdminDivision,
      antiSpamConfig:
        req.body?.antiSpamConfig && typeof req.body.antiSpamConfig === 'object'
          ? (req.body.antiSpamConfig as { enabled: boolean; maxMessagesPer10s: number; blockExternalLinks: boolean })
          : serverState.globalChatConfig?.antiSpamConfig,
      scheduledAnnouncements: Array.isArray(req.body?.scheduledAnnouncements)
        ? (req.body.scheduledAnnouncements as Array<Record<string, unknown>>)
        : serverState.globalChatConfig?.scheduledAnnouncements || [],
      updatedAtMs: Date.now(),
    };
    savePersistedState();
    broadcastToAll({
      type: 'global_chat:config',
      payload: { globalChatConfig: serverState.globalChatConfig, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, globalChatConfig: serverState.globalChatConfig });
  });

  app.post('/api/global-chat/bulk-delete-user', (req, res) => {
    const targetAccountId = String(req.body?.accountId || '').trim();
    const targetAccountNo = String(req.body?.accountNumber || '').trim();
    if (!targetAccountId && !targetAccountNo) {
      res.status(400).json({ success: false, message: 'ID akun target wajib diisi.' });
      return;
    }
    const removedIds = serverState.globalChats
      .filter(
        (m) =>
          (targetAccountId && m.senderAccountId === targetAccountId) ||
          (targetAccountNo && m.senderAccount === targetAccountNo)
      )
      .map((m) => m.id);
    if (removedIds.length > 0) {
      recordServerTombstones('globalChats', removedIds);
      bumpServerConfigRevision('globalChats');
      serverState.globalChats = serverState.globalChats.filter((m) => !removedIds.includes(m.id));
      savePersistedState();
      broadcastToAll({
        type: 'global_chat:bulk_delete',
        payload: {
          ids: removedIds,
          deletedAdminItemIds: serverState.deletedAdminItemIds,
          lastUpdated: serverState.lastUpdated,
        },
      });
    }
    res.json({ success: true, removedCount: removedIds.length, removedIds });
  });

  app.post('/api/global-chat/mod-log', (req, res) => {
    const entry: ServerChatModerationLog = {
      id: String(req.body?.id || `modlog-${Date.now()}-${Math.floor(Math.random() * 1000)}`),
      action: String(req.body?.action || 'delete_msg'),
      adminName: String(req.body?.adminName || 'Admin Bank Nusantara').slice(0, 80),
      targetName: req.body?.targetName ? String(req.body.targetName).slice(0, 80) : undefined,
      targetAccountId: req.body?.targetAccountId ? String(req.body.targetAccountId) : undefined,
      detail: String(req.body?.detail || '').slice(0, 300),
      timestamp: req.body?.timestamp || new Date().toISOString(),
      createdAtMs: Number(req.body?.createdAtMs) || Date.now(),
    };
    serverState.chatModerationLogs = [entry, ...serverState.chatModerationLogs.filter((l) => l.id !== entry.id)].slice(0, 200);
    savePersistedState();
    broadcastToAll({
      type: 'global_chat:mod_log',
      payload: { entry, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, entry });
  });

  app.delete('/api/global-chat/:id', (req, res) => {
    const targetId = req.params.id;
    recordServerTombstones('globalChats', [targetId]);
    bumpServerConfigRevision('globalChats');
    serverState.globalChats = serverState.globalChats.filter((m) => m.id !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'global_chat:delete',
      payload: {
        id: targetId,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, globalChats: serverState.globalChats });
  });

  app.post('/api/global-chat/clear', (_req, res) => {
    recordServerTombstones(
      'globalChats',
      serverState.globalChats.map((m) => m.id)
    );
    bumpServerConfigRevision('globalChats');
    serverState.globalChats = [];
    savePersistedState();
    broadcastToAll({
      type: 'global_chat:clear',
      payload: {
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, globalChats: [] });
  });

  // ==================== CHAT MEDIA STREAMING STORE (HTTP 206 RANGE) ====================
  app.post('/api/chat-media', (req, res) => {
    try {
      ensureChatMediaDir();
      const rawDataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
      let mimeType = typeof req.body?.mimeType === 'string' ? req.body.mimeType.trim().toLowerCase() : '';
      let base64Body = '';

      if (rawDataUrl.startsWith('data:')) {
        const commaIdx = rawDataUrl.indexOf(',');
        if (commaIdx === -1) {
          res.status(400).json({ success: false, message: 'Format media dataUrl tidak valid.' });
          return;
        }
        const header = rawDataUrl.slice(5, commaIdx);
        const extractedMime = header.split(';')[0]?.trim().toLowerCase() || '';
        if (extractedMime) mimeType = extractedMime;
        base64Body = rawDataUrl.slice(commaIdx + 1);
      } else if (typeof req.body?.base64 === 'string') {
        base64Body = req.body.base64;
      }

      if (!base64Body) {
        res.status(400).json({ success: false, message: 'Payload media kosong.' });
        return;
      }
      if (!/^(image|video|audio)\/[a-z0-9.+-]+$/i.test(mimeType)) {
        res.status(400).json({ success: false, message: 'Tipe file media tidak didukung.' });
        return;
      }

      const buffer = Buffer.from(base64Body, 'base64');
      if (!buffer.length || buffer.length > 22 * 1024 * 1024) {
        res.status(413).json({
          success: false,
          message: 'Ukuran media melebihi batas aman server (maks 22 MB setelah kompresi).',
        });
        return;
      }

      const mediaId = `cm_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      const binPath = path.join(CHAT_MEDIA_DIR, `${mediaId}.bin`);
      const metaPath = path.join(CHAT_MEDIA_DIR, `${mediaId}.meta.json`);
      const fileName = String(req.body?.fileName || mediaId).replace(/[^\w.\-() ]+/g, '_').slice(0, 120);

      fs.writeFileSync(binPath, buffer);
      fs.writeFileSync(
        metaPath,
        JSON.stringify({
          mediaId,
          mimeType,
          fileName,
          sizeBytes: buffer.length,
          createdAtMs: Date.now(),
        })
      );

      res.json({
        success: true,
        mediaId,
        url: `/api/chat-media/${mediaId}`,
        mimeType,
        sizeBytes: buffer.length,
        fileName,
      });
    } catch {
      res.status(500).json({ success: false, message: 'Gagal menyimpan media chat di server.' });
    }
  });

  app.get('/api/chat-media/:mediaId', (req, res) => {
    try {
      const mediaId = String(req.params.mediaId || '').trim();
      if (!/^[a-zA-Z0-9_-]{6,80}$/.test(mediaId)) {
        res.status(400).json({ success: false, message: 'ID media tidak valid.' });
        return;
      }
      const binPath = path.join(CHAT_MEDIA_DIR, `${mediaId}.bin`);
      const metaPath = path.join(CHAT_MEDIA_DIR, `${mediaId}.meta.json`);
      if (!fs.existsSync(binPath)) {
        res.status(404).json({ success: false, message: 'Media tidak ditemukan.' });
        return;
      }

      let mimeType = 'application/octet-stream';
      if (fs.existsSync(metaPath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(metaPath, 'utf-8')) as { mimeType?: string };
          if (parsed.mimeType) mimeType = parsed.mimeType;
        } catch {
          // ignore
        }
      }

      const stat = fs.statSync(binPath);
      const totalSize = stat.size;
      const rangeHeader = req.headers.range;

      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=86400');

      if (rangeHeader) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(String(rangeHeader).trim());
        if (!match) {
          res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
          return;
        }
        const start = match[1] ? parseInt(match[1], 10) : 0;
        const end = match[2] ? Math.min(parseInt(match[2], 10), totalSize - 1) : totalSize - 1;
        if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= totalSize) {
          res.status(416).setHeader('Content-Range', `bytes */${totalSize}`).end();
          return;
        }
        const chunkSize = end - start + 1;
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${totalSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
          'Content-Type': mimeType,
        });
        fs.createReadStream(binPath, { start, end }).pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': totalSize,
          'Content-Type': mimeType,
          'Accept-Ranges': 'bytes',
        });
        fs.createReadStream(binPath).pipe(res);
      }
    } catch {
      res.status(500).json({ success: false, message: 'Gagal membaca media chat.' });
    }
  });

  // ==================== PRIVATE CHAT & GROUPS API ====================
  app.get('/api/chat-hub', (_req, res) => {
    res.json({
      success: true,
      globalChats: serverState.globalChats,
      globalChatConfig: serverState.globalChatConfig,
      privateChatMessages: serverState.privateChatMessages,
      privateChatGroups: serverState.privateChatGroups,
      chatModerationLogs: serverState.chatModerationLogs,
      chatReports: serverState.chatReports,
      deletedAdminItemIds: serverState.deletedAdminItemIds || {},
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/chat-reports', (req, res) => {
    const id = String(req.body?.id || `crep-${Date.now()}-${Math.floor(Math.random() * 1000)}`);
    if (!req.body?.messageId || !req.body?.reporterAccountId) {
      res.status(400).json({ success: false, message: 'Data laporan pesan tidak lengkap.' });
      return;
    }
    const existing = serverState.chatReports.find((r) => r.id === id);
    if (existing) {
      res.json({ success: true, report: existing, chatReports: serverState.chatReports });
      return;
    }
    const resolvedScope =
      req.body.scope === 'private' || req.body.roomScope === 'private' ? 'private' : 'global';
    const entry: ServerChatReportEntry = {
      id,
      scope: resolvedScope,
      roomScope: resolvedScope,
      roomKey: String(req.body.roomKey || 'global'),
      messageId: String(req.body.messageId),
      messagePreview: String(req.body.messagePreview || '').slice(0, 300),
      reportedAccountId: req.body.reportedAccountId ? String(req.body.reportedAccountId) : undefined,
      reportedName: String(req.body.reportedName || 'Nasabah').slice(0, 80),
      reportedAccountNumber: req.body.reportedAccountNumber ? String(req.body.reportedAccountNumber) : undefined,
      reporterAccountId: String(req.body.reporterAccountId),
      reporterName: String(req.body.reporterName || 'Nasabah').slice(0, 80),
      reason: String(req.body.reason || 'Melanggar aturan').slice(0, 300),
      status: 'pending',
      createdAt: req.body.createdAt || new Date().toISOString(),
      createdAtMs: Number(req.body.createdAtMs) || Date.now(),
    };
    serverState.chatReports = [entry, ...serverState.chatReports].slice(0, 200);
    savePersistedState();
    broadcastToAll({
      type: 'chat_report:new',
      payload: { report: entry, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, report: entry, chatReports: serverState.chatReports });
  });

  app.patch('/api/chat-reports/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    let updated: ServerChatReportEntry | null = null;
    serverState.chatReports = serverState.chatReports.map((r) => {
      if (r.id !== targetId) return r;
      const incomingStatus = req.body?.status;
      const mappedStatus: 'pending' | 'reviewed' | 'dismissed' =
        incomingStatus === 'reviewed' || incomingStatus === 'resolved'
          ? 'reviewed'
          : incomingStatus === 'dismissed'
            ? 'dismissed'
            : r.status;
      updated = {
        ...r,
        status: mappedStatus,
        resolutionNote:
          req.body?.resolutionNote !== undefined
            ? String(req.body.resolutionNote)
            : req.body?.adminNote !== undefined
              ? String(req.body.adminNote)
              : r.resolutionNote,
        adminNote: req.body?.adminNote !== undefined ? String(req.body.adminNote) : r.adminNote,
        resolvedBy: req.body?.resolvedBy !== undefined ? String(req.body.resolvedBy) : r.resolvedBy,
        resolvedAt: req.body?.resolvedAt || new Date().toISOString(),
      };
      return updated;
    });
    savePersistedState();
    if (updated) {
      broadcastToAll({
        type: 'chat_report:updated',
        payload: { report: updated, lastUpdated: serverState.lastUpdated },
      });
    }
    res.json({ success: Boolean(updated), report: updated, chatReports: serverState.chatReports });
  });

  app.post('/api/private-chat', (req, res) => {
    const created = handleNewPrivateChatMessage(req.body || {});
    if (!created) {
      res.status(400).json({ success: false, message: 'Isi pesan chat privat tidak boleh kosong atau fitur sedang dinonaktifkan Admin.' });
      return;
    }
    res.json({ success: true, message: created, privateChatMessages: serverState.privateChatMessages });
  });

  app.post('/api/private-chat/read-receipts', (req, res) => {
    const messageIds = Array.isArray(req.body?.messageIds)
      ? (req.body.messageIds as unknown[]).map((x) => String(x || '')).filter(Boolean)
      : [];
    const readerAccountId = String(req.body?.accountId || '').trim();
    const readerName = String(req.body?.accountName || 'Nasabah').trim().slice(0, 80);
    if (!readerAccountId || messageIds.length === 0) {
      res.json({ success: true, updatedMessages: [] });
      return;
    }
    const nowMs = Date.now();
    const readIso = new Date(nowMs).toISOString();
    const idSet = new Set(messageIds);
    const updatedMessages: ServerPrivateChatMessage[] = [];
    serverState.privateChatMessages = serverState.privateChatMessages.map((m) => {
      if (!idSet.has(m.id)) return m;
      if (m.readBy && m.readBy[readerAccountId]) return m;
      const next: ServerPrivateChatMessage = {
        ...m,
        readBy: {
          ...(m.readBy || {}),
          [readerAccountId]: {
            accountId: readerAccountId,
            accountName: readerName,
            readAt: readIso,
            readAtMs: nowMs,
          },
        },
        updatedAtMs: nowMs,
      };
      updatedMessages.push(next);
      return next;
    });
    if (updatedMessages.length > 0) {
      savePersistedState();
      broadcastToAll({
        type: 'private_chat:read_receipts',
        payload: {
          messages: updatedMessages,
          readerAccountId,
          readerName,
          readAt: readIso,
          readAtMs: nowMs,
          lastUpdated: serverState.lastUpdated,
        },
      });
    }
    res.json({ success: true, updatedMessages });
  });

  app.patch('/api/private-chat/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    const nowMs = Date.now();
    let updatedMsg: ServerPrivateChatMessage | null = null;
    serverState.privateChatMessages = serverState.privateChatMessages.map((m) => {
      if (m.id === targetId) {
        const nextAttachment =
          req.body?.transferAttachment && typeof req.body.transferAttachment === 'object'
            ? { ...(m.transferAttachment || {}), ...(req.body.transferAttachment as Record<string, unknown>) }
            : m.transferAttachment;
        const mergedReadBy =
          req.body?.readBy && typeof req.body.readBy === 'object'
            ? { ...(m.readBy || {}), ...(req.body.readBy as Record<string, { accountId: string; accountName: string; readAt: string; readAtMs: number }>) }
            : m.readBy;
        let nextRedPacket = m.redPacket;
        if (req.body?.redPacket && typeof req.body.redPacket === 'object') {
          const incRp = req.body.redPacket as Record<string, unknown>;
          const prevClaims = Array.isArray((m.redPacket as Record<string, unknown> | undefined)?.claims)
            ? ((m.redPacket as Record<string, unknown>).claims as Array<{ accountId: string }>)
            : [];
          const incClaims = Array.isArray(incRp.claims) ? (incRp.claims as Array<{ accountId: string }>) : [];
          const byAcc = new Map<string, { accountId: string; amount?: number }>();
          prevClaims.forEach((c) => c?.accountId && byAcc.set(c.accountId, c as { accountId: string; amount?: number }));
          incClaims.forEach((c) => c?.accountId && !byAcc.has(c.accountId) && byAcc.set(c.accountId, c as { accountId: string; amount?: number }));
          const mergedClaims = Array.from(byAcc.values());
          const totalAmt = Number(incRp.totalAmount ?? (m.redPacket as Record<string, unknown> | undefined)?.totalAmount ?? 0);
          const claimedSum = mergedClaims.reduce((s, c) => s + (Number(c.amount) || 0), 0);
          nextRedPacket = {
            ...(m.redPacket || {}),
            ...incRp,
            claims: mergedClaims,
            remainingAmount: Math.max(0, totalAmt - claimedSum),
          };
        }
        let nextSplitBill = m.splitBill;
        if (req.body?.splitBill && typeof req.body.splitBill === 'object') {
          const incSb = req.body.splitBill as Record<string, unknown>;
          const prevPaid = ((m.splitBill as Record<string, unknown> | undefined)?.paidByAccountIdMap as Record<string, unknown>) || {};
          const incPaid = (incSb.paidByAccountIdMap as Record<string, unknown>) || {};
          nextSplitBill = {
            ...(m.splitBill || {}),
            ...incSb,
            paidByAccountIdMap: { ...prevPaid, ...incPaid },
          };
        }
        updatedMsg = {
          ...m,
          ...(typeof req.body?.text === 'string' && req.body.text.trim()
            ? {
                text: req.body.text.trim().slice(0, 1500),
                editedAt: req.body?.editedAt || new Date(nowMs).toISOString(),
                editedAtMs: Number(req.body?.editedAtMs) || nowMs,
              }
            : {}),
          ...(typeof req.body?.deleted === 'boolean' ? { deleted: req.body.deleted } : {}),
          ...(typeof req.body?.isPinned === 'boolean' ? { isPinned: req.body.isPinned } : {}),
          ...(req.body?.reactions && typeof req.body.reactions === 'object'
            ? { reactions: req.body.reactions as Record<string, string[]> }
            : {}),
          ...(req.body?.poll && typeof req.body.poll === 'object'
            ? { poll: req.body.poll as Record<string, unknown> }
            : {}),
          ...(mergedReadBy ? { readBy: mergedReadBy } : {}),
          ...(nextAttachment ? { transferAttachment: nextAttachment } : {}),
          ...(nextRedPacket ? { redPacket: nextRedPacket } : {}),
          ...(nextSplitBill ? { splitBill: nextSplitBill } : {}),
          updatedAtMs: nowMs,
        };
        return updatedMsg;
      }
      return m;
    });
    savePersistedState();
    if (updatedMsg) {
      broadcastToAll({
        type: 'private_chat:updated',
        payload: { message: updatedMsg, lastUpdated: serverState.lastUpdated },
      });
    }
    res.json({ success: Boolean(updatedMsg), message: updatedMsg });
  });

  app.delete('/api/private-chat/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    recordServerTombstones('privateChats', [targetId]);
    serverState.privateChatMessages = serverState.privateChatMessages.filter((m) => m.id !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'private_chat:delete',
      payload: {
        id: targetId,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, id: targetId });
  });

  app.post('/api/private-groups', (req, res) => {
    const group = handleUpsertPrivateGroup(req.body || {});
    if (!group) {
      res.status(400).json({ success: false, message: 'Nama grup dan pembuat grup wajib diisi.' });
      return;
    }
    res.json({ success: true, group, privateChatGroups: serverState.privateChatGroups });
  });

  app.delete('/api/private-groups/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    recordServerTombstones('privateChatGroups', [targetId]);
    serverState.privateChatGroups = serverState.privateChatGroups.filter((g) => g.id !== targetId);
    serverState.privateChatMessages = serverState.privateChatMessages.filter((m) => m.groupId !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'private_group:deleted',
      payload: {
        id: targetId,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, id: targetId, privateChatGroups: serverState.privateChatGroups });
  });

  // ==================== SUGGESTIONS & REWARD PROGRAM API (SARAN) ====================
  app.get('/api/suggestions', (_req, res) => {
    res.json({
      success: true,
      suggestions: serverState.suggestions,
      suggestionRewardConfig: serverState.suggestionRewardConfig || null,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/suggestions', (req, res) => {
    const created = handleNewSuggestion(req.body || {});
    if (!created) {
      res.status(400).json({ success: false, message: 'Judul dan penjelasan saran wajib diisi!' });
      return;
    }
    res.json({ success: true, suggestion: created, suggestions: serverState.suggestions });
  });

  app.patch('/api/suggestions/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    const { status, adminReply, reward, isAcceptedByAdmin, acceptedAt, rejectionReason } = req.body || {};
    let updatedSug: ServerSuggestionRecord | null = null;
    serverState.suggestions = serverState.suggestions.map((s) => {
      if (s.id === targetId) {
        const alreadyRewarded = Boolean(s.reward && (s.reward as Record<string, unknown>).given);
        const nextReward = alreadyRewarded
          ? s.reward
          : reward && typeof reward === 'object'
          ? (reward as Record<string, unknown>)
          : s.reward;
        updatedSug = {
          ...s,
          status: status ? String(status) : s.status,
          adminReply: adminReply !== undefined ? String(adminReply) : s.adminReply,
          isAcceptedByAdmin:
            typeof isAcceptedByAdmin === 'boolean' ? isAcceptedByAdmin : s.isAcceptedByAdmin,
          acceptedAt: acceptedAt !== undefined ? String(acceptedAt) : s.acceptedAt,
          rejectionReason: rejectionReason !== undefined ? String(rejectionReason) : s.rejectionReason,
          ...(nextReward ? { reward: nextReward } : {}),
          updatedAt: new Date().toISOString(),
        };
        return updatedSug;
      }
      return s;
    });
    savePersistedState();
    if (updatedSug) {
      broadcastToAll({
        type: 'suggestion:updated',
        payload: { suggestion: updatedSug, lastUpdated: serverState.lastUpdated },
      });
    }
    res.json({ success: Boolean(updatedSug), suggestion: updatedSug, suggestions: serverState.suggestions });
  });

  app.delete('/api/suggestions/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    recordServerTombstones('suggestions', [targetId]);
    serverState.suggestions = serverState.suggestions.filter((s) => s.id !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'suggestion:deleted',
      payload: {
        id: targetId,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, suggestions: serverState.suggestions });
  });

  app.post('/api/suggestions/clear', (_req, res) => {
    recordServerTombstones(
      'suggestions',
      serverState.suggestions.map((s) => s.id)
    );
    serverState.suggestions = [];
    savePersistedState();
    broadcastToAll({
      type: 'suggestion:clear',
      payload: {
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, suggestions: [] });
  });

  app.get('/api/suggestion-reward-config', (_req, res) => {
    res.json({
      success: true,
      suggestionRewardConfig: serverState.suggestionRewardConfig || null,
      updatedAtMs: serverState.configUpdatedAtMsMap?.suggestionRewardConfig || 0,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/suggestion-reward-config', (req, res) => {
    const incoming = (req.body?.suggestionRewardConfig || req.body || {}) as Record<string, unknown>;
    const incomingTs = Number(req.body?.updatedAtMs ?? incoming.updatedAtMs) || 0;
    const currentTs = Number(serverState.configUpdatedAtMsMap?.suggestionRewardConfig) || 0;
    if (incomingTs > 0 && currentTs > 0 && incomingTs < currentTs) {
      res.json({
        success: true,
        ignoredStale: true,
        suggestionRewardConfig: serverState.suggestionRewardConfig,
        updatedAtMs: currentTs,
        lastUpdated: serverState.lastUpdated,
      });
      return;
    }
    const nextTs = incomingTs > 0 ? incomingTs : Math.max(Date.now(), currentTs + 1);
    serverState.suggestionRewardConfig = {
      ...incoming,
      enabled: Boolean(incoming.enabled),
      cashAmount: Math.max(0, Math.floor(Number(incoming.cashAmount ?? 0) || 0)),
      coinAmount: Math.max(0, Math.floor(Number(incoming.coinAmount ?? 0) || 0)),
      diamondAmount: Math.max(0, Math.floor(Number(incoming.diamondAmount ?? 0) || 0)),
      goldGrams: Math.max(0, Math.round((Number(incoming.goldGrams ?? 0) || 0) * 100) / 100),
      voucherAmount: Math.max(0, Math.floor(Number(incoming.voucherAmount ?? 0) || 0)),
      pointsAmount: Math.max(0, Math.floor(Number(incoming.pointsAmount ?? 0) || 0)),
      familySlotAmount: Math.max(0, Math.floor(Number(incoming.familySlotAmount ?? 0) || 0)),
      defaultRewardMessage: String(incoming.defaultRewardMessage ?? '').slice(0, 300),
      autoRewardTriggerStatuses: Array.isArray(incoming.autoRewardTriggerStatuses)
        ? incoming.autoRewardTriggerStatuses.map((s) => String(s))
        : ['diterima', 'dirilis'],
      updatedAtMs: nextTs,
      updatedAt: new Date(nextTs).toISOString(),
    };
    serverState.configUpdatedAtMsMap = {
      ...(serverState.configUpdatedAtMsMap || {}),
      suggestionRewardConfig: nextTs,
    };
    serverState.adminConfigs = {
      ...(serverState.adminConfigs || {}),
      suggestionRewardConfig: serverState.suggestionRewardConfig,
    };
    savePersistedState();
    broadcastToAll({
      type: 'suggestion_reward_config:updated',
      payload: {
        suggestionRewardConfig: serverState.suggestionRewardConfig,
        updatedAtMs: nextTs,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      suggestionRewardConfig: serverState.suggestionRewardConfig,
      updatedAtMs: nextTs,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/website-popup', (req, res) => {
    const popup = handleNewPopup(req.body);
    res.json({ success: true, popup, websitePopups: serverState.websitePopups });
  });

  // ==================== BUG REPORTS API (LAPOR BUG) ====================
  app.get('/api/bug-reports', (_req, res) => {
    res.json({
      success: true,
      bugReports: serverState.bugReports,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/bug-reports', (req, res) => {
    const created = handleNewBugReport(req.body || {});
    if (!created) {
      res.status(400).json({
        success: false,
        message: 'Penjelasan bug wajib diisi!',
      });
      return;
    }
    res.json({
      success: true,
      bugReport: created,
      bugReports: serverState.bugReports,
    });
  });

  app.patch('/api/bug-reports/:id', (req, res) => {
    const targetId = req.params.id;
    const { status, adminReply, reward, isVerifiedByAdmin, verifiedAt, rejectionReason } = req.body || {};
    let updatedBug: ServerBugReport | null = null;

    serverState.bugReports = serverState.bugReports.map((b) => {
      if (b.id === targetId) {
        const alreadyRewarded = Boolean(b.reward && (b.reward as Record<string, unknown>).given);
        const nextReward = alreadyRewarded
          ? b.reward
          : reward && typeof reward === 'object'
          ? (reward as Record<string, unknown>)
          : b.reward;
        updatedBug = {
          ...b,
          status: status ? String(status) : b.status,
          adminReply: adminReply !== undefined ? String(adminReply) : b.adminReply,
          isVerifiedByAdmin:
            typeof isVerifiedByAdmin === 'boolean' ? isVerifiedByAdmin : b.isVerifiedByAdmin,
          verifiedAt: verifiedAt !== undefined ? String(verifiedAt) : b.verifiedAt,
          rejectionReason: rejectionReason !== undefined ? String(rejectionReason) : b.rejectionReason,
          ...(nextReward ? { reward: nextReward } : {}),
          updatedAt: new Date().toISOString(),
        };
        return updatedBug;
      }
      return b;
    });

    savePersistedState();
    if (updatedBug) {
      broadcastToAll({
        type: 'bug_report:updated',
        payload: { bugReport: updatedBug, lastUpdated: serverState.lastUpdated },
      });
    }
    res.json({ success: true, bugReport: updatedBug, bugReports: serverState.bugReports });
  });

  app.delete('/api/bug-reports/:id', (req, res) => {
    const targetId = req.params.id;
    recordServerTombstones('bugReports', [targetId]);
    bumpServerConfigRevision('bugReports');
    serverState.bugReports = serverState.bugReports.filter((b) => b.id !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'bug_report:deleted',
      payload: {
        id: targetId,
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, bugReports: serverState.bugReports });
  });

  app.post('/api/bug-reports/clear', (_req, res) => {
    recordServerTombstones(
      'bugReports',
      serverState.bugReports.map((b) => b.id)
    );
    bumpServerConfigRevision('bugReports');
    serverState.bugReports = [];
    savePersistedState();
    broadcastToAll({
      type: 'bug_report:clear',
      payload: {
        deletedAdminItemIds: serverState.deletedAdminItemIds,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({ success: true, bugReports: [] });
  });

  app.post('/api/sync-state', (req, res) => {
    if (req.body && typeof req.body === 'object') {
      serverState.sharedBankData = {
        ...serverState.sharedBankData,
        ...req.body,
      };
      savePersistedState();
      broadcastToAll({
        type: 'bank_data:updated',
        payload: {
          sharedBankData: serverState.sharedBankData,
          lastUpdated: serverState.lastUpdated,
        },
      });
    }
    res.json({
      success: true,
      sharedBankData: serverState.sharedBankData,
      lastUpdated: serverState.lastUpdated,
    });
  });

  // ==================== DATABASE STATE API (FULL SERVER PERSISTENCE) ====================
  app.get('/api/db/state', (req, res) => {
    const rawScope = typeof req.query.scopeKey === 'string' ? req.query.scopeKey.trim().toLowerCase() : '';
    const scopedSnapshot = rawScope ? serverState.userSnapshotsByScope[rawScope] || null : null;
    res.json({
      success: true,
      snapshot: scopedSnapshot || (Object.keys(serverState.sharedBankData).length > 0 ? serverState.sharedBankData : null),
      sharedBankData: serverState.sharedBankData,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/db/state', (req, res) => {
    const { scopeKey, snapshot } = (req.body || {}) as {
      scopeKey?: string;
      snapshot?: Record<string, unknown>;
    };
    if (!snapshot || typeof snapshot !== 'object') {
      res.status(400).json({ success: false, message: 'Snapshot database tidak valid.' });
      return;
    }

    const incomingTs = typeof snapshot.updatedAtMs === 'number' ? snapshot.updatedAtMs : Date.now();
    const cleanScope = typeof scopeKey === 'string' ? scopeKey.trim().toLowerCase() : '';

    if (cleanScope) {
      const existingScoped = serverState.userSnapshotsByScope[cleanScope];
      const existingTs = existingScoped && typeof existingScoped.updatedAtMs === 'number' ? existingScoped.updatedAtMs : 0;
      if (incomingTs >= existingTs) {
        serverState.userSnapshotsByScope[cleanScope] = snapshot;
      }
    }

    const sharedTs = typeof serverState.sharedBankData.updatedAtMs === 'number' ? serverState.sharedBankData.updatedAtMs : 0;
    if (incomingTs >= sharedTs) {
      serverState.sharedBankData = {
        ...serverState.sharedBankData,
        ...snapshot,
      };
    }

    savePersistedState();

    res.json({
      success: true,
      lastUpdated: serverState.lastUpdated,
    });
  });

  // ==================== AI BOT ASSISTANT API (GEMINI FLASH + PENGETAHUAN LENGKAP APLIKASI) ====================
  const BANK_NUSANTARA_SYSTEM_KNOWLEDGE = `
Anda adalah Bot AI Resmi khusus Aplikasi PT Bank Nusantara (Persero) Tbk (ditenagai mesin Gemini 1.5 Flash / Gemini Flash).
Tugas Anda adalah menjawab pertanyaan apa pun dari nasabah atau admin dengan penjelasan yang SANGAT LENGKAP, ramah, terstruktur, dan akurat mengenai seluruh tombol, fitur, mekanisme, dan rahasia di dalam aplikasi Bank Nusantara.

Berikut adalah Ensiklopedia Lengkap Aplikasi Bank Nusantara yang wajib Anda kuasai 100%:
1. PENDAFTARAN KARTU BARU & WAJIB PERSETUJUAN ADMIN SEBELUM TUTORIAL:
   - Saat pertama masuk, pengguna login menggunakan Akun Google, lalu bisa Daftar Kartu Baru atau Login ke Kartu Lama (pakai 6 digit PIN Kartu Lama, bukan PIN Admin).
   - Setiap pembuatan kartu baru berstatus "PENDING" (Menunggu Persetujuan Admin).
   - Pembuatan kartu baru HARUS disetujui Admin terlebih dahulu di Panel Admin (atau lewat fitur Mintol Admin) agar kartunya menjadi AKTIF.
   - Begitu kartu disetujui Admin, fitur TUTORIAL LENGKAP APLIKASI langsung terbuka otomatis dan menjelaskan semua tombol, menu, serta fitur dari A sampai Z!
   - Di bagian paling bawah aplikasi (Footer) juga terdapat tombol "🎓 Tutorial Aplikasi" khusus bagi kartu yang sudah disetujui Admin. Setiap ada penambahan fitur baru, isi Tutorial otomatis ikut bertambah.

2. PIN PENTING DI APLIKASI:
   - Kode PIN Otorisasi Panel Admin bersifat rahasia dan hanya diketahui Administrator.
   - PIN Kartu Default dapat diatur dan diubah oleh nasabah di menu Keamanan Kartu.

3. 5 KASTA KARTU DEBIT BANK NUSANTARA:
   - Kartu 1: Nusantara Reguler (Silver) - Limit Tarik Rp 5.000.000/hari.
   - Kartu 2: Nusantara Gold (Emas) - Limit Tarik Rp 15.000.000/hari.
   - Kartu 3: Nusantara Platinum (Premium) - Limit Tarik Rp 25.000.000/hari.
   - Kartu 4: Nusantara Infinite Metal (Hitam) - Limit Tarik Rp 50.000.000/hari.
   - Kartu 5: Kartu Admin (Infinity / ∞) - Saldo, poin, dan limit Tidak Terbatas selamanya!

4. TOMBOL-TOMBOL DI NAVBAR ATAS:
   - Mobile Banking: Berisi 10+ sub-tab (Beranda, Transfer, Kartu 3D, Belanja 136+ Fitur, Tarik Tanpa Kartu, Pinjaman, Deposito, Celengan, Tukar Kode, Lacak Resi, Kalkulator).
   - Lowongan Kerja (9 Gaji & Target Klik 5x Lipat):
     * 1. Gaji Rp 100.000: Gratis (Level 1) — Target 200 Klik.
     * 2. Gaji Rp 200.000: Syarat Level 3 — Target 300 Klik.
     * 3. Gaji Rp 500.000: Syarat Level 5 — Target 500 Klik.
     * 4. Gaji Rp 750.000: Syarat Level 10 — Target 700 Klik.
     * 5. Gaji Rp 1.000.000: Syarat Level 15 — Target 1.000 Klik.
     * 6. Gaji Rp 1.200.000: Syarat Level 12 — Target 1.200 Klik.
     * 7. Gaji Rp 1.500.000: Syarat Level 17 (bukan 12) — Target 1.500 Klik.
     * 8. Gaji Rp 1.750.000: Syarat Level 18 — Target 1.800 Klik.
     * 9. Gaji Rp 2.000.000: Syarat Level 25 — Target 2.000 Klik.
     * Cara Naik Level: Bayar Rp 1.000.000 langsung naik +1 Level, ATAU main Arena Suit lawan Komputer (Level Medium/Sedang) dengan biaya Rp 500.000. Jika menang Suit dapat 1 Voucher Level + uang tunai Rp 300.000!
   - Spin the Wheel (Di sebelah tombol Lowongan Pekerjaan):
     * Hadiah mulai dari Rp 100.000, Rp 500.000, Rp 750.000, Rp 1.000.000 (peluang 1%), Rp 1.500.000, Rp 2.000.000, terus naik Rp 500.000 sampai Rp 7.000.000, lalu Rp 7.500.000, Rp 10.000.000, serta Jackpot Rp 15.000.000 & Rp 20.000.000 (peluang 0,000000000001% atau 1 dari 1.000 Kuadriliun!).
     * 1x Spin = 100 Koin (setara Rp 1.000.000). Bisa Spin 1x, 3x, 5x, 7x, atau 10x.
     * Di bagian atas ada bar Koin [🪙] [0] [+]. Klik [+] untuk membeli 100 Pilihan Paket Koin (1 Koin s/d 1.000.000 Koin, harga dasar 1 Koin = Rp 10.000 + recehan desimal). Semua bisa didiskon & diatur probabilitasnya di Panel Admin!
   - Kerajaan Sultan (Di sebelah tombol Spin the Wheel — KHUSUS LEVEL 50):
     * Wajib mencapai Level Karir 50 terlebih dahulu untuk membuka Kerajaan Bisnis & Bursa Sultan.
     * Berisi 12 Aset Kerajaan Bisnis (penghasil uang pasif + Koin Spin), Bursa Trading Real-Time (Emas 24K, Saham BNUS, Bitcoin, Berlian, Sukuk, Nikel), dan 5 Brankas Misteri Sultan.
   - PayChat: Chat antar nomor rekening / nomor HP dan kirim uang langsung di gelembung chat.
   - Simulator ATM: Mesin ATM fisik interaktif dengan 11 fitur utama, suara bip asli, struk cetak, dan fitur Lupa PIN (ditinjau Admin).
   - Buku Panduan (60 Bab Ensiklopedia) & Riwayat Update (Di sebelah Panduan, otomatis terisi setiap aplikasi di-update).
   - Tombol Notifikasi (🔔) dengan dukungan filter kategori Transaksi, Pinjaman, dan Keamanan.

5. TOMBOL-TOMBOL DI PALING BAWAH (FOOTER):
   - Lapor Bug: Kirim penjelasan bug (wajib) + foto tangkapan layar (opsional).
   - Minta Tolong ke Admin (Mintol Admin): Di sebelah tombol Lapor Bug. Pesan wajib diisi + bisa memilih 35+ Fitur Mintol (Suntik Saldo, Bagi Koin Spin, Naikkan ke Level 50, Buka Banned, Centang Biru, Upgrade Kartu Admin ∞, ACC Semua Transaksi, dll) yang bisa langsung dikabulkan 1-klik oleh Admin!
   - Panel Admin: Portal otoritas khusus Administrator yang dilindungi akses rahasia.
`;

  function buildLocalSmartAnswer(question: string, botPersona?: string, contextSummary?: string): string {
    const q = question.toLowerCase();
    const prefix =
      botPersona === 'career'
        ? '💼 **[Bot Spesialis Karir, Level & Kerajaan Sultan Lv.50]**\n\n'
        : botPersona === 'spin'
        ? '🎡 **[Bot Spesialis Spin the Wheel & Koin Jackpot]**\n\n'
        : botPersona === 'admin'
        ? '🛡️ **[Bot Spesialis Otoritas Panel Admin & 56 Super Tools]**\n\n'
        : '🤖 **[Asisten Informasi Bank Nusantara]**\n\n';

    if (q.includes('tutorial') || (q.includes('kartu') && (q.includes('baru') || q.includes('setuju') || q.includes('acc')))) {
      return `${prefix}**Penjelasan Lengkap Persetujuan Kartu Baru:**\n\n1. **Wajib Disetujui Admin Dulu:** Setiap kali Anda membuat kartu baru, status awalnya adalah **PENDING (Menunggu Persetujuan Admin)**.\n2. **Proses Verifikasi Admin:** Admin memverifikasi data dan melakukan persetujuan kartu pada antrean resmi.\n3. **Status Aktif:** Begitu kartu disetujui Admin, nomor rekening 10 digit diterbitkan otomatis dan saldo awal masuk ke rekening.`;
    }

    if (q.includes('kerajaan') || q.includes('sultan') || q.includes('level 50') || q.includes('lv 50') || q.includes('bisnis') || q.includes('bursa')) {
      return `${prefix}**Penjelasan Lengkap Fitur Kerajaan Bisnis & Bursa Sultan (Khusus Level 50):**\n\n1. **Syarat Level 50:** Fitur **👑 Kerajaan Sultan** (di sebelah tombol Spin the Wheel) dikhususkan bagi nasabah yang telah mencapai **Level Pekerjaan 50**.\n2. **Cara Cepat Mencapai Level 50:**\n   - Di halaman Kerajaan Sultan yang terkunci, Anda bisa klik **"Naik +1 Level (Rp 1.000.000)"**, **"Pakai Voucher Level"**, atau tombol **"Buka Instan Level 50 (Bayar Sekaligus)"**.\n   - Bisa juga meminta bantuan lewat tombol **"🙏 Minta Tolong ke Admin"** di paling bawah.\n3. **Isi Fitur Kerajaan Sultan:**\n   - **12 Aset Kerajaan Bisnis:** Mulai dari Kedai Kopi Nusantara hingga Pulau Finansial & Bank Sentral yang menghasilkan uang tunai pasif + bonus Koin Spin.\n   - **Bursa Trading Real-Time:** Jual/beli 6 aset (Emas 24K, Saham BNUS, Bitcoin, Berlian, Sukuk Negara, Nikel EV) dengan grafik harga per 3 detik.\n   - **5 Brankas Misteri Sultan:** Buka peti harta karun berhadiah uang tunai hingga Rp 1 Miliar, Koin Spin, dan Voucher Level.`;
    }

    if (q.includes('lowongan') || q.includes('kerja') || q.includes('gaji') || q.includes('suit') || q.includes('klik') || q.includes('voucher level')) {
      return `${prefix}**Penjelasan Lengkap Lowongan Pekerjaan, Target Klik (5x Lipat) & Suit Komputer Medium:**\n\n1. **Daftar 9 Pekerjaan, Syarat Level & Target Klik:**\n   - **#1 Gaji Rp 100.000:** GRATIS pasti dapat (Level 1) • Target **200 Klik**\n   - **#2 Gaji Rp 200.000:** Syarat Level 3 • Target **300 Klik**\n   - **#3 Gaji Rp 500.000:** Syarat Level 5 • Target **500 Klik**\n   - **#4 Gaji Rp 750.000:** Syarat Level 10 • Target **700 Klik**\n   - **#5 Gaji Rp 1.000.000:** Syarat Level 15 • Target **1.000 Klik**\n   - **#6 Gaji Rp 1.200.000:** Syarat Level 12 • Target **1.200 Klik**\n   - **#7 Gaji Rp 1.500.000:** Syarat Level 17 (bukan 12) • Target **1.500 Klik**\n   - **#8 Gaji Rp 1.750.000:** Syarat Level 18 • Target **1.800 Klik**\n   - **#9 Gaji Rp 2.000.000:** Syarat Level 25 • Target **2.000 Klik**\n2. **Cara Meningkatkan Level:**\n   - **Bayar Tunai:** Rp 1.000.000 per +1 Level.\n   - **Arena Suit Lawan Komputer (Level Medium/Sedang):** Bayar Rp 500.000 per tanding. Jika menang, Anda mendapat **1 Voucher Level** (untuk menaikkan level dari Lv 1 ke Lv 2 dst) + hadiah uang **Rp 300.000**!`;
    }

    if (q.includes('spin') || q.includes('wheel') || q.includes('koin') || q.includes('kuadriliun') || q.includes('20 juta') || q.includes('15 juta')) {
      return `${prefix}**Penjelasan Lengkap Fitur Spin the Wheel & 100 Paket Koin:**\n\n1. **Lokasi Tombol:** Berada di Navbar atas tepat di sebelah tombol **Lowongan Kerja**.\n2. **20 Hadiah Spin:** Mulai dari Rp 100.000, Rp 500.000, Rp 750.000, Rp 1.000.000 (peluang 1%), Rp 1.500.000, Rp 2.000.000, naik per Rp 500.000 hingga Rp 7.500.000, Rp 10.000.000, serta **Rp 15.000.000 & Rp 20.000.000** (peluang **0,000000000001%** atau **1 dari 1.000 Kuadriliun**).\n3. **Biaya & Multi-Spin:** 1x Spin membutuhkan **100 Koin** (setara Rp 1.000.000). Tersedia tombol Spin **1x, 3x, 5x, 7x, dan 10x**.\n4. **Cara Beli Koin:** Klik tombol **[+]** pada bar koin di kanan atas halaman Spin the Wheel. Tersedia **100 Pilihan Pembelian Koin** dari **1 Koin s/d 1.000.000 Koin**.\n5. **Diskon & Boost Admin:** Admin dapat mengatur diskon harga koin maupun biaya spin di Panel Admin.`;
    }

    if (q.includes('mintol') || q.includes('minta tolong') || q.includes('lapor') || q.includes('bug')) {
      return `${prefix}**Penjelasan Lengkap Tombol Paling Bawah (Lapor Bug & Mintol Admin):**\n\n1. **🐞 Lapor Bug:** Mengirim laporan kendala (penjelasan wajib diisi + foto bebas opsional) langsung ke Panel Admin.\n2. **🙏 Minta Tolong ke Admin (Mintol Admin):** Terletak di sebelah tombol Lapor Bug. Anda wajib mengisi pesan permohonan dan dapat memilih dari **35+ Fitur Mintol** (seperti Minta Saldo, Minta Koin Spin, Naik Level 50, Buka Banned Kartu, Minta Centang Biru, dll).`;
    }

    if (q.includes('pin') || q.includes('admin') || q.includes('super tool')) {
      return `${prefix}**Penjelasan Lengkap Keamanan PIN & Otoritas Admin:**\n\n1. **Kerahasiaan PIN:** PIN Admin bersifat rahasia dan tidak ditampilkan kepada umum.\n2. **PIN Kartu Nasabah:** Masing-masing kartu memiliki 6 digit PIN rahasia. Jika lupa, gunakan fitur "Lupa PIN Kartu?" pada modal PIN.\n3. **Fitur Panel Admin:** Menyetujui pembuatan kartu baru, menyetujui transaksi, mengatur Riwayat Update, kontrol Spin Wheel & Mining, serta mengabulkan Mintol nasabah.`;
    }

    return `${prefix}**Panduan Lengkap Aplikasi Bank Nusantara:**\n\nHalo! Berikut ringkasan fitur utama **PT Bank Nusantara (Persero) Tbk**:\n\n- **📱 Mobile Banking:** Beranda, Transfer Instan, Kartu 3D, Katalog 136+ Fitur Pembayaran, Tarik Tunai Tanpa Kartu, Pinjaman, Deposito, Celengan, Tukar Kode, & Lacak Resi COD.\n- **💼 Lowongan Kerja:** 9 Gaji (Rp 100.000 s/d Rp 2.000.000) + Arena Suit lawan Komputer Medium.\n- **🎡 Spin the Wheel:** Hadiah Rp 100.000 s/d Rp 20.000.000 + Toko Paket Koin.\n- **🔔 Pusat Notifikasi:** Peringatan push transaksi, pinjaman, dan keamanan kartu secara real-time.\n${contextSummary ? `\n📌 **Info Akun Anda Saat Ini:** ${contextSummary}` : ''}`;
  }

  app.post('/api/ai-assistant', async (req, res) => {
    const { message, history, botPersona, contextSummary } = req.body || {};
    const cleanMessage = String(message || '').trim();
    if (!cleanMessage) {
      res.status(400).json({ success: false, message: 'Pertanyaan tidak boleh kosong.' });
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const fallbackReply = buildLocalSmartAnswer(cleanMessage, botPersona, contextSummary);
      res.json({
        success: true,
        reply: fallbackReply,
        modelUsed: 'Gemini 1.5 Flash (Nusantara AI Engine)',
      });
      return;
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const personaInstruction =
        botPersona === 'career'
          ? 'Fokus utama Anda sebagai Spesialis Karir, Level & Kerajaan Sultan Lv.50 adalah menjelaskan Lowongan Pekerjaan (9 Gaji & Target Klik), Suit Komputer Medium, dan Kerajaan Bisnis & Bursa Sultan (khusus Level 50), namun tetap bisa menjawab semua fitur aplikasi.'
          : botPersona === 'spin'
          ? 'Fokus utama Anda sebagai Spesialis Spin the Wheel & Koin adalah menjelaskan 20 hadiah Spin Wheel, peluang 1% untuk 1 Juta dan 0,000000000001% (1 dari 1.000 Kuadriliun) untuk 15 & 20 Juta, 100 paket koin, serta diskon admin, namun tetap bisa menjawab semua fitur aplikasi.'
          : botPersona === 'admin'
          ? 'Fokus utama Anda adalah menjelaskan prosedur layanan Bank Nusantara tanpa pernah membocorkan PIN Admin rahasia kepada publik.'
          : 'Anda adalah asisten informasi resmi Bank Nusantara yang menjelaskan fitur aplikasi tanpa pernah membocorkan PIN rahasia.';

      const recentHistoryText = Array.isArray(history)
        ? history
            .slice(-6)
            .map((h: { role?: string; text?: string }) => `${h.role === 'user' ? 'Nasabah' : 'Bot AI'}: ${h.text || ''}`)
            .join('\n')
        : '';

      const prompt = `${personaInstruction}
${contextSummary ? `\nKonteks Akun Nasabah Saat Ini:\n${contextSummary}\n` : ''}
${recentHistoryText ? `\nRiwayat Percakapan Sebelumnya:\n${recentHistoryText}\n` : ''}
Pertanyaan Nasabah: "${cleanMessage}"

Berikan jawaban dalam Bahasa Indonesia yang sangat jelas, lengkap, ramah, dan mudah dipahami (serta nyaman didengar saat dibacakan dengan Voice Chat / Suara).`;

      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: prompt,
        config: {
          systemInstruction: BANK_NUSANTARA_SYSTEM_KNOWLEDGE,
          temperature: 0.4,
        },
      });

      const replyText = response.text?.trim() || buildLocalSmartAnswer(cleanMessage, botPersona, contextSummary);
      res.json({
        success: true,
        reply: replyText,
        modelUsed: 'Gemini 1.5 Flash',
      });
    } catch (err) {
      console.error('Gemini API fallback triggered:', err);
      const fallbackReply = buildLocalSmartAnswer(cleanMessage, botPersona, contextSummary);
      res.json({
        success: true,
        reply: fallbackReply,
        modelUsed: 'Gemini 1.5 Flash (Nusantara Knowledge Engine)',
      });
    }
  });

  // ==================== GOOGLE MAPS PLATFORM REVERSE GEOCODING PROXY ====================
  app.get('/api/maps/reverse-geocode', async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      res.status(400).json({ success: false, message: 'Invalid coordinates' });
      return;
    }

    const mapsKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    if (!mapsKey) {
      res.json({ success: false, reason: 'no_key' });
      return;
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${encodeURIComponent(
        `${lat},${lng}`
      )}&language=id&key=${encodeURIComponent(
        mapsKey
      )}&solution_id=gmp_mcp_codeassist_v1_aistudio`;
      const response = await fetch(url);
      if (response.status === 429) {
        res.status(429).json({
          success: false,
          quotaExceeded: true,
          error: { status: 'RESOURCE_EXHAUSTED' },
        });
        return;
      }
      const data = (await response.json()) as {
        status?: string;
        results?: Array<{ formatted_address?: string; place_id?: string }>;
      };
      if (data.status === 'OVER_QUERY_LIMIT' || data.status === 'RESOURCE_EXHAUSTED') {
        res.status(429).json({
          success: false,
          quotaExceeded: true,
          error: { status: 'RESOURCE_EXHAUSTED' },
        });
        return;
      }
      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        res.json({
          success: true,
          formattedAddress: data.results[0].formatted_address || '',
          placeId: data.results[0].place_id || '',
        });
        return;
      }
      res.json({ success: false, status: data.status || 'ZERO_RESULTS' });
    } catch (err) {
      res.json({ success: false, error: String(err) });
    }
  });

  // ==================== INDONESIAN 38-PROVINCE REGIONS & POSTAL CODE PROXY ====================
  const regionProxyCache = new Map<string, { data: unknown; expiresAt: number }>();
  const REGION_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  async function fetchFirstValidJson(urls: string[]): Promise<any | null> {
    for (const url of urls) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      try {
        const resp = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: 'application/json', 'User-Agent': 'BankNusantaraApp/1.0' },
        });
        if (!resp.ok) continue;
        const json = await resp.json();
        const arr = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : null;
        if (arr && arr.length > 0) {
          return arr;
        }
      } catch {
        // try next upstream
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }

  function normalizeRegionList(arr: any[]) {
    return arr
      .map((item) => {
        const code = String(item?.code ?? item?.id ?? '').trim();
        const name = String(item?.name ?? item?.nama ?? '').trim();
        const postalRaw = item?.postal_code ?? item?.postalCode ?? item?.kodepos;
        const postalCode =
          typeof postalRaw === 'string' || typeof postalRaw === 'number'
            ? String(postalRaw).replace(/\D/g, '').slice(0, 5)
            : undefined;
        return {
          code,
          name,
          ...(postalCode && postalCode.length === 5 ? { postalCode } : {}),
        };
      })
      .filter((x) => x.code && x.name);
  }

  app.get('/api/regions/provinces', async (_req, res) => {
    const cacheKey = 'provinces';
    const hit = regionProxyCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      res.json({ success: true, cached: true, data: hit.data });
      return;
    }
    const raw = await fetchFirstValidJson([
      'https://wilayah.id/api/provinces.json',
      'https://www.emsifa.com/api-wilayah-indonesia/v2/provinces.json',
      'https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json',
    ]);
    if (raw) {
      const data = normalizeRegionList(raw);
      regionProxyCache.set(cacheKey, { data, expiresAt: Date.now() + REGION_CACHE_TTL_MS });
      res.json({ success: true, data });
      return;
    }
    res.json({ success: false, data: [] });
  });

  app.get('/api/regions/regencies/:provinceCode', async (req, res) => {
    const rawCode = String(req.params.provinceCode || '').replace(/[^0-9.]/g, '');
    if (!rawCode) {
      res.status(400).json({ success: false, data: [] });
      return;
    }
    const flatCode = rawCode.replace(/\./g, '');
    const cacheKey = `regencies:${flatCode}`;
    const hit = regionProxyCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      res.json({ success: true, cached: true, data: hit.data });
      return;
    }
    const raw = await fetchFirstValidJson([
      `https://wilayah.id/api/regencies/${flatCode}.json`,
      `https://www.emsifa.com/api-wilayah-indonesia/v2/regencies/${flatCode}.json`,
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${flatCode}.json`,
    ]);
    if (raw) {
      const data = normalizeRegionList(raw);
      regionProxyCache.set(cacheKey, { data, expiresAt: Date.now() + REGION_CACHE_TTL_MS });
      res.json({ success: true, data });
      return;
    }
    res.json({ success: false, data: [] });
  });

  app.get('/api/regions/districts/:regencyCode', async (req, res) => {
    const rawCode = String(req.params.regencyCode || '').replace(/[^0-9.]/g, '');
    if (!rawCode) {
      res.status(400).json({ success: false, data: [] });
      return;
    }
    const flatCode = rawCode.replace(/\./g, '');
    const dottedCode =
      rawCode.includes('.') || flatCode.length !== 4
        ? rawCode
        : `${flatCode.slice(0, 2)}.${flatCode.slice(2, 4)}`;
    const cacheKey = `districts:${flatCode}`;
    const hit = regionProxyCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      res.json({ success: true, cached: true, data: hit.data });
      return;
    }
    const raw = await fetchFirstValidJson([
      `https://wilayah.id/api/districts/${dottedCode}.json`,
      `https://www.emsifa.com/api-wilayah-indonesia/v2/districts/${flatCode}.json`,
      `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${flatCode}.json`,
    ]);
    if (raw) {
      const data = normalizeRegionList(raw);
      regionProxyCache.set(cacheKey, { data, expiresAt: Date.now() + REGION_CACHE_TTL_MS });
      res.json({ success: true, data });
      return;
    }
    res.json({ success: false, data: [] });
  });

  app.get('/api/regions/villages/:districtCode', async (req, res) => {
    const rawCode = String(req.params.districtCode || '').replace(/[^0-9.]/g, '');
    if (!rawCode) {
      res.status(400).json({ success: false, data: [] });
      return;
    }
    const flatCode = rawCode.replace(/\./g, '');
    const dottedCode =
      rawCode.includes('.') || flatCode.length !== 6
        ? rawCode
        : `${flatCode.slice(0, 2)}.${flatCode.slice(2, 4)}.${flatCode.slice(4, 6)}`;
    const cacheKey = `villages:${flatCode}`;
    const hit = regionProxyCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      res.json({ success: true, cached: true, data: hit.data });
      return;
    }
    const raw = await fetchFirstValidJson([
      `https://wilayah.id/api/villages/${dottedCode}.json`,
      `https://www.emsifa.com/api-wilayah-indonesia/v2/villages/${flatCode}.json`,
      `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${flatCode}.json`,
    ]);
    if (raw) {
      const data = normalizeRegionList(raw);
      regionProxyCache.set(cacheKey, { data, expiresAt: Date.now() + REGION_CACHE_TTL_MS });
      res.json({ success: true, data });
      return;
    }
    res.json({ success: false, data: [] });
  });

  app.get('/api/regions/postal-code', async (req, res) => {
    const village = String(req.query.village || '').trim();
    const district = String(req.query.district || '').trim();
    const regency = String(req.query.regency || '').trim();
    const province = String(req.query.province || '').trim();
    const cleanRegency = regency.replace(/^(kabupaten|kota|kab\.|kota administrasi|kabupaten administrasi)\s+/i, '').trim();
    const queries = [
      [village, district, cleanRegency].filter(Boolean).join(' '),
      [district, cleanRegency].filter(Boolean).join(' '),
      cleanRegency || regency,
    ].filter((q) => q.length >= 2);

    const cacheKey = `postal:${queries.join('|').toLowerCase()}`;
    const hit = regionProxyCache.get(cacheKey);
    if (hit && hit.expiresAt > Date.now()) {
      res.json({ success: true, cached: true, postalCode: hit.data });
      return;
    }

    for (const q of queries) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      try {
        const resp = await fetch(`https://kodepos.vercel.app/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
          headers: { Accept: 'application/json', 'User-Agent': 'BankNusantaraApp/1.0' },
        });
        if (!resp.ok) continue;
        const json = (await resp.json()) as { data?: Array<Record<string, any>> };
        const rows = Array.isArray(json?.data) ? json.data : [];
        if (rows.length === 0) continue;

        const norm = (s: string) =>
          String(s || '')
            .toLowerCase()
            .replace(/^(kabupaten|kota|kecamatan|desa|kelurahan|provinsi)\s+/i, '')
            .trim();

        const targetVillage = norm(village);
        const targetDistrict = norm(district);
        const targetRegency = norm(cleanRegency || regency);
        const targetProvince = norm(province);

        let bestRow = rows[0];
        let bestScore = -1;
        for (const r of rows) {
          let score = 0;
          const rVillage = norm(r.village || r.urban || '');
          const rDistrict = norm(r.district || r.subdistrict || '');
          const rRegency = norm(r.regency || r.city || '');
          const rProvince = norm(r.province || '');
          if (targetVillage && rVillage.includes(targetVillage)) score += 6;
          if (targetDistrict && rDistrict.includes(targetDistrict)) score += 4;
          if (targetRegency && rRegency.includes(targetRegency)) score += 3;
          if (targetProvince && rProvince.includes(targetProvince)) score += 1;
          if (score > bestScore) {
            bestScore = score;
            bestRow = r;
          }
        }
        const foundCode = String(bestRow?.code ?? bestRow?.postalcode ?? '')
          .replace(/\D/g, '')
          .slice(0, 5);
        if (foundCode.length === 5) {
          regionProxyCache.set(cacheKey, { data: foundCode, expiresAt: Date.now() + REGION_CACHE_TTL_MS });
          res.json({ success: true, postalCode: foundCode });
          return;
        }
      } catch {
        // try narrower query
      } finally {
        clearTimeout(timer);
      }
    }

    res.json({ success: false, postalCode: '' });
  });

  // ==================== QRIS NUSANTARA PAYMENT GATEWAY, QR MANUAL & WEBHOOK API ====================
  const sanitizeOrderForClient = (order: ServerQrisOrder): Omit<ServerQrisOrder, 'configNotice'> => {
    const { configNotice: _notice, ...safeOrder } = order;
    return safeOrder;
  };

  app.get('/api/qris/config-status', (_req, res) => {
    const cfg = getBuatQrisConfig();
    const adminQris = (serverState.qrisAdminConfig || {}) as Record<string, unknown>;
    const hasLoginId = Boolean(cfg.BUATQRIS_LOGIN_ID || adminQris.customLoginId);
    const hasAccountId = Boolean(cfg.ACCOUNT_ID || adminQris.customAccountId);
    const hasSecretKey = Boolean(cfg.SECRET_KEY);
    const hasWebhookUrl = Boolean(cfg.WEBHOOK_URL);
    const hasWebhookSecret = Boolean(cfg.WEBHOOK_SECRET);
    const hasStaticQris = Boolean(
      cfg.STATIC_QRIS_STRING || adminQris.customStaticQrisString || adminQris.manualQrisString
    );
    const isManualActive =
      adminQris.mode === 'manual_override' &&
      Boolean(adminQris.manualQrImageDataUrl || adminQris.manualQrisString);
    const activeMode: 'api' | 'emvco' | 'manual' = isManualActive
      ? 'manual'
      : hasSecretKey && hasAccountId
      ? 'api'
      : 'emvco';
    res.json({
      success: true,
      defaultMode: cfg.DEFAULT_MODE,
      expiryMinutes: cfg.DEFAULT_EXPIRY_MINUTES,
      useUniqueCode: cfg.USE_UNIQUE_CODE_3_DIGIT,
      hasLoginId,
      hasAccountId,
      hasSecretKey,
      hasWebhookUrl,
      hasApiKey: hasSecretKey,
      hasMerchantId: hasAccountId,
      hasWebhookSecret,
      hasStaticQris,
      isManualActive,
      manualMerchantName: adminQris.manualMerchantName || '',
      gatewayUrl: String(adminQris.customGatewayUrl || cfg.BUATQRIS_URL_SITE),
      activeMode,
      activeEngine: activeMode,
    });
  });

  app.post('/api/qris/test-connection', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const adminQris = (serverState.qrisAdminConfig || {}) as Record<string, unknown>;
    const urlToTest =
      typeof body.customGatewayUrl === 'string' && body.customGatewayUrl.trim()
        ? body.customGatewayUrl.trim()
        : typeof adminQris.customGatewayUrl === 'string'
        ? adminQris.customGatewayUrl
        : undefined;
    const result = await testBuatQrisGatewayServer(urlToTest);
    res.json({ success: true, ...result });
  });

  app.get('/api/qris/orders', (_req, res) => {
    const list = Object.values(serverState.qrisOrders || {})
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 100)
      .map(sanitizeOrderForClient);
    res.json({ success: true, orders: list });
  });

  app.post('/api/qris/create', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const rawOrderId = String(body.orderId || `QRIS-${Date.now()}`).replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
    const amount = Math.round(Number(body.amount) || 0);
    const accountId = String(body.accountId || '').trim().slice(0, 80);
    const purpose = String(body.purpose || 'diamond_topup').trim().slice(0, 40);
    const diamondAmount = body.diamondAmount ? Math.max(0, Math.round(Number(body.diamondAmount) || 0)) : undefined;

    if (!rawOrderId || amount < 1) {
      res.status(400).json({ success: false, message: 'Nominal dan Order ID pembayaran QRIS wajib valid.' });
      return;
    }

    if (purpose === 'diamond_topup') {
      const HARD_MIN_DIAMONDS = 11;
      const HARD_MAX_DIAMONDS = 11_099;
      const HARD_MAX_RUPIAH = 998_910;
      const activeDiamondCfg = (serverState.diamondConfig ||
        (serverState.sharedBankData?.diamondConfig as Record<string, unknown> | undefined) ||
        {}) as Record<string, unknown>;

      const maxDiamondsAllowed = Math.max(
        HARD_MIN_DIAMONDS,
        Math.min(HARD_MAX_DIAMONDS, Math.round(Number(activeDiamondCfg.maxCustomDiamond) || HARD_MAX_DIAMONDS))
      );
      const maxRupiahAllowed = Math.max(
        1_000,
        Math.min(HARD_MAX_RUPIAH, Math.round(Number(activeDiamondCfg.maxPurchaseRupiah) || HARD_MAX_RUPIAH))
      );

      if (!diamondAmount || diamondAmount < HARD_MIN_DIAMONDS || diamondAmount > maxDiamondsAllowed) {
        res.status(400).json({
          success: false,
          message: `Jumlah pembelian Diamond minimal ${HARD_MIN_DIAMONDS} hingga maksimal ${maxDiamondsAllowed.toLocaleString('id-ID')} per transaksi.`,
        });
        return;
      }

      if (amount < 1_000 || amount > maxRupiahAllowed) {
        res.status(400).json({
          success: false,
          message: `Nominal dasar Diamond harus antara Rp 1.000 hingga Rp ${maxRupiahAllowed.toLocaleString('id-ID')}.`,
        });
        return;
      }
    }

    try {
      const created = await createBuatQrisInvoiceServer({
        orderId: rawOrderId,
        amount,
        customerName: typeof body.customerName === 'string' ? body.customerName.slice(0, 80) : undefined,
        description: typeof body.description === 'string' ? body.description.slice(0, 140) : undefined,
        useUniqueCode: typeof body.useUniqueCode === 'boolean' ? body.useUniqueCode : true,
        expiryMinutes: typeof body.expiryMinutes === 'number' ? body.expiryMinutes : 10,
        adminConfig: (serverState.qrisAdminConfig as Record<string, unknown> | null) || null,
      });

      const orderRecord: ServerQrisOrder = {
        orderId: created.orderId,
        externalInvoiceId: created.externalInvoiceId,
        accountId,
        purpose,
        diamondAmount,
        baseAmount: created.baseAmount,
        uniqueCode: created.uniqueCode,
        totalAmount: created.totalAmount,
        modeUsed: created.modeUsed,
        configReady: created.configReady,
        configNotice: created.configNotice,
        qrisString: created.qrisString,
        qrisImageUrl: created.qrisImageUrl,
        manualQrImageDataUrl: created.manualQrImageDataUrl,
        manualPaymentNote: created.manualPaymentNote,
        status: 'PENDING',
        customerName: typeof body.customerName === 'string' ? body.customerName.slice(0, 80) : undefined,
        description: typeof body.description === 'string' ? body.description.slice(0, 140) : undefined,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
      };

      serverState.qrisOrders[orderRecord.orderId] = orderRecord;
      const orderKeys = Object.keys(serverState.qrisOrders);
      if (orderKeys.length > 250) {
        const sorted = Object.values(serverState.qrisOrders).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
        );
        serverState.qrisOrders = Object.fromEntries(sorted.slice(0, 250).map((o) => [o.orderId, o]));
      }
      savePersistedState();

      res.json(created);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat membuat tagihan QRIS Nusantara.',
        error: String(err),
      });
    }
  });

  app.post('/api/qris/admin-simulate', (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const orderId = String(body.orderId || '').replace(/[^A-Za-z0-9_-]/g, '');
    const action = String(body.action || 'LUNAS').toUpperCase();
    const order = serverState.qrisOrders[orderId];
    if (!order) {
      res.status(404).json({ success: false, message: 'Order QRIS tidak ditemukan di server.' });
      return;
    }
    if (action === 'EXPIRED') {
      order.status = 'EXPIRED';
      savePersistedState();
      res.json({ success: true, status: 'EXPIRED', order: sanitizeOrderForClient(order) });
      return;
    }
    order.status = 'PAID';
    order.paidAt = new Date().toISOString();
    order.providerReference = `SIM-ADMIN-${Date.now()}`;
    savePersistedState();
    broadcastToAll({
      type: 'qris_payment:paid',
      payload: {
        orderId: order.orderId,
        status: 'PAID',
        paidAt: order.paidAt,
        providerReference: order.providerReference,
        order: sanitizeOrderForClient(order),
      },
    });
    res.json({ success: true, status: 'PAID', order: sanitizeOrderForClient(order) });
  });

  app.get('/api/qris/status/:orderId', async (req, res) => {
    const orderId = String(req.params.orderId || '').replace(/[^A-Za-z0-9_-]/g, '');
    const order = serverState.qrisOrders[orderId];
    if (!order) {
      res.status(404).json({ success: false, status: 'EXPIRED', message: 'Pesanan QRIS tidak ditemukan.' });
      return;
    }

    if (order.status === 'PAID' || order.status === 'SUCCESS' || order.status === 'LUNAS') {
      res.json({
        success: true,
        status: 'PAID',
        paidAt: order.paidAt,
        providerReference: order.providerReference,
        configReady: order.configReady,
        order: sanitizeOrderForClient(order),
      });
      return;
    }

    if (order.status === 'MENUNGGU_ADMIN' || order.status === 'DITOLAK') {
      res.json({
        success: true,
        status: order.status,
        configReady: order.configReady,
        order: sanitizeOrderForClient(order),
      });
      return;
    }

    // Check expiry
    if (Date.now() > Date.parse(order.expiresAt)) {
      order.status = 'EXPIRED';
      savePersistedState();
      res.json({
        success: true,
        status: 'EXPIRED',
        configReady: order.configReady,
        order: sanitizeOrderForClient(order),
      });
      return;
    }

    // Query live QRIS gateway API if credentials configured
    if (order.modeUsed === 'api') {
      const liveCheck = await checkBuatQrisStatusServer(order.orderId, order.externalInvoiceId);
      if (liveCheck) {
        if (liveCheck.status === 'PAID' || liveCheck.status === 'SUCCESS') {
          order.status = 'PAID';
          order.paidAt = liveCheck.paidAt || new Date().toISOString();
          order.providerReference = liveCheck.providerReference;
          savePersistedState();
          broadcastToAll({
            type: 'qris_payment:paid',
            payload: {
              orderId: order.orderId,
              status: 'PAID',
              paidAt: order.paidAt,
              order: sanitizeOrderForClient(order),
            },
          });
          res.json({
            success: true,
            status: liveCheck.status,
            paidAt: order.paidAt,
            providerReference: order.providerReference,
            configReady: order.configReady,
            order: sanitizeOrderForClient(order),
          });
          return;
        }
        if (liveCheck.status === 'EXPIRED') {
          order.status = 'EXPIRED';
          savePersistedState();
          res.json({
            success: true,
            status: 'EXPIRED',
            configReady: order.configReady,
            order: sanitizeOrderForClient(order),
          });
          return;
        }
      }
    }

    res.json({
      success: true,
      status: order.status,
      configReady: order.configReady,
      order: sanitizeOrderForClient(order),
    });
  });

  const handleBuatQrisWebhook = (req: express.Request, res: express.Response) => {
    const cfg = getBuatQrisConfig();
    const body = (req.body || {}) as Record<string, unknown>;
    const nestedData =
      body.data && typeof body.data === 'object'
        ? (body.data as Record<string, unknown>)
        : {};
    const payload = { ...body, ...nestedData };

    // Verify webhook signature / secret whenever WEBHOOK_SECRET or SECRET_KEY is configured
    const verificationSecret = cfg.WEBHOOK_SECRET || cfg.SECRET_KEY;
    if (verificationSecret) {
      const authHeader = String(req.headers.authorization || '').trim();
      const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
        ? authHeader.slice(7).trim()
        : '';
      const incomingSig = String(
        req.headers['x-buatqris-signature'] ||
          req.headers['x-signature'] ||
          req.headers['x-webhook-secret'] ||
          req.headers['x-secret-key'] ||
          req.headers['x-callback-token'] ||
          bearerToken ||
          payload.signature ||
          ''
      ).trim();

      const expectedHmac = crypto
        .createHmac('sha256', verificationSecret)
        .update(JSON.stringify(body))
        .digest('hex');

      const sigBuf = Buffer.from(incomingSig);
      const secretBuf = Buffer.from(verificationSecret);
      const hmacBuf = Buffer.from(expectedHmac);

      const matchesDirect =
        sigBuf.length === secretBuf.length && crypto.timingSafeEqual(sigBuf, secretBuf);
      const matchesHmac =
        sigBuf.length === hmacBuf.length && crypto.timingSafeEqual(sigBuf, hmacBuf);

      if (!matchesDirect && !matchesHmac) {
        res.status(401).json({ success: false, message: 'Signature webhook QRIS tidak valid.' });
        return;
      }
    }

    // Optional account_id verification if provided in payload and configured in server Secrets
    const incomingAccountId = String(payload.account_id || payload.merchant_id || '').trim();
    if (cfg.ACCOUNT_ID && incomingAccountId && incomingAccountId !== cfg.ACCOUNT_ID) {
      res.status(403).json({ success: false, message: 'Account ID webhook tidak cocok.' });
      return;
    }

    const candidateRef = String(
      payload.order_id ||
        payload.orderId ||
        payload.reference_id ||
        payload.invoice_id ||
        payload.invoice ||
        payload.reference ||
        payload.qris_invoiceid ||
        ''
    ).trim();
    const rawStatus = String(
      payload.status || payload.payment_status || payload.event || ''
    ).toUpperCase();
    const paidAmount = Math.round(Number(payload.amount || payload.total_amount || 0));

    // Locate matching pending order by orderId, externalInvoiceId, or exact unique totalAmount
    let matchedOrder: ServerQrisOrder | undefined = serverState.qrisOrders[candidateRef];
    if (!matchedOrder && candidateRef) {
      matchedOrder = Object.values(serverState.qrisOrders).find(
        (o) => o.externalInvoiceId === candidateRef
      );
    }
    if (!matchedOrder && paidAmount > 0) {
      matchedOrder = Object.values(serverState.qrisOrders).find(
        (o) =>
          o.status === 'PENDING' &&
          o.totalAmount === paidAmount &&
          Date.now() <= Date.parse(o.expiresAt)
      );
    }

    if (!matchedOrder) {
      res.status(200).json({
        success: true,
        matched: false,
        message: 'Order tidak ditemukan atau sudah diproses.',
      });
      return;
    }

    // Idempotent check
    if (
      matchedOrder.status === 'PAID' ||
      matchedOrder.status === 'SUCCESS' ||
      matchedOrder.status === 'LUNAS'
    ) {
      res.status(200).json({
        success: true,
        matched: true,
        alreadyPaid: true,
        orderId: matchedOrder.orderId,
      });
      return;
    }

    if (
      rawStatus === 'PAID' ||
      rawStatus === 'SUCCESS' ||
      rawStatus === 'SETTLED' ||
      rawStatus === 'LUNAS' ||
      rawStatus === 'PAYMENT.PAID' ||
      rawStatus === 'PAYMENT.SUCCESS'
    ) {
      matchedOrder.status = 'PAID';
      matchedOrder.paidAt = new Date().toISOString();
      matchedOrder.providerReference = String(
        payload.rrn || payload.transaction_id || payload.reference || candidateRef
      );
      savePersistedState();

      broadcastToAll({
        type: 'qris_payment:paid',
        payload: {
          orderId: matchedOrder.orderId,
          status: 'PAID',
          paidAt: matchedOrder.paidAt,
          providerReference: matchedOrder.providerReference,
          order: sanitizeOrderForClient(matchedOrder),
        },
      });
    } else if (
      rawStatus === 'EXPIRED' ||
      rawStatus === 'CANCELLED' ||
      rawStatus === 'FAILED' ||
      rawStatus === 'PAYMENT.EXPIRED'
    ) {
      matchedOrder.status = 'EXPIRED';
      savePersistedState();
    }

    res.status(200).json({
      success: true,
      matched: true,
      orderId: matchedOrder.orderId,
      status: matchedOrder.status,
    });
  };

  // Primary clean QRIS webhook endpoints + silent backward-compatible webhook alias
  app.post('/api/qris/webhook', handleBuatQrisWebhook);
  app.post('/api/buatqris/webhook', handleBuatQrisWebhook);
  app.post('/', handleBuatQrisWebhook);

  // ==================== VISITOR ANALYTICS & ADMIN CARD TIER RBAC ====================
  attachVisitorAnalyticsAndTierRoutes({
    app,
    getServerState: () => serverState,
    savePersistedState,
    broadcastToAll,
  });

  // ==================== VITE MIDDLEWARE / STATIC ASSETS ====================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Bank Nusantara Real-Time Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
