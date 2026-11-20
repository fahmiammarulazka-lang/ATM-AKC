/**
 * CelebrationSpectacleOverlay — Mesin Panggung Sinematik 100.000x Ultra Max Overdrive
 * Digunakan bersama oleh:
 * 1) Hadiah & Surat (108 Efek Perayaan di 9 Kategori)
 * 2) Studio Efek Dashboard 100.000x (1 Orang, Banyak Akun, atau Semua Nasabah)
 *
 * Mencakup:
 * - PreClaimCelebrationAmbientBackdrop: Cincin mandala berputar di sudut + 22 partikel atmosfer hidup
 * - PreClaimCardOrnamentStrip: Lencana perayaan + koreografi + badge 100.000x
 * - PreClaimMagicRingSealAura: Cincin sihir / mandala berputar hidup di belakang segel lilin 3D & kotak hadiah
 * - CelebrationClaimBurstOverlay (7 Lapis Panggung Sinematik 100.000x):
 *   Fase 1: Hitung Mundur Dramatis (3 • 2 • 1 • MAX OVERDRIVE!) + Getaran Layar + Kilatan Cahaya + Riser Synth
 *   Fase 2: Portal Dimensi 3D + 14 Sinar Laser Menyapu + Cincin Gelombang Kejut + Parade Maskot Unik +
 *           96+ Badai Partikel + Trofi Hologram 3D Tengah Layar + Klik Kombo Interaktif (COMBO x2..x99!) +
 *           Synthesizer Musik Fanfare Web Audio API Otomatis
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles, Volume2, VolumeX, RotateCcw, X, Flame, Zap, Trophy } from 'lucide-react';
import {
  CelebrationEffectProfile,
  CelebrationIntensityLevel,
  getCelebrationEffectProfile,
  getCelebrationIntensityMeta,
  playCelebrationBuildupRiserSynth,
  playCelebrationComboHitSynth,
  playCelebrationFanfareSynth,
  triggerCanvasConfettiForCelebration,
  triggerComboClickConfettiAtPoint,
} from '../data/celebrationEffectsCatalog';

// ============================================================================
// 1. HIASAN PRA-KLAIM & AURA LATAR HIDUP (MODAL & DASHBOARD)
// ============================================================================
export const PreClaimCelebrationAmbientBackdrop: React.FC<{
  effectId?: string | null;
  intensityLevel?: CelebrationIntensityLevel;
}> = ({ effectId, intensityLevel = '100000x' }) => {
  const profile = getCelebrationEffectProfile(effectId);

  const ambientNodes = useMemo(() => {
    if (profile.id === 'none') return [];
    const emojis = profile.particleEmojis;
    const count = intensityLevel === '100000x' ? 22 : intensityLevel === '10000x' ? 16 : 12;
    return Array.from({ length: count }).map((_, idx) => {
      const emoji = emojis[idx % emojis.length];
      const leftPct = 3 + ((idx * 19) % 94);
      const topPct = 5 + ((idx * 23) % 88);
      const delaySec = (idx % 6) * 0.38;
      const sizeClass =
        idx % 4 === 0 ? 'text-2xl' : idx % 3 === 0 ? 'text-lg' : 'text-sm';
      return {
        id: idx,
        emoji,
        leftPct,
        topPct,
        delaySec,
        sizeClass,
      };
    });
  }, [profile, intensityLevel]);

  if (profile.id === 'none') return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl z-0"
      aria-hidden="true"
    >
      {/* Aura Cahaya Sudut Berdenyut */}
      <div
        style={{
          background: `radial-gradient(circle at 15% 15%, ${profile.laserColors[0]}28 0%, transparent 55%), radial-gradient(circle at 85% 85%, ${profile.laserColors[1]}28 0%, transparent 55%)`,
        }}
        className="absolute inset-0 animate-pulse"
      />

      {/* Cincin Sihir Mandala Sudut Berputar */}
      <div
        style={{ borderColor: `${profile.laserColors[0]}55` }}
        className="absolute -top-12 -left-12 w-36 h-36 rounded-full border-2 border-dashed animate-spin opacity-45"
      />
      <div
        style={{ borderColor: `${profile.laserColors[1]}55` }}
        className="absolute -bottom-12 -right-12 w-36 h-36 rounded-full border-2 border-dashed animate-spin opacity-45"
      />

      {/* Sudut Ornamen Khas Perayaan */}
      <div className="absolute top-3 left-3 text-lg sm:text-xl opacity-85 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>
      <div className="absolute top-3 right-14 text-lg sm:text-xl opacity-85 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>
      <div className="absolute bottom-3 left-3 text-lg sm:text-xl opacity-85 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>
      <div className="absolute bottom-3 right-3 text-lg sm:text-xl opacity-85 select-none animate-pulse">
        {profile.cornerOrnamentSymbol}
      </div>

      {/* Partikel Atmosfer Melayang Halus Sebelum Diklaim */}
      {ambientNodes.map((node) => (
        <span
          key={node.id}
          style={{
            left: `${node.leftPct}%`,
            top: `${node.topPct}%`,
            animationDelay: `${node.delaySec}s`,
          }}
          className={`absolute ${node.sizeClass} opacity-30 select-none animate-bounce`}
        >
          {node.emoji}
        </span>
      ))}
    </div>
  );
};

