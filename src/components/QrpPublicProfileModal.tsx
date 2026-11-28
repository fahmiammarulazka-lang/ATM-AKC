import React, { useMemo, useState } from 'react';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Flame,
  Trophy,
  MapPin,
  Layers,
  Crown,
  MessageSquare,
  Star,
  Send,
  CheckCircle2,
  Shield,
  Lock,
  QrCode,
  Sparkles,
  Coins,
  Wallet,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { normalizeNumericIdentifier } from '../utils/qrisTransferUtils';
import { CARD_TIER_CONFIGS as BANK_CARD_TIERS, isAdminCardAccount as checkIsAdminCard } from '../utils/bankUtils';
import { ProfileAvatarBadge } from './ProfileAvatarBadge';
import { TopLeaderboardBadges } from './TopLeaderboardBadges';
import { getFeaturedTitleById } from '../data/profileCustomizationCatalog';
import {
  PROFILE_ACHIEVEMENTS,
  isTitleUnlockedForAccount,
} from '../data/profileAchievementsCatalog';
import {
  MAX_REGULAR_ACCOUNT_LEVEL,
  getAccountLevelSnapshot,
} from '../data/levelSystemCatalog';
import { TransferBebasAssetMode } from '../types/bank';
import { isAccountDisguisedAdmin } from '../types/adminAnalyticsAndTier';
import { useAdminAnalyticsAndTierSync } from '../hooks/useAdminAnalyticsAndTierSync';

export interface QrpPublicProfileTarget {
  targetAccount: string;
  targetUserId?: string;
  targetName?: string;
  source?: 'url' | 'camera' | 'gallery' | 'manual';
}

interface QrpPublicProfileModalProps {
  target: QrpPublicProfileTarget | null;
  onClose: () => void;
}

const MULTI_ASSET_TRANSFER_CHOICES: Array<{
  mode: TransferBebasAssetMode;
  label: string;
  desc: string;
}> = [
  { mode: 'uang', label: 'Saldo Rupiah (Rp)', desc: 'Transfer uang Rupiah instan' },
  { mode: 'emas', label: 'Emas 24K', desc: 'Kirim saldo Emas murni 24K' },
  { mode: 'coin', label: 'Coin Spin', desc: 'Kirim koin roda berhadiah' },
  { mode: 'permata', label: 'Permata (Diamond)', desc: 'Kirim Permata akun' },
  { mode: 'token', label: 'Token Bingkai', desc: 'Kirim Token Spin Bingkai' },
  { mode: 'gabungan', label: 'Paket Gabungan', desc: 'Kirim uang & aset lain sekaligus' },
];

