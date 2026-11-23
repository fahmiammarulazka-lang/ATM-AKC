/**
 * Bank Nusantara — Arena Minigame Adu Stopwatch vs Bot Level Hard (Zero-Lag 60–120 FPS Engine)
 * - Level Normal (Mudah): Biaya Rp 500.000 | Hadiah Menang: +1 Voucher Level & +Rp 100.000
 *   Format Target Sistem: Angka Bulat X (1 s/d 10 detik, mis. 3 atau 7 -> dipaskan di 3,00 atau 7,00 pada layar X,XX)
 * - Level Susah (Hard): Biaya Rp 1.200.000 | Hadiah Menang: +Rp 500.000 & +2 Voucher Level
 *   Format Target Sistem: Milidetik Puluhan X,X tanpa milidetik satuan (mis. 0,1 / 0,10 atau 4,3 / 4,30),
 *   namun di layar stopwatch tetap berjalan penuh X,XX (Detik, Milidetik Puluhan & Milidetik Satuan).
 * - Lawan: Bot Level Hard dengan presisi tinggi (selisih 0,00 s/d 0,08 detik dari target).
 * - Seri (Draw): Selisih jarak waktu pemain & Bot sama persis -> Saldo kembali utuh 100% (tanpa potong biaya).
 * - Performa: Zero React re-render selama stopwatch berjalan (pembaruan langsung DOM Ref + CSS paint containment
 *   + pemicu kontak pertama onPointerDown touch-manipulation tanpa delay).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Timer,
  Trophy,
  Ticket,
  Banknote,
  Bot,
  User,
  RefreshCw,
  Play,
  Square,
  Zap,
  ShieldCheck,
  History,
  Trash2,
  Flame,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah, isUnlimitedNumber } from '../utils/bankUtils';

export type StopwatchDifficulty = 'normal' | 'hard';

interface StopwatchMatchRecord {
  id: string;
  timestamp: string;
  level: StopwatchDifficulty;
  targetCentis: number;
  playerCentis: number;
  botCentis: number;
  playerDiffCentis: number;
  botDiffCentis: number;
  outcome: 'win' | 'draw' | 'lose';
  entryCost: number;
  rewardCash: number;
  rewardVoucher: number;
}

const HISTORY_STORAGE_PREFIX = 'bank_nusantara_stopwatch_history_v1_';

/**
 * Formats integer centiseconds (1 centisecond = 10ms = 0,01s) into X,XX
 * where:
 * - first part = Detik (X)
 * - first decimal = Milidetik Puluhan (0..9)
 * - second decimal = Milidetik Satuan (0..9)
 */
export function formatStopwatchParts(centis: number): {
  secondsStr: string;
  tensStr: string;
  unitsStr: string;
  fullStr: string;
} {
  const safe = Math.max(0, Math.round(centis));
  const sec = Math.floor(safe / 100);
  const tens = Math.floor((safe % 100) / 10);
  const units = safe % 10;
  return {
    secondsStr: String(sec),
    tensStr: String(tens),
    unitsStr: String(units),
    fullStr: `${sec},${tens}${units}`,
  };
}

/**
 * Generates an automatic target in centiseconds according to difficulty:
 * - 'normal': Whole integer second X from 1 to 10 (100 to 1000 centis, e.g. 3 -> 300 centis = 3,00)
 * - 'hard': Seconds + Tens of milliseconds only (units = 0), including iconic 0,1 (10 centis)
 *   and 1,10..9,90 (e.g. 0,1 / 4,3 / 7,8) where tens digit is always 1..9 and units digit is 0.
 */
function generateAutoTargetCentis(level: StopwatchDifficulty, previousCentis?: number): number {
  for (let attempt = 0; attempt < 12; attempt++) {
    let candidate = 300;
    if (level === 'normal') {
      const randomSec = Math.floor(Math.random() * 10) + 1;
      candidate = randomSec * 100;
    } else {
      const roll = Math.random();
      if (roll < 0.14) {
        candidate = 10; // 0,1 detik (0,10 di stopwatch)
      } else if (roll < 0.25) {
        const subSecTens = Math.floor(Math.random() * 9) + 1; // 1..9 -> 0,1 s/d 0,9
        candidate = subSecTens * 10;
      } else {
        const sec = Math.floor(Math.random() * 9) + 1; // 1..9
        const tens = Math.floor(Math.random() * 9) + 1; // 1..9 (milidetik puluhan, tanpa satuan)
        candidate = sec * 100 + tens * 10;
      }
    }
    if (candidate !== previousCentis) {
      return candidate;
    }
  }
  return level === 'normal' ? 500 : 430;
}

/**
 * Computes Bot Level Hard's stop time in centiseconds.
 * Bot Level Hard is extremely sharp: stops within 0,00 to 0,08 seconds (0 to 8 centiseconds) of target.
 */
function generateBotHardCentis(targetCentis: number): number {
  const diffs = [0, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 6, 7, 8];
  const chosenDiff = diffs[Math.floor(Math.random() * diffs.length)];
  const sign = Math.random() < 0.5 ? -1 : 1;
  const rawBot = targetCentis + sign * chosenDiff;
  if (rawBot < 2) {
    return targetCentis + chosenDiff;
  }
  return rawBot;
}