// ============================================================================
// 2. CINCIN SIHIR / MANDALA BERPUTAR HIDUP DI BELAKANG SEGEL & KOTAK HADIAH
// ============================================================================
export const PreClaimMagicRingSealAura: React.FC<{
  effectId?: string | null;
}> = ({ effectId }) => {
  const profile = getCelebrationEffectProfile(effectId);
  if (profile.id === 'none') return null;

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
    >
      {/* Cincin Luar Berputar Searah Jarum Jam */}
      <div
        style={{
          borderColor: `${profile.laserColors[0]}88`,
          boxShadow: `0 0 28px ${profile.laserColors[0]}44`,
        }}
        className="w-36 h-36 rounded-full border-2 border-dashed animate-spin opacity-75"
      />
      {/* Cincin Dalam Berputar & Berdenyut */}
      <div
        style={{
          borderColor: `${profile.laserColors[1]}aa`,
          boxShadow: `0 0 22px ${profile.laserColors[1]}55`,
        }}
        className="absolute w-28 h-28 rounded-full border border-dotted animate-pulse opacity-85"
      />
    </div>
  );
};

// ============================================================================
// 3. HIASAN GARLAND & LENCANA TEMA 100.000X PADA AMPLOP & KOTAK HADIAH TERSEGEL
// ============================================================================
export const PreClaimCardOrnamentStrip: React.FC<{
  effectId?: string | null;
  intensityLevel?: CelebrationIntensityLevel;
  targetType: 'envelope' | 'gift_box';
}> = ({ effectId, intensityLevel = '100000x', targetType }) => {
  const profile = getCelebrationEffectProfile(effectId);
  if (profile.id === 'none') return null;

  const intensityMeta = getCelebrationIntensityMeta(intensityLevel);
  const stripEmojis = profile.particleEmojis.slice(0, 6);

  return (
    <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 rounded-2xl bg-slate-950/85 border border-white/20 shadow-inner">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-sm animate-bounce">{profile.primaryEmoji}</span>
        <span className="text-[10px] font-black tracking-wide text-white truncate">
          {profile.shortBadge}
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs select-none" aria-hidden="true">
        {stripEmojis.map((em, i) => (
          <span
            key={i}
            className="inline-block transition-transform duration-300 group-hover:scale-125"
          >
            {em}
          </span>
        ))}
      </div>
      <span
        className={`px-2 py-0.5 rounded-md font-mono font-black text-[8.5px] uppercase tracking-wider ${profile.badgeClass}`}
      >
        {intensityMeta.shortLabel} • {targetType === 'envelope' ? 'SURAT' : 'HADIAH'}
      </span>
    </div>
  );
};

// ============================================================================
// 4. PANGGUNG SINEMATIK 100.000X ULTRA MAX OVERDRIVE (7 LAPIS + KLIK KOMBO)
// ============================================================================
interface ClickRippleBurst {
  id: number;
  x: number;
  y: number;
  comboNum: number;
  emoji: string;
}

