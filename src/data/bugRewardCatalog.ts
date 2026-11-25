/**
 * Bank Nusantara — Program Hadiah Laporan Bug Terverifikasi Admin & Standar 25 Status Laporan Bug (#01 s/d #25)
 * Disusun secara terstandarisasi dan memiliki helper urutan terbalik (#25 paling atas turun ke #01 paling bawah)
 * agar rapi, terkelompok dalam 5 tahap, dan tidak pernah tertukar saat dikelola Admin maupun disinkronkan ke Cloud.
 */
import { BugReportStatus, BugRewardProgramConfig } from '../types/bank';

export type BugStageGroupId =
  | 'tahap_awal'
  | 'investigasi'
  | 'perbaikan'
  | 'uji_rilis'
  | 'penutupan';

export interface BugStageGroupMeta {
  id: BugStageGroupId;
  order: number;
  title: string;
  rangeLabel: string;
  accentClass: string;
}

export const BUG_STAGE_GROUPS_5: BugStageGroupMeta[] = [
  {
    id: 'tahap_awal',
    order: 1,
    title: 'Tahap 1: Penerimaan & Verifikasi Awal',
    rangeLabel: '#01 – #05',
    accentClass: 'text-amber-300 border-amber-500/40 bg-amber-500/10',
  },
  {
    id: 'investigasi',
    order: 2,
    title: 'Tahap 2: Investigasi & Analisis Teknis',
    rangeLabel: '#06 – #10',
    accentClass: 'text-sky-300 border-sky-500/40 bg-sky-500/10',
  },
  {
    id: 'perbaikan',
    order: 3,
    title: 'Tahap 3: Pengerjaan Perbaikan & Patch',
    rangeLabel: '#11 – #15',
    accentClass: 'text-indigo-300 border-indigo-500/40 bg-indigo-500/10',
  },
  {
    id: 'uji_rilis',
    order: 4,
    title: 'Tahap 4: Uji Kualitas (QA) & Rilis Publik',
    rangeLabel: '#16 – #20',
    accentClass: 'text-violet-300 border-violet-500/40 bg-violet-500/10',
  },
  {
    id: 'penutupan',
    order: 5,
    title: 'Tahap 5: Penutupan & Resolusi Akhir',
    rangeLabel: '#21 – #25',
    accentClass: 'text-teal-300 border-teal-500/40 bg-teal-500/10',
  },
];

export const DEFAULT_AUTO_REWARD_TRIGGER_STATUSES: BugReportStatus[] = [
  'terverifikasi',
];

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
  autoRewardTriggerStatuses: DEFAULT_AUTO_REWARD_TRIGGER_STATUSES,
  updatedAt: new Date().toISOString(),
};

export interface BugStatusMeta {
  indexNumber: number; // 1 .. 25
  codeLabel: string; // '#01' .. '#25'
  key: BugReportStatus;
  label: string;
  indexedLabel: string; // '#01 - Menunggu Verifikasi'
  shortLabel: string;
  stageGroupId: BugStageGroupId;
  stageGroupTitle: string;
  description: string;
  badgeClass: string;
  dotClass: string;
  isRejectedOrClosedWithoutReward?: boolean;
  defaultTriggersReward?: boolean;
}

/**
 * 25 Status Resmi Laporan Bug Terstandarisasi (#01 s/d #25)
 */
