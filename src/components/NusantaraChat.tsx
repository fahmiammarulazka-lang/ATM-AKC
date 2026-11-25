/**
 * Bank Nusantara — Chat Global & Priv (v15.39.49)
 * Antarmuka komunikasi modern bergaya WhatsApp/Telegram dengan 2 tab utama:
 * 1. Chat Global: Terbuka untuk semua nasabah & Admin (lencana ADMIN RESMI, Reply, Hapus, Pin, Anti-Spam, Mode Khusus Admin, tanpa Kirim/Minta Uang).
 * 2. Chat Privat: 1-on-1 & Grup Privat (privasi penuh antar peserta, Tambah Nasabah 3 kolom + pratinjau otomatis, Tambah & Kelola Grup lengkap, Kirim Uang & Minta Uang aktif).
 */
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MessageSquare,
  Globe,
  Lock,
  Send,
  Search,
  UserPlus,
  Users,
  DollarSign,
  CheckCheck,
  ShieldCheck,
  Pin,
  PinOff,
  Trash2,
  Reply,
  X,
  ArrowLeft,
  Info,
  Crown,
  LogOut,
  Edit3,
  Check,
  AlertCircle,
  HandCoins,
  Sparkles,
  Briefcase,
  Home,
  Star,
  Heart,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { BankAccount, ChatMessage, GlobalChatMessage, PrivateChatGroup } from '../types/bank';
import { formatRupiah, playAtmSound } from '../utils/bankUtils';
import { PinPromptModal } from './PinPromptModal';

type MainChatTab = 'global' | 'private';
type PrivateFilter = 'all' | 'dm' | 'group';

interface ActivePrivateTarget {
  type: 'dm' | 'group';
  id: string; // accountId (or accountNumber fallback) for dm, groupId for group
  accountNumber?: string;
}

const GROUP_ICON_OPTIONS = [
  { key: 'users', label: 'Komunitas', Icon: Users },
  { key: 'briefcase', label: 'Bisnis', Icon: Briefcase },
  { key: 'home', label: 'Keluarga', Icon: Home },
  { key: 'star', label: 'VIP', Icon: Star },
  { key: 'heart', label: 'Sahabat', Icon: Heart },
  { key: 'zap', label: 'Cepat', Icon: Zap },
];

const GROUP_COLOR_OPTIONS: Array<{ key: string; label: string; bgClass: string; ringClass: string }> = [
  { key: 'indigo', label: 'Indigo', bgClass: 'bg-indigo-600 text-white', ringClass: 'ring-indigo-400' },
  { key: 'emerald', label: 'Emerald', bgClass: 'bg-emerald-600 text-white', ringClass: 'ring-emerald-400' },
  { key: 'sky', label: 'Biru', bgClass: 'bg-sky-600 text-white', ringClass: 'ring-sky-400' },
  { key: 'amber', label: 'Emas', bgClass: 'bg-amber-500 text-slate-950', ringClass: 'ring-amber-300' },
  { key: 'rose', label: 'Rose', bgClass: 'bg-rose-600 text-white', ringClass: 'ring-rose-400' },
  { key: 'violet', label: 'Violet', bgClass: 'bg-violet-600 text-white', ringClass: 'ring-violet-400' },
];

function renderGroupIcon(iconKey: string, className = 'w-5 h-5') {
  const found = GROUP_ICON_OPTIONS.find((item) => item.key === iconKey) || GROUP_ICON_OPTIONS[0];
  const IconComp = found.Icon;
  return <IconComp className={className} />;
}

function getGroupColorClass(colorKey: string): string {
  return (
    GROUP_COLOR_OPTIONS.find((c) => c.key === colorKey)?.bgClass || 'bg-indigo-600 text-white'
  );
}

