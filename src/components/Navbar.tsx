/**
 * Bank Nusantara Navigation Bar with Active Account Switcher (Uses Old Card PIN + Lupa PIN support),
 * Centang Biru Verification Badge, and Notification Center
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  CreditCard,
  Building,
  Monitor,
  BookOpen,
  Bell,
  PlusCircle,
  ChevronDown,
  ChevronLeft,
  MessageSquare,
  KeyRound,
  LogOut,
  History,
  Briefcase,
  Sparkles,
  Crown,
  Cpu,
  Send,
  PieChart,
  Banknote,
  Coins,
  Zap,
  Lock,
  Cloud,
  Check,
  ChevronRight,
  ArrowLeft,
  ReceiptText,
  Ticket,
  Plus,
  Users,
  Target,
  Trophy,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { DiamondIcon, DiamondText } from './DiamondIcon';
import { UserProfileStatsModal } from './UserProfileStatsModal';
import { VerifiedBadge, UserId16AboveNameBanner, OaAccountBadge } from './VerifiedBadge';
import {
  formatRupiah,
  formatCompactRupiah,
  formatMobileCompactRupiah,
  formatAssetCount,
  formatCompactAssetCount,
  formatAccountNumberDisplay,
  isAdminCardAccount,
  isUnlimitedNumber,
} from '../utils/bankUtils';
import { computeMonthlyBudgetReport, getCurrentMonthKey } from '../utils/budgetUtils';
import { useSecretAdminSequence } from '../utils/useSecretAdminSequence';
import { DevRoleConfig, NotificationCategory10Key } from '../types/bank';
import { getDevBadgeColorStyle } from '../data/devRolesCatalog';
import {
  NOTIFICATION_CATEGORIES_10,
  normalizeNotificationCategory,
  getNotificationCategoryMeta,
} from '../data/notificationCategories';
import { RefreshCw } from 'lucide-react';

export type AppNavView =
  | 'dashboard'
  | 'missions'
  | 'leaderboard'
  | 'family'
  | 'debt'
  | 'transfer'
  | 'emas'
  | 'anggaran'
  | 'redeem'
  | 'jobs'
  | 'spin_wheel'
  | 'atm'
  | 'admin'
  | 'guide'
  | 'chat'
  | 'updates';

interface NavbarProps {
  activeView: AppNavView;
  setActiveView: (view: AppNavView) => void;
  onOpenRegisterModal: () => void;
  onSecretAdminTrigger: () => void;
  onQuickAdminAccess?: (role: DevRoleConfig) => void;
  onOpenSecurityCenter?: (section?: 'identity' | 'telemetry' | 'timemachine' | 'audit') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenRegisterModal,
  onSecretAdminTrigger,
  onQuickAdminAccess,
  onOpenSecurityCenter,
}) => {
  const {
    currentAccount,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    notificationCategoryPermissions,
    toggleNotificationCategoryPermission,
    setAllNotificationCategoryPermissions,
    markCategoryNotificationsAsRead,
    notificationsEnabled,
    notificationPermissionStatus,
    requestAndEnableNotifications,
    sendTestNotificationNow,
    publicCurrentUpdate,
    activeBuildInfo,
    hasUnreadAppUpdate,
    budgetCategories,
    transactions,
    manualExpenses,
    budgetTxCategoryMap,
    googleUser,
    linkCurrentAccountWithGooglePopup,
    setIsDiamondStoreOpen,
    diamondConfig,
    uiVisibilityConfig,
    syncTelemetry,
    missions,
  } = useBank();

  const activeMissionsCount = React.useMemo(
    () => (missions || []).filter((m) => m.isActive).length,
    [missions]
  );

  const activeDebtAmount = Math.max(0, Math.round(currentAccount?.debtAmount || 0));
  const formatCompactDebt = (val: number): string => {
    if (val >= 1_000_000_000_000) return `${(val / 1_000_000_000_000).toFixed(1).replace('.0', '')}T`;
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1).replace('.0', '')}M`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1).replace('.0', '')}jt`;
    if (val >= 1_000) return `${Math.round(val / 1_000)}rb`;
    return `${val}`;
  };

  const [isLinkingGoogle, setIsLinkingGoogle] = useState(false);
  const [googleLinkFeedback, setGoogleLinkFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const rawAccountEmail = (currentAccount?.email || '').trim().toLowerCase();
  const isCurrentAccountUnlinkedToGoogle = Boolean(
    currentAccount &&
      (currentAccount.isGuestAccount ||
        googleUser?.authMode === 'guest' ||
        !rawAccountEmail ||
        rawAccountEmail.endsWith('@nusantara.id') ||
        rawAccountEmail.endsWith('@banknusantara.id') ||
        rawAccountEmail.startsWith('oa.'))
  );

  const handleLinkCurrentAccountToGoogle = async () => {
    if (isLinkingGoogle) return;
    setIsLinkingGoogle(true);
    setGoogleLinkFeedback(null);
    try {
      const res = await linkCurrentAccountWithGooglePopup();
      if (res.success) {
        setGoogleLinkFeedback({ type: 'success', text: res.message });
      } else if (res.errorCode !== 'auth/popup-closed-by-user') {
        setGoogleLinkFeedback({ type: 'error', text: res.message });
      }
    } finally {
      setIsLinkingGoogle(false);
      setTimeout(() => {
        setGoogleLinkFeedback(null);
      }, 6000);
    }
  };

  const currentUpdateVersion =
    publicCurrentUpdate?.version || activeBuildInfo.catalogVersion || 'v14.35.43';

  const budgetAlertReport = currentAccount
    ? computeMonthlyBudgetReport({
        accountId: currentAccount.id,
        monthKey: getCurrentMonthKey(),
        categories: budgetCategories,
        transactions,
        manualExpenses,
        txCategoryMap: budgetTxCategoryMap,
      })
    : null;
  const budgetAlertCount = budgetAlertReport
    ? budgetAlertReport.warningCount + budgetAlertReport.exceededCount
    : 0;

  const [showProfileStatsModal, setShowProfileStatsModal] = useState<boolean>(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [selectedNotifCategory, setSelectedNotifCategory] = useState<NotificationCategory10Key | null>(null);

  const { handleBankClick, handleNusantaraClick } = useSecretAdminSequence(onSecretAdminTrigger);

  const notificationsByCategory = React.useMemo(() => {
    const map: Record<NotificationCategory10Key, typeof notifications> = {
      transaksi: [],
      transfer: [],
      keamanan: [],
      pinjaman: [],
      kartu: [],
      emas: [],
      kerja: [],
      spin: [],
      hadiah: [],
      sistem: [],
    };
    for (const item of notifications) {
      const key = normalizeNotificationCategory(
        item.category,
        item.title,
        item.message,
        item.targetView
      );
      map[key].push(item);
    }
    return map;
  }, [notifications]);

  const enabledCategoryCount = NOTIFICATION_CATEGORIES_10.filter(
    (cat) => notificationCategoryPermissions[cat.key] !== false
  ).length;
  const selectedCategoryMeta = selectedNotifCategory
    ? getNotificationCategoryMeta(selectedNotifCategory)
    : null;
  const selectedCategoryItems = selectedNotifCategory
    ? notificationsByCategory[selectedNotifCategory] || []
    : [];

  const handleNotificationItemClick = (n: typeof notifications[number]) => {
    markNotificationAsRead(n.id);
    setShowNotifDropdown(false);
    window.dispatchEvent(
      new CustomEvent('bn:navigate', {
        detail: {
          targetView: n.targetView || 'dashboard',
          targetDashboardTab: n.targetDashboardTab || 'mutasi',
        },
      })
    );
  };

  const navScrollRef = useRef<HTMLElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateNavScrollArrows = useCallback(() => {
    const el = navScrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll - el.scrollLeft > 4);
  }, []);

  useEffect(() => {
    const el = navScrollRef.current;
    if (!el) return;
    updateNavScrollArrows();
    const onScroll = () => updateNavScrollArrows();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateNavScrollArrows);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateNavScrollArrows());
      observer.observe(el);
    }

    return () => {
      el.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateNavScrollArrows);
      if (observer) observer.disconnect();
    };
  }, [updateNavScrollArrows, budgetAlertCount, currentAccount?.jobLevel, currentAccount?.spinCoins, currentUpdateVersion]);

  const scrollNavBy = (delta: number) => {
    const el = navScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  };

  const handleSelectNavView = (view: AppNavView, e?: React.MouseEvent<HTMLButtonElement>) => {
    setActiveView(view);
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ inline: 'nearest', block: 'nearest', behavior: 'smooth' });
    }
  };

  return (
    <>
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md shadow-md">
      {/* BARIS 1: Tab Kotak Hutang + Identitas Bank Nusantara + Live Sync HUD + Saldo & Koin + Notifikasi + Profil */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 h-14 flex items-center justify-between gap-1.5 sm:gap-3">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* TAB KOTAK HUTANG — Tepat di sebelah kiri logo Bank Nusantara */}
          {uiVisibilityConfig.navTabs.debt !== false && (
            <button
              type="button"
              onClick={() => setActiveView('debt')}
              title={
                activeDebtAmount > 0
                  ? `Tab Hutang Aktif: ${formatRupiah(activeDebtAmount)} — Klik untuk bayar & lihat tenggat`
                  : 'Tab Kotak Hutang — Tidak ada hutang aktif'
              }
              aria-label="Tab Hutang"
              className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer shrink-0 ${
                activeDebtAmount > 0
                  ? activeView === 'debt'
                    ? 'bg-rose-600 border-rose-300 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400/60'
                    : 'bg-rose-950/90 hover:bg-rose-900 border-rose-500/80 text-rose-200 shadow-md shadow-rose-950/60'
                  : activeView === 'debt'
                  ? 'bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
            >
              <ReceiptText className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeDebtAmount > 0 ? 'text-rose-200' : ''}`} />
              <span className="text-[7px] sm:text-[8px] font-black uppercase leading-none mt-0.5 tracking-tight">
                HUTANG
              </span>
              {activeDebtAmount > 0 && (
                <>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-950 animate-ping" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-950" />
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 py-0.2 rounded bg-rose-600 border border-rose-300/70 text-white font-mono text-[8px] font-black whitespace-nowrap shadow-md animate-pulse leading-tight">
                    -{formatCompactDebt(activeDebtAmount)}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Brand Logo (Stealth 4-stage trigger attached cleanly with zero visual cues) */}
          <div
            onClick={() => setActiveView('dashboard')}
            className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer select-none shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20 shrink-0">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950" />
            </div>
            <div className="shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-extrabold text-white text-[11px] sm:text-base tracking-wider whitespace-nowrap leading-none">
                  <span onClick={handleBankClick}>BANK</span>{' '}
                  <span onClick={handleNusantaraClick}>NUSANTARA</span>
                </span>
                <span className="hidden md:inline-block text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold shrink-0">
                  ID
                </span>
              </div>
              <p className="hidden md:block text-[10px] text-slate-400 -mt-0.5 tracking-tight whitespace-nowrap">
                Sistem Perbankan & ATM Terpadu
              </p>
            </div>
          </div>
        </div>

        {/* Right Action Bar (Adaptif di semua lebar layar agar BANK NUSANTARA & Profil selalu tampil utuh) */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Tombol Cepat "Hubungkan Google" untuk Akun OA & Akun Guest yang Belum Tersambung Email Google */}
          {isCurrentAccountUnlinkedToGoogle && (
            <button
              type="button"
              onClick={handleLinkCurrentAccountToGoogle}
              disabled={isLinkingGoogle}
              className="hidden 2xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-white hover:bg-slate-100 text-slate-900 border border-cyan-400/60 text-[11px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition disabled:opacity-60"
              title="Hubungkan Akun ini ke email Google Anda agar tersinkronisasi permanen di Cloud"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{isLinkingGoogle ? 'Menghubungkan...' : 'Hubungkan Google'}</span>
            </button>
          )}

          {/* Money, Coin & Diamond (+ Top-Up QRIS Nusantara) Indicator Bar */}
          {currentAccount && (
            <>
              <div className="hidden lg:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-slate-900 border border-slate-700/80 whitespace-nowrap shrink-0 font-mono text-[11px] tabular-nums">
                <span
                  className="flex items-center gap-1 text-emerald-300 font-bold pr-1.5 border-r border-slate-700"
                  title={`Saldo Uang Rekening: ${
                    isAdminCardAccount(currentAccount) || isUnlimitedNumber(currentAccount.balance)
                      ? '∞'
                      : formatRupiah(currentAccount.balance)
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>
                    {isAdminCardAccount(currentAccount) || isUnlimitedNumber(currentAccount.balance)
                      ? '∞'
                      : Math.abs(currentAccount.balance) >= 10_000_000
                      ? formatCompactRupiah(currentAccount.balance)
                      : formatRupiah(currentAccount.balance)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView('spin_wheel')}
                  className={`flex items-center gap-1 text-amber-300 font-bold hover:text-amber-200 cursor-pointer ${
                    uiVisibilityConfig.showDiamondBalance !== false ||
                    uiVisibilityConfig.showDiamondTopUpButton !== false
                      ? 'pr-1.5 border-r border-slate-700'
                      : ''
                  }`}
                  title="Total Coin Nusantara (Klik ke Spin the Wheel)"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    {formatAssetCount(currentAccount.spinCoins, {
                      isAdmin: isAdminCardAccount(currentAccount),
                    })}
                  </span>
                </button>
                {(uiVisibilityConfig.showDiamondBalance !== false ||
                  uiVisibilityConfig.showDiamondTopUpButton !== false) && (
                  <div
                    className="flex items-center gap-1 text-cyan-300 font-bold"
                    title="Saldo Permata & Top-Up QRIS Nusantara"
                  >
                    {uiVisibilityConfig.showDiamondBalance !== false && (
                      <>
                        <DiamondIcon tone="bright" className="w-3.5 h-3.5" />
                        <span>
                          {formatAssetCount(currentAccount.diamonds, {
                            isAdmin: isAdminCardAccount(currentAccount),
                          })}
                        </span>
                      </>
                    )}
                    {uiVisibilityConfig.showDiamondTopUpButton !== false && (
                      <button
                        type="button"
                        onClick={() => setIsDiamondStoreOpen(true)}
                        className="relative ml-0.5 flex h-5 w-5 items-center justify-center rounded-md bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition active:scale-90 cursor-pointer"
                        title={
                          diamondConfig.diamondDiscountPercent > 0
                            ? `Top-Up (Diskon ${diamondConfig.diamondDiscountPercent}% via QRIS Nusantara)`
                            : 'Top-Up (250 Paket + Custom via QRIS Nusantara)'
                        }
                        aria-label="Top-Up"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        {diamondConfig.diamondDiscountPercent > 0 && (
                          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500 ring-1 ring-slate-900" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Compact Mobile & Tablet Money + Coin + Diamond (+ Top-Up) Bar */}
              <div className="flex lg:hidden items-center gap-1 h-7 sm:h-8 px-1.5 sm:px-2 rounded-lg bg-slate-900 border border-slate-700/90 font-mono text-[9px] sm:text-[10px] font-bold tabular-nums shrink-0">
                <span
                  className="flex items-center gap-0.5 text-emerald-300 pr-1 border-r border-slate-700/80 whitespace-nowrap"
                  title="Saldo Uang Rekening"
                >
                  <Banknote className="w-3 h-3 text-emerald-400 shrink-0 hidden sm:inline" />
                  <span>
                    {formatMobileCompactRupiah(currentAccount.balance, {
                      isAdmin: isAdminCardAccount(currentAccount),
                    })}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setActiveView('spin_wheel')}
                  className={`flex items-center gap-0.5 text-amber-300 hover:text-amber-200 cursor-pointer whitespace-nowrap ${
                    uiVisibilityConfig.showDiamondBalance !== false ||
                    uiVisibilityConfig.showDiamondTopUpButton !== false
                      ? 'pr-1 border-r border-slate-700/80'
                      : ''
                  }`}
                  title="Coin Nusantara"
                >
                  <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>
                    {formatCompactAssetCount(currentAccount.spinCoins, {
                      isAdmin: isAdminCardAccount(currentAccount),
                    })}
                  </span>
                </button>
                {(uiVisibilityConfig.showDiamondBalance !== false ||
                  uiVisibilityConfig.showDiamondTopUpButton !== false) && (
                  <div className="flex items-center gap-0.5 text-cyan-300 whitespace-nowrap">
                    {uiVisibilityConfig.showDiamondBalance !== false && (
                      <>
                        <DiamondIcon tone="bright" className="w-3 h-3 shrink-0" />
                        <span>
                          {formatCompactAssetCount(currentAccount.diamonds, {
                            isAdmin: isAdminCardAccount(currentAccount),
                          })}
                        </span>
                      </>
                    )}
                    {uiVisibilityConfig.showDiamondTopUpButton !== false && (
                      <button
                        type="button"
                        onClick={() => setIsDiamondStoreOpen(true)}
                        className="ml-0.5 flex h-4 w-4 items-center justify-center rounded bg-cyan-500 text-slate-950 cursor-pointer shrink-0"
                        title="Top-Up via QRIS Nusantara"
                        aria-label="Top-Up"
                      >
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* 🔔 Tombol Notifikasi (10 Jenis dengan Centang Izin & Drill-Down) */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                const nextOpen = !showNotifDropdown;
                setShowNotifDropdown(nextOpen);
                if (nextOpen) {
                  setSelectedNotifCategory(null);
                }
                setShowProfileStatsModal(false);
              }}
              className="relative p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 transition cursor-pointer"
              title="Pusat Notifikasi (10 Jenis)"
              aria-label="Pusat Notifikasi"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black font-mono tabular-nums">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-1rem))] sm:w-[26rem] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2.5">
                {selectedNotifCategory === null ? (
                  <>
                    {/* LEVEL 1 HEADER */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
                      <div className="min-w-0">
                        <span className="font-black text-white flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>Jenis Notifikasi (10)</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tabular-nums block mt-0.5">
                          {enabledCategoryCount}/10 jenis diizinkan · {notifications.length} tersimpan
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => markAllNotificationsAsRead()}
                        className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer shrink-0"
                      >
                        Tandai Dibaca
                      </button>
                    </div>

                    {/* Quick All Enable/Disable + Background Push Bar */}
                    <div className="flex items-center justify-between gap-2 text-[10px] px-0.5">
                      <span className="text-slate-400">Centang izin lalu klik jenis untuk buka isi</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setAllNotificationCategoryPermissions(true)}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                        >
                          Izinkan Semua
                        </button>
                        <span className="text-slate-700">·</span>
                        <button
                          type="button"
                          onClick={() => setAllNotificationCategoryPermissions(false)}
                          className="text-slate-400 hover:text-rose-300 font-semibold cursor-pointer"
                        >
                          Matikan Semua
                        </button>
                      </div>
                    </div>

                    {/* Background Notification Activation Bar */}
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-white block truncate">
                          {notificationsEnabled && notificationPermissionStatus === 'granted'
                            ? 'Notif Latar Belakang Aktif'
                            : 'Aktifkan Notif Latar Belakang'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {notificationPermissionStatus === 'granted'
                            ? 'Service Worker & Push Browser aktif'
                            : 'Izinkan notif saat tab diminimalkan'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => requestAndEnableNotifications()}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer whitespace-nowrap ${
                            notificationPermissionStatus === 'granted'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
                          }`}
                        >
                          {notificationPermissionStatus === 'granted' ? 'Aktif' : 'Izinkan'}
                        </button>
                        <button
                          type="button"
                          onClick={() => sendTestNotificationNow()}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold cursor-pointer whitespace-nowrap"
                        >
                          Tes
                        </button>
                      </div>
                    </div>

                    {/* LEVEL 1: 10 NOTIFICATION CATEGORIES WITH CHECKBOXES */}
                    <div className="max-h-80 overflow-y-auto space-y-1 pr-0.5">
                      {NOTIFICATION_CATEGORIES_10.map((cat) => {
                        const isAllowed = notificationCategoryPermissions[cat.key] !== false;
                        const items = notificationsByCategory[cat.key] || [];
                        const unreadCount = items.filter((n) => !n.read).length;

                        return (
                          <div
                            key={cat.key}
                            className={`flex items-center gap-2.5 p-2 rounded-xl border transition-colors ${
                              isAllowed
                                ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700'
                                : 'bg-slate-950/40 border-slate-800/60 opacity-75 hover:opacity-100'
                            }`}
                          >
                            {/* Left Checkbox Button */}
                            <button
                              type="button"
                              role="checkbox"
                              aria-checked={isAllowed}
                              aria-label={`Izinkan notifikasi ${cat.label}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNotificationCategoryPermission(cat.key);
                              }}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                                isAllowed
                                  ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                  : 'bg-slate-900 border-slate-600 text-transparent hover:border-slate-400'
                              }`}
                              title={isAllowed ? `Matikan notifikasi ${cat.label}` : `Izinkan notifikasi ${cat.label}`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>

                            {/* Right Clickable Row to View Notifications Inside Category */}
                            <button
                              type="button"
                              onClick={() => setSelectedNotifCategory(cat.key)}
                              className="flex-1 min-w-0 flex items-center justify-between gap-2 text-left cursor-pointer group"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[10px] text-slate-500 tabular-nums">
                                    {cat.numberLabel}
                                  </span>
                                  <span className={`font-bold text-[12px] truncate ${isAllowed ? 'text-white group-hover:text-amber-300' : 'text-slate-400 line-through'}`}>
                                    {cat.label}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  {isAllowed
                                    ? cat.description
                                    : 'Dimatikan — notifikasi baru diblokir'}
                                </p>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0 font-mono tabular-nums">
                                {unreadCount > 0 ? (
                                  <span className="text-[10px] font-bold text-amber-300">
                                    {unreadCount} baru · {items.length}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-500">
                                    {items.length}
                                  </span>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition-colors" />
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    {/* LEVEL 2: NOTIFICATIONS INSIDE SELECTED CATEGORY */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedNotifCategory(null)}
                        className="flex items-center gap-1 text-[11px] font-bold text-slate-300 hover:text-amber-300 cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Semua Jenis</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={notificationCategoryPermissions[selectedNotifCategory] !== false}
                          onClick={() => toggleNotificationCategoryPermission(selectedNotifCategory)}
                          className="flex items-center gap-1.5 text-[10px] font-semibold cursor-pointer text-slate-200 hover:text-white"
                        >
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              notificationCategoryPermissions[selectedNotifCategory] !== false
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'bg-slate-900 border-slate-600 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                          <span>
                            {notificationCategoryPermissions[selectedNotifCategory] !== false
                              ? 'Diizinkan'
                              : 'Dimatikan'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => markCategoryNotificationsAsRead(selectedNotifCategory)}
                          className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
                        >
                          Tandai Dibaca
                        </button>
                      </div>
                    </div>

                    {selectedCategoryMeta && (
                      <div className="px-1">
                        <div className="flex items-center justify-between">
                          <span className={`font-black text-sm ${selectedCategoryMeta.accentTextClass}`}>
                            {selectedCategoryMeta.numberLabel}. Notifikasi {selectedCategoryMeta.label}
                          </span>
                          <span className="text-[10px] font-mono tabular-nums text-slate-400">
                            {selectedCategoryItems.length} item
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {selectedCategoryMeta.description}
                        </p>
                      </div>
                    )}

                    {notificationCategoryPermissions[selectedNotifCategory] === false && (
                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[10px] text-rose-200 leading-relaxed">
                        Centang izin untuk jenis ini sedang dimatikan. Notifikasi dan banner baru jenis ini tidak akan muncul (tersinkron real-time ke Cloud).
                      </div>
                    )}

                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                      {selectedCategoryItems.length === 0 ? (
                        <div className="text-slate-400 text-center py-6 px-3 space-y-1">
                          <p className="font-semibold text-slate-300">
                            Belum ada notifikasi di jenis {selectedCategoryMeta?.label}.
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Aktivitas {selectedCategoryMeta?.label.toLowerCase()} baru akan masuk ke daftar ini jika izin dicentang.
                          </p>
                        </div>
                      ) : (
                        selectedCategoryItems.slice(0, 40).map((n) => (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationItemClick(n)}
                            className={`p-2.5 rounded-xl border cursor-pointer transition-colors ${
                              n.read
                                ? 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-600'
                                : 'bg-slate-950 border-amber-500/40 text-slate-200 hover:border-amber-400'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="font-bold text-white text-[11px] truncate">
                                <DiamondText text={n.title} tone="bright" />
                              </div>
                              <span className="text-[9px] text-slate-500 font-mono tabular-nums shrink-0">
                                {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                              <DiamondText text={n.message} tone="bright" />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Register Card Button (Ringkas di HP/Tablet, Tampil di Layar Lebar xl+) */}
          <button
            onClick={onOpenRegisterModal}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Daftar Kartu Baru</span>
          </button>

          {/* Profil, Sync Status & Statistik Akun Lengkap */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowNotifDropdown(false);
                setShowProfileStatsModal(true);
              }}
              title="Buka Profil, Status Sync Cloud & Statistik Akun Lengkap"
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs cursor-pointer transition-colors shrink-0"
            >
              <div
                className={`relative w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs shrink-0 ${
                  currentAccount?.cardStatus === 'banned' ? 'bg-rose-600' : 'bg-blue-600'
                }`}
              >
                {currentAccount ? currentAccount.fullName.charAt(0) : 'U'}
                <span
                  title={
                    syncTelemetry.status === 'error'
                      ? 'Sync Cloud Bermasalah — klik Profil'
                      : syncTelemetry.status === 'offline'
                      ? 'Mode Offline — klik Profil'
                      : syncTelemetry.status === 'syncing'
                      ? 'Menyinkronkan ke Cloud...'
                      : 'Cloud Tersinkronisasi'
                  }
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
                    syncTelemetry.status === 'error'
                      ? 'bg-rose-500'
                      : syncTelemetry.status === 'offline'
                      ? 'bg-amber-400'
                      : syncTelemetry.status === 'syncing'
                      ? 'bg-blue-400'
                      : 'bg-emerald-400'
                  }`}
                >
                  {syncTelemetry.status === 'syncing' && (
                    <RefreshCw className="w-1.5 h-1.5 text-slate-950 animate-spin" />
                  )}
                </span>
              </div>
              <div className="text-left hidden sm:block min-w-0">
                {currentAccount && (
                  <div className="hidden xl:block mb-0.5">
                    <UserId16AboveNameBanner
                      account={currentAccount}
                      variant="navbar"
                      showCopyButton={true}
                      masked={Boolean(currentAccount.hideSensitiveNumbers)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white block truncate max-w-[78px] lg:max-w-[105px]">
                    {currentAccount ? currentAccount.fullName.split(' ')[0] : 'Profil Akun'}
                  </span>
                  {currentAccount?.isVerified && (
                    <VerifiedBadge size="xs" label={currentAccount.verifiedLabel} />
                  )}
                  {currentAccount?.isOfficialAdminAccount && <OaAccountBadge size="xs" />}
                </div>
                <span className="hidden md:block text-[10px] font-mono text-amber-300 -mt-0.5">
                  {currentAccount
                    ? formatAccountNumberDisplay(
                        currentAccount.accountNumber,
                        Boolean(currentAccount.hideSensitiveNumbers)
                      )
                    : ''}
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* BARIS 2: Navigasi 11 Menu Lengkap (Seragam di Desktop & HP) dengan Panah Gulir Otomatis */}
      <div className="bg-[#060b16]/95 border-t border-slate-800/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 relative flex items-center">
          {/* Panah Gulir Kiri Otomatis */}
          {canScrollLeft && (
            <div className="absolute left-1 sm:left-4 top-0 bottom-0 z-10 flex items-center pr-4 bg-gradient-to-r from-[#060b16] via-[#060b16]/90 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollNavBy(-260)}
                className="pointer-events-auto w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                aria-label="Geser menu ke kiri"
                title="Geser menu ke kiri"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          <nav
            ref={navScrollRef}
            aria-label="Navigasi Utama Bank Nusantara"
            className="flex flex-1 min-w-0 items-center gap-1.5 overflow-x-auto py-2 text-xs font-semibold [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {/* 1. Mobile Banking */}
            {uiVisibilityConfig.navTabs.dashboard !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('dashboard', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'dashboard'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Mobile Banking</span>
              </button>
            )}

            {/* 1A. Misi Harian & Leaderboard bersebelahan di dekat Mobile Banking */}
            {uiVisibilityConfig.navTabs.missions !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('missions', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'missions'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-300 hover:text-white hover:bg-slate-900 border border-amber-500/35'
                }`}
              >
                <Target className="w-3.5 h-3.5 shrink-0" />
                <span>Misi Harian</span>
                {activeMissionsCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-200 font-mono tabular-nums text-[10px] font-black">
                    {activeMissionsCount}
                  </span>
                )}
              </button>
            )}

            {uiVisibilityConfig.navTabs.leaderboard !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('leaderboard', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'leaderboard'
                    ? 'bg-gradient-to-r from-yellow-400 via-amber-400 to-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-yellow-300 hover:text-white hover:bg-slate-900 border border-yellow-500/35'
                }`}
              >
                <Trophy className="w-3.5 h-3.5 shrink-0" />
                <span>Leaderboard</span>
              </button>
            )}

            {/* 1B. Keluarga */}
            {uiVisibilityConfig.navTabs.family !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('family', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'family'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-indigo-300 hover:text-white hover:bg-slate-900 border border-indigo-500/35'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span>Keluarga</span>
              </button>
            )}

            {/* 2. Transfer */}
            {uiVisibilityConfig.navTabs.transfer !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('transfer', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'transfer'
                    ? 'bg-emerald-600 text-white font-bold shadow-sm'
                    : 'text-emerald-300 hover:text-white hover:bg-slate-900 border border-emerald-500/30'
                }`}
              >
                <Send className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Transfer</span>
              </button>
            )}

            {/* 3. Emas 24K */}
            {uiVisibilityConfig.navTabs.emas !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('emas', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'emas'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-300 hover:text-white hover:bg-slate-900 border border-amber-400/35'
                }`}
              >
                <Crown className="w-3.5 h-3.5 shrink-0" />
                <span>Emas 24K</span>
              </button>
            )}

            {/* 4. Anggaran */}
            {uiVisibilityConfig.navTabs.anggaran !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('anggaran', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'anggaran'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-indigo-300 hover:text-white hover:bg-slate-900 border border-indigo-500/30'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
                <span>Anggaran</span>
                {budgetAlertCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono tabular-nums text-[10px] font-black">
                    {budgetAlertCount}
                  </span>
                )}
              </button>
            )}

            {/* 5. Kode Redeem */}
            {uiVisibilityConfig.navTabs.redeem !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('redeem', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'redeem'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-300 hover:text-white hover:bg-slate-900 border border-amber-400/35'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 shrink-0" />
                <span>Kode Redeem</span>
              </button>
            )}

            {/* 6. Lowongan Kerja */}
            {uiVisibilityConfig.navTabs.jobs !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('jobs', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'jobs'
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm'
                    : 'text-amber-300 hover:text-white hover:bg-slate-900 border border-amber-400/35'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>Lowongan Kerja</span>
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono tabular-nums text-[10px] font-bold">
                  Lv.{currentAccount?.jobLevel || 1}
                </span>
              </button>
            )}

            {/* 7. Spin the Wheel */}
            {uiVisibilityConfig.navTabs.spin_wheel !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('spin_wheel', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'spin_wheel'
                    ? 'bg-gradient-to-r from-fuchsia-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-sm'
                    : 'text-fuchsia-300 hover:text-white hover:bg-slate-900 border border-fuchsia-500/35'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Spin the Wheel</span>
                <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono tabular-nums text-[10px] font-bold">
                  {formatAssetCount(currentAccount?.spinCoins, {
                    isAdmin: isAdminCardAccount(currentAccount),
                  })}
                </span>
              </button>
            )}

            {/* 8. PayChat */}
            {uiVisibilityConfig.navTabs.chat !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('chat', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'chat'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>PayChat</span>
              </button>
            )}

            {/* 9. Mesin ATM */}
            {uiVisibilityConfig.navTabs.atm !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('atm', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'atm'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Mesin ATM</span>
              </button>
            )}

            {/* 10. Panduan */}
            {uiVisibilityConfig.navTabs.guide !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('guide', e)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  activeView === 'guide'
                    ? 'bg-blue-600 text-white font-bold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>Panduan</span>
              </button>
            )}

            {/* 11. Update */}
            {uiVisibilityConfig.navTabs.updates !== false && (
              <button
                type="button"
                onClick={(e) => handleSelectNavView('updates', e)}
                className={`group relative overflow-hidden px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeView === 'updates'
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-slate-950 font-bold border border-emerald-300/60 shadow-[0_0_20px_rgba(16,185,129,0.28),inset_0_1px_0_rgba(255,255,255,0.45)]'
                    : 'bg-gradient-to-b from-emerald-500/12 via-slate-900/80 to-slate-950/90 text-slate-200 hover:text-white border border-emerald-400/35 hover:border-emerald-400/70 shadow-[inset_0_1px_0_rgba(167,243,208,0.18)]'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent"
                />
                <History
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-105 ${
                    activeView === 'updates' ? 'text-slate-950' : 'text-emerald-400'
                  }`}
                />
                <span className="tracking-tight">Update</span>
                <span
                  className={`font-mono tabular-nums text-[10px] font-bold tracking-tight ${
                    activeView === 'updates'
                      ? 'text-slate-950/90'
                      : 'text-emerald-300'
                  }`}
                >
                  {currentUpdateVersion}
                </span>
                {hasUnreadAppUpdate && activeView !== 'updates' && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-mono text-[9px] font-black tracking-wider leading-none">
                    BARU
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Panah Gulir Kanan Otomatis */}
          {canScrollRight && (
            <div className="absolute right-1 sm:right-4 top-0 bottom-0 z-10 flex items-center pl-4 bg-gradient-to-l from-[#060b16] via-[#060b16]/90 to-transparent pointer-events-none">
              <button
                type="button"
                onClick={() => scrollNavBy(260)}
                className="pointer-events-auto w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white flex items-center justify-center shadow-md cursor-pointer transition-colors"
                aria-label="Geser menu ke kanan"
                title="Geser menu ke kanan"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {googleLinkFeedback && (
        <div
          className={`px-4 py-2 text-xs font-bold text-center border-t ${
            googleLinkFeedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
          }`}
        >
          {googleLinkFeedback.text}
        </div>
      )}

    </header>

    {/* Modal Profil & Statistik Akun Lengkap dirender di luar stacking context <header> */}
    <UserProfileStatsModal
      isOpen={showProfileStatsModal}
      onClose={() => setShowProfileStatsModal(false)}
      onQuickAdminAccess={onQuickAdminAccess}
      onOpenSecurityCenter={onOpenSecurityCenter}
    />
    </>
  );
};