export const BUG_REPORT_STATUS_25: BugStatusMeta[] = [
  // ================= KELOMPOK 1: TAHAP AWAL (#01 - #05) =================
  {
    indexNumber: 1,
    codeLabel: '#01',
    key: 'baru',
    label: 'Menunggu Verifikasi',
    indexedLabel: '#01 - Menunggu Verifikasi',
    shortLabel: 'Menunggu Verifikasi',
    stageGroupId: 'tahap_awal',
    stageGroupTitle: 'Tahap 1: Penerimaan & Verifikasi Awal (#01–#05)',
    description: 'Laporan baru diterima di antrean dan menunggu pemeriksaan awal Admin.',
    badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-400/40',
    dotClass: 'bg-amber-400',
  },
  {
    indexNumber: 2,
    codeLabel: '#02',
    key: 'antrean_tinjauan',
    label: 'Masuk Antrean Tinjauan',
    indexedLabel: '#02 - Masuk Antrean Tinjauan',
    shortLabel: 'Antrean Tinjauan',
    stageGroupId: 'tahap_awal',
    stageGroupTitle: 'Tahap 1: Penerimaan & Verifikasi Awal (#01–#05)',
    description: 'Tiket laporan bug telah tercatat resmi dan dijadwalkan untuk ditinjau.',
    badgeClass: 'bg-yellow-500/20 text-yellow-200 border border-yellow-400/40',
    dotClass: 'bg-yellow-400',
  },
  {
    indexNumber: 3,
    codeLabel: '#03',
    key: 'ditinjau',
    label: 'Sedang Ditinjau Admin',
    indexedLabel: '#03 - Sedang Ditinjau Admin',
    shortLabel: 'Sedang Ditinjau',
    stageGroupId: 'tahap_awal',
    stageGroupTitle: 'Tahap 1: Penerimaan & Verifikasi Awal (#01–#05)',
    description: 'Admin sedang membaca kronologi dan memeriksa bukti tangkapan layar pelapor.',
    badgeClass: 'bg-sky-500/20 text-sky-300 border border-sky-400/40',
    dotClass: 'bg-sky-400',
  },
  {
    indexNumber: 4,
    codeLabel: '#04',
    key: 'cek_bukti_log',
    label: 'Pemeriksaan Bukti & Log',
    indexedLabel: '#04 - Pemeriksaan Bukti & Log',
    shortLabel: 'Cek Bukti & Log',
    stageGroupId: 'tahap_awal',
    stageGroupTitle: 'Tahap 1: Penerimaan & Verifikasi Awal (#01–#05)',
    description: 'Pengecekan kecocokan laporan dengan catatan log aktivitas sistem dan akun.',
    badgeClass: 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/40',
    dotClass: 'bg-cyan-400',
  },
  {
    indexNumber: 5,
    codeLabel: '#05',
    key: 'terverifikasi',
    label: 'Terverifikasi Valid',
    indexedLabel: '#05 - Terverifikasi Valid',
    shortLabel: 'Terverifikasi',
    stageGroupId: 'tahap_awal',
    stageGroupTitle: 'Tahap 1: Penerimaan & Verifikasi Awal (#01–#05)',
    description: 'Bug dinyatakan sah/valid oleh Admin dan memenuhi syarat pencairan hadiah.',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40',
    dotClass: 'bg-emerald-400',
    defaultTriggersReward: true,
  },

  // ================= KELOMPOK 2: INVESTIGASI (#06 - #10) =================
  {
    indexNumber: 6,
    codeLabel: '#06',
    key: 'analisis_akar',
    label: 'Analisis Akar Masalah',
    indexedLabel: '#06 - Analisis Akar Masalah',
    shortLabel: 'Analisis Akar',
    stageGroupId: 'investigasi',
    stageGroupTitle: 'Tahap 2: Investigasi & Analisis Teknis (#06–#10)',
    description: 'Tim teknis menelusuri sumber penyebab utama kendala pada modul terkait.',
    badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-400/40',
    dotClass: 'bg-blue-400',
  },
  {
    indexNumber: 7,
    codeLabel: '#07',
    key: 'reproduksi_teknis',
    label: 'Reproduksi Kendala Teknis',
    indexedLabel: '#07 - Reproduksi Kendala Teknis',
    shortLabel: 'Reproduksi Teknis',
    stageGroupId: 'investigasi',
    stageGroupTitle: 'Tahap 2: Investigasi & Analisis Teknis (#06–#10)',
    description: 'Bug berhasil direproduksi pada lingkungan simulasi untuk pengujian solusi.',
    badgeClass: 'bg-sky-600/25 text-sky-200 border border-sky-400/40',
    dotClass: 'bg-sky-300',
  },
  {
    indexNumber: 8,
    codeLabel: '#08',
    key: 'prioritas_perbaikan',
    label: 'Penentuan Prioritas Perbaikan',
    indexedLabel: '#08 - Penentuan Prioritas Perbaikan',
    shortLabel: 'Skala Prioritas',
    stageGroupId: 'investigasi',
    stageGroupTitle: 'Tahap 2: Investigasi & Analisis Teknis (#06–#10)',
    description: 'Tingkat urgensi dan dampak bug telah ditetapkan dalam peta jalan perbaikan.',
    badgeClass: 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/40',
    dotClass: 'bg-indigo-400',
  },
  {
    indexNumber: 9,
    codeLabel: '#09',
    key: 'diteruskan_tim_inti',
    label: 'Diteruskan ke Tim Inti',
    indexedLabel: '#09 - Diteruskan ke Tim Inti',
    shortLabel: 'Tim Inti',
    stageGroupId: 'investigasi',
    stageGroupTitle: 'Tahap 2: Investigasi & Analisis Teknis (#06–#10)',
    description: 'Tiket bug telah didelegasikan ke insinyur modul inti Bank Nusantara.',
    badgeClass: 'bg-violet-500/20 text-violet-200 border border-violet-400/40',
    dotClass: 'bg-violet-400',
  },
  {
    indexNumber: 10,
    codeLabel: '#10',
    key: 'dijadwalkan_perbaikan',
    label: 'Dijadwalkan Perbaikan',
    indexedLabel: '#10 - Dijadwalkan Perbaikan',
    shortLabel: 'Terjadwal Patch',
    stageGroupId: 'investigasi',
    stageGroupTitle: 'Tahap 2: Investigasi & Analisis Teknis (#06–#10)',
    description: 'Perbaikan telah masuk ke dalam jadwal pengerjaan rilis terdekat.',
    badgeClass: 'bg-purple-500/20 text-purple-200 border border-purple-400/40',
    dotClass: 'bg-purple-400',
  },

  // ================= KELOMPOK 3: PERBAIKAN (#11 - #15) =================
  {
    indexNumber: 11,
    codeLabel: '#11',
    key: 'dalam_perbaikan',
    label: 'Dalam Perbaikan Kode',
    indexedLabel: '#11 - Dalam Perbaikan Kode',
    shortLabel: 'Dalam Perbaikan',
    stageGroupId: 'perbaikan',
    stageGroupTitle: 'Tahap 3: Pengerjaan Perbaikan & Patch (#11–#15)',
    description: 'Tim pengembang sedang menulis dan memperbaiki logika kode untuk bug ini.',
    badgeClass: 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/45',
    dotClass: 'bg-indigo-400',
  },
  {
    indexNumber: 12,
    codeLabel: '#12',
    key: 'penyusunan_patch',
    label: 'Penyusunan Patch Sistem',
    indexedLabel: '#12 - Penyusunan Patch Sistem',
    shortLabel: 'Susun Patch',
    stageGroupId: 'perbaikan',
    stageGroupTitle: 'Tahap 3: Pengerjaan Perbaikan & Patch (#11–#15)',
    description: 'Paket tambalan kode (patch) sedang dirakit beserta perlindungan regresi.',
    badgeClass: 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/45',
    dotClass: 'bg-cyan-400',
  },
  {
    indexNumber: 13,
    codeLabel: '#13',
    key: 'integrasi_modul',
    label: 'Integrasi Perbaikan Modul',
    indexedLabel: '#13 - Integrasi Perbaikan Modul',
    shortLabel: 'Integrasi Modul',
    stageGroupId: 'perbaikan',
    stageGroupTitle: 'Tahap 3: Pengerjaan Perbaikan & Patch (#11–#15)',
    description: 'Perbaikan sedang digabungkan dengan layanan Cloud, Server, dan antarmuka.',
    badgeClass: 'bg-teal-500/20 text-teal-200 border border-teal-400/40',
    dotClass: 'bg-teal-400',
  },
  {
    indexNumber: 14,
    codeLabel: '#14',
    key: 'optimasi_keamanan',
    label: 'Optimasi & Keamanan Patch',
    indexedLabel: '#14 - Optimasi & Keamanan Patch',
    shortLabel: 'Audit Patch',
    stageGroupId: 'perbaikan',
    stageGroupTitle: 'Tahap 3: Pengerjaan Perbaikan & Patch (#11–#15)',
    description: 'Pemeriksaan keamanan data dan performa atas kode perbaikan yang baru.',
    badgeClass: 'bg-emerald-600/20 text-emerald-200 border border-emerald-400/40',
    dotClass: 'bg-emerald-300',
  },
  {
    indexNumber: 15,
    codeLabel: '#15',
    key: 'diperbaiki',
    label: 'Diperbaiki di Lingkungan Uji',
    indexedLabel: '#15 - Diperbaiki di Lingkungan Uji',
    shortLabel: 'Diperbaiki',
    stageGroupId: 'perbaikan',
    stageGroupTitle: 'Tahap 3: Pengerjaan Perbaikan & Patch (#11–#15)',
    description: 'Tambalan perbaikan telah selesai dibuat dan diterapkan ke sistem uji.',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40',
    dotClass: 'bg-cyan-400',
  },

  // ================= KELOMPOK 4: UJI & RILIS (#16 - #20) =================
  {
    indexNumber: 16,
    codeLabel: '#16',
    key: 'uji_ulang',
    label: 'Menunggu Uji Ulang (QA)',
    indexedLabel: '#16 - Menunggu Uji Ulang (QA)',
    shortLabel: 'Menunggu QA',
    stageGroupId: 'uji_rilis',
    stageGroupTitle: 'Tahap 4: Uji Kualitas (QA) & Rilis Publik (#16–#20)',
    description: 'Menunggu antrean pengujian kualitas akhir sebelum disahkan untuk rilis.',
    badgeClass: 'bg-violet-500/20 text-violet-300 border border-violet-400/40',
    dotClass: 'bg-violet-400',
  },
  {
    indexNumber: 17,
    codeLabel: '#17',
    key: 'sedang_diuji_ulang',
    label: 'Sedang Diuji Ulang',
    indexedLabel: '#17 - Sedang Diuji Ulang',
    shortLabel: 'Uji Ulang Aktif',
    stageGroupId: 'uji_rilis',
    stageGroupTitle: 'Tahap 4: Uji Kualitas (QA) & Rilis Publik (#16–#20)',
    description: 'Tim QA sedang memverifikasi bahwa bug tidak lagi muncul di berbagai skenario.',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-200 border border-fuchsia-400/40',
    dotClass: 'bg-fuchsia-400',
  },
  {
    indexNumber: 18,
    codeLabel: '#18',
    key: 'lulus_uji_qa',
    label: 'Lulus Uji Kualitas',
    indexedLabel: '#18 - Lulus Uji Kualitas',
    shortLabel: 'Lulus QA',
    stageGroupId: 'uji_rilis',
    stageGroupTitle: 'Tahap 4: Uji Kualitas (QA) & Rilis Publik (#16–#20)',
    description: 'Perbaikan telah dinyatakan lulus seluruh pengujian kualitas dan stabilitas.',
    badgeClass: 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/45',
    dotClass: 'bg-emerald-400',
  },
  {
    indexNumber: 19,
    codeLabel: '#19',
    key: 'siap_rilis_publik',
    label: 'Siap Dirilis ke Publik',
    indexedLabel: '#19 - Siap Dirilis ke Publik',
    shortLabel: 'Siap Rilis',
    stageGroupId: 'uji_rilis',
    stageGroupTitle: 'Tahap 4: Uji Kualitas (QA) & Rilis Publik (#16–#20)',
    description: 'Perbaikan telah dikemas dan siap diluncurkan ke seluruh perangkat nasabah.',
    badgeClass: 'bg-sky-500/25 text-sky-200 border border-sky-400/45',
    dotClass: 'bg-sky-400',
  },
  {
    indexNumber: 20,
    codeLabel: '#20',
    key: 'telah_dirilis',
    label: 'Telah Dirilis di Pembaruan',
    indexedLabel: '#20 - Telah Dirilis di Pembaruan',
    shortLabel: 'Telah Dirilis',
    stageGroupId: 'uji_rilis',
    stageGroupTitle: 'Tahap 4: Uji Kualitas (QA) & Rilis Publik (#16–#20)',
    description: 'Perbaikan sudah tayang secara langsung pada versi pembaruan aktif aplikasi.',
    badgeClass: 'bg-teal-500/25 text-teal-200 border border-teal-400/45',
    dotClass: 'bg-teal-400',
  },

  // ================= KELOMPOK 5: PENUTUPAN & RESOLUSI AKHIR (#21 - #25) =================
  {
    indexNumber: 21,
    codeLabel: '#21',
    key: 'selesai',
    label: 'Selesai & Ditutup Resmi',
    indexedLabel: '#21 - Selesai & Ditutup Resmi',
    shortLabel: 'Selesai',
    stageGroupId: 'penutupan',
    stageGroupTitle: 'Tahap 5: Penutupan & Resolusi Akhir (#21–#25)',
    description: 'Laporan bug telah tuntas ditangani dari awal hingga akhir dan ditutup resmi.',
    badgeClass: 'bg-teal-500/20 text-teal-300 border border-teal-400/40',
    dotClass: 'bg-teal-400',
  },
  {
    indexNumber: 22,
    codeLabel: '#22',
    key: 'arsip_pemeliharaan',
    label: 'Arsip Pemeliharaan Sistem',
    indexedLabel: '#22 - Arsip Pemeliharaan Sistem',
    shortLabel: 'Arsip Sistem',
    stageGroupId: 'penutupan',
    stageGroupTitle: 'Tahap 5: Penutupan & Resolusi Akhir (#21–#25)',
    description: 'Laporan disimpan sebagai referensi dokumentasi pemeliharaan jangka panjang.',
    badgeClass: 'bg-slate-600/30 text-slate-200 border border-slate-500/50',
    dotClass: 'bg-slate-300',
  },
  {
    indexNumber: 23,
    codeLabel: '#23',
    key: 'ditolak',
    label: 'Ditolak (Bukan Bug Sistem)',
    indexedLabel: '#23 - Ditolak (Bukan Bug Sistem)',
    shortLabel: 'Ditolak',
    stageGroupId: 'penutupan',
    stageGroupTitle: 'Tahap 5: Penutupan & Resolusi Akhir (#21–#25)',
    description: 'Laporan tidak valid atau bukan bug sistem — tidak mencairkan hadiah.',
    badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-400/40',
    dotClass: 'bg-rose-400',
    isRejectedOrClosedWithoutReward: true,
  },
  {
    indexNumber: 24,
    codeLabel: '#24',
    key: 'duplikat',
    label: 'Duplikat Laporan Sebelumnya',
    indexedLabel: '#24 - Duplikat Laporan Sebelumnya',
    shortLabel: 'Duplikat',
    stageGroupId: 'penutupan',
    stageGroupTitle: 'Tahap 5: Penutupan & Resolusi Akhir (#21–#25)',
    description: 'Kendala serupa sudah pernah dilaporkan — tidak mencairkan hadiah ganda.',
    badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-400/40',
    dotClass: 'bg-orange-400',
    isRejectedOrClosedWithoutReward: true,
  },
  {
    indexNumber: 25,
    codeLabel: '#25',
    key: 'tidak_repro',
    label: 'Tidak Dapat Direproduksi',
    indexedLabel: '#25 - Tidak Dapat Direproduksi',
    shortLabel: 'Tidak Repro',
    stageGroupId: 'penutupan',
    stageGroupTitle: 'Tahap 5: Penutupan & Resolusi Akhir (#21–#25)',
    description: 'Kendala tidak ditemukan saat diuji ulang oleh tim teknis.',
    badgeClass: 'bg-slate-700/60 text-slate-300 border border-slate-600',
    dotClass: 'bg-slate-400',
    isRejectedOrClosedWithoutReward: true,
  },
];

