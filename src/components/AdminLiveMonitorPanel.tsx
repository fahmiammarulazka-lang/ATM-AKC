import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Flame,
  KeyRound,
  Laptop,
  Lock,
  Monitor,
  PauseCircle,
  PlayCircle,
  Power,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Smartphone,
  Trash2,
  Unlock,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AutoDetectorRuleKey,
  CustomerPresenceRecord,
  CustomerPresenceStatus,
  LiveSystemActivityLog,
} from '../types/bank';
import {
  AUTO_DETECTOR_69_RULES,
  AUTO_DETECTOR_CATEGORIES_10,
  getAutoDetectorRuleByKey,
  type AutoDetectorCategoryKey,
} from '../data/autoDetector69Catalog';
import {
  formatAccountNumberDisplay,
  formatRupiah,
} from '../utils/bankUtils';

const PRESENCE_STALE_OFFLINE_MS = 25_000;

function resolveEffectivePresenceStatus(
  rec: CustomerPresenceRecord | undefined,
  nowMs: number
): CustomerPresenceStatus {
  if (!rec) return 'offline';
  if (rec.status === 'offline') return 'offline';
  if (!rec.lastHeartbeatMs || nowMs - rec.lastHeartbeatMs > PRESENCE_STALE_OFFLINE_MS) {
    return 'offline';
  }
  return rec.status === 'idle' ? 'idle' : 'online';
}

function formatDurationCompact(fromIso?: string, nowMs = Date.now()): string {
  if (!fromIso) return '-';
  const parsed = Date.parse(fromIso);
  if (!Number.isFinite(parsed)) return '-';
  const diffSec = Math.max(0, Math.floor((nowMs - parsed) / 1000));
  if (diffSec < 60) return `${diffSec} dtk`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins} mnt ${diffSec % 60} dtk`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} jam ${mins % 60} mnt`;
  const days = Math.floor(hrs / 24);
  return `${days} hari ${hrs % 24} jam`;
}

function formatTimeWib(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  } catch {
    return '-';
  }
}

interface AdminTopBarProps {
  onOpenLiveMonitorTab: (focusAccountId?: string) => void;
  onOpenWarningsStudio?: () => void;
}

