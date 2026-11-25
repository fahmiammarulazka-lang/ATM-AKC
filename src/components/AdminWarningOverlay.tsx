import React, { useMemo } from 'react';
import {
  AlertTriangle,
  Wrench,
  ShieldAlert,
  BellRing,
  Info,
  WifiOff,
  Sparkles,
  Megaphone,
  Lock,
  Bug,
  Gift,
  ServerCrash,
  Clock,
  CheckCircle2,
  Ban,
  Zap,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AdminWarningIconKey } from '../types/bank';
import { getAdminWarningThemeMeta } from '../data/adminWarningPresets';

export function renderAdminWarningIcon(iconKey: AdminWarningIconKey, className = 'w-5 h-5') {
  switch (iconKey) {
    case 'wrench':
      return <Wrench className={className} />;
    case 'shield-alert':
      return <ShieldAlert className={className} />;
    case 'bell-ring':
      return <BellRing className={className} />;
    case 'info':
      return <Info className={className} />;
    case 'wifi-off':
      return <WifiOff className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'megaphone':
      return <Megaphone className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'bug':
      return <Bug className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'server-crash':
      return <ServerCrash className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'check-circle':
      return <CheckCircle2 className={className} />;
    case 'ban':
      return <Ban className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'alert-triangle':
    default:
      return <AlertTriangle className={className} />;
  }
}

