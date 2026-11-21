/**
 * Bank Nusantara — Auto-Healing Sanitizer & Helper untuk Data Kode Redeem
 * Memperbaiki struktur data lama/tidak lengkap dari Cloud atau penyimpanan lokal secara otomatis
 * tanpa pernah menghapus kode redeem milik Admin, sehingga mencegah crash layar hitam.
 */
import {
  AdminGiftRewardItem,
  GachaTierRange,
  RedeemCode,
  RedeemCodeClaimRecord,
} from '../types/bank';
import { GIFT_REWARD_CATALOG, formatTrialDurationLabel } from '../data/giftRewardsCatalog';
import { formatRupiah } from './bankUtils';

function toSafeIso(value: unknown, fallbackMs: number): string {
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) {
      return new Date(parsed).toISOString();
    }
  } else if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return new Date(fallbackMs).toISOString();
}

function sanitizeGachaTiers(raw: unknown): GachaTierRange[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const cleaned: GachaTierRange[] = [];
  raw.forEach((tier, i) => {
    if (!tier || typeof tier !== 'object') return;
    const obj = tier as Record<string, unknown>;
    const minAmount = Math.max(0, Number(obj.minAmount) || 0);
    const maxAmount = Math.max(minAmount, Number(obj.maxAmount) || minAmount);
    const probabilityPercent = Math.max(0, Number(obj.probabilityPercent) || 0);
    cleaned.push({
      id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : `tier-${i}`,
      label: typeof obj.label === 'string' && obj.label.trim() ? obj.label : `Tier ${i + 1}`,
      minAmount,
      maxAmount,
      probabilityPercent,
    });
  });
  return cleaned.length > 0 ? cleaned : undefined;
}

export function sanitizeRedeemRewardItem(raw: unknown, idx: number): AdminGiftRewardItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const rawType = typeof obj.type === 'string' ? obj.type : 'cash_balance';
  const catMeta = GIFT_REWARD_CATALOG.find((c) => c.type === rawType) || GIFT_REWARD_CATALOG[0];
  const amount = Math.max(1, Number(obj.amount) || catMeta.defaultAmount || 1);
  const trialMinsRaw = Number(obj.trialDurationMinutes);
  const trialDurationMinutes =
    Number.isFinite(trialMinsRaw) && trialMinsRaw > 0
      ? Math.floor(trialMinsRaw)
      : catMeta.isTrial
      ? catMeta.defaultTrialMinutes || 1440
      : undefined;

  return {
    id: typeof obj.id === 'string' && obj.id.trim() ? obj.id : `rdm-rew-${idx}-${Date.now()}`,
    type: catMeta.type,
    label: typeof obj.label === 'string' && obj.label.trim() ? obj.label : catMeta.label,
    amount,
    unitLabel:
      typeof obj.unitLabel === 'string' && obj.unitLabel.trim()
        ? obj.unitLabel
        : catMeta.unitLabel,
    emoji: typeof obj.emoji === 'string' && obj.emoji.trim() ? obj.emoji : catMeta.emoji,
    customNote: typeof obj.customNote === 'string' ? obj.customNote : undefined,
    trialDurationMinutes,
    targetDevRoleId: typeof obj.targetDevRoleId === 'string' ? obj.targetDevRoleId : undefined,
    selectedSubOptionId:
      typeof obj.selectedSubOptionId === 'string' ? obj.selectedSubOptionId : undefined,
    selectedSubOptionLabel:
      typeof obj.selectedSubOptionLabel === 'string' ? obj.selectedSubOptionLabel : undefined,
    rewardMode: obj.rewardMode === 'gacha' ? 'gacha' : 'fixed',
    gachaTiers: sanitizeGachaTiers(obj.gachaTiers),
  };
}