/**
 * Alias kompatibilitas agar impor lama BUG_REPORT_STATUS_10 tetap mengarah ke 25 status lengkap
 */
export const BUG_REPORT_STATUS_10: BugStatusMeta[] = BUG_REPORT_STATUS_25;

/**
 * Daftar 25 status dengan urutan terbalik dari bawah ke atas (#25 paling atas turun ke #01 paling bawah)
 * sesuai pilihan Admin agar rapi dan tidak membingungkan.
 */
export const BUG_REPORT_STATUS_25_DESC: BugStatusMeta[] = [...BUG_REPORT_STATUS_25].sort(
  (a, b) => b.indexNumber - a.indexNumber
);

/**
 * Kelompok 5 tahap yang diurutkan dari Tahap 5 (#25..#21) turun ke Tahap 1 (#05..#01)
 * untuk rendering <optgroup> dan barisan filter Panel Admin dari bawah ke atas.
 */
export const BUG_STAGE_GROUPS_DESC: Array<{
  group: BugStageGroupMeta;
  statusesDesc: BugStatusMeta[];
  stageGroup: BugStageGroupId;
  stageGroupTitle: string;
  rangeLabel: string;
  statuses: BugStatusMeta[];
}> = [...BUG_STAGE_GROUPS_5]
  .sort((a, b) => b.order - a.order)
  .map((group) => {
    const statusesDesc = BUG_REPORT_STATUS_25_DESC.filter((st) => st.stageGroupId === group.id);
    return {
      group,
      statusesDesc,
      stageGroup: group.id,
      stageGroupTitle: group.title,
      rangeLabel: group.rangeLabel,
      statuses: statusesDesc,
    };
  });

