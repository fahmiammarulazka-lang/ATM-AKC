import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  MoreVertical,
  Trash2,
  Flag,
  Send,
  Type,
  Image as ImageIcon,
  Video as VideoIcon,
  Mic,
  Square,
  ShieldCheck,
  Pin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Lock,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { ChatStatusEntry, ChatStatusPrivacy, ChatStatusType } from '../types/bank';
import { STATUS_BG_THEMES } from '../data/socialAndBankingExtrasCatalog';
import { VerifiedBadge } from './VerifiedBadge';
import { CustomVoicePlayer } from './ChatMediaComponents';
import {
  blobToDataUrl,
  compressChatImageFileToBlob,
  encodePcmFloatToWavBlob,
  extractAudioDurationAndPeaks,
  extractPeaksFromPcm,
  tryConvertAudioBlobToUniversalWav,
  uploadChatMediaToServer,
} from '../utils/chatMediaUtils';

const QUICK_REACTIONS = ['❤️', '🔥', '😂', '😮', '👏', '💎'];

function formatRelativeAgo(ms: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'Baru saja';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min} menit lalu`;
  const hr = Math.floor(min / 60);
  return `${hr} jam lalu`;
}

export const ChatStatusTab: React.FC<{
  onOpenPrivateDmWithAccount?: (accountId: string) => void;
}> = ({ onOpenPrivateDmWithAccount }) => {
  const {
    currentAccount,
    accounts,
    chats,
    chatStatuses,
    socialChatPreferencesMap,
    createChatStatus,
    viewChatStatus,
    reactChatStatus,
    replyChatStatusToDm,
    deleteChatStatus,
    reportChatStatus,
    updateSocialChatPreferences,
    toggleMuteStatusAuthor,
  } = useBank();

  const [nowMs, setNowMs] = useState(() => Date.now());
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showMutedSection, setShowMutedSection] = useState(false);
  const [openMenuAuthorId, setOpenMenuAuthorId] = useState<string | null>(null);

  // Create Status Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<ChatStatusType>('text');
  const [statusText, setStatusText] = useState('');
  const [statusCaption, setStatusCaption] = useState('');
  const [bgThemeId, setBgThemeId] = useState('emerald');
  const [fontStyle, setFontStyle] = useState<'sans' | 'serif' | 'mono' | 'bold'>('sans');
  const [statusPrivacy, setStatusPrivacy] = useState<ChatStatusPrivacy>('all');
  const [pinAsAdminBanner, setPinAsAdminBanner] = useState(false);
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaMime, setMediaMime] = useState('');
  const [mediaDurationSec, setMediaDurationSec] = useState(0);
  const [mediaPeaks, setMediaPeaks] = useState<number[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  // Mic voice recorder for Audio Status
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [micLevel, setMicLevel] = useState(0);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Viewer Modal state
  const [viewerQueue, setViewerQueue] = useState<ChatStatusEntry[]>([]);
  const [viewerIdx, setViewerIdx] = useState(0);
  const [viewerPaused, setViewerPaused] = useState(false);
  const [viewerReplyText, setViewerReplyText] = useState('');
  const [showViewerMenu, setShowViewerMenu] = useState(false);
  const [showViewersDrawer, setShowViewersDrawer] = useState(false);
  const [reportPromptOpen, setReportPromptOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(t);
  }, []);

  const isAdminUser = Boolean(
    currentAccount &&
      (currentAccount.cardTier === 'admin' ||
        currentAccount.isOfficialAdminAccount ||
        currentAccount.id === 'acc-admin')
  );

  const myPrefs = currentAccount ? socialChatPreferencesMap[currentAccount.id] : undefined;
  const mutedIds = useMemo(() => new Set(myPrefs?.mutedStatusAccountIds || []), [myPrefs]);

  // Contacts list (for privacy === 'contacts')
  const myContactIds = useMemo(() => {
    const ids = new Set<string>();
    if (!currentAccount) return ids;
    ids.add(currentAccount.id);
    [...(currentAccount.savedChatContacts || []), ...(currentAccount.privateContacts || [])].forEach((c) => {
      const cid = (c as { contactAccountId?: string; accountId?: string }).contactAccountId || (c as { accountId?: string }).accountId;
      if (cid) ids.add(cid);
    });
    chats.forEach((m) => {
      if (m.groupId) return;
      if (m.senderAccountId === currentAccount.id && m.recipientAccountId) ids.add(m.recipientAccountId);
      if (m.recipientAccountId === currentAccount.id && m.senderAccountId) ids.add(m.senderAccountId);
    });
    return ids;
  }, [currentAccount, chats]);

  const activeStatuses = useMemo(() => {
    return chatStatuses
      .filter((s) => {
        if (!s || s.expiresAtMs <= nowMs) return false;
        if (currentAccount && s.authorAccountId === currentAccount.id) return true;
        if (s.isPinnedAdminBanner || isAdminUser) return true;
        if (s.privacy === 'contacts' && currentAccount) {
          return myContactIds.has(s.authorAccountId);
        }
        return true;
      })
      .sort((a, b) => b.createdAtMs - a.createdAtMs);
  }, [chatStatuses, nowMs, currentAccount, isAdminUser, myContactIds]);

  const adminPinnedBanners = useMemo(
    () => activeStatuses.filter((s) => s.isPinnedAdminBanner),
    [activeStatuses]
  );

  const myStatuses = useMemo(
    () => (currentAccount ? activeStatuses.filter((s) => s.authorAccountId === currentAccount.id) : []),
    [activeStatuses, currentAccount]
  );

  const groupedOthers = useMemo(() => {
    const byAuthor = new Map<string, ChatStatusEntry[]>();
    activeStatuses.forEach((s) => {
      if (currentAccount && s.authorAccountId === currentAccount.id) return;
      const arr = byAuthor.get(s.authorAccountId) || [];
      arr.push(s);
      byAuthor.set(s.authorAccountId, arr);
    });
    const result = Array.from(byAuthor.entries()).map(([authorId, items]) => {
      const sorted = [...items].sort((a, b) => a.createdAtMs - b.createdAtMs);
      const latest = sorted[sorted.length - 1];
      const allViewed = Boolean(
        currentAccount && sorted.every((st) => st.views.some((v) => v.viewerAccountId === currentAccount.id))
      );
      return {
        authorId,
        latest,
        items: sorted,
        allViewed,
        isMuted: mutedIds.has(authorId),
      };
    });
    return result.sort((a, b) => b.latest.createdAtMs - a.latest.createdAtMs);
  }, [activeStatuses, currentAccount, mutedIds]);

  const unviewedAuthors = groupedOthers.filter((g) => !g.isMuted && !g.allViewed);
  const viewedAuthors = groupedOthers.filter((g) => !g.isMuted && g.allViewed);
  const mutedAuthors = groupedOthers.filter((g) => g.isMuted);

  const currentViewerStatus = viewerQueue[viewerIdx] || null;

  useEffect(() => {
    if (!currentViewerStatus || !currentAccount) return;
    if (currentViewerStatus.authorAccountId !== currentAccount.id) {
      viewChatStatus(currentViewerStatus.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentViewerStatus?.id]);

  // Auto-advance viewer for text/image
  useEffect(() => {
    if (!currentViewerStatus || viewerPaused || reportPromptOpen || showViewersDrawer) return;
    if (currentViewerStatus.type === 'video' || currentViewerStatus.type === 'audio') return;
    const timer = window.setTimeout(() => {
      if (viewerIdx < viewerQueue.length - 1) {
        setViewerIdx((i) => i + 1);
      } else {
        setViewerQueue([]);
      }
    }, 6000);
    return () => window.clearTimeout(timer);
  }, [currentViewerStatus, viewerIdx, viewerQueue.length, viewerPaused, reportPromptOpen, showViewersDrawer]);

  const stopMicRecording = async (save = true) => {
    if (recordTimerRef.current) {
      window.clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setIsRecordingVoice(false);
    setMicLevel(0);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    const ctx = audioCtxRef.current;
    audioCtxRef.current = null;
    const sampleRate = ctx?.sampleRate || 44100;
    if (ctx) {
      try {
        await ctx.close();
      } catch { /* empty */ }
    }
    if (!save || pcmChunksRef.current.length === 0) {
      pcmChunksRef.current = [];
      return;
    }
    const totalLen = pcmChunksRef.current.reduce((acc, c) => acc + c.length, 0);
    const merged = new Float32Array(totalLen);
    let offset = 0;
    for (const c of pcmChunksRef.current) {
      merged.set(c, offset);
      offset += c.length;
    }
    pcmChunksRef.current = [];
    const wavResult = encodePcmFloatToWavBlob(merged, sampleRate);
    const peaks = extractPeaksFromPcm(merged, 36);
    const dur = Math.max(1, Math.round(totalLen / sampleRate));
    setIsUploadingMedia(true);
    const uploaded = await uploadChatMediaToServer(wavResult.blob, `status-voice-${Date.now()}.wav`, 'audio');
    const url = uploaded.url || (await blobToDataUrl(wavResult.blob));
    setMediaUrl(url);
    setMediaMime('audio/wav');
    setMediaDurationSec(dur);
    setMediaPeaks(peaks);
    setIsUploadingMedia(false);
  };

  const startMicRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      pcmChunksRef.current = [];
      processor.onaudioprocess = (ev) => {
        const input = ev.inputBuffer.getChannelData(0);
        pcmChunksRef.current.push(new Float32Array(input));
        let sum = 0;
        for (let i = 0; i < input.length; i += 8) sum += Math.abs(input[i]);
        setMicLevel(Math.min(100, Math.round((sum / (input.length / 8)) * 280)));
      };
      source.connect(processor);
      processor.connect(ctx.destination);
      setIsRecordingVoice(true);
      setRecordSeconds(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch {
      setFeedback({ type: 'error', text: 'Izin mikrofon ditolak atau tidak tersedia pada perangkat.' });
    }
  };

  const handleSelectStatusFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingMedia(true);
    try {
      if (createType === 'image') {
        const { blob } = await compressChatImageFileToBlob(file);
        const up = await uploadChatMediaToServer(blob, `status-${Date.now()}.jpg`, 'image');
        setMediaUrl(up.url || (await blobToDataUrl(blob)));
        setMediaMime('image/jpeg');
      } else if (createType === 'video') {
        const up = await uploadChatMediaToServer(file, file.name, 'video');
        setMediaUrl(up.url || (await blobToDataUrl(file)));
        setMediaMime(file.type || 'video/mp4');
      } else if (createType === 'audio') {
        const meta = await extractAudioDurationAndPeaks(file);
        const conv = await tryConvertAudioBlobToUniversalWav(file);
        const audioBlob = conv?.blob || file;
        const up = await uploadChatMediaToServer(audioBlob, `status-audio-${Date.now()}.wav`, 'audio');
        setMediaUrl(up.url || (await blobToDataUrl(audioBlob)));
        setMediaMime(conv?.mimeType || file.type || 'audio/wav');
        setMediaDurationSec(meta.durationSec);
        setMediaPeaks(meta.waveformPeaks);
      }
    } catch {
      setFeedback({ type: 'error', text: 'Gagal memproses file media Status.' });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handlePublishStatus = () => {
    const res = createChatStatus({
      type: createType,
      text: createType === 'text' ? statusText : undefined,
      caption: createType !== 'text' ? statusCaption : undefined,
      bgTheme: bgThemeId,
      fontStyle,
      mediaUrl: createType !== 'text' ? mediaUrl : undefined,
      mimeType: mediaMime,
      durationSec: mediaDurationSec,
      waveformPeaks: mediaPeaks,
      privacy: statusPrivacy,
      isPinnedAdminBanner: isAdminUser && pinAsAdminBanner,
    });
    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
    if (res.success) {
      setIsCreateOpen(false);
      setStatusText('');
      setStatusCaption('');
      setMediaUrl('');
      setPinAsAdminBanner(false);
    }
  };

  const openAuthorViewer = (items: ChatStatusEntry[]) => {
    if (items.length === 0) return;
    setViewerQueue(items);
    setViewerIdx(0);
    setViewerPaused(false);
    setShowViewerMenu(false);
    setShowViewersDrawer(false);
    setReportPromptOpen(false);
  };

  if (!currentAccount) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-10 text-center text-slate-400">
        Silakan masuk ke akun rekening Anda untuk melihat dan membuat Status 24 Jam.
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
          <button type="button" onClick={() => setFeedback(null)} className="text-slate-400 hover:text-white">
            Tutup
          </button>
        </div>
      )}

      {/* Admin Pinned Status Banner */}
      {adminPinnedBanners.length > 0 && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/40 p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-black text-amber-300">
            <Pin className="h-4 w-4 shrink-0" />
            <span>Status Pengumuman Tersemat dari Admin</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {adminPinnedBanners.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => openAuthorViewer([b])}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-slate-950/70 px-3 py-2.5 text-left hover:bg-slate-900 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-white truncate">{b.authorName}</span>
                    <VerifiedBadge isVerified={true} size="sm" />
                  </div>
                  <p className="text-[10px] font-mono text-amber-300/80">ID: {b.authorUserId16}</p>
                  <p className="mt-0.5 text-xs text-slate-300 truncate">{b.text || b.caption || `[Status ${b.type.toUpperCase()}]`}</p>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-amber-400">{formatRelativeAgo(b.createdAtMs)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Status Saya + Privasi */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => (myStatuses.length > 0 ? openAuthorViewer(myStatuses) : setIsCreateOpen(true))}
            className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-lg font-black text-white ${
              myStatuses.length > 0
                ? 'border-emerald-400 bg-emerald-950 ring-2 ring-emerald-500/30'
                : 'border-dashed border-slate-600 bg-slate-800'
            }`}
          >
            {currentAccount.fullName.charAt(0).toUpperCase()}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow">
              <Plus className="h-3.5 w-3.5" />
            </span>
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black text-white">Status Saya ({currentAccount.fullName})</p>
              <VerifiedBadge isVerified={Boolean(currentAccount.isVerified || isAdminUser)} size="sm" />
            </div>
            <p className="text-[11px] font-mono text-cyan-300">User ID: {currentAccount.userId16 || currentAccount.accountNumber}</p>
            <p className="text-[11px] text-slate-400">
              {myStatuses.length > 0
                ? `${myStatuses.length} status aktif · hilang otomatis setelah 24 jam`
                : 'Ketuk + untuk bagikan Teks warna, Foto, Video, atau Suara (24 jam)'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={myPrefs?.statusPrivacyDefault || 'all'}
            onChange={(e) => updateSocialChatPreferences({ statusPrivacyDefault: e.target.value as ChatStatusPrivacy })}
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200"
            aria-label="Privasi Status Default"
          >
            <option value="all">🌐 Privasi: Semua Nasabah</option>
            <option value="contacts">🔒 Privasi: Kontak Chat Privat Saja</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setStatusPrivacy(myPrefs?.statusPrivacyDefault || 'all');
              setIsCreateOpen(true);
            }}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
          >
            <Plus className="h-4 w-4" />
            <span>Buat Status 24 Jam</span>
          </button>
        </div>
      </div>

      {/* Pembaruan Terbaru (Belum Dilihat) */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
          Pembaruan Terbaru ({unviewedAuthors.length})
        </h4>
        {unviewedAuthors.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">Belum ada pembaruan Status baru dari nasabah lain.</p>
        ) : (
          <div className="space-y-2">
            {unviewedAuthors.map((grp) => (
              <div
                key={grp.authorId}
                className="relative flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3.5 py-2.5 hover:bg-slate-900 transition"
              >
                <button
                  type="button"
                  onClick={() => openAuthorViewer(grp.items)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-slate-800 text-base font-black text-white ring-2 ring-emerald-500/25">
                    {grp.latest.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-white truncate">{grp.latest.authorName}</p>
                      <VerifiedBadge isVerified={Boolean(grp.latest.isVerified)} size="sm" />
                    </div>
                    <p className="text-[10px] font-mono text-cyan-300">User ID: {grp.latest.authorUserId16}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {formatRelativeAgo(grp.latest.createdAtMs)} · {grp.items.length} status ({grp.latest.type})
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setOpenMenuAuthorId(openMenuAuthorId === grp.authorId ? null : grp.authorId)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
                  aria-label="Menu Status"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {openMenuAuthorId === grp.authorId && (
                  <div className="absolute right-3 top-12 z-20 w-48 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-xl">
                    <button
                      type="button"
                      onClick={() => {
                        const r = toggleMuteStatusAuthor(grp.authorId);
                        setFeedback({ type: 'success', text: r.message });
                        setOpenMenuAuthorId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                      <span>Sembunyikan Status</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Telah Dilihat */}
      {viewedAuthors.length > 0 && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 space-y-3">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Telah Dilihat ({viewedAuthors.length})
          </h4>
          <div className="space-y-2">
            {viewedAuthors.map((grp) => (
              <div
                key={grp.authorId}
                className="relative flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-3.5 py-2.5 hover:bg-slate-900 transition"
              >
                <button
                  type="button"
                  onClick={() => openAuthorViewer(grp.items)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-slate-600 bg-slate-800 text-base font-black text-slate-300">
                    {grp.latest.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-slate-200 truncate">{grp.latest.authorName}</p>
                      <VerifiedBadge isVerified={Boolean(grp.latest.isVerified)} size="sm" />
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">User ID: {grp.latest.authorUserId16}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatRelativeAgo(grp.latest.createdAtMs)} · {grp.items.length} status
                    </p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = toggleMuteStatusAuthor(grp.authorId);
                    setFeedback({ type: 'success', text: r.message });
                  }}
                  className="rounded-lg px-2.5 py-1.5 text-[11px] font-bold text-slate-400 hover:bg-slate-800 hover:text-amber-300"
                >
                  Sembunyikan
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Disembunyikan */}
      {mutedAuthors.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3.5">
          <button
            type="button"
            onClick={() => setShowMutedSection((v) => !v)}
            className="flex w-full items-center justify-between text-xs font-bold text-slate-400 hover:text-white"
          >
            <span>Pembaruan Disembunyikan ({mutedAuthors.length})</span>
            {showMutedSection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showMutedSection && (
            <div className="mt-3 space-y-2">
              {mutedAuthors.map((grp) => (
                <div key={grp.authorId} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
                  <button
                    type="button"
                    onClick={() => openAuthorViewer(grp.items)}
                    className="text-left min-w-0"
                  >
                    <p className="text-xs font-bold text-slate-300 truncate">{grp.latest.authorName}</p>
                    <p className="text-[10px] font-mono text-slate-500">ID: {grp.latest.authorUserId16}</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const r = toggleMuteStatusAuthor(grp.authorId);
                      setFeedback({ type: 'success', text: r.message });
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-slate-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>Tampilkan</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================== MODAL BUAT STATUS 24 JAM ==================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-slate-700 bg-slate-900 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Buat Status Baru (Aktif 24 Jam)</h3>
                <p className="text-[11px] text-slate-400">
                  Nama &amp; User ID Anda ({currentAccount.userId16 || currentAccount.accountNumber}) terlihat jelas seperti WhatsApp
                </p>
              </div>
              <button type="button" onClick={() => setIsCreateOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 rounded-2xl bg-slate-950 p-1">
              {[
                { key: 'text' as const, label: 'Teks Warna', icon: Type },
                { key: 'image' as const, label: 'Foto', icon: ImageIcon },
                { key: 'video' as const, label: 'Video', icon: VideoIcon },
                { key: 'audio' as const, label: 'Suara', icon: Mic },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => {
                      setCreateType(tab.key);
                      setMediaUrl('');
                    }}
                    className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition ${
                      createType === tab.key ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {createType === 'text' && (
              <div className="space-y-3">
                <div
                  className={`flex min-h-[180px] items-center justify-center rounded-2xl p-6 text-center ${
                    (STATUS_BG_THEMES.find((t) => t.id === bgThemeId) || STATUS_BG_THEMES[0]).className
                  }`}
                >
                  <textarea
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="Ketik status warna Anda di sini..."
                    rows={4}
                    className={`w-full resize-none bg-transparent text-center text-lg text-white placeholder:text-white/50 focus:outline-none ${
                      fontStyle === 'serif'
                        ? 'font-serif'
                        : fontStyle === 'mono'
                        ? 'font-mono'
                        : fontStyle === 'bold'
                        ? 'font-black'
                        : 'font-sans'
                    }`}
                  />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {STATUS_BG_THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setBgThemeId(t.id)}
                        className={`h-7 w-7 rounded-full border-2 ${t.className} ${
                          bgThemeId === t.id ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        title={t.label}
                      />
                    ))}
                  </div>
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value as any)}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="sans">Font Modern</option>
                    <option value="bold">Font Tebal</option>
                    <option value="serif">Font Klasik</option>
                    <option value="mono">Font Mono</option>
                  </select>
                </div>
              </div>
            )}

            {(createType === 'image' || createType === 'video') && (
              <div className="space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 p-6 text-xs font-bold text-slate-300 hover:border-emerald-500">
                  <Upload className="h-6 w-6 text-emerald-400" />
                  <span>{isUploadingMedia ? 'Mengompres & mengunggah...' : `Pilih ${createType === 'image' ? 'Foto' : 'Video'} dari Perangkat`}</span>
                  <input
                    type="file"
                    accept={createType === 'image' ? 'image/*' : 'video/*'}
                    onChange={(e) => void handleSelectStatusFile(e)}
                    className="hidden"
                  />
                </label>
                {mediaUrl && createType === 'image' && (
                  <img src={mediaUrl} alt="Pratinjau status" className="max-h-56 w-full rounded-2xl object-contain bg-black" />
                )}
                {mediaUrl && createType === 'video' && (
                  <video src={mediaUrl} controls className="max-h-56 w-full rounded-2xl bg-black" />
                )}
                <input
                  type="text"
                  value={statusCaption}
                  onChange={(e) => setStatusCaption(e.target.value)}
                  placeholder="Tambahkan keterangan Status (opsional)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-white"
                />
              </div>
            )}

            {createType === 'audio' && (
              <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  {!isRecordingVoice ? (
                    <button
                      type="button"
                      onClick={() => void startMicRecording()}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-2 text-xs font-black text-white hover:bg-rose-500"
                    >
                      <Mic className="h-4 w-4" />
                      <span>Rekam Suara Mikrofon</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void stopMicRecording(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-black text-slate-950"
                    >
                      <Square className="h-4 w-4" />
                      <span>Selesai ({recordSeconds}d)</span>
                    </button>
                  )}
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800">
                    <Upload className="h-4 w-4" />
                    <span>Pilih File Audio HP</span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={(e) => void handleSelectStatusFile(e)}
                      className="hidden"
                    />
                  </label>
                </div>
                {isRecordingVoice && (
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-rose-400">Merekam suara aktif...</p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full bg-emerald-400 transition-all" style={{ width: `${micLevel}%` }} />
                    </div>
                  </div>
                )}
                {mediaUrl && (
                  <CustomVoicePlayer
                    src={mediaUrl}
                    durationSec={mediaDurationSec || 5}
                    waveformPeaks={mediaPeaks}
                  />
                )}
                <input
                  type="text"
                  value={statusCaption}
                  onChange={(e) => setStatusCaption(e.target.value)}
                  placeholder="Keterangan Voice Status (opsional)..."
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs text-white"
                />
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusPrivacy(statusPrivacy === 'all' ? 'contacts' : 'all')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-200"
                >
                  {statusPrivacy === 'all' ? <Globe className="h-3.5 w-3.5 text-emerald-400" /> : <Lock className="h-3.5 w-3.5 text-amber-400" />}
                  <span>{statusPrivacy === 'all' ? 'Semua Nasabah' : 'Kontak Chat Privat'}</span>
                </button>
                {isAdminUser && (
                  <label className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinAsAdminBanner}
                      onChange={(e) => setPinAsAdminBanner(e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    <span>Sematkan Banner Admin</span>
                  </label>
                )}
              </div>
              <button
                type="button"
                disabled={isUploadingMedia || isRecordingVoice}
                onClick={handlePublishStatus}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Bagikan Status</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== VIEWER STATUS FULLSCREEN ALA WHATSAPP ==================== */}
      {currentViewerStatus && (
        <div className="fixed inset-0 z-[150] flex flex-col bg-slate-950 text-white">
          {/* Progress bars */}
          <div className="flex gap-1.5 px-4 pt-3">
            {viewerQueue.map((st, i) => (
              <div key={st.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/25">
                <div
                  className={`h-full rounded-full bg-white transition-all ${
                    i < viewerIdx ? 'w-full' : i === viewerIdx ? 'w-full animate-pulse' : 'w-0'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Header Identity (Full Name + User ID 16-digit + Menu ⋮) */}
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 font-black">
                {currentViewerStatus.authorName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-black truncate">{currentViewerStatus.authorName}</span>
                  <VerifiedBadge isVerified={Boolean(currentViewerStatus.isVerified)} size="sm" />
                  {currentViewerStatus.authorRole === 'admin' && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300">
                      <ShieldCheck className="h-3 w-3" /> ADMIN
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-mono text-cyan-300">
                  User ID: {currentViewerStatus.authorUserId16} · {formatRelativeAgo(currentViewerStatus.createdAtMs)}
                </p>
              </div>
            </div>

            <div className="relative flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewerPaused((p) => !p)}
                className="rounded-lg border border-white/20 px-2.5 py-1 text-[11px] font-bold"
              >
                {viewerPaused ? 'Lanjut' : 'Jeda'}
              </button>
              <button
                type="button"
                onClick={() => setShowViewerMenu((m) => !m)}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Menu titik tiga status"
              >
                <MoreVertical className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setViewerQueue([])}
                className="rounded-lg p-2 hover:bg-white/10"
                aria-label="Tutup viewer status"
              >
                <X className="h-5 w-5" />
              </button>

              {showViewerMenu && (
                <div className="absolute right-10 top-11 z-30 w-52 rounded-xl border border-slate-700 bg-slate-900 p-1.5 shadow-2xl">
                  {currentViewerStatus.authorAccountId !== currentAccount.id && (
                    <button
                      type="button"
                      onClick={() => {
                        const r = toggleMuteStatusAuthor(currentViewerStatus.authorAccountId);
                        setFeedback({ type: 'success', text: r.message });
                        setShowViewerMenu(false);
                        setViewerQueue([]);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800"
                    >
                      <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                      <span>
                        {mutedIds.has(currentViewerStatus.authorAccountId)
                          ? 'Tampilkan Status Pengguna'
                          : 'Sembunyikan Status'}
                      </span>
                    </button>
                  )}
                  {(currentViewerStatus.authorAccountId === currentAccount.id || isAdminUser) && (
                    <button
                      type="button"
                      onClick={() => {
                        const res = deleteChatStatus(currentViewerStatus.id);
                        setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                        setShowViewerMenu(false);
                        setViewerQueue([]);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-rose-300 hover:bg-slate-800"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Hapus Status</span>
                    </button>
                  )}
                  {currentViewerStatus.authorAccountId !== currentAccount.id && (
                    <button
                      type="button"
                      onClick={() => {
                        setReportPromptOpen(true);
                        setShowViewerMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-amber-300 hover:bg-slate-800"
                    >
                      <Flag className="h-3.5 w-3.5" />
                      <span>Laporkan ke Admin</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Content Stage */}
          <div className="relative flex-1 flex items-center justify-center p-4 overflow-hidden">
            {viewerIdx > 0 && (
              <button
                type="button"
                onClick={() => setViewerIdx((i) => Math.max(0, i - 1))}
                className="absolute left-3 z-10 rounded-full bg-black/50 p-2 hover:bg-black/80"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            {viewerIdx < viewerQueue.length - 1 && (
              <button
                type="button"
                onClick={() => setViewerIdx((i) => Math.min(viewerQueue.length - 1, i + 1))}
                className="absolute right-3 z-10 rounded-full bg-black/50 p-2 hover:bg-black/80"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {currentViewerStatus.type === 'text' && (
              <div
                className={`flex max-w-xl w-full min-h-[320px] items-center justify-center rounded-3xl p-8 text-center shadow-2xl ${
                  (STATUS_BG_THEMES.find((t) => t.id === currentViewerStatus.bgTheme) || STATUS_BG_THEMES[0]).className
                }`}
              >
                <p
                  className={`text-2xl leading-relaxed break-words ${
                    currentViewerStatus.fontStyle === 'serif'
                      ? 'font-serif'
                      : currentViewerStatus.fontStyle === 'mono'
                      ? 'font-mono'
                      : currentViewerStatus.fontStyle === 'bold'
                      ? 'font-black'
                      : 'font-sans'
                  }`}
                >
                  {currentViewerStatus.text}
                </p>
              </div>
            )}

            {currentViewerStatus.type === 'image' && currentViewerStatus.mediaUrl && (
              <div className="flex flex-col items-center gap-3 max-h-full">
                <img
                  src={currentViewerStatus.mediaUrl}
                  alt={currentViewerStatus.caption || 'Foto Status'}
                  className="max-h-[65vh] rounded-2xl object-contain"
                />
                {currentViewerStatus.caption && (
                  <p className="rounded-xl bg-black/60 px-4 py-2 text-sm text-center">{currentViewerStatus.caption}</p>
                )}
              </div>
            )}

            {currentViewerStatus.type === 'video' && currentViewerStatus.mediaUrl && (
              <div className="flex flex-col items-center gap-3 max-w-2xl w-full">
                <video
                  src={currentViewerStatus.mediaUrl}
                  controls
                  autoPlay
                  className="max-h-[65vh] w-full rounded-2xl bg-black"
                />
                {currentViewerStatus.caption && (
                  <p className="rounded-xl bg-black/60 px-4 py-2 text-sm text-center">{currentViewerStatus.caption}</p>
                )}
              </div>
            )}

            {currentViewerStatus.type === 'audio' && currentViewerStatus.mediaUrl && (
              <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 space-y-4">
                <p className="text-xs font-bold text-emerald-400">Status Suara / Audio</p>
                <CustomVoicePlayer
                  src={currentViewerStatus.mediaUrl}
                  durationSec={currentViewerStatus.durationSec || 5}
                  waveformPeaks={currentViewerStatus.waveformPeaks}
                  caption={currentViewerStatus.caption}
                />
              </div>
            )}
          </div>

          {/* Report Modal */}
          {reportPromptOpen && (
            <div className="mx-auto mb-3 w-full max-w-md rounded-2xl border border-amber-500/40 bg-slate-900 p-4 space-y-2.5">
              <p className="text-xs font-black text-amber-300">Laporkan Status ke Moderasi Admin</p>
              <input
                type="text"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Alasan laporan (misal: Spam / Penipuan / Konten tidak pantas)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportPromptOpen(false)}
                  className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = reportChatStatus(currentViewerStatus.id, reportReason);
                    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                    setReportPromptOpen(false);
                    setReportReason('');
                  }}
                  className="rounded-lg bg-amber-500 px-3.5 py-1.5 text-xs font-black text-slate-950"
                >
                  Kirim Laporan
                </button>
              </div>
            </div>
          )}

          {/* Viewers Drawer (Owner only) */}
          {showViewersDrawer && currentViewerStatus.authorAccountId === currentAccount.id && (
            <div className="mx-auto mb-3 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-4 max-h-52 overflow-y-auto space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-white">
                  Dilihat oleh {currentViewerStatus.views.length} nasabah
                </p>
                <button type="button" onClick={() => setShowViewersDrawer(false)} className="text-xs text-slate-400">
                  Tutup
                </button>
              </div>
              {currentViewerStatus.views.length === 0 ? (
                <p className="text-xs text-slate-500">Belum ada yang melihat Status ini.</p>
              ) : (
                currentViewerStatus.views.map((v) => (
                  <div key={v.viewerAccountId} className="flex items-center justify-between text-xs border-b border-slate-800 pb-1.5">
                    <div>
                      <p className="font-bold text-slate-200">{v.viewerName}</p>
                      <p className="text-[10px] font-mono text-slate-400">ID: {v.viewerUserId16 || '-'}</p>
                    </div>
                    <span className="text-[10px] text-slate-500">{formatRelativeAgo(v.viewedAtMs)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Footer Reactions & Direct Reply to Chat Privat */}
          <div className="border-t border-white/10 bg-slate-900/90 px-4 py-3 space-y-2.5">
            {currentViewerStatus.authorAccountId === currentAccount.id ? (
              <div className="flex items-center justify-between max-w-xl mx-auto">
                <button
                  type="button"
                  onClick={() => setShowViewersDrawer((v) => !v)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-800 px-3.5 py-2 text-xs font-bold text-emerald-300"
                >
                  <Eye className="h-4 w-4" />
                  <span>Dilihat {currentViewerStatus.views.length} orang</span>
                </button>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {Object.entries(currentViewerStatus.reactions || {}).map(([emoji, arr]) =>
                    arr.length > 0 ? (
                      <span key={emoji} className="rounded-lg bg-slate-800 px-2 py-1 text-white">
                        {emoji} {arr.length}
                      </span>
                    ) : null
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-2">
                <div className="flex items-center justify-center gap-2">
                  {QUICK_REACTIONS.map((emoji) => {
                    const count = (currentViewerStatus.reactions?.[emoji] || []).length;
                    return (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          reactChatStatus(currentViewerStatus.id, emoji);
                          setFeedback({ type: 'success', text: `Reaksi ${emoji} terkirim ke Chat Privat ${currentViewerStatus.authorName}!` });
                        }}
                        className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-base transition hover:scale-110 hover:bg-white/20"
                      >
                        {emoji} {count > 0 && <span className="text-[10px] font-bold">{count}</span>}
                      </button>
                    );
                  })}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const res = replyChatStatusToDm(currentViewerStatus.id, viewerReplyText);
                    setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
                    if (res.success) {
                      setViewerReplyText('');
                      const authorId = currentViewerStatus.authorAccountId;
                      setViewerQueue([]);
                      onOpenPrivateDmWithAccount?.(authorId);
                    }
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={viewerReplyText}
                    onChange={(e) => setViewerReplyText(e.target.value)}
                    onFocus={() => setViewerPaused(true)}
                    placeholder={`Balas Status ${currentViewerStatus.authorName} (otomatis ke Chat Privat)...`}
                    className="flex-1 rounded-full border border-white/20 bg-slate-950 px-4 py-2.5 text-xs text-white placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                    aria-label="Kirim balasan ke Chat Privat"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
