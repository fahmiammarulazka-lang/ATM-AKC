import React, { useState } from 'react';
import {
  Dices,
  Send,
  Sparkles,
  CheckCircle2,
  Briefcase,
  Users,
  Clock,
  Layers,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { GIFT_REWARD_CATALOG } from '../data/giftRewardsCatalog';
import { buildDefaultGachaTiersForReward } from '../utils/gachaUtils';
import {
  GachaTierRange,
  GiftRewardType,
  JobGachaBonusConfig,
} from '../types/bank';
import { GachaTierBuilder } from './GachaTierBuilder';
import { formatRupiah } from '../utils/bankUtils';

export const AdminUniversalGachaPanel: React.FC = () => {
  const {
    accounts,
    jobGachaBonusConfig,
    adminUpdateJobGachaBonusConfig,
    adminExecuteUniversalGachaDrop,
  } = useBank();

  const [selectedType, setSelectedType] = useState<GiftRewardType>('cash_balance');
  const [targetAccountId, setTargetAccountId] = useState<string>('__ALL__');
  const [deliveryMode, setDeliveryMode] = useState<'send_animated_box' | 'instant_roll_to_accounts'>(
    'send_animated_box'
  );
  const [title, setTitle] = useState<string>('🎲 Kotak Gacha Spesial Admin Nusantara');
  const [senderName, setSenderName] = useState<string>('Admin Gacha Bank Nusantara');
  const [letterMessage, setLetterMessage] = useState<string>(
    'Selamat! Admin mengirimkan Kotak Gacha berisi hadiah acak Min–Max dengan peluang transparan. Klik Putar Gacha sekarang untuk melihat berapa hadiah yang Anda dapatkan!'
  );
  const [trialAmount, setTrialAmount] = useState<number>(24);
  const [trialUnit, setTrialUnit] = useState<'minutes' | 'hours' | 'days'>('hours');

  const selectedMeta =
    GIFT_REWARD_CATALOG.find((m) => m.type === selectedType) || GIFT_REWARD_CATALOG[0];

  const [tiers, setTiers] = useState<GachaTierRange[]>(() =>
    buildDefaultGachaTiersForReward(selectedMeta, 'balanced')
  );

  const [feedback, setFeedback] = useState<string>('');
  const [dropLogs, setDropLogs] = useState<
    { accountName: string; accountNumber: string; tierLabel: string; amount: number; unitLabel: string }[]
  >([]);

  // Local editable state for Job Gacha Bonus Config
  const [jobGachaDraft, setJobGachaDraft] = useState<JobGachaBonusConfig>(() => jobGachaBonusConfig);
  const [jobGachaFeedback, setJobGachaFeedback] = useState<string>('');

  const handleRewardTypeChange = (nextType: GiftRewardType) => {
    setSelectedType(nextType);
    const meta = GIFT_REWARD_CATALOG.find((m) => m.type === nextType) || GIFT_REWARD_CATALOG[0];
    setTiers(buildDefaultGachaTiersForReward(meta, 'balanced'));
    setTitle(`🎲 Gacha ${meta.label} dari Admin`);
    if (meta.isTrial) {
      const mins = meta.defaultTrialMinutes || 1440;
      if (mins >= 1440 && mins % 1440 === 0) {
        setTrialAmount(mins / 1440);
        setTrialUnit('days');
      } else if (mins >= 60 && mins % 60 === 0) {
        setTrialAmount(mins / 60);
        setTrialUnit('hours');
      } else {
        setTrialAmount(mins);
        setTrialUnit('minutes');
      }
    }
  };

  const trialDurationMinutes =
    trialUnit === 'days'
      ? Math.max(1, trialAmount) * 1440
      : trialUnit === 'hours'
      ? Math.max(1, trialAmount) * 60
      : Math.max(1, trialAmount);

  const isCurrencyType =
    selectedType === 'cash_balance' ||
    selectedType === 'pulsa_balance' ||
    selectedType === 'special_deposito' ||
    selectedType === 'dream_pocket_fund';

  const handleExecuteUniversalDrop = () => {
    const res = adminExecuteUniversalGachaDrop({
      targetAccountId,
      rewardType: selectedType,
      title,
      senderName,
      letterMessage,
      deliveryMode,
      tiers,
      trialDurationMinutes: selectedMeta.isTrial ? trialDurationMinutes : undefined,
    });
    setFeedback(res.message);
    setDropLogs(res.logs || []);
  };

  const handleSaveJobGacha = () => {
    const res = adminUpdateJobGachaBonusConfig(jobGachaDraft);
    setJobGachaFeedback(res.message);
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Header */}
      <div className="bg-gradient-to-r from-fuchsia-950/90 via-slate-900 to-indigo-950/90 border-2 border-fuchsia-400/60 rounded-3xl p-6 shadow-2xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-fuchsia-400 text-slate-950 font-black text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5" />
              <span>🎲 SISTEM GACHA UNIVERSAL ADMIN (MIN–MAX + PERSEN PELUANG 100%)</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Kirim Gacha ke Semua Fitur (Hujan Saldo, Coin, Voucher, Level, Emas, Trial &amp; Pekerjaan)
            </h2>
            <p className="text-slate-300 max-w-3xl leading-relaxed">
              Atur beberapa Tier rentang <strong>Minimal – Maksimal</strong> beserta <strong>persentase peluang (%)</strong> hingga total 100%. Bisa dikirim sebagai <strong>Kotak Gacha Beranimasi ke layar nasabah</strong> (nasabah melihat info Min–Max &amp; % sebelum roll) atau <strong>eksekusi roll langsung</strong> ke rekening target!
            </p>
          </div>
        </div>

        {feedback && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/90 border border-emerald-400/60 text-emerald-200 font-bold flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
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
      </div>

      {/* Section 1: Universal Gacha Drop Sender */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Target, Type & Delivery Mode (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-4">
          <h3 className="font-black text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-fuchsia-400" />
            <span>1. Pilih Jenis Hadiah Gacha &amp; Mode Kirim</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Jenis Hadiah (30 Pilihan Tersedia Termasuk Trial)
              </label>
              <select
                value={selectedType}
                onChange={(e) => handleRewardTypeChange(e.target.value as GiftRewardType)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-fuchsia-400/50 text-white font-bold"
              >
                {GIFT_REWARD_CATALOG.map((meta) => (
                  <option key={meta.type} value={meta.type}>
                    {meta.emoji} {meta.label} ({meta.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick preset shortcut chips */}
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { type: 'cash_balance', text: '💵 Hujan Saldo Gacha' },
                  { type: 'spin_coins', text: '🪙 Hujan Coin Gacha' },
                  { type: 'level_voucher', text: '🎫 Voucher Level Gacha' },
                  { type: 'job_level_up', text: '💼 Level Kerja Gacha' },
                  { type: 'gold_grams', text: '🥇 Emas 24K Gacha' },
                  { type: 'trial_blue_checkmark', text: '☑️ Centang Biru Trial Gacha' },
                ] as { type: GiftRewardType; text: string }[]
              ).map((chip) => (
                <button
                  key={chip.type}
                  type="button"
                  onClick={() => handleRewardTypeChange(chip.type)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer border ${
                    selectedType === chip.type
                      ? 'bg-fuchsia-500 text-slate-950 border-fuchsia-300 font-black'
                      : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {chip.text}
                </button>
              ))}
            </div>

            {selectedMeta.isTrial && (
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-400/40 space-y-2">
                <label className="text-[11px] font-bold text-cyan-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Durasi Trial Otomatis Berakhir</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    value={trialAmount}
                    onChange={(e) => setTrialAmount(Math.max(1, Number(e.target.value) || 1))}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-cyan-300 font-mono font-bold tabular-nums"
                  />
                  <select
                    value={trialUnit}
                    onChange={(e) => setTrialUnit(e.target.value as 'minutes' | 'hours' | 'days')}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  >
                    <option value="minutes">Menit</option>
                    <option value="hours">Jam</option>
                    <option value="days">Hari</option>
                  </select>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Target Nasabah
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-300 font-bold"
                >
                  <option value="__ALL__">Semua Nasabah ({accounts.length})</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.fullName} ({acc.accountNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Cara Pengiriman Gacha
                </label>
                <select
                  value={deliveryMode}
                  onChange={(e) =>
                    setDeliveryMode(
                      e.target.value as 'send_animated_box' | 'instant_roll_to_accounts'
                    )
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-bold"
                >
                  <option value="send_animated_box">🎁 Kirim Kotak Gacha Beranimasi</option>
                  <option value="instant_roll_to_accounts">⚡ Roll Langsung ke Rekening</option>
                </select>
              </div>
            </div>

            {deliveryMode === 'send_animated_box' && (
              <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950/90 border border-slate-800">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Judul Kotak Gacha
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Nama Pengirim
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-amber-300 font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">
                    Pesan Surat Penyerta
                  </label>
                  <textarea
                    rows={2}
                    value={letterMessage}
                    onChange={(e) => setLetterMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleExecuteUniversalDrop}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-amber-400 to-yellow-400 hover:from-fuchsia-400 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm shadow-xl cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>
                {deliveryMode === 'send_animated_box'
                  ? 'Kirim Kotak Gacha Beranimasi Sekarang'
                  : 'Eksekusi Roll Gacha Langsung Sekarang'}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Multi-Tier Min-Max & % Builder + Logs (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-black text-white text-sm border-b border-slate-800 pb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>
                2. Atur Rentang Min–Max &amp; Persen Peluang ({selectedMeta.emoji} {selectedMeta.label})
              </span>
            </h3>

            <GachaTierBuilder
              tiers={tiers}
              onChange={setTiers}
              unitLabel={selectedMeta.unitLabel}
              isCurrency={isCurrencyType}
              step={selectedMeta.step}
              metaForPreset={selectedMeta}
            />
          </div>

          {dropLogs.length > 0 && (
            <div className="bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-5 space-y-3">
              <h4 className="font-black text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Hasil Roll Gacha Langsung Per Nasabah ({dropLogs.length} Akun)</span>
              </h4>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {dropLogs.map((log, i) => (
                  <div
                    key={`${log.accountNumber}-${i}`}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">
                        {log.accountName} ({log.accountNumber})
                      </span>
                      <span className="text-[10px] text-fuchsia-300">{log.tierLabel}</span>
                    </div>
                    <span className="font-mono font-black text-emerald-300 shrink-0 tabular-nums">
                      +
                      {isCurrencyType
                        ? formatRupiah(log.amount)
                        : `${log.amount.toLocaleString('id-ID')} ${log.unitLabel}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Section 2: Job Vacancy Gacha Bonus Configurator */}
      <div className="bg-slate-900/95 border-2 border-emerald-500/40 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[10px] uppercase inline-flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              <span>GACHA BONUS LOWONGAN PEKERJAAN</span>
            </span>
            <h3 className="font-black text-white text-base">
              Bonus Gacha Acak Otomatis Saat Nasabah Menyelesaikan Target Klik Kerja
            </h3>
            <p className="text-[11px] text-slate-400">
              Jika diaktifkan, setiap gajian pekerjaan akan otomatis melakukan roll Gacha sesuai rentang Min–Max dan persentase peluang di bawah ini.
            </p>
          </div>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-950 border border-emerald-400/50 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={jobGachaDraft.enabled}
              onChange={(e) =>
                setJobGachaDraft((prev) => ({ ...prev, enabled: e.target.checked }))
              }
            />
            <span className="font-black text-emerald-300">
              {jobGachaDraft.enabled ? 'Aktif di Semua Pekerjaan' : 'Nonaktif'}
            </span>
          </label>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-4 space-y-3">
            <label className="text-[11px] font-bold text-slate-300 block">
              Jenis Hadiah Bonus Gacha Kerja
            </label>
            <select
              value={jobGachaDraft.rewardType}
              onChange={(e) =>
                setJobGachaDraft((prev) => ({
                  ...prev,
                  rewardType: e.target.value as JobGachaBonusConfig['rewardType'],
                }))
              }
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
            >
              <option value="cash_balance">💵 Bonus Uang Tunai (Rp)</option>
              <option value="spin_coins">🪙 Bonus Coin Spin</option>
              <option value="level_voucher">🎫 Bonus Voucher Level</option>
              <option value="reward_points">⭐ Bonus Poin Reward</option>
            </select>

            <button
              type="button"
              onClick={handleSaveJobGacha}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Pengaturan Gacha Pekerjaan</span>
            </button>

            {jobGachaFeedback && (
              <div className="p-2.5 rounded-xl bg-emerald-950/70 border border-emerald-400/50 text-emerald-200 font-bold text-[11px]">
                {jobGachaFeedback}
              </div>
            )}
          </div>

          <div className="lg:col-span-8">
            <GachaTierBuilder
              tiers={jobGachaDraft.tiers}
              onChange={(nextTiers) =>
                setJobGachaDraft((prev) => ({ ...prev, tiers: nextTiers }))
              }
              unitLabel={
                jobGachaDraft.rewardType === 'cash_balance'
                  ? 'Rp'
                  : jobGachaDraft.rewardType === 'spin_coins'
                  ? 'Coin'
                  : jobGachaDraft.rewardType === 'level_voucher'
                  ? 'Voucher'
                  : 'Poin'
              }
              isCurrency={jobGachaDraft.rewardType === 'cash_balance'}
              step={jobGachaDraft.rewardType === 'cash_balance' ? 5000 : 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
