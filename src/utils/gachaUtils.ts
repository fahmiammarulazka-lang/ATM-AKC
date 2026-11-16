import { GachaTierRange, GiftRewardCatalogMeta } from '../types/bank';

export const normalizeGachaTiers = (tiers: GachaTierRange[]): GachaTierRange[] => {
  if (!tiers || tiers.length === 0) return [];
  const positive = tiers.map((t) => ({
    ...t,
    minAmount: Math.max(1, Math.min(t.minAmount, t.maxAmount)),
    maxAmount: Math.max(1, Math.max(t.minAmount, t.maxAmount)),
    probabilityPercent: Math.max(0, Number(t.probabilityPercent) || 0),
  }));
  const sum = positive.reduce((acc, t) => acc + t.probabilityPercent, 0);
  if (sum <= 0) {
    const even = Number((100 / positive.length).toFixed(2));
    return positive.map((t, idx) => ({
      ...t,
      probabilityPercent:
        idx === positive.length - 1 ? Number((100 - even * (positive.length - 1)).toFixed(2)) : even,
    }));
  }
  let running = 0;
  return positive.map((t, idx) => {
    if (idx === positive.length - 1) {
      return {
        ...t,
        probabilityPercent: Number(Math.max(0, 100 - running).toFixed(2)),
      };
    }
    const scaled = Number(((t.probabilityPercent / sum) * 100).toFixed(2));
    running += scaled;
    return { ...t, probabilityPercent: scaled };
  });
};

export const rollGachaOutcome = (
  tiers: GachaTierRange[],
  step = 1
): {
  tierLabel: string;
  probabilityPercent: number;
  minAmount: number;
  maxAmount: number;
  rolledAmount: number;
} => {
  const normalized = normalizeGachaTiers(tiers);
  if (normalized.length === 0) {
    return {
      tierLabel: 'Pasti',
      probabilityPercent: 100,
      minAmount: 1,
      maxAmount: 1,
      rolledAmount: 1,
    };
  }

  const r = Math.random() * 100;
  let cumulative = 0;
  let chosen = normalized[normalized.length - 1];
  for (const tier of normalized) {
    cumulative += tier.probabilityPercent;
    if (r <= cumulative) {
      chosen = tier;
      break;
    }
  }

  const safeStep = Math.max(1, step);
  const lo = Math.min(chosen.minAmount, chosen.maxAmount);
  const hi = Math.max(chosen.minAmount, chosen.maxAmount);
  const raw = lo + Math.random() * (hi - lo);
  const snapped =
    safeStep > 1 && hi - lo >= safeStep
      ? Math.min(hi, Math.max(lo, Math.round(raw / safeStep) * safeStep))
      : Math.round(raw);

  return {
    tierLabel: chosen.label,
    probabilityPercent: chosen.probabilityPercent,
    minAmount: lo,
    maxAmount: hi,
    rolledAmount: snapped,
  };
};

export const buildDefaultGachaTiersForReward = (
  meta: Pick<GiftRewardCatalogMeta, 'defaultAmount' | 'step'>,
  preset: 'balanced' | 'sultan' | 'extreme' = 'balanced'
): GachaTierRange[] => {
  const base = Math.max(1, meta.defaultAmount);
  const s = Math.max(1, meta.step);
  const snap = (v: number) => (s > 1 ? Math.max(s, Math.round(v / s) * s) : Math.max(1, Math.round(v)));

  if (preset === 'sultan') {
    return [
      {
        id: `tier-1-${Date.now()}`,
        label: 'Standar',
        minAmount: snap(base * 0.5),
        maxAmount: snap(base * 1.5),
        probabilityPercent: 50,
      },
      {
        id: `tier-2-${Date.now() + 1}`,
        label: 'Sultan',
        minAmount: snap(base * 2),
        maxAmount: snap(base * 5),
        probabilityPercent: 35,
      },
      {
        id: `tier-3-${Date.now() + 2}`,
        label: 'Jackpot Mega',
        minAmount: snap(base * 6),
        maxAmount: snap(base * 15),
        probabilityPercent: 15,
      },
    ];
  }

  if (preset === 'extreme') {
    return [
      {
        id: `tier-1-${Date.now()}`,
        label: 'Biasa',
        minAmount: snap(base * 0.25),
        maxAmount: snap(base * 0.8),
        probabilityPercent: 80,
      },
      {
        id: `tier-2-${Date.now() + 1}`,
        label: 'Langka',
        minAmount: snap(base * 1.5),
        maxAmount: snap(base * 4),
        probabilityPercent: 19,
      },
      {
        id: `tier-3-${Date.now() + 2}`,
        label: 'Jackpot 1% Mitos',
        minAmount: snap(base * 10),
        maxAmount: snap(base * 25),
        probabilityPercent: 1,
      },
    ];
  }

  return [
    {
      id: `tier-1-${Date.now()}`,
      label: 'Biasa',
      minAmount: snap(base * 0.4),
      maxAmount: snap(base),
      probabilityPercent: 65,
    },
    {
      id: `tier-2-${Date.now() + 1}`,
      label: 'Langka',
      minAmount: snap(base * 1.2),
      maxAmount: snap(base * 2.5),
      probabilityPercent: 25,
    },
    {
      id: `tier-3-${Date.now() + 2}`,
      label: 'Jackpot',
      minAmount: snap(base * 3),
      maxAmount: snap(base * 6),
      probabilityPercent: 10,
    },
  ];
};
