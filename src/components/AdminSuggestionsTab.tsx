/**
 * Bank Nusantara — Panel Admin: Manajemen Saran & Program Hadiah Saran (v15.39.49)
 */
import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Gift,
  CheckCircle2,
  Trash2,
  Search,
  Save,
  Sparkles,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import { SuggestionStatus } from '../types/bank';
import { formatRupiah } from '../utils/bankUtils';
import {
  SUGGESTION_STATUSES,
  getSuggestionStatusMeta,
} from '../data/suggestionRewardCatalog';

export const AdminSuggestionsTab: React.FC<{ onShowToast?: (msg: string) => void }> = ({
  onShowToast,
}) => {
  const {
    suggestions,
    suggestionRewardConfig,
    adminUpdateSuggestion,
    adminDeleteSuggestion,
    adminClearSuggestions,
    adminUpdateSuggestionRewardConfig,
  } = useBank();

  const [statusFilter, setStatusFilter] = useState<'all' | SuggestionStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [statusDrafts, setStatusDrafts] = useState<Record<string, SuggestionStatus>>({});
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [localBanner, setLocalBanner] = useState<string>('');

  // Editable Reward Config Draft
  const [cfgDraft, setCfgDraft] = useState({
    enabled: suggestionRewardConfig.enabled,
    cashAmount: String(suggestionRewardConfig.cashAmount ?? 0),
    coinAmount: String(suggestionRewardConfig.coinAmount ?? 0),
    diamondAmount: String(suggestionRewardConfig.diamondAmount ?? 0),
    goldGrams: String(suggestionRewardConfig.goldGrams ?? 0),
    voucherAmount: String(suggestionRewardConfig.voucherAmount ?? 0),
    pointsAmount: String(suggestionRewardConfig.pointsAmount ?? 0),
    familySlotAmount: String(suggestionRewardConfig.familySlotAmount ?? 0),
    defaultRewardMessage: suggestionRewardConfig.defaultRewardMessage ?? '',
    autoRewardTriggerStatuses:
      suggestionRewardConfig.autoRewardTriggerStatuses || (['diterima', 'dirilis'] as SuggestionStatus[]),
  });

  useEffect(() => {
    setCfgDraft({
      enabled: suggestionRewardConfig.enabled,
      cashAmount: String(suggestionRewardConfig.cashAmount ?? 0),
      coinAmount: String(suggestionRewardConfig.coinAmount ?? 0),
      diamondAmount: String(suggestionRewardConfig.diamondAmount ?? 0),
      goldGrams: String(suggestionRewardConfig.goldGrams ?? 0),
      voucherAmount: String(suggestionRewardConfig.voucherAmount ?? 0),
      pointsAmount: String(suggestionRewardConfig.pointsAmount ?? 0),
      familySlotAmount: String(suggestionRewardConfig.familySlotAmount ?? 0),
      defaultRewardMessage: suggestionRewardConfig.defaultRewardMessage ?? '',
      autoRewardTriggerStatuses:
        suggestionRewardConfig.autoRewardTriggerStatuses || ['diterima', 'dirilis'],
    });
  }, [suggestionRewardConfig]);

  const notify = (msg: string) => {
    setLocalBanner(msg);
    onShowToast?.(msg);
    window.setTimeout(() => setLocalBanner((prev) => (prev === msg ? '' : prev)), 4500);
  };

  const handleSaveConfig = () => {
    const res = adminUpdateSuggestionRewardConfig({
      enabled: cfgDraft.enabled,
      cashAmount: Number(cfgDraft.cashAmount) || 0,
      coinAmount: Number(cfgDraft.coinAmount) || 0,
      diamondAmount: Number(cfgDraft.diamondAmount) || 0,
      goldGrams: Number(cfgDraft.goldGrams) || 0,
      voucherAmount: Number(cfgDraft.voucherAmount) || 0,
      pointsAmount: Number(cfgDraft.pointsAmount) || 0,
      familySlotAmount: Number(cfgDraft.familySlotAmount) || 0,
      defaultRewardMessage: cfgDraft.defaultRewardMessage,
      autoRewardTriggerStatuses: cfgDraft.autoRewardTriggerStatuses,
    });
    notify(res.message);
  };

  const toggleTriggerStatus = (st: SuggestionStatus) => {
    if (st === 'ditolak') return;
    setCfgDraft((prev) => ({
      ...prev,
      autoRewardTriggerStatuses: prev.autoRewardTriggerStatuses.includes(st)
        ? prev.autoRewardTriggerStatuses.filter((x) => x !== st)
        : [...prev.autoRewardTriggerStatuses, st],
    }));
  };

  const filteredSuggestions = suggestions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      s.title.toLowerCase().includes(q) ||
      s.explanation.toLowerCase().includes(q) ||
      s.reporterName.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  });

  const newCount = suggestions.filter((s) => s.status === 'baru').length;
  const acceptedCount = suggestions.filter((s) => s.status === 'diterima' || s.status === 'dirilis').length;
  const rewardedCount = suggestions.filter((s) => s.reward?.given).length;

  return (
    <div className="space-y-6 text-xs">
      {localBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 font-bold">
          {localBanner}
        </div>
      )}

      {/* 1. KONFIGURASI PROGRAM HADIAH SARAN (7 ASET FLEKSIBEL) */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-indigo-500/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white">
                Pengaturan Program Hadiah Saran Nasabah (7 Aset)
              </h3>
              <p className="text-[11px] text-slate-400">
                Atur sakelar aktif/nonaktif dan nominal 7 aset hadiah untuk saran yang diterima Admin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCfgDraft((p) => ({ ...p, enabled: !p.enabled }))}
            className={`px-4 py-2 rounded-xl font-extrabold text-xs border cursor-pointer transition ${
              cfgDraft.enabled
                ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {cfgDraft.enabled ? 'Program Hadiah: AKTIF' : 'Program Hadiah: NONAKTIF'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { key: 'cashAmount', label: 'Saldo (Rp)' },
            { key: 'coinAmount', label: 'Koin Spin' },
            { key: 'diamondAmount', label: 'Permata' },
            { key: 'goldGrams', label: 'Emas 24K (gr)' },
            { key: 'voucherAmount', label: 'Voucher Level' },
            { key: 'pointsAmount', label: 'Poin Rewards' },
            { key: 'familySlotAmount', label: 'Slot Keluarga' },
          ].map((f) => (
            <div key={f.key}>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">{f.label}</label>
              <input
                type="number"
                step={f.key === 'goldGrams' ? '0.05' : '1'}
                min="0"
                value={(cfgDraft as Record<string, unknown>)[f.key] as string}
                onChange={(e) => setCfgDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white font-mono text-xs"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1">
              Pesan Apresiasi Default saat Hadiah Cair
            </label>
            <input
              type="text"
              value={cfgDraft.defaultRewardMessage}
              onChange={(e) => setCfgDraft((p) => ({ ...p, defaultRewardMessage: e.target.value }))}
              maxLength={300}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 block mb-1.5">
              Pemicu Cair Hadiah Otomatis (Pilih Status):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTION_STATUSES.filter((st) => st.key !== 'ditolak').map((st) => {
                const active = cfgDraft.autoRewardTriggerStatuses.includes(st.key);
                return (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => toggleTriggerStatus(st.key)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border cursor-pointer transition ${
                      active
                        ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSaveConfig}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-2 cursor-pointer shadow"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Program Hadiah Saran</span>
          </button>
        </div>
      </div>

      {/* 2. DAFTAR SARAN & IDE FITUR MASUK */}
      <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-extrabold text-sm sm:text-base text-white flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-300" />
              <span>Daftar Saran &amp; Ide Nasabah ({suggestions.length})</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Baru: <strong className="text-sky-300">{newCount}</strong> • Diterima/Dirilis:{' '}
              <strong className="text-emerald-300">{acceptedCount}</strong> • Sudah Dapat Hadiah:{' '}
              <strong className="text-amber-300">{rewardedCount}</strong>
            </p>
          </div>

          {suggestions.length > 0 && (
            !confirmClearAll ? (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 font-bold cursor-pointer"
              >
                Bersihkan Semua Saran
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await adminClearSuggestions();
                    setConfirmClearAll(false);
                    notify('Seluruh daftar saran berhasil dibersihkan.');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
                >
                  Ya, Hapus Semua
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 font-semibold cursor-pointer"
                >
                  Batal
                </button>
              </div>
            )
          )}
        </div>

        {/* Filter & Search */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari judul, isi saran, kategori, atau nama nasabah..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | SuggestionStatus)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white text-xs"
          >
            <option value="all">Semua Status ({suggestions.length})</option>
            {SUGGESTION_STATUSES.map((st) => (
              <option key={st.key} value={st.key}>
                {st.label} ({suggestions.filter((s) => s.status === st.key).length})
              </option>
            ))}
          </select>
        </div>

        {/* List */}
        {filteredSuggestions.length === 0 ? (
          <div className="py-10 text-center text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-200">Belum ada saran nasabah pada filter ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSuggestions.map((s) => {
              const meta = getSuggestionStatusMeta(s.status);
              const draftStatus = statusDrafts[s.id] ?? s.status;
              const draftReply = replyDrafts[s.id] ?? s.adminReply ?? '';

              return (
                <div
                  key={s.id}
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-sm text-white">{s.title}</h4>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {s.category}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase">
                          {s.priority}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Pengirim: <strong className="text-slate-200">{s.reporterName}</strong>
                        {s.reporterAccountNumber ? ` (Rek ${s.reporterAccountNumber})` : ''} •{' '}
                        {new Date(s.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-extrabold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap bg-slate-900/70 p-3 rounded-xl border border-slate-800/80">
                    {s.explanation}
                  </p>

                  {s.photoDataUrl && (
                    <div>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoUrl(s.photoDataUrl || null)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Lihat Lampiran Foto / Mockup</span>
                      </button>
                    </div>
                  )}

                  {s.reward?.given && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-emerald-200 text-[11px] font-bold flex flex-wrap items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Hadiah Sudah Cair:</span>
                      {s.reward.cashAmount > 0 && <span>{formatRupiah(s.reward.cashAmount)}</span>}
                      {s.reward.coinAmount > 0 && <span>+{s.reward.coinAmount} Coin</span>}
                      {s.reward.diamondAmount > 0 && <span>+{s.reward.diamondAmount} Permata</span>}
                      {(s.reward.goldGrams || 0) > 0 && <span>+{s.reward.goldGrams}gr Emas</span>}
                    </div>
                  )}

                  {/* Admin Controls */}
                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-2.5 pt-1">
                    <select
                      value={draftStatus}
                      onChange={(e) =>
                        setStatusDrafts((p) => ({
                          ...p,
                          [s.id]: e.target.value as SuggestionStatus,
                        }))
                      }
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    >
                      {SUGGESTION_STATUSES.map((st) => (
                        <option key={st.key} value={st.key}>
                          {st.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="text"
                      value={draftReply}
                      onChange={(e) => setReplyDrafts((p) => ({ ...p, [s.id]: e.target.value }))}
                      placeholder="Tulis balasan resmi Admin untuk pengirim saran..."
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        const res = await adminUpdateSuggestion(s.id, draftStatus, draftReply);
                        notify(res.message);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold cursor-pointer"
                    >
                      Simpan Status &amp; Balasan
                    </button>

                    {!s.reward?.given && (
                      <button
                        type="button"
                        onClick={async () => {
                          const res = await adminUpdateSuggestion(s.id, 'diterima', draftReply, undefined, {
                            acceptAndDisburse: true,
                          });
                          notify(res.message);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer shadow"
                      >
                        <Gift className="w-3.5 h-3.5" />
                        <span>Terima &amp; Cairkan Hadiah</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={async () => {
                        await adminDeleteSuggestion(s.id);
                        notify('Saran dihapus.');
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Photo Lightbox */}
      {previewPhotoUrl && (
        <div
          className="fixed inset-0 z-[150] bg-black/85 flex items-center justify-center p-4"
          onClick={() => setPreviewPhotoUrl(null)}
        >
          <div className="relative max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute -top-3 -right-3 p-2 rounded-full bg-slate-900 border border-slate-700 text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={previewPhotoUrl}
              alt="Lampiran saran nasabah"
              className="w-full max-h-[82vh] object-contain rounded-2xl border border-slate-700 bg-slate-950"
            />
          </div>
        </div>
      )}
    </div>
  );
};
