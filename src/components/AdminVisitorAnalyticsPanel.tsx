import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import {
  Activity,
  Users,
  Smartphone,
  Globe,
  Search,
  Download,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
  Monitor,
  Wifi,
  Battery,
  MapPin,
  Clock,
  Crown,
  ShieldCheck,
  Eye,
  X,
  Laptop,
  Radio,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { isAdminCardAccount } from '../utils/bankUtils';
import {
  OFFLINE_TIMEOUT_MS,
  type AccountVisitSummaryRecord,
  type DeviceReviewStatus,
  type DeviceSessionRecord,
} from '../services/visitorTracker';
import {
  apiResetVisitorAnalytics,
  apiSetDeviceReviewStatus,
  useAdminAnalyticsAndTierSync,
} from '../hooks/useAdminAnalyticsAndTierSync';
import { isPrimarySystemOwnerAccount } from '../types/adminAnalyticsAndTier';

interface AdminVisitorAnalyticsPanelProps {
  initialSearchQuery?: string;
  onClearInitialSearch?: () => void;
  onPromoteAccountToAdmin?: (accountId: string) => void;
}

type AnalyticsSubTab = 'global_hits' | 'account_activity' | 'device_tracker';
type GlobalChartRange = 'hourly_24h' | 'daily_14d';

function escapeCsv(val: string | number): string {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function getWibTodayAndMonth(): { todayKey: string; monthKey: string } {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const get = (t: string) => parts.find((p) => p.type === t)?.value || '00';
    const y = get('year');
    const m = get('month');
    const d = get('day');
    return { todayKey: `${y}-${m}-${d}`, monthKey: `${y}-${m}` };
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return { todayKey: `${y}-${m}-${day}`, monthKey: `${y}-${m}` };
  }
}

function formatRelativeOffline(lastSeenMs: number, nowMs: number): string {
  if (!lastSeenMs) return 'Belum pernah aktif';
  const diffSec = Math.max(1, Math.floor((nowMs - lastSeenMs) / 1000));
  if (diffSec < 60) return `Terakhir dilihat ${diffSec} detik lalu`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `Terakhir dilihat ${mins} menit lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Terakhir dilihat ${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  return `Terakhir dilihat ${days} hari lalu`;
}

export const AdminVisitorAnalyticsPanel: React.FC<AdminVisitorAnalyticsPanelProps> = ({
  initialSearchQuery,
  onClearInitialSearch,
  onPromoteAccountToAdmin,
}) => {
  const { accounts, currentAccount, googleUser } = useBank();
  const { visitorAnalytics, adminTierGrantsMap, wsConnected, refresh } =
    useAdminAnalyticsAndTierSync();

  const [subTab, setSubTab] = useState<AnalyticsSubTab>('global_hits');
  const [chartRange, setChartRange] = useState<GlobalChartRange>('hourly_24h');
  const [hideAdminVisits, setHideAdminVisits] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'today' | 'suspicious'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  // Modals
  const [selectedAccountDetail, setSelectedAccountDetail] = useState<{
    accountId: string;
    name: string;
    email: string;
    roleLabel: string;
    summary: AccountVisitSummaryRecord | null;
  } | null>(null);
  const [selectedDeviceSpecs, setSelectedDeviceSpecs] = useState<DeviceSessionRecord | null>(null);

  // Double-Confirm Reset Modal
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [resetPhrase, setResetPhrase] = useState<string>('');
  const [resetCheckbox, setResetCheckbox] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);

  // Live relative-time tick every 10s
  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!initialSearchQuery) return;
    setSearchQuery(initialSearchQuery);
    setSubTab('account_activity');
    onClearInitialSearch?.();
  }, [initialSearchQuery]);

  const { todayKey, monthKey } = useMemo(() => getWibTodayAndMonth(), [nowTick]);

  const isDeviceCurrentlyOnline = (d: DeviceSessionRecord): boolean => {
    return Boolean(d.isOnline) && nowTick - Number(d.lastSeenMs || 0) <= OFFLINE_TIMEOUT_MS;
  };

  // Distinct physical accounts count per physical deviceId across all locations (for >3 suspicious rule)
  const physicalDeviceAccountCountMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    Object.values(visitorAnalytics.deviceSessionsMap || {}).forEach((sess) => {
      if (!map.has(sess.deviceId)) map.set(sess.deviceId, new Set<string>());
      const set = map.get(sess.deviceId)!;
      (sess.accountsHistory || []).forEach((h) => {
        if (h.accountKey) set.add(h.accountKey);
      });
    });
    const counts = new Map<string, number>();
    map.forEach((set, devId) => counts.set(devId, set.size));
    return counts;
  }, [visitorAnalytics.deviceSessionsMap]);

  // All Device Sessions filtered
  const allDevicesList = useMemo(() => {
    return Object.values(visitorAnalytics.deviceSessionsMap || {}).sort(
      (a, b) => Number(b.lastSeenMs || 0) - Number(a.lastSeenMs || 0)
    );
  }, [visitorAnalytics.deviceSessionsMap]);

  const suspiciousDevicesCount = useMemo(() => {
    return allDevicesList.filter(
      (d) => (physicalDeviceAccountCountMap.get(d.deviceId) || d.accountsHistory?.length || 0) > 3
    ).length;
  }, [allDevicesList, physicalDeviceAccountCountMap]);

  // Global visits filtered by hideAdminVisits
  const scopedGlobalVisits = useMemo(() => {
    const raw = visitorAnalytics.globalVisits || [];
    return hideAdminVisits ? raw.filter((v) => !v.isAdmin) : raw;
  }, [visitorAnalytics.globalVisits, hideAdminVisits]);

  // Global KPI stats
  const globalStats = useMemo(() => {
    const totalAllTime = scopedGlobalVisits.length;
    const todayHits = scopedGlobalVisits.filter((v) => v.dateKey === todayKey).length;
    const monthHits = scopedGlobalVisits.filter((v) => v.monthKey === monthKey).length;
    const liveOnlineDevices = allDevicesList.filter((d) => {
      if (hideAdminVisits && d.isAdminActive) return false;
      return isDeviceCurrentlyOnline(d);
    }).length;

    const apkHits = scopedGlobalVisits.filter((v) => v.accessType === 'apk_webview').length;
    const webHits = totalAllTime - apkHits;
    const webPct = totalAllTime > 0 ? (webHits / totalAllTime) * 100 : 0;
    const apkPct = totalAllTime > 0 ? (apkHits / totalAllTime) * 100 : 0;

    return {
      totalAllTime,
      todayHits,
      monthHits,
      liveOnlineDevices,
      webHits,
      apkHits,
      webPct,
      apkPct,
    };
  }, [scopedGlobalVisits, allDevicesList, todayKey, monthKey, hideAdminVisits, nowTick]);

  // Hourly 24h & Daily 14d trend chart datasets
  const hourlyTrendData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hr) => ({
      label: `${String(hr).padStart(2, '0')}:00`,
      total: 0,
      web: 0,
      apk: 0,
    }));
    const cutoff = nowTick - 24 * 3_600_000;
    scopedGlobalVisits.forEach((v) => {
      if (v.timestampMs >= cutoff) {
        const h = Number(v.hourOfDay) % 24;
        if (h >= 0 && h < 24) {
          buckets[h].total += 1;
          if (v.accessType === 'apk_webview') buckets[h].apk += 1;
          else buckets[h].web += 1;
        }
      }
    });
    return buckets;
  }, [scopedGlobalVisits, nowTick]);

  const dailyTrendData = useMemo(() => {
    const days: Array<{ dateKey: string; label: string; total: number; web: number; apk: number }> = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(nowTick - i * 86_400_000);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      days.push({
        dateKey: `${y}-${m}-${day}`,
        label: `${day}/${m}`,
        total: 0,
        web: 0,
        apk: 0,
      });
    }
    const idxMap = new Map(days.map((d, i) => [d.dateKey, i]));
    scopedGlobalVisits.forEach((v) => {
      const idx = idxMap.get(v.dateKey);
      if (idx !== undefined) {
        days[idx].total += 1;
        if (v.accessType === 'apk_webview') days[idx].apk += 1;
        else days[idx].web += 1;
      }
    });
    return days;
  }, [scopedGlobalVisits, nowTick]);

  // Sub-Tab 2: Unified Account Activity (ALL registered accounts including 0 visits)
  const mergedAccountRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const visitRecords = Object.values(visitorAnalytics.accountVisitsMap || {});

    const rows = accounts.map((acc) => {
      const accIdLow = acc.id.toLowerCase();
      const accEmailLow = (acc.email || '').trim().toLowerCase();
      const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
      const grant = adminTierGrantsMap[acc.id];
      const isAdminAcc = isOwner || isAdminCardAccount(acc) || (grant && grant.status === 'active');

      const summary =
        visitRecords.find(
          (r) =>
            r.accountId?.toLowerCase() === accIdLow ||
            (accEmailLow && r.accountEmail?.toLowerCase() === accEmailLow)
        ) || null;

      const isOnline = allDevicesList.some((d) => {
        if (!isDeviceCurrentlyOnline(d)) return false;
        return (
          d.currentAccountKey === accIdLow ||
          (accEmailLow && d.currentAccountKey === accEmailLow)
        );
      });

      const lastActiveMs = summary?.lastActiveMs || 0;
      const visitedToday =
        summary?.recentVisits?.some((rv) => {
          const d = new Date(rv.timestampMs);
          const dk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
            d.getDate()
          ).padStart(2, '0')}`;
          return dk === todayKey;
        }) || false;

      return {
        account: acc,
        isOwner,
        isAdminAcc,
        grant,
        roleLabel: isOwner
          ? 'Super Admin Utama'
          : grant && grant.status === 'active'
          ? grant.customTitle || 'Tier Admin'
          : isAdminAcc
          ? 'Admin'
          : 'Nasabah',
        totalVisits: summary?.totalVisits || 0,
        lastActiveMs,
        lastActiveIso: summary?.lastActiveIso || '',
        uniqueDeviceCount: summary?.deviceIds?.length || 0,
        locations: summary?.locations || [],
        isOnline,
        visitedToday,
        summary,
      };
    });

    return rows
      .filter((r) => {
        if (hideAdminVisits && r.isAdminAcc) return false;
        if (statusFilter === 'online' && !r.isOnline) return false;
        if (statusFilter === 'today' && !r.visitedToday) return false;
        if (q) {
          const hay = `${r.account.fullName} ${r.account.email || ''} ${r.account.accountNumber} ${
            r.roleLabel
          } ${r.locations.join(' ')}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return b.totalVisits - a.totalVisits || b.lastActiveMs - a.lastActiveMs;
      });
  }, [
    accounts,
    visitorAnalytics.accountVisitsMap,
    adminTierGrantsMap,
    allDevicesList,
    hideAdminVisits,
    statusFilter,
    searchQuery,
    todayKey,
    nowTick,
  ]);

  // Sub-Tab 3: Filtered Devices
  const filteredDevices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allDevicesList.filter((d) => {
      if (hideAdminVisits && d.isAdminActive) return false;
      const online = isDeviceCurrentlyOnline(d);
      const acctCount =
        physicalDeviceAccountCountMap.get(d.deviceId) || d.accountsHistory?.length || 0;
      const isSuspicious = acctCount > 3;

      if (statusFilter === 'online' && !online) return false;
      if (statusFilter === 'suspicious' && !isSuspicious) return false;
      if (statusFilter === 'today') {
        const dt = new Date(d.lastSeenMs || 0);
        const dk = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(
          dt.getDate()
        ).padStart(2, '0')}`;
        if (dk !== todayKey) return false;
      }

      if (q) {
        const hay = `${d.deviceId} ${d.locationLabel} ${d.specs?.publicIp || ''} ${
          d.specs?.deviceBrandModel || ''
        } ${d.specs?.isp || ''} ${d.currentAccountEmail} ${d.currentAccountName} ${(
          d.accountsHistory || []
        )
          .map((a) => `${a.accountName} ${a.accountEmail}`)
          .join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allDevicesList,
    hideAdminVisits,
    statusFilter,
    searchQuery,
    todayKey,
    nowTick,
    physicalDeviceAccountCountMap,
  ]);

  const handleCopyText = async (text: string, idKey: string, label = 'Disalin') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(idKey);
      setNotice({ ok: true, text: `${label}: ${text.slice(0, 64)}` });
      window.setTimeout(() => setCopiedId((prev) => (prev === idKey ? null : prev)), 2000);
    } catch {
      setNotice({ ok: false, text: 'Gagal menyalin ke clipboard.' });
    }
  };

  const handleCopyDeviceAuditReport = (d: DeviceSessionRecord) => {
    const acctCount =
      physicalDeviceAccountCountMap.get(d.deviceId) || d.accountsHistory?.length || 0;
    const report = [
      `=== LAPORAN AUDIT PERANGKAT BANK NUSANTARA ===`,
      `Device ID: ${d.deviceId}`,
      `Status: ${isDeviceCurrentlyOnline(d) ? 'ONLINE' : formatRelativeOffline(d.lastSeenMs, nowTick)}`,
      `Multi-Akun: ${acctCount} akun ${acctCount > 3 ? '[MENCURIGAKAN >3 AKUN]' : ''}`,
      `Review Admin: ${d.reviewStatus}`,
      `Model / OS: ${d.specs?.deviceBrandModel} | ${d.specs?.osName} ${d.specs?.osVersion}`,
      `Akses: ${d.specs?.accessTypeLabel}`,
      `Hardware: CPU ${d.specs?.cpuCores} Core (${d.specs?.cpuArchitecture}), RAM ${d.specs?.ramLabel}, GPU ${d.specs?.gpuRenderer}`,
      `Layar: ${d.specs?.screenResolution} (DPR ${d.specs?.pixelRatio}) · ${d.specs?.screenOrientation}`,
      `IP & Lokasi: ${d.specs?.publicIp} · ${d.locationLabel} · ISP: ${d.specs?.isp}`,
      `Total Kunjungan Perangkat: ${d.totalVisits}x`,
      `Akun Pernah Login: ${(d.accountsHistory || [])
        .map((a) => `${a.accountName} (${a.accountEmail}) [${a.loginCount}x]`)
        .join('; ') || 'Tamu / Belum Login'}`,
    ].join('\n');
    void handleCopyText(report, `audit-${d.sessionKey}`, 'Laporan audit perangkat disalin');
  };

  const handleReviewDevice = async (sessionKey: string, status: DeviceReviewStatus) => {
    const res = await apiSetDeviceReviewStatus({
      sessionKey,
      reviewStatus: status,
      adminActorEmail: currentAccount?.email || googleUser?.email || 'admin',
    });
    setNotice({ ok: res.success, text: res.message });
  };

  const handleExportCsv = () => {
    let lines: string[] = [];
    let filename = `analitik-pengunjung-${todayKey}.csv`;

    if (subTab === 'global_hits') {
      filename = `global-visits-${todayKey}.csv`;
      lines = [
        [
          'ID Kunjungan',
          'Waktu',
          'Tipe Akses',
          'Model Perangkat',
          'OS',
          'Browser',
          'IP Publik',
          'Kota',
          'Provinsi',
          'Negara',
          'ISP',
          'Akun',
          'Email',
          'Role',
          'Pemicu',
        ]
          .map(escapeCsv)
          .join(','),
        ...[...scopedGlobalVisits].reverse().map((v) =>
          [
            v.id,
            v.timestampIso,
            v.accessTypeLabel,
            v.deviceBrandModel,
            v.osLabel,
            v.browserLabel,
            v.publicIp,
            v.city,
            v.region,
            v.country,
            v.isp,
            v.accountName,
            v.accountEmail,
            v.accountRole,
            v.triggerType,
          ]
            .map(escapeCsv)
            .join(',')
        ),
      ];
    } else if (subTab === 'account_activity') {
      filename = `account-visits-${todayKey}.csv`;
      lines = [
        [
          'Nama Akun',
          'Email',
          'No Rekening',
          'Role',
          'Total Kunjungan',
          'Jumlah Perangkat Berbeda',
          'Status Live',
          'Terakhir Aktif',
          'Lokasi Terdeteksi',
        ]
          .map(escapeCsv)
          .join(','),
        ...mergedAccountRows.map((r) =>
          [
            r.account.fullName,
            r.account.email || '-',
            r.account.accountNumber,
            r.roleLabel,
            r.totalVisits,
            r.uniqueDeviceCount,
            r.isOnline ? 'ONLINE' : 'OFFLINE',
            r.lastActiveIso || '-',
            r.locations.join(' | ') || '-',
          ]
            .map(escapeCsv)
            .join(',')
        ),
      ];
    } else {
      filename = `device-sessions-${todayKey}.csv`;
      lines = [
        [
          'Device ID',
          'Status',
          'Total Kunjungan',
          'Jumlah Akun Fisik',
          'Mencurigakan (>3 Akun)',
          'Review Admin',
          'Model Perangkat',
          'OS',
          'Akses Web/APK',
          'CPU Cores',
          'RAM',
          'GPU',
          'Resolusi Layar',
          'IP Publik',
          'Lokasi',
          'ISP',
          'Zona Waktu',
          'Koneksi',
          'Baterai',
          'Daftar Akun Login',
        ]
          .map(escapeCsv)
          .join(','),
        ...filteredDevices.map((d) => {
          const acctCount =
            physicalDeviceAccountCountMap.get(d.deviceId) || d.accountsHistory?.length || 0;
          return [
            d.deviceId,
            isDeviceCurrentlyOnline(d) ? 'ONLINE' : 'OFFLINE',
            d.totalVisits,
            acctCount,
            acctCount > 3 ? 'YA' : 'TIDAK',
            d.reviewStatus,
            d.specs?.deviceBrandModel || '-',
            `${d.specs?.osName || ''} ${d.specs?.osVersion || ''}`.trim(),
            d.specs?.accessTypeLabel || '-',
            d.specs?.cpuCores || '-',
            d.specs?.ramLabel || '-',
            d.specs?.gpuRenderer || '-',
            d.specs?.screenResolution || '-',
            d.specs?.publicIp || '-',
            d.locationLabel,
            d.specs?.isp || '-',
            d.specs?.timezone || '-',
            d.specs?.connectionType || '-',
            d.specs?.batteryLevelPct !== null && d.specs?.batteryLevelPct !== undefined
              ? `${d.specs.batteryLevelPct}%`
              : '-',
            (d.accountsHistory || []).map((a) => `${a.accountName} (${a.accountEmail})`).join(' | '),
          ]
            .map(escapeCsv)
            .join(',');
        }),
      ];
    }

    const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotice({ ok: true, text: `File ${filename} berhasil diekspor.` });
  };

  const handleConfirmReset = async () => {
    setResetting(true);
    try {
      const res = await apiResetVisitorAnalytics({
        confirmPhrase: resetPhrase,
        adminActorName: currentAccount?.fullName || googleUser?.name || 'Super Admin',
        adminActorEmail: currentAccount?.email || googleUser?.email || 'admin',
      });
      setNotice({ ok: res.success, text: res.message });
      if (res.success) {
        setShowResetModal(false);
        setResetPhrase('');
        setResetCheckbox(false);
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold">
            <Radio className="w-4 h-4" />
            <span>
              Hybrid Server WebSocket ({wsConnected ? 'Terhubung Real-Time' : 'Menyambung...'}) + Firestore Sync
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Analitik &amp; Trafik Pengunjung Real-Time
          </h2>
          <p className="text-xs text-slate-400">
            Mencatat otomatis seluruh kunjungan Web Browser &amp; APK (sebelum maupun sesudah login) dengan debounce 10 detik, heartbeat 20 detik, timeout offline 45 detik, dan fingerprint perangkat lengkap.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setHideAdminVisits((prev) => !prev)}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer whitespace-nowrap ${
              hideAdminVisits
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-slate-950 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            {hideAdminVisits ? 'Admin Disembunyikan' : 'Sembunyikan Admin'}
          </button>

          <button
            type="button"
            onClick={() => void refresh()}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sinkron</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="px-3 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-700/60 text-rose-300 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            notice.ok
              ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/50 border-rose-700/60 text-rose-200'
          }`}
        >
          <span>{notice.text}</span>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Suspicious Multi-Account Device Alert Banner (>3 accounts on 1 physical device) */}
      {suspiciousDevicesCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-700/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-rose-200">
                Deteksi Multi-Akun Mencurigakan · {suspiciousDevicesCount} Perangkat Fisik (&gt;3 Akun Berbeda)
              </p>
              <p className="text-xs text-rose-300/90">
                Sistem mendeteksi perangkat fisik yang digunakan untuk masuk lebih dari 3 akun nasabah berbeda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubTab('device_tracker');
              setStatusFilter('suspicious');
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer whitespace-nowrap shrink-0"
          >
            Filter Perangkat Mencurigakan
          </button>
        </div>
      )}

      {/* 3 Main Sub-Tabs + Global Search & Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setSubTab('global_hits')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === 'global_hits'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>1. Total Kunjungan Global ({globalStats.totalAllTime})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('account_activity')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === 'account_activity'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Kunjungan Per Akun ({mergedAccountRows.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setSubTab('device_tracker')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                subTab === 'device_tracker'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>3. Perangkat &amp; Lokasi Live ({filteredDevices.length})</span>
            </button>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 justify-end">
            <div className="relative min-w-[210px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari email, kota/lokasi, IP, ID perangkat..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
              {(
                [
                  ['all', 'Semua'],
                  ['online', 'Online'],
                  ['today', 'Hari Ini'],
                  ['suspicious', 'Mencurigakan'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setStatusFilter(key)}
                  className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer whitespace-nowrap ${
                    statusFilter === key
                      ? key === 'suspicious'
                        ? 'bg-rose-600 text-white'
                        : 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================= SUB-TAB 1: GLOBAL HITS ================= */}
      {subTab === 'global_hits' && (
        <div className="space-y-5">
          {/* 4 Big KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400">Total Kunjungan Sepanjang Waktu</span>
              <div className="text-2xl font-bold text-white font-mono tabular-nums">
                {globalStats.totalAllTime.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500">
                Semua sesi masuk (orang sama maupun baru · debounce 10 dtk)
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400">Kunjungan Hari Ini</span>
              <div className="text-2xl font-bold text-cyan-400 font-mono tabular-nums">
                {globalStats.todayHits.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                Tanggal {todayKey} (WIB)
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-slate-400">Kunjungan Bulan Ini</span>
              <div className="text-2xl font-bold text-indigo-400 font-mono tabular-nums">
                {globalStats.monthHits.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-500 font-mono tabular-nums">
                Periode {monthKey}
              </span>
            </div>

            <div className="bg-slate-900 border border-emerald-700/50 rounded-2xl p-4 space-y-1">
              <span className="text-xs text-emerald-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                <span>Pengunjung Sedang Aktif (Live Online)</span>
              </span>
              <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
                {globalStats.liveOnlineDevices.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-slate-400">
                Heartbeat 20 dtk · Auto-offline 45 dtk
              </span>
            </div>
          </div>

          {/* Charts Row: Hourly/Daily Trend + Web vs APK Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>
                      {chartRange === 'hourly_24h'
                        ? 'Tren Kunjungan Per Jam (24 Jam Terakhir)'
                        : 'Tren Kunjungan Harian (14 Hari Terakhir)'}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pembaruan otomatis setiap kunjungan baru tercatat di server
                  </p>
                </div>
                <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setChartRange('hourly_24h')}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                      chartRange === 'hourly_24h'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Per Jam
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartRange('daily_14d')}
                    className={`px-3 py-1 rounded-lg font-semibold cursor-pointer ${
                      chartRange === 'daily_14d'
                        ? 'bg-cyan-500 text-slate-950'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Per Hari
                  </button>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartRange === 'hourly_24h' ? (
                    <AreaChart data={hourlyTrendData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="visitAreaFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        name="Total Kunjungan"
                        stroke="#22d3ee"
                        strokeWidth={2}
                        fill="url(#visitAreaFill)"
                      />
                    </AreaChart>
                  ) : (
                    <BarChart data={dailyTrendData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#020617',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="web" name="Web Browser" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="apk" name="APK Android/WebView" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>

            {/* Web Browser vs APK Breakdown */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Persentase Web Browser vs APK</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Perbandingan sumber akses pengunjung dari Browser Web dan APK WebView/Android
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-semibold inline-flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web Browser</span>
                    </span>
                    <span className="font-mono tabular-nums text-white font-bold">
                      {globalStats.webPct.toFixed(1)}% ({globalStats.webHits})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${globalStats.webPct}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-300 font-semibold inline-flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>APK (WebView / Android)</span>
                    </span>
                    <span className="font-mono tabular-nums text-white font-bold">
                      {globalStats.apkPct.toFixed(1)}% ({globalStats.apkHits})
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${globalStats.apkPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                <div className="flex justify-between font-mono tabular-nums">
                  <span>Koleksi global_visits</span>
                  <span className="text-slate-200">{visitorAnalytics.globalVisits.length} log</span>
                </div>
                <div className="flex justify-between font-mono tabular-nums">
                  <span>Koleksi device_sessions</span>
                  <span className="text-slate-200">{allDevicesList.length} sesi</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Global Visits Feed (Latest 50) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Feed Kunjungan Masuk Terbaru (Live)</h3>
              <span className="text-xs text-slate-400 font-mono tabular-nums">
                50 terbaru dari {scopedGlobalVisits.length} total log
              </span>
            </div>
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2 px-3">Waktu</th>
                    <th className="py-2 px-3">Pengunjung / Akun</th>
                    <th className="py-2 px-3">Tipe Akses</th>
                    <th className="py-2 px-3">Perangkat &amp; OS</th>
                    <th className="py-2 px-3">IP &amp; Lokasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {[...scopedGlobalVisits]
                    .reverse()
                    .slice(0, 50)
                    .map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                          {new Date(v.timestampMs).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-white">{v.accountName}</div>
                          <div className="text-[10px] text-slate-500">
                            {v.accountEmail} · {v.triggerType === 'account_login' ? 'Login Akun' : 'Buka Aplikasi'}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[11px] font-semibold ${
                              v.accessType === 'apk_webview' ? 'text-emerald-400' : 'text-indigo-300'
                            }`}
                          >
                            {v.accessTypeLabel}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">
                          <div>{v.deviceBrandModel}</div>
                          <div className="text-[10px] text-slate-500">{v.osLabel}</div>
                        </td>
                        <td className="py-2 px-3 font-mono tabular-nums text-[11px]">
                          <div className="text-cyan-300">{v.publicIp}</div>
                          <div className="text-slate-400 font-sans">
                            {v.city}, {v.country}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 2: KUNJUNGAN PER AKUN ================= */}
      {subTab === 'account_activity' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
                  <th className="py-3 px-4">Nama / Email Akun</th>
                  <th className="py-3 px-3">Role &amp; Status</th>
                  <th className="py-3 px-3 text-right">Total Kunjungan</th>
                  <th className="py-3 px-3">Waktu Terakhir Aktif</th>
                  <th className="py-3 px-3 text-center">Perangkat Unik</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {mergedAccountRows.map((row) => (
                  <tr key={row.account.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            row.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{row.account.fullName}</span>
                            {row.isAdminAcc && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                            {row.account.email || '-'} · {row.account.accountNumber}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          row.isAdminAcc ? 'text-amber-300' : 'text-slate-300'
                        }`}
                      >
                        {row.roleLabel}
                      </span>
                      <div className="text-[10px] text-slate-500">
                        {row.isOnline ? 'Sedang Online' : 'Offline'}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span className="text-sm font-bold text-white">{row.totalVisits}</span>
                      <span className="text-slate-500 ml-1">kali</span>
                    </td>
                    <td className="py-3 px-3 font-mono tabular-nums text-[11px] text-slate-300">
                      {row.lastActiveMs > 0
                        ? new Date(row.lastActiveMs).toLocaleString('id-ID')
                        : 'Belum tercatat'}
                    </td>
                    <td className="py-3 px-3 text-center font-mono tabular-nums text-cyan-300 font-semibold">
                      {row.uniqueDeviceCount}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedAccountDetail({
                              accountId: row.account.id,
                              name: row.account.fullName,
                              email: row.account.email || '-',
                              roleLabel: row.roleLabel,
                              summary: row.summary,
                            })
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Detail Log</span>
                        </button>

                        {onPromoteAccountToAdmin && !row.isOwner && (
                          <button
                            type="button"
                            onClick={() => onPromoteAccountToAdmin(row.account.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          >
                            <Crown className="w-3.5 h-3.5" />
                            <span>{row.isAdminAcc ? 'Atur Admin' : 'Angkat Admin'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= SUB-TAB 3: PERANGKAT & LOKASI REAL-TIME ================= */}
      {subTab === 'device_tracker' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {filteredDevices.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400">
              Belum ada perangkat yang cocok dengan filter pencarian saat ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
                    <th className="py-3 px-4">Status Live &amp; Device ID</th>
                    <th className="py-3 px-3">Perangkat &amp; Akses</th>
                    <th className="py-3 px-3">IP Publik &amp; Lokasi</th>
                    <th className="py-3 px-3">Akun Pernah Login</th>
                    <th className="py-3 px-3 text-right">Kunjungan</th>
                    <th className="py-3 px-4 text-right">Spesifikasi &amp; Audit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredDevices.map((d) => {
                    const online = isDeviceCurrentlyOnline(d);
                    const physicalAcctCount =
                      physicalDeviceAccountCountMap.get(d.deviceId) ||
                      d.accountsHistory?.length ||
                      0;
                    const isSuspicious = physicalAcctCount > 3;

                    return (
                      <tr
                        key={d.sessionKey}
                        className={`hover:bg-slate-800/40 ${
                          isSuspicious ? 'bg-rose-950/15' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                                online ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                              }`}
                            />
                            <span
                              className={`font-bold text-[11px] ${
                                online ? 'text-emerald-400' : 'text-slate-400'
                              }`}
                            >
                              {online ? 'ONLINE' : 'OFFLINE'}
                            </span>
                          </div>
                          {!online && (
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              {formatRelativeOffline(d.lastSeenMs, nowTick)}
                            </div>
                          )}
                          <div className="text-[11px] font-mono tabular-nums text-cyan-300 mt-1">
                            {d.deviceId}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">
                            {d.specs?.deviceBrandModel || 'Perangkat'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {d.specs?.osName} {d.specs?.osVersion} · {d.specs?.accessTypeLabel}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5 font-mono tabular-nums text-cyan-300">
                            <span>{d.specs?.publicIp || '-'}</span>
                            <button
                              type="button"
                              onClick={() =>
                                void handleCopyText(d.specs?.publicIp || '', `ip-${d.sessionKey}`, 'IP disalin')
                              }
                              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
                              title="Salin IP Publik"
                            >
                              {copiedId === `ip-${d.sessionKey}` ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="text-[11px] text-slate-300">{d.locationLabel}</div>
                          <div className="text-[10px] text-slate-500">{d.specs?.isp || '-'}</div>
                          {d.previousLocations && d.previousLocations.length > 0 && (
                            <div className="text-[10px] text-amber-300 mt-0.5">
                              Tertaut {d.previousLocations.length} lokasi lain
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-mono tabular-nums font-bold text-white">
                              {physicalAcctCount} akun
                            </span>
                            {isSuspicious && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold inline-flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Mencurigakan (&gt;3)
                              </span>
                            )}
                            {d.reviewStatus === 'safe' && (
                              <span className="text-[10px] font-semibold text-emerald-400">
                                · Ditandai Aman
                              </span>
                            )}
                            {d.reviewStatus === 'watched' && (
                              <span className="text-[10px] font-semibold text-amber-400">
                                · Dalam Pantauan
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5 max-w-[220px] truncate">
                            {(d.accountsHistory || []).length > 0
                              ? d.accountsHistory.map((a) => a.accountName).join(', ')
                              : 'Pengunjung Tamu (Belum Login)'}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right font-mono tabular-nums">
                          <span className="text-sm font-bold text-white">{d.totalVisits}</span>
                          <span className="text-slate-500 ml-1">x</span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedDeviceSpecs(d)}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            >
                              <Cpu className="w-3.5 h-3.5" />
                              <span>Spek Lengkap</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyDeviceAuditReport(d)}
                              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                              title="Salin Laporan Audit Perangkat"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                void handleReviewDevice(
                                  d.sessionKey,
                                  d.reviewStatus === 'watched'
                                    ? 'safe'
                                    : d.reviewStatus === 'safe'
                                    ? 'normal'
                                    : 'watched'
                                )
                              }
                              className="px-2 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-[11px] text-amber-300 font-semibold cursor-pointer whitespace-nowrap"
                              title="Ubah status review Admin (Pantauan / Aman / Normal)"
                            >
                              {d.reviewStatus === 'watched'
                                ? 'Tandai Aman'
                                : d.reviewStatus === 'safe'
                                ? 'Reset Status'
                                : 'Pantau'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: DETAIL LOG KRONOLOGIS AKUN ================= */}
      {selectedAccountDetail && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div>
                <h3 className="text-base font-bold text-white">
                  Log Kronologis Kunjungan Akun: {selectedAccountDetail.name}
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedAccountDetail.email} · {selectedAccountDetail.roleLabel} · Total{' '}
                  <strong className="text-white font-mono tabular-nums">
                    {selectedAccountDetail.summary?.totalVisits || 0}
                  </strong>{' '}
                  kunjungan
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccountDetail(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {!selectedAccountDetail.summary ||
              selectedAccountDetail.summary.recentVisits.length === 0 ? (
                <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
                  Akun ini belum memiliki riwayat kunjungan sejak tracker aktif.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                      <th className="py-2 px-3">Waktu Masuk</th>
                      <th className="py-2 px-3">Pemicu</th>
                      <th className="py-2 px-3">Perangkat &amp; Akses</th>
                      <th className="py-2 px-3">IP &amp; Lokasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70">
                    {selectedAccountDetail.summary.recentVisits.map((rv) => (
                      <tr key={rv.id} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-mono tabular-nums text-[11px] text-slate-300 whitespace-nowrap">
                          {new Date(rv.timestampMs).toLocaleString('id-ID')}
                        </td>
                        <td className="py-2 px-3 text-indigo-300 font-medium">
                          {rv.triggerType === 'account_login' ? 'Login Akun' : 'Buka Web/APK'}
                        </td>
                        <td className="py-2 px-3">
                          <div className="text-white font-medium">{rv.deviceBrandModel}</div>
                          <div className="text-[10px] text-slate-400">
                            {rv.accessTypeLabel} · {rv.deviceId}
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-mono tabular-nums text-cyan-300 text-[11px]">
                            {rv.publicIp}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {rv.city}, {rv.region}, {rv.country} · {rv.isp}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: SPESIFIKASI PERANGKAT LENGKAP ================= */}
      {selectedDeviceSpecs && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-xs">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <span>Spesifikasi Perangkat Lengkap</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  {selectedDeviceSpecs.deviceId} · Fingerprint {selectedDeviceSpecs.fingerprintHash}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyDeviceAuditReport(selectedDeviceSpecs)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold inline-flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Laporan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDeviceSpecs(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 overflow-y-auto space-y-5">
              {/* Group 1: Identitas & Sistem */}
              <div className="space-y-2">
                <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>1. Identitas &amp; Sistem</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div>
                    <span className="text-slate-500 block">Device ID Unik</span>
                    <span className="font-mono text-white font-semibold">
                      {selectedDeviceSpecs.specs?.deviceId}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Merek / Model Perangkat</span>
                    <span className="text-white font-semibold">
                      {selectedDeviceSpecs.specs?.deviceBrandModel} ({selectedDeviceSpecs.specs?.deviceCategory})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sistem Operasi &amp; Versi</span>
                    <span className="text-white">
                      {selectedDeviceSpecs.specs?.osName} {selectedDeviceSpecs.specs?.osVersion}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tipe Akses (Web / APK)</span>
                    <span className="text-emerald-300 font-semibold">
                      {selectedDeviceSpecs.specs?.accessTypeLabel}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block">User-Agent String</span>
                    <span className="font-mono text-[11px] text-slate-300 break-all">
                      {selectedDeviceSpecs.specs?.userAgent || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 2: Hardware & Layar */}
              <div className="space-y-2">
                <h4 className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>2. Hardware &amp; Layar</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 font-mono tabular-nums">
                  <div>
                    <span className="text-slate-500 block font-sans">Arsitektur CPU &amp; Jumlah Core</span>
                    <span className="text-white">
                      {selectedDeviceSpecs.specs?.cpuCores} Core · {selectedDeviceSpecs.specs?.cpuArchitecture}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Kapasitas RAM (deviceMemory)</span>
                    <span className="text-white">{selectedDeviceSpecs.specs?.ramLabel}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500 block font-sans">Model GPU (WebGL UNMASKED_RENDERER)</span>
                    <span className="text-amber-300 break-all">
                      {selectedDeviceSpecs.specs?.gpuRenderer} ({selectedDeviceSpecs.specs?.gpuVendor})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Resolusi Layar &amp; Viewport</span>
                    <span className="text-white">
                      {selectedDeviceSpecs.specs?.screenResolution} (VP: {selectedDeviceSpecs.specs?.viewportSize})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Pixel Ratio &amp; Orientasi</span>
                    <span className="text-white">
                      DPR {selectedDeviceSpecs.specs?.pixelRatio}x · {selectedDeviceSpecs.specs?.screenOrientation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 3: Jaringan, Lokasi & Baterai */}
              <div className="space-y-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Wifi className="w-4 h-4" />
                  <span>3. Jaringan, Lokasi &amp; Baterai</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                  <div>
                    <span className="text-slate-500 block">Alamat IP Publik</span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {selectedDeviceSpecs.specs?.publicIp}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Kota, Provinsi, Negara</span>
                    <span className="text-white font-semibold">
                      {selectedDeviceSpecs.specs?.city}, {selectedDeviceSpecs.specs?.region},{' '}
                      {selectedDeviceSpecs.specs?.country}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">ISP / Provider Internet</span>
                    <span className="text-white">{selectedDeviceSpecs.specs?.isp}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Zona Waktu &amp; Bahasa Sistem</span>
                    <span className="text-white font-mono">
                      {selectedDeviceSpecs.specs?.timezone} · {selectedDeviceSpecs.specs?.systemLanguage}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Tipe Koneksi &amp; Kecepatan</span>
                    <span className="text-white font-mono tabular-nums">
                      {selectedDeviceSpecs.specs?.connectionType}
                      {selectedDeviceSpecs.specs?.downlinkMbps
                        ? ` (~${selectedDeviceSpecs.specs.downlinkMbps} Mbps)`
                        : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Status Baterai</span>
                    <span className="text-white font-mono tabular-nums inline-flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5 text-emerald-400" />
                      {selectedDeviceSpecs.specs?.batteryLevelPct !== null &&
                      selectedDeviceSpecs.specs?.batteryLevelPct !== undefined
                        ? `${selectedDeviceSpecs.specs.batteryLevelPct}% (${
                            selectedDeviceSpecs.specs.batteryCharging ? 'Sedang Mengisi' : 'Baterai'
                          })`
                        : 'Tidak diekspos browser'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Location History & Accounts Ever Logged In */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>Daftar Akun Pernah Login ({selectedDeviceSpecs.accountsHistory?.length || 0})</span>
                  </h4>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-2 max-h-44 overflow-y-auto">
                    {(selectedDeviceSpecs.accountsHistory || []).length === 0 ? (
                      <p className="text-slate-500">Hanya akses tamu (belum pernah login akun).</p>
                    ) : (
                      selectedDeviceSpecs.accountsHistory.map((acc) => (
                        <div
                          key={acc.accountKey}
                          className="flex items-center justify-between gap-2 border-b border-slate-800/70 pb-1.5 last:border-0 last:pb-0"
                        >
                          <div className="min-w-0">
                            <div className="text-white font-semibold truncate">{acc.accountName}</div>
                            <div className="text-[10px] text-slate-400 truncate">{acc.accountEmail}</div>
                          </div>
                          <span className="font-mono tabular-nums text-amber-300 shrink-0">
                            {acc.loginCount}x
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-bold text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-400" />
                    <span>Riwayat Lokasi Tertaut Perangkat Ini</span>
                  </h4>
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 space-y-1.5 max-h-44 overflow-y-auto">
                    <div className="text-emerald-300 font-semibold">
                      Aktif: {selectedDeviceSpecs.locationLabel}
                    </div>
                    {(selectedDeviceSpecs.previousLocations || []).length === 0 ? (
                      <p className="text-slate-500 text-[11px]">
                        Belum pernah berpindah ke kota/lokasi lain.
                      </p>
                    ) : (
                      selectedDeviceSpecs.previousLocations.map((loc) => (
                        <div key={loc} className="text-slate-300 text-[11px]">
                          • {loc}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET KONFIRMASI GANDA ADMIN ================= */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-700/70 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Konfirmasi Ganda: Reset Data Kunjungan</span>
                </h3>
                <p className="text-slate-400 mt-1">
                  Tindakan ini akan menghapus permanen seluruh data di koleksi global_visits, account_visits, dan device_sessions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <label className="flex items-start gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={resetCheckbox}
                onChange={(e) => setResetCheckbox(e.target.checked)}
                className="mt-0.5"
              />
              <span>Saya memahami seluruh riwayat log kunjungan akan dihapus permanen.</span>
            </label>

            <div className="space-y-1">
              <label className="text-slate-300 block">
                Ketik persis <strong className="text-rose-300 font-mono">RESET ANALITIK</strong> untuk melanjutkan:
              </label>
              <input
                type="text"
                value={resetPhrase}
                onChange={(e) => setResetPhrase(e.target.value)}
                placeholder="RESET ANALITIK"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetting || !resetCheckbox || resetPhrase.trim().toUpperCase() !== 'RESET ANALITIK'}
                onClick={() => void handleConfirmReset()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer disabled:opacity-40"
              >
                {resetting ? 'Mereset...' : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
