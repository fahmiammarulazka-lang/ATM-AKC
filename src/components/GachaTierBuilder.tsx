import React from 'react';
import { Dices, Plus, Trash2, Sparkles, Scale } from 'lucide-react';
import { GachaTierRange, GiftRewardCatalogMeta } from '../types/bank';
import { buildDefaultGachaTiersForReward, normalizeGachaTiers } from '../utils/gachaUtils';
import { formatRupiah } from '../utils/bankUtils';

interface GachaTierBuilderProps {
  tiers: GachaTierRange[];
  onChange: (nextTiers: GachaTierRange[]) => void;
  unitLabel?: string;
  isCurrency?: boolean;
  step?: number;
  metaForPreset?: Pick<GiftRewardCatalogMeta, 'defaultAmount' | 'step' | 'unitLabel'>;
  compact?: boolean;
}

export const GachaTierBuilder: React.FC<GachaTierBuilderProps> = ({
  tiers,
  onChange,
  unitLabel = 'Unit',
  isCurrency = false,
  step = 1,
  metaForPreset,
  compact = false,
}) => {
  const totalPercent = tiers.reduce((acc, t) => acc + Math.max(0, Number(t.probabilityPercent) || 0), 0);
  const isBalanced = Math.abs(totalPercent - 100) < 0.01;

  const updateTier = (id: string, patch: Partial<GachaTierRange>) => {
    onChange(
      tiers.map((t) => {
        if (t.id !== id) return t;
        const next = { ...t, ...patch };
        if (next.maxAmount < next.minAmount) {
          next.maxAmount = next.minAmount;
        }
        return next;
      })
    );
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    const baseMin = last ? last.maxAmount : Math.max(1, step);
    const baseMax = Math.max(baseMin + step, Math.round(baseMin * 2));
    onChange([
      ...tiers,
      {
        id: `tier-${Date.now()}-${Math.floor(Math.random() * 999)}`,
        label: `Tier #${tiers.length + 1}`,
        minAmount: baseMin,
        maxAmount: baseMax,
        probabilityPercent: 10,
      },
    ]);
  };

  const removeTier = (id: string) => {
    if (tiers.length <= 1) return;
    onChange(tiers.filter((t) => t.id !== id));
  };

  const handleAutoNormalize = () => {
    onChange(normalizeGachaTiers(tiers));
  };

  const applyPreset = (preset: 'balanced' | 'sultan' | 'extreme') => {
    const baseMeta = metaForPreset || {
      defaultAmount: isCurrency ? 1_000_000 : Math.max(10, step * 5),
      step: Math.max(1, step),
      unitLabel,
    };
    onChange(buildDefaultGachaTiersForReward(baseMeta, preset));
  };

  return (
    <div className="p-3 rounded-2xl bg-slate-950/90 border border-fuchsia-500/40 space-y-2.5">
      {/* Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-1.5">
          <Dices className="w-4 h-4 text-fuchsia-400 shrink-0" />
          <span className="font-black text-fuchsia-200 text-[11px]">
            Tier Peluang Min–Max (%)
          </span>
          <span
            className={`px-2 py-0.5 rounded-full font-mono font-black text-[10px] tabular-nums ${
              isBalanced
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
            }`}
          >
            Total: {totalPercent.toFixed(1).replace(/\.0$/, '')}%
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => applyPreset('balanced')}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-200 cursor-pointer whitespace-nowrap"
          >
            Seimbang
          </button>
          <button
            type="button"
            onClick={() => applyPreset('sultan')}
            className="px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-[10px] font-bold text-amber-300 cursor-pointer whitespace-nowrap"
          >
            Sultan
          </button>
          <button
            type="button"
            onClick={() => applyPreset('extreme')}
            className="px-2 py-1 rounded-lg bg-fuchsia-500/15 hover:bg-fuchsia-500/25 border border-fuchsia-400/40 text-[10px] font-bold text-fuchsia-300 cursor-pointer whitespace-nowrap"
          >
            Ekstrem 1%
          </button>
          {!isBalanced && (
            <button
              type="button"
              onClick={handleAutoNormalize}
              className="px-2 py-1 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-[10px] font-black cursor-pointer flex items-center gap-1 whitespace-nowrap"
            >
              <Scale className="w-3 h-3" />
              <span>Pas 100%</span>
            </button>
          )}
        </div>
      </div>

      {/* Tier List */}
      <div className="space-y-2">
        {tiers.map((tier, idx) => (
          <div
            key={tier.id}
            className={`p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 ${
              compact ? '' : 'sm:flex sm:items-center sm:gap-2 sm:space-y-0'
            }`}
          >
            <div className={compact ? 'grid grid-cols-12 gap-1.5 items-center' : 'flex-1 grid grid-cols-12 gap-2 items-center'}>
              <div className="col-span-12 sm:col-span-4">
                <label className="text-[9px] text-slate-400 block mb-0.5">
                  Nama Tier #{idx + 1}
                </label>
                <input
                  type="text"
                  value={tier.label}
                  onChange={(e) => updateTier(tier.id, { label: e.target.value })}
                  className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white font-bold text-[11px]"
                />
              </div>

              <div className="col-span-5 sm:col-span-3">
                <label className="text-[9px] text-slate-400 block mb-0.5">
                  Minimal ({isCurrency ? 'Rp' : unitLabel})
                </label>
                <input
                  type="number"
                  min={1}
                  step={step}
                  value={tier.minAmount}
                  onChange={(e) =>
                    updateTier(tier.id, { minAmount: Math.max(1, Number(e.target.value) || 1) })
                  }
                  className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-emerald-300 font-mono font-bold text-[11px] tabular-nums"
                />
              </div>

              <div className="col-span-5 sm:col-span-3">
                <label className="text-[9px] text-slate-400 block mb-0.5">
                  Maksimal ({isCurrency ? 'Rp' : unitLabel})
                </label>
                <input
                  type="number"
                  min={tier.minAmount}
                  step={step}
                  value={tier.maxAmount}
                  onChange={(e) =>
                    updateTier(tier.id, {
                      maxAmount: Math.max(tier.minAmount, Number(e.target.value) || tier.minAmount),
                    })
                  }
                  className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-amber-300 font-mono font-bold text-[11px] tabular-nums"
                />
              </div>

              <div className="col-span-2 sm:col-span-2">
                <label className="text-[9px] text-fuchsia-300 block mb-0.5">Peluang %</label>
                <input
                  type="number"
                  min={0.1}
                  max={100}
                  step={1}
                  value={tier.probabilityPercent}
                  onChange={(e) =>
                    updateTier(tier.id, {
                      probabilityPercent: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-fuchsia-500/50 text-fuchsia-300 font-mono font-black text-[11px] tabular-nums"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono text-slate-400 tabular-nums">
                {isCurrency
                  ? `${formatRupiah(tier.minAmount)} – ${formatRupiah(tier.maxAmount)}`
                  : `${tier.minAmount.toLocaleString('id-ID')} – ${tier.maxAmount.toLocaleString('id-ID')} ${unitLabel}`}
              </span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTier(tier.id)}
                  className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/30 text-rose-300 cursor-pointer shrink-0"
                  title="Hapus Tier"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Tier & Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <button
          type="button"
          onClick={addTier}
          className="px-3 py-1.5 rounded-xl bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-400/50 text-fuchsia-200 font-bold text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Tier Rentang</span>
        </button>

        <span className="text-[10px] text-slate-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{isBalanced ? 'Peluang pas 100% siap di-roll!' : 'Otomatis dinormalisasi ke 100% saat roll.'}</span>
        </span>
      </div>
    </div>
  );
};
