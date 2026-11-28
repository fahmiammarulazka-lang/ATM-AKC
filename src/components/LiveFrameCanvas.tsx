import React, { useEffect, useRef } from 'react';
import {
  shouldRunFrameAnimation,
  useFrameMotionMode,
} from '../utils/frameMotionPreference';

export type LiveCanvasTheme =
  | 'petir'
  | 'api'
  | 'emas'
  | 'es'
  | 'galaksi'
  | 'clean'
  | 'sapphire'
  | 'gold'
  | 'diamond'
  | 'emerald'
  | 'flame'
  | 'violet'
  | 'obsidian';

interface LiveFrameCanvasProps {
  theme: LiveCanvasTheme;
  isExclusive: boolean;
  size: 'sm' | 'md' | 'lg' | 'xl';
  burstTriggerNonce: number;
  stageHighlight?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularSpeed: number;
  orbitRadius: number;
  orbitRatioY: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: string;
  twinklePhase: number;
  kind: 'spark' | 'ember' | 'flake' | 'star' | 'comet';
}

const EXCLUSIVE_PALETTES: Record<
  'petir' | 'api' | 'emas' | 'es' | 'galaksi',
  string[]
> = {
  petir: ['#ffffff', '#67e8f9', '#22d3ee', '#0284c7', '#a5f3fc'],
  api: ['#fef08a', '#fb923c', '#f97316', '#dc2626', '#ffffff'],
  emas: ['#ffffff', '#fef08a', '#facc15', '#d97706', '#fde047'],
  es: ['#ffffff', '#e0f2fe', '#7dd3fc', '#0284c7', '#38bdf8'],
  galaksi: ['#ffffff', '#f0abfc', '#c084fc', '#6366f1', '#ec4899'],
};

const AMBIENT_PALETTES: Record<
  | 'clean'
  | 'sapphire'
  | 'gold'
  | 'diamond'
  | 'emerald'
  | 'flame'
  | 'violet'
  | 'obsidian',
  string[]
> = {
  clean: ['#ffffff', '#94a3b8', '#475569'],
  sapphire: ['#ffffff', '#60a5fa', '#2563eb'],
  gold: ['#ffffff', '#fde047', '#d97706'],
  diamond: ['#ffffff', '#67e8f9', '#0891b2'],
  emerald: ['#ffffff', '#6ee7b7', '#059669'],
  flame: ['#fef08a', '#fb923c', '#dc2626'],
  violet: ['#f5d0fe', '#c084fc', '#7c3aed'],
  obsidian: ['#fde047', '#f59e0b', '#334155'],
};

// Deep saturated halo colors so glowing cores pop sharply on BOTH white cards & dark surfaces
const CONTRAST_HALOS: Record<LiveCanvasTheme, string> = {
  petir: '#0369a1',
  api: '#b91c1c',
  emas: '#b45309',
  es: '#0369a1',
  galaksi: '#6d28d9',
  clean: '#334155',
  sapphire: '#1d4ed8',
  gold: '#b45309',
  diamond: '#0e7490',
  emerald: '#047857',
  flame: '#b91c1c',
  violet: '#6d28d9',
  obsidian: '#92400e',
};

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerR: number,
  rotation: number,
  outlineColor: string
) {
  const innerR = outerR * 0.36;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 8; i += 1) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = (i * Math.PI) / 4;
    if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.lineWidth = 1.25;
  ctx.strokeStyle = outlineColor;
  ctx.stroke();
  ctx.fill();
  ctx.restore();
}

function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number,
  haloColor: string,
  coreColor: string,
  lineWidth: number
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 3; i += 1) {
    const a = (i * Math.PI) / 3;
    ctx.moveTo(Math.cos(a) * -r, Math.sin(a) * -r);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.lineCap = 'round';
  // Dark/saturated halo stroke first for crisp contrast on white Profil cards
  ctx.strokeStyle = haloColor;
  ctx.lineWidth = lineWidth + 1.4;
  ctx.stroke();
  // Crisp bright core
  ctx.strokeStyle = coreColor;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
  ctx.restore();
}

