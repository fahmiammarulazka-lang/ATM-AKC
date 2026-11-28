import jsQR from 'jsqr';
import { BankAccount, TransferBebasAssetMode } from '../types/bank';

export const PENDING_QRIS_TRANSFER_STORAGE_KEY = 'bn_pending_qris_transfer_v1';
export const PENDING_QRIS_TRANSFER_TTL_MS = 30 * 60 * 1000; // 30 menit

export const PENDING_QRP_PROFILE_STORAGE_KEY = 'bn_pending_qrp_profile_v1';
export const PENDING_QRP_PROFILE_TTL_MS = 30 * 60 * 1000; // 30 menit

export type PersonalQrisSubMode = 'tf' | 'minta';

export const PERSONAL_QRIS_POLICY_STORAGE_KEY = 'bn_personal_qris_policy_v1';

export interface PersonalQrisAdminPolicy {
  enableQrisTf: boolean;
  enableQrisMinta: boolean;
  enforceQrisMintaLock: boolean;
}

export function readPersonalQrisAdminPolicy(): PersonalQrisAdminPolicy {
  if (typeof window === 'undefined') {
    return {
      enableQrisTf: true,
      enableQrisMinta: true,
      enforceQrisMintaLock: true,
    };
  }
  try {
    const raw = window.localStorage.getItem(PERSONAL_QRIS_POLICY_STORAGE_KEY);
    if (!raw) {
      return {
        enableQrisTf: true,
        enableQrisMinta: true,
        enforceQrisMintaLock: true,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersonalQrisAdminPolicy>;
    return {
      enableQrisTf: parsed.enableQrisTf !== false,
      enableQrisMinta: parsed.enableQrisMinta !== false,
      enforceQrisMintaLock: parsed.enforceQrisMintaLock !== false,
    };
  } catch {
    return {
      enableQrisTf: true,
      enableQrisMinta: true,
      enforceQrisMintaLock: true,
    };
  }
}

export function savePersonalQrisAdminPolicy(
  policy: Partial<PersonalQrisAdminPolicy>
): PersonalQrisAdminPolicy {
  const current = readPersonalQrisAdminPolicy();
  const next: PersonalQrisAdminPolicy = {
    enableQrisTf: policy.enableQrisTf !== undefined ? Boolean(policy.enableQrisTf) : current.enableQrisTf,
    enableQrisMinta:
      policy.enableQrisMinta !== undefined ? Boolean(policy.enableQrisMinta) : current.enableQrisMinta,
    enforceQrisMintaLock:
      policy.enforceQrisMintaLock !== undefined
        ? Boolean(policy.enforceQrisMintaLock)
        : current.enforceQrisMintaLock,
  };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(PERSONAL_QRIS_POLICY_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('bn:personal-qris-policy-updated', { detail: next }));
    } catch {
      // ignore
    }
  }
  return next;
}

export interface PendingQrisTransferPayload {
  recipientAccount: string;
  recipientUserId?: string;
  recipientBank: string;
  recipientName?: string;
  qrisSubMode?: PersonalQrisSubMode;
  lockAmountAndAsset?: boolean;
  expiresAtMs?: number;
  assetMode?: TransferBebasAssetMode;
  amount?: number;
  goldRupiahAmount?: number;
  coinAmount?: number;
  diamondAmount?: number;
  tokenAmount?: number;
  note?: string;
  source: 'url' | 'camera' | 'gallery' | 'manual';
  createdAtMs: number;
}

export interface ParsedPersonalQrisTarget {
  recipientAccount: string;
  recipientUserId?: string;
  recipientBank: string;
  recipientName?: string;
  qrisSubMode: PersonalQrisSubMode;
  lockAmountAndAsset: boolean;
  expiresAtMs?: number;
  isExpired?: boolean;
  assetMode: TransferBebasAssetMode;
  hasExplicitAssetRequest: boolean;
  amount: number;
  goldRupiahAmount: number;
  coinAmount: number;
  diamondAmount: number;
  tokenAmount: number;
  note: string;
  sourceKind: 'url' | 'legacy' | 'raw' | 'empty';
}

export interface ParsedQrpProfileTarget {
  targetAccount: string;
  targetUserId?: string;
  targetName?: string;
  sourceKind: 'url' | 'legacy' | 'raw' | 'empty';
}

