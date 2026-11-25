/**
 * Bank Nusantara — Katalog Program Hadiah Saran & Ide Fitur (v15.39.49)
 * Mendukung 7 aset hadiah fleksibel yang dapat dikustomisasi penuh oleh Admin
 * serta 6 status alur peninjauan saran secara transparan.
 */
import { SuggestionRewardProgramConfig, SuggestionStatus } from '../types/bank';

export interface SuggestionStatusMeta {
  key: SuggestionStatus;
  label: string;
  shortLabel: string;
  badgeClass: string;
  description: string;
}

export const SUGGESTION_STATUSES: SuggestionStatusMeta[] = [
  {
    key: 'baru',
    label: 'Baru Masuk',
    shortLabel: 'Baru',
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40',
    description: 'Saran telah diterima sistem dan menunggu antrean peninjauan Admin.',
  },
  {
    key: 'ditinjau',
    label: 'Sedang Ditinjau',
    shortLabel: 'Ditinjau',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    description: 'Tim Admin sedang mengevaluasi ide dan kelayakan implementasinya.',
  },
  {
    key: 'diterima',
    label: 'Diterima & Terpilih',
    shortLabel: 'Diterima',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    description: 'Saran diapresiasi dan diterima oleh Admin Bank Nusantara.',
  },
  {
    key: 'dikerjakan',
    label: 'Sedang Dikerjakan',
    shortLabel: 'Dikerjakan',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/40',
    description: 'Ide saran masuk ke tahap pengembangan fitur di aplikasi.',
  },
  {
    key: 'dirilis',
    label: 'Sudah Dirilis',
    shortLabel: 'Dirilis',
    badgeClass: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    description: 'Saran telah resmi hadir di pembaruan aplikasi Bank Nusantara!',
  },
  {
    key: 'ditolak',
    label: 'Belum Dapat Diterima',
    shortLabel: 'Ditolak',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    description: 'Saran belum dapat diterapkan saat ini atau bersifat duplikat.',
  },
];

export const SUGGESTION_CATEGORIES: string[] = [
  'Ide Fitur Baru',
  'Tampilan & Kemudahan UI/UX',
  'Chat Global & Privat',
  'Game, Spin & Hiburan',
  'Transaksi, QRIS & Tabungan',
  'Promo, Misi & Program Hadiah',
  'Keamanan & Performa',
  'Saran Umum / Lainnya',
];

export const SUGGESTION_PRIORITIES: Array<{
  key: 'ringan' | 'sedang' | 'penting' | 'kritis';
  label: string;
  badgeClass: string;
}> = [
  { key: 'ringan', label: 'Ringan (Nice to Have)', badgeClass: 'bg-slate-700/60 text-slate-200 border-slate-600' },
  { key: 'sedang', label: 'Sedang (Berguna)', badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-400/40' },
  { key: 'penting', label: 'Penting (Berdampak Besar)', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-400/40' },
  { key: 'kritis', label: 'Sangat Dibutuhkan', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' },
];

export const DEFAULT_SUGGESTION_AUTO_REWARD_STATUSES: SuggestionStatus[] = ['diterima', 'dirilis'];

export const DEFAULT_SUGGESTION_REWARD_CONFIG: SuggestionRewardProgramConfig = {
  enabled: true,
  cashAmount: 500_000,
  coinAmount: 50,
  diamondAmount: 25,
  goldGrams: 0.5,
  voucherAmount: 1,
  pointsAmount: 150,
  familySlotAmount: 0,
  defaultRewardMessage:
    'Terima kasih atas saran brilian Anda! Ide Anda telah diapresiasi Admin dan hadiah Program Saran langsung masuk ke akun Anda.',
  autoRewardTriggerStatuses: DEFAULT_SUGGESTION_AUTO_REWARD_STATUSES,
  updatedAt: new Date().toISOString(),
};

export function normalizeSuggestionStatus(raw?: string): SuggestionStatus {
  const clean = String(raw || '').trim().toLowerCase();
  const valid = SUGGESTION_STATUSES.find((s) => s.key === clean);
  return valid ? valid.key : 'baru';
}

export function getSuggestionStatusMeta(status?: string): SuggestionStatusMeta {
  const normalized = normalizeSuggestionStatus(status);
  return SUGGESTION_STATUSES.find((s) => s.key === normalized) || SUGGESTION_STATUSES[0];
}

export function hasAnySuggestionRewardConfigured(
  cfg?: Partial<SuggestionRewardProgramConfig> | null
): boolean {
  if (!cfg) return false;
  return (
    (Number(cfg.cashAmount) || 0) > 0 ||
    (Number(cfg.coinAmount) || 0) > 0 ||
    (Number(cfg.diamondAmount) || 0) > 0 ||
    (Number(cfg.goldGrams) || 0) > 0 ||
    (Number(cfg.voucherAmount) || 0) > 0 ||
    (Number(cfg.pointsAmount) || 0) > 0 ||
    (Number(cfg.familySlotAmount) || 0) > 0
  );
}

export function isSuggestionStatusAutoRewardTrigger(
  status?: string,
  cfg?: Partial<SuggestionRewardProgramConfig> | null
): boolean {
  const normalized = normalizeSuggestionStatus(status);
  if (normalized === 'ditolak') return false;
  const triggers =
    Array.isArray(cfg?.autoRewardTriggerStatuses) && cfg!.autoRewardTriggerStatuses.length > 0
      ? cfg!.autoRewardTriggerStatuses.map((s) => normalizeSuggestionStatus(s))
      : DEFAULT_SUGGESTION_AUTO_REWARD_STATUSES;
  return triggers.includes(normalized);
}
