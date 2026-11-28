import React, { useEffect, useRef, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Coins,
  Save,
  Sparkles,
  SlidersHorizontal,
  Banknote,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  JOB_FIVE_STAGE_CATALOG,
  JobFiveStageAdminConfig,
  JobStageId,
  loadJobFiveStageConfig,
  saveJobFiveStageConfig,
  subscribeJobFiveStageConfig,
} from '../utils/jobFiveStageUtils';

interface AdminJobCoinBonusCardProps {
  compact?: boolean;
}

export const AdminJobCoinBonusCard: React.FC<AdminJobCoinBonusCardProps> = ({
  compact = false,
}) => {
  const { jobCoinBonusConfig, adminUpdateJobCoinBonusConfig } = useBank();

  const isDirtyRef = useRef<boolean>(false);
  const [enabledDraft, setEnabledDraft] = useState<boolean>(jobCoinBonusConfig.enabled);
  const [coinMultText, setCoinMultText] = useState<string>(
    String(jobCoinBonusConfig.coinMultiplier ?? 1)
  );
  const [extraCoinsText, setExtraCoinsText] = useState<string>(
    String(jobCoinBonusConfig.extraBonusCoins ?? 0)
  );
  const [feedback, setFeedback] = useState<string>('');

  // Pengaturan Sistem 10 Tahap Kerja Interaktif & Skala Kesulitan Progresif
  const [stageConfig, setStageConfig] = useState<JobFiveStageAdminConfig>(() =>
    loadJobFiveStageConfig()
  );
  const [stageSalaryBonusPctText, setStageSalaryBonusPctText] = useState<string>(() =>
    String(loadJobFiveStageConfig().extraSalaryBonusPercent)
  );
  const [tierBonusPctText, setTierBonusPctText] = useState<string>(() =>
    String(loadJobFiveStageConfig().tierBonusPerLevelPercent)
  );
  const [stageExtraCoinText, setStageExtraCoinText] = useState<string>(() =>
    String(loadJobFiveStageConfig().extraCoinBonus)
  );
  const [stageExtraXpText, setStageExtraXpText] = useState<string>(() =>
    String(loadJobFiveStageConfig().extraAccountXpBonus)
  );
  const [stageFeedback, setStageFeedback] = useState<string>('');
  const stageDirtyRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isDirtyRef.current) {
      setEnabledDraft(jobCoinBonusConfig.enabled);
      setCoinMultText(String(jobCoinBonusConfig.coinMultiplier ?? 1));
      setExtraCoinsText(String(jobCoinBonusConfig.extraBonusCoins ?? 0));
    }
  }, [jobCoinBonusConfig]);

  useEffect(() => {
    return subscribeJobFiveStageConfig((latest) => {
      setStageConfig(latest);
      if (!stageDirtyRef.current) {
        setStageSalaryBonusPctText(String(latest.extraSalaryBonusPercent));
        setTierBonusPctText(String(latest.tierBonusPerLevelPercent));
        setStageExtraCoinText(String(latest.extraCoinBonus));
        setStageExtraXpText(String(latest.extraAccountXpBonus));
      }
    });
  }, []);

  const parsedMultiplier = (() => {
    const n = Number(coinMultText.trim());
    return Number.isFinite(n) && n >= 0 ? Math.max(0, n) : 0;
  })();

  const parsedExtraCoins = (() => {
    const n = Number(extraCoinsText.trim());
    return Number.isFinite(n) && n >= 0 ? Math.round(n) : 0;
  })();

  const previewCoin = (base: number) => {
    if (!enabledDraft) return base;
    return Math.max(0, Math.round(base * parsedMultiplier)) + parsedExtraCoins;
  };

  const handleSave = () => {
    const res = adminUpdateJobCoinBonusConfig({
      enabled: enabledDraft,
      coinMultiplier: Math.max(0, parsedMultiplier),
      extraBonusCoins: Math.max(0, parsedExtraCoins),
    });
    isDirtyRef.current = false;
    setFeedback(res.message);
  };

  const handleToggleStage = (stageId: JobStageId) => {
    const currentlyOn = stageConfig.enabledStages[stageId];
    const activeCount = Object.values(stageConfig.enabledStages).filter(Boolean).length;
    if (currentlyOn && activeCount <= 1) {
      setStageFeedback('Minimal 1 tahap kerja harus tetap aktif agar lowongan dapat diselesaikan.');
      return;
    }
    stageDirtyRef.current = true;
    setStageConfig((prev) => ({
      ...prev,
      enabledStages: {
        ...prev.enabledStages,
        [stageId]: !currentlyOn,
      },
    }));
  };

  const handleSaveFiveStageConfig = () => {
    const parsedSalaryPct = Math.max(0, Math.min(500, Math.round(Number(stageSalaryBonusPctText) || 0)));
    const parsedTierPct = Math.max(0, Math.min(50, Math.round(Number(tierBonusPctText) || 0)));
    const parsedStageCoins = Math.max(0, Math.min(100_000, Math.round(Number(stageExtraCoinText) || 0)));
    const parsedStageXp = Math.max(0, Math.min(100_000, Math.round(Number(stageExtraXpText) || 0)));

    const saved = saveJobFiveStageConfig({
      enabledStages: stageConfig.enabledStages,
      progressiveDifficultyEnabled: stageConfig.progressiveDifficultyEnabled,
      extraSalaryBonusPercent: parsedSalaryPct,
      tierBonusPerLevelPercent: parsedTierPct,
      extraCoinBonus: parsedStageCoins,
      extraAccountXpBonus: parsedStageXp,
    });
    stageDirtyRef.current = false;
    setStageConfig(saved);
    setStageSalaryBonusPctText(String(saved.extraSalaryBonusPercent));
    setTierBonusPctText(String(saved.tierBonusPerLevelPercent));
    setStageExtraCoinText(String(saved.extraCoinBonus));
    setStageExtraXpText(String(saved.extraAccountXpBonus));
    const activeCount = Object.values(saved.enabledStages).filter(Boolean).length;
    setStageFeedback(
      `Pengaturan 10 Tahap Kerja tersimpan (${activeCount}/10 Tahap Aktif · Skala Progresif ${
        saved.progressiveDifficultyEnabled ? 'Aktif' : 'Seragam'
      } · Bonus +${saved.extraSalaryBonusPercent}% Gaji, +${saved.tierBonusPerLevelPercent}%/Lv Tier, +${saved.extraCoinBonus} Coin, +${saved.extraAccountXpBonus} XP Akun)`
    );
  };

  const activeStageCount = Object.values(stageConfig.enabledStages).filter(Boolean).length;

  return (
    <div
      className={`bg-slate-900/95 border-2 border-amber-400/50 rounded-3xl ${
        compact ? 'p-4' : 'p-6'
      } space-y-5 shadow-xl`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="space-y-1">
          <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1">
            <Coins className="w-3 h-3 shrink-0" />
            <span>PENGATURAN BONUS COIN &amp; 10 TAHAP KERJA LOWONGAN</span>
          </span>
          <h3 className="font-black text-white text-sm sm:text-base flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Atur Pengali Coin, 10 Tahap Kerja Aktif, Skala Progresif, &amp; Bonus Ekstra</span>
          </h3>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Berlaku otomatis untuk seluruh 25 Lowongan Kerja setiap kali nasabah menuntaskan Workstation 10 Tahap. Perubahan aman dari reset saat mengetik.
          </p>
        </div>

        <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950 border border-amber-400/50 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={enabledDraft}
            onChange={(e) => {
              isDirtyRef.current = true;
              setEnabledDraft(e.target.checked);
            }}
          />
          <span className="font-black text-amber-300 text-xs whitespace-nowrap">
            {enabledDraft ? 'Bonus Coin Aktif' : 'Nonaktif (1x Normal)'}
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
              {parsedMultiplier}x Coin
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[1, 2, 3, 5, 10].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  isDirtyRef.current = true;
                  setCoinMultText(String(m));
                }}
                className={`py-1.5 rounded-lg font-mono font-bold text-[11px] cursor-pointer border whitespace-nowrap ${
                  parsedMultiplier === m
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
            min={0}
            step={0.5}
            value={coinMultText}
            onChange={(e) => {
              isDirtyRef.current = true;
              setCoinMultText(e.target.value);
            }}
            placeholder="Pengali custom (0 diperbolehkan)..."
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
              +{parsedExtraCoins.toLocaleString('id-ID')} Coin
            </span>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 25, 50, 100, 500].map((bonus) => (
              <button
                key={bonus}
                type="button"
                onClick={() => {
                  isDirtyRef.current = true;
                  setExtraCoinsText(String(bonus));
                }}
                className={`py-1.5 rounded-lg font-mono font-bold text-[11px] cursor-pointer border whitespace-nowrap ${
                  parsedExtraCoins === bonus
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
            value={extraCoinsText}
            onChange={(e) => {
              isDirtyRef.current = true;
              setExtraCoinsText(e.target.value);
            }}
            placeholder="Bonus coin ekstra (0 diperbolehkan)..."
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
            <Save className="w-4 h-4 shrink-0" />
            <span>Simpan Bonus Coin</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-2xl bg-emerald-950/75 border border-emerald-400/50 text-emerald-200 font-bold text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedback}</span>
          </span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          KONTROL SISTEM 10 TAHAP KERJA INTERAKTIF (AKTIF TAHAP, SKALA & BONUS)
         ===================================================================== */}
      <div className="pt-4 border-t border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-300">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>KONTROL SISTEM 10 TAHAP KERJA INTERAKTIF ({activeStageCount}/10 TAHAP AKTIF)</span>
            </span>
            <p className="text-[11px] text-slate-400">
              Aktifkan/nonaktifkan Tahap 1 sampai 10, atur Skala Kesulitan Progresif (Pemula 4 kabel → Menengah 5 kabel → Tinggi 6 kabel → Elit 7 kabel + Tahap 2–10), serta pengali bonus hadiah.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950 border border-cyan-500/40 cursor-pointer">
              <input
                type="checkbox"
                checked={stageConfig.progressiveDifficultyEnabled}
                onChange={(e) => {
                  stageDirtyRef.current = true;
                  setStageConfig((prev) => ({
                    ...prev,
                    progressiveDifficultyEnabled: e.target.checked,
                  }));
                }}
              />
              <span className="text-[11px] font-bold text-cyan-200 whitespace-nowrap">
                Skala Progresif: {stageConfig.progressiveDifficultyEnabled ? 'Aktif (4–7 Kabel)' : 'Seragam (4 Kabel)'}
              </span>
            </label>

            <button
              type="button"
              onClick={handleSaveFiveStageConfig}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0 shadow-lg shadow-cyan-500/20 whitespace-nowrap"
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>Simpan Aturan 10 Tahap</span>
            </button>
          </div>
        </div>

        {/* Toggle 10 Tahap */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {JOB_FIVE_STAGE_CATALOG.map((stage) => {
            const isOn = stageConfig.enabledStages[stage.id];
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleToggleStage(stage.id)}
                className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                  isOn
                    ? 'bg-emerald-950/50 border-emerald-400/70 text-white'
                    : 'bg-slate-950/80 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-mono font-black text-amber-300">
                    TAHAP {stage.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                      isOn ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isOn ? 'AKTIF' : 'OFF'}
                  </span>
                </div>
                <span className="text-xs font-black block truncate">{stage.shortLabel}</span>
              </button>
            );
          })}
        </div>

        {/* Bonus Ekstra Gaji (%), Bonus Tier/Level (%), Coin, & XP Level Akun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <Banknote className="w-3.5 h-3.5" />
              <span>Bonus Ekstra Gaji (%)</span>
            </label>
            <input
              type="number"
              min={0}
              max={500}
              value={stageSalaryBonusPctText}
              onChange={(e) => {
                stageDirtyRef.current = true;
                setStageSalaryBonusPctText(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 font-mono font-bold tabular-nums text-xs"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Bonus Tier / Level (%)</span>
            </label>
            <input
              type="number"
              min={0}
              max={50}
              value={tierBonusPctText}
              onChange={(e) => {
                stageDirtyRef.current = true;
                setTierBonusPctText(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-violet-300 font-mono font-bold tabular-nums text-xs"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" />
              <span>Bonus Ekstra Coin (10 Tahap)</span>
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              value={stageExtraCoinText}
              onChange={(e) => {
                stageDirtyRef.current = true;
                setStageExtraCoinText(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-mono font-bold tabular-nums text-xs"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2">
            <label className="text-[11px] font-bold text-cyan-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bonus Ekstra XP Level Akun</span>
            </label>
            <input
              type="number"
              min={0}
              max={100000}
              value={stageExtraXpText}
              onChange={(e) => {
                stageDirtyRef.current = true;
                setStageExtraXpText(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-bold tabular-nums text-xs"
            />
          </div>
        </div>

        {stageFeedback && (
          <div className="p-3 rounded-2xl bg-cyan-950/75 border border-cyan-400/50 text-cyan-200 font-bold text-xs flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{stageFeedback}</span>
            </span>
            <button
              type="button"
              onClick={() => setStageFeedback('')}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

