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
} from './buatQrisService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const STATE_FILE = path.join(__dirname, '.bank-global-state.json');
const DB_FILE = path.join(__dirname, '.bank-database.json');
const DB_TEMP_FILE = path.join(__dirname, '.bank-database.json.tmp');

export interface ServerGlobalChatMessage {
  id: string;
  senderName: string;
  senderRole: 'admin' | 'customer';
  senderAccount?: string;
  isVerified?: boolean;
  title: string;
  text: string;
  timestamp: string;
  isPinned?: boolean;
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
  modeUsed: 'api' | 'emvco';
  configReady: boolean;
  configNotice?: string;
  qrisString: string;
  qrisImageUrl?: string;
  status: 'PENDING' | 'PAID' | 'SUCCESS' | 'LUNAS' | 'EXPIRED';
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
  websitePopups: ServerPopupNotification[];
  bugReports: ServerBugReport[];
  pushAlerts: ServerPushAlert[];
  giftEvents: unknown[];
  deletedGiftEventIds: string[];
  giftEventsInitialized: boolean;
  giftEventsUpdatedAtMs: number;
  diamondConfig?: Record<string, unknown> | null;
  uiVisibilityConfig?: Record<string, unknown> | null;
  adminWarnings: Array<Record<string, unknown>>;
  bugRewardConfig?: Record<string, unknown> | null;
  sharedBankData: Record<string, unknown>;
  userSnapshotsByScope: Record<string, Record<string, unknown>>;
  qrisOrders: Record<string, ServerQrisOrder>;
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
      title: 'Pesan dari Admin',
      text: 'Selamat datang di Bank Nusantara! Pesan Chat Global hanya dapat dikirim resmi oleh Admin melalui Panel Admin.',
      timestamp: new Date().toISOString(),
      isPinned: true,
    },
  ],
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
  sharedBankData: {},
  userSnapshotsByScope: {},
  qrisOrders: {},
  pushAlerts: [],
  giftEvents: [],
  deletedGiftEventIds: [],
  giftEventsInitialized: false,
  giftEventsUpdatedAtMs: 0,
  diamondConfig: null,
  uiVisibilityConfig: null,
  adminWarnings: [],
  bugRewardConfig: null,
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
          ? parsed.globalChats.filter((c: ServerGlobalChatMessage) => c.senderRole === 'admin')
          : DEFAULT_STATE.globalChats,
        websitePopups: Array.isArray(parsed.websitePopups) ? parsed.websitePopups : [],
        bugReports: Array.isArray(parsed.bugReports) ? parsed.bugReports : DEFAULT_STATE.bugReports,
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
        sharedBankData: parsed.sharedBankData || {},
        userSnapshotsByScope:
          parsed.userSnapshotsByScope && typeof parsed.userSnapshotsByScope === 'object'
            ? parsed.userSnapshotsByScope
            : {},
        qrisOrders:
          parsed.qrisOrders && typeof parsed.qrisOrders === 'object'
            ? parsed.qrisOrders
            : {},
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
            websitePopups: serverState.websitePopups,
            bugReports: serverState.bugReports,
            pushAlerts: serverState.pushAlerts,
            giftEvents: serverState.giftEvents,
            deletedGiftEventIds: serverState.deletedGiftEventIds,
            giftEventsInitialized: serverState.giftEventsInitialized,
            giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs || 0,
            diamondConfig: serverState.diamondConfig || null,
            uiVisibilityConfig: serverState.uiVisibilityConfig || null,
            adminWarnings: serverState.adminWarnings || [],
            bugRewardConfig: serverState.bugRewardConfig || null,
            sharedBankData: serverState.sharedBankData,
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
        } else if (msg.type === 'website_popup:send' && msg.payload) {
          handleNewPopup(msg.payload);
        } else if (msg.type === 'bug_report:send' && msg.payload) {
          handleNewBugReport(msg.payload);
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
          const rawCfg = msg.payload as Record<string, unknown>;
          serverState.diamondConfig = {
            ...rawCfg,
            baseDiamondPriceRupiah: Math.max(1, Math.round(Number(rawCfg.baseDiamondPriceRupiah) || 90)),
            diamondDiscountPercent: Math.max(0, Math.min(99, Math.round(Number(rawCfg.diamondDiscountPercent) || 0))),
            maxCustomDiamond: Math.max(1, Math.min(11_099, Math.round(Number(rawCfg.maxCustomDiamond) || 11_099))),
            maxPurchaseRupiah: Math.max(1, Math.min(998_910, Math.round(Number(rawCfg.maxPurchaseRupiah) || 998_910))),
            priceRevision: 3,
            updatedAt: new Date().toISOString(),
          };
          savePersistedState();
          broadcastToAll({
            type: 'diamond_config:updated',
            payload: { diamondConfig: serverState.diamondConfig, lastUpdated: serverState.lastUpdated },
          });
        } else if (msg.type === 'ui_visibility:sync' && msg.payload && typeof msg.payload === 'object') {
          serverState.uiVisibilityConfig = {
            ...(msg.payload as Record<string, unknown>),
            updatedAt: new Date().toISOString(),
          };
          savePersistedState();
          broadcastToAll({
            type: 'ui_visibility:updated',
            payload: { uiVisibilityConfig: serverState.uiVisibilityConfig, lastUpdated: serverState.lastUpdated },
          });
        } else if (msg.type === 'admin_warnings:sync' && Array.isArray(msg.payload?.adminWarnings)) {
          serverState.adminWarnings = (msg.payload.adminWarnings as Array<Record<string, unknown>>).slice(0, 100);
          savePersistedState();
          broadcastToAll({
            type: 'admin_warnings:updated',
            payload: { adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated },
          });
        } else if (msg.type === 'bug_reward_config:sync' && msg.payload && typeof msg.payload === 'object') {
          serverState.bugRewardConfig = {
            ...(msg.payload as Record<string, unknown>),
            updatedAt: new Date().toISOString(),
          };
          savePersistedState();
          broadcastToAll({
            type: 'bug_reward_config:updated',
            payload: { bugRewardConfig: serverState.bugRewardConfig, lastUpdated: serverState.lastUpdated },
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

  // Global Chat ONLY allowed from Admin via Panel Admin ("Global chat hanya bisa dikirim oleh admin dan sahabat tidak bisa, hanya admin lewat panel admin")
  function handleNewGlobalChat(input: {
    id?: string;
    senderName?: string;
    senderRole?: 'admin' | 'customer';
    senderAccount?: string;
    isVerified?: boolean;
    title?: string;
    text: string;
    isPinned?: boolean;
    showPopupOnAllPhones?: boolean;
  }) {
    if (input.senderRole === 'customer') {
      return null; // Sahabat / Nasabah tidak bisa mengirim Global Chat, hanya Admin lewat Panel Admin!
    }
    const cleanText = String(input.text || '').trim();
    if (!cleanText) return null;

    const msgId = input.id || `gchat-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const existing = serverState.globalChats.find((m) => m.id === msgId);
    if (existing) return { message: existing, popup: null };

    const newMsg: ServerGlobalChatMessage = {
      id: msgId,
      senderName: input.senderName || 'Admin Bank Nusantara',
      senderRole: 'admin',
      senderAccount: input.senderAccount || '9999999999',
      isVerified: true,
      title: 'Pesan dari Admin',
      text: cleanText,
      timestamp: new Date().toISOString(),
      isPinned: true,
    };

    serverState.globalChats = [newMsg, ...serverState.globalChats].slice(0, 200);

    let createdPopup: ServerPopupNotification | null = null;
    if (input.showPopupOnAllPhones !== false) {
      createdPopup = {
        id: `popup-gchat-${msgId}`,
        type: 'admin_chat',
        title: 'Pesan dari Admin',
        subtitle: 'PESAN RESMI DARI PANEL ADMIN BANK NUSANTARA',
        message: cleanText,
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
      websitePopups: serverState.websitePopups,
      bugReports: serverState.bugReports,
      pushAlerts: serverState.pushAlerts,
      giftEvents: serverState.giftEvents,
      deletedGiftEventIds: serverState.deletedGiftEventIds,
      giftEventsInitialized: serverState.giftEventsInitialized,
      giftEventsUpdatedAtMs: serverState.giftEventsUpdatedAtMs || 0,
      diamondConfig: serverState.diamondConfig || null,
      uiVisibilityConfig: serverState.uiVisibilityConfig || null,
      adminWarnings: serverState.adminWarnings || [],
      bugRewardConfig: serverState.bugRewardConfig || null,
      sharedBankData: serverState.sharedBankData,
      connectedDevices: Math.max(1, clients.size),
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.get('/api/diamond-config', (_req, res) => {
    res.json({
      success: true,
      diamondConfig: serverState.diamondConfig || null,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/diamond-config', (req, res) => {
    const rawCfg = (req.body?.diamondConfig || req.body || {}) as Record<string, unknown>;
    if (!rawCfg || typeof rawCfg !== 'object') {
      res.status(400).json({ success: false, message: 'Konfigurasi tidak valid.' });
      return;
    }
    serverState.diamondConfig = {
      ...rawCfg,
      baseDiamondPriceRupiah: Math.max(1, Math.round(Number(rawCfg.baseDiamondPriceRupiah) || 90)),
      diamondDiscountPercent: Math.max(0, Math.min(99, Math.round(Number(rawCfg.diamondDiscountPercent) || 0))),
      maxCustomDiamond: Math.max(1, Math.min(11_099, Math.round(Number(rawCfg.maxCustomDiamond) || 11_099))),
      maxPurchaseRupiah: Math.max(1, Math.min(998_910, Math.round(Number(rawCfg.maxPurchaseRupiah) || 998_910))),
      priceRevision: 3,
      updatedAt: new Date().toISOString(),
    };
    savePersistedState();
    broadcastToAll({
      type: 'diamond_config:updated',
      payload: { diamondConfig: serverState.diamondConfig, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, diamondConfig: serverState.diamondConfig, lastUpdated: serverState.lastUpdated });
  });

  app.get('/api/ui-visibility', (_req, res) => {
    res.json({
      success: true,
      uiVisibilityConfig: serverState.uiVisibilityConfig || null,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/ui-visibility', (req, res) => {
    const incoming = (req.body?.uiVisibilityConfig || req.body || {}) as Record<string, unknown>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ success: false, message: 'Konfigurasi visibilitas tidak valid.' });
      return;
    }
    serverState.uiVisibilityConfig = {
      ...incoming,
      updatedAt: new Date().toISOString(),
    };
    savePersistedState();
    broadcastToAll({
      type: 'ui_visibility:updated',
      payload: { uiVisibilityConfig: serverState.uiVisibilityConfig, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, uiVisibilityConfig: serverState.uiVisibilityConfig, lastUpdated: serverState.lastUpdated });
  });

  app.get('/api/admin-warnings', (_req, res) => {
    res.json({
      success: true,
      adminWarnings: serverState.adminWarnings || [],
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/admin-warnings', (req, res) => {
    if (Array.isArray(req.body?.adminWarnings)) {
      serverState.adminWarnings = (req.body.adminWarnings as Array<Record<string, unknown>>).slice(0, 100);
    } else if (req.body && typeof req.body === 'object' && req.body.id) {
      const incoming = req.body as Record<string, unknown>;
      const exists = serverState.adminWarnings.some((w) => String(w.id) === String(incoming.id));
      serverState.adminWarnings = exists
        ? serverState.adminWarnings.map((w) => (String(w.id) === String(incoming.id) ? incoming : w))
        : [incoming, ...serverState.adminWarnings].slice(0, 100);
    } else {
      res.status(400).json({ success: false, message: 'Data peringatan admin tidak valid.' });
      return;
    }
    savePersistedState();
    broadcastToAll({
      type: 'admin_warnings:updated',
      payload: { adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated });
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
    savePersistedState();
    broadcastToAll({
      type: 'admin_warnings:updated',
      payload: { adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated });
  });

  app.delete('/api/admin-warnings/:id', (req, res) => {
    const targetId = String(req.params.id || '');
    serverState.adminWarnings = serverState.adminWarnings.filter((w) => String(w.id) !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'admin_warnings:updated',
      payload: { adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, adminWarnings: serverState.adminWarnings, lastUpdated: serverState.lastUpdated });
  });

  app.get('/api/bug-reward-config', (_req, res) => {
    res.json({
      success: true,
      bugRewardConfig: serverState.bugRewardConfig || null,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/bug-reward-config', (req, res) => {
    const incoming = (req.body?.bugRewardConfig || req.body || {}) as Record<string, unknown>;
    if (!incoming || typeof incoming !== 'object') {
      res.status(400).json({ success: false, message: 'Konfigurasi hadiah bug tidak valid.' });
      return;
    }
    serverState.bugRewardConfig = {
      enabled: Boolean(incoming.enabled),
      cashAmount: Math.max(0, Math.floor(Number(incoming.cashAmount) || 0)),
      coinAmount: Math.max(0, Math.floor(Number(incoming.coinAmount) || 0)),
      diamondAmount: Math.max(0, Math.floor(Number(incoming.diamondAmount) || 0)),
      goldGrams: Math.max(0, Math.round((Number(incoming.goldGrams) || 0) * 100) / 100),
      voucherAmount: Math.max(0, Math.floor(Number(incoming.voucherAmount) || 0)),
      pointsAmount: Math.max(0, Math.floor(Number(incoming.pointsAmount) || 0)),
      familySlotAmount: Math.max(0, Math.floor(Number(incoming.familySlotAmount) || 0)),
      defaultRewardMessage: String(incoming.defaultRewardMessage ?? incoming.defaultMessage ?? '').slice(0, 300),
      updatedAt: new Date().toISOString(),
    };
    savePersistedState();
    broadcastToAll({
      type: 'bug_reward_config:updated',
      payload: { bugRewardConfig: serverState.bugRewardConfig, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, bugRewardConfig: serverState.bugRewardConfig, lastUpdated: serverState.lastUpdated });
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
    if (!result) {
      res.status(400).json({
        success: false,
        message: 'Global Chat hanya bisa dikirim oleh Admin melalui Panel Admin!',
      });
      return;
    }
    res.json({
      success: true,
      ...result,
      globalChats: serverState.globalChats,
      websitePopups: serverState.websitePopups,
      connectedDevices: Math.max(1, clients.size),
    });
  });

  app.delete('/api/global-chat/:id', (req, res) => {
    const targetId = req.params.id;
    serverState.globalChats = serverState.globalChats.filter((m) => m.id !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'global_chat:delete',
      payload: { id: targetId, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, globalChats: serverState.globalChats });
  });

  app.post('/api/global-chat/clear', (_req, res) => {
    serverState.globalChats = [];
    savePersistedState();
    broadcastToAll({
      type: 'global_chat:clear',
      payload: { lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, globalChats: [] });
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
    serverState.bugReports = serverState.bugReports.filter((b) => b.id !== targetId);
    savePersistedState();
    broadcastToAll({
      type: 'bug_report:deleted',
      payload: { id: targetId, lastUpdated: serverState.lastUpdated },
    });
    res.json({ success: true, bugReports: serverState.bugReports });
  });

  app.post('/api/bug-reports/clear', (_req, res) => {
    serverState.bugReports = [];
    savePersistedState();
    broadcastToAll({
      type: 'bug_report:clear',
      payload: { lastUpdated: serverState.lastUpdated },
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

  // ==================== QRIS NUSANTARA PAYMENT GATEWAY & WEBHOOK API ====================
  const sanitizeOrderForClient = (order: ServerQrisOrder): Omit<ServerQrisOrder, 'qrisImageUrl' | 'configNotice'> => {
    const { qrisImageUrl: _img, configNotice: _notice, ...safeOrder } = order;
    return safeOrder;
  };

  app.get('/api/qris/config-status', (_req, res) => {
    const cfg = getBuatQrisConfig();
    const hasLoginId = Boolean(cfg.BUATQRIS_LOGIN_ID);
    const hasAccountId = Boolean(cfg.ACCOUNT_ID);
    const hasSecretKey = Boolean(cfg.SECRET_KEY);
    const hasWebhookUrl = Boolean(cfg.WEBHOOK_URL);
    const hasWebhookSecret = Boolean(cfg.WEBHOOK_SECRET);
    const hasStaticQris = Boolean(cfg.STATIC_QRIS_STRING);
    const activeMode: 'api' | 'emvco' = hasSecretKey && hasAccountId ? 'api' : 'emvco';
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
      activeMode,
      activeEngine: activeMode,
    });
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
      const HARD_MAX_DIAMONDS = 11_099;
      const HARD_MAX_RUPIAH = 998_910;
      const activeDiamondCfg = (serverState.diamondConfig ||
        (serverState.sharedBankData?.diamondConfig as Record<string, unknown> | undefined) ||
        {}) as Record<string, unknown>;
      const unitBase = Math.max(1, Math.round(Number(activeDiamondCfg.baseDiamondPriceRupiah) || 90));
      const discPct = Math.max(0, Math.min(99, Math.round(Number(activeDiamondCfg.diamondDiscountPercent) || 0)));
      const maxDiamondsAllowed = Math.max(
        1,
        Math.min(HARD_MAX_DIAMONDS, Math.round(Number(activeDiamondCfg.maxCustomDiamond) || HARD_MAX_DIAMONDS))
      );
      const maxRupiahAllowed = Math.max(
        1,
        Math.min(HARD_MAX_RUPIAH, Math.round(Number(activeDiamondCfg.maxPurchaseRupiah) || HARD_MAX_RUPIAH))
      );

      if (!diamondAmount || diamondAmount < 1 || diamondAmount > maxDiamondsAllowed) {
        res.status(400).json({
          success: false,
          message: `Jumlah pembelian dibatasi 1 hingga maksimal ${maxDiamondsAllowed.toLocaleString('id-ID')} per transaksi.`,
        });
        return;
      }

      if (amount > maxRupiahAllowed) {
        res.status(400).json({
          success: false,
          message: `Harga dasar transaksi tidak boleh melebihi Rp ${maxRupiahAllowed.toLocaleString('id-ID')} (sebelum angka unik QRIS).`,
        });
        return;
      }

      const rawUnitDiscounted = unitBase * (1 - discPct / 100);
      const minExpectedPrice = Math.max(1, Math.round(diamondAmount * rawUnitDiscounted));
      if (amount < minExpectedPrice) {
        res.status(400).json({
          success: false,
          message: `Nominal pembayaran Rp ${amount.toLocaleString('id-ID')} di bawah tarif aktif minimum Rp ${minExpectedPrice.toLocaleString('id-ID')}.`,
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
        status: 'PENDING',
        customerName: typeof body.customerName === 'string' ? body.customerName.slice(0, 80) : undefined,
        description: typeof body.description === 'string' ? body.description.slice(0, 140) : undefined,
        createdAt: created.createdAt,
        expiresAt: created.expiresAt,
      };

      serverState.qrisOrders[orderRecord.orderId] = orderRecord;
      // Cap persisted qris orders to most recent 250 entries
      const orderKeys = Object.keys(serverState.qrisOrders);
      if (orderKeys.length > 250) {
        const sorted = Object.values(serverState.qrisOrders).sort(
          (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
        );
        serverState.qrisOrders = Object.fromEntries(sorted.slice(0, 250).map((o) => [o.orderId, o]));
      }
      savePersistedState();

      const { qrisImageUrl: _unusedImg, configNotice: _unusedNotice, ...clientSafeCreated } = created;
      res.json(clientSafeCreated);
    } catch (err) {
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat membuat tagihan QRIS Nusantara.',
        error: String(err),
      });
    }
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
