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

  const matchingWarnings = useMemo(() => {
    if (!currentAccount) return [];
    return adminWarnings.filter((w) => {
      if (!w.isActive) return false;
      const dismissedVer = dismissedWarningMap[w.id];
      const currentVer = w.resendVersion || 1;
      if (w.dismissible && dismissedVer !== undefined && dismissedVer >= currentVer) {
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
  }, [adminWarnings, currentAccount, dismissedWarningMap]);

  const activeBanners = matchingWarnings.filter((w) => w.displayMode === 'banner');
  const activePopup: AdminSystemWarning | undefined = matchingWarnings.find(
    (w) => w.displayMode === 'popup'
  );

  if (activeBanners.length === 0 && !activePopup) return null;

  return (
    <>
      {/* Mode Banner Atas */}
      {activeBanners.length > 0 && (
        <div className="w-full z-40 space-y-1.5 px-3 sm:px-6 pt-2">
          {activeBanners.map((warning) => {
            const theme = getAdminWarningThemeMeta(warning.colorTheme);
            return (
              <div
                key={warning.id}
                className={`max-w-7xl mx-auto rounded-xl border ${theme.bannerClass} px-4 py-2.5 flex items-start sm:items-center justify-between gap-3 shadow-sm`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${theme.iconBgClass}`}>
                    {renderAdminWarningIcon(warning.iconKey, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold leading-snug">
                        {warning.title}
                      </p>
                      {warning.isPermanent && warning.showPermanentLabel && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${theme.iconBgClass}`}>
                          Permanen
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-90 mt-0.5 leading-relaxed whitespace-pre-line">
                      {warning.message}
                    </p>
                  </div>
                </div>
                {warning.dismissible && (
                  <button
                    type="button"
                    onClick={() => dismissAdminWarning(warning.id, warning.resendVersion)}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                    aria-label="Tutup Peringatan"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Mode Pop-up Tengah */}
      {activePopup && (() => {
        const theme = getAdminWarningThemeMeta(activePopup.colorTheme);
        return (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-4">
            <div className={`w-full max-w-lg max-h-[92dvh] rounded-2xl bg-white border-2 ${theme.popupBorderClass} shadow-2xl overflow-hidden flex flex-col`}>
              <div className={`px-5 py-4 flex items-center justify-between gap-3 text-white ${theme.swatchClass}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                    {renderAdminWarningIcon(activePopup.iconKey, 'w-5 h-5 text-white')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
                        Pemberitahuan Sistem
                      </span>
                      {activePopup.isPermanent && activePopup.showPermanentLabel && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/20 text-white">
                          Peringatan Permanen
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-bold leading-snug mt-0.5">
                      {activePopup.title}
                    </h3>
                  </div>
                </div>
                {activePopup.dismissible && (
                  <button
                    type="button"
                    onClick={() =>
                      dismissAdminWarning(activePopup.id, activePopup.resendVersion)
                    }
                    className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors shrink-0 cursor-pointer"
                    aria-label="Tutup"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {activePopup.message}
                </p>

                {!activePopup.dismissible && (
                  <div className="rounded-xl bg-slate-100 border border-slate-200 px-3.5 py-2.5 text-xs text-slate-600 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span>
                      Pemberitahuan ini ditetapkan aktif oleh Administrator hingga dicabut.
                    </span>
                  </div>
                )}
              </div>

              {activePopup.dismissible && (
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      dismissAdminWarning(activePopup.id, activePopup.resendVersion)
                    }
                    className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors cursor-pointer ${theme.buttonClass}`}
                  >
                    Saya Mengerti
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
};
