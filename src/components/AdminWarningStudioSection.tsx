import React, { useMemo, useState } from 'react';
import {
  Send,
  RefreshCw,
  Trash2,
  Edit3,
  Power,
  Search,
  Check,
  Sparkles,
  Users,
  Eye,
  BellRing,
  Maximize2,
  PanelTop,
  X,
  Lock,
} from 'lucide-react';
import { useBank } from '../context/BankContext';
import {
  AdminSystemWarning,
  AdminWarningCategory,
  AdminWarningColorTheme,
  AdminWarningDisplayMode,
  AdminWarningIconKey,
  AdminWarningTargetMode,
  CardTier,
} from '../types/bank';
import {
  ADMIN_WARNING_CATEGORIES,
  ADMIN_WARNING_ICON_OPTIONS,
  ADMIN_WARNING_PRESETS_25,
  ADMIN_WARNING_THEME_OPTIONS,
  getAdminWarningThemeMeta,
} from '../data/adminWarningPresets';
import { renderAdminWarningIcon } from './AdminWarningOverlay';

const CARD_TIERS_LIST: { tier: CardTier; label: string }[] = [
  { tier: 'regular', label: 'Reguler' },
  { tier: 'gold', label: 'Gold' },
  { tier: 'premium', label: 'Platinum' },
  { tier: 'platinum', label: 'Infinite Metal' },
  { tier: 'admin', label: 'Admin' },
];