function formatShortTime(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export const NusantaraChat: React.FC = () => {
  const {
    currentAccount,
    accounts,
    adminUnlocked,
    connectedDevicesCount,
    globalChats,
    globalChatConfig,
    sendGlobalChatMessage,
    togglePinGlobalChatMessage,
    toggleGlobalChatAdminLock,
    deleteGlobalChatMessage,
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
    createPrivateChatGroup,
    addMemberToPrivateGroup,
    renamePrivateChatGroup,
    removeMemberFromPrivateGroup,
    leavePrivateChatGroup,
    deletePrivateChatGroup,
  } = useBank();

  const [mainTab, setMainTab] = useState<MainChatTab>('global');
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Global Chat states
  const [globalText, setGlobalText] = useState<string>('');
  const [globalReplyTarget, setGlobalReplyTarget] = useState<GlobalChatMessage | null>(null);
  const [globalCooldownLeft, setGlobalCooldownLeft] = useState<number>(0);
  const [globalSending, setGlobalSending] = useState<boolean>(false);
  const globalEndRef = useRef<HTMLDivElement | null>(null);

  // Private Chat states
  const [privateFilter, setPrivateFilter] = useState<PrivateFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTarget, setActiveTarget] = useState<ActivePrivateTarget | null>(null);
  const [privateText, setPrivateText] = useState<string>('');
  const [privateReplyTarget, setPrivateReplyTarget] = useState<ChatMessage | null>(null);
  const privateEndRef = useRef<HTMLDivElement | null>(null);

  // Modal: Tambah Nasabah (3 kolom: Nama opsional, User ID, No. Rekening — isi salah satu)
  const [showAddContactModal, setShowAddContactModal] = useState<boolean>(false);
  const [contactCustomName, setContactCustomName] = useState<string>('');
  const [contactUserIdInput, setContactUserIdInput] = useState<string>('');
  const [contactAccNoInput, setContactAccNoInput] = useState<string>('');

  // Modal: Tambah Grup
  const [showCreateGroupModal, setShowCreateGroupModal] = useState<boolean>(false);
  const [groupNameInput, setGroupNameInput] = useState<string>('');
  const [groupIconKey, setGroupIconKey] = useState<string>('users');
  const [groupAccentColor, setGroupAccentColor] = useState<string>('indigo');
  const [groupSelectedMemberIds, setGroupSelectedMemberIds] = useState<string[]>([]);
  const [groupQuickLookup, setGroupQuickLookup] = useState<string>('');

  // Modal: Info & Pengaturan Grup
  const [showGroupInfoModal, setShowGroupInfoModal] = useState<boolean>(false);
  const [renameGroupInput, setRenameGroupInput] = useState<string>('');
  const [groupAddLookupInput, setGroupAddLookupInput] = useState<string>('');
  const [confirmDeleteGroupStep, setConfirmDeleteGroupStep] = useState<boolean>(false);

  // Modal: Kirim Uang / Minta Uang (Privat 1-on-1 & Grup Privat)
  const [showMoneyModal, setShowMoneyModal] = useState<boolean>(false);
  const [isRequestMoneyMode, setIsRequestMoneyMode] = useState<boolean>(false);
  const [moneyAmountInput, setMoneyAmountInput] = useState<string>('');
  const [moneyNoteInput, setMoneyNoteInput] = useState<string>('');
  const [moneyGroupTargetAccountId, setMoneyGroupTargetAccountId] = useState<string>('');
  const [pendingPayRequestMsg, setPendingPayRequestMsg] = useState<ChatMessage | null>(null);
  const [showPinPrompt, setShowPinPrompt] = useState<boolean>(false);

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

  // Cooldown timer tick for Global Chat anti-spam
  useEffect(() => {
    if (globalCooldownLeft <= 0) return;
    const t = window.setInterval(() => {
      setGlobalCooldownLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [globalCooldownLeft]);

  // Mark Global Chat read when viewing Global tab
  useEffect(() => {
    if (mainTab === 'global' && currentAccount) {
      markChatRoomRead('global');
    }
  }, [mainTab, globalChats.length, currentAccount?.id]);

  // Auto-scroll Global Chat to bottom
  useEffect(() => {
    if (mainTab === 'global') {
      globalEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [mainTab, globalChats.length]);

  // Mark active private room read when open
  useEffect(() => {
    if (mainTab === 'private' && activeTarget && currentAccount) {
      const roomKey = activeTarget.type === 'group' ? `group:${activeTarget.id}` : `dm:${activeTarget.id}`;
      markChatRoomRead(roomKey);
      if (activeTarget.type === 'dm' && activeTarget.accountNumber) {
        markChatRoomRead(`dm:${activeTarget.accountNumber}`);
      }
    }
  }, [mainTab, activeTarget?.type, activeTarget?.id, chats.length, currentAccount?.id]);

  // Auto-scroll Private Chat to bottom
  useEffect(() => {
    if (mainTab === 'private' && activeTarget) {
      privateEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [mainTab, activeTarget?.id, chats.length]);

  // Sorted Global Chats (oldest -> newest like WhatsApp/Telegram)
  const orderedGlobalChats = useMemo(() => {
    return [...globalChats].sort((a, b) => {
      const ta = a.createdAtMs || Date.parse(a.timestamp || '') || 0;
      const tb = b.createdAtMs || Date.parse(b.timestamp || '') || 0;
      return ta - tb;
    });
  }, [globalChats]);

  const pinnedGlobalMessages = useMemo(
    () => orderedGlobalChats.filter((m) => m.isPinned),
    [orderedGlobalChats]
  );

  // Strict privacy: Only groups where currentAccount is a member
  const myPrivateGroups = useMemo(() => {
    if (!currentAccount) return [];
    return privateChatGroups.filter((g) => g.memberAccountIds.includes(currentAccount.id));
  }, [privateChatGroups, currentAccount]);

  // Saved contacts for current account
  const mySavedContacts = useMemo(() => {
    return Array.isArray(currentAccount?.savedChatContacts)
      ? currentAccount!.savedChatContacts!
      : [];
  }, [currentAccount?.savedChatContacts]);

  // Unified private sidebar thread items (strictly filtered to currentAccount's DMs and Groups!)
  const privateSidebarItems = useMemo(() => {
    if (!currentAccount) return [];
    const items: Array<{
      type: 'dm' | 'group';
      id: string;
      accountNumber?: string;
      userId16?: string;
      displayName: string;
      subtitle: string;
      avatarChar: string;
      iconKey?: string;
      accentColor?: string;
      cardTier?: string;
      lastMessagePreview: string;
      lastMessageTime: string;
      lastActivityMs: number;
      unreadCount: number;
      memberCount?: number;
      isSavedContact?: boolean;
    }> = [];

    // 1. Collect all DM peers from saved contacts + private 1-on-1 messages involving currentAccount
    const dmPeerMap = new Map<
      string,
      {
        accountId: string;
        accountNumber: string;
        userId16?: string;
        customName?: string;
        registeredName: string;
        cardTier?: string;
        isSavedContact: boolean;
      }
    >();

    for (const c of mySavedContacts) {
      const liveAcc = accounts.find(
        (a) => a.id === c.targetAccountId || a.accountNumber === c.targetAccountNumber
      );
      const key = liveAcc?.id || c.targetAccountId || c.targetAccountNumber;
      dmPeerMap.set(key, {
        accountId: liveAcc?.id || c.targetAccountId,
        accountNumber: liveAcc?.accountNumber || c.targetAccountNumber,
        userId16: liveAcc?.userId16 || c.targetUserId16,
        customName: c.customName,
        registeredName: liveAcc?.fullName || c.registeredName,
        cardTier: liveAcc?.cardTier || c.cardTier,
        isSavedContact: true,
      });
    }

    for (const m of chats) {
      if (m.groupId || m.deleted) continue;
      const isMeSender =
        (m.senderAccountId && m.senderAccountId === currentAccount.id) ||
        m.senderAccount === currentAccount.accountNumber;
      const isMeRecipient =
        (m.recipientAccountId && m.recipientAccountId === currentAccount.id) ||
        m.recipientAccount === currentAccount.accountNumber;
      if (!isMeSender && !isMeRecipient) continue;

      const peerAccNo = isMeSender ? m.recipientAccount : m.senderAccount;
      const peerAccId = isMeSender ? m.recipientAccountId : m.senderAccountId;
      const liveAcc = accounts.find(
        (a) => (peerAccId && a.id === peerAccId) || a.accountNumber === peerAccNo
      );
      if (liveAcc?.id === currentAccount.id) continue;
      const key = liveAcc?.id || peerAccId || peerAccNo;
      if (!key || dmPeerMap.has(key)) continue;

      dmPeerMap.set(key, {
        accountId: liveAcc?.id || peerAccId || peerAccNo,
        accountNumber: liveAcc?.accountNumber || peerAccNo,
        userId16: liveAcc?.userId16,
        registeredName: liveAcc?.fullName || (isMeSender ? m.recipientName : m.senderName) || peerAccNo,
        cardTier: liveAcc?.cardTier,
        isSavedContact: false,
      });
    }

    // Build DM sidebar rows
    for (const peer of dmPeerMap.values()) {
      const threadMsgs = chats.filter((m) => {
        if (m.groupId || m.deleted) return false;
        const fromMeToPeer =
          ((m.senderAccountId && m.senderAccountId === currentAccount.id) ||
            m.senderAccount === currentAccount.accountNumber) &&
          ((m.recipientAccountId && m.recipientAccountId === peer.accountId) ||
            m.recipientAccount === peer.accountNumber);
        const fromPeerToMe =
          ((m.senderAccountId && m.senderAccountId === peer.accountId) ||
            m.senderAccount === peer.accountNumber) &&
          ((m.recipientAccountId && m.recipientAccountId === currentAccount.id) ||
            m.recipientAccount === currentAccount.accountNumber);
        return fromMeToPeer || fromPeerToMe;
      });

      const lastMsg = threadMsgs[threadMsgs.length - 1];
      const lastRead = Math.max(
        chatLastReadMap[`dm:${peer.accountId}`] || 0,
        chatLastReadMap[`dm:${peer.accountNumber}`] || 0
      );
      const unreadCount = threadMsgs.filter((m) => {
        const ts = m.createdAtMs || Date.parse(m.timestamp || '') || 0;
        const isMine =
          (m.senderAccountId && m.senderAccountId === currentAccount.id) ||
          m.senderAccount === currentAccount.accountNumber;
        return !isMine && ts > lastRead;
      }).length;

      const displayName = peer.customName
        ? `${peer.customName}`
        : peer.registeredName;

      items.push({
        type: 'dm',
        id: peer.accountId,
        accountNumber: peer.accountNumber,
        userId16: peer.userId16,
        displayName,
        subtitle: peer.customName
          ? `${peer.registeredName} • Rek ${peer.accountNumber}`
          : `Rek ${peer.accountNumber}${peer.userId16 ? ` • ID ${peer.userId16.slice(0, 6)}...` : ''}`,
        avatarChar: displayName.charAt(0).toUpperCase() || 'N',
        cardTier: peer.cardTier,
        lastMessagePreview: lastMsg
          ? lastMsg.transferAttachment
            ? lastMsg.transferAttachment.isRequest
              ? `Minta Uang ${formatRupiah(lastMsg.transferAttachment.amount)}`
              : `Kirim Uang ${formatRupiah(lastMsg.transferAttachment.amount)}`
            : lastMsg.text
          : 'Belum ada pesan — ketuk untuk mulai chat',
        lastMessageTime: lastMsg ? formatShortTime(lastMsg.timestamp) : '',
        lastActivityMs: lastMsg
          ? lastMsg.createdAtMs || Date.parse(lastMsg.timestamp || '') || 0
          : 0,
        unreadCount,
        isSavedContact: peer.isSavedContact,
      });
    }

    // 2. Build Group sidebar rows
    for (const grp of myPrivateGroups) {
      const grpMsgs = chats.filter((m) => m.groupId === grp.id && !m.deleted);
      const lastMsg = grpMsgs[grpMsgs.length - 1];
      const lastRead = chatLastReadMap[`group:${grp.id}`] || 0;
      const unreadCount = grpMsgs.filter((m) => {
        const ts = m.createdAtMs || Date.parse(m.timestamp || '') || 0;
        const isMine =
          (m.senderAccountId && m.senderAccountId === currentAccount.id) ||
          m.senderAccount === currentAccount.accountNumber;
        return !isMine && ts > lastRead;
      }).length;

      items.push({
        type: 'group',
        id: grp.id,
        displayName: grp.name,
        subtitle: `${grp.memberAccountIds.length} anggota • Grup Privat`,
        avatarChar: grp.name.charAt(0).toUpperCase() || 'G',
        iconKey: grp.iconKey,
        accentColor: grp.accentColor,
        lastMessagePreview: lastMsg
          ? `${lastMsg.senderName.split(' ')[0]}: ${
              lastMsg.transferAttachment
                ? lastMsg.transferAttachment.isRequest
                  ? `Minta Uang ${formatRupiah(lastMsg.transferAttachment.amount)}`
                  : `Kirim Uang ${formatRupiah(lastMsg.transferAttachment.amount)}`
                : lastMsg.text
            }`
          : 'Grup dibuat — mulai percakapan',
        lastMessageTime: lastMsg ? formatShortTime(lastMsg.timestamp) : formatShortTime(grp.createdAt),
        lastActivityMs: lastMsg
          ? lastMsg.createdAtMs || Date.parse(lastMsg.timestamp || '') || grp.updatedAtMs
          : grp.updatedAtMs || Date.parse(grp.createdAt || '') || 0,
        unreadCount,
        memberCount: grp.memberAccountIds.length,
      });
    }

    return items.sort((a, b) => b.lastActivityMs - a.lastActivityMs);
  }, [currentAccount, mySavedContacts, accounts, chats, myPrivateGroups, chatLastReadMap]);

  const filteredSidebarItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return privateSidebarItems.filter((item) => {
      if (privateFilter === 'dm' && item.type !== 'dm') return false;
      if (privateFilter === 'group' && item.type !== 'group') return false;
      if (!q) return true;
      return (
        item.displayName.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        (item.accountNumber || '').includes(q) ||
        (item.userId16 || '').includes(q)
      );
    });
  }, [privateSidebarItems, privateFilter, searchQuery]);

  // Active DM details or Group details
  const activeDmAccount = useMemo<BankAccount | null>(() => {
    if (!activeTarget || activeTarget.type !== 'dm') return null;
    return (
      accounts.find(
        (a) =>
          a.id === activeTarget.id ||
          (activeTarget.accountNumber && a.accountNumber === activeTarget.accountNumber)
      ) || null
    );
  }, [activeTarget, accounts]);

  const activeDmSavedContact = useMemo(() => {
    if (!activeTarget || activeTarget.type !== 'dm') return null;
    return (
      mySavedContacts.find(
        (c) =>
          c.targetAccountId === activeTarget.id ||
          (activeTarget.accountNumber && c.targetAccountNumber === activeTarget.accountNumber)
      ) || null
    );
  }, [activeTarget, mySavedContacts]);

  const activeGroup = useMemo<PrivateChatGroup | null>(() => {
    if (!activeTarget || activeTarget.type !== 'group') return null;
    return myPrivateGroups.find((g) => g.id === activeTarget.id) || null;
  }, [activeTarget, myPrivateGroups]);

  const activePrivateMessages = useMemo<ChatMessage[]>(() => {
    if (!currentAccount || !activeTarget) return [];
    if (activeTarget.type === 'group') {
      if (!activeGroup) return [];
      return chats.filter((m) => m.groupId === activeGroup.id && !m.deleted);
    }
    const peerAccNo = activeDmAccount?.accountNumber || activeTarget.accountNumber || '';
    const peerAccId = activeDmAccount?.id || activeTarget.id;
    return chats.filter((m) => {
      if (m.groupId || m.deleted) return false;
      const fromMeToPeer =
        ((m.senderAccountId && m.senderAccountId === currentAccount.id) ||
          m.senderAccount === currentAccount.accountNumber) &&
        ((m.recipientAccountId && m.recipientAccountId === peerAccId) ||
          (peerAccNo && m.recipientAccount === peerAccNo));
      const fromPeerToMe =
        ((m.senderAccountId && m.senderAccountId === peerAccId) ||
          (peerAccNo && m.senderAccount === peerAccNo)) &&
        ((m.recipientAccountId && m.recipientAccountId === currentAccount.id) ||
          m.recipientAccount === currentAccount.accountNumber);
      return fromMeToPeer || fromPeerToMe;
    });
  }, [currentAccount, activeTarget, activeGroup, activeDmAccount, chats]);

  // Live Lookup Preview for 3-column Tambah Nasabah Modal
  const addContactLookup = useMemo(() => {
    const cleanUid = contactUserIdInput.replace(/\D/g, '').trim();
    const cleanAcc = contactAccNoInput.replace(/\D/g, '').trim();
    if (!cleanUid && !cleanAcc) {
      return { status: 'empty' as const, account: null as BankAccount | null, error: '' };
    }
    const byUid = cleanUid
      ? accounts.find((a) => String(a.userId16 || '').replace(/\D/g, '') === cleanUid)
      : undefined;
    const byAcc = cleanAcc
      ? accounts.find((a) => String(a.accountNumber || '').replace(/\D/g, '') === cleanAcc)
      : undefined;

    if (cleanUid && cleanAcc) {
      if (!byUid || !byAcc) {
        return {
          status: 'not_found' as const,
          account: null,
          error: 'User ID atau No. Rekening tidak cocok di database akun.',
        };
      }
      if (byUid.id !== byAcc.id) {
        return {
          status: 'mismatch' as const,
          account: null,
          error: 'User ID dan No. Rekening milik dua akun berbeda! Cukup isi salah satu saja.',
        };
      }
    }

    const found = byUid || byAcc || null;
    if (!found) {
      return {
        status: 'not_found' as const,
        account: null,
        error: 'Akun belum ditemukan. Pastikan angka User ID (16 digit) atau No. Rekening (10 digit) benar.',
      };
    }
    if (currentAccount && found.id === currentAccount.id) {
      return {
        status: 'self' as const,
        account: found,
        error: 'Ini adalah akun Anda sendiri.',
      };
    }
    return { status: 'found' as const, account: found, error: '' };
  }, [contactUserIdInput, contactAccNoInput, accounts, currentAccount]);

  // Quick lookup for adding member in Create Group / Group Info
  const findAccountByUidOrAccNo = (raw: string): BankAccount | null => {
    const digits = raw.replace(/\D/g, '').trim();
    if (!digits) return null;
    return (
      accounts.find(
        (a) =>
          String(a.userId16 || '').replace(/\D/g, '') === digits ||
          String(a.accountNumber || '').replace(/\D/g, '') === digits
      ) || null
    );
  };

  const groupQuickPreview = useMemo(
    () => findAccountByUidOrAccNo(groupQuickLookup),
    [groupQuickLookup, accounts]
  );

  const groupInfoAddPreview = useMemo(
    () => findAccountByUidOrAccNo(groupAddLookupInput),
    [groupAddLookupInput, accounts]
  );

  if (!currentAccount) return null;

  // ==================== HANDLERS ====================
  const handleSendGlobal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!globalText.trim() || globalSending) return;
    if (!isAdminUser && globalCooldownLeft > 0) return;

    setGlobalSending(true);
    const res = await sendGlobalChatMessage({
      text: globalText.trim(),
      asAdmin: isAdminUser,
      senderName: currentAccount.fullName,
      showPopupOnAllPhones: false,
      replyToId: globalReplyTarget?.id,
      replyToSender: globalReplyTarget?.senderName,
      replyToPreview: globalReplyTarget?.text.slice(0, 120),
    });
    setGlobalSending(false);

    if (!res.success) {
      showToast(res.message, 'error');
      return;
    }

    setGlobalText('');
    setGlobalReplyTarget(null);
    markChatRoomRead('global');
    if (!isAdminUser && (globalChatConfig.cooldownMs || 2500) > 0) {
      setGlobalCooldownLeft(Math.max(1, Math.ceil((globalChatConfig.cooldownMs || 2500) / 1000)));
    }
  };

  const handleSaveNewContact = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addPrivateChatContact({
      customName: contactCustomName,
      userId: contactUserIdInput,
      accountNumber: contactAccNoInput,
    });
    if (!res.success || !res.contact) {
      showToast(res.message, 'error');
      return;
    }
    showToast(res.message, 'success');
    setShowAddContactModal(false);
    setContactCustomName('');
    setContactUserIdInput('');
    setContactAccNoInput('');
    setMainTab('private');
    setActiveTarget({
      type: 'dm',
      id: res.contact.targetAccountId,
      accountNumber: res.contact.targetAccountNumber,
    });
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await createPrivateChatGroup({
      name: groupNameInput,
      iconKey: groupIconKey,
      accentColor: groupAccentColor,
      memberAccountIds: groupSelectedMemberIds,
    });
    if (!res.success || !res.group) {
      showToast(res.message, 'error');
      return;
    }
    showToast(res.message, 'success');
    setShowCreateGroupModal(false);
    setGroupNameInput('');
    setGroupSelectedMemberIds([]);
    setGroupQuickLookup('');
    setMainTab('private');
    setActiveTarget({ type: 'group', id: res.group.id });
  };

  const handleSendPrivateMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateText.trim() || !activeTarget) return;

    if (activeTarget.type === 'group' && activeGroup) {
      sendChatMessage({
        recipientAccount: `group:${activeGroup.id}`,
        recipientName: activeGroup.name,
        groupId: activeGroup.id,
        text: privateText.trim(),
        replyToId: privateReplyTarget?.id,
        replyToSender: privateReplyTarget?.senderName,
        replyToPreview: privateReplyTarget?.text.slice(0, 120),
      });
      markChatRoomRead(`group:${activeGroup.id}`);
    } else if (activeTarget.type === 'dm') {
      const targetAccNo = activeDmAccount?.accountNumber || activeTarget.accountNumber || activeTarget.id;
      const targetName =
        activeDmSavedContact?.customName || activeDmAccount?.fullName || `Rek ${targetAccNo}`;
      sendChatMessage({
        recipientAccountId: activeDmAccount?.id || activeTarget.id,
        recipientAccount: targetAccNo,
        recipientName: targetName,
        text: privateText.trim(),
        replyToId: privateReplyTarget?.id,
        replyToSender: privateReplyTarget?.senderName,
        replyToPreview: privateReplyTarget?.text.slice(0, 120),
      });
      markChatRoomRead(`dm:${activeTarget.id}`);
    }

    setPrivateText('');
    setPrivateReplyTarget(null);
    playAtmSound('beep');
  };

  const openMoneyModal = (asRequest: boolean) => {
    setIsRequestMoneyMode(asRequest);
    setMoneyAmountInput('');
    setMoneyNoteInput('');
    setPendingPayRequestMsg(null);
    if (activeTarget?.type === 'group' && activeGroup) {
      const firstOther = activeGroup.memberAccountIds.find((id) => id !== currentAccount.id) || '';
      setMoneyGroupTargetAccountId(firstOther);
    } else {
      setMoneyGroupTargetAccountId('');
    }
    setShowMoneyModal(true);
  };

  const handleConfirmMoneyModal = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseInt(moneyAmountInput.replace(/\D/g, ''), 10);
    if (!amt || amt < 1000) {
      showToast('Nominal minimal Rp 1.000.', 'error');
      return;
    }

    if (activeTarget?.type === 'group' && activeGroup) {
      const targetAcc = accounts.find((a) => a.id === moneyGroupTargetAccountId);
      if (!isRequestMoneyMode && !targetAcc) {
        showToast('Pilih anggota grup tujuan transfer terlebih dahulu.', 'error');
        return;
      }
      if (isRequestMoneyMode) {
        sendChatMessage({
          recipientAccount: `group:${activeGroup.id}`,
          recipientName: activeGroup.name,
          groupId: activeGroup.id,
          text: targetAcc
            ? `Meminta dana ${formatRupiah(amt)} dari ${targetAcc.fullName}${moneyNoteInput ? ` — "${moneyNoteInput}"` : ''}`
            : `Meminta patungan ${formatRupiah(amt)} di grup${moneyNoteInput ? ` — "${moneyNoteInput}"` : ''}`,
          transferAttachment: {
            amount: amt,
            referenceNo: `REQ-${Date.now().toString().slice(-6)}`,
            note: moneyNoteInput || 'Patungan Grup Privat',
            isRequest: true,
            status: 'pending',
            targetAccountNumber: targetAcc?.accountNumber,
            targetName: targetAcc?.fullName,
          },
        });
        setShowMoneyModal(false);
        showToast('Permintaan dana terkirim ke grup!', 'success');
      } else {
        setShowMoneyModal(false);
        setShowPinPrompt(true);
      }
      return;
    }

    if (activeTarget?.type === 'dm') {
      const targetAccNo = activeDmAccount?.accountNumber || activeTarget.accountNumber || '';
      const targetName =
        activeDmSavedContact?.customName || activeDmAccount?.fullName || `Rek ${targetAccNo}`;
      if (isRequestMoneyMode) {
        sendChatMessage({
          recipientAccountId: activeDmAccount?.id || activeTarget.id,
          recipientAccount: targetAccNo,
          recipientName: targetName,
          text: `Meminta dana ${formatRupiah(amt)}${moneyNoteInput ? ` untuk "${moneyNoteInput}"` : ''}`,
          transferAttachment: {
            amount: amt,
            referenceNo: `REQ-${Date.now().toString().slice(-6)}`,
            note: moneyNoteInput || 'Permintaan dana privat',
            isRequest: true,
            status: 'pending',
            targetAccountNumber: targetAccNo,
            targetName,
          },
        });
        setShowMoneyModal(false);
        showToast('Permintaan dana terkirim!', 'success');
      } else {
        setShowMoneyModal(false);
        setShowPinPrompt(true);
      }
    }
  };

  const handlePayIncomingRequest = (msg: ChatMessage) => {
    if (!msg.transferAttachment || msg.transferAttachment.status === 'paid') return;
    setPendingPayRequestMsg(msg);
    setMoneyAmountInput(String(msg.transferAttachment.amount));
    setMoneyNoteInput(msg.transferAttachment.note || 'Pelunasan permintaan dana');
    setShowPinPrompt(true);
  };

  const executeTransferAfterPin = () => {
    setShowPinPrompt(false);

    // Case 1: Paying an incoming money request bubble
    if (pendingPayRequestMsg && pendingPayRequestMsg.transferAttachment) {
      const reqMsg = pendingPayRequestMsg;
      const reqAtt = pendingPayRequestMsg.transferAttachment;
      const amt = reqAtt.amount;
      const res = transferMoney({
        recipientAccount: reqMsg.senderAccount,
        recipientBank: 'Bank Nusantara',
        amount: amt,
        note: `Bayar Minta Uang (${reqAtt.referenceNo})`,
        pin: currentAccount.pin,
      });
      setPendingPayRequestMsg(null);
      if (res.success && res.transaction) {
        void markChatRequestPaid(reqMsg.id, currentAccount.fullName);
        if (reqMsg.groupId && activeGroup) {
          sendChatMessage({
            recipientAccount: `group:${activeGroup.id}`,
            recipientName: activeGroup.name,
            groupId: activeGroup.id,
            text: `Melunasi permintaan ${formatRupiah(amt)} kepada ${reqMsg.senderName}`,
            transferAttachment: {
              amount: amt,
              referenceNo: res.transaction.referenceNo,
              note: `Lunas: ${reqAtt.note || 'Patungan'}`,
              targetAccountNumber: reqMsg.senderAccount,
              targetName: reqMsg.senderName,
            },
          });
        } else {
          sendChatMessage({
            recipientAccountId: reqMsg.senderAccountId,
            recipientAccount: reqMsg.senderAccount,
            recipientName: reqMsg.senderName,
            text: `Melunasi permintaan dana ${formatRupiah(amt)}`,
            transferAttachment: {
              amount: amt,
              referenceNo: res.transaction.referenceNo,
              note: `Lunas: ${reqAtt.note || 'Permintaan dana'}`,
            },
          });
        }
        showToast(`Pembayaran ${formatRupiah(amt)} ke ${reqMsg.senderName} berhasil!`, 'success');
      } else {
        showToast(res.message || 'Transfer gagal.', 'error');
      }
      return;
    }

    // Case 2: Direct Kirim Uang in DM or Group
    const amt = parseInt(moneyAmountInput.replace(/\D/g, ''), 10);
    if (activeTarget?.type === 'group' && activeGroup) {
      const targetAcc = accounts.find((a) => a.id === moneyGroupTargetAccountId);
      if (!targetAcc) {
        showToast('Anggota tujuan tidak ditemukan.', 'error');
        return;
      }
      const res = transferMoney({
        recipientAccount: targetAcc.accountNumber,
        recipientBank: 'Bank Nusantara',
        amount: amt,
        note: moneyNoteInput || `Transfer Grup ${activeGroup.name}`,
        pin: currentAccount.pin,
      });
      if (res.success && res.transaction) {
        sendChatMessage({
          recipientAccount: `group:${activeGroup.id}`,
          recipientName: activeGroup.name,
          groupId: activeGroup.id,
          text: `Mengirim ${formatRupiah(amt)} kepada ${targetAcc.fullName}`,
          transferAttachment: {
            amount: amt,
            referenceNo: res.transaction.referenceNo,
            note: moneyNoteInput || `Transfer di grup ${activeGroup.name}`,
            targetAccountNumber: targetAcc.accountNumber,
            targetName: targetAcc.fullName,
          },
        });
        showToast(`Transfer ${formatRupiah(amt)} ke ${targetAcc.fullName} berhasil!`, 'success');
      } else {
        showToast(res.message || 'Transfer gagal.', 'error');
      }
      return;
    }

    if (activeTarget?.type === 'dm') {
      const targetAccNo = activeDmAccount?.accountNumber || activeTarget.accountNumber || '';
      const targetName =
        activeDmSavedContact?.customName || activeDmAccount?.fullName || `Rek ${targetAccNo}`;
      const res = transferMoney({
        recipientAccount: targetAccNo,
        recipientBank: 'Bank Nusantara',
        amount: amt,
        note: moneyNoteInput || 'Transfer lewat Chat Privat',
        pin: currentAccount.pin,
      });
      if (res.success && res.transaction) {
        sendChatMessage({
          recipientAccountId: activeDmAccount?.id || activeTarget.id,
          recipientAccount: targetAccNo,
          recipientName: targetName,
          text: `Mentransfer ${formatRupiah(amt)} via Chat Privat`,
          transferAttachment: {
            amount: amt,
            referenceNo: res.transaction.referenceNo,
            note: moneyNoteInput || 'Transfer dana privat',
          },
        });
        showToast(`Transfer ${formatRupiah(amt)} ke ${targetName} berhasil!`, 'success');
      } else {
        showToast(res.message || 'Transfer gagal.', 'error');
      }
    }
  };

  const activeGroupMembers = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.memberAccountIds
      .map((id) => accounts.find((a) => a.id === id))
      .filter((a): a is BankAccount => Boolean(a));
  }, [activeGroup, accounts]);

  const pinDescription = pendingPayRequestMsg?.transferAttachment
    ? `Bayar permintaan dana ${formatRupiah(pendingPayRequestMsg.transferAttachment.amount)} ke ${pendingPayRequestMsg.senderName}`
    : activeTarget?.type === 'group'
    ? `Transfer ${formatRupiah(parseInt(moneyAmountInput.replace(/\D/g, ''), 10) || 0)} ke ${
        accounts.find((a) => a.id === moneyGroupTargetAccountId)?.fullName || 'Anggota Grup'
      }`
    : `Transfer ${formatRupiah(parseInt(moneyAmountInput.replace(/\D/g, ''), 10) || 0)} ke ${
        activeDmSavedContact?.customName || activeDmAccount?.fullName || 'Nasabah'
      }`;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-3">
      {/* TOP BAR: HEADER & 2 MAIN TABS (CHAT GLOBAL & CHAT PRIVAT) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shrink-0 shadow-md">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate">
              Chat Global &amp; Priv
            </h2>
            <p className="text-[11px] text-slate-400 truncate">
              Real-Time Lintas HP, Laptop &amp; Cloud • {Math.max(1, connectedDevicesCount)} perangkat tersinkron
            </p>
          </div>
        </div>

        {/* 2 MAIN TABS */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => setMainTab('global')}
            className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'global'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Globe className="w-4 h-4 shrink-0" />
            <span>Chat Global</span>
            {globalChatUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black tabular-nums">
                {globalChatUnreadCount > 99 ? '99+' : globalChatUnreadCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setMainTab('private')}
            className={`min-h-[42px] px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer ${
              mainTab === 'private'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Lock className="w-4 h-4 shrink-0" />
            <span>Chat Privat</span>
            {privateChatUnreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black tabular-nums">
                {privateChatUnreadCount > 99 ? '99+' : privateChatUnreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* IN-APP TOAST NOTIFICATION */}
      {toastBanner && (
        <div
          className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            toastBanner.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              : toastBanner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : 'bg-sky-500/15 border-sky-500/40 text-sky-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{toastBanner.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastBanner(null)}
            className="text-current opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ==================== TAB 1: CHAT GLOBAL ==================== */}
      {mainTab === 'global' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[640px] sm:h-[680px]">
          {/* Global Sub-header + Admin Moderation Bar */}
          <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                <Globe className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">Ruang Grup Global Bank Nusantara</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                    {accounts.length} Nasabah
                  </span>
                  {globalChatConfig.adminOnlyLock && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      Mode Khusus Admin
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  Semua nasabah dapat saling berdiskusi di sini • Fitur Kirim &amp; Minta Uang khusus di tab Chat Privat
                </p>
              </div>
            </div>

            {isAdminUser && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const res = await toggleGlobalChatAdminLock(!globalChatConfig.adminOnlyLock);
                    showToast(res.message, 'info');
                  }}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                    globalChatConfig.adminOnlyLock
                      ? 'bg-amber-500 text-slate-950 border-amber-400 hover:bg-amber-400'
                      : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    {globalChatConfig.adminOnlyLock
                      ? 'Buka Chat Nasabah'
                      : 'Kunci Khusus Admin'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Pinned Announcement Bar */}
          {pinnedGlobalMessages.length > 0 && (
            <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/25 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <Pin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 text-xs">
                  <span className="font-bold text-amber-300 mr-1.5">
                    Disematkan ({pinnedGlobalMessages[pinnedGlobalMessages.length - 1].senderName}):
                  </span>
                  <span className="text-slate-200 break-words">
                    {pinnedGlobalMessages[pinnedGlobalMessages.length - 1].text}
                  </span>
                </div>
              </div>
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() =>
                    void togglePinGlobalChatMessage(
                      pinnedGlobalMessages[pinnedGlobalMessages.length - 1].id
                    )
                  }
                  className="text-[11px] font-semibold text-amber-300 hover:text-amber-200 whitespace-nowrap cursor-pointer"
                >
                  Lepas Pin
                </button>
              )}
            </div>
          )}

          {/* Global Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
            {orderedGlobalChats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2 py-12">
                <Globe className="w-10 h-10 text-slate-600" />
                <p className="font-semibold text-slate-200">Belum ada percakapan di Chat Global</p>
                <p>Jadilah yang pertama menyapa nasabah Bank Nusantara lainnya!</p>
              </div>
            ) : (
              orderedGlobalChats.map((msg) => {
                const isMine =
                  (msg.senderAccountId && msg.senderAccountId === currentAccount.id) ||
                  (msg.senderAccount && msg.senderAccount === currentAccount.accountNumber);
                const isMsgAdmin = msg.senderRole === 'admin';
                const canDelete = isMine || isAdminUser;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`group max-w-[88%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md border ${
                        isMsgAdmin
                          ? 'bg-amber-500/15 border-amber-400/40 text-amber-50'
                          : isMine
                          ? 'bg-blue-600 border-blue-500 text-white rounded-tr-sm'
                          : 'bg-slate-800/95 border-slate-700/80 text-slate-100 rounded-tl-sm'
                      }`}
                    >
                      {/* Sender Header */}
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`font-bold text-[11px] ${
                              isMsgAdmin
                                ? 'text-amber-300'
                                : isMine
                                ? 'text-blue-100'
                                : 'text-sky-300'
                            }`}
                          >
                            {msg.senderName}
                          </span>
                          {isMsgAdmin && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] font-black tracking-wide">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              ADMIN RESMI
                            </span>
                          )}
                          {!isMsgAdmin && msg.isVerified && (
                            <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                          )}
                          {msg.isPinned && (
                            <Pin className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] opacity-70 tabular-nums shrink-0">
                          {formatShortTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Reply Quote */}
                      {msg.replyToPreview && (
                        <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-black/25 border-l-2 border-sky-400 text-[11px]">
                          <span className="font-bold text-sky-300 block">
                            Membalas {msg.replyToSender || 'Pesan'}
                          </span>
                          <span className="text-slate-300 line-clamp-2">{msg.replyToPreview}</span>
                        </div>
                      )}

                      {/* Message Body */}
                      <p className="leading-relaxed whitespace-pre-wrap break-words text-[13px]">
                        {msg.text}
                      </p>

                      {/* Action Row (Reply / Pin / Delete) */}
                      <div className="flex items-center justify-end gap-2.5 mt-1.5 pt-1 border-t border-white/10 text-[10px]">
                        <button
                          type="button"
                          onClick={() => setGlobalReplyTarget(msg)}
                          className="inline-flex items-center gap-1 opacity-80 hover:opacity-100 cursor-pointer"
                        >
                          <Reply className="w-3 h-3" />
                          <span>Balas</span>
                        </button>
                        {isAdminUser && (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await togglePinGlobalChatMessage(msg.id);
                              showToast(res.message, 'info');
                            }}
                            className="inline-flex items-center gap-1 text-amber-300 hover:text-amber-200 cursor-pointer"
                          >
                            {msg.isPinned ? (
                              <>
                                <PinOff className="w-3 h-3" />
                                <span>Lepas Pin</span>
                              </>
                            ) : (
                              <>
                                <Pin className="w-3 h-3" />
                                <span>Pin</span>
                              </>
                            )}
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => void deleteGlobalChatMessage(msg.id)}
                            className="inline-flex items-center gap-1 text-rose-300 hover:text-rose-200 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={globalEndRef} />
          </div>

          {/* Reply Preview Bar */}
          {globalReplyTarget && (
            <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-sky-400">
                  Membalas {globalReplyTarget.senderName}
                </span>
                <p className="text-slate-300 truncate">{globalReplyTarget.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setGlobalReplyTarget(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Global Input Box */}
          {globalChatConfig.adminOnlyLock && !isAdminUser ? (
            <div className="p-4 border-t border-slate-800 bg-amber-500/10 text-amber-200 text-xs font-semibold flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Ruang Chat Global sedang dalam Mode Khusus Admin sementara.</span>
            </div>
          ) : (
            <form
              onSubmit={handleSendGlobal}
              className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2"
            >
              <input
                type="text"
                value={globalText}
                onChange={(e) => setGlobalText(e.target.value)}
                placeholder={
                  isAdminUser
                    ? 'Ketik pesan resmi Admin ke ruang Chat Global...'
                    : 'Ketik pesan ke semua nasabah di Chat Global...'
                }
                maxLength={1000}
                className="flex-1 min-h-[44px] bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={!globalText.trim() || globalSending || (!isAdminUser && globalCooldownLeft > 0)}
                className="min-h-[44px] px-4 sm:px-5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition"
              >
                {!isAdminUser && globalCooldownLeft > 0 ? (
                  <span className="tabular-nums">Tunggu {globalCooldownLeft}d</span>
                ) : (
                  <>
                    <span>Kirim</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* ==================== TAB 2: CHAT PRIVAT (1-ON-1 & GRUP PRIVAT) ==================== */}
      {mainTab === 'private' && (
        <div className="bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[340px_1fr] h-[640px] sm:h-[680px]">
          {/* LEFT SIDEBAR: CONTACTS & GROUPS */}
          <div
            className={`${
              activeTarget ? 'hidden md:flex' : 'flex'
            } flex-col border-r border-slate-800 bg-slate-950/75 min-h-0`}
          >
            {/* Action Buttons: Tambah Nasabah & Tambah Grup */}
            <div className="p-3 border-b border-slate-800 space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setContactCustomName('');
                    setContactUserIdInput('');
                    setContactAccNoInput('');
                    setShowAddContactModal(true);
                  }}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm transition"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  <span>Tambah Nasabah</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGroupNameInput('');
                    setGroupIconKey('users');
                    setGroupAccentColor('indigo');
                    setGroupSelectedMemberIds([]);
                    setGroupQuickLookup('');
                    setShowCreateGroupModal(true);
                  }}
                  className="min-h-[42px] px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer shadow-sm transition"
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Tambah Grup</span>
                </button>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, User ID, No. Rek, atau grup..."
                  className="w-full min-h-[38px] bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Filter Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                {(['all', 'dm', 'group'] as PrivateFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setPrivateFilter(f)}
                    className={`py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      privateFilter === f
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f === 'all' ? 'Semua' : f === 'dm' ? 'Personal' : 'Grup'}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSidebarItems.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs space-y-2">
                  <Lock className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="font-semibold text-slate-200">Belum ada obrolan privat</p>
                  <p>
                    Klik <strong>Tambah Nasabah</strong> (pakai User ID atau No. Rekening) atau{' '}
                    <strong>Tambah Grup</strong> untuk mulai chat tertutup.
                  </p>
                </div>
              ) : (
                filteredSidebarItems.map((item) => {
                  const isSelected =
                    activeTarget?.type === item.type && activeTarget?.id === item.id;
                  return (
                    <button
                      key={`${item.type}:${item.id}`}
                      type="button"
                      onClick={() =>
                        setActiveTarget({
                          type: item.type,
                          id: item.id,
                          accountNumber: item.accountNumber,
                        })
                      }
                      className={`w-full p-2.5 rounded-xl text-left transition flex items-center gap-3 cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500/50 text-white'
                          : 'border-transparent hover:bg-slate-900/90 text-slate-200'
                      }`}
                    >
                      {item.type === 'group' ? (
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getGroupColorClass(
                            item.accentColor || 'indigo'
                          )}`}
                        >
                          {renderGroupIcon(item.iconKey || 'users', 'w-5 h-5')}
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 text-amber-300 font-bold flex items-center justify-center shrink-0 text-sm">
                          {item.avatarChar}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs truncate text-white">
                            {item.displayName}
                          </span>
                          <span className="text-[10px] text-slate-400 tabular-nums shrink-0">
                            {item.lastMessageTime}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-[11px] text-slate-400 truncate">
                            {item.lastMessagePreview}
                          </p>
                          {item.unreadCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black tabular-nums shrink-0">
                              {item.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Privacy Footer */}
            <div className="px-3 py-2.5 border-t border-slate-800 bg-slate-950 text-[10px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Privasi penuh: hanya peserta obrolan / anggota grup yang dapat melihat pesan.</span>
            </div>
          </div>

          {/* RIGHT PANE: CONVERSATION WINDOW */}
          <div
            className={`${
              activeTarget ? 'flex' : 'hidden md:flex'
            } flex-col min-h-0 bg-slate-900/60`}
          >
            {!activeTarget ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-emerald-400">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="text-base font-bold text-white">Chat Privat &amp; Grup Tertutup</h3>
                  <p className="text-xs leading-relaxed">
                    Pilih percakapan di sebelah kiri, atau klik <strong>Tambah Nasabah</strong> /{' '}
                    <strong>Tambah Grup</strong> untuk mulai mengobrol dan mengirim uang secara privat.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Conversation Header */}
                <div className="px-3 sm:px-4 py-3 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveTarget(null)}
                      className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 cursor-pointer shrink-0"
                      aria-label="Kembali ke daftar chat"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    {activeTarget.type === 'group' && activeGroup ? (
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${getGroupColorClass(
                          activeGroup.accentColor
                        )}`}
                      >
                        {renderGroupIcon(activeGroup.iconKey, 'w-4 h-4')}
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 font-bold flex items-center justify-center shrink-0">
                        {(
                          activeDmSavedContact?.customName ||
                          activeDmAccount?.fullName ||
                          'N'
                        ).charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="font-bold text-white text-sm truncate">
                        {activeTarget.type === 'group' && activeGroup
                          ? activeGroup.name
                          : activeDmSavedContact?.customName ||
                            activeDmAccount?.fullName ||
                            `Rek ${activeTarget.accountNumber || activeTarget.id}`}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate font-mono">
                        {activeTarget.type === 'group' && activeGroup
                          ? `${activeGroup.memberAccountIds.length} anggota • Grup Privat`
                          : `Rek: ${activeDmAccount?.accountNumber || activeTarget.accountNumber || '-'}${
                              activeDmAccount?.userId16
                                ? ` • ID: ${activeDmAccount.userId16}`
                                : ''
                            }`}
                      </p>
                    </div>
                  </div>

                  {/* Header Actions: Kirim Uang, Minta Uang, Info Grup */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => openMoneyModal(false)}
                      className="min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Kirim Uang</span>
                      <span className="sm:hidden">Kirim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openMoneyModal(true)}
                      className="min-h-[36px] px-2.5 sm:px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer transition"
                    >
                      <HandCoins className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Minta Uang</span>
                      <span className="sm:hidden">Minta</span>
                    </button>
                    {activeTarget.type === 'group' && activeGroup && (
                      <button
                        type="button"
                        onClick={() => {
                          setRenameGroupInput(activeGroup.name);
                          setGroupAddLookupInput('');
                          setConfirmDeleteGroupStep(false);
                          setShowGroupInfoModal(true);
                        }}
                        className="min-h-[36px] px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Info & Pengaturan Grup"
                      >
                        <Info className="w-4 h-4" />
                        <span className="hidden lg:inline">Info Grup</span>
                      </button>
                    )}
                    {activeTarget.type === 'dm' && activeDmSavedContact && (
                      <button
                        type="button"
                        onClick={() => {
                          const res = removePrivateChatContact(activeDmSavedContact.targetAccountId);
                          showToast(res.message, 'info');
                        }}
                        className="min-h-[36px] px-2 py-1.5 bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700 rounded-lg text-xs cursor-pointer"
                        title="Hapus dari daftar kontak tersimpan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Private Messages Thread */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/35">
                  {activePrivateMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 text-xs space-y-2 py-10">
                      <Sparkles className="w-8 h-8 text-slate-600" />
                      <p className="font-semibold text-slate-200">Ruang obrolan privat siap digunakan</p>
                      <p>Kirim pesan teks, kirim uang langsung, atau minta patungan di sini.</p>
                    </div>
                  ) : (
                    activePrivateMessages.map((msg) => {
                      const isMine =
                        (msg.senderAccountId && msg.senderAccountId === currentAccount.id) ||
                        msg.senderAccount === currentAccount.accountNumber;
                      const att = msg.transferAttachment;
                      const canPayRequest =
                        att && att.isRequest && att.status !== 'paid' && !isMine;

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[88%] sm:max-w-[72%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md border ${
                              isMine
                                ? 'bg-blue-600 border-blue-500 text-white rounded-tr-sm'
                                : 'bg-slate-800/95 border-slate-700 text-slate-100 rounded-tl-sm'
                            }`}
                          >
                            {/* Sender name in Group chats */}
                            {activeTarget.type === 'group' && !isMine && (
                              <span className="block text-[11px] font-bold text-amber-300 mb-1">
                                {msg.senderName}
                              </span>
                            )}

                            {/* Reply Quote */}
                            {msg.replyToPreview && (
                              <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-black/25 border-l-2 border-sky-300 text-[11px]">
                                <span className="font-bold text-sky-200 block">
                                  {msg.replyToSender || 'Balasan'}
                                </span>
                                <span className="opacity-85 line-clamp-2">{msg.replyToPreview}</span>
                              </div>
                            )}

                            {/* Transfer / Money Request Attachment */}
                            {att && (
                              <div
                                className={`mb-2 p-2.5 rounded-xl border space-y-1.5 ${
                                  att.isRequest
                                    ? 'bg-amber-950/50 border-amber-400/40'
                                    : 'bg-emerald-950/50 border-emerald-400/40'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
                                  <span className={att.isRequest ? 'text-amber-300' : 'text-emerald-300'}>
                                    {att.isRequest
                                      ? att.status === 'paid'
                                        ? 'PERMINTAAN DANA • LUNAS'
                                        : 'PERMINTAAN DANA (MINTA UANG)'
                                      : 'TRANSFER DANA BERHASIL'}
                                  </span>
                                  <span className="font-mono opacity-80">{att.referenceNo}</span>
                                </div>
                                <div className="font-mono text-base font-extrabold text-white tabular-nums">
                                  {formatRupiah(att.amount)}
                                </div>
                                {att.targetName && (
                                  <div className="text-[11px] text-slate-200">
                                    Tujuan: <strong>{att.targetName}</strong>
                                  </div>
                                )}
                                {att.note && (
                                  <div className="text-[11px] text-slate-300 italic">
                                    &ldquo;{att.note}&rdquo;
                                  </div>
                                )}
                                {att.status === 'paid' && att.paidByName && (
                                  <div className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    <span>Dilunasi oleh {att.paidByName}</span>
                                  </div>
                                )}
                                {canPayRequest && (
                                  <button
                                    type="button"
                                    onClick={() => handlePayIncomingRequest(msg)}
                                    className="w-full mt-1 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer transition"
                                  >
                                    Bayar Sekarang ({formatRupiah(att.amount)})
                                  </button>
                                )}
                              </div>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap break-words text-[13px]">
                              {msg.text}
                            </p>

                            <div className="flex items-center justify-between gap-3 mt-1.5 text-[10px] opacity-75">
                              <button
                                type="button"
                                onClick={() => setPrivateReplyTarget(msg)}
                                className="inline-flex items-center gap-1 hover:opacity-100 cursor-pointer"
                              >
                                <Reply className="w-3 h-3" />
                                <span>Balas</span>
                              </button>
                              <div className="flex items-center gap-1 tabular-nums">
                                <span>{formatShortTime(msg.timestamp)}</span>
                                {isMine && <CheckCheck className="w-3 h-3 text-sky-200" />}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={privateEndRef} />
                </div>

                {/* Private Reply Preview */}
                {privateReplyTarget && (
                  <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <span className="text-[11px] font-bold text-emerald-400">
                        Membalas {privateReplyTarget.senderName}
                      </span>
                      <p className="text-slate-300 truncate">{privateReplyTarget.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPrivateReplyTarget(null)}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Private Input Box */}
                <form
                  onSubmit={handleSendPrivateMessage}
                  className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={privateText}
                    onChange={(e) => setPrivateText(e.target.value)}
                    placeholder={
                      activeTarget.type === 'group' && activeGroup
                        ? `Ketik pesan ke grup ${activeGroup.name}...`
                        : 'Ketik pesan privat...'
                    }
                    maxLength={1500}
                    className="flex-1 min-h-[44px] bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={!privateText.trim()}
                    className="min-h-[44px] px-4 sm:px-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition"
                  >
                    <span>Kirim</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: TAMBAH NASABAH (3 KOLOM — ISI SALAH SATU) ==================== */}
      {showAddContactModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveNewContact}
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-400" />
                  <span>Tambah Nasabah ke Chat Privat</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-1">
                  Cukup isi <strong>salah satu</strong>: <strong>User ID</strong> atau{' '}
                  <strong>No. Rekening</strong>. Nama panggilan bersifat opsional.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 3 KOLOM INPUT SESUAI PERMINTAAN */}
            <div className="space-y-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  1. Nama <span className="text-slate-500 font-normal">(Opsional)</span>
                </label>
                <input
                  type="text"
                  value={contactCustomName}
                  onChange={(e) => setContactCustomName(e.target.value)}
                  placeholder="Kosongkan untuk memakai nama terdaftar otomatis"
                  maxLength={60}
                  className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    2. User ID <span className="text-sky-400 font-normal">(Pilih salah satu)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={contactUserIdInput}
                    onChange={(e) => setContactUserIdInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
                    placeholder="16 digit User ID"
                    className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    3. No. Rekening <span className="text-sky-400 font-normal">(Atau ini)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={contactAccNoInput}
                    onChange={(e) => setContactAccNoInput(e.target.value.replace(/\D/g, '').slice(0, 14))}
                    placeholder="10 digit No. Rek"
                    className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* LIVE AUTO-LOOKUP PREVIEW CARD */}
            {addContactLookup.status === 'found' && addContactLookup.account && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0">
                  {addContactLookup.account.fullName.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-emerald-200 truncate">
                      {addContactLookup.account.fullName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-100 text-[9px] font-bold uppercase">
                      {addContactLookup.account.cardTier}
                    </span>
                  </div>
                  <p className="text-[10px] text-emerald-200/80 font-mono truncate">
                    Rek: {addContactLookup.account.accountNumber}
                    {addContactLookup.account.userId16
                      ? ` • ID: ${addContactLookup.account.userId16}`
                      : ''}
                  </p>
                </div>
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              </div>
            )}

            {(addContactLookup.status === 'not_found' ||
              addContactLookup.status === 'mismatch' ||
              addContactLookup.status === 'self') && (
              <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-[11px] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addContactLookup.error}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={addContactLookup.status !== 'found'}
                className="flex-1 min-h-[42px] py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-45 text-white font-bold rounded-xl cursor-pointer transition"
              >
                Simpan &amp; Mulai Chat
              </button>
              <button
                type="button"
                onClick={() => setShowAddContactModal(false)}
                className="px-4 min-h-[42px] py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: TAMBAH GRUP PRIVAT ==================== */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateGroupSubmit}
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>Buat Grup Privat Baru</span>
                </h3>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Hanya anggota grup yang dapat membaca isi obrolan &amp; bertransaksi di dalamnya.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nama Grup */}
            <div>
              <label className="text-slate-300 font-bold block mb-1">Nama Grup</label>
              <input
                type="text"
                required
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                placeholder="Contoh: Keluarga Besar, Tim Bisnis, Arisan..."
                maxLength={80}
                className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Ikon & Warna Grup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Ikon Grup</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {GROUP_ICON_OPTIONS.map(({ key, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setGroupIconKey(key)}
                      className={`h-9 rounded-lg flex items-center justify-center border cursor-pointer transition ${
                        groupIconKey === key
                          ? 'bg-emerald-600/30 border-emerald-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5">Warna Ikon</label>
                <div className="grid grid-cols-6 gap-1.5">
                  {GROUP_COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setGroupAccentColor(c.key)}
                      className={`h-9 rounded-lg ${c.bgClass} flex items-center justify-center cursor-pointer transition ${
                        groupAccentColor === c.key ? `ring-2 ring-offset-2 ring-offset-slate-900 ${c.ringClass}` : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {groupAccentColor === c.key && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Tambah cepat anggota lewat User ID atau No. Rekening */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">
                Tambah Anggota via User ID / No. Rekening
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={groupQuickLookup}
                  onChange={(e) => setGroupQuickLookup(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Ketik User ID (16 digit) atau No. Rek..."
                  className="flex-1 min-h-[40px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  disabled={!groupQuickPreview || groupQuickPreview.id === currentAccount.id}
                  onClick={() => {
                    if (!groupQuickPreview || groupQuickPreview.id === currentAccount.id) return;
                    setGroupSelectedMemberIds((prev) =>
                      prev.includes(groupQuickPreview.id) ? prev : [...prev, groupQuickPreview.id]
                    );
                    setGroupQuickLookup('');
                  }}
                  className="px-3.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-bold whitespace-nowrap cursor-pointer"
                >
                  + Pilih
                </button>
              </div>
              {groupQuickPreview && groupQuickPreview.id !== currentAccount.id && (
                <div className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>
                    Ditemukan: <strong>{groupQuickPreview.fullName}</strong> (Rek{' '}
                    {groupQuickPreview.accountNumber})
                  </span>
                </div>
              )}
            </div>

            {/* Pilih dari Daftar Kontak Tersimpan / Nasabah */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-slate-300 font-bold">
                  Pilih Anggota ({groupSelectedMemberIds.length} dipilih)
                </label>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1 bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                {accounts
                  .filter((a) => a.id !== currentAccount.id)
                  .map((acc) => {
                    const checked = groupSelectedMemberIds.includes(acc.id);
                    const saved = mySavedContacts.find((c) => c.targetAccountId === acc.id);
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() =>
                          setGroupSelectedMemberIds((prev) =>
                            prev.includes(acc.id)
                              ? prev.filter((id) => id !== acc.id)
                              : [...prev, acc.id]
                          )
                        }
                        className={`w-full px-3 py-2 rounded-lg text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                          checked
                            ? 'bg-emerald-600/25 border border-emerald-500/40 text-white'
                            : 'hover:bg-slate-900 text-slate-300 border border-transparent'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold block truncate">
                            {saved?.customName ? `${saved.customName} (${acc.fullName})` : acc.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            Rek {acc.accountNumber}
                          </span>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 ${
                            checked
                              ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                              : 'border-slate-600'
                          }`}
                        >
                          {checked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={!groupNameInput.trim() || groupSelectedMemberIds.length === 0}
                className="flex-1 min-h-[42px] py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-bold rounded-xl cursor-pointer transition"
              >
                Buat Grup ({groupSelectedMemberIds.length + 1} Anggota)
              </button>
              <button
                type="button"
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 min-h-[42px] py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================== MODAL: INFO & PENGATURAN GRUP ==================== */}
      {showGroupInfoModal && activeGroup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${getGroupColorClass(
                    activeGroup.accentColor
                  )}`}
                >
                  {renderGroupIcon(activeGroup.iconKey, 'w-5 h-5')}
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-base text-white truncate">{activeGroup.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {activeGroupMembers.length} anggota • Grup Privat
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupInfoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ubah Nama Grup */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">Ubah Nama Grup</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={renameGroupInput}
                  onChange={(e) => setRenameGroupInput(e.target.value)}
                  maxLength={80}
                  className="flex-1 min-h-[40px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-xs"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await renamePrivateChatGroup(activeGroup.id, renameGroupInput);
                    showToast(res.message, res.success ? 'success' : 'error');
                  }}
                  className="px-3.5 min-h-[40px] rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Simpan</span>
                </button>
              </div>
            </div>

            {/* Tambah Anggota Baru via User ID / No. Rekening */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">
                Tambah Anggota Baru (User ID / No. Rekening)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={groupAddLookupInput}
                  onChange={(e) =>
                    setGroupAddLookupInput(e.target.value.replace(/\D/g, '').slice(0, 16))
                  }
                  placeholder="Masukkan User ID atau No. Rek..."
                  className="flex-1 min-h-[40px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-white font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={!groupInfoAddPreview}
                  onClick={async () => {
                    if (!groupInfoAddPreview) return;
                    const res = await addMemberToPrivateGroup(activeGroup.id, groupInfoAddPreview.id);
                    showToast(res.message, res.success ? 'success' : 'error');
                    if (res.success) setGroupAddLookupInput('');
                  }}
                  className="px-3.5 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-45 text-white font-bold whitespace-nowrap cursor-pointer"
                >
                  + Tambah
                </button>
              </div>
              {groupInfoAddPreview && (
                <p className="text-[11px] text-emerald-300">
                  Ditemukan: <strong>{groupInfoAddPreview.fullName}</strong> (Rek{' '}
                  {groupInfoAddPreview.accountNumber})
                </p>
              )}
            </div>

            {/* Daftar Anggota */}
            <div className="space-y-1.5">
              <label className="text-slate-300 font-bold block">
                Daftar Anggota ({activeGroupMembers.length})
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1.5 bg-slate-950/70 border border-slate-800 rounded-xl p-2">
                {activeGroupMembers.map((member) => {
                  const isCreator = member.id === activeGroup.creatorAccountId;
                  const canKick =
                    activeGroup.creatorAccountId === currentAccount.id &&
                    member.id !== currentAccount.id;
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-slate-900/90 border border-slate-800"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white truncate">
                            {member.fullName}
                            {member.id === currentAccount.id ? ' (Anda)' : ''}
                          </span>
                          {isCreator && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                              <Crown className="w-2.5 h-2.5" />
                              Pembuat
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Rek {member.accountNumber}
                        </span>
                      </div>
                      {canKick && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await removeMemberFromPrivateGroup(activeGroup.id, member.id);
                            showToast(res.message, res.success ? 'info' : 'error');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          Keluarkan
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Keluar Grup & Hapus Grup (Khusus Pembuat) */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={async () => {
                  const res = await leavePrivateChatGroup(activeGroup.id);
                  showToast(res.message, 'info');
                  setShowGroupInfoModal(false);
                  setActiveTarget(null);
                }}
                className="w-full min-h-[40px] py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar dari Grup</span>
              </button>

              {activeGroup.creatorAccountId === currentAccount.id && (
                !confirmDeleteGroupStep ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteGroupStep(true)}
                    className="w-full min-h-[40px] py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Hapus Grup Permanen</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 space-y-2">
                    <p className="text-[11px] text-rose-200 font-semibold">
                      Yakin ingin menghapus grup &ldquo;{activeGroup.name}&rdquo; beserta seluruh riwayat pesannya?
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await deletePrivateChatGroup(activeGroup.id);
                          showToast(res.message, res.success ? 'info' : 'error');
                          setShowGroupInfoModal(false);
                          setActiveTarget(null);
                        }}
                        className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                      >
                        Ya, Hapus Grup
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteGroupStep(false)}
                        className="px-3 py-2 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: KIRIM / MINTA UANG (PRIVAT & GRUP) ==================== */}
      {showMoneyModal && activeTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmMoneyModal}
            className="bg-slate-900 border border-slate-700 text-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl space-y-4 text-xs"
          >
            <div className="text-center">
              <h3 className="font-extrabold text-base text-white">
                {isRequestMoneyMode ? 'Minta Uang (Split Bill)' : 'Kirim Uang di Chat Privat'}
              </h3>
              <p className="text-slate-400 text-[11px] mt-0.5">
                {activeTarget.type === 'group' && activeGroup
                  ? `Ruang Grup: ${activeGroup.name}`
                  : `Kepada: ${
                      activeDmSavedContact?.customName || activeDmAccount?.fullName || 'Nasabah'
                    }`}
              </p>
            </div>

            <div className="space-y-3">
              {activeTarget.type === 'group' && activeGroup && (
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {isRequestMoneyMode ? 'Ditujukan ke Anggota (Opsional):' : 'Pilih Anggota Tujuan:'}
                  </label>
                  <select
                    value={moneyGroupTargetAccountId}
                    onChange={(e) => setMoneyGroupTargetAccountId(e.target.value)}
                    required={!isRequestMoneyMode}
                    className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                  >
                    {isRequestMoneyMode && <option value="">Semua Anggota Grup (Patungan)</option>}
                    {activeGroupMembers
                      .filter((m) => m.id !== currentAccount.id)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.fullName} (Rek {m.accountNumber})
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-slate-300 font-bold block mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  min={1000}
                  step={1000}
                  required
                  value={moneyAmountInput}
                  onChange={(e) => setMoneyAmountInput(e.target.value)}
                  placeholder="50000"
                  className="w-full min-h-[44px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white font-mono text-base focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Catatan:</label>
                <input
                  type="text"
                  value={moneyNoteInput}
                  onChange={(e) => setMoneyNoteInput(e.target.value)}
                  placeholder="Contoh: Patungan makan siang"
                  maxLength={120}
                  className="w-full min-h-[42px] bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-white text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className={`flex-1 min-h-[42px] py-2.5 font-bold rounded-xl text-xs cursor-pointer shadow-lg ${
                  isRequestMoneyMode
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isRequestMoneyMode ? 'Kirim Permintaan' : 'Lanjut ke PIN Kartu'}
              </button>
              <button
                type="button"
                onClick={() => setShowMoneyModal(false)}
                className="px-4 min-h-[42px] py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SECURE PIN PROMPT */}
      <PinPromptModal
        isOpen={showPinPrompt}
        title="Otorisasi PIN Kartu Debit"
        description={pinDescription}
        targetAccountName={currentAccount.fullName}
        cardNumberSnippet={currentAccount.cardNumber}
        expectedPin={currentAccount.pin}
        onSuccess={executeTransferAfterPin}
        onCancel={() => {
          setShowPinPrompt(false);
          setPendingPayRequestMsg(null);
        }}
      />
    </div>
  );
};