export interface PendingQrpProfilePayload {
  targetAccount: string;
  targetUserId?: string;
  targetName?: string;
  source: 'url' | 'camera' | 'gallery' | 'manual';
  createdAtMs: number;
}

export interface ClassifiedScannedQrPayload {
  kind:
    | 'qrp_profile'
    | 'qris_transfer'
    | 'qris_diamond_merchant'
    | 'account_or_uid'
    | 'unknown';
  rawText: string;
  qrpTarget?: ParsedQrpProfileTarget;
  transferTarget?: ParsedPersonalQrisTarget;
  emvcoMerchant?: {
    merchantName: string;
    amountRupiah: number;
    rawQrisString: string;
  };
}

export function normalizeNumericIdentifier(value?: string | null): string {
  return String(value || '').replace(/\D/g, '');
}

const VALID_ASSET_MODES: TransferBebasAssetMode[] = [
  'uang',
  'emas',
  'coin',
  'permata',
  'token',
  'gabungan',
];

export function parseAssetModeParam(raw?: string | null): TransferBebasAssetMode {
  const clean = String(raw || '').trim().toLowerCase();
  if (VALID_ASSET_MODES.includes(clean as TransferBebasAssetMode)) {
    return clean as TransferBebasAssetMode;
  }
  if (clean === 'gold') return 'emas';
  if (clean === 'diamond' || clean === 'diamonds') return 'permata';
  if (clean === 'bundle' || clean === 'multi') return 'gabungan';
  return 'uang';
}

export function parseQrisSubModeParam(
  rawMode?: string | null,
  rawLock?: string | null
): PersonalQrisSubMode {
  const clean = String(rawMode || '').trim().toLowerCase();
  if (clean === 'minta' || clean === 'request' || clean === 'req') return 'minta';
  if (clean === 'tf' || clean === 'transfer') return 'tf';
  if (String(rawLock || '').trim() === '1') return 'minta';
  return 'tf';
}

export function formatMultiAssetSummaryLabel(target: {
  assetMode?: TransferBebasAssetMode;
  amount?: number;
  goldRupiahAmount?: number;
  coinAmount?: number;
  diamondAmount?: number;
  tokenAmount?: number;
}): string {
  const parts: string[] = [];
  const mode = target.assetMode || 'uang';
  const amt = Math.max(0, Math.round(Number(target.amount) || 0));
  const goldRp = Math.max(0, Math.round(Number(target.goldRupiahAmount) || 0));
  const coin = Math.max(0, Math.round(Number(target.coinAmount) || 0));
  const dia = Math.max(0, Math.round(Number(target.diamondAmount) || 0));
  const tok = Math.max(0, Math.round(Number(target.tokenAmount) || 0));

  if ((mode === 'uang' || mode === 'gabungan') && amt > 0) {
    parts.push(`Rp ${amt.toLocaleString('id-ID')}`);
  }
  if ((mode === 'emas' || mode === 'gabungan') && goldRp > 0) {
    parts.push(`Emas Rp ${goldRp.toLocaleString('id-ID')}`);
  }
  if ((mode === 'coin' || mode === 'gabungan') && coin > 0) {
    parts.push(`${coin.toLocaleString('id-ID')} Coin Spin`);
  }
  if ((mode === 'permata' || mode === 'gabungan') && dia > 0) {
    parts.push(`${dia.toLocaleString('id-ID')} Permata`);
  }
  if ((mode === 'token' || mode === 'gabungan') && tok > 0) {
    parts.push(`${tok.toLocaleString('id-ID')} Token Bingkai`);
  }

  if (parts.length > 0) return parts.join(' + ');
  if (mode === 'emas') return 'Emas 24K (Nominal Bebas)';
  if (mode === 'coin') return 'Coin Spin (Jumlah Bebas)';
  if (mode === 'permata') return 'Permata / Diamond (Jumlah Bebas)';
  if (mode === 'token') return 'Token Spin Bingkai (Jumlah Bebas)';
  if (mode === 'gabungan') return 'Paket Gabungan Multi-Aset';
  return 'Saldo Rupiah / Multi-Aset Bebas';
}