export const AdminWarningStudioSection: React.FC = () => {
  const {
    accounts,
    adminWarnings,
    adminSaveWarning,
    adminToggleWarningActive,
    adminResendWarning,
    adminDeleteWarning,
  } = useBank();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [iconKey, setIconKey] = useState<AdminWarningIconKey>('wrench');
  const [colorTheme, setColorTheme] = useState<AdminWarningColorTheme>('amber');
  const [displayMode, setDisplayMode] = useState<AdminWarningDisplayMode>('popup');
  const [isPermanent, setIsPermanent] = useState(false);
  const [showPermanentLabel, setShowPermanentLabel] = useState(true);
  const [dismissible, setDismissible] = useState(true);
  const [targetMode, setTargetMode] = useState<AdminWarningTargetMode>('all');
  const [targetTiers, setTargetTiers] = useState<CardTier[]>([
    'regular',
    'gold',
    'premium',
    'platinum',
  ]);
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>([]);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<
    'all' | AdminWarningCategory
  >('all');
  const [accountSearch, setAccountSearch] = useState('');
  const [feedback, setFeedback] = useState<string>('');

  const filteredPresets = useMemo(() => {
    if (presetCategoryFilter === 'all') return ADMIN_WARNING_PRESETS_25;
    return ADMIN_WARNING_PRESETS_25.filter((p) => p.category === presetCategoryFilter);
  }, [presetCategoryFilter]);

  const filteredAccounts = useMemo(() => {
    const q = accountSearch.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q) ||
        (a.userId16 || '').toLowerCase().includes(q)
    );
  }, [accounts, accountSearch]);

  const applyPreset = (presetId: string) => {
    const preset = ADMIN_WARNING_PRESETS_25.find((p) => p.id === presetId);
    if (!preset) return;
    setEditingId(null);
    setTitle(preset.title);
    setMessage(preset.message);
    setIconKey(preset.iconKey);
    setColorTheme(preset.colorTheme);
    setDisplayMode(preset.suggestedDisplayMode);
    setIsPermanent(preset.suggestedPermanent);
    setShowPermanentLabel(preset.suggestedShowPermanentLabel);
    setDismissible(preset.suggestedDismissible);
    setFeedback(
      `Preset "${preset.title}" dimuat (${
        preset.suggestedDisplayMode === 'popup' ? 'Pop-up Tengah' : 'Banner Atas'
      }). Silakan ubah mode/teks atau langsung kirim.`
    );
  };

  const loadForEdit = (w: AdminSystemWarning) => {
    setEditingId(w.id);
    setTitle(w.title);
    setMessage(w.message);
    setIconKey(w.iconKey);
    setColorTheme(w.colorTheme);
    setDisplayMode(w.displayMode);
    setIsPermanent(w.isPermanent);
    setShowPermanentLabel(w.showPermanentLabel);
    setDismissible(w.dismissible);
    setTargetMode(w.targetMode);
    setTargetTiers(w.targetTiers || []);
    setTargetAccountIds(w.targetAccountIds || []);
    setFeedback(`Mengedit peringatan "${w.title}".`);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setIconKey('wrench');
    setColorTheme('amber');
    setDisplayMode('popup');
    setIsPermanent(false);
    setShowPermanentLabel(true);
    setDismissible(true);
    setTargetMode('all');
    setTargetAccountIds([]);
  };

  const handleToggleTier = (tier: CardTier) => {
    setTargetTiers((prev) =>
      prev.includes(tier) ? prev.filter((t) => t !== tier) : [...prev, tier]
    );
  };

  const handleToggleAccount = (accId: string) => {
    setTargetAccountIds((prev) =>
      prev.includes(accId) ? prev.filter((id) => id !== accId) : [...prev, accId]
    );
  };

  const handleQuickSwitchDisplayMode = (w: AdminSystemWarning) => {
    const nextMode: AdminWarningDisplayMode =
      w.displayMode === 'popup' ? 'banner' : 'popup';
    const res = adminSaveWarning({
      id: w.id,
      title: w.title,
      message: w.message,
      iconKey: w.iconKey,
      colorTheme: w.colorTheme,
      displayMode: nextMode,
      isPermanent: w.isPermanent,
      showPermanentLabel: w.showPermanentLabel,
      dismissible: w.dismissible,
      targetMode: w.targetMode,
      targetTiers: w.targetTiers || [],
      targetAccountIds: w.targetAccountIds || [],
      isActive: w.isActive,
    });
    if (res.success) {
      setFeedback(
        `Mode tampilan "${w.title}" berhasil diubah menjadi ${
          nextMode === 'popup' ? 'Pop-up Tengah Layar' : 'Banner Atas Layar'
        }!`
      );
    } else {
      setFeedback(res.message);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetMode === 'tiers' && targetTiers.length === 0) {
      setFeedback('Pilih minimal 1 tier kartu tujuan.');
      return;
    }
    if (targetMode === 'accounts' && targetAccountIds.length === 0) {
      setFeedback('Centang minimal 1 akun nasabah tujuan.');
      return;
    }
    const res = adminSaveWarning({
      id: editingId || undefined,
      title,
      message,
      iconKey,
      colorTheme,
      displayMode,
      isPermanent,
      showPermanentLabel,
      dismissible,
      targetMode,
      targetTiers,
      targetAccountIds,
      isActive: true,
    });
    setFeedback(res.message);
    if (res.success) {
      resetForm();
    }
  };

  const previewTheme = getAdminWarningThemeMeta(colorTheme);
  const activeCount = adminWarnings.filter((w) => w.isActive).length;
  const activePopupCount = adminWarnings.filter(
    (w) => w.isActive && w.displayMode === 'popup'
  ).length;
  const activeBannerCount = adminWarnings.filter(
    (w) => w.isActive && w.displayMode === 'banner'
  ).length;

  return (
    <div className="bg-slate-900/95 rounded-3xl border-2 border-amber-400/50 p-5 sm:p-6 space-y-6 shadow-2xl text-white">
      {/* Header Studio Peringatan */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-wider">
              🚨 STUDIO PERINGATAN &amp; PEMBERITAHUAN RESMI
            </span>
            <span className="text-[11px] font-mono text-amber-300 font-bold">
              Pop-up Tengah • Banner Atas • Tanda Silang (X) Khusus Tier ADMIN
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Studio Peringatan &amp; Pemberitahuan Nasabah (25 Preset + Manual)</span>
          </h3>
          <p className="text-xs text-slate-300">
            Kirim peringatan real-time sebagai <strong className="text-amber-300">Pop-up Tengah Layar</strong> (modal fokus di tengah layar) atau <strong className="text-cyan-300">Banner Atas Layar</strong> (sticky di paling atas layar). Pemegang <strong>Kartu Tier ADMIN &amp; Akun OA Admin</strong> selalu memiliki tanda silang (<code className="text-amber-300">X</code>) penutup meski status Permanen.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 block text-[10px]">Total Peringatan Aktif</span>
            <span className="font-black text-amber-300 text-sm">
              {activeCount} / {adminWarnings.length}
            </span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
            <span className="text-slate-400 block text-[10px]">Pop-up Tengah / Banner Atas</span>
            <span className="font-black text-cyan-300 text-sm">
              {activePopupCount} Pop-up · {activeBannerCount} Banner
            </span>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/50 text-emerald-200 px-4 py-3 text-xs font-bold flex items-center justify-between gap-2">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback('')}
            className="text-emerald-300 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 25 Preset Sistem */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>25 Preset Buatan Sistem (Klik untuk Isi Form Otomatis)</span>
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ADMIN_WARNING_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setPresetCategoryFilter(cat.key)}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-colors cursor-pointer ${
                  presetCategoryFilter === cat.key
                    ? 'bg-amber-400 text-slate-950 shadow'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
          {filteredPresets.map((preset) => {
            const pTheme = getAdminWarningThemeMeta(preset.colorTheme);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="text-left rounded-xl border border-slate-800 hover:border-amber-400/70 bg-slate-950/90 hover:bg-slate-950 p-3 transition-all flex items-start gap-2.5 cursor-pointer group"
              >
                <div className={`p-1.5 rounded-lg border shrink-0 ${pTheme.iconBgClass}`}>
                  {renderAdminWarningIcon(preset.iconKey, 'w-4 h-4')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <p className="text-xs font-black text-white group-hover:text-amber-300 truncate">
                      {preset.title}
                    </p>
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-[9px] font-mono text-cyan-300 shrink-0">
                      {preset.suggestedDisplayMode === 'popup' ? 'Pop-up' : 'Banner'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">
                    {preset.message}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Manual + Editor */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-amber-300 uppercase tracking-wider">
            {editingId ? '✏️ Edit Peringatan Terpilih' : '🚀 Buat / Kirim Peringatan Baru'}
          </h4>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-bold text-rose-300 hover:text-rose-200 underline cursor-pointer"
            >
              Batal Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Judul / Nama Peringatan *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Aplikasi Sedang Dalam Perbaikan"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Isi Pesan Peringatan *
              </label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tulis penjelasan lengkap peringatan yang akan tampil di layar nasabah..."
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Pilihan 16 Ikon, 6 Warna, & Mode Tampilan */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Pilih Ikon (16 Pilihan Vektor)
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {ADMIN_WARNING_ICON_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    title={opt.label}
                    onClick={() => setIconKey(opt.key)}
                    className={`p-2 rounded-xl border flex items-center justify-center transition-colors cursor-pointer ${
                      iconKey === opt.key
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 shadow'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {renderAdminWarningIcon(opt.key, 'w-4 h-4')}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Tema Warna Peringatan
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {ADMIN_WARNING_THEME_OPTIONS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setColorTheme(t.key)}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-black border transition-all cursor-pointer ${
                      colorTheme === t.key
                        ? `${t.swatchClass} text-white border-white ring-2 ring-amber-400/60`
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-amber-300 mb-1.5">
                Mode Tampilan di Layar Nasabah (Pop-up Tengah vs Banner Atas)
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDisplayMode('popup')}
                  className={`p-2.5 rounded-xl text-xs font-black border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                    displayMode === 'popup'
                      ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 border-amber-300 shadow-lg'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" />
                    <span>Pop-up Tengah Layar</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      displayMode === 'popup' ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    Tampil modal fokus tepat di tengah layar
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDisplayMode('banner')}
                  className={`p-2.5 rounded-xl text-xs font-black border flex flex-col items-start gap-1 cursor-pointer transition-all ${
                    displayMode === 'banner'
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 border-cyan-300 shadow-lg'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <PanelTop className="w-4 h-4" />
                    <span>Banner Atas Layar</span>
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      displayMode === 'banner' ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    Tampil menempel (sticky) di paling atas layar
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Sakelar Perilaku Terpisah */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900 p-3 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 text-amber-500"
            />
            <div>
              <p className="text-xs font-black text-white">Peringatan Permanen</p>
              <p className="text-[11px] text-slate-400">
                Tetap aktif di semua sesi sampai Admin mencabutnya (Kartu Tier ADMIN tetap punya tombol X).
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900 p-3 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={showPermanentLabel}
              onChange={(e) => setShowPermanentLabel(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 text-amber-500"
            />
            <div>
              <p className="text-xs font-black text-white">Tampilkan Label &ldquo;Permanen&rdquo;</p>
              <p className="text-[11px] text-slate-400">
                Sakelar terpisah untuk menampilkan atau menyembunyikan lencana Permanen.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-900 p-3 cursor-pointer hover:border-slate-700">
            <input
              type="checkbox"
              checked={dismissible}
              onChange={(e) => setDismissible(e.target.checked)}
              className="mt-0.5 rounded border-slate-600 text-amber-500"
            />
            <div>
              <p className="text-xs font-black text-white">Bisa Ditutup Nasabah Biasa</p>
              <p className="text-[11px] text-slate-400">
                Matikan jika ingin mengunci layar nasabah biasa. Pemegang Kartu Tier ADMIN selalu bisa menutupnya.
              </p>
            </div>
          </label>
        </div>

        {/* Target Penerima */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-black text-white flex items-center gap-1.5">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Target Penerima Peringatan</span>
            </span>
            <div className="flex items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Semua Nasabah' },
                  { id: 'tiers', label: 'Per Tier Kartu' },
                  { id: 'accounts', label: 'Centang Akun Tertentu' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTargetMode(mode.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-black cursor-pointer ${
                    targetMode === mode.id
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {targetMode === 'tiers' && (
            <div className="flex flex-wrap gap-2">
              {CARD_TIERS_LIST.map((item) => {
                const selected = targetTiers.includes(item.tier);
                return (
                  <button
                    key={item.tier}
                    type="button"
                    onClick={() => handleToggleTier(item.tier)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer ${
                      selected
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {selected && <Check className="w-3.5 h-3.5" />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}

          {targetMode === 'accounts' && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={accountSearch}
                  onChange={(e) => setAccountSearch(e.target.value)}
                  placeholder="Cari nama, nomor rekening, atau ID 16 digit..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs text-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                {filteredAccounts.map((acc) => {
                  const checked = targetAccountIds.includes(acc.id);
                  return (
                    <label
                      key={acc.id}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs cursor-pointer ${
                        checked
                          ? 'bg-cyan-500/20 border-cyan-400 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleAccount(acc.id)}
                        className="rounded border-slate-600 text-cyan-500"
                      />
                      <div className="min-w-0">
                        <p className="font-bold truncate">{acc.fullName}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {acc.accountNumber}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Terpilih: <strong className="text-amber-300">{targetAccountIds.length}</strong> akun
              </p>
            </div>
          )}
        </div>

        {/* LIVE PREVIEW YANG MEMBEDAKAN POP-UP TENGAH VS BANNER ATAS */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              <span>
                Pratinjau Visual Langsung:{' '}
                {displayMode === 'popup'
                  ? 'Mode Pop-up Tengah Layar (Modal Tengah)'
                  : 'Mode Banner Atas Layar (Sticky Top Bar)'}
              </span>
            </p>
            <span className="text-[11px] text-slate-400">
              Kartu Tier ADMIN selalu melihat tombol <strong className="text-amber-300">X</strong>
            </span>
          </div>

          {displayMode === 'popup' ? (
            /* Simulasi Pop-up Tengah Layar */
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex items-center justify-center">
              <div
                className={`relative w-full max-w-md rounded-2xl border-2 ${previewTheme.bannerClass} p-4 shadow-2xl space-y-3`}
              >
                <div
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/30 border border-white/25 flex items-center justify-center"
                  title="Tanda Silang (X) Pojok Kanan Atas"
                >
                  <X className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-start gap-3 pr-8">
                  <div className={`p-2.5 rounded-xl border shrink-0 ${previewTheme.iconBgClass}`}>
                    {renderAdminWarningIcon(iconKey, 'w-5 h-5')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[9px] font-black uppercase tracking-wider opacity-85">
                        Pop-up Tengah Layar
                      </span>
                      {isPermanent && showPermanentLabel && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${previewTheme.iconBgClass}`}
                        >
                          Permanen
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-black mt-0.5">
                      {title || 'Contoh Judul Peringatan Pop-up Tengah'}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-black/20 border border-white/15 p-3 text-xs whitespace-pre-line">
                  {message || 'Isi pesan peringatan akan tampil di tengah layar nasabah...'}
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 text-[10px]">
                  <span className="opacity-85 flex items-center gap-1">
                    {!dismissible && <Lock className="w-3 h-3" />}
                    {dismissible
                      ? 'Nasabah & Admin bisa menutup'
                      : 'Terkunci bagi nasabah • Admin tetap punya X & tombol tutup'}
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-black/35 border border-white/25 font-black">
                    ✕ Tutup Pemberitahuan
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Simulasi Banner Atas Layar */
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3">
              <div
                className={`w-full rounded-xl border ${previewTheme.bannerClass} px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-md`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-1.5 rounded-lg border shrink-0 ${previewTheme.iconBgClass}`}>
                    {renderAdminWarningIcon(iconKey, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider opacity-85">
                        Banner Atas Layar (Sticky)
                      </span>
                      <span className="opacity-50 text-xs">•</span>
                      <p className="text-xs sm:text-sm font-black truncate">
                        {title || 'Contoh Judul Banner Atas'}
                      </p>
                      {isPermanent && showPermanentLabel && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${previewTheme.iconBgClass}`}
                        >
                          Permanen
                        </span>
                      )}
                    </div>
                    <p className="text-xs opacity-95 mt-0.5 truncate">
                      {message || 'Isi pesan peringatan akan tampil menempel di paling atas layar...'}
                    </p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-black/25 border border-white/25 shrink-0">
                  <X className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs sm:text-sm font-black inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            <Send className="w-4 h-4" />
            <span>
              {editingId
                ? `Simpan & Siarkan Ulang (${displayMode === 'popup' ? 'Pop-up Tengah' : 'Banner Atas'})`
                : `Kirim ke ${displayMode === 'popup' ? 'Pop-up Tengah Layar' : 'Banner Atas Layar'} Sekarang`}
            </span>
          </button>
        </div>
      </form>

      {/* Daftar Peringatan Aktif & Riwayat */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
            Daftar Peringatan Tersimpan ({adminWarnings.length})
          </h4>
          <span className="text-[11px] text-slate-400">
            Klik tombol <strong>Tukar ke Pop-up / Banner</strong> untuk mengganti posisi secara instan 1-klik
          </span>
        </div>

        {adminWarnings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-6 text-center text-xs text-slate-400">
            Belum ada peringatan sistem yang dikirim. Pilih salah satu dari 25 preset di atas atau tulis manual.
          </div>
        ) : (
          <div className="space-y-2.5">
            {adminWarnings.map((w) => {
              const wTheme = getAdminWarningThemeMeta(w.colorTheme);
              const targetSummary =
                w.targetMode === 'all'
                  ? 'Semua Nasabah'
                  : w.targetMode === 'tiers'
                  ? `Tier: ${(w.targetTiers || []).join(', ')}`
                  : `${(w.targetAccountIds || []).length} Akun Tertentu`;
              return (
                <div
                  key={w.id}
                  className={`rounded-2xl border p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                    w.isActive
                      ? 'border-amber-400/50 bg-slate-950'
                      : 'border-slate-800 bg-slate-950/50 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-xl border shrink-0 ${wTheme.iconBgClass}`}>
                      {renderAdminWarningIcon(w.iconKey, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-white">{w.title}</p>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                            w.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {w.isActive ? '● Aktif' : '○ Dicabut'}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded border ${
                            w.displayMode === 'popup'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400/50'
                              : 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                          }`}
                        >
                          {w.displayMode === 'popup' ? '🎯 Pop-up Tengah' : '📌 Banner Atas'}
                        </span>
                        {w.isPermanent && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/40">
                            Permanen {w.showPermanentLabel ? '(Label Tampil)' : '(Label Sembunyi)'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{w.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1 font-mono">
                        Target: {targetSummary} •{' '}
                        {w.dismissible
                          ? 'Bisa ditutup semua'
                          : 'Terkunci bagi nasabah (Tier ADMIN punya X)'}{' '}
                        • Versi siar #{w.resendVersion || 1}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    {/* Tombol 1-Klik Tukar Mode Pop-up Tengah <-> Banner Atas */}
                    <button
                      type="button"
                      onClick={() => handleQuickSwitchDisplayMode(w)}
                      className="px-2.5 py-1.5 rounded-xl border border-amber-400/50 bg-amber-500/15 hover:bg-amber-500/25 text-xs font-black text-amber-200 inline-flex items-center gap-1 cursor-pointer"
                      title="Tukar langsung mode tampilan antara Pop-up Tengah dan Banner Atas"
                    >
                      {w.displayMode === 'popup' ? (
                        <>
                          <PanelTop className="w-3.5 h-3.5" />
                          <span>Ubah ke Banner Atas</span>
                        </>
                      ) : (
                        <>
                          <Maximize2 className="w-3.5 h-3.5" />
                          <span>Ubah ke Pop-up Tengah</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => loadForEdit(w)}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminToggleWarningActive(w.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Power className="w-3.5 h-3.5" /> {w.isActive ? 'Cabut' : 'Aktifkan'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminResendWarning(w.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-cyan-400/50 bg-cyan-500/15 hover:bg-cyan-500/25 text-xs font-bold text-cyan-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const res = adminDeleteWarning(w.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-xl border border-rose-400/50 bg-rose-500/15 hover:bg-rose-500/25 text-xs font-bold text-rose-200 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