export function sanitizeClaimRecord(raw: unknown, idx: number): RedeemCodeClaimRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const accountId =
    typeof obj.accountId === 'string' && obj.accountId.trim()
      ? obj.accountId.trim()
      : `legacy-acc-${idx}`;
  const fullName =
    typeof obj.fullName === 'string' && obj.fullName.trim()
      ? obj.fullName.trim()
      : 'Nasabah Bank Nusantara';
  const accountNumber =
    typeof obj.accountNumber === 'string' && obj.accountNumber.trim()
      ? obj.accountNumber.trim()
      : '-';
  const claimedAt = toSafeIso(obj.claimedAt, Date.now());
  const rewardsGranted = Array.isArray(obj.rewardsGranted)
    ? obj.rewardsGranted.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : undefined;

  return {
    accountId,
    accountNumber,
    fullName,
    claimedAt,
    rewardSummary: typeof obj.rewardSummary === 'string' ? obj.rewardSummary : undefined,
    rewardsGranted: rewardsGranted && rewardsGranted.length > 0 ? rewardsGranted : undefined,
    referenceNo: typeof obj.referenceNo === 'string' ? obj.referenceNo : undefined,
  };
}

/**
 * Memperbaiki satu entri Kode Redeem yang mungkin tidak lengkap / korup tanpa menghapus kode lama.
 */
export function sanitizeRedeemCode(raw: unknown, idx = 0): RedeemCode | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const rawCode = typeof obj.code === 'string' ? obj.code.trim().toUpperCase().replace(/\s+/g, '') : '';
  const safeCode = rawCode || `REDEEMLEGACY${idx + 1}`;
  const safeId =
    typeof obj.id === 'string' && obj.id.trim()
      ? obj.id.trim()
      : `rdm-repaired-${idx}-${safeCode}`;

  const rawDuration = Number(obj.durationMinutes);
  const durationMinutes =
    Number.isFinite(rawDuration) && rawDuration > 0 ? Math.floor(rawDuration) : 1440;

  const nowMs = Date.now();
  const createdAt = toSafeIso(obj.createdAt, nowMs);
  const createdMs = Date.parse(createdAt) || nowMs;
  const expiresAt = toSafeIso(obj.expiresAt, createdMs + durationMinutes * 60_000);

  const rawMaxClaims = Number(obj.maxClaims);
  const maxClaims = Number.isFinite(rawMaxClaims) && rawMaxClaims >= 1 ? Math.floor(rawMaxClaims) : 1;

  // Normalisasi claimedBy (mendukung array, object map dari Firebase RTDB, atau undefined/null)
  let rawClaimsArr: unknown[] = [];
  if (Array.isArray(obj.claimedBy)) {
    rawClaimsArr = obj.claimedBy;
  } else if (obj.claimedBy && typeof obj.claimedBy === 'object') {
    rawClaimsArr = Object.values(obj.claimedBy as Record<string, unknown>);
  }
  const claimedBy: RedeemCodeClaimRecord[] = [];
  rawClaimsArr.forEach((c, cIdx) => {
    const cleanClaim = sanitizeClaimRecord(c, cIdx);
    if (cleanClaim) claimedBy.push(cleanClaim);
  });

  // Normalisasi rewards (opsional, paket hadiah lengkap setara Surat & Hadiah)
  let rawRewardsArr: unknown[] = [];
  if (Array.isArray(obj.rewards)) {
    rawRewardsArr = obj.rewards;
  } else if (obj.rewards && typeof obj.rewards === 'object') {
    rawRewardsArr = Object.values(obj.rewards as Record<string, unknown>);
  }
  const sanitizedRewards: AdminGiftRewardItem[] = [];
  rawRewardsArr.forEach((r, rIdx) => {
    const cleanRew = sanitizeRedeemRewardItem(r, rIdx);
    if (cleanRew) sanitizedRewards.push(cleanRew);
  });

  const rawRewardAmount = Number(obj.rewardAmount);
  const derivedCashFromRewards = sanitizedRewards
    .filter((r) => r.type === 'cash_balance' || r.type === 'cash_startup_modal' || r.type === 'cash_billionaire_vault')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const rewardAmount =
    Number.isFinite(rawRewardAmount) && rawRewardAmount >= 0
      ? rawRewardAmount
      : derivedCashFromRewards;

  const safeTitle =
    typeof obj.title === 'string' && obj.title.trim()
      ? obj.title.trim()
      : sanitizedRewards.length > 0
      ? `Paket Hadiah ${safeCode} (${sanitizedRewards.length} Item)`
      : `Voucher Redeem ${formatRupiah(rewardAmount)}`;

  // Mendukung field boolean `active` maupun legacy `isActive`
  const active =
    typeof obj.active === 'boolean'
      ? obj.active
      : typeof obj.isActive === 'boolean'
      ? obj.isActive
      : true;

  return {
    id: safeId,
    code: safeCode,
    title: safeTitle,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    rewardAmount,
    rewards: sanitizedRewards.length > 0 ? sanitizedRewards : undefined,
    maxClaims,
    claimedBy,
    createdAt,
    expiresAt,
    durationMinutes,
    active,
    requireAdminPin: Boolean(obj.requireAdminPin),
    sendNotification: obj.sendNotification !== false,
  };
}

