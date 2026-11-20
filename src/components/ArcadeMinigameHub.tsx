/**
 * ArcadeMinigameHub.tsx
 * Pusat 12 Minigame Arcade Seru Bank Nusantara (Terintegrasi di Tab Lowongan Pekerjaan)
 * - Game #1: Dino Chrome Nusantara (Standar Arcade, Target 1 = 500 poin s/d Target 100 = 10.000 poin)
 * - Game #2–#12: 11 Minigame Arcade Lebih Menantang dengan Hadiah Identik & 100 Target Independen Masing-Masing (1.200 Total Target!)
 * - Biaya Main Rp 500.000 per Ronde • Otomatis Klaim Semua Target yang Terlewati dalam 1 Kali Main
 * - Kontrol Lengkap: Keyboard Laptop (Panah / WASD / Spasi) + Tombol Sentuh Layar Responsif untuk HP
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Trophy,
  Play,
  RotateCcw,
  Gamepad2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Zap,
  CheckCircle2,
  Flame,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  ARCADE_MINIGAMES_12,
  ARCADE_MINIGAME_ENTRY_COST,
  ARCADE_TARGET_COUNT,
  ArcadeGameDefinition,
  ArcadeGameId,
  ArcadeTargetReward,
  getArcadeTargetReward,
} from '../data/arcadeMinigamesCatalog';
import { formatRupiah } from '../utils/bankUtils';

type PlayPhase = 'TITLE_MENU' | 'PLAYING' | 'ROUND_SUMMARY';

interface RoundClaimSummary {
  score: number;
  isNewHighScore: boolean;
  newlyPassedTargets: ArcadeTargetReward[];
  totalCashWon: number;
  totalVouchersWon: number;
  message: string;
}

const CANVAS_W = 560;
const CANVAS_H = 340;

export const ArcadeMinigameHub: React.FC = () => {
  const {
    currentAccount,
    startArcadeMinigameRun,
    claimArcadeMinigameScore,
  } = useBank();

  const [selectedGameId, setSelectedGameId] = useState<ArcadeGameId>('dino_chrome');
  const [phase, setPhase] = useState<PlayPhase>('TITLE_MENU');
  const [liveScore, setLiveScore] = useState<number>(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [roundSummary, setRoundSummary] = useState<RoundClaimSummary | null>(null);
  const [targetFilterMode, setTargetFilterMode] = useState<'all' | 'unclaimed' | 'claimed'>('all');
  const [showTargetModalRange, setShowTargetModalRange] = useState<'1-25' | '26-50' | '51-75' | '76-100'>('1-25');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const keysHeldRef = useRef<Record<string, boolean>>({});
  const pointerPosRef = useRef<{ x: number; y: number; down: boolean }>({
    x: CANVAS_W / 2,
    y: CANVAS_H / 2,
    down: false,
  });
  const actionTriggerRef = useRef<{
    jump: number;
    duck: boolean;
    dir: 'up' | 'down' | 'left' | 'right' | null;
    rotate: number;
    drop: number;
    shoot: number;
    sliceLane: number | null;
  }>({
    jump: 0,
    duck: false,
    dir: null,
    rotate: 0,
    drop: 0,
    shoot: 0,
    sliceLane: null,
  });
  const hasEndedRoundRef = useRef<boolean>(false);

  const selectedGame: ArcadeGameDefinition = useMemo(
    () => ARCADE_MINIGAMES_12.find((g) => g.id === selectedGameId) || ARCADE_MINIGAMES_12[0],
    [selectedGameId]
  );

  const claimedTargetsMap = currentAccount?.arcadeClaimedTargets || {};
  const highScoresMap = currentAccount?.arcadeHighScores || {};

  const myClaimedForSelected = claimedTargetsMap[selectedGame.id] || [];
  const myHighScoreForSelected = highScoresMap[selectedGame.id] || 0;

  const totalClaimedAll12 = useMemo(
    () =>
      ARCADE_MINIGAMES_12.reduce(
        (sum, g) => sum + ((claimedTargetsMap[g.id] || []).length),
        0
      ),
    [claimedTargetsMap]
  );

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const finishRound = useCallback(
    (finalScore: number) => {
      if (hasEndedRoundRef.current) return;
      hasEndedRoundRef.current = true;
      stopLoop();
      const cleanScore = Math.max(0, Math.round(finalScore));
      setLiveScore(cleanScore);
      const res = claimArcadeMinigameScore(selectedGame.id, cleanScore);
      setRoundSummary({
        score: cleanScore,
        isNewHighScore: res.isNewHighScore,
        newlyPassedTargets: res.newlyPassedTargets,
        totalCashWon: res.totalCashWon,
        totalVouchersWon: res.totalVouchersWon,
        message: res.message,
      });
      setPhase('ROUND_SUMMARY');
    },
    [claimArcadeMinigameScore, selectedGame.id, stopLoop]
  );

  const handleSelectGame = (gameId: ArcadeGameId) => {
    stopLoop();
    hasEndedRoundRef.current = true;
    setSelectedGameId(gameId);
    setPhase('TITLE_MENU');
    setLiveScore(0);
    setRunError(null);
    setRoundSummary(null);
  };

  const handleStartNewRun = () => {
    setRunError(null);
    const res = startArcadeMinigameRun(selectedGame.id);
    if (!res.success) {
      setRunError(res.message);
      return;
    }
    hasEndedRoundRef.current = false;
    setRoundSummary(null);
    setLiveScore(0);
    keysHeldRef.current = {};
    actionTriggerRef.current = {
      jump: 0,
      duck: false,
      dir: null,
      rotate: 0,
      drop: 0,
      shoot: 0,
      sliceLane: null,
    };
    setPhase('PLAYING');
  };

  // Keyboard bindings while playing
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'w', 'a', 's', 'd'].includes(k)
      ) {
        e.preventDefault();
      }
      keysHeldRef.current[k] = true;
      if (k === ' ' || k === 'arrowup' || k === 'w') {
        actionTriggerRef.current.jump += 1;
        actionTriggerRef.current.rotate += 1;
        actionTriggerRef.current.dir = 'up';
        actionTriggerRef.current.shoot += 1;
      } else if (k === 'arrowdown' || k === 's') {
        actionTriggerRef.current.duck = true;
        actionTriggerRef.current.dir = 'down';
        actionTriggerRef.current.drop += 1;
      } else if (k === 'arrowleft' || k === 'a') {
        actionTriggerRef.current.dir = 'left';
      } else if (k === 'arrowright' || k === 'd') {
        actionTriggerRef.current.dir = 'right';
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      keysHeldRef.current[k] = false;
      if (k === 'arrowdown' || k === 's') {
        actionTriggerRef.current.duck = false;
      }
    };
    window.addEventListener('keydown', onKeyDown, { passive: false });
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [phase]);

  // Main 12-Game Canvas Simulation Engine
  useEffect(() => {
    if (phase !== 'PLAYING') {
      stopLoop();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTs = performance.now();
    let scoreFloat = 0;
    let lastReportedScore = -1;
    let lastJumpConsumed = actionTriggerRef.current.jump;
    let lastRotateConsumed = actionTriggerRef.current.rotate;
    let lastDropConsumed = actionTriggerRef.current.drop;
    let lastShootConsumed = actionTriggerRef.current.shoot;

    const updateScore = (val: number) => {
      scoreFloat = Math.max(0, val);
      const rounded = Math.floor(scoreFloat);
      if (rounded !== lastReportedScore) {
        lastReportedScore = rounded;
        setLiveScore(rounded);
      }
    };

    // ---------------- GAME-SPECIFIC STATE INITIALIZERS ----------------
    // 1. DINO CHROME
    const dino = {
      x: 74,
      y: 256,
      vy: 0,
      w: 32,
      h: 40,
      onGround: true,
      speed: 310,
      spawnTimer: 0.7,
      obstacles: [] as { x: number; y: number; w: number; h: number; isBird: boolean }[],
    };

    // 2. FLAPPY GARUDA
    const flappy = {
      x: 120,
      y: CANVAS_H / 2,
      vy: 0,
      gravity: 980,
      flapImpulse: -315,
      pipeTimer: 0.6,
      windPhase: 0,
      pipes: [] as { x: number; gapY: number; gapH: number; passed: boolean }[],
    };

    // 3. SNAKE TURBO
    const snakeCell = 20;
    const snakeCols = Math.floor(CANVAS_W / snakeCell); // 28
    const snakeRows = Math.floor(CANVAS_H / snakeCell); // 17
    const snake = {
      body: [
        { x: 10, y: 8 },
        { x: 9, y: 8 },
        { x: 8, y: 8 },
      ],
      dirX: 1,
      dirY: 0,
      tickAcc: 0,
      stepSec: 0.088,
      food: { x: 18, y: 8, isGem: false },
      mines: [
        { x: 5, y: 4 },
        { x: 22, y: 12 },
        { x: 14, y: 3 },
      ],
    };

    // 4. METEOR DODGER
    const meteorState = {
      px: CANVAS_W / 2,
      py: CANVAS_H - 38,
      spawnTimer: 0.25,
      starTimer: 1.1,
      elapsed: 0,
      meteors: [] as { x: number; y: number; vx: number; vy: number; r: number }[],
      stars: [] as { x: number; y: number; vy: number }[],
    };

    // 5. BRICK BREAKER
    const brickColors = ['#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6'];
    const initialBricks: { x: number; y: number; w: number; h: number; hp: number; color: string }[] = [];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 9; c++) {
        initialBricks.push({
          x: 22 + c * 58,
          y: 34 + r * 24,
          w: 52,
          h: 17,
          hp: r < 2 ? 2 : 1,
          color: brickColors[r % brickColors.length],
        });
      }
    }
    const breakout = {
      paddleX: CANVAS_W / 2 - 44,
      paddleW: 88,
      ballX: CANVAS_W / 2,
      ballY: CANVAS_H - 60,
      vx: 255,
      vy: -265,
      bricks: initialBricks,
    };

    // 6. SPACE SHOOTER
    const shooter = {
      px: CANVAS_W / 2,
      py: CANVAS_H - 34,
      fireCd: 0,
      waveTimer: 0.3,
      elapsed: 0,
      bullets: [] as { x: number; y: number }[],
      enemyBullets: [] as { x: number; y: number; vy: number }[],
      enemies: [] as { x: number; y: number; vy: number; vx: number; hp: number; isBoss: boolean }[],
    };

    // 7. TETRIS KILAT
    const tCols = 10;
    const tRows = 16;
    const tGrid: (string | null)[][] = Array.from({ length: tRows }, () =>
      Array(tCols).fill(null)
    );
    const tShapes = [
      { shape: [[1, 1, 1, 1]], color: '#22d3ee' },
      { shape: [[1, 1], [1, 1]], color: '#facc15' },
      { shape: [[0, 1, 0], [1, 1, 1]], color: '#c084fc' },
      { shape: [[1, 0, 0], [1, 1, 1]], color: '#fb923c' },
      { shape: [[0, 0, 1], [1, 1, 1]], color: '#60a5fa' },
      { shape: [[0, 1, 1], [1, 1, 0]], color: '#34d399' },
      { shape: [[1, 1, 0], [0, 1, 1]], color: '#fb7185' },
    ];
    const spawnTetromino = () => {
      const pick = tShapes[Math.floor(Math.random() * tShapes.length)];
      return {
        shape: pick.shape.map((row) => [...row]),
        color: pick.color,
        x: Math.floor((tCols - pick.shape[0].length) / 2),
        y: 0,
      };
    };
    const tetris = {
      piece: spawnTetromino(),
      fallAcc: 0,
      moveCd: 0,
      stepInterval: 0.36,
    };

    // 8. CROSSY NUSANTARA
    const crossy = {
      col: 6,
      row: 10,
      maxReachedRow: 10,
      stepSize: 32,
      cols: 15,
      moveCd: 0,
      lanes: Array.from({ length: 11 }, (_, idx) => {
        const isSafe = idx === 0 || idx === 5 || idx === 10;
        const dir = idx % 2 === 0 ? 1 : -1;
        const speed = isSafe ? 0 : 120 + (idx % 4) * 45;
        const cars = isSafe
          ? []
          : [0, 1, 2].map((c) => ({
              x: c * 210 + (idx * 47) % 120,
              w: idx % 3 === 0 ? 74 : 48,
              color: idx % 2 === 0 ? '#f59e0b' : '#ef4444',
            }));
        return { row: idx, isSafe, dir, speed, cars };
      }),
      coin: { col: 7, row: 7 },
    };

    // 9. LASER JUMP DASH
    const dash = {
      x: 90,
      y: 256,
      vy: 0,
      size: 28,
      onGround: true,
      speed: 380,
      spawnTimer: 0.55,
      hazards: [] as { x: number; w: number; h: number; kind: 'spike' | 'double' | 'laser' }[],
    };

    // 10. CATCH FALLING GOLD
    const catcher = {
      x: CANVAS_W / 2 - 42,
      w: 84,
      lives: 3,
      spawnTimer: 0.25,
      elapsed: 0,
      items: [] as { x: number; y: number; vy: number; kind: 'coin' | 'diamond' | 'bomb' }[],
    };

    // 11. FRUIT SLICE NINJA
    const slicer = {
      spawnTimer: 0.35,
      misses: 0,
      trail: [] as { x: number; y: number; life: number }[],
      objects: [] as {
        id: number;
        x: number;
        y: number;
        vx: number;
        vy: number;
        r: number;
        kind: 'fruit' | 'gold' | 'bomb';
        emoji: string;
        sliced: boolean;
      }[],
      nextId: 1,
    };

    // 12. CYBER MAZE RUNNER
    const mCell = 28;
    const mCols = 20;
    const mRows = 12;
    const isMazeWall = (cx: number, cy: number) => {
      if (cx <= 0 || cy <= 0 || cx >= mCols - 1 || cy >= mRows - 1) return true;
      if ((cx === 4 || cx === 15) && cy >= 2 && cy <= 5) return true;
      if ((cx === 4 || cx === 15) && cy >= 7 && cy <= 9) return true;
      if (cy === 5 && cx >= 8 && cx <= 11) return true;
      if (cy === 8 && cx >= 8 && cx <= 11) return true;
      return false;
    };
    const initialCrystals: { x: number; y: number }[] = [];
    for (let cy = 1; cy < mRows - 1; cy++) {
      for (let cx = 1; cx < mCols - 1; cx++) {
        if (!isMazeWall(cx, cy) && !(cx === 2 && cy === 2) && (cx + cy) % 2 === 0) {
          initialCrystals.push({ x: cx, y: cy });
        }
      }
    }
    const maze = {
      px: 2,
      py: 2,
      moveAcc: 0,
      droneAcc: 0,
      crystals: initialCrystals,
      drones: [
        { x: 17, y: 2 },
        { x: 17, y: 9 },
        { x: 10, y: 10 },
      ],
    };

    // Tetris helpers
    const rotateMatrix = (mat: number[][]) =>
      mat[0].map((_, cIdx) => mat.map((row) => row[cIdx]).reverse());
    const collidesTetris = (shape: number[][], ox: number, oy: number) => {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= tCols || ny >= tRows) return true;
          if (ny >= 0 && tGrid[ny][nx]) return true;
        }
      }
      return false;
    };

    const drawHudBadge = (extraText?: string) => {
      ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
      ctx.fillRect(8, 8, extraText ? 260 : 150, 28);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
      ctx.strokeRect(8, 8, extraText ? 260 : 150, 28);
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `SKOR: ${Math.floor(scoreFloat)}${extraText ? `  |  ${extraText}` : ''}`,
        16,
        26
      );
    };

    const stepFrame = (now: number) => {
      if (hasEndedRoundRef.current) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTs) / 1000));
      lastTs = now;

      const held = keysHeldRef.current;
      const trig = actionTriggerRef.current;
      const didJump = trig.jump !== lastJumpConsumed;
      lastJumpConsumed = trig.jump;
      const didRotate = trig.rotate !== lastRotateConsumed;
      lastRotateConsumed = trig.rotate;
      const didDrop = trig.drop !== lastDropConsumed;
      lastDropConsumed = trig.drop;
      const didShoot = trig.shoot !== lastShootConsumed;
      lastShootConsumed = trig.shoot;

      // Clear background
      ctx.fillStyle = '#070b18';
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Subtle grid background
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.06)';
      ctx.lineWidth = 1;
      for (let gx = 0; gx < CANVAS_W; gx += 40) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, CANVAS_H);
        ctx.stroke();
      }
      for (let gy = 0; gy < CANVAS_H; gy += 40) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(CANVAS_W, gy);
        ctx.stroke();
      }

      const id = selectedGame.id;

      // ==================== 1. DINO CHROME ====================
      if (id === 'dino_chrome') {
        const groundY = 296;
        dino.speed = Math.min(620, 310 + scoreFloat * 0.04);
        updateScore(scoreFloat + dt * 55);

        const isDuck = Boolean(held['arrowdown'] || held['s'] || trig.duck);
        dino.h = isDuck && dino.onGround ? 22 : 40;
        if ((didJump || held[' '] || held['arrowup'] || held['w']) && dino.onGround) {
          dino.vy = -530;
          dino.onGround = false;
        }
        dino.vy += 1500 * dt;
        dino.y += dino.vy * dt;
        if (dino.y + dino.h >= groundY) {
          dino.y = groundY - dino.h;
          dino.vy = 0;
          dino.onGround = true;
        }

        dino.spawnTimer -= dt;
        if (dino.spawnTimer <= 0) {
          const isBird = scoreFloat > 250 && Math.random() < 0.32;
          dino.obstacles.push({
            x: CANVAS_W + 30,
            y: isBird ? groundY - 62 : groundY - (28 + Math.floor(Math.random() * 20)),
            w: isBird ? 32 : 20 + Math.floor(Math.random() * 16),
            h: isBird ? 20 : 34,
            isBird,
          });
          dino.spawnTimer = Math.max(0.65, 1.35 - scoreFloat * 0.00008 + Math.random() * 0.4);
        }

        for (let i = dino.obstacles.length - 1; i >= 0; i--) {
          const ob = dino.obstacles[i];
          ob.x -= dino.speed * dt;
          if (ob.x + ob.w < 0) {
            dino.obstacles.splice(i, 1);
            updateScore(scoreFloat + 35);
            continue;
          }
          // Collision with slight fair margin
          if (
            dino.x + 5 < ob.x + ob.w - 3 &&
            dino.x + dino.w - 5 > ob.x + 3 &&
            dino.y + 4 < ob.y + ob.h - 3 &&
            dino.y + dino.h - 3 > ob.y + 3
          ) {
            finishRound(scoreFloat);
            return;
          }
        }

        // Ground
        ctx.fillStyle = '#064e3b';
        ctx.fillRect(0, groundY, CANVAS_W, CANVAS_H - groundY);
        ctx.strokeStyle = '#34d399';
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(CANVAS_W, groundY);
        ctx.stroke();

        // Dino
        ctx.fillStyle = '#34d399';
        ctx.fillRect(dino.x, dino.y, dino.w, dino.h);
        ctx.fillStyle = '#020617';
        ctx.fillRect(dino.x + dino.w - 10, dino.y + 5, 5, 5);
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦖', dino.x + dino.w / 2, dino.y + dino.h - 4);

        // Obstacles
        for (const ob of dino.obstacles) {
          ctx.fillStyle = ob.isBird ? '#f59e0b' : '#ef4444';
          ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
          ctx.font = '18px sans-serif';
          ctx.fillText(ob.isBird ? '🦇' : '🌵', ob.x + ob.w / 2, ob.y + ob.h - 2);
        }
        drawHudBadge(`KEC: ${Math.round(dino.speed)}`);
      }

      // ==================== 2. FLAPPY GARUDA ====================
      else if (id === 'flappy_garuda') {
        flappy.windPhase += dt * 3;
        if (didJump) {
          flappy.vy = flappy.flapImpulse;
        }
        flappy.vy += flappy.gravity * dt;
        flappy.y += flappy.vy * dt;

        if (flappy.y < 14 || flappy.y > CANVAS_H - 14) {
          finishRound(scoreFloat);
          return;
        }

        flappy.pipeTimer -= dt;
        const speed = Math.min(340, 215 + scoreFloat * 0.025);
        if (flappy.pipeTimer <= 0) {
          const gapH = Math.max(82, 114 - scoreFloat * 0.004);
          const gapY = 58 + Math.random() * (CANVAS_H - 116 - gapH);
          flappy.pipes.push({ x: CANVAS_W + 40, gapY, gapH, passed: false });
          flappy.pipeTimer = Math.max(1.05, 1.55 - scoreFloat * 0.00004);
        }

        for (let i = flappy.pipes.length - 1; i >= 0; i--) {
          const p = flappy.pipes[i];
          p.x -= speed * dt;
          if (!p.passed && p.x + 42 < flappy.x) {
            p.passed = true;
            updateScore(scoreFloat + 125);
          }
          if (p.x + 46 < 0) {
            flappy.pipes.splice(i, 1);
            continue;
          }
          if (flappy.x + 12 > p.x && flappy.x - 12 < p.x + 42) {
            if (flappy.y - 12 < p.gapY || flappy.y + 12 > p.gapY + p.gapH) {
              finishRound(scoreFloat);
              return;
            }
          }
        }
        updateScore(scoreFloat + dt * 20);

        for (const p of flappy.pipes) {
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(p.x, 0, 42, p.gapY);
          ctx.fillRect(p.x, p.gapY + p.gapH, 42, CANVAS_H - (p.gapY + p.gapH));
          ctx.fillStyle = '#fde047';
          ctx.fillRect(p.x - 3, p.gapY - 10, 48, 10);
          ctx.fillRect(p.x - 3, p.gapY + p.gapH, 48, 10);
        }
        ctx.font = '26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦅', flappy.x, flappy.y + 9);
        drawHudBadge('GARUDA SULIT');
      }

      // ==================== 3. SNAKE TURBO 3000 ====================
      else if (id === 'snake_turbo') {
        if (trig.dir === 'up' && snake.dirY !== 1) { snake.dirX = 0; snake.dirY = -1; }
        if (trig.dir === 'down' && snake.dirY !== -1) { snake.dirX = 0; snake.dirY = 1; }
        if (trig.dir === 'left' && snake.dirX !== 1) { snake.dirX = -1; snake.dirY = 0; }
        if (trig.dir === 'right' && snake.dirX !== -1) { snake.dirX = 1; snake.dirY = 0; }
        trig.dir = null;

        snake.tickAcc += dt;
        const speedStep = Math.max(0.055, snake.stepSec - scoreFloat * 0.000004);
        if (snake.tickAcc >= speedStep) {
          snake.tickAcc = 0;
          const head = snake.body[0];
          const nx = head.x + snake.dirX;
          const ny = head.y + snake.dirY;
          if (
            nx < 0 ||
            nx >= snakeCols ||
            ny < 0 ||
            ny >= snakeRows ||
            snake.body.some((s) => s.x === nx && s.y === ny) ||
            snake.mines.some((m) => m.x === nx && m.y === ny)
          ) {
            finishRound(scoreFloat);
            return;
          }
          const ate = nx === snake.food.x && ny === snake.food.y;
          snake.body.unshift({ x: nx, y: ny });
          if (ate) {
            updateScore(scoreFloat + (snake.food.isGem ? 260 : 120));
            let fx = 1;
            let fy = 1;
            for (let tries = 0; tries < 30; tries++) {
              fx = Math.floor(Math.random() * snakeCols);
              fy = Math.floor(Math.random() * snakeRows);
              if (
                !snake.body.some((b) => b.x === fx && b.y === fy) &&
                !snake.mines.some((m) => m.x === fx && m.y === fy)
              ) {
                break;
              }
            }
            snake.food = { x: fx, y: fy, isGem: Math.random() < 0.28 };
            if (snake.mines.length < 10 && Math.random() < 0.4) {
              snake.mines.push({
                x: Math.floor(Math.random() * snakeCols),
                y: Math.floor(Math.random() * snakeRows),
              });
            }
          } else {
            snake.body.pop();
          }
        }

        // Draw mines
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        for (const m of snake.mines) {
          ctx.fillText('💣', m.x * snakeCell + snakeCell / 2, m.y * snakeCell + 16);
        }
        // Food
        ctx.fillText(
          snake.food.isGem ? '💎' : '🪙',
          snake.food.x * snakeCell + snakeCell / 2,
          snake.food.y * snakeCell + 16
        );
        // Snake
        snake.body.forEach((seg, idx) => {
          ctx.fillStyle = idx === 0 ? '#a3e635' : '#22c55e';
          ctx.fillRect(seg.x * snakeCell + 2, seg.y * snakeCell + 2, snakeCell - 4, snakeCell - 4);
        });
        drawHudBadge(`PANJANG: ${snake.body.length}`);
      }

      // ==================== 4. METEOR DODGER STORM ====================
      else if (id === 'meteor_dodger') {
        meteorState.elapsed += dt;
        const speed = 340;
        if (held['arrowleft'] || held['a'] || trig.dir === 'left') meteorState.px -= speed * dt;
        if (held['arrowright'] || held['d'] || trig.dir === 'right') meteorState.px += speed * dt;
        meteorState.px = Math.max(20, Math.min(CANVAS_W - 20, meteorState.px));

        meteorState.spawnTimer -= dt;
        if (meteorState.spawnTimer <= 0) {
          meteorState.meteors.push({
            x: 16 + Math.random() * (CANVAS_W - 32),
            y: -18,
            vx: (Math.random() - 0.5) * 90,
            vy: 230 + Math.min(280, meteorState.elapsed * 12) + Math.random() * 90,
            r: 12 + Math.random() * 10,
          });
          meteorState.spawnTimer = Math.max(0.14, 0.36 - meteorState.elapsed * 0.005);
        }
        meteorState.starTimer -= dt;
        if (meteorState.starTimer <= 0) {
          meteorState.stars.push({
            x: 24 + Math.random() * (CANVAS_W - 48),
            y: -16,
            vy: 185,
          });
          meteorState.starTimer = 0.95;
        }

        updateScore(scoreFloat + dt * 50);

        for (let i = meteorState.stars.length - 1; i >= 0; i--) {
          const st = meteorState.stars[i];
          st.y += st.vy * dt;
          if (Math.hypot(st.x - meteorState.px, st.y - meteorState.py) < 26) {
            meteorState.stars.splice(i, 1);
            updateScore(scoreFloat + 180);
            continue;
          }
          if (st.y > CANVAS_H + 20) meteorState.stars.splice(i, 1);
        }

        for (let i = meteorState.meteors.length - 1; i >= 0; i--) {
          const m = meteorState.meteors[i];
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (Math.hypot(m.x - meteorState.px, m.y - meteorState.py) < m.r + 12) {
            finishRound(scoreFloat);
            return;
          }
          if (m.y > CANVAS_H + 30) meteorState.meteors.splice(i, 1);
        }

        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        for (const st of meteorState.stars) ctx.fillText('⭐', st.x, st.y + 7);
        for (const m of meteorState.meteors) {
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
          ctx.fillStyle = '#ea580c';
          ctx.fill();
          ctx.fillText('☄️', m.x, m.y + 6);
        }
        ctx.font = '26px sans-serif';
        ctx.fillText('🛸', meteorState.px, meteorState.py + 8);
        drawHudBadge('BADAI METEOR');
      }

      // ==================== 5. BRICK BREAKER HYPER ====================
      else if (id === 'brick_breaker') {
        const pSpeed = 400;
        if (held['arrowleft'] || held['a'] || trig.dir === 'left') breakout.paddleX -= pSpeed * dt;
        if (held['arrowright'] || held['d'] || trig.dir === 'right') breakout.paddleX += pSpeed * dt;
        if (pointerPosRef.current.down) {
          breakout.paddleX = pointerPosRef.current.x - breakout.paddleW / 2;
        }
        breakout.paddleX = Math.max(8, Math.min(CANVAS_W - breakout.paddleW - 8, breakout.paddleX));

        breakout.ballX += breakout.vx * dt;
        breakout.ballY += breakout.vy * dt;

        if (breakout.ballX < 10) { breakout.ballX = 10; breakout.vx = Math.abs(breakout.vx); }
        if (breakout.ballX > CANVAS_W - 10) { breakout.ballX = CANVAS_W - 10; breakout.vx = -Math.abs(breakout.vx); }
        if (breakout.ballY < 10) { breakout.ballY = 10; breakout.vy = Math.abs(breakout.vy); }

        const py = CANVAS_H - 28;
        if (
          breakout.vy > 0 &&
          breakout.ballY + 8 >= py &&
          breakout.ballY - 8 <= py + 12 &&
          breakout.ballX >= breakout.paddleX &&
          breakout.ballX <= breakout.paddleX + breakout.paddleW
        ) {
          const hitNorm =
            (breakout.ballX - (breakout.paddleX + breakout.paddleW / 2)) / (breakout.paddleW / 2);
          breakout.vx = hitNorm * 340;
          breakout.vy = -Math.min(460, Math.abs(breakout.vy) * 1.025);
          breakout.ballY = py - 9;
        }

        if (breakout.ballY > CANVAS_H + 16) {
          finishRound(scoreFloat);
          return;
        }

        for (let i = breakout.bricks.length - 1; i >= 0; i--) {
          const b = breakout.bricks[i];
          if (
            breakout.ballX + 7 > b.x &&
            breakout.ballX - 7 < b.x + b.w &&
            breakout.ballY + 7 > b.y &&
            breakout.ballY - 7 < b.y + b.h
          ) {
            breakout.vy *= -1;
            b.hp -= 1;
            updateScore(scoreFloat + 110);
            if (b.hp <= 0) {
              breakout.bricks.splice(i, 1);
              updateScore(scoreFloat + 160);
            }
            break;
          }
        }

        if (breakout.bricks.length === 0) {
          for (let r = 0; r < 5; r++) {
            for (let c = 0; c < 9; c++) {
              breakout.bricks.push({
                x: 22 + c * 58,
                y: 34 + r * 24,
                w: 52,
                h: 17,
                hp: 2,
                color: brickColors[(r + 2) % brickColors.length],
              });
            }
          }
          updateScore(scoreFloat + 500);
        }

        for (const b of breakout.bricks) {
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x, b.y, b.w, b.h);
          if (b.hp > 1) {
            ctx.strokeStyle = '#ffffff';
            ctx.strokeRect(b.x + 1, b.y + 1, b.w - 2, b.h - 2);
          }
        }
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(breakout.paddleX, py, breakout.paddleW, 12);
        ctx.beginPath();
        ctx.arc(breakout.ballX, breakout.ballY, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#fde047';
        ctx.fill();
        drawHudBadge(`BLOK: ${breakout.bricks.length}`);
      }

      // ==================== 6. SPACE SHOOTER GALAKSI ====================
      else if (id === 'space_shooter') {
        shooter.elapsed += dt;
        const speed = 330;
        if (held['arrowleft'] || held['a'] || trig.dir === 'left') shooter.px -= speed * dt;
        if (held['arrowright'] || held['d'] || trig.dir === 'right') shooter.px += speed * dt;
        shooter.px = Math.max(20, Math.min(CANVAS_W - 20, shooter.px));

        shooter.fireCd -= dt;
        if (shooter.fireCd <= 0 || didShoot) {
          shooter.bullets.push({ x: shooter.px, y: shooter.py - 16 });
          shooter.fireCd = 0.22;
        }

        shooter.waveTimer -= dt;
        if (shooter.waveTimer <= 0) {
          const isBoss = Math.random() < 0.22;
          shooter.enemies.push({
            x: 26 + Math.random() * (CANVAS_W - 52),
            y: -18,
            vy: 85 + Math.min(140, shooter.elapsed * 6),
            vx: (Math.random() - 0.5) * 90,
            hp: isBoss ? 3 : 1,
            isBoss,
          });
          shooter.waveTimer = Math.max(0.28, 0.72 - shooter.elapsed * 0.01);
        }

        for (let i = shooter.bullets.length - 1; i >= 0; i--) {
          shooter.bullets[i].y -= 480 * dt;
          if (shooter.bullets[i].y < -15) shooter.bullets.splice(i, 1);
        }

        for (let i = shooter.enemies.length - 1; i >= 0; i--) {
          const en = shooter.enemies[i];
          en.x += en.vx * dt;
          en.y += en.vy * dt;
          if (en.x < 18 || en.x > CANVAS_W - 18) en.vx *= -1;
          if (Math.random() < dt * 0.7) {
            shooter.enemyBullets.push({ x: en.x, y: en.y + 12, vy: 220 });
          }

          if (en.y > CANVAS_H - 12 || Math.hypot(en.x - shooter.px, en.y - shooter.py) < 22) {
            finishRound(scoreFloat);
            return;
          }

          let destroyed = false;
          for (let b = shooter.bullets.length - 1; b >= 0; b--) {
            const bul = shooter.bullets[b];
            if (Math.hypot(en.x - bul.x, en.y - bul.y) < 18) {
              shooter.bullets.splice(b, 1);
              en.hp -= 1;
              if (en.hp <= 0) {
                updateScore(scoreFloat + (en.isBoss ? 300 : 140));
                shooter.enemies.splice(i, 1);
                destroyed = true;
              }
              break;
            }
          }
          if (destroyed) continue;
        }

        for (let i = shooter.enemyBullets.length - 1; i >= 0; i--) {
          const eb = shooter.enemyBullets[i];
          eb.y += eb.vy * dt;
          if (Math.hypot(eb.x - shooter.px, eb.y - shooter.py) < 15) {
            finishRound(scoreFloat);
            return;
          }
          if (eb.y > CANVAS_H + 10) shooter.enemyBullets.splice(i, 1);
        }

        ctx.fillStyle = '#22d3ee';
        for (const bul of shooter.bullets) ctx.fillRect(bul.x - 2, bul.y - 8, 4, 12);
        ctx.fillStyle = '#fb7185';
        for (const eb of shooter.enemyBullets) ctx.fillRect(eb.x - 3, eb.y - 4, 6, 10);

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        for (const en of shooter.enemies) ctx.fillText(en.isBoss ? '👾' : '👽', en.x, en.y + 8);
        ctx.font = '26px sans-serif';
        ctx.fillText('🚀', shooter.px, shooter.py + 8);
        drawHudBadge('GALAXY SHOOTER');
      }

      // ==================== 7. TETRIS KILAT PRO ====================
      else if (id === 'tetris_kilat') {
        tetris.moveCd -= dt;
        if (didRotate) {
          const rotated = rotateMatrix(tetris.piece.shape);
          if (!collidesTetris(rotated, tetris.piece.x, tetris.piece.y)) {
            tetris.piece.shape = rotated;
          }
        }
        if ((trig.dir === 'left' || (held['arrowleft'] && tetris.moveCd <= 0) || (held['a'] && tetris.moveCd <= 0))) {
          if (!collidesTetris(tetris.piece.shape, tetris.piece.x - 1, tetris.piece.y)) {
            tetris.piece.x -= 1;
          }
          tetris.moveCd = 0.11;
          if (trig.dir === 'left') trig.dir = null;
        }
        if ((trig.dir === 'right' || (held['arrowright'] && tetris.moveCd <= 0) || (held['d'] && tetris.moveCd <= 0))) {
          if (!collidesTetris(tetris.piece.shape, tetris.piece.x + 1, tetris.piece.y)) {
            tetris.piece.x += 1;
          }
          tetris.moveCd = 0.11;
          if (trig.dir === 'right') trig.dir = null;
        }
        if (didDrop) {
          while (!collidesTetris(tetris.piece.shape, tetris.piece.x, tetris.piece.y + 1)) {
            tetris.piece.y += 1;
          }
          tetris.fallAcc = 999;
        }

        tetris.fallAcc += dt;
        const dropEvery = Math.max(0.14, tetris.stepInterval - scoreFloat * 0.000018);
        if (tetris.fallAcc >= dropEvery) {
          tetris.fallAcc = 0;
          if (!collidesTetris(tetris.piece.shape, tetris.piece.x, tetris.piece.y + 1)) {
            tetris.piece.y += 1;
          } else {
            // Lock piece
            for (let r = 0; r < tetris.piece.shape.length; r++) {
              for (let c = 0; c < tetris.piece.shape[r].length; c++) {
                if (tetris.piece.shape[r][c]) {
                  const gy = tetris.piece.y + r;
                  const gx = tetris.piece.x + c;
                  if (gy >= 0 && gy < tRows && gx >= 0 && gx < tCols) {
                    tGrid[gy][gx] = tetris.piece.color;
                  }
                }
              }
            }
            updateScore(scoreFloat + 65);
            let cleared = 0;
            for (let r = tRows - 1; r >= 0; r--) {
              if (tGrid[r].every((cell) => cell !== null)) {
                tGrid.splice(r, 1);
                tGrid.unshift(Array(tCols).fill(null));
                cleared += 1;
                r += 1;
              }
            }
            if (cleared > 0) {
              updateScore(scoreFloat + cleared * 420);
            }
            const nextP = spawnTetromino();
            if (collidesTetris(nextP.shape, nextP.x, nextP.y)) {
              finishRound(scoreFloat);
              return;
            }
            tetris.piece = nextP;
          }
        }

        const cellSize = 19;
        const boardX = (CANVAS_W - tCols * cellSize) / 2;
        const boardY = 18;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(boardX, boardY, tCols * cellSize, tRows * cellSize);
        ctx.strokeStyle = '#6366f1';
        ctx.strokeRect(boardX, boardY, tCols * cellSize, tRows * cellSize);

        for (let r = 0; r < tRows; r++) {
          for (let c = 0; c < tCols; c++) {
            const col = tGrid[r][c];
            if (col) {
              ctx.fillStyle = col;
              ctx.fillRect(boardX + c * cellSize + 1, boardY + r * cellSize + 1, cellSize - 2, cellSize - 2);
            }
          }
        }
        ctx.fillStyle = tetris.piece.color;
        for (let r = 0; r < tetris.piece.shape.length; r++) {
          for (let c = 0; c < tetris.piece.shape[r].length; c++) {
            if (tetris.piece.shape[r][c]) {
              ctx.fillRect(
                boardX + (tetris.piece.x + c) * cellSize + 1,
                boardY + (tetris.piece.y + r) * cellSize + 1,
                cellSize - 2,
                cellSize - 2
              );
            }
          }
        }
        drawHudBadge('TETRIS KILAT');
      }

      // ==================== 8. CROSSY JALAN NUSANTARA ====================
      else if (id === 'crossy_nusantara') {
        crossy.moveCd -= dt;
        if (trig.dir && crossy.moveCd <= 0) {
          if (trig.dir === 'up') crossy.row -= 1;
          if (trig.dir === 'down') crossy.row = Math.min(10, crossy.row + 1);
          if (trig.dir === 'left') crossy.col = Math.max(0, crossy.col - 1);
          if (trig.dir === 'right') crossy.col = Math.min(crossy.cols - 1, crossy.col + 1);
          trig.dir = null;
          crossy.moveCd = 0.08;

          if (crossy.row < crossy.maxReachedRow) {
            crossy.maxReachedRow = crossy.row;
            updateScore(scoreFloat + 120);
          }
          if (crossy.row <= 0) {
            updateScore(scoreFloat + 320);
            crossy.row = 10;
            crossy.maxReachedRow = 10;
            for (const l of crossy.lanes) {
              if (!l.isSafe) l.speed = Math.min(360, l.speed + 18);
            }
          }
        }

        const ox = 40;
        const rowH = 30;
        const px = ox + crossy.col * crossy.stepSize + 16;
        const py = 8 + crossy.row * rowH + 15;

        if (crossy.col === crossy.coin.col && crossy.row === crossy.coin.row) {
          updateScore(scoreFloat + 160);
          crossy.coin = {
            col: 1 + Math.floor(Math.random() * (crossy.cols - 2)),
            row: 1 + Math.floor(Math.random() * 9),
          };
        }

        for (const l of crossy.lanes) {
          const ly = 8 + l.row * rowH;
          ctx.fillStyle = l.isSafe ? '#064e3b' : '#1e293b';
          ctx.fillRect(0, ly, CANVAS_W, rowH - 2);
          if (!l.isSafe) {
            for (const car of l.cars) {
              car.x += l.dir * l.speed * dt;
              if (l.dir > 0 && car.x > CANVAS_W + 40) car.x = -car.w - 20;
              if (l.dir < 0 && car.x + car.w < -40) car.x = CANVAS_W + 20;
              ctx.fillStyle = car.color;
              ctx.fillRect(car.x, ly + 4, car.w, rowH - 10);
              if (px + 9 > car.x && px - 9 < car.x + car.w && crossy.row === l.row) {
                finishRound(scoreFloat);
                return;
              }
            }
          }
        }
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪙', ox + crossy.coin.col * crossy.stepSize + 16, 8 + crossy.coin.row * rowH + 21);
        ctx.font = '22px sans-serif';
        ctx.fillText('🐸', px, py + 7);
        drawHudBadge('CROSSY TOL');
      }

      // ==================== 9. LASER JUMP DASH ====================
      else if (id === 'laser_jump_dash') {
        const floorY = 288;
        dash.speed = Math.min(680, 380 + scoreFloat * 0.045);
        updateScore(scoreFloat + dt * 65);

        if ((didJump || held[' '] || held['arrowup']) && dash.onGround) {
          dash.vy = -545;
          dash.onGround = false;
        }
        dash.vy += 1650 * dt;
        dash.y += dash.vy * dt;
        if (dash.y + dash.size >= floorY) {
          dash.y = floorY - dash.size;
          dash.vy = 0;
          dash.onGround = true;
        }

        dash.spawnTimer -= dt;
        if (dash.spawnTimer <= 0) {
          const r = Math.random();
          const kind: 'spike' | 'double' | 'laser' = r < 0.4 ? 'spike' : r < 0.75 ? 'double' : 'laser';
          dash.hazards.push({
            x: CANVAS_W + 25,
            w: kind === 'double' ? 42 : 22,
            h: kind === 'laser' ? 56 : 32,
            kind,
          });
          dash.spawnTimer = Math.max(0.55, 1.05 - scoreFloat * 0.00005 + Math.random() * 0.35);
        }

        for (let i = dash.hazards.length - 1; i >= 0; i--) {
          const h = dash.hazards[i];
          h.x -= dash.speed * dt;
          if (h.x + h.w < 0) {
            dash.hazards.splice(i, 1);
            updateScore(scoreFloat + 55);
            continue;
          }
          const hy = floorY - h.h;
          if (
            dash.x + 4 < h.x + h.w - 3 &&
            dash.x + dash.size - 4 > h.x + 3 &&
            dash.y + dash.size - 3 > hy + 3
          ) {
            finishRound(scoreFloat);
            return;
          }
        }

        ctx.fillStyle = '#4c1d95';
        ctx.fillRect(0, floorY, CANVAS_W, CANVAS_H - floorY);
        ctx.strokeStyle = '#e879f9';
        ctx.beginPath();
        ctx.moveTo(0, floorY);
        ctx.lineTo(CANVAS_W, floorY);
        ctx.stroke();

        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(dash.x, dash.y, dash.size, dash.size);
        ctx.fillStyle = '#f43f5e';
        for (const h of dash.hazards) {
          ctx.fillRect(h.x, floorY - h.h, h.w, h.h);
          ctx.font = '18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(h.kind === 'laser' ? '⚡' : '🔺', h.x + h.w / 2, floorY - h.h + 20);
        }
        drawHudBadge('LASER DASH');
      }

      // ==================== 10. CATCH FALLING GOLD ====================
      else if (id === 'catch_falling_gold') {
        catcher.elapsed += dt;
        const speed = 380;
        if (held['arrowleft'] || held['a'] || trig.dir === 'left') catcher.x -= speed * dt;
        if (held['arrowright'] || held['d'] || trig.dir === 'right') catcher.x += speed * dt;
        catcher.x = Math.max(8, Math.min(CANVAS_W - catcher.w - 8, catcher.x));

        catcher.spawnTimer -= dt;
        if (catcher.spawnTimer <= 0) {
          const r = Math.random();
          const kind: 'coin' | 'diamond' | 'bomb' = r < 0.56 ? 'coin' : r < 0.78 ? 'diamond' : 'bomb';
          catcher.items.push({
            x: 20 + Math.random() * (CANVAS_W - 40),
            y: -16,
            vy: 185 + Math.min(200, catcher.elapsed * 8) + Math.random() * 85,
            kind,
          });
          catcher.spawnTimer = Math.max(0.18, 0.45 - catcher.elapsed * 0.006);
        }

        const basketY = CANVAS_H - 36;
        for (let i = catcher.items.length - 1; i >= 0; i--) {
          const it = catcher.items[i];
          it.y += it.vy * dt;
          if (
            it.y + 12 >= basketY &&
            it.y - 12 <= basketY + 20 &&
            it.x >= catcher.x - 10 &&
            it.x <= catcher.x + catcher.w + 10
          ) {
            catcher.items.splice(i, 1);
            if (it.kind === 'bomb') {
              catcher.lives -= 1;
              if (catcher.lives <= 0) {
                finishRound(scoreFloat);
                return;
              }
            } else {
              updateScore(scoreFloat + (it.kind === 'diamond' ? 250 : 115));
            }
            continue;
          }
          if (it.y > CANVAS_H + 20) catcher.items.splice(i, 1);
        }

        ctx.font = '22px sans-serif';
        ctx.textAlign = 'center';
        for (const it of catcher.items) {
          ctx.fillText(
            it.kind === 'bomb' ? '💣' : it.kind === 'diamond' ? '💎' : '🪙',
            it.x,
            it.y + 7
          );
        }
        ctx.fillStyle = '#facc15';
        ctx.fillRect(catcher.x, basketY, catcher.w, 16);
        ctx.fillStyle = '#020617';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('SULTAN', catcher.x + catcher.w / 2, basketY + 12);
        drawHudBadge(`NYAWA: ${'❤️'.repeat(catcher.lives)}`);
      }

      // ==================== 11. FRUIT SLICE NINJA ====================
      else if (id === 'fruit_slice_ninja') {
        slicer.spawnTimer -= dt;
        if (slicer.spawnTimer <= 0) {
          const isBomb = Math.random() < 0.24;
          const isGold = !isBomb && Math.random() < 0.2;
          const emojis = ['🍉', '🍊', '🍍', '🍎', '🥭'];
          slicer.objects.push({
            id: slicer.nextId++,
            x: 60 + Math.random() * (CANVAS_W - 120),
            y: CANVAS_H + 14,
            vx: (Math.random() - 0.5) * 140,
            vy: -(415 + Math.random() * 115),
            r: 22,
            kind: isBomb ? 'bomb' : isGold ? 'gold' : 'fruit',
            emoji: isBomb ? '💣' : isGold ? '🌟' : emojis[Math.floor(Math.random() * emojis.length)],
            sliced: false,
          });
          slicer.spawnTimer = Math.max(0.32, 0.72 - scoreFloat * 0.00003);
        }

        if (pointerPosRef.current.down) {
          slicer.trail.push({ x: pointerPosRef.current.x, y: pointerPosRef.current.y, life: 0.2 });
        }
        for (let i = slicer.trail.length - 1; i >= 0; i--) {
          slicer.trail[i].life -= dt;
          if (slicer.trail[i].life <= 0) slicer.trail.splice(i, 1);
        }

        // Keyboard / Touch-button slice lane sweep
        const keyLane = trig.sliceLane;
        trig.sliceLane = null;

        for (let i = slicer.objects.length - 1; i >= 0; i--) {
          const obj = slicer.objects[i];
          obj.x += obj.vx * dt;
          obj.y += obj.vy * dt;
          obj.vy += 490 * dt;

          const hitByPointer =
            pointerPosRef.current.down &&
            Math.hypot(obj.x - pointerPosRef.current.x, obj.y - pointerPosRef.current.y) < obj.r + 18;
          const hitByLane =
            keyLane !== null &&
            obj.y < CANVAS_H - 10 &&
            Math.abs(obj.x - (keyLane === 0 ? 110 : keyLane === 1 ? 280 : 450)) < 95;

          if (!obj.sliced && (hitByPointer || hitByLane)) {
            obj.sliced = true;
            if (obj.kind === 'bomb') {
              finishRound(scoreFloat);
              return;
            }
            updateScore(scoreFloat + (obj.kind === 'gold' ? 280 : 140));
            slicer.objects.splice(i, 1);
            continue;
          }

          if (obj.y > CANVAS_H + 35 && obj.vy > 0) {
            if (obj.kind !== 'bomb') {
              slicer.misses += 1;
              if (slicer.misses >= 4) {
                finishRound(scoreFloat);
                return;
              }
            }
            slicer.objects.splice(i, 1);
          }
        }

        // Draw lane hints + trail
        if (slicer.trail.length > 1) {
          ctx.strokeStyle = '#f472b6';
          ctx.lineWidth = 4;
          ctx.beginPath();
          slicer.trail.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y);
            else ctx.lineTo(pt.x, pt.y);
          });
          ctx.stroke();
          ctx.lineWidth = 1;
        }
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        for (const obj of slicer.objects) {
          ctx.fillText(obj.emoji, obj.x, obj.y + 9);
        }
        drawHudBadge(`LUPUT: ${slicer.misses}/4`);
      }

      // ==================== 12. CYBER MAZE RUNNER ====================
      else if (id === 'cyber_maze_runner') {
        maze.moveAcc += dt;
        let dx = 0;
        let dy = 0;
        if (held['arrowup'] || held['w'] || trig.dir === 'up') dy = -1;
        else if (held['arrowdown'] || held['s'] || trig.dir === 'down') dy = 1;
        else if (held['arrowleft'] || held['a'] || trig.dir === 'left') dx = -1;
        else if (held['arrowright'] || held['d'] || trig.dir === 'right') dx = 1;

        if ((dx !== 0 || dy !== 0) && maze.moveAcc >= 0.12) {
          maze.moveAcc = 0;
          if (!isMazeWall(maze.px + dx, maze.py + dy)) {
            maze.px += dx;
            maze.py += dy;
          }
          if (trig.dir) trig.dir = null;
        }

        for (let i = maze.crystals.length - 1; i >= 0; i--) {
          if (maze.crystals[i].x === maze.px && maze.crystals[i].y === maze.py) {
            maze.crystals.splice(i, 1);
            updateScore(scoreFloat + 160);
          }
        }
        if (maze.crystals.length === 0) {
          updateScore(scoreFloat + 600);
          for (let cy = 1; cy < mRows - 1; cy++) {
            for (let cx = 1; cx < mCols - 1; cx++) {
              if (!isMazeWall(cx, cy) && (cx + cy) % 2 === 0) {
                maze.crystals.push({ x: cx, y: cy });
              }
            }
          }
        }

        maze.droneAcc += dt;
        if (maze.droneAcc >= Math.max(0.24, 0.36 - scoreFloat * 0.00001)) {
          maze.droneAcc = 0;
          for (const d of maze.drones) {
            const opts: { x: number; y: number }[] = [];
            if (!isMazeWall(d.x + 1, d.y)) opts.push({ x: d.x + 1, y: d.y });
            if (!isMazeWall(d.x - 1, d.y)) opts.push({ x: d.x - 1, y: d.y });
            if (!isMazeWall(d.x, d.y + 1)) opts.push({ x: d.x, y: d.y + 1 });
            if (!isMazeWall(d.x, d.y - 1)) opts.push({ x: d.x, y: d.y - 1 });
            if (opts.length > 0) {
              opts.sort(
                (a, b) =>
                  Math.hypot(a.x - maze.px, a.y - maze.py) -
                  Math.hypot(b.x - maze.px, b.y - maze.py)
              );
              const pick = Math.random() < 0.78 ? opts[0] : opts[Math.floor(Math.random() * opts.length)];
              d.x = pick.x;
              d.y = pick.y;
            }
          }
        }

        if (maze.drones.some((d) => d.x === maze.px && d.y === maze.py)) {
          finishRound(scoreFloat);
          return;
        }

        const offX = (CANVAS_W - mCols * mCell) / 2;
        const offY = (CANVAS_H - mRows * mCell) / 2;
        for (let cy = 0; cy < mRows; cy++) {
          for (let cx = 0; cx < mCols; cx++) {
            if (isMazeWall(cx, cy)) {
              ctx.fillStyle = '#0369a1';
              ctx.fillRect(offX + cx * mCell + 1, offY + cy * mCell + 1, mCell - 2, mCell - 2);
            }
          }
        }
        ctx.font = '15px sans-serif';
        ctx.textAlign = 'center';
        for (const cr of maze.crystals) {
          ctx.fillText('💎', offX + cr.x * mCell + mCell / 2, offY + cr.y * mCell + 20);
        }
        ctx.font = '18px sans-serif';
        for (const d of maze.drones) {
          ctx.fillText('🤖', offX + d.x * mCell + mCell / 2, offY + d.y * mCell + 21);
        }
        ctx.fillText('👾', offX + maze.px * mCell + mCell / 2, offY + maze.py * mCell + 21);
        drawHudBadge(`KRISTAL: ${maze.crystals.length}`);
      }

      rafRef.current = requestAnimationFrame(stepFrame);
    };

    rafRef.current = requestAnimationFrame(stepFrame);
    return () => {
      stopLoop();
    };
  }, [finishRound, phase, selectedGame.id, stopLoop]);

  // Helper to get canvas coords from pointer
  const updateCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>, isDown?: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    pointerPosRef.current.x = (e.clientX - rect.left) * scaleX;
    pointerPosRef.current.y = (e.clientY - rect.top) * scaleY;
    if (typeof isDown === 'boolean') {
      pointerPosRef.current.down = isDown;
    }
  };

  // Next unclaimed target for selected game
  const nextTargetNumber = useMemo(() => {
    for (let t = 1; t <= ARCADE_TARGET_COUNT; t++) {
      if (!myClaimedForSelected.includes(t)) return t;
    }
    return null;
  }, [myClaimedForSelected]);

  const nextTargetReward = nextTargetNumber ? getArcadeTargetReward(nextTargetNumber) : null;

  // Target tracker list filtered by range (25 per page) and status
  const visibleTargetsList = useMemo(() => {
    const ranges: Record<typeof showTargetModalRange, [number, number]> = {
      '1-25': [1, 25],
      '26-50': [26, 50],
      '51-75': [51, 75],
      '76-100': [76, 100],
    };
    const [start, end] = ranges[showTargetModalRange];
    const list: ArcadeTargetReward[] = [];
    for (let t = start; t <= end; t++) {
      const isDone = myClaimedForSelected.includes(t);
      if (targetFilterMode === 'claimed' && !isDone) continue;
      if (targetFilterMode === 'unclaimed' && isDone) continue;
      list.push(getArcadeTargetReward(t));
    }
    return list;
  }, [myClaimedForSelected, showTargetModalRange, targetFilterMode]);

  return (
    <div className="bg-slate-900/95 border-2 border-cyan-400/60 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-6">
      {/* HEADER BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>12 MINIGAME ARCADE SULTAN • 1.200 TARGET HADIAH</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/50 text-amber-300 font-mono font-bold text-[10px]">
              Biaya Main: Rp 500.000 / Ronde
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-mono font-bold text-[10px]">
              Total Progres Anda: {totalClaimedAll12} / 1.200 Target
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            🕹️ Arena 12 Minigame Arcade (Dino Chrome + 11 Game Ekstrem • Target 100 Tier/Game)
          </h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            Setiap minigame memiliki <strong>100 Target Skor Independen (Target 1 = 500 poin s/d Target 100 = 10.000 poin)</strong>. Sekali bermain mencetak skor tinggi, <strong>seluruh target yang terlewati langsung diklaim otomatis sekaligus!</strong>
          </p>
        </div>

        {/* Reward Tier Summary Box */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 shrink-0 text-[10px] font-mono">
          <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/40 text-center">
            <span className="text-emerald-300 font-bold block">Target 1</span>
            <span className="text-white font-black block">300rb + 1🎫</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-cyan-500/40 text-center">
            <span className="text-cyan-300 font-bold block">Target 2–19</span>
            <span className="text-white font-black block">500rb + 1🎫</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-indigo-500/40 text-center">
            <span className="text-indigo-300 font-bold block">Target 20–50</span>
            <span className="text-white font-black block">1Jt + 3🎫</span>
          </div>
          <div className="p-2 rounded-xl bg-slate-950 border border-fuchsia-500/40 text-center">
            <span className="text-fuchsia-300 font-bold block">Target 51–74</span>
            <span className="text-white font-black block">1,5Jt + 5🎫</span>
          </div>
          <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-amber-950/60 border border-amber-400/60 text-center">
            <span className="text-amber-300 font-bold block">Target 75–100</span>
            <span className="text-amber-200 font-black block">2,5Jt + 7🎫</span>
          </div>
        </div>
      </div>

      {/* 12-GAME SELECTOR GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {ARCADE_MINIGAMES_12.map((game) => {
          const isSelected = game.id === selectedGame.id;
          const claimedCnt = (claimedTargetsMap[game.id] || []).length;
          const bestScore = highScoresMap[game.id] || 0;
          return (
            <button
              key={game.id}
              type="button"
              onClick={() => handleSelectGame(game.id)}
              className={`p-3 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'border-amber-400 bg-gradient-to-br from-amber-500/20 via-slate-900 to-slate-950 shadow-xl ring-2 ring-amber-400/30'
                  : `${game.accentClass} hover:border-cyan-300/70`
              }`}
            >
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-2xl leading-none select-none">{game.emoji}</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${game.badgeClass}`}>
                  #{game.number} • {game.difficultyLabel}
                </span>
              </div>
              <div>
                <h3 className="font-black text-white text-xs sm:text-sm truncate">
                  {game.title}
                </h3>
                <span className="text-[10px] text-slate-400 block">{game.genre}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono pt-1 border-t border-white/10">
                <span className="text-emerald-300 font-bold">{claimedCnt}/100 Target</span>
                <span className="text-amber-300 font-bold">Best: {bestScore.toLocaleString('id-ID')}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* ACTIVE GAME ARENA (LEFT 7 COLS) + 100 TARGET PROGRESS TRACKER (RIGHT 5 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: GAME CANVAS STAGE + DESKTOP/MOBILE CONTROLS */}
        <div className="lg:col-span-7 bg-slate-950 border-2 border-slate-800 rounded-3xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl select-none">{selectedGame.emoji}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-white text-base sm:text-lg">
                    {selectedGame.title}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${selectedGame.badgeClass}`}>
                    {selectedGame.difficultyLabel}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{selectedGame.shortRule}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block">SKOR SAAT INI</span>
                <span className="font-black text-amber-300 text-sm tabular-nums">
                  {liveScore.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                <span className="text-[9px] text-slate-400 block">TARGET BERIKUT</span>
                <span className="font-black text-cyan-300 text-sm tabular-nums">
                  {nextTargetReward ? `${nextTargetReward.requiredScore.toLocaleString('id-ID')} (#${nextTargetReward.targetNumber})` : '100/100 MAX!'}
                </span>
              </div>
            </div>
          </div>

          {runError && (
            <div className="p-3 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-200 text-xs font-bold">
              ⚠️ {runError}
            </div>
          )}

          {/* CANVAS VIEWPORT */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-[#070b18] aspect-[560/340] w-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              onPointerDown={(e) => {
                updateCanvasPointer(e, true);
                if (phase === 'PLAYING') {
                  actionTriggerRef.current.jump += 1;
                }
              }}
              onPointerMove={(e) => updateCanvasPointer(e)}
              onPointerUp={(e) => updateCanvasPointer(e, false)}
              onPointerLeave={(e) => updateCanvasPointer(e, false)}
              className="w-full h-full block touch-none select-none cursor-crosshair"
            />

            {/* OVERLAY 1: TITLE MENU */}
            {phase === 'TITLE_MENU' && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-5 text-center space-y-4">
                <span className="text-5xl select-none">{selectedGame.emoji}</span>
                <div className="space-y-1 max-w-md">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${selectedGame.badgeClass}`}>
                    GAME #{selectedGame.number} • {selectedGame.difficultyLabel}
                  </span>
                  <h4 className="text-xl sm:text-2xl font-black text-white mt-1">
                    {selectedGame.title}
                  </h4>
                  <p className="text-xs text-slate-300">{selectedGame.shortRule}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/90 border border-slate-800 rounded-2xl p-3 max-w-md w-full text-left">
                  <div>
                    <span className="text-slate-400 block">💻 Kontrol Laptop:</span>
                    <span className="text-cyan-300 font-bold">{selectedGame.controlsDesktop}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">📱 Kontrol HP:</span>
                    <span className="text-emerald-300 font-bold">{selectedGame.controlsMobile}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStartNewRun}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-400 to-emerald-400 hover:from-amber-200 hover:to-emerald-300 text-slate-950 font-black text-sm shadow-2xl cursor-pointer flex items-center gap-2 transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Main Sekarang (Biaya {formatRupiah(ARCADE_MINIGAME_ENTRY_COST)})</span>
                </button>
              </div>
            )}

            {/* OVERLAY 2: ROUND SUMMARY + AUTO MULTI-TARGET CLAIM */}
            {phase === 'ROUND_SUMMARY' && roundSummary && (
              <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-5 text-center space-y-3 overflow-y-auto">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase">
                    {roundSummary.newlyPassedTargets.length > 0
                      ? `🎉 ${roundSummary.newlyPassedTargets.length} TARGET BARU TEMBUS!`
                      : '🏁 RONDE SELESAI'}
                  </span>
                  {roundSummary.isNewHighScore && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase">
                      ⭐ REKOR BARU!
                    </span>
                  )}
                </div>

                <div className="text-3xl font-black text-white font-mono tabular-nums">
                  Skor Akhir: {roundSummary.score.toLocaleString('id-ID')}
                </div>

                {roundSummary.newlyPassedTargets.length > 0 ? (
                  <div className="w-full max-w-md p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400/70 space-y-2">
                    <div className="flex items-center justify-center gap-4 text-sm font-black">
                      <span className="text-emerald-300">
                        💵 +{formatRupiah(roundSummary.totalCashWon)}
                      </span>
                      <span className="text-cyan-300">
                        🎫 +{roundSummary.totalVouchersWon} Voucher Level
                      </span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1 max-h-20 overflow-y-auto">
                      {roundSummary.newlyPassedTargets.map((t) => (
                        <span
                          key={t.targetNumber}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-emerald-400/50 text-[9.5px] text-emerald-200 font-mono"
                        >
                          #{t.targetNumber} ({t.requiredScore})
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 max-w-md">{roundSummary.message}</p>
                )}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleStartNewRun}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-emerald-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Main Lagi ({formatRupiah(ARCADE_MINIGAME_ENTRY_COST)})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase('TITLE_MENU')}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Kembali ke Menu Game
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RESPONSIVE ON-SCREEN TOUCH & MOUSE CONTROLS (WORK ON BOTH HP & LAPTOP) */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>📱 Tombol Sentuh Layar (HP) &amp; 💻 Keyboard ({selectedGame.controlsDesktop})</span>
              {phase === 'PLAYING' && (
                <button
                  type="button"
                  onClick={() => finishRound(liveScore)}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-200 font-bold cursor-pointer"
                >
                  Akhiri &amp; Klaim Skor ({liveScore})
                </button>
              )}
            </div>

            {/* Game-adaptive large >=48px touch control buttons */}
            {(selectedGame.id === 'dino_chrome' || selectedGame.id === 'flappy_garuda' || selectedGame.id === 'laser_jump_dash') && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onPointerDown={() => {
                    actionTriggerRef.current.jump += 1;
                  }}
                  className="min-h-[52px] rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-400 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer select-none shadow-lg touch-manipulation"
                >
                  <ArrowUp className="w-5 h-5" />
                  <span>{selectedGame.id === 'flappy_garuda' ? 'KEPAK SAYAP (SPASI)' : 'LOMPAT (SPASI)'}</span>
                </button>
                <button
                  type="button"
                  onPointerDown={() => {
                    actionTriggerRef.current.duck = true;
                  }}
                  onPointerUp={() => {
                    actionTriggerRef.current.duck = false;
                  }}
                  onPointerLeave={() => {
                    actionTriggerRef.current.duck = false;
                  }}
                  className="min-h-[52px] rounded-2xl bg-slate-800 active:bg-amber-400 active:text-slate-950 border border-slate-600 text-white font-black text-sm flex items-center justify-center gap-2 cursor-pointer select-none touch-manipulation"
                >
                  <ArrowDown className="w-5 h-5" />
                  <span>{selectedGame.id === 'dino_chrome' ? 'MENUNDUK (BAWAH)' : 'AKSI CEPAT'}</span>
                </button>
              </div>
            )}

            {(selectedGame.id === 'meteor_dodger' || selectedGame.id === 'brick_breaker' || selectedGame.id === 'space_shooter' || selectedGame.id === 'catch_falling_gold') && (
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onPointerDown={() => { keysHeldRef.current['arrowleft'] = true; }}
                  onPointerUp={() => { keysHeldRef.current['arrowleft'] = false; }}
                  onPointerLeave={() => { keysHeldRef.current['arrowleft'] = false; }}
                  className="min-h-[52px] rounded-2xl bg-slate-800 active:bg-cyan-400 active:text-slate-950 border border-cyan-500/40 text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>KIRI</span>
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.shoot += 1; }}
                  className="min-h-[52px] rounded-2xl bg-amber-400 active:scale-95 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation"
                >
                  <Zap className="w-4 h-4" />
                  <span>{selectedGame.id === 'space_shooter' ? 'TEMBAK' : 'TURBO'}</span>
                </button>
                <button
                  type="button"
                  onPointerDown={() => { keysHeldRef.current['arrowright'] = true; }}
                  onPointerUp={() => { keysHeldRef.current['arrowright'] = false; }}
                  onPointerLeave={() => { keysHeldRef.current['arrowright'] = false; }}
                  className="min-h-[52px] rounded-2xl bg-slate-800 active:bg-cyan-400 active:text-slate-950 border border-cyan-500/40 text-white font-black text-sm flex items-center justify-center gap-1.5 cursor-pointer select-none touch-manipulation"
                >
                  <span>KANAN</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {selectedGame.id === 'tetris_kilat' && (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.dir = 'left'; }}
                  className="min-h-[50px] rounded-xl bg-slate-800 active:bg-cyan-400 active:text-slate-950 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  <ArrowLeft className="w-4 h-4" /> Kiri
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.rotate += 1; }}
                  className="min-h-[50px] rounded-xl bg-indigo-500 active:bg-amber-400 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  🔄 Putar
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.drop += 1; }}
                  className="min-h-[50px] rounded-xl bg-amber-400 active:scale-95 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  ⬇️ Jatuh
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.dir = 'right'; }}
                  className="min-h-[50px] rounded-xl bg-slate-800 active:bg-cyan-400 active:text-slate-950 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  Kanan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {(selectedGame.id === 'snake_turbo' || selectedGame.id === 'crossy_nusantara' || selectedGame.id === 'cyber_maze_runner') && (
              <div className="grid grid-cols-4 gap-2">
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.dir = 'left'; }}
                  className="min-h-[50px] rounded-xl bg-slate-800 active:bg-emerald-400 active:text-slate-950 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  <ArrowLeft className="w-4 h-4" /> Kiri
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.dir = 'up'; }}
                  className="min-h-[50px] rounded-xl bg-emerald-500 active:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  <ArrowUp className="w-4 h-4" /> Atas
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.dir = 'down'; }}
                  className="min-h-[50px] rounded-xl bg-slate-800 active:bg-emerald-400 active:text-slate-950 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  <ArrowDown className="w-4 h-4" /> Bawah
                </button>
                <button
                  type="button"
                  onPointerDown={() => { actionTriggerRef.current.dir = 'right'; }}
                  className="min-h-[50px] rounded-xl bg-slate-800 active:bg-emerald-400 active:text-slate-950 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                >
                  Kanan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedGame.id === 'fruit_slice_ninja' && (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((lane) => (
                  <button
                    key={lane}
                    type="button"
                    onPointerDown={() => {
                      actionTriggerRef.current.sliceLane = lane;
                    }}
                    className="min-h-[50px] rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1 cursor-pointer select-none touch-manipulation"
                  >
                    ⚔️ Tebas Jalur {lane === 0 ? 'Kiri' : lane === 1 ? 'Tengah' : 'Kanan'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: 100 TARGET PROGRESS TRACKER FOR SELECTED GAME */}
        <div className="lg:col-span-5 bg-slate-950 border-2 border-amber-400/40 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400 font-bold block">
                PROGRES TARGET {selectedGame.title.toUpperCase()}
              </span>
              <h4 className="font-black text-white text-sm sm:text-base flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>
                  100 Target Skor ({myClaimedForSelected.length}/100 Terklaim)
                </span>
              </h4>
            </div>
            <div className="px-3 py-1 rounded-xl bg-amber-400/15 border border-amber-400/40 font-mono text-[11px] text-amber-300 font-black">
              Best: {myHighScoreForSelected.toLocaleString('id-ID')} pts
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-amber-400"
                style={{ width: `${myClaimedForSelected.length}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Target 1: 500 pts</span>
              <span>Target 100: 10.000 pts</span>
            </div>
          </div>

          {/* Range Tabs + Status Filter */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex items-center gap-1">
              {(['1-25', '26-50', '51-75', '76-100'] as const).map((rng) => (
                <button
                  key={rng}
                  type="button"
                  onClick={() => setShowTargetModalRange(rng)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-black cursor-pointer ${
                    showTargetModalRange === rng
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  #{rng}
                </button>
              ))}
            </div>
            <select
              value={targetFilterMode}
              onChange={(e) => setTargetFilterMode(e.target.value as 'all' | 'unclaimed' | 'claimed')}
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] text-white font-bold"
            >
              <option value="all">Semua Target</option>
              <option value="unclaimed">Belum Tercapai</option>
              <option value="claimed">Sudah Diklaim</option>
            </select>
          </div>

          {/* Target Rows */}
          <div className="max-h-[340px] overflow-y-auto space-y-1.5 pr-1">
            {visibleTargetsList.map((t) => {
              const isClaimed = myClaimedForSelected.includes(t.targetNumber);
              return (
                <div
                  key={t.targetNumber}
                  className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                    isClaimed
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {isClaimed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <span className="font-black text-white block text-[11px] tabular-nums">
                        Target #{t.targetNumber}: {t.requiredScore.toLocaleString('id-ID')} Poin
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {t.tierLabel}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[10.5px]">
                    <span className="text-emerald-300 font-black block">
                      {formatRupiah(t.cashReward)}
                    </span>
                    <span className="text-cyan-300 font-bold block">
                      +{t.voucherReward} Voucher
                    </span>
                  </div>
                </div>
              );
            })}
            {visibleTargetsList.length === 0 && (
              <div className="text-center py-6 text-xs text-slate-400">
                Tidak ada target pada filter ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
