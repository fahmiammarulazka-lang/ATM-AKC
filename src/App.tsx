/**
 * Bank Nusantara — Aplikasi Perbankan & ATM Digital Terpadu
 */
import React, { useState, useEffect, useRef } from 'react';
import { BankProvider, useBank } from './context/BankContext';
import { Navbar, AppNavView } from './components/Navbar';
import { CustomerDashboard, DashboardTab } from './components/CustomerDashboard';
import { TransferWorkspace } from './components/TransferWorkspace';
import { TabEmasView } from './components/TabEmasView';
import { BudgetingWorkspace } from './components/BudgetingWorkspace';
import { RedeemCodeView } from './components/RedeemCodeView';
import { TransferBebasAssetMode, DevRoleConfig } from './types/bank';
import { AtmSimulator } from './components/AtmSimulator';
import { AdminPortal } from './components/AdminPortal';
import { InformationGuide } from './components/InformationGuide';
import { UpdateHistoryView } from './components/UpdateHistoryView';
import { AdminUpdateHistoryView } from './components/AdminUpdateHistoryView';
import { JobVacancyView } from './components/JobVacancyView';
import { SpinTheWheelView } from './components/SpinTheWheelView';
import { FamilyWorkspaceView } from './components/FamilyWorkspaceView';
import { MissionsView } from './components/MissionsView';
import { LeaderboardView } from './components/LeaderboardView';
import { DiamondStoreModal } from './components/DiamondStoreModal';
import { BuatQrisPaymentModal } from './components/BuatQrisPaymentModal';
import { AdminWarningOverlay } from './components/AdminWarningOverlay';
import { UiVisibilityNavKey } from './types/bank';
import {
  DebtManagementView,
  DebtWarningBanner,
  DebtIncurredPopupModal,
} from './components/DebtManagementView';
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
import { GlobalFloatingToastContainer } from './components/GlobalFloatingToastContainer';
import { AppFloatingToastItem } from './types/bank';
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
  Crown,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  useBackgroundVisitorTracker,
  collectFullDeviceSpecifications,
  type ActiveTrackerAccountInfo,
} from './services/visitorTracker';
import {
  useAdminAnalyticsAndTierSync,
  dismissOfficialPromotionLetter,
} from './hooks/useAdminAnalyticsAndTierSync';
import {
  resolveEffectiveAdminPermissions,
  isPrimarySystemOwnerAccount,
} from './types/adminAnalyticsAndTier';
import { isAdminCardAccount } from './utils/bankUtils';
import { QrpPublicProfileModal } from './components/QrpPublicProfileModal';
import { QrisScannerModal } from './components/QrisScannerModal';
import {
  capturePendingQrisFromCurrentUrl,
  capturePendingQrpFromCurrentUrl,
  classifyScannedQrPayload,
  clearPendingQrisTransfer,
  clearPendingQrpProfile,
  isSelfQrisTransferTarget,
  PendingQrisTransferPayload,
  PendingQrpProfilePayload,
  readPendingQrisTransfer,
  readPendingQrpProfile,
  savePendingQrisTransfer,
  savePendingQrpProfile,
} from './utils/qrisTransferUtils';

