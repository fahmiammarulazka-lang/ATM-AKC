import React, { useEffect, useMemo, useState } from 'react';
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Search,
  LayoutGrid,
  Table as TableIcon,
  Check,
  X,
  Lock,
  Unlock,
  Snowflake,
  Play,
  UserMinus,
  Eye,
  Sliders,
  Download,
  History,
  CheckSquare,
  Square,
  Sparkles,
  Laptop,
  Globe,
  Clock,
  AlertTriangle,
  ExternalLink,
  Users,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  CARD_TIER_CONFIGS,
  formatAssetCount,
  formatRupiah,
  isAdminCardAccount,
  isUnlimitedNumber,
} from '../utils/bankUtils';
import type { BankAccount, CardTier } from '../types/bank';
import {
  ADMIN_PERMISSION_PRESETS,
  ADMIN_TAB_CATALOG,
  ALL_ADMIN_TAB_KEYS,
  isPrimarySystemOwnerAccount,
  type AdminPortalTabKey,
  type AdminTierAccessLevel,
  type AdminTierAssetMode,
  type AdminTierDurationMode,
  type AdminTierGrantRecord,
  type AdminTierPanelAccessMode,
  type AdminTierTrustedDeviceMode,
} from '../types/adminAnalyticsAndTier';
import {
  apiRevokeAdminTierGrant,
  apiToggleFreezeAdminTierGrant,
  apiUpsertAdminTierGrants,
  useAdminAnalyticsAndTierSync,
} from '../hooks/useAdminAnalyticsAndTierSync';
import { OFFLINE_TIMEOUT_MS } from '../services/visitorTracker';

interface AdminTierPromotionPanelProps {
  isSuperOwner: boolean;
  initialFocusAccountId?: string | null;
  onClearFocusAccount?: () => void;
  onInspectAccountAnalytics?: (query: string) => void;
}

const NON_ADMIN_TIERS: CardTier[] = [
  'regular',
  'gold',
  'premium',
  'platinum',
];

