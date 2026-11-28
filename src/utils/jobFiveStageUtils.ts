/**
 * Sistem 10 Tahap Kerja Interaktif (Workstation Bank Profesional)
 * Konfigurasi Admin, Skala Kesulitan Progresif per Jenjang Pekerjaan, & Auto-Save Progres
 *
 * 10 Tahap Berurutan:
 *  1. Benerin Kabel Panel Listrik (Pemula 4 kabel 1x · Menengah 5 kabel 1x · Tinggi 6 kabel 1x)
 *  2. Tap-Tap Transaksi Sesuai Ketentuan
 *  3. Verifikasi Kode Keamanan OTP & Angka Kliring Bank
 *  4. Kalibrasi Slider Frekuensi Server & Sinkronisasi Brankas
 *  5. Verifikasi Sidik Jari Biometrik 100%
 *  6. Cek Uang Palsu Sinar UV
 *  7. Sortir Dokumen Nasabah
 *  8. Stempel Persetujuan Resmi
 *  9. Audit Buku Besar (Ledger)
 * 10. Kirim Laporan Akhir & Pencairan Gaji
 */

export type JobStageId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const ALL_JOB_STAGE_IDS: JobStageId[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export interface JobStageMeta {
  id: JobStageId;
  shortLabel: string;
  title: string;
  subtitle: string;
  stationDevice: string;
}

export const JOB_FIVE_STAGE_CATALOG: JobStageMeta[] = [
  {
    id: 1,
    shortLabel: 'Kabel Panel',
    title: 'Tahap 1: Benerin Kabel Panel Listrik',
    subtitle: 'Sambungkan kabel warna melengkung ke soket port tujuan hingga seluruh LED menyala.',
    stationDevice: 'Panel Distribusi Daya & Jaringan',
  },
  {
    id: 2,
    shortLabel: 'Tap-Tap',
    title: 'Tahap 2: Tap-Tap Sesuai Ketentuan',
    subtitle: 'Proses antrean transaksi dengan ketukan cepat hingga memenuhi target lowongan.',
    stationDevice: 'Terminal Pemrosesan Teller',
  },
  {
    id: 3,
    shortLabel: 'OTP Kliring',
    title: 'Tahap 3: Verifikasi OTP & Kliring Bank',
    subtitle: 'Pilih bank kliring sesuai kode sistem dan masukkan kode OTP keamanan dengan tepat.',
    stationDevice: 'Gerbang Kliring BI-FAST & OTP',
  },
  {
    id: 4,
    shortLabel: 'Kalibrasi',
    title: 'Tahap 4: Kalibrasi Server & Brankas',
    subtitle: 'Atur slider instrumen tepat ke zona hijau target untuk sinkronisasi brankas utama.',
    stationDevice: 'Konsol Frekuensi & Kunci Brankas',
  },
  {
    id: 5,
    shortLabel: 'Biometrik',
    title: 'Tahap 5: Sidik Jari Biometrik 100%',
    subtitle: 'Tahan tombol pemindai sidik jari biometrik hingga verifikasi mencapai 100%.',
    stationDevice: 'Pemindai Biometrik Otorisasi',
  },
  {
    id: 6,
    shortLabel: 'Cek UV',
    title: 'Tahap 6: Cek Uang Palsu Sinar UV',
    subtitle: 'Nyalakan sinar UV, periksa tanda air tiap lembar, lalu pisahkan uang asli dan palsu.',
    stationDevice: 'Detektor Uang Kertas UV-365nm',
  },
  {
    id: 7,
    shortLabel: 'Sortir Berkas',
    title: 'Tahap 7: Sortir Dokumen Nasabah',
    subtitle: 'Arahkan setiap dokumen nasabah ke laci divisi tujuan yang sesuai standar operasional.',
    stationDevice: 'Rak Arsip Digital Divisi',
  },
  {
    id: 8,
    shortLabel: 'Stempel',
    title: 'Tahap 8: Stempel Persetujuan Resmi',
    subtitle: 'Bubuhkan stempel pengesahan bank tepat pada kolom otorisasi di setiap dokumen.',
    stationDevice: 'Meja Pengesahan & Stempel Cabang',
  },
  {
    id: 9,
    shortLabel: 'Audit Ledger',
    title: 'Tahap 9: Audit Buku Besar (Ledger)',
    subtitle: 'Periksa baris transaksi buku besar, temukan entri selisih nominal, dan koreksi nilainya.',
    stationDevice: 'Terminal Audit Pembukuan Inti',
  },
  {
    id: 10,
    shortLabel: 'Kirim Laporan',
    title: 'Tahap 10: Kirim Laporan Akhir & Pencairan',
    subtitle: 'Centang daftar pemeriksaan penutupan shift lalu kirim laporan final untuk cairkan gaji.',
    stationDevice: 'Sistem Pelaporan Cabang & Payroll',
  },
];

export const JOB_TEN_STAGE_CATALOG = JOB_FIVE_STAGE_CATALOG;

export type JobDifficultyTier = 'pemula' | 'menengah' | 'tinggi' | 'elit';

export interface JobStageScalingProfile {
  tier: JobDifficultyTier;
  tierLabel: string;
  cableCount: number; // Pemula 4, Menengah 5, Tinggi 6, Elit 7 (1x per Q9)
  cableRounds: number; // 1x per Q9
  otpLength: number; // 4, 5, 6, 6 digit
  sliderCount: number; // 2, 2, 3, 3 slider
  sliderTolerance: number; // ±6, ±5, ±4, ±3
  biometricHoldMs: number; // 1600, 1900, 2200, 2500
  uvBillCount: number; // 4, 5, 6, 7 lembar
  uvFakeCount: number; // 1, 2, 2, 3
  sortDocCount: number; // 4, 5, 6, 7 dokumen
  stampDocCount: number; // 2, 3, 4, 5 dokumen
  auditRowCount: number; // 4, 5, 6, 7 baris
  auditErrorCount: number; // 1, 1, 2, 2 selisih
  reportCheckCount: number; // 2, 3, 4, 4 ceklis akhir
  tierBonusPercent: number; // bonus ekstra berjenjang per level pekerjaan
}

export function computeJobStageScaling(
  requiredLevel: number,
  progressiveDifficultyEnabled: boolean,
  tierBonusPerLevelPercent = 2
): JobStageScalingProfile {
  const safeLevel = Math.max(1, Math.min(25, Math.round(requiredLevel || 1)));
  const tierBonusPercent = Math.max(
    0,
    Math.round((safeLevel - 1) * Math.max(0, tierBonusPerLevelPercent))
  );

  if (!progressiveDifficultyEnabled || safeLevel <= 6) {
    return {
      tier: 'pemula',
      tierLabel: 'Pemula (Lv 1–6)',
      cableCount: 4,
      cableRounds: 1,
      otpLength: 4,
      sliderCount: 2,
      sliderTolerance: 6,
      biometricHoldMs: 1600,
      uvBillCount: 4,
      uvFakeCount: 1,
      sortDocCount: 4,
      stampDocCount: 2,
      auditRowCount: 4,
      auditErrorCount: 1,
      reportCheckCount: 2,
      tierBonusPercent,
    };
  }

  if (safeLevel <= 13) {
    return {
      tier: 'menengah',
      tierLabel: 'Menengah (Lv 7–13)',
      cableCount: 5,
      cableRounds: 1,
      otpLength: 5,
      sliderCount: 2,
      sliderTolerance: 5,
      biometricHoldMs: 1900,
      uvBillCount: 5,
      uvFakeCount: 2,
      sortDocCount: 5,
      stampDocCount: 3,
      auditRowCount: 5,
      auditErrorCount: 1,
      reportCheckCount: 3,
      tierBonusPercent,
    };
  }

  if (safeLevel <= 20) {
    return {
      tier: 'tinggi',
      tierLabel: 'Tinggi (Lv 14–20)',
      cableCount: 6,
      cableRounds: 1,
      otpLength: 6,
      sliderCount: 3,
      sliderTolerance: 4,
      biometricHoldMs: 2200,
      uvBillCount: 6,
      uvFakeCount: 2,
      sortDocCount: 6,
      stampDocCount: 4,
      auditRowCount: 6,
      auditErrorCount: 2,
      reportCheckCount: 4,
      tierBonusPercent,
    };
  }

  return {
    tier: 'elit',
    tierLabel: 'Elit / Puncak (Lv 21–25)',
    cableCount: 7,
    cableRounds: 1,
    otpLength: 6,
    sliderCount: 3,
    sliderTolerance: 3,
    biometricHoldMs: 2500,
    uvBillCount: 7,
    uvFakeCount: 3,
    sortDocCount: 7,
    stampDocCount: 5,
    auditRowCount: 7,
    auditErrorCount: 2,
    reportCheckCount: 4,
    tierBonusPercent,
  };
}

export interface JobFiveStageAdminConfig {
  enabledStages: Record<JobStageId, boolean>;
  progressiveDifficultyEnabled: boolean;
  extraSalaryBonusPercent: number; // e.g. 35 => +35% bonus gaji rupiah untuk 10 tahap
  tierBonusPerLevelPercent: number; // e.g. 2 => +2% tambahan gaji per jenjang level pekerjaan
  extraCoinBonus: number; // e.g. 30 => +30 Coin ekstra
  extraAccountXpBonus: number; // e.g. 90 => +90 XP Level Akun
  updatedAt: string;
}

export interface JobStageProgressEntry {
  completedStages: JobStageId[];
  stage2Clicks?: number;
  updatedAt: string;
}

const LEGACY_CONFIG_STORAGE_KEY = 'bn_job_five_stage_config_v1';
const CONFIG_STORAGE_KEY = 'bn_job_ten_stage_config_v2';
const PROGRESS_STORAGE_KEY = 'bn_job_five_stage_progress_v1';
const CONFIG_EVENT = 'bn:job-five-stage-config-updated';
const PROGRESS_EVENT = 'bn:job-five-stage-progress-updated';

export const DEFAULT_JOB_FIVE_STAGE_CONFIG: JobFiveStageAdminConfig = {
  enabledStages: {
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
  },
  progressiveDifficultyEnabled: true,
  extraSalaryBonusPercent: 35,
  tierBonusPerLevelPercent: 2,
  extraCoinBonus: 30,
  extraAccountXpBonus: 90,
  updatedAt: new Date(0).toISOString(),
};

export function normalizeJobFiveStageConfig(
  raw?: Partial<JobFiveStageAdminConfig> | null
): JobFiveStageAdminConfig {
  const base = DEFAULT_JOB_FIVE_STAGE_CONFIG;
  const rawStages = (raw?.enabledStages || base.enabledStages) as Partial<
    Record<JobStageId, boolean>
  >;
  const enabledStages: Record<JobStageId, boolean> = {
    1: typeof rawStages[1] === 'boolean' ? rawStages[1] : true,
    2: typeof rawStages[2] === 'boolean' ? rawStages[2] : true,
    3: typeof rawStages[3] === 'boolean' ? rawStages[3] : true,
    4: typeof rawStages[4] === 'boolean' ? rawStages[4] : true,
    5: typeof rawStages[5] === 'boolean' ? rawStages[5] : true,
    6: typeof rawStages[6] === 'boolean' ? rawStages[6] : true,
    7: typeof rawStages[7] === 'boolean' ? rawStages[7] : true,
    8: typeof rawStages[8] === 'boolean' ? rawStages[8] : true,
    9: typeof rawStages[9] === 'boolean' ? rawStages[9] : true,
    10: typeof rawStages[10] === 'boolean' ? rawStages[10] : true,
  };
  // Pastikan minimal 1 tahap selalu aktif
  if (!Object.values(enabledStages).some(Boolean)) {
    enabledStages[10] = true;
  }

  const salaryPct = Number(raw?.extraSalaryBonusPercent);
  const tierBonusPct = Number(raw?.tierBonusPerLevelPercent);
  const coinBonus = Number(raw?.extraCoinBonus);
  const xpBonus = Number(raw?.extraAccountXpBonus);

  return {
    enabledStages,
    progressiveDifficultyEnabled:
      typeof raw?.progressiveDifficultyEnabled === 'boolean'
        ? raw.progressiveDifficultyEnabled
        : base.progressiveDifficultyEnabled,
    extraSalaryBonusPercent:
      Number.isFinite(salaryPct) && salaryPct >= 0
        ? Math.min(500, Math.round(salaryPct))
        : base.extraSalaryBonusPercent,
    tierBonusPerLevelPercent:
      Number.isFinite(tierBonusPct) && tierBonusPct >= 0
        ? Math.min(50, Math.round(tierBonusPct))
        : base.tierBonusPerLevelPercent,
    extraCoinBonus:
      Number.isFinite(coinBonus) && coinBonus >= 0
        ? Math.min(100_000, Math.round(coinBonus))
        : base.extraCoinBonus,
    extraAccountXpBonus:
      Number.isFinite(xpBonus) && xpBonus >= 0
        ? Math.min(100_000, Math.round(xpBonus))
        : base.extraAccountXpBonus,
    updatedAt:
      typeof raw?.updatedAt === 'string' ? raw.updatedAt : new Date().toISOString(),
  };
}

export function loadJobFiveStageConfig(): JobFiveStageAdminConfig {
  if (typeof window === 'undefined') return { ...DEFAULT_JOB_FIVE_STAGE_CONFIG };
  try {
    const raw = window.localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) {
      return normalizeJobFiveStageConfig(JSON.parse(raw));
    }
    // Migrasi halus dari konfigurasi 5 tahap lama (jika ada) sambil mengaktifkan Tahap 6–10
    const legacyRaw = window.localStorage.getItem(LEGACY_CONFIG_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw);
      return normalizeJobFiveStageConfig({
        ...DEFAULT_JOB_FIVE_STAGE_CONFIG,
        enabledStages: {
          ...DEFAULT_JOB_FIVE_STAGE_CONFIG.enabledStages,
          ...(legacy?.enabledStages || {}),
        },
        extraSalaryBonusPercent: Math.max(
          DEFAULT_JOB_FIVE_STAGE_CONFIG.extraSalaryBonusPercent,
          Number(legacy?.extraSalaryBonusPercent) || 0
        ),
        extraCoinBonus: Math.max(
          DEFAULT_JOB_FIVE_STAGE_CONFIG.extraCoinBonus,
          Number(legacy?.extraCoinBonus) || 0
        ),
        extraAccountXpBonus: Math.max(
          DEFAULT_JOB_FIVE_STAGE_CONFIG.extraAccountXpBonus,
          Number(legacy?.extraAccountXpBonus) || 0
        ),
      });
    }
    return { ...DEFAULT_JOB_FIVE_STAGE_CONFIG };
  } catch {
    return { ...DEFAULT_JOB_FIVE_STAGE_CONFIG };
  }
}

