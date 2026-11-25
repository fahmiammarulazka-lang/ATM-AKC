import React, { useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  Wrench,
  ShieldAlert,
  ShieldCheck,
  BellRing,
  Info,
  WifiOff,
  Radio,
  Sparkles,
  Rocket,
  Megaphone,
  Lock,
  Unlock,
  Bug,
  Gift,
  Crown,
  Gem,
  Flame,
  Award,
  CreditCard,
  Receipt,
  Scale,
  HeartHandshake,
  ServerCrash,
  Clock,
  Calendar,
  CheckCircle2,
  Ban,
  Zap,
  Hash,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AdminSystemWarning,
  AdminWarningAnimationStyle,
  AdminWarningBgPattern,
  AdminWarningColorTheme,
  AdminWarningIconKey,
  AdminWarningVisualStyle,
} from '../types/bank';
import {
  getAdminWarningAnimationClass,
  getAdminWarningPatternStyle,
  getAdminWarningThemeMeta,
} from '../data/adminWarningPresets';

export interface AdminWarningVisualModel {
  id?: string;
  title: string;
  message: string;
  iconKey: AdminWarningIconKey;
  colorTheme: AdminWarningColorTheme;
  isPermanent?: boolean;
  showPermanentLabel?: boolean;
  dismissible?: boolean;
  lockScreen?: boolean;
  visualStyle?: AdminWarningVisualStyle;
  bgPattern?: AdminWarningBgPattern;
  animationStyle?: AdminWarningAnimationStyle;
  badgeText?: string;
  estimatedDurationText?: string;
  referenceCode?: string;
  ctaLabel?: string;
  showOfficialStamp?: boolean;
}

export function resolveWarningLockScreen(
  warning: Pick<AdminWarningVisualModel, 'lockScreen' | 'dismissible'>
): boolean {
  if (typeof warning.lockScreen === 'boolean') return warning.lockScreen;
  return warning.dismissible === false;
}