export function sanitizeRedeemCodesList(rawList: unknown): RedeemCode[] {
  let items: unknown[] = [];
  if (Array.isArray(rawList)) {
    items = rawList;
  } else if (rawList && typeof rawList === 'object') {
    items = Object.values(rawList as Record<string, unknown>);
  }
  const result: RedeemCode[] = [];
  const seenIds = new Set<string>();
  items.forEach((item, idx) => {
    const clean = sanitizeRedeemCode(item, idx);
    if (!clean) return;
    if (seenIds.has(clean.id)) {
      clean.id = `${clean.id}-${idx}`;
    }
    seenIds.add(clean.id);
    result.push(clean);
  });
  return result;
}

export type RedeemCodeStatusKind = 'active' | 'quota_full' | 'expired' | 'inactive';

export function getRedeemCodeStatus(rdm: RedeemCode, nowMs = Date.now()): RedeemCodeStatusKind {
  const claimedCount = Array.isArray(rdm.claimedBy) ? rdm.claimedBy.length : 0;
  const maxClaims = Math.max(1, Number(rdm.maxClaims) || 1);
  const expMs = Date.parse(rdm.expiresAt || '');
  const isExpired = Number.isFinite(expMs) ? nowMs > expMs : false;
  const isQuotaFull = claimedCount >= maxClaims;

  if (!rdm.active) return 'inactive';
  if (isQuotaFull) return 'quota_full';
  if (isExpired) return 'expired';
  return 'active';
}

export function formatSingleRewardSummary(rew: AdminGiftRewardItem): string {
  const catMeta = GIFT_REWARD_CATALOG.find((c) => c.type === rew.type);
  const sub = catMeta?.subOptions?.find((s) => s.id === rew.selectedSubOptionId);
  const isTrial = Boolean(catMeta?.isTrial || sub?.isTrialVariant);
  const trialMins = isTrial
    ? Number(rew.trialDurationMinutes) ||
      sub?.defaultTrialMinutesOverride ||
      catMeta?.defaultTrialMinutes ||
      1440
    : 0;
  const subTxt = rew.selectedSubOptionLabel ? ` (${rew.selectedSubOptionLabel})` : '';
  const trialTxt = trialMins > 0 ? ` · Trial ${formatTrialDurationLabel(trialMins)}` : '';
  const modeTxt = rew.rewardMode === 'gacha' ? ' · Gacha' : '';

  if (rew.type === 'cash_balance' || rew.type === 'cash_startup_modal' || rew.type === 'cash_billionaire_vault') {
    return `${rew.emoji} ${rew.label}: ${formatRupiah(Number(rew.amount) || 0)}${modeTxt}`;
  }
  return `${rew.emoji} ${rew.label}${subTxt} (${(Number(rew.amount) || 1).toLocaleString('id-ID')} ${rew.unitLabel})${trialTxt}${modeTxt}`;
}

export function summarizeRedeemCodeRewards(rdm: RedeemCode): string {
  if (Array.isArray(rdm.rewards) && rdm.rewards.length > 0) {
    const firstTwo = rdm.rewards.slice(0, 2).map(formatSingleRewardSummary);
    const extra = rdm.rewards.length > 2 ? ` +${rdm.rewards.length - 2} hadiah lainnya` : '';
    return `${firstTwo.join(' · ')}${extra}`;
  }
  return `Saldo +${formatRupiah(Number(rdm.rewardAmount) || 0)}`;
}