export function saveJobFiveStageConfig(
  patch: Partial<JobFiveStageAdminConfig>
): JobFiveStageAdminConfig {
  const current = loadJobFiveStageConfig();
  const merged = normalizeJobFiveStageConfig({
    ...current,
    ...patch,
    enabledStages: {
      ...current.enabledStages,
      ...(patch.enabledStages || {}),
    },
    updatedAt: new Date().toISOString(),
  });

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent(CONFIG_EVENT, { detail: merged }));
    } catch {
      // ignore storage errors
    }
  }
  return merged;
}

export function subscribeJobFiveStageConfig(
  cb: (cfg: JobFiveStageAdminConfig) => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const onUpdate = () => cb(loadJobFiveStageConfig());
  const onStorage = (e: StorageEvent) => {
    if (e.key === CONFIG_STORAGE_KEY) cb(loadJobFiveStageConfig());
  };
  window.addEventListener(CONFIG_EVENT, onUpdate);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CONFIG_EVENT, onUpdate);
    window.removeEventListener('storage', onStorage);
  };
}

export function getEnabledStageList(config: JobFiveStageAdminConfig): JobStageId[] {
  const list: JobStageId[] = [];
  ALL_JOB_STAGE_IDS.forEach((id) => {
    if (config.enabledStages[id]) list.push(id);
  });
  return list.length > 0 ? list : [10];
}

