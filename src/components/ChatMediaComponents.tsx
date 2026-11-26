/**
 * Bank Nusantara — Komponen Media Chat Kustom (v15.42.49)
 * 1. CustomVoicePlayer (Play/Pause, Waveform Scrubbing Interaktif, 1x/1.5x/2x Speed, Volume, Caption)
 * 2. MediaPreviewModal (Portal Pratinjau Multi-Foto/Video + Tambah/Ganti/Hapus + Keterangan Enter/Ctrl+Enter)
 * 3. VoiceStagingModal (Portal Pratinjau Rekaman/File Audio HP 600d + Dengar Ulang/Geser/Keterangan)
 * 4. EnhancedMediaLightboxModal (Zoom Foto & Video Layar Penuh + Keterangan + Unduh)
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  Plus,
  Trash2,
  RefreshCw,
  Send,
  Download,
  Film,
  Image as ImageIcon,
  Mic,
  FileAudio,
  Loader2,
} from 'lucide-react';
import {
  buildFallbackWaveformPeaks,
  formatFileSizeBytes,
  formatMediaDuration,
  type StagedChatMediaDraft,
  type StagedChatVoiceDraft,
} from '../utils/chatMediaUtils';

const VOICE_PLAY_EVENT = 'bn-chat-voice-play';

// ==================== 1. CUSTOM VOICE PLAYER ====================
export const CustomVoicePlayer: React.FC<{
  src: string;
  durationSec: number;
  waveformPeaks?: number[];
  fileName?: string;
  caption?: string;
  isMine?: boolean;
  compact?: boolean;
}> = ({
  src,
  durationSec,
  waveformPeaks,
  fileName,
  caption,
  isMine = false,
  compact = false,
}) => {
  const playerId = useId();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveTrackRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState<number>(Math.max(1, durationSec || 1));
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [isDraggingWave, setIsDraggingWave] = useState<boolean>(false);

  const bars =
    waveformPeaks && waveformPeaks.length >= 12
      ? waveformPeaks.slice(0, 36)
      : buildFallbackWaveformPeaks(36);

  // Sync single active player across entire chat
  useEffect(() => {
    const onOtherVoicePlay = (ev: Event) => {
      const customEv = ev as CustomEvent<string>;
      if (customEv.detail !== playerId && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
    window.addEventListener(VOICE_PLAY_EVENT, onOtherVoicePlay);
    return () => {
      window.removeEventListener(VOICE_PLAY_EVENT, onOtherVoicePlay);
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, [playerId]);

  useEffect(() => {
    if (durationSec > 0) {
      setResolvedDuration(durationSec);
    }
  }, [durationSec]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.playbackRate = playbackRate;
  }, [playbackRate]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.volume = isMuted ? 0 : volume;
    el.muted = isMuted;
  }, [volume, isMuted]);

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el || !src) return;
    if (el.paused) {
      window.dispatchEvent(new CustomEvent(VOICE_PLAY_EVENT, { detail: playerId }));
      el.playbackRate = playbackRate;
      el.volume = isMuted ? 0 : volume;
      try {
        await el.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      el.pause();
    }
  };

  const seekToSeconds = (sec: number) => {
    const el = audioRef.current;
    const maxDur = Math.max(1, resolvedDuration);
    const clamped = Math.max(0, Math.min(maxDur, sec));
    setCurrentTime(clamped);
    if (el && Number.isFinite(clamped)) {
      el.currentTime = clamped;
    }
  };

  const seekFromPointer = (clientX: number) => {
    const box = waveTrackRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    seekToSeconds(ratio * Math.max(1, resolvedDuration));
  };

  const cycleSpeed = () => {
    setPlaybackRate((prev) => (prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1));
  };

  const progressRatio = Math.max(0, Math.min(1, currentTime / Math.max(1, resolvedDuration)));

  return (
    <div
      className={`rounded-2xl border px-3 py-2.5 space-y-2 ${
        isMine
          ? 'bg-slate-950/35 border-white/15 text-white'
          : 'bg-slate-950/85 border-slate-700/80 text-slate-100'
      } ${compact ? 'min-w-[235px]' : 'min-w-[250px] sm:min-w-[290px]'}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (Number.isFinite(d) && d > 0.5) {
            setResolvedDuration(Math.round(d));
          }
        }}
        onTimeUpdate={(e) => {
          if (!isDraggingWave) {
            setCurrentTime(e.currentTarget.currentTime);
          }
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
      />

      {fileName && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-cyan-300 truncate">
          <FileAudio className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{fileName}</span>
        </div>
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => void togglePlay()}
          className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${
            isMine
              ? 'bg-white text-slate-950 hover:bg-slate-100'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          }`}
          title={isPlaying ? 'Jeda Suara' : 'Putar Suara'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
        </button>

        {/* Interactive Waveform + Precision Seekbar */}
        <div className="flex-1 min-w-0 space-y-1">
          <div
            ref={waveTrackRef}
            role="slider"
            aria-label="Geser durasi pesan suara"
            aria-valuemin={0}
            aria-valuemax={resolvedDuration}
            aria-valuenow={Math.round(currentTime)}
            tabIndex={0}
            onPointerDown={(e) => {
              setIsDraggingWave(true);
              seekFromPointer(e.clientX);
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (isDraggingWave) seekFromPointer(e.clientX);
            }}
            onPointerUp={() => setIsDraggingWave(false)}
            onPointerCancel={() => setIsDraggingWave(false)}
            className="flex items-center gap-[2px] h-7 cursor-pointer touch-none select-none"
            title="Klik atau geser gelombang suara sesuai detik yang diinginkan"
          >
            {bars.map((peak, idx) => {
              const barPos = (idx + 0.5) / bars.length;
              const isActive = barPos <= progressRatio;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-colors ${
                    isActive
                      ? isMine
                        ? 'bg-emerald-300'
                        : 'bg-emerald-400'
                      : 'bg-slate-600/75'
                  }`}
                  style={{ height: `${Math.max(18, Math.round(peak * 100))}%` }}
                />
              );
            })}
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(1, resolvedDuration)}
            step={0.1}
            value={Math.min(resolvedDuration, currentTime)}
            onChange={(e) => seekToSeconds(Number(e.target.value))}
            aria-label="Penggeser durasi audio"
            className="w-full h-1.5 accent-emerald-400 cursor-pointer block"
          />

          <div className="flex items-center justify-between gap-2 text-[10px] font-mono tabular-nums text-slate-300">
            <span>
              {formatMediaDuration(currentTime)} / {formatMediaDuration(resolvedDuration)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={cycleSpeed}
                className="px-1.5 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-amber-300 font-extrabold text-[10px]"
                title="Ubah kecepatan putar (1x / 1.5x / 2x)"
              >
                {playbackRate}x
              </button>
              <button
                type="button"
                onClick={() => setShowVolumeSlider((v) => !v)}
                onDoubleClick={() => setIsMuted((m) => !m)}
                className={`p-1 rounded-md transition-colors ${
                  isMuted || volume === 0
                    ? 'bg-rose-900/70 text-rose-300'
                    : showVolumeSlider
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Atur Volume Suara"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showVolumeSlider && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-700/60">
          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            className="text-[10px] font-bold text-slate-300 hover:text-white shrink-0"
          >
            {isMuted || volume === 0 ? 'Buka Suara' : 'Bisukan'}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              setIsMuted(v === 0);
            }}
            aria-label="Volume Voice Note"
            className="flex-1 h-1.5 accent-indigo-400 cursor-pointer"
          />
          <span className="text-[10px] font-mono tabular-nums text-slate-300 w-8 text-right">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      )}

      {caption && caption.trim() && (
        <p className="text-xs leading-relaxed text-slate-100 whitespace-pre-wrap break-words pt-1 border-t border-white/10">
          {caption}
        </p>
      )}
    </div>
  );
};

