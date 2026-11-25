import React, { useState, useMemo } from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Flame,
  Lock,
  PauseCircle,
  PlayCircle,
  Search,
  Settings,
  ShieldAlert,
  Trash2,
  Unlock,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { LiveSystemActivityLog } from '../types/bank';
import {
  formatAccountNumberDisplay,
  formatRupiah,
} from '../utils/bankUtils';

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
    adminHandleAnomalyAction,
    adminSimulateSpin10x5xDetection,
    adminToggleWarningActive,
  } = useBank();

  const [dismissedWarningIds, setDismissedWarningIds] = useState<string[]>([]);
  const [collapseLiveWidget, setCollapseLiveWidget] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [inspectAccountId, setInspectAccountId] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setActionFeedback(msg);
    window.setTimeout(() => setActionFeedback(''), 4500);
  };

  const inspectedAccount = useMemo(
    () => (inspectAccountId ? accounts.find((a) => a.id === inspectAccountId) || null : null),
    [accounts, inspectAccountId]
  );

  const inspectedAccountLogs = useMemo(
    () =>
      inspectAccountId
        ? liveActivityLogs.filter((l) => l.accountId === inspectAccountId).slice(0, 60)
        : [],
    [liveActivityLogs, inspectAccountId]
  );

  return (
    <div className="space-y-3 mb-4">
      {/* 1. BAR PEMBERITAHUAN SISTEM DI BAGIAN ATAS PANEL ADMIN (DENGAN TANDA SILANG X KHUSUS TIER ADMIN) */}
      {activeSystemWarnings.length > 0 && (
        <div className="rounded-2xl border-2 border-amber-400/70 bg-gradient-to-r from-slate-950 via-amber-950/50 to-slate-950 p-3 shadow-lg">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1">
                <Bell className="w-3 h-3" />
                PEMBERITAHUAN SISTEM AKTIF DI ATAS LAYAR ({activeSystemWarnings.length})
              </span>
              <span className="text-[11px] text-amber-200/90 font-semibold">
                Tampil menempel (sticky) di bagian paling atas layar seluruh nasabah
              </span>
            </div>
            {onOpenWarningsStudio && (
              <button
                type="button"
                onClick={onOpenWarningsStudio}
                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-200 text-[11px] font-bold cursor-pointer"
              >
                Kelola Pemberitahuan Sistem →
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
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                      {w.colorTheme}
                    </span>
                    <span className="font-black text-white truncate">{w.title}</span>
                    {w.isPermanent && (
                      <span className="px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[9px] font-bold">
                        PERMANEN (Nasabah Tidak Bisa Tutup)
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

      {/* 2. KOTAK PERINGATAN PENDETEKSI OTOMATIS REAL-TIME (SPIN 10X SEBANYAK 5X, DLL.) DI ATAS PANEL ADMIN */}
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
                  ? `🚨 DETEKSI OTOMATIS AKTIF (${activeAnomalies.length} PERINGATAN)`
                  : '🛡️ PENDETEKSI OTOMATIS & LIVE MONITOR AKTIF'}
              </span>
            </span>
            <span className="text-xs text-slate-300">
              Deteksi otomatis nasabah{' '}
              <strong className="text-amber-300">
                Spin 10x sebanyak {liveActivityDetectorConfig.spin10xThresholdCount}x
              </strong>{' '}
              ({liveActivityDetectorConfig.spin10xWindowMinutes} menit), transaksi beruntun, &amp; gagal PIN
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                const res = adminSimulateSpin10x5xDetection();
                showToast(res.message);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow cursor-pointer"
              title="Uji coba langsung deteksi otomatis nasabah Spin 10x sebanyak 5 kali beruntun"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulasi Spin 10x (5x)</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenLiveMonitorTab()}
              className="px-2.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Buka Tab Live Monitor ({liveActivityLogs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setCollapseLiveWidget((prev) => !prev)}
              className="px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-bold cursor-pointer"
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

        {/* DAFTAR KARTU PERINGATAN DETEKSI OTOMATIS AKTIF */}
        {activeAnomalies.length > 0 && (
          <div className="mt-3 space-y-2.5">
            {activeAnomalies.map((alert) => {
              const acc = accounts.find((a) => a.id === alert.accountId);
              const isSpinPaused = Boolean(
                acc?.spinPausedUntil && new Date(acc.spinPausedUntil).getTime() > Date.now()
              );
              const isFrozen = acc?.cardStatus === 'frozen';

              return (
                <div
                  key={alert.id}
                  className="p-3 rounded-xl bg-slate-950/95 border-2 border-rose-500/80 shadow-lg space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-black text-[10px] uppercase">
                          🚨{' '}
                          {alert.ruleKey === 'spin_10x_streak'
                            ? 'DETEKSI SPIN 10X (5X BERUNTUN)'
                            : 'ANOMALI AKTIVITAS'}
                        </span>
                        <span className="font-black text-white text-sm">
                          {alert.accountName}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-cyan-300 font-bold">
                          Rek: {formatAccountNumberDisplay(alert.accountNumber)}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-black uppercase">
                          Tier {alert.cardTier.toUpperCase()}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {new Date(alert.detectedAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-medium">
                        {alert.detailSummary}
                      </p>
                    </div>

                    {/* Tombol Tanda Silang (X) Tutup Peringatan Deteksi */}
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminHandleAnomalyAction(alert.id, 'ignore');
                        showToast(res.message);
                      }}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-rose-200 transition cursor-pointer"
                      title="Tutup Kartu Peringatan Deteksi Otomatis Ini"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Detail Spin 10x & Total Hadiah */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Frekuensi Terdeteksi
                      </span>
                      <span className="font-mono font-black text-amber-300 text-xs">
                        {alert.occurrenceCount}x Spin 10x ({alert.occurrenceCount * 10} Putaran) /{' '}
                        {alert.windowMinutes} Menit
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 md:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">
                        Total &amp; Rincian Hadiah Selama Beruntun
                      </span>
                      <span className="font-mono font-black text-emerald-300 text-xs block">
                        {alert.totalRewardOrAmount > 0
                          ? `${formatRupiah(alert.totalRewardOrAmount)} • `
                          : ''}
                        {alert.rewardBreakdownText}
                      </span>
                    </div>
                  </div>

                  {/* 4 Tombol Tindakan Cepat Admin: Pantau Akun, Jeda Spin, Bekukan Sementara, Abaikan */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-slate-800/80">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setInspectAccountId(alert.accountId);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pantau Akun</span>
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
                        className={`px-3 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1.5 cursor-pointer border ${
                          isSpinPaused
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-400 text-emerald-200'
                            : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-400 text-amber-200'
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
                          const res = adminHandleAnomalyAction(
                            alert.id,
                            isFrozen ? 'unfreeze_account' : 'freeze_account'
                          );
                          showToast(res.message);
                        }}
                        className={`px-3 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1.5 cursor-pointer border ${
                          isFrozen
                            ? 'bg-teal-500/20 hover:bg-teal-500/30 border-teal-400 text-teal-200'
                            : 'bg-rose-500/20 hover:bg-rose-500/30 border-rose-400 text-rose-200'
                        }`}
                      >
                        {isFrozen ? (
                          <>
                            <Unlock className="w-3.5 h-3.5" />
                            <span>Buka Bekukan Akun</span>
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
                          const res = adminHandleAnomalyAction(alert.id, 'ignore');
                          showToast(res.message);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Abaikan / Selesai</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenLiveMonitorTab(alert.accountId)}
                      className="text-[11px] font-bold text-amber-300 hover:underline cursor-pointer"
                    >
                      Lihat di Live Monitor Lengkap →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WIDGET RINGKAS LIVE MONITOR AKTIVITAS NASABAH & ADMIN */}
        {!collapseLiveWidget && (
          <div className="mt-3 pt-3 border-t border-slate-800/90 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-black text-white flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Live Stream Aktivitas Terkini</span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Nasabah:{' '}
                  <strong className="text-cyan-300">
                    {liveActivityLogs.filter((l) => l.actorRole === 'nasabah').length}
                  </strong>{' '}
                  · Admin:{' '}
                  <strong className="text-amber-300">
                    {liveActivityLogs.filter((l) => l.actorRole === 'admin').length}
                  </strong>{' '}
                  · Anomali:{' '}
                  <strong className="text-rose-400">{autoDetectedAnomalies.length}</strong>
                </span>
              </div>

              {/* Indikator Cepat Counter Spin 10x Aktif */}
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
                        onClick={() => setInspectAccountId(accId)}
                        className={`px-2 py-0.5 rounded-lg border font-mono text-[10px] font-bold cursor-pointer ${
                          c.spin10xCountInWindow >=
                          liveActivityDetectorConfig.spin10xThresholdCount
                            ? 'bg-rose-500/20 border-rose-400 text-rose-200 animate-pulse'
                            : 'bg-slate-900 border-amber-400/40 text-amber-300'
                        }`}
                        title="Klik untuk pantau detail akun nasabah ini"
                      >
                        🎡 {acc.fullName.split(' ')[0]}: Spin 10x {c.spin10xCountInWindow}/
                        {liveActivityDetectorConfig.spin10xThresholdCount}
                      </button>
                    );
                  })}
              </div>
            </div>

            {liveActivityLogs.length === 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-center text-xs text-slate-400">
                Belum ada aktivitas terekam di sesi ini. Klik{' '}
                <strong>"Simulasi Spin 10x (5x)"</strong> di kanan atas untuk melihat deteksi otomatis real-time!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {liveActivityLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    onClick={() => setInspectAccountId(log.accountId || null)}
                    className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                      log.isAnomalyDetected
                        ? 'bg-rose-950/50 border-rose-500/70 hover:border-rose-400'
                        : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/40'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                            log.isAnomalyDetected || log.actorRole === 'auto_detector'
                              ? 'bg-rose-500 text-white'
                              : log.actorRole === 'admin'
                              ? 'bg-amber-400/20 border border-amber-400/40 text-amber-300'
                              : 'bg-cyan-500/20 border border-cyan-400/40 text-cyan-300'
                          }`}
                        >
                          {log.isAnomalyDetected || log.actorRole === 'auto_detector'
                            ? '🚨 DETEKSI OTOMATIS'
                            : log.actorRole === 'admin'
                            ? '👑 ADMIN'
                            : '👤 NASABAH'}
                        </span>
                        <span className="font-bold text-white truncate">{log.accountName}</span>
                        {log.spin10xStreakCount !== undefined && log.spinCountType === 10 && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-black">
                            Spin 10x: {log.spin10xStreakCount}/
                            {liveActivityDetectorConfig.spin10xThresholdCount}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 truncate mt-0.5">
                        {log.actionTitle} — {log.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL INSPEKSI AKUN & RIWAYAT AKTIVITAS LENGKAP */}
      {inspectedAccount && (
        <AccountActivityInspectionModal
          account={inspectedAccount}
          logs={inspectedAccountLogs}
          onClose={() => setInspectAccountId(null)}
          onActionToast={showToast}
        />
      )}
    </div>
  );
};

interface AccountInspectionModalProps {
  account: ReturnType<typeof useBank>['accounts'][number];
  logs: LiveSystemActivityLog[];
  onClose: () => void;
  onActionToast: (msg: string) => void;
}

const AccountActivityInspectionModal: React.FC<AccountInspectionModalProps> = ({
  account,
  logs,
  onClose,
  onActionToast,
}) => {
  const {
    accountSpinCounters,
    liveActivityDetectorConfig,
    adminToggleAccountSpinPause,
    adminBanCard,
    adminUnbanCard,
    adminSimulateSpin10x5xDetection,
  } = useBank();

  const spinCounter = accountSpinCounters[account.id] || {
    spin1xCount: 0,
    spin10xCountInWindow: 0,
    totalSpinsInWindow: 0,
    lastSpinAt: '',
  };

  const isSpinPaused = Boolean(
    account.spinPausedUntil && new Date(account.spinPausedUntil).getTime() > Date.now()
  );
  const isFrozen = account.cardStatus === 'frozen';

  return (
    <div className="fixed inset-0 z-[150] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border-2 border-cyan-400/60 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px] uppercase">
              INSPEKSI LIVE MONITOR
            </span>
            <h3 className="font-black text-white text-sm sm:text-base">
              {account.fullName} ({formatAccountNumberDisplay(account.accountNumber)})
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 border border-slate-700 hover:border-rose-400 text-slate-300 hover:text-rose-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Status & Counter Spin */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Tier &amp; Status Kartu</span>
              <span className="font-black text-amber-300 uppercase">
                {account.cardTier} · {account.cardStatus}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Saldo &amp; Koin Spin</span>
              <span className="font-mono font-bold text-emerald-300">
                {formatRupiah(account.balance)} · {account.spinCoins} Koin
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Spin 1x / Total Putaran</span>
              <span className="font-mono font-black text-cyan-300">
                1x: {spinCounter.spin1xCount} · Putaran: {spinCounter.totalSpinsInWindow}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Streak Spin 10x Saat Ini</span>
              <span
                className={`font-mono font-black text-sm ${
                  spinCounter.spin10xCountInWindow >=
                  liveActivityDetectorConfig.spin10xThresholdCount
                    ? 'text-rose-400'
                    : 'text-amber-300'
                }`}
              >
                {spinCounter.spin10xCountInWindow} /{' '}
                {liveActivityDetectorConfig.spin10xThresholdCount}
              </span>
            </div>
          </div>

          {/* Tombol Kontrol Langsung Admin */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800">
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
                  : 'bg-amber-500/20 border-amber-400 text-amber-200'
              }`}
            >
              {isSpinPaused ? (
                <>
                  <PlayCircle className="w-3.5 h-3.5" />
                  <span>Cabut Jeda Spin Sekarang</span>
                </>
              ) : (
                <>
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>
                    Jeda Spin ({liveActivityDetectorConfig.pauseSpinDefaultMinutes || 10} Menit)
                  </span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (account.cardStatus === 'banned' || isFrozen) {
                  const res = adminUnbanCard(account.id);
                  onActionToast(res.message);
                } else {
                  const res = adminBanCard({
                    accountId: account.id,
                    durationType: 'custom',
                    durationMinutes: 60,
                    durationLabel: '1 Jam',
                    reason: 'Dibekukan sementara oleh Admin melalui Live Monitor Aktivitas',
                  });
                  onActionToast(res.message);
                }
              }}
              className={`px-3 py-1.5 rounded-lg font-black text-[11px] flex items-center gap-1.5 cursor-pointer border ${
                account.cardStatus === 'banned' || isFrozen
                  ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                  : 'bg-rose-500/20 border-rose-400 text-rose-200'
              }`}
            >
              {isFrozen ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Buka Bekukan Kartu</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Bekukan Kartu Sementara</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                const res = adminSimulateSpin10x5xDetection(account.id);
                onActionToast(res.message);
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[11px] flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Simulasi 5x Spin 10x Akun Ini</span>
            </button>
          </div>

          {/* Daftar Riwayat Aktivitas Akun Ini */}
          <div className="space-y-2">
            <h4 className="font-black text-white text-xs uppercase tracking-wider">
              Riwayat Aktivitas Real-Time Akun Ini ({logs.length})
            </h4>
            {logs.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-slate-400">
                Belum ada log aktivitas untuk akun ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
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
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
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
    liveActivityDetectorConfig,
    accountSpinCounters,
    clearLiveActivityLogs,
    adminUpdateLiveActivityDetectorConfig,
    adminToggleAccountSpinPause,
    adminSimulateSpin10x5xDetection,
  } = useBank();

  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'nasabah' | 'admin' | 'spin_game' | 'transaction' | 'anomaly'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [simTargetAccountId, setSimTargetAccountId] = useState<string>(
    initialFocusAccountId || ''
  );
  const [inspectAccountId, setInspectAccountId] = useState<string | null>(
    initialFocusAccountId || null
  );
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');
  const [showSettingsPanel, setShowSettingsPanel] = useState<boolean>(true);

  const [draftSpin10xThreshold, setDraftSpin10xThreshold] = useState<number>(
    liveActivityDetectorConfig.spin10xThresholdCount
  );
  const [draftSpin10xWindow, setDraftSpin10xWindow] = useState<number>(
    liveActivityDetectorConfig.spin10xWindowMinutes
  );
  const [draftRapidTxThreshold, setDraftRapidTxThreshold] = useState<number>(
    liveActivityDetectorConfig.rapidTxThresholdCount
  );
  const [draftRapidTxWindow, setDraftRapidTxWindow] = useState<number>(
    liveActivityDetectorConfig.rapidTxWindowMinutes
  );
  const [draftPinFailThreshold, setDraftPinFailThreshold] = useState<number>(
    liveActivityDetectorConfig.repeatedPinFailThreshold
  );
  const [draftLargeMutationRupiah, setDraftLargeMutationRupiah] = useState<number>(
    liveActivityDetectorConfig.largeAssetMutationThresholdRupiah
  );
  const [draftPauseMinutes, setDraftPauseMinutes] = useState<number>(
    liveActivityDetectorConfig.pauseSpinDefaultMinutes
  );

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    window.setTimeout(() => setFeedbackMsg(''), 4500);
  };

  const filteredLogs = useMemo(() => {
    return liveActivityLogs.filter((log) => {
      if (categoryFilter === 'nasabah' && log.actorRole !== 'nasabah') return false;
      if (categoryFilter === 'admin' && log.actorRole !== 'admin') return false;
      if (categoryFilter === 'spin_game' && log.category !== 'spin_game') return false;
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

  const handleSaveDetectorSettings = () => {
    const res = adminUpdateLiveActivityDetectorConfig({
      spin10xThresholdCount: Math.max(1, Number(draftSpin10xThreshold) || 5),
      spin10xWindowMinutes: Math.max(1, Number(draftSpin10xWindow) || 5),
      rapidTxThresholdCount: Math.max(2, Number(draftRapidTxThreshold) || 5),
      rapidTxWindowMinutes: Math.max(1, Number(draftRapidTxWindow) || 3),
      repeatedPinFailThreshold: Math.max(2, Number(draftPinFailThreshold) || 3),
      largeAssetMutationThresholdRupiah: Math.max(
        100_000,
        Number(draftLargeMutationRupiah) || 25_000_000
      ),
      pauseSpinDefaultMinutes: Math.max(1, Number(draftPauseMinutes) || 10),
    });
    showToast(res.message);
  };

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
    showToast(
      `Berhasil menyalin ${filteredLogs.length} baris log aktivitas (format CSV) ke clipboard!`
    );
  };

  const inspectedAccount = useMemo(
    () => (inspectAccountId ? accounts.find((a) => a.id === inspectAccountId) || null : null),
    [accounts, inspectAccountId]
  );

  const inspectedAccountLogs = useMemo(
    () =>
      inspectAccountId
        ? liveActivityLogs.filter((l) => l.accountId === inspectAccountId).slice(0, 60)
        : [],
    [liveActivityLogs, inspectAccountId]
  );

  return (
    <div className="space-y-5">
      {/* HEADER LIVE MONITOR & TOMBOL SIMULASI */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-950 to-cyan-950/40 border border-cyan-500/40 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-500 text-slate-950 font-black text-[10px] uppercase">
                📡 LIVE MONITOR REAL-TIME
              </span>
              <h2 className="text-base sm:text-lg font-black text-white">
                Pemantau Seluruh Aktivitas Nasabah &amp; Admin + Pendeteksi Otomatis
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Menampilkan hingga <strong>500 aktivitas terbaru</strong> secara langsung tanpa reload. Saat nasabah melakukan{' '}
              <strong className="text-amber-300">
                Spin 10x sebanyak {liveActivityDetectorConfig.spin10xThresholdCount} kali
              </strong>{' '}
              dalam {liveActivityDetectorConfig.spin10xWindowMinutes} menit, sistem otomatis mengirim{' '}
              <strong className="text-amber-300">Notifikasi Kartu Tier ADMIN</strong> &amp; memunculkan kotak peringatan di atas Panel Admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={simTargetAccountId}
              onChange={(e) => setSimTargetAccountId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold"
            >
              <option value="">Pilih Nasabah Simulasi (Otomatis)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.fullName} ({formatAccountNumberDisplay(acc.accountNumber)})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                const res = adminSimulateSpin10x5xDetection(simTargetAccountId || undefined);
                showToast(res.message);
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>
                Simulasi Nasabah Spin 10x Sebanyak {liveActivityDetectorConfig.spin10xThresholdCount}x
              </span>
            </button>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-xs font-bold">
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* TRACKER PROGRES SPIN 1X & SPIN 10X BERUNTUN PER NASABAH */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-black text-white text-sm flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Counter Real-Time Spin 1x &amp; Progres Spin 10x Beruntun per Nasabah</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Memantau progres beruntun dari{' '}
              <strong>1/{liveActivityDetectorConfig.spin10xThresholdCount}</strong> hingga{' '}
              <strong>
                {liveActivityDetectorConfig.spin10xThresholdCount}/
                {liveActivityDetectorConfig.spin10xThresholdCount}
              </strong>{' '}
              dalam jendela {liveActivityDetectorConfig.spin10xWindowMinutes} menit terakhir.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {accounts.slice(0, 9).map((acc) => {
            const counter = accountSpinCounters[acc.id] || {
              spin1xCount: 0,
              spin10xCountInWindow: 0,
              totalSpinsInWindow: 0,
              lastSpinAt: '',
            };
            const threshold = Math.max(1, liveActivityDetectorConfig.spin10xThresholdCount || 5);
            const pct = Math.min(100, Math.round((counter.spin10xCountInWindow / threshold) * 100));
            const isReached = counter.spin10xCountInWindow >= threshold;
            const isPaused = Boolean(
              acc.spinPausedUntil && new Date(acc.spinPausedUntil).getTime() > Date.now()
            );

            return (
              <div
                key={acc.id}
                className={`p-3 rounded-xl border space-y-2 ${
                  isReached
                    ? 'bg-rose-950/40 border-rose-500/80'
                    : 'bg-slate-950/90 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-black text-white text-xs truncate">{acc.fullName}</div>
                    <div className="font-mono text-[10px] text-slate-400">
                      {formatAccountNumberDisplay(acc.accountNumber)} · Tier{' '}
                      {acc.cardTier.toUpperCase()}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-xs font-black ${
                      isReached
                        ? 'bg-rose-500 text-white animate-pulse'
                        : counter.spin10xCountInWindow > 0
                        ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    {counter.spin10xCountInWindow}/{threshold} Spin 10x
                  </span>
                </div>

                {/* Progress Bar Spin 10x */}
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isReached
                        ? 'bg-gradient-to-r from-rose-500 to-amber-400'
                        : 'bg-gradient-to-r from-cyan-400 to-amber-400'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>Spin 1x: {counter.spin1xCount}x</span>
                  <span>Total Putaran: {counter.totalSpinsInWindow}x</span>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setInspectAccountId(acc.id)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-[10px] cursor-pointer"
                  >
                    👁️ Detail &amp; Log
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = adminToggleAccountSpinPause(
                        acc.id,
                        liveActivityDetectorConfig.pauseSpinDefaultMinutes || 10
                      );
                      showToast(res.message);
                    }}
                    className={`px-2 py-1 rounded-lg font-bold text-[10px] cursor-pointer border ${
                      isPaused
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                        : 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                    }`}
                  >
                    {isPaused ? '▶️ Buka Jeda Spin' : '⏸️ Jeda Spin'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PENGATURAN SENSITIVITAS PENDETEKSI OTOMATIS */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <h3 className="font-black text-white text-sm">
              Pengaturan Sensitivitas &amp; Aturan Pendeteksi Otomatis
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const res = adminUpdateLiveActivityDetectorConfig({
                  soundAlertEnabled: !liveActivityDetectorConfig.soundAlertEnabled,
                });
                showToast(res.message);
              }}
              className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer ${
                liveActivityDetectorConfig.soundAlertEnabled
                  ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {liveActivityDetectorConfig.soundAlertEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Suara Alert Aktif</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Suara Alert Mati</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsPanel((prev) => !prev)}
              className="text-xs text-cyan-400 hover:underline font-bold cursor-pointer"
            >
              {showSettingsPanel ? 'Tutup Pengaturan' : 'Buka Pengaturan'}
            </button>
          </div>
        </div>

        {showSettingsPanel && (
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block">
                  Batas Deteksi Spin 10x Beruntun (Kali)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={draftSpin10xThreshold}
                  onChange={(e) => setDraftSpin10xThreshold(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 block">
                  Default: 5x Spin 10x (= 50 putaran)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block">
                  Jendela Waktu Spin 10x (Menit)
                </label>
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={draftSpin10xWindow}
                  onChange={(e) => setDraftSpin10xWindow(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                />
                <span className="text-[10px] text-slate-500 block">
                  Default: dalam 5 menit terakhir
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block">
                  Batas Transaksi Cepat (Kali / Menit)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={draftRapidTxThreshold}
                    onChange={(e) => setDraftRapidTxThreshold(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={draftRapidTxWindow}
                    onChange={(e) => setDraftRapidTxWindow(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Default: 5x transaksi dalam 3 menit
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="text-[10px] text-slate-400 font-bold block">
                  Ambang Mutasi Besar (Rp) &amp; Jeda Spin (Menit)
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="number"
                    min={100000}
                    step={1000000}
                    value={draftLargeMutationRupiah}
                    onChange={(e) => setDraftLargeMutationRupiah(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={draftPauseMinutes}
                    onChange={(e) => setDraftPauseMinutes(Number(e.target.value))}
                    className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Default: Rp 25 Juta · Jeda Spin 10m
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { key: 'spin_10x_streak', label: 'Deteksi Spin 10x Beruntun' },
                    { key: 'rapid_tx_topup', label: 'Deteksi Transfer/Top-Up Cepat' },
                    { key: 'repeated_pin_fail', label: 'Deteksi Gagal PIN Berulang' },
                    { key: 'large_asset_mutation', label: 'Deteksi Mutasi Saldo Besar' },
                  ] as const
                ).map((rule) => {
                  const active = liveActivityDetectorConfig.rulesEnabled[rule.key] !== false;
                  return (
                    <button
                      key={rule.key}
                      type="button"
                      onClick={() =>
                        adminUpdateLiveActivityDetectorConfig({
                          rulesEnabled: {
                            ...liveActivityDetectorConfig.rulesEnabled,
                            [rule.key]: !active,
                          },
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold cursor-pointer ${
                        active
                          ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      {active ? '✓ ' : '✕ '}
                      {rule.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleSaveDetectorSettings}
                className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer shadow"
              >
                Simpan Pengaturan Pendeteksi
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FILTER 6 KATEGORI + PENCARIAN + EKSPOR CSV + BERSIHKAN RIWAYAT */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'all', label: `Semua (${liveActivityLogs.length})` },
                {
                  id: 'nasabah',
                  label: `👤 Nasabah (${
                    liveActivityLogs.filter((l) => l.actorRole === 'nasabah').length
                  })`,
                },
                {
                  id: 'admin',
                  label: `👑 Admin (${
                    liveActivityLogs.filter((l) => l.actorRole === 'admin').length
                  })`,
                },
                {
                  id: 'spin_game',
                  label: `🎡 Spin & Game (${
                    liveActivityLogs.filter((l) => l.category === 'spin_game').length
                  })`,
                },
                {
                  id: 'transaction',
                  label: `💸 Transaksi (${
                    liveActivityLogs.filter((l) => l.category === 'transaction').length
                  })`,
                },
                {
                  id: 'anomaly',
                  label: `🚨 Deteksi Otomatis (${
                    liveActivityLogs.filter(
                      (l) => l.isAnomalyDetected || l.actorRole === 'auto_detector'
                    ).length
                  })`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer transition ${
                  categoryFilter === tab.id
                    ? 'bg-cyan-500 text-slate-950 shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama, rekening, aktivitas..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyCsvReport}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Salin CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                clearLiveActivityLogs();
                showToast('Riwayat Live Monitor berhasil dibersihkan.');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/40 text-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Bersihkan</span>
            </button>
          </div>
        </div>

        {/* DAFTAR STREAM AKTIVITAS REAL-TIME (MAKS 500) */}
        <div className="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
          {filteredLogs.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
              <p className="font-black text-white text-sm">
                Belum ada aktivitas pada filter ini
              </p>
              <p className="text-xs text-slate-400">
                Seluruh aktivitas Spin 1x, Spin 10x, transfer, top up QRIS, login/gagal PIN, buat kartu, laporan bug, dan tindakan Admin akan langsung muncul real-time di sini.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setInspectAccountId(log.accountId || null)}
                className={`p-3 rounded-xl border transition cursor-pointer flex flex-wrap items-center justify-between gap-2 ${
                  log.isAnomalyDetected || log.actorRole === 'auto_detector'
                    ? 'bg-gradient-to-r from-rose-950/60 via-slate-950 to-amber-950/40 border-rose-500/80 shadow-md'
                    : log.actorRole === 'admin'
                    ? 'bg-slate-950/90 border-amber-500/30 hover:border-amber-400/60'
                    : 'bg-slate-950/80 border-slate-800 hover:border-cyan-500/50'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                        log.isAnomalyDetected || log.actorRole === 'auto_detector'
                          ? 'bg-rose-500 text-white animate-pulse'
                          : log.actorRole === 'admin'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-cyan-500/20 border border-cyan-400/50 text-cyan-300'
                      }`}
                    >
                      {log.isAnomalyDetected || log.actorRole === 'auto_detector'
                        ? '🚨 DETEKSI OTOMATIS'
                        : log.actorRole === 'admin'
                        ? '👑 ADMIN'
                        : '👤 NASABAH'}
                    </span>

                    <span className="font-black text-white text-xs sm:text-sm">
                      {log.accountName}
                    </span>

                    {log.accountNumber && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300">
                        {formatAccountNumberDisplay(log.accountNumber)}
                      </span>
                    )}

                    {log.cardTier && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-900 text-amber-300 font-mono text-[10px] uppercase font-bold">
                        {log.cardTier}
                      </span>
                    )}

                    {log.spinCountType && (
                      <span className="px-2 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 font-mono text-[10px] font-black">
                        🎡 Spin {log.spinCountType}x
                        {log.spin10xStreakCount !== undefined
                          ? ` (${log.spin10xStreakCount}/${liveActivityDetectorConfig.spin10xThresholdCount})`
                          : ''}
                      </span>
                    )}
                  </div>

                  <div className="font-bold text-white text-xs">{log.actionTitle}</div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{log.description}</p>
                  {log.prizesSummary && (
                    <p className="text-[11px] font-mono text-emerald-300 font-bold">
                      🎁 Hadiah: {log.prizesSummary}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-400">
                    Klik untuk Pantau Akun →
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {inspectedAccount && (
        <AccountActivityInspectionModal
          account={inspectedAccount}
          logs={inspectedAccountLogs}
          onClose={() => setInspectAccountId(null)}
          onActionToast={showToast}
        />
      )}
    </div>
  );
};
