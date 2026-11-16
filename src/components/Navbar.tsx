/**
 * Bank Nusantara Navigation Bar with Active Account Switcher (Uses Old Card PIN + Lupa PIN support),
 * Centang Biru Verification Badge, and Notification Center
 */
import React, { useState } from 'react';
import {
  CreditCard,
  Building,
  Monitor,
  BookOpen,
  Bell,
  PlusCircle,
  ChevronDown,
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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { PinPromptModal } from './PinPromptModal';
import { VerifiedBadge } from './VerifiedBadge';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import { computeMonthlyBudgetReport, getCurrentMonthKey } from '../utils/budgetUtils';
import { useSecretAdminSequence } from '../utils/useSecretAdminSequence';
import { DevRoleConfig, NotificationCategory } from '../types/bank';
import { getDevBadgeColorStyle } from '../data/devRolesCatalog';

export type AppNavView =
  | 'dashboard'
  | 'transfer'
  | 'emas'
  | 'anggaran'
  | 'jobs'
  | 'spin_wheel'
  | 'empire'
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
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenRegisterModal,
  onSecretAdminTrigger,
  onQuickAdminAccess,
}) => {
  const {
    accounts,
    currentAccount,
    loginToCardWithPin,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    notificationsEnabled,
    notificationPermissionStatus,
    requestAndEnableNotifications,
    sendTestNotificationNow,
    logoutGoogle,
    appUpdates,
    budgetCategories,
    transactions,
    manualExpenses,
    budgetTxCategoryMap,
    devRoles,
    cloudSyncStatus,
    googleUser,
  } = useBank();

  const activeDevRole = currentAccount?.devRoleId
    ? devRoles.find((r) => r.id === currentAccount.devRoleId) || null
    : null;
  const activeDevStyle = activeDevRole ? getDevBadgeColorStyle(activeDevRole.badgeColor) : null;

  const currentUpdateVersion =
    appUpdates.find((u) => u.isCurrent)?.version || appUpdates[0]?.version || 'v7.0';

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

  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [notifCategoryFilter, setNotifCategoryFilter] = useState<'all' | NotificationCategory>('all');
  const [pendingSwitchAccountId, setPendingSwitchAccountId] = useState<string | null>(null);

  const { handleBankClick, handleNusantaraClick } = useSecretAdminSequence(onSecretAdminTrigger);

  const pendingTargetAccount = accounts.find((a) => a.id === pendingSwitchAccountId) || null;

  const filteredNotifications =
    notifCategoryFilter === 'all'
      ? notifications
      : notifications.filter((n) => (n.category || 'promo') === notifCategoryFilter);

  const getCategoryBadge = (cat?: NotificationCategory) => {
    if (cat === 'transaction') return { label: 'Transaksi', cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
    if (cat === 'loan') return { label: 'Pinjaman', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
    if (cat === 'security') return { label: 'Keamanan', cls: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
    return { label: 'Info & Promo', cls: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };
  };

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

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo (Stealth 4-stage trigger attached cleanly with zero visual cues) */}
        <div
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
            <CreditCard className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-extrabold text-white text-base tracking-wider">
                <span onClick={handleBankClick}>BANK</span>{' '}
                <span onClick={handleNusantaraClick}>NUSANTARA</span>
              </span>
              <span className="text-[9px] bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                ID
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 tracking-tight">
              Sistem Perbankan & ATM Terpadu
            </p>
          </div>
        </div>

        {/* Center Nav Views */}
        <nav className="hidden md:flex flex-1 min-w-0 items-center gap-1 overflow-x-auto text-xs font-semibold py-1">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-amber-400" />
            <span>Mobile Banking</span>
          </button>

          {/* Tab Transfer tepat di sebelah Mobile Banking */}
          <button
            onClick={() => setActiveView('transfer')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'transfer'
                ? 'bg-emerald-600 text-white font-bold shadow-md'
                : 'text-emerald-300 hover:text-white hover:bg-slate-900 border border-emerald-500/35'
            }`}
          >
            <Send className="w-4 h-4 text-emerald-300" />
            <span>Transfer</span>
          </button>

          {/* Tab Emas 24K tepat di sebelah Transfer & Mobile Banking */}
          <button
            onClick={() => setActiveView('emas')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'emas'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-amber-300 hover:text-white hover:bg-slate-900 border border-amber-400/40'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>Emas 24K</span>
          </button>

          {/* Tab Anggaran & Pelacak Pengeluaran Bulanan */}
          <button
            onClick={() => setActiveView('anggaran')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'anggaran'
                ? 'bg-indigo-600 text-white font-bold shadow-md'
                : 'text-indigo-300 hover:text-white hover:bg-slate-900 border border-indigo-500/35'
            }`}
          >
            <PieChart className="w-4 h-4 text-indigo-300" />
            <span>Anggaran</span>
            {budgetAlertCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-black">
                {budgetAlertCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('jobs')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'jobs'
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-amber-300 hover:text-white hover:bg-slate-900 border border-amber-400/40'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Lowongan Kerja</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              Lv.{currentAccount?.jobLevel || 1}
            </span>
          </button>

          {/* Tombol Spin the Wheel tepat di sebelah tombol Lowongan Pekerjaan */}
          <button
            onClick={() => setActiveView('spin_wheel')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'spin_wheel'
                ? 'bg-gradient-to-r from-fuchsia-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-fuchsia-300 hover:text-white hover:bg-slate-900 border border-fuchsia-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Spin the Wheel</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold">
              {(currentAccount?.spinCoins ?? 0).toLocaleString('id-ID')}
            </span>
          </button>

          {/* Tombol Fitur Baru Pengganti Kerajaan: Mining Kripto, Lelang Supercar & Cyber Vault tepat di sebelah Spin the Wheel */}
          <button
            onClick={() => setActiveView('empire')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'empire'
                ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-slate-950 font-black shadow-md'
                : 'text-cyan-300 hover:text-white hover:bg-slate-900 border border-cyan-400/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Mining &amp; Lelang VIP</span>
          </button>

          <button
            onClick={() => setActiveView('chat')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'chat'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>PayChat</span>
          </button>

          <button
            onClick={() => setActiveView('atm')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'atm'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Mesin ATM</span>
          </button>

          <button
            onClick={() => setActiveView('guide')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Panduan</span>
          </button>

          {/* Riwayat Update tepat di sebelah Panduan */}
          <button
            onClick={() => setActiveView('updates')}
            className={`px-2.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeView === 'updates'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-emerald-500/30'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Update</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              {currentUpdateVersion}
            </span>
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2 shrink-0">
          {activeDevRole && activeDevStyle && (
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <span
                className={`px-2 py-1 rounded-lg border text-[10px] font-black tracking-wide whitespace-nowrap shrink-0 ${activeDevStyle.pillClass}`}
                title={activeDevRole.description || activeDevRole.name}
              >
                {activeDevRole.name}
              </span>
              {activeDevRole.canQuickOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    if (onQuickAdminAccess) {
                      onQuickAdminAccess(activeDevRole);
                    } else {
                      onSecretAdminTrigger();
                    }
                  }}
                  className={`px-2.5 py-1.5 rounded-xl font-black text-[11px] flex items-center gap-1 cursor-pointer shadow-md transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                    activeView === 'admin'
                      ? 'ring-2 ring-white ' + activeDevStyle.quickBtnClass
                      : activeDevStyle.quickBtnClass
                  }`}
                  title={
                    activeDevRole.bypassAdminPin
                      ? 'Buka Panel Admin Instan (Bebas PIN)'
                      : 'Buka Panel Admin (Wajib PIN Admin)'
                  }
                >
                  {activeDevRole.bypassAdminPin ? (
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>{activeDevRole.bypassAdminPin ? 'Panel Admin' : 'Admin (PIN)'}</span>
                </button>
              )}
            </div>
          )}

          {/* Indikator Status Koneksi Cloud Real-Time */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-bold whitespace-nowrap shrink-0 ${
              cloudSyncStatus === 'synced'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : cloudSyncStatus === 'syncing'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
            }`}
            title="Status koneksi & sinkronisasi real-time Cloud Firestore"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                cloudSyncStatus === 'synced'
                  ? 'bg-emerald-400'
                  : cloudSyncStatus === 'syncing'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-rose-400'
              }`}
            />
            <Cloud className="w-3 h-3 shrink-0" />
            <span>
              {cloudSyncStatus === 'synced'
                ? 'Tersinkronisasi'
                : cloudSyncStatus === 'syncing'
                ? 'Menyinkronkan...'
                : 'Offline'}
            </span>
          </div>

          {/* Money & Coin Icon Indicator Bar */}
          {currentAccount && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 whitespace-nowrap shrink-0 font-mono text-[11px] tabular-nums">
              <span
                className="flex items-center gap-1 text-emerald-300 font-bold pr-1.5 border-r border-slate-700"
                title="Saldo Uang Rekening"
              >
                <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  {currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance)
                    ? '∞'
                    : formatRupiah(currentAccount.balance)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActiveView('spin_wheel')}
                className="flex items-center gap-1 text-amber-300 font-bold hover:text-amber-200 cursor-pointer"
                title="Total Coin Nusantara (Klik ke Spin the Wheel)"
              >
                <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{(currentAccount.spinCoins ?? 0).toLocaleString('id-ID')}</span>
              </button>
            </div>
          )}

          {/* 🔔 Tombol Notifikasi */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
              }}
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-amber-300 transition cursor-pointer"
              title="Pusat Notifikasi"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-black">
                  {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="font-black text-white flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-400" />
                    <span>Notifikasi Aplikasi ({notifications.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer"
                  >
                    Tandai Semua Dibaca
                  </button>
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

                {/* Category Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {[
                    { id: 'all' as const, label: 'Semua' },
                    { id: 'transaction' as const, label: 'Transaksi' },
                    { id: 'loan' as const, label: 'Pinjaman' },
                    { id: 'security' as const, label: 'Keamanan' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setNotifCategoryFilter(tab.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        notifCategoryFilter === tab.id
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                  {filteredNotifications.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Belum ada notifikasi di kategori ini.</p>
                  ) : (
                    filteredNotifications.slice(0, 30).map((n) => {
                      const catBadge = getCategoryBadge(n.category);
                      return (
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
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded border font-bold shrink-0 ${catBadge.cls}`}
                              >
                                {catBadge.label}
                              </span>
                              <div className="font-bold text-white text-[11px] truncate">{n.title}</div>
                            </div>
                            <span className="text-[9px] text-slate-500 font-mono shrink-0">
                              {new Date(n.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                            {n.message}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Register Card Button */}
          <button
            onClick={onOpenRegisterModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Daftar Kartu Baru</span>
          </button>

          {/* Active Card / Account Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs cursor-pointer"
            >
              <div
                className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs ${
                  currentAccount?.cardStatus === 'banned' ? 'bg-rose-600' : 'bg-blue-600'
                }`}
              >
                {currentAccount ? currentAccount.fullName.charAt(0) : 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-white block truncate max-w-[105px]">
                    {currentAccount ? currentAccount.fullName.split(' ')[0] : 'Pilih Akun'}
                  </span>
                  {currentAccount?.isVerified && (
                    <VerifiedBadge size="xs" label={currentAccount.verifiedLabel} />
                  )}
                </div>
                <span className="text-[10px] font-mono text-amber-300 -mt-0.5 block">
                  {currentAccount ? currentAccount.accountNumber : ''}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Switch Account / Card Dropdown */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-84 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-50 text-xs space-y-2">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-white block truncate">
                      {currentAccount ? currentAccount.fullName : googleUser?.name || 'Nasabah Bank Nusantara'}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 block truncate">
                      {googleUser?.email || 'Cloud Firestore Real-Time'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logoutGoogle();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                    title="Keluar Akun Google"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Keluar Akun</span>
                  </button>
                </div>

                <div className="px-2 py-1 text-[11px] font-semibold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                  <span>Login / Ganti ke Kartu Lain:</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    PIN Kartu / Admin
                  </span>
                </div>

                <div className="px-2.5 py-1.5 text-[10px] text-slate-300 bg-blue-950/30 rounded-lg border border-blue-500/30 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Untuk masuk ke kartu lain, masukkan <strong>6 digit PIN Kartu</strong> tersebut.
                  </span>
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1 pt-1">
                  {accounts.map((acc, idx) => {
                    const isSelected = acc.id === currentAccount?.id;
                    const isAdminCard = acc.cardTier === 'admin';
                    return (
                      <button
                        key={acc.id}
                        onClick={() => {
                          setShowUserDropdown(false);
                          if (!isSelected) {
                            setPendingSwitchAccountId(acc.id);
                          }
                        }}
                        className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white font-bold'
                            : isAdminCard
                            ? 'bg-purple-950/60 hover:bg-purple-900/60 border border-fuchsia-500/40 text-fuchsia-200'
                            : 'hover:bg-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/30 text-amber-300 shrink-0">
                              Kartu #{idx + 1}
                            </span>
                            <span className="font-bold truncate max-w-[130px]">{acc.fullName}</span>
                            {acc.isVerified && (
                              <VerifiedBadge size="xs" label={acc.verifiedLabel} />
                            )}
                          </div>
                          <span className="text-[10px] font-mono opacity-80 block mt-0.5">
                            {acc.accountNumber} • {isAdminCard ? 'KARTU ADMIN (∞)' : acc.cardTier.toUpperCase()}
                          </span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase shrink-0 ${
                            isAdminCard
                              ? 'bg-fuchsia-500 text-slate-950'
                              : acc.cardStatus === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : acc.cardStatus === 'banned'
                              ? 'bg-rose-600 text-white'
                              : acc.cardStatus === 'pending'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {acc.cardStatus === 'banned'
                            ? '🚫 BANNED'
                            : isAdminCard
                            ? '∞ UNLIMITED'
                            : acc.cardStatus === 'pending'
                            ? 'DIPROSES'
                            : acc.cardStatus}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      onOpenRegisterModal();
                      setShowUserDropdown(false);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Daftarkan Kartu Baru</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center gap-4 overflow-x-auto bg-slate-900 border-t border-slate-800 px-3 py-2 text-[11px] font-medium">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${activeView === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          <Building className="w-4 h-4" />
          <span>M-Banking</span>
        </button>
        <button
          onClick={() => setActiveView('jobs')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeView === 'jobs' ? 'text-amber-400 font-bold' : 'text-amber-300/80'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Lowongan</span>
        </button>
        <button
          onClick={() => setActiveView('spin_wheel')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeView === 'spin_wheel' ? 'text-fuchsia-400 font-bold' : 'text-fuchsia-300/80'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Spin Wheel</span>
        </button>
        <button
          onClick={() => setActiveView('empire')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${
            activeView === 'empire' ? 'text-cyan-400 font-bold' : 'text-cyan-300/80'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Mining VIP</span>
        </button>
        <button
          onClick={() => setActiveView('chat')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${activeView === 'chat' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>PayChat</span>
        </button>
        <button
          onClick={() => setActiveView('atm')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${activeView === 'atm' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <Monitor className="w-4 h-4" />
          <span>Mesin ATM</span>
        </button>
        <button
          onClick={() => setActiveView('guide')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${activeView === 'guide' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan</span>
        </button>
        <button
          onClick={() => setActiveView('updates')}
          className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${activeView === 'updates' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Update</span>
        </button>
        {activeDevRole && activeDevRole.canQuickOpenAdmin && (
          <button
            type="button"
            onClick={() => {
              if (onQuickAdminAccess) {
                onQuickAdminAccess(activeDevRole);
              } else {
                onSecretAdminTrigger();
              }
            }}
            className={`flex flex-col items-center gap-0.5 shrink-0 whitespace-nowrap cursor-pointer ${
              activeView === 'admin' ? 'text-amber-300 font-black' : 'text-amber-400 font-bold'
            }`}
          >
            {activeDevRole.bypassAdminPin ? (
              <Zap className="w-4 h-4 text-amber-400" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400" />
            )}
            <span>Admin</span>
          </button>
        )}
      </div>

      {/* Card PIN Prompt when switching/logging into an Old Card or Another Card */}
      {pendingTargetAccount && (
        <PinPromptModal
          isOpen={Boolean(pendingTargetAccount)}
          title="Login ke Kartu Lain / Ganti Kartu"
          description={`Masukkan 6 digit PIN Kartu ${pendingTargetAccount.fullName} untuk masuk ke kartu ini. Jika lupa PIN kartu, klik tombol "Lupa PIN?" di bawah.`}
          targetAccountId={pendingTargetAccount.id}
          targetAccountName={pendingTargetAccount.fullName}
          cardNumberSnippet={pendingTargetAccount.cardNumber}
          expectedPin={pendingTargetAccount.pin}
          acceptAdminPin={true}
          onSuccess={(enteredPin) => {
            loginToCardWithPin(
              pendingTargetAccount.id,
              enteredPin || pendingTargetAccount.pin
            );
            setPendingSwitchAccountId(null);
          }}
          onCancel={() => setPendingSwitchAccountId(null)}
        />
      )}
    </header>
  );
};

