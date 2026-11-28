import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  Target,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  QrCode,
  Copy,
  Check,
  Download,
  ScanLine,
  BarChart3,
  FileSpreadsheet,
  Printer,
  Trophy,
  Flame,
  Gift,
  Coins,
  ShieldAlert,
  Lock,
  Unlock,
  Snowflake,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Wallet,
  Banknote,
  Ticket,
  Search,
  ExternalLink,
  Clock,
  ShieldCheck,
  RotateCcw,
  Link2,
  ArrowRight,
  History,
  X,
  Camera,
  ImageUp,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';
import {
  DAILY_ACHIEVEMENT_CATALOG,
  DREAM_POCKET_PRESETS,
} from '../data/socialAndBankingExtrasCatalog';
import { DiamondText } from './DiamondIcon';
import { QrisScannerModal } from './QrisScannerModal';
import {
  LOYALTY_MISSION_CATEGORY_META,
  MANDATORY_TRANSFER_ADMIN_FEE_PERCENT,
  ResolvedLoyaltyRedeemPackage,
  calculateExactPackageRedemption,
  calculateMandatoryTransferFee,
  computeDailyTxActivityStats,
  computeStreakVisualSnapshot,
  ensureTodayLoyaltyAccountState,
  evaluateDailyLoyaltyMissionProgress,
  formatLoyaltyRewardLabel,
  formatMissionResetCountdown,
  getEffectiveAchievementRewardPoints,
  getEffectiveDailyLoyaltyMissions,
  getResolvedLoyaltyRedeemPackages,
  getWibDateString,
  normalizeLoyaltyAdminConfig,
  resolveMissionResetCycleWindow,
} from '../utils/loyaltySystemUtils';
import {
  PersonalQrisSubMode,
  formatMultiAssetSummaryLabel,
  isSelfQrisTransferTarget,
  parsePersonalQrisPayload,
  parseQrpProfilePayload,
  readPersonalQrisAdminPolicy,
  savePendingQrisTransfer,
} from '../utils/qrisTransferUtils';
import {
  LoyaltyDailyMissionCategory,
  TransferBebasAssetMode,
  TransferBebasReceipt,
} from '../types/bank';

export type MobileBankingExtraTabKey =
  | 'kantong_impian'
  | 'qris_pribadi'
  | 'analitik'
  | 'loyalty'
  | 'brankas';

interface MobileBankingExtraTabsProps {
  activeTab: MobileBankingExtraTabKey;
}

interface ParsedQrisTransferTarget {
  recipientAccount: string;
  recipientBank: string;
  recipientName?: string;
  qrisSubMode: PersonalQrisSubMode;
  lockAmountAndAsset: boolean;
  expiresAtMs?: number;
  isExpired?: boolean;
  assetMode?: TransferBebasAssetMode;
  amount: number;
  goldRupiahAmount?: number;
  coinAmount?: number;
  diamondAmount?: number;
  tokenAmount?: number;
  note: string;
  sourceKind: 'url' | 'legacy_qr' | 'uid' | 'account' | 'unknown';
  isQrpProfileLink?: boolean;
  qrpTargetAccount?: string;
  qrpTargetUserId?: string;
  qrpTargetName?: string;
}

function parseQrisTransferInput(
  rawInput: string,
  accounts: Array<{ accountNumber: string; userId16?: string; fullName: string }>
): ParsedQrisTransferTarget {
  const trimmed = rawInput.trim();
  const fallback: ParsedQrisTransferTarget = {
    recipientAccount: '',
    recipientBank: 'Bank Nusantara',
    qrisSubMode: 'tf',
    lockAmountAndAsset: false,
    assetMode: 'uang',
    amount: 0,
    note: '',
    sourceKind: 'unknown',
  };
  if (!trimmed) return fallback;

  // 0. Deteksi jika yang ditempel adalah Link QRP (QR Profil Statistik Umum) -> Salah Kamera / Salah Menu
  const qrpCheck = parseQrpProfilePayload(trimmed);
  if (qrpCheck.sourceKind === 'url' && (qrpCheck.targetAccount || qrpCheck.targetUserId)) {
    const matchedQrp = accounts.find(
      (a) =>
        (qrpCheck.targetAccount && a.accountNumber === qrpCheck.targetAccount) ||
        (qrpCheck.targetUserId && a.userId16 === qrpCheck.targetUserId)
    );
    return {
      ...fallback,
      isQrpProfileLink: true,
      qrpTargetAccount: matchedQrp?.accountNumber || qrpCheck.targetAccount,
      qrpTargetUserId: matchedQrp?.userId16 || qrpCheck.targetUserId,
      qrpTargetName: qrpCheck.targetName || matchedQrp?.fullName,
    };
  }

  // 1. Parse URL deep-link (?qris_transfer=1&qris_mode=tf|minta&lock=0|1&exp=...&to=...&asset=...&amt=...&gold_rp=...&coin=...&diamond=...&token=...)
  const personalParsed = parsePersonalQrisPayload(trimmed);
  if (personalParsed.sourceKind === 'url' && (personalParsed.recipientAccount || personalParsed.recipientUserId)) {
    let resolvedAcc = personalParsed.recipientAccount;
    let resolvedName = personalParsed.recipientName;
    if (!resolvedAcc && personalParsed.recipientUserId) {
      const byUid = accounts.find((a) => a.userId16 === personalParsed.recipientUserId);
      if (byUid) {
        resolvedAcc = byUid.accountNumber;
        if (!resolvedName) resolvedName = byUid.fullName;
      }
    } else if (resolvedAcc && !resolvedName) {
      const byAcc = accounts.find((a) => a.accountNumber === resolvedAcc);
      if (byAcc) resolvedName = byAcc.fullName;
    }
    if (resolvedAcc) {
      return {
        recipientAccount: resolvedAcc,
        recipientBank: personalParsed.recipientBank || 'Bank Nusantara',
        recipientName: resolvedName || undefined,
        qrisSubMode: personalParsed.qrisSubMode,
        lockAmountAndAsset: personalParsed.lockAmountAndAsset,
        expiresAtMs: personalParsed.expiresAtMs,
        isExpired: personalParsed.isExpired,
        assetMode: personalParsed.assetMode || 'uang',
        amount: personalParsed.amount,
        goldRupiahAmount: personalParsed.goldRupiahAmount,
        coinAmount: personalParsed.coinAmount,
        diamondAmount: personalParsed.diamondAmount,
        tokenAmount: personalParsed.tokenAmount,
        note: personalParsed.note,
        sourceKind: 'url',
      };
    }
  }

  // 2. Legacy BNUS-QRPAY|ACC:...|UID:...|NAME:...|AMT:...
  if (trimmed.startsWith('BNUS-QRPAY|')) {
    const parts = Object.fromEntries(
      trimmed
        .split('|')
        .slice(1)
        .map((seg) => {
          const idx = seg.indexOf(':');
          return idx > 0 ? [seg.slice(0, idx), seg.slice(idx + 1)] : [seg, ''];
        })
    );
    const acc = (parts.ACC || '').trim();
    const uid = (parts.UID || '').trim();
    const matched = accounts.find((a) => a.accountNumber === acc || (uid && a.userId16 === uid));
    const amt = Math.max(0, Math.round(Number(parts.AMT) || 0));
    return {
      recipientAccount: matched?.accountNumber || acc,
      recipientBank: 'Bank Nusantara',
      recipientName: parts.NAME || matched?.fullName,
      qrisSubMode: amt > 0 ? 'minta' : 'tf',
      lockAmountAndAsset: amt > 0,
      amount: amt,
      note: (parts.NOTE || '').trim(),
      sourceKind: 'legacy_qr',
    };
  }

  // 3. 16-digit User ID
  const digitsOnly = trimmed.replace(/\s+/g, '');
  if (/^\d{16}$/.test(digitsOnly)) {
    const matched = accounts.find((a) => a.userId16 === digitsOnly);
    return {
      recipientAccount: matched?.accountNumber || '',
      recipientBank: 'Bank Nusantara',
      recipientName: matched?.fullName,
      qrisSubMode: 'tf',
      lockAmountAndAsset: false,
      amount: 0,
      note: '',
      sourceKind: 'uid',
    };
  }

  // 4. 8–12 digit Account Number
  if (/^\d{8,12}$/.test(digitsOnly)) {
    const matched = accounts.find((a) => a.accountNumber === digitsOnly);
    return {
      recipientAccount: digitsOnly,
      recipientBank: 'Bank Nusantara',
      recipientName: matched?.fullName,
      qrisSubMode: 'tf',
      lockAmountAndAsset: false,
      amount: 0,
      note: '',
      sourceKind: 'account',
    };
  }

  return fallback;
}

