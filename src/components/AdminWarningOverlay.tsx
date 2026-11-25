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
import { AdminSystemWarning, AdminWarningIconKey } from '../types/bank';
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

  // Hanya Kartu Tier ADMIN dan Akun OA Admin resmi yang memiliki tanda silang (X) penutup
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
      // Kartu Tier ADMIN selalu bisa menutup pemberitahuan (termasuk Permanen) di layarnya sendiri hingga dikirim ulang
      if (isAdminTierHolder && dismissedVer !== undefined && dismissedVer >= currentVer) {
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

  if (matchingWarnings.length === 0) return null;

  return (
    <div className="sticky top-0 z-[120] w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl px-3 sm:px-6 py-2 space-y-1.5">
      {matchingWarnings.map((warning) => {
        const theme = getAdminWarningThemeMeta(warning.colorTheme);
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
                    Pemberitahuan Sistem
                  </span>
                  <span className="opacity-50 text-xs">•</span>
                  <p className="text-xs sm:text-sm font-black leading-snug">
                    {warning.title}
                  </p>
                  {warning.isPermanent && warning.showPermanentLabel && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${theme.iconBgClass}`}>
                      Permanen
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-95 mt-0.5 leading-relaxed whitespace-pre-line">
                  {warning.message}
                </p>
              </div>
            </div>

            {/* Tanda Silang (X) HANYA muncul di Kartu Tier ADMIN & Akun OA Admin (termasuk saat status Permanen) */}
            {isAdminTierHolder && (
              <button
                type="button"
                onClick={() => dismissAdminWarning(warning.id, warning.resendVersion)}
                title="Tutup Pemberitahuan Sistem di layar Admin (nasabah lain tetap tampil)"
                className="p-1.5 rounded-lg bg-black/20 hover:bg-black/40 border border-white/20 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
                aria-label="Tutup Pemberitahuan Sistem"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

