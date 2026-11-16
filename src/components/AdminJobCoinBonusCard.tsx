import React, { useEffect, useState } from 'react';
import { Briefcase, CheckCircle2, Coins, Sparkles } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { JobCoinBonusConfig } from '../types/bank';

interface AdminJobCoinBonusCardProps {
  compact?: boolean;
}

export const AdminJobCoinBonusCard: React.FC<AdminJobCoinBonusCardProps> = ({
  compact = false,
}) => {
  const { jobCoinBonusConfig, adminUpdateJobCoinBonusConfig } = useBank();

  const [draft, setDraft] = useState<JobCoinBonusConfig>(() => jobCoinBonusConfig);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    setDraft(jobCoinBonusConfig);
  }, [jobCoinBonusConfig]);

  const previewCoin = (base: number) => {
    if (!draft.enabled) return base;
    const mult = Math.max(0.1, Number(draft.coinMultiplier) || 1);
    const extra = Math.max(0, Math.round(Number(draft.extraBonusCoins) || 0));
    return Math.max(1, Math.round(base * mult)) + extra;
  };

  const handleSave = () => {
    const res = adminUpdateJobCoinBonusConfig(draft);
    setFeedback(res.message);
  };

  return (
    <div
      className={`bg-slate-900/95 border-2 border-amber-400/50 rounded-3xl ${
        compact ? 'p-4' : 'p-6'
      } space-y-4 shadow-xl`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1">
            <Coins className="w-3 h-3 shrink-0" />
            <span>PENGATURAN BONUS COIN LOWONGAN PEKERJAAN</span>
          </span>
          <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Atur Pengali Coin &amp; Bonus Coin Ekstra Saat Nasabah Bekerja</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Berlaku otomatis untuk seluruh 25 Lowongan Kerja setiap kali target klik selesai. (Bonus Gacha Pekerjaan sudah dihapus.)
          </p>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-400/50 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
            }
          />
          <span className="font-black text-amber-300 text-xs whitespace-nowrap">
            {draft.enabled ? 'Bonus Coin Aktif' : 'Nonaktif (1x Normal)'}
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Pengali Coin Kerja */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-amber-300">
              1. Pengali Coin Kerja (Multiplier)
            </label>
            <span className="font-mono font-black text-white text-xs tabular-nums">
              {draft.coinMultiplier}x Coin
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 5, 10].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, coinMultiplier: m }))}
                className={`py-1.5 rounded-lg font-mono font-bold text-[11px] cursor-pointer border whitespace-nowrap ${
                  draft.coinMultiplier === m
                    ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-amber-400/50'
                }`}
              >
                {m}x
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0.1}
            step={0.5}
            value={draft.coinMultiplier}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                coinMultiplier: Math.max(0.1, Number(e.target.value) || 1),
              }))
            }
            placeholder="Pengali custom..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold tabular-nums text-xs"
          />
        </div>

        {/* Bonus Coin Ekstra Tetap */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-emerald-300">
              2. Bonus Coin Ekstra (Per Selesai Kerja)
            </label>
            <span className="font-mono font-black text-emerald-300 text-xs tabular-nums">
              +{draft.extraBonusCoins.toLocaleString('id-ID')} Coin
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 25, 50, 100, 500].map((bonus) => (
              <button
                key={bonus}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, extraBonusCoins: bonus }))}
                className={`py-1.5 rounded-lg font-mono font-bold text-[11px] cursor-pointer border whitespace-nowrap ${
                  draft.extraBonusCoins === bonus
                    ? 'bg-emerald-400 text-slate-950 border-emerald-300 font-black'
                    : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-emerald-400/50'
                }`}
              >
                +{bonus}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={0}
            step={5}
            value={draft.extraBonusCoins}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                extraBonusCoins: Math.max(0, Math.round(Number(e.target.value) || 0)),
              }))
            }
            placeholder="Bonus coin ekstra..."
            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold tabular-nums text-xs"
          />
        </div>

        {/* Pratinjau & Simpan */}
        <div className="lg:col-span-2 flex flex-col justify-between gap-2.5 h-full">
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1 text-[11px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Pratinjau Hasil:</span>
            </span>
            <div className="flex items-center justify-between font-mono tabular-nums">
              <span className="text-slate-400">Base 2:</span>
              <strong className="text-amber-300">{previewCoin(2).toLocaleString('id-ID')} Coin</strong>
            </div>
            <div className="flex items-center justify-between font-mono tabular-nums">
              <span className="text-slate-400">Base 250:</span>
              <strong className="text-emerald-300">{previewCoin(250).toLocaleString('id-ID')} Coin</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shadow-lg shadow-amber-500/20"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Simpan Bonus Coin</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-950/75 border border-emerald-400/50 text-emerald-200 font-bold text-xs flex items-center justify-between gap-2">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
