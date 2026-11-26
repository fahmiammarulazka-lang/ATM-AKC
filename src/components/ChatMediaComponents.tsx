/**
 * Bank Nusantara — Komponen Media Chat Kustom (v15.42.50)
 * 1. CustomVoicePlayer (Hybrid Web Audio + <audio> Fallback, Auto-Normalisasi + Boost 200%, Cloud Backup Failover)
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
  AlertTriangle,
} from 'lucide-react';
import {
  buildFallbackWaveformPeaks,
  formatFileSizeBytes,
  formatMediaDuration,
  restoreChatMediaFromCloud,
  type StagedChatMediaDraft,
  type StagedChatVoiceDraft,
} from '../utils/chatMediaUtils';

const VOICE_PLAY_EVENT = 'bn-chat-voice-play';

let sharedVoiceAudioCtx: AudioContext | null = null;
function getOrCreateSharedVoiceAudioCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedVoiceAudioCtx || sharedVoiceAudioCtx.state === 'closed') {
    sharedVoiceAudioCtx = new AudioCtx();
  }
  return sharedVoiceAudioCtx;
}

// ==================== 1. CUSTOM VOICE PLAYER ====================
export const CustomVoicePlayer: React.FC<{
  src: string;
  fallbackSrc?: string;
  cloudBackupId?: string;
  durationSec: number;
  waveformPeaks?: number[];
  fileName?: string;
  caption?: string;
  isMine?: boolean;
  compact?: boolean;
}> = ({
  src,
  fallbackSrc,
  cloudBackupId,
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

  // Web Audio playback refs
  const decodedBufferRef = useRef<AudioBuffer | null>(null);
  const smartAutoGainRef = useRef<number>(1);
  const activeSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const activeGainRef = useRef<GainNode | null>(null);
  const rafRef = useRef<number>(0);
  const startedCtxTimeRef = useRef<number>(0);
  const startedOffsetRef = useRef<number>(0);
  const activeRateRef = useRef<number>(1);
  const pausedOffsetRef = useRef<number>(0);
  const useHtmlFallbackRef = useRef<boolean>(false);

  const [activeMediaUrl, setActiveMediaUrl] = useState<string>(src || fallbackSrc || '');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [resolvedDuration, setResolvedDuration] = useState<number>(Math.max(1, durationSec || 1));
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const [volume, setVolume] = useState<number>(1.15); // Slight default boost (115%) for clarity
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState<boolean>(false);
  const [isDraggingWave, setIsDraggingWave] = useState<boolean>(false);

  const bars =
    waveformPeaks && waveformPeaks.length >= 12
      ? waveformPeaks.slice(0, 36)
      : buildFallbackWaveformPeaks(36);

  const stopWebAudioNode = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
    const node = activeSourceRef.current;
    activeSourceRef.current = null;
    if (node) {
      node.onended = null;
      try {
        node.stop();
      } catch {
        // already stopped
      }
      try {
        node.disconnect();
      } catch {
        // ignore
      }
    }
  };

  const pauseAllPlayback = () => {
    const ctx = getOrCreateSharedVoiceAudioCtx();
    if (activeSourceRef.current && ctx) {
      const elapsed = Math.max(0, ctx.currentTime - startedCtxTimeRef.current) * activeRateRef.current;
      pausedOffsetRef.current = Math.min(
        Math.max(0.1, resolvedDuration),
        startedOffsetRef.current + elapsed
      );
      setCurrentTime(pausedOffsetRef.current);
      stopWebAudioNode();
    }
    const el = audioRef.current;
    if (el && !el.paused) {
      el.pause();
    }
    setIsPlaying(false);
  };

  // Reset cached decode buffer when primary source changes
  useEffect(() => {
    pauseAllPlayback();
    decodedBufferRef.current = null;
    smartAutoGainRef.current = 1;
    useHtmlFallbackRef.current = false;
    pausedOffsetRef.current = 0;
    setCurrentTime(0);
    setAudioError(null);
    setActiveMediaUrl(src || fallbackSrc || '');
  }, [src, fallbackSrc, cloudBackupId]);

  // Sync single active player across entire chat
  useEffect(() => {
    const onOtherVoicePlay = (ev: Event) => {
      const customEv = ev as CustomEvent<string>;
      if (customEv.detail !== playerId) {
        pauseAllPlayback();
      }
    };
    window.addEventListener(VOICE_PLAY_EVENT, onOtherVoicePlay);
    return () => {
      window.removeEventListener(VOICE_PLAY_EVENT, onOtherVoicePlay);
      stopWebAudioNode();
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
      }
    };
  }, [playerId]);

  useEffect(() => {
    if (durationSec > 0 && !decodedBufferRef.current) {
      setResolvedDuration(durationSec);
    }
  }, [durationSec]);

  useEffect(() => {
    const ctx = getOrCreateSharedVoiceAudioCtx();
    if (activeSourceRef.current && ctx) {
      const elapsed = Math.max(0, ctx.currentTime - startedCtxTimeRef.current) * activeRateRef.current;
      const curPos = startedOffsetRef.current + elapsed;
      startedOffsetRef.current = curPos;
      startedCtxTimeRef.current = ctx.currentTime;
      activeRateRef.current = playbackRate;
      activeSourceRef.current.playbackRate.setValueAtTime(playbackRate, ctx.currentTime);
    }
    const el = audioRef.current;
    if (el) {
      el.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    const ctx = getOrCreateSharedVoiceAudioCtx();
    if (activeGainRef.current && ctx) {
      const targetGain = isMuted ? 0 : Math.max(0, Math.min(2.5, volume)) * smartAutoGainRef.current;
      activeGainRef.current.gain.setValueAtTime(targetGain, ctx.currentTime);
    }
    const el = audioRef.current;
    if (el) {
      el.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume));
      el.muted = isMuted;
    }
  }, [volume, isMuted]);

  const startWebAudioFromOffset = (ctx: AudioContext, buffer: AudioBuffer, offsetSec: number) => {
    stopWebAudioNode();
    const safeDuration = Math.max(0.1, buffer.duration);
    const clampedOffset = offsetSec >= safeDuration - 0.08 ? 0 : Math.max(0, offsetSec);

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = playbackRate;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.005;
    compressor.release.value = 0.15;

    const gainNode = ctx.createGain();
    gainNode.gain.value = (isMuted ? 0 : Math.max(0, Math.min(2.5, volume))) * smartAutoGainRef.current;

    source.connect(compressor);
    compressor.connect(gainNode);
    gainNode.connect(ctx.destination);

    activeSourceRef.current = source;
    activeGainRef.current = gainNode;
    startedCtxTimeRef.current = ctx.currentTime;
    startedOffsetRef.current = clampedOffset;
    activeRateRef.current = playbackRate;
    pausedOffsetRef.current = clampedOffset;

    source.onended = () => {
      if (activeSourceRef.current !== source) return;
      activeSourceRef.current = null;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = 0;
      }
      pausedOffsetRef.current = 0;
      setCurrentTime(0);
      setIsPlaying(false);
    };

    source.start(0, clampedOffset);
    setIsPlaying(true);

    const tick = () => {
      if (activeSourceRef.current !== source) return;
      const nowPos =
        startedOffsetRef.current + Math.max(0, ctx.currentTime - startedCtxTimeRef.current) * activeRateRef.current;
      if (!isDraggingWave) {
        setCurrentTime(Math.min(safeDuration, nowPos));
      }
      if (nowPos < safeDuration + 0.05) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const fetchAndDecodeCandidate = async (
    candidateUrl: string,
    ctx: AudioContext
  ): Promise<{ buffer: AudioBuffer; urlUsed: string } | null> => {
    if (!candidateUrl) return null;
    const resp = await fetch(candidateUrl);
    if (!resp.ok) return null;
    const arr = await resp.arrayBuffer();
    if (!arr || arr.byteLength < 32) return null;
    const decoded = await ctx.decodeAudioData(arr.slice(0));
    return { buffer: decoded, urlUsed: candidateUrl };
  };

  const loadAudioBufferOrFallback = async (ctx: AudioContext | null, forceReload = false): Promise<boolean> => {
    if (forceReload) {
      decodedBufferRef.current = null;
      useHtmlFallbackRef.current = false;
    }
    if (decodedBufferRef.current) return true;

    const candidates: string[] = [];
    if (src) candidates.push(src);
    if (fallbackSrc && fallbackSrc !== src) candidates.push(fallbackSrc);

    setIsLoadingAudio(true);
    setAudioError(null);
    try {
      let workingUrl = '';

      if (ctx) {
        for (const cand of candidates) {
          try {
            const decodedRes = await fetchAndDecodeCandidate(cand, ctx);
            if (decodedRes) {
              const ch = decodedRes.buffer.getChannelData(0);
              let peak = 0;
              const step = Math.max(1, Math.floor(ch.length / 4000));
              for (let i = 0; i < ch.length; i += step) {
                const v = Math.abs(ch[i]);
                if (v > peak) peak = v;
              }
              smartAutoGainRef.current = peak > 0.002 && peak < 0.55 ? Math.min(2.8, 0.78 / peak) : 1;
              decodedBufferRef.current = decodedRes.buffer;
              setResolvedDuration(Math.max(1, Math.round(decodedRes.buffer.duration)));
              setActiveMediaUrl(decodedRes.urlUsed);
              return true;
            }
          } catch {
            // try next candidate
          }
        }

        // Try Cloud Firestore/RTDB backup if local URL expired/404 or failed decode
        if (cloudBackupId) {
          const restoredDataUrl = await restoreChatMediaFromCloud(cloudBackupId);
          if (restoredDataUrl) {
            workingUrl = restoredDataUrl;
            setActiveMediaUrl(restoredDataUrl);
            try {
              const decodedCloud = await fetchAndDecodeCandidate(restoredDataUrl, ctx);
              if (decodedCloud) {
                const ch = decodedCloud.buffer.getChannelData(0);
                let peak = 0;
                const step = Math.max(1, Math.floor(ch.length / 4000));
                for (let i = 0; i < ch.length; i += step) {
                  const v = Math.abs(ch[i]);
                  if (v > peak) peak = v;
                }
                smartAutoGainRef.current = peak > 0.002 && peak < 0.55 ? Math.min(2.8, 0.78 / peak) : 1;
                decodedBufferRef.current = decodedCloud.buffer;
                setResolvedDuration(Math.max(1, Math.round(decodedCloud.buffer.duration)));
                return true;
              }
            } catch {
              // fall through to HTML <audio> fallback using restoredDataUrl
            }
          }
        }
      }

      // Check reachability for HTML5 <audio> fallback
      if (!workingUrl) {
        for (const cand of candidates) {
          if (cand.startsWith('blob:') || cand.startsWith('data:')) {
            workingUrl = cand;
            break;
          }
          try {
            const headRes = await fetch(cand, { method: 'HEAD' });
            if (headRes.ok) {
              workingUrl = cand;
              break;
            }
          } catch {
            // continue
          }
        }
      }
      if (!workingUrl && cloudBackupId) {
        const restored = await restoreChatMediaFromCloud(cloudBackupId);
        if (restored) workingUrl = restored;
      }

      if (workingUrl) {
        useHtmlFallbackRef.current = true;
        setActiveMediaUrl(workingUrl);
        return true;
      }

      setAudioError('Sumber audio tidak ditemukan atau gagal dimuat.');
      return false;
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const togglePlay = async () => {
    if (isLoadingAudio) return;
    if (isPlaying) {
      pauseAllPlayback();
      return;
    }

    // Must resume AudioContext synchronously inside click gesture for mobile Safari/Chrome & iframes
    const ctx = getOrCreateSharedVoiceAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }

    window.dispatchEvent(new CustomEvent(VOICE_PLAY_EVENT, { detail: playerId }));
    setAudioError(null);

    const ready = await loadAudioBufferOrFallback(ctx, false);
    if (!ready) return;

    if (ctx && ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // continue
      }
    }

    if (decodedBufferRef.current && ctx && !useHtmlFallbackRef.current) {
      startWebAudioFromOffset(ctx, decodedBufferRef.current, pausedOffsetRef.current || currentTime);
      return;
    }

    const el = audioRef.current;
    if (!el) {
      setAudioError('Pemutar audio perangkat tidak siap.');
      return;
    }
    try {
      el.playbackRate = playbackRate;
      el.muted = isMuted;
      el.volume = isMuted ? 0 : Math.min(1, Math.max(0, volume));
      if (pausedOffsetRef.current > 0 && Number.isFinite(pausedOffsetRef.current)) {
        el.currentTime = pausedOffsetRef.current;
      }
      await el.play();
    } catch {
      setIsPlaying(false);
      setAudioError('Browser menolak atau gagal memutar audio ini. Ketuk Muat Ulang Audio.');
    }
  };

  const handleRetryAudio = async () => {
    pauseAllPlayback();
    const ctx = getOrCreateSharedVoiceAudioCtx();
    if (ctx && ctx.state === 'suspended') {
      void ctx.resume().catch(() => {});
    }
    const ok = await loadAudioBufferOrFallback(ctx, true);
    if (ok) {
      await togglePlay();
    }
  };

  const seekToSeconds = (sec: number) => {
    const maxDur = Math.max(1, resolvedDuration);
    const clamped = Math.max(0, Math.min(maxDur, sec));
    pausedOffsetRef.current = clamped;
    setCurrentTime(clamped);

    const ctx = getOrCreateSharedVoiceAudioCtx();
    if (isPlaying && decodedBufferRef.current && ctx && !useHtmlFallbackRef.current) {
      startWebAudioFromOffset(ctx, decodedBufferRef.current, clamped);
      return;
    }
    const el = audioRef.current;
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
      } ${compact ? 'min-w-[235px]' : 'min-w-[250px] sm:min-w-[300px]'}`}
    >
      <audio
        ref={audioRef}
        src={activeMediaUrl || undefined}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (!decodedBufferRef.current && Number.isFinite(d) && d > 0.5) {
            setResolvedDuration(Math.round(d));
          }
        }}
        onTimeUpdate={(e) => {
          if (useHtmlFallbackRef.current && !isDraggingWave) {
            setCurrentTime(e.currentTarget.currentTime);
            pausedOffsetRef.current = e.currentTarget.currentTime;
          }
        }}
        onPlay={() => {
          if (useHtmlFallbackRef.current) setIsPlaying(true);
        }}
        onPause={() => {
          if (useHtmlFallbackRef.current) setIsPlaying(false);
        }}
        onEnded={() => {
          if (useHtmlFallbackRef.current) {
            setIsPlaying(false);
            pausedOffsetRef.current = 0;
            setCurrentTime(0);
          }
        }}
        onError={() => {
          if (useHtmlFallbackRef.current) {
            setIsPlaying(false);
            setAudioError('Gagal memutar file audio. Ketuk Muat Ulang Audio.');
          }
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
          disabled={isLoadingAudio}
          className={`w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-60 ${
            isMine
              ? 'bg-white text-slate-950 hover:bg-slate-100'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
          }`}
          title={isLoadingAudio ? 'Memuat audio...' : isPlaying ? 'Jeda Suara' : 'Putar Suara'}
        >
          {isLoadingAudio ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
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
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
              setCurrentTime(ratio * Math.max(1, resolvedDuration));
              e.currentTarget.setPointerCapture?.(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!isDraggingWave) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / Math.max(1, rect.width)));
              setCurrentTime(ratio * Math.max(1, resolvedDuration));
            }}
            onPointerUp={(e) => {
              if (isDraggingWave) {
                setIsDraggingWave(false);
                seekFromPointer(e.clientX);
              }
            }}
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
                className={`px-1.5 py-0.5 rounded-md inline-flex items-center gap-1 transition-colors text-[10px] font-bold ${
                  isMuted || volume === 0
                    ? 'bg-rose-900/70 text-rose-300'
                    : showVolumeSlider
                      ? 'bg-indigo-600 text-white'
                      : volume > 1.25
                        ? 'bg-amber-600/25 border border-amber-500/40 text-amber-300 hover:bg-amber-600/35'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
                title="Atur Volume & Penguat Suara (hingga 200%)"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? '0%' : `${Math.round(volume * 100)}%`}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showVolumeSlider && (
        <div className="space-y-1.5 pt-1.5 border-t border-slate-700/60">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="text-[10px] font-bold text-slate-300 hover:text-white shrink-0"
            >
              {isMuted || volume === 0 ? 'Buka' : 'Bisu'}
            </button>
            <input
              type="range"
              min={0}
              max={2}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                const v = Number(e.target.value);
                setVolume(v);
                setIsMuted(v === 0);
              }}
              aria-label="Volume dan Penguat Voice Note hingga 200%"
              className="flex-1 h-1.5 accent-indigo-400 cursor-pointer"
            />
            <span className="text-[10px] font-mono tabular-nums text-amber-300 font-bold w-10 text-right">
              {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
          <div className="flex items-center justify-between gap-1 text-[10px]">
            <span className="text-slate-400">Penguat Suara:</span>
            <div className="flex items-center gap-1">
              {[
                { label: '100%', val: 1 },
                { label: '150%', val: 1.5 },
                { label: '200% Boost', val: 2 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setVolume(preset.val);
                    setIsMuted(false);
                  }}
                  className={`px-2 py-0.5 rounded-md font-bold transition-colors ${
                    !isMuted && Math.abs(volume - preset.val) < 0.05
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {audioError && (
        <div className="rounded-xl bg-rose-950/60 border border-rose-700/60 px-2.5 py-2 flex items-center justify-between gap-2 text-[11px] text-rose-200">
          <div className="flex items-center gap-1.5 min-w-0">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">{audioError}</span>
          </div>
          <button
            type="button"
            onClick={() => void handleRetryAudio()}
            className="shrink-0 px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Muat Ulang Audio</span>
          </button>
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
