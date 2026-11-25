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
  const [targetTiers, setTargetTiers] = useState<CardTier[]>(['regular', 'gold', 'premium', 'platinum']);
  const [targetAccountIds, setTargetAccountIds] = useState<string[]>([]);
  const [presetCategoryFilter, setPresetCategoryFilter] = useState<'all' | AdminWarningCategory>('all');
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
    setFeedback(`Preset "${preset.title}" dimuat ke form. Silakan ubah teks atau langsung kirim.`);
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-amber-600" />
            Studio Peringatan & Pemberitahuan Nasabah (25 Preset + Manual)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Kirim peringatan real-time ke semua nasabah, per tier kartu, atau akun tertentu dengan ikon, warna, mode pop-up/banner, dan status permanen.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg self-start sm:self-auto tabular-nums">
          Aktif: {adminWarnings.filter((w) => w.isActive).length} / {adminWarnings.length}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 text-blue-900 px-4 py-2.5 text-xs font-semibold">
          {feedback}
        </div>
      )}

      {/* 25 Preset Sistem */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            25 Preset Buatan Sistem (Klik untuk Isi Form Otomatis)
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ADMIN_WARNING_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setPresetCategoryFilter(cat.key)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                  presetCategoryFilter === cat.key
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
          {filteredPresets.map((preset) => {
            const pTheme = getAdminWarningThemeMeta(preset.colorTheme);
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyPreset(preset.id)}
                className="text-left rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/40 p-3 transition-all flex items-start gap-2.5"
              >
                <div className={`p-1.5 rounded-lg border shrink-0 ${pTheme.iconBgClass}`}>
                  {renderAdminWarningIcon(preset.iconKey, 'w-4 h-4')}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{preset.title}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {preset.message}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Manual + Editor */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900">
            {editingId ? 'Edit Peringatan Terpilih' : 'Buat / Kirim Peringatan Baru'}
          </h4>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
            >
              Batal Edit
            </button>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Judul / Nama Peringatan *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Aplikasi Sedang Dalam Perbaikan"
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Isi Pesan Peringatan *
          </label>
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tulis penjelasan lengkap peringatan yang akan tampil di layar nasabah..."
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Pilihan 16 Ikon & 6 Warna */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Pilih Ikon (16 Pilihan Vektor)
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {ADMIN_WARNING_ICON_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  title={opt.label}
                  onClick={() => setIconKey(opt.key)}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-colors ${
                    iconKey === opt.key
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {renderAdminWarningIcon(opt.key, 'w-4 h-4')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tema Warna
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {ADMIN_WARNING_THEME_OPTIONS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setColorTheme(t.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                      colorTheme === t.key
                        ? `${t.swatchClass} text-white border-transparent ring-2 ring-offset-1 ring-slate-900`
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mode Tampilan di Layar Nasabah
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDisplayMode('popup')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                    displayMode === 'popup'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Pop-up Tengah
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayMode('banner')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                    displayMode === 'banner'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Banner Atas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Sakelar Perilaku Terpisah */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Peringatan Permanen</p>
              <p className="text-[11px] text-slate-500">Tetap aktif di semua sesi sampai Admin mencabutnya.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showPermanentLabel}
              onChange={(e) => setShowPermanentLabel(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Tampilkan Label &ldquo;Permanen&rdquo;</p>
              <p className="text-[11px] text-slate-500">Sakelar terpisah untuk menampilkan/menyembunyikan tulisan Permanen.</p>
            </div>
          </label>

          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={dismissible}
              onChange={(e) => setDismissible(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <p className="text-xs font-bold text-slate-900">Bisa Ditutup Nasabah</p>
              <p className="text-[11px] text-slate-500">Matikan jika ingin mengunci layar hingga peringatan dicabut Admin.</p>
            </div>
          </label>
        </div>

        {/* Target Penerima */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              Target Penerima Peringatan
            </span>
            <div className="flex items-center gap-1.5">
              {([
                { id: 'all', label: 'Semua Nasabah' },
                { id: 'tiers', label: 'Per Tier Kartu' },
                { id: 'accounts', label: 'Centang Akun Tertentu' },
              ] as const).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setTargetMode(mode.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                    targetMode === mode.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border inline-flex items-center gap-1.5 ${
                      selected
                        ? 'bg-blue-50 border-blue-500 text-blue-800'
                        : 'bg-white border-slate-200 text-slate-600'
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
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs"
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
                          ? 'bg-blue-50 border-blue-400 text-blue-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleAccount(acc.id)}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{acc.fullName}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{acc.accountNumber}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                Terpilih: <strong className="text-slate-800">{targetAccountIds.length}</strong> akun
              </p>
            </div>
          )}
        </div>

        {/* Live Preview */}
        {(title || message) && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> Pratinjau Langsung ({displayMode === 'popup' ? 'Pop-up Tengah' : 'Banner Atas'})
            </p>
            <div className={`rounded-xl border ${previewTheme.bannerClass} p-3.5 flex items-start gap-3`}>
              <div className={`p-2 rounded-lg border shrink-0 ${previewTheme.iconBgClass}`}>
                {renderAdminWarningIcon(iconKey, 'w-4 h-4')}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-xs font-bold">{title || 'Judul Peringatan'}</p>
                  {isPermanent && showPermanentLabel && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${previewTheme.iconBgClass}`}>
                      Permanen
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 mt-0.5 whitespace-pre-line">
                  {message || 'Isi pesan peringatan...'}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            {editingId ? 'Simpan & Siarkan Ulang' : 'Kirim Peringatan Sekarang'}
          </button>
        </div>
      </form>

      {/* Daftar Peringatan Aktif & Riwayat */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Daftar Peringatan Tersimpan ({adminWarnings.length})
        </h4>
        {adminWarnings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
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
                  className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    w.isActive
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-200/70 bg-slate-50 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg border shrink-0 ${wTheme.iconBgClass}`}>
                      {renderAdminWarningIcon(w.iconKey, 'w-4 h-4')}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-slate-900">{w.title}</p>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            w.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                        >
                          {w.isActive ? 'Aktif' : 'Dicabut'}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {w.displayMode === 'popup' ? 'Pop-up' : 'Banner'}
                        </span>
                        {w.isPermanent && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Permanen {w.showPermanentLabel ? '(Label Tampil)' : '(Label Sembunyi)'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{w.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Target: {targetSummary} • {w.dismissible ? 'Bisa ditutup' : 'Kunci layar'} • Versi siar #{w.resendVersion || 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button
                      type="button"
                      onClick={() => loadForEdit(w)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminToggleWarningActive(w.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 inline-flex items-center gap-1"
                    >
                      <Power className="w-3.5 h-3.5" /> {w.isActive ? 'Cabut' : 'Aktifkan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminResendWarning(w.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-xs font-semibold text-blue-700 inline-flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Kirim Ulang
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = adminDeleteWarning(w.id);
                        setFeedback(res.message);
                      }}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 inline-flex items-center gap-1"
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