export const LiveFrameCanvas: React.FC<LiveFrameCanvasProps> = ({
  theme,
  isExclusive,
  size,
  burstTriggerNonce,
  stageHighlight = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const burstEnergyRef = useRef<number>(0);
  const lastBurstNonceRef = useRef<number>(burstTriggerNonce);
  const [motionMode] = useFrameMotionMode();

  useEffect(() => {
    if (burstTriggerNonce !== lastBurstNonceRef.current) {
      lastBurstNonceRef.current = burstTriggerNonce;
      burstEnergyRef.current = 1;
    }
  }, [burstTriggerNonce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const padPx =
      size === 'sm' ? 14 : size === 'md' ? 19 : stageHighlight ? 34 : 25;
    const corePx =
      size === 'sm' ? 28 : size === 'md' ? 40 : size === 'xl' ? 92 : 56;
    const logicalSize = corePx + padPx * 2;

    const syncCanvasDimensions = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const targetW = Math.round(logicalSize * dpr);
      const targetH = Math.round(logicalSize * dpr);
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }
      return dpr;
    };

    let currentDpr = syncCanvasDimensions();

    // If battery-saver is chosen AND OS reduced-motion is enabled, clear canvas & stop loop
    if (!shouldRunFrameAnimation(motionMode)) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const isBatterySaver = motionMode === 'battery-saver';
    const cx = logicalSize / 2;
    const cy = logicalSize / 2;
    const rimRadius = corePx * 0.56;

    const palette = isExclusive
      ? EXCLUSIVE_PALETTES[theme as keyof typeof EXCLUSIVE_PALETTES] ||
        EXCLUSIVE_PALETTES.petir
      : AMBIENT_PALETTES[theme as keyof typeof AMBIENT_PALETTES] ||
        AMBIENT_PALETTES.clean;
    const contrastHalo = CONTRAST_HALOS[theme] || '#1e293b';

    const baseParticleCount = isExclusive
      ? size === 'sm'
        ? 14
        : size === 'md'
        ? 22
        : stageHighlight
        ? 36
        : 28
      : size === 'sm'
      ? 7
      : 11;
    const particleCount = isBatterySaver
      ? Math.max(4, Math.round(baseParticleCount * 0.55))
      : baseParticleCount;

    const particles: Particle[] = Array.from(
      { length: particleCount },
      (_, i) => {
        const a = (i / particleCount) * Math.PI * 2 + Math.random() * 0.4;
        const col = palette[i % palette.length];
        return {
          x: cx + Math.cos(a) * rimRadius,
          y: cy + Math.sin(a) * rimRadius,
          vx: (Math.random() - 0.5) * 18,
          vy: -12 - Math.random() * 24,
          angle: a,
          angularSpeed:
            (theme === 'es' ? -1 : 1) *
            ((isExclusive ? 1.55 : 1.15) + Math.random() * 1.4),
          orbitRadius: rimRadius * (0.94 + Math.random() * 0.24),
          orbitRatioY: theme === 'galaksi' ? 0.48 + Math.random() * 0.52 : 1,
          size:
            size === 'sm'
              ? 2.0 + Math.random() * 1.4
              : (isExclusive ? 2.2 : 1.65) +
                Math.random() * (stageHighlight ? 2.8 : 2.1),
          alpha: 0.72 + Math.random() * 0.28,
          life: Math.random(),
          maxLife: 0.7 + Math.random() * 0.9,
          color: col,
          twinklePhase: Math.random() * Math.PI * 2,
          kind:
            theme === 'api'
              ? 'ember'
              : theme === 'es'
              ? 'flake'
              : theme === 'emas' || theme === 'galaksi'
              ? 'star'
              : 'spark',
        };
      }
    );

    let plasmaTimer = 0;
    let arcSeedAngles = [0.2, 2.3, 4.4];
    let arcJitterPts: number[][] = arcSeedAngles.map(() =>
      Array.from(
        { length: 7 },
        () => (Math.random() - 0.5) * (size === 'sm' ? 5.2 : 7.5)
      )
    );

    const checkRectVisible = () => {
      if (document.hidden) return false;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return false;
      const vw =
        window.innerWidth || document.documentElement.clientWidth || 1440;
      const vh =
        window.innerHeight || document.documentElement.clientHeight || 900;
      const margin = 120;
      return (
        rect.bottom >= -margin &&
        rect.top <= vh + margin &&
        rect.right >= -margin &&
        rect.left <= vw + margin
      );
    };

    let observerVisible = true;
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          observerVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.01, rootMargin: '80px' }
      );
      observer.observe(canvas);
    }

    let resizeObserver: ResizeObserver | null = null;
    const handleResize = () => {
      currentDpr = syncCanvasDimensions();
    };
    if ('ResizeObserver' in window) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(canvas);
    }
    window.addEventListener('resize', handleResize, { passive: true });

    let animFrameId = 0;
    let prevTs = performance.now();
    let frameTick = 0;
    let cachedRectVisible = true;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        prevTs = performance.now();
        cachedRectVisible = checkRectVisible();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Watch OS reduced-motion changes if user is in battery-saver mode
    const reducedMql =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = () => {
      if (isBatterySaver && reducedMql?.matches) {
        window.cancelAnimationFrame(animFrameId);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    if (reducedMql && typeof reducedMql.addEventListener === 'function') {
      reducedMql.addEventListener('change', handleReducedMotionChange);
    }

    const blurScale = isBatterySaver ? 0.5 : 1;

    const drawFrame = (nowTs: number) => {
      animFrameId = window.requestAnimationFrame(drawFrame);

      if (document.hidden) {
        prevTs = nowTs;
        return;
      }

      // Hybrid visibility verification: only pause when BOTH observer says offscreen AND bounding rect confirms offscreen
      frameTick += 1;
      if (!observerVisible) {
        if (frameTick % 12 === 1) {
          cachedRectVisible = checkRectVisible();
        }
        if (!cachedRectVisible) {
          prevTs = nowTs;
          return;
        }
      }

      const dtMs = Math.min(40, Math.max(1, nowTs - prevTs));
      const dt = dtMs / 1000;
      prevTs = nowTs;
      const tSec = nowTs / 1000;

      if (burstEnergyRef.current > 0) {
        burstEnergyRef.current = Math.max(0, burstEnergyRef.current - dt * 0.98);
      }
      const burst = burstEnergyRef.current;

      ctx.save();
      ctx.setTransform(currentDpr, 0, 0, currentDpr, 0, 0);
      ctx.clearRect(0, 0, logicalSize, logicalSize);
      // Dual-layer source-over ensures crisp saturated contrast on white cards AND radiant glow on dark backgrounds
      ctx.globalCompositeOperation = 'source-over';

      // 1. Continuous Rapidly Rotating Energy Ribbons / Glow Ring
      const spinAngle = tSec * (isExclusive ? 2.9 : 1.85);
      const ribbonCount = isExclusive ? 2 : 1;
      for (let r = 0; r < ribbonCount; r += 1) {
        const startA = spinAngle + r * Math.PI;
        const arcLen = isExclusive ? 1.2 : 1.05;
        const arcR = rimRadius * (1 + burst * 0.08);
        const baseWidth =
          (size === 'sm' ? 2.3 : isExclusive ? 2.9 : 2.1) + burst * 2.0;

        // Saturated contrast halo stroke
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, startA, startA + arcLen);
        ctx.strokeStyle = contrastHalo;
        ctx.lineWidth = baseWidth + 1.6;
        ctx.shadowColor = palette[1] || contrastHalo;
        ctx.shadowBlur = ((size === 'sm' ? 9 : 13) + burst * 10) * blurScale;
        ctx.lineCap = 'round';
        ctx.globalAlpha = (isExclusive ? 0.72 : 0.56) + burst * 0.24;
        ctx.stroke();

        // Bright neon core stroke
        ctx.beginPath();
        ctx.arc(cx, cy, arcR, startA, startA + arcLen);
        ctx.strokeStyle = palette[r % palette.length];
        ctx.lineWidth = baseWidth * 0.78;
        ctx.shadowBlur = ((size === 'sm' ? 6 : 10) + burst * 8) * blurScale;
        ctx.globalAlpha = (isExclusive ? 0.92 : 0.78) + burst * 0.08;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Theme-Specific Real-Time Continuous Engine
      if (theme === 'petir') {
        plasmaTimer += dtMs;
        if (plasmaTimer >= 45) {
          plasmaTimer = 0;
          arcSeedAngles = arcSeedAngles.map(
            (a) => a + 0.35 + Math.random() * 0.55
          );
          arcJitterPts = arcSeedAngles.map(() =>
            Array.from(
              { length: 7 },
              () =>
                (Math.random() - 0.5) *
                (size === 'sm' ? 5.2 + burst * 3 : 8.5 + burst * 6)
            )
          );
        }

        const activeArcs = burst > 0.2 ? 3 : 2;
        for (let aIdx = 0; aIdx < activeArcs; aIdx += 1) {
          const baseA = arcSeedAngles[aIdx];
          const jitters = arcJitterPts[aIdx];
          ctx.save();
          ctx.beginPath();
          for (let s = 0; s < jitters.length; s += 1) {
            const frac = s / (jitters.length - 1);
            const ang = baseA + frac * (1.28 + burst * 0.55);
            const rad = rimRadius + jitters[s];
            const px = cx + Math.cos(ang) * rad;
            const py = cy + Math.sin(ang) * rad;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          // Outer deep-cyan aura for high contrast on white & dark surfaces
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = (size === 'sm' ? 3.8 : 4.4) + burst * 2.0;
          ctx.shadowColor = '#0ea5e9';
          ctx.shadowBlur = (11 + burst * 12) * blurScale;
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';
          ctx.stroke();

          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = (size === 'sm' ? 2.2 : 2.6) + burst * 1.4;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = size === 'sm' ? 1.05 : 1.25;
          ctx.stroke();
          ctx.restore();
        }
      } else if (theme === 'api') {
        const tongueCount = size === 'sm' ? 7 : 10;
        for (let i = 0; i < tongueCount; i += 1) {
          const a =
            (i / tongueCount) * Math.PI * 2 + Math.sin(tSec * 4 + i) * 0.14;
          const wave = Math.sin(tSec * 9.5 + i * 1.7) * 0.5 + 0.5;
          const flameH =
            (size === 'sm' ? 5.2 : 8.8) +
            wave * (size === 'sm' ? 4.5 : 8.2) +
            burst * 11;
          const bx = cx + Math.cos(a) * rimRadius;
          const by = cy + Math.sin(a) * rimRadius;
          const tx = cx + Math.cos(a) * (rimRadius + flameH);
          const ty =
            cy + Math.sin(a) * (rimRadius + flameH) - (size === 'sm' ? 2 : 5);
          const cpx = (bx + tx) / 2 + Math.sin(tSec * 12 + i) * 3;
          const cpy = (by + ty) / 2;

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(cpx, cpy, tx, ty);
          ctx.lineCap = 'round';
          // Deep crimson halo stroke
          ctx.strokeStyle = '#b91c1c';
          ctx.lineWidth = (size === 'sm' ? 4.0 : 5.0) + burst * 1.8;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 10 * blurScale;
          ctx.globalAlpha = 0.85;
          ctx.stroke();

          // Molten orange-gold flame core
          ctx.strokeStyle = i % 2 === 0 ? '#fb923c' : '#fde047';
          ctx.lineWidth = (size === 'sm' ? 2.2 : 3.0) + burst * 1.2;
          ctx.globalAlpha = 0.88 + wave * 0.12;
          ctx.stroke();
          ctx.restore();
        }
      } else if (theme === 'galaksi') {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.42 + Math.sin(tSec * 0.8) * 0.08);
        ctx.beginPath();
        ctx.ellipse(
          0,
          0,
          rimRadius * 1.24,
          rimRadius * 0.54,
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = '#7e22ce';
        ctx.lineWidth = size === 'sm' ? 2.6 : 3.0;
        ctx.shadowColor = '#9333ea';
        ctx.shadowBlur = (10 + burst * 10) * blurScale;
        ctx.globalAlpha = 0.58 + burst * 0.25;
        ctx.stroke();

        ctx.strokeStyle = '#f0abfc';
        ctx.lineWidth = size === 'sm' ? 1.3 : 1.7;
        ctx.globalAlpha =
          0.72 + Math.sin(tSec * 2.5) * 0.2 + burst * 0.25;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Burst Shockwave Expansion Ring (when burstEnergy > 0)
      if (burst > 0.02 && isExclusive) {
        const progress = 1 - burst;
        const shockRadius = rimRadius * (0.95 + progress * 0.98);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = contrastHalo;
        ctx.lineWidth = (size === 'sm' ? 3.8 : 4.8) * burst;
        ctx.shadowColor = palette[1] || contrastHalo;
        ctx.shadowBlur = 14 * blurScale;
        ctx.globalAlpha = burst * 0.88;
        ctx.stroke();

        ctx.strokeStyle = palette[0];
        ctx.lineWidth = (size === 'sm' ? 1.8 : 2.4) * burst;
        ctx.globalAlpha = burst * 0.96;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Update & Draw Live Continuous Particles (60-144fps)
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.twinklePhase += dt * 5.2;

        if (theme === 'api' && isExclusive) {
          p.life += dt * (1.05 + burst * 1.4);
          if (p.life >= p.maxLife) {
            p.life = 0;
            const spawnA = Math.random() * Math.PI * 2;
            p.x = cx + Math.cos(spawnA) * (rimRadius * 0.96);
            p.y = cy + Math.sin(spawnA) * (rimRadius * 0.92);
            p.vx = (Math.random() - 0.5) * 20;
            p.vy = -22 - Math.random() * 28 - burst * 25;
          } else {
            p.x += (p.vx + Math.sin(tSec * 8 + i) * 12) * dt;
            p.y += p.vy * dt;
          }
          const fade = 1 - p.life / p.maxLife;
          ctx.save();
          ctx.fillStyle = p.color;
          ctx.strokeStyle = '#991b1b';
          ctx.lineWidth = 1;
          ctx.shadowColor = '#dc2626';
          ctx.shadowBlur = 8 * blurScale;
          ctx.globalAlpha = Math.max(0, fade * 0.96);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.72 + fade * 0.5), 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          ctx.restore();
        } else if (theme === 'emas' && isExclusive) {
          p.angle += p.angularSpeed * dt * (1 + burst * 1.8);
          const fallDrop =
            ((tSec * 0.65 + i * 0.17) % 1) * (size === 'sm' ? 9 : 16);
          const px = cx + Math.cos(p.angle) * (p.orbitRadius + burst * 8);
          const py =
            cy +
            Math.sin(p.angle) * (p.orbitRadius * 0.9) +
            fallDrop -
            (size === 'sm' ? 3 : 6);
          const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#b45309';
          ctx.shadowBlur = 8 * blurScale;
          ctx.globalAlpha = 0.68 + twinkle * 0.32;
          drawFourPointStar(
            ctx,
            px,
            py,
            p.size * (1.15 + twinkle * 0.5 + burst * 0.5),
            p.angle,
            '#92400e'
          );
          ctx.restore();
        } else if (theme === 'es' && isExclusive) {
          p.angle += p.angularSpeed * dt * (1 + burst * 2.2);
          const radialPulse = Math.sin(tSec * 3.5 + i) * 2.5 + burst * 9;
          const px = cx + Math.cos(p.angle) * (p.orbitRadius + radialPulse);
          const py = cy + Math.sin(p.angle) * (p.orbitRadius + radialPulse);

          ctx.save();
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8 * blurScale;
          ctx.globalAlpha = 0.78 + Math.sin(p.twinklePhase) * 0.22;
          drawSnowflake(
            ctx,
            px,
            py,
            p.size * 1.38,
            tSec * 2 + i,
            '#0369a1',
            p.color,
            size === 'sm' ? 1.15 : 1.5
          );
          ctx.restore();
        } else if (theme === 'galaksi' && isExclusive) {
          p.angle += p.angularSpeed * dt * (1 + burst * 2.1);
          const tilt = i % 2 === 0 ? -0.45 : 0.42;
          const lx = Math.cos(p.angle) * (p.orbitRadius * 1.18 + burst * 9);
          const ly = Math.sin(p.angle) * (p.orbitRadius * p.orbitRatioY);
          const px = cx + lx * Math.cos(tilt) - ly * Math.sin(tilt);
          const py = cy + lx * Math.sin(tilt) + ly * Math.cos(tilt);
          const twinkle = 0.45 + 0.55 * Math.sin(p.twinklePhase);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.strokeStyle = '#6d28d9';
          ctx.lineWidth = 1;
          ctx.shadowColor = '#9333ea';
          ctx.shadowBlur = 9 * blurScale;
          ctx.globalAlpha = 0.68 + twinkle * 0.32;
          if (i % 3 === 0) {
            drawFourPointStar(ctx, px, py, p.size * 1.45, p.angle, '#581c87');
          } else {
            ctx.beginPath();
            ctx.arc(px, py, p.size * 0.84, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fill();
          }
          ctx.restore();
        } else {
          // Petir Cyber sparks + 8 Regular Profile Frame ambient comets
          p.angle +=
            p.angularSpeed *
            dt *
            (isExclusive ? 1.85 + burst * 2.2 : 1.2 + burst * 1.5);
          const jitter =
            theme === 'petir'
              ? Math.sin(tSec * 28 + i * 3) * (size === 'sm' ? 2.2 : 4)
              : 0;
          const rad = p.orbitRadius + jitter + burst * 8;
          const px = cx + Math.cos(p.angle) * rad;
          const py = cy + Math.sin(p.angle) * rad;
          const twinkle = 0.55 + 0.45 * Math.sin(p.twinklePhase);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.strokeStyle = contrastHalo;
          ctx.lineWidth = 1.1;
          ctx.shadowColor = contrastHalo;
          ctx.shadowBlur = (isExclusive ? 10 : 7) * blurScale;
          ctx.globalAlpha = Math.min(
            1,
            (isExclusive ? 0.85 : 0.72) * twinkle + burst * 0.25
          );
          ctx.beginPath();
          ctx.arc(px, py, p.size * (0.82 + burst * 0.45), 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          ctx.restore();
        }
      }

      ctx.restore();
    };

    animFrameId = window.requestAnimationFrame(drawFrame);

    return () => {
      window.cancelAnimationFrame(animFrameId);
      if (observer) observer.disconnect();
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (reducedMql && typeof reducedMql.removeEventListener === 'function') {
        reducedMql.removeEventListener('change', handleReducedMotionChange);
      }
    };
  }, [theme, isExclusive, size, stageHighlight, motionMode]);

  const padClass =
    size === 'sm'
      ? '-inset-[14px] w-[calc(100%+28px)] h-[calc(100%+28px)]'
      : size === 'md'
      ? '-inset-[19px] w-[calc(100%+38px)] h-[calc(100%+38px)]'
      : stageHighlight
      ? '-inset-[34px] w-[calc(100%+68px)] h-[calc(100%+68px)]'
      : '-inset-[25px] w-[calc(100%+50px)] h-[calc(100%+50px)]';

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute ${padClass} pointer-events-none z-[15]`}
    />
  );
};