// ==================== 2. MEDIA PREVIEW MODAL (MULTI PHOTO / VIDEO + CAPTION) ====================
export const MediaPreviewModal: React.FC<{
  open: boolean;
  items: StagedChatMediaDraft[];
  caption: string;
  onChangeCaption: (val: string) => void;
  onAddMoreFiles: (files: FileList | null) => void;
  onReplaceActiveFile: (index: number, file: File | null) => void;
  onRemoveItem: (index: number) => void;
  onCancel: () => void;
  onSend: () => void;
  isSending: boolean;
  progressText?: string | null;
  roomLabel: string;
  enterKeySends?: boolean;
  disableImages?: boolean;
  disableVideos?: boolean;
}> = ({
  open,
  items,
  caption,
  onChangeCaption,
  onAddMoreFiles,
  onReplaceActiveFile,
  onRemoveItem,
  onCancel,
  onSend,
  isSending,
  progressText,
  roomLabel,
  enterKeySends = false,
  disableImages = false,
  disableVideos = false,
}) => {
  const [activeIdx, setActiveIdx] = useState(0);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (activeIdx >= items.length) {
      setActiveIdx(Math.max(0, items.length - 1));
    }
  }, [items.length, activeIdx]);

  if (!open || items.length === 0) return null;

  const current = items[activeIdx] || items[0];
  const unifiedAccept =
    !disableImages && !disableVideos
      ? 'image/*,video/*'
      : !disableImages
        ? 'image/*'
        : 'video/*';

  const handleCaptionKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!isSending) onSend();
      return;
    }
    if (enterKeySends && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) onSend();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4"
      onClick={() => !isSending && onCancel()}
    >
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={addInputRef}
          type="file"
          accept={unifiedAccept}
          multiple
          className="hidden"
          onChange={(e) => {
            onAddMoreFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept={unifiedAccept}
          className="hidden"
          onChange={(e) => {
            onReplaceActiveFile(activeIdx, e.target.files?.[0] || null);
            e.target.value = '';
          }}
        />

        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2 truncate">
              {current.kind === 'video' ? (
                <Film className="w-4 h-4 text-indigo-400 shrink-0" />
              ) : (
                <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span>Pratinjau Kirim Foto &amp; Video ({items.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Tujuan: {roomLabel} · {current.fileName} · {formatFileSizeBytes(current.sizeBytes)}
              {current.kind === 'video' && current.durationSec ? ` · ${formatMediaDuration(current.durationSec)}` : ''}
            </p>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40"
            title="Batal & Tutup Pratinjau"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Main Media Viewer */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 space-y-3">
          <div className="relative rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden min-h-[220px] max-h-[44vh]">
            {current.kind === 'video' ? (
              <video
                key={current.id}
                src={current.previewUrl}
                controls
                playsInline
                className="w-full max-h-[43vh] object-contain"
              />
            ) : (
              <img
                src={current.previewUrl}
                alt={current.fileName}
                className="max-w-full max-h-[43vh] object-contain"
              />
            )}

            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
              <button
                type="button"
                disabled={isSending}
                onClick={() => replaceInputRef.current?.click()}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900/85 hover:bg-slate-800 border border-slate-700 text-white text-[11px] font-bold inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Ganti</span>
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={() => onRemoveItem(activeIdx)}
                className="p-1.5 rounded-xl bg-rose-900/85 hover:bg-rose-800 border border-rose-500/40 text-rose-100"
                title="Hapus file ini"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Multi-file Thumbnail Strip */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {items.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                  idx === activeIdx
                    ? 'border-emerald-400 scale-105 shadow-md'
                    : 'border-slate-700 opacity-75 hover:opacity-100'
                }`}
              >
                {item.kind === 'video' ? (
                  item.thumbnailDataUrl ? (
                    <img src={item.thumbnailDataUrl} alt={item.fileName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-indigo-300">
                      <Film className="w-5 h-5" />
                    </div>
                  )
                ) : (
                  <img src={item.previewUrl} alt={item.fileName} className="w-full h-full object-cover" />
                )}
                {item.kind === 'video' && (
                  <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-slate-950/85 text-[9px] font-mono text-white">
                    {formatMediaDuration(item.durationSec || 1)}
                  </span>
                )}
              </button>
            ))}
            <button
              type="button"
              disabled={isSending || items.length >= 10}
              onClick={() => addInputRef.current?.click()}
              className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-600 hover:border-emerald-400 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-emerald-300 flex flex-col items-center justify-center shrink-0 text-[10px] font-bold disabled:opacity-40"
              title="Tambah Foto atau Video lain"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
          </div>

          {progressText && (
            <div className="px-3 py-2 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-indigo-200 text-xs font-bold flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{progressText}</span>
            </div>
          )}

          {/* Caption Box */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              Keterangan Foto / Video (Opsional)
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => onChangeCaption(e.target.value)}
              onKeyDown={handleCaptionKeyDown}
              disabled={isSending}
              placeholder="Tulis keterangan untuk foto atau video ini sebelum dikirim..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white resize-none max-h-28 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">
              {enterKeySends
                ? 'Mode Enter: Enter kirim · Shift+Enter baris baru'
                : 'Enter baris baru · Ctrl+Enter langsung kirim'}
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            disabled={isSending}
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-40"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isSending}
            onClick={onSend}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSending ? 'Mengirim...' : `Kirim ${items.length > 1 ? `${items.length} Media` : 'Sekarang'}`}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==================== 3. VOICE & DEVICE AUDIO STAGING MODAL ====================
export const VoiceStagingModal: React.FC<{
  open: boolean;
  draft: StagedChatVoiceDraft | null;
  caption: string;
  onChangeCaption: (val: string) => void;
  onRetryOrPickAnother: () => void;
  onCancel: () => void;
  onSend: () => void;
  isSending: boolean;
  roomLabel: string;
  enterKeySends?: boolean;
}> = ({
  open,
  draft,
  caption,
  onChangeCaption,
  onRetryOrPickAnother,
  onCancel,
  onSend,
  isSending,
  roomLabel,
  enterKeySends = false,
}) => {
  if (!open || !draft) return null;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return;
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (!isSending) onSend();
      return;
    }
    if (enterKeySends && !e.shiftKey) {
      e.preventDefault();
      if (!isSending) onSend();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4"
      onClick={() => !isSending && onCancel()}
    >
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2 truncate">
              {draft.sourceKind === 'file' ? (
                <FileAudio className="w-4 h-4 text-cyan-400 shrink-0" />
              ) : (
                <Mic className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>
                {draft.sourceKind === 'file' ? 'Pratinjau File Audio HP' : 'Pratinjau Voice Note Sebelum Kirim'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              Tujuan: {roomLabel} · Durasi {formatMediaDuration(draft.durationSec)} ·{' '}
              {formatFileSizeBytes(draft.sizeBytes)}
            </p>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={onCancel}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto">
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold text-slate-300">
              Dengar Ulang &amp; Setel Durasi / Kecepatan / Volume Sebelum Kirim:
            </p>
            <CustomVoicePlayer
              src={draft.previewUrl}
              durationSec={draft.durationSec}
              waveformPeaks={draft.waveformPeaks}
              fileName={draft.sourceKind === 'file' ? draft.fileName : undefined}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-300 block">
              Tambah Keterangan Suara (Opsional)
            </label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => onChangeCaption(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder="Tulis keterangan untuk voice chat atau audio ini..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-sm text-white resize-none max-h-28 overflow-y-auto focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-[10px] text-slate-400">
              {enterKeySends
                ? 'Mode Enter: Enter kirim · Shift+Enter baris baru'
                : 'Enter baris baru · Ctrl+Enter langsung kirim'}
            </p>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSending}
              onClick={onCancel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={onRetryOrPickAnother}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300 text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{draft.sourceKind === 'file' ? 'Ganti File' : 'Rekam Ulang'}</span>
            </button>
          </div>
          <button
            type="button"
            disabled={isSending}
            onClick={onSend}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{isSending ? 'Mengirim...' : 'Kirim Suara'}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==================== 4. ENHANCED LIGHTBOX (PHOTO + VIDEO) ====================
export const EnhancedMediaLightboxModal: React.FC<{
  open: boolean;
  kind: 'image' | 'video';
  url: string;
  fileName?: string;
  caption?: string;
  onClose: () => void;
}> = ({ open, kind, url, fileName, caption, onClose }) => {
  if (!open || !url) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10010] bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl flex items-center justify-between gap-3 mb-3 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-bold truncate">{fileName || (kind === 'video' ? 'Video Chat' : 'Foto Chat')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={url}
            download={fileName || (kind === 'video' ? 'video-chat.mp4' : 'foto-chat.webp')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold inline-flex items-center gap-1.5 text-white"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="w-full max-w-4xl max-h-[78vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/50 border border-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {kind === 'video' ? (
          <video src={url} controls autoPlay playsInline className="max-w-full max-h-[76vh] object-contain" />
        ) : (
          <img src={url} alt={fileName || 'Foto Chat'} className="max-w-full max-h-[76vh] object-contain" />
        )}
      </div>

      {caption && caption.trim() && (
        <div
          className="mt-3 max-w-3xl px-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-xs sm:text-sm text-slate-100 whitespace-pre-wrap text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>,
    document.body
  );
};