export const QrpPublicProfileModal: React.FC<QrpPublicProfileModalProps> = ({
  target,
  onClose,
}) => {
  const {
    accounts,
    currentAccount,
    loyaltyMap,
    favorites,
    addFavorite,
    addPrivateChatContact,
  } = useBank();
  const { adminTierGrantsMap } = useAdminAnalyticsAndTierSync();

  const [copiedField, setCopiedField] = useState<'acc' | 'uid' | null>(null);
  const [selectedTransferAsset, setSelectedTransferAsset] =
    useState<TransferBebasAssetMode>('uang');
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const matchedAccount = useMemo(() => {
    if (!target) return null;
    const rawAcc = normalizeNumericIdentifier(target.targetAccount);
    const rawUid = normalizeNumericIdentifier(target.targetUserId);
    return (
      accounts.find((a) => {
        const aAcc = normalizeNumericIdentifier(a.accountNumber);
        const aUid = normalizeNumericIdentifier(a.userId16);
        if (rawAcc && (aAcc === rawAcc || aUid === rawAcc)) return true;
        if (rawUid && (aUid === rawUid || aAcc === rawUid)) return true;
        return false;
      }) || null
    );
  }, [target, accounts]);

  if (!target) return null;

  const isSelfProfile = Boolean(
    currentAccount &&
      matchedAccount &&
      currentAccount.id === matchedAccount.id
  );

  const disguisedAdmin = matchedAccount
    ? isAccountDisguisedAdmin(matchedAccount.id, adminTierGrantsMap)
    : false;
  const effectivePublicTier = matchedAccount
    ? disguisedAdmin
      ? adminTierGrantsMap[matchedAccount.id]?.previousCardTier &&
        adminTierGrantsMap[matchedAccount.id]?.previousCardTier !== 'admin'
        ? adminTierGrantsMap[matchedAccount.id]!.previousCardTier!
        : 'regular'
      : matchedAccount.cardTier
    : 'regular';
  const isPublicAdminTier = Boolean(
    matchedAccount && checkIsAdminCard(matchedAccount) && !disguisedAdmin
  );
  const tierMeta =
    BANK_CARD_TIERS[effectivePublicTier] || BANK_CARD_TIERS.regular;

  const levelSnapshot = getAccountLevelSnapshot(matchedAccount, {
    isDisguisedViewer: disguisedAdmin,
  });

  const activeFeaturedTitle =
    matchedAccount?.featuredTitle &&
    isTitleUnlockedForAccount(matchedAccount, matchedAccount.featuredTitle)
      ? getFeaturedTitleById(matchedAccount.featuredTitle)
      : null;

  const claimedAchievementCount = matchedAccount
    ? Object.keys(matchedAccount.profileAchievementClaims || {}).length
    : 0;
  const totalAchievementPoints = matchedAccount
    ? PROFILE_ACHIEVEMENTS.reduce(
        (sum, def) =>
          matchedAccount.profileAchievementClaims?.[def.id] ? sum + def.points : sum,
        0
      )
    : 0;
  const streakDays = matchedAccount
    ? loyaltyMap[matchedAccount.id]?.streakDays || 0
    : 0;

  const displayAccountNumber =
    matchedAccount?.accountNumber || target.targetAccount;
  const displayUserId16 =
    matchedAccount?.userId16 || target.targetUserId || '-';
  const displayName =
    matchedAccount?.fullName || target.targetName || 'Nasabah Bank Nusantara';

  const isAlreadyFavorite = favorites.some(
    (f) => f.accountNumber === displayAccountNumber
  );

  const handleCopy = async (val: string, key: 'acc' | 'uid') => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedField(key);
      window.setTimeout(() => setCopiedField(null), 1600);
    } catch {
      // ignore
    }
  };

  const handleAddPayChatContact = () => {
    if (isSelfProfile) {
      setActionFeedback({
        type: 'error',
        text: 'Ini adalah profil QRP Anda sendiri.',
      });
      return;
    }
    const res = addPrivateChatContact({
      accountNumber: displayAccountNumber,
      userId: displayUserId16 !== '-' ? displayUserId16 : undefined,
      customName: displayName,
    });
    setActionFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSaveFavorite = () => {
    if (isSelfProfile) {
      setActionFeedback({
        type: 'error',
        text: 'Anda tidak perlu menyimpan rekening sendiri ke daftar favorit.',
      });
      return;
    }
    if (isAlreadyFavorite) {
      setActionFeedback({
        type: 'success',
        text: `Rekening ${displayName} (${displayAccountNumber}) sudah ada di daftar Rekening Favorit Anda.`,
      });
      return;
    }
    addFavorite(
      displayAccountNumber,
      displayName,
      'Bank Nusantara',
      'Kontak dari Scan QRP Profil'
    );
    setActionFeedback({
      type: 'success',
      text: `Berhasil menyimpan ${displayName} (${displayAccountNumber}) ke daftar Rekening Favorit!`,
    });
  };

  const handleProceedMultiAssetTransfer = () => {
    if (isSelfProfile) {
      setActionFeedback({
        type: 'error',
        text: 'Ini adalah kode QRP milik Anda sendiri. Anda tidak dapat mentransfer ke rekening sendiri.',
      });
      return;
    }
    onClose();
    window.dispatchEvent(
      new CustomEvent('bn:qris-transfer', {
        detail: {
          recipientAccount: displayAccountNumber,
          recipientUserId: displayUserId16 !== '-' ? displayUserId16 : undefined,
          recipientBank: 'Bank Nusantara',
          recipientName: displayName,
          assetMode: selectedTransferAsset,
          note: `Transfer via Scan QRP (${displayName})`,
          source: target.source || 'camera',
        },
      })
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Statistik Umum QRP ${displayName}`}
    >
      <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 text-white shadow-2xl overflow-hidden my-auto">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-cyan-950 via-slate-900 to-indigo-950 border-b border-slate-800 px-5 py-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-cyan-300">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-cyan-300">
                  QRP • QR PROFIL STATISTIK UMUM NUSANTARA
                </span>
                {isSelfProfile && (
                  <span className="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black text-slate-950 uppercase">
                    Ini Profil Anda
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-black text-white">
                Kartu Statistik Umum &amp; Reputasi Nasabah
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Statistik QRP"
            className="rounded-xl border border-slate-800 bg-slate-950 p-2 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Identity Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
              {matchedAccount ? (
                <ProfileAvatarBadge account={matchedAccount} size="lg" />
              ) : (
                <div className="h-16 w-16 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xl font-black text-cyan-300 shrink-0">
                  {displayName.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h4 className="text-base sm:text-lg font-black text-white truncate">
                    {displayName}
                  </h4>
                  {matchedAccount?.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/20 border border-blue-400/40 px-2 py-0.5 text-[10px] font-bold text-blue-300">
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Terverifikasi</span>
                    </span>
                  )}
                  {matchedAccount?.isOfficialAdminAccount && !disguisedAdmin && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                      <Shield className="h-3 w-3" />
                      <span>OA</span>
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-mono font-black ${
                      levelSnapshot.isInfinity
                        ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                        : 'border-cyan-400/40 bg-cyan-500/15 text-cyan-200'
                    }`}
                  >
                    {levelSnapshot.isInfinity ? (
                      <Crown className="h-3 w-3 text-amber-300" />
                    ) : (
                      <Layers className="h-3 w-3 text-cyan-300" />
                    )}
                    <span>{levelSnapshot.displayLabel}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-200">
                    <span>{tierMeta.nameIndo}</span>
                  </span>

                  {activeFeaturedTitle && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-200">
                      <Award className="h-3 w-3 text-amber-300" />
                      <span>{activeFeaturedTitle.label}</span>
                    </span>
                  )}
                </div>

                {matchedAccount?.city && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-cyan-400 shrink-0" />
                    <span>Domisili: {matchedAccount.city}</span>
                  </p>
                )}
              </div>
            </div>

            {matchedAccount?.profileBio && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/90 px-3.5 py-2.5 text-xs text-slate-300 italic">
                "{matchedAccount.profileBio}"
              </div>
            )}

            {matchedAccount && (
              <TopLeaderboardBadges
                account={matchedAccount}
                variant="full"
                context="profile"
              />
            )}

            {/* Nomor Rekening & ID 16 Digit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    Nomor Rekening
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black text-amber-300 tabular-nums">
                    {displayAccountNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopy(displayAccountNumber, 'acc')}
                  className="rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedField === 'acc' ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block">
                    ID Permanen 16 Digit
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black text-cyan-300 tabular-nums truncate block">
                    {displayUserId16}
                  </span>
                </div>
                {displayUserId16 !== '-' && (
                  <button
                    type="button"
                    onClick={() => void handleCopy(displayUserId16, 'uid')}
                    className="rounded-lg border border-slate-700 bg-slate-950 hover:bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    {copiedField === 'uid' ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Statistik Umum (Level Akun XP, Achievement, Poin, Streak) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 font-bold">
                <Layers className="h-3.5 w-3.5 shrink-0" />
                <span>Level Akun</span>
              </div>
              <p className="font-mono text-base font-black text-white tabular-nums">
                {levelSnapshot.isInfinity
                  ? 'Lv. ∞'
                  : `Lv. ${levelSnapshot.level} / ${MAX_REGULAR_ACCOUNT_LEVEL}`}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {levelSnapshot.isInfinity
                  ? 'Level Tak Terbatas (Admin)'
                  : `${levelSnapshot.xp.toLocaleString('id-ID')} XP Total`}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-bold">
                <Trophy className="h-3.5 w-3.5 shrink-0" />
                <span>Achievement</span>
              </div>
              <p className="font-mono text-base font-black text-white tabular-nums">
                {isPublicAdminTier
                  ? `${PROFILE_ACHIEVEMENTS.length} / ${PROFILE_ACHIEVEMENTS.length}`
                  : `${claimedAchievementCount} / ${PROFILE_ACHIEVEMENTS.length}`}
              </p>
              <p className="text-[10px] text-slate-400">Piala Terbuka</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-bold">
                <Award className="h-3.5 w-3.5 shrink-0" />
                <span>Poin Prestasi</span>
              </div>
              <p className="font-mono text-base font-black text-white tabular-nums">
                {isPublicAdminTier
                  ? '∞'
                  : totalAchievementPoints.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400">Poin Achievement</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-orange-300 font-bold">
                <Flame className="h-3.5 w-3.5 shrink-0" />
                <span>Streak Online</span>
              </div>
              <p className="font-mono text-base font-black text-white tabular-nums">
                {isPublicAdminTier ? '∞ Hari' : `${streakDays} Hari`}
              </p>
              <p className="text-[10px] text-slate-400">Keaktifan Harian</p>
            </div>
          </div>

          {/* Proteksi Privasi Saldo */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/75 px-3.5 py-2.5 flex items-center gap-2.5 text-[11px] text-slate-400">
            <Lock className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Privasi Perbankan Terlindungi:</strong> Saldo Rupiah, nilai portofolio Emas, PIN, dan mutasi pribadi tidak ditampilkan pada kartu Statistik Umum QRP.
            </span>
          </div>

          {actionFeedback && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-bold flex items-center justify-between gap-2 ${
                actionFeedback.type === 'success'
                  ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-200'
                  : 'border-rose-500/40 bg-rose-950/60 text-rose-200'
              }`}
            >
              <span>{actionFeedback.text}</span>
              <button
                type="button"
                onClick={() => setActionFeedback(null)}
                className="text-[11px] underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Tombol Aksi Cepat + Pilihan Kirim Multi-Aset */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black text-white uppercase tracking-wider">
                Aksi Cepat &amp; Transfer Multi-Aset ke Rekening Ini
              </span>
              <span className="text-[10px] text-cyan-300 font-semibold">
                Pilih Aset Kiriman
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {MULTI_ASSET_TRANSFER_CHOICES.map((item) => {
                const active = selectedTransferAsset === item.mode;
                return (
                  <button
                    key={item.mode}
                    type="button"
                    onClick={() => setSelectedTransferAsset(item.mode)}
                    className={`rounded-xl border px-2.5 py-2 text-left transition cursor-pointer ${
                      active
                        ? 'border-emerald-400 bg-emerald-500/15 text-white'
                        : 'border-slate-800 bg-slate-900/90 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <p className="text-[11px] font-black truncate">{item.label}</p>
                    <p className="text-[10px] text-slate-400 truncate">{item.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={handleAddPayChatContact}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-500/15 hover:bg-cyan-500/25 px-3 py-2 text-xs font-black text-cyan-200 cursor-pointer"
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <span>Tambah Kontak PayChat</span>
              </button>

              <button
                type="button"
                onClick={handleSaveFavorite}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-2 text-xs font-black text-amber-200 cursor-pointer"
              >
                <Star className="h-4 w-4 shrink-0" />
                <span>{isAlreadyFavorite ? 'Sudah di Favorit' : 'Simpan Favorit'}</span>
              </button>

              <button
                type="button"
                onClick={handleProceedMultiAssetTransfer}
                className="min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 px-3 py-2 text-xs font-black text-slate-950 cursor-pointer"
              >
                <Send className="h-4 w-4 shrink-0" />
                <span>Lanjut Transfer Aset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
