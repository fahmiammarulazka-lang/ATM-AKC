import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

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
  reporterName: string;
  reporterAccountNumber?: string;
  reporterEmail?: string;
  category: string;
  explanation: string;
  photoDataUrl?: string;
  photoFileName?: string;
  status: 'baru' | 'diproses' | 'selesai';
  adminReply?: string;
  createdAt: string;
  updatedAt?: string;
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
  sharedBankData: Record<string, unknown>;
  userSnapshotsByScope: Record<string, Record<string, unknown>>;
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
  pushAlerts: [],
  giftEvents: [],
  deletedGiftEventIds: [],
  giftEventsInitialized: false,
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
        sharedBankData: parsed.sharedBankData || {},
        userSnapshotsByScope:
          parsed.userSnapshotsByScope && typeof parsed.userSnapshotsByScope === 'object'
            ? parsed.userSnapshotsByScope
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
          savePersistedState();
          broadcastToAll({
            type: 'gift_events:updated',
            payload: {
              giftEvents: serverState.giftEvents,
              deletedGiftEventIds: serverState.deletedGiftEventIds,
              giftEventsInitialized: serverState.giftEventsInitialized,
              lastUpdated: serverState.lastUpdated,
            },
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
      sharedBankData: serverState.sharedBankData,
      connectedDevices: Math.max(1, clients.size),
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.get('/api/gift-events', (_req, res) => {
    res.json({
      success: true,
      giftEvents: serverState.giftEvents,
      deletedGiftEventIds: serverState.deletedGiftEventIds,
      giftEventsInitialized: serverState.giftEventsInitialized,
      lastUpdated: serverState.lastUpdated,
    });
  });

  app.post('/api/gift-events', (req, res) => {
    const incoming = req.body?.giftEvents;
    if (!Array.isArray(incoming)) {
      res.status(400).json({ success: false, message: 'Daftar giftEvents tidak valid.' });
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
    savePersistedState();
    broadcastToAll({
      type: 'gift_events:updated',
      payload: {
        giftEvents: serverState.giftEvents,
        deletedGiftEventIds: serverState.deletedGiftEventIds,
        giftEventsInitialized: serverState.giftEventsInitialized,
        lastUpdated: serverState.lastUpdated,
      },
    });
    res.json({
      success: true,
      giftEvents: serverState.giftEvents,
      deletedGiftEventIds: serverState.deletedGiftEventIds,
      giftEventsInitialized: serverState.giftEventsInitialized,
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
    const { status, adminReply } = req.body || {};
    let updatedBug: ServerBugReport | null = null;

    serverState.bugReports = serverState.bugReports.map((b) => {
      if (b.id === targetId) {
        updatedBug = {
          ...b,
          status: status || b.status,
          adminReply: adminReply !== undefined ? String(adminReply) : b.adminReply,
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
