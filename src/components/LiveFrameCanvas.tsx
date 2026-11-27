import React, { useEffect, useRef } from 'react';

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

const EXCLUSIVE_PALETTES: Record<'petir' | 'api' | 'emas' | 'es' | 'galaksi', string[]> = {
  petir: ['#ffffff', '#67e8f9', '#22d3ee', '#38bdf8', '#a5f3fc'],
  api: ['#fef08a', '#fb923c', '#f97316', '#ef4444', '#ffffff'],
  emas: ['#ffffff', '#fef08a', '#facc15', '#f59e0b', '#fde047'],
  es: ['#ffffff', '#e0f2fe', '#bae6fd', '#7dd3fc', '#38bdf8'],
  galaksi: ['#ffffff', '#f0abfc', '#c084fc', '#818cf8', '#f472b6'],
};

const AMBIENT_PALETTES: Record<
  'clean' | 'sapphire' | 'gold' | 'diamond' | 'emerald' | 'flame' | 'violet' | 'obsidian',
  string[]
> = {
  clean: ['#ffffff', '#cbd5e1', '#94a3b8'],
  sapphire: ['#ffffff', '#60a5fa', '#3b82f6'],
  gold: ['#ffffff', '#fde047', '#f59e0b'],
  diamond: ['#ffffff', '#67e8f9', '#06b6d4'],
  emerald: ['#ffffff', '#6ee7b7', '#10b981'],
  flame: ['#fef08a', '#fb923c', '#ef4444'],
  violet: ['#f5d0fe', '#c084fc', '#8b5cf6'],
  obsidian: ['#fde047', '#f59e0b', '#e2e8f0'],
};

function drawFourPointStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  outerR: number,
  rotation: number
) {
  const innerR = outerR * 0.34;
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
  ctx.fill();
  ctx.restore();
}