export const AdminWarningOverlay: React.FC = () => {
  const {
    adminWarnings,
    currentAccount,
    dismissedWarningMap,
    dismissAdminWarning,
  } = useBank();

  // Pemegang Kartu Tier ADMIN & Akun OA Admin resmi selalu memiliki akses tombol tutup (X & tombol bawah) meski status Permanen
  const isAdminTierHolder = Boolean(
    currentAccount &&
      (currentAccount.cardTier === 'admin' ||
        currentAccount.isOfficialAdminAccount ||
        currentAccount.id === 'acc-admin')
  );

  const matchingWarnings = useMemo(() => {
    if (!currentAccount) return [];
    return adminWarnings.filter((w) => {
      if (!w.isActive) return false;
      const dismissedVer = dismissedWarningMap[w.id];
      const currentVer = w.resendVersion || 1;
      const canDismiss = isAdminTierHolder || Boolean(w.dismissible);
      if (canDismiss && dismissedVer !== undefined && dismissedVer >= currentVer) {
        return false;
      }
      if (w.targetMode === 'all') return true;
      if (w.targetMode === 'tiers') {
        return Array.isArray(w.targetTiers) && w.targetTiers.includes(currentAccount.cardTier);
      }
      if (w.targetMode === 'accounts') {
        return (
          Array.isArray(w.targetAccountIds) && w.targetAccountIds.includes(currentAccount.id)
        );
      }
      return false;
    });
  }, [adminWarnings, currentAccount, dismissedWarningMap, isAdminTierHolder]);

  // Pisahkan berdasarkan mode tampilan: Banner Atas ('banner') dan Pop-up Tengah ('popup')
  const bannerWarnings = useMemo(
    () => matchingWarnings.filter((w) => w.displayMode === 'banner'),
    [matchingWarnings]
  );

  const popupWarnings = useMemo(
    () => matchingWarnings.filter((w) => w.displayMode !== 'banner'),
    [matchingWarnings]
  );

  if (matchingWarnings.length === 0) return null;

  return (
    <>
      {/* 1. MODE BANNER ATAS: Tampil menempel (sticky) di bagian paling atas layar */}
      {bannerWarnings.length > 0 && (
        <div className="sticky top-0 z-[120] w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl px-3 sm:px-6 py-2 space-y-1.5">
          {bannerWarnings.map((warning) => {
            const theme = getAdminWarningThemeMeta(warning.colorTheme);
            const canCloseBanner = isAdminTierHolder || Boolean(warning.dismissible);

            return (
              <div
                key={warning.id}
                className={`max-w-7xl mx-auto rounded-xl border ${theme.bannerClass} px-3.5 py-2.5 flex items-start sm:items-center justify-between gap-3 shadow-md`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${theme.iconBgClass}`}>
                    {renderAdminWarningIcon(warning.iconKey, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
                        Pemberitahuan Sistem • Banner Atas
                      </span>
                      <span className="opacity-50 text-xs">•</span>
                      <p className="text-xs sm:text-sm font-black leading-snug">
                        {warning.title}
                      </p>
                      {warning.isPermanent && warning.showPermanentLabel && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${theme.iconBgClass}`}
                        >
                          Permanen
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-95 mt-0.5 leading-relaxed whitespace-pre-line">
                      {warning.message}
                    </p>
                  </div>
                </div>

                {canCloseBanner && (
                  <button
                    type="button"
                    onClick={() => dismissAdminWarning(warning.id, warning.resendVersion)}
                    title={
                      isAdminTierHolder
                        ? 'Tutup Pemberitahuan Sistem di layar Admin (nasabah lain tetap tampil)'
                        : 'Tutup Pemberitahuan'
                    }
                    className="p-1.5 rounded-lg bg-black/25 hover:bg-black/45 border border-white/25 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                    aria-label="Tutup Pemberitahuan Sistem"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. MODE POP-UP TENGAH: Tampil sebagai Modal Pop-up tepat di tengah layar */}
      {popupWarnings.length > 0 && (
        <div className="fixed inset-0 z-[135] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-lg space-y-4 my-auto">
            {popupWarnings.map((warning) => {
              const theme = getAdminWarningThemeMeta(warning.colorTheme);
              const canClosePopup = isAdminTierHolder || Boolean(warning.dismissible);

              return (
                <div
                  key={warning.id}
                  className={`relative w-full rounded-2xl border-2 ${theme.bannerClass} p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200`}
                >
                  {/* Tanda Silang (X) di Pojok Kanan Atas: Selalu muncul untuk Kartu Tier ADMIN & OA Admin (atau nasabah biasa jika dismissible) */}
                  {canClosePopup && (
                    <button
                      type="button"
                      onClick={() => dismissAdminWarning(warning.id, warning.resendVersion)}
                      title={
                        isAdminTierHolder
                          ? 'Tutup Pop-up di layar Admin sendiri (nasabah lain tetap tampil)'
                          : 'Tutup Pop-up Pemberitahuan'
                      }
                      className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/25 transition-colors cursor-pointer flex items-center justify-center shadow-md"
                      aria-label="Tutup Pop-up Pemberitahuan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  <div className="flex items-start gap-3.5 pr-9">
                    <div className={`p-3 rounded-2xl border shrink-0 shadow-md ${theme.iconBgClass}`}>
                      {renderAdminWarningIcon(warning.iconKey, 'w-6 h-6')}
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
                          Pemberitahuan Sistem Resmi
                        </span>
                        {warning.isPermanent && warning.showPermanentLabel && (
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border uppercase ${theme.iconBgClass}`}
                          >
                            Permanen
                          </span>
                        )}
                        {!warning.dismissible && !isAdminTierHolder && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-black/30 border border-white/20 uppercase">
                            🔒 Terkunci Sistem
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-black leading-snug">
                        {warning.title}
                      </h3>
                    </div>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/15 p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                    {warning.message}
                  </div>

                  {/* Bagian Bawah Pop-up Tengah */}
                  {canClosePopup ? (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => dismissAdminWarning(warning.id, warning.resendVersion)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-black/35 hover:bg-black/55 border border-white/30 font-black text-xs sm:text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        <X className="w-4 h-4" />
                        <span>
                          {isAdminTierHolder && !warning.dismissible
                            ? 'Tutup di Layar Admin (Nasabah Tetap Tampil)'
                            : 'Mengerti & Tutup Pemberitahuan'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-black/30 border border-white/15 px-3.5 py-2.5 text-[11px] font-semibold flex items-center justify-center gap-2 text-center opacity-90">
                      <Lock className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Pemberitahuan sistem ini bersifat wajib dan akan ditutup otomatis setelah pemeliharaan/tindakan Admin selesai.
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
