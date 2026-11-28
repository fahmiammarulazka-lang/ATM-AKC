import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
  Coins,
  TrendingUp,
  Briefcase,
  Users,
  Lock,
  Unlock,
  LogOut,
  Cloud,
  CheckCircle2,
  Calendar,
  CreditCard,
  Award,
  PiggyBank,
  Landmark,
  AlertCircle,
  Shield,
  RefreshCw,
  CloudOff,
  AlertTriangle,
  Eye,
  EyeOff,
  Pencil,
  Flame,
  Trophy,
  BarChart3,
  UserCheck,
  QrCode,
  Download,
  FileSpreadsheet,
  Printer,
  Send,
  MessageSquare,
  Smartphone,
  Plus,
  Trash2,
  KeyRound,
  History,
  MapPin,
  Sparkles,
  ArrowRight,
  Snowflake,
  Crown,
  Gift,
  Infinity as InfinityIcon,
  Layers,
  Target,
  Zap,
  ArrowLeftRight,
  LogIn,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  formatRupiah,
  formatCompactRupiah,
  formatAssetCount,
  isAdminCardAccount,
  formatUserId16Display,
  formatAccountNumberDisplay,
  formatPhoneDisplay,
  isUnlimitedNumber,
  CARD_TIER_CONFIGS,
} from '../utils/bankUtils';
import { computeAccountTopLeaderboardBadges } from '../utils/leaderboardUtils';
import { DiamondIcon } from './DiamondIcon';
import { TopLeaderboardBadges } from './TopLeaderboardBadges';
import { ProfileAvatarBadge } from './ProfileAvatarBadge';
import { useFrameMotionMode } from '../utils/frameMotionPreference';
import {
  AVATAR_FRAMES,
  SPIN_AURA_FRAMES,
  AVATAR_PRESETS,
  FEATURED_TITLES,
  PROFILE_RENAME_DIAMOND_COST,
  getFeaturedTitleById,
} from '../data/profileCustomizationCatalog';
import {
  PROFILE_ACHIEVEMENTS,
  PROFILE_ACHIEVEMENT_CATEGORY_LABELS,
  PROFILE_ACHIEVEMENT_TIER_META,
  ProfileAchievementCategory,
  computeProfileAchievementMetrics,
  evaluateProfileAchievements,
  isTitleUnlockedForAccount,
} from '../data/profileAchievementsCatalog';
import {
  MAX_REGULAR_ACCOUNT_LEVEL,
  formatMilestoneRewardSummary,
  getAccountLevelSnapshot,
  normalizeAccountLevelSystemConfig,
} from '../data/levelSystemCatalog';
import { DevRoleConfig } from '../types/bank';
import { QrisScannerModal } from './QrisScannerModal';
import { parseQrpProfilePayload } from '../utils/qrisTransferUtils';

type ProfileTabKey = 'ringkasan' | 'identitas' | 'aksi_favorit' | 'keamanan' | 'achievement';

interface UserProfileStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuickAdminAccess?: (role: DevRoleConfig) => void;
  onOpenSecurityCenter?: (section?: 'identity' | 'telemetry' | 'timemachine' | 'audit') => void;
  onNavigateView?: (view: 'dashboard' | 'emas' | 'chat') => void;
}

interface AdaptiveRupiahProps {
  amount: number;
  isUnlimited?: boolean;
  className?: string;
}

const AdaptiveRupiah: React.FC<AdaptiveRupiahProps> = ({
  amount,
  isUnlimited = false,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fullMeasureRef = useRef<HTMLSpanElement | null>(null);
  const [useCompact, setUseCompact] = useState(false);

  const fullText = isUnlimited ? '∞' : formatRupiah(amount);
  const compactText = isUnlimited ? '∞' : formatCompactRupiah(amount);

  useLayoutEffect(() => {
    const containerEl = containerRef.current;
    const measureEl = fullMeasureRef.current;
    if (!containerEl || !measureEl) return;

    const evaluateFit = () => {
      const availableWidth = containerEl.clientWidth;
      const neededWidth = measureEl.scrollWidth;
      if (availableWidth > 0) {
        setUseCompact(neededWidth > availableWidth - 2);
      }
    };

    evaluateFit();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => evaluateFit());
      observer.observe(containerEl);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', evaluateFit);
    return () => window.removeEventListener('resize', evaluateFit);
  }, [fullText]);

  const displayedText = useCompact ? compactText : fullText;

  return (
    <div ref={containerRef} className="relative w-full min-w-0" title={fullText}>
      <span
        ref={fullMeasureRef}
        aria-hidden="true"
        className={`invisible absolute left-0 top-0 pointer-events-none whitespace-nowrap ${className}`}
      >
        {fullText}
      </span>
      <span className={`block break-words leading-snug ${className}`}>{displayedText}</span>
    </div>
  );
};