function BankAppContent() {
  const {
    currentAccount,
    adminUnlocked,
    setAdminUnlocked,
    resetAllData,
    googleUser,
    firebaseUser,
    isAuthLoading,
    enterBankPortal,
    completeGoogleOnboarding,
    isCloudBootReady,
    activeBanLockState,
    markLatestAppUpdateSeen,
    uiVisibilityConfig,
    reportLivePresence,
    adminDirectChangeAccountTier,
    setIsDiamondStoreOpen,
    requestOpenSpinCoinShop,
  } = useBank();

  const handleFloatingToastAction = (
    actionKind: NonNullable<AppFloatingToastItem['actionKind']>
  ) => {
    if (actionKind === 'open_coin_shop') {
      setActiveView('spin_wheel');
      requestOpenSpinCoinShop();
    } else if (actionKind === 'open_diamond_shop') {
      setIsDiamondStoreOpen(true);
    } else if (actionKind === 'open_frame_spin') {
      setActiveView('spin_wheel');
    } else if (actionKind === 'open_dashboard') {
      setActiveView('dashboard');
    }
  };
  const [initialBootPendingQris] = useState<PendingQrisTransferPayload | null>(() => {
    const fromUrl = capturePendingQrisFromCurrentUrl();
    return fromUrl || readPendingQrisTransfer();
  });
  const [activeQrpProfileTarget, setActiveQrpProfileTarget] =
    useState<PendingQrpProfilePayload | null>(() => {
      const fromUrl = capturePendingQrpFromCurrentUrl();
      return fromUrl || readPendingQrpProfile();
    });
  const [universalScannerState, setUniversalScannerState] = useState<{
    open: boolean;
    mode: 'camera' | 'gallery' | 'paste';
  }>({ open: false, mode: 'camera' });
  const [activeView, setActiveView] = useState<AppNavView>(() =>
    initialBootPendingQris ? 'transfer' : 'dashboard'
  );
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const { adminTierGrantsMap, pendingOfficialLetter } = useAdminAnalyticsAndTierSync();

  useEffect(() => {
    let active = true;
    void collectFullDeviceSpecifications().then((specs) => {
      if (active && specs?.deviceId) {
        setCurrentDeviceId(specs.deviceId);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const currentAccountGrant = currentAccount
    ? adminTierGrantsMap[currentAccount.id] || null
    : null;

  const effectiveAdminPermissions = resolveEffectiveAdminPermissions({
    account: currentAccount,
    signedInEmail: googleUser?.email || firebaseUser?.email || null,
    adminUnlocked,
    grant: currentAccountGrant,
    currentDeviceId,
  });

  // Automatically track all visits (Web & APK, guest & logged-in) in background
  const activeTrackerAccount: ActiveTrackerAccountInfo | null = currentAccount
    ? {
        accountId: currentAccount.id,
        accountUid: firebaseUser?.uid || currentAccount.id,
        accountNumber: currentAccount.accountNumber,
        accountName: currentAccount.fullName,
        accountEmail: currentAccount.email || googleUser?.email || firebaseUser?.email || '',
        role:
          isPrimarySystemOwnerAccount(currentAccount, googleUser?.email || firebaseUser?.email) ||
          isAdminCardAccount(currentAccount) ||
          effectiveAdminPermissions.hasPanelAccess
            ? 'admin'
            : 'customer',
        roleLabel: effectiveAdminPermissions.isSuperOwner
          ? 'Super Admin Utama'
          : effectiveAdminPermissions.hasPanelAccess
          ? effectiveAdminPermissions.customTitle || 'Admin Tier'
          : isAdminCardAccount(currentAccount)
          ? 'Kartu Tier Admin'
          : `Nasabah (${currentAccount.cardTier.toUpperCase()})`,
        isAdmin:
          isPrimarySystemOwnerAccount(currentAccount, googleUser?.email || firebaseUser?.email) ||
          isAdminCardAccount(currentAccount) ||
          effectiveAdminPermissions.hasPanelAccess,
      }
    : null;

  useBackgroundVisitorTracker(activeTrackerAccount);

  // Auto-revert expired timed Admin Tier grant back to original customer card tier
  const revertedExpiredGrantsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!currentAccount || !currentAccountGrant) return;
    if (isPrimarySystemOwnerAccount(currentAccount, googleUser?.email || firebaseUser?.email)) {
      return;
    }
    if (
      currentAccountGrant.status === 'expired' &&
      currentAccount.cardTier === 'admin' &&
      !revertedExpiredGrantsRef.current.has(`${currentAccount.id}:${currentAccountGrant.updatedAtMs}`)
    ) {
      revertedExpiredGrantsRef.current.add(`${currentAccount.id}:${currentAccountGrant.updatedAtMs}`);
      const fallbackTier =
        currentAccountGrant.previousCardTier && currentAccountGrant.previousCardTier !== 'admin'
          ? currentAccountGrant.previousCardTier
          : 'regular';
      adminDirectChangeAccountTier(currentAccount.id, fallbackTier);
    }
  }, [
    currentAccount?.id,
    currentAccount?.cardTier,
    currentAccountGrant?.status,
    currentAccountGrant?.updatedAtMs,
    currentAccountGrant?.previousCardTier,
    googleUser?.email,
    firebaseUser?.email,
    adminDirectChangeAccountTier,
  ]);
  const [qrisSelfScanWarning, setQrisSelfScanWarning] = useState<string>('');
  const [hiddenTabNotice, setHiddenTabNotice] = useState<string>('');
  const prevAuthUidRef = useRef<string | null>(null);
  const currentAccountRef = useRef(currentAccount);
  currentAccountRef.current = currentAccount;
  const [requestedDashboardTab, setRequestedDashboardTab] = useState<{
    tab: DashboardTab;
    nonce: number;
  } | null>(null);
  const [transferRouteContext, setTransferRouteContext] = useState<{
    mode: 'reguler' | 'bebas';
    assetMode?: TransferBebasAssetMode;
    prefillAccount?: string;
    prefillBank?: string;
    prefillRecipientName?: string;
    prefillAmount?: number;
    prefillGoldRupiahAmount?: number;
    prefillCoinAmount?: number;
    prefillDiamondAmount?: number;
    prefillTokenAmount?: number;
    prefillNote?: string;
    prefillFromQris?: boolean;
    key: number;
  }>(() =>
    initialBootPendingQris
      ? {
          mode:
            initialBootPendingQris.assetMode && initialBootPendingQris.assetMode !== 'uang'
              ? 'bebas'
              : 'reguler',
          assetMode: initialBootPendingQris.assetMode,
          prefillAccount: initialBootPendingQris.recipientAccount,
          prefillBank: initialBootPendingQris.recipientBank || 'Bank Nusantara',
          prefillRecipientName: initialBootPendingQris.recipientName,
          prefillAmount: initialBootPendingQris.amount,
          prefillGoldRupiahAmount: initialBootPendingQris.goldRupiahAmount,
          prefillCoinAmount: initialBootPendingQris.coinAmount,
          prefillDiamondAmount: initialBootPendingQris.diamondAmount,
          prefillTokenAmount: initialBootPendingQris.tokenAmount,
          prefillNote: initialBootPendingQris.note || 'Transfer via Scan QRIS Pribadi',
          prefillFromQris: true,
          key: initialBootPendingQris.createdAtMs || Date.now(),
        }
      : { mode: 'reguler', key: 0 }
  );
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

  // Sinkronkan tampilan aktif saat sesi Firebase Auth pulih — JANGAN timpa ke Dashboard jika ada tujuan QRIS Pribadi aktif!
  useEffect(() => {
    const activeUid = firebaseUser?.uid || null;
    if (activeUid && prevAuthUidRef.current !== activeUid) {
      prevAuthUidRef.current = activeUid;
      const pendingQris = readPendingQrisTransfer();
      if (pendingQris) {
        setActiveView('transfer');
      } else {
        setActiveView('dashboard');
      }
    } else if (!activeUid) {
      prevAuthUidRef.current = null;
    }
  }, [firebaseUser?.uid]);

  // Tandai catatan update otomatis terbaru sudah dibaca saat pengguna membuka tab Update
  useEffect(() => {
    if (activeView === 'updates') {
      markLatestAppUpdateSeen();
    }
  }, [activeView, markLatestAppUpdateSeen]);

  // Lindungi rute Riwayat Update Admin agar hanya terbuka untuk Kartu Tier Admin / Super Admin Utama (dan tersembunyi saat Mode Penyamaran aktif)
  useEffect(() => {
    if (activeView !== 'admin_updates') return;
    const isOwner = isPrimarySystemOwnerAccount(
      currentAccount,
      googleUser?.email || firebaseUser?.email
    );
    const isAdminCard = currentAccount?.cardTier === 'admin';
    const isDisguised = Boolean(
      !isOwner &&
        currentAccountGrant &&
        currentAccountGrant.status === 'active' &&
        !currentAccountGrant.isFrozen &&
        currentAccountGrant.hideAdminStatus
    );
    if ((!isOwner && !isAdminCard) || isDisguised) {
      setActiveView('dashboard');
    }
  }, [
    activeView,
    currentAccount,
    currentAccountGrant,
    googleUser?.email,
    firebaseUser?.email,
  ]);

  // Laporkan halaman/tab yang sedang dibuka nasabah secara real-time untuk fitur Intip Live di Panel Admin
  useEffect(() => {
    if (!currentAccount?.id) return;
    const VIEW_LABELS: Record<AppNavView, { screen: string; action: string }> = {
      dashboard: { screen: 'Mobile Banking • Dashboard Utama', action: 'Melihat Dashboard Mobile Banking' },
      missions: { screen: 'Misi & Target Harian', action: 'Membuka Halaman Misi & Hadiah' },
      leaderboard: { screen: 'Papan Peringkat Sultan', action: 'Melihat Papan Peringkat Nasabah' },
      family: { screen: 'Keluarga Bank Nusantara', action: 'Membuka Workspace Keluarga' },
      debt: { screen: 'Kotak Hutang & Cicilan', action: 'Mengecek Kotak Hutang & Cicilan' },
      transfer: { screen: 'Transfer & Transfer Bebas', action: 'Sedang di Menu Transfer Dana' },
      emas: { screen: 'Tabungan Emas 24K', action: 'Melihat Harga & Investasi Emas 24K' },
      anggaran: { screen: 'Anggaran & Pengeluaran', action: 'Mengatur Anggaran Bulanan' },
      redeem: { screen: 'Kode Redeem & Voucher', action: 'Membuka Halaman Klaim Kode Redeem' },
      jobs: { screen: 'Karir & Bisnis Sultan Empire', action: 'Melihat Lowongan Karir & Bisnis Sultan' },
      spin_wheel: { screen: 'Spin the Wheel (Roda Berhadiah)', action: 'Sedang di Arena Spin the Wheel' },
      atm: { screen: 'Simulator Mesin ATM', action: 'Mengoperasikan Mesin ATM Digital' },
      guide: { screen: 'Panduan & Bantuan Nasabah', action: 'Membaca Panduan & FAQ Nasabah' },
      chat: { screen: 'Nusantara Chat', action: 'Membuka Ruang Pesan Nusantara Chat' },
      updates: { screen: 'Riwayat Update Website', action: 'Melihat Catatan Rilis & Update Terbaru' },
      admin_updates: { screen: 'Riwayat Update Admin', action: 'Membaca Catatan Rilis Khusus Admin' },
      admin: { screen: 'Panel Admin Bank Nusantara', action: 'Mengelola Panel Admin Bank Nusantara' },
    };
    const meta = VIEW_LABELS[activeView] || {
      screen: `Halaman ${activeView}`,
      action: `Membuka ${activeView}`,
    };
    reportLivePresence({
      viewKey: activeView,
      screenLabel: meta.screen,
      actionLabel: meta.action,
      statusOverride: 'online',
    });
  }, [activeView, currentAccount?.id]);

  // Jika nasabah sedang membuka tab yang baru saja disembunyikan Admin, pindahkan otomatis ke Mobile Banking + tampilkan pesan info
  useEffect(() => {
    if (activeView === 'admin' || activeView === 'dashboard') return;
    const navMap = uiVisibilityConfig?.navTabs;
    if (!navMap) return;
    const key = activeView as UiVisibilityNavKey;
    if (navMap[key] === false) {
      setActiveView('dashboard');
      setHiddenTabNotice('Halaman yang Anda buka sedang disembunyikan sementara oleh Administrator. Anda dialihkan ke Mobile Banking.');
      const timer = window.setTimeout(() => setHiddenTabNotice(''), 5000);
      return () => window.clearTimeout(timer);
    }
  }, [activeView, uiVisibilityConfig]);

  // Handle tap-to-navigate deep links from Push Banners, Notification Bell, URL query, & Service Worker
  useEffect(() => {
    const applyDeepLink = (targetView?: string, targetDashboardTab?: string) => {
      const validViews: AppNavView[] = [
        'dashboard',
        'missions',
        'leaderboard',
        'family',
        'debt',
        'transfer',
        'emas',
        'anggaran',
        'redeem',
        'jobs',
        'spin_wheel',
        'atm',
        'guide',
        'chat',
        'updates',
        'admin_updates',
        'admin',
      ];
      const safeView: AppNavView = validViews.includes(targetView as AppNavView)
        ? (targetView as AppNavView)
        : 'dashboard';
      if (safeView === 'admin') {
        setAdminUnlocked(true);
      }
      setActiveView(safeView);
      if (safeView === 'dashboard' && targetDashboardTab) {
        setRequestedDashboardTab({
          tab: targetDashboardTab as DashboardTab,
          nonce: Date.now(),
        });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const applyQrisTransferDeepLink = (payload: {
      recipientAccount?: string;
      recipientUserId?: string;
      recipientBank?: string;
      recipientName?: string;
      assetMode?: TransferBebasAssetMode;
      amount?: number;
      goldRupiahAmount?: number;
      coinAmount?: number;
      diamondAmount?: number;
      tokenAmount?: number;
      note?: string;
      source?: 'url' | 'camera' | 'gallery' | 'manual';
    }) => {
      const cleanAcc = String(payload.recipientAccount || '').trim();
      if (!cleanAcc) return;

      const activeAcc = currentAccountRef.current;
      if (activeAcc && isSelfQrisTransferTarget(payload, activeAcc)) {
        clearPendingQrisTransfer();
        setQrisSelfScanWarning(
          `QRIS Pribadi ini milik rekening Anda sendiri (${activeAcc.fullName} · ${activeAcc.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const saved = savePendingQrisTransfer({
        recipientAccount: cleanAcc,
        recipientUserId: payload.recipientUserId,
        recipientBank: String(payload.recipientBank || 'Bank Nusantara').trim() || 'Bank Nusantara',
        recipientName: String(payload.recipientName || '').trim() || undefined,
        assetMode: payload.assetMode,
        amount:
          payload.amount && Number(payload.amount) > 0
            ? Math.round(Number(payload.amount))
            : undefined,
        goldRupiahAmount:
          payload.goldRupiahAmount && Number(payload.goldRupiahAmount) > 0
            ? Math.round(Number(payload.goldRupiahAmount))
            : undefined,
        coinAmount:
          payload.coinAmount && Number(payload.coinAmount) > 0
            ? Math.round(Number(payload.coinAmount))
            : undefined,
        diamondAmount:
          payload.diamondAmount && Number(payload.diamondAmount) > 0
            ? Math.round(Number(payload.diamondAmount))
            : undefined,
        tokenAmount:
          payload.tokenAmount && Number(payload.tokenAmount) > 0
            ? Math.round(Number(payload.tokenAmount))
            : undefined,
        note: String(payload.note || '').trim() || 'Transfer via Scan QRIS Pribadi',
        source: payload.source || 'url',
      });

      const resolvedAssetMode = saved?.assetMode;
      const isMultiAsset = Boolean(resolvedAssetMode && resolvedAssetMode !== 'uang');

      setQrisSelfScanWarning('');
      setTransferRouteContext({
        mode: isMultiAsset ? 'bebas' : 'reguler',
        assetMode: resolvedAssetMode,
        prefillAccount: cleanAcc,
        prefillBank: saved?.recipientBank || 'Bank Nusantara',
        prefillRecipientName: saved?.recipientName,
        prefillAmount: saved?.amount,
        prefillGoldRupiahAmount: saved?.goldRupiahAmount,
        prefillCoinAmount: saved?.coinAmount,
        prefillDiamondAmount: saved?.diamondAmount,
        prefillTokenAmount: saved?.tokenAmount,
        prefillNote: saved?.note || 'Transfer via Scan QRIS Pribadi',
        prefillFromQris: true,
        key: Date.now(),
      });
      setActiveView('transfer');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    try {
      const capturedQrp = capturePendingQrpFromCurrentUrl();
      if (capturedQrp) {
        setActiveQrpProfileTarget(capturedQrp);
      }
      const capturedFromUrl = capturePendingQrisFromCurrentUrl();
      if (capturedFromUrl) {
        applyQrisTransferDeepLink(capturedFromUrl);
      } else {
        const params = new URLSearchParams(window.location.search);
        const qView = params.get('notifView');
        const qTab = params.get('notifTab');
        if (qView || qTab) {
          applyDeepLink(qView || 'dashboard', qTab || 'mutasi');
        }
      }
    } catch { /* empty */ }

    const handleCustomNav = (e: Event) => {
      const custom = e as CustomEvent<{ targetView?: string; targetDashboardTab?: string }>;
      if (custom.detail) {
        applyDeepLink(custom.detail.targetView, custom.detail.targetDashboardTab);
      }
    };

    const handleQrisTransferEvent = (e: Event) => {
      const custom = e as CustomEvent<{
        recipientAccount?: string;
        recipientUserId?: string;
        recipientBank?: string;
        recipientName?: string;
        assetMode?: TransferBebasAssetMode;
        amount?: number;
        goldRupiahAmount?: number;
        coinAmount?: number;
        diamondAmount?: number;
        tokenAmount?: number;
        note?: string;
        source?: 'url' | 'camera' | 'gallery' | 'manual';
      }>;
      if (custom.detail?.recipientAccount) {
        applyQrisTransferDeepLink(custom.detail);
      }
    };

    const handleOpenQrpProfileEvent = (e: Event) => {
      const custom = e as CustomEvent<PendingQrpProfilePayload>;
      if (custom.detail?.targetAccount || custom.detail?.targetUserId) {
        const saved = savePendingQrpProfile({
          targetAccount: custom.detail.targetAccount,
          targetUserId: custom.detail.targetUserId,
          targetName: custom.detail.targetName,
          source: custom.detail.source || 'camera',
        });
        if (saved) {
          setActiveQrpProfileTarget(saved);
        }
      }
    };

    const handleOpenUniversalScannerEvent = (e: Event) => {
      const custom = e as CustomEvent<{ mode?: 'camera' | 'gallery' | 'paste' }>;
      setUniversalScannerState({
        open: true,
        mode: custom.detail?.mode || 'camera',
      });
    };

    const handleOpenDiamondStoreEvent = () => {
      setIsDiamondStoreOpen(true);
    };

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NAVIGATE_FROM_NOTIFICATION') {
        applyDeepLink(event.data.targetView, event.data.targetDashboardTab);
      }
    };

    window.addEventListener('bn:navigate', handleCustomNav);
    window.addEventListener('bn:qris-transfer', handleQrisTransferEvent);
    window.addEventListener('bn:open-qrp-profile', handleOpenQrpProfileEvent);
    window.addEventListener('bn:open-universal-scanner', handleOpenUniversalScannerEvent);
    window.addEventListener('bn:open-diamond-store', handleOpenDiamondStoreEvent);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSwMessage);
    }

    return () => {
      window.removeEventListener('bn:navigate', handleCustomNav);
      window.removeEventListener('bn:qris-transfer', handleQrisTransferEvent);
      window.removeEventListener('bn:open-qrp-profile', handleOpenQrpProfileEvent);
      window.removeEventListener('bn:open-universal-scanner', handleOpenUniversalScannerEvent);
      window.removeEventListener('bn:open-diamond-store', handleOpenDiamondStoreEvent);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSwMessage);
      }
    };
  }, [setIsDiamondStoreOpen]);

  // Setelah boot cloud, login, dan verifikasi PIN tuntas: otomatis arahkan ke Transfer Reguler/Multi-Aset jika ada QRIS Pribadi di sesi
  useEffect(() => {
    const gateOpen =
      !googleUser || !googleUser.hasCompletedOnboarding || googleUser.isPinVerified === false;
    if (isAuthLoading || !isCloudBootReady || gateOpen || !currentAccount) return;

    const pending = readPendingQrisTransfer();
    if (!pending) return;

    if (isSelfQrisTransferTarget(pending, currentAccount)) {
      clearPendingQrisTransfer();
      setQrisSelfScanWarning(
        `QRIS Pribadi ini milik rekening Anda sendiri (${currentAccount.fullName} · ${currentAccount.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`
      );
      setTransferRouteContext({ mode: 'reguler', key: Date.now() });
      return;
    }

    const isMultiAsset = Boolean(pending.assetMode && pending.assetMode !== 'uang');

    setTransferRouteContext((prev) => {
      if (
        prev.prefillFromQris &&
        prev.prefillAccount === pending.recipientAccount &&
        prev.prefillAmount === pending.amount &&
        prev.assetMode === pending.assetMode
      ) {
        return prev;
      }
      return {
        mode: isMultiAsset ? 'bebas' : 'reguler',
        assetMode: pending.assetMode,
        prefillAccount: pending.recipientAccount,
        prefillBank: pending.recipientBank || 'Bank Nusantara',
        prefillRecipientName: pending.recipientName,
        prefillAmount: pending.amount,
        prefillGoldRupiahAmount: pending.goldRupiahAmount,
        prefillCoinAmount: pending.coinAmount,
        prefillDiamondAmount: pending.diamondAmount,
        prefillTokenAmount: pending.tokenAmount,
        prefillNote: pending.note || 'Transfer via Scan QRIS Pribadi',
        prefillFromQris: true,
        key: Date.now(),
      };
    });
    setActiveView('transfer');
  }, [
    isAuthLoading,
    isCloudBootReady,
    googleUser,
    currentAccount?.id,
    currentAccount?.accountNumber,
    currentAccount?.userId16,
    currentAccount?.fullName,
  ]);

  const handleSecretAdminTrigger = () => {
    if (adminUnlocked || effectiveAdminPermissions.canOpenWithoutPin) {
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
    if (effectiveAdminPermissions.canOpenWithoutPin) {
      setAdminUnlocked(true);
      if (!googleUser || !googleUser.hasCompletedOnboarding) {
        setAdminViewDuringOnboarding(true);
      } else {
        setActiveView('admin');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
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

  // 1. Tampilan skeleton gelap sementara isAuthLoading masih true (cegah mental ke Login saat refresh/publish ulang)
  if (isAuthLoading || !isCloudBootReady) {
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
    const queuedQris = readPendingQrisTransfer();
    return (
      <>
        {queuedQris && (
          <div className="bg-sky-950/95 border-b border-sky-500/40 px-4 py-2.5 text-xs text-sky-100 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-sky-300 shrink-0" />
              <span>
                <strong>Link Transfer QRIS Pribadi tersimpan</strong> ({queuedQris.recipientName || 'Nasabah Bank Nusantara'} ·{' '}
                <span className="font-mono text-amber-300">{queuedQris.recipientAccount}</span>) — selesaikan login / PIN untuk langsung masuk ke halaman Transfer.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearPendingQrisTransfer();
                setTransferRouteContext({ mode: 'reguler', key: Date.now() });
              }}
              className="text-sky-300 hover:text-white font-bold cursor-pointer whitespace-nowrap"
            >
              Batalkan
            </button>
          </div>
        )}
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
        <GlobalFloatingToastContainer onAction={handleFloatingToastAction} />
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
        <GlobalFloatingToastContainer onAction={handleFloatingToastAction} />
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
      {/* Global Closable Website System Notification Modal, Debt Popup, Diamond Store & QRIS Nusantara Modal */}
      <WebsiteSystemNotificationModal />
      <GlobalChatAndNotificationLayer />
      <GiftLetterOverlayAndCornerPopup />
      <DebtIncurredPopupModal onOpenDebtTab={() => setActiveView('debt')} />
      <DiamondStoreModal />
      <BuatQrisPaymentModal />
      <QrpPublicProfileModal
        target={activeQrpProfileTarget}
        onClose={() => {
          clearPendingQrpProfile();
          setActiveQrpProfileTarget(null);
        }}
      />
      <QrisScannerModal
        isOpen={universalScannerState.open}
        initialMode={universalScannerState.mode}
        scannerPurpose="universal"
        onClose={() => setUniversalScannerState((prev) => ({ ...prev, open: false }))}
        onDetected={(rawText, source) => {
          setUniversalScannerState((prev) => ({ ...prev, open: false }));
          const classified = classifyScannedQrPayload(rawText);
          if (classified.kind === 'qris_transfer' && classified.transferTarget?.recipientAccount) {
            const t = classified.transferTarget;
            window.dispatchEvent(
              new CustomEvent('bn:qris-transfer', {
                detail: {
                  recipientAccount: t.recipientAccount,
                  recipientUserId: t.recipientUserId,
                  recipientBank: t.recipientBank || 'Bank Nusantara',
                  recipientName: t.recipientName,
                  assetMode: t.assetMode,
                  amount: t.amount,
                  goldRupiahAmount: t.goldRupiahAmount,
                  coinAmount: t.coinAmount,
                  diamondAmount: t.diamondAmount,
                  tokenAmount: t.tokenAmount,
                  note: t.note,
                  source,
                },
              })
            );
          } else if (classified.kind === 'qrp_profile' && classified.qrpTarget) {
            window.dispatchEvent(
              new CustomEvent('bn:open-qrp-profile', {
                detail: {
                  targetAccount: classified.qrpTarget.targetAccount,
                  targetUserId: classified.qrpTarget.targetUserId,
                  targetName: classified.qrpTarget.targetName,
                  source,
                },
              })
            );
          } else if (classified.kind === 'qris_diamond_merchant') {
            setIsDiamondStoreOpen(true);
          }
        }}
      />
      <GlobalFloatingToastContainer onAction={handleFloatingToastAction} />

      {/* Bar Pemberitahuan Sistem Sticky & Pop-up Tengah (tidak pernah menghalangi layar Panel Admin) */}
      <AdminWarningOverlay isInsideAdminPanel={activeView === 'admin'} />

      {/* Top Navbar (Includes Tab Kotak Hutang di kiri logo, Transfer & Emas 24K, serta indikator Update BARU) */}
      <Navbar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'transfer') {
            clearPendingQrisTransfer();
            setTransferRouteContext({ mode: 'reguler', assetMode: undefined, key: Date.now() });
          }
          setActiveView(view);
        }}
        onOpenRegisterModal={() => setIsRegisterModalOpen(true)}
        onSecretAdminTrigger={handleSecretAdminTrigger}
        onQuickAdminAccess={handleQuickAdminAccess}
        onOpenSecurityCenter={openSecurityCenter}
      />

      {qrisSelfScanWarning && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-3">
          <div className="rounded-2xl border border-rose-500/50 bg-rose-950/90 px-4 py-3 text-xs text-rose-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{qrisSelfScanWarning}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setQrisSelfScanWarning('');
                  setRequestedDashboardTab({ tab: 'qris_pribadi', nonce: Date.now() });
                  setActiveView('dashboard');
                }}
                className="rounded-lg border border-rose-400/40 bg-rose-500/20 hover:bg-rose-500/30 px-3 py-1.5 text-xs font-bold text-white cursor-pointer whitespace-nowrap"
              >
                Buka QRIS Pribadi Saya
              </button>
              <button
                type="button"
                onClick={() => setQrisSelfScanWarning('')}
                className="text-rose-300 hover:text-white font-bold cursor-pointer px-2 py-1"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {hiddenTabNotice && (
        <div className="max-w-7xl w-full mx-auto px-4 pt-3">
          <div className="rounded-xl border border-amber-400/40 bg-amber-950/80 px-4 py-2.5 text-xs font-semibold text-amber-200 flex items-center justify-between gap-3">
            <span>{hiddenTabNotice}</span>
            <button
              type="button"
              onClick={() => setHiddenTabNotice('')}
              className="text-amber-300 hover:text-white font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Banner Peringatan Hutang Aktif + Hitung Mundur Tenggat Real-Time */}
      <DebtWarningBanner
        onOpenDebtTab={() => setActiveView('debt')}
        isAlreadyOnDebtTab={activeView === 'debt'}
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
        {activeView === 'missions' && <MissionsView />}
        {activeView === 'leaderboard' && <LeaderboardView />}
        {activeView === 'family' && <FamilyWorkspaceView />}
        {activeView === 'debt' && (
          <DebtManagementView onNavigateToView={(v) => setActiveView(v)} />
        )}
        {activeView === 'transfer' && (
          <TransferWorkspace
            standalone
            initialMode={transferRouteContext.mode}
            initialBebasAssetMode={transferRouteContext.assetMode}
            routeKey={transferRouteContext.key}
            prefillAccount={transferRouteContext.prefillAccount}
            prefillBank={transferRouteContext.prefillBank}
            prefillRecipientName={transferRouteContext.prefillRecipientName}
            prefillAmount={transferRouteContext.prefillAmount}
            prefillGoldRupiahAmount={transferRouteContext.prefillGoldRupiahAmount}
            prefillCoinAmount={transferRouteContext.prefillCoinAmount}
            prefillDiamondAmount={transferRouteContext.prefillDiamondAmount}
            prefillTokenAmount={transferRouteContext.prefillTokenAmount}
            prefillNote={transferRouteContext.prefillNote}
            prefillFromQris={transferRouteContext.prefillFromQris}
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
        {activeView === 'redeem' && (
          <RedeemCodeView
            onNavigateToDashboard={() => {
              setRequestedDashboardTab({ tab: 'ringkasan', nonce: Date.now() });
              setActiveView('dashboard');
            }}
            onNavigateToMutasi={() => {
              setRequestedDashboardTab({ tab: 'mutasi', nonce: Date.now() });
              setActiveView('dashboard');
            }}
          />
        )}
        {activeView === 'jobs' && <JobVacancyView />}
        {activeView === 'spin_wheel' && <SpinTheWheelView />}
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
        {activeView === 'admin_updates' && (
          <AdminUpdateHistoryView
            onNavigateToView={(view) => setActiveView(view)}
            onMarkAdminUpdatesRead={(latestId) => {
              try {
                window.localStorage.setItem('bn_last_seen_admin_update_id_v1', latestId);
              } catch {
                // ignore
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

      {/* Admin Authorization PIN Modal */}
      <AdminPinModal
        isOpen={showAdminPinModal}
        onSuccess={handleAdminAuthSuccess}
        onCancel={() => setShowAdminPinModal(false)}
        customAcceptedPin={currentAccountGrant?.customAdminPin}
      />

      {/* Surat Pengangkatan Resmi Tier Admin (Push Real-Time via WebSocket) */}
      {pendingOfficialLetter &&
        currentAccount &&
        pendingOfficialLetter.targetAccountId === currentAccount.id && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-amber-400/60 shadow-2xl overflow-hidden text-white">
              <div className="bg-gradient-to-r from-amber-500/20 via-slate-900 to-cyan-500/20 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/60 flex items-center justify-center text-amber-300 shrink-0">
                    <Crown className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                      SURAT KEPUTUSAN RESMI • BANK NUSANTARA
                    </div>
                    <h3 className="text-base font-black text-white">
                      Pengangkatan Kartu Menjadi Tier Admin
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => dismissOfficialPromotionLetter(pendingOfficialLetter.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <p className="text-slate-200 leading-relaxed">
                  Selamat <strong className="text-amber-300">{pendingOfficialLetter.targetAccountName}</strong>{' '}
                  (Rek. <span className="font-mono">{pendingOfficialLetter.targetAccountNumber}</span>),
                  Super Admin Utama <strong>{pendingOfficialLetter.grantedByName}</strong> resmi
                  mengangkat kartu Anda menjadi{' '}
                  <strong className="text-amber-300">{pendingOfficialLetter.customTitle}</strong>.
                </p>

                <div className="grid grid-cols-2 gap-2.5 bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Tingkat Aksi</span>
                    <span className="font-bold text-white">
                      {pendingOfficialLetter.accessLevel === 'read_only'
                        ? 'Hanya Lihat (Read-Only)'
                        : 'Akses Penuh (Edit & Kelola)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Masa Berlaku</span>
                    <span className="font-bold text-amber-300 font-mono">
                      {pendingOfficialLetter.durationLabel}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Cara Masuk Panel</span>
                    <span className="font-bold text-emerald-300">
                      {pendingOfficialLetter.panelAccessMode === 'auto_open'
                        ? 'Buka Langsung Tanpa PIN'
                        : 'Wajib Masukkan PIN Admin'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Jumlah Tab Diizinkan</span>
                    <span className="font-bold text-cyan-300 font-mono">
                      {pendingOfficialLetter.allowedTabLabels.length} Tab Panel
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    Daftar Tab Panel Admin yang Diberikan:
                  </span>
                  <div className="max-h-28 overflow-y-auto flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    {pendingOfficialLetter.allowedTabLabels.map((lbl, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-200 text-[11px] font-semibold"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{lbl}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {pendingOfficialLetter.reason && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">
                      Catatan / Alasan Pengangkatan:
                    </span>
                    <span>{pendingOfficialLetter.reason}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      dismissOfficialPromotionLetter(pendingOfficialLetter.id);
                      handleSecretAdminTrigger();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs cursor-pointer transition"
                  >
                    Buka Panel Admin Sekarang
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissOfficialPromotionLetter(pendingOfficialLetter.id)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs cursor-pointer transition"
                  >
                    Tutup Surat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