export const MobileBankingExtraTabs: React.FC<MobileBankingExtraTabsProps> = ({ activeTab }) => {
  const {
    currentAccount,
    accounts,
    currentAccountTransactions,
    dreamPockets,
    dreamPocketConfig,
    createDreamPocket,
    depositToDreamPocket,
    withdrawFromDreamPocket,
    deleteDreamPocket,
    safeVaultMap,
    getUnlockedAvailableBalance,
    lockBalanceToSafeVault,
    unlockBalanceFromSafeVault,
    toggleCardFreezeWithPin,
    loyaltyMap,
    loyaltyConfig,
    claimAchievementReward,
    claimDailyCheckIn,
    claimDailyLoyaltyMission,
    claimAllReadyLoyaltyMissions,
    buyStreakRecoveryCard,
    useStreakRecoveryCard,
    forfeitFrozenStreak,
    redeemLoyaltyPoints,
    transferMoney,
    transferBebas,
    chatStatuses,
    sendGlobalChatMessage,
    sendChatMessage,
    privateChatGroups,
  } = useBank();

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State: Kantong Impian
  const [pocketName, setPocketName] = useState('');
  const [pocketPresetIdx, setPocketPresetIdx] = useState(0);
  const [pocketTarget, setPocketTarget] = useState('1000000');
  const [pocketDeadline, setPocketDeadline] = useState('');
  const [pocketAmounts, setPocketAmounts] = useState<Record<string, string>>({});

  // State: QRIS Rekening Pribadi (2 Mode: QRIS TF & QRIS MINTA + Multi-Aset Creator & Instant Payment)
  const [personalQrUrl, setPersonalQrUrl] = useState('');
  const [qrisCreatorSubMode, setQrisCreatorSubMode] = useState<PersonalQrisSubMode>('tf');
  const [qrRequestAssetMode, setQrRequestAssetMode] = useState<TransferBebasAssetMode>('uang');
  const [qrRequestAmount, setQrRequestAmount] = useState('');
  const [qrRequestGoldRp, setQrRequestGoldRp] = useState('');
  const [qrRequestCoin, setQrRequestCoin] = useState('');
  const [qrRequestDiamond, setQrRequestDiamond] = useState('');
  const [qrRequestToken, setQrRequestToken] = useState('');
  const [qrRequestNote, setQrRequestNote] = useState('');
  const [qrMintaExpiryPreset, setQrMintaExpiryPreset] = useState<
    'unlimited' | '15m' | '1h' | '24h'
  >('unlimited');
  const [qrMintaCreatedAtMs, setQrMintaCreatedAtMs] = useState<number>(() => Date.now());
  const [showSharePayChatPicker, setShowSharePayChatPicker] = useState<boolean>(false);
  const [payChatTargetKind, setPayChatTargetKind] = useState<'global' | 'dm' | 'group'>('global');
  const [payChatTargetDmAccount, setPayChatTargetDmAccount] = useState<string>('');
  const [payChatTargetGroupId, setPayChatTargetGroupId] = useState<string>('');
  const [qrisAdminPolicy, setQrisAdminPolicy] = useState(() => readPersonalQrisAdminPolicy());

  useEffect(() => {
    const syncPolicy = () => setQrisAdminPolicy(readPersonalQrisAdminPolicy());
    window.addEventListener('bn:personal-qris-policy-updated', syncPolicy);
    return () => window.removeEventListener('bn:personal-qris-policy-updated', syncPolicy);
  }, []);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scanInputCode, setScanInputCode] = useState('');
  const [scanAssetMode, setScanAssetMode] = useState<TransferBebasAssetMode>('uang');
  const [scanPayAmount, setScanPayAmount] = useState('');
  const [scanPayGoldRp, setScanPayGoldRp] = useState('');
  const [scanPayCoin, setScanPayCoin] = useState('');
  const [scanPayDiamond, setScanPayDiamond] = useState('');
  const [scanPayToken, setScanPayToken] = useState('');
  const [scanPayNote, setScanPayNote] = useState('');
  const [scanPayPin, setScanPayPin] = useState('');
  const [instantMultiAssetReceipt, setInstantMultiAssetReceipt] =
    useState<TransferBebasReceipt | null>(null);
  const [qrisScannerModal, setQrisScannerModal] = useState<{
    open: boolean;
    mode: 'camera' | 'gallery';
  }>({ open: false, mode: 'camera' });

  // State: Brankas & Freeze Kartu
  const [vaultAmount, setVaultAmount] = useState('');
  const [vaultPin, setVaultPin] = useState('');
  const [freezePin, setFreezePin] = useState('');

  // State: Loyalty & 100 Misi Harian
  const [redeemDrafts, setRedeemDrafts] = useState<
    Record<string, { mode: 'multiplier' | 'points'; value: string }>
  >({});
  const [pendingRedeemModal, setPendingRedeemModal] = useState<{
    pkg: ResolvedLoyaltyRedeemPackage;
    inputMode: 'multiplier' | 'points';
    inputValue: number;
  } | null>(null);
  const [showAllRedeemHistory, setShowAllRedeemHistory] = useState<boolean>(false);
  const [recoveryBuyQty, setRecoveryBuyQty] = useState<number>(1);
  const [missionCategoryFilter, setMissionCategoryFilter] = useState<'all' | LoyaltyDailyMissionCategory>('all');
  const [missionStatusFilter, setMissionStatusFilter] = useState<'all' | 'ready' | 'in_progress' | 'claimed'>('all');
  const [missionSearchQuery, setMissionSearchQuery] = useState('');
  const [missionVisibleLimit, setMissionVisibleLimit] = useState<number>(20);
  const [loyaltySubView, setLoyaltySubView] = useState<'daily_100' | 'milestones'>('daily_100');

  const isAdminCard = Boolean(
    currentAccount && (currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance))
  );

  const normalizedLoyaltyConfig = useMemo(
    () => normalizeLoyaltyAdminConfig(loyaltyConfig),
    [loyaltyConfig]
  );

  const [loyaltyClockMs, setLoyaltyClockMs] = useState<number>(() => Date.now());
  useEffect(() => {
    if (activeTab !== 'loyalty') return;
    setLoyaltyClockMs(Date.now());
    const id = window.setInterval(() => setLoyaltyClockMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeTab]);

  const cycleBucket10s = Math.floor(loyaltyClockMs / 10_000);
  const missionCycle = useMemo(
    () => resolveMissionResetCycleWindow(normalizedLoyaltyConfig, loyaltyClockMs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [normalizedLoyaltyConfig, cycleBucket10s]
  );

  const computedQrMintaExpiresAtMs = useMemo(() => {
    if (qrisCreatorSubMode !== 'minta' || qrMintaExpiryPreset === 'unlimited') return undefined;
    const base = qrMintaCreatedAtMs || Date.now();
    if (qrMintaExpiryPreset === '15m') return base + 15 * 60 * 1000;
    if (qrMintaExpiryPreset === '1h') return base + 60 * 60 * 1000;
    if (qrMintaExpiryPreset === '24h') return base + 24 * 60 * 60 * 1000;
    return undefined;
  }, [qrisCreatorSubMode, qrMintaExpiryPreset, qrMintaCreatedAtMs]);

  // Personal QRIS menyimpan Link Transfer Multi-Aset Resmi Bank Nusantara (QRIS TF vs QRIS MINTA)
  const personalQrTransferLink = useMemo(() => {
    if (!currentAccount) return '';
    const origin =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://banknusantara.app';
    const params = new URLSearchParams();
    params.set('qris_transfer', '1');
    params.set('qris_mode', qrisCreatorSubMode);
    params.set('lock', qrisCreatorSubMode === 'minta' ? '1' : '0');
    params.set('to', currentAccount.accountNumber);
    params.set('uid', currentAccount.userId16 || currentAccount.accountNumber);
    params.set('name', currentAccount.fullName);
    params.set('bank', 'Bank Nusantara');
    params.set('asset', qrRequestAssetMode);

    if (qrisCreatorSubMode === 'minta') {
      const amt = Math.max(0, Math.round(Number(qrRequestAmount) || 0));
      const goldRp = Math.max(0, Math.round(Number(qrRequestGoldRp) || 0));
      const coin = Math.max(0, Math.round(Number(qrRequestCoin) || 0));
      const diamond = Math.max(0, Math.round(Number(qrRequestDiamond) || 0));
      const token = Math.max(0, Math.round(Number(qrRequestToken) || 0));
      if (amt > 0 && (qrRequestAssetMode === 'uang' || qrRequestAssetMode === 'gabungan')) {
        params.set('amt', String(amt));
      }
      if (goldRp > 0 && (qrRequestAssetMode === 'emas' || qrRequestAssetMode === 'gabungan')) {
        params.set('gold_rp', String(goldRp));
      }
      if (coin > 0 && (qrRequestAssetMode === 'coin' || qrRequestAssetMode === 'gabungan')) {
        params.set('coin', String(coin));
      }
      if (diamond > 0 && (qrRequestAssetMode === 'permata' || qrRequestAssetMode === 'gabungan')) {
        params.set('diamond', String(diamond));
      }
      if (token > 0 && (qrRequestAssetMode === 'token' || qrRequestAssetMode === 'gabungan')) {
        params.set('token', String(token));
      }
      if (computedQrMintaExpiresAtMs) {
        params.set('exp', String(computedQrMintaExpiresAtMs));
      }
    }
    const note = qrRequestNote.trim();
    if (note) params.set('note', note);
    return `${origin}/?${params.toString()}`;
  }, [
    currentAccount,
    qrisCreatorSubMode,
    qrRequestAssetMode,
    qrRequestAmount,
    qrRequestGoldRp,
    qrRequestCoin,
    qrRequestDiamond,
    qrRequestToken,
    qrRequestNote,
    computedQrMintaExpiresAtMs,
  ]);

  const qrCreatorAssetSummaryLabel = useMemo(() => {
    if (qrisCreatorSubMode === 'tf') {
      const modeNameMap: Record<TransferBebasAssetMode, string> = {
        uang: 'Saldo Rupiah (Nominal & Aset Bebas Diisi Pengirim)',
        emas: 'Emas 24K (Nominal & Aset Bebas Diisi Pengirim)',
        coin: 'Coin Spin (Jumlah & Aset Bebas Diisi Pengirim)',
        permata: 'Permata / Diamond (Jumlah & Aset Bebas Diisi Pengirim)',
        token: 'Token Bingkai (Jumlah & Aset Bebas Diisi Pengirim)',
        gabungan: 'Multi-Aset Gabungan (Bebas Diisi Pengirim)',
      };
      return modeNameMap[qrRequestAssetMode] || 'Transfer Bebas 6 Aset';
    }
    return formatMultiAssetSummaryLabel({
      assetMode: qrRequestAssetMode,
      amount: Math.max(0, Math.round(Number(qrRequestAmount) || 0)),
      goldRupiahAmount: Math.max(0, Math.round(Number(qrRequestGoldRp) || 0)),
      coinAmount: Math.max(0, Math.round(Number(qrRequestCoin) || 0)),
      diamondAmount: Math.max(0, Math.round(Number(qrRequestDiamond) || 0)),
      tokenAmount: Math.max(0, Math.round(Number(qrRequestToken) || 0)),
    });
  }, [
    qrisCreatorSubMode,
    qrRequestAssetMode,
    qrRequestAmount,
    qrRequestGoldRp,
    qrRequestCoin,
    qrRequestDiamond,
    qrRequestToken,
  ]);

  useEffect(() => {
    if (activeTab !== 'qris_pribadi' || !personalQrTransferLink) return;
    let mounted = true;
    void QRCode.toDataURL(personalQrTransferLink, {
      width: 320,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        if (mounted) setPersonalQrUrl(url);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [activeTab, personalQrTransferLink]);

  const parsedScanTarget = useMemo(
    () => parseQrisTransferInput(scanInputCode, accounts),
    [scanInputCode, accounts]
  );

  const isScannedQrisMintaLocked = Boolean(
    parsedScanTarget.recipientAccount &&
      parsedScanTarget.qrisSubMode === 'minta' &&
      parsedScanTarget.lockAmountAndAsset &&
      qrisAdminPolicy.enforceQrisMintaLock
  );

  const isScannedQrisExpired = Boolean(
    parsedScanTarget.recipientAccount &&
      parsedScanTarget.qrisSubMode === 'minta' &&
      parsedScanTarget.expiresAtMs &&
      Date.now() > parsedScanTarget.expiresAtMs
  );

  // Otomatis isi jenis aset & jumlah ketika hasil scan QRIS terdeteksi
  useEffect(() => {
    if (!parsedScanTarget.recipientAccount) return;
    if (parsedScanTarget.assetMode) {
      setScanAssetMode(parsedScanTarget.assetMode);
    }
    if (parsedScanTarget.qrisSubMode === 'minta') {
      setScanPayAmount(parsedScanTarget.amount > 0 ? String(parsedScanTarget.amount) : '');
      setScanPayGoldRp(
        (parsedScanTarget.goldRupiahAmount || 0) > 0
          ? String(parsedScanTarget.goldRupiahAmount)
          : ''
      );
      setScanPayCoin(
        (parsedScanTarget.coinAmount || 0) > 0 ? String(parsedScanTarget.coinAmount) : ''
      );
      setScanPayDiamond(
        (parsedScanTarget.diamondAmount || 0) > 0 ? String(parsedScanTarget.diamondAmount) : ''
      );
      setScanPayToken(
        (parsedScanTarget.tokenAmount || 0) > 0 ? String(parsedScanTarget.tokenAmount) : ''
      );
    } else {
      if (parsedScanTarget.amount > 0) setScanPayAmount(String(parsedScanTarget.amount));
      if ((parsedScanTarget.goldRupiahAmount || 0) > 0)
        setScanPayGoldRp(String(parsedScanTarget.goldRupiahAmount));
      if ((parsedScanTarget.coinAmount || 0) > 0)
        setScanPayCoin(String(parsedScanTarget.coinAmount));
      if ((parsedScanTarget.diamondAmount || 0) > 0)
        setScanPayDiamond(String(parsedScanTarget.diamondAmount));
      if ((parsedScanTarget.tokenAmount || 0) > 0)
        setScanPayToken(String(parsedScanTarget.tokenAmount));
    }
    if (parsedScanTarget.note) {
      setScanPayNote(parsedScanTarget.note);
    }
  }, [
    parsedScanTarget.recipientAccount,
    parsedScanTarget.qrisSubMode,
    parsedScanTarget.assetMode,
    parsedScanTarget.amount,
    parsedScanTarget.goldRupiahAmount,
    parsedScanTarget.coinAmount,
    parsedScanTarget.diamondAmount,
    parsedScanTarget.tokenAmount,
    parsedScanTarget.note,
  ]);

  const effectiveScanAmount = useMemo(() => {
    if (isScannedQrisMintaLocked && parsedScanTarget.amount > 0) {
      return parsedScanTarget.amount;
    }
    const manual = Math.max(0, Math.round(Number(scanPayAmount) || 0));
    return manual > 0 ? manual : parsedScanTarget.amount;
  }, [isScannedQrisMintaLocked, scanPayAmount, parsedScanTarget.amount]);

  const effectiveScanGoldRp = useMemo(() => {
    if (isScannedQrisMintaLocked && (parsedScanTarget.goldRupiahAmount || 0) > 0) {
      return parsedScanTarget.goldRupiahAmount || 0;
    }
    const manual = Math.max(0, Math.round(Number(scanPayGoldRp) || 0));
    return manual > 0 ? manual : parsedScanTarget.goldRupiahAmount || 0;
  }, [isScannedQrisMintaLocked, scanPayGoldRp, parsedScanTarget.goldRupiahAmount]);

  const effectiveScanCoin = useMemo(() => {
    if (isScannedQrisMintaLocked && (parsedScanTarget.coinAmount || 0) > 0) {
      return parsedScanTarget.coinAmount || 0;
    }
    const manual = Math.max(0, Math.round(Number(scanPayCoin) || 0));
    return manual > 0 ? manual : parsedScanTarget.coinAmount || 0;
  }, [isScannedQrisMintaLocked, scanPayCoin, parsedScanTarget.coinAmount]);

  const effectiveScanDiamond = useMemo(() => {
    if (isScannedQrisMintaLocked && (parsedScanTarget.diamondAmount || 0) > 0) {
      return parsedScanTarget.diamondAmount || 0;
    }
    const manual = Math.max(0, Math.round(Number(scanPayDiamond) || 0));
    return manual > 0 ? manual : parsedScanTarget.diamondAmount || 0;
  }, [isScannedQrisMintaLocked, scanPayDiamond, parsedScanTarget.diamondAmount]);

  const effectiveScanToken = useMemo(() => {
    if (isScannedQrisMintaLocked && (parsedScanTarget.tokenAmount || 0) > 0) {
      return parsedScanTarget.tokenAmount || 0;
    }
    const manual = Math.max(0, Math.round(Number(scanPayToken) || 0));
    return manual > 0 ? manual : parsedScanTarget.tokenAmount || 0;
  }, [isScannedQrisMintaLocked, scanPayToken, parsedScanTarget.tokenAmount]);

  const effectiveScanFee = useMemo(
    () => calculateMandatoryTransferFee(effectiveScanAmount),
    [effectiveScanAmount]
  );

  const showNotice = (res: { success: boolean; message: string }) => {
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
  };

  const copyValue = async (val: string, key: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedId(key);
      window.setTimeout(() => setCopiedId(null), 1600);
    } catch { /* empty */ }
  };

  const handleDownloadPersonalQrisCardPng = async () => {
    if (!currentAccount || !personalQrUrl) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 760;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isMinta = qrisCreatorSubMode === 'minta';
      // Background gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (isMinta) {
        bgGrad.addColorStop(0, '#062019');
        bgGrad.addColorStop(0.5, '#091926');
        bgGrad.addColorStop(1, '#1c1406');
      } else {
        bgGrad.addColorStop(0, '#07162c');
        bgGrad.addColorStop(0.5, '#0b1930');
        bgGrad.addColorStop(1, '#06212e');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer border
      ctx.strokeStyle = isMinta ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

      // Header Badge
      ctx.fillStyle = isMinta ? '#f59e0b' : '#0284c7';
      ctx.fillRect(50, 52, canvas.width - 100, 62);
      ctx.fillStyle = isMinta ? '#090d16' : '#ffffff';
      ctx.font = '900 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        isMinta
          ? 'QRIS MINTA • TAGIHAN & PERMINTAAN ASET'
          : 'QRIS TF • UNTUK MENTRANSFER MULTI-ASET',
        canvas.width / 2,
        91
      );

      // Account Owner Info
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px sans-serif';
      ctx.fillText(currentAccount.fullName, canvas.width / 2, 168);

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(
        `No. Rek: ${currentAccount.accountNumber}  •  ID: ${currentAccount.userId16 || '-'}`,
        canvas.width / 2,
        204
      );

      // White QR Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(150, 236, 460, 460);
      ctx.strokeStyle = isMinta ? '#f59e0b' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.strokeRect(150, 236, 460, 460);

      const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (err) => reject(err);
        img.src = personalQrUrl;
      });
      ctx.drawImage(qrImg, 175, 261, 410, 410);

      // Status & Asset Summary Box
      ctx.fillStyle = isMinta ? '#451a03' : '#082f49';
      ctx.fillRect(55, 726, canvas.width - 110, 128);
      ctx.strokeStyle = isMinta ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(55, 726, canvas.width - 110, 128);

      ctx.fillStyle = isMinta ? '#fde68a' : '#7dd3fc';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(
        isMinta
          ? 'PERMINTAAN TERKUNCI (NOMINAL & ASET SESUAI TAGIHAN):'
          : 'MODE TRANSFER BEBAS (PENGIRIM BEBAS ISI NOMINAL & ASET):',
        canvas.width / 2,
        762
      );

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 22px sans-serif';
      ctx.fillText(qrCreatorAssetSummaryLabel.slice(0, 48), canvas.width / 2, 798);

      if (qrRequestNote.trim()) {
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'italic 17px sans-serif';
        ctx.fillText(`Catatan: "${qrRequestNote.trim().slice(0, 52)}"`, canvas.width / 2, 834);
      } else {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px sans-serif';
        ctx.fillText(
          isMinta && computedQrMintaExpiresAtMs
            ? `Berlaku s/d ${new Date(computedQrMintaExpiresAtMs).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })} WIB`
            : 'Berlaku Berkali-kali • PT Bank Nusantara (Persero) Tbk',
          canvas.width / 2,
          834
        );
      }

      // Footer
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(
        'Pindai dengan Kamera Scan Universal M-Banking, Kamera Transfer, atau Google Lens',
        canvas.width / 2,
        925
      );

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = isMinta
        ? `QRIS-MINTA-Bank-Nusantara-${currentAccount.accountNumber}.png`
        : `QRIS-TF-Bank-Nusantara-${currentAccount.accountNumber}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showNotice({
        success: true,
        message: isMinta
          ? `Kartu PNG QRIS MINTA (${currentAccount.accountNumber}) berhasil diunduh!`
          : `Kartu PNG QRIS TF (${currentAccount.accountNumber}) berhasil diunduh!`,
      });
    } catch {
      showNotice({
        success: false,
        message: 'Gagal membuat gambar PNG kartu QRIS. Silakan coba lagi.',
      });
    }
  };

  const handleShareQrisToPayChat = async () => {
    if (!currentAccount || !personalQrTransferLink) return;
    const isMinta = qrisCreatorSubMode === 'minta';
    const modeBadge = isMinta ? '📥 [QRIS MINTA • TAGIHAN PERMINTAAN]' : '📤 [QRIS TF • UNTUK MENTRANSFER]';
    const expiryInfo =
      isMinta && computedQrMintaExpiresAtMs
        ? `\n⏳ Batas Waktu: s/d ${new Date(computedQrMintaExpiresAtMs).toLocaleString('id-ID')}`
        : '\n♾️ Masa Berlaku: Bebas dipakai berkali-kali';
    const reasonInfo = qrRequestNote.trim() ? `\n📝 Catatan: ${qrRequestNote.trim()}` : '';
    const messageText = `${modeBadge}\n👤 ${currentAccount.fullName} (Rek: ${currentAccount.accountNumber})\n💎 Aset: ${qrCreatorAssetSummaryLabel}${reasonInfo}${expiryInfo}\n🔗 Link Scan & Bayar QRIS: ${personalQrTransferLink}`;

    if (payChatTargetKind === 'global') {
      const res = await sendGlobalChatMessage({
        text: messageText,
      });
      showNotice({
        success: res.success,
        message: res.success
          ? `Kartu ${isMinta ? 'QRIS MINTA' : 'QRIS TF'} berhasil dibagikan ke Chat Global Nusantara!`
          : res.message,
      });
      setShowSharePayChatPicker(false);
      return;
    }

    if (payChatTargetKind === 'dm') {
      const targetAcc = accounts.find(
        (a) => a.accountNumber === payChatTargetDmAccount || a.id === payChatTargetDmAccount
      );
      if (!targetAcc) {
        showNotice({
          success: false,
          message: 'Pilih kontak tujuan pesan pribadi (DM) terlebih dahulu.',
        });
        return;
      }
      sendChatMessage({
        recipientAccount: targetAcc.accountNumber,
        recipientAccountId: targetAcc.id,
        recipientName: targetAcc.fullName,
        text: messageText,
      });
      showNotice({
        success: true,
        message: `Kartu ${isMinta ? 'QRIS MINTA' : 'QRIS TF'} berhasil dikirim ke chat ${targetAcc.fullName}!`,
      });
      setShowSharePayChatPicker(false);
      return;
    }

    if (payChatTargetKind === 'group') {
      const grp = privateChatGroups.find((g) => g.id === payChatTargetGroupId);
      if (!grp) {
        showNotice({
          success: false,
          message: 'Pilih Grup PayChat tujuan terlebih dahulu.',
        });
        return;
      }
      sendChatMessage({
        recipientAccount: `GROUP:${grp.id}`,
        recipientName: grp.name,
        groupId: grp.id,
        text: messageText,
      });
      showNotice({
        success: true,
        message: `Kartu ${isMinta ? 'QRIS MINTA' : 'QRIS TF'} berhasil dikirim ke grup "${grp.name}"!`,
      });
      setShowSharePayChatPicker(false);
    }
  };

  // Monthly Analytics calculation
  const analytics = useMemo(() => {
    const now = new Date();
    const months: Array<{ key: string; label: string; income: number; expense: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short' });
      months.push({ key, label, income: 0, expense: 0 });
    }
    const categoryTotals: Record<string, number> = {
      Transfer: 0,
      Tagihan: 0,
      Investasi: 0,
      Belanja: 0,
      Pemasukan: 0,
    };

    currentAccountTransactions.forEach((tx) => {
      const dateStr = tx.timestamp || tx.date || '';
      const ym = dateStr.slice(0, 7);
      const bucket = months.find((m) => m.key === ym);
      const txTypeStr = String(tx.type || '');
      const isIncoming =
        txTypeStr === 'setor' ||
        txTypeStr === 'gaji_kerja' ||
        txTypeStr === 'bunga_deposito' ||
        txTypeStr === 'terima_transfer' ||
        txTypeStr === 'transfer_in' ||
        (tx.recipientAccount && currentAccount && tx.recipientAccount === currentAccount.accountNumber && tx.senderAccount !== currentAccount.accountNumber);
      const amt = Math.max(0, Number(tx.amount) || 0);
      if (bucket) {
        if (isIncoming) bucket.income += amt;
        else bucket.expense += amt;
      }
      if (isIncoming) categoryTotals.Pemasukan += amt;
      else if (tx.category === 'investasi' || tx.type.includes('emas') || tx.type.includes('celengan')) categoryTotals.Investasi += amt;
      else if (tx.category === 'tagihan' || tx.type.includes('pulsa') || tx.type.includes('listrik')) categoryTotals.Tagihan += amt;
      else if (tx.type.includes('transfer')) categoryTotals.Transfer += amt;
      else categoryTotals.Belanja += amt;
    });

    const curMonth = months[months.length - 1] || { income: 0, expense: 0, label: 'Bulan Ini' };
    const maxBar = Math.max(100_000, ...months.map((m) => Math.max(m.income, m.expense)));
    const savingsRatio =
      curMonth.income > 0
        ? Math.max(0, Math.min(100, Math.round(((curMonth.income - curMonth.expense) / curMonth.income) * 100)))
        : 0;
    return { months, categoryTotals, curMonth, maxBar, savingsRatio };
  }, [currentAccountTransactions, currentAccount]);

  const todayWib = getWibDateString(loyaltyClockMs);

  const dailyMissionRows = useMemo(() => {
    if (!currentAccount) return [];
    const effectiveMissions = getEffectiveDailyLoyaltyMissions(normalizedLoyaltyConfig);
    const txStats = computeDailyTxActivityStats(
      currentAccount.id,
      currentAccountTransactions,
      {
        startMs: missionCycle.cycleStartMs,
        nextResetMs: missionCycle.nextResetMs,
        manualResetAtMs: missionCycle.manualResetAtMs,
      }
    );
    const state = ensureTodayLoyaltyAccountState(
      loyaltyMap[currentAccount.id],
      todayWib,
      normalizedLoyaltyConfig,
      loyaltyClockMs
    );
    return effectiveMissions.map((mission) => ({
      mission,
      evalResult: evaluateDailyLoyaltyMissionProgress(
        mission,
        state,
        txStats,
        todayWib,
        normalizedLoyaltyConfig,
        loyaltyClockMs
      ),
    }));
  }, [
    currentAccount,
    normalizedLoyaltyConfig,
    currentAccountTransactions,
    loyaltyMap,
    todayWib,
    missionCycle,
    loyaltyClockMs,
  ]);

  const missionSummary = useMemo(() => {
    const total = dailyMissionRows.length;
    let claimed = 0;
    let ready = 0;
    let inProgress = 0;
    for (const row of dailyMissionRows) {
      if (row.evalResult.claimed) claimed += 1;
      else if (row.evalResult.completed) ready += 1;
      else inProgress += 1;
    }
    return { total, claimed, ready, inProgress };
  }, [dailyMissionRows]);

  const filteredMissionRows = useMemo(() => {
    const q = missionSearchQuery.trim().toLowerCase();
    return dailyMissionRows
      .filter(({ mission, evalResult }) => {
        if (missionCategoryFilter !== 'all' && mission.category !== missionCategoryFilter) {
          return false;
        }
        if (missionStatusFilter === 'ready' && !(evalResult.completed && !evalResult.claimed)) {
          return false;
        }
        if (missionStatusFilter === 'claimed' && !evalResult.claimed) {
          return false;
        }
        if (missionStatusFilter === 'in_progress' && (evalResult.completed || evalResult.claimed)) {
          return false;
        }
        if (q) {
          const hay = `${mission.index} ${mission.title} ${mission.description} ${mission.actionHint}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rank = (r: typeof a) =>
          r.evalResult.completed && !r.evalResult.claimed
            ? 0
            : !r.evalResult.claimed
            ? 1
            : 2;
        const d = rank(a) - rank(b);
        return d !== 0 ? d : a.mission.index - b.mission.index;
      });
  }, [dailyMissionRows, missionCategoryFilter, missionStatusFilter, missionSearchQuery]);

  if (!currentAccount) return null;

  const myDreamPockets = dreamPockets.filter((p) => p.accountId === currentAccount.id);
  const myVault = safeVaultMap[currentAccount.id] || { lockedBalanceRupiah: 0 };
  const unlockedBal = getUnlockedAvailableBalance(currentAccount.id);
  const myLoyalty = ensureTodayLoyaltyAccountState(
    loyaltyMap[currentAccount.id] || {
      points: isAdminCard ? Number.MAX_SAFE_INTEGER : 0,
      streakDays: 0,
      claimedAchievementIds: [],
      totalCheckIns: 0,
      redeemedCount: 0,
      recoveryCards: isAdminCard ? Number.MAX_SAFE_INTEGER : 0,
      freezeStage: 0,
      frozenStreakDays: 0,
    },
    todayWib,
    normalizedLoyaltyConfig,
    loyaltyClockMs
  );
  const streakVisual = computeStreakVisualSnapshot(myLoyalty, normalizedLoyaltyConfig, todayWib);
  const myStatusesCount = chatStatuses.filter((s) => s.authorAccountId === currentAccount.id).length;

  const handleExportAnalyticsCsv = () => {
    const header = 'Tanggal,Judul,Tipe,Nominal,Status,Referensi\n';
    const rows = currentAccountTransactions
      .slice(0, 200)
      .map((tx) => {
        const safeTitle = `"${String(tx.title || '').replace(/"/g, '""')}"`;
        return `${tx.timestamp || tx.date || ''},${safeTitle},${tx.type},${tx.amount},${tx.status},${tx.referenceNo || ''}`;
      })
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Analitik-Keuangan-${currentAccount.accountNumber}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showNotice({ success: true, message: 'Laporan analitik bulanan CSV berhasil diunduh!' });
  };

  const isSelfScannedQris = Boolean(
    currentAccount &&
      parsedScanTarget.recipientAccount &&
      isSelfQrisTransferTarget(
        { recipientAccount: parsedScanTarget.recipientAccount },
        currentAccount
      )
  );

  const handleQrisModalDetected = (
    rawText: string,
    _source: 'camera' | 'gallery' | 'manual'
  ) => {
    setQrisScannerModal((prev) => ({ ...prev, open: false }));
    setScanInputCode(rawText);
    const detected = parseQrisTransferInput(rawText, accounts);
    if (!detected.recipientAccount) {
      showNotice({
        success: false,
        message: 'Kode QR yang dipindai bukan Link Transfer QRIS Pribadi Bank Nusantara.',
      });
      return;
    }
    if (
      currentAccount &&
      isSelfQrisTransferTarget({ recipientAccount: detected.recipientAccount }, currentAccount)
    ) {
      showNotice({
        success: false,
        message: `QRIS Pribadi ini milik rekening Anda sendiri (${currentAccount.fullName} · ${currentAccount.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`,
      });
      return;
    }

    if (detected.assetMode) setScanAssetMode(detected.assetMode);
    if (detected.amount > 0) setScanPayAmount(String(detected.amount));
    if ((detected.goldRupiahAmount || 0) > 0) setScanPayGoldRp(String(detected.goldRupiahAmount));
    if ((detected.coinAmount || 0) > 0) setScanPayCoin(String(detected.coinAmount));
    if ((detected.diamondAmount || 0) > 0) setScanPayDiamond(String(detected.diamondAmount));
    if ((detected.tokenAmount || 0) > 0) setScanPayToken(String(detected.tokenAmount));
    if (detected.note) setScanPayNote(detected.note);

    const modeTitle =
      detected.qrisSubMode === 'minta'
        ? 'QRIS MINTA (Nominal & Aset Terkunci)'
        : 'QRIS TF (Bebas Isi Nominal & Pilih Aset)';
    showNotice({
      success: true,
      message: `${modeTitle} milik ${detected.recipientName || detected.recipientAccount} berhasil dipindai!`,
    });
  };

  const handleOpenScannedTransferPage = () => {
    if (!parsedScanTarget.recipientAccount) {
      showNotice({
        success: false,
        message: 'Tempel Link Transfer QRIS, kode BNUS-QRPAY, Rekening 10-digit, atau User ID 16-digit penerima terlebih dahulu.',
      });
      return;
    }
    if (isSelfScannedQris) {
      showNotice({
        success: false,
        message: `QRIS Pribadi ini milik rekening Anda sendiri (${currentAccount?.fullName} · ${currentAccount?.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`,
      });
      return;
    }
    if (isScannedQrisExpired) {
      showNotice({
        success: false,
        message: 'Kode QRIS MINTA ini sudah melewati batas waktu aktif (Kedaluwarsa). Minta penerima membuat QRIS MINTA baru.',
      });
      return;
    }
    const modeLabel = parsedScanTarget.qrisSubMode === 'minta' ? '[QRIS MINTA]' : '[QRIS TF]';
    const rawNote = scanPayNote.trim() || parsedScanTarget.note || 'Transfer via Scan QRIS Pribadi';
    const finalNote = rawNote.startsWith('[QRIS') ? rawNote : `${modeLabel} ${rawNote}`;

    const payload = {
      recipientAccount: parsedScanTarget.recipientAccount,
      recipientBank: parsedScanTarget.recipientBank || 'Bank Nusantara',
      recipientName: parsedScanTarget.recipientName,
      qrisSubMode: parsedScanTarget.qrisSubMode,
      lockAmountAndAsset: isScannedQrisMintaLocked,
      expiresAtMs: parsedScanTarget.expiresAtMs,
      assetMode: isScannedQrisMintaLocked
        ? parsedScanTarget.assetMode || 'uang'
        : scanAssetMode,
      amount: effectiveScanAmount > 0 ? effectiveScanAmount : undefined,
      goldRupiahAmount: effectiveScanGoldRp > 0 ? effectiveScanGoldRp : undefined,
      coinAmount: effectiveScanCoin > 0 ? effectiveScanCoin : undefined,
      diamondAmount: effectiveScanDiamond > 0 ? effectiveScanDiamond : undefined,
      tokenAmount: effectiveScanToken > 0 ? effectiveScanToken : undefined,
      note: finalNote,
      source: 'manual' as const,
    };
    savePendingQrisTransfer(payload);
    window.dispatchEvent(
      new CustomEvent('bn:qris-transfer', {
        detail: payload,
      })
    );
  };

  const handleScanQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInstantMultiAssetReceipt(null);
    const targetAccount = parsedScanTarget.recipientAccount;

    if (isSelfScannedQris) {
      showNotice({
        success: false,
        message: `QRIS Pribadi ini milik rekening Anda sendiri (${currentAccount?.fullName} · ${currentAccount?.accountNumber}). Anda tidak dapat mentransfer ke rekening sendiri.`,
      });
      return;
    }

    if (isScannedQrisExpired) {
      showNotice({
        success: false,
        message: 'Kode QRIS MINTA ini sudah kedaluwarsa. Silakan minta penerima membuat kode QRIS MINTA yang baru.',
      });
      return;
    }

    if (!targetAccount) {
      showNotice({
        success: false,
        message: 'Masukkan atau scan Link Transfer QRIS / Rekening / User ID 16-digit penerima terlebih dahulu.',
      });
      return;
    }

    if (scanPayPin.length !== 6) {
      showNotice({
        success: false,
        message: 'Masukkan 6 digit PIN Kartu Anda untuk verifikasi keamanan transfer via QRIS.',
      });
      return;
    }

    const activeAssetMode = isScannedQrisMintaLocked
      ? parsedScanTarget.assetMode || 'uang'
      : scanAssetMode;
    const modeLabel = parsedScanTarget.qrisSubMode === 'minta' ? '[QRIS MINTA]' : '[QRIS TF]';
    const rawNote =
      scanPayNote.trim() ||
      parsedScanTarget.note ||
      (parsedScanTarget.qrisSubMode === 'minta'
        ? 'Pembayaran Permintaan QRIS MINTA'
        : 'Transfer via QRIS TF Pribadi');
    const taggedNote = rawNote.startsWith('[QRIS') ? rawNote : `${modeLabel} ${rawNote}`;

    // Jika mode 'uang' murni, bisa melalui transferMoney standar; jika aset non-uang / gabungan, gunakan transferBebas({ fromQris: true })
    if (activeAssetMode === 'uang') {
      const amountNum = effectiveScanAmount;
      if (amountNum < 1000) {
        showNotice({
          success: false,
          message: 'Nominal transfer Saldo Rupiah minimal Rp 1.000.',
        });
        return;
      }
      const res = transferMoney({
        recipientAccount: targetAccount,
        recipientBank: parsedScanTarget.recipientBank || 'Bank Nusantara',
        amount: amountNum,
        note: taggedNote,
        pin: scanPayPin,
      });
      showNotice(res);
      if (res.success) {
        if (!isScannedQrisMintaLocked) {
          setScanPayAmount('');
          setScanPayNote('');
        }
        setScanPayPin('');
      }
      return;
    }

    // Transfer Multi-Aset via QRIS (Emas 24K, Coin Spin, Permata, Token, atau Paket Gabungan)
    const res = transferBebas({
      assetMode: activeAssetMode,
      recipientAccount: targetAccount,
      recipientName: parsedScanTarget.recipientName || 'Penerima QRIS',
      recipientBank: parsedScanTarget.recipientBank || 'Bank Nusantara',
      uangAmount: activeAssetMode === 'gabungan' ? effectiveScanAmount : 0,
      goldRupiahAmount:
        activeAssetMode === 'emas' || activeAssetMode === 'gabungan' ? effectiveScanGoldRp : 0,
      coinAmount:
        activeAssetMode === 'coin' || activeAssetMode === 'gabungan' ? effectiveScanCoin : 0,
      diamondAmount:
        activeAssetMode === 'permata' || activeAssetMode === 'gabungan' ? effectiveScanDiamond : 0,
      tokenAmount:
        activeAssetMode === 'token' || activeAssetMode === 'gabungan' ? effectiveScanToken : 0,
      fromQris: true,
      note: taggedNote,
      pin: scanPayPin,
    });
    showNotice(res);
    if (res.success && res.receipt) {
      setInstantMultiAssetReceipt(res.receipt);
      setScanPayPin('');
    }
  };

  const handleJumpToMissionActivity = (targetNavTab?: string) => {
    if (!targetNavTab) return;
    if (
      targetNavTab === 'kantong_impian' ||
      targetNavTab === 'qris_pribadi' ||
      targetNavTab === 'analitik' ||
      targetNavTab === 'brankas'
    ) {
      window.dispatchEvent(
        new CustomEvent('bn:navigate', {
          detail: { targetView: 'dashboard', targetDashboardTab: targetNavTab },
        })
      );
      return;
    }
    if (targetNavTab === 'mutasi' || targetNavTab === 'ringkasan') {
      window.dispatchEvent(
        new CustomEvent('bn:navigate', {
          detail: { targetView: 'dashboard', targetDashboardTab: targetNavTab },
        })
      );
      return;
    }
    window.dispatchEvent(
      new CustomEvent('bn:navigate', {
        detail: { targetView: targetNavTab },
      })
    );
  };

  return (
    <div className="space-y-5">
      {feedback && (
        <div
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-xs font-bold ${
            feedback.type === 'success'
              ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
              : 'border-rose-500/40 bg-rose-950/60 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white"
          >
            Tutup
          </button>
        </div>
      )}

      {/* ==================== 1. KANTONG IMPIAN BERBUNGA ==================== */}
      {activeTab === 'kantong_impian' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Buat Kantong Impian</h3>
                  <p className="text-[11px] text-slate-400">
                    Bunga tabungan {dreamPocketConfig.annualInterestPercent}% / tahun langsung masuk tiap setor
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DREAM_POCKET_PRESETS.map((preset, idx) => (
                <button
                  key={preset.category}
                  type="button"
                  onClick={() => setPocketPresetIdx(idx)}
                  className={`rounded-xl border px-2.5 py-2 text-left text-xs transition ${
                    pocketPresetIdx === idx
                      ? 'border-emerald-400 bg-emerald-500/15 text-white font-bold'
                      : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="mr-1">{preset.emoji}</span>
                  <span>{preset.category}</span>
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Nama Target Impian</label>
                <input
                  type="text"
                  value={pocketName}
                  onChange={(e) => setPocketName(e.target.value)}
                  placeholder="Misal: Dana Umrah Keluarga / Laptop Baru"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Nominal (Rp)</label>
                  <input
                    type="number"
                    min={10000}
                    value={pocketTarget}
                    onChange={(e) => setPocketTarget(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white tabular-nums focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Tanggal (Opsional)</label>
                  <input
                    type="date"
                    value={pocketDeadline}
                    onChange={(e) => setPocketDeadline(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const p = DREAM_POCKET_PRESETS[pocketPresetIdx] || DREAM_POCKET_PRESETS[0];
                  const res = createDreamPocket({
                    name: pocketName,
                    emoji: p.emoji,
                    category: p.category,
                    targetAmount: Number(pocketTarget) || 1000000,
                    deadlineIso: pocketDeadline || undefined,
                    colorTheme: p.colorTheme,
                  });
                  showNotice(res);
                  if (res.success) setPocketName('');
                }}
                className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
              >
                <Plus className="h-4 w-4" />
                <span>Buat Kantong Impian</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
              <div>
                <p className="text-xs font-black text-white">Daftar Kantong Impian ({myDreamPockets.length})</p>
                <p className="text-[11px] text-slate-400">
                  Saldo bebas tersedia: <strong className="text-emerald-400 tabular-nums">{isAdminCard ? '∞ (Admin Tier)' : formatRupiah(unlockedBal)}</strong>
                </p>
              </div>
              <span className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
                Bunga {dreamPocketConfig.annualInterestPercent}% p.a
              </span>
            </div>

            {myDreamPockets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-800 bg-slate-900/50 p-10 text-center">
                <Target className="mx-auto h-10 w-10 text-slate-600 mb-2" />
                <p className="text-sm font-bold text-slate-300">Belum ada Kantong Impian</p>
                <p className="text-xs text-slate-500 mt-1">
                  Pisahkan dana liburan, dana darurat, atau target pembelian agar tidak tercampur saldo harian.
                </p>
              </div>
            ) : (
              myDreamPockets.map((pkt) => {
                const pct = Math.min(100, Math.round((pkt.currentAmount / Math.max(1, pkt.targetAmount)) * 100));
                const amtVal = Number(pocketAmounts[pkt.id] || '50000') || 50000;
                return (
                  <div key={pkt.id} className={`rounded-2xl border bg-gradient-to-br p-4 space-y-3 ${pkt.colorTheme}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-white">
                          {pkt.emoji} {pkt.name}
                        </p>
                        <p className="text-[11px] text-slate-300">
                          {pkt.category} • Bunga terkumpul: <strong className="text-emerald-300 tabular-nums">{formatRupiah(pkt.interestEarnedTotal)}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => showNotice(deleteDreamPocket(pkt.id))}
                        className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-1.5 text-rose-300 hover:bg-rose-500/20"
                        title="Hapus Kantong (harus 0)"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1 tabular-nums">
                        <span className="text-white">{formatRupiah(pkt.currentAmount)}</span>
                        <span className="text-slate-300">Target {formatRupiah(pkt.targetAmount)} ({pct}%)</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-950/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="number"
                        min={1000}
                        value={pocketAmounts[pkt.id] ?? '50000'}
                        onChange={(e) => setPocketAmounts((prev) => ({ ...prev, [pkt.id]: e.target.value }))}
                        className="w-32 rounded-xl border border-slate-700 bg-slate-950/90 px-3 py-2 text-xs text-white tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => showNotice(depositToDreamPocket(pkt.id, amtVal))}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        <ArrowDownLeft className="h-3.5 w-3.5" />
                        <span>Setor</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => showNotice(withdrawFromDreamPocket(pkt.id, amtVal))}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-600 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                      >
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Cairkan</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ==================== 2. KOTAK SCAN & TERIMA QRIS REKENING PRIBADI MULTI-ASET (QRIS TF & QRIS MINTA) ==================== */}
      {activeTab === 'qris_pribadi' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* LEFT: PEMBUAT KARTU QRIS MULTI-ASET (2 PILIHAN: QRIS TF & QRIS MINTA) */}
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl border ${
                    qrisCreatorSubMode === 'minta'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                      : 'bg-sky-500/15 text-sky-400 border-sky-500/35'
                  }`}
                >
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">
                    {qrisCreatorSubMode === 'minta'
                      ? 'Kartu QRIS MINTA (Permintaan Dana & Multi-Aset)'
                      : 'Kartu QRIS TF (Untuk Mentransfer Multi-Aset)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {qrisCreatorSubMode === 'minta'
                      ? 'Nominal & jenis aset dikunci sesuai permintaan Anda saat dipindai oleh pengirim.'
                      : 'Pengirim bebas mengisi nominal dan bebas memilih 6 jenis aset saat memindai kode Anda.'}
                  </p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-lg border px-2.5 py-1 text-[10px] font-mono font-black uppercase ${
                  qrisCreatorSubMode === 'minta'
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-300'
                    : 'border-sky-400/50 bg-sky-500/15 text-sky-300'
                }`}
              >
                {qrisCreatorSubMode === 'minta' ? 'MODE: QRIS MINTA' : 'MODE: QRIS TF'}
              </span>
            </div>

            {/* TOMBOL SWITCH 2 TAB BERDAMPINGAN DI ATAS KARTU QRIS */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl border border-slate-800 bg-slate-950 p-1.5">
              <button
                type="button"
                onClick={() => {
                  if (!qrisAdminPolicy.enableQrisTf) {
                    showNotice({
                      success: false,
                      message: 'Fitur pembuatan QRIS TF sedang dinonaktifkan sementara oleh Admin.',
                    });
                    return;
                  }
                  setQrisCreatorSubMode('tf');
                }}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                  qrisCreatorSubMode === 'tf'
                    ? 'bg-sky-500 text-slate-950 font-black shadow-lg shadow-sky-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <ArrowUpRight className="h-4 w-4 shrink-0" />
                    <span>QRIS TF</span>
                  </div>
                  <div
                    className={`text-[10px] ${
                      qrisCreatorSubMode === 'tf' ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Untuk Mentransfer (Nominal Bebas)
                  </div>
                </div>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-black ${
                    qrisCreatorSubMode === 'tf'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-sky-500/15 text-sky-300'
                  }`}
                >
                  TF
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!qrisAdminPolicy.enableQrisMinta) {
                    showNotice({
                      success: false,
                      message: 'Fitur pembuatan QRIS MINTA sedang dinonaktifkan sementara oleh Admin.',
                    });
                    return;
                  }
                  setQrisCreatorSubMode('minta');
                  setQrMintaCreatedAtMs(Date.now());
                }}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                  qrisCreatorSubMode === 'minta'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div>
                  <div className="text-xs font-black flex items-center gap-1.5">
                    <ArrowDownLeft className="h-4 w-4 shrink-0" />
                    <span>QRIS MINTA</span>
                  </div>
                  <div
                    className={`text-[10px] ${
                      qrisCreatorSubMode === 'minta' ? 'text-slate-900 font-bold' : 'text-slate-400'
                    }`}
                  >
                    Untuk Minta (Nominal &amp; Aset Terkunci)
                  </div>
                </div>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-mono font-black ${
                    qrisCreatorSubMode === 'minta'
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-amber-500/15 text-amber-300'
                  }`}
                >
                  MINTA
                </span>
              </button>
            </div>

            <div
              className={`rounded-2xl border-2 bg-white p-5 flex flex-col items-center text-center space-y-3 ${
                qrisCreatorSubMode === 'minta' ? 'border-amber-400' : 'border-sky-400'
              }`}
            >
              {/* Lencana Header Pembeda Visual QRIS TF vs QRIS MINTA */}
              <div className="w-full flex flex-col items-center space-y-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-[10px] font-mono font-black uppercase tracking-wider ${
                    qrisCreatorSubMode === 'minta'
                      ? 'bg-amber-500 text-slate-950 border border-amber-600'
                      : 'bg-sky-600 text-white border border-sky-700'
                  }`}
                >
                  {qrisCreatorSubMode === 'minta' ? (
                    <>
                      <Lock className="h-3 w-3" />
                      <span>QRIS MINTA • TAGIHAN &amp; PERMINTAAN ASET TERKUNCI</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="h-3 w-3" />
                      <span>QRIS TF • UNTUK MENTRANSFER BEBAS 6 ASET</span>
                    </>
                  )}
                </span>

                <div className="text-slate-900 pt-1">
                  <p className="text-sm font-black">{currentAccount.fullName}</p>
                  <p className="text-[11px] font-mono text-slate-600">
                    Rek: {currentAccount.accountNumber} · ID: {currentAccount.userId16 || '-'}
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-lg border px-3 py-0.5 text-[10px] font-black ${
                      qrisCreatorSubMode === 'minta'
                        ? 'bg-amber-100 border-amber-300 text-amber-950'
                        : 'bg-sky-100 border-sky-300 text-sky-900'
                    }`}
                  >
                    {qrisCreatorSubMode === 'minta' ? 'PERMINTAAN TERKUNCI: ' : 'PREFERENSI TF: '}
                    {qrCreatorAssetSummaryLabel.toUpperCase()}
                  </span>
                </div>
              </div>

              {personalQrUrl && (
                <img
                  src={personalQrUrl}
                  alt={
                    qrisCreatorSubMode === 'minta'
                      ? 'QRIS MINTA Multi-Aset Bank Nusantara'
                      : 'QRIS TF Multi-Aset Bank Nusantara'
                  }
                  className={`h-52 w-52 rounded-xl border-2 p-2 ${
                    qrisCreatorSubMode === 'minta' ? 'border-amber-400' : 'border-sky-300'
                  }`}
                />
              )}

              {/* Pemilih 6 Jenis Aset pada Pembuat QRIS (Didukung di QRIS TF & QRIS MINTA) */}
              <div className="w-full space-y-2 text-left">
                <label className="block text-[11px] font-black text-slate-700 text-center">
                  {qrisCreatorSubMode === 'minta'
                    ? 'Pilih Jenis Aset yang Diminta (Terkunci di Layar Pengirim):'
                    : 'Pilih Jenis Aset Default QRIS TF (Pengirim Tetap Bebas Mengubah):'}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'uang', label: 'Rupiah' },
                      { id: 'emas', label: 'Emas 24K' },
                      { id: 'coin', label: 'Coin Spin' },
                      { id: 'permata', label: 'Permata' },
                      { id: 'token', label: 'Token' },
                      { id: 'gabungan', label: 'Gabungan' },
                    ] as { id: TransferBebasAssetMode; label: string }[]
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setQrRequestAssetMode(item.id)}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        qrRequestAssetMode === item.id
                          ? qrisCreatorSubMode === 'minta'
                            ? 'bg-amber-500 text-slate-950 border-amber-600'
                            : 'bg-slate-900 text-sky-300 border-slate-900'
                          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* KONFIGURASI KHUSUS QRIS MINTA vs QRIS TF */}
              {qrisCreatorSubMode === 'minta' ? (
                <div className="w-full max-w-sm space-y-2.5 text-left">
                  {/* Input Nominal + Tombol Pilih Nominal Cepat sesuai Aset */}
                  {(qrRequestAssetMode === 'uang' || qrRequestAssetMode === 'gabungan') && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700">
                        Nominal Saldo Rupiah yang Diminta (Rp):
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={qrRequestAmount}
                        onChange={(e) => setQrRequestAmount(e.target.value)}
                        placeholder="Masukkan nominal Rupiah yang diminta..."
                        className="w-full rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-2 text-xs text-slate-900 font-bold text-center tabular-nums"
                      />
                      <div className="flex flex-wrap justify-center gap-1">
                        {[50_000, 100_000, 500_000, 1_000_000, 5_000_000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setQrRequestAmount(String(val))}
                            className="rounded-md border border-slate-300 bg-slate-100 hover:bg-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-800 cursor-pointer"
                          >
                            {val >= 1_000_000 ? `${val / 1_000_000}Jt` : `${val / 1000}Rb`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(qrRequestAssetMode === 'emas' || qrRequestAssetMode === 'gabungan') && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700">
                        Nilai Emas 24K dalam Rupiah yang Diminta:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={qrRequestGoldRp}
                        onChange={(e) => setQrRequestGoldRp(e.target.value)}
                        placeholder="Nilai Emas 24K dalam Rupiah (mis. 1000000)..."
                        className="w-full rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-2 text-xs text-slate-900 font-bold text-center tabular-nums"
                      />
                      <div className="flex flex-wrap justify-center gap-1">
                        {[250_000, 1_000_000, 5_000_000, 10_000_000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setQrRequestGoldRp(String(val))}
                            className="rounded-md border border-amber-300 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-950 cursor-pointer"
                          >
                            Emas {val >= 1_000_000 ? `${val / 1_000_000}Jt` : `${val / 1000}Rb`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(qrRequestAssetMode === 'coin' || qrRequestAssetMode === 'gabungan') && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700">
                        Jumlah Coin Spin yang Diminta:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={qrRequestCoin}
                        onChange={(e) => setQrRequestCoin(e.target.value)}
                        placeholder="Jumlah Coin Spin yang diminta (mis. 50)..."
                        className="w-full rounded-xl border border-amber-300 bg-amber-50/70 px-3 py-2 text-xs text-slate-900 font-bold text-center tabular-nums"
                      />
                      <div className="flex flex-wrap justify-center gap-1">
                        {[10, 25, 50, 100, 500].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setQrRequestCoin(String(val))}
                            className="rounded-md border border-amber-300 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-950 cursor-pointer"
                          >
                            {val} Coin
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(qrRequestAssetMode === 'permata' || qrRequestAssetMode === 'gabungan') && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700">
                        Jumlah Permata / Diamond yang Diminta:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={qrRequestDiamond}
                        onChange={(e) => setQrRequestDiamond(e.target.value)}
                        placeholder="Jumlah Permata / Diamond yang diminta (mis. 25)..."
                        className="w-full rounded-xl border border-cyan-300 bg-cyan-50/70 px-3 py-2 text-xs text-slate-900 font-bold text-center tabular-nums"
                      />
                      <div className="flex flex-wrap justify-center gap-1">
                        {[10, 25, 50, 100, 250].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setQrRequestDiamond(String(val))}
                            className="rounded-md border border-cyan-300 bg-cyan-100 hover:bg-cyan-200 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-950 cursor-pointer"
                          >
                            {val} Permata
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(qrRequestAssetMode === 'token' || qrRequestAssetMode === 'gabungan') && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-slate-700">
                        Jumlah Token Spin Bingkai yang Diminta:
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={qrRequestToken}
                        onChange={(e) => setQrRequestToken(e.target.value)}
                        placeholder="Jumlah Token Spin Bingkai yang diminta (mis. 3)..."
                        className="w-full rounded-xl border border-fuchsia-300 bg-fuchsia-50/70 px-3 py-2 text-xs text-slate-900 font-bold text-center tabular-nums"
                      />
                      <div className="flex flex-wrap justify-center gap-1">
                        {[1, 3, 5, 10, 25].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setQrRequestToken(String(val))}
                            className="rounded-md border border-fuchsia-300 bg-fuchsia-100 hover:bg-fuchsia-200 px-2 py-0.5 text-[10px] font-mono font-bold text-fuchsia-950 cursor-pointer"
                          >
                            {val} Token
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Input Catatan Alasan Permintaan */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-700">
                      Catatan Alasan Permintaan Dana / Aset:
                    </label>
                    <input
                      type="text"
                      value={qrRequestNote}
                      onChange={(e) => setQrRequestNote(e.target.value)}
                      placeholder="Contoh: Patungan makan malam, bayar arisan, minta koin..."
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 text-center"
                    />
                  </div>

                  {/* Aturan Masa Berlaku QRIS MINTA */}
                  <div className="space-y-1 pt-1">
                    <label className="block text-[10px] font-black text-slate-700 text-center">
                      Masa Berlaku Kode QRIS MINTA:
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(
                        [
                          { id: 'unlimited', label: 'Bebas Berkali-kali' },
                          { id: '15m', label: '15 Menit' },
                          { id: '1h', label: '1 Jam' },
                          { id: '24h', label: '24 Jam' },
                        ] as const
                      ).map((exp) => (
                        <button
                          key={exp.id}
                          type="button"
                          onClick={() => {
                            setQrMintaExpiryPreset(exp.id);
                            setQrMintaCreatedAtMs(Date.now());
                          }}
                          className={`py-1.5 px-1.5 rounded-lg text-[10px] font-bold border transition cursor-pointer ${
                            qrMintaExpiryPreset === exp.id
                              ? 'bg-slate-900 text-amber-300 border-slate-900'
                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {exp.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm space-y-2">
                  <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] text-sky-950">
                    Pada mode <strong>QRIS TF (Untuk Mentransfer)</strong>, nominal sengaja dikosongkan agar pengirim yang memindai QRIS Anda bebas mengisi nominal dan bebas memilih jenis aset.
                  </div>
                  <input
                    type="text"
                    value={qrRequestNote}
                    onChange={(e) => setQrRequestNote(e.target.value)}
                    placeholder="Catatan sapaan QRIS TF opsional (mis. Transfer ke Rekening Utama)..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 text-center"
                  />
                </div>
              )}

              <div
                className={`w-full rounded-xl border px-3 py-2 text-left ${
                  qrisCreatorSubMode === 'minta'
                    ? 'border-amber-300 bg-amber-50'
                    : 'border-sky-200 bg-sky-50'
                }`}
              >
                <p
                  className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                    qrisCreatorSubMode === 'minta' ? 'text-amber-800' : 'text-sky-700'
                  }`}
                >
                  <Link2 className="h-3 w-3" />{' '}
                  {qrisCreatorSubMode === 'minta'
                    ? 'Link Tujuan Scan QRIS MINTA (Terkunci)'
                    : 'Link Tujuan Scan QRIS TF (Bebas Nominal)'}
                </p>
                <p className="mt-0.5 text-[10px] font-mono text-slate-700 break-all line-clamp-2">
                  {personalQrTransferLink}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => void copyValue(personalQrTransferLink, 'qr_payload')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  {copiedId === 'qr_payload' ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {copiedId === 'qr_payload'
                      ? 'Link Disalin'
                      : qrisCreatorSubMode === 'minta'
                      ? 'Salin Link QRIS MINTA'
                      : 'Salin Link QRIS TF'}
                  </span>
                </button>
                {personalQrUrl && (
                  <button
                    type="button"
                    onClick={() => void handleDownloadPersonalQrisCardPng()}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black cursor-pointer ${
                      qrisCreatorSubMode === 'minta'
                        ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                        : 'bg-sky-600 hover:bg-sky-500 text-white'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>
                      {qrisCreatorSubMode === 'minta'
                        ? 'Unduh Kartu QRIS MINTA (PNG)'
                        : 'Unduh Kartu QRIS TF (PNG)'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSharePayChatPicker((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-3 py-2 text-xs font-black text-white cursor-pointer"
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Bagikan ke PayChat</span>
                </button>
              </div>

              {/* Panel Bagikan Kartu QRIS TF / QRIS MINTA ke Nusantara PayChat */}
              {showSharePayChatPicker && (
                <div className="w-full rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-left space-y-2.5 text-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-emerald-900">
                      Kirim Kartu {qrisCreatorSubMode === 'minta' ? 'QRIS MINTA' : 'QRIS TF'} ke Nusantara PayChat
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSharePayChatPicker(false)}
                      className="text-slate-500 hover:text-slate-900 text-xs font-bold cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'global', label: 'Chat Global' },
                        { id: 'dm', label: 'Kontak (DM)' },
                        { id: 'group', label: 'Grup PayChat' },
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setPayChatTargetKind(t.id)}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black border cursor-pointer ${
                          payChatTargetKind === t.id
                            ? 'bg-emerald-700 text-white border-emerald-800'
                            : 'bg-white text-slate-700 border-slate-300'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {payChatTargetKind === 'dm' && (
                    <select
                      value={payChatTargetDmAccount}
                      onChange={(e) => setPayChatTargetDmAccount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
                    >
                      <option value="">-- Pilih Nasabah Tujuan DM --</option>
                      {accounts
                        .filter((a) => a.id !== currentAccount.id)
                        .map((a) => (
                          <option key={a.id} value={a.accountNumber}>
                            {a.fullName} ({a.accountNumber})
                          </option>
                        ))}
                    </select>
                  )}

                  {payChatTargetKind === 'group' && (
                    <select
                      value={payChatTargetGroupId}
                      onChange={(e) => setPayChatTargetGroupId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs text-slate-900"
                    >
                      <option value="">-- Pilih Grup PayChat --</option>
                      {privateChatGroups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.memberAccountIds.length} anggota)
                        </option>
                      ))}
                    </select>
                  )}

                  <button
                    type="button"
                    onClick={() => void handleShareQrisToPayChat()}
                    className="w-full rounded-xl bg-emerald-700 hover:bg-emerald-600 py-2 text-xs font-black text-white cursor-pointer"
                  >
                    Kirim Kartu {qrisCreatorSubMode === 'minta' ? 'QRIS MINTA' : 'QRIS TF'} Sekarang
                  </button>
                </div>
              )}

              <p className="text-[10px] text-slate-500">
                Mendukung pengiriman Rupiah, Emas 24K, Coin Spin, Permata, Token, &amp; Paket Gabungan (Biaya Admin Wajib {MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%).
              </p>
            </div>
          </div>

          {/* RIGHT: PEMINDAI & PENGIRIMAN INSTAN MULTI-ASET VIA QRIS (OTOMATIS KENALI QRIS TF vs QRIS MINTA) */}
          <form onSubmit={handleScanQrSubmit} className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ScanLine className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  Scan &amp; Bayar QRIS Pribadi (Otomatis Kenali QRIS TF &amp; QRIS MINTA)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Pindai kode QRIS TF (bebas isi nominal &amp; pilih aset) atau QRIS MINTA (nominal &amp; aset terkunci sesuai tagihan pembuat).
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {/* Direct Camera & Gallery QR Scanner Triggers */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setQrisScannerModal({ open: true, mode: 'camera' })}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-sky-500 hover:bg-sky-400 px-3.5 py-2.5 text-xs font-black text-slate-950 whitespace-nowrap cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Scan Kamera Langsung</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrisScannerModal({ open: true, mode: 'gallery' })}
                  className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/45 bg-emerald-500/15 hover:bg-emerald-500/25 px-3.5 py-2.5 text-xs font-black text-emerald-200 whitespace-nowrap cursor-pointer"
                >
                  <ImageUp className="h-4 w-4" />
                  <span>Upload Gambar QR</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Atau Tempel Link QRIS TF / QRIS MINTA / No. Rekening / User ID 16-digit
                </label>
                <input
                  type="text"
                  value={scanInputCode}
                  onChange={(e) => setScanInputCode(e.target.value)}
                  placeholder="https://.../?qris_transfer=1&qris_mode=tf|minta&to=... atau rekening"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white font-mono"
                />
              </div>

              {/* Deteksi Salah Kamera / Salah Menu jika yang ditempel adalah QRP (QR Profil) */}
              {parsedScanTarget.isQrpProfileLink && (
                <div className="rounded-2xl border-2 border-amber-400/70 bg-amber-950/60 p-3.5 text-xs text-amber-100 space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-black text-amber-300 uppercase">
                        Salah Kamera / Salah Menu! Ini Adalah Kode QRP (QR Profil)
                      </p>
                      <p className="text-[11px] text-amber-100/90 mt-0.5">
                        Link yang Anda masukkan adalah <strong>QRP (QR Profil Statistik Umum)</strong> milik{' '}
                        <strong>{parsedScanTarget.qrpTargetName || parsedScanTarget.qrpTargetAccount}</strong>, bukan QRIS Transfer.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      window.dispatchEvent(
                        new CustomEvent('bn:open-qrp-profile', {
                          detail: {
                            targetAccount: parsedScanTarget.qrpTargetAccount || '',
                            targetUserId: parsedScanTarget.qrpTargetUserId,
                            targetName: parsedScanTarget.qrpTargetName,
                            source: 'manual',
                          },
                        })
                      );
                    }}
                    className="w-full min-h-[40px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <QrCode className="h-4 w-4" />
                    <span>Buka Statistik Umum QRP Ini (1-Klik)</span>
                  </button>
                </div>
              )}

              {isSelfScannedQris && (
                <div className="rounded-2xl border border-rose-500/50 bg-rose-950/60 p-3 text-xs text-rose-100 flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Ini adalah QRIS Pribadi milik rekening Anda sendiri.</strong> Anda tidak dapat melakukan transfer ke rekening sendiri — pindai QRIS milik nasabah lain.
                  </span>
                </div>
              )}

              {parsedScanTarget.recipientAccount && !isSelfScannedQris && (
                <div
                  className={`rounded-2xl border p-3.5 text-xs space-y-1.5 ${
                    parsedScanTarget.qrisSubMode === 'minta'
                      ? 'border-amber-400/60 bg-amber-950/35'
                      : 'border-sky-500/45 bg-sky-950/40'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-mono font-black uppercase ${
                        parsedScanTarget.qrisSubMode === 'minta'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-sky-500 text-slate-950'
                      }`}
                    >
                      {parsedScanTarget.qrisSubMode === 'minta' ? (
                        <>
                          <Lock className="h-3 w-3" />
                          <span>QRIS MINTA • NOMINAL &amp; ASET TERKUNCI</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-3 w-3" />
                          <span>QRIS TF • BEBAS ISI NOMINAL &amp; PILIH ASET</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 uppercase">
                      {parsedScanTarget.sourceKind === 'url' ? 'Link QRIS Resmi' : parsedScanTarget.sourceKind}
                    </span>
                  </div>

                  <p className="font-black text-white text-sm">
                    {parsedScanTarget.recipientName || 'Nasabah Bank Nusantara'}{' '}
                    <span className="font-mono text-amber-300">({parsedScanTarget.recipientAccount})</span>
                  </p>

                  <p className="text-[11px] text-emerald-300">
                    {parsedScanTarget.qrisSubMode === 'minta'
                      ? 'Tagihan Permintaan Terkunci: '
                      : 'Preferensi Aset: '}
                    <strong>
                      {formatMultiAssetSummaryLabel({
                        assetMode: parsedScanTarget.assetMode || 'uang',
                        amount: parsedScanTarget.amount,
                        goldRupiahAmount: parsedScanTarget.goldRupiahAmount,
                        coinAmount: parsedScanTarget.coinAmount,
                        diamondAmount: parsedScanTarget.diamondAmount,
                        tokenAmount: parsedScanTarget.tokenAmount,
                      })}
                    </strong>
                  </p>

                  {parsedScanTarget.note && (
                    <p className="text-[11px] text-amber-200">
                      Catatan Pembuat QRIS: <strong>&ldquo;{parsedScanTarget.note}&rdquo;</strong>
                    </p>
                  )}

                  {parsedScanTarget.expiresAtMs && (
                    <p
                      className={`text-[11px] font-mono font-bold ${
                        isScannedQrisExpired ? 'text-rose-400' : 'text-cyan-300'
                      }`}
                    >
                      {isScannedQrisExpired
                        ? '⚠️ KODE QRIS MINTA INI SUDAH KEDALUWARSA!'
                        : `⏳ Berlaku s/d ${new Date(parsedScanTarget.expiresAtMs).toLocaleString('id-ID')}`}
                    </p>
                  )}
                </div>
              )}

              {/* Pemilih Jenis Aset yang Ingin Dikirim oleh Pemindai */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-300">
                    {isScannedQrisMintaLocked
                      ? 'Jenis Aset Terkunci Sesuai Permintaan QRIS MINTA:'
                      : 'Pilih / Ubah Jenis Aset yang Ingin Anda Kirim via QRIS TF:'}
                  </label>
                  {isScannedQrisMintaLocked && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-amber-300">
                      <Lock className="h-3 w-3" /> Terkunci
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { id: 'uang', label: 'Saldo Rupiah' },
                      { id: 'emas', label: 'Emas 24K' },
                      { id: 'coin', label: 'Coin Spin' },
                      { id: 'permata', label: 'Permata' },
                      { id: 'token', label: 'Token Bingkai' },
                      { id: 'gabungan', label: 'Paket Gabungan' },
                    ] as { id: TransferBebasAssetMode; label: string }[]
                  ).map((item) => {
                    const activeMode = isScannedQrisMintaLocked
                      ? parsedScanTarget.assetMode || 'uang'
                      : scanAssetMode;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isScannedQrisMintaLocked && activeMode !== item.id}
                        onClick={() => {
                          if (isScannedQrisMintaLocked) return;
                          setScanAssetMode(item.id);
                        }}
                        className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold border transition-colors ${
                          activeMode === item.id
                            ? 'bg-amber-400 text-slate-950 border-amber-300'
                            : isScannedQrisMintaLocked
                            ? 'bg-slate-950/40 text-slate-600 border-slate-800/60 cursor-not-allowed'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 cursor-pointer'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input Jumlah sesuai Aset yang Dipilih (Terkunci jika QRIS MINTA) */}
              {(() => {
                const activeMode = isScannedQrisMintaLocked
                  ? parsedScanTarget.assetMode || 'uang'
                  : scanAssetMode;
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(activeMode === 'uang' || activeMode === 'gabungan') && (
                      <div>
                        <label className="block text-[11px] font-bold text-emerald-300 mb-1">
                          Nominal Saldo Rupiah (Rp){isScannedQrisMintaLocked ? ' [TERKUNCI]' : ''}
                        </label>
                        <input
                          type="number"
                          min={0}
                          readOnly={isScannedQrisMintaLocked}
                          value={
                            isScannedQrisMintaLocked && parsedScanTarget.amount > 0
                              ? String(parsedScanTarget.amount)
                              : scanPayAmount
                          }
                          onChange={(e) => {
                            if (isScannedQrisMintaLocked) return;
                            setScanPayAmount(e.target.value);
                          }}
                          placeholder={parsedScanTarget.amount > 0 ? String(parsedScanTarget.amount) : '50000'}
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs tabular-nums ${
                            isScannedQrisMintaLocked
                              ? 'border-amber-500/50 bg-amber-950/30 text-amber-200 font-black cursor-not-allowed'
                              : 'border-slate-700 bg-slate-950 text-white'
                          }`}
                        />
                      </div>
                    )}
                    {(activeMode === 'emas' || activeMode === 'gabungan') && (
                      <div>
                        <label className="block text-[11px] font-bold text-yellow-300 mb-1">
                          Nilai Emas 24K (Rp){isScannedQrisMintaLocked ? ' [TERKUNCI]' : ''}
                        </label>
                        <input
                          type="number"
                          min={0}
                          readOnly={isScannedQrisMintaLocked}
                          value={
                            isScannedQrisMintaLocked && (parsedScanTarget.goldRupiahAmount || 0) > 0
                              ? String(parsedScanTarget.goldRupiahAmount)
                              : scanPayGoldRp
                          }
                          onChange={(e) => {
                            if (isScannedQrisMintaLocked) return;
                            setScanPayGoldRp(e.target.value);
                          }}
                          placeholder="Contoh: 1000000"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs tabular-nums ${
                            isScannedQrisMintaLocked
                              ? 'border-amber-500/50 bg-amber-950/30 text-yellow-200 font-black cursor-not-allowed'
                              : 'border-slate-700 bg-slate-950 text-yellow-200'
                          }`}
                        />
                      </div>
                    )}
                    {(activeMode === 'coin' || activeMode === 'gabungan') && (
                      <div>
                        <label className="block text-[11px] font-bold text-amber-300 mb-1">
                          Jumlah Coin Spin{isScannedQrisMintaLocked ? ' [TERKUNCI]' : ''}
                        </label>
                        <input
                          type="number"
                          min={0}
                          readOnly={isScannedQrisMintaLocked}
                          value={
                            isScannedQrisMintaLocked && (parsedScanTarget.coinAmount || 0) > 0
                              ? String(parsedScanTarget.coinAmount)
                              : scanPayCoin
                          }
                          onChange={(e) => {
                            if (isScannedQrisMintaLocked) return;
                            setScanPayCoin(e.target.value);
                          }}
                          placeholder="Contoh: 50"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs tabular-nums ${
                            isScannedQrisMintaLocked
                              ? 'border-amber-500/50 bg-amber-950/30 text-amber-200 font-black cursor-not-allowed'
                              : 'border-slate-700 bg-slate-950 text-amber-200'
                          }`}
                        />
                      </div>
                    )}
                    {(activeMode === 'permata' || activeMode === 'gabungan') && (
                      <div>
                        <label className="block text-[11px] font-bold text-cyan-300 mb-1">
                          Jumlah Permata (Diamond){isScannedQrisMintaLocked ? ' [TERKUNCI]' : ''}
                        </label>
                        <input
                          type="number"
                          min={0}
                          readOnly={isScannedQrisMintaLocked}
                          value={
                            isScannedQrisMintaLocked && (parsedScanTarget.diamondAmount || 0) > 0
                              ? String(parsedScanTarget.diamondAmount)
                              : scanPayDiamond
                          }
                          onChange={(e) => {
                            if (isScannedQrisMintaLocked) return;
                            setScanPayDiamond(e.target.value);
                          }}
                          placeholder="Contoh: 25"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs tabular-nums ${
                            isScannedQrisMintaLocked
                              ? 'border-amber-500/50 bg-amber-950/30 text-cyan-200 font-black cursor-not-allowed'
                              : 'border-slate-700 bg-slate-950 text-cyan-200'
                          }`}
                        />
                      </div>
                    )}
                    {(activeMode === 'token' || activeMode === 'gabungan') && (
                      <div>
                        <label className="block text-[11px] font-bold text-fuchsia-300 mb-1">
                          Jumlah Token Spin Bingkai{isScannedQrisMintaLocked ? ' [TERKUNCI]' : ''}
                        </label>
                        <input
                          type="number"
                          min={0}
                          readOnly={isScannedQrisMintaLocked}
                          value={
                            isScannedQrisMintaLocked && (parsedScanTarget.tokenAmount || 0) > 0
                              ? String(parsedScanTarget.tokenAmount)
                              : scanPayToken
                          }
                          onChange={(e) => {
                            if (isScannedQrisMintaLocked) return;
                            setScanPayToken(e.target.value);
                          }}
                          placeholder="Contoh: 3"
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-xs tabular-nums ${
                            isScannedQrisMintaLocked
                              ? 'border-amber-500/50 bg-amber-950/30 text-fuchsia-200 font-black cursor-not-allowed'
                              : 'border-slate-700 bg-slate-950 text-fuchsia-200'
                          }`}
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        PIN ATM (6 Digit Wajib)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={scanPayPin}
                        onChange={(e) => setScanPayPin(e.target.value)}
                        placeholder="••••••"
                        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-amber-300 font-mono tabular-nums"
                      />
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Catatan Transaksi {parsedScanTarget.qrisSubMode === 'minta' ? '(Otomatis Dilabeli [QRIS MINTA])' : '(Otomatis Dilabeli [QRIS TF])'}
                </label>
                <input
                  type="text"
                  value={scanPayNote}
                  onChange={(e) => setScanPayNote(e.target.value)}
                  placeholder={
                    parsedScanTarget.note ||
                    (parsedScanTarget.qrisSubMode === 'minta'
                      ? 'Pembayaran Permintaan QRIS MINTA'
                      : 'Transfer Multi-Aset via QRIS TF')
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                />
              </div>

              {(isScannedQrisMintaLocked ? parsedScanTarget.assetMode || 'uang' : scanAssetMode) ===
                'uang' &&
                effectiveScanAmount > 0 &&
                !isSelfScannedQris && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 px-3.5 py-2.5 text-[11px] space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span>Nominal Kirim</span>
                      <span className="font-mono font-bold text-white tabular-nums">
                        {formatRupiah(effectiveScanAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-amber-300">
                      <span>Biaya Admin Wajib ({MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}%)</span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatRupiah(effectiveScanFee)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-amber-500/20 pt-1 text-emerald-300 font-black">
                      <span>Total Dipotong</span>
                      <span className="font-mono tabular-nums">
                        {formatRupiah(effectiveScanAmount + effectiveScanFee)}
                      </span>
                    </div>
                  </div>
                )}

              {instantMultiAssetReceipt && (
                <div className="rounded-2xl border border-emerald-500/50 bg-emerald-950/40 p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-emerald-300">
                      Struk Digital {parsedScanTarget.qrisSubMode === 'minta' ? 'QRIS MINTA' : 'QRIS TF'} ({instantMultiAssetReceipt.referenceNo})
                    </span>
                    <button
                      type="button"
                      onClick={() => setInstantMultiAssetReceipt(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-slate-200">
                    Penerima: <strong>{instantMultiAssetReceipt.recipientName}</strong> ({instantMultiAssetReceipt.recipientAccount})
                  </p>
                  {instantMultiAssetReceipt.uangSent > 0 && (
                    <p className="font-mono text-emerald-300">
                      • Rupiah: {formatRupiah(instantMultiAssetReceipt.uangSent)} → Diterima {formatRupiah(instantMultiAssetReceipt.uangReceived)}
                    </p>
                  )}
                  {instantMultiAssetReceipt.goldRupiahSent > 0 && (
                    <p className="font-mono text-yellow-300">
                      • Emas 24K: {instantMultiAssetReceipt.goldGramsSent.toFixed(4)}g → Diterima {instantMultiAssetReceipt.goldReceivedGrams.toFixed(4)}g
                    </p>
                  )}
                  {instantMultiAssetReceipt.coinSent > 0 && (
                    <p className="font-mono text-amber-300">
                      • Coin Spin: {instantMultiAssetReceipt.coinSent} → Diterima {instantMultiAssetReceipt.coinReceived} Koin
                    </p>
                  )}
                  {(instantMultiAssetReceipt.diamondSent || 0) > 0 && (
                    <p className="font-mono text-cyan-300">
                      • Permata: {instantMultiAssetReceipt.diamondSent} → Diterima {instantMultiAssetReceipt.diamondReceived} Permata
                    </p>
                  )}
                  {(instantMultiAssetReceipt.tokenSent || 0) > 0 && (
                    <p className="font-mono text-fuchsia-300">
                      • Token Bingkai: {instantMultiAssetReceipt.tokenSent} → Diterima {instantMultiAssetReceipt.tokenReceived} Token
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isSelfScannedQris || isScannedQrisExpired}
                  onClick={handleOpenScannedTransferPage}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Lanjut ke Halaman Transfer</span>
                </button>
                <button
                  type="submit"
                  disabled={isSelfScannedQris || isScannedQrisExpired}
                  className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black text-white hover:bg-sky-500 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <ScanLine className="h-4 w-4" />
                  <span>
                    Bayar Instan {parsedScanTarget.qrisSubMode === 'minta' ? 'QRIS MINTA' : 'QRIS TF'} ({MANDATORY_TRANSFER_ADMIN_FEE_PERCENT}% Admin)
                  </span>
                </button>
              </div>
            </div>
          </form>

          <QrisScannerModal
            isOpen={qrisScannerModal.open}
            initialMode={qrisScannerModal.mode}
            scannerPurpose="transfer_only"
            onClose={() => setQrisScannerModal((prev) => ({ ...prev, open: false }))}
            onDetected={handleQrisModalDetected}
          />
        </div>
      )}

      {/* ==================== 3. ANALITIK KEUANGAN BULANAN & EKSPOR ==================== */}
      {activeTab === 'analitik' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-[11px] font-bold text-slate-400">Pemasukan Bulan Ini</p>
              <p className="mt-1 text-xl font-black text-emerald-400 tabular-nums">{formatRupiah(analytics.curMonth.income)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-[11px] font-bold text-slate-400">Pengeluaran Bulan Ini</p>
              <p className="mt-1 text-xl font-black text-rose-400 tabular-nums">{formatRupiah(analytics.curMonth.expense)}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4">
              <p className="text-[11px] font-bold text-slate-400">Rasio Tabungan Sehat</p>
              <p className="mt-1 text-xl font-black text-cyan-400 tabular-nums">{analytics.savingsRatio}%</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-400" />
                <div>
                  <h3 className="text-sm font-black text-white">Grafik Arus Kas 6 Bulan Terakhir</h3>
                  <p className="text-[11px] text-slate-400">Perbandingan Pemasukan (Hijau) vs Pengeluaran (Merah)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportAnalyticsCsv}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>Ekspor CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Cetak Laporan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4 border-b border-slate-800 pb-2">
              {analytics.months.map((m) => {
                const incH = Math.max(4, Math.round((m.income / analytics.maxBar) * 100));
                const expH = Math.max(4, Math.round((m.expense / analytics.maxBar) * 100));
                return (
                  <div key={m.key} className="flex flex-col items-center justify-end h-full gap-1.5">
                    <div className="flex items-end gap-1.5 h-32 w-full justify-center">
                      <div
                        className="w-3.5 sm:w-5 rounded-t-lg bg-emerald-500/85 transition-all"
                        style={{ height: `${incH}%` }}
                        title={`Masuk: ${formatRupiah(m.income)}`}
                      />
                      <div
                        className="w-3.5 sm:w-5 rounded-t-lg bg-rose-500/85 transition-all"
                        style={{ height: `${expH}%` }}
                        title={`Keluar: ${formatRupiah(m.expense)}`}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-slate-400">{m.label}</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(analytics.categoryTotals).map(([cat, total]) => (
                <div key={cat} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                  <p className="text-[11px] font-bold text-slate-400">{cat}</p>
                  <p className="mt-0.5 text-xs font-black text-white tabular-nums">{formatRupiah(total)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== 4. AUTO-STREAK ONLINE, KARTU PEMULIHAN, POIN LOYALTY & 100 MISI HARIAN NYATA ==================== */}
      {activeTab === 'loyalty' && (() => {
        const resolvedPackages = getResolvedLoyaltyRedeemPackages(normalizedLoyaltyConfig);
        const standardPackages = resolvedPackages.filter((p) => !p.isCustom);
        const activeCustomPackages = resolvedPackages.filter((p) => p.isCustom && p.enabled);
        const displayPackages = [...standardPackages, ...activeCustomPackages];
        const todayRedeemCount = myLoyalty.dailyRedemptionCount || 0;
        const dailyLimitReached =
          !isAdminCard &&
          Boolean(normalizedLoyaltyConfig.dailyRedeemLimitEnabled) &&
          todayRedeemCount >= (normalizedLoyaltyConfig.dailyRedeemMaxCount || 5);
        const redemptionHistory = myLoyalty.redemptionHistory || [];
        const visibleHistory = showAllRedeemHistory
          ? redemptionHistory
          : redemptionHistory.slice(0, 5);

        const recPrice = normalizedLoyaltyConfig.recoveryCardDiamondPrice || 25;
        const recoveryStock = isAdminCard ? Number.MAX_SAFE_INTEGER : myLoyalty.recoveryCards || 0;
        const isFrozen3 = streakVisual.stage === 3;
        const isFrozen2 = streakVisual.stage === 2;
        const isFrozen1 = streakVisual.stage === 1;

        const getDraft = (pkgId: string) =>
          redeemDrafts[pkgId] || { mode: 'multiplier' as const, value: '1' };

        const setDraft = (
          pkgId: string,
          next: { mode: 'multiplier' | 'points'; value: string }
        ) => {
          setRedeemDrafts((prev) => ({ ...prev, [pkgId]: next }));
        };

        const renderTargetIcon = (target: 'cash' | 'coin' | 'voucher', sizeClass = 'h-5 w-5') => {
          if (target === 'cash') return <Banknote className={sizeClass} />;
          if (target === 'coin') return <Coins className={sizeClass} />;
          return <Ticket className={sizeClass} />;
        };

        const getTargetTheme = (target: 'cash' | 'coin' | 'voucher') => {
          if (target === 'cash') {
            return {
              border: 'border-emerald-500/40',
              iconWrap: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
              accentText: 'text-emerald-300',
              btnBg: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950',
              quickActive: 'border-emerald-400 bg-emerald-500/20 text-emerald-200',
            };
          }
          if (target === 'coin') {
            return {
              border: 'border-amber-500/40',
              iconWrap: 'bg-amber-500/15 border-amber-500/40 text-amber-300',
              accentText: 'text-amber-300',
              btnBg: 'bg-amber-400 hover:bg-amber-300 text-slate-950',
              quickActive: 'border-amber-400 bg-amber-500/20 text-amber-200',
            };
          }
          return {
            border: 'border-violet-500/40',
            iconWrap: 'bg-violet-500/15 border-violet-500/40 text-violet-300',
            accentText: 'text-violet-300',
            btnBg: 'bg-violet-500 hover:bg-violet-400 text-white',
            quickActive: 'border-violet-400 bg-violet-500/20 text-violet-200',
          };
        };

        const streakCardClass = isFrozen3
          ? 'border-cyan-400/70 bg-gradient-to-br from-slate-950 via-cyan-950/70 to-sky-950/80'
          : isFrozen2
          ? 'border-sky-400/60 bg-gradient-to-br from-slate-950 via-sky-950/60 to-indigo-950/60'
          : isFrozen1
          ? 'border-cyan-500/40 bg-gradient-to-br from-slate-950 via-cyan-950/40 to-slate-900'
          : 'border-amber-500/40 bg-gradient-to-br from-amber-950/40 via-orange-950/30 to-slate-950';

        const visibleRows = filteredMissionRows.slice(0, missionVisibleLimit);

        return (
          <div className="space-y-5">
            {/* TOP ROW: AUTO-STREAK + RECOVERY CARD + POINT REDEMPTION */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* LEFT 5 COLS: Auto-Streak, Freeze 3-Stage, Recovery Card & Icon+Name Redemption */}
              <div className="lg:col-span-5 space-y-4">
                {/* Auto-Streak & Freeze Status Card */}
                <div className={`rounded-3xl border p-5 space-y-4 ${streakCardClass}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                          isFrozen3
                            ? 'border-cyan-300/60 bg-cyan-500/20 text-cyan-200'
                            : isFrozen2 || isFrozen1
                            ? 'border-sky-400/50 bg-sky-500/20 text-sky-300'
                            : 'border-orange-400/50 bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        {isFrozen3 || isFrozen2 || isFrozen1 ? (
                          <Snowflake className="h-6 w-6" />
                        ) : (
                          <Flame className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                            isFrozen3
                              ? 'bg-cyan-400/20 text-cyan-200 border border-cyan-300/40'
                              : isFrozen2 || isFrozen1
                              ? 'bg-sky-400/20 text-sky-200 border border-sky-300/40'
                              : 'bg-orange-400/20 text-orange-200 border border-orange-300/40'
                          }`}
                        >
                          {streakVisual.badgeText}
                        </span>
                        <h3 className="mt-1 text-base font-black text-white">
                          {streakVisual.headline}
                        </h3>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {streakVisual.description}
                  </p>

                  {normalizedLoyaltyConfig.nationalHolidayMode && (
                    <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/35 px-3.5 py-2.5 text-[11px] font-semibold text-emerald-200">
                      Mode Libur Nasional sedang diaktifkan Admin: api streak Anda terlindungi penuh dari pembekuan &amp; reset otomatis, dan tetap ada bonus ekstra pada Streak Hari ke-7 ({(normalizedLoyaltyConfig.streakBonus7DaysPoints ?? 150).toLocaleString('id-ID')} Poin), Hari ke-14 ({(normalizedLoyaltyConfig.streakBonus14DaysPoints ?? 350).toLocaleString('id-ID')} Poin), &amp; Hari ke-30 ({(normalizedLoyaltyConfig.streakBonus30DaysPoints ?? 1000).toLocaleString('id-ID')} Poin).
                    </div>
                  )}

                  {/* Stats Pair */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-amber-500/30 bg-slate-950/75 p-3.5">
                      <p className="text-[11px] text-amber-300 font-bold flex items-center gap-1">
                        <Trophy className="h-3.5 w-3.5" /> Total Poin Loyalty
                      </p>
                      <p className="mt-1 text-xl font-black text-white tabular-nums">
                        {isAdminCard ? '∞ (Admin)' : myLoyalty.points.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-orange-500/30 bg-slate-950/75 p-3.5">
                      <p className="text-[11px] text-orange-300 font-bold flex items-center gap-1">
                        {isFrozen3 || isFrozen2 || isFrozen1 ? (
                          <Snowflake className="h-3.5 w-3.5 text-cyan-300" />
                        ) : (
                          <Flame className="h-3.5 w-3.5 text-orange-400" />
                        )}
                        <span>{isFrozen3 ? 'Streak Membeku' : 'Streak Online'}</span>
                      </p>
                      <p className="mt-1 text-xl font-black text-white tabular-nums">
                        {streakVisual.activeStreak} Hari
                      </p>
                    </div>
                  </div>

                  {/* Tombol Sinkron & Verifikasi Streak Harian (Anti-Stuck 2 Hari Berturut-Turut) */}
                  <div className="rounded-2xl border border-orange-500/30 bg-slate-950/80 p-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-slate-300">
                      <span className="font-bold text-orange-200 block">
                        Sinkronisasi &amp; Verifikasi Riwayat Streak
                      </span>
                      <span className="text-slate-400">
                        Riwayat aktif tercatat: {(myLoyalty.recentActiveDatesWib || []).length} hari · Terakhir: {myLoyalty.lastOnlineDateWib || todayWib}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => showNotice(claimDailyCheckIn())}
                      className="min-h-[36px] px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 hover:from-orange-400 hover:to-amber-300 text-slate-950 text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Sinkron &amp; Koreksi Streak</span>
                    </button>
                  </div>

                  {/* 4-Stage Freeze Rule Indicator */}
                  <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                    <div
                      className={`rounded-xl border p-2 ${
                        streakVisual.stage === 0
                          ? 'border-orange-400 bg-orange-500/20 text-orange-200 font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <Flame className="h-3.5 w-3.5 mx-auto mb-0.5 text-orange-400" />
                      <div>Online</div>
                      <div className="text-[9px] opacity-80">Auto-Isi</div>
                    </div>
                    <div
                      className={`rounded-xl border p-2 ${
                        isFrozen1
                          ? 'border-cyan-400 bg-cyan-500/20 text-cyan-200 font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <Snowflake className="h-3.5 w-3.5 mx-auto mb-0.5 text-cyan-300" />
                      <div>Off {normalizedLoyaltyConfig.freezeStage1Days} Hr</div>
                      <div className="text-[9px] opacity-80">Mulai Beku</div>
                    </div>
                    <div
                      className={`rounded-xl border p-2 ${
                        isFrozen2
                          ? 'border-sky-400 bg-sky-500/25 text-sky-100 font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <Snowflake className="h-3.5 w-3.5 mx-auto mb-0.5 text-sky-300" />
                      <div>Off {normalizedLoyaltyConfig.freezeStage2Days} Hr</div>
                      <div className="text-[9px] opacity-80">Makin Beku</div>
                    </div>
                    <div
                      className={`rounded-xl border p-2 ${
                        isFrozen3
                          ? 'border-cyan-300 bg-cyan-400/25 text-white font-black'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400'
                      }`}
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mx-auto mb-0.5 text-cyan-200" />
                      <div>Off {normalizedLoyaltyConfig.freezeRecoveryRequiredDays} Hr</div>
                      <div className="text-[9px] opacity-80">Pulihkan</div>
                    </div>
                  </div>

                  {/* Stage 3 Recovery Actions */}
                  {isFrozen3 && (
                    <div className="rounded-2xl border border-cyan-300/50 bg-slate-950/85 p-3.5 space-y-2.5">
                      <p className="text-xs font-black text-cyan-200">
                        Selamatkan Streak {streakVisual.recoverableStreak} Hari Anda Sekarang!
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {(isAdminCard || recoveryStock > 0) ? (
                          <button
                            type="button"
                            onClick={() => showNotice(useStreakRecoveryCard())}
                            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-2.5 text-xs font-black text-slate-950 hover:from-cyan-300 hover:to-sky-400 cursor-pointer"
                          >
                            <Flame className="h-4 w-4" />
                            <span>
                              Gunakan 1 Kartu Pemulihan ({isAdminCard ? 'Stok ∞' : `Sisa ${recoveryStock}`})
                            </span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              const buyRes = buyStreakRecoveryCard(1);
                              if (!buyRes.success) {
                                showNotice(buyRes);
                                return;
                              }
                              const useRes = useStreakRecoveryCard();
                              showNotice(useRes);
                            }}
                            className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:opacity-95 cursor-pointer"
                          >
                            <Sparkles className="h-4 w-4" />
                            <span>Beli &amp; Pakai Kartu Pemulihan ({recPrice} Diamond)</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => showNotice(forfeitFrozenStreak())}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-[11px] font-bold text-slate-400 hover:text-rose-300 hover:border-rose-500/40 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Biarkan Reset ke 0 &amp; Mulai Baru</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Recovery Card Stock & Buy Anytime Widget */}
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-black text-white flex items-center gap-1.5">
                          <Snowflake className="h-4 w-4 text-cyan-400" />
                          <span>Kartu Pemulihan Streak</span>
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Beli cadangan kapan saja •{' '}
                          <span className="text-sky-300 font-bold">
                            <DiamondText text={`${recPrice} Diamond`} iconClassName="w-3 h-3" /> / kartu
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Stok Anda</span>
                        <span className="text-sm font-black text-cyan-300 tabular-nums">
                          {isAdminCard ? '∞ (Admin)' : `${recoveryStock} Kartu`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 3, 5].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setRecoveryBuyQty(q)}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold cursor-pointer ${
                              recoveryBuyQty === q
                                ? 'bg-cyan-500 text-slate-950'
                                : 'bg-slate-900 text-slate-300 border border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {q}x
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => showNotice(buyStreakRecoveryCard(recoveryBuyQty))}
                        className="flex-1 rounded-xl bg-sky-600 hover:bg-sky-500 px-3 py-2 text-xs font-black text-white cursor-pointer"
                      >
                        Beli {recoveryBuyQty} Kartu ({(recoveryBuyQty * recPrice).toLocaleString('id-ID')} Diamond)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Point Redemption Section — 3 LARGE ICON+NAME CARDS + CUSTOM PACKAGES (NO DIAMOND!) */}
                <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <p className="text-sm font-black text-white flex items-center gap-2">
                        <Gift className="h-4 w-4 text-emerald-400" />
                        <span>Tukar Poin Loyalty ke Hadiah</span>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pilih paket kelipatan atau isi poin bebas — hanya kelipatan pas yang dipotong, sisa poin tetap utuh.
                      </p>
                    </div>
                    {normalizedLoyaltyConfig.dailyRedeemLimitEnabled && (
                      <div
                        className={`rounded-xl border px-2.5 py-1 text-[11px] font-bold tabular-nums ${
                          dailyLimitReached
                            ? 'border-rose-500/40 bg-rose-950/60 text-rose-300'
                            : 'border-slate-700 bg-slate-950 text-slate-300'
                        }`}
                      >
                        {isAdminCard
                          ? 'Kuota Harian: Bebas (Admin)'
                          : `Kuota Hari Ini: ${todayRedeemCount}/${normalizedLoyaltyConfig.dailyRedeemMaxCount || 5}x`}
                      </div>
                    )}
                  </div>

                  {(!normalizedLoyaltyConfig.enabled || !normalizedLoyaltyConfig.redeemEnabled) && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 text-[11px] font-bold text-rose-200">
                      Penukaran Poin Loyalty sedang dijeda sementara oleh Admin. Poin Anda tetap tersimpan aman.
                    </div>
                  )}

                  {isAdminCard && (
                    <div className="text-[11px] font-semibold text-amber-300 bg-amber-500/10 border border-amber-400/30 rounded-xl px-3 py-2">
                      Kartu Tier Admin: Poin Loyalty &amp; aset bernilai ∞ selamanya dan tidak pernah berkurang saat ditukar.
                    </div>
                  )}

                  {/* 3 Large Cards + Active Custom Packages */}
                  <div className="space-y-3">
                    {displayPackages.map((pkg) => {
                      const theme = getTargetTheme(pkg.target);
                      const draft = getDraft(pkg.id);
                      const numericInput = Math.max(0, Math.floor(Number(draft.value) || 0));
                      const calc = calculateExactPackageRedemption({
                        pkg,
                        inputMode: draft.mode,
                        inputValue: numericInput,
                        availablePoints: isAdminCard ? Number.MAX_SAFE_INTEGER : myLoyalty.points,
                        isAdminCard,
                      });
                      const maxPack = calc.maxAffordablePackages;
                      const redeemSwitchActive =
                        normalizedLoyaltyConfig.enabled !== false &&
                        normalizedLoyaltyConfig.redeemEnabled !== false;
                      const canOpenConfirm =
                        redeemSwitchActive &&
                        pkg.enabled &&
                        !dailyLimitReached &&
                        calc.packagesCount >= 1 &&
                        calc.hasEnoughPoints;

                      return (
                        <div
                          key={pkg.id}
                          className={`rounded-2xl border p-4 space-y-3 transition ${
                            pkg.enabled
                              ? `${theme.border} bg-slate-950/80`
                              : 'border-slate-800 bg-slate-950/40 opacity-65'
                          }`}
                        >
                          {/* Card Header: Icon + Name + Clear Rate */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${theme.iconWrap}`}
                              >
                                {renderTargetIcon(pkg.target, 'h-5 w-5')}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm font-black text-white truncate">
                                    {pkg.title}
                                  </h4>
                                  {pkg.isCustom && (
                                    <span className="rounded-md border border-cyan-500/40 bg-cyan-500/15 px-1.5 py-0.5 text-[10px] font-black text-cyan-300">
                                      PAKET SPESIAL
                                    </span>
                                  )}
                                  {!pkg.enabled && (
                                    <span className="rounded-md border border-rose-500/40 bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-black text-rose-300">
                                      NONAKTIF
                                    </span>
                                  )}
                                </div>
                                <p className={`text-xs font-black tabular-nums mt-0.5 ${theme.accentText}`}>
                                  {pkg.pointsCost.toLocaleString('id-ID')} Poin ={' '}
                                  {formatLoyaltyRewardLabel(pkg.target, pkg.rewardAmount)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {pkg.enabled ? (
                            <>
                              {/* Quick Multiplier Buttons: 1x, 2x, 5x, Maksimal */}
                              <div className="grid grid-cols-4 gap-1.5">
                                {[1, 2, 5].map((mult) => {
                                  const isSelected =
                                    draft.mode === 'multiplier' && numericInput === mult;
                                  return (
                                    <button
                                      key={mult}
                                      type="button"
                                      onClick={() =>
                                        setDraft(pkg.id, { mode: 'multiplier', value: String(mult) })
                                      }
                                      className={`min-h-[36px] rounded-xl border px-2 py-1.5 text-xs font-black tabular-nums whitespace-nowrap transition cursor-pointer ${
                                        isSelected
                                          ? theme.quickActive
                                          : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white'
                                      }`}
                                    >
                                      {mult}x
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  disabled={!isAdminCard && maxPack < 1}
                                  onClick={() =>
                                    setDraft(pkg.id, {
                                      mode: 'multiplier',
                                      value: String(Math.max(1, maxPack)),
                                    })
                                  }
                                  className={`min-h-[36px] rounded-xl border px-2 py-1.5 text-xs font-black whitespace-nowrap transition ${
                                    !isAdminCard && maxPack < 1
                                      ? 'border-slate-800 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                                      : draft.mode === 'multiplier' && numericInput === maxPack && maxPack > 0
                                      ? theme.quickActive + ' cursor-pointer'
                                      : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-600 cursor-pointer'
                                  }`}
                                >
                                  {isAdminCard ? '10x' : `Maks (${maxPack}x)`}
                                </button>
                              </div>

                              {/* Custom Input Mode Switch + Field */}
                              <div className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5 flex rounded-xl border border-slate-800 bg-slate-900 p-0.5 text-[10px] font-bold">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraft(pkg.id, {
                                        mode: 'multiplier',
                                        value: String(Math.max(1, calc.packagesCount || 1)),
                                      })
                                    }
                                    className={`flex-1 rounded-lg py-1.5 text-center transition cursor-pointer ${
                                      draft.mode === 'multiplier'
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    Kelipatan
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setDraft(pkg.id, {
                                        mode: 'points',
                                        value: String(
                                          Math.max(pkg.pointsCost, calc.pointsSpent || pkg.pointsCost)
                                        ),
                                      })
                                    }
                                    className={`flex-1 rounded-lg py-1.5 text-center transition cursor-pointer ${
                                      draft.mode === 'points'
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    Poin Bebas
                                  </button>
                                </div>
                                <div className="col-span-7 relative">
                                  <input
                                    type="number"
                                    min={draft.mode === 'multiplier' ? 1 : pkg.pointsCost}
                                    step={draft.mode === 'multiplier' ? 1 : 50}
                                    value={draft.value}
                                    onChange={(e) =>
                                      setDraft(pkg.id, { mode: draft.mode, value: e.target.value })
                                    }
                                    aria-label={
                                      draft.mode === 'multiplier'
                                        ? `Jumlah paket ${pkg.title}`
                                        : `Jumlah poin untuk ${pkg.title}`
                                    }
                                    className="w-full rounded-xl border border-slate-700 bg-slate-900 pl-3 pr-14 py-2 text-xs font-black text-white tabular-nums focus:border-amber-400 focus:outline-none"
                                  />
                                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                                    {draft.mode === 'multiplier' ? 'paket' : 'poin'}
                                  </span>
                                </div>
                              </div>

                              {/* Live Exact-Multiple & Remainder Calculation Strip */}
                              <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-[11px] space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-400">Estimasi Terima ({calc.packagesCount}x):</span>
                                  <strong className={`font-black tabular-nums ${theme.accentText}`}>
                                    +{calc.rewardLabel}
                                  </strong>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-slate-400">Poin Dipotong Pas:</span>
                                  <span className="font-mono font-bold text-white tabular-nums">
                                    {isAdminCard
                                      ? '0 Poin (Tier Admin ∞)'
                                      : `${calc.pointsSpent.toLocaleString('id-ID')} Poin`}
                                  </span>
                                </div>
                                {draft.mode === 'points' && calc.remainderPoints > 0 && (
                                  <p className="text-[10px] font-bold text-emerald-300 pt-0.5">
                                    Sisa {calc.remainderPoints.toLocaleString('id-ID')} poin di luar kelipatan tidak dipotong dan tetap utuh di akun Anda.
                                  </p>
                                )}
                                {calc.packagesCount < 1 && (
                                  <p className="text-[10px] font-bold text-amber-300 pt-0.5">
                                    Minimal {pkg.pointsCost.toLocaleString('id-ID')} Poin untuk 1x paket {pkg.title}.
                                  </p>
                                )}
                                {calc.packagesCount >= 1 && !calc.hasEnoughPoints && !isAdminCard && (
                                  <p className="text-[10px] font-bold text-rose-300 pt-0.5">
                                    Poin kurang {(calc.pointsSpent - myLoyalty.points).toLocaleString('id-ID')} poin (Tersedia {myLoyalty.points.toLocaleString('id-ID')} Poin).
                                  </p>
                                )}
                              </div>

                              {/* Action Button -> Opens One-Click Confirmation Modal (NO PIN) */}
                              <button
                                type="button"
                                disabled={!canOpenConfirm}
                                onClick={() =>
                                  setPendingRedeemModal({
                                    pkg,
                                    inputMode: draft.mode,
                                    inputValue: numericInput,
                                  })
                                }
                                className={`w-full min-h-[42px] rounded-xl px-4 py-2.5 text-xs font-black whitespace-nowrap transition ${
                                  canOpenConfirm
                                    ? `${theme.btnBg} cursor-pointer`
                                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                }`}
                              >
                                {dailyLimitReached
                                  ? 'Batas Penukaran Harian Tercapai'
                                  : `Tukar ${pkg.title}`}
                              </button>
                            </>
                          ) : (
                            <p className="text-[11px] text-slate-400">
                              Opsi penukaran {pkg.title} sedang dinonaktifkan sementara oleh Admin.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Riwayat Penukaran Loyalty */}
                  <div className="pt-2 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-white flex items-center gap-1.5">
                        <History className="h-3.5 w-3.5 text-cyan-400" />
                        <span>Riwayat Penukaran Loyalty ({redemptionHistory.length})</span>
                      </p>
                      <span className="text-[10px] text-slate-400">
                        Tercatat di Mutasi Rekening
                      </span>
                    </div>

                    {visibleHistory.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 px-3 py-4 text-center text-[11px] text-slate-400">
                        Belum ada penukaran Poin Loyalty. Pilih salah satu kartu di atas untuk mulai menukar.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {visibleHistory.map((item) => {
                          const tTheme = getTargetTheme(item.target);
                          const dateStr = (() => {
                            try {
                              return new Date(item.timestampIso).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              });
                            } catch {
                              return item.timestampIso;
                            }
                          })();
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px]"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${tTheme.iconWrap}`}
                                >
                                  {renderTargetIcon(item.target, 'h-3.5 w-3.5')}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-white truncate">
                                    {item.packageTitle} ({item.packagesCount}x)
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono truncate">
                                    {dateStr} · Ref {item.referenceNo}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <p className={`font-black tabular-nums ${tTheme.accentText}`}>
                                  +{item.rewardLabel}
                                </p>
                                <p className="text-[10px] font-mono text-slate-400 tabular-nums">
                                  -{item.pointsSpent.toLocaleString('id-ID')} Poin
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        {redemptionHistory.length > 5 && (
                          <button
                            type="button"
                            onClick={() => setShowAllRedeemHistory((v) => !v)}
                            className="w-full rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 py-1.5 text-[11px] font-bold text-slate-300 cursor-pointer"
                          >
                            {showAllRedeemHistory
                              ? 'Tampilkan Ringkas (5 Terbaru)'
                              : `Lihat Semua Riwayat (${redemptionHistory.length})`}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT 7 COLS: 100 MISI AKTIF HARIAN NYATA + PENCAPAIAN UTAMA */}
              <div className="lg:col-span-7 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
                {/* Header & Subview Switch */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-white">
                        100 Misi Aktif Poin Loyalty
                      </h3>
                      <span className="rounded-md bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-black text-emerald-300 tabular-nums">
                        {missionSummary.claimed}/{missionSummary.total} Diklaim
                      </span>
                      {missionSummary.ready > 0 && (
                        <span className="rounded-md bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-black text-amber-300 tabular-nums">
                          {missionSummary.ready} Siap Klaim!
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400">
                      <span className="font-bold text-amber-300">
                        {missionCycle.scheduleLabel}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="inline-flex items-center gap-1 font-mono tabular-nums text-cyan-300 font-semibold">
                        <Clock className="h-3 w-3 shrink-0" />
                        {formatMissionResetCountdown(missionCycle, loyaltyClockMs)}
                      </span>
                      {missionCycle.mode !== 'manual' && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="font-mono tabular-nums text-slate-300">
                            Berikutnya: {missionCycle.nextResetDateTimeText}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Wajib kerjakan aktivitas nyata baru {missionCycle.periodNoun} (termasuk Tier Admin) · Auto-Streak &amp; batas tukar poin tetap reset harian 00:00 WIB
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLoyaltySubView('daily_100')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black cursor-pointer ${
                        loyaltySubView === 'daily_100'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Misi Aktif ({missionSummary.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoyaltySubView('milestones')}
                      className={`rounded-xl px-3 py-1.5 text-xs font-black cursor-pointer ${
                        loyaltySubView === 'milestones'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      Pencapaian ({myLoyalty.claimedAchievementIds.length}/{DAILY_ACHIEVEMENT_CATALOG.length})
                    </button>
                  </div>
                </div>

                {loyaltySubView === 'daily_100' ? (
                  <>
                    {/* Claim All Ready Banner */}
                    {missionSummary.ready > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3">
                        <div className="text-xs text-amber-200 font-bold">
                          Ada <strong>{missionSummary.ready} misi nyata</strong> yang sudah selesai dan siap diklaim poinnya!
                        </div>
                        <button
                          type="button"
                          onClick={() => showNotice(claimAllReadyLoyaltyMissions())}
                          className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-2 text-xs font-black text-slate-950 cursor-pointer"
                        >
                          Klaim Semua ({missionSummary.ready})
                        </button>
                      </div>
                    )}

                    {/* Category Filters */}
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setMissionCategoryFilter('all');
                          setMissionVisibleLimit(20);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-[11px] font-bold cursor-pointer transition ${
                          missionCategoryFilter === 'all'
                            ? 'bg-white text-slate-950'
                            : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        Semua ({missionSummary.total})
                      </button>
                      {(Object.keys(LOYALTY_MISSION_CATEGORY_META) as LoyaltyDailyMissionCategory[]).map(
                        (catKey) => {
                          const meta = LOYALTY_MISSION_CATEGORY_META[catKey];
                          const countInCat = dailyMissionRows.filter(
                            (r) => r.mission.category === catKey
                          ).length;
                          return (
                            <button
                              key={catKey}
                              type="button"
                              onClick={() => {
                                setMissionCategoryFilter(catKey);
                                setMissionVisibleLimit(20);
                              }}
                              className={`rounded-xl px-3 py-1.5 text-[11px] font-bold cursor-pointer transition ${
                                missionCategoryFilter === catKey
                                  ? 'bg-amber-400 text-slate-950'
                                  : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-600'
                              }`}
                            >
                              {meta.shortLabel} ({countInCat})
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Search & Status Tabs */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[180px]">
                        <Search className="h-3.5 w-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={missionSearchQuery}
                          onChange={(e) => setMissionSearchQuery(e.target.value)}
                          placeholder="Cari dari 100 misi harian..."
                          className="w-full rounded-xl border border-slate-700 bg-slate-950 pl-8 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 text-[11px] font-bold">
                        {(
                          [
                            ['all', 'Semua'],
                            ['ready', `Siap (${missionSummary.ready})`],
                            ['in_progress', 'Berjalan'],
                            ['claimed', `Selesai (${missionSummary.claimed})`],
                          ] as const
                        ).map(([stKey, label]) => (
                          <button
                            key={stKey}
                            type="button"
                            onClick={() => setMissionStatusFilter(stKey)}
                            className={`rounded-lg px-2.5 py-1 cursor-pointer transition ${
                              missionStatusFilter === stKey
                                ? 'bg-slate-800 text-amber-300'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mission Cards List */}
                    <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
                      {visibleRows.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/60 p-8 text-center text-xs text-slate-400">
                          Tidak ada misi yang cocok dengan filter atau kata kunci pencarian.
                        </div>
                      ) : (
                        visibleRows.map(({ mission, evalResult }) => {
                          const catMeta = LOYALTY_MISSION_CATEGORY_META[mission.category];
                          const isReady = evalResult.completed && !evalResult.claimed;
                          return (
                            <div
                              key={mission.id}
                              className={`rounded-2xl border p-3.5 space-y-2.5 transition ${
                                isReady
                                  ? 'border-amber-400/50 bg-amber-950/20'
                                  : evalResult.claimed
                                  ? 'border-emerald-500/25 bg-emerald-950/10 opacity-85'
                                  : 'border-slate-800 bg-slate-950/75'
                              }`}
                            >
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="space-y-0.5 flex-1 min-w-[200px]">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <span className="font-mono text-[10px] font-bold text-slate-500">
                                      #{String(mission.index).padStart(3, '0')}
                                    </span>
                                    <span className="rounded-md bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">
                                      {catMeta.shortLabel}
                                    </span>
                                    <span className="text-xs font-black text-white">
                                      {mission.title}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400">
                                    {mission.description}
                                  </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {evalResult.claimed ? (
                                    <span className="inline-flex items-center gap-1 rounded-xl border border-emerald-500/30 bg-emerald-950/80 px-3 py-1.5 text-[11px] font-black text-emerald-300">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Sudah Diklaim</span>
                                    </span>
                                  ) : isReady ? (
                                    <button
                                      type="button"
                                      onClick={() => showNotice(claimDailyLoyaltyMission(mission.id))}
                                      className="rounded-xl bg-amber-400 hover:bg-amber-300 px-3.5 py-1.5 text-xs font-black text-slate-950 cursor-pointer"
                                    >
                                      Klaim +{mission.rewardPoints} Poin
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleJumpToMissionActivity(mission.targetNavTab)}
                                      className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-900 hover:border-sky-400 hover:text-sky-300 px-3 py-1.5 text-[11px] font-bold text-slate-200 cursor-pointer"
                                    >
                                      <span>Kerjakan</span>
                                      <ArrowRight className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Real Activity Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px] font-bold">
                                  <span className="text-slate-400 tabular-nums">
                                    Progres Nyata:{' '}
                                    <strong className="text-white">
                                      {mission.metricKey === 'transfer_amount'
                                        ? `${formatRupiah(evalResult.current)} / ${formatRupiah(evalResult.target)}`
                                        : `${evalResult.current.toLocaleString('id-ID')} / ${evalResult.target.toLocaleString('id-ID')} ${mission.unitLabel}`}
                                    </strong>
                                  </span>
                                  <span className="text-amber-300 tabular-nums">
                                    Hadiah +{mission.rewardPoints} Poin ({evalResult.progressPercent}%)
                                  </span>
                                </div>
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                                  <div
                                    className={`h-full rounded-full transition-all ${
                                      evalResult.claimed
                                        ? 'bg-emerald-400'
                                        : isReady
                                        ? 'bg-amber-400'
                                        : 'bg-sky-400'
                                    }`}
                                    style={{ width: `${evalResult.progressPercent}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Show More / Show All 100 */}
                    {filteredMissionRows.length > missionVisibleLimit && (
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setMissionVisibleLimit((n) => n + 25)}
                          className="rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 cursor-pointer"
                        >
                          Muat 25 Misi Lagi ({filteredMissionRows.length - missionVisibleLimit} tersisa)
                        </button>
                        <button
                          type="button"
                          onClick={() => setMissionVisibleLimit(filteredMissionRows.length)}
                          className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-bold text-amber-300 cursor-pointer"
                        >
                          Tampilkan Semua ({filteredMissionRows.length})
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-2.5">
                    {DAILY_ACHIEVEMENT_CATALOG.map((ach) => {
                      const claimed = myLoyalty.claimedAchievementIds.includes(ach.id);
                      const effectiveAchPts = getEffectiveAchievementRewardPoints(
                        ach.id,
                        ach.rewardPoints,
                        normalizedLoyaltyConfig
                      );
                      const eligible = ach.check({
                        txCount: currentAccountTransactions.length,
                        dreamPocketCount: myDreamPockets.length,
                        loyaltyStreak: myLoyalty.streakDays,
                        goldGrams: currentAccount.goldGrams || 0,
                        statusesPosted: myStatusesCount,
                      });
                      return (
                        <div
                          key={ach.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3.5"
                        >
                          <div>
                            <p className="text-xs font-black text-white">{ach.title}</p>
                            <p className="text-[11px] text-slate-400">{ach.description}</p>
                          </div>
                          <button
                            type="button"
                            disabled={claimed || !eligible}
                            onClick={() => showNotice(claimAchievementReward(ach.id))}
                            className={`rounded-xl px-3.5 py-2 text-xs font-black transition whitespace-nowrap ${
                              claimed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30 cursor-default'
                                : eligible
                                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            {claimed
                              ? 'Sudah Diklaim'
                              : eligible
                              ? `Klaim +${effectiveAchPts.toLocaleString('id-ID')} Poin`
                              : `+${effectiveAchPts.toLocaleString('id-ID')} Poin`}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ONE-CLICK CONFIRMATION SUMMARY MODAL (TANPA PIN) */}
            {pendingRedeemModal && (() => {
              const mPkg = pendingRedeemModal.pkg;
              const mTheme = getTargetTheme(mPkg.target);
              const mCalc = calculateExactPackageRedemption({
                pkg: mPkg,
                inputMode: pendingRedeemModal.inputMode,
                inputValue: pendingRedeemModal.inputValue,
                availablePoints: isAdminCard ? Number.MAX_SAFE_INTEGER : myLoyalty.points,
                isAdminCard,
              });
              return (
                <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Konfirmasi Penukaran Poin Loyalty"
                >
                  <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${mTheme.iconWrap}`}
                        >
                          {renderTargetIcon(mPkg.target, 'h-5 w-5')}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            Konfirmasi Penukaran Poin
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Satu klik langsung cair tanpa PIN — tercatat otomatis di Mutasi Rekening.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendingRedeemModal(null)}
                        aria-label="Tutup modal konfirmasi"
                        className="rounded-lg border border-slate-800 bg-slate-950 p-1.5 text-slate-400 hover:text-white cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Tujuan Hadiah</span>
                        <span className="font-black text-white">{mPkg.title}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Kurs Paket</span>
                        <span className="font-mono font-bold text-slate-200 tabular-nums">
                          {mPkg.pointsCost.toLocaleString('id-ID')} Poin ={' '}
                          {formatLoyaltyRewardLabel(mPkg.target, mPkg.rewardAmount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Jumlah Paket</span>
                        <span className="font-mono font-black text-white tabular-nums">
                          {mCalc.packagesCount}x Paket
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
                        <span className="text-slate-400">Poin Dipotong Pas</span>
                        <span className="font-mono font-black text-rose-300 tabular-nums">
                          {isAdminCard
                            ? '0 Poin (Admin ∞)'
                            : `-${mCalc.pointsSpent.toLocaleString('id-ID')} Poin`}
                        </span>
                      </div>
                      {pendingRedeemModal.inputMode === 'points' && mCalc.remainderPoints > 0 && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Sisa di Luar Kelipatan</span>
                          <span className="font-mono font-bold text-emerald-300 tabular-nums">
                            {mCalc.remainderPoints.toLocaleString('id-ID')} Poin (Tetap Utuh)
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Hadiah Diterima</span>
                        <span className={`font-black text-sm tabular-nums ${mTheme.accentText}`}>
                          +{mCalc.rewardLabel}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-slate-800 pt-2">
                        <span className="text-slate-400">Sisa Saldo Poin Setelah Tukar</span>
                        <span className="font-mono font-black text-white tabular-nums">
                          {isAdminCard
                            ? '∞ (Admin)'
                            : `${mCalc.remainingBalanceAfter.toLocaleString('id-ID')} Poin`}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setPendingRedeemModal(null)}
                        className="min-h-[42px] rounded-xl border border-slate-700 bg-slate-950 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 whitespace-nowrap cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const res = redeemLoyaltyPoints(
                            pendingRedeemModal.inputValue,
                            mPkg.id,
                            {
                              inputMode: pendingRedeemModal.inputMode,
                              packageId: mPkg.id,
                            }
                          );
                          setPendingRedeemModal(null);
                          showNotice(res);
                        }}
                        className={`min-h-[42px] rounded-xl px-4 py-2 text-xs font-black whitespace-nowrap cursor-pointer ${mTheme.btnBg}`}
                      >
                        Konfirmasi &amp; Tukar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })()}

      {/* ==================== 5. BRANKAS PENGAMAN & FREEZE KARTU ==================== */}
      {activeTab === 'brankas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Brankas Pengaman Kunci Saldo</h3>
                <p className="text-[11px] text-slate-400">
                  Dana di Brankas terkunci aman dari transfer keluar & pembayaran sampai Anda membukanya
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-indigo-500/30 bg-indigo-950/30 p-3.5">
                <p className="text-[11px] text-indigo-300 font-bold">Saldo Terkunci</p>
                <p className="mt-1 text-lg font-black text-white tabular-nums">
                  {formatRupiah(myVault.lockedBalanceRupiah)}
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-3.5">
                <p className="text-[11px] text-emerald-300 font-bold">Saldo Bebas Transfer</p>
                <p className="mt-1 text-lg font-black text-white tabular-nums">
                  {isAdminCard ? '∞ (Admin)' : formatRupiah(unlockedBal)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min={1000}
                  value={vaultAmount}
                  onChange={(e) => setVaultAmount(e.target.value)}
                  placeholder="Nominal (Rp)"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white tabular-nums"
                />
                <input
                  type="password"
                  maxLength={6}
                  value={vaultPin}
                  onChange={(e) => setVaultPin(e.target.value)}
                  placeholder="PIN 6 digit"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => showNotice(lockBalanceToSafeVault(Number(vaultAmount) || 0, vaultPin))}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-black text-white hover:bg-indigo-500"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Kunci Saldo</span>
                </button>
                <button
                  type="button"
                  onClick={() => showNotice(unlockBalanceFromSafeVault(Number(vaultAmount) || 0, vaultPin))}
                  className="flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-700"
                >
                  <Unlock className="h-3.5 w-3.5" />
                  <span>Buka Kunci</span>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                <Snowflake className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Kunci Darurat Kartu ATM (Freeze / Unfreeze)</h3>
                <p className="text-[11px] text-slate-400">
                  Bekukan kartu seketika bila perangkat hilang atau mencurigakan
                </p>
              </div>
            </div>

            <div
              className={`rounded-2xl border p-4 ${
                currentAccount.cardStatus === 'frozen'
                  ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200'
                  : 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
              }`}
            >
              <p className="text-xs font-black uppercase">
                Status Kartu Saat Ini: {currentAccount.cardStatus === 'frozen' ? 'DIBEKUKAN (FROZEN)' : 'AKTIF NORMAL'}
              </p>
              <p className="mt-1 text-[11px] opacity-85">
                {currentAccount.cardStatus === 'frozen'
                  ? 'Semua transaksi keluar & tarik tunai diblokir sementara.'
                  : 'Kartu Anda aktif dan siap bertransaksi dengan perlindungan Brankas.'}
              </p>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                maxLength={6}
                value={freezePin}
                onChange={(e) => setFreezePin(e.target.value)}
                placeholder="Masukkan PIN ATM 6 digit untuk Freeze / Buka Blokir"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const res = toggleCardFreezeWithPin(currentAccount.id, freezePin);
                  showNotice(res);
                  if (res.success) setFreezePin('');
                }}
                className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black text-white ${
                  currentAccount.cardStatus === 'frozen'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                <ShieldAlert className="h-4 w-4" />
                <span>
                  {currentAccount.cardStatus === 'frozen' ? 'Buka Blokir Kartu ATM Sekarang' : 'Bekukan (Freeze) Kartu ATM Sekarang'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
