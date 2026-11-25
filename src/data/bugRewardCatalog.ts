/**
 * Bank Nusantara — Program Hadiah Laporan Bug Terverifikasi Admin & 10 Status Laporan Bug
 */
import { BugReportStatus, BugRewardProgramConfig } from '../types/bank';

export const DEFAULT_BUG_REWARD_CONFIG: BugRewardProgramConfig = {
  enabled: true,
  cashAmount: 500_000,
  coinAmount: 50,
  diamondAmount: 25,
  goldGrams: 0.5,
  voucherAmount: 1,
  pointsAmount: 150,
  familySlotAmount: 0,
  defaultRewardMessage:
    'Terima kasih telah melaporkan bug! Laporan Anda telah diverifikasi Admin dan hadiah apresiasi langsung masuk ke akun Anda.',
  updatedAt: new Date().toISOString(),
};

export interface BugStatusMeta {
  key: BugReportStatus;
  label: string;
  shortLabel: string;
  description: string;
  badgeClass: string;
  dotClass: string;
}

/**
 * 10 Status Resmi Laporan Bug (Menunggu Verifikasi, Sedang Ditinjau, Terverifikasi,
 * Dalam Perbaikan, Diperbaiki, Menunggu Uji Ulang, Selesai, Ditolak, Duplikat, Tidak Dapat Direproduksi)
 */
export const BUG_REPORT_STATUS_10: BugStatusMeta[] = [
  {
    key: 'baru',
    label: 'Menunggu Verifikasi',
    shortLabel: 'Menunggu Verifikasi',
    description: 'Laporan baru diterima dan belum diverifikasi Admin (hadiah belum cair).',
    badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    dotClass: 'bg-amber-400',
  },
  {
    key: 'ditinjau',
    label: 'Sedang Ditinjau',
    shortLabel: 'Sedang Ditinjau',
    description: 'Tim Admin sedang memeriksa reproduksi dan bukti kendala (hadiah belum cair).',
    badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-400/40',
    dotClass: 'bg-sky-400',
  },
  {
    key: 'terverifikasi',
    label: 'Terverifikasi',
    shortLabel: 'Terverifikasi',
    description: 'Bug dinyatakan valid oleh Admin dan memenuhi syarat hadiah apresiasi.',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    dotClass: 'bg-emerald-400',
  },
  {
    key: 'dalam_perbaikan',
    label: 'Dalam Perbaikan',
    shortLabel: 'Dalam Perbaikan',
    description: 'Tim pengembang sedang mengerjakan perbaikan kode untuk bug ini.',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40',
    dotClass: 'bg-indigo-400',
  },
  {
    key: 'diperbaiki',
    label: 'Diperbaiki',
    shortLabel: 'Diperbaiki',
    description: 'Tambalan perbaikan telah selesai dibuat dan diterapkan ke sistem.',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
    dotClass: 'bg-cyan-400',
  },
  {
    key: 'uji_ulang',
    label: 'Menunggu Uji Ulang',
    shortLabel: 'Uji Ulang',
    description: 'Menunggu verifikasi kualitas akhir sebelum laporan ditutup penuh.',
    badgeClass: 'bg-violet-500/20 text-violet-300 border border-violet-400/40',
    dotClass: 'bg-violet-400',
  },
  {
    key: 'selesai',
    label: 'Selesai',
    shortLabel: 'Selesai',
    description: 'Laporan bug telah tuntas ditangani dan ditutup resmi.',
    badgeClass: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    dotClass: 'bg-teal-400',
  },
  {
    key: 'ditolak',
    label: 'Ditolak',
    shortLabel: 'Ditolak',
    description: 'Laporan tidak valid atau bukan bug sistem — tidak ada hadiah yang dicairkan.',
    badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
    dotClass: 'bg-rose-400',
  },
  {
    key: 'duplikat',
    label: 'Duplikat',
    shortLabel: 'Duplikat',
    description: 'Kendala serupa sudah dilaporkan sebelumnya — tidak mencairkan hadiah ganda.',
    badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-400/40',
    dotClass: 'bg-orange-400',
  },
  {
    key: 'tidak_repro',
    label: 'Tidak Dapat Direproduksi',
    shortLabel: 'Tidak Repro',
    description: 'Kendala tidak ditemukan saat diuji ulang oleh tim teknis.',
    badgeClass: 'bg-slate-700/60 text-slate-300 border border-slate-600',
    dotClass: 'bg-slate-400',
  },
];

export function normalizeBugReportStatus(status?: string): BugReportStatus {
  if (status === 'diproses') return 'ditinjau';
  const valid = BUG_REPORT_STATUS_10.find((s) => s.key === status);
  return valid ? valid.key : 'baru';
}

export function getBugStatusMeta(status?: string): BugStatusMeta {
  const normalized = normalizeBugReportStatus(status);
  return BUG_REPORT_STATUS_10.find((s) => s.key === normalized) || BUG_REPORT_STATUS_10[0];
}

export function hasAnyBugRewardConfigured(cfg: {
  cashAmount?: number;
  coinAmount?: number;
  diamondAmount?: number;
  goldGrams?: number;
  voucherAmount?: number;
  pointsAmount?: number;
  familySlotAmount?: number;
}): boolean {
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
