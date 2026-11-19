/**
 * Bank Nusantara — Aplikasi Perbankan & ATM Digital Terpadu
 */
import React, { useState, useEffect } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { Navbar, AppNavView } from './components/Navbar';
import { CustomerDashboard, DashboardTab } from './components/CustomerDashboard';
import { TransferWorkspace } from './components/TransferWorkspace';
import { TabEmasView } from './components/TabEmasView';
import { BudgetingWorkspace } from './components/BudgetingWorkspace';
import { TransferBebasAssetMode, DevRoleConfig } from './types/bank';
import { AtmSimulator } from './components/AtmSimulator';
import { AdminPortal } from './components/AdminPortal';
import { InformationGuide } from './components/InformationGuide';
import { UpdateHistoryView } from './components/UpdateHistoryView';
import { JobVacancyView } from './components/JobVacancyView';
import { SpinTheWheelView } from './components/SpinTheWheelView';
import { SultanEmpireView } from './components/SultanEmpireView';
import { CardRegistrationModal } from './components/CardRegistrationModal';
import { NusantaraChat } from './components/NusantaraChat';
import { AdminPinModal } from './components/AdminPinModal';
import { GoogleAuthOnboardingGate } from './components/GoogleAuthOnboardingGate';
import { WebsiteSystemNotificationModal } from './components/WebsiteSystemNotificationModal';
import { BanLockScreen } from './components/BanLockScreen';
import {
  GlobalChatAndNotificationLayer,
  AllowNotificationFooterButton,
} from './components/GlobalChatAndNotificationLayer';
import { GiftLetterOverlayAndCornerPopup } from './components/GiftLetterOverlayAndCornerPopup';
import { SecurityCommandCenter } from './components/SecurityCommandCenter';
import {
  CreditCard,
  Building,
  ShieldCheck,
  PhoneCall,
  Clock,
  ExternalLink,
  Award,
  ShieldAlert,
  KeyRound,
  RotateCcw,
  Cloud,
} from 'lucide-react';

