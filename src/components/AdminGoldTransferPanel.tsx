/**
 * Panel Admin — Pusat Kontrol Emas 24K Real-Time & Transfer Bebas 5%
 * Memungkinkan Admin mengatur harga dasar/per-gram, persentase kenaikan Tanggal 1 (+5%),
 * mode penalti jual hari sama (-1% bawaan vs -5% vs kustom), biaya admin Transfer Bebas (5%),
 * menjalankan tombol Simulasi Tanggal 1 instan (+1 / +3 / +6 bulan), serta menyuntik/edit saldo Emas & Coin nasabah.
 */
import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Coins,
  Crown,
  FastForward,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { formatRupiah } from '../utils/bankUtils';

export const AdminGoldTransferPanel: React.FC = () => {
  const {
    accounts,
    goldMarketConfig,
    adminUpdateGoldMarketConfig,
    adminSimulateGoldNextMonth,
    adminResetGoldMarketConfig,
    adminAdjustAccountGold,
    adminAdjustAccountSpinCoins,
  } = useBank();

  const [priceDraft, setPriceDraft] = useState<string>(
    String(goldMarketConfig.currentPricePerGram || 1_400_000)
  );
  const [growthDraft, setGrowthDraft] = useState<string>(
    String(goldMarketConfig.monthlyGrowthPercent ?? 5)
  );
  const [penaltyMode, setPenaltyMode] = useState<'1%' | '5%' | 'custom'>(
    goldMarketConfig.sameDayPenaltyMode || '1%'
  );
  const [customPenaltyDraft, setCustomPenaltyDraft] = useState<string>(
    String(goldMarketConfig.sameDayPenaltyPercent ?? 1)
  );
  const [transferFeeDraft, setTransferFeeDraft] = useState<string>(
    String(goldMarketConfig.transferBebasAdminFeePercent ?? 5)
  );
  const [minNominalDraft, setMinNominalDraft] = useState<string>(
    String(goldMarketConfig.minNominalRupiah ?? 1000)
  );

  // Per-account Gold & Coin injector
  const [targetAccId, setTargetAccId] = useState<string>(accounts[0]?.id || '');
  const [goldInjectValue, setGoldInjectValue] = useState<string>('20000000');
  const [goldInjectUnit, setGoldInjectUnit] = useState<'rupiah' | 'grams'>('rupiah');
  const [coinInjectValue, setCoinInjectValue] = useState<string>('500');

  const [feedback, setFeedback] = useState<string>('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPrice = Math.max(1000, Math.round(Number(priceDraft) || 1_400_000));
    const cleanGrowth = Math.max(0, Math.min(500, Number(growthDraft) || 0));
    const cleanCustomPenalty = Math.max(0, Math.min(99, Number(customPenaltyDraft) || 0));
    const cleanFee = Math.max(0, Math.min(50, Number(transferFeeDraft) || 0));
    const cleanMin = Math.max(1000, Math.round(Number(minNominalDraft) || 1000));

    const res = adminUpdateGoldMarketConfig({
      currentPricePerGram: cleanPrice,
      basePricePerGram: cleanPrice,
      monthlyGrowthPercent: cleanGrowth,
      sameDayPenaltyMode: penaltyMode,
      sameDayPenaltyPercent:
        penaltyMode === '1%' ? 1 : penaltyMode === '5%' ? 5 : cleanCustomPenalty,
      transferBebasAdminFeePercent: cleanFee,
      minNominalRupiah: cleanMin,
    });
    setFeedback(res.message);
  };

  const handleSimulateMonths = (months: number) => {
    const res = adminSimulateGoldNextMonth(months);
    setPriceDraft(String(res.newPricePerGram));
    setFeedback(res.message);
  };

  const handleReset = () => {
    const res = adminResetGoldMarketConfig();
    setPriceDraft('1400000');
    setGrowthDraft('5');
    setPenaltyMode('1%');
    setCustomPenaltyDraft('1');
    setTransferFeeDraft('5');
    setMinNominalDraft('1000');
    setFeedback(res.message);
  };

  const handleAdjustGold = (mode: 'add' | 'set') => {
    const val = Number(goldInjectValue) || 0;
    const res = adminAdjustAccountGold(targetAccId, val, goldInjectUnit, mode);
    setFeedback(res.message);
  };

  const handleAdjustCoins = (mode: 'add' | 'set') => {
    const val = Math.max(0, Math.round(Number(coinInjectValue) || 0));
    const res = adminAdjustAccountSpinCoins(targetAccId, val, mode);
    setFeedback(res.message);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header Card & Instant Tanggal 1 Simulator */}
      <div className="rounded-3xl bg-[#090B10] border border-amber-500/40 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
              <Crown className="w-4 h-4" />
              <span>PUSAT KONTROL ADMIN · EMAS 24K REAL-TIME &amp; TRANSFER BEBAS 5%</span>
            </div>
            <h2 className="text-xl font-black text-white">
              Atur Harga Emas, Persentase Tanggal 1 (+5%), Penalti Hari Sama (-1% / -5%) &amp; Simulasi Bulan Baru
            </h2>
            <p className="text-slate-400">
              Seluruh perubahan langsung berlaku real-time ke Tab Emas dan Mode Transfer Bebas seluruh nasabah.
            </p>
          </div>

          <div className="rounded-2xl bg-[#11151E] border border-slate-800 p-4 min-w-[240px] shrink-0 font-mono tabular-nums">
            <div className="text-[11px] text-slate-400">Harga Aktif Pasar Saat Ini</div>
            <div className="text-xl font-black text-amber-300 mt-0.5">
              {formatRupiah(goldMarketConfig.currentPricePerGram)}/gr
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              +{goldMarketConfig.monthlyGrowthPercent}% / Tgl 1 · Hari Sama -{goldMarketConfig.sameDayPenaltyPercent}%
            </div>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Instant Simulasi Tanggal 1 Buttons */}
        <div className="rounded-2xl bg-[#11151E] border border-amber-500/30 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="font-bold text-white text-sm flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-amber-400" />
              <span>Simulator Pergantian Bulan (Tanggal 1) Real-Time</span>
            </div>
            <p className="text-slate-400">
              Uji langsung kenaikan majemuk +{goldMarketConfig.monthlyGrowthPercent}% per bulan tanpa harus menunggu kalender asli berganti bulan.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleSimulateMonths(1)}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black flex items-center gap-1.5 cursor-pointer"
            >
              <FastForward className="w-3.5 h-3.5" />
              <span>Simulasi Tgl 1 (+1 Bulan)</span>
            </button>
            <button
              type="button"
              onClick={() => handleSimulateMonths(3)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 font-bold cursor-pointer"
            >
              +3 Bulan
            </button>
            <button
              type="button"
              onClick={() => handleSimulateMonths(6)}
              className="px-3.5 py-2.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 font-bold cursor-pointer"
            >
              +6 Bulan
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Config Form & Customer Asset Injector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Global Economic Parameter Form */}
        <form
          onSubmit={handleSaveConfig}
          className="lg:col-span-7 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4"
        >
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>Parameter Harga Emas &amp; Biaya Admin Transfer Bebas</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Harga Emas per Gram Saat Ini (Rp):
              </label>
              <input
                type="number"
                min={1000}
                value={priceDraft}
                onChange={(e) => setPriceDraft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-200 rounded-xl p-3 font-mono tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Kenaikan Otomatis Tanggal 1 (%/Bulan):
              </label>
              <input
                type="number"
                min={0}
                max={500}
                step="0.5"
                value={growthDraft}
                onChange={(e) => setGrowthDraft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-emerald-300 rounded-xl p-3 font-mono tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Mode Potongan Jual Hari Sama:
              </label>
              <select
                value={penaltyMode}
                onChange={(e) => {
                  const m = e.target.value as '1%' | '5%' | 'custom';
                  setPenaltyMode(m);
                  if (m === '1%') setCustomPenaltyDraft('1');
                  if (m === '5%') setCustomPenaltyDraft('5');
                }}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-semibold"
              >
                <option value="1%">Turun 1% (Bawaan Standar)</option>
                <option value="5%">Turun 5% (Mode Penurunan Pendapatan)</option>
                <option value="custom">Kustom Persentase Bebas</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Nilai Potongan Jual Hari Sama (%):
              </label>
              <input
                type="number"
                min={0}
                max={99}
                step="0.5"
                value={customPenaltyDraft}
                onChange={(e) => {
                  setPenaltyMode('custom');
                  setCustomPenaltyDraft(e.target.value);
                }}
                className="w-full bg-slate-950 border border-slate-700 text-rose-300 rounded-xl p-3 font-mono tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Biaya Admin Transfer Bebas (%):
              </label>
              <input
                type="number"
                min={0}
                max={50}
                step="0.5"
                value={transferFeeDraft}
                onChange={(e) => setTransferFeeDraft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 rounded-xl p-3 font-mono tabular-nums font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Nominal Minimal Transaksi (Rp):
              </label>
              <input
                type="number"
                min={1000}
                value={minNominalDraft}
                onChange={(e) => setMinNominalDraft(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3 font-mono tabular-nums font-bold"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black cursor-pointer"
          >
            Simpan &amp; Terapkan Pengaturan Emas + Transfer Bebas
          </button>
        </form>

        {/* Direct Gold & Coin Injector per Account */}
        <div className="lg:col-span-5 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Suntik / Edit Saldo Emas &amp; Coin Nasabah</span>
          </h3>

          <div>
            <label className="text-slate-300 font-semibold block mb-1">Pilih Rekening Nasabah:</label>
            <select
              value={targetAccId}
              onChange={(e) => setTargetAccId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3"
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.fullName} · {(acc.goldGrams || 0).toFixed(4)}g · {(acc.spinCoins || 0).toLocaleString('id-ID')} Coin
                </option>
              ))}
            </select>
          </div>

          {/* Gold Injection Box */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Saldo Emas 24K</span>
              </span>
              <select
                value={goldInjectUnit}
                onChange={(e) => setGoldInjectUnit(e.target.value as 'rupiah' | 'grams')}
                className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1 text-[11px]"
              >
                <option value="rupiah">Input Rupiah (Rp)</option>
                <option value="grams">Input Berat (Gram)</option>
              </select>
            </div>
            <input
              type="number"
              min={0}
              step={goldInjectUnit === 'grams' ? '0.01' : '1000'}
              value={goldInjectValue}
              onChange={(e) => setGoldInjectValue(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-amber-200 rounded-xl p-2.5 font-mono tabular-nums font-bold"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdjustGold('add')}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                + Tambah Emas
              </button>
              <button
                type="button"
                onClick={() => handleAdjustGold('set')}
                className="flex-1 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold cursor-pointer"
              >
                Set Saldo Emas
              </button>
            </div>
          </div>

          {/* Coin Injection Box */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-2.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Saldo Coin Spin</span>
            </div>
            <input
              type="number"
              min={0}
              value={coinInjectValue}
              onChange={(e) => setCoinInjectValue(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-amber-200 rounded-xl p-2.5 font-mono tabular-nums font-bold"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleAdjustCoins('add')}
                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer"
              >
                + Tambah Coin
              </button>
              <button
                type="button"
                onClick={() => handleAdjustCoins('set')}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
              >
                Set Saldo Coin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
