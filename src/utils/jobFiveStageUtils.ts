/**
 * Sistem 5 Tahap Kerja Interaktif — Konfigurasi Admin & Auto-Save Progres Per Akun Per Lowongan
 * Tahap 1: Benerin Kabel (4 pasang kabel warna)
 * Tahap 2: Tap-Tap Sesuai Ketentuan (target klik lowongan)
 * Tahap 3: Verifikasi Kode Keamanan OTP & Angka Kliring Bank
 * Tahap 4: Kalibrasi Slider Frekuensi Server & Sinkronisasi Brankas
 * Tahap 5: Menahan Tombol Sidik Jari Biometrik hingga 100%
 */

export type JobStageId = 1 | 2 | 3 | 4 | 5;

export interface JobStageMeta {
  id: JobStageId;
  shortLabel: string;
  title: string;
  subtitle: string;
}

export const JOB_FIVE_STAGE_CATALOG: JobStageMeta[] = [
  {
    id: 1,
    shortLabel: 'Kabel',
    title: 'Tahap 1: Benerin Kabel',
    subtitle: 'Sambungkan 4 pasang kabel warna ke port tujuan yang tepat.',
  },
  {
    id: 2,
    shortLabel: 'Tap-Tap',
    title: 'Tahap 2: Tap-Tap Sesuai Ketentuan',
    subtitle: 'Ketuk cepat hingga memenuhi target klik lowongan pekerjaan.',
  },
  {
    id: 3,
    shortLabel: 'OTP Kliring',
    title: 'Tahap 3: Verifikasi OTP & Kliring Bank',
    subtitle: 'Cocokkan kode kliring bank dan masukkan 4 digit kode OTP keamanan.',
  },
  {
    id: 4,
    shortLabel: 'Kalibrasi',
    title: 'Tahap 4: Kalibrasi Server & Brankas',
    subtitle: 'Geser kedua slider ke zona hijau target untuk sinkronisasi brankas.',
  },
  {
    id: 5,
    shortLabel: 'Biometrik',
    title: 'Tahap 5: Sidik Jari Biometrik 100%',
    subtitle: 'Tahan tombol sidik jari biometrik hingga penuh 100% untuk cairkan gaji.',
  },
];

export interface JobFiveStageAdminConfig {
  enabledStages: Record<JobStageId, boolean>;
  extraSalaryBonusPercent: number; // e.g. 20 => +20% bonus gaji rupiah
  extraCoinBonus: number; // e.g. 15 => +15 Coin ekstra
  extraAccountXpBonus: number; // e.g. 50 => +50 XP Level Akun
  updatedAt: string;
}

export interface JobStageProgressEntry {
  completedStages: JobStageId[];
  stage2Clicks?: number;
  updatedAt: string;
}

const CONFIG_STORAGE_KEY = 'bn_job_five_stage_config_v1';
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
  },
  extraSalaryBonusPercent: 20,
  extraCoinBonus: 15,
  extraAccountXpBonus: 50,
  updatedAt: new Date(0).toISOString(),
};

export function normalizeJobFiveStageConfig(
  raw?: Partial<JobFiveStageAdminConfig> | null
): JobFiveStageAdminConfig {
  const base = DEFAULT_JOB_FIVE_STAGE_CONFIG;
  const rawStages = raw?.enabledStages || base.enabledStages;
  const enabledStages: Record<JobStageId, boolean> = {
    1: typeof rawStages[1] === 'boolean' ? rawStages[1] : true,
    2: typeof rawStages[2] === 'boolean' ? rawStages[2] : true,
    3: typeof rawStages[3] === 'boolean' ? rawStages[3] : true,
    4: typeof rawStages[4] === 'boolean' ? rawStages[4] : true,
    5: typeof rawStages[5] === 'boolean' ? rawStages[5] : true,
  };
  // Pastikan minimal 1 tahap selalu aktif
  if (!Object.values(enabledStages).some(Boolean)) {
    enabledStages[5] = true;
  }

  const salaryPct = Number(raw?.extraSalaryBonusPercent);
  const coinBonus = Number(raw?.extraCoinBonus);
  const xpBonus = Number(raw?.extraAccountXpBonus);

  return {
    enabledStages,
    extraSalaryBonusPercent:
      Number.isFinite(salaryPct) && salaryPct >= 0
        ? Math.min(500, Math.round(salaryPct))
        : base.extraSalaryBonusPercent,
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
    if (!raw) return { ...DEFAULT_JOB_FIVE_STAGE_CONFIG };
    return normalizeJobFiveStageConfig(JSON.parse(raw));
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
  ([1, 2, 3, 4, 5] as JobStageId[]).forEach((id) => {
    if (config.enabledStages[id]) list.push(id);
  });
  return list.length > 0 ? list : [5];
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