export const AdminTopAutoDetectorAndSystemWarningBar: React.FC<AdminTopBarProps> = ({
  onOpenLiveMonitorTab,
  onOpenWarningsStudio,
}) => {
  const {
    accounts,
    adminWarnings,
    liveActivityLogs,
    autoDetectedAnomalies,
    liveActivityDetectorConfig,
    accountSpinCounters,
    customerPresenceMap,
    adminHandleAnomalyAction,
    adminToggleWarningActive,
  } = useBank();

  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);
  const [collapseLiveWidget, setCollapseLiveWidget] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [inspectState, setInspectState] = useState<{
    accountId: string;
    openWarningComposer?: boolean;
  } | null>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNowTickMs(Date.now()), 3000);
    return () => window.clearInterval(t);
  }, []);

  const activeSystemWarnings = useMemo(() => {
    return (adminWarnings || []).filter((w) => {
      if (!w.isActive) return false;
      if (dismissedWarningIds.includes(w.id)) return false;
      return true;
    });
  }, [adminWarnings, dismissedWarningIds]);

  const activeAnomalies = useMemo(
    () => (autoDetectedAnomalies || []).filter((a) => a.status === 'active'),
    [autoDetectedAnomalies]
  );

  const presenceSummary = useMemo(() => {
    let online = 0;
    let idle = 0;
    let offline = 0;
    for (const acc of accounts) {
      const st = resolveEffectivePresenceStatus(customerPresenceMap[acc.id], nowTickMs);
      if (st === 'online') online += 1;
      else if (st === 'idle') idle += 1;
      else offline += 1;
    }
    return { online, idle, offline };
  }, [accounts, customerPresenceMap, nowTickMs]);

  const activeRulesCount = useMemo(() => {
    if (!liveActivityDetectorConfig.enabled) return 0;
    return AUTO_DETECTOR_69_RULES.filter(
      (r) => liveActivityDetectorConfig.rulesEnabled?.[r.key] !== false
    ).length;
  }, [liveActivityDetectorConfig]);

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    window.setTimeout(() => setActionFeedback(''), 4500);
  };

  const inspectedAccount = useMemo(
    () =>
      inspectState?.accountId
        ? accounts.find((a) => a.id === inspectState.accountId) || null
        : null,
    [accounts, inspectState?.accountId]
  );

  const inspectedAccountLogs = useMemo(
    () =>
      inspectState?.accountId
        ? liveActivityLogs.filter((l) => l.accountId === inspectState.accountId).slice(0, 60)
        : [],
    [liveActivityLogs, inspectState?.accountId]
  );

  return (
    <div className="space-y-3 mb-4">
      {/* 1. BAR PEMBERITAHUAN SISTEM DI BAGIAN ATAS PANEL ADMIN */}
      {activeSystemWarnings.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-400/70 bg-gradient-to-r from-slate-950 via-amber-950/50 to-slate-950 p-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Bell className="w-3 h-3" />
                PEMBERITAHUAN SISTEM AKTIF ({activeSystemWarnings.length})
              </span>
              <span className="text-[11px] text-amber-200/90 font-semibold">
                Sinkron permanen Laptop ↔ HP &amp; Cloud
              </span>
            </div>
            {onOpenWarningsStudio && (
              <button
                type="button"
                onClick={onOpenWarningsStudio}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-bold cursor-pointer"
              >
                Kelola Studio Peringatan →
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {activeSystemWarnings.map((w) => (
              <div
                key={w.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-900/90 border border-amber-400/40 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                      {w.displayMode === 'banner' ? 'BANNER ATAS' : 'POP-UP TENGAH'}
                    </span>
                    <span className="font-black text-white truncate">{w.title}</span>
                    {w.isPermanent && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-bold">
                        PERMANEN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-300 truncate mt-0.5">{w.message}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminToggleWarningActive(w.id);
                      showToast(res.message);
                    }}
                    className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 text-[10px] font-bold cursor-pointer"
                    title="Matikan Pemberitahuan untuk Seluruh Nasabah"
                  >
                    Matikan Global
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedWarningIds((prev) => [...prev, w.id])}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-400/60 text-amber-200 text-[10px] font-black cursor-pointer"
                    title="Tutup di layar Admin ini saja (Khusus Kartu Tier ADMIN)"
                  >
                    <X className="w-3.5 h-3.5 text-amber-300" />
                    <span>Tutup</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. KOTAK PERINGATAN 69 PENDETEKSI OTOMATIS & STATUS KEHADIRAN REAL-TIME */}
      <div
        className={`rounded-2xl border-2 p-3.5 shadow-xl transition-all ${
          activeAnomalies.length > 0
            ? 'border-rose-500 bg-gradient-to-r from-rose-950/90 via-slate-950 to-amber-950/70 shadow-rose-950/50'
            : 'border-cyan-500/40 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-lg font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
                activeAnomalies.length > 0
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40'
                  : 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>
                {activeAnomalies.length > 0
                  ? `DETEKSI OTOMATIS AKTIF (${activeAnomalies.length} PERINGATAN)`
                  : `69 DETEKSI OTOMATIS AKTIF (${activeRulesCount}/69)`}
              </span>
            </span>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold tabular-nums">
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/40 text-emerald-300">
                ONLINE: {presenceSummary.online}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/40 text-amber-300">
                IDLE: {presenceSummary.idle}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400">
                LAGI OFF: {presenceSummary.offline}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenLiveMonitorTab()}
              className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Intip Live &amp; 69 Deteksi ({liveActivityLogs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCollapseLiveWidget((prev) => !prev)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
            >
              {collapseLiveWidget ? 'Tampilkan Ringkasan' : 'Sembunyikan'}
            </button>
          </div>
        </div>

        {actionFeedback && (
          <div className="mt-2.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button
              type="button"
              onClick={() => setActionFeedback('')}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* DAFTAR KARTU PERINGATAN DETEKSI OTOMATIS AKTIF (DIPICU REAL-TIME OLEH NASABAH/ADMIN) */}
        {activeAnomalies.length > 0 && (
          <div className="mt-3 space-y-2.5">
            {activeAnomalies.map((alert) => {
              const acc = accounts.find((a) => a.id === alert.accountId);
              const ruleMeta = getAutoDetectorRuleByKey(alert.ruleKey);
              const isSpinPaused = Boolean(
                acc?.spinPausedUntil && new Date(acc.spinPausedUntil).getTime() > nowTickMs
              );
              const isFrozen = acc?.cardStatus === 'frozen';
              const pres = customerPresenceMap[alert.accountId];
              const effStatus = resolveEffectivePresenceStatus(pres, nowTickMs);

              return (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-950/95 border-2 border-rose-500/80 shadow-lg space-y-2.5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] uppercase tabular-nums">
                          #{String(alert.ruleNumber || alert.ruleCode || ruleMeta?.code || 1).padStart(2, '0')}{' '}
                          {ruleMeta?.title || alert.title}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase border ${
                            alert.severity === 'kritis'
                              ? 'bg-rose-500/20 border-rose-400/60 text-rose-200'
                              : 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                          }`}
                        >
                          {alert.severity === 'kritis' ? 'KRITIS' : alert.severity === 'tinggi' ? 'TINGGI' : 'MENENGAH'}
                        </span>
                        <span className="font-black text-white text-sm">{alert.accountName}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-cyan-300 font-bold tabular-nums">
                          Rek: {formatAccountNumberDisplay(alert.accountNumber)}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                            effStatus === 'online'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : effStatus === 'idle'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {effStatus === 'online'
                            ? 'ONLINE'
                            : effStatus === 'idle'
                            ? 'IDLE'
                            : 'LAGI OFF'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1 tabular-nums">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatTimeWib(alert.detectedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {alert.detailSummary}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminHandleAnomalyAction(alert.id, 'ignore');
                        showToast(res.message);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-rose-200 transition cursor-pointer"
                      title="Tutup Kartu Peringatan Ini"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Ringkasan Frekuensi, Nominal & Perangkat */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Pemicu &amp; Batas
                      </span>
                      <span className="font-mono font-black text-amber-300 text-xs tabular-nums">
                        {alert.occurrenceCount}x / Batas {alert.thresholdCount} ({alert.windowMinutes}{' '}
                        Menit)
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Nominal / Hadiah Terlibat
                      </span>
                      <span className="font-mono font-black text-emerald-300 text-xs block truncate tabular-nums">
                        {alert.totalRewardOrAmount > 0
                          ? formatRupiah(alert.totalRewardOrAmount)
                          : alert.rewardBreakdownText || 'Non-Nominal / Keamanan'}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Perangkat &amp; Layar Saat Ini
                      </span>
                      <span className="font-semibold text-cyan-200 text-xs block truncate">
                        {alert.deviceLabel || pres?.deviceLabel || 'Terdeteksi'} •{' '}
                        {pres?.currentScreenLabel || 'Mobile Banking'}
                      </span>
                    </div>
                  </div>

                  {/* 6 Tombol Tindakan Cepat Admin */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          setInspectState({
                            accountId: alert.accountId,
                            openWarningComposer: false,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Intip Live Akun</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setInspectState({
                            accountId: alert.accountId,
                            openWarningComposer: true,
                          })
                        }
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400 text-amber-200 font-black text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Peringatan</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const res = adminHandleAnomalyAction(
                            alert.id,
                            isSpinPaused ? 'unpause_spin' : 'pause_spin'
                          );
                          showToast(res.message);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer border ${
                          isSpinPaused
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-200'
                            : 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-400 text-orange-200'
                        }`}
                      >
                        {isSpinPaused ? (
                          <>
                            <PlayCircle className="w-3.5 h-3.5" />
                            <span>Cabut Jeda Spin</span>
                          </>
                        ) : (
                          <>
                            <PauseCircle className="w-3.5 h-3.5" />
                            <span>Jeda Spin</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const res = adminHandleAnomalyAction(
                            alert.id,
                            isFrozen ? 'unfreeze_account' : 'freeze_account'
                          );
                          showToast(res.message);
                        }}
                        className={`px-2.5 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer border ${
                          isFrozen
                            ? 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-400 text-teal-200'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-400 text-rose-200'
                        }`}
                      >
                        {isFrozen ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Buka Beku</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>Bekukan Sementara</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const res = adminHandleAnomalyAction(alert.id, 'reset_pin');
                          showToast(res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/60 text-indigo-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Reset PIN</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const res = adminHandleAnomalyAction(alert.id, 'ignore');
                          showToast(res.message);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tandai Aman</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenLiveMonitorTab(alert.accountId)}
                      className="text-[11px] font-bold text-cyan-300 hover:underline cursor-pointer"
                    >
                      Buka Monitor Lengkap →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WIDGET RINGKAS LIVE MONITOR AKTIVITAS & KEHADIRAN */}
        {!collapseLiveWidget && (
          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Stream Aktivitas &amp; Intip Real-Time</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                  Nasabah:{' '}
                  <strong className="text-cyan-300">
                    {liveActivityLogs.filter((l) => l.actorRole === 'nasabah').length}
                  </strong>{' '}
                  · Admin:{' '}
                  <strong className="text-amber-300">
                    {liveActivityLogs.filter((l) => l.actorRole === 'admin').length}
                  </strong>{' '}
                  · Terdeteksi:{' '}
                  <strong className="text-rose-400">{autoDetectedAnomalies.length}</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {Object.entries(accountSpinCounters)
                  .filter(([, c]) => c.spin10xCountInWindow > 0 || c.totalSpinsInWindow > 0)
                  .slice(0, 3)
                  .map(([accId, c]) => {
                    const acc = accounts.find((a) => a.id === accId);
                    if (!acc) return null;
                    return (
                      <button
                        key={accId}
                        type="button"
                        onClick={() => setInspectState({ accountId: accId })}
                        className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] font-bold cursor-pointer tabular-nums ${
                          c.spin10xCountInWindow >=
                          liveActivityDetectorConfig.spin10xThresholdCount
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                            : 'bg-slate-900 border-amber-400/40 text-amber-300'
                        }`}
                      >
                        {acc.fullName.split(' ')[0]}: Spin 10x {c.spin10xCountInWindow}/
                        {liveActivityDetectorConfig.spin10xThresholdCount}
                      </button>
                    );
                  })}
              </div>
            </div>

            {liveActivityLogs.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-400">
                Sistem siaga memantau 69 aturan deteksi otomatis. Aktivitas nasabah &amp; Admin akan
                muncul otomatis secara real-time di sini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {liveActivityLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    onClick={() => log.accountId && setInspectState({ accountId: log.accountId })}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                      log.isAnomalyDetected
                        ? 'bg-rose-950/50 border-rose-500/70 hover:border-rose-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            log.isAnomalyDetected || log.actorRole === 'auto_detector'
                              ? 'bg-rose-500 text-white'
                              : log.actorRole === 'admin'
                              ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                              : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                          }`}
                        >
                          {log.isAnomalyDetected || log.actorRole === 'auto_detector'
                            ? 'DETEKSI'
                            : log.actorRole === 'admin'
                            ? 'ADMIN'
                            : 'NASABAH'}
                        </span>
                        <span className="font-bold text-white truncate">{log.accountName}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">
                        {log.actionTitle} — {log.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 tabular-nums">
                      {formatTimeWib(log.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* PANEL INTIP LIVE & INSPEKSI AKUN */}
      {inspectedAccount && (
        <AccountActivityInspectionModal
          account={inspectedAccount}
          logs={inspectedAccountLogs}
          presence={customerPresenceMap[inspectedAccount.id]}
          nowTickMs={nowTickMs}
          initialOpenWarningComposer={Boolean(inspectState?.openWarningComposer)}
          onClose={() => setInspectState(null)}
          onActionToast={showToast}
        />
      )}
    </div>
  );
};

interface AccountInspectionModalProps {
  account: ReturnType<typeof useBank>['accounts'][number];
  logs: LiveSystemActivityLog[];
  presence?: CustomerPresenceRecord;
  nowTickMs: number;
  initialOpenWarningComposer?: boolean;
  onClose: () => void;
  onActionToast: (msg: string) => void;
}

const AccountActivityInspectionModal: React.FC<AccountInspectionModalProps> = ({
  account,
  logs,
  presence,
  nowTickMs,
  initialOpenWarningComposer = false,
  onClose,
  onActionToast,
}) => {
  const {
    accountSpinCounters,
    liveActivityDetectorConfig,
    adminToggleAccountSpinPause,
    adminQuickResetPinAttempts,
    adminSaveWarning,
    adminBanCard,
    adminUnbanCard,
  } = useBank();

  const [showWarnForm, setShowWarnForm] = useState<boolean>(initialOpenWarningComposer);
  const [warnTitle, setWarnTitle] = useState<string>('Peringatan Keamanan Akun Bank Nusantara');
  const [warnMessage, setWarnMessage] = useState<string>(
    `Halo ${account.fullName}, sistem pemantauan mendeteksi aktivitas tidak biasa pada rekening Anda. Harap pastikan penggunaan layanan sesuai ketentuan.`
  );
  const [warnMode, setWarnMode] = useState<'popup' | 'banner'>('popup');
  const [warnPermanent, setWarnPermanent] = useState<boolean>(false);

  const effStatus = resolveEffectivePresenceStatus(presence, nowTickMs);
  const spinCounter = accountSpinCounters[account.id] || {
    spin1xCount: 0,
    spin10xCountInWindow: 0,
    totalSpinsInWindow: 0,
    lastSpinAt: '',
  };

  const isSpinPaused = Boolean(
    account.spinPausedUntil && new Date(account.spinPausedUntil).getTime() > nowTickMs
  );
  const isFrozen = account.cardStatus === 'frozen' || account.cardStatus === 'banned';

  const handleSendDirectWarning = () => {
    const res = adminSaveWarning({
      title: warnTitle.trim() || 'Peringatan Admin Bank Nusantara',
      message: warnMessage.trim(),
      iconKey: 'shield-alert',
      colorTheme: warnPermanent ? 'rose' : 'amber',
      displayMode: warnMode,
      isPermanent: warnPermanent,
      showPermanentLabel: warnPermanent,
      dismissible: !warnPermanent,
      targetMode: 'accounts',
      targetTiers: [],
      targetAccountIds: [account.id],
      isActive: true,
    });
    onActionToast(res.message);
    if (res.success) {
      setShowWarnForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border-2 border-cyan-500/60 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Panel Intip Live */}
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px] uppercase flex items-center gap-1">
              <Eye className="w-3 h-3" />
              PANEL INTIP LIVE
            </span>
            <h3 className="font-black text-white text-sm sm:text-base truncate">
              {account.fullName}
            </h3>
            <span className="font-mono text-xs text-cyan-300 tabular-nums">
              ({formatAccountNumberDisplay(account.accountNumber)})
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                effStatus === 'online'
                  ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                  : effStatus === 'idle'
                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {effStatus === 'online'
                ? 'ONLINE AKTIF'
                : effStatus === 'idle'
                ? 'IDLE / DIAM'
                : 'LAGI OFF'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-rose-200 cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* PANTAUAN LAYAR & AKTIVITAS DETIK INI */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {presence?.deviceType === 'mobile' ? (
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                ) : (
                  <Laptop className="w-4 h-4 text-cyan-400" />
                )}
                <span className="font-black text-white text-xs uppercase tracking-wider">
                  Pantauan Layar Real-Time ({presence?.deviceLabel || 'Belum Terdeteksi'})
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                {effStatus === 'offline'
                  ? `Terakhir Off: ${formatTimeWib(presence?.lastOfflineAtIso || presence?.lastActiveAtIso)}`
                  : `Online Sejak: ${formatDurationCompact(presence?.onlineSinceIso, nowTickMs)} lalu`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Halaman / Tab Menu Sedang Dibuka
                </span>
                <span className="font-black text-cyan-300 text-sm block mt-0.5">
                  {effStatus === 'offline'
                    ? 'Tidak Membuka Aplikasi (Lagi Off)'
                    : presence?.currentScreenLabel || 'Mobile Banking • Dashboard Utama'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">
                  Aktivitas Spesifik Detik Ini
                </span>
                <span className="font-bold text-amber-300 text-sm block mt-0.5">
                  {effStatus === 'offline'
                    ? 'Keluar / Menutup Tab atau Layar HP Mati'
                    : presence?.currentActionLabel || 'Sedang aktif di aplikasi'}
                </span>
              </div>
            </div>
          </div>

          {/* METRIK REAL-TIME AKUN */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 tabular-nums">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Saldo Real-Time</span>
              <span className="font-mono font-black text-emerald-300 text-xs sm:text-sm">
                {formatRupiah(account.balance)}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Emas 24K &amp; Diamond</span>
              <span className="font-mono font-bold text-amber-300">
                {(account.goldGrams || 0).toFixed(2)} gr · {(account.diamonds || 0).toLocaleString('id-ID')} 💎
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Tier, Status &amp; Gagal PIN</span>
              <span className="font-black text-white uppercase">
                {account.cardTier} · {account.cardStatus} (PIN:{account.failedPinAttempts || 0})
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Koin &amp; Streak Spin 10x</span>
              <span className="font-mono font-black text-cyan-300">
                {account.spinCoins} Koin · {spinCounter.spin10xCountInWindow}/
                {liveActivityDetectorConfig.spin10xThresholdCount}
              </span>
            </div>
          </div>

          {/* TOMBOL TINDAKAN CEPAT ADMIN */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setShowWarnForm((p) => !p)}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{showWarnForm ? 'Tutup Form Peringatan' : 'Kirim Peringatan Pop-up / Banner'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminToggleAccountSpinPause(
                  account.id,
                  liveActivityDetectorConfig.pauseSpinDefaultMinutes || 10
                );
                onActionToast(res.message);
              }}
              className={`px-3 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1.5 cursor-pointer border ${
                isSpinPaused
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  : 'bg-orange-500/20 border-orange-400 text-orange-200'
              }`}
            >
              {isSpinPaused ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Cabut Jeda Spin</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>
                    Jeda Spin ({liveActivityDetectorConfig.pauseSpinDefaultMinutes || 10}m)
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isFrozen) {
                  const res = adminUnbanCard(account.id);
                  onActionToast(res.message);
                } else {
                  const res = adminBanCard({
                    accountId: account.id,
                    durationType: 'custom',
                    durationMinutes: 60,
                    durationLabel: '1 Jam',
                    reason: 'Dibekukan sementara oleh Admin melalui Panel Intip Live',
                  });
                  onActionToast(res.message);
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1.5 cursor-pointer border ${
                isFrozen
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                  : 'bg-rose-500/20 border-rose-400 text-rose-200'
              }`}
            >
              {isFrozen ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Beku Akun</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bekukan Sementara</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminQuickResetPinAttempts(account.id);
                onActionToast(res.message);
              }}
              className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400 text-indigo-200 font-black text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Reset Percobaan PIN</span>
            </button>
          </div>

          {/* FORM KIRIM PERINGATAN LANGSUNG KE AKUN INI */}
          {showWarnForm && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-400/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-black text-amber-300 text-xs uppercase">
                  Kirim Peringatan Langsung ke {account.fullName}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setWarnMode('popup')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                      warnMode === 'popup'
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    Pop-up Tengah
                  </button>
                  <button
                    type="button"
                    onClick={() => setWarnMode('banner')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border ${
                      warnMode === 'banner'
                        ? 'bg-amber-400 text-slate-950 border-amber-300'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    Banner Atas
                  </button>
                </div>
              </div>
              <input
                type="text"
                value={warnTitle}
                onChange={(e) => setWarnTitle(e.target.value)}
                placeholder="Judul peringatan..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs font-semibold"
              />
              <textarea
                rows={2}
                value={warnMessage}
                onChange={(e) => setWarnMessage(e.target.value)}
                placeholder="Isi pesan peringatan untuk nasabah ini..."
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-xs text-amber-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={warnPermanent}
                    onChange={(e) => setWarnPermanent(e.target.checked)}
                    className="rounded"
                  />
                  <span>Peringatan Permanen / Terkunci (Tidak bisa ditutup nasabah biasa)</span>
                </label>
                <button
                  type="button"
                  onClick={handleSendDirectWarning}
                  className="px-4 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Sekarang</span>
                </button>
              </div>
            </div>
          )}

          {/* 10 AKSI TERAKHIR NASABAH (INTIP LIVE) */}
          <div className="space-y-2">
            <h4 className="font-black text-cyan-300 text-xs uppercase tracking-wider">
              10 Aksi Navigasi &amp; Layar Terakhir Nasabah ({presence?.recentActions?.length || 0})
            </h4>
            {!presence?.recentActions || presence.recentActions.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                Belum ada riwayat perpindahan menu yang terekam pada sesi ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {presence.recentActions.slice(0, 10).map((act) => (
                  <div
                    key={act.id}
                    className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-white truncate">{act.screenLabel}</div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {act.actionLabel || act.title}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0 tabular-nums">
                      {formatTimeWib(act.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* LOG AKTIVITAS TRANSAKSI & SISTEM AKUN INI */}
          <div className="space-y-2">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Log Aktivitas Sistem &amp; Transaksi Akun Ini ({logs.length})
            </h4>
            {logs.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400">
                Belum ada log transaksi atau deteksi untuk akun ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border ${
                      log.isAnomalyDetected
                        ? 'bg-rose-950/40 border-rose-500/70'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">{log.actionTitle}</span>
                      <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {formatTimeWib(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">{log.description}</p>
                    {log.prizesSummary && (
                      <p className="text-[10px] font-mono text-emerald-300 mt-1">
                        Total Hadiah: {log.prizesSummary}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface AdminLiveMonitorTabViewProps {
  initialFocusAccountId?: string | null;
}

export const AdminLiveMonitorTabView: React.FC<AdminLiveMonitorTabViewProps> = ({
  initialFocusAccountId,
}) => {
  const {
    accounts,
    liveActivityLogs,
    autoDetectedAnomalies,
    liveActivityDetectorConfig,
    accountSpinCounters,
    customerPresenceMap,
    clearLiveActivityLogs,
    adminUpdateLiveActivityDetectorConfig,
    adminToggleAll69DetectorRules,
    adminUpdateSingle69DetectorRule,
    adminResetAll69DetectorRules,
    adminToggleAccountSpinPause,
  } = useBank();

  const [nowTickMs, setNowTickMs] = useState<number>(() => Date.now());
  const [presenceFilter, setPresenceFilter] = useState<'all' | CustomerPresenceStatus>('all');
  const [presenceSearch, setPresenceSearch] = useState<string>('');

  // 69 Rules Manager State
  const [selectedRuleCategory, setSelectedRuleCategory] = useState<'all' | AutoDetectorCategoryKey>('all');
  const [ruleSearch, setRuleSearch] = useState<string>('');
  const [show69RulesManager, setShow69RulesManager] = useState<boolean>(true);

  // Activity Stream State
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'nasabah' | 'admin' | 'spin' | 'transaction' | 'anomaly'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inspectState, setInspectState] = useState<{
    accountId: string;
    openWarningComposer?: boolean;
  } | null>(initialFocusAccountId ? { accountId: initialFocusAccountId } : null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  useEffect(() => {
    const t = window.setInterval(() => setNowTickMs(Date.now()), 3000);
    return () => window.clearInterval(t);
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => setFeedbackMsg(''), 4500);
  };

  // Hitung daftar nasabah + status kehadiran real-time (diurutkan: Online -> Idle -> Off)
  const customerPresenceRows = useMemo(() => {
    const rankOrder: Record<CustomerPresenceStatus, number> = { online: 0, idle: 1, offline: 2 };
    return accounts
      .map((acc) => {
        const rec = customerPresenceMap[acc.id];
        const status = resolveEffectivePresenceStatus(rec, nowTickMs);
        return { acc, rec, status };
      })
      .sort((a, b) => {
        if (rankOrder[a.status] !== rankOrder[b.status]) {
          return rankOrder[a.status] - rankOrder[b.status];
        }
        return (b.rec?.lastHeartbeatMs || 0) - (a.rec?.lastHeartbeatMs || 0);
      });
  }, [accounts, customerPresenceMap, nowTickMs]);

  const presenceCounts = useMemo(() => {
    let online = 0;
    let idle = 0;
    let offline = 0;
    for (const row of customerPresenceRows) {
      if (row.status === 'online') online += 1;
      else if (row.status === 'idle') idle += 1;
      else offline += 1;
    }
    return { online, idle, offline };
  }, [customerPresenceRows]);

  const filteredPresenceRows = useMemo(() => {
    const q = presenceSearch.trim().toLowerCase();
    return customerPresenceRows.filter(({ acc, rec, status }) => {
      if (presenceFilter !== 'all' && status !== presenceFilter) return false;
      if (!q) return true;
      return (
        acc.fullName.toLowerCase().includes(q) ||
        acc.accountNumber.toLowerCase().includes(q) ||
        (rec?.currentScreenLabel || '').toLowerCase().includes(q) ||
        (rec?.currentActionLabel || '').toLowerCase().includes(q) ||
        (rec?.deviceLabel || '').toLowerCase().includes(q)
      );
    });
  }, [customerPresenceRows, presenceFilter, presenceSearch]);

  // 69 Rules Filter & Counts
  const active69RulesCount = useMemo(
    () =>
      AUTO_DETECTOR_69_RULES.filter(
        (r) => liveActivityDetectorConfig.rulesEnabled?.[r.key] !== false
      ).length,
    [liveActivityDetectorConfig.rulesEnabled]
  );

  const filtered69Rules = useMemo(() => {
    const q = ruleSearch.trim().toLowerCase();
    return AUTO_DETECTOR_69_RULES.filter((rule) => {
      if (selectedRuleCategory !== 'all' && rule.category !== selectedRuleCategory) return false;
      if (!q) return true;
      return (
        rule.title.toLowerCase().includes(q) ||
        rule.description.toLowerCase().includes(q) ||
        `#${String(rule.code).padStart(2, '0')}`.includes(q) ||
        String(rule.code) === q
      );
    });
  }, [selectedRuleCategory, ruleSearch]);

  const filteredLogs = useMemo(() => {
    return liveActivityLogs.filter((log) => {
      if (categoryFilter === 'nasabah' && log.actorRole !== 'nasabah') return false;
      if (categoryFilter === 'admin' && log.actorRole !== 'admin') return false;
      if (categoryFilter === 'spin' && log.category !== 'spin_game') return false;
      if (categoryFilter === 'transaction' && log.category !== 'transaction') return false;
      if (
        categoryFilter === 'anomaly' &&
        !log.isAnomalyDetected &&
        log.actorRole !== 'auto_detector'
      )
        return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = log.accountName.toLowerCase().includes(q);
        const matchNum = (log.accountNumber || '').toLowerCase().includes(q);
        const matchTitle = log.actionTitle.toLowerCase().includes(q);
        const matchDetail = log.description.toLowerCase().includes(q);
        if (!matchName && !matchNum && !matchTitle && !matchDetail) return false;
      }
      return true;
    });
  }, [liveActivityLogs, categoryFilter, searchQuery]);

  const handleCopyCsvReport = () => {
    const headers = [
      'Waktu',
      'Peran',
      'Kategori',
      'Nama',
      'No_Rekening',
      'Tier',
      'Judul_Aktivitas',
      'Detail',
      'Deteksi_Anomali',
    ];
    const rows = filteredLogs.map((l) => [
      l.timestamp,
      l.actorRole,
      l.category,
      `"${l.accountName.replace(/"/g, '""')}"`,
      l.accountNumber || '-',
      l.cardTier || '-',
      `"${l.actionTitle.replace(/"/g, '""')}"`,
      `"${l.description.replace(/"/g, '""')}"`,
      l.isAnomalyDetected ? 'YA' : 'TIDAK',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    navigator.clipboard?.writeText(csv);
    showToast(`Berhasil menyalin ${filteredLogs.length} baris log aktivitas (CSV) ke clipboard.`);
  };

  const inspectedAccount = useMemo(
    () =>
      inspectState?.accountId
        ? accounts.find((a) => a.id === inspectState.accountId) || null
        : null,
    [accounts, inspectState?.accountId]
  );

  const inspectedAccountLogs = useMemo(
    () =>
      inspectState?.accountId
        ? liveActivityLogs.filter((l) => l.accountId === inspectState.accountId).slice(0, 60)
        : [],
    [liveActivityLogs, inspectState?.accountId]
  );

  return (
    <div className="space-y-5">
      {/* HEADER LIVE MONITOR + RINGKASAN KEHADIRAN & 69 DETEKSI */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                LIVE MONITOR &amp; INTIP REAL-TIME
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Pantauan Kehadiran Nasabah (Online / Idle / Off) &amp; 69 Deteksi Otomatis
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Pantau langsung siapa yang sedang online, diam, atau lagi off, lihat menu apa yang
              dibuka detik ini, dan kelola ke-69 aturan deteksi otomatis secara real-time tanpa
              simulasi buatan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 tabular-nums">
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-black">
              ONLINE: {presenceCounts.online}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-xs font-black">
              IDLE: {presenceCounts.idle}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-400 text-xs font-black">
              LAGI OFF: {presenceCounts.offline}
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-black">
              ATURAN AKTIF: {active69RulesCount}/69
            </div>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold flex items-center justify-between">
            <span>{feedbackMsg}</span>
            <button
              type="button"
              onClick={() => setFeedbackMsg('')}
              className="text-emerald-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 1: PANTAUAN KEHADIRAN & INTIP LIVE NASABAH REAL-TIME */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Intip Nasabah Real-Time ({accounts.length} Akun)</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Diperbarui instan tiap nasabah pindah menu &amp; detak otomatis tiap 5 detik. Klik{' '}
              <strong className="text-cyan-300">Intip Live</strong> untuk melihat layar, perangkat,
              saldo, dan 10 aksi terakhir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `Semua (${accounts.length})` },
                { id: 'online', label: `Online (${presenceCounts.online})` },
                { id: 'idle', label: `Idle / Diam (${presenceCounts.idle})` },
                { id: 'offline', label: `Lagi Off (${presenceCounts.offline})` },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setPresenceFilter(f.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer border transition ${
                  presenceFilter === f.id
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={presenceSearch}
            onChange={(e) => setPresenceSearch(e.target.value)}
            placeholder="Cari nama nasabah, nomor rekening, halaman yang sedang dibuka, atau jenis perangkat..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredPresenceRows.map(({ acc, rec, status }) => {
            const isOnline = status === 'online';
            const isIdle = status === 'idle';
            return (
              <div
                key={acc.id}
                className={`p-3 rounded-xl border transition flex flex-col justify-between gap-2.5 ${
                  isOnline
                    ? 'bg-slate-950 border-emerald-500/40'
                    : isIdle
                    ? 'bg-slate-950 border-amber-500/40'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-black text-white text-xs truncate">{acc.fullName}</div>
                      <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {formatAccountNumberDisplay(acc.accountNumber)} · {acc.cardTier.toUpperCase()}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 flex items-center gap-1 ${
                        isOnline
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : isIdle
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {isOnline ? (
                        <Wifi className="w-3 h-3" />
                      ) : isIdle ? (
                        <Clock className="w-3 h-3" />
                      ) : (
                        <WifiOff className="w-3 h-3" />
                      )}
                      <span>{isOnline ? 'ONLINE' : isIdle ? 'IDLE / DIAM' : 'LAGI OFF'}</span>
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-300 truncate">
                      <Monitor className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        {status === 'offline'
                          ? 'Aplikasi Tertutup / Lagi Off'
                          : rec?.currentScreenLabel || 'Mobile Banking'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 truncate">
                      {status === 'offline'
                        ? rec?.lastOfflineAtIso
                          ? `Off sejak ${formatTimeWib(rec.lastOfflineAtIso)}`
                          : 'Belum ada sesi aktif'
                        : rec?.currentActionLabel || 'Aktif di aplikasi'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 tabular-nums">
                    <span className="flex items-center gap-1">
                      {rec?.deviceType === 'mobile' ? (
                        <Smartphone className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <Laptop className="w-3 h-3 text-slate-400" />
                      )}
                      <span>{rec?.deviceLabel || 'Perangkat Belum Terdeteksi'}</span>
                    </span>
                    <span className="font-mono">
                      {status === 'offline'
                        ? rec?.lastActiveAtIso
                          ? `Terakhir: ${formatTimeWib(rec.lastActiveAtIso)}`
                          : 'Off'
                        : `Aktif ${formatDurationCompact(rec?.onlineSinceIso, nowTickMs)}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <span className="font-mono font-bold text-[11px] text-emerald-300 truncate tabular-nums">
                    {formatRupiah(acc.balance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setInspectState({ accountId: acc.id })}
                    className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Intip Live</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PENGATURAN 69 JENIS DETEKSI OTOMATIS (10 KATEGORI FITUR) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Settings className="w-4 h-4 text-amber-400" />
              <span>
                Pengaturan 69 Jenis Deteksi Otomatis (10 Kategori Fitur) — Aktif{' '}
                <span className="text-cyan-300 tabular-nums">{active69RulesCount}/69</span>
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Semua 69 aturan menunggu pemicu aktivitas nasabah &amp; Admin secara nyata (tanpa
              simulasi). Perubahan langsung tersimpan &amp; sinkron ke semua perangkat.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const res = adminUpdateLiveActivityDetectorConfig({
                  enabled: !liveActivityDetectorConfig.enabled,
                });
                showToast(res.message);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 border cursor-pointer ${
                liveActivityDetectorConfig.enabled
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                  : 'bg-rose-500/20 border-rose-400 text-rose-200'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{liveActivityDetectorConfig.enabled ? 'Mesin ON' : 'Mesin OFF'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminUpdateLiveActivityDetectorConfig({
                  soundAlertEnabled: !liveActivityDetectorConfig.soundAlertEnabled,
                });
                showToast(res.message);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border cursor-pointer ${
                liveActivityDetectorConfig.soundAlertEnabled
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200'
                  : 'bg-slate-950 border-slate-700 text-slate-400'
              }`}
            >
              {liveActivityDetectorConfig.soundAlertEnabled ? (
                <Volume2 className="w-3.5 h-3.5" />
              ) : (
                <VolumeX className="w-3.5 h-3.5" />
              )}
              <span>Suara</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminToggleAll69DetectorRules(
                  true,
                  selectedRuleCategory === 'all' ? undefined : selectedRuleCategory
                );
                showToast(res.message);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[11px] cursor-pointer"
            >
              Aktifkan Semua
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminToggleAll69DetectorRules(
                  false,
                  selectedRuleCategory === 'all' ? undefined : selectedRuleCategory
                );
                showToast(res.message);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] cursor-pointer"
            >
              Matikan Semua
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminResetAll69DetectorRules();
                showToast(res.message);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default</span>
            </button>

            <button
              type="button"
              onClick={() => setShow69RulesManager((p) => !p)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
            >
              {show69RulesManager ? 'Tutup Daftar' : 'Buka 69 Aturan'}
            </button>
          </div>
        </div>

        {show69RulesManager && (
          <div className="space-y-3 pt-1">
            {/* 10 Tab Kategori Fitur */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedRuleCategory('all')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer tabular-nums ${
                  selectedRuleCategory === 'all'
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                Semua ({active69RulesCount}/69)
              </button>
              {AUTO_DETECTOR_CATEGORIES_10.map((cat) => {
                const rulesInCat = AUTO_DETECTOR_69_RULES.filter((r) => r.category === cat.key);
                const activeInCat = rulesInCat.filter(
                  (r) => liveActivityDetectorConfig.rulesEnabled?.[r.key] !== false
                ).length;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedRuleCategory(cat.key)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer tabular-nums ${
                      selectedRuleCategory === cat.key
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {cat.label} ({activeInCat}/{rulesInCat.length})
                  </button>
                );
              })}
            </div>

            {/* Pencarian 69 Aturan */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                placeholder="Cari dari 69 jenis deteksi (misal: Spin 10x, QRIS, PIN, Emas, Sultan, Multi-Device, #01)..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Daftar Kartu Aturan */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
              {filtered69Rules.map((rule) => {
                const isOn = liveActivityDetectorConfig.rulesEnabled?.[rule.key] !== false;
                const currentThreshold =
                  liveActivityDetectorConfig.ruleThresholds?.[rule.key] ?? rule.defaultThreshold;
                const currentWindow =
                  liveActivityDetectorConfig.ruleWindowMinutes?.[rule.key] ??
                  rule.defaultWindowMinutes;

                return (
                  <div
                    key={rule.key}
                    className={`p-3 rounded-xl border transition space-y-2 ${
                      isOn
                        ? 'bg-slate-950 border-slate-800 hover:border-cyan-500/40'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] font-black text-cyan-300 tabular-nums">
                            #{String(rule.code).padStart(2, '0')}
                          </span>
                          <span className="font-black text-white text-xs">{rule.title}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                              rule.severity === 'kritis'
                                ? 'bg-rose-500/20 text-rose-300'
                                : rule.severity === 'tinggi'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {rule.severity === 'kritis'
                              ? 'KRITIS'
                              : rule.severity === 'tinggi'
                              ? 'TINGGI'
                              : 'MENENGAH'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const res = adminUpdateSingle69DetectorRule(rule.key as AutoDetectorRuleKey, {
                            enabled: !isOn,
                          });
                          showToast(res.message);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border shrink-0 cursor-pointer ${
                          isOn
                            ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {isOn ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    {/* Kontrol Batas Angka & Jendela Waktu per Aturan */}
                    <div className="flex flex-wrap items-center gap-2 pt-1.5 border-t border-slate-800/70 text-[11px]">
                      <label className="flex items-center gap-1.5 text-slate-400">
                        <span>Batas ({rule.thresholdUnit}):</span>
                        <input
                          type="number"
                          min={1}
                          value={currentThreshold}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            adminUpdateSingle69DetectorRule(rule.key, { threshold: val });
                          }}
                          className="w-24 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold text-xs tabular-nums"
                        />
                      </label>
                      <label className="flex items-center gap-1.5 text-slate-400">
                        <span>Rentang (mnt):</span>
                        <input
                          type="number"
                          min={1}
                          max={1440}
                          value={currentWindow}
                          onChange={(e) => {
                            const val = Math.max(1, Number(e.target.value) || 1);
                            adminUpdateSingle69DetectorRule(rule.key, { windowMinutes: val });
                          }}
                          className="w-16 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold text-xs tabular-nums"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: TRACKER PROGRES SPIN 1X & SPIN 10X BERUNTUN */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Counter Real-Time Spin 1x &amp; Progres Spin 10x Beruntun per Nasabah</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Batas otomatis saat ini:{' '}
              <strong className="text-amber-300 tabular-nums">
                {liveActivityDetectorConfig.spin10xThresholdCount}x Spin 10x
              </strong>{' '}
              dalam{' '}
              <strong className="text-cyan-300 tabular-nums">
                {liveActivityDetectorConfig.spin10xWindowMinutes} menit
              </strong>
              .
            </p>
          </div>
        </div>

        {Object.keys(accountSpinCounters).length === 0 ? (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 text-center">
            Belum ada nasabah yang memutar Spin the Wheel pada sesi aktif ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {Object.entries(accountSpinCounters).map(([accId, c]) => {
              const acc = accounts.find((a) => a.id === accId);
              if (!acc) return null;
              const isPaused = Boolean(
                acc.spinPausedUntil && new Date(acc.spinPausedUntil).getTime() > nowTickMs
              );
              const pct = Math.min(
                100,
                Math.round(
                  (c.spin10xCountInWindow /
                    Math.max(1, liveActivityDetectorConfig.spin10xThresholdCount)) *
                    100
                )
              );
              return (
                <div
                  key={accId}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs truncate">{acc.fullName}</div>
                      <div className="font-mono text-[10px] text-slate-400 tabular-nums">
                        {formatAccountNumberDisplay(acc.accountNumber)}
                      </div>
                    </div>
                    <span className="font-mono text-xs font-black text-amber-300 tabular-nums">
                      {c.spin10xCountInWindow}/{liveActivityDetectorConfig.spin10xThresholdCount}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        pct >= 100 ? 'bg-rose-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="text-slate-400 font-mono tabular-nums">
                      Spin 1x: {c.spin1xCount} · Total: {c.totalSpinsInWindow}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setInspectState({ accountId: acc.id })}
                        className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold cursor-pointer"
                      >
                        Intip
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = adminToggleAccountSpinPause(acc.id);
                          showToast(res.message);
                        }}
                        className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold cursor-pointer"
                      >
                        {isPaused ? 'Buka Jeda' : 'Jeda Spin'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: STREAM AKTIVITAS REAL-TIME (500 LOG TERBARU) */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Stream Seluruh Aktivitas Real-Time ({filteredLogs.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Total anomali tertangkap:{' '}
              <strong className="text-rose-400 tabular-nums">{autoDetectedAnomalies.length}</strong>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyCsvReport}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearLiveActivityLogs();
                showToast('Stream log aktivitas sesi ini dibersihkan.');
              }}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan Log</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'nasabah', label: 'Nasabah' },
              { id: 'admin', label: 'Admin' },
              { id: 'spin', label: 'Spin & Gacha' },
              { id: 'transaction', label: 'Transaksi' },
              { id: 'anomaly', label: 'Deteksi Otomatis' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCategoryFilter(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer ${
                categoryFilter === tab.id
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-950 text-slate-300 border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter log aktivitas..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
              Belum ada log yang cocok dengan filter saat ini.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => log.accountId && setInspectState({ accountId: log.accountId })}
                className={`p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2 cursor-pointer transition ${
                  log.isAnomalyDetected
                    ? 'bg-rose-950/40 border-rose-500/60 hover:border-rose-400'
                    : 'bg-slate-950 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                        log.isAnomalyDetected || log.actorRole === 'auto_detector'
                          ? 'bg-rose-500 text-white'
                          : log.actorRole === 'admin'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      {log.isAnomalyDetected || log.actorRole === 'auto_detector'
                        ? 'DETEKSI'
                        : log.actorRole === 'admin'
                        ? 'ADMIN'
                        : 'NASABAH'}
                    </span>
                    <span className="font-black text-white">{log.accountName}</span>
                    {log.accountNumber && (
                      <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                        ({formatAccountNumberDisplay(log.accountNumber)})
                      </span>
                    )}
                    <span className="font-bold text-cyan-200">• {log.actionTitle}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">{log.description}</p>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0 tabular-nums">
                  {formatTimeWib(log.timestamp)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PANEL INTIP LIVE MODAL */}
      {inspectedAccount && (
        <AccountActivityInspectionModal
          account={inspectedAccount}
          logs={inspectedAccountLogs}
          presence={customerPresenceMap[inspectedAccount.id]}
          nowTickMs={nowTickMs}
          initialOpenWarningComposer={Boolean(inspectState?.openWarningComposer)}
          onClose={() => setInspectState(null)}
          onActionToast={showToast}
        />
      )}
    </div>
  );
};
