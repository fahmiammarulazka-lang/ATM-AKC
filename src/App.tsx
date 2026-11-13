/**
 * Bank Nusantara — Aplikasi Perbankan & ATM Digital Terpadu
 * Fully updated with Footer Admin PIN Authentication (159357) and Nusantara PayChat
 */
import React, { useState, useEffect } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { Navbar, AppNavView } from './components/Navbar';
import { CustomerDashboard, DashboardTab } from './components/CustomerDashboard';
import { TransferWorkspace } from './components/TransferWorkspace';
import { TabEmasView } from './components/TabEmasView';
import { TransferBebasAssetMode } from './types/bank';
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
import {
  GlobalChatAndNotificationLayer,
  AllowNotificationFooterButton,
} from './components/GlobalChatAndNotificationLayer';
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
} from 'lucide-react';

function BankAppContent() {
  const { adminUnlocked, setAdminUnlocked, resetAllData, googleUser } = useBank();
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
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(() => Boolean(window.__gmpQuotaExceeded));

  useEffect(() => {
    const handler = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);

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

  // Show Google Sign-In -> Card Registration / Old Card Login Onboarding Gate at the start
  if ((!googleUser || !googleUser.hasCompletedOnboarding) && !adminViewDuringOnboarding) {
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
        <GoogleAuthOnboardingGate
          onOpenAdminPanel={() => {
            if (adminUnlocked) {
              setAdminViewDuringOnboarding(true);
            } else {
              setShowAdminPinModal(true);
            }
          }}
        />
        <AdminPinModal
          isOpen={showAdminPinModal}
          onSuccess={handleAdminAuthSuccess}
          onCancel={() => setShowAdminPinModal(false)}
        />
      </>
    );
  }

  if (adminViewDuringOnboarding && (!googleUser || !googleUser.hasCompletedOnboarding)) {
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
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === 'dashboard' && (
          <CustomerDashboard requestedSubTab={requestedDashboardTab} />
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
              setActiveView(tab);
            }}
            onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
          />
        )}
        {activeView === 'updates' && (
          <UpdateHistoryView
            onNavigateToView={(view) => setActiveView(view)}
            onOpenAdminUpdateManager={() => {
              if (adminUnlocked) {
                setActiveView('admin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                setShowAdminPinModal(true);
              }
            }}
          />
        )}
      </main>

      {/* Card Registration Modal (Accessible anytime) */}
      <CardRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />

      {/* Admin Authorization PIN Modal (Secret PIN: 159357 - Not revealed on screen) */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setShowAdminPinModal(false)}
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
              onClick={() => {
                if (confirm('Mulai ulang data dari awal / reset ke kondisi awal?')) resetAllData();
              }}
              className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Ulang dari Awal</span>
            </button>

            <span className="text-slate-800">•</span>

            {/* Tombol Izinkan Notifikasi tepat di sebelah tombol Panel Admin di paling bawah */}
            <AllowNotificationFooterButton />

            {/* Restricted Admin Panel Access Button (Scroll Paling Bawah) */}
            <button
              onClick={() => {
                if (adminUnlocked) {
                  setActiveView('admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  setShowAdminPinModal(true);
                }
              }}
              className="text-slate-400 hover:text-rose-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/40"
              title="Akses Terbatas Khusus Administrator (Butuh PIN)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>Panel Admin (Butuh PIN)</span>
            </button>
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