function escapeCsv(val: string | number): string {
  const s = String(val ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function formatRemainingContract(expiresAtMs?: number | null): string {
  if (!expiresAtMs) return 'Permanen';
  const diff = expiresAtMs - Date.now();
  if (diff <= 0) return 'Kontrak Habis';
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `Sisa ${mins} mnt`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Sisa ${hrs} jam`;
  const days = Math.floor(hrs / 24);
  return `Sisa ${days} hari`;
}

export const AdminTierPromotionPanel: React.FC<AdminTierPromotionPanelProps> = ({
  isSuperOwner,
  initialFocusAccountId,
  onClearFocusAccount,
  onInspectAccountAnalytics,
}) => {
  const {
    accounts,
    currentAccount,
    googleUser,
    adminDirectChangeAccountTier,
    adminAdjustAccountBalance,
    adminAdjustAccountSpinCoins,
    adminAdjustAccountDiamonds,
    adminAdjustLevelVouchers,
    adminAdjustAccountGold,
    adminSetSpendingLimitAndIntl,
    adminSendWebsiteBroadcast,
  } = useBank();

  const { visitorAnalytics, adminTierGrantsMap, adminTierAuditLogs } =
    useAdminAnalyticsAndTierSync();

  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [sectionTab, setSectionTab] = useState<'directory' | 'audit'>('directory');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'non_admin' | 'admin_only' | 'online'>(
    'all'
  );
  const [tabCountFilter, setTabCountFilter] = useState<'all' | 'single' | 'multi' | 'all_tabs'>(
    'all'
  );
  const [specificTabFilter, setSpecificTabFilter] = useState<string>('__ALL__');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  // Editor Modal (Single or Bulk)
  const [editorTargets, setEditorTargets] = useState<BankAccount[]>([]);
  const [draftTabs, setDraftTabs] = useState<AdminPortalTabKey[]>(['visitor_analytics']);
  const [draftAllTabs, setDraftAllTabs] = useState<boolean>(false);
  const [draftAccessLevel, setDraftAccessLevel] = useState<AdminTierAccessLevel>('full');
  const [draftCanManageTiers, setDraftCanManageTiers] = useState<boolean>(false);
  const [draftAssetMode, setDraftAssetMode] = useState<AdminTierAssetMode>('keep_original');
  const [draftBonusMoney, setDraftBonusMoney] = useState<string>('50000000');
  const [draftBonusCoins, setDraftBonusCoins] = useState<string>('500');
  const [draftBonusDiamonds, setDraftBonusDiamonds] = useState<string>('1000');
  const [draftBonusVouchers, setDraftBonusVouchers] = useState<string>('25');
  const [draftBonusGold, setDraftBonusGold] = useState<string>('10');
  const [draftDailyCap, setDraftDailyCap] = useState<string>('100000000');
  const [draftPanelAccess, setDraftPanelAccess] = useState<AdminTierPanelAccessMode>('auto_open');
  const [draftCustomPin, setDraftCustomPin] = useState<string>('');
  const [draftDurationMode, setDraftDurationMode] = useState<AdminTierDurationMode>('permanent');
  const [draftDurationPresetHours, setDraftDurationPresetHours] = useState<string>('24');
  const [draftCustomTitle, setDraftCustomTitle] = useState<string>('Admin Operasional');
  const [draftShowCrown, setDraftShowCrown] = useState<boolean>(true);
  const [draftHideAdminStatus, setDraftHideAdminStatus] = useState<boolean>(false);
  const [draftTrustedMode, setDraftTrustedMode] =
    useState<AdminTierTrustedDeviceMode>('alert_new_device');
  const [draftTrustedDeviceIds, setDraftTrustedDeviceIds] = useState<string[]>([]);
  const [draftReason, setDraftReason] = useState<string>(
    'Pengangkatan resmi Kartu Tier Admin dengan kontrol izin per tab'
  );
  const [draftSendLetter, setDraftSendLetter] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Revoke Modal
  const [revokeTarget, setRevokeTarget] = useState<BankAccount | null>(null);
  const [revokeRestoreMode, setRevokeRestoreMode] = useState<'original' | 'manual'>('original');
  const [revokeManualTier, setRevokeManualTier] = useState<CardTier>('regular');
  const [revokeReason, setRevokeReason] = useState<string>('Pencabutan status Tier Admin oleh Super Admin');

  const actorName = currentAccount?.fullName || googleUser?.name || 'Super Admin Utama';
  const actorEmail = currentAccount?.email || googleUser?.email || 'fahmiammarulazka@gmail.com';

  // Map live visitor stats & devices per account
  const liveInfoByAccountId = useMemo(() => {
    const now = Date.now();
    const map = new Map<
      string,
      {
        isOnline: boolean;
        totalVisits: number;
        deviceIds: string[];
        latestDeviceLabel: string;
        latestLocation: string;
      }
    >();

    const deviceSessions = Object.values(visitorAnalytics.deviceSessionsMap || {});
    const accountVisits = Object.values(visitorAnalytics.accountVisitsMap || {});

    accounts.forEach((acc) => {
      const accEmailLow = (acc.email || '').trim().toLowerCase();
      const accIdLow = acc.id.toLowerCase();

      const matchedAccVisit = accountVisits.find(
        (v) =>
          v.accountId?.toLowerCase() === accIdLow ||
          (accEmailLow && v.accountEmail?.toLowerCase() === accEmailLow)
      );

      const matchedDevices = deviceSessions.filter((s) => {
        const currentMatch =
          s.currentAccountKey === accIdLow ||
          (accEmailLow && s.currentAccountKey === accEmailLow);
        const histMatch = (s.accountsHistory || []).some(
          (h) =>
            h.accountId?.toLowerCase() === accIdLow ||
            (accEmailLow && h.accountEmail?.toLowerCase() === accEmailLow)
        );
        return currentMatch || histMatch;
      });

      const isOnline = matchedDevices.some(
        (s) => s.isOnline && now - Number(s.lastSeenMs || 0) <= OFFLINE_TIMEOUT_MS
      );

      const sortedDevices = [...matchedDevices].sort(
        (a, b) => Number(b.lastSeenMs || 0) - Number(a.lastSeenMs || 0)
      );
      const latest = sortedDevices[0];

      const uniqueDeviceIds = Array.from(
        new Set([
          ...(matchedAccVisit?.deviceIds || []),
          ...matchedDevices.map((d) => d.deviceId),
        ])
      ).filter(Boolean);

      map.set(acc.id, {
        isOnline,
        totalVisits: matchedAccVisit?.totalVisits || 0,
        deviceIds: uniqueDeviceIds,
        latestDeviceLabel: latest
          ? `${latest.specs?.deviceBrandModel || latest.deviceId}`
          : 'Belum terdeteksi',
        latestLocation: latest?.locationLabel || '-',
      });
    });

    return map;
  }, [accounts, visitorAnalytics]);

  const openEditorForAccounts = (targets: BankAccount[]) => {
    const allowedTargets = targets.filter((a) => !isPrimarySystemOwnerAccount(a, a.email));
    if (allowedTargets.length === 0) {
      setFeedback({
        ok: false,
        text: 'Akun Owner Utama terkunci mutlak dan tidak dapat dimodifikasi.',
      });
      return;
    }

    const first = allowedTargets[0];
    const existing = adminTierGrantsMap[first.id];
    const liveInfo = liveInfoByAccountId.get(first.id);

    if (allowedTargets.length === 1 && existing && existing.status !== 'revoked') {
      const isAll = existing.allowedTabs === 'ALL';
      setDraftAllTabs(isAll);
      setDraftTabs(
        isAll
          ? ALL_ADMIN_TAB_KEYS.filter((k) => existing.canManageAdminTiers || k !== 'admin_tier_promotion')
          : Array.isArray(existing.allowedTabs)
          ? existing.allowedTabs
          : ['visitor_analytics']
      );
      setDraftAccessLevel(existing.accessLevel || 'full');
      setDraftCanManageTiers(Boolean(existing.canManageAdminTiers));
      setDraftAssetMode(existing.assetMode || 'keep_original');
      if (existing.customBonusAssets) {
        setDraftBonusMoney(String(existing.customBonusAssets.money ?? 50000000));
        setDraftBonusCoins(String(existing.customBonusAssets.coins ?? 500));
        setDraftBonusDiamonds(String(existing.customBonusAssets.diamonds ?? 1000));
        setDraftBonusVouchers(String(existing.customBonusAssets.jobVouchers ?? 25));
        setDraftBonusGold(String(existing.customBonusAssets.goldGrams ?? 10));
      }
      setDraftDailyCap(String(existing.dailyAssetCapRupiah ?? 100000000));
      setDraftPanelAccess(existing.panelAccessMode || 'auto_open');
      setDraftCustomPin(existing.customAdminPin || '');
      setDraftDurationMode(existing.durationMode || 'permanent');
      setDraftCustomTitle(existing.customTitle || 'Admin Operasional');
      setDraftShowCrown(existing.showCrownBadge !== false);
      setDraftHideAdminStatus(Boolean(existing.hideAdminStatus));
      setDraftTrustedMode(existing.trustedDeviceMode || 'alert_new_device');
      setDraftTrustedDeviceIds(
        existing.trustedDeviceIds?.length ? existing.trustedDeviceIds : liveInfo?.deviceIds || []
      );
      setDraftReason(existing.reason || 'Pembaruan izin Kartu Tier Admin');
    } else {
      setDraftAllTabs(false);
      setDraftTabs(['visitor_analytics']);
      setDraftAccessLevel('full');
      setDraftCanManageTiers(false);
      setDraftAssetMode('keep_original');
      setDraftPanelAccess('auto_open');
      setDraftCustomPin('');
      setDraftDurationMode('permanent');
      setDraftDurationPresetHours('24');
      setDraftCustomTitle('Admin Operasional');
      setDraftShowCrown(true);
      setDraftHideAdminStatus(false);
      setDraftTrustedMode('alert_new_device');
      setDraftTrustedDeviceIds(liveInfo?.deviceIds || []);
      setDraftReason('Pengangkatan resmi Kartu Tier Admin');
    }
    setDraftSendLetter(true);
    setEditorTargets(allowedTargets);
  };

  // Auto-open promotion editor when navigated from Tab Analitik Pengunjung -> "Angkat Jadi Tier Admin"
  useEffect(() => {
    if (!initialFocusAccountId) return;
    const found = accounts.find((a) => a.id === initialFocusAccountId);
    if (found) {
      openEditorForAccounts([found]);
    }
    onClearFocusAccount?.();
  }, [initialFocusAccountId, accounts]);

  const applyPreset = (presetId: string) => {
    const preset = ADMIN_PERMISSION_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setDraftCustomTitle(preset.defaultTitle);
    if (preset.tabs === 'ALL') {
      setDraftAllTabs(true);
      setDraftTabs(
        isSuperOwner && preset.allowPromotionTab
          ? [...ALL_ADMIN_TAB_KEYS]
          : ALL_ADMIN_TAB_KEYS.filter((k) => k !== 'admin_tier_promotion')
      );
      setDraftCanManageTiers(Boolean(isSuperOwner && preset.allowPromotionTab));
    } else {
      setDraftAllTabs(false);
      setDraftTabs([...preset.tabs]);
      setDraftCanManageTiers(false);
    }
  };

  const toggleDraftTab = (tabKey: AdminPortalTabKey) => {
    if (tabKey === 'admin_tier_promotion' && !isSuperOwner) return;
    setDraftAllTabs(false);
    setDraftTabs((prev) => {
      const next = prev.includes(tabKey) ? prev.filter((k) => k !== tabKey) : [...prev, tabKey];
      if (tabKey === 'admin_tier_promotion') {
        setDraftCanManageTiers(next.includes('admin_tier_promotion'));
      }
      return next;
    });
  };

  const handleSavePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editorTargets.length === 0) return;
    const effectiveTabs: AdminPortalTabKey[] | 'ALL' = draftAllTabs ? 'ALL' : draftTabs;
    if (!draftAllTabs && draftTabs.length === 0) {
      setFeedback({ ok: false, text: 'Pilih minimal 1 tab Panel Admin yang diizinkan.' });
      return;
    }

    setSaving(true);
    try {
      const hours = Math.max(1, Number(draftDurationPresetHours) || 24);
      const expiresAtMs =
        draftDurationMode === 'timed' ? Date.now() + hours * 3_600_000 : null;
      const durationLabel =
        draftDurationMode === 'permanent'
          ? 'Permanen'
          : hours < 24
          ? `Kontrak ${hours} Jam`
          : `Kontrak ${Math.round(hours / 24)} Hari`;

      const bonusAssets = {
        money: Math.max(0, Number(draftBonusMoney.replace(/[^\d]/g, '')) || 0),
        coins: Math.max(0, Number(draftBonusCoins.replace(/[^\d]/g, '')) || 0),
        diamonds: Math.max(0, Number(draftBonusDiamonds.replace(/[^\d]/g, '')) || 0),
        jobVouchers: Math.max(0, Number(draftBonusVouchers.replace(/[^\d]/g, '')) || 0),
        goldGrams: Math.max(0, Number(draftBonusGold.replace(/[^\d.]/g, '')) || 0),
      };
      const dailyCapNum = Math.max(0, Number(draftDailyCap.replace(/[^\d]/g, '')) || 0);

      // Apply card tier & asset settings locally in BankContext
      for (const acc of editorTargets) {
        if (acc.cardTier !== 'admin') {
          adminDirectChangeAccountTier(acc.id, 'admin');
        }
        if (draftAssetMode === 'unlimited_all') {
          adminAdjustAccountBalance(acc.id, 'unlimited', 0, 'Aset Tak Terbatas Kartu Tier Admin');
          adminAdjustAccountSpinCoins(acc.id, 999_999_999, 'set');
          adminAdjustAccountDiamonds(acc.id, 999_999_999, 'set');
          adminAdjustLevelVouchers(acc.id, 999_999, 'set');
          adminAdjustAccountGold(acc.id, 999_999, 'grams', 'set');
        } else if (draftAssetMode === 'custom_bonus') {
          if (bonusAssets.money > 0) {
            adminAdjustAccountBalance(acc.id, 'add', bonusAssets.money, 'Paket Bonus Pengangkatan Tier Admin');
          }
          if (bonusAssets.coins > 0) adminAdjustAccountSpinCoins(acc.id, bonusAssets.coins, 'add');
          if (bonusAssets.diamonds > 0) adminAdjustAccountDiamonds(acc.id, bonusAssets.diamonds, 'add');
          if (bonusAssets.jobVouchers > 0) adminAdjustLevelVouchers(acc.id, bonusAssets.jobVouchers, 'add');
          if (bonusAssets.goldGrams > 0) adminAdjustAccountGold(acc.id, bonusAssets.goldGrams, 'grams', 'add');
        } else if (draftAssetMode === 'daily_capped' && dailyCapNum > 0) {
          adminSetSpendingLimitAndIntl(acc.id, dailyCapNum, true);
        }

        if (draftSendLetter) {
          adminSendWebsiteBroadcast({
            title: `Pengangkatan Resmi: ${draftCustomTitle || 'Kartu Tier Admin'}`,
            message: `Selamat ${acc.fullName}! Kartu Anda resmi diangkat menjadi Kartu Tier Admin (${
              effectiveTabs === 'ALL' ? 'Semua Tab Panel Admin' : `${effectiveTabs.length} Tab Panel Admin`
            }, mode ${draftAccessLevel === 'read_only' ? 'Hanya Lihat' : 'Akses Penuh'}, ${durationLabel}).`,
            targetAccountId: acc.id,
          });
        }
      }

      // Persist granular RBAC grant on real-time server (pushes WS immediately)
      const res = await apiUpsertAdminTierGrants({
        grants: editorTargets.map((acc) => {
          const prevGrant = adminTierGrantsMap[acc.id];
          const prevTier: CardTier =
            prevGrant?.previousCardTier && prevGrant.previousCardTier !== 'admin'
              ? prevGrant.previousCardTier
              : acc.cardTier !== 'admin'
              ? acc.cardTier
              : 'regular';

          return {
            accountId: acc.id,
            accountNumber: acc.accountNumber,
            accountName: acc.fullName,
            accountEmail: acc.email || '-',
            previousCardTier: prevTier,
            allowedTabs: effectiveTabs,
            accessLevel: draftAccessLevel,
            canManageAdminTiers: Boolean(isSuperOwner && draftCanManageTiers),
            assetMode: draftAssetMode,
            customBonusAssets: draftAssetMode === 'custom_bonus' ? bonusAssets : undefined,
            dailyAssetCapRupiah: draftAssetMode === 'daily_capped' ? dailyCapNum : undefined,
            panelAccessMode: draftPanelAccess,
            customAdminPin: draftPanelAccess === 'require_pin' ? draftCustomPin.trim() : undefined,
            durationMode: draftDurationMode,
            expiresAtMs,
            durationLabel,
            customTitle: draftCustomTitle.trim() || 'Admin Tier Nusantara',
            showCrownBadge: draftShowCrown,
            hideAdminStatus: draftHideAdminStatus,
            isFrozen: false,
            trustedDeviceMode: draftTrustedMode,
            trustedDeviceIds: draftTrustedDeviceIds,
            status: 'active',
            reason: draftReason.trim() || 'Pengangkatan resmi Kartu Tier Admin',
            grantedByName: actorName,
            grantedByEmail: actorEmail,
          };
        }),
        actorName,
        actorEmail,
        isBulk: editorTargets.length > 1,
        sendOfficialLetter: draftSendLetter,
      });

      setFeedback({ ok: res.success, text: res.message });
      if (res.success) {
        setEditorTargets([]);
        setSelectedIds([]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleFreeze = async (ids: string[], freeze: boolean) => {
    const res = await apiToggleFreezeAdminTierGrant({
      accountIds: ids,
      freeze,
      actorName,
      actorEmail,
      reason: freeze ? 'Pembekuan akses sementara oleh Super Admin' : 'Pengaktifan kembali akses Admin',
    });
    setFeedback({ ok: res.success, text: res.message });
    if (res.success) setSelectedIds([]);
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTarget) return;
    const grant = adminTierGrantsMap[revokeTarget.id];
    const targetTier: CardTier =
      revokeRestoreMode === 'original'
        ? grant?.previousCardTier && grant.previousCardTier !== 'admin'
          ? grant.previousCardTier
          : 'regular'
        : revokeManualTier;

    const tierName = CARD_TIER_CONFIGS[targetTier]?.name || targetTier.toUpperCase();
    adminDirectChangeAccountTier(revokeTarget.id, targetTier);

    const res = await apiRevokeAdminTierGrant({
      accountId: revokeTarget.id,
      actorName,
      actorEmail,
      reason: revokeReason.trim() || 'Pencabutan Kartu Tier Admin',
      restoredTierLabel: tierName,
    });
    setFeedback({ ok: res.success, text: res.message });
    setRevokeTarget(null);
  };

  // Filtered accounts
  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accounts.filter((acc) => {
      const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
      const grant = adminTierGrantsMap[acc.id];
      const hasAdminTier = isOwner || isAdminCardAccount(acc) || (grant && grant.status === 'active');
      const liveInfo = liveInfoByAccountId.get(acc.id);

      if (statusFilter === 'non_admin' && hasAdminTier) return false;
      if (statusFilter === 'admin_only' && !hasAdminTier) return false;
      if (statusFilter === 'online' && !liveInfo?.isOnline) return false;

      // Tab count & specific tab filters
      const tabCount = isOwner
        ? ALL_ADMIN_TAB_KEYS.length
        : grant && grant.status !== 'revoked'
        ? grant.allowedTabs === 'ALL'
          ? ALL_ADMIN_TAB_KEYS.length
          : grant.allowedTabs.length
        : 0;

      if (tabCountFilter === 'single' && tabCount !== 1) return false;
      if (tabCountFilter === 'multi' && (tabCount <= 1 || tabCount >= ALL_ADMIN_TAB_KEYS.length))
        return false;
      if (tabCountFilter === 'all_tabs' && tabCount < ALL_ADMIN_TAB_KEYS.length) return false;

      if (specificTabFilter !== '__ALL__') {
        if (!isOwner) {
          if (!grant || grant.status === 'revoked') return false;
          if (
            grant.allowedTabs !== 'ALL' &&
            !grant.allowedTabs.includes(specificTabFilter as AdminPortalTabKey)
          ) {
            return false;
          }
        }
      }

      if (q) {
        const hay = `${acc.fullName} ${acc.accountNumber} ${acc.cardNumber} ${acc.email || ''} ${
          acc.userId16 || ''
        } ${grant?.customTitle || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [
    accounts,
    adminTierGrantsMap,
    liveInfoByAccountId,
    searchQuery,
    statusFilter,
    tabCountFilter,
    specificTabFilter,
  ]);

  const stats = useMemo(() => {
    let adminCount = 0;
    let nonAdminCount = 0;
    let onlineCount = 0;
    let deviceAlertCount = 0;

    accounts.forEach((acc) => {
      const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
      const grant = adminTierGrantsMap[acc.id];
      const isAdminAcc = isOwner || isAdminCardAccount(acc) || (grant && grant.status === 'active');
      if (isAdminAcc) adminCount++;
      else nonAdminCount++;
      if (liveInfoByAccountId.get(acc.id)?.isOnline) onlineCount++;
      if (grant?.trustedDeviceAlertCount) deviceAlertCount += grant.trustedDeviceAlertCount;
    });

    return {
      total: accounts.length,
      adminCount,
      nonAdminCount,
      onlineCount,
      deviceAlertCount,
    };
  }, [accounts, adminTierGrantsMap, liveInfoByAccountId]);

  const handleExportPermissionMatrixCsv = () => {
    const header = [
      'Nama Nasabah',
      'Email',
      'No Rekening',
      'No Kartu',
      'Tier Kartu',
      'Status Tier Admin',
      'Label Jabatan',
      'Mode Akses',
      'Akses Panel',
      'Durasi Kontrak',
      'Jumlah Tab Diizinkan',
      'Daftar Tab Diizinkan',
      'Total Kunjungan',
      'Status Online',
      'Pengaman Perangkat',
    ];
    const rows = filteredAccounts.map((acc) => {
      const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
      const grant = adminTierGrantsMap[acc.id];
      const live = liveInfoByAccountId.get(acc.id);
      const tabLabels = isOwner
        ? 'SEMUA TAB (OWNER UTAMA)'
        : grant && grant.status !== 'revoked'
        ? grant.allowedTabs === 'ALL'
          ? 'SEMUA TAB'
          : grant.allowedTabs
              .map((k) => ADMIN_TAB_CATALOG.find((t) => t.key === k)?.shortLabel || k)
              .join(' | ')
        : '-';
      const tabCount = isOwner
        ? ALL_ADMIN_TAB_KEYS.length
        : grant && grant.status !== 'revoked'
        ? grant.allowedTabs === 'ALL'
          ? ALL_ADMIN_TAB_KEYS.length
          : grant.allowedTabs.length
        : 0;

      return [
        acc.fullName,
        acc.email || '-',
        acc.accountNumber,
        acc.cardNumber,
        acc.cardTier,
        isOwner ? 'OWNER UTAMA' : grant?.status || (isAdminCardAccount(acc) ? 'active' : 'belum_admin'),
        isOwner ? 'Super Admin Utama' : grant?.customTitle || '-',
        isOwner ? 'Akses Penuh' : grant?.accessLevel === 'read_only' ? 'Hanya Lihat' : grant ? 'Akses Penuh' : '-',
        isOwner ? 'Otomatis' : grant?.panelAccessMode === 'require_pin' ? 'Wajib PIN' : grant ? 'Otomatis' : '-',
        isOwner ? 'Permanen' : grant?.durationLabel || '-',
        tabCount,
        tabLabels,
        live?.totalVisits || 0,
        live?.isOnline ? 'ONLINE' : 'OFFLINE',
        grant?.trustedDeviceMode || 'unrestricted',
      ]
        .map(escapeCsv)
        .join(',');
    });

    const csv = `\uFEFF${[header.map(escapeCsv).join(','), ...rows].join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `matriks-izin-kartu-tier-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setFeedback({ ok: true, text: 'Matriks izin Kartu Tier Admin berhasil diekspor ke CSV.' });
  };

  const previewTabItems = useMemo(() => {
    const keys: AdminPortalTabKey[] = draftAllTabs
      ? isSuperOwner && draftCanManageTiers
        ? ALL_ADMIN_TAB_KEYS
        : ALL_ADMIN_TAB_KEYS.filter((k) => k !== 'admin_tier_promotion')
      : draftCanManageTiers && isSuperOwner
      ? Array.from(new Set<AdminPortalTabKey>([...draftTabs, 'admin_tier_promotion']))
      : draftTabs.filter((k) => k !== 'admin_tier_promotion');
    return keys
      .map((k) => ADMIN_TAB_CATALOG.find((t) => t.key === k))
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [draftAllTabs, draftTabs, draftCanManageTiers, isSuperOwner]);

  const toggleSelectAccount = (accountId: string) => {
    setSelectedIds((prev) =>
      prev.includes(accountId) ? prev.filter((id) => id !== accountId) : [...prev, accountId]
    );
  };

  const groupedCatalog = useMemo(() => {
    const groups: Record<string, typeof ADMIN_TAB_CATALOG> = {};
    ADMIN_TAB_CATALOG.forEach((item) => {
      if (!groups[item.group]) groups[item.group] = [];
      groups[item.group].push(item);
    });
    return groups;
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
            <Crown className="w-4 h-4" />
            <span>Otoritas Kartu Tier Admin &amp; Kontrol Izin Per-Tab Real-Time</span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Pengangkatan Kartu Menjadi Tier Admin
          </h2>
          <p className="text-xs text-slate-400">
            Seluruh kartu nasabah (belum Admin maupun sudah Tier Admin) ditampilkan lengkap. Atur akses 1 tab saja, sebagian, atau semua tab—langsung aktif detik itu juga via WebSocket.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setSectionTab('directory')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
                sectionTab === 'directory'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Direktori Kartu ({accounts.length})
            </button>
            <button
              type="button"
              onClick={() => setSectionTab('audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                sectionTab === 'audit'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit &amp; Aktivitas ({adminTierAuditLogs.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportPermissionMatrixCsv}
            className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV Matriks</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`px-4 py-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
            feedback.ok
              ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-200'
              : 'bg-rose-950/50 border-rose-700/60 text-rose-200'
          }`}
        >
          <span className="font-medium">{feedback.text}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-400">Total Semua Kartu</p>
          <p className="text-xl font-bold text-white font-mono tabular-nums mt-1">{stats.total}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-amber-300">Sudah Tier Admin</p>
          <p className="text-xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {stats.adminCount}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-slate-400">Belum Admin (Nasabah)</p>
          <p className="text-xl font-bold text-slate-200 font-mono tabular-nums mt-1">
            {stats.nonAdminCount}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <p className="text-[11px] text-emerald-300">Sedang Online (Live)</p>
          <p className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {stats.onlineCount}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 col-span-2 lg:col-span-1">
          <p className="text-[11px] text-rose-300">Peringatan Perangkat Baru</p>
          <p className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-1">
            {stats.deviceAlertCount}
          </p>
        </div>
      </div>

      {sectionTab === 'directory' ? (
        <>
          {/* Filter, Search & View Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Search */}
              <div className="relative flex-1 min-w-[230px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, no rekening, no kartu, email, atau User ID..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                {(
                  [
                    ['all', 'Semua Kartu'],
                    ['non_admin', 'Belum Admin'],
                    ['admin_only', 'Sudah Tier Admin'],
                    ['online', 'Sedang Online'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(key)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer whitespace-nowrap ${
                      statusFilter === key
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    viewMode === 'cards' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kartu ATM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Tabel Cepat</span>
                </button>
              </div>
            </div>

            {/* Secondary Filters: Tab Count & Specific Tab */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-400 inline-flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  Filter Izin Tab:
                </span>
                <select
                  value={tabCountFilter}
                  onChange={(e) =>
                    setTabCountFilter(e.target.value as 'all' | 'single' | 'multi' | 'all_tabs')
                  }
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="all">Semua Jumlah Tab</option>
                  <option value="single">Hanya 1 Tab Saja</option>
                  <option value="multi">Sebagian Tab (2+)</option>
                  <option value="all_tabs">Semua Tab (Super)</option>
                </select>

                <select
                  value={specificTabFilter}
                  onChange={(e) => setSpecificTabFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none max-w-[240px]"
                >
                  <option value="__ALL__">Semua Nama Tab</option>
                  {ADMIN_TAB_CATALOG.map((t) => (
                    <option key={t.key} value={t.key}>
                      Punya Tab: {t.shortLabel}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                Menampilkan {filteredAccounts.length} dari {accounts.length} kartu
              </span>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-xs">
                <div className="flex items-center gap-2 text-amber-200 font-semibold">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span className="font-mono tabular-nums">{selectedIds.length} kartu dipilih untuk aksi massal</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const targets = accounts.filter((a) => selectedIds.includes(a.id));
                      openEditorForAccounts(targets);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer whitespace-nowrap"
                  >
                    Angkat / Atur Izin Massal
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleFreeze(selectedIds, true)}
                    className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Bekukan Massal
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleToggleFreeze(selectedIds, false)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Aktifkan Massal
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedIds([])}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Cards View OR Quick Table View */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredAccounts.map((acc) => {
                const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
                const grant = adminTierGrantsMap[acc.id];
                const isTierAdmin =
                  isOwner || isAdminCardAccount(acc) || (grant && grant.status !== 'revoked');
                const tierCfg = CARD_TIER_CONFIGS[acc.cardTier] || CARD_TIER_CONFIGS.silver;
                const live = liveInfoByAccountId.get(acc.id);
                const isChecked = selectedIds.includes(acc.id);

                const allowedTabCount = isOwner
                  ? ALL_ADMIN_TAB_KEYS.length
                  : grant && grant.status !== 'revoked'
                  ? grant.allowedTabs === 'ALL'
                    ? ALL_ADMIN_TAB_KEYS.length
                    : grant.allowedTabs.length
                  : 0;

                const allowedLabelsPreview = isOwner
                  ? ['Semua Tab (Owner Utama)']
                  : grant && grant.status !== 'revoked'
                  ? grant.allowedTabs === 'ALL'
                    ? ['Semua Tab']
                    : grant.allowedTabs.map(
                        (k) => ADMIN_TAB_CATALOG.find((t) => t.key === k)?.shortLabel || k
                      )
                  : [];

                return (
                  <div
                    key={acc.id}
                    className={`bg-slate-900 border rounded-2xl p-4 flex flex-col justify-between gap-3.5 transition-colors ${
                      isChecked
                        ? 'border-amber-400'
                        : grant?.isFrozen
                        ? 'border-sky-600/70'
                        : isTierAdmin
                        ? 'border-amber-500/40'
                        : 'border-slate-800'
                    }`}
                  >
                    {/* Visual ATM Card Preview (Mobile Banking Style) */}
                    <div
                      className={`relative rounded-xl p-4 bg-gradient-to-br ${
                        tierCfg.gradientClass || 'from-slate-800 via-slate-900 to-slate-950'
                      } border border-white/15 overflow-hidden`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => toggleSelectAccount(acc.id)}
                              className="text-white/80 hover:text-amber-300 cursor-pointer"
                              title="Pilih untuk aksi massal"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-amber-300" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-white/75 font-semibold">
                              Bank Nusantara · {tierCfg.name}
                            </div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5 mt-0.5">
                              {(isOwner || (grant?.showCrownBadge && isTierAdmin)) && (
                                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                              )}
                              <span className="truncate">{acc.fullName}</span>
                            </div>
                          </div>
                        </div>

                        {/* Live Status Indicator */}
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold bg-black/40 px-2 py-1 rounded-md shrink-0">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              live?.isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                            }`}
                          />
                          <span className={live?.isOnline ? 'text-emerald-300' : 'text-slate-300'}>
                            {live?.isOnline ? 'ONLINE' : 'OFFLINE'}
                          </span>
                        </div>
                      </div>

                      {/* Card Number + Chip */}
                      <div className="mt-4 flex items-center justify-between gap-2">
                        <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-100/60 shrink-0" />
                        <span className="font-mono tabular-nums text-xs sm:text-sm tracking-widest text-white/95 font-semibold">
                          {acc.cardNumber}
                        </span>
                      </div>

                      {/* Card Bottom Meta */}
                      <div className="mt-3 pt-2.5 border-t border-white/15 flex items-end justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-white/70">Saldo Rekening</div>
                          <div className="text-xs font-bold text-white font-mono tabular-nums">
                            {isUnlimitedNumber(acc.balance) ? 'TAK TERBATAS ∞' : formatRupiah(acc.balance)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white/70">No. Rek</div>
                          <div className="text-[11px] font-mono tabular-nums text-white/95">
                            {acc.accountNumber}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Assets Compact Strip (Uang, Koin, Diamond, Voucher, Emas) */}
                    <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-slate-950/70 border border-slate-800 rounded-xl p-2 font-mono tabular-nums">
                      <div>
                        <span className="text-slate-500 block font-sans">Koin</span>
                        <span className="text-amber-300 font-semibold">
                          {formatAssetCount(acc.spinCoins || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-sans">Diamond</span>
                        <span className="text-cyan-300 font-semibold">
                          {formatAssetCount(acc.diamonds || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-sans">Voucher</span>
                        <span className="text-violet-300 font-semibold">
                          {formatAssetCount(acc.levelVouchers || 0)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block font-sans">Emas</span>
                        <span className="text-yellow-300 font-semibold">
                          {isUnlimitedNumber(acc.goldGrams || 0)
                            ? '∞'
                            : `${Number(acc.goldGrams || 0).toFixed(1)}g`}
                        </span>
                      </div>
                    </div>

                    {/* Permission & Real-Time Visitor Telemetry */}
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Status Akses Admin</span>
                        {isOwner ? (
                          <span className="text-amber-300 font-bold inline-flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            Owner Utama (Terkunci)
                          </span>
                        ) : grant?.isFrozen ? (
                          <span className="text-sky-300 font-semibold inline-flex items-center gap-1">
                            <Snowflake className="w-3 h-3" />
                            Dibekukan Sementara
                          </span>
                        ) : grant?.status === 'expired' ? (
                          <span className="text-rose-400 font-semibold">Kontrak Berakhir</span>
                        ) : isTierAdmin ? (
                          <span className="text-emerald-400 font-semibold">
                            {grant?.customTitle || 'Kartu Tier Admin'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Belum Admin</span>
                        )}
                      </div>

                      {isTierAdmin && (
                        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">
                              Izin Tab:{' '}
                              <strong className="text-white font-mono tabular-nums">
                                {allowedTabCount} Tab
                              </strong>
                            </span>
                            <span className="text-slate-300 font-medium">
                              {isOwner
                                ? 'Akses Penuh'
                                : grant?.accessLevel === 'read_only'
                                ? 'Hanya Lihat'
                                : 'Akses Penuh'}
                              {!isOwner && grant?.durationMode === 'timed'
                                ? ` · ${formatRemainingContract(grant.expiresAtMs)}`
                                : ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-indigo-300 truncate">
                            {allowedLabelsPreview.slice(0, 4).join(', ')}
                            {allowedLabelsPreview.length > 4
                              ? ` +${allowedLabelsPreview.length - 4} lainnya`
                              : ''}
                          </p>
                          {grant?.trustedDeviceAlertCount ? (
                            <p className="text-[11px] text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span className="truncate">
                                {grant.trustedDeviceAlertCount} peringatan perangkat baru
                              </span>
                            </p>
                          ) : null}
                        </div>
                      )}

                      {/* Live Visitor Telemetry Row integrated from Tab #2 */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 pt-1 border-t border-slate-800/70">
                        <span className="inline-flex items-center gap-1 truncate">
                          <Laptop className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="truncate">{live?.latestDeviceLabel || '-'}</span>
                        </span>
                        <span className="font-mono tabular-nums text-slate-300 shrink-0">
                          {live?.totalVisits || 0} kunjungan
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-800">
                      {isOwner ? (
                        <div className="w-full px-3 py-2 rounded-xl bg-amber-950/30 border border-amber-700/40 text-amber-300 text-[11px] font-semibold flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Terkunci Mutlak · Super Admin Owner</span>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditorForAccounts([acc])}
                            className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                              isTierAdmin
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                            }`}
                          >
                            {isTierAdmin ? 'Atur Izin Tab' : 'Angkat Jadi Tier Admin'}
                          </button>

                          {grant && grant.status !== 'revoked' && (
                            <button
                              type="button"
                              onClick={() => void handleToggleFreeze([acc.id], !grant.isFrozen)}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-sky-300 cursor-pointer"
                              title={grant.isFrozen ? 'Aktifkan kembali akses Panel Admin' : 'Bekukan sementara akses Panel Admin'}
                            >
                              {grant.isFrozen ? (
                                <Play className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Snowflake className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}

                          {isTierAdmin && (
                            <button
                              type="button"
                              onClick={() => {
                                setRevokeTarget(acc);
                                setRevokeRestoreMode('original');
                                setRevokeManualTier(
                                  grant?.previousCardTier && grant.previousCardTier !== 'admin'
                                    ? grant.previousCardTier
                                    : 'regular'
                                );
                              }}
                              className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 border border-slate-700 hover:border-rose-700 text-rose-400 cursor-pointer"
                              title="Cabut / Turunkan Kartu Tier Admin"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {onInspectAccountAnalytics && (
                            <button
                              type="button"
                              onClick={() =>
                                onInspectAccountAnalytics(acc.email || acc.accountNumber || acc.fullName)
                              }
                              className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white cursor-pointer"
                              title="Lihat analitik kunjungan & perangkat akun ini"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Quick Table View */
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/70 text-[11px] text-slate-400">
                      <th className="py-3 px-3 w-8">#</th>
                      <th className="py-3 px-3">Nasabah &amp; Kartu</th>
                      <th className="py-3 px-3">Tier &amp; Status</th>
                      <th className="py-3 px-3">Izin Tab &amp; Mode</th>
                      <th className="py-3 px-3">Kunjungan Live</th>
                      <th className="py-3 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {filteredAccounts.map((acc) => {
                      const isOwner = isPrimarySystemOwnerAccount(acc, acc.email);
                      const grant = adminTierGrantsMap[acc.id];
                      const isTierAdmin =
                        isOwner || isAdminCardAccount(acc) || (grant && grant.status !== 'revoked');
                      const live = liveInfoByAccountId.get(acc.id);
                      const isChecked = selectedIds.includes(acc.id);
                      const tabCount = isOwner
                        ? ALL_ADMIN_TAB_KEYS.length
                        : grant && grant.status !== 'revoked'
                        ? grant.allowedTabs === 'ALL'
                          ? ALL_ADMIN_TAB_KEYS.length
                          : grant.allowedTabs.length
                        : 0;

                      return (
                        <tr key={acc.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 px-3">
                            {!isOwner ? (
                              <button
                                type="button"
                                onClick={() => toggleSelectAccount(acc.id)}
                                className="text-slate-400 hover:text-amber-300 cursor-pointer"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-amber-400" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-amber-400" />
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-white">{acc.fullName}</div>
                            <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                              {acc.accountNumber} · {acc.email || '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-amber-300 uppercase">
                              {acc.cardTier}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {isOwner
                                ? 'Owner Utama'
                                : grant?.isFrozen
                                ? 'Dibekukan'
                                : isTierAdmin
                                ? grant?.customTitle || 'Tier Admin'
                                : 'Belum Admin'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums">
                            {isTierAdmin ? (
                              <div>
                                <span className="text-white font-semibold">{tabCount} Tab</span>
                                <span className="text-slate-400 font-sans ml-1.5">
                                  ({grant?.accessLevel === 'read_only' ? 'Hanya Lihat' : 'Penuh'})
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono tabular-nums">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  live?.isOnline ? 'bg-emerald-400' : 'bg-slate-600'
                                }`}
                              />
                              <span className="text-slate-200">{live?.totalVisits || 0}x</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans truncate max-w-[160px]">
                              {live?.latestLocation || '-'}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {isOwner ? (
                              <span className="text-[11px] text-amber-400 font-semibold">Terkunci</span>
                            ) : (
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openEditorForAccounts([acc])}
                                  className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer whitespace-nowrap"
                                >
                                  {isTierAdmin ? 'Edit Izin' : 'Angkat Admin'}
                                </button>
                                {isTierAdmin && (
                                  <button
                                    type="button"
                                    onClick={() => setRevokeTarget(acc)}
                                    className="px-2 py-1 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-700/70 text-rose-300 cursor-pointer"
                                  >
                                    Cabut
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Audit Log & Activity Tab */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Riwayat Audit Pengangkatan, Perubahan Izin &amp; Aktivitas Admin Baru
              </h3>
              <p className="text-xs text-slate-400">
                Mencatat setiap pengangkatan, perubahan tab, pembekuan, pencabutan, peringatan perangkat, serta aktivitas Admin di tab yang diizinkan.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono tabular-nums">
              {adminTierAuditLogs.length} catatan
            </span>
          </div>

          {adminTierAuditLogs.length === 0 ? (
            <div className="border border-dashed border-slate-800 rounded-xl p-8 text-center text-xs text-slate-400">
              Belum ada riwayat pengangkatan atau aktivitas Kartu Tier Admin.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Aksi</th>
                    <th className="py-2.5 px-3">Pelaku</th>
                    <th className="py-2.5 px-3">Target Kartu</th>
                    <th className="py-2.5 px-3">Rincian &amp; Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70">
                  {adminTierAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestampMs || log.timestampIso).toLocaleString('id-ID')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold whitespace-nowrap">
                        <span
                          className={
                            log.action === 'revoke' || log.action === 'device_alert'
                              ? 'text-rose-400'
                              : log.action === 'freeze' || log.action === 'auto_expire'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {log.action.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-200">{log.actorName}</td>
                      <td className="py-2.5 px-3">
                        <div className="text-white font-medium">{log.targetAccountName}</div>
                        <div className="text-[10px] text-slate-500 font-mono tabular-nums">
                          {log.targetAccountNumber}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-300">
                        <div>{log.detail}</div>
                        {log.reason && (
                          <div className="text-[11px] text-slate-500 mt-0.5">Alasan: {log.reason}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL: PENGANGKATAN & ATUR IZIN PER-TAB GRANULAR ================= */}
      {editorTargets.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <form
            onSubmit={handleSavePromotion}
            className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl"
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/60">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>
                    {editorTargets.length === 1
                      ? `Angkat & Atur Izin Tier Admin: ${editorTargets[0].fullName}`
                      : `Pengaturan Izin Massal Tier Admin (${editorTargets.length} Kartu)`}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Pilih 1 tab saja, beberapa tab pilihan, atau Semua Tab. Tab lain otomatis disembunyikan dari layar Admin ini secara real-time.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditorTargets([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs">
              {/* 1. 5 Preset Paket Izin Cepat */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>1. Preset Paket Izin Cepat (Opsional — 1 Klik)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {ADMIN_PERMISSION_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyPreset(preset.id)}
                      className="text-left p-3 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/60 transition-colors cursor-pointer space-y-1"
                    >
                      <div className="font-bold text-white">{preset.name}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Pilih Tab Panel Admin Secara Granular (Bisa 1 Tab Saja!) */}
              <div className="space-y-2.5 border-t border-slate-800 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-white">
                    2. Pilih Tab Panel Admin yang Diizinkan ({previewTabItems.length} tab aktif)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDraftAllTabs(true);
                        setDraftTabs(
                          isSuperOwner
                            ? [...ALL_ADMIN_TAB_KEYS]
                            : ALL_ADMIN_TAB_KEYS.filter((k) => k !== 'admin_tier_promotion')
                        );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/40 text-indigo-300 font-semibold cursor-pointer"
                    >
                      Pilih Semua Tab
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDraftAllTabs(false);
                        setDraftTabs([]);
                        setDraftCanManageTiers(false);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
                    >
                      Kosongkan
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(groupedCatalog).map(([groupName, items]) => (
                    <div key={groupName} className="space-y-1.5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        {groupName}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {items.map((item) => {
                          const isPromoTab = item.key === 'admin_tier_promotion';
                          const disabled = isPromoTab && !isSuperOwner;
                          const checked =
                            (draftAllTabs && (!isPromoTab || (isSuperOwner && draftCanManageTiers))) ||
                            draftTabs.includes(item.key);
                          return (
                            <button
                              key={item.key}
                              type="button"
                              disabled={disabled}
                              onClick={() => toggleDraftTab(item.key)}
                              className={`flex items-start gap-2 p-2.5 rounded-xl border text-left transition-colors ${
                                disabled
                                  ? 'bg-slate-950/40 border-slate-800/50 opacity-50 cursor-not-allowed'
                                  : checked
                                  ? 'bg-amber-500/15 border-amber-500/60 text-white cursor-pointer'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                              }`}
                            >
                              <div
                                className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center shrink-0 border ${
                                  checked
                                    ? 'bg-amber-500 border-amber-400 text-slate-950'
                                    : 'border-slate-600'
                                }`}
                              >
                                {checked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold leading-tight truncate">
                                  {item.shortLabel}
                                </div>
                                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                                  {isPromoTab ? 'Khusus Super Admin / Delegasi' : item.description}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Pratinjau Langsung Panel Admin versi Orang Ini */}
              <div className="bg-slate-950 border border-indigo-500/40 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-indigo-300 inline-flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Pratinjau Langsung Panel Admin (Yang Akan Dilihat Admin Ini)</span>
                  </span>
                  <span className="font-mono tabular-nums text-slate-400">
                    {previewTabItems.length} tab terlihat ·{' '}
                    {ADMIN_TAB_CATALOG.length - previewTabItems.length} tab disembunyikan
                  </span>
                </div>
                {previewTabItems.length === 0 ? (
                  <p className="text-[11px] text-rose-400">
                    Belum ada tab dipilih. Pilih minimal 1 tab agar Admin ini dapat mengakses Panel Admin.
                  </p>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {previewTabItems.map((t, idx) => (
                      <span
                        key={t.key}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                          idx === 0
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-200 border border-slate-700'
                        }`}
                      >
                        {t.shortLabel}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Tingkat Akses, Akses Masuk Panel & Masa Berlaku */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-1.5">
                  <label className="font-bold text-white block">Tingkat Akses Aksi</label>
                  <select
                    value={draftAccessLevel}
                    onChange={(e) => setDraftAccessLevel(e.target.value as AdminTierAccessLevel)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="full">Akses Penuh (Lihat, Edit &amp; Aksi)</option>
                    <option value="read_only">Hanya Lihat (Read-Only)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-white block">Cara Buka Panel Admin</label>
                  <select
                    value={draftPanelAccess}
                    onChange={(e) => setDraftPanelAccess(e.target.value as AdminTierPanelAccessMode)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="auto_open">Langsung Buka Otomatis (Tanpa PIN)</option>
                    <option value="require_pin">Tetap Wajib PIN Admin</option>
                  </select>
                  {draftPanelAccess === 'require_pin' && (
                    <input
                      type="text"
                      value={draftCustomPin}
                      onChange={(e) => setDraftCustomPin(e.target.value)}
                      placeholder="PIN kustom opsional (kosong = PIN Admin utama)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white mt-1.5"
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-white block">Masa Berlaku Kontrak</label>
                  <select
                    value={draftDurationMode}
                    onChange={(e) => setDraftDurationMode(e.target.value as AdminTierDurationMode)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="permanent">Permanen (Sampai Dicabut)</option>
                    <option value="timed">Kontrak Berbatas Waktu (Otomatis Turun)</option>
                  </select>
                  {draftDurationMode === 'timed' && (
                    <select
                      value={draftDurationPresetHours}
                      onChange={(e) => setDraftDurationPresetHours(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white mt-1.5"
                    >
                      <option value="1">1 Jam</option>
                      <option value="6">6 Jam</option>
                      <option value="24">1 Hari (24 Jam)</option>
                      <option value="168">7 Hari</option>
                      <option value="720">30 Hari</option>
                    </select>
                  )}
                </div>
              </div>

              {/* 5. Pengaturan Aset Kartu (Uang, Koin, Diamond, Voucher, Emas) */}
              <div className="space-y-2.5 border-t border-slate-800 pt-4">
                <label className="font-bold text-white block">
                  Pengaturan Aset Kartu (Uang, Koin, Diamond, Voucher Level, Emas)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {(
                    [
                      ['keep_original', 'Pertahankan Saldo Asli', 'Hanya ubah hak akses tab & kartu'],
                      ['unlimited_all', 'Semua Aset Tak Terbatas', 'Uang, Koin, Diamond, Voucher, Emas ∞'],
                      ['custom_bonus', 'Paket Bonus Kustom', 'Isi nominal tambahan manual tiap aset'],
                      ['daily_capped', 'Batas Maksimal Harian', 'Batasi penggunaan harian saldo Admin'],
                    ] as const
                  ).map(([mode, title, desc]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setDraftAssetMode(mode)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer ${
                        draftAssetMode === mode
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{desc}</div>
                    </button>
                  ))}
                </div>

                {draftAssetMode === 'custom_bonus' && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950 border border-slate-800 rounded-xl p-3">
                    <div>
                      <label className="text-[10px] text-slate-400">Bonus Uang (Rp)</label>
                      <input
                        type="text"
                        value={draftBonusMoney}
                        onChange={(e) => setDraftBonusMoney(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Bonus Koin</label>
                      <input
                        type="text"
                        value={draftBonusCoins}
                        onChange={(e) => setDraftBonusCoins(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Bonus Diamond</label>
                      <input
                        type="text"
                        value={draftBonusDiamonds}
                        onChange={(e) => setDraftBonusDiamonds(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Voucher Level</label>
                      <input
                        type="text"
                        value={draftBonusVouchers}
                        onChange={(e) => setDraftBonusVouchers(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400">Emas (gram)</label>
                      <input
                        type="text"
                        value={draftBonusGold}
                        onChange={(e) => setDraftBonusGold(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white font-mono mt-1"
                      />
                    </div>
                  </div>
                )}

                {draftAssetMode === 'daily_capped' && (
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center gap-3">
                    <label className="text-xs text-slate-300 whitespace-nowrap">
                      Batas Harian (Rp):
                    </label>
                    <input
                      type="text"
                      value={draftDailyCap}
                      onChange={(e) => setDraftDailyCap(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* 6. Identitas Jabatan, Pengaman Fingerprint Perangkat & Surat Resmi */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-800 pt-4">
                <div className="space-y-2.5">
                  <label className="font-bold text-white block">Identitas &amp; Label Jabatan</label>
                  <input
                    type="text"
                    value={draftCustomTitle}
                    onChange={(e) => setDraftCustomTitle(e.target.value)}
                    placeholder="Mis. Admin Keuangan, Admin Chat..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftShowCrown}
                      onChange={(e) => setDraftShowCrown(e.target.checked)}
                    />
                    <span>Tampilkan Lencana Mahkota di Profil &amp; Nusantara Chat</span>
                  </label>
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftHideAdminStatus}
                      onChange={(e) => setDraftHideAdminStatus(e.target.checked)}
                    />
                    <span>Mode Penyamaran (Sembunyikan status Admin dari nasabah biasa)</span>
                  </label>
                  <label className="flex items-center gap-2 text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftSendLetter}
                      onChange={(e) => setDraftSendLetter(e.target.checked)}
                    />
                    <span>Kirim Popup Surat Pengangkatan Resmi + Notifikasi Lonceng</span>
                  </label>
                </div>

                <div className="space-y-2.5">
                  <label className="font-bold text-white block">
                    Pengaman Fingerprint Perangkat &amp; Alasan Pengangkatan
                  </label>
                  <select
                    value={draftTrustedMode}
                    onChange={(e) =>
                      setDraftTrustedMode(e.target.value as AdminTierTrustedDeviceMode)
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="alert_new_device">
                      Peringatkan Admin saat Login dari Perangkat Baru
                    </option>
                    <option value="lock_trusted_device">
                      Kunci Mutlak ke Perangkat Terpercaya Saja
                    </option>
                    <option value="unrestricted">Bebas dari Semua Perangkat &amp; Lokasi</option>
                  </select>
                  {draftTrustedMode !== 'unrestricted' && (
                    <input
                      type="text"
                      value={draftTrustedDeviceIds.join(', ')}
                      onChange={(e) =>
                        setDraftTrustedDeviceIds(
                          e.target.value
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                        )
                      }
                      placeholder="ID Perangkat Terpercaya (otomatis terisi saat perangkat login)"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-[11px] font-mono text-cyan-300"
                    />
                  )}
                  <input
                    type="text"
                    value={draftReason}
                    onChange={(e) => setDraftReason(e.target.value)}
                    placeholder="Alasan pengangkatan / catatan audit..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400">
                Perubahan langsung aktif real-time via WebSocket tanpa perlu logout.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditorTargets([])}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan & Aktifkan Real-Time'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL: CABUT / TURUNKAN TIER ADMIN ================= */}
      {revokeTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-700/60 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Cabut Status Kartu Tier Admin</span>
                </h3>
                <p className="text-slate-400 mt-0.5">
                  {revokeTarget.fullName} ({revokeTarget.accountNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-white block">Pilih Tier Kartu Pengganti:</label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  checked={revokeRestoreMode === 'original'}
                  onChange={() => setRevokeRestoreMode('original')}
                />
                <span className="text-slate-200">
                  Kembalikan ke Tier Awal (
                  <strong className="uppercase text-amber-300">
                    {adminTierGrantsMap[revokeTarget.id]?.previousCardTier || 'silver'}
                  </strong>
                  )
                </span>
              </label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="radio"
                  checked={revokeRestoreMode === 'manual'}
                  onChange={() => setRevokeRestoreMode('manual')}
                />
                <span className="text-slate-200">Atur Tier Baru Secara Manual</span>
              </label>

              {revokeRestoreMode === 'manual' && (
                <select
                  value={revokeManualTier}
                  onChange={(e) => setRevokeManualTier(e.target.value as CardTier)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase"
                >
                  {NON_ADMIN_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {CARD_TIER_CONFIGS[tier]?.name || tier}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-300 block">Alasan Pencabutan:</label>
              <input
                type="text"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-200 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmRevoke()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
              >
                Cabut Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