function BankAppContent() {
  const {
    adminUnlocked,
    setAdminUnlocked,
    resetAllData,
    googleUser,
    enterBankPortal,
    completeGoogleOnboarding,
    isCloudBootReady,
    activeBanLockState,
  } = useBank();
  const [activeView, setActiveView] = useState<AppNavView>('dashboard');
  const [requestedDashboardTab, setRequestedDashboardTab] = useState<{
    tab: DashboardTab;
    nonce: number;
  } | null>(null);
  const [transferRouteContext, setTransferRouteContext] = useState<{
    mode: 'reguler' | 'bebas';
    assetMode?: TransferBebasAssetMode;
    key: number;
  }>({ mode: 'reguler', key: 0 });
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState<boolean>(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState<boolean>(false);
  const [adminViewDuringOnboarding, setAdminViewDuringOnboarding] = useState<boolean>(false);
  const [securityCenterState, setSecurityCenterState] = useState<{
    open: boolean;
    section: 'identity' | 'telemetry' | 'timemachine' | 'audit';
  }>({ open: false, section: 'identity' });
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(() => Boolean(window.__gmpQuotaExceeded));

  const openSecurityCenter = (
    section: 'identity' | 'telemetry' | 'timemachine' | 'audit' = 'identity'
  ) => {
    setSecurityCenterState({ open: true, section });
  };

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

  // Handle tap-to-navigate deep links from Push Banners, Notification Bell, URL query, & Service Worker
  useEffect(() => {
    const applyDeepLink = (targetView?: string, targetDashboardTab?: string) => {
      const validViews: AppNavView[] = [
        'dashboard',
        'transfer',
        'emas',
        'anggaran',
        'jobs',
        'spin_wheel',
        'empire',
        'atm',
        'guide',
        'chat',
        'updates',
      ];
      const safeView: AppNavView = validViews.includes(targetView as AppNavView)
        ? (targetView as AppNavView)
        : 'dashboard';
      setActiveView(safeView);
      if (safeView === 'dashboard' && targetDashboardTab) {
        setRequestedDashboardTab({
          tab: targetDashboardTab as DashboardTab,
          nonce: Date.now(),
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    try {
      const params = new URLSearchParams(window.location.search);
      const qView = params.get('notifView');
      const qTab = params.get('notifTab');
      if (qView || qTab) {
        applyDeepLink(qView || 'dashboard', qTab || 'mutasi');
      }
    } catch { /* empty */ }

    const handleCustomNav = (e: Event) => {
      const custom = e as CustomEvent<{ targetView?: string; targetDashboardTab?: string }>;
      if (custom.detail) {
        applyDeepLink(custom.detail.targetView, custom.detail.targetDashboardTab);
      }
    };

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_FROM_NOTIFICATION') {
        applyDeepLink(event.data.targetView, event.data.targetDashboardTab);
      }
    };

    window.addEventListener('bn:navigate', handleCustomNav);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.removeEventListener('bn:navigate', handleCustomNav);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, []);

  const handleSecretAdminTrigger = () => {
    if (adminUnlocked) {
      if (!googleUser || !googleUser.hasCompletedOnboarding) {
        setAdminViewDuringOnboarding(true);
      } else {
        setActiveView('admin');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowAdminPinModal(true);
    }
  };

  const handleAdminAuthSuccess = () => {
    setAdminUnlocked(true);
    setShowAdminPinModal(false);
    if (!googleUser || !googleUser.hasCompletedOnboarding) {
      setAdminViewDuringOnboarding(true);
    } else {
      setActiveView('admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickAdminAccess = (role?: DevRoleConfig | null) => {
    if (!role || !role.canQuickOpenAdmin) {
      handleSecretAdminTrigger();
      return;
    }
    if (role.bypassAdminPin || adminUnlocked) {
      setAdminUnlocked(true);
      if (!googleUser || !googleUser.hasCompletedOnboarding) {
        setAdminViewDuringOnboarding(true);
      } else {
        setActiveView('admin');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowAdminPinModal(true);
    }
  };

  // 1. Tampilan skeleton super singkat saat fase boot awal (< 2.5 detik maks)
  if (!isCloudBootReady) {
    return (
      <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col">
        {/* Skeleton Navbar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0a101f]/90 px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 animate-pulse" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-32 rounded-md bg-slate-800 animate-pulse" />
              <div className="h-2.5 w-20 rounded-md bg-slate-800/70 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-24 rounded-lg bg-slate-800/80 animate-pulse" />
            <div className="w-8 h-8 rounded-lg bg-slate-800/80 animate-pulse" />
          </div>
        </header>

        {/* Skeleton Body */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-48 rounded-lg bg-slate-800 animate-pulse" />
              <div className="h-3.5 w-64 rounded-md bg-slate-800/60 animate-pulse" />
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
              <Cloud className="w-4 h-4 text-amber-400/80" />
              <span>Menyiapkan sesi...</span>
            </div>
          </div>

          {/* Hero Balance & Card Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 bg-[#0c1324] border border-slate-800/80 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 rounded-md bg-slate-800 animate-pulse" />
                <div className="h-6 w-20 rounded-md bg-amber-500/10 border border-amber-500/20 animate-pulse" />
              </div>
              <div className="h-10 w-60 rounded-xl bg-slate-800 animate-pulse" />
              <div className="grid grid-cols-4 gap-3 pt-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div key={idx} className="h-16 rounded-2xl bg-slate-800/70 animate-pulse" />
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#0c1324] border border-slate-800/80 rounded-3xl p-6 flex flex-col justify-between min-h-[210px]">
              <div className="flex items-center justify-between">
                <div className="h-4 w-24 rounded-md bg-slate-800 animate-pulse" />
                <div className="h-5 w-14 rounded-md bg-slate-800/70 animate-pulse" />
              </div>
              <div className="space-y-2.5 my-4">
                <div className="h-5 w-52 rounded-md bg-slate-800 animate-pulse" />
                <div className="h-3.5 w-36 rounded-md bg-slate-800/60 animate-pulse" />
              </div>
              <div className="flex items-center justify-between">
                <div className="h-3.5 w-28 rounded-md bg-slate-800/70 animate-pulse" />
                <div className="h-3.5 w-16 rounded-md bg-slate-800/70 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Activity & Services Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-[#0c1324] border border-slate-800/80 rounded-3xl p-5 space-y-3.5">
              <div className="h-4 w-36 rounded-md bg-slate-800 animate-pulse" />
              {[0, 1, 2].map((row) => (
                <div key={row} className="flex items-center justify-between py-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-800/80 animate-pulse" />
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-32 rounded bg-slate-800 animate-pulse" />
                      <div className="h-2.5 w-20 rounded bg-slate-800/60 animate-pulse" />
                    </div>
                  </div>
                  <div className="h-4 w-20 rounded bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
            <div className="bg-[#0c1324] border border-slate-800/80 rounded-3xl p-5 space-y-3.5">
              <div className="h-4 w-32 rounded-md bg-slate-800 animate-pulse" />
              <div className="grid grid-cols-3 gap-3 pt-1">
                {[0, 1, 2, 3, 4, 5].map((tile) => (
                  <div key={tile} className="h-20 rounded-2xl bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 2. Real-Time Ban Enforcement: Hentikan seluruh akses fitur jika akun berstatus banned di Cloud
  if (
    activeBanLockState.isBanned &&
    !adminViewDuringOnboarding &&
    !(adminUnlocked && activeView === 'admin')
  ) {
    return <BanLockScreen />;
  }

  const isCustomerGateOpen =
    !googleUser || !googleUser.hasCompletedOnboarding || googleUser.isPinVerified === false;

  // 3. Show Mandatory Google/Email Sign-In -> Auto Detect New Card Creation OR Existing Account PIN Gate
  if (isCustomerGateOpen && !adminViewDuringOnboarding) {
    return (
      <>
        {quotaExceeded && (
          <div className="bg-amber-50 border-b border-amber-300 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-4">
            <span>
              <strong>Maps demo key quota reached.</strong> To keep developing without interruption,{' '}
              <a
                href="https://developers.google.com/maps/documentation/javascript/get-api-key"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                create your own Google Maps API key
              </a>{' '}
              (includes $200/month free credit) and set it as <code className="bg-amber-100 px-1 rounded">GOOGLE_MAPS_API_KEY</code> in Settings → Secrets.
            </span>
            <button onClick={() => setQuotaExceeded(false)} className="text-amber-700 hover:text-amber-950 font-bold">
              ✕
            </button>
          </div>
        )}
        <WebsiteSystemNotificationModal />
        <GlobalChatAndNotificationLayer />
        <GoogleAuthOnboardingGate />
        <AdminPinModal
          isOpen={showAdminPinModal}
          onSuccess={handleAdminAuthSuccess}
          onCancel={() => setShowAdminPinModal(false)}
        />
      </>
    );
  }

  if (adminViewDuringOnboarding && isCustomerGateOpen) {
    return (
      <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans">
        <WebsiteSystemNotificationModal />
        <GlobalChatAndNotificationLayer />
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-2 max-w-7xl w-full mx-auto">
          <span className="text-xs font-bold text-amber-400 font-mono">
            PANEL ADMIN (RIWAYAT UPDATE, CHAT GLOBAL, LAPORAN BUG &amp; 56 SUPER TOOLS)
          </span>
          <div className="flex items-center gap-2">
            <AllowNotificationFooterButton />
            <button
              type="button"
              onClick={() => setAdminViewDuringOnboarding(false)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs cursor-pointer"
            >
              ← Kembali ke Halaman Daftar / Login Kartu Lama
            </button>
          </div>
        </div>
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
          <AdminPortal
            onNavigateToCustomerDashboard={() => {
              if (!googleUser) {
                enterBankPortal();
              }
              completeGoogleOnboarding();
              setAdminViewDuringOnboarding(false);
              setActiveView('dashboard');
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070c18] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-300 px-4 py-3 text-sm text-amber-900 flex items-center justify-between gap-4">
          <span>
            <strong>Maps demo key quota reached.</strong> To keep developing without interruption,{' '}
            <a
              href="https://developers.google.com/maps/documentation/javascript/get-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              create your own Google Maps API key
            </a>{' '}
            (includes $200/month free credit) and set it as <code className="bg-amber-100 px-1 rounded">GOOGLE_MAPS_API_KEY</code> in Settings → Secrets.
          </span>
          <button onClick={() => setQuotaExceeded(false)} className="text-amber-700 hover:text-amber-950 font-bold">
            ✕
          </button>
        </div>
      )}
      {/* Global Closable Website System Notification Modal & Lapor Bug Modal */}
      <WebsiteSystemNotificationModal />
      <GlobalChatAndNotificationLayer />
      <GiftLetterOverlayAndCornerPopup />

      {/* Top Navbar (Includes Transfer & Emas 24K between Mobile Banking & Lowongan Kerja on Desktop) */}
      <Navbar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'transfer') {
            setTransferRouteContext({ mode: 'reguler', assetMode: undefined, key: Date.now() });
          }
          setActiveView(view);
        }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onSecretAdminTrigger={handleSecretAdminTrigger}
        onQuickAdminAccess={handleQuickAdminAccess}
        onOpenSecurityCenter={openSecurityCenter}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'dashboard' && (
          <CustomerDashboard
            requestedSubTab={requestedDashboardTab}
            onQuickAdminAccess={handleQuickAdminAccess}
            onOpenSecurityCenter={openSecurityCenter}
          />
        )}
        {activeView === 'transfer' && (
          <TransferWorkspace
            standalone
            initialMode={transferRouteContext.mode}
            initialBebasAssetMode={transferRouteContext.assetMode}
            routeKey={transferRouteContext.key}
            onNavigateToDashboard={() => {
              setRequestedDashboardTab({ tab: 'ringkasan', nonce: Date.now() });
              setActiveView('dashboard');
            }}
            onNavigateToGold={() => setActiveView('emas')}
            onNavigateToMutasi={() => {
              setRequestedDashboardTab({ tab: 'mutasi', nonce: Date.now() });
              setActiveView('dashboard');
            }}
          />
        )}
        {activeView === 'emas' && (
          <TabEmasView
            standalone
            onNavigateToDashboard={() => {
              setRequestedDashboardTab({ tab: 'ringkasan', nonce: Date.now() });
              setActiveView('dashboard');
            }}
            onNavigateToTransferGold={() => {
              setTransferRouteContext({
                mode: 'bebas',
                assetMode: 'emas',
                key: Date.now(),
              });
              setActiveView('transfer');
            }}
            onNavigateToMutasi={() => {
              setRequestedDashboardTab({ tab: 'mutasi', nonce: Date.now() });
              setActiveView('dashboard');
            }}
          />
        )}
        {activeView === 'anggaran' && <BudgetingWorkspace />}
        {activeView === 'jobs' && <JobVacancyView />}
        {activeView === 'spin_wheel' && <SpinTheWheelView />}
        {activeView === 'empire' && <SultanEmpireView />}
        {activeView === 'chat' && <NusantaraChat />}
        {activeView === 'atm' && <AtmSimulator />}
        {activeView === 'admin' && (
          <AdminPortal
            onNavigateToCustomerDashboard={() => {
              setActiveView('dashboard');
            }}
          />
        )}
        {activeView === 'guide' && (
          <InformationGuide
            onNavigateToTab={(tab, subTab) => {
              if (tab === 'dashboard' && subTab) {
                setRequestedDashboardTab({ tab: subTab as DashboardTab, nonce: Date.now() });
              }
              setActiveView(tab as AppNavView);
            }}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}
        {activeView === 'updates' && (
          <UpdateHistoryView
            onNavigateToView={(view) => setActiveView(view)}
          />
        )}
      </main>

      {/* Card Registration Modal (Accessible anytime) */}
      <CardRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Admin Authorization PIN Modal */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setShowAdminPinModal(false)}
      />

      {/* Zero-Trust Security & Sync Command Center Modal */}
      <SecurityCommandCenter
        isOpen={securityCenterState.open}
        initialSection={securityCenterState.section}
        onClose={() => setSecurityCenterState((prev) => ({ ...prev, open: false }))}
      />

      {/* Official Banking Footer with Izinkan Notifikasi & Secret Admin Portal Link at the very bottom */}
      <footer className="mt-12 bg-slate-950 border-t border-slate-900 py-8 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-bold font-mono">
              🏛️
            </div>
            <div>
              <div className="font-bold text-white tracking-wider font-mono">
                PT BANK NUSANTARA (PERSERO) TBK
              </div>
              <p className="text-[11px] text-slate-400">
                Terdaftar dan diawasi oleh Otoritas Jasa Keuangan (OJK) serta peserta penjaminan Lembaga Penjamin Simpanan (LPS).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span>Halo Nusantara: <strong>1500-888</strong></span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>ATM & M-Banking 24 Jam Nonstop</span>
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Enkripsi EMV Chip & 6-Digit PIN</span>
            </span>
          </div>
        </div>

        {/* BOTTOM SECTION WITH IZINKAN NOTIFIKASI BESIDE ADMIN PANEL BUTTON (Sesuai permintaan user) */}
        <div className="max-w-7xl mx-auto mt-6 pt-5 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © 2026 Bank Nusantara. Seluruh Hak Cipta Dilindungi Undang-Undang. Sesuai Pedoman Resmi 10 Bab Informasi Perbankan.
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => openSecurityCenter('identity')}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Keamanan &amp; Reset Cloud</span>
            </button>

            <span className="text-slate-800">•</span>

            {/* Tombol Izinkan Notifikasi di paling bawah */}
            <AllowNotificationFooterButton />
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BankProvider>
      <BankAppContent />
    </BankProvider>
  );
}