interface StopwatchHistorySectionProps {
  history: StopwatchMatchRecord[];
  onClearHistory: () => void;
}

const StopwatchHistorySection: React.FC<StopwatchHistorySectionProps> = React.memo(
  ({ history, onClearHistory }) => (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-cyan-400" />
          <h4 className="font-black text-white text-xs sm:text-sm uppercase tracking-wider">
            Riwayat Pertandingan Adu Stopwatch ({history.length})
          </h4>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-rose-300 text-[11px] font-semibold cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Bersihkan Riwayat</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center text-xs text-slate-400">
          Belum ada riwayat pertandingan Adu Stopwatch. Pilih <strong>Level Normal</strong> atau{' '}
          <strong>Level Susah</strong> lalu tekan <strong>Mulai Adu Stopwatch</strong>!
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {history.map((item) => {
            const tParts = formatStopwatchParts(item.targetCentis);
            const pParts = formatStopwatchParts(item.playerCentis);
            const bParts = formatStopwatchParts(item.botCentis);
            const pDiffParts = formatStopwatchParts(item.playerDiffCentis);
            const bDiffParts = formatStopwatchParts(item.botDiffCentis);
            const targetDisp =
              item.level === 'normal'
                ? `${tParts.secondsStr} (${tParts.fullStr})`
                : `${tParts.secondsStr},${tParts.tensStr} (${tParts.fullStr})`;

            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${
                      item.outcome === 'win'
                        ? 'bg-emerald-400 text-slate-950'
                        : item.outcome === 'draw'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-rose-500/30 text-rose-200 border border-rose-500/40'
                    }`}
                  >
                    {item.outcome === 'win'
                      ? '🏆 MENANG'
                      : item.outcome === 'draw'
                      ? '🤝 SERI'
                      : '💥 KALAH'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] ${
                      item.level === 'hard'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-400/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}
                  >
                    {item.level === 'hard' ? 'Level Susah' : 'Level Normal'}
                  </span>
                  <span className="font-mono text-slate-200 font-bold">
                    Target: <strong className="text-amber-300">{targetDisp}</strong>
                  </span>
                  <span className="font-mono text-cyan-300">
                    Anda: <strong>{pParts.fullStr}</strong> (±{pDiffParts.fullStr})
                  </span>
                  <span className="font-mono text-rose-300">
                    Bot: <strong>{bParts.fullStr}</strong> (±{bDiffParts.fullStr})
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono">
                  {item.outcome === 'win' ? (
                    <span className="text-emerald-400 font-black flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        +{item.rewardVoucher} Voucher &amp; +{formatRupiah(item.rewardCash)}
                      </span>
                    </span>
                  ) : item.outcome === 'draw' ? (
                    <span className="text-amber-300 font-bold">Refund 100%</span>
                  ) : (
                    <span className="text-rose-400 font-bold">
                      -{formatRupiah(item.entryCost)}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500">{item.timestamp}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
);

StopwatchHistorySection.displayName = 'StopwatchHistorySection';

export const StopwatchDuelArena: React.FC = React.memo(() => {
  const { currentAccount, playStopwatchChallenge } = useBank();

  const [difficulty, setDifficulty] = useState<StopwatchDifficulty>('normal');
  const [targetCentis, setTargetCentis] = useState<number>(() =>
    generateAutoTargetCentis('normal')
  );
  const [isRunning, setIsRunning] = useState<boolean>(false);
  // Idle display state (updated ONLY on stop / reset / start, NEVER during the 60-120fps loop!)
  const [settledPlayerCentis, setSettledPlayerCentis] = useState<number>(0);
  const [settledBotCentis, setSettledBotCentis] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{
    outcome: 'win' | 'draw' | 'lose';
    level: StopwatchDifficulty;
    targetCentis: number;
    playerCentis: number;
    botCentis: number;
    playerDiffCentis: number;
    botDiffCentis: number;
    entryCost: number;
    rewardCash: number;
    rewardVoucher: number;
    message: string;
  } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [history, setHistory] = useState<StopwatchMatchRecord[]>([]);

  // High-frequency refs (Zero React re-renders during RUNNING!)
  const rafRef = useRef<number | null>(null);
  const startPerfRef = useRef<number>(0);
  const isRunningRef = useRef<boolean>(false);
  const targetCentisRef = useRef<number>(targetCentis);
  const difficultyRef = useRef<StopwatchDifficulty>(difficulty);
  const plannedBotCentisRef = useRef<number>(0);
  const lastDrawnPlayerCentisRef = useRef<number>(-1);
  const lastDrawnBotCentisRef = useRef<number>(-1);
  const botBadgeFlippedRef = useRef<boolean>(false);

  // Direct DOM digit span refs for Player & Bot (X,XX + breakdown cards)
  const playerSecBigRef = useRef<HTMLSpanElement | null>(null);
  const playerTensBigRef = useRef<HTMLSpanElement | null>(null);
  const playerUnitsBigRef = useRef<HTMLSpanElement | null>(null);
  const playerSecSubRef = useRef<HTMLSpanElement | null>(null);
  const playerTensSubRef = useRef<HTMLSpanElement | null>(null);
  const playerUnitsSubRef = useRef<HTMLSpanElement | null>(null);

  const botSecBigRef = useRef<HTMLSpanElement | null>(null);
  const botTensBigRef = useRef<HTMLSpanElement | null>(null);
  const botUnitsBigRef = useRef<HTMLSpanElement | null>(null);
  const botSecSubRef = useRef<HTMLSpanElement | null>(null);
  const botTensSubRef = useRef<HTMLSpanElement | null>(null);
  const botUnitsSubRef = useRef<HTMLSpanElement | null>(null);
  const botBadgeRef = useRef<HTMLSpanElement | null>(null);

  // Stable refs for callbacks to prevent effect churn
  const latestPlayStopwatchRef = useRef(playStopwatchChallenge);
  latestPlayStopwatchRef.current = playStopwatchChallenge;
  const currentAccountIdRef = useRef<string | undefined>(currentAccount?.id);
  currentAccountIdRef.current = currentAccount?.id;

  targetCentisRef.current = targetCentis;
  difficultyRef.current = difficulty;

  const writePlayerDigitsToDom = useCallback((centis: number) => {
    const safe = Math.max(0, Math.round(centis));
    if (lastDrawnPlayerCentisRef.current === safe) return;
    lastDrawnPlayerCentisRef.current = safe;

    const secStr = String(Math.floor(safe / 100));
    const tensStr = String(Math.floor((safe % 100) / 10));
    const unitsStr = String(safe % 10);

    if (playerSecBigRef.current && playerSecBigRef.current.textContent !== secStr) {
      playerSecBigRef.current.textContent = secStr;
    }
    if (playerTensBigRef.current && playerTensBigRef.current.textContent !== tensStr) {
      playerTensBigRef.current.textContent = tensStr;
    }
    if (playerUnitsBigRef.current && playerUnitsBigRef.current.textContent !== unitsStr) {
      playerUnitsBigRef.current.textContent = unitsStr;
    }
    if (playerSecSubRef.current && playerSecSubRef.current.textContent !== secStr) {
      playerSecSubRef.current.textContent = secStr;
    }
    if (playerTensSubRef.current && playerTensSubRef.current.textContent !== tensStr) {
      playerTensSubRef.current.textContent = tensStr;
    }
    if (playerUnitsSubRef.current && playerUnitsSubRef.current.textContent !== unitsStr) {
      playerUnitsSubRef.current.textContent = unitsStr;
    }
  }, []);

  const writeBotDigitsToDom = useCallback((centis: number) => {
    const safe = Math.max(0, Math.round(centis));
    if (lastDrawnBotCentisRef.current === safe) return;
    lastDrawnBotCentisRef.current = safe;

    const secStr = String(Math.floor(safe / 100));
    const tensStr = String(Math.floor((safe % 100) / 10));
    const unitsStr = String(safe % 10);

    if (botSecBigRef.current && botSecBigRef.current.textContent !== secStr) {
      botSecBigRef.current.textContent = secStr;
    }
    if (botTensBigRef.current && botTensBigRef.current.textContent !== tensStr) {
      botTensBigRef.current.textContent = tensStr;
    }
    if (botUnitsBigRef.current && botUnitsBigRef.current.textContent !== unitsStr) {
      botUnitsBigRef.current.textContent = unitsStr;
    }
    if (botSecSubRef.current && botSecSubRef.current.textContent !== secStr) {
      botSecSubRef.current.textContent = secStr;
    }
    if (botTensSubRef.current && botTensSubRef.current.textContent !== tensStr) {
      botTensSubRef.current.textContent = tensStr;
    }
    if (botUnitsSubRef.current && botUnitsSubRef.current.textContent !== unitsStr) {
      botUnitsSubRef.current.textContent = unitsStr;
    }
  }, []);

  // Load match history per account
  useEffect(() => {
    if (!currentAccount?.id) return;
    try {
      const raw = localStorage.getItem(`${HISTORY_STORAGE_PREFIX}${currentAccount.id}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setHistory(parsed.slice(0, 25));
        }
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }
  }, [currentAccount?.id]);

  const saveMatchToHistory = useCallback((record: StopwatchMatchRecord) => {
    const accId = currentAccountIdRef.current;
    if (!accId) return;
    setHistory((prev) => {
      const next = [record, ...prev].slice(0, 25);
      try {
        localStorage.setItem(`${HISTORY_STORAGE_PREFIX}${accId}`, JSON.stringify(next));
      } catch {
        // ignore storage quota errors
      }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    const accId = currentAccountIdRef.current;
    if (!accId) return;
    setHistory([]);
    try {
      localStorage.removeItem(`${HISTORY_STORAGE_PREFIX}${accId}`);
    } catch {
      // ignore
    }
  }, []);

  // Keep DOM digit spans synced whenever settled values change while idle
  useEffect(() => {
    if (!isRunningRef.current) {
      lastDrawnPlayerCentisRef.current = -1;
      lastDrawnBotCentisRef.current = -1;
      writePlayerDigitsToDom(settledPlayerCentis);
      writeBotDigitsToDom(settledBotCentis);
    }
  }, [settledPlayerCentis, settledBotCentis, writePlayerDigitsToDom, writeBotDigitsToDom]);

  // Switch difficulty level
  const handleSelectDifficulty = (nextLevel: StopwatchDifficulty) => {
    if (isRunningRef.current) return;
    setDifficulty(nextLevel);
    const nextTarget = generateAutoTargetCentis(nextLevel);
    setTargetCentis(nextTarget);
    setSettledPlayerCentis(0);
    setSettledBotCentis(0);
    lastDrawnPlayerCentisRef.current = -1;
    lastDrawnBotCentisRef.current = -1;
    writePlayerDigitsToDom(0);
    writeBotDigitsToDom(0);
    setLastResult(null);
    setErrorBanner(null);
  };

  // Reroll target manually before starting
  const handleRerollTarget = (customCentis?: number) => {
    if (isRunningRef.current) return;
    const nextTarget =
      typeof customCentis === 'number'
        ? customCentis
        : generateAutoTargetCentis(difficulty, targetCentis);
    setTargetCentis(nextTarget);
    setSettledPlayerCentis(0);
    setSettledBotCentis(0);
    lastDrawnPlayerCentisRef.current = -1;
    lastDrawnBotCentisRef.current = -1;
    writePlayerDigitsToDom(0);
    writeBotDigitsToDom(0);
    setLastResult(null);
    setErrorBanner(null);
  };

  // Stop & settle match (Zero-Latency Instant Freeze on first contact!)
  const handleStopMatch = useCallback(
    (forcedElapsedCentis?: number) => {
      if (!isRunningRef.current) return;
      // 1. Capture exact millisecond IMMEDIATELY on pointer contact before any React/storage work
      const stopPerfNow = performance.now();
      isRunningRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const elapsedMs = stopPerfNow - startPerfRef.current;
      const finalPlayerCentis =
        typeof forcedElapsedCentis === 'number'
          ? forcedElapsedCentis
          : Math.max(1, Math.round(elapsedMs / 10));

      const activeTarget = targetCentisRef.current;
      const activeLevel = difficultyRef.current;

      // Finalize Bot Level Hard time (ensure a perfect 0,00 player stop always beats the bot)
      let finalBotCentis = plannedBotCentisRef.current;
      if (finalPlayerCentis === activeTarget && finalBotCentis === activeTarget) {
        finalBotCentis = activeTarget + (Math.random() < 0.5 ? 1 : 2);
      }

      // 2. Freeze exact numbers directly on screen in < 0.1ms
      lastDrawnPlayerCentisRef.current = -1;
      lastDrawnBotCentisRef.current = -1;
      writePlayerDigitsToDom(finalPlayerCentis);
      writeBotDigitsToDom(finalBotCentis);

      // 3. Commit single React state settlement & Cloud sync
      setIsRunning(false);
      setSettledPlayerCentis(finalPlayerCentis);
      setSettledBotCentis(finalBotCentis);

      const res = latestPlayStopwatchRef.current({
        level: activeLevel,
        targetCentis: activeTarget,
        playerCentis: finalPlayerCentis,
        botCentis: finalBotCentis,
      });

      if (!res.success || !res.outcome) {
        setErrorBanner(res.message);
        return;
      }

      const resultObj = {
        outcome: res.outcome,
        level: activeLevel,
        targetCentis: activeTarget,
        playerCentis: finalPlayerCentis,
        botCentis: finalBotCentis,
        playerDiffCentis: res.playerDiffCentis,
        botDiffCentis: res.botDiffCentis,
        entryCost: res.entryCost,
        rewardCash: res.rewardCash,
        rewardVoucher: res.rewardVoucher,
        message: res.message,
      };
      setLastResult(resultObj);

      saveMatchToHistory({
        id: `sw-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        ...resultObj,
      });
    },
    [saveMatchToHistory, writeBotDigitsToDom, writePlayerDigitsToDom]
  );

  // Start match (Zero-Re-Render RAF Loop)
  const handleStartMatch = () => {
    if (!currentAccount || isRunningRef.current) return;
    setErrorBanner(null);

    const entryCost = difficulty === 'hard' ? 1_200_000 : 500_000;
    const isUnlim =
      currentAccount.cardTier === 'admin' || isUnlimitedNumber(currentAccount.balance);

    if (!isUnlim && currentAccount.balance < entryCost) {
      setErrorBanner(
        `Saldo tidak mencukupi untuk memulai Adu Stopwatch (${
          difficulty === 'hard' ? 'Level Susah' : 'Level Normal'
        }). Biaya: ${formatRupiah(entryCost)}, Saldo Anda: ${formatRupiah(
          currentAccount.balance
        )}.`
      );
      return;
    }

    // Auto-generate a fresh target when replaying right after a finished match
    let activeTarget = targetCentis;
    if (lastResult !== null) {
      activeTarget = generateAutoTargetCentis(difficulty, targetCentis);
      setTargetCentis(activeTarget);
      targetCentisRef.current = activeTarget;
    }

    const botTargetStop = generateBotHardCentis(activeTarget);
    plannedBotCentisRef.current = botTargetStop;
    botBadgeFlippedRef.current = false;

    setLastResult(null);
    setSettledPlayerCentis(0);
    setSettledBotCentis(0);
    lastDrawnPlayerCentisRef.current = -1;
    lastDrawnBotCentisRef.current = -1;
    writePlayerDigitsToDom(0);
    writeBotDigitsToDom(0);

    isRunningRef.current = true;
    setIsRunning(true);
    startPerfRef.current = performance.now();

    const maxRunCentis = activeTarget + 300; // Auto-stop if player overshoots by +3,00 seconds

    const tick = () => {
      if (!isRunningRef.current) return;
      const now = performance.now();
      const elapsedCentis = Math.max(0, Math.round((now - startPerfRef.current) / 10));

      // Direct DOM text updates: ZERO React re-renders per frame!
      writePlayerDigitsToDom(elapsedCentis);

      const botDisplayCentis =
        elapsedCentis >= plannedBotCentisRef.current ? plannedBotCentisRef.current : elapsedCentis;
      writeBotDigitsToDom(botDisplayCentis);

      if (!botBadgeFlippedRef.current && elapsedCentis >= plannedBotCentisRef.current) {
        botBadgeFlippedRef.current = true;
        if (botBadgeRef.current) {
          botBadgeRef.current.textContent = '⚡ BOT SUDAH TEKAN STOP!';
          botBadgeRef.current.className =
            'px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] bg-amber-400 text-slate-950';
        }
      }

      if (elapsedCentis >= maxRunCentis) {
        handleStopMatch(maxRunCentis);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Support Space / Enter key to stop stopwatch immediately while running (stable listener, zero churn)
  useEffect(() => {
    if (!isRunning) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleStopMatch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isRunning, handleStopMatch]);

  if (!currentAccount) return null;

  const entryCost = difficulty === 'hard' ? 1_200_000 : 500_000;
  const winCash = difficulty === 'hard' ? 500_000 : 100_000;
  const winVouchers = difficulty === 'hard' ? 2 : 1;

  const targetParts = formatStopwatchParts(targetCentis);
  const playerParts = formatStopwatchParts(settledPlayerCentis);
  const botParts = formatStopwatchParts(settledBotCentis);

  // Target string according to level rule:
  // - Level Normal: only X (integer second, e.g. "3" or "7")
  // - Level Susah: X,X (seconds + tens of milliseconds only, no units of milliseconds, e.g. "0,1" or "4,3")
  const formattedTargetPrimary =
    difficulty === 'normal'
      ? targetParts.secondsStr
      : `${targetParts.secondsStr},${targetParts.tensStr}`;

  const formattedTargetStopwatchHint =
    difficulty === 'normal'
      ? `${targetParts.secondsStr},00`
      : `${targetParts.secondsStr},${targetParts.tensStr}0`;

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/90 border-2 border-cyan-400/60 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* HEADER BAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-lg shadow-rose-500/20">
              <Flame className="w-3.5 h-3.5" />
              <span>🤖 LAWAN BOT LEVEL: HARD (PRESISI TINGGI)</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-mono font-bold text-[10px]">
              Format Stopwatch: X,XX (Detik, Milidetik Puluhan &amp; Satuan)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-mono font-bold text-[10px]">
              Menang Langsung Cair Voucher + Uang Tunai!
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
            <Timer className="w-7 h-7 text-cyan-400 shrink-0" />
            <span>Arena Adu Stopwatch Lawan Bot Level Hard</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Hentikan stopwatch Anda sedekat mungkin dengan <strong>Waktu Target Sistem</strong> untuk mengalahkan catatan waktu <strong>Bot Level Hard</strong>! Jika selisih jarak waktu Anda dan Bot sama persis (<strong>Seri</strong>), biaya pendaftaran dikembalikan utuh <strong>100%</strong>.
          </p>
        </div>

        {/* Account Stopwatch Career Summary Pill */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-cyan-500/40 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Rekor Menang Stopwatch
            </span>
            <span className="font-mono font-black text-cyan-300 text-sm sm:text-base tabular-nums">
              🏆 {currentAccount.stopwatchWins || 0} / {currentAccount.stopwatchPlayed || 0} Laga
            </span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-amber-400/50 text-center">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">
              Voucher Level Anda
            </span>
            <span className="font-mono font-black text-amber-300 text-sm sm:text-base tabular-nums">
              🎫 {currentAccount.levelVouchers || 0} Voucher
            </span>
          </div>
        </div>
      </div>

      {/* LEVEL SELECTOR TABS: LEVEL NORMAL vs LEVEL SUSAH */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Level Normal Card */}
        <button
          type="button"
          disabled={isRunning}
          onClick={() => handleSelectDifficulty('normal')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-colors cursor-pointer touch-manipulation flex flex-col justify-between gap-3 ${
            difficulty === 'normal'
              ? 'bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border-emerald-400 shadow-xl shadow-emerald-500/15'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase tracking-wider">
                LEVEL 1 • NORMAL (MUDAH)
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1.5">
                Target Angka Bulat (Format: X)
              </h3>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/40 text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">Biaya Main:</span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tabular-nums">
                Rp 500.000
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Target waktu otomatis berupa <strong>angka detik bulat X</strong> (1 s/d 10 detik, misal <strong>3</strong> atau <strong>7</strong>). Pas-kan di layar stopwatch <strong>X,00</strong>!
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Hadiah Tiap Menang:</span>
            <span className="font-mono font-black text-emerald-300 tabular-nums">
              +1 Voucher Level &amp; +Rp 100.000
            </span>
          </div>
        </button>

        {/* Level Susah Card */}
        <button
          type="button"
          disabled={isRunning}
          onClick={() => handleSelectDifficulty('hard')}
          className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-colors cursor-pointer touch-manipulation flex flex-col justify-between gap-3 ${
            difficulty === 'hard'
              ? 'bg-gradient-to-br from-rose-950/80 via-slate-900 to-slate-950 border-rose-400 shadow-xl shadow-rose-500/15'
              : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 opacity-80'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider">
                LEVEL 2 • SUSAH (EKSTREM)
              </span>
              <h3 className="text-base sm:text-lg font-black text-white mt-1.5">
                Target Milidetik Puluhan (Format: X,X)
              </h3>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-rose-500/40 text-right shrink-0">
              <span className="text-[10px] text-slate-400 block">Biaya Main:</span>
              <span className="font-mono font-black text-amber-300 text-xs sm:text-sm tabular-nums">
                Rp 1.200.000
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Target memiliki <strong>milidetik otomatis puluhan tanpa milidetik satuan</strong> (misal <strong>0,1</strong> atau <strong>4,3</strong>), namun di stopwatch tetap berjalan penuh <strong>X,XX</strong>!
          </p>

          <div className="p-2.5 rounded-xl bg-slate-950/90 border border-rose-500/30 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-semibold">Hadiah Tiap Menang:</span>
            <span className="font-mono font-black text-amber-300 tabular-nums">
              +Rp 500.000 &amp; +2 Voucher Level
            </span>
          </div>
        </button>
      </div>

      {/* ERROR / INSUFFICIENT BALANCE BANNER */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-950/90 border-2 border-rose-500/70 text-rose-100 flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="px-2.5 py-1 rounded-lg bg-rose-900/70 hover:bg-rose-800 text-rose-200 text-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* MAIN CHRONOGRAPH ARENA: SYSTEM TARGET + DUAL STOPWATCH (PLAYER vs BOT HARD) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-slate-950 border-2 border-slate-800 space-y-6">
        {/* TOP TARGET BANNER */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-cyan-950/90 border-2 border-cyan-400/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md bg-cyan-400 text-slate-950 font-mono font-black text-[10px] uppercase">
                🎯 TARGET WAKTU SISTEM OTOMATIS
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">
                {difficulty === 'normal'
                  ? 'Format Level Normal: Angka Bulat X (Tanpa Milidetik)'
                  : 'Format Level Susah: X,X (Milidetik Puluhan • Tanpa Milidetik Satuan)'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Pas-kan tombol berhenti tepat pada{' '}
              <strong className="text-amber-300 font-mono">{formattedTargetStopwatchHint}</strong> detik di layar stopwatch <strong>X,XX</strong>!
            </p>
            {difficulty === 'hard' && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400">Contoh Cepat:</span>
                {[
                  { label: 'Target 0,1 (Iconic!)', centis: 10 },
                  { label: 'Target 2,5', centis: 250 },
                  { label: 'Target 4,3', centis: 430 },
                  { label: 'Target 7,8', centis: 780 },
                ].map((preset) => (
                  <button
                    key={preset.centis}
                    type="button"
                    disabled={isRunning}
                    onClick={() => handleRerollTarget(preset.centis)}
                    className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold cursor-pointer border transition-colors touch-manipulation ${
                      targetCentis === preset.centis
                        ? 'bg-rose-500 text-white border-rose-300'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 self-start sm:self-center shrink-0">
            <div className="px-5 py-3 rounded-2xl bg-slate-950 border-2 border-amber-400 text-center shadow-lg shadow-amber-500/10">
              <span className="text-[10px] font-mono uppercase text-amber-300 font-bold block">
                TARGET ({difficulty === 'normal' ? 'FORMAT X' : 'FORMAT X,X'})
              </span>
              <div className="font-mono font-black text-3xl sm:text-4xl text-white tracking-tight tabular-nums mt-0.5">
                {formattedTargetPrimary}
                <span className="text-xs sm:text-sm text-amber-300 ml-1.5 font-bold">dtk</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-300 block">
                (Di Stopwatch: {formattedTargetStopwatchHint})
              </span>
            </div>

            <button
              type="button"
              disabled={isRunning}
              onClick={() => handleRerollTarget()}
              title="Acak Target Waktu Baru"
              className="p-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 hover:text-white cursor-pointer touch-manipulation transition-colors flex flex-col items-center gap-1 disabled:opacity-40"
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-[10px] font-bold">Acak Target</span>
            </button>
          </div>
        </div>

        {/* DUAL LIVE STOPWATCH DISPLAY: PLAYER (X,XX) VS BOT LEVEL HARD (X,XX) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT: PLAYER STOPWATCH (X,XX) */}
          <div
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 transition-colors ${
              isRunning
                ? 'bg-gradient-to-b from-cyan-950/50 to-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/10'
                : lastResult?.outcome === 'win'
                ? 'bg-emerald-950/40 border-emerald-400'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                <User className="w-4 h-4" />
                <span>STOPWATCH ANDA (FORMAT X,XX)</span>
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                  isRunning
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {isRunning ? 'SEDANG BERJALAN' : 'SIAP / BERHENTI'}
              </span>
            </div>

            {/* Big X,XX Digital Readout with CSS Paint Containment & Direct DOM Refs */}
            <div className="py-4 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2 [contain:layout_style_paint]">
              <div className="font-mono font-black text-5xl sm:text-6xl tracking-tight tabular-nums flex items-baseline justify-center">
                <span ref={playerSecBigRef} className="text-white">
                  {playerParts.secondsStr}
                </span>
                <span className="text-amber-400 mx-0.5">,</span>
                <span ref={playerTensBigRef} className="text-cyan-300">
                  {playerParts.tensStr}
                </span>
                <span ref={playerUnitsBigRef} className="text-fuchsia-300">
                  {playerParts.unitsStr}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                  <span ref={playerSecSubRef} className="text-white font-black block">
                    {playerParts.secondsStr}
                  </span>
                  <span>Detik (X)</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-cyan-300">
                  <span ref={playerTensSubRef} className="font-black block">
                    {playerParts.tensStr}
                  </span>
                  <span>Milidetik Puluhan</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/90 border border-fuchsia-500/30 text-fuchsia-300">
                  <span ref={playerUnitsSubRef} className="font-black block">
                    {playerParts.unitsStr}
                  </span>
                  <span>Milidetik Satuan</span>
                </div>
              </div>
            </div>

            {lastResult && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Selisih Anda dari Target:</span>
                <span className="font-mono font-black text-cyan-300 tabular-nums">
                  {formatStopwatchParts(lastResult.playerDiffCentis).fullStr} detik
                </span>
              </div>
            )}
          </div>

          {/* RIGHT: BOT LEVEL HARD STOPWATCH (X,XX) */}
          <div
            className={`p-5 rounded-2xl border-2 flex flex-col justify-between gap-4 transition-colors ${
              isRunning
                ? 'bg-gradient-to-b from-rose-950/40 to-slate-900 border-rose-400/70'
                : lastResult?.outcome === 'lose'
                ? 'bg-rose-950/40 border-rose-400'
                : 'bg-slate-900/90 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                <Bot className="w-4 h-4" />
                <span>STOPWATCH BOT (LEVEL HARD)</span>
              </span>
              <span
                ref={botBadgeRef}
                className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                  isRunning
                    ? 'bg-rose-500 text-white'
                    : 'bg-slate-800 text-rose-300'
                }`}
              >
                {isRunning ? 'BOT MENGINCAR TARGET...' : 'AKURASI PRESISI 0,01–0,08s'}
              </span>
            </div>

            {/* Big X,XX Digital Readout for Bot with CSS Paint Containment & Direct DOM Refs */}
            <div className="py-4 px-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2 [contain:layout_style_paint]">
              <div className="font-mono font-black text-5xl sm:text-6xl tracking-tight tabular-nums flex items-baseline justify-center">
                <span ref={botSecBigRef} className="text-white">
                  {botParts.secondsStr}
                </span>
                <span className="text-amber-400 mx-0.5">,</span>
                <span ref={botTensBigRef} className="text-rose-300">
                  {botParts.tensStr}
                </span>
                <span ref={botUnitsBigRef} className="text-amber-300">
                  {botParts.unitsStr}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="p-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-slate-300">
                  <span ref={botSecSubRef} className="text-white font-black block">
                    {botParts.secondsStr}
                  </span>
                  <span>Detik (X)</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/90 border border-rose-500/30 text-rose-300">
                  <span ref={botTensSubRef} className="font-black block">
                    {botParts.tensStr}
                  </span>
                  <span>Milidetik Puluhan</span>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-900/90 border border-amber-500/30 text-amber-300">
                  <span ref={botUnitsSubRef} className="font-black block">
                    {botParts.unitsStr}
                  </span>
                  <span>Milidetik Satuan</span>
                </div>
              </div>
            </div>

            {lastResult && (
              <div className="flex items-center justify-between text-xs px-1">
                <span className="text-slate-400">Selisih Bot Level Hard:</span>
                <span className="font-mono font-black text-rose-300 tabular-nums">
                  {formatStopwatchParts(lastResult.botDiffCentis).fullStr} detik
                </span>
              </div>
            )}
          </div>
        </div>

        {/* PRIMARY START / INSTANT ZERO-LATENCY STOP TRIGGER BUTTON */}
        <div className="space-y-2">
          {!isRunning ? (
            <button
              type="button"
              onClick={handleStartMatch}
              className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-base sm:text-lg cursor-pointer touch-manipulation select-none transition-transform shadow-2xl flex items-center justify-center gap-3 active:scale-[0.99] ${
                difficulty === 'hard'
                  ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 hover:from-rose-400 hover:to-amber-300 text-slate-950 shadow-rose-500/25'
                  : 'bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 shadow-cyan-500/25'
              }`}
            >
              <Play className="w-6 h-6 fill-current shrink-0" />
              <span>
                MULAI ADU STOPWATCH ({difficulty === 'hard' ? 'LEVEL SUSAH' : 'LEVEL NORMAL'} •{' '}
                {formatRupiah(entryCost)}) — TARGET {formattedTargetPrimary} DETIK
              </span>
            </button>
          ) : (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                handleStopMatch();
              }}
              onClick={() => handleStopMatch()}
              className="w-full py-5 sm:py-6 px-6 rounded-2xl bg-gradient-to-r from-amber-400 via-rose-500 to-amber-400 text-slate-950 font-black text-lg sm:text-2xl cursor-pointer touch-manipulation select-none shadow-2xl shadow-rose-500/30 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <Square className="w-7 h-7 fill-current shrink-0" />
              <span>
                TEKAN BERHENTI SEKARANG! (PAS-KAN DI {formattedTargetStopwatchHint})
              </span>
            </button>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
            <span>
              💡 Tips Presisi: Tombol Berhenti merespons kontak sentuhan pertama (0ms delay) atau tekan tombol{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-mono">
                Spasi
              </kbd>{' '}
              di keyboard.
            </span>
            <span className="font-mono text-cyan-300 font-semibold">
              Hadiah Menang: +{winVouchers} Voucher Level &amp; +{formatRupiah(winCash)}
            </span>
          </div>
        </div>
      </div>

      {/* DETAILED MATCH RESULT BREAKDOWN CARD */}
      {lastResult && (
        <div
          className={`p-5 rounded-3xl border-2 space-y-4 shadow-xl ${
            lastResult.outcome === 'win'
              ? 'bg-emerald-950/85 border-emerald-400 text-emerald-100'
              : lastResult.outcome === 'draw'
              ? 'bg-amber-950/80 border-amber-400 text-amber-100'
              : 'bg-rose-950/80 border-rose-500/80 text-rose-100'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 pb-3">
            <div className="flex items-center gap-2.5">
              {lastResult.outcome === 'win' ? (
                <Trophy className="w-6 h-6 text-amber-300 shrink-0" />
              ) : lastResult.outcome === 'draw' ? (
                <ShieldCheck className="w-6 h-6 text-amber-300 shrink-0" />
              ) : (
                <Zap className="w-6 h-6 text-rose-300 shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider block opacity-80">
                  HASIL PERTANDINGAN ADU STOPWATCH (
                  {lastResult.level === 'hard' ? 'LEVEL SUSAH' : 'LEVEL NORMAL'})
                </span>
                <h4 className="font-black text-base sm:text-lg text-white">
                  {lastResult.outcome === 'win'
                    ? `🏆 ANDA MENANG! (+${lastResult.rewardVoucher} Voucher Level & +${formatRupiah(
                        lastResult.rewardCash
                      )})`
                    : lastResult.outcome === 'draw'
                    ? '🤝 SERI PRESISI! (Saldo Dikembalikan Utuh 100%)'
                    : '💥 BOT LEVEL HARD MENANG! (Selisih Bot Lebih Dekat ke Target)'}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {lastResult.outcome === 'win' && (
                <>
                  <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-mono font-black text-xs flex items-center gap-1">
                    <Ticket className="w-3.5 h-3.5" />
                    <span>+{lastResult.rewardVoucher} Voucher Level</span>
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-400 text-slate-950 font-mono font-black text-xs flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5" />
                    <span>+{formatRupiah(lastResult.rewardCash)}</span>
                  </span>
                </>
              )}
              {lastResult.outcome === 'draw' && (
                <span className="px-3 py-1 rounded-xl bg-amber-400 text-slate-950 font-mono font-black text-xs">
                  Refund 100% ({formatRupiah(lastResult.entryCost)} Aman)
                </span>
              )}
            </div>
          </div>

          {/* 3-Column Comparison: Target vs Player vs Bot Hard */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10">
              <span className="text-[10px] font-mono uppercase text-amber-300 block">
                1. WAKTU TARGET SISTEM
              </span>
              <span className="font-mono font-black text-xl text-white block mt-1 tabular-nums">
                {lastResult.level === 'normal'
                  ? `${formatStopwatchParts(lastResult.targetCentis).secondsStr} dtk (${
                      formatStopwatchParts(lastResult.targetCentis).fullStr
                    })`
                  : `${formatStopwatchParts(lastResult.targetCentis).secondsStr},${
                      formatStopwatchParts(lastResult.targetCentis).tensStr
                    } dtk (${formatStopwatchParts(lastResult.targetCentis).fullStr})`}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/35 border border-cyan-400/30">
              <span className="text-[10px] font-mono uppercase text-cyan-300 block">
                2. CATATAN WAKTU ANDA
              </span>
              <span className="font-mono font-black text-xl text-white block mt-1 tabular-nums">
                {formatStopwatchParts(lastResult.playerCentis).fullStr} dtk
              </span>
              <span className="text-[11px] font-mono text-cyan-200 block mt-0.5">
                Selisih: {formatStopwatchParts(lastResult.playerDiffCentis).fullStr} dtk
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/35 border border-rose-400/30">
              <span className="text-[10px] font-mono uppercase text-rose-300 block">
                3. CATATAN BOT LEVEL HARD
              </span>
              <span className="font-mono font-black text-xl text-white block mt-1 tabular-nums">
                {formatStopwatchParts(lastResult.botCentis).fullStr} dtk
              </span>
              <span className="text-[11px] font-mono text-rose-200 block mt-0.5">
                Selisih: {formatStopwatchParts(lastResult.botDiffCentis).fullStr} dtk
              </span>
            </div>
          </div>

          <p className="text-xs sm:text-sm font-semibold leading-relaxed">{lastResult.message}</p>
        </div>
      )}

      {/* MEMOIZED RIWAYAT PERTANDINGAN ADU STOPWATCH */}
      <StopwatchHistorySection history={history} onClearHistory={clearHistory} />
    </div>
  );
});

StopwatchDuelArena.displayName = 'StopwatchDuelArena';