function drawSnowflake(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rotation: number
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

  useEffect(() => {
    if (burstTriggerNonce !== lastBurstNonceRef.current) {
      lastBurstNonceRef.current = burstTriggerNonce;
      burstEnergyRef.current = 1;
    }
  }, [burstTriggerNonce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Logical CSS dimensions around the avatar badge
    const padPx =
      size === 'sm' ? 12 : size === 'md' ? 18 : stageHighlight ? 32 : 24;
    const corePx =
      size === 'sm' ? 28 : size === 'md' ? 40 : size === 'xl' ? 92 : 56;
    const logicalSize = corePx + padPx * 2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(logicalSize * dpr);
    canvas.height = Math.round(logicalSize * dpr);

    const cx = logicalSize / 2;
    const cy = logicalSize / 2;
    const rimRadius = corePx * 0.56;

    const palette = isExclusive
      ? EXCLUSIVE_PALETTES[theme as keyof typeof EXCLUSIVE_PALETTES] || EXCLUSIVE_PALETTES.petir
      : AMBIENT_PALETTES[theme as keyof typeof AMBIENT_PALETTES] || AMBIENT_PALETTES.clean;

    const particleCount = isExclusive
      ? size === 'sm'
        ? 12
        : size === 'md'
        ? 22
        : stageHighlight
        ? 36
        : 28
      : size === 'sm'
      ? 6
      : 10;

    const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
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
          ((isExclusive ? 1.5 : 1.1) + Math.random() * 1.4),
        orbitRadius: rimRadius * (0.94 + Math.random() * 0.24),
        orbitRatioY: theme === 'galaksi' ? 0.48 + Math.random() * 0.52 : 1,
        size:
          size === 'sm'
            ? 1.5 + Math.random() * 1.4
            : (isExclusive ? 2.1 : 1.5) + Math.random() * (stageHighlight ? 2.8 : 2.1),
        alpha: 0.65 + Math.random() * 0.35,
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
    });

    // Cached jagged lightning bolts updated every ~42ms for crisp electric crackling
    let plasmaTimer = 0;
    let arcSeedAngles = [0.2, 2.3, 4.4];
    let arcJitterPts: number[][] = arcSeedAngles.map(() =>
      Array.from({ length: 7 }, () => (Math.random() - 0.5) * (size === 'sm' ? 4 : 7))
    );

    let isVisible = true;
    let observer: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          isVisible = entries[0]?.isIntersecting ?? true;
        },
        { threshold: 0.02 }
      );
      observer.observe(canvas);
    }

    let animFrameId = 0;
    let prevTs = performance.now();

    const drawFrame = (nowTs: number) => {
      animFrameId = window.requestAnimationFrame(drawFrame);

      if (!isVisible || document.hidden) {
        prevTs = nowTs;
        return;
      }

      const dtMs = Math.min(48, Math.max(1, nowTs - prevTs));
      const dt = dtMs / 1000;
      prevTs = nowTs;
      const tSec = nowTs / 1000;

      // Decay burst energy smoothly (~1.0s)
      if (burstEnergyRef.current > 0) {
        burstEnergyRef.current = Math.max(0, burstEnergyRef.current - dt * 0.98);
      }
      const burst = burstEnergyRef.current;

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, logicalSize, logicalSize);
      ctx.globalCompositeOperation = 'lighter';

      // 1. Continuous Rapidly Rotating Energy Ribbons / Glow Ring
      const spinAngle = tSec * (isExclusive ? 2.8 : 1.7);
      const ribbonCount = isExclusive ? 2 : 1;
      for (let r = 0; r < ribbonCount; r += 1) {
        const startA = spinAngle + r * Math.PI;
        const arcLen = isExclusive ? 1.15 : 0.95;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, rimRadius * (1 + burst * 0.08), startA, startA + arcLen);
        ctx.strokeStyle = palette[r % palette.length];
        ctx.lineWidth = (size === 'sm' ? 1.8 : isExclusive ? 2.8 : 1.8) + burst * 1.8;
        ctx.shadowColor = palette[1] || palette[0];
        ctx.shadowBlur = (size === 'sm' ? 6 : 12) + burst * 10;
        ctx.lineCap = 'round';
        ctx.globalAlpha = (isExclusive ? 0.78 : 0.52) + burst * 0.22;
        ctx.stroke();
        ctx.restore();
      }

      // 2. Theme-Specific Real-Time Continuous Engine
      if (theme === 'petir') {
        plasmaTimer += dtMs;
        if (plasmaTimer >= 45) {
          plasmaTimer = 0;
          arcSeedAngles = arcSeedAngles.map((a) => a + 0.35 + Math.random() * 0.55);
          arcJitterPts = arcSeedAngles.map(() =>
            Array.from({ length: 7 }, () => (Math.random() - 0.5) * (size === 'sm' ? 4.5 : 8.5 + burst * 6))
          );
        }

        // Continuous crackling plasma arcs along perimeter
        const activeArcs = burst > 0.2 ? 3 : 2;
        for (let aIdx = 0; aIdx < activeArcs; aIdx += 1) {
          const baseA = arcSeedAngles[aIdx];
          const jitters = arcJitterPts[aIdx];
          ctx.save();
          ctx.beginPath();
          for (let s = 0; s < jitters.length; s += 1) {
            const frac = s / (jitters.length - 1);
            const ang = baseA + frac * (1.25 + burst * 0.55);
            const rad = rimRadius + jitters[s];
            const px = cx + Math.cos(ang) * rad;
            const py = cy + Math.sin(ang) * rad;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = '#67e8f9';
          ctx.lineWidth = (size === 'sm' ? 2.1 : 2.8) + burst * 1.8;
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10 + burst * 12;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = size === 'sm' ? 0.9 : 1.2;
          ctx.stroke();
          ctx.restore();
        }
      } else if (theme === 'api') {
        // Dancing sinusoidal dragon flame aura tongues every frame
        const tongueCount = size === 'sm' ? 6 : 10;
        for (let i = 0; i < tongueCount; i += 1) {
          const a = (i / tongueCount) * Math.PI * 2 + Math.sin(tSec * 4 + i) * 0.14;
          const wave = Math.sin(tSec * 9.5 + i * 1.7) * 0.5 + 0.5;
          const flameH =
            (size === 'sm' ? 4.5 : 8.5) + wave * (size === 'sm' ? 4 : 8) + burst * 11;
          const bx = cx + Math.cos(a) * rimRadius;
          const by = cy + Math.sin(a) * rimRadius;
          const tx = cx + Math.cos(a) * (rimRadius + flameH);
          const ty = cy + Math.sin(a) * (rimRadius + flameH) - (size === 'sm' ? 2 : 5);

          ctx.save();
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(
            (bx + tx) / 2 + Math.sin(tSec * 12 + i) * 3,
            (by + ty) / 2,
            tx,
            ty
          );
          ctx.strokeStyle = i % 2 === 0 ? '#fb923c' : '#fde047';
          ctx.lineWidth = (size === 'sm' ? 2.4 : 3.4) + burst * 1.5;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 10;
          ctx.lineCap = 'round';
          ctx.globalAlpha = 0.78 + wave * 0.22;
          ctx.stroke();
          ctx.restore();
        }
      } else if (theme === 'galaksi') {
        // Tilted 3D elliptical nebula orbit paths
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(-0.42 + Math.sin(tSec * 0.8) * 0.08);
        ctx.beginPath();
        ctx.ellipse(0, 0, rimRadius * 1.24, rimRadius * 0.54, 0, 0, Math.PI * 2);
        ctx.strokeStyle = '#e879f9';
        ctx.lineWidth = size === 'sm' ? 1.2 : 1.7;
        ctx.shadowColor = '#c084fc';
        ctx.shadowBlur = 10 + burst * 10;
        ctx.globalAlpha = 0.55 + Math.sin(tSec * 2.5) * 0.2 + burst * 0.25;
        ctx.stroke();
        ctx.restore();
      }

      // 3. Burst Shockwave Expansion Ring (when burstEnergy > 0)
      if (burst > 0.02 && isExclusive) {
        const progress = 1 - burst;
        const shockRadius = rimRadius * (0.95 + progress * 0.95);
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, shockRadius, 0, Math.PI * 2);
        ctx.strokeStyle = palette[0];
        ctx.lineWidth = (size === 'sm' ? 2.2 : 3.4) * burst;
        ctx.shadowColor = palette[1];
        ctx.shadowBlur = 16;
        ctx.globalAlpha = burst * 0.95;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Update & Draw Live Continuous Particles (60-120fps)
      for (let i = 0; i < particles.length; i += 1) {
        const p = particles[i];
        p.twinklePhase += dt * 5.2;

        if (theme === 'api' && isExclusive) {
          // Rising embers surging upward non-stop
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
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = Math.max(0, fade * 0.95);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * (0.7 + fade * 0.5), 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (theme === 'emas' && isExclusive) {
          // Falling & orbiting 24K golden flakes + twinkling stars
          p.angle += p.angularSpeed * dt * (1 + burst * 1.8);
          const fallDrop = ((tSec * 0.65 + i * 0.17) % 1) * (size === 'sm' ? 8 : 16);
          const px = cx + Math.cos(p.angle) * (p.orbitRadius + burst * 8);
          const py = cy + Math.sin(p.angle) * (p.orbitRadius * 0.9) + fallDrop - (size === 'sm' ? 3 : 6);
          const twinkle = 0.5 + 0.5 * Math.sin(p.twinklePhase);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#facc15';
          ctx.shadowBlur = 9;
          ctx.globalAlpha = 0.5 + twinkle * 0.5;
          drawFourPointStar(ctx, px, py, p.size * (1.1 + twinkle * 0.5 + burst * 0.5), p.angle);
          ctx.restore();
        } else if (theme === 'es' && isExclusive) {
          // Swirling blizzard snowflakes & crystalline shards
          p.angle += p.angularSpeed * dt * (1 + burst * 2.2);
          const radialPulse = Math.sin(tSec * 3.5 + i) * 2.5 + burst * 9;
          const px = cx + Math.cos(p.angle) * (p.orbitRadius + radialPulse);
          const py = cy + Math.sin(p.angle) * (p.orbitRadius + radialPulse);

          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = size === 'sm' ? 1.1 : 1.5;
          ctx.shadowColor = '#7dd3fc';
          ctx.shadowBlur = 8;
          ctx.globalAlpha = 0.72 + Math.sin(p.twinklePhase) * 0.25;
          drawSnowflake(ctx, px, py, p.size * 1.35, tSec * 2 + i);
          ctx.restore();
        } else if (theme === 'galaksi' && isExclusive) {
          // 3D tilted orbiting stars + nebula dust
          p.angle += p.angularSpeed * dt * (1 + burst * 2.1);
          const tilt = i % 2 === 0 ? -0.45 : 0.42;
          const lx = Math.cos(p.angle) * (p.orbitRadius * 1.18 + burst * 9);
          const ly = Math.sin(p.angle) * (p.orbitRadius * p.orbitRatioY);
          const px = cx + lx * Math.cos(tilt) - ly * Math.sin(tilt);
          const py = cy + lx * Math.sin(tilt) + ly * Math.cos(tilt);
          const twinkle = 0.45 + 0.55 * Math.sin(p.twinklePhase);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#d946ef';
          ctx.shadowBlur = 10;
          ctx.globalAlpha = 0.55 + twinkle * 0.45;
          if (i % 3 === 0) {
            drawFourPointStar(ctx, px, py, p.size * 1.45, p.angle);
          } else {
            ctx.beginPath();
            ctx.arc(px, py, p.size * 0.78, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else {
          // Petir Cyber sparks + 8 Regular Profile Frame ambient comets
          p.angle += p.angularSpeed * dt * (isExclusive ? 1.8 + burst * 2.2 : 1.1 + burst * 1.5);
          const jitter = theme === 'petir' ? Math.sin(tSec * 28 + i * 3) * (size === 'sm' ? 2 : 4) : 0;
          const rad = p.orbitRadius + jitter + burst * 8;
          const px = cx + Math.cos(p.angle) * rad;
          const py = cy + Math.sin(p.angle) * rad;
          const twinkle = 0.55 + 0.45 * Math.sin(p.twinklePhase);

          ctx.save();
          ctx.fillStyle = p.color;
          ctx.shadowColor = palette[1] || palette[0];
          ctx.shadowBlur = isExclusive ? 10 : 6;
          ctx.globalAlpha = (isExclusive ? 0.75 : 0.55) * twinkle + burst * 0.25;
          ctx.beginPath();
          ctx.arc(px, py, p.size * (0.75 + burst * 0.45), 0, Math.PI * 2);
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
    };
  }, [theme, isExclusive, size, stageHighlight]);

  const padClass =
    size === 'sm'
      ? '-inset-[12px] w-[calc(100%+24px)] h-[calc(100%+24px)]'
      : size === 'md'
      ? '-inset-[18px] w-[calc(100%+36px)] h-[calc(100%+36px)]'
      : stageHighlight
      ? '-inset-[32px] w-[calc(100%+64px)] h-[calc(100%+64px)]'
      : '-inset-[24px] w-[calc(100%+48px)] h-[calc(100%+48px)]';

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`absolute ${padClass} pointer-events-none z-[15]`}
    />
  );
};