// ============================================================================
// AUTO-SAVE PROGRES TAHAP KERJA PER AKUN & PER LOWONGAN
// ============================================================================

type AllProgressStore = Record<string, Record<string, JobStageProgressEntry>>;

function readAllProgressStore(): AllProgressStore {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as AllProgressStore) : {};
  } catch {
    return {};
  }
}

function writeAllProgressStore(store: AllProgressStore) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function loadAccountJobStageProgressMap(
  accountId: string
): Record<string, JobStageProgressEntry> {
  if (!accountId) return {};
  const all = readAllProgressStore();
  return all[accountId] || {};
}

export function saveJobStageProgress(
  accountId: string,
  jobId: string,
  completedStages: JobStageId[],
  stage2Clicks?: number
): JobStageProgressEntry {
  const uniqueSorted = Array.from(new Set(completedStages)).sort(
    (a, b) => a - b
  ) as JobStageId[];
  const entry: JobStageProgressEntry = {
    completedStages: uniqueSorted,
    stage2Clicks:
      typeof stage2Clicks === 'number' && Number.isFinite(stage2Clicks)
        ? Math.max(0, Math.floor(stage2Clicks))
        : undefined,
    updatedAt: new Date().toISOString(),
  };
  if (accountId && jobId) {
    const all = readAllProgressStore();
    const accMap = { ...(all[accountId] || {}), [jobId]: entry };
    all[accountId] = accMap;
    writeAllProgressStore(all);
  }
  return entry;
}

export function clearJobStageProgress(accountId: string, jobId: string) {
  if (!accountId || !jobId) return;
  const all = readAllProgressStore();
  if (!all[accountId] || !all[accountId][jobId]) return;
  const nextAccMap = { ...all[accountId] };
  delete nextAccMap[jobId];
  all[accountId] = nextAccMap;
  writeAllProgressStore(all);
}

export function subscribeJobStageProgress(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onUpdate = () => cb();
  const onStorage = (e: StorageEvent) => {
    if (e.key === PROGRESS_STORAGE_KEY) cb();
  };
  window.addEventListener(PROGRESS_EVENT, onUpdate);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(PROGRESS_EVENT, onUpdate);
    window.removeEventListener('storage', onStorage);
  };
}
