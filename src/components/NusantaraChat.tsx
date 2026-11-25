/**
 * Bank Nusantara — Chat Global & Priv (v15.40.49)
 * - Sinkronisasi lintas perangkat Anti-Timpa (Union-Merge + Penyimpanan Terpisah Per-ID Cloud & Server + Tombstone Registry)
 * - Modal Full-Body Portal anti-terpotong di HP & Laptop + grid min-w-0 anti-overflow
 * - Tombol "Simpan Nasabah" ala WhatsApp (Banner + Header DM + Info Grup) dengan prefill otomatis User ID & No. Rekening
 * - Buat Grup Privat ketat hanya dari nasabah tersimpan + Info Dibaca khusus grup + Edit 15 menit + Reaksi Emoji + Polling + Mention @ + Sedang Mengetik + Teruskan + Bintang + Suite Moderasi Admin Lengkap
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
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  BankAccount,
  ChatForwardInfo,
  ChatMessage,
  ChatPollData,
  GlobalChatMessage,
  PrivateChatContact,
  PrivateChatGroup,
} from '../types/bank';
import { formatRupiah } from '../utils/bankUtils';
import { PinPromptModal } from './PinPromptModal';
import {
  AddContactModal,
  AdminModerationModal,
  AdminWarnModal,
  CreateGroupModal,
  CreatePollModal,
  ForwardMessageModal,
  GroupInfoModal,
  PortalModalShell,
  ReadReceiptModal,
  formatChatDateTime,
  formatChatTimeShort,
  getChatGroupColorClass,
  renderChatGroupIcon,
} from './ChatPortalModals';

type MainChatTab = 'global' | 'private';
type PrivateFilter = 'all' | 'dm' | 'group';

interface ActivePrivateTarget {
  type: 'dm' | 'group';
  id: string;
  accountNumber?: string;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '🙏', '🔥'];
const EDIT_WINDOW_MS = 15 * 60 * 1000;

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
    deleteGlobalChatMessage,
    clearGlobalChatMessages,
    chats,
    sendChatMessage,
    transferMoney,
    privateChatGroups,
    chatLastReadMap,
    markChatRoomRead,
    globalChatUnreadCount,
    privateChatUnreadCount,
    addPrivateChatContact,
    removePrivateChatContact,
    markChatRequestPaid,
    editPrivateChatMessage,
    deletePrivateChatMessage,
    togglePrivateChatReaction,
    votePrivateChatPoll,
    togglePinPrivateChatMessage,
    markPrivateMessagesRead,
    toggleBookmarkChatMessage,
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

  // Auto-draft per room key (disimpan selama sesi)
  const [draftByRoom, setDraftByRoom] = useState<Record<string, string>>({});

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

  // Popover `···` state (only 1 open at a time)
  const [openMenuMsgId, setOpenMenuMsgId] = useState<string | null>(null);
  const [showEditedTipId, setShowEditedTipId] = useState<string | null>(null);

  // Mention `@` autocomplete state
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);

  // Modals (all rendered via Portal in ChatPortalModals.tsx)
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

  // Money Transfer / Request Money Modal (Portal)
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [isRequestMoneyMode, setIsRequestMoneyMode] = useState(false);
  const [moneyAmountInput, setMoneyAmountInput] = useState('');
  const [moneyNoteInput, setMoneyNoteInput] = useState('');
  const [moneyGroupTargetAccountId, setMoneyGroupTargetAccountId] = useState('');
  const [pendingPayRequestMsg, setPendingPayRequestMsg] = useState<ChatMessage | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState(false);

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
      if (m.deleted || m.groupId) continue;
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
          ? `${m.transferAttachment.isRequest ? 'Minta Uang' : 'Kirim Uang'} ${formatRupiah(m.transferAttachment.amount)}`
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

    return Array.from(byPeerKey.values()).sort((a, b) => b.lastMessageMs - a.lastMessageMs);
  }, [mySavedContacts, accounts, chats, currentAccount, chatLastReadMap]);

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

  // Global Chat chronological list + pinned + filters
  const globalPinnedMessages = useMemo(
    () =>
      globalChats
        .filter((m) => m.isPinned)
        .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0)),
    [globalChats]
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
        if (globalBookmarkedOnly && !bookmarkedIdSet.has(m.id)) return false;
        if (!q) return true;
        return (
          m.text.toLowerCase().includes(q) ||
          m.senderName.toLowerCase().includes(q) ||
          (m.senderAccount || '').includes(q)
        );
      });
  }, [globalChats, globalSearchQuery, globalBookmarkedOnly, bookmarkedIdSet]);

  const groupPinnedMessages = useMemo(() => {
    if (!activeGroup) return [];
    const pinSet = new Set(activeGroup.pinnedMessageIds || []);
    return activePrivateMessages.filter((m) => m.isPinned || pinSet.has(m.id));
  }, [activeGroup, activePrivateMessages]);

  const visiblePrivateMessages = useMemo(() => {
    const q = privateRoomSearchQuery.trim().toLowerCase();
    return activePrivateMessages.filter((m) => {
      if (privateBookmarkedOnly && !bookmarkedIdSet.has(m.id)) return false;
      if (!q) return true;
      return (
        m.text.toLowerCase().includes(q) ||
        m.senderName.toLowerCase().includes(q) ||
        (m.poll?.question || '').toLowerCase().includes(q)
      );
    });
  }, [activePrivateMessages, privateRoomSearchQuery, privateBookmarkedOnly, bookmarkedIdSet]);

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

  const handleSendGlobal = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = activeDraftText.trim();
    if (!text || globalSending) return;

    if (globalEditTarget) {
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
    const text = activeDraftText.trim();
    if (!text) return;

    if (privateEditTarget) {
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
      sendChatMessage({
        groupId: activeGroup.id,
        recipientAccount: `group:${activeGroup.id}`,
        recipientName: activeGroup.name,
        text,
        replyToId: privateReplyTarget?.id,
        replyToSender: privateReplyTarget?.senderName,
        replyToPreview: privateReplyTarget?.text?.slice(0, 90),
        mentions: mentions.length ? mentions : undefined,
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
      });
    }
    setDraftByRoom((prev) => ({ ...prev, [activeRoomKey]: '' }));
    setPrivateReplyTarget(null);
    setMentionQuery(null);
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
        // Confirmed behavior: manual Tambah Nasabah closes modal and returns to Daftar Kontak Chat Privat first!
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

  const canEditWithinWindow = (createdAtMs?: number, timestamp?: string, isOwnerAdmin = false) => {
    if (isOwnerAdmin) return true;
    const ms = createdAtMs || Date.parse(timestamp || '') || 0;
    return Date.now() - ms <= EDIT_WINDOW_MS;
  };

  // Money modal helpers
  const openMoneyDialog = (requestMode: boolean) => {
    setIsRequestMoneyMode(requestMode);
    setMoneyAmountInput('');
    setMoneyNoteInput('');
    if (activeTarget?.type === 'group' && activeGroup && currentAccount) {
      const other = activeGroup.memberAccountIds.find((id) => id !== currentAccount.id) || '';
      setMoneyGroupTargetAccountId(other);
    } else {
      setMoneyGroupTargetAccountId('');
    }
    setPendingPayRequestMsg(null);
    setShowMoneyModal(true);
  };

  const handleMoneyModalConfirm = () => {
    const amount = Number(moneyAmountInput.replace(/\D/g, '')) || 0;
    if (amount < 1000) {
      showToast('Nominal minimal Rp 1.000.', 'error');
      return;
    }
    if (isRequestMoneyMode) {
      const reqRef = `REQ-${Date.now()}`;
      if (activeTarget?.type === 'group' && activeGroup) {
        sendChatMessage({
          groupId: activeGroup.id,
          recipientAccount: `group:${activeGroup.id}`,
          recipientName: activeGroup.name,
          text: moneyNoteInput.trim() || `Meminta transfer ${formatRupiah(amount)}`,
          transferAttachment: {
            isRequest: true,
            amount,
            referenceNo: reqRef,
            note: moneyNoteInput.trim() || undefined,
            status: 'pending',
          },
        });
      } else if (activeDmItem) {
        sendChatMessage({
          recipientAccountId: activeDmItem.peerAccountId,
          recipientAccount: activeDmItem.peerAccountNumber,
          recipientName: activeDmItem.displayName,
          text: moneyNoteInput.trim() || `Meminta transfer ${formatRupiah(amount)}`,
          transferAttachment: {
            isRequest: true,
            amount,
            referenceNo: reqRef,
            note: moneyNoteInput.trim() || undefined,
            status: 'pending',
          },
        });
      }
      setShowMoneyModal(false);
      showToast('Permintaan uang dikirim ke ruang chat.', 'success');
      return;
    }
    // Send money requires PIN
    setShowMoneyModal(false);
    setShowPinPrompt(true);
  };

  const executeVerifiedMoneyTransfer = async (pin: string) => {
    if (!currentAccount) return;
    if (pendingPayRequestMsg && pendingPayRequestMsg.transferAttachment) {
      const targetNo = pendingPayRequestMsg.senderAccount;
      const amount = pendingPayRequestMsg.transferAttachment.amount;
      const res = transferMoney({
        recipientAccount: targetNo,
        recipientBank: 'Bank Nusantara',
        amount,
        note: `Bayar permintaan chat: ${pendingPayRequestMsg.transferAttachment.note || 'Transfer Chat'}`,
        pin,
      });
      setShowPinPrompt(false);
      if (res.success) {
        await markChatRequestPaid(pendingPayRequestMsg.id, currentAccount.fullName);
        showToast(`Permintaan ${formatRupiah(amount)} berhasil dibayar!`, 'success');
      } else {
        showToast(res.message, 'error');
      }
      setPendingPayRequestMsg(null);
      return;
    }

    const amount = Number(moneyAmountInput.replace(/\D/g, '')) || 0;
    let targetAcc: BankAccount | undefined;
    if (activeTarget?.type === 'group') {
      targetAcc = accounts.find((a) => a.id === moneyGroupTargetAccountId);
    } else if (activeDmItem) {
      targetAcc = accounts.find(
        (a) => a.id === activeDmItem.peerAccountId || a.accountNumber === activeDmItem.peerAccountNumber
      );
    }
    if (!targetAcc) {
      setShowPinPrompt(false);
      showToast('Rekening tujuan tidak ditemukan.', 'error');
      return;
    }
    const res = transferMoney({
      recipientAccount: targetAcc.accountNumber,
      recipientBank: 'Bank Nusantara',
      amount,
      note: moneyNoteInput.trim() || 'Transfer via Chat Privat Bank Nusantara',
      pin,
    });
    setShowPinPrompt(false);
    if (res.success) {
      const refNo = res.transaction?.referenceNo || `TRF-${Date.now()}`;
      if (activeTarget?.type === 'group' && activeGroup) {
        sendChatMessage({
          groupId: activeGroup.id,
          recipientAccount: `group:${activeGroup.id}`,
          recipientName: activeGroup.name,
          text: moneyNoteInput.trim() || `Kirim uang ke ${targetAcc.fullName}`,
          transferAttachment: {
            isRequest: false,
            amount,
            referenceNo: refNo,
            note: moneyNoteInput.trim() || undefined,
            status: 'paid',
            targetAccountNumber: targetAcc.accountNumber,
            targetName: targetAcc.fullName,
            paidByAccountId: currentAccount.id,
            paidByName: currentAccount.fullName,
            paidAt: new Date().toISOString(),
          },
        });
      } else if (activeDmItem) {
        sendChatMessage({
          recipientAccountId: activeDmItem.peerAccountId,
          recipientAccount: activeDmItem.peerAccountNumber,
          recipientName: activeDmItem.displayName,
          text: moneyNoteInput.trim() || `Kirim uang ${formatRupiah(amount)}`,
          transferAttachment: {
            isRequest: false,
            amount,
            referenceNo: refNo,
            note: moneyNoteInput.trim() || undefined,
            status: 'paid',
            targetAccountNumber: targetAcc.accountNumber,
            targetName: targetAcc.fullName,
            paidByAccountId: currentAccount.id,
            paidByName: currentAccount.fullName,
            paidAt: new Date().toISOString(),
          },
        });
      }
      showToast(`Transfer ${formatRupiah(amount)} ke ${targetAcc.fullName} berhasil!`, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Render interactive Poll card
  const renderPollCard = (poll: ChatPollData, onVote: (optId: string) => void) => {
    const votesMap = poll.votesByAccountId || {};
    const allVotes = Object.values(votesMap).flat();
    const totalVotes = allVotes.length;
    const myVotes = currentAccount ? votesMap[currentAccount.id] || [] : [];
    return (
      <div className="mt-2 p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-extrabold">
          <BarChart2 className="w-3.5 h-3.5 text-violet-500 shrink-0" />
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
                onClick={() => onVote(opt.id)}
                className={`w-full relative overflow-hidden rounded-xl border px-3 py-2 text-left text-xs transition-all ${
                  voted
                    ? 'border-violet-500 bg-violet-500/15 font-bold'
                    : 'border-slate-300/60 dark:border-slate-600/60 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <div
                  className="absolute inset-y-0 left-0 bg-violet-500/20 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="truncate flex items-center gap-1.5">
                    {voted && <Check className="w-3.5 h-3.5 text-violet-600 dark:text-violet-300 shrink-0" />}
                    {opt.text}
                  </span>
                  <span className="shrink-0 font-bold text-[11px] opacity-80">
                    {votes} ({pct}%)
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-[10px] opacity-70">
          Total {totalVotes} suara {poll.allowMultiple ? '• Multi-pilihan' : '• 1 pilihan'}
        </p>
      </div>
    );
  };

  // Filter sidebar items
  const filteredDmItems = useMemo(() => {
    const q = sidebarSearchQuery.trim().toLowerCase();
    return dmSidebarItems.filter(
      (item) =>
        !q ||
        item.displayName.toLowerCase().includes(q) ||
        item.registeredName.toLowerCase().includes(q) ||
        item.peerAccountNumber.includes(q)
    );
  }, [dmSidebarItems, sidebarSearchQuery]);

  const filteredGroups = useMemo(() => {
    const q = sidebarSearchQuery.trim().toLowerCase();
    return myGroups.filter((g) => !q || g.name.toLowerCase().includes(q));
  }, [myGroups, sidebarSearchQuery]);

  if (!currentAccount) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Silakan masuk ke rekening Bank Nusantara terlebih dahulu untuk menggunakan Chat Global & Priv.
        </p>
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
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : toastBanner.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                : 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-800 text-sky-800 dark:text-sky-200'
          }`}
        >
          <span className="min-w-0 break-words">{toastBanner.text}</span>
          <button type="button" onClick={() => setToastBanner(null)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TOP WORKSPACE HEADER (Segmented Tabs + Subtle Segarkan Chat Button) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-sm shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white tracking-tight truncate">
                  Chat Global & Priv
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 px-2 py-0.5 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {connectedDevicesCount} Aktif
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Sinkronisasi lintas perangkat aman • Ruang Global, 1-on-1 & Grup Privat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Subtle Segarkan Chat Button */}
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={refreshingChat}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1.5 transition-colors"
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
        <div className="mt-3 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90">
          <button
            type="button"
            onClick={() => setMainTab('global')}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all ${
              mainTab === 'global'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Chat Global</span>
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
                ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Chat Privat</span>
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
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-[calc(100dvh-230px)] min-h-[520px] max-h-[780px] min-w-0 overflow-hidden">
          {/* Global Room Top Bar */}
          <div className="shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/95 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  Ruang Chat Global Bank Nusantara
                </span>
                {globalChatConfig.adminOnlyLock && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    KHUSUS ADMIN
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGlobalSearchOpen((v) => !v)}
                  className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                    globalSearchOpen
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
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
                      : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300/70'
                  }`}
                  title="Filter pesan berbintang (Bookmark)"
                >
                  <Star className="w-4 h-4" />
                </button>
                {isAdminUser && (
                  <button
                    type="button"
                    onClick={() => setPollModalScope('global')}
                    className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 hover:bg-violet-200"
                    title="Buat Polling Resmi Admin"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Admin Quick Slow-Mode & Lock Bar */}
            {isAdminUser && (
              <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/70 dark:border-slate-800">
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
                          : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300'
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
                        ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-400/60'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
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
                  className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
                {globalSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Multi-Pin Announcements Banner */}
          {globalPinnedMessages.length > 0 && (
            <div className="shrink-0 bg-amber-50/95 dark:bg-amber-950/35 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-800 dark:text-amber-300">
                    <Pin className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Pesan Disematkan {globalPinnedMessages.length > 1 ? `(${globalPinnedMessages.length})` : ''} •{' '}
                      {globalPinnedMessages[0].senderName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 dark:text-amber-100/90 line-clamp-2 mt-0.5">
                    {globalPinnedMessages[0].text}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {globalPinnedMessages.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setGlobalPinnedExpanded((v) => !v)}
                      className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/50"
                    >
                      {globalPinnedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  {isAdminUser && (
                    <button
                      type="button"
                      onClick={() => void togglePinGlobalChatMessage(globalPinnedMessages[0].id)}
                      className="p-1.5 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-200/60"
                      title="Lepas sematan"
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              {globalPinnedExpanded && globalPinnedMessages.length > 1 && (
                <div className="mt-2 pt-2 border-t border-amber-200/70 dark:border-amber-800/50 space-y-1.5 max-h-36 overflow-y-auto">
                  {globalPinnedMessages.slice(1).map((pm) => (
                    <div key={pm.id} className="flex items-start justify-between gap-2 text-xs">
                      <p className="text-slate-700 dark:text-amber-100/80 min-w-0">
                        <strong className="text-amber-900 dark:text-amber-300">{pm.senderName}:</strong> {pm.text}
                      </p>
                      {isAdminUser && (
                        <button
                          type="button"
                          onClick={() => void togglePinGlobalChatMessage(pm.id)}
                          className="shrink-0 text-amber-700 hover:text-amber-950"
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

          {/* Global Messages Feed */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {visibleGlobalMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400">
                <Globe className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
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
                const isMine =
                  (msg.senderAccountId && msg.senderAccountId === currentAccount.id) ||
                  (msg.senderAccount && msg.senderAccount === currentAccount.accountNumber);
                const isMsgAdmin = msg.senderRole === 'admin' || msg.senderCardTier === 'admin';
                const isBookmarked = bookmarkedIdSet.has(msg.id);
                const canEdit =
                  (isMine || (isAdminUser && isMsgAdmin)) &&
                  canEditWithinWindow(msg.createdAtMs, msg.timestamp, isAdminUser);
                const reactionEntries = Object.entries(msg.reactions || {}).filter(
                  ([, ids]) => Array.isArray(ids) && ids.length > 0
                );

                // Amber-Gold elegant bubble for Admin messages
                const bubbleClasses = isMsgAdmin
                  ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/90 dark:from-amber-950/80 dark:via-amber-900/50 dark:to-yellow-950/70 border border-amber-400/80 dark:border-amber-500/60 text-slate-900 dark:text-amber-50 shadow-sm'
                  : isMine
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-sm';

                return (
                  <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                    <div className="relative max-w-[88%] sm:max-w-[76%] min-w-0">
                      <div className={`rounded-2xl px-3.5 py-2.5 ${bubbleClasses}`}>
                        {/* Sender header */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                            <span
                              className={`text-xs font-extrabold truncate ${
                                isMsgAdmin
                                  ? 'text-amber-900 dark:text-amber-300'
                                  : isMine
                                    ? 'text-emerald-50'
                                    : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {msg.senderName}
                            </span>
                            {isMsgAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.45)]">
                                <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
                              </span>
                            )}
                            {msg.isAdminHighlight && isMsgAdmin && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-700 dark:text-amber-300">
                                <Flame className="w-3 h-3" /> Sorotan
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
                              isMine && !isMsgAdmin
                                ? 'text-emerald-100 hover:bg-emerald-700/60'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10'
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
                              isMine && !isMsgAdmin
                                ? 'bg-emerald-700/50 border-emerald-200 text-emerald-50'
                                : 'bg-black/5 dark:bg-white/5 border-amber-500 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            <p className="font-bold truncate">{msg.replyToSender}</p>
                            <p className="truncate opacity-85">{msg.replyToPreview}</p>
                          </div>
                        )}

                        {/* Body Text */}
                        {msg.text && (
                          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                        )}

                        {/* Official Poll */}
                        {msg.poll && renderPollCard(msg.poll, (optId) => void voteGlobalChatPoll(msg.id, optId))}

                        {/* Footer: Time + Diedit */}
                        <div
                          className={`mt-1.5 flex items-center justify-end gap-2 text-[10px] ${
                            isMine && !isMsgAdmin
                              ? 'text-emerald-100/90'
                              : isMsgAdmin
                                ? 'text-amber-800/80 dark:text-amber-300/80'
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
                        <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                          {reactionEntries.map(([emoji, voterIds]) => {
                            const iReacted = voterIds.includes(currentAccount.id);
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => void toggleGlobalChatReaction(msg.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-xs border transition-all inline-flex items-center gap-1 ${
                                  iReacted
                                    ? 'bg-emerald-100 dark:bg-emerald-950/70 border-emerald-400 text-emerald-900 dark:text-emerald-200 font-bold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="text-[10px]">{voterIds.length}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Popover Menu `···` */}
                      {openMenuMsgId === msg.id && (
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className={`absolute z-40 mt-1 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 space-y-1 ${
                            isMine ? 'right-0' : 'left-0'
                          }`}
                        >
                          {/* Quick Emoji Bar */}
                          <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-100 dark:border-slate-800">
                            {QUICK_REACTIONS.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => {
                                  void toggleGlobalChatReaction(msg.id, emoji);
                                  setOpenMenuMsgId(null);
                                }}
                                className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-base flex items-center justify-center transition-transform hover:scale-125"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setGlobalReplyTarget(msg);
                              setGlobalEditTarget(null);
                              setOpenMenuMsgId(null);
                            }}
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                            className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Forward className="w-3.5 h-3.5" /> Teruskan Pesan
                          </button>

                          {/* Admin Moderation Actions on Bubble */}
                          {isAdminUser && (
                            <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  const r = await togglePinGlobalChatMessage(msg.id);
                                  showToast(r.message, 'info');
                                  setOpenMenuMsgId(null);
                                }}
                                className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
                              >
                                {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                {msg.isPinned ? 'Lepas Sematan' : 'Sematkan Pesan'}
                              </button>
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
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
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
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
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
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus Semua Pesan User Ini
                                  </button>
                                </>
                              )}
                            </div>
                          )}

                          {(isMine || isAdminUser) && (
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteGlobalChatMessage(msg.id);
                                showToast('Pesan dihapus permanen.', 'info');
                                setOpenMenuMsgId(null);
                              }}
                              className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Hapus Pesan
                            </button>
                          )}
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
            <div className="shrink-0 px-4 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              {activeTypingUsers.map((u) => u.accountName).join(', ')} sedang mengetik...
            </div>
          )}

          {/* Global Composer */}
          <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
            {/* Mention Autocomplete Dropdown */}
            {mentionCandidates.length > 0 && (
              <div className="absolute bottom-full left-3 right-3 mb-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 max-h-44 overflow-y-auto z-30">
                <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Mention Nasabah (@)</p>
                {mentionCandidates.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => insertMention(acc.fullName)}
                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 flex items-center justify-between"
                  >
                    <span>@{acc.fullName}</span>
                    <span className="text-[10px] font-mono text-slate-400">{acc.accountNumber}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Reply / Edit Banner */}
            {(globalReplyTarget || globalEditTarget) && (
              <div className="mb-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">
                    {globalEditTarget ? 'Mengedit Pesan Anda' : `Membalas ${globalReplyTarget?.senderName}`}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 truncate">
                    {globalEditTarget ? globalEditTarget.text : globalReplyTarget?.text}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGlobalReplyTarget(null);
                    setGlobalEditTarget(null);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleSendGlobal} className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                value={activeDraftText}
                onChange={(e) => setActiveDraftText(e.target.value)}
                disabled={!isAdminUser && globalChatConfig.adminOnlyLock}
                placeholder={
                  !isAdminUser && globalChatConfig.adminOnlyLock
                    ? 'Chat Global sedang dikunci Khusus Admin...'
                    : globalEditTarget
                      ? 'Ubah isi pesan Anda...'
                      : 'Tulis pesan di Chat Global (ketik @nama untuk mention)...'
                }
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
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
                <span className="hidden sm:inline">
                  {globalEditTarget ? 'Simpan' : globalCooldownLeft > 0 ? `${globalCooldownLeft}d` : 'Kirim'}
                </span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: CHAT PRIVAT (1-ON-1 & GRUP PRIVAT) ==================== */}
      {mainTab === 'private' && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 md:grid-cols-[330px_minmax(0,1fr)] h-[calc(100dvh-230px)] min-h-[520px] max-h-[780px] min-w-0 overflow-hidden">
          {/* LEFT SIDEBAR: Daftar Kontak & Grup (hidden on mobile when room open) */}
          <div
            className={`${
              activeTarget ? 'hidden md:flex' : 'flex'
            } flex-col min-w-0 min-h-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/95`}
          >
            {/* Sidebar Actions */}
            <div className="shrink-0 p-3 space-y-2.5 border-b border-slate-200 dark:border-slate-800">
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
                  onClick={() => setShowCreateGroupModal(true)}
                  className="py-2.5 px-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
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
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
                {[
                  { id: 'all' as const, label: 'Semua' },
                  { id: 'dm' as const, label: '1-on-1' },
                  { id: 'group' as const, label: 'Grup' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPrivateFilter(f.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      privateFilter === f.id
                        ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400'
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
              {(privateFilter === 'all' || privateFilter === 'group') &&
                filteredGroups.map((grp) => {
                  const isSelected = activeTarget?.type === 'group' && activeTarget.id === grp.id;
                  const lastRead = chatLastReadMap[`group:${grp.id}`] || 0;
                  const groupMsgs = chats.filter((m) => !m.deleted && m.groupId === grp.id);
                  const lastMsg = groupMsgs[groupMsgs.length - 1];
                  const unread = groupMsgs.filter((m) => {
                    const isMine =
                      m.senderAccountId === currentAccount.id || m.senderAccount === currentAccount.accountNumber;
                    return !isMine && (m.createdAtMs || Date.parse(m.timestamp || '')) > lastRead;
                  }).length;
                  const isMuted = mutedGroupIdSet.has(grp.id);

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
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-700'
                          : 'bg-white dark:bg-slate-900/70 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${getChatGroupColorClass(grp.accentColor)}`}>
                        {renderChatGroupIcon(grp.iconKey, 'w-5 h-5')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1">
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
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {lastMsg
                              ? `${lastMsg.senderName}: ${lastMsg.text || 'Polling'}`
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
              {(privateFilter === 'all' || privateFilter === 'dm') &&
                filteredDmItems.map((dm) => {
                  const isSelected = activeTarget?.type === 'dm' && activeTarget.id === dm.peerAccountId;
                  const presence = getPresenceStatusLabel(dm.peerAccountId);

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
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
                          : 'bg-white dark:bg-slate-900/70 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-extrabold text-sm ${
                            dm.isAdminPeer
                              ? 'bg-gradient-to-br from-amber-500 to-yellow-500 text-slate-950'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          {dm.displayName.charAt(0).toUpperCase()}
                        </div>
                        {presence.online && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                            {dm.isSaved ? dm.displayName : dm.peerAccountNumber}
                          </span>
                          {dm.lastMessageTime && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatChatTimeShort(dm.lastMessageTime)}
                            </span>
                          )}
                        </div>
                        {/* Unsaved sender label + registered name + ADMIN RESMI */}
                        <div className="flex items-center gap-1 flex-wrap mt-0.5">
                          {dm.isAdminPeer && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-800 dark:text-amber-300">
                              <ShieldCheck className="w-2.5 h-2.5" /> ADMIN RESMI
                            </span>
                          )}
                          {!dm.isSaved && (
                            <>
                              <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[110px]">
                                {dm.registeredName}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700">
                                Belum Disimpan
                              </span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
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

              {filteredDmItems.length === 0 && filteredGroups.length === 0 && (
                <div className="text-center py-10 px-4 space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    Belum ada kontak atau grup privat
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tekan <strong>Tambah Nasabah</strong> dengan User ID atau No. Rekening untuk mulai chat privat atau membuat grup.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANE: Active Private Conversation Room (DM or Group) */}
          <div
            className={`${
              activeTarget ? 'flex' : 'hidden md:flex'
            } flex-col min-w-0 min-h-0 bg-white dark:bg-slate-900 overflow-hidden`}
          >
            {!activeTarget ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
                <div className="w-14 h-14 rounded-3xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-slate-900 dark:text-white">
                    Pilih Kontak atau Grup Privat
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
                    Semua percakapan 1-on-1 & Grup Privat bersifat tertutup antar peserta, mendukung Kirim/Minta Uang, Info Dibaca, Edit Pesan, Polling & Reaksi Emoji.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="shrink-0 px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 space-y-2">
                  <div className="flex items-center justify-between gap-2 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setActiveTarget(null)}
                        className="md:hidden p-2 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0"
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
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
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
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {activeTarget.type === 'group' && activeGroup
                            ? `${activeGroup.memberAccountIds.length} anggota • ${activeGroupOnlineCount} online`
                            : getPresenceStatusLabel(activeDmItem?.peerAccountId).label}
                        </p>
                      </div>
                    </div>

                    {/* Header Right Action Buttons */}
                    <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                      {/* Quick Simpan Nasabah button in Header for Unsaved DM */}
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
                          <span className="hidden sm:inline">Simpan Nasabah</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openMoneyDialog(false)}
                        className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200"
                        title="Kirim Uang"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openMoneyDialog(true)}
                        className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-200"
                        title="Minta Uang"
                      >
                        <HandCoins className="w-4 h-4" />
                      </button>
                      {activeTarget.type === 'group' && (
                        <button
                          type="button"
                          onClick={() => setPollModalScope('group')}
                          className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 hover:bg-violet-200"
                          title="Buat Polling Grup"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setPrivateRoomSearchOpen((v) => !v)}
                        className={`p-2 rounded-xl ${
                          privateRoomSearchOpen
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
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
                            : 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                        title="Filter pesan berbintang"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      {activeTarget.type === 'group' && (
                        <button
                          type="button"
                          onClick={() => setShowGroupInfoModal(true)}
                          className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200"
                          title="Info & Pengaturan Grup"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      )}
                      {activeTarget.type === 'dm' && activeDmItem?.isSaved && (
                        <button
                          type="button"
                          onClick={() => {
                            const r = removePrivateChatContact(activeDmItem.peerAccountId);
                            showToast(r.message, 'info');
                          }}
                          className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-200"
                          title="Hapus dari daftar kontak tersimpan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* In-room Search Bar */}
                  {privateRoomSearchOpen && (
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={privateRoomSearchQuery}
                        onChange={(e) => setPrivateRoomSearchQuery(e.target.value)}
                        placeholder="Cari pesan di percakapan ini..."
                        className="w-full pl-9 pr-8 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
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
                    <div className="shrink-0 px-4 py-3 bg-emerald-50/95 dark:bg-emerald-950/45 border-b border-emerald-200 dark:border-emerald-800/70 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 flex-wrap">
                          <span>Pengirim ini belum tersimpan di kontak Anda</span>
                          {activeDmItem.isAdminPeer && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                              ADMIN RESMI
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                          {activeDmItem.registeredName} • Rek {activeDmItem.peerAccountNumber}. Simpan agar mudah ditemukan & bisa dipilih saat Buat Grup Baru.
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
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-900 dark:text-emerald-200 bg-emerald-200/70 dark:bg-emerald-900/60 hover:bg-emerald-200"
                        >
                          Tutup
                        </button>
                      </div>
                    </div>
                  )}

                {/* Group Pinned Messages Strip */}
                {activeTarget.type === 'group' && groupPinnedMessages.length > 0 && (
                  <div className="shrink-0 bg-indigo-50/90 dark:bg-indigo-950/35 border-b border-indigo-200 dark:border-indigo-800/60 px-4 py-2 flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-extrabold text-indigo-800 dark:text-indigo-300 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> Disematkan ({groupPinnedMessages.length}) •{' '}
                        {groupPinnedMessages[groupPinnedMessages.length - 1].senderName}
                      </p>
                      <p className="text-xs text-slate-700 dark:text-indigo-100/90 truncate">
                        {groupPinnedMessages[groupPinnedMessages.length - 1].text}
                      </p>
                      {groupPinnedExpanded && groupPinnedMessages.length > 1 && (
                        <div className="mt-1.5 pt-1.5 border-t border-indigo-200/60 space-y-1">
                          {groupPinnedMessages.slice(0, -1).map((pm) => (
                            <p key={pm.id} className="text-[11px] text-slate-600 dark:text-indigo-200/80 truncate">
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
                        className="p-1 rounded-lg text-indigo-700 dark:text-indigo-300"
                      >
                        {groupPinnedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                )}

                {/* Private Messages List */}
                <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-4 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
                  {visiblePrivateMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400">
                      <Lock className="w-9 h-9 mb-2 opacity-40" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        {privateBookmarkedOnly
                          ? 'Belum ada pesan berbintang di ruang ini'
                          : 'Belum ada percakapan di sini'}
                      </p>
                      <p className="text-xs mt-1">Kirim pesan pertama atau lampirkan Kirim/Minta Uang.</p>
                    </div>
                  ) : (
                    visiblePrivateMessages.map((msg) => {
                      const isMine =
                        (msg.senderAccountId && msg.senderAccountId === currentAccount.id) ||
                        msg.senderAccount === currentAccount.accountNumber;
                      const isMsgAdmin = msg.senderRole === 'admin' || msg.senderCardTier === 'admin';
                      const isBookmarked = bookmarkedIdSet.has(msg.id);
                      const canEdit = isMine && canEditWithinWindow(msg.createdAtMs, msg.timestamp, isAdminUser);
                      const isGroupAdmin = Boolean(
                        activeGroup &&
                          (activeGroup.creatorAccountId === currentAccount.id ||
                            (activeGroup.coAdminAccountIds || []).includes(currentAccount.id))
                      );
                      const canViewGroupReceipts = Boolean(activeGroup && (isMine || isGroupAdmin));

                      // Read receipts summary
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

                      const bubbleClasses = isMsgAdmin
                        ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/90 dark:from-amber-950/80 dark:via-amber-900/50 dark:to-yellow-950/70 border border-amber-400/80 dark:border-amber-500/60 text-slate-900 dark:text-amber-50 shadow-sm'
                        : isMine
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 shadow-sm';

                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          <div className="relative max-w-[88%] sm:max-w-[76%] min-w-0">
                            <div className={`rounded-2xl px-3.5 py-2.5 ${bubbleClasses}`}>
                              {/* Sender Name & Menu */}
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                  {(activeTarget.type === 'group' || isMsgAdmin || !isMine) && (
                                    <span
                                      className={`text-xs font-extrabold truncate ${
                                        isMsgAdmin
                                          ? 'text-amber-900 dark:text-amber-300'
                                          : isMine
                                            ? 'text-indigo-100'
                                            : 'text-slate-900 dark:text-white'
                                      }`}
                                    >
                                      {msg.senderName}
                                    </span>
                                  )}
                                  {isMsgAdmin && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950">
                                      <ShieldCheck className="w-3 h-3" /> ADMIN RESMI
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
                                    isMine && !isMsgAdmin
                                      ? 'text-indigo-100 hover:bg-indigo-700/60'
                                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
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
                                    isMine && !isMsgAdmin
                                      ? 'bg-indigo-700/50 border-indigo-200 text-indigo-50'
                                      : 'bg-black/5 dark:bg-white/5 border-indigo-500 text-slate-600 dark:text-slate-300'
                                  }`}
                                >
                                  <p className="font-bold truncate">{msg.replyToSender}</p>
                                  <p className="truncate opacity-85">{msg.replyToPreview}</p>
                                </div>
                              )}

                              {/* Transfer / Request Money Attachment */}
                              {msg.transferAttachment && (
                                <div
                                  className={`mb-2 p-3 rounded-xl border ${
                                    msg.transferAttachment.status === 'paid'
                                      ? 'bg-emerald-500/15 border-emerald-400/50'
                                      : 'bg-amber-500/15 border-amber-400/50'
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase">
                                    <span>
                                      {msg.transferAttachment.isRequest
                                        ? 'Permintaan Uang'
                                        : 'Transfer Masuk'}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                                        msg.transferAttachment.status === 'paid'
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-amber-500 text-slate-950'
                                      }`}
                                    >
                                      {msg.transferAttachment.status === 'paid' ? 'LUNAS' : 'MENUNGGU'}
                                    </span>
                                  </div>
                                  <p className="text-lg font-black mt-1">
                                    {formatRupiah(msg.transferAttachment.amount)}
                                  </p>
                                  {msg.transferAttachment.note && (
                                    <p className="text-xs opacity-85 mt-0.5">{msg.transferAttachment.note}</p>
                                  )}
                                  {msg.transferAttachment.isRequest &&
                                    msg.transferAttachment.status !== 'paid' &&
                                    !isMine && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPendingPayRequestMsg(msg);
                                          setShowPinPrompt(true);
                                        }}
                                        className="mt-2 w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                                      >
                                        Bayar Sekarang
                                      </button>
                                    )}
                                </div>
                              )}

                              {msg.text && (
                                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.text}</p>
                              )}

                              {msg.poll && renderPollCard(msg.poll, (optId) => void votePrivateChatPoll(msg.id, optId))}

                              {/* Footer: Time + Diedit + Read Receipts */}
                              <div
                                className={`mt-1.5 flex items-center justify-end gap-2 flex-wrap text-[10px] ${
                                  isMine && !isMsgAdmin
                                    ? 'text-indigo-100/90'
                                    : isMsgAdmin
                                      ? 'text-amber-800/80 dark:text-amber-300/80'
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

                                {/* GROUP READ RECEIPT CHIP + EYE BUTTON */}
                                {activeTarget.type === 'group' && canViewGroupReceipts && groupOtherCount > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => setReadReceiptModalMsg(msg)}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 hover:bg-black/20 font-semibold transition-colors"
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

                                {/* DM 1-on-1 Sent / Blue Double Check + Read Time */}
                                {activeTarget.type === 'dm' && isMine && (
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
                              <div className={`mt-1 flex flex-wrap gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                {reactionEntries.map(([emoji, voterIds]) => {
                                  const iReacted = voterIds.includes(currentAccount.id);
                                  return (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => void togglePrivateChatReaction(msg.id, emoji)}
                                      className={`px-2 py-0.5 rounded-full text-xs border inline-flex items-center gap-1 ${
                                        iReacted
                                          ? 'bg-indigo-100 dark:bg-indigo-950/70 border-indigo-400 text-indigo-900 dark:text-indigo-200 font-bold'
                                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      <span>{emoji}</span>
                                      <span className="text-[10px]">{voterIds.length}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Popover Menu `···` */}
                            {openMenuMsgId === msg.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className={`absolute z-40 mt-1 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 space-y-1 ${
                                  isMine ? 'right-0' : 'left-0'
                                }`}
                              >
                                <div className="flex items-center justify-between px-1.5 py-1 border-b border-slate-100 dark:border-slate-800">
                                  {QUICK_REACTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        void togglePrivateChatReaction(msg.id, emoji);
                                        setOpenMenuMsgId(null);
                                      }}
                                      className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-base flex items-center justify-center hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPrivateReplyTarget(msg);
                                    setPrivateEditTarget(null);
                                    setOpenMenuMsgId(null);
                                  }}
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 flex items-center gap-2"
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
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
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
                                  className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Forward className="w-3.5 h-3.5" /> Teruskan Pesan
                                </button>
                                {activeTarget.type === 'group' && activeGroup && isGroupAdmin && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const r = await togglePinPrivateChatMessage(activeGroup.id, msg.id);
                                      showToast(r.message, 'info');
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-2"
                                  >
                                    {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                                    {msg.isPinned ? 'Lepas Sematan Grup' : 'Sematkan di Grup'}
                                  </button>
                                )}
                                {(isMine || isGroupAdmin || isAdminUser) && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const r = await deletePrivateChatMessage(msg.id);
                                      showToast(r.message, r.success ? 'info' : 'error');
                                      setOpenMenuMsgId(null);
                                    }}
                                    className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                                  </button>
                                )}
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
                  <div className="shrink-0 px-4 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    {activeTypingUsers.map((u) => u.accountName).join(', ')} sedang mengetik...
                  </div>
                )}

                {/* Private Composer */}
                <div className="shrink-0 p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 relative">
                  {mentionCandidates.length > 0 && (
                    <div className="absolute bottom-full left-3 right-3 mb-1.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl p-1.5 max-h-44 overflow-y-auto z-30">
                      <p className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400">Mention Anggota (@)</p>
                      {mentionCandidates.map((acc) => (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => insertMention(acc.fullName)}
                          className="w-full px-2.5 py-2 rounded-xl text-left text-xs font-bold text-slate-800 dark:text-slate-100 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center justify-between"
                        >
                          <span>@{acc.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400">{acc.accountNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {(privateReplyTarget || privateEditTarget) && (
                    <div className="mb-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between gap-2 text-xs">
                      <div className="min-w-0">
                        <p className="font-bold text-indigo-700 dark:text-indigo-400">
                          {privateEditTarget ? 'Mengedit Pesan Anda' : `Membalas ${privateReplyTarget?.senderName}`}
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 truncate">
                          {privateEditTarget ? privateEditTarget.text : privateReplyTarget?.text}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPrivateReplyTarget(null);
                          setPrivateEditTarget(null);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendPrivate} className="flex items-center gap-2 min-w-0">
                    <input
                      type="text"
                      value={activeDraftText}
                      onChange={(e) => setActiveDraftText(e.target.value)}
                      placeholder={
                        privateEditTarget
                          ? 'Ubah isi pesan Anda...'
                          : activeTarget.type === 'group'
                            ? 'Tulis pesan ke grup (ketik @nama untuk mention)...'
                            : 'Tulis pesan privat...'
                      }
                      className="flex-1 min-w-0 px-3.5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!activeDraftText.trim()}
                      className="shrink-0 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 text-white text-xs font-extrabold inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">{privateEditTarget ? 'Simpan' : 'Kirim'}</span>
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
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

      {/* Kirim Uang / Minta Uang Portal Modal */}
      <PortalModalShell
        open={showMoneyModal}
        onClose={() => setShowMoneyModal(false)}
        title={isRequestMoneyMode ? 'Minta Uang di Chat Privat' : 'Kirim Uang di Chat Privat'}
        subtitle={
          activeTarget?.type === 'group' && activeGroup
            ? `Grup: ${activeGroup.name}`
            : `Tujuan: ${activeDmItem?.displayName || ''}`
        }
        icon={
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${isRequestMoneyMode ? 'bg-amber-500' : 'bg-emerald-600'}`}>
            {isRequestMoneyMode ? <HandCoins className="w-5 h-5" /> : <DollarSign className="w-5 h-5" />}
          </div>
        }
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowMoneyModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleMoneyModalConfirm}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white ${
                isRequestMoneyMode ? 'bg-amber-500 hover:bg-amber-600 text-slate-950' : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
              {isRequestMoneyMode ? 'Kirim Permintaan' : 'Lanjut Masukkan PIN'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          {!isRequestMoneyMode && activeTarget?.type === 'group' && activeGroup && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Pilih Penerima di Grup
              </label>
              <select
                value={moneyGroupTargetAccountId}
                onChange={(e) => setMoneyGroupTargetAccountId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
              >
                {activeGroup.memberAccountIds
                  .filter((id) => id !== currentAccount.id)
                  .map((id) => {
                    const acc = accounts.find((a) => a.id === id);
                    return (
                      <option key={id} value={id}>
                        {acc?.fullName || id} {acc ? `(Rek ${acc.accountNumber})` : ''}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Nominal (Rupiah)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={moneyAmountInput}
              onChange={(e) => setMoneyAmountInput(e.target.value.replace(/[^\d]/g, ''))}
              placeholder="Contoh: 50000"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-white"
            />
            {Number(moneyAmountInput) > 0 && (
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatRupiah(Number(moneyAmountInput))}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
              Catatan <span className="font-normal normal-case text-slate-400">(Opsional)</span>
            </label>
            <input
              type="text"
              value={moneyNoteInput}
              onChange={(e) => setMoneyNoteInput(e.target.value)}
              maxLength={120}
              placeholder="Contoh: Patungan makan siang"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </PortalModalShell>

      <PinPromptModal
        isOpen={showPinPrompt}
        targetAccountId={currentAccount.id}
        targetAccountName={currentAccount.fullName}
        expectedPin={currentAccount.pin}
        onCancel={() => {
          setShowPinPrompt(false);
          setPendingPayRequestMsg(null);
        }}
        onSuccess={(pin) => void executeVerifiedMoneyTransfer(pin || currentAccount.pin)}
        title={pendingPayRequestMsg ? 'Konfirmasi Bayar Permintaan Uang' : 'Konfirmasi Kirim Uang'}
        description={
          pendingPayRequestMsg?.transferAttachment
            ? `Masukkan PIN untuk membayar ${formatRupiah(pendingPayRequestMsg.transferAttachment.amount)} ke ${pendingPayRequestMsg.senderName}`
            : `Masukkan PIN untuk mengirim ${formatRupiah(Number(moneyAmountInput) || 0)}`
        }
      />
    </div>
  );
};
