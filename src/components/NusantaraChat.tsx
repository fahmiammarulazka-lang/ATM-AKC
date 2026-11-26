/**
 * Bank Nusantara — Chat Global & Priv (v15.41.49)
 * - Sinkronisasi lintas perangkat Anti-Timpa (Union-Merge + Penyimpanan Terpisah Per-ID Cloud & Server + Tombstone Registry)
 * - Composer Enter = Baris Baru, Ctrl+Enter = Kirim/Simpan Edit (otomatis melebar hingga 5 baris + opsi tukar pribadi)
 * - Hapus untuk Semua Orang ketat hanya milik pengirim asli pesan (HP1/HP2 fix)
 * - Multi-aset Uang (Rp), Coin, Diamond untuk Kirim/Minta, Patungan Grup, & Amplop Kaget ala DANA (Siapa Cepat Banyak, Acak, Merata)
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Globe,
  Lock,
  Unlock,
  Send,
  Search,
  UserPlus,
  Users,
  DollarSign,
  Check,
  CheckCheck,
  ShieldCheck,
  ShieldAlert,
  Pin,
  PinOff,
  Trash2,
  Reply,
  X,
  ArrowLeft,
  Info,
  Edit3,
  HandCoins,
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Copy,
  Star,
  Forward,
  BarChart2,
  SlidersHorizontal,
  Ban,
  AlertTriangle,
  VolumeX,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Flame,
  Plus,
  Gift,
  Coins,
  Gem,
  Image as ImageIcon,
  Mic,
  Square,
  Flag,
  Archive,
  BellOff,
  Bell,
  Clock,
  Receipt,
  CalendarClock,
  UserCheck,
  Download,
  Award,
  Headphones,
  Keyboard,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  BankAccount,
  ChatAssetKind,
  ChatCustomBadgeTier,
  ChatForwardInfo,
  ChatMessage,
  ChatPollData,
  ChatRedPacketData,
  ChatRedPacketMode,
  GlobalChatMessage,
  PrivateChatContact,
  PrivateChatGroup,
} from '../types/bank';
import { formatRupiah } from '../utils/bankUtils';
import { PinPromptModal } from './PinPromptModal';
import {
  AddContactModal,
  AdminModerationModal,
  AdminQuickAccountModal,
  AdminWarnModal,
  BillReminderModal,
  CreateGroupModal,
  CreatePollModal,
  CreateRedPacketModal,
  CreateSplitBillModal,
  EmojiReactionModal,
  ForwardMessageModal,
  GroupInfoModal,
  ImageLightboxModal,
  MultiAssetTransferModal,
  ReactionVotersModal,
  ReadReceiptModal,
  RedPacketDetailModal,
  ReportMessageModal,
  SendContactCardModal,
  formatChatDateTime,
  formatChatTimeShort,
  formatModalAssetValue,
  getChatGroupColorClass,
  renderChatGroupIcon,
} from './ChatPortalModals';

type MainChatTab = 'global' | 'private';
type PrivateFilter = 'all' | 'dm' | 'group' | 'archived';

interface ActivePrivateTarget {
  type: 'dm' | 'group';
  id: string;
  accountNumber?: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];
const QUICK_REPLY_CHIPS = ['Halo 👋', 'Siap, terima kasih!', 'Mohon dicek ya 🙏', 'Sudah diproses ✅'];
const EDIT_WINDOW_MS = 15 * 60 * 1000;

function renderFormattedInlineSegment(segment: string, keyPrefix: string): React.ReactNode {
  const tokenRegex = /(\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|@[A-Za-z0-9_]+)/g;
  const parts = segment.split(tokenRegex);
  return parts.map((part, idx) => {
    const k = `${keyPrefix}-${idx}`;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <strong key={k} className="font-extrabold">{part.slice(1, -1)}</strong>;
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return <em key={k} className="italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return <s key={k} className="line-through opacity-75">{part.slice(1, -1)}</s>;
    }
    if (part.startsWith('@') && part.length > 1) {
      return (
        <span key={k} className="px-1 py-0.5 rounded bg-white/15 font-bold underline decoration-dotted">
          {part}
        </span>
      );
    }
    return <React.Fragment key={k}>{part}</React.Fragment>;
  });
}

const CollapsibleChatBody: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split('\n');
  const isLong = lines.length > 12 || text.length > 720;
  const displayText =
    isLong && !expanded
      ? lines.slice(0, 12).join('\n').slice(0, 680) + (text.length > 680 || lines.length > 12 ? '...' : '')
      : text;

  return (
    <div className="space-y-1">
      <div className="text-sm whitespace-pre-wrap break-words leading-relaxed">
        {displayText.split('\n').map((line, lIdx) => (
          <React.Fragment key={lIdx}>
            {renderFormattedInlineSegment(line, `line-${lIdx}`)}
            {lIdx < displayText.split('\n').length - 1 && <br />}
          </React.Fragment>
        ))}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-extrabold underline decoration-dotted opacity-90 hover:opacity-100"
        >
          {expanded ? 'Tampilkan lebih sedikit' : 'Baca selengkapnya'}
        </button>
      )}
    </div>
  );
};

async function compressChatImageFile(file: File): Promise<{
  dataUrl: string;
  fileName: string;
  sizeBytes: number;
  width: number;
  height: number;
}> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = bitmapUrl;
    });
    const maxDim = 720;
    const scale = Math.min(1, maxDim / Math.max(img.width || 1, img.height || 1));
    const targetW = Math.max(1, Math.round(img.width * scale));
    const targetH = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak tersedia');
    ctx.drawImage(img, 0, 0, targetW, targetH);

    let quality = 0.72;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 88000 && quality > 0.35) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    return {
      dataUrl,
      fileName: file.name,
      sizeBytes: Math.round((dataUrl.length * 3) / 4),
      width: targetW,
      height: targetH,
    };
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

export const NusantaraChat: React.FC = () => {
  const {
    currentAccount,
    accounts,
    adminUnlocked,
    connectedDevicesCount,
    customerPresenceMap,
    globalChats,
    globalChatConfig,
    chatModerationLogs,
    chatTypingMap,
    emitChatTyping,
    refreshChatSyncNow,
    sendGlobalChatMessage,
    editGlobalChatMessage,
    toggleGlobalChatReaction,
    voteGlobalChatPoll,
    togglePinGlobalChatMessage,
    toggleGlobalChatAdminLock,
    adminUpdateGlobalChatConfig,
    adminMuteGlobalChatUser,
    adminUnmuteGlobalChatUser,
    adminBulkDeleteUserGlobalChats,
    adminWarnUserFromChat,
    adminSetCustomerChatBadge,
    deleteGlobalChatMessage,
    clearGlobalChatMessages,
    chats,
    sendChatMessage,
    sendChatAssetTransfer,
    payChatTransferRequest,
    rejectChatTransferRequest,
    createChatRedPacket,
    claimChatRedPacket,
    createChatSplitBill,
    payChatSplitBill,
    submitChatReport,
    markChatWelcomeSeen,
    togglePinChatRoom,
    toggleArchiveChatRoom,
    toggleBlockChatAccount,
    toggleChatDnd,
    toggleEnterKeyPreference,
    privateChatGroups,
    chatLastReadMap,
    markChatRoomRead,
    globalChatUnreadCount,
    privateChatUnreadCount,
    addPrivateChatContact,
    removePrivateChatContact,
    editPrivateChatMessage,
    deletePrivateChatMessage,
    togglePrivateChatReaction,
    votePrivateChatPoll,
    togglePinPrivateChatMessage,
    markPrivateMessagesRead,
    toggleBookmarkChatMessage,
    hideChatMessageForMe,
    toggleMutePrivateGroup,
    createPrivateChatGroup,
    updatePrivateChatGroupDetails,
    addMemberToPrivateGroup,
    removeMemberFromPrivateGroup,
    leavePrivateChatGroup,
    deletePrivateChatGroup,
  } = useBank();

  const [mainTab, setMainTab] = useState<MainChatTab>('global');
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [refreshingChat, setRefreshingChat] = useState(false);

  // Auto-draft per room key
  const [draftByRoom, setDraftByRoom] = useState<Record<string, string>>({});
  const globalTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const privateTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const globalImageInputRef = useRef<HTMLInputElement | null>(null);
  const privateImageInputRef = useRef<HTMLInputElement | null>(null);

  // Voice Note recording
  const [recordingScope, setRecordingScope] = useState<'global' | 'private' | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);

  // Disappearing message timer (seconds: 0 | 60 | 3600 | 86400)
  const [disappearSec, setDisappearSec] = useState<0 | 60 | 3600 | 86400>(0);

  // Global Chat states
  const [globalReplyTarget, setGlobalReplyTarget] = useState<GlobalChatMessage | null>(null);
  const [globalEditTarget, setGlobalEditTarget] = useState<GlobalChatMessage | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalBookmarkedOnly, setGlobalBookmarkedOnly] = useState(false);
  const [globalPinnedExpanded, setGlobalPinnedExpanded] = useState(false);
  const [adminHighlightMode, setAdminHighlightMode] = useState(true);
  const [globalCooldownLeft, setGlobalCooldownLeft] = useState(0);
  const [globalSending, setGlobalSending] = useState(false);
  const globalEndRef = useRef<HTMLDivElement | null>(null);

  // Private Chat states
  const [privateFilter, setPrivateFilter] = useState<PrivateFilter>('all');
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('');
  const [activeTarget, setActiveTarget] = useState<ActivePrivateTarget | null>(null);
  const [privateReplyTarget, setPrivateReplyTarget] = useState<ChatMessage | null>(null);
  const [privateEditTarget, setPrivateEditTarget] = useState<ChatMessage | null>(null);
  const [privateRoomSearchOpen, setPrivateRoomSearchOpen] = useState(false);
  const [privateRoomSearchQuery, setPrivateRoomSearchQuery] = useState('');
  const [privateBookmarkedOnly, setPrivateBookmarkedOnly] = useState(false);
  const [groupPinnedExpanded, setGroupPinnedExpanded] = useState(false);
  const [dismissedUnsavedBannerKeys, setDismissedUnsavedBannerKeys] = useState<Record<string, boolean>>({});
  const privateEndRef = useRef<HTMLDivElement | null>(null);

  // Popover `···` state
  const [openMenuMsgId, setOpenMenuMsgId] = useState<string | null>(null);
  const [showEditedTipId, setShowEditedTipId] = useState<string | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Portal Modals
  const [addContactModalState, setAddContactModalState] = useState<{
    open: boolean;
    prefill?: { customName?: string; userId?: string; accountNumber?: string; isQuickSave?: boolean } | null;
  }>({ open: false, prefill: null });
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showGroupInfoModal, setShowGroupInfoModal] = useState(false);
  const [readReceiptModalMsg, setReadReceiptModalMsg] = useState<ChatMessage | null>(null);
  const [forwardModalPayload, setForwardModalPayload] = useState<{
    text: string;
    meta: ChatForwardInfo;
  } | null>(null);
  const [pollModalScope, setPollModalScope] = useState<'global' | 'group' | null>(null);
  const [adminModModalState, setAdminModModalState] = useState<{
    open: boolean;
    tab?: 'broadcast' | 'moderation' | 'filter' | 'logs';
    muteTarget?: { accountId: string; name: string; accountNumber?: string } | null;
  }>({ open: false });
  const [warnModalTarget, setWarnModalTarget] = useState<{ accountId: string; name: string } | null>(null);
  const [emojiPickerTarget, setEmojiPickerTarget] = useState<{
    scope: 'global' | 'private';
    msgId: string;
  } | null>(null);

  // Multi-Asset Send/Request, Amplop Kaget, Split Bill, Contact Card, Bill Reminder, Report, Lightbox, Reactions, Admin Quick Account
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isRequestAssetMode, setIsRequestAssetMode] = useState(false);
  const [redPacketModalScope, setRedPacketModalScope] = useState<'global' | 'group' | null>(null);
  const [redPacketDetailTarget, setRedPacketDetailTarget] = useState<ChatRedPacketData | null>(null);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showContactCardModal, setShowContactCardModal] = useState(false);
  const [showBillReminderModal, setShowBillReminderModal] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    scope: 'global' | 'private';
    messageId: string;
    roomKey: string;
    reportedAccountId?: string;
    reportedName: string;
    messagePreview: string;
  } | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{ url: string; fileName?: string } | null>(null);
  const [reactionVotersTarget, setReactionVotersTarget] = useState<Record<string, string[]> | null>(null);
  const [adminQuickAcc, setAdminQuickAcc] = useState<BankAccount | null>(null);

  // PIN verification action dispatcher
  type PendingPinAction =
    | {
        kind: 'asset_send';
        assetKind: ChatAssetKind;
        amount: number;
        note: string;
        targetAccountId?: string;
      }
    | { kind: 'pay_request'; messageId: string; amount: number; assetKind: ChatAssetKind; senderName: string }
    | {
        kind: 'create_red_packet';
        scope: 'global' | 'group';
        groupId?: string;
        assetKind: ChatAssetKind;
        totalAmount: number;
        quota: number;
        mode: ChatRedPacketMode;
        note: string;
        isOfficialAdmin: boolean;
      }
    | { kind: 'pay_split_bill'; messageId: string; amount: number; assetKind: ChatAssetKind; title: string };

  const [pendingPinAction, setPendingPinAction] = useState<PendingPinAction | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastBanner({ text, type });
    window.setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 4200);
  };

  const isAdminUser = Boolean(
    adminUnlocked ||
      currentAccount?.cardTier === 'admin' ||
      currentAccount?.isOfficialAdminAccount ||
      currentAccount?.id === 'acc-admin'
  );

  const bookmarkedIdSet = useMemo(
    () => new Set<string>(currentAccount?.bookmarkedChatIds || []),
    [currentAccount?.bookmarkedChatIds]
  );

  const hiddenChatIdSet = useMemo(
    () => new Set<string>(currentAccount?.hiddenChatMessageIds || []),
    [currentAccount?.hiddenChatMessageIds]
  );

  const mutedGroupIdSet = useMemo(
    () => new Set<string>(currentAccount?.mutedGroupIds || []),
    [currentAccount?.mutedGroupIds]
  );

  const mySavedContacts = useMemo<PrivateChatContact[]>(() => {
    if (!currentAccount) return [];
    return Array.isArray(currentAccount.savedChatContacts) ? currentAccount.savedChatContacts : [];
  }, [currentAccount]);

  const myGroups = useMemo<PrivateChatGroup[]>(() => {
    if (!currentAccount) return [];
    return privateChatGroups
      .filter((g) => Array.isArray(g.memberAccountIds) && g.memberAccountIds.includes(currentAccount.id))
      .sort((a, b) => (b.updatedAtMs || 0) - (a.updatedAtMs || 0));
  }, [privateChatGroups, currentAccount]);

  const activeGroup = useMemo<PrivateChatGroup | null>(() => {
    if (!activeTarget || activeTarget.type !== 'group') return null;
    return myGroups.find((g) => g.id === activeTarget.id) || null;
  }, [activeTarget, myGroups]);

  const activeRoomKey = useMemo(() => {
    if (mainTab === 'global') return 'global';
    if (!activeTarget) return 'private:none';
    return activeTarget.type === 'group' ? `group:${activeTarget.id}` : `dm:${activeTarget.id}`;
  }, [mainTab, activeTarget]);

  const activeDraftText = draftByRoom[activeRoomKey] || '';
  const setActiveDraftText = (val: string) => {
    setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: val }));
    const match = val.match(/@([a-zA-Z0-9_ ]{0,24})$/);
    if (match && (mainTab === 'global' || activeTarget?.type === 'group')) {
      setMentionQuery(match[1].toLowerCase());
    } else {
      setMentionQuery(null);
    }
    if (val.trim()) {
      emitChatTyping(activeRoomKey);
    }
  };

  // Feature flags & preferences derived safely
  const featureFlags = globalChatConfig.featureFlags || {};
  const enterKeySends = Boolean(currentAccount?.enterKeySendsMessage);
  const pinnedRoomKeySet = useMemo(
    () => new Set<string>(currentAccount?.pinnedChatRoomKeys || []),
    [currentAccount?.pinnedChatRoomKeys]
  );
  const archivedRoomKeySet = useMemo(
    () => new Set<string>(currentAccount?.archivedChatRoomKeys || []),
    [currentAccount?.archivedChatRoomKeys]
  );
  const blockedAccountIdSet = useMemo(
    () => new Set<string>(currentAccount?.blockedChatAccountIds || []),
    [currentAccount?.blockedChatAccountIds]
  );

  const isGlobalLockedFlag = !isAdminUser && Boolean(featureFlags.disableGlobalChat);
  const isPrivateLockedFlag = !isAdminUser && Boolean(featureFlags.disablePrivateChat);
  const isGroupLockedFlag = !isAdminUser && Boolean(featureFlags.disableGroupChat);
  const isCreateGroupLockedFlag = !isAdminUser && Boolean(featureFlags.disableCreateGroup);
  const isAssetLockedFlag = !isAdminUser && Boolean(featureFlags.disableAssetTransfers);
  const isRedPacketLockedFlag = !isAdminUser && Boolean(featureFlags.disableRedPacket);
  const isSplitBillLockedFlag = !isAdminUser && Boolean(featureFlags.disableSplitBill);
  const isImageLockedFlag = !isAdminUser && Boolean(featureFlags.disableImages);
  const isVoiceLockedFlag = !isAdminUser && Boolean(featureFlags.disableVoiceNotes);
  const isPollLockedFlag = !isAdminUser && Boolean(featureFlags.disablePolls);
  const isReactionLockedFlag = !isAdminUser && Boolean(featureFlags.disableReactions);
  const isEditLockedFlag = !isAdminUser && Boolean(featureFlags.disableMessageEdit);

  // Auto-resize active textarea up to 5 lines (~128px) then internal scroll
  useEffect(() => {
    const el = mainTab === 'global' ? globalTextareaRef.current : privateTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(128, Math.max(42, el.scrollHeight))}px`;
  }, [activeDraftText, mainTab, activeTarget?.id]);

  // Voice recording duration ticker (auto-stop at 30s)
  useEffect(() => {
    if (!recordingScope) {
      setRecordingSeconds(0);
      return;
    }
    const timer = window.setInterval(() => {
      setRecordingSeconds((prev) => {
        if (prev >= 29) {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
          }
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recordingScope]);

  // Close `···` menu when clicking outside
  useEffect(() => {
    if (!openMenuMsgId) return;
    const close = () => setOpenMenuMsgId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuMsgId]);

  // Cooldown tick
  useEffect(() => {
    if (globalCooldownLeft <= 0) return;
    const t = window.setInterval(() => {
      setGlobalCooldownLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [globalCooldownLeft]);

  // Mark Global Chat read when viewing
  useEffect(() => {
    if (mainTab === 'global' && currentAccount) {
      markChatRoomRead('global');
    }
  }, [mainTab, globalChats.length, currentAccount?.id]);

  // Auto-scroll Global Chat
  useEffect(() => {
    if (mainTab === 'global' && !globalSearchQuery && !globalBookmarkedOnly) {
      globalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [mainTab, globalChats.length]);

  // Mark active private room read + auto-send Read Receipts
  const activePrivateMessages = useMemo<ChatMessage[]>(() => {
    if (!currentAccount || !activeTarget) return [];
    if (activeTarget.type === 'group') {
      return chats
        .filter((m) => !m.deleted && m.groupId === activeTarget.id)
        .sort((a, b) => (a.createdAtMs || Date.parse(a.timestamp || '')) - (b.createdAtMs || Date.parse(b.timestamp || '')));
    }
    const targetAccId = activeTarget.id;
    const targetAccNo = activeTarget.accountNumber;
    return chats
      .filter((m) => {
        if (m.deleted || m.groupId) return false;
        const fromMeToTarget =
          (m.senderAccountId === currentAccount.id || m.senderAccount === currentAccount.accountNumber) &&
          (m.recipientAccountId === targetAccId || (targetAccNo && m.recipientAccount === targetAccNo));
        const fromTargetToMe =
          (m.senderAccountId === targetAccId || (targetAccNo && m.senderAccount === targetAccNo)) &&
          (m.recipientAccountId === currentAccount.id || m.recipientAccount === currentAccount.accountNumber);
        return fromMeToTarget || fromTargetToMe;
      })
      .sort((a, b) => (a.createdAtMs || Date.parse(a.timestamp || '')) - (b.createdAtMs || Date.parse(b.timestamp || '')));
  }, [chats, currentAccount, activeTarget]);

  useEffect(() => {
    if (mainTab !== 'private' || !activeTarget || !currentAccount) return;
    const roomKey = activeTarget.type === 'group' ? `group:${activeTarget.id}` : `dm:${activeTarget.id}`;
    markChatRoomRead(roomKey);
    if (activeTarget.type === 'dm' && activeTarget.accountNumber) {
      markChatRoomRead(`dm:${activeTarget.accountNumber}`);
    }
    const unreadIncomingIds = activePrivateMessages
      .filter((m) => {
        const isMine =
          (m.senderAccountId && m.senderAccountId === currentAccount.id) ||
          m.senderAccount === currentAccount.accountNumber;
        return !isMine && !m.readBy?.[currentAccount.id];
      })
      .map((m) => m.id);
    if (unreadIncomingIds.length > 0) {
      void markPrivateMessagesRead(unreadIncomingIds);
    }
  }, [mainTab, activeTarget?.type, activeTarget?.id, activePrivateMessages.length, currentAccount?.id]);

  // Auto-scroll Private Chat
  useEffect(() => {
    if (mainTab === 'private' && activeTarget && !privateRoomSearchQuery && !privateBookmarkedOnly) {
      privateEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [mainTab, activeTarget?.id, activePrivateMessages.length]);

  // Build DM Conversation List (Saved Contacts + Unsaved Incoming/Sent Peers)
  interface DmSidebarItem {
    peerAccountId: string;
    peerAccountNumber: string;
    peerUserId16?: string;
    displayName: string;
    registeredName: string;
    isSaved: boolean;
    isAdminPeer: boolean;
    lastMessageText: string;
    lastMessageTime?: string;
    lastMessageMs: number;
    unreadCount: number;
    contactRecord?: PrivateChatContact;
  }

  const dmSidebarItems = useMemo<DmSidebarItem[]>(() => {
    if (!currentAccount) return [];
    const byPeerKey = new Map<string, DmSidebarItem>();

    // 1. Seed from saved contacts first
    for (const c of mySavedContacts) {
      const acc = accounts.find(
        (a) => a.id === c.targetAccountId || a.accountNumber === c.targetAccountNumber
      );
      const peerId = acc?.id || c.targetAccountId;
      const peerNo = acc?.accountNumber || c.targetAccountNumber;
      byPeerKey.set(peerId, {
        peerAccountId: peerId,
        peerAccountNumber: peerNo,
        peerUserId16: acc?.userId16 || c.targetUserId16,
        displayName: c.customName || acc?.fullName || c.registeredName,
        registeredName: acc?.fullName || c.registeredName,
        isSaved: true,
        isAdminPeer: Boolean(acc?.cardTier === 'admin' || c.cardTier === 'admin' || peerId === 'acc-admin'),
        lastMessageText: 'Belum ada pesan — ketuk untuk mulai chat',
        lastMessageMs: Date.parse(c.addedAt || '') || 0,
        unreadCount: 0,
        contactRecord: c,
      });
    }

    // 2. Scan DM messages for last message, unread counts, and UNSAVED senders!
    for (const m of chats) {
      if (m.deleted || m.groupId || hiddenChatIdSet.has(m.id)) continue;
      const isFromMe =
        (m.senderAccountId && m.senderAccountId === currentAccount.id) ||
        m.senderAccount === currentAccount.accountNumber;
      const isToMe =
        (m.recipientAccountId && m.recipientAccountId === currentAccount.id) ||
        m.recipientAccount === currentAccount.accountNumber;
      if (!isFromMe && !isToMe) continue;

      const peerAccNo = isFromMe ? m.recipientAccount : m.senderAccount;
      const peerAccIdRaw = isFromMe ? m.recipientAccountId : m.senderAccountId;
      const matchedAcc = accounts.find(
        (a) => (peerAccIdRaw && a.id === peerAccIdRaw) || (peerAccNo && a.accountNumber === peerAccNo)
      );
      const peerId = matchedAcc?.id || peerAccIdRaw || peerAccNo;
      if (!peerId || peerId === currentAccount.id) continue;

      const peerNo = matchedAcc?.accountNumber || peerAccNo || peerId;
      const peerRegName =
        matchedAcc?.fullName || (isFromMe ? m.recipientName : m.senderName) || `Nasabah ${peerNo}`;
      const ts = m.createdAtMs || Date.parse(m.timestamp || '') || 0;

      let item = byPeerKey.get(peerId);
      if (!item) {
        const savedByNo = mySavedContacts.find((c) => c.targetAccountNumber === peerNo);
        item = {
          peerAccountId: peerId,
          peerAccountNumber: peerNo,
          peerUserId16: matchedAcc?.userId16 || savedByNo?.targetUserId16,
          displayName: savedByNo?.customName || peerRegName,
          registeredName: peerRegName,
          isSaved: Boolean(savedByNo),
          isAdminPeer: Boolean(
            matchedAcc?.cardTier === 'admin' ||
              (!isFromMe && (m.senderRole === 'admin' || m.senderCardTier === 'admin')) ||
              peerId === 'acc-admin'
          ),
          lastMessageText: '',
          lastMessageMs: 0,
          unreadCount: 0,
          contactRecord: savedByNo,
        };
        byPeerKey.set(peerId, item);
      }

      if (ts >= item.lastMessageMs) {
        item.lastMessageMs = ts;
        item.lastMessageTime = m.timestamp;
        item.lastMessageText = m.transferAttachment
          ? `${m.transferAttachment.isRequest ? 'Minta' : 'Kirim'} ${formatModalAssetValue(m.transferAttachment.amount, m.transferAttachment.assetKind || 'uang')}`
          : m.redPacket
            ? `Amplop Kaget ${formatModalAssetValue(m.redPacket.totalAmount, m.redPacket.assetKind)}`
            : m.splitBill
              ? `Patungan: ${m.splitBill.title}`
              : m.imageAttachment
                ? '📷 Foto'
                : m.voiceAttachment
                  ? '🎤 Pesan Suara'
                  : m.poll
                    ? `Polling: ${m.poll.question}`
                    : m.text;
      }

      if (!isFromMe) {
        const lastRead = Math.max(chatLastReadMap[`dm:${peerId}`] || 0, chatLastReadMap[`dm:${peerNo}`] || 0);
        if (ts > lastRead) {
          item.unreadCount += 1;
        }
      }
    }

    return Array.from(byPeerKey.values()).sort((a, b) => {
      const aPinned = pinnedRoomKeySet.has(`dm:${a.peerAccountId}`) ? 1 : 0;
      const bPinned = pinnedRoomKeySet.has(`dm:${b.peerAccountId}`) ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned;
      return b.lastMessageMs - a.lastMessageMs;
    });
  }, [mySavedContacts, accounts, chats, currentAccount, chatLastReadMap, hiddenChatIdSet, pinnedRoomKeySet]);

  const activeDmItem = useMemo<DmSidebarItem | null>(() => {
    if (!activeTarget || activeTarget.type !== 'dm') return null;
    return (
      dmSidebarItems.find(
        (d) =>
          d.peerAccountId === activeTarget.id ||
          (activeTarget.accountNumber && d.peerAccountNumber === activeTarget.accountNumber)
      ) || null
    );
  }, [activeTarget, dmSidebarItems]);

  // Helper: Presence status text
  const getPresenceStatusLabel = (accId?: string): { online: boolean; label: string } => {
    if (!accId) return { online: false, label: 'Offline' };
    const p = customerPresenceMap?.[accId];
    if (!p) return { online: false, label: 'Terakhir dilihat baru-baru ini' };
    if (p.status === 'online') return { online: true, label: 'Online sekarang' };
    if (p.status === 'idle') return { online: true, label: 'Aktif (Idle)' };
    const lastIso = p.lastOfflineAt || p.lastOfflineAtIso || p.lastActiveAt || p.lastActiveAtIso;
    if (lastIso) {
      return { online: false, label: `Terakhir dilihat ${formatChatDateTime(lastIso)}` };
    }
    return { online: false, label: 'Offline' };
  };

  const activeGroupOnlineCount = useMemo(() => {
    if (!activeGroup) return 0;
    return activeGroup.memberAccountIds.filter((id) => {
      if (id === currentAccount?.id) return true;
      const st = customerPresenceMap?.[id]?.status;
      return st === 'online' || st === 'idle';
    }).length;
  }, [activeGroup, customerPresenceMap, currentAccount?.id]);

  // Group kas / settled summary
  const activeGroupCashSummary = useMemo(() => {
    if (!activeGroup) return { uang: 0, coin: 0, diamond: 0 };
    let uang = 0;
    let coin = 0;
    let diamond = 0;
    for (const m of activePrivateMessages) {
      if (m.transferAttachment && m.transferAttachment.status === 'paid') {
        const k = m.transferAttachment.assetKind || 'uang';
        if (k === 'coin') coin += m.transferAttachment.amount;
        else if (k === 'diamond') diamond += m.transferAttachment.amount;
        else uang += m.transferAttachment.amount;
      }
      if (m.splitBill) {
        const paidCount = Object.keys(m.splitBill.paidByAccountIdMap || {}).length;
        const tot = paidCount * m.splitBill.perPersonAmount;
        if (m.splitBill.assetKind === 'coin') coin += tot;
        else if (m.splitBill.assetKind === 'diamond') diamond += tot;
        else uang += tot;
      }
    }
    return { uang, coin, diamond };
  }, [activeGroup, activePrivateMessages]);

  // Global Chat chronological list + pinned + filters (hide expired disappearing messages)
  const nowCheckMs = Date.now();
  const globalPinnedMessages = useMemo(
    () =>
      globalChats
        .filter(
          (m) =>
            m.isPinned &&
            !hiddenChatIdSet.has(m.id) &&
            (!m.expiresAtMs || m.expiresAtMs > nowCheckMs)
        )
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)),
    [globalChats, hiddenChatIdSet, nowCheckMs]
  );

  const visibleGlobalMessages = useMemo(() => {
    const q = globalSearchQuery.trim().toLowerCase();
    return [...globalChats]
      .sort(
        (a, b) =>
          (a.createdAtMs || Date.parse(a.timestamp || '')) -
          (b.createdAtMs || Date.parse(b.timestamp || ''))
      )
      .filter((m) => {
        if (hiddenChatIdSet.has(m.id)) return false;
        if (m.expiresAtMs && m.expiresAtMs <= Date.now()) return false;
        if (globalBookmarkedOnly && !bookmarkedIdSet.has(m.id)) return false;
        if (!q) return true;
        return (
          m.text.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          (m.senderAccount || '').includes(q)
        );
      });
  }, [globalChats, globalSearchQuery, globalBookmarkedOnly, bookmarkedIdSet, hiddenChatIdSet]);

  const groupPinnedMessages = useMemo(() => {
    if (!activeGroup) return [];
    const pinSet = new Set(activeGroup.pinnedMessageIds || []);
    return activePrivateMessages.filter(
      (m) =>
        !hiddenChatIdSet.has(m.id) &&
        (!m.expiresAtMs || m.expiresAtMs > Date.now()) &&
        (m.isPinned || pinSet.has(m.id))
    );
  }, [activeGroup, activePrivateMessages, hiddenChatIdSet]);

  const visiblePrivateMessages = useMemo(() => {
    const q = privateRoomSearchQuery.trim().toLowerCase();
    return activePrivateMessages.filter((m) => {
      if (hiddenChatIdSet.has(m.id)) return false;
      if (m.expiresAtMs && m.expiresAtMs <= Date.now()) return false;
      if (privateBookmarkedOnly && !bookmarkedIdSet.has(m.id)) return false;
      if (!q) return true;
      return (
        m.text.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.poll?.question || '').toLowerCase().includes(q)
      );
    });
  }, [activePrivateMessages, privateRoomSearchQuery, privateBookmarkedOnly, bookmarkedIdSet, hiddenChatIdSet]);

  // Mention candidates
  const mentionCandidates = useMemo(() => {
    if (mentionQuery === null) return [];
    const pool =
      mainTab === 'global'
        ? accounts.filter((a) => a.id !== currentAccount?.id)
        : activeGroup
          ? accounts.filter(
              (a) => a.id !== currentAccount?.id && activeGroup.memberAccountIds.includes(a.id)
            )
          : [];
    return pool
      .filter((a) => a.fullName.toLowerCase().includes(mentionQuery))
      .slice(0, 6);
  }, [mentionQuery, mainTab, accounts, currentAccount?.id, activeGroup]);

  const insertMention = (fullName: string) => {
    const nextVal = activeDraftText.replace(/@([a-zA-Z0-9_ ]{0,24})$/, `@${fullName} `);
    setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: nextVal }));
    setMentionQuery(null);
  };

  // Typing users in current room
  const activeTypingUsers = useMemo(() => {
    const entries = chatTypingMap[activeRoomKey] || [];
    return entries.filter((e) => e.accountId !== currentAccount?.id && e.expiresAtMs > Date.now());
  }, [chatTypingMap, activeRoomKey, currentAccount?.id]);

  const activeDmBlocked = Boolean(
    activeTarget?.type === 'dm' && blockedAccountIdSet.has(activeTarget.id)
  );

  // Handlers
  const handleManualRefresh = async () => {
    if (refreshingChat) return;
    setRefreshingChat(true);
    try {
      const res = await refreshChatSyncNow();
      showToast(res.message, res.success ? 'success' : 'error');
    } finally {
      window.setTimeout(() => setRefreshingChat(false), 500);
    }
  };

  const getExpiryTimestamp = () => (disappearSec > 0 ? Date.now() + disappearSec * 1000 : undefined);

  const handleSendGlobal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = activeDraftText.trim();
    if (!text || globalSending) return;
    if (isGlobalLockedFlag) {
      showToast('Chat Global sedang dinonaktifkan sementara oleh Admin.', 'error');
      return;
    }

    if (globalEditTarget) {
      if (isEditLockedFlag) {
        showToast('Fitur edit pesan sedang dinonaktifkan Admin.', 'error');
        return;
      }
      setGlobalSending(true);
      try {
        const res = await editGlobalChatMessage(globalEditTarget.id, text);
        showToast(res.message, res.success ? 'success' : 'error');
        if (res.success) {
          setGlobalEditTarget(null);
          setDraftByRoom((prev) => ({ ...prev, global: '' }));
        }
      } finally {
        setGlobalSending(false);
      }
      return;
    }

    setGlobalSending(true);
    try {
      const mentions = Array.from(text.matchAll(/@([A-Za-z0-9_]+)/g)).map((m) => m[1]);
      const res = await sendGlobalChatMessage({
        text,
        asAdmin: isAdminUser,
        isAdminHighlight: isAdminUser ? adminHighlightMode : false,
        replyToId: globalReplyTarget?.id,
        replyToSender: globalReplyTarget?.senderName,
        replyToPreview: globalReplyTarget?.text?.slice(0, 90),
        mentions: mentions.length ? mentions : undefined,
        expiresAtMs: getExpiryTimestamp(),
      });
      if (!res.success) {
        showToast(res.message, 'error');
      } else {
        setDraftByRoom((prev) => ({ ...prev, global: '' }));
        setGlobalReplyTarget(null);
        setMentionQuery(null);
        if (!isAdminUser && (globalChatConfig.cooldownMs || 0) > 0) {
          setGlobalCooldownLeft(Math.ceil((globalChatConfig.cooldownMs || 0) / 1000));
        }
      }
    } finally {
      setGlobalSending(false);
    }
  };

  const handleSendPrivate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!currentAccount || !activeTarget) return;
    if (isPrivateLockedFlag) {
      showToast('Chat Privat sedang dinonaktifkan sementara oleh Admin.', 'error');
      return;
    }
    if (activeDmBlocked) {
      showToast('Buka blokir kontak terlebih dahulu untuk mengirim pesan.', 'error');
      return;
    }
    const text = activeDraftText.trim();
    if (!text) return;

    if (privateEditTarget) {
      if (isEditLockedFlag) {
        showToast('Fitur edit pesan sedang dinonaktifkan Admin.', 'error');
        return;
      }
      const res = await editPrivateChatMessage(privateEditTarget.id, text);
      showToast(res.message, res.success ? 'success' : 'error');
      if (res.success) {
        setPrivateEditTarget(null);
        setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: '' }));
      }
      return;
    }

    const mentions = Array.from(text.matchAll(/@([A-Za-z0-9_]+)/g)).map((m) => m[1]);
    if (activeTarget.type === 'group' && activeGroup) {
      if (isGroupLockedFlag) {
        showToast('Chat Grup sedang dinonaktifkan sementara oleh Admin.', 'error');
        return;
      }
      sendChatMessage({
        groupId: activeGroup.id,
        recipientAccount: `group:${activeGroup.id}`,
        recipientName: activeGroup.name,
        text,
        replyToId: privateReplyTarget?.id,
        replyToSender: privateReplyTarget?.senderName,
        replyToPreview: privateReplyTarget?.text?.slice(0, 90),
        mentions: mentions.length ? mentions : undefined,
        expiresAtMs: getExpiryTimestamp(),
      });
    } else if (activeDmItem) {
      sendChatMessage({
        recipientAccountId: activeDmItem.peerAccountId,
        recipientAccount: activeDmItem.peerAccountNumber,
        recipientName: activeDmItem.displayName,
        text,
        replyToId: privateReplyTarget?.id,
        replyToSender: privateReplyTarget?.senderName,
        replyToPreview: privateReplyTarget?.text?.slice(0, 90),
        expiresAtMs: getExpiryTimestamp(),
      });
    }
    setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: '' }));
    setPrivateReplyTarget(null);
    setMentionQuery(null);
  };

  // KeyDown handler: DEFAULT Enter = New Line, Ctrl+Enter (or Cmd+Enter) = Send / Save Edit
  const handleComposerKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    scope: 'global' | 'private'
  ) => {
    if (e.key !== 'Enter') return;
    const isCtrlOrCmd = e.ctrlKey || e.metaKey;
    if (isCtrlOrCmd) {
      e.preventDefault();
      if (scope === 'global') void handleSendGlobal();
      else void handleSendPrivate();
      return;
    }
    if (enterKeySends && !e.shiftKey) {
      e.preventDefault();
      if (scope === 'global') void handleSendGlobal();
      else void handleSendPrivate();
    }
    // Otherwise allow default newline behavior (works on mobile Enter & Shift+Enter)
  };

  // Image pick & send compressed
  const handleImageFilePicked = async (
    e: React.ChangeEvent<HTMLInputElement>,
    scope: 'global' | 'private'
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (isImageLockedFlag) {
      showToast('Kirim foto di chat sedang dinonaktifkan Admin.', 'error');
      return;
    }
    try {
      const compressed = await compressChatImageFile(file);
      if (scope === 'global') {
        const res = await sendGlobalChatMessage({
          text: activeDraftText.trim() || '',
          asAdmin: isAdminUser,
          imageAttachment: compressed,
          expiresAtMs: getExpiryTimestamp(),
        });
        showToast(res.success ? 'Foto terkirim ke Chat Global!' : res.message, res.success ? 'success' : 'error');
      } else if (activeTarget) {
        if (activeTarget.type === 'group' && activeGroup) {
          sendChatMessage({
            groupId: activeGroup.id,
            recipientAccount: `group:${activeGroup.id}`,
            recipientName: activeGroup.name,
            text: activeDraftText.trim() || '',
            imageAttachment: compressed,
            expiresAtMs: getExpiryTimestamp(),
          });
        } else if (activeDmItem) {
          sendChatMessage({
            recipientAccountId: activeDmItem.peerAccountId,
            recipientAccount: activeDmItem.peerAccountNumber,
            recipientName: activeDmItem.displayName,
            text: activeDraftText.trim() || '',
            imageAttachment: compressed,
            expiresAtMs: getExpiryTimestamp(),
          });
        }
        showToast('Foto terkirim!', 'success');
      }
      setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: '' }));
    } catch {
      showToast('Gagal memproses foto. Coba gambar lain yang lebih kecil.', 'error');
    }
  };

  // Voice Note start/stop
  const handleToggleVoiceRecord = async (scope: 'global' | 'private') => {
    if (isVoiceLockedFlag) {
      showToast('Pesan suara (Voice Note) sedang dinonaktifkan Admin.', 'error');
      return;
    }
    if (recordingScope) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecordingScope(null);
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('Browser perangkat ini belum mendukung rekam Voice Note.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      const startedAt = Date.now();
      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) recordingChunksRef.current.push(ev.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const durationSec = Math.max(1, Math.min(30, Math.round((Date.now() - startedAt) / 1000)));
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const dataUrl = String(reader.result || '');
          if (!dataUrl || dataUrl.length > 140000) {
            showToast('Rekaman suara terlalu panjang/besar untuk dikirim.', 'error');
            return;
          }
          const voiceAttachment = { dataUrl, durationSec, mimeType: blob.type };
          if (scope === 'global') {
            const res = await sendGlobalChatMessage({
              text: '',
              asAdmin: isAdminUser,
              voiceAttachment,
              expiresAtMs: getExpiryTimestamp(),
            });
            showToast(res.success ? 'Voice Note terkirim!' : res.message, res.success ? 'success' : 'error');
          } else if (activeTarget?.type === 'group' && activeGroup) {
            sendChatMessage({
              groupId: activeGroup.id,
              recipientAccount: `group:${activeGroup.id}`,
              recipientName: activeGroup.name,
              text: '',
              voiceAttachment,
              expiresAtMs: getExpiryTimestamp(),
            });
            showToast('Voice Note terkirim ke grup!', 'success');
          } else if (activeDmItem) {
            sendChatMessage({
              recipientAccountId: activeDmItem.peerAccountId,
              recipientAccount: activeDmItem.peerAccountNumber,
              recipientName: activeDmItem.displayName,
              text: '',
              voiceAttachment,
              expiresAtMs: getExpiryTimestamp(),
            });
            showToast('Voice Note terkirim!', 'success');
          }
        };
        reader.readAsDataURL(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecordingScope(scope);
    } catch {
      showToast('Izin mikrofon ditolak atau tidak tersedia.', 'error');
    }
  };

  const handleAddContactSubmit = (input: {
    customName?: string;
    userId?: string;
    accountNumber?: string;
    isQuickSave?: boolean;
  }) => {
    const res = addPrivateChatContact({
      customName: input.customName,
      userId: input.userId,
      accountNumber: input.accountNumber,
    });
    showToast(res.message, res.success ? 'success' : 'error');
    if (res.success) {
      setAddContactModalState({ open: false, prefill: null });
      if (!input.isQuickSave) {
        setMainTab('private');
        setActiveTarget(null);
      }
    }
  };

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Teks pesan berhasil disalin.', 'success');
    } catch {
      showToast('Gagal menyalin teks ke clipboard.', 'error');
    }
  };

  const buildGlobalChatRecapText = () => {
    const lines = [
      '=== REKAP CHAT GLOBAL BANK NUSANTARA ===',
      `Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`,
      `Total Pesan: ${globalChats.length}`,
      '----------------------------------------',
      ...visibleGlobalMessages.map(
        (m) =>
          `[${formatChatDateTime(m.timestamp)}] ${m.senderName}${m.senderRole === 'admin' ? ' [ADMIN RESMI]' : ''}: ${m.text}`
      ),
    ];
    return lines.join('\n');
  };

  const handleCopyGlobalRecap = async () => {
    await handleCopyText(buildGlobalChatRecapText());
  };

  const handleDownloadGlobalRecap = () => {
    const blob = new Blob([buildGlobalChatRecapText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-chat-global-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('File rekap Chat Global (.txt) berhasil diunduh.', 'success');
  };

  const handleDownloadPrivateRecap = () => {
    if (!activeTarget) return;
    const label = activeGroup ? activeGroup.name : activeDmItem?.displayName || 'Chat Privat';
    const lines = [
      `=== REKAP ${label.toUpperCase()} — BANK NUSANTARA ===`,
      `Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`,
      '----------------------------------------',
      ...visiblePrivateMessages.map(
        (m) => `[${formatChatDateTime(m.timestamp)}] ${m.senderName}: ${m.text || '(Lampiran)'}`
      ),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rekap-chat-${activeTarget.id}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('File ekspor percakapan (.txt) berhasil diunduh.', 'success');
  };

  const handleContactOfficialAdmin = () => {
    if (!currentAccount) return;
    const adminAcc =
      accounts.find((a) => a.id === 'acc-admin') ||
      accounts.find((a) => a.isOfficialAdminAccount || a.cardTier === 'admin');
    if (!adminAcc) {
      showToast('Akun Admin Resmi belum ditemukan.', 'error');
      return;
    }
    if (adminAcc.id === currentAccount.id) {
      showToast('Anda saat ini sedang menggunakan akun Admin.', 'info');
      return;
    }
    setMainTab('private');
    setActiveTarget({
      type: 'dm',
      id: adminAcc.id,
      accountNumber: adminAcc.accountNumber,
    });
  };

  const canEditWithinWindow = (createdAtMs?: number, timestamp?: string, isOwnerAdmin = false) => {
    if (isOwnerAdmin) return true;
    const ms = createdAtMs || Date.parse(timestamp || '') || 0;
    return Date.now() - ms <= EDIT_WINDOW_MS;
  };

  // Multi-Asset modal confirm handler
  const handleAssetModalConfirm = (payload: {
    assetKind: ChatAssetKind;
    amount: number;
    note: string;
    targetAccountId?: string;
  }) => {
    setShowAssetModal(false);
    if (isRequestAssetMode) {
      const reqRef = `REQ-${Date.now()}`;
      const valText = formatModalAssetValue(payload.amount, payload.assetKind);
      if (activeTarget?.type === 'group' && activeGroup) {
        sendChatMessage({
          groupId: activeGroup.id,
          recipientAccount: `group:${activeGroup.id}`,
          recipientName: activeGroup.name,
          text: payload.note || `Meminta ${valText}`,
          transferAttachment: {
            assetKind: payload.assetKind,
            isRequest: true,
            amount: payload.amount,
            referenceNo: reqRef,
            note: payload.note || undefined,
            status: 'pending',
          },
        });
      } else if (activeDmItem) {
        sendChatMessage({
          recipientAccountId: activeDmItem.peerAccountId,
          recipientAccount: activeDmItem.peerAccountNumber,
          recipientName: activeDmItem.displayName,
          text: payload.note || `Meminta ${valText}`,
          transferAttachment: {
            assetKind: payload.assetKind,
            isRequest: true,
            amount: payload.amount,
            referenceNo: reqRef,
            note: payload.note || undefined,
            status: 'pending',
          },
        });
      }
      showToast(`Permintaan ${valText} berhasil dikirim ke ruang chat.`, 'success');
      return;
    }

    setPendingPinAction({
      kind: 'asset_send',
      assetKind: payload.assetKind,
      amount: payload.amount,
      note: payload.note,
      targetAccountId: payload.targetAccountId,
    });
  };

  // Centralized 6-digit PIN execution dispatcher
  const handlePinVerifiedSuccess = async (pinInput: string) => {
    const action = pendingPinAction;
    setPendingPinAction(null);
    if (!action || !currentAccount) return;
    const pin = pinInput || currentAccount.pin;

    if (action.kind === 'asset_send') {
      let targetAcc: BankAccount | undefined;
      if (activeTarget?.type === 'group') {
        targetAcc = accounts.find((a) => a.id === action.targetAccountId);
      } else if (activeDmItem) {
        targetAcc = accounts.find(
          (a) => a.id === activeDmItem.peerAccountId || a.accountNumber === activeDmItem.peerAccountNumber
        );
      }
      if (!targetAcc) {
        showToast('Akun penerima tidak ditemukan.', 'error');
        return;
      }
      const res = await sendChatAssetTransfer({
        targetAccountId: targetAcc.id,
        recipientAccount: targetAcc.accountNumber,
        recipientName: targetAcc.fullName,
        groupId: activeTarget?.type === 'group' ? activeTarget.id : undefined,
        assetKind: action.assetKind,
        amount: action.amount,
        pin,
        note: action.note,
      });
      showToast(res.message, res.success ? 'success' : 'error');
    } else if (action.kind === 'pay_request') {
      const res = await payChatTransferRequest(action.messageId, pin);
      showToast(res.message, res.success ? 'success' : 'error');
    } else if (action.kind === 'create_red_packet') {
      const res = await createChatRedPacket({
        scope: action.scope,
        groupId: action.groupId,
        assetKind: action.assetKind,
        totalAmount: action.totalAmount,
        quota: action.quota,
        mode: action.mode,
        pin,
        note: action.note,
        isOfficialAdmin: action.isOfficialAdmin,
      });
      showToast(res.message, res.success ? 'success' : 'error');
    } else if (action.kind === 'pay_split_bill') {
      const res = await payChatSplitBill(action.messageId, pin);
      showToast(res.message, res.success ? 'success' : 'error');
    }
  };

  // Render interactive Poll card
  const renderPollCard = (poll: ChatPollData, onVote: (optId: string) => void) => {
    const votesMap = poll.votesByAccountId || {};
    const allVotes = Object.values(votesMap).flat();
    const totalVotes = allVotes.length;
    const myVotes = currentAccount ? votesMap[currentAccount.id] || [] : [];
    return (
      <div className="mt-2 p-3 rounded-2xl bg-[#0b0f19]/60 border border-white/10 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-extrabold">
          <BarChart2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          <span>{poll.question}</span>
        </div>
        <div className="space-y-1.5">
          {poll.options.map((opt) => {
            const votes = allVotes.filter((v) => v === opt.id).length;
            const pct = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
            const voted = myVotes.includes(opt.id);
            return (
              <button
                key={opt.id}
                type="button"
                disabled={isPollLockedFlag}
                onClick={() => onVote(opt.id)}
                className={`w-full relative overflow-hidden rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                  voted
                    ? 'border-violet-500 bg-violet-500/15 font-bold'
                    : 'border-slate-600/60 hover:bg-[#0b0f19]/40'
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-violet-500/20 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="truncate flex items-center gap-1.5">
                    {voted && <Check className="w-3.5 h-3.5 text-violet-300 shrink-0" />}
                    {opt.text}
                  </span>
                  <span className="shrink-0 font-bold text-[11px] opacity-80 tabular-nums">
                    {votes} ({pct}%)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] opacity-70 tabular-nums">
          Total {totalVotes} suara {poll.allowMultiple ? '• Multi-pilihan' : '• 1 pilihan'}
        </p>
      </div>
    );
  };

  // Render Amplop Kaget ala DANA Card (No Cancel Button)
  const renderRedPacketCard = (rp: ChatRedPacketData, scope: 'global' | 'private', msgId: string) => {
    const myClaim = currentAccount ? rp.claims.find((c) => c.accountId === currentAccount.id) : undefined;
    const isExhausted = rp.status === 'exhausted' || rp.remainingQuota <= 0 || rp.remainingAmount <= 0;
    const modeLabel =
      rp.mode === 'fastest_biggest'
        ? 'Siapa Cepat Dapat Banyak'
        : rp.mode === 'random'
          ? 'Acak ala DANA'
          : 'Merata';

    return (
      <div className="mt-2 p-3.5 rounded-2xl bg-gradient-to-br from-rose-950/90 via-red-950/80 to-amber-950/75 border border-amber-400/50 text-amber-50 space-y-2.5 shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-rose-500 text-slate-950 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-black text-amber-300">AMPLOP KAGET NUSANTARA</span>
                {rp.isOfficialAdmin && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                    RESMI ADMIN
                  </span>
                )}
              </div>
              <p className="text-[11px] text-amber-200/80 truncate">{rp.note || 'Rezeki bersama!'}</p>
            </div>
          </div>
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 ${
              isExhausted ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500 text-slate-950'
            }`}
          >
            {isExhausted ? 'HABIS' : 'AKTIF'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] bg-black/30 rounded-xl px-2.5 py-1.5 tabular-nums">
          <span>
            Mode: <strong className="text-amber-300">{modeLabel}</strong>
          </span>
          <span>
            Kuota:{' '}
            <strong className="text-emerald-300">
              {rp.claims.length}/{rp.quota}
            </strong>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] uppercase text-amber-200/70 font-bold">Total Hadiah</p>
            <p className="text-sm font-black text-white tabular-nums">
              {formatModalAssetValue(rp.totalAmount, rp.assetKind)}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {myClaim ? (
              <span className="px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-[11px] font-extrabold tabular-nums">
                Diklaim #{myClaim.rank}: +{formatModalAssetValue(myClaim.amount, rp.assetKind)}
              </span>
            ) : !isExhausted ? (
              <button
                type="button"
                disabled={isRedPacketLockedFlag}
                onClick={async () => {
                  const res = await claimChatRedPacket({ scope, messageId: msgId });
                  showToast(res.message, res.success ? 'success' : 'error');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 disabled:opacity-45 text-slate-950 text-xs font-black shadow-sm"
              >
                {isRedPacketLockedFlag ? 'Nonaktif' : 'Buka Amplop'}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setRedPacketDetailTarget(rp)}
              className="px-2.5 py-1.5 rounded-xl bg-black/35 hover:bg-black/55 border border-amber-400/30 text-amber-200 text-[11px] font-bold"
            >
              Penerima
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Special Customer Badge Helper
  const renderCustomCustomerBadge = (tier?: ChatCustomBadgeTier | null) => {
    if (!tier) return null;
    if (tier === 'sultan') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950">
          <Award className="w-2.5 h-2.5" /> SULTAN
        </span>
      );
    }
    if (tier === 'vip') {
      return (
        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-500 text-white">
          <Star className="w-2.5 h-2.5 fill-white" /> VIP
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/50">
        <Check className="w-2.5 h-2.5" /> TERVERIFIKASI
      </span>
    );
  };

  // Filter sidebar items with Archived vs Active separation + Pin sorting
  const archivedCount = useMemo(() => {
    const dmArch = dmSidebarItems.filter((d) => archivedRoomKeySet.has(`dm:${d.peerAccountId}`)).length;
    const grpArch = myGroups.filter((g) => archivedRoomKeySet.has(`group:${g.id}`)).length;
    return dmArch + grpArch;
  }, [dmSidebarItems, myGroups, archivedRoomKeySet]);

  const filteredDmItems = useMemo(() => {
    const q = sidebarSearchQuery.trim().toLowerCase();
    return dmSidebarItems.filter((item) => {
      const isArch = archivedRoomKeySet.has(`dm:${item.peerAccountId}`);
      if (privateFilter === 'archived' && !isArch) return false;
      if (privateFilter !== 'archived' && isArch) return false;
      return (
        !q ||
        item.displayName.toLowerCase().includes(q) ||
        item.registeredName.toLowerCase().includes(q) ||
        item.peerAccountNumber.includes(q)
      );
    });
  }, [dmSidebarItems, sidebarSearchQuery, archivedRoomKeySet, privateFilter]);

  const filteredGroups = useMemo(() => {
    const q = sidebarSearchQuery.trim().toLowerCase();
    return [...myGroups]
      .sort((a, b) => {
        const aPin = pinnedRoomKeySet.has(`group:${a.id}`) ? 1 : 0;
        const bPin = pinnedRoomKeySet.has(`group:${b.id}`) ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;
        return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
      })
      .filter((g) => {
        const isArch = archivedRoomKeySet.has(`group:${g.id}`);
        if (privateFilter === 'archived' && !isArch) return false;
        if (privateFilter !== 'archived' && isArch) return false;
        return !q || g.name.toLowerCase().includes(q);
      });
  }, [myGroups, sidebarSearchQuery, archivedRoomKeySet, pinnedRoomKeySet, privateFilter]);

  if (!currentAccount) {
    return (
      <div className="p-8 text-center rounded-3xl bg-[#0b0f19] border border-slate-800">
        <p className="text-sm font-semibold text-slate-300">
          Silakan masuk ke rekening Bank Nusantara terlebih dahulu untuk menggunakan Chat Global & Priv.
        </p>
      </div>
    );
  }

  // Master Maintenance Switch from Panel Admin
  if (!isAdminUser && featureFlags.chatSystemDisabled) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-[#0b0f19] border-2 border-amber-500/50 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/40">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">
          Layanan Chat Ditutup Sementara oleh Admin
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {globalChatConfig.maintenanceNotice ||
            'Fitur Chat Global & Chat Privat sedang dalam pemeliharaan sementara oleh Admin Bank Nusantara. Silakan coba beberapa saat lagi.'}
        </p>
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={refreshingChat}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshingChat ? 'animate-spin' : ''}`} />
          <span>Periksa Status Chat</span>
        </button>
      </div>
    );
  }

  const slowModePresets = [
    { label: 'Off', ms: 0 },
    { label: '3d', ms: 3000 },
    { label: '5d', ms: 5000 },
    { label: '15d', ms: 15000 },
    { label: '30d', ms: 30000 },
    { label: '60d', ms: 60000 },
  ];

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-3">
      {/* Toast Notification Banner */}
      {toastBanner && (
        <div
          className={`rounded-2xl px-4 py-3 text-xs font-bold flex items-center justify-between gap-3 border shadow-sm ${
            toastBanner.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-800 text-emerald-200'
              : toastBanner.type === 'error'
                ? 'bg-rose-950/50 border-rose-800 text-rose-200'
                : 'bg-sky-950/50 border-sky-800 text-sky-200'
          }`}
        >
          <span className="min-w-0 break-words">{toastBanner.text}</span>
          <button type="button" onClick={() => setToastBanner(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP WORKSPACE HEADER (Segmented Tabs + Subtle Segarkan Chat Button) */}
      <div className="rounded-3xl bg-[#0b0f19] border border-slate-800 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
                  Chat Global & Priv
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/50 border border-emerald-800 px-2 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {connectedDevicesCount} Aktif
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                Sinkronisasi lintas perangkat aman • Ruang Global, 1-on-1 & Grup Privat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Personal Enter Key Mode Switch */}
            <button
              type="button"
              onClick={() => {
                const r = toggleEnterKeyPreference();
                showToast(r.message, 'info');
              }}
              className="px-2.5 py-2 rounded-xl text-[11px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
              title="Tukar perilaku tombol Enter saat mengetik"
            >
              <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{enterKeySends ? 'Enter: Kirim' : 'Enter: Baris Baru'}</span>
            </button>

            {/* Do Not Disturb Toggle */}
            <button
              type="button"
              onClick={() => {
                const r = toggleChatDnd();
                showToast(r.message, 'info');
              }}
              className={`px-2.5 py-2 rounded-xl text-[11px] font-bold border inline-flex items-center gap-1.5 transition-colors ${
                currentAccount.chatDndEnabled
                  ? 'bg-amber-950/60 border-amber-500/60 text-amber-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Mode Jangan Ganggu (Mute suara/pop-up notifikasi chat)"
            >
              {currentAccount.chatDndEnabled ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{currentAccount.chatDndEnabled ? 'DND Aktif' : 'Notif On'}</span>
            </button>

            {/* Subtle Segarkan Chat Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshingChat}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 inline-flex items-center gap-1.5 transition-colors"
              title="Segarkan ulang riwayat Chat Global & Privat dari Server & Cloud"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingChat ? 'animate-spin text-emerald-600' : ''}`} />
              <span>Segarkan Chat</span>
            </button>

            {isAdminUser && mainTab === 'global' && (
              <button
                type="button"
                onClick={() => setAdminModModalState({ open: true, tab: 'broadcast', muteTarget: null })}
                className="px-3 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 inline-flex items-center gap-1.5 shadow-sm"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Moderasi Admin</span>
              </button>
            )}
          </div>
        </div>

        {/* Main 2-Tab Switcher */}
        <div className="mt-3 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#111726]">
          <button
            type="button"
            onClick={() => setMainTab('global')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all ${
              mainTab === 'global'
                ? 'bg-[#0b0f19] text-emerald-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Chat Global</span>
            {isGlobalLockedFlag && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
            {globalChatUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white">
                {globalChatUnreadCount > 99 ? '99+' : globalChatUnreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setMainTab('private')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all ${
              mainTab === 'private'
                ? 'bg-[#0b0f19] text-indigo-400 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Chat Privat</span>
            {isPrivateLockedFlag && <Lock className="w-3 h-3 text-rose-400 shrink-0" />}
            {privateChatUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-600 text-white">
                {privateChatUnreadCount > 99 ? '99+' : privateChatUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ==================== TAB 1: CHAT GLOBAL ==================== */}
      {mainTab === 'global' && (
        isGlobalLockedFlag ? (
          <div className="rounded-3xl bg-[#0b0f19] border border-rose-500/40 p-8 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white">Chat Global Dinonaktifkan Sementara oleh Admin</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Ruang Chat Global sedang dinonaktifkan sementara melalui pengaturan Panel Admin. Anda masih dapat menggunakan fitur lain atau membuka Chat Privat jika diaktifkan.
            </p>
            {!isPrivateLockedFlag && (
              <button
                type="button"
                onClick={() => setMainTab('private')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold"
              >
                Buka Chat Privat
              </button>
            )}
          </div>
        ) : (
        <div className="rounded-3xl bg-[#0b0f19] border border-slate-800 shadow-sm flex flex-col h-[calc(100dvh-230px)] min-h-[540px] max-h-[820px] min-w-0 overflow-hidden">
          {/* Global Room Top Bar */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-800 bg-[#0b0f19]/95 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-extrabold text-white truncate">
                  Ruang Chat Global Bank Nusantara
                </span>
                {globalChatConfig.adminOnlyLock && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-950/60 text-rose-300 border border-rose-800">
                    KHUSUS ADMIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {!isAdminUser && (
                  <button
                    type="button"
                    onClick={handleContactOfficialAdmin}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1"
                    title="Chat langsung dengan Admin Resmi Bank Nusantara"
                  >
                    <Headphones className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Hubungi Admin</span>
                  </button>
                )}
                <button
                  type="button"
                  disabled={isRedPacketLockedFlag}
                  onClick={() => setRedPacketModalScope('global')}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600/85 to-amber-600/85 hover:from-rose-500 hover:to-amber-500 disabled:opacity-40 text-white text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm"
                  title={isRedPacketLockedFlag ? 'Amplop Kaget dinonaktifkan Admin' : 'Kirim Amplop Kaget ala DANA'}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Amplop Kaget</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalSearchOpen((v) => !v)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    globalSearchOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Cari pesan / nama nasabah"
                >
                  <Search className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalBookmarkedOnly((v) => !v)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    globalBookmarkedOnly
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                  title="Filter pesan berbintang (Bookmark)"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadGlobalRecap}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  title="Unduh Rekap Chat Global (.txt)"
                >
                  <Download className="w-4 h-4" />
                </button>
                {isAdminUser && (
                  <button
                    type="button"
                    disabled={isPollLockedFlag}
                    onClick={() => setPollModalScope('global')}
                    className="p-2 rounded-xl bg-violet-950/50 text-violet-300 hover:bg-violet-900/70 disabled:opacity-40"
                    title="Buat Polling Resmi Admin"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Admin Quick Slow-Mode & Lock Bar */}
            {isAdminUser && (
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-800">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">Slow Mode:</span>
                  {slowModePresets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => void toggleGlobalChatAdminLock(globalChatConfig.adminOnlyLock, p.ms)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                        (globalChatConfig.cooldownMs || 0) === p.ms
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdminHighlightMode((v) => !v)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                      adminHighlightMode
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/60'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" /> Sorotan Admin: {adminHighlightMode ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleGlobalChatAdminLock(!globalChatConfig.adminOnlyLock)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 ${
                      globalChatConfig.adminOnlyLock
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {globalChatConfig.adminOnlyLock ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {globalChatConfig.adminOnlyLock ? 'Terkunci' : 'Terbuka'}
                  </button>
                </div>
              </div>
            )}

            {/* Collapsible Search Bar */}
            {globalSearchOpen && (
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={globalSearchQuery}
                  onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  placeholder="Cari pesan atau nama nasabah di Chat Global..."
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                />
                {globalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Multi-Pin Announcements Banner */}
          {globalPinnedMessages.length > 0 && (
            <div className="shrink-0 bg-amber-950/35 border-b border-amber-800/60 px-4 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-300">
                    <Pin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Pesan Disematkan {globalPinnedMessages.length > 1 ? `(${globalPinnedMessages.length})` : ''} •{' '}
                      {globalPinnedMessages[0].senderName}
                    </span>
                  </div>
                  <p className="text-xs text-amber-100/90 line-clamp-2 mt-0.5">
                    {globalPinnedMessages[0].text}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {globalPinnedMessages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setGlobalPinnedExpanded((v) => !v)}
                      className="p-1.5 rounded-lg text-amber-300 hover:bg-amber-900/50"
                    >
                      {globalPinnedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={() => void togglePinGlobalChatMessage(globalPinnedMessages[0].id)}
                      className="p-1.5 rounded-lg text-amber-300 hover:bg-amber-900/60"
                      title="Lepas sematan"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {globalPinnedExpanded && globalPinnedMessages.length > 1 && (
                <div className="mt-2 pt-2 border-t border-amber-800/50 space-y-1.5 max-h-36 overflow-y-auto">
                  {globalPinnedMessages.slice(1).map((pm) => (
                    <div key={pm.id} className="flex items-start justify-between gap-2 text-xs">
                      <p className="text-amber-100/80 min-w-0">
                        <strong className="text-amber-300">{pm.senderName}:</strong> {pm.text}
                      </p>
                      {isAdminUser && (
                        <button
                          type="button"
                          onClick={() => void togglePinGlobalChatMessage(pm.id)}
                          className="shrink-0 text-amber-300 hover:text-amber-200"
                        >
                          <PinOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* First-Time Welcome Card ("Admin Utama Bank Nusantara") */}
          {!currentAccount.hasSeenChatWelcome && !featureFlags.disableWelcomeGreeting && (
            <div className="shrink-0 mx-3 sm:mx-5 mt-3 p-4 rounded-2xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-emerald-950/80 border border-amber-500/60 shadow-lg space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black text-amber-300">
                        Admin Utama Bank Nusantara
                      </h4>
                      <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black">
                        SAMBUTAN RESMI
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Selamat datang, <strong>{currentAccount.fullName}</strong>!
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={markChatWelcomeSeen}
                  className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-[11px] font-black shrink-0"
                >
                  Mengerti, Mulai Chat
                </button>
              </div>
              <p className="text-xs text-amber-100/90 leading-relaxed whitespace-pre-wrap">
                {globalChatConfig.customWelcomeText ||
                  'Selamat datang di Chat Global & Priv Bank Nusantara! Jaga sopan santun, gunakan fitur Kirim Uang/Coin/Diamond & Amplop Kaget secara bijak, dan tekan Ctrl+Enter untuk mengirim pesan dengan cepat.'}
              </p>
            </div>
          )}

          {/* Global Messages Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-[#05070c]">
            {visibleGlobalMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                <Globe className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-bold text-slate-300">
                  {globalBookmarkedOnly
                    ? 'Belum ada pesan berbintang di Chat Global'
                    : globalSearchQuery
                      ? 'Pesan tidak ditemukan'
                      : 'Belum ada pesan di Chat Global'}
                </p>
                <p className="text-xs mt-1">Mulai obrolan santai dengan sesama nasabah & Admin Bank Nusantara.</p>
              </div>
            ) : (
              visibleGlobalMessages.map((msg) => {
                const isStrictOwner = Boolean(
                  msg.senderAccountId
                    ? msg.senderAccountId === currentAccount.id
                    : msg.senderAccount === currentAccount.accountNumber
                );
                const isMsgAdmin = msg.senderRole === 'admin' || msg.senderCardTier === 'admin';
                const isBookmarked = bookmarkedIdSet.has(msg.id);
                const canEdit =
                  !isEditLockedFlag &&
                  (isStrictOwner || (isAdminUser && isMsgAdmin)) &&
                  canEditWithinWindow(msg.createdAtMs, msg.timestamp, isAdminUser);
                const reactionEntries = Object.entries(msg.reactions || {}).filter(
                  ([, ids]) => Array.isArray(ids) && ids.length > 0
                );
                const senderAccountObj = msg.senderAccountId
                  ? accounts.find((a) => a.id === msg.senderAccountId)
                  : accounts.find((a) => a.accountNumber === msg.senderAccount);

                const bubbleClasses = isMsgAdmin
                  ? 'bg-gradient-to-br from-amber-950/85 via-amber-900/60 to-yellow-950/75 border border-amber-500/60 text-amber-50 shadow-sm'
                  : isStrictOwner
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 border border-slate-700 text-slate-100 shadow-sm';

                return (
                  <div key={msg.id} className={`flex flex-col ${isStrictOwner ? 'items-end' : 'items-start'}`}>
                    <div className="relative max-w-[88%] sm:max-w-[76%] min-w-0">
                      <div className={`rounded-2xl px-3.5 py-2.5 ${bubbleClasses}`}>
                        {/* Sender header */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <button
                              type="button"
                              disabled={!isAdminUser || !senderAccountObj}
                              onClick={() => {
                                if (isAdminUser && senderAccountObj) setAdminQuickAcc(senderAccountObj);
                              }}
                              className={`text-xs font-extrabold truncate text-left ${
                                isMsgAdmin
                                  ? 'text-amber-300'
                                  : isStrictOwner
                                    ? 'text-emerald-50'
                                    : 'text-white'
                              } ${isAdminUser && senderAccountObj ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                            >
                              {msg.senderName}
                            </button>
                            {isMsgAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.45)]">
                                <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                              </span>
                            )}
                            {isMsgAdmin && msg.adminDivisionLabel && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[9px] font-bold">
                                {msg.adminDivisionLabel}
                              </span>
                            )}
                            {renderCustomCustomerBadge(msg.senderCustomBadge ?? senderAccountObj?.chatCustomBadge)}
                            {msg.isAdminHighlight && isMsgAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-300">
                                <Flame className="w-3 h-3" /> Sorotan
                              </span>
                            )}
                            {msg.expiresAtMs && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold opacity-80" title="Pesan Sementara">
                                <Clock className="w-2.5 h-2.5" /> Sementara
                              </span>
                            )}
                            {isBookmarked && <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />}
                          </div>

                          {/* `···` Action Popover Trigger */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuMsgId((prev) => (prev === msg.id ? null : msg.id));
                            }}
                            className={`p-1 rounded-lg transition-colors shrink-0 ${
                              isStrictOwner && !isMsgAdmin
                                ? 'text-emerald-100 hover:bg-emerald-700/60'
                                : 'text-slate-400 hover:text-white hover:bg-[#0b0f19]/20'
                            }`}
                            aria-label="Menu pesan"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Forwarded tag */}
                        {msg.forwardedFrom && (
                          <div className="text-[10px] italic opacity-75 mb-1 inline-flex items-center gap-1">
                            <Forward className="w-3 h-3" /> Diteruskan dari {msg.forwardedFrom.originalSenderName}
                          </div>
                        )}

                        {/* Reply quote */}
                        {msg.replyToPreview && (
                          <div
                            className={`mb-1.5 px-2.5 py-1.5 rounded-xl border-l-2 text-[11px] ${
                              isStrictOwner && !isMsgAdmin
                                ? 'bg-emerald-700/50 border-emerald-200 text-emerald-50'
                                : 'bg-[#0b0f19]/40 border-amber-500 text-slate-300'
                            }`}
                          >
                            <p className="font-bold truncate">{msg.replyToSender}</p>
                            <p className="truncate opacity-85">{msg.replyToPreview}</p>
                          </div>
                        )}

                        {/* Image Attachment */}
                        {msg.imageAttachment && (
                          <button
                            type="button"
                            onClick={() =>
                              setLightboxImage({
                                url: msg.imageAttachment!.dataUrl,
                                fileName: msg.imageAttachment!.fileName,
                              })
                            }
                            className="block mb-2 rounded-xl overflow-hidden border border-white/15 max-w-full"
                          >
                            <img
                              src={msg.imageAttachment.dataUrl}
                              alt={msg.imageAttachment.fileName || 'Foto Chat'}
                              className="max-h-56 w-auto object-cover"
                            />
                          </button>
                        )}

                        {/* Voice Attachment */}
                        {msg.voiceAttachment && (
                          <div className="mb-2 p-2 rounded-xl bg-black/30 border border-white/10 space-y-1">
                            <div className="flex items-center justify-between text-[10px] font-bold opacity-85">
                              <span className="inline-flex items-center gap-1">
                                <Mic className="w-3 h-3" /> Pesan Suara
                              </span>
                              <span className="tabular-nums">{msg.voiceAttachment.durationSec}d</span>
                            </div>
                            <audio controls src={msg.voiceAttachment.dataUrl} className="w-full h-8 max-w-[230px]" />
                          </div>
                        )}

                        {/* Collapsible Formatted Body Text */}
                        {msg.text && <CollapsibleChatBody text={msg.text} />}

                        {/* Amplop Kaget Card */}
                        {msg.redPacket && renderRedPacketCard(msg.redPacket, 'global', msg.id)}

                        {/* Official Poll */}
                        {msg.poll && renderPollCard(msg.poll, (optId) => void voteGlobalChatPoll(msg.id, optId))}

                        {/* Footer: Time + Diedit */}
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                            isStrictOwner && !isMsgAdmin
                              ? 'text-emerald-100/90'
                              : isMsgAdmin
                                ? 'text-amber-300/80'
                                : 'text-slate-400'
                          }`}
                        >
                          {msg.editedAt && (
                            <button
                              type="button"
                              onClick={() =>
                                setShowEditedTipId((prev) => (prev === msg.id ? null : msg.id))
                              }
                              title={`Diedit pada ${formatChatDateTime(msg.editedAt)}`}
                              className="italic underline decoration-dotted hover:opacity-100"
                            >
                              (Diedit{showEditedTipId === msg.id ? ` ${formatChatTimeShort(msg.editedAt)}` : ''})
                            </button>
                          )}
                          <span>{formatChatTimeShort(msg.timestamp)}</span>
                        </div>
                      </div>

                      {/* Reactions Display Row */}
                      {reactionEntries.length > 0 && (
                        <div className={`mt-1 flex flex-wrap items-center gap-1 ${isStrictOwner ? 'justify-end' : 'justify-start'}`}>
                          {reactionEntries.map(([emoji, voterIds]) => {
                            const iReacted = voterIds.includes(currentAccount.id);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                disabled={isReactionLockedFlag}
                                onClick={() => void toggleGlobalChatReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs border transition-all inline-flex items-center gap-1 ${
                                  iReacted
                                    ? 'bg-emerald-950/70 border-emerald-400 text-emerald-200 font-bold'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px] tabular-nums">{voterIds.length}</span>
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => setReactionVotersTarget(msg.reactions || {})}
                            className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-900 border-slate-700 text-slate-400 hover:text-white inline-flex items-center gap-0.5"
                            title="Lihat daftar pemberi reaksi"
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                          {!isReactionLockedFlag && (
                            <button
                              type="button"
                              onClick={() => setEmojiPickerTarget({ scope: 'global', msgId: msg.id })}
                              className="px-1.5 py-0.5 rounded-full text-xs border bg-slate-900 border-slate-700 text-slate-400 hover:text-emerald-300 hover:border-emerald-500/60 inline-flex items-center justify-center transition-colors"
                              title="Tambah reaksi emoji"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Popover Menu `···` (Strict Sender-Only Deletion + Separate Admin Moderation) */}
                      {openMenuMsgId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute z-40 mt-1 w-60 rounded-2xl bg-[#0b0f19] border border-slate-700 shadow-2xl p-1.5 space-y-1 ${
                            isStrictOwner ? 'right-0' : 'left-0'
                          }`}
                        >
                          {!isReactionLockedFlag && (
                            <div className="flex items-center justify-between gap-0.5 px-1 py-1 border-b border-slate-800">
                              {QUICK_REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    void toggleGlobalChatReaction(msg.id, emoji);
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-7 h-7 rounded-lg hover:bg-slate-800 text-base flex items-center justify-center transition-transform hover:scale-125"
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setEmojiPickerTarget({ scope: 'global', msgId: msg.id });
                                  setOpenMenuMsgId(null);
                                }}
                                className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
                                title="Pilih semua emoji"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setGlobalReplyTarget(msg);
                              setGlobalEditTarget(null);
                              setOpenMenuMsgId(null);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Reply className="w-3.5 h-3.5" /> Balas Pesan
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setGlobalEditTarget(msg);
                                setGlobalReplyTarget(null);
                                setDraftByRoom((prev) => ({ ...prev, global: msg.text }));
                                setOpenMenuMsgId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit Pesan
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              void handleCopyText(msg.text);
                              setOpenMenuMsgId(null);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" /> Salin Teks
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const r = toggleBookmarkChatMessage(msg.id);
                              showToast(r.message, 'info');
                              setOpenMenuMsgId(null);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                            {isBookmarked ? 'Hapus Bintang' : 'Tandai Bintang'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setForwardModalPayload({
                                text: msg.text,
                                meta: { originalSenderName: msg.senderName, sourceRoomLabel: 'Chat Global' },
                              });
                              setOpenMenuMsgId(null);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Forward className="w-3.5 h-3.5" /> Teruskan Pesan
                          </button>
                          {!isStrictOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                setReportTarget({
                                  scope: 'global',
                                  messageId: msg.id,
                                  roomKey: 'global',
                                  reportedAccountId: msg.senderAccountId,
                                  reportedName: msg.senderName,
                                  messagePreview: msg.text || '(Lampiran)',
                                });
                                setOpenMenuMsgId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-300 hover:bg-amber-950/40 flex items-center gap-2"
                            >
                              <Flag className="w-3.5 h-3.5" /> Laporkan Pesan
                            </button>
                          )}

                          {/* Admin Moderation Actions on Chat Global */}
                          {isAdminUser && (
                            <div className="pt-1 mt-1 border-t border-slate-800 space-y-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  const r = await togglePinGlobalChatMessage(msg.id);
                                  showToast(r.message, 'info');
                                  setOpenMenuMsgId(null);
                                }}
                                className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-300 hover:bg-amber-950/40 flex items-center gap-2"
                              >
                                {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                {msg.isPinned ? 'Lepas Sematan' : 'Sematkan Pesan'}
                              </button>
                              {!isStrictOwner && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const r = await deleteGlobalChatMessage(msg.id, { asAdminModeration: true });
                                    showToast(r.message, r.success ? 'info' : 'error');
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" /> Hapus Pelanggaran (Moderasi Admin)
                                </button>
                              )}
                              {!isMsgAdmin && msg.senderAccountId && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setAdminModModalState({
                                        open: true,
                                        tab: 'moderation',
                                        muteTarget: {
                                          accountId: msg.senderAccountId!,
                                          name: msg.senderName,
                                          accountNumber: msg.senderAccount,
                                        },
                                      });
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> Mute Pengirim
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setWarnModalTarget({
                                        accountId: msg.senderAccountId!,
                                        name: msg.senderName,
                                      });
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-400 hover:bg-amber-950/40 flex items-center gap-2"
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" /> Tegur Langsung
                                  </button>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const r = await adminBulkDeleteUserGlobalChats(
                                        msg.senderAccountId!,
                                        msg.senderName,
                                        msg.senderAccount
                                      );
                                      showToast(r.message, r.success ? 'success' : 'error');
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-rose-400 hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Pesan User Ini
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {/* Deletion Section: STRICT sender-only Hapus untuk Semua Orang */}
                          <div className="pt-1 mt-1 border-t border-slate-800 space-y-0.5">
                            <button
                              type="button"
                              onClick={() => {
                                const r = hideChatMessageForMe(msg.id);
                                showToast(r.message, 'info');
                                setOpenMenuMsgId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Hapus untuk Saya Sendiri
                            </button>
                            {isStrictOwner && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const r = await deleteGlobalChatMessage(msg.id);
                                  showToast(r.message, r.success ? 'info' : 'error');
                                  setOpenMenuMsgId(null);
                                }}
                                className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus untuk Semua Orang
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={globalEndRef} />
          </div>

          {/* Typing Indicator */}
          {activeTypingUsers.length > 0 && (
            <div className="shrink-0 px-4 py-1 text-[11px] font-semibold text-emerald-400 bg-[#0b0f19] border-t border-slate-800">
              {activeTypingUsers.map((u) => u.accountName).join(', ')} sedang mengetik...
            </div>
          )}

          {/* Global Composer */}
          <div className="shrink-0 p-3 border-t border-slate-800 bg-[#0b0f19] relative space-y-2">
            {/* Hidden image input */}
            <input
              ref={globalImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handleImageFilePicked(e, 'global')}
            />

            {/* Mention Autocomplete Dropdown */}
            {mentionCandidates.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-1.5 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl p-1.5 max-h-44 overflow-y-auto z-30">
                <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Mention Nasabah (@)</p>
                {mentionCandidates.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => insertMention(acc.fullName)}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-100 hover:bg-emerald-950/40 flex items-center justify-between"
                  >
                    <span>@{acc.fullName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{acc.accountNumber}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Reply / Edit Banner */}
            {(globalReplyTarget || globalEditTarget) && (
              <div className="px-3 py-2 rounded-xl bg-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-emerald-400">
                    {globalEditTarget ? 'Mengedit Pesan Anda' : `Membalas ${globalReplyTarget?.senderName}`}
                  </p>
                  <p className="text-slate-300 truncate">
                    {globalEditTarget ? globalEditTarget.text : globalReplyTarget?.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalReplyTarget(null);
                    setGlobalEditTarget(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Quick Toolbar + Quick Reply Chips */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  disabled={isImageLockedFlag || (!isAdminUser && globalChatConfig.adminOnlyLock)}
                  onClick={() => globalImageInputRef.current?.click()}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                  title={isImageLockedFlag ? 'Kirim foto dinonaktifkan Admin' : 'Kirim Foto'}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={isVoiceLockedFlag || (!isAdminUser && globalChatConfig.adminOnlyLock)}
                  onClick={() => void handleToggleVoiceRecord('global')}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40 ${
                    recordingScope === 'global'
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                  title={isVoiceLockedFlag ? 'Pesan suara dinonaktifkan Admin' : 'Rekam Pesan Suara'}
                >
                  {recordingScope === 'global' ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{recordingScope === 'global' ? `Stop (${recordingSeconds}d)` : 'Suara'}</span>
                </button>
                <select
                  value={disappearSec}
                  onChange={(e) => setDisappearSec(Number(e.target.value) as 0 | 60 | 3600 | 86400)}
                  className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300"
                  title="Timer pesan sementara"
                >
                  <option value={0}>Timer: Off</option>
                  <option value={60}>Hilang 1m</option>
                  <option value={3600}>Hilang 1j</option>
                  <option value={86400}>Hilang 24j</option>
                </select>
              </div>
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
                {QUICK_REPLY_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setActiveDraftText(activeDraftText ? `${activeDraftText} ${chip}` : chip)}
                    className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 shrink-0"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendGlobal} className="flex items-end gap-2 min-w-0">
              <textarea
                ref={globalTextareaRef}
                rows={1}
                value={activeDraftText}
                onChange={(e) => setActiveDraftText(e.target.value)}
                onKeyDown={(e) => handleComposerKeyDown(e, 'global')}
                disabled={!isAdminUser && globalChatConfig.adminOnlyLock}
                placeholder={
                  !isAdminUser && globalChatConfig.adminOnlyLock
                    ? 'Chat Global sedang dikunci Khusus Admin...'
                    : globalEditTarget
                      ? 'Ubah isi pesan Anda...'
                      : 'Tulis pesan di Chat Global (ketik @nama untuk mention)...'
                }
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-sm text-white resize-none max-h-[128px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={
                  globalSending ||
                  !activeDraftText.trim() ||
                  (!isAdminUser && (globalChatConfig.adminOnlyLock || globalCooldownLeft > 0))
                }
                className="shrink-0 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>
                  {globalEditTarget ? 'Simpan' : globalCooldownLeft > 0 ? `${globalCooldownLeft}d` : 'Kirim'}
                </span>
              </button>
            </form>

            <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 px-1">
              <span>
                {enterKeySends
                  ? 'Mode Enter: Enter kirim · Shift+Enter baris baru'
                  : 'Enter baris baru · Ctrl+Enter kirim pesan'}
              </span>
              <button
                type="button"
                onClick={() => {
                  const r = toggleEnterKeyPreference();
                  showToast(r.message, 'info');
                }}
                className="font-bold text-emerald-400 hover:underline shrink-0"
              >
                Tukar Tombol Enter
              </button>
            </div>
          </div>
        </div>
        )
      )}

      {/* ==================== TAB 2: CHAT PRIVAT (1-ON-1 & GRUP PRIVAT) ==================== */}
      {mainTab === 'private' && (
        isPrivateLockedFlag ? (
          <div className="rounded-3xl bg-[#0b0f19] border border-rose-500/40 p-8 text-center space-y-3 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-white">Chat Privat Dinonaktifkan Sementara oleh Admin</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Layanan Chat Privat 1-on-1 &amp; Grup sedang dinonaktifkan sementara oleh Admin Bank Nusantara.
            </p>
            {!isGlobalLockedFlag && (
              <button
                type="button"
                onClick={() => setMainTab('global')}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold"
              >
                Kembali ke Chat Global
              </button>
            )}
          </div>
        ) : (
        <div className="rounded-3xl bg-[#0b0f19] border border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-[330px_minmax(0,1fr)] h-[calc(100dvh-230px)] min-h-[540px] max-h-[820px] min-w-0 overflow-hidden">
          {/* LEFT SIDEBAR: Daftar Kontak & Grup (hidden on mobile when room open) */}
          <div
            className={`${
              activeTarget ? 'hidden md:flex' : 'flex'
            } flex-col min-w-0 min-h-0 border-r border-slate-800 bg-[#0b0f19]/95`}
          >
            {/* Sidebar Actions */}
            <div className="shrink-0 p-3 space-y-2.5 border-b border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAddContactModalState({ open: true, prefill: null })}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span className="truncate">Tambah Nasabah</span>
                </button>
                <button
                  type="button"
                  disabled={isGroupLockedFlag || isCreateGroupLockedFlag}
                  onClick={() => setShowCreateGroupModal(true)}
                  title={isGroupLockedFlag || isCreateGroupLockedFlag ? 'Pembuatan grup dinonaktifkan Admin' : 'Buat Grup Privat Baru'}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span className="truncate">Buat Grup</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={sidebarSearchQuery}
                  onChange={(e) => setSidebarSearchQuery(e.target.value)}
                  placeholder="Cari kontak, no. rek, atau grup..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-800">
                {[
                  { id: 'all' as const, label: 'Semua' },
                  { id: 'dm' as const, label: '1-on-1' },
                  ...(!isGroupLockedFlag ? [{ id: 'group' as const, label: 'Grup' }] : []),
                  { id: 'archived' as const, label: `Arsip${archivedCount > 0 ? ` (${archivedCount})` : ''}` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPrivateFilter(f.id)}
                    className={`py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all truncate ${
                      privateFilter === f.id
                        ? 'bg-[#0b0f19] text-indigo-400 shadow-sm'
                        : 'text-slate-400'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sidebar Scrollable List */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1.5">
              {/* Private Groups */}
              {!isGroupLockedFlag &&
                (privateFilter === 'all' || privateFilter === 'group' || privateFilter === 'archived') &&
                filteredGroups.map((grp) => {
                  const isSelected = activeTarget?.type === 'group' && activeTarget.id === grp.id;
                  const lastRead = chatLastReadMap[`group:${grp.id}`] || 0;
                  const groupMsgs = chats.filter((m) => !m.deleted && !hiddenChatIdSet.has(m.id) && m.groupId === grp.id);
                  const lastMsg = groupMsgs[groupMsgs.length - 1];
                  const unread = groupMsgs.filter((m) => {
                    const isMine =
                      m.senderAccountId === currentAccount.id || m.senderAccount === currentAccount.accountNumber;
                    return !isMine && (m.createdAtMs || Date.parse(m.timestamp || '')) > lastRead;
                  }).length;
                  const isMuted = mutedGroupIdSet.has(grp.id);
                  const isPinned = pinnedRoomKeySet.has(`group:${grp.id}`);

                  return (
                    <button
                      key={grp.id}
                      type="button"
                      onClick={() => {
                        setActiveTarget({ type: 'group', id: grp.id });
                        setPrivateReplyTarget(null);
                        setPrivateEditTarget(null);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border ${
                        isSelected
                          ? 'bg-indigo-950/50 border-indigo-700'
                          : 'bg-[#0b0f19]/70 border-transparent hover:bg-slate-800/70'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getChatGroupColorClass(grp.accentColor)}`}>
                        {renderChatGroupIcon(grp.iconKey, 'w-5 h-5')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm font-bold text-white truncate flex items-center gap-1">
                            {isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                            {grp.name}
                            {isMuted && <VolumeX className="w-3 h-3 text-slate-400 shrink-0" />}
                          </span>
                          {lastMsg && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatChatTimeShort(lastMsg.timestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-400 truncate">
                            {lastMsg
                              ? `${lastMsg.senderName}: ${lastMsg.text || (lastMsg.redPacket ? 'Amplop Kaget' : 'Lampiran')}`
                              : `${grp.memberAccountIds.length} anggota`}
                          </p>
                          {unread > 0 && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-indigo-600 text-white">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

              {/* 1-on-1 DMs (Saved Contacts + Unsaved Incoming Senders) */}
              {(privateFilter === 'all' || privateFilter === 'dm' || privateFilter === 'archived') &&
                filteredDmItems.map((dm) => {
                  const isSelected = activeTarget?.type === 'dm' && activeTarget.id === dm.peerAccountId;
                  const presence = getPresenceStatusLabel(dm.peerAccountId);
                  const isPinned = pinnedRoomKeySet.has(`dm:${dm.peerAccountId}`);
                  const isBlocked = blockedAccountIdSet.has(dm.peerAccountId);

                  return (
                    <button
                      key={dm.peerAccountId}
                      type="button"
                      onClick={() => {
                        setActiveTarget({
                          type: 'dm',
                          id: dm.peerAccountId,
                          accountNumber: dm.peerAccountNumber,
                        });
                        setPrivateReplyTarget(null);
                        setPrivateEditTarget(null);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all border ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-700'
                          : 'bg-[#0b0f19]/70 border-transparent hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                            dm.isAdminPeer
                              ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          {dm.displayName.charAt(0).toUpperCase()}
                        </div>
                        {presence.online && !isBlocked && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm font-bold text-white truncate inline-flex items-center gap-1">
                            {isPinned && <Pin className="w-3 h-3 text-amber-400 shrink-0" />}
                            {dm.isSaved ? dm.displayName : dm.peerAccountNumber}
                          </span>
                          {dm.lastMessageTime && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatChatTimeShort(dm.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {dm.isAdminPeer && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-300">
                              <ShieldCheck className="w-2.5 h-2.5" /> ADMIN RESMI
                            </span>
                          )}
                          {isBlocked && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-rose-950 text-rose-300 border border-rose-700">
                              Diblokir
                            </span>
                          )}
                          {!dm.isSaved && (
                            <>
                              <span className="text-[10px] font-semibold text-slate-300 truncate max-w-[110px]">
                                {dm.registeredName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-950/60 text-amber-300 border border-amber-700">
                                Belum Disimpan
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-400 truncate">
                            {dm.lastMessageText}
                          </p>
                          {dm.unreadCount > 0 && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-600 text-white">
                              {dm.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}

              {filteredDmItems.length === 0 && (isGroupLockedFlag || filteredGroups.length === 0) && (
                <div className="text-center py-10 px-4 space-y-2">
                  <p className="text-xs font-bold text-slate-300">
                    {privateFilter === 'archived'
                      ? 'Belum ada ruang chat yang diarsipkan'
                      : 'Belum ada kontak atau grup privat'}
                  </p>
                  {privateFilter !== 'archived' && (
                    <p className="text-[11px] text-slate-500">
                      Tekan <strong>Tambah Nasabah</strong> dengan User ID atau No. Rekening untuk mulai chat privat atau membuat grup.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Active Private Conversation Room (DM or Group) */}
          <div
            className={`${
              activeTarget ? 'flex' : 'hidden md:flex'
            } flex-col min-w-0 min-h-0 bg-[#0b0f19] overflow-hidden`}
          >
            {!activeTarget ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-950/50 text-indigo-400 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-white">
                    Pilih Kontak atau Grup Privat
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Percakapan 1-on-1 &amp; Grup Privat mendukung Kirim/Minta Uang, Coin &amp; Diamond, Amplop Kaget ala DANA, Patungan Grup, Foto, Voice Note &amp; Polling.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="shrink-0 px-3 sm:px-4 py-3 border-b border-slate-800 bg-[#0b0f19]/95 space-y-2">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveTarget(null)}
                        className="md:hidden p-2 rounded-xl bg-slate-800 text-slate-200 shrink-0"
                        aria-label="Kembali ke daftar kontak"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      {activeTarget.type === 'group' && activeGroup ? (
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getChatGroupColorClass(activeGroup.accentColor)}`}>
                          {renderChatGroupIcon(activeGroup.iconKey, 'w-5 h-5')}
                        </div>
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                            activeDmItem?.isAdminPeer
                              ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {(activeDmItem?.displayName || 'N').charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-sm font-extrabold text-white truncate">
                            {activeTarget.type === 'group' && activeGroup
                              ? activeGroup.name
                              : activeDmItem?.isSaved
                                ? activeDmItem.displayName
                                : `${activeDmItem?.peerAccountNumber || ''} (${activeDmItem?.registeredName || 'Nasabah'})`}
                          </h3>
                          {activeTarget.type === 'dm' && activeDmItem?.isAdminPeer && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950">
                              <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {activeTarget.type === 'group' && activeGroup
                            ? `${activeGroup.memberAccountIds.length} anggota • ${activeGroupOnlineCount} online`
                            : getPresenceStatusLabel(activeDmItem?.peerAccountId).label}
                        </p>
                      </div>
                    </div>

                    {/* Header Right Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                      {activeTarget.type === 'dm' && activeDmItem && !activeDmItem.isSaved && (
                        <button
                          type="button"
                          onClick={() =>
                            setAddContactModalState({
                              open: true,
                              prefill: {
                                userId: activeDmItem.peerUserId16,
                                accountNumber: activeDmItem.peerAccountNumber,
                                isQuickSave: true,
                              },
                            })
                          }
                          className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Simpan</span>
                        </button>
                      )}

                      <button
                        type="button"
                        disabled={isAssetLockedFlag}
                        onClick={() => {
                          setIsRequestAssetMode(false);
                          setShowAssetModal(true);
                        }}
                        className="p-2 rounded-xl bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/70 disabled:opacity-40"
                        title={isAssetLockedFlag ? 'Kirim Uang/Coin/Diamond dinonaktifkan Admin' : 'Kirim Uang / Coin / Diamond'}
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isAssetLockedFlag}
                        onClick={() => {
                          setIsRequestAssetMode(true);
                          setShowAssetModal(true);
                        }}
                        className="p-2 rounded-xl bg-amber-950/60 text-amber-300 hover:bg-amber-900/60 disabled:opacity-40"
                        title={isAssetLockedFlag ? 'Minta Uang/Coin/Diamond dinonaktifkan Admin' : 'Minta Uang / Coin / Diamond'}
                      >
                        <HandCoins className="w-4 h-4" />
                      </button>

                      {activeTarget.type === 'group' && (
                        <>
                          <button
                            type="button"
                            disabled={isRedPacketLockedFlag}
                            onClick={() => setRedPacketModalScope('group')}
                            className="p-2 rounded-xl bg-rose-950/60 text-rose-300 hover:bg-rose-900/70 disabled:opacity-40"
                            title={isRedPacketLockedFlag ? 'Amplop Kaget dinonaktifkan Admin' : 'Kirim Amplop Kaget Grup'}
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isSplitBillLockedFlag}
                            onClick={() => setShowSplitBillModal(true)}
                            className="p-2 rounded-xl bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/70 disabled:opacity-40"
                            title={isSplitBillLockedFlag ? 'Patungan dinonaktifkan Admin' : 'Patungan Grup (Split Bill)'}
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isPollLockedFlag}
                            onClick={() => setPollModalScope('group')}
                            className="p-2 rounded-xl bg-violet-950/60 text-violet-300 hover:bg-violet-900/70 disabled:opacity-40"
                            title={isPollLockedFlag ? 'Polling dinonaktifkan Admin' : 'Buat Polling Grup'}
                          >
                            <BarChart2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setShowContactCardModal(true)}
                        className="p-2 rounded-xl bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/70"
                        title="Bagikan Kartu Kontak Nasabah"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowBillReminderModal(true)}
                        className="p-2 rounded-xl bg-amber-950/50 text-amber-300 hover:bg-amber-900/60"
                        title="Kirim Pengingat Tagihan"
                      >
                        <CalendarClock className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const r = togglePinChatRoom(activeRoomKey);
                          showToast(r.message, 'info');
                        }}
                        className={`p-2 rounded-xl ${
                          pinnedRoomKeySet.has(activeRoomKey)
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                        title={pinnedRoomKeySet.has(activeRoomKey) ? 'Lepas Pin Ruang Chat' : 'Sematkan Ruang Chat'}
                      >
                        <Pin className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const r = toggleArchiveChatRoom(activeRoomKey);
                          showToast(r.message, 'info');
                        }}
                        className={`p-2 rounded-xl ${
                          archivedRoomKeySet.has(activeRoomKey)
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                        title={archivedRoomKeySet.has(activeRoomKey) ? 'Keluarkan dari Arsip' : 'Arsipkan Ruang Chat'}
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadPrivateRecap}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                        title="Ekspor percakapan (.txt)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrivateRoomSearchOpen((v) => !v)}
                        className={`p-2 rounded-xl ${
                          privateRoomSearchOpen
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                        title="Cari di ruang chat ini"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrivateBookmarkedOnly((v) => !v)}
                        className={`p-2 rounded-xl ${
                          privateBookmarkedOnly
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                        title="Filter pesan berbintang"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      {activeTarget.type === 'group' && (
                        <button
                          type="button"
                          onClick={() => setShowGroupInfoModal(true)}
                          className="p-2 rounded-xl bg-indigo-950/60 text-indigo-300 hover:bg-indigo-900/70"
                          title="Info & Pengaturan Grup"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                      {activeTarget.type === 'dm' && activeDmItem && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = toggleBlockChatAccount(activeDmItem.peerAccountId, activeDmItem.displayName);
                            showToast(r.message, 'info');
                          }}
                          className={`p-2 rounded-xl ${
                            activeDmBlocked
                              ? 'bg-rose-600 text-white'
                              : 'bg-slate-800 text-rose-400 hover:bg-rose-950/60'
                          }`}
                          title={activeDmBlocked ? 'Buka Blokir Kontak' : 'Blokir Kontak'}
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                      {activeTarget.type === 'dm' && activeDmItem?.isSaved && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = removePrivateChatContact(activeDmItem.peerAccountId);
                            showToast(r.message, 'info');
                          }}
                          className="p-2 rounded-xl bg-rose-950/50 text-rose-400 hover:bg-rose-900/70"
                          title="Hapus dari daftar kontak tersimpan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Group Cash Summary Pill */}
                  {activeTarget.type === 'group' &&
                    (activeGroupCashSummary.uang > 0 ||
                      activeGroupCashSummary.coin > 0 ||
                      activeGroupCashSummary.diamond > 0) && (
                      <div className="flex items-center gap-2 flex-wrap px-2.5 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-[11px] text-indigo-200 tabular-nums">
                        <span className="font-extrabold">Kas Transaksi Grup Lunas:</span>
                        {activeGroupCashSummary.uang > 0 && (
                          <span className="font-mono font-bold text-emerald-300">
                            {formatModalAssetValue(activeGroupCashSummary.uang, 'uang')}
                          </span>
                        )}
                        {activeGroupCashSummary.coin > 0 && (
                          <span className="font-mono font-bold text-amber-300">
                            {formatModalAssetValue(activeGroupCashSummary.coin, 'coin')}
                          </span>
                        )}
                        {activeGroupCashSummary.diamond > 0 && (
                          <span className="font-mono font-bold text-cyan-300">
                            {formatModalAssetValue(activeGroupCashSummary.diamond, 'diamond')}
                          </span>
                        )}
                      </div>
                    )}

                  {/* In-room Search Bar */}
                  {privateRoomSearchOpen && (
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={privateRoomSearchQuery}
                        onChange={(e) => setPrivateRoomSearchQuery(e.target.value)}
                        placeholder="Cari pesan di percakapan ini..."
                        className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-700 bg-slate-800 text-xs text-white"
                      />
                      {privateRoomSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setPrivateRoomSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* WHATSAPP-STYLE TOP BANNER FOR UNSAVED INCOMING SENDER */}
                {activeTarget.type === 'dm' &&
                  activeDmItem &&
                  !activeDmItem.isSaved &&
                  !dismissedUnsavedBannerKeys[activeDmItem.peerAccountId] && (
                    <div className="shrink-0 px-4 py-3 bg-emerald-950/45 border-b border-emerald-800/70 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-emerald-200 flex items-center gap-1.5 flex-wrap">
                          <span>Pengirim ini belum tersimpan di kontak Anda</span>
                          {activeDmItem.isAdminPeer && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                              ADMIN RESMI
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-emerald-300/80">
                          {activeDmItem.registeredName} • Rek {activeDmItem.peerAccountNumber}. Simpan agar mudah ditemukan &amp; bisa dipilih saat Buat Grup Baru.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setAddContactModalState({
                              open: true,
                              prefill: {
                                userId: activeDmItem.peerUserId16,
                                accountNumber: activeDmItem.peerAccountNumber,
                                isQuickSave: true,
                              },
                            })
                          }
                          className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Simpan Nasabah
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDismissedUnsavedBannerKeys((prev) => ({
                              ...prev,
                              [activeDmItem.peerAccountId]: true,
                            }))
                          }
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-200 bg-emerald-900/60 hover:bg-emerald-900/70"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}

                {/* Group Pinned Messages Strip */}
                {activeTarget.type === 'group' && groupPinnedMessages.length > 0 && (
                  <div className="shrink-0 bg-indigo-950/35 border-b border-indigo-800/60 px-4 py-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-extrabold text-indigo-300 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Disematkan ({groupPinnedMessages.length}) •{' '}
                        {groupPinnedMessages[groupPinnedMessages.length - 1].senderName}
                      </p>
                      <p className="text-xs text-indigo-100/90 truncate">
                        {groupPinnedMessages[groupPinnedMessages.length - 1].text}
                      </p>
                      {groupPinnedExpanded && groupPinnedMessages.length > 1 && (
                        <div className="mt-1.5 pt-1.5 border-t border-indigo-800/60 space-y-1">
                          {groupPinnedMessages.slice(0, -1).map((pm) => (
                            <p key={pm.id} className="text-[11px] text-indigo-200/80 truncate">
                              <strong>{pm.senderName}:</strong> {pm.text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    {groupPinnedMessages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setGroupPinnedExpanded((v) => !v)}
                        className="p-1 rounded-lg text-indigo-300"
                      >
                        {groupPinnedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}

                {/* Private Messages List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-[#05070c]">
                  {visiblePrivateMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                      <Lock className="w-9 h-9 mb-2 opacity-40" />
                      <p className="text-sm font-bold text-slate-300">
                        {privateBookmarkedOnly
                          ? 'Belum ada pesan berbintang di ruang ini'
                          : 'Belum ada percakapan di sini'}
                      </p>
                      <p className="text-xs mt-1">Kirim pesan pertama atau lampirkan Kirim/Minta Uang, Coin &amp; Diamond.</p>
                    </div>
                  ) : (
                    visiblePrivateMessages.map((msg) => {
                      const isStrictOwner = Boolean(
                        msg.senderAccountId
                          ? msg.senderAccountId === currentAccount.id
                          : msg.senderAccount === currentAccount.accountNumber
                      );
                      const isMsgAdmin = msg.senderRole === 'admin' || msg.senderCardTier === 'admin';
                      const isBookmarked = bookmarkedIdSet.has(msg.id);
                      const canEdit =
                        !isEditLockedFlag &&
                        isStrictOwner &&
                        canEditWithinWindow(msg.createdAtMs, msg.timestamp, isAdminUser);
                      const isGroupAdmin = Boolean(
                        activeGroup &&
                          (activeGroup.creatorAccountId === currentAccount.id ||
                            (activeGroup.coAdminAccountIds || []).includes(currentAccount.id))
                      );
                      const canViewGroupReceipts = Boolean(activeGroup && (isStrictOwner || isGroupAdmin));

                      const groupOtherCount = activeGroup
                        ? Math.max(0, activeGroup.memberAccountIds.filter((id) => id !== msg.senderAccountId).length)
                        : 0;
                      const groupReaderCount = activeGroup
                        ? activeGroup.memberAccountIds.filter(
                            (id) => id !== msg.senderAccountId && Boolean(msg.readBy?.[id])
                          ).length
                        : 0;
                      const allGroupRead = groupOtherCount > 0 && groupReaderCount >= groupOtherCount;

                      const dmPeerReadEntry =
                        !activeGroup && activeDmItem ? msg.readBy?.[activeDmItem.peerAccountId] : undefined;

                      const reactionEntries = Object.entries(msg.reactions || {}).filter(
                        ([, ids]) => Array.isArray(ids) && ids.length > 0
                      );
                      const senderAccountObj = msg.senderAccountId
                        ? accounts.find((a) => a.id === msg.senderAccountId)
                        : accounts.find((a) => a.accountNumber === msg.senderAccount);

                      const bubbleClasses = isMsgAdmin
                        ? 'bg-gradient-to-br from-amber-950/85 via-amber-900/60 to-yellow-950/75 border border-amber-500/60 text-amber-50 shadow-sm'
                        : isStrictOwner
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-800 border border-slate-700 text-slate-100 shadow-sm';

                      return (
                        <div key={msg.id} className={`flex flex-col ${isStrictOwner ? 'items-end' : 'items-start'}`}>
                          <div className="relative max-w-[88%] sm:max-w-[76%] min-w-0">
                            <div className={`rounded-2xl px-3.5 py-2.5 ${bubbleClasses}`}>
                              {/* Sender Name & Menu */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  {(activeTarget.type === 'group' || isMsgAdmin || !isStrictOwner) && (
                                    <button
                                      type="button"
                                      disabled={!isAdminUser || !senderAccountObj}
                                      onClick={() => {
                                        if (isAdminUser && senderAccountObj) setAdminQuickAcc(senderAccountObj);
                                      }}
                                      className={`text-xs font-extrabold truncate text-left ${
                                        isMsgAdmin
                                          ? 'text-amber-300'
                                          : isStrictOwner
                                            ? 'text-indigo-100'
                                            : 'text-white'
                                      } ${isAdminUser && senderAccountObj ? 'hover:underline cursor-pointer' : 'cursor-default'}`}
                                    >
                                      {msg.senderName}
                                    </button>
                                  )}
                                  {isMsgAdmin && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950">
                                      <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                                    </span>
                                  )}
                                  {isMsgAdmin && msg.adminDivisionLabel && (
                                    <span className="px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40 text-[9px] font-bold">
                                      {msg.adminDivisionLabel}
                                    </span>
                                  )}
                                  {renderCustomCustomerBadge(msg.senderCustomBadge ?? senderAccountObj?.chatCustomBadge)}
                                  {msg.expiresAtMs && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold opacity-80">
                                      <Clock className="w-2.5 h-2.5" /> Sementara
                                    </span>
                                  )}
                                  {isBookmarked && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuMsgId((prev) => (prev === msg.id ? null : msg.id));
                                  }}
                                  className={`p-1 rounded-lg shrink-0 ${
                                    isStrictOwner && !isMsgAdmin
                                      ? 'text-indigo-100 hover:bg-indigo-700/60'
                                      : 'text-slate-400 hover:text-white'
                                  }`}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </div>

                              {msg.forwardedFrom && (
                                <div className="text-[10px] italic opacity-75 mb-1 inline-flex items-center gap-1">
                                  <Forward className="w-3 h-3" /> Diteruskan dari {msg.forwardedFrom.originalSenderName}
                                </div>
                              )}

                              {msg.replyToPreview && (
                                <div
                                  className={`mb-1.5 px-2.5 py-1.5 rounded-xl border-l-2 text-[11px] ${
                                    isStrictOwner && !isMsgAdmin
                                      ? 'bg-indigo-700/50 border-indigo-200 text-indigo-50'
                                      : 'bg-[#0b0f19]/40 border-indigo-500 text-slate-300'
                                  }`}
                                >
                                  <p className="font-bold truncate">{msg.replyToSender}</p>
                                  <p className="truncate opacity-85">{msg.replyToPreview}</p>
                                </div>
                              )}

                              {/* Multi-Asset Transfer / Request Card */}
                              {msg.transferAttachment && (() => {
                                const assetKind: ChatAssetKind = msg.transferAttachment.assetKind || 'uang';
                                const st = msg.transferAttachment.status || 'pending';
                                return (
                                  <div
                                    className={`mb-2 p-3 rounded-xl border ${
                                      st === 'paid'
                                        ? 'bg-emerald-500/15 border-emerald-400/50'
                                        : st === 'rejected'
                                          ? 'bg-rose-500/15 border-rose-400/50'
                                          : 'bg-amber-500/15 border-amber-400/50'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase">
                                      <span className="inline-flex items-center gap-1">
                                        {assetKind === 'coin' ? (
                                          <Coins className="w-3.5 h-3.5 text-amber-300" />
                                        ) : assetKind === 'diamond' ? (
                                          <Gem className="w-3.5 h-3.5 text-cyan-300" />
                                        ) : (
                                          <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
                                        )}
                                        {msg.transferAttachment.isRequest
                                          ? `Permintaan ${assetKind === 'coin' ? 'Coin' : assetKind === 'diamond' ? 'Diamond' : 'Uang'}`
                                          : `Kirim ${assetKind === 'coin' ? 'Coin' : assetKind === 'diamond' ? 'Diamond' : 'Uang'}`}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                                          st === 'paid'
                                            ? 'bg-emerald-600 text-white'
                                            : st === 'rejected'
                                              ? 'bg-rose-600 text-white'
                                              : 'bg-amber-500 text-slate-950'
                                        }`}
                                      >
                                        {st === 'paid' ? 'LUNAS' : st === 'rejected' ? 'DITOLAK' : 'MENUNGGU'}
                                      </span>
                                    </div>
                                    <p className="text-lg font-black mt-1 tabular-nums">
                                      {formatModalAssetValue(msg.transferAttachment.amount, assetKind)}
                                    </p>
                                    {msg.transferAttachment.targetName && !msg.transferAttachment.isRequest && (
                                      <p className="text-[11px] opacity-85">Tujuan: {msg.transferAttachment.targetName}</p>
                                    )}
                                    {msg.transferAttachment.note && (
                                      <p className="text-xs opacity-85 mt-0.5">{msg.transferAttachment.note}</p>
                                    )}
                                    {msg.transferAttachment.isRequest && st === 'pending' && !isStrictOwner && (
                                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                                        <button
                                          type="button"
                                          disabled={isAssetLockedFlag}
                                          onClick={() =>
                                            setPendingPinAction({
                                              kind: 'pay_request',
                                              messageId: msg.id,
                                              amount: msg.transferAttachment!.amount,
                                              assetKind,
                                              senderName: msg.senderName,
                                            })
                                          }
                                          className="py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-extrabold shadow-sm"
                                        >
                                          Bayar Sekarang
                                        </button>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            const r = await rejectChatTransferRequest(msg.id);
                                            showToast(r.message, r.success ? 'info' : 'error');
                                          }}
                                          className="py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold"
                                        >
                                          Tolak
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Split Bill Card */}
                              {msg.splitBill && (() => {
                                const sb = msg.splitBill;
                                const paidMap = sb.paidByAccountIdMap || {};
                                const paidEntries = Object.entries(paidMap);
                                const isParticipant = sb.participantAccountIds.includes(currentAccount.id);
                                const iPaid = Boolean(paidMap[currentAccount.id]);
                                return (
                                  <div className="mb-2 p-3 rounded-xl bg-[#0b0f19]/60 border border-indigo-400/50 space-y-2">
                                    <div className="flex items-center justify-between gap-2 text-xs font-black text-indigo-200">
                                      <span className="inline-flex items-center gap-1.5">
                                        <Receipt className="w-4 h-4 text-indigo-400" /> {sb.title}
                                      </span>
                                      <span className="tabular-nums text-[11px]">
                                        {paidEntries.length}/{sb.participantAccountIds.length} Lunas
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px] tabular-nums bg-black/25 p-2 rounded-lg">
                                      <div>
                                        <span className="text-slate-400 block">Total Patungan</span>
                                        <strong className="text-white">{formatModalAssetValue(sb.totalAmount, sb.assetKind)}</strong>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block">Per Anggota</span>
                                        <strong className="text-emerald-300">{formatModalAssetValue(sb.perPersonAmount, sb.assetKind)}</strong>
                                      </div>
                                    </div>
                                    {isParticipant && !iPaid && (
                                      <button
                                        type="button"
                                        disabled={isSplitBillLockedFlag}
                                        onClick={() =>
                                          setPendingPinAction({
                                            kind: 'pay_split_bill',
                                            messageId: msg.id,
                                            amount: sb.perPersonAmount,
                                            assetKind: sb.assetKind,
                                            title: sb.title,
                                          })
                                        }
                                        className="w-full py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-extrabold"
                                      >
                                        Bayar Bagian Saya ({formatModalAssetValue(sb.perPersonAmount, sb.assetKind)})
                                      </button>
                                    )}
                                    {iPaid && (
                                      <p className="text-[11px] font-bold text-emerald-300">
                                        ✅ Anda sudah melunasi bagian patungan ini
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}

                              {/* Contact Card Attachment */}
                              {msg.contactAttachment && (
                                <div className="mb-2 p-3 rounded-xl bg-[#0b0f19]/65 border border-cyan-500/40 flex items-center justify-between gap-2.5">
                                  <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase text-cyan-300">Kartu Kontak Nasabah</p>
                                    <p className="text-xs font-black text-white truncate">{msg.contactAttachment.fullName}</p>
                                    <p className="text-[11px] font-mono text-slate-300">Rek {msg.contactAttachment.accountNumber}</p>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveTarget({
                                        type: 'dm',
                                        id: msg.contactAttachment!.accountId,
                                        accountNumber: msg.contactAttachment!.accountNumber,
                                      });
                                    }}
                                    className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold shrink-0"
                                  >
                                    Chat
                                  </button>
                                </div>
                              )}

                              {/* Bill Reminder Attachment */}
                              {msg.billReminder && (
                                <div className="mb-2 p-3 rounded-xl bg-amber-950/50 border border-amber-500/50 space-y-1">
                                  <div className="flex items-center gap-1.5 text-[11px] font-black text-amber-300">
                                    <CalendarClock className="w-3.5 h-3.5" />
                                    <span>{msg.billReminder.title}</span>
                                  </div>
                                  <p className="text-sm font-black text-white tabular-nums">
                                    {formatModalAssetValue(msg.billReminder.amount, msg.billReminder.assetKind)}
                                  </p>
                                  <p className="text-[11px] text-amber-200/80">
                                    Jatuh tempo: {msg.billReminder.dueDateLabel}
                                  </p>
                                  {msg.billReminder.note && (
                                    <p className="text-[11px] opacity-85">{msg.billReminder.note}</p>
                                  )}
                                </div>
                              )}

                              {/* Image Attachment */}
                              {msg.imageAttachment && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setLightboxImage({
                                      url: msg.imageAttachment!.dataUrl,
                                      fileName: msg.imageAttachment!.fileName,
                                    })
                                  }
                                  className="block mb-2 rounded-xl overflow-hidden border border-white/15 max-w-full"
                                >
                                  <img
                                    src={msg.imageAttachment.dataUrl}
                                    alt={msg.imageAttachment.fileName || 'Foto Chat'}
                                    className="max-h-56 w-auto object-cover"
                                  />
                                </button>
                              )}

                              {/* Voice Attachment */}
                              {msg.voiceAttachment && (
                                <div className="mb-2 p-2 rounded-xl bg-black/30 border border-white/10 space-y-1">
                                  <div className="flex items-center justify-between text-[10px] font-bold opacity-85">
                                    <span className="inline-flex items-center gap-1">
                                      <Mic className="w-3 h-3" /> Pesan Suara
                                    </span>
                                    <span className="tabular-nums">{msg.voiceAttachment.durationSec}d</span>
                                  </div>
                                  <audio controls src={msg.voiceAttachment.dataUrl} className="w-full h-8 max-w-[230px]" />
                                </div>
                              )}

                              {msg.text && <CollapsibleChatBody text={msg.text} />}

                              {/* Amplop Kaget Card */}
                              {msg.redPacket && renderRedPacketCard(msg.redPacket, 'private', msg.id)}

                              {msg.poll && renderPollCard(msg.poll, (optId) => void votePrivateChatPoll(msg.id, optId))}

                              {/* Footer: Time + Diedit + Read Receipts */}
                              <div
                                className={`mt-1.5 flex items-center justify-end gap-2 flex-wrap text-[10px] ${
                                  isStrictOwner && !isMsgAdmin
                                    ? 'text-indigo-100/90'
                                    : isMsgAdmin
                                      ? 'text-amber-300/80'
                                      : 'text-slate-400'
                                }`}
                              >
                                {msg.editedAt && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowEditedTipId((prev) => (prev === msg.id ? null : msg.id))
                                    }
                                    title={`Diedit pada ${formatChatDateTime(msg.editedAt)}`}
                                    className="italic underline decoration-dotted"
                                  >
                                    (Diedit{showEditedTipId === msg.id ? ` ${formatChatTimeShort(msg.editedAt)}` : ''})
                                  </button>
                                )}

                                {activeTarget.type === 'group' && canViewGroupReceipts && groupOtherCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setReadReceiptModalMsg(msg)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0b0f19]/20 hover:bg-[#0b0f19]/35 font-semibold transition-colors"
                                    title="Lihat siapa saja yang sudah membaca"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>
                                      Dilihat {groupReaderCount} dari {groupOtherCount} anggota
                                    </span>
                                    {allGroupRead && <CheckCheck className="w-3.5 h-3.5 text-sky-300" />}
                                  </button>
                                )}

                                <span>{formatChatTimeShort(msg.timestamp)}</span>

                                {activeTarget.type === 'dm' && isStrictOwner && (
                                  <span className="inline-flex items-center gap-1">
                                    {dmPeerReadEntry ? (
                                      <>
                                        <CheckCheck className="w-3.5 h-3.5 text-sky-300" />
                                        <span className="text-[9px] font-semibold text-sky-200">
                                          Dibaca {formatChatTimeShort(dmPeerReadEntry.readAt)}
                                        </span>
                                      </>
                                    ) : (
                                      <Check className="w-3.5 h-3.5 opacity-80" />
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Reactions Display */}
                            {reactionEntries.length > 0 && (
                              <div className={`mt-1 flex flex-wrap items-center gap-1 ${isStrictOwner ? 'justify-end' : 'justify-start'}`}>
                                {reactionEntries.map(([emoji, voterIds]) => {
                                  const iReacted = voterIds.includes(currentAccount.id);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      disabled={isReactionLockedFlag}
                                      onClick={() => void togglePrivateChatReaction(msg.id, emoji)}
                                      className={`px-2 py-0.5 rounded-full text-xs border inline-flex items-center gap-1 ${
                                        iReacted
                                          ? 'bg-indigo-950/70 border-indigo-400 text-indigo-200 font-bold'
                                          : 'bg-slate-800 border-slate-700 text-slate-300'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[10px] tabular-nums">{voterIds.length}</span>
                                    </button>
                                  );
                                })}
                                <button
                                  type="button"
                                  onClick={() => setReactionVotersTarget(msg.reactions || {})}
                                  className="px-1.5 py-0.5 rounded-full text-[10px] font-bold border bg-slate-900 border-slate-700 text-slate-400 hover:text-white inline-flex items-center gap-0.5"
                                  title="Lihat daftar pemberi reaksi"
                                >
                                  <Eye className="w-3 h-3" />
                                </button>
                                {!isReactionLockedFlag && (
                                  <button
                                    type="button"
                                    onClick={() => setEmojiPickerTarget({ scope: 'private', msgId: msg.id })}
                                    className="px-1.5 py-0.5 rounded-full text-xs border bg-slate-900 border-slate-700 text-slate-400 hover:text-indigo-300 hover:border-indigo-500/60 inline-flex items-center justify-center transition-colors"
                                    title="Tambah reaksi emoji"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Popover Menu `···` (STRICT SENDER-ONLY Hapus untuk Semua Orang) */}
                            {openMenuMsgId === msg.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute z-40 mt-1 w-60 rounded-2xl bg-[#0b0f19] border border-slate-700 shadow-2xl p-1.5 space-y-1 ${
                                  isStrictOwner ? 'right-0' : 'left-0'
                                }`}
                              >
                                {!isReactionLockedFlag && (
                                  <div className="flex items-center justify-between gap-0.5 px-1 py-1 border-b border-slate-800">
                                    {QUICK_REACTIONS.map((emoji) => (
                                      <button
                                        key={emoji}
                                        type="button"
                                        onClick={() => {
                                          void togglePrivateChatReaction(msg.id, emoji);
                                          setOpenMenuMsgId(null);
                                        }}
                                        className="w-7 h-7 rounded-lg hover:bg-slate-800 text-base flex items-center justify-center hover:scale-125 transition-transform"
                                      >
                                        {emoji}
                                      </button>
                                    ))}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEmojiPickerTarget({ scope: 'private', msgId: msg.id });
                                        setOpenMenuMsgId(null);
                                      }}
                                      className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-200 hover:text-white flex items-center justify-center transition-colors"
                                      title="Pilih semua emoji"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPrivateReplyTarget(msg);
                                    setPrivateEditTarget(null);
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Reply className="w-3.5 h-3.5" /> Balas Pesan
                                </button>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPrivateEditTarget(msg);
                                      setPrivateReplyTarget(null);
                                      setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: msg.text }));
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" /> Edit Pesan
                                  </button>
                                )}
                                {activeTarget.type === 'group' && canViewGroupReceipts && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReadReceiptModalMsg(msg);
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-sky-300 hover:bg-sky-950/40 flex items-center gap-2"
                                  >
                                    <Eye className="w-3.5 h-3.5" /> Info Dibaca
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    void handleCopyText(msg.text);
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Salin Teks
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const r = toggleBookmarkChatMessage(msg.id);
                                    showToast(r.message, 'info');
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                                  {isBookmarked ? 'Hapus Bintang' : 'Tandai Bintang'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setForwardModalPayload({
                                      text: msg.text,
                                      meta: {
                                        originalSenderName: msg.senderName,
                                        sourceRoomLabel:
                                          activeTarget.type === 'group' && activeGroup
                                            ? `Grup ${activeGroup.name}`
                                            : 'Chat Privat',
                                      },
                                    });
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Forward className="w-3.5 h-3.5" /> Teruskan Pesan
                                </button>
                                {!isStrictOwner && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReportTarget({
                                        scope: 'private',
                                        messageId: msg.id,
                                        roomKey: activeRoomKey,
                                        reportedAccountId: msg.senderAccountId,
                                        reportedName: msg.senderName,
                                        messagePreview: msg.text || '(Lampiran)',
                                      });
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-300 hover:bg-amber-950/40 flex items-center gap-2"
                                  >
                                    <Flag className="w-3.5 h-3.5" /> Laporkan Pesan
                                  </button>
                                )}
                                {activeTarget.type === 'group' && activeGroup && isGroupAdmin && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const r = await togglePinPrivateChatMessage(activeGroup.id, msg.id);
                                      showToast(r.message, 'info');
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-indigo-300 hover:bg-indigo-950/40 flex items-center gap-2"
                                  >
                                    {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                    {msg.isPinned ? 'Lepas Sematan Grup' : 'Sematkan di Grup'}
                                  </button>
                                )}

                                {/* Deletion Section: STRICT SENDER-ONLY Hapus untuk Semua Orang */}
                                <div className="pt-1 mt-1 border-t border-slate-800 space-y-0.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const r = hideChatMessageForMe(msg.id);
                                      showToast(r.message, 'info');
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-400" /> Hapus untuk Saya Sendiri
                                  </button>
                                  {isStrictOwner && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const r = await deletePrivateChatMessage(msg.id);
                                        showToast(
                                          r.success ? 'Pesan dihapus permanen untuk semua orang.' : r.message,
                                          r.success ? 'info' : 'error'
                                        );
                                        setOpenMenuMsgId(null);
                                      }}
                                      className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-400 hover:bg-rose-950/50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" /> Hapus untuk Semua Orang
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={privateEndRef} />
                </div>

                {/* Typing Indicator */}
                {activeTypingUsers.length > 0 && (
                  <div className="shrink-0 px-4 py-1 text-[11px] font-semibold text-indigo-400 bg-[#0b0f19] border-t border-slate-800">
                    {activeTypingUsers.map((u) => u.accountName).join(', ')} sedang mengetik...
                  </div>
                )}

                {/* Private Composer */}
                <div className="shrink-0 p-3 border-t border-slate-800 bg-[#0b0f19] relative space-y-2">
                  <input
                    ref={privateImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => void handleImageFilePicked(e, 'private')}
                  />

                  {mentionCandidates.length > 0 && (
                    <div className="absolute bottom-full left-3 right-3 mb-1.5 rounded-2xl bg-slate-800 border border-slate-700 shadow-xl p-1.5 max-h-44 overflow-y-auto z-30">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Mention Anggota (@)</p>
                      {mentionCandidates.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => insertMention(acc.fullName)}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-100 hover:bg-indigo-950/40 flex items-center justify-between"
                        >
                          <span>@{acc.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{acc.accountNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {(privateReplyTarget || privateEditTarget) && (
                    <div className="px-3 py-2 rounded-xl bg-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-indigo-400">
                          {privateEditTarget ? 'Mengedit Pesan Anda' : `Membalas ${privateReplyTarget?.senderName}`}
                        </p>
                        <p className="text-slate-300 truncate">
                          {privateEditTarget ? privateEditTarget.text : privateReplyTarget?.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrivateReplyTarget(null);
                          setPrivateEditTarget(null);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {activeDmBlocked ? (
                    <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-800/60 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold text-rose-200">
                        Anda telah memblokir kontak ini. Buka blokir untuk melanjutkan obrolan.
                      </p>
                      {activeDmItem && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = toggleBlockChatAccount(activeDmItem.peerAccountId, activeDmItem.displayName);
                            showToast(r.message, 'info');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0"
                        >
                          Buka Blokir
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            disabled={isImageLockedFlag}
                            onClick={() => privateImageInputRef.current?.click()}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
                            title={isImageLockedFlag ? 'Kirim foto dinonaktifkan Admin' : 'Kirim Foto'}
                          >
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            disabled={isVoiceLockedFlag}
                            onClick={() => void handleToggleVoiceRecord('private')}
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40 ${
                              recordingScope === 'private'
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                            title={isVoiceLockedFlag ? 'Pesan suara dinonaktifkan Admin' : 'Rekam Pesan Suara'}
                          >
                            {recordingScope === 'private' ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                            <span>{recordingScope === 'private' ? `Stop (${recordingSeconds}d)` : 'Suara'}</span>
                          </button>
                          <select
                            value={disappearSec}
                            onChange={(e) => setDisappearSec(Number(e.target.value) as 0 | 60 | 3600 | 86400)}
                            className="px-2 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-[11px] font-bold text-slate-300"
                            title="Timer pesan sementara"
                          >
                            <option value={0}>Timer: Off</option>
                            <option value={60}>Hilang 1m</option>
                            <option value={3600}>Hilang 1j</option>
                            <option value={86400}>Hilang 24j</option>
                          </select>
                        </div>
                        <div className="hidden sm:flex items-center gap-1 overflow-x-auto">
                          {QUICK_REPLY_CHIPS.map((chip) => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => setActiveDraftText(activeDraftText ? `${activeDraftText} ${chip}` : chip)}
                              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 shrink-0"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleSendPrivate} className="flex items-end gap-2 min-w-0">
                        <textarea
                          ref={privateTextareaRef}
                          rows={1}
                          value={activeDraftText}
                          onChange={(e) => setActiveDraftText(e.target.value)}
                          onKeyDown={(e) => handleComposerKeyDown(e, 'private')}
                          placeholder={
                            privateEditTarget
                              ? 'Ubah isi pesan Anda...'
                              : activeTarget.type === 'group'
                                ? 'Tulis pesan ke grup (ketik @nama untuk mention)...'
                                : 'Tulis pesan privat...'
                          }
                          className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl border border-slate-700 bg-slate-800 text-sm text-white resize-none max-h-[128px] overflow-y-auto focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={!activeDraftText.trim()}
                          className="shrink-0 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Send className="w-4 h-4" />
                          <span>{privateEditTarget ? 'Simpan' : 'Kirim'}</span>
                        </button>
                      </form>

                      <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400 px-1">
                        <span>
                          {enterKeySends
                            ? 'Mode Enter: Enter kirim · Shift+Enter baris baru'
                            : 'Enter baris baru · Ctrl+Enter kirim pesan'}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const r = toggleEnterKeyPreference();
                            showToast(r.message, 'info');
                          }}
                          className="font-bold text-indigo-400 hover:underline shrink-0"
                        >
                          Tukar Tombol Enter
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        )
      )}

      {/* ==================== ALL PORTAL MODALS (ANTI-CLIPPING) ==================== */}
      <AddContactModal
        open={addContactModalState.open}
        onClose={() => setAddContactModalState({ open: false, prefill: null })}
        accounts={accounts}
        currentAccountId={currentAccount.id}
        initialPrefill={addContactModalState.prefill}
        onSubmit={handleAddContactSubmit}
      />

      <CreateGroupModal
        open={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        savedContacts={mySavedContacts}
        accounts={accounts}
        onOpenAddContactFirst={() => {
          setShowCreateGroupModal(false);
          setAddContactModalState({ open: true, prefill: null });
        }}
        onCreate={async (input) => {
          const res = await createPrivateChatGroup(input);
          showToast(res.message, res.success ? 'success' : 'error');
          if (res.success && res.group) {
            setShowCreateGroupModal(false);
            setMainTab('private');
            setActiveTarget({ type: 'group', id: res.group.id });
          }
        }}
      />

      <GroupInfoModal
        open={showGroupInfoModal}
        onClose={() => setShowGroupInfoModal(false)}
        group={activeGroup}
        currentAccount={currentAccount}
        accounts={accounts}
        savedContacts={mySavedContacts}
        isGroupMuted={Boolean(activeGroup && mutedGroupIdSet.has(activeGroup.id))}
        pinnedMessages={groupPinnedMessages}
        onToggleMuteGroup={() => {
          if (!activeGroup) return;
          const r = toggleMutePrivateGroup(activeGroup.id);
          showToast(r.message, 'info');
        }}
        onUpdateDetails={async (patch) => {
          if (!activeGroup) return;
          const r = await updatePrivateChatGroupDetails(activeGroup.id, patch);
          showToast(r.message, r.success ? 'success' : 'error');
        }}
        onAddMember={async (memberId) => {
          if (!activeGroup) return;
          const r = await addMemberToPrivateGroup(activeGroup.id, memberId);
          showToast(r.message, r.success ? 'success' : 'error');
        }}
        onRemoveMember={async (memberId) => {
          if (!activeGroup) return;
          const r = await removeMemberFromPrivateGroup(activeGroup.id, memberId);
          showToast(r.message, r.success ? 'success' : 'error');
        }}
        onQuickSaveMemberContact={(acc) => {
          setAddContactModalState({
            open: true,
            prefill: {
              userId: acc.userId16,
              accountNumber: acc.accountNumber,
              isQuickSave: true,
            },
          });
        }}
        onUnpinMessage={async (mid) => {
          if (!activeGroup) return;
          const r = await togglePinPrivateChatMessage(activeGroup.id, mid);
          showToast(r.message, 'info');
        }}
        onLeaveGroup={async () => {
          if (!activeGroup) return;
          const r = await leavePrivateChatGroup(activeGroup.id);
          showToast(r.message, r.success ? 'info' : 'error');
          if (r.success) {
            setShowGroupInfoModal(false);
            setActiveTarget(null);
          }
        }}
        onDeleteGroup={async () => {
          if (!activeGroup) return;
          const r = await deletePrivateChatGroup(activeGroup.id);
          showToast(r.message, r.success ? 'success' : 'error');
          if (r.success) {
            setShowGroupInfoModal(false);
            setActiveTarget(null);
          }
        }}
      />

      <ReadReceiptModal
        open={Boolean(readReceiptModalMsg)}
        onClose={() => setReadReceiptModalMsg(null)}
        message={readReceiptModalMsg}
        group={activeGroup}
        accounts={accounts}
      />

      <ForwardMessageModal
        open={Boolean(forwardModalPayload)}
        onClose={() => setForwardModalPayload(null)}
        sourceText={forwardModalPayload?.text || ''}
        forwardMeta={forwardModalPayload?.meta || null}
        savedContacts={mySavedContacts}
        groups={myGroups}
        onForwardToGlobal={async () => {
          if (!forwardModalPayload) return;
          const r = await sendGlobalChatMessage({
            text: forwardModalPayload.text,
            asAdmin: isAdminUser,
            forwardedFrom: forwardModalPayload.meta,
          });
          showToast(r.success ? 'Pesan diteruskan ke Chat Global!' : r.message, r.success ? 'success' : 'error');
        }}
        onForwardToDm={(contact) => {
          if (!forwardModalPayload) return;
          sendChatMessage({
            recipientAccountId: contact.targetAccountId,
            recipientAccount: contact.targetAccountNumber,
            recipientName: contact.customName || contact.registeredName,
            text: forwardModalPayload.text,
            forwardedFrom: forwardModalPayload.meta,
          });
          showToast(`Pesan diteruskan ke ${contact.customName || contact.registeredName}.`, 'success');
        }}
        onForwardToGroup={(grp) => {
          if (!forwardModalPayload) return;
          sendChatMessage({
            groupId: grp.id,
            recipientAccount: `group:${grp.id}`,
            recipientName: grp.name,
            text: forwardModalPayload.text,
            forwardedFrom: forwardModalPayload.meta,
          });
          showToast(`Pesan diteruskan ke grup "${grp.name}".`, 'success');
        }}
      />

      <CreatePollModal
        open={pollModalScope !== null}
        onClose={() => setPollModalScope(null)}
        title={pollModalScope === 'global' ? 'Buat Polling Resmi Admin (Chat Global)' : 'Buat Polling Grup Privat'}
        onCreatePoll={(poll) => {
          if (pollModalScope === 'global') {
            void sendGlobalChatMessage({
              text: `Polling Resmi: ${poll.question}`,
              asAdmin: isAdminUser,
              isAdminHighlight: true,
              poll,
            }).then((r) => showToast(r.message, r.success ? 'success' : 'error'));
          } else if (pollModalScope === 'group' && activeGroup) {
            sendChatMessage({
              groupId: activeGroup.id,
              recipientAccount: `group:${activeGroup.id}`,
              recipientName: activeGroup.name,
              text: `Polling Grup: ${poll.question}`,
              poll,
            });
            showToast('Polling grup berhasil dikirim!', 'success');
          }
        }}
      />

      <AdminModerationModal
        open={adminModModalState.open}
        initialTab={adminModModalState.tab}
        prefillMuteTarget={adminModModalState.muteTarget}
        onClose={() => setAdminModModalState({ open: false })}
        globalChats={globalChats}
        globalChatConfig={globalChatConfig}
        connectedDevicesCount={connectedDevicesCount}
        accounts={accounts}
        moderationLogs={chatModerationLogs}
        onSendAnnouncement={async (input) => {
          const r = await sendGlobalChatMessage({
            text: input.text,
            asAdmin: true,
            showPopupOnAllPhones: input.showPopupOnAllPhones,
            isPinned: input.isPinned,
            isAdminHighlight: input.isAdminHighlight,
          });
          showToast(r.message, r.success ? 'success' : 'error');
        }}
        onOpenAdminPoll={() => setPollModalScope('global')}
        onToggleLock={async (locked, cooldownMs) => {
          const r = await toggleGlobalChatAdminLock(locked, cooldownMs);
          showToast(r.message, 'info');
        }}
        onUpdateConfig={async (partial, logDetail) => {
          const r = await adminUpdateGlobalChatConfig(partial, logDetail);
          showToast(r.message, 'success');
        }}
        onMuteUser={async (input) => {
          const r = await adminMuteGlobalChatUser(input);
          showToast(r.message, r.success ? 'success' : 'error');
        }}
        onUnmuteUser={async (accountId) => {
          const r = await adminUnmuteGlobalChatUser(accountId);
          showToast(r.message, r.success ? 'success' : 'error');
        }}
        onClearAllGlobal={async () => {
          await clearGlobalChatMessages();
          showToast('Seluruh pesan Chat Global berhasil dibersihkan.', 'info');
        }}
        onCopyRecap={handleCopyGlobalRecap}
        onDownloadRecap={handleDownloadGlobalRecap}
      />

      <AdminWarnModal
        open={Boolean(warnModalTarget)}
        onClose={() => setWarnModalTarget(null)}
        target={warnModalTarget}
        onSubmit={async (reason) => {
          if (!warnModalTarget) return;
          const r = await adminWarnUserFromChat(warnModalTarget.accountId, warnModalTarget.name, reason);
          showToast(r.message, r.success ? 'success' : 'error');
        }}
      />

      <EmojiReactionModal
        open={Boolean(emojiPickerTarget)}
        onClose={() => setEmojiPickerTarget(null)}
        onSelectEmoji={(emoji) => {
          if (!emojiPickerTarget) return;
          if (emojiPickerTarget.scope === 'global') {
            void toggleGlobalChatReaction(emojiPickerTarget.msgId, emoji);
          } else {
            void togglePrivateChatReaction(emojiPickerTarget.msgId, emoji);
          }
        }}
      />

      {/* NEW 10 PORTAL MODALS */}
      <MultiAssetTransferModal
        open={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        isRequestMode={isRequestAssetMode}
        currentAccount={currentAccount}
        accounts={accounts}
        isGroup={activeTarget?.type === 'group'}
        group={activeGroup}
        dmPeerName={activeDmItem?.displayName}
        onConfirm={handleAssetModalConfirm}
      />

      <CreateRedPacketModal
        open={redPacketModalScope !== null}
        onClose={() => setRedPacketModalScope(null)}
        scope={redPacketModalScope === 'group' ? 'group' : 'global'}
        groupName={activeGroup?.name}
        currentAccount={currentAccount}
        isOfficialAdmin={isAdminUser}
        onConfirm={(payload) => {
          const scopeToUse = redPacketModalScope === 'group' ? 'group' : 'global';
          setRedPacketModalScope(null);
          setPendingPinAction({
            kind: 'create_red_packet',
            scope: scopeToUse,
            groupId: scopeToUse === 'group' ? activeGroup?.id : undefined,
            assetKind: payload.assetKind,
            totalAmount: payload.totalAmount,
            quota: payload.quota,
            mode: payload.mode,
            note: payload.note,
            isOfficialAdmin: payload.isOfficialAdmin,
          });
        }}
      />

      <RedPacketDetailModal
        open={Boolean(redPacketDetailTarget)}
        onClose={() => setRedPacketDetailTarget(null)}
        redPacket={redPacketDetailTarget}
      />

      <CreateSplitBillModal
        open={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        group={activeGroup}
        currentAccountId={currentAccount.id}
        accounts={accounts}
        onCreate={async (payload) => {
          if (!activeGroup) return;
          const r = await createChatSplitBill({
            groupId: activeGroup.id,
            title: payload.title,
            assetKind: payload.assetKind,
            totalAmount: payload.totalAmount,
            participantAccountIds: payload.participantAccountIds,
          });
          showToast(r.message, r.success ? 'success' : 'error');
        }}
      />

      <SendContactCardModal
        open={showContactCardModal}
        onClose={() => setShowContactCardModal(false)}
        savedContacts={mySavedContacts}
        accounts={accounts}
        onSelectContact={(contact) => {
          if (!activeTarget) return;
          if (activeTarget.type === 'group' && activeGroup) {
            sendChatMessage({
              groupId: activeGroup.id,
              recipientAccount: `group:${activeGroup.id}`,
              recipientName: activeGroup.name,
              text: `Membagikan kontak ${contact.fullName}`,
              contactAttachment: contact,
              expiresAtMs: getExpiryTimestamp(),
            });
          } else if (activeDmItem) {
            sendChatMessage({
              recipientAccountId: activeDmItem.peerAccountId,
              recipientAccount: activeDmItem.peerAccountNumber,
              recipientName: activeDmItem.displayName,
              text: `Membagikan kontak ${contact.fullName}`,
              contactAttachment: contact,
              expiresAtMs: getExpiryTimestamp(),
            });
          }
          showToast('Kartu kontak nasabah berhasil dibagikan.', 'success');
        }}
      />

      <BillReminderModal
        open={showBillReminderModal}
        onClose={() => setShowBillReminderModal(false)}
        onSubmit={(reminder) => {
          if (!activeTarget) return;
          if (activeTarget.type === 'group' && activeGroup) {
            sendChatMessage({
              groupId: activeGroup.id,
              recipientAccount: `group:${activeGroup.id}`,
              recipientName: activeGroup.name,
              text: `Pengingat: ${reminder.title}`,
              billReminder: reminder,
              expiresAtMs: getExpiryTimestamp(),
            });
          } else if (activeDmItem) {
            sendChatMessage({
              recipientAccountId: activeDmItem.peerAccountId,
              recipientAccount: activeDmItem.peerAccountNumber,
              recipientName: activeDmItem.displayName,
              text: `Pengingat: ${reminder.title}`,
              billReminder: reminder,
              expiresAtMs: getExpiryTimestamp(),
            });
          }
          showToast('Pengingat tagihan berhasil dikirim.', 'success');
        }}
      />

      <ReportMessageModal
        open={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        targetName={reportTarget?.reportedName || ''}
        messagePreview={reportTarget?.messagePreview || ''}
        onSubmit={async (reason) => {
          if (!reportTarget) return;
          const r = await submitChatReport({
            scope: reportTarget.scope,
            messageId: reportTarget.messageId,
            roomKey: reportTarget.roomKey,
            reportedAccountId: reportTarget.reportedAccountId,
            reportedName: reportTarget.reportedName,
            messagePreview: reportTarget.messagePreview,
            reason,
          });
          showToast(r.message, r.success ? 'success' : 'error');
        }}
      />

      <ImageLightboxModal
        open={Boolean(lightboxImage)}
        onClose={() => setLightboxImage(null)}
        imageUrl={lightboxImage?.url || ''}
        fileName={lightboxImage?.fileName}
      />

      <ReactionVotersModal
        open={Boolean(reactionVotersTarget)}
        onClose={() => setReactionVotersTarget(null)}
        reactions={reactionVotersTarget || {}}
        accounts={accounts}
      />

      <AdminQuickAccountModal
        open={Boolean(adminQuickAcc)}
        onClose={() => setAdminQuickAcc(null)}
        account={adminQuickAcc}
        onSetBadge={(badge) => {
          if (!adminQuickAcc) return;
          const r = adminSetCustomerChatBadge(adminQuickAcc.id, badge);
          showToast(r.message, r.success ? 'success' : 'error');
          setAdminQuickAcc((prev) => (prev ? { ...prev, chatCustomBadge: badge } : null));
        }}
        onOpenMute={() => {
          if (!adminQuickAcc) return;
          setAdminModModalState({
            open: true,
            tab: 'moderation',
            muteTarget: {
              accountId: adminQuickAcc.id,
              name: adminQuickAcc.fullName,
              accountNumber: adminQuickAcc.accountNumber,
            },
          });
        }}
        onOpenWarn={() => {
          if (!adminQuickAcc) return;
          setWarnModalTarget({ accountId: adminQuickAcc.id, name: adminQuickAcc.fullName });
        }}
      />

      <PinPromptModal
        isOpen={Boolean(pendingPinAction)}
        targetAccountId={currentAccount.id}
        targetAccountName={currentAccount.fullName}
        expectedPin={currentAccount.pin}
        onCancel={() => setPendingPinAction(null)}
        onSuccess={(pin) => void handlePinVerifiedSuccess(pin || currentAccount.pin)}
        title={
          pendingPinAction?.kind === 'pay_request'
            ? 'Konfirmasi Bayar Permintaan Aset'
            : pendingPinAction?.kind === 'create_red_packet'
              ? 'Konfirmasi Buat Amplop Kaget'
              : pendingPinAction?.kind === 'pay_split_bill'
                ? 'Konfirmasi Bayar Patungan Grup'
                : 'Konfirmasi Kirim Aset'
        }
        description={
          pendingPinAction?.kind === 'pay_request'
            ? `Masukkan PIN kartu 6 digit untuk membayar ${formatModalAssetValue(pendingPinAction.amount, pendingPinAction.assetKind)} ke ${pendingPinAction.senderName}`
            : pendingPinAction?.kind === 'create_red_packet'
              ? `Masukkan PIN kartu 6 digit untuk membuat Amplop Kaget senilai ${formatModalAssetValue(pendingPinAction.totalAmount, pendingPinAction.assetKind)} (${pendingPinAction.quota} kuota)`
              : pendingPinAction?.kind === 'pay_split_bill'
                ? `Masukkan PIN kartu 6 digit untuk membayar patungan "${pendingPinAction.title}" sebesar ${formatModalAssetValue(pendingPinAction.amount, pendingPinAction.assetKind)}`
                : pendingPinAction?.kind === 'asset_send'
                  ? `Masukkan PIN kartu 6 digit untuk mengirim ${formatModalAssetValue(pendingPinAction.amount, pendingPinAction.assetKind)}`
                  : 'Masukkan PIN kartu 6 digit Anda'
        }
      />
    </div>
  );
};
