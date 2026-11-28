/**
 * Modal Interaktif Layar Penuh — Workstation Bank Profesional 10 Tahap Kerja
 * Seluruh 25 Lowongan Pekerjaan dengan Skala Kesulitan Progresif (Pemula / Menengah / Tinggi / Elit):
 *  1) Benerin Kabel Panel Listrik (Tarik-Seret Kabel Melengkung: Pemula 4 · Menengah 5 · Tinggi 6 · Elit 7 kabel 1x)
 *  2) Tap-Tap Transaksi Sesuai Ketentuan
 *  3) Verifikasi Kode Keamanan OTP & Angka Kliring Bank
 *  4) Kalibrasi Slider Frekuensi Server & Sinkronisasi Brankas
 *  5) Verifikasi Sidik Jari Biometrik 100%
 *  6) Cek Uang Palsu Sinar UV-365nm
 *  7) Sortir Dokumen Nasabah ke Laci Divisi
 *  8) Stempel Persetujuan Resmi
 *  9) Audit Buku Besar (Ledger)
 * 10) Kirim Laporan Akhir & Pencairan Gaji
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  X,
  CheckCircle2,
  Zap,
  Cable,
  MousePointerClick,
  ShieldCheck,
  SlidersHorizontal,
  Fingerprint,
  AlertTriangle,
  Banknote,
  Coins,
  Sparkles,
  Ticket,
  Crown,
  Delete,
  RotateCcw,
  Sun,
  FolderOpen,
  Stamp,
  FileSpreadsheet,
  Send,
  ClipboardList,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { JobVacancyItem } from '../types/bank';
import { formatRupiah } from '../utils/bankUtils';
import {
  JOB_FIVE_STAGE_CATALOG,
  JobFiveStageAdminConfig,
  JobStageId,
  computeJobStageScaling,
  getEnabledStageList,
  saveJobStageProgress,
} from '../utils/jobFiveStageUtils';

// ============================================================================
// WEB AUDIO API SOUND EFFECTS RINGAN UNTUK WORKSTATION BANK
// ============================================================================

type SfxKind = 'click' | 'connect' | 'error' | 'stage_ok' | 'uv' | 'stamp' | 'complete';

let sharedAudioCtx: AudioContext | null = null;

function playWorkstationSfx(kind: SfxKind, muted: boolean) {
  if (muted || typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      void sharedAudioCtx.resume();
    }
    const ctx = sharedAudioCtx;
    const now = ctx.currentTime;

    const tone = (
      freq: number,
      duration: number,
      type: OscillatorType = 'sine',
      gainPeak = 0.08,
      delay = 0,
      endFreq?: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now + delay);
      if (endFreq) {
        osc.frequency.exponentialRampToValueAtTime(endFreq, now + delay + duration);
      }
      gain.gain.setValueAtTime(0.0001, now + delay);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + delay + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delay + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + duration + 0.02);
    };

    if (kind === 'click') {
      tone(620, 0.055, 'triangle', 0.055, 0, 420);
    } else if (kind === 'connect') {
      tone(440, 0.08, 'triangle', 0.08, 0, 660);
      tone(880, 0.11, 'sine', 0.06, 0.05);
    } else if (kind === 'error') {
      tone(190, 0.14, 'sawtooth', 0.06, 0, 145);
      tone(155, 0.12, 'sawtooth', 0.05, 0.1);
    } else if (kind === 'uv') {
      tone(520, 0.07, 'sine', 0.05, 0, 740);
    } else if (kind === 'stamp') {
      tone(160, 0.11, 'triangle', 0.11, 0, 70);
      tone(340, 0.06, 'sine', 0.04, 0.03);
    } else if (kind === 'stage_ok') {
      tone(523.25, 0.12, 'triangle', 0.075, 0);
      tone(659.25, 0.12, 'triangle', 0.075, 0.08);
      tone(783.99, 0.18, 'sine', 0.08, 0.16);
    } else if (kind === 'complete') {
      tone(523.25, 0.12, 'triangle', 0.08, 0);
      tone(659.25, 0.12, 'triangle', 0.08, 0.09);
      tone(783.99, 0.14, 'triangle', 0.08, 0.18);
      tone(1046.5, 0.28, 'sine', 0.09, 0.27);
    }
  } catch {
    // Abaikan jika browser memblokir audio
  }
}

// ============================================================================
// DATA KONSTAN 10 TAHAP KERJA REALISTIS
// ============================================================================

interface CableColorSpec {
  id: 'red' | 'blue' | 'yellow' | 'green' | 'orange' | 'purple' | 'cyan';
  label: string;
  portCode: string;
  voltage: string;
  hex: string;
  highlightHex: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
}

const ALL_CABLE_SPECS: CableColorSpec[] = [
  {
    id: 'red',
    label: 'Merah',
    portCode: 'PWR-01',
    voltage: '24V DC',
    hex: '#ef4444',
    highlightHex: '#fca5a5',
    bgClass: 'bg-red-500',
    borderClass: 'border-red-400',
    textClass: 'text-red-200',
  },
  {
    id: 'blue',
    label: 'Biru',
    portCode: 'NET-02',
    voltage: '12V BUS',
    hex: '#3b82f6',
    highlightHex: '#93c5fd',
    bgClass: 'bg-blue-500',
    borderClass: 'border-blue-400',
    textClass: 'text-blue-200',
  },
  {
    id: 'yellow',
    label: 'Kuning',
    portCode: 'SEC-03',
    voltage: '18V KEY',
    hex: '#eab308',
    highlightHex: '#fef08a',
    bgClass: 'bg-amber-400',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-200',
  },
  {
    id: 'green',
    label: 'Hijau',
    portCode: 'VLT-04',
    voltage: '48V SAFE',
    hex: '#10b981',
    highlightHex: '#6ee7b7',
    bgClass: 'bg-emerald-500',
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-200',
  },
  {
    id: 'orange',
    label: 'Oranye',
    portCode: 'AUX-05',
    voltage: '15V AUX',
    hex: '#f97316',
    highlightHex: '#fdba74',
    bgClass: 'bg-orange-500',
    borderClass: 'border-orange-400',
    textClass: 'text-orange-200',
  },
  {
    id: 'purple',
    label: 'Ungu',
    portCode: 'BUS-06',
    voltage: '36V DATA',
    hex: '#a855f7',
    highlightHex: '#d8b4fe',
    bgClass: 'bg-purple-500',
    borderClass: 'border-purple-400',
    textClass: 'text-purple-200',
  },
  {
    id: 'cyan',
    label: 'Sian',
    portCode: 'CLK-07',
    voltage: '5V SYNC',
    hex: '#06b6d4',
    highlightHex: '#67e8f9',
    bgClass: 'bg-cyan-400',
    borderClass: 'border-cyan-300',
    textClass: 'text-cyan-200',
  },
];

const BANK_CLEARING_CODES = [
  { code: '014', label: '014 · Nusantara Utama' },
  { code: '008', label: '008 · Kliring Sentral' },
  { code: '002', label: '002 · Brankas Nasional' },
  { code: '009', label: '009 · Giro Prioritas' },
];

type SortDepartment = 'kredit' | 'tabungan' | 'valas' | 'audit';

interface SortDocumentItem {
  id: string;
  docNumber: string;
  title: string;
  client: string;
  department: SortDepartment;
}

const SORT_DEPARTMENTS: { id: SortDepartment; label: string; code: string; accent: string }[] = [
  { id: 'kredit', label: 'Divisi Kredit', code: 'KRD-01', accent: 'border-amber-500/50 hover:bg-amber-500/15 text-amber-200' },
  { id: 'tabungan', label: 'Divisi Tabungan', code: 'TBG-02', accent: 'border-emerald-500/50 hover:bg-emerald-500/15 text-emerald-200' },
  { id: 'valas', label: 'Divisi Valas', code: 'VLS-03', accent: 'border-cyan-500/50 hover:bg-cyan-500/15 text-cyan-200' },
  { id: 'audit', label: 'Divisi Audit', code: 'AUD-04', accent: 'border-violet-500/50 hover:bg-violet-500/15 text-violet-200' },
];

const DOCUMENT_POOL: Omit<SortDocumentItem, 'id' | 'docNumber'>[] = [
  { title: 'Pengajuan KPR Subsidi & Agunan Rumah', client: 'Budi Santoso', department: 'kredit' },
  { title: 'Pembukaan Deposito Berjangka 12 Bulan', client: 'Siti Rahmawati', department: 'tabungan' },
  { title: 'Remitansi Valuta Asing USD / SGD', client: 'PT Samudra Ekspor', department: 'valas' },
  { title: 'Berita Acara Rekonsiliasi Kas Cabang', client: 'Unit Kontrol Internal', department: 'audit' },
  { title: 'Restrukturisasi Kredit Modal Kerja UMKM', client: 'CV Karya Mandiri', department: 'kredit' },
  { title: 'Pengkinian Data Rekening Giro Prioritas', client: 'Hendra Wijaya', department: 'tabungan' },
  { title: 'Permohonan Penukaran Kurs EUR & JPY', client: 'Nadia Putri', department: 'valas' },
  { title: 'Laporan Pemeriksaan Kepatuhan Transaksi', client: 'Komite Audit Pusat', department: 'audit' },
];

interface UvBanknoteItem {
  id: string;
  denomination: 'Rp 100.000' | 'Rp 50.000';
  serial: string;
  isFake: boolean;
  uvIssueLabel: string;
}

interface StampDocumentItem {
  id: string;
  refNo: string;
  title: string;
  amount: number;
  officer: string;
  stamped: boolean;
}

interface LedgerAuditRow {
  id: string;
  code: string;
  label: string;
  debit: number;
  credit: number;
  recordedNet: number;
  expectedNet: number;
  hasError: boolean;
  fixed: boolean;
}

interface ActivityLogItem {
  id: string;
  time: string;
  text: string;
  kind: 'info' | 'success' | 'warn';
}

const REPORT_CHECKLIST_POOL = [
  'Panel daya, jalur kabel, & terminal teller dalam kondisi normal',
  'Rekonsiliasi kliring OTP, sinar UV, & dokumen divisi telah diverifikasi',
  'Stempel pengesahan resmi & audit buku besar sudah seimbang (Rp 0 selisih)',
  'Arsip shift terenkripsi dan siap dikirim ke Pusat Payroll Bank Nusantara',
];

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function nowTimeStr(): string {
  return new Date().toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ============================================================================
// KOMPONEN UTAMA MODAL WORKSTATION 10 TAHAP
// ============================================================================

export interface JobFiveStageModalProps {
  job: JobVacancyItem;
  accountId: string;
  config: JobFiveStageAdminConfig;
  initialCompletedStages: JobStageId[];
  initialStage2Clicks: number;
  effectiveTargetClicks: number;
  clickPower: number;
  baseSalary: number;
  baseCoins: number;
  isAdminCard: boolean;
  userVouchers: number;
  isVoucherInfinity: boolean;
  onClose: () => void;
  onStageProgressSaved: (completedStages: JobStageId[], stage2Clicks?: number) => void;
  onCompleteJob: (options: {
    instantMode: boolean;
    useVoucher: boolean;
    completedStagesCount: number;
  }) => {
    success: boolean;
    paidAmount?: number;
    extraSalaryBonus?: number;
    coinsEarned?: number;
    extraCoinBonus?: number;
    extraXpEarned?: number;
    message: string;
  };
}

export const JobFiveStageModal: React.FC<JobFiveStageModalProps> = ({
  job,
  accountId,
  config,
  initialCompletedStages,
  initialStage2Clicks,
  effectiveTargetClicks,
  clickPower,
  baseSalary,
  baseCoins,
  isAdminCard,
  userVouchers,
  isVoucherInfinity,
  onClose,
  onStageProgressSaved,
  onCompleteJob,
}) => {
  const enabledStages = useMemo(() => getEnabledStageList(config), [config]);
  const scaling = useMemo(
    () =>
      computeJobStageScaling(
        job.requiredLevel,
        config.progressiveDifficultyEnabled,
        config.tierBonusPerLevelPercent
      ),
    [job.requiredLevel, config.progressiveDifficultyEnabled, config.tierBonusPerLevelPercent]
  );

  const [soundMuted, setSoundMuted] = useState(false);

  const [completedStages, setCompletedStages] = useState<JobStageId[]>(() =>
    initialCompletedStages.filter((s) => enabledStages.includes(s))
  );

  const firstPendingStage = useMemo<JobStageId>(() => {
    const found = enabledStages.find((s) => !completedStages.includes(s));
    return found ?? enabledStages[enabledStages.length - 1];
  }, [enabledStages, completedStages]);

  const [activeStage, setActiveStage] = useState<JobStageId>(firstPendingStage);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [stageSuccessFlash, setStageSuccessFlash] = useState<string | null>(null);
  const [completionSummary, setCompletionSummary] = useState<{
    paidAmount: number;
    extraSalaryBonus: number;
    coinsEarned: number;
    extraCoinBonus: number;
    extraXpEarned: number;
    message: string;
  } | null>(null);

  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(() => {
    const initial: ActivityLogItem[] = [
      {
        id: 'log-init',
        time: nowTimeStr(),
        text: `Shift dimulai: ${job.title} (${scaling.tierLabel})`,
        kind: 'info',
      },
    ];
    if (initialCompletedStages.length > 0) {
      initial.unshift({
        id: 'log-resume',
        time: nowTimeStr(),
        text: `Progres tersimpan dimuat (${initialCompletedStages.length}/${enabledStages.length} tahap selesai)`,
        kind: 'success',
      });
    }
    return initial;
  });

  const pushLog = useCallback((text: string, kind: 'info' | 'success' | 'warn' = 'info') => {
    setActivityLogs((prev) => [
      { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, time: nowTimeStr(), text, kind },
      ...prev.slice(0, 17),
    ]);
  }, []);

  const warnTimerRef = useRef<number | null>(null);
  const triggerWarning = useCallback(
    (msg: string) => {
      playWorkstationSfx('error', soundMuted);
      setWarningMsg(msg);
      pushLog(msg, 'warn');
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
      warnTimerRef.current = window.setTimeout(() => setWarningMsg(null), 2600);
    },
    [soundMuted, pushLog]
  );

  useEffect(() => {
    return () => {
      if (warnTimerRef.current) window.clearTimeout(warnTimerRef.current);
    };
  }, []);

  // ==========================================================================
  // STATE TAHAP 1: BENERIN KABEL PANEL LISTRIK (DRAG-AND-DROP SVG MELENGKUNG)
  // ==========================================================================
  const stage1Specs = useMemo(
    () => ALL_CABLE_SPECS.slice(0, scaling.cableCount),
    [scaling.cableCount]
  );
  const [leftPorts] = useState<CableColorSpec[]>(() => stage1Specs);
  const [rightPorts] = useState<CableColorSpec[]>(() => shuffleArray(stage1Specs));
  const [connectedCables, setConnectedCables] = useState<Record<string, boolean>>({});
  const [selectedLeftCable, setSelectedLeftCable] = useState<CableColorSpec['id'] | null>(null);
  const [draggingCable, setDraggingCable] = useState<{
    id: CableColorSpec['id'];
    startX: number;
    startY: number;
    currX: number;
    currY: number;
  } | null>(null);
  const [hoveredRightId, setHoveredRightId] = useState<CableColorSpec['id'] | null>(null);
  const [panelPoweredOn, setPanelPoweredOn] = useState(false);

  const cableBoardRef = useRef<HTMLDivElement | null>(null);
  const leftPortRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const rightPortRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [cableBoardRect, setCableBoardRect] = useState<{ width: number; height: number }>({
    width: 600,
    height: 360,
  });
  const [portAnchors, setPortAnchors] = useState<{
    left: Record<string, { x: number; y: number }>;
    right: Record<string, { x: number; y: number }>;
  }>({ left: {}, right: {} });

  const recomputePortAnchors = useCallback(() => {
    const board = cableBoardRef.current;
    if (!board) return;
    const bRect = board.getBoundingClientRect();
    if (bRect.width <= 0 || bRect.height <= 0) return;

    const nextLeft: Record<string, { x: number; y: number }> = {};
    const nextRight: Record<string, { x: number; y: number }> = {};

    leftPorts.forEach((p) => {
      const el = leftPortRefs.current[p.id];
      if (el) {
        const r = el.getBoundingClientRect();
        nextLeft[p.id] = {
          x: r.right - bRect.left - 4,
          y: r.top - bRect.top + r.height / 2,
        };
      }
    });

    rightPorts.forEach((p) => {
      const el = rightPortRefs.current[p.id];
      if (el) {
        const r = el.getBoundingClientRect();
        nextRight[p.id] = {
          x: r.left - bRect.left + 4,
          y: r.top - bRect.top + r.height / 2,
        };
      }
    });

    setCableBoardRect({ width: bRect.width, height: bRect.height });
    setPortAnchors({ left: nextLeft, right: nextRight });
  }, [leftPorts, rightPorts]);

  useEffect(() => {
    if (activeStage !== 1) return;
    const raf = window.requestAnimationFrame(recomputePortAnchors);
    const t = window.setTimeout(recomputePortAnchors, 120);
    window.addEventListener('resize', recomputePortAnchors);
    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(t);
      window.removeEventListener('resize', recomputePortAnchors);
    };
  }, [activeStage, recomputePortAnchors, leftPorts.length]);

  // ==========================================================================
  // STATE TAHAP 2: TAP-TAP SESUAI KETENTUAN
  // ==========================================================================
  const [stage2Clicks, setStage2Clicks] = useState<number>(() =>
    Math.min(effectiveTargetClicks, Math.max(0, initialStage2Clicks))
  );
  const [tapPulse, setTapPulse] = useState(false);

  // ==========================================================================
  // STATE TAHAP 3: VERIFIKASI OTP & ANGKA KLIRING BANK (4-6 DIGIT SCALED)
  // ==========================================================================
  const [otpChallenge] = useState(() => {
    const bank = BANK_CLEARING_CODES[Math.floor(Math.random() * BANK_CLEARING_CODES.length)];
    const min = Math.pow(10, scaling.otpLength - 1);
    const max = Math.pow(10, scaling.otpLength) - 1;
    const otp = String(Math.floor(min + Math.random() * (max - min + 1)));
    return { bank, otp };
  });
  const [selectedClearingCode, setSelectedClearingCode] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');

  // ==========================================================================
  // STATE TAHAP 4: KALIBRASI SLIDER SERVER & SINKRONISASI BRANKAS (2-3 SLIDER)
  // ==========================================================================
  const [sliderTargets] = useState(() => {
    const list = [
      { id: 'freq', label: 'Frekuensi Server Inti (MHz)', target: Math.floor(24 + Math.random() * 54) },
      { id: 'vault', label: 'Sinkronisasi Kunci Brankas (%)', target: Math.floor(24 + Math.random() * 54) },
    ];
    if (scaling.sliderCount >= 3) {
      list.push({
        id: 'voltage',
        label: 'Stabilisator Tegangan Cadangan (V)',
        target: Math.floor(24 + Math.random() * 54),
      });
    }
    return list;
  });
  const [sliderValues, setSliderValues] = useState<number[]>(() =>
    sliderTargets.map((_, idx) => (idx % 2 === 0 ? 14 : 86))
  );

  // ==========================================================================
  // STATE TAHAP 5: BIOMETRIK SIDIK JARI 100%
  // ==========================================================================
  const [bioPercent, setBioPercent] = useState<number>(0);
  const [isHoldingBio, setIsHoldingBio] = useState<boolean>(false);
  const bioIntervalRef = useRef<number | null>(null);
  const bioDoneRef = useRef<boolean>(false);

  // ==========================================================================
  // STATE TAHAP 6: CEK UANG PALSU SINAR UV-365nm
  // ==========================================================================
  const [uvLampOn, setUvLampOn] = useState<boolean>(false);
  const [uvBills] = useState<UvBanknoteItem[]>(() => {
    const items: UvBanknoteItem[] = [];
    const fakeIndices = new Set<number>();
    while (fakeIndices.size < Math.min(scaling.uvFakeCount, scaling.uvBillCount)) {
      fakeIndices.add(Math.floor(Math.random() * scaling.uvBillCount));
    }
    const issues = [
      'Benang UV putus & pendaran buram',
      'Tanda air pahlawan tidak berpendar UV',
      'Nomor seri mikro UV tidak cocok',
    ];
    for (let i = 0; i < scaling.uvBillCount; i++) {
      const isFake = fakeIndices.has(i);
      const denom = i % 2 === 0 ? 'Rp 100.000' : 'Rp 50.000';
      const prefix = isFake ? 'XP' : 'BN';
      const serial = `${prefix}${Math.floor(100000 + Math.random() * 899999)}`;
      items.push({
        id: `bill-${i}`,
        denomination: denom,
        serial,
        isFake,
        uvIssueLabel: isFake ? issues[i % issues.length] : 'Benang UV & tanda air resmi aktif',
      });
    }
    return items;
  });
  const [uvIndex, setUvIndex] = useState<number>(0);
  const [uvVerifiedCount, setUvVerifiedCount] = useState<number>(0);

  // ==========================================================================
  // STATE TAHAP 7: SORTIR DOKUMEN NASABAH
  // ==========================================================================
  const [sortDocs] = useState<SortDocumentItem[]>(() => {
    const pool = shuffleArray(DOCUMENT_POOL);
    return Array.from({ length: scaling.sortDocCount }, (_, idx) => {
      const src = pool[idx % pool.length];
      return {
        ...src,
        id: `doc-${idx}`,
        docNumber: `DOC-${job.requiredLevel.toString().padStart(2, '0')}${String(104 + idx * 17)}`,
      };
    });
  });
  const [sortIndex, setSortIndex] = useState<number>(0);

  // ==========================================================================
  // STATE TAHAP 8: STEMPEL PERSETUJUAN RESMI
  // ==========================================================================
  const [stampDocs, setStampDocs] = useState<StampDocumentItem[]>(() => {
    const titles = [
      'Formulir Persetujuan Kliring Cabang',
      'Otorisasi Pencairan Dana Operasional',
      'Sertifikat Verifikasi Kas Harian',
      'Persetujuan Transfer Antar-Bank Prioritas',
      'Berita Acara Pengesahan Brankas Utama',
    ];
    return Array.from({ length: scaling.stampDocCount }, (_, idx) => ({
      id: `stamp-${idx}`,
      refNo: `SK-BN-${String(202601 + job.requiredLevel * 10 + idx)}`,
      title: titles[idx % titles.length],
      amount: Math.max(500_000, Math.round((job.salary * (idx + 2)) / 2)),
      officer: job.department,
      stamped: false,
    }));
  });
  const [stampIndex, setStampIndex] = useState<number>(0);
  const [stampJustHit, setStampJustHit] = useState<boolean>(false);

  // ==========================================================================
  // STATE TAHAP 9: AUDIT BUKU BESAR (LEDGER)
  // ==========================================================================
  const [auditRows, setAuditRows] = useState<LedgerAuditRow[]>(() => {
    const labels = [
      'Setoran Tunai Teller Utama',
      'Kliring Masuk Antar-Bank',
      'Biaya Administrasi Giro',
      'Pencairan Deposito Nasabah',
      'Transaksi Valas Cabang',
      'Rekonsiliasi Kas ATM',
      'Bunga Simpanan Prioritas',
    ];
    const errorIndices = new Set<number>();
    while (errorIndices.size < Math.min(scaling.auditErrorCount, scaling.auditRowCount)) {
      errorIndices.add(Math.floor(Math.random() * scaling.auditRowCount));
    }
    return Array.from({ length: scaling.auditRowCount }, (_, idx) => {
      const debit = (Math.floor(Math.random() * 14) + 4) * 250_000;
      const credit = (Math.floor(Math.random() * 6) + 1) * 150_000;
      const expectedNet = debit - credit;
      const hasError = errorIndices.has(idx);
      const offset = (idx % 2 === 0 ? 1 : -1) * (Math.floor(Math.random() * 3) + 1) * 100_000;
      return {
        id: `led-${idx}`,
        code: `JRN-${String(410 + idx)}`,
        label: labels[idx % labels.length],
        debit,
        credit,
        recordedNet: hasError ? expectedNet + offset : expectedNet,
        expectedNet,
        hasError,
        fixed: false,
      };
    });
  });

  // ==========================================================================
  // STATE TAHAP 10: KIRIM LAPORAN AKHIR & PENCAIRAN GAJI
  // ==========================================================================
  const reportChecklist = useMemo(
    () => REPORT_CHECKLIST_POOL.slice(0, scaling.reportCheckCount),
    [scaling.reportCheckCount]
  );
  const [checkedReports, setCheckedReports] = useState<Record<number, boolean>>({});
  const allReportsChecked = reportChecklist.every((_, idx) => Boolean(checkedReports[idx]));

  // ==========================================================================
  // PENYELESAIAN TAHAP & PENCAIRAN FINAL
  // ==========================================================================
  const finalizeWholeJob = useCallback(
    (instantMode: boolean, useVoucher: boolean, count: number) => {
      const res = onCompleteJob({
        instantMode,
        useVoucher,
        completedStagesCount: count,
      });
      if (!res.success) {
        triggerWarning(res.message);
        return;
      }
      playWorkstationSfx('complete', soundMuted);
      pushLog(
        instantMode
          ? `Selesai Instan 1-Klik berhasil — gaji ${formatRupiah(res.paidAmount || baseSalary)} cair.`
          : `Seluruh ${count} tahap tuntas — gaji ${formatRupiah(res.paidAmount || baseSalary)} cair otomatis!`,
        'success'
      );
      setCompletionSummary({
        paidAmount: res.paidAmount ?? baseSalary,
        extraSalaryBonus: res.extraSalaryBonus ?? 0,
        coinsEarned: res.coinsEarned ?? baseCoins,
        extraCoinBonus: res.extraCoinBonus ?? 0,
        extraXpEarned: res.extraXpEarned ?? config.extraAccountXpBonus,
        message: res.message,
      });
    },
    [onCompleteJob, triggerWarning, baseSalary, baseCoins, config.extraAccountXpBonus, soundMuted, pushLog]
  );

  const markStageCompleted = useCallback(
    (stageId: JobStageId, nextClicks?: number, customDelayMs = 620) => {
      const nextCompleted = Array.from(new Set([...completedStages, stageId])).sort(
        (a, b) => a - b
      ) as JobStageId[];
      setCompletedStages(nextCompleted);
      saveJobStageProgress(accountId, job.id, nextCompleted, nextClicks ?? stage2Clicks);
      onStageProgressSaved(nextCompleted, nextClicks ?? stage2Clicks);

      const meta = JOB_FIVE_STAGE_CATALOG.find((s) => s.id === stageId);
      const doneMsg = meta ? `${meta.shortLabel} (Tahap ${stageId}) selesai.` : `Tahap ${stageId} selesai.`;
      pushLog(doneMsg, 'success');
      playWorkstationSfx('stage_ok', soundMuted);
      setStageSuccessFlash(doneMsg);
      window.setTimeout(() => setStageSuccessFlash(null), 1300);

      const nextPending = enabledStages.find((s) => !nextCompleted.includes(s));
      if (!nextPending) {
        finalizeWholeJob(false, false, nextCompleted.length);
      } else {
        window.setTimeout(() => {
          setActiveStage(nextPending);
        }, customDelayMs);
      }
    },
    [
      completedStages,
      accountId,
      job.id,
      stage2Clicks,
      onStageProgressSaved,
      enabledStages,
      finalizeWholeJob,
      pushLog,
      soundMuted,
    ]
  );

  // ==========================================================================
  // HANDLER TAHAP 1: DRAG-AND-DROP KABEL MELENGKUNG (MOUSE & SENTUH)
  // ==========================================================================
  const attemptConnectCable = useCallback(
    (leftId: CableColorSpec['id'], rightId: CableColorSpec['id']) => {
      if (connectedCables[leftId] || panelPoweredOn) return;
      if (leftId !== rightId) {
        const leftSpec = ALL_CABLE_SPECS.find((c) => c.id === leftId);
        const rightSpec = ALL_CABLE_SPECS.find((c) => c.id === rightId);
        triggerWarning(
          `Port tidak cocok (${leftSpec?.label} ke ${rightSpec?.label}). Tarik ke soket warna ${leftSpec?.label}.`
        );
        setSelectedLeftCable(null);
        return;
      }

      playWorkstationSfx('connect', soundMuted);
      const nextMap = { ...connectedCables, [leftId]: true };
      setConnectedCables(nextMap);
      setSelectedLeftCable(null);
      const spec = ALL_CABLE_SPECS.find((c) => c.id === leftId);
      pushLog(`Jalur ${spec?.portCode || leftId} (${spec?.label}) tersambung · LED aktif`, 'info');

      if (Object.keys(nextMap).length >= leftPorts.length) {
        setPanelPoweredOn(true);
        pushLog(`Seluruh ${leftPorts.length} kabel tersambung · Lampu panel hijau menyala penuh`, 'success');
        markStageCompleted(1, undefined, 900);
      }
    },
    [connectedCables, panelPoweredOn, triggerWarning, soundMuted, pushLog, leftPorts.length, markStageCompleted]
  );

  const handleLeftPortPointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    portId: CableColorSpec['id']
  ) => {
    if (connectedCables[portId] || panelPoweredOn) return;
    e.preventDefault();
    recomputePortAnchors();
    const board = cableBoardRef.current;
    if (!board) return;
    const bRect = board.getBoundingClientRect();
    const anchor = portAnchors.left[portId] || {
      x: e.clientX - bRect.left,
      y: e.clientY - bRect.top,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore if unsupported
    }
    setSelectedLeftCable(portId);
    setDraggingCable({
      id: portId,
      startX: anchor.x,
      startY: anchor.y,
      currX: e.clientX - bRect.left,
      currY: e.clientY - bRect.top,
    });
    playWorkstationSfx('click', soundMuted);
  };

  const handleLeftPortPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingCable) return;
    const board = cableBoardRef.current;
    if (!board) return;
    const bRect = board.getBoundingClientRect();
    const x = e.clientX - bRect.left;
    const y = e.clientY - bRect.top;
    setDraggingCable((prev) => (prev ? { ...prev, currX: x, currY: y } : null));

    // Deteksi soket kanan terdekat dalam radius 42px
    let matchedHover: CableColorSpec['id'] | null = null;
    for (const rp of rightPorts) {
      if (connectedCables[rp.id]) continue;
      const el = rightPortRefs.current[rp.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left - 18 &&
        e.clientX <= r.right + 18 &&
        e.clientY >= r.top - 14 &&
        e.clientY <= r.bottom + 14
      ) {
        matchedHover = rp.id;
        break;
      }
    }
    setHoveredRightId(matchedHover);
  };

  const handleLeftPortPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingCable) return;
    const activeId = draggingCable.id;

    // Cari soket kanan tempat pointer dilepas
    let droppedRightId: CableColorSpec['id'] | null = null;
    for (const rp of rightPorts) {
      if (connectedCables[rp.id]) continue;
      const el = rightPortRefs.current[rp.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (
        e.clientX >= r.left - 22 &&
        e.clientX <= r.right + 22 &&
        e.clientY >= r.top - 16 &&
        e.clientY <= r.bottom + 16
      ) {
        droppedRightId = rp.id;
        break;
      }
    }

    setDraggingCable(null);
    setHoveredRightId(null);

    if (droppedRightId) {
      attemptConnectCable(activeId, droppedRightId);
    }
  };

  const handleRightPortClickFallback = (rightId: CableColorSpec['id']) => {
    if (connectedCables[rightId] || panelPoweredOn) return;
    if (!selectedLeftCable) {
      triggerWarning('Tarik ujung kabel dari soket kiri ke soket kanan yang warnanya cocok.');
      return;
    }
    attemptConnectCable(selectedLeftCable, rightId);
  };

  // ==========================================================================
  // HANDLER TAHAP 2: TAP-TAP
  // ==========================================================================
  const handleStage2Tap = () => {
    if (stage2Clicks >= effectiveTargetClicks) return;
    const next = Math.min(effectiveTargetClicks, stage2Clicks + Math.max(1, clickPower));
    setStage2Clicks(next);
    setTapPulse(true);
    playWorkstationSfx('click', soundMuted);
    window.setTimeout(() => setTapPulse(false), 110);

    if (next >= effectiveTargetClicks) {
      markStageCompleted(2, next);
    } else if (next % Math.max(3, clickPower * 3) === 0) {
      saveJobStageProgress(accountId, job.id, completedStages, next);
      onStageProgressSaved(completedStages, next);
    }
  };

  // ==========================================================================
  // HANDLER TAHAP 3: OTP & KLIRING
  // ==========================================================================
  const handleOtpKey = (digit: string) => {
    if (otpInput.length >= scaling.otpLength) return;
    playWorkstationSfx('click', soundMuted);
    setOtpInput((prev) => prev + digit);
  };

  const handleVerifyStage3 = () => {
    if (selectedClearingCode !== otpChallenge.bank.code) {
      triggerWarning(`Kode kliring bank belum sesuai. Pilih kode ${otpChallenge.bank.code}.`);
      return;
    }
    if (otpInput !== otpChallenge.otp) {
      triggerWarning(`Kode OTP ${scaling.otpLength} digit salah. Periksa ulang kode keamanan lalu coba lagi.`);
      setOtpInput('');
      return;
    }
    markStageCompleted(3);
  };

  // ==========================================================================
  // HANDLER TAHAP 4: SLIDER KALIBRASI
  // ==========================================================================
  const slidersAligned = sliderTargets.every(
    (st, idx) => Math.abs((sliderValues[idx] ?? 0) - st.target) <= scaling.sliderTolerance
  );

  const handleVerifyStage4 = () => {
    if (!slidersAligned) {
      triggerWarning(
        `Seluruh ${sliderTargets.length} slider harus berada tepat di zona hijau (±${scaling.sliderTolerance}) sebelum sinkronisasi.`
      );
      return;
    }
    markStageCompleted(4);
  };

  // ==========================================================================
  // HANDLER TAHAP 5: BIOMETRIK SIDIK JARI 100%
  // ==========================================================================
  const stopBioHold = useCallback(() => {
    setIsHoldingBio(false);
    if (bioIntervalRef.current) {
      window.clearInterval(bioIntervalRef.current);
      bioIntervalRef.current = null;
    }
    setBioPercent((prev) => (prev >= 100 ? 100 : Math.max(0, prev - 15)));
  }, []);

  const startBioHold = () => {
    if (bioDoneRef.current) return;
    setIsHoldingBio(true);
    playWorkstationSfx('click', soundMuted);
    if (bioIntervalRef.current) window.clearInterval(bioIntervalRef.current);
    const stepMs = 45;
    const stepGain = Math.max(1.8, (100 / scaling.biometricHoldMs) * stepMs);
    bioIntervalRef.current = window.setInterval(() => {
      setBioPercent((prev) => {
        const next = Math.min(100, prev + stepGain);
        if (next >= 100 && !bioDoneRef.current) {
          bioDoneRef.current = true;
          if (bioIntervalRef.current) {
            window.clearInterval(bioIntervalRef.current);
            bioIntervalRef.current = null;
          }
          setIsHoldingBio(false);
          window.setTimeout(() => markStageCompleted(5), 140);
        }
        return next;
      });
    }, stepMs);
  };

  useEffect(() => {
    return () => {
      if (bioIntervalRef.current) window.clearInterval(bioIntervalRef.current);
    };
  }, []);

  // ==========================================================================
  // HANDLER TAHAP 6: CEK UANG PALSU UV
  // ==========================================================================
  const currentUvBill = uvBills[uvIndex];
  const handleClassifyUvBill = (markAsFake: boolean) => {
    if (!currentUvBill) return;
    if (!uvLampOn) {
      triggerWarning('Nyalakan Lampu Sinar UV-365nm terlebih dahulu agar tanda air keamanan terlihat.');
      return;
    }
    if (markAsFake !== currentUvBill.isFake) {
      triggerWarning(
        currentUvBill.isFake
          ? `Lembar ${currentUvBill.serial} terindikasi PALSU (${currentUvBill.uvIssueLabel}). Pilih Sita (Palsu).`
          : `Lembar ${currentUvBill.serial} adalah uang ASLI dengan tanda air resmi. Pilih Lolos (Asli).`
      );
      return;
    }
    playWorkstationSfx('connect', soundMuted);
    const nextDone = uvVerifiedCount + 1;
    setUvVerifiedCount(nextDone);
    pushLog(
      `UV ${currentUvBill.serial}: ${currentUvBill.isFake ? 'Uang palsu disita' : 'Uang asli terverifikasi'}`,
      'info'
    );
    if (uvIndex + 1 >= uvBills.length) {
      markStageCompleted(6);
    } else {
      setUvIndex((prev) => prev + 1);
    }
  };

  // ==========================================================================
  // HANDLER TAHAP 7: SORTIR DOKUMEN NASABAH
  // ==========================================================================
  const currentSortDoc = sortDocs[sortIndex];
  const handleSortDocument = (dept: SortDepartment) => {
    if (!currentSortDoc) return;
    if (dept !== currentSortDoc.department) {
      const targetLabel =
        SORT_DEPARTMENTS.find((d) => d.id === currentSortDoc.department)?.label || currentSortDoc.department;
      triggerWarning(`Laci divisi kurang tepat. Berkas ${currentSortDoc.docNumber} termasuk ${targetLabel}.`);
      return;
    }
    playWorkstationSfx('connect', soundMuted);
    pushLog(`Berkas ${currentSortDoc.docNumber} masuk ke laci ${dept.toUpperCase()}`, 'info');
    if (sortIndex + 1 >= sortDocs.length) {
      markStageCompleted(7);
    } else {
      setSortIndex((prev) => prev + 1);
    }
  };

  // ==========================================================================
  // HANDLER TAHAP 8: STEMPEL PERSETUJUAN RESMI
  // ==========================================================================
  const currentStampDoc = stampDocs[stampIndex];
  const handleApplyOfficialStamp = () => {
    if (!currentStampDoc || currentStampDoc.stamped) return;
    playWorkstationSfx('stamp', soundMuted);
    setStampJustHit(true);
    setStampDocs((prev) =>
      prev.map((d, idx) => (idx === stampIndex ? { ...d, stamped: true } : d))
    );
    pushLog(`Stempel resmi dibubuhkan pada ${currentStampDoc.refNo}`, 'info');
    window.setTimeout(() => {
      setStampJustHit(false);
      if (stampIndex + 1 >= stampDocs.length) {
        markStageCompleted(8);
      } else {
        setStampIndex((prev) => prev + 1);
      }
    }, 520);
  };

  // ==========================================================================
  // HANDLER TAHAP 9: AUDIT BUKU BESAR (LEDGER)
  // ==========================================================================
  const handleAuditRowAction = (row: LedgerAuditRow) => {
    if (row.fixed) return;
    if (!row.hasError) {
      triggerWarning(`Baris ${row.code} sudah seimbang (${formatRupiah(row.expectedNet)}). Cari baris yang selisih.`);
      return;
    }
    playWorkstationSfx('connect', soundMuted);
    const nextRows = auditRows.map((r) =>
      r.id === row.id ? { ...r, recordedNet: r.expectedNet, fixed: true } : r
    );
    setAuditRows(nextRows);
    pushLog(`Audit ${row.code} dikoreksi ke ${formatRupiah(row.expectedNet)}`, 'info');
    const remainingErrors = nextRows.filter((r) => r.hasError && !r.fixed).length;
    if (remainingErrors === 0) {
      markStageCompleted(9);
    }
  };

  // ==========================================================================
  // HANDLER TAHAP 10: KIRIM LAPORAN AKHIR
  // ==========================================================================
  const handleSubmitFinalReport = () => {
    if (!allReportsChecked) {
      triggerWarning('Centang seluruh poin pemeriksaan penutupan shift sebelum mengirim laporan akhir.');
      return;
    }
    markStageCompleted(10, undefined, 250);
  };

  // ==========================================================================
  // HITUNG PRATINJAU HADIAH TOTAL (10 TAHAP + TIER BONUS)
  // ==========================================================================
  const stageExtraSalaryPreview = Math.round(
    (baseSalary * Math.max(0, config.extraSalaryBonusPercent)) / 100
  );
  const tierBonusSalaryPreview = Math.round((baseSalary * scaling.tierBonusPercent) / 100);
  const totalExtraSalaryPreview = stageExtraSalaryPreview + tierBonusSalaryPreview;
  const tierCoinBonusPreview = Math.max(0, (Math.max(1, job.requiredLevel) - 1) * 2);
  const tierXpBonusPreview = Math.max(0, (Math.max(1, job.requiredLevel) - 1) * 5);
  const totalCoinPreview = baseCoins + config.extraCoinBonus + tierCoinBonusPreview;
  const totalXpPreview = config.extraAccountXpBonus + tierXpBonusPreview;

  const activeStageMeta =
    JOB_FIVE_STAGE_CATALOG.find((s) => s.id === activeStage) || JOB_FIVE_STAGE_CATALOG[0];

  const canInstantFree = isAdminCard;
  const canInstantVoucher = !isAdminCard && (isVoucherInfinity || userVouchers > 0);

  // Helper membuat jalur Bezier kabel melengkung realistis
  const buildCurvedWirePath = (x1: number, y1: number, x2: number, y2: number, sag = 26) => {
    const dx = Math.abs(x2 - x1);
    const ctrl = Math.max(46, dx * 0.45);
    const midYOffset = Math.min(sag, Math.max(10, dx * 0.08));
    return `M ${x1} ${y1} C ${x1 + ctrl} ${y1 + midYOffset}, ${x2 - ctrl} ${y2 + midYOffset}, ${x2} ${y2}`;
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#040812]/95 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-6xl bg-[#0a1020] border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[96dvh]">
        {/* TOP WORKSTATION HEADER */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 bg-[#070c18] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
              <span className="text-cyan-300 font-semibold">Workstation Bank Profesional</span>
              <span aria-hidden="true">·</span>
              <span>{scaling.tierLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{scaling.cableCount} Kabel 1x</span>
            </div>
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate mt-0.5">
              {job.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundMuted((prev) => !prev)}
              className="min-w-[38px] min-h-[38px] rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer"
              title={soundMuted ? 'Aktifkan suara workstation' : 'Bisukan suara workstation'}
              aria-label={soundMuted ? 'Aktifkan suara' : 'Bisukan suara'}
            >
              {soundMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-300" />}
            </button>

            {!completionSummary && (canInstantFree || canInstantVoucher) && (
              <button
                type="button"
                onClick={() => finalizeWholeJob(true, !canInstantFree, enabledStages.length)}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                {canInstantFree ? (
                  <>
                    <Crown className="w-4 h-4 shrink-0" />
                    <span>Selesai Instan (Admin)</span>
                  </>
                ) : (
                  <>
                    <Ticket className="w-4 h-4 shrink-0" />
                    <span>Selesai Instan (1 Voucher)</span>
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="min-w-[38px] min-h-[38px] rounded-xl bg-slate-900 hover:bg-rose-950/70 border border-slate-700 hover:border-rose-500/50 text-slate-300 hover:text-rose-200 flex items-center justify-center cursor-pointer"
              aria-label="Tutup layar workstation"
              title="Simpan progres & tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 10-STAGE PROGRESS STEPPER */}
        <div className="px-4 py-2.5 sm:px-6 bg-[#080e1c] border-b border-slate-800 shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-max">
            {enabledStages.map((stageId, idx) => {
              const meta = JOB_FIVE_STAGE_CATALOG.find((s) => s.id === stageId);
              const isDone = completedStages.includes(stageId);
              const isActive = activeStage === stageId && !completionSummary;
              return (
                <button
                  key={stageId}
                  type="button"
                  onClick={() => {
                    if (!completionSummary && (isDone || stageId === firstPendingStage)) {
                      setActiveStage(stageId);
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                    isDone
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200 cursor-pointer'
                      : isActive
                      ? 'bg-cyan-500/15 border-cyan-400 text-white cursor-pointer'
                      : 'bg-slate-900/70 border-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span className="font-mono tabular-nums text-[10px]">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  <span>{meta?.shortLabel || `Tahap ${stageId}`}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* MAIN WORKSTATION BODY (2-COLUMN ON DESKTOP) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 min-h-0">
          {/* LEFT: INTERACTIVE WORKBENCH (8 COLS) */}
          <div className="lg:col-span-8 p-4 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-slate-800">
            {/* Warning / Stage Flash */}
            {warningMsg && (
              <div className="rounded-xl bg-amber-950/70 border border-amber-500/60 px-3.5 py-2.5 text-xs font-semibold text-amber-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{warningMsg}</span>
              </div>
            )}
            {stageSuccessFlash && !completionSummary && (
              <div className="rounded-xl bg-emerald-950/70 border border-emerald-500/60 px-3.5 py-2.5 text-xs font-semibold text-emerald-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{stageSuccessFlash}</span>
              </div>
            )}

            {/* COMPLETION SUMMARY */}
            {completionSummary ? (
              <div className="rounded-2xl bg-slate-900 border border-emerald-500/50 p-6 sm:p-8 text-center space-y-5">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-400/50 flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Seluruh {enabledStages.length} Tahap Kerja Tuntas
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                    {completionSummary.message}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                    <span className="text-[11px] text-slate-400 block">Total Gaji Cair</span>
                    <span className="text-lg font-black text-emerald-400 font-mono tabular-nums block mt-1">
                      {formatRupiah(completionSummary.paidAmount)}
                    </span>
                    <span className="text-[11px] text-emerald-300/80 font-mono tabular-nums">
                      Termasuk bonus +{formatRupiah(completionSummary.extraSalaryBonus)}
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                    <span className="text-[11px] text-slate-400 block">Total Coin Masuk</span>
                    <span className="text-lg font-black text-amber-300 font-mono tabular-nums block mt-1">
                      +{completionSummary.coinsEarned.toLocaleString('id-ID')} Coin
                    </span>
                    <span className="text-[11px] text-amber-300/80 font-mono tabular-nums">
                      Bonus 10 tahap &amp; tier +{completionSummary.extraCoinBonus} Coin
                    </span>
                  </div>
                  <div className="rounded-xl bg-slate-950 border border-slate-800 p-4">
                    <span className="text-[11px] text-slate-400 block">XP Level Akun</span>
                    <span className="text-lg font-black text-cyan-300 font-mono tabular-nums block mt-1">
                      +{completionSummary.extraXpEarned.toLocaleString('id-ID')} XP
                    </span>
                    <span className="text-[11px] text-cyan-300/80">
                      Progres naik level akun aktif
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm cursor-pointer"
                >
                  Kembali ke Daftar Pekerjaan
                </button>
              </div>
            ) : (
              <>
                {/* ACTIVE STAGE TITLE BAR */}
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <p className="text-xs font-mono text-cyan-300">{activeStageMeta.stationDevice}</p>
                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-0.5">
                      {activeStageMeta.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{activeStageMeta.subtitle}</p>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-slate-300 shrink-0">
                    Progres: {completedStages.length}/{enabledStages.length}
                  </span>
                </div>

                {/* =========================================================
                    TAHAP 1: BENERIN KABEL PANEL LISTRIK REALISTIS (DRAG-AND-DROP)
                   ========================================================= */}
                {activeStage === 1 && (
                  <div className="rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-slate-700 p-4 sm:p-5 shadow-inner relative">
                    {/* Baut sudut casing metalik */}
                    <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-700/80">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-700 flex items-center justify-center">
                          <Cable className="w-4 h-4 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-100">
                            Panel Distribusi {scaling.cableCount} Jalur ({scaling.tierLabel})
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Tarik ujung kabel dari soket kiri ke soket kanan yang warnanya cocok.
                          </p>
                        </div>
                      </div>

                      {/* Lampu Indikator Daya Panel Utama */}
                      <div
                        className={`px-3 py-1.5 rounded-lg border font-mono text-[11px] font-bold inline-flex items-center gap-2 shrink-0 ${
                          panelPoweredOn
                            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-300'
                            : 'bg-slate-950 border-slate-700 text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            panelPoweredOn
                              ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                              : 'bg-amber-400/80'
                          }`}
                        />
                        <span className="tabular-nums">
                          {panelPoweredOn
                            ? 'PANEL HIJAU · AKTIF'
                            : `${Object.keys(connectedCables).length}/${leftPorts.length} TERHUBUNG`}
                        </span>
                      </div>
                    </div>

                    {/* AREA PANEL KABEL DENGAN SVG KURVA MELENGKUNG */}
                    <div
                      ref={cableBoardRef}
                      className="relative rounded-xl bg-[#070b14] border border-slate-800 p-3 sm:p-4 select-none touch-none"
                    >
                      {/* Layer SVG kabel melengkung */}
                      <svg
                        className="absolute inset-0 w-full h-full pointer-events-none z-10"
                        viewBox={`0 0 ${cableBoardRect.width} ${cableBoardRect.height}`}
                        preserveAspectRatio="none"
                      >
                        {/* Kabel yang sudah tersambung */}
                        {leftPorts.map((p, idx) => {
                          if (!connectedCables[p.id]) return null;
                          const a = portAnchors.left[p.id];
                          const b = portAnchors.right[p.id];
                          if (!a || !b) return null;
                          const d = buildCurvedWirePath(a.x, a.y, b.x, b.y, 18 + (idx % 3) * 8);
                          return (
                            <g key={`wire-${p.id}`}>
                              <path
                                d={d}
                                fill="none"
                                stroke="#020617"
                                strokeWidth="11"
                                strokeLinecap="round"
                                opacity="0.8"
                              />
                              <path
                                d={d}
                                fill="none"
                                stroke={p.hex}
                                strokeWidth="7"
                                strokeLinecap="round"
                              />
                              <path
                                d={d}
                                fill="none"
                                stroke={p.highlightHex}
                                strokeWidth="2"
                                strokeLinecap="round"
                                opacity="0.65"
                              />
                            </g>
                          );
                        })}

                        {/* Kabel yang sedang ditarik oleh mouse/jari */}
                        {draggingCable && (() => {
                          const spec = ALL_CABLE_SPECS.find((c) => c.id === draggingCable.id);
                          if (!spec) return null;
                          const d = buildCurvedWirePath(
                            draggingCable.startX,
                            draggingCable.startY,
                            draggingCable.currX,
                            draggingCable.currY,
                            24
                          );
                          return (
                            <g>
                              <path
                                d={d}
                                fill="none"
                                stroke="#020617"
                                strokeWidth="11"
                                strokeLinecap="round"
                                opacity="0.75"
                              />
                              <path
                                d={d}
                                fill="none"
                                stroke={spec.hex}
                                strokeWidth="7"
                                strokeLinecap="round"
                              />
                              <path
                                d={d}
                                fill="none"
                                stroke={spec.highlightHex}
                                strokeWidth="2"
                                strokeLinecap="round"
                                opacity="0.8"
                              />
                              <circle
                                cx={draggingCable.currX}
                                cy={draggingCable.currY}
                                r="7"
                                fill="#fbbf24"
                                stroke="#0f172a"
                                strokeWidth="2"
                              />
                            </g>
                          );
                        })()}
                      </svg>

                      <div className="relative z-20 flex items-stretch justify-between gap-12 sm:gap-24">
                        {/* KOLOM SOKET KIRI (SUMBER KABEL) */}
                        <div className="flex flex-col justify-between gap-2.5 w-[44%] sm:w-[38%]">
                          {leftPorts.map((port) => {
                            const isConnected = Boolean(connectedCables[port.id]);
                            const isDraggingThis = draggingCable?.id === port.id;
                            const isSelected = selectedLeftCable === port.id;
                            return (
                              <button
                                key={`left-${port.id}`}
                                ref={(el) => {
                                  leftPortRefs.current[port.id] = el;
                                }}
                                type="button"
                                disabled={isConnected}
                                onPointerDown={(e) => handleLeftPortPointerDown(e, port.id)}
                                onPointerMove={handleLeftPortPointerMove}
                                onPointerUp={handleLeftPortPointerUp}
                                onPointerCancel={() => {
                                  setDraggingCable(null);
                                  setHoveredRightId(null);
                                }}
                                className={`min-h-[46px] px-2.5 sm:px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-colors touch-none ${
                                  isConnected
                                    ? 'bg-slate-900/90 border-emerald-500/60 opacity-95 cursor-default'
                                    : isDraggingThis || isSelected
                                    ? 'bg-slate-800 border-cyan-400 ring-2 ring-cyan-400/40 cursor-grabbing'
                                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 cursor-grab'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isConnected
                                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                                          : 'bg-slate-600'
                                      }`}
                                    />
                                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-200 truncate">
                                      {port.portCode}
                                    </span>
                                  </div>
                                  <span className={`text-[10px] font-semibold block ${port.textClass}`}>
                                    {port.label} · {port.voltage}
                                  </span>
                                </div>

                                <span
                                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 shrink-0 flex items-center justify-center ${port.bgClass} ${port.borderClass}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-slate-950/70" />
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* KOLOM SOKET KANAN (PORT TUJUAN) */}
                        <div className="flex flex-col justify-between gap-2.5 w-[44%] sm:w-[38%]">
                          {rightPorts.map((port) => {
                            const isConnected = Boolean(connectedCables[port.id]);
                            const isHovered = hoveredRightId === port.id;
                            return (
                              <button
                                key={`right-${port.id}`}
                                ref={(el) => {
                                  rightPortRefs.current[port.id] = el;
                                }}
                                type="button"
                                disabled={isConnected}
                                onClick={() => handleRightPortClickFallback(port.id)}
                                className={`min-h-[46px] px-2.5 sm:px-3 py-2 rounded-xl border text-right flex items-center justify-between gap-2 transition-colors touch-none ${
                                  isConnected
                                    ? 'bg-slate-900/90 border-emerald-500/60 opacity-95 cursor-default'
                                    : isHovered
                                    ? 'bg-slate-800 border-amber-400 ring-2 ring-amber-400/50'
                                    : 'bg-slate-900 hover:bg-slate-800 border-slate-700 cursor-pointer'
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 shrink-0 flex items-center justify-center ${port.bgClass} ${port.borderClass}`}
                                >
                                  <span className="w-2 h-2 rounded-full bg-slate-950/70" />
                                </span>

                                <div className="min-w-0">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-200 truncate">
                                      {port.portCode}
                                    </span>
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${
                                        isConnected
                                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                                          : 'bg-slate-600'
                                      }`}
                                    />
                                  </div>
                                  <span className={`text-[10px] font-semibold block ${port.textClass}`}>
                                    Soket {port.label}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 2: TAP-TAP TRANSAKSI SESUAI KETENTUAN
                   ========================================================= */}
                {activeStage === 2 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-5 text-center">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-300">
                      <span>Target Ketukan Lowongan</span>
                      <span className="text-cyan-300 font-bold">
                        {stage2Clicks.toLocaleString('id-ID')} / {effectiveTargetClicks.toLocaleString('id-ID')} (+{clickPower}/tap)
                      </span>
                    </div>

                    <div className="w-full h-3.5 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-150"
                        style={{
                          width: `${Math.min(100, Math.round((stage2Clicks / Math.max(1, effectiveTargetClicks)) * 100))}%`,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleStage2Tap}
                      className={`w-full max-w-sm mx-auto min-h-[120px] rounded-2xl border-2 border-cyan-400/70 bg-gradient-to-b from-cyan-500/20 to-slate-950 hover:from-cyan-500/30 text-white font-black text-base flex flex-col items-center justify-center gap-2 cursor-pointer transition-transform duration-75 select-none touch-manipulation ${
                        tapPulse ? 'scale-[0.97]' : 'scale-100'
                      }`}
                    >
                      <MousePointerClick className="w-8 h-8 text-cyan-300" />
                      <span>PROSES TRANSAKSI (TAP)</span>
                      <span className="text-xs font-mono text-cyan-200 tabular-nums">
                        Sisa {Math.max(0, effectiveTargetClicks - stage2Clicks).toLocaleString('id-ID')} ketukan
                      </span>
                    </button>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 3: VERIFIKASI OTP & ANGKA KLIRING BANK
                   ========================================================= */}
                {activeStage === 3 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                        <span className="text-[11px] text-slate-400 block">Kode Bank Kliring Tujuan</span>
                        <span className="text-base font-black text-amber-300 font-mono tabular-nums mt-1 block">
                          {otpChallenge.bank.label}
                        </span>
                      </div>
                      <div className="rounded-xl bg-slate-950 border border-slate-800 p-3.5">
                        <span className="text-[11px] text-slate-400 block">
                          Kode OTP Keamanan ({scaling.otpLength} Digit)
                        </span>
                        <span className="text-xl font-black text-cyan-300 font-mono tracking-[0.25em] tabular-nums mt-1 block">
                          {otpChallenge.otp}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">
                        1. Pilih Bank Kliring yang Sesuai
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {BANK_CLEARING_CODES.map((bank) => (
                          <button
                            key={bank.code}
                            type="button"
                            onClick={() => {
                              playWorkstationSfx('click', soundMuted);
                              setSelectedClearingCode(bank.code);
                            }}
                            className={`min-h-[42px] px-3 py-2 rounded-xl border text-xs font-mono font-bold text-left cursor-pointer transition-colors ${
                              selectedClearingCode === bank.code
                                ? 'bg-cyan-500/20 border-cyan-400 text-white'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            {bank.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300">
                          2. Masukkan {scaling.otpLength} Digit OTP
                        </span>
                        <span className="font-mono text-sm font-black tracking-[0.25em] text-white tabular-nums">
                          {otpInput.padEnd(scaling.otpLength, '•')}
                        </span>
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => handleOtpKey(d)}
                            className="min-h-[42px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white font-mono font-bold text-sm cursor-pointer"
                          >
                            {d}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setOtpInput((p) => p.slice(0, -1))}
                          className="min-h-[42px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-amber-300 flex items-center justify-center cursor-pointer"
                          aria-label="Hapus 1 digit"
                        >
                          <Delete className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpInput('')}
                          className="min-h-[42px] rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center cursor-pointer"
                          aria-label="Ulangi input OTP"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyStage3}
                      className="w-full min-h-[44px] rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verifikasi OTP &amp; Kode Kliring</span>
                    </button>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 4: KALIBRASI SLIDER SERVER & BRANKAS (2-3 SLIDER)
                   ========================================================= */}
                {activeStage === 4 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
                    <p className="text-xs text-slate-300">
                      Geser seluruh {sliderTargets.length} kontrol hingga masuk zona hijau (toleransi ±{scaling.sliderTolerance}).
                    </p>

                    <div className="space-y-4">
                      {sliderTargets.map((st, idx) => {
                        const val = sliderValues[idx] ?? 0;
                        const isAligned = Math.abs(val - st.target) <= scaling.sliderTolerance;
                        const minBand = Math.max(0, st.target - scaling.sliderTolerance);
                        const bandWidth = Math.min(100 - minBand, scaling.sliderTolerance * 2);
                        return (
                          <div
                            key={st.id}
                            className={`rounded-xl border p-3.5 space-y-2.5 ${
                              isAligned
                                ? 'bg-emerald-950/30 border-emerald-500/60'
                                : 'bg-slate-950 border-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-xs">
                              <span className="font-semibold text-slate-200">{st.label}</span>
                              <span
                                className={`font-mono font-bold tabular-nums ${
                                  isAligned ? 'text-emerald-300' : 'text-amber-300'
                                }`}
                              >
                                {val} / Target {st.target} {isAligned ? '· Tepat' : ''}
                              </span>
                            </div>

                            <div className="relative h-2.5 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className="absolute top-0 bottom-0 bg-emerald-500/50 border-x border-emerald-400"
                                style={{ left: `${minBand}%`, width: `${bandWidth}%` }}
                              />
                            </div>

                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={val}
                              onChange={(e) => {
                                const next = Number(e.target.value);
                                setSliderValues((prev) =>
                                  prev.map((v, i) => (i === idx ? next : v))
                                );
                              }}
                              className="w-full accent-cyan-400 cursor-pointer"
                            />
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyStage4}
                      className={`w-full min-h-[44px] rounded-xl font-black text-xs sm:text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        slidersAligned
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      <SlidersHorizontal className="w-4 h-4" />
                      <span>Kunci Kalibrasi &amp; Sinkronisasi Brankas</span>
                    </button>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 5: VERIFIKASI SIDIK JARI BIOMETRIK 100%
                   ========================================================= */}
                {activeStage === 5 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-5">
                    <p className="text-xs text-slate-300">
                      Tekan dan tahan sensor biometrik di bawah ini hingga verifikasi mencapai 100%.
                    </p>

                    <div className="flex flex-col items-center gap-3">
                      <button
                        type="button"
                        onPointerDown={startBioHold}
                        onPointerUp={stopBioHold}
                        onPointerLeave={stopBioHold}
                        onPointerCancel={stopBioHold}
                        className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center gap-1.5 select-none touch-none cursor-pointer transition-transform ${
                          isHoldingBio
                            ? 'bg-emerald-500/20 border-emerald-400 scale-95 text-emerald-200'
                            : 'bg-slate-950 border-cyan-500/60 hover:border-cyan-400 text-cyan-200'
                        }`}
                      >
                        <Fingerprint className="w-12 h-12" />
                        <span className="font-mono text-lg font-black tabular-nums">
                          {Math.round(bioPercent)}%
                        </span>
                      </button>

                      <div className="w-full max-w-xs h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-75"
                          style={{ width: `${Math.round(bioPercent)}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400">
                        {isHoldingBio ? 'Memindai biometrik... terus tahan!' : 'Tahan tombol sidik jari'}
                      </span>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 6: CEK UANG PALSU SINAR UV-365nm
                   ========================================================= */}
                {activeStage === 6 && currentUvBill && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono tabular-nums text-slate-300">
                        Lembar {uvIndex + 1} dari {uvBills.length} · Terverifikasi {uvVerifiedCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playWorkstationSfx('uv', soundMuted);
                          setUvLampOn((prev) => !prev);
                        }}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl border text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                          uvLampOn
                            ? 'bg-violet-500/25 border-violet-400 text-violet-100'
                            : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-violet-400/60'
                        }`}
                      >
                        <Sun className="w-4 h-4" />
                        <span>{uvLampOn ? 'Lampu UV-365nm: MENYALA' : 'Nyalakan Lampu UV-365nm'}</span>
                      </button>
                    </div>

                    {/* Visual Uang Kertas di bawah Sinar UV */}
                    <div
                      className={`rounded-2xl border-2 p-5 transition-colors relative overflow-hidden ${
                        uvLampOn
                          ? 'bg-[#130d2e] border-violet-400/80 shadow-[inset_0_0_40px_rgba(139,92,246,0.28)]'
                          : 'bg-slate-950 border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-mono text-slate-400 block">
                            BANK NUSANTARA · SERI {currentUvBill.serial}
                          </span>
                          <span className="text-2xl font-black font-mono tabular-nums text-white block mt-1">
                            {currentUvBill.denomination}
                          </span>
                        </div>
                        <div
                          className={`px-3 py-2 rounded-xl border text-right font-mono text-xs ${
                            !uvLampOn
                              ? 'bg-slate-900 border-slate-800 text-slate-500'
                              : currentUvBill.isFake
                              ? 'bg-rose-950/70 border-rose-400/70 text-rose-200'
                              : 'bg-emerald-950/70 border-emerald-400/70 text-emerald-200'
                          }`}
                        >
                          {!uvLampOn
                            ? 'Nyalakan UV untuk pindai'
                            : currentUvBill.isFake
                            ? 'ANOMALI UV TERDETEKSI'
                            : 'TANDA AIR UV VALID'}
                        </div>
                      </div>

                      {/* Pita Pengaman UV */}
                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                        <span className="text-slate-400">Hasil Sensor Sinar UV:</span>
                        <span
                          className={`font-semibold ${
                            !uvLampOn
                              ? 'text-slate-500'
                              : currentUvBill.isFake
                              ? 'text-rose-300'
                              : 'text-emerald-300'
                          }`}
                        >
                          {uvLampOn ? currentUvBill.uvIssueLabel : 'Lampu UV masih padam'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleClassifyUvBill(false)}
                        className="min-h-[46px] rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer"
                      >
                        Lolos (Uang Asli)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleClassifyUvBill(true)}
                        className="min-h-[46px] rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm cursor-pointer"
                      >
                        Sita (Uang Palsu)
                      </button>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 7: SORTIR DOKUMEN NASABAH
                   ========================================================= */}
                {activeStage === 7 && currentSortDoc && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                      <span>Berkas {sortIndex + 1} dari {sortDocs.length}</span>
                      <span>Pilih laci divisi yang sesuai</span>
                    </div>

                    <div className="rounded-xl bg-slate-950 border border-slate-700 p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-cyan-300">
                        <span>{currentSortDoc.docNumber}</span>
                        <span>Pemohon: {currentSortDoc.client}</span>
                      </div>
                      <h4 className="text-base font-extrabold text-white">{currentSortDoc.title}</h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {SORT_DEPARTMENTS.map((dept) => (
                        <button
                          key={dept.id}
                          type="button"
                          onClick={() => handleSortDocument(dept.id)}
                          className={`min-h-[54px] p-3 rounded-xl border bg-slate-950 text-left flex items-center gap-2.5 transition-colors cursor-pointer ${dept.accent}`}
                        >
                          <FolderOpen className="w-5 h-5 shrink-0" />
                          <div className="min-w-0">
                            <span className="text-xs font-extrabold block truncate">{dept.label}</span>
                            <span className="text-[10px] font-mono opacity-80">{dept.code}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 8: STEMPEL PERSETUJUAN RESMI
                   ========================================================= */}
                {activeStage === 8 && currentStampDoc && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between text-xs font-mono tabular-nums text-slate-400">
                      <span>Dokumen {stampIndex + 1} dari {stampDocs.length}</span>
                      <span>Klik kolom stempel resmi di bawah</span>
                    </div>

                    <div className="rounded-xl bg-slate-100 text-slate-900 border border-slate-300 p-4 sm:p-5 space-y-4">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-300 pb-3">
                        <div>
                          <span className="text-[10px] font-mono font-bold text-slate-500 block">
                            BANK NUSANTARA · {currentStampDoc.refNo}
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                            {currentStampDoc.title}
                          </h4>
                        </div>
                        <span className="font-mono text-xs font-black text-emerald-700 tabular-nums shrink-0">
                          {formatRupiah(currentStampDoc.amount)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div className="text-xs text-slate-600 space-y-0.5">
                          <p>Unit Operasional: <strong className="text-slate-900">{currentStampDoc.officer}</strong></p>
                          <p>Status: Menunggu stempel otorisasi cabang</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleApplyOfficialStamp}
                          className={`min-w-[200px] min-h-[76px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            currentStampDoc.stamped || stampJustHit
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-700 scale-95'
                              : 'border-rose-400 bg-white hover:bg-rose-50 text-rose-700'
                          }`}
                        >
                          <Stamp className="w-5 h-5" />
                          <span className="font-mono text-xs font-black tracking-wider">
                            {currentStampDoc.stamped || stampJustHit
                              ? 'DISETUJUI · SAH'
                              : 'KLIK BUBUHKAN STEMPEL'}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 9: AUDIT BUKU BESAR (LEDGER)
                   ========================================================= */}
                {activeStage === 9 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-cyan-300" />
                        <span>Klik baris yang selisih (Debit − Kredit ≠ Tercatat) untuk koreksi.</span>
                      </span>
                      <span className="font-mono text-amber-300 font-bold tabular-nums">
                        Sisa selisih: {auditRows.filter((r) => r.hasError && !r.fixed).length}
                      </span>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-800">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                            <th className="py-2.5 px-3 font-semibold">Jurnal</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Debit</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Kredit</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Tercatat</th>
                            <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 font-mono tabular-nums">
                          {auditRows.map((row) => (
                            <tr
                              key={row.id}
                              className={row.fixed ? 'bg-emerald-950/30' : 'bg-slate-900/70 hover:bg-slate-800/70'}
                            >
                              <td className="py-2.5 px-3 font-sans">
                                <span className="font-mono text-[10px] text-slate-400 block">{row.code}</span>
                                <span className="font-semibold text-slate-200">{row.label}</span>
                              </td>
                              <td className="py-2.5 px-3 text-right text-emerald-300">
                                {formatRupiah(row.debit)}
                              </td>
                              <td className="py-2.5 px-3 text-right text-rose-300">
                                {formatRupiah(row.credit)}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-white">
                                {formatRupiah(row.recordedNet)}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                {row.fixed ? (
                                  <span className="text-emerald-400 font-sans font-bold">Terkoreksi</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleAuditRowAction(row)}
                                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-200 font-sans font-bold text-[11px] cursor-pointer whitespace-nowrap"
                                  >
                                    Koreksi
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* =========================================================
                    TAHAP 10: KIRIM LAPORAN AKHIR & PENCAIRAN GAJI
                   ========================================================= */}
                {activeStage === 10 && (
                  <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
                    <div className="space-y-2">
                      {reportChecklist.map((item, idx) => {
                        const checked = Boolean(checkedReports[idx]);
                        return (
                          <label
                            key={item}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                              checked
                                ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-100'
                                : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                playWorkstationSfx('click', soundMuted);
                                setCheckedReports((prev) => ({
                                  ...prev,
                                  [idx]: e.target.checked,
                                }));
                              }}
                              className="w-4 h-4 accent-emerald-400 shrink-0"
                            />
                            <span className="text-xs font-medium">{item}</span>
                          </label>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={handleSubmitFinalReport}
                      className={`w-full min-h-[48px] rounded-xl font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                        allReportsChecked
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span>Segel &amp; Kirim Laporan Akhir — Cairkan Gaji</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* RIGHT: REAL WORKSTATION REWARD PREVIEW & REAL ACTIVITY LOG (4 COLS) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-[#070c18] space-y-4 flex flex-col">
            {/* Reward Breakdown */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rincian Pencairan 10 Tahap</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-300 tabular-nums">
                  Lv {job.requiredLevel}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono tabular-nums">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Gaji Dasar</span>
                  <span className="text-slate-200">{formatRupiah(baseSalary)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Bonus 10 Tahap (+{config.extraSalaryBonusPercent}%)</span>
                  <span className="text-emerald-300">+{formatRupiah(stageExtraSalaryPreview)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Bonus Tier Lv {job.requiredLevel} (+{scaling.tierBonusPercent}%)</span>
                  <span className="text-violet-300">+{formatRupiah(tierBonusSalaryPreview)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-bold">
                  <span className="text-white font-sans">Total Gaji Cair</span>
                  <span className="text-emerald-400">{formatRupiah(baseSalary + totalExtraSalaryPreview)}</span>
                </div>
                <div className="flex items-center justify-between text-amber-300 pt-1">
                  <span className="font-sans inline-flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> Coin Total
                  </span>
                  <span>+{totalCoinPreview.toLocaleString('id-ID')} Coin</span>
                </div>
                <div className="flex items-center justify-between text-cyan-300">
                  <span className="font-sans inline-flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> XP Level Akun
                  </span>
                  <span>+{totalXpPreview.toLocaleString('id-ID')} XP</span>
                </div>
              </div>
            </div>

            {/* Log Aktivitas Kerja Nyata */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3.5 flex-1 flex flex-col min-h-[180px]">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ClipboardList className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Log Aktivitas Nyata</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                  {activityLogs.length} catatan
                </span>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="text-[11px] leading-relaxed border-b border-slate-800/70 pb-1.5 last:border-b-0"
                  >
                    <span className="font-mono text-[10px] text-slate-500 mr-1.5 tabular-nums">
                      {log.time}
                    </span>
                    <span
                      className={
                        log.kind === 'success'
                          ? 'text-emerald-300 font-medium'
                          : log.kind === 'warn'
                          ? 'text-amber-300'
                          : 'text-slate-300'
                      }
                    >
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