export function renderAdminWarningIcon(iconKey: AdminWarningIconKey, className = 'w-5 h-5') {
  switch (iconKey) {
    case 'wrench':
      return <Wrench className={className} />;
    case 'shield-alert':
      return <ShieldAlert className={className} />;
    case 'shield-check':
      return <ShieldCheck className={className} />;
    case 'bell-ring':
      return <BellRing className={className} />;
    case 'info':
      return <Info className={className} />;
    case 'wifi-off':
      return <WifiOff className={className} />;
    case 'radio':
      return <Radio className={className} />;
    case 'sparkles':
      return <Sparkles className={className} />;
    case 'rocket':
      return <Rocket className={className} />;
    case 'megaphone':
      return <Megaphone className={className} />;
    case 'lock':
      return <Lock className={className} />;
    case 'bug':
      return <Bug className={className} />;
    case 'gift':
      return <Gift className={className} />;
    case 'crown':
      return <Crown className={className} />;
    case 'gem':
      return <Gem className={className} />;
    case 'flame':
      return <Flame className={className} />;
    case 'award':
      return <Award className={className} />;
    case 'credit-card':
      return <CreditCard className={className} />;
    case 'receipt':
      return <Receipt className={className} />;
    case 'scale':
      return <Scale className={className} />;
    case 'heart-handshake':
      return <HeartHandshake className={className} />;
    case 'server-crash':
      return <ServerCrash className={className} />;
    case 'clock':
      return <Clock className={className} />;
    case 'calendar':
      return <Calendar className={className} />;
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

interface VisualStyleFrameConfig {
  outerClass: string;
  topStripHeight: string;
  headerBoxClass: string;
  iconWrapperClass: string;
  bodyBoxClass: string;
  cornerTag?: string;
}

function getVisualStyleFrame(style?: AdminWarningVisualStyle): VisualStyleFrameConfig {
  switch (style) {
    case 'royal_gold':
      return {
        outerClass: 'rounded-2xl border-2 ring-1 ring-inset ring-yellow-300/35',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-yellow-400/25',
        iconWrapperClass: 'p-3 rounded-2xl border shadow-lg ring-2 ring-yellow-300/20',
        bodyBoxClass: 'rounded-xl bg-black/30 border border-yellow-400/25 p-4',
        cornerTag: 'ROYAL VIP',
      };
    case 'cyber_terminal':
      return {
        outerClass: 'rounded-xl border-2 ring-1 ring-inset ring-cyan-400/20',
        topStripHeight: 'h-1',
        headerBoxClass: 'px-5 pt-4 pb-3.5 border-b border-white/15',
        iconWrapperClass: 'p-2.5 rounded-xl border shadow-md',
        bodyBoxClass: 'rounded-lg bg-slate-950/75 border border-white/15 p-3.5 font-mono text-[12px]',
        cornerTag: 'SYS // OPS',
      };
    case 'emergency_siren':
      return {
        outerClass: 'rounded-2xl border-2 ring-2 ring-red-500/30',
        topStripHeight: 'h-2',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-red-400/35',
        iconWrapperClass: 'p-3 rounded-xl border-2 shadow-lg',
        bodyBoxClass: 'rounded-xl bg-red-950/45 border border-red-400/35 p-4',
        cornerTag: 'PRIORITAS DARURAT',
      };
    case 'vault_shield':
      return {
        outerClass: 'rounded-2xl border-2 ring-1 ring-inset ring-white/15',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-white/15',
        iconWrapperClass: 'p-3 rounded-2xl border-2 shadow-lg',
        bodyBoxClass: 'rounded-xl bg-slate-950/60 border border-white/15 p-4',
        cornerTag: 'PERISAI KEAMANAN',
      };
    case 'festive_celebration':
      return {
        outerClass: 'rounded-3xl border-2 ring-1 ring-inset ring-white/25',
        topStripHeight: 'h-2',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-white/15',
        iconWrapperClass: 'p-3 rounded-2xl border shadow-lg',
        bodyBoxClass: 'rounded-2xl bg-black/25 border border-white/20 p-4',
        cornerTag: 'PERAYAAN RESMI',
      };
    case 'neon_pulse':
      return {
        outerClass: 'rounded-2xl border-2 ring-1 ring-white/20',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-white/15',
        iconWrapperClass: 'p-3 rounded-2xl border shadow-[0_0_24px_rgba(255,255,255,0.14)]',
        bodyBoxClass: 'rounded-xl bg-slate-950/55 border border-white/15 p-4',
      };
    case 'split_banner':
      return {
        outerClass: 'rounded-2xl border-2',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-white/20',
        iconWrapperClass: 'p-3 rounded-xl border shadow-md',
        bodyBoxClass: 'rounded-xl bg-black/25 border border-white/12 p-4',
      };
    case 'hologram_vip':
      return {
        outerClass: 'rounded-3xl border-2 ring-1 ring-inset ring-fuchsia-300/30',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-violet-300/25',
        iconWrapperClass: 'p-3 rounded-2xl border shadow-lg ring-1 ring-cyan-300/30',
        bodyBoxClass: 'rounded-2xl bg-black/30 border border-violet-300/25 p-4',
        cornerTag: 'HOLOGRAM VIP',
      };
    case 'radar_network':
      return {
        outerClass: 'rounded-2xl border-2',
        topStripHeight: 'h-1',
        headerBoxClass: 'px-5 pt-4 pb-3.5 border-b border-cyan-400/25',
        iconWrapperClass: 'p-2.5 rounded-xl border shadow-md',
        bodyBoxClass: 'rounded-xl bg-slate-950/65 border border-cyan-400/20 p-3.5',
        cornerTag: 'TELEMETRI JARINGAN',
      };
    case 'official_decree':
      return {
        outerClass: 'rounded-2xl border-2 ring-1 ring-inset ring-white/15',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-white/15',
        iconWrapperClass: 'p-3 rounded-xl border shadow-md',
        bodyBoxClass: 'rounded-xl bg-black/25 border border-white/15 p-4',
        cornerTag: 'MAKLUMAT RESMI',
      };
    case 'individual_formal':
      return {
        outerClass: 'rounded-2xl border-2',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-4 pb-3.5 border-b border-white/15',
        iconWrapperClass: 'p-2.5 rounded-xl border shadow-md',
        bodyBoxClass: 'rounded-xl bg-slate-950/60 border border-white/15 p-4',
        cornerTag: 'PEMBERITAHUAN AKUN',
      };
    case 'executive_glass':
    default:
      return {
        outerClass: 'rounded-2xl border-2 ring-1 ring-inset ring-white/12',
        topStripHeight: 'h-1.5',
        headerBoxClass: 'px-5 pt-5 pb-4 border-b border-white/12',
        iconWrapperClass: 'p-3 rounded-2xl border shadow-md',
        bodyBoxClass: 'rounded-xl bg-black/25 border border-white/12 p-4',
      };
  }
}

export interface AdminWarningPopupCardProps {
  warning: AdminWarningVisualModel;
  canClose: boolean;
  isAdminTierHolder?: boolean;
  isLocked?: boolean;
  onClose?: () => void;
  isPreviewMode?: boolean;
}

export const AdminWarningPopupCard: React.FC<AdminWarningPopupCardProps> = ({
  warning,
  canClose,
  isAdminTierHolder = false,
  isLocked,
  onClose,
  isPreviewMode = false,
}) => {
  const theme = getAdminWarningThemeMeta(warning.colorTheme);
  const frame = getVisualStyleFrame(warning.visualStyle);
  const animClass = getAdminWarningAnimationClass(warning.animationStyle);
  const patternStyle = getAdminWarningPatternStyle(warning.bgPattern, theme.patternTint);
  const effectiveLocked =
    typeof isLocked === 'boolean' ? isLocked : resolveWarningLockScreen(warning);

  const hasDetailMeta = Boolean(
    (warning.estimatedDurationText && warning.estimatedDurationText.trim()) ||
      (warning.referenceCode && warning.referenceCode.trim())
  );

  const resolvedBadge =
    warning.badgeText?.trim() || frame.cornerTag || 'Pemberitahuan Sistem Resmi';
  const resolvedCta =
    isAdminTierHolder && !warning.dismissible && !isPreviewMode
      ? 'Tutup di Layar Admin (Nasabah Tetap Tampil)'
      : warning.ctaLabel?.trim() || 'Mengerti & Tutup';

  return (
    <div
      className={`relative w-full overflow-hidden ${frame.outerClass} ${theme.cardSurfaceClass} ${theme.popupBorderClass} ${theme.glowShadowClass} ${animClass}`}
    >
      {/* Pola Latar Halus Khas Template */}
      {warning.bgPattern && warning.bgPattern !== 'none' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-85"
          style={patternStyle}
        />
      )}

      {/* Garis Aksen Neon / Gradasi Atas */}
      <div className={`relative z-10 w-full ${frame.topStripHeight} ${theme.accentLineClass}`} />

      {/* Header Gradasi Khas + Ikon Bercahaya + Badge Status */}
      <div className={`relative z-10 ${frame.headerBoxClass} ${theme.headerGradientClass}`}>
        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            title={
              isAdminTierHolder && !isPreviewMode
                ? 'Tutup Pop-up di layar Admin (nasabah lain tetap tampil)'
                : 'Tutup Pop-up Pemberitahuan'
            }
            className="absolute top-3.5 right-3.5 p-2 rounded-xl bg-black/35 hover:bg-black/55 border border-white/20 text-white transition-colors cursor-pointer flex items-center justify-center shadow-md"
            aria-label="Tutup Pop-up Pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className={`flex items-start gap-3.5 ${canClose && onClose ? 'pr-10' : ''}`}>
          <div className={`shrink-0 ${frame.iconWrapperClass} ${theme.iconBgClass}`}>
            {renderAdminWarningIcon(warning.iconKey, 'w-6 h-6')}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${theme.badgeClass}`}
              >
                {resolvedBadge}
              </span>

              {warning.isPermanent && warning.showPermanentLabel && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-white/25 bg-black/30 text-[10px] font-bold uppercase tracking-wide text-white/95 whitespace-nowrap">
                  Permanen
                </span>
              )}

              {effectiveLocked ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-rose-400/40 bg-rose-950/60 text-[10px] font-bold uppercase text-rose-200 whitespace-nowrap">
                  <Lock className="w-3 h-3" />
                  Kunci Layar
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-emerald-400/35 bg-emerald-950/50 text-[10px] font-bold uppercase text-emerald-200 whitespace-nowrap">
                  <Unlock className="w-3 h-3" />
                  Bisa Klik Belakang
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-black leading-snug tracking-tight text-white">
              {warning.title || 'Judul Pemberitahuan Sistem'}
            </h3>
          </div>
        </div>
      </div>

      {/* Isi Pesan, Kotak Detail Meta, Stempel Resmi, & Tombol Aksi */}
      <div className="relative z-10 p-5 space-y-4">
        <div
          className={`${frame.bodyBoxClass} text-xs sm:text-sm leading-relaxed text-slate-100 whitespace-pre-line`}
        >
          {warning.message || 'Isi pesan pemberitahuan akan tampil di sini secara real-time.'}
        </div>

        {/* Kotak Detail Tambahan: Estimasi Waktu & Kode Referensi */}
        {hasDetailMeta && (
          <div
            className={`grid gap-2.5 ${
              warning.estimatedDurationText?.trim() && warning.referenceCode?.trim()
                ? 'grid-cols-1 sm:grid-cols-2'
                : 'grid-cols-1'
            }`}
          >
            {warning.estimatedDurationText?.trim() && (
              <div
                className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 ${theme.detailBoxClass}`}
              >
                <Clock className={`w-4 h-4 shrink-0 ${theme.accentTextClass}`} />
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-300/80 font-bold">
                    Estimasi / Jadwal
                  </span>
                  <span className="block text-xs font-extrabold text-white tabular-nums truncate">
                    {warning.estimatedDurationText.trim()}
                  </span>
                </div>
              </div>
            )}

            {warning.referenceCode?.trim() && (
              <div
                className={`rounded-xl border px-3 py-2.5 flex items-center gap-2.5 ${theme.detailBoxClass}`}
              >
                <Hash className={`w-4 h-4 shrink-0 ${theme.accentTextClass}`} />
                <div className="min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider text-slate-300/80 font-bold">
                    Nomor Referensi
                  </span>
                  <span className="block text-xs font-extrabold font-mono text-white tabular-nums truncate">
                    {warning.referenceCode.trim()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer: Stempel Resmi Bank Nusantara & Tombol Aksi / Status Wajib */}
        <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {warning.showOfficialStamp ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-white/25 bg-black/25 self-start">
              <ShieldCheck className={`w-4 h-4 shrink-0 ${theme.accentTextClass}`} />
              <div className="leading-tight">
                <span className="block text-[10px] font-black uppercase tracking-widest text-white">
                  BANK NUSANTARA • RESMI
                </span>
                <span className="block text-[9px] font-semibold text-slate-300/85">
                  Terverifikasi Pusat Kendali Sistem
                </span>
              </div>
            </div>
          ) : (
            <div />
          )}

          {canClose ? (
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg whitespace-nowrap shrink-0 ${theme.buttonClass}`}
            >
              <span>{resolvedCta}</span>
            </button>
          ) : (
            <div className="w-full sm:w-auto rounded-xl bg-black/35 border border-white/15 px-3.5 py-2 text-[11px] font-semibold text-slate-200 flex items-center justify-center gap-2 text-center">
              <Lock className={`w-3.5 h-3.5 shrink-0 ${theme.accentTextClass}`} />
              <span>
                {effectiveLocked
                  ? 'Wajib sistem — layar terkunci sampai tindakan Admin selesai.'
                  : 'Pemberitahuan sistem aktif — Anda tetap bisa beraktivitas di belakang.'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export interface AdminWarningBannerBarProps {
  warning: AdminWarningVisualModel;
  canClose: boolean;
  isAdminTierHolder?: boolean;
  onClose?: () => void;
  isPreviewMode?: boolean;
}

export const AdminWarningBannerBar: React.FC<AdminWarningBannerBarProps> = ({
  warning,
  canClose,
  isAdminTierHolder = false,
  onClose,
  isPreviewMode = false,
}) => {
  const theme = getAdminWarningThemeMeta(warning.colorTheme);
  const patternStyle = getAdminWarningPatternStyle(warning.bgPattern, theme.patternTint);
  const resolvedBadge = warning.badgeText?.trim() || 'Banner Atas Resmi';

  return (
    <div
      className={`relative overflow-hidden max-w-7xl mx-auto rounded-xl border ${theme.bannerClass} shadow-lg`}
    >
      {warning.bgPattern && warning.bgPattern !== 'none' && (
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none opacity-70"
          style={patternStyle}
        />
      )}
      <div className={`relative z-10 h-1 w-full ${theme.accentLineClass}`} />

      <div className="relative z-10 px-3.5 py-2.5 flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className={`p-2 rounded-xl border shrink-0 shadow-sm ${theme.iconBgClass}`}>
            {renderAdminWarningIcon(warning.iconKey, 'w-4 h-4')}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded border text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${theme.badgeClass}`}
              >
                {resolvedBadge}
              </span>
              <p className="text-xs sm:text-sm font-black leading-snug text-white">
                {warning.title || 'Judul Banner Pemberitahuan'}
              </p>
              {warning.isPermanent && warning.showPermanentLabel && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/25 bg-black/30 uppercase whitespace-nowrap">
                  Permanen
                </span>
              )}
              {warning.estimatedDurationText?.trim() && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/15 tabular-nums whitespace-nowrap">
                  <Clock className="w-3 h-3" />
                  {warning.estimatedDurationText.trim()}
                </span>
              )}
              {warning.referenceCode?.trim() && (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 border border-white/15 tabular-nums whitespace-nowrap">
                  #{warning.referenceCode.trim()}
                </span>
              )}
              {warning.showOfficialStamp && (
                <span className="hidden md:inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border border-dashed border-white/25 bg-black/25 whitespace-nowrap">
                  <ShieldCheck className="w-3 h-3" />
                  BANK NUSANTARA • RESMI
                </span>
              )}
            </div>

            <p className="text-xs text-slate-100/95 mt-0.5 leading-relaxed whitespace-pre-line">
              {warning.message || 'Isi banner pemberitahuan akan tampil di sini.'}
            </p>
          </div>
        </div>

        {canClose && onClose && (
          <button
            type="button"
            onClick={onClose}
            title={
              isAdminTierHolder && !isPreviewMode
                ? 'Tutup Banner di layar Admin (nasabah lain tetap tampil)'
                : 'Tutup Pemberitahuan'
            }
            className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 border border-white/20 text-white transition-colors shrink-0 cursor-pointer flex items-center justify-center"
            aria-label="Tutup Pemberitahuan Sistem"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

interface AdminWarningOverlayProps {
  /** True saat pengguna berada di dalam Panel Admin — Pop-up Tengah otomatis tidak menghalangi layar Panel Admin */
  isInsideAdminPanel?: boolean;
}

export const AdminWarningOverlay: React.FC<AdminWarningOverlayProps> = ({
  isInsideAdminPanel = false,
}) => {
  const {
    adminWarnings,
    currentAccount,
    dismissedWarningMap,
    dismissAdminWarning,
  } = useBank();

  // Pemegang Kartu Tier ADMIN & Akun OA Admin resmi selalu memiliki akses tombol tutup
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

  const bannerWarnings = useMemo(
    () => matchingWarnings.filter((w) => w.displayMode === 'banner'),
    [matchingWarnings]
  );

  // Di dalam Panel Admin, Pop-up Tengah TIDAK pernah menghalangi layar Admin (tampil di layar nasabah saja)
  const popupWarnings = useMemo(
    () => (isInsideAdminPanel ? [] : matchingWarnings.filter((w) => w.displayMode !== 'banner')),
    [matchingWarnings, isInsideAdminPanel]
  );

  // Pisahkan Pop-up Tengah Kunci Total Layar vs Pop-up Mengambang (Tetap Bisa Klik Belakang)
  const lockedPopups = useMemo(
    () => popupWarnings.filter((w) => resolveWarningLockScreen(w)),
    [popupWarnings]
  );

  const floatingPopups = useMemo(
    () => popupWarnings.filter((w) => !resolveWarningLockScreen(w)),
    [popupWarnings]
  );

  const shouldHardLockScreen = lockedPopups.length > 0;
  const shouldBlockEscKey = shouldHardLockScreen && !isAdminTierHolder;

  // Kunci scroll halaman (body) saat ada Pop-up Tengah berstatus Kunci Total Layar
  useEffect(() => {
    if (!shouldHardLockScreen || typeof document === 'undefined') return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [shouldHardLockScreen]);

  // Kunci tombol ESC keyboard untuk nasabah biasa saat Pop-up Tengah Kunci Total Layar aktif
  useEffect(() => {
    if (!shouldBlockEscKey || typeof window === 'undefined') return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [shouldBlockEscKey]);

  if (bannerWarnings.length === 0 && popupWarnings.length === 0) return null;

  const renderPopupItem = (warning: AdminSystemWarning, isLocked: boolean) => {
    const canClosePopup = isAdminTierHolder || Boolean(warning.dismissible);
    return (
      <AdminWarningPopupCard
        key={warning.id}
        warning={warning}
        canClose={canClosePopup}
        isAdminTierHolder={isAdminTierHolder}
        isLocked={isLocked}
        onClose={
          canClosePopup
            ? () => dismissAdminWarning(warning.id, warning.resendVersion)
            : undefined
        }
      />
    );
  };

  return (
    <>
      {/* 1. MODE BANNER ATAS: Sticky non-blocking di bagian paling atas layar */}
      {bannerWarnings.length > 0 && (
        <div className="sticky top-0 z-[120] w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-xl px-3 sm:px-6 py-2 space-y-1.5">
          {bannerWarnings.map((warning) => {
            const canCloseBanner = isAdminTierHolder || Boolean(warning.dismissible);
            return (
              <AdminWarningBannerBar
                key={warning.id}
                warning={warning}
                canClose={canCloseBanner}
                isAdminTierHolder={isAdminTierHolder}
                onClose={
                  canCloseBanner
                    ? () => dismissAdminWarning(warning.id, warning.resendVersion)
                    : undefined
                }
              />
            );
          })}
        </div>
      )}

      {/* 2A. MODE POP-UP TENGAH (KUNCI TOTAL LAYAR): Blokir klik belakang, gulir halaman, & tombol ESC */}
      {lockedPopups.length > 0 && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[135] bg-slate-950/82 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-lg space-y-4 my-auto">
            {lockedPopups.map((warning) => renderPopupItem(warning, true))}
            {floatingPopups.map((warning) => renderPopupItem(warning, false))}
          </div>
        </div>
      )}

      {/* 2B. MODE POP-UP TENGAH (TETAP BISA KLIK BELAKANG): Modal mengambang non-blocking */}
      {lockedPopups.length === 0 && floatingPopups.length > 0 && (
        <div
          role="dialog"
          aria-modal="false"
          className="fixed inset-0 z-[135] pointer-events-none flex items-center justify-center p-4"
        >
          <div className="pointer-events-auto w-full max-w-lg max-h-[86vh] overflow-y-auto space-y-4">
            {floatingPopups.map((warning) => renderPopupItem(warning, false))}
          </div>
        </div>
      )}
    </>
  );
};