export function normalizeBugReportStatus(status?: string): BugReportStatus {
  if (!status) return 'baru';
  const clean = status.trim();
  if (clean === 'diproses') return 'ditinjau';
  const validByKey = BUG_REPORT_STATUS_25.find((s) => s.key === clean);
  if (validByKey) return validByKey.key;

  // Support lookup by index code '#01'..'#25' or number '1'..'25'
  const numMatch = clean.match(/^#?0?(\d{1,2})$/);
  if (numMatch) {
    const idx = Number(numMatch[1]);
    const validByIdx = BUG_REPORT_STATUS_25.find((s) => s.indexNumber === idx);
    if (validByIdx) return validByIdx.key;
  }
  return 'baru';
}

export function getBugStatusMeta(status?: string): BugStatusMeta {
  const normalized = normalizeBugReportStatus(status);
  return BUG_REPORT_STATUS_25.find((s) => s.key === normalized) || BUG_REPORT_STATUS_25[0];
}

export function getAdjacentBugStatus(
  currentStatus: string | undefined,
  direction: 'up' | 'down'
): BugStatusMeta {
  const currentMeta = getBugStatusMeta(currentStatus);
  const nextIndexNumber =
    direction === 'up'
      ? Math.min(25, currentMeta.indexNumber + 1)
      : Math.max(1, currentMeta.indexNumber - 1);
  return (
    BUG_REPORT_STATUS_25.find((s) => s.indexNumber === nextIndexNumber) || currentMeta
  );
}

export function isBugStatusRejectedOrNoReward(status?: string): boolean {
  const meta = getBugStatusMeta(status);
  return Boolean(meta.isRejectedOrClosedWithoutReward);
}

export function isBugStatusAutoRewardTrigger(
  status: string | undefined,
  cfg?: Partial<BugRewardProgramConfig> | BugReportStatus[] | null
): boolean {
  const normalized = normalizeBugReportStatus(status);
  if (isBugStatusRejectedOrNoReward(normalized)) return false;
  const rawList = Array.isArray(cfg)
    ? cfg
    : Array.isArray(cfg?.autoRewardTriggerStatuses)
    ? cfg.autoRewardTriggerStatuses
    : [];
  const triggerList =
    rawList.length > 0
      ? rawList.map((s) => normalizeBugReportStatus(s))
      : DEFAULT_AUTO_REWARD_TRIGGER_STATUSES;
  return triggerList.includes(normalized);
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