export function parsePersonalQrisPayload(rawInput: string): ParsedPersonalQrisTarget {
  const trimmed = String(rawInput || '').trim();
  const emptyResult: ParsedPersonalQrisTarget = {
    recipientAccount: '',
    recipientBank: 'Bank Nusantara',
    qrisSubMode: 'tf',
    lockAmountAndAsset: false,
    assetMode: 'uang',
    hasExplicitAssetRequest: false,
    amount: 0,
    goldRupiahAmount: 0,
    coinAmount: 0,
    diamondAmount: 0,
    tokenAmount: 0,
    note: '',
    sourceKind: 'empty',
  };
  if (!trimmed) return emptyResult;

  // Jangan salah baca link QRP sebagai link QRIS Transfer
  if (trimmed.includes('qrp_profile=1') || trimmed.startsWith('BNUS-QRP|')) {
    return emptyResult;
  }

  // 1. Parse URL deep-link (?qris_transfer=1&qris_mode=tf|minta&lock=0|1&exp=...&to=...&uid=...&asset=...&amt=...&gold_rp=...&coin=...&diamond=...&token=...&name=...&bank=...&note=...)
  if (
    trimmed.includes('qris_transfer=') ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/?') ||
    trimmed.startsWith('?')
  ) {
    try {
      const urlObj =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? new URL(trimmed)
          : new URL(
              trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
              'https://banknusantara.app'
            );
      const sp = urlObj.searchParams;
      if (sp.get('qrp_profile') === '1') {
        return emptyResult;
      }
      const to = (sp.get('to') || sp.get('acc') || sp.get('uid') || '').trim();
      const uid = (sp.get('uid') || '').trim() || undefined;
      const bank = (sp.get('bank') || 'Bank Nusantara').trim() || 'Bank Nusantara';
      const name = (sp.get('name') || '').trim() || undefined;
      const rawAsset = sp.get('asset');
      const assetMode = parseAssetModeParam(rawAsset);
      const amt = Math.max(0, Math.round(Number(sp.get('amt') || sp.get('amount') || '0') || 0));
      const goldRp = Math.max(0, Math.round(Number(sp.get('gold_rp') || '0') || 0));
      const coin = Math.max(0, Math.round(Number(sp.get('coin') || '0') || 0));
      const diamond = Math.max(0, Math.round(Number(sp.get('diamond') || '0') || 0));
      const token = Math.max(0, Math.round(Number(sp.get('token') || '0') || 0));
      const note = (sp.get('note') || '').trim();
      const hasAnyAmount = amt > 0 || goldRp > 0 || coin > 0 || diamond > 0 || token > 0;
      const rawMode = sp.get('qris_mode') || sp.get('mode');
      const rawLock = sp.get('lock');
      const qrisSubMode: PersonalQrisSubMode = rawMode
        ? parseQrisSubModeParam(rawMode, rawLock)
        : rawLock === '1'
        ? 'minta'
        : 'tf';
      const lockAmountAndAsset =
        qrisSubMode === 'minta' && (rawLock !== '0' || hasAnyAmount);
      const expRaw = Number(sp.get('exp') || '0');
      const expiresAtMs = Number.isFinite(expRaw) && expRaw > 0 ? Math.round(expRaw) : undefined;
      const isExpired = Boolean(expiresAtMs && Date.now() > expiresAtMs);
      if (to) {
        return {
          recipientAccount: to,
          recipientUserId: uid,
          recipientBank: bank,
          recipientName: name,
          qrisSubMode,
          lockAmountAndAsset,
          expiresAtMs,
          isExpired,
          assetMode,
          hasExplicitAssetRequest: Boolean(rawAsset || hasAnyAmount),
          amount: amt,
          goldRupiahAmount: goldRp,
          coinAmount: coin,
          diamondAmount: diamond,
          tokenAmount: token,
          note,
          sourceKind: 'url',
        };
      }
    } catch {
      // fallback below
    }
  }

  // 2. Parse legacy BNUS-QRPAY|... format
  if (trimmed.startsWith('BNUS-QRPAY|')) {
    const parts = trimmed.split('|');
    const acc = (parts[1] || '').trim();
    const uid = (parts[2] || '').trim() || undefined;
    const amt = Math.max(0, Math.round(Number(parts[3] || '0') || 0));
    const note = (parts[4] || '').trim();
    if (acc) {
      return {
        recipientAccount: acc,
        recipientUserId: uid,
        recipientBank: 'Bank Nusantara',
        qrisSubMode: amt > 0 ? 'minta' : 'tf',
        lockAmountAndAsset: amt > 0,
        assetMode: 'uang',
        hasExplicitAssetRequest: amt > 0,
        amount: amt,
        goldRupiahAmount: 0,
        coinAmount: 0,
        diamondAmount: 0,
        tokenAmount: 0,
        note,
        sourceKind: 'legacy',
      };
    }
  }

  // 3. Fallback: raw account number (10-digit) or User ID (16-digit)
  const digits = normalizeNumericIdentifier(trimmed);
  if (digits.length >= 8 && digits.length <= 20 && !trimmed.startsWith('000201')) {
    return {
      recipientAccount: digits,
      recipientUserId: digits.length === 16 ? digits : undefined,
      recipientBank: 'Bank Nusantara',
      qrisSubMode: 'tf',
      lockAmountAndAsset: false,
      assetMode: 'uang',
      hasExplicitAssetRequest: false,
      amount: 0,
      goldRupiahAmount: 0,
      coinAmount: 0,
      diamondAmount: 0,
      tokenAmount: 0,
      note: '',
      sourceKind: 'raw',
    };
  }

  return emptyResult;
}

