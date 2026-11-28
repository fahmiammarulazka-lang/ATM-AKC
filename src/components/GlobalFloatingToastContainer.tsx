import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Gem,
  Info,
  LayoutDashboard,
  Sparkles,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { AppFloatingToastItem } from '../types/bank';

interface GlobalFloatingToastContainerProps {
  onAction: (actionKind: NonNullable<AppFloatingToastItem['actionKind']>) => void;
}

const TOAST_STYLE_MAP: Record<
  AppFloatingToastItem['type'],
  {
    borderClass: string;
    iconBoxClass: string;
    barClass: string;
    titleClass: string;
    btnClass: string;
  }
> = {
  error: {
    borderClass: 'border-rose-500/45 bg-slate-950/95 shadow-rose-950/40',
    iconBoxClass: 'bg-rose-500/15 border-rose-500/35 text-rose-400',
    barClass: 'bg-gradient-to-r from-rose-500 via-red-400 to-rose-400',
    titleClass: 'text-rose-200',
    btnClass: 'bg-rose-500/20 hover:bg-rose-500/35 border-rose-400/40 text-rose-100',
  },
  warning: {
    borderClass: 'border-amber-500/45 bg-slate-950/95 shadow-amber-950/40',
    iconBoxClass: 'bg-amber-500/15 border-amber-500/35 text-amber-400',
    barClass: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400',
    titleClass: 'text-amber-200',
    btnClass: 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-400/40 text-amber-100',
  },
  success: {
    borderClass: 'border-emerald-500/45 bg-slate-950/95 shadow-emerald-950/40',
    iconBoxClass: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-400',
    barClass: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400',
    titleClass: 'text-emerald-200',
    btnClass: 'bg-emerald-500/20 hover:bg-emerald-500/35 border-emerald-400/40 text-emerald-100',
  },
  info: {
    borderClass: 'border-sky-500/45 bg-slate-950/95 shadow-sky-950/40',
    iconBoxClass: 'bg-sky-500/15 border-sky-500/35 text-sky-400',
    barClass: 'bg-gradient-to-r from-sky-400 via-cyan-400 to-indigo-400',
    titleClass: 'text-sky-200',
    btnClass: 'bg-sky-500/20 hover:bg-sky-500/35 border-sky-400/40 text-sky-100',
  },
};

const ToastCard: React.FC<{
  item: AppFloatingToastItem;
  onDismiss: (id: string) => void;
  onAction: (actionKind: NonNullable<AppFloatingToastItem['actionKind']>, id: string) => void;
}> = ({ item, onDismiss, onAction }) => {
  const durationMs = Math.max(1500, item.durationMs ?? 4000);
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = useRef<number>(durationMs);
  const startedAtRef = useRef<number>(Date.now());
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  useEffect(() => {
    if (isPaused) {
      return;
    }
    startedAtRef.current = Date.now();
    const timer = window.setTimeout(() => {
      onDismissRef.current(item.id);
    }, Math.max(50, remainingRef.current));

    return () => {
      window.clearTimeout(timer);
      const elapsed = Date.now() - startedAtRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    };
  }, [isPaused, item.id]);

  const theme = TOAST_STYLE_MAP[item.type] || TOAST_STYLE_MAP.info;

  const renderIcon = () => {
    switch (item.type) {
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const renderActionIcon = () => {
    switch (item.actionKind) {
      case 'open_coin_shop':
        return <Coins className="w-3.5 h-3.5" />;
      case 'open_diamond_shop':
        return <Gem className="w-3.5 h-3.5" />;
      case 'open_frame_spin':
        return <Sparkles className="w-3.5 h-3.5" />;
      default:
        return <LayoutDashboard className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
      className={`group pointer-events-auto relative rounded-2xl border backdrop-blur-xl shadow-2xl overflow-hidden bn-toast-enter ${theme.borderClass}`}
    >
      <div className="p-3.5 flex items-start gap-3">
        <div
          className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${theme.iconBoxClass}`}
        >
          {renderIcon()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={`text-xs font-extrabold tracking-wide leading-snug ${theme.titleClass}`}>
              {item.title}
            </h4>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Tutup pemberitahuan"
              className="w-7 h-7 -mt-1 -mr-1 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/80 transition cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-200/95 leading-relaxed mt-0.5 break-words">
            {item.message}
          </p>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            {item.actionLabel && item.actionKind ? (
              <button
                type="button"
                onClick={() => onAction(item.actionKind!, item.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition cursor-pointer ${theme.btnClass}`}
              >
                {renderActionIcon()}
                <span>{item.actionLabel}</span>
              </button>
            ) : (
              <span />
            )}

            <span className="text-[10px] font-mono text-slate-400 tabular-nums">
              {isPaused ? 'Dijeda' : 'Auto 4s'}
            </span>
          </div>
        </div>
      </div>

      {/* Countdown Progress Bar (4 detik) */}
      <div className="h-1 w-full bg-slate-900/90 overflow-hidden">
        <div
          className={`h-full origin-left bn-toast-progress ${theme.barClass}`}
          style={{
            animationDuration: `${durationMs}ms`,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        />
      </div>
    </div>
  );
};

export const GlobalFloatingToastContainer: React.FC<GlobalFloatingToastContainerProps> = ({
  onAction,
}) => {
  const { floatingToasts, dismissFloatingToast } = useBank();

  if (floatingToasts.length === 0) return null;

  return (
    <div
      aria-label="Pemberitahuan cepat"
      className="fixed top-4 right-4 z-[240] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-[390px] pointer-events-none"
    >
      {floatingToasts.slice(0, 3).map((item) => (
        <ToastCard
          key={item.id}
          item={item}
          onDismiss={dismissFloatingToast}
          onAction={(kind, id) => {
            dismissFloatingToast(id);
            onAction(kind);
          }}
        />
      ))}
    </div>
  );
};
