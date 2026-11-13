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
  Bot,
  Mic,
  GraduationCap,
  Cpu,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { PinPromptModal } from './PinPromptModal';
import { VerifiedBadge } from './VerifiedBadge';

interface NavbarProps {
  activeView:
    | 'dashboard'
    | 'jobs'
    | 'spin_wheel'
    | 'empire'
    | 'atm'
    | 'admin'
    | 'guide'
    | 'chat'
    | 'updates';
  setActiveView: (
    view:
      | 'dashboard'
      | 'jobs'
      | 'spin_wheel'
      | 'empire'
      | 'atm'
      | 'admin'
      | 'guide'
      | 'chat'
      | 'updates'
  ) => void;
  onOpenRegisterModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  onOpenRegisterModal,
}) => {
  const {
    accounts,
    currentAccount,
    loginToCardWithPin,
    notifications,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    googleUser,
    logoutGoogle,
    appUpdates,
    setIsAiBotModalOpen,
    setIsTutorialModalOpen,
  } = useBank();

  const currentUpdateVersion =
    appUpdates.find((u) => u.isCurrent)?.version || appUpdates[0]?.version || 'v7.0';

  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState<boolean>(false);
  const [pendingSwitchAccountId, setPendingSwitchAccountId] = useState<string | null>(null);

  const pendingTargetAccount = accounts.find((a) => a.id === pendingSwitchAccountId) || null;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
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
                BANK NUSANTARA
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
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'dashboard'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-amber-400" />
            <span>Mobile Banking</span>
          </button>

          <button
            onClick={() => setActiveView('jobs')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'spin_wheel'
                ? 'bg-gradient-to-r from-fuchsia-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-md'
                : 'text-fuchsia-300 hover:text-white hover:bg-slate-900 border border-fuchsia-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Spin the Wheel</span>
            <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-mono text-[10px] font-bold">
              🪙 {(currentAccount?.spinCoins ?? 0).toLocaleString('id-ID')}
            </span>
          </button>

          {/* Tombol Fitur Baru Pengganti Kerajaan: Mining Kripto, Lelang Supercar & Cyber Vault tepat di sebelah Spin the Wheel */}
          <button
            onClick={() => setActiveView('empire')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'empire'
                ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-slate-950 font-black shadow-md'
                : 'text-cyan-300 hover:text-white hover:bg-slate-900 border border-cyan-400/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>💎 Mining &amp; Lelang VIP</span>
          </button>

          <button
            onClick={() => setActiveView('chat')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
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
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'atm'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Simulator Mesin ATM</span>
          </button>

          <button
            onClick={() => setActiveView('guide')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Panduan (60 Bab)</span>
          </button>

          {/* Riwayat Update tepat di sebelah Panduan (Sesuai permintaan user) */}
          <button
            onClick={() => setActiveView('updates')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeView === 'updates'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-emerald-500/30'
            }`}
          >
            <History className="w-4 h-4 text-emerald-400" />
            <span>Riwayat Update</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              {currentUpdateVersion}
            </span>
          </button>
        </nav>

        {/* Right Action Bar */}
        <div className="flex items-center gap-2">
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
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs space-y-2">
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

                <div className="max-h-72 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <p className="text-slate-400 text-center py-4">Belum ada notifikasi.</p>
                  ) : (
                    notifications.slice(0, 15).map((n) => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-xl border ${
                          n.read
                            ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                            : 'bg-slate-950 border-amber-500/40 text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-white text-[11px]">{n.title}</div>
                        <div className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                          {n.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 🤖 Tombol Bot AI Khusus Aplikasi + Voice Chat (Gemini 1.5 Flash) TEPAT DI SEBELAH TOMBOL NOTIFIKASI */}
          <button
            type="button"
            onClick={() => setIsAiBotModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-xs shadow-md shadow-cyan-500/25 transition-all cursor-pointer border border-cyan-300/40"
            title="Bot-Bot AI Khusus Aplikasi + Voice Chat / Suara (Gemini 1.5 Flash)"
          >
            <Bot className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="hidden lg:inline">Bot AI &amp; Suara</span>
            <span className="lg:hidden">Bot AI</span>
            <Mic className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          </button>

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
                {/* Connected Google Account Banner */}
                {googleUser && (
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-extrabold text-[10px] shrink-0">
                        {googleUser.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-white block truncate">
                          Google: {googleUser.displayName}
                        </span>
                        <span className="text-[9px] font-mono text-slate-400 block truncate">
                          {googleUser.email}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        logoutGoogle();
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-300 text-slate-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Keluar Akun Google / Kembali ke Layar Login Google Awal"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Ganti Google</span>
                    </button>
                  </div>
                )}

                <div className="px-2 py-1 text-[11px] font-semibold text-slate-300 border-b border-slate-800 flex items-center justify-between">
                  <span>Ganti ke Kartu Lama / Kartu Lain:</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
                    Pakai PIN Kartu Lama
                  </span>
                </div>

                <div className="px-2.5 py-1.5 text-[10px] text-slate-300 bg-blue-950/30 rounded-lg border border-blue-500/30 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Untuk login/ganti dari kartu baru ke <strong>Kartu Lama</strong> Anda, wajib memasukkan <strong>PIN Kartu Lama</strong> tersebut (bukan PIN Admin). Jika lupa, klik tombol <strong>Lupa PIN?</strong>.
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
      <div className="md:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 px-2 py-2 text-[11px] font-medium">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'dashboard' ? 'text-amber-400 font-bold' : 'text-slate-400'}`}
        >
          <Building className="w-4 h-4" />
          <span>M-Banking</span>
        </button>
        <button
          onClick={() => setActiveView('jobs')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${
            activeView === 'jobs' ? 'text-amber-400 font-bold' : 'text-amber-300/80'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Lowongan</span>
        </button>
        <button
          onClick={() => setActiveView('spin_wheel')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${
            activeView === 'spin_wheel' ? 'text-fuchsia-400 font-bold' : 'text-fuchsia-300/80'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Spin Wheel</span>
        </button>
        <button
          onClick={() => setActiveView('empire')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${
            activeView === 'empire' ? 'text-cyan-400 font-bold' : 'text-cyan-300/80'
          }`}
        >
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Mining VIP</span>
        </button>
        <button
          onClick={() => setActiveView('chat')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'chat' ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>PayChat</span>
        </button>
        <button
          onClick={() => setActiveView('atm')}
          className={`flex flex-col items-center gap-0.5 ${activeView === 'atm' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <Monitor className="w-4 h-4" />
          <span>Mesin ATM</span>
        </button>
        <button
          onClick={() => setActiveView('guide')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeView === 'guide' ? 'text-purple-400 font-bold' : 'text-slate-400'}`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Panduan (60)</span>
        </button>
        <button
          onClick={() => setActiveView('updates')}
          className={`flex flex-col items-center gap-0.5 cursor-pointer ${activeView === 'updates' ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}
        >
          <History className="w-4 h-4 text-emerald-400" />
          <span>Update</span>
        </button>
        <button
          onClick={() => setIsAiBotModalOpen(true)}
          className="flex flex-col items-center gap-0.5 cursor-pointer text-cyan-300 font-bold"
        >
          <Bot className="w-4 h-4 text-cyan-400" />
          <span>Bot AI Suara</span>
        </button>
      </div>

      {/* Card PIN Prompt when switching/logging into an Old Card or Another Card */}
      {pendingTargetAccount && (
        <PinPromptModal
          isOpen={Boolean(pendingTargetAccount)}
          title="Login ke Kartu Lama / Ganti Kartu"
          description={`Masukkan 6 digit PIN Kartu ${pendingTargetAccount.fullName} (Bukan PIN Admin) untuk beralih ke kartu ini. Jika lupa PIN kartu lama Anda, klik tombol "Lupa PIN?" di bawah.`}
          targetAccountId={pendingTargetAccount.id}
          targetAccountName={pendingTargetAccount.fullName}
          cardNumberSnippet={pendingTargetAccount.cardNumber}
          expectedPin={pendingTargetAccount.pin}
          onSuccess={() => {
            loginToCardWithPin({
              targetAccountId: pendingTargetAccount.id,
              cardPin: pendingTargetAccount.pin,
            });
            setPendingSwitchAccountId(null);
          }}
          onCancel={() => setPendingSwitchAccountId(null)}
        />
      )}
    </header>
  );
};