export function parseQrpProfilePayload(rawInput: string): ParsedQrpProfileTarget {
  const trimmed = String(rawInput || '').trim();
  const emptyResult: ParsedQrpProfileTarget = {
    targetAccount: '',
    sourceKind: 'empty',
  };
  if (!trimmed) return emptyResult;

  if (trimmed.includes('qris_transfer=1') || trimmed.startsWith('BNUS-QRPAY|')) {
    return emptyResult;
  }

  // 1. URL format ?qrp_profile=1&acc=...&uid=...&name=...
  if (
    trimmed.includes('qrp_profile=') ||
    /^https?:\/\//i.test(trimmed) ||
    trimmed.startsWith('/?') ||
    trimmed.startsWith('?')
  ) {
    try {
      const urlObj =
        trimmed.startsWith('http://') || trimmed.startsWith('https://')
          ? new URL(trimmed)
          : new URL(
              trimmed.startsWith('/') ? trimmed : `/${trimmed}`,
              'https://banknusantara.app'
            );
      const sp = urlObj.searchParams;
      if (sp.get('qris_transfer') === '1') {
        return emptyResult;
      }
      const isQrp = sp.get('qrp_profile') === '1';
      const acc = (sp.get('acc') || sp.get('to') || sp.get('uid') || '').trim();
      const uid = (sp.get('uid') || '').trim() || undefined;
      const name = (sp.get('name') || '').trim() || undefined;
      if (isQrp && (acc || uid)) {
        return {
          targetAccount: acc || uid || '',
          targetUserId: uid,
          targetName: name,
          sourceKind: 'url',
        };
      }
    } catch {
      // fallback
    }
  }

  // 2. Legacy BNUS-QRP|ACC|UID|NAME
  if (trimmed.startsWith('BNUS-QRP|')) {
    const parts = trimmed.split('|');
    const acc = (parts[1] || '').trim();
    const uid = (parts[2] || '').trim() || undefined;
    const name = (parts[3] || '').trim() || undefined;
    if (acc || uid) {
      return {
        targetAccount: acc || uid || '',
        targetUserId: uid,
        targetName: name,
        sourceKind: 'legacy',
      };
    }
  }

  // 3. Raw 8-16 digit account / User ID
  const digits = normalizeNumericIdentifier(trimmed);
  if (digits.length >= 8 && digits.length <= 20 && !trimmed.startsWith('000201')) {
    return {
      targetAccount: digits,
      targetUserId: digits.length === 16 ? digits : undefined,
      sourceKind: 'raw',
    };
  }

  return emptyResult;
}