export const CelebrationClaimBurstOverlay: React.FC<{
  effectId?: string | null;
  intensityLevel?: CelebrationIntensityLevel;
  burstNonce: number;
  customHeadlineOverride?: string;
  customSubtextOverride?: string;
  customSenderOverride?: string;
  onDismiss?: () => void;
  isPreviewMode?: boolean;
  forceSilentAudio?: boolean;
  autoDismissSeconds?: number;
}> = ({
  effectId,
  intensityLevel = '100000x',
  burstNonce,
  customHeadlineOverride,
  customSubtextOverride,
  customSenderOverride,
  onDismiss,
  isPreviewMode = false,
  forceSilentAudio = false,
  autoDismissSeconds,
}) => {
  const profile: CelebrationEffectProfile = getCelebrationEffectProfile(effectId);
  const intensityMeta = getCelebrationIntensityMeta(intensityLevel);

  const [stagePhase, setStagePhase] = useState<'buildup' | 'climax'>('buildup');
  const [countdownNum, setCountdownNum] = useState<number>(3);
  const [comboCount, setComboCount] = useState<number>(1);
  const [audioMuted, setAudioMuted] = useState<boolean>(forceSilentAudio);
  const [clickRipples, setClickRipples] = useState<ClickRippleBurst[]>([]);

  useEffect(() => {
    setAudioMuted(forceSilentAudio);
  }, [forceSilentAudio]);

  // Trigger dramatic 3-2-1 buildup and then climax eruption whenever burstNonce changes
  useEffect(() => {
    if (!burstNonce || profile.id === 'none') return;
    setStagePhase('buildup');
    setCountdownNum(3);
    setComboCount(1);
    setClickRipples([]);

    const shouldMute = forceSilentAudio || audioMuted;
    if (!shouldMute) {
      playCelebrationBuildupRiserSynth();
    }

    const t1 = window.setTimeout(() => setCountdownNum(2), 190);
    const t2 = window.setTimeout(() => setCountdownNum(1), 380);
    const t3 = window.setTimeout(() => {
      setStagePhase('climax');
      triggerCanvasConfettiForCelebration(profile.id, intensityMeta.id);
      if (!shouldMute) {
        playCelebrationFanfareSynth(profile.id);
      }
    }, 580);

    let tAutoDismiss: number | undefined;
    if (autoDismissSeconds && autoDismissSeconds > 0 && onDismiss) {
      tAutoDismiss = window.setTimeout(() => {
        onDismiss();
      }, autoDismissSeconds * 1000);
    }

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      if (tAutoDismiss) window.clearTimeout(tAutoDismiss);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [burstNonce, profile.id, forceSilentAudio, autoDismissSeconds]);

  // 96+ Multi-Depth Particle Storm scaled by Intensity Level
  const particles = useMemo(() => {
    if (!burstNonce || profile.id === 'none') return [];
    const emojis = profile.particleEmojis;
    return Array.from({ length: intensityMeta.particleCount }).map((_, i) => {
      const emoji = emojis[i % emojis.length];
      const left = 1 + ((i * 11 + (burstNonce % 7) * 3) % 97);
      const delayMs = (i % 12) * 90;
      const durationMs = 2100 + (i % 6) * 360;
      const sizeRem =
        i % 5 === 0
          ? '2.55rem'
          : i % 3 === 0
          ? '1.95rem'
          : i % 2 === 0
          ? '1.5rem'
          : '1.25rem';
      return {
        id: `${burstNonce}-pt-${i}`,
        emoji,
        left,
        delayMs,
        durationMs,
        sizeRem,
      };
    });
  }, [burstNonce, profile, intensityMeta.particleCount]);

  // 14 Sweeping Stage Laser Beams
  const laserBeams = useMemo(() => {
    if (!burstNonce || profile.id === 'none') return [];
    return Array.from({ length: intensityMeta.laserBeamCount }).map((_, idx) => {
      const color = profile.laserColors[idx % profile.laserColors.length];
      const angleDeg = -65 + (idx * 130) / Math.max(1, intensityMeta.laserBeamCount - 1);
      const delayMs = (idx % 5) * 120;
      return {
        id: `laser-${idx}`,
        color,
        angleDeg,
        delayMs,
      };
    });
  }, [burstNonce, profile, intensityMeta.laserBeamCount]);

  // Choreographed Giant Mascots Parade (Unique per Motion Style)
  const paradeMascots = useMemo(() => {
    if (!burstNonce || profile.id === 'none') return [];
    const mascots =
      profile.mascotParadeEmojis.length > 0
        ? profile.mascotParadeEmojis
        : profile.particleEmojis;
    return Array.from({ length: intensityMeta.paradeCount }).map((_, idx) => {
      const emoji = mascots[idx % mascots.length];
      const laneTopPct = 14 + ((idx * 17) % 68);
      const delayMs = idx * 210;
      const durationMs = 2500 + (idx % 3) * 450;
      return {
        id: `parade-${idx}`,
        emoji,
        laneTopPct,
        delayMs,
        durationMs,
        reverse: idx % 2 === 1,
      };
    });
  }, [burstNonce, profile, intensityMeta.paradeCount]);

  if (!burstNonce || profile.id === 'none') return null;

  // Choose particle animation based on choreography archetype
  const getParticleKeyframesName = (style: CelebrationEffectProfile['motionStyle']): string => {
    switch (style) {
      case 'dragon_parade':
        return 'bnDragonWeave';
      case 'meteor_shower':
        return 'bnMeteorDiagonal';
      case 'patriot_salute':
      case 'sacred_mandala':
      case 'lantern_rise':
        return 'bnCelebrationRise';
      case 'supernova_vortex':
        return 'bnVortexSpiral';
      case 'anime_aura_burst':
      case 'cyber_laser_grid':
        return 'bnAnimeSpeedSurge';
      default:
        return 'bnCelebrationFall';
    }
  };

  const handleStageComboClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (stagePhase !== 'climax') return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX;
    const clickY = e.clientY;
    const normX = rect.width > 0 ? (clickX - rect.left) / rect.width : 0.5;
    const normY = rect.height > 0 ? (clickY - rect.top) / rect.height : 0.5;

    const nextCombo = comboCount + 1;
    setComboCount(nextCombo);

    triggerComboClickConfettiAtPoint(profile.id, normX, normY);
    if (!audioMuted) {
      playCelebrationComboHitSynth(nextCombo);
    }

    const emoji = profile.particleEmojis[nextCombo % profile.particleEmojis.length];
    const rippleId = Date.now() + Math.floor(Math.random() * 999);
    setClickRipples((prev) => [
      ...prev.slice(-8),
      { id: rippleId, x: clickX, y: clickY, comboNum: nextCombo, emoji },
    ]);
  };

  const particleAnimName = getParticleKeyframesName(profile.motionStyle);

  return (
    <div
      onClick={handleStageComboClick}
      className={`fixed inset-0 z-[75] flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden select-none cursor-pointer ${
        stagePhase === 'buildup' ? 'bn-stage-screen-shake' : ''
      }`}
      aria-live="polite"
      title="Klik di mana saja untuk memicu Ledakan Kombo 100.000x!"
    >
      <style>{`
        @keyframes bnStageScreenShake {
          0%, 100% { transform: translate3d(0, 0, 0); }
          15% { transform: translate3d(-10px, 7px, 0) rotate(-0.8deg); }
          30% { transform: translate3d(10px, -8px, 0) rotate(0.8deg); }
          45% { transform: translate3d(-8px, -6px, 0) rotate(-0.5deg); }
          60% { transform: translate3d(9px, 7px, 0) rotate(0.6deg); }
          75% { transform: translate3d(-6px, 4px, 0) rotate(-0.3deg); }
        }
        .bn-stage-screen-shake {
          animation: bnStageScreenShake 0.55s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes bnCameraFlash {
          0% { opacity: 0.92; }
          100% { opacity: 0; }
        }
        @keyframes bnShockwaveExpand {
          0% {
            transform: translate(-50%, -50%) scale(0.15);
            opacity: 0.95;
          }
          100% {
            transform: translate(-50%, -50%) scale(3.4);
            opacity: 0;
          }
        }
        @keyframes bnLaserSweep {
          0%, 100% {
            transform: translateX(-50%) rotate(var(--laser-angle, 0deg)) scaleY(1);
            opacity: 0.45;
          }
          50% {
            transform: translateX(-50%) rotate(calc(var(--laser-angle, 0deg) * -0.75)) scaleY(1.15);
            opacity: 0.85;
          }
        }
        @keyframes bnCelebrationFall {
          0% {
            transform: translate3d(0, -14vh, 0) scale(0.35) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(16px, 16vh, 0) scale(1.2) rotate(15deg);
          }
          80% {
            opacity: 0.95;
            transform: translate3d(-16px, 78vh, 0) scale(1.05) rotate(-18deg);
          }
          100% {
            transform: translate3d(20px, 108vh, 0) scale(0.75) rotate(28deg);
            opacity: 0;
          }
        }
        @keyframes bnCelebrationRise {
          0% {
            transform: translate3d(0, 106vh, 0) scale(0.45) rotate(0deg);
            opacity: 0;
          }
          18% {
            opacity: 1;
            transform: translate3d(-14px, 74vh, 0) scale(1.18) rotate(-10deg);
          }
          82% {
            opacity: 0.95;
            transform: translate3d(14px, 18vh, 0) scale(1.08) rotate(10deg);
          }
          100% {
            transform: translate3d(-10px, -16vh, 0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
        }
        @keyframes bnDragonWeave {
          0% {
            transform: translate3d(-20vw, 20vh, 0) scale(0.6) rotate(-12deg);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate3d(10vw, 5vh, 0) scale(1.3) rotate(10deg);
          }
          50% {
            transform: translate3d(40vw, 35vh, 0) scale(1.4) rotate(-14deg);
          }
          80% {
            opacity: 1;
            transform: translate3d(70vw, 10vh, 0) scale(1.25) rotate(12deg);
          }
          100% {
            transform: translate3d(110vw, 28vh, 0) scale(0.85) rotate(0deg);
            opacity: 0;
          }
        }
        @keyframes bnMeteorDiagonal {
          0% {
            transform: translate3d(35vw, -18vh, 0) scale(0.4) rotate(-35deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(15vw, 15vh, 0) scale(1.3) rotate(-35deg);
          }
          85% {
            opacity: 0.95;
            transform: translate3d(-35vw, 82vh, 0) scale(1.1) rotate(-35deg);
          }
          100% {
            transform: translate3d(-55vw, 110vh, 0) scale(0.7) rotate(-35deg);
            opacity: 0;
          }
        }
        @keyframes bnVortexSpiral {
          0% {
            transform: translate3d(0, 50vh, 0) scale(0.2) rotate(0deg);
            opacity: 0;
          }
          25% {
            opacity: 1;
            transform: translate3d(18vw, 22vh, 0) scale(1.25) rotate(180deg);
          }
          75% {
            opacity: 0.95;
            transform: translate3d(-18vw, 68vh, 0) scale(1.35) rotate(540deg);
          }
          100% {
            transform: translate3d(0, -12vh, 0) scale(0.6) rotate(720deg);
            opacity: 0;
          }
        }
        @keyframes bnAnimeSpeedSurge {
          0% {
            transform: translate3d(0, 95vh, 0) scale(0.3);
            opacity: 0;
          }
          20% {
            opacity: 1;
            transform: translate3d(0, 45vh, 0) scale(1.45);
          }
          80% {
            opacity: 1;
            transform: translate3d(0, 12vh, 0) scale(1.2);
          }
          100% {
            transform: translate3d(0, -18vh, 0) scale(0.5);
            opacity: 0;
          }
        }
        @keyframes bnMascotParadeL2R {
          0% {
            transform: translate3d(-18vw, 0, 0) scale(0.7) rotate(-10deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(15vw, -18px, 0) scale(1.35) rotate(8deg);
          }
          50% {
            transform: translate3d(50vw, 18px, 0) scale(1.5) rotate(-8deg);
          }
          85% {
            opacity: 1;
            transform: translate3d(85vw, -14px, 0) scale(1.35) rotate(10deg);
          }
          100% {
            transform: translate3d(115vw, 0, 0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
        }
        @keyframes bnMascotParadeR2L {
          0% {
            transform: translate3d(115vw, 0, 0) scale(0.7) rotate(10deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translate3d(85vw, 18px, 0) scale(1.35) rotate(-8deg);
          }
          50% {
            transform: translate3d(50vw, -18px, 0) scale(1.5) rotate(8deg);
          }
          85% {
            opacity: 1;
            transform: translate3d(15vw, 14px, 0) scale(1.35) rotate(-10deg);
          }
          100% {
            transform: translate3d(-18vw, 0, 0) scale(0.8) rotate(0deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Latar Panggung Sinematik Gelap Transparan dengan Gradasi Tema */}
      <div
        style={{
          background: `radial-gradient(circle at 50% 50%, ${profile.laserColors[0]}38 0%, ${profile.laserColors[1]}22 42%, rgba(2,6,23,0.78) 100%)`,
        }}
        className="pointer-events-none absolute inset-0 backdrop-blur-[3px]"
      />

      {/* ====================================================================
          FASE 1: ADEGAN PEMBUKA SINEMATIK (CINEMATIC BUILDUP 3 • 2 • 1)
         ==================================================================== */}
      {stagePhase === 'buildup' && (
        <div className="relative z-30 my-auto flex flex-col items-center justify-center text-center space-y-4 animate-fadeIn">
          <div className="relative flex items-center justify-center">
            <div
              style={{ borderColor: profile.laserColors[0] }}
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-dashed animate-spin"
            />
            <div
              style={{
                borderColor: profile.laserColors[1],
                boxShadow: `0 0 80px ${profile.laserColors[0]}`,
              }}
              className="absolute w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-slate-950/90 border-4 flex flex-col items-center justify-center"
            >
              <span className="text-5xl sm:text-6xl font-mono font-black text-white tabular-nums animate-ping">
                {countdownNum}
              </span>
            </div>
          </div>

          <div className="px-5 py-2.5 rounded-2xl bg-slate-950/90 border-2 border-amber-400 shadow-2xl space-y-1">
            <span className="text-[11px] font-mono font-black text-amber-300 uppercase tracking-widest block">
              ⚡ MEMBUKA PORTAL SELEBRASI {intensityMeta.shortLabel} ⚡
            </span>
            <h3 className="text-base sm:text-xl font-black text-white">
              {profile.primaryEmoji} {profile.name}
            </h3>
          </div>
        </div>
      )}

      {/* ====================================================================
          FASE 2: PUNCAK PANGGUNG SINEMATIK 100.000X (7 LAPIS SERENTAK)
         ==================================================================== */}
      {stagePhase === 'climax' && (
        <>
          {/* Kilatan Blitz Pembuka Puncak (Camera Flash) */}
          <div
            style={{
              background: `radial-gradient(circle, #ffffff 0%, ${profile.laserColors[0]} 60%, transparent 100%)`,
              animation: 'bnCameraFlash 0.65s ease-out forwards',
            }}
            className="pointer-events-none absolute inset-0 z-20"
          />

          {/* LAPIS 1: 14 Sorot Sinar Laser Panggung Menyapu dari Atas & Bawah */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            {laserBeams.map((beam) => (
              <div
                key={beam.id}
                style={
                  {
                    '--laser-angle': `${beam.angleDeg}deg`,
                    left: '50%',
                    bottom: '-10%',
                    width: '6px',
                    height: '135vh',
                    background: `linear-gradient(to top, ${beam.color}, ${beam.color}88, transparent)`,
                    boxShadow: `0 0 24px ${beam.color}`,
                    transformOrigin: 'bottom center',
                    animation: `bnLaserSweep ${2.2 + (beam.delayMs % 3) * 0.4}s ease-in-out infinite`,
                    animationDelay: `${beam.delayMs}ms`,
                  } as React.CSSProperties
                }
                className="absolute rounded-full"
              />
            ))}
          </div>

          {/* LAPIS 2: Portal Dimensi 3D & Cincin Mandala Raksasa di Pusat Layar */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-0">
            <div
              style={{
                borderColor: `${profile.laserColors[0]}99`,
                boxShadow: `0 0 90px ${profile.laserColors[0]}66, inset 0 0 60px ${profile.laserColors[1]}44`,
              }}
              className="w-[320px] h-[320px] sm:w-[480px] sm:h-[480px] rounded-full border-4 border-dashed animate-spin opacity-60"
            />
            <div
              style={{
                borderColor: `${profile.laserColors[1]}aa`,
                boxShadow: `0 0 70px ${profile.laserColors[1]}66`,
              }}
              className="absolute w-[230px] h-[230px] sm:w-[350px] sm:h-[350px] rounded-full border-2 border-dotted animate-pulse opacity-75"
            />
          </div>

          {/* LAPIS 3: Gelombang Kejut Berlapis (Multi-Wave Shockwave Rings) */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
            {Array.from({ length: intensityMeta.shockwaveCount }).map((_, idx) => (
              <div
                key={`shock-${burstNonce}-${idx}`}
                style={{
                  left: '50%',
                  top: '50%',
                  borderColor: profile.laserColors[idx % profile.laserColors.length],
                  boxShadow: `0 0 35px ${profile.laserColors[idx % profile.laserColors.length]}`,
                  animation: `bnShockwaveExpand 2.2s cubic-bezier(0.16, 1, 0.3, 1) infinite`,
                  animationDelay: `${idx * 360}ms`,
                }}
                className="absolute w-44 h-44 sm:w-64 sm:h-64 rounded-full border-4"
              />
            ))}
          </div>

          {/* LAPIS 4: Parade Maskot Raksasa Melintasi Layar Sesuai Koreografi Tema */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
            {paradeMascots.map((m) => (
              <div
                key={`${burstNonce}-${m.id}`}
                style={{
                  top: `${m.laneTopPct}%`,
                  left: 0,
                  animationName: m.reverse ? 'bnMascotParadeR2L' : 'bnMascotParadeL2R',
                  animationDuration: `${m.durationMs}ms`,
                  animationDelay: `${m.delayMs}ms`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                }}
                className="absolute text-4xl sm:text-6xl drop-shadow-[0_0_25px_rgba(255,255,255,0.85)]"
              >
                {m.emoji}
              </div>
            ))}
          </div>

          {/* LAPIS 5: 96+ Badai Partikel Tematik Berlapis */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden z-10">
            {particles.map((p) => (
              <span
                key={p.id}
                style={{
                  left: `${p.left}%`,
                  top: 0,
                  fontSize: p.sizeRem,
                  animationName: particleAnimName,
                  animationDuration: `${p.durationMs}ms`,
                  animationDelay: `${p.delayMs}ms`,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                className="absolute select-none drop-shadow-[0_4px_14px_rgba(0,0,0,0.65)]"
              >
                {p.emoji}
              </span>
            ))}
          </div>

          {/* Efek Riak Kombo di Titik Klik Nasabah */}
          {clickRipples.map((rip) => (
            <div
              key={rip.id}
              style={{ left: rip.x, top: rip.y }}
              className="pointer-events-none fixed z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-bounce"
            >
              <span className="text-3xl sm:text-4xl drop-shadow-lg">{rip.emoji}</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-[10px] shadow-lg tabular-nums">
                COMBO x{rip.comboNum}!
              </span>
            </div>
          ))}

          {/* BAR ATAS: KONTROL PANGGUNG, KOMBO COUNTER, AUDIO SYNTH & TOMBOL TUTUP */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative z-30 w-full max-w-4xl flex flex-wrap items-center justify-between gap-2 bg-slate-950/90 border-2 border-amber-400/70 rounded-2xl px-3.5 py-2.5 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-lg font-mono font-black text-[10px] uppercase tracking-wider flex items-center gap-1 ${profile.badgeClass}`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{intensityMeta.badgeText}</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-500/25 border border-rose-400 text-rose-200 font-mono font-black text-[11px] flex items-center gap-1 tabular-nums">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                <span>COMBO x{comboCount}</span>
              </span>
              <span className="hidden sm:inline-block text-[10.5px] text-amber-200 font-bold">
                💡 Klik layar di mana saja untuk memicu Ledakan Kombo Ekstra!
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setAudioMuted((m) => !m)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-200 font-bold text-[10.5px] cursor-pointer flex items-center gap-1"
                title={audioMuted ? 'Aktifkan Musik Fanfare' : 'Matikan Suara'}
              >
                {audioMuted ? (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                    <span>Senyap</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fanfare Aktif</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerCanvasConfettiForCelebration(profile.id, intensityMeta.id);
                  if (!audioMuted) {
                    playCelebrationFanfareSynth(profile.id);
                  }
                  setComboCount((c) => c + 1);
                }}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400 hover:text-slate-950 border border-amber-300/60 text-amber-200 font-black text-[10.5px] cursor-pointer flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Tembak Lagi</span>
              </button>

              {onDismiss && (
                <button
                  type="button"
                  onClick={onDismiss}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-[10.5px] cursor-pointer flex items-center gap-1 shadow-lg"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Tutup Panggung</span>
                </button>
              )}
            </div>
          </div>

          {/* LAPIS 6: TROFI / MEDALI HOLOGRAM 3D RAKSASA DI TENGAH LAYAR */}
          <div className="relative z-20 my-auto max-w-2xl w-full flex flex-col items-center text-center space-y-4 px-2">
            {/* Medali / Trofi Hologram 3D Berputar & Bersinar */}
            <div className="relative flex items-center justify-center">
              <div
                style={{
                  background: `conic-gradient(from 0deg, ${profile.laserColors[0]}, ${profile.laserColors[1]}, ${profile.laserColors[2]}, ${profile.laserColors[0]})`,
                }}
                className="w-32 h-32 sm:w-40 sm:h-40 rounded-full blur-xl opacity-75 animate-spin"
              />
              <div
                className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-3xl bg-gradient-to-br ${profile.bannerGradientClass} border-4 border-amber-200 shadow-[0_0_70px_rgba(251,191,36,0.75)] flex flex-col items-center justify-center gap-1 transform transition-transform hover:scale-110`}
              >
                <span className="text-5xl sm:text-6xl leading-none drop-shadow-[0_6px_16px_rgba(0,0,0,0.65)] animate-bounce">
                  {profile.primaryEmoji}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-950/90 border border-amber-300/60 text-amber-300 font-mono font-black text-[8.5px] uppercase tracking-widest flex items-center gap-1">
                  <Trophy className="w-2.5 h-2.5 text-amber-400" />
                  <span>3D HOLO TROPHY</span>
                </span>
              </div>
            </div>

            {/* Spanduk Utama Puncak Selebrasi 100.000x */}
            <div
              className={`w-full rounded-3xl bg-gradient-to-r ${profile.bannerGradientClass} border-2 border-amber-300/90 p-5 sm:p-6 shadow-[0_0_80px_rgba(0,0,0,0.85)] backdrop-blur-xl space-y-2.5`}
            >
              <div className="flex flex-wrap items-center justify-center gap-2">
                <span
                  className={`px-3 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1 ${profile.badgeClass}`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>
                    {isPreviewMode
                      ? `PRATINJAU PANGGUNG: ${profile.name.toUpperCase()}`
                      : profile.trophyTitle}
                  </span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-white/20 text-amber-200 font-mono font-bold text-[10px]">
                  🎬 {profile.choreographyLabel}
                </span>
              </div>

              {customSenderOverride && (
                <div className="text-[11px] font-bold text-amber-200">
                  ✨ Persembahan Spesial Dari: <strong className="text-white">{customSenderOverride}</strong>
                </div>
              )}

              <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-snug drop-shadow">
                {customHeadlineOverride || profile.celebrationHeadline}
              </h2>

              <p className="text-xs sm:text-sm text-slate-100/95 max-w-xl mx-auto leading-relaxed">
                {customSubtextOverride || profile.celebrationSubtext}
              </p>

              {/* Deretan Ikon Partikel & Maskot Tema */}
              <div className="pt-1 flex items-center justify-center gap-2 text-lg sm:text-xl">
                {profile.particleEmojis.map((em, idx) => (
                  <span
                    key={idx}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className="inline-block animate-bounce"
                  >
                    {em}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* BAR BAWAH: PETUNJUK INTERAKSI KLIK KOMBO */}
          <div className="relative z-20 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/85 border border-amber-400/50 text-amber-200 font-mono font-bold text-[11px] shadow-lg">
              <span>🔥 KLIK LAYAR UNTUK LEDAKAN KOMBO EKSTRA ({comboCount}x)</span>
              {onDismiss && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss();
                  }}
                  className="ml-2 underline text-white hover:text-amber-300 cursor-pointer"
                >
                  Selesai &amp; Tutup
                </button>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
};