export const UserProfileStatsModal: React.FC<UserProfileStatsModalProps> = ({
  isOpen,
  onClose,
  onQuickAdminAccess,
  onOpenSecurityCenter,
  onNavigateView,
}) => {
  const {
    currentAccount,
    accounts,
    googleUser,
    transactions,
    pockets,
    dreamPockets,
    depositos,
    families,
    familyConfig,
    devRoles,
    loyaltyMap,
    leaderboardConfig,
    goldMarketConfig,
    favorites,
    addFavorite,
    deleteFavorite,
    lookupAccount,
    syncTelemetry,
    forceSyncCloudNow,
    linkCurrentAccountWithGooglePopup,
    logoutGoogle,
    recentQuickSwitchAccounts,
    startQuickAccountSwitchToLobby,
    quickSwitchToSavedAccount,
    removeSavedQuickSwitchAccount,
    toggleHideSensitiveNumbers,
    renameAccountWithDiamond,
    updateAccountProfileDetails,
    equipSpinAvatarFrame,
    changePin,
    toggleCardFreezeWithPin,
    setIsDiamondStoreOpen,
    missionProgressByAccount,
    qrisOrders,
    frameSpinHistory,
    globalChats,
    chats,
    claimProfileAchievement,
    claimAllReadyProfileAchievements,
    levelSystemConfig,
    syncAccountInitialLevelFromHistory,
    claimPendingSyncLevelRewards,
  } = useBank();

  const [frameMotionMode, setFrameMotionMode] = useFrameMotionMode();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>('ringkasan');
  const [copiedField, setCopiedField] = useState<'id16' | 'rekening' | 'qris' | null>(null);
  const [isQuickSyncing, setIsQuickSyncing] = useState(false);
  const [googleLinkStatus, setGoogleLinkStatus] = useState<{
    loading: boolean;
    message: string;
    isError?: boolean;
  }>({ loading: false, message: '' });

  // State Popup Ganti Nama (50 Diamond)
  const [showRenamePopup, setShowRenamePopup] = useState(false);
  // State Popup Ganti Akun Cepat (Maks. 5 Akun Terverifikasi Terakhir)
  const [showQuickSwitchPopup, setShowQuickSwitchPopup] = useState(false);
  const [quickSwitchFeedback, setQuickSwitchFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [renameFeedback, setRenameFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    insufficientDiamonds?: boolean;
  } | null>(null);

  // State Tab Identitas & Kartu Nama Digital
  const [bioDraft, setBioDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [cityDraft, setCityDraft] = useState('');
  const [avatarPresetDraft, setAvatarPresetDraft] = useState('');
  const [avatarFrameDraft, setAvatarFrameDraft] = useState('frame-clean');
  const [featuredTitleDraft, setFeaturedTitleDraft] = useState('');
  const [identityFeedback, setIdentityFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [personalQrUrl, setPersonalQrUrl] = useState<string>('');
  const [isQrpScannerOpen, setIsQrpScannerOpen] = useState<boolean>(false);

  // State Tab Aksi & Favorit
  const [favAccNum, setFavAccNum] = useState('');
  const [favOwnerName, setFavOwnerName] = useState('');
  const [favBankName, setFavBankName] = useState('Bank Nusantara');
  const [favAlias, setFavAlias] = useState('');
  const [favFeedback, setFavFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [exportFeedback, setExportFeedback] = useState<string>('');

  // State Tab Keamanan & PIN
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [freezePinInput, setFreezePinInput] = useState('');
  const [freezeFeedback, setFreezeFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // State Tab Achievement & Level XP
  const [achCategoryFilter, setAchCategoryFilter] = useState<'all' | ProfileAchievementCategory>('all');
  const [achStatusFilter, setAchStatusFilter] = useState<'all' | 'ready' | 'claimed' | 'locked'>('all');
  const [achievementFeedback, setAchievementFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [levelSyncFeedback, setLevelSyncFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Sinkronisasi draft ketika modal dibuka atau akun berganti
  useEffect(() => {
    if (!isOpen || !currentAccount) return;
    setBioDraft(currentAccount.profileBio || '');
    setPhoneDraft(currentAccount.phone || '');
    setEmailDraft(currentAccount.email || currentAccount.googleEmail || '');
    setCityDraft(currentAccount.city || '');
    setAvatarPresetDraft(currentAccount.avatarPresetId || '');
    setAvatarFrameDraft(currentAccount.avatarFrameId || 'frame-clean');
    const validFeaturedTitle =
      currentAccount.featuredTitle &&
      isTitleUnlockedForAccount(currentAccount, currentAccount.featuredTitle)
        ? currentAccount.featuredTitle
        : '';
    setFeaturedTitleDraft(validFeaturedTitle);
    if (currentAccount.featuredTitle && !validFeaturedTitle) {
      updateAccountProfileDetails({ featuredTitle: '' });
    }
    if (!currentAccount.levelSyncInitialized) {
      syncAccountInitialLevelFromHistory(currentAccount.id);
    }
    setRenameInput(currentAccount.fullName);
    setRenameFeedback(null);
    setIdentityFeedback(null);
    setFavFeedback(null);
    setPinFeedback(null);
    setFreezeFeedback(null);
    setAchievementFeedback(null);
    setLevelSyncFeedback(null);
    setExportFeedback('');
  }, [isOpen, currentAccount?.id]);

  // Link QRP (QR Profil Statistik Umum Publik — Tanpa membocorkan Saldo)
  const personalQrLink = useMemo(() => {
    if (!currentAccount) return '';
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://banknusantara.app';
    const params = new URLSearchParams();
    params.set('qrp_profile', '1');
    params.set('acc', currentAccount.accountNumber);
    params.set('uid', currentAccount.userId16 || currentAccount.accountNumber);
    params.set('name', currentAccount.fullName);
    params.set('bank', 'Bank Nusantara');
    return `${origin}/?${params.toString()}`;
  }, [currentAccount]);

  useEffect(() => {
    if (!isOpen || !personalQrLink) return;
    let active = true;
    void QRCode.toDataURL(personalQrLink, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (active) setPersonalQrUrl(url);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, personalQrLink]);

  const stats = useMemo(() => {
    if (!currentAccount) return null;
    const myTxs = transactions.filter((t) => t.accountId === currentAccount.id);
    const incomeTypes = new Set([
      'setor',
      'transfer_in',
      'transfer_bebas_in',
      'pinjaman_disburse',
      'redeem_code',
      'jual_emas',
    ]);
    const totalIncome = myTxs
      .filter((t) => incomeTypes.has(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const totalExpense = myTxs
      .filter((t) => !incomeTypes.has(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Arus kas bulan ini (WIB / YYYY-MM)
    const nowMonthKey = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 7);
    const thisMonthTxs = myTxs.filter((t) => {
      if (!t.timestamp) return false;
      const d = new Date(t.timestamp);
      if (Number.isNaN(d.getTime())) return false;
      const txMonth = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }).slice(0, 7);
      return txMonth === nowMonthKey;
    });
    const monthlyIncome = thisMonthTxs
      .filter((t) => incomeTypes.has(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const monthlyExpense = thisMonthTxs
      .filter((t) => !incomeTypes.has(t.type))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const monthlyPeak = Math.max(1, monthlyIncome, monthlyExpense);

    const myPockets = pockets.filter((p) => p.accountId === currentAccount.id);
    const totalPocketSaved = myPockets.reduce((sum, p) => sum + (Number(p.currentAmount) || 0), 0);
    const totalPocketTarget = myPockets.reduce((sum, p) => sum + (Number(p.targetAmount) || 0), 0);
    const pocketProgressPct =
      totalPocketTarget > 0 ? Math.min(100, Math.round((totalPocketSaved / totalPocketTarget) * 100)) : 0;

    const myDreamPockets = dreamPockets.filter((dp) => dp.accountId === currentAccount.id);
    const totalDreamSaved = myDreamPockets.reduce((sum, dp) => sum + (Number(dp.currentAmount) || 0), 0);
    const totalDreamTarget = myDreamPockets.reduce((sum, dp) => sum + (Number(dp.targetAmount) || 0), 0);
    const dreamProgressPct =
      totalDreamTarget > 0 ? Math.min(100, Math.round((totalDreamSaved / totalDreamTarget) * 100)) : 0;

    const myDepositos = depositos.filter((d) => d.accountId === currentAccount.id);
    const totalDeposito = myDepositos.reduce((sum, d) => sum + (Number(d.principalAmount) || 0), 0);

    const goldGrams = Number(currentAccount.goldGrams) || 0;
    const goldPricePerGram =
      currentAccount.customUserGoldPricePerGram && currentAccount.customUserGoldPricePerGram > 0
        ? currentAccount.customUserGoldPricePerGram
        : goldMarketConfig?.currentPricePerGram || 1_450_000;
    const goldValuation = Math.round(goldGrams * goldPricePerGram);

    const myFamilies = families.filter((f) =>
      f.members.some((m) => m.accountId === currentAccount.id)
    );
    const ownedFamilies = myFamilies.filter((f) => f.ownerAccountId === currentAccount.id);
    const maxFamilySlots =
      (familyConfig?.defaultMaxFamilies || 1) + (currentAccount.extraFamilySlots || 0);

    const tierMeta = CARD_TIER_CONFIGS[currentAccount.cardTier] || CARD_TIER_CONFIGS.regular;
    const dailyLimit =
      currentAccount.customSpendingLimit || tierMeta.dailyWithdrawalLimit || 5_000_000;
    const dailyUsed = currentAccount.dailyWithdrawnToday || 0;
    const dailyLimitPct = isUnlimitedNumber(dailyLimit)
      ? 0
      : Math.min(100, Math.round((dailyUsed / Math.max(1, dailyLimit)) * 100));

    const isAdminForLevel = isAdminCardAccount(currentAccount);
    const currentLevel = isAdminForLevel ? 999_999_999_999_999 : Math.max(1, currentAccount.jobLevel || 1);
    const levelProgressPct =
      isAdminForLevel || isUnlimitedNumber(currentLevel)
        ? 100
        : Math.min(100, Math.round((currentLevel / 50) * 100));

    const loyaltyState = loyaltyMap[currentAccount.id];
    const streakDays = loyaltyState?.streakDays || 0;
    const freezeStage = loyaltyState?.freezeStage || 0;
    const loyaltyPoints = loyaltyState?.points || 0;
    const recoveryCards = loyaltyState?.recoveryCards || 0;

    const leaderboardRanks = computeAccountTopLeaderboardBadges(
      currentAccount.id,
      accounts,
      leaderboardConfig,
      transactions
    );

    return {
      txCount: myTxs.length,
      recentTxs: myTxs.slice(0, 25),
      totalIncome,
      totalExpense,
      monthlyIncome,
      monthlyExpense,
      monthlyTxCount: thisMonthTxs.length,
      monthlyPeak,
      nowMonthLabel: new Date().toLocaleDateString('id-ID', {
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }),
      pocketCount: myPockets.length,
      totalPocketSaved,
      totalPocketTarget,
      pocketProgressPct,
      dreamCount: myDreamPockets.length,
      totalDreamSaved,
      totalDreamTarget,
      dreamProgressPct,
      depositoCount: myDepositos.length,
      totalDeposito,
      goldGrams,
      goldPricePerGram,
      goldValuation,
      myFamilies,
      ownedFamiliesCount: ownedFamilies.length,
      maxFamilySlots,
      dailyLimit,
      dailyUsed,
      dailyLimitPct,
      currentLevel,
      levelProgressPct,
      tierLabel: tierMeta.name,
      streakDays,
      freezeStage,
      loyaltyPoints,
      recoveryCards,
      leaderboardRanks,
    };
  }, [
    currentAccount,
    accounts,
    transactions,
    pockets,
    dreamPockets,
    depositos,
    families,
    familyConfig,
    goldMarketConfig,
    loyaltyMap,
    leaderboardConfig,
  ]);

  const achievementBundle = useMemo(() => {
    if (!currentAccount) return null;
    const goldPrice =
      currentAccount.customUserGoldPricePerGram && currentAccount.customUserGoldPricePerGram > 0
        ? currentAccount.customUserGoldPricePerGram
        : goldMarketConfig?.currentPricePerGram || 1_450_000;
    const metrics = computeProfileAchievementMetrics({
      account: currentAccount,
      transactions,
      pockets,
      dreamPockets,
      depositos,
      families,
      loyaltyState: loyaltyMap[currentAccount.id],
      missionProgressByAccount: missionProgressByAccount?.[currentAccount.id],
      qrisOrders,
      frameSpinHistory,
      globalChats,
      privateChats: chats,
      goldPricePerGram: goldPrice,
    });
    return evaluateProfileAchievements(metrics, currentAccount.profileAchievementClaims);
  }, [
    currentAccount,
    transactions,
    pockets,
    dreamPockets,
    depositos,
    families,
    loyaltyMap,
    missionProgressByAccount,
    qrisOrders,
    frameSpinHistory,
    globalChats,
    chats,
    goldMarketConfig,
  ]);

  const accountLevelSnapshot = useMemo(
    () => getAccountLevelSnapshot(currentAccount),
    [currentAccount]
  );

  const normalizedLevelCfg = useMemo(
    () => normalizeAccountLevelSystemConfig(levelSystemConfig),
    [levelSystemConfig]
  );

  if (!isOpen || !currentAccount || !stats || !achievementBundle) return null;

  const activeDevRole = currentAccount.devRoleId
    ? devRoles.find((r) => r.id === currentAccount.devRoleId) || null
    : null;

  const isGoogleLinked = Boolean(
    currentAccount.googleEmail || (googleUser?.email && !googleUser.email.endsWith('@guest.local'))
  );
  const displayEmail =
    currentAccount.googleEmail || currentAccount.email || googleUser?.email || 'Belum terhubung';
  const isAdminCard = isAdminCardAccount(currentAccount);
  const isUnlimitedBal = isAdminCard || isUnlimitedNumber(currentAccount.balance);
  const isPrivacyMasked = Boolean(currentAccount.hideSensitiveNumbers);
  const totalDiamondText = formatAssetCount(currentAccount.diamonds || 0, { isAdmin: isAdminCard });
  const activeFeaturedTitle =
    currentAccount.featuredTitle &&
    isTitleUnlockedForAccount(currentAccount, currentAccount.featuredTitle)
      ? getFeaturedTitleById(currentAccount.featuredTitle)
      : undefined;
  const renameHistory = currentAccount.nameChangeHistory || [];
  const pendingLevelSyncCount = (currentAccount.pendingSyncLevelRewardLevels || []).length;
  const unlockedTitlesCount = FEATURED_TITLES.filter((t) =>
    isTitleUnlockedForAccount(currentAccount, t.id)
  ).length;

  const handleQuickSyncCloud = async () => {
    if (isQuickSyncing) return;
    setIsQuickSyncing(true);
    try {
      await forceSyncCloudNow();
    } finally {
      window.setTimeout(() => setIsQuickSyncing(false), 300);
    }
  };

  const syncBusy = isQuickSyncing || syncTelemetry.status === 'syncing';
  const lastSyncTimeText = (() => {
    if (!syncTelemetry.lastSyncedAt) return 'Belum tercatat';
    const d = new Date(syncTelemetry.lastSyncedAt);
    if (Number.isNaN(d.getTime())) return 'Belum tercatat';
    return d.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  })();

  const handleCopy = (field: 'id16' | 'rekening' | 'qris', value: string) => {
    try {
      void navigator.clipboard.writeText(value);
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1800);
    } catch {
      // ignore clipboard restriction
    }
  };

  const handleLinkGoogle = async () => {
    setGoogleLinkStatus({ loading: true, message: '' });
    const res = await linkCurrentAccountWithGooglePopup(currentAccount.id);
    setGoogleLinkStatus({
      loading: false,
      message: res.message,
      isError: !res.success,
    });
  };

  const handleLogout = () => {
    onClose();
    logoutGoogle();
  };

  const otherSavedSwitchAccounts = useMemo(
    () => recentQuickSwitchAccounts.filter((item) => item.accountId !== currentAccount.id),
    [recentQuickSwitchAccounts, currentAccount.id]
  );

  const handleOpenQuickAccountSwitch = () => {
    setQuickSwitchFeedback(null);
    // Jika belum ada akun lain yang pernah terverifikasi di perangkat ini -> langsung ke Lobi dengan tombol Kembali di pojok kiri atas
    if (otherSavedSwitchAccounts.length === 0) {
      onClose();
      startQuickAccountSwitchToLobby();
      return;
    }
    setShowQuickSwitchPopup(true);
  };

  const handleQuickSwitchToAccount = (targetAccountId: string) => {
    if (targetAccountId === currentAccount.id) {
      setShowQuickSwitchPopup(false);
      return;
    }
    const res = quickSwitchToSavedAccount(targetAccountId);
    if (res.success) {
      setShowQuickSwitchPopup(false);
      onClose();
    } else {
      setQuickSwitchFeedback({ type: 'error', text: res.message });
    }
  };

  const handleGoToLobbyForOtherAccount = () => {
    setShowQuickSwitchPopup(false);
    onClose();
    startQuickAccountSwitchToLobby();
  };

  const handleOpenRenamePopup = () => {
    setRenameInput(currentAccount.fullName);
    setRenameFeedback(null);
    setShowRenamePopup(true);
  };

  const handleConfirmRenamePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    const res = renameAccountWithDiamond(renameInput);
    if (res.success) {
      setRenameFeedback({ type: 'success', text: res.message });
      window.setTimeout(() => {
        setShowRenamePopup(false);
      }, 1100);
    } else {
      setRenameFeedback({
        type: 'error',
        text: res.message,
        insufficientDiamonds: res.insufficientDiamonds,
      });
    }
  };

  const handleSaveIdentityDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateAccountProfileDetails({
      profileBio: bioDraft,
      phone: phoneDraft,
      email: emailDraft,
      city: cityDraft,
      avatarPresetId: avatarPresetDraft,
      avatarFrameId: avatarFrameDraft,
      featuredTitle: featuredTitleDraft,
    });
    setIdentityFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleQuickSaveAppearance = (
    nextPresetId?: string,
    nextFrameId?: string,
    nextTitleId?: string
  ) => {
    const res = updateAccountProfileDetails({
      avatarPresetId: nextPresetId ?? avatarPresetDraft,
      avatarFrameId: nextFrameId ?? avatarFrameDraft,
      featuredTitle: nextTitleId ?? featuredTitleDraft,
    });
    setIdentityFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleDownloadQrisPng = () => {
    if (!personalQrUrl) return;
    const canvas = document.createElement('canvas');
    canvas.width = 760;
    canvas.height = 980;
    const ctx = canvas.getContext('2d');
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      if (ctx) {
        const bgGrad = ctx.createLinearGradient(0, 0, 760, 980);
        bgGrad.addColorStop(0, '#071426');
        bgGrad.addColorStop(0.55, '#0b1e36');
        bgGrad.addColorStop(1, '#091526');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 760, 980);

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.45)';
        ctx.lineWidth = 4;
        ctx.strokeRect(24, 24, 712, 932);

        ctx.fillStyle = '#22d3ee';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BANK NUSANTARA • QRP (QR PROFIL)', 380, 78);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('KARTU STATISTIK UMUM NASABAH (PRIVASI SALDO AMAN)', 380, 110);

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(150, 145, 460, 460);
        ctx.drawImage(qrImg, 170, 165, 420, 420);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 30px sans-serif';
        ctx.fillText(currentAccount.fullName.toUpperCase(), 380, 665);

        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 22px monospace';
        ctx.fillText(`REK: ${currentAccount.accountNumber}`, 380, 708);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '18px monospace';
        ctx.fillText(`ID 16 DIGIT: ${currentAccount.userId16 || currentAccount.accountNumber}`, 380, 742);

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(
          `${activeFeaturedTitle ? activeFeaturedTitle.label : stats?.tierLabel || 'NASABAH'}${
            currentAccount.city ? ` • ${currentAccount.city.toUpperCase()}` : ''
          }`,
          380,
          782
        );

        ctx.fillStyle = '#94a3b8';
        ctx.font = '14px sans-serif';
        ctx.fillText('Pindai lewat Kamera Scan Universal M-Banking, Scan QRP, atau Google Lens', 380, 860);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '12px monospace';
        ctx.fillText(personalQrLink.slice(0, 82), 380, 895);

        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `QRP-Bank-Nusantara-${currentAccount.accountNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
    qrImg.onerror = () => {
      const link = document.createElement('a');
      link.href = personalQrUrl;
      link.download = `QRP-Bank-Nusantara-${currentAccount.accountNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    qrImg.src = personalQrUrl;
  };

  const handleExportCsv = () => {
    const csvEscape = (v: string | number) => {
      const s = String(v ?? '').replace(/"/g, '""');
      return `"${s}"`;
    };
    const rows: string[] = [
      ['RINGKASAN PROFIL NASABAH BANK NUSANTARA'].map(csvEscape).join(','),
      ['Nama Lengkap', currentAccount.fullName].map(csvEscape).join(','),
      ['Nomor Rekening', currentAccount.accountNumber].map(csvEscape).join(','),
      ['ID Permanen 16 Digit', currentAccount.userId16 || '-'].map(csvEscape).join(','),
      ['Tier Kartu', stats.tierLabel].map(csvEscape).join(','),
      ['Kota Domisili', currentAccount.city || '-'].map(csvEscape).join(','),
      ['Saldo Rekening', isUnlimitedBal ? 'Infinity' : String(currentAccount.balance)].map(csvEscape).join(','),
      ['Permata / Diamond', totalDiamondText].map(csvEscape).join(','),
      ['Emas 24K (gram)', String(stats.goldGrams)].map(csvEscape).join(','),
      ['Estimasi Nilai Emas (Rp)', String(stats.goldValuation)].map(csvEscape).join(','),
      ['Total Deposito (Rp)', String(stats.totalDeposito)].map(csvEscape).join(','),
      ['Kantong Impian (Rp)', String(stats.totalDreamSaved)].map(csvEscape).join(','),
      ['Streak Online (Hari)', String(stats.streakDays)].map(csvEscape).join(','),
      ['Poin Loyalty', String(stats.loyaltyPoints)].map(csvEscape).join(','),
      ['Pemasukan Bulan Ini (Rp)', String(stats.monthlyIncome)].map(csvEscape).join(','),
      ['Pengeluaran Bulan Ini (Rp)', String(stats.monthlyExpense)].map(csvEscape).join(','),
      '',
      ['RIWAYAT TRANSAKSI TERBARU'].map(csvEscape).join(','),
      ['Tanggal', 'Referensi', 'Judul', 'Kategori', 'Nominal (Rp)', 'Status'].map(csvEscape).join(','),
      ...stats.recentTxs.map((tx) =>
        [
          new Date(tx.timestamp).toLocaleString('id-ID'),
          tx.referenceNo,
          tx.title,
          tx.type,
          tx.amount,
          tx.status,
        ]
          .map(csvEscape)
          .join(',')
      ),
    ];

    const blob = new Blob(['\uFEFF' + rows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Ringkasan-Akun-${currentAccount.accountNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportFeedback('File CSV ringkasan akun & mutasi berhasil diunduh.');
  };

  const handlePrintPdfSummary = () => {
    setExportFeedback('Menyiapkan dialog cetak / Simpan sebagai PDF...');
    window.setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleAddFavoriteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAcc = favAccNum.replace(/\s+/g, '');
    if (cleanAcc.length < 6) {
      setFavFeedback({ type: 'error', text: 'Nomor rekening favorit minimal 6 digit.' });
      return;
    }
    const cleanOwner = favOwnerName.trim();
    if (cleanOwner.length < 2) {
      setFavFeedback({ type: 'error', text: 'Masukkan nama pemilik rekening tujuan.' });
      return;
    }
    addFavorite(cleanAcc, cleanOwner, favBankName.trim() || 'Bank Nusantara', favAlias.trim() || undefined);
    setFavAccNum('');
    setFavOwnerName('');
    setFavAlias('');
    setFavFeedback({ type: 'success', text: `Rekening ${cleanOwner} ditambahkan ke Favorit.` });
  };

  const handleLookupFavoriteAcc = (val: string) => {
    setFavAccNum(val);
    const clean = val.replace(/\s+/g, '');
    if (clean.length >= 8) {
      const found = lookupAccount(clean, 'Bank Nusantara');
      if (found.found && found.name) {
        setFavOwnerName(found.name);
        setFavBankName(found.bank || 'Bank Nusantara');
      }
    }
  };

  const handleChangePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput !== confirmPinInput) {
      setPinFeedback({ type: 'error', text: 'Konfirmasi PIN baru tidak cocok.' });
      return;
    }
    const res = changePin(currentAccount.id, oldPinInput, newPinInput);
    setPinFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setOldPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
    }
  };

  const handleToggleFreezeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = toggleCardFreezeWithPin(currentAccount.id, freezePinInput);
    setFreezeFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setFreezePinInput('');
    }
  };

  const handleJumpView = (view: 'dashboard' | 'emas' | 'chat') => {
    onClose();
    if (onNavigateView) {
      onNavigateView(view);
    }
  };

  const joinDateText = currentAccount.createdAt
    ? new Date(currentAccount.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Terdaftar Aktif';

  const cleanRenameTrim = renameInput.trim().replace(/\s+/g, ' ');
  const isRenameValidLen = cleanRenameTrim.length >= 3 && cleanRenameTrim.length <= 60;
  const isRenameSameAsCurrent = cleanRenameTrim === currentAccount.fullName.trim();
  const hasEnoughDiamondsForRename =
    isAdminCard || (currentAccount.diamonds || 0) >= PROFILE_RENAME_DIAMOND_COST;

  const achievementTabAlertCount = achievementBundle.readyCount + pendingLevelSyncCount;

  const tabs: Array<{ key: ProfileTabKey; label: string; icon: React.ReactNode; badge?: number }> = [
    { key: 'ringkasan', label: 'Ringkasan', icon: <BarChart3 className="w-4 h-4 shrink-0" /> },
    { key: 'identitas', label: 'Identitas & Kartu', icon: <UserCheck className="w-4 h-4 shrink-0" /> },
    { key: 'aksi_favorit', label: 'Aksi & Favorit', icon: <Sparkles className="w-4 h-4 shrink-0" /> },
    { key: 'keamanan', label: 'Keamanan & PIN', icon: <ShieldCheck className="w-4 h-4 shrink-0" /> },
    {
      key: 'achievement',
      label: 'Achievement',
      icon: <Trophy className="w-4 h-4 shrink-0" />,
      badge: achievementTabAlertCount,
    },
  ];

  const modalContent = (
    <div
      className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/65 backdrop-blur-sm p-3 pb-16 sm:p-5 print:bg-white print:p-0 print:static"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Profil dan Statistik Akun"
    >
      <div
        className="relative w-full max-w-4xl max-h-[calc(100dvh-5rem)] sm:max-h-[92dvh] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden print:max-h-none print:shadow-none print:border-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Identitas Utama */}
        <div className="px-4 py-3.5 sm:px-6 sm:py-5 border-b border-slate-200 bg-slate-50/90 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
            <ProfileAvatarBadge
              account={currentAccount}
              googlePicture={googleUser?.picture}
              size="lg"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h2 className="text-base sm:text-xl font-bold text-slate-900 break-words leading-snug">
                  {currentAccount.fullName}
                </h2>
                <button
                  type="button"
                  onClick={handleOpenRenamePopup}
                  title="Ganti Nama Profil (50 Diamond)"
                  aria-label="Ganti Nama Profil dengan 50 Diamond"
                  className="inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-600 hover:text-blue-700 transition-colors shrink-0 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenRenamePopup}
                  title="Saldo Permata & Ganti Nama 50 Diamond"
                  className="inline-flex items-center gap-1.5 min-h-[36px] sm:min-h-[32px] px-2.5 py-1 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 font-bold text-xs font-mono tabular-nums transition-colors shrink-0 cursor-pointer"
                >
                  <DiamondIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{totalDiamondText}</span>
                </button>
                {currentAccount.isVerified && (
                  <span
                    title={currentAccount.verifiedLabel || 'Akun Terverifikasi'}
                    className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md shrink-0"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Terverifikasi
                  </span>
                )}
                {currentAccount.isOfficialAdminAccount && (
                  <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md shrink-0">
                    <Shield className="w-3.5 h-3.5" />
                    OA
                  </span>
                )}
                {activeFeaturedTitle && (
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-semibold border px-2 py-0.5 rounded-md shrink-0 ${activeFeaturedTitle.toneClass}`}
                  >
                    <Award className="w-3 h-3 shrink-0" />
                    {activeFeaturedTitle.label}
                  </span>
                )}
              </div>

              {currentAccount.profileBio && (
                <p className="mt-1 text-xs text-slate-600 break-words line-clamp-2">
                  {currentAccount.profileBio}
                </p>
              )}

              <div className="mt-1.5 flex items-center gap-x-2.5 gap-y-1 flex-wrap text-[11px] sm:text-xs text-slate-600">
                <span className="font-semibold text-slate-800">{stats.tierLabel}</span>
                <span className="text-slate-300">|</span>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border font-mono font-bold text-[11px] ${
                    accountLevelSnapshot.isInfinity
                      ? 'bg-amber-50 border-amber-300 text-amber-800'
                      : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                  }`}
                >
                  {accountLevelSnapshot.isInfinity ? (
                    <Crown className="w-3 h-3 text-amber-600 shrink-0" />
                  ) : (
                    <Layers className="w-3 h-3 text-indigo-600 shrink-0" />
                  )}
                  <span>{accountLevelSnapshot.displayLabel}</span>
                </span>
                {currentAccount.city && (
                  <>
                    <span className="text-slate-300">|</span>
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{currentAccount.city}</span>
                    </span>
                  </>
                )}
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Bergabung {joinDateText}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="inline-flex items-center gap-1">
                  <Cloud className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    {isGoogleLinked ? 'Cloud Google Terhubung' : 'Mode Lokal'}
                  </span>
                </span>
              </div>

              <TopLeaderboardBadges
                account={currentAccount}
                variant="full"
                context="profile"
                className="mt-2"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/70 transition-colors shrink-0 cursor-pointer print:hidden"
            aria-label="Tutup Profil"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigasi Sub-Tab Rapi */}
        <div className="px-4 sm:px-6 border-b border-slate-200 bg-white shrink-0 print:hidden">
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {typeof tab.badge === 'number' && tab.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums font-black ${
                        isActive ? 'bg-amber-400 text-slate-950' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body Scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* ======================= TAB 1: RINGKASAN & STATISTIK ======================= */}
          {activeTab === 'ringkasan' && (
            <>
              {/* Bar Sinkronisasi Cloud */}
              <div
                className={`rounded-xl border p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                  syncTelemetry.status === 'error'
                    ? 'border-rose-200 bg-rose-50/80'
                    : syncTelemetry.status === 'offline'
                    ? 'border-amber-200 bg-amber-50/80'
                    : syncBusy
                    ? 'border-blue-200 bg-blue-50/80'
                    : 'border-emerald-200 bg-emerald-50/80'
                }`}
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      syncTelemetry.status === 'error'
                        ? 'bg-rose-100 text-rose-600'
                        : syncTelemetry.status === 'offline'
                        ? 'bg-amber-100 text-amber-600'
                        : syncBusy
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-emerald-100 text-emerald-600'
                    }`}
                  >
                    {syncTelemetry.status === 'error' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : syncTelemetry.status === 'offline' ? (
                      <CloudOff className="w-4 h-4" />
                    ) : syncBusy ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      {syncTelemetry.status === 'error'
                        ? 'Gangguan Sinkronisasi Cloud'
                        : syncTelemetry.status === 'offline'
                        ? 'Mode Offline (Data Tersimpan Lokal)'
                        : syncBusy
                        ? `Menyinkronkan ke Cloud (${Math.max(1, syncTelemetry.pendingWritesCount)})...`
                        : 'Cloud Tersinkronisasi'}
                    </p>
                    <p className="text-[11px] text-slate-600 break-words">
                      {syncTelemetry.status === 'error' && syncTelemetry.lastError
                        ? syncTelemetry.lastError
                        : `Terakhir tersinkronisasi pukul ${lastSyncTimeText} WIB`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 print:hidden">
                  <button
                    type="button"
                    onClick={handleQuickSyncCloud}
                    disabled={syncBusy}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncBusy ? 'animate-spin' : ''}`} />
                    <span>{syncBusy ? 'Menyinkronkan...' : 'Sync 1-Klik'}</span>
                  </button>
                  {onOpenSecurityCenter && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenSecurityCenter('telemetry');
                      }}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Detail
                    </button>
                  )}
                </div>
              </div>

              {/* Portofolio Utama: Saldo, Coin, Diamond, Emas 24K, Deposito, Kantong Impian */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-blue-600" />
                  Portofolio Saldo, Emas 24K, Deposito & Kantong Impian
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-w-0">
                    <p className="text-xs text-slate-500">Saldo Rekening</p>
                    <AdaptiveRupiah
                      amount={currentAccount.balance}
                      isUnlimited={isUnlimitedBal}
                      className="text-sm sm:text-base font-extrabold text-slate-900 font-mono tabular-nums mt-0.5"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-w-0">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <DiamondIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>Total Permata</span>
                    </p>
                    <p className="text-sm sm:text-base font-bold text-cyan-700 font-mono tabular-nums mt-0.5 break-words">
                      {totalDiamondText}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-w-0">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Coin Spin</span>
                    </p>
                    <p className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5 break-words">
                      {formatAssetCount(currentAccount.spinCoins, { isAdmin: isAdminCard })}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-w-0">
                    <p className="text-xs text-slate-500">Emas 24K</p>
                    <p className="text-sm sm:text-base font-bold text-amber-700 font-mono tabular-nums mt-0.5">
                      {stats.goldGrams.toLocaleString('id-ID', { maximumFractionDigits: 3 })} gr
                    </p>
                    <p className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                      Nilai: {formatCompactRupiah(stats.goldValuation)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-w-0">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Deposito ({stats.depositoCount})</span>
                    </p>
                    <AdaptiveRupiah
                      amount={stats.totalDeposito}
                      className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5"
                    />
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3.5 min-w-0">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <PiggyBank className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                      <span>Kantong Impian ({stats.dreamCount})</span>
                    </p>
                    <AdaptiveRupiah
                      amount={stats.totalDreamSaved}
                      className="text-sm sm:text-base font-bold text-slate-900 font-mono tabular-nums mt-0.5"
                    />
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: `${stats.dreamProgressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono tabular-nums font-semibold text-slate-600">
                        {stats.dreamProgressPct}%
                      </span>
                    </div>
                  </div>
                </div>
                {(currentAccount.debtAmount || 0) > 0 && (
                  <div className="mt-2.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-rose-800 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Kewajiban Hutang Aktif
                    </span>
                    <span className="font-bold text-rose-900 font-mono tabular-nums">
                      {formatRupiah(currentAccount.debtAmount || 0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Kartu Status Streak Online, Poin Loyalty & Kartu Pemulihan */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                  Status Streak Online, Poin Loyalty & Kartu Pemulihan
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-lg bg-orange-50/70 border border-orange-200/80 p-3 min-w-0">
                    <p className="text-orange-700 font-medium">Streak Online</p>
                    <p className="text-base font-extrabold text-orange-950 font-mono tabular-nums mt-0.5">
                      {stats.streakDays.toLocaleString('id-ID')} Hari
                    </p>
                    <p className="text-[11px] font-semibold text-orange-800 mt-0.5">
                      {stats.freezeStage > 0
                        ? `Beku Tahap ${stats.freezeStage}/3`
                        : stats.streakDays > 0
                        ? 'Api Aktif'
                        : 'Siap Mulai'}
                    </p>
                  </div>
                  <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-3 min-w-0">
                    <p className="text-amber-700 font-medium">Poin Loyalty</p>
                    <p className="text-base font-extrabold text-amber-950 font-mono tabular-nums mt-0.5">
                      {formatAssetCount(stats.loyaltyPoints, { isAdmin: isAdminCard })}
                    </p>
                    <p className="text-[11px] text-amber-800 mt-0.5">Siap ditukar hadiah</p>
                  </div>
                  <div className="rounded-lg bg-cyan-50/70 border border-cyan-200/80 p-3 min-w-0">
                    <p className="text-cyan-700 font-medium">Kartu Pemulihan</p>
                    <p className="text-base font-extrabold text-cyan-950 font-mono tabular-nums mt-0.5">
                      {formatAssetCount(stats.recoveryCards, { isAdmin: isAdminCard })}
                    </p>
                    <p className="text-[11px] text-cyan-800 mt-0.5">Pelindung api beku</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 min-w-0">
                    <p className="text-slate-500 font-medium">Poin Rewards</p>
                    <p className="text-base font-extrabold text-slate-900 font-mono tabular-nums mt-0.5">
                      {formatAssetCount(currentAccount.rewardPoints, { isAdmin: isAdminCard })}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Voucher Lv: {formatAssetCount(currentAccount.levelVouchers, { isAdmin: isAdminCard })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Leaderboard Aktif & Progres Level Karir */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-w-0">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                    Peringkat Leaderboard Aktif
                  </h3>
                  {stats.leaderboardRanks.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {stats.leaderboardRanks.slice(0, 5).map((entry) => (
                        <div
                          key={entry.categoryId}
                          className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={`px-2 py-0.5 rounded font-mono tabular-nums font-extrabold text-[11px] shrink-0 ${
                                entry.rank === 1
                                  ? 'bg-amber-500 text-slate-950'
                                  : entry.rank === 2
                                  ? 'bg-slate-300 text-slate-900'
                                  : entry.rank === 3
                                  ? 'bg-orange-200 text-orange-950'
                                  : 'bg-slate-800 text-white'
                              }`}
                            >
                              #{entry.rank}
                            </span>
                            <span className="font-semibold text-slate-800 truncate">
                              {entry.categoryLabel}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono tabular-nums shrink-0">
                            {entry.isUnlimited ? '∞' : entry.score.toLocaleString('id-ID')} {entry.unitLabel}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-50 border border-dashed border-slate-200 p-3 text-xs text-slate-500">
                      {isAdminCard
                        ? 'Akun Kartu Tier Admin tidak dihitung pada peringkat publik standar.'
                        : 'Belum masuk daftar peringkat teratas kategori aktif saat ini.'}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                      Progres Level Akun, Karir &amp; Celengan
                    </h3>
                    <button
                      type="button"
                      onClick={() => setActiveTab('achievement')}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                    >
                      Lihat Hadiah Level →
                    </button>
                  </div>

                  {/* Level Akun XP (Lv. 1-100 / Admin Infinity) */}
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="text-slate-700 font-semibold flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                        <span>Level Akun XP</span>
                      </span>
                      <span
                        className={`font-bold font-mono tabular-nums shrink-0 ${
                          accountLevelSnapshot.isInfinity ? 'text-amber-600' : 'text-cyan-700'
                        }`}
                      >
                        {accountLevelSnapshot.isInfinity
                          ? 'Lv. ∞ (Tier Admin)'
                          : `Lv. ${accountLevelSnapshot.level} / ${MAX_REGULAR_ACCOUNT_LEVEL} (${accountLevelSnapshot.progressPct}%)`}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          accountLevelSnapshot.isInfinity
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                            : 'bg-gradient-to-r from-cyan-500 to-indigo-600'
                        }`}
                        style={{ width: `${accountLevelSnapshot.progressPct}%` }}
                      />
                    </div>
                    {!accountLevelSnapshot.isInfinity && !accountLevelSnapshot.isMaxLevel && (
                      <p className="text-[10px] text-slate-500 font-mono tabular-nums mt-1">
                        {accountLevelSnapshot.xpInCurrentLevel.toLocaleString('id-ID')} /{' '}
                        {accountLevelSnapshot.xpForNextLevel.toLocaleString('id-ID')} XP menuju Lv.{' '}
                        {accountLevelSnapshot.level + 1}
                      </p>
                    )}
                  </div>

                  <div className="pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between gap-2 text-xs mb-1">
                      <span className="text-slate-600 font-medium">Level Pekerjaan</span>
                      <span
                        className={`font-bold font-mono tabular-nums shrink-0 ${
                          isAdminCard || isUnlimitedNumber(stats.currentLevel)
                            ? 'text-amber-600'
                            : 'text-indigo-700'
                        }`}
                      >
                        {isAdminCard || isUnlimitedNumber(stats.currentLevel)
                          ? 'Level ∞'
                          : `Level ${stats.currentLevel} / 50`}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          isAdminCard || isUnlimitedNumber(stats.currentLevel)
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                            : 'bg-indigo-600'
                        }`}
                        style={{
                          width:
                            isAdminCard || isUnlimitedNumber(stats.currentLevel)
                              ? '100%'
                              : `${stats.levelProgressPct}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-1 border-t border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-1">
                      <span className="text-slate-600">Celengan Biasa ({stats.pocketCount})</span>
                      <span className="font-bold text-slate-900 font-mono tabular-nums">
                        {formatCompactRupiah(stats.totalPocketSaved)} ({stats.pocketProgressPct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{ width: `${stats.pocketProgressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Grafik Mini Perbandingan Pemasukan & Pengeluaran Bulan Ini */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                    Arus Kas Bulan Ini ({stats.nowMonthLabel})
                  </h3>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-500">
                    {stats.monthlyTxCount} Transaksi Bulan Ini
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-lg bg-emerald-50/70 border border-emerald-200/80 p-3 min-w-0">
                    <p className="text-xs text-emerald-700 font-medium">Pemasukan Bulan Ini</p>
                    <AdaptiveRupiah
                      amount={stats.monthlyIncome}
                      className="text-sm font-bold text-emerald-900 font-mono tabular-nums mt-0.5"
                    />
                  </div>
                  <div className="rounded-lg bg-rose-50/70 border border-rose-200/80 p-3 min-w-0">
                    <p className="text-xs text-rose-700 font-medium">Pengeluaran Bulan Ini</p>
                    <AdaptiveRupiah
                      amount={stats.monthlyExpense}
                      className="text-sm font-bold text-rose-900 font-mono tabular-nums mt-0.5"
                    />
                  </div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 min-w-0">
                    <p className="text-xs text-slate-600 font-medium">Selisih Bersih</p>
                    <p
                      className={`text-sm font-bold font-mono tabular-nums mt-0.5 ${
                        stats.monthlyIncome - stats.monthlyExpense >= 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {stats.monthlyIncome - stats.monthlyExpense >= 0 ? '+' : '-'}
                      {formatCompactRupiah(Math.abs(stats.monthlyIncome - stats.monthlyExpense))}
                    </p>
                  </div>
                </div>

                {/* Grafik Batang Mini Visual */}
                <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3.5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-emerald-800">Pemasukan</span>
                      <span className="font-mono tabular-nums font-bold text-emerald-900">
                        {formatRupiah(stats.monthlyIncome)}
                      </span>
                    </div>
                    <div className="h-3.5 rounded-md bg-white border border-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-md bg-emerald-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((stats.monthlyIncome / stats.monthlyPeak) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-rose-800">Pengeluaran</span>
                      <span className="font-mono tabular-nums font-bold text-rose-900">
                        {formatRupiah(stats.monthlyExpense)}
                      </span>
                    </div>
                    <div className="h-3.5 rounded-md bg-white border border-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-md bg-rose-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round((stats.monthlyExpense / stats.monthlyPeak) * 100)
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-1 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                    <span>
                      Total Keseluruhan ({stats.txCount.toLocaleString('id-ID')}x): Masuk{' '}
                      <strong className="font-mono tabular-nums text-slate-800">
                        {formatCompactRupiah(stats.totalIncome)}
                      </strong>{' '}
                      | Keluar{' '}
                      <strong className="font-mono tabular-nums text-slate-800">
                        {formatCompactRupiah(stats.totalExpense)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Limit Tarik Harian */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs mb-1.5">
                    <span className="text-slate-600 font-medium flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Pemakaian Limit Tarik Harian</span>
                    </span>
                    <span className="font-semibold text-slate-800 font-mono tabular-nums">
                      {isAdminCard || isUnlimitedNumber(stats.dailyLimit)
                        ? '∞'
                        : `${formatCompactRupiah(stats.dailyUsed)} / ${formatCompactRupiah(stats.dailyLimit)} (${stats.dailyLimitPct}%)`}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${stats.dailyLimitPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ======================= TAB 2: IDENTITAS & KARTU NAMA ======================= */}
          {activeTab === 'identitas' && (
            <>
              {identityFeedback && (
                <div
                  className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                    identityFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {identityFeedback.text}
                </div>
              )}

              {/* Form Edit Bio, No HP, Email & Kota */}
              <form
                onSubmit={handleSaveIdentityDetails}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Edit Detail Identitas & Kontak
                  </h3>
                  <button
                    type="button"
                    onClick={handleOpenRenamePopup}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 text-cyan-900 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Ganti Nama (50 Diamond)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Nomor HP</label>
                    <input
                      type="text"
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      placeholder="08xxxxxxxxxx"
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Email Profil</label>
                    <input
                      type="email"
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      placeholder="nama@email.com"
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Kota Domisili</label>
                    <input
                      type="text"
                      maxLength={60}
                      value={cityDraft}
                      onChange={(e) => setCityDraft(e.target.value)}
                      placeholder="Contoh: Jakarta Selatan"
                      className="w-full min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">Bio Profil Singkat</label>
                    <span className="font-mono tabular-nums text-[11px] text-slate-400">
                      {bioDraft.length}/180
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    maxLength={180}
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    placeholder="Tuliskan deskripsi singkat, hobi finansial, atau slogan usaha Anda..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan Identitas Profil</span>
                  </button>
                </div>
              </form>

              {/* Avatar Preset, Bingkai Avatar & Gelar Unggulan */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                  Avatar Preset, Bingkai Avatar & Gelar Unggulan
                </h3>

                {/* Pilihan Avatar Preset */}
                <div>
                  <p className="text-xs font-semibold text-slate-700 mb-2">Pilih Gaya Avatar</p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarPresetDraft('');
                        handleQuickSaveAppearance('', undefined, undefined);
                      }}
                      className={`min-h-[44px] p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        !avatarPresetDraft
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span className="w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {currentAccount.fullName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold truncate">Default</span>
                    </button>
                    {AVATAR_PRESETS.map((preset) => {
                      const active = avatarPresetDraft === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarPresetDraft(preset.id);
                            handleQuickSaveAppearance(preset.id, undefined, undefined);
                          }}
                          className={`min-h-[44px] p-2 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                            active
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <ProfileAvatarBadge
                            account={{
                              fullName: currentAccount.fullName,
                              cardStatus: 'active',
                              avatarPresetId: preset.id,
                              avatarFrameId: 'frame-clean',
                            }}
                            size="sm"
                          />
                          <span className="text-[11px] font-semibold truncate">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Kontrol Mode Animasi Bingkai (Laptop & HP) */}
                <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">Mode Animasi Bingkai</p>
                    <p className="text-[11px] text-slate-500">
                      Putar penuh terus di laptop meski hemat gerak OS aktif, atau hemat daya.
                    </p>
                  </div>
                  <div
                    role="group"
                    aria-label="Mode Animasi Bingkai"
                    className="inline-flex items-center gap-1 p-1 rounded-lg bg-slate-100 border border-slate-200 shrink-0 self-start sm:self-auto"
                  >
                    <button
                      type="button"
                      onClick={() => setFrameMotionMode('always-full')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        frameMotionMode === 'always-full'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Penuh Selalu Aktif
                    </button>
                    <button
                      type="button"
                      onClick={() => setFrameMotionMode('battery-saver')}
                      className={`min-h-[40px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        frameMotionMode === 'battery-saver'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Hemat Baterai
                    </button>
                  </div>
                </div>

                {/* Pilihan Bingkai Avatar */}
                <div className="pt-2 border-t border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Pilih Bingkai Avatar</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVATAR_FRAMES.map((frame) => {
                      const active = avatarFrameDraft === frame.id;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => {
                            setAvatarFrameDraft(frame.id);
                            handleQuickSaveAppearance(undefined, frame.id, undefined);
                          }}
                          className={`min-h-[44px] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                            active
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <ProfileAvatarBadge
                            account={{
                              fullName: currentAccount.fullName,
                              cardStatus: 'active',
                              avatarPresetId: avatarPresetDraft,
                              avatarFrameId: frame.id,
                            }}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold truncate">{frame.label}</p>
                            <p className="text-[10px] text-slate-500 truncate">{frame.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Koleksi Bingkai Aura Eksklusif (Hasil Spin Bingkai / Tukar 500 Token) */}
                <div className="pt-2 border-t border-slate-200/80">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-slate-800">
                      Koleksi Bingkai Aura Eksklusif (Spin Bingkai)
                    </p>
                    <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                      Dimiliki:{' '}
                      {
                        SPIN_AURA_FRAMES.filter((f) =>
                          (currentAccount.ownedSpinFrameIds || []).includes(f.id)
                        ).length
                      }
                      /{SPIN_AURA_FRAMES.length} · Token:{' '}
                      {(currentAccount.spinTokens || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {SPIN_AURA_FRAMES.map((frame) => {
                      const owned = (currentAccount.ownedSpinFrameIds || []).includes(frame.id);
                      const active = avatarFrameDraft === frame.id;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => {
                            const res = equipSpinAvatarFrame(frame.id);
                            if (res.success) {
                              setAvatarFrameDraft(frame.id);
                            }
                            setIdentityFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                          }}
                          className={`min-h-[52px] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                            active
                              ? 'border-blue-600 bg-blue-50 text-blue-950'
                              : owned
                              ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 text-slate-800'
                              : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-500'
                          }`}
                        >
                          <ProfileAvatarBadge
                            account={{
                              fullName: currentAccount.fullName,
                              cardStatus: 'active',
                              avatarPresetId: avatarPresetDraft,
                              avatarFrameId: frame.id,
                            }}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-[11px] font-bold truncate">{frame.label}</p>
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                  active
                                    ? 'bg-blue-600 text-white'
                                    : owned
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {active ? 'Dipakai' : owned ? 'Dimiliki' : 'Terkunci'}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">
                              {owned ? frame.description : 'Spin Bingkai 5% / Tukar 500 Token'}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pilihan Gelar Unggulan Berbasis Syarat Achievement & Hadiah Level */}
                <div className="pt-2 border-t border-slate-200/80 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        Pajang Gelar / Lencana Unggulan di Profil ({unlockedTitlesCount}/{FEATURED_TITLES.length} Terbuka)
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Gelar terkunci otomatis terbuka setelah syarat Achievement diklaim atau diraih dari hadiah naik Level.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setFeaturedTitleDraft('');
                        handleQuickSaveAppearance(undefined, undefined, '');
                      }}
                      className={`min-h-[34px] px-3 py-1 rounded-lg border text-xs font-semibold cursor-pointer shrink-0 ${
                        !featuredTitleDraft
                          ? 'border-slate-900 bg-slate-900 text-white'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Tanpa Gelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {FEATURED_TITLES.map((item) => {
                      const unlocked = isTitleUnlockedForAccount(currentAccount, item.id);
                      const active = featuredTitleDraft === item.id && unlocked;
                      const achEval = achievementBundle.byTitleId[item.id];
                      const isReadyToClaim = !unlocked && achEval?.status === 'ready';
                      const fmtCurrent = achEval
                        ? achEval.definition.formatValue
                          ? achEval.definition.formatValue(achEval.currentValue)
                          : String(achEval.currentValue)
                        : '0';
                      const fmtTarget = achEval
                        ? achEval.definition.formatValue
                          ? achEval.definition.formatValue(achEval.targetValue)
                          : String(achEval.targetValue)
                        : '1';

                      return (
                        <div
                          key={item.id}
                          className={`rounded-xl border p-3 flex flex-col justify-between gap-2 transition-colors ${
                            active
                              ? 'border-blue-600 bg-blue-50/70'
                              : unlocked
                              ? 'border-emerald-200 bg-emerald-50/35'
                              : isReadyToClaim
                              ? 'border-amber-300 bg-amber-50/50'
                              : 'border-slate-200 bg-slate-50/80'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`inline-flex items-center gap-1 text-[11px] font-bold border px-2 py-0.5 rounded-md ${item.toneClass}`}
                                >
                                  {unlocked ? (
                                    <Award className="w-3 h-3 shrink-0" />
                                  ) : (
                                    <Lock className="w-3 h-3 shrink-0" />
                                  )}
                                  <span>{item.label}</span>
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-1.5 leading-snug">
                                Syarat: {item.requirementSummary}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                active
                                  ? 'bg-blue-600 text-white'
                                  : unlocked
                                  ? 'bg-emerald-600 text-white'
                                  : isReadyToClaim
                                  ? 'bg-amber-500 text-slate-950'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {active
                                ? 'Dipakai'
                                : unlocked
                                ? 'Terbuka'
                                : isReadyToClaim
                                ? 'Siap Klaim'
                                : 'Terkunci'}
                            </span>
                          </div>

                          {!unlocked && achEval && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
                                <span>
                                  {fmtCurrent} / {fmtTarget}
                                </span>
                                <span>{achEval.progressPct}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isReadyToClaim ? 'bg-amber-500' : 'bg-slate-500'
                                  }`}
                                  style={{ width: `${achEval.progressPct}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-end gap-2 pt-0.5">
                            {unlocked ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = active ? '' : item.id;
                                  setFeaturedTitleDraft(next);
                                  handleQuickSaveAppearance(undefined, undefined, next);
                                }}
                                className={`min-h-[32px] px-3 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                                  active
                                    ? 'bg-slate-800 text-white hover:bg-slate-900'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {active ? 'Lepas Gelar' : 'Pasang Gelar'}
                              </button>
                            ) : isReadyToClaim && achEval ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = claimProfileAchievement(achEval.definition.id);
                                  setIdentityFeedback({
                                    type: res.success ? 'success' : 'error',
                                    text: res.message,
                                  });
                                  if (res.success) {
                                    setFeaturedTitleDraft(item.id);
                                  }
                                }}
                                className="min-h-[32px] px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-extrabold cursor-pointer"
                              >
                                Klaim &amp; Buka Gelar
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setActiveTab('achievement')}
                                className="min-h-[32px] px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-semibold cursor-pointer"
                              >
                                Cek Achievement
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Kartu Nama Digital & Unduh QRP (QR Profil Statistik Umum) */}
              <div className="rounded-xl border border-cyan-500/30 bg-slate-900 text-white p-4 sm:p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
                <div className="space-y-2.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <ProfileAvatarBadge
                      account={currentAccount}
                      googlePicture={googleUser?.picture}
                      size="md"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-cyan-300 font-bold">
                        Kartu Nama Digital &amp; QRP (QR Profil Statistik Umum)
                      </p>
                      <p className="text-base font-extrabold text-white truncate">
                        {currentAccount.fullName}
                      </p>
                      <p className="text-xs text-slate-300">
                        {activeFeaturedTitle ? activeFeaturedTitle.label : stats.tierLabel}
                        {currentAccount.city ? ` — ${currentAccount.city}` : ''}
                      </p>
                    </div>
                  </div>
                  {currentAccount.profileBio && (
                    <p className="text-xs text-slate-300 italic border-t border-slate-800 pt-2">
                      "{currentAccount.profileBio}"
                    </p>
                  )}
                  <p className="text-[11px] text-cyan-200/90 bg-cyan-950/60 border border-cyan-500/30 rounded-lg px-3 py-1.5 leading-relaxed">
                    <strong>QRP (QR Profil)</strong> adalah kode QR khusus untuk membagikan <strong>Statistik Umum Akun</strong> (Level Akun XP, Tier Kartu, Gelar, Achievement, &amp; Streak Online) kepada teman <strong>tanpa menampilkan Saldo Rekening</strong>. Untuk menerima uang/aset, gunakan menu <strong>QRIS Pribadi Multi-Aset</strong> di M-Banking.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2">
                      <p className="text-[10px] text-slate-400">No. Rekening</p>
                      <p className="font-mono tabular-nums font-bold text-white">
                        {formatAccountNumberDisplay(currentAccount.accountNumber, isPrivacyMasked)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-800/80 border border-slate-700 px-3 py-2">
                      <p className="text-[10px] text-slate-400">Kontak Terdaftar</p>
                      <p className="font-mono tabular-nums font-bold text-white truncate">
                        {currentAccount.phone
                          ? formatPhoneDisplay(currentAccount.phone, isPrivacyMasked)
                          : displayEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1 print:hidden">
                    <button
                      type="button"
                      onClick={handleDownloadQrisPng}
                      disabled={!personalQrUrl}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4 shrink-0" />
                      <span>Unduh QRP (PNG)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy('qris', personalQrLink)}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedField === 'qris' ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span>Link QRP Tersalin</span>
                        </>
                      ) : (
                        <>
                          <QrCode className="w-4 h-4 text-cyan-300" />
                          <span>Salin Link QRP</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsQrpScannerOpen(true)}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>Scan QRP Nasabah</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-white rounded-xl p-3 border-2 border-cyan-400 shrink-0 mx-auto md:mx-0">
                  {personalQrUrl ? (
                    <img
                      src={personalQrUrl}
                      alt={`QRP ${currentAccount.fullName}`}
                      className="w-32 h-32 sm:w-36 sm:h-36 object-contain"
                    />
                  ) : (
                    <div className="w-32 h-32 flex items-center justify-center text-slate-400 text-xs">
                      Memuat QRP...
                    </div>
                  )}
                  <span className="mt-1 text-[10px] font-black text-cyan-900 font-mono tabular-nums tracking-wider">
                    QRP • QR PROFIL
                  </span>
                  <span className="text-[9px] font-semibold text-slate-500">
                    Statistik Umum (Tanpa Saldo)
                  </span>
                </div>
              </div>

              {/* Riwayat Ganti Nama */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-cyan-600 shrink-0" />
                  Riwayat Perubahan Nama ({renameHistory.length})
                </h3>
                {renameHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {renameHistory.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 break-words">
                            <span className="text-slate-500 line-through mr-1.5">{item.oldName}</span>
                            <ArrowRight className="w-3 h-3 inline text-blue-600 mr-1.5" />
                            <span className="text-blue-700">{item.newName}</span>
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(item.timestampIso).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            WIB
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-900 font-mono tabular-nums font-bold text-[11px] shrink-0 self-start sm:self-center">
                          <DiamondIcon className="h-3 w-3" />
                          <span>{item.isAdminFree ? '∞ Gratis' : `-${item.diamondCost}`}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                    Belum ada riwayat pergantian nama. Tekan ikon pensil di sebelah nama Anda untuk mengganti nama menggunakan 50 Diamond.
                  </p>
                )}
              </div>
            </>
          )}

          {/* ======================= TAB 3: AKSI CEPAT, EKSPOR & FAVORIT ======================= */}
          {activeTab === 'aksi_favorit' && (
            <>
              {/* Pintasan Cepat Fitur */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 print:hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
                  Pintasan Cepat Fitur Utama
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleJumpView('dashboard')}
                    className="min-h-[48px] p-3 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                        <Send className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-blue-950">Mobile Banking</p>
                        <p className="text-[11px] text-blue-700 truncate">Transfer & Mutasi</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-600 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJumpView('emas')}
                    className="min-h-[48px] p-3 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                        <Coins className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-amber-950">Emas 24K</p>
                        <p className="text-[11px] text-amber-800 truncate">Beli & Jual Emas</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-700 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleJumpView('chat')}
                    className="min-h-[48px] p-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-950">PayChat</p>
                        <p className="text-[11px] text-emerald-700 truncate">Kirim Pesan & Saldo</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-emerald-600 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Ekspor Laporan Ringkasan Akun CSV & PDF */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 print:hidden">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                  Ekspor Laporan Ringkasan Akun
                </h3>
                <p className="text-xs text-slate-600">
                  Unduh rincian saldo, aset Emas 24K, Deposito, Kantong Impian, Loyalty, dan 25 mutasi transaksi terbaru ke format spreadsheet CSV atau cetak laporan PDF.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="min-h-[42px] px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                    <span>Unduh Laporan CSV</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPdfSummary}
                    className="min-h-[42px] px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4 shrink-0" />
                    <span>Cetak / Simpan PDF</span>
                  </button>
                </div>
                {exportFeedback && (
                  <p className="text-xs font-semibold text-emerald-700">{exportFeedback}</p>
                )}
              </div>

              {/* Pengelola Daftar Rekening Favorit & Kontak Transfer Cepat */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600 shrink-0" />
                  Rekening Favorit & Kontak Transfer Cepat ({favorites.length})
                </h3>

                {favFeedback && (
                  <div
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
                      favFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {favFeedback.text}
                  </div>
                )}

                <form
                  onSubmit={handleAddFavoriteSubmit}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs print:hidden"
                >
                  <input
                    type="text"
                    value={favAccNum}
                    onChange={(e) => handleLookupFavoriteAcc(e.target.value)}
                    placeholder="No. Rekening Tujuan"
                    className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={favOwnerName}
                    onChange={(e) => setFavOwnerName(e.target.value)}
                    placeholder="Nama Pemilik Rekening"
                    className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    value={favAlias}
                    onChange={(e) => setFavAlias(e.target.value)}
                    placeholder="Alias (opsional)"
                    className="min-h-[40px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="min-h-[40px] px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Favorit</span>
                  </button>
                </form>

                {favorites.length > 0 ? (
                  <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="rounded-lg border border-slate-200/80 bg-slate-50 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {fav.ownerName}
                            {fav.alias ? (
                              <span className="ml-1.5 text-[11px] font-medium text-blue-700">
                                ({fav.alias})
                              </span>
                            ) : null}
                          </p>
                          <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                            {fav.bankName} — {fav.accountNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteFavorite(fav.id)}
                          aria-label={`Hapus ${fav.ownerName} dari favorit`}
                          className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-colors cursor-pointer shrink-0 print:hidden"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                    Belum ada rekening favorit tersimpan.
                  </p>
                )}
              </div>

              {/* Grup Keluarga & Kapasitas Slot */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-sky-600 shrink-0" />
                    Keluarga ({stats.myFamilies.length} Grup)
                  </h3>
                  <span className="text-xs font-mono tabular-nums font-semibold text-slate-700">
                    Slot Buat: {stats.ownedFamiliesCount} / {stats.maxFamilySlots}
                  </span>
                </div>
                {stats.myFamilies.length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {stats.myFamilies.map((fam) => {
                      const me = fam.members.find((m) => m.accountId === currentAccount.id);
                      const roleLabel =
                        me?.role === 'owner'
                          ? 'Pemilik'
                          : me?.role === 'co_leader'
                          ? 'Wakil Ketua'
                          : 'Anggota';
                      return (
                        <div
                          key={fam.id}
                          className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/70"
                        >
                          <span className="font-semibold text-slate-800 truncate">{fam.name}</span>
                          <span className="text-[11px] font-semibold text-sky-700 shrink-0">
                            {roleLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 border border-dashed border-slate-200 rounded-lg p-3">
                    Anda belum bergabung atau membuat grup keluarga.
                  </p>
                )}
              </div>

              {/* Pintasan Role Dev */}
              {activeDevRole && (
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-indigo-950 break-words">
                        Role Pengembang Aktif: {activeDevRole.name}
                      </p>
                      <p className="text-[11px] text-indigo-700">
                        Akses pintas ke Panel Admin tersedia untuk akun berstatus pengembang.
                      </p>
                    </div>
                  </div>
                  {onQuickAdminAccess && activeDevRole.canQuickOpenAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onQuickAdminAccess(activeDevRole);
                      }}
                      className="min-h-[40px] px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shrink-0 cursor-pointer"
                    >
                      Buka Panel Admin
                    </button>
                  )}
                </div>
              )}
            </>
          )}

          {/* ======================= TAB 4: KEAMANAN & PIN ======================= */}
          {activeTab === 'keamanan' && (
            <>
              {/* Sensor Privasi Nomor & ID */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      isPrivacyMasked
                        ? 'bg-amber-100 text-amber-700 border border-amber-200'
                        : 'bg-slate-200/80 text-slate-700'
                    }`}
                  >
                    {isPrivacyMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900">
                      Sensor Privasi Nomor & ID (Tutup Penuh ****)
                    </p>
                    <p className="text-[11px] text-slate-600">
                      {isPrivacyMasked
                        ? 'Aktif: ID 16 Digit, No. Rekening, No. Kartu ATM & No. HP disembunyikan penuh. Salin tetap menyalin nomor asli.'
                        : 'Nonaktif: Semua nomor dan ID tampil terbuka normal.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleHideSensitiveNumbers(currentAccount.id)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0 transition-colors cursor-pointer ${
                    isPrivacyMasked
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isPrivacyMasked ? (
                    <>
                      <Eye className="w-3.5 h-3.5" />
                      <span>Tampilkan Nomor</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5" />
                      <span>Sembunyikan (****)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Blok Identitas Permanen & Salin Cepat */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2.5 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      ID Permanen (16 Digit)
                    </p>
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5 break-words select-all">
                      {currentAccount.userId16
                        ? formatUserId16Display(currentAccount.userId16, isPrivacyMasked)
                        : '-'}
                    </p>
                  </div>
                  {currentAccount.userId16 && (
                    <button
                      type="button"
                      onClick={() => handleCopy('id16', currentAccount.userId16 || '')}
                      className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                    >
                      {copiedField === 'id16' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Salin
                        </>
                      )}
                    </button>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 flex items-center justify-between gap-2.5 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                      Nomor Rekening Aktif
                    </p>
                    <p className="text-sm font-bold text-slate-900 font-mono tabular-nums mt-0.5 break-all select-all">
                      {formatAccountNumberDisplay(currentAccount.accountNumber, isPrivacyMasked)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('rekening', currentAccount.accountNumber)}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                  >
                    {copiedField === 'rekening' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" /> Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Salin
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Saklar Bekukan Kartu Darurat Instan */}
              <form
                onSubmit={handleToggleFreezeSubmit}
                className={`rounded-xl border p-4 space-y-3 ${
                  currentAccount.cardStatus === 'frozen'
                    ? 'border-amber-300 bg-amber-50/70'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Snowflake
                      className={`w-4 h-4 shrink-0 ${
                        currentAccount.cardStatus === 'frozen' ? 'text-amber-600' : 'text-sky-600'
                      }`}
                    />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Bekukan / Buka Blokir Kartu Darurat Instan
                    </h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                      currentAccount.cardStatus === 'frozen'
                        ? 'bg-amber-200 text-amber-950'
                        : currentAccount.cardStatus === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    Status: {currentAccount.cardStatus || 'active'}
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Masukkan PIN ATM 6 digit Anda untuk mengunci sementara atau membuka kunci kartu ATM secara instan dan tersinkron ke Cloud.
                </p>
                {freezeFeedback && (
                  <div
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
                      freezeFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {freezeFeedback.text}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={freezePinInput}
                    onChange={(e) => setFreezePinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Masukkan PIN ATM (6 Digit)"
                    className="min-h-[42px] flex-1 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={freezePinInput.length !== 6}
                    className={`min-h-[42px] px-4 py-2 rounded-lg text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 ${
                      currentAccount.cardStatus === 'frozen'
                        ? 'bg-emerald-600 hover:bg-emerald-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    {currentAccount.cardStatus === 'frozen' ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>Cairkan / Buka Kunci Kartu</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Bekukan Kartu Darurat</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Form Ubah PIN ATM (6 Digit) */}
              <form
                onSubmit={handleChangePinSubmit}
                className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
              >
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-600 shrink-0" />
                  Ubah PIN Kartu ATM (6 Digit)
                </h3>
                {pinFeedback && (
                  <div
                    className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
                      pinFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {pinFeedback.text}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={oldPinInput}
                    onChange={(e) => setOldPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN Lama (6 Digit)"
                    className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="PIN Baru (6 Digit)"
                    className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ulangi PIN Baru"
                    className="min-h-[42px] px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      oldPinInput.length !== 6 ||
                      newPinInput.length !== 6 ||
                      confirmPinInput.length !== 6
                    }
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Simpan PIN Baru</span>
                  </button>
                </div>
              </form>

              {/* Ringkasan Email, HP & Security Center */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
                  <p className="text-slate-500">Email Akun</p>
                  <p className="font-semibold text-slate-900 mt-0.5 break-all" title={displayEmail}>
                    {displayEmail}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
                  <p className="text-slate-500">Nomor HP Terdaftar</p>
                  <p className="font-semibold text-slate-900 mt-0.5 font-mono tabular-nums break-words">
                    {currentAccount.phone
                      ? formatPhoneDisplay(currentAccount.phone, isPrivacyMasked)
                      : '-'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3 min-w-0">
                  <p className="text-slate-500">Jaringan Transaksi</p>
                  <p className="font-semibold text-slate-900 mt-0.5">
                    {currentAccount.allowInternational ? 'Internasional Aktif' : 'Domestik Aktif'}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* ======================= TAB 5: ACHIEVEMENT & LEVEL XP ======================= */}
          {activeTab === 'achievement' && (
            <>
              {/* Kartu Level Akun XP & Hadiah Milestone Admin */}
              <div className="rounded-2xl border border-slate-200 bg-slate-900 text-white p-4 sm:p-5 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Level Akun Nasabah (XP Aktivitas Perbankan)</span>
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`px-3 py-1 rounded-xl font-mono font-black text-base inline-flex items-center gap-1.5 ${
                          accountLevelSnapshot.isInfinity
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-slate-950'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {accountLevelSnapshot.isInfinity && <InfinityIcon className="w-4 h-4" />}
                        <span>{accountLevelSnapshot.displayLabel}</span>
                      </span>
                      <span className="text-xs text-slate-300 font-mono tabular-nums">
                        {accountLevelSnapshot.isInfinity
                          ? 'Tier Admin: Level Maksimal Tak Terbatas (∞)'
                          : accountLevelSnapshot.isMaxLevel
                          ? `Level Maksimal ${MAX_REGULAR_ACCOUNT_LEVEL} · Total ${accountLevelSnapshot.xp.toLocaleString('id-ID')} XP`
                          : `${accountLevelSnapshot.xp.toLocaleString('id-ID')} Total XP · Butuh ${(
                              accountLevelSnapshot.xpForNextLevel - accountLevelSnapshot.xpInCurrentLevel
                            ).toLocaleString('id-ID')} XP lagi ke Lv. ${accountLevelSnapshot.level + 1}`}
                      </span>
                    </div>
                  </div>
                  {pendingLevelSyncCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = claimPendingSyncLevelRewards();
                        setLevelSyncFeedback({
                          type: res.success ? 'success' : 'error',
                          text: res.message,
                        });
                      }}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Klaim {pendingLevelSyncCount} Hadiah Sinkronisasi Level</span>
                    </button>
                  )}
                </div>

                {!accountLevelSnapshot.isInfinity && (
                  <div className="space-y-1">
                    <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-amber-300 transition-all"
                        style={{ width: `${accountLevelSnapshot.progressPct}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                      <span>
                        XP didapat dari Transaksi, QRIS, Emas, Misi, Streak, Spin &amp; Klaim Achievement
                      </span>
                      {(() => {
                        const nextMs = normalizedLevelCfg.milestones.find(
                          (m) => m.enabled && m.levelTarget > accountLevelSnapshot.level
                        );
                        return nextMs ? (
                          <span className="text-amber-300 font-semibold">
                            Target Berikutnya Lv. {nextMs.levelTarget}: {formatMilestoneRewardSummary(nextMs)}
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                )}

                {levelSyncFeedback && (
                  <div
                    className={`rounded-xl px-3.5 py-2 text-xs font-semibold border ${
                      levelSyncFeedback.type === 'success'
                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
                    }`}
                  >
                    {levelSyncFeedback.text}
                  </div>
                )}
              </div>

              {/* Strip KPI Achievement + Tombol Klaim Semua */}
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Koleksi Achievement Bank Nusantara ({PROFILE_ACHIEVEMENTS.length})</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      12 Achievement unggulan membuka Gelar Eksklusif &amp; 16 Achievement lainnya menganugerahkan Piala + Poin Achievement (tanpa saldo).
                    </p>
                  </div>
                  {achievementBundle.readyCount > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = claimAllReadyProfileAchievements();
                        setAchievementFeedback({
                          type: res.success ? 'success' : 'error',
                          text: res.message,
                        });
                      }}
                      className="min-h-[38px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Klaim Semua ({achievementBundle.readyCount})</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-slate-500">Terklaim</p>
                    <p className="text-base font-black text-slate-900 font-mono tabular-nums mt-0.5">
                      {achievementBundle.claimedCount} / {PROFILE_ACHIEVEMENTS.length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
                    <p className="text-emerald-700 font-medium">Siap Diklaim</p>
                    <p className="text-base font-black text-emerald-900 font-mono tabular-nums mt-0.5">
                      {achievementBundle.readyCount} Item
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3">
                    <p className="text-amber-700 font-medium">Poin Achievement</p>
                    <p className="text-base font-black text-amber-950 font-mono tabular-nums mt-0.5">
                      {achievementBundle.totalPoints.toLocaleString('id-ID')} Poin
                    </p>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50/70 p-3">
                    <p className="text-indigo-700 font-medium">Gelar Terbuka</p>
                    <p className="text-base font-black text-indigo-950 font-mono tabular-nums mt-0.5">
                      {unlockedTitlesCount} / {FEATURED_TITLES.length}
                    </p>
                  </div>
                </div>

                {achievementFeedback && (
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                      achievementFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {achievementFeedback.text}
                  </div>
                )}

                {/* Filter Kategori & Status */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setAchCategoryFilter('all')}
                      className={`min-h-[32px] px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                        achCategoryFilter === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Semua Kategori ({PROFILE_ACHIEVEMENTS.length})
                    </button>
                    {(
                      Object.keys(
                        PROFILE_ACHIEVEMENT_CATEGORY_LABELS
                      ) as ProfileAchievementCategory[]
                    ).map((catKey) => (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setAchCategoryFilter(catKey)}
                        className={`min-h-[32px] px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                          achCategoryFilter === catKey
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {PROFILE_ACHIEVEMENT_CATEGORY_LABELS[catKey]}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        { id: 'all', label: 'Semua Status' },
                        { id: 'ready', label: `Siap Klaim (${achievementBundle.readyCount})` },
                        { id: 'claimed', label: `Terklaim (${achievementBundle.claimedCount})` },
                        {
                          id: 'locked',
                          label: `Terkunci (${
                            PROFILE_ACHIEVEMENTS.length -
                            achievementBundle.claimedCount -
                            achievementBundle.readyCount
                          })`,
                        },
                      ] as const
                    ).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setAchStatusFilter(st.id)}
                        className={`min-h-[30px] px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                          achStatusFilter === st.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid Kartu Achievement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {achievementBundle.items
                  .filter(
                    (it) =>
                      (achCategoryFilter === 'all' ||
                        it.definition.category === achCategoryFilter) &&
                      (achStatusFilter === 'all' || it.status === achStatusFilter)
                  )
                  .map((item) => {
                    const tierMeta = PROFILE_ACHIEVEMENT_TIER_META[item.definition.tier];
                    const fmtCurr = item.definition.formatValue
                      ? item.definition.formatValue(item.currentValue)
                      : String(item.currentValue);
                    const fmtTarget = item.definition.formatValue
                      ? item.definition.formatValue(item.targetValue)
                      : String(item.targetValue);

                    return (
                      <div
                        key={item.definition.id}
                        className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${
                          item.status === 'ready'
                            ? 'border-emerald-300 bg-emerald-50/40'
                            : item.status === 'claimed'
                            ? 'border-slate-200 bg-white'
                            : 'border-slate-200 bg-slate-50/75'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${
                                  item.status === 'claimed'
                                    ? 'bg-amber-50 border-amber-200 text-amber-600'
                                    : item.status === 'ready'
                                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                    : 'bg-slate-100 border-slate-200 text-slate-400'
                                }`}
                              >
                                <Trophy className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-xs font-extrabold text-slate-900 break-words">
                                  {item.definition.title}
                                </h4>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span
                                    className={`px-1.5 py-0.5 rounded border text-[10px] font-bold ${tierMeta.badgeClass}`}
                                  >
                                    {tierMeta.label}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-600">
                                    +{item.definition.points} Poin
                                  </span>
                                </div>
                              </div>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                item.status === 'claimed'
                                  ? 'bg-emerald-600 text-white'
                                  : item.status === 'ready'
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {item.status === 'claimed'
                                ? 'Terklaim'
                                : item.status === 'ready'
                                ? 'Siap Klaim'
                                : 'Terkunci'}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {item.definition.description}
                          </p>

                          <div className="rounded-lg bg-white border border-slate-200/80 px-2.5 py-2 space-y-1.5">
                            <p className="text-[11px] font-semibold text-slate-800">
                              Syarat: {item.definition.requirementLabel}
                            </p>
                            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-slate-500">
                              <span>
                                {fmtCurr} / {fmtTarget} {item.definition.unitLabel}
                              </span>
                              <span className="font-bold text-slate-700">{item.progressPct}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  item.status === 'claimed'
                                    ? 'bg-emerald-500'
                                    : item.status === 'ready'
                                    ? 'bg-amber-500'
                                    : tierMeta.barClass
                                }`}
                                style={{ width: `${item.progressPct}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                          <div className="min-w-0">
                            {item.rewardTitle ? (
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${item.rewardTitle.toneClass}`}
                              >
                                <Award className="w-3 h-3 shrink-0" />
                                <span className="truncate">Gelar: {item.rewardTitle.label}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500">
                                Hadiah: Piala &amp; +{item.definition.points} Poin (Tanpa Saldo)
                              </span>
                            )}
                          </div>

                          {item.status === 'ready' ? (
                            <button
                              type="button"
                              onClick={() => {
                                const res = claimProfileAchievement(item.definition.id);
                                setAchievementFeedback({
                                  type: res.success ? 'success' : 'error',
                                  text: res.message,
                                });
                              }}
                              className="min-h-[34px] px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold inline-flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Klaim</span>
                            </button>
                          ) : item.status === 'claimed' ? (
                            <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1 shrink-0">
                              <Check className="w-3.5 h-3.5" />
                              <span>Selesai</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400 inline-flex items-center gap-1 shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                              <span>{item.progressPct}%</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}

          {googleLinkStatus.message && (
            <div
              className={`rounded-xl px-3.5 py-2.5 text-xs font-medium border break-words ${
                googleLinkStatus.isError
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {googleLinkStatus.message}
            </div>
          )}
        </div>

        {/* Footer Aksi Resmi */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0 print:hidden">
          <div className="w-full sm:w-auto">
            {!isGoogleLinked && (
              <button
                type="button"
                disabled={googleLinkStatus.loading}
                onClick={handleLinkGoogle}
                className="w-full sm:w-auto min-h-[40px] justify-center px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Cloud className="w-4 h-4 shrink-0" />
                <span>{googleLinkStatus.loading ? 'Menghubungkan...' : 'Hubungkan Akun Google'}</span>
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto min-h-[40px] justify-center px-3 sm:px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold inline-flex items-center transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleOpenQuickAccountSwitch}
              className="w-full sm:w-auto min-h-[40px] justify-center px-3 sm:px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowLeftRight className="w-4 h-4 shrink-0" />
              <span>Ganti Akun</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full sm:w-auto min-h-[40px] justify-center px-3 sm:px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Keluar Akun</span>
            </button>
          </div>
        </div>

        {/* Popup Ganti Akun Cepat (Maks. 5 Akun Terverifikasi Terakhir + Masuk Akun Lain) */}
        {showQuickSwitchPopup && (
          <div
            className="fixed inset-0 z-[185] flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
            onClick={() => setShowQuickSwitchPopup(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                    <ArrowLeftRight className="w-4 h-4 text-indigo-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900">Ganti Akun Cepat</h3>
                    <p className="text-[11px] text-slate-600">
                      Pilih akun terverifikasi sebelumnya (maks. 5 akun) atau masuk akun lain.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickSwitchPopup(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                  aria-label="Tutup dialog ganti akun"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
                {quickSwitchFeedback && (
                  <div
                    className={`rounded-xl px-3 py-2 text-xs font-semibold border ${
                      quickSwitchFeedback.type === 'error'
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  >
                    {quickSwitchFeedback.text}
                  </div>
                )}

                {recentQuickSwitchAccounts.map((saved) => {
                  const isCurrent = saved.accountId === currentAccount.id;
                  const tierLabel =
                    CARD_TIER_CONFIGS[saved.cardTier]?.nameIndo ||
                    CARD_TIER_CONFIGS[saved.cardTier]?.name ||
                    saved.cardTier.toUpperCase();
                  return (
                    <div
                      key={saved.accountId}
                      className={`rounded-xl border p-3 flex items-center justify-between gap-2.5 transition-colors ${
                        isCurrent
                          ? 'bg-indigo-50/70 border-indigo-300'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleQuickSwitchToAccount(saved.accountId)}
                        className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                          {(saved.fullName || 'N').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-extrabold text-slate-900 truncate">
                              {saved.fullName}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold text-indigo-700 shrink-0">
                                · Sedang Dipakai
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono tabular-nums mt-0.5">
                            <span>{tierLabel}</span>
                            <span aria-hidden="true">·</span>
                            <span>•••• {saved.accountLast4}</span>
                          </div>
                        </div>
                      </button>

                      {!isCurrent && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQuickSwitchToAccount(saved.accountId)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold cursor-pointer whitespace-nowrap"
                          >
                            Pindah
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSavedQuickSwitchAccount(saved.accountId)}
                            className="min-w-[32px] min-h-[32px] rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                            title="Hapus dari daftar cepat"
                            aria-label={`Hapus ${saved.fullName} dari daftar cepat`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="px-4 py-3.5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Tombol Kembali tersedia di pojok kiri atas Lobi.
                </span>
                <button
                  type="button"
                  onClick={handleGoToLobbyForOtherAccount}
                  className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-4 h-4 shrink-0" />
                  <span>Masuk Akun Lain</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Popup Ganti Nama Menggunakan 50 Diamond (Tanpa PIN) */}
        {showRenamePopup && (
          <div
            className="fixed inset-0 z-[180] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
            onClick={() => setShowRenamePopup(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center shrink-0">
                    <Pencil className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold text-slate-900">Ganti Nama Profil</h3>
                    <p className="text-[11px] text-slate-600">
                      {isAdminCard
                        ? 'Kartu Tier Admin: Gratis (Diamond tetap ∞)'
                        : `Biaya ${PROFILE_RENAME_DIAMOND_COST} Diamond per pergantian (Tanpa PIN)`}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenamePopup(false)}
                  className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 cursor-pointer"
                  aria-label="Tutup dialog ganti nama"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmRenamePurchase} className="p-5 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600 font-medium">Nama Saat Ini</span>
                  <span className="font-bold text-slate-900 truncate">{currentAccount.fullName}</span>
                </div>

                <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
                  <span className="text-cyan-900 font-semibold">Total Diamond Anda</span>
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-cyan-950 font-mono tabular-nums">
                    <DiamondIcon className="h-4 w-4" />
                    <span>{totalDiamondText}</span>
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label htmlFor="profile-rename-input" className="font-bold text-slate-800">
                      Masukkan Nama Baru (Min. 3 Huruf)
                    </label>
                    <span className="font-mono tabular-nums text-[11px] text-slate-500">
                      {cleanRenameTrim.length}/60
                    </span>
                  </div>
                  <input
                    id="profile-rename-input"
                    type="text"
                    autoFocus
                    maxLength={60}
                    value={renameInput}
                    onChange={(e) => {
                      setRenameInput(e.target.value);
                      if (renameFeedback) setRenameFeedback(null);
                    }}
                    placeholder="Ketik nama lengkap baru (min. 3 huruf)..."
                    className="w-full min-h-[44px] px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  {!isRenameValidLen && cleanRenameTrim.length > 0 && (
                    <p className="mt-1 text-[11px] font-semibold text-rose-600">
                      Nama wajib berisi minimal 3 huruf/karakter.
                    </p>
                  )}
                </div>

                {renameFeedback && (
                  <div
                    className={`rounded-xl px-3.5 py-2.5 text-xs font-semibold border ${
                      renameFeedback.type === 'success'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    <p>{renameFeedback.text}</p>
                    {renameFeedback.insufficientDiamonds && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowRenamePopup(false);
                          onClose();
                          setIsDiamondStoreOpen(true);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold cursor-pointer"
                      >
                        <DiamondIcon className="h-3.5 w-3.5" />
                        <span>Isi Ulang Diamond QRIS</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Tombol Konfirmasi Pembelian tepat di bawah kolom input nama */}
                <button
                  type="submit"
                  disabled={!isRenameValidLen || isRenameSameAsCurrent || !hasEnoughDiamondsForRename}
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <DiamondIcon className="h-4 w-4 shrink-0" />
                  <span className="font-mono tabular-nums">
                    {isAdminCard
                      ? `∞ (${totalDiamondText})`
                      : `${PROFILE_RENAME_DIAMOND_COST} / ${totalDiamondText}`}
                  </span>
                  <span>— Konfirmasi Beli &amp; Ganti Nama</span>
                </button>

                {!hasEnoughDiamondsForRename && !isAdminCard && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setShowRenamePopup(false);
                        onClose();
                        setIsDiamondStoreOpen(true);
                      }}
                      className="text-xs font-bold text-cyan-700 hover:text-cyan-900 underline cursor-pointer"
                    >
                      Diamond kurang ({totalDiamondText} / 50) — Top Up via QRIS
                    </button>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 text-center">
                  Nama baru langsung tersinkron ke Navbar, Kartu ATM, Transfer, PayChat, QRIS, Leaderboard &amp; tercatat di Mutasi Rekening.
                </p>
              </form>
            </div>
          </div>
        )}

        {/* Modal Scanner Khusus QRP Nasabah (scannerPurpose="qrp_only") */}
        <QrisScannerModal
          isOpen={isQrpScannerOpen}
          onClose={() => setIsQrpScannerOpen(false)}
          scannerPurpose="qrp_only"
          onDetected={(rawText, source) => {
            setIsQrpScannerOpen(false);
            const qrp = parseQrpProfilePayload(rawText);
            if (qrp.targetAccount || qrp.targetUserId) {
              window.dispatchEvent(
                new CustomEvent('bn:open-qrp-profile', {
                  detail: {
                    targetAccount: qrp.targetAccount,
                    targetUserId: qrp.targetUserId,
                    targetName: qrp.targetName,
                    source,
                  },
                })
              );
            }
          }}
        />
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
};