function parseEmvcoMerchantQrisSummary(raw: string): {
  merchantName: string;
  amountRupiah: number;
  rawQrisString: string;
} | null {
  const clean = String(raw || '').trim();
  if (!clean.startsWith('000201') && !clean.includes('ID.CO.QRIS.WWW')) {
    return null;
  }
  let cursor = 0;
  let merchantName = 'Merchant QRIS Nusantara (buatqris.site)';
  let amountRupiah = 0;
  while (cursor + 4 <= clean.length) {
    const tag = clean.slice(cursor, cursor + 2);
    const len = Number.parseInt(clean.slice(cursor + 2, cursor + 4), 10);
    if (!Number.isFinite(len) || len < 0 || cursor + 4 + len > clean.length) break;
    const val = clean.slice(cursor + 4, cursor + 4 + len);
    if (tag === '59' && val.trim()) {
      merchantName = val.trim();
    } else if (tag === '54') {
      const parsedAmt = Math.round(Number(val) || 0);
      if (parsedAmt > 0) amountRupiah = parsedAmt;
    }
    cursor += 4 + len;
    if (tag === '63') break;
  }
  return {
    merchantName,
    amountRupiah,
    rawQrisString: clean,
  };
}

export function classifyScannedQrPayload(rawInput: string): ClassifiedScannedQrPayload {
  const trimmed = String(rawInput || '').trim();
  if (!trimmed) {
    return { kind: 'unknown', rawText: '' };
  }

  // 1. Explicit QRP (QR Profil)
  if (trimmed.includes('qrp_profile=1') || trimmed.startsWith('BNUS-QRP|')) {
    const qrpTarget = parseQrpProfilePayload(trimmed);
    if (qrpTarget.targetAccount) {
      return {
        kind: 'qrp_profile',
        rawText: trimmed,
        qrpTarget,
      };
    }
  }

  // 2. Explicit QRIS Pribadi Transfer
  if (trimmed.includes('qris_transfer=1') || trimmed.startsWith('BNUS-QRPAY|')) {
    const transferTarget = parsePersonalQrisPayload(trimmed);
    if (transferTarget.recipientAccount) {
      return {
        kind: 'qris_transfer',
        rawText: trimmed,
        transferTarget,
      };
    }
  }

  // 3. EMVCo QRIS Top-Up Permata / Merchant buatqris.site
  const emvco = parseEmvcoMerchantQrisSummary(trimmed);
  if (emvco) {
    return {
      kind: 'qris_diamond_merchant',
      rawText: trimmed,
      emvcoMerchant: emvco,
    };
  }

  // 4. Generic Account Number (10 digits) or User ID (16 digits)
  const qrpTarget = parseQrpProfilePayload(trimmed);
  const transferTarget = parsePersonalQrisPayload(trimmed);
  if (qrpTarget.targetAccount && transferTarget.recipientAccount) {
    return {
      kind: 'account_or_uid',
      rawText: trimmed,
      qrpTarget,
      transferTarget,
    };
  }

  return { kind: 'unknown', rawText: trimmed };
}

export function savePendingQrisTransfer(
  payload: Omit<PendingQrisTransferPayload, 'createdAtMs'> & { createdAtMs?: number }
): PendingQrisTransferPayload | null {
  const cleanAcc = String(payload.recipientAccount || '').trim();
  if (!cleanAcc) return null;
  const subMode: PersonalQrisSubMode = payload.qrisSubMode === 'minta' ? 'minta' : 'tf';
  const full: PendingQrisTransferPayload = {
    recipientAccount: cleanAcc,
    recipientUserId: payload.recipientUserId?.trim() || undefined,
    recipientBank: String(payload.recipientBank || 'Bank Nusantara').trim() || 'Bank Nusantara',
    recipientName: payload.recipientName?.trim() || undefined,
    qrisSubMode: subMode,
    lockAmountAndAsset:
      payload.lockAmountAndAsset !== undefined
        ? Boolean(payload.lockAmountAndAsset)
        : subMode === 'minta',
    expiresAtMs:
      payload.expiresAtMs && Number(payload.expiresAtMs) > 0
        ? Math.round(Number(payload.expiresAtMs))
        : undefined,
    assetMode: payload.assetMode || 'uang',
    amount:
      payload.amount && Number(payload.amount) > 0 ? Math.round(Number(payload.amount)) : undefined,
    goldRupiahAmount:
      payload.goldRupiahAmount && Number(payload.goldRupiahAmount) > 0
        ? Math.round(Number(payload.goldRupiahAmount))
        : undefined,
    coinAmount:
      payload.coinAmount && Number(payload.coinAmount) > 0
        ? Math.round(Number(payload.coinAmount))
        : undefined,
    diamondAmount:
      payload.diamondAmount && Number(payload.diamondAmount) > 0
        ? Math.round(Number(payload.diamondAmount))
        : undefined,
    tokenAmount:
      payload.tokenAmount && Number(payload.tokenAmount) > 0
        ? Math.round(Number(payload.tokenAmount))
        : undefined,
    note: payload.note?.trim() || undefined,
    source: payload.source || 'url',
    createdAtMs: payload.createdAtMs || Date.now(),
  };
  try {
    window.sessionStorage.setItem(PENDING_QRIS_TRANSFER_STORAGE_KEY, JSON.stringify(full));
  } catch {
    // ignore storage quota/privacy mode errors
  }
  return full;
}

export function readPendingQrisTransfer(): PendingQrisTransferPayload | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingQrisTransferPayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.recipientAccount) {
      window.sessionStorage.removeItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
      return null;
    }
    const created = Number(parsed.createdAtMs || 0);
    if (created > 0 && Date.now() - created > PENDING_QRIS_TRANSFER_TTL_MS) {
      window.sessionStorage.removeItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
      return null;
    }
    const subMode: PersonalQrisSubMode = parsed.qrisSubMode === 'minta' ? 'minta' : 'tf';
    return {
      recipientAccount: String(parsed.recipientAccount).trim(),
      recipientUserId: parsed.recipientUserId ? String(parsed.recipientUserId).trim() : undefined,
      recipientBank: String(parsed.recipientBank || 'Bank Nusantara').trim() || 'Bank Nusantara',
      recipientName: parsed.recipientName ? String(parsed.recipientName).trim() : undefined,
      qrisSubMode: subMode,
      lockAmountAndAsset:
        parsed.lockAmountAndAsset !== undefined
          ? Boolean(parsed.lockAmountAndAsset)
          : subMode === 'minta',
      expiresAtMs:
        parsed.expiresAtMs && Number(parsed.expiresAtMs) > 0
          ? Math.round(Number(parsed.expiresAtMs))
          : undefined,
      assetMode: parsed.assetMode ? parseAssetModeParam(parsed.assetMode) : 'uang',
      amount:
        parsed.amount && Number(parsed.amount) > 0 ? Math.round(Number(parsed.amount)) : undefined,
      goldRupiahAmount:
        parsed.goldRupiahAmount && Number(parsed.goldRupiahAmount) > 0
          ? Math.round(Number(parsed.goldRupiahAmount))
          : undefined,
      coinAmount:
        parsed.coinAmount && Number(parsed.coinAmount) > 0
          ? Math.round(Number(parsed.coinAmount))
          : undefined,
      diamondAmount:
        parsed.diamondAmount && Number(parsed.diamondAmount) > 0
          ? Math.round(Number(parsed.diamondAmount))
          : undefined,
      tokenAmount:
        parsed.tokenAmount && Number(parsed.tokenAmount) > 0
          ? Math.round(Number(parsed.tokenAmount))
          : undefined,
      note: parsed.note ? String(parsed.note).trim() : undefined,
      source: (parsed.source as PendingQrisTransferPayload['source']) || 'url',
      createdAtMs: created || Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPendingQrisTransfer(): void {
  try {
    window.sessionStorage.removeItem(PENDING_QRIS_TRANSFER_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function savePendingQrpProfile(
  payload: Omit<PendingQrpProfilePayload, 'createdAtMs'> & { createdAtMs?: number }
): PendingQrpProfilePayload | null {
  const cleanAcc = String(payload.targetAccount || '').trim();
  if (!cleanAcc) return null;
  const full: PendingQrpProfilePayload = {
    targetAccount: cleanAcc,
    targetUserId: payload.targetUserId?.trim() || undefined,
    targetName: payload.targetName?.trim() || undefined,
    source: payload.source || 'url',
    createdAtMs: payload.createdAtMs || Date.now(),
  };
  try {
    window.sessionStorage.setItem(PENDING_QRP_PROFILE_STORAGE_KEY, JSON.stringify(full));
  } catch {
    // ignore
  }
  return full;
}

export function readPendingQrpProfile(): PendingQrpProfilePayload | null {
  try {
    const raw = window.sessionStorage.getItem(PENDING_QRP_PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingQrpProfilePayload>;
    if (!parsed || typeof parsed !== 'object' || !parsed.targetAccount) {
      window.sessionStorage.removeItem(PENDING_QRP_PROFILE_STORAGE_KEY);
      return null;
    }
    const created = Number(parsed.createdAtMs || 0);
    if (created > 0 && Date.now() - created > PENDING_QRP_PROFILE_TTL_MS) {
      window.sessionStorage.removeItem(PENDING_QRP_PROFILE_STORAGE_KEY);
      return null;
    }
    return {
      targetAccount: String(parsed.targetAccount).trim(),
      targetUserId: parsed.targetUserId ? String(parsed.targetUserId).trim() : undefined,
      targetName: parsed.targetName ? String(parsed.targetName).trim() : undefined,
      source: (parsed.source as PendingQrpProfilePayload['source']) || 'url',
      createdAtMs: created || Date.now(),
    };
  } catch {
    return null;
  }
}

export function clearPendingQrpProfile(): void {
  try {
    window.sessionStorage.removeItem(PENDING_QRP_PROFILE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * Tangkap parameter URL `?qrp_profile=1&acc=...&uid=...` sejak awal boot halaman
 * (misal saat pengguna memindai QRP melalui Google Lens lalu mengetuk tautan).
 */
export function capturePendingQrpFromCurrentUrl(): PendingQrpProfilePayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const isQrp = params.get('qrp_profile') === '1';
    const qAcc = (params.get('acc') || params.get('to') || params.get('uid') || '').trim();
    if (!isQrp || !qAcc) return null;

    const qUid = (params.get('uid') || '').trim() || undefined;
    const qName = (params.get('name') || '').trim() || undefined;

    const saved = savePendingQrpProfile({
      targetAccount: qAcc,
      targetUserId: qUid,
      targetName: qName,
      source: 'url',
    });

    try {
      const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, '', cleanUrl);
    } catch {
      // ignore
    }

    return saved;
  } catch {
    return null;
  }
}

/**
 * Tangkap parameter URL `?qris_transfer=1&to=...` sejak awal boot halaman,
 * simpan persisten ke sessionStorage terlebih dahulu baru bersihkan URL query
 * agar 100% kebal terhadap redirect Firebase Auth, verifikasi PIN, maupun reload!
 */
export function capturePendingQrisFromCurrentUrl(): PendingQrisTransferPayload | null {
  if (typeof window === 'undefined') return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const isQrisTransfer = params.get('qris_transfer') === '1';
    const qTo = (params.get('to') || params.get('acc') || params.get('uid') || '').trim();
    if (!isQrisTransfer || !qTo) return null;

    const qUid = (params.get('uid') || '').trim() || undefined;
    const qAsset = parseAssetModeParam(params.get('asset'));
    const qAmt = Math.max(0, Math.round(Number(params.get('amt') || params.get('amount') || '0') || 0));
    const qGoldRp = Math.max(0, Math.round(Number(params.get('gold_rp') || '0') || 0));
    const qCoin = Math.max(0, Math.round(Number(params.get('coin') || '0') || 0));
    const qDiamond = Math.max(0, Math.round(Number(params.get('diamond') || '0') || 0));
    const qToken = Math.max(0, Math.round(Number(params.get('token') || '0') || 0));
    const qName = (params.get('name') || '').trim() || undefined;
    const qBank = (params.get('bank') || 'Bank Nusantara').trim() || 'Bank Nusantara';
    const qNote = (params.get('note') || '').trim() || undefined;
    const qSubMode = parseQrisSubModeParam(params.get('qris_mode') || params.get('mode'), params.get('lock'));
    const hasAnyAmt = qAmt > 0 || qGoldRp > 0 || qCoin > 0 || qDiamond > 0 || qToken > 0;
    const qLock = qSubMode === 'minta' && (params.get('lock') !== '0' || hasAnyAmt);
    const qExpRaw = Number(params.get('exp') || '0');
    const qExp = Number.isFinite(qExpRaw) && qExpRaw > 0 ? Math.round(qExpRaw) : undefined;
    const defaultNotePrefix = qSubMode === 'minta' ? '[QRIS MINTA]' : '[QRIS TF]';

    const saved = savePendingQrisTransfer({
      recipientAccount: qTo,
      recipientUserId: qUid,
      recipientBank: qBank,
      recipientName: qName,
      qrisSubMode: qSubMode,
      lockAmountAndAsset: qLock,
      expiresAtMs: qExp,
      assetMode: qAsset,
      amount: qAmt > 0 ? qAmt : undefined,
      goldRupiahAmount: qGoldRp > 0 ? qGoldRp : undefined,
      coinAmount: qCoin > 0 ? qCoin : undefined,
      diamondAmount: qDiamond > 0 ? qDiamond : undefined,
      tokenAmount: qToken > 0 ? qToken : undefined,
      note: qNote ? `${defaultNotePrefix} ${qNote}` : `${defaultNotePrefix} Transfer via Scan QRIS Pribadi`,
      source: 'url',
    });

    try {
      const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
      window.history.replaceState({}, '', cleanUrl);
    } catch {
      // ignore history API restriction
    }

    return saved;
  } catch {
    return null;
  }
}

export function isSelfQrisTransferTarget(
  target: { recipientAccount?: string; recipientUserId?: string },
  currentAccount?: Pick<BankAccount, 'accountNumber' | 'userId16'> | null
): boolean {
  if (!currentAccount) return false;
  const myAcc = normalizeNumericIdentifier(currentAccount.accountNumber);
  const myUid = normalizeNumericIdentifier(currentAccount.userId16);
  const targetAcc = normalizeNumericIdentifier(target.recipientAccount);
  const targetUid = normalizeNumericIdentifier(target.recipientUserId);

  if (myAcc && targetAcc && myAcc === targetAcc) return true;
  if (myUid && targetAcc && myUid === targetAcc) return true;
  if (myUid && targetUid && myUid === targetUid) return true;
  if (myAcc && targetUid && myAcc === targetUid) return true;
  return false;
}

interface NativeBarcodeDetectorResult {
  rawValue?: string;
}

interface NativeBarcodeDetector {
  detect: (source: ImageBitmapSource) => Promise<NativeBarcodeDetectorResult[]>;
}

interface WindowWithBarcodeDetector extends Window {
  BarcodeDetector?: new (options?: { formats?: string[] }) => NativeBarcodeDetector;
}

export async function decodeQrFromCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D
): Promise<string | null> {
  const w = canvas.width;
  const h = canvas.height;
  if (w <= 0 || h <= 0) return null;

  // 1. Native hardware-accelerated BarcodeDetector when available
  try {
    const DetectorCtor = (window as unknown as WindowWithBarcodeDetector).BarcodeDetector;
    if (DetectorCtor) {
      const detector = new DetectorCtor({ formats: ['qr_code'] });
      const results = await detector.detect(canvas);
      const first = results.find((r) => r?.rawValue && r.rawValue.trim().length > 0);
      if (first?.rawValue) {
        return first.rawValue.trim();
      }
    }
  } catch {
    // fallback to jsQR
  }

  // 2. Universal pure-JS jsQR fallback (works on iOS Safari, Firefox, Chrome, Desktop)
  try {
    const imageData = ctx.getImageData(0, 0, w, h);
    const decoded = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
    if (decoded?.data && decoded.data.trim().length > 0) {
      return decoded.data.trim();
    }
  } catch {
    // ignore decode failure
  }

  return null;
}

export async function decodeQrFromImageFile(file: File): Promise<string | null> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
    el.src = dataUrl;
  });

  // Coba resolusi optimal (maksimal 1200px agar akurat & cepat di HP)
  const maxDim = 1200;
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
  const w = Math.max(1, Math.round((img.naturalWidth || 600) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || 600) * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);

  const firstTry = await decodeQrFromCanvas(canvas, ctx);
  if (firstTry) return firstTry;

  // Retry dengan dimensi asli bila gambar kecil/beresolusi rendah
  if (scale < 1) {
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    return decodeQrFromCanvas(canvas, ctx);
  }

  return null;
}
